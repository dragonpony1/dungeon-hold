import { chromium } from "playwright"; import { serve } from "./serve.mjs";
// build 228: PITFALL, the Witch's trap-and-kill tower. Ground mobs over it are HELD and SINK into the floor for ~2.6 s (spike ticks), then the walls slam: small mobs die outright,
// an ogre is badly hurt and heaves back out, a boss is never held or sunk (crush damage only), fliers are ignored, and it resets on a cooldown
const server=await serve(8878);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext(); const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8878/?silent&nogate&map=1"); await page.waitForFunction(()=>window.__dd&&window.__pit&&window.__heroes,null,{timeout:60000});
await page.evaluate(()=>{ const d=window.__dd; d.start(); d.step(1/60,20); window.__heroes.select("witch"); d.step(1/60,20); d.S.mana=9999; });
// the tower exists for the Witch: a hotbar slot and a definition
const meta=await page.evaluate(()=>({def:!!window.__dd.DEFS&&!!window.__dd.DEFS.pit||!!window.__pit.cfg,slot:!!document.getElementById("slot-pit"),unlocks:window.__heroes.unlocks(),can:window.__heroes.canUse("pit"),cfg:window.__pit.cfg}));
check("Pitfall is one of the Witch's towers (hotbar slot, unlocked for her, not for the others)",meta.slot&&meta.unlocks.includes("pit")&&meta.can,JSON.stringify({slot:meta.slot,unlocks:meta.unlocks}));
const cageSlot=await page.evaluate(()=>{ const el=document.getElementById("slot-slice"); return !el||el.style.display==="none"; });
check("the Mycelium Cage is gone: the Witch has exactly Frost Spire, Turnip Trebuchet and Pitfall (Pitfall on key 3) and the Cage's hotbar slot is hidden",JSON.stringify(meta.unlocks)===JSON.stringify(["frost","ball","pit"])&&cageSlot,JSON.stringify({unlocks:meta.unlocks,cageSlotHidden:cageSlot}));
const place=await page.evaluate(()=>{ const d=window.__dd; d.S.phase="build"; const before=d.defs.length; d.placeDefAt("pit",0,12,0); const t=d.defs.find(x=>x.kind==="pit"); return {placed:d.defs.length-before,ok:!!t,lvl:t&&t.lvl,x:t&&t.x,z:t&&t.z}; });
check("it can be placed like any tower",place.placed===1&&place.ok,JSON.stringify(place));
const run=await page.evaluate(async()=>{ const d=window.__dd, P=window.__pit; const t=d.defs.find(x=>x.kind==="pit"); d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; d.S.phase="wave"; d.setHero(0,5,0); d.step(1/60,10);
  const mk=(kind,x,z)=>{ const e=d.spawn(kind==="cyclops"?"ogre":kind,"N"); e.kind=kind; e.x=x; e.z=z; e.y=0; e.hp=e.max=(kind==="ogre"?200:kind==="cyclops"?9999:10); e.dmg=0; e.atk=999; e.spd=0; return e; };
  const gob=[[-.8,12],[.8,12],[0,11.2]].map(([x,z])=>mk("goblin",x,z)), ogre=mk("ogre",0,12.9), boss=mk("cyclops",1.3,12.6), far=mk("goblin",9,14); d.step(1/60,5);
  const out={ogreHp0:ogre.hp,bossHp0:boss.hp}; let openAt=-1, maxSink=0, ogreSink=0, heldAll=false, bossHeld=false, bossSink=0; const samples=[];
  for(let f=0;f<60*8;f++){ d.step(1/60,1); const st=P.state(t); if(openAt<0&&st&&st.phase==="open") openAt=f; if(st&&st.phase==="open"){ maxSink=Math.max(maxSink,gob[0].sink||0); ogreSink=Math.max(ogreSink,ogre.sink||0); heldAll=heldAll||gob.every(g=>g.holdT>0); bossHeld=bossHeld||boss.holdT>0; bossSink=Math.max(bossSink,boss.sink||0); } if(f%30===0) samples.push(st&&st.phase); if(st&&st.phase==="rest"&&openAt>0&&f>openAt+60) break; }
  for(let f=0;f<150;f++) d.step(1/60,1);   // the ogre needs a moment to climb back out
  const st=P.state(t); return Object.assign(out,{gobH:gob[0].h,ogreH:ogre.h,openAt,maxSink:+maxSink.toFixed(2),ogreSink:+ogreSink.toFixed(2),heldAll,bossHeld,bossSink,goblinsDead:gob.filter(g=>g.dead).length,farAlive:!far.dead,farSink:far.sink||0,ogreLost:+(out.ogreHp0-ogre.hp).toFixed(1),ogreDead:!!ogre.dead,ogreSinkAfter:+(ogre.sink||0).toFixed(2),bossLost:+(out.bossHp0-boss.hp).toFixed(1),end:st,goblinLift:gob.map(g=>+(g.lift||0).toFixed(2)),samples:[...new Set(samples)]}); });
check("mobs over it are held and sink into the floor (a goblin sinks past its own height), the ogre only to the waist, the boss neither held nor sunk",run.openAt>0&&run.heldAll&&run.maxSink>=1&&Math.abs(run.ogreSink/run.ogreH-.5)<.08&&!run.bossHeld&&run.bossSink===0,JSON.stringify({openAt:run.openAt,gobSink:run.maxSink,gobH:run.gobH,ogreSink:run.ogreSink,ogreH:run.ogreH,heldAll:run.heldAll,bossHeld:run.bossHeld,bossSink:run.bossSink}));
check("then the crush: all three goblins swallowed (dead), the ogre badly hurt but alive, the boss takes damage; the loner outside the pit is untouched",run.goblinsDead===3&&!run.ogreDead&&run.ogreLost>=70&&run.bossLost>0&&run.farAlive&&run.farSink===0,JSON.stringify({dead:run.goblinsDead,ogreLost:run.ogreLost,ogreDead:run.ogreDead,bossLost:run.bossLost,far:run.farAlive}));
check("the ogre climbs back out (its sink returns to 0) and the pit goes back to rest on a cooldown",run.ogreSinkAfter===0&&run.end&&run.end.phase==="rest"&&run.end.cool>0,JSON.stringify({ogreSinkAfter:run.ogreSinkAfter,end:run.end}));
// a flier over the pit is ignored, and an empty pit stays shut
const fl=await page.evaluate(async()=>{ const d=window.__dd, P=window.__pit; const t=d.defs.find(x=>x.kind==="pit"); d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; t.pit.cool=0; t.pit.phase="rest"; const e=d.spawn("drake","N"); e.x=0; e.z=12; e.y=2; e.spd=0; e.hp=e.max=999; e.dmg=0; e.atk=999; for(let f=0;f<120;f++) d.step(1/60,1); const a=P.state(t).phase; d.enemies.slice().forEach(x=>{ x.dead=1; }); d.enemies.length=0; for(let f=0;f<120;f++) d.step(1/60,1); return {withFlier:a,empty:P.state(t).phase,flierHeld:e.holdT>0,flierSink:e.sink||0}; });
check("a flier over the pit is ignored, and an empty pit stays shut",fl.withFlier==="rest"&&fl.empty==="rest"&&!fl.flierHeld&&fl.flierSink===0,JSON.stringify(fl));
// a pit sold/destroyed mid-hold lets the mobs back up (the sink is a look only, never stuck)
const sold=await page.evaluate(async()=>{ const d=window.__dd, P=window.__pit; const t=d.defs.find(x=>x.kind==="pit"); d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; t.pit.cool=0; t.pit.phase="rest"; const e=d.spawn("goblin","N"); e.x=0; e.z=12; e.y=0; e.hp=e.max=9999; e.spd=0; e.dmg=0; e.atk=999;
  for(let f=0;f<80&&P.state(t).phase!=="open";f++) d.step(1/60,1); for(let f=0;f<60;f++) d.step(1/60,1); const mid=e.sink||0; d.defs.splice(d.defs.indexOf(t),1); for(let f=0;f<120;f++) d.step(1/60,1); return {mid:+mid.toFixed(2),after:+(e.sink||0).toFixed(2),lift:e.lift||0}; });
check("a pit taken away mid-hold lets the mob rise again (it is never stuck under the floor)",sold.mid>0&&sold.after===0&&sold.lift===0,JSON.stringify(sold));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
