import assert from "node:assert/strict";
import {
  evaluate,
  handName,
  createTable as createSixTable,
  deal,
  action,
  botAction,
  validPoker,
  pot,
  pots,
  mayRaise,
  raiseMin,
  is27,
} from "../src/games/poker/logic.ts";
import {
  generate,
  countSolutions,
  logicalSolve,
  validSudoku,
  conflicts,
  logicalStep,
} from "../src/games/sudoku/logic.ts";
import {
  generateBoard,
  modes,
  fresh,
  reveal,
  hint,
  validMine,
  neighbors,
  numbers,
} from "../src/games/mines/logic.ts";
const rng = (seed) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const card = (r, s = 0) => r - 2 + s * 13;
const createTable = () => createSixTable({ seats: Array.from({length:6}, (_,i) => ({kind:i === 0 ? 'human' : i < 4 ? 'bot' : 'empty', style:'tag'})), bounty:true });
const ranks = (rs, ss = []) => rs.map((r, i) => card(r, ss[i] ?? i % 4));
assert.equal(handName(ranks([14, 2, 3, 4, 5, 9, 10])), "顺子");
assert.equal(handName([10, 11, 12, 9, 8, 0, 13]), "同花顺");
assert.equal(handName(ranks([14, 14, 14, 14, 2, 3, 4])), "四条");
assert.equal(handName(ranks([14, 14, 14, 13, 13, 13, 3])), "葫芦");
assert(
  evaluate(ranks([14, 14, 13, 12, 11, 8, 7])) >
    evaluate(ranks([14, 14, 13, 12, 10, 8, 7])),
);
assert(
  evaluate(ranks([6, 5, 4, 3, 2, 9, 10])) >
    evaluate(ranks([14, 2, 3, 4, 5, 9, 10])),
);
assert(is27([card(2, 0), card(7, 1)]));
assert(is27([card(2, 0), card(7, 0)]));
for (const sevenSuit of [0, 1]) {
  const bountyTable=createTable();
  bountyTable.players[0].hole=[card(2,0),card(7,sevenSuit)];
  bountyTable.actor=1;bountyTable.pending=[1,2,3,0];
  assert(action(bountyTable,'fold'));assert(action(bountyTable,'fold'));assert(action(bountyTable,'fold'));
  assert(bountyTable.done);assert(bountyTable.log.some(s=>s.includes('额外收取 600')));
  assert.equal(bountyTable.players[0].chips,1630);
  assert.equal(bountyTable.players.reduce((a,p)=>a+p.chips,0),4000);
}
const shortBounty=createTable();
shortBounty.players[0].hole=[card(2,0),card(7,0)];
shortBounty.players[0].chips += shortBounty.players[1].chips - 30;shortBounty.players[1].chips=30;
shortBounty.actor=1;shortBounty.pending=[1,2,3,0];
assert(action(shortBounty,'fold'));assert(action(shortBounty,'fold'));assert(action(shortBounty,'fold'));
assert.equal(shortBounty.players[1].chips,0);
assert(shortBounty.log.some(s=>s.includes('额外收取 430')));
assert.equal(shortBounty.players.reduce((a,p)=>a+p.chips,0),4000);
const honest=createTable(),changed=structuredClone(honest);
changed.players[0].hole=[0,1];changed.players[1].hole=[2,3];changed.players[2].hole=[4,5];changed.deck=[...changed.deck].reverse();
botAction(honest,rng(123));botAction(changed,rng(123));
assert.deepEqual(honest.players[3],changed.players[3],'Bots must not use other holes or the actual deck');
const headsUp=createTable();headsUp.done=true;headsUp.players.forEach((p,i)=>p.chips=i<2?2000:0);headsUp.dealer=3;
assert(deal(headsUp,rng(123)));assert.equal(headsUp.dealer,0);assert.equal(headsUp.actor,0);assert.equal(headsUp.players[0].bet,10);assert.equal(headsUp.players[1].bet,20);
const p = (total, hole, folded = false) => ({
  name: "test",
  chips: 0,
  hole,
  bet: total,
  total,
  folded,
  playing: true,
});
const board = ranks([2, 3, 4, 8, 9], [0, 1, 2, 3, 0]);
const split = pots(
  [
    p(100, [card(14, 0), card(14, 1)]),
    p(200, [card(13, 0), card(13, 1)]),
    p(200, [card(12, 0), card(12, 1)]),
  ],
  board,
);
assert.deepEqual(split, [
  { amount: 300, winners: [0] },
  { amount: 200, winners: [1] },
]);
assert.deepEqual(
  pots(
    [p(100, [card(2, 1), card(3, 1)]), p(100, [card(4, 1), card(5, 1)])],
    [8, 9, 10, 11, 12],
  ),
  [{ amount: 200, winners: [0, 1] }],
);
const short = createTable();
short.actor = 0;
short.pending = [0, 1, 2, 3];
short.current = 100;
short.minRaise = 100;
short.acted = [1];
short.actedAt[1] = 100;
short.players.forEach((p) => {
  p.chips = 900;
  p.bet = 100;
  p.total = 100;
});
short.players[0].chips = 50;
assert(action(short, "raise", 150));
assert.equal(short.minRaise, 100);
assert(short.acted.includes(1));
assert(!mayRaise(short, 1));
assert.equal(raiseMin(short), 250);
for (let seed = 1; seed <= 12; seed++) {
  const random = rng(seed),
    s = createTable();
  for (let hand = 0; hand < 30; hand++) {
    let moves = 0;
    while (!s.done) {
      assert(validPoker(s), `invalid poker state at seed ${seed}`);
      assert(moves++ < 120, "Poker betting loop stalled");
      if (s.actor === 0) {
        const n = random();
        if (n < 0.12) action(s, "fold");
        else if (n > 0.85 && mayRaise(s))
          action(
            s,
            "raise",
            Math.min(s.players[0].bet + s.players[0].chips, raiseMin(s) + 20),
          );
        else action(s, "call");
      } else botAction(s, random);
    }
    assert(validPoker(s));
    assert.equal(
      s.players.reduce((a, p) => a + p.chips, 0),
      4000,
    );
    if (!deal(s, random)) break;
  }
}
console.log(
  "Poker: hand ranking, wheel, side pots, ties, short all-in, conservation and finite betting passed",
);
for (let seed = 1; seed <= 50; seed++) {
  const s = generate(seed % 2 ? "easy" : "normal", rng(seed));
  assert(validSudoku(s));
  assert.equal(countSolutions(s.givens), 1);
  assert.deepEqual(logicalSolve(s.givens), s.solution);
  const copy = [...s.givens];
  while (copy.some((v) => !v)) {
    const step = logicalStep(copy);
    assert(step);
    copy[step.cell] = step.value;
  }
  assert(!conflicts(copy).some(Boolean));
  assert(!validSudoku({ ...s, solution: Array(81).fill(1) }));
}
console.log(
  "Sudoku: 50 seeded puzzles, unique solutions, logic-only solving and validation passed",
);
assert.deepEqual(Object.values(modes).map(({width, height, mines}) => [width, height, mines]), [[9, 9, 10], [25, 25, 100]]);
assert(!validMine({ ...fresh("expert"), opened: Array(480).fill(0), flags: Array(480).fill(0) }));
assert(!validMine({ ...fresh("large"), opened: Array(2500).fill(0), flags: Array(2500).fill(0) }));
for (const mode of ["expert", "large"]) {
  const started = Date.now();
  for (let seed = 1; seed <= 100; seed++) {
    const m = modes[mode],
      first =
        seed === 1
          ? 0
          : seed === 2
            ? m.width * m.height - 1
            : Math.floor(rng(seed)() * m.width * m.height),
      board = generateBoard(mode, first, rng(seed));
    assert.equal(board.filter((v) => v < 0).length, m.mines);
    assert(board[first] >= 0);
    const s = fresh(mode);
    Object.assign(s, { board, first, status: "playing" });
    reveal(s, first);
    assert(validMine(s));
    const step = hint(s);
    if (step) assert.equal(board[step.cell] < 0, step.mine);
    const bomb = board.findIndex((v) => v < 0);
    s.flags[bomb] = 1;
    reveal(s, bomb);
    assert.equal(s.status, "playing");
    s.flags[bomb] = 0;
    reveal(s, bomb);
    assert.equal(s.status, "lost");
    const winning = fresh(mode);
    Object.assign(winning, { board, first, status: "playing" });
    for (let i = 0; i < board.length; i++)
      if (board[i] >= 0) reveal(winning, i);
    assert.equal(winning.status, "won");
    assert(!validMine({ ...s, board: Array(board.length).fill(0) }));
  }
  console.log(
    `Mines ${mode}: 100 random boards, correct counts, safe first click, flag safety, loss and win; ${Date.now() - started} ms`,
  );
}
