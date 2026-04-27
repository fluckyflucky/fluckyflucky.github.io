import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, basename } from 'path'

const SONGS_DIR = join(__dirname, '../../n-buna-RAG/songs')
const OUTPUT = join(__dirname, '../markdown/public/lyrics.json')

interface LyricPair {
  ja: string
  zh: string
  song: string
}

const timestampRe = /^\[\d{2}:\d{2}\.\d{2,3}\]/

function parseLrc(content: string, songName: string): LyricPair[] {
  const lines = content.split('\n').filter(l => l.trim())
  const pairs: LyricPair[] = []

  for (let i = 0; i < lines.length - 1; i += 2) {
    const jaLine = lines[i]
    const zhLine = lines[i + 1]
    if (!timestampRe.test(jaLine) || !timestampRe.test(zhLine)) continue

    const ja = jaLine.replace(timestampRe, '').trim()
    const zh = zhLine.replace(timestampRe, '').trim()

    // skip empty, too short, or lines that look like song title/artist
    if (!ja || !zh || ja.length < 4 || zh.length < 4) continue
    if (ja.includes(' - ') && ja.includes('ヨルシカ')) continue

    pairs.push({ ja, zh, song: songName })
  }
  return pairs
}

const files = readdirSync(SONGS_DIR).filter(f => f.endsWith('.lrc'))
const allLyrics: LyricPair[] = []

for (const file of files) {
  const songName = basename(file, '.lrc').split(' - ')[0]
  const content = readFileSync(join(SONGS_DIR, file), 'utf-8')
  allLyrics.push(...parseLrc(content, songName))
}

writeFileSync(OUTPUT, JSON.stringify(allLyrics, null, 0), 'utf-8')
console.log(`Parsed ${files.length} songs, ${allLyrics.length} lyric pairs → ${OUTPUT}`)
