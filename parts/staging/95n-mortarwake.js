// ===== THE MORTAR ROOMS WAKE (build 367, reworked in build 383). Matt, of the finale: "its not until this time that the walls near us start to glow, when we break the walls the mortar rolls out" -- and in build 383: "those mortar doors only have a very slight glow
// to them so only a very through player would check them. once the horde has taken out 3 of my defenses the glow becomes stronger with each defense that falls. no tool tip". THE DEEP PRISON only.
// The two rooms either side of the Heartroot (56g-prisonwalls.js: Bob's shackled walls over the sealed alcoves with the Hex Mortars) are LOCKED until the big barrier has fallen: no beacon, no light, and blows do nothing. When the cutscene of the barrier ends
// (56i hands over) they WAKE: unlocked, with a VERY SLIGHT glow (a faint, dim breath on the wall -- nothing tells the player, only one who looks will see it). Every defense the horde destroys counts (a tower taken out by a blow, a shot or a blast; a sale does not): the first two change
// nothing, from the THIRD the glow swells a little with each one lost, and at ten it is the big hot glow the rooms used to have at once. No pillar of light; the picture card and arrows came back in build 438 (below), at the first glow. The glow is 56g's, driven by window.__mortarGlow() (0..1).
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
// ---- THE PICTURE TIP, BACK (build 438, Matt: "we need the tool tip back that tells you to hit the back wall to get your mortar out" -- build 383 had taken it away with "no tool tip"). The card from builds 367-382, in pictures:
// a sword, an arrow, a wall breaking, an arrow, the Hex Mortar -- and a gold arrow for each unbroken room (over the room when it is on screen, at the screen's edge pointing to it when not). It comes once a run, the moment the rooms
// begin to glow (the third defense the horde takes out); it goes with Enter or when the first wall breaks. The faint-then-swelling glow of build 383 is unchanged; no pillars, no horn.
const TIP={ card:null, on:false, shown:false, arrows:new Map() };
function css(){ if(document.getElementById('mortarwakecss')) return; const st=document.createElement('style'); st.id='mortarwakecss';
  st.textContent='#mortarcard{position:fixed;left:50%;top:15%;transform:translateX(-50%);z-index:55;display:none;align-items:center;gap:clamp(8px,1.4vw,18px);padding:clamp(8px,1.4vh,16px) clamp(12px,1.8vw,26px);background:linear-gradient(#2a1a0ccc,#120a05dd);border:2px solid #e8b94a;border-radius:16px;box-shadow:0 0 28px #ffb03088;opacity:0;transition:opacity .6s;pointer-events:none}'+
  '#mortarcard .ic{font-size:clamp(28px,5vh,54px);line-height:1;filter:drop-shadow(0 0 8px #ffc060)}#mortarcard .ar{font-size:clamp(24px,4vh,44px);color:#ffd060;animation:mwslide 1s infinite}#mortarcard img{height:clamp(56px,11vh,110px);width:clamp(56px,11vh,110px);object-fit:cover;border-radius:50%;border:3px solid #e8b94a;box-shadow:0 0 18px #6aff7a99}'+
  '#mortarcard .key{font:800 clamp(11px,1.6vh,15px) Georgia,serif;color:#e8b94a;border:1px solid #e8b94a88;border-radius:6px;padding:2px 6px;margin-left:4px;opacity:.8}'+
  '@keyframes mwslide{0%,100%{transform:translateX(-4px);opacity:.6}50%{transform:translateX(5px);opacity:1}}'+
  '.mwarrow{position:fixed;left:0;top:0;z-index:54;font-size:clamp(28px,5.2vh,52px);line-height:1;color:#ffcb4a;text-shadow:0 0 12px #ff9a20,0 0 3px #000;pointer-events:none;display:none;will-change:transform}';
  document.head.appendChild(st); }
function showTip(){ css(); if(!TIP.card){ const c=document.createElement('div'); c.id='mortarcard'; c.innerHTML='<div class="ic">⚔️</div><div class="ar">➜</div><div class="ic">🧱💥</div><div class="ar">➜</div><img alt="" src="'+ASSET('loading-hexmortar.jpg')+'"><div class="key">⏎</div>'; document.body.appendChild(c); TIP.card=c; }
  TIP.on=true; TIP.shown=true; TIP.card.style.display='flex'; requestAnimationFrame(()=>{ if(TIP.card&&TIP.on) TIP.card.style.opacity=1; }); try{ SFX.horn&&SFX.horn(); }catch(er){} }
function hideTip(){ TIP.on=false; const c=TIP.card; if(c){ c.style.opacity=0; setTimeout(()=>{ if(!TIP.on) c.style.display='none'; },700); } for(const a of TIP.arrows.values()) a.remove(); TIP.arrows.clear(); }
addEventListener('keydown',e=>{ if(e.code==='Enter'&&TIP.on) hideTip(); });
function arrowFor(w){ let a=TIP.arrows.get(w); if(!a){ css(); a=document.createElement('div'); a.className='mwarrow'; a.textContent='▲'; document.body.appendChild(a); TIP.arrows.set(w,a); } return a; }
const V=new THREE.Vector3();
function placeArrow(w,a,t){ const sp=w.spot, W=innerWidth, H=innerHeight; V.set(sp.cx0,9,sp.cz0).project(camera); const front=V.z<1; let px, py, rot;
  if(front&&Math.abs(V.x)<.86&&Math.abs(V.y)<.78){ px=(V.x*.5+.5)*W; py=(-V.y*.5+.5)*H-Math.min(W,H)*.09+Math.sin(t*5)*8; rot=PI; }   /* over the room itself, pointing down at it */
  else { let dx=V.x, dy=-V.y; if(!front){ dx=-dx; dy=-dy; } if(Math.hypot(dx,dy)<.001){ dx=0; dy=1; } const an=Math.atan2(dy,dx), Rr=Math.min(W,H)*.4+Math.sin(t*5)*6; px=W/2+Math.cos(an)*Rr*(W/H>1.2?1.35:1); py=H/2+Math.sin(an)*Rr; rot=an+PI/2; }
  a.style.display='block'; a.style.transform='translate('+(px-20)+'px,'+(py-26)+'px) rotate('+rot+'rad)'; }
function tipTick(){ const walls=PW.raw(); const anyBroken=walls.some(w=>w.broken);
  if(!TIP.shown&&!anyBroken&&AW.awake&&level()>0) showTip();
  if(!TIP.on) return; if(anyBroken){ hideTip(); return; }
  const cine=!!(window.__finale&&window.__finale.active&&window.__finale.active()); const show=!cine&&(S.phase==='wave'||S.phase==='build')&&!Meta.isOpen();
  if(TIP.card) TIP.card.style.visibility=show?'visible':'hidden'; for(const w of walls){ if(w.broken) continue; const a=arrowFor(w); if(show) placeArrow(w,a,S.t); else a.style.display='none'; } }
// ---- waking and locking
function wake(){ if(AW.awake) return false; AW.awake=true; AW.wakes++; for(const w of PW.raw()){ if(w.broken) continue; w.locked=false; w.awake=false; } return true; }
function lock(){ hideTip(); TIP.shown=false; AW.awake=false; for(const w of PW.raw()){ if(!w.broken){ w.awake=false; w.locked=policyLock(); } } return true; }
let sawStart=false;
WORLDANIM.push(dt=>{
  if(S.phase==='start'){ if(!sawStart){ sawStart=true; AW.lost=0; hideTip(); TIP.shown=false; } } else sawStart=false;
  tipTick();
  { const n=window.__net; if(n&&n.role&&n.role()==='guest'&&n.world){ const hw=n.world(); if(hw&&Number.isFinite(+hw.mwl)) AW.lost=Math.max(0,+hw.mwl|0); } }   // co-op sweep 2026-10-02: on a guest the glow swells with the HOST's count (its defenses are the hall's; this page has none to lose)
  const want=policyLock()&&!AW.awake; for(const w of PW.raw()){ if(w.broken) continue; w.locked=want; if(!AW.awake) w.awake=false; } });
setInterval(()=>{ const p=document.getElementById('devpanel'); if(!p||document.getElementById('dp-mortarwake')) return; const sec=document.createElement('div'); sec.className='sect'; sec.id='dp-mortarwake';
  sec.innerHTML='<label>the mortar rooms (they wake when the wall falls; the show plays at the first door)</label><div class="row"><button id="dp-mw-wake">🔓 Wake them</button><button id="dp-mw-lock">🔒 Lock them</button><button id="dp-mw-lose">💀 Lose a defense</button></div>'; const note=p.querySelector('.note'); if(note) p.insertBefore(sec,note); else p.appendChild(sec);
  document.getElementById('dp-mw-wake').onclick=()=>wake(); document.getElementById('dp-mw-lock').onclick=()=>lock(); document.getElementById('dp-mw-lose').onclick=()=>{ AW.lost++; }; },800);
window.__mortarwake={ wake, lock, tip:()=>({ on:TIP.on, shown:TIP.shown, arrows:TIP.arrows.size, arrowsShown:[...TIP.arrows.values()].filter(a=>a.style.display==='block').length }), hideTip, lose:n=>{ AW.lost+=(n===undefined?1:n); }, glow:level, lost:()=>AW.lost,
  info:()=>({ awake:AW.awake, lost:AW.lost, glow:+level().toFixed(3), policy:policyLock(), wakes:AW.wakes, locked:PW.raw().map(w=>!!w.locked), awakeFlags:PW.raw().map(w=>!!w.awake), broken:PW.raw().map(w=>!!w.broken) }) };
})();
