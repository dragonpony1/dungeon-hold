// ===== RIGHT-CLICK SPECIALS (build 182, parts/staging/73-specials.js): one charged special per hero. Part 1 (single
// page) proves the charge/cooldown/refusal machinery and each hero's own effect against real local enemies/defs,
// the same way towers-test.mjs/aim-test.mjs already check their own mechanics with window.__dd.step() driving the
// sim by hand. Part 2 (two pages, co-op) proves the relay: a GUEST's special reaches the HOST's REAL enemies/defs,
// the same pattern coop-combat-test.mjs already uses for a guest's ordinary swing.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const SP=process.env.SP;
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

// ---------------------------------------------------------------------------------------------------------------
// PART 1: single page, every hero's own mechanics
// ---------------------------------------------------------------------------------------------------------------
const server=await serve(8825);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await browser.newPage({viewport:{width:1100,height:700}});
const errors=[]; page.on("pageerror",e=>errors.push(String(e))); page.on("console",m=>{ if(m.type()==="error") errors.push(m.text().slice(0,200)); });
await page.goto("http://127.0.0.1:8825/?silent&nogate");
await page.waitForFunction(()=>window.__dd&&window.__heroes&&window.__aim&&window.__specials&&window.__dd.heroModel()&&window.__dd.mobModel("goblin"),null,{timeout:120000});
const WANT_KIND={witch:"staff",fighter:"staff",troll:"bow",knight:null};   // aim-test.mjs's own pick() waits on window.__weapons.state()[key] the same real-time way -- the new hero's weapon GLB fetch needs actual wall-clock time, not just simulated step() ticks
const pick=async(id,re)=>{ await page.evaluate(i=>window.__heroes.select(i),id); await page.waitForFunction(r=>new RegExp(r).test(window.__dd.heroModel().label),re,{timeout:90000});
  const want=WANT_KIND[id];
  for(let i=0;i<240;i++){ const k=await page.evaluate(()=>{ window.__dd.step(1/60,1); return window.__aim&&window.__aim.kind(); }); if(k===want) break; await new Promise(r=>setTimeout(r,25)); } };
const clear=()=>page.evaluate(()=>{ const d=window.__dd; for(const x of d.defs.slice()){ d.setHero(x.x,x.z+1,0); d.sell(); } for(const e of d.enemies) d.kill(e); window.__specials.forceReady(); });   // forceReady: SP.cd is per-PLAYER, not per-hero (by design -- see 73-specials.js) -- this suite tests several heroes in turn on one page, which a real player switching mid-cooldown never does

// ---- 1) the Gnome Knight: WHIRLWIND CLEAVE -- 3x heroDmg(), radius ~4, outward knockback; half speed while charging ----
await pick("knight","Knight"); await clear();
const r1=await page.evaluate(async()=>{
  const d=window.__dd; window.__meta.reset(); d.resetGear(); d.start(); d.setHero(0,10,0); d.step(1/60,10);   // (0,10): the same open floor aim-test.mjs's own hero spot uses
  const near=d.spawn("goblin","N"); near.x=1.5; near.z=11.5; near.hp=near.max=500; near.spd=0;
  const far=d.spawn("goblin","N"); far.x=10; far.z=20; far.hp=far.max=500; far.spd=0;
  const nearD0=Math.hypot(near.x-d.hero.x,near.z-d.hero.z);
  const dmg=d.heroDmg();
  window.__specials.press(); const startedRight=window.__specials.charging();
  d.setKeys({w:1}); for(let i=0;i<20;i++) d.step(1/60,1); const slowWhileCharging=d.hero.specialSlow; d.setKeys({w:0});
  let ticks=0; while(window.__specials.charging()&&ticks<100){ d.step(1/60,1); ticks++; }
  const firedByItself=!window.__specials.charging()&&ticks<100;
  d.step(1/60,3);
  const cdAfter=window.__specials.cooldown();
  window.__specials.press(); const deniedOnCooldown=!window.__specials.charging();
  d.step(1/60,10); const cdLater=window.__specials.cooldown();
  return {startedRight,slowWhileCharging,firedByItself,ticks,dmg,nearHp0:500,nearHp:near.hp,farHp:far.hp,nearD0,nearD1:Math.hypot(near.x-d.hero.x,near.z-d.hero.z),cdAfter,deniedOnCooldown,cdLater};
});
check("Knight: charging starts, hero moves at half speed while charging, the special fires by itself once fully charged",r1.startedRight&&r1.slowWhileCharging===.5&&r1.firedByItself,JSON.stringify(r1));
check("Knight: Whirlwind Cleave hits the near goblin for about 3x heroDmg() with outward knockback, leaves the far one (10 units off) untouched",Math.abs((r1.nearHp0-r1.nearHp)-r1.dmg*3)<r1.dmg*.3&&r1.nearD1>r1.nearD0&&r1.farHp===500,JSON.stringify(r1));
check("Knight: a 10s cooldown starts on cast and a press during it is refused without resetting the timer",r1.cdAfter>8&&r1.cdAfter<=10&&r1.deniedOnCooldown&&r1.cdLater<r1.cdAfter,JSON.stringify(r1));

// ---- 2) the Gnome Battle Witch: STARFALL -- an aimed spot (up to 12 units), radius 5, 3x heroDmg(), slows ----
await pick("witch","Witch"); await clear();
const r2=await page.evaluate(async()=>{
  const d=window.__dd; d.setHero(0,10,0); d.setCam(0,.42,8); d.step(1/60,10);   // (0,10) facing +Z, same as aim-test.mjs's own witch setup
  const target=d.spawn("goblin","N"); target.x=0; target.z=18; target.hp=target.max=500; target.spd=0;   // dead ahead, 8 units out -- the reticle's own lock
  const caught=d.spawn("goblin","N"); caught.x=3; caught.z=19; caught.hp=caught.max=500; caught.spd=0;   // off-axis but inside a 5-unit blast around (0,18)
  const clear2=d.spawn("goblin","N"); clear2.x=0; clear2.z=30; clear2.hp=clear2.max=500; clear2.spd=0;  // far down the same line, well outside both aim range and blast radius
  d.step(1/60,2);
  const dmg=d.heroDmg();
  window.__specials.press(); let ticks=0; while(window.__specials.charging()&&ticks<100){ d.step(1/60,1); ticks++; }
  d.step(1/60,3);
  return {dmg,targetHp:target.hp,caughtHp:caught.hp,clearHp:clear2.hp,targetSlow:target.slowT>0,caughtSlow:caught.slowT>0,clearSlow:clear2.slowT>0,ticks};
});
check("Witch: Starfall lands on the aimed goblin and the one 3 units beside it for about 3x heroDmg(), both slowed; the one 12 units further down the same line is untouched",
  Math.abs((500-r2.targetHp)-r2.dmg*3)<r2.dmg*.3&&r2.targetSlow&&Math.abs((500-r2.caughtHp)-r2.dmg*3)<r2.dmg*.3&&r2.caughtSlow&&r2.clearHp===500&&!r2.clearSlow,JSON.stringify(r2));

// ---- 3) the Gnome Fighter: HALO SURGE -- a rolling ring (2x heroDmg()) plus a hall-wide double-strength pulse on
// every halo tower for a few seconds, checked directly through stat() the way updateDefs itself reads a tower's dmg ----
await pick("fighter","Fighter"); await clear();
const r3=await page.evaluate(async()=>{
  const d=window.__dd; d.setHero(0,10,0); d.setCam(0,.42,8); d.addMana(9000); d.step(1/60,10);
  const near=d.spawn("goblin","N"); near.x=0; near.z=16; near.hp=near.max=500; near.spd=0;   // inside the ring's 8-unit reach
  const zap=d.place("zap",16,15,0);   // cell (16,15) = world (0,-4), the exact spot towers-test.mjs's own r1 already proves buildable -- 14 units from the hero here, well outside the ring, so any dmg change on it can only be the hall-wide buff, not the ring's own hit
  const dmgBefore=d.stat(zap,"dmg");
  const dmg=d.heroDmg();
  window.__specials.press(); let ticks=0; while(window.__specials.charging()&&ticks<100){ d.step(1/60,1); ticks++; }
  for(let i=0;i<40;i++) d.step(1/60,1);   // let the .6s rolling ring finish reaching the near goblin
  const dmgDuring=d.stat(zap,"dmg");
  const nearHpAfterRing=near.hp;
  d.step(1/60,420);   // 7s, past the 6s surge window
  const dmgAfter=d.stat(zap,"dmg");
  return {dmg,nearHpAfterRing,dmgBefore,dmgDuring,dmgAfter};
});
check("Fighter: the rolling ring hits a nearby goblin for about 2x heroDmg()",Math.abs((500-r3.nearHpAfterRing)-r3.dmg*2)<r3.dmg*.3,JSON.stringify(r3));
check("Fighter: Halo Surge doubles a halo tower's stat('dmg') hall-wide (even one far outside the ring itself) for a few seconds, then it returns to normal",
  r3.dmgDuring>r3.dmgBefore*1.9&&r3.dmgDuring<r3.dmgBefore*2.1&&r3.dmgAfter===r3.dmgBefore,JSON.stringify(r3));

// ---- 4) the Troll Archer: VOLLEY -- an aimed spot (up to 16 units), 3x heroDmg() split over ~1s, not all at once ----
await pick("troll","Ranger"); await clear();
const r4=await page.evaluate(async()=>{
  const d=window.__dd; d.setHero(0,10,0); d.setCam(0,.42,8); d.step(1/60,10);
  const target=d.spawn("goblin","N"); target.x=0; target.z=20; target.hp=target.max=9999; target.spd=0;
  d.step(1/60,2); const dmg=d.heroDmg();
  window.__specials.press(); let ticks=0; while(window.__specials.charging()&&ticks<100){ d.step(1/60,1); ticks++; }
  d.step(1/60,12);   // .2s -- the very start of the rain, at most the first wave or two
  const soon=9999-target.hp;
  d.step(1/60,75);   // past the 1s window entirely
  const total=9999-target.hp;
  return {dmg,soon,total};
});
check("Troll: Volley delivers its arrows in waves over about a second, not as one instant hit (some damage very early, the rest arrives after); build 314 (Matt: triple the raining arrows): 15 arrows, each a fifth of 3x heroDmg(), so 9x in all",
  r4.soon>0&&r4.soon<r4.total*.85&&Math.abs(r4.total-r4.dmg*9)<r4.dmg*.6,JSON.stringify(r4));

// ---- 5) refusals: dead, a menu open, the wrong phase -- each on its own hero/state, each checked as "never even started charging" ----
const r5=await page.evaluate(async()=>{
  const d=window.__dd; const out={};
  d.hero.dead=1; window.__specials.press(); out.dead=window.__specials.charging(); d.hero.dead=0;
  const origOpen=window.__meta.isOpen; window.__meta.isOpen=()=>true; window.__specials.press(); out.menu=window.__specials.charging(); window.__meta.isOpen=origOpen;
  const ph0=d.S.phase; d.S.phase="dead"; window.__specials.press(); out.wrongPhase=window.__specials.charging(); d.S.phase=ph0;
  return out;
});
check("refused while dead, with a menu open, or with S.phase wrong -- never actually starts charging",!r5.dead&&!r5.menu&&!r5.wrongPhase,JSON.stringify(r5));

const realErrors1=errors.filter(e=>!/Failed to load resource|favicon|pointer ?lock/i.test(e));
check("part 1: no page errors",realErrors1.length===0,realErrors1.slice(0,5).join(" | "));
await browser.close(); server.close();

// ---------------------------------------------------------------------------------------------------------------
// PART 2: co-op relay -- a guest's special lands on the host's REAL enemies/defs
// ---------------------------------------------------------------------------------------------------------------
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP specials-test.mjs part 2 (co-op) — the `peer` package isn't installed (npm i peer)."); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.some(r=>!r)?1:0); }

const sigPort=9725;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on("connection",()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server2=await serve(8825);
const browser2=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser2.newContext(), guestCtx=await browser2.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors2=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors2.push(String(e)));
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8825/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat&&window.__specials,null,{timeout:60000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,10); });   // __freeze: real setTimeout sleeps below must not also let game.js's own rAF loop advance sim time with real wall-clock deltas

async function tickBoth(batches,size){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); } }

const roomCode="coopsp-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
const guestId=guestJoin.id;
await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0));   // clear of the guest's own spawn (see coop-combat-test.mjs's own comment on this exact move)
await guestPage.evaluate(()=>window.__dd.setCam(0,.42,8));
await tickBoth(6,5);
const spawnState=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);

// (a) the guest's Knight cleave lands on the host's real enemy
await guestPage.evaluate(()=>window.__heroes.select("knight"));
await tickBoth(3,5);
const spawned=await hostPage.evaluate(gx=>{ const e=window.__dd.spawn("goblin","N"); e.x=gx; e.z=6.3; e.y=0; e.hp=e.max=500; e.atk=999; e.__coopId="cleaveTarget"; return {hp:e.hp}; },spawnState.x);
await guestPage.evaluate(()=>{ window.__specials.press(); });
await tickBoth(10,10);   // real time for the 1.2s charge to complete client-side and the 'specialCast' message to cross the data channel
const afterCleave=await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__coopId==="cleaveTarget"); return e?{hp:e.hp,dead:e.dead}:{gone:true}; });
check("a guest's Whirlwind Cleave (right-click special) damages a REAL enemy on the host",afterCleave.gone||afterCleave.hp<spawned.hp,JSON.stringify({spawned,afterCleave}));

// (b) the guest's Fighter Halo Surge doubles a REAL halo tower's stat('dmg') on the host, hall-wide
const zapInfo=await hostPage.evaluate(()=>{ const t=window.__dd.place("zap",16,15,0); window.__zapRef=t; return {dmg:window.__dd.stat(t,"dmg")}; });
await guestPage.evaluate(()=>{ window.__specials.forceReady(); window.__heroes.select("fighter"); });   // forceReady: the guest is still on its 10s cooldown from the Cleave cast in (a) above -- a real player switching hero mid-cooldown keeps counting down (by design), but this test wants Fighter's OWN cast, not a leftover refusal
for(let i=0;i<30;i++){ const k=await guestPage.evaluate(()=>window.__aim&&window.__aim.kind()); if(k==="staff") break; await guestPage.evaluate(()=>window.__dd.step(1/60,1)); }
await guestPage.evaluate(()=>{ window.__specials.press(); });
await tickBoth(10,10);
const zapDuring=await hostPage.evaluate(()=>window.__dd.stat(window.__zapRef,"dmg"));
check("a guest's Halo Surge doubles a REAL halo tower's stat('dmg') on the host -- the shared hall's own defenses, buffed for everyone",
  zapDuring>zapInfo.dmg*1.9&&zapDuring<zapInfo.dmg*2.1,JSON.stringify({zapInfo,zapDuring}));

const realErrors2=errors2.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("part 2: no page errors",realErrors2.length===0,realErrors2.slice(0,5).join(" | "));

await browser2.close(); server2.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
