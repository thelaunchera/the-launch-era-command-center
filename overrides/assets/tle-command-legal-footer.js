/* Lightweight legal footer for the isolated Command Center. No user data or payment state is read. */
(()=>{"use strict";
 const id="tle-command-legal-footer";
 const policies={
 en:[["https://thelaunchera.com/privacy.html","Privacy"],["https://thelaunchera.com/terms.html","Terms"],["https://thelaunchera.com/refunds.html","Refunds"],["https://thelaunchera.com/cookies.html","Cookies"],["https://thelaunchera.com/privacy-choices.html","Your data"]],
 es:[["https://thelaunchera.com/es/privacy.html","Privacidad"],["https://thelaunchera.com/es/terms.html","Términos"],["https://thelaunchera.com/es/refunds.html","Reembolsos"],["https://thelaunchera.com/es/cookies.html","Cookies"],["https://thelaunchera.com/es/privacy-choices.html","Tus datos"]]
 };
 function install(){
  if(document.getElementById(id)||!document.body)return;
  const es=document.documentElement.lang?.toLowerCase().startsWith("es")===true;
  const foot=document.createElement("footer");foot.id=id;foot.setAttribute("aria-label",es?"Políticas de The Launch Era":"The Launch Era policies");
  const nav=document.createElement("nav");nav.setAttribute("aria-label",es?"Privacidad y legales":"Privacy and legal policies");
  for(const [url,label] of policies[es?"es":"en"]){const link=document.createElement("a");link.href=url;link.textContent=label;link.target="_blank";link.rel="noopener noreferrer";nav.appendChild(link)}
  const credit=document.createElement("p");credit.append(document.createTextNode("© "+new Date().getFullYear()+" The Launch Era · "));
  const a=document.createElement("a");a.href="https://thelaunchera.com/";a.target="_blank";a.rel="noopener noreferrer";a.textContent="Powered by The Launch Era";credit.append(a);
  foot.append(nav,credit);document.body.append(foot);
  const style=document.createElement("style");style.id="tle-command-legal-style";style.textContent="#tle-command-legal-footer{box-sizing:border-box;clear:both;position:relative;z-index:1;background:#FAF8F3;color:#191919;border-top:1px solid #E3E4E1;padding:17px 14px max(19px,env(safe-area-inset-bottom,19px));margin:0;text-align:center;font:400 12px/1.6 system-ui,-apple-system,Arial,sans-serif}#tle-command-legal-footer nav{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 14px;max-width:930px;margin:0 auto 6px}#tle-command-legal-footer a{display:inline-flex;align-items:center;min-height:39px;color:inherit;text-decoration:underline;text-underline-offset:3px}#tle-command-legal-footer a:focus-visible{outline:2px solid #191919;outline-offset:2px}#tle-command-legal-footer p{margin:4px 0 0;color:#505050;font-size:11px}@media(max-width:480px){#tle-command-legal-footer nav{gap:2px 11px}#tle-command-legal-footer a{min-height:44px}}";document.head.append(style)
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();