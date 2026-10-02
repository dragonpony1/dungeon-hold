// ===== A TOWER KEEPS ITS BUILDER'S POWER (build 434). Matt: "so if you switch heros for build phase the tower should maintain the stats and bonuses of the hero that placed it" / "if i switch to the knight for the battle
// phase but my fighter puts down great towers, those towers need to maintain the stats and bonuses of the fighter".
// Before: every tower read the hero out NOW (game.js oStat/oMult -> heroStat/heroMult), so the Fighter's towers lost his tower gear the moment the Knight came out.
//  * Each tower remembers who placed it (d.heroId). The numbers each hero gives towers -- tower damage, rate, reach, cooldown, area, tower health, the full-set power per kind (94-voidset.js) -- are kept for every hero,
//    refreshed every frame while that hero is out and once more the instant before a switch (before 71-herogear.js swaps the gear).
//  * A tower whose placer is out reads the live numbers as before (so new gear shows at once); one whose placer is NOT out reads that hero's kept numbers.
//  * Talents on towers (the Knight's trap reload and hedge thorns, 96l-talents.js) go by the placer too. What a hero does in person (Vigil, auras, Mossheart) stays with whoever is out.
//  * Co-op: a guest's towers do the same -- the host keeps each guest's numbers per hero (99-network.js guestByHero) and reads the placer's.
// Test hook: window.__towerHero.
(function(){
'use strict';
const KS=['tow','trate','tarea'], KM=['tow','tcd','aoe','thp'];
const SNAP={};   // hero id -> { s:{k:v}, m:{k:v}, kind:{defKind:frac} }
const cnt={ kept:0, snaps:0, tagged:0 };
const cur=()=>window.__heroes?window.__heroes.pick():null;
function snap(){ const h=cur(); if(!h) return; const o={ s:{}, m:{}, kind:{} }; for(const k of KS) o.s[k]=heroStat(k); for(const k of KM) o.m[k]=heroMult(k);
  try{ o.kind=Object.assign({},Meta.defKindMap?Meta.defKindMap():{}); }catch(e){} SNAP[h]=o; cnt.snaps++; }
// a tower placed by a guest: that guest's numbers for the hero they had out when they placed it (when the host has them)
function guestVal(d,k,which){ if(!d.ownerHero) return undefined; const f=which==='s'?Meta.defOwnerHeroStat:which==='m'?Meta.defOwnerHeroMult:Meta.defOwnerHeroKind; if(!f) return undefined;
  const now=Meta.defOwnerHero?Meta.defOwnerHero(d.ownerId):null; if(!now||now===d.ownerHero) return undefined;   /* their placer is out: the live numbers; the guest gone: the host's own, as before (coop-defplace) */ return f(d.ownerId,d.ownerHero,k); }
// my own tower, placed by a hero not out now: that hero's kept numbers
function ownVal(d,k,which){ if(d.ownerId||!d.heroId) return undefined; const h=cur(); if(!h||h===d.heroId) return undefined; const o=SNAP[d.heroId]; if(!o) return undefined;
  const v=which==='kind'?(o.kind[k]||0):o[which][k]; return v; }
function kept(d,k,which){ if(!d) return undefined; const v=d.ownerId?guestVal(d,k,which):ownVal(d,k,which); if(v!==undefined) cnt.kept++; return v; }
{ const prev=oStat; oStat=function(d,k){ const v=kept(d,k,'s'); return v!==undefined?v:prev.apply(this,arguments); }; }
{ const prev=oMult; oMult=function(d,k){ const v=kept(d,k,'m'); return v!==undefined?v:prev.apply(this,arguments); }; }
// who placed it
{ const prev=placeDefAt; placeDefAt=function(kind,x,z,rot){ const d=prev.apply(this,arguments); if(d&&!d.heroId){ d.heroId=cur(); cnt.tagged++; } return d; }; }
// kept: every frame for the hero out, and the instant before a switch
{ const prev=installHero; installHero=function(h){ try{ snap(); }catch(e){} return prev.apply(this,arguments); }; }
let snapT=0; { const prev=Meta.update; Meta.update=dt=>{ prev(dt); snapT-=dt; if(snapT<=0){ snapT=.2; snap(); } }; }   /* five times a second is plenty: the switch itself snaps first */
snap();
window.__towerHero={ kind:d=>kept(d,d.kind,'kind'), snap, kept:id=>SNAP[id]?JSON.parse(JSON.stringify(SNAP[id])):null, info:()=>Object.assign({ heroes:Object.keys(SNAP) },cnt) };
})();
