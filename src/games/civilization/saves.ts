import { create, defaultOptions } from "./world";
import { valid as validLegacy } from "./engine";
import {
  civilizations,
  governments,
  items,
  itemMap,
  techs,
  civics,
  policies,
  resources,
  improvements,
} from "./catalog";
import { distance } from "./hex";
import { remapPolicies } from './politics';
import type { State, City, Nation } from "./model";

const CURRENT = "aoinatsu:civilization:v3",
  PREVIOUS = "aoinatsu:civilization:v2",
  LEGACY = "aoinatsu:civilization:v1",
  MANUAL = "aoinatsu:civilization:manual:v3";
const finite = (n: unknown, min = 0, max = 1e9): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
const integer = (n: unknown, min = 0, max = 1e9) =>
  finite(n, min, max) && Number.isInteger(n);
const text = (x: unknown, max = 200): x is string =>
  typeof x === "string" && x.length <= max;
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const strings = (a: unknown, allowed: Set<string>, max = 200): a is string[] =>
  Array.isArray(a) &&
  a.length <= max &&
  a.every((x) => text(x) && allowed.has(x)) &&
  new Set(a).size === a.length;
const researchIds = new Set([...techs, ...civics].map((d) => d.id)),
  itemIds = new Set(items.map((d) => d.id)),
  techIds = new Set(techs.map((d) => d.id)),
  civicIds = new Set(civics.map((d) => d.id));

// Treat imported JSON as untrusted. Validate all fields the renderer and rules use.
export function valid(value: unknown): value is State {
  try {
    if (!record(value)) return false;
    const s = value as unknown as State;
    if (
      s.version !== 3 ||
      !integer(s.width, 12, 32) ||
      !integer(s.height, 10, 22) ||
      !integer(s.turn, 1, 10000) ||
      !integer(s.seed, 0, 4294967295) ||
      !integer(s.next, 1) ||
      !record(s.options)
    )
      return false;
    if (
      !civilizations.some((c) => c.id === s.options.civilization) ||
      !["compact", "standard"].includes(s.options.size) ||
      !["relaxed", "standard", "hard"].includes(s.options.difficulty) ||
      !["quick", "normal"].includes(s.options.speed) ||
      !["continents", "pangaea"].includes(s.options.map) ||
      !integer(s.options.seed, 0, 4294967295)
    )
      return false;
    if (
      !Array.isArray(s.tiles) ||
      s.tiles.length !== s.width * s.height ||
      !Array.isArray(s.units) ||
      s.units.length > 500 ||
      !Array.isArray(s.cities) ||
      s.cities.length > 100 ||
      !Array.isArray(s.nations) ||
      s.nations.length !== 6 ||
      typeof s.continued !== "boolean"
    )
      return false;
    const ids = new Set<number>();
    for (const entity of [...s.cities, ...s.units]) {
      if (
        !integer(entity.id, 1, s.next - 1) ||
        ids.has(entity.id) ||
        !integer(entity.owner, 0, 5) ||
        !integer(entity.tile, 0, s.tiles.length - 1)
      )
        return false;
      ids.add(entity.id);
    }
    const cityIds = new Set(s.cities.map((c) => c.id)),
      unitTiles = new Set(s.units.map((u) => u.tile));
    if (
      unitTiles.size !== s.units.length ||
      new Set(s.cities.map((c) => c.tile)).size !== s.cities.length
    )
      return false;
    const bools = [
      "river",
      "village",
      "camp",
      "road",
      "pillaged",
      "seen",
    ] as const;
    if (
      !s.tiles.every(
        (t, i) =>
          record(t) &&
          t.q === i % s.width &&
          t.r === Math.floor(i / s.width) &&
          [
            "grass",
            "plain",
            "forest",
            "hill",
            "mountain",
            "water",
            "desert",
          ].includes(t.terrain) &&
          text(t.resource, 80) &&
          (t.resource === "" ||
            Object.prototype.hasOwnProperty.call(resources, t.resource)) &&
          integer(t.owner, -1, 5) &&
          integer(t.city, -1) &&
          (t.city === -1 || cityIds.has(t.city)) &&
          integer(t.territory, -1) &&
          (t.territory === -1 || cityIds.has(t.territory)) &&
          text(t.district, 80) &&
          (t.district === "" ||
            (!!itemMap[t.district] &&
              ["district", "wonder"].includes(itemMap[t.district].kind))) &&
          text(t.improvement, 80) &&
          (t.improvement === "" ||
            Object.prototype.hasOwnProperty.call(
              improvements,
              t.improvement,
            )) &&
          bools.every((k) => typeof t[k] === "boolean") &&
          (t.baseTerrain === undefined || ['grass','plain','desert','tundra','snow','coast','ocean','lake','mountain'].includes(t.baseTerrain)) &&
          (t.feature === undefined || ['','forest','rainforest','marsh','floodplains','reef','geothermal','oasis'].includes(t.feature)) &&
          (t.hills === undefined || typeof t.hills === 'boolean') &&
          (t.naturalWonder === undefined || typeof t.naturalWonder === 'boolean'),
      )
    )
      return false;
    if (
      !s.units.every(
        (u) =>
          text(u.type, 80) &&
          Object.prototype.hasOwnProperty.call(itemMap, u.type) &&
          itemMap[u.type].kind === "unit" &&
          finite(u.hp, 0, 100) &&
          finite(u.moves, 0, 10) &&
          integer(u.charges, 0, 10) &&
          finite(u.xp, 0, 10000) &&
          integer(u.level, 0, 100) &&
          typeof u.fortified === "boolean" &&
          typeof u.acted === "boolean",
      )
    )
      return false;
    if (
      !s.cities.every(
        (c) =>
          text(c.name, 80) &&
          integer(c.capital, -1, 2) &&
          integer(c.pop, 1, 1000) &&
          finite(c.food, 0, 1e6) &&
          finite(c.hp, 0, 200) &&
          finite(c.walls, 0, 100) &&
          strings(c.buildings, itemIds) &&
          c.buildings.every(
            (b) => itemMap[b].kind !== "unit" && !itemMap[b].repeat,
          ) &&
          Array.isArray(c.queue) &&
          c.queue.length <= 5 &&
          c.queue.every(
            (j) =>
              record(j) &&
              text(j.item, 80) &&
              Object.prototype.hasOwnProperty.call(itemMap, j.item) &&
              integer(j.tile, -1, s.tiles.length - 1) &&
              (!["district", "wonder"].includes(itemMap[j.item].kind) ||
                j.tile >= 0),
          ) &&
          record(c.invested) &&
          Object.entries(c.invested).every(([k, v]) => {
            const match = /^([A-Za-z][A-Za-z0-9]*):(-?\d+)$/.exec(k);
            return (
              !!match &&
              itemIds.has(match[1]) &&
              integer(Number(match[2]), -1, s.tiles.length - 1) &&
              finite(v)
            );
          }) &&
          finite(c.border) &&
          ["balanced", "food", "production", "gold"].includes(c.focus) &&
          integer(c.religion, -1, 2) &&
          Array.isArray(c.pressure) &&
          c.pressure.length === 3 &&
          c.pressure.every((v) => finite(v)) &&
          typeof c.attacked === "boolean" &&
          s.tiles[c.tile].city === c.id &&
          s.tiles[c.tile].owner === c.owner,
      )
    )
      return false;
    if (
      !s.nations.every(
        (n, i) =>
          text(n.name, 80) &&
          text(n.civ, 30) &&
          (i >= 3 || civilizations.some(c=>c.id===n.civ)) &&
          /^#[0-9a-f]{6}$/i.test(n.color) &&
          n.kind === (i < 3 ? "major" : i < 5 ? "state" : "barbarian") &&
          finite(n.gold) &&
          finite(n.faith) &&
          strings(n.tech, techIds) &&
          strings(n.civic, civicIds) &&
          strings(n.boosts, researchIds) &&
          text(n.research) &&
          (!n.research || techIds.has(n.research)) &&
          text(n.culture) &&
          (!n.culture || civicIds.has(n.culture)) &&
          record(n.researchProgress) &&
          Object.entries(n.researchProgress).every(
            ([k, v]) => researchIds.has(k) && finite(v),
          ) &&
          Array.isArray(n.policies) &&
          n.policies.length ===
            governments.find((g) => g.id === n.government)?.slots.length &&
          new Set(n.policies.filter((p) => p !== null)).size ===
            n.policies.filter((p) => p !== null).length &&
          n.policies.every(
            (p, i) =>
              p === null ||
              policies.some(
                (d) =>
                  d[0] === p &&
                  (governments.find((g) => g.id === n.government)!.slots[i] ===
                    "wild" ||
                    d[3] ===
                      governments.find((g) => g.id === n.government)!.slots[i]),
              ),
          ) &&
          typeof n.policyFree === "boolean" &&
          text(n.religion, 80) &&
          ["", "fertility", "crafts"].includes(n.pantheon) &&
          finite(n.tourism) &&
          finite(n.totalCulture) &&
          Array.isArray(n.tourismAgainst) && n.tourismAgainst.length === 3 && n.tourismAgainst.every(v=>finite(v)) &&
          record(n.space) && typeof n.space.launched === 'boolean' && finite(n.space.distance) && finite(n.space.speed, 1, 1000) &&
          integer(n.barbarianKills) &&
          integer(n.envoys) &&
          record(n.great) &&
          ["science", "culture", "prophet"].every((k) =>
            finite(n.great[k as keyof Nation["great"]]),
          ) &&
          record(n.strategic) &&
          ["iron", "horses", "coal", "oil"].every((k) =>
            finite(n.strategic[k], 0, 100),
          ) &&
          integer(n.kills) &&
          integer(n.promotions) &&
          Array.isArray(n.met) &&
          n.met.every((o) => integer(o, 0, 4)),
      )
    )
      return false;
    if (
      !Array.isArray(s.relations) ||
      s.relations.length !== 10 ||
      !s.relations.every(
        (r) =>
          integer(r.a, 0, 4) &&
          integer(r.b, 1, 4) &&
          r.a < r.b &&
          ["peace", "war", "friend"].includes(r.status) &&
          integer(r.since, 0, s.turn) &&
          integer(r.until, 0, 100000) &&
          finite(r.opinion, -1000, 1000) &&
          typeof r.delegation === "boolean",
      ) ||
      new Set(s.relations.map((r) => `${r.a}:${r.b}`)).size !== 10
    )
      return false;
    if (
      !Array.isArray(s.routes) ||
      s.routes.length > 100 ||
      !s.routes.every(
        (r) =>
          integer(r.id, 1, s.next - 1) &&
          integer(r.owner, 0, 4) &&
          cityIds.has(r.from) &&
          cityIds.has(r.to) &&
          r.from !== r.to &&
          integer(r.remaining, 1, 24) &&
          Array.isArray(r.path) &&
          r.path.length <= s.tiles.length &&
          r.path.every((i) => integer(i, 0, s.tiles.length - 1)),
      )
    )
      return false;
    if (
      !Array.isArray(s.cityStates) ||
      s.cityStates.length !== 2 ||
      !s.cityStates.every(
        (c, i) =>
          c.owner === i + 3 &&
          ["science", "culture"].includes(c.type) &&
          Array.isArray(c.envoys) &&
          c.envoys.length === 3 &&
          c.envoys.every((v) => integer(v)),
      )
    )
      return false;
    if (
      !Array.isArray(s.log) ||
      s.log.length > 100 ||
      !s.log.every(
        (e) =>
          integer(e.turn, 1, s.turn) &&
          text(e.text, 500) &&
          ["info", "research", "combat", "city", "wonder"].includes(e.kind),
      )
    )
      return false;
    if (
      !Array.isArray(s.history) ||
      s.history.length > 60 ||
      !s.history.every(
        (h) =>
          integer(h.turn, 1, s.turn) &&
          Array.isArray(h.scores) &&
          h.scores.length === 3 &&
          h.scores.every((v) => finite(v)),
      )
    )
      return false;
    if (
      s.winner !== null &&
      (!record(s.winner) ||
        !integer(s.winner.owner, 0, 2) ||
        ![
          "science",
          "culture",
          "domination",
          "religion",
          "score",
          "defeat",
        ].includes(s.winner.type))
    )
      return false;
    // Keep city ownership and single-tile placement internally consistent.
    for (const t of s.tiles) {
      if (
        t.territory >= 0 &&
        s.cities.find((c) => c.id === t.territory)?.owner !== t.owner
      )
        return false;
      if (
        t.city >= 0 &&
        s.cities.find((c) => c.id === t.city)?.tile !== t.r * s.width + t.q
      )
        return false;
    }
    return true;
  } catch {
    return false;
  }
}
export function migrate(value: unknown): State | null {
  if (valid(value)) return value;
  if (record(value) && (value.version === 2 || value.version===3)) {
    try {
      const upgraded = JSON.parse(JSON.stringify(value));
      upgraded.version = 3;
      if (!Array.isArray(upgraded.nations)) return null;
      for (const n of upgraded.nations) {
        if (!record(n)) return null;
        if (value.version===2) {
          n.totalCulture ??= 0;
          n.tourismAgainst ??= [0,0,0];
          n.space ??= {launched:false,distance:0,speed:1};
          n.barbarianKills ??= 0;
        }
        const g = governments.find(g=>g.id===n.government);
        if (!g || !Array.isArray(n.policies)) return null;
        // Extra government slots are new; do not drop invalid/duplicate imported cards.
        if (n.policies.length<=g.slots.length) {
          const remapped=remapPolicies(g.id,n.policies as (string|null)[]);
          if (!remapped) return null;
          n.policies=remapped;
        }
      }
      // In v2 aqueducts were city buildings. Queued aqueducts now need a plot.
      if (!Array.isArray(upgraded.cities) || !Array.isArray(upgraded.tiles)) return null;
      const state=upgraded as State;
      const reserved=new Set(state.cities.flatMap(city=>city.queue.map(job=>job.tile)).filter(i=>i>=0));
      for (const city of state.cities) for (const job of city.queue) {
        if (job.item!=='aqueduct' || job.tile!==-1) continue;
        const at=state.tiles.findIndex((tile,i)=>tile.territory===city.id && tile.city<0 && !tile.district && !tile.improvement && !reserved.has(i) && distance(tile,state.tiles[city.tile])===1 && tile.terrain!=='water' && tile.terrain!=='mountain' && (tile.river || state.tiles.some(source=>source.terrain==='mountain' && distance(tile,source)===1)));
        if (at<0) return null; // Keep the untouched original; never erase an unplaceable investment.
        job.tile=at;reserved.add(at);
        const oldKey='aqueduct:-1',newKey=`aqueduct:${at}`;
        if (city.invested[oldKey]!==undefined) {city.invested[newKey]=city.invested[oldKey];delete city.invested[oldKey];}
      }
      return valid(upgraded) ? upgraded : null;
    } catch { return null; }
  }
  if (!validLegacy(value)) return null;
  try {
    const old = value;
    const s = create({ ...defaultOptions(), size: "compact", seed: old.seed });
    s.turn = old.turn;
    s.next = old.next;
    s.cities = old.cities.map(
      (c) =>
        ({
          id: c.id,
          owner: c.owner,
          name: c.name,
          tile: c.tile,
          capital: c.capital ? c.owner : -1,
          pop: c.pop,
          food: c.food,
          hp: c.hp,
          walls: c.buildings.includes("walls") ? 100 : 0,
          buildings: c.buildings.filter((b) => itemIds.has(b)),
          queue:
            c.production && itemIds.has(c.production)
              ? [{ item: c.production, tile: c.target }]
              : [],
          invested: c.production
            ? { [`${c.production}:${c.target}`]: c.progress }
            : {},
          border: 0,
          focus: "balanced",
          religion: c.religion,
          pressure: [0, 1, 2].map((o) => (c.religion === o ? 100 : 0)),
          attacked: false,
        }) satisfies City,
    );
    s.units = old.units.map((u) => ({
      ...u,
      level: 0,
      fortified: false,
      acted: false,
    }));
    const resourceMap: Record<string, string> = {
      小麦: "wheat",
      牲畜: "cattle",
      铁: "iron",
      香料: "spices",
    };
    s.tiles = old.tiles.map((t) => ({
      ...t,
      resource: resourceMap[t.resource] ?? "",
      camp: false,
      territory: -1,
      road: t.city >= 0,
      pillaged: false,
    }));
    for (const t of s.tiles) {
      const owner = s.cities
        .filter((c) => c.owner === t.owner && distance(s.tiles[c.tile], t) <= 3)
        .sort(
          (a, b) => distance(s.tiles[a.tile], t) - distance(s.tiles[b.tile], t),
        )[0];
      t.territory = owner?.id ?? -1;
      if (!owner) t.owner = -1;
      if (t.district && t.territory < 0) t.district = "";
    }
    for (let o = 0; o < 3; o++) {
      const n = s.nations[o],
        v = old.nations[o];
      n.name = v.name;
      n.gold = v.gold;
      n.faith = v.faith;
      n.tech = v.tech.filter((id) => techIds.has(id));
      n.civic = v.civic.filter((id) => civicIds.has(id));
      n.research = techIds.has(v.research) ? v.research : "pottery";
      n.culture = civicIds.has(v.culture) ? v.culture : "laws";
      n.researchProgress = { [n.research]: v.science, [n.culture]: v.cult };
      n.boosts = v.boosts.filter((id) => researchIds.has(id));
      n.government = governments.some((g) => g.id === v.government)
        ? v.government
        : "chief";
      n.policies = governments
        .find((g) => g.id === n.government)!
        .slots.map(() => null);
      n.tourism = v.tourism;
      n.religion = v.religion ? `${n.name}信仰` : "";
      if (o && v.war) {
        const r = s.relations.find((r) => r.a === 0 && r.b === o)!;
        r.status = "war";
        r.since = s.turn;
      }
      n.met = [0, 1, 2].filter((id) => id !== o);
    }
    s.nations[0].envoys = old.envoys;
    s.nations[0].great.science = old.great;
    s.log = [
      {
        turn: s.turn,
        text: "旧版存档已迁移；城邦将在新地图中出现。",
        kind: "info",
      },
    ];
    s.routes = [];
    s.history = [];
    s.winner = null;
    s.continued = false;
    return valid(s) ? s : null;
  } catch {
    return null;
  }
}
export interface SaveResult {
  state: State | null;
  error: string;
  migrated: boolean;
}
export function load(): SaveResult {
  try {
    const raw = localStorage.getItem(CURRENT) ?? localStorage.getItem(PREVIOUS) ?? localStorage.getItem(LEGACY);
    if (!raw) return { state: null, error: "", migrated: false };
    const parsed = JSON.parse(raw),
      s = migrate(parsed);
    const migrated=s!==null && (parsed.version!==3 || !valid(parsed));
    if (migrated && parsed.version===3) localStorage.setItem('aoinatsu:civilization:v3:pre-politics',raw);
    return {
      state: s,
      error: s ? "" : "本机存档无法读取，原数据未覆盖。可尝试恢复手动存档。",
      migrated,
    };
  } catch {
    return {
      state: null,
      error: "浏览器存储不可用，或存档已损坏。",
      migrated: false,
    };
  }
}
export function save(s: State, manual = false) {
  try {
    if (!valid(s)) return false;
    localStorage.setItem(manual ? MANUAL : CURRENT, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
export function restoreManual(): State | null {
  try {
    return migrate(JSON.parse(localStorage.getItem(MANUAL) ?? localStorage.getItem('aoinatsu:civilization:manual:v2') ?? "null"));
  } catch {
    return null;
  }
}
export function manualSummary() {
  const s = restoreManual();
  return s
    ? `${s.nations[0].name} · 回合 ${s.turn} · ${s.cities.filter((c) => c.owner === 0).length} 城市`
    : "暂无手动存档";
}
