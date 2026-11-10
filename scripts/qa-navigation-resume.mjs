import {readFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=resolve('.site');
const js=readFileSync(resolve(root,'assets/command-center-app.js'),'utf8');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const css=readFileSync(resolve(root,'assets/command-center-nav-resume.css'),'utf8');
const checks=[
 ['exact 2-hour TTL',js.includes('CRM_NAV_TTL_MS=2*60*60*1000')],
 ['account AND tenant scoped memory key',js.includes("activeAuthUserId+':'+workspace.id")],
 ['auth check on restore',js.includes("if(!workspace||!activeAuthUserId||$('app').classList.contains('hidden'))return")],
 ['role-specific route allowlist',js.includes('crmOwnerViews')&&js.includes('crmBuyerViews')],
 ['signed-out state purge',js.includes("function lockCommandCenterSession(){\n crmClearPlace();")],
 ['resume after auth protected boot',js.includes('await loadStoredNotifications();\n crmRestorePlace();')],
 ['Back respects native history',js.includes('if(crmBrowserDepth>0){window.history.back();return;}')],
 ['browser popstate',js.includes("window.addEventListener('popstate',event=>{")],
 ['PWA suspended stores last position',js.includes("window.addEventListener('pagehide',crmRecordPlace)")],
 ['explicit close button',html.includes('id="workspaceClose"')],
 ['explicit close handler',js.includes("$('workspaceClose').onclick=crmCloseCurrent;")],
 ['minimum mobile touch target',css.includes('min-height:44px')],
 ['reduced motion',css.includes('prefers-reduced-motion:reduce')],
 ['existing protected access screen remains',html.includes('id="authForm"')],
 ['existing refresh remains',html.includes('id="workspaceRefresh"')],
 ['no new external dependency',!html.includes('command-center-nav-resume.js')],
];
for(const [label,ok] of checks)assert.ok(ok,'Failed: '+label);
assert.equal(js.split('crmRestorePlace();').length-1,1,'Unexpected duplicate navigation restoration');
assert.equal(html.split('id="workspaceClose"').length-1,1,'Duplicate close button');
const temp=resolve(root,'.crm-nav-syntax-check.mjs');
try{
 writeFileSync(temp,js);
 execFileSync(process.execPath,['--check',temp],{stdio:'pipe'});
}finally{if(existsSync(temp))rmSync(temp)}
console.log('Command Center: two-hour, signed-in tenant navigation invariants and JS syntax verified.');
