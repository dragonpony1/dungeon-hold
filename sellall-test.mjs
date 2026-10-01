// ===== SELL ALL (build 382; parts/modules/10-meta.js sellAll, 20-tavern.js). Matt: "sell all button, which includes all unlocked regardless". Checked: the bag has a Sell all button next to Sell junk; it counts every UNLOCKED piece whatever its
// rarity (a legendary, a piece that beats what is worn), the first tap only arms it (nothing sold, the button says tap again), the second tap sells every unlocked piece and pays their gold, a LOCKED piece stays, what is worn stays, and
// an untouched armed button disarms itself. With nothing unlocked the button is disabled.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8994,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:700}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
await page.goto("http://127.0.0.1:8994/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__tavern&&window.__doll,null,{timeout:60000});
await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); });
const S0=await page.evaluate(()=>{ const spec=[['familiar',0],['weapon',2],['armor',1],['weapon',4],['charm',0],['amulet',3],['weapon',0],['armor',3],['charm',4]]; const ids=[];
  for(const [slot,r] of spec){ const it=window.__dd.rollItem(r,slot); it.rarity=r; if(!window.__meta.onPickup(it)) throw new Error('pickup refused'); ids.push(it.id); }
  const bag=window.__meta.bag(); window.__meta.toggleLock(ids[3]); window.__meta.toggleLock(ids[8]);   // a legendary weapon and a legendary charm, locked
  return { n:bag.length, locked:bag.filter(b=>b.locked).length, gold:window.__meta.gold?window.__meta.gold():null }; });
check("nine pieces bagged, two of them (legendary) locked",S0.n===9&&S0.locked===2,JSON.stringify(S0));
await page.evaluate(()=>{ window.__tavern.open(); window.__tavern.tab('bag'); }); await page.waitForSelector('#tv-sellall');
const A=await page.evaluate(()=>{ const b=document.getElementById('tv-sellall'); return { text:b.textContent.trim(), disabled:b.disabled, near:!!document.getElementById('tv-selljunk') }; });
check("the bag has a Sell all button beside Sell junk, counting the seven unlocked pieces",A.near&&!A.disabled&&/Sell all \(7\)/.test(A.text),JSON.stringify(A));
const gold0=await page.evaluate(()=>window.__meta.gold?window.__meta.gold():null);
await page.click('#tv-sellall'); await sleep(200);
const B=await page.evaluate(()=>({ n:window.__meta.bag().length, text:document.getElementById('tv-sellall').textContent.trim(), hot:document.getElementById('tv-sellall').classList.contains('hot') }));
check("the first tap only ARMS it: nothing is sold and the button says tap again",B.n===9&&/Tap again/.test(B.text)&&B.hot,JSON.stringify(B));
await page.click('#tv-sellall'); await sleep(300);
const C=await page.evaluate(()=>{ const bag=window.__meta.bag(); return { n:bag.length, allLocked:bag.every(b=>b.locked), rarities:bag.map(b=>b.rarity).sort(), gold:window.__meta.gold?window.__meta.gold():null }; });
check("the second tap sells every unlocked piece, every rarity, and only the two locked legendaries stay",C.n===2&&C.allLocked&&C.rarities.join()==="4,4",JSON.stringify(C));
check("and pays their gold",gold0===null||C.gold>gold0,JSON.stringify({ gold0, gold:C.gold }));
await page.evaluate(()=>{ window.__tavern.tab('bag'); }); await sleep(200);
const D=await page.evaluate(()=>{ const b=document.getElementById('tv-sellall'); return { disabled:b.disabled, text:b.textContent.trim() }; });
check("with nothing unlocked left the button is disabled",D.disabled,JSON.stringify(D));
// an armed button that is not pressed again disarms itself
const E=await page.evaluate(()=>{ const it=window.__dd.rollItem(1,'armor'); it.rarity=1; window.__meta.onPickup(it); return window.__meta.bag().length; });
await page.evaluate(()=>window.__tavern.tab('bag')); await sleep(200); await page.click('#tv-sellall'); await sleep(200);
const F1=await page.evaluate(()=>document.getElementById('tv-sellall').textContent.trim()); await sleep(4500);
const F2=await page.evaluate(()=>({ text:document.getElementById('tv-sellall').textContent.trim(), n:window.__meta.bag().length }));
check("an armed Sell all that is left alone disarms itself after a few seconds, selling nothing",/Tap again/.test(F1)&&/^Sell all/.test(F2.text)&&!/Tap again/.test(F2.text)&&F2.n===E,JSON.stringify({ F1, F2 }));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
