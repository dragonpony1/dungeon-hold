// ===== THE LEVEL-UP HINT ONCE (build 403; parts/modules/10-meta.js addXP). Matt: "can you turn off the N tooltip whenever you level? just once is enough".
// Checked: the first level-up says the talent points and (N); every level after says just LEVEL n; a player who has already had the hint (the +1 TALENT card) gets LEVEL n from the start; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8993,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1100,height:700}});
await ctx.addInitScript(()=>{ try{ if(!sessionStorage.getItem('__lt')){ sessionStorage.setItem('__lt','1'); localStorage.removeItem('dd_talent_card'); } localStorage.setItem("ddMapsCleared","1"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8993/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__dd.heroModel(),null,{timeout:120000});
const lvl=()=>page.evaluate(()=>{ const M=window.__meta; M.addXP(M.xpToNext?M.xpToNext(M.level()):100000); return document.getElementById('toast').textContent; });
await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} await window.__heroes.select('knight'); d.start(); d.step(1/60,3); });
const t1=await lvl(), t2=await lvl(), t3=await lvl();
check("the first level-up names the talent points and N; the next ones just say LEVEL n",/talent point/.test(t1)&&/\(N\)/.test(t1)&&/^LEVEL \d+$/.test(t2)&&/^LEVEL \d+$/.test(t3),JSON.stringify([t1,t2,t3]));
await page.reload(); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); });
const t4=await lvl();
check("it stays once: after a reload a level-up still just says LEVEL n",/^LEVEL \d+$/.test(t4),JSON.stringify(t4));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
