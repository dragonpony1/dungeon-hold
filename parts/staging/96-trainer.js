// ===== TRAINING WHEELS: map one is the training ground. A new player gets a guide card on the left that names the ONE next
// thing to do -- pick a defense (the key on their hero's first hotbar slot), set it on the lane, sound the horn, swing and
// walk over an orb, walk over the piece the held wave drops, equip it, then place a second defense or upgrade one -- and
// each step ticks itself off by watching what the game actually did (a defense placed, the phase turning to 'wave', an
// orb landing, a piece bagged, Meta.equip succeeding), never by a timer. Progress lives in localStorage 'dd_trainer' so a
// run that ends early resumes at the step it reached; the guide shows only on map one, only until map one is held, only
// during the build and wave phases, never over the tavern; a ✕ hides it for good. The banner on the first build phase
// names the place. The first set piece's own lesson (93-gearsets.js, dd_setHint) is the eighth wheel and stays separate.
(function(){
const KEY='dd_trainer';
let st=(()=>{ try{ const s=JSON.parse(localStorage.getItem(KEY)); if(s&&typeof s==='object') return {done:s.done&&typeof s.done==='object'?s.done:{},off:!!s.off}; }catch(e){} return {done:{},off:false}; })();
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(st)); }catch(e){} }
const clearedMaps=()=>{ try{ return parseInt(localStorage.getItem('ddMapsCleared'))||0; }catch(e){ return 0; } };
// ---- what the game did: counters fed by the same calls the game makes
let orbs=0, picked=0, equips=0;
{ const prev=SFX.mana; SFX.mana=function(){ orbs++; return prev.apply(this,arguments); }; }                       // an orb landing plays this, nothing else does
{ const prev=Meta.onPickup; Meta.onPickup=function(it,l){ const r=prev(it,l); if(r) picked++; return r; }; }     // true when the piece went into the bag
{ const prev=Meta.equip; Meta.equip=function(id){ const r=prev(id); if(r) equips++; return r; }; }               // the sheet and the tavern both equip through here
// ---- the hero's first hotbar slot: its key label and name (70-hero2.js shows only the current hero's three)
function firstSlot(){ for(const el of document.querySelectorAll('#hotbar .slot')){ if(el.style.display==='none') continue; const k=(el.querySelector('.k')||{}).textContent||'', n=(el.querySelector('.n')||{}).textContent||''; return {key:k.trim(),name:n.trim(),kind:el.id.replace(/^slot-/,'')}; } return {key:'1',name:'a defense',kind:''}; }
const click=TOUCH?'tap':'click';
const STEPS=[
  {id:'pick', text:()=>{ const f=firstSlot(); return TOUCH?'Tap a defense on the hotbar — the '+f.name+' to start':'Pick a defense: press '+f.key+' for the '+f.name; }, done:()=>!!placing},
  {id:'place', text:()=>'Look at the lane and '+click+' to set it down — green means it fits (R turns it)', done:()=>defs.length>=1},
  {id:'horn', text:()=>'Sound the horn: '+(TOUCH?'tap 📯 START WAVE':'press G')+'. The goblins come down the lane', done:()=>S.phase==='wave'||S.wave>=1},
  {id:'orb', text:()=>(TOUCH?'Tap ⚔ to swing':'Click to swing')+' at a goblin. Walk over the blue orbs they leave — that mana builds more defenses', done:()=>orbs>0},
  {id:'loot', text:()=>'Every wave held drops a piece of gear by the crystal — walk over it to bag it', done:()=>picked>0},
  {id:'equip', text:()=>'Equip it: open your sheet ('+(TOUCH?'the 🎒 button':'Tab')+') and '+click+' the piece', done:()=>equips>0},
  {id:'more', text:()=>'Before the next horn, place a second defense — or stand by one and press E to make it Mark II', done:()=>defs.length>=2||defs.some(d=>(d.lvl||1)>=2)},
];
const training=()=>MAPI===0&&clearedMaps()<1&&!st.off;
const showing=()=>training()&&(S.phase==='build'||S.phase==='wave')&&!Meta.isOpen();
function current(){ return STEPS.find(s=>!st.done[s.id])||null; }
// ---- the card
const css=document.createElement('style'); css.textContent='#trainer{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:236px;background:#000a;border:1px solid #ffd27a66;border-radius:8px;padding:9px 12px 10px;color:#fff;font-size:14px;line-height:1.35;text-shadow:0 1px 2px #000;pointer-events:none;opacity:0;transition:opacity .35s}#trainer.on{opacity:1}#trainer .tt{display:flex;align-items:center;gap:6px;font-size:12px;letter-spacing:2px;color:var(--gold,#ffd27a);margin-bottom:5px}#trainer .tt .tn{margin-left:auto;letter-spacing:0;color:#fff9}#trainer .tx{pointer-events:auto;background:none;border:0;color:#fff8;font-size:14px;cursor:pointer;padding:0 0 0 6px;line-height:1}#trainer .tx:hover{color:#fff}#trainer .ts{min-height:36px}#trainer.ok .ts{color:#8ef08a}#trainer .td{display:flex;gap:4px;margin-top:8px}#trainer .td i{flex:1;height:3px;border-radius:2px;background:#fff3}#trainer .td i.d{background:#8ef08a}#trainer .td i.c{background:var(--gold,#ffd27a)}@media (max-width:700px){#trainer{top:auto;bottom:196px;transform:none;width:200px;font-size:13px}}'; document.head.appendChild(css);
const card=document.createElement('div'); card.id='trainer'; card.innerHTML='<div class="tt">🎓 TRAINING<span class="tn"></span><button class="tx" title="hide the guide for good">✕</button></div><div class="ts"></div><div class="td"></div>';
(document.getElementById('hud')||document.body).appendChild(card);
card.querySelector('.tx').addEventListener('click',e=>{ e.stopPropagation(); st.off=true; save(); render(); toast('Training guide hidden'); });
let okT=0, finT=0, bannered=false, lastId=null;
function render(){ const on=showing()&&(current()||finT>0); card.classList.toggle('on',on); if(!on) return; const cur=current(); const n=STEPS.length, i=cur?STEPS.indexOf(cur):n;
  card.querySelector('.tn').textContent=cur?(i+1)+'/'+n:'done';
  card.classList.toggle('ok',okT>0||finT>0);
  card.querySelector('.ts').textContent=okT>0&&lastId?'✓ '+STEPS.find(s=>s.id===lastId).text():cur?cur.text():'Training complete — hold all '+MAP.waves+' waves to clear the hall';
  card.querySelector('.td').innerHTML=STEPS.map((s,k)=>'<i class="'+(st.done[s.id]?'d':k===i?'c':'')+'"></i>').join(''); }
function tick(dt){ if(okT>0) okT-=dt; if(finT>0) finT-=dt;
  if(training()&&S.phase==='build'&&!bannered){ bannered=true; if(current()) banner('THE TRAINING GROUND','your first hall — the guide on the left names the next thing to do'); }
  const cur=current(); if(cur&&showing()&&okT<=0&&cur.done()){ st.done[cur.id]=true; save(); lastId=cur.id; okT=1.1; SFX.pickup&&SFX.pickup(); if(!current()) finT=7; }
  render(); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); tick(dt); }; }
setInterval(render,250);   // the game loop pauses under the tavern and on the end screens; the card still needs to step aside / come back
render();
window.__trainer={state:()=>JSON.parse(JSON.stringify(st)),step:()=>{ const c=current(); return c?c.id:null; },text:()=>card.querySelector('.ts').textContent,showing,training,steps:STEPS.map(s=>s.id),counts:()=>({orbs,picked,equips}),reset:()=>{ st={done:{},off:false}; save(); okT=finT=0; render(); },KEY};
})();
