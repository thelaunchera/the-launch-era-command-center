/* Private-owner-only progressive CRM interactions. No new data access or API privileges. */
(()=>{'use strict';
const stages=['New','Contacted','Follow-up','Won'];
const mode=()=>document.body.classList.contains('crm-owner-view')&&!document.getElementById('app')?.classList.contains('hidden');
let board=null, observer=null, pending=null, toastTimer=0;
const byId=id=>document.getElementById(id);
const es=()=>{try{return localStorage.getItem('tle_crm_language')==='es'}catch{return false}};
const tx=(en,sp)=>es()?sp:en;
const stageLabel=s=>s==='Follow-up'?tx('Follow-up','Seguimiento'):s==='Contacted'?tx('Contacted','Contactado'):s==='Won'?tx('Won','Ganado'):s==='New'?tx('New','Nuevo'):s;
function toast(message){
 const holder=byId('crmUpgradeToast');
 if(!holder)return;
 clearTimeout(toastTimer);holder.textContent=message;holder.classList.add('visible');
 toastTimer=setTimeout(()=>holder.classList.remove('visible'),3200);
}
function animateNumber(target,from,to){
 if(!target||from===to)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduce){target.textContent=String(to);return}
 const start=performance.now();
 function tick(now){if(!target.isConnected)return;const t=Math.min(1,(now-start)/450);
  target.textContent=String(Math.round(from+(to-from)*(1-(1-t)**3)));
  if(t<1)requestAnimationFrame(tick);
 }
 requestAnimationFrame(tick);
}
function createChips(){
 const filters=byId('leadFilters'),st=byId('stageFilter'),due=byId('dueFilter');
 if(!filters||!st||!due||byId('crmUpgradeFilters'))return;
 const strip=document.createElement('div');strip.id='crmUpgradeFilters';strip.className='crm-upgrade-filters';
 strip.setAttribute('aria-label',tx('Quick pipeline filters','Filtros rápidos del pipeline'));
 const set=document.createElement('div');set.className='crm-upgrade-chipset';set.setAttribute('role','group');set.setAttribute('aria-label',tx('Pipeline stages','Etapas del pipeline'));
 for(const stage of ['',...stages]){
  const btn=document.createElement('button');btn.type='button';btn.className='crm-upgrade-chip';btn.dataset.stageFilter=stage;
  btn.textContent=stage?stageLabel(stage):tx('All','Todos');
  btn.setAttribute('aria-pressed',String(st.value===stage));
  btn.addEventListener('click',()=>{st.value=stage;st.dispatchEvent(new Event('change',{bubbles:true}));updateChips()});
  set.append(btn);
 }
 const dueSet=document.createElement('div');dueSet.className='crm-upgrade-chipset';dueSet.setAttribute('role','group');dueSet.setAttribute('aria-label',tx('Due dates','Vencimientos'));
 for(const [value,en,sp] of [['','Any date','Todas las fechas'],['overdue','Overdue','Atrasados'],['today','Today','Hoy'],['week','Next 7 days','7 días']]){
  const btn=document.createElement('button');btn.type='button';btn.className='crm-upgrade-chip';btn.dataset.dueFilter=value;btn.textContent=tx(en,sp);
  btn.setAttribute('aria-pressed',String(due.value===value));
  btn.addEventListener('click',()=>{due.value=value;due.dispatchEvent(new Event('change',{bubbles:true}));updateChips()});
  dueSet.append(btn);
 }
 strip.append(set,dueSet);filters.insertAdjacentElement('afterend',strip);
 [st,due].forEach(select=>select.addEventListener('change',updateChips));
 updateChips();
}
function updateChips(){
 const st=byId('stageFilter'),due=byId('dueFilter');
 document.querySelectorAll('#crmUpgradeFilters [data-stage-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stageFilter===(st?.value||''))));
 document.querySelectorAll('#crmUpgradeFilters [data-due-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dueFilter===(due?.value||''))));
}
function snapshot(){
 const positions=new Map();
 board?.querySelectorAll('.premium-lead[data-lead-id]').forEach(card=>{
  const id=card.dataset.leadId;if(!id)return;
  const r=card.getBoundingClientRect();positions.set(id,{x:r.left,y:r.top});
 });
 return positions;
}
function afterRender(){
 if(!mode()||!board)return;
 decorate();
 if(pending){
  const p=pending;pending=null;
  const changed=board.querySelector('.premium-lane[data-stage="'+CSS.escape(p.to)+'"] .premium-lead[data-lead-id="'+CSS.escape(p.id)+'"]');
  if(changed){
   const shouldMove=!matchMedia('(prefers-reduced-motion: reduce)').matches;
   if(shouldMove)requestAnimationFrame(()=>{
    board.querySelectorAll('.premium-lead[data-lead-id]').forEach(card=>{
     const prev=p.positions.get(card.dataset.leadId);if(!prev)return;
     const next=card.getBoundingClientRect();
     const dx=prev.x-next.left,dy=prev.y-next.top;
     if(Math.abs(dx)>1||Math.abs(dy)>1){card.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'translate(0,0)'}],{duration:594,easing:'cubic-bezier(.21,.9,.21,1)',fill:'none'});}
    });
   });
   toast(p.name+' '+tx('moved to','movido a')+' '+stageLabel(p.to));
  }
 }
}
function doMove(card,to){
 if(!mode()||!board||!stages.includes(to)||!card?.isConnected)return false;
 const lane=card.closest('.premium-lane'),old=lane?.dataset.stage,select=card.querySelector('.premium-stage-control select');
 if(!old||!select||select.disabled||old===to)return false;
 pending={id:card.dataset.leadId||'',name:(card.querySelector('.premium-lead-name')?.textContent||tx('Lead','Prospecto')).trim(),to,positions:snapshot()};
 select.value=to;select.dispatchEvent(new Event('change',{bubbles:true}));
 setTimeout(()=>{if(pending?.id===(card.dataset.leadId||''))pending=null},9000);
 return true;
}
function setupDrag(card){
 if(card.dataset.crmEnhanced==='yes')return;card.dataset.crmEnhanced='yes';
 if(!card.dataset.leadId)return;
 const handle=document.createElement('button');handle.type='button';handle.className='crm-grab';
 handle.textContent='⋮⋮';handle.title=tx('Move this lead to another stage','Mover a otra etapa');
 handle.setAttribute('aria-label',handle.title);
 const header=card.querySelector('.premium-lead-upper');if(!header)return;header.append(handle);
 handle.addEventListener('click',e=>e.stopPropagation());
 handle.addEventListener('pointerdown',event=>{
  if(event.button!==0||!mode())return;
  event.preventDefault();event.stopPropagation();
  const from=card.closest('.premium-lane')?.dataset.stage;
  if(!from)return;
  const x=event.clientX,y=event.clientY;
  let ghost=null,target=null;
  try{handle.setPointerCapture(event.pointerId)}catch{}
  const move=e=>{
   if(!ghost&&Math.hypot(e.clientX-x,e.clientY-y)<5)return;
   if(!ghost){
    const r=card.getBoundingClientRect();ghost=card.cloneNode(true);ghost.classList.add('crm-drag-ghost');
    ghost.style.width=r.width+'px';ghost.style.left=r.left+'px';ghost.style.top=r.top+'px';
    document.body.append(ghost);card.classList.add('crm-drag-origin');
   }
   ghost.style.transform='translate('+(e.clientX-x)+'px,'+(e.clientY-y)+'px) rotate(1.6deg) scale(1.03)';
   const at=document.elementFromPoint(e.clientX,e.clientY)?.closest('.premium-lane');
   if(target!==at){target?.classList.remove('crm-drop-target');target=at;target?.classList.add('crm-drop-target')}
  };
  const end=e=>{
   handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',cancel);
   if(ghost&&e.type==='pointerup'&&target&&target.dataset.stage!==from)doMove(card,target.dataset.stage);
   ghost?.remove();card.classList.remove('crm-drag-origin');target?.classList.remove('crm-drop-target');
   try{handle.releasePointerCapture(event.pointerId)}catch{}
  };
  const cancel=e=>end(e);
  handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end,{once:true});handle.addEventListener('pointercancel',cancel,{once:true});
 });
 card.addEventListener('keydown',e=>{
  if(!mode()||e.altKey||e.ctrlKey||e.metaKey||e.target!==card||!['ArrowLeft','ArrowRight'].includes(e.key))return;
  const stage=card.closest('.premium-lane')?.dataset.stage,i=stages.indexOf(stage);
  const next=stages[i+(e.key==='ArrowRight'?1:-1)];
  if(next){e.preventDefault();doMove(card,next)}
 });
}
function decorate(){
 if(!mode()||!board)return;
 document.body.classList.add('crm-owner-upgraded');
 board.querySelectorAll('.premium-lead').forEach(setupDrag);
 const lanes=[...board.querySelectorAll('.premium-lane')];
 const total=lanes.reduce((n,l)=>n+Number(l.querySelector('.premium-lane-count')?.textContent||0),0);
 const count=byId('crmUpgradeVisible');
 if(count){const before=Number(count.dataset.current||'0');count.dataset.current=String(total);animateNumber(count,before,total);}
 updateChips();
}
function init(){
 if(!mode())return;
 const root=byId('board');
 if(!root)return;
 if(root!==board){
  observer?.disconnect();board=root;
  observer=new MutationObserver(()=>afterRender());
  observer.observe(board,{childList:true});
 }
 createChips();
 if(!byId('crmUpgradeVisible')){
  const headline=byId('leadToolbar')?.querySelector('.section-title');
  if(headline){
   const span=document.createElement('span');span.className='crm-upgrade-total';
   const count=document.createElement('strong');count.id='crmUpgradeVisible';count.dataset.current='0';
   span.append(count,document.createTextNode(' '+tx('visible','visibles')));headline.append(span);
  }
 }
 if(!byId('crmUpgradeToast')){
  const t=document.createElement('div');t.id='crmUpgradeToast';t.className='crm-upgrade-toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');document.body.append(t);
 }
 afterRender();
}
let scheduled=false;
const watch=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;init()})});
function start(){watch.observe(document.body,{attributes:true,attributeFilter:['class'],subtree:false});init()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();