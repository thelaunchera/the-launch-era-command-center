import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import assert from "node:assert/strict";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const read=p=>readFileSync(".site/"+p,"utf8");
const mock=(role)=>String.raw`
<script>
window.__tickets=[
{id:"11111111-1111-1111-1111-111111111111",message:"Subject: Existing booking issue\n\nThe appointment calendar did not load.",request_type:"problem",status:"open",created_at:"2026-10-12T14:00:00Z",page_context:"Booking & calendar · Normal"},
{id:"22222222-2222-2222-2222-222222222222",message:"Subject: Fixed account issue\n\nThe issue was resolved by support.",request_type:"problem",status:"resolved",created_at:"2026-10-11T14:00:00Z",page_context:"Account · Normal"}];
window.__forms=[];
window.__messages=[];
window.__writes=[];
window.supabase={createClient:function(){return{
 auth:{getUser:async()=>({data:{user:{id:"qa-user-123",email:"qa@example.invalid"}},error:null})},
 from:function(table){
  const filters={};
  const q={
   select:function(){return this},
   eq:function(k,v){filters[k]=v;return this},
   in:function(){return this},
   order:function(){return this},
   limit:async function(){
    if(table==="tle_crm_workspaces"){
     const ws={id:"qa-workspace",name:"Synthetic workspace",is_internal:ROLE,created_by:"qa-user-123"};
     return {error:null,data:("is_internal" in filters && filters.is_internal!==ws.is_internal)?[]:[ws]};
    }
    if(table==="tle_crm_support_requests")return{error:null,data:window.__tickets};
    if(table==="tle_crm_support_messages")return{error:null,data:window.__messages};
    if(table==="tle_owner_forms")return{error:null,data:window.__forms};
    if(table==="tle_owner_form_responses")return{error:null,data:[]};
    throw Error("Unexpected QA table: "+table);
   },
   insert:function(row){
    if(table==="tle_owner_forms"){
     if(!ROLE)throw Error("Buyer attempted to publish owner form");
     const v={id:"qa-form-001",...row};
     window.__forms.unshift(v);
     window.__writes.push({table,action:"insert",data:structuredClone(v)});
     return {select:function(){return this},single:async function(){return{error:null,data:v}}};
    }
    if(table==="tle_crm_support_requests"){
     const id="99999999-9999-9999-9999-999999999999";
     window.__tickets.unshift({id,...row,status:"open",created_at:new Date().toISOString()});
     window.__writes.push({table,action:"insert",data:structuredClone(row)});
     return{select:function(){return this},single:async function(){return{error:null,data:{id}}}};
    }
    throw Error("Unexpected QA insertion into "+table);
   },
   update:function(row){
    if(table!=="tle_owner_forms"||!ROLE)throw Error("Unapproved table or role in QA update");
    return {eq:function(){return this},select:function(){return this},single:async function(){
     const v=Object.assign(window.__forms[0],structuredClone(row));
     window.__writes.push({table,action:"update",data:structuredClone(row)});
     return{error:null,data:v};
    }};
   }
  };
  return q;
 }
}}};
</script>
`.replaceAll("ROLE",role==="owner"?"true":"false");

async function open(page,path,role){
 const source=read(path);
 const html=source.replace(/<script src="\.\/vendor\/supabase-js-v2\.57\.0\.umd\.js"><\/script>/,mock(role));
 assert.notEqual(source,html,"Synthetic authentication must replace vendor runtime");
 await page.route("https://tle-qa.test/*",route=>route.fulfill({status:200,contentType:"text/html",body:html}));
 await page.goto("https://tle-qa.test/"+path,{waitUntil:"load",timeout:30000});
 await page.locator("#gate").waitFor({state:"hidden",timeout:12000});
}

try{
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:"reduce"});
 await open(page,"form-builder.html","owner");
 assert.equal(await page.locator(".field").count(),5,"Owner draft starts with five sample fields");
 await page.locator(".palette-button").filter({hasText:"Dropdown"}).click();
 assert.equal(await page.locator(".field").count(),6,"Palette click should insert a field");
 await page.locator("#propLabel").fill("Which service?");
 await page.locator("#propOptions").fill("Home cleaning\nOffice cleaning");
 assert.match(await page.locator(".field.active [data-part=label]").innerText(),/Which service/);
 await page.locator("#requiredSwitch").click();
 assert.equal(await page.locator("#requiredSwitch").getAttribute("aria-checked"),"true");
 await page.locator("#full").click();
 assert.equal(await page.locator(".field.active").getAttribute("data-width"),"full");
 await page.locator("#previewButton").click();
 const dd=page.locator("#previewFields select").last();
 assert.equal(await dd.locator("option").count(),3,"Required dropdown has an empty prompt plus real choices");
 await page.locator("#closePreview").click();
 await page.locator("#remove").click();
 assert.equal(await page.locator(".field").count(),5,"Delete should restore field count");
 await page.locator("#publish").click();
 await page.waitForFunction(()=>window.__forms.length===1&&window.__forms[0].status==="published");
 const published=await page.evaluate(()=>structuredClone(window.__forms[0]));
 assert.equal(published.created_by,"qa-user-123","Published form must belong to signed-in owner");
 assert.equal(published.fields.length,5,"Publishing preserves all five configured fields");
 assert.equal(published.draft_fields.length,5,"Draft and published snapshots start equivalent");
 assert.match(await page.locator("#publishedFormLink").inputValue(),/published-intake\.html\?f=intake-/);
 assert.match(await page.locator("#message").innerText(),/Form is published/i);
 await page.locator('[data-mode="Build"]').click();
 await page.locator(".field").first().click();
 await page.locator("#propLabel").fill("Edited after publication");
 assert.equal(await page.evaluate(()=>window.__forms[0].fields[0].label),published.fields[0].label,"Unpublished local edits must not alter public snapshot");
 await page.locator('[data-mode="Share"]').click();
 await page.getByRole("button",{name:"Save cloud draft"}).click();
 await page.waitForFunction(()=>window.__forms[0]?.draft_fields?.[0]?.label==="Edited after publication");
 assert.equal(await page.evaluate(()=>window.__forms[0].fields[0].label),published.fields[0].label,"Saving draft must preserve prior public version");
 assert.equal(await page.evaluate(()=>window.__writes.some(x=>x.table==="tle_crm_support_requests")),false,"Publishing must never create support tickets");
 await page.setViewportSize({width:390,height:844});
 await page.locator("#mobileControls").waitFor({state:"visible",timeout:5000});
 await page.locator("#mobileType").selectOption("checkbox");
 await page.locator("#mobileAdd").click();
 assert.equal(await page.locator(".field").count(),6,"Mobile add field works");
 await page.locator("#mobileEdit").click();
 assert.equal(await page.locator("#properties").isVisible(),true);
 await page.locator("#closeProps").click();

 const ticket=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:"reduce"});
 await open(ticket,"support-tickets.html","buyer");
 assert.equal(await ticket.locator("#openCount").innerText(),"1");
 assert.equal(await ticket.locator("#resolvedCount").innerText(),"1");
 await ticket.locator("#resolvedTab").click();
 assert.match(await ticket.locator("#list").innerText(),/Fixed account issue/);
 await ticket.locator("#openTab").click();
 await ticket.locator("#send").click();
 assert.match(await ticket.locator("#subject").getAttribute("class"),/error/);
 await ticket.locator("#subject").fill("Booking calendar issue");
 await ticket.locator("#details").fill("Customers cannot select an available appointment on mobile.");
 await ticket.locator("[data-category='Booking & calendar']").click();
 await ticket.locator("[data-priority='High']").click();
 await ticket.locator("#send").click();
 await ticket.waitForFunction(()=>document.getElementById("openCount").textContent==="2");
 assert.match(await ticket.locator("#toast").innerText(),/Ticket (received|saved)/,"A saved ticket counts as success even when Jessy falls back to human support");
 assert.match(await ticket.locator("#list").innerText(),/Booking calendar issue/);
 assert.equal(await ticket.evaluate(()=>window.__tickets[0].page_context),"Booking & calendar · High");
 await ticket.setViewportSize({width:390,height:844});
 assert.equal(await ticket.locator(".layout").evaluate(x=>getComputedStyle(x).display),"flex","Phone layout must stack ticket list and form");
 await ticket.close();await page.close();

 const deny=await browser.newPage();
 const denied=read("form-builder.html").replace('<script src="./vendor/supabase-js-v2.57.0.umd.js"></script>',mock("buyer"));
 assert.notEqual(denied,read("form-builder.html"),"Buyer auth mock must be installed");
 await deny.route("https://tle-denied.test/*",route=>route.fulfill({status:200,contentType:"text/html",body:denied}));
 await deny.goto("https://tle-denied.test/form-builder.html",{waitUntil:"load"});
 await deny.waitForTimeout(300);
 assert.equal(await deny.locator("#app").isHidden(),true);
 assert.match(await deny.locator("#gate").innerText(),/owner/i);
 await deny.close();
 console.log("PASS: owner Form Builder editing, dropdown validation, mobile controls, owner-only cloud publishing, immutable snapshots, mobile editing and isolated buyer support.");
}catch(error){console.error(error);process.exitCode=1}
finally{await browser.close()}
