(()=>{
'use strict';
const API='https://bowacxhmjvrqixtwaikv.supabase.co';
const KEY='sb_publishable_0TueitFYiRF3rAEMLMT8-w_FvbvY0rB';
const $=id=>document.getElementById(id);
const strings={
en:{back:'Command Center',eyebrow:'YOUR SPACE TO THINK',intro:'Capture the thought. You do not have to work on it today.',inboxTag:'PRIVATE INBOX',capture:'What is on your mind?',notTask:'Not a task yet',ideaLabel:'Idea text',voice:'Speak your idea',stop:'Stop listening',save:'Save idea →',voiceHelp:'On iPhone, you can also tap the microphone on your keyboard to dictate your idea.',peace:'NO RUSH. NO PRESSURE.',allIdeas:'Saved ideas',refresh:'↻ Refresh',filterInbox:'Inbox',filterReview:'Review',filterApproved:'Approved',filterAll:'All',footer:'Your ideas are safe here. Capturing an idea never starts any work.',empty:'No ideas here yet. Your mind can rest — this space is ready.',saved:'✓ Idea saved. You can let it go for now.',saving:'Saving your idea…',missing:'Say or type your idea first.',failed:'Could not save. Your text is still here. Try again.',micFallback:'Tap the microphone on your iPhone keyboard and dictate your idea, then tap Save idea.',listError:'Could not load saved ideas. Try Refresh.',listening:'Listening… Speak naturally. Saving when you finish.',speechError:'Voice recognition stopped. Your text is still here; tap Save idea.',statusError:'Could not update this idea. Please try again.',signedOut:'Sign in to your private Command Center first.',denied:'This Idea Vault is only available in the private owner workspace.',inbox:'Inbox',review:'Review',approved:'Approved',doing:'In progress',done:'Done',archived:'Archived',website:'Website',cleaning_app:'Cleaning App',ai_assistants:'AI Assistants',marketing:'Marketing',sales:'Sales',automations:'Automations',other:'Other',metricInbox:'For later',metricApproved:'Approved',metricTotal:'All ideas',reviewNote:'Capture now. Decide what to build only when you choose to review.',searchLabel:'Search your ideas',areaFilterLabel:'Filter ideas by area',allAreas:'All areas',export:'↓ Backup',draftLocal:'Unsent draft saved on this device, not yet in your online Vault.',draftRecovered:'An unfinished idea was restored from this device. It is not saved online yet.',duplicate:'This idea is already in your Vault. No duplicate was added.',edit:'Edit',more:'Read more',less:'Less',editSave:'Save changes',editCancel:'Cancel',edited:'✓ Idea updated.',editMissing:'Please write something first.',backupEmpty:'No ideas to back up yet.',backupDone:'✓ Private backup downloaded.',noResults:'No ideas match that search.',impact:'Impact',unrated:'Not rated',savesTime:'Saves time',helpsSales:'Helps sales',helpsCustomer:'Customer experience',visual:'Visual',voiceTag:'Dictated'},
es:{back:'Command Center',eyebrow:'TU ESPACIO PARA PENSAR',intro:'Guarda esa idea. No tienes que trabajar en ella hoy.',inboxTag:'BANDEJA PRIVADA',capture:'¿Qué se te ocurrió?',notTask:'Aún no es una tarea',ideaLabel:'Texto de la idea',voice:'Dictar idea',stop:'Terminar dictado',save:'Guardar idea →',voiceHelp:'En iPhone también puedes tocar el micrófono del teclado para dictar tu idea.',peace:'SIN PRISA. SIN PRESIÓN.',allIdeas:'Ideas guardadas',refresh:'↻ Actualizar',filterInbox:'Bandeja',filterReview:'Revisar',filterApproved:'Aprobadas',filterAll:'Todas',footer:'Aquí tus ideas están a salvo. Guardarlas nunca inicia trabajo automáticamente.',empty:'Todavía no hay ideas aquí. Este espacio está listo cuando lo necesites.',saved:'✓ Idea guardada. Puedes dejar de pensar en ella por ahora.',saving:'Guardando tu idea…',missing:'Primero di o escribe tu idea.',failed:'No se pudo guardar. Tu texto sigue aquí. Inténtalo otra vez.',micFallback:'Toca el micrófono del teclado del iPhone, dicta y luego pulsa Guardar idea.',listError:'No se pudieron cargar las ideas. Prueba Actualizar.',listening:'Te escucho… Habla con naturalidad. Guardaré al terminar.',speechError:'Se detuvo el dictado. Tu texto sigue aquí; pulsa Guardar idea.',statusError:'No se pudo actualizar esta idea. Inténtalo otra vez.',signedOut:'Primero entra a tu Command Center privado.',denied:'Este Idea Vault solo está disponible en el espacio privado de la dueña.',inbox:'Bandeja',review:'Revisar',approved:'Aprobada',doing:'En proceso',done:'Hecha',archived:'Archivada',website:'Website',cleaning_app:'Cleaning App',ai_assistants:'AI Assistants',marketing:'Marketing',sales:'Ventas',automations:'Automations',other:'Otra',metricInbox:'Para después',metricApproved:'Aprobadas',metricTotal:'Todas las ideas',reviewNote:'Captura ahora. Decide qué construir solo cuando tú quieras revisar.',searchLabel:'Buscar ideas',areaFilterLabel:'Filtrar ideas por área',allAreas:'Todas las áreas',export:'↓ Respaldo',draftLocal:'Borrador guardado en este dispositivo, todavía no en línea.',draftRecovered:'Recuperé una idea sin terminar en este dispositivo. Aún no está guardada en línea.',duplicate:'Esta idea ya está en tu Vault. No agregué un duplicado.',edit:'Editar',more:'Leer más',less:'Menos',editSave:'Guardar cambios',editCancel:'Cancelar',edited:'✓ Idea actualizada.',editMissing:'Escribe tu idea primero.',backupEmpty:'Todavía no hay ideas para respaldar.',backupDone:'✓ Respaldo privado descargado.',noResults:'No hay ideas que coincidan con la búsqueda.',impact:'Impacto',unrated:'Sin evaluar',savesTime:'Ahorra tiempo',helpsSales:'Ayuda ventas',helpsCustomer:'Experiencia cliente',visual:'Visual',voiceTag:'Dictada'}
};
const statuses=['inbox','review','approved','doing','done','archived'];
const areas=['website','cleaning_app','ai_assistants','marketing','sales','automations','other'];
let lang='en',db=null,owner=null,ideas=[],filter='inbox',speaking=false,speech=null,voiceResult='',saving=false;
try{lang=localStorage.getItem('tle_crm_language')==='es'?'es':'en'}catch{}
function T(id){return strings[lang][id]||id}
function announce(msg){$('captureStatus').textContent=msg}
function localize(){document.documentElement.lang=lang;document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=T(el.dataset.i18n)});
$('ideaBody').placeholder=$('ideaBody').dataset['placeholder'+(lang==='es'?'Es':'En')];
$('languageSwitch').textContent=lang==='es'?'EN':'ES';
render();}
function failAccess(kind){$('startup').classList.add('error');$('startup').replaceChildren(document.createTextNode(T(kind)+' '));const link=document.createElement('a');link.href='./';link.textContent=T('back')+' →';$('startup').append(link)}
function safeTitle(text){return text.replace(/\s+/g,' ').trim().slice(0,90)}
function selectControl(options,current,handler,label){const select=document.createElement('select');select.setAttribute('aria-label',label);
options.forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=T(value);select.append(option)});
select.value=current;select.addEventListener('change',()=>handler(select.value));return select}
function render(){
const list=$('ideaList');if(!list)return;list.replaceChildren();
const shown=filter==='all'?ideas:ideas.filter(x=>x.status===filter);
if(!shown.length){const empty=document.createElement('div');empty.className='empty';empty.textContent=T('empty');list.append(empty);return}
shown.forEach(item=>{
 const card=document.createElement('article');card.className='idea-card';
 const title=document.createElement('h3');title.textContent=item.title;card.append(title);
 const body=document.createElement('p');body.textContent=item.body;card.append(body);
 const row=document.createElement('div');row.className='idea-meta';
 const time=document.createElement('time');time.dateTime=item.created_at;time.textContent=new Date(item.created_at).toLocaleString(lang==='es'?'es-US':'en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});row.append(time);
 const fields=document.createElement('div');fields.className='idea-fields';
 const areaLabel=document.createElement('label');areaLabel.textContent=lang==='es'?'Área':'Area';const area=selectControl(areas,item.area,async v=>{const old=item.area;item.area=v;const {error}=await db.from('tle_owner_ideas').update({area:v,updated_at:new Date().toISOString()}).eq('id',item.id).eq('owner_id',owner.id);if(error){item.area=old;area.value=old;announce(T('statusError'))}},lang==='es'?'Área de la idea':'Idea area');fields.append(areaLabel,area);
 const stage=selectControl(statuses,item.status,async v=>{const old=item.status;item.status=v;const {error}=await db.from('tle_owner_ideas').update({status:v,updated_at:new Date().toISOString()}).eq('id',item.id).eq('owner_id',owner.id);if(error){item.status=old;announce(T('statusError'))}render()},lang==='es'?'Estado de la idea':'Idea status');fields.append(stage);row.append(fields);card.append(row);list.append(card)
});}
async function refresh(){const {data,error}=await db.from('tle_owner_ideas').select('id,title,body,origin,area,status,impact,created_at').eq('owner_id',owner.id).order('created_at',{ascending:false}).limit(500);if(error){announce(T('listError'));return}ideas=data||[];render()}
async function saveIdea(source){if(saving||!db||!owner)return;
 const body=$('ideaBody').value.trim();
 if(!body){announce(T('missing'));return}
 saving=true;$('saveIdea').disabled=true;announce(T('saving'));
 const {data,error}=await db.from('tle_owner_ideas').insert({owner_id:owner.id,title:safeTitle(body),body,origin:source==='voice'?'voice':'text',area:suggestArea(body),status:'inbox',impact:'unrated'}).select('id,title,body,origin,area,status,impact,created_at').single();
 saving=false;$('saveIdea').disabled=false;
 if(error){announce(T('failed'));return}
 $('ideaBody').value='';voiceResult='';ideas.unshift(data);filter='inbox';document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));announce(T('saved'));render()
}
function voice(){if(speaking&&speech){speech.stop();return}
const NativeSpeech=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!NativeSpeech){$('ideaBody').focus();announce(T('micFallback'));return}
speech=new NativeSpeech();speech.lang=lang==='es'?'es-US':'en-US';speech.continuous=false;speech.interimResults=true;let full='',interim='',hadError=false;
speech.onstart=()=>{speaking=true;voiceResult='';$('voiceButton').classList.add('active');$('voiceButton').querySelector('[data-i18n]').textContent=T('stop');announce(T('listening'))};
const base=$('ideaBody').value.trim();
speech.onresult=event=>{full='';interim='';for(let i=0;i<event.results.length;i++){const phrase=event.results[i][0]?.transcript||'';if(event.results[i].isFinal)full+=phrase+' ';else interim+=phrase+' '}
 voiceResult=full.trim();$('ideaBody').value=[base,full.trim(),interim.trim()].filter(Boolean).join(' ').trim();rememberDraft()};
speech.onerror=()=>{hadError=true;announce(T('speechError'))};
speech.onend=async()=>{speaking=false;$('voiceButton').classList.remove('active');$('voiceButton').querySelector('[data-i18n]').textContent=T('voice');
 $('ideaBody').value=[base,full.trim()||interim.trim()].filter(Boolean).join(' ').trim();rememberDraft();
 if(!hadError&&full.trim())await saveIdea('voice');else if(!hadError)announce(T('micFallback'))};
try{speech.start()}catch{announce(T('micFallback'));$('ideaBody').focus()}}
async function init(){
localize();$('languageSwitch').onclick=()=>{lang=lang==='en'?'es':'en';try{localStorage.setItem('tle_crm_language',lang)}catch{}localize()};
$('saveIdea').onclick=()=>saveIdea('text');$('voiceButton').onclick=voice;$('refreshIdeas').onclick=()=>refresh();
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));render()});
if(!window.supabase?.createClient){failAccess('signedOut');return}
db=window.supabase.createClient(API,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'tle-crm-auth'}});
const {data:{user},error:authError}=await db.auth.getUser();
if(authError||!user){failAccess('signedOut');return}
const {data:workspace,error:workspaceError}=await db.from('tle_crm_workspaces').select('id').eq('created_by',user.id).eq('is_internal',true).limit(1);
if(workspaceError||!workspace?.length){failAccess('denied');return}
owner=user;$('startup').hidden=true;$('vaultApp').hidden=false;
restoreDraft();$('ideaBody').addEventListener('input',rememberDraft);
await refresh();
}

// Owner Idea Vault v2: calm review tools, no automatic task creation.
const suggestPatterns=[
 ['ai_assistants',/\b(jessie|jessy|chatbot|bot|ai agent|asistente|assistant|conversaci[oó]n)\b/i],
 ['automations',/\b(automatiz|automation|webhook|make|integraci[oó]n|workflow|secuencia|follow[- ]?up)/i],
 ['cleaning_app',/\b(cleaning app|app de limpieza|pwa|calendario|invoice|factura|supplies|mileage|job tracking)/i],
 ['sales',/\b(lead|checkout|stripe|venta|vender|precio|price|pricing|compra|sales|cotizaci[oó]n)/i],
 ['marketing',/\b(instagram|reel|tiktok|facebook|caption|carrusel|carrousel|marketing|post|anuncio|promoci[oó]n)/i],
 ['website',/\b(web|website|landing|homepage|hero|footer|p[aá]gina|formulario|responsive|demo)/i]
];
function suggestArea(body){for(const [area,pattern] of suggestPatterns)if(pattern.test(body))return area;return 'other'}
function draftKey(){return owner?'tle-owner-idea-draft-'+owner.id:''}
function rememberDraft(){
 if(!owner)return;
 const body=$('ideaBody').value;
 try{
  if(body.trim())localStorage.setItem(draftKey(),JSON.stringify({body:body.slice(0,10000),time:Date.now()}));
  else localStorage.removeItem(draftKey());
 }catch{}
 $('draftStatus').hidden=!body.trim();
 if(body.trim())$('draftStatus').textContent=T('draftLocal')
}
function restoreDraft(){
 if(!owner)return;
 try{
  const draft=JSON.parse(localStorage.getItem(draftKey())||'null');
  if(!draft||!draft.body)return;
  if(!draft.time||Date.now()-draft.time>86400000){localStorage.removeItem(draftKey());return}
  $('ideaBody').value=String(draft.body).slice(0,10000);
  $('draftStatus').hidden=false;$('draftStatus').textContent=T('draftRecovered')
 }catch{}
}
const originalRender=render;
render=function(){
 originalRender();
 const list=$('ideaList');
 if(!list||!owner)return;
 $('metricInbox').textContent=ideas.filter(x=>x.status==='inbox').length;
 $('metricApproved').textContent=ideas.filter(x=>x.status==='approved').length;
 $('metricTotal').textContent=ideas.length;
 const term=String($('ideaSearch').value||'').trim().toLowerCase();
 const area=$('areaFilter').value;
 const visible=filter==='all'?ideas:ideas.filter(x=>x.status===filter);
 const cards=[...list.querySelectorAll('.idea-card')];
 let displayed=0;
 cards.forEach((card,index)=>{
  const item=visible[index];if(!item)return;
  const match=(!term||(item.title+' '+item.body+' '+item.area).toLowerCase().includes(term))&&(area==='all'||item.area===area);
  card.hidden=!match;
  if(!match)return;displayed++;
  const title=card.querySelector('h3');
  const original=card.querySelector('p');
  if(original){original.classList.add('idea-description');
   if(item.body.length>180){
    const toggle=document.createElement('button');toggle.type='button';toggle.className='idea-view-more';toggle.textContent=T('more');
    toggle.addEventListener('click',()=>{const open=original.classList.toggle('expanded');toggle.textContent=open?T('less'):T('more')});
    original.after(toggle)
   }
  }
  const edit=document.createElement('button');edit.type='button';edit.className='idea-edit';edit.textContent=T('edit');edit.setAttribute('aria-label',T('edit')+' '+item.title);
  edit.addEventListener('click',()=>{
   const editor=document.createElement('div');editor.className='idea-editor';
   const input=document.createElement('textarea');input.value=item.body;input.maxLength=10000;input.setAttribute('aria-label',T('ideaLabel'));editor.append(input);
   const actions=document.createElement('div');actions.className='idea-editor-actions';
   for(const [label,cls,fn] of [
    [T('editCancel'),'idea-cancel',()=>render()],
    [T('editSave'),'idea-edit-save',async()=>{
     const body=input.value.trim();if(!body){announce(T('editMissing'));return}
     if(body===item.body){render();return}
     const {data,error}=await db.from('tle_owner_ideas').update({title:safeTitle(body),body,updated_at:new Date().toISOString()}).eq('id',item.id).eq('owner_id',owner.id).select('id,title,body').single();
     if(error||!data){announce(T('statusError'));return}
     Object.assign(item,data);render();announce(T('edited'))
    }]
   ]){const button=document.createElement('button');button.type='button';button.className=cls;button.textContent=label;button.onclick=fn;actions.append(button)}
   editor.append(actions);card.replaceChildren(editor);input.focus()
  });
  if(title)title.after(edit);
  if(item.origin==='voice'){
   const tag=document.createElement('div');tag.className='idea-note-bar';const span=document.createElement('span');span.textContent='🎙 '+T('voiceTag');tag.append(span);
   if(original)original.after(tag);
  }
  const fields=card.querySelector('.idea-fields');
  if(fields){
   const impact=document.createElement('select');impact.setAttribute('aria-label',T('impact'));
   const names={unrated:T('unrated'),sales:T('helpsSales'),time:T('savesTime'),customer:T('helpsCustomer'),visual:T('visual')};
   Object.keys(names).forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=names[value];impact.append(option)});
   impact.value=item.impact;impact.onchange=async()=>{const value=impact.value;impact.disabled=true;
    const {error}=await db.from('tle_owner_ideas').update({impact:value,updated_at:new Date().toISOString()}).eq('id',item.id).eq('owner_id',owner.id);
    if(error){announce(T('statusError'))}else{item.impact=value}render()
   };fields.append(impact);
  }
 });
 if(cards.length&&!displayed){const empty=document.createElement('div');empty.className='empty';empty.textContent=T('noResults');list.append(empty)}
};
const originalSave=saveIdea;
saveIdea=async function(source){
 const body=$('ideaBody').value.trim();
 const normalized=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 if(body&&ideas.some(item=>normalized(item.body)===normalized(body))){announce(T('duplicate'));return}
 await originalSave(source);
 if(!$('ideaBody').value.trim()&&owner){try{localStorage.removeItem(draftKey())}catch{};$('draftStatus').hidden=true;$('ideaSearch').value='';$('areaFilter').value='all';render()}
 else rememberDraft();
};
function backup(){
 if(!owner||!ideas.length){announce(T('backupEmpty'));return}
 const records=ideas.map(({title,body,origin,area,status,impact,created_at})=>({title,body,origin,area,status,impact,created_at}));
 const blob=new Blob([JSON.stringify({date:new Date().toISOString(),ideas:records},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='TLE-Idea-Vault-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2500);announce(T('backupDone'))
}
const originalLocalize=localize;
localize=function(){
 originalLocalize();
 const select=$('areaFilter');if(!select)return;
 const previous=select.value||'all';select.replaceChildren();
 for(const key of ['all',...areas]){const option=document.createElement('option');option.value=key;option.textContent=key==='all'?T('allAreas'):T(key);select.append(option)}
 select.value=previous;
 $('ideaSearch').placeholder=$('ideaSearch').dataset['placeholder'+(lang==='es'?'Es':'En')];
 render()
};
const originalInit=init;
init=async function(){
 $('ideaSearch').addEventListener('input',()=>render());
 $('areaFilter').addEventListener('change',()=>render());
 $('exportIdeas').addEventListener('click',backup);
 await originalInit()
};

document.addEventListener('DOMContentLoaded',()=>{init().catch(()=>failAccess('signedOut'))});
})();