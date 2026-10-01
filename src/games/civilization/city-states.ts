import type { State, City, CityState, Nation } from './model';
import { emptyYield, itemMap } from './catalog';

// Gathering Storm with the July 2020 envoy-yield rebalance. No vanilla mixing.
export const cityStateSources = {
  envoys: 'https://www.civilopedia.net/en-US/gathering-storm/concepts/citystates_4/',
  rules: 'https://civilization.fandom.com/wiki/City-state_%28Civ6%29',
};
// Checked the Traits block of all 61 catalog civic pages on 2026-10-01.
// A civic without an Awards ... Envoy trait gives no free envoy.
export const civicEnvoyRewards: Record<string,number> = {
  civic_mysticism:1, civic_military_training:1, civic_theology:1,
  civic_mercenaries:1, civic_naval_tradition:1,
  civic_colonialism:2, civic_natural_history:2, civic_opera_ballet:2, civic_scorched_earth:2,
  civic_conservation:3, civic_cultural_heritage:3, civic_near_future_governance:3,
  civic_global_warming_mitigation:3,
};
export const civicEnvoySource=(id:string)=>`https://www.civilopedia.net/en-US/gathering-storm/civics/${id}/`;
export const cityStateTypes = { science:'科技', culture:'文化', trade:'商业', industrial:'工业', military:'军事', religious:'宗教' };
export const cityStateRoster: {name:string;type:CityState['type'];bonus:string}[] = [
  {name:'日内瓦',type:'science',bonus:'和平时期，所有城市科技 +15%'},
  {name:'库马西',type:'culture',bonus:'通往城邦的贸易：起点每个专业区域 +2 文化、+1 金币'},
  {name:'布鲁塞尔',type:'industrial',bonus:'建造奇观的生产力 +15%'},
  {name:'桑给巴尔',type:'trade',bonus:'肉桂和丁香各提供6宜居度，分配给最多6座城市'},
  {name:'喀布尔',type:'military',bonus:'主动攻击时获得双倍经验'},
  {name:'埃里温',type:'religious',bonus:'使徒自由选择晋升（使徒晋升尚未实现）'},
];
const war = (s:State,a:number,b:number) => a!==b && s.relations.some(r=>r.a===Math.min(a,b) && r.b===Math.max(a,b) && r.status==='war');
export function suzerain(s:State,cs:CityState): number | null {
  if (!s.cities.some(c=>c.owner===cs.owner)) return null;
  const max=Math.max(...cs.envoys);
  const candidates=cs.envoys.flatMap((count,owner)=>count===max && count>=3 && s.cities.some(c=>c.owner===owner) && !war(s,owner,cs.owner) ? [owner] : []);
  return candidates.length===1 ? candidates[0] : null;
}
export function hasSuzerainBonus(s:State,owner:number,name:string) {
  return s.cityStates.some(cs=>s.nations[cs.owner].name===name && suzerain(s,cs)===owner);
}
export function influenceRate(n:Nation) {
  const tier=n.government==='chief'?0:['autocracy','oligarchy','republic'].includes(n.government)?1:['monarchy','theocracy','merchant'].includes(n.government)?2:['fascism','communist','democracy'].includes(n.government)?3:4;
  return { perTurn:(1+tier*2)*(n.government==='monarchy'?1.5:1), threshold:tier<=1?100:50*(tier+1), reward:Math.max(1,tier) };
}
const buildings: Record<CityState['type'],string[][]> = {
  science:[['library'],['university'],['lab']],culture:[['amphitheater'],['museum','archaeologicalmuseum'],['broadcast']],
  religious:[['shrine'],['temple'],['cathedral','pagoda','mosque','meetinghouse','stupa','synagogue','wat','gurdwara','darmehr']],
  trade:[['market','lighthouse'],['bank','shipyard'],['stockexchange','seaport']],
  industrial:[['workshop'],['factory'],['coalplant','oilplant','nuclearplant']],military:[['barracks','stable'],['armory'],['militaryacademy']],
};
function usable(s:State,c:City,id:string) {
  if (!c.buildings.includes(id)) return false;
  const district=itemMap[id]?.needs;
  // Walk prerequisite buildings to the parent district (e.g. lab -> university).
  let parent=district;
  while(parent && itemMap[parent]?.kind==='building') parent=itemMap[parent].needs;
  return !parent || !s.tiles.some(t=>t.territory===c.id && t.district===parent && t.pillaged);
}
export function envoyBonus(s:State,c:City,kind:CityState['type']) {
  let total=0;
  for(const cs of s.cityStates) {
    const count=cs.envoys[c.owner]??0;
    const ally=suzerain(s,cs);
    if(cs.type!==kind || !count || war(s,c.owner,cs.owner) || ally!==null && war(s,c.owner,ally) || !s.cities.some(c=>c.owner===cs.owner)) continue;
    const capital=s.cities.find(city=>city.owner===c.owner && city.capital===c.owner) ?? s.cities.find(city=>city.owner===c.owner);
    const tiers=buildings[kind];
    if(count>=1) total+=Number(capital?.id===c.id)+Number(tiers[0].some(id=>usable(s,c,id)));
    if(count>=3) total+=2*(Number(tiers[1].some(id=>usable(s,c,id)))+Number(usable(s,c,'consulate')));
    if(count>=6) total+=3*(Number(tiers[2].some(id=>usable(s,c,id)))+Number(usable(s,c,'chancery')));
  }
  return total*(kind==='trade'?2:1);
}
export function cityStateYields(s:State,c:City) {
  const y=emptyYield();
  y.science=envoyBonus(s,c,'science');y.culture=envoyBonus(s,c,'culture');
  y.gold=envoyBonus(s,c,'trade');y.faith=envoyBonus(s,c,'religious');
  return y;
}
export function cityStateHelp(type:CityState['type']) {
  const tiers=buildings[type].map(group=>group.filter(id=>itemMap[id]).map(id=>itemMap[id].name).join(' / ') || '对应三级建筑');
  const factor=type==='trade'?2:1, unit=cityStateTypes[type];
  return `1使者：首都和${tiers[0]} +${factor}；3使者：${tiers[1]}、领事馆 +${2*factor}；6使者：${tiers[2]}、外交办 +${3*factor}。各档累加。` + (type==='military'?'仅训练单位时增加生产。':type==='industrial'?'仅建造建筑、区域、奇观时增加生产。':`增加${unit}产出。`);
}
