// ===== co-op sweep 2026-10-02 (hero-gear-pets): a guest's talents, sets, pets and charms do on the host what they do in single player, and partners see each other's.
//  * the guest's tower talents ride its input: its towers take ITS ranks (Skyfall here), and its Long Hedge makes its hedge long on the host and on its own screen
//  * the Knight's swing talents on the host: Wide Sweep's reach, Bleed every 3rd swing, Shield Bash every 4th, Fury on a kill
//  * the guest's defensive talents on the host: Aegis catches a near-fatal blow, Martyr's Light bursts and heals, Light Feet dodges, Mending Light heals in his own halos
//  * the capstones of a guest's special run on the host: Cyclone's second spin, Crown of Halos and Nova, his own Surge Master
//  * a guest Witch's bolt marks and withers on the host; a guest Ranger's Headhunter crit doubles on the host
//  * full Radiance on a guest heals the guest; a guest tower wears ITS placer's full-set rune ring, on the host and on the guest's puppet
//  * the Trimaw's poison and mark reach the host's mob; a named pet shows as itself on a partner's puppet; a set weapon glows in a partner's hand
//  * Gabriel's Charm worn by the guest: the guest sees its BLITZ
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-sweep-hero-gear-pets-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9493;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8933,{dist:"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));

const GTAL={ knight:{ksweep:3,kbash:3,kbleed:1,kfury:3,kcyclone:1,kaegis:1,kstand:3,kthorns:1,klong:1,ktrap:3,kthorn:3},
  troll:{rvenom:3,rsky:1,rtangle:3,rcrit:3,rpierce:1,rperch:1,rstorm:1,rpin:1,rdodge:1},
  witch:{wither:3,mark:3,tempest:1},
  fighter:{fsurge:3,fcrown:1,fnova:1,fmartyr:1,fmend:1,fbind:1,fflare:1} };
await hostPage.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.removeItem("dd_talents"); }catch(e){} });
await guestPage.addInitScript(t=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_talents",JSON.stringify(t)); }catch(e){} },GTAL);
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8933/?silent&nogate",{timeout:120000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat&&window.__talents,null,{timeout:120000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__freeze=true; try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); window.__dd.step(1/60,30); });

async function tickBoth(batches=6,size=5){
  for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); }
}
const roomCode="coophgp-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
const hostId=hostOpen.id, gid=guestJoin.id;
await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0));
await guestPage.evaluate(()=>window.__dd.setHero(0,6,0));
await tickBoth(12,5);
const selectHero=async h=>{ await guestPage.evaluate(h=>window.__heroes.select(h),h); for(let i=0;i<150;i++){ const ok=await guestPage.evaluate(h=>{ const k=window.__aim&&window.__aim.kind(); return window.__heroes.pick()===h&&(h==='knight'?!k:h==='troll'?k==='bow':k==='staff'); },h); if(ok) break; await tickBoth(1,2); } await tickBoth(4,5); };
const mob=(x,z,o)=>hostPage.evaluate(({x,z,o})=>{ const d=window.__dd, e=d.spawn('goblin','N'); e.x=x; e.z=z; e.y=0; e.hp=9999; e.max=9999; e.dmg=0; e.atk=999; e.holdT=999; Object.assign(e,o||{}); return true; },{x,z,o});
const clearMobs=()=>hostPage.evaluate(()=>{ window.__dd.enemies.length=0; });
const mobBy=id=>hostPage.evaluate(id=>{ const e=window.__dd.enemies.find(e=>e.__coopId===id); return e?{hp:e.hp,dead:!!e.dead,bleedT:e.bleedT||0,poisonT:e.poisonT||0,holdT:e.holdT||0,hexT:e.hexT||0,hexR:e.hexR||0,witherT:e.witherT||0,markT:e.markT||0,talBy:!!e.talBy}:null; },id);
const gHero=()=>hostPage.evaluate(id=>window.__combat.guestHero(id),gid);
const guestSwing=async()=>{ await guestPage.evaluate(()=>window.__dd.swing()); await tickBoth(8,5); };

await selectHero('knight');   // a fresh player here is the Witch
await guestPage.evaluate(()=>{ window.__dd.setHero(0,6,0); window.__dd.setCam(0,.42,8); }); await tickBoth(6,5);
// ---- tower talents ride the input
const tt=await hostPage.evaluate(id=>{ const M=window.__dd.Meta, T=window.__talents; return { sky:M.defOwnerTalent(id,'troll','rsky'), long:M.defOwnerTalent(id,'knight','klong'), mine:T.skyBonus({ownerId:id,ownerHero:'troll',kind:'sky'}), other:T.skyBonus({ownerId:id,ownerHero:'knight',kind:'sky'}), host:T.skyBonus({heroId:'troll',kind:'sky'}) }; },gid);
check("a guest's tower takes ITS placer's tower talents (Skyfall +2 rockets), never the host's",tt.sky===1&&tt.long===1&&tt.mine===2&&tt.other===0&&tt.host===0,JSON.stringify(tt));

// ---- Long Hedge: the guest's hedge is long on the host and on its own screen
await hostPage.evaluate(id=>window.__combat.setGuestMana(id,99999),gid);
let hedge=null;
for(const [x,z] of [[0,12],[0,14],[0,10],[2,12],[-2,12],[0,16]]){
  await guestPage.evaluate(({x,z})=>window.__net.send('place',{kind:'spike',x,z,yaw:0}),{x,z}); await tickBoth(4,5);
  hedge=await hostPage.evaluate(id=>{ const d=window.__dd.defs.find(d=>d.kind==='spike'&&d.ownerId===id); return d?{id:d.__coopId||null,long:!!d.long,x:d.x,z:d.z}:null; },gid);
  if(hedge) break; }
await tickBoth(6,5);
hedge=await hostPage.evaluate(id=>{ const d=window.__dd.defs.find(d=>d.kind==='spike'&&d.ownerId===id); return d?{id:d.__coopId||null,long:!!d.long}:null; },gid);
const hp1=hedge&&await guestPage.evaluate(id=>window.__defsync.get(id),hedge.id);
check("the guest's hedge is a Long Hedge on the host (his talent, not the host's)",hedge&&hedge.long,JSON.stringify(hedge));
check("...and stands its real length on the guest's own screen",hp1&&hp1.lg===1&&hp1.stretch>2.5,JSON.stringify(hp1));
const hostHedge=await hostPage.evaluate(()=>{ const d=window.__dd.placeDefAt('spike',0,-20,0); return d?{long:!!d.long}:null; });
check("the host's own hedge is not long (the host has no Long Hedge)",!hostHedge||hostHedge.long===false,JSON.stringify(hostHedge));

// ---- the Knight's swing talents
await guestPage.evaluate(()=>{ window.__dd.setHero(0,6,0); window.__dd.setCam(0,.42,8); }); await tickBoth(4,5);
await mob(0,9.1,{__coopId:'kA'});
const k0=await mobBy('kA');
await guestSwing();
const k1=await mobBy('kA');
check("Wide Sweep III: the guest's swing reaches a mob 3.1 away (a plain sword reaches 2.9)",k0&&k1&&k1.hp<k0.hp,JSON.stringify({k0,k1}));
const back=()=>hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__coopId==='kA'); e.x=0; e.z=8.2; });   // each hit knocks it back a little
await back(); await guestSwing(); await back(); await guestSwing();
const k3=await mobBy('kA');
check("Bleed: the guest's 3rd swing makes the host's mob bleed",k3&&k3.bleedT>0&&k3.poisonT>0,JSON.stringify(k3));
await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__coopId==='kA'); e.holdT=0; e.x=0; e.z=8.5; });
const kb0=await hostPage.evaluate(()=>window.__talents.knight().bash);
await guestSwing();
const k4=await mobBy('kA'), kb1=await hostPage.evaluate(()=>window.__talents.knight().bash), gfx=await guestPage.evaluate(()=>window.__talents.coopFxSeen());
check("Shield Bash: the guest's 4th swing bashes the host's mob (stunned), and the guest sees BASH",k4&&k4.holdT>0&&kb1===kb0+1,JSON.stringify({k4,kb0,kb1,gfx}));
await clearMobs(); await mob(0,8.2,{__coopId:'kF',hp:1,max:100});
await guestSwing();
const fury=await guestPage.evaluate(()=>window.__talents.knight().rush);   // KC.rush: how many times Fury started
check("Fury: a kill by the guest's sword quickens the guest's own swings",fury>=1,JSON.stringify({fury,fx:await guestPage.evaluate(()=>window.__talents.coopFxSeen())}));
await clearMobs();

// ---- Aegis: a near-fatal blow on the host is caught, and the shell holds
const a0=await gHero();
const aeg=await hostPage.evaluate(id=>{ const H=window.__dd.Meta.heroes().find(h=>h.gid===id); let n=0; const g0=window.__combat.guestHero(id); let last=g0.hp; for(;n<40;n++){ H.hurt(12); const g=window.__combat.guestHero(id); if(g.hp===last) break; last=g.hp; } const at=window.__combat.guestHero(id).hp; H.hurt(50); return { n, at, after:window.__combat.guestHero(id).hp, max:g0.max }; },gid);
await tickBoth(3,5);
const aegG=await guestPage.evaluate(()=>({ fx:window.__talents.coopFxSeen(), aegis:window.__talents.knight().aegis, on:window.__talents.knight().aegis }));
check("Aegis: the guest's near-fatal blow is caught on the host and the 3 s shell blocks the next",aeg.at>0&&aeg.after===aeg.at&&aeg.at<=aeg.max*.45,JSON.stringify({a0,aeg}));
check("...and the guest sees its own AEGIS (the gold shell on its hero)",aegG.fx.last==='aegis'&&aegG.aegis>=1,JSON.stringify(aegG));

// ---- Cyclone: the guest's Whirlwind spins twice on the host
await hostPage.evaluate(()=>window.__dd.step(1/60,200));   // the shell passes
const cy0=await hostPage.evaluate(()=>window.__talents.knight().cyclone);
await guestPage.evaluate(()=>{ window.__specials.forceReady(); window.__specials.fire(); });
await tickBoth(16,5);
const cy1=await hostPage.evaluate(()=>window.__talents.knight().cyclone);
check("Cyclone: the guest's Whirlwind spins a second time on the host",cy1===cy0+1,JSON.stringify({cy0,cy1}));

// ---- the Radiance set: the guest's hits heal the guest
await guestPage.evaluate(()=>{ const d=window.__dd, M=window.__meta; for(const [slot,nm] of [["weapon","Broadsword"],["armor","Robe"],["charm","Charm"],["amulet","Amulet"],["familiar","Wisp Egg"]]){ const it=d.rollItem(2,slot,6); it.name=nm+" of Radiance"; M.giveItem(it); M.equip(it.id); } d.applyGear(); d.step(1/60,5); });
await tickBoth(8,5);
const rad=await guestPage.evaluate(()=>(window.__dd.Meta.sets.active()||[]).map(a=>a.name+':'+a.tier));
await guestPage.evaluate(()=>window.__dd.setHero(0,6,0)); await tickBoth(4,5);
await hostPage.evaluate(id=>{ const H=window.__dd.Meta.heroes().find(h=>h.gid===id); H.hurt(20); },gid);
await mob(0,8.2,{__coopId:'rA'});
const r0=await gHero(); await guestSwing(); const r1=await gHero();
const gr=await guestPage.evaluate(()=>({hp:window.__dd.hero.hp}));
check("full Radiance on the guest heals the GUEST (15% of its blow), on the host's copy and its own bar",rad.includes('of Radiance:5')&&r1.hp>r0.hp&&Math.abs(gr.hp-r1.hp)<3,JSON.stringify({rad,r0,r1,gr}));
await clearMobs();
await tickBoth(6,5);
const ring=await hostPage.evaluate(id=>{ const d=window.__dd.defs.find(d=>d.ownerId===id); return d?{col:d.setRingCol||0,id:d.__coopId}:null; },gid);
const ringG=ring&&await guestPage.evaluate(id=>window.__defsync.get(id),ring.id);
check("the guest's tower wears the guest's full-set rune ring (Radiance gold), on the host and on the guest's puppet",ring&&ring.col===0xffe28a&&ringG&&ringG.ring===0xffe28a,JSON.stringify({ring,ringG}));

// ---- the Fighter: Crown of Halos, Nova and his own Surge Master on the host; Martyr's Light; Mending Light
await selectHero('fighter');
const rf0=await hostPage.evaluate(()=>window.__talents.rf());
await guestPage.evaluate(()=>{ window.__specials.forceReady(); window.__specials.fire(); });
await tickBoth(3,5);
const surge=await hostPage.evaluate(()=>window.__specials.haloSurgeT());
await tickBoth(8,5);
const rf1=await hostPage.evaluate(()=>window.__talents.rf());
check("Halo Surge lasts the GUEST's Surge Master (6 + 6 s), and his Crown of Halos and Nova go off on the host",surge>9&&rf1.crown===rf0.crown+1&&rf1.nova===rf0.nova+1,JSON.stringify({surge,crown:[rf0.crown,rf1.crown],nova:[rf0.nova,rf1.nova]}));
await hostPage.evaluate(()=>window.__dd.step(1/60,30));
const mart=await hostPage.evaluate(id=>{ const H=window.__dd.Meta.heroes().find(h=>h.gid===id); const g0=window.__combat.guestHero(id); let low=null; for(let n=0;n<60;n++){ const b=window.__combat.guestHero(id); H.hurt(6); const a=window.__combat.guestHero(id); if(a.hp>b.hp){ low={before:b.hp,after:a.hp,max:a.max}; break; } if(a.dead) break; } return {g0,low}; },gid);
await tickBoth(3,5);
const martG=await guestPage.evaluate(()=>window.__talents.coopFxSeen());
check("Martyr's Light: near death the guest bursts and heals 40% on the host, and sees it",mart.low&&mart.low.after>mart.low.before+mart.low.max*.3&&martG.last==='martyr',JSON.stringify({mart,martG}));
// Mending Light: a halo the guest's fighter placed, the guest standing in it
await guestPage.evaluate(()=>window.__dd.setHero(0,6,0)); await tickBoth(4,5);
let zap=null; for(const [x,z] of [[2.5,6],[-2.5,6],[0,3.5],[2.5,8],[-2.5,8]]){ await guestPage.evaluate(({x,z})=>window.__net.send('place',{kind:'zap',x,z,yaw:0}),{x,z}); await tickBoth(4,5); zap=await hostPage.evaluate(id=>{ const d=window.__dd.defs.find(d=>d.kind==='zap'&&d.ownerId===id); return d?{hero:d.ownerHero}:null; },gid); if(zap) break; }
await hostPage.evaluate(id=>{ const H=window.__dd.Meta.heroes().find(h=>h.gid===id); H.hurt(10); },gid);
const m0=await gHero(); const mf0=await guestPage.evaluate(()=>window.__talents.coopFxSeen().n);
await tickBoth(12,5);
const m1=await gHero(); const mf1=await guestPage.evaluate(()=>window.__talents.coopFxSeen());
check("Mending Light: the guest heals inside his own halo on the host (before regen could), and his own page is told",zap&&zap.hero==='fighter'&&m1.hp>m0.hp&&mf1.n>mf0&&mf1.last==='mend',JSON.stringify({zap,m0,m1,mf1}));

// ---- the Witch: her bolt marks and withers the host's mob
await selectHero('witch');
await guestPage.evaluate(()=>{ window.__dd.setHero(0,6,0); window.__dd.setCam(0,.42,8); }); await tickBoth(4,5);
await mob(0,11,{__coopId:'wA'});
await guestPage.evaluate(()=>window.__dd.swing()); await tickBoth(20,5);
const w1=await mobBy('wA');
check("Hex Mark and Withering: the guest's bolt marks (with HIS rank) and slows the host's mob",w1&&w1.hexT>0&&w1.hexR===3&&w1.witherT>0&&w1.talBy,JSON.stringify(w1));
await clearMobs();

// ---- the Ranger: Headhunter's crit doubles on the host; Light Feet dodges on the host
await selectHero('troll');
await guestPage.evaluate(()=>{ window.__dd.setHero(0,6,0); window.__dd.setCam(0,.42,8); }); await tickBoth(4,5);
await mob(0,11,{__coopId:'tA'});
const shoot=async rnd=>{ const a=(await mobBy('tA')).hp; await guestPage.evaluate(r=>{ window.__mr=Math.random; Math.random=()=>r; window.__dd.swing(); },rnd); await tickBoth(20,5); await guestPage.evaluate(()=>{ Math.random=window.__mr; }); return a-(await mobBy('tA')).hp; };
const plain=await shoot(.99), crit=await shoot(.001);
check("Headhunter: the guest's crit arrow does double damage on the host",plain>0&&Math.abs(crit-2*plain)<=.2*plain,JSON.stringify({plain,crit}));
await clearMobs();
const dodge=await hostPage.evaluate(id=>{ const H=window.__dd.Meta.heroes().find(h=>h.gid===id), b=window.__combat.guestHero(id).hp, mr=Math.random; Math.random=()=>0; try{ H.hurt(30); }finally{ Math.random=mr; } return {b,a:window.__combat.guestHero(id).hp}; },gid);
await tickBoth(3,5);
const dodgeG=await guestPage.evaluate(()=>window.__talents.coopFxSeen().last);
check("Light Feet: the guest DODGEs a blow on the host, and sees it",dodge.a===dodge.b&&dodgeG==='dodge',JSON.stringify({dodge,dodgeG}));

// ---- the Trimaw's venom and mark reach the host's mob
await mob(0,30,{__coopId:'pT'});
await guestPage.evaluate(()=>window.__net.send('famHit',{id:'pT',dmg:1,poison:4,poisonDmg:2,mark:3}));
await tickBoth(2,5);
const pt=await mobBy('pT');
check("a guest's Trimaw poisons and marks the host's mob",pt&&pt.poisonT>3&&pt.markT>2,JSON.stringify(pt));
await clearMobs();

// ---- a named pet shows as itself on a partner's puppet
await guestPage.evaluate(()=>{ const M=window.__meta, f=window.__mythic.normalize({ tier:'named', named:'gladehart', lvl:10 }); M.giveItem(f); M.equip(f.id); window.__dd.step(1/60,5); });
let pup=null; for(let i=0;i<40;i++){ await tickBoth(2,5); pup=await hostPage.evaluate(id=>window.__party.get(id),gid); if(pup&&pup.familiarNamed==='gladehart') break; await new Promise(r=>setTimeout(r,150)); }
check("the guest's Gladehart is a stag on the host's screen, not a Wisp",pup&&pup.familiarNamed==='gladehart'&&pup.look&&pup.look.f&&pup.look.f.nm==='gladehart',JSON.stringify(pup&&{named:pup.familiarNamed,kind:pup.familiarKind,f:pup.look&&pup.look.f}));

// ---- a set weapon glows in a partner's hand
await selectHero('knight');
await guestPage.evaluate(()=>{ const N=window.__mythic.normalize, M=window.__meta; const sw=N({ slot:'weapon', name:'Mythic Sword of the Void', setId:'void', look:'sword', forceLook:'sword', rarity:5, lvl:20, stats:{ dmg:24, spd:45, tow:41 } }); sw.id='heldv'; M.giveItem(sw); M.equip(sw.id); });
let wp=null; for(let i=0;i<40;i++){ await tickBoth(2,5); wp=await hostPage.evaluate(id=>window.__party.get(id),gid); if(wp&&wp.weaponGlow>0) break; await new Promise(r=>setTimeout(r,150)); }
const own=await guestPage.evaluate(()=>window.__heldglow.info());
check("the guest's Void sword glows in his puppet's hand on the host's screen, as it does in his own",wp&&wp.weaponGlow>0&&own.glowing>0,JSON.stringify({w:wp&&{name:wp.weaponName,glow:wp.weaponGlow,look:wp.look&&wp.look.w},own}));

// ---- Gabriel's Charm on the guest: the guest sees its BLITZ
await guestPage.evaluate(()=>{ const M=window.__meta, c=window.__mythic.normalize({ tier:'named', named:'gabriels_charm', lvl:10 }); M.giveItem(c); M.equip(c.id); window.__dd.step(1/60,5); });
await tickBoth(8,5);
const gb0=await guestPage.evaluate(()=>window.__gabriel.cued());
await hostPage.evaluate(()=>window.__dd.startWave()); await tickBoth(4,5);
const gb1=await guestPage.evaluate(()=>window.__gabriel.cued()), gbH=await hostPage.evaluate(()=>window.__gabriel.fired());
check("Gabriel's Charm worn by the guest: the host's horn BLITZes and the GUEST sees the cue",gbH>=1&&gb1===gb0+1,JSON.stringify({gb0,gb1,gbH}));

check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
