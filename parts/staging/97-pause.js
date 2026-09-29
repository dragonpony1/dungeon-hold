// ===== PAUSE (Escape): in the hall, Escape — or the mouse leaving pointer lock — opens a small menu over the frozen scene (frozen
// playing alone; in co-op the hall runs on under it, build 159 -- see 99-network.js):
// RESUME, or RETURN TO TITLE (which reloads the page; gold, gear, skills and map progress are saved as they happen, the
// run itself is forfeited). Escape while placing still cancels the placement first, and the tavern or the sheet keep
// their own Escape.
(function(){
const css=`#pause{z-index:12;background:#0b0712c8}#pause .pz{background:linear-gradient(#2a1f33f8,#160f1cf8);border:2px solid #6b5a3c;border-radius:12px;box-shadow:0 6px 0 #000,0 0 30px #000a;padding:22px 30px 24px;text-align:center;color:#f1e6d0;min-width:280px}
#pause h1{font-size:28px;letter-spacing:6px;margin:0 0 6px;color:var(--gold,#ffc040);text-shadow:0 2px 0 #000}#pause p{font-size:13px;color:#bfae90;margin:0 0 14px;letter-spacing:1px}
#pause button{display:block;width:100%;margin:8px 0;background:linear-gradient(#7a2a2e,#3e1416);border:2px solid var(--gold,#ffc040);border-radius:8px;color:#fff;font:bold 15px Georgia,serif;letter-spacing:2px;padding:11px 16px;cursor:pointer;box-shadow:0 3px 0 #000}#pause button.quiet{background:#1c1424;border-color:#6b5a3c;color:#f1e6d0}#pause button:hover{filter:brightness(1.15)}`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
const P={open:false,el:null,wantLock:false,line:null};
// build 159 (2/7): in co-op the hall doesn't stop for anyone's menu (99-network.js), so the card doesn't promise it does -- for the
// host with friends in its hall and for a guest alike. Hosting alone, it holds its breath as ever
function hallLine(){ const n=window.__net, runs=!!(n&&n.hallRuns&&n.hallRuns()); if(!runs) return 'the hall holds its breath'; return n.role()==='guest'?"the host's hall doesn't stop — the fight goes on":"the hall doesn't stop in co-op — your friends are still fighting"; }
// build 160: on the victory lap the card also offers MOVE ON -- on a computer the mouse is captured while you play, so the ▶ MOVE ON
// button up top can't be clicked; G works, and now so does Esc → MOVE ON. Not for a guest: the host moves the party on
const canMoveOn=()=>!!S.held&&S.phase==='build'&&!(window.__net&&window.__net.role&&window.__net.role()==='guest');
function setLine(){ if(!P.line) return; const t=hallLine(); if(P.line.textContent!==t) P.line.textContent=t; if(P.mv){ const d=canMoveOn()?'':'none'; if(P.mv.style.display!==d) P.mv.style.display=d; } }
function ensure(){ if(P.el) return; const el=document.createElement('div'); el.id='pause'; el.className='screen hide'; el.innerHTML='<div class="pz"><h1>PAUSED</h1><p class="pzl">the hall holds its breath</p><button data-act="resume">▶ RESUME</button><button data-act="moveon" style="display:none">▶ MOVE ON — the hall is held</button><button class="quiet" data-act="share">📤 SHARE ROOTGATE</button><button class="quiet" data-act="title">⌂ RETURN TO TITLE SCREEN</button><p style="margin:12px 0 0">Esc resumes · gold, gear and skills are already saved</p></div>'; document.body.appendChild(el);
  el.addEventListener('click',e=>{ const a=e.target.closest('[data-act]'); if(!a) return; if(a.dataset.act==='resume') close(true); else if(a.dataset.act==='moveon'){ close(false); if(canMoveOn()) startWave(); } else if(a.dataset.act==='title') toTitle(); else if(a.dataset.act==='share'&&window.__share) window.__share.go(a,'✓ LINK COPIED — paste it in a text'); }); P.el=el; P.line=el.querySelector('.pzl'); P.mv=el.querySelector('[data-act="moveon"]'); }
function canPause(){ return (S.phase==='build'||S.phase==='wave')&&!Meta.isOpen()&&!(window.__hideout&&window.__hideout.isOpen&&window.__hideout.isOpen()); }   // build 241 (Matt: in the hideout Escape is for getting out of menus, never the game menu)
function open(){ ensure(); if(P.open||!canPause()) return false; P.open=true; setLine(); P.el.classList.remove('hide'); if(document.pointerLockElement&&document.exitPointerLock) document.exitPointerLock(); document.body.classList.remove('play'); for(const k in K) K[k]=0; return true; }
function close(relock){ if(!P.open) return false; P.open=false; P.el.classList.add('hide'); if(relock&&!TOUCH&&canvas.requestPointerLock){ try{ canvas.requestPointerLock(); }catch(e){} } return true; }
function toTitle(){ P.open=false; location.reload(); }
{ const prev=Meta.isOpen; Meta.isOpen=()=>P.open||!!prev(); }
{ const prev=Meta.hud; Meta.hud=()=>{ prev(); if(P.open) setLine(); }; }   // a friend joining or the last one leaving while the card is up changes what it should say
// Escape (when the browser lets it through) toggles; leaving pointer lock in the middle of play opens it
addEventListener('keydown',e=>{ if(e.code!=='Escape'||e.repeat) return; if(P.open){ e.preventDefault(); e.stopImmediatePropagation(); close(true); return; } if(typeof placing!=='undefined'&&placing) return; if(canPause()){ e.preventDefault(); e.stopImmediatePropagation(); open(); } },true);
document.addEventListener('pointerlockchange',()=>{ if(document.pointerLockElement!==canvas&&!TOUCH&&canPause()&&!(typeof placing!=='undefined'&&placing)) open(); });
window.__pause={open,close,isOpen:()=>P.open,toTitle};
})();
