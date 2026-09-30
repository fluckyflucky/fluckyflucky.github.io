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
  ['木板架 11', [[3,13],[12,16],[2,10],[7,12]]],
  ['木板架 12', [[6,14],[11,14],[14,15],[3,5]]],
  ['木板架 13', [[2,6],[9,12],[7,12],[6,8]]],
  ['木板架 14', [[3,8],[7,11],[6,16],[9,13]]],
  ['木板架 15', [[6,8],[3,13],[13,17],[4,12]]],
  ['木板架 16', [[3,6],[7,15],[8,14],[5,17],[2,7]]],
  ['木板架 17', [[7,11],[6,11],[9,17],[4,12],[5,17]]],
  ['木板架 18', [[4,10],[7,10],[4,16],[14,15],[6,8]]],
  ['木板架 19', [[14,16],[8,13],[2,5],[8,12],[10,11]]],
  ['木板架 20', [[5,8],[14,15],[14,17],[7,12],[5,17]]],
  ['木板架 21', [[2,4],[10,11],[2,14],[11,12],[8,9],[11,13]]],
  ['木板架 22', [[2,4],[9,13],[7,11],[14,17],[10,12],[4,16]]],
  ['木板架 23', [[16,17],[3,11],[7,10],[8,16],[2,17],[13,16]]],
  ['木板架 24', [[5,13],[3,4],[5,17],[3,15],[11,16],[9,17]]],
  ['木板架 25', [[3,5],[11,12],[7,15],[8,9],[6,10],[2,6]]],
  ['木板架 26', [[11,13],[7,11],[12,16],[3,4],[2,4],[9,17],[9,15]]],
  ['木板架 27', [[12,17],[7,17],[3,5],[12,13],[14,17],[4,5],[11,13]]],
  ['木板架 28', [[10,11],[7,9],[8,12],[7,17],[2,4],[11,13],[6,8]]],
  ['木板架 29', [[4,8],[4,10],[8,16],[6,14],[14,17],[10,12],[6,9]]],
  ['木板架 30', [[9,15],[3,11],[2,4],[6,10],[4,12],[6,16],[12,13]]],
  ['木板架 31', [[8,9],[4,7],[6,11],[14,15],[4,8],[6,16],[12,16],[2,10]]],
  ['木板架 32', [[2,7],[2,17],[14,17],[10,15],[8,11],[10,14],[3,5],[3,8]]],
  ['木板架 33', [[14,15],[2,5],[11,16],[8,13],[16,17],[15,17],[5,13],[2,7]]],
  ['木板架 34', [[2,17],[8,13],[10,12],[16,17],[3,6],[10,13],[2,3],[10,11]]],
  ['木板架 35', [[8,9],[2,14],[3,15],[5,8],[3,4],[4,7],[10,15],[6,8]]],
  ['木板架 36', [[8,14],[2,12],[6,8],[4,5],[10,14],[9,12],[11,15],[5,14],[6,9]]],
  ['木板架 37', [[5,14],[10,15],[11,13],[11,15],[15,17],[6,14],[8,9],[9,12],[3,8]]],
  ['木板架 38', [[16,17],[5,13],[3,7],[6,11],[6,7],[8,14],[4,12],[4,5],[14,17]]],
  ['木板架 39', [[2,12],[4,10],[3,13],[5,11],[6,11],[8,11],[14,16],[2,10],[3,5]]],
  ['木板架 40', [[2,17],[3,7],[15,17],[4,9],[4,16],[12,17],[7,10],[9,17],[5,14]]],
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
