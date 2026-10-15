/* Owner overview copy and date only. Routing stays with authenticated CRM module. */
(function(){
  'use strict';
  const root=document.getElementById('ownerOverviewHub');
  if(!root)return;
  const es=()=>{try{return localStorage.getItem('tle_crm_language')==='es'}catch{return false}};
  function refresh(){
    const spanish=es(),now=new Date(),hour=now.getHours();
    const greet=hour<12?(spanish?'Buenos días':'Good morning'):hour<18?(spanish?'Buenas tardes':'Good afternoon'):(spanish?'Buenas noches':'Good evening');
    const greeting=document.getElementById('ownerDayGreeting'),date=document.getElementById('ownerTodayDate');
    if(greeting)greeting.textContent=greet;
    if(date){date.textContent=new Intl.DateTimeFormat(spanish?'es-US':'en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(now);date.lang=spanish?'es':'en'}
    root.querySelectorAll('[data-od-en][data-od-es]').forEach(node=>{node.textContent=node.getAttribute(spanish?'data-od-es':'data-od-en')});
  }
  refresh();
  document.addEventListener('tle-crm-language',refresh);
  window.addEventListener('pageshow',refresh);
})();
