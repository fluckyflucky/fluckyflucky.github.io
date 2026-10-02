export const COLS = 6, ROWS = 8, TYPES = 8
export interface Point { x: number; y: number }
export interface LinkSave { board: number[]; elapsed: number; started: boolean }

// One empty ring around the board lets a connection travel outside the tiles.
export function connection(board: readonly number[], a: number, b: number): Point[] | null {
  if (a === b || a < 0 || b < 0 || a >= board.length || b >= board.length || board[a] < 0 || board[a] !== board[b]) return null
  const start = { x: a % COLS + 1, y: Math.floor(a / COLS) + 1 }
  const end = { x: b % COLS + 1, y: Math.floor(b / COLS) + 1 }
  function clear(p: Point, q: Point) {
    if (p.x !== q.x && p.y !== q.y) return false
    const dx = Math.sign(q.x - p.x), dy = Math.sign(q.y - p.y)
    let x = p.x, y = p.y
    for (;;) {
      if (x >= 1 && x <= COLS && y >= 1 && y <= ROWS) {
        const index = (y - 1) * COLS + x - 1
        if (index !== a && index !== b && board[index] >= 0) return false
      }
      if (x === q.x && y === q.y) return true
      x += dx; y += dy
    }
  }
  const candidates: Point[][] = [[start, end],
    [start, { x: start.x, y: end.y }, end],
    [start, { x: end.x, y: start.y }, end]]
  for (let x = 0; x <= COLS + 1; x++) candidates.push([start, { x, y: start.y }, { x, y: end.y }, end])
  for (let y = 0; y <= ROWS + 1; y++) candidates.push([start, { x: start.x, y }, { x: end.x, y }, end])
  let best: Point[] | null = null, distance = Infinity
  for (const candidate of candidates) {
    if (!candidate.slice(1).every((p, i) => clear(candidate[i], p))) continue
    const path = candidate.filter((p, i) => i === 0 || p.x !== candidate[i - 1].x || p.y !== candidate[i - 1].y)
    for (let i = path.length - 2; i > 0; i--) {
      if ((path[i - 1].x === path[i].x && path[i].x === path[i + 1].x)
        || (path[i - 1].y === path[i].y && path[i].y === path[i + 1].y)) path.splice(i, 1)
    }
    const length = path.slice(1).reduce((sum, p, i) => sum + Math.abs(p.x - path[i].x) + Math.abs(p.y - path[i].y), 0)
    if (!best || path.length < best.length || (path.length === best.length && length < distance)) {
      best = path; distance = length
    }
  }
  return best
}

export function findPair(board: readonly number[], order = board.map((_, i) => i)): [number, number] | null {
  for (let i = 0; i < order.length; i++) {
    const a = order[i]
    if (board[a] < 0) continue
    for (let j = i + 1; j < order.length; j++) {
      const b = order[j]
      if (board[a] === board[b] && connection(board, a, b)) return [a, b]
    }
  }
  return null
}

function shuffle<T>(items: T[], random: () => number) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

export function reshuffle(board: readonly number[], random = Math.random): number[] {
  const pairs: number[] = []
  for (let type = 0; type < TYPES; type++) {
    for (let n = board.filter(value => value === type).length / 2; n > 0; n--) pairs.push(type)
  }
  shuffle(pairs, random)
  const geometry = board.map(value => value < 0 ? -1 : 0)
  const arranged = Array<number>(COLS * ROWS).fill(-1)
  // Assign matching pictures along a legal removal sequence, preserving holes and counts.
  for (const type of pairs) {
    const order = shuffle(geometry.map((_, i) => i).filter(i => geometry[i] >= 0), random)
    const pair = findPair(geometry, order)!
    for (const index of pair) { arranged[index] = type; geometry[index] = -1 }
  }
  return arranged
}

export function fresh(random = Math.random): LinkSave {
  return { board: reshuffle(Array.from({ length: COLS * ROWS }, (_, i) => Math.floor(i / 6)), random), elapsed: 0, started: false }
}

export function validSave(value: unknown): value is LinkSave {
  if (!value || typeof value !== 'object') return false
  const s = value as LinkSave
  if (!Array.isArray(s.board) || s.board.length !== COLS * ROWS || !s.board.every(v => Number.isInteger(v) && v >= -1 && v < TYPES)
    || !Number.isSafeInteger(s.elapsed) || s.elapsed < 0 || typeof s.started !== 'boolean') return false
  return Array.from({ length: TYPES }, (_, type) => s.board.filter(v => v === type).length).every(count => count % 2 === 0)
    && (s.started || (s.elapsed === 0 && s.board.every(v => v >= 0)))
}
