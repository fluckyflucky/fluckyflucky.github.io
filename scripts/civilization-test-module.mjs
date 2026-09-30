import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const cache = new Map();
export function moduleUrl(file) {
  file=path.resolve(file);
  if(cache.has(file)) return cache.get(file);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}).outputText;
  const linked=code.replace(/from\s+["'](\.\.?\/[^"']+)["']/g,(_,name)=>`from ${JSON.stringify(moduleUrl(path.resolve(path.dirname(file),name.endsWith('.ts')?name:name+'.ts')))}`);
  const url='data:text/javascript;base64,'+Buffer.from(linked).toString('base64');
  cache.set(file,url);
  return url;
}
