// ===== THE TRAILER ON THE TITLE SCREEN (build 537). Matt, after the first cut: "can i access that thru the game how do i show these guys". A "▶ TRAILER" button under 🎬 CINEMATICS plays it over the
// title (assets/trailer.mp4 -- the 720p copy of trailer/rootgate-trailer-v1.mp4, under the host's 25 MB file limit); ✕ / Esc / a click outside closes it. Shareable straight: <site>/assets/trailer.mp4.
// Never on a co-op join page or in the tutorial. Test hook: window.__trailer.
(function(){
if(typeof TUTORIAL!=='undefined'&&TUTORIAL) return; if(typeof COOPJOIN!=='undefined'&&COOPJOIN) return; if(typeof HAS_ASSETS!=='undefined'&&!HAS_ASSETS) return;
const css=document.createElement('style'); css.textContent='#trailerbtn{position:absolute;top:94px;right:12px;z-index:2;background:linear-gradient(#3a1a10,#1a0b06);border:2px solid #c9962f;border-radius:999px;color:#ffe2b8;font:bold 13px Georgia,serif;letter-spacing:2px;padding:7px 14px;cursor:pointer;box-shadow:0 2px 0 #000}#trailerbtn:hover{border-color:#ffd27a;color:#fff}'
 +'#trailerOv{position:fixed;inset:0;z-index:100;background:#000e;display:none;align-items:center;justify-content:center}#trailerOv.on{display:flex}#trailerOv video{width:min(96vw,calc(88vh*16/9));max-height:88vh;border:2px solid #c9962f;border-radius:6px;box-shadow:0 0 40px #000;background:#000}'
 +'#trailerOv .tx{position:absolute;top:14px;right:18px;background:#1a0b06;border:2px solid #c9962f;color:#ffe2b8;font:bold 20px Georgia,serif;border-radius:999px;width:44px;height:44px;cursor:pointer}';
document.head.appendChild(css);
const ov=document.createElement('div'); ov.id='trailerOv'; ov.innerHTML='<video controls playsinline preload="none"></video><button class="tx" aria-label="close">✕</button>'; document.body.appendChild(ov);
const vid=ov.querySelector('video'); let opens=0;
function open(){ if(!vid.src) vid.src=(typeof ASSET==='function'?ASSET('trailer.mp4'):'assets/trailer.mp4')+'?v=1.1';   /* build 538: v1.1 (the co-op shot no longer goes through the floor); the query skips a week-old cached copy */ ov.classList.add('on'); opens++; try{ if(document.exitPointerLock) document.exitPointerLock(); }catch(e){} const p=vid.play(); if(p&&p.catch) p.catch(()=>{}); }
function close(){ ov.classList.remove('on'); try{ vid.pause(); }catch(e){} }
ov.addEventListener('click',e=>{ if(e.target===ov||e.target.classList.contains('tx')){ e.stopPropagation(); close(); } });
addEventListener('keydown',e=>{ if(ov.classList.contains('on')&&(e.key==='Escape'||e.code==='Space'&&e.target!==vid)){ if(e.key==='Escape') close(); e.stopImmediatePropagation(); } },true);
const st=document.getElementById('start'); if(st){ const b=document.createElement('button'); b.id='trailerbtn'; b.textContent='▶ TRAILER'; b.addEventListener('click',e=>{ e.stopPropagation(); open(); }); st.appendChild(b); }
window.__trailer={ open, close, isOpen:()=>ov.classList.contains('on'), opens:()=>opens, src:()=>vid.src };
})();
