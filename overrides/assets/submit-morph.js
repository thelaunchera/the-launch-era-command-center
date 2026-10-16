/* Minimal accessible submit state helper. A green check is NEVER inferred from a click. */
(function(){
 'use strict';
 if(window.TLESubmitMotion)return;
 const prepared=new WeakMap();
 const localized=(es,stage)=>es?({loading:'Procesando solicitud',done:'Guardado correctamente',error:'No se pudo completar. Vuelve a intentarlo.'}[stage]||''):({loading:'Processing request',done:'Saved successfully',error:'Could not complete. Please try again.'}[stage]||'');
 function prepare(button){
  if(!(button instanceof HTMLButtonElement))return null;
  if(prepared.has(button))return prepared.get(button);
  const wrapper=document.createElement('span');wrapper.className='tle-motion-wrap';
  button.parentNode.insertBefore(wrapper,button);wrapper.append(button);
  const label=document.createElement('span');label.className='tle-motion-label';
  while(button.firstChild)label.append(button.firstChild);
  const green=document.createElement('span');green.className='tle-motion-green';green.setAttribute('aria-hidden','true');
  const dots=document.createElement('span');dots.className='tle-motion-dots';dots.setAttribute('aria-hidden','true');
  for(let i=0;i<3;i++)dots.append(document.createElement('i'));
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('tle-motion-check');svg.setAttribute('viewBox','0 0 28 28');svg.setAttribute('fill','none');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d','M6 14l5.5 5.5L22 8');path.setAttribute('pathLength','1');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','2.7');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);
  const live=document.createElement('span');live.className='tle-motion-live';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');wrapper.append(live);
  button.append(green,label,dots,svg);button.dataset.motionState='idle';
  const state={label,live,originalDisabled:button.disabled,timer:null};
  prepared.set(button,state);
  return state;
 }
 function measure(button){
  const box=button.getBoundingClientRect(),width=Math.max(box.width,44),height=Math.max(box.height,44);
  button.style.setProperty('--tle-motion-width',width+'px');
  button.style.setProperty('--tle-motion-inset',Math.max(0,(width-height)/2)+'px');
 }
 function set(button,stage,opts={}){
  const v=prepare(button);if(!v)return false;
  window.clearTimeout(v.timer);
  if(stage==='loading'&&button.dataset.motionState==='loading')return false;
  if(stage==='loading')measure(button);
  const es=opts.language==='es'||(!opts.language&&document.documentElement.lang.startsWith('es'));
  button.dataset.motionState=stage==='error'?'idle':stage;
  button.setAttribute('aria-busy',String(stage==='loading'));
  button.disabled=stage==='loading'||stage==='done';
  v.live.textContent=opts.message||localized(es,stage);
  if(stage==='done'){
   const duration=Number.isFinite(opts.resetAfter)?Math.max(600,opts.resetAfter):1050;
   v.timer=window.setTimeout(()=>set(button,'idle'),duration);
  }
  if(stage==='idle'||stage==='error'){
   button.disabled=v.originalDisabled;
   button.removeAttribute('aria-busy');
   if(stage==='idle')v.live.textContent='';
  }
  return true;
 }
 window.TLESubmitMotion={
  start(button,opts){return set(button,'loading',opts)},
  done(button,opts){return set(button,'done',opts)},
  error(button,opts){return set(button,'error',opts)},
  reset(button){return set(button,'idle')},
  pause(ms=780){return window.matchMedia('(prefers-reduced-motion: reduce)').matches?Promise.resolve():new Promise(resolve=>window.setTimeout(resolve,ms))}
 };
})();
