// ===== BEST GEAR AT A GLANCE (build 315). Matt: "when i look in the bag there needs to be a very easy and quick way for me to tell if iam wearing the best gear or whats beter".
// The bag already had a small "▲ +12 vs worn" line at a card's foot; this makes it a picture you read without reading:
//   * a bag piece that beats what you wear in its slot, and that you can put on now: a round GREEN ▲ in its corner and a green glow round the card
//   * better, but with a catch -- your level is too low (🔒), or wearing it would break a set bonus you have on: an AMBER ▲
//   * worse than what you wear, or no better: the card is dimmed
//   * each worn piece: a green ✓ if nothing in the bag beats it, a green ▲ if something does (an empty slot with something to put in it gets the ▲ too)
//   * one line over the worn column: "✓ BEST GEAR ON" or "▲ 2 UPGRADES"
// Better = a higher item score (it.score, the same number behind "vs worn" and the loot card's offer; Meta.isJunk agrees). The same badges sit on the Tab sheet's bag grid (68-paperdoll.js asks window.__best).
(function(){
'use strict';
const css=document.createElement('style'); css.textContent=
 '.bg-b{position:absolute;top:5px;right:5px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:900 13px/1 system-ui,sans-serif;color:#fff;z-index:3;pointer-events:none;box-shadow:0 0 0 2px #120c1a,0 0 9px var(--bgc)}'
+'.bg-up{--bgc:#35d352}.bg-warn{--bgc:#e0a030}.bg-ok{--bgc:#2a9a45}'
+'.bg-up>.bg-b{background:#27b344}.bg-warn>.bg-b{background:#c98a1e}.bg-ok>.bg-b{background:#1e6e33;font-size:12px}'
+'.tv-card.bg-up{border-color:#3fdc5a!important;box-shadow:0 0 0 1px #3fdc5a,0 0 12px #3fdc5a55}.tv-card.bg-warn{border-color:#c98a1e!important}'
+'.tv-card.bg-dn{opacity:.5}.tv-card.bg-dn:hover,.tv-card.bg-dn.sel{opacity:1}'
+'.tv-card.bgx .tv-lock{right:32px}.tv-card.bgx .nm{padding-right:22px}'
+'#doll .inv-c .bg-b{top:1px;right:1px;width:15px;height:15px;font-size:9px;box-shadow:0 0 0 1px #120c1a,0 0 6px var(--bgc)}#doll .inv-c.bg-up{border-color:#3fdc5a;box-shadow:inset 0 0 10px #000,0 0 8px #3fdc5a88}#doll .inv-c.bg-dn{opacity:.45}'
+'.bg-head{display:flex;align-items:center;gap:8px;margin:0 0 6px;padding:6px 10px;border-radius:8px;font:800 14px/1.2 Georgia,serif;letter-spacing:1.5px}.bg-head b{font-size:18px}'
+'.bg-head.up{color:#5ff07a;background:#1f4a2855;border:1.5px solid #3fdc5a}.bg-head.ok{color:#7fd88f;background:#18301f55;border:1.5px solid #2a9a45}';
document.head.appendChild(css);
// the worn piece in this slot is holding a set bonus (3+ of its set on) that a piece from elsewhere would break -- the loot card's own rule (60-lootfeel.js keepsSet)
function breaksSet(it){ const w=gear[it.slot]; if(!w||!Meta.sets) return false; const n=Meta.sets.setOf(w); if(!n||Meta.sets.setOf(it)===n) return false; return !!Meta.sets.active().find(x=>x.name===n); }
// a bag piece against what is worn in its slot: 'up' (wear it now), 'lvl' / 'set' (better, with a catch), 'dn' (worse), 'eq' (the same score), or null (it is the worn piece)
function verdict(it){ if(!it||!it.slot) return null; const w=gear[it.slot]; if(w&&w.id===it.id) return null;
  if(w&&!(it.score>w.score)) return it.score<w.score?'dn':'eq';
  if(Meta.canWear&&!Meta.canWear(it)) return 'lvl'; if(breaksSet(it)) return 'set'; return 'up'; }
const ups=slot=>Meta.bag().filter(it=>it.slot===slot&&verdict(it)==='up');
function slotState(slot){ const n=ups(slot).length; return n?'up':(gear[slot]?'ok':null); }
function summary(){ let n=0; for(const s of SLOTS) if(ups(s).length) n++; return n; }
const TIP={up:'Better than what you wear — put it on',lvl:'Better, but your level is too low for it yet',set:'Better on paper, but it would break the set bonus you have on',dn:'Worse than what you wear'};
function badge(v){ return v==='up'?'<i class="bg-b" title="'+TIP.up+'">▲</i>':v==='lvl'?'<i class="bg-b" title="'+TIP.lvl+'">🔒</i>':v==='set'?'<i class="bg-b" title="'+TIP.set+'">▲</i>':''; }
const cls=v=>v==='up'?'bg-up':(v==='lvl'||v==='set')?'bg-warn':(v==='dn'||v==='eq')?'bg-dn':'';   // no better than what you wear (worse, or the same) reads dim: bright means upgrade
// ---- the tavern: bag cards, worn cards, empty slots, and the headline over the worn column
function mark(html,klass,b){ if(!klass) return html; return html.replace(/^<div class="tv-card/,'<div class="tv-card '+klass+(b?' bgx':'')).replace(/(^<div[^>]*>)/,'$1'+b); }
if(typeof tvCard==='function'){ const prev=tvCard; tvCard=function(it,from,extra){ const html=prev(it,from,extra); if(!it) return html;
    if(from==='bag'){ const v=verdict(it); return mark(html,cls(v),badge(v)); }
    if(from==='eq'&&gear[it.slot]&&gear[it.slot].id===it.id){ const st=slotState(it.slot); return st==='up'?mark(html,'bg-up',badge('up').replace(TIP.up,'Something in your bag beats this')):mark(html,'bg-ok','<i class="bg-b" title="Nothing in your bag beats this">✓</i>'); }
    return html; }; }
if(typeof tvEmptyCard==='function'){ const prev=tvEmptyCard; tvEmptyCard=function(slot){ const html=prev(slot); return ups(slot).length?mark(html,'bg-up','<i class="bg-b" title="Your bag has one to put here">▲</i>'):html; }; }
if(typeof tvRenderBag==='function'){ const prev=tvRenderBag; tvRenderBag=function(){ prev.apply(this,arguments); const col=document.querySelector('#tv-bag .tv-eq'); if(!col) return; const n=summary();
    const h=document.createElement('div'); h.className='bg-head '+(n?'up':'ok'); h.innerHTML=n?'<b>▲</b> '+n+' UPGRADE'+(n>1?'S':''):'<b>✓</b> BEST GEAR ON'; h.title=n?'Your bag holds something better for '+n+' slot'+(n>1?'s':''):'Nothing in your bag beats what you wear'; col.insertBefore(h,col.firstChild); }; }
window.__best={verdict,slotState,summary,cellClass:it=>cls(verdict(it)),cellBadge:it=>badge(verdict(it))};
})();
