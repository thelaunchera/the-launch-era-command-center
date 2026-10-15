import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {chromium} from "playwright";
const root=".site/assets/";
const agentCss=readFileSync(root+"ai-team.css","utf8");
const easyCss=readFileSync(root+"ai-team-easy-check.css","utf8");
const easyJs=root+"ai-team-easy-check.js";
const browser=await chromium.launch({headless:true});
const tests=[
 {name:"phone",width:390,height:844},
 {name:"small phone",width:320,height:700},
 {name:"tablet",width:768,height:1024},
 {name:"desktop",width:1280,height:850}
];
try{
 for(const test of tests){
  const page=await browser.newPage({viewport:{width:test.width,height:test.height}});
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main class="ait-layout"><section class="ait-section"><div class="ait-hero-actions"><button id="scan">Review</button></div><div class="ait-grid" id="agents"></div></section><section class="ait-runs-section" id="runs-section" style="margin-top:800px">Archived checks</section><section id="team-overview" style="margin-top:800px">Team detail</section></main></body></html>');
  await page.addStyleTag({content:agentCss});
  await page.addStyleTag({content:easyCss});
  await page.evaluate(()=>{
   for(const [i,key] of ["jessie","sales","projects","developer","qa","creative","care"].entries()){
    const c=document.createElement("article");c.className="ait-agent"+(i===0?" lead":"");c.dataset.agentKey=key;
    c.innerHTML='<span class="symbol">✓</span><h3>AI Project Manager</h3><p>Organiza intakes, activaciones y entregas.</p><div class="ait-agent-actions"><button type="button">+ Tarea</button><button class="ait-run-btn" type="button">Revisar ↗</button></div>';
    document.getElementById("agents").append(c);
   }
  });
  await page.addScriptTag({path:easyJs});
  await page.evaluate(()=>window.scrollTo(0,70));
  const initial=await page.evaluate(()=>window.scrollY);
  await page.evaluate(()=>window.TLEAITeamEasyCheck.showAgentReport("projects",{status:"success",report:{summary:"La revisión terminó correctamente.",facts:[{label:"Paid orders",value:4},{label:"Active prospects",value:12},{label:"Tasks awaiting approval",value:2},{label:"Public home",value:"ok"}],checks:[{label:"Booking demo",http_status:200}]}},"es"));
  const result=await page.evaluate(()=>{
   const items=Array.from(document.querySelectorAll(".ait-agent"));
   const result=document.querySelector(".ait-agent-inline");
   const reportParent=result?.parentElement?.dataset.agentKey;
   const buttons=Array.from(document.querySelectorAll(".ait-agent-actions button"));
   return {scroll:window.scrollY,overflow:document.documentElement.scrollWidth>innerWidth+1,
    reportParent,reportCount:document.querySelectorAll(".ait-agent-inline").length,
    details:!!result?.querySelector("details"),facts:result?.querySelectorAll(".ait-inline-fact").length,
    text:result?.textContent,buttonsVisible:buttons.every(b=>b.getBoundingClientRect().width>20),
    heights:items.map(i=>i.getBoundingClientRect().height)};
  });
  assert.equal(result.reportParent,"projects",test.name+": agent result must stay in its own card");
  assert.equal(result.reportCount,1,test.name+": only one active inline report");
  assert.equal(result.facts,3,test.name+": keep a short fact preview");
  assert.equal(result.details,true,test.name+": preserve expanded technical report");
  assert.equal(result.overflow,false,test.name+": no horizontal phone overflow");
  assert.equal(result.scroll,initial,test.name+": check must not jump away");
  assert.equal(result.buttonsVisible,true,test.name+": task and review actions remain available");
  assert.ok(result.text.includes("Solo lectura"),test.name+": truthful read-only notice");
  if(test.width<=600){
   assert.ok(result.heights.filter((_,i)=>i!==2).every(h=>h<150),test.name+": closed specialist cards must be compact");
  }
  await page.evaluate(()=>window.TLEAITeamEasyCheck.showAgentReport("qa",{status:"partial",report:{summary:"Needs review",facts:[]}},"en"));
  assert.equal(await page.locator(".ait-agent-inline").count(),1,test.name+": repeated checks replace prior expanded report");
  assert.equal(await page.locator(".ait-agent-inline").evaluate(el=>el.parentElement.dataset.agentKey),"qa",test.name+": second result targets correct agent");
  await page.evaluate(()=>window.TLEAITeamEasyCheck.showTeamScan({reports:[{status:"checked"},{status:"partial"}]},"es"));
  assert.match(await page.locator("#ait-easy-scan").innerText(),/1\/2/,test.name+": team scan must confirm outcome without a jump");
  await page.close();
  console.log("PASS: AI Team compact "+test.name+" ("+test.width+"px): inline checks, no jump or overflow");
 }
}finally{await browser.close()}
