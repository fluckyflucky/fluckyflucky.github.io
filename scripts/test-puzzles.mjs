import assert from 'node:assert/strict'
import { levels, holes, freshState, hint as screwHint, relocate, accessible, validState as validScrews } from '../src/games/screws/logic.ts'
import { mazes, reachablePaint, paintableFromEveryStop, slide, directions, move, hint as mazeHint, validState as validMaze } from '../src/games/paintMaze/logic.ts'
import { layouts as mazeLayouts } from '../src/games/paintMaze/levels.ts'
import { readProgress } from '../src/games/shared/puzzleProgress.ts'

assert.equal(levels.length, 40)
assert.equal(new Set(levels.map(l => JSON.stringify(l.plates.map(p => [p.a, p.b]).sort((a,b) => a[0]-b[0] || a[1]-b[1])))).size, 40, 'Screw layouts must be distinct')
for (const [index, level] of levels.entries()) {
  let state = freshState(level)
  assert(validScrews(level, state))
  assert.equal(relocate(level, state, state.screws[0], state.screws[0]), null)
  assert.equal(relocate(level, state, 0, 1), null)
  const buried = state.screws.find(h => !accessible(level, state, h))
  if (buried !== undefined) assert.equal(relocate(level, state, buried, 0), null)
  let count = 0
  while (state.removed.length < level.plates.length && count++ < 100) {
    const action = screwHint(level, state)
    assert(action, `Screws ${index + 1}: no solution hint`)
    const old = structuredClone(state)
    const next = relocate(level, state, ...action)
    assert(next)
    assert.deepEqual(state, old, 'Moves must not mutate undo snapshots')
    assert.equal(next.screws.length, level.screws.length)
    assert(next.removed.length >= state.removed.length)
    assert(validScrews(level, JSON.parse(JSON.stringify(next))))
    state = next
  }
  assert.equal(state.removed.length, level.plates.length, `Screws ${index + 1} must be solvable`)
  assert(!validScrews(level, { ...state, screws: [holes.length] }))
  assert(!validScrews(level, { ...state, moves: -1 }))
  assert(!validScrews(level, { ...freshState(level), removed: [100] }))
  console.log(`拧螺丝 ${index + 1}: ${state.moves} 步通关`)
}

assert.equal(mazes.length, 20)
assert.equal(new Set(mazes.map(m => JSON.stringify([m.size, m.floor]))).size, 20, 'Levels must have distinct layouts')
for (const [index, maze] of mazes.entries()) {
  assert(mazeLayouts[index][1].every(row => row.length === maze.size), 'Maps must be square')
  assert.equal(reachablePaint(maze).size, maze.floor.length)
  assert(paintableFromEveryStop(maze), 'Every reachable stop must still have routes to the remaining tiles')
  const floor = new Set(maze.floor)
  assert.equal(mazeLayouts[index][1].join('').split('S').length - 1, 1, 'Exactly one start')
  assert(maze.floor.every(p => p % maze.size > 0 && p % maze.size < maze.size - 1 && p >= maze.size && p < maze.size * (maze.size - 1)), 'Closed outer walls')
  const squares = Array(maze.size ** 2).fill(0)
  let widestRoom = 0
  for (let p = 0; p < squares.length; p++) if (floor.has(p)) {
    squares[p] = 1 + Math.min(squares[p - 1] ?? 0, squares[p - maze.size] ?? 0, squares[p - maze.size - 1] ?? 0)
    widestRoom = Math.max(widestRoom, squares[p])
  }
  if (index >= 10) {
    assert(widestRoom >= 4, `Maze ${index + 1} must contain a real open room, not only corridors`)
    assert(maze.floor.length >= 80, 'Advanced levels need room for multiple sweeps')
  }
  if (index === 19) assert(widestRoom >= 7, 'Final level needs an uninterrupted large clearing')
  const degree = p => [p - 1, p + 1, p - maze.size, p + maze.size].filter(n => floor.has(n)).length
  const junctions = maze.floor.filter(p => degree(p) >= 3).length
  const loops = maze.floor.reduce((sum, p) => sum + degree(p), 0) / 2 - maze.floor.length + 1
  assert(junctions >= 3, `Maze ${index + 1} must contain actual junctions, not a winding line`)
  assert(loops >= 1, `Maze ${index + 1} must offer loops and alternative approaches`)
  const stops = new Set([maze.start]), queue = [maze.start]
  let decisions = 0
  for (let i = 0; i < queue.length; i++) {
    const exits = directions.map(d => slide(maze, queue[i], d).at(-1)).filter(p => p !== undefined)
    if (exits.length >= 3) decisions++ // At least two options excluding backtracking.
    for (const end of exits) if (!stops.has(end)) { stops.add(end); queue.push(end) }
  }
  assert(decisions >= 3, `Maze ${index + 1} needs multiple reachable wall-stop choices`)
  let state = { position: maze.start, painted: [maze.start], moves: 0 }
  let count = 0
  while (state.painted.length < maze.floor.length && count++ < 1000) {
    const direction = mazeHint(maze, state)
    assert(direction, `Maze ${index + 1}: no route to unpainted tiles`)
    const old = structuredClone(state), path = slide(maze, state.position, direction)
    assert(path.length > 0)
    const next = move(maze, state, direction)
    assert.deepEqual(state, old)
    assert.equal(slide(maze, next.position, direction).length, 0, 'Slide must stop at a wall')
    assert.equal(next.moves, state.moves + 1)
    assert(next.painted.length >= state.painted.length)
    assert(validMaze(maze, JSON.parse(JSON.stringify(next))))
    state = next
  }
  assert.equal(state.painted.length, maze.floor.length, `Maze ${index + 1} must be fully paintable`)
  const wallDirection = directions.find(d => !slide(maze, state.position, d).length)
  assert.equal(move(maze, state, wallDirection), state)
  assert(!validMaze(maze, { ...state, painted: [...state.painted, -1] }))
  assert(!validMaze(maze, { ...state, painted: [...state.painted, state.position] }))
  assert(!validMaze(maze, { ...state, position: -1 }))
  console.log(`涂色迷宫 ${index + 1}: ${decisions} 个停点选择，最大空地 ${widestRoom}×${widestRoom}，提示路线 ${state.moves} 步`)
}

assert.equal(readProgress(null, 10), null)
assert.equal(readProgress({ level: 100, unlocked: 0, best: [], state: null }, 10), null)
assert.equal(readProgress({ level: 1, unlocked: 0, best: Array(10).fill(0) }, 10), null)
assert(readProgress({ level: 0, unlocked: 0, best: Array(10).fill(0), state: {} }, 10))
const oldSave = { level: 9, unlocked: 9, best: Array(10).fill(12), state: freshState(levels[9]) }
const migrated = readProgress(oldSave, 40, 10)
assert(migrated)
assert.equal(migrated.level, 9)
assert.equal(migrated.unlocked, 9)
assert.deepEqual(migrated.best.slice(0, 10), oldSave.best)
assert.deepEqual(migrated.best.slice(10), Array(30).fill(0))
assert.deepEqual(migrated.state, oldSave.state)
assert(validScrews(levels[9], migrated.state))
assert.deepEqual(readProgress(migrated, 40, 10), migrated)
assert.equal(readProgress({ ...oldSave, unlocked: 11 }, 40, 10), null)
const previousMazeSave = { level: 9, unlocked: 9, best: Array(10).fill(23), state: { position: mazes[9].start, painted: [mazes[9].start], moves: 0 } }
const expandedMazeSave = readProgress(previousMazeSave, 20, 10)
assert(expandedMazeSave)
assert.equal(expandedMazeSave.level, 9)
assert.equal(expandedMazeSave.unlocked, 9)
assert.deepEqual(expandedMazeSave.best.slice(0, 10), previousMazeSave.best)
assert.deepEqual(expandedMazeSave.best.slice(10), Array(10).fill(0))
assert.deepEqual(expandedMazeSave.state, previousMazeSave.state)
assert(validMaze(mazes[9], expandedMazeSave.state))
assert.deepEqual(readProgress(expandedMazeSave, 20, 10), expandedMazeSave)
console.log('关卡、不可达操作、提示、存档校验通过。')
