import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import anchor from 'markdown-it-anchor'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
  breaks: true,
  highlight(str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch { /* ignore */ }
    }
    return ''
  },
}).use(anchor, {
  level: [2, 3],
  permalink: false,
})

// Override image renderer to add loading="lazy" and resolve relative paths
const defaultImageRender = md.renderer.rules.image!
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const src = token.attrGet('src') || ''
  token.attrSet('loading', 'lazy')
  // Resolve relative image paths to the markdown file's category directory
  if (src && !src.startsWith('http') && !src.startsWith('/')) {
    const category = (env as any)?.category || ''
    const prefix = category ? `/markdown/${category}` : '/markdown'
    token.attrSet('src', `${prefix}/${src}`)
  }
  return defaultImageRender(tokens, idx, options, env, self)
}

// Override link renderer to handle .md → route conversion
const defaultLinkRender = md.renderer.rules.link_open
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const href = token.attrGet('href') || ''

  // Add .start-link class to "开始 >>" entry links
  const nextToken = tokens[idx + 1]
  if (nextToken && nextToken.type === 'text' && nextToken.content.includes('开始')) {
    const existing = token.attrGet('class') || ''
    token.attrSet('class', (existing + ' start-link').trim())
  }

  if (href && href.endsWith('.md')) {
    const clean = href.replace(/\.md$/, '').replace(/^\.?\//, '')
    const category = (env as any)?.category || ''
    const prefix = category ? `/${category}` : ''
    token.attrSet('href', `${prefix}/${clean}`)
  }
  if (defaultLinkRender) {
    return defaultLinkRender(tokens, idx, options, env, self)
  }
  return self.renderToken(tokens, idx, options)
}

// Wrap code blocks with copy button
const defaultFenceRender = md.renderer.rules.fence!
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const lang = token.info.trim().split(/\s+/g)[0] || ''
  const code = token.content

  let highlighted: string
  if (lang && hljs.getLanguage(lang)) {
    try {
      highlighted = hljs.highlight(code, { language: lang }).value
    } catch {
      highlighted = md.utils.escapeHtml(code)
    }
  } else {
    highlighted = md.utils.escapeHtml(code)
  }

  const langLabel = lang || 'text'

  return `<div class="code-block-wrapper">
    <div class="code-block-header">
      <span class="code-lang">${langLabel}</span>
      <button class="copy-btn" type="button">复制</button>
    </div>
    <pre><code class="hljs${lang ? ' language-' + lang : ''}">${highlighted}</code></pre>
  </div>`
}

const defaultCodeBlockRender = md.renderer.rules.code_block!
md.renderer.rules.code_block = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const code = token.content
  const highlighted = md.utils.escapeHtml(code)

  return `<div class="code-block-wrapper">
    <div class="code-block-header">
      <span class="code-lang">text</span>
      <button class="copy-btn" type="button">复制</button>
    </div>
    <pre><code>${highlighted}</code></pre>
  </div>`
}

// Wrap tables in a scrollable container for mobile
const defaultTableOpenRender = md.renderer.rules.table_open!
md.renderer.rules.table_open = (tokens, idx, options, env, self) => {
  return '<div class="table-wrapper">' + defaultTableOpenRender(tokens, idx, options, env, self)
}
const defaultTableCloseRender = md.renderer.rules.table_close!
md.renderer.rules.table_close = (tokens, idx, options, env, self) => {
  return defaultTableCloseRender(tokens, idx, options, env, self) + '</div>'
}

/**
 * Parse markdown string to HTML.
 * Pass optional `category` (notes/thoughts/images/tools) to resolve relative image paths.
 */
export function parseMarkdown(content: string, category?: string): string {
  return md.render(content, { category })
}

export default md
