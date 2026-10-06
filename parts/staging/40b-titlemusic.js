// ===== TITLE SCREEN MUSIC (build 561). Matt: "i wanna try this as tittle screen background music" -- his "Every Leaf Keeps a Little of" (halothane862; assets/music-title.mp3, 2:12,
// looped like the hall's tracks). It plays while the title is up (S.phase 'start'), from the first click (a browser keeps a page's sound shut until then), and hands over to the hall's own
// music on PLAY. It is music, so it follows the music switch -- and a 🎵 MUSIC button on the title (under ▶ TRAILER) turns that switch on and off right there.
(function(){
if(typeof TRACKS==='undefined') return;
TRACKS.title='assets/music-title.mp3';
{ const prev=musicForPhase; musicForPhase=function(){ if(S.phase==='start') return setMusic('title'); return prev.apply(this,arguments); }; }
// leaving the title the title track stops at once (the hall's track may still be decoding; it should not play on under the hall meanwhile)
{ const prev=setMusic; setMusic=function(m){ if(m!=='title'&&typeof musTrack!=='undefined'&&musTrack==='title') try{ musStop(); }catch(e){} return prev.apply(this,arguments); }; }
setTimeout(()=>{ try{ if(S.phase==='start') musicForPhase(); }catch(e){} },0);
// past the title by any road (PLAY, a test's start, a co-op join): the title track never lingers into the hall
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); try{ if(S.phase!=='start'&&typeof musicMode!=='undefined'&&musicMode==='title') musicForPhase(); }catch(e){} }; }
// the page's sound opens on the first click: the title music starts then (a track begun on a shut page waits)
for(const ev of ['pointerdown','keydown']) addEventListener(ev,()=>{ try{ if(S.phase==='start'&&typeof musicMode!=='undefined'&&musicMode!=='title') musicForPhase(); }catch(e){} },{ capture:true, passive:true });
// the 🎵 MUSIC switch on the title
const st=document.getElementById('start'); if(st){ const css=document.createElement('style'); css.textContent='#titlemus{position:absolute;top:134px;right:12px;z-index:2;background:linear-gradient(#3a1a10,#1a0b06);border:2px solid #c9962f;border-radius:999px;color:#ffe2b8;font:bold 13px Georgia,serif;letter-spacing:2px;padding:7px 14px;cursor:pointer;box-shadow:0 2px 0 #000}#titlemus:hover{border-color:#ffd27a;color:#fff}#titlemus.off{opacity:.7}'; document.head.appendChild(css);
  const b=document.createElement('button'); b.id='titlemus'; const label=()=>{ b.textContent=musicOn?'🎵 MUSIC ON':'🔇 MUSIC OFF'; b.classList.toggle('off',!musicOn); }; label();
  b.addEventListener('click',e=>{ e.stopPropagation(); toggleMusic(); label(); }); st.appendChild(b);
  window.__titlemusic={ label, mode:()=>typeof musicMode!=='undefined'?musicMode:null }; }
})();
