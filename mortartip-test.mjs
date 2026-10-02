// ===== THE MORTAR TIP IS BACK (build 438; parts/staging/95n-mortarwake.js). Matt: "we need the tool tip back that tells you to hit the back wall to get your mortar out".
// Checked: woken, with no defense lost there is no card; the third defense lost (the first glow) brings the picture card and a gold arrow for each room; Enter takes them away and they do not come back that run;
// in a fresh wake, breaking a wall takes them away; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8996,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:900,height:560}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8996/?silent&nogate&map=5&noshow",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__prisonwalls&&window.__mortarwake&&window.__dd.map().id==='prison',null,{timeout:120000});
await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,5); });
for(let i=0;i<300;i++){ const n=await page.evaluate(()=>{ window.__dd.step(1/60,1); return window.__prisonwalls.walls().length; }); if(n===2) break; await new Promise(r=>setTimeout(r,100)); }
const A=await page.evaluate(()=>{ const d=window.__dd, W=window.__mortarwake; d.S.phase='build'; W.wake(); d.step(1/60,10); const t0=W.tip(); W.lose(2); d.step(1/60,10); const t2=W.tip(); W.lose(1); d.step(1/60,10); const t3=W.tip();
  const card=document.getElementById('mortarcard'); return { t0, t2, t3, card:!!card&&card.style.display==='flex', img:card?card.querySelector('img').getAttribute('src'):null, glow:W.glow() }; });
check("no card while no defense has been lost, nor after two",!A.t0.on&&!A.t2.on,JSON.stringify({t0:A.t0,t2:A.t2}));
check("the third defense lost (the first glow): the picture card comes, with a gold arrow for each room",A.t3.on&&A.card&&/loading-hexmortar/.test(A.img||'')&&A.t3.arrowsShown===2&&A.glow>0,JSON.stringify(A));
const B=await page.evaluate(async()=>{ const d=window.__dd, W=window.__mortarwake; dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',key:'Enter'})); d.step(1/60,5); const off=W.tip(); W.lose(3); d.step(1/60,10); return { off, later:W.tip() }; });
check("Enter takes the card and arrows away, and they don't come back that run",!B.off.on&&B.off.arrows===0&&!B.later.on,JSON.stringify(B));
const C=await page.evaluate(()=>{ const d=window.__dd, W=window.__mortarwake; W.lock(); W.wake(); W.lose(3); d.step(1/60,10); const on=W.tip().on; window.__prisonwalls.raw()[0].broken=true; d.step(1/60,5); return { on, after:W.tip() }; });
check("breaking a wall takes the card away",C.on&&!C.after.on&&C.after.arrows===0,JSON.stringify(C));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
