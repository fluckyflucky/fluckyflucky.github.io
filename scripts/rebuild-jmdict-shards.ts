import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

type CompactSense = { p: string[]; e: string[]; z: string[] }
type CompactExample = { j: string; c: string }
type CompactEntry = {
  k: string[]
  r: string[]
  o: string[]
  s: CompactSense[]
  x: CompactExample[]
}

type KanjiMap = Record<string, string[]>

const repoRoot = process.cwd()
const jmdictDir = path.join(repoRoot, 'public', 'jmdict')
const shardDir = path.join(jmdictDir, 'ro')
const examplesDir = path.join(jmdictDir, 'examples')
const kanjiMapPath = path.join(jmdictDir, 'kanji-map.json')

const EXAMPLES_PER_SHARD = 100

const prefixLen = parsePrefixLength(process.argv[2])

function parsePrefixLength(arg?: string): number {
  const value = Number(arg ?? '3')
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`invalid prefix length: ${arg ?? ''}`)
  }
  return value
}

function normalizeRomaji(text: string): string {
  return text.toLowerCase().replace(/[^a-z]/g, '')
}

function getPrefixes(entry: CompactEntry): string[] {
  return [...new Set(
    entry.o
      .map(normalizeRomaji)
      .map(value => value.slice(0, Math.min(value.length, prefixLen)))
      .filter(Boolean),
  )]
}

function getEntryKey(entry: CompactEntry): string {
  return `${entry.k.join(',')}|${entry.r.join(',')}`
}

function getKanjiChars(entry: CompactEntry): string[] {
  const chars = new Set<string>()
  for (const word of entry.k) {
    for (const ch of word) {
      if (/^[\p{Script=Han}]$/u.test(ch)) chars.add(ch)
    }
  }
  return [...chars]
}

async function readJSON<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T
}

async function loadEntries(): Promise<CompactEntry[]> {
  const fileNames = (await readdir(shardDir))
    .filter(name => name.endsWith('.json'))
    .sort()

  const seen = new Set<string>()
  const entries: CompactEntry[] = []

  for (const fileName of fileNames) {
    const filePath = path.join(shardDir, fileName)
    const shard = await readJSON<CompactEntry[]>(filePath)
    for (const entry of shard) {
      const key = getEntryKey(entry)
      if (seen.has(key)) continue
      seen.add(key)
      entries.push(entry)
    }
  }

  return entries
}

async function rebuild(): Promise<void> {
  const entries = await loadEntries()
  const shardMap = new Map<string, CompactEntry[]>()
  const kanjiMap = new Map<string, Set<string>>()
  const exampleEntries = entries.filter(entry => entry.x.length > 0)

  for (const entry of entries) {
    const prefixes = getPrefixes(entry)

    for (const prefix of prefixes) {
      const list = shardMap.get(prefix)
      if (list) list.push(entry)
      else shardMap.set(prefix, [entry])
    }

    const kanjiChars = getKanjiChars(entry)
    if (kanjiChars.length === 0 || prefixes.length === 0) continue

    for (const ch of kanjiChars) {
      let set = kanjiMap.get(ch)
      if (!set) {
        set = new Set<string>()
        kanjiMap.set(ch, set)
      }
      for (const prefix of prefixes) set.add(prefix)
    }
  }

  await rm(shardDir, { recursive: true, force: true })
  await mkdir(shardDir, { recursive: true })

  const sortedPrefixes = [...shardMap.keys()].sort()
  for (const prefix of sortedPrefixes) {
    const filePath = path.join(shardDir, `${prefix}.json`)
    await writeFile(filePath, JSON.stringify(shardMap.get(prefix)), 'utf8')
  }

  const kanjiMapObj: KanjiMap = {}
  for (const [ch, prefixes] of [...kanjiMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    kanjiMapObj[ch] = [...prefixes].sort()
  }

  await writeFile(kanjiMapPath, JSON.stringify(kanjiMapObj), 'utf8')

  await rm(examplesDir, { recursive: true, force: true })
  await mkdir(examplesDir, { recursive: true })

  const shardCount = Math.ceil(exampleEntries.length / EXAMPLES_PER_SHARD)
  for (let i = 0; i < shardCount; i++) {
    const slice = exampleEntries.slice(i * EXAMPLES_PER_SHARD, (i + 1) * EXAMPLES_PER_SHARD)
    await writeFile(path.join(examplesDir, `${i}.json`), JSON.stringify(slice), 'utf8')
  }
  await writeFile(path.join(examplesDir, 'meta.json'), JSON.stringify({ count: shardCount }), 'utf8')

  console.log(`rebuilt ${entries.length} entries`)
  console.log(`prefix length: ${prefixLen}`)
  console.log(`shards: ${sortedPrefixes.length}`)
  console.log(`example entries: ${exampleEntries.length} (${shardCount} shards)`)
}

rebuild().catch(error => {
  console.error(error)
  process.exit(1)
})
