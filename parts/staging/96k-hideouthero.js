// ===== CHANGE HERO IN THE HIDEOUT (build 329, hideout build 75). Matt: "oh we need a way to change heros in the hideout". H inside the hideout (the key the co-op lobby already changes hero with) posts
// 'hideout:hero'; this opens a row of hero cards over the room -- each hero's portrait (hero-<id>.png, the title screen's), its name, a lock on one not earned yet, the one you are playing lit.
// A click switches (window.__heroes.select: that hero's own gear goes on, 71-herogear.js) and hands the room back the way the bag does ('hideout:bagClosed': a click steps back in); so does
// the X, Esc or H. In co-op your friends see the new hero at once (the bridge sends your hero with every step, 99d-coophideout.js).
(function(){
'use strict';
const H=window.__hideout; if(!H) return;
const css=document.createElement('style'); css.textContent=
 '#hdHero{position:fixed;inset:0;z-index:30;display:none;align-items:center;justify-content:center;background:#07050acc}#hdHero.on{display:flex}'
+'#hdHero .hb{position:relative;padding:18px 22px 20px;border-radius:14px;background:linear-gradient(#241a2e,#140e1a);border:2px solid #c89a4a;box-shadow:0 12px 44px #000;text-align:center;max-width:94vw}'
+'#hdHero h2{margin:0 0 14px;font:800 22px Georgia,serif;letter-spacing:3px;color:#ffd27a}'
+'#hdHero .row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}'
+'#hdHero .hc{position:relative;width:128px;padding:8px 8px 10px;border-radius:10px;border:2px solid #4a3a54;background:#1c1424;cursor:pointer;color:#e8dcc8;font:700 12px Georgia,serif;transition:transform .12s}'
+'#hdHero .hc:hover{transform:translateY(-3px);border-color:#c89a4a}#hdHero .hc.sel{border-color:#ffd27a;box-shadow:0 0 0 2px #ffd27a,0 0 18px #ffd27a66}'
+'#hdHero .hc img{width:110px;height:130px;object-fit:cover;border-radius:6px;display:block;margin:0 auto 6px;background:#0c0910}'
+'#hdHero .hc.locked{cursor:not-allowed;opacity:.5}#hdHero .hc.locked img{filter:grayscale(1)}#hdHero .hc .lk{position:absolute;top:44%;left:50%;transform:translate(-50%,-50%);font-size:34px}'
+'#hdHero .hc .on{position:absolute;top:6px;right:8px;font-size:16px;color:#ffd27a}'
+'#hdHero .x{position:absolute;top:6px;right:10px;background:none;border:0;color:#bfae90;font-size:22px;cursor:pointer}';
document.head.appendChild(css);
const el=document.createElement('div'); el.id='hdHero'; el.innerHTML='<div class="hb"><button class="x" title="Back to the hideout">✕</button><h2>HERO</h2><div class="row"></div></div>'; document.body.appendChild(el);
let shown=false;
function tell(msg){ try{ const w=H.frameWin(); if(w) w.postMessage(msg,'*'); }catch(e){} }
function render(){ const HR=window.__heroes; if(!HR) return; const cur=HR.pick();
  el.querySelector('.row').innerHTML=HR.list().map(h=>'<div class="hc'+(h.id===cur?' sel':'')+(h.locked?' locked':'')+'" data-id="'+h.id+'"><img src="'+ASSET('hero-'+h.id+'.png')+'" alt="">'+(h.locked?'<span class="lk">🔒</span>':'')+(h.id===cur?'<span class="on">✔</span>':'')+h.name+'</div>').join('');
  el.querySelectorAll('.hc').forEach(c=>c.onclick=e=>{ e.stopPropagation(); pick(c.dataset.id); }); }
function open(){ if(!H.isOpen()||shown) return false; shown=true; render(); el.classList.add('on'); return true; }
function close(){ if(!shown) return false; shown=false; el.classList.remove('on'); try{ const f=document.querySelector('#hideoutWrap iframe'); if(f&&H.isOpen()) f.focus(); }catch(e){} tell('hideout:bagClosed'); return true; }
function pick(id){ const HR=window.__heroes; const h=(HR.list()||[]).find(x=>x.id===id); if(!h) return false; if(h.locked){ toast('🔒 Hold your first hall to unlock the '+h.name); return false; }
  if(id!==HR.pick()){ HR.select(id); toast('Now playing: '+h.name); } close(); return true; }
el.addEventListener('click',e=>{ if(e.target===el||e.target.classList.contains('x')) close(); });
addEventListener('keydown',e=>{ if(!shown) return; if(e.code==='Escape'||e.code==='KeyH'){ e.preventDefault(); e.stopImmediatePropagation(); close(); } },true);
addEventListener('message',e=>{ const w=H.frameWin(); if(!w||e.source!==w) return; if(e.data==='hideout:hero') open(); });
if(H.hooks){ const prev=H.hooks.close; H.hooks.close=function(){ close(); if(typeof prev==='function') return prev.apply(this,arguments); }; }   // however the room closes (the horn, the run ending...), the picker goes with it
window.__hideouthero={open,close,pick,isOpen:()=>shown};
})();
