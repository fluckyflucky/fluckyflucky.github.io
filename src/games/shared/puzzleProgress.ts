export interface PuzzleProgress { level: number; unlocked: number; best: number[]; state: unknown }
export function readProgress(value: unknown, count: number, previousCount = count): PuzzleProgress | null {
  const p = value as PuzzleProgress | null
  const valid = p && Number.isInteger(p.level) && p.level >= 0 && p.level < count
    && Number.isInteger(p.unlocked) && p.unlocked >= p.level && p.unlocked < count
    && Array.isArray(p.best) && p.best.length === count
    && p.best.every(n => Number.isSafeInteger(n) && n >= 0)
  if (valid) return p
  if (previousCount < count) {
    const previous = readProgress(value, previousCount)
    if (previous) return { ...previous, best: [...previous.best, ...Array<number>(count - previousCount).fill(0)] }
  }
  return null
}
