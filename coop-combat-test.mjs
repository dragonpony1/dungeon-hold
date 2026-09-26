// ===== CO-OP (phase 6): actual combat, checked in both directions. A guest's swing lands on the host's REAL
// enemies (guestHitCone, 99-network.js, reusing hurt(e,dmg,kx,kz) unchanged from single-player). The host's real
// enemies can now notice and hurt a guest's hero, not just the host's own (Meta.heroes(), game.js's
// updateEnemies/landHit generalized from a hardcoded single hero to "nearest hero, host's own or any guest's", via
// nearestHero()). Both directions reuse the exact functions single-player combat already trusts (hurt, the melee-
// proximity check, moveCircle) — this suite checks the NEW wiring (a guest's attack can reach a real enemy, a real
// enemy's attack can reach a guest), not combat math itself, which single-player's own suites (cone-test.mjs etc.)
// already cover and this session re-ran as part of shipping this phase.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-combat-test.mjs — the `peer` package isn't installed (npm i peer) — this suite needs a local signaling server to test a real handshake without reaching the public broker."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9457;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8881);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));

for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8881/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat,null,{timeout:60000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); });

const roomCode="coopc-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));

// register the guest's simulated hero on the host (guestHero is created lazily on the first received input) --
// facing +Z (yaw 0), idle keys are enough, no need to actually walk anywhere for this test
await guestPage.evaluate(()=>window.__dd.setCam(0,.42,8));
for(let i=0;i<20;i++){ await guestPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }
for(let i=0;i<20;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }

const guestId=guestJoin.id;
const spawnState=await hostPage.evaluate((id)=>window.__combat.guestHero(id),guestId);
check("host has registered the guest's simulated hero at its default spawn, full HP",
  spawnState&&spawnState.x===0&&spawnState.z===6&&spawnState.hp===100&&spawnState.dead===0,JSON.stringify(spawnState));

// --- direction 1: an enemy notices and hurts the guest's hero ---
// the host's OWN hero also spawns at (0,6) by default -- the exact same point the guest's simulated hero starts
// at, since guestHero's spawn deliberately mirrors it -- so nearestHero()'s tie-break (checked first, wins ties)
// would otherwise make this ambiguous. Moving the host's own hero well away removes that ambiguity entirely.
await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0));   // (0,-25) rather than a wild guess: earlier this session a goblin spawn ('N' lane) landed around z=-30 without incident, so this is confirmed inside the map, not just probably so
// a real goblin, placed right on top of the guest's spawn point so the melee-proximity check in updateEnemies is
// unambiguous
const spawned=await hostPage.evaluate(()=>{ const e=window.__dd.spawn('goblin','N'); e.x=0; e.z=6.3; e.y=0; return {kind:e.kind,x:e.x,z:e.z}; });
for(let i=0;i<180;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }   // generous headroom past any goblin's own attack cooldown for at least one real hit to land (landHit fires ~.2s into a swing)
const afterAttack=await hostPage.evaluate((id)=>window.__combat.guestHero(id),guestId);
check("the guest's simulated hero takes real damage from an enemy that isn't the host's own",
  afterAttack&&afterAttack.hp<spawnState.hp,JSON.stringify({spawned,afterAttack}));
// this goblin was never removed or stopped, so it kept attacking through the whole 180-tick wait above and could
// (did, intermittently) kill the guest's hero before direction 2 even starts -- a dead guest's own swing silently
// does nothing (guestHitCone's own g.dead>0 guard, 99-network.js), which read exactly like a broken swing relay
// rather than what it actually was: stale test hygiene contaminating the next section. Removing it here, then
// waiting out any respawn already in progress, keeps direction 2 honestly isolated from direction 1's own combat.
await hostPage.evaluate(()=>{ const i=window.__dd.enemies.findIndex(e=>e.x===0&&e.z===6.3); if(i>=0) window.__dd.enemies.splice(i,1); });
for(let i=0;i<300;i++){ const g=await hostPage.evaluate((id)=>window.__combat.guestHero(id),guestId); if(g&&g.dead<=0) break; await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }

// --- direction 2: the guest's own swing lands on a real enemy ---
// the default hero (70-hero2.js) is the witch -- RANGED -- and phase 9 made a ranged guest's shot a real travelling
// bolt with its own fire-delay+flight time, not an instant hit; switching to the knight first keeps this test's
// original intent (a melee swing, landing basically immediately) valid rather than needing a much longer wait.
// installHero() (70-hero2.js) sets hero.reach synchronously but fetches the new hero's GLB asynchronously, and
// weaponsUpdate() (80-weapons.js) -- the thing that actually drops the old weapon and mounts the new one -- only
// runs on a real tick, not synchronously with select(); swinging before that settles can still fire as the OLD
// hero's weapon kind (window.__aim.kind() briefly still reads the just-left-behind ranged weapon), sending it down
// the wrong relay path in 99-network.js entirely. Poll window.__aim.kind() to null rather than guessing a fixed
// number of ticks -- the actual settle time depends on real GLB-fetch timing, not just frame count.
await guestPage.evaluate(()=>window.__heroes.select('knight'));
for(let i=0;i<30;i++){ const k=await guestPage.evaluate(()=>window.__aim&&window.__aim.kind()); if(!k) break; await guestPage.evaluate(()=>window.__dd.step(1/60,1)); }
// a second goblin, placed where the guest's swing (facing +Z, standing at 0,6) will land: hitCone-style checks use
// a forward-facing dot product, so directly in front at melee range is the one unambiguous spot
const spawned2=await hostPage.evaluate(()=>{ const e=window.__dd.spawn('goblin','S'); e.x=0; e.z=7.5; e.y=0; e.atk=999; return {kind:e.kind,x:e.x,z:e.z,hp:e.hp}; });   // atk pinned high so it never gets a chance to melee back mid-test and confound the read
await guestPage.evaluate(()=>window.__dd.swing());
for(let i=0;i<20;i++){ await guestPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }   // real yields so the 'swing' message actually reaches the host over the data channel
for(let i=0;i<10;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }
const afterSwing=await hostPage.evaluate(()=>{ const e=window.__dd.enemies[1]; return e?{hp:e.hp}:{hp:null,gone:true}; });
check("the guest's own swing damages a real enemy on the host (or kills it outright)",
  afterSwing.gone===true||afterSwing.hp<spawned2.hp,JSON.stringify({spawned2,afterSwing}));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
