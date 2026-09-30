import assert from 'node:assert/strict';

// Refresh factual fields only. History, quotations and original art are not imported.
const base = 'https://www.civilopedia.net/zh-CN/gathering-storm/governments/';
const governmentIds = {
  chief: 'chiefdom', autocracy: 'autocracy', republic: 'classical_republic',
  oligarchy: 'oligarchy', merchant: 'merchant_republic', monarchy: 'monarchy',
  theocracy: 'theocracy', democracy: 'democracy', communist: 'communism',
  fascism: 'fascism', digital: 'digital_democracy', corporate: 'corporate_libertarianism',
  synthetic: 'synthetic_technocracy',
};
const policyIds = {
  planning:'urban_planning', discipline:'discipline', labor:'corvee', agoge:'agoge',
  caravans:'caravansaries', colonial:'colonization', revelation:'revelation',
  serfdom:'serfdom', retainers:'retainers', professional:'professional_army',
  rational:'rationalism', league:'diplomatic_league', newdeal:'new_deal', online:'online_communities',
  godking:'god_king', ilkum:'ilkum', survey:'survey', conscription:'conscription',
  maneuver:'maneuver', maritime:'maritime_industries', naturalphilosophy:'natural_philosophy',
  scripture:'scripture', aesthetics:'aesthetics', craftsmen:'craftsmen',
  towncharters:'town_charters', navalinfra:'naval_infrastructure', fiveyear:'five_year_plan',
  economicunion:'economic_union', insulae:'insulae', medina:'medina_quarter',
  liberalism:'liberalism', publicworks:'public_works', inspiration:'inspiration',
  literary:'literary_tradition', tradeconfederation:'trade_confederation', triangular:'triangular_trade',
  ecommerce:'ecommerce', collectivization:'collectivization', limes:'limes',
  gothic:'gothic_architecture', skyscrapers:'skyscrapers', feudalcontract:'feudal_contract',
  levee:'levee_en_masse', logistics:'logistics',
};
const strip = s => s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
async function fetchPage(source) {
  for (let attempt=0; attempt<3; attempt++) {
    try {
      const response=await fetch(source,{signal:AbortSignal.timeout(30000)});
      assert(response.ok,`${response.status} ${source}`);
      const html=await response.text();
      assert(html.includes('<h1'),source);
      return html.slice(html.indexOf('<h1'));
    } catch (error) { if (attempt===2) throw error; }
  }
}
const queue=[...Object.entries(governmentIds).map(([id,slug])=>({id,sourceId:'government_'+slug,kind:'government'})),
  ...Object.entries(policyIds).map(([id,slug])=>({id,sourceId:'policy_'+slug,kind:'policy'}))];
const governments=[],policies=[];
let cursor=0;
await Promise.all(Array.from({length:4},async()=>{
  while (cursor<queue.length) {
    const row=queue[cursor++],source=base+row.sourceId+'/',html=await fetchPage(source);
    const name=strip(/<h1[^>]*>(.*?)<\/h1>/.exec(html)?.[1]??'');
    const requirements=html.slice(html.indexOf('>要求<'));
    const unlock=/\/civics\/(civic_[^/]+)\//.exec(requirements)?.[1];
    const intro=html.slice(0,html.indexOf('>历史背景<')<0?html.indexOf('>特点<'):html.indexOf('>历史背景<'));
    const descriptions=row.kind==='government' ? [...intro.matchAll(/<p class="_1k50iii5[^>]*>([\s\S]*?)<\/p>/g)].map(m=>strip(m[1])) : [strip(/<div class="_1k50iii1[^>]*>([\s\S]*?)<\/div>/.exec(intro)?.[1]??'')];
    assert(name && descriptions.length,source+' missing description');
    if (row.kind==='government') {
      const text=strip(html.slice(html.indexOf('>特点<'),html.indexOf('>要求<'))),slots=[];
      for (const [label,type] of [['军事','military'],['经济','economic'],['外交','diplomatic'],['通配符','wild']]) {
        const count=Number(new RegExp('(\\d+)个'+label+'槽位').exec(text)?.[1]??0);
        slots.push(...Array(count).fill(type));
      }
      assert(slots.length>=2 && slots.length<=10,source+' missing slots');
      governments.push({...row,name,unlock:unlock??'civic_code_of_laws',slots,descriptions,source});
    } else {
      const military=new Set(['discipline','agoge','retainers','professional','survey','conscription','maneuver','maritime','craftsmen','limes','feudalcontract','levee','logistics']);
      const diplomatic=new Set(['league']);
      const wild=new Set(['revelation','inspiration','literary']);
      const type=military.has(row.id)?'military':diplomatic.has(row.id)?'diplomatic':wild.has(row.id)?'wild':'economic';
      assert(unlock,source+' missing unlock');
      const governmentSource=/\/governments\/(government_[^/]+)\//.exec(requirements)?.[1];
      const government=governmentSource ? Object.keys(governmentIds).find(id=>'government_'+governmentIds[id]===governmentSource) : null;
      assert(!governmentSource || government,source+' unknown government');
      const traits=html.slice(html.indexOf('>特点<'),html.indexOf('>要求<'));
      const obsolete=traits.includes('随着发展会被以下替代')?[...traits.matchAll(/\/governments\/(policy_[^/]+)\//g)].map(m=>m[1]):[];
      policies.push({...row,name,unlock,type,government:government??null,description:descriptions[0],obsolete:[...new Set(obsolete)],source});
    }
  }
}));
governments.sort((a,b)=>a.id.localeCompare(b.id));policies.sort((a,b)=>a.id.localeCompare(b.id));
const content='// Gathering Storm factual politics snapshot; fetched 2026-09-30.\nexport const governmentReference = '+JSON.stringify(governments,null,2)+' as const;\nexport const policyReference = '+JSON.stringify(policies,null,2)+' as const;\n';
console.log('*** Begin Patch\n*** Add File: /Users/bdh/fk/aoinatsu-web/src/games/civilization/politics-reference.ts\n'+content.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n*** End Patch');
