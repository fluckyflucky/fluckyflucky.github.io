import assert from 'node:assert/strict';
import { moduleUrl } from './civilization-test-module.mjs';
const w=await import(moduleUrl('src/games/civilization/world.ts'));
const c=await import(moduleUrl('src/games/civilization/catalog.ts'));
const saves=await import(moduleUrl('src/games/civilization/saves.ts'));
const cs=await import(moduleUrl('src/games/civilization/city-states.ts'));
const faith=await import(moduleUrl('src/games/civilization/religion.ts'));
const gp=await import(moduleUrl('src/games/civilization/great-people.ts'));
let passed=0;
function test(name,fn){fn();passed++;console.log('✓ '+name);}
function setup(options={}) {
  const s=w.create({seed:42,size:'compact',speed:'normal',difficulty:'relaxed',cityStateCount:2,...options});
  assert(w.found(s,s.units.find(u=>u.owner===0&&u.type==='settler')));
  return s;
}
const own=s=>s.cities.find(c=>c.owner===0);
function builderFixture() {
  const s=setup(),city=own(s),n=s.nations[0],at=w.neighbors(s,city.tile)[0];
  s.units=[];const t=s.tiles[at];Object.assign(t,{terrain:'grass',baseTerrain:'grass',feature:'',hills:false,resource:'',improvement:'',district:'',pillaged:false});
  const u=w.spawn(s,0,'builder',at);return {s,city,n,t,u,at};
}
test('existing GS resources use independent base yields, reveal gates and 2/3 strategic extraction',()=>{
  const {s,n,t}=builderFixture();
  for(const [id,food,production,science,gold,perTurn] of [
    ['wheat',1,0,0,0],['cattle',1,0,0,0],['fish',1,0,0,0],['spices',2,0,0,0],['gems',0,0,0,3],
    ['horses',1,1,0,0,2],['iron',0,0,1,0,2],['coal',0,2,0,0,3],['oil',0,3,0,0,3],
  ]) {
    t.resource=id;n.tech=[];const hidden=w.tileYield(s,t);
    if(c.resources[id].type==='strategic') {assert.equal(hidden.food,2);assert.equal(hidden.production,0);assert.equal(hidden.science,0);}
    if(c.resources[id].unlock)n.tech.push(c.resources[id].unlock);
    const y=w.tileYield(s,t);assert.equal(y.food,2+food,id);assert.equal(y.production,production,id);assert.equal(y.science,science,id);assert.equal(y.gold,gold,id);
    if(perTurn)assert.equal(c.resources[id].perTurn,perTurn);
  }
  assert.equal(c.resources.oil.unlock,'refining');
});
test('all seven existing improvements apply their actual base and research increments, not advance bonuses early',()=>{
  const {s,n,t}=builderFixture();
  const cases=[
    ['farm',[],[],[1,0,0]],['mine',[],[],[0,1,0]],['mine',['apprentice','industry','smartmaterials'],[],[0,4,0]],
    ['pasture',[],[],[0,1,0]],['pasture',['stirrups','robotics','replaceableparts'],[],[2,2,0]],
    ['plantation',[],[],[0,0,2]],['plantation',['scientifictheory'],['feudal','globalization'],[2,0,4]],
    ['lumber',[],[],[0,2,0]],['lumber',['steel','cybernetics'],[],[0,4,0]],
    ['fishery',[],[],[1,0,0]],['fishery',['cartography','plastics'],['colonialism'],[2,1,2]],
    ['oilwell',[],[],[0,2,0]],['oilwell',['predictivesystems'],[],[0,3,0]],
  ];
  for(const [id,tech,civic,[food,production,gold]] of cases) {
    n.tech=tech;n.civic=civic;t.improvement='';const base=w.tileYield(s,t);t.improvement=id;const y=w.tileYield(s,t);
    assert.equal(y.food-base.food,food,id);assert.equal(y.production-base.production,production,id);assert.equal(y.gold-base.gold,gold,id);
    t.pillaged=true;assert.deepEqual(w.tileYield(s,t),base);t.pillaged=false;
  }
  assert(cases.flatMap(row=>row[1]).every(id=>c.techs.some(d=>d.id===id)));assert(cases.flatMap(row=>row[2]).every(id=>c.civics.some(d=>d.id===id)));
});
test('farms require valid layered terrain and late hill unlock; river desert alone is not floodplains',()=>{
  const {s,n,t,u}=builderFixture();assert.equal(w.improvementReason(s,u,'farm'),'');
  t.terrain='hill';t.hills=true;assert(w.improvementReason(s,u,'farm'));n.civic=['civilengineering'];assert.equal(w.improvementReason(s,u,'farm'),'');
  t.terrain='desert';t.baseTerrain='desert';t.hills=false;t.river=true;assert(w.improvementReason(s,u,'farm'));t.feature='floodplains';assert.equal(w.improvementReason(s,u,'farm'),'');
  t.feature='forest';assert(w.improvementReason(s,u,'farm'));t.feature='';t.baseTerrain='tundra';assert(w.improvementReason(s,u,'farm'));
});
test('resource improvements are exclusive without leaking unrevealed resources; woods mines need resource exceptions',()=>{
  const {s,n,t,u}=builderFixture();n.tech=['mining'];t.resource='cattle';assert.match(w.improvementReason(s,u,'farm'),/牧场/);
  const before=structuredClone(s);assert(!w.improve(s,u,'farm'));assert.deepEqual(s,before);
  t.resource='horses';assert.equal(w.improvementReason(s,u,'farm'),'');n.tech.push('animals');assert.match(w.improvementReason(s,u,'farm'),/牧场/);assert.equal(w.improvementReason(s,u,'pasture'),'');
  t.resource='';t.terrain='hill';t.hills=true;t.feature='forest';assert(w.improvementReason(s,u,'mine'));t.resource='iron';n.tech.push('bronze');assert.equal(w.improvementReason(s,u,'mine'),'');
  t.resource='gems';t.hills=false;t.terrain='grass';t.feature='rainforest';assert.equal(w.improvementReason(s,u,'mine'),'');
});
test('lumber mills recognize wooded hills and rainforest unlock; fishing boats need fish and oil wells need land/refining',()=>{
  const {s,n,t,u}=builderFixture();n.tech=['construction','sailing','refining'];t.terrain='hill';t.hills=true;t.feature='forest';assert.equal(w.improvementReason(s,u,'lumber'),'');
  t.feature='rainforest';assert(w.improvementReason(s,u,'lumber'));n.civic=['mercantilism'];assert.equal(w.improvementReason(s,u,'lumber'),'');
  Object.assign(t,{terrain:'water',baseTerrain:'coast',hills:false,feature:'',resource:''});assert(w.improvementReason(s,u,'fishery'));t.resource='fish';assert.equal(w.improvementReason(s,u,'fishery'),'');
  t.resource='oil';assert(w.improvementReason(s,u,'oilwell'));t.terrain='grass';t.baseTerrain='desert';assert.equal(w.improvementReason(s,u,'oilwell'),'');n.tech=['combustion'];assert(w.improvementReason(s,u,'oilwell'));
});
test('reserved district tiles reject improvements/chops without spending charges or mutating the queue',()=>{
  const {s,n,t,u,city,at}=builderFixture();n.tech=['writing','mining'];city.queue=[];assert(w.enqueue(s,city,'campus',at));t.feature='forest';
  const before=structuredClone(s);assert(w.improvementReason(s,u,'farm'));assert(!w.improve(s,u,'farm'));assert(!w.chop(s,u));assert.deepEqual(s,before);
});
test('builder repairs and removes only owned improvements, for no charges; districts require city production',()=>{
  const {s,t,u,city}=builderFixture();t.improvement='mine';t.pillaged=true;const charges=u.charges;assert(w.repair(s,u));assert.equal(u.charges,charges);assert(!t.pillaged);assert.equal(u.moves,0);
  u.moves=2;assert(w.removeImprovement(s,u));assert.equal(u.charges,charges);assert.equal(t.improvement,'');
  u.moves=2;t.district='campus';t.pillaged=true;city.buildings.push('campus');const before=structuredClone(s);assert.match(w.repairReason(s,u),/城市生产/);assert(!w.repair(s,u));assert(!w.removeImprovement(s,u));assert.deepEqual(s,before);
});
test('wooded-hill chopping uses the shared action gate and preserves underlying terrain/resources',()=>{
  const {s,n,t,u,city}=builderFixture();n.tech=['mining'];t.terrain='hill';t.hills=true;t.baseTerrain='tundra';t.feature='forest';t.resource='gems';
  const charges=u.charges;assert.equal(w.chopReason(s,u),'');assert(w.chop(s,u));assert.equal(t.feature,'');assert.equal(t.baseTerrain,'tundra');assert.equal(t.hills,true);assert.equal(t.resource,'gems');assert.equal(u.charges,charges-1);assert.equal(city.invested['monument:-1'],25);
});
test('district repair is a priced production job, preserves investment/locked price on cancel/reload, and does not rebuild the district',()=>{
  const {s,n,t,city}=builderFixture();city.queue=[];city.buildings.push('campus','library');t.district='campus';t.pillaged=true;n.tech=['writing'];
  assert(w.enqueueDistrictRepair(s,city,'campus'));const job=city.queue[0],key=w.jobKey(job),price=w.jobCost(s,city,job);assert.equal(price,15);assert.equal(key,`repair:campus:${job.tile}`);
  const before=structuredClone(s);assert(!w.enqueueDistrictRepair(s,city,'campus'));assert.deepEqual(s,before);city.invested[key]=7;city.queue=[];
  n.tech=c.techs.map(d=>d.id);assert.equal(w.districtRepairCost(s,city,'campus'),price,'resume button must show the locked price');assert(w.enqueueDistrictRepair(s,city,'campus'));assert.equal(w.jobCost(s,city,job),price);assert.equal(city.invested[key],7);assert(saves.valid(s));
  const loaded=saves.migrate(structuredClone(s));assert(loaded);const dest=own(loaded),j=dest.queue[0];dest.invested[w.jobKey(j)]=price;w.nextTurn(loaded);
  assert(!loaded.tiles[j.tile].pillaged);assert.equal(dest.queue.length,0);assert.equal(dest.buildings.filter(id=>id==='campus').length,1);assert.equal(dest.productionCosts[w.jobKey(j)],undefined);assert(saves.valid(loaded));
});
test('enemy occupation pauses district repair without spending investment; AI uses the same repair queue',()=>{
  const {s,t,city,at}=builderFixture();city.queue=[];city.buildings.push('campus');t.district='campus';t.pillaged=true;assert(w.enqueueDistrictRepair(s,city,'campus'));const j=city.queue[0],key=w.jobKey(j);city.invested[key]=4;
  s.units=[];w.relation(s,0,1).status='war';w.spawn(s,1,'warrior',at).moves=0;w.nextTurn(s);assert(t.pillaged);assert.equal(city.invested[key],4);assert.match(w.jobReason(s,city,j),/敌军/);assert(saves.valid(s));
  const ai=setup(),other=ai.cities.find(c=>c.owner===1),tile=ai.tiles[w.neighbors(ai,other.tile)[0]];other.buildings.push('campus');other.queue=[];Object.assign(tile,{district:'campus',pillaged:true});ai.units=[];
  w.computerTurn(ai,1);assert.equal(other.queue[0].repair,true);assert.equal(other.queue[0].item,'campus');assert(saves.valid(ai));
});
test('repair jobs reject nonboolean flags, unit repairs, unrelated target tiles and corrupt production keys',()=>{
  const {s,t,city}=builderFixture();city.queue=[];city.buildings.push('campus');t.district='campus';t.pillaged=true;assert(w.enqueueDistrictRepair(s,city,'campus'));
  for(const mutate of [x=>own(x).queue[0].repair='yes',x=>own(x).queue[0].item='warrior',x=>own(x).queue[0].tile=own(x).tile,x=>own(x).invested['repair:warrior:0']=5,x=>own(x).productionCosts['repair:campus:-1']=5,x=>delete own(x).productionCosts]) {const copy=structuredClone(s);mutate(copy);assert(!saves.valid(copy));}
});
test('pillaged districts suspend parent-chain yields, housing, amenities and new buildings until production repair',()=>{
  const {s,n,t,city,at}=builderFixture();city.queue=[];n.tech=['writing','education'];city.buildings=['campus','library','university'];t.district='campus';s.cityStates.forEach(state=>state.envoys[0]=0);for(const i of w.neighbors(s,at))Object.assign(s.tiles[i],{terrain:'grass',baseTerrain:'grass',feature:'',hills:false,district:''});const normal=w.yields(s,city);t.pillaged=true;
  assert.equal(normal.science-w.yields(s,city).science,6);assert.equal(w.scientistPoints(s,city),0);assert.match(w.buildReason(s,city,'lab'),/修复|需要/);
  t.district='aqueduct';city.buildings=['aqueduct'];const damaged=w.baseHousing(s,city);t.pillaged=false;assert(w.baseHousing(s,city)>damaged);
  city.buildings=['entertainment'];t.district='entertainment';const amenities=w.amenities(s,city);t.pillaged=true;assert(w.amenities(s,city)<amenities);
});
test('industrial envoy production uses the same latest amenity boundaries as city yields',()=>{
  const s=setup({cityStateCount:6}),city=own(s),state=s.cityStates.find(cs=>cs.type==='industrial'),n=s.nations[0];city.pop=20;city.buildings=['workshop'];for(const t of s.tiles)t.resource='';
  const id='fixtureAmenities';c.itemMap[id]={id,name:'fixture',kind:'building',cost:1,icon:'city',description:'',amenities:0};city.buildings.push(id);
  try {for(const [delta,mult] of [[-8,.6],[-7,.7],[-5,.8],[-3,.9],[-1,1],[3,1.1],[5,1.2]]) {
    c.itemMap[id].amenities=10+delta-2;state.envoys[0]=0;const base=w.productionRate(s,city,'monument');state.envoys[0]=1;assert(Math.abs(w.productionRate(s,city,'monument')-base-2*mult)<1e-8,`delta ${delta}`);
  }} finally {delete c.itemMap[id];}
});
test('builders embark with Sailing, cannot cross deep ocean before Cartography, and AI actually reaches and repairs pillaged improvements',()=>{
  const {s,n,t,u,city,at}=builderFixture();const water=w.neighbors(s,at).find(i=>i!==city.tile);Object.assign(s.tiles[water],{terrain:'water',baseTerrain:'coast'});
  assert(!w.passable(s,u,water));n.tech=['sailing'];assert(w.passable(s,u,water));s.tiles[water].baseTerrain='ocean';assert(!w.passable(s,u,water));n.tech.push('cartography');assert(w.passable(s,u,water));
  const ai=setup(),owner=1,home=ai.cities.find(c=>c.owner===owner),target=w.neighbors(ai,home.tile)[0];ai.units=[];for(const tile of ai.tiles)if(tile.owner===owner&&tile.city<0)tile.improvement='farm';
  Object.assign(ai.tiles[target],{terrain:'grass',baseTerrain:'grass',hills:false,feature:'',improvement:'mine',pillaged:true,district:''});const builder=w.spawn(ai,owner,'builder',home.tile),charges=builder.charges;
  w.computerTurn(ai,owner);assert.equal(builder.tile,target);builder.moves=2;w.computerTurn(ai,owner);assert(!ai.tiles[target].pillaged);assert.equal(builder.charges,charges);assert(saves.valid(ai));
});
test('coal and oil extraction each supply three stock per turn, only after reveal and while connected',()=>{
  const {s,n,t}=builderFixture();n.tech=['refining','industry'];for(const tile of s.tiles)tile.resource='';
  for(const [id,imp] of [['oil','oilwell'],['coal','mine']]) {t.resource=id;t.improvement=imp;t.pillaged=false;n.strategic[id]=0;w.nextTurn(s);assert.equal(n.strategic[id],3);t.pillaged=true;w.nextTurn(s);assert.equal(n.strategic[id],3);}
  assert(saves.valid(s));
});
test('GS growth buckets are nonlinear, speed-scaled, and housing uses whole points with a hard stop',()=>{
  const s=setup(),city=own(s);
  for(const [pop,expected] of [[1,24],[2,33],[4,55],[10,126]]) {city.pop=pop;assert.equal(w.growthCost(s,city),expected);}
  s.options.speed='quick';city.pop=1;assert.equal(w.growthCost(s,city),16);city.pop=4;assert.equal(w.growthCost(s,city),36);
  for(const [housing,pop,mult] of [[6,4,1],[5.5,4,0.5],[5,5,0.25],[5,9,0.25],[5,10,0],[5.5,10,0]]) assert.equal(w.housingGrowth(housing,pop),mult);
});
test('GS amenities require every citizen pair from population one, and use August 2020 boundary values',()=>{
  const city=own(setup());for(const [pop,needed] of [[1,1],[2,1],[3,2],[5,3],[12,6]]) {city.pop=pop;assert.equal(w.requiredAmenities(city),needed);}
  for(const [delta,yieldMult,food,growth] of [[5,1.2,1.2,1],[4,1.1,1.1,1],[3,1.1,1.1,1],[2,1,1,1],[-1,1,1,1],[-2,.9,1,.85],[-3,.9,1,.85],[-4,.8,1,.7],[-5,.8,1,.7],[-6,.7,1,0],[-7,.7,1,0],[-8,.6,1,0]]) {
    const mood=w.happiness(delta);assert.equal(mood.yield,yieldMult);assert.equal(mood.food,food);assert.equal(mood.growth,growth);
  }
});
test('each luxury reaches four needy cities, does not vanish at city five, and duplicates do not stack',()=>{
  const s=setup({cityStateCount:6}),cities=s.cities.slice(0,5);s.units=[];
  for(const t of s.tiles){t.resource='';t.improvement='';if(cities.some(c=>c.id===t.territory))t.owner=0;}
  cities.forEach((c,i)=>{c.owner=0;c.pop=2+i*2;c.buildings=[];});
  const base=w.amenityAllocation(s,0),a=s.tiles[w.neighbors(s,cities[0].tile)[0]],b=s.tiles[w.neighbors(s,cities[0].tile)[1]];
  Object.assign(a,{resource:'gems',improvement:'mine',owner:0,pillaged:false});
  const withOne=w.amenityAllocation(s,0);assert.equal(cities.reduce((sum,c)=>sum+withOne.get(c.id)-base.get(c.id),0),4);
  assert.equal(withOne.get(cities[0].id),base.get(cities[0].id),'best supplied capital is not prioritized');
  Object.assign(b,{resource:'gems',improvement:'mine',owner:0,pillaged:false});assert.deepEqual(w.amenityAllocation(s,0),withOne);
  a.pillaged=true;b.pillaged=true;assert.deepEqual(w.amenityAllocation(s,0),base);
  a.improvement='';a.city=cities[0].id;assert.deepEqual(w.amenityAllocation(s,0),withOne,'settled luxury needs no improvement');
});
test('half housing from plantations and fishing boats survives unworked tiles, but not pillaging',()=>{
  const s=setup(),city=own(s);for(const t of s.tiles)t.improvement='';const base=w.yields(s,city).housing;
  const ns=w.neighbors(s,city.tile);for(const [i,kind] of ns.slice(0,4).map((i,j)=>[i,['farm','pasture','plantation','fishery'][j]])) {s.tiles[i].improvement=kind;s.tiles[i].pillaged=false;}
  assert.equal(w.yields(s,city).housing,base+2);ns.slice(0,4).forEach(i=>s.tiles[i].pillaged=true);assert.equal(w.yields(s,city).housing,base);
});
test('founding clears removable features/improvements, but keeps bonus/luxury resources and hill base yields',()=>{
  for(const resource of ['wheat','gems']) {
    const s=w.create({seed:42,size:'compact'}),u=s.units.find(u=>u.owner===0&&u.type==='settler'),tile=s.tiles[u.tile];
    Object.assign(tile,{terrain:'forest',baseTerrain:'plain',hills:true,feature:'forest',resource,improvement:'mine',pillaged:true});
    assert(w.found(s,u));assert.equal(tile.feature,'');assert.equal(tile.improvement,'');assert.equal(tile.resource,resource);
    assert.equal(w.tileYield(s,tile).production,2,'plains hill remains, forest/mine do not');assert(saves.valid(s));
  }
});
test('settled strategic resources accumulate after their reveal tech, without an improvement or worker',()=>{
  const s=setup(),city=own(s),n=s.nations[0],tile=s.tiles[city.tile];tile.resource='iron';tile.improvement='';n.strategic.iron=0;n.tech=[];
  w.nextTurn(s);assert.equal(n.strategic.iron,0);n.tech.push('bronze');w.nextTurn(s);assert.equal(n.strategic.iron,2);assert(saves.valid(s));
});
test('layered defense stacks forested hills and penalizes marshes without applying feature bonuses to city centers',()=>{
  const s=setup(),u=s.units.find(u=>u.owner===0&&u.type==='warrior'),t=s.tiles[u.tile];Object.assign(t,{terrain:'grass',hills:false,feature:''});const base=w.strength(s,u,1,true);
  t.hills=true;t.feature='forest';assert.equal(w.strength(s,u,1,true),base+6);t.hills=false;t.feature='marsh';assert.equal(w.strength(s,u,1,true),base-2);
  const city=own(s);u.tile=city.tile;Object.assign(s.tiles[city.tile],{hills:true,feature:'forest'});assert.equal(w.strength(s,u,1,true),base);
});
test('GS positive amenities boost food before consumption, not a second bonus on food surplus',()=>{
  const s=setup(),city=own(s);city.buildings=[];for(const t of s.tiles)t.resource='';const base=w.yields(s,city);assert.equal(base.happy,1);
  const id='testAmenities',saved=c.itemMap[id];c.itemMap[id]={id,name:'fixture',cost:1,kind:'building',description:'',icon:'city',amenities:4};city.buildings.push(id);
  try {const enhanced=w.yields(s,city);assert.equal(enhanced.happy,5);assert(Math.abs(enhanced.food-base.food*1.2)<1e-9);assert(Math.abs(enhanced.growing-(enhanced.food-2)*w.housingGrowth(enhanced.housing,1))<1e-9);}
  finally {city.buildings.pop();if(saved)c.itemMap[id]=saved;else delete c.itemMap[id];}
});
test('growth turn settlement uses the UI bucket, preserves overflow and does not grow a stopped city from old stock',()=>{
  const s=setup(),city=own(s);city.queue=[];const y=w.yields(s,city);assert(y.growing>0);
  city.food=w.growthCost(s,city)-.1;const expected=city.food+y.growing-w.growthCost(s,city);w.nextTurn(s);assert.equal(city.pop,2);assert(Math.abs(city.food-expected)<1e-9);
  city.pop=20;city.food=10000;city.buildings=[];for(const t of s.tiles)if(t.territory===city.id)Object.assign(t,{baseTerrain:'grass',terrain:'grass',feature:'rainforest',improvement:'',resource:''});
  assert.equal(w.yields(s,city).growing,0);w.nextTurn(s);assert.equal(city.pop,20);assert(saves.valid(s));
});
test('resting and waking cannot refill movement; stored remaining moves persist across save/reload',()=>{
  const s=setup(),u=s.units.find(u=>u.owner===0&&u.type==='warrior');u.moves=1;u.acted=true;
  assert(w.fortify(s,u));assert.equal(u.moves,0);assert.equal(u.restingMoves,1);assert(saves.valid(s));
  const loaded=saves.migrate(structuredClone(s)),v=loaded.units.find(v=>v.id===u.id);assert(w.fortify(loaded,v));assert.equal(v.moves,1);
  assert(w.fortify(s,u));assert.equal(u.moves,1);u.moves=0;assert(w.fortify(s,u));assert(w.fortify(s,u));assert.equal(u.moves,0);
  assert(w.fortify(s,u));w.nextTurn(s);assert(w.fortify(s,u));assert.equal(u.moves,w.maxMoves(s,u));
  s.nations[0].tech.push('steam');assert.equal(w.maxMoves(s,u),2,'steam power alone never boosts every unit');
});
test('stationary fortification advances 3 then 6 without a button, movement clears it, cavalry cannot fortify',()=>{
  const s=setup(),u=s.units.find(u=>u.owner===0&&u.type==='warrior');s.tiles[u.tile].terrain='grass';s.tiles[u.tile].hills=false;s.tiles[u.tile].feature='';
  const base=w.strength(s,u,1,true);w.nextTurn(s);assert.equal(u.fortificationTurns,1);assert.equal(w.strength(s,u,1,true),base+3);
  w.nextTurn(s);assert.equal(u.fortificationTurns,2);assert.equal(w.strength(s,u,1,true),base+6);
  const to=w.neighbors(s,u.tile).find(i=>!s.units.some(v=>v.tile===i));Object.assign(s.tiles[to],{terrain:'grass',hills:false,feature:'',river:s.tiles[u.tile].river,owner:0});assert(w.move(s,u,to));assert.equal(u.fortificationTurns,0);
  u.type='horse';u.fortificationTurns=2;assert(!w.canFortify(u));assert.equal(w.strength(s,u,1,true),36);assert(saves.valid(s));
});
test('healing uses districts/own/neutral/rival territory and maritime restrictions without moving or consuming RNG',()=>{
  const s=setup(),city=own(s),u=s.units.find(u=>u.owner===0&&u.type==='warrior');u.tile=city.tile;u.hp=40;u.acted=false;const tile=s.tiles[u.tile],seed=s.seed;
  assert.equal(w.healingRate(s,u),20);tile.city=-1;tile.district='campus';assert.equal(w.healingRate(s,u),20);tile.district='';assert.equal(w.healingRate(s,u),15);
  tile.owner=-1;assert.equal(w.healingRate(s,u),10);tile.owner=1;assert.equal(w.healingRate(s,u),5);
  tile.terrain='water';u.type='galley';assert.equal(w.healingRate(s,u),0);tile.owner=0;assert.equal(w.healingRate(s,u),15);
  u.type='warrior';tile.owner=-1;assert.equal(w.healingRate(s,u),0);u.acted=true;tile.owner=0;assert.equal(w.healingRate(s,u),0);
  assert.equal(u.hp,40);assert.equal(s.seed,seed);
});
test('suzerain territory supports healing while mere friendship does not; missionaries and barbarians do not rest-heal',()=>{
  const s=setup(),u=s.units.find(u=>u.owner===0&&u.type==='warrior'),state=s.cityStates[0],tile=s.tiles[u.tile];tile.city=-1;tile.terrain='grass';tile.district='';tile.owner=state.owner;state.envoys=[3,0,0];
  assert.equal(w.healingRate(s,u),15);state.envoys=[3,3,0];assert.equal(w.healingRate(s,u),5);tile.owner=1;w.relation(s,0,1).status='friend';assert.equal(w.healingRate(s,u),5);
  tile.owner=0;u.type='missionary';assert.equal(w.healingRate(s,u),0);u.type='warrior';u.owner=s.nations.length-1;assert.equal(w.healingRate(s,u),0);
});
test('siege requires every approach to be blocked, ranged units do not control adjacent tiles, and coast needs ships',()=>{
  const s=setup(),city=own(s);s.units=[];w.relation(s,0,1).status='war';const ns=w.neighbors(s,city.tile);
  for(const i of ns)Object.assign(s.tiles[i],{terrain:'grass',hills:false,feature:'',owner:0});
  w.spawn(s,1,'warrior',ns[0]);assert(!w.underSiege(s,city));
  ns.slice(1).forEach(i=>w.spawn(s,1,'archer',i));assert(w.underSiege(s,city),'occupation blocks supply even by ranged units');
  s.units=s.units.filter(u=>u.tile!==ns[3]);assert(!w.underSiege(s,city),'ranged neighbors exert no zone');s.tiles[ns[3]].terrain='mountain';assert(w.underSiege(s,city));
  s.tiles[ns[3]].terrain='water';assert(!w.underSiege(s,city),'land control cannot blockade coast');w.spawn(s,1,'galley',ns[3]);assert(w.underSiege(s,city));
});
test('scouts respect control zones, cavalry/civilians ignore them and embarked armies exert none',()=>{
  const s=setup(),city=own(s);s.units=[];w.relation(s,0,1).status='war';const ns=w.neighbors(s,city.tile),u=w.spawn(s,0,'scout',city.tile),enemy=w.spawn(s,1,'warrior',ns[0]);
  assert(!w.ignoresZone(u));assert(w.zone(s,u,city.tile));u.type='horse';assert(w.ignoresZone(u));u.type='settler';assert(w.ignoresZone(u));
  s.tiles[enemy.tile].terrain='water';assert(!w.zone(s,u,city.tile));
});
test('walls never regenerate, repair waits three turns, pauses on a new hit and survives saves',()=>{
  const s=setup(),city=own(s);city.buildings.push('walls');city.walls=40;city.hp=180;city.queue=[];s.units=s.units.filter(u=>u.owner!==s.nations.length-1);
  w.nextTurn(s);assert.equal(city.walls,40);assert.equal(city.hp,190);city.lastDamagedTurn=s.turn;
  assert(w.buildReason(s,city,'repairDefenses'));assert(!w.enqueue(s,city,'repairDefenses'));s.turn+=3;assert(w.enqueue(s,city,'repairDefenses'));
  const j=city.queue[0];assert.equal(w.jobCost(s,city,j),30);city.invested[w.jobKey(j)]=30;city.lastDamagedTurn=s.turn;
  w.nextTurn(s);assert.equal(city.walls,40);assert.equal(city.invested[w.jobKey(j)],30);assert(saves.valid(s));
  const loaded=saves.migrate(structuredClone(s));assert(loaded);const copy=own(loaded);loaded.turn+=3;w.nextTurn(loaded);assert.equal(copy.walls,100);assert.equal(copy.queue.length,0);assert(!copy.buildings.includes('repairDefenses'));assert(saves.valid(loaded));
});
test('a legal city attack restarts the defense repair cooldown; rejected attacks cannot mutate it',()=>{
  const s=setup(),city=s.cities.find(c=>c.owner===1),at=w.neighbors(s,city.tile)[0];s.units=[];
  Object.assign(s.tiles[at],{terrain:'grass',owner:-1});const u=w.spawn(s,0,'warrior',at);w.relation(s,0,1).status='war';city.buildings.push('walls');city.walls=50;
  assert(w.attack(s,u,city.tile));assert.equal(city.lastDamagedTurn,s.turn);assert(w.buildReason(s,city,'repairDefenses'));
  const before=JSON.stringify(s);assert(!w.attack(s,u,city.tile));assert.equal(JSON.stringify(s),before);
});
test('AI selects the same legal defense repair project rather than receiving free wall HP',()=>{
  const s=setup(),city=s.cities.find(c=>c.owner===1);s.turn=10;city.buildings.push('walls');city.walls=30;city.lastDamagedTurn=6;city.queue=[];
  w.computerTurn(s,1);assert.equal(city.queue[0].item,'repairDefenses');assert.equal(city.walls,30);assert(saves.valid(s));
});
test('new rest/repair fields validate strictly; absence preserves genuine old saves without rewriting them',()=>{
  const s=setup(),u=s.units.find(u=>u.owner===0),city=own(s);delete u.fortificationTurns;delete u.restingMoves;delete city.lastDamagedTurn;
  const before=JSON.stringify(s);assert(saves.valid(s));assert.equal(JSON.stringify(saves.migrate(s)),before);
  for(const mutate of [x=>x.units[0].fortificationTurns=3,x=>x.units[0].fortificationTurns=-1,x=>x.units[0].restingMoves=2,x=>{x.units[0].fortified=true;x.units[0].restingMoves=NaN;},x=>own(x).lastDamagedTurn=x.turn+1]) {const bad=structuredClone(s);mutate(bad);assert(!saves.valid(bad));}
});
function holy(s,owner=0) {
  const city=s.cities.find(c=>c.owner===owner),at=w.neighbors(s,city.tile)[0];
  s.units=s.units.filter(u=>u.tile!==at);
  Object.assign(s.tiles[at],{terrain:'grass',baseTerrain:'grass',feature:'',hills:false,resource:'',improvement:'',district:'holy',owner,territory:city.id});
  if(!city.buildings.includes('holy'))city.buildings.push('holy');
  return at;
}
function battle(seed=42,type='warrior') {
  const s=setup({seed}),at=own(s).tile,to=w.neighbors(s,at)[0];
  s.units=[];
  for(const i of [at,to])Object.assign(s.tiles[i],{terrain:'grass',feature:'',hills:false});
  for(const n of s.nations){n.policies=[null,null];n.government='chief';}
  const u=w.spawn(s,0,type,at),v=w.spawn(s,1,'warrior',to);
  w.relation(s,0,1).status='war';
  return {s,u,v,to};
}
test('district growth uses 77/61 denominators, max progress, speed and the spaceport exception',()=>{
  const s=setup(),n=s.nations[0];assert.equal(w.cost(s,'campus'),54);
  n.tech=c.techs.map(t=>t.id);assert.equal(w.cost(s,'campus'),540);assert.equal(w.cost(s,'aqueduct'),360);
  n.tech=[];n.civic=c.civics.map(t=>t.id);assert.equal(w.cost(s,'campus'),540);
  assert.equal(w.cost(s,'spaceport'),1800);s.options.speed='quick';assert.equal(w.cost(s,'campus'),360);assert.equal(w.cost(s,'spaceport'),1200);
});
test('district cost and location survive research, cancellation, resume, JSON roundtrip and completion',()=>{
  const s=setup(),city=own(s),n=s.nations[0];n.tech=['writing'];city.queue=[];
  const at=w.neighbors(s,city.tile)[0];s.tiles[at].terrain='grass';
  assert(w.enqueue(s,city,'campus',at));const job=city.queue[0],price=w.jobCost(s,city,job);
  assert.equal(price,Math.floor(54*(1+9/77)));city.invested[w.jobKey(job)]=7;
  n.tech=c.techs.map(t=>t.id);assert.equal(w.cost(s,'campus'),540);assert.equal(w.cost(s,'campus',city),price);
  city.queue=[];assert(!w.workedTiles(s,city).includes(at));assert(w.placementReason(s,city,'holy',at));
  assert(!w.enqueue(s,city,'campus',w.neighbors(s,city.tile)[1]));assert(w.enqueue(s,city,'campus',at));
  assert.equal(city.invested[w.jobKey(job)],7);assert.equal(w.jobCost(s,city,job),price);assert(saves.valid(s));
  const loaded=saves.migrate(JSON.parse(JSON.stringify(s)));assert(loaded);assert.equal(w.jobCost(loaded,own(loaded),own(loaded).queue[0]),price);
  city.invested[w.jobKey(job)]=price;s.continued=true;w.nextTurn(s);
  assert(city.buildings.includes('campus'));assert.equal(city.districtPlacements.campus,undefined);assert.equal(city.productionCosts[w.jobKey(job)],undefined);assert(saves.valid(s));
});
test('district discount needs completed/unlocked ratio, counts placed copies, refreshes on research',()=>{
  const s=setup(),n=s.nations[0],city=own(s),other=s.cities.find(c=>c.owner===1);
  other.owner=0;for(const t of s.tiles)if(t.territory===other.id)t.owner=0;
  city.buildings=['holy'];other.buildings=['holy'];city.pop=4;city.queue=[];
  n.tech=['astrology','writing'];assert.equal(w.districtDiscount(s,'campus'),1,'completion alone does not refresh the discount basis');
  n.research='pottery';w.advance(s,0,false,25);assert.equal(n.districtDiscountBasis,2);assert.equal(w.districtDiscount(s,'campus'),0.6);
  const at=w.neighbors(s,city.tile)[0];s.tiles[at].terrain='grass';assert(w.enqueue(s,city,'campus',at));city.queue=[];
  assert.equal(w.districtDiscount(s,'campus'),1,'paused construction remains a placed copy');
  assert.equal(w.districtDiscount(s,'aqueduct'),1);
});
test('legacy queues preserve base-price contracts and unchanged participant IDs',()=>{
  const s=setup(),city=own(s);delete s.options.cityStateCount;delete s.options.aiCount;
  delete city.productionCosts;delete city.districtPlacements;
  const at=w.neighbors(s,city.tile)[0];city.queue=[{item:'campus',tile:at}];city.invested[`campus:${at}`]=13;
  s.nations[0].tech=c.techs.map(t=>t.id);const raw=JSON.stringify(s);
  assert(saves.valid(s));const loaded=saves.migrate(JSON.parse(raw));assert(loaded);assert.equal(JSON.stringify(loaded),raw);
  assert.equal(w.jobCost(loaded,own(loaded),own(loaded).queue[0]),54);assert.equal(loaded.nations[5].kind,'barbarian');
});
test('combat preview is a read-only 24–36 HP range at equal strength; settlement is reproducible',()=>{
  const {s,u,v,to}=battle(),seed=s.seed;
  for(let i=0;i<10;i++){const p=w.combatPreview(s,u,to);assert.equal(p.damage,30);assert.equal(p.damageMin,24);assert.equal(p.damageMax,36);assert.equal(p.retaliationMin,24);assert.equal(p.retaliationMax,36);}
  assert.equal(s.seed,seed);const replay=structuredClone(s);assert(w.attack(s,u,to));assert(w.attack(replay,replay.units.find(x=>x.id===u.id),to));assert.deepEqual(replay,s);
  assert(v.hp>=64&&v.hp<=76);assert(u.hp>=64&&u.hp<=76);assert.notEqual(s.seed,seed);assert(saves.valid(s));
});
test('combat varies across persisted seeds, with no 90-HP cap or half-strength wound penalty',()=>{
  const samples=new Set();
  for(let i=1;i<=30;i++){const {s,u,v,to}=battle();s.seed=(i*918273645)>>>0;assert(w.attack(s,u,to));samples.add(100-v.hp);}
  assert(samples.size>=6);const {s,u,v,to}=battle(42,'tank');assert(w.combatPreview(s,u,to).damageMin>100);assert(w.attack(s,u,to));assert(!s.units.includes(v));
  const injured=battle();injured.u.hp=30;assert.equal(w.strength(injured.s,injured.u,1),13);
  w.relation(injured.s,0,1).status='peace';const seed=injured.s.seed;assert(!w.attack(injured.s,injured.u,injured.to));assert.equal(injured.s.seed,seed);
});
test('GS score includes cities, centers, palace, population, buildings, districts, religion and earned people',()=>{
  const s=setup(),city=own(s),n=s.nations[0];city.pop=7;city.buildings=['campus','library','pyramids'];
  n.tech=['pottery','mining'];n.civic=['laws'];n.greatPeopleEarned=2;n.eraScore=4;n.religion='Test';s.cities.find(c=>c.owner===1).religion=0;
  assert.deepEqual(w.scoreBreakdown(s,0),{civics:3,empire:18,greatPeople:10,religion:12,technologies:4,wonders:15,era:4});assert.equal(w.score(s,0),66);
});
test('equal scores use civic-first tiebreaking, not always the human owner',()=>{
  const s=setup();for(const n of s.nations){n.tech=[];n.civic=[];n.religion='';n.greatPeopleEarned=0;n.eraScore=0;}
  for(const city of s.cities){city.buildings=[];city.pop=1;}
  s.nations[0].tech=['pottery','mining','animals'];s.nations[1].civic=['laws','craft'];
  assert.equal(w.score(s,0),w.score(s,1));assert.deepEqual(w.scoreRanking(s),[1,0,2]);s.turn=500;w.checkVictory(s);assert.deepEqual(s.winner,{owner:1,type:'score'});
});
test('recruited great people relocate after both field and city attacks without releasing a religion slot',()=>{
  const {s,u,v,to}=battle(42,'tank');v.type='prophet';s.nations[1].prophetRecruited=true;
  assert(w.attack(s,u,to));assert(s.units.includes(v));assert.notEqual(v.tile,to);assert.equal(v.hp,100);assert.equal(v.moves,0);assert.equal(u.tile,to);assert(s.nations[1].prophetRecruited);assert(saves.valid(s));
  const other=battle();other.v.type='prophet';other.v.hp=1;other.s.nations[1].prophetRecruited=true;
  const city=own(other.s);city.walls=50;assert(w.cityAttack(other.s,city,other.to));
  assert(other.s.units.includes(other.v));assert.notEqual(other.v.tile,other.to);assert.equal(other.v.hp,100);assert.equal(other.v.moves,0);assert(saves.valid(other.s));
});
test('2–6 city states and 1–5 AI have deterministic, spaced, saveable starts; old two-state layout survives',()=>{
  for(const size of ['compact','standard'])for(let aiCount=1;aiCount<=5;aiCount++)for(let cityStateCount=2;cityStateCount<=6;cityStateCount++)for(let seed=1;seed<=4;seed++){
    const opts={size,aiCount,cityStateCount,seed,civilization:'random'},s=w.create(opts);
    assert(saves.valid(s),JSON.stringify(opts));assert.equal(s.cityStates.length,cityStateCount);assert.equal(s.nations.length,aiCount+cityStateCount+2);
    assert(w.canFound(s,s.units.find(u=>u.owner===0&&u.type==='settler')));assert.equal(s.cities.length,aiCount+cityStateCount);
    if(seed===1)assert.deepEqual(s,w.create(opts));
  }
  assert.equal(w.create().cityStates.length,3);assert.throws(()=>w.create({cityStateCount:1}));assert.throws(()=>w.create({cityStateCount:7}));
});
test('political philosophy is reachable by actual exploration of three city states, contact rewards are once-only',()=>{
  const s=setup({cityStateCount:3}),n=s.nations[0];n.met=[];s.units=[];
  for(const state of s.cityStates){for(const major of s.nations.filter(n=>n.kind==='major'))major.met=major.met.filter(id=>id!==state.owner);state.envoys.fill(0);
    const city=s.cities.find(c=>c.owner===state.owner);w.spawn(s,0,'scout',w.neighbors(s,city.tile)[0]);}
  w.reveal(s);assert(n.boosts.includes('philosophy'));assert.equal(s.cityStates.reduce((v,x)=>v+x.envoys[0],0),3);
  w.reveal(s);assert.equal(s.cityStates.reduce((v,x)=>v+x.envoys[0],0),3);
});
test('July 2020 envoy tiers apply to appropriate buildings and stop during war or after conquest',()=>{
  const s=setup(),city=own(s),state=s.cityStates[0];city.buildings=['campus','library','university','lab'];
  state.envoys=[1,0,0];assert.equal(cs.envoyBonus(s,city,'science'),2);
  state.envoys=[3,3,0];assert.equal(cs.envoyBonus(s,city,'science'),4);
  state.envoys=[6,6,0];assert.equal(cs.envoyBonus(s,city,'science'),7);const normal=w.yields(s,city).science;
  state.envoys[0]=0;assert.equal(normal-w.yields(s,city).science,7);state.envoys[0]=6;
  w.relation(s,0,state.owner).status='war';assert.equal(cs.envoyBonus(s,city,'science'),0);w.relation(s,0,state.owner).status='peace';
  s.cities.find(c=>c.owner===state.owner).owner=1;assert.equal(cs.envoyBonus(s,city,'science'),0);
});
test('industrial envoys apply only to eligible construction; Geneva/Brussels/Kumasi bonuses have real conditions',()=>{
  const s=setup({cityStateCount:3}),city=own(s),science=s.cityStates[0],culture=s.cityStates[1],industry=s.cityStates[2];city.buildings=['workshop','holy','campus'];
  const unit=w.productionRate(s,city,'warrior'),building=w.productionRate(s,city,'library');industry.envoys=[1,0,0];
  assert.equal(w.productionRate(s,city,'warrior'),unit);assert.equal(w.productionRate(s,city,'library')-building,2);
  science.envoys=[3,2,0];assert.equal(cs.suzerain(s,science),0);science.envoys=[3,3,0];assert.equal(cs.suzerain(s,science),null);
  const base=w.yields(s,city).science;science.envoys=[3,2,0];assert(Math.abs(w.yields(s,city).science-base*1.15)<1e-9);
  w.relation(s,0,1).status='war';assert.equal(w.yields(s,city).science,base);w.relation(s,0,1).status='peace';
  const dest=s.cities.find(c=>c.owner===culture.owner),normal=w.tradeYield(s,city,dest);culture.envoys=[3,0,0];const bonus=w.tradeYield(s,city,dest);
  assert.equal(bonus.gold-normal.gold,2);assert.equal(bonus.culture-normal.culture,4);
  const before=w.productionRate(s,city,'pyramids');industry.envoys=[3,0,0];assert.equal(w.productionRate(s,city,'pyramids'),before*1.15);
});
test('suzerain city states join wars without erasing envoys; direct declaration erases aggressor envoys',()=>{
  const s=setup(),state=s.cityStates[0];state.envoys=[3,1,0];w.relation(s,0,1).status='war';assert(w.atWar(s,state.owner,1));assert(!w.atWar(s,state.owner,0));
  const enemyCity=s.cities.find(c=>c.owner===1);assert.equal(cs.envoyBonus(s,enemyCity,'science'),0,'automatic enemy loses yields even though its envoy is retained');assert.equal(state.envoys[1],1);
  w.relation(s,0,1).status='peace';assert(!w.atWar(s,state.owner,1));s.nations[0].met.push(state.owner);
  assert(w.diplomacy(s,state.owner,'war'));assert.equal(state.envoys[0],0);assert.equal(state.envoys[1],1);
});
test('influence rates and overflow are tier-specific, speed-scaled, and persist on government changes',()=>{
  const s=setup(),n=s.nations[0];assert.deepEqual(cs.influenceRate(n),{perTurn:1,threshold:100,reward:1});
  n.government='monarchy';n.civic.push('divineright');n.policies=c.governments.find(g=>g.id==='monarchy').slots.map(()=>null);
  assert.deepEqual(cs.influenceRate(n),{perTurn:7.5,threshold:150,reward:2});n.influence=149;n.envoys=0;
  w.nextTurn(s);assert.equal(n.influence,6.5);assert.equal(n.envoys,2);assert(saves.valid(s));
});
test('civic completion awards only the source-listed envoys, once; diplomatic service awards no envoys',()=>{
  const golden={mysticism:1,militarytraining:1,theology:1,mercenaries:1,navaltradition:1,colonialism:2,naturalhistory:2,operaballet:2,scorchedearth:2,conservation:3,culturalheritage:3,nearfuturegovernance:3,globalwarmingmitigation:3};
  for(const d of c.civics){
    const s=setup(),n=s.nations[0];n.civic=c.civics.filter(row=>row.id!==d.id).map(row=>row.id);n.culture=d.id;n.envoys=0;n.policies=[null,null];
    w.advance(s,0,true,w.researchCost(s,n,d));assert(n.civic.includes(d.id));assert.equal(n.envoys,golden[d.id]??0,d.id);assert(saves.valid(s));
    w.advance(s,0,true,0);assert.equal(n.envoys,golden[d.id]??0,'completed civic cannot award twice');
  }
});
test('pantheons are exclusive; fertility is a one-time builder and +10% growth, craftsmen applies only to improved resources',()=>{
  const s=setup(),n=s.nations[0],city=own(s);n.faith=25;const before=w.yields(s,city),builders=s.units.filter(u=>u.type==='builder').length;
  assert(w.pantheon(s,'fertility'));assert.equal(n.faith,0);assert.equal(s.units.filter(u=>u.type==='builder').length,builders+1);
  const after=w.yields(s,city);assert.equal(after.food,before.food);assert(Math.abs(after.growing-before.growing*1.1)<1e-9);
  n.faith=25;assert(!w.pantheon(s,'fertility'));s.nations[1].faith=25;assert(!w.pantheon(s,'fertility',1));
  const t=s.tiles[w.neighbors(s,city.tile)[0]];Object.assign(t,{resource:'iron',improvement:'mine',pillaged:false});n.tech.push('bronze');n.pantheon='';const plain=w.tileYield(s,t);n.pantheon='crafts';const bonus=w.tileYield(s,t);
  assert.equal(bonus.production-plain.production,1);assert.equal(bonus.faith-plain.faith,1);t.pillaged=true;assert.equal(w.tileYield(s,t).faith,0);t.pillaged=false;t.improvement='farm';assert.equal(w.tileYield(s,t).faith,0);
});
test('prophets require recruitment, reserved religion slots, a pantheon and physical holy-site activation; faith is not charged',()=>{
  const s=setup(),n=s.nations[0],at=holy(s);n.great.prophet=60;n.faith=25;
  assert(w.recruitProphet(s));assert.equal(n.great.prophet,0);assert.equal(n.greatPeopleEarned,1);assert.equal(s.units.find(u=>u.type==='prophet').tile,at);
  assert(!w.foundReligion(s));assert(w.pantheon(s,'crafts'));assert.equal(n.faith,0);
  assert(!w.foundReligion(s,0,['choral','feed']),'founding cannot select two follower beliefs and produce an invalid save');assert(saves.valid(s));
  assert(w.foundReligion(s,0,['choral','tithe']));assert.equal(n.faith,0);assert.deepEqual(n.beliefs,['choral','tithe']);assert(!s.units.some(u=>u.type==='prophet'));assert(!w.recruitProphet(s));assert(saves.valid(s));
  const other=s.nations[1];holy(s,1);other.faith=25;other.great.prophet=60;assert(w.pantheon(s,'sky',1));assert(w.recruitProphet(s,1));
  assert(!w.foundReligion(s,1,['choral','pilgrimage']),'a taken belief cannot be stolen');assert(w.foundReligion(s,1,['feed','pilgrimage']));assert(saves.valid(s));
  assert(w.buildReason(s,own(s),'prophet'));assert(!w.purchase(s,own(s),'prophet'));assert(!w.enqueue(s,own(s),'prophet'));
});
test('religion slots reserve on recruitment, not just on founding; six players cannot exceed the compact limit',()=>{
  const s=setup({aiCount:5});
  for(let owner=0;owner<6;owner++){holy(s,owner);s.nations[owner].great.prophet=60;assert.equal(w.recruitProphet(s,owner),owner<3);}
  assert.equal(s.units.filter(u=>u.type==='prophet').length,3);assert(saves.valid(s));
});
test('follower beliefs benefit converted foreign cities; founder yields belong to the founder, not the city owner',()=>{
  const s=setup(),n=s.nations[0],city=own(s);holy(s);city.buildings=['holy','shrine','temple'];city.religion=0;n.religion='Test';n.beliefs=[];
  const before=w.yields(s,city);n.beliefs=['choral','tithe'];const after=w.yields(s,city);
  assert.equal(after.culture-before.culture,6);assert.equal(w.totals(s).gold-after.gold,3);
  n.beliefs=['feed','tithe'];const fed=w.yields(s,city);assert.equal(fed.food-before.food,6);assert.equal(fed.housing-before.housing,4);
  const foreign=s.cities.find(c=>c.owner===1);foreign.religion=0;foreign.buildings=['holy','shrine','temple'];const without=w.yields(s,foreign);foreign.religion=-1;const unconverted=w.yields(s,foreign);assert.equal(without.food-unconverted.food,6);
  foreign.religion=0;assert.equal(faith.founderYield(s,0).gold,6);assert.equal(faith.founderYield(s,1).gold,0);
});
test('remaining belief effects use actual adjacency, district count, wonders, routes and followers',()=>{
  const s=setup(),city=own(s),n=s.nations[0],at=holy(s),foreign=s.cities.find(c=>c.owner===1);
  n.religion='Test';city.religion=0;city.buildings=['holy','shrine','temple'];n.beliefs=[];
  const mountain=w.neighbors(s,at).find(i=>i!==city.tile);Object.assign(s.tiles[mountain],{terrain:'mountain',baseTerrain:'mountain',feature:'',hills:false});
  const plain=w.yields(s,city);n.beliefs=['work'];assert.equal(w.yields(s,city).production-plain.production,w.adjacency(s,'holy',at));
  n.civic.push('theology');n.policies=[null,'scripture'];n.beliefs=[];const scripture=w.yields(s,city);n.beliefs=['work'];assert.equal(w.yields(s,city).production-scripture.production,2*w.adjacency(s,'holy',at));
  s.tiles[at].pillaged=true;n.beliefs=[];const pillaged=w.yields(s,city);n.beliefs=['work'];assert.equal(w.yields(s,city).production,pillaged.production);n.beliefs=['feed'];assert.equal(w.yields(s,city).housing,pillaged.housing);s.tiles[at].pillaged=false;
  city.buildings.push('campus');n.beliefs=[];const amenity=w.amenities(s,city);n.beliefs=['zen'];assert.equal(w.amenities(s,city),amenity+1);
  city.buildings.push('pyramids');n.beliefs=[];const wonder=w.yields(s,city);n.beliefs=['divine'];assert.equal(w.yields(s,city).faith-wonder.faith,4);
  n.beliefs=[];const trade=w.tradeYield(s,city,foreign);n.beliefs=['community'];assert.equal(w.tradeYield(s,city,foreign).gold-trade.gold,6);n.beliefs=[];const domestic=w.tradeYield(s,city,city);n.beliefs=['community'];assert.equal(w.tradeYield(s,city,city).gold,domestic.gold);
  city.buildings.push('theater');n.beliefs=['lay'];assert.equal(faith.founderYield(s,0).faith,1);assert.equal(faith.founderYield(s,0).culture,1);
  n.beliefs=['sacred'];for(const key of ['science','culture','gold','faith'])assert.equal(faith.founderYield(s,0)[key],2);
  city.pop=8;city.pressure=[100,0,0];n.beliefs=['dialogue'];assert.equal(faith.founderYield(s,0).science,2);n.beliefs=['church'];assert.equal(faith.founderYield(s,0).culture,2);
});
test('new save fields reject corruption rather than bypassing old validation',()=>{
  const s=setup();
  for(const mutate of [x=>x.nations[0].influence=NaN,x=>x.nations[0].prophetRecruited='yes',x=>x.nations[0].beliefs=['missing'],x=>x.nations[0].greatPeopleEarned=-1,x=>x.nations[0].eraScore=0.5,x=>x.cities[0].productionCosts={'campus:0':-5},x=>x.cities[0].districtPlacements={fake:0},x=>x.options.cityStateCount=3,x=>x.cities[0].queue=[{item:'prophet',tile:-1}],x=>x.cities[0].invested['prophet:-1']=1,x=>x.cities[0].productionCosts={'prophet:-1':1}]){
    const bad=structuredClone(s);mutate(bad);assert(!saves.valid(bad));assert.equal(saves.migrate(bad),null);
  }
  const duplicate=structuredClone(s);duplicate.nations[0].religion='One';duplicate.nations[1].religion='Two';
  duplicate.nations[0].beliefs=['choral','tithe'];duplicate.nations[1].beliefs=['choral','pilgrimage'];
  assert(!saves.valid(duplicate),'a globally exclusive belief cannot appear in two religions');
  duplicate.nations[1].beliefs=['feed','pilgrimage'];assert(saves.valid(duplicate));
});
test('new six-state campaigns preserve save invariants and seeded replay through 100 turns',()=>{
  for(const aiCount of [1,5]){
    const s=setup({aiCount,cityStateCount:6,difficulty:'hard'}),replay=structuredClone(s);s.continued=true;replay.continued=true;
    for(let turn=0;turn<100;turn++){w.nextTurn(s);w.nextTurn(replay);assert(saves.valid(s),`AI ${aiCount}, turn ${s.turn}`);assert.deepEqual(replay,s);}
  }
});
function scientificSite(s,kind='campus',owner=0,keep=-1) {
  const city=s.cities.find(c=>c.owner===owner),at=w.neighbors(s,city.tile)[0];
  s.units=s.units.filter(u=>u.tile!==at || u.id===keep);
  Object.assign(s.tiles[at],{terrain:'grass',baseTerrain:'grass',feature:'',hills:false,resource:'',improvement:'',district:kind,owner,territory:city.id,pillaged:false});
  if(!city.buildings.includes(kind))city.buildings.push(kind);
  return at;
}
function scientistFixture(id,owner=0) {
  const s=setup(),order=gp.scientistOrder(s),idx=order.findIndex(p=>p.id===id);
  const priorOwner=owner===0?1:0,city=s.cities.find(c=>c.owner===owner);
  s.scientistRecruits=order.slice(0,idx).map(p=>({person:p.id,owner:priorOwner}));s.nations[priorOwner].greatPeopleEarned=idx;
  const p=gp.scientistById(id),at=p.site!=='land'?scientificSite(s,p.site,owner):city.tile;
  s.nations[owner].great.science=w.scientistCost(s);assert(w.recruitScientist(s,owner));
  const u=s.units.find(u=>u.type==='scientist');
  assert.equal(u.person,id);
  u.tile=at;
  return {s,u,n:s.nations[owner],city};
}
test('scientist pool is shared, seed-stable and read-only; era base prices, overflow and exhaustion are exact',()=>{
  const s=setup(),snapshot=structuredClone(s),order=gp.scientistOrder(s);
  for(let i=0;i<20;i++){assert.equal(w.currentScientist(s).id,order[0].id);assert.equal(w.scientistCost(s),60);}
  assert.deepEqual(s,snapshot);assert.equal(new Set(order.map(p=>p.id)).size,9);
  s.nations[0].great.science=59;assert(!w.recruitScientist(s));assert.deepEqual(s.scientistRecruits,undefined);
  s.nations[0].great.science=65;assert(w.recruitScientist(s));assert.equal(s.nations[0].great.science,5);assert.equal(s.nations[0].greatPeopleEarned,1);assert(s.nations[0].boosts.includes('education'));
  assert.equal(s.units.find(u=>u.type==='scientist').moves,4);assert.equal(s.units.find(u=>u.type==='scientist').charges,1);
  s.nations[1].great.science=60;assert(w.recruitScientist(s,1));assert.equal(s.scientistRecruits[1].person,order[1].id);assert.equal(s.scientistRecruits[1].owner,1);assert(saves.valid(s));
  const replay=structuredClone(s);assert.equal(w.currentScientist(replay).id,order[2].id);
  for(const p of order.slice(2)){
    assert.equal(w.scientistCost(s),[0,60,120,240][p.era]);s.nations[0].great.science=w.scientistCost(s);assert(w.recruitScientist(s));
    const u=s.units.find(v=>v.person===p.id);u.tile=scientificSite(s,p.site==='holy'?'holy':'campus',0,u.id);assert(w.activateScientist(s,u),p.id);assert(saves.valid(s));
  }
  assert.equal(w.currentScientist(s),undefined);assert.equal(w.scientistCost(s),0);assert(!w.recruitScientist(s));
  const quick=setup({speed:'quick'});assert.equal(w.scientistCost(quick),40);quick.scientistRecruits=gp.scientistOrder(quick).slice(0,3).map(p=>({person:p.id,owner:0}));assert.equal(w.scientistCost(quick),80);
});
test('scientist recruitment and activation reject invalid owners, blocked spawns, spent movement, foreign and pillaged districts without mutation',()=>{
  const {s,u}=scientistFixture('hypatia');u.moves=0;const before=structuredClone(s);assert(!w.activateScientist(s,u));assert.deepEqual(s,before);
  u.moves=3;s.tiles[u.tile].owner=1;assert(!w.activateScientist(s,u));s.tiles[u.tile].owner=0;s.tiles[u.tile].pillaged=true;assert(!w.activateScientist(s,u));s.tiles[u.tile].pillaged=false;
  assert(w.activateScientist(s,u));const after=structuredClone(s);assert(!w.activateScientist(s,u));assert.deepEqual(s,after);assert(saves.valid(s));
  const full=setup();full.nations[0].great.science=60;const city=own(full);full.units=[];
  for(const at of [city.tile,...w.neighbors(full,city.tile)])w.spawn(full,0,'warrior',at);
  const blocked=structuredClone(full);assert(!w.recruitScientist(full));assert.deepEqual(full,blocked);assert(!w.recruitScientist(full,full.cityStates[0].owner));assert(!w.recruitScientist(full,99));
});
test('Euclid, Aryabhata, Khayyam and Chatelet grant only distinct uncompleted/unboosted era-matching research, with deterministic replay',()=>{
  for(const [id,techCount,civicCount,allowed] of [['euclid',2,0,[1,2]],['aryabhata',3,0,[1,2]],['omar_khayyam',2,1,[2,3]],['emilie_du_chatelet',3,0,[3,4]]]){
    const {s,u,n}=scientistFixture(id),before=[...n.boosts],replay=structuredClone(s);
    assert(w.activateScientist(s,u));assert(w.activateScientist(replay,replay.units.find(v=>v.id===u.id)));assert.deepEqual(replay,s);
    const added=n.boosts.filter(v=>!before.includes(v)),tech=added.filter(id=>c.techs.some(t=>t.id===id)),civic=added.filter(id=>c.civics.some(t=>t.id===id));
    assert.equal(tech.length,techCount,id);assert.equal(civic.length,civicCount,id);assert(tech.every(id=>allowed.includes(c.techs.find(t=>t.id===id).era)));assert(civic.every(id=>allowed.includes(c.civics.find(t=>t.id===id).era)));
    if(id==='euclid')assert(tech.includes('mathematics'));
    assert(saves.valid(s));
  }
  const {s,u,n}=scientistFixture('aryabhata');n.boosts=c.techs.filter(t=>t.boost).map(t=>t.id);const seed=s.seed;assert(w.activateScientist(s,u));assert.equal(s.seed,seed,'an exhausted eligible set must not draw random numbers');
});
test('Hypatia/Newton build instantly, clear just the matching queues, and apply permanent national bonuses to future libraries/universities',()=>{
  for(const [id,buildings,bonus] of [['hypatia',['library'],1],['isaac_newton',['library','university'],2]]){
    const {s,u,n,city}=scientistFixture(id);city.queue=[{item:'library',tile:-1},{item:'warrior',tile:-1}];city.invested['library:-1']=20;city.invested['warrior:-1']=10;city.productionCosts={'library:-1':90,'warrior:-1':40};
    assert(w.activateScientist(s,u));assert(buildings.every(id=>city.buildings.includes(id)));assert.deepEqual(city.queue,[{item:'warrior',tile:-1}]);assert.equal(city.invested['warrior:-1'],10);assert.equal(city.invested['library:-1'],undefined);assert.equal(city.productionCosts['library:-1'],undefined);
    const withEffect=w.yields(s,city).science;n.scientistEffects=[];assert.equal(withEffect-w.yields(s,city).science,bonus);n.scientistEffects=[id];assert(saves.valid(s));
    const other=s.cities.find(c=>c.owner===1);other.buildings.push('campus',...buildings);other.owner=0;s.tiles[other.tile].owner=0;const current=w.yields(s,other).science;n.scientistEffects=[];assert.equal(current-w.yields(s,other).science,bonus,'newly acquired buildings gain national bonus');
  }
});
test('Hildegard changes only her Holy Site adjacency, follows policy doubling, survives capture and stops while pillaged',()=>{
  const {s,u,n,city}=scientistFixture('hildegard_of_bingen'),at=u.tile;
  for(const i of w.neighbors(s,at).slice(0,2)){s.tiles[i].terrain='mountain';s.tiles[i].feature='';}
  const before=w.yields(s,city).science,adj=w.adjacency(s,'holy',at),faith=n.faith;assert(w.activateScientist(s,u));assert.equal(n.faith-faith,100);assert.equal(w.yields(s,city).science-before,adj);
  n.civic.push('theology');n.policies=[null,'scripture'];city.hildegard=false;const plain=w.yields(s,city).science;city.hildegard=true;assert.equal(w.yields(s,city).science-plain,adj*2);
  s.tiles[at].pillaged=true;const pillaged=w.yields(s,city).science;city.hildegard=false;assert.equal(w.yields(s,city).science,pillaged);
  s.tiles[at].pillaged=false;city.hildegard=true;city.owner=1;s.tiles[at].owner=1;s.tiles[city.tile].owner=1;const captured=w.yields(s,city).science;city.hildegard=false;assert.equal(captured-w.yields(s,city).science,adj,'district modifier belongs to the district, not the former owner');
});
test('Galileo settles 250 science per adjacent mountain, speed-scaled, on land without requiring a campus',()=>{
  for(const speed of ['normal','quick']){
    const {s,u,n}=scientistFixture('galileo_galilei');s.options.speed=speed;
    const ns=w.neighbors(s,u.tile);for(const i of ns){s.tiles[i].terrain='grass';}for(const i of ns.slice(0,3))s.tiles[i].terrain='mountain';
    const expected=structuredClone(s);w.advance(expected,0,false,750*w.speedMultiplier(s));assert.equal(w.scientistReason(s,u),'');assert(w.activateScientist(s,u));
    assert.deepEqual(n.tech,expected.nations[0].tech);assert.deepEqual(n.researchProgress,expected.nations[0].researchProgress);assert(saves.valid(s));
  }
});
test('Zahrawi passive/retired healing adds 20 nearby or 5 land HP only when eligible for normal healing',()=>{
  const {s,u,n}=scientistFixture('abu_al_qasim_al_zahrawi');const at=w.neighbors(s,u.tile).find(i=>!s.units.some(v=>v.tile===i)&&s.tiles[i].terrain!=='mountain'&&s.tiles[i].terrain!=='water');
  assert.notEqual(at,undefined);s.tiles[at].owner=0;const wounded=w.spawn(s,0,'warrior',at);wounded.hp=40;w.nextTurn(s);assert.equal(wounded.hp,75);
  wounded.hp=40;wounded.acted=true;w.nextTurn(s);assert.equal(wounded.hp,40,'no healing after acting');
  const before=[...n.boosts];assert(w.activateScientist(s,u));assert.equal(n.boosts.filter(id=>!before.includes(id)&&c.techs.some(t=>t.id===id)).length,1);
  wounded.hp=40;w.nextTurn(s);assert.equal(wounded.hp,60);assert(saves.valid(s));
});
test('science point sources include four active campus components and Oracle +2, not a multiplier; enlightenment needs three actual recruits',()=>{
  const s=setup(),city=own(s),n=s.nations[0],at=scientificSite(s);city.buildings.push('library','university','lab','oracle');
  assert.equal(w.scientistPoints(s,city),6);n.government='republic';assert(Math.abs(w.scientistPoints(s,city)-6.9)<1e-9);n.government='chief';s.tiles[at].pillaged=true;assert.equal(w.scientistPoints(s,city),0);
  const ruined=w.yields(s,city).science;city.buildings=city.buildings.filter(id=>!['library','university','lab'].includes(id));assert.equal(w.yields(s,city).science,ruined,'pillaged campus suppresses building science');
  n.greatPeopleEarned=99;w.nextTurn(s);assert(!n.boosts.includes('theenlightenment'),'legacy generic rewards cannot satisfy the actual recruitment condition');
  for(let i=0;i<3;i++){n.great.science=w.scientistCost(s);assert(w.recruitScientist(s));assert.equal(n.boosts.includes('theenlightenment'),i===2);}
  assert(saves.valid(s));
});
test('scientist saves preserve legacy points and reject duplicate people, missing/foreign recruitment, fake effects and queues',()=>{
  const old=setup();old.nations[0].great.science=79;delete old.scientistRecruits;assert(saves.valid(old));assert.deepEqual(saves.migrate(old),old);
  const {s,u}=scientistFixture('hypatia');assert(saves.valid(s));assert.deepEqual(saves.migrate(structuredClone(s)),s);
  for(const mutate of [x=>x.units.find(v=>v.id===u.id).person='missing',x=>delete x.scientistRecruits,x=>x.scientistRecruits[0].owner=99,x=>x.scientistRecruits.reverse(),x=>x.nations[0].scientistEffects=['isaac_newton'],x=>x.cities[0].hildegard=true,x=>x.cities[0].queue=[{item:'scientist',tile:-1}],x=>{const copy={...x.units.find(v=>v.id===u.id),id:x.next++,tile:w.neighbors(x,own(x).tile)[2]};x.units=x.units.filter(v=>v.tile!==copy.tile);x.units.push(copy);}]){
    const bad=structuredClone(s);mutate(bad);assert(!saves.valid(bad));assert.equal(saves.migrate(bad),null);
  }
  assert(w.activateScientist(s,u));assert(saves.valid(s));const duplicate=structuredClone(s);duplicate.nations[0].scientistEffects.push('hypatia');assert(!saves.valid(duplicate));
});
test('AI competes for scientists and activates named abilities instead of generic science rewards',()=>{
  const s=setup(),n=s.nations[1],at=scientificSite(s,'campus',1);n.great.science=60;w.computerTurn(s,1);assert.equal(s.scientistRecruits?.[0].owner,1);
  const u=s.units.find(u=>u.type==='scientist'&&u.owner===1);if(u){u.tile=at;u.moves=3;w.computerTurn(s,1);}
  assert.equal(n.scientistEffects?.[0],gp.scientistOrder(s)[0].id);assert(saves.valid(s));
});
test('a named scientist survives capture by relocation without duplicating recruitment or losing its unused ability',()=>{
  const {s,u}=scientistFixture('hypatia'),target=u.tile,from=w.neighbors(s,target).find(i=>i!==own(s).tile&&s.tiles[i].city<0);
  s.units=[u];Object.assign(s.tiles[from],{terrain:'grass',feature:'',hills:false});u.hp=1;
  const enemy=w.spawn(s,1,'tank',from);w.relation(s,0,1).status='war';const recruits=structuredClone(s.scientistRecruits);
  assert(w.attack(s,enemy,target));assert(s.units.includes(u));assert.notEqual(u.tile,target);assert.equal(u.person,'hypatia');assert.equal(u.charges,1);assert.equal(u.moves,0);assert.equal(u.hp,100);assert.deepEqual(s.scientistRecruits,recruits);assert(saves.valid(s));
});
test('AI Galileo does not spend his ability halfway to the best mountain site',()=>{
  const {s,u,n,city}=scientistFixture('galileo_galilei',1);s.units=[u];
  for(const t of s.tiles){if(t.city<0)Object.assign(t,{terrain:'grass',feature:'',hills:false,road:false,owner:-1,territory:-1,district:'',improvement:''});}
  const target=s.tiles.findIndex((t,i)=>t.city<0 && w.distance(t,s.tiles[u.tile])>=8 && w.neighbors(s,i).filter(k=>s.tiles[k].city<0).length>=3);assert(target>=0);
  Object.assign(s.tiles[target],{owner:1,territory:city.id});for(const i of w.neighbors(s,target).filter(k=>s.tiles[k].city<0).slice(0,3))s.tiles[i].terrain='mountain';
  u.moves=1;w.computerTurn(s,1);assert(s.units.includes(u));assert(!n.scientistEffects?.includes('galileo_galilei'));assert.notEqual(u.tile,target);
  for(let turn=0;turn<10&&s.units.includes(u);turn++){u.moves=4;w.computerTurn(s,1);}
  assert(n.scientistEffects?.includes('galileo_galilei'));assert(saves.valid(s));
});
console.log(`\n${passed} additional rule regressions passed. This does not certify 80%/90% fidelity.`);
