/* Owner-only dashboard summary of existing authenticated CRM lead data.
   Does not issue independent requests, alter lead data, or expose buyer data. */
(function(){
  'use strict';
  const root=document.getElementById('ownerOverviewHub');
  if(!root)return;
  const es=()=>{try{return localStorage.getItem('tle_crm_language')==='es'}catch{return false}};
  const copy=(en,spanish)=>es()?spanish:en;
  function refresh(){
    const spanish=es(),now=new Date(),hour=now.getHours();
    const greet=hour<12?(spanish?'Buenos días':'Good morning'):hour<18?(spanish?'Buenas tardes':'Good afternoon'):(spanish?'Buenas noches':'Good evening');
    const greeting=document.getElementById('ownerDayGreeting'),date=document.getElementById('ownerTodayDate');
    if(greeting)greeting.textContent=greet;
    if(date){date.textContent=new Intl.DateTimeFormat(spanish?'es-US':'en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(now);date.lang=spanish?'es':'en'}
    root.querySelectorAll('[data-od-en][data-od-es]').forEach(node=>{node.textContent=node.getAttribute(spanish?'data-od-es':'data-od-en')});
    updateLeads();
  }
  function updateLeads(){
    if(!document.body.classList.contains('crm-owner-view'))return;
    const total=document.getElementById('metricTotal'),
      newly=document.getElementById('quickNewCount'),
      due=document.getElementById('quickDueCount'),
      source=document.getElementById('quickList'),
      preview=document.getElementById('odLeadPreview');
    if(!total||!newly||!due||!source||!preview)return;
    const pairs=[['odLeadTotal',total],['odLeadNew',newly],['odLeadDue',due]];
    for(const [id,origin] of pairs){const target=document.getElementById(id);if(target)target.textContent=origin.textContent||'—';}
    const actions=Array.from(source.querySelectorAll('button.quickitem')).slice(0,5);
    preview.replaceChildren();
    if(actions.length){
      for(const original of actions){
        const item=document.createElement('button');item.type='button';item.className='od-lead-item';
        const info=document.createElement('span');
        const business=document.createElement('strong');
        const detail=document.createElement('small');
        business.textContent=original.querySelector('b')?.textContent||copy('Prospect','Prospecto');
        detail.textContent=original.querySelector('small')?.textContent||'';
        info.append(business,detail);
        const arrow=document.createElement('span');arrow.textContent='Open ↗';
        if(es())arrow.textContent='Abrir ↗';
        item.append(info,arrow);
        item.onclick=()=>{if(document.body.classList.contains('crm-owner-view'))original.click()};
        preview.append(item);
      }
    }else{
      const p=document.createElement('p');p.className='od-leads-empty';
      const failure=source.textContent?.includes('Unable to load');
      const loading=total.textContent==='…'||!document.body.dataset.leadsLoaded;
      p.textContent=failure?copy('Unable to load leads. Refresh your workspace and try again.','No se pudieron cargar los leads. Actualiza tu espacio e inténtalo de nuevo.'):
        loading?copy('Loading your active leads…','Cargando tus leads activos…'):
        Number(total.textContent||0)===0?copy('No active leads yet. Archived contacts remain saved.','Aún no hay leads activos. Los contactos archivados siguen guardados.'):
        copy('No new leads or follow-ups need immediate attention. Open all leads to see your full active list.','No hay leads nuevos ni seguimientos urgentes. Abre todos los leads para ver la lista completa.');
      preview.append(p);
    }
  }
  refresh();
  // Watch only the existing lead UI updated by the verified CRM owner session.
  const observed=['quickList','metricTotal','quickNewCount','quickDueCount'];
  const observer=new MutationObserver(updateLeads);
  for(const id of observed){const target=document.getElementById(id);if(target)observer.observe(target,{childList:true,subtree:true,characterData:true})}
  document.addEventListener('tle-crm-language',refresh);
  window.addEventListener('pageshow',refresh);
  window.addEventListener('tle-crm-ready',updateLeads);
})();

/* Private owner-only prospect activity. Reads the authenticated tenant's existing
   evidence; unknown is NOT a negative result and opens are not consent. */
(function(){
 'use strict';
 const board=document.getElementById('board');
 if(!board)return;
 const workspace='c0b24907-3a17-4273-b00c-70efbba314c4';
 const statuses=new Map();
 let client=null,busy=false,loaded=false,lastRead=0,renderQueued=false;
 const es=()=>{try{return localStorage.getItem('tle_crm_language')==='es'}catch{return false}};
 const txt=(a,b)=>es()?b:a;
 const known=(type)=>['email_sent','email_delivered','email_bounced','email_failed','interest_confirmed','consent_authorized','confirmation_sent','demo_sent','link_visited','interest_page_viewed','link_opened'].includes(type);
 function date(v){if(!v)return '';try{return new Intl.DateTimeFormat(es()?'es-US':'en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(v))}catch{return ''}}
 function badge(label,kind,title){
  const node=document.createElement('span');node.className='od-engagement-chip od-engagement-'+kind;
  node.textContent=label;node.title=title;return node;
 }
 function draw(){
  if(!document.body.classList.contains('crm-owner-view'))return;
  for(const card of board.querySelectorAll('.premium-lead[data-lead-id]')){
   const id=card.dataset.leadId;
   let root=card.querySelector('.od-engagement');
   if(!root){root=document.createElement('div');root.className='od-engagement';root.setAttribute('aria-label',txt('Email engagement timeline','Actividad de correo'));const before=card.querySelector('.premium-lead-bottom');if(before)card.insertBefore(root,before);else card.append(root)}
   if(!loaded){root.replaceChildren(badge(txt('Checking activity…','Consultando actividad…'),'unknown',''));continue}
   const ev=statuses.get(id)||new Map();
   const find=(names)=>names.map(n=>ev.get(n)).filter(Boolean).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
   const sent=find(['email_sent']),delivered=find(['email_delivered']),bounced=find(['email_bounced','email_failed']),visit=find(['link_visited','interest_page_viewed','link_opened']);
   const consent=find(['interest_confirmed','consent_authorized']);
   const demo=find(['demo_sent','confirmation_sent']);
   const items=[
    badge(txt('Sent','Enviado'),sent?'yes':'unknown',sent?date(sent.created_at):txt('Not recorded','Sin registro')),
    badge(bounced?txt('Delivery issue','Problema de entrega'):txt('Delivered','Entregado'),bounced?'bad':delivered?'yes':'unknown',bounced?date(bounced.created_at):delivered?date(delivered.created_at):txt('Not confirmed','Sin confirmar')),
    badge(txt('Link visited','Enlace visitado'),visit?'yes':'unknown',visit?date(visit.created_at):txt('Click tracking not enabled on earlier emails','Los envíos anteriores no tenían registro de clics')),
    badge(txt('Consent confirmed','Aceptó correos'),consent?'yes':'unknown',consent?date(consent.created_at):txt('No confirmed consent recorded','Sin consentimiento confirmado registrado')),
    badge(txt('Demo sent','Demo enviado'),demo?'yes':'unknown',demo?date(demo.created_at):txt('No sending record','Sin registro de envío'))
   ];
   root.replaceChildren(...items);
  }
 }
 async function refresh(force=false){
  if(!document.body.classList.contains('crm-owner-view')||busy)return;
  if(!force&&loaded&&Date.now()-lastRead<30000){draw();return}
  if(!window.supabase?.createClient)return;
  busy=true;
  try{
   if(!client)client=window.supabase.createClient('https://bowacxhmjvrqixtwaikv.supabase.co','sb_publishable_0TueitFYiRF3rAEMLMT8-w_FvbvY0rB',{auth:{storageKey:'tle-crm-auth',persistSession:true,autoRefreshToken:false}});
   const {data:{session}}=await client.auth.getSession();
   if(!session)return;
   const result=await client.from('tle_crm_email_events').select('lead_id,event_type,created_at').eq('workspace_id',workspace).order('created_at',{ascending:false}).limit(2000);
   if(result.error)throw result.error;
   statuses.clear();
   for(const item of result.data||[]){
    if(!item.lead_id||!known(item.event_type))continue;
    let events=statuses.get(item.lead_id);if(!events){events=new Map();statuses.set(item.lead_id,events)}
    if(!events.has(item.event_type))events.set(item.event_type,item);
   }
   lastRead=Date.now();loaded=true;draw();
  }catch(err){console.warn('Owner engagement status unavailable:',err?.message||err);/* no fabricated statuses */}
  finally{busy=false}
 }
 const obs=new MutationObserver(()=>{
  if(renderQueued)return;
  renderQueued=true;
  requestAnimationFrame(()=>{renderQueued=false;if(document.body.classList.contains('crm-owner-view')){draw();void refresh()}});
 });
 obs.observe(board,{childList:true,subtree:false});
 document.addEventListener('tle-crm-language',()=>{draw()});
 window.addEventListener('tle-crm-ready',()=>void refresh(true));
 window.addEventListener('pageshow',()=>void refresh(true));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh(true)});
 void refresh();
})();

// Route through existing authenticated owner navigation, then apply its bundle filter.
document.querySelectorAll('[data-owner-bundles]').forEach(button=>button.addEventListener('click',()=>{
 if(!document.body.classList.contains('crm-owner-view'))return;
 setTimeout(()=>{const filter=document.getElementById('ownerPurchaseFilter');if(filter){filter.value='bundle';filter.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('ownerOrderControl')?.scrollIntoView({behavior:'smooth',block:'start'})}},0);
}));
