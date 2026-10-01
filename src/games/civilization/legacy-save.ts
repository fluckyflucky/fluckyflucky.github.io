import type { Tile, Unit } from './model';

// v1 is read-only: keep its save shape, not a second playable game engine.
export interface LegacySave {
  version: 1;
  seed: number;
  turn: number;
  next: number;
  tiles: Pick<Tile, 'q'|'r'|'terrain'|'resource'|'river'|'village'|'owner'|'city'|'district'|'improvement'|'seen'>[];
  units: Pick<Unit, 'id'|'owner'|'type'|'tile'|'hp'|'moves'|'charges'|'xp'>[];
  cities: {
    id: number; owner: number; name: string; tile: number; capital: boolean;
    pop: number; food: number; hp: number; buildings: string[];
    production: string; progress: number; target: number; religion: number;
  }[];
  nations: {
    name: string; gold: number; faith: number; tech: string[]; civic: string[];
    research: string; culture: string; science: number; cult: number;
    boosts: string[]; policies: string[]; government: string; war: boolean;
    trade: number; religion: boolean; tourism: number;
  }[];
  log: string[];
  winner: string;
  envoys: number;
  great: number;
}

const v1Units = new Set(['settler','scout','warrior','builder','archer','sword','crossbow','missionary']);
export function validLegacy(value: unknown): value is LegacySave {
  try {
    const s=value as LegacySave;
    return s.version===1 && Number.isInteger(s.turn) && s.turn>0 &&
      s.tiles.length===18*12 && s.nations.length===3 &&
      s.tiles.every(t=>Number.isInteger(t.q) && Number.isInteger(t.r) &&
        ['grass','plain','forest','hill','mountain','water','desert'].includes(t.terrain)) &&
      s.units.every(u=>v1Units.has(u.type) && Number.isInteger(u.tile) &&
        u.tile>=0 && u.tile<18*12 && u.owner>=0 && u.owner<3 && Number.isFinite(u.hp)) &&
      s.cities.every(c=>c.tile>=0 && c.tile<18*12 && Array.isArray(c.buildings)) &&
      Array.isArray(s.log) && s.nations.every(n=>Array.isArray(n.tech) && Array.isArray(n.civic) && Array.isArray(n.policies));
  } catch {
    return false;
  }
}
