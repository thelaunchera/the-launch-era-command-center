import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const files=['sales-tools.html','assets/sales-tools.js','assets/sales-tools.css','assets/sales-tools-entry.js','assets/demo-concept.mjs','downloads/tle-local-tools.zip','vendor/pptxgenjs-4.0.1.bundle.js','vendor/pptxgenjs-4.0.1.LICENSE'];
for(const file of files){assert.ok(existsSync(join('.site',file)),file);const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');assert.equal(hash(join('.site',file)),hash(join('growth-upstream/public/command-center',file)),'Sales file drift '+file)}
const index=readFileSync('.site/index.html','utf8');assert.equal((index.match(/sales-tools-entry\.js/g)||[]).length,1,'One owner shortcut loader');
const metadata=JSON.parse(readFileSync('.site/deployment-source.json','utf8'));assert.equal(metadata.salesToolsSourceCommit,'7f5584ae5187b294c448a4bfff368bd735765492');
assert.equal(metadata.sourceCommit,'44b5edc6e32ee850be1f5e6fca441dd17e0a4d4c');assert.equal(metadata.aiTeamSourceCommit,'827d044f0c23e8bb85b3d7b2e5cbf133752b9128');
const entry=readFileSync('.site/assets/sales-tools-entry.js','utf8');
assert.ok(entry.includes('TLEOwnerJessyGateway?.ready?.()===true'));
assert.ok(entry.includes("id='ownerSalesToolsNav'")&&entry.includes("href='./sales-tools.html#demos'")&&entry.includes("'#ownerPrivateSection'"),'Owner sidebar must expose Sales tools and Clara route');
assert.ok(readFileSync('.site/sales-tools.html','utf8').includes('sandbox="allow-scripts allow-forms"'));assert.ok(readFileSync('.site/ai-team.html','utf8').includes('href="./sales-tools.html"'));
console.log('PASS: pinned owner-only sales tools copied exactly; base portal, AI Team and customer routes preserved.');
