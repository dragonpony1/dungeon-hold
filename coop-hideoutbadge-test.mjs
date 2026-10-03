// ===== BUILD 508 (Matt approved, co-op): THE HOST SEES WHO IS IN THE HIDEOUT (99d2-hideoutbadge.js). A guest stepping into the hideout gets a small 🏠 over its gnome on the HOST's screen (a sprite, drawn over
// everything, gently bobbing, at the gnome's spot) and beside its dot on the host's mini-map; it goes when the guest leaves the hideout, or the game. The guest's own screen shows none. The hideout's gear table is
// answered locally (page.route) -- nothing here talks to the live server.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-hideoutbadge-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9810, PORT=9110;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(PORT,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function open(){ const ctx=await browser.newContext(); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
  await ctx.route(/\/api\/hideout\//,route=>route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ items:[] }) }));
  const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate",{timeout:120000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__hideout&&window.__coopHideout&&window.__hideoutBadge&&window.__minimap&&window.__party,null,{timeout:120000});
  await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); return p; }
async function until(p,fn,arg,ms=30000){ try{ await p.waitForFunction(fn,arg,{timeout:ms,polling:200}); return true; }catch(e){ return false; } }
const hostPage=await open(), guestPage=await open();
async function tickBoth(chunks=6,size=5){ for(let c=0;c<chunks;c++){ await hostPage.evaluate(n=>window.__dd.step(1/60,n),size); await guestPage.evaluate(n=>window.__dd.step(1/60,n),size); await sleep(15); } }
const roomCode="hb-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
await tickBoth(10,5);
const gid=await guestPage.evaluate(()=>window.__net.myId());
const h0=await hostPage.evaluate(id=>({ n:window.__hideoutBadge.info().n, pup:!!window.__party.get(id) }),gid);
check("the host has the guest's gnome in its hall and no badge while the guest is in the hall",h0.pup&&h0.n===0,JSON.stringify(h0));
// ---- the guest steps into the hideout
await guestPage.evaluate(()=>window.__hideout.open());
const inside=await until(hostPage,id=>window.__coopHideout.peers().some(p=>p.id===id),gid,150000);
const shown=inside&&await until(hostPage,()=>window.__hideoutBadge.info().n===1,null,5000);
await hostPage.evaluate(()=>window.__dd.step(1/60,2));
const A=await hostPage.evaluate(id=>{ const i=window.__hideoutBadge.info(), p=window.__party.get(id); return { i, p:p&&{ x:p.x, y:p.y, z:p.z, visible:p.visible } }; },gid);
const b=A.i.list[0]||{};
check("the guest in the hideout: the host shows ONE 🏠 badge, for that guest, over everything (no depth test)",inside&&shown&&A.i.n===1&&b.id===gid&&b.depthTest===false&&b.inScene&&b.visible,JSON.stringify(A.i));
check("...standing over the guest's gnome in the hall, 2.6 up (give or take its bob)",!!A.p&&Math.abs(b.x-A.p.x)<.01&&Math.abs(b.z-A.p.z)<.01&&Math.abs(b.y-(A.p.y+2.6))<=.13,JSON.stringify({b,p:A.p}));
const bob=await hostPage.evaluate(()=>{ const ys=[]; for(let i=0;i<8;i++){ window.__dd.step(1/60,9); ys.push(window.__hideoutBadge.info().list[0].y); } return ys; });
const span=Math.max(...bob)-Math.min(...bob);
check("...gently bobbing (it moves, a little)",span>.02&&span<=.25,JSON.stringify(bob));
const mm=await hostPage.evaluate(()=>{ window.__minimap.draw(); return window.__minimap.info().homes; });
check("...and the same 🏠 sits beside the guest's dot on the host's mini-map",mm===1,String(mm));
const g=await guestPage.evaluate(()=>({ n:window.__hideoutBadge.info().n, homes:(window.__minimap.draw(),window.__minimap.info().homes) }));
check("the guest's own screen shows no badge (the host's only)",g.n===0&&g.homes===0,JSON.stringify(g));
// ---- the guest comes back out
await guestPage.evaluate(()=>window.__hideout.close());
const gone=await until(hostPage,()=>window.__hideoutBadge.info().n===0,null,6000);
const mm2=await hostPage.evaluate(()=>{ window.__minimap.draw(); return { homes:window.__minimap.info().homes, dropped:window.__hideoutBadge.info().dropped }; });
check("the guest leaving the hideout takes the badge away (and the mini-map's)",gone&&mm2.homes===0&&mm2.dropped>=1,JSON.stringify(mm2));
// ---- back in, then the guest leaves the game from the hideout
await guestPage.evaluate(()=>window.__hideout.open());
const again=await until(hostPage,()=>window.__hideoutBadge.info().n===1,null,60000);
await guestPage.evaluate(()=>window.__net.leave());
const goneLeft=await until(hostPage,()=>window.__hideoutBadge.info().n===0,null,10000);
check("back in the hideout the badge is back, and a guest leaving the game takes it away",again&&goneLeft,JSON.stringify({again,goneLeft}));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis|peer|Lost connection|WebSocket/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
