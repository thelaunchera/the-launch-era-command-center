import {chromium} from "playwright";
import {createServer} from "node:http";
import {readFileSync,existsSync} from "node:fs";
import {resolve,extname} from "node:path";
import assert from "node:assert/strict";

/* Browser-only QA with completely synthetic data. All Supabase HTTP calls are intercepted. */
const root=resolve(".site");
const JOB="00000000-0000-4000-8000-000000000101";
const ORDER="00000000-0000-4000-8000-000000000102";
const WORKSPACE="00000000-0000-4000-8000-000000000103";
const records=new Map(),events=[];
const studioJob={id:JOB,booking_account_id:ORDER,client_workspace_id:WORKSPACE,stage:"research",base_version:"synthetic-v1",revision:1};
const account={id:ORDER,business_name:"Synthetic Cleaning Studio",ready:true,missing:[],delivered:false,services:[]};
const server=createServer((request,response)=>{
 const path=decodeURIComponent(new URL(request.url||"/","http://localhost").pathname);
 const file=resolve(root,"."+((path==="/")?"/index.html":path));
 if(!file.startsWith(root+"/")||!existsSync(file)){response.writeHead(404);response.end("not found");return;}
 const mime={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css"};
 response.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream","Cache-Control":"no-store"});
 response.end(readFileSync(file));
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const port=server.address().port;
const browser=await chromium.launch({headless:true});
const fulfill=(route,body,status=200)=>route.fulfill({status,contentType:"application/json",headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"},body:JSON.stringify(body)});
try{
 for(const width of [390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  page.on("dialog",dialog=>dialog.accept());
  await page.route("**/vendor/supabase-js-v2.57.0.umd.js",route=>route.fulfill({status:200,contentType:"text/javascript",body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:"synthetic-browser-qa-token"}}}),onAuthStateChange:()=>({})}})};'}));
  await page.route("https://bowacxhmjvrqixtwaikv.supabase.co/**",async route=>{
   const request=route.request();
   if(request.method()==="OPTIONS"){await route.fulfill({status:204,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"},body:""});return;}
   const url=new URL(request.url());
   const data=request.postDataJSON()||{};
   const type=url.pathname.endsWith("/tle-booking-studio-owner")?"studio":url.pathname.endsWith("/tle-booking-studio-email-review")?"emails":"blocked";
   if(type==="studio"){
    if(data.action==="list")return fulfill(route,{ok:true,jobs:[studioJob],accounts:[account]});
    if(data.action==="get"&&data.job_id===JOB)return fulfill(route,{ok:true,job:studioJob,account});
    return fulfill(route,{ok:false,error:"Mock action rejected"},403);
   }
   if(type==="emails"){
    const key=[data.job_id,data.stage,data.lang].join("|");
    if(data.job_id!==JOB)return fulfill(route,{ok:false,error:"Other tenant rejected"},403);
    const versions=records.get(key)||[];
    const latest=versions.at(-1)||null;
    if(data.action==="get")return fulfill(route,{ok:true,latest,history:[...versions].reverse()});
    if(data.action==="save"){
     assert.equal(data.expected_version,latest?.version||0,"Optimistic version checks required");
     if(latest&&latest.subject===data.subject&&latest.body===data.body)return fulfill(route,{ok:true,latest,unchanged:true});
     const row={id:"synthetic-version-"+(versions.length+1),version:versions.length+1,subject:data.subject,body:data.body,review_status:"draft",content_hash:"a".repeat(64),revision_notes:"",approved_at:null,created_at:new Date().toISOString()};
     versions.push(row);records.set(key,versions);events.push("save:"+key+":"+row.version);
     return fulfill(route,{ok:true,latest:row,version_created:true});
    }
    if(data.action==="approve"){
     assert.equal(data.version,latest?.version);
     assert.equal(data.content_hash,latest?.content_hash);
     assert.equal(latest.review_status,"draft");
     latest.review_status="approved";latest.approved_at=new Date().toISOString();events.push("approve:"+key+":"+latest.version);
     return fulfill(route,{ok:true,latest});
    }
    if(data.action==="revise"){
     assert.equal(data.version,latest?.version);
     assert.ok(data.notes);
     latest.review_status="changes_requested";latest.revision_notes=data.notes;latest.approved_at=null;
     events.push("revise:"+key+":"+latest.version);
     return fulfill(route,{ok:true,latest});
    }
   }
   return fulfill(route,{ok:false,error:"No external request permitted in synthetic QA"},403);
  });
  await page.goto("http://127.0.0.1:"+port+"/booking-studio.html");
  await page.locator("#jobs .item").first().click();
  await page.getByText("Not yet saved · Starting draft for this client").waitFor();
  await page.locator("#email-save").click();
  await page.getByText("Version 1 · draft · Saved privately").waitFor();
  await page.locator("#email-approve").click();
  await page.getByText("Version 1 · approved · Saved privately").waitFor();
  assert.equal(await page.locator("#email-approve").isDisabled(),true,"Already approved cannot be approved twice");
  await page.locator("#email-notes").fill("Make the tone warmer.");
  await page.locator("#email-revise").click();
  await page.getByText("Version 1 · changes requested · Saved privately").waitFor();
  assert.equal(await page.locator("#email-approve").isDisabled(),true,"Revision request must block reapproval");
  await page.locator("#email-body").fill("Hi there! Thanks for contacting Synthetic Cleaning Studio. We have your request.");
  await page.locator("#email-save").click();
  await page.getByText("Version 2 · draft · Saved privately").waitFor();
  await page.locator("#email-approve").click();
  await page.getByText("Version 2 · approved · Saved privately").waitFor();
  await page.locator("#email-language").selectOption("es");
  await page.getByText("Not yet saved · Starting draft for this client").waitFor();
  assert((await page.locator("#email-subject").inputValue()).includes("solicitud"));
  await page.locator("#email-save").click();
  await page.getByText("Version 1 · draft · Saved privately").waitFor();
  await page.reload();
  await page.locator("#jobs .item").first().click();
  await page.getByText("Version 2 · approved · Saved privately").waitFor();
  assert((await page.locator("#email-history").textContent()).includes("v1"),"Original version must remain in history");
  const overflow=await page.locator("body").evaluate(el=>el.scrollWidth>document.documentElement.clientWidth+2);
  assert.equal(overflow,false,"Horizontal overflow at "+width);
  await page.close();
 }
 assert.equal(events.filter(x=>x.startsWith("save:")).length,9);
 assert.equal(events.filter(x=>x.startsWith("approve:")).length,6);
 assert.equal(events.filter(x=>x.startsWith("revise:")).length,3);
 console.log("PASS: synthetic-only browser QA in mobile/tablet/desktop: save, version, approve, request changes, bilingual isolation and reload. No emails or production writes.");
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}