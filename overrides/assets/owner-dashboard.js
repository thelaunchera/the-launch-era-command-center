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
