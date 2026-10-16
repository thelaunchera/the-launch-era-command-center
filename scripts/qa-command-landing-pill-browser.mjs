import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {chromium} from "playwright";
const raw=readFileSync(".site/index.html","utf8");
const css=readFileSync(".site/assets/command-landing-pill.css","utf8");
const js=readFileSync(".site/assets/command-landing-pill.js","utf8");
const markup=raw.match(/<span id="tleHeaderScrollSentinel"[\s\S]*?<\/header>/)?.[0];
assert.ok(markup,"Header fixture missing from assembled Command Center");
const browser=await chromium.launch({headless:true});
try{
 for(const width of [375,768,1024,1440]){
  const page=await browser.newPage({viewport:{width,height:850},reducedMotion:"no-preference"});
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font-family:Arial}</style><style>'+css+'</style></head><body>'+markup+'<main style="min-height:2200px;padding:20px"><form id="authForm"><label>Email<input type="email"></label><label>Password<input type="password"></label><button id="signin" type="submit">Sign in</button></form></main></body></html>');
  await page.addScriptTag({content:js});
  const state=await page.locator(".tle-landing-header").evaluate(el=>({
    hidden:getComputedStyle(el).visibility,position:getComputedStyle(el).position,
    linkCount:el.querySelectorAll('a').length,top:el.getBoundingClientRect().top,
    documentOverflow:document.documentElement.scrollWidth>innerWidth+2
  }));
  assert.equal(state.hidden,"hidden","Do not show another bar above the login on initial load");
  assert.equal(state.position,"fixed");
  assert.equal(state.linkCount,0,"Duplicate Sign in CTA");
  assert.equal(state.documentOverflow,false);
  assert.ok(await page.locator("#signin").isVisible(),"Original sign-in button missing");
  await page.evaluate(()=>scrollTo(0,48));
  await page.waitForFunction(()=>document.querySelector(".tle-landing-header").classList.contains("is-floating"));
  await page.waitForTimeout(650);
  const floating=await page.locator(".tle-landing-header").evaluate(el=>({
    visibility:getComputedStyle(el).visibility,
    opacity:getComputedStyle(el).opacity,
    clip:getComputedStyle(el.querySelector(".tle-header-surface")).clipPath,
    rect:el.getBoundingClientRect().toJSON(),
    overflow:document.documentElement.scrollWidth>innerWidth+2
  }));
  assert.equal(floating.visibility,"visible","Floating pill did not appear");
  assert.equal(floating.opacity,"1");
  assert.match(floating.clip,/round 999px/);
  assert.ok(floating.rect.x>=0&&floating.rect.right<=width+1,"Pill out of viewport at "+width+"px");
  assert.equal(floating.overflow,false);
  await page.evaluate(()=>scrollTo(0,0));
  await page.waitForFunction(()=>!document.querySelector(".tle-landing-header").classList.contains("is-floating"));
  await page.waitForTimeout(650);
  assert.equal(await page.locator(".tle-landing-header").evaluate(el=>getComputedStyle(el).visibility),"hidden","Pill must disappear at top");
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:375,height:850},reducedMotion:"reduce"});
 await page.setContent('<!doctype html><html><head><style>'+css+'</style></head><body>'+markup+'<main style="height:2100px"></main></body></html>');
 await page.addScriptTag({content:js});
 await page.evaluate(()=>scrollTo(0,60));
 await page.waitForFunction(()=>document.querySelector(".tle-landing-header").classList.contains("is-floating"));
 assert.equal(await page.locator(".tle-landing-header").evaluate(el=>getComputedStyle(el).transitionDuration),"0s");
 await page.close();
 console.log("PASS: top uncluttered; small floating brand appears after 16px; no duplicate CTA; four viewports; reduced motion");
} finally {await browser.close()}
