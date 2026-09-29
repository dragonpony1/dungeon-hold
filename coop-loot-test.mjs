// ===== CO-OP (build 159, 3/7): a guest's loot and mana are worth what the host's are. (1) A guest's own copy of every drop was
// rolled at the guest's OWN wave, and a guest's S.wave never moves -- so every guest roll was a wave-zero roll: level 1 on map
// one, never epic or legendary, no Void pieces, weak mythics, a level-1 named mythic. The host's drop and held-wave messages now
// carry the hall's wave and the guest rolls at it (99-network.js atHallWave). (2) The HALL HELD payout on a later map paid the
// guest 25 x the MAP's wave (the host pays itself 25 x the campaign wave) -- it now rides the run-end message as the host's own
// number. (3) Matt's call: a guest sells only what it built; repair and upgrade stay open to everyone. (4) No repair/upgrade/sell
// after the hall fell or held. (5) A guest who drops and rejoins gets its own mana pool back, and its defenses, keyed by its
// lobby seat -- no free refill, no savings lost; the same tab back before its old link was given up on inherits it too.
// (6) The wave-zero phantom goblin is taken away quietly (it used to go through kill(): 2 xp, an orb and a loot roll).
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-loot-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9621;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(8721);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function open(query,init){ const ctx=await browser.newContext(); if(init) await ctx.addInitScript(init.fn,init.arg); const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:8721/?silent&nogate&nosetgate"+(query||""),{timeout:90000});
  await p.waitForFunction(()=>window.__dd&&window.__net&&window.__meta&&window.__combat&&window.__mythicDrops&&window.__lobby&&window.__trainer,null,{timeout:60000});
  await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); return {ctx,p}; }
async function tick(pages,batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++) for(const p of pages) await p.evaluate(()=>window.__dd.step(1/60,1)); await sleep(20); } }
async function tickUntil(pages,page,fn,arg,maxBatches=60){ for(let b=0;b<maxBatches;b++){ if(await page.evaluate(fn,arg)) return true; await tick(pages,1,3); } return !!(await page.evaluate(fn,arg)); }
const hostUp=(p,rc)=>p.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
const joinUp=(p,rc)=>p.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
const clearLoot=p=>p.evaluate(()=>{ window.__dd.loot.splice(0).forEach(l=>window.__dd.scene.remove(l.mesh)); });
const floor=p=>p.evaluate(()=>window.__dd.loot.map(l=>({lvl:l.it.lvl,r:l.it.rarity,name:l.it.name,mythic:!!l.it.mythic,named:l.it.named||null})));

// ==== pair A, map one: the phantom goblin, the loot, the defenses, the rejoin ====
const {p:host}=await open(), {p:guest}=await open();
const pair=[host,guest];
await sleep(4300);   // 65-tavernroom.js's one-shot new-player toast (real wall-clock) burns off before any toast is read

// ---- (6) the wave-zero goblin: "reset guide" in solo, and a page that started solo and then joins as a guest ----
const w0=await Promise.all(pair.map(p=>p.evaluate(()=>window.__trainer.w0().goblin)));
check("both pages start on the training ground with the wave-zero goblin walking",w0[0]&&w0[1],JSON.stringify(w0));
const reset=await host.evaluate(()=>{ const d=window.__dd, m=window.__meta, snap=()=>({xp:m.xp(),kills:d.S.kills,orbs:d.orbs.length,loot:d.loot.length});
  const b=snap(); window.__trainer.reset(); d.step(1/60,3); return {b,a:snap()}; });
check("solo 'reset guide' with the goblin walking pays nothing: no xp, no kill, no orb, no loot roll",JSON.stringify(reset.a)===JSON.stringify(reset.b),JSON.stringify(reset));
const rc="loot-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostUp(host,rc), gj=await joinUp(guest,rc);
check("host and guest connect ("+rc+")",hostOpen.err===null&&gj.err===null,JSON.stringify({hostOpen,gj}));
let guestId=gj.id;
await tick(pair,6,5);
const ph=await guest.evaluate(()=>({xp:window.__meta.xp(),kills:window.__dd.S.kills,orbs:window.__dd.orbs.length,loot:window.__dd.loot.length,goblin:window.__trainer.w0().goblin}));
check("the guest's own phantom goblin is gone, and quietly: xp 0, no kill, no orb (it used to be kill(): 2 xp)",!ph.goblin&&ph.xp===0&&ph.kills===0&&ph.orbs===0,JSON.stringify(ph));
// the host's own training goblin would die in the held wave below and muddy nothing, but it walks the lane: take it away, and skip the step so no other comes
await host.evaluate(()=>{ for(const e of window.__dd.enemies) if(e.training){ e.through=true; e.dead=.001; } window.__trainer.skip(); window.__dd.step(1/60,2); });
for(const p of pair) await p.evaluate(()=>{ window.__mythicDrops.set(0,0); window.__dd.setHero(500,500,0); });   // plain rolls first; both heroes far off so nothing is picked up
await tick(pair,2,3); for(const p of pair) await clearLoot(p);

// ---- (1) a guest's roll of the host's drops happens at the hall's wave ----
const N=400;
await host.evaluate(n=>{ const d=window.__dd; d.S.wave=9; for(let i=0;i<n;i++) d.dropLoot(d.rollItem(0),2,4.6,true); },N);
const gotAll=await tickUntil(pair,guest,n=>window.__dd.loot.length>=n,N,80);
const H=await floor(host), G=await floor(guest);
const lv=a=>[...new Set(a.map(i=>i.lvl))], hist=a=>a.reduce((h,i)=>{ h[i.r]=(h[i.r]||0)+1; return h; },{});
console.log("      host  rarity "+JSON.stringify(hist(H))+" levels "+JSON.stringify(lv(H))+" | guest rarity "+JSON.stringify(hist(G))+" levels "+JSON.stringify(lv(G)));
check("the guest gets its own roll of every one of the host's "+N+" drops",gotAll&&G.length===N,G.length);
check("...every one at the hall's level (the host holds wave 9: level 9, same as the host's own) -- it was level 1",G.length>0&&G.every(i=>i.lvl===9)&&H.every(i=>i.lvl===9),JSON.stringify({guest:lv(G),host:lv(H)}));
check("...with the hall's odds: epics and legendaries turn up for the guest too (zero weight below wave 3 and 6)",G.some(i=>i.r>=3),JSON.stringify(hist(G)));
check("...and Void set pieces (none can drop below wave 4)",G.some(i=>/ of the Void$/.test(i.name)),G.filter(i=>/ of the /.test(i.name)).length+" set pieces");
const gw=await guest.evaluate(()=>({wave:window.__dd.S.wave,eff:window.__dd.effWave()}));
check("the guest's own wave is put back after each roll (borrowed, never kept)",gw.wave===0&&gw.eff===0,JSON.stringify(gw));
for(const p of pair) await clearLoot(p);
// the guest's own 7% mythic turn-up (forced to always here) is made on the hall's level
await guest.evaluate(()=>window.__mythicDrops.set(1,0));
await host.evaluate(()=>{ const d=window.__dd; for(let i=0;i<12;i++) d.dropLoot(d.rollItem(0),2,4.6,true); });
await tickUntil(pair,guest,()=>window.__dd.loot.length>=12,null,40);
const GM=(await floor(guest)).filter(i=>i.mythic);
check("a guest's own mythic turn-up is rolled at the hall's level (9), not level 1",GM.length>0&&GM.every(i=>i.lvl===9&&i.r===5),JSON.stringify(GM.map(i=>i.lvl+"/"+i.r)));
for(const p of pair) await clearLoot(p);

// a REAL held wave: the crystal's reward, the Forest thanks and the named mythic (forced to always on the guest) at the hall's wave
await guest.evaluate(()=>window.__mythicDrops.set(0,1)); await host.evaluate(()=>window.__mythicDrops.set(0,0));
const bag0=await guest.evaluate(()=>window.__meta.bag().length);
const held=await host.evaluate(()=>{ const d=window.__dd; d.S.wave=5; d.S.phase='build'; d.startWave(); let g=0; while(d.S.phase==='wave'&&g++<900){ d.step(1/60,5); for(const e of d.enemies) if(!e.dead) d.kill(e); } return {phase:d.S.phase,wave:d.S.wave,eff:d.effWave()}; });
check("the host really held wave 6",held.phase==='build'&&held.wave===6,JSON.stringify(held));
const gotNamed=await tickUntil(pair,guest,()=>window.__dd.loot.some(l=>l.it.named),null,60);
await tick(pair,4,3);
const HW=await floor(host), GW=await floor(guest);
const forest=await guest.evaluate(b0=>window.__meta.bag().slice(b0).filter(it=>/ of the Forest$/.test(it.name)).map(it=>it.lvl),bag0);
check("the held wave's reward is level 6 on both floors",HW.length>0&&GW.length>0&&HW.every(i=>i.lvl===6)&&GW.every(i=>i.lvl===6),JSON.stringify({host:lv(HW),guest:lv(GW)}));
check("the guest's own named mythic (its own 5%, forced here) comes out at the hall's level 6 -- it was level 1",gotNamed&&GW.some(i=>i.named&&i.lvl===6),JSON.stringify(GW.filter(i=>i.named)));
check("the guest's Forest thanks from the held wave (straight into its bag) are level 6 too",forest.length>0&&forest.every(l=>l===6),JSON.stringify(forest));
check("...and the guest's wave is its own again afterwards",await guest.evaluate(()=>window.__dd.S.wave===0));
for(const p of pair){ await p.evaluate(()=>window.__mythicDrops.set(.07,.05)); await clearLoot(p); }

// ---- (3) selling: a guest sells only what it built; repair and upgrade stay open ----
await host.evaluate(()=>{ const d=window.__dd; d.S.wave=0; d.S.phase='build'; });
const seat=await guest.evaluate(()=>window.__lobby.seat());
check("the host knows the guest's lobby seat from its input",await host.evaluate(id=>window.__combat.seatOf(id),guestId)===seat,seat);
const hostDef=await host.evaluate(()=>{ const d=window.__dd.placeDefAt('harpoon',-1.1,9.4,0); return d?{x:d.x,z:d.z}:null; });
await guest.evaluate(()=>window.__dd.setHero(0,7.6,0)); await tick(pair,8,5);
const pool=()=>host.evaluate(id=>window.__combat.guestMana(id),guestId);
const toastOf=p=>p.evaluate(()=>document.getElementById('toast').textContent);
const blank=p=>p.evaluate(()=>{ document.getElementById('toast').textContent=''; });
const p0=await pool(); await blank(guest);
await guest.evaluate(()=>window.__dd.sell()); await tick(pair,6,5);
const s1={defs:await host.evaluate(()=>window.__dd.defs.length),pool:await pool(),toast:await toastOf(guest)};
check("a guest can't sell the host's defense: it stays, the guest's pool doesn't move, and the guest is told why",!!hostDef&&s1.defs===1&&s1.pool===p0&&/teammate/i.test(s1.toast),JSON.stringify({hostDef,p0,s1}));
await host.evaluate(()=>{ window.__dd.defs[0].hp=10; });
await guest.evaluate(()=>window.__dd.repair()); await tick(pair,6,5);
const r1={hp:await host.evaluate(()=>window.__dd.defs[0].hp),max:await host.evaluate(()=>window.__dd.defs[0].max),pool:await pool()};
check("...but repairing a teammate's defense is still welcome (healed, paid from the guest's own pool)",r1.hp===r1.max&&r1.pool<p0,JSON.stringify(r1));

// ---- (4) no defense actions once the hall has fallen or held ----
await host.evaluate(()=>{ window.__dd.defs[0].hp=10; window.__dd.S.phase='dead'; });
const p1=await pool(); await blank(guest);
await guest.evaluate(()=>window.__dd.repair());
for(let i=0;i<30;i++){ await guest.evaluate(()=>window.__dd.step(1/60,1)); await sleep(15); }   // the host's hall is over (its update no longer runs the sim); only the message pump matters
const d1={hp:await host.evaluate(()=>window.__dd.defs[0].hp),pool:await pool(),toast:await toastOf(guest)};
await host.evaluate(()=>{ window.__dd.S.phase='build'; window.__dd.defs[0].hp=window.__dd.defs[0].max; });
check("after the hall fell, a guest's repair is refused ('Not right now'): no heal, no mana spent",d1.hp===10&&d1.pool===p1&&/not right now/i.test(d1.toast),JSON.stringify(d1));

// the guest builds its own, and may sell it
await guest.evaluate(()=>window.__net.send('place',{kind:'harpoon',x:2.6,z:9.4,yaw:0})); await tick(pair,6,5);
const own=await host.evaluate(({id,seat})=>{ const d=window.__dd.defs.find(d=>d.ownerId===id); return d?{x:d.x,z:d.z,seat:d.ownerSeat===seat,spent:d.spent}:null; },{id:guestId,seat});
check("the guest's own defense is placed, owned by the guest and marked with its seat",!!own&&own.seat,JSON.stringify(own));

// ---- (5) leave and rejoin: the pool and the defense come back ----
const before=await pool();
await guest.evaluate(()=>window.__net.leave()); await tick(pair,4,5);
const kept=await host.evaluate(s=>window.__combat.seatKept(s),seat);
check("when the guest leaves, the host keeps its pool under its seat",kept===before,JSON.stringify({before,kept}));
const gj2=await joinUp(guest,rc); await tick(pair,8,5);
const oldId=guestId; guestId=gj2.id;
const back={pool:await pool(),old:await host.evaluate(id=>window.__combat.guestMana(id),oldId),kept:await host.evaluate(s=>window.__combat.seatKept(s),seat),owner:await host.evaluate(o=>{ const d=window.__dd.defs.find(d=>Math.abs(d.x-o.x)<.01&&Math.abs(d.z-o.z)<.01); return d?d.ownerId:null; },own)};
check("rejoining (a new peer id) gives back the same pool -- no free refill to 260, no savings lost",gj2.err===null&&guestId!==oldId&&back.pool===before&&back.pool!==260&&back.old===null&&back.kept===null,JSON.stringify({before,back}));
check("...and the guest's defense is its own again (its gear, and it may sell it)",back.owner===guestId,JSON.stringify(back.owner));
await guest.evaluate(o=>window.__dd.setHero(o.x,o.z-1.4,0),own); await tick(pair,10,5);
const p2=await pool(); await guest.evaluate(()=>window.__dd.sell()); await tick(pair,6,5);
const s2={pool:await pool(),gone:await host.evaluate(o=>!window.__dd.defs.some(d=>Math.abs(d.x-o.x)<.01&&Math.abs(d.z-o.z)<.01),own)};
check("the rejoined guest sells its own defense: gone, and 70% of what it cost comes back to its pool",s2.gone&&Math.abs(s2.pool-(p2+Math.round(own.spent*.7)))<.05,JSON.stringify({p2,s2,spent:own.spent}));
// the host may sell anyone's
await guest.evaluate(()=>window.__net.send('place',{kind:'harpoon',x:2.6,z:9.4,yaw:0})); await tick(pair,6,5);
const hs=await host.evaluate(id=>{ const d=window.__dd; const t=d.defs.find(x=>x.ownerId===id); if(!t) return null; const m0=d.S.mana; d.setHero(t.x+1.2,t.z,0); d.step(1/60,1); d.sell(); d.step(1/60,1); const m1=d.S.mana; d.setHero(500,500,0); return {sold:!d.defs.includes(t),gain:m1-m0,back:Math.round(t.spent*.7)}; },guestId);
check("the host may sell a guest's defense (its hall); the refund is the seller's, as before",!!hs&&hs.sold&&hs.gain===hs.back,JSON.stringify(hs));

// the same tab back on a new id before its old link was given up on (another page carrying the same seat stands in for it)
const pNow=await pool();
const {p:twin}=await open("",{fn:s=>{ try{ sessionStorage.setItem('ddLobbySeat',s); }catch(e){} },arg:seat});
check("the stand-in page carries the guest's seat",await twin.evaluate(()=>window.__lobby.seat())===seat);
const tj=await joinUp(twin,rc); await tick([host,guest,twin],8,5);
const twinFresh=await host.evaluate(id=>window.__combat.guestMana(id),tj.id);
await guest.evaluate(()=>window.__net.leave()); await tick([host,twin],6,5);
const twinAfter=await host.evaluate(id=>window.__combat.guestMana(id),tj.id), keptAfter=await host.evaluate(s=>window.__combat.seatKept(s),seat);
check("...it starts at the hall's baseline, and when the old link goes, the old pool joins it instead of being set aside",tj.err===null&&twinFresh===260&&twinAfter===pNow&&keptAfter===null,JSON.stringify({pNow,twinFresh,twinAfter,keptAfter}));

// ==== pair B, the Throne Room (map two, campaign waves 8-14): the HALL HELD payout ====
const cleared={fn:()=>{ try{ if(!localStorage.getItem('ddMapsCleared')) localStorage.setItem('ddMapsCleared','3'); }catch(e){} }};
const {p:h2}=await open("&map=1",cleared), {p:g2}=await open("&map=1",cleared);
const maps=await Promise.all([h2,g2].map(p=>p.evaluate(()=>window.__dd.map())));
check("both pages are on the second map",maps[0].index===1&&maps[1].index===1&&maps[0].wbase>0,JSON.stringify(maps.map(m=>[m.index,m.name,m.wbase,m.waves])));
const rc2="loot2-"+Math.random().toString(36).slice(2,8);
const b1=await hostUp(h2,rc2), b2=await joinUp(g2,rc2);
check("the second pair connects",b1.err===null&&b2.err===null,JSON.stringify({b1,b2}));
for(const p of [h2,g2]) await p.evaluate(()=>window.__dd.setHero(500,500,0));
await tick([h2,g2],4,5);
const gold0=await g2.evaluate(()=>window.__meta.gold());
const won=await h2.evaluate(()=>{ const d=window.__dd; d.S.wave=d.map().waves-1; d.S.phase='build'; d.startWave(); let g=0; while(d.S.phase==='wave'&&g++<900){ d.step(1/60,5); for(const e of d.enemies) if(!e.dead) d.kill(e); } return {phase:d.S.phase,held:d.S.held,eff:d.effWave()}; });
const want=25*won.eff+150;
// build 160: the map is paid at HALL HELD, the host's and the guests' alike, and the run ends at the host's ▶ MOVE ON (the victory lap between)
const paidHeld=await tickUntil([h2,g2],g2,x=>window.__meta.gold()>=x,gold0+want,60);
const hostPay=await h2.evaluate(()=>window.__meta.summary().payout), goldHeld=await g2.evaluate(()=>window.__meta.gold());
await h2.evaluate(()=>window.__dd.moveOn());
let seen=false; for(let i=0;i<60&&!seen;i++){ await tick([h2,g2],1,2); seen=await g2.evaluate(()=>window.__dd.S.phase==='won'); }
const deadp=await g2.evaluate(()=>document.getElementById('deadp').textContent), gold1=await g2.evaluate(()=>window.__meta.gold());
check("holding the Throne Room pays the guest what it pays the host: 25 x the campaign wave + 150 = "+want+" (it paid 25 x the map's wave)",won.phase==='build'&&won.held&&paidHeld&&seen&&hostPay===want&&new RegExp('\\+'+want+' ● gold for the run').test(deadp)&&gold1-gold0>=want&&gold1===goldHeld,JSON.stringify({won,hostPay,deadp,gain:gold1-gold0,atHeld:goldHeld-gold0}));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
