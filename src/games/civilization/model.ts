import type { PolicyType } from "./catalog";
export type Terrain =
  "grass" | "plain" | "forest" | "hill" | "mountain" | "water" | "desert";
export interface Tile {
  q: number;
  r: number;
  terrain: Terrain;
  resource: string;
  river: boolean;
  village: boolean;
  camp: boolean;
  owner: number;
  city: number;
  territory: number;
  district: string;
  improvement: string;
  road: boolean;
  pillaged: boolean;
  seen: boolean;
  baseTerrain?: 'grass' | 'plain' | 'desert' | 'tundra' | 'snow' | 'coast' | 'ocean' | 'lake' | 'mountain';
  feature?: '' | 'forest' | 'rainforest' | 'marsh' | 'floodplains' | 'reef' | 'geothermal' | 'oasis';
  hills?: boolean;
  naturalWonder?: boolean;
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
  level: number;
  fortified: boolean;
  acted: boolean;
}
export interface Job {
  item: string;
  tile: number;
}
export type Focus = "balanced" | "food" | "production" | "gold";
export interface City {
  id: number;
  owner: number;
  name: string;
  tile: number;
  capital: number;
  pop: number;
  food: number;
  hp: number;
  walls: number;
  buildings: string[];
  queue: Job[];
  invested: Record<string, number>;
  border: number;
  focus: Focus;
  religion: number;
  pressure: number[];
  attacked: boolean;
}
export interface Nation {
  name: string;
  civ: string;
  color: string;
  kind: "major" | "state" | "barbarian";
  gold: number;
  faith: number;
  tech: string[];
  civic: string[];
  research: string;
  culture: string;
  researchProgress: Record<string, number>;
  boosts: string[];
  policies: (string | null)[];
  government: string;
  policyFree: boolean;
  religion: string;
  pantheon: string;
  tourism: number;
  envoys: number;
  great: { science: number; culture: number; prophet: number };
  strategic: Record<string, number>;
  kills: number;
  promotions: number;
  met: number[];
  totalCulture: number;
  tourismAgainst: number[];
  space: { launched: boolean; distance: number; speed: number };
  barbarianKills: number;
}
export interface Relation {
  a: number;
  b: number;
  status: "peace" | "war" | "friend";
  since: number;
  until: number;
  opinion: number;
  delegation: boolean;
}
export interface Route {
  id: number;
  owner: number;
  from: number;
  to: number;
  path: number[];
  remaining: number;
}
export interface CityState {
  owner: number;
  type: "science" | "culture";
  envoys: number[];
}
export interface Options {
  civilization: string;
  size: "compact" | "standard";
  difficulty: "relaxed" | "standard" | "hard";
  speed: "quick" | "normal";
  seed: number;
  map: "continents" | "pangaea";
}
export interface GameEvent {
  turn: number;
  text: string;
  kind: "info" | "research" | "combat" | "city" | "wonder";
}
export interface Victory {
  owner: number;
  type: "science" | "culture" | "domination" | "religion" | "score" | "defeat";
}
export interface State {
  version: 3;
  seed: number;
  turn: number;
  width: number;
  height: number;
  options: Options;
  tiles: Tile[];
  units: Unit[];
  cities: City[];
  nations: Nation[];
  relations: Relation[];
  routes: Route[];
  cityStates: CityState[];
  next: number;
  log: GameEvent[];
  winner: Victory | null;
  continued: boolean;
  history: { turn: number; scores: number[] }[];
}
export const BARBARIAN = 5;
export type Slot = PolicyType;
