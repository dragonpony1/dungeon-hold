// ===== CO-OP (phase 5, enemies slice): the host's real enemies, rendered as read-only puppets on a guest's screen
// (window.__mobsync, 99-network.js) — a guest is helping defend the hall's real horde, not staring at an empty
// room while the crystal bar mysteriously ticks down. Checks the puppet appears with the right kind, tracks the
// enemy's real position, and disappears once the enemy is dead on the host — same roster-diff removal the hero
// puppet system already uses, applied to enemies.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-mobsync-test.mjs — the `peer` package isn't installed (npm i peer) — this suite needs a local signaling server to test a real handshake without reaching the public broker."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9455;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8879);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));

for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8879/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__mobsync,null,{timeout:60000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); });

const roomCode="coopm-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));

const spawned=await hostPage.evaluate(()=>{ const e=window.__dd.spawn('goblin','N'); return {kind:e.kind,x:e.x,z:e.z}; });
check("host has a real goblin in its own enemies list",(await hostPage.evaluate(()=>window.__dd.status().enemies))===1,JSON.stringify(spawned));

for(let i=0;i<15;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }   // enough host ticks for the 12Hz enemy broadcast to fire
for(let i=0;i<30;i++){ await guestPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }   // guest receives it and eases the puppet toward it

const guestList=await guestPage.evaluate(()=>window.__mobsync.list());
check("guest grows exactly one mob puppet",guestList.length===1,JSON.stringify(guestList));
const puppet=guestList.length===1?await guestPage.evaluate((id)=>window.__mobsync.get(id),guestList[0]):null;
// the goblin has been walking its flow-field path toward the crystal this whole time (real wall-clock ticks with
// real yields between them), so the CURRENT host position is what the puppet should match -- not where it spawned
const current=await hostPage.evaluate(()=>{ const e=window.__dd.enemies[0]; return {x:e.x,z:e.z}; });
check("the puppet is the right kind and tracks the real (moving) enemy's current position, not just its spawn point",
  puppet&&puppet.kind==='goblin'&&Math.abs(puppet.x-current.x)<.5&&Math.abs(puppet.z-current.z)<.5,JSON.stringify({puppet,spawned,current}));

// the guest's OWN local hall is untouched -- their own enemies list is still empty, they never started a wave
const guestOwnEnemies=await guestPage.evaluate(()=>window.__dd.status().enemies);
check("the guest's own local enemies list is still empty (they're seeing the host's hall, not spawning their own)",guestOwnEnemies===0,String(guestOwnEnemies));

// the enemy dies on the host -- the guest's puppet should disappear, purely from the roster shrinking
await hostPage.evaluate(()=>{ const e=window.__dd.enemies[0]; window.__dd.kill(e); });
for(let i=0;i<10;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }
for(let i=0;i<10;i++){ await guestPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }
const guestListAfter=await guestPage.evaluate(()=>window.__mobsync.list());
check("guest's puppet disappears once the enemy is dead on the host",guestListAfter.length===0,JSON.stringify(guestListAfter));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
