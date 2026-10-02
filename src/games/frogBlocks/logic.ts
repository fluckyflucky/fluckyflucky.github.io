export const COLS = 10, ROWS = 20, HIDDEN = 4
export const KINDS = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const
export type Kind = typeof KINDS[number]
export type Rotation = 0 | 1 | 2 | 3
export interface Piece { kind: Kind; rotation: Rotation; x: number; y: number }
export interface Cell { x: number; y: number }
export interface BlocksSave {
  board: (Kind | null)[]
  active: Piece
  next: Kind[]
  hold: Kind | null
  holdUsed: boolean
  score: number
  lines: number
  over: boolean
  fallMs: number
  lockMs: number
  lockResets: number
  lastAction: 'move' | 'rotate' | null
  kick: number
  combo: number
  backToBack: boolean
}

const SPAWN: Record<Kind, [number, number][]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
}
// SRS kick offsets use upward-positive Y; the board below uses downward-positive Y.
const NORMAL_KICKS: Record<string, [number, number][]> = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
}
const I_KICKS: Record<string, [number, number][]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
}

export function cells(piece: Piece): Cell[] {
  return SPAWN[piece.kind].map(([col, row]) => {
    const size = piece.kind === 'I' ? 4 : 3
    if (piece.kind !== 'O') for (let n = 0; n < piece.rotation; n++) [col, row] = [size - 1 - row, col]
    return { x: col + piece.x, y: row + piece.y }
  })
}

export function fits(s: BlocksSave, piece = s.active): boolean {
  return cells(piece).every(p => p.x >= 0 && p.x < COLS && p.y >= 0 && p.y < ROWS + HIDDEN && s.board[p.y * COLS + p.x] === null)
}
export function grounded(s: BlocksSave): boolean { return !fits(s, { ...s.active, y: s.active.y + 1 }) }
export function level(s: BlocksSave): number { return Math.floor(s.lines / 10) + 1 }
export function gravity(s: BlocksSave): number {
  const n = Math.min(20, level(s)) - 1
  return Math.max(20, 1000 * Math.pow(.8 - n * .007, n))
}
function bag(random: () => number): Kind[] {
  const items = [...KINDS]
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}
function spawn(s: BlocksSave, kind: Kind) {
  s.active = { kind, rotation: 0, x: 3, y: HIDDEN - 1 }
  s.fallMs = 0; s.lockMs = 0; s.lockResets = 0; s.lastAction = null; s.kick = 0
  if (!fits(s)) s.over = true
}
function next(s: BlocksSave, random: () => number) {
  if (s.next.length <= 7) s.next.push(...bag(random))
  spawn(s, s.next.shift()!)
}
export function fresh(random = Math.random): BlocksSave {
  const s: BlocksSave = {
    board: Array(COLS * (ROWS + HIDDEN)).fill(null), active: { kind: 'T', rotation: 0, x: 3, y: HIDDEN - 1 },
    next: bag(random), hold: null, holdUsed: false, score: 0, lines: 0, over: false,
    fallMs: 0, lockMs: 0, lockResets: 0, lastAction: null, kick: 0, combo: -1, backToBack: false,
  }
  next(s, random)
  return s
}

function resetLock(s: BlocksSave, wasGrounded: boolean) {
  if ((wasGrounded || grounded(s)) && s.lockResets < 15) { s.lockMs = 0; s.lockResets++ }
}
export function move(s: BlocksSave, dx: -1 | 1): boolean {
  if (s.over) return false
  const target = { ...s.active, x: s.active.x + dx }, wasGrounded = grounded(s)
  if (!fits(s, target)) return false
  s.active = target; s.lastAction = 'move'; resetLock(s, wasGrounded)
  return true
}
export function rotate(s: BlocksSave, direction: -1 | 1): boolean {
  if (s.over || s.active.kind === 'O') return false
  const from = s.active.rotation, to = ((from + direction + 4) % 4) as Rotation
  const offsets = (s.active.kind === 'I' ? I_KICKS : NORMAL_KICKS)[`${from}>${to}`]
  const wasGrounded = grounded(s)
  for (let i = 0; i < offsets.length; i++) {
    const [dx, dy] = offsets[i]
    const target = { ...s.active, rotation: to, x: s.active.x + dx, y: s.active.y - dy }
    if (!fits(s, target)) continue
    s.active = target; s.lastAction = 'rotate'; s.kick = i; resetLock(s, wasGrounded)
    return true
  }
  return false
}
export function softDrop(s: BlocksSave): boolean {
  if (s.over || grounded(s)) return false
  s.active.y++; s.score++; s.fallMs = 0
  return true
}
export function landing(s: BlocksSave): Piece {
  const ghost = { ...s.active }
  while (fits(s, { ...ghost, y: ghost.y + 1 })) ghost.y++
  return ghost
}
export function hold(s: BlocksSave, random = Math.random): boolean {
  if (s.over || s.holdUsed) return false
  const kind = s.active.kind, held = s.hold
  s.hold = kind; s.holdUsed = true
  if (held) spawn(s, held)
  else next(s, random)
  return true
}

function spin(s: BlocksSave): 'full' | 'mini' | null {
  if (s.active.kind !== 'T' || s.lastAction !== 'rotate') return null
  const { x, y, rotation } = s.active
  const corners = [[x, y], [x + 2, y], [x, y + 2], [x + 2, y + 2]].map(([cx, cy]) =>
    cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS + HIDDEN || s.board[cy * COLS + cx] !== null)
  if (corners.filter(Boolean).length < 3) return null
  const front = [[0, 1], [1, 3], [2, 3], [0, 2]][rotation]
  return (corners[front[0]] && corners[front[1]]) || s.kick === 4 ? 'full' : 'mini'
}
export function lock(s: BlocksSave, random = Math.random): number {
  if (s.over) return 0
  const tspin = spin(s), piece = cells(s.active)
  for (const p of piece) s.board[p.y * COLS + p.x] = s.active.kind
  const rows: (Kind | null)[][] = []
  for (let y = 0; y < ROWS + HIDDEN; y++) {
    const row = s.board.slice(y * COLS, (y + 1) * COLS)
    if (row.some(v => v === null)) rows.push(row)
  }
  const cleared = ROWS + HIDDEN - rows.length
  const currentLevel = level(s), difficult = cleared > 0 && (cleared === 4 || tspin !== null)
  const base = tspin === 'full' ? [400, 800, 1200, 1600][cleared]
    : tspin === 'mini' ? [100, 200, 400, 1600][cleared] : [0, 100, 300, 500, 800][cleared]
  s.score += base * currentLevel * (difficult && s.backToBack ? 1.5 : 1)
  if (cleared) {
    s.combo++; s.score += Math.max(0, s.combo) * 50 * currentLevel
    if (rows.every(row => row.every(v => v === null))) s.score += (cleared === 4 && s.backToBack ? 3200 : [0, 800, 1200, 1800, 2000][cleared]) * currentLevel
    s.backToBack = difficult
  } else s.combo = -1
  s.lines += cleared
  while (rows.length < ROWS + HIDDEN) rows.unshift(Array(COLS).fill(null))
  s.board = rows.flat()
  s.holdUsed = false
  if (piece.every(p => p.y < HIDDEN)) s.over = true
  else next(s, random)
  return cleared
}
export function hardDrop(s: BlocksSave, random = Math.random): number {
  if (s.over) return 0
  const ghost = landing(s), distance = ghost.y - s.active.y
  s.score += distance * 2
  s.active = ghost
  lock(s, random)
  return distance
}
export function tick(s: BlocksSave, milliseconds: number, soft = false, random = Math.random): boolean {
  if (s.over) return false
  let changed = false, remaining = milliseconds
  // Substeps keep gravity and lock timing independent of display frame rate.
  while (remaining > 0 && !s.over) {
    const dt = Math.min(remaining, 10)
    remaining -= dt
    s.fallMs += dt
    const interval = soft ? Math.min(33, gravity(s)) : gravity(s)
    while (s.fallMs >= interval) {
      s.fallMs -= interval
      if (grounded(s)) { s.fallMs = 0; break }
      s.active.y++
      if (soft) s.score++
      changed = true
    }
    if (grounded(s)) {
      s.lockMs += dt
      if (s.lockMs >= 500) { lock(s, random); changed = true }
    }
  }
  return changed
}

export function validSave(value: unknown): value is BlocksSave {
  if (!value || typeof value !== 'object') return false
  const s = value as BlocksSave
  const kind = (v: unknown): v is Kind => typeof v === 'string' && (KINDS as readonly string[]).includes(v)
  if (!Array.isArray(s.board) || s.board.length !== COLS * (ROWS + HIDDEN) || !s.board.every(v => v === null || kind(v))
    || !s.active || !kind(s.active.kind) || !Number.isInteger(s.active.rotation) || s.active.rotation < 0 || s.active.rotation > 3
    || !Number.isInteger(s.active.x) || !Number.isInteger(s.active.y)
    || !Array.isArray(s.next) || s.next.length < 7 || s.next.length > 13 || !s.next.every(kind)
    || (s.hold !== null && !kind(s.hold)) || typeof s.holdUsed !== 'boolean' || typeof s.over !== 'boolean'
    || typeof s.backToBack !== 'boolean' || !['move', 'rotate', null].includes(s.lastAction)
    || !Number.isSafeInteger(s.score) || s.score < 0 || !Number.isSafeInteger(s.lines) || s.lines < 0
    || !Number.isSafeInteger(s.combo) || s.combo < -1 || s.combo > s.lines
    || !Number.isInteger(s.kick) || s.kick < 0 || s.kick > 4
    || !Number.isInteger(s.lockResets) || s.lockResets < 0 || s.lockResets > 15
    || !Number.isFinite(s.fallMs) || s.fallMs < 0 || s.fallMs > 1000
    || !Number.isFinite(s.lockMs) || s.lockMs < 0 || s.lockMs > 500) return false
  if (!cells(s.active).every(p => p.x >= 0 && p.x < COLS && p.y >= 0 && p.y < ROWS + HIDDEN)) return false
  for (let y = 0; y < ROWS + HIDDEN; y++) if (s.board.slice(y * COLS, (y + 1) * COLS).every(v => v !== null)) return false
  return s.over || fits(s)
}
