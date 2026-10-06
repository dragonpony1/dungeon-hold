// ===== TITLE SCREEN MUSIC (build 561). Matt: "i wanna try this as tittle screen background music" -- his "Every Leaf Keeps a Little of" (halothane862; assets/music-title.mp3, 2:12,
// Build 565 (Matt: "lets put this one on the title page but start it when the lyrics start"): the song is now his "Heartroot Rap" (halothane862, Suno), cut to begin at 9.3 s where the vocals come in (a 0.12 s fade-in), 2:17.
// Build 566 (Matt: "add this to the title screen song rotation. but start it when the lyrics start"): a ROTATION -- "Guard the Heartroot" (his main theme tavern song, Suno; assets/music-title2.mp3,
// cut at 14.3 s where the singing starts, 2:36) joins it. Each time the title opens it plays the next song in turn (dd_title_song), and when a song ends the next one follows (no loop).
// looped like the hall's tracks). It plays while the title is up (S.phase 'start'), from the first click (a browser keeps a page's sound shut until then), and hands over to the hall's own
// music on PLAY. It is music, so it follows the music switch -- and a 🎵 MUSIC button on the title (under ▶ TRAILER) turns that switch on and off right there.
(function(){
if(typeof TRACKS==='undefined') return;
const SONGS=[['title','assets/music-title.mp3'],['title2','assets/music-title2.mp3']];   // Heartroot Rap, Guard the Heartroot
for(const [k,file] of SONGS) TRACKS[k]=file;
const isTitle=m=>typeof m==='string'&&SONGS.some(x=>x[0]===m);
let cur=0; const keep=()=>{ try{ localStorage.setItem('dd_title_song',String(cur)); }catch(e){} };
try{ const v=localStorage.getItem('dd_title_song'); cur=v===null?0:((+v||0)+1)%SONGS.length; }catch(e){} keep();   // the next song each time the title opens
const song=()=>SONGS[cur][0];
{ const prev=musicForPhase; musicForPhase=function(){ if(S.phase==='start') return setMusic(song()); return prev.apply(this,arguments); }; }
// leaving the title the title track stops at once (the hall's track may still be decoding; it should not play on under the hall meanwhile)
{ const prev=setMusic; setMusic=function(m){ if(!isTitle(m)&&typeof musTrack!=='undefined'&&isTitle(musTrack)) try{ musStop(); }catch(e){} return prev.apply(this,arguments); }; }
setTimeout(()=>{ try{ if(S.phase==='start') musicForPhase(); }catch(e){} },0);
// past the title by any road (PLAY, a test's start, a co-op join): the title track never lingers into the hall
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); try{ if(S.phase!=='start'&&typeof musicMode!=='undefined'&&isTitle(musicMode)) musicForPhase(); }catch(e){}
  }; }
// a title song plays once through, then the next one (the next one's bytes fetched while this one plays). On a timer: the game's own update does not run while the title is up
setInterval(()=>{ try{ if(S.phase==='start'&&typeof musNode!=='undefined'&&musNode&&musNode.loop&&isTitle(musTrack)){ const n=musNode; n.loop=false; musFetch(SONGS[(cur+1)%SONGS.length][0]);
  n.onended=()=>{ if(musNode!==n||S.phase!=='start') return; cur=(cur+1)%SONGS.length; keep(); cnt.advanced++; setMusic(song()); }; } }catch(e){} },250);
const cnt={ advanced:0 };
// the page's sound opens on the first click: the title music starts then (a track begun on a shut page waits)
for(const ev of ['pointerdown','keydown']) addEventListener(ev,()=>{ try{ if(S.phase==='start'&&typeof musicMode!=='undefined'&&!isTitle(musicMode)) musicForPhase(); }catch(e){} },{ capture:true, passive:true });
// the 🎵 MUSIC switch on the title
const st=document.getElementById('start'); if(st){ const css=document.createElement('style'); css.textContent='#titlemus{position:absolute;top:134px;right:12px;z-index:2;background:linear-gradient(#3a1a10,#1a0b06);border:2px solid #c9962f;border-radius:999px;color:#ffe2b8;font:bold 13px Georgia,serif;letter-spacing:2px;padding:7px 14px;cursor:pointer;box-shadow:0 2px 0 #000}#titlemus:hover{border-color:#ffd27a;color:#fff}#titlemus.off{opacity:.7}'; document.head.appendChild(css);
  const b=document.createElement('button'); b.id='titlemus'; const label=()=>{ b.textContent=musicOn?'🎵 MUSIC ON':'🔇 MUSIC OFF'; b.classList.toggle('off',!musicOn); }; label();
  b.addEventListener('click',e=>{ e.stopPropagation(); toggleMusic(); label(); }); st.appendChild(b);
  window.__titlemusic={ label, mode:()=>typeof musicMode!=='undefined'?musicMode:null, song, songs:()=>SONGS.map(x=>x[0]), info:()=>Object.assign({ cur },cnt),
    looping:()=>!!(musNode&&musNode.loop), finish:()=>{ const n=musNode; if(n&&n.onended) n.onended(); return !!n; } };   // test hooks: is the song on a loop; end it now as if it had played out
}
})();
