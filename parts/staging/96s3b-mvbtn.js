// ===== THE MUSIC VIDEO ON THE TITLE SCREEN (build 584). Matt, of his "Guard the Heartroot" (country) music video: "can we link it from the title screen? ive put it on youtube".
// A "🎬 MUSIC VIDEO" button under ▶ TRAILER opens it on YouTube in a new tab (the desktop app sends it to the normal browser). The title music pauses while you are away
// (my call: it would play over the video) and picks up where it was when you come back to the game. Never on a co-op join page or in the tutorial. Test hook: window.__mvbtn.
(function(){
if(typeof TUTORIAL!=='undefined'&&TUTORIAL) return; if(typeof COOPJOIN!=='undefined'&&COOPJOIN) return;
const URL_='https://youtu.be/JGscUjm0Ehg';
const css=document.createElement('style'); css.textContent='#mvbtn{position:absolute;top:134px;right:12px;z-index:2;background:linear-gradient(#3a1a10,#1a0b06);border:2px solid #c9962f;border-radius:999px;color:#ffe2b8;font:bold 13px Georgia,serif;letter-spacing:2px;padding:7px 14px;cursor:pointer;box-shadow:0 2px 0 #000}#mvbtn:hover{border-color:#ffd27a;color:#fff}';
document.head.appendChild(css);
let opens=0, paused=false;
function resume(){ if(!paused) return; paused=false; try{ if(typeof ac!=='undefined'&&ac&&ac.state==='suspended') ac.resume(); }catch(e){} }
function open(){ opens++; try{ if(document.exitPointerLock) document.exitPointerLock(); }catch(e){}
  try{ if(S.phase==='start'&&typeof ac!=='undefined'&&ac&&ac.state==='running'){ ac.suspend(); paused=true; } }catch(e){}
  try{ window.open(URL_,'_blank','noopener'); }catch(e){} }
addEventListener('focus',resume); document.addEventListener('visibilitychange',()=>{ if(!document.hidden) setTimeout(()=>{ if(document.hasFocus()) resume(); },50); });
addEventListener('pointerdown',resume,true);
const st=document.getElementById('start'); if(st){ const b=document.createElement('button'); b.id='mvbtn'; b.type='button'; b.textContent='🎬 MUSIC VIDEO'; b.title='Guard the Heartroot · the music video (YouTube)'; b.addEventListener('click',e=>{ e.stopPropagation(); open(); }); st.appendChild(b); }
window.__mvbtn={ url:URL_, ac:()=>(typeof ac!=="undefined"&&ac)?ac.state:null, open, opens:()=>opens, paused:()=>paused, resume };
})();
