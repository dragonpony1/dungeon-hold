// ===== CO-OP (phase 3): the host's hero, synced live to a guest's screen — 99-network.js's hostBroadcastHero sends
// the host's own x/z/yaw/hero-pick a few times a second, and the guest's onMessage('hero',...) handler drives a
// party puppet (98-party.js) with it. Like network-test.mjs, this spins up a throwaway local PeerJS-protocol
// signaling server rather than reaching the public broker, so it's the same client code path and needs no network.
// A real player naturally leaves the start screen (clicking "play") before any of this matters, so both pages below
// call window.__dd.start() — skipping that on the guest was an earlier version of this very test's own mistake:
// with the guest stuck in the 'start' phase, Meta.update (and so updateParty's easing) never ran there at all, which
// looked exactly like a second position update silently failing to arrive when it was really just never simulated.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-test.mjs — the `peer` package isn't installed (npm i peer) — this suite needs a local signaling server to test a real handshake without reaching the public broker."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9452;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8876);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));

await hostPage.goto("http://127.0.0.1:8876/?silent&nogate",{timeout:90000}); await hostPage.waitForFunction(()=>window.__dd&&window.__net&&window.__party,null,{timeout:60000});
await guestPage.goto("http://127.0.0.1:8876/?silent&nogate",{timeout:90000}); await guestPage.waitForFunction(()=>window.__dd&&window.__net&&window.__party,null,{timeout:60000});

await hostPage.evaluate(()=>{ window.__dd.start(); window.__dd.setHero(0,10,0); window.__dd.step(1/60,5); });
await guestPage.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); });

const roomCode="coop-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("handshake connects host and guest",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));

// first move: host walks to a spot, guest should grow a party puppet there with no script driving __party directly
await hostPage.evaluate(()=>{ window.__dd.setHero(5,20,Math.PI/3); });
await hostPage.evaluate(()=>window.__dd.step(1/60,20));
await guestPage.waitForFunction((hostId)=>{ const p=window.__party.get(hostId); return p&&p.ready; },hostOpen.id,{timeout:15000,polling:100});
for(let i=0;i<40;i++) await guestPage.evaluate(()=>window.__dd.step(1/60,1));
const afterFirst=await guestPage.evaluate((hostId)=>window.__party.get(hostId),hostOpen.id);
check("guest grows a puppet at the host's first broadcast position",afterFirst&&Math.abs(afterFirst.x-5)<.1&&Math.abs(afterFirst.z-20)<.1,JSON.stringify(afterFirst));

// second move: a live feed, not a one-shot snapshot -- the puppet must ease to a NEW target, not stay stuck at the first
await hostPage.evaluate(()=>{ window.__dd.setHero(8,23,-Math.PI/2); });
await hostPage.evaluate(()=>window.__dd.step(1/60,20));
for(let i=0;i<120;i++) await guestPage.evaluate(()=>window.__dd.step(1/60,1));
const afterSecond=await guestPage.evaluate((hostId)=>window.__party.get(hostId),hostOpen.id);
check("guest's puppet eases to the host's SECOND broadcast position (not stuck at the first)",afterSecond&&Math.abs(afterSecond.x-8)<.2&&Math.abs(afterSecond.z-23)<.2,JSON.stringify(afterSecond));

// the guest's own local hero is a completely separate thing from the puppet mirroring the host
const guestLocalHero=await guestPage.evaluate(()=>({x:window.__dd.hero.x,z:window.__dd.hero.z,pick:window.__heroes.pick()}));
check("guest's own local hero is untouched by the host's movement",guestLocalHero.x===0&&guestLocalHero.pick==="witch",JSON.stringify(guestLocalHero));

// host leaves -- the guest's puppet for it should be cleanly removed
await hostPage.evaluate(()=>window.__net.leave());
await guestPage.waitForFunction((hostId)=>!window.__party.list().includes(hostId),hostOpen.id,{timeout:10000}).catch(()=>{});
const afterHostLeaves=await guestPage.evaluate(()=>window.__party.list());
check("guest's party list is empty once the host leaves",afterHostLeaves.length===0,JSON.stringify(afterHostLeaves));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);   // a lingering WebRTC/signaling socket can otherwise keep the event loop alive well past the real result
