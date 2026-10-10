// ===== THE WARDROBE WALK-THROUGH (build 620). Matt: "first time to hide out, open wall locker go dim with finder on the gear to take it" / "then immeadiatly click on all the forest gear to equip" /
// "then the finger showing full pips then x out of wardrobe then tab show and full gear set." Then: "the next time I come back to the bag, teach how selecting an equipment slot then shows best gear below"
// ("it does and it outlines in gold" -- the gold ★ BEST card). Show, don't tell: the room goes dim, one lit hole, a bouncing 👇 and one word. Never in co-op, never on test pages unless ?wardguide.
//   1 TAKE   the Forest piece waiting in the wardrobe        4 ✕      close the wardrobe
//   2 EQUIP  each Forest piece in the bag, then its Equip    5 TAB    the character sheet, the finger on the full Forest row
//   3 5/5    the five lit pips on the worn piece             (next bag visit) CLICK a worn slot with a ▲ -> ★ BEST, the piece for it below
// Also (my call, all the time): clicking a worn slot scrolls the bag to that slot's ★ BEST piece and makes it pulse.
(function(){
'use strict';
const T=window.__tavern; if(!T||!T.state) return;
const QW=new URLSearchParams(location.search), FORCE=QW.has('wardguide');
const KEY='dd_ward_guide';
const rd=()=>{ try{ return JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ return {}; } };
const wr=o=>{ try{ localStorage.setItem(KEY,JSON.stringify(o)); }catch(e){} };
const off=()=>(SILENT&&!FORCE)||(typeof TUTORIAL!=='undefined'&&TUTORIAL)||!!(window.__net&&window.__net.peers&&window.__net.peers().length);
const css=document.createElement('style'); css.textContent=
 '#wgRing{position:fixed;z-index:60;pointer-events:none;border-radius:12px;box-shadow:0 0 0 200vmax #000000b8,0 0 0 3px #ffd27a,0 0 22px 6px #ffd27a88;transition:left .18s,top .18s,width .18s,height .18s;display:none}'+
 '#wgHand{position:fixed;z-index:61;pointer-events:none;display:none;flex-direction:column;align-items:center;transform:translateX(-50%);animation:wgBob .8s ease-in-out infinite alternate}'+
 '#wgHand b{font:900 15px/1 Georgia,serif;letter-spacing:2px;color:#ffe2b8;background:linear-gradient(#5a2a14,#2a1208);border:2px solid #c9962f;border-radius:999px;padding:5px 12px;white-space:nowrap;box-shadow:0 4px 14px #000}'+
 '#wgHand i{font-style:normal;font-size:44px;line-height:1;filter:drop-shadow(0 3px 6px #000)}'+
 '@keyframes wgBob{from{margin-top:-6px}to{margin-top:6px}}'+
 '#wgKey{position:fixed;z-index:61;left:50%;top:38%;transform:translate(-50%,-50%);pointer-events:none;display:none;flex-direction:column;align-items:center;gap:10px}'+
 '#wgKey .k{font:900 40px/1 Georgia,serif;color:#3a2200;background:linear-gradient(#fff2c0,#e0b040);border:3px solid #fff6d0;border-bottom-width:9px;border-radius:14px;padding:16px 34px;box-shadow:0 10px 30px #000c,0 0 30px #ffd27a88;animation:wgPress 1.1s ease-in-out infinite}'+
 '#wgKey .p{font:bold 18px Georgia,serif;color:#ffe2b8;text-shadow:0 2px 6px #000;letter-spacing:2px}'+
 '@keyframes wgPress{0%,60%,100%{transform:translateY(0);border-bottom-width:9px}75%{transform:translateY(5px);border-bottom-width:4px}}'+
 '#tv-bag .tv-tile.wgPulse{animation:wgPulse .5s ease-in-out 4 alternate;z-index:2}@keyframes wgPulse{from{box-shadow:0 0 0 2px #ffd27a,0 0 10px #ffd27a}to{box-shadow:0 0 0 5px #ffd27a,0 0 28px 8px #ffd27a}}';
document.head.appendChild(css);
const ring=document.createElement('div'); ring.id='wgRing'; const hand=document.createElement('div'); hand.id='wgHand'; hand.innerHTML='<b></b><i>👇</i>';
const key=document.createElement('div'); key.id='wgKey'; key.innerHTML='<div class="k">TAB</div><div class="p">🧍 ⚔ 🌲</div>';
document.body.append(ring,hand,key);
function point(elm,word){ if(!elm){ ring.style.display=hand.style.display='none'; return false; } const r=elm.getBoundingClientRect(); if(!r.width){ ring.style.display=hand.style.display='none'; return false; }
  const p=6; Object.assign(ring.style,{display:'block',left:(r.left-p)+'px',top:(r.top-p)+'px',width:(r.width+2*p)+'px',height:(r.height+2*p)+'px'});
  hand.style.display='flex'; hand.querySelector('b').textContent=word; const hh=hand.offsetHeight||80; const above=r.top-hh-8>4; hand.style.left=(r.left+r.width/2)+'px'; hand.style.top=(above?r.top-hh-8:r.bottom+8)+'px'; hand.querySelector('i').textContent=above?'👇':'👆'; hand.style.flexDirection=above?'column':'column-reverse'; return true; }
function clear(){ ring.style.display=hand.style.display='none'; key.style.display='none'; }
const hb=()=>window.__hideoutbag, F=()=>window.__forest, S=()=>{ try{ return T.state(); }catch(e){ return {}; } };
const bagOpen=()=>{ const s=S(); return !!(s.open&&s.tab==='bag'); };
const wornIds=()=>new Set(SLOTS.map(s=>gear[s]&&gear[s].id).filter(Boolean));
function forestToWear(){ const f=F(); if(!f) return []; const worn=wornIds(), out=[], took={};
  for(const it of Meta.bag()){ if(!f.isForest(it)||worn.has(it.id)||took[it.slot]) continue; if(gear[it.slot]&&f.isForest(gear[it.slot])) continue; if(it.slot==='weapon'&&typeof canWield==='function'&&!canWield(it)) continue; took[it.slot]=1; out.push(it); } return out; }
const tileOf=id=>document.querySelector('#tv-bag .tv-tile[data-id="'+CSS.escape(id)+'"]');
function bestTile(slot){ for(const t of document.querySelectorAll('#tv-bag .tv-tile.best')){ const it=Meta.bag().find(b=>b.id===t.dataset.id); if(it&&it.slot===slot) return t; } return null; }
function show(t){ if(t&&t.scrollIntoView){ const r=t.getBoundingClientRect(); if(r.top<0||r.bottom>innerHeight-90) t.scrollIntoView({block:'center'}); } }
// ---- the walk-through: a small state machine on a timer (rAF never fires in a hidden pane)
let G=null;   // { step, at, skip:{} } while the first wardrobe walk-through runs
let SG=null;  // { step, slot, at } while the "click a slot" lesson runs
let bagWas=false, bagVisits=0;
function tick(){ const st=rd(); const open=bagOpen(); if(open&&!bagWas) bagVisits++; bagWas=open;
  if(off()){ if(G||SG){ G=SG=null; clear(); } return; }
  // start: the wardrobe is open over the bag with the Forest piece waiting in it
  if(!G&&!st.ward&&open&&hb()&&hb().wardMode()&&F()&&F().lockerPending()&&document.querySelector('#tv-ward .tv-wr:not(.taken)')){ G={step:1,at:0,skip:{}}; st.ward=1; st.wardAt=bagVisits; wr(st); }
  if(G){ G.at+=.12; runWard(open); return; }
  // the next bag visit: click a worn slot with a ▲, then the gold ★ BEST below
  if(!SG&&st.ward===2&&!st.slot&&open&&bagVisits>(st.wardAt|0)+0&&!document.querySelector('#bagguide.on')){ const c=[...document.querySelectorAll('#tv-bag .tv-card.bs-eq.bg-up[data-slot]')].find(c=>bestTile(c.dataset.slot)); if(c){ SG={step:1,slot:c.dataset.slot,at:0}; st.slot=1; wr(st); } }
  if(SG){ SG.at+=.12; runSlot(open); } }
function endWard(){ G=null; clear(); const st=rd(); st.ward=2; wr(st); }
function runWard(open){ key.style.display='none';
  if(G.step===1){ if(!open){ return endWard(); } const w=document.querySelector('#tv-ward .tv-wr:not(.taken)'); if(w&&F().lockerPending()){ point(w,'TAKE'); return; } G.step=2; G.at=0; }
  if(G.step===2){ if(!open){ return endWard(); } const det=document.getElementById('tv-detail'), eqb=det&&!det.classList.contains('hide')&&det.querySelector('[data-act="equip"]');
    const left=forestToWear().filter(it=>!G.skip[it.id]);
    if(eqb&&TV.sel&&left.some(it=>it.id===TV.sel.id)){ point(eqb,'EQUIP'); return; }
    if(left.length){ const t=tileOf(left[0].id); if(t){ show(t); point(t,'EQUIP'); } else G.skip[left[0].id]=1; return; }
    G.step=3; G.at=0; }
  if(G.step===3){ if(!open) return endWard(); const f=F(), w=SLOTS.map(s=>gear[s]).find(g=>g&&f.isForest(g));
    if(w&&(!TV.sel||TV.sel.from!=='eq')){ TV.sel={id:w.id,from:'eq',slot:w.slot}; if(typeof tvRenderTab==='function') tvRenderTab(true); }
    const pips=document.querySelector('#tv-detail:not(.hide) .tvp-set'); if(pips&&G.at<4.5){ point(pips,(Meta.sets&&Meta.sets.counts()['of the Forest']|0)+'/5'); return; }
    G.step=4; G.at=0; }
  if(G.step===4){ if(!open){ G.step=5; G.at=0; } else { const x=document.querySelector('#tavern [data-act="close"].tv-x')||document.getElementById('tv-close'); point(x,'✕'); return; } }
  if(G.step===5){ clear(); const H=window.__hideout; if(!H||!H.isOpen()) return endWard(); const sheet=hb()&&hb().sheetOpen();
    if(!sheet){ if(G.at>40) return endWard(); key.style.display='flex'; return; }
    G.step=6; G.at=0; }
  if(G.step===6){ const Dl=window.__doll; if(!Dl||!Dl.isOpen()||G.at>6) return endWard(); const row=[...document.querySelectorAll('#doll .sr')].find(r=>/of the Forest/.test(r.textContent)); const pp=row&&(row.querySelector('.spips')||row);
    if(pp){ if(G.at<.4&&pp.scrollIntoView) pp.scrollIntoView({block:'center'}); point(pp,(Meta.sets&&Meta.sets.counts()['of the Forest']|0)+'/5'); } else point(null); } }
function runSlot(open){ if(!open||SG.at>25){ SG=null; clear(); return; }
  if(SG.step===1){ const c=document.querySelector('#tv-bag .tv-card.bs-eq[data-slot="'+SG.slot+'"]'); if(!c){ SG=null; clear(); return; } point(c,'CLICK'); return; }
  if(SG.step===2){ const t=bestTile(SG.slot); if(!t||SG.at>5){ SG=null; clear(); return; } point(t,'★ BEST'); } }
setInterval(tick,120);
// a click on a worn slot: the bag shows that slot's ★ BEST piece (scrolled to it, pulsing) -- and moves the slot lesson on
document.addEventListener('click',e=>{ const c=e.target.closest&&e.target.closest('#tv-bag .tv-card.bs-eq[data-slot]'); if(!c) return; const slot=c.dataset.slot;
  setTimeout(()=>{ const t=bestTile(slot); if(!t) return; show(t); t.classList.remove('wgPulse'); void t.offsetWidth; t.classList.add('wgPulse'); },60);
  if(SG&&SG.step===1&&slot===SG.slot){ SG.step=2; SG.at=0; } },true);
document.addEventListener('click',e=>{ if(SG&&SG.step===2&&e.target.closest&&e.target.closest('#tv-bag .tv-tile.best')){ SG=null; clear(); } },true);
window.__wardguide={ active:()=>!!(G||SG), step:()=>G?G.step:0, slotStep:()=>SG?SG.step:0, info:()=>rd(), reset:()=>{ G=SG=null; clear(); try{ localStorage.removeItem(KEY); }catch(e){} }, KEY };
})();
