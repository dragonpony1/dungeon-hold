// ===== DEV PANEL (build 184). Matt: "or give me dev power lol" -- after asking me to hand-place a boss on a specific
// wave just so he could look at it. A hidden panel, F9 to show/hide, never seen unless summoned: jump straight to any
// wave (no grinding a survival run up to see a late boss), spawn any monster on the spot, hand yourself gold or mana,
// switch hero, or unlock every map and hero for testing. Every action calls the SAME functions a real player's own
// keys/UI call (startWave, spawnEnemy, Meta.addGold...) BY NAME -- not through window.__dd, whose own hooks are bare
// references captured before later modules wrap them (the touch-button bug, build 159, was exactly this mistake) --
// so a wave jumped to here spawns, scores and syncs in co-op exactly as if the player had actually reached it.
(function(){
let open=false, el=null;
function css(){ if($('devpanelcss')) return; const s=document.createElement('style'); s.id='devpanelcss'; s.textContent=
 `#devpanel{position:fixed;top:100px;right:10px;z-index:50;background:#0b0712ee;border:2px solid #6b5a3c;border-radius:10px;padding:10px 12px;color:#f1e6d0;font:12px/1.4 system-ui,sans-serif;width:216px;max-height:92vh;overflow:auto;box-shadow:0 6px 20px #000a}
  #devpanel.hide{display:none}
  #devpanel h3{margin:0 0 6px;font-size:12px;letter-spacing:2px;color:var(--gold,#ffc040);text-transform:uppercase;display:flex;justify-content:space-between;cursor:default}
  #devpanel .x{cursor:pointer;color:#bfae90}
  #devpanel .sect{border-top:1px solid #3a2f28;margin-top:7px;padding-top:7px}
  #devpanel label{font-size:10px;color:#bfae90;display:block;margin-bottom:3px;letter-spacing:.5px}
  #devpanel .row{display:flex;gap:5px;margin-bottom:5px}
  #devpanel input,#devpanel select{flex:1;min-width:0;background:#1c1424;border:1px solid #6b5a3c;color:#f1e6d0;border-radius:4px;padding:3px 5px;font-size:12px}
  #devpanel button{background:linear-gradient(#7a2a2e,#3e1416);border:1px solid var(--gold,#ffc040);color:#fff;border-radius:5px;padding:3px 7px;font-size:11px;cursor:pointer;white-space:nowrap}
  #devpanel button:hover{filter:brightness(1.2)}
  #devpanel .note{font-size:9px;color:#7d7286;margin-top:6px}`;
  document.head.appendChild(s); }
function ensure(){ if(el) return; css();
  el=document.createElement('div'); el.id='devpanel'; el.className='hide';
  const mobOpts=Object.keys(MOBS).map(k=>`<option value="${k}">${k}</option>`).join('');
  const heroOpts=(window.__heroes?window.__heroes.list():[]).map(h=>`<option value="${h.id}">${h.name}${h.locked?' 🔒':''}</option>`).join('');
  el.innerHTML=`<h3>⚙ DEV PANEL <span class="x" id="dp-x">✕</span></h3>
    <div class="sect"><label>jump to wave (current map)</label><div class="row"><input id="dp-wave" type="number" min="1" value="1" style="width:60px"><button id="dp-wave-go">Go</button></div></div>
    <div class="sect"><label>spawn now, at the door</label><div class="row"><select id="dp-mob">${mobOpts}</select><button id="dp-mob-go">Spawn</button></div></div>
    <div class="sect"><label>give yourself</label><div class="row"><button data-g="1000">+1000g</button><button data-g="10000">+10000g</button></div><div class="row"><button data-m="500">+500◆</button><button data-m="99999">+99999◆</button></div></div>
    <div class="sect"><label>hero</label><div class="row"><select id="dp-hero">${heroOpts}</select><button id="dp-hero-go">Switch</button></div></div>
    <div class="sect"><label>unlock</label><div class="row"><button id="dp-unlock">All maps + heroes (reloads)</button></div></div>
    <div class="note">F9 to hide · a real player never sees this</div>`;
  document.body.appendChild(el);
  $('dp-x').onclick=()=>toggle(false);
  $('dp-wave-go').onclick=()=>jumpWave(+$('dp-wave').value||1);
  $('dp-mob-go').onclick=()=>spawnNow($('dp-mob').value);
  el.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>Meta.addGold(+b.dataset.g));
  el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{ S.mana+=+b.dataset.m; });
  $('dp-hero-go').onclick=()=>{ if(window.__heroes) window.__heroes.select($('dp-hero').value); };
  $('dp-unlock').onclick=()=>{ try{ localStorage.setItem('ddMapsCleared',String(MAPS.length)); }catch(e){} location.reload(); }; }
// jump straight to wave n on whatever map/mode is running now: clear the field quietly (no reward for a mob that
// was only ever a debug placeholder), rewind S.wave one short, then call the REAL startWave() -- by name, so the
// map-one locker gate, the co-op host broadcast and anything else layered onto it all run exactly as they would
// for a player who actually reached that wave
function jumpWave(n){ n=Math.max(1,n|0); for(const e of enemies) if(!e.dead){ e.through=true; e.dead=.001; } spawnQ.length=0;
  S.phase='build'; S.held=false; S.wave=Math.max(0,n-1); startWave();
  toast('Jumped to wave '+n); }
function spawnNow(kind){ const k=Object.keys(LANES)[0]; if(!k){ toast('no lane on this map'); return; } spawnEnemy(kind,k); toast('spawned a '+kind); }
function toggle(v){ ensure(); open=v===undefined?!open:v; el.classList.toggle('hide',!open); }
addEventListener('keydown',e=>{ if(e.code==='F9'){ e.preventDefault(); toggle(); } });
window.__devpanel={toggle,isOpen:()=>open};
})();
