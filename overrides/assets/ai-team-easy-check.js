/* Compact owner-only AI Team feedback. Uses only the authenticated response already loaded by ai-team.js. */
(function(){
 "use strict";
 const labels={
  es:{done:"Revisión terminada",partial:"Revisión parcial",missing:"Informe no disponible todavía",details:"Ver todos los detalles",hide:"Ocultar resultado",history:"Abrir historial",facts:"Datos comprobados",checks:"Comprobaciones adicionales",scan:"Resumen listo",scanDetails:"Ver resumen completo",agents:"especialistas revisados",note:"Solo lectura · No se enviaron correos ni se modificaron clientes"},
  en:{done:"Review complete",partial:"Partial review",missing:"Report not yet available",details:"See all details",hide:"Hide result",history:"Open history",facts:"Verified facts",checks:"Additional checks",scan:"Workspace review ready",scanDetails:"See full summary",agents:"specialists checked",note:"Read-only · No emails sent or customer data changed"}
 };
 const translations={
  "Active lead records scanned":"Prospectos activos revisados",
  "Potential follow-ups due":"Posibles seguimientos pendientes",
  "Candidates requiring final consent check":"Consentimientos por comprobar",
  "Lead records":"Registros de prospectos",
  "Booking accounts inspected":"Proyectos de reservas revisados",
  "Paid orders":"Pedidos pagados",
  "Active prospects":"Prospectos activos",
  "Unread owner alerts":"Alertas sin leer",
  "Tasks awaiting approval":"Tareas pendientes de aprobación",
  "Blocked AI Team tasks":"Tareas bloqueadas",
  "Public home":"Página pública",
  "Owner Command Center":"Command Center",
  "Private AI Team":"Equipo IA"
 };
 function node(tag,cls,label){const item=document.createElement(tag);if(cls)item.className=cls;if(label!==undefined)item.textContent=String(label);return item}
 function button(label,handler){const b=node("button","",label);b.type="button";b.addEventListener("click",handler);return b}
 function safe(value,max=400){const text=String(value??"").trim();return text.length>max?text.slice(0,max)+"…":text}
 function localized(label,lang){return lang==="es"?(translations[label]||label):label}
 function showAgentReport(agentKey,run,language){
  const lang=language==="en"?"en":"es",t=labels[lang];
  const agents=document.getElementById("agents");
  if(!agents)return;
  const card=Array.from(agents.querySelectorAll(".ait-agent")).find(a=>a.dataset.agentKey===agentKey);
  if(!card)return;
  agents.querySelectorAll(".ait-agent-inline").forEach(n=>n.remove());
  const report=run&&run.report&&typeof run.report==="object"?run.report:{};
  const successful=run?.status==="success";
  const shell=node("section","ait-agent-inline ait-inline-report");shell.setAttribute("aria-label",t.done);shell.setAttribute("role","region");
  const top=node("div","ait-inline-report-top");
  top.append(node("strong","",t.done),node("span","ait-inline-state"+(successful?" success":""),run?(successful?t.done:t.partial):t.missing));
  shell.append(top);
  if(report.summary)shell.append(node("p","ait-inline-description",safe(report.summary,600)));
  const facts=Array.isArray(report.facts)?report.facts:[];
  if(facts.length){
   const grid=node("div","ait-inline-facts");grid.setAttribute("aria-label",t.facts);
   for(const fact of facts.slice(0,3)){
    const item=node("div","ait-inline-fact");
    item.append(node("span","",localized(safe(fact.label,100),lang)),node("b","",safe(fact.value===null||fact.value===undefined?"—":fact.value,150)));grid.append(item);
   }
   shell.append(grid);
  }
  const checks=Array.isArray(report.checks)?report.checks:[];
  const more=facts.length>3||checks.length>0;
  if(more){
   const details=node("details","");details.append(node("summary","",t.details));
   const body=node("div","ait-inline-detail");
   for(const fact of facts.slice(3,12))body.append(node("p","",localized(safe(fact.label,100),lang)+": "+safe(fact.value===null||fact.value===undefined?"—":fact.value,150)));
   for(const check of checks.slice(0,12)){
    const status=check.http_status===null?"—":(check.http_status===undefined?"—":String(check.http_status));
    body.append(node("p","",localized(safe(check.label,100),lang)+": "+status));
   }
   details.append(body);shell.append(details);
  }
  shell.append(node("p","ait-inline-description",t.note));
  const actions=node("div","ait-inline-controls");
  actions.append(button(t.hide,()=>shell.remove()));
  actions.append(button(t.history,()=>document.getElementById("runs-section")?.scrollIntoView({behavior:"smooth",block:"start"})));
  shell.append(actions);card.append(shell);
 }
 function showTeamScan(scan,language){
  const lang=language==="en"?"en":"es",t=labels[lang];
  const actions=document.querySelector(".ait-hero-actions");if(!actions)return;
  let host=document.getElementById("ait-easy-scan");
  if(!host){host=node("div","ait-inline-scan");host.id="ait-easy-scan";host.setAttribute("role","status");actions.after(host)}
  const reports=Array.isArray(scan?.reports)?scan.reports:[];
  const reviewed=reports.filter(x=>x.status==="checked").length;
  host.replaceChildren(node("strong","",t.scan+" · "+reviewed+"/"+reports.length+" "+t.agents));
  host.append(button(t.scanDetails,()=>document.getElementById("team-overview")?.scrollIntoView({behavior:"smooth",block:"start"})));
 }
 window.TLEAITeamEasyCheck=Object.freeze({showAgentReport,showTeamScan});
})();
