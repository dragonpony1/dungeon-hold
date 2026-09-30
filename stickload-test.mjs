// ===== STICKMEN ALWAYS IN MATT'S MODEL (build 317). Matt: "oh dear, mabye that stikmen didnt load all the way". His moss stickmen only came down with the Archhag's model, so a stickman from the
// dev panel was the code-built twig stand-in. Checked: a dev-panel stickman waits for his model and comes out rigged; and with his stickman files held up on the wire, the Archhag holds her raise
// until they land (no twig men in the meantime), then raises ten of his.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8974,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const mk=async()=>{ const ctx=await browser.newContext({viewport:{width:1000,height:640}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} }); const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e))); return p; };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// 1. the dev panel
const p1=await mk(); await p1.goto("http://127.0.0.1:8974/?silent&nogate&map=2",{timeout:120000}); await p1.waitForFunction(()=>window.__dd&&window.__devpanel&&window.__archhag&&window.__archhag.loadSticks,null,{timeout:120000});
await p1.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); for(const e of d.enemies) d.kill(e); window.__devpanel.toggle(true); document.getElementById("dp-mob").value="stickman"; document.getElementById("dp-mob-go").click(); });
let a=null; for(let i=0;i<300;i++){ a=await p1.evaluate(()=>{ const d=window.__dd; d.step(1/60,1); d.S.crystal=d.S.crystal2=1e6; const s=d.enemies.filter(e=>e.kind==="stickman"&&!e.dead); return {n:s.length,rigged:s.filter(e=>e.mdl&&e.mdl.glb&&e.mdl.actions&&e.mdl.actions.run).length,ready:window.__archhag.sticksReady()}; }); if(a.n) break; await sleep(60); }
check("a stickman from the dev panel waits for Matt's model and comes out rigged (not the twig stand-in)",a&&a.n===1&&a.rigged===1&&a.ready,JSON.stringify(a));
// 2. the Archhag with his stickman files slow on the wire
const p2=await mk(); let release=null; const gate=new Promise(r=>release=r);
await p2.route(/stickman-/,async r=>{ await gate; r.continue(); });
await p2.goto("http://127.0.0.1:8974/?silent&nogate&map=2",{timeout:120000}); await p2.waitForFunction(()=>window.__dd&&window.__archhag&&window.__archhag.ensure&&window.__courtdecor&&window.__courtdecor.topiList,null,{timeout:120000});
await p2.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,10); window.__archhag.ensure(); });
for(let i=0;i<400;i++){ const ok=await p2.evaluate(()=>{ window.__dd.step(1/60,1); window.__dd.S.crystal=window.__dd.S.crystal2=1e6; return window.__archhag.loaded()&&window.__courtdecor.topiList().length>=12; }); if(ok) break; await sleep(80); }
const b=await p2.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,3); d.S.crystal=d.S.crystal2=1e6; const e=window.__archhag.spawn(); for(let i=0;i<60*4;i++){ d.setHero(-90,-90,0); d.step(1/60,1); d.S.crystal=d.S.crystal2=1e6; } return { ready:window.__archhag.sticksReady(), sticks:window.__archhag.sticks(), hag:!!e }; });
release(); let c=null; for(let i=0;i<300;i++){ c=await p2.evaluate(()=>{ const d=window.__dd; d.setHero(-90,-90,0); d.step(1/60,1); d.S.crystal=d.S.crystal2=1e6; const s=d.enemies.filter(e=>e.kind==="stickman"&&!e.dead); return {ready:window.__archhag.sticksReady(),n:s.length,rigged:s.filter(e=>e.mdl&&e.mdl.glb).length}; }); if(c.n>=10) break; await sleep(40); }
check("with his stickman files held up, 4 s after she rises she is still holding her raise (no twig men); once they land she raises ten of his",b.hag&&!b.ready&&b.sticks===0&&c&&c.ready&&c.n===10&&c.rigged===10,JSON.stringify({before:b,after:c}));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
