(()=>{
'use strict';
const API='https://bowacxhmjvrqixtwaikv.supabase.co';
const KEY='sb_publishable_0TueitFYiRF3rAEMLMT8-w_FvbvY0rB';
const $=id=>document.getElementById(id);
const strings={
en:{back:'Command Center',eyebrow:'YOUR SPACE TO THINK',intro:'Capture the thought. You do not have to work on it today.',inboxTag:'PRIVATE INBOX',capture:'What is on your mind?',notTask:'Not a task yet',ideaLabel:'Idea text',voice:'Speak your idea',stop:'Stop listening',save:'Save idea →',voiceHelp:'On iPhone, you can also tap the microphone on your keyboard to dictate your idea.',peace:'NO RUSH. NO PRESSURE.',allIdeas:'Saved ideas',refresh:'↻ Refresh',filterInbox:'Inbox',filterReview:'Review',filterApproved:'Approved',filterAll:'All',footer:'Your ideas are safe here. Capturing an idea never starts any work.',empty:'No ideas here yet. Your mind can rest — this space is ready.',saved:'✓ Idea saved. You can let it go for now.',saving:'Saving your idea…',missing:'Say or type your idea first.',failed:'Could not save. Your text is still here. Try again.',micFallback:'Tap the microphone on your iPhone keyboard and dictate your idea, then tap Save idea.',listError:'Could not load saved ideas. Try Refresh.',listening:'Listening… Speak naturally. Saving when you finish.',speechError:'Voice recognition stopped. Your text is still here; tap Save idea.',statusError:'Could not update this idea. Please try again.',signedOut:'Sign in to your private Command Center first.',denied:'This Idea Vault is only available in the private owner workspace.',inbox:'Inbox',review:'Review',approved:'Approved',doing:'In progress',done:'Done',archived:'Archived',website:'Website',cleaning_app:'Cleaning App',ai_assistants:'AI Assistants',marketing:'Marketing',sales:'Sales',automations:'Automations',other:'Other'},
es:{back:'Command Center',eyebrow:'TU ESPACIO PARA PENSAR',intro:'Guarda esa idea. No tienes que trabajar en ella hoy.',inboxTag:'BANDEJA PRIVADA',capture:'¿Qué se te ocurrió?',notTask:'Aún no es una tarea',ideaLabel:'Texto de la idea',voice:'Dictar idea',stop:'Terminar dictado',save:'Guardar idea →',voiceHelp:'En iPhone también puedes tocar el micrófono del teclado para dictar tu idea.',peace:'SIN PRISA. SIN PRESIÓN.',allIdeas:'Ideas guardadas',refresh:'↻ Actualizar',filterInbox:'Bandeja',filterReview:'Revisar',filterApproved:'Aprobadas',filterAll:'Todas',footer:'Aquí tus ideas están a salvo. Guardarlas nunca inicia trabajo automáticamente.',empty:'Todavía no hay ideas aquí. Este espacio está listo cuando lo necesites.',saved:'✓ Idea guardada. Puedes dejar de pensar en ella por ahora.',saving:'Guardando tu idea…',missing:'Primero di o escribe tu idea.',failed:'No se pudo guardar. Tu texto sigue aquí. Inténtalo otra vez.',micFallback:'Toca el micrófono del teclado del iPhone, dicta y luego pulsa Guardar idea.',listError:'No se pudieron cargar las ideas. Prueba Actualizar.',listening:'Te escucho… Habla con naturalidad. Guardaré al terminar.',speechError:'Se detuvo el dictado. Tu texto sigue aquí; pulsa Guardar idea.',statusError:'No se pudo actualizar esta idea. Inténtalo otra vez.',signedOut:'Primero entra a tu Command Center privado.',denied:'Este Idea Vault solo está disponible en el espacio privado de la dueña.',inbox:'Bandeja',review:'Revisar',approved:'Aprobada',doing:'En proceso',done:'Hecha',archived:'Archivada',website:'Website',cleaning_app:'Cleaning App',ai_assistants:'AI Assistants',marketing:'Marketing',sales:'Ventas',automations:'Automations',other:'Otra'}
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
async function refresh(){const {data,error}=await db.from('tle_owner_ideas').select('id,title,body,origin,area,status,impact,created_at').eq('owner_id',owner.id).order('created_at',{ascending:false}).limit(250);if(error){announce(T('listError'));return}ideas=data||[];render()}
async function saveIdea(source){if(saving||!db||!owner)return;
 const body=$('ideaBody').value.trim();
 if(!body){announce(T('missing'));return}
 saving=true;$('saveIdea').disabled=true;announce(T('saving'));
 const {data,error}=await db.from('tle_owner_ideas').insert({owner_id:owner.id,title:safeTitle(body),body,origin:source==='voice'?'voice':'text',area:'other',status:'inbox',impact:'unrated'}).select('id,title,body,origin,area,status,impact,created_at').single();
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
 voiceResult=full.trim();$('ideaBody').value=[base,full.trim(),interim.trim()].filter(Boolean).join(' ').trim()};
speech.onerror=()=>{hadError=true;announce(T('speechError'))};
speech.onend=async()=>{speaking=false;$('voiceButton').classList.remove('active');$('voiceButton').querySelector('[data-i18n]').textContent=T('voice');
 $('ideaBody').value=[base,full.trim()].filter(Boolean).join(' ').trim();
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
await refresh();
}
document.addEventListener('DOMContentLoaded',()=>{init().catch(()=>failAccess('signedOut'))});
})();