import type { State, Tile } from "./model";
export const HEX = 34,
  DX = Math.sqrt(3) * HEX,
  DY = HEX * 1.5;
export function distance(a: Pick<Tile, "q" | "r">, b: Pick<Tile, "q" | "r">) {
  return (
    (Math.abs(a.q - b.q) +
      Math.abs(a.r - b.r) +
      Math.abs(a.q + a.r - b.q - b.r)) /
    2
  );
}
export function neighbors(
  s: Pick<State, "tiles" | "width" | "height">,
  i: number,
): number[] {
  const t = s.tiles[i];
  if (!t) return [];
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, -1],
    [-1, 1],
  ].flatMap(([dq, dr]) => {
    const q = t.q + dq,
      r = t.r + dr;
    return q >= 0 && q < s.width && r >= 0 && r < s.height
      ? [r * s.width + q]
      : [];
  });
}
export function center(t: Pick<Tile, "q" | "r">) {
  return { x: HEX + DX * (t.q + t.r / 2), y: HEX + DY * t.r };
}
export const hexPoints = Array.from({ length: 6 }, (_, i) => {
  const a = ((60 * i - 30) * Math.PI) / 180;
  return `${HEX * Math.cos(a)},${HEX * Math.sin(a)}`;
}).join(" ");
export function random(s: { seed: number }) {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
export function mapDimensions(s: State) {
  return {
    width: DX * (s.width + (s.height - 1) / 2) + HEX,
    height: DY * (s.height - 1) + HEX * 2,
  };
}
