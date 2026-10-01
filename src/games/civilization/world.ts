import {
  techs,
  civics,
  items,
  itemMap,
  policies,
  governments,
  policyAvailable,
  civilizations,
  resources,
  improvements,
  emptyYield,
  type Item,
  type Yield,
  type Research,
} from "./catalog";
import { distance, neighbors, random } from "./hex";
import { satisfiedBoosts } from './boosts';
import { majorIds, civilizedIds, barbarianOwner, aiStrategy } from './participants';
import { cityStateRoster, cityStateYields, envoyBonus, suzerain, hasSuzerainBonus, influenceRate, civicEnvoyRewards } from './city-states';
export { suzerain, influenceRate } from './city-states';
import { pantheons, availableBeliefs, beliefs, cityBelief, activeReligiousBuildings, founderYield } from './religion';
import { currentScientist, scientistCost, scientistById, scientistBuildingBonus, scientistPoints } from './great-people';
export { currentScientist, scientistCost, scientistPoints } from './great-people';
import {
  type State,
  type Tile,
  type Unit,
  type City,
  type Nation,
  type Options,
  type Job,
} from "./model";
export { distance, neighbors } from "./hex";
export type { State, Tile, Unit, City, Options, Nation } from "./model";
export const info = (id: string) => itemMap[id];
export const defaultOptions = (): Options => ({
  civilization: "china",
  aiCount: 2,
  cityStateCount: 3,
  size: "standard",
  difficulty: "standard",
  speed: "quick",
  seed: Date.now() >>> 0,
  map: "continents",
});
export function event(
  s: State,
  text: string,
  kind: State["log"][number]["kind"] = "info",
) {
  s.log.unshift({ turn: s.turn, text, kind });
  s.log = s.log.slice(0, 100);
}
export const active = (s: State) => !s.winner || s.continued;
export function relation(s: State, a: number, b: number) {
  return s.relations.find(
    (r) => r.a === Math.min(a, b) && r.b === Math.max(a, b),
  )!;
}
export function atWar(s:State,a:number,b:number) {
  if(a===b) return false;
  if(a===barbarianOwner(s) || b===barbarianOwner(s) || relation(s,a,b)?.status==='war') return true;
  const sa=s.cityStates.find(cs=>cs.owner===a), sb=s.cityStates.find(cs=>cs.owner===b);
  const allyA=sa?suzerain(s,sa):a, allyB=sb?suzerain(s,sb):b;
  return allyA!==null && allyB!==null && allyA!==allyB && relation(s,allyA,allyB)?.status==='war';
}
export const ownCities = (s: State, o = 0) =>
  s.cities.filter((c) => c.owner === o);
export const government = (n: Nation) =>
  governments.find((g) => g.id === n.government)!;
export const hasPolicy = (n: Nation, id: string) => n.policies.includes(id) && policyAvailable(n,id);
export const specialtyDistricts = (c: City) => c.buildings.filter(id=>info(id).kind==='district' && !['aqueduct','dam','canal','spaceport','neighborhood'].includes(id)).length;
const hasDistrict = (c: City) => c.buildings.some(id=>info(id).kind==='district');
export function districtDiscount(s: State, id: string, owner = 0) {
  const n = s.nations[owner];
  const special = (d: Item) => d.kind === 'district' && !['aqueduct','dam','canal','spaceport','neighborhood'].includes(d.id);
  if (!special(info(id))) return 1;
  const unlocked = items.filter(d => special(d) && (!d.unlock || n.tech.includes(d.unlock) || n.civic.includes(d.unlock))).length;
  const cities = ownCities(s, owner);
  // Discounts refresh on research completion, not each construction completion.
  const completed = n.districtDiscountBasis ?? cities.reduce((v,c) => v + specialtyDistricts(c), 0);
  const placed = cities.reduce((v,c) => v + Number(c.buildings.includes(id)) + Number(c.districtPlacements?.[id]!==undefined || c.queue.some(j=>j.item===id)), 0);
  return unlocked > 1 && completed >= unlocked && placed < completed / unlocked ? 0.6 : 1;
}
export function cost(s: State, id: string, city?: City) {
  const d = info(id);
  if (d.kind === 'district' && id !== 'spaceport') {
    const at=city?.districtPlacements?.[id], locked=at===undefined ? undefined : city?.productionCosts?.[`${id}:${at}`];
    if(locked!==undefined) return locked;
    const owner = city?.owner ?? 0, n = s.nations[owner];
    const progress = Math.max(n.tech.length / techs.length, n.civic.length / civics.length);
    return Math.floor(d.cost * speedMultiplier(s) * (1 + 9 * progress) * districtDiscount(s,id,owner));
  }
  return Math.round(d.cost * speedMultiplier(s));
}
export function jobCost(s: State, c: City, j: Job) {
  // Old v3 queues were priced at the base cost. Preserve that contract when loading.
  return c.productionCosts?.[jobKey(j)] ?? Math.round(info(j.item).cost * speedMultiplier(s));
}
export const speedMultiplier = (s: State) => s.options.speed === 'normal' ? 1 : 2 / 3;
export function researchCost(s: State, n: Nation, d: Research) {
  return Math.ceil(
    d.cost *
      speedMultiplier(s) *
      (n.boosts.includes(d.id) ? (n.civ === "china" ? 0.5 : 0.6) : 1),
  );
}
export const turnLimit = (s: State) => s.options.speed === 'normal' ? 500 : 330;
export function era(n: Nation) {
  return Math.max(
    0,
    ...techs.filter((t) => n.tech.includes(t.id)).map((t) => t.era),
    ...civics.filter((t) => n.civic.includes(t.id)).map((t) => t.era),
  );
}
function nation(
  civ: string,
  kind: Nation["kind"] = "major",
  name = "",
): Nation {
  const c = civilizations.find((c) => c.id === civ)!;
  return {
    name: name || c.name,
    civ,
    color:
      kind === "state" ? "#a6c5a3" : kind === "barbarian" ? "#bc8d79" : c.color,
    kind,
    gold: 60,
    faith: 0,
    tech: [],
    civic: [],
    research: "pottery",
    culture: "laws",
    researchProgress: {},
    boosts: [],
    policies: [null, null],
    government: "chief",
    policyFree: true,
    religion: "",
    pantheon: "",
    tourism: 0,
    envoys: 0,
    great: { science: 0, culture: 0, prophet: 0 },
    strategic: { iron: 0, horses: 0, coal: 0, oil: 0 },
    kills: 0,
    promotions: 0,
    met: [],
    totalCulture: 0,
    tourismAgainst: [0, 0, 0],
    space: { launched: false, distance: 0, speed: 1 },
    barbarianKills: 0,
    districtDiscountBasis: 0,
    greatPeopleEarned: 0,
    eraScore: 0,
    influence: 0,
    beliefs: [],
    prophetRecruited: false,
    pantheonGift: false,
  };
}
export function create(options: Partial<Options> = {}): State {
  const o = { ...defaultOptions(), ...options };
  if (!Number.isInteger(o.aiCount) || o.aiCount! < 1 || o.aiCount! > 5) throw Error('AI数量需在1–5之间');
  if (!Number.isInteger(o.cityStateCount) || o.cityStateCount! < 2 || o.cityStateCount! > 6) throw Error('城邦数量需在2–6之间');
  if (o.civilization !== 'random' && !civilizations.some(c => c.id === o.civilization)) throw Error('未知文明');
  const majors = o.aiCount! + 1;
  const states=o.cityStateCount!, participants=majors+states;
  const width = o.size === "compact" ? (participants > 6 ? 24 : 18) : (majors > 4 ? 32 : 24),
    height = o.size === "compact" ? (participants > 6 ? 16 : 12) : (majors > 4 ? 22 : 16);
  const s: State = {
    version: 3,
    seed: o.seed >>> 0,
    turn: 1,
    width,
    height,
    options: o,
    tiles: [],
    units: [],
    cities: [],
    nations: [],
    relations: [],
    routes: [],
    cityStates: [],
    next: 1,
    log: [],
    winner: null,
    continued: false,
    history: [],
  };
  const phase = random(s) * 6.28;
  for (let r = 0; r < height; r++)
    for (let q = 0; q < width; q++) {
      const noise = random(s),
        coast = q < 1 || q > width - 2 || r < 1 || r > height - 2;
      const sea =
        o.map === "continents" &&
        q > width * 0.43 + Math.sin(r * 0.6 + phase) * 1.2 &&
        q < width * 0.51 + Math.sin(r * 0.6 + phase) * 1.2 &&
        r < height * 0.72;
      const latitude = Math.abs(r - height * 0.5) / height,
        biome = Math.sin(q * 0.4 + phase) + Math.cos(r * 0.5 + phase);
      const terrain =
        coast || sea
          ? "water"
          : noise < 0.07
            ? "mountain"
            : noise < 0.24
              ? "hill"
              : noise < 0.44
                ? "forest"
                : biome > 1 && latitude < 0.3
                  ? "desert"
                  : noise < 0.7
                    ? "plain"
                    : "grass";
      const pool =
        terrain === "water"
          ? ["fish"]
          : terrain === "hill"
            ? ["iron", "gems", "coal"]
            : terrain === "desert"
              ? ["oil", "iron"]
              : terrain === "forest"
                ? ["spices", "cattle"]
                : ["wheat", "cattle", "horses"];
      s.tiles.push({
        q,
        r,
        terrain,
        resource:
          random(s) < 0.22 && terrain !== "mountain"
            ? pool[Math.floor(random(s) * pool.length)]
            : "",
        river:
          terrain !== "water" &&
          Math.abs(q - (width * 0.25 + Math.sin(r * 0.5 + phase) * 2)) < 0.6,
        village: false,
        camp: false,
        owner: -1,
        city: -1,
        territory: -1,
        district: "",
        improvement: "",
        road: false,
        pillaged: false,
        seen: false,
        baseTerrain: terrain === 'forest' ? 'grass' : terrain === 'hill' ? 'plain' : terrain === 'water' ? 'coast' : terrain,
        feature: terrain === 'forest' || terrain === 'hill' && noise < 0.15 ? 'forest' : '',
        hills: terrain === 'hill',
        naturalWonder: false,
      });
    }
  const playerCiv = o.civilization === 'random' ? civilizations[Math.floor(random(s) * civilizations.length)].id : o.civilization;
  const pool = civilizations.map(c => c.id).filter(id => id !== playerCiv);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const civOrder = [playerCiv, ...pool, playerCiv, ...pool].slice(0, majors);
  const repeats = new Map<string, number>(), colors = ['','#cb7868','#73b8bf','#b291c9','#ccad66','#81b38a'];
  s.nations = civOrder.map((c, owner) => {
    const n = nation(c), repeat = (repeats.get(c) ?? 0) + 1;
    repeats.set(c, repeat);
    if (repeat > 1) n.name += ` ${repeat}`;
    if (owner) {
      n.color = colors[owner];
      n.aiStrategy = (['expansion','science','culture','military'] as const)[Math.floor(random(s) * 4)];
    }
    n.tourismAgainst = Array(majors).fill(0);
    return n;
  });
  s.nations.push(...cityStateRoster.slice(0,states).map(row=>nation('', 'state',row.name)),nation('', 'barbarian','蛮族'));
  for (const n of s.nations) n.tourismAgainst = Array(majors).fill(0);
  for (let a = 0; a < participants; a++)
    for (let b = a + 1; b < participants; b++)
      s.relations.push({
        a,
        b,
        status: "peace",
        since: 1,
        until: 0,
        opinion: 0,
        delegation: false,
      });
  const starts = [
    [3, 3], [width - 5, 3], [Math.floor(width / 2), 3],
    [3, height - 4], [width - 5, height - 4], [Math.floor(width / 2), height - 4],
    [3, Math.floor(height / 2)], [width - 3, Math.floor(height / 2)],
  ];
  if (height < 16) starts.splice(6);
  if (states!==2) {
    starts.length=0;
    for(let r=3;r<height-2;r+=5) for(let q=3;q<width-2;q+=5) starts.push([q,r]);
  }
  for (let i = starts.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [starts[i], starts[j]] = [starts[j], starts[i]];
  }
  starts.splice(participants);
  for (let owner = 0; owner < participants; owner++) {
    const [q, r] = starts[owner],
      tile = r * width + q;
    s.tiles[tile].terrain = "grass";
    s.tiles[tile].river = true;
    s.tiles[tile].resource = "";
    s.tiles[tile].baseTerrain = 'grass';
    s.tiles[tile].feature = '';
    s.tiles[tile].hills = false;
    const ns = neighbors(s, tile);
    ns.forEach((k, j) => {
      s.tiles[k].terrain = j === 0 ? "hill" : j === 1 ? "forest" : "grass";
      s.tiles[k].resource =
        j === 0 ? "iron" : j === 2 ? "wheat" : j === 3 ? "horses" : "";
      s.tiles[k].baseTerrain = j === 0 ? 'plain' : 'grass';
      s.tiles[k].feature = j === 1 ? 'forest' : '';
      s.tiles[k].hills = j === 0;
    });
    spawn(s, owner, "settler", tile);
    if (owner)
      found(
        s,
        s.units.find((u) => u.owner === owner)!,
      );
    spawn(s, owner, "warrior", ns[0]);
    if (owner >= majors)
      s.cityStates.push({
        owner,
        type: cityStateRoster[owner-majors].type,
        envoys: Array(majors).fill(0),
      });
  }
  for (const t of s.tiles) {
    const safe = starts.every(([q, r]) => distance(t, { q, r }) >= 4);
    if (safe && !["water", "mountain"].includes(t.terrain) && random(s) < 0.05)
      t.village = true;
  }
  for (let k = 0; k < 3; k++) {
    const candidates = s.tiles
      .map((t, i) => ({ t, i }))
      .filter(
        ({ t, i }) =>
          !t.camp &&
          !s.units.some((u) => u.tile === i) &&
          !["water", "mountain"].includes(t.terrain) &&
          starts.every(([q, r]) => distance(t, { q, r }) >= 5) &&
          !t.village,
      );
    if (candidates.length) {
      const { t, i } = candidates[Math.floor(random(s) * candidates.length)];
      t.camp = true;
      spawn(s, barbarianOwner(s), "warrior", i);
    }
  }
  reveal(s);
  event(s, "开拓者已就绪。找一块临河的土地，建立第一座城市。");
  return s;
}
export function spawn(s: State, owner: number, type: string, tile: number) {
  const d = info(type),
    n = s.nations[owner];
  const u: Unit = {
    id: s.next++,
    owner,
    type,
    tile,
    hp: 100,
    moves: d.moves ?? 2,
    charges:
      type === "builder"
        ? 3 +
          (n.civ === "china" ? 1 : 0) +
          (hasPolicy(n, "serfdom") || hasPolicy(n,'publicworks') ? 2 : 0) +
          (ownCities(s, owner).some((c) => c.buildings.includes("pyramids"))
            ? 1
            : 0)
        : type === "missionary"
          ? 3
          : 0,
    xp: 0,
    level: 0,
    fortified: false,
    acted: false,
  };
  s.units.push(u);
  return u;
}
export function visibleTiles(s: State, o = 0) {
  const result = new Set<number>();
  for (const u of s.units.filter((u) => u.owner === o))
    for (let i = 0; i < s.tiles.length; i++)
      if (distance(s.tiles[i], s.tiles[u.tile]) <= (u.type === "scout" ? 3 : 2))
        result.add(i);
  for (const c of ownCities(s, o))
    for (let i = 0; i < s.tiles.length; i++)
      if (distance(s.tiles[i], s.tiles[c.tile]) <= 3) result.add(i);
  return result;
}
export function reveal(s: State) {
  for (const owner of civilizedIds(s)) {
    const seen = visibleTiles(s, owner), n = s.nations[owner];
    n.explored = [...new Set([...(n.explored ?? []), ...seen])];
    if (owner === 0) for (const i of seen) s.tiles[i].seen = true;
    const encountered = new Set([...s.cities, ...s.units].filter(e => e.owner !== owner && s.nations[e.owner].kind !== 'barbarian' && seen.has(e.tile)).map(e => e.owner));
    for (const other of encountered) {
      if (!n.met.includes(other)) {
        const stateOwner=n.kind==='state'?owner:s.nations[other].kind==='state'?other:-1;
        const major=n.kind==='major'?owner:s.nations[other].kind==='major'?other:-1;
        if(stateOwner>=0 && major>=0 && !majorIds(s).some(o=>s.nations[o].met.includes(stateOwner))) {
          const cs=s.cityStates.find(cs=>cs.owner===stateOwner);
          if(cs) cs.envoys[major]++;
        }
        n.met.push(other);
        if (!s.nations[other].met.includes(owner)) {
          s.nations[other].met.push(owner);
          if (n.kind === 'major') boost(s,other,'writing');
          if (other === 0) event(s,`遇见${n.name}`);
        }
        if (s.nations[other].kind === 'major') boost(s, owner, 'writing');
        if (owner === 0) event(s, `遇见${s.nations[other].name}`);
      }
    }
    if (n.met.filter(o => s.nations[o].kind === 'state').length >= 3) boost(s, owner, 'philosophy');
    if ([...seen].some(i => s.tiles[i].naturalWonder)) boost(s, owner, 'astrology');
  }
}
export function boost(s: State, owner: number, id: string) {
  const n = s.nations[owner];
  const entry = [...techs, ...civics].find(t=>t.id===id);
  if (!entry?.boost) return;
  if (n.boosts.includes(id) || n.tech.includes(id) || n.civic.includes(id))
    return;
  n.boosts.push(id);
  if (owner === 0)
    event(
      s,
      `${techs.some((t) => t.id === id) ? "尤里卡" : "鼓舞"}：${[...techs, ...civics].find((t) => t.id === id)?.name}`,
      "research",
    );
}
export function canFound(s: State, u: Unit) {
  const t = s.tiles[u.tile];
  return (
    active(s) &&
    u.type === "settler" &&
    u.moves > 0 &&
    t.terrain !== "water" &&
    t.terrain !== "mountain" &&
    t.owner < 0 &&
    s.cities.every((c) => distance(t, s.tiles[c.tile]) >= 4)
  );
}
export function claim(s: State, c: City, i: number) {
  const t = s.tiles[i];
  if (t.owner >= 0 && t.territory !== c.id) return false;
  t.owner = c.owner;
  t.territory = c.id;
  return true;
}
export function found(s: State, u: Unit) {
  if (!canFound(s, u)) return false;
  const n = s.nations[u.owner],
    count = ownCities(s, u.owner).length,
    civ = civilizations.find((c) => c.id === n.civ)!;
  const c: City = {
    id: s.next++,
    owner: u.owner,
    name:
      n.kind === "state"
        ? n.name
        : civ.cities[count % civ.cities.length] +
          (count >= civ.cities.length ? ` ${count + 1}` : ""),
    tile: u.tile,
    capital: count === 0 && n.kind === "major" ? u.owner : -1,
    pop: 1,
    food: 0,
    hp: 200,
    walls: 0,
    buildings: n.civ === "rome" && n.kind === "major" ? ["monument"] : [],
    queue: [{ item: "monument", tile: -1 }],
    invested: {},
    productionCosts: {},
    districtPlacements: {},
    border: 0,
    focus: "balanced",
    religion: -1,
    pressure: Array(majorIds(s).length).fill(0),
    attacked: false,
  };
  if (c.buildings.includes("monument")) c.queue = [];
  s.cities.push(c);
  s.tiles[u.tile].city = c.id;
  s.tiles[u.tile].village = false;
  s.tiles[u.tile].camp = false;
  s.tiles[u.tile].road = true;
  for (const i of [u.tile, ...neighbors(s, u.tile)]) claim(s, c, i);
  s.units = s.units.filter((x) => x.id !== u.id);
  if (neighbors(s, u.tile).some((i) => s.tiles[i].terrain === "water"))
    boost(s, u.owner, "sailing");
  if (!u.owner) {
    reveal(s);
    event(s, `${c.name}建立`, "city");
  }
  return true;
}
export function resourceVisible(n: Nation, t: Tile) {
  const d = resources[t.resource];
  return (
    !!d && (!d.unlock || n.tech.includes(d.unlock) || d.type !== "strategic")
  );
}
export function tileYield(s: State, t: Tile, o = 0): Yield {
  const y = emptyYield(),
    n = s.nations[o];
  const base = t.baseTerrain ?? (t.terrain==='forest' ? 'grass' : t.terrain==='hill' ? 'plain' : t.terrain==='water' ? 'coast' : t.terrain);
  y.food = base==='grass' ? 2 : ['plain','tundra','coast','ocean','lake'].includes(base) ? 1 : 0;
  y.production = base==='plain' ? 1 : 0;
  if (t.hills || t.terrain==='hill') y.production++;
  if (t.feature==='forest' || t.terrain==='forest') y.production++;
  if (t.feature==='rainforest' || t.feature==='marsh') y.food++;
  if (base==='coast' || base==='lake') y.gold=1;
  if (base==='mountain' || t.terrain==='mountain') return emptyYield();
  if (resourceVisible(n, t)) {
    if (["wheat", "cattle", "fish"].includes(t.resource)) y.food++;
    if (["iron", "horses", "coal", "oil"].includes(t.resource)) y.production++;
    if (["spices", "gems"].includes(t.resource)) y.gold += 2;
  }
  if (!t.pillaged) {
    if (t.improvement === "farm") {
      const adjacent = neighbors(s,s.tiles.indexOf(t)).filter(i=>s.tiles[i].improvement==='farm' && !s.tiles[i].pillaged).length;
      y.food += 1 + (n.tech.includes('replaceableparts') ? adjacent : n.civic.includes('feudal') ? Math.floor(adjacent/2) : 0);
    }
    if (t.improvement==='mine') y.production += 1 + (n.tech.includes('apprentice') ? 1 : 0) + (n.tech.includes('industry') ? 1 : 0);
    if (t.improvement==='lumber') y.production += 2;
    if (t.improvement==='oilwell') y.production += 2;
    if (t.improvement && t.improvement===resources[t.resource]?.improvement && resourceVisible(n,t) && resources[t.resource]?.type==='strategic' && n.pantheon==='crafts') {y.production++;y.faith++;}
    if (t.improvement==='fishery' && n.pantheon==='sea') y.production++;
    if (t.improvement==='pasture' && n.pantheon==='sky') y.culture++;
    if (t.improvement==='plantation' && n.pantheon==='festivals') y.culture++;
    if (t.improvement==='quarry' && n.pantheon==='stone') y.faith+=2;
    if (t.improvement === "pasture") {
      y.food++;
      y.production++;
    }
    if (t.improvement === "plantation") {
      y.food++;
      y.gold += 2;
    }
    if (t.improvement === "fishery") {
      y.food += 2;
      y.gold++;
    }
  }
  return y;
}
export function workedTiles(s: State, c: City) {
  return s.tiles
    .map((t, i) => ({ t, i }))
    .filter(
      ({ t, i }) =>
        t.territory === c.id &&
        t.city < 0 &&
        !t.district &&
        !Object.values(c.districtPlacements ?? {}).includes(i) &&
        t.terrain !== "mountain" &&
        distance(t, s.tiles[c.tile]) <= 3,
    )
    .sort((a, b) => {
      const x = tileYield(s, a.t, c.owner),
        y = tileYield(s, b.t, c.owner);
      const score = (z: Yield) =>
        z.food * (c.focus === "food" ? 4 : c.focus === "balanced" ? 2 : 1) +
        z.production * (c.focus === "production" ? 4 : 2) +
        z.gold * (c.focus === "gold" ? 4 : 1);
      return score(y) - score(x) || a.i - b.i;
    })
    .slice(0, c.pop)
    .map((x) => x.i);
}
export function baseHousing(s: State, c: City) {
  const tile = s.tiles[c.tile];
  const fresh = tile.river || neighbors(s,c.tile).some(i=>s.tiles[i].baseTerrain==='lake' || s.tiles[i].feature==='oasis');
  const coastal = neighbors(s,c.tile).some(i=>s.tiles[i].terrain==='water' && s.tiles[i].baseTerrain!=='lake');
  return c.buildings.includes('aqueduct') ? fresh ? 7 : 6 : fresh ? 5 : coastal ? 3 : 2;
}
export function palaceCity(s: State, owner: number) {
  const cities=ownCities(s,owner);
  return s.nations[owner].kind==='major' ? cities.find(c=>c.capital===owner) ?? cities[0] : undefined;
}
export function foreignTourists(s: State, owner: number) {
  return s.nations[owner].tourismAgainst.reduce((total, value, target)=>total + (target===owner ? 0 : Math.floor(value/(200*majorIds(s).length*speedMultiplier(s)))),0);
}
export function domesticTourists(s: State, owner: number) {
  const visiting = majorIds(s).reduce((sum,target)=>sum+(target===owner ? 0 : Math.floor(s.nations[target].tourismAgainst[owner]/(200*majorIds(s).length*speedMultiplier(s)))),0);
  return Math.max(0, Math.floor(s.nations[owner].totalCulture/(100*speedMultiplier(s))) - visiting);
}
export function cultureTarget(s: State, owner: number) {
  return Math.max(0, ...majorIds(s).map(o=>o===owner ? 0 : domesticTourists(s,o))) + 1;
}
export function adjacency(s: State, id: string, tile: number) {
  const t = s.tiles[tile],
    ns = neighbors(s, tile).map((i) => s.tiles[i]);
  const districts = ns.filter(t=>t.city >= 0 || t.district && info(t.district).kind === 'district').length;
  const minor = Math.floor(districts / 2);
  const plaza = ns.filter(t=>t.district === 'plaza').length;
  if (id === "campus") return ns.filter(t=>t.terrain==='mountain').length +
    Math.floor(ns.filter(t=>t.feature==='rainforest').length / 2) +
    ns.filter(t=>t.feature==='reef' || t.feature==='geothermal').length * 2 + minor + plaza;
  if (id === "holy")
    return (
      ns.filter((t) => t.terrain === "mountain").length +
      Math.floor(ns.filter((t) => t.feature === 'forest' || t.terrain === "forest").length / 2) + minor + plaza + ns.filter(t=>t.naturalWonder).length * 2
    );
  if (id === "industrial")
    return Math.floor(ns.filter(t=>t.improvement==='mine').length / 2) +
      Math.floor(ns.filter(t=>t.improvement==='lumber').length / 2) +
      ns.filter(t=>t.improvement==='quarry').length +
      ns.filter(t=>resources[t.resource]?.type==='strategic' && resourceVisible(s.nations[s.tiles[tile].owner] ?? s.nations[0], t)).length +
      ns.filter(t=>['aqueduct','dam','canal'].includes(t.district)).length * 2 + minor + plaza;
  if (id === "commercial")
    return (
      (t.river ? 2 : 0) + ns.filter((t) => t.district === "harbor").length * 2 + minor + plaza
    );
  if (id === "theater")
    return (
      ns.filter((t) => t.district && info(t.district).kind === "wonder")
        .length * 2 + ns.filter(t=>['entertainment','waterpark'].includes(t.district)).length*2 + minor + plaza
    );
  if (id === "harbor") return ns.filter((t) => t.city >= 0).length * 2 + ns.filter(t=>t.resource && t.terrain==='water').length + minor + plaza;
  return 0;
}
export function amenities(s: State, c: City) {
  const n = s.nations[c.owner],
    luxury = new Set(
      s.tiles
        .filter(
          (t) =>
            t.owner === c.owner &&
            resources[t.resource]?.type === "luxury" &&
            t.improvement === resources[t.resource].improvement &&
            !t.pillaged,
        )
        .map((t) => t.resource),
    ).size;
  return (
    (hasSuzerainBonus(s,c.owner,'桑给巴尔') && ownCities(s,c.owner).slice().sort((a,b)=>b.pop-a.pop || a.id-b.id).slice(0,6).some(city=>city.id===c.id) ? 2 : 0) +
    (cityBelief(s,c,'zen') && specialtyDistricts(c)>=2 ? 1 : 0) +
    (palaceCity(s,c.owner)?.id === c.id ? 2 : 0) +
    Math.floor(
      (luxury * Math.min(4, ownCities(s, c.owner).length)) /
        Math.max(1, ownCities(s, c.owner).length),
    ) +
    c.buildings.reduce((v, b) => v + (info(b).amenities ?? 0), 0) +
    (n.government === "republic" && hasDistrict(c) ? 1 : 0) +
    (n.government === 'digital' ? 2 : 0) +
    (hasPolicy(n,'liberalism') && specialtyDistricts(c)>=2 ? 1 : 0) +
    (hasPolicy(n, "newdeal") && specialtyDistricts(c)>=3 ? 2 : 0) +
    (hasPolicy(n, "retainers") &&
    s.units.some(
      (u) => u.tile === c.tile && u.owner === c.owner && info(u.type).strength,
    )
      ? 1
      : 0)
  );
}
export function yields(s: State, c: City) {
  const n = s.nations[c.owner],
    y = emptyYield();
  const center = tileYield(s,s.tiles[c.tile],c.owner), hasPalace = palaceCity(s,c.owner)?.id === c.id;
  y.food = Math.max(2,center.food);
  y.production = Math.max(1,center.production) + (hasPalace ? 2 : 0);
  y.gold = center.gold + (hasPalace ? 5 : 0);
  y.science = c.pop * 0.5 + (hasPalace ? 2 : 0);
  y.culture = c.pop * 0.3 + (hasPalace ? 1 : 0);
  for (const i of workedTiles(s, c)) {
    const v = tileYield(s, s.tiles[i], c.owner);
    for (const k of Object.keys(y) as (keyof Yield)[]) y[k] += v[k];
  }
  for (const b of c.buildings) {
    const d = info(b),
      tile = s.tiles.findIndex((t) => t.territory === c.id && t.district === b);
    if (tile >= 0 && s.tiles[tile].pillaged) continue;
    if (['shrine','temple'].includes(b) && !activeReligiousBuildings(s,c).includes(b)) continue;
    if (['library','university','lab'].includes(b) && s.tiles.some(t=>t.territory===c.id && t.district==='campus' && t.pillaged)) continue;
    for (const [k, v] of Object.entries(d.yields ?? {})) {
      const campusTile=s.tiles.findIndex(t=>t.territory===c.id && t.district==='campus');
      const rational = k==='science' && ['library','university','lab'].includes(b) && hasPolicy(n,'rational')
        ? (c.pop>=15 ? 0.5 : 0) + (campusTile>=0 && adjacency(s,'campus',campusTile)>=4 ? 0.5 : 0) : 0;
      y[k as keyof Yield] += (v + (k==='science' ? scientistBuildingBonus(s,c.owner,b) : 0)) * (1+rational);
    }
    if (tile >= 0) {
      const key =
        b === "campus"
          ? "science"
          : b === "holy"
            ? "faith"
            : b === "industrial"
              ? "production"
              : b === "theater"
                ? "culture"
                : "gold";
      const double = b==='campus' && (hasPolicy(n,'naturalphilosophy') || hasPolicy(n,'fiveyear'))
        || b==='industrial' && (hasPolicy(n,'craftsmen') || hasPolicy(n,'fiveyear'))
        || b==='holy' && hasPolicy(n,'scripture') || b==='theater' && hasPolicy(n,'aesthetics')
        || b==='commercial' && (hasPolicy(n,'towncharters') || hasPolicy(n,'economicunion'))
        || b==='harbor' && (hasPolicy(n,'navalinfra') || hasPolicy(n,'economicunion'));
      y[key] += adjacency(s, b, tile) * (double ? 2 : 1);
      if (b==='holy' && cityBelief(s,c,'work')) y.production+=adjacency(s,b,tile)*(double?2:1);
      if (b==='holy' && c.hildegard) y.science+=adjacency(s,b,tile)*(double?2:1);
    }
  }
  const religiousBuildings=activeReligiousBuildings(s,c);
  if(cityBelief(s,c,'choral')) y.culture+=religiousBuildings.reduce((v,id)=>v+(info(id).yields?.faith??0),0);
  if(cityBelief(s,c,'feed')) y.food+=religiousBuildings.length*3;
  if(cityBelief(s,c,'divine')) y.faith+=c.buildings.filter(id=>info(id).kind==='wonder').length*4;
  if (n.government==='autocracy' && hasPalace) for (const key of ['food','production','gold','science','culture','faith'] as const) y[key]++;
  if (hasPolicy(n,'godking') && hasPalace) {y.faith++;y.gold++;}
  if (n.government==='digital') y.culture+=specialtyDistricts(c)*2;
  if (n.government==='corporate') {
    y.production*=1+(c.buildings.includes('commercial')?0.1:0)+(c.buildings.includes('encampment')?0.1:0);
    y.science*=0.9;
  }
  if (n.government==='synthetic') y.tourism*=0.9;
  for (const route of s.routes.filter((r) => r.from === c.id)) {
    const dest = s.cities.find((c) => c.id === route.to);
    if (!dest) continue;
    const v = tradeYield(s, c, dest);
    for (const k of Object.keys(y) as (keyof Yield)[]) y[k] += v[k];
  }
  for (const route of s.routes.filter(r=>r.to===c.id)) {
    const source=s.cities.find(city=>city.id===route.from);
    if (source && democraticTrade(s,source,c)) {y.food+=4;y.production+=4;}
  }
  const csYield=cityStateYields(s,c);
  for(const k of Object.keys(y) as (keyof Yield)[]) y[k]+=csYield[k];
  const happy = amenities(s, c) - Math.floor((c.pop - 1) / 2),
    mult =
      happy >= 5 ? 1.2 : happy >= 3 ? 1.1 : happy <= -5 ? 0.7 : happy <= -3 ? 0.8 : happy < 0 ? 0.9 : 1;
  for (const k of [
    "production",
    "gold",
    "science",
    "culture",
    "faith",
  ] as const)
    y[k] *= mult;
  if (hasPolicy(n, "planning")) y.production++;
  if (n.government === "communist") {
    // Governor-dependent production is not granted until governors exist.
    y.science *= 1.1;
  }
  if (hasSuzerainBonus(s,c.owner,'日内瓦') && !civilizedIds(s).some(owner=>owner!==c.owner && atWar(s,c.owner,owner))) y.science*=1.15;
  let housing =
    (cityBelief(s,c,'feed') ? religiousBuildings.length*2 : 0) +
    baseHousing(s, c) + (hasPalace ? 1 : 0) +
    c.buildings.reduce((v, b) => v + (info(b).housing ?? 0), 0) +
    (n.government==='republic' && hasDistrict(c) ? 1 : 0) +
    (n.government==='monarchy' && c.buildings.includes('walls') ? 1 : 0) +
    (hasPolicy(n,'insulae') && specialtyDistricts(c)>=2 ? 1 : 0) +
    (hasPolicy(n,'medina') && specialtyDistricts(c)>=3 ? 2 : 0) +
    (hasPolicy(n, "newdeal") && specialtyDistricts(c)>=3 ? 4 : 0) +
    s.tiles.filter(
      (t) =>
        t.territory === c.id && ["farm", "pasture"].includes(t.improvement),
    ).length *
      0.5;
  const growing =
    Math.max(0, y.food - c.pop * 2) *
    (housing <= c.pop ? 0.25 : housing < c.pop + 2 ? 0.5 : 1) *
    (happy >= 5 ? 1.2 : happy >= 3 ? 1.1 : happy <= -5 ? 0 : happy <= -3 ? 0.7 : happy < 0 ? 0.85 : 1) *
    (n.pantheon==='fertility'?1.1:1);
  return {
    ...y,
    housing,
    amenities: amenities(s, c),
    requiredAmenities: Math.floor((c.pop - 1) / 2),
    happy,
    growing,
  };
}
export function totals(s: State, o = 0) {
  const y = emptyYield();
  for (const c of ownCities(s, o)) {
    const v = yields(s, c);
    for (const k of Object.keys(y) as (keyof Yield)[]) y[k] += v[k];
  }
  const founder=founderYield(s,o);
  for(const k of Object.keys(y) as (keyof Yield)[]) y[k]+=founder[k];
  const n=s.nations[o], discount=hasPolicy(n,'levee')?2:hasPolicy(n,'conscription')?1:0;
  y.gold -= s.units.filter(u=>u.owner===o).reduce((v,u)=>v+Math.max(0,(info(u.type).maintenance??0)-discount),0);
  return y;
}
export function placementReason(s: State, c: City, id: string, tile: number) {
  const t = s.tiles[tile];
  if (!t || t.territory !== c.id) return "需要本城领土";
  if (t.city >= 0 || t.district) return "地块已被占用";
  const locked=c.districtPlacements?.[id];
  if(locked!==undefined && locked!==tile) return '区域已放置，不能更换地块';
  if(s.cities.some(city=>Object.entries(city.districtPlacements??{}).some(([kind,at])=>at===tile && (city.id!==c.id || kind!==id)))) return '地块已有区域建设';
  if (s.cities.some((other) => other.queue.some((j) => j.tile === tile)))
    return "地块已有建设计划";
  if (distance(t, s.tiles[c.tile]) > 3) return "离城市中心不能超过三格";
  if (id === "harbor") {
    if (
      t.terrain !== "water" ||
      !neighbors(s, tile).some((i) => s.tiles[i].terrain !== "water")
    )
      return "港口需要沿岸水域";
  } else if (["water", "mountain"].includes(t.terrain))
    return "需要可建设的陆地";
  if (id === "pyramids" && t.terrain !== "desert") return "金字塔需要沙漠";
  if (id === "oracle" && t.terrain !== "hill") return "神谕需要丘陵";
  if (id === 'aqueduct') {
    if (distance(t,s.tiles[c.tile]) !== 1) return '水渠必须紧邻城市中心';
    if (!t.river && !neighbors(s,tile).some(i=>s.tiles[i].terrain==='mountain' || s.tiles[i].baseTerrain==='lake' || s.tiles[i].feature==='oasis')) return '水渠需要连接河流、湖泊、绿洲或山脉';
  }
  if (id === 'spaceport' && (t.hills || t.terrain==='hill')) return '航天中心需要平地';
  return "";
}
export function buildReason(s: State, c: City, id: string, queued = false) {
  const d = info(id),
    n = s.nations[c.owner];
  if (!d) return "未知项目";
  if (d.greatPerson) return '只能在伟人面板招募';
  if (!active(s)) return "游戏已结束";
  if (d.unlock && !n.tech.includes(d.unlock) && !n.civic.includes(d.unlock))
    return `需要${[...techs, ...civics].find((t) => t.id === d.unlock)?.name}`;
  if (d.needs && !(info(d.needs)?.kind==='project' ? ownCities(s,c.owner).some(city=>city.buildings.includes(d.needs!)) : c.buildings.includes(d.needs)))
    return `需要${info(d.needs).name}`;
  if (d.kind !== "unit" && !d.repeat && c.buildings.includes(id))
    return "已建成";
  if (d.kind==='project' && !d.repeat && ownCities(s,c.owner).some(city=>city.buildings.includes(id))) return '已建成';
  if (d.kind==='project' && !d.repeat && !queued && ownCities(s,c.owner).some(city=>city.id!==c.id && city.queue.some(job=>job.item===id))) return '其他城市正在建设';
  if (
    !queued &&
    c.queue.some((j) => j.item === id) &&
    d.kind !== "unit" &&
    !d.repeat
  )
    return "已在队列中";
  if (id === "settler" && c.pop < 2) return "需要至少二人口";
  if (d.resource && (n.strategic[d.resource] ?? 0) < 10)
    return `需要 10 ${resources[d.resource].name}`;
  if (
    d.domain === "sea" &&
    !neighbors(s, c.tile).some((i) => s.tiles[i].terrain === "water") &&
    !c.buildings.includes("harbor")
  )
    return "需要沿海城市";
  if (id === "watermill" && !s.tiles[c.tile].river) return "需要临河城市";
  if (id === "missionary" && !n.religion) return "先创立宗教";
  if (id === 'missionary' && c.religion !== c.owner) return '需要本城信奉你的宗教';
  if (d.kind === "wonder" && s.cities.some((c) => c.buildings.includes(id)))
    return "已被其他城市建成";
  if (d.kind === "district" && !["spaceport", "neighborhood", "aqueduct", "dam", "canal"].includes(id)) {
    const count = new Set([...c.buildings,...Object.keys(c.districtPlacements??{}),...c.queue.map(j=>j.item)].filter(b=>b!==id && info(b).kind==='district' && !['spaceport','neighborhood','aqueduct','dam','canal'].includes(b))).size;
    if (count >= 1 + Math.floor((c.pop - 1) / 3))
      return "人口不足以支持更多区域";
  }
  return "";
}
export function enqueue(s: State, c: City, id: string, tile = -1) {
  if (c.queue.length >= 5 || buildReason(s, c, id)) return false;
  const d = info(id);
  if (d.faithBuy) return false;
  if (
    ["district", "wonder"].includes(d.kind) &&
    placementReason(s, c, id, tile)
  )
    return false;
  const job = { item: id, tile }, key = jobKey(job);
  c.productionCosts ??= {};
  // Removing/reordering a queue does not erase the investment or its locked price.
  c.productionCosts[key] ??= Object.hasOwn(c.invested,key)
    ? Math.round(d.cost * speedMultiplier(s)) : cost(s,id,c);
  if(d.kind==='district') {
    c.districtPlacements ??={};c.districtPlacements[id]=tile;
    s.tiles[tile].improvement='';
  }
  c.queue.push(job);
  return true;
}
export const jobKey = (j: Job) => `${j.item}:${j.tile}`;
export function productionRate(s: State, c: City, id: string) {
  const n = s.nations[c.owner],
    d = info(id);
  let bonus=0;
  if (d.kind==='wonder') {
    if (hasSuzerainBonus(s,c.owner,'布鲁塞尔')) bonus+=0.15;
    if (n.government==='autocracy') bonus+=0.1;
    if (hasPolicy(n,'skyscrapers') || hasPolicy(n,'gothic') && (d.era??99)<=3 || hasPolicy(n,'labor') && (d.era??99)<=1) bonus+=0.15;
  }
  if (d.kind==='district' && n.government==='merchant') bonus+=0.15;
  if (d.kind==='project' && n.government==='synthetic') bonus+=0.3;
  if (d.kind==='unit') {
    if (n.government==='fascism') bonus+=0.5;
    if (id==='settler' && hasPolicy(n,'colonial')) bonus+=0.5;
    if (id==='builder' && (hasPolicy(n,'ilkum') || hasPolicy(n,'publicworks'))) bonus+=0.3;
    if (['melee','ranged','anticavalry'].includes(d.unitClass??'') && (hasPolicy(n,'agoge') && (d.era??99)<=1 || hasPolicy(n,'feudalcontract') && (d.era??99)<=3)) bonus+=0.5;
    if (d.unitClass==='cavalry' && hasPolicy(n,'maneuver') && (d.era??99)<=1) bonus+=0.5;
    if (d.unitClass==='naval' && hasPolicy(n,'maritime') && (d.era??99)<=1) bonus+=1;
  }
  if (id==='walls' && hasPolicy(n,'limes')) bonus+=1;
  if (n.civ==='egypt' && ['wonder','district'].includes(d.kind) && s.tiles[c.queue.find(j=>j.item===id)?.tile ?? -1]?.river) bonus+=0.15;
  const csProduction=d.kind==='unit'?envoyBonus(s,c,'military'):['wonder','building','district'].includes(d.kind)?envoyBonus(s,c,'industrial'):0;
  const output=yields(s,c), happy=output.happy;
  const mult=happy>=5?1.2:happy>=3?1.1:happy<=-5?0.7:happy<=-3?0.8:happy<0?0.9:1;
  return (output.production+csProduction*mult)*(1+bonus);
}
export function spawnTile(s: State, c: City, d: Item) {
  return [
    c.tile,
    ...neighbors(s, c.tile),
    ...s.tiles
      .map((t, i) => (t.territory === c.id ? i : -1))
      .filter((i) => i >= 0),
  ].find(
    (i) =>
      !s.units.some((u) => u.tile === i) &&
      s.tiles[i].terrain !== "mountain" &&
      (d.domain === "sea"
        ? s.tiles[i].terrain === "water"
        : s.tiles[i].terrain !== "water"),
  );
}
function complete(s: State, c: City, j: Job) {
  const n = s.nations[c.owner],
    d = info(j.item);
  if (buildReason(s, c, j.item, true)) return false;
  if (["district", "wonder"].includes(d.kind)) {
    const t = s.tiles[j.tile];
    if (!t || t.territory !== c.id || t.district || t.city >= 0) return false;
    t.district = j.item;
    t.improvement = "";
    t.pillaged = false;
    if(d.kind==='district') delete c.districtPlacements?.[j.item];
  }
  if (d.kind === "unit") {
    const at = spawnTile(s, c, d);
    if (at === undefined) return false;
    const u = spawn(s, c.owner, d.id, at);
    u.moves = 0;
    if (c.buildings.includes("encampment")) u.xp = 3;
    if (d.resource) n.strategic[d.resource] -= 10;
    if (d.id === "settler") c.pop--;
  } else if (d.repeat) {
    if (d.id === 'laser') {
      if (!n.space.launched) return false;
      n.space.speed++;
    } else if (d.id === "festival") {
      n.tourism += 30;
      if (n.culture)
        n.researchProgress[n.culture] =
          (n.researchProgress[n.culture] ?? 0) + 30;
    } else {
      if (n.research)
        n.researchProgress[n.research] =
          (n.researchProgress[n.research] ?? 0) + 40;
      n.great.science += 8;
    }
  } else {
    c.buildings.push(j.item);
    if (d.id === "walls") c.walls = 100;
    if (d.id === 'exoplanet') n.space = {launched:true,distance:0,speed:1};
    if (d.id === "satellite" && !c.owner)
      s.tiles.forEach((t) => (t.seen = true));
    if (d.id === "moon") advance(s,c.owner,true,totals(s,c.owner).science * 10);
  }
  if (!c.owner || d.kind === "wonder")
    event(s, `${c.name}完成${d.name}`, d.kind === "wonder" ? "wonder" : "city");
  return true;
}
export function purchasePrice(s: State, c: City, id: string) {
  const d=info(id),n=s.nations[c.owner];
  const base = d.faithBuy ? (d.faithCost ?? d.cost * 2) * speedMultiplier(s) : cost(s,id) * 4;
  return Math.round(base*(d.faithBuy && n.government==='theocracy'?0.85:!d.faithBuy && n.government==='democracy'?0.75:1));
}
export function purchase(s: State, c: City, id: string) {
  const d = info(id),
    n = s.nations[c.owner];
  if (buildReason(s, c, id) || !["unit", "building"].includes(d.kind))
    return false;
  const money = d.faithBuy ? "faith" : "gold",
    price = purchasePrice(s,c,id);
  if (n[money] < price) return false;
  if (!complete(s, c, { item: id, tile: -1 })) return false;
  n[money] -= price;
  return true;
}
export function buyTile(s: State, c: City, i: number) {
  const t = s.tiles[i],
    price = 25 + s.tiles.filter((t) => t.territory === c.id).length * 3;
  if (
    !active(s) ||
    !s.nations[c.owner].civic.includes("empire") ||
    !t ||
    t.owner >= 0 ||
    distance(t, s.tiles[c.tile]) > 3 ||
    !neighbors(s, i).some((k) => s.tiles[k].territory === c.id) ||
    s.nations[c.owner].gold < price
  )
    return false;
  s.nations[c.owner].gold -= price;
  claim(s, c, i);
  reveal(s);
  return true;
}
export function researchAvailable(n: Nation, id: string, civic = false) {
  const d = (civic ? civics : techs).find((t) => t.id === id),
    done = civic ? n.civic : n.tech;
  return !!d && !done.includes(id) && d.requires.every((r) => done.includes(r));
}
export function chooseResearch(s: State, id: string, civic = false, o = 0) {
  const n = s.nations[o];
  if (!active(s) || !researchAvailable(n, id, civic)) return false;
  n[civic ? "culture" : "research"] = id;
  return true;
}
export function advance(s: State, o: number, civic: boolean, amount: number) {
  const n = s.nations[o],
    key = civic ? "culture" : "research",
    done = civic ? n.civic : n.tech,
    list = civic ? civics : techs;
  for (let limit = 0; limit < list.length; limit++) {
    if (!researchAvailable(n, n[key], civic))
      n[key] = o ? aiResearch(s, o, civic) : list.find((d) => researchAvailable(n, d.id, civic))?.id ?? "";
    const d = list.find((d) => d.id === n[key]);
    if (!d) return;
    n.researchProgress[d.id] = (n.researchProgress[d.id] ?? 0) + amount;
    amount = 0;
    const requirement = researchCost(s, n, d);
    if (n.researchProgress[d.id] < requirement) return;
    amount = n.researchProgress[d.id] - requirement;
    n.researchProgress[d.id] = requirement;
    done.push(d.id);
    n.districtDiscountBasis = ownCities(s,o).reduce((v,c) => v + specialtyDistricts(c), 0);
    if (civic) {
      n.policies=n.policies.map(id=>id && policyAvailable(n,id)?id:null);
      n.envoys += civicEnvoyRewards[d.sourceId ?? ''] ?? 0;
      n.policyFree = true;
      if (d.id === "laws" && !n.policies.some(Boolean))
        n.policies = ["discipline", "planning"];
    }
    if (o === 0)
      event(s, `${civic ? "市政" : "科技"}完成：${d.name}`, "research");
    n[key] = o ? aiResearch(s, o, civic) : list.find((d) => researchAvailable(n, d.id, civic))?.id ?? "";
  }
}
export function configureGovernment(
  s: State,
  id: string,
  chosen: (string | null)[],
  owner = 0,
) {
  const n = s.nations[owner],
    g = governments.find((g) => g.id === id);
  if (
    !g ||
    !n.civic.includes(g.unlock) ||
    chosen.length !== g.slots.length ||
    !active(s)
  )
    return false;
  const used = new Set<string>();
  for (let i = 0; i < chosen.length; i++) {
    const id = chosen[i];
    if (!id) continue;
    const p = policies.find((p) => p[0] === id);
    if (
      !p ||
      !policyAvailable({...n,government:g.id},id) ||
      used.has(id) ||
      (g.slots[i] !== "wild" && p[3] !== g.slots[i])
    )
      return false;
    used.add(id);
  }
  const charge = n.policyFree ? 0 : 40;
  if (n.gold < charge) return false;
  n.gold -= charge;
  n.government = g.id;
  n.policies = [...chosen];
  n.policyFree = false;
  return true;
}
export function passable(s: State, u: Unit, i: number, ignoreUnits = false) {
  const t = s.tiles[i],
    d = info(u.type);
  if (!t || t.terrain === "mountain") return false;
  if (d.domain === "sea" && t.terrain !== "water") return false;
  if (
    d.domain !== "sea" &&
    t.terrain === "water" &&
    !s.nations[u.owner].tech.includes("shipbuilding")
  )
    return false;
  if (!ignoreUnits && s.units.some((v) => v.id !== u.id && v.tile === i))
    return false;
  const c = s.cities.find((c) => c.tile === i);
  if (c && c.owner !== u.owner) return false;
  if (
    t.owner >= 0 &&
    t.owner !== u.owner &&
    s.nations[t.owner].kind === "major" &&
    !atWar(s, u.owner, t.owner) &&
    relation(s, u.owner, t.owner).status !== "friend"
  )
    return false;
  return true;
}
export function movementCost(s: State, u: Unit, from: number, to: number) {
  const a = s.tiles[from],
    b = s.tiles[to];
  const terrainCost = b.road && a.road ? 1 : 1 + (b.hills || b.terrain==='hill' ? 1 : 0) + (['forest','rainforest','marsh'].includes(b.feature ?? '') || b.terrain==='forest' ? 1 : 0) + (a.river!==b.river ? 1 : 0);
  // A unit with its full allowance can enter one expensive tile; otherwise a
  // two-move settler would never be able to enter a forested hill at all.
  return Math.min(terrainCost, info(u.type).moves ?? 2);
}
export function zone(s: State, u: Unit, i: number) {
  return s.units.some(
    (v) =>
      atWar(s, u.owner, v.owner) &&
      !!info(v.type).strength &&
      !info(v.type).range &&
      distance(s.tiles[v.tile], s.tiles[i]) === 1,
  );
}
export function path(
  s: State,
  u: Unit,
  to: number,
  budget = u.moves,
  ignoreVisibility = false,
  ignoreUnits = false,
): number[] {
  if (!s.tiles[to]) return [];
  const best = new Map<number, number>([[u.tile, 0]]),
    prev = new Map<number, number>(),
    open = [u.tile];
  while (open.length) {
    open.sort((a, b) => best.get(a)! - best.get(b)!);
    const i = open.shift()!;
    if (i === to) {
      const result = [i];
      while (result[0] !== u.tile) result.unshift(prev.get(result[0])!);
      return result;
    }
    if (i !== u.tile && zone(s, u, i) && u.type !== "scout") continue;
    for (const k of neighbors(s, i)) {
      if (
        !passable(s, u, k, ignoreUnits) ||
        (!ignoreVisibility && u.owner === 0 && !s.tiles[k].seen)
      )
        continue;
      const score = best.get(i)! + movementCost(s, u, i, k);
      if (score <= budget && score < (best.get(k) ?? Infinity)) {
        best.set(k, score);
        prev.set(k, i);
        if (!open.includes(k)) open.push(k);
      }
    }
  }
  return [];
}
export function reachable(s: State, u: Unit) {
  const best = new Map<number, number>([[u.tile, 0]]),
    open = [u.tile];
  while (open.length) {
    open.sort((a, b) => best.get(a)! - best.get(b)!);
    const i = open.shift()!;
    if (i !== u.tile && zone(s, u, i) && u.type !== "scout") continue;
    for (const k of neighbors(s, i)) {
      if (!passable(s, u, k) || (u.owner === 0 && !s.tiles[k].seen)) continue;
      const score = best.get(i)! + movementCost(s, u, i, k);
      if (score <= u.moves && score < (best.get(k) ?? Infinity)) {
        best.set(k, score);
        if (!open.includes(k)) open.push(k);
      }
    }
  }
  best.delete(u.tile);
  return best;
}
export function move(s: State, u: Unit, to: number) {
  if (!active(s) || !u.moves) return false;
  const route = path(s, u, to);
  if (route.length < 2) return false;
  for (let k = 1; k < route.length; k++) {
    u.moves -= movementCost(s, u, route[k - 1], route[k]);
    u.tile = route[k];
    const t = s.tiles[u.tile];
    if (t.village) {
      t.village = false;
      const r = random(s);
      if (r < 0.4) {
        s.nations[u.owner].gold += 40;
        if (!u.owner) event(s, "部落村庄赠予 40 金币");
      } else if (r < 0.75) {
        s.nations[u.owner].faith += 25;
        if (!u.owner) event(s, "部落村庄赠予 25 信仰");
      } else {
        const tech = techs.find((d) =>
          researchAvailable(s.nations[u.owner], d.id),
        );
        if (tech) boost(s, u.owner, tech.id);
      }
    }
    if (t.camp) {
      t.camp = false;
      s.nations[u.owner].gold += 50;
      boost(s, u.owner, "military");
      if (!u.owner) event(s, "蛮族营地已清除，获得 50 金币", "combat");
    }
    if (zone(s, u, u.tile) && u.type !== "scout") u.moves = 0;
  }
  u.fortified = false;
  u.acted = true;
  if (!u.owner) reveal(s);
  return true;
}
export function strength(
  s: State,
  u: Unit,
  against: number,
  defending = false,
) {
  const n = s.nations[u.owner];
  return (
    ((!defending && info(u.type).range ? info(u.type).bombardStrength ?? info(u.type).rangedStrength : info(u.type).strength) ?? 0) +
    u.level * 4 +
    (hasPolicy(n, "discipline") && against === barbarianOwner(s) ? 5 : 0) +
    (n.government === "oligarchy" && ['melee','anticavalry','naval'].includes(info(u.type).unitClass??'') ? 4 : 0) +
    (n.government==='fascism' ? 5 : n.government==='digital' ? -3 : 0) -
    (info(u.type).domain !== "sea" && s.tiles[u.tile].terrain === "water"
      ? 10
      : 0) -
    Math.round((100 - u.hp) / 10) +
    (defending &&
    (s.tiles[u.tile].terrain === "hill" || s.tiles[u.tile].terrain === "forest")
      ? 3
      : 0) +
    (defending && u.fortified ? 6 : 0)
  );
}
export function combatPreview(s: State, u: Unit, i: number) {
  const t = s.tiles[i];
  if (!t) return null;
  const enemy = s.units.find((v) => v.tile === i && v.owner !== u.owner),
    city = s.cities.find((c) => c.tile === i && c.owner !== u.owner);
  if (!enemy && !city) return null;
  const owner = (enemy ?? city)!.owner;
  if (!atWar(s, u.owner, owner) || !info(u.type).strength || !u.moves)
    return null;
  if (!info(u.type).range) {
    if (info(u.type).domain === "sea" && t.terrain !== "water" && !city)
      return null;
    if (
      info(u.type).domain !== "sea" &&
      t.terrain === "water" &&
      !s.nations[u.owner].tech.includes("shipbuilding")
    )
      return null;
  }
  const dist = distance(s.tiles[u.tile], t);
  if (dist < 1 || dist > (info(u.type).range ?? 1)) return null;
  if (
    info(u.type).range &&
    dist > 1 &&
    neighbors(s, u.tile)
      .filter((k) => distance(s.tiles[k], t) < dist)
      .every((k) => s.tiles[k].terrain === "mountain")
  )
    return null;
  const attack =
      strength(s, u, owner),
    defense = enemy
      ? strength(s, enemy, u.owner, true)
      : 25 + city!.pop + era(s.nations[owner]) * 3 + (city!.walls > 0 ? 12 : 0);
  const base = 30 * Math.exp((attack - defense) / 25);
  const damage = Math.max(1, Math.round(base));
  const damageMin = Math.max(1, Math.round(base * 0.8)), damageMax = Math.max(1, Math.round(base * 1.2));
  const retaliation =
    info(u.type).range || (enemy && !info(enemy.type).strength)
      ? 0
      : Math.max(1, Math.round(30 * Math.exp((defense - attack) / 25)));
  const retaliationBase = retaliation ? 30 * Math.exp((defense - attack) / 25) : 0;
  return { enemy, city, owner, damage, damageMin, damageMax, retaliation,
    retaliationMin: retaliation ? Math.max(1,Math.round(retaliationBase * 0.8)) : 0,
    retaliationMax: retaliation ? Math.max(1,Math.round(retaliationBase * 1.2)) : 0, attack, defense };
}
export function attack(s: State, u: Unit, i: number) {
  if (!active(s)) return false;
  const p = combatPreview(s, u, i);
  if (!p) return false;
  // Preview is read-only. Only a legal attack consumes the persisted RNG sequence.
  p.damage = Math.max(1,Math.round(30 * Math.exp((p.attack-p.defense)/25) * (0.8 + random(s)*0.4)));
  if (p.retaliation) p.retaliation = Math.max(1,Math.round(30 * Math.exp((p.defense-p.attack)/25) * (0.8 + random(s)*0.4)));
  u.hp -= p.retaliation;
  u.xp += 2 * (1+(s.nations[u.owner].government==='oligarchy'?0.2:0)) * (u.type==='scout' && hasPolicy(s.nations[u.owner],'survey')?2:1) * (hasSuzerainBonus(s,u.owner,'喀布尔')?2:1);
  u.moves = 0;
  u.acted = true;
  u.fortified = false;
  if (p.enemy) {
    p.enemy.hp -= p.damage;
    if(displaceGreatPerson(s,p.enemy) && !info(u.type).range && u.hp>0 && !p.city) u.tile=i;
    if (p.enemy.hp <= 0) {
      s.units = s.units.filter((v) => v.id !== p.enemy!.id);
      s.nations[u.owner].kills++;
      if (u.type==='slinger') boost(s, u.owner, "archery");
      if (p.enemy.owner===barbarianOwner(s)) {
        s.nations[u.owner].barbarianKills++;
        if (s.nations[u.owner].barbarianKills>=3) boost(s,u.owner,'bronze');
      }
      if (u.type==='musket') boost(s,u.owner,'squarerigging');
      if (!info(u.type).range && u.hp > 0 && !p.city) u.tile = i;
    }
  } else {
    const c = p.city!;
    if (c.walls > 0)
      c.walls = Math.max(
        0,
        c.walls -
          p.damage * (["catapult", "artillery"].includes(u.type) ? 1.5 : 0.7),
      );
    else c.hp = Math.max(0, c.hp - p.damage);
    if (c.hp <= 0 && !info(u.type).range && u.hp > 0) {
      const old = c.owner;
      c.owner = u.owner;
      c.hp = 100;
      c.pop = Math.max(1, c.pop - 1);
      c.queue = [];
      c.attacked = true;
      for (const t of s.tiles) if (t.territory === c.id) t.owner = u.owner;
      if (info(u.type).domain !== "sea") u.tile = i;
      s.routes = s.routes.filter((r) => r.from !== c.id && r.to !== c.id);
      event(s, `${s.nations[u.owner].name}攻占${c.name}`, "combat");
      if (old !== barbarianOwner(s) && u.owner !== barbarianOwner(s)) relation(s, old, u.owner).opinion -= 20;
    }
  }
  if (u.owner === 0)
    event(
      s,
      `攻击造成 ${p.damage} 伤害${p.retaliation ? `，受到 ${p.retaliation} 反击` : ""}`,
      "combat",
    );
  s.units = s.units.filter((v) => v.hp > 0);
  reveal(s);
  checkVictory(s);
  return true;
}
function displaceGreatPerson(s:State,u:Unit) {
  if(u.hp>0 || !info(u.type).greatPerson) return false;
  const refuge=ownCities(s,u.owner).slice().sort((a,b)=>distance(s.tiles[a.tile],s.tiles[u.tile])-distance(s.tiles[b.tile],s.tiles[u.tile])).map(c=>spawnTile(s,c,info(u.type))).find(at=>at!==undefined);
  if(refuge===undefined) return false;
  u.tile=refuge;u.hp=100;u.moves=0;
  return true;
}
export function cityAttack(s: State, c: City, i: number) {
  const u = s.units.find((u) => u.tile === i && atWar(s, u.owner, c.owner));
  if (
    !active(s) ||
    c.attacked ||
    c.walls <= 0 ||
    !u ||
    distance(s.tiles[c.tile], s.tiles[i]) > 2
  )
    return false;
  u.hp -= Math.max(
    1,
    Math.round(
      30 * Math.exp((30 + c.pop - strength(s, u, c.owner, true)) / 25) * (0.8 + random(s) * 0.4),
    ),
  );
  displaceGreatPerson(s,u);
  c.attacked = true;
  s.units = s.units.filter((u) => u.hp > 0);
  return true;
}
export function promote(s: State, u: Unit) {
  if (
    !active(s) ||
    u.xp < 3 * (u.level + 1) ||
    !info(u.type).strength ||
    !u.moves
  )
    return false;
  u.xp -= 3 * (u.level + 1);
  u.level++;
  u.hp = Math.min(100, u.hp + 50);
  u.moves = 0;
  u.acted = true;
  s.nations[u.owner].promotions++;
  return true;
}
export function upgradeTo(s: State, u: Unit) {
  const chain: Record<string, string> = {
    warrior: "sword",
    sword: "musket",
    musket: "tank",
    archer: "crossbow",
    catapult: "artillery",
    galley: "ironclad",
  };
  const id = chain[u.type];
  if (!id) return "";
  const n = s.nations[u.owner],
    d = info(id);
  return (!d.unlock || n.tech.includes(d.unlock)) &&
    (!d.resource || n.strategic[d.resource] >= 10)
    ? id
    : "";
}
export function upgrade(s: State, u: Unit) {
  const id = upgradeTo(s, u),
    n = s.nations[u.owner];
  if (!id || !u.moves || s.tiles[u.tile].owner !== u.owner || !active(s))
    return false;
  const price = Math.ceil(
    (cost(s, id) - cost(s, u.type)) *
      2 *
      (hasPolicy(n, "professional") ? 0.5 : 1),
  );
  if (n.gold < price) return false;
  n.gold -= price;
  if (info(id).resource) n.strategic[info(id).resource!] -= 10;
  u.type = id;
  u.moves = 0;
  u.acted = true;
  return true;
}
export function improvementReason(s: State, u: Unit, id: string) {
  const t = s.tiles[u.tile],
    n = s.nations[u.owner],
    d = improvements[id];
  if (!active(s) || u.type !== "builder" || !u.moves || !u.charges)
    return "需要有行动力的建造者";
  if (!d) return "未知改良";
  if (t.owner !== u.owner || t.city >= 0 || t.district)
    return "需要己方空闲地块";
  if (t.improvement) return t.pillaged ? "先修复现有改良" : "已有地块改良";
  if (d.unlock && !n.tech.includes(d.unlock)) return "尚未研究对应科技";
  if (
    id === "farm" &&
    !["grass", "plain"].includes(t.terrain) &&
    !(t.terrain === "desert" && t.river)
  )
    return "农场需要草原、平原或临河沙漠";
  if (
    id === "mine" &&
    t.terrain !== "hill" &&
    !["iron", "coal", "gems"].includes(t.resource)
  )
    return "需要丘陵或矿产资源";
  if (id === "pasture" && !["horses", "cattle"].includes(t.resource))
    return "需要马或牲畜";
  if (id === "plantation" && t.resource !== "spices") return "需要香料";
  if (id === "lumber" && t.terrain !== "forest") return "需要森林";
  if (id === "fishery" && t.terrain !== "water") return "需要水域";
  if (id === "oilwell" && t.resource !== "oil") return "需要石油";
  return "";
}
export function improve(s: State, u: Unit, id: string) {
  if (improvementReason(s, u, id)) return false;
  const t = s.tiles[u.tile];
  t.improvement = id;
  t.pillaged = false;
  u.charges--;
  u.moves = 0;
  u.acted = true;
  checkBoosts(s,u.owner);
  if (!u.charges) s.units = s.units.filter((v) => v.id !== u.id);
  return true;
}
export function repair(s: State, u: Unit) {
  const t = s.tiles[u.tile];
  if (
    !active(s) ||
    u.type !== "builder" ||
    !u.moves ||
    t.owner !== u.owner ||
    !t.pillaged
  )
    return false;
  t.pillaged = false;
  u.moves = 0;
  u.acted = true;
  return true;
}
export function chop(s: State, u: Unit) {
  const t = s.tiles[u.tile],
    c = s.cities.find((c) => c.id === t.territory);
  if (
    !active(s) ||
    u.type !== "builder" ||
    !u.moves ||
    !u.charges ||
    (t.terrain !== "forest" && t.feature !== 'forest') ||
    t.owner !== u.owner ||
    !s.nations[u.owner].tech.includes("mining") ||
    !c?.queue.length ||
    t.district
  )
    return false;
  const key = jobKey(c.queue[0]);
  c.invested[key] = (c.invested[key] ?? 0) + 25;
  t.feature = '';
  t.terrain = t.hills ? 'hill' : t.baseTerrain==='plain' ? 'plain' : t.baseTerrain==='desert' ? 'desert' : 'grass';
  t.improvement = "";
  u.charges--;
  u.moves = 0;
  u.acted = true;
  if (!u.charges) s.units = s.units.filter((v) => v.id !== u.id);
  return true;
}
export function pillage(s: State, u: Unit) {
  const t = s.tiles[u.tile];
  if (
    !active(s) ||
    !u.moves ||
    !info(u.type).strength ||
    t.owner < 0 ||
    !atWar(s, u.owner, t.owner) ||
    t.pillaged ||
    (!t.improvement && !t.district)
  )
    return false;
  t.pillaged = true;
  u.moves = 0;
  u.acted = true;
  u.hp = Math.min(100, u.hp + 25);
  s.nations[u.owner].gold += 25;
  return true;
}
export function tradeCapacity(s: State, o = 0) {
  return (
    1 +
    ownCities(s, o).filter(
      (c) =>
        c.buildings.includes("commercial") || c.buildings.includes("harbor"),
    ).length
  );
}
export function tradeYield(s: State, from: City, to: City) {
  const y = emptyYield(),
    n = s.nations[from.owner],
    domestic = from.owner === to.owner;
  if (domestic) {
    y.food =
      2 +
      to.buildings.filter((b) => ["granary", "watermill"].includes(b)).length;
    y.production =
      1 +
      to.buildings.filter((b) =>
        ["industrial", "workshop", "factory"].includes(b),
      ).length;
  } else {
    y.gold =
      4 +
      distance(s.tiles[from.tile], s.tiles[to.tile]) * 0.25 +
      (n.civ === "egypt" ? 2 : 0) +
      (n.civic.includes("economics") ? 3 : 0);
    y.science = to.buildings.includes("campus") ? 1 : 0;
    y.culture = to.buildings.includes("theater") ? 1 : 0;
  }
  if (hasPolicy(n, "caravans")) y.gold += 2;
  if (hasPolicy(n,'triangular')) {y.gold+=4;y.faith++;}
  if (hasPolicy(n,'ecommerce')) {y.gold+=5;y.production+=2;}
  if (domestic && hasPolicy(n,'collectivization')) {y.food+=4;y.production+=2;}
  if (!domestic && hasPolicy(n,'tradeconfederation')) {y.science++;y.culture++;}
  if (democraticTrade(s,from,to)) {y.food+=4;y.production+=4;}
  if (!domestic && cityBelief(s,from,'community') && from.buildings.includes('holy')) y.gold+=2*(1+activeReligiousBuildings(s,from).length);
  if (s.nations[to.owner].kind==='state' && hasSuzerainBonus(s,from.owner,'库马西')) {
    y.culture+=specialtyDistricts(from)*2;y.gold+=specialtyDistricts(from);
  }
  return y;
}
export function democraticTrade(s: State, from: City, to: City) {
  const cs=s.cityStates.find(cs=>cs.owner===to.owner);
  return s.nations[from.owner].government==='democracy' && !!cs && suzerain(s,cs)===from.owner;
}
export function tradeTargets(s: State, u: Unit) {
  const source = s.cities.find((c) => c.tile === u.tile && c.owner === u.owner);
  if (
    !source ||
    u.type !== "trader" ||
    s.routes.filter((r) => r.owner === u.owner).length >=
      tradeCapacity(s, u.owner)
  )
    return [];
  return s.cities
    .filter(
      (c) =>
        c.id !== source.id &&
        !atWar(s, c.owner, u.owner) &&
        (u.owner !== 0 ||
          c.owner === 0 ||
          s.nations[0].met.includes(c.owner)) &&
        distance(s.tiles[c.tile], s.tiles[source.tile]) <= 14 &&
        !s.routes.some(
          (r) => r.owner === u.owner && r.from === source.id && r.to === c.id,
        ),
    )
    .filter((c) => tradePath(s, source.tile, c.tile).length > 0);
}
export function tradePath(s: State, from: number, to: number) {
  const previous = new Map<number, number>(),
    queue = [from],
    seen = new Set(queue);
  while (queue.length) {
    const i = queue.shift()!;
    if (i === to) {
      const p = [i];
      while (p[0] !== from) p.unshift(previous.get(p[0])!);
      return p;
    }
    for (const k of neighbors(s, i))
      if (!seen.has(k) && !["mountain", "water"].includes(s.tiles[k].terrain)) {
        seen.add(k);
        previous.set(k, i);
        queue.push(k);
      }
  }
  return [];
}
export function establishTrade(s: State, u: Unit, to: number) {
  if (!active(s) || !u.moves) return false;
  const c = tradeTargets(s, u).find((c) => c.id === to),
    from = s.cities.find((c) => c.tile === u.tile && c.owner === u.owner);
  if (!c || !from) return false;
  const p = tradePath(s, from.tile, c.tile);
  s.routes.push({
    id: s.next++,
    owner: u.owner,
    from: from.id,
    to: c.id,
    path: p,
    remaining: 24,
  });
  p.forEach((i) => (s.tiles[i].road = true));
  s.units = s.units.filter((v) => v.id !== u.id);
  boost(s, u.owner, "currency");
  if (!u.owner) event(s, `${from.name} → ${c.name}贸易路线开始`);
  return true;
}
function declareWar(s: State, attacker: number, target: number) {
  const r = relation(s,attacker,target);
  if (!active(s) || !r || r.status !== 'peace' || s.turn < r.until) return false;
  r.status='war';r.since=s.turn;r.opinion-=30;
  const cs=s.cityStates.find(cs=>cs.owner===target);
  if(cs && s.nations[attacker].kind==='major') cs.envoys[attacker]=0;
  if (s.nations[target].kind === 'major') boost(s,target,'defensivetactics');
  s.routes=s.routes.filter(route => {
    const a=s.cities.find(c=>c.id===route.from),b=s.cities.find(c=>c.id===route.to);
    return !!a && !!b && !atWar(s,a.owner,b.owner);
  });
  return true;
}
export function diplomacy(
  s: State,
  target: number,
  action: "war" | "peace" | "delegate" | "friend",
) {
  const n = s.nations[0],
    r = relation(s, 0, target);
  if (!active(s) || !r || !n.met.includes(target)) return false;
  if (action === "war") {
    if (!declareWar(s,0,target)) return false;
    event(s, `向${s.nations[target].name}宣战`, "combat");
  }
  if (action === "peace") {
    if (r.status !== "war" || s.turn - r.since < 8) return false;
    r.status = "peace";
    r.since = s.turn;
    r.until = s.turn + 12;
    r.opinion = -5;
    event(s, `与${s.nations[target].name}签订和平`);
  }
  if (action === "delegate") {
    if (r.status === "war" || r.delegation || n.gold < 25) return false;
    n.gold -= 25;
    r.delegation = true;
    r.opinion += 15;
  }
  if (action === "friend") {
    if (r.status !== "peace" || r.opinion < 10) return false;
    r.status = "friend";
    r.until = s.turn + 30;
    r.since = s.turn;
    event(s, `与${s.nations[target].name}宣布友谊`);
  }
  return true;
}
export function sendEnvoy(s: State, target: number, owner=0) {
  const cs = s.cityStates.find((c) => c.owner === target),
    n = s.nations[owner];
  if (
    !active(s) ||
    !cs ||
    !n.envoys ||
    !n.met.includes(target) ||
    atWar(s, owner, target) || !ownCities(s,target).length || n.kind!=='major'
  )
    return false;
  n.envoys--;
  cs.envoys[owner]+=hasPolicy(n,'league') && cs.envoys[owner]===0?2:1;
  return true;
}
export function pantheon(s: State, id: string, owner=0) {
  const n = s.nations[owner];
  if (
    !active(s) ||
    n.pantheon ||
    n.faith < 25 ||
    n.kind!=='major' || !pantheons.some(p=>p.id===id) || s.nations.some(other=>other.pantheon===id)
  )
    return false;
  n.faith -= 25;
  n.pantheon = id;
  if(id==='fertility') {n.pantheonGift=true;deliverPantheonGift(s,owner);}
  boost(s,owner,'mysticism');
  return true;
}
function deliverPantheonGift(s:State,owner:number) {
  const n=s.nations[owner],capital=palaceCity(s,owner);
  if (!n.pantheonGift || !capital) return;
  const at=spawnTile(s,capital,info('builder'));
  if(at!==undefined) {spawn(s,owner,'builder',at);n.pantheonGift=false;}
}
export const religionLimit=(s:State)=>Math.min(majorIds(s).length,s.options.size==='compact'?3:5);
export const prophetCost=(s:State)=>Math.ceil(60*speedMultiplier(s));
export function recruitProphet(s:State,owner=0) {
  const n=s.nations[owner],city=ownCities(s,owner).find(c=>c.buildings.includes('holy'));
  const reserved=majorIds(s).filter(o=>s.nations[o].religion || s.nations[o].prophetRecruited).length;
  if(!active(s) || n.kind!=='major' || n.religion || n.prophetRecruited || reserved>=religionLimit(s) || n.great.prophet<prophetCost(s) || !city) return false;
  const holy=s.tiles.findIndex((t,i)=>t.territory===city.id && t.district==='holy' && !s.units.some(u=>u.tile===i));
  const at=holy>=0 ? holy : spawnTile(s,city,info('prophet'));
  if(at===undefined) return false;
  n.great.prophet-=prophetCost(s);n.prophetRecruited=true;n.greatPeopleEarned=(n.greatPeopleEarned??0)+1;
  spawn(s,owner,'prophet',at);
  if(!owner) event(s,'大预言家已招募。前往圣地创立宗教。');
  return true;
}
export function religionCity(s:State,owner=0) {
  return ownCities(s,owner).find(c=>c.buildings.includes('holy') && s.units.some(u=>u.owner===owner && u.type==='prophet' && u.moves>0 &&
    (s.tiles[u.tile].territory===c.id && s.tiles[u.tile].district==='holy' || u.tile===c.tile && !s.tiles.some(t=>t.territory===c.id && t.district==='holy'))));
}
export function foundReligion(s: State, o = 0, chosen?: string[]) {
  const n=s.nations[o],city=religionCity(s,o);
  const selection=chosen ?? ['follower','founder'].map(type=>availableBeliefs(s,type as 'follower'|'founder')[0]?.id??'');
  const allowed=selection.length===2 && new Set(selection).size===2 && selection.filter(id=>beliefs.some(b=>b.id===id&&b.type==='follower')).length===1 &&
    selection.every(id=>beliefs.some(b=>b.id===id) && !s.nations.some(other=>other.beliefs?.includes(id)));
  if(!active(s) || n.kind!=='major' || n.religion || !n.pantheon || !city || !allowed || majorIds(s).filter(o=>s.nations[o].religion).length>=religionLimit(s)) return false;
  const prophet=s.units.find(u=>u.owner===o && u.type==='prophet' && u.moves>0 && (s.tiles[u.tile].territory===city.id && s.tiles[u.tile].district==='holy' || u.tile===city.tile));
  if(!prophet) return false;
  s.units=s.units.filter(u=>u.id!==prophet.id);n.prophetRecruited=true;n.beliefs=[...selection];
  n.religion = n.name !== civilizations.find(c=>c.id===n.civ)?.name
    ? `${n.name}信仰` : ({china:'日月之道',rome:'永恒之火',egypt:'尼罗河信仰'} as Record<string,string>)[n.civ] ?? `${n.name}信仰`;
  for(const own of ownCities(s,o).filter(c=>c.id===city.id || c.buildings.includes('holy'))) {
    own.pressure[o]=Math.max(100,own.pressure.reduce((a,b)=>a+b,0)*2);own.religion=o;
  }
  boost(s, o, "theology");
  if (!o) event(s, `${n.religion}创立`);
  return true;
}
export function spread(s: State, u: Unit, to: number) {
  const c = s.cities.find((c) => c.id === to);
  if (
    !active(s) ||
    u.type !== "missionary" ||
    !u.moves ||
    !u.charges ||
    !s.nations[u.owner].religion ||
    !c ||
    distance(s.tiles[u.tile], s.tiles[c.tile]) > 1
  )
    return false;
  for (const i of majorIds(s)) if (i !== u.owner) c.pressure[i] *= 0.65;
  c.pressure[u.owner] += 70;
  updateReligion(c);
  u.charges--;
  u.moves = 0;
  u.acted = true;
  if (!u.charges) s.units = s.units.filter((v) => v.id !== u.id);
  return true;
}
function updateReligion(c: City) {
  const total = c.pressure.reduce((a, b) => a + b, 0),
    max = Math.max(...c.pressure);
  c.religion = total > 30 && max >= total * 0.5 ? c.pressure.indexOf(max) : -1;
}
export function recruitScientist(s:State,owner=0) {
  const n=s.nations[owner],person=currentScientist(s),price=scientistCost(s);
  if(!active(s) || !n || n.kind!=='major' || !person || n.great.science<price) return false;
  const city=palaceCity(s,owner)??ownCities(s,owner)[0];
  if(!city) return false;
  const at=spawnTile(s,city,info('scientist'));
  if(at===undefined) return false;
  const u=spawn(s,owner,'scientist',at);u.person=person.id;u.charges=1;
  n.great.science-=price;n.greatPeopleEarned=(n.greatPeopleEarned??0)+1;
  (s.scientistRecruits??=[]).push({person:person.id,owner});
  boost(s,owner,'education');checkBoosts(s,owner);
  event(s,`${n.name}招募了${person.name}`,'research');
  return true;
}
export function scientistReason(s:State,u:Unit) {
  const p=scientistById(u.person),t=s.tiles[u.tile];
  if(!active(s)) return '对局已结束';
  if(!s.units.includes(u) || u.type!=='scientist' || !p || u.charges!==1) return '不是可用的科学家';
  if(!u.moves) return '没有剩余移动力';
  if(t.terrain==='water' || t.terrain==='mountain') return '需要陆地';
  if(p.site==='land') return '';
  if(t.owner!==u.owner || t.district!==p.site || t.pillaged || !s.cities.some(c=>c.id===t.territory && c.owner===u.owner && c.buildings.includes(p.site))) return `前往己方未被劫掠的${p.site==='holy'?'圣地':'学院'}`;
  return '';
}
function randomResearchBoosts(s:State,owner:number,count:number,eras:number[],civic=false) {
  const n=s.nations[owner],list=(civic?civics:techs).filter(d=>d.boost && eras.includes(d.era??0) && !n.boosts.includes(d.id) && !(civic?n.civic:n.tech).includes(d.id));
  for(let k=0;k<count && list.length;k++) {
    const i=Math.floor(random(s)*list.length),[d]=list.splice(i,1);boost(s,owner,d.id);
  }
}
function scientistFreeBuilding(c:City,id:string) {
  if(!c.buildings.includes(id)) c.buildings.push(id);
  // A free building must not leave an already-completed production item queued.
  c.queue=c.queue.filter(j=>j.item!==id);
  delete c.invested[`${id}:-1`];delete c.productionCosts?.[`${id}:-1`];
}
export function activateScientist(s:State,u:Unit) {
  if(scientistReason(s,u)) return false;
  const p=scientistById(u.person)!,n=s.nations[u.owner],c=s.cities.find(c=>c.id===s.tiles[u.tile].territory);
  switch(p.id) {
    case 'euclid':boost(s,u.owner,'mathematics');randomResearchBoosts(s,u.owner,1,[2]);break;
    case 'aryabhata':randomResearchBoosts(s,u.owner,3,[1,2]);break;
    case 'hypatia':scientistFreeBuilding(c!,'library');break;
    case 'hildegard_of_bingen':c!.hildegard=true;n.faith+=100*speedMultiplier(s);break;
    case 'omar_khayyam':randomResearchBoosts(s,u.owner,2,[2,3]);randomResearchBoosts(s,u.owner,1,[2,3],true);break;
    case 'abu_al_qasim_al_zahrawi':randomResearchBoosts(s,u.owner,1,[2,3]);break;
    case 'galileo_galilei':advance(s,u.owner,false,250*speedMultiplier(s)*neighbors(s,u.tile).filter(i=>s.tiles[i].terrain==='mountain').length);break;
    case 'isaac_newton':scientistFreeBuilding(c!,'library');scientistFreeBuilding(c!,'university');break;
    case 'emilie_du_chatelet':randomResearchBoosts(s,u.owner,3,[3,4]);break;
  }
  (n.scientistEffects??=[]).push(p.id);
  s.units=s.units.filter(v=>v.id!==u.id);
  checkBoosts(s,u.owner);event(s,`${p.name}已使用能力`,'research');
  return true;
}
export function recruitArtist(s: State) {
  const n = s.nations[0];
  if (!active(s) || n.great.culture < 80 || !ownCities(s).length) return false;
  n.great.culture -= 80;
  n.greatPeopleEarned = (n.greatPeopleEarned ?? 0) + 1;
  boost(s,0,'humanism');
  n.tourism += 80;
  advance(s, 0, true, 60);
  event(s, "大艺术家带来 80 旅游和 60 文化", "research");
  checkBoosts(s,0);
  return true;
}
export function scoreBreakdown(s: State, o: number) {
  const n = s.nations[o], cities = ownCities(s,o);
  return {
    civics: n.civic.length * 3,
    empire: cities.reduce((v,c) => v + 5 + c.pop + 2 /* city-center district */ + Number(palaceCity(s,o)?.id===c.id) + c.buildings.reduce((b,id) => b + (info(id).kind==='district' ? 2 : info(id).kind==='building' ? 1 : 0),0),0),
    greatPeople: (n.greatPeopleEarned ?? 0) * 5,
    religion: n.religion ? 10 + s.cities.filter(c => c.owner!==o && c.religion===o).length * 2 : 0,
    technologies: n.tech.length * 2,
    wonders: cities.reduce((v,c) => v + c.buildings.filter(id=>info(id).kind==='wonder').length * 15,0),
    era: n.eraScore ?? 0,
  };
}
export function score(s: State, o: number) {
  return Object.values(scoreBreakdown(s,o)).reduce((v,x)=>v+x,0);
}
export function scoreRanking(s: State) {
  const tie = (o: number) => {
    const n=s.nations[o], cs=ownCities(s,o), breakdown=scoreBreakdown(s,o);
    return [score(s,o), n.civic.length, cs.length,
      cs.reduce((v,c)=>v+1+c.buildings.filter(id=>info(id).kind==='district').length,0),
      cs.reduce((v,c)=>v+c.pop,0), n.greatPeopleEarned??0, breakdown.religion,
      n.tech.length, breakdown.wonders];
  };
  return majorIds(s).sort((a,b) => {
    const av=tie(a),bv=tie(b);
    for (let i=0;i<av.length;i++) if (av[i]!==bv[i]) return bv[i]-av[i];
    return a-b;
  });
}
export function checkVictory(s: State) {
  if (s.winner) return;
  const capitals = s.cities.filter((c) => c.capital >= 0);
  for (const o of majorIds(s)) {
    const n = s.nations[o],
      cities = ownCities(s, o);
    let type: "science" | "culture" | "domination" | "religion" | null = null;
    if (n.space.launched && n.space.distance >= 50) type = "science";
    else if (foreignTourists(s,o) >= cultureTarget(s,o)) type = "culture";
    else if (capitals.length === majorIds(s).length && capitals.every((c) => c.owner === o))
      type = "domination";
    else if (
      n.religion &&
      majorIds(s).every((owner) => {
        const cs = ownCities(s, owner);
        return (
          !cs.length ||
          cs.filter((c) => c.religion === o).length > cs.length / 2
        );
      })
    )
      type = "religion";
    if (type) {
      s.winner = { owner: o, type };
      event(s, `${n.name}达成胜利`);
      return;
    }
  }
  if (
    !ownCities(s).length &&
    !s.units.some((u) => u.owner === 0 && u.type === "settler")
  )
    s.winner = { owner: 0, type: "defeat" };
  if (s.turn >= turnLimit(s) && !s.winner) {
    s.winner = { owner: scoreRanking(s)[0], type: "score" };
  }
}
export function pending(s: State) {
  return {
    cities: ownCities(s).filter((c) => !c.queue.length),
    units: s.units.filter((u) => u.owner === 0 && u.moves > 0 && !u.fortified),
  };
}

export function nextTurn(s: State) {
  if (!active(s)) return;
  // Player commands happen before this. AI gets the same movement/production rules.
  for (const o of civilizedIds(s).filter(o => o !== 0)) computerTurn(s, o);
  barbarians(s);
  for (const o of civilizedIds(s)) {
    const n = s.nations[o],
      t = totals(s, o);
    n.gold = Math.max(0, n.gold + t.gold);
    n.faith += t.faith;
    n.tourism += t.tourism;
    n.totalCulture += t.culture;
    deliverPantheonGift(s,o);
    if (n.kind==='major') {
      const rate=influenceRate(n);
      n.influence=(n.influence??0)+rate.perTurn;
      const threshold=Math.ceil(rate.threshold*speedMultiplier(s));
      while(n.influence>=threshold) {n.influence-=threshold;n.envoys+=rate.reward;}
    }
    if (n.space.launched) n.space.distance += n.space.speed;
    if (s.nations[o].kind === 'major') for (const target of majorIds(s)) {
      if (target===o || !ownCities(s,target).length || !n.met.includes(target)) continue;
      const trade = s.routes.some(r=>r.owner===o && s.cities.find(c=>c.id===r.to)?.owner===target);
      n.tourismAgainst[target] += t.tourism * (1 + (trade ? 0.25 : 0) + (trade && hasPolicy(n,'online') ? 0.5 : 0));
    }
    for (const tile of s.tiles.filter(
      (t) => t.owner === o && t.improvement && !t.pillaged,
    )) {
      const res = resources[tile.resource];
      if (
        res?.type === "strategic" &&
        tile.improvement === res.improvement &&
        resourceVisible(n, tile)
      )
        n.strategic[tile.resource] = Math.min(
          100,
          (n.strategic[tile.resource] ?? 0) + 2 + (n.government==='corporate'?1:0),
        );
    }
    for (const c of ownCities(s, o)) {
      const y = yields(s, c);
      c.food += y.food < c.pop * 2 ? y.food - c.pop * 2 : y.growing;
      const needed = 12 + c.pop * 6;
      if (c.food >= needed) {
        c.food -= needed;
        c.pop++;
        if (!o) event(s, `${c.name}人口增长至 ${c.pop}`, "city");
      } else if (c.food < 0 && c.pop > 1) {
        c.pop--;
        c.food = 0;
        if (!o) event(s, `${c.name}粮食不足，人口减少`, "city");
      } else c.food = Math.max(0, c.food);
      const besieged = s.units.some(
        (u) =>
          atWar(s, o, u.owner) &&
          info(u.type).strength &&
          distance(s.tiles[u.tile], s.tiles[c.tile]) === 1,
      );
      if (!besieged) {
        c.hp = Math.min(200, c.hp + 10);
        if (c.buildings.includes("walls")) c.walls = Math.min(100, c.walls + 5);
      }
      if (c.queue.length) {
        const j = c.queue[0],
          d = info(j.item),
          reason = buildReason(s, c, j.item, true);
        if (reason === "已被其他城市建成" || reason === "已建成") {
          n.gold += (c.invested[jobKey(j)] ?? 0) * 0.5;
          delete c.invested[jobKey(j)];
          c.queue.shift();
          if (!o) event(s, `${d.name}已被抢先建成，部分投入转为金币`);
        } else if (!reason) {
          const key = jobKey(j);
          c.invested[key] =
            (c.invested[key] ?? 0) + productionRate(s, c, j.item);
          if (c.invested[key] >= jobCost(s, c, j) && complete(s, c, j)) {
            delete c.invested[key];
            delete c.productionCosts?.[key];
            c.queue.shift();
          }
        }
      }
      c.border += y.culture + 1;
      const tiles = s.tiles.filter((t) => t.territory === c.id).length;
      if (c.border >= 15 + tiles * 2) {
        const candidates = s.tiles
          .map((t, i) => ({ t, i }))
          .filter(
            ({ t, i }) =>
              t.owner < 0 &&
              distance(t, s.tiles[c.tile]) <= 3 &&
              neighbors(s, i).some((k) => s.tiles[k].territory === c.id),
          )
          .sort(
            (a, b) =>
              distance(a.t, s.tiles[c.tile]) - distance(b.t, s.tiles[c.tile]) ||
              tileYield(s, b.t, o).food - tileYield(s, a.t, o).food,
          );
        if (candidates.length) {
          claim(s, c, candidates[0].i);
          c.border -= 15 + tiles * 2;
        }
      }
      const oracle = c.buildings.includes("oracle") ? 2 : 1,
        gov = n.government === "republic" ? 1.15 : 1;
      n.great.science += scientistPoints(s,c);
      n.great.culture +=
        (c.buildings.includes("theater") ? 1 : 0) * oracle * gov;
      if (!n.religion && !n.prophetRecruited) n.great.prophet +=
        (c.buildings.includes("holy") ? 1 : 0) +
        (c.buildings.includes("shrine") ? 1 : 0);
      if (!n.religion && !n.prophetRecruited) n.great.prophet += n.government==='republic' ? ((c.buildings.includes('holy')?1:0)+(c.buildings.includes('shrine')?1:0))*0.15 : 0;
    }
    if (hasPolicy(n, "revelation") && !n.religion && !n.prophetRecruited) n.great.prophet += 2;
    if (hasPolicy(n,'inspiration')) n.great.science+=2*(n.government==='republic'?1.15:1);
    // Separate Great Writers are not implemented; do not substitute generic culture points.
    advance(s, o, false, t.science);
    advance(s, o, true, t.culture);
    checkBoosts(s, o);
  }
  for (const route of [...s.routes]) {
    const source = s.cities.find((c) => c.id === route.from),
      dest = s.cities.find((c) => c.id === route.to);
    route.remaining--;
    if (
      !source ||
      !dest ||
      source.owner !== route.owner ||
      atWar(s, source.owner, dest.owner) ||
      route.remaining <= 0
    ) {
      s.routes = s.routes.filter((r) => r.id !== route.id);
      if (source?.owner === route.owner) {
        const at = spawnTile(s, source, info("trader"));
        if (at !== undefined) spawn(s, route.owner, "trader", at);
      }
      if (!route.owner) event(s, "贸易路线结束，商人返回");
    }
  }
  const pressures = s.cities.map((c) => ({
    id: c.id,
    religion: c.religion,
    tile: c.tile,
  }));
  for (const c of s.cities) {
    for (const source of pressures)
      if (
        source.id !== c.id &&
        source.religion >= 0 &&
        distance(s.tiles[c.tile], s.tiles[source.tile]) <= 5
      )
        c.pressure[source.religion] += 2;
    updateReligion(c);
  }
  s.turn++;
  for (const r of s.relations) {
    if (r.status === "friend" && s.turn >= r.until) {
      r.status = "peace";
      r.opinion = Math.max(r.opinion, 10);
    }
    if (r.status === "peace" && r.delegation && s.turn % 10 === 0)
      r.opinion = Math.min(30, r.opinion + 1);
  }
  for (const u of s.units) {
    if (!u.acted) {
      const medic=s.units.some(v=>v.owner===u.owner && v.type==='scientist' && v.person==='abu_al_qasim_al_zahrawi' && distance(s.tiles[v.tile],s.tiles[u.tile])<=1);
      const retired=info(u.type).domain!=='sea' && s.nations[u.owner].scientistEffects?.includes('abu_al_qasim_al_zahrawi');
      u.hp = Math.min(100, u.hp + (s.tiles[u.tile].owner === u.owner ? 15 : 8) + (medic?20:0) + (retired?5:0));
    }
    u.moves = (info(u.type).moves ?? 2) + (hasPolicy(s.nations[u.owner],'logistics') && s.tiles[u.tile].owner===u.owner ? 1 : 0);
    u.acted = false;
    if (u.fortified) u.moves = 0;
  }
  s.cities.forEach((c) => (c.attacked = false));
  if (s.turn % 5 === 0)
    s.history.push({ turn: s.turn, scores: majorIds(s).map((o) => score(s, o)) });
  s.history = s.history.slice(-60);
  reveal(s);
  checkVictory(s);
}
function checkBoosts(s: State, owner: number) {
  for (const id of satisfiedBoosts(s, owner)) boost(s, owner, id);
}
function aiResearch(s: State, owner: number, civic: boolean) {
  const n = s.nations[owner], strategy = aiStrategy(n, owner), list = civic ? civics : techs,
    done = civic ? n.civic : n.tech;
  const goals = civic
    ? strategy === 'culture' ? ['drama','philosophy','humanism','culturalheritage','socialmedia']
      : strategy === 'military' ? ['craft','military','philosophy','mercenaries','nationalism','totalitarianism']
      : ['empire','philosophy','feudal','exploration','democracy']
    : strategy === 'military' ? ['archery','ironworking','machinery','gunpowder','ballistics','combustion']
      : strategy === 'culture' ? ['writing','construction','printing','flight','computers']
      : strategy === 'expansion' ? ['pottery','mining','writing','currency','apprentice','education','industry','rocketry']
      : ['writing','education','apprentice','chemistry','rocketry','satellites','nanotechnology'];
  const pathToGoal = new Set<string>();
  function visit(id: string) {
    if (done.includes(id) || pathToGoal.has(id)) return;
    pathToGoal.add(id);
    list.find(r => r.id === id)?.requires.forEach(visit);
  }
  const goal = goals.find(id => !done.includes(id));
  if (goal) visit(goal);
  return list.filter(d => researchAvailable(n, d.id, civic)).map(d => ({id:d.id,
    value: (pathToGoal.has(d.id) ? 60 : 0) + (n.boosts.includes(d.id) ? 12 : 0)
      + 15 * (n.researchProgress[d.id] ?? 0) / researchCost(s,n,d)
      - researchCost(s,n,d) * 0.015 + random(s) * 3,
  })).sort((a,b) => b.value - a.value)[0]?.id ?? '';
}
function armyPower(s: State, owner: number) {
  return s.units.filter(u => u.owner === owner).reduce((v,u) => v + Math.max(info(u.type).strength ?? 0, info(u.type).rangedStrength ?? 0) * u.hp / 100, 0);
}
function chooseBuild(s: State, c: City) {
  const o = c.owner,
    n = s.nations[o],
    cs = ownCities(s, o),
    us = s.units.filter((u) => u.owner === o),
    war = s.relations.some(
      (r) => (r.a === o || r.b === o) && r.status === "war",
    );
  const strategy = aiStrategy(n,o);
  let choices = items.filter((d) => !buildReason(s, c, d.id) && !d.faithBuy);
  if (n.kind === "state") choices = choices.filter((d) => d.id !== "settler");
  const value = (d: Item) => {
    let v = 5 + random(s) * 3;
    if (strategy === 'science' && ['campus','library','university','lab','spaceport'].includes(d.id)) v += 24;
    if (strategy === 'culture' && ['theater','amphitheater','museum','monument'].includes(d.id)) v += 24;
    if (strategy === 'expansion' && ['builder','granary','commercial','market'].includes(d.id)) v += 14;
    if (strategy === 'military' && ['encampment','walls'].includes(d.id)) v += 18;
    if (d.id === 'scout') v += s.turn < 60 && !us.some(u => u.type === 'scout') && n.kind === 'major' ? 34 : -60;
    if (d.id === "granary") v += c.pop >= yields(s, c).housing - 1 ? 40 : 10;
    if (d.id === "monument") v += 18;
    if (d.id === "campus") v += 25;
    if (d.id === "library" || d.id === "university" || d.id === "lab") v += 24;
    if (d.id === "holy") v += n.civ === "egypt" ? 25 : 10;
    if (d.id === "shrine") v += 15;
    if (d.id === "industrial" || d.id === "workshop" || d.id === "factory")
      v += 20;
    if (d.id === "theater" || d.id === "amphitheater" || d.id === "museum")
      v += n.civ === "rome" ? 20 : 10;
    if (d.id === "commercial" || d.id === "market") v += 15;
    if (d.id === "walls") v += war ? 35 : 12;
    if (d.id === "settler")
      v +=
        cs.length < (strategy === 'expansion' ? 5 : 3) && !us.some((u) => u.type === "settler") && !cs.some(city => city.queue.some(j => j.item === 'settler')) && s.turn > 12
          ? 60
          : -60;
    if (d.id === "builder")
      v +=
        us.filter((u) => u.type === "builder").length < cs.length &&
        s.tiles.filter(
          (t) =>
            t.territory === c.id &&
            !t.improvement &&
            !t.district &&
            t.city < 0 &&
            t.terrain !== "mountain" &&
            t.terrain !== "water",
        ).length > 0
          ? 25
          : -30;
    if (d.id === "trader")
      v +=
        us.filter((u) => u.type === "trader").length +
          s.routes.filter((r) => r.owner === o).length <
        tradeCapacity(s, o)
          ? 18
          : -20;
    if (d.kind === "unit" && d.strength)
      v +=
        us.filter((u) => info(u.type).strength).length <
        cs.length * (war ? 3 : 1.5)
          ? (war ? 40 : 22) + Math.max(d.strength, d.rangedStrength ?? 0) * 0.3 + (strategy === 'military' ? 18 : 0)
          : -35;
    if (d.kind === "project" && !d.repeat) v += 70;
    if (d.repeat) v -= 5;
    if (d.kind === "wonder") v += n.civ === "egypt" ? 15 : 2;
    if (d.amenities) v += yields(s, c).happy < 0 ? 40 : 0;
    return v;
  };
  choices = choices
    .map((d) => ({ d, v: value(d) }))
    .sort((a, b) => b.v - a.v)
    .map((x) => x.d);
  for (const d of choices) {
    if (["district", "wonder"].includes(d.kind)) {
      const tiles = s.tiles
        .map((t, i) => ({ t, i }))
        .filter(({ i }) => !placementReason(s, c, d.id, i))
        .sort((a, b) => adjacency(s, d.id, b.i) - adjacency(s, d.id, a.i));
      if (tiles.length && enqueue(s, c, d.id, tiles[0].i)) return;
    } else if (enqueue(s, c, d.id)) return;
  }
}
export function computerTurn(s: State, o: number) {
  if (!active(s) || !s.nations[o] || s.nations[o].kind === 'barbarian') return;
  const n = s.nations[o],
    cs = ownCities(s, o);
  const visible = visibleTiles(s,o), strategy = aiStrategy(n,o);
  // Newly created settlers can participate in headless AI-vs-AI matches too.
  if (!cs.length) {
    const settler = s.units.find(u => u.owner === o && u.type === 'settler');
    if (settler && canFound(s,settler)) found(s,settler);
    return;
  }
  if (n.kind === "major") {
    const gov = [...governments]
      .reverse()
      .find((g) => n.civic.includes(g.unlock));
    if (gov) {
      const used = new Set<string>();
      const selected = gov.slots.map((slot) => {
        const p = [...policies]
          .reverse()
          .find(
            (p) =>
              policyAvailable({...n,government:gov.id},p[0]) &&
              (slot === "wild" || p[3] === slot) &&
              !used.has(p[0]),
          );
        if (p) used.add(p[0]);
        return p?.[0] ?? null;
      });
      if (n.government !== gov.id || JSON.stringify(n.policies) !== JSON.stringify(selected)) configureGovernment(s,gov.id,selected,o);
    }
    for (const cstate of s.cityStates)
      if (n.envoys > 0 && n.met.includes(cstate.owner) && ownCities(s,cstate.owner).length) {
        sendEnvoy(s,cstate.owner,o);
      }
    if (!n.pantheon && n.faith>=25) {
      const free=pantheons.find(p=>!s.nations.some(other=>other.pantheon===p.id));
      if(free) pantheon(s,free.id,o);
    }
    if (!n.religion) {recruitProphet(s,o);foundReligion(s,o);}
    recruitScientist(s,o);
    // Evaluate known rivals, not just the human; treaties and friendship still apply.
    const power = armyPower(s,o);
    const rivals = majorIds(s).filter(other => other !== o && n.met.includes(other) && ownCities(s,other).length)
      .map(other => ({other, r:relation(s,o,other), power:armyPower(s,other)}))
      .sort((a,b) => a.power - b.power);
    for (const rival of rivals) {
      const r = rival.r;
      if (r.status === 'war' && rival.other !== 0 && s.turn-r.since >= 15 && power < rival.power * 0.55) {
        r.status='peace';r.until=s.turn+10;r.opinion=-5;
        event(s,`${n.name}与${s.nations[rival.other].name}停战`);
      }
    }
    const target = rivals.find(x => x.r.status === 'peace' && s.turn >= x.r.until && x.r.opinion < 10 && power > x.power * (strategy === 'military' ? 1.1 : 1.5));
    const chance = s.options.difficulty === 'relaxed' ? 0.08 : strategy === 'military' ? 0.65 : 0.3;
    if (target && s.turn > 35 && s.turn % 15 === 0 && !rivals.some(x => x.r.status === 'war') && random(s) < chance) {
      declareWar(s,o,target.other);
      event(s,`${n.name}向${s.nations[target.other].name}宣战`,'combat');
    }
    if (n.religion && n.faith >= 150 && s.units.filter(u => u.owner===o && u.type==='missionary').length < 2) {
      const religiousCity = cs.find(c => !buildReason(s,c,'missionary'));
      if (religiousCity) purchase(s,religiousCity,'missionary');
    }
    const focus: City['focus'] = strategy === 'expansion' ? 'food' : strategy === 'military' || strategy === 'science' ? 'production' : 'balanced';
    for (const c of cs) c.focus=focus;
    // Preserve partially researched projects instead of changing goals every turn.
    if (!n.research || !(n.researchProgress[n.research] > 0)) n.research=aiResearch(s,o,false);
    if (!n.culture || !(n.researchProgress[n.culture] > 0)) n.culture=aiResearch(s,o,true);
  }
  for (const c of cs) {
    if (c.queue.length < 1) chooseBuild(s, c);
    if (c.walls > 0 && !c.attacked) {
      const target = s.units.find(
        (u) =>
          atWar(s, o, u.owner) &&
          distance(s.tiles[u.tile], s.tiles[c.tile]) <= 2,
      );
      if (target) cityAttack(s, c, target.tile);
    }
  }
  for (const u of [...s.units.filter((u) => u.owner === o)]) {
    if (!s.units.some((v) => v.id === u.id)) continue;
    const threats = s.units.filter(enemy => atWar(s,o,enemy.owner) && visible.has(enemy.tile) && info(enemy.type).strength && distance(s.tiles[enemy.tile],s.tiles[u.tile]) <= 3);
    if (u.hp < 45) {
      if (threats.length) {
        const safe = [...reachable(s,u).keys()].map(tile => ({tile,value:Math.min(...threats.map(e => distance(s.tiles[tile],s.tiles[e.tile]))) * 10 + (s.tiles[tile].owner === o ? 5 : 0)})).sort((a,b) => b.value-a.value)[0];
        if (safe && safe.value > Math.min(...threats.map(e => distance(s.tiles[u.tile],s.tiles[e.tile]))) * 10) move(s,u,safe.tile);
      }
      u.fortified = false;
      continue;
    }
    if (u.xp >= 3 * (u.level + 1) && info(u.type).strength) {
      promote(s, u);
      continue;
    }
    if (u.type === "trader") {
      const dest = tradeTargets(s, u).sort(
        (a, b) =>
          tradeYield(
            s,
            s.cities.find((c) => c.tile === u.tile)!,
            b,
          ).gold -
          tradeYield(
            s,
            s.cities.find((c) => c.tile === u.tile)!,
            a,
          ).gold,
      )[0];
      if (dest) {
        establishTrade(s, u, dest.id);
        continue;
      }
      const c = cs.sort(
        (a, b) =>
          distance(s.tiles[a.tile], s.tiles[u.tile]) -
          distance(s.tiles[b.tile], s.tiles[u.tile]),
      )[0];
      aiMoveToward(s, u, c.tile);
      continue;
    }
    if (u.type === "settler") {
      if (canFound(s, u)) {
        found(s, u);
        continue;
      }
      const sites = s.tiles
        .map((t, i) => ({ t, i }))
        .filter(
          ({ t, i }) =>
            visible.has(i) && t.owner < 0 &&
            !["water", "mountain"].includes(t.terrain) &&
            s.cities.every((c) => distance(t, s.tiles[c.tile]) >= 4) &&
            passable(s, u, i),
        )
        .map(({ t, i }) => ({
          i,
          v:
            neighbors(s, i).reduce(
              (v, k) =>
                v +
                tileYield(s, s.tiles[k], o).food +
                tileYield(s, s.tiles[k], o).production,
              0,
            ) +
            (t.river ? 5 : 0) -
            distance(t, s.tiles[u.tile]),
        }))
        .sort((a, b) => b.v - a.v);
      if (sites.length) aiMoveToward(s, u, sites[0].i);
      else aiExplore(s,u);
      continue;
    }
    if (u.type === "builder") {
      const id = Object.keys(improvements).find(
        (id) => !improvementReason(s, u, id),
      );
      if (id) {
        improve(s, u, id);
        continue;
      }
      if (repair(s, u)) continue;
      const candidates = s.tiles
        .map((t, i) => ({ t, i }))
        .filter(
          ({ t, i }) =>
            t.owner === o &&
            !t.improvement &&
            !t.district &&
            t.city < 0 &&
            !["water", "mountain"].includes(t.terrain) &&
            passable(s, u, i),
        )
        .sort(
          (a, b) =>
            distance(a.t, s.tiles[u.tile]) - distance(b.t, s.tiles[u.tile]),
        );
      if (candidates.length) aiMoveToward(s, u, candidates[0].i);
      continue;
    }
    if (u.type === 'missionary') {
      const targets = s.cities.filter(c => visible.has(c.tile) && c.religion !== o && !atWar(s,o,c.owner));
      const close = targets.find(c => distance(s.tiles[c.tile],s.tiles[u.tile]) <= 1);
      if (close && spread(s,u,close.id)) continue;
      targets.sort((a,b) => distance(s.tiles[a.tile],s.tiles[u.tile])-distance(s.tiles[b.tile],s.tiles[u.tile]));
      if (targets.length) aiMoveToward(s,u,targets[0].tile);
      else aiExplore(s,u);
      continue;
    }
  if (info(u.type).strength) {
      const targets = s.tiles
        .map((_, i) => ({ i, p: visible.has(i) ? combatPreview(s, u, i) : null }))
        .filter((x) => x.p && (x.p.retaliation < u.hp - 8 || x.p.damage >= (x.p.enemy?.hp ?? 201)) && x.p.damage >= x.p.retaliation * 0.75)
        .sort(
          (a, b) =>
            b.p!.damage - b.p!.retaliation - (a.p!.damage - a.p!.retaliation),
        );
      if (targets.length) {
        attack(s, u, targets[0].i);
        continue;
      }
      const enemies = s.cities.filter((c) => visible.has(c.tile) && atWar(s, o, c.owner));
      if (enemies.length) {
        enemies.sort(
          (a, b) =>
            distance(s.tiles[a.tile], s.tiles[u.tile]) -
            distance(s.tiles[b.tile], s.tiles[u.tile]),
        );
        aiMoveToward(s, u, enemies[0].tile);
        continue;
      }
      if (upgradeTo(s, u) && upgrade(s, u)) continue;
    }
    if(u.type==='scientist') {
      const p=scientistById(u.person);
      if(p?.id!=='galileo_galilei' && activateScientist(s,u)) continue;
      const candidates=s.tiles.map((t,i)=>({t,i})).filter(({t,i})=>t.terrain!=='mountain' && t.terrain!=='water' && !t.pillaged &&
        (p?.site==='land' ? t.owner===o : t.owner===o && t.district===p?.site) && !s.units.some(v=>v.id!==u.id && v.tile===i));
      candidates.sort((a,b)=>p?.id==='galileo_galilei'
        ? neighbors(s,b.i).filter(i=>s.tiles[i].terrain==='mountain').length-neighbors(s,a.i).filter(i=>s.tiles[i].terrain==='mountain').length || distance(a.t,s.tiles[u.tile])-distance(b.t,s.tiles[u.tile])
        : distance(a.t,s.tiles[u.tile])-distance(b.t,s.tiles[u.tile]));
      for(const target of candidates) {
        const route=path(s,u,target.i,(s.width+s.height)*2,true);
        if(!route.length) continue;
        followPath(s,u,route);
        if(u.tile===target.i) activateScientist(s,u);
        break;
      }
      continue;
    }
    if (u.type==='prophet') {
      if(foundReligion(s,o)) continue;
      const holy=s.tiles.findIndex((t,i)=>t.owner===o && t.district==='holy' && !s.units.some(v=>v.id!==u.id && v.tile===i));
      if(holy>=0) {
        const route=path(s,u,holy,(s.width+s.height)*2,true);
        followPath(s,u,route);
        foundReligion(s,o);
      }
      continue;
    }
    if (n.kind === 'major') {aiExplore(s,u);continue;}
    const near = cs.reduce(
      (a, c) =>
        distance(s.tiles[c.tile], s.tiles[u.tile]) <
        distance(s.tiles[a.tile], s.tiles[u.tile])
          ? c
          : a,
      cs[0],
    );
    if (distance(s.tiles[u.tile], s.tiles[near.tile]) > 4)
      aiMoveToward(s, u, near.tile);
    else {
      const moves = [...reachable(s, u).keys()];
      if (moves.length) move(s, u, moves[Math.floor(random(s) * moves.length)]);
    }
  }
}
function aiExplore(s: State, u: Unit) {
  const visited = new Set(s.nations[u.owner].explored ?? []), targets = [...reachable(s,u).keys()], visible = visibleTiles(s,u.owner);
  const enemies = s.units.filter(e=>atWar(s,u.owner,e.owner) && visible.has(e.tile) && info(e.type).strength);
  const rated = targets.map(tile => ({tile, value:
    neighbors(s,tile).filter(i => !visited.has(i)).length * 5
    + (s.tiles[tile].village ? 12 : 0) + random(s) * 3
    - enemies.filter(e => distance(s.tiles[tile],s.tiles[e.tile]) <= 2).length * 15,
  })).sort((a,b) => b.value-a.value);
  if (rated.length) move(s,u,rated[0].tile);
}
function followPath(s: State, u: Unit, route: number[]) {
  let spent = 0, destination = u.tile;
  for (let k = 1; k < route.length; k++) {
    spent += movementCost(s, u, route[k - 1], route[k]);
    if (spent > u.moves) break;
    destination = route[k];
    if (zone(s, u, destination) && u.type !== 'scout') break;
  }
  return destination !== u.tile && move(s, u, destination);
}
function aiMoveToward(s: State, u: Unit, target: number) {
  if (u.tile === target) return;
  // Route around obstacles instead of oscillating against a mountain ridge.
  const goals = [target, ...neighbors(s, target)].filter((i) =>
    passable(s, u, i),
  );
  goals.sort(
    (a, b) =>
      distance(s.tiles[a], s.tiles[u.tile]) -
      distance(s.tiles[b], s.tiles[u.tile]),
  );
  for (const goal of goals.slice(0, 3)) {
    const route = path(s, u, goal, (s.width + s.height) * 2, true);
    if (route.length < 2) continue;
    if (followPath(s, u, route)) return;
  }
  const candidates = [...reachable(s, u).keys()].sort(
    (a, b) =>
      distance(s.tiles[a], s.tiles[target]) -
      distance(s.tiles[b], s.tiles[target]),
  );
  if (candidates.length) move(s, u, candidates[0]);
}
function barbarians(s: State) {
  for (const u of [...s.units.filter((u) => u.owner === barbarianOwner(s))]) {
    const targets = s.tiles
      .map((_, i) => ({ i, p: combatPreview(s, u, i) }))
      .filter((x) => x.p && s.nations[x.p.owner].kind === 'major')
      .sort((a, b) => b.p!.damage - a.p!.damage);
    if (targets.length) {
      attack(s, u, targets[0].i);
      continue;
    }
    const city = s.cities
      .filter((c) => s.nations[c.owner].kind === 'major')
      .sort(
        (a, b) =>
          distance(s.tiles[a.tile], s.tiles[u.tile]) -
          distance(s.tiles[b.tile], s.tiles[u.tile]),
      )[0];
    if (city && distance(s.tiles[city.tile], s.tiles[u.tile]) < 6)
      aiMoveToward(s, u, city.tile);
    else {
      const moves = [...reachable(s, u).keys()];
      if (moves.length) move(s, u, moves[Math.floor(random(s) * moves.length)]);
    }
  }
  if (
    s.turn %
      (s.options.difficulty === "hard"
        ? 8
        : s.options.difficulty === "relaxed"
          ? 20
          : 14) ===
      0 &&
    s.units.filter((u) => u.owner === barbarianOwner(s)).length < 8
  ) {
    for (let i = 0; i < s.tiles.length; i++)
      if (s.tiles[i].camp) {
        const at = [i, ...neighbors(s, i)].find(
          (k) =>
            !s.units.some((u) => u.tile === k) &&
            !["water", "mountain"].includes(s.tiles[k].terrain),
        );
        if (at !== undefined)
          spawn(s, barbarianOwner(s), s.turn > 70 ? "archer" : "warrior", at);
      }
  }
}
