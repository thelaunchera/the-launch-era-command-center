import { existsSync,readFileSync,statSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { Script } from "node:vm";
const root=".site";
const required=[
"index.html","idea-vault.html","assets/idea-vault.css","assets/idea-vault.js","access.html","access/index.html","ai-team.html","booking-studio.html","booking-studio-practice.html","assets/booking-studio-practice.js","booking-studio-qa.html","booking-studio-qa-recovery.html","booking-studio-qa-reset.html","assets/booking-studio.js","assets/booking-studio-preview.mjs","assets/booking-studio-functional-preview.mjs","assets/booking-studio-followup-rules.mjs",
"assets/command-center-app.js","assets/command-center.css","assets/command-center-i18n.js","assets/cb-depot-mobile-edge.css",
"assets/ai-team.js","assets/ai-team-easy-check.js","assets/ai-team-easy-check.css","assets/jessy-owner.js","assets/ai-team-entry.js",
"assets/booking-smart-welcome-editor.js","vendor/supabase-js-v2.57.0.umd.js",
"auth-recovery.html","auth-recovery/index.html","manifest-tle.webmanifest",
"manifest-cb-depot.webmanifest","assets/clients/cb-depot/approved-favicon-192.png",
"assets/brand/tle-mark.svg","assets/brand/tle-wordmark.svg",
"favicon.png","assets/jessy-avatar.webp","sw.js","CNAME","404.html","robots.txt","deployment-source.json"
];
for(const file of required){
 const p=join(root,file);
 assert.ok(existsSync(p)&&statSync(p).isFile(),"Missing deployed file: "+file);
}

for(const f of ["support-tickets.html","form-builder.html"])assert.ok(existsSync(join(root,f)),"Missing new owner/client tools: "+f);
const supportPage=readFileSync(join(root,"support-tickets.html"),"utf8");
const builderPage=readFileSync(join(root,"form-builder.html"),"utf8");
for(const [name,html] of [["Support Tickets",supportPage],["Form Builder",builderPage]]){
 assert.ok(html.includes('noindex,nofollow'),name+" must not be indexed");
 const match=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(match,name+" missing executable script");
 new Script(match[1],{filename:name});
}
assert.ok(supportPage.includes('tle_crm_support_requests')&&supportPage.includes('eq("is_internal",false)'),"Buyer support must use real, tenant-scoped requests");
assert.ok(supportPage.includes('workspace_id:workspace.id')&&supportPage.includes('submitted_by:user.id'),"Support requests must use authenticated tenant and user");
assert.ok(builderPage.includes('eq("is_internal",true)')&&builderPage.includes("tle-form-builder-draft-"),"Form Builder must verify owner and keep isolated drafts");
assert.ok(builderPage.includes('Publishing is not connected yet.')&&!builderPage.includes('tle_crm_support_requests'),"Form Builder must not imply publishing or write support records");

const read=f=>readFileSync(join(root,f),"utf8");
const index=read("index.html"),recover=read("auth-recovery.html"),ai=read("ai-team.html");
const vault=read("idea-vault.html"),vaultJs=read("assets/idea-vault.js"),vaultCss=read("assets/idea-vault.css");
assert.ok(index.includes('id="ownerIdeasNav"')&&index.includes('./idea-vault.html'),"Idea Vault must be linked only from private owner navigation");
assert.ok(index.includes('data-od-en="Idea Vault"'),"Idea Vault dashboard card missing");
assert.ok(vault.includes('id="voiceButton"')&&vault.includes('id="saveIdea"'),"Voice/text capture controls missing");
assert.ok(vault.includes('id="ideaSearch"')&&vault.includes('id="areaFilter"')&&vault.includes('id="exportIdeas"'),"Idea Vault must support searching, area filters and private backup");
assert.ok(vault.includes('id="draftStatus"')&&vault.includes('id="metricInbox"'),"Idea Vault needs recoverable draft feedback and quick overview");
assert.ok(vaultJs.includes('rememberDraft')&&vaultJs.includes('restoreDraft')&&vaultJs.includes('suggestArea'),"Idea Vault lost draft protection or area suggestions");
assert.ok(vaultJs.includes('No duplicate')||vaultJs.includes('duplicado'),"Idea Vault duplicate safety missing");
assert.ok(vaultJs.includes('Owner Idea Vault v2')&&vaultJs.includes("tle_owner_ideas"),"Owner Idea Vault v2 script not connected");

assert.ok(vault.includes('./vendor/supabase-js-v2.57.0.umd.js'),"Idea Vault must load pinned local Auth client");
assert.ok(vaultJs.includes("storageKey:'tle-crm-auth'")&&vaultJs.includes(".eq('is_internal',true)"),"Idea Vault owner authentication gate missing");
assert.ok(vaultJs.includes("tle_owner_ideas")&&vaultJs.includes("status:'inbox'"),"Ideas must persist as inbox, not work tasks");
assert.ok(!vaultJs.includes("tle_ai_team_tasks")&&!vaultJs.includes("tle_crm_leads"),"Saving an idea must never create work tasks or mutate leads");
assert.ok(vaultCss.includes('@media(max-width:540px)'),"Idea Vault phone layout missing");
new Function(vaultJs);

const ownerNavMarkup=index.slice(index.indexOf('id="ownerPrivateSection"'),index.indexOf('id="buyerBusinessSection"'));
const buyerNavMarkup=index.slice(index.indexOf('id="buyerBusinessSection"'),index.indexOf('id="sidebarUtilityMenu"'));
assert.ok(ownerNavMarkup.includes('href="./form-builder.html"'),"Private owner Form Builder navigation missing");
assert.ok(!buyerNavMarkup.includes('href="./form-builder.html"'),"Buyer must not see private Form Builder navigation");
assert.ok(buyerNavMarkup.includes('href="./support-tickets.html"'),"Buyer Support Tickets navigation missing");
assert.ok(!ownerNavMarkup.includes('href="./support-tickets.html"'),"Buyer ticket entry must not leak into owner navigation");
assert.ok(index.includes('id="authForm"'),"Private login form missing");
assert.ok(index.includes("./assets/command-center-app.js"),"Private application missing");
assert.ok(index.includes("./assets/cb-depot-mobile-edge.css?v=20261014-mobile-edge-v1"),"CB Depot phone-side fix not linked");
const cbEdge=read("assets/cb-depot-mobile-edge.css");
assert.ok(cbEdge.includes("body.cb-depot-buyer")&&cbEdge.includes("max(10px, env(safe-area-inset-left, 0px))"),"Mobile sides must preserve 10px gutters and CB Depot tenant scope");
assert.ok(cbEdge.includes("section.premium-emailhub")&&cbEdge.includes("border-radius: 0 !important"),"Double outer mobile card was not flattened");
assert.ok(cbEdge.includes("#buyerRequestDetail")&&cbEdge.includes("grid-template-columns: minmax(0, 1fr)"),"Mobile request detail containment missing");

assert.ok(ai.includes("assets/ai-team.js"),"Private team entry missing");
assert.ok(ai.includes("assets/ai-team-easy-check.css")&&ai.includes("assets/ai-team-easy-check.js"),"AI Team phone UX overrides missing from HTML");
const teamJs=read("assets/ai-team.js"),inlineJs=read("assets/ai-team-easy-check.js"),inlineCss=read("assets/ai-team-easy-check.css");
assert.ok(teamJs.includes("card.dataset.agentKey=a.key"),"Agent cards must identify the target for inline reports");
assert.ok(teamJs.includes("TLEAITeamEasyCheck?.showAgentReport"),"Live agent run must display its own inline report");
const agentRunBody=teamJs.split("async function runAgent(")[1]?.split("function renderRuns(")[0]||"";
assert.ok(!agentRunBody.includes("scrollIntoView"),"Running an agent must never force-scroll to archive");
assert.ok(teamJs.includes("TLEAITeamEasyCheck?.showTeamScan"),"Workspace scan must show local summary");
assert.ok(inlineJs.includes("role")&&inlineJs.includes("showAgentReport")&&inlineJs.includes("read-only")===false,"AI Team inline report must have an accessible, owned-only presentation");
assert.ok(inlineCss.includes("@media(max-width:600px)")&&inlineCss.includes(".ait-agent-inline"),"Responsive inline agent reports CSS missing");

assert.ok(ai.includes("./booking-studio.html"),"Owner AI Team must link to Booking Studio");
const studio=read("booking-studio.html"),studioJs=read("assets/booking-studio.js");
const practice=read("booking-studio-practice.html"),practiceJs=read("assets/booking-studio-practice.js");
assert.ok(studio.includes("./booking-studio-practice.html"),"Owner Studio must link to Practice Studio");
assert.ok(practice.includes("noindex,nofollow,noarchive"),"Practice Studio must not be indexed");
assert.ok(practice.includes('sandbox=""'),"Practice preview iframe must block scripts");
assert.ok(practice.includes('id="compare-draft"')&&practice.includes('id="compare-revision"'),"Practice must offer two actual side-by-side previews");
assert.ok(practiceJs.includes('$("compare-draft").srcdoc')&&practiceJs.includes('$("compare-revision").srcdoc'),"Practice must render both concepts, not just toggle");
assert.ok(practiceJs.includes('action:"list"')&&practiceJs.includes("data.owner_only!==true"),"Practice must verify owner through backend");
assert.ok(practiceJs.includes("synthetic-bright-rooms")&&practiceJs.includes("SIMULATED APPROVAL BLOCKED"),"Practice must use only fictional data and block real approvals");
assert.ok(practice.includes('id="booking-flow"')&&practice.includes('id="test-booking"'),"Practice must expose a functional synthetic booking form");
assert.ok(practiceJs.includes("calculateFlow(input)")&&practiceJs.includes("LOCAL TEST PASSED"),"Practice booking estimate and confirmation flow missing");
assert.ok(practiceJs.includes("No appointment, email, payment or record was created."),"Practice must explicitly avoid real side effects");
assert.ok(practice.includes('id="followup-panel"')&&practice.includes('id="followup-language"'),"Practice must expose unsent bilingual follow-up preview");
assert.ok(practiceJs.includes('createFollowupPreview(item,stage,lang)')&&practiceJs.includes('No email, notification or scheduled follow-up was created.'),"Follow-up previews must not send or schedule messages");
assert.ok(practiceJs.includes('item.synthetic_only!==true||item.confirmed!==false||item.customer_notified!==false'),"Follow-up selection must verify Testing-only records");
assert.ok(!/fetch\([^)]*method:"(?:PATCH|PUT|DELETE)"/.test(practiceJs),"Practice cannot mutate customer records");
assert.ok(!practiceJs.includes("localStorage.setItem"),"Practice cannot persist sensitive state");
assert.ok(practiceJs.includes("friendlyFollowupReason")&&practiceJs.includes("record-card"),"Practice request cards must be friendly");
const testPage=read("booking-studio-qa.html");
assert.ok(testPage.includes("noindex,nofollow"),"Temporary staging QA must not be indexed");
assert.ok(testPage.includes("afyiltvdfqnuyzcqsnoh"),"Staging QA must target only Testing Supabase");
assert.ok(testPage.includes("tle-booking-studio-staging-qa"),"Staging QA endpoint missing");
assert.ok(!testPage.includes('id="signup"'),"Hosted staging QA must not allow public sign-up");
assert.ok(testPage.includes('href="/booking-studio-qa-reset.html"')&&read("booking-studio-qa-reset.html").includes("booking-studio-qa-recovery.html"),"Testing reset must stay on the private Command Center and recover into Testing");
assert.ok(testPage.includes("Please check the synthetic test consent"),"Synthetic consent validation feedback missing");
assert.ok(testPage.includes('el("submit").disabled=true'),"Synthetic submission must prevent double click");
assert.ok(testPage.includes('finally{el("submit").disabled=!token}'),"Submit control must recover from failed request");
assert.ok(testPage.includes("await refresh();"),"Signed-in Testing requests must load automatically");
assert.ok(!testPage.includes('el("signup").disabled'),"Removed signup must not crash Testing login");
const resetPage=read("booking-studio-qa-reset.html");
assert.ok(testPage.includes('href="/booking-studio-qa-reset.html"'),"Reset control must work as a direct link");
assert.ok(resetPage.includes("/auth/v1/recover?redirect_to=")&&resetPage.includes("booking-studio-qa-recovery.html"),"Reset page must request Testing recovery redirect");
const recovery=read("booking-studio-qa-recovery.html");
assert.ok(recovery.includes("afyiltvdfqnuyzcqsnoh")&&recovery.includes('type:"recovery"'),"Recovery must use Testing project and recovery token");
assert.ok(recovery.includes("history.replaceState"),"Recovery URL must remove tokens");
assert.ok(!recovery.includes("bowacxhmjvrqixtwaikv"),"Recovery must never target production");
assert.ok(!testPage.includes("SUPABASE_SERVICE_ROLE_KEY"),"Secret key cannot be in hosted QA");
assert.ok(studio.includes("noindex,nofollow,noarchive"),"Booking Studio must not be indexed");
assert.ok(studio.includes('sandbox=""'),"Preview iframe must disable scripts");
assert.ok(studioJs.includes("db.auth.getSession"),"Booking Studio owner session required");
assert.ok(studioJs.includes("tle-booking-studio-owner"),"Owner API must be used");

assert.ok(studio.includes('id="domain-mode"')&&studio.includes('value="included_subdomain"')&&studio.includes('value="custom_domain"'),"Both domain options must exist");
assert.ok(studioJs.includes('tle-booking-studio-domain-request')&&studioJs.includes('action:"configure"'),"Domain choices must persist via authenticated service");
assert.ok(studio.includes('No link will be sent to the client yet'),"Domain preferences must not be misrepresented as published");

assert.ok(studio.includes('id="client-review-panel"')&&studio.includes('id="client-preview-gate"'),"Owner studio needs customer-review release gates");
assert.ok(studioJs.includes('tle-client-review')&&studioJs.includes('action:"owner_get"'),"Buyer review status must reuse existing authenticated backend");
assert.ok(studio.includes('id="client-delivery-gate" disabled'),"Final delivery must remain disabled until separate release safety is validated");

assert.ok(studio.includes('data-preview-device="phone"')&&studio.includes('data-preview-device="tablet"')&&studio.includes('data-preview-device="desktop"'),"Client builder preview must support phone tablet desktop");
assert.ok(studio.includes("Your marketing domain is not the client"),"No marketing-site fallback for client booking URL");
assert.ok(studioJs.includes('button.dataset.previewDevice'),"Preview device controls must be connected");


assert.ok(studio.includes('id="client-review-preflight"'),"Client invite requires independent readiness check");
assert.ok(studioJs.includes('tle-booking-studio-review-invite')&&studioJs.includes('action:"check"'),"Invitation must use backend preflight");
assert.ok(studioJs.includes('action:"send"')&&studioJs.includes('owner_confirmed:true'),"Invite requires explicit owner action");
assert.ok(studio.includes('id="client-preview-gate" disabled'),"Invitation must start disabled");



assert.ok(practice.includes('id="handoff-design"'),"Practice needs private design handoff button");
assert.ok(practiceJs.includes('tle-booking-studio-design-handoff')&&practiceJs.includes('action:"transfer"'),"Transfer must use protected backend");
assert.ok(studio.includes('id="handoff-library"')&&studioJs.includes('async function refreshHandoffs()'),"Command Center must list transferred design references");
assert.ok(studioJs.includes('action:"review"')&&studioJs.includes('HANDOFF_ENDPOINT'),"Owner approval and revisions must stay on private endpoint");


assert.ok(studio.includes('id="email-subject"')&&studio.includes('id="email-body"'),"Email copy needs editable fields");
assert.ok(studio.includes('id="email-save"')&&studio.includes('id="email-approve"')&&studio.includes('id="email-revise"'),"Email review controls missing");
assert.ok(studioJs.includes("tle-booking-studio-email-review"),"Email decisions must call secured persistent endpoint");
assert.ok(studioJs.includes('action:"get"')&&studioJs.includes('action:"save"')&&studioJs.includes('action:"approve"')&&studioJs.includes('action:"revise"'),"Persisted email review actions missing");
assert.ok(studioJs.includes("expected_version")&&studioJs.includes("content_hash"),"Email approvals must bind to immutable saved version");
assert.ok(!studioJs.includes("new Map(),current:null"),"Session-only email approval cannot remain");

assert.ok(!studioJs.includes("innerHTML="),"Unsafe HTML injection in owner studio");
assert.ok(recover.includes("/vendor/supabase-js-v2.57.0.umd.js"),"Recovery points to another host/path");
assert.ok(!recover.includes("/command-center/"),"Recovery would leave private root path");
assert.equal(read("CNAME").trim(),"command.thelaunchera.com");
for(const file of ["index.html","access.html","manifest-tle.webmanifest"]){
 assert.ok(!read(file).includes("dailinsegura17.workers.dev"),"Legacy Cloudflare favicon in "+file);
}
assert.ok(!read("sw.js").includes("/command-center/"),"Push links target stale website path");
assert.ok(read("assets/jessy-owner.js").includes('/assets/jessie-avatar.webp?v=20261015'),"Jessie avatar path unexpectedly changed");
assert.ok(read("assets/command-center-notification-settings.js").includes('getRegistration("/")'),"Notification preferences still use old service worker scope");
assert.ok(read("assets/command-center-app.js").includes("navigator.serviceWorker.register('/sw.js',{scope:'/'})"),"App still registers old service worker scope");
const manifest=JSON.parse(read("manifest-tle.webmanifest"));
assert.ok(manifest.start_url.startsWith("./"),"PWA must stay on command hostname");
const info=JSON.parse(read("deployment-source.json"));
assert.equal(info.sourceCommit,"44b5edc6e32ee850be1f5e6fca441dd17e0a4d4c");
console.log("PASS: isolated private login, recovery, owner AI routes, CB Depot brand assets, local icons, custom domain; no external actions triggered.");
console.log("NOT VERIFIED: live buyer login / RLS / multi-tenant access / Supabase redirect allowlist / 12h policy. Require authenticated QA before customer migration.");
