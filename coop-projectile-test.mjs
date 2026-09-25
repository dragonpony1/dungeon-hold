// ===== CO-OP (phase 9): a ranged guest's shot is now a REAL bolt/arrow (99-network.js's hitCone wrap, spawning
// into the host's own BOLTS/ARROWS via 82-staff.js's fireBolt/83-bow.js's fireArrow, now exported raw), not phase
// 8's generalised instant-hit cone. This suite tests the properties that distinguish a real projectile from that
// cone specifically -- single-target stop (a cone hit everyone in it; a real bolt/arrow stops at the first thing
// it meets) and full-draw pierce (a bow-only property the cone never had at all) -- rather than re-proving the
// damage-value math coop-herostats-test.mjs already covers exactly.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-projectile-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9464;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8891);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));

for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8891/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat,null,{timeout:60000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__freeze=true; });   // stop game.js's own rAF loop from also advancing sim time with real wall-clock deltas during this test's real sleeps
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,30); });

async function tickBoth(batches=6,size=5){
  for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); }
}

const roomCode="coopp-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
const guestId=guestJoin.id;

await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0));
await guestPage.evaluate(()=>window.__dd.setCam(0,.42,8));   // cam.yaw=0 -> aim points straight down +Z from wherever the guest's host-tracked position is
await tickBoth(6,5);
const spawnState=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
check("guest registers at its default spawn",spawnState&&spawnState.x===0&&spawnState.z===6,JSON.stringify(spawnState));
await guestPage.waitForTimeout(4300);   // let 65-tavernroom.js's one-shot new-player toast burn off before it can land during a tick window this suite is timing

// ---- A: single-target stop -- the one property a cone (phase 8) structurally could not have. Default hero is the
// witch (staff/bolt); a tap shot (calling swing() directly, bypassing the real mouse/touch hold, never reaches
// FULL_MUL/pierce -- same as coop-herostats-test.mjs's own tap shots) should hit ONLY the nearer of two enemies
// standing in a dead-straight line, never both, unlike the old cone which hit everyone in its arc at once.
await hostPage.evaluate(()=>{
  const a=window.__dd.spawn('goblin','N'); a.x=0; a.z=11; a.y=0; a.hp=9999; a.max=9999; a.dmg=0; a.atk=999; a.__coopId='near';
  const b=window.__dd.spawn('goblin','N'); b.x=0; b.z=16; b.y=0; b.hp=9999; b.max=9999; b.dmg=0; b.atk=999; b.__coopId='far';
});
const beforeA=await hostPage.evaluate(()=>({near:window.__dd.enemies.find(e=>e.__coopId==='near').hp,far:window.__dd.enemies.find(e=>e.__coopId==='far').hp}));
await guestPage.evaluate(()=>window.__dd.swing());
await tickBoth(20,5);   // 100 ticks: comfortably covers fire-delay + travel to the near target, and the bolt's own life besides
const afterA=await hostPage.evaluate(()=>({near:window.__dd.enemies.find(e=>e.__coopId==='near').hp,far:window.__dd.enemies.find(e=>e.__coopId==='far').hp}));
check("a tap bolt hits the NEAR of two enemies in its path",afterA.near<beforeA.near,JSON.stringify({before:beforeA,after:afterA}));
check("...and stops there -- the FAR one behind it is untouched (a real projectile, not a cone hitting both)",
  afterA.far===beforeA.far,JSON.stringify({before:beforeA,after:afterA}));
await hostPage.evaluate(()=>{ ['near','far'].forEach(id=>{ const i=window.__dd.enemies.findIndex(e=>e.__coopId===id); if(i>=0) window.__dd.enemies.splice(i,1); }); });

// ---- B: travel time -- damage should NOT land within a couple of ticks of the swing (it's still in flight),
// confirming this is a genuine travelling shot and not an instant hit merely relabelled ----
await hostPage.evaluate(pos=>{ const e=window.__dd.spawn('goblin','N'); e.x=pos.x; e.z=pos.z+9; e.y=0; e.hp=9999; e.max=9999; e.dmg=0; e.atk=999; e.__coopId='travel'; },spawnState);
const beforeB=await hostPage.evaluate(()=>window.__dd.enemies.find(e=>e.__coopId==='travel').hp);
await guestPage.evaluate(()=>window.__dd.swing());
await tickBoth(1,3);   // ~3 ticks: barely enough for the fire-delay alone, nowhere near enough to also cross 9 units
const soonB=await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__coopId==='travel'); return e?e.hp:null; });
check("no damage yet a few ticks after swinging -- the shot is still travelling, not an instant hit",
  soonB===beforeB,JSON.stringify({beforeB,soonB}));
await tickBoth(20,5);
const laterB=await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__coopId==='travel'); return e?e.hp:null; });
check("...but it does land once the shot has had time to arrive",laterB!==null&&laterB<beforeB,JSON.stringify({beforeB,laterB}));
await hostPage.evaluate(()=>{ const i=window.__dd.enemies.findIndex(e=>e.__coopId==='travel'); if(i>=0) window.__dd.enemies.splice(i,1); });

// ---- C: full-draw pierce (bow-only) -- switch to the troll archer, hold a REAL charge to completion via
// window.__aim.press()/release() (calling swing() directly, as above, never engages the hold state at all, so
// this is the one place in this suite that has to drive the actual press-and-hold mechanic) ----
await guestPage.evaluate(()=>window.__heroes.select('troll'));
const trollReach=await guestPage.evaluate(()=>window.__dd.hero.reach);
check("switching to the troll archer sets a real long reach (24)",trollReach===24,"reach="+trollReach);
await hostPage.evaluate(()=>{
  const a=window.__dd.spawn('goblin','N'); a.x=0; a.z=11; a.y=0; a.hp=9999; a.max=9999; a.dmg=0; a.atk=999; a.__coopId='pnear';
  const b=window.__dd.spawn('goblin','N'); b.x=0; b.z=16; b.y=0; b.hp=9999; b.max=9999; b.dmg=0; b.atk=999; b.__coopId='pfar';
});
const beforeC=await hostPage.evaluate(()=>({near:window.__dd.enemies.find(e=>e.__coopId==='pnear').hp,far:window.__dd.enemies.find(e=>e.__coopId==='pfar').hp}));
await guestPage.evaluate(()=>window.__aim.press());
await tickBoth(10,5);   // 50 ticks (~0.83s): past fullT() (~0.5s with no spd stat/mult) so the charge is genuinely full, not just close
const chargeState=await guestPage.evaluate(()=>({charge:window.__aim.charge(),holding:window.__aim.holding()}));
check("held long enough to reach full charge before releasing",chargeState.charge>=1&&chargeState.holding,JSON.stringify(chargeState));
await guestPage.evaluate(()=>window.__aim.release());
await tickBoth(25,5);   // 125 ticks: release -> the paused clip resumes -> hitCone()'s real fire -> arrow travels to and through both targets
const afterC=await hostPage.evaluate(()=>({near:window.__dd.enemies.find(e=>e.__coopId==='pnear').hp,far:window.__dd.enemies.find(e=>e.__coopId==='pfar').hp}));
check("a full-draw arrow pierces the near enemy...",afterC.near<beforeC.near,JSON.stringify({before:beforeC,after:afterC}));
check("...and keeps going to hit the far one too (pierce:2 on a full draw -- the one thing a tap shot, or the old cone, never had)",
  afterC.far<beforeC.far,JSON.stringify({before:beforeC,after:afterC}));
await hostPage.evaluate(()=>{ ['pnear','pfar'].forEach(id=>{ const i=window.__dd.enemies.findIndex(e=>e.__coopId===id); if(i>=0) window.__dd.enemies.splice(i,1); }); });

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
