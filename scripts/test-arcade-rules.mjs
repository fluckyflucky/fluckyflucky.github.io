import assert from 'node:assert/strict'
import { moveBoard, spawnTile, canMove, isValidBoard } from '../src/games/game2048/logic.ts'
import { SIZE, adjacent, createBoard, findMatches, findMove, collapseBoard, validBoard } from '../src/games/match3/logic.ts'
import { fresh, numbers, reveal, chord, hint, validMine } from '../src/games/mines/logic.ts'

const random = seed => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32 }
const sum = values => values.reduce((a, b) => a + b, 0)
const indices = (direction, line) => Array.from({ length: 4 }, (_, p) => direction === 'left' ? line * 4 + p
  : direction === 'right' ? line * 4 + 3 - p : direction === 'up' ? p * 4 + line : (3 - p) * 4 + line)

// Every 4-cell line, including [2,2,2,2], [2,2,4,0] and separated pairs.
let lines = 0
for (let code = 0; code < 5 ** 4; code++) {
  let n = code
  const line = Array.from({ length: 4 }, () => { const value = [0, 2, 4, 8, 16][n % 5]; n = Math.floor(n / 5); return value })
  const queue = line.filter(Boolean), expected = []
  let score = 0
  while (queue.length) {
    const value = queue.shift()
    if (queue[0] === value) { queue.shift(); expected.push(value * 2); score += value * 2 }
    else expected.push(value)
  }
  while (expected.length < 4) expected.push(0)
  for (const direction of ['left', 'right', 'up', 'down']) {
    const board = Array(16).fill(0), cells = indices(direction, 1)
    cells.forEach((cell, p) => { board[cell] = line[p] })
    const result = moveBoard(board, direction)
    assert.deepEqual(cells.map(i => result.board[i]), expected)
    assert.equal(result.score, score)
    assert.equal(sum(result.board), sum(board))
    assert.equal(result.changed, board.some((v, i) => v !== result.board[i]))
    assert.deepEqual(cells.map(i => board[i]), line)
    lines++
  }
}
for (let seed = 1; seed <= 500; seed++) {
  const rng = random(seed), board = Array.from({ length: 16 }, () => [2, 4, 8, 16][Math.floor(rng() * 4)])
  assert.equal(canMove(board), ['left', 'right', 'up', 'down'].some(d => moveBoard(board, d).changed))
  const withEmpty = [...board]; withEmpty[7] = 0
  const spawned = spawnTile(withEmpty, rng)
  assert.equal(spawned.index, 7)
  assert([2, 4].includes(spawned.board[7]))
  assert(isValidBoard(spawned.board))
  assert.deepEqual(spawnTile(board, rng), { board, index: -1 })
}
const thresholdRng = value => { let calls = 0; return () => calls++ ? value : 0 }
assert.equal(spawnTile(Array(16).fill(0), thresholdRng(.899999)).board[0], 2)
assert.equal(spawnTile(Array(16).fill(0), thresholdRng(.9)).board[0], 4)
console.log(`2048: ${lines} directional line cases, one-merge limit, material/score, spawn threshold and 500 full boards passed.`)

assert(!adjacent(5, 6), 'Row wrapping is not an adjacent swap')
for (const value of [0, .999]) assert(findMove(createBoard(() => value)))
const cross = Array.from({ length: 36 }, (_, i) => (Math.floor(i / 6) * 2 + i % 6) % 5)
for (const i of [8, 14, 20, 13, 15]) cross[i] = 4
cross[12] = 3
assert.deepEqual([...findMatches(cross)].sort((a, b) => a - b), [8, 13, 14, 15, 20])
for (let seed = 1; seed <= 500; seed++) {
  const rng = random(seed), board = createBoard(rng), original = [...board]
  assert(validBoard(board))
  const [a, b] = findMove(board)
  assert(adjacent(a, b))
  ;[board[a], board[b]] = [board[b], board[a]]
  const removed = findMatches(board)
  assert(removed.has(a) || removed.has(b))
  const collapsed = collapseBoard(board, removed, rng)
  assert.equal(collapsed.added.length, removed.size)
  assert.equal(collapsed.placements.length + collapsed.added.length, 36)
  assert.equal(new Set([...collapsed.placements.map(p => p.to), ...collapsed.added.map(p => p.index)]).size, 36)
  assert(collapsed.board.every(type => Number.isInteger(type) && type >= 0 && type < 5))
  for (let col = 0; col < SIZE; col++) {
    const survivors = Array.from({ length: SIZE }, (_, row) => row * SIZE + col).filter(i => !removed.has(i))
    assert.deepEqual(collapsed.board.filter((_, i) => i % SIZE === col).slice(SIZE - survivors.length), survivors.map(i => board[i]))
  }
  assert.deepEqual(original, createBoard(random(seed)), 'Seeded board generation must be reproducible')
}
console.log('Match3: 500 match-free playable boards, cross matches, swap adjacency and stable downward collapse passed.')

// A flagged non-mine does not become a proof. Incorrect flags can lose a chord.
const board = numbers([0, 8, 27, 26, 36, 44, 54, 62, 72, 80], 9, 9)
const started = () => Object.assign(fresh(), { board: [...board], first: 10, status: 'playing' })
const wrongFlag = started()
reveal(wrongFlag, 10)
wrongFlag.flags[1] = 1
const proposed = hint(wrongFlag)
if (proposed) assert.equal(board[proposed.cell] === -1, proposed.mine)
chord(wrongFlag, 10)
assert.equal(wrongFlag.status, 'lost')
assert.equal(wrongFlag.hit, 0)
assert(validMine(wrongFlag))
assert(!validMine({ ...wrongFlag, hit: 1 }))
assert(!validMine({ ...started(), status: 'won' }))
const correctFlag = started()
reveal(correctFlag, 10); correctFlag.flags[0] = 1; chord(correctFlag, 10)
assert.notEqual(correctFlag.status, 'lost')
assert(correctFlag.opened[1])
const won = started()
for (let i = 0; i < 81; i++) if (board[i] >= 0) reveal(won, i)
assert.equal(won.status, 'won'); assert(validMine(won))
const floodFlag = started(); floodFlag.flags[30] = 1; reveal(floodFlag, 31)
assert.equal(floodFlag.opened[30], 0)
assert(validMine(fresh()))
assert(!validMine(null)); assert(!validMine({ ...fresh(), first: 4 }))
console.log('Mines: chord, incorrect flag loss, honest hints, flood/flag isolation and finished-save consistency passed.')
