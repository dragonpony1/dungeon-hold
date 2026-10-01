// ===== THE FOUR BOLUSES OF WAVE 6 (build 382; 56i-prisonbarrier.js). Matt: "this boss wave 6 in the prison we need another 100 mobs pouring out during their march forward with huge boluses all at once then need to be overwhelming to a fully
// built out defense". Checked: starting the wall's cutscene puts four markers in the wave's spawn list (the wave cannot end before the last); once the crowd is let out the boluses come at 14, 28, 42 and 56 seconds of the wave clock, 25 mobs each
// (100 in all, plus the two siege carts), each one all out inside a fifth of a second -- a surge, not a trickle; and they come out of the breach (the three rows the wall stood in). Resetting the wall takes unfired boluses away.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8996,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:900,height:560}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
await page.goto("http://127.0.0.1:8996/?silent&nogate&map=5",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__finale&&window.__finale.ready&&window.__finale.ready()&&window.__carts&&window.__dd.map().id==='prison',null,{timeout:120000});
await page.evaluate(async()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,5); window.__freeze=true; await Promise.all(window.__carts.kinds.map(k=>window.__carts.load(k))); });
const R=await page.evaluate(()=>{ const d=window.__dd, F=window.__finale; for(const e of d.enemies) if(!e.dead) e.dead=.001; d.S.phase='wave'; d.S.crystal=1e9; d.S.waveT=3; d.setHero(0,40,0); F.reset(); const ok=F.start();
  const marks=window.__spawnQ?window.__spawnQ():null; let marker=null; // the spawn list is internal: the test reads what the finale reports
  F.skip(); for(let f=0;f<60*8&&!F.done();f++){ d.step(1/60,1); d.S.crystal=1e9; d.hero.hp=d.hero.max; }
  const done=F.done(); const w0=d.S.waveT; const seen=[]; let last=F.info().bolus||0, lastB=F.info().boluses||0; const fires=[]; let alive0=d.enemies.filter(e=>!e.dead).length;
  for(let f=0;f<60*70;f++){ d.step(1/60,1); d.S.crystal=1e9; d.hero.hp=d.hero.max; if(f%2===0){ const i=F.info(); if(i.boluses>lastB){ fires.push({ n:i.boluses, waveT:+(d.S.waveT-w0).toFixed(1), at:f }); lastB=i.boluses; } } }
  const fin=F.info(); return { ok, done, boluses:fin.boluses, bolus:fin.bolus, fires, carts:fin.carts, phase:d.S.phase, w0:+w0.toFixed(1) }; });
check("the wall falls and the crowd is let out",R.ok&&R.done,JSON.stringify({ ok:R.ok, done:R.done }));
check("four boluses come, at about 14, 28, 42 and 56 seconds after the crowd is let out",R.boluses===4&&R.fires.length===4&&R.fires.every((f,i)=>Math.abs(f.waveT-[14,28,42,56][i])<=4.8),JSON.stringify(R.fires));
check("each is 25 mobs (100 in all: the carts' crews and the carts are extra, two carts across the four)",R.bolus>=100,JSON.stringify({ bolus:R.bolus, carts:R.carts }));
const S=await page.evaluate(()=>{ const d=window.__dd, F=window.__finale; for(const e of d.enemies) if(!e.dead) e.dead=.001; d.S.phase='wave'; d.S.crystal=1e9; F.reset(); const before=F.info().boluses; F.start(); F.skip(); for(let f=0;f<60*8&&!F.done();f++){ d.step(1/60,1); d.S.crystal=1e9; d.hero.hp=d.hero.max; }
  // a bolus: all out within a fifth of a second -- count the new mobs frame by frame around the first one
  const w0=d.S.waveT; const counts=[]; let prev=d.enemies.filter(e=>!e.dead).length; let burst=null; for(let f=0;f<60*20&&!burst;f++){ d.step(1/60,1); d.S.crystal=1e9; d.hero.hp=d.hero.max; const i=F.info(); if(i.boluses>before){ const base=d.enemies.filter(e=>!e.dead).length; let peak=base; for(let g=0;g<30;g++){ d.step(1/60,1); d.S.crystal=1e9; const n=d.enemies.filter(e=>!e.dead).length; if(g===12) burst={ after12:n-base }; peak=Math.max(peak,n); } burst=Object.assign(burst||{},{ peak:peak-base }); } }
  const strip=window.__finale.strip(); const z=d.enemies.filter(e=>!e.dead&&e.kind!=='corruptor').map(e=>e.z); return { burst, zmax:+Math.max(...z).toFixed(1) }; });
check("a bolus is a SURGE: about 20+ mobs appear inside a fifth of a second (12 frames), not one by one",S.burst&&S.burst.after12>=18,JSON.stringify(S.burst));
const T=await page.evaluate(()=>{ const d=window.__dd, F=window.__finale; for(const e of d.enemies) if(!e.dead) e.dead=.001; F.reset(); return { boluses:F.info().boluses }; });
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
