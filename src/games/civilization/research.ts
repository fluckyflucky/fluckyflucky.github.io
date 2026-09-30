import { researchReference } from './research-reference';
import type { Research } from './catalog';

// Retain v1/v2 IDs so expanded trees do not silently discard saved research.
const aliases: Record<string, string> = {
  tech_animal_husbandry:'animals', tech_archery:'archery', tech_astrology:'astrology',
  tech_bronze_working:'bronze', tech_irrigation:'irrigation', tech_masonry:'masonry',
  tech_mining:'mining', tech_pottery:'pottery', tech_sailing:'sailing', tech_the_wheel:'wheel',
  tech_writing:'writing', tech_currency:'currency', tech_construction:'construction',
  tech_engineering:'engineering', tech_horseback_riding:'horseback', tech_iron_working:'ironworking',
  tech_shipbuilding:'shipbuilding', tech_apprenticeship:'apprentice', tech_education:'education',
  tech_machinery:'machinery', tech_printing:'printing', tech_gunpowder:'gunpowder',
  tech_banking:'banking', tech_astronomy:'astronomy', tech_industrialization:'industry',
  tech_steam_power:'steam', tech_steel:'steel', tech_flight:'flight', tech_combustion:'combustion',
  tech_electricity:'electricity', tech_rocketry:'rocketry', tech_computers:'computers',
  tech_satellites:'satellites', tech_robotics:'robotics',
  civic_code_of_laws:'laws', civic_craftsmanship:'craft', civic_foreign_trade:'trade',
  civic_military_tradition:'military', civic_early_empire:'empire', civic_mysticism:'mysticism',
  civic_political_philosophy:'philosophy', civic_drama_poetry:'drama', civic_theology:'theology',
  civic_feudalism:'feudal', civic_civil_service:'civilservice', civic_mercenaries:'mercenaries',
  civic_exploration:'exploration', civic_humanism:'humanism', civic_diplomatic_service:'diplomatic',
  civic_nationalism:'nationalism', civic_urbanization:'urbanization', civic_capitalism:'economics',
  civic_suffrage:'democracy', civic_class_struggle:'communism', civic_mass_media:'media',
  civic_globalization:'globalization', civic_social_media:'socialmedia',
};
export const researchId = (id: string) => aliases[id] ?? id.replace(/^(tech|civic)_/, '').replace(/_/g, '');
function tree(kind: 'tech' | 'civic'): Research[] {
  const records = researchReference.filter(r=>r.kind === kind);
  const columns = new Map<string, number>();
  function column(id: string, visiting = new Set<string>()): number {
    if (columns.has(id)) return columns.get(id)!;
    if (visiting.has(id)) throw new Error(`Research cycle: ${id}`);
    const r = records.find(r=>r.id===id);
    if (!r) throw new Error(`Unknown prerequisite: ${id}`);
    const next = new Set(visiting).add(id);
    const value = r.requires.length ? Math.max(...r.requires.map(pre=>column(pre,next)))+1 : 0;
    columns.set(id,value);
    return value;
  }
  return records.map(r=>({
    id:researchId(r.id), sourceId:r.id, source:r.source, name:r.name, cost:r.cost,
    requires:r.requires.map(researchId), boost:r.boost, era:r.era, column:column(r.id),
    effect:r.unlocks.map(u=>u.name).join('、') || '查看百科中的规则效果',
    unlocks:r.unlocks.map(u=>({id:u.id,name:u.name,source:u.source})),
  })).sort((a,b)=>a.column-b.column || a.era-b.era || a.id.localeCompare(b.id));
}
export const techs = tree('tech');
export const civics = tree('civic');
