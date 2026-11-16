import {readFileSync} from "node:fs";
import {chromium} from "playwright";
import assert from "node:assert/strict";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const source=readFileSync(".site/published-intake.html","utf8");
const mockSDK='<script>window.supabase={createClient:()=>({storage:{from:()=>({uploadToSignedUrl:async()=>({data:{path:"mock"},error:null})})}})};</script>';
assert(source.includes('<script src="./vendor/supabase-js-v2.57.0.umd.js"></script>'),"Media uploader needs the pinned Supabase public SDK");
const html=source.replace('<script src="./vendor/supabase-js-v2.57.0.umd.js"></script>',mockSDK);
const slug="intake-tle-paid-social-20261116",second="intake-tle-paid-website-20261116",legacy="intake-915bcc45bd454c83ab259";
async function verifyForm(formSlug,upload){
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce"});
 const page=await context.newPage(),calls=[],errors=[];
 page.on("pageerror",e=>errors.push(String(e)));
 await page.route("https://tle-qa.test/*",route=>route.fulfill({status:200,contentType:"text/html",body:html}));
 await page.route("https://bowacxhmjvrqixtwaikv.supabase.co/functions/v1/tle-published-intake",async route=>{
  const req=route.request(),data=JSON.parse(req.postData()||"{}");calls.push(data);
  const fields=[{id:"f1",type:"short",required:true,label:"Business name",width:"full",help:""},{id:"f2",type:"email",required:true,label:"Contact email",width:"half",help:""}];
  let response={ok:true};
  if(data.action==="get")response={form:{title:"Customer project intake",description:"Mock form",fields}};
  if(data.action==="submit")response={ok:true,reference:"ABCD1234",upload_response_id:"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",upload_token:"a".repeat(64)};
  if(data.action==="upload_init")response={ok:true,path:"paid-intakes/test/"+data.category+"/"+data.slot,upload_token_signed:"test-signed-upload-token"};
  if(data.action==="upload_confirm")response={ok:true};
  await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(response)});
 });
 await page.goto("https://tle-qa.test/published-intake.html?f="+formSlug,{waitUntil:"load"});
 await page.locator("#formShell").waitFor({state:"visible"});
 assert.equal(await page.locator("#mediaPanel").isVisible(),upload,"Media must be available only for paid project forms");
 await page.locator("#f-f1").fill("QA Sample Co.");
 await page.locator("#f-f2").fill("example@qa.invalid");
 if(upload){
  await page.locator("#mediaPhotos").setInputFiles({name:"original-photo.png",mimeType:"image/png",buffer:Buffer.from("valid-test-photo")});
  await page.locator("#mediaVideos").setInputFiles({name:"original-clip.mp4",mimeType:"video/mp4",buffer:Buffer.from("valid-test-video")});
  assert.equal(await page.locator(".media-item").count(),2,"Selected media should show before submitting");
 }
 await page.locator("#consent").check();
 await page.locator("#submit").click();
 await page.locator("#complete").waitFor({state:"visible",timeout:10000});
 assert.equal(calls.filter(x=>x.action==="submit").length,1,"One intake submission only");
 assert.equal(calls.filter(x=>x.action==="upload_init").length,upload?2:0,"Only paid forms initialize private uploads");
 assert.equal(calls.filter(x=>x.action==="upload_confirm").length,upload?2:0,"All uploaded media confirmed");
 assert.equal(errors.length,0,"No page JS errors: "+errors.join(", "));
 await context.close();
}
try{
 await verifyForm(slug,true);await verifyForm(second,true);await verifyForm(legacy,false);
 console.log("PASS: Paid social and website intakes support private photo and video uploads on mobile; pre-sale forms stay unchanged; no checkout or mail was invoked.");
}catch(e){console.error(e);process.exitCode=1}
finally{await browser.close();}
