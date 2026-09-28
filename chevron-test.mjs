// ===== build 177: towers climb to Mark VII, the marks past IV worn as GOLD CHEVRONS over the Mark IV model (game.js
// MAXLVL / CHEV_FROM / towerChevrons / upCost; 60-lootfeel.js's card; 99-network.js's puppets). Checks: the mark table,
// a ballista upgraded I..VII (costs climb, every stat grows, chevrons 0/1/2/3 at IV/V/VI/VII, VII refuses another),
// the armour floor, chevrons floating clear above each kind of model and turned to the camera, the model's growth capped
// at V, the card, a sold tower taking its chevrons with it -- and in co-op a guest seeing the host's chevrons, and a
// guest's upgrade at Mark VII refused through hostDefAction.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP chevron-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9719;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8819);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8819/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__defsync&&window.__feel,null,{timeout:60000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__dd.resetGear(); window.__dd.start(); window.__dd.step(1/60,30); });

// ---- the mark table ----
const mk=await hostPage.evaluate(()=>window.__dd.marks());
check("towers go to Mark VII: MAXLVL 7, roman names I..VII, chevrons from Mark V",mk.max===7&&mk.names.join(',')===',I,II,III,IV,V,VI,VII'&&mk.chevFrom===5,JSON.stringify(mk));

// ---- a ballista, Mark I to VII (room cells from the first map: row 12 is open floor, cx 11..21) ----
const up=await hostPage.evaluate(()=>{ const d=window.__dd; d.S.mana=100000; const t=d.place('harpoon',14,12,Math.PI); if(!t) return null; const pos={x:t.x,z:t.z,yaw:0};
  const snap=()=>{ d.step(1/60,20); return {lvl:t.lvl,dmg:d.stat(t,'dmg'),rate:+(1/d.stat(t,'cd')).toFixed(3),range:d.stat(t,'range'),hp:t.max,cost:t.lvl<d.marks().max?d.upCost(t):null,chev:d.chevrons(t),scale:+t.mdl.scale.x.toFixed(3),mana:d.S.mana}; };
  const rows=[snap()]; while(t.lvl<7){ const l=t.lvl; d.upgradeDef(pos); if(t.lvl===l) break; rows.push(snap()); }
  const m0=d.S.mana; d.upgradeDef(pos); d.step(1/60,2); const refused={lvl:t.lvl,spent:m0-d.S.mana,toast:document.getElementById('toast').textContent};
  return {rows,refused}; });
if(!up){ check("a ballista was placed",false); }
else {
  const R=up.rows, at=l=>R.find(r=>r.lvl===l)||{};
  console.log("  marks: "+R.map(r=>"Mk"+r.lvl+" dmg "+r.dmg+" rate "+r.rate+"/s range "+r.range+" hp "+r.hp+" chev "+r.chev+(r.cost!==null?" next "+r.cost:"")).join("\n         "));
  check("the ballista climbs I..VII one mark at a time",R.map(r=>r.lvl).join()==='1,2,3,4,5,6,7',R.map(r=>r.lvl).join());
  check("chevrons: none on Marks I-IV, then 1 / 2 / 3 on V / VI / VII",R.map(r=>r.chev).join()==='0,0,0,0,1,2,3',R.map(r=>r.chev).join());
  const costs=R.slice(0,-1).map(r=>r.cost);
  check("the upgrade cost keeps climbing: 100 200 300 400, then 750 and 1200 for the chevron marks",costs.join()==='100,200,300,400,750,1200',costs.join());
  check("each upgrade took exactly its cost from the mana",R.slice(1).every((r,i)=>Math.abs((R[i].mana-r.mana)-R[i].cost)<1e-6),R.map(r=>r.mana).join());
  const grows=k=>R.slice(1).every((r,i)=>r[k]>R[i][k]);
  check("every mark, VI and VII included, raises damage, rate of fire, range and health",grows('dmg')&&grows('rate')&&grows('range')&&grows('hp'),JSON.stringify(R.map(r=>[r.dmg,r.rate,r.range,r.hp])));
  check("the model's growth stops at Mark V (the chevrons carry the rest) -- VI and VII stand the size of V",at(5).scale>at(4).scale&&at(6).scale===at(5).scale&&at(7).scale===at(5).scale,JSON.stringify(R.map(r=>r.scale)));
  check("Mark VII refuses another upgrade, spends nothing, and says so",up.refused.lvl===7&&up.refused.spent===0&&/Already Mark VII/.test(up.refused.toast),JSON.stringify(up.refused));
}

// ---- the armour: 8% a mark, capped, never under the floor ----
const arm=await hostPage.evaluate(()=>{ const h=window.__dd.towerHit; return {i:h({lvl:1},10),v:h({lvl:5},10),vii:h({lvl:7},10),x20:h({lvl:20},10),tiny:h({lvl:7},.1)}; });
check("tower armour: Mark VII takes 48% less than Mark I, a (hypothetical) Mark XX is capped at 60% less, and a hit never lands under 0.5",
  Math.abs(arm.i-6)<1e-9&&Math.abs(arm.vii-3.12)<1e-9&&Math.abs(arm.x20-2.4)<1e-9&&arm.tiny===.5,JSON.stringify(arm));

// ---- the chevrons float clear above every kind of model and face the camera ----
const float=await hostPage.evaluate(()=>{ const d=window.__dd, T=window.THREE; d.S.mana=100000; const out={};
  const spots={harpoon:[11,20],ball:[14,20],slice:[17,21],zap:[20,20],frost:[11,14],totem:[20,14]};
  for(const [k,[cx,cz]] of Object.entries(spots)){ const t=d.place(k,cx,cz,0); if(!t){ out[k]='not placed'; continue; } while(t.lvl<5){ const l=t.lvl; d.upgradeDef({x:t.x,z:t.z,yaw:0}); if(t.lvl===l) break; } }
  d.step(1/60,40); d.camera.updateMatrixWorld(true);
  for(const t of d.defs){ if(t.lvl!==5||out[t.kind]) continue; const g=t.chev; if(!g||g.parent!==t.mdl){ out[t.kind]={chev:false}; continue; }
    const au=t.mdl.userData.aura; t.mdl.remove(g); if(au) t.mdl.remove(au); t.mdl.updateMatrixWorld(true); const mb=new T.Box3().setFromObject(t.mdl); t.mdl.add(g); if(au) t.mdl.add(au);   /* a halo's faint 2.4-high light column (auraRing) is see-through: its chevron sits inside it, over the sigil */ t.mdl.updateMatrixWorld(true); const cb=new T.Box3().setFromObject(g);
    const q=new T.Quaternion(); g.getWorldQuaternion(q); const face=Math.abs(q.dot(d.camera.quaternion));
    out[t.kind]={modelTop:+mb.max.y.toFixed(2),chevBottom:+cb.min.y.toFixed(2),chevW:+(cb.max.x-cb.min.x).toFixed(2),face:+face.toFixed(4)}; }
  return out; });
const kinds=Object.keys(float);
check("a Mark V of each kind (ballista, trebuchet, cage, halo, frost spire, totem) wears its chevron clear above its own model",
  kinds.length===6&&kinds.every(k=>float[k].chevBottom>float[k].modelTop-.05),JSON.stringify(float));
check("…turned to face the camera, and small (well under a cell across)",kinds.every(k=>float[k].face>.999&&float[k].chevW<1.2),JSON.stringify(float));

// ---- the card: stand at the Mark VII, then at a Mark VI ----
const card=await hostPage.evaluate(()=>{ const d=window.__dd; const t7=d.defs.find(t=>t.lvl===7); d.setHero(t7.x,t7.z+2,Math.PI); d.step(1/60,5); d.Meta.hud(); const c7=window.__feel.defcard(), n7=document.querySelectorAll('#defcard .dc-n .dc-cv').length;
  const t6=d.defs.find(t=>t.kind==='zap'); const pos={x:t6.x,z:t6.z,yaw:0}; d.upgradeDef(pos); d.setHero(t6.x,t6.z+1.5,Math.PI); d.step(1/60,5); d.Meta.hud(); const c6=window.__feel.defcard(), n6=document.querySelectorAll('#defcard .dc-n .dc-cv').length, nUp=document.querySelectorAll('#defcard .dc-r .dc-cv').length;
  return {c7,n7,c6,n6,nUp,lvl6:t6.lvl}; });
check("the card on a Mark VII: 'Mark VII', three gold chevrons, and 'the top mark' in place of an upgrade",/Mark VII/.test(card.c7)&&card.n7===3&&/the top mark/.test(card.c7),JSON.stringify({c7:card.c7,n7:card.n7}));
check("the card on a Mark VI: 'Mark VI', two chevrons, and what the next upgrade gives (1200 mana → Mk VII, three chevrons, more damage)",card.lvl6===6&&/Mark VI/.test(card.c6)&&card.n6===2&&card.nUp===3&&/1200 ◆ mana → Mk VII/.test(card.c6)&&/dmg /.test(card.c6),JSON.stringify(card));

// ---- sold: the chevrons go with it ----
const sold=await hostPage.evaluate(()=>{ const d=window.__dd; const count=()=>{ let n=0; d.scene.traverse(o=>{ if(o.name==='chevrons') n++; }); return n; }; const before=count(); const t=d.defs.find(t=>t.lvl===7); d.setHero(t.x,t.z+1,Math.PI); d.sell({x:t.x,z:t.z,yaw:0}); d.step(1/60,5); return {before,after:count()}; });
check("selling the Mark VII takes its three-chevron stack out of the scene with it",sold.after===sold.before-1,JSON.stringify(sold));

// ---- co-op: a guest sees the host's chevrons; a guest's upgrade at VII is refused by the host ----
await hostPage.evaluate(()=>{ const d=window.__dd; for(const t of d.defs.slice()) { d.setHero(t.x,t.z,0); d.sell({x:t.x,z:t.z,yaw:0}); } d.setHero(0,-25,0); d.step(1/60,5); });
async function tickBoth(batches=10,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); } }
const roomCode="chev-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
await tickBoth(6,5);
const gh=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestJoin.id);
// a ballista three steps in front of where the host tracks the guest standing, raised to Mark VI by the host
const hostDef=await hostPage.evaluate(g=>{ const d=window.__dd; d.S.mana=100000; const t=d.placeDefAt('harpoon',g.x,g.z+3,0); const pos={x:t.x,z:t.z,yaw:0}; while(t.lvl<6){ const l=t.lvl; d.upgradeDef(pos); if(t.lvl===l) break; } return {lvl:t.lvl,x:t.x,z:t.z}; },gh);
await tickBoth(12,5);
const pup6=await guestPage.evaluate(()=>{ const ids=window.__defsync.list(); return ids.length===1?window.__defsync.get(ids[0]):{ids}; });
check("the guest's puppet of the host's Mark VI ballista wears two chevrons",hostDef.lvl===6&&pup6.lvl===6&&pup6.chev===2,JSON.stringify({hostDef,pup6}));
await hostPage.evaluate(p=>{ window.__dd.upgradeDef({x:p.x,z:p.z,yaw:0}); },hostDef);
await tickBoth(12,5);
const pup7=await guestPage.evaluate(()=>{ const ids=window.__defsync.list(); return ids.length===1?window.__defsync.get(ids[0]):{ids}; });
check("the host takes it to Mark VII and the guest's puppet grows a third chevron",pup7.lvl===7&&pup7.chev===3,JSON.stringify(pup7));
const gMana0=await hostPage.evaluate(id=>window.__combat.guestMana(id),guestJoin.id);
await guestPage.evaluate(()=>{ window.__dd.upgrade(); });
await tickBoth(6,5);
const gRef=await hostPage.evaluate(id=>({lvl:window.__dd.defs[0].lvl,mana:window.__combat.guestMana(id)}),guestJoin.id);
const gToast=await guestPage.evaluate(()=>document.getElementById('toast').textContent);
check("a guest pressing upgrade at the Mark VII (through hostDefAction) is refused: still VII, nothing spent, told why",gRef.lvl===7&&gRef.mana===gMana0&&/Already Mark VII/.test(gToast),JSON.stringify({gh,gRef,gMana0,gToast}));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
