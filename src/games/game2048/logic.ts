export type Direction = 'left' | 'right' | 'up' | 'down'

export interface MoveResult {
  board: number[]
  score: number
  changed: boolean
  placements: { from: number; to: number; value: number }[]
}

export function moveBoard(board: readonly number[], direction: Direction): MoveResult {
  const next = Array<number>(16).fill(0)
  const placements: MoveResult['placements'] = []
  let score = 0

  for (let line = 0; line < 4; line++) {
    const indices = Array.from({ length: 4 }, (_, position) => {
      switch (direction) {
        case 'left': return line * 4 + position
        case 'right': return line * 4 + 3 - position
        case 'up': return position * 4 + line
        case 'down': return (3 - position) * 4 + line
      }
    })
    const occupied = indices.filter(index => board[index] !== 0)
    let target = 0
    for (let source = 0; source < occupied.length; source++) {
      const from = occupied[source]
      let value = board[from]
      if (source + 1 < occupied.length && value === board[occupied[source + 1]]) {
        value *= 2
        score += value
        source++
      }
      const to = indices[target++]
      next[to] = value
      placements.push({ from, to, value })
    }
  }

  return { board: next, score, changed: next.some((value, index) => value !== board[index]), placements }
}

export function spawnTile(board: readonly number[], random: () => number = Math.random) {
  const empty = board.flatMap((value, index) => value === 0 ? [index] : [])
  const next = [...board]
  if (!empty.length) return { board: next, index: -1 }
  const index = empty[Math.floor(random() * empty.length)]
  next[index] = random() < 0.9 ? 2 : 4
  return { board: next, index }
}

export function canMove(board: readonly number[]): boolean {
  return board.some((value, index) => value === 0
    || (index % 4 < 3 && value === board[index + 1])
    || (index < 12 && value === board[index + 4]))
}

export function isValidBoard(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === 16
    && value.every(tile => typeof tile === 'number' && (tile === 0
      || (tile >= 2 && tile <= 2 ** 52 && Number.isInteger(Math.log2(tile)))))
    && value.some(tile => tile > 0)
}
