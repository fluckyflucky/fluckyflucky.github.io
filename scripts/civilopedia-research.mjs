// Read-only fetcher. Emits an apply_patch patch; never writes files itself.
// Keep factual gameplay fields only: no history, quotations, artwork or page HTML.
import assert from 'node:assert/strict';
const base = 'https://www.civilopedia.net/zh-CN/gathering-storm/';
const eraNames = ['远古时代','古典时期','中世纪','文艺复兴时期','工业时代','现代','原子能时代','信息时代','未来时代'];
const strip = s => s.replace(/<[^>]*>/g, ' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'").replace(/\s+/g, ' ').trim();
async function page(url) {
  for (let attempt=0; attempt<3; attempt++) {
    try {
      const response = await fetch(url, {signal: AbortSignal.timeout(30000)});
      assert(response.ok, `${response.status}: ${url}`);
      const html = await response.text();
      assert(html.includes('<h1'), `Missing article: ${url}`);
      return html;
    } catch (error) { if (attempt===2) throw error; }
  }
}
const article = html => html.slice(html.indexOf('<h1'));
function section(html, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const content = article(html), match = new RegExp(`<p[^>]*>${escaped}</p>`).exec(content);
  if (!match) return '';
  const start = content.lastIndexOf('<div', match.index);
  let depth = 0;
  for (const token of content.slice(start).matchAll(/<div\b[^>]*>|<\/div>/g)) {
    depth += token[0].startsWith('</') ? -1 : 1;
    if (depth===0) return content.slice(match.index+match[0].length,start+token.index);
  }
  throw new Error(`Unclosed section: ${heading}`);
}
const links = html => [...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(([,url,inner])=>({url, name: /<img[^>]*title="([^"]+)"/.exec(inner)?.[1] ?? strip(inner)}));
const all = [];
for (const [kind, category, first, prefix, expected] of [
  ['tech','technologies','tech_astrology','tech_',77],
  ['civic','civics','civic_code_of_laws','civic_',61],
]) {
  const html = await page(base+category+'/'+first+'/');
  const nav = html.slice(0,html.indexOf('<h1'));
  const seen = new Set();
  const entries = links(nav).filter(l=>l.url.includes(`/gathering-storm/${category}/${prefix}`)).filter(l=>!seen.has(l.url) && seen.add(l.url));
  assert.equal(entries.length, expected, `Unexpected ${kind} count; inspect source change`);
  let cursor=0;
  const records = new Array(entries.length);
  await Promise.all(Array.from({length:4}, async()=>{
    while (cursor < entries.length) {
      const index=cursor++, entry=entries[index];
      const url = new URL(entry.url,base).href;
      const html = await page(url), requirements = section(html,'要求');
      const cost = /基准花费：\s*(\d+)/.exec(strip(requirements));
      assert(cost, `Missing cost: ${url}`);
      const required = requirements.slice(requirements.indexOf(kind==='tech'?'所需的科技':'所需的市政'));
      const prereqs = links(required).filter(l=>l.url.includes(`/${category}/${prefix}`)).map(l=>l.url.split('/').filter(Boolean).at(-1));
      const afterBoost = requirements.slice(requirements.indexOf('提升条件'));
      const boost = requirements.includes('提升条件') ? strip(afterBoost).replace(/^提升条件\s*/, '') : '';
      assert(boost.length < 250 && !boost.includes('历史背景'), `Unexpected boost article content: ${url}`);
      const era = eraNames.findIndex(name=>strip(requirements).includes(name));
      assert(era>=0, `Missing era: ${url}`);
      const unlocks = links(section(html,'解锁')).filter(l=>l.name).map(l=>({id:l.url.split('/').filter(Boolean).at(-1),name:l.name,source:new URL(l.url,base).href}));
      records[index] = {id:entry.url.split('/').filter(Boolean).at(-1),kind,name:entry.name,cost:Number(cost[1]),requires:[...new Set(prereqs)],boost,era,unlocks,source:url};
      if ((index+1)%20===0) process.stderr.write(`${kind}: ${index+1}/${entries.length}\n`);
    }
  }));
  const known = new Set(records.map(r=>r.id));
  assert(records.every(r=>r.requires.every(id=>known.has(id))),`Dangling ${kind} prerequisite`);
  all.push(...records);
}
const content = '// Generated factual research reference. Refresh with scripts/civilopedia-research.mjs.\n'+
  '// Ruleset: Gathering Storm; fetched 2026-09-30. Original history/art are not included.\n'+
  'export const researchReference = '+JSON.stringify(all,null,2)+' as const;\n';
console.log('*** Begin Patch\n*** Add File: /Users/bdh/fk/aoinatsu-web/src/games/civilization/research-reference.ts\n'+content.trimEnd().split('\n').map(line=>'+'+line).join('\n')+'\n*** End Patch');
