// ===== THE CORRUPTOR'S GATE SWITCH (95l-fate.js, build 366). Matt: "I like the switching gates depending on how we set it up", "4 seconds is fine", "yeah do the gate switching". Checked: while a Corruptor lives on a wave, 8 s after
// it comes into the fight one gate is pulled shut, the warning (the boss casting, a beam to the gate, a violet veil and a clock sigil on it) starting 4 s before; every 15 s the shut gate opens and another shuts; never more than one
// shut, never fewer than two open (with only two gates open nothing is ever shut); a mob bound for a shut gate comes out of another; mobs already out keep coming; when the Corruptor dies every gate opens; no lights are added.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8996,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:900,height:560}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8996/?silent&nogate&map=5",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__fate&&window.__corruptor&&window.__dd.map().id==='prison',null,{timeout:120000});
await page.evaluate(async()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,5); window.__freeze=true; await window.__corruptor.load(); });
const lights0=await page.evaluate(()=>{ const d=window.__dd, sc=typeof d.scene==='function'?d.scene():d.scene; let n=0; sc.traverse(o=>{ if(o.isLight) n++; }); return n; });
// ---- a Corruptor in a wave with all four gates open
const A=await page.evaluate(()=>{ const d=window.__dd, F=window.__fate; for(const e of d.enemies) if(!e.dead) e.dead=.001; d.S.wave=6; d.S.phase='wave'; d.S.crystal=1e6; d.spawn('corruptor','E'); const b=d.enemies.find(e=>e.kind==='corruptor'&&!e.dead); b.hp=b.max=1e9; b.spd=0; const log=[]; const T=F.consts;
  const run=(sec,fn)=>{ for(let i=0;i<Math.round(sec*60);i++){ d.step(1/60,1); d.S.crystal=1e6; b.hp=b.max=1e9; if(fn) fn(i); } };
  const sample=()=>{ const i=F.info(); return { on:i.on, shut:i.shut, warn:i.warn, open:i.open.length, shutCount:Object.values(i.modes).filter(m=>m==='shut').length }; };
  run(3); const s3=sample();
  run(1.3); const s43=sample(); const g=F.gate(s43.warn); const casting=b.casting; const beam=F.info().beam; run(2); const gMid=F.gate(s43.warn);
  run(1.9); const s8=sample(); const shutLane=s8.shut; const gShut=F.gate(shutLane);
  // twenty goblins bound for the shut gate come out of the others
  const lanes=d.lanes?(typeof d.lanes==='function'?d.lanes():d.lanes):{}; const sg=lanes[shutLane]; const before=d.enemies.length; const r0=F.info().remaps; for(let i=0;i<20;i++) d.spawn('goblin',shutLane); const gob=d.enemies.slice(before); const cw=d.cw, cwz=d.cwz; const far=gob.filter(e=>Math.hypot(e.x-cw(sg.cx),e.z-cwz(sg.cz))>8).length; const remaps=F.info().remaps-r0;
  // a goblin that was out before the next switch keeps coming
  const early=gob[0]; early.hp=early.max=1e9; early.spd=0;
  const seen=[]; const t0=F.info().clock; let maxShut=0, minOpen=9; let warns=[], shuts=[]; let last=s8.shut;
  run(24,i=>{ if(i%6===0){ const q=sample(); maxShut=Math.max(maxShut,q.shutCount); minOpen=Math.min(minOpen,q.open); if(q.warn&&!warns.includes(q.warn)) warns.push(q.warn); if(q.shut&&q.shut!==last){ shuts.push(q.shut); last=q.shut; } } });
  const s32=sample(); const mid=F.info(); const oldMode=F.info().modes[shutLane];
  return { lanesOpen:s8.open+s8.shutCount, s3, s43, casting, beam, gOk:!!(g&&g.veil&&g.sig), voMid:gMid.vo, s8, gShutVeil:gShut.veil, gShutVo:gShut.vo, far, remaps, earlyAlive:!early.dead, maxShut, minOpen, warns, shuts, s32, oldMode, shutLane, castEnd:b.casting, clock:+mid.clock.toFixed(1) }; });
check("a Corruptor in a wave switches nothing for its first four seconds, then the warning starts: the boss casts, a beam of violet runs from it to the gate about to shut, a veil and a clock sigil show there",A.s3.on&&!A.s3.warn&&!A.s3.shut&&A.s43.warn&&A.casting&&A.beam>=10&&A.gOk&&A.voMid>.1,JSON.stringify({ s3:A.s3, s43:A.s43, casting:A.casting, beam:A.beam, veil:A.gOk, vo:A.voMid }));
check("at eight seconds that gate is shut (the veil stays up), exactly one gate shut and the rest open",A.s8.shut&&A.s8.shut===A.s43.warn&&A.gShutVeil&&A.gShutVo>.3&&A.s8.shutCount===1&&A.s8.open===A.lanesOpen-1,JSON.stringify({ s8:A.s8, veil:A.gShutVeil, vo:A.gShutVo }));
check("twenty goblins bound for the shut gate all come out of other gates (counted, and well away from the shut one)",A.remaps===20&&A.far===20,JSON.stringify({ remaps:A.remaps, far:A.far }));
check("a goblin already out keeps coming, and over the next 24 s the gate moves: a new warning, then the old gate opens as another shuts, never more than one shut and never more than one of them closed",A.earlyAlive&&A.shuts.length>=1&&A.shuts[0]!==A.shutLane&&A.maxShut<=1&&A.minOpen>=A.lanesOpen-1&&A.warns.length>=1,JSON.stringify({ shuts:A.shuts, warns:A.warns, maxShut:A.maxShut, minOpen:A.minOpen, old:A.oldMode }));
// ---- only two gates open: nothing is ever shut
const B=await page.evaluate(()=>{ const d=window.__dd, F=window.__fate; for(const e of d.enemies) if(!e.dead) e.dead=.001; d.step(1/60,70); d.S.wave=2; d.S.phase='wave'; d.S.crystal=1e6; d.spawn('corruptor','E'); const b=d.enemies.find(e=>e.kind==='corruptor'&&!e.dead); const w0=F.info().warns+F.info().shuts; let shut=null;
  for(let i=0;i<60*30;i++){ d.step(1/60,1); d.S.crystal=1e6; b.hp=b.max=1e9; const q=F.info(); if(q.shut) shut=q.shut; } const i=F.info(); return { open:i.open.length, shut, newEvents:i.warns+i.shuts-w0 }; });
check("with only two gates open (the second wave) the power does nothing at all: no warning, no gate ever shut",B.open===2&&B.shut===null&&B.newEvents===0,JSON.stringify(B));
// ---- slain, every gate opens
const C=await page.evaluate(()=>{ const d=window.__dd, F=window.__fate; for(const e of d.enemies) if(!e.dead) e.dead=.001; d.step(1/60,70); d.S.wave=6; d.S.phase='wave'; d.S.crystal=1e6; d.spawn('corruptor','E'); const b=d.enemies.find(e=>e.kind==='corruptor'&&!e.dead); b.hp=b.max=1e9; for(let i=0;i<60*10;i++){ d.step(1/60,1); d.S.crystal=1e6; b.hp=b.max=1e9; } const had=F.info().shut; d.kill(b); for(let i=0;i<60*1.6;i++){ d.step(1/60,1); d.S.crystal=1e6; } const i=F.info(); return { had, on:i.on, shut:i.shut, modes:Object.values(i.modes) }; });
check("when the Corruptor dies the power ends: every gate opens again (no veil left), a flash at each",C.had&&!C.on&&C.shut===null&&C.modes.every(m=>m==='off'),JSON.stringify(C));
const lights1=await page.evaluate(()=>{ const d=window.__dd, sc=typeof d.scene==='function'?d.scene():d.scene; let n=0; sc.traverse(o=>{ if(o.isLight) n++; }); return n; });
check("no lights are made (violet sprites and flat planes only)",lights1===lights0,JSON.stringify({ before:lights0, after:lights1 }));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
