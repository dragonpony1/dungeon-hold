// ===== CO-OP SWEEP 2026-10-02 (audio-feedback): a guest sees and hears what the host does.
//  * the castle Heartroot's UNDER ATTACK strip and bell on a guest, the bell once per 3 s (it rang on every world update) -- 55-crystal.js / 99-network.js
//  * a killed mob plays its death on the guest instead of vanishing (and Avery's fall pose/feathers); kill()'s big-death list; a mob mid-swing swings -- 99-network.js / 95u-avery.js
//  * the Sky Wrecker's volley, the Electrifier's bolts, the Mouse Trap's snap and the Frost tower's bite on the guest's puppets -- 96p / 96n / 96o / 99-network.js
//  * the aura towers' rings on the guest's puppets -- 99-network.js
//  * a tower sold or lost on the host: the guest hears the sell / destroy sound -- 99-network.js
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-sweep-audio-feedback-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9743;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(9741,{dist:"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function open(){ const ctx=await browser.newContext(); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
  const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:9741/?silent&nogate&map=4",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__skywrecker&&window.__electrifier&&window.__mousetrap&&window.__avery&&window.__avery.guestDie&&window.__moatwalk&&window.__moatwalk.at,null,{timeout:90000});
  await p.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); return p; }
const hostPage=await open(), guestPage=await open();
async function tickBoth(batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await sleep(20); } }
const roomCode="af-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
await hostPage.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.addMana(1e6); d.S.du=-200; d.S.phase='wave'; d.S.waveT=-1e9; d.setHero(-30,-30,0); });
await guestPage.evaluate(()=>{ window.__dd.setHero(-32,-30,0); const S=window.__dd.SFX; window.__cnt={}; for(const k of ['bigDie','die','sell','destroy','alarm','frost','thud']){ const f=S[k]; window.__cnt[k]=0; S[k]=function(){ window.__cnt[k]++; return f&&f.apply(this,arguments); }; } });
await tickBoth(6,5);

// ---- 1. the castle Heartroot under attack: strip + one bell per 3 s on the guest, and the flash
{ const r0=await guestPage.evaluate(()=>({ rings:window.__alarm.rings(), alarm:window.__cnt.alarm }));
  for(let i=0;i<6;i++){ await hostPage.evaluate(()=>{ window.__dd.S.crystal-=3; }); await tickBoth(2,4); }
  const r1=await guestPage.evaluate(()=>({ rings:window.__alarm.rings(), alarm:window.__cnt.alarm, on:window.__alarm.on(), hits:window.__gsfx().crystal }));
  check("the host's castle Heartroot loses life 6 times in ~1 s: the guest sees UNDER ATTACK and the bell rings once (3 s cooldown), not on every update",r1.on&&r1.rings-r0.rings===1&&r1.alarm===r0.alarm&&r1.hits>=3,JSON.stringify({r0,r1}));
  await hostPage.evaluate(()=>{ window.__dd.S.crystal2=(window.__dd.S.crystal2||150)-10; }); await tickBoth(2,4);
  const r2=await guestPage.evaluate(()=>({ alarm:window.__cnt.alarm, rings:window.__alarm.rings(), hits:window.__gsfx().crystal }));
  check("the inn Heartroot's hit is heard on the guest but rings no bell (the host never rings it for the inn or keep; 99-network rang SFX.alarm here)",r2.alarm===r1.alarm&&r2.rings===r1.rings&&r2.hits>r1.hits,JSON.stringify({r1,r2})); }

// ---- 2. a mob mid-swing, and its death on the guest
{ const u=await guestPage.evaluate(()=>window.__mobsync.unpack({k:['goblin'],l:[[7,0,1,0,2,0,2,10],[8,0,1,0,2,0,1,10]]}).map(e=>({w:e.walking,a:e.atk})));
  check("the mobs row carries a swing (2) apart from walking (1)",u[0].a===true&&u[0].w===false&&u[1].w===true&&u[1].a===false,JSON.stringify(u));
  const id=await hostPage.evaluate(()=>{ const d=window.__dd; d.spawn('orc','S'); const e=d.enemies[d.enemies.length-1]; e.spd=0; e.atk=1e9; e.x=6; e.z=-20; e.hp=e.max=500; window.__orc=e; return true; });
  await tickBoth(4,5);
  await hostPage.evaluate(()=>{ const e=window.__orc; for(let i=0;i<8;i++){ e.swing=.01; e.pending=null; e.walking=false; window.__dd.step(1/60,1); } e.swing=.01; });   // held mid-swing (the swing clock kept at its start) over a broadcast
  await sleep(150); await guestPage.evaluate(()=>window.__dd.step(1/60,1));
  const sw=await guestPage.evaluate(()=>{ const id=window.__mobsync.list().find(i=>{ const g=window.__mobsync.get(i); return g&&g.kind==='orc'; }); return id?window.__mobsync.get(id):null; });
  check("a mob mid-swing on the host swings on the guest",sw&&sw.atk===true,JSON.stringify(sw));
  const b0=await guestPage.evaluate(()=>window.__cnt.bigDie);
  await hostPage.evaluate(()=>{ window.__orc.swing=-1; window.__dd.kill(window.__orc); });
  await hostPage.evaluate(()=>window.__dd.step(1/60,6)); await sleep(150); await guestPage.evaluate(()=>window.__dd.step(1/60,3));
  const g1=await guestPage.evaluate(()=>({ dying:window.__mobdie(), orcs:window.__mobsync.foes().filter(x=>x.kind==='orc').length, big:window.__cnt.bigDie }));
  check("the orc's death plays on the guest (kept up as it dies, out of the live list) with the big death sound",g1.dying.some(x=>x.kind==='orc')&&g1.orcs===0&&g1.big===b0+1,JSON.stringify({g1,b0}));
  await tickBoth(16,5);
  const g2=await guestPage.evaluate(()=>window.__mobdie());
  check("and is gone once the death is over",!g2.some(x=>x.kind==='orc'),JSON.stringify(g2)); }

// ---- 3. Avery's fall on the guest (her pose, feathers and fireworks on her puppet as it drops)
{ await hostPage.evaluate(()=>{ window.__net.send('mobs',{k:['avery'],l:[['tAv',0,4,22,-14,0,0,100,5200]],died:[]}); window.__net.send('mobs',{k:[],l:[],died:[{id:'tAv',kind:'avery'}]}); });
  await sleep(250); await guestPage.evaluate(()=>window.__dd.step(1/60,6));
  const a=await guestPage.evaluate(()=>({ dies:window.__avery.guestDies(), dying:window.__mobdie().filter(x=>x.kind==='avery'), feathers:window.__avery.info().feathers }));
  check("Avery's death on the guest: the fall show runs on her puppet and she drops instead of vanishing in the air",a.dies===1&&a.dying.length===1&&a.dying[0].y<22&&a.feathers>0,JSON.stringify(a));
  await hostPage.evaluate(()=>window.__dd.step(1/60,2)); await tickBoth(12,5); }
// ---- 3b. a keg cart killed on the host goes up on the guest's screen too (no damage there: 95h's guest check)
{ const k0=await guestPage.evaluate(()=>window.__blight.info().blasts);
  await hostPage.evaluate(()=>{ window.__net.send('mobs',{k:['kegcart'],l:[['tKg',0,4,0,-14,0,0,100,300]],died:[]}); window.__net.send('mobs',{k:[],l:[],died:[{id:'tKg',kind:'kegcart'}]}); });
  await sleep(250); await guestPage.evaluate(()=>window.__dd.step(1/60,3));
  const k1=await guestPage.evaluate(()=>window.__blight.info().blasts);
  check("a keg cart's death blast shows on the guest",k1===k0+1,JSON.stringify({k0,k1})); await tickBoth(4,5); }

// ---- 4. the Sky Wrecker, the Electrifier, the Mouse Trap and the Frost tower on the guest
{ await hostPage.evaluate(()=>{ const d=window.__dd; const W=window.__moatwalk, P=(k,cx,cz)=>{ const a=W.at(cx,cz); return d.placeDefAt(k,a.x,a.z,0); }; window.__sky=P('sky',20,32); window.__shk=P('shock',28,32); window.__trp=P('trap',24,40); window.__frz=P('frost',16,36); window.__zap=P('zap',32,36);
    for(const t of [window.__sky,window.__shk,window.__trp,window.__frz,window.__zap]) if(t) t.cd=99; });
  await tickBoth(8,5);
  const placed=await hostPage.evaluate(()=>[window.__sky,window.__shk,window.__trp,window.__frz,window.__zap].map(t=>t?t.kind:null));
  check("the host's five towers stand",placed.every(Boolean),JSON.stringify(placed));
  const s0=await guestPage.evaluate(()=>({ sky:window.__skywrecker.info(), shk:window.__electrifier.info(), trp:window.__mousetrap.info(), frost:window.__cnt.frost }));
  await hostPage.evaluate(()=>{ const d=window.__dd; const mk=(k,x,z,hp)=>{ d.spawn(k,'S'); const e=d.enemies[d.enemies.length-1]; e.spd=0; e.atk=1e9; e.x=x; e.z=z; e.hp=e.max=hp; return e; };
    window.__drk=mk('drake',window.__sky.x+8,window.__sky.z+4,5000); window.__gob=mk('goblin',window.__shk.x+3,window.__shk.z,5000); window.__gob2=mk('goblin',window.__frz.x+2,window.__frz.z,5000); });
  await tickBoth(4,5);   // the guest has their puppets (and their ids) first
  await hostPage.evaluate(()=>{ window.__sky.cd=0; window.__shk.cd=0; window.__frz.cd=0; window.__dd.step(1/60,1); window.__mousetrap.spring(window.__trp); });
  await tickBoth(4,5);
  const s1=await guestPage.evaluate(()=>({ sky:window.__skywrecker.info(), shk:window.__electrifier.info(), trp:window.__mousetrap.info(), frost:window.__cnt.frost, thud:window.__cnt.thud, gf:window.__gsfx().frost|0 }));
  check("the Sky Wrecker's volley flies on the guest's screen (rockets at the drake's puppet)",s1.sky.volleys>s0.sky.volleys&&s1.sky.rockets>s0.sky.rockets,JSON.stringify({s0:s0.sky,s1:s1.sky}));
  check("the Electrifier's bolt is drawn on the guest",s1.shk.shots>s0.shk.shots&&s1.shk.bolts>s0.shk.bolts,JSON.stringify({s0:s0.shk,s1:s1.shk}));
  check("the Mouse Trap snaps on the guest, with its thud",s1.trp.springs>s0.trp.springs&&s1.thud>=1,JSON.stringify({s0:s0.trp,s1:s1.trp,thud:s1.thud}));
  check("the Frost tower's bite: ice glints and the frost chime on the guest",s1.frost>s0.frost&&s1.gf>=1,JSON.stringify({f0:s0.frost,f1:s1.frost,gf:s1.gf}));
  let mx=null; for(let i=0;i<30;i++){ await tickBoth(2,5); mx=await guestPage.evaluate(()=>({ sky:window.__skywrecker.info().mixers, shk:window.__electrifier.info().mixers, trp:window.__mousetrap.info().mixers||0 })); if(mx.sky>0&&mx.shk>0&&mx.trp>0) break; await sleep(200); }
  check("their models' clips play on the guest's puppets too",mx.sky>0&&mx.shk>0&&mx.trp>0,JSON.stringify(mx));
  // ---- 5. aura rings on the guest's puppets
  const au=await guestPage.evaluate(()=>window.__defsync.list().map(id=>window.__defsync.get(id)).filter(g=>g.kind==='zap'||g.kind==='frost').map(g=>({k:g.kind,aura:g.aura,rr:g.rr})));
  check("the Zap halo's and the Frost tower's rings show on the guest, at the host's reach",au.length===2&&au.every(a=>a.aura&&a.rr>0),JSON.stringify(au)); }

// ---- 6. a tower sold / lost on the host: the guest hears it
{ const c0=await guestPage.evaluate(()=>({ sell:window.__cnt.sell, destroy:window.__cnt.destroy, n:window.__defsync.list().length }));
  await hostPage.evaluate(()=>{ window.__perch.remove(window.__zap); });
  await tickBoth(3,5);
  const c1=await guestPage.evaluate(()=>({ sell:window.__cnt.sell, destroy:window.__cnt.destroy, n:window.__defsync.list().length }));
  check("a tower lost on the host: the guest hears it smashed and the tower goes",c1.destroy===c0.destroy+1&&c1.sell===c0.sell&&c1.n===c0.n-1,JSON.stringify({c0,c1}));
  await hostPage.evaluate(()=>{ const t=window.__frz, d=window.__dd; d.setHero(t.x,t.z+1.6,Math.PI); d.sell(); });
  await tickBoth(3,5);
  const c2=await guestPage.evaluate(()=>({ sell:window.__cnt.sell, destroy:window.__cnt.destroy, n:window.__defsync.list().length }));
  check("a tower sold on the host: the guest hears the sale",c2.sell===c1.sell+1&&c2.destroy===c1.destroy&&c2.n===c1.n-1,JSON.stringify({c1,c2})); }

check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
