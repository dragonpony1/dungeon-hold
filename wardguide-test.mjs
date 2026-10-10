// ===== THE WARDROBE WALK-THROUGH (build 620, 99ze-wardguide.js). Matt: "first time to hide out, open wall locker go dim with finder on the gear to take it" / "then immeadiatly click on all the
// forest gear to equip" / "then the finger showing full pips then x out of wardrobe then tab show and full gear set." / "the next time I come back to the bag, teach how selecting an equipment slot then shows
// best gear below". Checked by playing it: TAKE -> EQUIP (tile, then its Equip) for every Forest piece -> n/5 on the pips -> the close X -> the TAB key -> the sheet's Forest row; the next bag visit CLICK a slot -> BEST.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const SHOTS=process.env.SHOTS; const server=await serve(8932,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("dd_trainer","done"); localStorage.setItem("dd_bag_guide","1"); }catch(e){} });
await page.goto("http://127.0.0.1:8932/?silent&wardguide&nogate&map=0",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__forest&&window.__hideout&&window.__wardguide,null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd, F=window.__forest, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3);
  const mk=(slot,eq)=>{ const it=d.rollItem(1,slot,3); it.rarity=1; F.make(it); M.onPickup(it); if(eq) M.equip(it.id); }; mk('weapon',1); mk('armor',1); mk('charm',0); mk('amulet',0);
  d.S.phase='build'; for(let i=0;i<40;i++) d.step(1/60,1); window.__lesson&&window.__lesson.close&&window.__lesson.close(); });
await page.evaluate(async()=>{ window.__hideout.open(); window.__dd.step(1/60,2); for(let i=0;i<80&&!window.__hideout.frameWin();i++) await new Promise(r=>setTimeout(r,100)); });
await sleep(5000);
const ring=()=>page.evaluate(()=>{ const r=document.getElementById('wgRing'), h=document.getElementById('wgHand'); const b=r.getBoundingClientRect(); return { on:r.style.display==='block', word:h.querySelector('b').textContent, step:window.__wardguide.step(), slot:window.__wardguide.slotStep(), key:document.getElementById('wgKey').style.display }; });
const hit=sel=>page.evaluate(s=>{ const r=document.getElementById('wgRing').getBoundingClientRect(), e=document.querySelector(s); if(!e) return false; const b=e.getBoundingClientRect(); return Math.abs((b.x+b.width/2)-(r.x+r.width/2))<4&&Math.abs((b.y+b.height/2)-(r.y+r.height/2))<4; },sel);
const mid=()=>page.evaluate(()=>{ const r=document.getElementById('wgRing').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; });
await page.evaluate(()=>window.__hideout.frameWin().eval('openLocker()')); await sleep(900);
const A=await ring(); const aHit=await hit('#tv-ward .tv-wr'); if(SHOTS) await page.screenshot({path:SHOTS+"/wg1-take.png"});
check("the first wardrobe visit goes dim, the finger on the Forest piece waiting there: TAKE",A.on&&A.word==='TAKE'&&A.step===1&&aHit,JSON.stringify(A));
await page.click('#tv-ward .tv-wr'); await sleep(700);
const B=await ring(); const bInfo=await page.evaluate(()=>{ const r=document.getElementById('wgRing').getBoundingClientRect(); const t=[...document.querySelectorAll('#tv-bag .tv-tile')].find(t=>{ const b=t.getBoundingClientRect(); return Math.abs(b.x+b.width/2-(r.x+r.width/2))<4&&Math.abs(b.y+b.height/2-(r.y+r.height/2))<4; }); const it=t&&window.__meta.bag().find(b=>b.id===t.dataset.id); return { forest:!!(it&&window.__forest.isForest(it)) }; });
if(SHOTS) await page.screenshot({path:SHOTS+"/wg2-equip-tile.png"});
check("taken: the finger moves to a Forest piece in the bag: EQUIP",B.on&&B.word==='EQUIP'&&B.step===2&&bInfo.forest,JSON.stringify({B,bInfo}));
let rounds=0, sawBtn=false; for(;rounds<10;rounds++){ const s=await ring(); if(s.step!==2) break; const onBtn=await hit('#tv-detail [data-act="equip"]');
  if(onBtn){ if(SHOTS&&!sawBtn) await page.screenshot({path:SHOTS+"/wg3-equip-btn.png"}); sawBtn=true; await page.click('#tv-detail [data-act="equip"]'); }
  else { const m=await mid(); await page.mouse.click(m.x,m.y); }
  await sleep(600); }
const C=await ring(); const n=await page.evaluate(()=>window.__meta.sets.counts()['of the Forest']|0); const cHit=await hit('#tv-detail .tvp-set'); if(SHOTS) await page.screenshot({path:SHOTS+"/wg4-pips.png"});
check("each Forest piece: the tile, then its Equip button -- after that the finger is on the lit pips: "+n+"/5",sawBtn&&C.step===3&&cHit&&C.word===n+'/5'&&n>=4,JSON.stringify({C,n,rounds}));
await sleep(4800); const D=await ring(); const dHit=await hit('#tv-close'); if(SHOTS) await page.screenshot({path:SHOTS+"/wg5-close.png"});
check("then the finger on the close X",D.step===4&&D.word==='✕'&&dHit,JSON.stringify(D));
await page.click('#tv-close'); await sleep(700);
const E=await ring(); if(SHOTS) await page.screenshot({path:SHOTS+"/wg6-tab.png"});
check("wardrobe closed, back in the room: the big TAB key",E.step===5&&E.key==='flex'&&!E.on,JSON.stringify(E));
await page.evaluate(()=>window.__hideoutbag.openSheet()); await sleep(900);
const F=await ring(); if(SHOTS) await page.screenshot({path:SHOTS+"/wg7-sheet.png"});
check("Tab: the character sheet, the finger on the full Forest row",F.step===6&&F.on&&/\/5$/.test(F.word),JSON.stringify(F));
await sleep(6500); const G=await ring(); const gInfo=await page.evaluate(()=>window.__wardguide.info());
check("then it lets go, done for good",G.step===0&&!G.on&&gInfo.ward===2,JSON.stringify({G,gInfo}));
await page.evaluate(()=>{ window.__doll.close(); const d=window.__dd, M=window.__meta; const it=d.rollItem(3,'charm',9); it.rarity=4; M.onPickup(it); const c=M.bag().filter(b=>b.slot==='charm'); window.__ups=c.length; M.unequip('charm'); }); await sleep(800);
await page.evaluate(()=>window.__hideoutbag.open()); await sleep(1000);
const H=await ring(); const hSlot=await page.evaluate(()=>{ const r=document.getElementById('wgRing').getBoundingClientRect(); const c=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2); const k=c&&c.closest('.bs-eq'); return k&&k.dataset.slot; }); if(SHOTS) await page.screenshot({path:SHOTS+"/wg8-click-slot.png"});
check("the next bag visit: the finger on a worn slot with a green arrow: CLICK",H.slot===1&&H.on&&H.word==='CLICK'&&hSlot==='charm',JSON.stringify({H,hSlot}));
await page.click('#tv-bag .tv-card.bs-eq[data-slot="charm"]'); await sleep(700);
const I=await ring(); const iInfo=await page.evaluate(()=>{ const t=[...document.querySelectorAll('#tv-bag .tv-tile.best')].find(t=>{ const it=window.__meta.bag().find(b=>b.id===t.dataset.id); return it&&it.slot==='charm'; }); return { pulse:!!(t&&t.classList.contains('wgPulse')) }; });
if(SHOTS) await page.screenshot({path:SHOTS+"/wg9-best.png"});
check("clicked: the bag shows that slot's gold BEST piece (pulsing), the finger on it",I.slot===2&&I.word==='★ BEST'&&iInfo.pulse,JSON.stringify({I,iInfo}));
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
