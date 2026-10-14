import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const css=readFileSync('.site/assets/jessy-owner.css','utf8');
const browser=await chromium.launch({headless:true});
try{
 for(const width of [360,390,820,1024,1440])for(const message of ['Jessy: 2 unread alerts · View →','Jessy: 2 avisos sin leer · Ver →']){
  const page=await browser.newPage({viewport:{width,height:850}});
  await page.setContent('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body class="crm-owner-view"><aside style="width:65vw;height:100vh">Synthetic sidebar</aside><div id="tleOwnerJessy" class="jo-root"><button class="jo-fab"><img class="jo-face"></button><button class="jo-notification-nudge">'+message+'</button></div></body></html>');
  const rect=await page.locator('.jo-notification-nudge').boundingBox();
  assert(rect.width<=250.1&&rect.height<=60&&rect.height>=44,'Notice too large/small at '+width);
  assert(rect.x>=0&&rect.x+rect.width<=width,'Notice outside viewport');
  const fab=await page.locator('.jo-fab').boundingBox();
  assert(rect.y+rect.height<=fab.y,'Notice overlaps avatar at '+width);
  await page.close();
 }
 console.log('PASS compact notice at phone/tablet/desktop widths in EN/ES. Synthetic data only.');
}finally{await browser.close();}
