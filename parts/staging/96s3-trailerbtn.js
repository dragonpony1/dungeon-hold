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
// build 544 (Matt: "but this is a pc game dont worry about phones"): the FULL-QUALITY trailer -- the 1080p 60 fps master (trailer/rootgate-trailer-v1.1.mp4, 126 MB) cut into 4 s pieces
// (assets/trailer-hd.m3u8 + trailer-hd-init.mp4 + trailer-hd-NNN.m4s, each under the host's 25 MB limit; copied in by tools/deploy-cf.sh, not kept in git) and streamed like any video site does --
// hls.js (jsDelivr) on Chrome / Edge / Firefox, Safari natively. If it can't (no hls.js, the pieces aren't there -- a local build), the 720p copy (assets/trailer.mp4) plays as before.
const MP4=()=>(typeof ASSET==='function'?ASSET('trailer.mp4'):'assets/trailer.mp4')+'?v=1.1', HD='assets/trailer-hd.m3u8?v=1.1'; let hls=null, mode=null, hlsP=null;
function hlsLib(){ if(window.Hls) return Promise.resolve(window.Hls); if(hlsP) return hlsP; hlsP=new Promise((res,rej)=>{ const sc=document.createElement('script'); sc.src='https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js'; sc.onload=()=>window.Hls?res(window.Hls):rej(new Error('no Hls')); sc.onerror=()=>rej(new Error('hls.js blocked')); document.head.appendChild(sc); setTimeout(()=>rej(new Error('hls.js slow')),6000); }); return hlsP; }
function useMp4(){ if(mode==='mp4') return; if(hls){ try{ hls.destroy(); }catch(e){} hls=null; } mode='mp4'; vid.src=MP4(); const p=vid.play(); if(p&&p.catch) p.catch(()=>{}); }
function load(){ if(mode) return; mode='hd?';
  if(vid.canPlayType('application/vnd.apple.mpegurl')){ mode='hd-native'; vid.src=HD; vid.addEventListener('error',useMp4,{ once:true }); const p=vid.play(); if(p&&p.catch) p.catch(()=>{}); return; }
  hlsLib().then(Hls=>{ if(mode!=='hd?') return; if(!Hls.isSupported()) return useMp4(); hls=new Hls({ maxBufferLength:30 }); mode='hd';
    hls.on(Hls.Events.ERROR,(ev,d)=>{ if(d&&d.fatal) useMp4(); }); hls.loadSource(HD); hls.attachMedia(vid); hls.on(Hls.Events.MANIFEST_PARSED,()=>{ if(ov.classList.contains('on')){ const p=vid.play(); if(p&&p.catch) p.catch(()=>{}); } }); }).catch(useMp4); }
function open(){ ov.classList.add('on'); opens++; try{ if(document.exitPointerLock) document.exitPointerLock(); }catch(e){} if(!mode) load(); else { const p=vid.play(); if(p&&p.catch) p.catch(()=>{}); } }
function close(){ ov.classList.remove('on'); try{ vid.pause(); }catch(e){} }
ov.addEventListener('click',e=>{ if(e.target===ov||e.target.classList.contains('tx')){ e.stopPropagation(); close(); } });
addEventListener('keydown',e=>{ if(ov.classList.contains('on')&&(e.key==='Escape'||e.code==='Space'&&e.target!==vid)){ if(e.key==='Escape') close(); e.stopImmediatePropagation(); } },true);
const st=document.getElementById('start'); if(st){ const b=document.createElement('button'); b.id='trailerbtn'; b.textContent='▶ TRAILER'; b.addEventListener('click',e=>{ e.stopPropagation(); open(); }); st.appendChild(b); }
// build 544: a link straight to the trailer -- <site>/?trailer opens the game's title with the trailer up (press play), the full-quality one
try{ if(typeof Q!=='undefined'&&Q.has('trailer')&&!navigator.webdriver) setTimeout(open,600); }catch(e){}
window.__trailer={ open, close, isOpen:()=>ov.classList.contains('on'), opens:()=>opens, src:()=>vid.src, mode:()=>mode };
})();
