// ===== THE ARCHHAG (95f-archhag.js, build 308). Matt: "yes the archhag wakes the topiaries", "shes going to be the boss for the cloister", "more legendary jars, like 30", "when she first comes in she will
// cast and ressurect stickmen to fight for her. they are alarmingly faster that most mobs. she has a two phase healthbar. once the first one is gone she animates the topiaries", "let her stickmen run
// ahead but she walks more slowly staying back and casting". Checked on the Cloister Court: her four clips load onto one model; spawned, her arrival cast raises ten stickmen, about twice a goblin's
// speed while she is slow; a blow that would empty her first bar stops at the line, she turns to phase two, untouchable for her cast, and every topiary leaves its bed as a hopping mob on a lane; a
// cast curses a tower in reach (5 s, chains); killing her plays her fall (body kept), puts every hopping topiary to sleep off the field, and bursts 30 Legendary jars; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8963,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:900,height:560}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8963/?silent&nogate&map=2",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__archhag&&window.__archhag.ensure&&window.__courtdecor&&window.__courtdecor.topiList,null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,10); window.__archhag.ensure(); });
for(let i=0;i<400;i++){ const ok=await page.evaluate(()=>{ window.__dd.step(1/60,1); return window.__archhag.loaded()&&window.__courtdecor.topiList().length>=12; }); if(ok) break; await sleep(80); }
const a=await page.evaluate(()=>({ loaded:window.__archhag.loaded(), topi:window.__courtdecor.topiList().length }));
check("her four clips load onto one model and the court's twelve topiaries stand ready",a.loaded&&a.topi===12,JSON.stringify(a));
const b=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,3); d.addMana(9000); d.setHero(-90,-90,0);
  const e=window.__archhag.spawn(); if(!e) return {spawned:false}; const clips=Object.keys(e.mdl.actions);
  for(let i=0;i<60*5&&window.__archhag.sticks()<10;i++){ d.setHero(-90,-90,0); d.step(1/60,1); }
  const sticks=d.enemies.filter(x=>x.kind==='stickman'&&!x.dead), gob=d.spawn('goblin',Object.keys(d.lanes())[0]); const gspd=gob.spd; d.kill(gob);
  return { spawned:true, clips, sticks:sticks.length, stickSpd:+(sticks.reduce((s,x)=>s+x.spd,0)/Math.max(1,sticks.length)).toFixed(2), goblinSpd:+gspd.toFixed(2), hagSpd:+e.spd.toFixed(2), topiAwake:window.__archhag.awake() }; });
check("spawned, her arrival cast raises ten stickmen, nearly twice a goblin's speed, while she walks slowly (and the garden still sleeps)",b.spawned&&b.clips.includes('death')&&b.clips.includes('idle')&&b.sticks===10&&b.stickSpd>b.goblinSpd*1.6&&b.hagSpd<b.goblinSpd*.5&&b.topiAwake===0,JSON.stringify(b));
const c=await page.evaluate(()=>{ const d=window.__dd, e=d.enemies.find(x=>x.kind==='archhag'&&!x.dead); const max=e.max; if(d.hurt) d.hurt(e,max*.9,0,0); else e.hp-=max*.9; d.step(1/60,2);
  const afterHit={hp:+(e.hp/max).toFixed(3),phase:e.phase,shield:+(e.shield||0).toFixed(2)}; const hp0=e.hp; if(d.hurt) d.hurt(e,50,0,0); const shielded=e.hp===hp0;
  const vis0=window.__courtdecor.topiList().filter(t=>t.mesh.visible).length;
  for(let i=0;i<60*6&&window.__archhag.awake()<12;i++){ d.setHero(-90,-90,0); d.step(1/60,1); } for(let i=0;i<60;i++) d.step(1/60,1);
  const mobs=d.enemies.filter(x=>x.topi&&!x.dead); return { afterHit, shielded:!!d.hurt?shielded:'n/a', vis0, vis1:window.__courtdecor.topiList().filter(t=>t.mesh.visible).length, awake:window.__archhag.awake(), onLane:mobs.filter(x=>!x.leap).length, kinds:[...new Set(mobs.map(x=>x.kind))] }; });
check("a blow that would empty her first bar stops at the line: phase two, untouchable while she casts, and every topiary leaves its bed as a hopping mob on a lane (witch, fighter, ranger)",c.afterHit.hp===.5&&c.afterHit.phase===2&&c.afterHit.shield>0&&c.shielded!==false&&c.vis0===12&&c.vis1===0&&c.awake===12&&c.onLane===12&&c.kinds.length===3,JSON.stringify(c));
const t=await page.evaluate(()=>{ const d=window.__dd, e=d.enemies.find(x=>x.kind==='archhag'&&!x.dead);
  let tw=null; for(let r=1;r<6&&!tw;r++) for(let dx=-r;dx<=r&&!tw;dx++) for(let dz=-r;dz<=r&&!tw;dz++){ const n0=d.defs.length; try{ d.placeDefAt('harpoon',e.x+dx*2,e.z+dz*2,0); }catch(err){} if(d.defs.length>n0) tw=d.defs[d.defs.length-1]; }
  if(!tw) return {tower:false}; let cursed=false, cdHeld=0; for(let i=0;i<60*14&&!cursed;i++){ d.setHero(-90,-90,0); d.step(1/60,1); if(tw.curseT>0){ cursed=true; cdHeld=tw.cd; } }
  return { tower:true, cursed, cdHeld:+cdHeld.toFixed(2), chains:!!tw.curseFx }; });
check("a cast curses a tower in reach: purple chains, its next shot held off for about 5 s",t.tower&&t.cursed&&t.cdHeld>4&&t.chains,JSON.stringify(t));
const k=await page.evaluate(()=>{ const d=window.__dd, J=window.__jars; J.clear(); const e=d.enemies.find(x=>x.kind==='archhag'&&!x.dead); d.kill(e); d.step(1/60,5);
  const leg=J.list().filter(j=>j.r===3).length; const sleepers=window.__archhag.asleep(), onField=d.enemies.filter(x=>x.topi&&!x.dead).length;
  for(let i=0;i<180;i++) d.step(1/60,1); const bodyAt3s=d.enemies.includes(e); for(let i=0;i<60*6;i++) d.step(1/60,1); const bodyAt9s=d.enemies.includes(e);
  return { leg, sleepers, onField, bodyAt3s, bodyAt9s }; });
check("killing her: 30 Legendary jars burst out, every hopping topiary falls asleep as a statue (none left on the field), her body stays for her fall, then goes",k.leg===30&&k.sleepers>=1&&k.onField===0&&k.bodyAt3s&&!k.bodyAt9s,JSON.stringify(k));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
