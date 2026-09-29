// ===== SLUDGE JARS IN CO-OP (99g-sludgejars.js, build 270): every player's jars are their own, rolled for them like their loot. The host kills an ogre: the host's own Legendary jar lands on the host's floor, and the
// guest is sent its own ('jarDrop'), which lands on the guest's floor only and banks into the GUEST's hand-off when the guest walks over it. A guest never rolls jars itself.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP sludgejars-coop-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9473;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(8911);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8911/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__jars,null,{timeout:60000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__freeze=true; localStorage.removeItem("dd_sludge_in"); window.__dd.start(); window.__dd.step(1/60,30); window.__jars.clear(); });
const roomCode="jars-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
async function tickBoth(batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); } }
await tickBoth(8,5);
const g0=await guestPage.evaluate(()=>({ role:window.__net.role(), own:window.__jars.roll("ogre") }));   // a guest's own roll table still answers (it is the same code), but a guest never rolls on a kill: checked below by its jars coming only from the host
const h=await hostPage.evaluate(()=>{ const d=window.__dd, J=window.__jars; J.clear(); d.spawn("ogre"); d.step(1/60,2); const e=d.enemies[d.enemies.length-1]; e.x=16; e.z=16; d.kill(e); return { host:J.list().map(j=>j.r) }; });
await tickBoth(10,5);
const g=await guestPage.evaluate(()=>({ jars:window.__jars.list() }));
check("the host's ogre kill drops the host's own Legendary jar, and the guest gets its own Legendary jar on its own floor",g0.role==="guest"&&h.host.join()==="3"&&g.jars.length===1&&g.jars[0].r===3,JSON.stringify({g0,h,g}));
const hostSees=await hostPage.evaluate(()=>window.__jars.list().length);
const gb=await guestPage.evaluate(()=>{ const d=window.__dd, J=window.__jars, j=J.list()[0]; d.setHero(j.x,j.z,0); for(let i=0;i<120&&J.list().length;i++) d.step(1/60,1); return { left:J.list().length, banked:J.banked(), run:J.run() }; });
const hb=await hostPage.evaluate(()=>window.__jars.banked());
check("the guest walks over its jar: banked in the guest's own hand-off (the host's floor and hand-off untouched by it)",gb.left===0&&gb.banked.legendary===1&&gb.run[3]===1&&hostSees===1&&hb.legendary===0,JSON.stringify({gb,hb,hostSees}));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis|peer/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(0);
