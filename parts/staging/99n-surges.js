// ===== SURGES (build 564). Matt: "Throughout the game surges work much better than trickling out mobs one at a time" / "Yes let's try a new rhythm and see if it's more challenging".
// The same mobs as before -- every wave keeps exactly what it had -- but the ordinary ones (goblins, orcs, archers, troll archers, ogres, drakes, dire wolves) no longer trickle out one
// at a time: they pour out of the open gates in SURGES, each one all out inside a second, with a lull between them to repair, upgrade and pick up loot. Early waves come in three
// surges, later ones in up to six (more mobs a surge, too, the deeper Survival goes). Each surge is announced: a rumble, a low horn, a little shake, dust at every gate it comes out of.
// Left as they were (my calls, flagged to Matt): EASY keeps the trickle; THE GNOME HALL's first wave stays the gentle on-ramp; every map's last campaign wave (the boss waves: the pigs,
// the Archhag, Sir Bullion, Avery, the final stand) and Survival's boss waves keep their own timing; and the wraiths, moths, carts, bosses and every scripted spawn keep their own times
// inside a wave -- only the seven ordinary kinds move. Loads after every other waveComp wrap (95r's extra mobs on Hard included), so it regroups the final list.
// Test hook: window.__surges.
(function(){
'use strict';
const COMMON=new Set(['goblin','orc','archer','troll','ogre','drake','direwolf']);
const POUR=1.0;   // seconds a surge takes to come out
const cnt={ waves:0, surges:0, cues:0, puffs:0 };
const LAST={};   // wave -> its surge times, from the waveComp call startWave just made
const diff=()=>{ try{ return window.__difficulty&&window.__difficulty.id?window.__difficulty.id():'normal'; }catch(e){ return 'normal'; } };
function skip(w,c){
  if(TUTORIAL||!MAP||!c||!Array.isArray(c.q)||!c.q.length||c.boss) return true;
  if(diff()==='easy') return true;
  const mw=w-(MAP.wbase|0), camp=!SURVIVAL||mw<=(MAP.waves|0);   // Survival's first MAP.waves waves are the campaign's exactly (survival-test)
  if(camp&&mw>=(MAP.waves|0)) return true;                            // a map's last wave: its boss's own timing
  if(camp&&mw<=1&&!(MAP.wbase|0)) return true;                        // the first map's first wave: the on-ramp
  if(window.__finalstand&&window.__finalstand.isFinal&&window.__finalstand.isFinal(w)) return true;
  return false; }
function surgeCount(w,n){ const mw=w-(MAP.wbase|0); const base=SURVIVAL&&mw>(MAP.waves|0)?Math.min(6,3+Math.floor(mw/4)):Math.min(6,3+Math.floor((mw-1)/2)); return Math.max(1,Math.min(base,Math.floor(n/4))); }
function regroup(w,c){
  const plain=c.q.filter(x=>COMMON.has(x.kind)); if(plain.length<4) return c;
  const ts=plain.map(x=>+x.t||0), t0=Math.min(...ts), t1=Math.max(...ts), span=Math.max(6,t1-t0);
  const S=surgeCount(w,plain.length); if(S<2) return c;
  plain.sort((a,b)=>(+a.t||0)-(+b.t||0));
  const groups=Array.from({ length:S },()=>[]); plain.forEach((x,i)=>groups[i%S].push(x));   // each surge a mix of the whole wave's kinds
  const out=c.q.filter(x=>!COMMON.has(x.kind));
  const at=[];
  groups.forEach((g,k)=>{ const T=t0+span*k/(S-1); at.push(+Math.max(0,T-.05).toFixed(3));
    g.forEach((x,i)=>out.push(Object.assign({},x,{ t:+(T+POUR*i/g.length).toFixed(3) }))); });
  out.sort((a,b)=>(+a.t||0)-(+b.t||0)); cnt.waves++; cnt.surges+=S; LAST[w]=at;
  return Object.assign({},c,{ q:out, surges:S, surgeAt:at }); }   // surgeAt: when each surge's cue sounds (kept out of q, so every count of the wave's mobs stays true)
{ const prev=waveComp; waveComp=function(w){ const c=prev.apply(this,arguments); return skip(w,c)?c:regroup(w,c); }; }

// ---- the cue: rumble, low horn, a little shake; dust at each gate the surge comes out of (puffed at its first mob)
let cueT=-1e9, puffed=new Set();
function cue(){ cueT=S.waveT; puffed=new Set(); cnt.cues++; camShake=Math.max(camShake,.35);
  try{ noise(.9,.09,140); beep(58,.8,'sawtooth',.05,-18); setTimeout(()=>{ try{ beep(147,.45,'sawtooth',.035,0); beep(220,.45,'sawtooth',.025,0); }catch(e){} },180); }catch(e){} }
const dust=[];
function puff(x,y,z){ cnt.puffs++; for(let i=0;i<6;i++){ const s=glow(0xd8c8a8,4+Math.random()*3,.001); s.position.set(x+(Math.random()-.5)*2.4,y+.4+Math.random()*1.6,z+(Math.random()-.5)*2.4); world.add(s); dust.push({ s, t:0, life:1.2+Math.random()*.8, vy:.5+Math.random()*.7, vx:(Math.random()-.5)*1.4, vz:(Math.random()-.5)*1.4 }); } }
WORLDANIM.push(dt=>{ for(let i=dust.length-1;i>=0;i--){ const d=dust[i]; d.t+=dt; const k=d.t/d.life; if(k>=1){ world.remove(d.s); dust.splice(i,1); continue; } d.s.position.x+=d.vx*dt; d.s.position.y+=d.vy*dt; d.s.position.z+=d.vz*dt; d.s.material.opacity=.45*Math.sin(Math.min(1,k*1.6)*PI)*(1-k*.4); d.s.scale.setScalar(d.s.scale.x+dt*2); } });
let due=[];
{ const prev=startWave; startWave=function(){ const w0=S.wave; for(const k in LAST) delete LAST[k]; const r=prev.apply(this,arguments); due=(S.phase==='wave'&&S.wave!==w0)?(LAST[effWave()]||[]).slice():[]; return r; }; }
WORLDANIM.push(()=>{ if(S.phase!=='wave'){ due=[]; return; } while(due.length&&S.waveT>=due[0]){ due.shift(); cue(); } });
{ const prev=spawnEnemy; spawnEnemy=function(kind,lane){
    const r=prev.apply(this,arguments);
    if(COMMON.has(kind)&&S.waveT-cueT<POUR+.5&&!puffed.has(lane)){ puffed.add(lane); const e=r&&r.x!==undefined?r:enemies[enemies.length-1]; if(e&&Number.isFinite(e.x)) try{ puff(e.x,e.y||0,e.z); }catch(er){} }
    return r; }; }
window.__surges={ info:()=>Object.assign({},cnt), due:()=>due.slice(), skip:(w)=>skip(w,waveComp(w)) };
})();
