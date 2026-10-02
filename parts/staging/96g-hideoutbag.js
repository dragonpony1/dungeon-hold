// ===== YOUR BAG IN THE HIDEOUT, SALVAGE STRAIGHT INTO THE CAULDRON, AND WHAT YOU OWN FOR THE FORGE (build 298). Matt: "while in the hideout you need to be able to see what you have on ... why cant b for bag just
// work in the hide out. pull the salvagable gear right of it. or let me dump with a button into the cauldron. heres why, when i go to the forge i need to pick what piece i am going for, but i cant remember
// what part of my set i am missing. i shouldnt have to back to the hall for a look".
//   * B in the hideout (the hideout page posts 'hideout:bag' up to us, hideout build 69) opens THE TAVERN'S BAG right over it: what every slot has on, the bag, the picture cards and the forge on each card
//     (96f-tavernpics.js). B, Esc or the footer button closes it and hands the hideout back ('hideout:bagClosed': a click steps back in).
//   * There, an unlocked piece in the bag can be SALVAGED into the Cauldron Cart from its card, and "🧪 Salvage unlocked" does them all -- counted exactly as the portal counts scrap (59-hideout.js carryGear:
//     dd_gear_bag, by rarity), and the hideout is told to re-read it at once ('hideout:scrap'). Worn and locked pieces are never salvaged.
//   * WHAT YOU OWN of every set is written for the forge (localStorage dd_owned_sets): for each set, each slot, where the piece is -- worn by this hero, worn by another, in the bag, in the armory -- whenever the
//     hideout is up and your gear changes. The forge shows it as dots on each set and a ✓ / missing mark on each piece (hideout build 69).
// Test hook: window.__hideoutbag.
(function(){
const H=window.__hideout, T=window.__tavern; if(!H||!T) return;
const OWN_KEY='dd_owned_sets', RK=['common','uncommon','rare','epic','legendary'], RANK={worn:4,wornOther:3,bag:2,armory:1};
let fromHideout=false, lastV=null, lastOwned='';
function writeOwned(){ try{ const S=Meta.sets; if(!S) return; const sets={};
    const put=(it,where)=>{ const n=it&&S.setOf(it); if(!n||!it.slot) return; const o=sets[n]=sets[n]||{}; if(!o[it.slot]||RANK[where]>RANK[o[it.slot]]) o[it.slot]=where; };
    for(const s of SLOTS) put(gear[s],'worn');
    if(Meta.allWorn) for(const it of Meta.allWorn()) put(it,'wornOther');
    for(const it of Meta.bag()) put(it,'bag');
    if(Meta.armory) for(const it of Meta.armory()) put(it,'armory');
    const s=JSON.stringify({v:1,sets}); if(s!==lastOwned){ lastOwned=s; localStorage.setItem(OWN_KEY,s); } }catch(e){} }
setInterval(()=>{ if(!H.isOpen()){ lastV=null; return; } const v=Meta.version(); if(v!==lastV){ lastV=v; writeOwned(); } },700);
function tell(msg){ try{ const w=H.frameWin(); if(w) w.postMessage(msg,'*'); }catch(e){} }
// ---- salvage: out of the bag, into the Cart's scrap, the portal's own way
function salvage(items){ const b=H.readBag(); RK.forEach(k=>{ b[k]=Math.max(0,Math.floor(+b[k])||0); }); const bag=Meta.bag(); const got={}; let n=0;
  for(const it of items){ const i=bag.indexOf(it); if(i<0||!it||it.locked) continue; bag.splice(i,1); const k=RK[Math.max(0,Math.min(4,Math.round(+it.rarity)||0))]; b[k]++; got[k]=(got[k]||0)+1; n++; }
  if(!n) return {n:0,got}; try{ localStorage.setItem(H.BAG_KEY,JSON.stringify(b)); }catch(e){} Meta.save(); tell('hideout:scrap'); writeOwned(); try{ SFX.mana(); }catch(e){} return {n,got}; }
const salvageable=()=>Meta.bag().filter(it=>it&&!it.locked);
// ---- the bag over the hideout
function openBag(){ if(!H.isOpen()||T.isOpen()) return false; fromHideout=true; writeOwned(); const el=$('tavern'); if(el) el.style.zIndex='25';
  try{ const f=document.querySelector('#hideoutWrap iframe'); if(f) f.blur(); window.focus(); }catch(e){} T.open(); T.tab('bag'); return true; }
addEventListener('message',e=>{ const w=H.frameWin(); if(!w||e.source!==w) return; if(e.data==='hideout:bag') openBag(); else if(e.data==='hideout:sheet') openSheet(); else if(e.data==='hideout:devpanel'&&window.__devpanel) window.__devpanel.toggle(); });   // build 301 (Matt: "is the dev hud not working anymore?"): F9 inside the hideout, hideout build 70
// build 440 (Matt: "that tab menu, the one we were calling tavern, needs to work in the hideout"): Tab in the hideout (it posts 'hideout:sheet', hideout build 82) opens the CHARACTER SHEET (68-paperdoll.js) right over
// the room, as B opens the bag. Tab, C, Esc or its ✕ close it; the room is handed back the same way ('hideout:bagClosed': a click steps back in).
let sheetFromHideout=false;
function openSheet(){ const Dl=window.__doll; if(!H.isOpen()||!Dl||Dl.isOpen()||T.isOpen()) return false; sheetFromHideout=true; writeOwned(); const el=$('doll'); if(el) el.style.zIndex='25';
  try{ const f=document.querySelector('#hideoutWrap iframe'); if(f) f.blur(); window.focus(); }catch(e){} Dl.open(); return true; }
setInterval(()=>{ if(!sheetFromHideout) return; const Dl=window.__doll; if(Dl&&Dl.isOpen()&&H.isOpen()) return; if(Dl&&Dl.isOpen()) Dl.close(); sheetFromHideout=false; const el=$('doll'); if(el) el.style.zIndex=''; writeOwned();
  try{ const f=document.querySelector('#hideoutWrap iframe'); if(f&&H.isOpen()) f.focus(); }catch(e){} tell('hideout:bagClosed'); },150);
{ const prev=T.close; T.close=function(){ const r=prev.apply(this,arguments); if(r&&fromHideout){ fromHideout=false; const el=$('tavern'); if(el) el.style.zIndex=''; writeOwned();
    try{ const f=document.querySelector('#hideoutWrap iframe'); if(f&&H.isOpen()) f.focus(); }catch(e){} tell('hideout:bagClosed'); } return r; }; }
{ const prev=tvDefend; tvDefend=function(){ if(fromHideout){ T.close(); return; } return prev(); }; }   // on the title screen a visit to the hideout must not start a run from here
{ const prev=tvRenderHead; tvRenderHead=function(){ prev(); if(fromHideout){ const b=$('tv-defend'); const want='✕ BACK TO THE HIDEOUT'; if(b&&b.textContent!==want) b.textContent=want; } }; }
// the salvage buttons: all unlocked, in the bag's header; one piece, in its card's panel
{ const prev=tvRenderBag; tvRenderBag=function(){ prev(); if(!fromHideout) return; const n=salvageable().length; const sub=document.querySelector('#tv-bag .tv-bag2 > div:last-child .tv-sub'); if(!sub) return;
    sub.insertAdjacentHTML('beforeend','<button class="tv-btn hot" data-act="tvsalvall" id="tv-salvall"'+(n?'':' disabled')+' title="Every unlocked piece in the bag goes into the Cauldron Cart as scrap (worn and locked pieces stay)">🧪 Salvage '+(n?'('+n+')':'')+'</button>'); }; }
{ const prev=tvRenderDetail; tvRenderDetail=function(){ prev(); if(!fromHideout) return; const s=TV.sel, el=$('tv-detail'); if(!s||s.from!=='bag'||!el||el.classList.contains('hide')) return;
    const it=Meta.bag().find(b=>b.id===s.id); const db=el.querySelector('.db'); if(!it||!db) return;
    db.insertAdjacentHTML('beforeend','<button class="tv-btn hot" data-act="tvsalv" data-id="'+it.id+'"'+(it.locked?' disabled title="Unlock it to salvage it"':' title="Into the Cauldron Cart as scrap"')+'>🧪 Salvage</button>'); }; }
// build 432 (Matt: "we need to make salvage a double tap in the card -- OJ accidentally salvaged his mythic -- and keep the equip button on the left"): the Salvage button sat in FRONT of Equip, where a hand reaches for
// Equip; it is at the far right now, and both salvages take TWO taps -- the first turns the button red ("tap again"), the second does it; three seconds untouched and it is itself again.
$('tavern').addEventListener('click',e=>{ const t=e.target.closest('[data-act="tvsalv"],[data-act="tvsalvall"]'); if(!t||t.disabled) return;
  if(t.dataset.armed!=='1'){ e.stopPropagation(); t.dataset.armed='1'; t.dataset.label=t.innerHTML; t.innerHTML='⚠ Tap again to salvage'; t.style.background='#8a1e1e'; t.style.borderColor='#ff6a5a'; clearTimeout(t.__armT); t.__armT=setTimeout(()=>{ if(t.dataset.armed==='1'){ t.dataset.armed=''; t.innerHTML=t.dataset.label; t.style.background=''; t.style.borderColor=''; } },3000); return; }
  clearTimeout(t.__armT); t.dataset.armed='';
  const r=t.dataset.act==='tvsalvall'?salvage(salvageable()):salvage(Meta.bag().filter(b=>b.id===t.dataset.id));
  if(r.n){ tvSay('🧪 +'+r.n+' → Cauldron  ('+RK.filter(k=>r.got[k]).map(k=>r.got[k]+' '+k).join(' · ')+')'); TV.sel=null; } else tvSay('Nothing to salvage'); tvRenderTab(true); });
window.__hideoutbag={ openSheet, sheetOpen:()=>sheetFromHideout,open:openBag,fromHideout:()=>fromHideout,salvage,salvageable:()=>salvageable().length,owned:()=>{ try{ return JSON.parse(localStorage.getItem(OWN_KEY)); }catch(e){ return null; } },writeOwned,OWN_KEY};
})();
