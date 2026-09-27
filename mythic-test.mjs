// ===== MYTHIC GEAR (build 152): the tier the hideout forges (rarity 5), the ten named mythics and their powers, two named at
// once, a named piece counting toward any set, and the dd_gear_return contract (records the hideout leaves come into the bag)
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const SP=process.env.SP||process.cwd(); const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8881; const server=await serve(PORT);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const page=await browser.newPage({viewport:{width:960,height:600}});
const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:"+PORT+"/?silent&nogate&map=0",{timeout:240000}); await page.waitForFunction(()=>window.__dd&&window.__mythic&&window.__meta&&window.__sets&&window.__familiar,null,{timeout:180000});
// the tier
const tier=await page.evaluate(()=>({name:window.__dd.RNAME[5],css:window.__dd.RCSS[5],valid:window.__meta.state?true:true}));
check("rarity 5 is Mythic with its own colour",tier.name==="Mythic"&&/^#/.test(tier.css),JSON.stringify(tier));
// the return contract: two records the hideout would leave -- a named mythic and a mythic set piece -- come into the bag
const ret=await page.evaluate(()=>{ const M=window.__meta; M.reset(); window.__dd.resetGear(); const recs=[{id:'h1',name:'Rootsplitter',slot:'weapon',rarity:5,lvl:10,stats:{},tier:'named',named:'rootsplitter',from:'hideout',sentAt:Date.now(),hideout:{kind:'x'}},{id:'h2',name:'Mythic Armor of the Void',slot:'armor',rarity:5,lvl:10,stats:{hp:120,def:20},tier:'mythic',set:'of the Void',from:'hideout',sentAt:Date.now()}];
  localStorage.setItem(window.__mythic.KEY,JSON.stringify(recs)); const n=window.__mythic.returnGear(); const bag=M.bag(); const r=bag.find(i=>i.id==='h1'), v=bag.find(i=>i.id==='h2'); return {n,key:localStorage.getItem(window.__mythic.KEY),bag:bag.length,r:r&&{name:r.name,slot:r.slot,rarity:r.rarity,tier:r.tier,mt:r.mythicTier,named:r.named,dmg:r.stats.dmg,hp:r.stats.hp,req:r.req,value:r.value},v:v&&{name:v.name,rarity:v.rarity,tier:v.tier,mt:v.mythicTier,set:window.__sets.setOf(v),hp:v.stats.hp,req:v.req}}; });
check("dd_gear_return: both records come into the bag and the key is cleared",ret.n===2&&ret.key===null&&ret.bag===2,JSON.stringify(ret));
check("a named record takes the table's stats and slot, a numeric tier for the game, no level gate, its own value",!!ret.r&&ret.r.named==='rootsplitter'&&ret.r.dmg===30&&ret.r.hp===90&&ret.r.rarity===5&&typeof ret.r.tier==='number'&&ret.r.mt==='named'&&ret.r.req===1&&ret.r.value===400,JSON.stringify(ret.r));
check("a mythic set piece keeps its stats and its set ending (of the Void) at rarity 5",!!ret.v&&ret.v.rarity===5&&ret.v.set==='of the Void'&&ret.v.hp===120&&ret.v.mt==='mythic'&&ret.v.req===1,JSON.stringify(ret.v));
// two named at once; a named piece counts toward any set
const lim=await page.evaluate(()=>{ const M=window.__meta, d=window.__dd; const mk=(k,id)=>{ const N=window.__mythic.NAMED[k]; const it={id,name:N.name,slot:N.slot,rarity:5,lvl:10,stats:Object.assign({},N.stats),tier:'named',named:k}; return window.__mythic.normalize(it); };
  M.giveItem(mk('wardens_oath','n2')); M.giveItem(mk('gloomcap_censer','n3')); const e1=M.equip('h1'), e2=M.equip('n2'), e3=M.equip('n3'); const g=d.gear();
  for(const [slot,nm] of [["armor","Bark Coat"],["familiar","Moss Egg"]]){ const it=d.rollItem(1,slot,3); it.name=nm+" of the Forest"; M.giveItem(it); M.equip(it.id); }
  return {e1,e2,e3,worn:{weapon:g.weapon&&g.weapon.name,amulet:g.amulet&&g.amulet.name,charm:g.charm&&g.charm.name},bagHasCenser:M.bag().some(i=>i.id==='n3'),active:window.__sets.active().map(a=>a.name+':'+a.count)}; });
check("two named mythics at once is the limit: the third stays in the bag",lim.e1&&lim.e2&&!lim.e3&&lim.worn.weapon==='Rootsplitter'&&/Oath/.test(lim.worn.amulet)&&!lim.worn.charm&&lim.bagHasCenser,JSON.stringify(lim));
check("two Forest pieces plus two named mythics read as four of the Forest (a named piece counts toward any set)",lim.active.includes('of the Forest:4'),JSON.stringify(lim.active));
// the powers, one at a time. helpers: wear one named piece alone
const wearOnly=(k)=>page.evaluate(k=>{ const M=window.__meta, d=window.__dd; d.resetGear(); const N=window.__mythic.NAMED[k]; const it=window.__mythic.normalize({id:'p_'+k,name:N.name,slot:N.slot,rarity:5,lvl:10,stats:{},tier:'named',named:k}); M.giveItem(it); const ok=M.equip(it.id); d.step(1/60,2); return {ok,has:window.__mythic.has(k)}; },k);
await page.evaluate(()=>{ const d=window.__dd; d.start(); d.step(1/60,30); for(const e of d.enemies) d.kill(e); d.step(1/60,30); });
// Rootsplitter: every 4th swing holds what is in front
let r=await wearOnly('rootsplitter');
const roots=await page.evaluate(()=>{ const d=window.__dd; d.setHero(0,10,0); d.setCam(0,.42,8); /* a swing faces the camera's yaw when standing still */ const g=d.spawn('goblin','N'); g.hp=g.max=9999; g.spd=0; g.x=0; g.z=11.8; let held=0; for(let s=0;s<4;s++){ d.swing(); for(let i=0;i<40;i++){ d.step(1/60,1); if(g.holdT>0) held=s+1; } } const spd=d.mobSpd(g); const out={swings:window.__mythic.state().swings,heldOnSwing:held,holdT:+(g.holdT||0).toFixed(2),spd}; d.kill(g); return out; });
check("Rootsplitter: the 4th swing sends roots that hold the goblin (holdT 2 s, speed 0), the first three do not",r.has&&roots.heldOnSwing===4&&roots.holdT>1&&roots.spd===0,JSON.stringify(roots));
// The Last Lantern: a lit enemy takes 25% more from anything but the sword
r=await wearOnly('last_lantern');
const lantern=await page.evaluate(()=>{ const d=window.__dd; const g=d.spawn('goblin','N'); g.hp=g.max=9999; g.spd=0; g.x=1.5; g.z=10; d.step(1/60,5); const lit=g.lanternT>0; const before=g.hp; window.__mythic.hurt(g,10); const dropped=before-g.hp; d.kill(g); return {lit,dropped}; });
check("The Last Lantern: an enemy near you is lit and takes 12.5 from a 10 hit",r.has&&lantern.lit&&Math.abs(lantern.dropped-12.5)<.01,JSON.stringify(lantern));
// Mossheart Aegis: standing still heals you and nearby defenses
r=await wearOnly('mossheart_aegis');
const moss=await page.evaluate(()=>{ const d=window.__dd; d.hero.hp=Math.round(d.hero.max*.4); const hp0=d.hero.hp; d.S.mana=999; let def=null; for(let dx=-4;dx<=4&&!def;dx++){ try{ def=d.placeDefAt('harpoon',d.hero.x+dx,d.hero.z+2,0); }catch(e){} } if(def){ def.hp=def.max*.5; } const dh0=def?def.hp:0; d.setKeys({w:0,s:0,a:0,d:0}); d.step(1/60,240); const out={hp0,hp1:Math.round(d.hero.hp),dh0:Math.round(dh0),dh1:def?Math.round(def.hp):0,idle:window.__mythic.state().idleT}; if(def){ d.setHero(def.x,def.z+1,0); d.sell(); } return out; });
check("Mossheart Aegis: after 2 s standing still you and a defense beside you heal",r.has&&moss.hp1>moss.hp0&&moss.dh1>moss.dh0,JSON.stringify(moss));
// Voidwoven Mantle: the first hit of a wave is swallowed, the second lands
r=await wearOnly('voidwoven_mantle');
const mantle=await page.evaluate(()=>{ const d=window.__dd; d.startWave(); d.step(1/60,3); d.hero.hp=d.hero.max; const x0=d.hero.x, z0=d.hero.z; window.__mythic.hurtHero(20); const afterFirst=d.hero.hp; const moved=Math.hypot(d.hero.x-x0,d.hero.z-z0); window.__mythic.hurtHero(20); return {phase:d.S.phase,afterFirst,max:d.hero.max,moved:+moved.toFixed(2),afterSecond:d.hero.hp,used:window.__mythic.state().mantle}; });
check("Voidwoven Mantle: the first hit of the wave is swallowed and you blink away; the second hurts",r.has&&mantle.afterFirst===mantle.max&&mantle.moved>1&&mantle.afterSecond<mantle.max&&mantle.used,JSON.stringify(mantle));
// The Warden's Oath: the first mob through a gate this wave is marked and slowed; the next is not
r=await wearOnly('wardens_oath');
const oath=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,5); const a=d.spawn('goblin','N'), b=d.spawn('goblin','N'); const out={a:{marked:!!a.marked,slow:a.slowT>0,spd:+d.mobSpd(a).toFixed(2),base:+a.spd.toFixed(2)},b:{marked:!!b.marked}}; d.kill(a); d.kill(b); return out; });
check("The Warden's Oath: the first through the gate is marked and slowed, the second is not",r.has&&oath.a.marked&&oath.a.slow&&oath.a.spd<oath.a.base&&!oath.b.marked,JSON.stringify(oath));
// Tear of the Rootgate: face a gate, press T, stand at it -- once a wave
r=await wearOnly('tear_of_the_rootgate');
const tear=await page.evaluate(()=>{ const d=window.__dd; const probe=d.spawn('goblin','N'); const gx=probe.x, gz=probe.z; d.kill(probe); d.setHero(0,6,0); d.setCam(Math.atan2(gx-0,gz-6),.42,8); const t1=window.__mythic.tear(); const dist=Math.hypot(d.hero.x-gx,d.hero.z-gz); const t2=window.__mythic.tear(); return {t1,dist:+dist.toFixed(2),t2}; });
check("Tear of the Rootgate: T takes you to the gate you face, once a wave",r.has&&tear.t1&&tear.dist<2.5&&!tear.t2,JSON.stringify(tear));
// Hourglass of Hollow Sand: the crystal near falling -> the horde crawls
r=await wearOnly('hourglass_of_hollow_sand');
const hour=await page.evaluate(()=>{ const d=window.__dd; const g=d.spawn('goblin','N'); g.hp=g.max=9999; d.S.crystal=Math.round(d.S.crystal*.2); d.step(1/60,3); const out={crawl:+(g.crawlT||0).toFixed(2),spd:+d.mobSpd(g).toFixed(3),base:+g.spd.toFixed(3),used:window.__mythic.state().hour}; d.kill(g); return out; });
check("Hourglass of Hollow Sand: when the crystal is about to fall the horde crawls for 4 s",r.has&&hour.crawl>3&&hour.spd<hour.base*.2&&hour.used,JSON.stringify(hour));
// Gloomcap Censer: a defense beside you fires faster than one far away
r=await wearOnly('gloomcap_censer');
const censer=await page.evaluate(()=>{ const d=window.__dd; d.S.mana=999; d.setHero(0,10,0); let nearD=null, farD=null; for(let dx=-4;dx<=4&&!nearD;dx++){ try{ nearD=d.placeDefAt('harpoon',d.hero.x+dx,d.hero.z+2,0); }catch(e){} } for(let dx=-4;dx<=4&&!farD;dx++){ try{ farD=d.placeDefAt('harpoon',d.hero.x+dx,d.hero.z-14,0); }catch(e){} } const out={near:nearD?+d.stat(nearD,'cd').toFixed(3):null,far:farD?+d.stat(farD,'cd').toFixed(3):null}; return out; });
check("Gloomcap Censer: a defense beside you fires 15% faster than one far away",r.has&&censer.near!==null&&censer.far!==null&&Math.abs(censer.near*1.15-censer.far)<.01,JSON.stringify(censer));
// Old Lamplight: +1 pet projectile through its stats; Bramblewhisk: the thorns
r=await wearOnly('old_lamplight'); const lamp=await page.evaluate(()=>({fproj:window.__dd.heroStat('fproj')}));
check("Old Lamplight: +1 pet projectile",r.has&&lamp.fproj>=1,JSON.stringify(lamp));
r=await wearOnly('bramblewhisk'); const thorn=await page.evaluate(()=>({thorns:window.__familiar.thornsOn()}));
check("Bramblewhisk: the pet's thorns are on",r.has&&thorn.thorns,JSON.stringify(thorn));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
