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
 await rewrite(relative,s=>s.replace(legacyIcon,"/favicon.png"));
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
await writeFile(join(dest,"CNAME"),DOMAIN+"\n","utf8");
await writeFile(join(dest,".nojekyll"),"","utf8");
await writeFile(join(dest,"robots.txt"),"User-agent: *\nDisallow: /\n","utf8");
await writeFile(join(dest,"404.html"),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Private Command Center</title><body style="font:16px system-ui;background:#FAF8F3;color:#191919;max-width:32rem;margin:15vh auto;padding:2rem"><h1>Page unavailable</h1><p>This private Command Center page was not found. Your workspace has not been changed.</p><p><a href="/">Return to secure sign-in</a></p></body></html>\n',"utf8");
await writeFile(join(dest,"deployment-source.json"),JSON.stringify({sourceRepository:"thelaunchera/the-launch-era-new-website-",sourceCommit:sourceId,host:DOMAIN,agentFeatures:"entitlement-gated; no automatic buyer agents",marketingHost:"thelaunchera.com"},null,2)+"\n","utf8");
console.log("Prepared isolated private Command Center from pinned SHA "+sourceId);
