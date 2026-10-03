// ===== CO-OP SWEEP 2026-10-02 (loot-rewards): a guest's rewards match single player, each player's own.
//  * a boss's whole Legendary jar pile reaches the guest (Avery 40; the jarDrop cap was 4) -- 99g-sludgejars.js
//  * the guest's jar models are asked for when the HOST's wave starts (hallPhase) -- 99g
//  * Avery's fall: the guest gets the banner and its own five Wind pieces, once ('averyFall') -- 95u-avery.js
//  * the held wave's reward is rolled through waveRewardItem on the guest (rw), so the Throne Room's wave-7 mythic set piece is the guest's too -- 99-network.js / 97b
//  * a dire wolf's Ice piece: the host's own is not relayed as a plain Rare, each guest gets its own 6% roll ('wolfIce') -- 95g-direwolf.js / 99-network.js
//  * an ordinary mob's named-mythic chance is rolled per guest ('namedDrop') -- 87-mythicdrops.js / 99-network.js
//  * the Cyclops: +800 into the guest's own pool and the guest's own Gladehart ('cycFall'); Throne Room survival held: the guest's own Trimaw -- 95c / 85-familiars.js / 99-network.js
//  * a held hall's jars still on a guest's floor are banked at the host's MOVE ON (runEnd) -- 99-network.js guestShowRunEnd
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-sweep-loot-rewards-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9497;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(8937,{dist:"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const cleared=()=>{ try{ if(!localStorage.getItem('ddMapsCleared')) localStorage.setItem('ddMapsCleared','5'); localStorage.removeItem('dd_sludge_in'); }catch(e){} };
async function open(map){ const ctx=await browser.newContext(); await ctx.addInitScript(cleared); const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:8937/?silent&nogate&map="+map,{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__jars&&window.__avery&&window.__direwolf,null,{timeout:90000});
  await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); window.__jars.clear(); window.__lootRates.clear(); }); return p; }
let hostPage, guestPage, guestJoin;
async function pair(map,label){ if(hostPage){ await hostPage.context().close(); await guestPage.context().close(); }
  hostPage=await open(map); guestPage=await open(map);
  const roomCode="lr-"+Math.random().toString(36).slice(2,8);
  const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
  guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
  check("host and guest connect ("+label+")",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
  for(const p of [hostPage,guestPage]) await p.evaluate(()=>window.__dd.setHero(500,500));   // far from the lanes and the drops: nothing gets picked up by accident
  await tickBoth(8,5); }
async function tickBoth(batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await sleep(20); } }
const guestLoot=()=>guestPage.evaluate(()=>window.__dd.loot.map(l=>({n:l.it.name,r:l.it.rarity,named:l.it.named||null,m:!!l.it.mythic})));
const fakeKill=(kind,phase)=>hostPage.evaluate(({kind,phase})=>{ const d=window.__dd; d.spawn('goblin','S'); d.step(1/60,1); const e=d.enemies[d.enemies.length-1]; e.kind=kind; e.x=16; e.z=16; const ph=d.S.phase; if(phase) d.S.phase=phase; try{ d.kill(e); } finally { d.S.phase=ph; } return true; },{kind,phase});

await pair(4,'the Drawbridge');
// ---- 1. jar models on the guest follow the HOST's wave
{ const before=await guestPage.evaluate(()=>window.__jars.asked());
  const after=await guestPage.evaluate(()=>{ const w=window.__net.world(); if(!w) return 'noworld'; const ph=w.phase; w.phase='wave'; window.__dd.step(1/60,1); w.phase=ph; return window.__jars.asked(); });
  check("the guest asks for Matt's jar models when the host's wave is on (its own S.phase stays build)",before===false&&after===true,JSON.stringify({before,after})); }

// ---- 2. Avery falls: 40 jars each, and the guest's own Wind set + banner, once
{ await fakeKill('avery');
  await tickBoth(10,5);
  const h=await hostPage.evaluate(()=>({ jars:window.__jars.list().length, wind:window.__dd.loot.filter(l=>/of the Wind$/.test(l.it.name)).length }));
  const g=await guestPage.evaluate(()=>({ jars:window.__jars.list().filter(j=>j.r===3).length, falls:window.__avery.guestFalls(), wind:window.__dd.loot.map(l=>l.it).concat(window.__dd.Meta.bag(),Object.values(window.__dd.gear()||{})).filter(it=>it&&/of the Wind$/.test(it.name)&&it.setId==='wind').length, banner:(document.body.innerText||'').includes('AVERY FALLS') }));
  check("Avery's kill: the host gets 40 Legendary jars and its Wind set",h.jars===40&&h.wind===5,JSON.stringify(h));
  check("the guest gets all 40 of its own Legendary jars (was capped at 4)",g.jars===40,JSON.stringify(g));
  check("the guest gets the AVERY FALLS banner and its own five Wind pieces",g.falls===1&&g.wind===5,JSON.stringify(g));
  const id=await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(x=>x.kind==='avery'); return e&&e.__coopId||null; });
  await hostPage.evaluate(id=>window.__net.send('averyFall',{id}),id); await tickBoth(4,5);
  const g2=await guestPage.evaluate(()=>({ falls:window.__avery.guestFalls(), wind:window.__dd.loot.map(l=>l.it).concat(window.__dd.Meta.bag(),Object.values(window.__dd.gear()||{})).filter(it=>it&&/of the Wind$/.test(it.name)).length }));
  check("a repeated averyFall for the same Avery drops nothing more",g2.falls===1&&g2.wind===5,JSON.stringify({id,g2})); }

await pair(1,'the Throne Room');
// ---- 3. the Throne Room's wave-7 reward: rolled through waveRewardItem on the guest (80% a mythic set piece)
{ await guestPage.evaluate(()=>window.__lootRates.clear()); const N=12;
  await hostPage.evaluate(N=>{ const d=window.__dd, w0=d.S.wave; d.S.wave=7; try{ for(let i=0;i<N;i++){ const it=window.__setGate.reward(); d.dropLoot(it,0,4.6,true); } } finally { d.S.wave=w0; } },N);
  await tickBoth(8,5);
  const g=await guestLoot(); const myth=g.filter(x=>x.m).length;
  check("wave-7 rewards relayed with rw: most of the guest's are mythic set pieces too ("+myth+"/"+g.length+")",g.length===N&&myth>=5,JSON.stringify(g.slice(0,4))); }

// ---- 4. dire wolf Ice: the host's own Ice piece is not relayed; each guest rolls its own 6%
{ await guestPage.evaluate(()=>window.__lootRates.clear());
  await hostPage.evaluate(()=>{ const it=window.__direwolf.makeIce(); it.__noRelay=1; try{ window.__dd.dropLoot(it,1,1); } finally { delete it.__noRelay; } });
  await tickBoth(6,5);
  const g0=(await guestLoot()).length;
  await hostPage.evaluate(()=>window.__net.send('wolfIce',{x:2,z:2,ew:3}));
  await tickBoth(6,5);
  const g1=await guestLoot();
  check("the host's own Ice piece is not relayed as a plain drop, and a wolfIce makes the guest its own '... of Ice' piece",g0===0&&g1.length===1&&/ of Ice$/.test(g1[0].n)&&g1[0].r>=2,JSON.stringify({g0,g1}));
  await guestPage.evaluate(()=>window.__lootRates.clear());
  await hostPage.evaluate(()=>{ for(let i=0;i<120;i++){ const d=window.__dd; d.spawn('goblin','S'); const e=d.enemies[d.enemies.length-1]; e.kind='direwolf'; e.x=16; e.z=16; d.kill(e); } });
  await tickBoth(10,5);
  const ice=(await guestLoot()).filter(x=>/ of Ice$/.test(x.n)).length;
  check("120 wolf kills on the host: the guest gets Ice pieces of its own ("+ice+")",ice>=1,String(ice)); }

// ---- 5. an ordinary mob's named-mythic chance, per guest
{ await guestPage.evaluate(()=>window.__lootRates.clear());
  const was=await hostPage.evaluate(()=>{ const r=window.__mythicDrops.rates(); window.__mythicDrops.set(undefined,undefined,1); return r.mob; });
  await fakeKill('goblin','wave');
  await hostPage.evaluate(m=>window.__mythicDrops.set(undefined,undefined,m),was);
  await tickBoth(8,5);
  const g=await guestLoot(); const named=g.filter(x=>x.named);
  check("a named-mythic mob drop is rolled for the guest too, as its own named piece",named.length===1,JSON.stringify(g)); }

// ---- 6. the Cyclops: +800 into the guest's pool, and its own Gladehart
{ await guestPage.evaluate(()=>window.__lootRates.clear());
  const gid=guestJoin.id;
  const m0=await hostPage.evaluate(id=>window.__combat.guestMana(id),gid);
  await fakeKill('cyclops');
  const m1=await hostPage.evaluate(id=>window.__combat.guestMana(id),gid);
  await tickBoth(8,5);
  const g=await guestLoot();
  check("the Cyclops's +800 goes into the guest's own pool",typeof m0==='number'&&Math.abs(m1-m0-800)<.01,JSON.stringify({gid,m0,m1}));
  check("the guest earns its own Gladehart",g.some(x=>x.named==='gladehart'),JSON.stringify(g)); }

// ---- 7. Throne Room survival held: Trimaw; then the host's MOVE ON banks the guest's jars still on the floor
{ await guestPage.evaluate(()=>window.__lootRates.clear());
  await hostPage.evaluate(()=>window.__net.send('mapHeld',{wave:50,mapName:'x',pay:0,survival:true}));
  await tickBoth(6,5);
  const g=await guestLoot();
  check("Throne Room survival held: the guest earns its own Trimaw",g.some(x=>x.named==='trimaw'),JSON.stringify(g));
  await hostPage.evaluate(()=>window.__net.send('jarDrop',{rs:[3,3,3,3,3,3,3,3,3,3,2,1],x:16,z:16})); await tickBoth(6,5);
  const tot=b=>b.common+b.uncommon+b.rare+b.legendary;
  const j0=await guestPage.evaluate(()=>({ floor:window.__jars.list().length, b:window.__jars.banked() })); j0.banked=tot(j0.b);
  await hostPage.evaluate(()=>window.__net.send('runEnd',{phase:'won',held:true,wave:50,survival:true,pay:0}));
  await tickBoth(4,5);
  const j1=await guestPage.evaluate(()=>({ floor:window.__jars.list().length, b:window.__jars.banked(), phase:window.__dd.S.phase })); j1.banked=tot(j1.b);
  check("the host's MOVE ON banks the guest's jars still on its floor",j0.floor>=12&&j1.floor===0&&j1.banked-j0.banked===j0.floor&&j1.phase==='won',JSON.stringify({j0,j1})); }

const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis|peer/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(0);
