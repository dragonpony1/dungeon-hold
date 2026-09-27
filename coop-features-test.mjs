// ===== CO-OP (build 159, 5/7): the newer features, for a guest too. Most of what came after co-op ran only on the page that wore it,
// and a guest's page has no real mobs -- only the host's, shown as puppets. (F3) A guest who finished the Forest set lost its pet's
// attacks for good (93-gearsets.js's range boon looked in the guest's empty `enemies`). (F7) A guest's Fire Imp never set the host's
// mob burning and its Moss Sprite never slowed it (famHit carried damage only). (F6) A guest's named mythics and full Void set did
// nothing to the hall: the Hourglass, the Warden's Oath, the Last Lantern, the Gloomcap Censer and Rootsplitter's roots never
// touched a mob, the Mantle never swallowed a hit, the Void rift never tore off a guest's sword, Mossheart healed the guest's bar
// but not the host's copy (the next hit took it all back), and the Tear of the Rootgate worked once a session, not once a wave.
// (F5) The hideout portal stayed open through the host's waves on a guest's screen, and the horn never called a guest back out.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-features-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9641, httpPort=8741;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(httpPort);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function open(){ const ctx=await browser.newContext(); const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto(`http://127.0.0.1:${httpPort}/?silent&nogate`,{timeout:90000});
  await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat&&window.__mythic&&window.__familiar&&window.__forest&&window.__hideout&&window.__portal,null,{timeout:60000});
  await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); if(window.__trainer&&window.__trainer.skip) window.__trainer.skip(); }); return p; }
const H=await open(), A=await open(); const ALL=[H,A];
async function tick(pages,batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++) for(const p of pages) await p.evaluate(()=>window.__dd.step(1/60,1)); await sleep(20); } }
async function tickUntil(pages,page,fn,arg,maxBatches=60,size=3){ for(let b=0;b<maxBatches;b++){ const v=await page.evaluate(fn,arg); if(v) return v; await tick(pages,1,size); } return await page.evaluate(fn,arg); }
const local=p=>p.evaluate(()=>{ const h=window.__dd.hero; return {x:+h.x.toFixed(2),z:+h.z.toFixed(2),hp:+h.hp.toFixed(1),max:h.max,dead:+h.dead.toFixed(2)}; });
const copyOf=id=>H.evaluate(id=>window.__combat.guestHero(id),id);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const calm=()=>H.evaluate(()=>{ const E=window.__dd.enemies; for(let i=E.length-1;i>=0;i--) E.splice(i,1); });   // no mobs but the ones a section places
const goblin=(tag,x,z,o)=>H.evaluate(({tag,x,z,o})=>{ const e=window.__dd.spawn('goblin','N'); Object.assign(e,{x,z,y:0,hp:9999,max:9999,dmg:0,atk:999,spd:0,__coopId:tag},o||{}); return e.hp; },{tag,x,z,o});
const mob=tag=>H.evaluate(tag=>{ const e=window.__dd.enemies.find(e=>e.__coopId===tag&&!e.dead); return e?{hp:+e.hp.toFixed(1),holdT:+(e.holdT||0).toFixed(2),lanternT:+(e.lanternT||0).toFixed(2),burnT:+(e.burnT||0).toFixed(2),slowT:+(e.slowT||0).toFixed(2)}:null; },tag);
const wear=(slot,named)=>A.evaluate(({slot,named})=>{ const g=window.__dd.gear(); g[slot]=named?window.__mythic.normalize({tier:'named',named}):null; window.__dd.applyGear(); return named?window.__mythic.has(named):true; },{slot,named});
const bare=()=>A.evaluate(()=>{ const d=window.__dd, g=d.gear(); for(const s of d.SLOTS) g[s]=null; d.applyGear(); });
const dress=(set,fam)=>A.evaluate(({set,fam})=>{ const d=window.__dd, g=d.gear(); for(const s of d.SLOTS) g[s]={id:'cf-'+set+'-'+s,name:(s==='familiar'?fam.name:'Probe '+s)+' of the '+set,slot:s,rarity:2,lvl:1,stats:s==='familiar'?fam.stats:{}}; d.applyGear(); return d.Meta.sets.active().map(a=>a.name+':'+a.tier); },{set,fam});
const toasts=()=>A.evaluate(()=>window.__toasts.slice());
await calm();
await sleep(4300);   // 65-tavernroom.js's one-shot new-player toast (real wall-clock) burns off first
await A.evaluate(()=>{ window.__toasts=[]; window.__allToasts=[]; const el=document.getElementById('toast'); new MutationObserver(()=>{ window.__toasts.push(el.textContent); window.__allToasts.push(el.textContent); }).observe(el,{childList:true,characterData:true,subtree:true}); });

const rc="features-"+Math.random().toString(36).slice(2,8);
const hostOpen=await H.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
const aJoin=await A.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
const aId=aJoin.id;
const reg=await tickUntil(ALL,H,id=>window.__combat.guestHero(id),aId);
check("host and guest connect",!hostOpen.err&&!aJoin.err&&!!reg,JSON.stringify({hostOpen,aJoin,reg}));
await H.evaluate(()=>window.__dd.setHero(-10,-6,0));   // the host out of the way
await A.evaluate(()=>{ window.__heroes.select('knight'); window.__dd.setHero(0,6,0); window.__dd.setCam(0,.42,8); });   // a sword, on the hall's open aisle (x=0), facing up it
await tickUntil(ALL,A,()=>window.__aim.kind()===null&&window.__weapons.mounted(),null,120,2);
await tick(ALL,14,5);   // the copy follows A onto the aisle
await calm();

// ---- (F7) a guest's pet: the Fire Imp's burn and the Moss Sprite's spores reach the host's mob ----
async function petRun(name){ await calm(); await goblin('pet',0,10,{hp:1e6,max:1e6,holdT:1e9});
  await A.evaluate(it=>{ window.__dd.gear().familiar=it; window.__dd.applyGear(); },{id:'cf-'+name.replace(/\W/g,''),name:'Plain '+name,slot:'familiar',rarity:2,lvl:5,stats:{fdmg:10,frate:0}});
  let burn=0, slow=0; const hp0=(await mob('pet')).hp;
  for(let i=0;i<30;i++){ await tick(ALL,1,6); const m=await mob('pet'); burn=Math.max(burn,m.burnT); slow=Math.max(slow,m.slowT); }
  await A.evaluate(()=>{ window.__dd.gear().familiar=null; window.__dd.applyGear(); });   // the pet goes, and every shot it had in the air with it
  await tick(ALL,1,3); const hpOff=(await mob('pet')).hp; await tick([H],10,9); const hpLater=(await mob('pet')).hp;   // 1.5 s of the host's time, no pet
  return {lost:+(hp0-hpOff).toFixed(1),burn,slow,afterPet:+(hpOff-hpLater).toFixed(1)}; }
const imp=await petRun('Fire Imp');
check("F7: a guest's Fire Imp sets the host's mob burning (its burn used to land on the guest's own copy of the mob and nowhere else)",imp.lost>0&&imp.burn>=2,JSON.stringify(imp));
check("...and the burn ticks on the host: the mob keeps losing health after the pet is gone",imp.afterPet>0,JSON.stringify(imp));
const spr=await petRun('Sprite');
check("F7: a guest's Moss Sprite's spores slow the host's mob (they never did)",spr.lost>0&&spr.slow>=1,JSON.stringify(spr));

// ---- (F3) the Forest set's TWIN SHOT: a guest who finishes the set keeps a pet that fights ----
await calm(); await goblin('fst',0,10,{hp:1e6,max:1e6,holdT:1e9});
const forest=await dress('Forest',{name:'Plain Wisp',stats:{fdmg:10,frate:0}});
await tick(ALL,6,6);
const boon=await A.evaluate(()=>!!window.__forest.boon());
const f0=(await mob('fst')).hp; await tick(ALL,20,6); const f1=(await mob('fst')).hp; const famSt=await A.evaluate(()=>window.__familiar.state());
check("F3: with all five Forest pieces on (TWIN SHOT), a guest's pet still finds and hits the host's mob (it went silent for good)",
  boon&&!!famSt&&famSt.target===true&&f0-f1>0,JSON.stringify({forest,boon,target:famSt&&famSt.target,lost:+(f0-f1).toFixed(1)}));
await bare();

// ---- (F6) the Void set's rift off a guest's sword ----
await calm();
const vd=await dress('Void',{name:'Plain Wisp',stats:{fdmg:1,frate:-100}});   // frate -100: the pet fires once and never again, so it can't muddy the numbers
await goblin('vA',0,7.5,{hp:1e5,max:1e5,holdT:1e9}); await goblin('vB',2.8,6.8,{hp:1e5,max:1e5,holdT:1e9});   // B: outside the sword's cone, within 3 of A
await tick(ALL,16,6);   // the pet spends its one shot
await A.evaluate(()=>{ window.__rings=0; const M=window.__dd.Meta, r=M.packs.ring; M.packs.ring=(...a)=>{ window.__rings++; return r(...a); }; });
const v0={A:(await mob('vA')).hp,B:(await mob('vB')).hp}; const vDmg=await A.evaluate(()=>Math.round(window.__dd.heroDmg()*10)/10);
await A.evaluate(()=>{ window.__dd.setHero(0,6,0); window.__dd.setCam(0,.42,8); window.__dd.hero.yaw=0; window.__dd.swing(); });
await tick(ALL,8,6); await sleep(300); await tick(ALL,2,6);
const v1={A:(await mob('vA')).hp,B:(await mob('vB')).hp}; const rings=await A.evaluate(()=>window.__rings);
check("F6: a guest wearing all five Void pieces tears a rift with its sword: the mob beside the one it hit takes 40% of the blow (it took nothing)",
  vd.includes('of the Void:5')&&v0.A-v1.A>0&&Math.abs((v0.B-v1.B)-Math.round(vDmg*.4*10)/10)<.2,JSON.stringify({vd,vDmg,lostA:+(v0.A-v1.A).toFixed(1),lostB:+(v0.B-v1.B).toFixed(1)}));
check("...and the rift's ring shows on the guest's own screen",rings>=1,JSON.stringify({rings}));
await bare(); await calm();

// ---- (F6) the Last Lantern: a guest's light marks the host's mobs; its own sword is not a defense ----
await wear('weapon','last_lantern');
await goblin('lit',0,7.5,{hp:1e5,max:1e5,holdT:1e9}); await goblin('dark',0,-6,{hp:1e5,max:1e5,holdT:1e9});
await tick(ALL,6,5);
const wearers=await H.evaluate(()=>window.__mythic.wearers?window.__mythic.wearers():[]);
const lit=await mob('lit'), dark=await mob('dark');
check("F6: the host knows what the guest wears, and the guest's Lantern lights the host's mob near the guest (not one across the hall)",
  wearers.length===1&&wearers[0].myth.includes('last_lantern')&&lit.lanternT>0&&dark.lanternT===0,JSON.stringify({wearers,lit,dark}));
const defHit=await H.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__coopId==='lit'); const h=e.hp; window.__mythic.hurt(e,10); return +(h-e.hp).toFixed(1); });
check("...a defense's 10 on the lit mob lands as 12.5",defHit===12.5,String(defHit));
const lDmg=await A.evaluate(()=>Math.round(window.__dd.heroDmg()*10)/10), l0=(await mob('lit')).hp;
await A.evaluate(()=>{ window.__dd.setHero(0,6,0); window.__dd.hero.yaw=0; window.__dd.swing(); });
await tick(ALL,8,6); await sleep(300); await tick(ALL,2,5);
const l1=(await mob('lit')).hp;
check("...while the guest's own sword lands at its plain damage, as the host's does (the guest's swing counted as a defense's, 25% more)",
  Math.abs((l0-l1)-lDmg)<.15,JSON.stringify({lDmg,lost:+(l0-l1).toFixed(1)}));
await wear('weapon',null); await calm();

// ---- (F6) the Gloomcap Censer: defenses near a guest wearing it fire 15% faster ----
await wear('charm','gloomcap_censer'); await tick(ALL,4,5);
const cd=await H.evaluate(()=>{ const d=window.__dd, k=Object.keys(d.DEFS).find(k=>d.DEFS[k].cd); const nearD={kind:k,x:0,z:8,lvl:1}, farD={kind:k,x:0,z:-12,lvl:1}; return {k,near:d.stat(nearD,'cd'),far:d.stat(farD,'cd')}; });
check("F6: a guest's Gloomcap Censer quickens the defenses near the guest (and only those)",Math.abs(cd.near*1.15-cd.far)<1e-6,JSON.stringify(cd));
await wear('charm',null);

// ---- (F6) Rootsplitter: a guest's 4th swing roots the host's mobs ----
await wear('weapon','rootsplitter'); await calm(); await goblin('root',0,10,{hp:1e5,max:1e5,holdT:0});
await tick(ALL,4,5);
const holds=[];
for(let i=0;i<4;i++){ await A.evaluate(()=>{ window.__dd.setHero(0,6,0); window.__dd.hero.yaw=0; window.__dd.setCam(0,.42,8); window.__dd.swing(); }); await tickUntil([A],A,()=>window.__dd.hero.swingT<0,null,40,3); await sleep(150); await tick([H],1,2); holds.push((await mob('root')).holdT); }
const swings=await A.evaluate(()=>window.__mythic.state().swings);
check("F6: a guest's Rootsplitter holds the host's mob on the 4th swing, not before (it only drew the roots on the guest's own screen)",
  swings===4&&holds.slice(0,3).every(h=>h<=0)&&holds[3]>1,JSON.stringify({swings,holds}));
await wear('weapon',null); await calm();

// ---- (F6) Mossheart Aegis: standing still heals the host's copy of the guest too, so the guest's bar tells the truth ----
await wear('armor','mossheart_aegis'); await tick(ALL,6,5);
await H.evaluate(()=>window.__dd.Meta.heroes()[0].hurt(150)); await sleep(200); await tick(ALL,2,5);
const m0={copy:await copyOf(aId),mine:await local(A)};
await tick(ALL,50,6);   // 5 s standing still
const m1={copy:await copyOf(aId),mine:await local(A)};
check("F6: a guest standing still in Mossheart heals on the host too, in step with its own bar (the host's copy stayed put)",
  m0.copy.max===270&&m1.copy.hp-m0.copy.hp>20&&Math.abs(m1.copy.hp-m1.mine.hp)<=m1.copy.max*.03,JSON.stringify({m0,m1}));
await H.evaluate(()=>window.__dd.Meta.heroes()[0].hurt(1)); await sleep(200); await tick(ALL,1,3);
const m2=await local(A);
check("...so a 1-damage hit takes about 1 off the guest's bar (it used to take back everything the bar had healed)",m1.mine.hp-m2.hp<=3,JSON.stringify({before:m1.mine.hp,after:m2.hp}));
await wear('armor',null);

// ---- (F5) the portal and the hideout follow the host's phase ----
await A.waitForFunction(()=>window.__portal.loaded(),null,{timeout:60000}).catch(()=>{});
await tick(ALL,10,5);
const pBuild=await A.evaluate(()=>window.__portal.state());
const opened=await A.evaluate(()=>window.__hideout.open());
// what the guest wears into the host's wave: the Mantle, the Oath, the Hourglass
await wear('armor','voidwoven_mantle'); await wear('amulet','wardens_oath'); await wear('charm','hourglass_of_hollow_sand');
await tick(ALL,4,5); await calm();
await A.evaluate(()=>{ window.__toasts.length=0; });
await H.evaluate(()=>window.__dd.startWave());
await H.evaluate(()=>window.__dd.spawn('goblin','N'));
await tick(ALL,3,5);

// ---- (F6) the Voidwoven Mantle: the guest's first hit of the host's wave is swallowed ----
const c0=await copyOf(aId), a0=await local(A);
await H.evaluate(()=>window.__dd.Meta.heroes()[0].hurt(20)); await sleep(250); await tick(ALL,2,3);
const c1=await copyOf(aId), a1=await local(A), t1=await toasts();
await H.evaluate(()=>window.__dd.Meta.heroes()[0].hurt(20)); await sleep(250); await tick(ALL,1,3);
const c2=await copyOf(aId);
check("F6: a guest's Voidwoven Mantle swallows its first hit of the host's wave, and the guest blinks away (the hit used to land)",
  c1.hp===c0.hp&&t1.some(t=>/mantle swallows/i.test(t))&&dist(a1,a0)>1,JSON.stringify({c0,c1,a0,a1}));
check("...once: the second hit lands",c2.hp<c1.hp,JSON.stringify({c1,c2}));

// ---- (F6) the Warden's Oath and the Hourglass, worn by the guest ----
const marked=await H.evaluate(()=>window.__dd.enemies.filter(e=>!e.dead&&e.marked).length);
check("F6: a guest's Warden's Oath marks the first mob through a gate in the host's wave",marked>=1,String(marked));
const cMax=await A.evaluate(()=>window.__world.host().crystalMax), cNow=await H.evaluate(()=>window.__dd.S.crystal);
await goblin('sand1',6,-14,{hp:1e5,max:1e5}); await goblin('sand2',-6,-14,{hp:1e5,max:1e5});
await A.evaluate(()=>{ window.__toasts.length=0; });
await H.evaluate(m=>{ window.__dd.S.crystal=m*.2; },cMax); await tick(ALL,3,3); await sleep(200);
const crawl=await H.evaluate(()=>window.__dd.enemies.filter(e=>!e.dead&&/^sand/.test(e.__coopId||'')&&e.crawlT>0).length), t2=await toasts();
await H.evaluate(c=>{ window.__dd.S.crystal=c; },cNow);
check("F6: a guest's Hourglass makes the host's horde crawl when the crystal is about to fall, and the guest hears it (it never fired)",
  crawl===2&&t2.some(t=>/sand runs out/i.test(t)),JSON.stringify({crawl,t2}));

// ---- (F5) the horn: the guest's hideout closes, the portal is gone, E at its spot does nothing ----
await sleep(700); await tick(ALL,6,5);
const t3=await A.evaluate(()=>window.__allToasts.slice()), aOpen=await A.evaluate(()=>window.__hideout.isOpen()), pWave=await A.evaluate(()=>window.__portal.state());
check("F5: the host's horn calls a guest back out of the hideout (it stayed open for the whole wave)",opened===true&&!aOpen&&t3.some(t=>/horn sounds/i.test(t)),JSON.stringify({opened,aOpen,t3}));
const pp=await A.evaluate(()=>window.__portal.pos());
await A.evaluate(p=>window.__dd.setHero(p.x+1,p.z+1,0),pp); await tick(ALL,4,5);
const nearP=await A.evaluate(()=>window.__hideout.near()); await A.evaluate(()=>window.__dd.upgrade()); await sleep(800);
const aOpen2=await A.evaluate(()=>window.__hideout.isOpen());
check("F5: during the host's wave the guest's portal is gone and E where it stood opens nothing (it stayed up, open for shopping)",
  pBuild==='shown'&&pWave==='hidden'&&!nearP&&!aOpen2,JSON.stringify({pBuild,pWave,nearP,aOpen2}));

// ---- (F6) the Tear of the Rootgate: once per HOST wave, and the host's copy goes with it ----
await wear('amulet','tear_of_the_rootgate'); await calm();
await A.evaluate(()=>window.__dd.setCam(Math.PI,.42,8));   // facing the North gate
const tA=await local(A); const torn1=await A.evaluate(()=>window.__mythic.tear()); const tB=await local(A);
for(let i=0;i<12;i++){ await tick(ALL,1,5); await calm(); }   // 1 s; the wave's own arrivals at that gate are cleared as they come, before they can swing
const tCopy=await copyOf(aId), torn2=await A.evaluate(()=>window.__mythic.tear());
check("F6: in the host's wave a guest steps through the Rootgate (30+ away), the host's copy follows, and it's once a wave",
  torn1===true&&dist(tA,tB)>=30&&dist(tCopy,tB)<1&&torn2===false,JSON.stringify({torn1,tA,tB,tCopy,torn2}));
await A.evaluate(()=>{ window.__toasts.length=0; const d=window.__dd, h=d.hero, l=Math.hypot(h.x,h.z)||1, k=Object.keys(d.DEFS)[0]; d.placeDefAt(k,h.x-h.x/l*4,h.z-h.z/l*4,0); });
await sleep(400); await tick([A],1,2);
const t4=await toasts(), placed=await H.evaluate(id=>window.__dd.defs.filter(d=>d.ownerId===id).length,aId);
check("...and the guest can build where it now stands (the host said 'Too far away')",!t4.some(t=>/too far/i.test(t)),JSON.stringify({t4,placed}));
// the host holds the wave; the portal comes back; the next wave gives the Tear back
await H.evaluate(()=>{ const d=window.__dd; let g=0; while(d.S.phase==='wave'&&g++<900){ d.step(1/60,5); for(const e of d.enemies) if(!e.dead) d.kill(e); } });
await tick(ALL,14,5);
const pHeld=await A.evaluate(()=>window.__portal.state()), hPhase=await H.evaluate(()=>window.__dd.S.phase), torn3=await A.evaluate(()=>window.__mythic.tear());
check("F5: the wave held, the portal is back on the guest's screen",hPhase==='build'&&pHeld==='shown',JSON.stringify({hPhase,pHeld}));
await H.evaluate(()=>window.__dd.startWave()); await tick(ALL,6,5);
const torn4=await A.evaluate(()=>window.__mythic.tear()), wv=await A.evaluate(()=>window.__mythic.state().wave), hw=await H.evaluate(()=>window.__dd.S.wave);
check("F6: the Tear is spent for the rest of that wave's build phase (as solo), and back in the host's next wave (it came back never)",
  torn3===false&&torn4===true&&wv===hw&&hw===2,JSON.stringify({torn3,torn4,guestW:wv,hostWave:hw}));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
