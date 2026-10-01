import type { State, City } from './model';

const source = (id:string) => `https://www.civilopedia.net/en-US/gathering-storm/greatpeople/great_person_individual_${id}/`;
export const scientists = ([
  {id:'aryabhata',name:'阿耶波多',era:1,site:'campus',description:'触发古典或中世纪的 3 项随机科技尤里卡。'},
  {id:'euclid',name:'欧几里得',era:1,site:'campus',description:'触发数学，以及中世纪的 1 项随机科技尤里卡。'},
  {id:'hypatia',name:'希帕蒂娅',era:1,site:'campus',description:'在此学院建造图书馆；本国所有图书馆 +1 科技。'},
  {id:'hildegard_of_bingen',name:'宾根的希尔德加德',era:2,site:'holy',description:'获得 100 信仰；此圣地的信仰相邻加成同时提供科技。'},
  {id:'omar_khayyam',name:'奥马尔·海亚姆',era:2,site:'campus',description:'触发中世纪或文艺复兴的 2 项随机科技尤里卡、1 项随机市政鼓舞。'},
  {id:'abu_al_qasim_al_zahrawi',name:'艾布·卡西姆·扎哈拉维',era:2,site:'campus',description:'相邻己方单位治疗 +20。退隐：触发中世纪或文艺复兴的 1 项随机科技尤里卡；本国陆地单位治疗 +5。'},
  {id:'galileo_galilei',name:'伽利略·伽利雷',era:3,site:'land',description:'每块相邻山脉提供 250 科技（标准速度）。'},
  {id:'isaac_newton',name:'艾萨克·牛顿',era:3,site:'campus',description:'在此学院建造图书馆和大学；本国所有大学 +2 科技。'},
  {id:'emilie_du_chatelet',name:'埃米莉·夏特莱',era:3,site:'campus',description:'触发文艺复兴或工业时代的 3 项随机科技尤里卡。'},
] as const).map(p=>({...p,source:source(p.id)}));
export const scientistById = (id:string|undefined) => scientists.find(p=>p.id===id);

// Stable per-map shuffle, independent of combat RNG. Reads never mutate the save.
export function scientistOrder(s:State) {
  const hash=(id:string) => {
    let value=s.options.seed>>>0;
    for(const ch of id) value=Math.imul(value^ch.charCodeAt(0),16777619)>>>0;
    value=Math.imul(value^(value>>>16),2246822507)>>>0;
    return (value^(value>>>13))>>>0;
  };
  return scientists.slice().sort((a,b)=>a.era-b.era || hash(a.id)-hash(b.id) || a.id.localeCompare(b.id));
}
export const currentScientist = (s:State) => scientistOrder(s).find(p=>!s.scientistRecruits?.some(r=>r.person===p.id));
// Era base prices only. World-era surcharge/passing/patronage are not yet implemented.
export const scientistCost = (s:State) => {
  const p=currentScientist(s);
  return p ? Math.ceil(({1:60,2:120,3:240}[p.era])*(s.options.speed==='quick'?2/3:1)) : 0;
};
export function scientistBuildingBonus(s:State,owner:number,building:string) {
  const activated=s.nations[owner].scientistEffects??[];
  return building==='library' && activated.includes('hypatia') ? 1 : building==='university' && activated.includes('isaac_newton') ? 2 : 0;
}
export function scientistPoints(s:State,c:City) {
  const campus=s.tiles.find(t=>t.territory===c.id && t.district==='campus');
  if(!c.buildings.includes('campus') || campus?.pillaged) return 0;
  const base=1+['library','university','lab'].filter(id=>c.buildings.includes(id)).length+(c.buildings.includes('oracle')?2:0);
  return base*(s.nations[c.owner].government==='republic'?1.15:1);
}
