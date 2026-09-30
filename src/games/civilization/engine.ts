import { techs, civics, items, governments } from "./data";
export const W = 18,
  H = 12;
export type Terrain =
  "grass" | "plain" | "forest" | "hill" | "mountain" | "water" | "desert";
export interface Tile {
  q: number;
  r: number;
  terrain: Terrain;
  resource: string;
  river: boolean;
  village: boolean;
  owner: number;
  city: number;
  district: string;
  improvement: string;
  seen: boolean;
}
export interface Unit {
  id: number;
  owner: number;
  type: string;
  tile: number;
  hp: number;
  moves: number;
  charges: number;
  xp: number;
}
export interface City {
  id: number;
  owner: number;
  name: string;
  tile: number;
  capital: boolean;
  pop: number;
  food: number;
  hp: number;
  buildings: string[];
  production: string;
  progress: number;
  target: number;
  religion: number;
}
export interface Nation {
  name: string;
  gold: number;
  faith: number;
  tech: string[];
  civic: string[];
  research: string;
  culture: string;
  science: number;
  cult: number;
  boosts: string[];
  policies: string[];
  government: string;
  war: boolean;
  trade: number;
  religion: boolean;
  tourism: number;
}
export interface State {
  version: 1;
  seed: number;
  turn: number;
  tiles: Tile[];
  units: Unit[];
  cities: City[];
  nations: Nation[];
  next: number;
  log: string[];
  winner: string;
  envoys: number;
  great: number;
}
export const info = (id: string) => items.find((x) => x.id === id)!;
export function distance(a: Tile, b: Tile) {
  return (
    (Math.abs(a.q - b.q) +
      Math.abs(a.r - b.r) +
      Math.abs(a.q + a.r - b.q - b.r)) /
    2
  );
}
export function neighbors(s: State, i: number) {
  return s.tiles
    .map((t, k) => (distance(t, s.tiles[i]) === 1 ? k : -1))
    .filter((k) => k >= 0);
}
export function message(s: State, m: string) {
  s.log.unshift(`第 ${s.turn} 回合 · ${m}`);
  s.log = s.log.slice(0, 40);
}
function random(s: State) {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
export function spawn(s: State, owner: number, type: string, tile: number) {
  const d = info(type);
  s.units.push({
    id: s.next++,
    owner,
    type,
    tile,
    hp: 100,
    moves: d.moves ?? 2,
    charges:
      type === "builder"
        ? 3 +
          (s.nations[owner].policies.includes("serfdom") ? 2 : 0) +
          (s.cities.some(
            (c) => c.owner === owner && c.buildings.includes("pyramids"),
          )
            ? 1
            : 0)
        : 3,
    xp: 0,
  });
}
export function reveal(s: State) {
  for (const u of s.units.filter((u) => u.owner === 0))
    for (const t of s.tiles)
      if (distance(t, s.tiles[u.tile]) <= 2) t.seen = true;
  for (const c of s.cities.filter((c) => c.owner === 0))
    for (const t of s.tiles)
      if (distance(t, s.tiles[c.tile]) <= 3) t.seen = true;
}
export function create(seed = Date.now() >>> 0): State {
  const s: State = {
    version: 1,
    seed,
    turn: 1,
    tiles: [],
    units: [],
    cities: [],
    nations: [],
    next: 1,
    log: [],
    winner: "",
    envoys: 0,
    great: 0,
  };
  for (let r = 0; r < H; r++)
    for (let q = 0; q < W; q++) {
      const v = random(s);
      s.tiles.push({
        q,
        r,
        terrain:
          v < 0.12
            ? "water"
            : v < 0.2
              ? "mountain"
              : v < 0.37
                ? "forest"
                : v < 0.52
                  ? "hill"
                  : v < 0.62
                    ? "desert"
                    : v < 0.8
                      ? "plain"
                      : "grass",
        resource:
          random(s) < 0.15
            ? ["小麦", "牲畜", "铁", "香料"][Math.floor(random(s) * 4)]
            : "",
        river: random(s) < 0.17,
        village: random(s) < 0.045,
        owner: -1,
        city: -1,
        district: "",
        improvement: "",
        seen: false,
      });
    }
  s.nations = ["华夏", "罗马", "埃及"].map((name) => ({
    name,
    gold: 40,
    faith: 0,
    tech: [],
    civic: [],
    research: "pottery",
    culture: "laws",
    science: 0,
    cult: 0,
    boosts: [],
    policies: [],
    government: "chief",
    war: false,
    trade: 0,
    religion: false,
    tourism: 0,
  }));
  for (const [owner, tile] of [
    [0, 39],
    [1, 67],
    [2, 173],
  ]) {
    s.tiles[tile].terrain = "grass";
    s.tiles[tile].river = true;
    spawn(s, owner, "settler", tile);
    spawn(s, owner, "warrior", neighbors(s, tile)[0]);
    if (owner)
      found(
        s,
        s.units.find((u) => u.owner === owner && u.type === "settler")!,
      );
  }
  reveal(s);
  message(s, "开拓者可以就地建城。选中单位，再点相邻地块移动。");
  return s;
}
export function boost(s: State, owner: number, id: string) {
  const n = s.nations[owner];
  if (!n.boosts.includes(id)) {
    n.boosts.push(id);
    if (owner === 0)
      message(
        s,
        `触发${techs.some((t) => t.id === id) ? "尤里卡" : "鼓舞"}：${[...techs, ...civics].find((t) => t.id === id)?.name ?? id}`,
      );
  }
}
export function found(s: State, u: Unit) {
  if (u.type !== "settler" || !u.moves) return false;
  const t = s.tiles[u.tile];
  if (
    t.terrain === "water" ||
    t.terrain === "mountain" ||
    s.cities.some((c) => distance(t, s.tiles[c.tile]) < 4)
  )
    return false;
  const count = s.cities.filter((c) => c.owner === u.owner).length;
  const id = s.next++;
  s.cities.push({
    id,
    owner: u.owner,
    name: [
      ["长安", "洛阳", "成都", "杭州", "南京"],
      ["罗马", "安提乌姆", "库迈"],
      ["底比斯", "孟菲斯", "赫利奥波利斯"],
    ][u.owner][count % (u.owner === 0 ? 5 : 3)]!,
    tile: u.tile,
    capital: count === 0,
    pop: 1,
    food: 0,
    hp: 200,
    buildings: [],
    production: "monument",
    progress: 0,
    target: -1,
    religion: -1,
  });
  t.city = id;
  t.village = false;
  for (const k of [u.tile, ...neighbors(s, u.tile)])
    if (s.tiles[k].owner === -1) s.tiles[k].owner = u.owner;
  s.units = s.units.filter((x) => x.id !== u.id);
  boost(s, u.owner, "pottery");
  boost(s, u.owner, "laws");
  reveal(s);
  return true;
}
export function tileYield(t: Tile) {
  let food =
    t.terrain === "grass"
      ? 2
      : t.terrain === "plain" || t.terrain === "forest"
        ? 1
        : 0;
  let production =
    t.terrain === "hill"
      ? 2
      : t.terrain === "forest" || t.terrain === "plain"
        ? 1
        : 0;
  let gold = t.resource === "香料" ? 2 : 0;
  if (t.resource === "小麦" || t.resource === "牲畜") food++;
  if (t.resource === "铁") production++;
  if (t.improvement === "farm") food += 2;
  if (t.improvement === "mine") production += 2;
  if (t.improvement === "pasture") {
    food++;
    production++;
  }
  return { food, production, gold };
}
export function yields(s: State, c: City) {
  const n = s.nations[c.owner];
  const b = c.buildings;
  const tiles = s.tiles
    .filter(
      (t) =>
        t.owner === c.owner &&
        distance(t, s.tiles[c.tile]) <= 2 &&
        !t.district &&
        t.city < 0 &&
        t.terrain !== "water" &&
        t.terrain !== "mountain",
    )
    .sort((a, b) => {
      const x = tileYield(a),
        y = tileYield(b);
      return y.food + y.production - x.food - x.production;
    })
    .slice(0, c.pop);
  let food = 2,
    production = 2,
    gold = 2,
    science = c.pop * 0.5,
    culture = c.pop * 0.3,
    faith = 0,
    tourism = 0;
  for (const t of tiles) {
    const y = tileYield(t);
    food += y.food;
    production += y.production;
    gold += y.gold;
  }
  if (b.includes("granary")) food++;
  if (b.includes("monument")) culture += 2;
  if (b.includes("campus")) science += 2;
  if (b.includes("library")) science += 2;
  if (b.includes("university")) science += 4;
  if (b.includes("commercial")) gold += 4;
  if (b.includes("market")) gold += 3;
  if (b.includes("theater")) {
    culture += 3;
    tourism += 2;
  }
  if (b.includes("museum")) {
    culture += 3;
    tourism += 6;
  }
  if (b.includes("holy")) faith += 4;
  if (b.includes("industrial")) production += 4;
  if (b.includes("factory")) production += 5;
  if (b.includes("pyramids")) culture += 3;
  if (b.includes("libraryWonder")) science += 8;
  for (const t of s.tiles.filter(
    (t) =>
      t.owner === c.owner && t.district && distance(t, s.tiles[c.tile]) <= 3,
  )) {
    const ns = neighbors(s, s.tiles.indexOf(t)).map((i) => s.tiles[i]);
    if (t.district === "campus")
      science += ns.filter((t) => t.terrain === "mountain").length;
    if (t.district === "holy")
      faith += ns.filter((t) => t.terrain === "mountain").length;
    if (t.district === "industrial")
      production += ns.filter((t) => t.improvement === "mine").length;
  }
  if (n.policies.includes("planning")) production++;
  if (n.policies.includes("rational")) science *= 1.25;
  if (n.government === "republic") culture++;
  if (n.government === "democracy") production *= 1.2;
  gold += n.trade;
  food += n.trade * 0.5;
  return {
    food,
    production,
    gold,
    science,
    culture,
    faith,
    tourism: tourismSafe(tourism, n),
    housing:
      5 +
      (s.tiles[c.tile].river ? 2 : 0) +
      (b.includes("granary") ? 2 : 0) +
      (b.includes("aqueduct") ? 4 : 0),
  };
}
function tourismSafe(v: number, n: Nation) {
  return v * (n.tech.includes("flight") ? 2 : 1);
}
export function available(s: State, c: City, id: string) {
  const d = info(id),
    n = s.nations[c.owner];
  if (
    !d ||
    (d.unlock && !n.tech.includes(d.unlock) && !n.civic.includes(d.unlock)) ||
    (d.needs && !c.buildings.includes(d.needs))
  )
    return false;
  if (d.kind !== "unit" && c.buildings.includes(id)) return false;
  if (d.kind === "wonder" && s.cities.some((c) => c.buildings.includes(id)))
    return false;
  if (id === "settler" && c.pop < 2) return false;
  if (
    id === "sword" &&
    !s.tiles.some(
      (t) =>
        t.owner === c.owner && t.resource === "铁" && t.improvement === "mine",
    )
  )
    return false;
  if (
    d.kind === "district" &&
    id !== "spaceport" &&
    c.buildings.filter((b) => info(b)?.kind === "district" && b !== "spaceport")
      .length >=
      1 + Math.floor((c.pop - 1) / 3)
  )
    return false;
  return true;
}
export function chooseProduction(s: State, c: City, id: string, target = -1) {
  if (!available(s, c, id)) return false;
  if (info(id).kind === "district") {
    const t = s.tiles[target];
    if (
      !t ||
      t.owner !== c.owner ||
      t.city >= 0 ||
      t.district ||
      ["water", "mountain"].includes(t.terrain) ||
      distance(t, s.tiles[c.tile]) > 3
    )
      return false;
  }
  c.production = id;
  c.progress = 0;
  c.target = target;
  return true;
}
function strength(s: State, u: Unit) {
  return (
    (info(u.type).strength ?? 0) +
    (s.nations[u.owner].policies.includes("discipline") ? 5 : 0) +
    Math.floor(u.xp / 3) * 3 +
    (s.nations[u.owner].government === "oligarchy" ? 4 : 0) -
    (100 - u.hp) * 0.05
  );
}
export function act(s: State, u: Unit, to: number) {
  if (!u.moves || s.winner) return false;
  const t = s.tiles[to],
    d = distance(s.tiles[u.tile], t),
    enemy = s.units.find((v) => v.tile === to && v.owner !== u.owner),
    city = s.cities.find((c) => c.tile === to && c.owner !== u.owner);
  if (enemy || city) {
    const owner = (enemy ?? city)!.owner;
    if (u.owner === 0 ? !s.nations[owner].war : owner !== 0 || !s.nations[u.owner].war) return false;
    if (d > (info(u.type).range ?? 1) || !info(u.type).strength) return false;
    const attack = strength(s, u),
      defend = enemy
        ? strength(s, enemy) +
          (t.terrain === "hill" || t.terrain === "forest" ? 3 : 0)
        : 25 + (city!.buildings.includes("walls") ? 15 : 0);
    const damage = Math.round(30 * Math.exp((attack - defend) / 25));
    if (enemy) {
      enemy.hp -= damage;
      if (!info(u.type).range)
        u.hp -= Math.round(30 * Math.exp((defend - attack) / 25));
      if (enemy.hp <= 0) {
        s.units = s.units.filter((v) => v.id !== enemy.id);
        u.xp++;
        boost(s, u.owner, "archery");
        if (u.xp >= 2) boost(s, u.owner, "bronze");
        if (!info(u.type).range) u.tile = to;
      }
    } else {
      city!.hp = Math.max(0, city!.hp - damage);
      if (!info(u.type).range) {
        u.hp -= 20;
        if (city!.hp === 0) {
          city!.owner = u.owner;
          city!.hp = 100;
          u.tile = to;
          for (const tile of s.tiles)
            if (distance(tile, t) <= 1) tile.owner = u.owner;
          message(s, `${city!.name}被攻占`);
        }
      }
    }
    u.moves = 0;
    s.units = s.units.filter((v) => v.hp > 0);
    reveal(s);
    return true;
  }
  if (
    d !== 1 ||
    ["mountain", "water"].includes(t.terrain) ||
    s.units.some((v) => v.tile === to && v.id !== u.id)
  )
    return false;
  const cost = t.terrain === "hill" || t.terrain === "forest" ? 2 : 1;
  if (u.moves < cost) return false;
  u.tile = to;
  u.moves -= cost;
  if (t.village) {
    t.village = false;
    s.nations[u.owner].gold += 35;
    message(s, "部落村庄赠予 35 金币");
  }
  if (t.terrain === "hill") boost(s, u.owner, "mining");
  if (t.resource === "牲畜") boost(s, u.owner, "animals");
  if (
    s.units.some(
      (v) => v.owner !== u.owner && distance(s.tiles[v.tile], t) <= 2,
    ) ||
    s.cities.some(
      (c) => c.owner !== u.owner && distance(s.tiles[c.tile], t) <= 2,
    )
  ) {
    boost(s, u.owner, "writing");
    boost(s, u.owner, "trade");
  }
  reveal(s);
  return true;
}
export function improve(s: State, u: Unit, type: string) {
  const t = s.tiles[u.tile],
    n = s.nations[u.owner];
  if (
    u.type !== "builder" ||
    !u.moves ||
    !u.charges ||
    t.owner !== u.owner ||
    t.city >= 0 ||
    t.district ||
    t.improvement
  )
    return false;
  if (
    type === "mine" &&
    ((t.terrain !== "hill" && t.resource !== "铁") ||
      !n.tech.includes("mining"))
  )
    return false;
  if (
    type === "pasture" &&
    (t.resource !== "牲畜" || !n.tech.includes("animals"))
  )
    return false;
  if (type === "farm" && !["plain", "grass", "desert"].includes(t.terrain))
    return false;
  t.improvement = type;
  u.charges--;
  u.moves = 0;
  if (type === "mine") boost(s, u.owner, "masonry");
  if (s.tiles.filter((t) => t.owner === u.owner && t.improvement).length >= 3)
    boost(s, u.owner, "craft");
  if (!u.charges) s.units = s.units.filter((v) => v.id !== u.id);
  return true;
}
export function spread(s: State, u: Unit) {
  if (
    u.type !== "missionary" ||
    !u.moves ||
    !u.charges ||
    !s.nations[u.owner].religion
  )
    return false;
  const c = s.cities.find(
    (c) =>
      distance(s.tiles[c.tile], s.tiles[u.tile]) <= 1 && c.religion !== u.owner,
  );
  if (!c) return false;
  c.religion = u.owner;
  u.charges--;
  u.moves = 0;
  if (!u.charges) s.units = s.units.filter((v) => v.id !== u.id);
  return true;
}
export function researchAvailable(n: Nation, id: string, civic = false) {
  const list = civic ? civics : techs,
    done = civic ? n.civic : n.tech;
  const d = list.find((t) => t.id === id);
  return !!d && !done.includes(id) && d.requires.every((r) => done.includes(r));
}
function advance(s: State, owner: number, civic: boolean, amount: number) {
  const n = s.nations[owner],
    key = civic ? "culture" : "research",
    progress = civic ? "cult" : "science",
    done = civic ? n.civic : n.tech,
    list = civic ? civics : techs;
  let d = list.find((t) => t.id === n[key]);
  if (!d || !researchAvailable(n, d.id, civic)) {
    n[key] = list.find((t) => researchAvailable(n, t.id, civic))?.id ?? "";
    d = list.find((t) => t.id === n[key]);
  }
  if (!d) return;
  n[progress] += amount;
  const cost = d.cost * (n.boosts.includes(d.id) ? 0.6 : 1);
  if (n[progress] >= cost) {
    n[progress] -= cost;
    done.push(d.id);
    if (!owner) message(s, `${civic ? "市政" : "科技"}完成：${d.name}`);
    n[key] = list.find((t) => researchAvailable(n, t.id, civic))?.id ?? "";
    if (civic && owner === 0) s.envoys++;
  }
}
function ai(s: State, owner: number) {
  const n = s.nations[owner];
  for (const c of s.cities.filter((c) => c.owner === owner)) {
    if (!c.production) {
      const choice = items.filter(
        (d) => available(s, c, d.id) && d.id !== "missionary",
      );
      const d = choice[Math.floor(random(s) * choice.length)];
      if (d) {
        const target =
          d.kind === "district"
            ? s.tiles.findIndex(
                (t) =>
                  t.owner === owner &&
                  t.city < 0 &&
                  !t.district &&
                  !["water", "mountain"].includes(t.terrain) &&
                  distance(t, s.tiles[c.tile]) <= 3,
              )
            : -1;
        chooseProduction(s, c, d.id, target);
      }
    }
  }
  for (const u of [...s.units.filter((u) => u.owner === owner)]) {
    if (u.type === "settler" && found(s, u)) continue;
    if (u.type === "builder") {
      if (improve(s, u, s.tiles[u.tile].terrain === "hill" ? "mine" : "farm"))
        continue;
    }
    let options = neighbors(s, u.tile).filter(
      (i) => !["water", "mountain"].includes(s.tiles[i].terrain),
    );
    const target = s.cities.find((c) => c.owner === 0);
    if (n.war && target)
      options.sort(
        (a, b) =>
          distance(s.tiles[a], s.tiles[target.tile]) -
          distance(s.tiles[b], s.tiles[target.tile]),
      );
    else options.sort(() => random(s) - 0.5);
    for (const i of options) if (act(s, u, i)) break;
  }
  if (s.turn > 35 && s.turn % 20 === 0 && random(s) < 0.45) {
    n.war = true;
    message(s, `${n.name}宣战`);
  }
}
export function nextTurn(s: State) {
  if (s.winner) return;
  for (let owner = 0; owner < s.nations.length; owner++) {
    const n = s.nations[owner];
    if (owner) ai(s, owner);
    let science = 1,
      culture = 1,
      tourism = 0;
    for (const c of s.cities.filter((c) => c.owner === owner)) {
      const y = yields(s, c);
      science += y.science;
      culture += y.culture;
      tourism += y.tourism;
      n.gold += y.gold;
      n.faith += y.faith;
      c.food +=
        Math.max(0, y.food - c.pop * 2) * (c.pop >= y.housing ? 0.25 : 1);
      if (c.food >= 12 + c.pop * 6) {
        c.food -= 12 + c.pop * 6;
        c.pop++;
      }
      c.hp = Math.min(200, c.hp + 10);
      const d = items.find((d) => d.id === c.production);
      if (d) {
        c.progress +=
          y.production *
          (n.policies.includes("labor") && d.kind !== "unit"
            ? 1.3
            : n.policies.includes("colonial") && d.id === "settler"
              ? 1.5
              : 1);
        if (c.progress >= d.cost) {
          if (d.kind === "unit") {
            const at = [c.tile, ...neighbors(s, c.tile)].find(
              (i) =>
                !s.units.some((u) => u.tile === i) &&
                !["water", "mountain"].includes(s.tiles[i].terrain),
            );
            if (at === undefined) {
              c.progress = d.cost;
              continue;
            }
            spawn(s, owner, d.id, at);
            if (d.id === "settler") c.pop = Math.max(1, c.pop - 1);
          } else {
            if (
              d.kind === "wonder" &&
              s.cities.some((c) => c.buildings.includes(d.id))
            ) {
              n.gold += c.progress;
            } else {
              c.buildings.push(d.id);
              if (d.kind === "district" && s.tiles[c.target])
                s.tiles[c.target].district = d.id;
            }
          }
          if (!owner) message(s, `${c.name}完成${d.name}`);
          c.production = "";
          c.progress = 0;
          if (d.id === "university") boost(s, owner, "rocketry");
          if (d.id === "spaceport") boost(s, owner, "satellites");
          if (d.id === "satellite") boost(s, owner, "robotics");
          if (d.kind === "wonder") boost(s, owner, "drama");
        }
      }
      if (s.turn % 8 === 0) {
        const t = s.tiles.find(
          (t) => t.owner === -1 && distance(t, s.tiles[c.tile]) <= 2,
        );
        if (t) t.owner = owner;
      }
    }
    n.gold = Math.max(
      0,
      n.gold -
        s.units.filter((u) => u.owner === owner && info(u.type).strength)
          .length *
          0.5,
    );
    advance(s, owner, false, science);
    advance(s, owner, true, culture);
    n.tourism += tourism;
    if (!owner) s.great += science * 0.1;
    const pop = s.cities
      .filter((c) => c.owner === owner)
      .reduce((a, c) => a + c.pop, 0);
    if (pop >= 6) boost(s, owner, "empire");
    if (pop >= 20) boost(s, owner, "democracy");
    if (n.trade >= 1) boost(s, owner, "currency");
    if (n.trade >= 2) boost(s, owner, "exploration");
    if (n.religion) boost(s, owner, "theology");
    if (n.tourism >= 100) boost(s, owner, "media");
    const cities = s.cities.filter((c) => c.owner === owner);
    if (cities.some((c) => c.buildings.includes("walls")))
      boost(s, owner, "engineering");
    if (cities.filter((c) => c.buildings.includes("campus")).length >= 2)
      boost(s, owner, "education");
    if (cities.filter((c) => c.buildings.includes("theater")).length >= 2)
      boost(s, owner, "humanism");
    if (cities.some((c) => c.buildings.some((b) => info(b).kind === "wonder")))
      boost(s, owner, "flight");
    if (
      s.units.filter((u) => u.owner === owner && info(u.type).strength)
        .length >= 3
    )
      boost(s, owner, "machinery");
    if (
      s.tiles.filter((t) => t.owner === owner && t.improvement === "mine")
        .length >= 3
    )
      boost(s, owner, "industry");
    if (
      s.tiles.filter((t) => t.owner === owner && t.improvement === "farm")
        .length >= 6
    )
      boost(s, owner, "feudal");
    if (s.cities.filter((c) => c.owner === owner).length >= 3)
      boost(s, owner, "philosophy");
    if (s.cities.some((c) => c.owner === owner && c.buildings.includes("mars")))
      s.winner = `${n.name} · 科学胜利`;
    if (n.tourism >= 800 && n.civic.includes("media"))
      s.winner = `${n.name} · 文化胜利`;
    if (s.cities.filter((c) => c.capital).every((c) => c.owner === owner))
      s.winner = `${n.name} · 征服胜利`;
    if (n.religion && s.cities.every((c) => c.religion === owner))
      s.winner = `${n.name} · 宗教胜利`;
  }
  s.turn++;
  for (const u of s.units) {
    u.moves = info(u.type).moves ?? 2;
    u.hp = Math.min(100, u.hp + (s.tiles[u.tile].owner === u.owner ? 15 : 5));
  }
  if (s.turn > 250 && !s.winner) {
    const scores = s.nations.map(
      (n, i) =>
        n.tech.length * 5 +
        n.civic.length * 5 +
        s.cities
          .filter((c) => c.owner === i)
          .reduce((a, c) => a + c.pop * 3 + 20, 0),
    );
    s.winner = `${s.nations[scores.indexOf(Math.max(...scores))].name} · 分数胜利`;
  }
  reveal(s);
}
export function valid(value: unknown): value is State {
  try {
    const s = value as State;
    return (
      s.version === 1 &&
      Number.isInteger(s.turn) &&
      s.turn > 0 &&
      s.tiles.length === W * H &&
      s.nations.length === 3 &&
      s.tiles.every(
        (t) =>
          Number.isInteger(t.q) &&
          Number.isInteger(t.r) &&
          [
            "grass",
            "plain",
            "forest",
            "hill",
            "mountain",
            "water",
            "desert",
          ].includes(t.terrain),
      ) &&
      s.units.every(
        (u) =>
          !!items.find((i) => i.id === u.type && i.kind === "unit") &&
          Number.isInteger(u.tile) &&
          u.tile >= 0 &&
          u.tile < W * H &&
          u.owner >= 0 &&
          u.owner < 3 &&
          Number.isFinite(u.hp),
      ) &&
      s.cities.every(
        (c) => c.tile >= 0 && c.tile < W * H && Array.isArray(c.buildings),
      ) &&
      Array.isArray(s.log) &&
      s.nations.every(
        (n) =>
          Array.isArray(n.tech) &&
          Array.isArray(n.civic) &&
          Array.isArray(n.policies),
      )
    );
  } catch {
    return false;
  }
}
export function slots(s: State) {
  return governments.find((g) => g.id === s.nations[0].government)?.slots ?? 2;
}
