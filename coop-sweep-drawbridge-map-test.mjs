// ===== co-op sweep 2026-10-02 (drawbridge-map): a guest on the Drawbridge, with a host.
//  * the host's copy of a guest who climbs a perch stands up on its deck (not on the ground at its post, where mobs could swing at it) -- 99-network.js guestInputTick
//  * build 602 (Matt: "allow unlimited lookout perches"): no perch cap any more -- a guest's 3rd perch is neither refused by its ghost nor by the host
//  * a guest's ballista ghost snaps onto the host's perch (its centre), and turns red when a tower already stands on it -- 99-network.js (__standSurf)
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-sweep-drawbridge-map-test.mjs -- the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9513, pagePort=9813;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(pagePort,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function open(){ const ctx=await browser.newContext(); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
  const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:"+pagePort+"/?silent&nogate&map=4",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__perch&&window.__moatwalk&&window.__moatwalk.at,null,{timeout:90000});
  await p.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); return p; }
const hostPage=await open(), guestPage=await open();
async function tickBoth(batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await sleep(20); } }
const rc="dbm-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
const gid=guestJoin.id;
await tickBoth(8,5);
await hostPage.evaluate(gid=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.addMana(1e6); d.S.du=-200; d.S.phase='build'; const a=window.__moatwalk.at(24,42); d.setHero(a.x,a.z,0); d.hero.y=0; window.__combat.setGuestMana(gid,1e5); },gid);

// ---- a guest's ballista ghost on the host's perch
const W0=await hostPage.evaluate(()=>{ const a=window.__moatwalk.at(34,32); return {x:a.x,z:a.z}; });
await guestPage.evaluate(w=>{ const d=window.__dd; d.setHero(w.x,w.z,0); d.hero.y=0; d.setCam(0,.42,8); },W0);
await tickBoth(4,5);
await guestPage.evaluate(()=>{ const d=window.__dd; window.__heroes.select('knight'); d.select('harpoon'); d.step(1/60,1); });
await tickBoth(2,5);
const g0=await guestPage.evaluate(()=>window.__dd.ghost());
check("the guest aims a ballista at a free spot (green)",!!g0&&g0.ok,JSON.stringify(g0));
const P=await hostPage.evaluate(g0=>{ const d=window.__dd; const p=d.placeDefAt('perch',g0.x+.35,g0.z+.2,0); return p?{x:p.x,z:p.z,base:p.base||0,top:p.top}:null; },g0);
await tickBoth(8,5);
const g1=await guestPage.evaluate(()=>window.__dd.ghost());
check("the host puts a perch there: the guest's ghost snaps to the perch's middle and stays green (solo's 96b snap)",!!P&&!!g1&&g1.ok&&Math.abs(g1.x-P.x)<.02&&Math.abs(g1.z-P.z)<.02,JSON.stringify({P,g0,g1}));
await hostPage.evaluate(P=>{ window.__dd.placeDefAt('harpoon',P.x,P.z,0); },P);
await tickBoth(8,5);
const g2=await guestPage.evaluate(()=>window.__dd.ghost());
const onP=await hostPage.evaluate(()=>window.__dd.defs.filter(d=>d.kind==='harpoon'&&d.onSurf).length);
check("a ballista on that perch: the guest's ghost is red, 'A tower already stands here'",onP===1&&!!g2&&!g2.ok&&g2.why==='A tower already stands here',JSON.stringify({onP,g2}));
await guestPage.evaluate(()=>{ const d=window.__dd; d.select('harpoon'); d.step(1/60,1); });   // put it away

// ---- the host's copy of the guest climbs the perch with him
const deckY=P?P.base+2.5:2.5;
const c0=await hostPage.evaluate(gid=>{ const h=window.__dd.Meta.heroes().find(o=>o.gid===gid); return h?{x:h.x,y:h.y,z:h.z}:null; },gid);
for(let i=0;i<12;i++){ await guestPage.evaluate(({P,deckY})=>{ const d=window.__dd; d.setHero(P.x,P.z); d.hero.y=deckY; if(d.hero.vy!==undefined) d.hero.vy=0; },{P,deckY}); await tickBoth(1,5); }
const c1=await hostPage.evaluate(gid=>{ const h=window.__dd.Meta.heroes().find(o=>o.gid===gid); return h?{x:+h.x.toFixed(2),y:+h.y.toFixed(2),z:+h.z.toFixed(2)}:null; },gid);
const gy=await guestPage.evaluate(()=>window.__dd.hero.y);
check("the guest stands on the perch deck: the host's copy of him is up on the deck too, not on the ground at its post",!!c1&&Math.abs(c1.y-deckY)<.3&&Math.hypot(c1.x-P.x,c1.z-P.z)<.8,JSON.stringify({c0,c1,deckY,gy}));
await guestPage.evaluate(w=>{ const d=window.__dd; d.setHero(w.x-3,w.z); d.hero.y=0; },W0);
await tickBoth(10,5);
const c2=await hostPage.evaluate(gid=>{ const h=window.__dd.Meta.heroes().find(o=>o.gid===gid); return h?{y:+h.y.toFixed(2)}:null; },gid);
check("back on the ground: the copy is on the ground again",!!c2&&Math.abs(c2.y)<.3,JSON.stringify(c2));

// ---- the perch cap
await hostPage.evaluate(()=>{ const a=window.__moatwalk.at(28,36); window.__dd.placeDefAt('perch',a.x,a.z,0); });
await tickBoth(8,5);
const nHost=await hostPage.evaluate(()=>window.__dd.defs.filter(d=>d.kind==='perch').length);
const sel=await guestPage.evaluate(()=>{ const d=window.__dd; window.__meta.setLevel(7); window.__heroes.select('engineer'); d.select('perch'); d.step(1/60,1); return window.__heroes.pick(); });
await tickBoth(2,5);
const g3=await guestPage.evaluate(()=>window.__dd.ghost());
check("the hall has 2 perches and the guest's ghost for a 3rd never says 'Only 2 perches at a time' (no cap)",nHost===2&&!!g3&&!/perches at a time/.test(g3.why||''),JSON.stringify({nHost,sel,g3}));
await guestPage.evaluate(()=>{ document.getElementById('toast').textContent=''; const d=window.__dd, g=d.ghost(); if(g) d.placeDefAt('perch',g.x,g.z,0); });
await tickBoth(8,5);
const nHost2=await hostPage.evaluate(()=>window.__dd.defs.filter(d=>d.kind==='perch').length);
const t3=await guestPage.evaluate(()=>document.getElementById('toast').textContent);
check("the guest's 3rd perch goes down on the host (no cap)",nHost2===3&&!/perches at a time/.test(t3),JSON.stringify({nHost2,t3}));
await hostPage.evaluate(()=>{ const d=window.__dd, p=d.defs.find(o=>o.kind==='perch'&&!d.defs.some(t=>t.onSurf===o)); if(p) window.__perch.remove(p); });
await tickBoth(8,5);
const g4=await guestPage.evaluate(()=>window.__dd.ghost());
check("one perch sold: the guest's perch ghost still never speaks of a cap",!!g4&&!/perches at a time/.test(g4.why||''),JSON.stringify(g4));

check("no page errors",errors.length===0,errors.slice(0,3).join(" | "));
await browser.close(); server.close(); try{ sig.close(); }catch(e){}
const fails=results.filter(r=>!r).length; console.log(`\n${results.length-fails} pass  ${fails} fail`); process.exit(fails?1:0);
