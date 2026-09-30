export const peers = Array.from({ length: 81 }, (_, i) =>
  Array.from({ length: 81 }, (_, j) => j).filter(
    (j) =>
      i !== j &&
      (Math.floor(i / 9) === Math.floor(j / 9) ||
        i % 9 === j % 9 ||
        (Math.floor(i / 27) === Math.floor(j / 27) &&
          Math.floor((i % 9) / 3) === Math.floor((j % 9) / 3))),
  ),
);
export const groups = [
  ...Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => r * 9 + c),
  ),
  ...Array.from({ length: 9 }, (_, c) =>
    Array.from({ length: 9 }, (_, r) => r * 9 + c),
  ),
  ...Array.from({ length: 9 }, (_, b) =>
    Array.from(
      { length: 9 },
      (_, i) =>
        Math.floor(b / 3) * 27 + (b % 3) * 3 + Math.floor(i / 3) * 9 + (i % 3),
    ),
  ),
];
export function candidates(board: number[], i: number) {
  return board[i]
    ? []
    : Array.from({ length: 9 }, (_, k) => k + 1).filter((v) =>
        peers[i].every((j) => board[j] !== v),
      );
}
export function conflicts(board: number[]) {
  return board.map((v, i) => !!v && peers[i].some((j) => board[j] === v));
}
export function countSolutions(board: number[], limit = 2) {
  const a = [...board];
  if (conflicts(a).some(Boolean)) return 0;
  let count = 0;
  function search() {
    if (count >= limit) return;
    let cell = -1,
      options: number[] = [];
    for (let i = 0; i < 81; i++)
      if (!a[i]) {
        const c = candidates(a, i);
        if (!c.length) return;
        if (cell === -1 || c.length < options.length) {
          cell = i;
          options = c;
          if (c.length === 1) break;
        }
      }
    if (cell === -1) {
      count++;
      return;
    }
    for (const v of options) {
      a[cell] = v;
      search();
      if (count >= limit) break;
    }
    a[cell] = 0;
  }
  search();
  return count;
}
export function logicalStep(
  board: number[],
): { cell: number; value: number; reason: string } | null {
  if (conflicts(board).some(Boolean)) return null;
  const options = board.map((_, i) => candidates(board, i));
  for (let i = 0; i < 81; i++)
    if (!board[i] && options[i].length === 1)
      return {
        cell: i,
        value: options[i][0],
        reason: "这个格子只剩一个候选数字",
      };
  for (const [index, g] of groups.entries())
    for (let value = 1; value <= 9; value++) {
      if (g.some((i) => board[i] === value)) continue;
      const cells = g.filter((i) => options[i].includes(value));
      if (cells.length === 1)
        return {
          cell: cells[0],
          value,
          reason: `这${index < 9 ? "一行" : index < 18 ? "一列" : "一宫"}只有这里能填 ${value}`,
        };
    }
  return null;
}
export function logicalSolve(board: number[]) {
  const a = [...board];
  for (let i = 0; i < 81; i++) {
    if (a.every(Boolean)) return a;
    const step = logicalStep(a);
    if (!step) return null;
    a[step.cell] = step.value;
  }
  return a.every(Boolean) ? a : null;
}
function shuffled(values: number[], rng: () => number) {
  const a = [...values];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export interface Sudoku {
  version: 1;
  difficulty: "easy" | "normal";
  givens: number[];
  solution: number[];
  values: number[];
  notes: number[];
  seconds: number;
}
export function generate(
  difficulty: "easy" | "normal" = "normal",
  rng = Math.random,
): Sudoku {
  const trio = [0, 1, 2],
    rows = shuffled(trio, rng).flatMap((b) =>
      shuffled(trio, rng).map((r) => b * 3 + r),
    ),
    cols = shuffled(trio, rng).flatMap((b) =>
      shuffled(trio, rng).map((c) => b * 3 + c),
    ),
    digits = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  let solution = rows.flatMap((r) =>
    cols.map((c) => digits[(r * 3 + Math.floor(r / 3) + c) % 9]),
  );
  if (rng() < 0.5)
    solution = Array.from(
      { length: 81 },
      (_, i) => solution[(i % 9) * 9 + Math.floor(i / 9)],
    );
  const givens = [...solution],
    goal = difficulty === "easy" ? 42 : 32;
  let clues = 81;
  for (const i of shuffled(
    Array.from({ length: 81 }, (_, i) => i),
    rng,
  )) {
    if (clues <= goal) break;
    const previous = givens[i];
    givens[i] = 0;
    if (countSolutions(givens) !== 1 || !logicalSolve(givens))
      givens[i] = previous;
    else clues--;
  }
  return {
    version: 1,
    difficulty,
    givens,
    solution,
    values: [...givens],
    notes: Array(81).fill(0),
    seconds: 0,
  };
}
export function validSudoku(value: unknown): value is Sudoku {
  try {
    const s = value as Sudoku;
    const board = (a: number[]) =>
      Array.isArray(a) &&
      a.length === 81 &&
      a.every((n) => Number.isInteger(n) && n >= 0 && n <= 9);
    return (
      s.version === 1 &&
      ["easy", "normal"].includes(s.difficulty) &&
      board(s.givens) &&
      board(s.solution) &&
      board(s.values) &&
      s.solution.every(Boolean) &&
      !conflicts(s.solution).some(Boolean) &&
      s.givens.every(
        (v, i) => !v || (v === s.solution[i] && s.values[i] === v),
      ) &&
      Array.isArray(s.notes) &&
      s.notes.length === 81 &&
      s.notes.every((n) => Number.isInteger(n) && n >= 0 && n < 512) &&
      Number.isSafeInteger(s.seconds) &&
      s.seconds >= 0 &&
      countSolutions(s.givens) === 1 &&
      !!logicalSolve(s.givens)
    );
  } catch {
    return false;
  }
}
