// ===== THE JUKEBOX IN THE HALL (build 582). Matt, of the title's jukebox strip: "id love to have this juke box option in game".
//  * the 🎵 button (top right of the hall) opens a JUKEBOX: every song -- the hall's own theme and the five title songs -- one tap to play it, the music volume (the sound menu's music slider),
//    and music on/off. (N still switches the music on and off straight away.)
//  * J skips to the next song without opening anything; a small NOW PLAYING card shows its name for a moment.
//  * your pick plays through the BUILD phase (looping), on every map, and is remembered (dd_hall_song). WAVES keep their battle music and the bosses theirs (my call -- flagged to Matt); the pick
//    comes back when the hall is held. The title keeps its own rotation (40b-titlemusic.js).
// Test hook: window.__jukebox.
(function(){
'use strict';
if(typeof TRACKS==='undefined'||typeof musicForPhase!=='function') return;
const LIST=[['build','Hall Theme'],['title','Heartroot Rap'],['title2','Guard the Heartroot · Tavern'],['title3','Guard the Heartroot · Rap'],['title4','Guard the Heartroot · Country'],['title5','Guard the Heartroot · Sea Chanty']].filter(x=>TRACKS[x[0]]);
const NAME=Object.fromEntries(LIST);
let pick='build', chosen=false; try{ const v=localStorage.getItem('dd_hall_song'); if(v&&NAME[v]){ pick=v; chosen=true; } }catch(e){}
// build 612 (Matt: "if juke is on overide the combat music"): once a song has been picked on the jukebox (any song, the Hall Theme too), it plays through the WAVES as well -- the battle music only plays
// for a player who never picked one. The bosses keep their own themes (my call: they are the big moments).
const juke=()=>chosen&&!!TRACKS[pick];
const cnt={ picks:0, skips:0, cards:0 };
const save=()=>{ try{ localStorage.setItem('dd_hall_song',pick); }catch(e){} };
// the build phase plays the pick
{ const prev=musicForPhase; musicForPhase=function(){ if(S.phase==='build'&&pick!=='build'&&TRACKS[pick]) return setMusic(pick); if(S.phase==='wave'&&juke()) return setMusic(pick); return prev.apply(this,arguments); }; }
// and any straight call for the hall theme in the build phase (PLAY's own, a tutorial's, a scene's way back) gets the pick too
{ const prev=setMusic; setMusic=function(m){ if(m==='wave'&&juke()) return prev.call(this,pick); if(m==='build'&&S.phase==='build'&&pick!=='build'&&TRACKS[pick]) return prev.call(this,pick); return prev.apply(this,arguments); }; }
function choose(k,quiet){ if(!NAME[k]) return false; pick=k; chosen=true; save(); if(S.phase==='wave'){ try{ musicForPhase(); }catch(e){} } cnt.picks++; if(!musicOn&&!quiet) toggleMusic(); if(S.phase==='build'){ try{ musicForPhase(); }catch(e){} } card(); paint(); return true; }
function next(){ const i=LIST.findIndex(x=>x[0]===pick); cnt.skips++; return choose(LIST[(i+1)%LIST.length][0],true); }
// ---- the NOW PLAYING card
const css=document.createElement('style'); css.textContent=
 '#jbcard{position:fixed;top:118px;left:50%;transform:translateX(-50%);z-index:27;pointer-events:none;display:flex;align-items:center;gap:10px;background:#0b0912ee;border:2px solid #c9962f;border-radius:999px;padding:6px 16px;color:#ffe2b8;font:bold 15px Georgia,serif;box-shadow:0 3px 14px #000;opacity:0;transition:opacity .35s}#jbcard.on{opacity:1}#jbcard .np{font:bold 9px system-ui;letter-spacing:2px;color:#c9962f;display:block}'+
 '#jbpop{position:fixed;z-index:60;display:none;width:300px;background:linear-gradient(#2a1608,#140904);border:2px solid #c9962f;border-radius:14px;padding:10px;color:#ffe2b8;font:14px Georgia,serif;box-shadow:0 8px 24px #000}#jbpop.on{display:block}'+
 '#jbpop h4{margin:0 0 8px;font:bold 15px Georgia,serif;letter-spacing:3px;color:#ffd27a;text-align:center}#jbpop .s{display:flex;align-items:center;gap:8px;padding:7px 10px;margin:3px 0;border-radius:9px;cursor:pointer;border:1px solid #ffffff12;background:#ffffff08}#jbpop .s:hover{border-color:#ffd27a}'+
 '#jbpop .s.on{border-color:#ffd27a;background:#ffd27a22;color:#fff}#jbpop .s .b{width:16px;text-align:center}#jbpop .row{display:flex;align-items:center;gap:8px;margin-top:8px}#jbpop input{flex:1;accent-color:#ffd27a}#jbpop button{background:#3a1a10;border:2px solid #c9962f;border-radius:999px;color:#ffe2b8;font:bold 13px Georgia,serif;padding:4px 10px;cursor:pointer}#jbpop .k{margin-top:6px;text-align:center;color:#c9b8a0;font-size:12px}#jbpop kbd{border:1px solid #c9962f;border-radius:4px;padding:0 4px;color:#ffd27a}';
document.head.appendChild(css);
const cardEl=document.createElement('div'); cardEl.id='jbcard'; document.body.appendChild(cardEl);
let cardT=null; function card(){ cardEl.innerHTML='🎵<span><span class="np">NOW PLAYING</span>'+NAME[pick]+'</span>'; cardEl.classList.add('on'); cnt.cards++; clearTimeout(cardT); cardT=setTimeout(()=>cardEl.classList.remove('on'),2600); }
// ---- the popover under the 🎵 button
const pop=document.createElement('div'); pop.id='jbpop'; document.body.appendChild(pop);
const SND=()=>window.__sound&&window.__sound.get?window.__sound:null;
function paint(){ if(!pop.classList.contains('on')) return; const S_=SND(), v=S_?(+S_.get().music||0):1;
  pop.innerHTML='<h4>🎵 JUKEBOX</h4>'+LIST.map(([k,n])=>'<div class="s'+(k===pick?' on':'')+'" data-k="'+k+'"><span class="b">'+(k===pick?'▶':'')+'</span>'+n+'</div>').join('')+
   '<div class="row">🔈<input type="range" min="0" max="1" step="0.05" value="'+v+'" title="Music volume">🔊<button class="mu" type="button">'+(musicOn?'MUSIC ON':'MUSIC OFF')+'</button></div><div class="k"><kbd>J</kbd> next song · <kbd>N</kbd> music on/off · waves keep their battle music</div>';
  pop.querySelector('input').addEventListener('input',e=>{ const S2=SND(); if(S2) S2.set('music',+e.target.value); if(+e.target.value>0&&!musicOn) toggleMusic(); }); }
function openPop(){ const b=document.getElementById('musbtn'); const r=b?b.getBoundingClientRect():{ right:innerWidth-12, bottom:120 }; pop.style.left=Math.max(8,r.right-300)+'px'; pop.style.top=(r.bottom+8)+'px'; pop.classList.add('on'); paint(); }
function closePop(){ pop.classList.remove('on'); }
pop.addEventListener('click',e=>{ e.stopPropagation(); const s=e.target.closest('.s'); if(s){ choose(s.dataset.k); return; } if(e.target.closest('.mu')){ toggleMusic(); paint(); } });
addEventListener('pointerdown',e=>{ if(pop.classList.contains('on')&&!e.target.closest('#jbpop')&&!e.target.closest('#musbtn')) closePop(); },true);
{ const b=document.getElementById('musbtn'); if(b){ b.onclick=e=>{ e&&e.stopPropagation&&e.stopPropagation(); if(pop.classList.contains('on')) closePop(); else openPop(); }; b.title='Jukebox: pick a song (J = next, N = music on/off)'; } }
addEventListener('keydown',e=>{ if(e.repeat||S.phase==='start') return; try{ if(Meta.isOpen()) return; }catch(er){}
  const t=e.target&&e.target.tagName; if(t==='INPUT'||t==='TEXTAREA') return;
  if(e.code==='KeyJ'){ e.preventDefault(); next(); }
  else if(e.code==='Escape'&&pop.classList.contains('on')){ closePop(); } });
window.__jukebox={ info:()=>Object.assign({ pick, name:NAME[pick], list:LIST.map(x=>x[0]), open:pop.classList.contains('on'), card:cardEl.classList.contains('on') },cnt), choose, next, open:openPop, close:closePop };
})();
