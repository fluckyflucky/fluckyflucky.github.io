import assert from 'node:assert/strict'
import { levels, holes, freshState, hint as screwHint, relocate, accessible, validState as validScrews } from '../src/games/screws/logic.ts'
import { mazes, reachablePaint, slide, directions, move, hint as mazeHint, validState as validMaze } from '../src/games/paintMaze/logic.ts'
import { readProgress } from '../src/games/shared/puzzleProgress.ts'

assert.equal(levels.length, 10)
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

assert.equal(mazes.length, 10)
for (const [index, maze] of mazes.entries()) {
  assert.equal(reachablePaint(maze).size, maze.floor.length)
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
  console.log(`涂色迷宫 ${index + 1}: ${state.moves} 步通关，${maze.floor.length} 格`)
}

assert.equal(readProgress(null, 10), null)
assert.equal(readProgress({ level: 100, unlocked: 0, best: [], state: null }, 10), null)
assert.equal(readProgress({ level: 1, unlocked: 0, best: Array(10).fill(0) }, 10), null)
assert(readProgress({ level: 0, unlocked: 0, best: Array(10).fill(0), state: {} }, 10))
console.log('关卡、不可达操作、提示、存档校验通过。')
