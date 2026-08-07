import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

const VIRTUAL_MODULE_ID = 'virtual:markdown-index'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID
const ARTICLE_FILENAME_RE = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/

interface ArticleItem {
  text: string
  link: string
  date: string
}

interface CategoryData {
  text: string
  items: ArticleItem[]
}

function isValidIsoDate(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

export function markdownIndexPlugin(): Plugin {
  // process.cwd() is the project root when running under Vite
  const rootDir = process.cwd()

  function scanCategories(): Record<string, CategoryData> {
    const markdownRoot = path.resolve(rootDir, 'public/markdown')
    const categories: Record<string, CategoryData> = {}

    if (!fs.existsSync(markdownRoot)) return categories

    for (const catDir of fs.readdirSync(markdownRoot, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!catDir.isDirectory()) continue

      const catName = catDir.name
      const catPath = path.join(markdownRoot, catName)
      const indexFile = `${catName}.md`

      const items: ArticleItem[] = []

      for (const file of fs.readdirSync(catPath).sort()) {
        if (!file.endsWith('.md')) continue
        if (file === indexFile) continue // skip the index page itself

        const filePath = path.join(catPath, file)
        const match = file.match(ARTICLE_FILENAME_RE)
        if (!match || !isValidIsoDate(match[1])) {
          throw new Error(
            `[markdown-index] Invalid article filename "${path.relative(rootDir, filePath)}". `
            + 'Expected YYYY-MM-DD-slug.md.',
          )
        }

        const [, date, slug] = match

        let title = slug
        try {
          const content = fs.readFileSync(filePath, 'utf-8')
          const match = content.match(/^# (.+)$/m)
          if (match) title = match[1]
        } catch {
          // skip unreadable files
        }

        items.push({ text: title, link: `/${catName}/${date}-${slug}`, date })
      }

      items.sort((a, b) => b.date.localeCompare(a.date) || a.link.localeCompare(b.link))

      if (items.length === 0) continue

      // Read the index file to get the category display name
      let groupText = catName
      const indexPath = path.join(catPath, indexFile)
      if (fs.existsSync(indexPath)) {
        try {
          const indexContent = fs.readFileSync(indexPath, 'utf-8')
          const m = indexContent.match(/^# (.+)$/m)
          if (m) groupText = m[1]
        } catch {
          // fall through
        }
      }

      categories[`/${catName}`] = { text: groupText, items }
    }

    return categories
  }

  return {
    name: 'markdown-index',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const categories = scanCategories()
        return `export const categories = ${JSON.stringify(categories)}`
      }
    },
    // HMR: re-scan when markdown files change
    configureServer(server) {
      const markdownRoot = path.resolve(rootDir, 'public/markdown')
      server.watcher.add(markdownRoot)
      server.watcher.on('all', (_event, filePath) => {
        const rel = path.relative(markdownRoot, filePath)
        if (rel && !rel.startsWith('..') && filePath.endsWith('.md')) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID)
          if (mod) {
            server.moduleGraph.invalidateModule(mod)
            server.ws.send({ type: 'full-reload' })
          }
        }
      })
    },
  }
}
