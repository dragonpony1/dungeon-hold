// ===== co-op sweep 2026-10-02 (minigolf): the White Tree Links in a co-op hall on the Drawbridge.
//  * a guest's hole follows the HOST's phase: the horn ends it, and the tee (prompt, E, start) is shut mid-wave (a guest's own S.phase never leaves 'build')
//  * the host's first-time cinematic no longer freezes the hall for his guests (the broadcasts keep going, the tee prompt stays hidden under it)
//  * the host's horn during a guest's cinematic ends it at once, with no hole after it
//  * partners see each other's ball, putter and aim line, and the cup
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-sweep-minigolf-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9491;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8931,{dist:"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));

for(const p of [hostPage,guestPage]) await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8931/?silent&nogate&map=4",{timeout:120000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__golf&&window.__golf.holes,null,{timeout:120000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); window.__dd.step(1/60,30); });

async function tickBoth(batches=10,size=5){
  for(let b=0;b<batches;b++){
    for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); }
    await new Promise(r=>setTimeout(r,20));
  }
}

// the host's wave: mobs on the field, or updateWave clears it straight back to build
const hostWave=()=>hostPage.evaluate(()=>{ const d=window.__dd; d.S.phase='wave'; for(let i=0;i<4;i++) d.spawn('goblin','S'); });
const hostBuild=()=>hostPage.evaluate(()=>{ const d=window.__dd; d.enemies.length=0; d.S.phase='build'; });
const roomCode="coopgolf-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
const hostId=hostOpen.id, guestId=guestJoin.id;
await hostBuild(); await tickBoth(8,5);

// ---- 1: the guest's hole follows the host's phase
const promptShown=p=>p.evaluate(()=>{ const e=document.getElementById('golfprompt'); return !!e&&e.style.display==='block'; });
await guestPage.evaluate(()=>{ const h=window.__golf.holes[0]; window.__dd.setHero(h.tee.x,h.tee.z+.3,0); }); await tickBoth(4,5);
const g0=await promptShown(guestPage);
const started=await guestPage.evaluate(()=>window.__golf.start(1)); await tickBoth(4,5);
const g1=await guestPage.evaluate(()=>window.__golf.info().on);
check("in the host's build phase the guest sees the tee prompt and can start a hole",g0&&started&&g1,JSON.stringify({g0,started,g1}));
await hostWave(); await tickBoth(8,5);
const g2=await guestPage.evaluate(()=>({ phase:window.__net.world()&&window.__net.world().phase, on:window.__golf.info().on }));
check("the host's horn ends the guest's hole (as it does solo)",g2.phase==='wave'&&g2.on===false,JSON.stringify(g2));
await guestPage.evaluate(()=>{ const h=window.__golf.holes[1]; window.__dd.setHero(h.tee.x,h.tee.z+.3,0); }); await tickBoth(4,5);
const g3={ prompt:await promptShown(guestPage), start:await guestPage.evaluate(()=>window.__golf.start(2)) };
check("mid-wave the guest's tee shows no prompt and won't start a hole",g3.prompt===false&&g3.start===false,JSON.stringify(g3));

// ---- 3: the host's horn mid-way through the guest's cinematic ends it, with no hole after it
await hostBuild(); await tickBoth(8,5);
await guestPage.evaluate(()=>{ window.__T={ after:0 }; window.__golf.cine(()=>{ window.__T.after++; }); }); await tickBoth(4,5);
const c0=await guestPage.evaluate(()=>window.__golf.cineT());
await hostWave(); await tickBoth(8,5);
const c1=await guestPage.evaluate(()=>({ t:window.__golf.cineT(), after:window.__T.after, on:window.__golf.info().on, cut:document.body.classList.contains('avery-cut') }));
check("the host's horn during the guest's cinematic ends it at once, with no hole after it",c0>0&&c1.t===null&&c1.after===0&&c1.on===false&&c1.cut===false,JSON.stringify({c0,c1}));

// ---- 2: the host's cinematic with a guest in: the hall runs on for the guest
await hostBuild(); await hostPage.evaluate(()=>{ const h=window.__golf.holes[0]; window.__dd.setHero(h.tee.x,h.tee.z+.3,0); }); await tickBoth(8,5);
await hostPage.evaluate(()=>window.__golf.cine(null)); await tickBoth(3,5);
await hostPage.evaluate(()=>{ window.__dd.S.crystal=123; }); await tickBoth(8,5);
const h1=await hostPage.evaluate(()=>{ const e=document.getElementById('golfprompt'); return { t:window.__golf.cineT(), prompt:!!e&&e.style.display==='block' }; });
const gw=await guestPage.evaluate(()=>window.__net.world()&&window.__net.world().crystal);
check("during the host's cinematic the guest still gets the host's hall (world broadcast keeps going)",h1.t>0.5&&gw===123,JSON.stringify({h1,gw}));
check("the tee prompt stays hidden under the host's cinematic",h1.prompt===false,JSON.stringify(h1));
await hostPage.evaluate(()=>window.__golf.skipCine()); await tickBoth(2,5);
await hostPage.evaluate(()=>window.__golf.stop()); await tickBoth(2,5);

// ---- 4: partners see each other putt
await hostPage.evaluate(()=>window.__golf.reset()); await guestPage.evaluate(()=>window.__golf.reset());
await guestPage.evaluate(()=>{ const h=window.__golf.holes[0]; window.__dd.setHero(h.tee.x,h.tee.z+.3,0); window.__golf.start(1); }); await tickBoth(8,5);
const p0=await hostPage.evaluate(id=>window.__golf.peers().find(p=>p.id===id)||null,guestId);
const gb=await guestPage.evaluate(()=>window.__golf.ball());
check("the host sees the guest's ball at the guest's tee, with the putter and aim line",p0&&p0.n===1&&Math.hypot(p0.x-gb.x,p0.z-gb.z)<.3&&p0.putter&&p0.bar,JSON.stringify({p0,gb}));
await guestPage.evaluate(()=>{ const h=window.__golf.holes[0], b=window.__golf.ball(); window.__golf.putt(h.cup.x-b.x,h.cup.z-b.z,.45); }); await tickBoth(10,5);
const p1=await hostPage.evaluate(id=>window.__golf.peers().find(p=>p.id===id)||null,guestId);
const gb1=await guestPage.evaluate(()=>window.__golf.ball());
check("the guest's putt rolls on the host's screen too",p1&&gb1&&Math.hypot(p1.x-p0.x,p1.z-p0.z)>1&&Math.hypot(p1.x-gb1.x,p1.z-gb1.z)<1.5,JSON.stringify({p1,gb1}));
await guestPage.evaluate(()=>{ const h=window.__golf.holes[0]; window.__golf.setBall(h.cup.x,h.cup.z+.6); window.__golf.putt(0,-1,0); }); await tickBoth(6,5);
const p2=await hostPage.evaluate(id=>window.__golf.peers().find(p=>p.id===id)||null,guestId);
const gi=await guestPage.evaluate(()=>window.__golf.info());
check("the guest holes out: the host's copy counts the cup",gi.holed>=1&&p2&&p2.ho>=1,JSON.stringify({gi:{holed:gi.holed,on:gi.on},p2}));
await guestPage.waitForTimeout(1200); await tickBoth(8,5);   // the hole closes 0.9 s (a real timer) after the cup
const p3=await hostPage.evaluate(()=>window.__golf.peers().length);
check("when the guest's hole ends, the host's copy of the ball goes",p3===0,String(p3));
await hostPage.evaluate(()=>{ const h=window.__golf.holes[1]; window.__dd.setHero(h.tee.x,h.tee.z+.3,0); window.__golf.start(2); }); await tickBoth(8,5);
const q0=await guestPage.evaluate(id=>window.__golf.peers().find(p=>p.id===id)||null,hostId);
check("the guest sees the host's ball on hole 2",q0&&q0.n===2,JSON.stringify(q0));
const bad=await guestPage.evaluate(()=>{ window.__golf.peer('x',{ n:9, x:1, y:0, z:1, ax:0, az:1, p:0, r:1, c:0, sw:0, st:0, ho:0 }); window.__golf.peer('y',{ n:1, x:NaN, y:0, z:1, ax:0, az:1, p:0, r:1, c:0, sw:0, st:0, ho:0 }); return window.__golf.peers().map(p=>p.id); });
check("nonsense golf data draws nothing",!bad.includes('x')&&!bad.includes('y'),JSON.stringify(bad));
await hostPage.evaluate(()=>window.__golf.stop()); await tickBoth(8,5);
const q1=await guestPage.evaluate(()=>window.__golf.peers().length);
check("the host walks away: the guest's copy of his ball goes",q1===0,String(q1));

check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
