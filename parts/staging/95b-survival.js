// ===== SURVIVAL MODE (build 176). Matt: "we need a mode choice so i can do a map in survival mode" ... "yes and the max waves is 50 for
// now" ... "the thing that should make it harder and harder is sheer volume of mobs". The rules live in game.js (SURVIVAL, runWaves,
// waveComp's survival branch, statWave, the live cap in updateWave, winMap's SURVIVAL COMPLETE); this module is everything around them:
//  - the MODE row on the title, right under the map picker: ⚔ CAMPAIGN / ☠ SURVIVAL. Survival opens per map once that map is cleared
//    in the campaign (ddMapsCleared, read fresh, so the testing line's "unlock all maps" opens it at once); a locked map says so. The
//    pick flips game.js's SURVIVAL on the spot (the map is already built; nothing reads the mode before the first wave) and is
//    remembered in ddMode, so ◀ ▶, TRY AGAIN and REPLAY come back to it. Shut in a co-op lobby (the host's mode goes to the guests with
//    the roster and the world broadcast) and never built in the tutorial hall
//  - each map's best: the most Survival waves HELD on it, dd_survivalBest {mapId: waves}, saved the moment each wave is held (closing
//    the tab mid-run loses nothing), shown on the mode row, and on the end screen: "SURVIVED 22 WAVES — A NEW BEST". A co-op guest's
//    best is written from the host's run end (99-network.js calls record())
//  - the end: SURVIVAL COMPLETE for the fiftieth wave held (game.js winMap opens build 160's victory lap, ▶ MOVE ON as ever, no NEXT
//    MAP), SHATTERED with the waves survived when the crystal falls -- on the tally card (20-tavern.js reads data.survival) and on the
//    old end screen behind it
// Rewards are the campaign's own (gold, xp, the wave's drop, loot level by effWave with the mythic and named rolls); nothing here pays.
(function(){
if(TUTORIAL) return;
const KEY='dd_survivalBest', MODE='ddMode';
const cleared=()=>{ try{ return Math.max(0,Math.min(MAPS.length,parseInt(localStorage.getItem('ddMapsCleared'))||0)); }catch(e){ return 0; } };
const open=i=>cleared()>(i===undefined?MAPI:i);   // Survival on map i: that map held in the campaign
function bests(){ try{ const o=JSON.parse(localStorage.getItem(KEY)||'{}'); return o&&typeof o==='object'&&!Array.isArray(o)?o:{}; }catch(e){ return {}; } }
function best(id){ const v=bests()[id||MAP.id]; return Number.isFinite(v)?Math.max(0,Math.min(SURVIVAL_WAVES,v|0)):0; }
const startBest=best();   // the best this map had when the page loaded -- one page is one run, so "a new best" is measured against this
// waves held on this map in Survival: kept if it beats the saved best; newBest against the run's starting best
function record(held){ held=Math.max(0,Math.min(SURVIVAL_WAVES,held|0)); const o=bests(); if(held>(o[MAP.id]|0)){ o[MAP.id]=held; try{ localStorage.setItem(KEY,JSON.stringify(o)); }catch(e){} render(); }
  return {held,best:best(),prev:startBest,newBest:held>startBest}; }
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const guest=()=>!!(window.__net&&window.__net.role&&window.__net.role()==='guest');
// ---- the mode row
const st=document.createElement('style');
// #start-scoped: the page's own rule for .mapline buttons (#start .mapline button, 40 px wide) sits later in the document than this sheet
st.textContent='#start #modeline{flex-wrap:wrap;margin:8px 0 2px;row-gap:4px}#modeline .mlab{font-size:12px;letter-spacing:2px;color:#bfae90}'
 +'#start #modeline button.mode{width:auto;height:34px;padding:0 14px;font:bold 14px Georgia,serif;letter-spacing:1px;background:#2a1f33;border:2px solid #6b5a3c;border-radius:8px;color:#e9ddc8;cursor:pointer}'
 +'#start #modeline button.mode.sel{border-color:var(--gold);color:#fff;background:#4a3419;box-shadow:0 0 10px rgba(232,185,74,.45)}#start #modeline button.mode[data-m="survival"].sel{background:#4a1a1a;border-color:#e0603a;box-shadow:0 0 12px rgba(224,96,58,.55)}'
 +'#start #modeline button.mode.locked{opacity:.45;cursor:default}#modeline small{flex-basis:100%;text-align:center}'
 +'#start.inLobby #modeline button,#start.coopPage #modeline button{pointer-events:none}#start.inLobby #modeline button:not(.sel),#start.coopPage #modeline button:not(.sel){opacity:.2}';
document.head.appendChild(st);
function row(){ let el=$('modeline'); if(!el){ const ml=$('mapline'); if(!ml) return null; el=document.createElement('p'); el.id='modeline'; el.className='mapline'; ml.insertAdjacentElement('afterend',el); } return el; }
function render(){ const el=row(); if(!el) return; const op=open(), b=best();
  const why=op?(SURVIVAL?SURVIVAL_WAVES+' waves, each bigger than the last · a boss every tenth · '+(b?'your best: '+b+' of '+SURVIVAL_WAVES+' held':'no best yet')
      :'the map\'s own '+MAP.waves+' waves'+(MAPI+1<MAPS.length?', then the next map opens':'')+(b?' · survival best here: '+b+' of '+SURVIVAL_WAVES:''))
    :'🔒 Survival opens once '+MAP.name+' is cleared in the campaign';
  const html='<span class="mlab">MODE</span><button class="mode'+(SURVIVAL?'':' sel')+'" data-m="campaign" title="the map\'s own waves">⚔ CAMPAIGN</button><button class="mode'+(SURVIVAL?' sel':'')+(op?'':' locked')+'" data-m="survival" title="'+(op?'up to '+SURVIVAL_WAVES+' waves on this map':'clear this map in the campaign first')+'">'+(op?'☠':'🔒')+' SURVIVAL</button><small>'+why+'</small>';
  if(el.innerHTML!==html){ el.innerHTML=html; el.querySelectorAll('button.mode').forEach(x=>{ x.onclick=e=>{ e.stopPropagation(); set(x.dataset.m==='survival'); }; }); } }
// the pick: only on the title, never past this map's campaign, never in a lobby or on a page following a host
function set(on){ on=!!on; const s=$('start'); if(S.phase!=='start'||(s&&(s.classList.contains('inLobby')||s.classList.contains('coopPage')))) return false;
  if(on&&!open()){ toast('Hold all '+MAP.waves+' waves of '+MAP.name+' in the campaign to open its Survival'); render(); return false; }
  SURVIVAL=on; try{ localStorage.setItem(MODE,on?'survival':'campaign'); }catch(e){} render(); return true; }
render();
// ---- every wave held in Survival is saved as it happens (a guest's goes in from the host's run end instead: 99-network.js)
{ const prev=Meta.onWaveHeld; Meta.onWaveHeld=function(w){ const r=prev.apply(this,arguments); if(SURVIVAL&&!guest()) record(S.wave); return r; }; }
// ---- the run's end: the tally's words and the old end screen behind it
{ const prev=Meta.onRunEnd; Meta.onRunEnd=function(w,o){ if(!SURVIVAL||guest()) return prev.apply(this,arguments);
    const won=!!(o&&o.won), held=won?S.wave:Math.max(0,S.wave-1), r=record(held);
    const sv={held,best:r.best,newBest:r.newBest,total:SURVIVAL_WAVES};
    $('deadh1').textContent=won?'SURVIVAL COMPLETE':'SHATTERED';
    if(won) $('deadh2').innerHTML=esc(MAP.name)+' · ALL <span id="deadwave">'+held+'</span> WAVES HELD'; else $('deadh2').innerHTML='THE CRYSTAL FELL ON WAVE <span id="deadwave">'+S.wave+'</span> · SURVIVED '+held+' WAVE'+(held===1?'':'S')+(r.newBest?' — A NEW BEST':'');
    $('deadp').textContent=won?'Fifty waves, and the crystal stands. Your gear, gold and skills stay with you.':(r.newBest?'Your best on this map yet. ':'Your best here: '+r.best+' waves. ')+'Your gear, gold and skills stay with you.';
    $('nextmapbtn').style.display='none'; $('againbtn').textContent='↻ SURVIVE AGAIN';
    return prev.call(this,w,Object.assign({},o,{survival:sv})); }; }
// SURVIVAL COMPLETE on the end screen behind the lap (95-campaign.js's wrap worded it HALL HELD / NEXT MAP)
{ const prev=winMap; winMap=function(){ prev.apply(this,arguments); if(!SURVIVAL) return; $('deadh1').textContent='SURVIVAL COMPLETE'; $('deadh2').innerHTML=esc(MAP.name)+' · ALL <span id="deadwave">'+S.wave+'</span> WAVES HELD';   /* the span stays: TRY AGAIN's old screen and the tavern's close write the wave into #deadwave */ $('nextmapbtn').style.display='none'; $('againbtn').textContent='↻ SURVIVE AGAIN'; }; }
window.__survival={ record, best, bests, set, render, open, on:()=>SURVIVAL, startBest:()=>startBest, line:()=>{ const el=$('modeline'); return el?el.textContent:''; },
  state:()=>({on:SURVIVAL,open:open(),best:best(),waves:SURVIVAL_WAVES,live:SURVIVAL_LIVE,sel:(()=>{ const el=$('modeline'), b=el&&el.querySelector('button.sel'); return b?b.dataset.m:null; })()}) };
})();
