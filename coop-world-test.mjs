// ===== CO-OP (phase 5, crystal/wave slice): a guest is helping the host defend ONE hall, not tracking a private
// one of their own — this suite proves the host's real crystal HP and wave/phase reach the guest's own HUD
// (window.__world.host(), and the actual DOM the player would see: #cbar's width, #wavet/#phaset text), and that
// a guest calling startWave() on their own page is a no-op (that's the host's call, per the same override trick
// every hook in this codebase already uses rather than editing game.js's own functions).
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-world-test.mjs — the `peer` package isn't installed (npm i peer) — this suite needs a local signaling server to test a real handshake without reaching the public broker."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9454;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8878);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));

for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8878/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__world,null,{timeout:60000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); });

const roomCode="coopw-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));

// the host's real hall takes a hit and starts a wave -- window.__dd.hurtCrystal drives real damage without needing
// an actual mob to land one, and startWave puts the host into the 'wave' phase with a real wave number
await hostPage.evaluate(()=>{ window.__dd.hurtCrystal(30); window.__dd.startWave(); });
const hostStatus=await hostPage.evaluate(()=>window.__dd.status());
check("host's own hall actually changed (sanity check before checking the guest saw it)",
  hostStatus.crystal===270&&hostStatus.wave===1 /* map one's crystal is 300 since build 134 */&&hostStatus.phase==='wave',JSON.stringify(hostStatus));

for(let i=0;i<20;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }   // enough host ticks for the 10Hz world broadcast to fire
for(let i=0;i<20;i++){ await guestPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }   // guest receives it

const guestWorld=await guestPage.evaluate(()=>window.__world.host());
check("guest's synced world state matches the host's real crystal HP and wave",
  guestWorld&&guestWorld.crystal===270&&guestWorld.crystalMax===300 /* map one's crystal is 300 since build 134 */&&guestWorld.wave===1&&guestWorld.phase==='wave',JSON.stringify(guestWorld));

const guestHud=await guestPage.evaluate(()=>({cbar:document.getElementById('cbar').style.width,wavet:document.getElementById('wavet').textContent,phaset:document.getElementById('phaset').textContent}));
check("guest's actual HUD (the crystal bar and wave banner the player sees) reflects the host's hall, not their own",
  guestHud.cbar==='90%'&&guestHud.wavet==='WAVE 1 / '+ (await hostPage.evaluate(()=>window.__dd.map().waves)),JSON.stringify(guestHud));

// a guest trying to start their own wave is a no-op -- it's the host's hall
const guestStatusBefore=await guestPage.evaluate(()=>window.__dd.status());
await guestPage.evaluate(()=>window.__dd.startWave());
const guestStatusAfter=await guestPage.evaluate(()=>window.__dd.status());
check("a guest calling startWave() on their own page does nothing (their own phase/wave don't move)",
  guestStatusAfter.phase===guestStatusBefore.phase&&guestStatusAfter.wave===guestStatusBefore.wave,
  JSON.stringify({before:guestStatusBefore,after:guestStatusAfter}));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
