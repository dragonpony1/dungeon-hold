// the lavender troll boss: a Meshy rig like the blue troll archer's, a slow lob that splashes nearby defenses, a heal-pulse
// that mends wounded mobs within reach (kill it first or the horde outlasts you), and wave 12+ is where it shows up
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const SP=process.env.SP; const server=await serve(8875);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const ctx=await browser.newContext({viewport:{width:1100,height:700}}); const page=await ctx.newPage(); const errors=[]; page.on("pageerror",e=>errors.push(String(e))); page.on("console",m=>{ if(m.type()==="error"||m.type()==="warning") errors.push(m.text().slice(0,200)); });
const ready=()=>page.waitForFunction(()=>window.__dd&&window.__dd.heroModel()&&window.__dd.mobModel("trollboss"),null,{timeout:120000});
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","2"); localStorage.setItem("ddMap","0"); }catch(e){} });
await page.goto("http://127.0.0.1:8875/?silent&nogate&map=0"); await ready();
// the rig: real Meshy clips, taller and tankier than the archer troll, its own splash/heal stats
const r1=await page.evaluate(async()=>{ const d=window.__dd; window.__meta.reset(); d.resetGear(); d.start(); d.step(1/60,5); const tb=d.spawn("trollboss","N"); const clips=Object.keys(tb.mdl.actions); const h=tb.h, r=tb.r; d.kill(tb); return {clips,glb:!!tb.mdl.glb,h,r,hp:d.MOBS.trollboss.hp,splash:d.MOBS.trollboss.splash,healAmt:d.MOBS.trollboss.healAmt,healR:d.MOBS.trollboss.healR}; });
check("troll boss: Meshy rig with idle/walk/run/attack/death, taller and tankier than the archer troll (340 hp), a 2.2-splash grenade and a heal-pulse stat block",r1.glb&&["idle","walk","run","attack","death"].every(c=>r1.clips.includes(c))&&r1.h>2.3&&r1.hp===340&&r1.splash===2.2&&r1.healAmt===14&&r1.healR===6.5,JSON.stringify(r1));
// the grenade: lobbed at one ballista, it bursts and catches a second one standing right beside it
const r2=await page.evaluate(async()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,5); d.addMana(2000); d.setHero(0,10,Math.PI);
  const t1=d.place("harpoon",16,13,0), t2=d.place("harpoon",17,13,0); const tb=d.spawn("trollboss","N"); tb.x=t1.x; tb.z=t1.z-8; tb.spd=0;
  const hp1_0=t1.hp, hp2_0=t2.hp; let grenadeSeen=false;
  for(let i=0;i<60*10;i++){ d.step(1/60,1); tb.x=t1.x; tb.z=t1.z-8; if(d.projs.some(p=>p.kind==="arrow"&&p.splash)) grenadeSeen=true; if(t1.hp<hp1_0&&t2.hp<hp2_0) break; }
  const st=d.mobState(tb); d.kill(tb); return {dist:Math.hypot(t2.x-t1.x,t2.z-t1.z),hit1:t1.hp<hp1_0,hit2:t2.hp<hp2_0,grenadeSeen,cur:st.cur}; });
check("the grenade splashes: a second ballista standing beside the one it's aimed at also takes damage",r2.hit1&&r2.hit2&&r2.grenadeSeen,JSON.stringify(r2));
// the heal-pulse: a wounded mob nearby is mended, one well outside its ring is not
const r3=await page.evaluate(async()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,5);
  const tb=d.spawn("trollboss","N"); tb.x=0; tb.z=10; tb.spd=0;
  const near=d.spawn("goblin","N"); near.x=1.5; near.z=10.5; near.spd=0; near.hp=3; near.max=10;
  const far=d.spawn("goblin","N"); far.x=20; far.z=30; far.spd=0; far.hp=3; far.max=10;
  for(let i=0;i<60*8;i++){ d.step(1/60,1); tb.x=0; tb.z=10; near.x=1.5; near.z=10.5; far.x=20; far.z=30; }
  const r={nearHp:near.hp,farHp:far.hp}; d.kill(tb); d.kill(near); d.kill(far); return r; });
check("the heal-pulse mends a wounded mob within its ring but leaves one far outside it untouched",r3.nearHp>3&&r3.farHp===3,JSON.stringify(r3));
// wave 12 introduces the boss, capped at one; a later off-cadence wave carries no boss
const r4=await page.evaluate(()=>{ const d=window.__dd; d.S.wave=11; d.startWave(); const b12=document.getElementById("banner").textContent; const q12=d.status().queue;
  d.S.phase="build"; d.S.wave=12; d.startWave(); const b13=document.getElementById("banner").textContent; const q13=d.status().queue;
  return {b12,q12,b13,q13}; });
check("wave 12 (the 12th) banners A TROLL BOSS; wave 13, off the five-wave cadence, does not",/TROLL BOSS/.test(r4.b12)&&!/TROLL BOSS/.test(r4.b13),JSON.stringify(r4));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
