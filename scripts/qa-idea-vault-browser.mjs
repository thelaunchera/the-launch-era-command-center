import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve,extname,sep } from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const root=resolve(".site");
const mock="\n(function(){\n const rows=[];\n window.supabase={createClient:function(){\n  return {\n   auth:{getUser:async()=>({data:{user:{id:'synthetic-owner'}},error:null})},\n   from:function(table){\n    let action='read',payload=null;\n    const filters={};\n    function result(){\n     if(table==='tle_crm_workspaces')return {data:location.search.includes('buyer=1')?[]:[{id:'synthetic-workspace'}],error:null};\n     if(table!=='tle_owner_ideas')return {data:[],error:null};\n     if(action==='insert'){\n      const entry={...payload,id:'synthetic-'+String(rows.length+1),created_at:new Date().toISOString()};\n      rows.unshift(entry);return {data:entry,error:null}\n     }\n     if(action==='update'){\n      const entry=rows.find(x=>x.id===filters.id);\n      if(!entry)return {data:null,error:{message:'Not found'}};\n      Object.assign(entry,payload);return {data:entry,error:null}\n     }\n     return {data:rows.map(x=>({...x})),error:null}\n    }\n    const query={\n     select(){return this},eq(name,value){filters[name]=value;return this},order(){return this},\n     limit(){return Promise.resolve(result())},insert(value){action='insert';payload=value;return this},\n     update(value){action='update';payload=value;return this},\n     single(){return Promise.resolve(result())},\n     then(resolve){return Promise.resolve(result()).then(resolve)}\n    };\n    return query;\n   }\n  };\n }};\n})();";
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml"};
const server=createServer(async(req,res)=>{
 const pathName=new URL(req.url,"http://localhost").pathname;
 if(pathName==="/vendor/supabase-js-v2.57.0.umd.js"){res.writeHead(200,{"Content-Type":"text/javascript; charset=utf-8"});res.end(mock);return}
 const p=resolve(root,"."+decodeURIComponent(pathName));
 if(!p.startsWith(root+sep)){res.writeHead(403);res.end();return}
 try{const contents=await readFile(p);res.writeHead(200,{"Content-Type":mime[extname(p)]||"application/octet-stream"});res.end(contents)}
 catch{res.writeHead(404);res.end("Not found")}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const port=server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const width of [390,820,1440]){
  const context=await browser.newContext({viewport:{width,height:800},acceptDownloads:true});
  const page=await context.newPage();
  await page.goto("http://127.0.0.1:"+port+"/idea-vault.html",{waitUntil:"load"});
  await page.waitForFunction(()=>document.getElementById("vaultApp")?.hidden===false);
  await page.locator("#ideaBody").fill("Jessie should explain services like a real person");
  await page.locator("#saveIdea").click();
  await page.waitForFunction(()=>document.querySelectorAll(".idea-card").length===1);
  assert.equal(await page.locator("#metricInbox").textContent(),"1","Saved inbox count must reflect real records");
  await page.locator("#ideaSearch").fill("not-this-idea");
  assert.equal(await page.locator(".idea-card").isHidden(),true,"Search should exclude mismatched ideas");
  await page.locator("#ideaSearch").fill("");
  await page.locator("#areaFilter").selectOption("ai_assistants");
  assert.equal(await page.locator(".idea-card").isVisible(),true,"Capture should suggest AI area");
  await page.locator(".idea-edit").click();
  await page.locator(".idea-editor textarea").fill("Jessie needs a better welcome message");
  await page.locator(".idea-edit-save").click();
  await page.waitForFunction(()=>document.querySelector(".idea-card h3")?.textContent.includes("better welcome"));
  await page.locator(".idea-fields select").nth(2).selectOption("sales");
  await page.locator(".idea-fields select").nth(1).selectOption("approved");
  await page.locator('.filter[data-filter="approved"]').click();
  await page.waitForFunction(()=>document.querySelector(".idea-card")?.hidden===false);
  assert.equal(await page.locator("#metricApproved").textContent(),"1","Approved count must update");
  const downloaded=page.waitForEvent("download");
  await page.locator("#exportIdeas").click();
  const backup=await downloaded;
  assert.ok(backup.suggestedFilename().endsWith(".json"),"Backup must be a JSON download");
  const scroll=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(scroll<=2,"Idea Vault overflow on "+width+"px: "+scroll);
  await page.locator("#ideaBody").fill("An unfinished thought I must not lose");
  await page.reload();
  await page.waitForFunction(()=>document.getElementById("vaultApp")?.hidden===false);
  assert.equal(await page.locator("#ideaBody").inputValue(),"An unfinished thought I must not lose","Unsent draft must survive a refresh");
  await context.close();
 }
 const context=await browser.newContext();
 const page=await context.newPage();
 await page.goto("http://127.0.0.1:"+port+"/idea-vault.html?buyer=1");
 await page.waitForFunction(()=>document.getElementById("startup")?.classList.contains("error"));
 assert.equal(await page.locator("#vaultApp").isHidden(),true,"Buyer must not access the owner Vault");
 await context.close();
 console.log("PASS: owner-only Idea Vault, save, smart area, edit, status, search, export, draft recovery and responsive 390/820/1440.");
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
