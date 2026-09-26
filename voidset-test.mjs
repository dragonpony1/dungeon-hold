// ===== THE VOID SET, FLESHED OUT (94-voidset.js, 93-gearsets.js, 99-network.js, game.js): the set's own code-built sword
// on the knight, the five-piece power (this wearer's Dazzling Halos +75%, applied for the defense's OWNER, a co-op guest
// included), the hideout reward written once and never twice, the hero's aura kept, and mana orbs worth
// 25% more. Section A runs solo; section B is a real host + guest pair (needs the `peer` package, like the co-op suites).
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer=null; try { ({ PeerServer } = await import("peer")); } catch(e) {}
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8904, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function newPage(ctx){ const p=await (ctx||browser).newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto(BASE+"/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__meta&&window.__weapons&&window.__voidset&&window.__heroes&&window.__net,null,{timeout:60000});
  await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); }); return p; }
// five pieces of the Void, one per slot: an ordinary rare roll renamed the way 93-gearsets' makeSet does
const wearVoid=p=>p.evaluate(()=>{ const d=window.__dd, M=window.__meta; const ids=[]; for(const slot of d.SLOTS){ const it=d.rollItem(2,slot); it.rarity=2; it.name=it.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' of the Void'; M.onPickup(it); M.equip(it.id); ids.push(it.id); } d.step(1/60,2); return {ids,active:M.sets.active().map(a=>({name:a.name,tier:a.tier}))}; });
const placeNear=(p,kind)=>p.evaluate(kind=>{ const d=window.__dd; d.S.mana=99999; const before=d.defs.length; const h=d.hero; for(let dz=2;dz<=12&&d.defs.length===before;dz++) for(let dx=-8;dx<=8&&d.defs.length===before;dx++){ try{ d.placeDefAt(kind,h.x+dx,h.z+dz,0); }catch(e){} } const nd=d.defs[d.defs.length-1]; return d.defs.length>before?{i:d.defs.length-1,kind:nd.kind,x:nd.x,z:nd.z}:null; },kind);
const dmgOf=(p,i)=>p.evaluate(i=>{ const d=window.__dd, def=d.defs[i]; const cfg=d.DEFS[def.kind], l=def.lvl||1; const base=Math.max(1,Math.round(cfg.dmg*(1+.5*(l-1))*(1+d.heroStat('tow')/100)*d.heroMult('tow')*(1+(def.buff||0))*10)/10); return {got:d.stat(def,'dmg'),base,boosted:Math.max(1,Math.round(base*1.75*10)/10)}; },i);

// ==== A: solo ====
{
  const page=await newPage();
  const worn=await wearVoid(page);
  check("five Void pieces worn: the set is active at tier 5",worn.active.some(a=>a.name==='of the Void'&&a.tier===5),JSON.stringify(worn.active));
  await page.evaluate(()=>window.__dd.step(1/60,10));
  check("the hero's violet aura is on (kept as it was)",await page.evaluate(()=>window.__meta.packs.aura().on));
  check("the set's five-piece text now names the halo power",await page.evaluate(()=>/DAZZLING HALOS \+75%/.test(window.__meta.packs.get('of the Void').text[1])));

  // the unlock: a reward record in the hideout's wall locker (dd_gear_carried, reward:true), plus the game's own granted ledger
  const u1=await page.evaluate(()=>({led:window.__voidset.unlocks()['stand-void'],rew:window.__voidset.carried().filter(r=>r.reward),all:window.__voidset.carried().length}));
  const r1=u1.rew[0];
  check("wearing all five puts ONE reward in the locker: the Void Armor Stand, a carried record with reward:true and a reason, legendary, armor slot, from dungeon-hold",u1.rew.length===1&&u1.all===1&&!!r1&&r1.id==='reward-stand-void'&&r1.name==='Void Armor Stand'&&r1.reward===true&&r1.reason==='The Void set, complete'&&r1.slot==='armor'&&r1.rarity===4&&r1.from==='dungeon-hold'&&typeof r1.carriedAt==='number'&&r1.model==='armor-stand-void.glb'&&r1.set==='of the Void',JSON.stringify(r1));
  check("...and the game's own ledger remembers it was granted (id, set, name, model, the reward's id, when)",!!u1.led&&u1.led.set==='of the Void'&&u1.led.name==='Void Armor Stand'&&u1.led.model==='armor-stand-void.glb'&&u1.led.rewardId==='reward-stand-void'&&u1.led.at===r1.carriedAt,JSON.stringify(u1.led));
  // the hideout opens the locker (rewardSeen) and later takes the stand onto the display (the record leaves the list); the game re-checks and grants nothing twice
  await page.evaluate(()=>{ const a=JSON.parse(localStorage.getItem('dd_gear_carried')); a[0].rewardSeen=true; a.push({id:'theirs',name:'Their Thing',slot:'charm',rarity:1,from:'hideout'}); localStorage.setItem('dd_gear_carried',JSON.stringify(a)); });
  await page.evaluate(ids=>{ const M=window.__meta; M.unequip('charm'); window.__dd.step(1/60,2); M.equip(ids[2]); window.__dd.step(1/60,2); },worn.ids);
  const u2=await page.evaluate(()=>window.__voidset.carried());
  check("taking a piece off and back on rewrites nothing: the hideout's rewardSeen stays, its own record stays, still one reward",u2.length===2&&u2[0].id==='reward-stand-void'&&u2[0].rewardSeen===true&&u2[0].carriedAt===r1.carriedAt&&u2[1].id==='theirs',JSON.stringify(u2));
  await page.evaluate(()=>{ const a=JSON.parse(localStorage.getItem('dd_gear_carried')).filter(r=>r.id!=='reward-stand-void'); localStorage.setItem('dd_gear_carried',JSON.stringify(a)); });   // claimed: the stand went onto the display
  await page.evaluate(ids=>{ const M=window.__meta; M.unequip('charm'); window.__dd.step(1/60,2); M.equip(ids[2]); window.__dd.step(1/60,2); window.__voidset.check(); },worn.ids);
  const u3=await page.evaluate(()=>window.__voidset.carried().filter(r=>r.reward).length);
  check("once claimed (the record gone from the list) the reward is never granted again -- the ledger says so",u3===0,JSON.stringify({rewardsNow:u3}));

  // the sword on the knight
  await page.evaluate(()=>window.__heroes.select('knight'));
  await page.waitForFunction(()=>{ for(let i=0;i<3;i++) window.__dd.step(1/60,1); const s=window.__weapons.state(); return s.mounted&&/^void\|/.test(s.key); },null,{timeout:90000}).catch(()=>{});
  const ws=await page.evaluate(()=>window.__weapons.state());
  check("the knight holds the Void's own blade: mounted, key void|…, flagged as the set's",ws.mounted&&/^void\|/.test(ws.key)&&ws.void===true&&ws.loaded.includes('void'),JSON.stringify({key:ws.key,void:ws.void,mounted:ws.mounted}));
  const model=await page.evaluate(()=>new Promise(res=>window.__weapons.model('void',r=>{ let meshes=0, lit=0; r.traverse(o=>{ if(o.isMesh){ meshes++; if(o.material&&o.material.isMeshBasicMaterial) lit++; } }); res({name:r.name,proc:!!r.userData.proc,meshes,lit,sprites:r.children.filter(c=>c.isSprite).length,box:[+r.userData.box.min.y.toFixed(2),+r.userData.box.max.y.toFixed(2)],gripF:r.userData.gripF}); })));
  check("it's built in code: a dozen-plus parts, lit runes and fuller, two glow sprites, +Y blade axis, grip near the pommel",model.proc&&model.name==='sword-void'&&model.meshes>=14&&model.lit>=7&&model.sprites===2&&model.box[0]<0&&model.box[1]>1.3&&model.gripF===.14,JSON.stringify(model));
  check("swordFor(a Void weapon) picks it, not the holy stand-in",await page.evaluate(()=>{ const it=window.__dd.gear().weapon; return window.__weapons.state().key.split('|')[0]==='void'&&/of the Void$/.test(it.name); }));

  // the five-piece power: this wearer's Dazzling Halos lash what they dazzle (75% of a Storm Halo's blow); a Storm Halo is untouched; gone at three pieces
  const dz=await placeNear(page,'dazzle'); await page.evaluate(()=>{ window.__dd.setHero(window.__dd.hero.x+14,window.__dd.hero.z); window.__dd.step(1/60,1); }); const zp=await placeNear(page,'zap');
  check("a Dazzling Halo and, well apart, a Storm Halo placed for the test",!!dz&&!!zp&&dz.kind==='dazzle'&&zp.kind==='zap'&&Math.hypot(dz.x-zp.x,dz.z-zp.z)>9,JSON.stringify({dz,zp}));
  const z5=await dmgOf(page,zp.i);
  check("the Storm Halo's own damage is the plain formula, untouched by the set",z5.got===z5.base,JSON.stringify(z5));
  check("the Dazzling Halo itself still has no damage of its own",await page.evaluate(()=>window.__dd.DEFS.dazzle.dmg===undefined));
  const lash=await page.evaluate(i=>{ const d=window.__dd, def=d.defs[i]; const e=d.spawn('goblin','N'); e.x=def.x+1; e.z=def.z; e.y=0; e.hp=500; e.max=500; e.spd=0; e.dmg=0; const hp0=e.hp; const pulses0=window.__voidset.pulses(); d.step(1/60,120); return {lost:Math.round((hp0-e.hp)*10)/10,per:window.__voidset.lashDmg(def,.75),cd:window.__voidset.lashCd(def),pulsed:window.__voidset.pulses()>pulses0||d.S.t>0}; },dz.i);
  check("full set: a goblin standing in the dazzle ring is lashed for 75% of a Storm Halo's blow, once or twice in two seconds",lash.per>=5&&(lash.lost===lash.per||lash.lost===Math.round(lash.per*2*10)/10),JSON.stringify(lash));
  await page.evaluate(()=>{ window.__meta.unequip('charm'); window.__meta.unequip('amulet'); window.__dd.step(1/60,2); });
  const quiet=await page.evaluate(()=>{ const d=window.__dd; const e=d.enemies.find(e=>!e.dead); const hp0=e.hp; d.step(1/60,150); return {lost:Math.round((hp0-e.hp)*10)/10,tier:window.__meta.sets.active().find(a=>a.name==='of the Void').tier}; });
  check("down to three pieces: the ring only dazzles again, no lash in two and a half seconds",quiet.lost===0&&quiet.tier===3,JSON.stringify(quiet));
  await page.evaluate(ids=>{ window.__meta.equip(ids[2]); window.__meta.equip(ids[3]); for(const e of window.__dd.enemies) if(!e.dead) window.__dd.kill(e); window.__dd.step(1/60,2); },worn.ids);

  // mana orbs: 25% more per orb
  const orb=await page.evaluate(()=>{ const d=window.__dd; d.setHero(500,500); for(const o of d.orbs) o.mesh.parent&&o.mesh.parent.remove(o.mesh); d.orbs.length=0; d.step(1/60,2); const m0=d.S.mana; const e=d.spawn('goblin','N'); e.x=d.hero.x+2; e.z=d.hero.z; e.y=0; d.kill(e); window.__autoMana=true; for(let i=0;i<240&&d.orbs.length;i++) d.step(1/60,1); window.__autoMana=false; const expect=Math.round(5*1.25*(1+d.heroStat('mana')/100)*d.heroMult('mana')*10)/10; return {gained:Math.round((d.S.mana-m0)*10)/10,expect,orbsLeft:d.orbs.length}; });
  check("one goblin orb is worth 5 × 1.25 (× this hero's mana stat and mult), picked up for real",orb.orbsLeft===0&&orb.gained===orb.expect&&orb.expect>=6.3,JSON.stringify(orb));
  await page.close();
}

// ==== B: co-op -- a guest's own full set powers the halos THAT GUEST owns, on the host's sim ====
if(!PeerServer) console.log("SKIP section B (co-op): the `peer` package isn't installed");
else {
  const sigPort=9469; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>sig.on('connection',()=>{})&&setTimeout(r,300)); const peerOpts={host:"127.0.0.1",port:sigPort,path:"/peerjs"};
  const hostCtx=await browser.newContext(), guestCtx=await browser.newContext(); const hostPage=await newPage(hostCtx), guestPage=await newPage(guestCtx);
  const rc="void-"+Math.random().toString(36).slice(2,8);
  const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  check("pair connects ("+rc+")",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
  const guestId=guestJoin.id;
  const gw=await wearVoid(guestPage);
  check("the guest wears the full Void set on its own page",gw.active.some(a=>a.name==='of the Void'&&a.tier===5));
  for(let i=0;i<12;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,2)); await guestPage.evaluate(()=>window.__dd.step(1/60,2)); await sleep(30); }   // the guest's input (with its kind map) reaches the host
  check("the host now knows this guest's halo power",await hostPage.evaluate(id=>window.__meta.defOwnerKind(id,'dazzle')===.75&&window.__meta.defOwnerKind(id,'zap')===0,guestId));
  const own=await placeNear(hostPage,'dazzle'); await hostPage.evaluate(()=>{ window.__dd.setHero(window.__dd.hero.x+14,window.__dd.hero.z); window.__dd.step(1/60,1); }); const theirs=await placeNear(hostPage,'dazzle');
  await hostPage.evaluate(({i,id})=>{ window.__dd.defs[i].ownerId=id; },{i:theirs.i,id:guestId});   // the second halo is the guest's (the same tag hostTryPlaceDef sets on a real guest placement)
  const pair=await hostPage.evaluate(({a,b,id})=>{ const d=window.__dd; const A=d.defs[a], B=d.defs[b]; const mk=def=>{ const e=d.spawn('goblin','N'); e.x=def.x+1; e.z=def.z; e.y=0; e.hp=500; e.max=500; e.spd=0; e.dmg=0; return e; }; const ea=mk(A), eb=mk(B); d.step(1/60,120);
    const tow=window.__meta.defOwnerStat(id,'tow'), tm=window.__meta.defOwnerMult(id,'tow'); return {apart:+Math.hypot(A.x-B.x,A.z-B.z).toFixed(1),hostLost:Math.round((500-ea.hp)*10)/10,guestLost:Math.round((500-eb.hp)*10)/10,per:window.__voidset.lashDmg(B,.75),guestTow:tow,guestTowMult:tm}; },{a:own.i,b:theirs.i,id:guestId});
  check("the host's own halo (host wears nothing): only dazzles, no lash",pair.apart>9&&pair.hostLost===0,JSON.stringify(pair));
  check("the guest's halo on the same sim: that guest's full set lashes, on the guest's own tow numbers",pair.guestLost>0&&(pair.guestLost===pair.per||pair.guestLost===Math.round(pair.per*2*10)/10)&&pair.guestTow>0,JSON.stringify(pair));
  await hostCtx.close(); await guestCtx.close(); sig.close?.();
}

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
