import { governmentReference, policyReference } from './politics-reference';
import { researchId } from './research';
import { researchReference } from './research-reference';
import type { Government, PolicyType } from './catalog';
import type { Nation } from './model';

const governmentOrder = ['chief','autocracy','oligarchy','republic','monarchy','theocracy','merchant','fascism','communist','democracy','corporate','synthetic','digital'];
const pending: Record<string,string> = {
  chief: '', autocracy: '市政广场、外交区建筑尚未加入', republic: '伟人完整名录尚未加入',
  oligarchy: '抗骑兵单位和分类晋升尚未齐全', merchant: '总督金币加成尚未启用',
  monarchy: '后期城墙与外交支持尚未齐全', theocracy: '总督信仰加成与神学战斗尚未启用',
  democracy: '同盟关系与同盟点数尚未加入；仅宗主城邦可触发贸易加成',
  communist: '总督人口生产加成尚未启用', fascism: '厌战情绪尚未加入',
  digital: '', corporate: '', synthetic: '电力尚未加入',
};
export const governments: Government[] = governmentOrder.map(id => {
  const row=governmentReference.find(r=>r.id===id)!;
  return {
    id, name:row.name, unlock:researchId(row.unlock), slots:[...row.slots],
    description:row.descriptions.join(' '), source:row.source,
    pending:pending[id],
  };
});
// Great Writers are not implemented; do not offer a nonfunctional card.
export const policies: [string,string,string,PolicyType,string][] = policyReference.filter(row=>row.id!=='literary').map(row => [
  row.id, row.name, researchId(row.unlock), row.type,
  row.id==='rational' ? '学院建筑科技：人口至少15时+50%，原始邻接至少4时再+50%' : row.description,
]);
const unlockedBy = new Map(researchReference.flatMap(row=>row.unlocks.map(u=>[u.id,researchId(row.id)] as const)));
export function policyAvailable(n: Pick<Nation,'civic'|'government'>, id: string): boolean {
  const row=policyReference.find(p=>p.id===id);
  return policies.some(p=>p[0]===id) && !!row && (!row.government || row.government===n.government) && n.civic.includes(researchId(row.unlock)) && !row.obsolete.some(sourceId=>{
    const civic=unlockedBy.get(sourceId);
    return !!civic && n.civic.includes(civic);
  });
}
// Upgrade a changed slot layout without silently discarding an imported card.
export function remapPolicies(id: string, chosen: (string|null)[]): (string|null)[] | null {
  const g=governments.find(g=>g.id===id), selected=chosen.filter(p=>p!==null);
  if (!g || new Set(selected).size!==selected.length) return null;
  const result:(string|null)[]=g.slots.map(()=>null);
  for (const id of selected) {
    const p=policies.find(p=>p[0]===id);
    if (!p) return null;
    let at=g.slots.findIndex((slot,i)=>slot===p[3] && result[i]===null);
    if (at<0) at=g.slots.findIndex((slot,i)=>slot==='wild' && result[i]===null);
    if (at<0) return null;
    result[at]=id;
  }
  return result;
}
