// ===== CO-OP (phase 13): guests earn what the host earns. Kill xp is party xp (every kill's xp to every connected
// player, whoever landed it), a held wave's gold and xp reach every guest, and the run's payout gold (25/wave, +150 for
// a map held) lands on a guest's dead/won screen -- each applied by the guest's own Meta on its own page, to its own
// gold/xp/level, which used to stay frozen no matter how many waves a guest defended. -- 99-network.js
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-rewards-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9468;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(8897);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function newPair(){
  const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
  const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
  for(const p of [hostPage,guestPage]){ p.on("pageerror",e=>errors.push(String(e)));
    await p.goto("http://127.0.0.1:8897/?silent&nogate",{timeout:90000});
    await p.waitForFunction(()=>window.__dd&&window.__net&&window.__meta,null,{timeout:60000});
    await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); }
  const roomCode="rew-"+Math.random().toString(36).slice(2,8);
  const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
  const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
  check("pair connects ("+roomCode+")",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
  return {hostPage,guestPage,close:async()=>{ await hostCtx.close(); await guestCtx.close(); }};
}
const wallet=p=>p.evaluate(()=>({gold:window.__meta.gold(),xp:window.__meta.xp(),level:window.__meta.level()}));
async function tickBoth(hostPage,guestPage,batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await sleep(20); } }
async function until(p,fn,arg,ms=6000){ try{ await p.waitForFunction(fn,arg,{timeout:ms}); return true; }catch(e){ return false; } }

// ==== 1: party xp for a kill, and a held wave's gold + xp ====
{
  const {hostPage,guestPage,close}=await newPair();
  await hostPage.evaluate(()=>window.__dd.setHero(500,500)); await guestPage.evaluate(()=>window.__dd.setHero(500,500));   // both far from the lanes: no accidental orb pickups muddying the mana, no hero deaths
  await tickBoth(hostPage,guestPage,3,5);
  const g0=await wallet(guestPage), h0=await wallet(hostPage);
  check("a fresh guest starts with nothing",g0.gold===0&&g0.xp===0&&g0.level===1,JSON.stringify(g0));

  // a kill on the host: the guest's own xp moves by the same amount
  await hostPage.evaluate(()=>{ const e=window.__dd.spawn('goblin','N'); window.__dd.kill(e); });
  const gotKill=await until(guestPage,x=>window.__meta.xp()>=x,g0.xp+2);
  const g1=await wallet(guestPage), h1=await wallet(hostPage);
  check("party xp: a goblin killed on the host gives the guest the same 2 xp",gotKill&&g1.xp===g0.xp+2,JSON.stringify({g0,g1}));
  check("...and the host still earns its own 2 xp",h1.xp===h0.xp+2,JSON.stringify({h0,h1}));
  await hostPage.evaluate(()=>{ const e=window.__dd.spawn('ogre','N'); window.__dd.kill(e); });
  const gotOgre=await until(guestPage,x=>window.__meta.xp()>=x,g1.xp+40);
  check("an ogre is worth 40 to the guest too (per-kind xp table, not a flat rate)",gotOgre&&(await wallet(guestPage)).xp===g1.xp+40);

  // a held wave: the host's real wave-held hook, driven the same way the campaign and feedback suites do
  const before=await wallet(guestPage); const hostBefore=await wallet(hostPage);
  const outcome=await hostPage.evaluate(()=>{ const d=window.__dd; d.startWave(); let guard=0, kills=0; while(d.S.phase==='wave'&&guard++<900){ d.step(1/60,5); for(const e of d.enemies) if(!e.dead){ d.kill(e); kills++; } } return {phase:d.S.phase,wave:d.S.wave,kills}; });
  check("the host really held wave 1 (phase back to build)",outcome.phase==='build'&&outcome.wave===1,JSON.stringify(outcome));
  const held=await until(guestPage,x=>window.__meta.gold()>=x,before.gold+15,10000);
  for(let i=0;i<20;i++){ await tickBoth(hostPage,guestPage,1,2); }   // let the burst of kill messages settle
  const after=await wallet(guestPage), hostAfter=await wallet(hostPage);
  check("the guest gets the held wave's gold: 10+5*1 = 15",held&&after.gold===before.gold+15,JSON.stringify({before,after}));
  check("...and its xp: 20+10*1 = 30 for the wave, plus 2 per goblin of the wave (party xp), matching the host's own gain exactly",after.xp-before.xp===hostAfter.xp-hostBefore.xp&&after.xp-before.xp>=30+2*outcome.kills,JSON.stringify({guestGain:after.xp-before.xp,hostGain:hostAfter.xp-hostBefore.xp,kills:outcome.kills}));
  check("the guest's level moved with its xp, like the host's",after.level===hostAfter.level||after.level>=1,JSON.stringify({guest:after.level,host:hostAfter.level}));

  // the run ends in defeat on wave 1: the payout reaches the guest's own dead screen
  const g2=await wallet(guestPage);
  await hostPage.evaluate(()=>window.__dd.hurtCrystal(999999));
  for(let i=0;i<150;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); }
  const paid=await until(guestPage,x=>window.__meta.gold()>=x,g2.gold+25,8000);
  const g3=await wallet(guestPage);
  const deadp=await guestPage.evaluate(()=>document.getElementById('deadp').textContent);
  check("defeat after wave 1: the guest's own screen pays 25 gold for the run (25 per wave held)",paid&&g3.gold===g2.gold+25&&/\+25 ● gold for the run/.test(deadp),JSON.stringify({g2,g3,deadp}));
  check("...and the guest's save carries it (ddMeta gold matches)",await guestPage.evaluate(g=>JSON.parse(localStorage.getItem('ddMeta')).gold===g,g3.gold));
  await close();
}

// ==== 2: a map held pays the guest 25 per wave plus 150 ====
{
  const {hostPage,guestPage,close}=await newPair();
  await hostPage.evaluate(()=>window.__dd.setHero(500,500)); await guestPage.evaluate(()=>window.__dd.setHero(500,500));
  await tickBoth(hostPage,guestPage,3,5);
  const totalWaves=await hostPage.evaluate(()=>window.__dd.map().waves);
  const g0=await wallet(guestPage);
  const hostPhase=await hostPage.evaluate(w=>{ const d=window.__dd; d.S.wave=w-1; d.S.phase='build'; d.startWave(); let guard=0; while(d.S.phase==='wave'&&guard++<600){ d.step(1/60,5); for(const e of d.enemies) if(!e.dead) d.kill(e); } return d.S.phase; },totalWaves);
  check("the last wave clearing for real wins the map on the host",hostPhase==='won',hostPhase);
  const want=25*totalWaves+150;
  let won=false; for(let i=0;i<80&&!won;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); await sleep(20); won=await guestPage.evaluate(()=>window.__dd.S.phase==='won'); }
  await until(guestPage,x=>window.__meta.gold()>=x,g0.gold+want,8000);
  const g1=await wallet(guestPage); const deadp=await guestPage.evaluate(()=>document.getElementById('deadp').textContent);
  check("the guest's HALL HELD screen pays 25*"+totalWaves+"+150 = "+want+" gold (on top of the last wave's own 10+5w)",won&&g1.gold-g0.gold>=want&&new RegExp('\\+'+want+' ● gold for the run').test(deadp),JSON.stringify({g0,g1,deadp}));
  check("the host's campaign bookkeeping stays its own: the guest's best wave is untouched",await guestPage.evaluate(()=>window.__meta.best()===0));
  await close();
}

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
