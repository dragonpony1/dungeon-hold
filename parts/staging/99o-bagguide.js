// ===== HOW TO READ YOUR GEAR (build 570). Matt: "we need a little more tutuorial on the bag page when you first open it, explaining the equipment cards and what on them? the pips, the sets, ect",
// then "my wife is gonna play this from the begining ... shes not a gamer so just little tweaks". So: ONE picture card, not a tour -- the first time the bag opens with something in it, a card over
// the bag reads its marks the way the game draws them (show, don't tell: the real-looking chip, then two or three words). A ❔ button beside the bag's tools brings it back any time.
//   GS 450 = how strong · ▲+108 = better than what you wear · ★ BEST = your strongest for that slot · the small number = its level · the corner picture = its set · the glow = rarity
//   a set column (medallion, 4/5) = collect all 5 · the hover card's five pips = how many of that set you wear · the hammer bar = forge upgrades · worn cards: ▲ upgrade waiting, ✓ best on
// Not on test pages (?silent) unless asked; once seen, never again by itself (dd_bag_guide). Test hook: window.__bagguide.
(function(){
'use strict';
const T=window.__tavern; if(!T||!T.state) return;
const KEY='dd_bag_guide', cnt={ shown:0 };
const seen=()=>{ try{ return localStorage.getItem(KEY)==='1'; }catch(e){ return true; } };
const RC=typeof RCSS!=='undefined'?RCSS:['#d8d8d8','#5ad05a','#6aa8ff','#c070ff','#ffc040','#ff7ade'];
const css=document.createElement('style'); css.textContent=
 '#bagguide{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;background:#0008}#bagguide.on{display:flex}'+
 '#bagguide .bgd{width:min(760px,94vw);max-height:92vh;overflow:auto;background:linear-gradient(#24162e,#140c1a);border:3px solid #c9962f;border-radius:16px;box-shadow:0 10px 40px #000,inset 0 0 0 1px #5a3a1a;padding:16px 18px 14px;color:#f3e6cf;font:15px Georgia,serif}'+
 '#bagguide h3{margin:0 0 12px;text-align:center;font:bold 22px Georgia,serif;letter-spacing:3px;color:#ffd27a}'+
 '#bagguide .g{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px}@media (max-width:620px){#bagguide .g{grid-template-columns:1fr}}'+
 '#bagguide .r{display:flex;align-items:center;gap:12px;background:#ffffff08;border:1px solid #ffffff14;border-radius:10px;padding:7px 10px;min-height:46px}'+
 '#bagguide .k{flex:0 0 112px;display:flex;align-items:center;justify-content:center;gap:4px}#bagguide .w{font-size:15px;line-height:1.25;color:#efe2c8}'+
 '#bagguide .c{font:900 13px/1 system-ui,sans-serif;border-radius:6px;padding:4px 7px;white-space:nowrap}'+
 '#bagguide .gs{background:#1a1220;border:1px solid #c9962f;color:#ffd27a}#bagguide .up{background:#0f3a17;color:#5dff7a;border:1px solid #35d352}'+
 '#bagguide .best{background:linear-gradient(#ffd45a,#e0a020);color:#3a2200;border:1px solid #fff2b0}#bagguide .lv{background:#000a;color:#d8cbb4;font-weight:bold;font-size:13px;padding:3px 6px}'+
 '#bagguide .si{font-size:24px}#bagguide .sw{width:16px;height:22px;border-radius:4px;border:2px solid;box-shadow:0 0 8px currentColor;background:#1a1220}'+
 '#bagguide .med{width:38px;height:38px;object-fit:contain;filter:drop-shadow(0 0 6px #5ad05a)}#bagguide .n5{font:bold 13px Georgia,serif;color:#e8d29a;border:1px solid #c9962f;border-radius:999px;padding:2px 8px}'+
 '#bagguide .pp{display:flex;gap:4px}#bagguide .pp b{width:12px;height:12px;border-radius:50%;border:2px solid #5ad05a}#bagguide .pp b.on{background:#5ad05a;box-shadow:0 0 6px #5ad05a}'+
 '#bagguide .bar{width:70px;height:8px;border-radius:4px;background:#000;border:1px solid #7a6040;overflow:hidden}#bagguide .bar i{display:block;height:100%;width:40%;background:linear-gradient(90deg,#c9962f,#ffd27a)}'+
 '#bagguide .rb{width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font:900 14px/1 system-ui;color:#fff}'+
 '#bagguide .hv{margin:12px 0 0;text-align:center;color:#c9b8a0;font-size:14px}#bagguide .hv b{color:#ffd27a}'+
 '#bagguide .ok{display:block;margin:12px auto 0;background:linear-gradient(#5a2a14,#2a1208);border:2px solid #c9962f;border-radius:999px;color:#ffe2b8;font:bold 16px Georgia,serif;letter-spacing:3px;padding:9px 34px;cursor:pointer}'+
 '#bagguide-btn{background:linear-gradient(#3a1a10,#1a0b06);border:2px solid #c9962f;border-radius:999px;color:#ffe2b8;font:bold 15px/1 Georgia,serif;width:34px;height:34px;cursor:pointer;margin-left:6px;flex:0 0 auto}';
document.head.appendChild(css);
const ROW=(k,w)=>'<div class="r"><div class="k">'+k+'</div><div class="w">'+w+'</div></div>';
function html(){ const sw=RC.slice(0,5).map(c=>'<span class="sw" style="color:'+c+';border-color:'+c+'"></span>').join('');
  return '<div class="bgd"><h3>🎒 READING YOUR GEAR</h3><div class="g">'+
   ROW('<span class="c gs">GS 450</span>','How strong it is. <b>Bigger is better.</b>')+
   ROW('<span class="c up">▲+108</span>','Better than what you wear, by this much')+
   ROW('<span class="c best">★ BEST</span>','Your strongest one for that slot')+
   ROW('<span class="c lv">51</span>','Its level (the small corner number)')+
   ROW('<span class="si">🌲</span>','Its set (the corner picture)')+
   ROW(sw,'Its glow is its rarity: grey, green, blue, purple, gold')+
   ROW('<img class="med" src="assets/medal-forest.png" alt="" onerror="this.outerHTML=\'<span class=si>🌲</span>\'"><span class="n5">4/5</span>','A set: collect all 5 for a <b>set power</b>')+
   ROW('<span class="pp"><b class="on"></b><b class="on"></b><b class="on"></b><b></b><b></b></span>','How many of that set you are wearing')+
   ROW('<span>🔨</span><span class="bar"><i></i></span>','Forge upgrades bought on it')+
   ROW('<span class="rb" style="background:#35d352">▲</span><span class="rb" style="background:#35d352">✓</span>','On what you wear: ▲ = a better one waiting, ✓ = best on')+
   '</div><div class="hv">Point at any card to see all of this. <b>Click</b> a card to wear it.</div><button class="ok" type="button">GOT IT</button></div>'; }
let el=null;
function show(){ if(!el){ el=document.createElement('div'); el.id='bagguide'; document.body.appendChild(el); el.addEventListener('click',e=>{ if(e.target===el||e.target.closest('.ok')) hide(); }); }
  el.innerHTML=html(); el.classList.add('on'); cnt.shown++; try{ localStorage.setItem(KEY,'1'); }catch(e){} }
function hide(){ if(el) el.classList.remove('on'); }
addEventListener('keydown',e=>{ if(el&&el.classList.contains('on')&&(e.key==='Escape'||e.key==='Enter')){ e.stopImmediatePropagation(); e.preventDefault(); hide(); } },true);
// the ❔ beside the bag's tools; the first look at a bag with something in it shows the card by itself
const bagHas=()=>{ try{ return Meta.bag().length>0; }catch(e){ return false; } };
setInterval(()=>{ let st; try{ st=T.state(); }catch(e){ return; } const onBag=st.open&&st.tab==='bag';
  if(onBag&&!document.getElementById('bagguide-btn')){ const sj=document.querySelector('[data-act="selljunk"]'); if(sj&&sj.parentElement){ const b=document.createElement('button'); b.id='bagguide-btn'; b.type='button'; b.title='How to read your gear'; b.textContent='?'; b.addEventListener('click',e=>{ e.stopPropagation(); show(); }); sj.parentElement.appendChild(b); } }
  if(onBag&&!seen()&&!SILENT&&!(typeof TUTORIAL!=='undefined'&&TUTORIAL)&&bagHas()&&!(el&&el.classList.contains('on'))) show();
  if(!st.open) hide(); },400);
window.__bagguide={ show, hide, isOn:()=>!!(el&&el.classList.contains('on')), info:()=>Object.assign({ seen:seen() },cnt) };
})();
