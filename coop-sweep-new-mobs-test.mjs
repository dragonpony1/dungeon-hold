// ===== CO-OP SWEEP 2026-10-02 (new-mobs): a guest sees the newer mobs' and bosses' moments the host sees (looks only; damage stays the host's).
//  * moth eggs: the host relays each egg ('mothEgg'); the guest drops a cosmetic copy that falls, pulses and bursts but hurts nothing -- 95t-moth.js
//  * the Crimson Phase Wraith: heal beams, the charging orb on his puppet, the dive flash and the death fireworks ('wraithFx') -- 95s-wraith.js
//  * Avery: the guest's cut scene ends with the host's ('averyCutEnd'), is skipped if the host's already ended, starts at the host's point if late; FURIOUS + swoop feathers ('averyFx') -- 95u-avery.js
//  * the Corruptor's snip and death burst ('corrFx') -- 95k-corruptor.js
//  * the Deep Prison's torch-bearers carry their torch on the guest, and drop it there ('torches', 'torchDrop') -- 95j-torchbearers.js
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-sweep-new-mobs-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9488;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(9761,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function open(map){ const ctx=await browser.newContext(); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_golf_cine","1"); }catch(e){} });
  const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:9761/?silent&nogate&map="+map,{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__moth&&window.__wraith&&window.__avery&&window.__corruptor&&window.__torchmobs,null,{timeout:90000});
  await p.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); return p; }
let hostPage, guestPage;
async function tickBoth(batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await sleep(20); } }
async function pair(map,label){ if(hostPage){ await hostPage.context().close(); await guestPage.context().close(); }
  hostPage=await open(map); guestPage=await open(map);
  const roomCode="nm-"+Math.random().toString(36).slice(2,8);
  const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
  const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
  check("host and guest connect ("+label+")",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
  await hostPage.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.addMana(1e6); d.S.phase='wave'; d.S.waveT=-1e9; d.setHero(-30,-30,0); });
  await guestPage.evaluate(()=>window.__dd.setHero(-32,-30,0));
  await tickBoth(6,5); }
const mk=(kind,x,z,hp)=>hostPage.evaluate(({kind,x,z,hp})=>{ const d=window.__dd; d.spawn(kind,'S'); const e=d.enemies[d.enemies.length-1]; e.x=x; e.z=z; if(hp){ e.hp=e.max=hp; } return e.kind; },{kind,x,z,hp});

await pair(4,'the Drawbridge');
// ---- 1. moth eggs
{ const k=await mk('moth',10,10,5000);
  await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(x=>x.kind==='moth'); e.spd=0; e.eggT=0; window.__dd.step(1/60,1); });
  const h=await hostPage.evaluate(()=>window.__moth.info());
  await tickBoth(3,5);
  const g=await guestPage.evaluate(()=>({ got:window.__moth.gEggs(), live:window.__moth.eggs().length }));
  check("the host's moth lays an egg and the guest drops its own copy of it",k==='moth'&&h.eggs>=1&&g.got>=1&&g.live>=1,JSON.stringify({k,h,g}));
  const at=await guestPage.evaluate(()=>{ const H=window.__dd.hero; return { x:H.x, y:H.y||0, z:H.z, hp:H.hp }; });
  await hostPage.evaluate(at=>window.__net.send('mothEgg',{ x:at.x, y:at.y+.6, z:at.z }),at); await sleep(150);
  const b0=await guestPage.evaluate(()=>window.__moth.info().bursts);
  for(let i=0;i<8;i++){ await guestPage.evaluate(()=>window.__dd.step(1/60,20)); }
  const g2=await guestPage.evaluate(()=>({ bursts:window.__moth.info().bursts, live:window.__moth.eggs().length, hp:window.__dd.hero.hp, towerHits:window.__moth.info().towerHits, heroHits:window.__moth.info().heroHits }));
  check("a guest's copy bursts at its spot but hurts nothing (the host's own egg does the damage)",g2.bursts>b0&&g2.live===0&&g2.hp===at.hp&&g2.heroHits===0&&g2.towerHits===0,JSON.stringify({b0,at,g2}));
  await hostPage.evaluate(()=>{ for(const e of window.__dd.enemies) window.__dd.kill(e); }); await tickBoth(4,5); }

// ---- 2. the Phase Wraith: a mend, the charge orb, the dive, the fireworks
{ await mk('goblin',2,12,400); await hostPage.evaluate(()=>{ const d=window.__dd, e=d.enemies.find(x=>x.kind==='goblin'&&!x.dead); e.spd=0; e.atk=1e9; e.hp=40; });
  await mk('wraith',2,9);
  const ballOk=await hostPage.evaluate(()=>{ const W=window.__moatwalk, d=window.__dd; const a=W.at(20,32); window.__ball=d.placeDefAt('ball',a.x,a.z,0); if(window.__ball) window.__ball.cd=99; return !!window.__ball; });
  await tickBoth(8,5);
  const h=await hostPage.evaluate(()=>window.__wraith.info()); const g=await guestPage.evaluate(()=>window.__wraith.gFx());
  check("the wraith mends a hurt mob on the host and the guest is told (beam + sigil + cross)",h.heals>=1&&g>=1,JSON.stringify({h,g}));
  // the charge: put him at his corner, still 'hide' -> he starts charging next frame
  const id=await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(x=>x.kind==='wraith'&&!x.dead); const c=window.__wraith.spotFor(e); e.x=c.x; e.z=c.z; e.wst='hide'; e.wt=0; window.__dd.step(1/60,1); return { id:e.__coopId||null, st:e.wst }; });
  await tickBoth(3,5);
  const o1=await guestPage.evaluate(()=>window.__wraith.gOrbs());
  check("his charge starts on the host: the crimson orb rides his puppet on the guest",id.id&&id.st==='charge'&&o1===1,JSON.stringify({id,o1}));
  const f0=await guestPage.evaluate(()=>window.__wraith.gFx());
  await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(x=>x.kind==='wraith'&&!x.dead), d=window.__ball; e.wst='dive'; e.wdef=d; e.x=d.x; e.z=d.z; e.wt=0; window.__dd.step(1/60,1); });
  await tickBoth(2,5);
  const f1=await guestPage.evaluate(()=>window.__wraith.gFx()); const dv=await hostPage.evaluate(()=>window.__wraith.info().dives);
  check("his dive on a ballista flashes on the guest too",ballOk&&dv>=1&&f1>f0,JSON.stringify({ballOk,dv,f0,f1}));
  await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(x=>x.kind==='wraith'&&!x.dead); window.__dd.kill(e); });
  await sleep(150); await guestPage.evaluate(()=>window.__dd.step(1/60,8));
  const g3=await guestPage.evaluate(()=>({ fx:window.__wraith.info().fx, orbs:window.__wraith.gOrbs(), gFx:window.__wraith.gFx() }));
  check("his death: the fireworks go up on the guest and the orb goes",g3.fx>0&&g3.orbs===0&&g3.gFx>f1,JSON.stringify(g3));
  await hostPage.evaluate(()=>{ for(const e of window.__dd.enemies) window.__dd.kill(e); }); await tickBoth(4,5); }

// ---- 3. Avery: the guest's cut scene follows the host's; FURIOUS and the swoop feathers
{ // (a) the host's scene already over while the guest's models were downloading: no frozen 10 s scene
  await guestPage.evaluate(()=>window.__avery.guestCut()); await hostPage.evaluate(()=>window.__net.send('averyCutEnd',{}));
  await guestPage.waitForFunction(()=>window.__avery.loaded(),null,{timeout:90000}); await sleep(200); await guestPage.evaluate(()=>window.__dd.step(1/60,2));
  const a=await guestPage.evaluate(()=>({ skips:window.__avery.gLateSkips(), cut:window.__avery.info().cut }));
  check("a guest whose download finished after the host's scene ended skips its copy (no freeze)",a.skips===1&&a.cut===false,JSON.stringify(a));
  // (b) a late start joins the host's scene where it is (3 s in)
  const b=await guestPage.evaluate(async()=>{ const real=performance.now.bind(performance); window.__avery.guestCut(); performance.now=()=>real()+3000; await new Promise(r=>setTimeout(r,50)); performance.now=real; const i=window.__avery.info(); window.__avery.endCut(); return i; });
  check("a guest's scene that starts 3 s late starts 3 s in",b.cut&&b.cutT>=2.9&&b.cutT<3.5,JSON.stringify(b));
  // (c) the host's real scene: the guest's starts with it and ends when the host's ends (a Space skip)
  await hostPage.evaluate(()=>window.__avery.load()); await hostPage.waitForFunction(()=>window.__avery.loaded(),null,{timeout:90000});
  await hostPage.evaluate(()=>window.__avery.startCut()); await tickBoth(4,5);
  const c0=await guestPage.evaluate(()=>window.__avery.info().cut);
  await hostPage.evaluate(()=>{ window.__avery.skip(); window.__dd.step(1/60,2); }); await sleep(150); await guestPage.evaluate(()=>window.__dd.step(1/60,3));
  const c1=await guestPage.evaluate(()=>window.__avery.info()); const hc=await hostPage.evaluate(()=>window.__avery.info().cut);
  check("the host skips her scene: the guest's copy ends with it",c0===true&&hc===false&&c1.cut===false,JSON.stringify({c0,hc,c1}));
  // (d) FURIOUS at half health, and a swoop's feathers
  const f0=await guestPage.evaluate(()=>({ fx:window.__avery.gFx(), feathers:window.__avery.info().feathers }));
  await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(x=>x.kind==='avery'&&!x.dead); e.hp=e.max*.4; window.__dd.step(1/60,1); });
  await sleep(150); await guestPage.evaluate(()=>window.__dd.step(1/60,2));
  const f1=await guestPage.evaluate(()=>({ fx:window.__avery.gFx(), feathers:window.__avery.info().feathers, banner:(document.body.innerText||'').includes('FURIOUS') }));
  check("Avery turns FURIOUS on the host: the guest gets the banner and the feather burst",f1.fx===f0.fx+1&&f1.feathers>f0.feathers&&f1.banner,JSON.stringify({f0,f1}));
  await hostPage.evaluate(()=>window.__net.send('averyFx',{ k:'burst', a:[0,30,0,1,2,1], n:99 })); await sleep(150); await guestPage.evaluate(()=>window.__dd.step(1/60,1));
  const f2=await guestPage.evaluate(()=>({ fx:window.__avery.gFx(), feathers:window.__avery.info().feathers }));
  check("a swoop's feather burst shows on the guest (count capped at 16)",f2.fx===f1.fx+1&&f2.feathers>0,JSON.stringify(f2));
  await hostPage.evaluate(()=>{ for(const e of window.__dd.enemies) window.__dd.kill(e); }); await tickBoth(4,5); }

// ---- 4. the Corruptor: its death burst (from the host's kill) and a snip
{ const s0=await guestPage.evaluate(()=>window.__corruptor.info());
  await hostPage.evaluate(()=>{ const d=window.__dd; d.spawn('goblin','S'); const e=d.enemies[d.enemies.length-1]; e.kind='corruptor'; e.x=6; e.z=6; d.kill(e); });
  await hostPage.evaluate(()=>window.__net.send('corrFx',{ k:'snip', x:4, y:1.8, z:4 }));
  await sleep(200); await guestPage.evaluate(()=>window.__dd.step(1/60,1));
  const s1=await guestPage.evaluate(()=>Object.assign({ gFx:window.__corruptor.gFx() },window.__corruptor.info()));
  check("the Corruptor's death burst and its snip show on the guest",s1.bursts===s0.bursts+1&&s1.snips===s0.snips+1&&s1.gFx===2,JSON.stringify({s0,s1})); }

await pair(5,'the Deep Prison');
// ---- 5. torch-bearers
{ await hostPage.evaluate(()=>{ const d=window.__dd; d.spawn('goblin','S'); const e=d.enemies[d.enemies.length-1]; e.spd=0; e.atk=1e9; e.hp=e.max=5000; window.__torchmobs.force(e); window.__tb=e; });
  await tickBoth(16,5);
  const g=await guestPage.evaluate(()=>window.__torchmobs.info());
  check("a torch-bearer on the host carries its torch on the guest (and lights it)",g.alive===1,JSON.stringify(g));
  await hostPage.evaluate(()=>window.__dd.kill(window.__tb)); await tickBoth(3,5);
  const g2=await guestPage.evaluate(()=>window.__torchmobs.info());
  check("killed, it drops its burning torch on the guest's floor too",g2.alive===0&&g2.fallen===1,JSON.stringify(g2)); }

const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis|peer/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
