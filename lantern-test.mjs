// ===== build 556: THE LAST LANTERN (96s9-lantern.js) -- the Deep Prison's first scene; THE TORCH LINE follows straight on.
//  * the first prison build phase plays THE LAST LANTERN (not the torch line); the Knight holds the lantern, torches burn round the pit
//  * "...hold..."; the Corruptor rises (a stand-in, never a real mob); at the snick every torch goes out, the lantern holds
//  * "Fate can be cut. The gate must hold."; when it ends THE TORCH LINE starts by itself
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=await serve(8974,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:620}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("dd_talent_card","1"); localStorage.setItem("ddMapsCleared","9"); }catch(e){} });
await page.goto("http://127.0.0.1:8974/?silent&nogate&map=5&cineauto",{timeout:180000}); await page.waitForFunction(()=>window.__dd&&window.CINE&&window.__lantern&&window.__dd.map().id==='prison',null,{timeout:180000});
await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); });
const at=async t=>{ for(let i=0;i<900;i++){ const c=await page.evaluate(()=>window.__cine.info()); if(c.active==='lantern'&&!c.wait&&c.t>=t) return c; if(i>200&&!c.active) return c; await sleep(100); } return null; };
let c=await at(7); await page.screenshot({path:process.env.TEMP+"/lan-lantern.png"}); const a=await page.evaluate(()=>window.__lantern.info());
check("the first Deep Prison build phase plays THE LAST LANTERN first: the Knight with the lantern, torches burning",c&&c.active==='lantern'&&a.knightLive&&a.torches>=6&&a.litTorches>=6,JSON.stringify({c:c&&{active:c.active,t:c.t},a}));
c=await at(12.3); await page.screenshot({path:process.env.TEMP+"/lan-wall.png"}); const w=await page.evaluate(()=>window.__lantern.info());
check("'...hold...' is whispered",/hold/.test(w.words)&&w.wordsOp>.5,JSON.stringify({w:w.words,op:w.wordsOp}));
c=await at(15.5); await page.screenshot({path:process.env.TEMP+"/lan-below.png"});
c=await at(21.5); await page.screenshot({path:process.env.TEMP+"/lan-corr.png"}); const k=await page.evaluate(()=>({ i:window.__lantern.info(), real:window.__dd.enemies.filter(e=>e.kind==='corruptor').length }));
check("the Corruptor rises across the pit -- a stand-in, no real Corruptor",k.i.corrShown&&k.real===0,JSON.stringify(k));
c=await at(23.6); const o=await page.evaluate(()=>window.__lantern.info());
check("at the snick every torch goes out; the lantern holds",o.litTorches===0&&o.knightLive,JSON.stringify(o));
c=await at(27.6); await page.screenshot({path:process.env.TEMP+"/lan-holds.png"}); const h=await page.evaluate(()=>window.__lantern.info());
check("'Fate can be cut. The gate must hold.'",/Fate can be cut/.test(h.words)&&h.wordsOp>.5,JSON.stringify({w:h.words,op:h.wordsOp}));
let next=null; for(let i=0;i<120;i++){ next=await page.evaluate(()=>({ active:window.__cine.info().active, seen:localStorage.getItem('dd_cine_seen') })); if(next.active==='torchline') break; await sleep(100); }
check("when it ends, THE TORCH LINE follows straight on",next.active==='torchline'&&/lantern/.test(next.seen||''),JSON.stringify(next));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
