import {copyFile,mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
const root=resolve('growth-upstream/public/command-center'),dest=resolve('.site');
export const GROWTH_SOURCE_COMMIT='b6d1284d578fba3e1b78eb9136a3d7f0de95fb02';
for(const file of ['sales-tools.html','assets/sales-tools.js','assets/sales-tools.css','assets/sales-tools-entry.js','assets/demo-concept.mjs',
 'downloads/tle-local-tools.zip','vendor/pptxgenjs-4.0.1.bundle.js','vendor/pptxgenjs-4.0.1.LICENSE']){
 await mkdir(dirname(join(dest,file)),{recursive:true});await copyFile(join(root,file),join(dest,file));
}
const path=join(dest,'index.html'),source=await readFile(path,'utf8');
if(!source.includes('</body>')||!source.includes('premium-header-actions'))throw Error('Owner sales shortcut insertion anchor changed.');
await writeFile(path,source.replace('</body>','<script src="./assets/sales-tools-entry.js?v=20261020-1" defer></script></body>'));
const team=join(dest,'ai-team.html'),html=await readFile(team,'utf8');
if(!html.includes('<a class="ait-back" href="./">'))throw Error('AI Team navigation anchor changed.');
await writeFile(team,html.replace('<a class="ait-back" href="./">','<a class="ait-back" href="./sales-tools.html">Sales tools ↗</a><a class="ait-back" href="./">'));
const meta=join(dest,'deployment-source.json'),data=JSON.parse(await readFile(meta,'utf8'));
data.salesToolsSourceCommit=GROWTH_SOURCE_COMMIT;await writeFile(meta,JSON.stringify(data,null,2)+'\n');
console.log('Sales tools overlay built from pinned source '+GROWTH_SOURCE_COMMIT+'; existing portal and AI Team bases preserved.');
