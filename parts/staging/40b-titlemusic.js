// ===== TITLE SCREEN MUSIC (build 561). Matt: "i wanna try this as tittle screen background music" -- his "Every Leaf Keeps a Little of" (halothane862; assets/music-title.mp3, 2:12,
// Build 565 (Matt: "lets put this one on the title page but start it when the lyrics start"): the song is now his "Heartroot Rap" (halothane862, Suno), cut to begin at 9.3 s where the vocals come in (a 0.12 s fade-in), 2:17.
// Build 566 (Matt: "add this to the title screen song rotation. but start it when the lyrics start"): a ROTATION -- "Guard the Heartroot" (his main theme tavern song, Suno; assets/music-title2.mp3,
// cut at 14.3 s where the singing starts, 2:36) joins it. Each time the title opens it plays the next song in turn (dd_title_song), and when a song ends the next one follows (no loop).
// looped like the hall's tracks). It plays while the title is up (S.phase 'start'), from the first click (a browser keeps a page's sound shut until then), and hands over to the hall's own
// music on PLAY. It is music, so it follows the music switch -- and a 🎵 MUSIC button on the title (under ▶ TRAILER) turns that switch on and off right there.
(function(){
if(typeof TRACKS==='undefined') return;
// Build 567 (Matt: "i really like that country one, make it come up more often like every other"): two more -- "Guard the Heartroot" as a rap (his "main theme rap"; cut at 28.1 s where the
// rapping starts, 3:14) and as COUNTRY (cut at 13.3 s, then build 581 at 10.3 s -- Matt: 'its starts just 3 seconds to late it cuts off the lyrics just barley' -- then build 587 at 5.3 s -- Matt: 'that guard the heartroot song starts 2 seconds too late, can you back it up 5 seconds', 2:41) -- and the order puts the country one every other song.
const SONGS=[['title','assets/music-title.mp3'],['title2','assets/music-title2.mp3'],['title3','assets/music-title3.mp3'],['title4','assets/music-title4.mp3'],['title5','assets/music-title5.mp3']];   // Heartroot Rap, Guard the Heartroot (tavern), Guard the Heartroot (rap), Guard the Heartroot (country), Guard the Heartroot (sea chanty)
// Build 568 (Matt: "last one"): "Guard the Heartroot" as a SEA CHANTY (cut at 2.5 s, past the opening stomps where the voices come in, 3:00) -- the country one still every other song.
const ORDER=['title4','title','title4','title2','title4','title3','title4','title5'];   // the country one every other song
for(const [k,file] of SONGS) TRACKS[k]=file;
const isTitle=m=>typeof m==='string'&&SONGS.some(x=>x[0]===m);
let cur=0; const keep=()=>{ try{ localStorage.setItem('dd_title_song',String(cur)); }catch(e){} };
try{ const v=localStorage.getItem('dd_title_song'); cur=v===null?0:((+v||0)+1)%ORDER.length; }catch(e){} keep();   // the next song each time the title opens
const song=()=>ORDER[cur];
{ const prev=musicForPhase; musicForPhase=function(){ if(S.phase==='start') return setMusic(song()); return prev.apply(this,arguments); }; }
// leaving the title the title track stops at once (the hall's track may still be decoding; it should not play on under the hall meanwhile)
{ const prev=setMusic; setMusic=function(m){ if(!isTitle(m)&&typeof musTrack!=='undefined'&&isTitle(musTrack)) try{ musStop(); }catch(e){} return prev.apply(this,arguments); }; }
setTimeout(()=>{ try{ if(S.phase==='start') musicForPhase(); }catch(e){} },0);
// past the title by any road (PLAY, a test's start, a co-op join): the title track never lingers into the hall
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); try{ if(S.phase!=='start'&&typeof musicMode!=='undefined'&&isTitle(musicMode)) musicForPhase(); }catch(e){}
  }; }
// a title song plays once through, then the next one (the next one's bytes fetched while this one plays). On a timer: the game's own update does not run while the title is up
setInterval(()=>{ try{ if(S.phase==='start'&&typeof musNode!=='undefined'&&musNode&&musNode.loop&&isTitle(musTrack)){ const n=musNode; n.loop=false; musFetch(ORDER[(cur+1)%ORDER.length]);
  n.onended=()=>{ if(musNode!==n||S.phase!=='start') return; cur=(cur+1)%ORDER.length; keep(); cnt.advanced++; setMusic(song()); }; } }catch(e){} },250);
const cnt={ advanced:0 };
// the page's sound opens on the first click: the title music starts then (a track begun on a shut page waits)
for(const ev of ['pointerdown','keydown']) addEventListener(ev,()=>{ try{ if(S.phase==='start'&&typeof musicMode!=='undefined'&&!isTitle(musicMode)) musicForPhase(); }catch(e){} },{ capture:true, passive:true });
// the 🎵 MUSIC switch on the title
// build 574 (Matt: "i wonder if we put a juke box player strip in the top that tells the title and alllows you to skip"): the 🎵 MUSIC button becomes a JUKEBOX STRIP at the top left of the title --
// little dancing bars, NOW PLAYING and the song's name, ⏭ to skip to the next one in the rotation, and 🔊/🔇 for the music switch. With the music off the strip says so (Matt's own title was silent
// because his switch was off -- now it shows) and a click turns it on.
const NAMES={ title:'Heartroot Rap', title2:'Guard the Heartroot · Tavern', title3:'Guard the Heartroot · Rap', title4:'Guard the Heartroot · Country', title5:'Guard the Heartroot · Sea Chanty' };
function skip(){ if(!musicOn) return false; cur=(cur+1)%ORDER.length; keep(); cnt.skipped=(cnt.skipped|0)+1; try{ setMusic(song()); }catch(e){} return true; }
const st=document.getElementById('start'); if(st){ const css=document.createElement('style'); css.textContent=
 '#jukebox{position:absolute;top:52px;left:12px;z-index:2;display:flex;align-items:center;gap:10px;background:linear-gradient(#2a1608,#140904);border:2px solid #c9962f;border-radius:999px;padding:5px 6px 5px 14px;color:#ffe2b8;font:13px Georgia,serif;box-shadow:0 2px 0 #000,0 0 14px #0008;max-width:min(440px,70vw)}'+
 '#jukebox .eq{display:flex;align-items:flex-end;gap:2px;height:16px;width:18px;flex:none}#jukebox .eq i{flex:1;background:#ffd27a;border-radius:1px;height:30%;animation:jbq .9s ease-in-out infinite}#jukebox .eq i:nth-child(2){animation-delay:-.3s}#jukebox .eq i:nth-child(3){animation-delay:-.6s}'+
 '@keyframes jbq{0%,100%{height:25%}50%{height:100%}}#jukebox.off .eq i,#jukebox.wait .eq i{animation:none;height:25%;opacity:.5}'+
 '#jukebox .t{display:flex;flex-direction:column;min-width:0;line-height:1.15}#jukebox .np{font:bold 9px system-ui,sans-serif;letter-spacing:2px;color:#c9962f}#jukebox .nm{font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
 '#jukebox button{flex:none;width:32px;height:32px;border-radius:50%;border:2px solid #c9962f;background:#3a1a10;color:#ffe2b8;font:15px/1 system-ui;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}#jukebox button:hover{border-color:#ffd27a;background:#5a2a14}'+
 '#jukebox .vol{flex:none;width:76px;height:6px;-webkit-appearance:none;appearance:none;border-radius:3px;background:linear-gradient(90deg,#ffd27a var(--v,60%),#3a2a14 var(--v,60%));cursor:pointer;margin:0 2px}#jukebox .vol::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#ffe2b8;border:2px solid #c9962f}'+
 '#jukebox.off{opacity:.85;cursor:pointer}#jukebox.off .nm{color:#c9b8a0}#jukebox.off .sk{display:none}';
  document.head.appendChild(css);
  // build 581 (Matt: "in the hall room, if the music is turned down or set to off, it comes thru to the title screen as well, but theres no audio controls on the title screen"): the strip carries
  // the MUSIC VOLUME too (the sound menu's music slider, 41-soundmenu.js window.__sound -- the same saved value), and says so when the game's sound is OFF (M / the speaker in the hall) or the music
  // volume is at nothing: one click on the strip fixes either.
  const b=document.createElement('div'); b.id='jukebox'; b.innerHTML='<span class="eq"><i></i><i></i><i></i></span><span class="t"><span class="np">NOW PLAYING</span><span class="nm"></span></span><input class="vol" type="range" min="0" max="1" step="0.05" title="Music volume"><button class="sk" type="button" title="Next song">⏭</button><button class="mu" type="button" title="Music on / off">🔊</button>';
  const nm=b.querySelector('.nm'), np=b.querySelector('.np'), mu=b.querySelector('.mu'), vol=b.querySelector('.vol');
  const SND=()=>window.__sound&&window.__sound.get?window.__sound:null, mvol=()=>{ const S=SND(); return S?(+S.get().music||0):1; }, sOff=()=>typeof soundOff!=='undefined'&&!!soundOff;
  const label=()=>{ const on=!!musicOn, so=sOff(), v=mvol(), quiet=v<.02, tr=typeof musTrack!=='undefined'&&isTitle(musTrack)?musTrack:null;
    const bad=so||!on||quiet; b.classList.toggle('off',bad); b.classList.toggle('wait',!bad&&!tr);
    const loading=!bad&&!tr&&typeof musicMode!=='undefined'&&isTitle(musicMode)&&!!((musFetch.busy&&musFetch.busy[musicMode])||(typeof musDecoding!=='undefined'&&musDecoding[musicMode])); b.classList.toggle('load',loading);
    np.textContent=so?'SOUND OFF':!on?'MUSIC OFF':quiet?'MUSIC VOLUME 0':tr?'NOW PLAYING':loading?'LOADING SONG…':'CLICK TO PLAY';
    nm.textContent=so?'click to turn sound on':!on?'click to turn it on':quiet?'click to turn it up':(NAMES[tr||song()]||''); mu.textContent=on&&!so?'🔊':'🔇';
    if(document.activeElement!==vol) vol.value=String(v); vol.style.setProperty('--v',Math.round(v*100)+'%'); };
  label(); setInterval(label,400);
  vol.addEventListener('input',e=>{ e.stopPropagation(); const S=SND(); if(S) S.set('music',+vol.value); if(+vol.value>0&&!musicOn){ toggleMusic(); } label(); });
  for(const ev of ['click','pointerdown','keydown']) vol.addEventListener(ev,e=>e.stopPropagation());
  b.addEventListener('click',e=>{ e.stopPropagation(); if(e.target.closest('.vol')) return; const k=e.target.closest('button');
    if(k&&k.classList.contains('sk')){ skip(); label(); return; }
    if(sOff()){ try{ setSound(true); }catch(er){} label(); return; }
    if(k&&k.classList.contains('mu')||!musicOn){ toggleMusic(); label(); return; }
    if(mvol()<.02){ const S=SND(); if(S) S.set('music',.6); label(); return; }
    if(!(typeof musTrack!=='undefined'&&isTitle(musTrack))) try{ musicForPhase(); }catch(er){} label(); });
  st.appendChild(b);
  window.__titlemusic={ label, skip, names:NAMES, mode:()=>typeof musicMode!=='undefined'?musicMode:null, song, songs:()=>SONGS.map(x=>x[0]), order:()=>ORDER.slice(), info:()=>Object.assign({ cur },cnt),
    looping:()=>!!(musNode&&musNode.loop), finish:()=>{ const n=musNode; if(n&&n.onended) n.onended(); return !!n; } };   // test hooks: is the song on a loop; end it now as if it had played out
}
})();
