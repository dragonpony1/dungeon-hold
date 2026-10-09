// ===== THE ENGINEER'S KIT: the SKY PLATFORM and the GNOME TURRET (build 599). Matt (his engineer zip, Pictures\dungeon art,\Hero's\gnome engineer\zip packge engineer): "I think this has some
// stuff you were waiting for" -- the Sky Platform (a wide timber deck on braced legs, a mounting ring in its middle) and the Gnome Turret (an auto-crossbow on a walking frame), both cut to 1024 px
// (parts/assets/skyplat.glb, turret-1.glb). Planned with Matt: "put the sky cracker thing on a raised platform" / "the barricade and the turret are musts".
//  * SKY PLATFORM: a stand, like the Lookout Perch (96b-perch.js does the standing): mobs walk under it; aim a Sky Wrecker, a Saw Blade Gunner or a Gnome Turret at it and it goes up on its
//    deck (top 3); sell or lose the platform and the tower comes down with it. Two at a time (my call, as the perch). Costs 2 units and 40 mana.
//  * GNOME TURRET: an auto-crossbow that turns all the way round (360), short reach (13), a fast reload (0.5 s) and light bolts; it shoots flyers too. It may stand on a perch or a platform.
//    Its upgrades climb like every tower's (stat). One model for every mark until more come.
// Both are the Gnome Engineer's (99x-engineer.js). Test hook: window.__engkit.
(function(){
'use strict';
if(TUTORIAL) return;
const KP='skyplat', KT='turret', CAP=2;
function slot(k){ const cfg=DEFS[k]; const s=document.createElement('div'); s.className='slot'; s.id='slot-'+k; s.innerHTML='<div class="k">?</div><div class="ic">'+cfg.ic+'</div><div class="n">'+cfg.name+'</div><div class="cst">🌱 '+cfg.du+' · '+cfg.mana+' ◆</div>'; s.addEventListener('click',()=>select(k)); $('hotbar').appendChild(s); }
// ---------------------------------------------------------------- the SKY PLATFORM
DEFS[KP]={ name:'Sky Platform', ic:'🏗', du:2, mana:40, hp:999999, top:3.0 };
DEFKEYS.push(KP); DEFKEY_LABELS.push('?'); slot(KP); NOWALK_DEF[KP]=1;
DEF_H[KP]=3.0/.8;   // the deck sits at 0.8 of the model's height (a height map from above): the model stands 3.75 so the deck is at 3
let platAsked=false;
{ const prev=makeDef; makeDef=function(kind,ghost,lvl){ if(kind!==KP) return prev.apply(this,arguments); if(defTemplate(KP)) return prev.apply(this,arguments);
    if(!platAsked){ platAsked=true; fetchDefGLB(KP,ASSET('skyplat.glb'),0,'first'); }
    const g=new THREE.Group(), wood=mat(0x7a4f2c), dark=mat(0x4a3320); g.add(M(G.box(2.6,.25,2.6),wood,0,2.9,0)); for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]) g.add(M(G.box(.25,2.9,.25),dark,x,1.45,z));
    if(ghost){ g.traverse(m=>{ if(m.isMesh) m.material=GHOST_OK; }); } else { outline(g); g.add(blob(1.2)); } return g; }; }
const PLAT_TAKES=new Set(['sky','harpoon','turret']);
(window.__standSurf=window.__standSurf||[]).push((kind,x,z)=>{ if(!PLAT_TAKES.has(kind)) return null; const cx=wc(x), cz=wcz(z); if(!inb(cx,cz)) return null; const d=defAt[idx(cx,cz)]; return (d&&d.kind===KP)?{ x:d.x, z:d.z, y:d.base+DEFS[KP].top, key:d }:null; });
{ const prev=placeDefAt; placeDefAt=function(kind,x,z,rot){ if(kind===KP&&defs.filter(d=>d.kind===KP).length>=CAP) return null; return prev.apply(this,arguments); }; }   // the cap holds however it is placed (a co-op host placing for a guest too)
{ const prev=updateGhost; updateGhost=function(){ prev.apply(this,arguments); if(placing===KP&&ghostOk&&defs.filter(d=>d.kind===KP).length>=CAP){ ghostOk=false; ghostReason='Only '+CAP+' sky platforms at a time'; ghost.traverse(o=>{ if(o.isMesh) o.material=GHOST_BAD; }); } }; }
// ---------------------------------------------------------------- the GNOME TURRET
DEFS[KT]={ name:'Gnome Turret', ic:'🏹', du:3, mana:50, hp:120, top:2.0, range:13, rangeUp:1, arc:360, cd:.5, dmg:2 };
DEFKEYS.push(KT); DEFKEY_LABELS.push('?'); slot(KT);
DEF_H[KT]=2.2; DEF_FACE[KT]=PI/2;   // the crossbow points along -x in the file
fetchDefGLB(KT,ASSET('turret-1.glb'),0,'first');
{ const prev=makeDef; makeDef=function(kind,ghost,lvl){ if(kind!==KT||defTemplate(KT,lvl)) return prev.apply(this,arguments);
    const g=new THREE.Group(), y=new THREE.Group(), wood=mat(0x7a4f2c), metal=mat(0x8a8698); g.add(M(G.box(1.2,.3,1.2),wood,0,.15,0)); y.add(M(G.box(.5,.9,.5),wood,0,.75,0)); y.add(M(G.box(1.3,.12,.12),metal,0,1.3,.3)); y.add(M(G.box(.12,.12,.9),wood,0,1.3,.1)); g.add(y); g.userData.yoke=y;
    if(ghost){ g.traverse(m=>{ if(m.isMesh) m.material=GHOST_OK; }); } else { outline(g); g.add(blob(.8)); } return g; }; }
const cnt={ shots:0, hits:0 };
const BOLTS=[];
function boltMesh(){ const g=new THREE.Group(); const s=M(G.cyl(.035,.035,.8,6),mat(0x5a3a22)); s.rotation.x=PI/2; g.add(s); const t=M(G.cone(.07,.18,6),mat(0xc4ced9),0,0,.48); t.rotation.x=PI/2; g.add(t); const f=M(G.box(.02,.14,.16),mat(0xd8a040),0,0,-.36); g.add(f); return g; }
const muzzle=d=>({ x:d.x+Math.sin(d.yaw)*.7, y:(d.base||0)+1.45, z:d.z+Math.cos(d.yaw)*.7 });
function shoot(d,e,dmg,visualOnly){ const m=boltMesh(); const p=muzzle(d); m.position.set(p.x,p.y,p.z); scene.add(m); BOLTS.push({ m, e, dmg, src:d, t:0, vis:!!visualOnly }); cnt.shots++; try{ SFX.shoot?SFX.shoot():SFX.place&&SFX.place(); }catch(er){} }
function pick(d){ const range=stat(d,'range'); let best=null, bk=1e18; for(const e of enemies){ if(e.dead) continue; const dd=Math.hypot(e.x-d.x,e.z-d.z); if(dd>range+(e.r||.5)*.5||!los(d.x,d.z,e.x,e.z)) continue;
    const prog=(e.fly?flowFly:flowFree).dist[idx(wc(e.x),wcz(e.z))]; const k=(e.marked?-1e5:e.tgtDef===d?-5e4:0)+(prog>=0?prog:1e6+dd); if(k<bk){ bk=k; best=e; } } return best; }
{ const prev=updateDefs; updateDefs=function(dt){ prev.apply(this,arguments); for(const d of defs){ if(d.kind!==KT||d.dead||!d.mdl) continue; const e=pick(d); const y=d.mdl.userData.yoke;
    if(e){ const ty=Math.atan2(e.x-d.x,e.z-d.z); d.yaw=angLerp(d.yaw==null?d.rot:d.yaw,ty,1-Math.exp(-12*dt)); if(y) y.rotation.y=d.yaw-d.rot;
      if(d.cd<=0&&Math.abs(angDiff(d.yaw,ty))<.3){ shoot(d,e,stat(d,'dmg')); d.cd=stat(d,'cd'); d.recoil=1; try{ Meta.onDefFx(d,KT,{ t:e.__coopId||0 }); }catch(er){} } } } }; }
WORLDANIM.push(dt=>{ for(let i=BOLTS.length-1;i>=0;i--){ const b=BOLTS[i]; b.t+=dt; const e=b.e, live=e&&!e.dead; const tx=live?e.x:b.tx, tz=live?e.z:b.tz, ty=live?(e.y||0)+(e.h||1.2)*.55:b.ty; if(tx==null){ scene.remove(b.m); BOLTS.splice(i,1); continue; } b.tx=tx; b.tz=tz; b.ty=ty;
    const p=b.m.position, dx=tx-p.x, dy=ty-p.y, dz=tz-p.z, dd=Math.hypot(dx,dy,dz), step=38*dt;
    if(dd<=step+.35||b.t>1.4){ if(live&&!b.vis&&dd<=step+.35+(e.r||.5)){ DMGSRC=b.src||null; hurt(e,b.dmg,dx/(dd||1)*.6,dz/(dd||1)*.6); DMGSRC=null; cnt.hits++; } scene.remove(b.m); BOLTS.splice(i,1); continue; }
    p.x+=dx/dd*step; p.y+=dy/dd*step; p.z+=dz/dd*step; b.m.lookAt(tx,ty,tz); } });
// a co-op guest's towers are the host's puppets: they play the host's shots (no damage on a guest's page)
window.__defFxGuest=window.__defFxGuest||{}; window.__defFxGuest[KT]={ fx:(p,fx,arg,mob)=>{ if(fx!==KT||!arg) return; const e=arg.t&&mob(arg.t); if(!e) return; const pd={ x:p.x, z:p.z, base:p.y||0, yaw:Math.atan2(e.x-p.x,e.z-p.z) }; shoot(pd,e,0,true); } };
window.__engkit={ info:()=>Object.assign({ bolts:BOLTS.length, plats:defs.filter(d=>d.kind===KP).length, turrets:defs.filter(d=>d.kind===KT).length },cnt), CAP };
})();
