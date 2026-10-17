/* Owner-only Automations Studio. Reads only the authenticated TLE internal
   workspace. Uses existing consent-checked prospect follow-up controls;
   does not access buyer Cleaning App data or create/send email. */
(()=>{
 "use strict";
 const root=document.getElementById("ownerAutomationHub");
 if(!root)return;
 const SUPA="https://bowacxhmjvrqixtwaikv.supabase.co";
 const KEY="sb_publishable_0TueitFYiRF3rAEMLMT8-w_FvbvY0rB";
 const $=(s,r=root)=>r.querySelector(s);
 const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;};
 const es=()=>{try{return localStorage.getItem("tle_crm_language")==="es";}catch{return false;}};
 const tr=(en,spanish)=>es()?spanish:en;
 const state={client:null,workspace:null,leads:[],queue:[],bounce:new Set(),loaded:false,busy:false,tab:"leads"};
 const onlyOwner=()=>document.body.classList.contains("crm-owner-view")&&!!document.getElementById("ownerOverviewHub")&&!document.getElementById("app")?.classList.contains("hidden");
 const tabs=$("[data-automation-tabs]"),panels=root.querySelectorAll("[data-automation-panel]");
 const status=$("#ownerAutomationStatus"),list=$("#ownerAutomationLeads"),count=$("#ownerAutomationCount"),mode=$("#ownerAutomationMode");
 function say(text){if(status)status.textContent=text;}
 function selectTab(which){
  if(!["leads","estimates","jobs"].includes(which))return;
  state.tab=which;
  for(const node of tabs.querySelectorAll("button")){const active=node.dataset.automationTab===which;node.setAttribute("aria-selected",String(active));node.tabIndex=active?0:-1;}
  for(const p of panels)p.hidden=p.dataset.automationPanel!==which;
 }
 tabs.addEventListener("click",event=>{const button=event.target.closest("[data-automation-tab]");if(button)selectTab(button.dataset.automationTab);});
 tabs.addEventListener("keydown",event=>{if(!["ArrowLeft","ArrowRight"].includes(event.key))return;const keys=["leads","estimates","jobs"],i=keys.indexOf(state.tab),next=keys[(i+(event.key==="ArrowRight"?1:2))%3];selectTab(next);tabs.querySelector('[data-automation-tab="'+next+'"]')?.focus();event.preventDefault();});
 function date(value){
  if(!value)return tr("Not scheduled","Sin programar");
  try{return new Intl.DateTimeFormat(es()?"es-US":"en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(value));}catch{return tr("Not scheduled","Sin programar");}
 }
 function eligible(x){
  return x.contact_decision==="yes"&&x.email_consent_status==="authorized"
   &&String(x.email_consent_source||"").trim()&&!!String(x.email||"").trim()
   &&!x.replied_at&&!x.archived_at&&!x.research_only&&x.stage!=="Won"
   &&!state.bounce.has(x.id)&&!/unsubscrib|opted out|stop (emailing|contacting)|do not email me|email bounced|do not contact:\s*(yes|true)/i.test(x.notes||"");
 }
 function recentRows(){
  const byLead=new Map();
  for(const q of state.queue){
   if(!q.lead_id)continue;
   const group=byLead.get(q.lead_id)||[];group.push(q);byLead.set(q.lead_id,group);
  }
  const scored=state.leads.map(lead=>({lead,steps:byLead.get(lead.id)||[]}));
  scored.sort((a,b)=>{
   const nearest=x=>Math.min(...x.steps.filter(s=>["pending","due","scheduled","queued","processing","failed"].includes(s.status)).map(s=>new Date(s.due_at||"9999-01-01").getTime()),Infinity);
   const aAt=nearest(a),bAt=nearest(b);return aAt-bAt;
  });
  return scored.filter(x=>x.steps.length||x.lead.email_followup_enabled).slice(0,12);
 }
 function draw(){
  if(!onlyOwner()||!list)return;
  if(!state.loaded)return;
  const active=!!state.workspace?.automated_followups_enabled&&!!state.workspace?.reply_monitor_verified;
  mode.textContent=active?tr("Second & third stages: scheduled when eligible","Etapas 2 y 3: programadas si cumplen los requisitos"):
    tr("Automatic stages not fully enabled · review workspace settings","Etapas automáticas no completamente activas · revisa los ajustes");
  mode.dataset.active=String(active);
  const pending=state.queue.filter(q=>["pending","due","scheduled","queued"].includes(q.status));
  count.textContent=String(pending.length);
  const rows=recentRows();
  list.replaceChildren();
  if(!rows.length){list.append(el("p","od-auto-empty",tr("No active prospect follow-up stages found. Your existing lead records remain unchanged.","No hay etapas pendientes para prospectos. Tus contactos siguen guardados.")));return;}
  for(const {lead,steps} of rows){
   const card=el("article","od-auto-lead");
   const info=el("div","od-auto-lead-info");
   const name=el("strong","",lead.business||tr("Prospect","Prospecto"));
   const sub=el("small","",tr("Pipeline: ","Etapa: ")+(lead.stage||"—")+" · "+(eligible(lead)?tr("Permission verified","Permiso verificado"):tr("Requires review","Requiere revisión")));
   info.append(name,sub);
   const timeline=el("div","od-auto-lead-timeline");
   const ordered=steps.slice().sort((a,b)=>a.step_number-b.step_number);
   if(ordered.length){
    for(const step of ordered.slice(0,3)){
     const chip=el("span","od-auto-chip",tr("Step ","Etapa ")+step.step_number+" · "+(step.status||"—")+" · "+date(step.due_at));
     chip.title=date(step.due_at);timeline.append(chip);
    }
   }else timeline.append(el("span","od-auto-chip",tr("No scheduled steps","Sin etapas programadas")));
   const actions=el("div","od-auto-actions");
   const switchWrap=el("label","od-auto-switch");
   const sw=el("input");sw.type="checkbox";sw.checked=!!lead.email_followup_enabled;sw.dataset.leadAutomation=lead.id;sw.disabled=!active||(!sw.checked&&!eligible(lead));sw.setAttribute("aria-label",tr("Automatic follow-ups for ","Seguimiento automático para ")+(lead.business||""));
   switchWrap.append(sw,el("span","",tr("Auto follow-up","Seguimiento automático")));actions.append(switchWrap);
   const open=el("button","od-auto-open",tr("Open lead →","Abrir lead →"));open.type="button";open.addEventListener("click",()=>{
    if(!onlyOwner())return;
    document.querySelector('.nav-link[data-target="leads"]')?.click();
    setTimeout(()=>{
     const card=document.querySelector('.premium-lead[data-lead-id="'+lead.id+'"]');
     if(card){card.click();card.scrollIntoView({behavior:"smooth",block:"nearest"});}
    },180);
   });actions.append(open);
   card.append(info,timeline,actions);list.append(card);
  }
 }
 async function client(){
  if(!state.client){
   if(!window.supabase?.createClient)throw Error("Authentication library unavailable");
   state.client=window.supabase.createClient(SUPA,KEY,{auth:{storageKey:"tle-crm-auth",persistSession:true,autoRefreshToken:false}});
  }
  return state.client;
 }
 async function refresh(){
  if(!onlyOwner()||state.busy)return;
  state.busy=true;say(tr("Checking live automations…","Consultando automatizaciones…"));
  try{
   const db=await client();
   const user=await db.auth.getUser();
   if(user.error||!user.data?.user)throw Error(tr("Sign in first","Inicia sesión primero"));
   const ws=await db.from("tle_crm_workspaces").select("id,is_internal,created_by,automated_followups_enabled,reply_monitor_verified")
      .eq("created_by",user.data.user.id).eq("is_internal",true).limit(1).maybeSingle();
   if(ws.error||!ws.data?.id)throw Error(tr("Private owner workspace unavailable","No está disponible el espacio privado de la propietaria"));
   const id=ws.data.id;
   const results=await Promise.all([
    db.from("tle_crm_leads").select("id,business,email,notes,stage,contact_decision,email_consent_status,email_consent_source,email_followup_enabled,replied_at,archived_at,research_only").eq("workspace_id",id).is("archived_at",null).eq("research_only",false).limit(300),
    db.from("tle_crm_prospect_followup_queue").select("lead_id,step_number,status,due_at").eq("workspace_id",id).order("due_at",{ascending:true}).limit(300),
    db.from("tle_crm_email_events").select("lead_id,event_type").eq("workspace_id",id).in("event_type",["email_bounced","email_failed"]).limit(500)
   ]);
   for(const result of results)if(result.error)throw result.error;
   if(!onlyOwner())return;
   state.workspace=ws.data;state.leads=results[0].data||[];state.queue=results[1].data||[];
   state.bounce=new Set((results[2].data||[]).map(e=>e.lead_id).filter(Boolean));
   state.loaded=true;draw();
   say(tr("Synced with your private prospect pipeline. No emails were sent.","Sincronizado con tus prospectos privados. No se envió ningún correo."));
  }catch(error){state.loaded=false;state.workspace=null;list.replaceChildren(el("p","od-auto-empty",tr("Unable to load automations. Use Refresh after signing in.","No se pudieron cargar las automatizaciones. Inicia sesión y toca Actualizar.")));say(error?.message||"Unable to load");}
  finally{state.busy=false;}
 }
 list.addEventListener("change",async event=>{
  const input=event.target.closest("[data-lead-automation]");
  if(!input||!state.workspace||!onlyOwner())return;
  const lead=state.leads.find(x=>x.id===input.dataset.leadAutomation);
  if(!lead){void refresh();return;}
  const next=!!input.checked,prior=!!lead.email_followup_enabled;
  if(next===prior)return;
  if(next&&!eligible(lead)){input.checked=prior;say(tr("Verify permission in the lead first.","Primero verifica el permiso en el contacto."));return;}
  if(!confirm(next?tr("Enable future automated follow-ups for this verified prospect? Scheduled messages may send to a real business.","¿Activar próximos correos automáticos para este prospecto verificado? Se pueden enviar mensajes reales."):
   tr("Turn off future automatic follow-ups for this prospect?","¿Desactivar los próximos seguimientos automáticos de este prospecto?"))){input.checked=prior;return;}
  input.disabled=true;
  try{
   const db=await client();
   const updated=await db.from("tle_crm_leads").update({email_followup_enabled:next}).eq("id",lead.id).eq("workspace_id",state.workspace.id).select("id,email_followup_enabled").single();
   if(updated.error)throw updated.error;
   lead.email_followup_enabled=!!updated.data.email_followup_enabled;
   say(tr("Lead follow-up preference saved. No message sent by this action.","Preferencia guardada. Esta acción no envió ningún mensaje."));
   draw();
  }catch(error){input.checked=prior;say(tr("Unable to save: ","No se pudo guardar: ")+(error?.message||"Error"));}
  finally{input.disabled=false;}
 });
 root.querySelector("[data-automation-refresh]")?.addEventListener("click",()=>void refresh());
 root.querySelector("[data-automation-shortcut]")?.addEventListener("click",()=>{root.scrollIntoView({behavior:"smooth",block:"start"});void refresh();});
 document.addEventListener("tle-crm-language",()=>{const key=state.tab;for(const btn of tabs.querySelectorAll("[data-automation-tab]"))btn.textContent=tr(btn.dataset.english,btn.dataset.spanish);selectTab(key);draw();});
 window.addEventListener("tle-crm-ready",()=>void refresh());
 window.addEventListener("pageshow",()=>{if(onlyOwner())void refresh();});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&onlyOwner())void refresh();});
 void refresh();
})();