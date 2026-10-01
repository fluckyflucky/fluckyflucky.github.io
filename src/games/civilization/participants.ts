import type { State, Nation } from './model';

export const majorIds = (s: State) => s.nations.flatMap((n, owner) => n.kind === 'major' ? [owner] : []);
export const barbarianOwner = (s: State) => s.nations.findIndex(n => n.kind === 'barbarian');
export const civilizedIds = (s: State) => s.nations.flatMap((n, owner) => n.kind !== 'barbarian' ? [owner] : []);
export const aiStrategyNames = {expansion:'扩张', science:'科研', culture:'文化', military:'军事'};
export function aiStrategy(n: Nation, owner: number) {
  return n.aiStrategy ?? (['science','military','culture','expansion'] as const)[owner % 4];
}
