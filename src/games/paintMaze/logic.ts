export type Direction = 'up' | 'down' | 'left' | 'right'
export interface Maze { size: number; floor: number[]; start: number }
export interface MazeState { position: number; painted: number[]; moves: number }

export function slide(maze: Maze, position: number, direction: Direction): number[] {
  const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[direction]
  const floor = new Set(maze.floor)
  const path: number[] = []
  let x = position % maze.size, y = Math.floor(position / maze.size)
  while (x + dx >= 0 && x + dx < maze.size && y + dy >= 0 && y + dy < maze.size) {
    const next = (y + dy) * maze.size + x + dx
    if (!floor.has(next)) break
    path.push(next); x += dx; y += dy
  }
  return path
}

export const directions: Direction[] = ['up', 'right', 'down', 'left']

// Reachability is over wall-stop positions, not ordinary walking paths.
export function reachablePaint(maze: Maze, start = maze.start): Set<number> {
  const seen = new Set([start]), paint = new Set([start]), queue = [start]
  for (let i = 0; i < queue.length; i++) {
    for (const d of directions) {
      const path = slide(maze, queue[i], d)
      path.forEach(p => paint.add(p))
      const end = path.at(-1)
      if (end !== undefined && !seen.has(end)) { seen.add(end); queue.push(end) }
    }
  }
  return paint
}

function paintableFromEveryStop(maze: Maze): boolean {
  const stops = new Set([maze.start]), queue = [maze.start]
  for (let i = 0; i < queue.length; i++) {
    if (reachablePaint(maze, queue[i]).size !== maze.floor.length) return false
    for (const d of directions) {
      const end = slide(maze, queue[i], d).at(-1)
      if (end !== undefined && !stops.has(end)) { stops.add(end); queue.push(end) }
    }
  }
  return true
}

function random(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
}

export function createMaze(level: number): Maze {
  const size = 7 + 2 * Math.floor(level / 3)
  for (let attempt = 0; attempt < 500; attempt++) {
    const rng = random(90210 + level * 7919 + attempt * 37)
    const start = size + 1, floor = new Set([start]), stack = [start]
    while (stack.length) {
      const p = stack.at(-1)!, x = p % size, y = Math.floor(p / size)
      const options = [[0, -2], [2, 0], [0, 2], [-2, 0]].filter(([dx, dy]) =>
        x + dx > 0 && x + dx < size - 1 && y + dy > 0 && y + dy < size - 1 && !floor.has(p + dy * size + dx))
      if (!options.length) { stack.pop(); continue }
      const [dx, dy] = options[Math.floor(rng() * options.length)]
      floor.add(p + dy / 2 * size + dx / 2); floor.add(p + dy * size + dx); stack.push(p + dy * size + dx)
    }
    const maze = { size, floor: [...floor].sort((a, b) => a - b), start }
    if (paintableFromEveryStop(maze)) return maze
  }
  // Serpentine fallback is always paintable in wall-to-wall slides.
  const floor: number[] = []
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) if (y % 2 || x === (y % 4 === 2 ? size - 2 : 1)) floor.push(y * size + x)
  }
  return { size, floor, start: size + 1 }
}

export const mazes = Array.from({ length: 10 }, (_, level) => createMaze(level))

export function move(maze: Maze, state: MazeState, direction: Direction): MazeState {
  const path = slide(maze, state.position, direction)
  if (!path.length) return state
  return { position: path.at(-1)!, painted: [...new Set([...state.painted, ...path])], moves: state.moves + 1 }
}

// Find the first direction on a shortest route to any unpainted stretch.
export function hint(maze: Maze, state: MazeState): Direction | null {
  const painted = new Set(state.painted), seen = new Set([state.position])
  const queue: { position: number; first: Direction | null }[] = [{ position: state.position, first: null }]
  for (let i = 0; i < queue.length; i++) {
    for (const direction of directions) {
      const path = slide(maze, queue[i].position, direction), end = path.at(-1)
      if (end === undefined) continue
      const first = queue[i].first ?? direction
      if (path.some(p => !painted.has(p))) return first
      if (!seen.has(end)) { seen.add(end); queue.push({ position: end, first }) }
    }
  }
  return null
}

export function validState(maze: Maze, value: unknown): value is MazeState {
  const s = value as MazeState | null
  return !!s && maze.floor.includes(s.position) && Number.isSafeInteger(s.moves) && s.moves >= 0
    && Array.isArray(s.painted) && s.painted.length <= maze.floor.length
    && new Set(s.painted).size === s.painted.length && s.painted.includes(s.position)
    && s.painted.includes(maze.start) && s.painted.every(p => maze.floor.includes(p))
}
