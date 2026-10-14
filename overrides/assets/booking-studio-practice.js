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
 $("single-preview").hidden=compareMode;
 $("comparison").hidden=!compareMode;
 $("comparison").className="comparison "+device;
 $("compare").setAttribute("aria-pressed",String(compareMode));
 $("compare").textContent=compareMode?"Close comparison":"Compare side by side";
 if(compareMode){
  $("compare-draft").srcdoc=renderBookingStudioPreview(base,{watermark:"FICTIONAL · FIRST CONCEPT"});
  $("compare-revision").srcdoc=renderBookingStudioPreview(revised,{watermark:"FICTIONAL · REVISED CONCEPT"});
  for(const id of ["compare-draft","compare-revision"]){const f=$(id);f.style.width=device==="phone"?"390px":device==="tablet"?"768px":"100%";}
 }
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
 compareMode=!compareMode;draw();
 status(compareMode?"Side-by-side comparison of the two fictional concepts. No changes are saved.":"Single-design preview restored.");
};
$("approve").onclick=()=>{
 status("SIMULATED APPROVAL BLOCKED: This visual example has no verified photo license, complete functional QA, paid order or client tenant. In a real project, the owner can approve only after all required evidence passes. Nothing was approved or published.");
};

// Fictional front-end booking engine: intentionally NO persistence, network or email.
// Quotes always require a human confirmation; the example prices are not TLE prices.
const examplePricing=Object.freeze({standard:120,deep:null,move:null});
const discounts=Object.freeze({one_time:0,weekly:.15,biweekly:.10,monthly:.05});
const labels=Object.freeze({standard:"Everyday Home Cleaning",deep:"Deep Home Reset",move:"Moving Day Cleaning"});
const today=new Date();const yyyy=today.getFullYear(),mm=String(today.getMonth()+1).padStart(2,"0"),dd=String(today.getDate()).padStart(2,"0");
$("test-date").min=[yyyy,mm,dd].join("-");
const readFlow=()=>({
 service:$("service").value,frequency:$("frequency").value,area:$("area").value,
 property:$("property").value,oven:$("oven").checked,fridge:$("fridge").checked
});
function calculateFlow(input){
 if(!Object.hasOwn(examplePricing,input.service)||!Object.hasOwn(discounts,input.frequency)||!["miami","miami_beach"].includes(input.area)||!["house","apartment"].includes(input.property))throw Error("Unsupported test selection");
 const extras=(input.oven?25:0)+(input.fridge?20:0);
 const base=examplePricing[input.service];
 if(base===null)return {kind:"quote",total:null,extras};
 const beforeDiscount=base+(input.property==="house"?30:0)+extras;
 return {kind:"estimate",total:Math.round(beforeDiscount*(1-discounts[input.frequency])*100)/100,extras};
}
function refreshEstimate(){
 const input=readFlow(),price=calculateFlow(input);
 $("estimate").textContent=price.kind==="quote"?"Personalized quote required":"Estimated $"+price.total.toFixed(2);
 $("estimate-details").textContent=price.kind==="quote"
  ?"This service needs a personalized quote. Add-ons and property details will be reviewed before any price is confirmed."
  :"Fictional price example · "+Math.round(discounts[input.frequency]*100)+"% frequency discount · Final price subject to review.";
 $("booking-result").hidden=true;
}
for(const id of ["service","frequency","area","property","oven","fridge"])$(id).addEventListener("change",refreshEstimate);
$("test-booking").onclick=()=>{
 const name=$("guest").value.trim(),date=$("test-date").value;
 if(name.length<2||name.length>80){$("booking-result").hidden=false;$("booking-result").textContent="Enter a fictional test name (2–80 characters).";$("guest").focus();return}
 if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)||date<$("test-date").min){$("booking-result").hidden=false;$("booking-result").textContent="Select a valid date today or later.";$("test-date").focus();return}
 if(!$("practice-consent").checked){$("booking-result").hidden=false;$("booking-result").textContent="Please confirm this is a fictional test first.";return}
 const data=readFlow(),result=calculateFlow(data);
 const kind=result.kind==="quote"?"quote request":"booking request";
 $("booking-result").hidden=false;
 $("booking-result").textContent="LOCAL TEST PASSED · "+kind.toUpperCase()+" · "+name+" · "+labels[data.service]+" · "+date+" · "+(result.total===null?"Personalized quote required":"Estimated $"+result.total.toFixed(2))+". No appointment, email, payment or record was created.";
};
$("reset-booking").onclick=()=>{
 for(const id of ["service","frequency","area","property"])$(id).selectedIndex=0;
 for(const id of ["oven","fridge","practice-consent"])$(id).checked=false;
 $("guest").value="";$("test-date").value="";$("booking-result").hidden=true;refreshEstimate();
};
refreshEstimate();

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
