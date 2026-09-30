import { moduleUrl } from './civilization-test-module.mjs';
const c=await import(moduleUrl('src/games/civilization/catalog.ts')),
  ref=await import(moduleUrl('src/games/civilization/research-reference.ts')),
  research=await import(moduleUrl('src/games/civilization/research.ts')),
  boost=await import(moduleUrl('src/games/civilization/boosts.ts')),
  readiness=await import(moduleUrl('src/games/civilization/release-readiness.ts'));
const results=[['Technology data',c.techs.length,77],['Civic data',c.civics.length,61],['Government slot data',c.governments.length,13]];
console.log('Gathering Storm alignment audit (data presence is NOT gameplay fidelity)');
for(const [name,actual,expected] of results) console.log(`${name}: ${actual}/${expected} (${Math.floor(actual/expected*100)}%)`);
console.log(`Playable policy subset: ${c.policies.length}; full policy coverage is not claimed.`);
for(const g of c.governments.filter(g=>g.pending))console.log(`Partial government — ${g.name}: ${g.pending}`);
const unsupported=ref.researchReference.filter(r=>r.boost && !boost.supportedBoosts.has(research.researchId(r.id)));
console.log(`Boost conditions not implemented: ${unsupported.length}/${ref.researchReference.filter(r=>r.boost).length}`);
for(const r of unsupported) console.log(`  ${r.name}: ${r.boost}`);
const lowCoverage=results.some(([,actual,expected])=>actual/expected<0.9);
for(const blocker of readiness.releaseBlockers)console.error('BLOCK: '+blocker);
const failed=lowCoverage || unsupported.length/ref.researchReference.filter(r=>r.boost).length>0.1 || readiness.releaseBlockers.length>0;
console.log(failed?'Release review FAILED — do not push.':'Automated alignment gate passed. Manual browser/gameplay review still required.');
process.exitCode=failed?1:0;
