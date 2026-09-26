// ===== HEROES: the playable characters, each a Meshy rig fetched from assets/. The pick is saved (ddHero) and can be
// changed on the start screen; a different hero swaps in live, no reload. The witch and the fighter both fight with a
// battle staff: the model carries a staffMount in its grip hand (meshy/witch3's recipe — geometric, no baked-in staff
// mesh), the weapons module puts a code-built staff there, and a swing throws a bolt (82-staff.js) — same mechanic,
// different look. The Gnome Warden and Gnome Ninja were retired (their Meshy rigs never held up through a full
// animation pass); the Gnome Knight and Gnome Fighter each pick a weapon back up on the clean pipeline that replaced
// them (a trimmed attack window instead of the raw clip, no root motion fighting the jump, a de-biased idle). All
// twelve defenses split evenly, three per hero: Knight reclaimed the Warden's old three from the Troll Archer, and
// the Fighter reclaims zap/ember/dazzle — parked on the Witch since the Ninja's removal — from her.
const HEROES=[
  {id:'witch', name:'GNOME BATTLE WITCH',sub:'a battle staff that shoots · bolts reach 18',glb:'witch.glb',label:'Gnome Battle Witch (Meshy)',reach:18,unlocks:['frost','ball','slice']},
  {id:'troll', name:'TROLL ARCHER',sub:'a longbow · arrows reach 24',glb:'troll.glb',label:'Troll Archer (Meshy)',reach:24,unlocks:['acorn','snare','venom']},   // doubled from 9/12: both targeting range and projectile flight distance derive from reach (83-bow.js, 82-staff.js), so this doubles how far a ranged hero can actually engage, not just how far the bolt visually flies
  {id:'knight',name:'GNOME KNIGHT',sub:'sword and shield-arm · the hall\'s keeper',glb:'knight.glb',label:'Gnome Knight (Meshy)',reach:2.4,unlocks:['harpoon','spike','totem']},
  {id:'fighter',name:'GNOME FIGHTER',sub:'a battle staff that shoots · bolts reach 18',glb:'fighter.glb',label:'Gnome Fighter (Meshy)',reach:18,unlocks:['zap','ember','dazzle']}];
let heroPick=(()=>{ try{ return HEROES.find(h=>h.id===localStorage.getItem('ddHero'))||HEROES[0]; }catch(e){ return HEROES[0]; } })();
function installHero(h){ heroPick=h; try{ localStorage.setItem('ddHero',h.id); }catch(e){} hero.reach=h.reach;
  return fetchBytes(ASSET(h.glb),'first').then(buf=>{ if(heroPick!==h) return; if(GLBH&&GLBH.label&&!/Meshy/.test(GLBH.label)) return;   // the player dropped their own model meanwhile: keep it
    loadHeroGLB(buf,h.label,true); hero.reach=h.reach; }).catch(e=>console.warn('hero '+h.id,e)); }
installHero(heroPick);
window.__heroes={list:()=>HEROES.map(h=>({id:h.id,name:h.name})),pick:()=>heroPick.id,unlocks:()=>heroPick.unlocks,canUse:k=>heroPick.unlocks.includes(k),
  select:id=>{ const h=HEROES.find(h=>h.id===id); if(h) return installHero(h); },
  next:()=>{ const i=HEROES.findIndex(h=>h.id===heroPick.id); const nh=HEROES[(i+1)%HEROES.length]; installHero(nh); toast('Hero: '+nh.name); if(placing&&!nh.unlocks.includes(placing)) cancelPlace(); return nh.id; }};
// ---- each hero unlocks its own two to four defenses (the raven's job, once it grows a real picker): the hotbar
// shows only that hero's own kinds, in the order the hero lists them, keyed 1..N — nothing else visible, nothing
// greyed out. A switch (raven or H) reflows the slots on the next hud tick.
const NUMKEYS=['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9'];
{ const prevSel=select; select=function(kind){ if(DEFKEYS.includes(kind)&&!heroPick.unlocks.includes(kind)){ toast(DEFS[kind].name+' needs a different hero — press H at the raven to switch'); return; } return prevSel(kind); }; }
{ const prevHud=Meta.hud; Meta.hud=()=>{ prevHud(); DEFKEYS.forEach(k=>{ const el=$('slot-'+k); if(!el) return; const i=heroPick.unlocks.indexOf(k), hide=i<0;
  if((el.style.display==='none')!==hide) el.style.display=hide?'none':''; if(!hide){ const lab=String(i+1); const kEl=el.querySelector('.k'); if(kEl&&kEl.textContent!==lab) kEl.textContent=lab; } }); }; }
// the base Digit1-12 wiring (game.js) assumes the old always-all-12 hotbar; intercept in the capture phase, remap to
// this hero's own list by position, and swallow the event so the base handler can't also fire on its old fixed kind
addEventListener('keydown',e=>{ if(Meta.isOpen()||S.phase==='start') return; const i=NUMKEYS.indexOf(e.code); if(i<0) return; const kind=heroPick.unlocks[i]; if(kind) select(kind); e.stopImmediatePropagation(); },true);
{ const prevHUD=updateHUD; updateHUD=function(){ prevHUD(); if(S.phase==='build'&&!TOUCH){ const n=heroPick.unlocks.length, want='Place defenses (1'+(n>1?'–'+n:'')+'), then press G to sound the horn', el=$('phaset'); if(el.textContent!==want) el.textContent=want; } }; }
