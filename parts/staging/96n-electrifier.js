// ===== THE ELECTRIFIER (build 386). Matt: "electrifier incoming", then Bob's four animated Shocker Towers (Pictures\dungeon art,\defenses\electrifier\striker animated\hi3d-shocker-tower-t1..t4-2k-pbr_2.glb: a timber frame round a copper core,
// a coil and an electrode on top, each tier bigger, its own looping animation -- "Idle Charge Fire Cooldown", "Double Strike", "Chain Lightning", "Electrical Storm"). Textures cut to 1024 (parts/assets/shock-1..4.glb, 1.4-2.0 MB).
// A new tower for the Gnome Battle Witch (her fourth key). It throws LIGHTNING at what it can see within its reach -- ground or air -- the mob furthest along toward the Heartroot first, and each mark does what Bob's model for it shows:
//   Mark I    STRIKE          one bolt
//   Mark II   DOUBLE STRIKE   two bolts, at the two mobs furthest along
//   Mark III  CHAIN LIGHTNING one bolt that leaps on to three more mobs (each within 6 of the last), three quarters as hard each leap
//   Mark IV+  ELECTRICAL STORM a bolt at every mob in reach, six at most
// Its model plays its own animation all the time (the coil charging, arcs, the strike). Damage, reload and reach climb with the marks like every tower's (stat(), game.js). Test hook: window.__electrifier.
(function(){
'use strict';
if(TUTORIAL) return;
const K='shock';
DEFS[K]={ name:'Electrifier', ic:'🗲', du:4, mana:90,   /* build 387 (Matt: "sparky and pitfall max mana cost"): 75 -> 90, the most any defense costs */  hp:130, top:5.2, range:10, rangeUp:.6, arc:360, cd:2.2, dmg:9 };
DEF_H[K]=5.8;   // build 390 (Matt: "are you able to make sparky taller? like twice as tall"): 2.9 -> 5.8
 DEF_HITS_BACK[K]=1;
DEFKEYS.push(K); DEFKEY_LABELS.push('4');
{ const cfg=DEFS[K]; const s=document.createElement('div'); s.className='slot'; s.id='slot-'+K; s.innerHTML='<div class="k">4</div><div class="ic">'+cfg.ic+'</div><div class="n">'+cfg.name+'</div><div class="cst">🌱 '+cfg.du+' · '+cfg.mana+' ◆</div>';
  s.addEventListener('click',()=>select(K)); $('hotbar').appendChild(s); }
{ const w=HEROES.find(h=>h.id==='witch'); if(w&&!w.unlocks.includes(K)) w.unlocks.push(K); }
defMarks(K,'shock');
// until Bob's model lands: a plain coil tower
{ const prevMake=makeDef; makeDef=function(kind,ghost,lvl){ if(kind!==K||defTemplate(K,lvl)) return prevMake.apply(this,arguments);
    const g=new THREE.Group(), wood=mat(0x6b4a2a), cop=mat(0xb8682a), dark=mat(0x2b2540); g.add(M(G.cyl(.8,.95,.3,8),dark,0,.15,0)); g.add(M(G.cyl(.18,.3,2,8),wood,0,1.2,0)); const coil=M(new THREE.TorusGeometry(.55,.16,8,18),cop,0,2.3,0); coil.rotation.x=PI/2; g.add(coil); g.add(M(G.sph(.2,10,8),basic(0xbfe8ff),0,2.7,0));
    if(ghost){ g.traverse(m=>{ if(m.isMesh) m.material=GHOST_OK; }); } else { outline(g); g.add(blob(.9)); } return g; }; }
const cnt={ shots:0, bolts:0, chains:0, storms:0, doubles:0, mixers:0 };
const CHAIN_R=6, CHAIN_N=3, CHAIN_K=.75, STORM_MAX=6;
const tier=d=>Math.min(4,d.lvl||1);
// ---- the bolt: a jagged line, a bright core over a blue halo, a few glows along it, a flash where it lands; gone in a fifth of a second
const bolts=[]; const LM1=new THREE.LineBasicMaterial({ color:C(0xffffff), transparent:true, opacity:1, blending:THREE.AdditiveBlending, depthWrite:false }), LM2=new THREE.LineBasicMaterial({ color:C(0x6fc8ff), transparent:true, opacity:.9, blending:THREE.AdditiveBlending, depthWrite:false });
function bolt(a,b){ cnt.bolts++; const n=9, pts=[], pts2=[]; const dx=b.x-a.x, dy=b.y-a.y, dz=b.z-a.z, L=Math.hypot(dx,dy,dz)||1; for(let i=0;i<=n;i++){ const t=i/n, j=(i===0||i===n)?0:.55*Math.min(1,L/6); const ox=R(-j,j), oy=R(-j,j), oz=R(-j,j); pts.push(new THREE.Vector3(a.x+dx*t+ox,a.y+dy*t+oy,a.z+dz*t+oz)); pts2.push(new THREE.Vector3(a.x+dx*t+ox*1.4,a.y+dy*t+oy*1.4,a.z+dz*t+oz*1.4)); }
  const g=new THREE.Group(); const l1=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),LM1.clone()), l2=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2),LM2.clone()); l1.userData.noOL=l2.userData.noOL=true; g.add(l1,l2);
  for(let i=1;i<n;i+=2){ const s=glow(0x9fe0ff,.9,.85); s.position.copy(pts[i]); g.add(s); } const fl=glow(0xdff4ff,2.6,.95); fl.position.copy(b); g.add(fl); scene.add(g); bolts.push({ g, t:0, life:.22 }); }
const TOP=new THREE.Vector3(); function topOf(d){ return TOP.set(d.x,(d.base||0)+DEF_H[K]*.92*(d.mdl&&d.mdl.scale?d.mdl.scale.y:1),d.z); }
const chest=e=>new THREE.Vector3(e.x,(e.y||0)+(e.h||1.4)*.6,e.z);
// ---- whom it strikes: what it can see in its reach, the mob furthest along toward the Heartroot first (as the other towers choose)
function candidates(d){ const rr=stat(d,'range'), out=[]; for(const e of enemies){ if(e.dead) continue; const dd=Math.hypot(e.x-d.x,e.z-d.z); if(dd>rr+(e.r||.5)*.5) continue; if(!los(d.x,d.z,e.x,e.z)) continue; const prog=(e.fly?flowFly:flowFree).dist[idx(wc(e.x),wcz(e.z))]; out.push({ e, key:(e.marked?-1e5:e.tgtDef===d?-5e4:0)+(prog>=0?prog:1e6+dd) }); }
  out.sort((a,b)=>a.key-b.key); return out.map(o=>o.e); }
let ZAPS=null;   // co-op sweep 2026-10-02: [mob id, chained-from mob id] per bolt of the shot in progress, for a guest's screen
function strike(d,e,dmg,from){ bolt(from?chest(from):topOf(d).clone(),chest(e)); if(ZAPS) ZAPS.push([e.__coopId||0,from&&from.__coopId||0]); const p0=DMGSRC; DMGSRC=d; hurt(e,dmg,0,0); DMGSRC=p0; }   /* build 463: kills counted */
function shoot(d){ ZAPS=[]; try{ const r=shoot0(d); if(r) Meta.onDefFx(d,'zap',{s:ZAPS}); return r; } finally{ ZAPS=null; } }
function shoot0(d){ const list=candidates(d); if(!list.length) return false; const T=tier(d), dmg=stat(d,'dmg'); cnt.shots++; d.recoil=1; try{ SFX.zap?SFX.zap():SFX.hit(); }catch(er){}
  if(T===1) strike(d,list[0],dmg);
  else if(T===2){ cnt.doubles++; for(const e of list.slice(0,2)) strike(d,e,dmg); }
  else if(T===3){ let cur=list[0], k=dmg; strike(d,cur,k); const hit=new Set([cur]); for(let j=0;j<CHAIN_N;j++){ let nx=null, bd=CHAIN_R; for(const o of enemies){ if(o.dead||hit.has(o)) continue; const dd=Math.hypot(o.x-cur.x,o.z-cur.z); if(dd<bd){ bd=dd; nx=o; } } if(!nx) break; k=Math.max(1,Math.round(k*CHAIN_K*10)/10); strike(d,nx,k,cur); hit.add(nx); cur=nx; cnt.chains++; } }
  else { cnt.storms++; for(const e of list.slice(0,STORM_MAX)) strike(d,e,dmg); }
  return true; }
// ---- every frame: each Electrifier fires on its reload (the core's own tower loop counts its reload down: d.cd), and plays its model's animation
{ const prev=updateDefs; updateDefs=function(dt){ prev.apply(this,arguments); for(const d of defs){ if(d.kind!==K||d.dead) continue; if(d.cd<=0&&shoot(d)) d.cd=stat(d,'cd'); } }; }
function anim(d,dt){ const T=d.mdl.userData.tpl; if(T&&T.clips&&T.clips.length&&d.__mixMdl!==d.mdl){ d.__mixMdl=d.mdl; d.__mix=new THREE.AnimationMixer(d.mdl); const a=d.__mix.clipAction(T.clips[0]); a.play(); a.time=Math.random()*T.clips[0].duration; cnt.mixers++; } if(d.__mix) d.__mix.update(dt); }
// co-op sweep 2026-10-02: on a guest the towers are the host's puppets (99-network DEFPUP) -- they play Bob's loop and draw the host's bolts, tower to mob and mob to mob down a chain. No sound added:
// the host's own zap is SFX.hit, which the guest already plays when the mob's hp drops in the next list
window.__defFxGuest=window.__defFxGuest||{}; window.__defFxGuest[K]={ tick:(p,dt)=>{ if(p.mdl) anim(p,dt); }, fx:(p,fx,arg,mob)=>{ if(fx!=='zap'||!arg||!Array.isArray(arg.s)) return; const pd={ x:p.x, z:p.z, base:p.y||0, mdl:p.mdl }; cnt.shots++;
    for(const s of arg.s.slice(0,12)){ if(!Array.isArray(s)) continue; const e=s[0]&&mob(s[0]); if(!e) continue; const f=s[1]&&mob(s[1]); bolt(f?chest(f):topOf(pd).clone(),chest(e)); } } };
WORLDANIM.push(dt=>{
  for(const d of defs){ if(d.kind!==K||!d.mdl) continue; anim(d,dt); }
  for(let i=bolts.length-1;i>=0;i--){ const b=bolts[i]; b.t+=dt; const k=b.t/b.life; if(k>=1){ scene.remove(b.g); b.g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material) o.material.dispose(); }); bolts.splice(i,1); continue; } b.g.traverse(o=>{ if(o.material&&o.material.opacity!==undefined) o.material.opacity=(1-k)*(o.isSprite?.85:1); }); } });
window.__electrifier={ kind:K, info:()=>Object.assign({ live:bolts.length },cnt), candidates:d=>candidates(d).length, shoot };
})();
