import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {Script} from "node:vm";
const read=path=>readFileSync(path,"utf8");
const files=[".site/index.html",".site/assets/owner-automation-studio.js",".site/assets/owner-automation-studio.css"];
for(const f of files)assert.ok(existsSync(f),"Missing deployed automation asset: "+f);
const html=read(files[0]),code=read(files[1]),css=read(files[2]);
new Script(code,{filename:"owner-automation-studio.js"});
assert.match(html,/id="ownerAutomationHub"/,"Missing private automation screen");
assert.match(html,/data-automation-shortcut/,"Private home shortcut missing");
assert.match(html,/owner-automation-studio\.css\?v=/,"Styles not connected to build");
assert.match(html,/owner-automation-studio\.js\?v=/,"Script not connected to build");
assert.ok(!html.includes('href="https://app.thelaunchera.com/?public='),
 "Owner marketing/CRM must not link directly into customer app quote tokens");
assert.match(css,/body:not\(\.crm-owner-view\) #ownerAutomationHub\{display:none!important\}/,
 "Buyer view must not see private automations");
assert.match(code,/document\.body\.classList\.contains\("crm-owner-view"\)/,"Owner UI gate absent");
assert.match(code,/\.eq\("is_internal",true\)/,"Private owner workspace verification missing");
assert.match(code,/\.eq\("created_by",user\.data\.user\.id\)/,"Authenticated ownership verification missing");
assert.match(code,/\.eq\("workspace_id",id\)/,"Prospect tenant filter missing");
assert.match(code,/tle_crm_prospect_followup_queue/,"Existing prospect queue not connected");
assert.match(code,/email_consent_status==="authorized"/,"Verified consent guard absent");
assert.match(code,/email_consent_source/,"Consent source guard absent");
assert.match(code,/email_followup_enabled/,"Per-prospect switch not persisted");
assert.match(code,/confirm\(/,"Switching follow-up enrollment should require confirmation");
assert.ok(!code.includes("follow_up_email_outbox")&&!code.includes("follow_up_settings"),
 "Do not read customer Cleaning App tenants inside owner Command Center");
assert.ok(!code.includes("net.http_post")&&!code.includes("resend.emails.send"),
 "Command Center overview must never send email directly");
assert.match(css,/@media\(max-width:650px\)/,"Mobile layout missing");
assert.match(css,/focus-visible/,"Keyboard accessibility missing");
console.log("PASS: owner-only automation hub, permissions, consent and tenant boundaries; no messages sent.");
