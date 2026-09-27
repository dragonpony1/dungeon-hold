// ===== CO-OP SOUNDS ON A GUEST (build 147): "I couldn't hear any of the sound effects" as a guest. Nearly every sound is the
// host's own simulation, none of which runs on a guest; 99-network.js now derives the big ones from the synced lists and
// counts them in window.__gsfx: the horn when the host's phase turns to wave, the held fanfare when it turns back, the
// crystal's hit when its hp drops, a placement or an upgrade when the defs list gains a row or a mark, a death for each
// mob the host reports dead. Host and guest on a local signaling server, as coop-test.mjs does.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer; try { ({ PeerServer } = await import("peer")); } catch(e) { console.log("SKIP coopsfx-test.mjs — the `peer` package isn't installed"); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9475; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>setTimeout(r,300)); const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const PORT=8898; const server=await serve(PORT);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext(); const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate",{timeout:240000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__party&&window.__gsfx,null,{timeout:180000}); }
await hostPage.evaluate(()=>{ window.__dd.start(); window.__dd.setHero(0,10,0); window.__dd.step(1/60,5); }); await guestPage.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); });
const roomCode="sfx-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
const sfx=()=>guestPage.evaluate(()=>window.__gsfx());
await guestPage.waitForFunction(()=>{ const g=window.__gsfx(); return g.phase!==null&&g.defsSeen; },null,{timeout:20000,polling:100}).catch(()=>{});   // the first world and defs lists have arrived: the hall as found, no sounds for that
const s0=await sfx();
check("nothing sounds for the hall as first found (no horn, placement or death on the first lists)",s0.horn===0&&s0.place===0&&s0.die===0&&s0.crystal===0&&s0.phase==='build',JSON.stringify(s0));
// a placement on the host
await hostPage.evaluate(()=>{ const d=window.__dd; d.S.mana=999; const h=d.hero; let ok=false; for(let dz=3;dz<=12&&!ok;dz++) for(let dx=-6;dx<=6&&!ok;dx++){ try{ d.placeDefAt('harpoon',h.x+dx,h.z+dz,0); }catch(e){} ok=d.defs.length>0; } d.step(.1,8); });   // a few tenth-second steps: the defs list goes out on the host's tick every half second, and under the software renderer a real frame can take seconds
const gotPlace=await guestPage.waitForFunction(()=>window.__gsfx().place>=1,null,{timeout:20000,polling:100}).then(()=>true).catch(()=>false);
const placeInfo={hostDefs:await hostPage.evaluate(()=>window.__dd.defs.length),guestPuppets:await guestPage.evaluate(()=>window.__defsync.list().length)};
check("a defense the host sets down sounds its placement on the guest",gotPlace,JSON.stringify(Object.assign(await sfx(),placeInfo)));
// an upgrade
await hostPage.evaluate(()=>{ const d=window.__dd; d.defs[0].lvl=2; d.step(.1,8); });
const gotUp=await guestPage.waitForFunction(()=>window.__gsfx().upgrade>=1,null,{timeout:20000,polling:100}).then(()=>true).catch(()=>false);
check("a mark up on the host sounds on the guest",gotUp,JSON.stringify(await sfx()));
// the horn
await hostPage.evaluate(()=>{ window.__dd.startWave(); window.__dd.step(1/60,3); });
const gotHorn=await guestPage.waitForFunction(()=>window.__gsfx().horn>=1&&window.__gsfx().phase==='wave',null,{timeout:8000,polling:100}).then(()=>true).catch(()=>false);
check("the host's horn sounds on the guest when the phase turns to wave",gotHorn,JSON.stringify(await sfx()));
// a death: a goblin the guest has seen, then killed on the host
await hostPage.evaluate(()=>{ const d=window.__dd; const e=d.spawn('goblin','N'); e.x=d.hero.x+3; e.z=d.hero.z+3; window.__sfxGob=e; d.step(1/60,3); });
await guestPage.waitForFunction(()=>window.__mobsync.list().length>=1,null,{timeout:15000,polling:100}).catch(()=>{});   // the guest has seen the goblin
await hostPage.evaluate(()=>{ const d=window.__dd; d.kill(window.__sfxGob); d.step(1/60,3); });
const gotDie=await guestPage.waitForFunction(()=>window.__gsfx().die>=1,null,{timeout:8000,polling:100}).then(()=>true).catch(()=>false);
check("a goblin killed on the host sounds its death on the guest",gotDie,JSON.stringify(await sfx()));
// the crystal hit
await hostPage.evaluate(()=>{ window.__dd.hurtCrystal(10); window.__dd.step(1/60,3); });
const gotCry=await guestPage.waitForFunction(()=>window.__gsfx().crystal>=1,null,{timeout:8000,polling:100}).then(()=>true).catch(()=>false);
check("the crystal taking a hit on the host sounds (and rings the alarm) on the guest",gotCry,JSON.stringify(await sfx()));
// the wave held: kill everything the wave sends until the host's phase is build again
await hostPage.evaluate(async()=>{ const d=window.__dd; for(let i=0;i<400&&d.S.phase==='wave';i++){ for(const e of d.enemies) if(!e.dead) d.kill(e); d.step(1/60,10); if(i%10===0) await new Promise(r=>setTimeout(r,0)); } });
const gotHeld=await guestPage.waitForFunction(()=>window.__gsfx().held>=1,null,{timeout:15000,polling:100}).then(()=>true).catch(()=>false);
check("the wave held sounds its fanfare on the guest when the phase turns back to build",gotHeld,JSON.stringify(await sfx()));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close(); sig.close&&sig.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.some(r=>!r)?1:0);
