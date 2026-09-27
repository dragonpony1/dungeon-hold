// ===== CO-OP GUIDE (build 150): "the tutorial gets stuck in multiplayer". A guest spawns no wave-zero goblin of its own (that
// phantom could never die), its steps watch the synced lists (a death, a defs row, the host's phase), Enter skips a tip that
// cannot tick on its side, the host's locker never holds the wave with guests in the hall, a held hall counts for the guest.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer; try { ({ PeerServer } = await import("peer")); } catch(e) { console.log("SKIP co-op suite — the `peer` package isn't installed"); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9477; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>setTimeout(r,300)); const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const PORT=8886; const server=await serve(PORT);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext(); const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate&map=0",{timeout:240000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__trainer&&window.__gsfx&&window.__defsync&&window.__forest,null,{timeout:180000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__trainer.reset(); try{ localStorage.removeItem('ddMapsCleared'); localStorage.removeItem('dd_forest_locker'); }catch(e){} window.__dd.start(); window.__dd.step(1/60,30); });
const roomCode="guide-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
const g1=await guestPage.evaluate(()=>{ const d=window.__dd; d.step(1/60,120); return {step:window.__trainer.step(),enemies:d.enemies.filter(e=>!e.dead).length,coop:window.__trainer.coop(),text:window.__trainer.text()}; });
check("a guest spawns no wave-zero goblin of its own and its guide carries the co-op hint (Enter skips)",g1.enemies===0&&g1.step==="slay"&&g1.coop.guest===true&&/skip/.test(g1.text),JSON.stringify(g1));
const h1=await hostPage.evaluate(()=>{ const d=window.__dd; d.step(1/60,120); return {step:window.__trainer.step(),w0:window.__trainer.w0(),coop:window.__trainer.coop()}; });
check("the host runs wave zero as ever: its training goblin walks the lane",h1.step==="slay"&&h1.w0.goblin===true&&h1.coop.role==="host",JSON.stringify(h1));
await hostPage.evaluate(()=>{ const d=window.__dd; const e=d.enemies.find(e=>e.training&&!e.dead); if(e) d.kill(e); d.step(.1,12); });
const g2=await guestPage.waitForFunction(()=>window.__trainer.waiting()&&window.__gsfx().die>0,null,{timeout:40000,polling:100}).then(()=>true).catch(()=>false);
const hostW=await hostPage.evaluate(()=>window.__trainer.waiting());
check("the kill ticks 'slay' on both sides (the guest's from the synced death)",g2&&hostW,JSON.stringify({guestWaiting:g2,hostWaiting:hostW,guest:await guestPage.evaluate(()=>({step:window.__trainer.step(),die:window.__gsfx().die}))}));
await guestPage.keyboard.press("Enter"); await hostPage.keyboard.press("Enter"); await guestPage.waitForTimeout(150);
await hostPage.evaluate(()=>{ const d=window.__dd; d.S.mana=999; const h=d.hero; let ok=false; for(let dz=3;dz<=12&&!ok;dz++) for(let dx=-6;dx<=6&&!ok;dx++){ try{ d.placeDefAt('harpoon',h.x+dx,h.z+dz,0); }catch(e){} ok=d.defs.length>0; } d.step(.1,12); });
const g3=await guestPage.waitForFunction(()=>window.__trainer.waiting()&&window.__trainer.state().done.ballista===true,null,{timeout:40000,polling:100}).then(()=>true).catch(()=>false);   // ticked: the card holds its ✓ for Enter (step() already names the next tip)
check("the host's ballista ticks the guest's 'ballista' step (from the synced defs list)",g3,await guestPage.evaluate(()=>JSON.stringify({step:window.__trainer.step(),waiting:window.__trainer.waiting(),defs:window.__defsync.list().length})));
await guestPage.keyboard.press("Enter"); await guestPage.waitForTimeout(200);
const g4a=await guestPage.evaluate(()=>({step:window.__trainer.step(),waiting:window.__trainer.waiting()}));
await guestPage.keyboard.press("Enter"); await guestPage.waitForTimeout(200);
const g4=await guestPage.evaluate(()=>({step:window.__trainer.step(),waiting:window.__trainer.waiting(),done:window.__trainer.state().done}));
check("on the guest, Enter on a tip that cannot tick yet skips it (horn -> orb): the guide never holds anyone",g4a.step==="horn"&&!g4a.waiting&&g4.step==="orb"&&g4.done.horn===true,JSON.stringify({g4a,g4}));
// the hall's thanks in co-op (build 150): personal, straight into each player's bag, topped up on every later wave
const held=async w=>{ await hostPage.evaluate(w=>{ window.__dd.Meta.onWaveHeld(w); window.__dd.step(.1,6); },w); await guestPage.waitForTimeout(600); };
const forestCount=p=>p.evaluate(()=>({bag:window.__meta.bag().filter(it=>/of the Forest$/.test(it.name)).length,floor:window.__dd.loot.filter(l=>l.it&&/of the Forest$/.test(l.it.name)).length,owned:Object.keys(window.__forest.owned()).length}));   // Forest pieces on the floor only: a slain goblin may drop an ordinary piece
await held(1); const f1={host:await forestCount(hostPage),guest:await forestCount(guestPage)};
await held(2); const f2={host:await forestCount(hostPage),guest:await forestCount(guestPage)};
await guestPage.evaluate(()=>{ const b=window.__meta.bag(); const i=b.findIndex(it=>/of the Forest$/.test(it.name)); if(i>=0) b.splice(i,1); });
await held(3); const f3={host:await forestCount(hostPage),guest:await forestCount(guestPage)};
check("wave 1 held: two Forest pieces straight into the host's bag AND two into the guest's, none on the floor for a teammate to grab",f1.host.bag===2&&f1.guest.bag===2&&f1.host.floor===0,JSON.stringify(f1));
check("wave 2 held: four each",f2.host.owned===4&&f2.guest.owned===4,JSON.stringify(f2));
check("wave 3 held: a guest that lost a piece is topped back up to four; the host, already at four, gets nothing more",f3.guest.owned===4&&f3.host.owned===4&&f3.host.bag===4,JSON.stringify(f3));
await hostPage.evaluate(()=>{ localStorage.setItem('dd_forest_locker',JSON.stringify({item:{id:'lk1',name:'Bark Coat of the Forest',slot:'armor',rarity:1,lvl:1,tier:1,stats:{hp:5},value:10},taken:false})); window.__dd.startWave(); window.__dd.step(1/60,5); });
const h5=await hostPage.evaluate(()=>({phase:window.__dd.S.phase,pending:window.__forest.lockerPending(),peers:window.__net.peers().length}));
check("a host with guests in the hall sounds the horn even with a Forest piece waiting in its locker",h5.phase==="wave"&&h5.pending&&h5.peers>=1,JSON.stringify(h5));
const g5=await guestPage.waitForFunction(()=>{ const w=window.__net.world(); return !!(w&&w.phase==="wave"); },null,{timeout:30000,polling:100}).then(()=>true).catch(()=>false);
check("the host's phase reaches the guest (what the guide's horn step reads on a guest)",g5,await guestPage.evaluate(()=>JSON.stringify(window.__net.world()&&{phase:window.__net.world().phase})));
await hostPage.evaluate(()=>{ window.__dd.winMap(); window.__dd.step(.1,8); });
const g6=await guestPage.waitForFunction(()=>(parseInt(localStorage.getItem('ddMapsCleared'))||0)>=1,null,{timeout:30000,polling:100}).then(()=>true).catch(()=>false);
check("holding the hall counts for the guest too (ddMapsCleared -> 1: the next room and the other heroes open for them)",g6,await guestPage.evaluate(()=>String(localStorage.getItem('ddMapsCleared'))));
const h7=await hostPage.evaluate(()=>{ window.__trainer.reset(); return {step:window.__trainer.step(),w0:window.__trainer.w0(),counts:window.__trainer.counts(),done:Object.keys(window.__trainer.state().done).length}; });
check("reset guide starts over: step one again, wave zero and the counters cleared",h7.step==="slay"&&h7.w0.kills===0&&h7.w0.spawned===false&&h7.counts.orbs===0&&h7.done===0,JSON.stringify(h7));
const lite={host:await hostPage.evaluate(()=>window.__hideout.lite()),guest:await guestPage.evaluate(()=>window.__hideout.lite()),guestPre:await guestPage.evaluate(()=>window.__hideout.preloaded())};
check("co-op pages take the lite hideout (never preloaded or kept alive behind a hall full of puppets; torn down on the way out)",lite.host===true&&lite.guest===true&&lite.guestPre===false,JSON.stringify(lite));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(0);
