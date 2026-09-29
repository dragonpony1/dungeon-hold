// ===== THE TESTING STOCKPILE IS TAKEN OUT (hideout build 55). Matt: "we need to take my rare sludge out". Every save began with 99,999 Rare Sludge (and 20 Legendary) that nobody earned. A save that still holds exactly that loses
// it, once; a save that has earned or spent anything is left alone; it does not happen twice; and a brand-new save starts with nothing.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8903);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
async function run(seed){ const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(s=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","1"); if(s&&!sessionStorage.getItem("seeded")){ sessionStorage.setItem("seeded","1"); localStorage.setItem("dd_hideout_save_v2",JSON.stringify(s)); } }catch(e){} },seed);
  const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e))); await page.goto("http://127.0.0.1:8903/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__hideout,null,{timeout:120000});
  await page.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,10); window.__dd.setHero(30,30); window.__hideout.open(); }); let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
  await f.waitForFunction(()=>typeof SAVE!=="undefined"&&typeof openForge==="function",null,{timeout:120000});
  const a=await f.evaluate(()=>({ s:[SAVE.sludge,SAVE.legendarySludge,SAVE.commonSludge,SAVE.uncommonSludge], flag:SAVE.stockpileCleared, hud:document.getElementById("sludge").textContent, stored:(()=>{ const o=JSON.parse(localStorage.getItem("dd_hideout_save_v2"))||{}; return [o.sludge,o.legendarySludge,o.stockpileCleared||0]; })() }));
  return { ctx, page, f, a }; }
// a save still holding the untouched stockpile
{ const r=await run({sludge:99999,legendarySludge:20,commonSludge:0,uncommonSludge:0});
  check("a save holding the untouched testing stockpile (99,999 Rare, 20 Legendary) loses it: everything is 0, the HUD says 0, the save is marked",r.a.s.join()==="0,0,0,0"&&r.a.hud==="0"&&r.a.flag===1&&r.a.stored.join()==="0,0,1",JSON.stringify(r.a));
  await r.f.evaluate(()=>{ SAVE.sludge=7; writeSave(); });   // earned something, then the page is loaded afresh (the migration runs again on a fresh load: it must not clear this)
  await r.page.reload({timeout:120000}); await r.page.waitForFunction(()=>window.__dd&&window.__hideout,null,{timeout:120000}); await r.page.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,10); window.__dd.setHero(30,30); window.__hideout.open(); }); let f2=null; for(let i=0;i<600&&!f2;i++){ f2=r.page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f2) await sleep(50); }
  await f2.waitForFunction(()=>typeof SAVE!=="undefined",null,{timeout:120000}); const again=await f2.evaluate(()=>SAVE.sludge);
  check("it happens once: what is earned afterwards is kept the next time",again===7,String(again)); await r.ctx.close(); }
// a save that has earned and spent: left alone
{ const r=await run({sludge:500,legendarySludge:20,commonSludge:3,uncommonSludge:4});
  check("a save that is not the untouched stockpile (500 Rare, 3 Common...) is left exactly as it is",r.a.s.join()==="500,20,3,4"&&r.a.flag===1,JSON.stringify(r.a)); await r.ctx.close(); }
// a brand-new save
{ const r=await run(null);
  check("a brand-new save starts with no sludge at all",r.a.s.join()==="0,0,0,0"&&r.a.hud==="0",JSON.stringify(r.a)); await r.ctx.close(); }
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
