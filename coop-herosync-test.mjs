// ===== CO-OP (build 159, 4/7): where a guest really is. (1) The spawn spot the host handed a joining guest was dropped (the 'hp'
// handler only read a position coming back from the dead) and the first guest's spot was the host's own, so everyone started inside
// everyone else; a guest whose own countdown won the race back from a fall came up on the host's start too. Guests now stand beside
// the host (99-network.js GUEST_SPAWN_X, the 'hp' message's snap), and get back up there. (2) A guest joining in health gear got a
// fake hit (red flash, hurt sound, the bar down by its gear bonus): the host's copy now starts at the geared max. (3) A Tear of the
// Rootgate jump to a gate left the host's copy -- what mobs aim at -- where the guest had stood. (4) A fast guest outran the host's
// copy (a flat 16 a second cap), and a shot left from the lagging copy; a shot now says where its shooter stands. (5) A click right
// after switching to the archer, before the bow appeared, went out as a sword swing 24 long plus the last full draw's charge.
// (6) A Troll teammate's bow stood upright on everyone else's screen, not carried like a briefcase (builds 155-156). (7) Every
// puppet fell behind a moving player at a flat 6 a second.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-herosync-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9635;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(8735);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function open(){ const ctx=await browser.newContext(); const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:8735/?silent&nogate",{timeout:90000});
  await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat&&window.__party&&window.__aim&&window.__bow&&window.__mythic,null,{timeout:60000});
  await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); return p; }
const H=await open(), A=await open(), B=await open(); const ALL=[H,A,B];
async function tick(pages,batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++) for(const p of pages) await p.evaluate(()=>window.__dd.step(1/60,1)); await sleep(20); } }
async function tickUntil(pages,page,fn,arg,maxBatches=60,size=3){ for(let b=0;b<maxBatches;b++){ const v=await page.evaluate(fn,arg); if(v) return v; await tick(pages,1,size); } return await page.evaluate(fn,arg); }
const local=p=>p.evaluate(()=>{ const h=window.__dd.hero; return {x:+h.x.toFixed(2),z:+h.z.toFixed(2),hp:+h.hp.toFixed(1),max:h.max,dead:+h.dead.toFixed(2),hurtT:+h.hurtT.toFixed(2)}; });
const copyOf=id=>H.evaluate(id=>window.__combat.guestHero(id),id);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const calm=()=>H.evaluate(()=>{ const E=window.__dd.enemies; for(let i=E.length-1;i>=0;i--) E.splice(i,1); });   // no mobs but the ones a section places (the wave-zero goblin included)
const goblin=(tag,x,z,o)=>H.evaluate(({tag,x,z,o})=>{ const e=window.__dd.spawn('goblin','N'); Object.assign(e,{x,z,y:0,hp:9999,max:9999,dmg:0,atk:999,spd:0,__coopId:tag},o||{}); return e.hp; },{tag,x,z,o});
const hpOf=tag=>H.evaluate(tag=>{ const e=window.__dd.enemies.find(e=>e.__coopId===tag&&!e.dead); return e?+e.hp.toFixed(1):null; },tag);
await H.evaluate(()=>{ if(window.__trainer&&window.__trainer.skip) window.__trainer.skip(); });
await calm();
await sleep(4300);   // 65-tavernroom.js's one-shot new-player toast (real wall-clock) burns off first

// B puts on +50 hp armour BEFORE joining, and is at its full 150
const bPre=await B.evaluate(()=>{ window.__dd.gear().armor={id:'hs',name:'Probe Mail',slot:'armor',rarity:1,lvl:1,stats:{hp:50}}; window.__dd.applyGear(); window.__dd.hero.hp=window.__dd.hero.max; window.__dd.step(1/60,5); return {hp:window.__dd.hero.hp,max:window.__dd.hero.max}; });
const rc="herosync-"+Math.random().toString(36).slice(2,8);
const hostOpen=await H.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
const joinUp=p=>p.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
const aJoin=await joinUp(A); await tick([A],2,5); await tick([H],2,5);   // A registers first (the first spot), then B
const bJoin=await joinUp(B);
check("host and both guests connect",!hostOpen.err&&!aJoin.err&&!bJoin.err&&bPre.max===150&&bPre.hp===150,JSON.stringify({hostOpen,aJoin,bJoin,bPre}));
const aId=aJoin.id, bId=bJoin.id, hId=hostOpen.id;
const reg=await tickUntil(ALL,H,({aId,bId})=>{ const a=window.__combat.guestHero(aId), b=window.__combat.guestHero(bId); return a&&b?{a,b}:null; },{aId,bId});
await tick(ALL,2,5);

// ---- (1) the spawn spread, applied on the guests' own screens ----
const hostHero=await local(H);
check("the host registers each guest on its own spot BESIDE the host's start, not on it: distinct, 1.5 or more from the host, on the start's row",
  !!reg&&reg.a.x!==reg.b.x&&reg.a.z===6&&reg.b.z===6&&dist(reg.a,hostHero)>=1.4&&dist(reg.b,hostHero)>=1.4&&hostHero.x===0&&hostHero.z===6,JSON.stringify({reg,hostHero}));
const [aL,bL]=[await local(A),await local(B)];
check("each guest's OWN hero stands on the spot the host gave it (the snap the 'hp' handler used to drop)",
  !!reg&&aL.x===reg.a.x&&aL.z===reg.a.z&&bL.x===reg.b.x&&bL.z===reg.b.z,JSON.stringify({aL,bL,reg}));
await tick(ALL,18,5);   // 1.5 s: well past the copy's .8 s hold
const [aC,bC]=[await copyOf(aId),await copyOf(bId)];
check("after the hold the host's copies are still on those spots (they used to walk over onto the host, where the guests really stood)",
  dist(aC,reg.a)<.05&&dist(bC,reg.b)<.05,JSON.stringify({aC,bC}));

// ---- (2) no phantom hit for a guest who joins in health gear ----
const bAfter=await local(B);
check("B (joined wearing +50 hp) is still at its full 150 on its own screen, never flashed hurt (hurtT never set to 3)",
  bAfter.hp===150&&bAfter.max===150&&bAfter.hurtT<0,JSON.stringify(bAfter));
check("...and the host's copy of B was created at 150/150, not a flat 100",bC.hp===150&&bC.max===150,JSON.stringify(bC));

// ---- (1b) the respawn race: A's own countdown runs out before the host's word arrives ----
await H.evaluate(()=>window.__dd.setHero(-10,-6,0));   // the host out of the way: a mob with no guest left to hit would go for it
await goblin('killerA',reg.a.x,reg.a.z+.3,{dmg:500,atk:0,hp:100,max:100});
const aDeadHost=await tickUntil([H],H,id=>{ const g=window.__combat.guestHero(id); return g&&g.dead>0?g:null; },aId,40,5);
await calm();
const aDeadLocal=await tickUntil([A],A,()=>window.__dd.hero.dead>0?{dead:window.__dd.hero.dead}:null,null,20,5);
await tick([A],50,6);   // 5 s of A's own time, the host frozen: A's local countdown wins
const aUpLocal=await local(A), aStillDown=await copyOf(aId);
check("A's own countdown got it up first -- and it stands on ITS spot, not the host's start (0,6)",
  !!aDeadHost&&!!aDeadLocal&&aUpLocal.dead===0&&aUpLocal.x===reg.a.x&&aUpLocal.z===reg.a.z&&aStillDown.dead>0,JSON.stringify({aUpLocal,aStillDown}));
const aUpHost=await tickUntil(ALL,H,id=>{ const g=window.__combat.guestHero(id); return g&&g.dead===0?g:null; },aId,60,5);
await tick(ALL,6,5);
const aUpLocal2=await local(A), aCopy2=await copyOf(aId);
check("the host's copy gets up on the same spot, and the host's word (snap) leaves A there -- no hit, full health",
  !!aUpHost&&dist(aCopy2,reg.a)<.05&&aUpLocal2.x===reg.a.x&&aUpLocal2.z===reg.a.z&&aUpLocal2.hp===aUpLocal2.max,JSON.stringify({aUpHost,aCopy2,aUpLocal2}));

// ---- (3) the Tear of the Rootgate: the copy (and every puppet) follows the guest to the gate ----
await A.evaluate(()=>{ window.__dd.gear().amulet={id:'hs-tear',name:'Tear of the Rootgate',named:'tear_of_the_rootgate',slot:'amulet',rarity:5,lvl:10,stats:{mana:70,move:15,tow:25}}; window.__dd.setCam(Math.PI,.42,8); });   // facing the North gate, 36 away
const torn=await A.evaluate(()=>window.__mythic.tear()); const aAtGate=await local(A);
check("A steps through the Rootgate to a gate 30+ away (its own screen)",torn===true&&dist(aAtGate,reg.a)>=30,JSON.stringify({torn,aAtGate}));
await tick(ALL,12,5);   // 1 s
const aCopyGate=await copyOf(aId), aPupH=await H.evaluate(id=>window.__party.get(id),aId), aPupB=await B.evaluate(id=>window.__party.get(id),aId);
check("the host's copy of A is at the gate too (it used to stay where A had stood: mobs at the gate ignored A, mobs at the old spot kept hitting)",
  dist(aCopyGate,aAtGate)<1,JSON.stringify({aCopyGate,aAtGate}));
check("...and A's puppet is there on the host's screen and on B's (shown where it landed, not walked across the hall)",
  !!aPupH&&!!aPupB&&dist(aPupH,aAtGate)<1.5&&dist(aPupB,aAtGate)<1.5,JSON.stringify({aPupH:aPupH&&{x:aPupH.x,z:aPupH.z},aPupB:aPupB&&{x:aPupB.x,z:aPupB.z}}));
// back to its spot the same way (setHero is another far jump) for the next sections
await A.evaluate(at=>{ window.__dd.gear().amulet=null; window.__dd.setHero(at.x,at.z,0); window.__dd.setCam(0,.42,8); },reg.a);
await tick(ALL,12,5);
check("a far jump back (setHero) is followed as well",dist(await copyOf(aId),reg.a)<1,JSON.stringify(await copyOf(aId)));

// ---- (4) a fast guest: +100 move, sprinting -- the copy keeps up ----
await A.evaluate(()=>{ window.__dd.gear().charm={id:'hs-fleet',name:'Probe Charm',slot:'charm',rarity:1,lvl:1,stats:{move:100}}; });
// the longest open straight sprint for A's own hero (A alone ticks here; the host's copy stays put meanwhile)
const run=await A.evaluate(()=>{ const D=window.__dd; const starts=[[0,-6],[-10,-6],[10,-6],[0,12],[-12,0],[12,0],[0,6],[-8,8],[8,8]]; let best=null;
  for(const [sx,sz] of starts) for(let a=0;a<8;a++){ const yaw=a*Math.PI/4; D.setHero(sx,sz); D.setCam(yaw,.42,8); D.setKeys({w:1,shift:1}); D.step(1/60,70); const d=Math.hypot(D.hero.x-sx,D.hero.z-sz); D.setKeys({w:0,shift:0}); D.step(1/60,3); if(!best||d>best.d) best={sx,sz,yaw,d:+d.toFixed(2)}; }
  D.setHero(best.sx,best.sz); D.setCam(best.yaw,.42,8); return best; });
await tick(ALL,20,5);   // the copy follows A to the start (a far jump, or a walk)
const startGap=dist(await copyOf(aId),await local(A));
await A.evaluate(()=>window.__dd.setKeys({w:1,shift:1}));
const gaps=[];
for(let k=0;k<12;k++){ await tick(ALL,1,5); gaps.push(+dist(await copyOf(aId),await local(A)).toFixed(2)); }
await A.evaluate(()=>window.__dd.setKeys({w:0,shift:0}));
check("a guest sprinting at +100 move (about 22 a second) never gets 3 ahead of the host's copy (the flat 16 cap left it 6.9 behind after a second)",
  run.d>18&&startGap<1&&Math.max(...gaps.slice(4))<3,JSON.stringify({run,startGap,gaps}));
await A.evaluate(at=>{ window.__dd.gear().charm=null; window.__dd.setHero(at.x,at.z,0); window.__dd.setCam(0,.42,8); },reg.a);
await tick(ALL,14,5);

// ---- (4b) a shot says where its shooter stands ----
await A.evaluate(()=>window.__heroes.select('witch'));
const staff=await tickUntil(ALL,A,()=>window.__aim.kind()==='staff',null,120,2);
await H.evaluate(()=>{ const f=window.__staff.fireBolt; window.__staff.fireBolt=function(k,from,dir,spd,o){ window.__boltFrom={x:+from.x.toFixed(2),z:+from.z.toFixed(2)}; return f.apply(this,arguments); }; window.__boltFrom=null; });
const copyBefore=await copyOf(aId);
const AISLE={x:0,z:6};   // the hall's open aisle: the line x=0 is clear well past z=20 (x=1.5 meets a wall and a prop at z=13-16)
const standAt={x:AISLE.x,z:AISLE.z+3.5};
await A.evaluate(at=>{ window.__dd.setHero(at.x,at.z,0); window.__dd.setCam(0,.42,8); window.__dd.swing(); },standAt);
await tickUntil([A],H,()=>window.__boltFrom,null,40,2);   // only A ticks: the host's copy can't walk there, only the shot can put it there
const boltFrom=await H.evaluate(()=>window.__boltFrom), copyAfter=await copyOf(aId);
check("a witch's bolt leaves from where she really stands, over 3 from where the host's copy was (it used to leave from the copy)",
  !!staff&&!!boltFrom&&dist(boltFrom,standAt)<.05&&dist(copyBefore,standAt)>3,JSON.stringify({staff,boltFrom,standAt,copyBefore}));
check("...and the copy is put there too, as a swing always did",dist(copyAfter,standAt)<.05,JSON.stringify(copyAfter));
await A.evaluate(at=>{ window.__dd.setHero(at.x,at.z,0); },AISLE);
await tick(ALL,14,5);

// ---- (5) the hero-switch race: no sword swing with a bow's reach, no leftover full draw ----
await A.evaluate(()=>window.__heroes.select('troll'));
const bow=await tickUntil(ALL,A,()=>window.__aim.kind()==='bow',null,120,2);
await A.evaluate(()=>window.__aim.press()); await tick(ALL,10,5); await A.evaluate(()=>window.__aim.release()); await tick(ALL,14,5);
const drawn=await A.evaluate(()=>window.__aim.lastCharge());
await A.evaluate(()=>window.__heroes.select('knight'));
const sword=await tickUntil(ALL,A,()=>window.__aim.kind()===null,null,120,2);
await calm(); await A.evaluate(at=>{ window.__dd.setHero(at.x,at.z,0); window.__dd.setCam(0,.42,8); },AISLE); await tick(ALL,4,5);
const P=await copyOf(aId);
await goblin('r5',P.x,P.z+5); await goblin('r8',P.x,P.z+8); await goblin('r12',P.x,P.z+12);
await A.evaluate(()=>{ window.__sent=[]; const js=window.__js0=JSON.stringify; JSON.stringify=function(o,...r){ if(o&&typeof o==='object'&&typeof o.type==='string'&&'data' in o&&(o.type==='swing'||o.type==='shot')) window.__sent.push({t:o.type,d:o.data}); return js.call(this,o,...r); }; });
const race=await A.evaluate(()=>{ window.__heroes.select('troll'); const k=window.__aim.kind(), reach=window.__dd.hero.reach; window.__dd.swing(); return {kindAtClick:k,reach,swingT:window.__dd.hero.swingT}; });
await tick(ALL,14,5);
const sent=await A.evaluate(()=>window.__sent), lastC=await A.evaluate(()=>window.__aim.lastCharge());
const hp5=await hpOf('r5'), hp8=await hpOf('r8'), hp12=await hpOf('r12');
const tapMax=await A.evaluate(()=>Math.round(window.__dd.heroDmg()*1*10)/10+.15);
check("a click between switching to the archer and the bow appearing sends no sword swing (it used to carry the bow's reach, 24)",
  !!bow&&drawn>=.99&&!!sword&&race.kindAtClick===null&&race.reach===24&&race.swingT===0&&!sent.some(m=>m.t==='swing'),JSON.stringify({drawn,race,sent}));
check("...and whatever it looses is a tap, not the last full draw's charge (no pierce)",lastC===0&&sent.filter(m=>m.t==='shot').every(m=>!m.d.pierce),JSON.stringify({lastC,sent}));
check("...so nothing past the first mob in line is hurt (the old cone hit all three, through walls)",
  hp8===9999&&hp12===9999&&hp5!==null&&9999-hp5<=tapMax,JSON.stringify({hp5,hp8,hp12,tapMax}));
await A.evaluate(()=>{ JSON.stringify=window.__js0; });
await calm();
// the host never trusts a sword longer than a sword: an older guest's swing, sent with the bow's reach
await goblin('c2',P.x,P.z+2); await goblin('c8',P.x,P.z+8);
await A.evaluate(at=>window.__net.send('swing',{yaw:0,x:at.x,z:at.z,dmg:10,reach:24}),P);
await sleep(300);
const c2=await hpOf('c2'), c8=await hpOf('c8');
check("the host clamps a swing's reach to a sword's: the mob 2 ahead is hit, the one 8 ahead is not",c2===9989&&c8===9999,JSON.stringify({c2,c8}));
await calm();

// ---- (6) a Troll teammate's bow on the host's screen: carried like a briefcase, as on its own ----
await tick(ALL,6,5);
const pupBow=await tickUntil(ALL,H,id=>{ const p=window.__party.get(id); return p&&p.ready&&p.weapon&&/^bow-/.test(p.weaponName||'')?p.weaponName:null; },aId,120,3);
const axes=(p,which)=>p.evaluate(which=>{ const T=window.THREE; let o=null; const mine=window.__weapons.mounted();
  if(which==='mine') o=mine; else window.__dd.scene.traverse(x=>{ if(!o&&x!==mine&&x.userData&&x.userData.sword&&/^bow-/.test(x.userData.sword.name)&&x.parent) o=x; });
  if(!o) return null; const q=o.getWorldQuaternion(new T.Quaternion()); const f=v=>v.applyQuaternion(q).toArray().map(n=>+n.toFixed(2)); return {stave:f(new T.Vector3(0,1,0)),belly:f(new T.Vector3(0,0,1))}; },which);
const mineAx=await axes(A,'mine'), pupAx=await axes(H,'puppet');
check("the guest's own bow at rest: stave level, belly up (the build 155/156 hold)",!!mineAx&&Math.abs(mineAx.stave[1])<.3&&mineAx.belly[1]>.8,JSON.stringify(mineAx));
check("...and its puppet on the host's screen holds it the same way (it stood upright, belly toward the host)",
  !!pupBow&&!!pupAx&&Math.abs(pupAx.stave[1])<.3&&pupAx.belly[1]>.8,JSON.stringify({pupBow,pupAx}));

// ---- (7) puppets keep up: the host sprints, B watches ----
await H.evaluate(()=>{ window.__dd.setHero(-10,-6,0); window.__dd.setCam(Math.PI/2,.42,8); });
await tick(ALL,8,5);
await H.evaluate(()=>window.__dd.setKeys({w:1,shift:1}));
const pg=[];
for(let k=0;k<6;k++){ await tick(ALL,2,5); const h=await local(H), p=await B.evaluate(id=>window.__party.get(id),hId); pg.push({h:h.x,p:p&&p.x,gap:p?+dist(h,p).toFixed(2):null}); }
await H.evaluate(()=>window.__dd.setKeys({w:0,shift:0}));
check("the host sprinting (11 a second) is never shown 2.5 behind on a guest's screen (a flat 6 a second left it nearly 5 behind)",
  pg[5].h-pg[0].h>8&&pg.slice(1).every(r=>r.gap!==null&&r.gap<2.5),JSON.stringify(pg));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
