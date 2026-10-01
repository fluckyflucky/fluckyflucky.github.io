import type { State } from './model';
import { techs, civics, itemMap, governments } from './catalog';
// Unsupported systems never trigger a substitute condition. Release audit lists them.
export const supportedBoosts = new Set([
  'defensivetactics', // Event-driven: only the target of a successful declaration.
  'theenlightenment',
  'irrigation','sailing','archery','wheel','masonry','writing','astrology','bronze','engineering','currency','construction','ironworking','horseback','mathematics','celestialnavigation','shipbuilding','castles','buttress','machinery','education','militaryengineering','stirrups','apprentice','siegetactics','squarerigging','metalcasting','massproduction','astronomy','banking','printing','cartography','industry','economics','scientifictheory','sanitation','flight','steel','computers','plastics','composites','robotics',
  'empire','stateworkforce','craft','military','mysticism','militarytraining','recordedhistory','theology','drama','gamesrecreation','philosophy','feudal','guilds','mercenaries','divineright','civilservice','medievalfaires','reformedchurch','urbanization','operaballet','civilengineering','colonialism','media','nuclearprogram','communism','spacerace','professionalsports','coldwar','socialmedia','synthetictechnocracy','humanism',
]);
export function satisfiedBoosts(s: State, owner: number): string[] {
  const n=s.nations[owner], cities=s.cities.filter(c=>c.owner===owner), tiles=s.tiles.filter(t=>t.owner===owner), units=s.units.filter(u=>u.owner===owner);
  const built=(id:string,count=1)=>cities.filter(c=>c.buildings.includes(id)).length>=count;
  const unit=(id:string,count=1)=>units.filter(u=>u.type===id).length>=count;
  const improved=(kind:string,count=1)=>tiles.filter(t=>t.improvement===kind && !t.pillaged).length>=count;
  const districts=new Set(cities.flatMap(c=>c.buildings.filter(id=>itemMap[id]?.kind==='district' && !['aqueduct','spaceport','neighborhood'].includes(id))));
  const tests: Record<string,boolean> = {
    irrigation:tiles.some(t=>t.improvement==='farm' && t.resource==='wheat' && !t.pillaged),
    wheel:tiles.some(t=>['mine','quarry'].includes(t.improvement) && !!t.resource && !t.pillaged),
    masonry:improved('quarry'), engineering:built('walls'),
    currency:s.routes.some(r=>r.owner===owner), construction:built('watermill'),
    ironworking:tiles.some(t=>t.resource==='iron' && t.improvement==='mine' && !t.pillaged),
    horseback:improved('pasture'), mathematics:districts.size>=3,
    celestialnavigation:tiles.filter(t=>t.terrain==='water' && t.resource && t.improvement && !t.pillaged).length>=2,
    shipbuilding:unit('galley',2), castles:(governments.find(g=>g.id===n.government)?.slots.length ?? 0)>=6,
    buttress:cities.some(c=>c.buildings.some(id=>itemMap[id]?.kind==='wonder' && (itemMap[id].era ?? -1)>=1)),
    machinery:unit('archer',3), militaryengineering:built('aqueduct'),
    stirrups:n.civic.includes('feudal'), apprentice:improved('mine',3), siegetactics:unit('catapult',2), metalcasting:unit('crossbow',2),
    massproduction:improved('lumber'),
    astronomy:cities.some(c=>c.buildings.includes('university') && s.tiles.some(t=>t.territory===c.id && t.district==='campus' && s.tiles.some(m=>m.terrain==='mountain' && Math.max(Math.abs(m.q-t.q),Math.abs(m.r-t.r),Math.abs((m.q+m.r)-(t.q+t.r)))===1))),
    banking:n.civic.includes('guilds'), printing:built('university',2), cartography:built('harbor',2), industry:built('workshop',2),
    economics:built('bank',2), scientifictheory:n.civic.includes('theenlightenment'), sanitation:built('neighborhood',2),
    flight:cities.some(c=>c.buildings.some(id=>itemMap[id]?.kind==='wonder' && (itemMap[id].era ?? -1)>=4)),
    steel:improved('mine') && tiles.some(t=>t.resource==='coal' && t.improvement==='mine' && !t.pillaged) && unit('ironclad'),
    computers:(governments.find(g=>g.id===n.government)?.slots.length ?? 0)>=8,
    plastics:improved('oilwell'), composites:unit('tank',3), robotics:n.civic.includes('globalization'),
    empire:cities.reduce((a,c)=>a+c.pop,0)>=6, stateworkforce:districts.size>0, craft:tiles.filter(t=>t.improvement && !t.pillaged).length>=3,
    mysticism:!!n.pantheon, militarytraining:built('encampment'), recordedhistory:built('campus',2), theology:!!n.religion,
    drama:cities.some(c=>c.buildings.some(id=>itemMap[id]?.kind==='wonder')), gamesrecreation:n.tech.includes('construction'),
    philosophy:n.met.filter(o=>s.nations[o]?.kind==='state').length>=3,
    feudal:improved('farm',6), guilds:built('market',2), mercenaries:units.filter(u=>itemMap[u.type]?.strength && itemMap[u.type]?.domain!=='sea').length>=8,
    divineright:built('temple',2), civilservice:cities.some(c=>c.pop>=10), medievalfaires:s.routes.filter(r=>r.owner===owner).length>=4,
    reformedchurch:!!n.religion && s.cities.filter(c=>c.religion===owner).length>=6, urbanization:cities.some(c=>c.pop>=15), operaballet:built('museum'),
    civilengineering:districts.size>=7, colonialism:n.tech.includes('astronomy'), media:n.tech.includes('radio'), nuclearprogram:built('lab'),
    communism:built('factory',3), spacerace:built('spaceport'), professionalsports:built('entertainment',2), coldwar:n.tech.includes('nuclearfission'),
    socialmedia:n.tech.includes('telecommunications'), synthetictechnocracy:n.tech.includes('robotics'),
    // Count actual recruited units, not legacy generic culture rewards.
    theenlightenment:(s.scientistRecruits?.filter(r=>r.owner===owner).length??0)+Number(!!n.prophetRecruited)>=3,
  };
  return [...techs,...civics].filter(r=>r.boost && tests[r.id]).map(r=>r.id);
}
