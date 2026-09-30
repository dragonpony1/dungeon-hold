// ===== L LOCKS AND UNLOCKS A BAG PIECE (build 340). Matt: "is there a hot key that toggles lock and unlock" -> "yeah L to unlock or lock item in bag". With the bag open (B -- also over the hideout) or the
// character sheet (Tab), L flips the lock on the piece under your mouse, or the one you have selected if you are not pointing at one. A locked piece is never scrapped at the portal or sold as junk (10-meta.js
// toggleLock); its card wears the 🔒. A worn piece, or anything that is not in the bag, is told so and left alone. The buttons say (L) so it can be found.
(function(){
'use strict';
let hov=null;
addEventListener('mouseover',e=>{ hov=e.target; },true);
const idUnder=root=>{ const t=hov&&hov.closest?hov.closest(root+' [data-id]'):null; return t&&t.dataset.id?t.dataset.id:null; };
function targetId(){
  const TV=window.__tavern, DL=window.__doll;
  if(TV&&TV.isOpen()){ const id=idUnder('#tavern'); if(id) return {id,where:'tavern'}; const b=document.querySelector('#tv-detail [data-act="lock"]'); return {id:b&&b.dataset.id||null,where:'tavern'}; }
  if(DL&&DL.isOpen()){ const id=idUnder('#doll'); if(id) return {id,where:'doll'}; const s=DL.selected&&DL.selected(); return {id:s&&s.id||null,where:'doll'}; }
  return null; }
function flip(){ const T=targetId(); if(!T) return false; if(!T.id){ toast('🔒 Point at a piece in your bag, then L'); return true; }
  const it=Meta.bag().find(b=>b.id===T.id); const on=Meta.toggleLock(T.id);
  if(on===null){ toast('🔒 Only pieces in your bag can be locked'); return true; }
  toast((on?'🔒 Locked':'🔓 Unlocked')+' · '+(it&&it.name||'piece'));
  try{ SFX.place&&SFX.place(); }catch(e){}
  if(T.where==='tavern') window.__tavern.select(T.id,'bag'); else window.__doll.select(T.id,'bag');   // re-draws the card, the 🔒 and the button, and keeps that piece selected
  return true; }
addEventListener('keydown',e=>{ if(e.code!=='KeyL'||e.repeat||e.ctrlKey||e.metaKey||e.altKey) return; const ae=document.activeElement; if(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA')) return;
  if(flip()){ e.preventDefault(); e.stopImmediatePropagation(); } },true);
window.__lockkey={flip,target:targetId};
})();
