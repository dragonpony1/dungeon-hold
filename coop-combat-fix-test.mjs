// ===== CO-OP (phase 6 fixes): the three defects the adversarial code review confirmed before this phase shipped.
// (1) A guest's own hp/death was tracked correctly on the host but never sent back to the guest's own client, so
// their own health bar stayed permanently full, no hurt feedback ever played, and their local position permanently
// diverged from the host's authoritative one once the host snapped it back on respawn. Fixed by a targeted 'hp'
// message (99-network.js) the guest applies straight onto its own local `hero`, reusing hurtHero/heroUpdate's own
// side effects. (2) A guest's swing() relay could double-send the 'swing' message for one physical swing when two
// swing-bound inputs land in the same frame (an ordinary way to mash an attack key), doubling melee damage. Fixed
// by capturing hero.swingT BEFORE calling the original swing(), not after. (3) Two guests respawning always landed
// on the identical fixed point (0,6) since the per-guest spawn-spread offset was only ever applied once, at first
// connection. Fixed by persisting that offset on the guestHero record and reusing it on every respawn.
//
// Uses short polling ticks (checking state after every few frames) rather than one long fixed tick budget per step:
// an enemy left alive near a guest's respawn point will happily re-kill them the instant they respawn, so anything
// that waits a fixed, generous number of ticks risks catching a SECOND death/respawn cycle instead of the first,
// which made an earlier version of this suite flaky. Polling stops the instant the expected state is observed.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-combat-fix-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9458;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8883);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), aCtx=await browser.newContext(), bCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), aPage=await aCtx.newPage(), bPage=await bCtx.newPage();
const errors=[]; for(const p of [hostPage,aPage,bPage]) p.on("pageerror",e=>errors.push(String(e)));

// tick `page` a few frames at a time, checking `cond` (a page.evaluate-able fn) after each batch; stops the instant
// it returns truthy (returning its value) or after maxBatches*batchSize ticks (returning null)
async function tickUntil(page,cond,maxBatches=60,batchSize=5){
  for(let b=0;b<maxBatches;b++){
    for(let i=0;i<batchSize;i++) await page.evaluate(()=>window.__dd.step(1/60,1));
    await new Promise(r=>setTimeout(r,20));
    const v=await page.evaluate(cond);
    if(v) return v;
  }
  return null;
}

for(const p of [hostPage,aPage,bPage]){ await p.goto("http://127.0.0.1:8883/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat,null,{timeout:60000}); }
for(const p of [hostPage,aPage,bPage]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); });

const roomCode="coopf-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const aJoin=await aPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const bJoin=await bPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and both guests connect",hostOpen.err===null&&aJoin.err===null&&bJoin.err===null,JSON.stringify({hostOpen,aJoin,bJoin}));

await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0));   // keep the host's own hero out of proximity range so it never steals a hit meant for a guest
await aPage.evaluate(()=>window.__dd.setCam(0,.42,8));
await bPage.evaluate(()=>window.__dd.setCam(0,.42,8));
const aId=aJoin.id, bId=bJoin.id;
// register both guestHero entries on the host (guestSendInput fires on the guest's own tick, guestInputTick reacts on the host's)
await tickUntil(aPage,()=>true,4,5); await tickUntil(bPage,()=>true,4,5);
const reg=await (async()=>{ for(let b=0;b<30;b++){ for(let i=0;i<5;i++) await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,20)); const v=await hostPage.evaluate(({aId,bId})=>{ const a=window.__combat.guestHero(aId), b=window.__combat.guestHero(bId); return (a&&b)?{a,b}:null; },{aId,bId}); if(v) return v; } return null; })();
check("host registers distinct spawn points for both guests (fix 3, part 1: creation-time spread)",
  !!reg&&reg.a.x!==reg.b.x,JSON.stringify(reg));

// --- fix 2: two swing-triggering inputs in one synchronous task (the same-frame race the review found) must only
// land ONE hit's worth of damage, not two -- checked FIRST, on guest B, before either guest has ever died, so the
// host-side guestHitCone's own `g.dead>0` guard can't be the reason nothing lands
// the default hero (70-hero2.js) is the witch -- RANGED -- and phase 9 made a ranged guest's shot a real travelling
// bolt, not an instant hit; switching B to the knight first keeps this melee-focused test's own short wait valid,
// and its expected damage now reads heroDmg() live (phase 8 made this gear-scaled, not the flat GUEST_DMG=8 this
// test originally hardcoded, back when a guest's damage had no gear-scaling of its own yet). installHero() sets
// hero.reach synchronously but fetches the new hero's GLB asynchronously, and weaponsUpdate() (80-weapons.js) --
// the thing that actually drops the old weapon and mounts the new one -- only runs on a real tick; swinging before
// that settles can still fire as the OLD hero's ranged weapon kind, sent down the wrong relay path entirely
// (99-network.js). Poll window.__aim.kind() to null rather than guessing a fixed tick count.
await bPage.evaluate(()=>window.__heroes.select('knight'));
for(let i=0;i<30;i++){ const k=await bPage.evaluate(()=>window.__aim&&window.__aim.kind()); if(!k) break; await bPage.evaluate(()=>window.__dd.step(1/60,1)); }
const expectedSwingDmg=await bPage.evaluate(()=>Math.round(window.__dd.heroDmg()*10)/10);
const spawnedC=await hostPage.evaluate(()=>{ const e=window.__dd.spawn('goblin','E'); e.x=0; e.z=7.5; e.y=0; e.hp=100; e.max=100; e.atk=999; e.__coopId='dblswing'; return {hp:e.hp}; });
const swingRes=await bPage.evaluate(()=>{ const before=window.__dd.hero.swingT; window.__dd.swing(); const mid=window.__dd.hero.swingT; window.__dd.swing(); const after=window.__dd.hero.swingT; return {before,mid,after}; });
check("swing() only registers as 'new' on the call that actually transitions swingT (not a same-frame rejected duplicate)",
  swingRes.before<0&&swingRes.mid===0&&swingRes.after===0,JSON.stringify(swingRes));
for(let b=0;b<10;b++){ for(let i=0;i<5;i++) await bPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,20)); }
for(let b=0;b<6;b++){ for(let i=0;i<5;i++) await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,20)); }
const afterDoubleSwing=await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__coopId==='dblswing'&&!e.dead); return e?{hp:e.hp}:{hp:null,gone:true}; });
check("a same-frame double swing() call lands exactly one hit's damage on the host, not two",
  afterDoubleSwing.hp===spawnedC.hp-expectedSwingDmg,JSON.stringify({spawnedC,afterDoubleSwing,expectedSwingDmg}));
await hostPage.evaluate(()=>{ const i=window.__dd.enemies.findIndex(e=>e.__coopId==='dblswing'); if(i>=0) window.__dd.enemies.splice(i,1); });

// --- fix 1: a lethal hit on guest A's host-simulated hero must show up on guest A's OWN local hero (hp/dead), then
// A's local position must snap back in step with the host's respawn rather than staying wherever A wandered ---
const beforeA=await aPage.evaluate(()=>({hp:window.__dd.hero.hp,max:window.__dd.hero.max,dead:window.__dd.hero.dead,x:window.__dd.hero.x,z:window.__dd.hero.z}));
check("guest A's own local hero starts full HP, alive, at default spawn",
  beforeA.hp===100&&beforeA.max===100&&beforeA.dead===0&&beforeA.x===0&&beforeA.z===6,JSON.stringify(beforeA));

await hostPage.evaluate(({ax})=>{ const e=window.__dd.spawn('goblin','N'); e.x=ax; e.z=6.3; e.y=0; e.dmg=200; e.atk=0; e.__coopId='killerA'; },{ax:reg.a.x});
// poll the HOST's own record (not the guest's) so we remove the killer the instant one hit lands, before it can wait
// out the attack cooldown and get a free second hit in on the very same tick batch
const aHostDead=await (async()=>{ for(let b=0;b<40;b++){ for(let i=0;i<5;i++) await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,20)); const g=await hostPage.evaluate(id=>window.__combat.guestHero(id),aId); if(g&&g.dead>0) return g; } return null; })();
check("the host's own record for guest A's hero shows the lethal hit",!!aHostDead&&aHostDead.hp===0,JSON.stringify(aHostDead));
await hostPage.evaluate(()=>{ const i=window.__dd.enemies.findIndex(e=>e.__coopId==='killerA'); if(i>=0) window.__dd.enemies.splice(i,1); });   // one job done -- out it comes before it can get a second, unrelated kill in during the respawn wait below

const aLocalDead=await (async()=>{ for(let b=0;b<20;b++){ for(let i=0;i<5;i++) await aPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,20)); const h=await aPage.evaluate(()=>({hp:window.__dd.hero.hp,dead:window.__dd.hero.dead})); if(h.dead>0) return h; } return null; })();
check("guest A's own local hero shows the death the host already applied",!!aLocalDead&&aLocalDead.hp===0,JSON.stringify(aLocalDead));

const aHostRespawned=await (async()=>{ for(let b=0;b<60;b++){ for(let i=0;i<5;i++) await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,20)); const g=await hostPage.evaluate(id=>window.__combat.guestHero(id),aId); if(g&&g.dead===0) return g; } return null; })();
check("the host's own record for guest A's hero clears the 4s respawn timer",!!aHostRespawned,JSON.stringify(aHostRespawned));

const afterRespawnA=await (async()=>{ for(let b=0;b<20;b++){ for(let i=0;i<5;i++) await aPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,20)); const h=await aPage.evaluate(()=>({hp:window.__dd.hero.hp,max:window.__dd.hero.max,dead:window.__dd.hero.dead,x:window.__dd.hero.x,z:window.__dd.hero.z})); if(h.dead===0&&h.hp===100) return h; } return null; })();
check("guest A's own local hero respawns full HP, matching the host's authoritative respawn point",
  !!afterRespawnA&&afterRespawnA.x===reg.a.x&&afterRespawnA.z===6,JSON.stringify(afterRespawnA));

// --- fix 3, part 2: guest B (a different spawn offset than A, confirmed above) must respawn back at ITS OWN spawn
// point too, not snap to the shared fixed (0,6) the pre-fix code always reset every respawn to ---
await hostPage.evaluate(({bx})=>{ const e=window.__dd.spawn('goblin','S'); e.x=bx; e.z=6.3; e.y=0; e.dmg=200; e.atk=0; e.__coopId='killerB'; },{bx:reg.b.x});
const bHostDead=await (async()=>{ for(let b=0;b<40;b++){ for(let i=0;i<5;i++) await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,20)); const g=await hostPage.evaluate(id=>window.__combat.guestHero(id),bId); if(g&&g.dead>0) return g; } return null; })();
check("the host's own record for guest B's hero shows the lethal hit",!!bHostDead&&bHostDead.hp===0,JSON.stringify(bHostDead));
await hostPage.evaluate(()=>{ const i=window.__dd.enemies.findIndex(e=>e.__coopId==='killerB'); if(i>=0) window.__dd.enemies.splice(i,1); });

const bHostRespawned=await (async()=>{ for(let b=0;b<60;b++){ for(let i=0;i<5;i++) await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,20)); const g=await hostPage.evaluate(id=>window.__combat.guestHero(id),bId); if(g&&g.dead===0) return g; } return null; })();
check("the host's own record for guest B respawns back at B's own spawn point, not A's",
  !!bHostRespawned&&bHostRespawned.x===reg.b.x,JSON.stringify(bHostRespawned));

const afterRespawnB=await (async()=>{ for(let b=0;b<20;b++){ for(let i=0;i<5;i++) await bPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,20)); const h=await bPage.evaluate(()=>({hp:window.__dd.hero.hp,dead:window.__dd.hero.dead,x:window.__dd.hero.x,z:window.__dd.hero.z})); if(h.dead===0&&h.hp===100) return h; } return null; })();
check("guest B's own local hero respawns at ITS OWN spawn point, not stacked on guest A's",
  !!afterRespawnB&&afterRespawnB.x===reg.b.x&&afterRespawnB.z===6,JSON.stringify(afterRespawnB));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
