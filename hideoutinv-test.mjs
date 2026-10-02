// ===== THE BAG IS THE HIDEOUT'S INVENTORY (game build 446 + hideout build 86). Matt: "i want to get rid of the I screen all together" / "if my hot bar is sticky i should be able to drag or shift click from my bag to the
// hot bar" / "we shouldn't need a whole inventory screen to mimic what the bag does already".
// Checked: in the hideout the bag shows the room's hotbar (9) and furniture pinned under it; shift-click a bag piece -> it is on the hotbar (out of the bag); shift-click the hotbar square -> back in the bag; dragging a
// piece onto a hotbar square holds it there; closing the bag leaves it in your hands (the room's selected slot holds that gear); the strips are gone from the bag in the hall; the controls line says B or I; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8985,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1600,height:900}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8985/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__hideout&&window.__hideoutbag&&window.__tavern,null,{timeout:120000});
const ids=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); const out=[]; for(const sl of ['weapon','armor','charm']){ const it=d.rollItem(2,sl,5); M.giveItem(it); out.push(it.id); } window.__hideout.open(); return out; });
let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof openHallBag==='function'&&window.__onebag&&window.__onebag.inv,null,{timeout:120000});
const help=await f.evaluate(()=>document.getElementById('start').textContent);
await f.evaluate(()=>{ document.getElementById('start').style.display='none'; openHallBag(); }); await page.waitForFunction(()=>window.__hideoutbag.fromHideout(),null,{timeout:5000}); await sleep(300);
const a=await page.evaluate(()=>({ hands:document.querySelectorAll('#tv-hands .hs[data-hk="hot"]').length, h:window.__hideoutbag.hands() }));
check("in the hideout the bag has the room's hotbar (9 squares) pinned under it; the controls line says B or I",a.hands===9&&/B or I: bag/.test(help),JSON.stringify({a,help:/B or I/.test(help)}));
await page.click('#tv-bag .tv-tile[data-id="'+ids[0]+'"]',{modifiers:['Shift']}); await sleep(300);
const b=await page.evaluate(id=>({ inBag:window.__meta.bag().some(x=>x.id===id), h:window.__hideoutbag.hands() }),ids[0]);
check("shift-click a piece in the bag: it goes onto the hotbar (out of the bag)",!b.inBag&&b.h.hot.includes('g:'+ids[0]),JSON.stringify(b));
const slot=b.h.hot.indexOf('g:'+ids[0]); await page.click('#tv-hands .hs[data-hk="hot"][data-hi="'+slot+'"]',{modifiers:['Shift']}); await sleep(300);
const c=await page.evaluate(id=>({ inBag:window.__meta.bag().some(x=>x.id===id), h:window.__hideoutbag.hands() }),ids[0]);
check("shift-click it on the hotbar: back in the bag",c.inBag&&!c.h.hot.includes('g:'+ids[0]),JSON.stringify(c));
await page.dragAndDrop('#tv-bag .tv-tile[data-id="'+ids[1]+'"]','#tv-hands .hs[data-hk="hot"][data-hi="4"]'); await sleep(300);
const d=await page.evaluate(id=>({ inBag:window.__meta.bag().some(x=>x.id===id), h:window.__hideoutbag.hands() }),ids[1]);
check("drag a piece onto hotbar square 5: it is there",!d.inBag&&d.h.hot[4]==='g:'+ids[1],JSON.stringify(d));
await page.evaluate(()=>window.__tavern.close()); await sleep(400);
const e=await f.evaluate(()=>({ sel:window.__onebag.inv.selected(), holding:window.__onebag.holding() })); const gone=await page.evaluate(()=>!document.getElementById('tv-hands'));
check("closing the bag leaves it in your hands (that hotbar square picked, its gear held), and the strips go with the bag",e.sel===4&&!!e.holding.dropId&&gone,JSON.stringify({e,gone}));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
