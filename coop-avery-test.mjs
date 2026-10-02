// ===== CO-OP (phase 7): a guest can place, repair, upgrade and sell a REAL defense on the host's hall, drawing
// from the shared host mana/DU pool -- not a pointless one in their own empty, disconnected local `defs`. Mirrors
// the phase-6 trust model: placeDefAt is monkey-patched to relay for a guest (99-network.js), the host validates
// for real and applies it; repair/upgrade/sell relay too, but reuse the REAL single-player functions (game.js's
// nearestDef/repair/upgrade/sell gained an optional `pos` param for exactly this) rather than a second copy of the
// cost/effect math, run from the guest's own host-tracked position so a client can't lie about where it's standing.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-defplace-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9463;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8888,{dist:"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));

for(const p of [hostPage,guestPage]) await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8888/?silent&nogate&map=4",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat,null,{timeout:60000}); }
await guestPage.evaluate(()=>window.__heroes.select('witch'));   // the ball is the witch's piece -- a knight guest (build 146's default) can't select it
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,30); });   // 30, not 5 -- matches place-test.mjs; S.phase needs that long to leave 'start' before select() will do anything

async function tickBoth(batches=10,size=5){
  for(let b=0;b<batches;b++){
    for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); }
    await new Promise(r=>setTimeout(r,20));
  }
}

const roomCode="coopa-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));

await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0));   // keep the host's own hero well clear so it never affects nearestDef reads meant for the guest
await guestPage.evaluate(()=>window.__dd.setCam(0,.42,8));
// ===== build 504 (Matt, with Jacob: "he didn't see any of Avery -- not the cinematic -- not the model, nothing"): a GUEST gets her: the cinematic when the host's starts, her real model flying (the layered
// moves), her bar with the host's health.
await hostPage.evaluate(async()=>{ const d=window.__dd; d.S.phase='wave'; await window.__avery.load(); });
await guestPage.evaluate(async()=>{ await window.__avery.load(); });
await hostPage.evaluate(()=>window.__avery.startCut());
await tickBoth(6,5);
const C=await guestPage.evaluate(()=>({ cut:window.__avery.info().cut, t:window.__avery.info().cutT, stage:!!document.querySelector('#averycut')&&getComputedStyle(document.querySelector('#averycut')).display }));
check('the host starting her intro starts it on the guest too',C.cut===true&&C.stage==='block',JSON.stringify(C));
await guestPage.evaluate(()=>window.__avery.skip()); await hostPage.evaluate(()=>window.__avery.skip());
await tickBoth(14,5);
const P=await guestPage.evaluate(()=>{ let out=null; window.__mobsync.each((p,id)=>{ if(p.kind==='avery') out={ glb:!!(p.mdl&&p.mdl.glb), y:+p.y.toFixed(1), hp:p.hp, layers:p.lay?Object.keys(p.lay.cur).length:0 }; }); const bar=document.getElementById('averybar'); return { pup:out, bar:bar&&bar.style.display, cut:window.__avery.info().cut }; });
check('after the intro the guest sees her real model flying, in her layered moves, and her health bar',P.pup&&P.pup.glb&&P.pup.layers>=2&&P.pup.y>10&&P.bar==='block'&&!P.cut,JSON.stringify(P));
check('no page errors',errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
