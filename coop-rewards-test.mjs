// ===== CO-OP (phase 13): guests earn what the host earns. Kill xp is party xp (every kill's xp to every connected
// player, whoever landed it), a held wave's gold and xp reach every guest, and the run's payout gold (25/wave, +150 for
// a map held) lands on a guest's dead/won screen -- each applied by the guest's own Meta on its own page, to its own
// gold/xp/level, which used to stay frozen no matter how many waves a guest defended. -- 99-network.js
// Build 508 (Matt approved): the guest's own best wave and shop tier count co-op runs too (Meta.noteBest), and its run's end shows solo's tally -- nothing paid twice.
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
  const tl=await guestPage.evaluate(()=>({ line:window.__meta.tierLine(), best:window.__meta.best(), own:window.__dd.S.wave }));
  check("build 508: mid-run a guest's shop tier line counts the HALL's waves held (its own S.wave never moves): wave 1 held, tier 2 wares after this run",/tier 2 wares arrive after this run/.test(tl.line)&&tl.best===0&&tl.own===0,JSON.stringify(tl));
  check("the guest gets the held wave's gold: 10+5*1 = 15",held&&after.gold===before.gold+15,JSON.stringify({before,after}));
  check("...and its xp: 20+10*1 = 30 for the wave, plus 2 per goblin of the wave (party xp), matching the host's own gain exactly",after.xp-before.xp===hostAfter.xp-hostBefore.xp&&after.xp-before.xp>=30+2*outcome.kills,JSON.stringify({guestGain:after.xp-before.xp,hostGain:hostAfter.xp-hostBefore.xp,kills:outcome.kills}));
  // build 159 (6/7): this used to read `after.level===hostAfter.level||after.level>=1` -- every level is at least 1, so it could
  // never fail, and at 84 xp neither side had levelled anyway (100 to reach level 2). One more ogre carries both past 100: the
  // guest's level and its xp into the new level must come out exactly as the host's (both started from nothing, and party xp is
  // the same xp for every kill)
  await hostPage.evaluate(()=>{ const e=window.__dd.spawn('ogre','N'); window.__dd.kill(e); });
  const levelled=await until(guestPage,()=>window.__meta.level()>=2,null,6000);
  const gL=await wallet(guestPage), hL=await wallet(hostPage);
  check("the guest's level moved with its xp, like the host's: both past level 1, same level, same xp into it",
    levelled&&h0.xp===g0.xp&&h0.level===g0.level&&gL.level>=2&&gL.level===hL.level&&gL.xp===hL.xp,JSON.stringify({h0,g0,guest:gL,host:hL}));

  // the run ends in defeat on wave 1: the payout reaches the guest's own dead screen
  const g2=await wallet(guestPage);
  await hostPage.evaluate(()=>window.__dd.hurtCrystal(999999));
  for(let i=0;i<150;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); }
  const paid=await until(guestPage,x=>window.__meta.gold()>=x,g2.gold+25,8000);
  const g3=await wallet(guestPage);
  const deadp=await guestPage.evaluate(()=>document.getElementById('deadp').textContent);
  check("defeat after wave 1: the guest's own screen pays 25 gold for the run (25 per wave held)",paid&&g3.gold===g2.gold+25&&/\+25 ● gold for the run/.test(deadp),JSON.stringify({g2,g3,deadp}));
  check("...and the guest's save carries it (ddMeta gold matches)",await guestPage.evaluate(g=>JSON.parse(localStorage.getItem('ddMeta')).gold===g,g3.gold));
  // build 508 (Matt approved, reversing phase 13's rule): the run counts on the guest's OWN books -- the best wave as solo's finishDeath counts it (the map's wave), the shop tier at the run's end -- and it gets solo's tally
  const hk=await hostPage.evaluate(()=>window.__dd.S.kills);
  const b1=await guestPage.evaluate(()=>{ const s=window.__tavern.state(), sum=document.getElementById('tv-sum'), st=[...document.querySelectorAll('#tv-sum .tv-stat')].map(x=>[x.querySelector('span').textContent,x.querySelector('b').textContent]);
    return { best:window.__meta.best(), tier:window.__meta.stockTier(), saved:JSON.parse(localStorage.getItem('ddMeta')).best, open:s.open, sum:s.sum, shown:!!sum&&!sum.classList.contains('hide'), h1:sum?(sum.querySelector('h1')||{}).textContent:'', kills:(st.find(x=>/KILLS/.test(x[0]))||[])[1], rejoin:!!document.getElementById('tv-rejoin'), next:!!document.getElementById('tv-nextmap'), again:!!document.getElementById('tv-again') }; });
  check("the fall counts on the guest's OWN best wave (wave 1, the map's wave, as solo's finishDeath counts it), saved, and its shop tier moves with it at the run's end",b1.best===1&&b1.saved===1&&b1.tier===2,JSON.stringify(b1));
  check("...and the guest gets solo's end-of-run tally: THE GATE HAS OPENED, the hall's kills, ⟲ REJOIN first, no NEXT MAP (the host's call)",b1.open&&b1.sum&&b1.shown&&b1.h1==='THE GATE HAS OPENED'&&b1.kills===String(hk)&&b1.rejoin&&!b1.next&&b1.again,JSON.stringify({b1,hostKills:hk}));
  await close();
}

// ==== 2: a map held pays the guest 25 per wave plus 150 ====
{
  const {hostPage,guestPage,close}=await newPair();
  await hostPage.evaluate(()=>window.__dd.setHero(500,500)); await guestPage.evaluate(()=>window.__dd.setHero(500,500));
  await tickBoth(hostPage,guestPage,3,5);
  const totalWaves=await hostPage.evaluate(()=>window.__dd.map().waves);
  const g0=await wallet(guestPage);
  const hostPhase=await hostPage.evaluate(w=>{ const d=window.__dd; d.S.wave=w-1; d.S.phase='build'; d.startWave(); let guard=0; while(d.S.phase==='wave'&&guard++<600){ d.step(1/60,5); for(const e of d.enemies) if(!e.dead) d.kill(e); } return {phase:d.S.phase,held:d.S.held}; },totalWaves);
  check("the last wave clearing for real wins the map on the host -- held, and (build 160) on its victory lap until it moves on",hostPhase.phase==='build'&&hostPhase.held,JSON.stringify(hostPhase));
  const want=25*totalWaves+150;
  // build 160: the map's payout reaches the guest at HALL HELD, while the host's hall is still open on its lap
  const paidHeld=await until(guestPage,x=>window.__meta.gold()>=x,g0.gold+want,8000);
  const gH=await wallet(guestPage); const lapPhase=await guestPage.evaluate(()=>({phase:window.__dd.S.phase,dead:!document.getElementById('dead').classList.contains('hide'),best:window.__meta.best(),tier:window.__meta.stockTier(),line:window.__meta.tierLine()}));
  check("the guest is paid 25*"+totalWaves+"+150 = "+want+" at HALL HELD (on top of the last wave's own 10+5w), still in the hall on the host's lap",paidHeld&&gH.gold-g0.gold>=want&&lapPhase.phase==='build'&&!lapPhase.dead,JSON.stringify({g0,gH,lapPhase}));
  await hostPage.evaluate(()=>window.__dd.moveOn());   // the host's ▶ MOVE ON ends the run
  let won=false; for(let i=0;i<80&&!won;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); await sleep(20); won=await guestPage.evaluate(()=>window.__dd.S.phase==='won'); }
  const g1=await wallet(guestPage); const deadp=await guestPage.evaluate(()=>document.getElementById('deadp').textContent);
  check("the host's MOVE ON brings the guest's HALL HELD screen, naming the "+want+" gold for the run -- paid once: its gold doesn't move again",won&&g1.gold===gH.gold&&new RegExp('\\+'+want+' ● gold for the run').test(deadp),JSON.stringify({gH,g1,deadp}));
  // build 508 (Matt approved, reversing phase 13's "the host's campaign bookkeeping stays its own"): the guest's OWN best wave is the held map's (the campaign wave, as the host's winMap passes),
  // set at HALL HELD; its shop tier moves at MOVE ON (the lap's wares stay on the table, as solo's); MOVE ON brings solo's tally, paying nothing twice
  const wb=await guestPage.evaluate(()=>window.__dd.map().wbase), wantBest=wb+totalWaves, wantTier=Math.min(5,Math.min(5,1+Math.floor((Math.max(1,wantBest)-1)/3))+1);   // 10-meta.js stockTierFor / game.js tierOf
  const end=await guestPage.evaluate(()=>{ const s=window.__tavern.state(), sum=document.getElementById('tv-sum'); return { best:window.__meta.best(), tier:window.__meta.stockTier(), open:s.open, sum:s.sum, h1:sum?(sum.querySelector('h1')||{}).textContent:'', h2:sum?(sum.querySelector('h2')||{}).textContent:'', rejoin:!!document.getElementById('tv-rejoin'), next:!!document.getElementById('tv-nextmap') }; });
  check("the guest's own best wave is the held map's ("+wantBest+"), set at HALL HELD; its shop tier stayed through the lap and moves at MOVE ON (to "+wantTier+")",lapPhase.best===wantBest&&lapPhase.tier===1&&/tier \d wares arrive after this run/.test(lapPhase.line)&&end.best===wantBest&&end.tier===wantTier,JSON.stringify({lapPhase,end,wantBest,wantTier}));
  check("...and MOVE ON brings the guest solo's tally: HALL HELD, A NEW BEST, ⟲ REJOIN, no NEXT MAP",end.open&&end.sum&&end.h1==='HALL HELD'&&/A NEW BEST/.test(end.h2)&&end.rejoin&&!end.next,JSON.stringify(end));
  const tt=await guestPage.evaluate(()=>{ document.getElementById('tv-totavern').click(); const s=window.__tavern.state(); return { sum:s.sum, open:s.open, shown:s.goldShown, gold:window.__meta.gold() }; });
  check("...whose TO THE TAVERN counts nothing up again: the pay went out at HALL HELD",tt.open&&!tt.sum&&tt.shown===tt.gold&&tt.gold===g1.gold,JSON.stringify(tt));
  const back=await guestPage.evaluate(()=>{ window.__tavern.close(); return { dead:!document.getElementById('dead').classList.contains('hide'), h1:document.getElementById('deadh1').textContent, wave:!!document.getElementById('deadwave') }; });
  check("closing the tavern leaves the guest's HALL HELD card behind it, as solo's",back.dead&&back.h1==='HALL HELD'&&back.wave,JSON.stringify(back));
  await close();
}

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
