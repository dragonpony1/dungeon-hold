// ===== build 560: THE GATE HOLDS (96sa-ending.js) -- the ending: the Deep Prison held plays it.
//  * holding the Deep Prison (its victory lap) plays THE GATE HOLDS; the Heartroot blazes, roots grow out across the floor
//  * roots weave across the gate and seal it; the four stand round the tavern table with mugs, which they raise
//  * skipping ends it and it is remembered as seen
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=await serve(8976,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:620}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("dd_talent_card","1"); localStorage.setItem("ddMapsCleared","9"); }catch(e){} });
await page.goto("http://127.0.0.1:8976/?silent&nogate&map=5&cineauto",{timeout:180000}); await page.waitForFunction(()=>window.__dd&&window.CINE&&window.__ending&&window.__dd.map().id==='prison',null,{timeout:180000});
await page.evaluate(()=>{ localStorage.setItem('dd_cine_seen','["lantern","torchline"]'); try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); window.__dd.step(1/60,5); window.__dd.winMap(); });
const at=async t=>{ for(let i=0;i<900;i++){ const c=await page.evaluate(()=>window.__cine.info()); if(c.active==='ending'&&!c.wait&&c.t>=t) return c; if(i>200&&!c.active) return c; await sleep(100); } return null; };
let c=await at(6); await page.screenshot({path:process.env.TEMP+"/end-blaze.png"}); const a=await page.evaluate(()=>window.__ending.info());
check("holding the Deep Prison plays THE GATE HOLDS: the Heartroot blazes",c&&c.active==='ending'&&a.blaze>.5,JSON.stringify({c:c&&{active:c.active,t:c.t},a}));
c=await at(12.5); await page.screenshot({path:process.env.TEMP+"/end-roots.png"}); const b=await page.evaluate(()=>window.__ending.info());
check("roots grow out across the floor from the Heartroot",b.grown>=10,JSON.stringify({grown:b.grown}));
c=await at(17.8); await page.screenshot({path:process.env.TEMP+"/end-gate.png"}); const g=await page.evaluate(()=>window.__ending.info());
check("roots weave across the gate and seal it",g.sealed>=8,JSON.stringify({sealed:g.sealed,gate:g.gate}));
c=await at(24.2); await page.screenshot({path:process.env.TEMP+"/end-toast.png"}); const tv=await page.evaluate(()=>window.__ending.info());
check("the four stand round the tavern table, mugs raised",tv.heroesLive===4&&tv.mugs===4,JSON.stringify(tv));
c=await at(32); await page.screenshot({path:process.env.TEMP+"/end-title.png"});
await page.keyboard.press("Space"); await sleep(1800);
const after=await page.evaluate(()=>({ active:window.__cine.info().active, seen:localStorage.getItem('dd_cine_seen') }));
check("skipping ends it and it is remembered as seen",!after.active&&/ending/.test(after.seen||''),JSON.stringify(after));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
