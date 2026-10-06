// ===== THE PARAMOTOR (build 575; parts/staging/99r-paramotor.js). Matt, on the Drawbridge gate: "you cant jump up on this thing ... what if you could jump up on here and para motor around the castle"
// / "yes build phase only like the mini golf". Checked: the two gate towers are solid at the walk now; a stair climbs from the walk (16) to a tower top (20) in steps a hero can take; by the paramotor
// in the build phase E's prompt shows and a launch flies, glides and lands, and the paramotor flies back to its perch; the horn mid-flight brings you down; in a wave you cannot take off.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8867,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const p=await (await browser.newContext({viewport:{width:1200,height:800}})).newPage(); p.on("pageerror",e=>errors.push(String(e)));
await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
await p.goto("http://127.0.0.1:8867/?silent&nogate&map=4",{timeout:120000}); await p.waitForFunction(()=>window.__dd&&window.__para&&window.__dd.map().id==='moat',null,{timeout:120000});
const A=await p.evaluate(()=>{ const P=window.__para, pe=P.perch(); const prof=P.profile(pe.x-8,pe.x,pe.z,.25); let maxRise=0; for(let i=1;i<prof.length;i++) maxRise=Math.max(maxRise,prof[i]-prof[i-1]); return { towers:P.info().towers, solid:P.solid(pe.x,pe.z,16.5), top:prof[prof.length-1], start:prof[0], maxRise }; });
check("the two gate towers are solid where the walk meets them",A.towers===2&&A.solid,JSON.stringify(A));
check("a stair climbs from the walk (16) to the tower top (20), no step higher than the hero can take",A.start===16&&A.top===20&&A.maxRise<=.6,JSON.stringify(A));
const B=await p.evaluate(async()=>{ const d=window.__dd, P=window.__para, pe=P.perch(); try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); window.__freeze=true; d.S.phase='build';
  d.hero.x=pe.x; d.hero.z=pe.z+.5; d.hero.y=pe.y; d.step(1/60,10); const near=P.info().near, prompt=getComputedStyle(document.getElementById('paraPrompt')).display;
  window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',key:'e'})); const on=P.info().on; let maxY=0, dist=0; const x0=d.hero.x, z0=d.hero.z;
  for(let i=0;i<60*30&&P.info().on;i++){ d.step(1/60,1); maxY=Math.max(maxY,d.hero.y); } const landed=P.info(); dist=Math.hypot(d.hero.x-x0,d.hero.z-z0);
  for(let i=0;i<60*4;i++) d.step(1/60,1); return { near, prompt, on, landed, dist:+dist.toFixed(1), back:P.info() }; });
check("by the paramotor in the build phase: the E prompt shows, and E takes off",B.near&&B.prompt==='block'&&B.on,JSON.stringify(B).slice(0,200));
check("it flies a good way, glides down and lands",B.landed.landings===1&&!B.landed.on&&B.dist>15,JSON.stringify({dist:B.dist,landed:B.landed}).slice(0,240));
check("the paramotor flies itself back to its perch",!B.back.back&&B.back.on===false,JSON.stringify(B.back).slice(0,200));
const C=await p.evaluate(async()=>{ const d=window.__dd, P=window.__para, pe=P.perch(); d.S.phase='build'; d.hero.x=pe.x; d.hero.z=pe.z+.5; d.hero.y=pe.y; d.step(1/60,5); P.launch(); for(let i=0;i<60;i++) d.step(1/60,1);
  d.S.phase='wave'; let t=0; for(;t<60*20&&P.info().on;t++) d.step(1/60,1); const down=P.info(); d.S.phase='wave'; d.hero.x=pe.x; d.hero.z=pe.z+.5; d.hero.y=pe.y; d.step(1/60,5); const nearWave=P.info().near; d.S.phase='build'; return { down, secs:+(t/60).toFixed(1), nearWave }; });
check("the horn mid-flight: the wing brings you straight down",!C.down.on&&C.secs<12,JSON.stringify(C).slice(0,200));
check("in a wave there is no take-off",C.nearWave===false,JSON.stringify(C).slice(0,120));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
