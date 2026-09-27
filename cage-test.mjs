// The Mycelium Cage (build 148): the old mushroom ring's slot, the player's four cage models, and the Arcane Spore
// Implosion -- rest, a random charge while victims stand inside, the snap-shut implosion (burst damage, a lift, a
// violet-cyan flash), a lingering toxic cloud that poisons. No screen shake. Empty, it never fires.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const SP=process.env.SP||process.cwd(); const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8899; const server=await serve(PORT);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const page=await browser.newPage({viewport:{width:960,height:600}});
const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:"+PORT+"/?silent&nogate",{timeout:240000}); await page.waitForFunction(()=>window.__dd&&window.__defglb,null,{timeout:180000});
await page.evaluate(()=>{ const d=window.__dd; d.start(); d.step(1/60,30); });
const glb=await page.waitForFunction(()=>{ const l=window.__defglb.list(); return l.slice&&l.slice[0]?l.slice[0]:null; },null,{timeout:120000,polling:200}).then(h=>h.jsonValue()).catch(()=>null);
check("the cage's Mark I model (cage-1.glb) loads into the ring's slot",!!glb&&glb.scale>0,JSON.stringify(glb));
check("it is the Mycelium Cage on the hotbar now",await page.evaluate(()=>window.__dd.DEFS.slice.name)==="Mycelium Cage");
// a cage on the lane, two goblins held inside it: the show, in order
const r1=await page.evaluate(()=>{ const d=window.__dd; for(const x of d.defs.slice()){ d.setHero(x.x,x.z+1,0); d.sell(); } for(const e of d.enemies) d.kill(e); d.step(1/60,60); d.setHero(6,10,Math.PI);
  const probe=d.spawn("goblin","N"); d.step(1/60,120); const px=probe.x, pz=probe.z; d.kill(probe); d.step(1/60,80);
  const ring=d.place("slice",Math.floor((px+33)/2),Math.floor((pz+35)/2)+3,0); d.step(1/60,30);
  const box=window.THREE?new THREE.Box3().setFromObject(ring.mdl.userData.cage||ring.mdl).getSize(new THREE.Vector3()):null;
  const model={glb:!!ring.mdl.userData.glb,cage:!!ring.mdl.userData.cage,hub:ring.mdl.userData.hub?ring.mdl.userData.hub.children.length:0,flash:!!ring.mdl.userData.flash,cloud:!!ring.mdl.userData.cloud,w:box?+Math.max(box.x,box.z).toFixed(2):null,h:box?+box.y.toFixed(2):null};
  const gs=[d.spawn("goblin","N"),d.spawn("goblin","N")]; gs.forEach((g,i)=>{ g.hp=g.max=9999; g.spd=0; g.x=ring.x+(i?.6:-.6); g.z=ring.z+.2; });
  const log=[]; let phase=null, minScale=9, maxFlash=0, cloudSeen=false, liftMax=0, hpAtBoom=null, burst=null, poison=null, booms=0, chargeAt=null, boomAt=[], sawCharge=false;
  for(let i=0;i<900;i++){ d.step(1/60,1); const fx=ring.fx||{}; if(fx.phase!==phase){ log.push(fx.phase+"@"+i); phase=fx.phase; if(phase==="charge"){ sawCharge=true; chargeAt=i; hpAtBoom=gs[0].hp; } if(phase==="boom"){ boomAt.push(i); booms++; burst=hpAtBoom-gs[0].hp; poison=gs[0].poisonT; } }
    const cg=ring.mdl.userData.cage; if(cg&&fx.phase==="boom") minScale=Math.min(minScale,cg.scale.x); const fl=ring.mdl.userData.flash; if(fl) maxFlash=Math.max(maxFlash,fl.material.opacity); const cl=ring.mdl.userData.cloud; if(cl&&cl.visible) cloudSeen=true; liftMax=Math.max(liftMax,gs[0].lift||0);
    if(booms>=3) break; }
  const intervals=boomAt.slice(1).map((b,i)=>b-boomAt[i]); const dmg=d.stat(ring,"dmg"), burstExp=dmg*d.DEFS.slice.burst;
  const out={model,log:log.slice(0,12),sawCharge,booms,burst,burstExp,poison,liftMax:+liftMax.toFixed(2),minScale:+minScale.toFixed(2),maxFlash:+maxFlash.toFixed(2),cloudSeen,intervals,ringHp:+ring.hp.toFixed(1),ringMax:ring.max,totalDmg:9999-gs[0].hp,slowed:gs[0].slowT>0};
  window.__cageRing=ring; window.__cageGs=gs; return out; });
check("the cage model: a GLB with an inner 'cage' group, spores, a flash and a cloud, about 3.8 wide and under 3.2 tall",r1.model.glb&&r1.model.cage&&r1.model.hub>=7&&r1.model.flash&&r1.model.cloud&&r1.model.w>3.3&&r1.model.w<4.3&&r1.model.h<3.3,JSON.stringify(r1.model));
check("with goblins inside it charges, then implodes (rest -> charge -> boom), three times in 15 s",r1.sawCharge&&r1.booms>=3&&/^rest@|^charge@/.test(r1.log[0]||"")&&r1.log.some(x=>/^boom@/.test(x)),JSON.stringify({log:r1.log,booms:r1.booms}));
check("the implosion hits for burst x dmg at once, poisons for the cloud's length, and lifts the victims",r1.burst>=r1.burstExp-.01&&r1.poison>2.5&&r1.liftMax>=.4,JSON.stringify({burst:r1.burst,exp:r1.burstExp,poison:r1.poison,lift:r1.liftMax}));
check("the roots snap shut (inner scale dips under .9), the flash blooms (opacity over .8), the cloud shows",r1.minScale<.9&&r1.maxFlash>.8&&r1.cloudSeen,JSON.stringify({minScale:r1.minScale,maxFlash:r1.maxFlash,cloud:r1.cloudSeen}));
check("the interval is random: the boom-to-boom gaps differ, all within charge 1.3-2.9 s plus the .45 s boom",r1.intervals.length>=2&&new Set(r1.intervals).size>1&&r1.intervals.every(f=>f>=(1.3+.45)*60-2&&f<=(2.9+.45)*60+2),JSON.stringify(r1.intervals));
check("the cage wears a little with each implosion (trampled), the goblins stay slowed, the DOT keeps adding up",r1.ringHp<r1.ringMax&&r1.slowed&&r1.totalDmg>r1.burstExp*3,JSON.stringify({hp:[r1.ringHp,r1.ringMax],slowed:r1.slowed,total:r1.totalDmg}));
// the screenshots: the camera in the lane looking at the cage (the hero stands inside it, hidden by the roots), the loop
// frozen (window.__freeze, as other suites do) so the boom is caught mid-flash and not half a second later
await page.evaluate(()=>{ const d=window.__dd; const ring=window.__cageRing; window.__freeze=true; d.setHero(ring.x,ring.z+.9,0); d.setCam(0,.55,9); for(let i=0;i<1200;i++){ d.step(1/60,1); if(ring.fx.phase==="boom"&&ring.fx.t>.1) break; } });
await page.waitForTimeout(250); await page.screenshot({path:SP+"/parts/shots/cage-implosion.png"});
await page.evaluate(()=>{ const d=window.__dd; const ring=window.__cageRing; for(let i=0;i<1200;i++){ d.step(1/60,1); if(ring.fx.phase==="charge"&&ring.fx.k>.8) break; } });
await page.waitForTimeout(250); await page.screenshot({path:SP+"/parts/shots/cage-charge.png"});
await page.evaluate(()=>{ const d=window.__dd; const ring=window.__cageRing; for(let i=0;i<1200;i++){ d.step(1/60,1); if(ring.fx.phase==="rest"&&ring.fx.cloud>1.5) break; } });
await page.waitForTimeout(250); await page.screenshot({path:SP+"/parts/shots/cage-cloud.png"}); await page.evaluate(()=>{ window.__freeze=false; });
// empty, it never fires: kill the goblins, watch five seconds
const r2=await page.evaluate(()=>{ const d=window.__dd; const ring=window.__cageRing; for(const g of window.__cageGs) d.kill(g); d.step(1/60,80); const b0=ring.fx.booms, hp0=ring.hp; const phases=new Set(); for(let i=0;i<300;i++){ d.step(1/60,1); phases.add(ring.fx.phase); } return {booms:[b0,ring.fx.booms],hp:[+hp0.toFixed(1),+ring.hp.toFixed(1)],phases:[...phases]}; });
check("empty, the cage rests (no charge, no boom, no wear) -- only its idle flex",r2.booms[0]===r2.booms[1]&&r2.hp[0]===r2.hp[1]&&r2.phases.length===1&&r2.phases[0]==="rest",JSON.stringify(r2));
// a walker through the cage: still slowed, still hurt (the old ring's promise), and it can path through
const r3=await page.evaluate(()=>{ const d=window.__dd; const ring=window.__cageRing; d.setHero(6,10,Math.PI); d.step(1/60,5); const g=d.spawn("goblin","N"); g.hp=g.max=9999; let inside=0, slowed=0; for(let i=0;i<900;i++){ d.step(1/60,1); if(Math.hypot(g.x-ring.x,g.z-ring.z)<2.6){ inside++; if(g.slowT>0) slowed++; } if(Math.hypot(g.x,g.z)<4) break; } const out={inside,slowed,dmg:9999-g.hp,reached:Math.hypot(g.x,g.z)<4,booms:ring.fx.booms}; d.kill(g); return out; });
check("a goblin walking the lane crosses the cage slowed, takes an implosion or its cloud on the way, and still reaches the crystal",r3.inside>10&&r3.slowed>r3.inside*.7&&r3.dmg>0&&r3.reached,JSON.stringify(r3));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
