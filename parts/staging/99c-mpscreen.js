// ===== THE MULTIPLAYER SCREEN (build 151): "the title screen is too busy -- one button that says multiplayer, then a new screen
// that says host or join with the rows of who's joined". The title keeps one button; HOST A GAME / JOIN A FRIEND, the code
// field and the lobby (roster, lights, START) live on their own screen (parts/head.html #mpScreen), which the button opens,
// BACK closes (leaving any lobby), a page that reloaded into a lobby (?coopjoin) opens by itself, and the game starting closes.
(function(){
const scr=$('mpScreen'), btn=$('mpbtn'), back=$('mpBack'); if(!scr||!btn) return;
function heroRow(){ const el=$('mpHeroName'); if(!el||!window.__heroes) return; const id=window.__heroes.pick(); const h=(window.__heroes.list()||[]).find(x=>x.id===id); el.textContent=h?h.name:id; }   // the hero is picked on the title's cards; this row says which and can cycle (the raven's H) without leaving the lobby
function open(){ scr.classList.remove('hide'); heroRow(); }
function close(){ scr.classList.add('hide'); }
btn.addEventListener('click',e=>{ e.stopPropagation(); open(); });
back.addEventListener('click',e=>{ e.stopPropagation(); const L=window.__lobby&&window.__lobby.state?window.__lobby.state():null; if(L&&L.phase!=='off'){ $('lobbyLeave').click(); } else if(window.__net&&window.__net.role&&window.__net.role()){ try{ window.__net.leave(); }catch(err){} }
  $('hostPanel').classList.add('hide'); $('joinPanel').classList.add('hide'); $('coopRow').classList.remove('hide'); close(); });
setInterval(()=>{ const st=$('start'); const on=!scr.classList.contains('hide'); if(S.phase!=='start'){ if(on) close(); return; } if(!on&&(st.classList.contains('inLobby')||st.classList.contains('coopPage'))) open(); },250);
{ const b=$('mpHeroNext'); if(b) b.addEventListener('click',e=>{ e.stopPropagation(); if(window.__heroes&&window.__heroes.next) window.__heroes.next(); heroRow(); }); }
setInterval(()=>{ if(!scr.classList.contains('hide')) heroRow(); },500);   // a pick made elsewhere (a card, the H key) shows here too
window.__mp={open,close,isOpen:()=>!scr.classList.contains('hide'),hero:()=>($('mpHeroName')||{}).textContent||''};
})();
// ===== build 159 (7/7, LC9): TWO TABS, ONE SAVE. Gold, xp, the bag and the gear live in this browser's storage (ddMeta, ddGear), and each
// tab writes its whole copy on every change -- so two tabs of the game in one browser overwrite each other: the host and a "guest" tried
// out side by side, or two players sharing one PC, and one tab's run earnings are gone the next time the other saves. Merging two live
// saves is not safe to do quietly; saying so is. Every tab asks on a BroadcastChannel when it loads (and every few seconds while it is in
// front) whether the game is open anywhere else in this browser; any other tab answers, and while one has, the title screen and the
// multiplayer screen carry a note. A tab says goodbye as it goes, and one that stops answering (crashed) is forgotten after TAB_STALE_MS.
// A private window, or another browser, has its own storage and never hears this channel -- which is exactly the advice. Warning only:
// nothing is blocked. A browser without BroadcastChannel (older iPhones) simply never shows it
(function(){
const TAB_STALE_MS=20000, ASK_MS=5000;
const others=new Map();   // another tab of the game -> when it last spoke
const notes=[];
function note(host,before){ if(!host) return; const d=document.createElement('div'); d.className='tabWarn hide'; d.setAttribute('role','status');
  d.textContent="Rootgate is also open in another tab of this browser — only one tab's gold and gear will be kept. For a second player on this PC, use another browser or a private window.";   // both tabs say it: either one's saves can overwrite the other's
  if(before&&before.parentNode===host) host.insertBefore(d,before); else host.appendChild(d); notes.push(d); }
{ const st=$('start'); note(st,st&&st.querySelector('#essentials')); const box=document.querySelector('#mpScreen .mpBox'); note(box,$('mpHero')); }
function show(){ const now=Date.now(); others.forEach((t,k)=>{ if(now-t>TAB_STALE_MS) others.delete(k); }); const on=others.size>0; notes.forEach(d=>d.classList.toggle('hide',!on)); }
let bc=null; try{ bc=new BroadcastChannel('rootgate'); }catch(e){}
if(bc){ const me=Math.random().toString(36).slice(2,10);
  const say=t=>{ try{ bc.postMessage({t,from:me}); }catch(e){} };
  bc.onmessage=e=>{ const d=e.data; if(!d||typeof d!=='object'||typeof d.from!=='string'||d.from===me) return;
    if(d.t==='bye') others.delete(d.from); else { others.set(d.from,Date.now()); if(d.t==='hello') say('here'); }
    show(); };
  say('hello');
  setInterval(()=>{ if(!document.hidden) say('hello'); show(); },ASK_MS);   // the tab in front keeps asking; a tab behind it answers from its message handler, which a hidden tab's timer limits don't slow
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) say('hello'); });
  addEventListener('pagehide',()=>say('bye'));
  addEventListener('pageshow',e=>{ if(e.persisted) say('hello'); }); }   // back from the browser's back/forward cache
window.__tabs={ others:()=>others.size, shown:()=>notes.some(d=>!d.classList.contains('hide')) };   // a test hook
})();
