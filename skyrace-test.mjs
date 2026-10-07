// ===== THE SKY RACE (build 580; parts/staging/99s-skyrace.js, 99r-paramotor.js flySolid). Matt: "a skill race, 9 floating rings some high some down lower, the blue one is next once thru it a new
// blue one to head for, its a race in the sky on your paramotor". Checked: nine rings, high and low, none in a wall or the ground; ring 1 blue; through them in order the next turns blue (an
// out-of-order ring does not count), the clock starts at ring 1; ring 9 is a finish (time, best kept, a Legendary Sludge once a run); landing mid-race calls it off; in a wave the course is hidden.
// And the paramotor (build 580) flies over the moat -- water stops a hero on foot, never one in the air.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8876,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const p=await (await browser.newContext({viewport:{width:1200,height:800}})).newPage(); p.on("pageerror",e=>errors.push(String(e)));
await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.removeItem('dd_skyrace_best'); localStorage.removeItem('dd_sludge_in'); }catch(e){} });
await p.goto("http://127.0.0.1:8876/?silent&nogate&map=4",{timeout:120000}); await p.waitForFunction(()=>window.__dd&&window.__skyrace&&window.__skyrace.track,null,{timeout:120000});
await p.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); window.__freeze=true; d.S.phase='build'; d.step(1/60,2); });
const A=await p.evaluate(()=>{ const S=window.__skyrace, i=S.info(); return { n:S.count, clear:S.clear(), ys:i.rings.map(r=>r.y), st:i.rings.map(r=>r.st), vis:i.rings.every(r=>r.vis) }; });
check("nine rings, some high some low, none in a wall or the ground, all showing in the build phase",A.n===9&&A.clear.every(h=>h===0)&&Math.min(...A.ys)<=8&&Math.max(...A.ys)>=28&&A.vis,JSON.stringify(A));
check("ring 1 is the blue one, the rest wait",A.st[0]==='next'&&A.st.slice(1).every(s=>s==='todo'),JSON.stringify(A.st));
// through a ring: from a step before its face to a step after
const thru=i=>p.evaluate(i=>{ const S=window.__skyrace, r=S.ring(i); S.track(r.x-r.nx*3,r.y-r.ny*3,r.z-r.nz*3); S.track(r.x+r.nx*3,r.y+r.ny*3,r.z+r.nz*3); window.__dd.step(1/60,20); return S.info(); },i);
const skip=await thru(2); check("flying through a ring out of order does not count",skip.next===0&&!skip.on,JSON.stringify({next:skip.next,on:skip.on}));
const r1=await thru(0); await p.evaluate(()=>{ const d=window.__dd; for(let i=0;i<60;i++) d.step(1/60,1); });
const r1b=await p.evaluate(()=>window.__skyrace.info());
check("through ring 1: the clock starts and ring 2 turns blue (ring 1 goes green)",r1.next===1&&r1.on&&r1.rings[0].st==='done'&&r1.rings[1].st==='next',JSON.stringify({next:r1.next,on:r1.on,st:r1.rings.map(r=>r.st)}));
let last=null; for(let i=1;i<9;i++) last=await thru(i);
const sl=await p.evaluate(()=>JSON.parse(localStorage.getItem('dd_sludge_in')||'{}'));
check("all nine in order: a finish -- a time, a new best, and a Legendary Sludge",last.finishes===1&&last.last&&last.last.nb&&last.best>0&&last.rewarded&&sl.legendary===1,JSON.stringify({fin:last.finishes,last:last.last,best:last.best,sl}));
const card=await p.evaluate(()=>{ const f=document.getElementById('skyfin'); return { shown:f&&f.style.display==='block', text:f?f.textContent:'' }; });
check("the finish card: SKY RACE, the time, NEW BEST",card.shown&&/SKY RACE/.test(card.text)&&/NEW BEST/.test(card.text),JSON.stringify(card));
// a second finish the same run: no second sludge
await p.evaluate(()=>window.__skyrace.reset()); for(let i=0;i<9;i++) last=await thru(i);
const sl2=await p.evaluate(()=>JSON.parse(localStorage.getItem('dd_sludge_in')||'{}'));
check("the sludge is once a run",last.finishes===2&&sl2.legendary===1,JSON.stringify({fin:last.finishes,sl2}));
// landing mid-race calls it off
const L=await p.evaluate(async()=>{ const d=window.__dd, P=window.__para, S=window.__skyrace; S.reset(); const pe=P.perch(); d.hero.x=pe.x; d.hero.z=pe.z; d.hero.y=pe.y; d.step(1/60,3); P.launch(); const r0=S.ring(0), r1=S.ring(1);
  S.track(r0.x-r0.nx*3,r0.y,r0.z-r0.nz*3); S.track(r0.x+r0.nx*3,r0.y,r0.z+r0.nz*3); S.track(r1.x-r1.nx*3,r1.y-r1.ny*3,r1.z-r1.nz*3); S.track(r1.x+r1.nx*3,r1.y+r1.ny*3,r1.z+r1.nz*3); const mid=S.info().next;
  P.land(); for(let i=0;i<60*30&&P.info().on;i++) d.step(1/60,1); return { mid, after:S.info() }; });
check("landing mid-race calls it off: ring 1 is blue again",L.mid===2&&L.after.next===0&&L.after.dnfs===1,JSON.stringify({mid:L.mid,next:L.after.next,dnfs:L.after.dnfs}));
const W=await p.evaluate(()=>{ const d=window.__dd; d.S.phase='wave'; for(let i=0;i<4;i++) d.spawn('goblin','S'); d.step(1/60,3); const v=window.__skyrace.info().rings.some(r=>r.vis); d.enemies.length=0; d.S.phase='build'; d.step(1/60,3); return { inWave:v, back:window.__skyrace.info().rings.every(r=>r.vis) }; });
check("in a wave the course is hidden; back in the build phase it returns",!W.inWave&&W.back,JSON.stringify(W));
const M=await p.evaluate(()=>{ const P=window.__para, S=window.__skyrace, r=S.ring(4); return { flyOk:!P.flySolid(r.x,r.z,3), footBlocked:P.solid(r.x,r.z,3) }; });
check("the paramotor flies over the moat (on foot the water still stops you)",M.flyOk&&M.footBlocked,JSON.stringify(M));
const CI=await p.evaluate(()=>{ const d=window.__dd, C=window.CINE, real=C.active; d.step(1/60,3); const before=window.__skyrace.info().rings.some(r=>r.vis); C.active=()=>'castle'; d.step(1/60,3); const during=window.__skyrace.info().rings.some(r=>r.vis); C.active=real; d.step(1/60,3); const after=window.__skyrace.info().rings.some(r=>r.vis); return { before, during, after }; });
check("build 585: a cinematic (the castle scene) never shows the rings; they come back after",CI.before&&!CI.during&&CI.after,JSON.stringify(CI));
const CR=await p.evaluate(async()=>{ const d=window.__dd; window.__freeze=true; if(!window.CINE.play('castle',{replay:true})) return { played:false };
  for(let i=0;i<4000;i++){ d.step(1/30,1); const c=window.__cine.info(); if(c.active&&!c.wait) break; if(i%30===0) await new Promise(r=>setTimeout(r,100)); }
  for(let i=0;i<30;i++) d.step(1/30,1); const during=window.__skyrace.info().rings.some(r=>r.vis), active=window.__cine.info().active;
  for(let i=0;i<1400&&window.__cine.info().active;i++) d.step(1/30,1); window.__freeze=false; d.step(1/60,3); return { played:true, active, during, after:window.__skyrace.info().rings.some(r=>r.vis) }; });
check("build 585: the real castle scene plays with no rings in it; they are back once it ends",CR.played&&CR.active==='castle'&&!CR.during&&CR.after,JSON.stringify(CR));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
