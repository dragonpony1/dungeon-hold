// ===== THE MOUSE TRAP (build 387). Matt: "the mouse trap doesn't take damage but it is slow and it kills everything caught in its rectangular footprint, low mana cost". A giant spring trap for the Gnome Knight (his fourth key): a long board
// three squares long and one wide (it turns a quarter at a time, like the perch), the horde walks straight over it (it is in nobody's way and no mob ever attacks it -- nothing hurts it), and while it is SET the first mob that steps on it springs it:
// the bar slams down and EVERY mob on the board dies -- a boss (the Corruptor, the troll boss, the pig bosses, the Cyclops, the Archhag) loses a quarter of its full health instead. Then it is SLOW: the bar creeps back up over its long reset
// (15 s, a fifth quicker each mark) and it does nothing until it is set again. Cheap: 25 mana, 2 defense units. Flyers pass over it. Build 394: Matt's four animated traps (Picturesdungeon art,defensesIron trapanimated traphi3d-mouse-trap-t1..t4-2k-pbr_2.glb, cut to 1024 px textures: parts/assets/trap-1..4.glb) are Marks I..IV.
// Each is a rigged iron trap (Jaw, Trigger, Base) near-square, with its own clips: Armed (set, waiting), Snap_Shut, Closed, Reset, Arm. It is fitted 5.6 across and claims a 3 x 3 square of cells; the kill zone is its base.
// It plays them in step with the trap: Armed while set, Snap_Shut the instant it springs, Closed while it reloads, Reset over the last 4 s of the reload, then Arm over the last 3 s of the 5 s wait. The procedural trap (board, spring, bar, cheese)
// stays only as the stand-in while the model is still downloading. Test hook: window.__mousetrap.
(function(){
'use strict';
if(TUTORIAL) return;
const K='trap', HALF_L=2.8, HALF_W=2.45, BOSS_K=.25, ARM_WAIT=5;   // ARM_WAIT (build 391, Matt: "once the mouse trap resets make it wait 5 seconds"): its bar back up, it waits five more seconds before it can spring again -- then a click and a glint: set
const BOSSES=new Set(['corruptor','trollboss','pigflail','pigdagger','pigsling','cyclops','archhag','avery','bullion']);   /* build 529 prep: Sir Bullion (95v): a trap bites him, never kills him outright */
DEFS[K]={ name:'Mouse Trap', ic:'🪤', du:2, mana:25, hp:999999, top:2.2, range:3, arc:360, cd:15, dmg:0 };
NOWALK_DEF[K]=1;
DEF_W[K]=5.6;   // build 394: Matt's model fitted by its width (5.6 along the board, 4.9 across, about 4 tall with the jaw open)
defMarks(K,'trap');   // walked straight over: nothing routes round it, stops to smash it or shoots at it
DEFKEYS.push(K); DEFKEY_LABELS.push('4');
{ const cfg=DEFS[K]; const s=document.createElement('div'); s.className='slot'; s.id='slot-'+K; s.innerHTML='<div class="k">4</div><div class="ic">'+cfg.ic+'</div><div class="n">'+cfg.name+'</div><div class="cst">🌱 '+cfg.du+' · '+cfg.mana+' ◆</div>';
  s.addEventListener('click',()=>select(K)); $('hotbar').appendChild(s); }
{ const kn=HEROES.find(h=>h.id==='knight'); if(kn&&!kn.unlocks.includes(K)) kn.unlocks.push(K); }
const QUARTER=PI/2, snapRot=r=>Math.round((r||0)/QUARTER)*QUARTER;
const axis=yaw=>[Math.cos(yaw),-Math.sin(yaw)];   // the board's long axis (local x, as the bramble hedge's)
// ---- its footprint: three cells along the board
{ const prev=footprintCells; footprintCells=function(kind,x,z,yaw){ if(kind!==K) return prev.apply(this,arguments); const [ax,az]=axis(snapRot(yaw)); const cells=[]; for(const s of [-2,0,2]) for(const t of [-2,0,2]){ const cx=wc(x+ax*s-az*t), cz=wcz(z+az*s+ax*t); if(!inb(cx,cz)) continue; const i=idx(cx,cz); if(!cells.includes(i)) cells.push(i); } return cells; }; }   /* build 394: a 3 x 3 square, Matt's model is near-square */
// ---- nothing hurts it
{ const prev=hurtDef; hurtDef=function(d){ if(d&&d.kind===K) return; return prev.apply(this,arguments); }; }
// ---- the model: a board, a spring, a hinged bar, the cheese
{ const prevMake=makeDef; makeDef=function(kind,ghost,lvl){ if(kind!==K) return prevMake.apply(this,arguments);
    const T=defTemplate(K,lvl); if(T){ const g=new THREE.Group(), hold=cloneSkinned(T.wrap); hold.name='trapHold'; g.add(hold); g.userData.glb=true; g.userData.tpl=T; g.userData.hold=hold;   /* rigged: each copy its own skeleton, so each trap snaps on its own */
      if(ghost){ g.traverse(m=>{ if(m.isMesh){ if(m.userData.isOL) m.visible=false; else m.material=GHOST_OK; } }); } else g.add(blob(2.6)); return g; }
    const g=new THREE.Group(), wood=mat(0xb07a44), dark=mat(0x5a3a22), steel=mat(0xb8c0c8), cheese=mat(0xf2c24a);
    g.add(M(G.box(6.2,.22,1.9),wood,0,.11,0)); for(const sx of [-1,1]) g.add(M(G.box(6.2,.06,.08),dark,0,.23,sx*.88));
    const coil=M(new THREE.TorusGeometry(.32,.07,6,14),steel,-.4,.34,0); coil.rotation.y=PI/2; g.add(coil);
    const hinge=new THREE.Group(); hinge.name='trapBar'; hinge.position.set(-.4,.34,0); g.add(hinge);   // the bar swings about the board's middle, over to the far end
    const bar=new THREE.Group(); for(const sz of [-.85,.85]) bar.add(M(G.box(2.9,.09,.09),steel,1.45,0,sz)); bar.add(M(G.box(.09,.09,1.79),steel,2.9,0,0)); hinge.add(bar);
    const ch=M(G.cone(.45,.5,3),cheese,2.2,.42,0); ch.rotation.z=PI/2; g.add(ch); g.add(M(G.box(.5,.08,.35),steel,2.2,.27,0));
    if(ghost){ g.traverse(m=>{ if(m.isMesh) m.material=GHOST_OK; }); } else { outline(g); g.add(blob(1.6)); } g.userData.bar=hinge; return g; }; }
// the bar's angle: open (laid back over the near end, set) at PI*.92, shut (down over the far end, sprung) at 0
const OPEN=PI*.92;
{ const prevGhost=updateGhost; updateGhost=function(){ prevGhost.apply(this,arguments); if(placing===K&&ghost) ghost.rotation.y=snapRot(ghost.rotation.y); }; }
{ const prevPlace=placeDefAt; placeDefAt=function(kind,x,z,rot){ if(kind!==K) return prevPlace.apply(this,arguments); const d=prevPlace.call(this,kind,x,z,snapRot(rot)); if(d){ d.rot=d.yaw=snapRot(d.rot); d.mdl.rotation.y=d.rot; d.cd=0; d.snapT=-1; } return d; }; }
const cnt={ springs:0, kills:0, bossHits:0 };
const onBoard=(d,e)=>{ const [ax,az]=axis(d.rot), dx=e.x-d.x, dz=e.z-d.z, u=dx*ax+dz*az, v=-dx*az+dz*ax, r=(e.r||.5)*.6; return Math.abs(u)<=HALF_L+r&&Math.abs(v)<=HALF_W+r; };
function spring(d){ DMGSRC=d;   /* build 463: kills counted (00-killcount.js) */ cnt.springs++; d.snapT=0; d.cd=stat(d,'cd'); d.armT=ARM_WAIT; d.armed=false; let n=0;
  for(const e of enemies){ if(e.dead||e.fly||!onBoard(d,e)) continue; if(BOSSES.has(e.kind)){ hurt(e,Math.max(1,Math.round(e.max*BOSS_K)),0,0); cnt.bossHits++; } else { e.hp=0; kill(e); cnt.kills++; n++; } }
  camShake=Math.max(camShake,.35); try{ SFX.thud&&SFX.thud(); SFX.hit&&SFX.hit(); }catch(er){} const fl=baseFloor(d.x,d.z); const g=glow(0xf2e0b0,4,.8); g.position.set(d.x,fl+.6,d.z); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); if(typeof shockRing==='function') shockRing(d.x,fl,d.z,3.2);
  if(n>1) floatText(d.x,fl+2,d.z,'×'+n,'#ffe08a'); try{ Meta.onDefFx(d,'snap',{ cd:+d.cd.toFixed(2) }); }catch(er){} return n; }   // co-op sweep 2026-10-02: a guest's puppet snaps too (__defFxGuest below)
// ---- every frame: a set trap springs on the first mob on its board; a sprung one creeps back up over its reset
{ const prev=updateDefs; updateDefs=function(dt){ prev.apply(this,arguments); for(const d of defs){ if(d.kind!==K) continue; if(d.cd<=0&&d.armT>0){ d.armT-=dt; if(d.armT<=0){ d.armed=true; cnt.arms=(cnt.arms||0)+1; try{ SFX.hit&&SFX.hit(); }catch(er){} const g=glow(0xfff0b0,2.2,.9); g.position.set(d.x,(d.base||0)+1.2,d.z); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); try{ Meta.onDefFx(d,'arm'); }catch(er){} } }   /* reset, then the wait */
      if(d.cd<=0&&!(d.armT>0)&&enemies.some(e=>!e.dead&&!e.fly&&onBoard(d,e))) spring(d);
      const bar=d.mdl&&d.mdl.userData.bar; if(!bar) continue; if(d.snapT>=0&&d.snapT<.12){ d.snapT+=dt; bar.rotation.z=OPEN*(1-Math.min(1,d.snapT/.12)); } else { if(d.snapT>=0) d.snapT=-1; const full=stat(d,'cd'), k=d.cd<=0?1:Math.max(0,1-d.cd/full); bar.rotation.z=OPEN*k; } } }; }
// ---- Matt's model's clips, in step with the trap (build 394). Its size is held at its footprint (the core grows every defense 7% a mark).
const CLIP_RESET=4, CLIP_ARM=3;
function trapState(d){ if(d.snapT>=0&&d.snapT<.7) return 'Snap_Shut'; if(d.cd>CLIP_RESET) return 'Closed'; if(d.cd>0) return 'Reset'; if(d.armT>CLIP_ARM) return 'Reset'; if(d.armT>0) return 'Arm'; return 'Armed'; }
function trapAnim(d,dt,pup){ const hold=d.mdl.userData.hold, T=d.mdl.userData.tpl; if(!hold||!T) return;
    hold.scale.setScalar(1/markGrow(d.lvl));   /* co-op sweep 2026-10-02 (towers): a guest's puppet is mark-grown now too (99-network.js pupLook), so it is held back the same */
    if(d.snapT>=0){ d.snapT+=dt; if(d.snapT>=.7) d.snapT=-1; }   /* the snap clock (the stand-in counts it in its own bar code) */
    if(d.__mixMdl!==d.mdl){ d.__mixMdl=d.mdl; d.__mix=new THREE.AnimationMixer(hold); d.__acts={}; d.__clip=null; cnt.mixers=(cnt.mixers||0)+1;
      for(const c of T.clips||[]){ const a=d.__mix.clipAction(c); if(c.name!=='Armed'&&c.name!=='Closed'){ a.setLoop(THREE.LoopOnce,1); a.clampWhenFinished=true; } d.__acts[c.name]=a; } }
    const want=trapState(d); if(want!==d.__clip){ const a=d.__acts[want]; if(a){ const prev=d.__clip&&d.__acts[d.__clip]; a.reset(); if(want==='Reset') a.timeScale=Math.max(.5,a.getClip().duration/CLIP_RESET); if(want==='Arm') a.timeScale=Math.max(.5,a.getClip().duration/CLIP_ARM); a.play(); if(prev&&prev!==a) prev.stop(); } d.__clip=want; cnt.clips=(cnt.clips||0)+1; }
    d.__mix.update(dt); }
WORLDANIM.push(dt=>{ for(const d of defs){ if(d.kind!==K||!d.mdl) continue; trapAnim(d,dt,false); } });
// co-op sweep 2026-10-02: on a guest the trap is the host's puppet (99-network DEFPUP): the host says when it snaps (with its reload) and when it is set again; the puppet keeps the same clocks
// (cd, then the arm wait) and plays the same clips, with the snap's thud, shake, flash and ring and the set glint, as spring() and the arming give the host. The kills are the host's.
window.__defFxGuest=window.__defFxGuest||{}; window.__defFxGuest[K]={ tick:(p,dt)=>{ if(p.cd>0) p.cd=Math.max(0,p.cd-dt); else if(p.armT>0) p.armT=Math.max(0,p.armT-dt); if(p.mdl) trapAnim(p,dt,true); },
  fx:(p,fx,arg)=>{ if(fx==='snap'){ cnt.springs++; p.snapT=0; p.cd=Math.max(0,Math.min(120,+(arg&&arg.cd)||0)); p.armT=ARM_WAIT; camShake=Math.max(camShake,.35); try{ SFX.thud&&SFX.thud(); SFX.hit&&SFX.hit(); }catch(er){} const fl=baseFloor(p.x,p.z); const g=glow(0xf2e0b0,4,.8); g.position.set(p.x,fl+.6,p.z); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); if(typeof shockRing==='function') shockRing(p.x,fl,p.z,3.2); }
    else if(fx==='arm'){ cnt.arms=(cnt.arms||0)+1; p.cd=0; p.armT=0; try{ SFX.hit&&SFX.hit(); }catch(er){} const g=glow(0xfff0b0,2.2,.9); g.position.set(p.x,(p.y||0)+1.2,p.z); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); } } };
window.__mousetrap={ kind:K, state:d=>trapState(d), info:()=>Object.assign({},cnt), onBoard, spring, BOSSES };
})();
