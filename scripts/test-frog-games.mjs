// Run: node --experimental-strip-types scripts/test-frog-games.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as link from '../src/games/frogLink/logic.ts'
import * as blocks from '../src/games/frogBlocks/logic.ts'

const rng = seed => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
const blank = () => Array(link.COLS * link.ROWS).fill(-1)
function assertPath(board, a, b, expectedTurns) {
  const path = link.connection(board, a, b)
  assert(path, `${a} -> ${b} must connect`)
  assert.equal(path.length - 2, expectedTurns)
  assert.deepEqual(path[0], { x: a % link.COLS + 1, y: Math.floor(a / link.COLS) + 1 })
  assert.deepEqual(path.at(-1), { x: b % link.COLS + 1, y: Math.floor(b / link.COLS) + 1 })
  for (let i = 1; i < path.length; i++) {
    const p = path[i - 1], q = path[i]
    assert(p.x === q.x || p.y === q.y)
    const dx = Math.sign(q.x - p.x), dy = Math.sign(q.y - p.y)
    let x = p.x, y = p.y
    while (x !== q.x || y !== q.y) {
      x += dx; y += dy
      if (x > 0 && x <= link.COLS && y > 0 && y <= link.ROWS) {
        const index = (y - 1) * link.COLS + x - 1
        if (index !== a && index !== b) assert.equal(board[index], -1)
      }
    }
  }
  assert.deepEqual(link.connection(board, b, a)?.at(-1), path[0])
}
let board = blank(); board[0] = board[5] = 0; assertPath(board, 0, 5, 0)
board = blank(); board[7] = board[22] = 1; assertPath(board, 7, 22, 1)
board = Array(48).fill(1); board[0] = board[5] = 0; assertPath(board, 0, 5, 2)
board = Array(48).fill(1); board[0] = board[42] = 0; assertPath(board, 0, 42, 2)
board = Array(48).fill(1); board[7] = board[28] = 0; assert.equal(link.connection(board, 7, 28), null)
board = blank(); board[0] = 1; board[1] = 2; assert.equal(link.connection(board, 0, 1), null)
assert.equal(link.connection(board, 0, 0), null)

// Independent direction-state search cross-checks all 0/1/2-turn path cases.
function oracle(board, a, b) {
  if (a === b || board[a] < 0 || board[a] !== board[b]) return false
  const width = link.COLS + 2, height = link.ROWS + 2
  const start = (Math.floor(a / link.COLS) + 1) * width + a % link.COLS + 1
  const end = (Math.floor(b / link.COLS) + 1) * width + b % link.COLS + 1
  const steps = [[1, 0], [-1, 0], [0, 1], [0, -1]], queue = []
  const costs = Array(width * height * 4).fill(Infinity)
  for (let d = 0; d < 4; d++) { queue.push([start, d, 0]); costs[start * 4 + d] = 0 }
  for (let i = 0; i < queue.length; i++) {
    const [position, direction, turns] = queue[i]
    for (let d = 0; d < 4; d++) {
      const n = turns + (d === direction ? 0 : 1)
      if (n > 2) continue
      const x = position % width + steps[d][0], y = Math.floor(position / width) + steps[d][1]
      if (x < 0 || x >= width || y < 0 || y >= height) continue
      const next = y * width + x
      if (next === end) return true
      const index = (y - 1) * link.COLS + x - 1
      if (x > 0 && x <= link.COLS && y > 0 && y <= link.ROWS && index !== a && board[index] >= 0) continue
      if (costs[next * 4 + d] <= n) continue
      costs[next * 4 + d] = n; queue.push([next, d, n])
    }
  }
  return false
}
for (let seed = 1; seed <= 100; seed++) {
  const random = rng(seed), s = link.fresh(random)
  assert(link.validSave(s)); assert(link.findPair(s.board))
  assert.equal(new Set(s.board).size, 8)
  const original = [...s.board].sort()
  assert.deepEqual(link.reshuffle(s.board, random).sort(), original)
  let removed = 0
  while (s.board.some(v => v >= 0)) {
    let pair = link.findPair(s.board)
    if (!pair) { s.board = link.reshuffle(s.board, random); pair = link.findPair(s.board) }
    assert(pair); assert(oracle(s.board, ...pair))
    s.board[pair[0]] = s.board[pair[1]] = -1; s.started = true; removed += 2
    assert(link.validSave(s))
  }
  assert.equal(removed, 48)
  const test = Array.from({ length: 48 }, () => random() < .5 ? -1 : Math.floor(random() * 3))
  for (let i = 0; i < 30; i++) {
    const a = Math.floor(random() * 48), b = Math.floor(random() * 48)
    assert.equal(Boolean(link.connection(test, a, b)), oracle(test, a, b), `link oracle seed ${seed}, ${a}/${b}`)
  }
}
assert(!link.validSave({ board: [], elapsed: 0, started: false }))
assert(!link.validSave({ board: Array(48).fill(0).map((v, i) => i === 0 ? 1 : v), elapsed: 0, started: true }))
assert(!link.validSave({ ...link.fresh(), elapsed: -1 }))
console.log('Link: straight/L/U/outside routes, blockers, 3,000 oracle checks, 100 cleared boards, saves passed')

const allEmpty = s => s.board.every(v => v === null)
let s = blocks.fresh(rng(1))
assert(blocks.validSave(s)); assert(blocks.fits(s)); assert(allEmpty(s))
const sequence = [s.active.kind, ...s.next]
assert.equal(sequence.length, 14)
assert.equal(new Set(sequence.slice(0, 7)).size, 7)
assert.equal(new Set(sequence.slice(7)).size, 7)
for (const kind of blocks.KINDS) {
  s = blocks.fresh(rng(3)); s.active = { kind, x: 3, y: 10, rotation: 0 }
  const start = blocks.cells(s.active)
  for (let i = 0; i < 4; i++) blocks.rotate(s, 1)
  assert.deepEqual(blocks.cells(s.active), start)
  assert.equal(blocks.cells(s.active).length, 4)
}
// A vertical I at the wall needs its two-column kick to turn flat.
s = blocks.fresh(); s.active = { kind: 'I', rotation: 1, x: -2, y: 10 }
assert(blocks.fits(s)); assert(blocks.rotate(s, -1)); assert.equal(s.active.x, 0); assert(blocks.fits(s))
// A horizontal T on the floor rotates upward rather than through the floor.
s = blocks.fresh(); s.active = { kind: 'T', rotation: 0, x: 3, y: 22 }
assert(blocks.fits(s)); assert(blocks.rotate(s, 1)); assert.equal(s.active.y, 21); assert(blocks.fits(s))
// Holding cannot be repeated before the next piece is locked; held rotation resets.
s = blocks.fresh(rng(3)); const original = s.active.kind
assert(blocks.hold(s, rng(4))); assert.equal(s.hold, original)
assert(!blocks.hold(s)); blocks.hardDrop(s); assert(blocks.hold(s)); assert.equal(s.active.kind, original)
assert.equal(s.active.rotation, 0); assert.equal(s.active.y, blocks.HIDDEN - 1)
// Landing projection stops at both floor and floating blocks, never tunnels.
s = blocks.fresh(); s.active = { kind: 'O', rotation: 0, x: 3, y: 4 }
s.board[15 * 10 + 4] = 'J'; assert.equal(blocks.landing(s).y, 13)
assert.equal(blocks.hardDrop(s), 9); assert.equal(s.score, 18); assert.equal(s.board[14 * 10 + 4], 'O')
// Multi-line clears shift complete rows only. No per-cell gravity.
for (let count = 1; count <= 4; count++) {
  s = blocks.fresh(); s.active = { kind: 'I', rotation: 1, x: 2, y: 20 }
  for (let y = 24 - count; y < 24; y++) for (let x = 0; x < 10; x++) if (x !== 4) s.board[y * 10 + x] = 'J'
  s.board[10 * 10] = 'T'
  assert.equal(blocks.lock(s), count)
  assert.equal(s.lines, count); assert.equal(s.score, [0, 100, 300, 500, 800][count])
  assert.equal(s.board[(10 + count) * 10], 'T'); assert(blocks.validSave(s))
}
// Touchdown has a 500ms lock delay. Failed moves do not reset it.
s = blocks.fresh(); s.active = { kind: 'O', rotation: 0, x: -1, y: 22 }
assert(blocks.grounded(s)); blocks.tick(s, 490); assert(allEmpty(s))
assert(!blocks.move(s, -1)); blocks.tick(s, 10); assert(!allEmpty(s))
// Fifteen successful grounded resets are the limit.
s = blocks.fresh(); s.active = { kind: 'O', rotation: 0, x: 3, y: 22 }
for (let i = 0; i < 15; i++) { blocks.tick(s, 100); assert(blocks.move(s, i % 2 ? 1 : -1)) }
assert.equal(s.lockResets, 15)
blocks.tick(s, 490); assert(blocks.move(s, 1)); blocks.tick(s, 10); assert(!allEmpty(s))
// Block-out and fully-hidden lock-out are game over; a partly visible lock is allowed.
s = blocks.fresh(); s.hold = 'O'; s.board[3 * 10 + 4] = 'J'; blocks.hold(s); assert(s.over); assert(blocks.validSave(s))
s = blocks.fresh(); s.active = { kind: 'O', rotation: 0, x: 0, y: 1 }; blocks.lock(s); assert(s.over)
s = blocks.fresh(); s.active = { kind: 'O', rotation: 0, x: 0, y: 3 }; blocks.lock(s); assert(!s.over)
// Same elapsed simulation, whether one large tick or many display frames.
const a = blocks.fresh(rng(5)), b = structuredClone(a)
blocks.tick(a, 2000, false, rng(6)); for (let i = 0; i < 200; i++) blocks.tick(b, 10, false, rng(6))
assert.deepEqual(a, b)
// The queue stays seven-bag balanced across refills, not just on the opening screen.
s = blocks.fresh(rng(28)); const generated = []
for (let n = 0; n < 210; n++) {
  generated.push(s.active.kind)
  blocks.hardDrop(s, rng(28 + n))
  s.board.fill(null)
}
for (let n = 0; n < generated.length; n += 7) assert.equal(new Set(generated.slice(n, n + 7)).size, 7)
// Back-to-back, combo and perfect-clear rewards use the level before the clear.
s = blocks.fresh(); s.active = { kind: 'I', rotation: 1, x: 2, y: 20 }; s.lines = 9; s.backToBack = true; s.combo = 0
for (let y = 20; y < 24; y++) for (let x = 0; x < 10; x++) if (x !== 4) s.board[y * 10 + x] = 'J'
assert.equal(blocks.lock(s), 4); assert.equal(s.score, 800 * 1.5 + 50 + 3200); assert.equal(blocks.level(s), 2)
s = blocks.fresh(); s.active = { kind: 'I', rotation: 1, x: 2, y: 20 }; s.backToBack = true; s.combo = 2
for (let x = 0; x < 10; x++) if (x !== 4) s.board[23 * 10 + x] = 'J'
blocks.lock(s); assert.equal(s.backToBack, false); assert.equal(s.score, 250)
// T-spin three-corner detection, mini/full and rotation-to-translation cancellation.
for (const [front, lastAction, expected] of [[true, 'rotate', 400], [false, 'rotate', 100], [true, 'move', 0]]) {
  s = blocks.fresh(); s.active = { kind: 'T', rotation: 0, x: 3, y: 10 }; s.lastAction = lastAction
  for (const [x, y] of (front ? [[3,10],[5,10],[3,12]] : [[3,10],[3,12],[5,12]])) s.board[y * 10 + x] = 'J'
  blocks.lock(s); assert.equal(s.score, expected)
}
for (const [fall, expected] of [[() => blocks.softDrop(s), 401], [() => blocks.tick(s, 1000), 400]]) {
  s = blocks.fresh(); s.active = { kind: 'T', rotation: 0, x: 3, y: 10 }; s.lastAction = 'rotate'
  fall()
  assert.equal(s.lastAction, 'rotate')
  const y = s.active.y
  for (const [x, dy] of [[3,0],[5,0],[3,2]]) s.board[(y + dy) * 10 + x] = 'J'
  blocks.lock(s); assert.equal(s.score, expected)
}
// Stress movement, kicks, hold, drops, save round trips and independent landing check.
for (let seed = 1; seed <= 100; seed++) {
  const random = rng(seed); s = blocks.fresh(random)
  let drops = 0
  while (!s.over && drops < 150) {
    for (let i = 0; i < 8; i++) {
      if (random() < .3) blocks.rotate(s, random() < .5 ? -1 : 1)
      else blocks.move(s, random() < .5 ? -1 : 1)
      assert(blocks.fits(s)); assert(blocks.validSave(s))
    }
    if (random() < .15) blocks.hold(s, random)
    if (s.over) break
    const ghost = blocks.landing(s)
    assert(blocks.fits(s, ghost)); assert(!blocks.fits(s, { ...ghost, y: ghost.y + 1 }))
    blocks.hardDrop(s, random); drops++
    assert(blocks.validSave(JSON.parse(JSON.stringify(s))), `save failure seed ${seed}, drop ${drops}`)
  }
  assert(s.over || drops === 150)
}
for (const patch of [{ next: [] }, { score: NaN }, { lockResets: 16 }, { active: { kind: 'Q', x: 0, y: 0, rotation: 0 } }, { fallMs: Infinity }]) assert(!blocks.validSave({ ...blocks.fresh(), ...patch }))
// The two supplied files are distinct and unchanged. The filled image is clipped, not tiled.
const vue = readFileSync(new URL('../src/games/frogBlocks/GameFrogBlocks.vue', import.meta.url), 'utf8')
assert(vue.includes(':href="smiling"')); assert(vue.includes(':href="sideEye"')); assert(vue.includes(':clip-path="`url(#${clipId})`"'))
assert.equal((vue.match(/<image /g) ?? []).length, 2)
assert(!vue.includes('background-size'))
assert.notDeepEqual(readFileSync(new URL('../src/games/frogArt/images/side-eye.png', import.meta.url)), readFileSync(new URL('../src/games/frogArt/images/smiling.png', import.meta.url)))
console.log('Blocks: 7-bag, four rotations, SRS wall/floor kicks, hold, ghost, drop, clears, lock delay/cap, top-out, T-spins, 100 stress games, saves, image masks passed')
