import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { RADII } from '../src/games/dragonMerge/levels.ts'

const root = new URL('../src/games/dragonMerge/', import.meta.url)
const source = readFileSync(new URL('assets.ts', root), 'utf8')
for (const variant of ['dragon', 'frog']) {
  const mappings = source.match(new RegExp(`const ${variant}Levels = levels\\(\\s*\\[([^\\]]+)\\]`))[1].split(',').map(s => s.trim())
  assert.equal(mappings.length, RADII.length)
  assert.equal(new Set(mappings).size, RADII.length, 'Every tier must use a different image import')
  const hashes = new Set()
  for (const [i, mapping] of mappings.entries()) {
    assert.equal(mapping, `${variant}${i}`, 'Tier indices remain stable for existing saves')
    const data = readFileSync(new URL(`images/${variant}-${i}.jpg`, root))
    assert.equal(data.readUInt16BE(0), 0xffd8, 'Asset must be a JPEG, not an error page')
    hashes.add(createHash('sha256').update(data).digest('hex'))
  }
  assert.equal(hashes.size, RADII.length, 'Different filenames must not hide identical image files')
}
console.log('Both merge variants have 13 distinct local JPEGs; tier indices are unchanged.')
