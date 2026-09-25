// ===== CO-OP (phase 11): two real bugs a real two-player test turned up that no earlier suite had caught, since
// every earlier co-op test drives damage/HP through window.__dd/window.__combat directly rather than checking what
// a GUEST's own screen actually shows. (1) a guest's hits were always real -- landing on the host's actual enemies,
// for real damage -- but hurt()'s floatText/SFX.hit are purely local to the HOST simulating the hit; a guest's own
// puppet enemy just silently lost hp with no feedback at all. (2) the host's real run ending (crystal dead, or the
// last wave held) never told a guest's own game anything -- only their HUD text -- so a guest was left standing in
// a frozen, empty hall while the host alone got the SHATTERED/HALL HELD screen. -- 99-network.js.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-feedback-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9467;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(8894);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];

async function newPair(){
  const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
  const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
  for(const p of [hostPage,guestPage]){ p.on("pageerror",e=>errors.push(String(e)));
    await p.goto("http://127.0.0.1:8894/?silent&nogate",{timeout:90000});
    await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat&&window.__mobsync,null,{timeout:60000});
    await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); }
  const roomCode="feed-"+Math.random().toString(36).slice(2,8);
  const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
  const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
  check("pair connects ("+roomCode+")",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
  return {hostPage,guestPage,guestId:guestJoin.id,close:async()=>{ await hostCtx.close(); await guestCtx.close(); }};
}
async function tickBoth(hostPage,guestPage,batches=6,size=5){
  for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); }
}

// ==== 1: hit feedback -- a guest's own swing lands, for real, on the host's real enemy; does the GUEST's own
// screen show it? (window.__mobsync.hitFeedback() only increments on the actual floatText/SFX.hit branch below) ====
{
  const {hostPage,guestPage,guestId,close}=await newPair();
  await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0));
  await guestPage.evaluate(()=>window.__dd.setCam(0,.42,8));
  await tickBoth(hostPage,guestPage,6,5);
  await guestPage.waitForTimeout(4300);   // let 65-tavernroom.js's one-shot new-player toast burn off first, same as coop-herostats-test.mjs

  await guestPage.evaluate(()=>window.__heroes.select('knight'));   // melee, instant hit -- no travel time to wait out
  const g=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
  const coopId=await hostPage.evaluate(pos=>{ const e=window.__dd.spawn('goblin','N'); e.x=pos.x; e.z=pos.z+1.5; e.y=0; e.hp=200; e.max=200; e.dmg=0; e.atk=999; e.__coopId='fbTarget'; return e.__coopId; },g);
  await tickBoth(hostPage,guestPage,4,5);   // let the guest's puppet of this enemy exist before the hit, so the diff has a "before" hp to compare against

  const feedbackBefore=await guestPage.evaluate(()=>window.__mobsync.hitFeedback());
  const puppetBefore=await guestPage.evaluate(id=>window.__mobsync.get(id),coopId);
  check("the guest's own puppet already knows the enemy's real hp before the hit",puppetBefore&&puppetBefore.hp===200,JSON.stringify(puppetBefore));

  await guestPage.evaluate(()=>window.__dd.swing());
  await tickBoth(hostPage,guestPage,6,5);

  const hostHpAfter=await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__coopId==='fbTarget'); return e?e.hp:null; });
  check("the swing really did land on the host's real enemy",hostHpAfter!==null&&hostHpAfter<200,"hp="+hostHpAfter);

  const feedbackAfter=await guestPage.evaluate(()=>window.__mobsync.hitFeedback());
  const puppetAfter=await guestPage.evaluate(id=>window.__mobsync.get(id),coopId);
  check("the guest's OWN screen shows the hit -- hitFeedback fired and the puppet's tracked hp caught up",
    feedbackAfter===feedbackBefore+1&&puppetAfter.hp===hostHpAfter,
    JSON.stringify({feedbackBefore,feedbackAfter,puppetAfter,hostHpAfter}));

  // a second, harmless tick with nothing new hit shouldn't fire it again
  await tickBoth(hostPage,guestPage,2,5);
  const feedbackIdle=await guestPage.evaluate(()=>window.__mobsync.hitFeedback());
  check("no further hitFeedback fires once the hp stops moving",feedbackIdle===feedbackAfter,"count="+feedbackIdle);
  await close();
}

// ==== 2: the host's real defeat reaches the guest's own game, not just their HUD text ====
{
  const {hostPage,guestPage,close}=await newPair();
  const guestPhaseBefore=await guestPage.evaluate(()=>window.__dd.S.phase);
  check("guest starts in the build phase, same as any fresh join",guestPhaseBefore==='build',guestPhaseBefore);

  await hostPage.evaluate(()=>window.__dd.hurtCrystal(999999));   // instantly lethal -- starts the real deathCut
  const hostPhaseCut=await hostPage.evaluate(()=>window.__dd.S.phase);
  check("the host's real crystal death starts the real deathcut",hostPhaseCut==='deathcut',hostPhaseCut);

  for(let i=0;i<150;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); }   // 2.5s -- deathCut.dur is 2s, finishDeath() fires after
  await new Promise(r=>setTimeout(r,150));   // world sync is 10Hz -- give the 'world' message a moment to actually arrive

  const hostPhaseAfter=await hostPage.evaluate(()=>window.__dd.S.phase);
  check("the host itself still ends up on the real dead screen, unchanged by this fix",hostPhaseAfter==='dead',hostPhaseAfter);

  const guestPhaseAfter=await guestPage.evaluate(()=>window.__dd.S.phase);
  check("the guest's own S.phase now ALSO moves to 'dead' -- not stuck in a frozen hall",guestPhaseAfter==='dead',guestPhaseAfter);
  const guestDeadVisible=await guestPage.evaluate(()=>!document.getElementById('dead').classList.contains('hide'));
  check("the guest's own screen shows the real dead overlay, not just updated HUD text",guestDeadVisible);
  const guestDeadTitle=await guestPage.evaluate(()=>document.getElementById('deadh1').textContent);
  check("it's titled SHATTERED for a guest too",guestDeadTitle==='SHATTERED',guestDeadTitle);
  const guestPlayClass=await guestPage.evaluate(()=>document.body.classList.contains('play'));
  check("the guest's own body leaves 'play' state, same as the host's local finishDeath() already does",!guestPlayClass);
  await close();
}

// ==== 3: the host's real victory (last wave held) reaches the guest too, with different, correct text ====
// winMap() itself isn't reachable as window.winMap() (top-level functions in this codebase are shared module-scope
// bindings, not window properties -- only what's deliberately exported, like window.__dd, is), so this drives it
// through the real win condition instead, the same while(phase==='wave'){step;kill everything} idiom this project's
// other test suites already use (campaign-test.mjs, verify-numbers-r2-test.mjs, meta-test.mjs, ...) -- last wave,
// cleared for real, calling the genuine internal winMap() exactly like normal play would.
{
  const {hostPage,guestPage,close}=await newPair();
  const totalWaves=await hostPage.evaluate(()=>window.__dd.map().waves);
  const hostPhase=await hostPage.evaluate(w=>{ const d=window.__dd; d.S.wave=w-1; d.S.phase='build'; d.startWave();
    let guard=0; while(d.S.phase==='wave'&&guard++<600){ d.step(1/60,5); for(const e of d.enemies) if(!e.dead) d.kill(e); }
    return d.S.phase; },totalWaves);
  check("the last wave clearing for real calls the genuine winMap() -- host's own phase becomes 'won'",hostPhase==='won',hostPhase);

  for(let i=0;i<6;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); }
  await new Promise(r=>setTimeout(r,150));

  const guestPhase=await guestPage.evaluate(()=>window.__dd.S.phase);
  check("the guest's own S.phase moves to 'won' too",guestPhase==='won',guestPhase);
  const guestTitle=await guestPage.evaluate(()=>document.getElementById('deadh1').textContent);
  check("titled HALL HELD for a guest's win, not SHATTERED",guestTitle==='HALL HELD',guestTitle);
  await close();
}

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
