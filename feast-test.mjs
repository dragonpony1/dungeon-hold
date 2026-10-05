// ===== build 554: DINNER IS SERVED (96s7-feast.js) -- the Great Feast Hall's opening scene.
//  * it starts by itself on the hall's first build phase; the pot steams and bubbles
//  * Sir Bullion's shadow walks along the east wall (his model, flat and black), never a real mob
//  * the four with set weapons; skipping ends it and it is remembered as seen
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=await serve(8972,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:620}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("dd_talent_card","1"); localStorage.setItem("ddMapsCleared","9"); }catch(e){} });
await page.goto("http://127.0.0.1:8972/?silent&nogate&map=3&cineauto",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.CINE&&window.__feastscene&&window.__dd.map().id==='feast',null,{timeout:120000});
await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); });
const at=async t=>{ for(let i=0;i<600;i++){ const c=await page.evaluate(()=>window.__cine.info()); if(c.active==='feast'&&!c.wait&&c.t>=t) return c; if(i>120&&!c.active) return c; await sleep(100); } return null; };
let c=await at(4); await page.screenshot({path:process.env.TEMP+"/fea-pot.png"}); const a=await page.evaluate(()=>window.__feastscene.info());
check("the first Feast Hall build phase plays DINNER IS SERVED, close on the pot",c&&c.active==='feast'&&a.cut==='pot',JSON.stringify({c:c&&{active:c.active,t:c.t},a}));
c=await at(13); await page.screenshot({path:process.env.TEMP+"/fea-wreck.png"});
c=await at(21); await page.screenshot({path:process.env.TEMP+"/fea-shadow.png"}); const s=await page.evaluate(()=>{ const d=window.__dd, i=window.__feastscene.info(); return { i, inEnemies:d.enemies.filter(e=>e.kind==='bullion').length }; });
check("Sir Bullion's shadow walks along the east wall -- no real Sir Bullion in the hall",s.i.shadow===1&&s.i.shadowShown&&s.inEnemies===0&&s.i.thuds>=2,JSON.stringify(s));
c=await at(27.5); await page.screenshot({path:process.env.TEMP+"/fea-four.png"}); const f=await page.evaluate(()=>window.__feastscene.info());
check("the four stand at the Heartroot end with their set weapons",f.heroesLive===4&&f.weapons===4,JSON.stringify(f));
await page.keyboard.press("Space"); await sleep(1800);
const after=await page.evaluate(()=>({ active:window.__cine.info().active, seen:localStorage.getItem('dd_cine_seen') }));
check("skipping ends it and it is remembered as seen",!after.active&&/feast/.test(after.seen||''),JSON.stringify(after));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
