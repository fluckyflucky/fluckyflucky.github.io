import assert from "node:assert/strict";
import { moduleUrl } from "./civilization-test-module.mjs";
const w = await import(moduleUrl("src/games/civilization/world.ts"));
const c = await import(moduleUrl("src/games/civilization/catalog.ts"));
const saves = await import(moduleUrl("src/games/civilization/saves.ts"));
const legacy = await import(moduleUrl("src/games/civilization/engine.ts"));
let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log("✓ " + name);
}
const setup = (options = {}) => {
  const s = w.create({
    seed: 42,
    size: "compact",
    difficulty: "relaxed",
    ...options,
  });
  assert(
    w.found(
      s,
      s.units.find((u) => u.owner === 0 && u.type === "settler"),
    ),
  );
  return s;
};
const clone = (v) => JSON.parse(JSON.stringify(v));
test("research catalog is a complete acyclic dependency graph", () => {
  for (const tree of [c.techs, c.civics]) {
    const known = new Set(),
      pending = [...tree];
    while (pending.length) {
      const index = pending.findIndex((t) =>
        t.requires.every((id) => known.has(id)),
      );
      assert(index >= 0, "missing prerequisite or cycle");
      known.add(pending.splice(index, 1)[0].id);
    }
    assert.equal(known.size, tree.length);
  }
  for (const item of c.items) {
    if (item.unlock)
      assert([...c.techs, ...c.civics].some((r) => r.id === item.unlock));
    if (item.needs) assert(c.itemMap[item.needs]);
  }
});
test("new maps have three major starts and two real city states", () => {
  for (const size of ["compact", "standard"])
    for (let seed = 1; seed <= 15; seed++) {
      const s = w.create({ seed, size });
      assert(saves.valid(s));
      assert.equal(s.cities.length, 4);
      assert(
        w.canFound(
          s,
          s.units.find((u) => u.owner === 0 && u.type === "settler"),
        ),
      );
      assert(s.units.length >= 6 && s.units.length <= 9);
    }
});
test("research switching retains separate progress; no currency transfer", () => {
  const s = setup(),
    n = s.nations[0];
  w.advance(s, 0, false, 4);
  const invested = n.researchProgress.pottery;
  assert(w.chooseResearch(s, "mining"));
  w.advance(s, 0, false, 3);
  assert.equal(n.researchProgress.pottery, invested);
  assert.equal(n.researchProgress.mining, 3);
  assert(!w.chooseResearch(s, "rocketry"));
});
test("boosts are idempotent, civilization-specific, with overflow research", () => {
  const s = setup(),
    n = s.nations[0],
    d = c.techs.find(t=>t.id==='astrology');
  assert.equal(w.researchCost(s, n, d), 34);
  w.boost(s, 0, "astrology");
  w.boost(s, 0, "astrology");
  assert.equal(n.boosts.filter((x) => x === "astrology").length, 1);
  assert.equal(w.researchCost(s,n,d),17);
  w.boost(s,0,'pottery');
  assert(!n.boosts.includes('pottery'), 'pottery has no eureka');
  w.advance(s, 0, false, 100);
  assert(n.tech.includes("pottery"));
  assert(n.tech.includes("mining"));
  assert(Object.values(n.researchProgress).some(v=>v>0));
});
test("city yields only use its own tiles and district adjacency", () => {
  const s = setup(),
    city = s.cities.find((c) => c.owner === 0),
    a = w.yields(s, city);
  const foreign = s.tiles.find((t) => t.owner === 1 && t.district === "");
  foreign.district = "campus";
  assert.deepEqual(w.yields(s, city), a);
  const ids = w.workedTiles(s, city);
  assert(ids.every((i) => s.tiles[i].territory === city.id));
  assert.equal(new Set(ids).size, ids.length);
});
test("production queue preserves investments and reserves district tiles", () => {
  const s = setup(),
    n = s.nations[0],
    city = s.cities.find((c) => c.owner === 0);
  n.tech.push("pottery", "writing");
  city.queue = [];
  const target = s.tiles.findIndex(
    (t) => t.territory === city.id && t.city < 0 && t.terrain !== "water",
  );
  assert(w.enqueue(s, city, "campus", target));
  assert(w.placementReason(s, city, "holy", target));
  city.invested[w.jobKey(city.queue[0])] = 7;
  city.queue.shift();
  assert(w.enqueue(s, city, "campus", target));
  assert.equal(city.invested[w.jobKey(city.queue[0])], 7);
  assert(!w.enqueue(s, city, "campus", target));
});
test("unit movement consumes terrain costs and cannot teleport or enter mountains", () => {
  const s = setup(),
    u = s.units.find((u) => u.owner === 0),
    ns = w.neighbors(s, u.tile);
  for (const i of ns) {
    s.tiles[i].seen = true;
    s.tiles[i].terrain = "grass";
    s.units = s.units.filter((v) => v.id === u.id || v.tile !== i);
  }
  u.moves = 2;
  const to = ns[0];
  assert(w.move(s, u, to));
  assert(u.moves < 2);
  assert(!w.move(s, u, s.tiles.length - 1));
  const mountain = w.neighbors(s, u.tile)[0];
  s.tiles[mountain].terrain = "mountain";
  assert(!w.move(s, u, mountain));
});
test("peace blocks combat; melee captures only a defeated city", () => {
  const s = setup(),
    u = s.units.find((u) => u.owner === 0),
    enemy = s.units.find((u) => u.owner === 1),
    target = w.neighbors(s, u.tile)[0];
  s.units = s.units.filter((v) => v.id === u.id || v.tile !== target);
  enemy.tile = target;
  if (!s.units.includes(enemy)) s.units.push(enemy);
  enemy.hp = 1;
  assert(!w.combatPreview(s, u, target));
  s.relations.find((r) => r.a === 0 && r.b === 1).status = "war";
  assert(w.attack(s, u, target));
  assert(!s.units.some((v) => v.id === enemy.id));
  assert.equal(u.moves, 0);
  assert(saves.valid(s));
});
test("policy slots enforce categories, uniqueness, unlocks and cost", () => {
  const s = setup(),
    n = s.nations[0];
  n.civic = ["laws"];
  assert(!w.configureGovernment(s, "chief", ["planning", "discipline"]));
  assert(w.configureGovernment(s, "chief", ["discipline", "planning"]));
  const gold = n.gold;
  assert(!w.configureGovernment(s, "chief", ["discipline", "discipline"]));
  assert.equal(n.gold, gold);
  assert(w.configureGovernment(s, "chief", [null, "planning"]));
  assert.equal(n.gold, gold - 40);
});
test("faith begins at astrology, no theology/religion circular unlock", () => {
  const s = setup(),
    n = s.nations[0],
    city = s.cities.find((c) => c.owner === 0);
  n.tech.push("astrology");
  assert(!w.buildReason(s, city, "holy"));
  city.buildings.push("holy");
  n.faith = 60;
  n.great.prophet = 40;
  assert(w.foundReligion(s));
  assert(n.religion);
  assert.equal(n.faith, 0);
  assert.equal(city.religion, 0);
});
test("old saves migrate without destroying legacy data", () => {
  const s = legacy.create(42);
  assert(
    legacy.found(
      s,
      s.units.find((u) => u.owner === 0 && u.type === "settler"),
    ),
  );
  for (let i = 0; i < 5; i++) legacy.nextTurn(s);
  const result = saves.migrate(clone(s));
  assert(result);
  assert.equal(result.turn, s.turn);
  assert.equal(result.cities.length, s.cities.length);
  assert(saves.valid(result));
});
test("invalid saves are rejected, including NaN, unknown items and bad references", () => {
  const s = setup();
  for (const mutate of [
    (v) => v.cities[0].buildings.push("fake"),
    (v) => (v.nations[0].gold = NaN),
    (v) => (v.tiles[0].q = 999),
    (v) => (v.units[0].owner = 12),
    (v) =>
      v.routes.push({
        id: 3,
        owner: 0,
        from: 999,
        to: 1,
        path: [],
        remaining: 4,
      }),
    (v) => v.cities[0].queue.push({ item: "fake", tile: -1 }),
    (v) => (v.nations[0].researchProgress = { fake: 5 }),
    (v) => (v.next = 1),
    (v) => (v.tiles[0].resource = ["wheat"]),
    (v) => (v.tiles[0].improvement = "constructor"),
    (v) => (v.units[0].type = ["warrior"]),
    (v) => v.cities[0].queue.push({ item: "constructor", tile: -1 }),
    (v) => (v.cities[0].invested = { "fake:-1": 10 }),
  ]) {
    const bad = clone(s);
    mutate(bad);
    assert(!saves.valid(bad));
  }
  assert(!saves.valid({ version: 2 }));
  assert(!saves.valid(null));
});
test("all victory routes are reachable and terminal actions stop", () => {
  for (const kind of ["science", "culture", "domination", "religion"]) {
    const s = setup(),
      n = s.nations[0],
      cities = s.cities.filter((c) => c.capital >= 0),
      own = s.cities.find((c) => c.owner === 0);
    if (kind === "science") n.space={launched:true,distance:50,speed:1};
    if (kind === "culture") {
      n.tourismAgainst = [0,40000,40000];
    }
    if (kind === "domination") cities.forEach((c) => (c.owner = 0));
    if (kind === "religion") {
      n.religion = "Test";
      cities.forEach((c) => (c.religion = 0));
    }
    w.checkVictory(s);
    assert.equal(s.winner.type, kind);
    const turn = s.turn;
    w.nextTurn(s);
    assert.equal(s.turn, turn);
  }
});
test("seeded 100-turn simulations keep saves valid and opponents expand", () => {
  for (const seed of [7, 21, 42]) {
    const s = setup({ seed });
    s.continued = true;
    for (let turn = 0; turn < 100; turn++) {
      w.nextTurn(s);
      if (!saves.valid(s)) {
        console.error("invalid turn", s.turn, JSON.stringify(s));
        assert.fail("invalid simulated save");
      }
    }
    // Standard source costs replace the old compressed tree. At this yield rate,
    // 100 quick turns finish five technologies; expansion must still be real.
    assert(s.nations[1].tech.length >= 5);
    assert(s.cities.filter((c) => c.owner === 1).length >= 2);
  }
});
test("defeating a garrison does not bypass city defenses", () => {
  const s = setup(),
    city = s.cities.find((c) => c.owner === 1);
  const start = w
    .neighbors(s, city.tile)
    .find((i) => s.tiles[i].terrain !== "water");
  s.tiles[start].terrain = "grass";
  s.units = [];
  const u = w.spawn(s, 0, "tank", start),
    defender = w.spawn(s, 1, "warrior", city.tile);
  defender.hp = 1;
  w.relation(s, 0, 1).status = "war";
  assert(w.attack(s, u, city.tile));
  assert.equal(u.tile, start);
  assert.equal(city.owner, 1);
  assert.equal(city.hp, 200);
  city.hp = 1;
  city.walls = 0;
  u.moves = 2;
  u.hp = 100;
  assert(w.attack(s, u, city.tile));
  assert.equal(city.owner, 0);
  assert.equal(u.tile, city.tile);
  assert(
    s.tiles.filter((t) => t.territory === city.id).every((t) => t.owner === 0),
  );
});
test("traders create roads, source yields and return when the route ends", () => {
  const s = setup({ map: "pangaea" }),
    source = s.cities.find((c) => c.owner === 0);
  s.nations[0].met = [1, 2, 3, 4];
  s.units = s.units.filter((u) => u.tile !== source.tile);
  const trader = w.spawn(s, 0, "trader", source.tile),
    target = w.tradeTargets(s, trader)[0];
  assert(target, "reachable trading destination");
  const before = w.yields(s, source).gold;
  assert(w.establishTrade(s, trader, target.id));
  assert(!s.units.some((u) => u.id === trader.id));
  const route = s.routes.find((r) => r.owner === 0);
  assert(route.path.length > 1 && route.path.every((i) => s.tiles[i].road));
  assert(w.yields(s, source).gold > before);
  route.remaining = 1;
  w.nextTurn(s);
  assert(!s.routes.some((r) => r.id === route.id));
  assert(s.units.some((u) => u.owner === 0 && u.type === "trader"));
  assert(saves.valid(s));
});
test("peace treaties prevent immediate re-declaration", () => {
  const s = setup(),
    n = s.nations[0],
    r = w.relation(s, 0, 1);
  n.met.push(1);
  assert(w.diplomacy(s, 1, "war"));
  assert(!w.diplomacy(s, 1, "peace"));
  s.turn += 8;
  assert(w.diplomacy(s, 1, "peace"));
  assert(!w.diplomacy(s, 1, "war"));
  s.turn += 12;
  assert(w.diplomacy(s, 1, "war"));
});
test("faith-only units cannot be queued as ordinary production", () => {
  const s = setup(),
    city = s.cities.find((c) => c.owner === 0),
    n = s.nations[0];
  n.religion = "test";
  n.faith = 10000;
  n.civic.push("theology");
  city.buildings.push("holy", "shrine", "temple");
  s.units = s.units.filter((u) => u.tile !== city.tile);
  assert(!w.enqueue(s, city, "missionary"));
  assert(w.purchase(s, city, "missionary"));
  assert(s.units.some((u) => u.type === "missionary" && u.owner === 0));
});
test("repeatable endgame projects remain saveable after both trees are finished", () => {
  for (const id of ["festival", "researchProject", "moon"]) {
    const s = setup(),
      n = s.nations[0],
      city = s.cities.find((c) => c.owner === 0);
    n.tech = c.techs.map((t) => t.id);
    n.civic = c.civics.map((t) => t.id);
    n.research = "";
    n.culture = "";
    city.pop = 10;
    city.buildings.push("spaceport", "satellite", "campus");
    city.queue = [];
    assert(w.enqueue(s, city, id));
    city.invested[w.jobKey(city.queue[0])] = 10000;
    s.continued = true;
    w.nextTurn(s);
    assert.equal(
      s.cities.find((v) => v.id === city.id).queue.length,
      0,
      `${id}: ${w.buildReason(s, city, id, true)} ${JSON.stringify(city.invested)} rate=${w.productionRate(s, city, id)} turn=${s.turn}`,
    );
    assert(!Object.hasOwn(n.researchProgress, ""));
    assert(saves.valid(s));
  }
});
test("policy save validation rejects duplicate cards and wrong slot types", () => {
  const s = setup();
  s.nations[0].policies = ["planning", "planning"];
  assert(!saves.valid(s));
  s.nations[0].policies = ["planning", "discipline"];
  assert(!saves.valid(s));
});
test("full-length campaigns across civilizations and difficulties stay valid", () => {
  for (const [civilization, difficulty, size, speed] of [
    ["china", "hard", "standard", "quick"],
    ["rome", "standard", "compact", "normal"],
    ["egypt", "relaxed", "standard", "quick"],
  ]) {
    const s = setup({ civilization, difficulty, size, speed, seed: 81 });
    s.continued = true;
    for (let turn = 0; turn < w.turnLimit(s); turn++) {
      w.nextTurn(s);
      assert(saves.valid(s), `invalid ${civilization} save at ${s.turn}`);
      for (const n of s.nations)
        assert.equal(
          new Set(n.policies.filter(Boolean)).size,
          n.policies.filter(Boolean).length,
        );
    }
    assert(s.winner, "campaign must reach an ending");
  }
});
test("strategic resources accumulate and military purchases consume stock", () => {
  const s = setup(),
    n = s.nations[0],
    city = s.cities.find((c) => c.owner === 0);
  n.tech.push("mining", "bronze", "ironworking");
  const tile = s.tiles.findIndex((t) => t.owner === 0 && t.resource === "iron");
  s.units = s.units.filter((u) => u.tile !== tile);
  const builder = w.spawn(s, 0, "builder", tile),
    charges = builder.charges;
  assert(w.improve(s, builder, "mine"));
  assert.equal(builder.charges, charges - 1);
  w.nextTurn(s);
  assert.equal(n.strategic.iron, 2);
  assert(w.buildReason(s, city, "sword").includes("10"));
  n.strategic.iron = 10;
  n.gold = 10000;
  assert(w.purchase(s, city, "sword"));
  assert.equal(n.strategic.iron, 0);
  assert(saves.valid(s));
});
test("melee land units cannot enter water through combat before embarkation", () => {
  const s = setup(),
    u = s.units.find((u) => u.owner === 0),
    to = w.neighbors(s, u.tile)[0];
  s.units = s.units.filter((v) => v.id === u.id || v.tile !== to);
  s.tiles[to].terrain = "water";
  const enemy = w.spawn(s, 5, "galley", to);
  enemy.hp = 1;
  assert(!w.combatPreview(s, u, to));
  s.nations[0].tech.push("shipbuilding");
  assert(w.combatPreview(s, u, to));
});
console.log(
  `\n${passed} Civilization checks passed. ${c.techs.length} techs, ${c.civics.length} civics, ${c.items.length} projects.`,
);
