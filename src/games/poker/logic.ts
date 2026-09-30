export type Card = number;
export const suits = ["♣", "♦", "♥", "♠"];
export const rank = (c: Card) => (c % 13) + 2;
export const suit = (c: Card) => Math.floor(c / 13);
export const cardText = (c: Card) =>
  `${["", "", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"][rank(c)]}${suits[suit(c)]}`;
export const handNames = [
  "高牌",
  "一对",
  "两对",
  "三条",
  "顺子",
  "同花",
  "葫芦",
  "四条",
  "同花顺",
];
export function shuffle<T>(values: T[], rng = Math.random) {
  const a = [...values];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function five(cards: Card[]): number {
  const rs = cards.map(rank).sort((a, b) => b - a),
    groups = [...new Set(rs)]
      .map((r) => ({ r, n: rs.filter((v) => v === r).length }))
      .sort((a, b) => b.n - a.n || b.r - a.r);
  const flush = cards.every((c) => suit(c) === suit(cards[0]));
  const unique = [...new Set(rs)];
  if (unique.includes(14)) unique.push(1);
  let straight = 0;
  for (let i = 0; i <= unique.length - 5; i++)
    if (unique[i] - unique[i + 4] === 4) {
      straight = unique[i];
      break;
    }
  let cat = 0,
    k = rs;
  if (flush && straight) {
    cat = 8;
    k = [straight];
  } else if (groups[0].n === 4) {
    cat = 7;
    k = [groups[0].r, groups[1].r];
  } else if (groups[0].n === 3 && groups[1].n === 2) {
    cat = 6;
    k = [groups[0].r, groups[1].r];
  } else if (flush) {
    cat = 5;
  } else if (straight) {
    cat = 4;
    k = [straight];
  } else if (groups[0].n === 3) {
    cat = 3;
    k = groups.map((g) => g.r);
  } else if (groups[0].n === 2 && groups[1].n === 2) {
    cat = 2;
    k = groups.map((g) => g.r);
  } else if (groups[0].n === 2) {
    cat = 1;
    k = groups.map((g) => g.r);
  }
  return [cat, ...k, ...Array(5).fill(0)]
    .slice(0, 6)
    .reduce((a, b) => a * 15 + b, 0);
}
export function evaluate(cards: Card[]): number {
  let best = 0;
  for (let a = 0; a < cards.length - 4; a++)
    for (let b = a + 1; b < cards.length - 3; b++)
      for (let c = b + 1; c < cards.length - 2; c++)
        for (let d = c + 1; d < cards.length - 1; d++)
          for (let e = d + 1; e < cards.length; e++)
            best = Math.max(
              best,
              five([cards[a], cards[b], cards[c], cards[d], cards[e]]),
            );
  return best;
}
export const handName = (cards: Card[]) =>
  handNames[Math.floor(evaluate(cards) / 15 ** 5)];
export const is27 = (cards: Card[]) =>
  cards.length === 2 &&
  cards
    .map(rank)
    .sort((a, b) => a - b)
    .join(",") === "2,7" &&
  suit(cards[0]) !== suit(cards[1]);
export interface Player {
  name: string;
  chips: number;
  hole: Card[];
  bet: number;
  total: number;
  folded: boolean;
  playing: boolean;
}
export interface Poker {
  version: 1;
  players: Player[];
  deck: Card[];
  board: Card[];
  dealer: number;
  actor: number;
  street: number;
  hand: number;
  current: number;
  minRaise: number;
  pending: number[];
  acted: number[];
  log: string[];
  done: boolean;
  result: string;
  revealed: number[];
  bounty: boolean;
}
export const SB = 10,
  BB = 20,
  BOUNTY = 20;
export function createTable(): Poker {
  const s: Poker = {
    version: 1,
    players: ["你", "阿石", "小夏", "老白"].map((name) => ({
      name,
      chips: 1000,
      hole: [],
      bet: 0,
      total: 0,
      folded: false,
      playing: false,
    })),
    deck: [],
    board: [],
    dealer: 3,
    actor: -1,
    street: 0,
    hand: 0,
    current: 0,
    minRaise: BB,
    pending: [],
    acted: [],
    log: [],
    done: true,
    result: "",
    revealed: [],
    bounty: true,
  };
  deal(s);
  return s;
}
function log(s: Poker, text: string) {
  s.log.unshift(text);
  s.log = s.log.slice(0, 24);
}
function order(s: Poker, after: number, eligible: (p: Player) => boolean) {
  return Array.from(
    { length: s.players.length },
    (_, i) => (after + i + 1) % s.players.length,
  ).filter((i) => eligible(s.players[i]));
}
const live = (p: Player) => p.playing && !p.folded;
const canAct = (p: Player) => live(p) && p.chips > 0;
export const pot = (s: Poker) => s.players.reduce((a, p) => a + p.total, 0);
export const toCall = (s: Poker, i = s.actor) =>
  Math.max(0, s.current - s.players[i].bet);
export const mayRaise = (s: Poker, i = s.actor) =>
  i >= 0 &&
  !s.acted.includes(i) &&
  s.players[i].chips > toCall(s, i) &&
  s.players.some((p, k) => k !== i && canAct(p));
export const raiseMin = (s: Poker) =>
  s.current < BB ? BB : s.current + s.minRaise;
function pay(s: Poker, i: number, amount: number) {
  const p = s.players[i],
    paid = Math.min(p.chips, Math.max(0, amount));
  p.chips -= paid;
  p.bet += paid;
  p.total += paid;
}
export function deal(s: Poker, rng = Math.random) {
  if (
    !s.done ||
    s.players.filter((p) => p.chips > 0).length < 2 ||
    s.players[0].chips === 0
  )
    return false;
  s.dealer = order(s, s.dealer, (p) => p.chips > 0)[0];
  s.hand++;
  s.street = 0;
  s.done = false;
  s.result = "";
  s.board = [];
  s.revealed = [];
  s.acted = [];
  s.deck = shuffle(
    Array.from({ length: 52 }, (_, i) => i),
    rng,
  );
  s.log = [];
  for (const p of s.players) {
    p.bet = 0;
    p.total = 0;
    p.folded = false;
    p.playing = p.chips > 0;
    p.hole = p.playing ? [s.deck.pop()!, s.deck.pop()!] : [];
  }
  const seats = order(s, s.dealer, (p) => p.playing);
  const small = seats.length === 2 ? s.dealer : seats[0],
    big = seats.length === 2 ? seats[0] : seats[1];
  pay(s, small, SB);
  pay(s, big, BB);
  s.current = BB;
  s.minRaise = BB;
  s.pending = order(s, big, canAct);
  s.actor = s.pending[0] ?? -1;
  log(s, `第 ${s.hand} 手 · 盲注 ${SB}/${BB} · 27 奖金 ${BOUNTY}/人`);
  advance(s);
  return true;
}
export interface Payout {
  amount: number;
  winners: number[];
}
export function pots(players: Player[], board: Card[]): Payout[] {
  const levels = [
    ...new Set(players.map((p) => p.total).filter((v) => v > 0)),
  ].sort((a, b) => a - b);
  let prev = 0;
  return levels.map((level) => {
    const contributors = players
        .map((p, i) => (p.total >= level ? i : -1))
        .filter((i) => i >= 0),
      amount = (level - prev) * contributors.length;
    prev = level;
    let eligible = contributors.filter((i) => live(players[i]));
    if (!eligible.length) eligible = contributors;
    let winners = eligible;
    if (eligible.length > 1) {
      const scores = eligible.map((i) =>
          evaluate([...players[i].hole, ...board]),
        ),
        max = Math.max(...scores);
      winners = eligible.filter((_, k) => scores[k] === max);
    }
    return { amount, winners };
  });
}
function finish(s: Poker) {
  const remaining = s.players
    .map((p, i) => (live(p) ? i : -1))
    .filter((i) => i >= 0);
  const payouts =
    remaining.length === 1
      ? [{ amount: pot(s), winners: remaining }]
      : pots(s.players, s.board);
  const received = Array(s.players.length).fill(0) as number[];
  for (const p of payouts) {
    const winners = order(s, s.dealer, (_) => true).filter((i) =>
      p.winners.includes(i),
    );
    const share = Math.floor(p.amount / winners.length),
      extra = p.amount % winners.length;
    winners.forEach((i, k) => {
      s.players[i].chips += share + (k < extra ? 1 : 0);
      received[i] += share + (k < extra ? 1 : 0);
    });
  }
  s.revealed = remaining.length > 1 ? remaining : [];
  const mainWinners = payouts[0]?.winners ?? [];
  if (
    s.bounty &&
    mainWinners.length === 1 &&
    is27(s.players[mainWinners[0]].hole)
  ) {
    const win = mainWinners[0];
    let bonus = 0;
    s.players.forEach((p, i) => {
      if (i !== win && p.playing) {
        const pay = Math.min(p.chips, BOUNTY);
        p.chips -= pay;
        bonus += pay;
      }
    });
    s.players[win].chips += bonus;
    s.revealed.push(win);
    log(s, `${s.players[win].name}用 2–7 不同花获胜，额外收取 ${bonus} 筹码`);
  }
  s.result = received
    .map((v, i) => (v ? `${s.players[i].name}收回 ${v}` : ""))
    .filter(Boolean)
    .join(" · ");
  log(s, s.result);
  s.done = true;
  s.actor = -1;
  s.pending = [];
}
function advance(s: Poker) {
  if (s.done) return;
  if (s.players.filter(live).length === 1) {
    finish(s);
    return;
  }
  s.pending = s.pending.filter((i) => canAct(s.players[i]));
  if (s.players.filter(canAct).length <= 1) {
    s.pending = s.pending.filter((i) => s.players[i].bet < s.current);
  }
  if (s.pending.length) {
    s.actor = s.pending[0];
    return;
  }
  if (s.street === 3) {
    finish(s);
    return;
  }
  s.street++;
  s.deck.pop();
  for (let i = 0; i < (s.street === 1 ? 3 : 1); i++)
    s.board.push(s.deck.pop()!);
  for (const p of s.players) p.bet = 0;
  s.current = 0;
  s.minRaise = BB;
  s.acted = [];
  s.pending = order(s, s.dealer, canAct);
  s.actor = s.pending[0] ?? -1;
  log(s, ["", "翻牌", "转牌", "河牌"][s.street]);
  advance(s);
}
export function action(s: Poker, type: "fold" | "call" | "raise", target = 0) {
  if (s.done || s.actor < 0) return false;
  const i = s.actor,
    p = s.players[i],
    call = toCall(s);
  if (type === "fold") {
    p.folded = true;
    log(s, `${p.name}弃牌`);
  } else if (type === "call") {
    const paid = Math.min(call, p.chips);
    pay(s, i, call);
    log(s, `${p.name}${call ? `跟注 ${paid}` : "过牌"}`);
  } else {
    if (!mayRaise(s) || !Number.isInteger(target)) return false;
    const total = Math.min(target, p.bet + p.chips);
    if (
      total <= s.current ||
      (total < raiseMin(s) && total !== p.bet + p.chips)
    )
      return false;
    const difference = total - s.current;
    const fullRaise = s.current < BB ? total >= BB : difference >= s.minRaise;
    const nextRaise = s.current < BB ? total : difference;
    pay(s, i, total - p.bet);
    s.current = total;
    if (fullRaise) {
      s.minRaise = nextRaise;
      s.acted = [];
    }
    s.pending = order(s, i, (q) => canAct(q) && q.bet < s.current);
    log(s, `${p.name}${p.chips === 0 ? "全押" : "加注到"} ${total}`);
  }
  s.acted.push(i);
  s.pending = s.pending.filter((k) => k !== i);
  advance(s);
  return true;
}
// Bots receive only their hole cards and public cards; they never inspect other holes or the actual deck.
export function equity(
  hole: Card[],
  board: Card[],
  opponents: number,
  rng = Math.random,
  trials = 28,
) {
  const unseen = Array.from({ length: 52 }, (_, i) => i).filter(
    (c) => !hole.includes(c) && !board.includes(c),
  );
  let wins = 0;
  for (let n = 0; n < trials; n++) {
    const deck = shuffle(unseen, rng),
      community = [...board, ...deck.splice(0, 5 - board.length)];
    const self = evaluate([...hole, ...community]);
    const scores = Array.from({ length: opponents }, () =>
      evaluate([...deck.splice(0, 2), ...community]),
    );
    if (scores.every((v) => self >= v))
      wins += 1 / (1 + scores.filter((v) => v === self).length);
  }
  return wins / trials;
}
export function botAction(s: Poker, rng = Math.random) {
  if (s.actor <= 0 || s.done) return;
  const i = s.actor,
    p = s.players[i],
    call = toCall(s),
    odds = call / (pot(s) + call || 1),
    chance = equity(p.hole, s.board, s.players.filter(live).length - 1, rng);
  const aggressive = i === 2 ? 0.12 : i === 3 ? -0.04 : 0;
  const bluff = rng() < (is27(p.hole) && s.bounty ? 0.24 : 0.045);
  if (mayRaise(s) && (chance + aggressive > 0.62 || bluff)) {
    const target = Math.min(
      p.bet + p.chips,
      Math.max(raiseMin(s), s.current + Math.round((pot(s) * 0.55) / 10) * 10),
    );
    if (action(s, "raise", target)) return;
  }
  if (call > 0 && chance + aggressive < odds + 0.04 && rng() > 0.12)
    action(s, "fold");
  else action(s, "call");
}
export function validPoker(v: unknown): v is Poker {
  try {
    const s = v as Poker;
    const int = (x: number) => Number.isSafeInteger(x) && x >= 0;
    const cards = (a: number[]) =>
      Array.isArray(a) && a.every((c) => int(c) && c < 52);
    return (
      s.version === 1 &&
      s.players.length === 4 &&
      s.players.every(
        (p) =>
          int(p.chips) &&
          p.chips <= 4000 &&
          int(p.bet) &&
          int(p.total) &&
          p.bet <= p.total &&
          cards(p.hole) &&
          p.hole.length === (p.playing ? 2 : 0) &&
          typeof p.folded === "boolean",
      ) &&
      s.players.reduce((a, p) => a + p.chips + (s.done ? 0 : p.total), 0) ===
        4000 &&
      cards(s.deck) &&
      cards(s.board) &&
      [0, 3, 4, 5].includes(s.board.length) &&
      new Set([...s.deck, ...s.board, ...s.players.flatMap((p) => p.hole)])
        .size ===
        [...s.deck, ...s.board, ...s.players.flatMap((p) => p.hole)].length &&
      int(s.street) &&
      s.street <= 3 &&
      int(s.dealer) &&
      s.dealer < 4 &&
      int(s.hand) &&
      s.minRaise >= BB &&
      int(s.current) &&
      Array.isArray(s.pending) &&
      s.pending.every((i) => int(i) && i < 4) &&
      Array.isArray(s.acted) &&
      s.acted.every((i) => int(i) && i < 4) &&
      Array.isArray(s.log) &&
      Array.isArray(s.revealed) &&
      s.revealed.every((i) => int(i) && i < 4) &&
      typeof s.done === "boolean" &&
      (s.done
        ? s.actor === -1
        : s.actor === s.pending[0] && canAct(s.players[s.actor]))
    );
  } catch {
    return false;
  }
}
