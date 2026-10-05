// ===== build 553: INTO THE GARDEN (96s6-garden.js) -- the Cloister Court's opening scene. Matt: "Don't put moving topiaries in it".
//  * it starts by itself on the court's first build phase; the moon, the fireflies, the four (with set weapons)
//  * the topiary statues do NOT move: every statue model stays exactly where and how it stood
//  * skipping ends it and it is remembered as seen
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=await serve(8971,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:620}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("dd_talent_card","1"); localStorage.setItem("ddMapsCleared","9"); }catch(e){} });
await page.goto("http://127.0.0.1:8971/?silent&nogate&map=2&cineauto",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.CINE&&window.__garden&&window.__dd.map().id==='court'&&window.__courtdecor.loaded(),null,{timeout:120000});
const statues0=await page.evaluate(()=>JSON.stringify(window.__courtdecor.topi()));
await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); });
const at=async t=>{ for(let i=0;i<450;i++){ const c=await page.evaluate(()=>window.__cine.info()); if(c.active==='garden'&&!c.wait&&c.t>=t) return c; if(i>80&&!c.active) return c; await sleep(100); } return null; };
let c=await at(3.5); await page.screenshot({path:process.env.TEMP+"/gar-moon.png"}); const a=await page.evaluate(()=>window.__garden.info());
check("the first Cloister Court build phase plays INTO THE GARDEN, fireflies out",c&&c.active==='garden'&&a.flies>=400,JSON.stringify({c:c&&{active:c.active,t:c.t},a}));
c=await at(9); await page.screenshot({path:process.env.TEMP+"/gar-lane.png"});
c=await at(17); await page.screenshot({path:process.env.TEMP+"/gar-tree.png"});
c=await at(23.5); await page.screenshot({path:process.env.TEMP+"/gar-statue.png"}); const s1=await page.evaluate(()=>({ topi:JSON.stringify(window.__courtdecor.topi()), g:window.__garden.info() }));
check("the topiaries stand still (every statue exactly where and how it stood), the fireflies dim by them",s1.topi===statues0&&s1.g.flyOp<.5,JSON.stringify({same:s1.topi===statues0,flyOp:s1.g.flyOp,statue:s1.g.statue}));
c=await at(29.5); await page.screenshot({path:process.env.TEMP+"/gar-four.png"}); const f=await page.evaluate(()=>window.__garden.info());
check("the four stand on the path with their set weapons",f.heroesLive===4&&f.weapons===4,JSON.stringify(f));
await page.keyboard.press("Space"); await sleep(1800);
const after=await page.evaluate(()=>({ active:window.__cine.info().active, seen:localStorage.getItem('dd_cine_seen') }));
check("skipping ends it and it is remembered as seen",!after.active&&/garden/.test(after.seen||''),JSON.stringify(after));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
