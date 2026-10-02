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

const sigPort=9461;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8886,{dist:"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));

for(const p of [hostPage,guestPage]) await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8886/?silent&nogate&map=4",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat,null,{timeout:60000}); }
await guestPage.evaluate(()=>window.__heroes.select('witch'));   // the ball is the witch's piece -- a knight guest (build 146's default) can't select it
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,30); });   // 30, not 5 -- matches place-test.mjs; S.phase needs that long to leave 'start' before select() will do anything

async function tickBoth(batches=10,size=5){
  for(let b=0;b<batches;b++){
    for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); }
    await new Promise(r=>setTimeout(r,20));
  }
}

const roomCode="coopg-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));

await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0));   // keep the host's own hero well clear so it never affects nearestDef reads meant for the guest
await guestPage.evaluate(()=>window.__dd.setCam(0,.42,8));
// ===== build 499 (Matt and Jacob on the Drawbridge): a GUEST sees which of the host's towers its E will act on (gold ring + the tower's card) -- the same pick the host runs for it -- and the guest's
// keep Heartroot bar follows the host's keep.
await guestPage.waitForTimeout(500);
await hostPage.evaluate(()=>{ const d=window.__dd; d.addMana(1e6); const W=window.__moatwalk, a=W.at(20,32), b=W.at(28,32); d.placeDefAt('harpoon',a.x,a.z,0); d.placeDefAt('acorn',b.x,b.z,0); window.__T={ a, b }; });
await tickBoth(6,5);
const spot=await hostPage.evaluate(()=>window.__T);
await guestPage.evaluate(s=>{ window.__dd.setHero(s.a.x,s.a.z+2.4,Math.PI); },spot);
await tickBoth(10,5);
const g=await guestPage.evaluate(()=>{ const el=document.getElementById('defcard'); const p=window.__defsync.pick(); return { pick:p&&{ kind:p.kind, x:p.x, z:p.z }, card:el&&el.classList.contains('show')?el.textContent:null }; });
check('the guest standing at its ballista sees the ballista picked and its card (name, mark, health, the upgrade E would buy)',g.pick&&g.pick.kind==='harpoon'&&g.card&&/Ballista/.test(g.card)&&/Upgrade · E/.test(g.card),JSON.stringify(g));
const before=await hostPage.evaluate(()=>window.__dd.defs.map(d=>d.kind+':'+(d.lvl||1)).join(' '));
await guestPage.evaluate(()=>window.__dd.upgrade()); await tickBoth(8,5);
const after=await hostPage.evaluate(()=>window.__dd.defs.map(d=>d.kind+':'+(d.lvl||1)).join(' '));
check('E on the guest upgrades that same ballista on the host (not the cannon)',/harpoon:2/.test(after)&&/acorn:1/.test(after),before+' -> '+after);
await hostPage.evaluate(()=>{ window.__dd.S.crystal3=77; }); await tickBoth(6,5);
const k=await guestPage.evaluate(()=>{ const w=window.__net.world(); const bar=document.getElementById('cbar3'); return { hostKeep:w&&w.crystal3, bar:bar?bar.style.width:null }; });
check("the guest's keep Heartroot bar follows the host's keep",k.hostKeep===77&&k.bar&&Math.abs(parseFloat(k.bar)-77/150*100)<2,JSON.stringify(k));
const H0=await guestPage.evaluate(()=>window.__gsfx().crystal);
await hostPage.evaluate(()=>{ window.__dd.S.crystal2=60; }); await tickBoth(6,5); const H1=await guestPage.evaluate(()=>window.__gsfx().crystal);
await hostPage.evaluate(()=>{ window.__dd.S.crystal3=40; }); await tickBoth(6,5); const H2=await guestPage.evaluate(()=>window.__gsfx().crystal);
check('build 500: the guest hears the hit and alarm when the inn or the keep Heartroot is struck',H1>H0&&H2>H1,JSON.stringify({H0,H1,H2}));
check('no page errors',errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
