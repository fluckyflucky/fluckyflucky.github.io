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

assert.equal(mazes.length, 10)
assert.equal(new Set(mazes.map(m => JSON.stringify(m.floor))).size, 10, 'Levels must have distinct layouts')
for (const [index, maze] of mazes.entries()) {
  assert(mazeLayouts[index][1].every(row => row.length === maze.size), 'Maps must be square')
  assert.equal(reachablePaint(maze).size, maze.floor.length)
  assert(paintableFromEveryStop(maze), 'Every reachable stop must still have routes to the remaining tiles')
  const floor = new Set(maze.floor)
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
  console.log(`涂色迷宫 ${index + 1}: ${junctions} 个岔路，${loops} 个环，${decisions} 个选择点，${state.moves} 步通关`)
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
console.log('关卡、不可达操作、提示、存档校验通过。')
