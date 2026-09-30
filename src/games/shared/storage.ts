export function readSaved(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') } catch { return null }
}

export function saveLocal(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Storage may be unavailable. */ }
}

export function readBest(key: string): number {
  const value = readSaved(key)
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0
}
