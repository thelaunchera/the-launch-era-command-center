import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const js=readFileSync('.site/assets/booking-calendar-motion.js','utf8');
const css=readFileSync('.site/assets/booking-calendar-motion.css','utf8');
const fixture='<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body>'+
'<button id="buyerCalendarPrev">Previous month</button><button id="buyerCalendarToday">Today</button><button id="buyerCalendarNext">Next month</button>'+
'<button id="ownerCalPrev">Previous month</button><button id="ownerCalToday">Today</button><button id="ownerCalNext">Next month</button>'+
'<button id="buyerBookingPreviewNav">Preview</button>'+
'<section id="ownerCalendarHub"><div class="panel"><div id="ownerCalGrid" data-month-key="2026-10"><button data-day-key="2026-10-16" aria-pressed="true"><strong>16</strong><div data-calendar-kind="plan_qa">Final QA</div></button></div><div id="ownerCalDayPanel"></div></div></section>'+
'<section id="buyerAppointmentsHub"><div class="panel"><div class="buyer-calendar-toolbar">Native actions</div><div class="buyer-calendar-scroll"><div id="buyerCalendarGrid" data-month-key="2026-10"><div data-day-key="2026-10-16" class="buyer-cal-cell selected"><button class="buyer-cal-day-button">16</button><button class="buyer-cal-event booked">10:00 AM · Sample booking</button><button class="buyer-cal-event pending">1:00 PM · Sample pending</button></div></div></div></div><div id="buyerCalendarDayList"></div></section>'+
'<script>window.testState={};document.querySelector(".buyer-cal-event.booked").addEventListener("click",()=>window.testState.opened=true);document.querySelector("#buyerBookingPreviewNav").addEventListener("click",()=>window.testState.preview=true);document.querySelector("#ownerCalGrid button").addEventListener("click",()=>window.testState.ownerDay=true);</script></body></html>';
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,820,1440]){
  const page=await browser.newPage({viewport:{width,height:800}});
  await page.setContent(fixture);
  await page.addScriptTag({content:js});
  await page.locator('#buyerAppointmentsHub .ml-motion-event.confirmed').waitFor();
  assert.equal(await page.locator('#buyerAppointmentsHub .ml-motion-event').count(),2);
  assert.equal(await page.locator('#ownerCalendarHub .ml-motion-event.planned').count(),1);
  assert.equal(await page.locator('#buyerAppointmentsHub .ml-motion-side-metric').textContent(),'2');
  await page.locator('#buyerAppointmentsHub .ml-motion-event.confirmed').click();
  assert.equal(await page.evaluate(()=>window.testState.opened),true,'Must open native booking');
  await page.locator('#ownerCalendarHub .ml-motion-event.planned').click();
  assert.equal(await page.evaluate(()=>window.testState.ownerDay),true,'Must open native owner day');
  await page.locator('#buyerAppointmentsHub .ml-motion-booking').click();
  assert.equal(await page.evaluate(()=>window.testState.preview),true,'Must use native booking preview');
  assert.equal(await page.locator('#buyerAppointmentsHub .buyer-calendar-scroll').evaluate(el=>getComputedStyle(el).display),'none');
  await page.locator('#buyerAppointmentsHub .ml-motion-controls button').filter({hasText:'Month'}).click();
  assert.notEqual(await page.locator('#buyerAppointmentsHub .buyer-calendar-scroll').evaluate(el=>getComputedStyle(el).display),'none');
  await page.locator('#buyerAppointmentsHub .ml-motion-controls button').filter({hasText:'Week'}).click();
  assert.equal(await page.locator('#buyerAppointmentsHub .ml-motion-event').count(),2);
  await page.close();
 }
 console.log('PASS: owner/buyer synthetic calendar interaction at 390, 820, 1440px; no real data');
}finally{await browser.close()}