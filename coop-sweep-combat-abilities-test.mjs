// ===== co-op sweep 2026-10-02 (combat-abilities): a guest's aim, hazards and teammates' bodies work as in single player.
//  * a guest's reticle locks on the host's mobs (84-aim.js pick() scans the mob proxies) and its bolt flies at the locked mob (99-network.js)
//  * a moth egg bursting under the guest's copy hurts it; a blight blast hurts it; a siege cart takes a quarter of its health (95t / 95h / 95i)
//  * a teammate's puppet plays its swing and its death (98-party.js setAct, the sw/swd/dead fields in 99-network.js)
//  * a relayed Subterfuge arrow is not fanned again on the guest (hshot one:true)
//  * the host's stuck-straggler red beacon shows on the guest (88-straggler.js guestMarks)
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-sweep-combat-abilities-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9487;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(8927,{dist:"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));
for(const p of [hostPage,guestPage]) await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.removeItem("dd_talents"); }catch(e){} });
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8927/?silent&nogate",{timeout:120000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat&&window.__party&&window.__straggler,null,{timeout:120000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__freeze=true; try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); window.__dd.step(1/60,30); });
async function tickBoth(batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); } }
const roomCode="coopca-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
const hostId=hostOpen.id, gid=guestJoin.id;
await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0));
await guestPage.evaluate(()=>{ window.__dd.setHero(0,6,0); window.__dd.setCam(0,.42,8); });
await tickBoth(12,5);
const mob=(x,z,o)=>hostPage.evaluate(({x,z,o})=>{ const d=window.__dd, e=d.spawn(o&&o.kind||'goblin','N'); e.x=x; e.z=z; e.y=0; e.hp=9999; e.max=9999; e.dmg=0; e.atk=999; e.holdT=999; Object.assign(e,o||{}); return true; },{x,z,o});
const clearMobs=()=>hostPage.evaluate(()=>{ window.__dd.enemies.length=0; });
const mobBy=id=>hostPage.evaluate(id=>{ const e=window.__dd.enemies.find(e=>e.__coopId===id); return e?{hp:e.hp,dead:!!e.dead}:null; },id);
const gHero=()=>hostPage.evaluate(id=>window.__combat.guestHero(id),gid);
const heal=()=>hostPage.evaluate(id=>{ const g=window.__combat.guestHero(id); const H=window.__dd.Meta.heroes().find(h=>h.gid===id); return {g,H:!!H}; },gid);

// wait for the guest's staff (a fresh player is the Witch)
for(let i=0;i<150;i++){ if(await guestPage.evaluate(()=>window.__aim&&window.__aim.kind()==='staff')) break; await tickBoth(1,2); }

// ---- 1. the reticle locks for a guest, and its bolt flies at the locked mob
const gp=await guestPage.evaluate(()=>({x:window.__dd.hero.x,z:window.__dd.hero.z}));   // a guest stands at its own spawn spot
await mob(gp.x+2.4,gp.z+6,{__coopId:'aA'});
await tickBoth(6,5);
const lock=await guestPage.evaluate(()=>{ const t=window.__aim.pick(); return t?{id:t.__coopId,puppet:!!t.puppet}:null; });
check("the guest's reticle locks on the host's mob (its puppet proxy)",lock&&lock.id==='aA'&&lock.puppet,JSON.stringify(lock));
// control: with the lock taken away the bare aim ray passes the mob by
const a0=await mobBy('aA');
await guestPage.evaluate(()=>{ const A=window.__aim; A.__p=A.pick; A.pick=()=>null; window.__dd.swing(); });
await tickBoth(14,5);
await guestPage.evaluate(()=>{ const A=window.__aim; A.pick=A.__p; delete A.__p; });
const a1=await mobBy('aA');
await tickBoth(10,5);
await guestPage.evaluate(()=>window.__dd.swing());
await tickBoth(14,5);
const a2=await mobBy('aA');
check("free aim (nothing locked) misses a mob off to the side",a0&&a1&&a1.hp===a0.hp,JSON.stringify({a0,a1}));
check("...the locked shot flies at the mob and hurts it on the host",a1&&a2&&a2.hp<a1.hp,JSON.stringify({a1,a2}));
await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__coopId==='aA'); if(e) window.__dd.kill(e); });
await tickBoth(8,5);
const lock2=await guestPage.evaluate(()=>{ const t=window.__aim.pick(); return t?t.__coopId:null; });
check("the lock lets go when the mob dies (no brackets on empty air)",lock2===null,JSON.stringify(lock2));
await clearMobs(); await tickBoth(4,5);

// ---- 2. the hazards reach the guest's hero
await guestPage.evaluate(()=>{ window.__dd.setHero(0,6,0); }); await tickBoth(6,5);
const h0=await gHero();
await mob(h0.x,h0.z,{kind:'moth',__coopId:'mA',eggT:0,y:h0.y+3.8});
await tickBoth(4,5);
await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__coopId==='mA'); if(e){ e.eggT=999; e.x=40; e.z=40; } });
let mi=null; for(let i=0;i<20;i++){ await tickBoth(3,10); mi=await hostPage.evaluate(()=>window.__moth.info()); if(mi.bursts>=1) break; }
const h1=await gHero();
check("a moth egg bursting at the guest's feet hurts the guest (as it does the host)",mi&&mi.bursts>=1&&mi.heroHits>=1&&h1.hp<h0.hp,JSON.stringify({mi,h0:h0.hp,h1:h1.hp}));
await clearMobs();
await tickBoth(4,5);
const b0=await gHero();
const bi=await hostPage.evaluate(g=>{ window.__blight.explode(g.x+1,g.z); return window.__blight.info(); },b0);
const b1=await gHero();
check("a blight blast beside the guest hurts the guest",bi.hero>=1&&b1.hp<b0.hp,JSON.stringify({bi:bi.hero,b0:b0.hp,b1:b1.hp}));
const c0=await gHero();
await hostPage.evaluate(id=>{ const H=window.__dd.Meta.heroes().find(h=>h.gid===id); window.__carts.siegeHit({dmg:1,x:H.x,z:H.z},{kind:'hero',hero:H}); },gid);
const c1=await gHero();
check("a siege cart's blow takes about a quarter of the guest's health (not its flat 1)",c0.hp-c1.hp>=c0.hp*.1,JSON.stringify({c0:c0.hp,c1:c1.hp}));

// ---- 3. a teammate's puppet swings and falls
for(let i=0;i<200;i++){ const r=await hostPage.evaluate(id=>{ const p=window.__party.get(id); return p&&p.ready; },gid)&&await guestPage.evaluate(id=>{ const p=window.__party.get(id); return p&&p.ready; },hostId); if(r) break; await tickBoth(1,3); await new Promise(r=>setTimeout(r,50)); }
const s0=await hostPage.evaluate(id=>window.__party.get(id),gid);
await guestPage.evaluate(()=>window.__dd.swing());
let sawG=false; for(let i=0;i<12&&!sawG;i++){ await tickBoth(1,3); const p=await hostPage.evaluate(id=>window.__party.get(id),gid); sawG=p&&p.swinging&&p.cur==='attack'; }
check("the host sees the guest's puppet swing (its attack clip)",sawG,JSON.stringify({s0:s0&&{sw:s0.sw,ready:s0.ready,cur:s0.cur}}));
await hostPage.evaluate(()=>window.__dd.swing());
let sawH=false; for(let i=0;i<12&&!sawH;i++){ await tickBoth(1,3); const p=await guestPage.evaluate(id=>window.__party.get(id),hostId); sawH=p&&p.swinging&&p.cur==='attack'; }
check("the guest sees the host's puppet swing",sawH,JSON.stringify(await guestPage.evaluate(id=>{ const p=window.__party.get(id); return p&&{sw:p.sw,cur:p.cur,ready:p.ready}; },hostId)));
await tickBoth(10,5);
await hostPage.evaluate(id=>{ const H=window.__dd.Meta.heroes().find(h=>h.gid===id); for(let i=0;i<30&&!H.isDead();i++) H.hurt(99999); },gid);
await tickBoth(4,5);
const d1=await hostPage.evaluate(id=>window.__party.get(id),gid);
check("the guest falls: its puppet on the host plays the death clip",d1&&d1.dead&&(d1.cur==='death'||d1.cur==='idle'),JSON.stringify(d1&&{dead:d1.dead,cur:d1.cur}));
let hid=false; for(let i=0;i<30&&!hid;i++){ await tickBoth(1,8); const p=await hostPage.evaluate(id=>window.__party.get(id),gid); hid=p&&p.dead&&!p.visible; if(p&&!p.dead) break; }
check("...then lies a beat and is gone (as the local hero is), until the respawn",hid,"");
await tickBoth(30,8);
const d2=await hostPage.evaluate(id=>window.__party.get(id),gid);
check("back up at the spawn: shown again",d2&&!d2.dead&&d2.visible,JSON.stringify(d2&&{dead:d2.dead,visible:d2.visible}));

// ---- 4. a relayed Subterfuge arrow is one arrow on the guest, not five
const n0=await guestPage.evaluate(()=>window.__bow.arrows());
await hostPage.evaluate(()=>window.__shotEvent('arrow','subterfuge',{x:0,y:1.2,z:-20},{x:0,y:0,z:1},30,{life:1,size:1,dmg:5}));
await tickBoth(1,2);
const n1=await guestPage.evaluate(()=>window.__bow.arrows());
check("a relayed Subterfuge wedge arrow is drawn once on the guest (it was fanned into 5)",n1-n0===1,JSON.stringify({n0,n1}));

// ---- 5. the stuck-straggler beacon on the guest
await clearMobs();
await mob(4,14,{__coopId:'sA'});
await hostPage.evaluate(()=>{ const d=window.__dd, e=d.enemies.find(e=>e.__coopId==='sA'); d.S.phase='wave'; e.__sx=e.x; e.__sz=e.z; e.__atk=e.atk; e.__stuckT=window.__straggler.STUCK_MARK+.5; d.step(1/60,1); });
await tickBoth(6,5);
const st1={ host:await hostPage.evaluate(()=>window.__straggler.marked()), guest:await guestPage.evaluate(()=>window.__straggler.guestBeacons()) };
check("the host's stuck mob gets its red beacon on the guest's screen too",st1.host===1&&st1.guest===1,JSON.stringify(st1));
await hostPage.evaluate(()=>{ const d=window.__dd, e=d.enemies.find(e=>e.__coopId==='sA'); if(e) d.kill(e); });
await tickBoth(6,5);
const st2=await guestPage.evaluate(()=>window.__straggler.guestBeacons());
check("...and it goes when the mob does",st2===0,JSON.stringify(st2));

const errs=errors.filter(e=>!/WebGL|GPU|Failed to fetch|net::/i.test(e));
check("no page errors",errs.length===0,errs.slice(0,3).join(" | "));
console.log(results.filter(x=>x).length+"/"+results.length+" passed");
await browser.close(); server.close(); try{ sig.close&&sig.close(); }catch(e){}
process.exit(results.every(x=>x)?0:1);
