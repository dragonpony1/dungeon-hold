// ===== MATT'S OWN SLUDGE JARS (99g-sludgejars.js, build 297). Checked: nothing asks for the jar models on the loading screen; the first wave asks for all four; a code-built jar already on the floor becomes his
// model when it lands; every new jar is his, all four rarities; a jar can still be picked up.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8952,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
const asked=[]; page.on("request",r=>{ if(/jar-(common|uncommon|rare|legendary)/.test(r.url())) asked.push(r.url()); });
await page.goto("http://127.0.0.1:8952/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__jars&&window.__meta,null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} window.__meta.reset&&window.__meta.reset(); d.start(); d.step(1/60,20); });
await sleep(1500);
const a=await page.evaluate(()=>{ const J=window.__jars; J.clear(); J.spawn(0,4,6); window.__dd.step(1/60,5); return { asked:J.asked(), real:J.real(), floor:J.realOnFloor() }; });
check("nothing asks for the jar models before the first wave (the loading screen is untouched); a jar dropped now is the code-built one",asked.length===0&&!a.asked&&a.floor[0]===false,JSON.stringify({requests:asked.length,a}));
await page.evaluate(()=>{ const d=window.__dd; d.startWave(); d.step(1/60,3); });
let b=null; for(let i=0;i<300;i++){ b=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,2); const J=window.__jars; return { asked:J.asked(), real:J.real(), floor:J.realOnFloor() }; }); if(b.real.every(Boolean)&&b.floor.length&&b.floor[0]) break; await sleep(60); }
check("the first wave asks for all four of Matt's jars; they load, and the code-built jar already on the floor becomes his",asked.length===4&&b.real.every(Boolean)&&b.floor[0]===true,JSON.stringify({requests:asked.map(u=>u.split('/').pop()),b}));
const c=await page.evaluate(()=>{ const J=window.__jars; J.clear(); for(let r=0;r<4;r++){ J.spawn(r,4+r*2,10); window.__dd.step(1/60,1); } window.__dd.step(1/60,60); return { real:J.realOnFloor() }; });
check("every new jar is Matt's model (all four rarities)",c.real.length===4&&c.real.every(Boolean),JSON.stringify(c));
const p=await page.evaluate(()=>{ const d=window.__dd, J=window.__jars; J.clear(); const run0=J.run().reduce((a,x)=>a+x,0); J.spawn(3,6,6); for(let i=0;i<60;i++) d.step(1/60,1); d.setHero(6,6,0); for(let i=0;i<60;i++) d.step(1/60,1); return { left:J.list().length, run:J.run().reduce((a,x)=>a+x,0)-run0 }; });
check("a real jar is still picked up (walk over it: banked, gone from the floor)",p.left===0&&p.run===1,JSON.stringify(p));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
