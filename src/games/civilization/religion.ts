import type { State, City } from './model';
import { itemMap, emptyYield } from './catalog';
const source=(id:string)=>`https://www.civilopedia.net/en-US/gathering-storm/religions/belief_${id}/`;
export const pantheons = [
  {id:'fertility',name:'生育仪式',description:'首都获得建造者；城市增长 +10%',source:source('fertility_rites')},
  {id:'crafts',name:'工匠之神',description:'已改良且已发现的战略资源 +1 生产、+1 信仰',source:source('god_of_craftsmen')},
  {id:'sea',name:'海洋之神',description:'渔船 +1 生产',source:source('god_of_the_sea')},
  {id:'sky',name:'天空之神',description:'牧场 +1 文化',source:source('god_of_the_open_sky')},
  {id:'festivals',name:'节庆女神',description:'种植园 +1 文化',source:source('goddess_of_festivals')},
  {id:'stone',name:'石圈',description:'采石场 +2 信仰',source:source('stone_circles')},
];
export const beliefs = [
  {id:'choral',type:'follower',name:'合唱圣歌',description:'祠堂、寺庙增加等同基础信仰产出的文化',source:source('choral_music')},
  {id:'feed',type:'follower',name:'哺育世界',description:'祠堂、寺庙各 +3 粮食、+2 住房',source:source('feed_the_world')},
  {id:'work',type:'follower',name:'职业道德',description:'圣地的信仰邻接也提供生产力',source:source('work_ethic')},
  {id:'zen',type:'follower',name:'禅修',description:'拥有至少两个专业区域的城市 +1 宜居度',source:source('zen_meditation')},
  {id:'divine',type:'follower',name:'神灵启示',description:'每座世界奇观 +4 信仰',source:source('divine_inspiration')},
  {id:'community',type:'follower',name:'宗教社区',description:'国际贸易起点的圣地及每个圣地建筑各 +2 金币',source:source('religious_community')},
  {id:'tithe',type:'founder',name:'什一税',description:'每座信奉本宗教的城市 +3 金币',source:source('tithe')},
  {id:'pilgrimage',type:'founder',name:'朝圣',description:'每座信奉本宗教的城市 +2 信仰',source:source('pilgrimage')},
  {id:'lay',type:'founder',name:'俗世教会',description:'信奉城市的圣地 +1 信仰，剧院广场 +1 文化',source:source('lay_ministry')},
  {id:'sacred',type:'founder',name:'圣地',description:'拥有奇观的信奉城市各 +2 科技、文化、金币、信仰',source:source('sacred_places')},
  {id:'dialogue',type:'founder',name:'跨文化对话',description:'每4名信徒 +1 科技',source:source('cross_cultural_dialogue')},
  {id:'church',type:'founder',name:'世界教会',description:'每4名信徒 +1 文化',source:source('world_church')},
] as const;
export function availableBeliefs(s:State,type:'follower'|'founder') {
  const taken=new Set(s.nations.flatMap(n=>n.beliefs??[]));
  return beliefs.filter(b=>b.type===type && !taken.has(b.id));
}
export function cityBelief(s:State,c:City,id:string) {
  return c.religion>=0 && !!s.nations[c.religion].beliefs?.includes(id);
}
export function activeReligiousBuildings(s:State,c:City) {
  if(s.tiles.some(t=>t.territory===c.id && t.district==='holy' && t.pillaged)) return [];
  return c.buildings.filter(id=>['shrine','temple'].includes(id));
}
// Current pressure-to-followers model remains simplified; not claimed as canonical.
export function followers(c:City,owner:number) {
  const total=c.pressure.reduce((sum,x)=>sum+x,0);
  return total ? Math.floor(c.pop*c.pressure[owner]/total) : 0;
}
export function founderYield(s:State,owner:number) {
  const y=emptyYield(),chosen=s.nations[owner].beliefs??[],cs=s.cities.filter(c=>c.religion===owner);
  if(chosen.includes('tithe')) y.gold+=cs.length*3;
  if(chosen.includes('pilgrimage')) y.faith+=cs.length*2;
  if(chosen.includes('lay')) for(const c of cs) {if(c.buildings.includes('holy'))y.faith++;if(c.buildings.includes('theater'))y.culture++;}
  if(chosen.includes('sacred')) {
    const count=cs.filter(c=>c.buildings.some(id=>itemMap[id].kind==='wonder')).length;
    for(const k of ['science','culture','gold','faith'] as const)y[k]+=count*2;
  }
  const count=s.cities.reduce((v,c)=>v+followers(c,owner),0);
  if(chosen.includes('dialogue')) y.science+=count/4;
  if(chosen.includes('church')) y.culture+=count/4;
  return y;
}
