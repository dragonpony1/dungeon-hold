// ===== THE MOUSE TRAP (build 387). Matt: "the mouse trap doesn't take damage but it is slow and it kills everything caught in its rectangular footprint, low mana cost". A giant spring trap for the Gnome Knight (his fourth key): a long board
// three squares long and one wide (it turns a quarter at a time, like the perch), the horde walks straight over it (it is in nobody's way and no mob ever attacks it -- nothing hurts it), and while it is SET the first mob that steps on it springs it:
// the bar slams down and EVERY mob on the board dies -- a boss (the Corruptor, the troll boss, the pig bosses, the Cyclops, the Archhag) loses a quarter of its full health instead. Then it is SLOW: the bar creeps back up over its long reset
// (15 s, a fifth quicker each mark) and it does nothing until it is set again. Cheap: 25 mana, 2 defense units. Flyers pass over it. A procedural trap (board, spring, bar, a wedge of cheese) until Matt's model comes. Test hook: window.__mousetrap.
(function(){
'use strict';
if(TUTORIAL) return;
const K='trap', HALF_L=3.1, HALF_W=1.05, BOSS_K=.25;
const BOSSES=new Set(['corruptor','trollboss','pigflail','pigdagger','pigsling','cyclops','archhag']);
DEFS[K]={ name:'Mouse Trap', ic:'🪤', du:2, mana:25, hp:999999, top:.35, range:3, arc:360, cd:15, dmg:0 };
NOWALK_DEF[K]=1;   // walked straight over: nothing routes round it, stops to smash it or shoots at it
DEFKEYS.push(K); DEFKEY_LABELS.push('4');
{ const cfg=DEFS[K]; const s=document.createElement('div'); s.className='slot'; s.id='slot-'+K; s.innerHTML='<div class="k">4</div><div class="ic">'+cfg.ic+'</div><div class="n">'+cfg.name+'</div><div class="cst">🌱 '+cfg.du+' · '+cfg.mana+' ◆</div>';
  s.addEventListener('click',()=>select(K)); $('hotbar').appendChild(s); }
{ const kn=HEROES.find(h=>h.id==='knight'); if(kn&&!kn.unlocks.includes(K)) kn.unlocks.push(K); }
const QUARTER=PI/2, snapRot=r=>Math.round((r||0)/QUARTER)*QUARTER;
const axis=yaw=>[Math.cos(yaw),-Math.sin(yaw)];   // the board's long axis (local x, as the bramble hedge's)
// ---- its footprint: three cells along the board
{ const prev=footprintCells; footprintCells=function(kind,x,z,yaw){ if(kind!==K) return prev.apply(this,arguments); const [ax,az]=axis(snapRot(yaw)); const cells=[]; for(const s of [-2,0,2]){ const cx=wc(x+ax*s), cz=wcz(z+az*s); if(!inb(cx,cz)) continue; const i=idx(cx,cz); if(!cells.includes(i)) cells.push(i); } return cells; }; }
// ---- nothing hurts it
{ const prev=hurtDef; hurtDef=function(d){ if(d&&d.kind===K) return; return prev.apply(this,arguments); }; }
// ---- the model: a board, a spring, a hinged bar, the cheese
{ const prevMake=makeDef; makeDef=function(kind,ghost,lvl){ if(kind!==K) return prevMake.apply(this,arguments);
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
function spring(d){ cnt.springs++; d.snapT=0; d.cd=stat(d,'cd'); let n=0;
  for(const e of enemies){ if(e.dead||e.fly||!onBoard(d,e)) continue; if(BOSSES.has(e.kind)){ hurt(e,Math.max(1,Math.round(e.max*BOSS_K)),0,0); cnt.bossHits++; } else { e.hp=0; kill(e); cnt.kills++; n++; } }
  camShake=Math.max(camShake,.35); try{ SFX.thud&&SFX.thud(); SFX.hit&&SFX.hit(); }catch(er){} const fl=baseFloor(d.x,d.z); const g=glow(0xf2e0b0,4,.8); g.position.set(d.x,fl+.6,d.z); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); if(typeof shockRing==='function') shockRing(d.x,fl,d.z,3.2);
  if(n>1) floatText(d.x,fl+2,d.z,'×'+n,'#ffe08a'); return n; }
// ---- every frame: a set trap springs on the first mob on its board; a sprung one creeps back up over its reset
{ const prev=updateDefs; updateDefs=function(dt){ prev.apply(this,arguments); for(const d of defs){ if(d.kind!==K) continue; if(d.cd<=0&&enemies.some(e=>!e.dead&&!e.fly&&onBoard(d,e))) spring(d);
      const bar=d.mdl&&d.mdl.userData.bar; if(!bar) continue; if(d.snapT>=0&&d.snapT<.12){ d.snapT+=dt; bar.rotation.z=OPEN*(1-Math.min(1,d.snapT/.12)); } else { if(d.snapT>=0) d.snapT=-1; const full=stat(d,'cd'), k=d.cd<=0?1:Math.max(0,1-d.cd/full); bar.rotation.z=OPEN*k; } } }; }
window.__mousetrap={ kind:K, info:()=>Object.assign({},cnt), onBoard, spring, BOSSES };
})();
