// ===== THE SAW BLADE GUNNER (build 597). Matt: "saw blade gunner (SPG) to replace ballistas everywhere" -- his dieselpunk turrets (Pictures\dungeon art,\defenses\saw blade gunner: tier 1 and 2
// animated by Bob, "MechanicalRig" 4 s, a Base > Pan > Tilt rig with twelve sparks at the blade; tiers 3 and 4 too) cut to 1024 px as parts/assets/sawgun-1..4.glb.
// It IS the ballista from now on -- the same tower ('harpoon' inside the game: its keys, cost, reach, damage, upgrades, the perch it may stand on), with a new body, a new name and a new shot:
//  * each gunner its OWN skeleton (cloneSkinned, as the Mouse Trap does -- a plain copy shares the template's bones and would sit at the map's origin);
//  * it turns WHOLE on its round base to aim (the game's yoke), and its barrel TILTS on Bob's Tilt joint at a flyer; Bob's own pan and tilt are taken out of the loop, his sparks stay;
//  * it fires a spinning SAW BLADE where the bolt flew.
// Test hook: window.__sawgun.
(function(){
'use strict';
if(typeof makeDef!=='function'||!DEFS.harpoon) return;
const K='harpoon', NAME='Saw Blade Gunner', STRIP=/^(Pan|Tilt|Base)\./;
DEFS[K].name=NAME;
{ const s=document.getElementById('slot-'+K); const n=s&&s.querySelector('.n'); if(n) n.textContent=NAME; }
const cnt={ built:0, mixers:0, blades:0 };
const skinned=T=>{ if(T.__skinned!==undefined) return T.__skinned; let s=false; T.wrap.traverse(o=>{ if(o.isSkinnedMesh) s=true; }); return (T.__skinned=s); };
// ---- the body: its own skeleton, faced forward, the barrel's Tilt joint answering the game's pitch
{ const prev=makeDef; makeDef=function(kind,ghost,lvl){ const g=prev.apply(this,arguments); if(kind!==K) return g; const T=g.userData&&g.userData.tpl; if(!T||!skinned(T)) return g;
    const yoke=g.userData.yoke; if(!yoke) return g; while(yoke.children.length) yoke.remove(yoke.children[0]);
    const hold=cloneSkinned(T.wrap); hold.rotation.y+=(typeof DEF_FACE!=='undefined'&&DEF_FACE[K])||0; yoke.add(hold);
    if(ghost) hold.traverse(m=>{ if(m.isMesh){ if(m.userData.isOL) m.visible=false; else m.material=GHOST_OK; } });
    const tilt=hold.getObjectByName('Tilt'); if(tilt){ const px=new THREE.Object3D(); px.name='pitch'; g.userData.pitch=px; g.userData.tilt=tilt; }   // game.js sets pitch.rotation.x = -pitch; the blade runs along -x, so up is -z turn of Tilt
    g.userData.saw=true; g.userData.hold=hold; if(!ghost) cnt.built++; return g; }; }
// ---- Bob's loop, sparks only
const CLIP=new Map();
function sparks(T){ if(CLIP.has(T)) return CLIP.get(T); const c=T&&T.clips&&T.clips[0]; let out=null; if(c){ out=c.clone(); out.tracks=out.tracks.filter(t=>!STRIP.test(t.name)); if(!out.tracks.length) out=null; } CLIP.set(T,out); return out; }
function tick(m,dt){ const u=m.userData; if(!u.saw) return; if(u.__mix===undefined){ const c=sparks(u.tpl); u.__mix=c?new THREE.AnimationMixer(u.hold||m):null; if(u.__mix){ const a=u.__mix.clipAction(c); a.play(); a.time=Math.random()*c.duration; cnt.mixers++; } }
  if(u.__mix) u.__mix.update(dt); if(u.tilt&&u.pitch) u.tilt.rotation.z=u.pitch.rotation.x; }
WORLDANIM.push(dt=>{ for(const d of defs){ if(d.kind===K&&d.mdl) tick(d.mdl,dt); } });
// a co-op guest's towers are the host's puppets: they play the loop too
window.__defFxGuest=window.__defFxGuest||{}; { const old=window.__defFxGuest[K]; window.__defFxGuest[K]=Object.assign({},old,{ tick:(p,dt)=>{ if(old&&old.tick) old.tick(p,dt); if(p.mdl) tick(p.mdl,dt); } }); }
// ---- the shot: a spinning saw blade (flies where the bolt flew; the game aims it along its own +z)
let BLADE=null;
function bladeGeo(){ if(BLADE) return BLADE; const sh=new THREE.Shape(), N=14, R=.58, r=.46; for(let i=0;i<N;i++){ const a0=i/N*TAU, a1=(i+.62)/N*TAU, a2=(i+1)/N*TAU; const p=(a,rr)=>[Math.cos(a)*rr,Math.sin(a)*rr]; if(i===0) sh.moveTo(...p(a0,r)); sh.lineTo(...p(a1,R)); sh.lineTo(...p(a2,r)); }
  const hole=new THREE.Path(); hole.absarc(0,0,.12,0,TAU,true); sh.holes.push(hole); const g=new THREE.ExtrudeGeometry(sh,{ depth:.05, bevelEnabled:false, curveSegments:6 }); g.translate(0,0,-.025); g.rotateY(PI/2); return (BLADE=g); }   // disc in the y-z plane: it stands upright along its flight, spinning about x
const bladeMat=()=>mat(0xb9c2cc);
// build 600 (Matt's projectiles: Picturesdungeon art,defensessaw blade gunnerMeshy_AI_projectile_t3_molten / _t4_tesla, cut to 512 px as parts/assets/sawblade-3/4.glb): a Mark III gunner
// fires the MOLTEN blade, Mark IV and up the TESLA blade; Marks I and II keep the plain steel one. Each model is turned so its face stands upright along the flight (its thin axis onto x, the axis it spins on).
const REAL={}, TURN={ 3:['z',-PI/2], 4:['y',PI/2] };   // the molten blade lies flat in its file (thin along y), the tesla one stands facing z
// build 602: asked for only once a gunner reaches Mark III / IV (loadorder-test: nothing jumps the first downloads)
const ASKED={}; function want(t){ if(ASKED[t]) return; ASKED[t]=true; fetchBytes(ASSET('sawblade-'+t+'.glb'),'first').then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{ const root=gltf.scene||gltf.scenes[0]; const sc=1.16/1.9; const inner=new THREE.Group(); inner.add(root); root.rotation[TURN[t][0]]=TURN[t][1]; inner.scale.setScalar(sc); toonify(root,sc); REAL[t]=inner; }catch(e){ console.warn('saw blade '+t,e); } },e=>console.warn('saw blade '+t,e))).catch(e=>console.warn('saw blade '+t,e)); }
WORLDANIM.push(()=>{ for(const d of defs){ if(d.kind===K&&(d.lvl||1)>=3){ want(3); if(d.lvl>=4) want(4); } } });
let TIER=1;   // the firing gunner's mark, set as it fires (fire is wrapped below)
{ const prev=fire; fire=function(d){ TIER=(d&&d.kind===K)?(d.lvl||1):1; try{ return prev.apply(this,arguments); } finally{ TIER=1; } }; }
harpoonMesh=function(){ const g=new THREE.Group(), spin=new THREE.Group(); const t=TIER>=4?4:TIER>=3?3:0; let face;
  if(t) want(t); if(t&&REAL[t]){ const c=REAL[t].clone(); spin.add(c); face=c; cnt.real=(cnt.real||0)+1; }
  else { const disc=new THREE.Mesh(bladeGeo(),bladeMat()); spin.add(disc); const hub=M(G.cyl(.15,.15,.09,10),mat(0xd8a040)); hub.rotation.z=PI/2; spin.add(hub); try{ outline(spin); }catch(e){} face=disc; }
  g.add(spin); let spun=false; face.traverse(o=>{ if(!spun&&o.isMesh){ spun=true; o.onBeforeRender=()=>{ spin.rotation.x-=.55; }; } }); g.userData.sawBlade=true; g.userData.bladeTier=t||1; cnt.blades++; return g; };
window.__sawgun={ name:NAME, mesh:t=>{ TIER=t; try{ return harpoonMesh(); } finally{ TIER=1; } }, tierBlade:t=>{ TIER=t; try{ const m=harpoonMesh(); return { tier:m.userData.bladeTier, real:!!REAL[t>=4?4:3] }; } finally{ TIER=1; } }, info:()=>Object.assign({},cnt), sparks:T=>{ const c=sparks(T); return c?c.tracks.length:0; } };
})();
