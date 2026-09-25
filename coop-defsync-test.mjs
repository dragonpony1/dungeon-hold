// ===== CO-OP (phase 5, defenses slice — the last piece of world-sync): the host's real defenses, rendered as
// read-only puppets on a guest's screen (window.__defsync, 99-network.js hostBroadcastDefs). A defense never moves
// once placed, so this checks it appears at the right spot immediately (no easing to wait out), that its elevation
// (base, not just x/z — the same lesson the flying-enemy slice learned) comes through, and that it disappears once
// removed on the host.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-defsync-test.mjs — the `peer` package isn't installed (npm i peer) — this suite needs a local signaling server to test a real handshake without reaching the public broker."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9456;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8880);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));

for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8880/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__defsync,null,{timeout:60000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); });

const roomCode="coopd-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));

// find a real floor cell near the hall's centre and place a real harpoon turret there -- searched rather than
// hardcoded, since the exact grid layout isn't something a test should assume
const placed=await hostPage.evaluate(()=>{
  const {gw,gh}=window.__dd.map();
  for(let cz=(gh/2|0)-6; cz<(gh/2|0)+6; cz++) for(let cx=(gw/2|0)-6; cx<(gw/2|0)+6; cx++){
    const d=window.__dd.place('harpoon',cx,cz,0); if(d) return {ok:true,x:d.x,y:d.base,z:d.z,lvl:d.lvl};
  }
  return {ok:false};
});
check("host has a real defense placed",placed.ok===true&&(await hostPage.evaluate(()=>window.__dd.status().defs))===1,JSON.stringify(placed));

for(let i=0;i<40;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }   // defenses broadcast at 2Hz (every .5s of simulated time, slower than heroes/enemies since they never move) -- 40 ticks at dt=1/60 is ~.67s, safely over that threshold
for(let i=0;i<10;i++){ await guestPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }

const guestList=await guestPage.evaluate(()=>window.__defsync.list());
check("guest grows exactly one defense puppet",guestList.length===1,JSON.stringify(guestList));
const puppet=guestList.length===1?await guestPage.evaluate((id)=>window.__defsync.get(id),guestList[0]):null;
check("the puppet is the right kind, level, and sits at the real defense's exact position AND elevation (no easing needed -- it never moves)",
  puppet&&puppet.kind==='harpoon'&&puppet.lvl===1&&Math.abs(puppet.x-placed.x)<.05&&Math.abs(puppet.y-placed.y)<.05&&Math.abs(puppet.z-placed.z)<.05,
  JSON.stringify({puppet,placed}));

// the guest's own local defenses list is still empty -- they're seeing the host's hall, not building their own
const guestOwnDefs=await guestPage.evaluate(()=>window.__dd.status().defs);
check("the guest's own local defs list is still empty",guestOwnDefs===0,String(guestOwnDefs));

// the defense is destroyed on the host -- the guest's puppet should disappear. removeDef itself isn't exposed on
// window.__dd (only the array is, via .defs), so this splices the real array directly: the host's own scene keeps
// a now-orphaned mesh (removeDef's own scene.remove is what a real destruction would also do, just skipped here),
// but hostBroadcastDefs reads straight from this same array, so the next broadcast correctly stops listing it --
// which is the actual thing this test needs to prove.
const destroyed=await hostPage.evaluate(()=>{ window.__dd.defs.splice(0,1); return window.__dd.status().defs===0; });
for(let i=0;i<40;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }
for(let i=0;i<10;i++){ await guestPage.evaluate(()=>window.__dd.step(1/60,1)); await new Promise(r=>setTimeout(r,16)); }
const guestListAfter=await guestPage.evaluate(()=>window.__defsync.list());
check("guest's defense puppet disappears once it's destroyed on the host",guestListAfter.length===0,JSON.stringify({destroyed,guestListAfter}));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
