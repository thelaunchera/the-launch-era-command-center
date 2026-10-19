import { cp, copyFile, mkdir, readFile, writeFile, rm, stat } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";

const from=resolve("upstream/public"), dest=resolve(".site");
const sourceId="44b5edc6e32ee850be1f5e6fca441dd17e0a4d4c";
const DOMAIN="command.thelaunchera.com";
async function exists(p){try{await stat(p);return true}catch{return false}}
async function copy(relative, target=relative){
 const origin=join(from,relative), output=join(dest,target);
 if(!(await exists(origin)))throw Error("Missing upstream source "+relative);
 await mkdir(dirname(output),{recursive:true});
 await cp(origin,output,{recursive:true,force:true});
}
async function rewrite(relative,update){
 const target=join(dest,relative);
 const original=await readFile(target,"utf8");
 const revised=update(original);
 if(revised!==original)await writeFile(target,revised,"utf8");
}
await rm(dest,{recursive:true,force:true});
await mkdir(dest,{recursive:true});
// The source is already a published public static application, never private user data.
await copy("command-center",".");
await copy("assets/brand");
// Jessie owner avatar is a public brand asset, not customer data.
await copy("assets/jessy-avatar.webp");
await copy("assets/clients/cb-depot");
for(const file of ["favicon.png","favicon.ico","apple-touch-icon.png","auth-recovery.html"])await copy(file);
await copyFile(resolve("brand/favicon-tle.svg"),join(dest,"favicon-tle.svg"));
await mkdir(join(dest,"access"),{recursive:true});
await copyFile(join(dest,"access.html"),join(dest,"access/index.html"));
await mkdir(join(dest,"auth-recovery"),{recursive:true});
await copyFile(join(dest,"auth-recovery.html"),join(dest,"auth-recovery/index.html"));
// Recovery must return to THIS private domain. Never redirect buyer authentication
// to marketing or share access tokens across origins.
for(const relative of ["auth-recovery.html","auth-recovery/index.html"])
 await rewrite(relative,s=>s.replaceAll("/command-center/","/"));
// Old worker is not a hosting or favicon dependency of this GitHub Pages site.
const legacyIcon=/https:\/\/the-launch-era-crm\.dailinsegura17\.workers\.dev\/app-icons\/tle-(?:180|192|512)\.png(?:\?v=[A-Za-z0-9_-]+)?/g;
for(const relative of ["index.html","access.html","access/index.html","manifest-tle.webmanifest"])
 await rewrite(relative,s=>s.replace(legacyIcon,"/favicon-tle.svg?v=20261014").replaceAll('type="image/png"','type="image/svg+xml"').replaceAll('favicon.type="image/png"','favicon.type="image/svg+xml"'));
// Notifications launched on the new, independent hostname stay on its root portal.
await rewrite("sw.js",s=>s.replaceAll("/command-center/","/").replaceAll('provided.pathname.startsWith("/")','provided.pathname.startsWith("/")').replaceAll('requested.pathname.startsWith("/")','requested.pathname.startsWith("/")'));
// The internal OWNER marketing-demo iframe is intentionally served by the website.
// All private sign-in, recovery, workspaces and AI Team navigation remain on this origin.
await rewrite("assets/command-center-app.js",s=>
 s.replaceAll("navigator.serviceWorker.register(new URL('sw.js',location.href).pathname)","navigator.serviceWorker.register('/sw.js',{scope:'/'})")
 .replaceAll("frame.src='/booking-demo/?lang='","frame.src='https://thelaunchera.com/booking-demo/?lang='"));
// GitHub Pages hosts this portal at /, not at /command-center/.
await rewrite("assets/command-center-notification-settings.js",s=>
 s.replaceAll('getRegistration("/command-center/")','getRegistration("/")')
  .replaceAll('register("/command-center/sw.js",{scope:"/command-center/"})','register("/sw.js",{scope:"/"})')
  .replace('note(t("Could not save your preferences. Please try again.","No se pudieron guardar las preferencias. Inténtalo otra vez."));console.warn("Alert preferences",e.message)',
   'note(t("Could not save preferences: ","No se pudieron guardar las preferencias: ")+String(e?.message||"Connection error").slice(0,180));console.warn("Alert preferences",e.message)'));
await rewrite("index.html",s=>s.replace('href="/booking-bundle/','href="https://thelaunchera.com/booking-bundle/'));

// Static purchase rehearsal: fictional data, no payment or backend writes.
await mkdir(join(dest,"order-practice"),{recursive:true});
await copyFile(resolve("overrides/order-practice/index.html"),join(dest,"order-practice/index.html"));

// Compact owner-only Jessy alert; preserve pinned source and all private routing.
await copyFile(resolve("overrides/jessy-owner.js"),join(dest,"assets/jessy-owner.js"));
await copyFile(resolve("overrides/jessy-owner.css"),join(dest,"assets/jessy-owner.css"));
for(const relative of ["index.html","assets/jessy-owner-standalone.mjs"])
 await rewrite(relative,s=>s.replaceAll("jessy-owner.js?v=20261014-unified-team-v1","jessy-owner.js?v=20261014-compact-alert-v1"));

// Booking Studio is a separate owner-only UI. Backend re-verifies owner JWT on every call.
await copyFile(resolve("overrides/booking-studio.html"),join(dest,"booking-studio.html"));
await copyFile(resolve("overrides/booking-studio-practice.html"),join(dest,"booking-studio-practice.html"));
await copyFile(resolve("overrides/assets/booking-studio-practice.js"),join(dest,"assets/booking-studio-practice.js"));
await copyFile(resolve("overrides/assets/booking-studio.js"),join(dest,"assets/booking-studio.js"));
await copyFile(resolve("overrides/assets/booking-studio-preview.mjs"),join(dest,"assets/booking-studio-preview.mjs"));
await copyFile(resolve("overrides/assets/booking-studio-functional-preview.mjs"),join(dest,"assets/booking-studio-functional-preview.mjs"));
await copyFile(resolve("overrides/assets/booking-studio-followup-rules.mjs"),join(dest,"assets/booking-studio-followup-rules.mjs"));
// Practice Studio is owner-verified, synthetic-only, and cannot write or publish.
// Temporary Testing-only browser QA page: no customer records and no navigation link.
await copyFile(resolve("overrides/booking-studio-qa.html"),join(dest,"booking-studio-qa.html"));
await copyFile(resolve("overrides/booking-studio-qa-recovery.html"),join(dest,"booking-studio-qa-recovery.html"));
await copyFile(resolve("overrides/booking-studio-qa-reset.html"),join(dest,"booking-studio-qa-reset.html"));
// Add navigation only; never alter the existing AI Team runtime or buyer agent permissions.
await rewrite("ai-team.html",s=>s.replace(
 '<a class="ait-back" href="./">← Command Center</a>',
 '<a class="ait-back" href="./booking-studio.html">Booking Studio</a><a class="ait-back" href="./">← Command Center</a>'
));

// The private AI Team shows an agent's verified report beside the action that
// opened it, rather than jumping the owner down to the execution archive.
await copyFile(resolve("overrides/assets/ai-team-easy-check.css"),join(dest,"assets/ai-team-easy-check.css"));
await copyFile(resolve("overrides/assets/ai-team-easy-check.js"),join(dest,"assets/ai-team-easy-check.js"));
await rewrite("assets/ai-team.js",s=>{
 const replacements=[
  ['const card=el("article","ait-agent"+(i===0?" lead":""));','const card=el("article","ait-agent"+(i===0?" lead":""));card.dataset.agentKey=a.key;'],
  ['const go=el("button","",tx("create")+" →");','const go=el("button","",window.innerWidth<=600?(language==="es"?"+ Tarea":"+ Task"):tx("create")+" →");'],
  ['const run=el("button","ait-run-btn",tx("run")+" ↗");','const run=el("button","ait-run-btn",window.innerWidth<=600?(language==="es"?"Revisar ↗":"Check ↗"):tx("run")+" ↗");'],
  ['document.getElementById("runs-section")?.scrollIntoView({behavior:"smooth",block:"start"});','window.TLEAITeamEasyCheck?.showAgentReport(agentKey,(runs||[]).find(item=>item.agent_key===agentKey),language);'],
  ['document.getElementById("team-overview")?.scrollIntoView({behavior:"smooth",block:"start"})','window.TLEAITeamEasyCheck?.showTeamScan(scan,language)']
 ];
 for(const [before,after] of replacements){
  if(!s.includes(before))throw Error("AI Team mobile anchor missing: "+before.slice(0,90));
  s=s.replace(before,after);
 }
 return s;
});
await rewrite("ai-team.html",s=>{
 const source='<script type="module" src="./assets/ai-team.js';
 if(!s.includes(source)||!s.includes("</head>"))throw Error("AI Team mobile insertion anchor missing");
 return s.replace("</head>",'<link rel="stylesheet" href="./assets/ai-team-easy-check.css?v=20261014-mobile-v1"></head>')
  .replace(source,'<script src="./assets/ai-team-easy-check.js?v=20261014-mobile-v1"></script>\n<script type="module" src="./assets/ai-team.js');
});

// Owner-only Idea Vault. No buyer navigation and no automatic task execution.
await copyFile(resolve("overrides/idea-vault.html"),join(dest,"idea-vault.html"));
await copyFile(resolve("overrides/assets/idea-vault.css"),join(dest,"assets/idea-vault.css"));
await copyFile(resolve("overrides/assets/idea-vault.js"),join(dest,"assets/idea-vault.js"));
await rewrite("index.html",s=>{
 const nav='<div class="nav-caption" id="ownerOrdersCaption">THE LAUNCH ERA · PRIVATE</div>';
 if(!s.includes(nav))throw Error("Private navigation anchor changed; abort Idea Vault insertion");
 return s.replace(nav,nav+'\n<a class="nav-link" id="ownerIdeasNav" href="./idea-vault.html" style="text-decoration:none">🎙 <span>Idea Vault</span></a>');
});

// Owner dashboard is isolated from buyer workspaces and the marketing website.
const ownerDashboardMarkup=await readFile(resolve("overrides/owner-dashboard.html"),"utf8");
await copyFile(resolve("overrides/owner-dashboard.css"),join(dest,"assets/owner-dashboard.css"));
await copyFile(resolve("overrides/assets/owner-dashboard.js"),join(dest,"assets/owner-dashboard.js"));
await copyFile(resolve("overrides/assets/owner-automation-studio.js"),join(dest,"assets/owner-automation-studio.js"));
await copyFile(resolve("overrides/assets/owner-automation-studio.css"),join(dest,"assets/owner-automation-studio.css"));
await rewrite("index.html",s=>{
 const markers=[
  '<div class="nav-caption" id="ownerOrdersCaption">THE LAUNCH ERA · PRIVATE</div>',
  '<button type="button" class="nav-link" id="ownerSupportNav"',
  '<section id="pipeline" class="hidden">',
  '</head>',
  '</body>'
 ];
 for(const marker of markers)if(!s.includes(marker))throw Error("Owner overview missing markup anchor: "+marker);
 return s
  .replace(markers[0],'<div class="nav-caption" id="ownerOrdersCaption">THE LAUNCH ERA · PRIVATE</div>\n<button type="button" class="nav-link" id="ownerOverviewNav" data-target="home">⌂ <span>Dashboard</span></button>')
  .replace(markers[1],'<details class="workspace-nav-group" id="ownerWorkToolsGroup"><summary>Work tools</summary><div class="workspace-nav-items"><a class="nav-link" href="./booking-studio.html">◈ <span>Booking Studio</span></a><a class="nav-link" href="./ai-team.html">✦ <span>AI Team</span></a></div></details>\n'+markers[1])
  .replace(markers[2],markers[2]+ownerDashboardMarkup)
  .replace('</head>','<link rel="stylesheet" href="./assets/owner-dashboard.css?v=20261014-owner-leads-v2"><link rel="stylesheet" href="./assets/owner-automation-studio.css?v=20261017-owner-mobile-v2"></head>')
  .replace('</body>','<script src="./assets/owner-dashboard.js?v=20261014-owner-leads-v2" defer></script><script src="./assets/owner-automation-studio.js?v=20261017-owner-auto-v1" defer></script></body>');
});
await rewrite("assets/command-center-app.js",s=>{
 const before=s;
 const exact=(from,to)=>{if(!s.includes(from))throw Error("Owner dashboard routing anchor missing: "+from.slice(0,85));s=s.replace(from,to)};
 exact("if(workspace?.is_internal&&target==='home')target='owner-pages';","/* Owner dashboard is a dedicated private view. */");
 // Opening the prospect list should always start unfiltered. Stale search or
 // outreach filters were capable of making stored leads appear missing.
 exact(" const leadSection=['leads','calendar','clients','inbox','emails'].includes(target);",
       " if(workspace?.is_internal&&target==='leads'){$('search').value='';$('outreachFilter').value='';}\n const leadSection=['leads','calendar','clients','inbox','emails'].includes(target);");
 exact("if(target==='home'){\n if(workspace&&!workspace.is_internal)",
       "if(target==='home'){\n if(workspace?.is_internal){setView('owner-dashboard');$('ownerOverviewHub').scrollIntoView({behavior:'smooth'});return}\n if(workspace&&!workspace.is_internal)");
 exact("  setView('owner-pages');\n  const target=","  setView('owner-dashboard');\n  const target=");
 // Load the real prospect records on initial owner dashboard. The existing
 // database query remains tenant-scoped and excludes intentionally archived leads.
 exact("  hideTleLoading(); // verified owner can use navigation while purchases fetch in the background\n  await loadOwnerPages();",
       "  hideTleLoading(); // verified owner can use navigation while purchases fetch in the background\n  void load(); // fill the owner dashboard live prospect summary\n  await loadOwnerPages();");
 exact("b.dataset.target==='owner-pages'));\n  hideTleLoading()", "b.dataset.target==='home'));\n  hideTleLoading()");
 exact("const organizedTarget={'buyer-dashboard':'home'","const organizedTarget={'owner-dashboard':'home','buyer-dashboard':'home'");
 exact(" $('ownerSupportPanel').classList.toggle('hidden',v!=='owner-support'||!workspace?.is_internal);",
       " $('ownerSupportPanel').classList.toggle('hidden',v!=='owner-support'||!workspace?.is_internal);\n $('ownerOverviewHub').classList.toggle('hidden',v!=='owner-dashboard'||!workspace?.is_internal);");
 exact(" const ownerTitles={\n"," const ownerTitles={\n  'owner-dashboard':['MY PRIVATE ADMIN / OVERVIEW','Your Command Center'],\n");
 exact("['owner-pages','owner-calendar','leads','calendar','clients','inbox','emails','settings','owner-support','owner-help','notifications']",
       "['owner-dashboard','owner-pages','owner-calendar','leads','pipeline','calendar','clients','inbox','emails','settings','owner-support','owner-help','notifications']");
 exact('["owner-pages","owner-calendar","leads","pipeline","calendar"',
       '["owner-dashboard","owner-pages","owner-calendar","leads","pipeline","calendar"');
 exact('const labels={"owner-pages":"Clients & Purchases"',
       'const labels={"owner-dashboard":"Overview","owner-pages":"Clients & Purchases"');
 if(s===before)throw Error("Owner dashboard rewrite produced no change");
 return s;
});

// Owner-only per-lead delivery and consent timeline. IDs come from the authenticated CRM, not inferred names.
await rewrite("assets/command-center-app.js",s=>{
 const from="card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label','Open '+x.business);";
 if(!s.includes(from))throw Error("Lead card identity anchor changed");
 return s.replace(from,"card.tabIndex=0;card.dataset.leadId=x.id;card.setAttribute('role','button');card.setAttribute('aria-label','Open '+x.business);");
});

// CB Depot phone-only single-surface correction. The pinned upstream stays unchanged;
// use an isolated local stylesheet so owner and future tenants cannot be affected.
await copyFile(resolve("overrides/cb-depot-mobile-edge.css"),join(dest,"assets/cb-depot-mobile-edge.css"));
await rewrite("index.html",s=>{
 if(!s.includes("</head>"))throw Error("CB Depot mobile CSS injection anchor missing");
 return s.replace("</head>",'<link rel="stylesheet" href="./assets/cb-depot-mobile-edge.css?v=20261014-mobile-edge-v1"></head>');
});

// AI setup remains hosted by the website; never navigate to a missing private-host route.
await rewrite("assets/command-center-app.js",s=>s.replaceAll("'/ai-booking-assistant/owner-delivery/'","'https://thelaunchera.com/ai-booking-assistant/owner-delivery/'"));

// Owner-approved portrait and display name; preserve internal gateway identifiers.
await copyFile(resolve("overrides/jessie-avatar.webp"),join(dest,"assets/jessie-avatar.webp"));
for(const relative of ["index.html","ai-team.html","assets/command-center-app.js","assets/jessy-owner-standalone.mjs","assets/owner-dashboard.js"])
 await rewrite(relative,s=>s.replace(/\bJessy\b/g,"Jessie"));
await rewrite("assets/jessy-owner-standalone.mjs",s=>s.replaceAll("20261014-compact-alert-v1","20261016-jessie-bootfix-v2"));
await rewrite("index.html",s=>s.replaceAll("jessy-owner.js?v=20261014-compact-alert-v1","jessy-owner.js?v=20261016-jessie-bootfix-v2"));
await rewrite("assets/ai-team.js",s=>{
 const before='card.append(el("div","symbol",a.icon),el("h3","",a.name),el("p","",a[language]));';
 if(!s.includes(before))throw Error("Agent portrait anchor missing");
 return s.replace(before,'const symbol=el("div","symbol",a.icon);if(a.key==="jessie"){const portrait=document.createElement("img");portrait.src="./assets/jessie-avatar.webp?v=20261015";portrait.alt="Jessie";portrait.width=48;portrait.height=48;portrait.style.cssText="width:100%;height:100%;object-fit:cover;border-radius:inherit";symbol.style.overflow="hidden";symbol.replaceChildren(portrait)}card.append(symbol,el("h3","",a.name),el("p","",a[language]));');
});


// Scroll-only brand indicator on the private sign-in landing, never inside
// the authenticated Command Center dashboard or any buyer workspace.
await copyFile(resolve("overrides/assets/command-landing-pill.css"),join(dest,"assets/command-landing-pill.css"));
await copyFile(resolve("overrides/assets/command-landing-pill.js"),join(dest,"assets/command-landing-pill.js"));
await rewrite("index.html",s=>{
 const originalHeader='<header><b>THE LAUNCH ERA · COMMAND CENTER</b><button id="logout" class="hidden">Sign out</button></header>';
 if(!s.includes(originalHeader)||!s.includes("</head>")||!s.includes("</body>"))
  throw Error("Private sign-in header anchors changed; abort isolated floating-pill insertion");
 const newHeader='<span id="tleHeaderScrollSentinel" class="tle-header-scroll-sentinel" aria-hidden="true"></span>'
  +'<header class="tle-landing-header" aria-label="Command Center sign-in">'
  +'<span class="tle-header-surface" aria-hidden="true"></span>'
  +'<div class="tle-header-inner">'
  +'<span class="tle-header-symbol" aria-hidden="true">✳</span>'
  +'<b class="tle-header-brand"><span class="tle-header-brand-title">THE LAUNCH ERA</span>'
  +'<span class="tle-header-brand-subtitle">COMMAND CENTER</span></b>'
  +'<button id="logout" class="hidden">Sign out</button>'
  +'</div></header>';
 return s.replace(originalHeader,newHeader)
  .replace("</head>",'<link rel="stylesheet" href="./assets/command-landing-pill.css?v=20261016-v2"></head>')
  .replace("</body>",'<script src="./assets/command-landing-pill.js?v=20261016-v2" defer></script></body>');
});

// Premium week view: use only DOM-rendered, authenticated calendar records.
// Do not replace the owner's production milestones or CB Depot's real bookings.
await copyFile(resolve("overrides/assets/booking-calendar-motion.js"),join(dest,"assets/booking-calendar-motion.js"));
await copyFile(resolve("overrides/assets/booking-calendar-motion.css"),join(dest,"assets/booking-calendar-motion.css"));
await rewrite("assets/command-center-app.js",s=>{
 const patches=[
  ["const b=ownerPageElem('button');b.type='button';", "const b=ownerPageElem('button');b.type='button';b.dataset.dayKey=key;"],
  ["b.append(pill);\n  }\n  if(list.length>2)", "pill.dataset.calendarKind=event.kind;b.append(pill);\n  }\n  if(list.length>2)"],
  ["const grid=$('ownerCalGrid');grid.replaceChildren();", "const grid=$('ownerCalGrid');grid.replaceChildren();grid.dataset.monthKey=y+'-'+String(m+1).padStart(2,'0');"],
  ["const monthKey=buyerDateKey(first).slice(0,7);", "const monthKey=buyerDateKey(first).slice(0,7);grid.dataset.monthKey=monthKey;"],
  ["cell.setAttribute('role','gridcell');", "cell.setAttribute('role','gridcell');cell.dataset.dayKey=key;"]
 ];
 for(const [before,after] of patches){
  if(!s.includes(before))throw Error("Calendar safe-adapter anchor missing: "+before.slice(0,60));
  s=s.replace(before,after);
 }
 return s;
});
await copyFile(resolve("overrides/portfolio.html"),join(dest,"portfolio.html"));
await rewrite("index.html",s=>{
 const nav='<div class="nav-caption" id="ownerOrdersCaption">THE LAUNCH ERA · PRIVATE</div>';
 if(!s.includes(nav)||!s.includes("</head>")||!s.includes("</body>"))
  throw Error("Portfolio/calendar navigation anchors missing; abort");
 return s.replace(nav,nav+'\n<a class="nav-link" id="ownerPortfolioNav" href="./portfolio.html" style="text-decoration:none">◈ <span>Portfolio · Coming soon</span></a>')
  .replace("</head>",'<link rel="stylesheet" href="./assets/booking-calendar-motion.css?v=20261016-1"></head>')
  .replace("</body>",'<script src="./assets/booking-calendar-motion.js?v=20261016-1" defer></script></body>');
});

await writeFile(join(dest,"CNAME"),DOMAIN+"\n","utf8");
await writeFile(join(dest,".nojekyll"),"","utf8");
await writeFile(join(dest,"robots.txt"),"User-agent: *\nDisallow: /\n","utf8");
await writeFile(join(dest,"404.html"),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Private Command Center</title><body style="font:16px system-ui;background:#FAF8F3;color:#191919;max-width:32rem;margin:15vh auto;padding:2rem"><h1>Page unavailable</h1><p>This private Command Center page was not found. Your workspace has not been changed.</p><p><a href="/">Return to secure sign-in</a></p></body></html>\n',"utf8");
// Owner-only recurring billing overview. Stripe data comes from its own verified
// read-only Edge Function; demos remain synthetic and no charge is changed here.
await copyFile(resolve("overrides/subscriptions.html"),join(dest,"subscriptions.html"));
await rewrite("index.html",s=>{
 const marker='<div class="nav-caption" id="ownerOrdersCaption">THE LAUNCH ERA · PRIVATE</div>';
 if(!s.includes(marker))throw Error("Subscriptions owner-only navigation anchor changed");
 return s.replace(marker,marker+'\n<a class="nav-link" id="ownerSubscriptionsNav" href="./subscriptions.html" style="text-decoration:none">◈ <span>Subscriptions</span></a>');
});

// Existing client requests remain intact; the new thread and form tools use their
// own RLS-protected tables and the form publishing endpoint is separate from live legacy intakes.
await copyFile(resolve("overrides/support-tickets.html"),join(dest,"support-tickets.html"));
await copyFile(resolve("overrides/support-inbox.html"),join(dest,"support-inbox.html"));
await copyFile(resolve("overrides/form-builder.html"),join(dest,"form-builder.html"));
await copyFile(resolve("overrides/published-intake.html"),join(dest,"published-intake.html"));
await rewrite("index.html",s=>{
 const ownerAnchor='<a class="nav-link" href="./booking-studio.html">◈ <span>Booking Studio</span></a>';
 const buyerAnchor='<button type="button" class="nav-link" id="buyerSupportNav">';
 if(!s.includes(ownerAnchor)||!s.includes(buyerAnchor))throw Error("Support/Form Builder navigation anchor changed: abort");
 return s.replace(ownerAnchor,ownerAnchor+'<a class="nav-link" href="./form-builder.html">▤ <span>Form Builder</span></a><a class="nav-link" href="./support-inbox.html">♡ <span>Support Inbox</span></a>')
  .replace(buyerAnchor,'<a class="nav-link" href="./support-tickets.html">▤ <span>Support Tickets</span></a>'+buyerAnchor);
});

// Reusable no-spinner submit motion: animate only confirmed writes, not clicks or previews.
await copyFile(resolve("overrides/assets/submit-morph.css"),join(dest,"assets/submit-morph.css"));
await copyFile(resolve("overrides/assets/submit-morph.js"),join(dest,"assets/submit-morph.js"));
await rewrite("index.html",s=>{
 if(!s.includes("</head>"))throw Error("Submit-motion injection requires document head");
 return s.replace("</head>",'<link rel="stylesheet" href="./assets/submit-morph.css?v=20261016-1"><script src="./assets/submit-morph.js?v=20261016-1" defer></script></head>');
});
// Add the state change beside the EXISTING authenticated database/Edge writes.
await rewrite("assets/command-center-app.js",s=>{
 const patches=[
  ["const button=$('pricingSave');button.disabled=true;$('pricingStatus').textContent=\"Saving…\";",
   "const button=$('pricingSave');if(window.TLESubmitMotion)window.TLESubmitMotion.start(button);else button.disabled=true;$('pricingStatus').textContent=\"Saving…\";"],
  ["$('pricingStatus').textContent=\"Published · \"+new Date(v.updated_at).toLocaleString();await loadPricing();",
   "$('pricingStatus').textContent=\"Published · \"+new Date(v.updated_at).toLocaleString();window.TLESubmitMotion?.done(button);await window.TLESubmitMotion?.pause(780);await loadPricing();"],
  ["$('pricingStatus').textContent=\"Not saved: \"+e.message;showSaveToast('error'",
   "window.TLESubmitMotion?.error(button);$('pricingStatus').textContent=\"Not saved: \"+e.message;showSaveToast('error'"],
  ["'No se pudieron guardar los precios')}finally{button.disabled=false}",
   "'No se pudieron guardar los precios')}finally{if(window.TLESubmitMotion)window.TLESubmitMotion.reset(button);else button.disabled=false}"],
  ["const button=$('avSave');button.disabled=true;$('avStatus').textContent=\"Saving availability…\";",
   "const button=$('avSave');if(window.TLESubmitMotion)window.TLESubmitMotion.start(button);else button.disabled=true;$('avStatus').textContent=\"Saving availability…\";"],
  ["$('avStatus').textContent=\"Published! Available booking slots updated · \"+new Date(result.updated_at).toLocaleString();",
   "window.TLESubmitMotion?.done(button);await window.TLESubmitMotion?.pause(780);$('avStatus').textContent=\"Published! Available booking slots updated · \"+new Date(result.updated_at).toLocaleString();"],
  ["$('avStatus').textContent=\"Not saved: \"+e.message;showSaveToast('error'",
   "window.TLESubmitMotion?.error(button);$('avStatus').textContent=\"Not saved: \"+e.message;showSaveToast('error'"],
  ["finally{button.disabled=false}\n};\n\nfunction clearAdminClientState()",
   "finally{if(window.TLESubmitMotion)window.TLESubmitMotion.reset(button);else button.disabled=false}\n};\n\nfunction clearAdminClientState()"],
  ["e.preventDefault();const button=$('buildSave');button.disabled=true;$('buildStatus').textContent=",
   "e.preventDefault();const button=$('buildSave');if(window.TLESubmitMotion)window.TLESubmitMotion.start(button);else button.disabled=true;$('buildStatus').textContent="],
  ["await ownerStudioCall('save',{branding:{...formData,reviews,service_photo_paths}});\n  await loadOwnerBuilder();",
   "await ownerStudioCall('save',{branding:{...formData,reviews,service_photo_paths}});\n  window.TLESubmitMotion?.done(button);await window.TLESubmitMotion?.pause(780);\n  await loadOwnerBuilder();"],
  ["}catch(error){$('buildStatus').textContent=crmLocaleText(\"Not saved: \",\"No se guardó: \")+error.message}\n finally{button.disabled=false}",
   "}catch(error){window.TLESubmitMotion?.error(button);$('buildStatus').textContent=crmLocaleText(\"Not saved: \",\"No se guardó: \")+error.message}\n finally{if(window.TLESubmitMotion)window.TLESubmitMotion.reset(button);else button.disabled=false}"],
  ["save.disabled=true;msg.textContent=buyerPageLabel()?'Guardando fechas…':'Saving work dates…';",
   "if(window.TLESubmitMotion)window.TLESubmitMotion.start(save);else save.disabled=true;msg.textContent=buyerPageLabel()?'Guardando fechas…':'Saving work dates…';"],
  ["if(error||!data?.ok)throw error||new Error('Save not confirmed');\n  ownerCalendarBuyerPref=id;",
   "if(error||!data?.ok)throw error||new Error('Save not confirmed');\n  window.TLESubmitMotion?.done(save);await window.TLESubmitMotion?.pause(780);\n  ownerCalendarBuyerPref=id;"],
  ["}catch(error){\n  msg.textContent=(buyerPageLabel()?'No se guardaron las fechas: '",
   "}catch(error){\n  window.TLESubmitMotion?.error(save);msg.textContent=(buyerPageLabel()?'No se guardaron las fechas: '"],
  ["}finally{save.disabled=false}\n};\n$('ownerCalPrev')",
   "}finally{if(window.TLESubmitMotion)window.TLESubmitMotion.reset(save);else save.disabled=false}\n};\n$('ownerCalPrev')"],
  ["submit.disabled=true;state.textContent=buyerErrorLang('Sending…','Enviando…');",
   "if(window.TLESubmitMotion)window.TLESubmitMotion.start(submit);else submit.disabled=true;state.textContent=buyerErrorLang('Sending…','Enviando…');"],
  ["if(error)throw error;\n  state.textContent=buyerErrorLang('✓ Report received.",
   "if(error)throw error;\n  window.TLESubmitMotion?.done(submit);state.textContent=buyerErrorLang('✓ Report received."],
  ["}catch(_){\n  state.textContent=buyerErrorLang('We could not send the report.",
   "}catch(_){\n  window.TLESubmitMotion?.error(submit);state.textContent=buyerErrorLang('We could not send the report."],
  ["}finally{submit.disabled=false}\n};\n\nconst pricingEndpoint=",
   "}finally{if(window.TLESubmitMotion){setTimeout(()=>window.TLESubmitMotion.reset(submit),950)}else submit.disabled=false}\n};\n\nconst pricingEndpoint="]
 ];
 for(const [before,after] of patches){
  if(!s.includes(before))throw Error("Submit motion requires exact live handler anchor: "+before.slice(0,90));
  s=s.replace(before,after);
 }
 return s;
});

// Isolated owner AI Team upgrade ONLY: preserve the known-good, pinned private portal.
// Copy the three reviewed static files from a separately pinned, approved site commit.
// Existing owner dashboard, customer routes, domains and CRM adapters remain untouched.
const AI_SOURCE_COMMIT="827d044f0c23e8bb85b3d7b2e5cbf133752b9128";
const aiRoot=resolve("ai-upstream/public/command-center");
for(const [relative,target] of [
 ["ai-team.html","ai-team.html"],
 ["assets/ai-team.js","assets/ai-team.js"],
 ["assets/ai-team.css","assets/ai-team.css"]
]){
 if(!(await exists(join(aiRoot,relative))))throw Error("Approved AI Team file missing: "+relative);
 await copyFile(join(aiRoot,relative),join(dest,target));
}
await rewrite("ai-team.html",s=>{
 const script='<script type="module" src="./assets/ai-team.js';
 if(!s.includes(script)||!s.includes("</head>"))throw Error("Updated AI Team screen no longer supports private owner overlay");
 return s.replace("</head>",'<link rel="stylesheet" href="./assets/ai-team-easy-check.css?v=20261019-isolated-v1"></head>')
  .replace(script,'<script src="./assets/ai-team-easy-check.js?v=20261019-isolated-v1"></script>\n'+script);
});

await writeFile(join(dest,"deployment-source.json"),JSON.stringify({sourceRepository:"thelaunchera/the-launch-era-new-website-",sourceCommit:sourceId,aiTeamSourceCommit:AI_SOURCE_COMMIT,host:DOMAIN,agentFeatures:"entitlement-gated; no automatic buyer agents",marketingHost:"thelaunchera.com"},null,2)+"\n","utf8");
console.log("Prepared isolated private Command Center from pinned SHA "+sourceId);
