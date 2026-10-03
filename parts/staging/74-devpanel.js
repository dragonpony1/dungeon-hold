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
// build 185 (Matt: "give item would be nice cuz i could see everything on demand and even dropon the floor to see how it
// looks" -- he was trying to hand-build a full set to check the armor look and found he had no familiar to fill the 5th
// slot): any set piece in any slot, or any of the 11 named mythics, built through window.__mythic.normalize -- the SAME
// path a hideout-returned piece takes -- then either into the bag (Meta.onPickup, as returnGear does) or straight onto
// the floor (dropLoot) so its real stand/card shows exactly as a genuine drop would.
const SETS=[['void','of the Void'],['crimson','of Chaos'],['rock','of the Earth'],['lava','of Fire'],['angelic','of Radiance'],['storm','of the Storm'],['shadow','of Shadow'],['ice','of Ice'],['wind','of the Wind']];
const SLOT_BASE={weapon:'Weapon',armor:'Armor',amulet:'Amulet',familiar:'Familiar',charm:'Charm'};
const SET_STAT={weapon:['dmg','spd','tow'],armor:['hp','def','regen'],amulet:['mana','tow','hp'],familiar:['fdmg','frate','move'],charm:['move','trate','tarea']};
const MYTHIC_STAT={dmg:24,spd:45,hp:156,def:24,regen:4.5,tow:41,mana:65,move:20,fdmg:35,frate:63,trate:20,tarea:18};
const FAM_KINDS=['Wisp','Bat','Sprite','Fire Imp','Crystal Owl','Storm Drake'];
function weaponLook(){ const hm=window.__weapons.mount&&window.__weapons.mount(); return hm&&hm.staff?'staff':hm&&hm.bow?'bow':'sword'; }
function setRec(slot,setId,famKind,lookOverride){ const tail=(SETS.find(s=>s[0]===setId)||[,'of a set'])[1]; const stats={}; for(const k of SET_STAT[slot]) stats[k]=MYTHIC_STAT[k];
  if(slot==='weapon'){ const look=lookOverride||weaponLook(); const it={slot,name:'Mythic '+look[0].toUpperCase()+look.slice(1)+' '+tail,setId,look,rarity:5,lvl:20,stats};
    if(lookOverride) it.forceLook=lookOverride;   // build 208 (Matt: "theres not an option to drop a bow it just says weapon"): weaponLook() only ever follows the CURRENT hero's own mount (a Knight always gets a sword no matter what set you pick), and the floor stand itself (93c-weaponstand.js) re-derives the same way, ignoring it.look entirely -- forceLook is a dev-panel-only field real drops never carry, so this never changes how a normal weapon's stand tracks whichever hero you're currently playing
    return it; }
  const base=slot==='familiar'?(famKind||'Wisp'):SLOT_BASE[slot];
  return {slot,name:base+' '+tail,setId,rarity:5,lvl:20,stats}; }
function giveIt(rec){ const it=window.__mythic.normalize(rec); if(!it){ toast('could not build that item'); return; } Meta.onPickup(it,{x:hero.x,y:hero.y+1,z:hero.z}); toast('Gave: '+it.name); }
function dropIt(rec){ const it=window.__mythic.normalize(rec); if(!it){ toast('could not build that item'); return; } if(window.__hideout&&window.__hideout.isOpen&&window.__hideout.isOpen()){ Meta.onPickup(it,{x:hero.x,y:hero.y+1,z:hero.z}); toast('🎒 In your bag: '+it.name); return; }   /* build 396 (Matt: OJ in the hideout dropped himself gear and it landed out in the hall): in the hideout there is no hall floor to drop on -- it goes straight into the bag the hideout shows */ const a=Math.random()*6.283;
  // build 208 (Matt: "why i couldnt drop on the floor from dev hud"): 1.4 units was well inside LOOT_HOOK's own 3.2-unit
  // auto-pickup radius (game.js) -- anything dropped this close gets magnetically pulled back into the bag within about
  // half a second, before there's ever a real chance to look at it standing on the floor. Clear of the hook now.
  dropLoot(it,hero.x+Math.cos(a)*4.5,hero.z+Math.sin(a)*4.5,true); toast('Dropped: '+it.name); }
function ensure(){ if(el) return; css();
  el=document.createElement('div'); el.id='devpanel'; el.className='hide';
  const mobOpts=Object.keys(MOBS).map(k=>`<option value="${k}">${k}</option>`).join('');
  const heroOpts=(window.__heroes?window.__heroes.list():[]).map(h=>`<option value="${h.id}">${h.name}${h.locked?' 🔒':''}</option>`).join('');
  const setOpts=SETS.map(([id,tail])=>`<option value="${id}">${tail.replace(/^of (the )?/,'')}</option>`).join('');
  const slotOpts=Object.keys(SLOT_BASE).map(k=>`<option value="${k}">${SLOT_BASE[k]}</option>`).join('');
  const famOpts=FAM_KINDS.map(k=>`<option value="${k}">${k}</option>`).join('');
  const named=(window.__mythic&&window.__mythic.NAMED)||{}; const namedOpts=Object.keys(named).map(id=>`<option value="${id}">${named[id].name}</option>`).join('');
  el.innerHTML=`<h3>⚙ DEV PANEL <span class="x" id="dp-x">✕</span></h3>
    <div class="sect"><label>jump to wave (current map)</label><div class="row"><input id="dp-wave" type="number" min="1" value="1" style="width:60px"><button id="dp-wave-go">Go</button></div></div>
    <div class="sect"><label>spawn now, at the door</label><div class="row"><select id="dp-mob">${mobOpts}</select><button id="dp-mob-go">Spawn</button><button id="dp-mob-5" title="a pack of five">×5</button></div></div>
    <div class="sect"><label>give yourself</label><div class="row"><button data-g="1000">+1000g</button><button data-g="10000">+10000g</button></div><div class="row"><button data-m="500">+500◆</button><button data-m="99999">+99999◆</button></div></div>
    <div class="sect"><label>character level</label><div class="row"><button id="dp-lv-dn">−1</button><input id="dp-lv" type="number" min="1" max="99" value="1" style="width:48px"><button id="dp-lv-up">+1</button><button id="dp-lv-go">Set</button></div></div>
    <div class="sect"><label>hero</label><div class="row"><select id="dp-hero">${heroOpts}</select><button id="dp-hero-go">Switch</button></div></div>
    <div class="sect"><label>set piece</label><div class="row"><select id="dp-slot">${slotOpts}</select></div><div class="row"><select id="dp-set">${setOpts}</select></div>
      <div class="row" id="dp-famrow"><select id="dp-fam">${famOpts}</select></div>
      <div class="row" id="dp-lookrow"><select id="dp-look"><option value="sword">Sword</option><option value="staff">Staff</option><option value="bow">Bow</option></select></div>
      <div class="row"><button id="dp-set-give">Give</button><button id="dp-set-drop">Drop here</button></div></div>
    <div class="sect"><label>named mythic</label><div class="row"><select id="dp-named">${namedOpts}</select></div><div class="row"><button id="dp-named-give">Give</button><button id="dp-named-drop">Drop here</button></div></div>
    <div class="sect"><label>unlock</label><div class="row"><button id="dp-unlock">All maps + heroes (reloads)</button></div></div>
    <div class="note">F9 to hide · a real player never sees this</div>`;
  document.body.appendChild(el);
  $('dp-x').onclick=()=>toggle(false);
  $('dp-wave-go').onclick=()=>jumpWave(+$('dp-wave').value||1);
  $('dp-mob-go').onclick=()=>spawnNow($('dp-mob').value);
  $('dp-mob-5').onclick=()=>{ const k=$('dp-mob').value; for(let i=0;i<5;i++){ if(k==='direwolf') spawnNow(k); else setTimeout(()=>spawnNow(k),i*180); } };   // wolves come out together, as a pack (build 318)   // build 316: a pack at a time (Matt trying the dire wolves)
  el.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>Meta.addGold(+b.dataset.g));
  el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{ if(guest()){ window.__net.send('dev',{a:'mana',amt:+b.dataset.m}); toast('💧 +'+b.dataset.m); return; } S.mana+=+b.dataset.m; });   // build 507: a guest's mana is its own pool on the host
  // build 314 (Matt: "add to dev hud change chatcter level"): set it outright, or step it one at a time
  const setLv=n=>{ const v=Meta.setLevel(n); $('dp-lv').value=v; toast('Level '+v); };
  $('dp-lv-go').onclick=()=>setLv(+$('dp-lv').value||1); $('dp-lv-up').onclick=()=>setLv(Meta.level()+1); $('dp-lv-dn').onclick=()=>setLv(Meta.level()-1);
  $('dp-hero-go').onclick=()=>{ if(window.__heroes) window.__heroes.select($('dp-hero').value); };
  const syncFamRow=()=>{ const w=$('dp-slot').value==='weapon'; $('dp-famrow').style.display=$('dp-slot').value==='familiar'?'flex':'none'; $('dp-lookrow').style.display=w?'flex':'none'; if(w) $('dp-look').value=weaponLook(); }; $('dp-slot').onchange=syncFamRow; syncFamRow();   // defaults to the current hero's own mount, same as before this control existed -- just now overridable
  const lookVal=()=>$('dp-slot').value==='weapon'?$('dp-look').value:undefined;
  // for a weapon, warm whichever real model the floor stand will actually ask for before handing/dropping it -- a
  // bow (or any set's real .glb) can be a genuine async fetch the first time (86j-realbows.js), and window.__weapons
  // model()'s own callback already resolves at once for anything already cached or code-built, so this costs nothing
  // in the common case and just avoids the exact race that showed "Dropped: Mythic Bow of Radiance" with no bow ever appearing
  const withWeaponReady=(rec,fn)=>{ if(rec.slot!=='weapon'){ fn(); return; } const key=window.__weaponStand&&window.__weaponStand.modelFor(rec); if(!key){ fn(); return; } window.__weapons.model(key,()=>fn()); };
  $('dp-set-give').onclick=()=>{ const rec=setRec($('dp-slot').value,$('dp-set').value,$('dp-fam').value,lookVal()); withWeaponReady(rec,()=>giveIt(rec)); };
  $('dp-set-drop').onclick=()=>{ const rec=setRec($('dp-slot').value,$('dp-set').value,$('dp-fam').value,lookVal()); withWeaponReady(rec,()=>dropIt(rec)); };
  $('dp-named-give').onclick=()=>giveIt({tier:'named',named:$('dp-named').value,lvl:20});
  $('dp-named-drop').onclick=()=>dropIt({tier:'named',named:$('dp-named').value,lvl:20});
  $('dp-unlock').onclick=()=>{ try{ localStorage.setItem('ddMapsCleared',String(MAPS.length)); }catch(e){} location.reload(); }; }
// jump straight to wave n on whatever map/mode is running now: clear the field quietly (no reward for a mob that
// was only ever a debug placeholder), rewind S.wave one short, then call the REAL startWave() -- by name, so the
// map-one locker gate, the co-op host broadcast and anything else layered onto it all run exactly as they would
// for a player who actually reached that wave
// build 507 (Matt: "dev tool not wokring for jacob"): on a co-op GUEST the hall is the host's -- jump wave, spawn and +mana go to the host and run there
// exactly as from the host's own panel (gold, level, hero, gear and unlock stay the guest's own)
const guest=()=>{ const n=window.__net; return !!(n&&n.role&&n.role()==='guest'); };
function jumpWave(n){ n=Math.max(1,n|0); if(guest()){ window.__net.send('dev',{a:'wave',n}); toast('📯 → 👑 '+n); return; } for(const e of enemies) if(!e.dead){ e.through=true; e.dead=.001; } spawnQ.length=0;
  S.phase='build'; S.held=false; S.wave=Math.max(0,n-1); startWave();
  toast('Jumped to wave '+n); }
function spawnNow(kind){ if(guest()){ window.__net.send('dev',{a:'spawn',kind}); toast('👾 → 👑 '+kind); return; } const k=Object.keys(LANES)[0]; if(!k){ toast('no lane on this map'); return; }
  // build 189: the Cyclops's real model only starts loading once Survival is actually chosen on the Throne Room
  // (95c-cyclops.js, build 188 -- keeps his ~31 MB off every other map/mode); spawning him here before that finishes
  // used to fall through to the generic block-body placeholder (the same one 'ogre' uses when ITS model isn't ready
  // yet) -- Matt: "spawned in a cyclops and he came in as one of those wooden dolls". Wait for the real model first.
  // build 193 (Matt: "the music stayed the same, and in fact it was the building music" -- his entrance stinger never
  // played from here): a plain spawnEnemy('cyclops',...) makes a live Cyclops, but skips window.__cyclops.spawn()
  // entirely -- the banner, camera shake and entrance sound all live THERE, not in the generic spawn path every other
  // dev-panel mob uses. Call his own spawn function instead so a dev-panel Cyclops arrives exactly like a real one.
  if(kind==='cyclops'&&window.__cyclops){ if(!window.__cyclops.loaded()){ toast('loading the Cyclops…'); window.__cyclops.ensure().then(()=>window.__cyclops.spawn()); } else window.__cyclops.spawn(); return; }
  // build 198: same reasoning as the Cyclops above -- the pig trio's real entrance (banner, camera shake, their
  // music) lives in spawnPigBosses(), not the generic path, and picking any one of the three should bring in all
  // three the way the real wave-7 trigger does, not just that one alone
  if(kind==='archhag'&&window.__archhag&&window.__archhag.ensure){ if(!window.__archhag.loaded()){ toast('loading the Archhag…'); window.__archhag.ensure().then(()=>window.__archhag.spawn()); } else window.__archhag.spawn(); return; }   // build 308: her real entrance (the garden wakes)
  if((kind==='pigflail'||kind==='pigdagger'||kind==='pigsling')&&window.__pigbosses){ if(!window.__pigbosses.loaded()){ toast('loading the pig bosses…'); window.__pigbosses.ensure().then(()=>window.__pigbosses.spawn()); } else window.__pigbosses.spawn(); return; }
  // build 317 (Matt: "mabye that stikmen didnt load all the way"): his moss stickmen only came down with the Archhag's model, so one spawned here was the code-built twig stand-in -- fetch them first
  if(kind==='stickman'&&window.__archhag&&window.__archhag.loadSticks&&!window.__archhag.sticksReady()){ toast('loading the stickmen…'); window.__archhag.loadSticks().then(()=>{ spawnEnemy(kind,k); toast('spawned a stickman'); }); return; }
  // build 316: the dire wolf's model loads the first time one is asked for (95g-direwolf.js); wait for it rather than send out a goblin-bodied stand-in
  if(kind==='direwolf'&&window.__direwolf&&!window.__direwolf.loaded()){ toast('loading the dire wolf…'); window.__direwolf.load().then(()=>{ if(window.__direwolf.loaded()) spawnNow(kind); }); return; }
  spawnEnemy(kind,k); toast('spawned a '+kind); }
function toggle(v){ ensure(); open=v===undefined?!open:v; el.classList.toggle('hide',!open); if(open&&$('dp-lv')) $('dp-lv').value=Meta.level(); }
addEventListener('keydown',e=>{ if(e.code==='F9'){ e.preventDefault(); toggle(); } });
window.__devpanel={toggle,isOpen:()=>open,jumpWave,spawnNow};
})();
