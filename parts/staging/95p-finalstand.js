// ===== THE FINAL STAND (build 382). Matt, of THE DEEP PRISON's last wave (the seventh): "give wave 7 300 mobs all at once not trickling out. this is their final stand let them attack auras and all defenses, increase their attack damage and their
// health, THIS IS IT". THE DEEP PRISON only, the campaign's last wave only (never Survival).
//  * ALL AT ONCE: the wave's own trickle is replaced by 300 mobs -- 288 walkers and flyers (136 goblins, 68 orcs, 40 archers, 10 troll archers, 24 ogres, 10 drakes) and four siege carts (two fire, two keg, with their orcs) -- every one
//    of them out of the four breakouts inside three seconds (the east and west cells of the rim, the middle landing, the lower east), in a shuffled order.
//  * ALL DEFENSES: for the whole wave no defense is spared. The aura rings and the cage, which the horde walks through and never hurts (NOWALK_DEF, 96i-aurawear.js hurtDef), are ordinary towers for the length of it: walkers route round or smash them,
//    ranged mobs (the game's ranged targeting, game.js) shoot them, and their health goes down to blows. (A perch and a pit stay what they were.) Put back the moment the wave is over.
//  * STRONGER: every mob of the wave has HP_K (1.5) times the health it would have (on top of this map's doubling, 95o-prisonmobs.js) and DMG_K (1.8) times the damage. The three numbers (N, HP_K, DMG_K) are at the top.
// Test hook: window.__finalstand.
(function(){
'use strict';
window.__finalstand={ info:()=>null };
if(!MAP||MAP.id!=='prison') return;
const HP_K=1.5, DMG_K=1.8, SPREAD=2.6, T0=.4;
const MIX=[['goblin',136],['orc',68],['archer',40],['troll',10],['ogre',24],['drake',10]], TEAMS=['firecart','kegcart','firecart','kegcart'];
const LANE_CYCLE=['E','S','W','NE','ME','LW','E','S','E','S','W','NE','ME','LW'];   // the rim's two cells carry the most, the four feeders the rest (build 383: six gates)
const BOSSES=new Set(['corruptor','trollboss']);
const cnt={ built:0, begins:0, ends:0, boosted:0 };
const isFinal=w=>!SURVIVAL&&MAP.wbase!==undefined&&(w-MAP.wbase)===MAP.waves;
{ const prev=waveComp; waveComp=function(w){ const c=prev.apply(this,arguments); if(!isFinal(w)||!c||!Array.isArray(c.q)) return c;
    const kinds=[]; for(const [k,n] of MIX) for(let i=0;i<n;i++) kinds.push(k);
    for(let i=kinds.length-1;i>0;i--){ const j=(rnd()*(i+1))|0; const t=kinds[i]; kinds[i]=kinds[j]; kinds[j]=t; }
    for(const k of TEAMS) kinds.splice((rnd()*(kinds.length*.4+1))|0,0,k);   // the carts lead the flood
    const total=kinds.length, q=kinds.map((kind,i)=>({ t:+(T0+i*(SPREAD/total)).toFixed(3), kind, lane:LANE_CYCLE[i%LANE_CYCLE.length] }));
    cnt.built++; return Object.assign({},c,{ q, boss:false, desc:'☠ THE FINAL STAND · ×'+(total+TEAMS.length*2)+' — every gate at once' }); }; }
// ---- the stand itself: the aura rings and the cage lose their immunity for the wave
let on=false, saved=null;
const want=()=>!SURVIVAL&&MAP.waves&&S.phase==='wave'&&S.wave===MAP.waves;
function begin(){ window.__finalStand=true; saved=Object.assign({},NOWALK_DEF); for(const k of Object.keys(NOWALK_DEF)){ if(k!=='perch'&&k!=='pit'&&k!=='trap') delete NOWALK_DEF[k]; } reflow(); camShake=Math.max(camShake,.9); cnt.begins++; try{ const n=window.__net; if(n&&n.role&&n.role()==='host') n.send('bossFx',{k:'final'}); }catch(er){} }   /* co-op sweep 2026-10-02: the stand's shake on a guest too (99-network 'bossFx') */
function end(){ window.__finalStand=false; if(saved){ Object.assign(NOWALK_DEF,saved); saved=null; } reflow(); cnt.ends++; }
WORLDANIM.push(()=>{ const w=!!want(); if(w===on) return; on=w; if(w) begin(); else end(); });
// ---- stronger: every mob of the wave, once (the pusher orcs of a cart too: they are spawned inside the cart's own spawn)
{ const prev=spawnEnemy; spawnEnemy=function(){ const r=prev.apply(this,arguments); if(on){ for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(e.fsx) break; e.fsx=1; if(BOSSES.has(e.kind)) continue; e.hp=Math.round(e.hp*HP_K); e.max=Math.round(e.max*HP_K); e.dmg=Math.round(e.dmg*DMG_K); cnt.boosted++; } } return r; }; }
window.__finalstand={ info:()=>Object.assign({ on, HP_K, DMG_K, n:MIX.reduce((a,[,n])=>a+n,0)+TEAMS.length, spread:SPREAD },cnt), active:()=>on, isFinal, mix:()=>MIX.map(m=>m.slice()), teams:()=>TEAMS.slice() };
})();
