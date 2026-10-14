import {renderBookingStudioPreview} from "./booking-studio-preview.mjs";
/* Owner-only Practice Studio. No writes, no customer data, no persistent state. */
const $=id=>document.getElementById(id);
const SUPA="https://bowacxhmjvrqixtwaikv.supabase.co";
const KEY="sb_publishable_0TueitFYiRF3rAEMLMT8-w_FvbvY0rB";
const db=window.supabase?.createClient?.(SUPA,KEY,{auth:{storageKey:"tle-crm-auth",persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const photo="https://images.unsplash.com/photo-1581578731548-c64695cc6952";
const base={
 tenant_id:"synthetic-bright-rooms",order_id:"synthetic-not-an-order",stage:"development",
 client:{business_name:"Bright Rooms Housekeeping",services:[
  {name:"Everyday Home Cleaning",mode:"flat",price:120},
  {name:"Deep Home Reset",mode:"quote",price:null},
  {name:"Moving Day Cleaning",mode:"quote",price:null}]},
 research:{sources:[{url:"https://example.test",purpose:"fictional placeholder"}],facts:[],unknowns:["All real client facts and photo rights require verification"]},
 design:{layout:"immersive",cards:"tiles",typography:"modern",primary_color:"#191919",accent_color:"#B7DDF3",
  hero_title:"Your home, a little lighter.",hero_body:"Make room for what matters. Choose the clean that fits your day, and we'll take it from there.",
  design_rationale:"A bold, people-first photo composition with a modern voice and light-blue contrast.",
  photos:[{url:photo,usage:"hero",license:"FICTIONAL VISUAL PLACEHOLDER — NOT CLEARED FOR REAL CLIENT USE"}],
  section_order:["services","process","benefits","booking"]}};
const revised={...base,design:{...base.design,layout:"split",cards:"editorial",typography:"elegant",
 hero_title:"A little more calm, right at home.",
 hero_body:"From everyday upkeep to a deeper refresh, tell us what your space needs. We'll help with the next step.",
 design_rationale:"Owner-requested softer split editorial layout and clearer, warmer copy."}};
let version="draft",device="desktop",requestNotes="",compareMode=false;
const status=t=>{$("result").hidden=false;$("result").textContent=t};
function draw(){
 const job=version==="draft"?base:revised;
 $("version-title").textContent=version==="draft"?"First concept":"Revised concept";
 $("rationale").textContent=job.design.design_rationale;
 $("draft").setAttribute("aria-pressed",String(version==="draft"));
 $("revision").setAttribute("aria-pressed",String(version==="revision"));
 for(const d of ["phone","tablet","desktop"])$(""+d).setAttribute("aria-pressed",String(d===device));
 const frame=$("preview");frame.className="frame "+device;
 frame.srcdoc=renderBookingStudioPreview(job,{watermark:"FICTIONAL PRACTICE · NOT A REAL CLIENT"});
 $("status-chip").textContent="NOT APPROVED · DEMO";
}
$("draft").onclick=()=>{version="draft";compareMode=false;draw();status("Viewing the first fictional concept.")};
$("revision").onclick=()=>{version="revision";compareMode=false;draw();status("Viewing the fictional revision. No AI job or real approval was run.")};
for(const d of ["phone","tablet","desktop"])$(d).onclick=()=>{device=d;draw()};
$("request").onclick=()=>{
 const notes=$("notes").value.trim();
 if(notes.length<10){status("Write a specific revision request (at least 10 characters) to practice the handoff.");$("notes").focus();return}
 requestNotes=notes;version="revision";compareMode=false;draw();
 status("SIMULATED: Request changes → Creative revision → Developer rebuild → repeat QA. Your note: "+requestNotes+". This is a prepared example; no agent executed a real task.");
};
$("compare").onclick=()=>{
 compareMode=!compareMode;
 version=version==="draft"?"revision":"draft";draw();
 status("Comparison mode: use First concept and Revised concept to inspect both layouts. No changes are saved.");
};
$("approve").onclick=()=>{
 status("SIMULATED APPROVAL BLOCKED: This visual example has no verified photo license, complete functional QA, paid order or client tenant. In a real project, the owner can approve only after all required evidence passes. Nothing was approved or published.");
};
async function verify(){
 try{
  if(!db)throw Error("Sign-in unavailable");
  const {data:{session},error}=await db.auth.getSession();
  if(error||!session?.access_token)throw Error("Not signed in");
  const response=await fetch(SUPA+"/functions/v1/tle-booking-studio-owner",{method:"POST",headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+session.access_token},body:JSON.stringify({action:"list"}),cache:"no-store"});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.ok!==true||data.owner_only!==true)throw Error("Owner authorization failed");
  $("auth-state").textContent="Owner access verified. This Practice Studio is completely separate from paid projects.";
  $("practice").hidden=false;draw();
 }catch{
  $("auth-state").textContent="Private owner verification required.";
  $("auth-error").hidden=false;$("practice").hidden=true;
 }
}
db?.auth?.onAuthStateChange(event=>{if(event==="SIGNED_OUT"){$("practice").hidden=true;$("auth-state").textContent="Signed out. Owner access required."; $("auth-error").hidden=false;}});
verify();
