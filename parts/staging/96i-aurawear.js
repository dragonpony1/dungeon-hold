// ===== AURAS WEAR ONLY BY USE (build 326). Matt: "mobs shouldnt really hit them for damage, auras i mean ... they can only degrade thru usage. a very small tik of health per attack they do but its
// very very small, a level 4 aura is basically not gonna take any damage" / "so mobs are walking thru them they dont stop and hit". The four halos (Storm, Venom, Ember, Dazzling):
//   * mobs walk straight through the ring (NOWALK_DEF, as they do the Mycelium Cage): nothing routes round one or stops to smash it, and no ranged mob picks one as a target
//   * nothing a mob does hurts one -- a blow, an arrow, a splash, a Cyclops stomp (hurtDef ignores them)
//   * each attack the ring makes (a zap, a burn, a dose of venom; the Dazzle's glare counts every 1.8 s it has someone in it) wears off a sliver: Mark I .25, II .1, III .03, IV and up .005 --
//     a Mark I Storm Halo (120 hp, a zap every 1.8 s) lasts most of a long wave's constant work; a Mark IV one, basically for ever
(function(){
'use strict';
const AURA=new Set(['zap','venom','ember','dazzle']);
for(const k of AURA) NOWALK_DEF[k]=1;
reflow();
const WEAR=[.25,.1,.03,.005];
const wearOf=d=>WEAR[Math.min(WEAR.length-1,Math.max(0,(d.lvl||1)-1))];
let WEARING=false, worn=0, blocked=0;
{ const prev=hurtDef; hurtDef=function(d,dmg){ if(d&&AURA.has(d.kind)&&!WEARING){ blocked++; return; } return prev.apply(this,arguments); }; }
function wear(d){ const w=wearOf(d); d.hp=Math.max(0,d.hp-w); worn+=w; if(d.hp<=0){ WEARING=true; try{ hurtDef(d,.001); }finally{ WEARING=false; } } }   // worn right out: the normal destroy path
{ const prev=updateDefs; updateDefs=function(dt){ const before=new Map(); for(const d of defs) if(AURA.has(d.kind)) before.set(d,d.cd);
    prev.apply(this,arguments);
    for(const [d,c0] of before){ if(!defs.includes(d)) continue;
      if(d.kind==='dazzle'){ const rr=stat(d,'range'); if(enemies.some(e=>!e.dead&&!e.fly&&Math.hypot(e.x-d.x,e.z-d.z)<rr+e.r*.5)){ d.glareT=(d.glareT||0)+dt; if(d.glareT>=1.8){ d.glareT=0; wear(d); } } }
      else if(d.cd>c0+1e-6&&!(d.curseT>0)) wear(d); } }; }   // its cooldown jumped back up: it just attacked (an Archhag's curse also holds the cooldown, and that is not an attack)
window.__aurawear={wearOf,worn:()=>worn,blocked:()=>blocked,kinds:[...AURA]};
})();
