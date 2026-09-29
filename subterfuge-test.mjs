// ===== SUBTERFUGE (build 170): the eleventh named mythic, a bow (97-mythics.js NAMED, 86i-subterfuge.js, 83-bow.js fireArrow's hooks).
// Every shot is five lightning arrows fanned across 40°, each half the shot; the first mob each one hits throws chain lightning to
// up to 3 more (60%, 35%, 20% of that arrow's hit); a full draw's pierce carries to all five. The Troll draws it; the Knight holds
// the top sword and the Witch the top staff. A drop stands on the floor as the bow. In co-op a guest Troll's shot fans out on the
// host (hostGuestShot → window.__bow.fireArrow) and the host shows that guest its chains.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const server=await serve(8813);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];
async function open(ctx){ const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e))); await p.goto("http://127.0.0.1:8813/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__subterfuge&&window.__bow&&window.__net,null,{timeout:90000}); await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,20); }); return p; }
const P=await open(await browser.newContext());

// ---- the table entry, the card, the hands
const t=await P.evaluate(()=>{ const M=window.__mythic, N=M.NAMED.subterfuge; const it=M.normalize({tier:"named",named:"subterfuge"}), byName=M.normalize({tier:"named",name:"Subterfuge",slot:"weapon"});
  return {N:N&&{name:N.name,slot:N.slot,stats:N.stats,power:N.power},it:it&&{name:it.name,slot:it.slot,rarity:it.rarity,named:it.named,stats:it.stats,power:!!it.power,art:it.art||null,value:it.value},byName:byName&&byName.named,id:M.id({name:"Subterfuge"}),
    pool:Object.keys(M.NAMED).filter(k=>!M.NAMED[k].reward).length, inPool:Object.keys(M.NAMED).includes("subterfuge"), card:window.__meta&&window.__dd.Meta.packs?window.__dd.Meta.packs.artHtml(it):null,
    hands:{bow:window.__named.model(it,"bow"),sword:window.__named.model(it,"sword"),staff:window.__named.model(it,"staff")}}; });
check("Subterfuge is in the named table: a weapon with mythic stats and a power",!!(t.N&&t.N.slot==="weapon"&&t.N.stats.dmg>0&&/five|5/.test(t.N.power)),JSON.stringify(t.N));
check("it normalizes (from its id and from its name) to a rarity-5 named weapon with the table's stats",t.it&&t.it.name==="Subterfuge"&&t.it.rarity===5&&t.it.named==="subterfuge"&&t.it.stats.dmg===t.N.stats.dmg&&t.it.power&&t.byName==="subterfuge"&&t.id==="subterfuge",JSON.stringify(t));
check("it's in the named drop pool (eleven now) and its card shows Matt's picture (build 219: named/subterfuge.jpg, hideout build 38)",t.inPool&&t.pool===11&&/named\/subterfuge\.jpg$/.test(t.it.art||"")&&typeof t.card==="string"&&/<img/.test(t.card),JSON.stringify({pool:t.pool,art:t.it.art,card:t.card}));
check("the Troll's bow hand holds bow-subterfuge; the Knight holds the top sword (holy), a staff hand the top staff (staff-battle)",t.hands.bow==="bow-subterfuge"&&t.hands.sword==="holy"&&t.hands.staff==="staff-battle",JSON.stringify(t.hands));

// ---- the Troll wearing it
await P.evaluate(()=>window.__heroes.select("troll")); await P.waitForFunction(()=>/Ranger/.test(window.__dd.heroModel().label),null,{timeout:90000});
const eq=await P.evaluate(async()=>{ const it=window.__mythic.normalize({tier:"named",named:"subterfuge"}); window.__meta.giveItem(it); window.__meta.equip(it.id);
  for(let i=0;i<200;i++){ window.__dd.step(1/60,1); const s=window.__weapons.state(); if(s.mounted&&/^bow-subterfuge/.test(s.key)&&window.__aim.kind()==="bow") break; await new Promise(r=>setTimeout(r,25)); }
  const wo=window.__weapons.mounted(); let sparks=0; if(wo) wo.traverse(o=>{ if(/^spark\d/.test(o.name)) sparks++; }); return {key:window.__weapons.state().key,kind:window.__aim.kind(),has:window.__mythic.has("subterfuge"),sparks,nocked:!!(wo&&wo.getObjectByName("nocked")&&(wo.getObjectByName("nocked").getObjectByName("zc0")||wo.getObjectByName("nocked").getObjectByName("subArrow")))}; });
check("the Troll wearing it mounts the Subterfuge bow (sparks on the limbs, an arrow on the string: the lightning stand-in or Matt's real one)",/^bow-subterfuge/.test(eq.key)&&eq.kind==="bow"&&eq.has&&eq.sparks>=6&&eq.nocked,JSON.stringify(eq));

const pack=()=>P.evaluate(()=>{ const d=window.__dd; d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; d.setHero(0,5,0); d.setCam(0,.42,4); d.step(1/60,5);
  for(const [x,z] of [[0,11.2],[-1.4,11.8],[1.4,11.6],[-2.8,12.2],[2.8,12.1],[-.7,13],[.8,13.2],[0,14.4],[-2,13.9],[2.1,14]]){ const e=d.spawn("goblin","N"); e.x=x; e.z=z; e.y=0; e.hp=e.max=9999; e.dmg=0; e.atk=999; e.holdT=1e9; e.__t=1; } d.step(1/60,5); });
// ---- a tap: five arrows, a 40° fan, half damage each
await pack();
const tap=await P.evaluate(()=>{ const d=window.__dd, S=window.__subterfuge; const hd=d.heroDmg(); const c0=S.chains(); d.swing(); let fl=[]; for(let i=0;i<120;i++){ d.step(1/60,1); fl=window.__bow.flying().filter(a=>a.kind==="subterfuge"); if(fl.length>=5) break; }
  const yaws=fl.map(a=>Math.atan2(a.dx,a.dz)); const spread=Math.max(...yaws)-Math.min(...yaws);
  for(let i=0;i<90;i++){ d.step(1/60,1); if(window.__bow.flying().length===0) break; } d.step(1/60,5);
  return {n:fl.length,dmg:fl.map(a=>a.dmg),pierce:fl.map(a=>a.pierce),spread:+(spread*180/Math.PI).toFixed(1),expect:Math.round(hd*.6*.5*10)/10,chains:S.chains()-c0,last:S.last(),hurt:d.enemies.filter(e=>e.__t&&e.hp<e.max).length,fx:S.fx()}; });
check("one tap looses FIVE lightning arrows",tap.n===5,JSON.stringify(tap));
check("...fanned across ~40° about the aim",Math.abs(tap.spread-40)<1.5,"spread "+tap.spread+"°");
check("...each half a tap arrow's damage (heroDmg × 0.6 × 0.5), none piercing",tap.dmg.every(v=>Math.abs(v-tap.expect)<=.11)&&tap.pierce.every(v=>v===0),JSON.stringify({dmg:tap.dmg,expect:tap.expect}));
const L=tap.last; const ratios=L?L.hits.map(h=>+(h/L.dmg).toFixed(2)):[];
check("an arrow's hit throws chain lightning: 3 more jumps for ~60% → 35% → 20% of that arrow's hit",tap.chains>=1&&L&&L.hits.length===3&&Math.abs(ratios[0]-.6)<.02&&Math.abs(ratios[1]-.35)<.02&&Math.abs(ratios[2]-.2)<.02,JSON.stringify({chains:tap.chains,last:L,ratios}));
check("...and bolts are drawn between them; more goblins are hurt than arrows fired",tap.fx>0&&tap.hurt>5,JSON.stringify({fx:tap.fx,hurt:tap.hurt}));
// build 214: Matt's Electric Arrow model (subterfuge-arrow.glb) takes over from the code-built bolt once it lands -- on the string and in the air
await pack();
const real=await P.evaluate(async()=>{ const d=window.__dd; for(let i=0;i<300&&!window.__subterfuge.arrowModel();i++){ d.step(1/60,1); await new Promise(r=>setTimeout(r,25)); } d.step(1/60,3);
  const n=window.__weapons.mounted()&&window.__weapons.mounted().getObjectByName("nocked"); const onString=!!(n&&n.getObjectByName("subArrow")), boltLeft=!!(n&&n.getObjectByName("zc0"));
  d.swing(); let fl=[]; for(let i=0;i<120;i++){ d.step(1/60,1); fl=window.__bow.flying().filter(a=>a.kind==="subterfuge"); if(fl.length>=5) break; } const parts=fl.map(a=>a.part);
  for(let i=0;i<90;i++){ d.step(1/60,1); if(window.__bow.flying().length===0) break; } return {loaded:window.__subterfuge.arrowModel(),onString,boltLeft,n:fl.length,parts}; });
check("once Matt's Electric Arrow model lands, it's the arrow on the string and all five in the air (the lightning bolt was only the stand-in)",real.loaded&&real.onString&&!real.boltLeft&&real.n===5&&real.parts.every(p=>p==="subArrow"),JSON.stringify(real));
// ---- a chain jumps only to mobs within reach: a lone goblin chains to nothing
const lone=await P.evaluate(()=>{ const d=window.__dd, S=window.__subterfuge; d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; const e=d.spawn("goblin","N"); e.x=0; e.z=12; e.y=0; e.hp=e.max=9999; e.dmg=0; e.atk=999; e.holdT=1e9; d.step(1/60,20);
  const c0=S.chains(); d.swing(); for(let i=0;i<150;i++){ d.step(1/60,1); if(S.chains()>c0&&window.__bow.flying().length===0) break; } return {chains:S.chains()-c0,last:S.last(),lost:+(e.max-e.hp).toFixed(1)}; });
check("a lone goblin: only the middle arrow finds it, and its chain has nowhere to jump (half a shot single-target)",lone.chains===1&&lone.last.hits.length===0&&Math.abs(lone.lost-lone.last.dmg)<.11,JSON.stringify(lone));
// ---- a full draw: all five pierce, at half a full draw each
await pack();
const full=await P.evaluate(()=>{ const d=window.__dd; const hd=d.heroDmg(); window.__aim.press(); d.step(1/60,50); const ch=window.__aim.charge(); window.__aim.release(); let fl=[]; for(let i=0;i<150;i++){ d.step(1/60,1); fl=window.__bow.flying().filter(a=>a.kind==="subterfuge"); if(fl.length>=5) break; }
  for(let i=0;i<120;i++){ d.step(1/60,1); if(window.__bow.flying().length===0) break; } return {ch,n:fl.length,dmg:fl.map(a=>a.dmg),pierce:fl.map(a=>a.pierce),expect:Math.round(hd*1.3*.5*10)/10,multi:d.enemies.filter(e=>e.__t).length}; });
check("a full draw: five arrows, each pierces (2 more mobs) at half a full-draw arrow",full.ch>=1&&full.n===5&&full.pierce.every(v=>v===2)&&full.dmg.every(v=>Math.abs(v-full.expect)<=.11),JSON.stringify(full));
// ---- the floor: it stands as the bow, in its blue column
const fl=await P.evaluate(()=>{ const d=window.__dd; d.loot.slice().forEach(l=>d.scene.remove(l.mesh)); d.loot.length=0; d.step(1/60,2); d.dropLoot(window.__mythic.normalize({tier:"named",named:"subterfuge"}),d.hero.x+3,d.hero.z,true); d.step(1/60,20); return window.__weaponStand.list(); });
check("a dropped Subterfuge stands on the floor as the bow (no card, placeholder hidden)",fl.length===1&&fl[0].name==="bow-subterfuge"&&fl[0].inScene&&!fl[0].card&&!fl[0].placeholder,JSON.stringify(fl));

// ---- co-op: a guest Troll wearing it fans out on the host, and sees its chains
let PeerServer; try{ ({PeerServer}=await import("peer")); }catch(e){ PeerServer=null; }
if(!PeerServer) console.log("SKIP co-op part — the `peer` package isn't installed");
else {
  const sig=PeerServer({port:9713,path:"/peerjs",host:"127.0.0.1"}); await new Promise(r=>setTimeout(r,300)); const peerOpts={host:"127.0.0.1",port:9713,path:"/peerjs"};
  const H=await open(await browser.newContext()), Gp=await open(await browser.newContext());
  const tickBoth=async(n)=>{ for(let b=0;b<n;b++){ for(let i=0;i<5;i++){ await H.evaluate(()=>window.__dd.step(1/60,1)); await Gp.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); } };
  const rc="subt-"+Math.random().toString(36).slice(2,8);
  const ho=await H.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const gj=await Gp.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  check("co-op: host and guest connect",ho.err===null&&gj.err===null,JSON.stringify({ho,gj}));
  await H.evaluate(()=>window.__dd.setHero(0,-25,0));
  await Gp.evaluate(()=>window.__heroes.select("troll"));
  await Gp.evaluate(async()=>{ const it=window.__mythic.normalize({tier:"named",named:"subterfuge"}); window.__meta.giveItem(it); window.__meta.equip(it.id); });
  for(let i=0;i<150;i++){ if(await Gp.evaluate(()=>window.__aim.kind()==="bow"&&/^bow-subterfuge/.test(window.__weapons.state().key))) break; await tickBoth(1); }
  await Gp.evaluate(()=>{ window.__dd.setHero(0,5,0); window.__dd.setCam(0,.42,4); }); await tickBoth(12);
  const worn=await H.evaluate(()=>window.__mythic.wearers());
  check("co-op: the guest Troll holds Subterfuge and the host knows it wears it",await Gp.evaluate(()=>/^bow-subterfuge/.test(window.__weapons.state().key))&&worn.some(w=>w.myth.includes("subterfuge")),JSON.stringify(worn));
  await H.evaluate(()=>{ const d=window.__dd; for(const [x,z] of [[0,11.2],[-1.4,11.8],[1.4,11.6],[-2.8,12.2],[2.8,12.1],[-.7,13],[.8,13.2]]){ const e=d.spawn("goblin","N"); e.x=x; e.z=z; e.y=0; e.hp=e.max=9999; e.dmg=0; e.atk=999; e.holdT=1e9; e.__t=1; } });
  await tickBoth(2);
  const gd0=await Gp.evaluate(()=>window.__subterfuge.drawn()), hc0=await H.evaluate(()=>window.__subterfuge.chains());
  await Gp.evaluate(()=>window.__dd.swing());
  let seen=null; for(let i=0;i<40&&!seen;i++){ await tickBoth(1); const f=await H.evaluate(()=>window.__bow.flying().filter(a=>a.kind==="subterfuge")); if(f.length>=5) seen=f; }
  check("co-op: the guest's one shot is FIVE Subterfuge arrows on the host, fanned ~40°, each half the guest's tap, owned by that guest",!!seen&&seen.length===5&&seen.every(a=>a.owner===gj.id)&&(()=>{ const y=seen.map(a=>Math.atan2(a.dx,a.dz)); return Math.abs((Math.max(...y)-Math.min(...y))*180/Math.PI-40)<1.5; })()&&new Set(seen.map(a=>a.dmg)).size===1,JSON.stringify(seen&&seen.map(a=>({dmg:a.dmg,dx:a.dx,dz:a.dz,owner:a.owner===gj.id}))));
  const gdmg=await Gp.evaluate(()=>Math.round(window.__dd.heroDmg()*.6*.5*10)/10);
  check("...each at half the guest's own tap damage",!!seen&&Math.abs(seen[0].dmg-gdmg)<=.11,JSON.stringify({host:seen&&seen[0].dmg,guest:gdmg}));
  await tickBoth(20);
  const hr=await H.evaluate(c0=>({chains:window.__subterfuge.chains()-c0,hurt:window.__dd.enemies.filter(e=>e.__t&&e.hp<e.max).length}),hc0), gd=await Gp.evaluate(()=>window.__subterfuge.drawn());
  check("co-op: the guest's arrows chain across the host's real goblins",hr.chains>=1&&hr.hurt>=5,JSON.stringify(hr));
  check("co-op: the guest's screen draws the chain lightning its arrows threw (powerFx 'chain')",gd>gd0,JSON.stringify({before:gd0,after:gd}));
  sig.close?.();
}
const lim=await P.evaluate(()=>{ const M=window.__meta, d=window.__dd; d.resetGear(); const mk=k=>{ const it=window.__mythic.normalize({tier:"named",named:k}); M.giveItem(it); return it; }; const a=mk("mossheart_aegis"), b=mk("bramblewhisk"), sub=mk("subterfuge"); M.equip(a.id); M.equip(b.id); const r=M.equip(sub.id); return {refused:r===false,stillInBag:M.bag().some(x=>x.id===sub.id),toast:document.getElementById("toast").textContent}; });
check("with two named mythics on, a third is refused and the message names them and says why (build 223)",lim.refused&&lim.stillInBag&&/Mossheart Aegis/.test(lim.toast)&&/Bramblewhisk/.test(lim.toast)&&/Take one off to wear Subterfuge/.test(lim.toast),JSON.stringify(lim));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
