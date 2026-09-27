// ===== THE VICTORY LAP (build 160). Matt, after his first hall: it said HALL HELD and then "didn't let me walk around or have any
// control of moving on" -- "you should be able to walk around and collect mana, spend your gold on upgrades, maybe even go to the
// hideout and back and move on to the next map at your discretion". Holding a map's last wave now keeps the hall open (game.js winMap:
// S.held, the phase back to 'build'): the map is cleared and its gold paid at once, nothing more comes down the lanes, and the horn
// button reads ▶ MOVE ON -- it (or G) ends the run the old way (moveOn: phase 'won', the tally with NEXT MAP), paying nothing twice.
// Co-op (99-network.js): every guest gets the lap and is paid at HALL HELD ('mapHeld'); a guest's MOVE ON only says the host decides;
// the host's MOVE ON sends 'runEnd' (held: already paid) and only then leaves the matchmaking server.
//  - solo, map one: the locker gate still holds a WAVE; the last wave held -> the banner, phase build + held, CLEARED on the HUD, the
//    horn button ▶ MOVE ON, ddMapsCleared 1, 325 gold paid and saved right then, no tally (not even after the old 2.4 s); the crystal
//    can't fall; the hero walks and jumps; an orb and the held wave's loot are picked up; a defense is picked, placed and upgraded; the
//    shop sells; the guide's wave-zero goblin never comes; the portal opens the hideout and it stays open, then back; G with the
//    Forest locker piece waiting moves on anyway: phase won, the HALL HELD tally with NEXT MAP, the gold not paid twice, the hall stops
//  - co-op: the guest sees the lap and is paid once at HALL HELD; it walks (its copy on the host follows), picks up its loot; its G and
//    its button change nothing; a friend walking in on the lap is never paid for the map; the guest in the hideout when the host's
//    ▶ MOVE ON lands is pulled out onto HALL HELD with ⟲ REJOIN, its gold unmoved; the host is on the server through the lap, off after;
//    and a host who leaves on the lap (never moving on) leaves its guest on HALL HELD, paid once -- not THE HOST LEFT.
// Ports 8781 (http), 9681 (signaling).
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer=null; try { ({ PeerServer } = await import("peer")); } catch(e) {}
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8781, sigPort=9681;
const server=await serve(PORT);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];
const LOCKER=JSON.stringify({item:{id:'vlap1',name:'Bark Coat of the Forest',slot:'armor',rarity:1,lvl:1,tier:1,stats:{hp:5},value:10},at:1,taken:false});
async function open(){ const ctx=await browser.newContext({viewport:{width:1100,height:700}}); const p=await ctx.newPage(); p.setDefaultTimeout(120000); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate",{timeout:120000});
  await p.waitForFunction(()=>window.__dd&&window.__meta&&window.__net&&window.__hideout&&window.__portal&&window.__trainer&&window.__forest&&window.__tavern&&window.__lobby,null,{timeout:120000});
  await p.waitForFunction(()=>window.__portal.loaded(),null,{timeout:90000}).catch(()=>{});   // the archway's model: the portal only shows once it's in
  await p.evaluate(()=>{ window.__freeze=true; window.__meta.reset(); window.__dd.resetGear(); window.__dd.start(); window.__dd.step(1/60,30); });
  return {ctx,p}; }
const hud=p=>p.evaluate(()=>{ const $=id=>document.getElementById(id), d=window.__dd;
  return {phase:d.S.phase,held:d.S.held,banner:$('banner').textContent,wavet:$('wavet').textContent,phaset:$('phaset').textContent,btn:$('wavebtn').textContent,btnOff:$('wavebtn').disabled,
    cleared:localStorage.getItem('ddMapsCleared'),gold:window.__meta.gold(),saved:(JSON.parse(localStorage.getItem('ddMeta')||'{}')||{}).gold,tally:window.__tavern.isOpen(),dead:!$('dead').classList.contains('hide')}; });

// ==================== SOLO, map one ====================
const {ctx:Actx,p:A}=await open();
// the map-one locker gate still guards a WAVE: with the last Forest piece waiting, the horn doesn't sound
const gate=await A.evaluate(L=>{ const d=window.__dd; d.S.wave=d.map().waves-1; localStorage.setItem(window.__forest.LOCKER_KEY,L); const pending=window.__forest.lockerPending(); d.startWave(); const r={pending,phase:d.S.phase,wave:d.S.wave,held:d.S.held}; localStorage.removeItem(window.__forest.LOCKER_KEY); return r; },LOCKER);
check("before the lap, the map-one locker gate still holds the horn (a Forest piece waiting: no wave 7)",gate.pending&&gate.phase==='build'&&gate.wave===6&&!gate.held,JSON.stringify(gate));
// the last wave, held for real
const fin=await A.evaluate(()=>{ const d=window.__dd; d.setHero(500,500,0); d.step(1/60,2); const g0=window.__meta.gold(); d.startWave(); const banner=document.getElementById('banner').textContent; let n=0;
  for(let i=0;i<60*60&&d.S.phase==='wave';i++){ d.step(1/60,1); for(const e of d.enemies) if(!e.dead){ d.kill(e); n++; } } d.step(1/60,2); return {g0,banner,n,waves:d.map().waves,eff:d.effWave()}; });
const lap=await hud(A); const pay=await A.evaluate(()=>({payout:window.__meta.summary().payout,best:window.__meta.best()}));
check("the last wave held (WAVE 7 OF 7, "+fin.n+" mobs): HALL HELD, and the hall stays in play -- phase build, held, the HUD says CLEARED and how to move on",
  /WAVE 7 OF 7/.test(fin.banner)&&fin.n>0&&/HALL HELD/.test(lap.banner)&&lap.phase==='build'&&lap.held&&/HALL HELD — .*CLEARED/.test(lap.wavet)&&/moves? on/i.test(lap.phaset),JSON.stringify({fin,lap}));
check("the horn button reads ▶ MOVE ON, and it is live",lap.btn==='▶ MOVE ON'&&!lap.btnOff,JSON.stringify({btn:lap.btn,off:lap.btnOff}));
check("the map is marked cleared (ddMapsCleared 1) and the win's gold is paid right then, and saved: 25x7+150 = 325, on top of the wave's own 45",
  lap.cleared==='1'&&pay.payout===325&&lap.gold-fin.g0===325+45&&lap.saved===lap.gold&&pay.best===7,JSON.stringify({cleared:lap.cleared,pay,gain:lap.gold-fin.g0,saved:lap.saved,gold:lap.gold}));
await A.waitForTimeout(3000);   // the old run end came 2.4 s after the last kill, by itself
const still=await hud(A);
check("no tally on its own: no summary card, no end screen, still on the lap 3 s later",!lap.tally&&!lap.dead&&!still.tally&&!still.dead&&still.phase==='build'&&still.held,JSON.stringify({lap:[lap.tally,lap.dead],still:[still.tally,still.dead,still.phase]}));
const cr=await A.evaluate(()=>{ const d=window.__dd, c0=d.S.crystal; d.hurtCrystal(99999); d.step(1/60,30); return {c0,c1:d.S.crystal,phase:d.S.phase,cut:!!d.deathCut()}; });
check("the crystal can't fall on the lap (a killing blow does nothing)",cr.c1===cr.c0&&cr.phase==='build'&&!cr.cut,JSON.stringify(cr));
// the hero has stood far off (500,500) since the horn, so everything the wave left is still on the floor
const lt=await A.evaluate(()=>{ const d=window.__dd; const l=d.loot.slice().sort((a,b)=>Math.hypot(a.x,a.z-4.6)-Math.hypot(b.x,b.z-4.6))[0]; if(!l) return {none:true}; const b0=window.__meta.bag().length, n0=d.loot.length; d.setHero(l.x,l.z+.5,0); d.step(1/60,60); return {b0,b1:window.__meta.bag().length,n0,n1:d.loot.length}; });
check("the held wave's reward is picked up on the lap (into the bag)",!lt.none&&lt.b1>lt.b0&&lt.n1<lt.n0,JSON.stringify(lt));
const orb=await A.evaluate(()=>{ const d=window.__dd; const o=d.orbs.find(o=>o.y<1.5&&Math.hypot(o.x,o.z)>6); if(!o) return {none:true,n:d.orbs.length}; const m0=d.S.mana, n0=d.orbs.length; d.setHero(o.x,o.z+1.5,0); d.step(1/60,90); return {m0,m1:d.S.mana,n0,n1:d.orbs.length}; });
check("an orb the last wave left is collected on the lap (mana up, the orb gone)",!orb.none&&orb.m1>orb.m0&&orb.n1<orb.n0,JSON.stringify(orb));
const mv=await A.evaluate(()=>{ const d=window.__dd; d.setHero(0,8,0); d.setCam(0,.42,8); d.step(1/60,10); const a={x:d.hero.x,z:d.hero.z}; d.setKeys({w:1}); d.step(1/60,45); d.setKeys({w:0}); d.step(1/60,5); const b={x:d.hero.x,z:d.hero.z};
  const y0=d.hero.y; d.jump(); d.step(1/60,8); const up=d.hero.y-y0; d.step(1/60,60); return {a,b,walked:+Math.hypot(b.x-a.x,b.z-a.z).toFixed(2),up:+up.toFixed(2)}; });
check("the hero walks (W for 0.75 s: "+mv.walked+" units) and jumps on the lap",mv.walked>2&&mv.up>.5,JSON.stringify(mv));
const bu=await A.evaluate(()=>{ const d=window.__dd; d.addMana(600); d.setHero(0,8,Math.PI); d.step(1/60,3); d.select('harpoon'); const ghost=!!d.ghost(); d.select('harpoon'); const gone=!d.ghost();
  const def=d.placeDefAt('harpoon',-1.1,9.4,0); d.setHero(-1.1,8.1,Math.PI); d.step(1/60,3); const m0=d.S.mana, l0=def?def.lvl||1:0; d.upgrade(); d.step(1/60,2); return {ghost,gone,placed:!!def,l0,l1:def?def.lvl:0,spent:m0-d.S.mana}; });
check("building works on the lap: a defense is picked up on the hotbar, one is set down and upgraded to Mark II (mana spent)",bu.ghost&&bu.gone&&bu.placed&&bu.l0===1&&bu.l1===2&&bu.spent>0,JSON.stringify(bu));
const shop=await A.evaluate(()=>{ const M=window.__meta; window.__tavern.open(); const open=window.__tavern.isOpen(); const st=M.stock(); let i=-1, best=1e12; st.forEach((it,k)=>{ const p=M.buyPrice(it); if(p<best){ best=p; i=k; } }); const g0=M.gold(), b0=M.bag().length; const ok=i>=0&&M.buy(i); const r={open,price:best,ok,paid:g0-M.gold(),bag:M.bag().length-b0}; window.__tavern.close(); r.closed=!window.__tavern.isOpen(); r.phase=window.__dd.S.phase; return r; });
check("the win's gold spends on the lap: the tavern opens, the shop sells (gold down by the price, the piece in the bag), back to the hall",shop.open&&shop.ok&&shop.paid===shop.price&&shop.bag===1&&shop.closed&&shop.phase==='build',JSON.stringify(shop));
const tr=await A.evaluate(()=>{ const d=window.__dd; window.__trainer.reset(); d.step(1/60,180); return {alive:d.status().enemies,w0:window.__trainer.w0(),step:window.__trainer.step()}; });
check("the training guide's wave-zero goblin never walks on the lap (guide reset to step one, 3 s on: no mob)",tr.alive===0&&!tr.w0.spawned&&tr.step==='slay',JSON.stringify(tr));
const po=await A.evaluate(async()=>{ const d=window.__dd; d.step(1/60,60); const st=window.__portal.state(), pos=window.__portal.pos(); d.setHero(pos.x+1.3,pos.z,0); d.step(1/60,3); const near=window.__hideout.near(), prompt=document.getElementById('prompt').textContent;
  d.upgrade(); const open=window.__hideout.isOpen(); await new Promise(r=>setTimeout(r,1000)); const stayed=window.__hideout.isOpen(); window.__hideout.close(); d.step(1/60,3); return {st,near,prompt,open,stayed,back:!window.__hideout.isOpen(),phase:d.S.phase,held:d.S.held}; });
check("the portal stands on the lap and E steps through it; the hideout stays open (nothing calls you back), and you come back to the lap",po.st==='shown'&&po.near&&/portal/.test(po.prompt)&&po.open&&po.stayed&&po.back&&po.phase==='build'&&po.held,JSON.stringify(po));
// MOVE ON: G, with the last Forest piece waiting in the locker (the lap's own Forest thanks may already have put it there)
const pre=await A.evaluate(L=>{ const d=window.__dd; d.setHero(0,8,0); d.step(1/60,3); if(!window.__forest.lockerPending()) localStorage.setItem(window.__forest.LOCKER_KEY,L); return {pending:window.__forest.lockerPending(),gold:window.__meta.gold()}; },LOCKER);
await A.evaluate(()=>{ try{ document.activeElement&&document.activeElement.blur&&document.activeElement.blur(); }catch(e){} window.focus(); });
await A.keyboard.press('KeyG');
await A.evaluate(()=>window.__dd.step(1/60,2));
const end=await A.evaluate(()=>{ const d=window.__dd, M=window.__meta, sum=document.getElementById('tv-sum'); return {phase:d.S.phase,tally:window.__tavern.isOpen(),sumShown:!!sum&&!sum.classList.contains('hide'),title:sum?(sum.querySelector('h1')||{}).textContent:'',next:!!document.getElementById('tv-nextmap'),gold:M.gold(),payout:M.summary().payout,play:document.body.classList.contains('play'),hideout:window.__hideout.isOpen()}; });
check("G on the lap moves on -- with the map-one locker piece waiting (the gate guards a wave, never MOVE ON): phase won, the HALL HELD tally with ▶ NEXT MAP",pre.pending&&end.phase==='won'&&end.tally&&end.sumShown&&end.title==='HALL HELD'&&end.next&&!end.play,JSON.stringify({pre,end}));
check("...and the gold is not paid twice (the 325 went out at HALL HELD)",end.gold===pre.gold&&end.payout===325,JSON.stringify({before:pre.gold,after:end.gold,payout:end.payout}));
const stop=await A.evaluate(()=>{ const d=window.__dd; const a={x:d.hero.x,z:d.hero.z}; d.setKeys({w:1}); d.step(1/60,30); d.setKeys({w:0}); const again=(d.startWave(),d.S.phase); return {moved:Math.hypot(d.hero.x-a.x,d.hero.z-a.z),again,gold:window.__meta.gold()}; });
check("the run is over: the hall stops, and another G/MOVE ON does nothing (no second tally, no gold)",stop.moved<.01&&stop.again==='won'&&stop.gold===end.gold,JSON.stringify(stop));
const tt=await A.evaluate(()=>{ const b=document.getElementById('tv-totavern'); if(b) b.click(); const s=window.__tavern.state(); return {sum:s.sum,open:s.open,shown:s.goldShown,to:s.goldTo,gold:window.__meta.gold()}; });
check("TO THE TAVERN doesn't count the 325 up again: it has been on the HUD all lap (and some of it spent)",tt.open&&!tt.sum&&tt.shown===tt.gold&&tt.to===tt.gold,JSON.stringify(tt));
await Actx.close();

// ==================== CO-OP ====================
if(!PeerServer){ console.log("SKIP the co-op half of victorylap-test.mjs — the `peer` package isn't installed (npm i peer)."); }
else {
  const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
  await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
  const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
  const tick=async(pages,batches=6,size=5)=>{ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++) for(const p of pages) await p.evaluate(()=>window.__dd.step(1/60,1)); await sleep(20); } };
  const tickUntil=async(pages,page,fn,arg,max=60)=>{ for(let b=0;b<max;b++){ if(await page.evaluate(fn,arg)) return true; await tick(pages,1,3); } return !!(await page.evaluate(fn,arg)); };
  const {p:H}=await open(), {p:G}=await open();
  const rc="vlap-"+Math.random().toString(36).slice(2,8);
  const ho=await H.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const gj=await G.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  check("host and guest connect ("+rc+")",ho.err===null&&gj.err===null,JSON.stringify({ho,gj}));
  const guestId=gj.id;
  for(const p of [H,G]) await p.evaluate(()=>window.__dd.setHero(500,500,0));   // both far off while the wave runs: what it leaves stays on the floor for the lap
  await tick([H,G],6,5);
  const g0=await G.evaluate(()=>window.__meta.gold());
  const hw=await H.evaluate(()=>{ const d=window.__dd; d.S.wave=d.map().waves-1; d.S.phase='build'; d.startWave(); let g=0; while(d.S.phase==='wave'&&g++<900){ d.step(1/60,5); for(const e of d.enemies) if(!e.dead) d.kill(e); } return {phase:d.S.phase,held:d.S.held,eff:d.effWave(),broker:window.__net.onBroker()}; });
  const want=25*hw.eff+150;
  check("host: the last wave held opens the lap (phase build, held) and it stays on the matchmaking server (the run isn't over)",hw.phase==='build'&&hw.held&&hw.broker,JSON.stringify(hw));
  const gotHeld=await tickUntil([H,G],G,x=>{ const w=window.__net.world(); return !!(w&&w.held)&&window.__meta.gold()>=x; },g0+want,80);
  await tick([H,G],4,3);
  const gl=await hud(G);
  check("guest: the host's HALL HELD reaches it -- the banner, the map counted as its own (ddMapsCleared 1), CLEARED on the HUD, its horn button ▶ MOVE ON -- and it stays in the hall",
    gotHeld&&/HALL HELD/.test(gl.banner)&&gl.cleared==='1'&&/CLEARED/.test(gl.wavet)&&/host moves the party on/.test(gl.phaset)&&gl.btn==='▶ MOVE ON'&&gl.phase==='build'&&!gl.dead&&!gl.tally,JSON.stringify(gl));
  check("guest: paid at HALL HELD: 25x7+150 = "+want+", on top of the held wave's own 45",gl.gold-g0===want+45,JSON.stringify({g0,gold:gl.gold,gain:gl.gold-g0}));
  const glt=await G.evaluate(()=>{ const d=window.__dd; const l=d.loot.slice().sort((a,b)=>Math.hypot(a.x,a.z-4.6)-Math.hypot(b.x,b.z-4.6))[0]; if(!l) return {none:true}; const b0=window.__meta.bag().length, n0=d.loot.length; d.setHero(l.x,l.z+.5,0); d.step(1/60,60); return {b0,b1:window.__meta.bag().length,n0,n1:d.loot.length}; });
  check("guest: picks up its own roll of the held wave's reward on the lap",!glt.none&&glt.b1>glt.b0&&glt.n1<glt.n0,JSON.stringify(glt));
  // the guest walks the lap: its own hero, and the host's copy of it
  await G.evaluate(()=>{ const d=window.__dd; d.setHero(0,8,0); d.setCam(0,.42,8); }); await tick([H,G],6,5);
  const c0=await H.evaluate(id=>window.__combat.guestHero(id),guestId);
  const w0=await G.evaluate(()=>{ const d=window.__dd; d.setKeys({w:1}); return {x:d.hero.x,z:d.hero.z}; });
  await tick([H,G],8,5);
  const w1=await G.evaluate(()=>{ const d=window.__dd; d.setKeys({w:0}); return {x:d.hero.x,z:d.hero.z}; }); await tick([H,G],4,5);
  const c1=await H.evaluate(id=>window.__combat.guestHero(id),guestId);
  check("guest: it walks the host's lap -- its hero moves, and the host's copy of it follows",Math.hypot(w1.x-w0.x,w1.z-w0.z)>2&&!!c0&&!!c1&&Math.hypot(c1.x-c0.x,c1.z-c0.z)>2,JSON.stringify({w0,w1,c0,c1}));
  // the guest's MOVE ON: G and the button
  await G.evaluate(()=>{ document.getElementById('toast').textContent=''; window.focus(); });
  await G.keyboard.press('KeyG'); const t1=await G.evaluate(()=>document.getElementById('toast').textContent);
  await G.evaluate(()=>{ document.getElementById('toast').textContent=''; document.getElementById('wavebtn').click(); }); const t2=await G.evaluate(()=>document.getElementById('toast').textContent);
  await tick([H,G],4,5);
  const gm={t1,t2,host:await H.evaluate(()=>({phase:window.__dd.S.phase,held:window.__dd.S.held,broker:window.__net.onBroker()})),guest:await hud(G)};
  check("guest: its MOVE ON (G, and the button) only says the host decides -- the host's hall stays on its lap, and so does the guest",
    /host moves the party on/.test(t1)&&/host moves the party on/.test(t2)&&gm.host.phase==='build'&&gm.host.held&&gm.host.broker&&gm.guest.phase==='build'&&!gm.guest.dead,JSON.stringify(gm));
  // a friend walking in on the lap: in the hall, but it held nothing
  const {p:L}=await open();
  const lj=await L.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const lateSees=await tickUntil([H,G,L],L,()=>{ const w=window.__net.world(); return !!(w&&w.held); },null,60);
  const l0=await L.evaluate(()=>window.__meta.gold());
  check("a friend who walks in on the lap sees it (HALL HELD, the host still on the server to let it in)",lj.err===null&&lateSees,JSON.stringify({lj,lateSees}));
  // the guest steps into the hideout, and the host moves on
  const gp=await G.evaluate(async()=>{ const d=window.__dd; d.step(1/60,60); const st=window.__portal.state(), pos=window.__portal.pos(); d.setHero(pos.x+1.3,pos.z,0); d.step(1/60,3); const near=window.__hideout.near(); d.upgrade(); const open=window.__hideout.isOpen(); await new Promise(r=>setTimeout(r,1000)); return {st,near,open,stayed:window.__hideout.isOpen(),gold:window.__meta.gold()}; });
  check("guest: the portal stands on the host's lap and E steps through it; the hideout stays open while the lap goes on",gp.st==='shown'&&gp.near&&gp.open&&gp.stayed,JSON.stringify(gp));
  const hm=await H.evaluate(()=>{ const M=window.__meta, g0=M.gold(); document.getElementById('wavebtn').click(); window.__dd.step(1/60,2); const sum=document.getElementById('tv-sum');
    return {phase:window.__dd.S.phase,tally:window.__tavern.isOpen(),title:sum?(sum.querySelector('h1')||{}).textContent:'',next:!!document.getElementById('tv-nextmap'),paid:M.gold()-g0,payout:M.summary().payout,broker:window.__net.onBroker(),peers:window.__net.peers().length}; });
  check("host: ▶ MOVE ON (the button) ends the run -- phase won, the HALL HELD tally with NEXT MAP, nothing paid twice -- and only now leaves the matchmaking server (its guests' links kept)",
    hm.phase==='won'&&hm.tally&&hm.title==='HALL HELD'&&hm.next&&hm.paid===0&&hm.payout===want&&hm.broker===false&&hm.peers===2,JSON.stringify(hm));
  const ended=await tickUntil([G,L],G,()=>!document.getElementById('dead').classList.contains('hide')&&!window.__hideout.isOpen(),null,60);
  await sleep(400);
  const ge=await G.evaluate(()=>{ const r=document.getElementById('rejoinbtn'); return {phase:window.__dd.S.phase,h1:document.getElementById('deadh1').textContent,p:document.getElementById('deadp').textContent,rejoin:!!r&&getComputedStyle(r).display!=='none',hideout:window.__hideout.isOpen(),gold:window.__meta.gold()}; });
  check("guest: the host's MOVE ON pulls it out of the hideout onto its end screen -- HALL HELD, with ⟲ REJOIN",ended&&ge.phase==='won'&&ge.h1==='HALL HELD'&&ge.rejoin&&!ge.hideout,JSON.stringify(ge));
  check("guest: paid exactly once -- the screen names the +"+want+" it got at HALL HELD, and its gold did not move again",new RegExp('\\+'+want+' ● gold for the run').test(ge.p)&&ge.gold===gp.gold,JSON.stringify({p:ge.p,atHideout:gp.gold,now:ge.gold}));
  const lateEnd=await tickUntil([L],L,()=>window.__dd.S.phase==='won',null,60);
  const le=await L.evaluate(()=>({h1:document.getElementById('deadh1').textContent,p:document.getElementById('deadp').textContent,gold:window.__meta.gold(),cleared:localStorage.getItem('ddMapsCleared')}));
  check("the friend who walked in on the lap gets HALL HELD too, but no payout for a map it never held",lateEnd&&le.h1==='HALL HELD'&&!/gold for the run/.test(le.p)&&le.gold===l0,JSON.stringify({le,l0}));
  // a host who closes its tab on the lap: the hall WAS held, and its guest was paid for it -- HALL HELD, not THE HOST LEFT
  const {ctx:H2ctx,p:H2}=await open(), {p:G2}=await open();
  const rc2="vlap2-"+Math.random().toString(36).slice(2,8);
  const b1=await H2.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:rc2,peerOpts});
  const b2=await G2.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:rc2,peerOpts});
  await tick([H2,G2],4,5);
  const q0=await G2.evaluate(()=>window.__meta.gold());
  await H2.evaluate(()=>{ const d=window.__dd; d.S.wave=d.map().waves-1; d.S.phase='build'; d.startWave(); let g=0; while(d.S.phase==='wave'&&g++<900){ d.step(1/60,5); for(const e of d.enemies) if(!e.dead) d.kill(e); } });
  const paid2=await tickUntil([H2,G2],G2,x=>window.__meta.gold()>=x,q0+want,80); const q1=await G2.evaluate(()=>window.__meta.gold());
  await H2.evaluate(()=>window.__pause.toTitle()).catch(()=>{});   // RETURN TO TITLE (a reload: its pagehide says 'bye'), without ever pressing MOVE ON
  const left=await tickUntil([G2],G2,()=>!document.getElementById('dead').classList.contains('hide'),null,150);
  await H2ctx.close();
  const hl=await G2.evaluate(()=>({phase:window.__dd.S.phase,h1:document.getElementById('deadh1').textContent,p:document.getElementById('deadp').textContent,gold:window.__meta.gold(),hostLeft:window.__hostLeft()}));
  check("a host who leaves on the lap: its guest gets HALL HELD (its pay already in, named, not paid again) and word that the host left -- not THE HOST LEFT",
    b1.err===null&&b2.err===null&&paid2&&left&&hl.phase==='won'&&hl.h1==='HALL HELD'&&new RegExp('\\+'+want+' ● gold for the run').test(hl.p)&&/host has left/.test(hl.p)&&hl.gold===q1&&hl.hostLeft,JSON.stringify({b1:b1.err,b2:b2.err,paid2,left,hl,q1}));
  sig.close?.();
}

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
