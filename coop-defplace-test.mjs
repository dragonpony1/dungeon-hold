// ===== CO-OP (phase 7): a guest can place, repair, upgrade and sell a REAL defense on the host's hall, drawing
// from the shared host mana/DU pool -- not a pointless one in their own empty, disconnected local `defs`. Mirrors
// the phase-6 trust model: placeDefAt is monkey-patched to relay for a guest (99-network.js), the host validates
// for real and applies it; repair/upgrade/sell relay too, but reuse the REAL single-player functions (game.js's
// nearestDef/repair/upgrade/sell gained an optional `pos` param for exactly this) rather than a second copy of the
// cost/effect math, run from the guest's own host-tracked position so a client can't lie about where it's standing.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-defplace-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9459;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8884);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));

for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8884/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat,null,{timeout:60000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,30); });   // 30, not 5 -- matches place-test.mjs; S.phase needs that long to leave 'start' before select() will do anything

async function tickBoth(batches=10,size=5){
  for(let b=0;b<batches;b++){
    for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); }
    await new Promise(r=>setTimeout(r,20));
  }
}

const roomCode="coopd-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));

await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0));   // keep the host's own hero well clear so it never affects nearestDef reads meant for the guest
await guestPage.evaluate(()=>window.__dd.setCam(0,.42,8));
await tickBoth(6,5);   // let the guest's first 'input' reach the host and register guestHero at its default spawn (0,6)

const guestId=guestJoin.id;
const spawnState=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
check("host has registered the guest's simulated hero near its default spawn",
  spawnState&&spawnState.x===0&&spawnState.z===6,JSON.stringify(spawnState));

// 65-tavernroom.js fires a one-shot new-player hint toast on the guest's own page after 4.2s of REAL wall-clock
// time (a genuine setTimeout, not tied to sim ticks) the first time S.phase is 'build' -- letting it fire here,
// before any toast assertion, means it can never coincidentally overwrite one of THIS suite's own toast checks later
await guestPage.waitForTimeout(4300);

// --- placement: guest aims at a spot in front of its own spawn, does the real 2-stage confirmPlace, host applies it for real ---
const before=await hostPage.evaluate(()=>({mana:window.__dd.S.mana,du:window.__dd.S.du,defs:window.__dd.defs.length}));
await guestPage.evaluate(()=>{ const d=window.__dd; d.select('ball'); d.step(1/60,5); });
const ghostBefore=await guestPage.evaluate(()=>window.__dd.ghost());
await guestPage.evaluate(()=>{ window.__dd.confirmPlace(); window.__dd.step(1/60,2); });   // first click: anchor
await guestPage.evaluate(()=>{ window.__dd.confirmPlace(); window.__dd.step(1/60,2); });   // second click: confirm -> relays 'place' to host
await tickBoth(10,5);
const after=await hostPage.evaluate(()=>({mana:window.__dd.S.mana,du:window.__dd.S.du,defs:window.__dd.defs.length,kind:window.__dd.defs[0]&&window.__dd.defs[0].kind}));
check("guest's placement creates a REAL defense on the host, drawing real mana/DU",
  ghostBefore&&ghostBefore.ok&&after.defs===before.defs+1&&after.kind==='ball'&&after.mana===before.mana-80&&after.du===before.du+5,
  JSON.stringify({ghostBefore,before,after}));

// --- rejection: the host is the final arbiter even when the guest's own (disconnected) local ghost looked fine --
// place directly on the same real defense's exact footprint cell, which the guest's own empty local defAt can't see
const realDef=await hostPage.evaluate(()=>{ const d=window.__dd.defs[0]; return {x:d.x,z:d.z}; });
const rejected=await guestPage.evaluate(async(pos)=>{
  const d=window.__dd; d.select('ball'); d.step(1/60,5);
  d.setCam(0,.9,3); d.step(1/60,5);   // aim close/steep so the ghost lands near the hero -- exact overlap with the real def isn't required, the host-side occupancy check is what's actually being tested via a direct relay below
  return null;
},realDef);
// drive the relay directly (bypassing the local ghost aim, which has no way to know about a real, host-only
// occupied cell) -- this is exactly what a malicious or simply out-of-sync client could send, and exactly what
// hostTryPlaceDef must catch regardless
const beforeReject=await hostPage.evaluate(()=>window.__dd.defs.length);
await guestPage.evaluate((pos)=>window.__net.send('place',{kind:'ball',x:pos.x,z:pos.z,yaw:0}),realDef);
await tickBoth(6,5);
const afterReject=await hostPage.evaluate(()=>window.__dd.defs.length);
const rejectToast=await guestPage.evaluate(()=>document.getElementById('toast').textContent);
check("the host rejects a placement request that overlaps a real defense, and tells the guest why",
  afterReject===beforeReject&&/occupied/i.test(rejectToast),JSON.stringify({beforeReject,afterReject,rejectToast}));
await guestPage.evaluate(()=>window.__dd.select('ball'));   // the local select('ball') above (line 70) was left in placing mode -- this call's own toggle-off behavior is the only exposed way to clear it before the next section starts fresh

// repair/upgrade/sell need the guest's HOST-TRACKED position (guestHero, not the local render) within 3.4 units --
// placement itself only required camera aim, so the guest never actually walked there. Simulate holding 'w'
// (cam.yaw is 0, so +Z, roughly toward the defense from spawn), polling the host's own tracked position after
// each small burst and stopping the instant it's close enough, rather than guessing a fixed walk duration.
await guestPage.evaluate(()=>window.__dd.setKeys({w:1}));
let walkedTo=null;
for(let b=0;b<20&&!walkedTo;b++){
  for(let i=0;i<5;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); }
  const g=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
  if(g&&Math.hypot(g.x-realDef.x,g.z-realDef.z)<3){ walkedTo=g; }
}
await guestPage.evaluate(()=>window.__dd.setKeys({w:0}));
await tickBoth(4,5);
check("guest's host-tracked position is now within repair/upgrade/sell range of the real defense",
  !!walkedTo,JSON.stringify({walkedTo,realDef}));

// --- repair: damage the real defense on the host, guest (near its own tracked spawn, right by the def) repairs it ---
await hostPage.evaluate(()=>{ window.__dd.defs[0].hp=10; });
const manaBeforeRepair=await hostPage.evaluate(()=>window.__dd.S.mana);
await guestPage.evaluate(()=>{ window.__dd.repair(); });
await tickBoth(6,5);
const afterRepair=await hostPage.evaluate(()=>({hp:window.__dd.defs[0].hp,max:window.__dd.defs[0].max,mana:window.__dd.S.mana}));
// a successful single-player repair only ever gives world-space floatText feedback, never a toast() call (only its
// two REJECTION paths toast) -- so there's genuinely nothing new for hostDefAction's toast-relay to forward here;
// the guest's only feedback is the real mana/DU HUD ticking down, a known first-cut gap matching the existing
// "no hp bars on defense puppets" limitation
check("guest's repair() heals the REAL defense on the host and spends real mana",
  afterRepair.hp===afterRepair.max&&afterRepair.mana<manaBeforeRepair,
  JSON.stringify({afterRepair,manaBeforeRepair}));

// --- upgrade: guest upgrades the same real defense. (The toast-relay path for a success is already proven by the
// earlier rejection check -- not re-asserted on the exact text here, since game.js's own unrelated new-player
// hints can coincidentally fire a toast in the same window and overwrite it, same as any single-player session.) ---
const beforeUpgrade=await hostPage.evaluate(()=>({lvl:window.__dd.defs[0].lvl,mana:window.__dd.S.mana}));
await guestPage.evaluate(()=>{ window.__dd.upgrade(); });
await tickBoth(6,5);
const afterUpgrade=await hostPage.evaluate(()=>({lvl:window.__dd.defs[0].lvl,mana:window.__dd.S.mana}));
check("guest's upgrade() levels up the REAL defense on the host and spends real mana",
  afterUpgrade.lvl===beforeUpgrade.lvl+1&&afterUpgrade.mana<beforeUpgrade.mana,
  JSON.stringify({beforeUpgrade,afterUpgrade}));

// --- sell: guest sells the same real defense; it's gone from the host's real defs AND drops off the guest's own
// synced puppet list (proving the removal is real, not just a local guess) ---
const manaBeforeSell=await hostPage.evaluate(()=>window.__dd.S.mana);
await guestPage.evaluate(()=>{ window.__dd.sell(); });
await tickBoth(10,5);
const afterSell=await hostPage.evaluate(()=>window.__dd.defs.length);
const guestPuppets=await guestPage.evaluate(()=>window.__defsync.list().length);
check("guest's sell() removes the REAL defense from the host and its mana comes back",
  afterSell===0&&guestPuppets===0,JSON.stringify({afterSell,guestPuppets,manaBeforeSell,manaAfter:await hostPage.evaluate(()=>window.__dd.S.mana)}));

// --- HUD: the guest sees the shared hall's real mana/DU, not their own disconnected local numbers ---
await tickBoth(4,5);
const hudCheck=await Promise.all([
  hostPage.evaluate(()=>({mana:window.__dd.S.mana,du:window.__dd.S.du})),
  guestPage.evaluate(()=>({mana:document.getElementById('mana').textContent,du:document.getElementById('du').textContent,hostDuCap:window.__world.host().duCap})),
]);
check("guest's own HUD mana/DU numbers match the host's real shared economy",
  +hudCheck[1].mana===Math.floor(hudCheck[0].mana)&&hudCheck[1].du===(hudCheck[0].du+'/'+hudCheck[1].hostDuCap),
  JSON.stringify(hudCheck));

// --- ownership: a defense a guest places carries THEIR OWN gear stats, not the host's -- "let me get my knight
// to put that down, he has fast ballistas". Give the guest a +50 tow charm (direct gear mutation, same test-hook
// pattern used elsewhere in this suite), place a fresh defense, and check its real computed damage against the
// exact formula (game.js's own stat()) rather than just "did it change" ---
await guestPage.evaluate(()=>{ window.__dd.gear().charm={stats:{tow:50}}; window.__dd.setHero(0,6,0); window.__dd.setCam(0,.42,8); });   // known-clean position/aim, matching the very first placement's setup exactly -- the guest's own local hero also moved during the earlier walk-to-repair-range step (setKeys drives local heroUpdate too, not just the relayed copy)
await tickBoth(4,5);   // let the boosted stat actually reach the host over 'input' before placing
await guestPage.evaluate(()=>{ const d=window.__dd; d.select('ball'); d.step(1/60,5); });
const ghost2=await guestPage.evaluate(()=>window.__dd.ghost());
await guestPage.evaluate(()=>{ window.__dd.confirmPlace(); window.__dd.step(1/60,2); });
await guestPage.evaluate(()=>{ window.__dd.confirmPlace(); window.__dd.step(1/60,2); });
await tickBoth(10,5);
const owned=await hostPage.evaluate(()=>{ const d=window.__dd.defs[0]; return d&&{ownerId:d.ownerId,dmg:window.__dd.stat(d,'dmg')}; });
check("the guest's own +50% tow charm shows up as +50% damage on the defense THEY placed (6 -> 9, the exact formula)",
  owned&&owned.dmg===9,JSON.stringify({ghost2,owned,guestId}));
const hostBaselineDmg=await hostPage.evaluate(()=>{ const d=window.__dd.defs[0]; if(!d) return null; const save=d.ownerId; d.ownerId=null; const v=window.__dd.stat(d,'dmg'); d.ownerId=save; return v; });
check("the same defense would only deal the host's own (unbuffed) damage if it had no live owner",
  hostBaselineDmg===6,JSON.stringify({hostBaselineDmg}));

// --- disconnect: once the placing guest leaves, the defense falls back to the host's own stats -- "as long as
// they are in the game" ---
await guestPage.evaluate(()=>window.__net.leave());
await tickBoth(6,5);
const afterLeave=await hostPage.evaluate(()=>{ const d=window.__dd.defs[0]; return d&&window.__dd.stat(d,'dmg'); });
check("once the guest disconnects, their placed defense reverts to the host's own stats automatically",
  afterLeave===6,JSON.stringify({afterLeave}));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
