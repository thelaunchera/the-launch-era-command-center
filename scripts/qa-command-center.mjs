import { existsSync,readFileSync,statSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
const root=".site";
const required=[
"index.html","access.html","access/index.html","ai-team.html","booking-studio.html","booking-studio-qa.html","assets/booking-studio.js","assets/booking-studio-preview.mjs",
"assets/command-center-app.js","assets/command-center.css","assets/command-center-i18n.js",
"assets/ai-team.js","assets/jessy-owner.js","assets/ai-team-entry.js",
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
const read=f=>readFileSync(join(root,f),"utf8");
const index=read("index.html"),recover=read("auth-recovery.html"),ai=read("ai-team.html");
assert.ok(index.includes('id="authForm"'),"Private login form missing");
assert.ok(index.includes("./assets/command-center-app.js"),"Private application missing");
assert.ok(ai.includes("assets/ai-team.js"),"Private team entry missing");
assert.ok(ai.includes("./booking-studio.html"),"Owner AI Team must link to Booking Studio");
const studio=read("booking-studio.html"),studioJs=read("assets/booking-studio.js");
const testPage=read("booking-studio-qa.html");
assert.ok(testPage.includes("noindex,nofollow"),"Temporary staging QA must not be indexed");
assert.ok(testPage.includes("afyiltvdfqnuyzcqsnoh"),"Staging QA must target only Testing Supabase");
assert.ok(testPage.includes("tle-booking-studio-staging-qa"),"Staging QA endpoint missing");
assert.ok(!testPage.includes('id="signup"'),"Hosted staging QA must not allow public sign-up");
assert.ok(!testPage.includes("SUPABASE_SERVICE_ROLE_KEY"),"Secret key cannot be in hosted QA");
assert.ok(studio.includes("noindex,nofollow,noarchive"),"Booking Studio must not be indexed");
assert.ok(studio.includes('sandbox=""'),"Preview iframe must disable scripts");
assert.ok(studioJs.includes("db.auth.getSession"),"Booking Studio owner session required");
assert.ok(studioJs.includes("tle-booking-studio-owner"),"Owner API must be used");
assert.ok(!studioJs.includes("innerHTML="),"Unsafe HTML injection in owner studio");
assert.ok(recover.includes("/vendor/supabase-js-v2.57.0.umd.js"),"Recovery points to another host/path");
assert.ok(!recover.includes("/command-center/"),"Recovery would leave private root path");
assert.equal(read("CNAME").trim(),"command.thelaunchera.com");
for(const file of ["index.html","access.html","manifest-tle.webmanifest"]){
 assert.ok(!read(file).includes("dailinsegura17.workers.dev"),"Legacy Cloudflare favicon in "+file);
}
assert.ok(!read("sw.js").includes("/command-center/"),"Push links target stale website path");
assert.ok(read("assets/jessy-owner.js").includes('/assets/jessy-avatar.webp'),"Jessie avatar path unexpectedly changed");
assert.ok(read("assets/command-center-notification-settings.js").includes('getRegistration("/")'),"Notification preferences still use old service worker scope");
assert.ok(read("assets/command-center-app.js").includes("navigator.serviceWorker.register('/sw.js',{scope:'/'})"),"App still registers old service worker scope");
const manifest=JSON.parse(read("manifest-tle.webmanifest"));
assert.ok(manifest.start_url.startsWith("./"),"PWA must stay on command hostname");
const info=JSON.parse(read("deployment-source.json"));
assert.equal(info.sourceCommit,"40efa83acf5c4f28f0df2aef5cd3c8d88c7de651");
console.log("PASS: isolated private login, recovery, owner AI routes, CB Depot brand assets, local icons, custom domain; no external actions triggered.");
console.log("NOT VERIFIED: live buyer login / RLS / multi-tenant access / Supabase redirect allowlist / 12h policy. Require authenticated QA before customer migration.");
