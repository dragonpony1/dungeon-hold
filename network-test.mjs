// ===== NETWORK (phase 2 co-op transport) — window.__net wraps PeerJS (vendored in head.html), which talks to the
// public signaling broker (0.peerjs.com) by default. A real broker round-trip isn't reliably testable in every
// environment (this repo's own sandbox blocks that specific outbound host by policy, and CI environments vary), so
// this suite spins up a throwaway *local* PeerJS-protocol signaling server (the official `peer` npm package) and
// points both ends at it via __net's peerOpts override — same client code path, same protocol, no public network
// needed. If `peer` isn't installed, the suite prints why and exits 0 rather than failing the run over a missing
// dev-only test dependency (npm i peer, once, to actually run this one).
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP network-test.mjs — the `peer` package isn't installed (npm i peer) — this suite needs a local signaling server to test a real handshake without reaching the public broker."); process.exit(0); }

const SP=process.env.SP;
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9451;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));   // give the server a beat to bind
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8875);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));

await hostPage.goto("http://127.0.0.1:8875/?silent&nogate",{timeout:90000}); await hostPage.waitForFunction(()=>window.__dd&&window.__net,null,{timeout:60000});
await guestPage.goto("http://127.0.0.1:8875/?silent&nogate",{timeout:90000}); await guestPage.waitForFunction(()=>window.__dd&&window.__net,null,{timeout:60000});

check("fresh page starts with no network role or peers",await hostPage.evaluate(()=>window.__net.role()===null&&window.__net.peers().length===0),"");

const roomCode="test-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host opens under the room code as its own peer id, real signaling round trip",hostOpen.err===null&&hostOpen.id===roomCode,JSON.stringify(hostOpen));

const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("guest connects to that room code over a real WebRTC data channel",guestJoin.err===null&&!!guestJoin.id&&guestJoin.id!==roomCode,JSON.stringify(guestJoin));

await hostPage.waitForFunction(()=>window.__net.peers().length===1,null,{timeout:10000});
const hostPeers=await hostPage.evaluate(()=>window.__net.peers());
check("host's peer list shows exactly the connected guest",hostPeers.length===1&&hostPeers[0]===guestJoin.id,JSON.stringify(hostPeers));

const roundTrip=await (async()=>{
  const echoP=guestPage.evaluate(()=>new Promise(res=>{ window.__net.onMessage("pong",d=>res(d)); window.__net.send("ping",{hello:"from guest"}); }));
  await hostPage.evaluate(()=>window.__net.onMessage("ping",(data,fromId)=>window.__net.send("pong",{echoed:data,from:fromId},fromId)));
  return Promise.race([echoP,new Promise(r=>setTimeout(()=>r({timeout:true}),10000))]);
})();
check("a real message sent guest→host and echoed host→guest arrives intact (actual data-channel traffic, not a mock)",!roundTrip.timeout&&roundTrip.echoed&&roundTrip.echoed.hello==="from guest"&&roundTrip.from===guestJoin.id,JSON.stringify(roundTrip));

const afterLeave=await guestPage.evaluate(()=>new Promise(res=>{ window.__net.leave(); setTimeout(()=>res({role:window.__net.role(),peers:window.__net.peers()}),300); }));
check("leave() tears the guest's connection down cleanly",afterLeave.role===null&&afterLeave.peers.length===0,JSON.stringify(afterLeave));
await hostPage.waitForFunction(()=>window.__net.peers().length===0,null,{timeout:10000}).catch(()=>{});
check("the host notices the guest disconnect and drops it from its own peer list",await hostPage.evaluate(()=>window.__net.peers().length===0),"");

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);   // a lingering WebRTC/signaling socket can otherwise keep the event loop alive well past the real result
