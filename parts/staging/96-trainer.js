// ===== TRAINING WHEELS: map one is the training ground. A new player gets a guide card on the left that names the ONE next
// thing to do -- dispatch the lone goblin walking the lane (wave zero, the first swing), set up a ballista on its path, sound the horn, swing and
// walk over an orb, walk over the piece the held wave drops, equip it, then place a second defense or upgrade one -- and
// each step ticks itself off by watching what the game actually did (a defense placed, the phase turning to 'wave', an
// orb landing, a piece bagged, Meta.equip succeeding), never by a timer, and a ticked step holds its ✓ until the player
// presses Enter (or taps the card): the tips never move on by themselves. Progress lives in localStorage 'dd_trainer' so a
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
// ---- wave zero: before the first horn a lone goblin walks the lane on its own, harmless (it hits for nothing), for the player
// to dispatch with the sword -- one that reaches the crystal vanishes with IT GOT THROUGH and another comes; then a BALLISTA goes on that path -- a fresh player is the
// knight (70-hero2.js: the other heroes unlock once map one is held), and the hall lends the mana for that first defense.
// build 150 ("the tutorial gets stuck in multiplayer"): a guest runs none of the simulation, so its steps watch the synced lists
// (a death in the enemies list, a row in the defs list, the host's phase), it spawns no wave-zero goblin of its own (that one
// was a phantom nobody could kill), and in co-op -- host or guest -- Enter always moves on: the guide never holds a room.
const netRole=()=>(window.__net&&window.__net.role)?window.__net.role():null; const isGuest=()=>netRole()==='guest'; const inCoop=()=>!!netRole();
const hostWorld=()=>(window.__net&&window.__net.world)?window.__net.world():null; const defsSeen=()=>window.__defsync?window.__defsync.list():[];
const W0={spawned:false,gone:false,lent:false,kills:0,through:0,g:null,respawnT:0};
function trainingGoblin(){ return enemies.find(e=>e.training&&!e.dead)||null; }
function waveZero(){ if(isGuest()) return; if(W0.g||S.phase!=='build') return; if(W0.respawnT>0) return; try{ const e=spawnEnemy('goblin','N'); e.training=true; e.dmg=0; e.spd=e.spd*.8; W0.g=e; W0.spawned=true; }catch(err){ W0.gone=true; } }
function lendMana(){ if(isGuest()) return; const k=heroPick.unlocks[0]; const need=k&&DEFS[k]?DEFS[k].mana:0; if(!W0.lent&&need&&S.mana<need){ W0.lent=true; S.mana=need; } }   // the hall lends the mana for the first defense, once
const firstDef=()=>{ const k=heroPick.unlocks[0]; return {kind:k,key:String(heroPick.unlocks.indexOf(k)+1),name:DEFS[k]?DEFS[k].name:'defense'}; };
const STEPS=[
  {id:'slay', text:()=>'A lone goblin is walking the lane — dispatch him with your sword: '+(TOUCH?'tap ⚔':'click')+' to swing when he is close', done:()=>isGuest()?!!(window.__gsfx&&window.__gsfx().die>0):(W0.kills>=1||W0.gone)},   // the first swing; one that reaches the crystal vanishes and another comes
  {id:'ballista', text:()=>{ const f=firstDef(); return 'Look at the goblin\'s path — set up a '+f.name.toUpperCase()+' on it: '+(TOUCH?'tap it on the hotbar, then tap the lane':'press '+f.key+', then '+click+' to set it down')+'. Green means it fits'+(TOUCH?'':' (R turns it)'); }, done:()=>isGuest()?defsSeen().length>=1:defs.length>=1},   // one tip, and it stays until the defense is really down; a fresh player is the knight (70-hero2.js), so this reads BALLISTA
  {id:'horn', text:()=>isGuest()?'Your host sounds the horn (G on their side) — the goblins come down the lane':'Sound the horn: '+(TOUCH?'tap 📯 START WAVE':'press G')+'. The goblins come down the lane', done:()=>{ if(isGuest()){ const w=hostWorld(); return !!(w&&(w.phase==='wave'||(w.wave|0)>=1)); } return S.phase==='wave'||S.wave>=1; }},
  {id:'orb', text:()=>(TOUCH?'Tap ⚔ to swing':'Click to swing')+' at a goblin. Walk over the blue orbs they leave — that mana builds more defenses', done:()=>orbs>0},
  {id:'loot', text:()=>'Every wave held drops a piece of gear by the crystal — walk over it to bag it', done:()=>picked>0},
  {id:'equip', text:()=>'Equip it: press I for your bag'+(TOUCH?' (or tap 🎒)':'')+', pick the piece and '+click+' EQUIP', done:()=>equips>0},   // I is the bag and tavern pages, the place to manage gear; Tab is the sheet, better for putting buffs on gear
  {id:'locker', text:()=>'Your last Forest piece waits in the hideout\'s wall locker: between waves, walk up to the glowing portal and press E, open the locker, come back', done:()=>!(window.__forest&&window.__forest.lockerPending())},   // shows only while the locker holds it; ticks itself off otherwise
  {id:'more', text:()=>'Before the next horn, place a second defense — or stand by one and press E to make it Mark II', done:()=>{ if(isGuest()){ const ds=window.__defsync, l=defsSeen(); return l.length>=2||(!!ds&&l.some(id=>{ const d=ds.get(id); return !!d&&(d.lvl||1)>=2; })); } return defs.length>=2||defs.some(d=>(d.lvl||1)>=2); }},
];
const training=()=>MAPI===0&&!st.off;   // map one is the training ground whoever plays it: the card stays until its steps are done or the ✕ (holding the map no longer hides it -- a returning player never saw it that way)
const showing=()=>training()&&(S.phase==='build'||S.phase==='wave')&&!Meta.isOpen();
function current(){ return STEPS.find(s=>!st.done[s.id])||null; }
// ---- the card
const css=document.createElement('style'); css.textContent='#trainer{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:340px;background:#0b0710e8;border:3px solid #ffd27a;border-radius:10px;padding:13px 16px 14px;color:#fff;font-size:19px;box-shadow:0 0 18px #ffb03a66,0 0 0 1px #000;line-height:1.35;text-shadow:0 1px 2px #000;pointer-events:none;opacity:0;transition:opacity .35s}#trainer.on{opacity:1}#trainer.coop{pointer-events:auto;cursor:pointer}#trainer .tt{display:flex;align-items:center;gap:6px;font-size:13px;letter-spacing:2px;color:var(--gold,#ffd27a);margin-bottom:5px}#trainer .tt .tn{margin-left:auto;letter-spacing:0;color:#fff9}#trainer .tx{pointer-events:auto;background:none;border:0;color:#fff8;font-size:14px;cursor:pointer;padding:0 0 0 6px;line-height:1}#trainer .tx:hover{color:#fff}#trainer .ts{min-height:46px}#trainer.ok .ts{color:#8ef08a}#trainer.wait{pointer-events:auto;cursor:pointer;border-color:#8ef08a}#trainer .td{display:flex;gap:4px;margin-top:8px}#trainer .td i{flex:1;height:3px;border-radius:2px;background:#fff3}#trainer .td i.d{background:#8ef08a}#trainer .td i.c{background:var(--gold,#ffd27a)}#trainer.new{animation:trNew 1.1s ease-out}#trainer.nudge{animation:trNudge .9s ease-in-out}#trainer.wait{animation:trWait 1.4s ease-in-out infinite}@keyframes trNew{0%{transform:translate(-120%,-50%);box-shadow:0 0 0 #ffb03a}55%{transform:translate(4%,-50%);box-shadow:0 0 46px #ffd27a}100%{transform:translate(0,-50%);box-shadow:0 0 18px #ffb03a66}}@keyframes trNudge{0%,100%{transform:translate(0,-50%);box-shadow:0 0 18px #ffb03a66}20%{transform:translate(10px,-50%) rotate(-1deg);box-shadow:0 0 40px #ffd27a}40%{transform:translate(-6px,-50%) rotate(1deg)}60%{transform:translate(6px,-50%)}80%{transform:translate(-2px,-50%)}}@keyframes trWait{0%,100%{box-shadow:0 0 14px #8ef08a55}50%{box-shadow:0 0 34px #8ef08a}}@media (max-width:700px){#trainer{top:auto;bottom:196px;transform:none;width:250px;font-size:15px}#trainer.new,#trainer.nudge{animation:none;box-shadow:0 0 30px #ffd27a}}'; document.head.appendChild(css);
const card=document.createElement('div'); card.id='trainer'; card.innerHTML='<div class="tt">🎓 TRAINING<span class="tn"></span><button class="tx" title="hide the guide for good">✕</button></div><div class="ts"></div><div class="td"></div>';
(document.getElementById('hud')||document.body).appendChild(card);
card.querySelector('.tx').addEventListener('click',e=>{ e.stopPropagation(); st.off=true; save(); render(); toast('Training guide hidden'); });
function advance(){ if(!waitNext) return false; waitNext=false; let c; while((c=current())&&c.done()){ st.done[c.id]=true; } save(); if(!current()) finT=12; render(); return true; }   /* a step already satisfied when the player moves on (the locker with nothing waiting) passes without ever being shown */
function skip(){ const c=current(); if(!c) return false; st.done[c.id]=true; save(); waitNext=false; if(!current()) finT=12; render(); toast('Tip skipped'); return true; }   // co-op only: a tip that cannot tick on this side (build 150)
card.addEventListener('click',()=>{ if(waitNext) advance(); else if(inCoop()) skip(); });
addEventListener('keydown',e=>{ if(e.code!=='Enter'||e.repeat||!showing()) return; if(waitNext){ e.preventDefault(); e.stopImmediatePropagation(); advance(); return; } if(inCoop()&&current()){ e.preventDefault(); e.stopImmediatePropagation(); skip(); } },true);
let waitNext=false, finT=0, bannered=false, lastId=null, shownId=null, newT=0, idleT=0, nudgeT=0, nudges=0, flashedId=null;   /* newT: the slide-in flash of a tip just shown; idleT: how long it has sat undone; nudgeT: the wiggle running now (build 143: "he almost didn't notice the tool tip on the left, it needs to be a little more annoying") */   // waitNext: a ticked step holds its ✓ until the player presses Enter (or taps the card) -- the tips never move on by themselves
function render(){ const on=showing()&&(current()||finT>0); card.classList.toggle('on',on); if(!on) return; const cur=current(); const n=STEPS.length, i=cur?STEPS.indexOf(cur):n;
  card.querySelector('.tn').textContent=cur?(i+1)+'/'+n:'done';
  if(cur&&!waitNext&&flashedId!==cur.id){ flashedId=cur.id; newT=1.1; idleT=0; nudges=0; tipChime(); }   /* a tip appears: it slides in with a gold flash and a soft chime */
  card.classList.toggle('new',newT>0); card.classList.toggle('nudge',nudgeT>0&&newT<=0);
  card.classList.toggle('ok',waitNext||finT>0); card.classList.toggle('wait',waitNext); card.classList.toggle('coop',inCoop()&&!!cur);   // co-op: the card takes a tap to skip (build 150)
  card.querySelector('.ts').textContent=waitNext&&lastId?'✓ '+STEPS.find(s=>s.id===lastId).text()+(TOUCH?'  — tap here for the next tip':'  — press Enter for the next tip'):cur?(shownId=cur.id,cur.text()+(inCoop()?(TOUCH?'  — tap the card to skip':'  — Enter skips'):'')):'Training complete — hold all '+MAP.waves+' waves to clear the hall';
  card.querySelector('.td').innerHTML=STEPS.map((s,k)=>'<i class="'+(st.done[s.id]?'d':k===i?'c':'')+'"></i>').join(''); }
function tipChime(){ try{ if(typeof beep==='function'){ beep(784,.13,'sine',.045,0); setTimeout(()=>beep(1175,.2,'sine',.04,0),110); } }catch(e){} }
function tick(dt){ if(finT>0) finT-=dt; if(newT>0) newT-=dt; if(nudgeT>0) nudgeT-=dt;
  if(showing()&&current()&&!waitNext){ idleT+=dt; if(idleT>=14){ idleT=4; nudges++; nudgeT=.9; if(nudges===1) tipChime(); } }   /* left undone: a wiggle and glow after 14 s, then every 10 s (the chime only on the first) */
  if(training()&&S.phase==='build'&&!bannered){ bannered=true; if(current()) banner('THE TRAINING GROUND','wave zero: watch the lane, then set up a ballista — the guide on the left leads'); }
  if(isGuest()){ const g=trainingGoblin(); if(g){ g.through=true; g.dead=.001; W0.g=null; } }   /* a page that started solo and then joined as a guest: its own wave-zero goblin is a phantom now (the host's hall is the real one) -- gone, uncounted (build 150). Build 159 (3/7): taken away quietly, the way one that got through is (below) -- kill() is a real kill: it paid 2 xp, a mana orb and a loot roll, so a fresh guest started with 2 xp */
  if(training()&&current()){ const id=current().id; if(W0.respawnT>0) W0.respawnT-=dt; if(id==='slay') waveZero(); if(id==='ballista') lendMana();
    const g=W0.g; if(g&&g.dead&&!g.through){ W0.kills++; W0.g=null; }   /* the player's blow (or a defense's) */
    else if(g&&!g.dead&&Math.hypot(g.x,g.z)<2.6){ g.through=true; g.dead=.001; W0.through++; W0.g=null; W0.respawnT=1.6; floatText(g.x,g.y+1.6,g.z,'IT GOT THROUGH','#ff8a6a'); if(window.__lesson) window.__lesson.show('That one walked straight to the crystal — another is coming. Swing when he is close.',6); } }
  const cur=current(); if(cur&&showing()&&!waitNext&&cur.done()){ st.done[cur.id]=true; save(); if(shownId===cur.id){ lastId=cur.id; waitNext=true; SFX.pickup&&SFX.pickup(); } /* a step done before it was ever shown (the locker with nothing waiting) passes silently */ if(!current()){ waitNext=false; finT=12; } }
  render(); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); tick(dt); }; }
setInterval(render,250);   // the game loop pauses under the tavern and on the end screens; the card still needs to step aside / come back
render();
window.__trainer={coop:()=>({role:netRole(),guest:isGuest()}),skip,look:()=>({cls:card.className,nudges,idleT:+idleT.toFixed(2)}),advance,waiting:()=>waitNext,w0:()=>({spawned:W0.spawned,gone:W0.gone,lent:W0.lent,kills:W0.kills,through:W0.through,goblin:!!trainingGoblin()}),state:()=>JSON.parse(JSON.stringify(st)),step:()=>{ const c=current(); return c?c.id:null; },text:()=>card.querySelector('.ts').textContent,showing,training,steps:STEPS.map(s=>s.id),counts:()=>({orbs,picked,equips}),reset:()=>{ st={done:{},off:false}; save(); waitNext=false; finT=0; lastId=shownId=flashedId=null; bannered=false; orbs=picked=equips=0; { const g=trainingGoblin(); if(g){ g.through=true; g.dead=.001; } W0.g=null; }   /* quietly, never kill() (build 159, 3/7): "reset guide" was worth 2 xp, an orb and a loot roll */ Object.assign(W0,{spawned:false,gone:false,lent:false,kills:0,through:0,respawnT:0}); render(); },KEY};   // build 150 ("reset guide doesn't do anything"): the counters and wave zero start over too, so the steps do not tick themselves off at once from the last run
})();
