// ===== BUILD 508 (Matt approved, co-op): THE DEEP PRISON's wave-6 finale runs in a co-op hall (56i-prisonbarrier.js, the Avery pattern of 95u). Checked with a host and a guest on the prison:
//   * before it the mortar rooms are locked on both pages (95n: the host as single player, the guest from the host's world);
//   * the host's wave-6 marker starts the cut on the HOST and, by 'finale', on the GUEST (its own letterbox, a stand-in boss that is not in its enemies, the host's boss puppet hidden behind it);
//   * the guest's panels break at the blow and its three rows open; the host spawns the Corruptor and the horde and the guest sees them as puppets; the host keeps broadcasting under its hold;
//   * the guest's music keeps going while the host's mobs live (95m reads the puppets); the stand-in gives way to the host's boss at the drums; both end, the rooms wake on both;
//   * the guest never spawns a real enemy; the host's skip skips the guest's too ('finaleSkip'), a guest's own skip does nothing; a guest that missed 'finale' starts from the host's world
//     at the host's point, and a guest whose wall is up after the host's has fallen finds it down (quietly).
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-finale-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9808, PORT=9108;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(PORT,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function open(){ const ctx=await browser.newContext({viewport:{width:900,height:560}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
  await ctx.route(/\/api\/hideout\//,route=>route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ items:[] }) }));
  const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate&map=5&noshow",{timeout:120000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__finale&&window.__carts&&window.__corruptor&&window.__mortarwake&&window.__dd.map().id==='prison',null,{timeout:120000});
  await p.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); return p; }
const hostPage=await open(), guestPage=await open();
const roomCode="fin-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect on the Deep Prison",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
// both step in small chunks, one after the other (each page's own 60 fps clock), so the two scenes run side by side
async function tickBoth(chunks=6,size=5,hostFn,guestFn){ for(let c=0;c<chunks;c++){ await hostPage.evaluate(n=>{ const d=window.__dd; for(let i=0;i<n;i++){ d.step(1/60,1); d.S.crystal=1e6; } },size); await guestPage.evaluate(n=>window.__dd.step(1/60,n),size); await sleep(8); } }
await hostPage.evaluate(()=>window.__dd.setHero(0,50,0)); await guestPage.evaluate(()=>window.__dd.setHero(2,50,0));
for(let i=0;i<80;i++){ await tickBoth(1,2); const r=await Promise.all([hostPage,guestPage].map(p=>p.evaluate(()=>window.__finale.ready()))); if(r.every(Boolean)) break; await sleep(250); }
for(const p of [hostPage,guestPage]) await p.evaluate(async()=>{ await window.__corruptor.load(); await Promise.all(window.__carts.kinds.map(k=>window.__carts.load(k))); });
await tickBoth(6,5);
const g0=await guestPage.evaluate(()=>({ ready:window.__finale.ready(), locked:window.__mortarwake.info().locked, mwo:window.__net.world()&&window.__net.world().mwo, fin:window.__net.world()&&window.__net.world().fin }));
const h0=await hostPage.evaluate(()=>({ ready:window.__finale.ready(), locked:window.__mortarwake.info().locked, policy:window.__mortarwake.info().policy }));
check("before the wall falls the mortar rooms are locked on the host (as in single player) and on the guest (from the host's world: mwo 0)",h0.ready&&g0.ready&&h0.locked.length===2&&h0.locked.every(Boolean)&&g0.locked.length===2&&g0.locked.every(Boolean)&&g0.mwo===0&&g0.fin===0,JSON.stringify({h0,g0}));
// ---- the sixth wave, sixteen seconds in: the marker in the wave's own list starts it
const W=await hostPage.evaluate(()=>{ const d=window.__dd; d.S.phase='build'; d.S.wave=5; d.S.crystal=1e6; d.startWave(); const w=d.S.wave; d.S.waveT=15.5; let started=null; for(let i=0;i<90&&started===null;i++){ d.step(1/60,1); d.S.crystal=1e6; if(window.__finale.active()) started=+d.S.waveT.toFixed(2); } return { w, started, boss:window.__finale.boss()&&window.__finale.boss().kind, bossId:window.__finale.boss()&&window.__finale.boss().__coopId }; });
await tickBoth(4,5);
const A=await guestPage.evaluate(()=>{ const F=window.__finale, i=F.info(), g=F.guest(); const bars=[...document.querySelectorAll('div')].filter(x=>/z-index:\s*90/.test(x.getAttribute('style')||'')).map(b=>b.style.height); const skip=[...document.querySelectorAll('div')].find(x=>x.textContent==='⏭');
  return { active:i.active, t:i.t, g, bars, skipShown:!!skip&&+skip.style.opacity>0, enemies:window.__dd.enemies.length, music:window.__bossMusic.info().on }; });
const HA=await hostPage.evaluate(()=>({ active:window.__finale.info().active, t:window.__finale.info().t }));
check("the host's wave-6 marker starts the cut on the host (16 s into wave 6)",W.w===6&&W.started!==null&&W.started>=15.9&&W.started<=16.3&&HA.active&&(W.boss==='corruptor'||W.boss==='ogre'),JSON.stringify({W,HA}));
check("...and on the guest: its own letterbox, its own stand-in boss (not in its enemies -- it has none), the host's boss named to it, no skip button, the boss music on",A.active&&A.g.on&&A.g.standIn&&A.g.bossId===W.bossId&&A.bars.length===2&&A.bars.every(h=>h==='12vh')&&!A.skipShown&&A.enemies===0&&A.music,JSON.stringify(A));
// ---- through the build-up to the blow and the opening, stepping both side by side
const T=await hostPage.evaluate(()=>window.__finale.times);
async function runTo(t){ for(let i=0;i<400;i++){ const ht=await hostPage.evaluate(()=>window.__finale.info().t); if(ht>=t||!(await hostPage.evaluate(()=>window.__finale.active()))) break; await tickBoth(1,10); } await tickBoth(2,3); }
let guestEnemiesMax=0; const gEn=async()=>{ guestEnemiesMax=Math.max(guestEnemiesMax,await guestPage.evaluate(()=>window.__dd.enemies.length)); };
await runTo(T.T_RUN+1); await gEn();
const B=await guestPage.evaluate(()=>{ const F=window.__finale, b=F.boss(), g=F.guest(); let pupVis=null; window.__mobsync.each((p,id)=>{ if(id===g.bossId) pupVis=p.mdl.g.visible; }); return { t:F.info().t, standIn:g.standIn, kind:b&&b.kind, bx:b?+b.x.toFixed(1):null, XS:+F.geom.XS.toFixed(1), clip:b&&b.mdl.cur?b.mdl.cur.getClip().name:null, pupVis, wait:g.wait }; });
const HB=await hostPage.evaluate(()=>({ t:window.__finale.info().t, links:window.__net.links().map(l=>l.skipped) }));
check("the guest's stand-in boss walks the same path to the strike point and roars there; the host's boss puppet stays hidden behind it; the two scenes keep within a little of each other",B.standIn&&Math.abs(B.bx-B.XS)<3&&B.pupVis===false&&Math.abs(B.t-HB.t)<1.2,JSON.stringify({B,HB}));
await runTo(T.T_HIT+.6); await gEn();
const C=await guestPage.evaluate(()=>{ const F=window.__finale; return { t:F.info().t, broken:F.info().broken, first:F.panelList().filter(p=>p.broken).map(p=>[p.r,p.c]).slice(0,3) }; });
check("at the blow the guest's panels break, the middle bottom one first, rippling out",C.broken>=1&&C.broken<26&&C.first.some(([r,c])=>r===0&&c===6),JSON.stringify(C));
await runTo(T.T_OPEN+1); await gEn();
const D=await guestPage.evaluate(()=>{ const F=window.__finale, g=F.geom; const pups=window.__mobsync.list().map(id=>window.__mobsync.get(id)).filter(Boolean); const inStrip=pups.filter(p=>p.z>g.BZ+1&&p.z<g.ZB+1); return { open:F.info().open, sealed:F.info().sealed, pups:pups.length, inStrip:inStrip.length, kinds:[...new Set(inStrip.map(p=>p.kind))].sort(), carts:pups.filter(p=>p.kind==='kegcart'||p.kind==='firecart').length, enemies:window.__dd.enemies.length }; });
const HD=await hostPage.evaluate(()=>{ const F=window.__finale, i=F.info(); return { crowd:i.crowdNow, alive:window.__dd.enemies.filter(e=>!e.dead).length, boss:!!F.boss()&&!F.boss().dead }; });
check("the guest's three rows open behind the fallen wall",D.open&&!D.sealed,JSON.stringify({open:D.open,sealed:D.sealed}));
check("the host spawned the Corruptor and the horde, and the guest sees them as puppets standing in the rows (the host kept broadcasting under its hold)",HD.boss&&HD.crowd>=90&&D.inStrip>=60&&D.kinds.includes('goblin')&&D.kinds.includes('orc')&&D.carts>=1,JSON.stringify({HD,D}));
// ---- the drums: the stand-in gives way to the host's boss, the game runs, the guest's music stays on while the host's mobs live
await runTo(T.T_GO+.5); await gEn();
const E=await guestPage.evaluate(()=>{ const F=window.__finale, g=F.guest(); let pup=null; window.__mobsync.each((p,id)=>{ if(id===g.bossId) pup={ vis:p.mdl.g.visible, kind:p.kind }; }); return { standIn:g.standIn, pup, music:window.__bossMusic.info() }; });
check("at the drums the guest's stand-in gives way to the host's boss (its puppet shown)",!E.standIn&&E.pup&&E.pup.vis===true,JSON.stringify(E));
await runTo(T.T_END+.2); await tickBoth(6,10); await gEn();
const F1=await guestPage.evaluate(()=>{ const F=window.__finale, i=F.info(); const bars=[...document.querySelectorAll('div')].filter(x=>/z-index:\s*90/.test(x.getAttribute('style')||'')).map(b=>b.style.height); return { active:i.active, done:i.done, broken:F.panelList().filter(p=>p.broken).length, later:i.later, bars, music:window.__bossMusic.info(), foes:window.__mobsync.foes().length, locked:window.__mortarwake.info().locked, awake:window.__mortarwake.info().awake }; });
const HF=await hostPage.evaluate(()=>{ const i=window.__finale.info(), m=window.__mortarwake.info(); return { active:i.active, done:i.done, later:i.later+i.laterQueued, awake:m.awake, locked:m.locked }; });
check("both scenes end: the bars off, every panel down on the guest; the host lets out the second crowd, the guest spawns none of it",!F1.active&&F1.done&&!HF.active&&HF.done&&F1.broken===26&&F1.bars.every(h=>h==='0px'||h==='0')&&HF.later>=1&&F1.later===0,JSON.stringify({F1,HF}));
check("the mortar rooms wake on the host as the scene ends, and the guest's with them (unlocked, awake)",HF.awake&&HF.locked.every(l=>!l)&&F1.awake&&F1.locked.every(l=>!l),JSON.stringify({host:[HF.awake,HF.locked],guest:[F1.awake,F1.locked]}));
await tickBoth(30,10);   // five more seconds of the fight
const M=await guestPage.evaluate(()=>({ music:window.__bossMusic.info(), foes:window.__mobsync.foes().length }));
check("the guest's battle music keeps playing while the host's mobs remain (it read its own empty enemies list and stopped 3 s in)",M.foes>0&&M.music.on&&M.music.stage==='battle'&&!M.music.stopped,JSON.stringify({foes:M.foes,on:M.music.on,stage:M.music.stage,stopped:M.music.stopped}));
// the Corruptor's gate switching (95l): the co-op host runs it as solo does, and the guest draws the same gate warned or shut ('fate'), its beam from the Corruptor's puppet
for(let i=0;i<40;i++){ const on=await hostPage.evaluate(()=>{ const f=window.__fate.info(); return !!(f.warn||f.shut); }); if(on) break; await tickBoth(1,10); }
await sleep(300); await guestPage.evaluate(()=>window.__dd.step(1/60,2));
const FT=await Promise.all([hostPage,guestPage].map(p=>p.evaluate(()=>{ const i=window.__fate.info(); return { on:i.on, warn:i.warn, shut:i.shut, modes:i.modes, beam:i.beam, gFn:window.__fate.gFn() }; })));
check("the Corruptor's gate switching runs on the co-op host, and the guest draws it: the same gate warned (or shut), its veil up (the beam from the boss's puppet)",FT[0].on&&!!(FT[0].warn||FT[0].shut)&&FT[1].warn===FT[0].warn&&FT[1].shut===FT[0].shut&&FT[1].gFn>=1&&(FT[0].warn?FT[1].modes[FT[0].warn]==='warn'&&FT[1].beam>0:FT[1].modes[FT[0].shut]==='shut'),JSON.stringify(FT));
await gEn();
check("the guest never spawned a real enemy through any of it",guestEnemiesMax===0,String(guestEnemiesMax));
// ---- again, by the dev path: the host puts the wall back (the guest's goes up with it), the guest misses the 'finale' message and starts from the host's world, then the host skips
await hostPage.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) if(!e.dead) e.dead=.001; d.step(1/60,3); window.__bossMusic.stop(.1,false); window.__finale.reset(); });
await tickBoth(6,5);
const R=await guestPage.evaluate(()=>({ intact:window.__finale.info().intactPanels, sealed:window.__finale.info().sealed, done:window.__finale.done() }));
check("the host's wall put back (the dev panel) puts the guest's back too",R.intact===26&&R.sealed&&!R.done,JSON.stringify(R));
await guestPage.evaluate(()=>{ window.__net.onMessage('finale',()=>{}); window.__bossMusic.stop(.1,false); });   // as if the message never came: only the world's fin is left to tell it
await hostPage.evaluate(()=>{ const d=window.__dd; d.S.phase='wave'; d.S.crystal=1e6; window.__finale.start(); });
await tickBoth(12,10);
const L=await guestPage.evaluate(()=>{ const F=window.__finale; return { active:F.active(), t:F.info().t, g:F.guest(), starts:F.info().guestStarts }; });
const HL=await hostPage.evaluate(()=>window.__finale.info().t);
check("a guest that missed the start still starts, from the host's world, at the host's point in the scene",L.active&&L.g.on&&Math.abs(L.t-HL)<1.2&&L.t>.5,JSON.stringify({L,HL}));
const own=await guestPage.evaluate(()=>window.__finale.skip());
const sk=await hostPage.evaluate(()=>window.__finale.skip());
await tickBoth(4,5);
const K=await guestPage.evaluate(()=>{ const F=window.__finale, i=F.info(); return { t:i.t, broken:F.panelList().filter(p=>p.broken).length, open:i.open, stage:window.__bossMusic.info().stage, active:i.active }; });
check("the host's skip skips the guest's scene too (the wall down, the rows open, the drums); the guest's own skip did nothing",own===false&&sk===true&&K.t>=T.T_GO-.1&&K.broken===26&&K.open&&K.stage==='battle',JSON.stringify({own,sk,K}));
await runTo(T.T_END+.2); await tickBoth(6,10);
// ---- a guest whose wall is still up after the host's has fallen (a reload, a late join) finds it down, quietly
const Q=await guestPage.evaluate(()=>{ const F=window.__finale; const ok=F.reset(); return { ok, intact:F.info().intactPanels }; });
await tickBoth(4,5);
const Q2=await guestPage.evaluate(()=>{ const F=window.__finale, i=F.info(); return { done:i.done, active:i.active, intact:i.intactPanels, open:i.open, fallen:i.guestFallen }; });
check("a guest whose wall is up after the host's fell finds it down at once -- no scene, the rows open",Q.ok&&Q.intact===26&&Q2.done&&!Q2.active&&Q2.intact===0&&Q2.open&&Q2.fallen>=1,JSON.stringify({Q,Q2}));
await gEn();
check("and still no real enemy on the guest",guestEnemiesMax===0,String(guestEnemiesMax));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis|peer/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
