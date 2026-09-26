// ===== THE SOUND MENU (build 143): "a sound menu so you can adjust efx vs music sound volumes". The 🎵 button opens a small
// panel by the HUD buttons with two sliders -- MUSIC (the hall and battle tracks, the procedural themes, the ambient drone)
// and EFFECTS (every other sound: the horn, swings, hits, the ballista, placements, orbs, the alarm, the casino) -- each a
// gain in game.js's two channels (SFXOUT/MUSOUT), changed live and kept in localStorage dd_audio. MUSIC also switches the music
// on and off (N still does, as before), and MUTE EVERYTHING is the old 🔊 / M switch. The pause menu (Esc) has a SOUND
// button that opens the same panel. Moving the effects slider plays a short tick at the new level, so you hear it.
(function(){
const KEY='dd_audio';
const css=document.createElement('style'); css.textContent='#sndmenu{position:fixed;right:14px;top:104px;z-index:40;width:280px;background:#120d16f2;border:2px solid var(--gold,#ffc040);border-radius:10px;padding:12px 14px 14px;color:#fff;font:15px Georgia,serif;box-shadow:0 6px 30px #000c;pointer-events:auto}#sndmenu.hide{display:none}#sndmenu h3{margin:0 0 10px;font-size:14px;letter-spacing:3px;color:var(--gold,#ffc040);display:flex;align-items:center}#sndmenu h3 button{margin-left:auto;background:none;border:0;color:#fff9;font-size:18px;cursor:pointer}#sndmenu .row{display:grid;grid-template-columns:86px 1fr 44px;align-items:center;gap:8px;margin:8px 0}#sndmenu input[type=range]{width:100%;accent-color:var(--gold,#ffc040)}#sndmenu .pc{text-align:right;font-variant-numeric:tabular-nums;color:#ffd27a}#sndmenu .tg{display:flex;gap:6px;margin-top:10px}#sndmenu .tg button{flex:1;background:#1c1424;border:2px solid #6b5a3c;border-radius:8px;color:#fff;font:13px Georgia,serif;padding:7px 6px;cursor:pointer}#sndmenu .tg button.on{border-color:var(--gold,#ffc040);color:#ffd27a}@media (max-width:700px){#sndmenu{right:8px;left:8px;width:auto;top:96px}}'; document.head.appendChild(css);
const el=document.createElement('div'); el.id='sndmenu'; el.className='hide';
el.innerHTML='<h3>🎵 SOUND<button data-x title="close">✕</button></h3><div class="row"><span>Music</span><input type="range" min="0" max="100" step="1" data-k="music"><span class="pc" data-p="music"></span></div><div class="row"><span>Effects</span><input type="range" min="0" max="100" step="1" data-k="sfx"><span class="pc" data-p="sfx"></span></div><div class="tg"><button data-t="music"></button><button data-t="all"></button></div>';
document.body.appendChild(el);
function save(){ try{ localStorage.setItem(KEY,JSON.stringify({music:AUDV.music,sfx:AUDV.sfx})); }catch(e){} }
function apply(k){ const a=ac; if(a&&a.__mix&&a.__mix[k]){ const g=a.__mix[k].gain; try{ g.setTargetAtTime(AUDV[k],a.currentTime,.03); }catch(e){ g.value=AUDV[k]; } } }
function refresh(){ for(const k of ['music','sfx']){ const r=el.querySelector('[data-k="'+k+'"]'); const v=Math.round(AUDV[k]*100); if(+r.value!==v) r.value=v; el.querySelector('[data-p="'+k+'"]').textContent=v+'%'; }
  const bm=el.querySelector('[data-t="music"]'); bm.textContent=musicOn?'🎵 Music on (N)':'🎵 Music off (N)'; bm.classList.toggle('on',musicOn);
  const ba=el.querySelector('[data-t="all"]'); ba.textContent=soundOff?'🔇 All sound off (M)':'🔊 All sound on (M)'; ba.classList.toggle('on',!soundOff); }
let tickT=0;
el.addEventListener('input',e=>{ const k=e.target&&e.target.dataset.k; if(!k) return; AUDV[k]=Math.max(0,Math.min(1,(+e.target.value||0)/100)); apply(k); save(); refresh();
  if(k==='sfx'){ const now=performance.now(); if(now-tickT>120){ tickT=now; if(typeof beep==='function') beep(660,.07,'sine',.06,0); } } });
el.addEventListener('click',e=>{ e.stopPropagation(); if(e.target.closest('[data-x]')){ close(); return; } const t=e.target.closest('[data-t]'); if(!t) return; if(t.dataset.t==='music') toggleMusic(); else setSound(soundOff); refresh(); });
el.addEventListener('keydown',e=>e.stopPropagation());   // arrow keys on a focused slider move the slider, not the hero
function open(){ refresh(); el.classList.remove('hide'); if(document.exitPointerLock&&document.pointerLockElement) document.exitPointerLock(); return true; }
function close(){ el.classList.add('hide'); return true; }
function toggle(){ return el.classList.contains('hide')?open():close(); }
{ const mb=$('musbtn'); if(mb){ mb.onclick=e=>{ e.stopPropagation(); toggle(); }; mb.title='Sound: music and effects volume'; } }   // the 🎵 button opens the menu now; N still switches the music on and off
addEventListener('mousedown',e=>{ if(!el.classList.contains('hide')&&!el.contains(e.target)&&e.target.id!=='musbtn') close(); },true);   // a click anywhere else closes it
// the pause menu gets a SOUND button that opens the same panel over it
{ const tryAdd=()=>{ const pz=document.querySelector('#pause .pz'); if(!pz||pz.querySelector('[data-snd]')) return !!pz; const b=document.createElement('button'); b.dataset.snd='1'; b.textContent='🎵 SOUND'; b.addEventListener('click',e=>{ e.stopPropagation(); open(); }); const title=pz.querySelector('[data-act="title"]'); pz.insertBefore(b,title||null); return true; };
  if(!tryAdd()){ const t=setInterval(()=>{ if(tryAdd()) clearInterval(t); },500); } }
window.__sound={open,close,isOpen:()=>!el.classList.contains('hide'),get:()=>({music:AUDV.music,sfx:AUDV.sfx}),set:(k,v)=>{ AUDV[k]=Math.max(0,Math.min(1,+v)); apply(k); save(); refresh(); },buses:()=>ac&&ac.__mix?{music:ac.__mix.music.gain.value,sfx:ac.__mix.sfx.gain.value}:null,KEY};
})();
