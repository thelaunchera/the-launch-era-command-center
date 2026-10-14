import {renderBookingStudioPreview} from "./booking-studio-preview.mjs";
import {renderBookingStudioFunctionalPreview} from "./booking-studio-functional-preview.mjs";
import {evaluateSyntheticFollowup} from "./booking-studio-followup-rules.mjs";
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
let version="draft",device="desktop",requestNotes="",compareMode=false,functionalMode=false;
const status=t=>{$("result").hidden=false;$("result").textContent=t};
function detail(label,value){
 const el=document.createElement("div");el.className="detail";
 const name=document.createElement("small");name.textContent=label;
 const val=document.createElement("strong");val.textContent=String(value);
 el.append(name,val);return el;
}
function friendlyResult(target,{title,subtitle,fields,footnote,icon="✓"}){
 target.replaceChildren();target.hidden=false;target.className="friendly-result";
 const head=document.createElement("div");head.style.fontSize="28px";head.textContent=icon;
 const heading=document.createElement("h3");heading.textContent=title;
 const intro=document.createElement("p");intro.textContent=subtitle;
 const grid=document.createElement("div");grid.className="details";
 for(const [key,value] of fields)grid.append(detail(key,value));
 const footer=document.createElement("p");footer.className="footnote";footer.textContent=footnote;
 target.append(head,heading,intro,grid,footer);
}
function draw(){
 const job=version==="draft"?base:revised;
 $("version-title").textContent=version==="draft"?"First concept":"Revised concept";
 $("rationale").textContent=job.design.design_rationale;
 $("draft").setAttribute("aria-pressed",String(version==="draft"));
 $("revision").setAttribute("aria-pressed",String(version==="revision"));
 for(const d of ["phone","tablet","desktop"])$(""+d).setAttribute("aria-pressed",String(d===device));
 const frame=$("preview");frame.className="frame "+device;
 frame.srcdoc=functionalMode?renderBookingStudioFunctionalPreview(job):renderBookingStudioPreview(job,{watermark:"FICTIONAL PRACTICE · NOT A REAL CLIENT"});
 $("visual-mode").setAttribute("aria-pressed",String(!functionalMode));
 $("functional-mode").setAttribute("aria-pressed",String(functionalMode));
 $("functional-note").hidden=!functionalMode;
 $("single-preview").hidden=compareMode;
 $("comparison").hidden=!compareMode||functionalMode;
 $("single-preview").hidden=compareMode&&!functionalMode;
 $("comparison").className="comparison "+device;
 $("compare").setAttribute("aria-pressed",String(compareMode));
 $("compare").textContent=compareMode?"Close comparison":"Compare side by side";
 $("compare").disabled=functionalMode;
 if(compareMode&&!functionalMode){
  $("compare-draft").srcdoc=renderBookingStudioPreview(base,{watermark:"FICTIONAL · FIRST CONCEPT"});
  $("compare-revision").srcdoc=renderBookingStudioPreview(revised,{watermark:"FICTIONAL · REVISED CONCEPT"});
  for(const id of ["compare-draft","compare-revision"]){const f=$(id);f.style.width=device==="phone"?"390px":device==="tablet"?"768px":"100%";}
 }
 $("status-chip").textContent="NOT APPROVED · DEMO";
}
$("visual-mode").onclick=()=>{functionalMode=false;draw();status("Design review: static and non-interactive.")};
$("functional-mode").onclick=()=>{functionalMode=true;compareMode=false;draw();status("Interactive fictional Booking Page enabled. Scroll within the preview to test the booking form.")};
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
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<$("test-date").min){$("booking-result").hidden=false;$("booking-result").textContent="Select a valid date today or later.";$("test-date").focus();return}
 if(!$("practice-consent").checked){$("booking-result").hidden=false;$("booking-result").textContent="Please confirm this is a fictional test first.";return}
 const data=readFlow(),result=calculateFlow(data);
 const kind=result.kind==="quote"?"quote request":"booking request";
 friendlyResult($("booking-result"),{
  title:result.kind==="quote"?"Your quote request is ready to review":"Your cleaning request looks great!",
  subtitle:"LOCAL TEST PASSED · This is how your customer could see the next step.",
  fields:[["Service",labels[data.service]],["Preferred date",new Date(date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})],["Test customer",name],["Pricing",result.total===null?"We'll prepare a personalized quote":"Estimated $"+result.total.toFixed(2)]],
  footnote:"Practice only. No appointment, email, payment or record was created.",
  icon:result.kind==="quote"?"✉":"✓"
 });
};
$("reset-booking").onclick=()=>{
 for(const id of ["service","frequency","area","property"])$(id).selectedIndex=0;
 for(const id of ["oven","fridge","practice-consent"])$(id).checked=false;
 $("guest").value="";$("test-date").value="";$("booking-result").hidden=true;refreshEstimate();
};
refreshEstimate();


const TEST_BASE="https://afyiltvdfqnuyzcqsnoh.supabase.co";
const TEST_KEY="sb_publishable_ECdkPd5gkDR55JOWEqsnPA_cJE8bENc";
const TEST_ENDPOINT=TEST_BASE+"/functions/v1/tle-booking-studio-staging-qa";
let testingToken="";
let selectedSyntheticRequest=null;
const testStatus=t=>{$("staging-result").hidden=false;$("staging-result").textContent=t};
function testingControls(ready){
 $("staging-submit").disabled=!ready;$("staging-list").disabled=!ready;
 $("testing-logout").disabled=!ready;$("testing-login").disabled=ready;
}
async function testCall(body){
 if(!testingToken)throw Error("Sign in to Testing first");
 const response=await fetch(TEST_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json",apikey:TEST_KEY,Authorization:"Bearer "+testingToken},body:JSON.stringify(body),cache:"no-store"});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||!data.ok)throw Error(data.error||"Testing request failed");
 if(data.synthetic_only!==true)throw Error("Testing backend did not confirm synthetic-only response");
 return data;
}
$("testing-login").onclick=async()=>{
 $("testing-login").disabled=true;$("testing-auth-status").textContent="Verifying Testing credentials…";
 try{
  const response=await fetch(TEST_BASE+"/auth/v1/token?grant_type=password",{method:"POST",headers:{"Content-Type":"application/json",apikey:TEST_KEY},body:JSON.stringify({email:$("test-email").value.trim(),password:$("test-password").value}),cache:"no-store"});
  const data=await response.json().catch(()=>({}));
  $("test-password").value="";
  if(!response.ok||!data.access_token)throw Error("Testing sign-in failed. Use the separate Testing password.");
  testingToken=data.access_token;
  // Verify staging owner identity before enabling any write controls.
  await testCall({action:"list"});
  testingControls(true);$("testing-auth-status").textContent="Verified Testing account. Synthetic-only database requests enabled.";
  testStatus("Testing connection verified. No request submitted yet.");
 }catch(e){testingToken="";testingControls(false);$("testing-auth-status").textContent="Testing sign-in not verified.";testStatus(e.message)}
 finally{if(!testingToken)$("testing-login").disabled=false}
};
$("testing-logout").onclick=()=>{testingToken="";$("test-password").value="";testingControls(false);$("testing-auth-status").textContent="Signed out of Testing.";testStatus("Testing token cleared from this page.");$("staging-records").replaceChildren();selectedSyntheticRequest=null;$("followup-panel").hidden=true;$("followup-message").hidden=true;$("followup-decision").hidden=true};
$("staging-submit").onclick=async()=>{
 if(!$("staging-consent").checked){testStatus("Confirm synthetic Testing consent before submission.");return}
 $("staging-submit").disabled=true;
 try{
  const addons=$("staging-addon").value?[$("staging-addon").value]:[];
  const data=await testCall({action:"submit",service_name:$("staging-service").value,service_area:$("staging-area").value,frequency:$("staging-frequency").value,addons,consent_to_contact:true});
  if(data.request?.synthetic_only!==true||data.request?.confirmed!==false||data.request?.customer_notified!==false)throw Error("Saved Testing record failed safety verification");
  friendlyResult($("staging-result"),{
   title:data.request.kind==="quote_request"?"Your practice quote is saved":"Your practice request is saved!",
   subtitle:"Everything worked in our private Testing environment.",
   fields:[["Cleaning service",data.request.service_name],["Service area",data.request.service_area],["Next step",data.request.kind==="quote_request"?"Review a personalized quote":"Review the cleaning request"],["Price",data.request.estimated_total===null?"Personalized quote":"Estimated $"+Number(data.request.estimated_total).toFixed(2)]],
   footnote:"Testing only. No real booking, email or customer notification was created.",
   icon:"✓"
  });
 }catch(e){testStatus(e.message)}finally{$("staging-submit").disabled=!testingToken}
};
$("staging-list").onclick=async()=>{
 $("staging-list").disabled=true;
 try{
  const data=await testCall({action:"list"});$("staging-records").replaceChildren();
  for(const item of data.requests||[]){
   if(item.synthetic_only!==true||item.confirmed!==false||item.customer_notified!==false)throw Error("Unsafe Testing record detected");
   const card=document.createElement("article");card.className="record-card";
   const icon=document.createElement("div");icon.style.fontSize="25px";icon.textContent=item.kind==="quote_request"?"✉":"⌂";
   const tag=document.createElement("span");tag.className="soft-status";tag.textContent=item.kind==="quote_request"?"Quote to review":"Cleaning request";
   const heading=document.createElement("h3");heading.textContent=item.service_name;
   const location=document.createElement("p");location.textContent="📍 "+item.service_area+" · "+(item.frequency||"One time").replaceAll("_"," ");
   const price=document.createElement("div");price.className="price";price.textContent=item.estimated_total===null?"Personalized quote":"Estimated $"+Number(item.estimated_total).toFixed(2);
   const date=document.createElement("p");date.textContent="Received "+new Date(item.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
   const pick=document.createElement("button");pick.className="button alt";pick.type="button";pick.textContent="Review next step →";
   pick.onclick=()=>{
    selectedSyntheticRequest={id:item.id,kind:item.kind,service_name:item.service_name,service_area:item.service_area,estimated_total:item.estimated_total,synthetic_only:item.synthetic_only,confirmed:item.confirmed,customer_notified:item.customer_notified,consent_to_contact:item.consent_to_contact,created_at:item.created_at};
    $("followup-panel").hidden=false;$("followup-message").hidden=true;$("followup-decision").hidden=true;
    $("followup-quote-ready").checked=false;$("followup-sent").value="no";$("followup-sim-time").value="";$("followup-type").value="received";$("followup-history").hidden=true;
    const decision=followupDecision();
    $("followup-decision").hidden=false;
    $("followup-decision").textContent=decision.eligible?"Ready for a draft review. Nothing will be sent.":friendlyFollowupReason(decision.reason);
    $("followup-panel").scrollIntoView({behavior:"smooth",block:"start"});
   };
   card.append(icon,tag,heading,location,price,date,pick);$("staging-records").append(card);
  }
  testStatus((data.requests||[]).length+" practice request(s) ready to explore. Nothing was sent to a customer.");
 }catch(e){$("staging-records").replaceChildren();selectedSyntheticRequest=null;$("followup-panel").hidden=true;testStatus(e.message)}finally{$("staging-list").disabled=!testingToken}
};



function friendlyFollowupReason(reason){
 if(reason.includes("24 hours"))return "Not yet — this request is new. We wait 24 hours before suggesting a follow-up.";
 if(reason.includes("14 days"))return "This request needs a personal review because it is older than 14 days.";
 if(reason.includes("Quote is not confirmed"))return "Review the quote first, then check whether a follow-up makes sense.";
 if(reason.includes("Consent"))return "A follow-up is blocked until permission to contact is verified.";
 if(reason.includes("already marked"))return "A follow-up was already marked as sent in this simulation.";
 return "A manual review is needed before preparing a follow-up.";
}

function followupDecision(){
 const when=$("followup-sim-time").value;
 const now=when?new Date(when).getTime():Date.now();
 return evaluateSyntheticFollowup(selectedSyntheticRequest,{
  now,language:$("followup-language").value,
  alreadySent:$("followup-sent").value==="yes",
  quoteReady:$("followup-quote-ready").checked
 });
}
$("check-followup").onclick=()=>{
 if(!testingToken||!selectedSyntheticRequest){testStatus("Select a verified Testing request first.");return}
 const decision=followupDecision();
 $("followup-decision").hidden=false;
 $("followup-decision").textContent=(decision.eligible?"Ready to review a draft. ":"Not ready yet. ")+(decision.eligible?"This is a practice recommendation only.":friendlyFollowupReason(decision.reason))+" No message is scheduled or sent.";
 if(decision.eligible)$("followup-type").value=decision.stage;
};

$("save-followup-draft").onclick=async()=>{
 const button=$("save-followup-draft");button.disabled=true;
 try{
  if(!testingToken||!selectedSyntheticRequest?.id)throw Error("Select a verified Testing request.");
  const decision=followupDecision();
  const stage=$("followup-type").value;
  if(stage!=="received"&&(!decision.eligible||stage!==decision.stage))throw Error("This follow-up is not ready for draft review. "+friendlyFollowupReason(decision.reason));
  if(stage==="received"&&(!selectedSyntheticRequest.consent_to_contact||!selectedSyntheticRequest.synthetic_only))throw Error("Verified Testing consent required.");
  const data=await testCall({action:"followup_save",request_id:selectedSyntheticRequest.id,stage,language:$("followup-language").value});
  $("followup-history").hidden=false;$("followup-history").textContent="✓ Draft saved for review in Testing. Nothing was sent. Reference: "+data.followup.id.slice(0,8);
 }catch(e){$("followup-history").hidden=false;$("followup-history").textContent=e.message}finally{button.disabled=false}
};
$("view-followup-history").onclick=async()=>{
 const button=$("view-followup-history");button.disabled=true;
 try{
  const data=await testCall({action:"followup_list"});
  const items=(data.followups||[]).filter(x=>x.synthetic_only===true&&x.customer_notified===false);
  $("followup-history").hidden=false;
  $("followup-history").textContent=items.length?items.length+" saved review draft(s). Nothing sent.\n"+items.map(x=>x.stage+" · "+x.language.toUpperCase()+" · "+x.status+" · "+new Date(x.created_at).toLocaleDateString()).join("\n"):"No saved review drafts yet.";
 }catch(e){$("followup-history").hidden=false;$("followup-history").textContent=e.message}finally{button.disabled=false}
};
function createFollowupPreview(item,stage,lang){
 if(!item||!["booking_request","quote_request"].includes(item.kind)||!["received","followup","quote"].includes(stage)||!["en","es"].includes(lang))throw Error("Unsupported synthetic follow-up");
 const service=String(item.service_name||"").slice(0,100);
 const area=String(item.service_area||"").slice(0,90);
 const quote=item.kind==="quote_request"||item.estimated_total===null;
 const amount=quote?null:Number(item.estimated_total);
 if(amount!==null&&(!Number.isFinite(amount)||amount<0))throw Error("Invalid Testing estimate");
 const detail=lang==="es"?(quote?"requiere una cotización personalizada":"tiene un estimado de $"+amount.toFixed(2)):(quote?"needs a personalized quote":"has an estimated price of $"+amount.toFixed(2));
 const subject=lang==="es"?(stage==="received"?"Recibimos tu solicitud":stage==="followup"?"Seguimos pendientes de tu limpieza":"Revisión de tu cotización"):(stage==="received"?"We received your request":stage==="followup"?"Checking in about your cleaning":"About your cleaning quote");
 const text=lang==="es"?
  (stage==="received"?"¡Hola! Gracias por escribirnos. Recibimos tu solicitud de "+service+" en "+area+". Este servicio "+detail+". Revisaremos los detalles antes de confirmar cualquier cita.":stage==="followup"?"¡Hola! Queríamos saber si todavía necesitas ayuda con "+service+" en "+area+". Si tus planes cambiaron, no hay problema. Estamos aquí cuando nos necesites.":"¡Hola! Sobre tu solicitud de "+service+": "+detail+". Revisaremos los detalles contigo antes de confirmar el precio y la disponibilidad."):
  (stage==="received"?"Hi there! Thanks for reaching out. We received your "+service+" request in "+area+". This service "+detail+". We'll review the details before confirming any appointment.":stage==="followup"?"Hi there! Just checking whether you still need help with "+service+" in "+area+". If your plans have changed, no worries. We're here whenever you're ready.":"Hi there! About your "+service+" request: it "+detail+". We'll review the details together before confirming pricing or availability.");
 return {subject,text};
}
$("preview-followup").onclick=()=>{
 try{
  if(!testingToken||!selectedSyntheticRequest)throw Error("Select a verified synthetic Testing request first");
  const draft=createFollowupPreview(selectedSyntheticRequest,$("followup-type").value,$("followup-language").value);
  $("followup-message").hidden=false;
  $("followup-message").className="friendly-result";
  $("followup-message").replaceChildren();
  const title=document.createElement("h3");title.textContent="Email preview · Not sent";
  const subject=document.createElement("p");const strong=document.createElement("strong");strong.textContent=draft.subject;subject.append(strong);
  const body=document.createElement("p");body.textContent=draft.text;
  const foot=document.createElement("p");foot.className="footnote";foot.textContent="No email, notification or scheduled follow-up was created.";
  $("followup-message").append(title,subject,body,foot);
 }catch(e){testStatus(e.message)}
};


const HANDOFF_ENDPOINT=SUPA+"/functions/v1/tle-booking-studio-design-handoff";
$("handoff-design").onclick=async()=>{
 const button=$("handoff-design"),notice=$("handoff-status");
 notice.hidden=false;
 if(!db){notice.textContent="Sign in to your Command Center first.";return}
 if(!window.confirm("Save this FICTIONAL design concept as a private reference in your Command Center? This does NOT create a customer project or notify anyone."))return;
 button.disabled=true;notice.textContent="Saving your private design reference…";
 try{
  const {data:{session}}=await db.auth.getSession();
  if(!session?.access_token)throw Error("Owner sign-in required.");
  const response=await fetch(HANDOFF_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+session.access_token},body:JSON.stringify({action:"transfer",version}),cache:"no-store"});
  const result=await response.json();
  if(!response.ok||!result.ok)throw Error(result.error||"Could not save the reference");
  notice.textContent="✓ Saved privately. Open Booking Studio to review it. No client was contacted.";
 }catch(e){notice.textContent=String(e.message||"Could not save the reference")}
 finally{button.disabled=false}
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
db?.auth?.onAuthStateChange(event=>{if(event==="SIGNED_OUT"){testingToken="";selectedSyntheticRequest=null;$("followup-panel").hidden=true;testingControls(false);$("practice").hidden=true;$("auth-state").textContent="Signed out. Owner access required."; $("auth-error").hidden=false;}});
verify();
