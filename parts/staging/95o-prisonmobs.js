// ===== THE PRISON'S MOBS (build 367). Two things Matt asked for on THE DEEP PRISON only:
//  1. "ok we can get rid of the ogre sound for this map" -- the ogre's laugh (the 'roar' sample, assets/sfx-ogre-laugh.wav) is played whenever a mini-boss roars; here SFX.roar does nothing, so neither an ogre coming into view nor
//     the Corruptor's roar (56i's cutscene calls it too) plays it. (An ogre still plays its roar CLIP and shakes the screen; only the sound is gone.) The cutscene's music carries the moment.
//  2. "increase the health of all the mobs except the boss by 100%" -- every mob that comes out on this map (the gates' waves, the crowd behind the wall, the cart teams and their orcs) has DOUBLE the health the game would give it; the
//     Corruptor (the boss) keeps its own. Applied at the one place every mob comes from (spawnEnemy), marking each so it is only ever doubled once. The factor is one number (HP_X).
// Test hook: window.__prisonmobs.
(function(){
'use strict';
window.__prisonmobs={ info:()=>null };
if(!MAP||MAP.id!=='prison') return;
let HP_X=2; const BOSSES=new Set(['corruptor','trollboss']);
const cnt={ doubled:0, skipped:0 };
const QUIET=function(){}; SFX.roar=QUIET;   // the ogre laugh: gone on this map
function mark(){ for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(e.hpx) break; e.hpx=HP_X; if(BOSSES.has(e.kind)){ cnt.skipped++; continue; } e.hp=Math.round(e.hp*HP_X); e.max=Math.round(e.max*HP_X); cnt.doubled++; } }
{ const prev=spawnEnemy; spawnEnemy=function(){ const r=prev.apply(this,arguments); mark(); return r; }; }
window.__prisonmobs={ info:()=>Object.assign({ HP_X },cnt), setX:k=>{ HP_X=k; }, roarSilenced:()=>SFX.roar===QUIET };
})();
