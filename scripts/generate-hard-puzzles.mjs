// Offline authoring only. Output is reviewed and frozen into the level files.
// No random map generation runs in the player's browser.
import { ScrewWorld } from '../src/games/screws/physics.ts'
import { holes, levels, freshState, hint as screwHint, relocate } from '../src/games/screws/logic.ts'
import { reachablePaint, slide, directions, hint, move } from '../src/games/paintMaze/logic.ts'

let seed = 20261001
function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
const pick = array => array[Math.floor(random() * array.length)]
const mode = process.argv[2] ?? 'screws'
const result = []
if (mode === 'screws') {
  const used = new Set(levels.map(l => JSON.stringify(l.plates.map(p => [p.a, p.b]).sort((a,b) => a[0]-b[0] || a[1]-b[1]))))
  for (let attempt = 0; attempt < 10000 && result.length < 10; attempt++) {
    const pairs = [], count = 10 + Math.floor(result.length / 4)
    while (pairs.length < count) {
      const a = 2 + Math.floor(random() * 16), b = 2 + Math.floor(random() * 16)
      if (a >= b || pairs.some(p => p[0] === a && p[1] === b)) continue
      if (Math.hypot(holes[a].x - holes[b].x, holes[a].y - holes[b].y) < 100) continue
      pairs.push([a, b])
    }
    const fingerprint = JSON.stringify([...pairs].sort((a,b) => a[0]-b[0] || a[1]-b[1]))
    if (used.has(fingerprint)) continue
    const level = { name: 'Candidate', plates: pairs.map(([a,b]) => ({ a,b,color:'#c90' })), screws: [...new Set(pairs.flat())].sort((a,b) => a-b) }
    let state = freshState(level)
    for (let t = 0; t < 100 && state.removed.length < count; t++) {
      const action = screwHint(level, state)
      if (!action) break
      state = relocate(level, state, ...action)
    }
    if (state.removed.length !== count) continue
    const world = new ScrewWorld(level)
    let turns = 0
    for (; turns < 100 && world.remaining; turns++) {
      const action = world.hint()
      if (action) world.relocate(...action)
      for (let step = 0; step < 60; step++) world.step()
    }
    const solved = !world.remaining
    const moves = world.moves
    world.destroy()
    if (!solved || moves < 12) continue
    used.add(fingerprint); result.push({ pairs, moves, turns })
    console.error(`Accepted screw ${result.length}: ${count} boards, ${moves} moves`)
  }
} else if (mode === 'maze') {
  for (let attempt = 0; attempt < 100000 && result.length < 10; attempt++) {
    const size = result.length < 4 ? 17 : result.length < 8 ? 19 : 21
    let floor = []
    const density = .18 + random() * .12
    for (let y = 1; y < size - 1; y++) for (let x = 1; x < size - 1; x++) {
      // Preserve a substantial open room, with the surrounding blocks acting
      // as stopping offsets to sweep its interior from different columns.
      const room = x >= 4 && x < 10 && y >= 4 && y < 10
      if (room || random() > density) floor.push(y * size + x)
    }
    const maze = { size, floor, start: pick(floor) }
    maze.start = slide(maze, maze.start, 'left').at(-1) ?? maze.start
    // Remove sealed/unreachable pockets, then re-evaluate the changed brakes.
    for (let pass = 0; pass < 20; pass++) {
      const painted = reachablePaint(maze)
      if (painted.size === maze.floor.length) break
      maze.floor = maze.floor.filter(p => painted.has(p))
    }
    floor = maze.floor
    if (floor.length < 150) continue
    const floorSet = new Set(floor)
    let roomIntact = true
    for (let y = 4; y < 10; y++) for (let x = 4; x < 10; x++) if (!floorSet.has(y * size + x)) roomIntact = false
    if (!roomIntact) continue
    if (reachablePaint(maze).size !== floor.length) continue
    const seen = new Set([maze.start]), queue = [maze.start], reverse = new Map()
    let decisions = 0
    for (let i = 0; i < queue.length; i++) {
      let exits = 0
      for (const d of directions) {
        const end = slide(maze, queue[i], d).at(-1)
        if (end === undefined) continue
        exits++
        if (!reverse.has(end)) reverse.set(end, [])
        reverse.get(end).push(queue[i])
        if (!seen.has(end)) { seen.add(end); queue.push(end) }
      }
      if (exits >= 3) decisions++
    }
    // Strong connectivity prevents irreversible traps at reachable stops.
    const returns = new Set([maze.start]), back = [maze.start]
    for (let i = 0; i < back.length; i++) for (const p of reverse.get(back[i]) ?? []) {
      if (!returns.has(p)) { returns.add(p); back.push(p) }
    }
    if (returns.size !== seen.size || decisions < 30) continue
    let state = { position: maze.start, painted: [maze.start], moves: 0 }
    while (state.painted.length < floor.length && state.moves < 500) {
      const d = hint(maze, state)
      if (!d) break
      state = move(maze, state, d)
    }
    if (state.painted.length !== floor.length || state.moves < 100) continue
    const cells = new Set(floor)
    const rows = Array.from({length:size}, (_,y) => Array.from({length:size}, (_,x) => {
      const p = y * size + x
      return p === maze.start ? 'S' : cells.has(p) ? ' ' : '#'
    }).join(''))
    if (result.some(r => JSON.stringify(r.rows) === JSON.stringify(rows))) continue
    result.push({ rows, decisions, moves: state.moves, floor: floor.length })
    console.error(`Accepted maze ${result.length}: ${size}×${size}, ${decisions} decisions, ${state.moves} moves`)
  }
} else throw new Error('Use screws or maze')
if (result.length !== 10) throw new Error(`Only found ${result.length} candidates`)
console.log(JSON.stringify(result))
