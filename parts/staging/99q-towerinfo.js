// ===== WHAT IS THIS TOWER? (build 572). Matt: "there should be a way to mouse over the diffent towers and read a short explanation of what it is".
//   * point the crosshair at a tower standing in the hall (the same tower the range ring already lights, game.js hoverFor) and a small card under the crosshair says what it is: its icon, name, mark
//     and one short line;
//   * PICK a tower to build (its number key, or its button) and, while you choose where it goes, the same card sits above the bar -- Matt: 'but how do you hover over the tower in the hot bar'
//     (in play the mouse is the crosshair, it never reaches the bar); a free mouse pointing at a button (touch, a menu up) gets it too.
// One line each, plain words (Matt's wife's first play: "shes not a gamer"). Test hook: window.__towerinfo.
(function(){
'use strict';
const LINE={
  harpoon:'Fires spinning saw blades a long way down a lane', acorn:'Sprays bouncing acorns at mobs up close', ball:'Lobs turnips that splash a whole crowd',
  slice:'Slows mobs inside it, and bursts now and then', spike:'A thorny wall: blocks the way, hurts what hits it, grows back', totem:'Towers near it hit harder and faster',
  frost:'Chills mobs around it so they crawl', snare:'Nets flying mobs out of the sky', zap:'Zaps every mob in its ring at once', venom:'Poisons mobs that walk through it',
  ember:'Burns mobs standing in its ring', dazzle:'Confuses mobs so they wander off', pit:'Swallows a crowd that stands on it', shock:'Throws lightning that jumps between mobs',
  trap:'Snaps shut: everything on it dies', sky:'Fireworks for flying mobs only, very long reach', perch:'Climb it to shoot from up high', skyplat:'A high deck to set a Sky Wrecker or a tower on',
  turret:'A fast crossbow that turns all the way round', barricade:'A wall to steer the horde: it walks the long way round', bgate:'A wall heroes walk through and mobs cannot' };
const ROM=['','I','II','III','IV','V','VI','VII','VIII','IX','X'];
const cnt={ world:0, bar:0 };
const st=document.createElement('style'); st.textContent=
 '#towerinfo{position:fixed;z-index:30;pointer-events:none;display:none;min-width:200px;max-width:300px;background:#0b0912e8;border:2px solid #c9962f;border-radius:10px;padding:7px 11px;color:#f3e6cf;font:14px/1.3 Georgia,serif;box-shadow:0 4px 14px #000;transform:translateX(-50%)}'+
 '#towerinfo .h{display:flex;align-items:center;gap:8px;font:bold 15px Georgia,serif;color:#ffd27a;letter-spacing:1px}#towerinfo .h .i{font-size:22px}#towerinfo .h .m{margin-left:auto;font-size:12px;color:#c9b8a0;letter-spacing:0}#towerinfo .l{margin-top:3px;color:#efe2c8}';
document.head.appendChild(st);
const el=document.createElement('div'); el.id='towerinfo'; document.body.appendChild(el);
let mode=null, barKey=null;
function fill(kind,lvl){ const c=DEFS[kind]; if(!c) return false; const line=LINE[kind]||'';
  el.innerHTML='<div class="h"><span class="i">'+c.ic+'</span><span>'+c.name+'</span>'+(lvl&&!c.noUp?'<span class="m">Mark '+(ROM[lvl]||lvl)+'</span>':'')+'</div>'+(line?'<div class="l">'+line+'</div>':''); return true; }
// the bar: hover a tower's button
const bar=document.getElementById('hotbar');
if(bar){ bar.addEventListener('mouseover',e=>{ const s=e.target.closest&&e.target.closest('.slot'); if(!s||!s.id||s.id.slice(0,5)!=='slot-') return; const k=s.id.slice(5); if(!fill(k,0)) return;
    const r=s.getBoundingClientRect(); el.style.display='block'; el.style.left=(r.left+r.width/2)+'px'; el.style.top=Math.max(6,r.top-8-el.offsetHeight)+'px'; mode='bar'; barKey=k; cnt.bar++; });
  bar.addEventListener('mouseleave',()=>{ if(mode==='bar'){ el.style.display='none'; mode=null; } }); }
// the hall: the tower under the crosshair
let last=null;
let placeKey=null;
setInterval(()=>{ if(mode==='bar') return;
  let pk=null; try{ pk=(placing&&DEFS[placing]&&(S.phase==='build'||S.phase==='wave')&&!Meta.isOpen())?placing:null; }catch(e){}
  if(pk){ if(pk!==placeKey||mode!=='place'){ fill(pk,0); placeKey=pk; cnt.place=(cnt.place|0)+1; } const hb=document.getElementById('hotbar'), r=hb?hb.getBoundingClientRect():null; el.style.display='block'; el.style.left=(innerWidth/2)+'px'; el.style.top=Math.max(6,(r&&r.height?r.top:innerHeight-110)-10-el.offsetHeight)+'px'; mode='place'; return; }
  if(mode==='place'){ el.style.display='none'; mode=null; placeKey=null; }
  let d=null; try{ d=(!placing&&(S.phase==='build'||S.phase==='wave')&&!Meta.isOpen()&&typeof hoverFor!=='undefined')?hoverFor:null; }catch(e){}
  if(!d||!DEFS[d.kind]){ if(mode==='world'){ el.style.display='none'; mode=null; last=null; } return; }
  const lvl=d.lvl|0; if(d!==last||el.dataset.lvl!==String(lvl)){ fill(d.kind,lvl); el.dataset.lvl=String(lvl); last=d; cnt.world++; }
  el.style.left=(innerWidth/2)+'px'; el.style.top=(innerHeight/2+46)+'px'; el.style.display='block'; mode='world'; },120);
window.__towerinfo={ info:()=>Object.assign({ mode, shown:el.style.display==='block', text:el.textContent },cnt), LINE };
})();
