// ===== L LOCKS AND UNLOCKS A BAG PIECE (build 340). Matt: "is there a hot key that toggles lock and unlock" -> "yeah L to unlock or lock item in bag". With the bag open (B -- also over the hideout) or the
// character sheet (Tab), L flips the lock on the piece under your mouse, or the one you have selected if you are not pointing at one. A locked piece is never scrapped at the portal or sold as junk (10-meta.js
// toggleLock); its card wears the 🔒. A worn piece, or anything that is not in the bag, is told so and left alone. The buttons say (L) so it can be found.
(function(){
'use strict';
// where the mouse is AT THE MOMENT of the key, not the last card it touched: pressing L redraws the cards, which replaces the one under the pointer, so a remembered card would be stale for the next press (build 341)
let mx=-1, my=-1;
addEventListener('mousemove',e=>{ mx=e.clientX; my=e.clientY; },true);
const idUnder=root=>{ if(mx<0) return null; const el=document.elementFromPoint(mx,my); const t=el&&el.closest?el.closest(root+' [data-id]'):null; return t&&t.dataset.id?t.dataset.id:null; };
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
  // build 341 (Matt: "everytime i mouse over and unlock something the whole item card opens up. that should be on left click only just leave closed on lock/unlock"): redraw only -- never select the piece,
  // so a card that is open stays as it is (the one you clicked) and a closed one stays closed
  if(T.where==='tavern') window.__tavern.tab('bag'); else { const s=window.__doll.selected&&window.__doll.selected(); window.__doll.select(s?s.id:null,s?s.from:'bag',s&&s.slot); }
  return true; }
addEventListener('keydown',e=>{ if(e.code!=='KeyL'||e.repeat||e.ctrlKey||e.metaKey||e.altKey) return; const ae=document.activeElement; if(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA')) return;
  if(flip()){ e.preventDefault(); e.stopImmediatePropagation(); } },true);
// build 341 (Matt: "does the bag tell you L to lock/unlock anywhere?"): a small 🔒 L chip in the bag's header row, with the whole rule in its tooltip (the open card's button already says (L))
const st=document.createElement('style'); st.textContent='.lk-hint{display:inline-flex;align-items:center;gap:4px;margin-left:8px;padding:1px 7px;border-radius:9px;border:1px solid #6a5a3a;background:#2a2218;color:#e8d29a!important;font:700 11px system-ui;cursor:help}.lk-hint kbd{font:800 11px system-ui;padding:0 5px;border-radius:4px;border:1px solid #c89a4a;background:#140e1a}'; document.head.appendChild(st);
if(typeof tvRenderBag==='function'){ const prev=tvRenderBag; tvRenderBag=function(){ prev.apply(this,arguments); const sub=document.querySelector('#tv-bag .tv-bag2 > div:nth-child(2) > .tv-sub'); if(sub&&!sub.querySelector('.lk-hint')){ const h=document.createElement('span'); h.className='lk-hint'; h.title='Point at a piece in your bag and press L to lock or unlock it -- a locked piece is never scrapped or sold as junk'; h.innerHTML='<kbd>L</kbd> 🔒 lock'; const n=sub.querySelector('.tv-n'); if(n) n.after(h); else sub.appendChild(h); } }; }
window.__lockkey={flip,target:targetId};
})();
