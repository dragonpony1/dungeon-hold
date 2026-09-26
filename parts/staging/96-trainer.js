// ===== TRAINING WHEELS: map one is the training ground. A new player gets a guide card on the left that names the ONE next
// thing to do -- watch a lone goblin walk the lane (wave zero), set up a ballista on its path, sound the horn, swing and
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
// ---- wave zero: before the first horn a lone goblin walks the lane on its own (harmless: it hits for nothing and vanishes at
// the crystal with IT GOT THROUGH), so the path is obvious; then a BALLISTA goes on that path -- a fresh player is the
// knight (70-hero2.js: the other heroes unlock once map one is held), and the hall lends the mana for that first defense.
const W0={spawned:false,gone:false,lent:false};
function trainingGoblin(){ return enemies.find(e=>e.training&&!e.dead)||null; }
function waveZero(){ if(W0.spawned||S.phase!=='build') return; W0.spawned=true; try{ const e=spawnEnemy('goblin','N'); e.training=true; e.dmg=0; e.spd=e.spd*.8; }catch(err){ W0.gone=true; } }
function lendMana(){ const k=heroPick.unlocks[0]; const need=k&&DEFS[k]?DEFS[k].mana:0; if(!W0.lent&&need&&S.mana<need){ W0.lent=true; S.mana=need; } }   // the hall lends the mana for the first defense, once
const firstDef=()=>{ const k=heroPick.unlocks[0]; return {kind:k,key:String(heroPick.unlocks.indexOf(k)+1),name:DEFS[k]?DEFS[k].name:'defense'}; };
const STEPS=[
  {id:'watch', text:()=>'A lone goblin is walking the lane — watch the path it takes to the crystal', done:()=>W0.spawned&&(W0.gone||!trainingGoblin())},
  {id:'pick', text:()=>{ const f=firstDef(); return TOUCH?'Set up a '+f.name.toUpperCase()+' on that path: tap it on the hotbar':'Set up a '+f.name.toUpperCase()+' on that path: press '+f.key; }, done:()=>!!placing},   // a fresh player is the knight (70-hero2.js), so this reads BALLISTA; a returning player's own first defense otherwise
  {id:'place', text:()=>'Look at the goblin\'s path and '+click+' to set it down — green means it fits (R turns it)', done:()=>defs.length>=1},
  {id:'horn', text:()=>'Sound the horn: '+(TOUCH?'tap 📯 START WAVE':'press G')+'. The goblins come down the lane', done:()=>S.phase==='wave'||S.wave>=1},
  {id:'orb', text:()=>(TOUCH?'Tap ⚔ to swing':'Click to swing')+' at a goblin. Walk over the blue orbs they leave — that mana builds more defenses', done:()=>orbs>0},
  {id:'loot', text:()=>'Every wave held drops a piece of gear by the crystal — walk over it to bag it', done:()=>picked>0},
  {id:'equip', text:()=>'Equip it: open your sheet ('+(TOUCH?'the 🎒 button':'Tab')+') and '+click+' the piece', done:()=>equips>0},
  {id:'locker', text:()=>'Your last Forest piece waits in the hideout\'s wall locker: E at the archway between waves, open the locker, come back', done:()=>!(window.__forest&&window.__forest.lockerPending())},   // shows only while the locker holds it; ticks itself off otherwise
  {id:'more', text:()=>'Before the next horn, place a second defense — or stand by one and press E to make it Mark II', done:()=>defs.length>=2||defs.some(d=>(d.lvl||1)>=2)},
];
const training=()=>MAPI===0&&!st.off;   // map one is the training ground whoever plays it: the card stays until its steps are done or the ✕ (holding the map no longer hides it -- a returning player never saw it that way)
const showing=()=>training()&&(S.phase==='build'||S.phase==='wave')&&!Meta.isOpen();
function current(){ return STEPS.find(s=>!st.done[s.id])||null; }
// ---- the card
const css=document.createElement('style'); css.textContent='#trainer{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:300px;background:#000b;border:2px solid #ffd27a88;border-radius:10px;padding:12px 15px 13px;color:#fff;font-size:17px;line-height:1.35;text-shadow:0 1px 2px #000;pointer-events:none;opacity:0;transition:opacity .35s}#trainer.on{opacity:1}#trainer .tt{display:flex;align-items:center;gap:6px;font-size:13px;letter-spacing:2px;color:var(--gold,#ffd27a);margin-bottom:5px}#trainer .tt .tn{margin-left:auto;letter-spacing:0;color:#fff9}#trainer .tx{pointer-events:auto;background:none;border:0;color:#fff8;font-size:14px;cursor:pointer;padding:0 0 0 6px;line-height:1}#trainer .tx:hover{color:#fff}#trainer .ts{min-height:46px}#trainer.ok .ts{color:#8ef08a}#trainer .td{display:flex;gap:4px;margin-top:8px}#trainer .td i{flex:1;height:3px;border-radius:2px;background:#fff3}#trainer .td i.d{background:#8ef08a}#trainer .td i.c{background:var(--gold,#ffd27a)}@media (max-width:700px){#trainer{top:auto;bottom:196px;transform:none;width:230px;font-size:14px}}'; document.head.appendChild(css);
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
  if(training()&&S.phase==='build'&&!bannered){ bannered=true; if(current()) banner('THE TRAINING GROUND','wave zero: watch the lane, then set up a ballista — the guide on the left leads'); }
  if(training()&&current()){ const id=current().id; if(id==='watch') waveZero(); if(id==='pick') lendMana();
    const g=trainingGoblin(); if(g&&Math.hypot(g.x,g.z)<2.6){ g.dead=.001; W0.gone=true; floatText(g.x,g.y+1.6,g.z,'IT GOT THROUGH','#ff8a6a'); if(window.__lesson) window.__lesson.show('That one walked straight to the crystal. A defense on its path stops the next one.',7); } }
  const cur=current(); if(cur&&showing()&&okT<=0&&cur.done()){ st.done[cur.id]=true; save(); lastId=cur.id; okT=2.2; SFX.pickup&&SFX.pickup(); if(!current()) finT=12; }
  render(); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); tick(dt); }; }
setInterval(render,250);   // the game loop pauses under the tavern and on the end screens; the card still needs to step aside / come back
render();
window.__trainer={w0:()=>({spawned:W0.spawned,gone:W0.gone,lent:W0.lent,goblin:!!trainingGoblin()}),state:()=>JSON.parse(JSON.stringify(st)),step:()=>{ const c=current(); return c?c.id:null; },text:()=>card.querySelector('.ts').textContent,showing,training,steps:STEPS.map(s=>s.id),counts:()=>({orbs,picked,equips}),reset:()=>{ st={done:{},off:false}; save(); okT=finT=0; render(); },KEY};
})();
