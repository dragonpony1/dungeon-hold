// ===== CO-OP (phase 8): a guest's own SIMULATED HERO now carries their real gear/skills too, not just what they
// place (phase 7). guestInputTick's move speed, guestHero's gear-scaled max hp (delta-preserving on increase, same
// pattern as applyGear()) and passive regen, hurtGuestHero's def-based mitigation, and a swing's damage+reach (read
// straight off the guest's own heroDmg()/hero.reach at the moment they swing, generalised into a wide/long cone for
// a ranged hero instead of the flat melee-only baseline) all now mirror the exact formulas game.js's real hero uses
// -- 99-network.js.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-herostats-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const near=(a,b,eps)=>Math.abs(a-b)<=eps;

const sigPort=9463;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8887);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));

for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8887/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat,null,{timeout:60000}); }
// __freeze stops game.js's own requestAnimationFrame loop (frame(), game.js) from ALSO calling update(dt) with real
// wall-clock time on top of this test's explicit step() calls -- without it, the real 20ms sleeps between tickBoth's
// batches let a stray rAF tick or two sneak in, which is exactly what was inflating Test A's speed-ratio measurement
// on some runs (an extra, unaccounted-for tick or three of real movement during those sleeps)
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__freeze=true; });
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,30); });

async function tickBoth(batches=6,size=5){
  for(let b=0;b<batches;b++){
    for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); }
    await new Promise(r=>setTimeout(r,20));
  }
}
async function tickHostOnly(n){ for(let i=0;i<n;i++) await hostPage.evaluate(()=>window.__dd.step(1/60,1)); }

const roomCode="coops-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
const guestId=guestJoin.id;

await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0));   // keep the host's own hero well clear of nearestHero/enemy checks meant for the guest
await guestPage.evaluate(()=>window.__dd.setCam(0,.42,8));
await tickBoth(6,5);   // let the guest's first 'input' (with stat/mult) reach the host and register guestHero at its default spawn

const spawnState=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
check("guest registers at its default spawn with the flat baseline hp",spawnState&&spawnState.x===0&&spawnState.z===6&&spawnState.hp===100&&spawnState.max===100,JSON.stringify(spawnState));

await guestPage.waitForTimeout(4300);   // let 65-tavernroom.js's one-shot new-player toast burn off before any toast-adjacent state matters later

// ---- A: move speed scales with heroStat('move')/heroMult('move'), same formula heroUpdate() (game.js) uses ----
// measures the MEDIAN of several single-tick speed samples (units/sec, extrapolated from one 1/60s step) rather
// than either extreme tried first: a full ~1s window (60 ticks) occasionally carried the guest far enough in one
// direction to clip a wall partway through -- moveCircle() drops a blocked tick's movement outright rather than
// sliding, which quietly pulled a whole-window distance ratio down from the real, per-tick value; a single tick
// swung the other way, where window.__combat.guestHero()'s own .toFixed(2) rounding (two independently-rounded
// endpoints against a true delta of ~0.1-0.25 units) was comparably sized to the signal itself. A 20-tick window
// (~1/3s, ~2.5-5 units true distance) is short enough to stay clear of geometry from a fresh, already-open
// position, and long enough that the same +/-0.02 rounding noise is a rounding error, not the measurement.
async function measureSpeed(key){
  const ref=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
  await guestPage.evaluate(k=>window.__dd.setKeys({[k]:1}),key);
  let start=null;
  for(let tries=0;tries<10&&!start;tries++){
    await tickBoth(1,5);
    const cur=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
    if(Math.hypot(cur.x-ref.x,cur.z-ref.z)>.02) start=cur;
  }
  await tickBoth(4,5);   // 20 ticks
  const end=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
  await guestPage.evaluate(k=>window.__dd.setKeys({[k]:0}),key);
  await tickBoth(2,5);
  return {moving:!!start,speed:start?Math.hypot(end.x-start.x,end.z-start.z)*3:null,start,end};   // units/sec: distance over 20 ticks (1/3s) * 3
}

const spd0=await measureSpeed('w');
check("baseline walk actually started and moves at a sane speed (sanity, not the real assertion)",
  spd0.moving&&spd0.speed>6&&spd0.speed<9,JSON.stringify(spd0));

await guestPage.evaluate(()=>{ window.__dd.gear().charm={stats:{move:100}}; });   // +100 move -> mul doubles: (1+100/100)=2
await tickBoth(6,5);   // let the buffed stat/mult reach the host's guestStats

const spd1=await measureSpeed('s');   // opposite direction from the baseline sample, so the two tiny samples don't compound toward the same spot
check("a +100 move stat exactly doubles the guest's own simulated walk speed",
  spd1.moving&&near(spd1.speed/spd0.speed,2,.03),JSON.stringify({spd0:spd0.speed,spd1:spd1.speed,ratio:spd1.speed/spd0.speed}));

// ---- D: a swing's damage and reach ride the message itself, read off the guest's own heroDmg()/hero.reach ----
await guestPage.evaluate(()=>{ window.__dd.gear().weapon={stats:{dmg:50}}; });   // a real, gear-scaled damage number to prove the relay isn't the flat GUEST_DMG=8 baseline
const expectedDmg=await guestPage.evaluate(()=>Math.round(window.__dd.heroDmg()*10)/10);
check("guest's own heroDmg() reflects the +50 dmg weapon (sanity: not the flat 8 baseline)",expectedDmg>20,"heroDmg="+expectedDmg);

const posBeforeD=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
await guestPage.evaluate(()=>window.__dd.setCam(0,.42,8));   // cam.yaw=0 -> the swing message's yaw points straight down +Z from the guest's own tracked position
await hostPage.evaluate(pos=>{ const e=window.__dd.spawn('goblin','N'); e.x=pos.x; e.z=pos.z+10; e.y=0; e.hp=9999; e.max=9999; e.dmg=0; e.atk=999; e.__coopId='farTarget'; },posBeforeD);   // this is a target for the guest's OUTGOING damage only -- e.atk=999 keeps its own attack cooldown from ever reaching 0, so it can't land so much as the guaranteed Math.max(1,...) minimum hit on the guest (same floor hurtHero() itself has) once repositioned into melee range below; dmg:0 is redundant belt-and-braces
const farHpBefore=await hostPage.evaluate(()=>window.__dd.enemies.find(e=>e.__coopId==='farTarget').hp);
await guestPage.evaluate(()=>window.__dd.swing());   // default hero is the witch (ranged, reach 18) -- 70-hero2.js's own default pick
await tickBoth(6,5);
const farHpAfterWitch=await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__coopId==='farTarget'); return e?e.hp:null; });
check("a ranged hero (witch, reach 18) hits a target 10 units away, for their own real gear-scaled damage",
  farHpAfterWitch!==null&&near(farHpBefore-farHpAfterWitch,expectedDmg,.15),
  JSON.stringify({farHpBefore,farHpAfterWitch,expectedDmg,delta:farHpAfterWitch!==null?farHpBefore-farHpAfterWitch:null}));

await guestPage.evaluate(()=>window.__heroes.select('knight'));   // installHero() sets hero.reach synchronously (game.js GLB load is async, reach isn't)
const knightReach=await guestPage.evaluate(()=>window.__dd.hero.reach);
check("switching to the knight sets a real melee reach, not the flat GUEST_REACH=2.4 fallback by coincidence",knightReach===2.4,"reach="+knightReach);
const farHpBeforeKnight=await hostPage.evaluate(()=>window.__dd.enemies.find(e=>e.__coopId==='farTarget').hp);
await guestPage.evaluate(()=>window.__dd.swing());
await tickBoth(6,5);
const farHpAfterKnight=await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__coopId==='farTarget'); return e?e.hp:null; });
check("the same 10-unit-away target is NOT hit once the guest is a melee hero (reach 2.4)",
  farHpAfterKnight===farHpBeforeKnight,JSON.stringify({farHpBeforeKnight,farHpAfterKnight}));

await hostPage.evaluate(pos=>{ const e=window.__dd.enemies.find(e=>e.__coopId==='farTarget'); e.x=pos.x; e.z=pos.z+1.5; },posBeforeD);   // the same knight, now close enough
const closeHpBefore=await hostPage.evaluate(()=>window.__dd.enemies.find(e=>e.__coopId==='farTarget').hp);
await guestPage.evaluate(()=>window.__dd.swing());
await tickBoth(6,5);
const closeHpAfter=await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__coopId==='farTarget'); return e?e.hp:null; });
const expectedKnightDmg=await guestPage.evaluate(()=>Math.round(window.__dd.heroDmg()*10)/10);
check("moved into real melee range, the same knight DOES hit — reach genuinely gates it, not a permanently-broken relay",
  closeHpAfter!==null&&near(closeHpBefore-closeHpAfter,expectedKnightDmg,.15),
  JSON.stringify({closeHpBefore,closeHpAfter,expectedKnightDmg}));
await hostPage.evaluate(()=>{ const i=window.__dd.enemies.findIndex(e=>e.__coopId==='farTarget'); if(i>=0) window.__dd.enemies.splice(i,1); });

// ---- B: gear-scaled max hp (delta-preserving bump) and def-based incoming-damage mitigation, same formulas
// applyGear()/hurtHero() (game.js) use for the real hero ----
const posBeforeB=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
await hostPage.evaluate(pos=>{ const e=window.__dd.spawn('goblin','N'); e.x=pos.x; e.z=pos.z+.3; e.y=0; e.dmg=40; e.atk=0; e.hp=9999; e.max=9999; e.__coopId='hit1'; },posBeforeB);
await tickHostOnly(30);
const afterHit1=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
check("a raw 40-damage hit with no def stat costs exactly 40 hp (no mitigation baseline)",
  afterHit1.hp===60&&afterHit1.max===100,JSON.stringify(afterHit1));
await hostPage.evaluate(()=>{ const i=window.__dd.enemies.findIndex(e=>e.__coopId==='hit1'); if(i>=0) window.__dd.enemies.splice(i,1); });

await guestPage.evaluate(()=>{ window.__dd.gear().armor={stats:{hp:50,def:60,regen:20}}; });
await tickBoth(6,5);
const afterGear=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
check("a +50 hp stat bumps max by exactly 50 and preserves the existing 40-hp deficit (delta-preserving, not a full heal)",
  afterGear.max===150&&afterGear.hp===110,JSON.stringify(afterGear));

const posBeforeHit2=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
await hostPage.evaluate(pos=>{ const e=window.__dd.spawn('goblin','N'); e.x=pos.x; e.z=pos.z+.3; e.y=0; e.dmg=50; e.atk=0; e.hp=9999; e.max=9999; e.__coopId='hit2'; },posBeforeHit2);
await tickHostOnly(30);
const afterHit2=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
const expectedMitigated=Math.max(1,Math.round(50*(1-Math.min(75,60)/100)));   // 50*(1-.6) = 20
check("a +60 def stat mitigates a raw 50-damage hit down to exactly "+expectedMitigated+" (same formula as hurtHero())",
  afterHit2.hp===110-expectedMitigated,JSON.stringify({afterHit2,expectedMitigated}));
await hostPage.evaluate(()=>{ const i=window.__dd.enemies.findIndex(e=>e.__coopId==='hit2'); if(i>=0) window.__dd.enemies.splice(i,1); });

// ---- C: passive regen (post-hurtT) scales with the guest's own regen stat, same base rate/cooldown as heroUpdate() ----
await tickHostOnly(240);   // clears hurtT (set to 3 by the hit above, 180 ticks) with a comfortable margin before the measured window, without letting the deficit fully close (still 50+ hp short of the 150 cap)
const hpA=await hostPage.evaluate(id=>window.__combat.guestHero(id).hp,guestId);
await tickHostOnly(60);   // exactly 1.0 simulated second
const hpB=await hostPage.evaluate(id=>window.__combat.guestHero(id).hp,guestId);
check("passive regen over 1s matches 1.5+regen(20)=21.5 hp, the same rate heroUpdate() uses for the real hero",
  near(hpB-hpA,21.5,.5),JSON.stringify({hpA,hpB,delta:hpB-hpA}));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
