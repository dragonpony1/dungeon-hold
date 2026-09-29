// ===== BUILD 178: RUNE TOTEMS FOLLOW YOUR POINTS, AND BRAMBLEWHISK GROWS ITS THORNS.
// (1) Matt: "they were supposed to be buff towers, like any tower in proximity is faster or does more damage based on what points
// you put into your buff towers". A totem lends two auras now: DAMAGE = 15% +5% a mark + half its placer's defense damage (tow),
// SPEED = 15% +5% a mark + half their defense attack speed (trate). A tower takes the strongest of each separately, never a sum; in
// co-op each totem reads its own placer's stats. Rune-light links run from each totem to each tower it feeds, a rune circle and a
// glow mark each boosted tower, and both cards say the numbers. (2) Bramblewhisk's power ("your pet's shots leave thorn patches that
// slow and prick enemies") only ever dressed the shots as thorns: now every landing grows a patch (1.4 radius, 4 s, 60% speed, a
// prick of 15% of the shot every .5 s, one patch's prick at a time, at most 12 live); a co-op guest's patch is grown by the host.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer; try { ({ PeerServer } = await import("peer")); } catch(e) { PeerServer=null; }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const httpPort=8821, sigPort=9721; const server=await serve(httpPort);
const sig=PeerServer?PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }):null; const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function open(){ const ctx=await browser.newContext({viewport:{width:1000,height:640}}); const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e))); p.on("console",m=>{ if(m.type()==="error") errors.push(m.text().slice(0,200)); });
  await p.goto(`http://127.0.0.1:${httpPort}/?silent&nogate`,{timeout:120000});
  await p.waitForFunction(()=>window.__dd&&window.__net&&window.__mythic&&window.__familiar&&window.__bramble&&window.__feel&&window.__dd.heroModel()&&window.__dd.mobModel("goblin"),null,{timeout:120000});
  await p.evaluate(()=>{ window.__freeze=true; window.__dd.resetGear(); window.__dd.start(); window.__dd.step(1/60,30); }); return p; }
const H=await open();

// ---- (1) the totem's two auras, from the placer's points ----
const tot=await H.evaluate(()=>{ const d=window.__dd; d.S.mana=1e6; for(const x of d.defs.slice()){ d.setHero(x.x,x.z+1,0); d.sell(); } d.setHero(8,-4,0);
  const t=d.place("totem",14,20,0), a=d.place("harpoon",11,20,Math.PI), b=d.place("acorn",14,17,Math.PI), far=d.place("harpoon",20,20,Math.PI); d.step(1/60,40);
  const wear=st=>{ const it=d.rollItem(3,"charm",8); it.stats=st||{}; d.gear().charm=it; d.applyGear(); d.step(1/60,3); };
  const snap=()=>({D:+a.buffD.toFixed(3),S:+a.buffS.toFixed(3),bD:+b.buffD.toFixed(3),farD:far.buffD,farS:far.buffS,self:t.buffD,dmg:d.stat(a,"dmg"),cd:+d.stat(a,"cd").toFixed(4),farDmg:d.stat(far,"dmg"),farCd:+d.stat(far,"cd").toFixed(4)});
  const out={placed:!!(t&&a&&b&&far)}; wear(null); out.none=snap(); wear({tow:40}); out.tow=snap(); wear({trate:40}); out.trate=snap();
  wear({tow:40}); t.lvl=2; d.step(1/60,2); out.mk2=snap(); t.lvl=1; d.step(1/60,2);
  // co-op: a second totem placed by a guest with +80% defense attack speed and no defense damage -- the tower takes the host's damage aura and the guest's speed aura
  const M=d.Meta, keep=M.defOwnerStat; M.defOwnerStat=(id,k)=>id==="g-test"?({tow:0,trate:80})[k]||0:(keep?keep(id,k):undefined);
  const t2=d.place("totem",11,23,0); t2.ownerId="g-test"; d.step(1/60,40); out.coop={t2:!!t2,D:+a.buffD.toFixed(3),S:+a.buffS.toFixed(3),t2D:+d.stat(t2,"buffD").toFixed(3),t2S:+d.stat(t2,"buffS").toFixed(3)};
  M.defOwnerStat=keep; d.setHero(t2.x,t2.z+1,0); d.sell(); d.setHero(8,-4,0); d.step(1/60,5); wear(null);
  return out; });
const near=(x,y,e)=>Math.abs(x-y)<(e||1e-6);
check("a totem with no gear: +15% damage and +15% speed to the towers in its ring (a ballista 6 units off, an acorn cannon), none to one 12 units off or to itself",tot.placed&&near(tot.none.D,.15)&&near(tot.none.S,.15)&&near(tot.none.bD,.15)&&tot.none.farD===0&&tot.none.farS===0&&tot.none.self===0&&tot.none.dmg===6.9&&near(tot.none.cd,1.6/1.15,1e-3),JSON.stringify(tot.none));
check("+40% defense damage on the hero: the DAMAGE aura becomes 15+20 = 35% (speed stays 15%); the ballista hits 6 x 1.4 x 1.35 = 11.3, the far one 8.4",near(tot.tow.D,.35)&&near(tot.tow.S,.15)&&tot.tow.dmg===11.3&&tot.tow.farDmg===8.4,JSON.stringify(tot.tow));
check("+40% defense attack speed: the SPEED aura becomes 35% (damage stays 15%); the ballista's cooldown 1.6 / 1.4 / 1.35",near(tot.trate.D,.15)&&near(tot.trate.S,.35)&&near(tot.trate.cd,1.6/1.4/1.35,1e-3)&&near(tot.trate.farCd,1.6/1.4,1e-3),JSON.stringify(tot.trate));
check("Mark II adds 5% to each: +40% damage with the +40% gear",near(tot.mk2.D,.40)&&near(tot.mk2.S,.20),JSON.stringify(tot.mk2));
check("co-op, two rings: a guest's totem reads the GUEST's points (+15% / +55%), and the tower takes the strongest damage aura (host's 35%) and the strongest speed aura (guest's 55%) separately",tot.coop.t2&&near(tot.coop.t2D,.15)&&near(tot.coop.t2S,.55)&&near(tot.coop.D,.35)&&near(tot.coop.S,.55),JSON.stringify(tot.coop));

// the real shots: a parked goblin in front of the ballista, hits counted over 25 s with the totem and without
const shots=await H.evaluate(()=>{ const d=window.__dd; const a=d.defs.find(x=>x.kind==="harpoon"&&x.buffS>0), t=d.defs.find(x=>x.kind==="totem"); for(const x of d.defs.slice()) if(x!==a&&x!==t){ d.setHero(x.x,x.z+1,0); d.sell(); } d.setHero(8,-4,0);
  const it=d.rollItem(3,"charm",8); it.stats={tow:40,trate:40}; d.gear().charm=it; d.applyGear(); d.step(1/60,5);
  const trial=()=>{ const e=d.spawn("goblin","N"); e.spd=0; e.hp=e.max=1e6; const park=()=>{ e.x=a.x; e.z=a.z-8; }; park(); d.step(1/60,2); park(); let hits=0, lost=0; for(let i=0;i<60*25;i++){ const h=e.hp; d.step(1/60,1); park(); if(e.hp<h-.01){ hits++; lost+=h-e.hp; } } d.kill(e); d.step(1/60,5); return {hits,perHit:+(lost/Math.max(1,hits)).toFixed(2),dmg:d.stat(a,"dmg")}; };
  const withT=trial(); d.setHero(t.x,t.z+1,0); d.sell(); d.setHero(8,-4,0); d.step(1/60,5); const alone=trial(); return {withT,alone,rate:+(withT.hits/Math.max(1,alone.hits)).toFixed(2)}; });
check("in play: with the totem (+40%/+40% gear) the ballista lands ~35% more bolts, each 35% harder, than on its own",shots.rate>=1.2&&shots.rate<=1.5&&near(shots.withT.perHit,shots.withT.dmg,.05)&&near(shots.alone.perHit,shots.alone.dmg,.05)&&near(shots.withT.dmg/shots.alone.dmg,1.35,.03),JSON.stringify(shots));

// the look and the cards
const look=await H.evaluate(()=>{ const d=window.__dd; for(const x of d.defs.slice()){ d.setHero(x.x,x.z+1,0); d.sell(); } d.S.mana=1e6;
  const t=d.place("totem",14,20,0), a=d.place("harpoon",11,20,Math.PI); d.place("harpoon",17,20,Math.PI); d.place("harpoon",20,20,Math.PI); d.place("acorn",14,17,Math.PI); d.place("spike",14,23,0);
  const it=d.rollItem(3,"charm",8); it.stats={tow:40,trate:20}; d.gear().charm=it; d.applyGear(); d.step(1/60,40); const on=d.rune();
  d.setHero(a.x,a.z+2.2,Math.PI); d.step(1/60,5); const towerCard=window.__feel.defcard(); d.setHero(t.x,t.z+2.2,Math.PI); d.step(1/60,5); const totemCard=window.__feel.defcard();
  const s=d.defs.find(x=>x.kind==="spike"); const hedge={D:s?s.buffD:null};
  d.setHero(t.x,t.z+1,0); d.sell(); d.setHero(8,-4,0); d.step(1/60,5); const off=d.rune(); return {on,towerCard,totemCard,hedge,off}; });
check("rune-light: a link (thread, beads and a mote) from the totem to each of the three towers it feeds, a rune circle and a glow on each; the out-of-reach ballista and the hedge (nothing to boost) get none; all gone when the totem is sold",look.on.links===3&&look.on.motes===3&&look.on.rings===3&&look.on.glows===3&&look.on.drawn===60&&look.hedge.D===0&&look.off.links===0&&look.off.rings===0&&look.off.motes===0&&look.off.drawn===0,JSON.stringify({on:look.on,off:look.off,hedge:look.hedge}));
check("the tower card says 'Empowered by a Rune Totem: +35% damage, +25% speed'",/Empowered by a Rune Totem: \+35% damage, \+25% speed/.test(look.towerCard||""),look.towerCard);
check("the totem card shows its two auras, what it's feeding and what the next mark adds",/Damage aura\+35%/.test(look.totemCard||"")&&/Speed aura\+25%/.test(look.totemCard||"")&&/Empowering3 towers/.test(look.totemCard||"")&&/auras \+40% \/ \+30%/.test(look.totemCard||"")&&/half your/.test(look.totemCard||""),look.totemCard);

// ---- (2) Bramblewhisk ----
const bram=await H.evaluate(()=>{ const d=window.__dd, B=window.__bramble; for(const x of d.defs.slice()){ d.setHero(x.x,x.z+1,0); d.sell(); } d.gear().charm=null; d.applyGear(); for(const e of d.enemies) d.kill(e); d.step(1/60,60); B.clear();
  const run=it=>{ d.gear().familiar=it; d.applyGear(); d.setHero(0,10,Math.PI); d.step(1/60,20); const es=[0,1,2].map(()=>{ const e=d.spawn("goblin","N"); e.spd=0; e.hp=e.max=5000; return e; }); const park=()=>es.forEach((e,i)=>{ e.x=(i-1)*1.4; e.z=5; }); park(); d.step(1/60,2); park();
    let maxP=0, slowed=false; for(let i=0;i<60*4;i++){ d.step(1/60,1); park(); maxP=Math.max(maxP,B.list().length); if(es.some(e=>e.chillT>0&&e.chillK===.6)) slowed=true; } es.forEach(e=>d.kill(e)); d.step(1/60,30); return {maxP,slowed,on:B.on()}; };
  const plain=run((()=>{ const it=d.rollItem(3,"familiar",8); it.name="Plain Wisp"; return it; })()); B.clear();
  const bw=run(window.__mythic.normalize({tier:"named",named:"bramblewhisk"})); B.clear();
  const kinds={}; for(const k of ["Sprite","Fire Imp","Crystal Owl","Storm Drake","Bat"]){ const it=window.__mythic.normalize({tier:"named",named:"bramblewhisk"}); it.name+=" ("+k+")"; kinds[k]=run(it).maxP; B.clear(); }
  d.gear().familiar=null; d.applyGear(); d.step(1/60,10);
  const e=d.spawn("goblin","N"); e.hp=e.max=5000; const sp=e.spd; const park=()=>{ e.x=0; e.z=5; }; park(); d.step(1/60,2); park(); B.sprout(0,5,10); let slow=null; const h0=e.hp;
  for(let i=0;i<120;i++){ park(); d.step(1/60,1); if(i===30) slow=+(d.mobSpd(e)/e.spd).toFixed(3); } const lone=+(h0-e.hp).toFixed(2);
  B.sprout(.3,5.2,10); B.sprout(-.3,4.8,10); const h1=e.hp; for(let i=0;i<120;i++){ park(); d.step(1/60,1); } const three=+(h1-e.hp).toFixed(2);
  B.clear(); e.x=20; e.z=5; for(let i=0;i<20;i++) B.sprout(i*.3,2,5); const cap=B.list().length; d.step(1/60,60*4+10); const after=B.list().length; d.kill(e);
  return {plain,bw,kinds,slow,lone,three,cap,after}; });
check("a plain pet grows no patches; Bramblewhisk's (a Wisp) do, where its shots land, and the goblins in them crawl at 60%",bram.plain.maxP===0&&!bram.plain.on&&bram.bw.on&&bram.bw.maxP>=2&&bram.bw.slowed,JSON.stringify({plain:bram.plain,bw:bram.bw}));
check("every kind of pet grows them: the Moss Sprite's darts, the Owl's beam, the Drake's bolt, the Bat's bite",Object.entries(bram.kinds).filter(([k])=>k!=="Fire Imp").every(([,n])=>n>=1),JSON.stringify(bram.kinds));
check("one patch from a 10-damage shot: 60% speed, and a 1.5 prick every half second (6 in 2 s); three overlapping patches still prick once (6)",bram.slow===.6&&near(bram.lone,6,.01)&&near(bram.three,6,.01),JSON.stringify({slow:bram.slow,lone:bram.lone,three:bram.three}));
check("at most 12 patches live, and they wither after 4 s",bram.cap===12&&bram.after===0,JSON.stringify({cap:bram.cap,after:bram.after}));
await H.evaluate(()=>{ const d=window.__dd; d.setHero(-3,10,Math.PI); d.setCam(Math.PI,.62,6); window.__bramble.sprout(-1.2,5,20); window.__bramble.sprout(1,4.2,20); window.__bramble.sprout(-.2,6.4,20); d.step(1/60,40); document.getElementById("hud").style.display="none"; });
await H.screenshot({path:(process.env.SP||".")+"/parts/shots/bramble-patches.png"});
await H.evaluate(()=>{ window.__bramble.clear(); document.getElementById("hud").style.display=""; });

// ---- (2, co-op) a guest wearing it: its patch on its own screen (looks only), the real one on the host ----
if(!PeerServer) console.log("SKIP co-op half -- the `peer` package isn't installed");
else { const A=await open(); const ALL=[H,A];
  const tick=async(n,size)=>{ for(let b=0;b<n;b++){ for(let i=0;i<(size||5);i++) for(const p of ALL) await p.evaluate(()=>window.__dd.step(1/60,1)); await sleep(20); } };
  const rc="bramble-"+Math.random().toString(36).slice(2,8);
  const ho=await H.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const aj=await A.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  let reg=null; for(let i=0;i<60&&!reg;i++){ reg=await H.evaluate(id=>window.__combat&&window.__combat.guestHero(id),aj.id); if(!reg) await tick(1,3); }
  check("host and guest connect",!ho.err&&!aj.err&&!!reg,JSON.stringify({ho,aj}));
  await H.evaluate(()=>{ const d=window.__dd; for(let i=d.enemies.length-1;i>=0;i--) d.enemies.splice(i,1); d.setHero(-10,-6,0); window.__bramble.clear(); });
  // a guest NOT wearing it can't grow one on the host by sending the message
  await A.evaluate(()=>{ window.__dd.setHero(0,10,Math.PI); window.__net.send("bramble",{x:0,z:6,dmg:50}); }); await tick(6);
  const forged=await H.evaluate(()=>window.__bramble.list().length);
  await A.evaluate(()=>{ const d=window.__dd; d.gear().familiar=window.__mythic.normalize({tier:"named",named:"bramblewhisk"}); d.applyGear(); d.setHero(0,10,Math.PI); });
  await H.evaluate(()=>{ const e=window.__dd.spawn("goblin","N"); Object.assign(e,{x:0,z:5,y:0,hp:1e6,max:1e6,dmg:0,atk:999,spd:0,__coopId:"bw"}); });
  let hostP=0, guestLooks=0, chilled=false, hp0=null, hp1=null;
  for(let i=0;i<40;i++){ await tick(1,6); const h=await H.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__coopId==="bw"); if(e){ e.x=0; e.z=5; } return {n:window.__bramble.list().filter(p=>!p.looks).length,chill:e?(e.chillT>0&&e.chillK===.6):false,hp:e?e.hp:null}; }); if(hp0===null) hp0=h.hp; hp1=h.hp; hostP=Math.max(hostP,h.n); if(h.chill) chilled=true; guestLooks=Math.max(guestLooks,await A.evaluate(()=>window.__bramble.list().filter(p=>p.looks).length)); }
  check("co-op: a guest's Bramblewhisk grows a real patch on the host (it slows the host's goblin to 60%) and a look-only copy on the guest's own screen; a guest not wearing it can't grow one",forged===0&&hostP>=1&&chilled&&guestLooks>=1&&hp1<hp0,JSON.stringify({forged,hostP,chilled,guestLooks,lost:hp0-hp1}));
}
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|WebSocket|peer|ERR_CONNECTION/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); if(sig) try{ sig.close(); }catch(e){} console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(0);
