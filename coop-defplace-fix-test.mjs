// ===== CO-OP (phase 7 fixes): the trust-boundary and feedback gaps the adversarial code review found in
// hostTryPlaceDef/hostDefAction before this phase shipped. (1) hostTryPlaceDef's 'too far away' check failed OPEN
// (skipped entirely, not rejected) when guestHero had no entry yet for the sender -- fixed to fail closed.
// (2) hostTryPlaceDef never checked for a placement overlapping the placer's own position, unlike the local ghost's
// own "You're standing there" rule -- fixed by mirroring that check against the guest's host-tracked position.
// (3) Neither hostTryPlaceDef nor hostDefAction checked the game's own phase (a still-connected guest could keep
// acting after the crystal fell or the map was won) -- fixed. (4) hostTryPlaceDef had no dead-guest gate at all,
// and hostDefAction's dead-guest gate silently dropped the request with no feedback -- fixed, both now toast.
// (5) repair()/sell() (game.js) only ever give world-space floatText feedback on success, which a remote guest's
// client never renders -- fixed by synthesizing a confirmation toast when hostDefAction detects real mana movement
// with nothing already captured to relay.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-defplace-fix-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9460;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8885);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), aCtx=await browser.newContext(), bCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), aPage=await aCtx.newPage(), bPage=await bCtx.newPage();
const errors=[]; for(const p of [hostPage,aPage,bPage]) p.on("pageerror",e=>errors.push(String(e)));

for(const p of [hostPage,aPage,bPage]){ await p.goto("http://127.0.0.1:8885/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat,null,{timeout:60000}); }
for(const p of [hostPage,aPage]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,30); });
// guest B deliberately never calls start() -- stays in S.phase 'start' forever, so update(dt) never reaches
// Meta.update and guestSendInput never fires, exactly the "host never sees an 'input' from this id" state fix (1) targets

async function tickBoth(page,batches=10,size=5){
  for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await page.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); }
}

const roomCode="coopx-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const aJoin=await aPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const bJoin=await bPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and both guests connect",hostOpen.err===null&&aJoin.err===null&&bJoin.err===null,JSON.stringify({hostOpen,aJoin,bJoin}));

await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0));
await aPage.evaluate(()=>window.__dd.setCam(0,.42,8));
await tickBoth(aPage,6,5);
const aId=aJoin.id, bId=bJoin.id;
const aReg=await hostPage.evaluate(id=>window.__combat.guestHero(id),aId);
check("guest A registers at its default spawn",aReg&&aReg.x===0&&aReg.z===6,JSON.stringify(aReg));

// --- fix 1: a 'place' from a sender the host has never received 'input' from must be REJECTED, not silently unbounded ---
const beforeUnregistered=await hostPage.evaluate(()=>window.__dd.defs.length);
await bPage.evaluate(()=>window.__net.send('place',{kind:'ball',x:-28,z:-30,yaw:0}));
await tickBoth(aPage,6,5);
const afterUnregistered=await hostPage.evaluate(()=>window.__dd.defs.length);
check("a 'place' from an unregistered sender (no guestHero entry yet) is rejected, not placed unbounded",
  afterUnregistered===beforeUnregistered,JSON.stringify({beforeUnregistered,afterUnregistered}));

// --- fix 2: a placement overlapping the placer's own host-tracked position must be rejected ('You're standing there') ---
const beforeSelf=await hostPage.evaluate(()=>window.__dd.defs.length);
await aPage.evaluate(id=>window.__net.send('place',{kind:'ball',x:0,z:6,yaw:0}),aId);
await tickBoth(aPage,6,5);
const afterSelf=await hostPage.evaluate(()=>window.__dd.defs.length);
const selfToast=await aPage.evaluate(()=>document.getElementById('toast').textContent);
check("a placement targeting the guest's own tracked position is rejected",
  afterSelf===beforeSelf&&/standing there/i.test(selfToast),JSON.stringify({beforeSelf,afterSelf,selfToast}));

// --- fix 3: no placement once the game has ended (host's S.phase) ---
await hostPage.evaluate(()=>{ window.__dd.S.phase='dead'; });
const beforePhase=await hostPage.evaluate(()=>window.__dd.defs.length);
await aPage.evaluate(id=>window.__net.send('place',{kind:'ball',x:2,z:9,yaw:0}),aId);
await tickBoth(aPage,6,5);
const afterPhase=await hostPage.evaluate(()=>window.__dd.defs.length);
await hostPage.evaluate(()=>{ window.__dd.S.phase='build'; });
check("no placement is accepted once the host's run has ended (S.phase)",
  afterPhase===beforePhase,JSON.stringify({beforePhase,afterPhase}));

// --- fix 4: a dead guest can't place OR repair/upgrade/sell, and now gets a toast either way instead of silence ---
await hostPage.evaluate(()=>{ const e=window.__dd.spawn('goblin','N'); e.x=0; e.z=6.3; e.y=0; e.dmg=200; e.atk=0; e.__coopId='killer'; });
const aDead=await (async()=>{ for(let b=0;b<40;b++){ for(let i=0;i<5;i++) await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,20)); const g=await hostPage.evaluate(id=>window.__combat.guestHero(id),aId); if(g&&g.dead>0) return g; } return null; })();
check("guest A is confirmed dead on the host",!!aDead,JSON.stringify(aDead));
await hostPage.evaluate(()=>{ const i=window.__dd.enemies.findIndex(e=>e.__coopId==='killer'); if(i>=0) window.__dd.enemies.splice(i,1); });

const beforeDeadPlace=await hostPage.evaluate(()=>window.__dd.defs.length);
await aPage.evaluate(id=>window.__net.send('place',{kind:'ball',x:3,z:9,yaw:0}),aId);
await tickBoth(aPage,6,5);
const afterDeadPlace=await hostPage.evaluate(()=>window.__dd.defs.length);
const deadPlaceToast=await aPage.evaluate(()=>document.getElementById('toast').textContent);
check("a dead guest's placement is rejected, with a toast telling them why",
  afterDeadPlace===beforeDeadPlace&&/down/i.test(deadPlaceToast),JSON.stringify({beforeDeadPlace,afterDeadPlace,deadPlaceToast}));

await aPage.evaluate(()=>{ window.__dd.repair(); });
await tickBoth(aPage,6,5);
const deadRepairToast=await aPage.evaluate(()=>document.getElementById('toast').textContent);
check("a dead guest's repair() attempt gets a toast too, not silence",/down/i.test(deadRepairToast),deadRepairToast);

// wait for A to respawn (host-tracked) before the success-toast test below
const aRespawned=await (async()=>{ for(let b=0;b<60;b++){ for(let i=0;i<5;i++) await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,20)); const g=await hostPage.evaluate(id=>window.__combat.guestHero(id),aId); if(g&&g.dead===0) return g; } return null; })();
check("guest A respawns on the host",!!aRespawned,JSON.stringify(aRespawned));
await tickBoth(aPage,10,5);   // let A's own local client catch up (position/dead sync) before it drives more input

// --- fix 5: repair()'s success path only ever gave world-space floatText feedback before -- must now relay a toast ---
await aPage.evaluate(()=>{ window.__dd.setCam(0,.42,8); const d=window.__dd; d.select('ball'); d.step(1/60,5); d.confirmPlace(); d.step(1/60,2); d.confirmPlace(); d.step(1/60,2); });
await tickBoth(aPage,10,5);
const placedForRepair=await hostPage.evaluate(()=>window.__dd.defs[0]);
check("a fresh defense exists to repair-test against",!!placedForRepair,JSON.stringify(placedForRepair&&{x:placedForRepair.x,z:placedForRepair.z}));
await hostPage.evaluate(()=>{ window.__dd.defs[0].hp=10; });
// repair() only reaches the real defense from within 3.4 units of the guest's HOST-TRACKED position (walking
// there via camera aim alone, as the placement above did, isn't enough -- same gap this session hit once before)
const realDefPos=await hostPage.evaluate(()=>({x:window.__dd.defs[0].x,z:window.__dd.defs[0].z}));
await aPage.evaluate(()=>window.__dd.setKeys({w:1}));
let walkedClose=null;
for(let b=0;b<20&&!walkedClose;b++){
  for(let i=0;i<5;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await aPage.evaluate(()=>window.__dd.step(1/60,1)); }
  const g=await hostPage.evaluate(id=>window.__combat.guestHero(id),aId);
  if(g&&Math.hypot(g.x-realDefPos.x,g.z-realDefPos.z)<3) walkedClose=g;
}
await aPage.evaluate(()=>window.__dd.setKeys({w:0}));
await tickBoth(aPage,4,5);
check("guest A walked back within repair range after respawning",!!walkedClose,JSON.stringify({walkedClose,realDefPos}));
await aPage.evaluate(()=>{ document.getElementById('toast').textContent=''; });   // clear so the next toast we see is unambiguously the repair's own
await aPage.evaluate(()=>{ window.__dd.repair(); });
await tickBoth(aPage,10,5);
const repairSuccessToast=await aPage.evaluate(()=>document.getElementById('toast').textContent);
const repairedHp=await hostPage.evaluate(()=>window.__dd.defs[0]&&window.__dd.defs[0].hp);
check("a successful repair() now relays a confirmation toast to the guest (previously silent)",
  repairedHp===90&&repairSuccessToast.length>0,JSON.stringify({repairedHp,repairSuccessToast}));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
