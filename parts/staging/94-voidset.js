// ===== THE VOID SET, FLESHED OUT: its own blade, its five-piece power, and the door it opens in the hideout.
// 93-gearsets.js defines the set (drop rule, bonuses, Void Rift, the aura on the hero); this module gives it what it
// still borrowed. (1) The sword: the Void used to hold the holy blade tinted violet. It now has its own, built in code
// like the void staff and bow (82-staff.js, 83-bow.js): an obsidian blade with a violet fuller and runes, a horned iron
// guard, a wrapped grip and a floating crystal pommel, registered with the weapon mount as 'void' so it clones, fits
// and outlines like any other template (+Y is the blade axis, gripF where the fist closes). (2) The five-piece power on
// defenses: a full Void wearer's DAZZLING HALOS hit 75% harder -- pack.defKind, applied in stat(d,'dmg') for the
// defense's OWNER (the host by their worn sets; a co-op guest by the kind map their client reports, 99-network.js),
// so a friend's halos carry the friend's set, never the host's. (3) The unlock: the first time all five pieces are worn,
// a REWARD record (the hideout's contract: a dd_gear_carried record with reward:true and a reason) goes into the
// hideout's wall locker -- the Void armor stand -- and the game's own ledger 'dd_hideout_unlocks' remembers it was granted. The set's drop light (a violet column), sound and the hero's aura are 93's and unchanged.
(function(){
const VOID='of the Void';
// ---- the sword ----
function makeVoidSword(){ const g=new THREE.Group(); g.name='sword-void';
  const iron=mat(0x1a1226), dark=mat(0x0d0914), obsidian=mat(0x14101c,{emissive:C(0x2a1448),emissiveIntensity:.55}), band=mat(0x8a3cff,{emissive:C(0x5a2bd0),emissiveIntensity:.9}), violet=basic(0x9a30ff), pale=basic(0xd070ff);
  const pom=M(new THREE.OctahedronGeometry(.055,0),pale,0,.03,0); pom.userData.noOL=true; g.add(pom);   // the crystal that floats just under the grip
  const pg=glow(0x9a30ff,.32,.7); pg.position.y=.03; g.add(pg);
  g.add(M(G.cyl(.028,.032,.22,8),dark,0,.18,0)); for(const y of [.11,.18,.25]) g.add(M(G.cyl(.035,.035,.018,8),band,0,y,0));   // the wrapped grip, three bands
  g.add(M(G.box(.30,.035,.06),iron,0,.31,0));   // the guard, with two horns swept up and lit at the tips
  for(const s of [-1,1]){ const h=M(G.cone(.03,.16,6),iron,s*.16,.36,0); h.rotation.z=s*.9; g.add(h); const tip=M(G.sph(.018,6,5),violet,s*.215,.41,0); tip.userData.noOL=true; g.add(tip); }
  const sh=new THREE.Shape(); sh.moveTo(-.055,.33); sh.lineTo(.055,.33); sh.lineTo(.045,1.05); sh.lineTo(0,1.32); sh.lineTo(-.045,1.05); sh.closePath();   // the blade's outline, tapering to a point
  const blade=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.022,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:1}),obsidian); blade.position.z=-.011; g.add(blade);
  const ful=M(G.box(.014,.6,.03),violet,0,.7,0); ful.userData.noOL=true; g.add(ful);   // the fuller, lit
  for(let i=0;i<5;i++){ const r=M(G.box(.05,.02,.032),pale,0,.48+i*.13,0); r.userData.noOL=true; r.rotation.z=(i%2?.5:-.5); g.add(r); }   // runes up the fuller
  const eg=glow(0x8a3dff,.45,.35); eg.position.y=1.0; g.add(eg);
  g.userData.box=new THREE.Box3(new THREE.Vector3(-.22,-.03,-.06),new THREE.Vector3(.22,1.33,.06)); g.userData.gripF=.14; g.userData.proc=true; g.userData.kind='void';
  return g; }
window.__weapons.register('void',makeVoidSword);
// ---- the five-piece power on defenses ----
// pack.defKind maps a defense kind to a fraction. A halo with damage of its own gets it as a multiplier in stat(d,'dmg').
// The Dazzling Halo has none (it only confuses), so for it the same number is a LASH: while the full set is worn, every
// dazzle ring the wearer owns also hits everything it dazzles with void energy -- that fraction of a Storm Halo's blow,
// on a Storm Halo's own rhythm, scaled by mark and the owner's defense buffs exactly as a damage halo would be -- with a
// violet pulse each time it lands. The owner is the host by their worn sets, or a co-op guest by the kind map their
// client reports (99-network.js), so a friend's halos carry the friend's set, never the host's.
function fullPacks(){ return Meta.sets.active().filter(a=>a.tier>=5).map(a=>Meta.packs.get(a.name)).filter(Boolean); }
function defKindMap(){ const m={}; for(const p of fullPacks()) if(p.defKind) for(const k in p.defKind) m[k]=(m[k]||0)+p.defKind[k]; return m; }   // the wearer's own map, kind -> fraction
function defKindBonus(d){ if(d.ownerId&&Meta.defOwnerKind){ const v=Meta.defOwnerKind(d.ownerId,d.kind); if(v!==undefined) return v||0; } return defKindMap()[d.kind]||0; }
{ const prev=stat; stat=function(d,k){ const v=prev(d,k); if(k!=='dmg'||!DEFS[d.kind]||DEFS[d.kind].dmg===undefined) return v; const b=defKindBonus(d); return b?Math.max(1,Math.round(v*(1+b)*10)/10):v; }; }
Meta.defKindMap=defKindMap;
function ownerTow(d){ if(d.ownerId&&Meta.defOwnerStat){ const st=Meta.defOwnerStat(d.ownerId,'tow'); if(st!==undefined) return {s:st,m:Meta.defOwnerMult(d.ownerId,'tow')||1}; } return {s:heroStat('tow'),m:heroMult('tow')}; }
function lashDmg(d,frac){ const l=d.lvl||1, t=ownerTow(d); return Math.max(1,Math.round(DEFS.zap.dmg*frac*(1+.5*(l-1))*(1+t.s/100)*t.m*(1+(d.buff||0))*10)/10); }
function lashCd(d){ const l=d.lvl||1; return DEFS.zap.cd*Math.pow(.8,l-1); }
const PULSES=[];
function pulse(x,z,col){ const m=new THREE.Mesh(new THREE.RingGeometry(.6,1,32),new THREE.MeshBasicMaterial({color:C(col),transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})); m.rotation.x=-PI/2; m.position.set(x,.1,z); m.userData.noOL=true; scene.add(m); PULSES.push({m,t:0}); }
function lashTick(dt){
  for(const d of defs){ if(d.kind!=='dazzle'||DEFS.dazzle.dmg!==undefined) continue; const frac=defKindBonus(d); if(!frac){ d.lashT=0; continue; } d.lashT=(d.lashT||0)-dt; if(d.lashT>0) continue;
    const rr=stat(d,'range'), dmg=lashDmg(d,frac); let hit=0; for(const e of enemies){ if(e.dead||e.fly) continue; if(Math.hypot(e.x-d.x,e.z-d.z)<rr+e.r*.5){ hurt(e,dmg); hit++; } }
    if(hit){ d.lashT=lashCd(d); pulse(d.x,d.z,0x8a3dff); if(SFX.rift) SFX.rift(); } else d.lashT=.1; }
  for(let i=PULSES.length-1;i>=0;i--){ const p=PULSES[i]; p.t+=dt; const sc=1+p.t*7; p.m.scale.set(sc,sc,1); p.m.material.opacity=Math.max(0,.8-p.t*2.4); if(p.t>.4){ scene.remove(p.m); p.m.geometry.dispose(); p.m.material.dispose(); PULSES.splice(i,1); } } }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); lashTick(dt); }; }
// ---- the unlock: a REWARD in the hideout's wall locker ----
// The hideout (build 10+) keeps an Arcane Wardrobe, the physical home of dd_gear_carried, and its reward contract is
// simple: a reward is a normal dd_gear_carried record (id, name, slot, rarity 0..4, lvl, tier, stats, value, score,
// from:'dungeon-hold', carriedAt) with two extra fields -- reward:true (required) and reason (optional, shown under the
// item's name). Same append-only rules as the portal's trophies (59-hideout.js): read-modify-write, unique ids, the game
// never edits a record once written (the hideout adds rewardSeen:true when the locker is opened, and removes the record
// when the piece goes onto the shared display). On entry with an unseen reward the hideout shows its arcane banner and the
// wardrobe steams until the locker is opened. What the game grants for the first full wear of a set is pack.unlock -- the
// Void: its dressed armor stand (model named for the hideout's later use). Because a claimed reward LEAVES the carried
// list, the game keeps its own ledger of what it has granted (localStorage dd_hideout_unlocks, the game's alone: one entry
// per unlock id) so the same reward is never granted twice.
const UNLOCK_KEY='dd_hideout_unlocks', CARRY_KEY='dd_gear_carried';
function readUnlocks(){ let u=null; try{ u=JSON.parse(localStorage.getItem(UNLOCK_KEY)); }catch(e){} return (u&&typeof u==='object'&&!Array.isArray(u))?u:{}; }
function readCarried(){ let a=null; try{ a=JSON.parse(localStorage.getItem(CARRY_KEY)); }catch(e){} return Array.isArray(a)?a:[]; }
function rewardRecord(p,un){ return {id:'reward-'+un.id,name:un.name,slot:un.slot||'armor',rarity:un.rarity===undefined?4:un.rarity,tier:5,stats:{},value:0,score:0,set:p.name,model:un.model,from:'dungeon-hold',carriedAt:Date.now(),reward:true,reason:un.reason||('The set '+p.name+', complete')}; }
let lastVer=-1, announced={};
function checkUnlocks(){ for(const p of fullPacks()){ const un=p.unlock; if(!un) continue; const u=readUnlocks(); if(u[un.id]){ announced[un.id]=true; continue; }
    const rec=rewardRecord(p,un); const list=readCarried(); if(!list.some(r=>r&&r.id===rec.id)) list.push(rec); try{ localStorage.setItem(CARRY_KEY,JSON.stringify(list)); }catch(e){}
    u[un.id]={id:un.id,set:p.name,name:un.name,model:un.model,rewardId:rec.id,at:rec.carriedAt}; try{ localStorage.setItem(UNLOCK_KEY,JSON.stringify(u)); }catch(e){}
    if(!announced[un.id]){ announced[un.id]=true; toast(p.ic+' The set '+p.name+' is complete — a reward waits in the hideout\'s wall locker'); floatText(hero.x,hero.y+2.4,hero.z,un.name.toUpperCase()+' UNLOCKED',p.css); if(SFX.setBong) SFX.setBong(); } } }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); const v=Meta.version(); if(v!==lastVer){ lastVer=v; checkUnlocks(); } }; }
window.__voidset={sword:makeVoidSword,kindMap:defKindMap,kindBonus:defKindBonus,lashDmg,lashCd,pulses:()=>PULSES.length,unlocks:readUnlocks,carried:readCarried,rewardRecord,check:checkUnlocks,UNLOCK_KEY,CARRY_KEY};
})();
