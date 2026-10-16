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
window.supabase={createClient:function(){return{
 auth:{getUser:async()=>({data:{user:{id:"qa-user-123",email:"qa@example.com"}},error:null})},
 from:function(table){return {
 select:function(){return this},
 eq:function(){return this},
 order:function(){return this},
 limit:async function(){return{error:null,data:table==="tle_crm_workspaces"?[{id:"qa-workspace",name:"Synthetic Buyer",is_internal:ROLE}]:window.__tickets}},
 insert:async function(row){window.__tickets.unshift({id:"99999999-9999-9999-9999-999999999999",...row,status:"open",created_at:new Date().toISOString()});return{error:null}}
 }}}
}}};
</script>
`.replace("ROLE",role==="owner"?"true":"false");

async function open(page,path,role){
 const source=read(path);
 const html=source.replace(/<script src="\.\/vendor\/supabase-js-v2\.57\.0\.umd\.js"><\/script>/,mock(role));
 assert.notEqual(source,html,"Synthetic authentication must replace vendor runtime");
 await page.setContent(html,{waitUntil:"load",timeout:30000});
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
 assert.match(await page.locator("#message").innerText(),/Publishing is not connected yet/i);
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.locator("#mobileControls").isVisible(),true);
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
 assert.equal(await ticket.locator("#subject").getAttribute("class")?.then(x=>x.includes("error")),true);
 await ticket.locator("#subject").fill("Booking calendar issue");
 await ticket.locator("#details").fill("Customers cannot select an available appointment on mobile.");
 await ticket.locator("[data-category='Booking & calendar']").click();
 await ticket.locator("[data-priority='High']").click();
 await ticket.locator("#send").click();
 await ticket.locator("#openCount").getByText("2").waitFor();
 assert.match(await ticket.locator("#toast").innerText(),/Ticket received/);
 assert.match(await ticket.locator("#list").innerText(),/Booking calendar issue/);
 assert.equal(await ticket.evaluate(()=>window.__tickets[0].page_context),"Booking & calendar · High");
 await ticket.setViewportSize({width:390,height:844});
 assert.equal(await ticket.locator(".layout").evaluate(x=>getComputedStyle(x).display),"flex","Phone layout must stack ticket list and form");
 await ticket.close();await page.close();

 const deny=await browser.newPage();
 const content=read("form-builder.html").replace(/<script src="\.\/vendor\/supabase-js-v2\.57\.0\.umd\.js"><\/script>/,mock("buyer").replace("is_internal:ROLE","is_internal:false"));
 // Builder owner query is authenticated; a buyer workspace must not satisfy internal access.
 // Mock below simulates RLS returning no internal workspace.
 const denied=content.replace('[{id:"qa-workspace",name:"Synthetic Buyer",is_internal:false}]','[]');
 await deny.setContent(denied,{waitUntil:"load"});
 await deny.waitForTimeout(300);
 assert.equal(await deny.locator("#app").isHidden(),true);
 assert.match(await deny.locator("#gate").innerText(),/owner/i);
 await deny.close();
 console.log("PASS: owner Form Builder editing, dropdown validation, mobile controls, blocked publish and buyer support ticket flow.");
}catch(error){console.error(error);process.exitCode=1}
finally{await browser.close()}
