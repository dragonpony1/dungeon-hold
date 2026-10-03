// ===== co-op sweep 2026-10-02 (hud-ui): what a GUEST sees on its HUD, on the Drawbridge with a host.
//  * the mini-map draws the host's towers, the mob puppets (flyers orange), the mana orbs and the host as a teammate (97g-minimap.js)
//  * the wave strip says ALL n HELD on the host's victory lap, not NEXT · WAVE n / n
//  * the placement ghost turns red for the host's own reasons (Already occupied, DU, mana, Enemy too close) instead of green; the mana spend flash follows the guest's own pool
//  * the Heartroot's death cut plays on the guest (camera toward the inn's Heartroot), then the host's end card -- and the guest's end of the cut pays nothing itself
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-sweep-hud-ui-test.mjs -- the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9505, pagePort=9797;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(pagePort,{dist:"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostPage=await (await browser.newContext()).newPage(), guestPage=await (await browser.newContext()).newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));
for(const p of [hostPage,guestPage]) await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_minimap","on"); }catch(e){} });
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:"+pagePort+"/?silent&nogate&map=4",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__minimap&&window.__moatwalk&&window.__moatwalk.at,null,{timeout:90000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,30); });
async function tickBoth(batches=10,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); } }

const rc="hudui-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
const gid=guestJoin.id;
await guestPage.waitForTimeout(500);

// ---- the mini-map
await hostPage.evaluate(()=>{ const d=window.__dd; d.addMana(1e6); d.S.du=-200; const W=window.__moatwalk, a=W.at(20,32), b=W.at(28,32), h=W.at(24,40); d.placeDefAt('harpoon',a.x,a.z,0); d.placeDefAt('acorn',b.x,b.z,0); d.setHero(h.x,h.z,0);
  d.S.phase='wave'; for(let i=0;i<4;i++) d.spawn('goblin','S'); if(d.MOBS.moth) d.spawn('moth','S'); });
await tickBoth(8,5);
await hostPage.evaluate(()=>{ const d=window.__dd, g=d.enemies.find(e=>!e.dead&&e.kind==='goblin'); if(g) d.kill(g); });   // a kill drops mana orbs on the host
await tickBoth(6,5);
const mm=await guestPage.evaluate(()=>{ window.__minimap.draw(); return window.__minimap.info(); });
const hostMoth=await hostPage.evaluate(()=>window.__dd.enemies.some(e=>!e.dead&&e.kind==='moth'));
check("the guest's mini-map draws the host's two towers",mm.defs>=2,JSON.stringify(mm));
check("the guest's mini-map draws the mob puppets (MOBPUP is private to 99-network; it read nothing)",mm.mobs>=3,JSON.stringify(mm));
check("the guest's mini-map draws the host's mana orbs",mm.orbs>0,JSON.stringify(mm));
check("the guest's mini-map draws the host as a teammate",mm.mates>=1,JSON.stringify(mm));
check("a moth puppet is a flyer (orange) on the guest's map",!hostMoth||mm.fly>=1,JSON.stringify({mm,hostMoth}));
const mmHost=await hostPage.evaluate(()=>{ window.__minimap.draw(); return window.__minimap.info(); });
check("the host's map is unchanged (its towers, its mobs, the guest as a teammate)",mmHost.defs===2&&mmHost.mobs>=3&&mmHost.mates===1,JSON.stringify(mmHost));
await hostPage.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) if(!e.dead) d.kill(e); d.S.phase='build'; for(const o of d.orbs.slice()) o.life=0; });
await tickBoth(10,5);

// ---- the placement ghost
const W0=await hostPage.evaluate(()=>{ const a=window.__moatwalk.at(34,32); return {x:a.x,z:a.z}; });
await guestPage.evaluate(w=>{ const d=window.__dd; d.setHero(w.x,w.z,0); d.setCam(0,.42,8); },W0);
await tickBoth(4,5);
const kind=await guestPage.evaluate(()=>{ const d=window.__dd; window.__heroes.select('knight'); d.select('harpoon'); d.step(1/60,1); return d.ghost()?'harpoon':'NONE '+document.getElementById('toast').textContent; });   // the knight's ballista: the one tower the tutorial gate always lets through
await tickBoth(2,5);
const g0=await guestPage.evaluate(()=>window.__dd.ghost());
check("the guest has a green ghost on a free spot",!!kind&&g0&&g0.ok,JSON.stringify({kind,g0}));
if(g0){
  await hostPage.evaluate(({k,x,z})=>{ window.__dd.placeDefAt(k,x,z,0); },{k:kind,x:g0.x,z:g0.z});
  await tickBoth(6,5);
  const g1=await guestPage.evaluate(()=>window.__dd.ghost());
  check("on top of the host's tower the guest's ghost is red: Already occupied",g1&&!g1.ok&&g1.why==='Already occupied',JSON.stringify(g1));
  await hostPage.evaluate(({x,z})=>{ const d=window.__dd, t=d.defs.find(o=>Math.hypot(o.x-x,o.z-z)<.5); if(t) window.__perch.remove(t); d.S.du=999; },{x:g0.x,z:g0.z});
  await tickBoth(6,5);
  const g2=await guestPage.evaluate(()=>window.__dd.ghost());
  check("the hall's DU cap full: Not enough Defense Units",g2&&!g2.ok&&g2.why==='Not enough Defense Units',JSON.stringify(g2));
  await hostPage.evaluate(gid=>{ window.__dd.S.du=0; window.__combat.setGuestMana(gid,500); },gid);
  await tickBoth(6,5);
  const g3=await guestPage.evaluate(()=>window.__dd.ghost());
  check("room again: green",g3&&g3.ok,JSON.stringify(g3));
  await hostPage.evaluate(gid=>{ window.__combat.setGuestMana(gid,1); },gid);
  await tickBoth(6,5);
  const g4=await guestPage.evaluate(()=>({ g:window.__dd.ghost(), spend:document.querySelector('#hud .res .mana').classList.contains('spend'), mine:window.__myMana(), local:window.__dd.S.mana }));
  check("the guest's own pool short: Not enough mana (not its unspent local S.mana)",g4.g&&!g4.g.ok&&g4.g.why==='Not enough mana'&&g4.mine===1&&g4.local>1,JSON.stringify(g4));
  check("the guest's mana spend flash fires when its own pool drops",g4.spend,JSON.stringify(g4));
  await hostPage.evaluate(({gid,x,z})=>{ const d=window.__dd; window.__combat.setGuestMana(gid,500); d.spawn('goblin','S'); const e=d.enemies.find(e=>!e.dead); e.x=x+1; e.z=z; e.spd=0; },{gid,x:g0.x,z:g0.z});
  await tickBoth(6,5);
  const g5=await guestPage.evaluate(()=>window.__dd.ghost());
  check("a mob beside the spot: Enemy too close",g5&&!g5.ok&&g5.why==='Enemy too close',JSON.stringify(g5));
  await hostPage.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) if(!e.dead) d.kill(e); });
  await guestPage.evaluate(k=>window.__dd.select(k),kind);   // select again = put it away
  await tickBoth(4,5);
}
const solo=await hostPage.evaluate(()=>window.__myMana()===window.__dd.S.mana);
check("on the host __myMana is its own S.mana",solo);

// ---- the wave strip on the victory lap
await hostPage.evaluate(()=>{ const d=window.__dd; d.S.held=true; d.S.phase='build'; d.S.wave=7; });
await tickBoth(6,5);
const ws=await Promise.all([hostPage.evaluate(()=>window.__minimap.wave()),guestPage.evaluate(()=>window.__minimap.wave())]);
check("on the host's victory lap the guest's strip says ALL n HELD, as the host's does",/ALL \d+ HELD/.test(ws[1].text)&&/held/.test(ws[1].cls)&&ws[0].text.replace(/\s+/g,'')===ws[1].text.replace(/\s+/g,''),JSON.stringify(ws));
await hostPage.evaluate(()=>{ const d=window.__dd; d.S.held=false; d.S.wave=3; });
await tickBoth(4,5);

// ---- the death cut
await hostPage.evaluate(()=>{ const d=window.__dd; d.S.phase='wave'; d.spawn('goblin','S'); });
await tickBoth(6,5);   // the killer has been on the guest's screen a while, as in play
await hostPage.evaluate(()=>{ const d=window.__dd, e=d.enemies.find(e=>!e.dead); d.hurtCrystal(1e6,e,2); });
await tickBoth(2,3);
const c1=await Promise.all([hostPage.evaluate(()=>{ const c=window.__dd.deathCut(); return { ph:window.__dd.S.phase, hx:c&&c.hx, hz:c&&c.hz }; }),guestPage.evaluate(()=>{ const c=window.__dd.deathCut(); return { ph:window.__dd.S.phase, hx:c&&c.hx, hz:c&&c.hz, killer:!!(c&&c.killer), n:window.__gsfx().deathCut|0, cam:window.__dd.camPos() }; })]);
check("the host's inn Heartroot falls: the guest is in the death cut too, toward the same Heartroot, with the killer",c1[0].ph==='deathcut'&&c1[1].ph==='deathcut'&&c1[1].n===1&&c1[1].hx===c1[0].hx&&c1[1].hz===c1[0].hz&&c1[1].killer,JSON.stringify(c1));
await guestPage.evaluate(()=>window.__dd.step(1/60,20));
const cam2=await guestPage.evaluate(()=>window.__dd.camPos());
check("the guest's camera is moving with the cut",Math.hypot(cam2.x-c1[1].cam.x,cam2.y-c1[1].cam.y,cam2.z-c1[1].cam.z)>.01,JSON.stringify({a:c1[1].cam,b:cam2}));
const gold0=await guestPage.evaluate(()=>window.__dd.Meta.gold?window.__dd.Meta.gold():null);
await guestPage.evaluate(()=>window.__dd.step(1/60,150));   // the guest's own cut runs out before the host's runEnd: it holds, pays nothing
const hold=await guestPage.evaluate(()=>({ ph:window.__dd.S.phase, gold:window.__dd.Meta.gold?window.__dd.Meta.gold():null, dead:!document.getElementById('dead').classList.contains('hide') }));
check("the guest's cut ends on its own without paying or showing the card (it waits for the host)",hold.ph==='deathcut'&&!hold.dead&&hold.gold===gold0,JSON.stringify({gold0,hold}));
await tickBoth(30,5);
const end=await guestPage.evaluate(()=>({ ph:window.__dd.S.phase, cut:window.__dd.deathCut(), dead:!document.getElementById('dead').classList.contains('hide'), tally:window.__tavern.state().open&&window.__tavern.state().sum, h1:document.getElementById('deadh1').textContent }));
check("then the host's end card arrives: THE GATE HAS OPENED (build 508: under solo's tally)",end.ph==='dead'&&(end.dead||end.tally)&&!end.cut&&/GATE/.test(end.h1),JSON.stringify(end));

check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
