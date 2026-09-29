import { chromium } from "playwright"; import { serve } from "./serve.mjs";
// build 221: GLADEHART, the Cyclops's reward pet -- reward-only (never in the random named drop), wears the stag, and every ~8 s of a wave
// its bright pink Spirit Charge runs through the thickest pack: 6 pet shots to each mob it passes, thrown back; bosses only nudged
const server=await serve(8873);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext(); const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8873/?silent&nogate"); await page.waitForFunction(()=>window.__dd&&window.__gladehart&&window.__mythic&&window.__mythicDrops&&window.__familiar,null,{timeout:60000});
// the item: a reward-only named familiar, with its picture-less card fine and never in the random pool
const it0=await page.evaluate(()=>{ const M=window.__mythic, N=M.NAMED.gladehart; const it=M.normalize({tier:"named",named:"gladehart"}); let rolled=new Set(); for(let i=0;i<400;i++){ const x=window.__mythicDrops.namedItem(); if(x) rolled.add(x.named); }
  return {has:!!N,slot:it&&it.slot,named:it&&it.named,reward:N&&N.reward,stats:it&&it.stats,rolledNever:!rolled.has("gladehart"),rolledCount:rolled.size}; });
check("Gladehart is a named familiar that is reward-only: 400 random named drops never roll it, the other named pieces still do",it0.has&&it0.slot==="familiar"&&it0.named==="gladehart"&&it0.reward&&it0.rolledNever&&it0.rolledCount>=8,JSON.stringify(it0));
// equipped: it wears the stag body, not the Wisp
await page.evaluate(()=>{ const d=window.__dd; d.start(); d.step(1/60,20); const it=window.__mythic.normalize({tier:"named",named:"gladehart"}); window.__meta.giveItem(it); window.__meta.equip(it.id); d.step(1/60,10); });
for(let i=0;i<150;i++){ await page.evaluate(()=>window.__dd.step(1/60,3)); await page.waitForTimeout(80); const ok=await page.evaluate(()=>{ const g=window.__familiar.model(); return !!g&&g.userData.named==="gladehart"; }); if(ok) break; }
const body=await page.evaluate(()=>{ const g=window.__familiar.model(); return {named:g&&g.userData.named,glb:g&&g.userData.glb,worn:window.__gladehart.worn()}; });
check("equipped, Gladehart wears its own stag (named body, not the Wisp's) and the Spirit Charge is armed",body.named==="gladehart"&&body.glb&&body.worn,JSON.stringify(body));
// a pack in the hall + a boss: fire the charge by hand and check the numbers
const pack=()=>page.evaluate(()=>{ const d=window.__dd; d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; d.setHero(0,5,0); d.step(1/60,5); const gs=[];
  for(const [x,z] of [[0,11.2],[-1.2,11.8],[1.2,11.6],[-.6,12.6],[.7,12.8],[0,13.8]]){ const e=d.spawn("goblin","N"); e.x=x; e.z=z; e.y=0; e.hp=e.max=9999; e.dmg=0; e.atk=999; e.holdT=1e9; gs.push(e); }
  const far=d.spawn("goblin","N"); far.x=9; far.z=13; far.y=0; far.hp=far.max=9999; far.dmg=0; far.atk=999; far.holdT=1e9;
  const boss=d.spawn("goblin","N"); boss.kind="cyclops"; boss.x=.2; boss.z=15.2; boss.y=0; boss.hp=boss.max=99999; boss.dmg=0; boss.atk=999; boss.holdT=1e9;
  window.__pk={gs,far,boss,z0:gs.map(e=>e.z),far0:[far.x,far.z],boss0:[boss.x,boss.z]}; d.step(1/60,3); return gs.length; });
await pack();
const fire=await page.evaluate(()=>{ const d=window.__dd, G=window.__gladehart, P=window.__pk; const dmg=window.__familiar.dmg()*G.cfg.mult; const t=G.thickest(); const ok=G.fire(); const c0=G.charges();
  const before=P.gs.map(e=>e.hp), bb=P.boss.hp, fb=P.far.hp; let maxG=0; for(let i=0;i<70;i++){ d.step(1/60,1); maxG=Math.max(maxG,G.ghosts()); }
  const dz=P.gs.map((e,i)=>+(Math.hypot(e.x-[0,-1.2,1.2,-.6,.7,0][i],e.z-P.z0[i])).toFixed(2)); const lost=P.gs.map((e,i)=>+(before[i]-e.hp).toFixed(1));
  return {ok,packSize:t&&t.n,dmg:+dmg.toFixed(1),lost,moved:dz,bossLost:+(bb-P.boss.hp).toFixed(1),bossMoved:+Math.hypot(P.boss.x-P.boss0[0],P.boss.z-P.boss0[1]).toFixed(2),farLost:+(fb-P.far.hp).toFixed(1),charges:G.charges(),hits:G.hits(),ghostSeen:maxG,ghostGone:G.ghosts()}; });
check("the charge picks the thick pack (not the loner) and launches one pink ghost",fire.ok&&fire.packSize>=5&&fire.charges===1&&fire.ghostSeen===1,JSON.stringify({packSize:fire.packSize,charges:fire.charges,ghost:fire.ghostSeen}));
check("every mob in its path takes six pet shots and is thrown back several steps; the loner off to the side is untouched",fire.lost.filter(x=>Math.abs(x-fire.dmg)<.6).length>=5&&fire.moved.filter(x=>x>1.5).length>=4&&fire.farLost===0,JSON.stringify({dmg:fire.dmg,lost:fire.lost,moved:fire.moved,far:fire.farLost}));
check("a boss in the path takes the full hit but only a nudge of knockback",Math.abs(fire.bossLost-fire.dmg)<.6&&fire.bossMoved<1.2,JSON.stringify({bossLost:fire.bossLost,bossMoved:fire.bossMoved}));
check("the ghost runs out and is cleaned up",fire.ghostGone===0,JSON.stringify({ghosts:fire.ghostGone}));
// on its own: in a wave it fires by itself about every 8 s, and never in the build phase
const auto=await page.evaluate(()=>{ const d=window.__dd, G=window.__gladehart; d.S.phase="build"; G.cfg.t=.1; const c0=G.charges(); d.step(1/60,120); const buildCharges=G.charges()-c0;
  d.S.wave=Math.max(1,d.S.wave); d.S.phase="wave"; G.cfg.t=.2; const c1=G.charges(); const times=[]; let t=0; for(let i=0;i<60*20;i++){ d.step(1/60,1); t+=1/60; if(G.charges()>c1+times.length) times.push(+t.toFixed(1)); }
  return {buildCharges,times}; });
check("it never charges in the build phase; in a wave it charges by itself about every 8 s",auto.buildCharges===0&&auto.times.length>=2&&auto.times.length<=3&&auto.times.every((x,i)=>i===0?x<2:Math.abs(x-auto.times[i-1]-8)<1),JSON.stringify(auto));
// the reward: the Cyclops's fall hands it over once
const rw=await page.evaluate(()=>{ const d=window.__dd, G=window.__gladehart, M=window.__mythic; d.resetGear&&d.resetGear(); window.__meta.reset&&window.__meta.reset(); d.start(); d.step(1/60,5);
  const n0=d.loot.length; const a=G.reward(); d.step(1/60,5); const n1=d.loot.length; const named=d.loot.some(l=>l.mesh&&l.mesh.userData&&l.mesh.userData.item!==undefined)||true;
  const dropped=d.loot.map(l=>l.it&&l.it.named).filter(Boolean);
  const owned=window.__mythic.normalize({tier:"named",named:"gladehart"}); window.__meta.giveItem(owned); const b=G.reward(); return {first:a,lootAfter:n1-n0,dropped,secondWhenOwned:b}; });
check("felling the Cyclops drops Gladehart by the crystal once, and never again if you already own it",rw.first&&rw.dropped.includes("gladehart")&&rw.secondWhenOwned===false,JSON.stringify(rw));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
