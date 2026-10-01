// ===== THE MORTAR ROOMS WAKE (build 367, reworked in build 383). Matt, of the finale: "its not until this time that the walls near us start to glow, when we break the walls the mortar rolls out" -- and in build 383: "those mortar doors only have a very slight glow
// to them so only a very through player would check them. once the horde has taken out 3 of my defenses the glow becomes stronger with each defense that falls. no tool tip". THE DEEP PRISON only.
// The two rooms either side of the Heartroot (56g-prisonwalls.js: Bob's shackled walls over the sealed alcoves with the Hex Mortars) are LOCKED until the big barrier has fallen: no beacon, no light, and blows do nothing. When the cutscene of the barrier ends
// (56i hands over) they WAKE: unlocked, with a VERY SLIGHT glow (a faint, dim breath on the wall -- nothing tells the player, only one who looks will see it). Every defense the horde destroys counts (a tower taken out by a blow, a shot or a blast; a sale does not): the first two change
// nothing, from the THIRD the glow swells a little with each one lost, and at ten it is the big hot glow the rooms used to have at once. There is no card, no arrow, no pillar of light, no tip of any kind. The glow is 56g's, driven by window.__mortarGlow() (0..1).
// Breaking the first door plays the mortar show (95q-mortarshow.js). Not locked at all in Survival, in a co-op hall (no cutscene runs there), or once the seventh wave has begun without the wake (a safety). The dev panel (F9) has buttons to wake and lock them
// and to play the show. Test hook: window.__mortarwake.
(function(){
'use strict';
window.__mortarwake={ info:()=>null };
if(!MAP||MAP.id!=='prison') return;
const PW=window.__prisonwalls; if(!PW||!PW.raw) return;
const inCoop=()=>{ try{ return !!(window.__net&&window.__net.role&&window.__net.role()); }catch(er){ return false; } };
const AW={ awake:false, lost:0, wakes:0, peak:0 };
const policyLock=()=>!(SURVIVAL||inCoop()||S.wave>6);
const level=()=>Math.max(0,Math.min(1,(AW.lost-2)/8));   // 0 for the first two defenses lost, then an eighth more with each, full at ten
window.__mortarGlow=level;
// ---- every defense the horde takes out counts (hurtDef is where a tower dies to a blow, a shot, a splash, a stomp; selling a tower never goes through it)
{ const prev=hurtDef; hurtDef=function(d){ const had=!!d&&defs.includes(d); const r=prev.apply(this,arguments); if(had&&!defs.includes(d)&&!d.secret&&d.kind!=='perch'&&d.kind!=='pit'){ AW.lost++; AW.peak=Math.max(AW.peak,AW.lost); } return r; }; }
// ---- waking and locking
function wake(){ if(AW.awake) return false; AW.awake=true; AW.wakes++; for(const w of PW.raw()){ if(w.broken) continue; w.locked=false; w.awake=false; } return true; }
function lock(){ AW.awake=false; for(const w of PW.raw()){ if(!w.broken){ w.awake=false; w.locked=policyLock(); } } return true; }
let sawStart=false;
WORLDANIM.push(dt=>{
  if(S.phase==='start'){ if(!sawStart){ sawStart=true; AW.lost=0; } } else sawStart=false;
  const want=policyLock()&&!AW.awake; for(const w of PW.raw()){ if(w.broken) continue; w.locked=want; if(!AW.awake) w.awake=false; } });
setInterval(()=>{ const p=document.getElementById('devpanel'); if(!p||document.getElementById('dp-mortarwake')) return; const sec=document.createElement('div'); sec.className='sect'; sec.id='dp-mortarwake';
  sec.innerHTML='<label>the mortar rooms (they wake when the wall falls; the show plays at the first door)</label><div class="row"><button id="dp-mw-wake">🔓 Wake them</button><button id="dp-mw-lock">🔒 Lock them</button><button id="dp-mw-lose">💀 Lose a defense</button></div>'; const note=p.querySelector('.note'); if(note) p.insertBefore(sec,note); else p.appendChild(sec);
  document.getElementById('dp-mw-wake').onclick=()=>wake(); document.getElementById('dp-mw-lock').onclick=()=>lock(); document.getElementById('dp-mw-lose').onclick=()=>{ AW.lost++; }; },800);
window.__mortarwake={ wake, lock, lose:n=>{ AW.lost+=(n===undefined?1:n); }, glow:level, lost:()=>AW.lost,
  info:()=>({ awake:AW.awake, lost:AW.lost, glow:+level().toFixed(3), policy:policyLock(), wakes:AW.wakes, locked:PW.raw().map(w=>!!w.locked), awakeFlags:PW.raw().map(w=>!!w.awake), broken:PW.raw().map(w=>!!w.broken) }) };
})();
