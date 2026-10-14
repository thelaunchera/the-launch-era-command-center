import {renderBookingStudioPreview} from "./booking-studio-preview.mjs";
/* Booking Studio · owner-only companion UI. Backend enforces every permission. */
const $=id=>document.getElementById(id);
const SUPA="https://bowacxhmjvrqixtwaikv.supabase.co";
const PUBLISHABLE="sb_publishable_0TueitFYiRF3rAEMLMT8-w_FvbvY0rB";
const endpoint=SUPA+"/functions/v1/tle-booking-studio-owner";
const emailEndpoint=SUPA+"/functions/v1/tle-booking-studio-email-review";
const clientReviewEndpoint=SUPA+"/functions/v1/tle-client-review";
const clientInviteEndpoint=SUPA+"/functions/v1/tle-booking-studio-review-invite";
const db=window.supabase?.createClient?.(SUPA,PUBLISHABLE,{auth:{storageKey:"tle-crm-auth",persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const qaIds=["tenant_isolation","payment_verified","intake_verified","assets_licensed","brand_accuracy","no_invented_claims","services_and_prices","booking_and_quote","frequency_and_addons","service_area","email_permissions","links","mobile","tablet","desktop","accessibility","en_es","customer_data_protected"];
let state={jobs:[],accounts:[],selected:null,account:null};
const setText=(id,value)=>{$(id).textContent=String(value??"")};
const showMessage=(text,error=false)=>{const el=$("message");el.hidden=false;el.textContent=String(text);el.style.background=error?"#fff1ef":"#f1f7fb";el.style.color=error?"#9b4136":"#34566d"};
const errText=e=>String(e?.message||"Request unavailable");
async function api(payload,target=endpoint){
 if(!db)throw Error("Owner authentication is unavailable");
 const {data:{session},error}=await db.auth.getSession();
 if(error||!session?.access_token)throw Error("Please sign in to your private Command Center first.");
 const response=await fetch(target,{method:"POST",headers:{"Content-Type":"application/json",apikey:PUBLISHABLE,Authorization:"Bearer "+session.access_token},body:JSON.stringify(payload),cache:"no-store"});
 const data=await response.json().catch(()=>({error:"Invalid server response"}));
 if(!response.ok||!data.ok)throw Error(data.error||"Request failed");
 return data;
}
function addButton(parent,label,subtitle,fn,disabled=false){
 const button=document.createElement("button");button.type="button";button.className="item";button.disabled=disabled;
 const title=document.createElement("strong");title.textContent=label;
 const small=document.createElement("small");small.textContent=subtitle;
 button.append(title,small);button.onclick=fn;parent.append(button);
}
function paintLists(){
 const accounts=$("accounts"),jobs=$("jobs");accounts.replaceChildren();jobs.replaceChildren();
 if(!state.accounts.length)accounts.textContent="No linked paid booking accounts were found.";
 for(const a of state.accounts){
  const existing=state.jobs.find(j=>j.booking_account_id===a.id);
  addButton(accounts,a.business_name||"Booking project",a.delivered?"Already delivered":existing?"Studio project already started":a.ready?"Ready for owner start approval":"Missing: "+a.missing.join(", "),()=>existing?openJob(existing.id):start(a.id),a.delivered||(!a.ready&&!existing));
 }
 if(!state.jobs.length)jobs.textContent="No Booking Studio projects yet.";
 for(const j of state.jobs)addButton(jobs,j.booking_account_id,"Stage: "+j.stage+" · revision "+j.revision,()=>openJob(j.id));
}
async function refresh(){
 const r=await api({action:"list"});state.jobs=r.jobs||[];state.accounts=r.accounts||[];paintLists();
}
async function start(id){
 if(!window.confirm("Start an internal Booking Studio project for this paid, completed intake? This does not publish or contact the client."))return;
 try{const r=await api({action:"start",account_id:id,owner_start_approved:true});await refresh();await openJob(r.job.id);showMessage("Project started. Research evidence is required next.")}catch(e){showMessage(errText(e),true)}
}
async function openJob(id){
 try{const r=await api({action:"get",job_id:id});state.selected=r.job;state.account=r.account;paintProject();await Promise.all([loadEmailReview(),loadClientReview()])}catch(e){showMessage(errText(e),true)}
}
function paintProject(){
 const j=state.selected;if(!j)return;
 $("empty").hidden=true;$("project").hidden=false;
 setText("stage","STAGE · "+j.stage.replaceAll("_"," "));
 setText("project-title",state.account?.business_name||"Booking Studio project");
 setText("project-detail","Master: "+j.base_version+" · revision "+j.revision+" · owner-only private workflow");
 const descriptions={
 research:"Creative must verify sources and record what is known versus unknown.",
 creative:"Creative prepares a distinct layout, real imagery with rights, and client-specific copy.",
 development:"Developer must produce a private build with source evidence. No publishing.",
 qa:"QA must record all 18 checks with real evidence; failures return to Developer.",
 owner_review:"Jessie presents the verified private build for your decision.",
 approved:"Approved internally. A separate, explicit publish approval is still required."
 };
 setText("project-note",descriptions[j.stage]||"No external actions enabled.");
 for(const id of ["research-form","design-form","build-form","qa-form","review-form","approved-state"])$(id).hidden=true;
 $("preview-button").hidden=!["development","qa","owner_review","approved"].includes(j.stage)||!j.design?.hero_title;
 $("preview-wrap").hidden=true;
 $("preview-frame").srcdoc="";
 const form={research:"research-form",creative:"design-form",development:"build-form",qa:"qa-form",owner_review:"review-form"}[j.stage];
 if(form)$(form).hidden=false;
 if(j.stage==="approved")$("approved-state").hidden=false;
 if(j.stage==="qa")renderQa();
}
function renderQa(){
 const holder=$("qa-checks");holder.replaceChildren();
 for(const id of qaIds){
  const label=document.createElement("label");label.className="qa-row";
  const input=document.createElement("input");input.type="checkbox";input.name="qa_"+id;
  const span=document.createElement("span");span.textContent=id.replaceAll("_"," ");
  const evidence=document.createElement("input");evidence.name="evidence_"+id;evidence.placeholder="Specific evidence or test report reference";evidence.setAttribute("aria-label","Evidence for "+id.replaceAll("_"," "));
  const group=document.createElement("div");group.className="qa-check";label.append(input,span);group.append(label,evidence);holder.append(group);
 }

}
async function submit(action,payload){
 try{
  const r=await api({action,job_id:state.selected.id,...payload});
  await refresh();await openJob(r.job.id);
  showMessage(action==="qa"&&r.failed?.length?"QA failed: "+r.failed.join(", ")+". Returned to Developer.":"Stage recorded. No external actions were performed.");
 }catch(e){showMessage(errText(e),true)}
}
$("intake-research").onclick=async()=>{
 const button=$("intake-research");button.disabled=true;
 setText("intake-research-status","Preparing a research brief from the completed customer intake…");
 try{
  const r=await api({action:"research_from_intake",job_id:state.selected.id});
  await refresh();await openJob(r.job.id);
  showMessage("Intake research saved. AI Creative can now draft a unique design. External brand and photo verification is still required.");
 }catch(e){setText("intake-research-status","Intake research unavailable: "+errText(e))}
 finally{button.disabled=false}
};
$("research-form").onsubmit=e=>{
 e.preventDefault();const d=new FormData(e.currentTarget);
 const url=String(d.get("url")||"").trim(),fact=String(d.get("fact")||"").trim();
 submit("research",{research:{sources:[{url,purpose:"Client brand research"}],facts:[{claim:fact,source_url:url}],unknowns:String(d.get("unknowns")||"").split("\n").filter(Boolean)}});
};
$("creative-generate").onclick=async()=>{
 const button=$("creative-generate");button.disabled=true;
 setText("creative-status","AI Creative is preparing a draft from the verified research…");
 try{
  const result=await api({action:"creative_suggest",job_id:state.selected.id});
  const form=$("design-form"),d=result.suggestion;
  for(const key of ["layout","cards","typography","primary_color","accent_color","hero_title","hero_body","design_rationale"]){
   const control=form.elements.namedItem(key);if(control)control.value=d[key]||"";
  }
  setText("creative-status","AI draft ready. Photo direction: "+(d.photo_direction||"Use a licensed image matching the business.")+" Add a licensed photo and review all copy before saving.");
 }catch(e){setText("creative-status","AI Creative unavailable: "+errText(e))}
 finally{button.disabled=false}
};
$("design-form").onsubmit=e=>{
 e.preventDefault();const d=new FormData(e.currentTarget);
 const fields=Object.fromEntries(d.entries());
 submit("design",{design:{...fields,photos:[{url:fields.photo_url,license:fields.photo_license,usage:"hero"}],section_order:["services","benefits","process","booking"]}});
};
$("build-form").onsubmit=e=>{
 e.preventDefault();const d=new FormData(e.currentTarget);
 submit("build",{build:{private_preview_id:String(d.get("private_preview_id")||""),artifact_commit:String(d.get("artifact_commit")||""),tenant_id:state.selected.client_workspace_id,published:false,client_notified:false}});
};
$("qa-form").onsubmit=e=>{
 e.preventDefault();const d=new FormData(e.currentTarget);
 const tests=qaIds.map(id=>({id,passed:d.has("qa_"+id),evidence:d.has("qa_"+id)?String(d.get("evidence_"+id)||"").trim():""}));
 submit("qa",{tests});
};
$("approve").onclick=()=>{
 if(!window.confirm("Approve this QA-verified private Booking Page design? This will NOT publish or email the client."))return;
 submit("review",{decision:"approve",owner_confirmed:true,notes:new FormData($("review-form")).get("notes")||""});
};
$("request-changes").onclick=()=>{
 const notes=String(new FormData($("review-form")).get("notes")||"").trim();
 if(!notes){showMessage("Write the changes you need before sending the project back.",true);return}
 submit("review",{decision:"request_changes",notes});
};
$("preview-button").onclick=()=>{
 try{
  const job=state.selected,account=state.account;
  const safeServices=Array.isArray(account?.services)?account.services:[];
  const model={...job,tenant_id:job.client_workspace_id,order_id:job.booking_account_id,
    client:{business_name:account?.business_name||"Cleaning Business",services:safeServices}};
  const html=renderBookingStudioPreview(model);
  $("preview-frame").srcdoc=html;
  $("preview-wrap").hidden=false;
  $("preview-wrap").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(e){showMessage("Private preview unavailable: "+errText(e),true)}
};

const emailReview={row:null,seq:0,key:"",loading:false};
function customerEmailDraft(){
 const job=state.selected,account=state.account;
 if(!job||!account)throw Error("Choose a verified client project first.");
 const stage=$("email-stage").value,lang=$("email-language").value;
 const business=String(account.business_name||"your cleaning team").slice(0,100);
 const templates={
 en:{received:["We received your cleaning request","Thanks for reaching out to "+business+"! We have your request and will review the details before confirming availability or pricing."],followup:["Just checking in","Hi! We wanted to check whether you still need help with your cleaning request. No pressure — reply whenever you're ready."],quote:["Your cleaning quote is being reviewed","Thanks for your patience. We're reviewing the details of your cleaning request and will share the next steps once everything is confirmed."]},
 es:{received:["Recibimos tu solicitud de limpieza","¡Gracias por escribir a "+business+"! Recibimos tu solicitud y revisaremos los detalles antes de confirmar disponibilidad o precio."],followup:["Seguimos pendientes de tu solicitud","¡Hola! Queríamos saber si todavía necesitas ayuda con tu limpieza. Sin compromiso, responde cuando quieras."],quote:["Estamos revisando tu cotización","Gracias por tu paciencia. Estamos revisando los detalles de tu solicitud y te compartiremos los siguientes pasos cuando todo esté confirmado."]}
 };
 const [subject,body]=templates[lang][stage];
 return {jobId:String(job.id),stage,lang,subject,body};
}

function emailContext(){
 const d=customerEmailDraft();
 return {job_id:d.jobId,stage:d.stage,lang:d.lang};
}
function emailDirty(){
 const row=emailReview.row;
 return !row||$("email-subject").value.trim()!==row.subject||$("email-body").value.trim()!==row.body;
}
function emailButtons(){
 const row=emailReview.row,dirty=emailDirty(),valid=!!state.selected&&!emailReview.loading;
 $("email-save").disabled=!valid;
 $("email-preview").disabled=!valid;
 $("email-approve").disabled=!valid||!row||dirty||row.review_status!=="draft";
 $("email-revise").disabled=!valid||!row||dirty||row.review_status==="changes_requested";
}
async function loadEmailReview(){
 const current=++emailReview.seq;
 emailReview.row=null;
 emailReview.loading=true;
 emailReview.key="";
 $("email-subject").value="";$("email-body").value="";
 setText("email-version","Loading private email history…");
 setText("email-result","No customer message has been sent.");
 emailButtons();
 if(!state.selected)return;
 try{
  const ctx=emailContext(),result=await api({action:"get",...ctx},emailEndpoint);
  if(current!==emailReview.seq)return;
  const defaultDraft=customerEmailDraft(),row=result.latest||null;
  emailReview.row=row;
  emailReview.key=[ctx.job_id,ctx.stage,ctx.lang].join("|");
  $("email-subject").value=row?.subject||defaultDraft.subject;
  $("email-body").value=row?.body||defaultDraft.body;
  $("email-notes").value=row?.revision_notes||"";
  setText("email-version",row?"Version "+row.version+" · "+row.review_status.replaceAll("_"," ")+" · Saved privately":"Not yet saved · Starting draft for this client");
  const entries=(result.history||[]).map(v=>"v"+v.version+" · "+v.review_status.replaceAll("_"," ")+(v.approved_at?" · approved":""));
  setText("email-history",entries.length?"Previous versions: "+entries.join("  /  "):"No previous versions for this message.");
 }catch(e){
  if(current!==emailReview.seq)return;
  setText("email-version","Could not load the saved review.");
  setText("email-result",errText(e));
  emailReview.key="";
 }finally{
  if(current===emailReview.seq){emailReview.loading=false;emailButtons();}
 }
}
function requireCurrentEmail(){
 const ctx=emailContext();
 if(emailReview.loading||emailReview.key!==[ctx.job_id,ctx.stage,ctx.lang].join("|"))throw Error("This email is still loading. Select it again.");
 return ctx;
}
$("email-stage").onchange=()=>loadEmailReview();
$("email-language").onchange=()=>loadEmailReview();
$("email-subject").oninput=emailButtons;
$("email-body").oninput=emailButtons;
$("email-preview").onclick=()=>{
 try{
  requireCurrentEmail();
  setText("email-result","PRIVATE EMAIL PREVIEW — NOT SENT\n\nSubject: "+$("email-subject").value.trim()+"\n\n"+$("email-body").value.trim()+"\n\nNo automations were activated.");
 }catch(e){setText("email-result",errText(e))}
};
$("email-save").onclick=async()=>{
 const button=$("email-save");button.disabled=true;
 try{
  const ctx=requireCurrentEmail(),subject=$("email-subject").value.trim(),body=$("email-body").value.trim();
  if(!subject||!body)throw Error("Please enter a subject and message.");
  const saved=await api({action:"save",...ctx,subject,body,expected_version:emailReview.row?.version||0},emailEndpoint);
  await loadEmailReview();
  setText("email-result",saved.unchanged?"Copy already saved. Nothing sent.":"Saved as version "+saved.latest.version+". Review it before approving; nothing was sent.");
 }catch(e){setText("email-result",errText(e))}
 finally{emailButtons();}
};
$("email-approve").onclick=async()=>{
 const button=$("email-approve");
 try{
  const ctx=requireCurrentEmail(),row=emailReview.row;
  if(!row||emailDirty())throw Error("Save the exact message before approving.");
  if(!window.confirm("Approve this saved version of the EMAIL COPY only? It will not send any emails or activate automations."))return;
  button.disabled=true;
  const r=await api({action:"approve",...ctx,version:row.version,content_hash:row.content_hash},emailEndpoint);
  await loadEmailReview();
  setText("email-result","✓ Version "+r.latest.version+" approved and saved securely. Sending remains disabled.");
 }catch(e){setText("email-result",errText(e))}
 finally{emailButtons();}
};
$("email-revise").onclick=async()=>{
 const button=$("email-revise");
 try{
  const ctx=requireCurrentEmail(),row=emailReview.row,notes=$("email-notes").value.trim();
  if(!row||emailDirty())throw Error("Save the current message first, then request changes.");
  if(!notes)throw Error("Write the changes you want before sending it back.");
  button.disabled=true;
  const r=await api({action:"revise",...ctx,version:row.version,content_hash:row.content_hash,notes},emailEndpoint);
  await loadEmailReview();
  setText("email-result","Changes requested for version "+r.latest.version+". Edit the text and save a NEW version for approval. Nothing sent.");
 }catch(e){setText("email-result",errText(e))}
 finally{emailButtons();}
};
$("refresh").onclick=()=>refresh().catch(e=>showMessage(errText(e),true));

const HANDOFF_ENDPOINT=SUPA+"/functions/v1/tle-booking-studio-design-handoff";
let handoffSelected=null;
async function refreshHandoffs(){
 const result=await api({action:"list"},HANDOFF_ENDPOINT);
 $("handoff-library").hidden=false;
 const holder=$("handoff-items");holder.replaceChildren();
 if(!result.records.length){holder.textContent="No design references transferred yet. Open Practice Studio to send a concept here.";return}
 for(const record of result.records){
  const item=document.createElement("article");item.className="qa-check";
  const heading=document.createElement("h3");heading.textContent=(record.source_version==="revision"?"Revised concept":"First concept")+" · "+record.review_status.replaceAll("_"," ");
  const detail=document.createElement("p");detail.textContent=record.design.hero_title+" — Fictional reference, not a customer project.";
  const actions=document.createElement("div");actions.className="actions";
  for(const [label,decision] of [["Approve as reference","approve"],["Request changes","changes"]]){
   const button=document.createElement("button");button.className="action "+(decision==="changes"?"danger":"secondary");button.type="button";button.textContent=label;
   button.onclick=async()=>{
    const notes=$("handoff-notes").value.trim();
    if(decision==="changes"&&notes.length<8){setText("handoff-status","Write at least 8 characters describing the changes.");return}
    if(!window.confirm(decision==="approve"?"Approve this fictional DESIGN REFERENCE only? No customer delivery or publication.":"Save these internal revision instructions? No messages will be sent."))return;
    button.disabled=true;
    try{await api({action:"review",id:record.id,decision,notes},HANDOFF_ENDPOINT);setText("handoff-status","Saved privately. Customer delivery remains blocked.");await refreshHandoffs()}
    catch(e){setText("handoff-status",errText(e))}
    finally{button.disabled=false}
   };
   actions.append(button);
  }
  item.append(heading,detail,actions);holder.append(item);
 }
}


async function loadClientReview(){
 const job=state.selected,account=state.account;
 if(!job||!account){setText("client-review-state","Choose a paid client project first.");return}
 $("client-preview-gate").disabled=true;$("client-delivery-gate").disabled=true;
 if(job.stage!=="approved"||job.qa?.passed!==true||job.owner_review?.approved!==true){
  setText("client-review-state","Private design not yet approved after all QA checks. Finish owner approval first; customer delivery remains locked.");
  return;
 }
 setText("client-review-state","Checking the buyer's existing private approval record…");
 try{
  const result=await api({action:"owner_get",subject_type:"booking",subject_id:account.id},clientReviewEndpoint);
  const status=String(result.status||"unknown");
  const remaining=Number(result.revisions_remaining);
  const detail=status==="approved"?"Buyer approved the design. Final activation still requires separate release verification.":
    status==="changes_requested"?"Buyer requested changes. Return to production; revision remaining: "+remaining+".":
    status==="ready_for_retest"?"A revised design is ready for the buyer to check in their private space.":
    status==="pending_review"?"Waiting for buyer review in their private account. Do not send a duplicate invitation.":
    "Buyer review status: "+status+". Do not deliver until approved.";
  setText("client-review-state",detail+" This screen does not send notifications, change customer records, or publish a page.");
 }catch(e){
  setText("client-review-state","Client approval record unavailable: "+errText(e)+". Nothing was sent.");
 }
}
$("client-review-refresh").onclick=()=>loadClientReview();
$("client-review-preflight").onclick=async()=>{
 const j=state.selected;
 $("client-preview-gate").disabled=true;
 if(!j){setText("client-review-state","Choose a paid Booking Studio project first.");return}
 try{
  const data=await api({action:"check",job_id:j.id},clientInviteEndpoint);
  if(!data.ready){
   setText("client-review-state","Client invitation is blocked until these checks pass: "+(data.reasons||[]).join(" · ")+". No email sent.");
   return;
  }
  $("client-preview-gate").disabled=false;
  setText("client-review-state","✓ Ready to send private design preview to "+data.recipient+". Verify the recipient and select Send for Client Approval. One invitation per approved version.");
 }catch(e){setText("client-review-state","Could not verify client invitation: "+errText(e)+". No email sent.")}
};
$("client-preview-gate").onclick=async()=>{
 const button=$("client-preview-gate"),job=state.selected;
 if(!job||button.disabled)return;
 if(!window.confirm("Send ONE private design-review invitation to this paid client's verified email? This contacts a real customer; it does not publish or deliver the Booking Page."))return;
 button.disabled=true;
 try{
  const result=await api({action:"send",job_id:job.id,owner_confirmed:true},clientInviteEndpoint);
  setText("client-review-state",result.accepted?"✓ Private invitation accepted by email provider. Client review is pending; final delivery stays blocked.":"No invitation sent.");
 }catch(e){setText("client-review-state","Invitation not sent: "+errText(e)+". Recheck readiness before trying again.")}
};

$("client-delivery-gate").onclick=()=>{};

async function boot(){
 try{
  await refresh();
  $("auth-state").textContent="Owner access verified. No client actions or publishing enabled.";
  $("studio").hidden=false;
  await refreshHandoffs().catch(e=>setText("handoff-status",errText(e)));
 }catch(e){
  $("auth-state").textContent="Owner access unavailable. Open this page after signing in to your private Command Center.";
  showMessage(errText(e),true);
 }
}
db?.auth?.onAuthStateChange((event)=>{if(event==="SIGNED_OUT"){location.replace("/")}});
boot();
