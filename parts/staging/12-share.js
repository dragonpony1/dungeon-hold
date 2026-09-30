// ===== SHARE (build 212). Matt: "probably need a share button in the app to really share it" -- the same share-the-app button his
// other apps carry: the phone's own share sheet (Messages one tap away), or the link on the clipboard where there's no sheet.
// Everything rides in `text`, never the sheet's separate `url` field (a share target may keep one and silently drop the other).
// A small pill in the title screen's top corner (the centre is already full, and on a phone the button row sits below the fold),
// plus a button on the pause card (97-pause.js) so it's reachable mid-game.
(function(){
const PUBLIC='https://rootgate.52bulls.workers.dev/';   // build 307: the game lives on Cloudflare now (GitHub served it at ~0.4 MB/s)
function link(){ const h=location.hostname; return (location.protocol==='file:'||!h||h==='localhost'||h==='127.0.0.1')?PUBLIC:location.origin+location.pathname; }   // origin+path: no ?silent / ?v= rides along; a local copy shares the real one
function message(){ return ['ROOTGATE — a gnome tower-defense game that plays right in your browser. Hold the Heartroot against the horde!','',link(),'','Best on a computer. On a phone: open it, then Share → Add to Home Screen so it opens like an app.'].join('\n'); }
function fallbackCopy(t){ const ta=document.createElement('textarea'); ta.value=t; ta.style.cssText='position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); }catch(e){} document.body.removeChild(ta); }
// the label is remembered once: re-reading textContent on a second tap mid-flash would capture the flash as the label to go back to
function flash(btn,label){ if(!btn) return; if(!btn.dataset.label) btn.dataset.label=btn.textContent; clearTimeout(btn._revert); btn.textContent=label; btn._revert=setTimeout(()=>{ btn.textContent=btn.dataset.label; },1600); }
function copy(t,btn,ok){ const done=()=>flash(btn,ok||'✓ LINK COPIED'); if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done,()=>{ fallbackCopy(t); done(); }); else { fallbackCopy(t); done(); } }
function go(btn,ok){ const t=message(); if(navigator.share) navigator.share({title:'Rootgate',text:t}).catch(e=>{ if(e&&e.name!=='AbortError') copy(t,btn,ok); }); else copy(t,btn,ok); }   // backing out of the sheet isn't a failure
const st=document.createElement('style'); st.textContent='#sharebtn{position:absolute;top:10px;right:12px;z-index:2;background:linear-gradient(#2a1f33,#160f1c);border:2px solid #6b5a3c;border-radius:999px;color:#f1e6d0;font:bold 13px Georgia,serif;letter-spacing:2px;padding:7px 14px;cursor:pointer;box-shadow:0 2px 0 #000}#sharebtn:hover{border-color:var(--gold,#ffc040);color:#fff}body.tutorial #sharebtn{display:none}@media (max-width:520px){body #start{padding-top:42px}#sharebtn{top:5px;right:6px;padding:5px 10px;font-size:11px;letter-spacing:1px}}'; document.head.appendChild(st);
const start=document.getElementById('start');
if(start){ const b=document.createElement('button'); b.id='sharebtn'; b.type='button'; b.textContent='📤 SHARE'; b.title='send Rootgate to a friend';
  b.addEventListener('click',e=>{ e.stopPropagation(); go(b,'✓ COPIED'); }); start.appendChild(b); }
window.__share={go,message,link};
})();
