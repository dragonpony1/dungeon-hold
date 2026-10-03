// ===== CO-OP: THE HALL DOESN'T PAUSE (build 159, 2/7). The whole simulation -- and every co-op broadcast, which all ride
// Meta.update -- used to run only while no menu was open, so the host opening the pause (which alt-tab opens by itself), the bag,
// the sheet or a tavern station froze the hall for every guest with no word; and a hidden host tab froze it too, since the frame
// loop (requestAnimationFrame) was all that drove it and a browser stops that for a hidden page. Real browsers, the REAL frame
// loop (no __freeze), a local PeerJS signaling server. It checks:
//  - hosting ALONE, the pause still freezes the hall, and says "the hall holds its breath" (single player's rule)
//  - with a guest in: under the host's pause, sheet and bag the host's mobs keep walking, the guest keeps getting the world ten
//    times a second, the host keeps following the walking guest; the host's gnome stands (held keys cleared) and the camera
//    doesn't pan from a stale mouse spot; the pause card says the hall doesn't stop, on the host and on the guest, and the guest
//    never reads "The host paused the game" (that line is for COOP_HALL_RUNS=false, the switch back)
//  - a hidden host tab (frames stopped, document.hidden, visibilitychange): the Worker keeper runs the hall in real time, the
//    guest keeps getting the world and reads "The host's game is in the background"; when the frames come back it stops
//  - a frame loop that is only slow (four frames a second, visible) is NOT taken over by the keeper
//  - with no Worker to be had (refused on the spot, or one that never speaks) a plain timer keeps the hall going instead
//  - the crystal falling while the host is in the tavern (a real goblin walking in under the tavern): the host gets the run
//    summary, the guest (in its own pause menu) gets THE GATE HAS OPENED with its pause stepped aside
// Ports 8711 (http), 9611 (signaling).
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-freeze-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const SP=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/,"")); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const T0=Date.now(); const stamp=l=>console.log("   ["+Math.round((Date.now()-T0)/1000)+" s] "+l);

const PORT=8711, sigPort=9611;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];
async function newPage(){ const ctx=await browser.newContext({viewport:{width:800,height:600}}); const p=await ctx.newPage(); p.setDefaultTimeout(240000); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate",{timeout:240000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__party&&window.__mobsync&&window.__pause&&window.__doll&&window.__tavern,null,{timeout:240000}); return {ctx,p}; }
async function until(p,fn,arg,ms,label){ const t0=Date.now(); let last=null;
  while(Date.now()-t0<ms){ try{ last=await p.evaluate(fn,arg); if(last) return {v:last,ms:Date.now()-t0}; }catch(e){ last='(error) '+String(e).slice(0,80); } await sleep(200); }
  console.log("   … gave up waiting for: "+label+" (last: "+JSON.stringify(last).slice(0,400)+")"); return null; }
const host=(p,rc)=>p.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err.type||err):null,id}),peerOpts)),{rc,peerOpts});
const join=(p,rc)=>p.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err.type||err):null,id}),peerOpts)),{rc,peerOpts});
// how many fresh 'world' messages a guest takes in over ms (each one replaces __world.host(); polled every 10 ms, the host sends ten a second)
const worldRate=(p,ms)=>p.evaluate(ms=>new Promise(res=>{ let last=window.__world.host(), n=0; const id=setInterval(()=>{ const w=window.__world.host(); if(w!==last){ n++; last=w; } },10); setTimeout(()=>{ clearInterval(id); res(n); },ms); }),ms);
// the host's own goblin (kept on window so it's the same one each time); fresh: the old one goes and a new one starts at the far
// gate, so it's always still walking when measured (one that reached the crystal stands there hitting it)
const gob=(p,fresh)=>p.evaluate(fresh=>{ let g=window.__gob; if(fresh&&g&&!g.dead) window.__dd.kill(g); if(fresh||!g||g.dead){ g=window.__gob=window.__dd.spawn('goblin','N'); } return {x:+g.x.toFixed(3),z:+g.z.toFixed(3)}; },!!fresh);
const moved=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const hostState=p=>p.evaluate(()=>({t:window.__dd.S.t,hero:{x:window.__dd.hero.x,z:window.__dd.hero.z},yaw:window.__dd.cam.yaw,keeper:window.__net.keeper?window.__net.keeper():{on:false,kind:null,steps:0},renders:window.__dd.renders(),phase:window.__dd.S.phase}));
const pauseLine=p=>p.evaluate(()=>{ const l=document.querySelector('#pause .pzl'); return l?l.textContent:null; });

const H=await newPage(), G=await newPage();
for(const x of [H,G]) await x.p.evaluate(()=>{ window.__dd.start(); });
const room="fz-"+Math.random().toString(36).slice(2,8);
const h1=await host(H.p,room);
check("the host opens a hall",!h1.err,JSON.stringify(h1));

// ==== hosting alone: the pause still holds the hall, as in single player ====
await gob(H.p,true); await sleep(600);
const aloneA=await gob(H.p); await H.p.evaluate(()=>window.__pause.open()); await sleep(1200); const aloneB=await gob(H.p);
const aloneLine=await pauseLine(H.p); const aloneShared=await H.p.evaluate(()=>!!(window.__dd.Meta.sharedHall&&window.__dd.Meta.sharedHall()));
await H.p.evaluate(()=>window.__pause.close(false)); await sleep(400); const aloneC=await gob(H.p);
check("hosting ALONE the pause still freezes the hall (the goblin stands under it, walks again after) and says 'the hall holds its breath'",
  !aloneShared&&moved(aloneA,aloneB)<1e-6&&moved(aloneB,aloneC)>.05&&aloneLine==='the hall holds its breath',JSON.stringify({aloneShared,aloneA,aloneB,aloneC,aloneLine}));

// ==== a guest joins ====
const g1=await join(G.p,room);
const joined=await until(H.p,()=>window.__net.peers().length===1&&!!(window.__dd.Meta.sharedHall&&window.__dd.Meta.sharedHall())?true:null,null,30000,'guest in');
check("a guest joins: the hall is shared now (Meta.sharedHall)",!g1.err&&!!joined,JSON.stringify({g1}));
await until(G.p,()=>window.__world.host()?true:null,null,20000,'guest hears the world');
const gid=g1.id;
await until(H.p,id=>window.__combat.guestHero(id)?true:null,gid,20000,"host tracks the guest's hero");

// ==== the host's menus: the hall runs on ====
const baseRate=await worldRate(G.p,1500);
for(const [name,openIt,closeIt] of [
    ['pause',()=>window.__pause.open(),()=>window.__pause.close(false)],
    ['character sheet',()=>window.__doll.open(),()=>window.__doll.close()],
    ['bag (the tavern)',()=>window.__dd.Meta.open(),()=>window.__tavern.close()]]){
  await gob(H.p,true);
  await G.p.evaluate(()=>window.__dd.setHero(0,6,0)); await sleep(500);   // the guest back at its spawn, clear of the crystal it walks toward (the host's copy follows it there)
  // the mouse left at the screen's edge (a stale spot under a menu), and W held down as the menu opens
  await H.p.evaluate(()=>{ window.dispatchEvent(new MouseEvent('mousemove',{clientX:3,clientY:300})); window.__dd.setKeys({w:1}); });
  await H.p.evaluate(openIt);
  const isOpen=await H.p.evaluate(()=>window.__dd.Meta.isOpen());
  await sleep(150);
  const a=await gob(H.p), s0=await hostState(H.p), gh0=await H.p.evaluate(id=>window.__combat.guestHero(id),gid);
  await G.p.evaluate(()=>window.__dd.setKeys({w:1}));   // the guest walks meanwhile
  const rate=await worldRate(G.p,1500);
  await G.p.evaluate(()=>window.__dd.setKeys({w:0}));
  await sleep(300);
  const b=await gob(H.p), s1=await hostState(H.p), gh1=await H.p.evaluate(id=>window.__combat.guestHero(id),gid);
  const line=name==='pause'?await pauseLine(H.p):null, gTxt=await G.p.evaluate(()=>document.getElementById('phaset').textContent);
  await H.p.evaluate(closeIt); await H.p.evaluate(()=>{ window.__dd.setKeys({w:0}); window.dispatchEvent(new MouseEvent('mousemove',{clientX:400,clientY:300})); });
  check("under the host's "+name+" the hall runs on: the host's goblin keeps walking, the guest gets the world ~10 times a second, the host follows the walking guest"+(name==='pause'?", and the card says the hall doesn't stop":""),
    isOpen&&moved(a,b)>.3&&rate>=10&&gh0&&gh1&&moved(gh0,gh1)>.5&&(name!=='pause'||/doesn't stop in co-op/.test(line))&&!/paused/.test(gTxt),JSON.stringify({isOpen,goblin:+moved(a,b).toFixed(2),rate,baseRate,guest:gh0&&gh1?+moved(gh0,gh1).toFixed(2):null,line,gTxt}));
  check("...while the host's own gnome stands still (W was held as the "+name+" opened) and the camera doesn't pan from the mouse's stale spot at the edge",
    moved(s0.hero,s1.hero)<1e-6&&Math.abs(s0.yaw-s1.yaw)<1e-9,JSON.stringify({hero:moved(s0.hero,s1.hero),yaw0:s0.yaw,yaw1:s1.yaw}));
}
// the guest's own pause says the same
await G.p.evaluate(()=>window.__pause.open()); const gLine=await pauseLine(G.p); await G.p.evaluate(()=>window.__pause.close(false));
check("a guest's own pause card says the host's hall doesn't stop",/host's hall doesn't stop/.test(gLine||''),JSON.stringify(gLine));

// ==== a slow but live frame loop is left alone ====
await H.p.evaluate(()=>{ window.__rafOrig=window.requestAnimationFrame; window.requestAnimationFrame=cb=>setTimeout(()=>window.__rafOrig.call(window,cb),240); });
await sleep(2500); const slow=await hostState(H.p);
await H.p.evaluate(()=>{ window.requestAnimationFrame=window.__rafOrig; });
check("a frame loop that is only slow (four frames a second, tab visible) keeps its own pace -- the keeper stays out",!slow.keeper.on&&slow.keeper.steps===0,JSON.stringify(slow.keeper));

// ==== the host's tab goes to the background ====
const hide=p=>p.evaluate(()=>{ window.__rafOrig=window.requestAnimationFrame; window.__rafHeld=[]; window.requestAnimationFrame=cb=>{ window.__rafHeld.push(cb); return 0; };   // what a hidden tab does: no more frames
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true}); Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'}); document.dispatchEvent(new Event('visibilitychange')); });
const show=p=>p.evaluate(()=>{ delete document.hidden; delete document.visibilityState; window.requestAnimationFrame=window.__rafOrig; window.__rafHeld.splice(0).forEach(cb=>requestAnimationFrame(cb)); document.dispatchEvent(new Event('visibilitychange')); });
stamp("hiding the host's tab");
await gob(H.p,true);
await hide(H.p); await sleep(400);
const hA=await gob(H.p), hs0=await hostState(H.p), wall0=Date.now();
const hRate=await worldRate(G.p,2000);
const hB=await gob(H.p), hs1=await hostState(H.p), wall1=Date.now();
const gHud=await G.p.evaluate(()=>document.getElementById('phaset').textContent);
const simRate=(hs1.t-hs0.t)/((wall1-wall0)/1000);
check("the host's tab hidden (no frames): the keeper -- a Worker -- runs the hall in real time (hall clock "+simRate.toFixed(2)+" s per second), the goblin walks, no frame was drawn",
  hs1.keeper.on&&hs1.keeper.kind==='worker'&&hs1.keeper.steps>hs0.keeper.steps&&simRate>.8&&simRate<1.2&&moved(hA,hB)>.3&&hs1.renders===hs0.renders,JSON.stringify({keeper:hs1.keeper,simRate,goblin:moved(hA,hB),renders:[hs0.renders,hs1.renders]}));
check("...the guest keeps getting the world (~10 a second) and reads why no horn is coming: \"The host's game is in the background\"",hRate>=12&&/in the background/.test(gHud),JSON.stringify({hRate,gHud}));
await show(H.p); await sleep(800);
const back=await hostState(H.p), gHud2=await G.p.evaluate(()=>document.getElementById('phaset').textContent);
await sleep(500); const back2=await hostState(H.p);
check("the tab back in front: the keeper stops, the frames draw again, the hall clock goes on without a jump back, the guest's line clears",
  !back.keeper.on&&back2.renders>back.renders&&back.t>=hs1.t&&back2.t>back.t&&!/in the background/.test(gHud2),JSON.stringify({keeper:back.keeper,renders:[back.renders,back2.renders],t:[hs1.t,back.t,back2.t],gHud2}));

// ==== no Worker to be had: a plain timer instead ====
await H.p.evaluate(()=>{ window.__WorkerOrig=window.Worker; window.Worker=function(){ throw new DOMException('refused by the page policy','SecurityError'); }; });
await hide(H.p); await sleep(1200);
const tA=await hostState(H.p); await sleep(1000); const tB=await hostState(H.p);
await show(H.p); await sleep(400);
check("with the Worker refused on the spot (a strict page policy), a plain timer keeps the hidden host's hall going",
  tB.keeper.kind==='timer'&&tB.keeper.steps>tA.keeper.steps&&tB.t-tA.t>.7,JSON.stringify({a:tA.keeper,b:tB.keeper,dt:tB.t-tA.t}));
await H.p.evaluate(()=>{ window.Worker=function(){ return {terminate(){}}; }; });   // a worker that is made but never says a word
await hide(H.p); await sleep(600);
const mute0=await hostState(H.p); await sleep(4200); const mute1=await hostState(H.p);
await show(H.p); await H.p.evaluate(()=>{ window.Worker=window.__WorkerOrig; }); await sleep(400);
check("...and a Worker that never ticks is swapped for the timer within a few seconds",mute0.keeper.kind==='worker'&&mute1.keeper.kind==='timer'&&mute1.t-mute0.t>1,JSON.stringify({a:mute0.keeper,b:mute1.keeper,dt:mute1.t-mute0.t}));

// ==== the crystal falls while the host is in the tavern (and the guest in its own pause) ====
stamp("the crystal falls under the tavern");
await H.p.evaluate(()=>{ window.__dd.Meta.open(); const d=window.__dd; d.S.crystal=1; const g=d.spawn('goblin','N'); g.x=0; g.z=-2.6; window.__killer=g; });
await G.p.evaluate(()=>window.__pause.open());
const fell=await until(H.p,()=>{ const s=window.__tavern.state(); return window.__dd.S.phase==='dead'&&s.open&&s.sum?true:null; },null,30000,"host's run summary");
const gEnd=await until(G.p,()=>{ const s=window.__tavern.state(); return ((s.open&&s.sum)||!document.getElementById('dead').classList.contains('hide'))&&!window.__pause.isOpen()?{h1:document.getElementById('deadh1').textContent,tally:s.open&&s.sum,pause:window.__pause.isOpen(),phase:window.__dd.S.phase}:null; },null,15000,"guest's end screen");   // build 508: a guest's run end shows solo's tally over the card
check("a goblin walks in under the host's tavern and the crystal falls: the host gets the run summary over its tavern",!!fell,JSON.stringify(fell));
check("...and the guest, in its own pause menu, gets THE GATE HAS OPENED with the pause stepped aside",!!gEnd&&gEnd.v.h1==='THE GATE HAS OPENED'&&!gEnd.v.pause&&gEnd.v.phase==='dead',JSON.stringify(gEnd&&gEnd.v));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon|Could not connect to peer|Lost connection to server|ERR_CONNECTION_REFUSED|WebSocket/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
stamp("done");
for(const x of [H,G]) await Promise.race([x.ctx.close().catch(()=>{}),sleep(8000)]);
await browser.close().catch(()=>{}); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
