import {copyFile,mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join,dirname,relative} from 'node:path';
const root=resolve('.site'),scriptFile=resolve('overrides/assets/tle-command-legal-footer.js');
const target=join(root,'assets/tle-command-legal-footer.js');
await mkdir(dirname(target),{recursive:true});await copyFile(scriptFile,target);
const tag='<script defer src="/assets/tle-command-legal-footer.js?v=20261109-1"></script>';
let count=0;
async function visit(folder){
 for(const file of await readdir(folder,{withFileTypes:true})){
  const p=join(folder,file.name);
  if(file.isDirectory()){if(!['node_modules','vendor','downloads'].includes(file.name))await visit(p);continue}
  if(!file.name.endsWith('.html')||file.name==='404.html')continue;
  let html=await readFile(p,'utf8');if(html.includes('tle-command-legal-footer.js'))continue;
  if(!/<\/body\s*>/i.test(html))continue;
  html=html.replace(/<\/body\s*>/i,tag+'\n</body>');
  await writeFile(p,html,'utf8');count++;
 }
}
await visit(root);
if(count<8)throw Error('Legal overlay expected at least eight distinct HTML routes, got '+count);
for(const required of ['index.html','access.html','ai-team.html','sales-tools.html','booking-studio.html']){
 const target=join(root,required);if(!(await (await import('node:fs/promises')).stat(target).then(()=>true).catch(()=>false)))continue;
 const html=await readFile(target,'utf8');
 if(!html.includes(tag))throw Error('Legal overlay missing: '+required);
}
const meta=join(root,'deployment-source.json');const d=JSON.parse(await readFile(meta,'utf8'));d.legalFooter='2026-11-09 · company policy links only';await writeFile(meta,JSON.stringify(d,null,2)+'\n','utf8');
console.log('Applied private Command Center legal/footer overlay to '+count+' HTML pages; pinned sources unchanged.');