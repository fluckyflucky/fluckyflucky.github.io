export interface Hole { x: number; y: number }
export interface Plate { a: number; b: number; color: string }
export interface ScrewLevel { name: string; plates: Plate[]; screws: number[] }
export interface ScrewState { screws: number[]; removed: number[]; moves: number }
export const holes: Hole[] = [
  { x: 42, y: 28 }, { x: 114, y: 28 },
  ...Array.from({ length: 16 }, (_, i) => ({ x: 42 + i % 4 * 72, y: 100 + Math.floor(i / 4) * 72 })),
  { x: 186, y: 28 }, { x: 258, y: 28 },
]
const colors = ['#c69056', '#69a49a', '#a887b4', '#ce7971', '#8dabc5', '#c8ad65']
const layouts: [string, number[][]][] = [
  ['先拆一块', [[6, 9]]],
  ['两块木板', [[10, 13], [6, 9]]],
  ['十字交叉', [[6, 9], [3, 15]]],
  ['斜着拆', [[6, 9], [2, 17], [5, 14]]],
  ['三层架子', [[14, 17], [10, 13], [6, 9], [2, 14]]],
  ['搭个井字', [[6, 9], [10, 13], [3, 15], [4, 16]]],
  ['交叉木桥', [[14, 17], [6, 9], [2, 17], [5, 14], [3, 15]]],
  ['层层叠叠', [[14, 17], [6, 9], [10, 13], [3, 15], [4, 16], [2, 5]]],
  ['绕个弯', [[14, 17], [10, 13], [6, 9], [2, 17], [5, 14], [2, 5]]],
  ['拆完收工', [[14, 17], [6, 9], [10, 13], [3, 15], [4, 16], [2, 5], [3, 4]]],
]
export const levels: ScrewLevel[] = layouts.map(([name, pairs]) => ({
  name, plates: pairs.map(([a, b], i) => ({ a, b, color: colors[i % colors.length] })),
  screws: [...new Set(pairs.flat())].sort((a, b) => a - b),
}))

export function covers(plate: Plate, hole: number): boolean {
  const a = holes[plate.a], b = holes[plate.b], p = holes[hole]
  const dx = b.x - a.x, dy = b.y - a.y
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy) < 19
}

export function freshState(level: ScrewLevel): ScrewState { return { screws: [...level.screws], removed: [], moves: 0 } }

export function accessible(level: ScrewLevel, state: ScrewState, hole: number): boolean {
  for (let i = level.plates.length - 1; i >= 0; i--) {
    const p = level.plates[i]
    if (!state.removed.includes(i) && covers(p, hole)) return p.a === hole || p.b === hole
  }
  return true
}

export function relocate(level: ScrewLevel, state: ScrewState, from: number, to: number): ScrewState | null {
  if (from === to || !holes[from] || !holes[to] || !state.screws.includes(from) || state.screws.includes(to)
    || !accessible(level, state, from) || !accessible(level, state, to)) return null
  const screws = state.screws.map(h => h === from ? to : h).sort((a, b) => a - b)
  const removed = [...state.removed]
  level.plates.forEach((p, i) => {
    if (!removed.includes(i) && !screws.includes(p.a) && !screws.includes(p.b)) removed.push(i)
  })
  return { screws, removed: removed.sort((a, b) => a - b), moves: state.moves + 1 }
}

// Prefer freeing the highest remaining plate. Free holes outside all remaining
// plates are safe parking; a screw in another plate's hole pins that plate.
export function hint(level: ScrewLevel, state: ScrewState): [number, number] | null {
  for (let i = level.plates.length - 1; i >= 0; i--) {
    if (state.removed.includes(i)) continue
    const plate = level.plates[i]
    for (const from of [plate.a, plate.b]) {
      if (!state.screws.includes(from) || !accessible(level, state, from)) continue
      const to = holes.findIndex((_, h) => !state.screws.includes(h) && accessible(level, state, h)
        && level.plates.every((p, j) => state.removed.includes(j) || !covers(p, h)))
      if (to >= 0) return [from, to]
    }
  }
  return null
}

export function validState(level: ScrewLevel, value: unknown): value is ScrewState {
  const s = value as ScrewState | null
  return !!s && Number.isSafeInteger(s.moves) && s.moves >= 0 && Array.isArray(s.screws)
    && s.screws.length === level.screws.length && new Set(s.screws).size === s.screws.length
    && s.screws.every(h => Number.isInteger(h) && h >= 0 && h < holes.length)
    && Array.isArray(s.removed) && new Set(s.removed).size === s.removed.length
    && s.removed.every(i => Number.isInteger(i) && i >= 0 && i < level.plates.length)
    && level.plates.every((p, i) => s.removed.includes(i) || s.screws.includes(p.a) || s.screws.includes(p.b))
}
