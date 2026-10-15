import { cp, copyFile, mkdir, readFile, writeFile, rm, stat } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";

const from=resolve("upstream/public"), dest=resolve(".site");
const sourceId="40efa83acf5c4f28f0df2aef5cd3c8d88c7de651";
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

// Owner dashboard is isolated from buyer workspaces and the marketing website.
const ownerDashboardMarkup=await readFile(resolve("overrides/owner-dashboard.html"),"utf8");
await copyFile(resolve("overrides/owner-dashboard.css"),join(dest,"assets/owner-dashboard.css"));
await copyFile(resolve("overrides/assets/owner-dashboard.js"),join(dest,"assets/owner-dashboard.js"));
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
  .replace('</head>','<link rel="stylesheet" href="./assets/owner-dashboard.css?v=20261014-owner-leads-v2"></head>')
  .replace('</body>','<script src="./assets/owner-dashboard.js?v=20261014-owner-leads-v2" defer></script></body>');
});
await rewrite("assets/command-center-app.js",s=>{
 const before=s;
 const exact=(from,to)=>{if(!s.includes(from))throw Error("Owner dashboard routing anchor missing: "+from.slice(0,85));s=s.replace(from,to)};
 exact("if(workspace?.is_internal&&target==='home')target='owner-pages';","/* Owner dashboard is a dedicated private view. */");
 exact("if(target==='home'){\n if(workspace&&!workspace.is_internal)",
       "if(target==='home'){\n if(workspace?.is_internal){setView('owner-dashboard');$('ownerOverviewHub').scrollIntoView({behavior:'smooth'});return}\n if(workspace&&!workspace.is_internal)");
 exact("  setView('owner-pages');\n  const target=","  setView('owner-dashboard');\n  const target=");
 // Load the real prospect records on initial owner dashboard. The existing
 // database query remains tenant-scoped and excludes intentionally archived leads.
 exact("  hideTleLoading(); // verified owner can use navigation while purchases fetch in the background\\n  await loadOwnerPages();",
       "  hideTleLoading(); // verified owner can use navigation while purchases fetch in the background\\n  void load(); // fill the owner dashboard live prospect summary\\n  await loadOwnerPages();");
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

await writeFile(join(dest,"CNAME"),DOMAIN+"\n","utf8");
await writeFile(join(dest,".nojekyll"),"","utf8");
await writeFile(join(dest,"robots.txt"),"User-agent: *\nDisallow: /\n","utf8");
await writeFile(join(dest,"404.html"),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Private Command Center</title><body style="font:16px system-ui;background:#FAF8F3;color:#191919;max-width:32rem;margin:15vh auto;padding:2rem"><h1>Page unavailable</h1><p>This private Command Center page was not found. Your workspace has not been changed.</p><p><a href="/">Return to secure sign-in</a></p></body></html>\n',"utf8");
await writeFile(join(dest,"deployment-source.json"),JSON.stringify({sourceRepository:"thelaunchera/the-launch-era-new-website-",sourceCommit:sourceId,host:DOMAIN,agentFeatures:"entitlement-gated; no automatic buyer agents",marketingHost:"thelaunchera.com"},null,2)+"\n","utf8");
console.log("Prepared isolated private Command Center from pinned SHA "+sourceId);
