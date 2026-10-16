import {chromium} from "playwright";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import assert from "node:assert/strict";
const root=resolve(".site");
const server=createServer(async(req,res)=>{
 try{const pathname=new URL(req.url,"http://localhost").pathname;const file=resolve(root,"."+(pathname==="/"?"/index.html":decodeURIComponent(pathname)));
 if(!file.startsWith(root+sep))throw Error("Not local");
 const data=await readFile(file);res.writeHead(200,{"Content-Type":({".html":"text/html",".css":"text/css",".js":"text/javascript",".mjs":"text/javascript",".svg":"image/svg+xml"}[extname(file)]||"application/octet-stream")});res.end(data)}
 catch{res.writeHead(404);res.end("Not found")}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [375,768,1024,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
  // Do not initialize a real client or request production data in a synthetic UI test.
  await page.route("**/assets/command-center-app.js*",r=>r.fulfill({status:200,contentType:"text/javascript",body:""}));
  await page.route("**/vendor/supabase-js-v2.57.0.umd.js",r=>r.fulfill({status:200,contentType:"text/javascript",body:"window.supabase={};"}));
  await page.route("https://**/*",r=>r.abort());
  await page.goto(origin,{waitUntil:"domcontentloaded"});
  await page.evaluate(()=>{
   document.body.classList.add("crm-owner-view");
   document.getElementById("app").classList.remove("hidden");
   document.getElementById("pipeline").classList.remove("hidden");
   const board=document.getElementById("board");
   board.replaceChildren();
   window.__fakeStageSaveCount=0;
   for(const stage of ["New","Contacted","Follow-up","Won"]){
    const lane=document.createElement("section");lane.className="lane premium-lane";lane.dataset.stage=stage;
    const label=document.createElement("div");label.className="premium-lane-head";label.innerHTML='<div class="premium-lane-label"><span class="premium-stage-dot"></span><strong>'+stage+'</strong><span class="premium-lane-count">'+(stage==="New"?1:0)+'</span></div>';
    lane.append(label);
    const stack=document.createElement("div");stack.className="premium-lane-stack";
    if(stage==="New"){
     const card=document.createElement("article");card.className="lead premium-lead";card.dataset.leadId="synthetic-only";card.tabIndex=0;card.setAttribute("role","button");
     card.innerHTML='<div class="premium-lead-upper"><span class="premium-lead-avatar">SC</span></div><strong class="premium-lead-name">Synthetic cleaning company</strong><div class="premium-stage-control"><label>MOVE TO</label><select aria-label="Stage"><option>New</option><option>Contacted</option><option>Follow-up</option><option>Won</option></select></div>';
     card.querySelector("select").addEventListener("change",()=>window.__fakeStageSaveCount++);
     stack.append(card);
    }
    lane.append(stack);board.append(lane);
   }
  });
  await page.locator(".crm-grab").first().waitFor({timeout:7000});
  await page.locator(".premium-lead").first().focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.evaluate(()=>window.__fakeStageSaveCount),1,"ArrowRight should trigger existing persisted change handler");
  assert.equal(await page.locator('#crmUpgradeFilters [data-stage-filter]').count(),5);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3);
  assert.equal(overflow,false,"Unexpected page overflow at width "+width);
  console.log("PASS owner synthetic pipeline, keyboard and layout at",width);
  await page.close();
 }
}finally{await browser?.close();await new Promise(done=>server.close(done))}
