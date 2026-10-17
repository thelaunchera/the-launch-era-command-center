/* Layout regression based on the actual published Command Center stylesheet.
   Synthetic records only: no authentication, database calls or emails. */
import assert from "node:assert/strict";
import {readFileSync,existsSync,mkdirSync} from "node:fs";
import {resolve,join} from "node:path";
import {chromium} from "playwright";
const read=x=>readFileSync(x,"utf8");
const source=read("overrides/owner-dashboard.html");
const first=source.indexOf('<section id="ownerAutomationHub"');
const last=source.indexOf('  <div class="od-bottom-grid">',first);
assert.ok(first>=0&&last>first,"Owner automations markup not located");
const markup=source.slice(first,last);
const shell=read(".site/index.html");
const allCss=[...shell.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/gi)]
  .map(m=>m[1]).filter(p=>p.startsWith("./"))
  .map(p=>join(".site",p.slice(2).split("?")[0])).filter(existsSync);
assert.ok(allCss.some(x=>x.endsWith("command-center.css")),"Main portal CSS missing");
assert.ok(allCss.some(x=>x.endsWith("owner-automation-studio.css")),"Automation CSS missing");
const browser=await chromium.launch({headless:true});
const sizes=[{width:320,height:700},{width:375,height:812},{width:390,height:844},{width:430,height:932},{width:768,height:1024},{width:1024,height:768},{width:1440,height:900}];
const out="test-results/automation-mobile";
mkdirSync(out,{recursive:true});
try{
 for(const locale of ["en","es"]){
  for(const size of sizes){
   const page=await browser.newPage({viewport:size,deviceScaleFactor:1});
   try{
    await page.setContent('<!doctype html><html lang="'+locale+'"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body class="crm-owner-view"><main id="app" class="premium-workspace"><section id="ownerOverviewHub" class="owner-overview" style="width:100%;max-width:1100px;margin:auto">'+markup+'</section></main></body></html>');
    for(const path of allCss)await page.addStyleTag({content:read(path)});
    await page.evaluate(locale=>{
     const header=document.querySelector("#ownerAutomationHub .od-auto-header p");
     const mode=document.querySelector("#ownerAutomationMode");
     const card=document.createElement("article");card.className="od-auto-lead";
     card.innerHTML='<div class="od-auto-lead-info"><strong>Desert Bloom & Shine Cleaning Co. LLC</strong><small>Pipeline: Follow-up · Permission verified</small></div>'+
      '<div class="od-auto-lead-timeline"><span class="od-auto-chip">No scheduled steps</span></div>'+
      '<div class="od-auto-actions"><label class="od-auto-switch"><input type="checkbox" checked aria-label="Auto follow-up"><span>Auto follow-up</span></label><button class="od-auto-open" type="button">Open lead →</button></div>';
     /* Use DOM construction rather than unsanitized HTML to ensure exact chip. */
     const chip=card.querySelector(".od-auto-lead-timeline");chip.replaceChildren();
     const badge=document.createElement("span");badge.className="od-auto-chip";badge.textContent=locale==="es"?"Sin etapas programadas":"No scheduled steps";chip.append(badge);
     if(locale==="es"){
       header.textContent="Revisa la cola de seguimientos reales. Solo prospectos con permiso verificado pueden recibir correos.";
       mode.textContent="Las etapas se activan cuando cumplen los requisitos";
       card.querySelector(".od-auto-lead-info small").textContent="Etapa: seguimiento · Permiso verificado";
       card.querySelector(".od-auto-switch span").textContent="Seguimiento automático";
       card.querySelector(".od-auto-open").textContent="Abrir prospecto →";
       const tabs=document.querySelectorAll("[data-automation-tabs] button");tabs[0].textContent="Prospectos";tabs[1].textContent="Cotizaciones";tabs[2].textContent="Trabajos";
     }
     document.querySelector("#ownerAutomationLeads").replaceChildren(card);
    },locale);
    const r=await page.evaluate(()=>{
     const box=selector=>{const e=document.querySelector(selector);if(!e)throw Error("Missing "+selector);const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
     const panel=box("#ownerAutomationHub"),head=box(".od-auto-header"),
       caption=box(".od-auto-header p"),refresh=box(".od-auto-refresh"),tabs=box(".od-auto-tabs"),
       card=box(".od-auto-lead"),chip=box(".od-auto-chip"),actions=box(".od-auto-actions"),
       input=box('.od-auto-switch input[type="checkbox"]');
     return {scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,panel,head,caption,refresh,tabs,card,chip,actions,input,overlap:refresh.bottom>tabs.top-6||caption.bottom>tabs.top-6};
    });
    const tag=locale+" "+size.width;
    assert.ok(r.scrollWidth<=r.viewport+1,tag+": horizontal overflow "+JSON.stringify(r));
    assert.ok(!r.overlap,tag+": Refresh or caption overlaps tabs "+JSON.stringify(r));
    assert.ok(r.head.height>=r.caption.height,tag+": fixed-height header clips text");
    assert.ok(r.refresh.width>60&&r.refresh.height>=36,tag+": Refresh should be usable");
    assert.ok(r.card.left>=r.panel.left-1&&r.card.right<=r.panel.right+1,tag+": lead card leaks outside panel");
    assert.ok(r.chip.height<60&&r.chip.width<Math.min(300,size.width),tag+": oversized oval chip");
    assert.ok(r.input.width<=22&&r.input.height<=22,tag+": checkbox inherited oversized input style");
    if(size.width<=430)assert.ok(r.card.height<235,tag+": lead card expanded vertically to "+r.card.height);
    if(size.width<=430)assert.ok(r.actions.top>=r.chip.bottom-2,tag+": action buttons overlay chip");
    if(size.width===390)await page.screenshot({path:resolve(out,"automations-"+locale+"-390.png"),fullPage:true});
    await page.evaluate(()=>document.body.classList.remove("crm-owner-view"));
    assert.equal(await page.locator("#ownerAutomationHub").isVisible(),false,tag+": buyer should not see private automation UI");
    console.log("PASS "+tag+" card="+Math.round(r.card.height)+"px chip="+Math.round(r.chip.height)+"px header="+Math.round(r.head.height)+"px");
   }finally{await page.close();}
  }
 }
}finally{await browser.close();}
