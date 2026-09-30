import assert from 'node:assert/strict';
const base='https://www.civilopedia.net/zh-CN/gathering-storm/';
const ids={
  units:{slinger:'unit_slinger',settler:'unit_settler',scout:'unit_scout',warrior:'unit_warrior',builder:'unit_builder',trader:'unit_trader',archer:'unit_archer',sword:'unit_swordsman',horse:'unit_horseman',catapult:'unit_catapult',crossbow:'unit_crossbowman',musket:'unit_musketman',artillery:'unit_artillery',tank:'unit_tank',galley:'unit_galley',ironclad:'unit_ironclad',missionary:'unit_missionary'},
  buildings:{monument:'building_monument',granary:'building_granary',walls:'building_walls',watermill:'building_water_mill',library:'building_library',university:'building_university',lab:'building_research_lab',shrine:'building_shrine',temple:'building_temple',market:'building_market',bank:'building_bank',amphitheater:'building_amphitheater',museum:'building_museum_art',workshop:'building_workshop',factory:'building_factory',arena:'building_arena'},
  districts:{campus:'district_campus',holy:'district_holy_site',commercial:'district_commercial_hub',harbor:'district_harbor',aqueduct:'district_aqueduct',theater:'district_theater',industrial:'district_industrial_zone',encampment:'district_encampment',entertainment:'district_entertainment_complex',neighborhood:'district_neighborhood',spaceport:'district_spaceport'},
  wonders:{pyramids:'building_pyramids',oracle:'building_oracle',colosseum:'building_colosseum',libraryWonder:'building_great_library',satellite:'project_launch_earth_satellite',moon:'project_launch_moon_landing',mars:'project_launch_mars_base',exoplanet:'project_launch_exoplanet_expedition',laser:'project_orbital_laser',festival:'project_enhance_district_theater',researchProject:'project_enhance_district_campus'},
};
const strip=s=>s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const queue=Object.entries(ids).flatMap(([category,rows])=>Object.entries(rows).map(([id,sourceId])=>({id,sourceId,category}))), rows=[];
let cursor=0;
await Promise.all(Array.from({length:4},async()=>{
  while(cursor<queue.length){
    const record=queue[cursor++], source=base+record.category+'/'+record.sourceId+'/';
    let html;
    for(let i=0;i<3;i++){try{const res=await fetch(source,{signal:AbortSignal.timeout(30000)});assert(res.ok,`${res.status}: ${source}`);html=await res.text();assert(html.includes('<h1'));break;}catch(e){if(i===2)throw e;}}
    html=html.slice(html.indexOf('<h1'));
    const requirements=html.slice(html.indexOf('>要求<'));
    const cost=/生产力花费[\s\S]*?基准花费：\s*(\d+)/.exec(strip(html)) ?? /生产力消耗[\s\S]*?基准花费：\s*(\d+)/.exec(strip(html)) ?? /生产力费用[\s\S]*?基准花费：\s*(\d+)/.exec(strip(html));
    const text=strip(html), stats={}, attributes=text.slice(text.indexOf('特点'));
    const upkeep=/维护费用\s*基准花费：\s*(\d+)/.exec(text);
    if (record.category==='units') stats.maintenance=upkeep?Number(upkeep[1]):0;
    for(const [key,label] of [['strength','近战攻击力'],['rangedStrength','远程攻击力'],['bombardStrength','轰炸攻击力'],['moves','移动力'],['range','射程']]){
      const value=new RegExp('(\\d+)\\s+'+label).exec(attributes); if(value)stats[key]=Number(value[1]);
    }
    if(stats.moves !== undefined) assert(stats.moves>=0 && stats.moves<=6,`Bad movement: ${source}`);
    if(stats.moves===0) delete stats.moves; // Traders use automatic route movement in the original.
    rows.push({...record,source,cost:cost?Number(cost[1]):null,...stats});
    if(cursor%15===0)process.stderr.write('items '+cursor+'/'+queue.length+'\n');
  }
}));
rows.sort((a,b)=>a.id.localeCompare(b.id));
const content='// Factual Civilopedia references; Gathering Storm, fetched 2026-09-30.\nexport const itemReference = '+JSON.stringify(rows,null,2)+' as const;\n';
console.log('*** Begin Patch\n*** Add File: /Users/bdh/fk/aoinatsu-web/src/games/civilization/item-reference.ts\n'+content.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n*** End Patch');
