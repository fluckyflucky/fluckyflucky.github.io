export const SIZE = 6
export const TYPES = 5

export function adjacent(a: number, b: number) {
  return Math.abs(Math.floor(a / SIZE) - Math.floor(b / SIZE)) + Math.abs(a % SIZE - b % SIZE) === 1
}

export function findMatches(board: readonly number[]): Set<number> {
  const matched = new Set<number>()
  for (let axis = 0; axis < 2; axis++) {
    for (let line = 0; line < SIZE; line++) {
      const index = (position: number) => axis === 0 ? line * SIZE + position : position * SIZE + line
      let start = 0
      while (start < SIZE) {
        let end = start + 1
        const type = board[index(start)]
        while (end < SIZE && type >= 0 && board[index(end)] === type) end++
        if (type >= 0 && end - start >= 3) for (let p = start; p < end; p++) matched.add(index(p))
        start = end
      }
    }
  }
  return matched
}

export function findMove(board: readonly number[]): [number, number] | null {
  for (let a = 0; a < board.length; a++) {
    for (const b of [a % SIZE < SIZE - 1 ? a + 1 : -1, a + SIZE < board.length ? a + SIZE : -1]) {
      if (b < 0 || board[a] === board[b]) continue
      const next = [...board]
      ;[next[a], next[b]] = [next[b], next[a]]
      const matches = findMatches(next)
      if (matches.has(a) || matches.has(b)) return [a, b]
    }
  }
  return null
}

export function createBoard(random: () => number = Math.random): number[] {
  while (true) {
    const board: number[] = []
    for (let index = 0; index < SIZE * SIZE; index++) {
      const possible = Array.from({ length: TYPES }, (_, type) => type).filter(type =>
        !(index % SIZE >= 2 && board[index - 1] === type && board[index - 2] === type)
        && !(index >= 2 * SIZE && board[index - SIZE] === type && board[index - 2 * SIZE] === type))
      board.push(possible[Math.floor(random() * possible.length)])
    }
    if (findMove(board)) return board
  }
}

export function collapseBoard(board: readonly number[], removed: ReadonlySet<number>, random: () => number = Math.random) {
  const next = Array<number>(SIZE * SIZE).fill(-1)
  const placements: { from: number; to: number; type: number }[] = []
  const added: { index: number; type: number }[] = []
  for (let col = 0; col < SIZE; col++) {
    const remaining = Array.from({ length: SIZE }, (_, row) => row * SIZE + col).filter(index => !removed.has(index))
    let row = SIZE - 1
    for (let source = remaining.length - 1; source >= 0; source--) {
      const from = remaining[source], to = row-- * SIZE + col
      next[to] = board[from]
      placements.push({ from, to, type: board[from] })
    }
    while (row >= 0) {
      const index = row-- * SIZE + col, type = Math.floor(random() * TYPES)
      next[index] = type
      added.push({ index, type })
    }
  }
  return { board: next, placements, added }
}

export function validBoard(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === SIZE * SIZE
    && value.every(type => Number.isInteger(type) && type >= 0 && type < TYPES)
    && findMatches(value).size === 0
}
