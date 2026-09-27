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
