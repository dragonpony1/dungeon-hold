// ===== CO-OP SWEEP 2026-10-02 (bosses-progress): a guest gets the hall's big moments and keeps its own progress.
//  * the guest's music follows the HOST's phase (build <-> wave), and it sees the wave's banner (WAVE n OF m + the mob list) and the HALL HELD banner between waves -- 99-network.js
//  * boss entrances on the guest: banner, camera shake, the pig march once a pig puppet is up ('bossFx': 95c/95d/95f/95p) -- 99-network.js
//  * the Cyclops's Eye Glare, beam and Stomp drawn on the guest, and the stomp pushes the guest's own hero back ('cycFx') -- 95c-cyclops.js
//  * the boss model pre-fetch follows the hall's wave on a guest (its own S.wave never moves) -- 99-network.js
//  * a held hall gives the guest its difficulty medal for the map, and (build 508) its own best wave -- 95r-difficulty.js / 99-network.js / 10-meta.js noteBest
//  * the Deep Prison's mortar-room walls: a guest's sword breaks them, the guest sees each blow and the break, and the host's mortar is a Hex Mortar on the guest; the glow follows the host's losses -- 56g / 95n / 99-network.js
//    (build 508: locked on both pages until they wake, as in single player -- the wall's scene runs in co-op now, coop-finale-test)
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-sweep-bosses-progress-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9499;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(8939,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const cleared=()=>{ try{ if(!localStorage.getItem('ddMapsCleared')) localStorage.setItem('ddMapsCleared','5'); }catch(e){} };
async function open(map){ const ctx=await browser.newContext(); await ctx.addInitScript(cleared); const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:8939/?silent&nogate&map="+map,{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__cyclops,null,{timeout:90000});
  await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); return p; }
let hostPage, guestPage, guestJoin, gSpawn;
async function pair(map,label){ if(hostPage){ await hostPage.context().close(); await guestPage.context().close(); }
  hostPage=await open(map); guestPage=await open(map);
  const roomCode="bp-"+Math.random().toString(36).slice(2,8);
  const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
  guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
  check("host and guest connect ("+label+")",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
  gSpawn=await guestPage.evaluate(()=>({x:window.__dd.hero.x,z:window.__dd.hero.z}));
  for(const p of [hostPage,guestPage]) await p.evaluate(()=>window.__dd.setHero(500,500));
  await tickBoth(8,5); }
async function tickBoth(batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await sleep(20); } }
const bannerOf=p=>p.evaluate(()=>{ const b=document.getElementById('banner'); return b?b.innerHTML:''; });

await pair(1,'the Throne Room');
// ---- 1. the wave: banner + music on the guest
{ await guestPage.evaluate(()=>document.getElementById('sndbtn').click()); await sleep(200);   // sound on: game.js setSound(true) -> the build track for this page's own phase
  const m0=await guestPage.evaluate(()=>window.__dd.music().mode);
  await hostPage.evaluate(()=>window.__dd.startWave());   // every module's wrap is in (assemble.mjs puts them before the __dd hook)
  await tickBoth(6,5);
  const g=await guestPage.evaluate(()=>({ mode:window.__dd.music().mode, gs:window.__gsfx(), phase:window.__dd.S.phase }));
  const bn=await bannerOf(guestPage);
  check("the host's horn: the guest sees the wave banner (WAVE 1 OF ...)",g.gs.waveBanner>=1&&/WAVE 1 OF \d+/.test(bn),JSON.stringify({bn:bn.slice(0,120),wb:g.gs.waveBanner}));
  check("and the guest's music turns to the wave track (its own phase stays build)",m0==='build'&&g.mode==='wave'&&g.phase==='build',JSON.stringify({m0,g:{mode:g.mode,phase:g.phase}}));
  // the wave ends on the host: HALL HELD between waves, and the build music back
  await hostPage.evaluate(()=>{ const d=window.__dd; for(let i=0;i<600&&d.S.phase==='wave';i++){ d.S.waveT=1e4; for(const e of d.enemies) if(!e.dead) d.kill(e); d.step(1/60,1); } });
  await tickBoth(8,5);
  const g2=await guestPage.evaluate(()=>({ mode:window.__dd.music().mode, gs:window.__gsfx() }));
  const bn2=await bannerOf(guestPage);
  check("the wave held: the guest sees HALL HELD (wave 1 of ... repelled) and hears the build track again",g2.gs.heldBanner>=1&&/HALL HELD/.test(bn2)&&/wave 1 of \d+ repelled/.test(bn2)&&g2.mode==='build',JSON.stringify({bn2:bn2.slice(0,140),mode:g2.mode,hb:g2.gs.heldBanner})); }

// ---- 2. the pig bosses' entrance on the guest, and its march once a pig puppet is up
{ await hostPage.evaluate(()=>window.__dd.startWave());
  await tickBoth(4,5);
  await hostPage.evaluate(()=>window.__pigbosses.spawn());
  await tickBoth(14,5);
  const g=await guestPage.evaluate(()=>({ fx:window.__gsfx().bossFx||[], mode:window.__dd.music().mode, pigs:window.__mobsync.foes().filter(x=>/^pig/.test(x.kind)).length }));
  const bn=await bannerOf(guestPage);
  check("the pig bosses storm in: the guest gets the banner and the shake cue",g.fx.includes('pigs')&&/THE PIG BOSSES/.test(bn),JSON.stringify({fx:g.fx,bn:bn.slice(0,80)}));
  check("and the pig march once their puppets are on its screen",g.pigs>=1&&g.mode==='pigboss',JSON.stringify(g)); }

// ---- 3. the Cyclops: entrance, Eye Glare + beam, Stomp (and its push on the guest's own hero)
{ await hostPage.evaluate(()=>window.__cyclops.spawn());
  await tickBoth(6,5);
  const g0=await guestPage.evaluate(()=>({ fx:window.__gsfx().bossFx||[], info:window.__cyclops.fxInfo() }));
  const bn=await bannerOf(guestPage);
  check("the Cyclops arrives: the guest gets his banner",g0.fx.includes('cyclops')&&/THE CYCLOPS/.test(bn),JSON.stringify({fx:g0.fx,bn:bn.slice(0,60)}));
  await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(x=>x.kind==='cyclops'&&!x.dead); e.eyeCd=0; e.swing=-1; e.stompCd=99; });
  await tickBoth(3,3);
  const g1=await guestPage.evaluate(()=>window.__cyclops.fxInfo());
  check("the host's Eye Glare charge is drawn on the guest",g1.glares===1,JSON.stringify(g1));
  await tickBoth(12,8);   // 1.3 s of charge
  const g2=await guestPage.evaluate(()=>window.__cyclops.fxInfo());
  check("then the beam, and the charge glow goes with it",g2.fx>=2&&g2.glares===0,JSON.stringify(g2));
  await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(x=>x.kind==='cyclops'&&!x.dead); e.stompCd=0; e.swing=-1; e.eyeCd=99; });
  await tickBoth(3,3);
  const g3=await guestPage.evaluate(()=>window.__cyclops.fxInfo());
  check("the Stomp's ring is drawn on the guest",g3.fx>=g2.fx+1,JSON.stringify({g2,g3}));
  const before=await guestPage.evaluate(s=>{ window.__dd.setHero(s.x,s.z); return { x:window.__dd.hero.x, z:window.__dd.hero.z, k:window.__cyclops.fxInfo().knock||0 }; },gSpawn);
  await hostPage.evaluate(({x,z})=>window.__net.send('cycFx',{k:'stomp',x:x+1.5,y:0,z:z+1.5,r:5.5}),before);
  await tickBoth(3,3);
  const after=await guestPage.evaluate(()=>({ x:window.__dd.hero.x, z:window.__dd.hero.z, k:window.__cyclops.fxInfo().knock||0 }));
  check("a stomp beside the guest pushes its own hero back, away from the Cyclops",after.k===before.k+1&&Math.hypot(after.x-before.x-1.5,after.z-before.z-1.5)>Math.hypot(1.5,1.5)+.3,JSON.stringify({before,after}));
  await guestPage.evaluate(()=>window.__dd.setHero(500,500)); }

// ---- 4. the boss pre-fetch follows the hall's wave on a guest (the Throne Room's pigs from wave 5)
{ const r=await guestPage.evaluate(()=>{ const P=window.__pigbosses, real=P.ensure; let n=0; P.ensure=()=>{ n++; }; const w=window.__net.world(); const w0=w.wave, sv=w.survival;
    try{ w.wave=4; w.survival=false; window.__dd.step(1/60,2); const at4=n; w.wave=5; window.__dd.step(1/60,2); return { at4, at5:n-at4, own:window.__dd.S.wave }; } finally { w.wave=w0; w.survival=sv; P.ensure=real; } });
  check("the guest starts the pig trio's download at the hall's wave 5, not before (its own S.wave stays put)",r.at4===0&&r.at5>=1,JSON.stringify(r)); }

// ---- 5. progress: HALL HELD gives the guest its difficulty medal -- and (build 508, Matt approved, reversing phase 13's rule) its own best wave; the shop tier waits for the run's end (coop-rewards-test)
{ const b0=await guestPage.evaluate(()=>({ best:window.__meta.best(), tier:window.__meta.stockTier(), medal:window.__difficulty.best() }));
  await hostPage.evaluate(()=>window.__net.send('mapHeld',{wave:7,mapName:'x',pay:0,survival:false}));
  await tickBoth(4,5);
  const b1=await guestPage.evaluate(()=>({ best:window.__meta.best(), tier:window.__meta.stockTier(), medal:window.__difficulty.best(), want:window.__dd.map().wbase+7, id:window.__dd.map().id, saved:JSON.parse(localStorage.getItem('ddMeta')||'{}').best }));
  check("and the difficulty medal for this map is the guest's too",b1.id in b1.medal&&!(b1.id in b0.medal),JSON.stringify({b0:b0.medal,b1:b1.medal}));
  check("and its own best wave: the hall's (wbase + 7), saved -- the shop tier not yet (it moves at the run's end, as solo's)",b1.best===Math.max(b0.best,b1.want)&&b1.saved===b1.best&&b1.tier===b0.tier,JSON.stringify({b0,b1})); }

// ---- 6. the Deep Prison: a guest's sword breaks a mortar-room wall; the guest sees the blows, the break, and a Hex Mortar
await pair(5,'the Deep Prison');
{ const ready=async p=>{ for(let i=0;i<120;i++){ const n=await p.evaluate(()=>window.__prisonwalls&&window.__prisonwalls.walls?window.__prisonwalls.walls().length:0); if(n>=2) return true; await sleep(500); } return false; };
  const ok=await ready(hostPage)&&await ready(guestPage); check("the prison walls load on both pages",ok);
  await hostPage.evaluate(()=>window.__mortarwake.lose(6)); await tickBoth(4,5);
  const lost=await guestPage.evaluate(()=>window.__mortarwake.lost());
  check("the mortar rooms' glow on the guest follows the host's lost defenses",lost===6,String(lost));
  const sp=await guestPage.evaluate(()=>{ const w=window.__prisonwalls.raw()[0], s=w.spot; return { id:s.id, x:s.cx0+s.nx*2, z:s.cz0+s.nz*2, yaw:Math.atan2(-s.nx,-s.nz) }; });
  // build 508: the wall's scene runs in co-op now, so the host's rooms stay locked until it ends (as in single player) and a guest's follow the host's
  const locked0=await hostPage.evaluate(()=>window.__prisonwalls.walls().map(w=>w.locked)), gLocked0=await guestPage.evaluate(()=>window.__prisonwalls.walls().map(w=>w.locked));
  for(let i=0;i<3;i++){ await guestPage.evaluate(sp=>window.__net.send('swing',{yaw:sp.yaw,x:sp.x,z:sp.z,dmg:10,reach:2.4}),sp); await tickBoth(3,8); }
  const h0=await hostPage.evaluate(id=>window.__prisonwalls.walls().find(w=>w.id===id),sp.id);
  check("until the rooms wake (the wall's scene, build 508) they are locked on both pages and a guest's blows do nothing, as in single player",locked0.every(Boolean)&&gLocked0.every(Boolean)&&h0&&!h0.broken,JSON.stringify({locked0,gLocked0,h0}));
  await hostPage.evaluate(()=>window.__mortarwake.wake()); await tickBoth(3,5);
  const unlocked=await hostPage.evaluate(()=>window.__prisonwalls.walls().map(w=>w.locked)), gUnlocked=await guestPage.evaluate(()=>window.__prisonwalls.walls().map(w=>w.locked));
  for(let i=0;i<6;i++){ await guestPage.evaluate(sp=>window.__net.send('swing',{yaw:sp.yaw,x:sp.x,z:sp.z,dmg:10,reach:2.4}),sp); await tickBoth(3,8); }
  const h=await hostPage.evaluate(id=>window.__prisonwalls.walls().find(w=>w.id===id),sp.id);
  check("once they wake (the guest's with the host's) the guest's sword breaks the wall on the host",h&&h.broken&&unlocked.every(l=>!l)&&gUnlocked.every(l=>!l),JSON.stringify({h,unlocked,gUnlocked}));
  await tickBoth(16,10);   // the .8 s opening, the mortar placed, the next defs list
  const g=await guestPage.evaluate(id=>({ wall:window.__prisonwalls.walls().find(w=>w.id===id), info:window.__prisonwalls.info(), spot:window.__prisonwalls.spots().find(s=>s.id===id) }),sp.id);
  const hs=await hostPage.evaluate(id=>window.__prisonwalls.spots().find(s=>s.id===id),sp.id);
  check("the guest felt the blows and saw the wall break",g.wall.broken&&g.info.hits>=1&&g.info.guestBreaks>=1,JSON.stringify(g));
  check("the host's secret mortar is dressed as a Hex Mortar on the guest",hs.open&&hs.def.secret&&g.spot.open&&g.info.guestMounts>=1,JSON.stringify({hs,g:g.spot})); }

const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis|peer/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(0);
