import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,join,extname} from "node:path";
import {chromium} from "playwright";

const root=resolve(".site");
const mockSource=String.raw`
window.__mockTickets=[
 {id:"aa000001-0000-4000-a000-000000000001",workspace_id:"synthetic-workspace",business_name:"Fictional Cleaning Co",request_type:"problem",status:"open",message:"Subject: Calendar help\n\nMy calendar is not updating.",page_context:"Booking & calendar · Normal",created_at:"2026-10-15T14:00:00Z"},
 {id:"bb000001-0000-4000-a000-000000000002",workspace_id:"synthetic-workspace",business_name:"Fictional Cleaning Co",request_type:"problem",status:"resolved",message:"Subject: Fixed already\n\nMy issue has been resolved.",page_context:"Technical issue · Normal",created_at:"2026-10-14T14:00:00Z"}
];
window.__mockMessages=[];
window.__mockForms=[];
window.__mockResponses=[];
window.__mockWrites=0;
window.__qaRole=new URLSearchParams(location.search).get("qa_role")||"allowed";
window.supabase={createClient:function(){return {
 auth:{getUser:async function(){return window.__qaRole==="anonymous"?{data:{user:null},error:{message:"Not signed in"}}:{data:{user:{id:"synthetic-user",email:"qa@example.invalid"}},error:null}}},
 from:function(table){
  var clauses={},operation="read",payload;
  var query={
   select:function(){return query},eq:function(k,v){clauses[k]=v;return query},
   in:function(k,v){clauses[k]=v;return query},order:function(){return query},
   insert:function(value){operation="insert";payload=value;return query},
   update:function(value){operation="update";payload=value;return query},
   limit:async function(){
    if(table==="tle_crm_workspaces")return {data:(window.__qaRole==="owner"&&clauses.is_internal===false)||(window.__qaRole==="buyer"&&clauses.is_internal===true)?[]:[{id:"synthetic-workspace",name:"Fictional Cleaning Co",is_internal:clauses.is_internal}],error:null};
    var array=(table==="tle_crm_support_requests"?window.__mockTickets:table==="tle_crm_support_messages"?window.__mockMessages:table==="tle_owner_forms"?window.__mockForms:table==="tle_owner_form_responses"?window.__mockResponses:[]);
    return {data:array.filter(function(x){return Object.entries(clauses).every(function(kv){return Array.isArray(kv[1])?kv[1].includes(x[kv[0]]):x[kv[0]]===kv[1]})}),error:null};
   },
   single:async function(){
    if(operation==="insert"){
     window.__mockWrites++;
     var source=table==="tle_crm_support_requests"?window.__mockTickets:table==="tle_crm_support_messages"?window.__mockMessages:table==="tle_owner_forms"?window.__mockForms:table==="tle_owner_form_responses"?window.__mockResponses:null;
     if(!source)return {data:null,error:{message:"Unexpected table write "+table}};
     var number=window.__mockWrites;
     var id=table==="tle_crm_support_requests"?"cc000003-0000-4000-a000-000000000003":"synthetic-"+number;
     var record={...payload,id:id,created_at:new Date().toISOString(),submitted_at:new Date().toISOString(),status:payload.status||"open"};
     source.unshift(record);return {data:record,error:null};
    }
    if(operation==="update"){
     window.__mockWrites++;
     var source=table==="tle_crm_support_requests"?window.__mockTickets:table==="tle_owner_forms"?window.__mockForms:null;
     if(!source)return {data:null,error:{message:"Unexpected update"}};
     var found=source.find(function(x){return Object.entries(clauses).every(function(kv){return x[kv[0]]===kv[1]})});
     if(!found)return {data:null,error:{message:"Not found"}};
     Object.assign(found,payload);return {data:found,error:null};
    }
    return {data:null,error:{message:"No mutation"}};
   }
  };
  return query;
 }
}}};
`;
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  if(pathname==="/vendor/supabase-js-v2.57.0.umd.js"){
   res.writeHead(200,{"Content-Type":"application/javascript; charset=utf-8","Cache-Control":"no-store"});res.end(mockSource);return;
  }
  const safe=pathname.replace(/^\/+/,"");
  const path=resolve(join(root,safe));
  if(!path.startsWith(root+"/")){res.writeHead(403);res.end();return;}
  const bytes=await readFile(path);
  const ext=extname(path),mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml"}[ext]||"application/octet-stream";
  res.writeHead(200,{"Content-Type":mime+"; charset=utf-8","Cache-Control":"no-store"});res.end(bytes);
 }catch(e){res.writeHead(404);res.end("Not found");}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const base="http://127.0.0.1:"+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [1440,820,390]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.goto(base+"/support-tickets.html",{waitUntil:"load"});
  await page.locator("#app:not([hidden])").waitFor();
  await page.waitForFunction(()=>document.getElementById("openCount").textContent.trim()==="1");
  assert.equal((await page.locator("#openCount").textContent()).trim(),"1");
  assert.equal((await page.locator("#resolvedCount").textContent()).trim(),"1");
  if(width>=760){await page.locator("#articlesButton").click();await page.locator("#articlesDialog[open]").waitFor();assert.match(await page.locator("#articlesDialog").textContent(),/Where can I track/);await page.locator("#closeArticles").click()}
  await page.locator("#send").click();
  assert.ok(await page.locator("#subject").evaluate(el=>el.classList.contains("error")),"Empty subject must be rejected");
  assert.equal(await page.evaluate(()=>window.__mockWrites),0,"Invalid support submission wrote data");
  await page.locator("#subject").fill("Booking test problem");
  await page.locator('[data-category="Booking & calendar"]').click();
  await page.locator('[data-priority="High"]').click();
  await page.locator("#details").fill("The client booking view remains empty after refresh.");
  await page.locator("#send").click();
  await page.waitForFunction(()=>document.getElementById("openCount").textContent.trim()==="2");
  assert.equal(await page.evaluate(()=>window.__mockWrites),1,"Support sent twice");
  assert.match(await page.locator("#toast").textContent(),/CC000003/,"Ticket confirmation must show returned ID");
  assert.match(await page.locator("#list").textContent(),/Booking test problem/);
  await page.locator("#resolvedTab").click();
  assert.match(await page.locator("#list").textContent(),/Fixed already/);
  if(width<760)assert.equal(await page.locator(".right").evaluate(el=>getComputedStyle(el).borderLeftWidth),"0px");
  assert.equal(errors.length,0,"Support browser errors: "+errors.join("; "));
  await context.close();
 }
 for(const width of [1440,820,390]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.goto(base+"/form-builder.html",{waitUntil:"load"});
  await page.locator("#app:not([hidden])").waitFor();
  const initial=await page.locator("#fields .field").count();
  assert.equal(initial,5,"Expected sample draft fields");
  if(width<760){
   await page.locator("#mobileType").selectOption("dropdown");
   await page.locator("#mobileAdd").click();
   await page.locator("#mobileEdit").click();
   assert.ok(await page.locator("#properties").evaluate(el=>el.classList.contains("mobile-show")));
  }else{
   await page.locator('[data-type="dropdown"]').click();
  }
  assert.equal(await page.locator("#fields .field").count(),initial+1);
  await page.locator("#propLabel").fill("Cleaning frequency");
  await page.locator("#propOptions").fill("Weekly\nBiweekly\nMonthly");
  await page.locator("#requiredSwitch").click();
  assert.match(await page.locator("#fields .field.active").textContent(),/Cleaning frequency/);
  if(width<760)await page.locator("#closeProps").click();
  assert.match(await page.locator("#fields .field.active").textContent(),/\*/);
  await page.locator("#previewButton").click();
  assert.equal(await page.locator('#previewFields select option').filter({hasText:"Biweekly"}).count(),1,"Dropdown options must be previewable");
  await page.locator("#testPreview").click();
  assert.match(await page.locator("#previewStatus").textContent(),/Complete the required fields/);
  await page.locator("#previewFields select").last().selectOption({label:"Weekly"});
  await page.locator("#testPreview").click();
  assert.match(await page.locator("#previewStatus").textContent(),/passed/i);
  await page.locator("#closePreview").click();
  await page.locator("#publish").click();
  await page.waitForFunction(()=>!!document.querySelector("#publishedFormLink")?.value);
  assert.match(await page.locator("#publishedFormLink").inputValue(),/published-intake\.html\?f=intake-/,"Published owner form must have a real shareable URL");
  assert.equal(await page.evaluate(()=>window.__mockWrites),1,"Form publishing should save exactly one record");

  assert.equal(errors.length,0,"Form Builder browser errors: "+errors.join("; "));
  await context.close();
 }

 // Gate regressions: cross-role navigation and signed-out sessions must never render protected tools.
 const denialCases=[
  ["/support-tickets.html?qa_role=owner","owner blocked from buyer ticket form"],
  ["/support-tickets.html?qa_role=anonymous","anonymous blocked from tickets"],
  ["/form-builder.html?qa_role=buyer","buyer blocked from owner form design"],
  ["/form-builder.html?qa_role=anonymous","anonymous blocked from owner form design"],
  ["/support-inbox.html?qa_role=buyer","buyer blocked from owner support inbox"],
  ["/support-inbox.html?qa_role=anonymous","anonymous blocked from owner support inbox"]
 ];
 for(const [url,label] of denialCases){
  const context=await browser.newContext({viewport:{width:390,height:800}});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.goto(base+url,{waitUntil:"load"});
  await page.waitForFunction(()=>{const v=document.getElementById("gate").textContent;return v.includes("This page needs an active client account.")||v.includes("Only the verified The Launch Era owner")||v.includes("Private owner access required.")});
  assert.ok(await page.locator("#app").evaluate(el=>el.hidden),label);
  assert.equal(await page.evaluate(()=>window.__mockWrites),0,label+" must not write");
  assert.equal(errors.length,0,label+" browser errors: "+errors.join("; "));
  await context.close();
 }
 console.log("PASS: synthetic browser QA for Support Tickets + owner-only Form Builder on desktop, tablet and phone, including validation, accessible controls, tenant-shaped records and non-publishing drafts.");
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
