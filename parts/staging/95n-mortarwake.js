// ===== THE MORTAR ROOMS WAKE (build 367). Matt, of the finale: "its not until this time that the walls near us start to glow, when we break the walls the mortar rolls out" -- and now: "right we need the mortar rooms to glow and some kind of
// prompt to the player". THE DEEP PRISON only. The two rooms either side of the Heartroot (56g-prisonwalls.js: Bob's shackled walls over the sealed alcoves with the Hex Mortars) are LOCKED until the big barrier has fallen: no beacon, no light,
// and blows do nothing. When the cutscene of the barrier ends (56i hands over) they WAKE: a horn and a rumble, a gold flash, the beacon swells (a big hot glow and a strong light, the light that was already made -- none is added) and a
// PILLAR OF LIGHT stands over each, tall enough to be seen from the whole pit. The player is told in PICTURES, no words (show, don't tell): a card at the top of the screen -- a sword, an arrow, a wall breaking, an arrow, the Hex Mortar's own
// picture -- that stays nine seconds or until the first wall goes, and a gold arrow for each unbroken room: over the room itself when it is on screen, on the edge of the screen pointing to it when it is not. Broken, a room loses its pillar and
// arrow. Not locked at all in Survival, in a co-op hall (no cutscene runs there), or once the seventh wave has begun without the wake (a safety). The dev panel (F9) has a button to wake them. Test hook: window.__mortarwake.
(function(){
'use strict';
window.__mortarwake={ info:()=>null };
if(!MAP||MAP.id!=='prison') return;
const PW=window.__prisonwalls; if(!PW||!PW.raw) return;
const inCoop=()=>{ try{ return !!(window.__net&&window.__net.role&&window.__net.role()); }catch(er){ return false; } };
const CARD_T=9;
const AW={ awake:false, t:0, arrows:new Map(), pillars:new Map(), card:null, wakes:0 };
const policyLock=()=>!(SURVIVAL||inCoop()||S.wave>6);
const fx=[];
// ---- the pillar of light
let PILLAR=null; function pillarTex(){ if(PILLAR) return PILLAR; const c=document.createElement('canvas'); c.width=64; c.height=256; const g=c.getContext('2d'); const h=g.createLinearGradient(0,256,0,0); h.addColorStop(0,'rgba(255,200,90,.95)'); h.addColorStop(.45,'rgba(255,170,50,.55)'); h.addColorStop(1,'rgba(255,150,30,0)'); g.fillStyle=h; g.fillRect(0,0,64,256);
  g.globalCompositeOperation='destination-in'; const sd=g.createLinearGradient(0,0,64,0); sd.addColorStop(0,'rgba(0,0,0,0)'); sd.addColorStop(.35,'rgba(0,0,0,1)'); sd.addColorStop(.65,'rgba(0,0,0,1)'); sd.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=sd; g.fillRect(0,0,64,256); PILLAR=new THREE.CanvasTexture(c); return PILLAR; }
function makePillar(w){ const sp=w.spot, grp=new THREE.Group(); for(const ry of [0,PI/2]){ const m=new THREE.Mesh(new THREE.PlaneGeometry(4.2,24),new THREE.MeshBasicMaterial({ map:pillarTex(), transparent:true, opacity:.5, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide })); m.position.y=12; m.rotation.y=ry; m.userData.noOL=true; grp.add(m); }
  grp.position.set(sp.cx0+sp.nx*.6,0,sp.cz0+sp.nz*.6); scene.add(grp); AW.pillars.set(w,grp); }
function flashAt(w){ const sp=w.spot; const s=glow(0xffc040,10,.001); s.position.set(sp.cx0+sp.nx*.8,4,sp.cz0+sp.nz*.8); scene.add(s); fx.push({ s, t:0, life:1.1 }); }
// ---- the picture prompt: a card and the arrows (DOM; no words)
function css(){ if(document.getElementById('mortarwakecss')) return; const st=document.createElement('style'); st.id='mortarwakecss';
  st.textContent='#mortarcard{position:fixed;left:50%;top:15%;transform:translateX(-50%);z-index:55;display:none;align-items:center;gap:clamp(8px,1.4vw,18px);padding:clamp(8px,1.4vh,16px) clamp(12px,1.8vw,26px);background:linear-gradient(#2a1a0ccc,#120a05dd);border:2px solid #e8b94a;border-radius:16px;box-shadow:0 0 28px #ffb03088;opacity:0;transition:opacity .6s;pointer-events:none}'+
  '#mortarcard .ic{font-size:clamp(28px,5vh,54px);line-height:1;filter:drop-shadow(0 0 8px #ffc060)}#mortarcard .ar{font-size:clamp(24px,4vh,44px);color:#ffd060;animation:mwslide 1s infinite}#mortarcard img{height:clamp(56px,11vh,110px);width:clamp(56px,11vh,110px);object-fit:cover;border-radius:50%;border:3px solid #e8b94a;box-shadow:0 0 18px #6aff7a99}'+
  '@keyframes mwslide{0%,100%{transform:translateX(-4px);opacity:.6}50%{transform:translateX(5px);opacity:1}}'+
  '.mwarrow{position:fixed;left:0;top:0;z-index:54;font-size:clamp(28px,5.2vh,52px);line-height:1;color:#ffcb4a;text-shadow:0 0 12px #ff9a20,0 0 3px #000;pointer-events:none;display:none;will-change:transform}';
  document.head.appendChild(st); }
function showCard(){ css(); if(!AW.card){ const c=document.createElement('div'); c.id='mortarcard'; c.innerHTML='<div class="ic">⚔️</div><div class="ar">➜</div><div class="ic">🧱💥</div><div class="ar">➜</div><img alt="" src="assets/loading-hexmortar.jpg">'; document.body.appendChild(c); AW.card=c; }
  AW.card.dataset.on='1'; AW.card.style.display='flex'; requestAnimationFrame(()=>{ if(AW.card) AW.card.style.opacity=1; }); }
function hideCard(){ const c=AW.card; if(!c) return; c.style.opacity=0; setTimeout(()=>{ if(c.style.opacity==='0') c.style.display='none'; },700); }
function arrowFor(w){ let a=AW.arrows.get(w); if(!a){ css(); a=document.createElement('div'); a.className='mwarrow'; a.textContent='▲'; document.body.appendChild(a); AW.arrows.set(w,a); } return a; }
const V=new THREE.Vector3();
function placeArrow(w,a,t){ const sp=w.spot, W=innerWidth, H=innerHeight; V.set(sp.cx0,9,sp.cz0).project(camera); const front=V.z<1; let px, py, rot;
  if(front&&Math.abs(V.x)<.86&&Math.abs(V.y)<.78){ px=(V.x*.5+.5)*W; py=(-V.y*.5+.5)*H-Math.min(W,H)*.09+Math.sin(t*5)*8; rot=PI; }   // over the room itself, pointing down at it
  else { let dx=V.x, dy=-V.y; if(!front){ dx=-dx; dy=-dy; } if(Math.hypot(dx,dy)<.001){ dx=0; dy=1; } const an=Math.atan2(dy,dx), Rr=Math.min(W,H)*.4+Math.sin(t*5)*6; px=W/2+Math.cos(an)*Rr*(W/H>1.2?1.35:1); py=H/2+Math.sin(an)*Rr; rot=an+PI/2; }
  a.style.display='block'; a.style.transform='translate('+(px-20)+'px,'+(py-26)+'px) rotate('+rot+'rad)'; }
// ---- waking and locking
function wake(){ if(AW.awake) return false; AW.awake=true; AW.t=0; AW.wakes++; for(const w of PW.raw()){ if(w.broken) continue; w.locked=false; w.awake=true; makePillar(w); flashAt(w); }
  camShake=Math.max(camShake,.55); try{ SFX.boom&&SFX.boom(); SFX.horn&&SFX.horn(); }catch(er){} showCard(); return true; }
function clearLook(){ for(const [w,g] of AW.pillars){ scene.remove(g); g.traverse(o=>{ if(o.isMesh){ o.geometry.dispose(); o.material.dispose(); } }); } AW.pillars.clear(); for(const [w,a] of AW.arrows){ a.remove(); } AW.arrows.clear(); hideCard(); }
function lock(){ AW.awake=false; for(const w of PW.raw()){ if(!w.broken){ w.awake=false; w.locked=policyLock(); } } clearLook(); return true; }
WORLDANIM.push(dt=>{
  const want=policyLock()&&!AW.awake; const walls=PW.raw(); for(const w of walls){ if(w.broken) continue; w.locked=want; if(!AW.awake) w.awake=false; }
  if(AW.awake){ AW.t+=dt; const cine=!!(window.__finale&&window.__finale.active&&window.__finale.active()); const show=!cine&&(S.phase==='wave'||S.phase==='build')&&!Meta.isOpen();
    for(const w of walls){ const g=AW.pillars.get(w); if(w.broken){ if(g){ scene.remove(g); AW.pillars.delete(w); } const a=AW.arrows.get(w); if(a){ a.remove(); AW.arrows.delete(w); } continue; }
      if(g){ const k=.5+.5*Math.sin(S.t*2.4+(w.beacon?w.beacon.ph:0)); g.children.forEach(m=>{ m.material.opacity=.38+.3*k; }); }
      const a=arrowFor(w); if(show) placeArrow(w,a,S.t); else a.style.display='none'; }
    if(AW.card&&AW.card.dataset.on==='1'&&(AW.t>CARD_T||walls.some(w=>w.broken))){ AW.card.dataset.on='0'; hideCard(); } }
  for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.t+=dt; const k=f.t/f.life; if(k>=1){ scene.remove(f.s); f.s.material.dispose(); fx.splice(i,1); continue; } f.s.material.opacity=.95*(1-k); f.s.scale.setScalar(10+k*22); } });
setInterval(()=>{ const p=document.getElementById('devpanel'); if(!p||document.getElementById('dp-mortarwake')) return; const sec=document.createElement('div'); sec.className='sect'; sec.id='dp-mortarwake';
  sec.innerHTML='<label>the mortar rooms (they wake when the wall falls)</label><div class="row"><button id="dp-mw-wake">🔓 Wake them</button><button id="dp-mw-lock">🔒 Lock them</button></div>'; const note=p.querySelector('.note'); if(note) p.insertBefore(sec,note); else p.appendChild(sec);
  document.getElementById('dp-mw-wake').onclick=()=>wake(); document.getElementById('dp-mw-lock').onclick=()=>lock(); },800);
window.__mortarwake={ wake, lock, info:()=>({ awake:AW.awake, t:+AW.t.toFixed(1), policy:policyLock(), wakes:AW.wakes, pillars:AW.pillars.size, arrows:AW.arrows.size, arrowsShown:[...AW.arrows.values()].filter(a=>a.style.display==='block').length, card:!!AW.card&&AW.card.dataset.on==='1', locked:PW.raw().map(w=>!!w.locked), awakeFlags:PW.raw().map(w=>!!w.awake) }) };
})();
