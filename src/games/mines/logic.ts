export const modes = {
  expert: { width: 9, height: 9, mines: 10, label: "9 × 9 · 10 雷" },
  large: { width: 25, height: 25, mines: 100, label: "25 × 25 · 100 雷" },
};
export type Mode = keyof typeof modes;
export function neighbors(i: number, w: number, h: number) {
  const r = Math.floor(i / w),
    c = i % w,
    out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++)
      if ((dr || dc) && r + dr >= 0 && r + dr < h && c + dc >= 0 && c + dc < w)
        out.push((r + dr) * w + c + dc);
  return out;
}
export function numbers(mines: number[], w: number, h: number) {
  const set = new Set(mines);
  return Array.from({ length: w * h }, (_, i) =>
    set.has(i) ? -1 : neighbors(i, w, h).filter((k) => set.has(k)).length,
  );
}
export function generateBoard(mode: Mode, first: number, rng = Math.random) {
  const m = modes[mode];
  const pool = Array.from({ length: m.width * m.height }, (_, i) => i).filter(
    (i) => i !== first,
  );
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return numbers(pool.slice(0, m.mines), m.width, m.height);
}
export function flood(
  board: number[],
  opened: number[],
  start: number,
  w: number,
  h: number,
  flags: number[] = [],
) {
  const queue = [start];
  let changed = 0;
  for (let k = 0; k < queue.length; k++) {
    const i = queue[k];
    if (opened[i] || flags[i] || board[i] < 0) continue;
    opened[i] = 1;
    changed++;
    if (board[i] === 0)
      for (const j of neighbors(i, w, h)) if (!opened[j]) queue.push(j);
  }
  return changed;
}
export interface MineState {
  version: 1;
  mode: Mode;
  board: number[] | null;
  opened: number[];
  flags: number[];
  status: "ready" | "playing" | "won" | "lost";
  seconds: number;
  first: number;
  hit: number;
}
export function fresh(mode: Mode = "expert"): MineState {
  const n = modes[mode].width * modes[mode].height;
  return {
    version: 1,
    mode,
    board: null,
    opened: Array(n).fill(0),
    flags: Array(n).fill(0),
    status: "ready",
    seconds: 0,
    first: -1,
    hit: -1,
  };
}
export function reveal(s: MineState, i: number) {
  if (!s.board || s.status !== "playing" || s.flags[i] || s.opened[i]) return;
  if (s.board[i] < 0) {
    s.hit = i;
    s.status = "lost";
    return;
  }
  const m = modes[s.mode];
  flood(s.board, s.opened, i, m.width, m.height, s.flags);
  if (s.opened.filter(Boolean).length === s.board.length - m.mines)
    s.status = "won";
}
export function chord(s: MineState, i: number) {
  if (!s.board || !s.opened[i] || s.board[i] <= 0 || s.status !== "playing")
    return;
  const m = modes[s.mode],
    ns = neighbors(i, m.width, m.height);
  if (ns.filter((j) => s.flags[j]).length === s.board[i])
    for (const j of ns) reveal(s, j);
}
// A modest counting hint, not a board solver: manual flags are not treated as proof.
export function hint(s: MineState) {
  if (!s.board || s.status !== "playing") return null;
  const m = modes[s.mode],
    proven = new Set<number>();
  for (let iter = 0; iter < s.board.length; iter++) {
    let changed = false;
    for (let i = 0; i < s.board.length; i++)
      if (s.opened[i]) {
        const ns = neighbors(i, m.width, m.height),
          unknown = ns.filter((j) => !s.opened[j] && !proven.has(j)),
          remaining = s.board[i] - ns.filter((j) => proven.has(j)).length;
        if (unknown.length && remaining === 0)
          return { cell: unknown[0], mine: false };
        if (unknown.length && remaining === unknown.length)
          for (const j of unknown) {
            if (!s.flags[j]) return { cell: j, mine: true };
            if (!proven.has(j)) {
              proven.add(j);
              changed = true;
            }
          }
      }
    if (!changed) return null;
  }
  return null;
}
export function validMine(v: unknown): v is MineState {
  if (!v || typeof v !== 'object') return false;
  const s = v as MineState,
    m = modes[s.mode];
  if (!m) return false;
  const n = m.width * m.height,
    binary = (a: number[]) =>
      Array.isArray(a) &&
      a.length === n &&
      a.every((v) => v === 0 || v === 1);
  if (
    s.version !== 1 ||
    !binary(s.opened) ||
    !binary(s.flags) ||
    !Number.isSafeInteger(s.seconds) ||
    s.seconds < 0 ||
    !["ready", "playing", "won", "lost"].includes(s.status)
  )
    return false;
  if (!s.board) return s.board === null && s.status === "ready" && s.first === -1 && s.hit === -1 && s.opened.every((v) => !v);
  if (
    !Array.isArray(s.board) ||
    s.board.length !== n ||
    s.board.some((v) => !Number.isInteger(v) || v < -1 || v > 8) ||
    !Number.isInteger(s.first) ||
    s.first < 0 ||
    s.first >= n ||
    s.board[s.first] < 0
  )
    return false;
  const bombs = s.board.flatMap((v, i) => (v < 0 ? [i] : []));
  const allSafe = s.opened.filter(Boolean).length === n - m.mines;
  return (
    s.status !== 'ready' &&
    (s.status === 'won' ? allSafe : !allSafe) &&
    (s.status === 'lost' ? Number.isInteger(s.hit) && s.hit >= 0 && s.hit < n && s.board[s.hit] === -1 : s.hit === -1) &&
    bombs.length === m.mines &&
    numbers(bombs, m.width, m.height).every((v, i) => v === s.board![i]) &&
    s.opened.every((v, i) => !v || s.board![i] >= 0)
  );
}
