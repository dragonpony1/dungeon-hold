// ===== CO-OP (phase 4): a guest's own keys and look, relayed to the host and simulated into a real,
// collision-respecting hero there (99-network.js guestInputTick, reusing moveCircle/floorAt/angLerp), then folded
// into the same roster broadcast phase 3 built (now plural: 'heroes', not 'hero'). The one thing phase 3 could
// never exercise is a THIRD screen: with only ever one guest, "the host's hero reaches a guest" and "the host's
// hero reaches every guest" look identical. Phase 4 adds a second player who can move, so this suite spins up a
// host and TWO guests and checks that guest B — who has no direct connection to guest A at all, only to the host —
// still sees guest A's puppet move and, later, disappear. That relay (a guest's own screen learns of a departure
// only by the roster shrinking, since there's no guest-to-guest link to carry a __leave event) is the genuinely new
// risk in this phase; the movement math itself reuses the same moveCircle/floorAt the single-player hero already
// trusts, so this suite checks direction and rough distance, not collision, which was never phase 4's to re-prove.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-input-test.mjs — the `peer` package isn't installed (npm i peer) — this suite needs a local signaling server to test a real handshake without reaching the public broker."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9453;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8877);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), aCtx=await browser.newContext(), bCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), aPage=await aCtx.newPage(), bPage=await bCtx.newPage();
const errors=[]; for(const p of [hostPage,aPage,bPage]) p.on("pageerror",e=>errors.push(String(e)));

for(const p of [hostPage,aPage,bPage]){ await p.goto("http://127.0.0.1:8877/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__party,null,{timeout:60000}); }
for(const p of [hostPage,aPage,bPage]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); });

const roomCode="coopin-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const aJoin=await aPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const bJoin=await bPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and both guests connect",hostOpen.err===null&&aJoin.err===null&&bJoin.err===null,JSON.stringify({hostOpen,aJoin,bJoin}));

// guest A: face +Z (yaw 0) and hold W -- a plain, predictable direction to check the host's simulation against
await aPage.evaluate(()=>{ window.__dd.setCam(0,.42,8); window.__dd.setKeys({w:1}); });
for(let i=0;i<20;i++){ await aPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }   // real yields so the throttled input send actually fires and the data channel gets a turn
for(let i=0;i<60;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }   // host receives input, simulates guest A's hero, broadcasts the roster

const hostSeesA=await hostPage.evaluate((id)=>window.__party.get(id),aJoin.id);
check("host simulates guest A's hero moving forward from its own input (no round trip needed for the host's own screen)",
  hostSeesA&&hostSeesA.ready&&hostSeesA.z>6.5&&Math.abs(hostSeesA.x)<1,JSON.stringify(hostSeesA));

for(let i=0;i<60;i++){ await bPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }   // guest B receives the SAME roster over its own (separate) connection to the host

const bSeesA=await bPage.evaluate((id)=>window.__party.get(id),aJoin.id);
check("guest B — not directly connected to guest A at all — also sees guest A's puppet move, via the host's relay",
  bSeesA&&bSeesA.ready&&bSeesA.z>6.5&&Math.abs(bSeesA.x)<1,JSON.stringify(bSeesA));

const bSeesHost=await bPage.evaluate((id)=>{ const p=window.__party.get(id); return p&&p.ready; },hostOpen.id);
check("guest B also sees the host's own hero in the same roster",bSeesHost===true,String(bSeesHost));

// guest A leaves -- both the host (direct connection close) and guest B (roster no longer lists them) must drop the puppet
await aPage.evaluate(()=>window.__net.leave());
await hostPage.waitForFunction((id)=>!window.__party.list().includes(id),aJoin.id,{timeout:10000}).catch(()=>{});
const hostAfter=await hostPage.evaluate(()=>window.__party.list());
check("host drops guest A's puppet once its connection closes",!hostAfter.includes(aJoin.id),JSON.stringify(hostAfter));

// hostBroadcastHeroes only ever fires from the HOST's own Meta.update chain -- it needs its OWN ticks to notice
// guestHero/conns shrank and actually send a fresh roster; stepping guest B alone would just have it re-process
// the same last-received broadcast (still including guest A) over and over
for(let i=0;i<30;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }
for(let i=0;i<30;i++){ await bPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }
const bAfter=await bPage.evaluate(()=>window.__party.list());
check("guest B also drops guest A's puppet, purely from the roster shrinking (no direct link to guest A at all)",!bAfter.includes(aJoin.id)&&bAfter.includes(hostOpen.id),JSON.stringify(bAfter));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
