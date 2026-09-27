// ===== HIDEOUT LITE (build 150): "guest game crashed and closed the browser while in hideout". On a touch or small-memory
// device (or ?litehideout) the hideout frame is never preloaded behind the hall, it is made on the visit and torn down on
// the way out, so the hall and the hideout never sit in memory together. Desktop keeps the build-140 keep-alive.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const SP=process.env.SP||process.cwd(); const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8888; const server=await serve(PORT);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const page=await browser.newPage();
const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:"+PORT+"/?silent&nogate&litehideout",{timeout:240000}); await page.waitForFunction(()=>window.__dd&&window.__hideout&&window.__loadtime,null,{timeout:180000});
await page.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,30); });
await page.waitForFunction(()=>window.__loadtime().all!==null,null,{timeout:180000}).catch(()=>{}); await page.waitForTimeout(3500);
const pre=await page.evaluate(()=>({lite:window.__hideout.lite(),preloaded:window.__hideout.preloaded(),frame:!!document.getElementById('hideoutFrame')}));
check("lite: the hideout is not preloaded behind the hall (no frame after the loads are in)",pre.lite&&!pre.preloaded&&!pre.frame,JSON.stringify(pre));
const opened=await page.evaluate(()=>{ const d=window.__dd; d.setHero(-2.5,3.2,0); d.step(1/60,5); const ok=window.__hideout.open(); return {ok,open:window.__hideout.isOpen(),frame:!!document.getElementById('hideoutFrame')}; });
check("a visit makes the frame on the spot",opened.ok&&opened.open&&opened.frame,JSON.stringify(opened));
await page.evaluate(()=>window.__hideout.close()); await page.waitForTimeout(700);
const closed=await page.evaluate(()=>({open:window.__hideout.isOpen(),frame:!!document.getElementById('hideoutFrame'),wrap:!!document.getElementById('hideoutWrap'),loaded:window.__hideout.loaded(),preloaded:window.__hideout.preloaded()}));
check("leaving tears the frame down (no frame, no wrapper, nothing kept alive)",!closed.open&&!closed.frame&&!closed.wrap&&!closed.loaded&&!closed.preloaded,JSON.stringify(closed));
const again=await page.evaluate(()=>{ const ok=window.__hideout.open(); return {ok,frame:!!document.getElementById('hideoutFrame')}; }); await page.evaluate(()=>window.__hideout.close());
check("a second visit makes a fresh frame again",again.ok&&again.frame,JSON.stringify(again));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
