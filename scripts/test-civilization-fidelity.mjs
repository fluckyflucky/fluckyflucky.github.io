import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { moduleUrl } from './civilization-test-module.mjs';
const w=await import(moduleUrl('src/games/civilization/world.ts')),
  c=await import(moduleUrl('src/games/civilization/catalog.ts')),
  r=await import(moduleUrl('src/games/civilization/research-reference.ts')),
  ids=await import(moduleUrl('src/games/civilization/research.ts')),
  saves=await import(moduleUrl('src/games/civilization/saves.ts')),
  politics=await import(moduleUrl('src/games/civilization/politics.ts')),
  politicsRef=await import(moduleUrl('src/games/civilization/politics-reference.ts'));
let passed=0;
function test(name, fn){fn();passed++;console.log('✓ '+name);}
function setup(){const s=w.create({seed:42,size:'compact',speed:'normal',difficulty:'relaxed',cityStateCount:2});assert(w.found(s,s.units.find(u=>u.owner===0&&u.type==='settler')));return s;}
test('reference scraper reads era itself, not an era mentioned by prerequisites or boosts',()=>{
  execFileSync(process.execPath,['scripts/civilopedia-research.mjs','--test-era']);
});
test('77 technologies and 61 civics match source costs, prerequisites, eras and boosts',()=>{
  assert.equal(c.techs.length,77);assert.equal(c.civics.length,61);
  for(const ref of r.researchReference){
    const row=[...c.techs,...c.civics].find(row=>row.sourceId===ref.id);
    assert(row);assert.equal(row.cost,ref.cost);assert.equal(row.boost,ref.boost);assert.equal(row.era,ref.era);
    assert.deepEqual(row.requires,ref.requires.map(ids.researchId));
    assert(!row.boost.includes('历史背景'));assert(row.boost.length<250);
  }
});
test('independent golden fixtures: education, astrology and archery',()=>{
  const education=c.techs.find(t=>t.id==='education');assert.equal(education.cost,390);assert.deepEqual(new Set(education.requires),new Set(['mathematics','apprentice']));assert.equal(education.boost,'获得1位大科学家。');
  assert.equal(c.techs.find(t=>t.id==='astrology').boost,'发现1个自然奇观。');
  assert.equal(c.techs.find(t=>t.id==='archery').boost,'用投石兵击杀1个单位。');
  assert.equal(c.techs.find(t=>t.id==='wheel').sourceId,'tech_the_wheel');
  assert.equal(c.techs.find(t=>t.id==='satellites').era,7,'Civilopedia places Satellites in Information Era, not Modern');
  assert.equal(c.techs.find(t=>t.id==='flight').era,5);
  assert.equal(c.civics.find(t=>t.id==='humanism').era,3);assert.equal(c.civics.find(t=>t.id==='exploration').era,3);
  assert.deepEqual(Array.from({length:9},(_,era)=>c.techs.filter(r=>r.era===era).length),[11,8,8,9,8,8,8,9,8]);
  assert.deepEqual(Array.from({length:9},(_,era)=>c.civics.filter(r=>r.era===era).length),[7,7,7,6,7,9,5,7,6]);
});
test('every constructible item unlock is present in the canonical trees',()=>{
  const all=new Set([...c.techs,...c.civics].map(r=>r.id));
  for(const item of c.items){assert(!item.unlock||all.has(item.unlock),item.id+' unlock');assert(!item.needs||c.itemMap[item.needs],item.id+' prerequisite');}
  for(const p of c.policies)assert(all.has(p[2]),p[0]+' civic');
});
test('ordinary mountains and cattle do not produce astrology/animal-husbandry boosts',()=>{
  const s=setup(),n=s.nations[0],city=s.cities.find(c=>c.owner===0),tile=s.tiles[w.neighbors(s,city.tile)[0]];
  tile.terrain='mountain';tile.naturalWonder=false;w.reveal(s);assert(!n.boosts.includes('astrology'));assert(!n.boosts.includes('animals'));
  tile.naturalWonder=true;w.reveal(s);assert(n.boosts.includes('astrology'));
});
test('two campuses boost recorded history, not education',()=>{
  const s=setup(),n=s.nations[0],city=s.cities.find(c=>c.owner===0);city.buildings.push('campus');
  const other=s.cities.find(c=>c.owner===1);other.owner=0;other.buildings.push('campus');for(const t of s.tiles)if(t.territory===other.id)t.owner=0;
  w.nextTurn(s);assert(n.boosts.includes('recordedhistory'));assert(!n.boosts.includes('education'));
});
test('industrial-zone adjacency uses pairs of mines, aqueducts and city-center minor bonus',()=>{
  const s=setup(),city=s.cities.find(c=>c.owner===0),index=city.tile,ns=w.neighbors(s,index);
  for(const i of ns){Object.assign(s.tiles[i],{district:'',city:-1,resource:'',improvement:'',terrain:'grass'});}
  s.tiles[ns[0]].improvement='mine';assert.equal(w.adjacency(s,'industrial',index),0);
  s.tiles[ns[1]].improvement='mine';assert.equal(w.adjacency(s,'industrial',index),1);
  s.tiles[ns[2]].district='aqueduct';assert.equal(w.adjacency(s,'industrial',index),3);
  s.tiles[ns[3]].city=123;assert.equal(w.adjacency(s,'industrial',index),4);
});
test('aqueducts require city adjacency, water source, and do not consume a specialty slot',()=>{
  const s=setup(),city=s.cities.find(c=>c.owner===0),n=s.nations[0];n.tech.push('engineering');city.pop=1;city.buildings.push('campus');
  assert.equal(w.buildReason(s,city,'aqueduct'),'');
  const near=w.neighbors(s,city.tile).find(i=>s.tiles[i].territory===city.id);s.tiles[near].terrain='grass';s.tiles[near].river=true;
  assert.equal(w.placementReason(s,city,'aqueduct',near),'');
  s.tiles[city.tile].river=false;for(const i of w.neighbors(s,city.tile)){s.tiles[i].terrain='grass';s.tiles[i].baseTerrain='grass';s.tiles[i].feature='';}
  assert.equal(w.baseHousing(s,city),2);city.buildings.push('aqueduct');assert.equal(w.baseHousing(s,city),6);
  s.tiles[city.tile].river=true;assert.equal(w.baseHousing(s,city),7);
});
test('Mars colony is not scientific victory; expedition wins only upon arrival',()=>{
  const s=setup(),n=s.nations[0];s.cities.find(c=>c.owner===0).buildings.push('mars');w.checkVictory(s);assert.equal(s.winner,null);
  n.space={launched:true,distance:49,speed:1};w.checkVictory(s);assert.equal(s.winner,null);
  w.nextTurn(s);assert.equal(s.winner?.type,'science');assert.equal(n.space.distance,50);
});
test('space stages can be built in different cities, with no duplicate empire-wide stage',()=>{
  const s=setup(),n=s.nations[0],a=s.cities.find(c=>c.owner===0),b=s.cities.find(c=>c.owner===1);b.owner=0;b.buildings.push('spaceport');a.buildings.push('satellite');n.tech.push('satellites');
  assert.equal(w.buildReason(s,b,'moon'),'');assert.equal(w.buildReason(s,b,'satellite'),'已建成');
});
test('culture compares visiting tourists to rival domestic tourists, without a media prerequisite',()=>{
  const s=setup(),n=s.nations[0];n.tourism=1000;n.civic.push('media');w.checkVictory(s);assert.equal(s.winner,null);
  s.nations[1].totalCulture=2000;s.nations[2].totalCulture=1000;n.tourismAgainst=[0,18000,18000];
  assert.equal(w.foreignTourists(s,0),60);n.civic=[];w.checkVictory(s);assert.equal(s.winner?.type,'culture');
});
test('nationalism does not give every existing unit a passive combat bonus',()=>{
  const s=setup(),u=s.units.find(u=>u.owner===0&&u.type==='warrior'),before=w.strength(s,u,1);s.nations[0].civic.push('nationalism');assert.equal(w.strength(s,u,1),before);
});
test('archers use 25 ranged strength and 15 melee defense',()=>{
  const s=setup(),u=w.spawn(s,0,'archer',s.units.find(u=>u.owner===0).tile);Object.assign(s.tiles[u.tile],{terrain:'grass',hills:false,feature:''});assert.equal(c.itemMap.archer.cost,60);assert.equal(w.strength(s,u,1),25);assert.equal(w.strength(s,u,1,true),15);
});
test('corvee is only +15% for ancient/classical wonders, not buildings or districts',()=>{
  const s=setup(),n=s.nations[0],city=s.cities.find(c=>c.owner===0);n.civic.push('stateworkforce');n.policies=['labor',null];const base=w.yields(s,city).production;
  assert.equal(w.productionRate(s,city,'pyramids'),base*1.15);assert.equal(w.productionRate(s,city,'library'),base);assert.equal(w.productionRate(s,city,'campus'),base);
});
test('new tourism/space fields reject malformed saves, v2 migration is non-mutating',()=>{
  const s=setup();assert(saves.valid(s));const old=structuredClone(s);old.version=2;for(const n of old.nations){delete n.totalCulture;delete n.space;delete n.tourismAgainst;delete n.barbarianKills;}
  const before=JSON.stringify(old), migrated=saves.migrate(old);assert(migrated);assert.equal(migrated.version,3);assert.equal(JSON.stringify(old),before);
  for(const mutate of [s=>s.nations[0].space.distance=NaN,s=>s.nations[0].tourismAgainst=[1],s=>s.tiles[0].hills='yes',s=>s.nations[0].totalCulture=-1,s=>s.nations[0].civ='missing']){const bad=structuredClone(s);mutate(bad);assert(!saves.valid(bad));}
});
test('all 13 government layouts and unlocks match the snapshot and official 2021 slot fixes',()=>{
  assert.equal(c.governments.length,13);
  for(const g of c.governments){const ref=politicsRef.governmentReference.find(r=>r.id===g.id);assert.deepEqual(g.slots,ref.slots);assert.equal(g.unlock,ids.researchId(ref.unlock));assert(c.civics.some(r=>r.id===g.unlock));}
  const count=id=>c.governments.find(g=>g.id===id).slots.reduce((a,k)=>(a[k]=(a[k]??0)+1,a),{});
  assert.deepEqual(count('oligarchy'),{military:2,economic:1,wild:1});
  assert.deepEqual(count('merchant'),{military:1,economic:2,diplomatic:2,wild:1});
  assert.deepEqual(count('monarchy'),{military:2,economic:1,diplomatic:1,wild:2});
});
test('policies obey source unlocks, obsolescence and government exclusivity',()=>{
  const s=setup(),n=s.nations[0];n.civic=['laws'];assert(c.policyAvailable(n,'planning'));assert(!c.policyAvailable(n,'rational'));
  n.policies=[null,'planning'];n.civic.push('theenlightenment');assert(!c.policyAvailable(n,'planning'));assert(!w.hasPolicy(n,'planning'));assert(c.policyAvailable(n,'rational'));
  n.civic.push('democracy','communism');assert(!c.policyAvailable(n,'newdeal'));assert(!c.policyAvailable(n,'collectivization'));
  n.government='democracy';assert(c.policyAvailable(n,'newdeal'));assert(!c.policyAvailable(n,'collectivization'));
  n.government='communist';assert(c.policyAvailable(n,'collectivization'));assert(!c.policyAvailable(n,'newdeal'));
});
test('completing a replacing civic clears obsolete equipped cards and permits free reconfiguration',()=>{
  const s=setup(),n=s.nations[0];n.civic=c.civics.map(r=>r.id).filter(id=>id!=='theenlightenment');n.culture='theenlightenment';n.policies=[null,'planning'];n.policyFree=false;
  w.advance(s,0,true,10000);assert.equal(n.policies[1],null);assert(n.policyFree);
});
test('rationalism boosts campus BUILDINGS only at 15 population and/or raw +4 adjacency',()=>{
  const s=setup(),n=s.nations[0],city=s.cities.find(c=>c.owner===0),at=w.neighbors(s,city.tile)[0];
  city.buildings=['campus','library','university'];s.tiles[at].district='campus';s.tiles[at].territory=city.id;s.tiles[at].owner=0;city.pop=15;n.civic.push('theenlightenment','recordedhistory');
  for(const i of w.neighbors(s,at))Object.assign(s.tiles[i],{terrain:'grass',district:'',city:-1,feature:'',resource:''});
  const mult=()=>{const delta=w.yields(s,city).happy;return delta>=5?1.2:delta>=3?1.1:delta>=-1?1:delta>=-3?.9:delta>=-5?.8:delta>=-7?.7:.6;};
  const base=w.yields(s,city).science;n.policies=[null,'rational'];assert(Math.abs(w.yields(s,city).science-base-3*mult())<1e-9);
  city.pop=14;n.policies=[];const below=w.yields(s,city).science;n.policies=['rational'];assert.equal(w.yields(s,city).science,below);
  const ns=w.neighbors(s,at);s.tiles[ns[0]].terrain='mountain';s.tiles[ns[1]].terrain='mountain';n.policies=['rational','naturalphilosophy'];
  const raw=w.adjacency(s,'campus',at);assert.equal(raw,2);n.policies=['naturalphilosophy'];const doubled=w.yields(s,city).science;n.policies.push('rational');assert.equal(w.yields(s,city).science,doubled);
  s.tiles[ns[2]].terrain='mountain';s.tiles[ns[3]].terrain='mountain';n.policies=['naturalphilosophy'];const plus4=w.yields(s,city).science;n.policies.push('rational');assert(Math.abs(w.yields(s,city).science-plus4-3*mult())<1e-9);
});
test('natural philosophy doubles adjacency, not population or library science',()=>{
  const s=setup(),n=s.nations[0],city=s.cities.find(c=>c.owner===0),at=w.neighbors(s,city.tile)[0];city.buildings=['campus','library'];Object.assign(s.tiles[at],{district:'campus',territory:city.id,owner:0});n.civic.push('recordedhistory');
  for(const i of w.neighbors(s,at))Object.assign(s.tiles[i],{terrain:'grass',district:'',city:-1,feature:'',resource:''});s.tiles[w.neighbors(s,at)[0]].terrain='mountain';
  const before=w.yields(s,city).science;n.policies=['naturalphilosophy'];assert.equal(w.yields(s,city).science-before,1);
});
test('unit upkeep uses source values and conscription cannot pay negative maintenance',()=>{
  const s=setup(),n=s.nations[0];assert.equal(c.itemMap.warrior.maintenance,0);assert.equal(c.itemMap.archer.maintenance,1);assert.equal(c.itemMap.crossbow.maintenance,3);
  s.units=s.units.filter(u=>u.owner!==0);const at=s.cities.find(c=>c.owner===0).tile;w.spawn(s,0,'archer',at);w.spawn(s,0,'crossbow',w.neighbors(s,at)[0]);
  const before=w.totals(s).gold;n.civic.push('stateworkforce');n.policies=['conscription'];assert.equal(w.totals(s).gold-before,2);
  n.civic.push('mobilization');n.policies=['levee'];assert.equal(w.totals(s).gold-before,3);
});
test('diplomatic league doubles only the first envoy, never city-state yields',()=>{
  const s=setup(),n=s.nations[0],cs=s.cityStates[0];n.civic.push('philosophy');n.policies=['league'];n.met.push(cs.owner);n.envoys=2;
  assert(w.sendEnvoy(s,cs.owner));assert.equal(cs.envoys[0],2);assert.equal(n.envoys,1);assert(w.sendEnvoy(s,cs.owner));assert.equal(cs.envoys[0],3);assert.equal(n.envoys,0);
  const before=w.totals(s).science;n.policies=[];assert.equal(w.totals(s).science,before);
});
test('democracy trade bonus needs suzerainty and benefits both cities, not ordinary friends',()=>{
  const s=setup(),n=s.nations[0],from=s.cities.find(c=>c.owner===0),foreign=s.cities.find(c=>c.owner===1),cs=s.cityStates[0],to=s.cities.find(c=>c.owner===cs.owner);
  const normal=w.tradeYield(s,from,to);n.government='democracy';assert.deepEqual(w.tradeYield(s,from,to),normal);
  cs.envoys=[3,2,0];assert(w.democraticTrade(s,from,to));assert(!w.democraticTrade(s,from,foreign));
  const boosted=w.tradeYield(s,from,to);assert.equal(boosted.food-normal.food,4);assert.equal(boosted.production-normal.production,4);
  const destBefore=w.yields(s,to).food;s.routes.push({id:s.next++,owner:0,from:from.id,to:to.id,path:[from.tile,to.tile],remaining:24});assert.equal(w.yields(s,to).food-destBefore,4);
  cs.envoys=[3,3,0];assert(!w.democraticTrade(s,from,to));
});
test('government and policy production modifiers add instead of multiply',()=>{
  const s=setup(),n=s.nations[0],city=s.cities.find(c=>c.owner===0);n.civic.push('stateworkforce','craft');n.government='autocracy';n.policies=['labor'];const base=w.yields(s,city).production;assert.equal(w.productionRate(s,city,'pyramids'),base*1.25);
  n.government='fascism';n.policies=['agoge'];assert.equal(w.productionRate(s,city,'warrior'),w.yields(s,city).production*2);
  n.government='merchant';n.policies=[];const prod=w.yields(s,city).production;assert.equal(w.productionRate(s,city,'campus'),prod*1.15);
});
test('public works affects only newly trained builders and does not stack charges with serfdom',()=>{
  const s=setup(),n=s.nations[0],at=s.cities.find(c=>c.owner===0).tile;n.civic.push('civilengineering');n.policies=['publicworks'];const u=w.spawn(s,0,'builder',at);assert.equal(u.charges,6);n.policies=[];assert.equal(u.charges,6);assert.equal(w.spawn(s,0,'builder',w.neighbors(s,at)[0]).charges,4);
});
test('republic housing/amenities requires a district; oligarchy excludes scouts and cavalry',()=>{
  const s=setup(),n=s.nations[0],city=s.cities.find(c=>c.owner===0),before=w.yields(s,city);n.government='republic';assert.equal(w.amenities(s,city),before.amenities);assert.equal(w.yields(s,city).housing,before.housing);
  city.buildings.push('campus');assert.equal(w.amenities(s,city),before.amenities+1);assert.equal(w.yields(s,city).housing,before.housing+1);
  const warrior=s.units.find(u=>u.owner===0&&u.type==='warrior'),at=warrior.tile,horse=w.spawn(s,0,'horse',w.neighbors(s,at)[0]),scout=w.spawn(s,0,'scout',w.neighbors(s,at)[1]);const base=[warrior,horse,scout].map(u=>w.strength(s,u,1));n.government='oligarchy';assert.deepEqual([warrior,horse,scout].map(u=>w.strength(s,u,1)),[base[0]+4,base[1],base[2]]);
});
test('legacy merchant/oligarchy layouts migrate without losing cards; malformed v3 fields stay rejected',()=>{
  const s=setup(),n=s.nations[0];n.civic.push('philosophy','mysticism');n.government='oligarchy';n.policies=['discipline','planning','league',null];const raw=JSON.stringify(s),m=saves.migrate(s);assert(m);assert(saves.valid(m));assert.equal(JSON.stringify(s),raw);assert.deepEqual(new Set(m.nations[0].policies.filter(Boolean)),new Set(n.policies.filter(Boolean)));
  const unplaceable=structuredClone(s);unplaceable.nations[0].policies[3]='revelation';assert.equal(saves.migrate(unplaceable),null);
  const bad=structuredClone(s);bad.nations[0].space=null;assert.equal(saves.migrate(bad),null);
  const storage=new Map([['aoinatsu:civilization:v3',raw]]);globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};const loaded=saves.load();assert(loaded.state);assert(loaded.migrated);assert.equal(storage.get('aoinatsu:civilization:v3:pre-politics'),raw);assert.equal(storage.get('aoinatsu:civilization:v3'),raw);delete globalThis.localStorage;
});
test('purchase affordability uses the same discounted price as the UI',()=>{
  const s=setup(),n=s.nations[0],city=s.cities.find(c=>c.owner===0);city.queue=[];n.government='democracy';n.gold=w.cost(s,'monument')*3;assert.equal(w.purchasePrice(s,city,'monument'),n.gold);assert(w.purchase(s,city,'monument'));assert.equal(n.gold,0);
});
test('defensive tactics boosts the declared-on civilization, not the aggressor or a rejected declaration',()=>{
  const s=setup(),a=s.nations[0],b=s.nations[1];a.met.push(1);
  assert.equal(w.diplomacy(s,1,'war'),true);
  assert(b.boosts.includes('defensivetactics'));assert(!a.boosts.includes('defensivetactics'));
  const progress=b.researchProgress.defensivetactics;
  assert.equal(w.diplomacy(s,1,'war'),false);assert.equal(b.researchProgress.defensivetactics,progress);
  const blocked=setup();blocked.nations[0].met.push(1);w.relation(blocked,0,1).until=100;
  assert.equal(w.diplomacy(blocked,1,'war'),false);assert(!blocked.nations[1].boosts.includes('defensivetactics'));
});
test('missionary base purchase, movement, charges and shrine prerequisite match Civilopedia',()=>{
  const s=setup(),n=s.nations[0],city=s.cities.find(c=>c.owner===0);
  s.options.speed='normal';n.religion='test';city.religion=0;city.pressure[0]=100;n.faith=1000;
  assert.match(w.buildReason(s,city,'missionary'),/祠堂/);
  city.buildings.push('holy','shrine');assert.equal(w.buildReason(s,city,'missionary'),'');
  assert(!n.civic.includes('theology'),'shrine, not theology, unlocks missionaries');
  assert.equal(w.purchasePrice(s,city,'missionary'),150);
  s.units=s.units.filter(u=>u.tile!==city.tile);
  assert(w.purchase(s,city,'missionary'));const u=s.units.find(u=>u.owner===0&&u.type==='missionary');assert.equal(c.itemMap.missionary.moves,4);assert.equal(u.moves,0,'newly purchased units wait until the next turn');assert.equal(u.charges,3);assert.equal(n.faith,850);
  n.government='theocracy';assert.equal(w.purchasePrice(s,city,'missionary'),128);
  s.options.speed='quick';assert.equal(w.purchasePrice(s,city,'missionary'),85);
});
console.log(`\n${passed} factual/rule regression checks passed. This is NOT a 90% release approval.`);
