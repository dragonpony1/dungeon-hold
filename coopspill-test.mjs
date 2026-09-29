// ===== CO-OP: SPILL YOUR MANA (99-network.js, build 259). Matt: "I still want mana to fall on the ground. Picking it up and hearing the tinkling is part of it. So don't auto mana anything. But if tap left alt all my mana spills on
// the floor for anyone to pick up". Nothing is paid automatically (build 257's gift is gone); tapping Left Alt pours ALL of your mana out as ordinary orbs, each carrying its own value, for anyone to pick up, and what is
// picked up is exactly what came out. The host's tap pours its own mana; a guest's asks the host, which pours that guest's pool at the guest's spot. Not in a solo run.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coopspill-test.mjs: the peer package is not installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const near=(a,b,eps)=>Math.abs(a-b)<=eps;
const sigPort=9473; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" }; const server=await serve(8899);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostPage=await (await browser.newContext()).newPage(), guestPage=await (await browser.newContext()).newPage(); const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));
// solo first: Left Alt does nothing without a co-op room
await hostPage.goto("http://127.0.0.1:8899/?silent&nogate",{timeout:90000}); await hostPage.waitForFunction(()=>window.__dd&&window.__net&&window.__combat&&window.__pickupsync,null,{timeout:60000});
await hostPage.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); try{ window.__trainer.skip(); }catch(e){} window.__dd.addMana(40); });   // the Training Ground guide lends mana to a broke player: not here
const solo=await hostPage.evaluate(()=>{ const d=window.__dd, m0=d.status().mana, o0=d.orbs.length; window.dispatchEvent(new KeyboardEvent("keydown",{code:"AltLeft",key:"Alt",bubbles:true,cancelable:true})); return { m0, m1:d.status().mana, o0, o1:d.orbs.length }; });
check("alone (no co-op room) a Left Alt tap spills nothing",solo.m1===solo.m0&&solo.o1===solo.o0,JSON.stringify(solo));
await guestPage.goto("http://127.0.0.1:8899/?silent&nogate",{timeout:90000}); await guestPage.waitForFunction(()=>window.__dd&&window.__net&&window.__combat&&window.__pickupsync,null,{timeout:60000});
await guestPage.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); try{ window.__trainer.skip(); }catch(e){} });
const roomCode="spill-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin})); const guestId=guestJoin.id;
async function tickBoth(batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); } }
async function walkGuestTo(tx,tz,maxBatches=60){ for(let b=0;b<maxBatches;b++){ const g=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId); if(!g) return false; const dx=tx-g.x, dz=tz-g.z, d=Math.hypot(dx,dz); if(d<0.6){ await guestPage.evaluate(()=>window.__dd.setKeys({w:0})); return true; } const yaw=Math.atan2(dx,dz); await guestPage.evaluate(y=>{ window.__dd.setCam(y,.42,8); window.__dd.setKeys({w:1}); },yaw); await tickBoth(1,5); } await guestPage.evaluate(()=>window.__dd.setKeys({w:0})); return false; }
const tap=p=>p.evaluate(()=>window.dispatchEvent(new KeyboardEvent("keydown",{code:"AltLeft",key:"Alt",bubbles:true,cancelable:true})));
await hostPage.evaluate(()=>{ const d=window.__dd; d.addMana(-d.status().mana); for(let i=0;i<10;i++) d.step(1/60,1); d.addMana(300-d.status().mana); });   // the Training Ground guide lends 60 once when a broke player would need a ballista: let it (it will not again), then a known 300
await hostPage.evaluate(()=>{ const d=window.__dd; d.enemies.forEach(e=>{ e.dead=1; }); d.enemies.length=0; d.orbs.slice().forEach(o=>d.scene.remove(o.mesh)); d.orbs.length=0; d.setHero(500,0,500); }); await tickBoth(6,5); await guestPage.waitForTimeout(500);
// nothing is paid automatically: a kill leaves its orbs and the guest's pool does not move
const base=await hostPage.evaluate(id=>window.__combat.guestMana(id),guestId);
await hostPage.evaluate(()=>{ const d=window.__dd; const e=d.spawn("goblin","N"); e.x=0; e.z=-40; e.y=0; e.hp=1; d.kill(e); }); await tickBoth(4,10);
const afterKill=await hostPage.evaluate(id=>window.__combat.guestMana(id),guestId);
check("nothing is auto-paid: a kill leaves orbs on the floor and the guest's pool does not move",afterKill===base,JSON.stringify({base,afterKill}));
// the host taps: all of its mana pours out as orbs whose values add up to it
await hostPage.evaluate(()=>{ const d=window.__dd; d.orbs.slice().forEach(o=>d.scene.remove(o.mesh)); d.orbs.length=0; d.setHero(0,-25,0); });
const h=await hostPage.evaluate(()=>{ const d=window.__dd; const A=d.status().mana; window.__spillA=A; window.dispatchEvent(new KeyboardEvent("keydown",{code:"AltLeft",key:"Alt",bubbles:true,cancelable:true})); const vals=d.orbs.map(o=>o.val); return { A, after:d.status().mana, n:d.orbs.length, sum:+vals.reduce((a,b)=>a+(b||0),0).toFixed(1), allVal:vals.every(v=>typeof v==="number"&&v>0) }; });
check("the host's Left Alt tap empties its pool onto the floor as orbs that carry exactly that much (about 6.3 each)",h.after===0&&h.n===Math.ceil(h.A/6.3)&&near(h.sum,h.A,.15)&&h.allVal,JSON.stringify(h));
const held=await hostPage.evaluate(()=>{ const d=window.__dd; const m0=d.status().mana; for(let i=0;i<60;i++) d.step(1/60,1); return { m0, m1:d.status().mana, n:d.orbs.length }; });
check("the spiller standing on its own spill does NOT get it straight back (it is held for 4 seconds so someone else can reach it)",held.m1===held.m0&&held.n>0,JSON.stringify(held));
await hostPage.evaluate(()=>window.__dd.setHero(500,0,500)); await tickBoth(4,10);   // the host walks away; the orbs land on the guest's screen as puppets too
const seen=await guestPage.evaluate(()=>window.__pickupsync.orbs().length);
check("the guest sees the spilled orbs on its own floor",seen>=h.n,JSON.stringify({seen,n:h.n}));
// the host picks one up: exactly its value, whatever its mana stat
const p1=await hostPage.evaluate(()=>{ const d=window.__dd; for(let i=0;i<200;i++) d.step(1/60,1); const o=d.orbs[0]; d.setHero(o.x,o.z); const m0=d.status().mana; for(let i=0;i<30;i++) d.step(1/60,1); return { val:o.val, gained:+(d.status().mana-m0).toFixed(1) }; });
check("picking up spilled orbs gives exactly their value: whole multiples of one orb (the ones lying close together come along)",p1.gained>=p1.val-.11,JSON.stringify(p1));
// the guest taps with 50 in its pool: the host pours it at the guest's spot
await hostPage.evaluate(()=>{ const d=window.__dd; d.orbs.slice().forEach(o=>d.scene.remove(o.mesh)); d.orbs.length=0; d.setHero(500,0,500); }); await hostPage.evaluate(id=>window.__combat.setGuestMana(id,50),guestId); await tickBoth(4,5);
const gpos=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
await tap(guestPage); await tickBoth(6,5);
const g=await hostPage.evaluate(id=>{ const d=window.__dd; const vals=d.orbs.map(o=>o.val); return { pool:window.__combat.guestMana(id), n:d.orbs.length, sum:+vals.reduce((a,b)=>a+(b||0),0).toFixed(1), first:d.orbs[0]?{x:d.orbs[0].x,z:d.orbs[0].z,val:d.orbs[0].val}:null }; },guestId);
check("a guest's Left Alt tap empties ITS pool and the host pours that mana as orbs at the guest's spot (50 in, 50 on the floor)",g.pool===0&&near(g.sum,50,.15)&&g.n===Math.ceil(50/6.3)&&g.first&&Math.hypot(g.first.x-gpos.x,g.first.z-gpos.z)<8,JSON.stringify({g,gpos}));
// anyone can pick it up (the spiller herself only after the 4-second hold): the guest walks onto one and gets its value into its own pool
await hostPage.evaluate(()=>{ for(let i=0;i<300;i++) window.__dd.step(1/60,1); });   // past the 4 second hold: the guest may collect its own pile too (it asked while it was held, was told to ask again, and does)
const o=await hostPage.evaluate(()=>{ const x=window.__dd.orbs[0]; return x?{x:x.x,z:x.z,val:x.val}:null; }); const before=await hostPage.evaluate(id=>window.__combat.guestMana(id),guestId);
const walked=o&&await walkGuestTo(o.x,o.z); await tickBoth(6,5); await guestPage.waitForTimeout(1300); await tickBoth(6,5); const after=await hostPage.evaluate(id=>window.__combat.guestMana(id),guestId);
check("a spilled orb pays the guest who walks onto it exactly its value, into that guest's own pool (the walk may take a few more with it)",walked&&after-before>=o.val-.11,JSON.stringify({o,before,after,walked,orbsLeft:await hostPage.evaluate(()=>window.__dd.orbs.length),guestAt:await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId)}));
// a guest with nothing to spill spills nothing
await hostPage.evaluate(id=>window.__combat.setGuestMana(id,0.4),guestId); await guestPage.waitForTimeout(1100); await hostPage.evaluate(()=>{ const d=window.__dd; d.orbs.slice().forEach(o=>d.scene.remove(o.mesh)); d.orbs.length=0; d.spawn&&0; }); await tickBoth(3,5); const orbsBefore=await hostPage.evaluate(()=>window.__dd.orbs.length); await tap(guestPage); await tickBoth(4,5);
const none=await hostPage.evaluate(id=>({ pool:window.__combat.guestMana(id), orbs:window.__dd.orbs.length }),guestId);
check("a guest with (almost) nothing spills nothing more",none.orbs===orbsBefore&&none.pool===0.4,JSON.stringify({none,orbsBefore}));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(0);
