// ===== THE GNOME ENGINEER, the fifth hero (build 598; parts/staging/99x-engineer.js, 70-hero2.js lockLvl, 73-specials.js OVERCLOCK). Matt: "engineer unlocks at level 7 and please go add him in".
// Checked: five hero cards on the title, the Engineer's locked below level 7 (the card, the lock's words, the raven's button refuses him); at level 7 he can be picked, wears his own model
// and moves, holds his wrench whatever he wears, and his keys are the Lookout Perch (moved from the Ranger), the Sky Platform, the Gnome Turret and the Sky Wrecker; OVERCLOCK halves the reload of the
// towers near him; picked and reloaded, he is still the hero; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const DIST=process.env.DIST||"./dist"; const server=await serve(8888,{dist:DIST});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}});
await ctx.addInitScript(()=>{ try{ if(sessionStorage.getItem('__en')) return; sessionStorage.setItem('__en','1'); localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_trainer","done"); localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8888/?silent&nogate&map=0",{timeout:180000}); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel&&window.__dd.heroModel()&&window.__engineer,null,{timeout:180000}); await page.waitForTimeout(800);
const T=await page.evaluate(()=>({ cards:[...document.querySelectorAll('#heroline .hcard')].map(b=>b.dataset.hero+(b.classList.contains('locked')?'(L)':'')), lvl:window.__meta.level(), locked:window.__heroes.locked('engineer'), text:window.__heroes.lockText('engineer'), title:(document.querySelector('#heroline .hcard[data-hero="engineer"]')||{}).title||'' }));
check("five hero cards on the title; below level 7 the Engineer's is locked and says why",T.cards.length===5&&T.cards[4]==='engineer(L)'&&T.lvl<7&&T.locked&&/level 7/i.test(T.text)&&/level 7/i.test(T.title),JSON.stringify(T));
const A=await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); for(let i=0;i<20;i++) d.step(1/30,1);
  const R=window.__raven.pos(); d.hero.x=R.x+1.2; d.hero.z=R.z+1.2; for(let i=0;i<10;i++) d.step(1/30,1); const btn=[...document.querySelectorAll('#heroPick button')].find(b=>b.dataset.hero==='engineer'); if(btn) btn.click(); await new Promise(r=>setTimeout(r,200));
  return { btn:!!btn, pick:window.__heroes.pick(), toast:(document.getElementById('toast')||{}).textContent||'' }; });
check("at the raven, his button refuses him below level 7 (with the lock's words)",A.btn&&A.pick!=='engineer'&&/level 7/i.test(A.toast),JSON.stringify(A));
const B=await page.evaluate(async()=>{ const d=window.__dd; window.__meta.setLevel(7); await window.__heroes.select('engineer'); for(let i=0;i<80;i++){ await new Promise(r=>setTimeout(r,100)); d.step(1/30,1); const m=d.heroModel(); if(m&&/Engineer/.test(m.label)&&window.__weapons.state().mounted) break; }
  const slots=[...document.querySelectorAll('#hotbar .slot')].filter(s=>s.style.display!=='none').sort((a,b)=>(+a.style.order||0)-(+b.style.order||0)).map(s=>s.querySelector('.n').textContent);
  const m=d.heroModel(); return { locked:window.__heroes.locked('engineer'), label:m.label, clips:m.clips, w:window.__weapons.look().w, mounted:window.__weapons.state().mounted, slots, ranger:window.__heroes.list().length, sp:window.__specials.name() }; });
check("at level 7 he is picked: his own model and six moves, his wrench in hand",!B.locked&&/Engineer/.test(B.label)&&['idle','walk','run','attack','jump','death'].every(c=>B.clips.includes(c))&&B.w==='wrench-engineer'&&B.mounted,JSON.stringify(B));
check("his keys (build 602): Lookout Perch, Sky Platform, Gnome Turret, Barricade, Barricade Gate, Sky Wrecker; his special is OVERCLOCK",B.slots.join(',')==='Lookout Perch,Sky Platform,Gnome Turret,Barricade,Barricade Gate,Sky Wrecker'&&B.sp==='Overclock',JSON.stringify(B.slots));
const C=await page.evaluate(()=>{ const d=window.__dd; d.addMana(5000); const h=d.hero; d.placeDefAt('turret',h.x+3,h.z+3,0); const far=d.placeDefAt('turret',h.x+30,h.z+30,0); const near=d.defs.find(x=>x.kind==='turret'&&Math.hypot(x.x-h.x,x.z-h.z)<8), farD=d.defs.find(x=>x.kind==='turret'&&Math.hypot(x.x-h.x,x.z-h.z)>20);
  const c0=d.stat(near,'cd'), f0=farD?d.stat(farD,'cd'):null; window.__specials.fire(); for(let i=0;i<4;i++) d.step(1/30,1); const c1=d.stat(near,'cd'), f1=farD?d.stat(farD,'cd'):null; return { c0, c1, f0, f1, on:window.__engineer.active() }; });
check("OVERCLOCK: towers near him reload twice as fast (one far away does not)",C.on&&Math.abs(C.c1-C.c0/2)<1e-6&&(C.f0===null||C.f1===C.f0),JSON.stringify(C));
await page.reload(); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel&&window.__dd.heroModel()&&window.__engineer,null,{timeout:180000}); await page.waitForTimeout(800);
const D=await page.evaluate(()=>({ pick:window.__heroes.pick(), saved:localStorage.getItem('ddHero'), sel:(document.querySelector('#heroline .hcard.sel')||{}).dataset?.hero }));
check("picked and reloaded, he is still the hero (and his card is the picked one)",D.pick==='engineer'&&D.saved==='engineer'&&D.sel==='engineer',JSON.stringify(D));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
