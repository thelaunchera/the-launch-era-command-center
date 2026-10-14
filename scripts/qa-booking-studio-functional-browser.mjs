import {chromium} from "playwright";
import assert from "node:assert/strict";
import {renderBookingStudioFunctionalPreview} from "../overrides/assets/booking-studio-functional-preview.mjs";
const job={
 tenant_id:"synthetic-test-only",order_id:"synthetic-not-paid",stage:"development",
 client:{business_name:"Synthetic Housekeeping",services:[{name:"Standard Cleaning",mode:"flat",price:120},{name:"Moving Cleaning",mode:"quote",price:null}]},
 research:{facts:[],unknowns:["Synthetic"]},
 design:{layout:"split",cards:"tiles",typography:"elegant",primary_color:"#191919",accent_color:"#B7DDF3",hero_title:"Care for your home",hero_body:"A fictional cleaning service.",photos:[{url:"https://images.unsplash.com/photo-1581578731548-c64695cc6952",usage:"hero",license:"NOT CLEARED FOR LIVE USE"}],section_order:["services","process","booking"]}
};
const html=renderBookingStudioFunctionalPreview(job);
assert(html.includes("connect-src &#39;none&#39;"),"CSP must block network requests");
assert(html.includes("form-action &#39;none&#39;"),"CSP must block real submissions");
assert(!html.includes("supabase.co"),"No backend may be embedded in preview");
const browser=await chromium.launch({headless:true});
try{
 for(const width of [375,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.setContent('<!doctype html><html><body><iframe id="preview" sandbox="allow-scripts" style="border:0;width:100%;height:850px"></iframe></body></html>');
  await page.locator("#preview").evaluate((f,markup)=>{f.srcdoc=markup},html);
  const frame=page.frameLocator("#preview");
  await frame.locator("#estimate").waitFor();
  assert.equal(await frame.locator("#estimate").textContent(),"Estimated $120.00");
  await frame.locator("#frequency").selectOption("weekly");
  assert.equal(await frame.locator("#estimate").textContent(),"Estimated $102.00");
  await frame.locator("#service").selectOption("1");
  assert.equal(await frame.locator("#estimate").textContent(),"Personalized quote required");
  await frame.locator("#guest").fill("Demo Customer");
  await frame.locator("#date").fill("2026-12-20");
  await frame.locator("#consent").check();
  await frame.locator("#simulate").click();
  assert((await frame.locator("#outcome").textContent()).includes("No booking, email or database record created."));
  const overflow=await frame.locator("body").evaluate(el=>el.scrollWidth>document.documentElement.clientWidth+2);
  assert(!overflow,"Horizontal overflow at "+width);
  await page.close();
 }
 console.log("PASS interactive personalized booking preview on phone/tablet/desktop; estimate, quote, consent, local-only confirmation, CSP.");
}finally{await browser.close()}
