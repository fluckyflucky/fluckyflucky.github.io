export interface PuzzleProgress { level: number; unlocked: number; best: number[]; state: unknown }
export function readProgress(value: unknown, count: number): PuzzleProgress | null {
  const p = value as PuzzleProgress | null
  return p && Number.isInteger(p.level) && p.level >= 0 && p.level < count
    && Number.isInteger(p.unlocked) && p.unlocked >= p.level && p.unlocked < count
    && Array.isArray(p.best) && p.best.length === count
    && p.best.every(n => Number.isSafeInteger(n) && n >= 0) ? p : null
}
