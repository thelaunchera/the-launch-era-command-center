/* TLE Booking Motion Calendar — additive, read-only presentation of native calendar DOM.
   All events originate from the authenticated app and native actions remain authoritative. */
(function(){
  'use strict';
  const rootIds=['buyerAppointmentsHub','ownerCalendarHub'];
  const text={
    en:{title:'Your week at a glance',ownerTitle:'Client work this week',buyerInfo:'Confirmed appointments and requests from your real calendar.',ownerInfo:'Orders, intake, production, QA and delivery targets from your private calendar.',week:'Week',month:'Month',today:'Today',shown:'Visible entries',confirmed:'Confirmed',pending:'Pending',ownerItems:'Recorded milestones',view:'Open day details',more:'More in day view',emptyBuyer:'No appointments shown',emptyOwner:'No milestones shown',notReady:'Open the monthly calendar to see this date.',booking:'My Booking Page',refresh:'Refresh calendar',previous:'Previous week',next:'Next week',days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']},
    es:{title:'Tu semana de un vistazo',ownerTitle:'Trabajo de clientes esta semana',buyerInfo:'Reservas confirmadas y solicitudes de tu calendario real.',ownerInfo:'Pedidos, intake, producción, QA y entregas de tu calendario privado.',week:'Semana',month:'Mes',today:'Hoy',shown:'Eventos visibles',confirmed:'Confirmadas',pending:'Pendientes',ownerItems:'Hitos registrados',view:'Abrir detalles del día',more:'Ver más del día',emptyBuyer:'Sin citas visibles',emptyOwner:'Sin hitos visibles',notReady:'Abre la vista mensual para esta fecha.',booking:'Mi Booking Page',refresh:'Actualizar calendario',previous:'Semana anterior',next:'Semana siguiente',days:['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']}
  };
  const make=(tag,cls,content)=>{
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(content!==undefined)el.textContent=content;
    return el;
  };
  const dateKey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const fromKey=s=>new Date(Number(s.slice(0,4)),Number(s.slice(5,7))-1,Number(s.slice(8,10)),12);
  const shift=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n,12);
  const startOfWeek=d=>shift(d,-d.getDay());
  const localLanguage=()=>{try{return localStorage.getItem('tle_crm_language')==='es'?'es':'en'}catch{return 'en'}};
  const states=new Map();
  function create(kind){
    const hub=document.getElementById(kind==='buyer'?'buyerAppointmentsHub':'ownerCalendarHub');
    const grid=document.getElementById(kind==='buyer'?'buyerCalendarGrid':'ownerCalGrid');
    if(!hub||!grid)return;
    const parent=grid.closest('.panel');
    if(!parent)return;
    const bar=make('section','ml-booking-motion');
    bar.setAttribute('aria-label','Booking calendar week view');
    const top=make('div','ml-motion-top');
    const heading=make('div','ml-motion-heading');
    const title=make('h3','','');
    const subtitle=make('p','','');
    heading.append(title,subtitle);
    const controls=make('div','ml-motion-controls');
    const previous=make('button','ml-motion-icon','‹'),next=make('button','ml-motion-icon','›');
    previous.type=next.type='button';
    const today=make('button','ml-motion-control','');
    const week=make('button','ml-motion-control selected','');
    const month=make('button','ml-motion-control','');
    for(const b of [today,week,month])b.type='button';
    controls.append(previous,today,next,week,month);
    top.append(heading,controls);
    const layout=make('div','ml-motion-layout');
    const side=make('aside','ml-motion-side');
    const sideHead=make('div','ml-motion-side-head');
    const sideMetric=make('strong','ml-motion-side-metric','0');
    const sideLabel=make('span','ml-motion-side-label','');
    const metrics=make('div','ml-motion-metrics');
    sideHead.append(sideMetric,sideLabel);
    side.append(sideHead,metrics);
    if(kind==='buyer'){
      const booking=make('button','ml-motion-booking','');
      booking.type='button';
      booking.addEventListener('click',()=>{
        const real=document.getElementById('buyerBookingPreviewNav');
        if(real&&!real.classList.contains('hidden'))real.click();
      });
      side.append(booking);
    }
    const schedule=make('div','ml-motion-schedule');
    schedule.setAttribute('role','group');
    layout.append(side,schedule);
    bar.append(top,layout);
    grid.parentElement.insertBefore(bar,grid);
    const state={kind,hub,grid,bar,schedule,title,subtitle,controls,previous,next,today,week,month,sideMetric,sideLabel,metrics,side,mode:'week',cursor:null,updateQueued:false};
    states.set(kind,state);
    previous.setAttribute('aria-label','Previous week');
    next.setAttribute('aria-label','Next week');
    function setMode(mode){
      state.mode=mode;
      hub.classList.toggle('ml-week-mode',mode==='week');
      hub.classList.toggle('ml-month-mode',mode==='month');
      week.classList.toggle('selected',mode==='week');
      month.classList.toggle('selected',mode==='month');
      week.setAttribute('aria-pressed',String(mode==='week'));
      month.setAttribute('aria-pressed',String(mode==='month'));
      render(state);
    }
    previous.addEventListener('click',()=>navigate(state,-7));
    next.addEventListener('click',()=>navigate(state,7));
    today.addEventListener('click',()=>{
      state.cursor=new Date();
      const btn=document.getElementById(kind==='buyer'?'buyerCalendarToday':'ownerCalToday');
      if(btn)btn.click();
      queue(state);
    });
    week.addEventListener('click',()=>setMode('week'));
    month.addEventListener('click',()=>setMode('month'));
    const observer=new MutationObserver(()=>queue(state));
    observer.observe(grid,{childList:true});
    window.addEventListener('focus',()=>{if(!hub.classList.contains('hidden'))queue(state)});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue(state)});
    setMode('week');
  }
  function navigate(state,days){
    const base=state.cursor||new Date();
    state.cursor=shift(base,days);
    const target=dateKey(state.cursor).slice(0,7);
    const actual=state.grid.dataset.monthKey;
    if(actual&&actual!==target){
      const go=document.getElementById(state.kind==='buyer'?(target>actual?'buyerCalendarNext':'buyerCalendarPrev'):(target>actual?'ownerCalNext':'ownerCalPrev'));
      if(go)go.click();
    }
    queue(state);
  }
  function queue(state){
    if(state.updateQueued)return;
    state.updateQueued=true;
    requestAnimationFrame(()=>{state.updateQueued=false;render(state)});
  }
  function render(state){
    const lang=localLanguage(),t=text[lang],buyer=state.kind==='buyer',owner=state.kind==='owner';
    state.title.textContent=buyer?t.title:t.ownerTitle;
    state.subtitle.textContent=buyer?t.buyerInfo:t.ownerInfo;
    state.today.textContent=t.today;state.week.textContent=t.week;state.month.textContent=t.month;
    state.previous.setAttribute('aria-label',t.previous);state.next.setAttribute('aria-label',t.next);
    state.sideLabel.textContent=buyer?t.shown:t.ownerItems;
    const booking=state.side.querySelector('.ml-motion-booking');
    if(booking){
      booking.textContent=t.booking+' ↗';
      const real=document.getElementById('buyerBookingPreviewNav');
      booking.disabled=!real||real.classList.contains('hidden');
    }
    const selected=state.grid.querySelector(buyer?'.buyer-cal-cell.selected[data-day-key]':'button[aria-pressed="true"][data-day-key]');
    if(!state.cursor&&selected?.dataset.dayKey)state.cursor=fromKey(selected.dataset.dayKey);
    if(!state.cursor)state.cursor=new Date();
    const first=startOfWeek(state.cursor);
    state.schedule.replaceChildren();
    let count=0,booked=0,pending=0;
    for(let i=0;i<7;i++){
      const date=shift(first,i),key=dateKey(date);
      const box=make('div','ml-motion-day'+(key===dateKey(new Date())?' is-today':''));
      const hd=make('div','ml-motion-day-head');
      hd.append(make('span','',t.days[date.getDay()]),make('strong','',String(date.getDate())));
      const clickDay=()=>{
        const match=state.grid.querySelector('[data-day-key="'+key+'"]');
        if(!match)return;
        const origin=buyer?match.querySelector('.buyer-cal-day-button'):match;
        if(origin)origin.click();
        const panel=document.getElementById(buyer?'buyerCalendarDayList':'ownerCalDayPanel');
        if(panel)panel.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
      };
      const dayButton=make('button','ml-motion-open',t.view+' →');
      dayButton.type='button';dayButton.addEventListener('click',clickDay);
      const match=state.grid.querySelector('[data-day-key="'+key+'"]');
      dayButton.disabled=!match;
      const entries=make('div','ml-motion-entries');
      if(match){
        const sources=buyer?[...match.querySelectorAll('.buyer-cal-event')]:[...match.querySelectorAll('[data-calendar-kind]')];
        for(const source of sources){
          count++;
          if(buyer){if(source.classList.contains('booked'))booked++;else pending++;}
          const label=source.textContent.trim();
          const item=make('button','ml-motion-event '+(buyer?(source.classList.contains('booked')?'confirmed':'pending'):source.dataset.calendarKind.startsWith('plan_')?'planned':'milestone'),label);
          item.type='button';item.title=source.title||label;
          item.addEventListener('click',()=>{if(buyer)source.click();else clickDay()});
          entries.append(item);
        }
        const more=buyer?match.querySelector('.buyer-cal-more'):null;
        if(more){
          const link=make('button','ml-motion-more',t.more+' →');
          link.type='button';link.addEventListener('click',()=>more.click());entries.append(link);
        }else if(!entries.childElementCount){
          entries.append(make('p','ml-motion-empty',buyer?t.emptyBuyer:t.emptyOwner));
        }
      }else{
        entries.append(make('p','ml-motion-empty',t.notReady));
      }
      box.append(hd,entries,dayButton);state.schedule.append(box);
    }
    state.sideMetric.textContent=String(count);
    state.metrics.replaceChildren();
    if(buyer){
      for(const [label,val,cls] of [[t.confirmed,booked,'confirmed'],[t.pending,pending,'pending']]){
        const p=make('p','ml-motion-metric '+cls);
        p.append(make('span','',label),make('strong','',String(val)));state.metrics.append(p);
      }
    }else{
      const p=make('p','ml-motion-metric');
      p.textContent=lang==='es'?'Fechas del calendario de clientes':'Client calendar dates';
      state.metrics.append(p);
    }
    const end=shift(first,6);
    const range=first.toLocaleDateString(lang==='es'?'es-US':'en-US',{month:'short',day:'numeric'})+' – '+end.toLocaleDateString(lang==='es'?'es-US':'en-US',{month:'short',day:'numeric',year:'numeric'});
    state.schedule.setAttribute('aria-label',range);
    state.bar.dataset.ready='true';
  }
  function init(){for(const id of rootIds){}create('owner');create('buyer');}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();