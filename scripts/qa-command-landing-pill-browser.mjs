import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {chromium} from "playwright";
const raw=readFileSync(".site/index.html","utf8");
const css=readFileSync(".site/assets/command-landing-pill.css","utf8");
const js=readFileSync(".site/assets/command-landing-pill.js","utf8");
const markup=raw.match(/<span id="tleHeaderScrollSentinel"[\s\S]*?<\/header>/)?.[0];
assert.ok(markup,"Header fixture could not be recovered from published build");
const browser=await chromium.launch({headless:true});
try{
 for(const width of [375,768,1024,1440]){
  const page=await browser.newPage({viewport:{width,height:850},reducedMotion:"no-preference"});
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body style="margin:0"><form id="authForm"><input type="email"></form>'+markup+'<div style="height:2600px"></div></body></html>');
  await page.addScriptTag({content:js});
  await page.waitForFunction(()=>!document.querySelector(".tle-landing-header").classList.contains("is-floating"));
  let state=await page.locator(".tle-landing-header").evaluate(el=>({pill:el.classList.contains("is-floating"),link:el.querySelector("a")?.getAttribute("href"),buttons:el.querySelectorAll("#logout").length}));
  assert.equal(state.pill,false);
  assert.equal(state.link,"#authForm");
  assert.equal(state.buttons,1);
  await page.evaluate(()=>window.scrollTo(0,48));
  await page.waitForFunction(()=>document.querySelector(".tle-landing-header").classList.contains("is-floating"));
  await page.waitForTimeout(720);
  state=await page.locator(".tle-landing-header").evaluate(el=>({clip:getComputedStyle(el.querySelector(".tle-header-surface")).clipPath,transform:getComputedStyle(el).transform,overflow:document.documentElement.scrollWidth>innerWidth+2,link:el.querySelector(".tle-header-action").getBoundingClientRect().width}));
  assert.match(state.clip,/12%/,"Header did not clip to pill shape");
  assert.equal(state.overflow,false,"Header created horizontal overflow at "+width);
  assert.ok(state.link>0,"CTA must remain visible");
  await page.locator(".tle-header-action").focus();
  assert.ok(await page.locator(".tle-header-action").evaluate(el=>el===document.activeElement),"CTA lost focusability");
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForFunction(()=>!document.querySelector(".tle-landing-header").classList.contains("is-floating"));
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:375,height:850},reducedMotion:"reduce"});
 await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body style="margin:0"><form id="authForm"></form>'+markup+'<div style="height:2600px"></div></body></html>');
 await page.addScriptTag({content:js});
 await page.evaluate(()=>window.scrollTo(0,50));
 await page.waitForFunction(()=>document.querySelector(".tle-landing-header").classList.contains("is-floating"));
 const reduced=await page.locator(".tle-landing-header").evaluate(el=>getComputedStyle(el).transitionDuration);
 assert.equal(reduced,"0s");
 await page.close();
 console.log("PASS: 1px sentinel, 16px scroll cutoff, focus and four widths with reduced motion");
}finally{await browser.close();}
