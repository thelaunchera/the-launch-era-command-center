import {chromium} from "playwright";
import {readFileSync} from "node:fs";
import assert from "node:assert/strict";

// Real shipped CSS, synthetic CB Depot markup: never sign in or touch customer data.
const core=readFileSync(".site/assets/command-center.css","utf8");
const edge=readFileSync(".site/assets/cb-depot-mobile-edge.css","utf8");
const browser=await chromium.launch({headless:true});
try {
 for(const width of [320,360,390,430,760,820]){
  const page=await browser.newPage({viewport:{width,height:850}});
  await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>${core}</style><style>${edge}</style></head><body class="cb-depot-buyer"><div id="app">
  <div class="premium-workspace"><section class="premium-emailhub" id="buyerRequestsHub">
  <h2>Inbox &amp; Leads</h2><div class="request-layout"><div id="buyerRequestCards"><button>Customer request</button></div>
  <article class="panel" id="buyerRequestDetail"><h3>Booking details</h3>
  <div class="request-detail-grid"><div>Vehicle</div><div>Appointment</div></div>
  <div id="buyerRequestReplyArea"><textarea id="buyerRequestMessage">Confirmation draft</textarea>
  <div style="display:flex;flex-wrap:wrap;gap:9px"><button>Preview email</button><button>Save status</button><button>Send update</button></div>
  <p id="buyerRequestStatus">Choose an available time before confirming.</p></div>
  </article></div></section></div></div></body></html>`);
  const layout=await page.evaluate(()=>{
   const rect=sel=>{const r=document.querySelector(sel).getBoundingClientRect();return {x:r.x,right:r.right,width:r.width}};
   const panel=document.querySelector("#buyerRequestsHub");
   const cs=getComputedStyle(panel);
   return {viewport:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,
    workspace:rect(".premium-workspace"),outer:rect("#buyerRequestsHub"),inner:rect("#buyerRequestDetail"),
    border:cs.borderLeftWidth,radius:cs.borderTopLeftRadius,background:cs.backgroundColor,
    columns:getComputedStyle(document.querySelector(".request-layout")).gridTemplateColumns
   };
  });
  assert(layout.scrollWidth<=layout.viewport+1,"Horizontal page overflow at "+width);
  assert(layout.outer.x>=0&&layout.outer.right<=width+.5,"Outer card cut off at "+width);
  assert(layout.inner.x>=0&&layout.inner.right<=width+.5,"Inner request card cut off at "+width);
  if(width<=760){
   assert(layout.outer.x>=9&&layout.outer.x<=14,"Phone content gutter not approximately 10px at "+width+": "+layout.outer.x);
   assert(layout.outer.width>=width-30,"Outer view not full available width at "+width);
   assert(layout.border==="0px"&&layout.radius==="0px","Nested outer rounded rectangle still visible at "+width);
   assert(layout.inner.width<=layout.outer.width,"Request detail exceeds available width at "+width);
  }else{
   assert(layout.border!=="0px","Desktop page frame unexpectedly removed");
  }
  await page.close();
 }
 const owner=await browser.newPage({viewport:{width:390,height:850}});
 await owner.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${core}</style><style>${edge}</style></head><body class="crm-owner-view"><div id="app"><div class="premium-workspace"><section id="buyerRequestsHub" class="premium-emailhub">Owner preview</section></div></div></body></html>`);
 const ownerBorder=await owner.locator("#buyerRequestsHub").evaluate(n=>getComputedStyle(n).borderLeftWidth);
 assert(ownerBorder!=="0px","Owner visual layout was incorrectly modified");
 await owner.close();
 console.log("PASS CB Depot single-screen mobile gutters (320–760px), desktop preservation, tenant scope and no overflow.");
}finally{await browser.close();}
