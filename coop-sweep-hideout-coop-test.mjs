// ===== CO-OP SWEEP 2026-10-02 (hideout-coop), on the Drawbridge with a host and a guest:
//   * the guest's raven flies off with the HOST's horn (57-raven.js reads hallPhase), so mid-wave E near it is a tower upgrade and H is not a hero swap, and it comes back with the host's build phase
//   * the bag opened over the guest's hideout closes when the host's horn pulls the guest out of the room (96g-hideoutbag.js hooks.close)
//   * the character sheet shows the guest's real mana pool (the host's w.manas), not its page's local S.mana (68-paperdoll.js)
//   * a guest shown its own room (the host has no hideout) does not poll, show or drop gear on the HOST's gear table (hideout build 88)
// The gear table is answered locally by the test (page.route) -- nothing here talks to the live server.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-sweep-hideout-coop-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9531, PORT=8953;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(PORT,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const gearCalls=[]; for(const [c,who] of [[hostCtx,'host'],[guestCtx,'guest']]) await c.route(/\/api\/hideout\//,route=>{ const r=route.request(); if(who==='guest') gearCalls.push({ t:Date.now(), m:r.method(), u:r.url() }); route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ items:[] }) }); });
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(p,fn,arg,ms=90000){ try{ await p.waitForFunction(fn,arg,{timeout:ms}); return true; }catch(e){ return false; } }
async function frameOf(page,part){ for(let i=0;i<600;i++){ const f=page.frames().find(f=>f.url().includes(part)); if(f) return f; await sleep(50); } return null; }
for(const p of [hostPage,guestPage]) await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate&map=4",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat&&window.__raven&&window.__hideout&&window.__hideoutbag,null,{timeout:60000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,30); });
async function tickBoth(batches=10,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await sleep(20); } }

const roomCode="hdc-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0));
await tickBoth(10,5);
const gid=await guestPage.evaluate(()=>window.__net.myId());

// ---- the character sheet's mana is the guest's own pool from the host
await hostPage.evaluate(id=>window.__combat.setGuestMana(id,4321),gid);
await guestPage.evaluate(()=>{ window.__dd.S.mana=50; });
await tickBoth(6,5);
const mn=await guestPage.evaluate(()=>{ window.__doll.open(); const el=document.querySelector('#doll .dl-vitals'); const t=el?el.textContent:''; window.__doll.close(); return { t, hud:document.getElementById('mana')?document.getElementById('mana').textContent:null }; });
check("the guest's character sheet shows its real mana pool (4321, as its HUD does), not the page's local 50",/4321/.test(mn.t)&&!/💧[^0-9]*50\b/.test(mn.t),JSON.stringify(mn).slice(0,300));
const hmn=await hostPage.evaluate(()=>{ window.__dd.S.mana=777; window.__doll.open(); const el=document.querySelector('#doll .dl-vitals'); const t=el?el.textContent:''; window.__doll.close(); return t; });
check("the host's own sheet still shows its S.mana",/777/.test(hmn),hmn.slice(0,200));

// ---- the raven: perched in the build phase beside the guest
const rl=await until(guestPage,()=>window.__raven.loaded(),null,120000);
await tickBoth(10,5);
const spot=await guestPage.evaluate(()=>window.__raven.spots()[0]);
await guestPage.evaluate(s=>window.__dd.setHero(s.x,s.z+1.5),spot);
await tickBoth(4,5);
const r0=await guestPage.evaluate(()=>({ st:window.__raven.state(), near:window.__raven.near() }));
check("build phase: the guest's raven is perched and the guest is near it",rl&&r0.st==='perched'&&r0.near,JSON.stringify({rl,r0}));

// ---- a guest shown its OWN room (this host has no hideout) never touches the host's gear table
await guestPage.evaluate(()=>window.__hideout.open());
const gf=await frameOf(guestPage,"hideout/index.html");
const fb=gf?await until(gf,()=>typeof HD!=='undefined'&&HD.ownFallback===true,null,120000):false;
const fbState=gf?await gf.evaluate(()=>({ visiting:HD.visiting, own:HD.ownFallback, hk:/hk=/.test(location.search) })).catch(e=>String(e)):null;
check("the guest's hideout falls back to its own room (the host has none) and marks it so",fb&&fbState&&fbState.visiting===false&&fbState.own===true,JSON.stringify(fbState));
const sel=gf?await gf.evaluate(()=>{ SAVE.hotbar[0]={ kind:'carried', rec:{ id:'tst-1' } }; return window.__hd.select(0); }):null;
check("in that fallback room a gear slot gives no display ghost (no drop onto the host's table)",sel&&sel.drop===null,JSON.stringify(sel));
const tFb=Date.now(); await sleep(7000);
const after=gearCalls.filter(c=>c.t>tFb+200);
check("after the fallback the guest's room stops polling the host's gear table",after.length===0,JSON.stringify(after.slice(0,3))+' total '+gearCalls.length);

// ---- the bag over the room, then the host's horn
const bo=await guestPage.evaluate(()=>window.__hideoutbag.open());
const b0=await guestPage.evaluate(()=>({ open:window.__tavern.isOpen(), from:window.__hideoutbag.fromHideout() }));
check("the guest opens its bag over the hideout",bo&&b0.open&&b0.from,JSON.stringify({bo,b0}));
await hostPage.evaluate(()=>{ const d=window.__dd; d.S.phase='wave'; for(let i=0;i<5;i++) d.spawn('goblin','S'); });
await tickBoth(8,5); await sleep(400); await tickBoth(4,5);
const b1=await guestPage.evaluate(()=>({ world:window.__net.world()&&window.__net.world().phase, room:window.__hideout.isOpen(), open:window.__tavern.isOpen(), from:window.__hideoutbag.fromHideout(), z:document.getElementById('tavern').style.zIndex }));
check("the host's horn pulls the guest out of the room AND closes the bag over it (the hall is not left covered)",b1.world==='wave'&&!b1.room&&!b1.open&&!b1.from&&b1.z==='',JSON.stringify(b1));
await guestPage.evaluate(s=>window.__dd.setHero(s.x,s.z+1.5),spot);
await tickBoth(8,5);
const r1=await guestPage.evaluate(()=>({ st:window.__raven.state(), near:window.__raven.near(), pick:window.__raven.heroPickVisible(), prompt:document.getElementById('prompt').textContent }));
check("the host's wave: the guest's raven has flown off -- not near (E is a tower action), no hero buttons",r1.st!=="perched"&&!r1.near&&!r1.pick,JSON.stringify(r1));
const hero0=await guestPage.evaluate(()=>window.__heroes.pick());
await guestPage.keyboard.press('KeyH'); await tickBoth(2,5);
const hero1=await guestPage.evaluate(()=>window.__heroes.pick());
check("H beside the raven mid-wave does not swap the guest's hero",hero0===hero1,hero0+' -> '+hero1);
await hostPage.evaluate(()=>{ const d=window.__dd; d.enemies&&d.enemies.forEach(e=>{ e.dead=true; }); d.S.phase='build'; });
await tickBoth(10,5);
const r2=await guestPage.evaluate(()=>({ world:window.__net.world()&&window.__net.world().phase, st:window.__raven.state(), near:window.__raven.near() }));
check("the host's build phase again: the guest's raven is back on its perch",r2.world==='build'&&r2.st==='perched'&&r2.near,JSON.stringify(r2));

// ---- a run summary sharing the overlay is never closed by the room closing
const sm=await guestPage.evaluate(async()=>{ const T=window.__tavern; window.__hideout.open(); await new Promise(r=>setTimeout(r,300)); window.__hideoutbag.open(); T.summary({ kills:1, xpGained:0, goldGained:0, wave:1 }); window.__hideout.close(); const s=T.state(); const r={ open:s.open, sum:s.sum }; T.close(); return r; }).catch(e=>({err:String(e)}));
check("a run summary up on the same overlay stays when the room closes",sm.open===true&&sm.sum===true,JSON.stringify(sm));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis/i.test(e));
check("no page errors",realErrors.length===0,JSON.stringify(realErrors.slice(0,3)));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
