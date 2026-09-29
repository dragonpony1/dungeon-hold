// ===== THE CO-OP HIDEOUT with THREE players (hideout build 48): a guest trades with ANOTHER GUEST (the host relays), everyone sees everyone, and a host that has no hideout of its own
// yet does not send a guest into an empty room (the guest keeps its own). Folder build only. -- 99d-coophideout.js
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coophideout3-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9472, PORT=8898;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(PORT);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(p,fn,arg,ms=90000){ try{ await p.waitForFunction(fn,arg,{timeout:ms}); return true; }catch(e){ return false; } }
async function frameOf(page,part){ for(let i=0;i<400;i++){ const f=page.frames().find(f=>f.url().includes(part)); if(f) return f; await sleep(50); } return null; }
const ctxs=[await browser.newContext(),await browser.newContext(),await browser.newContext()];
const pages=[]; for(const c of ctxs){ const p=await c.newPage(); p.on("pageerror",e=>errors.push(String(e))); await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate",{timeout:90000});
  await p.waitForFunction(()=>window.__dd&&window.__net&&window.__hideout&&window.__coopHideout&&window.__meta,null,{timeout:60000}); await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); pages.push(p); }
const [hostPage,aPage,bPage]=pages;
const rc="hd3-"+Math.random().toString(36).slice(2,8);
const ok0=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res(err?String(err):null),peerOpts)),{rc,peerOpts});
const ok1=await aPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res(err?String(err):null),peerOpts)),{rc,peerOpts});
const ok2=await bPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res(err?String(err):null),peerOpts)),{rc,peerOpts});
check("a host and two guests are connected",ok0===null&&ok1===null&&ok2===null,JSON.stringify([ok0,ok1,ok2]));
// the host has NEVER opened its hideout: it has no saved room, so a visiting guest keeps its own instead of standing in an empty one
await hostPage.evaluate(()=>{ window.__dd.step(1/60,5); });
await aPage.evaluate(()=>{ window.__dd.step(1/60,5); window.__hideout.open(); }); await bPage.evaluate(()=>{ window.__dd.step(1/60,5); window.__hideout.open(); });
const af=await frameOf(aPage,"hideout/index.html"), bf=await frameOf(bPage,"hideout/index.html");
await until(af,()=>window.__hd&&window.__hd.entries().length>=3,null,120000); await until(bf,()=>window.__hd&&window.__hd.entries().length>=3,null,120000);
await sleep(9000);   // the 7 s wait for a host answer is over either way
const aVis=await af.evaluate(()=>window.__hd.visiting()), bVis=await bf.evaluate(()=>window.__hd.visiting());
check("a host with no hideout yet sends nobody into an empty room: both guests keep their own (not visiting)",!aVis&&!bVis&&(await af.evaluate(()=>window.__hd.entries().length))>=3,JSON.stringify({aVis,bVis}));
// the two guests see each other (and are told about each other by the host), then trade through the host
await af.evaluate(()=>window.__hd.teleport(0,0)); await bf.evaluate(()=>window.__hd.teleport(2,0));
const see=await until(af,()=>window.__hd.peers().some(p=>p.shown&&Math.abs(p.x-2)<.7),null,60000)&&await until(bf,()=>window.__hd.peers().some(p=>p.shown&&Math.abs(p.x)<.7),null,60000);
check("the two guests see each other",see,JSON.stringify(await af.evaluate(()=>window.__hd.peers())));
await af.evaluate(()=>{ SAVE.bag[0]='bookshelf_empty'; SAVE.hotbar[0]=null; writeSave(); }); await bf.evaluate(()=>{ SAVE.bag[0]='display_pedestal'; SAVE.hotbar[0]=null; writeSave(); });
await until(af,()=>window.__hd.trade.nearest()!==null,null,30000);
await af.evaluate(()=>window.__hd.trade.ask());
const asked=await until(bf,()=>window.__hd.trade.state().incoming,null,30000);
check("guest A's request reaches guest B through the host",asked);
await bf.evaluate(()=>window.__hd.trade.ask()); await until(af,()=>window.__hd.trade.state().open,null,30000);
await af.evaluate(()=>window.__hd.trade.toggle('bag',0)); await bf.evaluate(()=>window.__hd.trade.toggle('bag',0));
await until(af,()=>window.__hd.trade.state().theirs.length===1,null,30000); await until(bf,()=>window.__hd.trade.state().theirs.length===1,null,30000);
await af.evaluate(()=>window.__hd.trade.lock()); await bf.evaluate(()=>window.__hd.trade.lock());
const swapped=await until(af,()=>window.__hd.trade.state().last!==null,null,30000)&&await until(bf,()=>window.__hd.trade.state().last!==null,null,30000);
const aInv=await af.evaluate(()=>window.__hd.trade.inv()), bInv=await bf.evaluate(()=>window.__hd.trade.inv());
const has=(inv,v)=>[...inv.bag,...inv.hotbar].includes(v);
check("guest A and guest B swapped: A has the pedestal and no bookshelf, B the opposite",swapped&&has(aInv,"display_pedestal")&&!has(aInv,"bookshelf_empty")&&has(bInv,"bookshelf_empty")&&!has(bInv,"display_pedestal"));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
for(const c of ctxs) await c.close(); await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(0);
