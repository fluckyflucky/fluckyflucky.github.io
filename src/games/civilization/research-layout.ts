import type { Research } from './catalog';
import { researchPrerequisites } from './research';

export const researchGeometry = { width: 184, height: 92, column: 256, row: 128, left: 12, top: 36 };
type Point = { x: number; y: number };
export interface ResearchConnection {
  from: string;
  to: string;
  points: Point[];
  path: string;
}

export function researchLayout(rows: Research[]) {
  const g = researchGeometry;
  const columns = Array.from({ length: Math.max(...rows.map(r => r.column)) + 1 }, (_, column) =>
    rows.filter(r => r.column === column).map(r => r.id));
  const parents = new Map(rows.map(r => [r.id, researchPrerequisites(r)]));
  const children = new Map(rows.map(r => [r.id, rows.filter(next => researchPrerequisites(next).includes(r.id)).map(next => next.id)]));
  const ranks = new Map<string, number>();
  const rank = () => columns.forEach(ids => ids.forEach((id, row) => ranks.set(id, row)));
  rank();
  // Neighbour order reduces crossings without altering eras or prerequisites.
  for (let pass = 0; pass < 6; pass++) {
    const forward = pass % 2 === 0, neighbours = forward ? parents : children;
    for (const ids of (forward ? columns : [...columns].reverse())) {
      const score = (id: string) => {
        const linked = neighbours.get(id)!;
        return linked.length ? linked.reduce((sum, pre) => sum + ranks.get(pre)!, 0) / linked.length : ranks.get(id)!;
      };
      ids.sort((a, b) => score(a) - score(b) || ranks.get(a)! - ranks.get(b)!);
      rank();
    }
  }
  const positions: Record<string, Point> = Object.fromEntries(rows.map(r => [r.id,
    { x: g.left + r.column * g.column, y: g.top + ranks.get(r.id)! * g.row }]));
  const edges = rows.flatMap(r => parents.get(r.id)!.map(from => ({ from, to: r.id })));
  const outgoing = (id: string) => edges.filter(e => e.from === id);
  const incoming = (id: string) => edges.filter(e => e.to === id);
  const longEdges = edges.filter(e => positions[e.to].x - positions[e.from].x > g.column);
  const bandFor = (e: {from:string;to:string}) => Math.floor((ranks.get(e.from)! + ranks.get(e.to)!) / 2);
  const connections: ResearchConnection[] = edges.map(edge => {
    const a = positions[edge.from], b = positions[edge.to];
    const start = { x: a.x + g.width, y: a.y + g.height / 2 };
    const end = { x: b.x, y: b.y + g.height / 2 };
    let points: Point[];
    if (b.x - a.x === g.column) {
      const siblings = edges.filter(e => positions[e.from].x === a.x && positions[e.to].x === b.x);
      const lane = start.x + 12 + 48 * (siblings.indexOf(edge) + 1) / (siblings.length + 1);
      points = [start, { x: lane, y: start.y }, { x: lane, y: end.y }, end];
    } else {
      // Long links travel between rows, never through intervening cards.
      const band = bandFor(edge), tracks = longEdges.filter(e => bandFor(e) === band);
      const across = g.top + band * g.row + g.height + 8 + 20 * (tracks.indexOf(edge) + 1) / (tracks.length + 1);
      const out = outgoing(edge.from), into = incoming(edge.to);
      const exit = start.x + 10 + 22 * (out.indexOf(edge) + 1) / (out.length + 1);
      const enter = end.x - 10 - 22 * (into.indexOf(edge) + 1) / (into.length + 1);
      points = [start, { x: exit, y: start.y }, { x: exit, y: across },
        { x: enter, y: across }, { x: enter, y: end.y }, end];
    }
    return { ...edge, points, path: points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ') };
  });
  return { positions, connections,
    width: columns.length * g.column,
    height: g.top + Math.max(...columns.map(ids => ids.length)) * g.row };
}
