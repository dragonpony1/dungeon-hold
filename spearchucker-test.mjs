// ===== THE SPEAR CHUCKER (build 631, 95d-pigbosses.js). Matt: "change that to a spear chucker" + his Meshy Bandit Pig Spear model (Walking / Running / baseball_pitching).
// Checked on the Throne Room: his own model loads with all three clips; a throw plants him with a red lane on the floor; a hero who stays on the lane takes the big hit and is shoved back;
// a hero who steps off it is missed and the spear sticks; some throws go at a tower, which takes the hit; the trio's bar row reads SPEAR; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8943,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("dd_trainer",JSON.stringify({done:{},off:true})); }catch(e){} });
await page.goto("http://127.0.0.1:8943/?silent&nogate&map=1",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__spear,null,{timeout:120000});
// the model: wave 5 starts the pigs' download
await page.evaluate(()=>{ const d=window.__dd; d.start(); d.step(1/60,3); d.S.wave=5; d.step(1/60,2); });
await page.waitForFunction(()=>window.__dd.mobTemplate('pigsling'),null,{timeout:120000}).catch(()=>{});
const M=await page.evaluate(()=>{ const g=window.__dd.mobTemplate('pigsling'); return g?{ walk:!!(g.map.walk), run:!!(g.map.run), atk:g.map.attack&&g.map.attack.name }:null; });
check("his own model loads with Walking, Running and the throw (baseball_pitching)",M&&M.walk&&M.run&&M.atk==='baseball_pitching',JSON.stringify(M));
// one throw at a hero who stays put
const setup=()=>page.evaluate(()=>{ const d=window.__dd; d.enemies.forEach(e=>{ e.hp=0; e.dead=1; }); d.step(1/60,2); d.S.phase='wave'; d.S.wave=7;
  const h=d.hero; const e=d.spawn('pigsling',Object.keys(d.lanes())[0]); e.x=h.x+9; e.z=h.z; e.hp=e.maxHp=1e6; window.__boss=e; return { hx:h.x, hz:h.z }; });
await setup();
const A=await page.evaluate(()=>{ const d=window.__dd, e=window.__boss, h=d.hero, S=window.__spear; const t0=S.info().throws; const hx=h.x, hz=h.z; h.hp=h.max=1e5; const hp0=h.hp;
  let lane=false, planted=true, ex=null, ez=null;
  for(let i=0;i<400&&S.info().heroHits===0;i++){ h.x=hx; h.z=hz; d.step(1/30,1); if(e.spearLane){ if(!lane){ lane=true; ex=e.x; ez=e.z; } else if(Math.hypot(e.x-ex,e.z-ez)>.05) planted=false; } }
  for(let i=0;i<3;i++) d.step(1/30,1);
  return { throws:S.info().throws-t0, lane, planted, hits:S.info().heroHits, hpLost:hp0-h.hp, pushed:+Math.hypot(h.x-hx,h.z-hz).toFixed(2) }; });
check("a throw: he plants, a red lane on the floor shows the line, and a hero who stays on it takes the big hit and is shoved back",A.throws>=1&&A.lane&&A.planted&&A.hits===1&&A.hpLost>0&&A.pushed>1.5,JSON.stringify(A));
if(process.env.SHOTS){ await setup(); await page.evaluate(()=>{ const d=window.__dd; for(let i=0;i<200&&!window.__boss.spearLane;i++) d.step(1/30,1); }); await sleep(300); await page.screenshot({path:process.env.SHOTS+"/spear-lane.png"}); }
// a throw the hero steps off
await setup();
const B=await page.evaluate(()=>{ const d=window.__dd, e=window.__boss, h=d.hero, S=window.__spear; const h0=S.info().heroHits, st0=S.info().sticks; let side=false;
  for(let i=0;i<400;i++){ d.step(1/30,1); if(e.spearLane&&!side){ side=true; h.x+=0; h.z+=3.2; } if(side&&S.info().sticks>st0) break; if(side){ h.z=h.z; } }
  return { side, hitsAdded:S.info().heroHits-h0, stuck:S.info().stuck, sticks:S.info().sticks-st0 }; });
check("a hero who steps off the lane is missed, and the spear sticks where it lands",B.side&&B.hitsAdded===0&&B.sticks>=1,JSON.stringify(B));
// some throws go at a tower
const Tw=await page.evaluate(()=>{ const d=window.__dd, S=window.__spear; d.enemies.forEach(e=>{ e.hp=0; e.dead=1; }); d.step(1/60,2); d.S.mana=1e6; const h=d.hero;
  let t=null; for(let a=0;a<16&&!t;a++){ const x=h.x+Math.cos(a*Math.PI/8)*5, z=h.z+Math.sin(a*Math.PI/8)*5; t=d.placeDefAt('frost',x,z,0); } if(!t) return { err:'no tower' }; t.hp=t.maxHp=1e6;
  const e=d.spawn('pigsling',Object.keys(d.lanes())[0]); e.x=t.x+8; e.z=t.z; e.hp=e.maxHp=1e6; h.x=e.x-40; h.z=e.z; const real=Math.random; Math.random=()=>0.05;
  const a0=S.info().atTower, th0=S.info().towerHits; for(let i=0;i<500&&S.info().towerHits===th0;i++){ d.step(1/30,1); } Math.random=real; return { atTower:S.info().atTower-a0, towerHits:S.info().towerHits-th0, hpLost:1e6-t.hp }; });
check("sometimes he throws at a tower instead, and it takes the hit",Tw.atTower>=1&&Tw.towerHits>=1&&Tw.hpLost>0,JSON.stringify(Tw));
const BAR=await page.evaluate(()=>(document.getElementById('pigbar')||{}).textContent||'');
check("the trio's bar row reads SPEAR",/SPEAR/.test(BAR)&&!/SLING/.test(BAR),BAR);
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
