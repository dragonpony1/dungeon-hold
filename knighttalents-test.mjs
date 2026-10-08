// ===== THE GNOME KNIGHT'S TALENTS (build 395; parts/staging/96l-talents.js). Matt said yes to the plan: BULWARK (Iron Plate, Shield Bash, Thorns, Last Stand, Aegis), BLADE (Keen Edge, Wide Sweep, Bleed, Fury, Cyclone),
// WARDEN (Bannerman, Thornwright, Long Hedge, Trapsmith, Vigil). Checked: the Knight has the tree (three branches of five); armor and health from Iron Plate; Wide Sweep III reaches a mob at his side and draws its arc; every 3rd
// swing bleeds, every 4th bashes (knocked back and stunned); a kill starts Fury; Cyclone sets the Whirlwind off again; Thorns bite back; Aegis catches a blow that would drop him low and holds 3 s; a Long Hedge is five squares;
// Trapsmith quickens the trap; Vigil quickens towers near a Knight who stands still; Bannerman's ring is under them; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8987,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1100,height:700}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.removeItem("dd_talents"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8987/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__talents&&window.__heroes&&window.__meta&&window.__meta.setLevel&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} await window.__heroes.select('knight'); d.start(); d.step(1/60,5); window.__meta.setLevel(99); d.addMana(99999); d.S.du=-80; d.S.crystal=1e9; });
await page.waitForFunction(()=>{ const w=window.__weapons&&window.__weapons.mounted(); return w&&!/^(staff|bow)-/.test(w.name); },null,{timeout:120000});   /* the Knight's sword in his hand (the hero switch swaps it in a moment later) */
await page.evaluate(()=>{ window.__freeze=true; });
const prep=`const d=window.__dd, T=window.__talents, h=d.hero; for(const e of d.enemies) if(!e.dead) d.kill(e); d.step(1/60,2); d.setHero(0,8,0); h.yaw=0; h.hp=h.max;
  const mk=(dx,dz,kind)=>{ d.spawn(kind||'goblin','N'); const g=d.enemies[d.enemies.length-1]; g.hp=g.max=5000; g.spd=0; g.dmg=0; g.atk=1e9; g.x=h.x+dx; g.z=h.z+dz; g.y=h.y; return g; };`;
const A=await page.evaluate(()=>{ const T=window.__talents, d=window.__dd; const nodes=T.nodes(); const def0=d.heroStat('def'); for(let i=0;i<3;i++) T.spend('kplate'); return { tree:T.tree(), branches:nodes&&nodes.map(b=>b.id+':'+b.nodes.length).join(), def:d.heroStat('def')-def0, hp:T.mult('hp') }; });
check("the Knight has his tree: BULWARK, BLADE, WARDEN, five tiers each; Iron Plate III = +12 armor and +18% health",A.tree==='knight'&&A.branches==='bulwark:5,blade:5,warden:5'&&A.def===12&&Math.abs(A.hp-.18)<1e-9,JSON.stringify(A));
const B=await page.evaluate(new Function(`return (async()=>{ ${prep} T.respec(); for(const id of ['kedge','kedge','kedge','ksweep','ksweep','ksweep','kbleed','kfury','kfury','kfury','kcyclone']) T.spend(id);
  const front=mk(0,1.5), side=mk(1.8,0); T.cast(); const k1=T.knight(); const r={ front:front.hp<5000, side:side.hp<5000, arcs:k1.arcs };
  T.cast(); T.cast(); const k3=T.knight(); r.bleed=k3.bleed; r.poison=front.poisonT>0; r.bleeding=k3.bleeding>0||front.bleedT>0;
  front.hp=1; T.cast(); r.rush=T.knight().rush; r.rushN=T.knight().rush&&T.knight().rush;
  const far=mk(-2,1); T.onSpecial('knight',{x:h.x,z:h.z,dmg:40}); r.queued=T.knight().queued; const hp0=far.hp; for(let i=0;i<80;i++) d.step(1/60,1); r.cyclone=T.knight().cyclone; r.farHit=far.hp<hp0; r.spent=T.spent(); return r; })()`));
check("BLADE: Wide Sweep III reaches the mob at his side too and draws its arc; the 3rd swing bleeds; a kill starts Fury; Cyclone sets the Whirlwind off a second time",B.front&&B.side&&B.arcs>0&&B.bleed===1&&B.poison&&B.rush&&B.queued===1&&B.cyclone===1&&B.farHit&&B.spent===11,JSON.stringify(B));
const C=await page.evaluate(new Function(`return (async()=>{ ${prep} T.respec(); for(const id of ['kplate','kplate','kplate','kbash','kbash','kbash','kthorns','kstand','kstand','kstand','kaegis']) T.spend(id);
  const g=mk(0,1.5); let x0=0; for(let i=0;i<4;i++){ g.x=h.x; g.z=h.z+1.5; x0=g.z; T.cast(); } const k=T.knight(); const r={ bash:k.bash, held:+(g.holdT||0).toFixed(2), pushed:+(g.z-x0).toFixed(2) };   /* he steps after it each swing (the sword knocks it back) */
  for(const e of d.enemies) if(!e.dead) d.kill(e); const biter=mk(0,1.1); biter.dmg=8; biter.atk=0; const bhp=biter.hp; for(let i=0;i<60*3;i++){ d.step(1/60,1); h.hp=Math.max(h.hp,h.max*.9); } r.thorns=T.knight().thorns; r.bit=biter.hp<bhp;
  biter.dmg=Math.round(h.max*.5); h.hp=h.max*.6; for(let i=0;i<60*2;i++) d.step(1/60,1); const k2=T.knight(); r.aegis=k2.aegis; r.blocked=k2.blocked; r.alive=h.dead<=0; r.hp=+(h.hp/h.max).toFixed(2); return r; })()`));
check("BULWARK: the 4th swing bashes (knocked back, stunned 1.2 s); Thorns bite whoever hits him; Aegis catches the blow that would drop him low and the shell blocks what follows",C.bash===1&&C.held>1&&C.pushed>.3&&C.thorns>0&&C.bit&&C.aegis===1&&C.blocked>0&&C.alive&&C.hp>=.5,JSON.stringify(C));
const D=await page.evaluate(new Function(`return (async()=>{ ${prep} T.respec(); const trap0=d.placeDefAt('trap',-8,-6,0); const cd0=d.stat(trap0,'cd'); const hedge0=d.placeDefAt('spike',0,-14,Math.PI/2);
  for(const id of ['kward','kward','kward','kthorn','kthorn','kthorn','klong','ktrap','ktrap','ktrap','kvigil']) T.spend(id);
  const hedge=d.placeDefAt('spike',0,-8,0); const cd1=d.stat(trap0,'cd'); const tw=d.placeDefAt('harpoon',h.x+3,h.z-2,0); d.setHero(h.x,h.z,0);
  for(let i=0;i<20;i++){ d.setHero(h.x+(i%2?.5:-.5),h.z,0); d.step(1/60,1); } const moving=d.stat(tw,'cd'); for(let i=0;i<80;i++) d.step(1/60,1); const k=T.knight(); const still=d.stat(tw,'cd'); const ring=tw.mdl.userData.wardRing;
  return { short:hedge0&&hedge0.cells.length, long:hedge&&hedge.cells.length, isLong:!!(hedge&&hedge.long), trap:+(cd1/cd0).toFixed(2), vigil:k.vigil, vigilN:k.vigil?1:0, tower:+(still/moving).toFixed(2), ring:!!(ring&&ring.visible) }; })()`));
check("WARDEN: a Long Hedge stands five squares (an ordinary one three); Trapsmith III cuts the trap's reset; Vigil: standing still a second makes towers near him fire 23% quicker; Bannerman's ring is under them",D.short===3&&D.long===5&&D.isLong&&D.trap<.6&&D.vigil&&D.tower===.77&&D.ring,JSON.stringify(D));
const E=await page.evaluate(()=>{ const T=window.__talents; window.__heroes.select('witch'); const w={ tree:T.tree(), kplate:T.rank('kplate') }; window.__heroes.select('knight'); w.back=T.tree(); w.spent=T.spent(); return w; });
check("each hero keeps his own: the Witch sees her tree (no Knight ranks), the Knight's points stay his",E.tree==='witch'&&E.kplate===0&&E.back==='knight'&&E.spent===11,JSON.stringify(E));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
