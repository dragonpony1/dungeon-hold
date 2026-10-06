// ===== THE TWO FAMILIAR RINGS: BEAST MODE AND MALAMUTE (build 426). Matt: "i am adding a ring as a named trinket that allows the wearer to have 2 familiars, one on each side" / "there will need to be a second
// slot for familiars in the bag" / "there are two named rings that do this, each with a 10% chance to drop per round from the beginning -- first is called Beast Mode, second is called Malamute", and his drop
// sound (UI assessts\sounds\named ring for 2.mp3 -> parts/assets/named-ring-two.mp3).
//  * The rings are named charms (97-mythics.js NAMED: beast_mode, malamute). Every wave held, from the first, each has a 10% chance to drop by the hero -- unless you already have it (on you, in the bag, the
//    armory or on another hero). Its drop plays Matt's sound instead of the named-mythic fanfare (the beam still rises).
//  * Worn, either opens the SECOND FAMILIAR SLOT (gear.familiar2): its card sits under your familiar in the bag; a spare familiar's card in the bag gets "Equip as 2nd"; a click on the 2nd card takes it off.
//    Take the ring off and the 2nd familiar goes back into the bag by itself (it waits in its slot, asleep, only if the bag is full).
//  * The second pet flies at your OTHER shoulder and fights exactly as the first does -- the familiar code (30-familiar.js, 85-familiars.js) runs a second time each frame with it swapped in (FAM_SIDE -1). Both
//    count at full strength, their stats too (heroStat adds it). Saved in ddGear with the rest of what you wear.
// Test hook: window.__tworings.
(function(){
'use strict';
const RINGS=['beast_mode','malamute'], RING_SET=new Set(RINGS), DROP=.10;
const ringOn=()=>{ const c=gear.charm; return !!(c&&c.named&&RING_SET.has(c.named)); };
const cnt={ drops:0, passes:0, returned:0 };
// ---- the saved 2nd familiar (game.js loadGear reads the five slots only)
try{ const g=JSON.parse(localStorage.getItem('ddGear')); const it=g&&g.familiar2; if(it&&it.stats&&it.slot==='familiar'&&it.id) gear.familiar2=it; }catch(e){}
// ---- its stats count while a ring is worn
{ const prev=heroStat; heroStat=function(k){ const v=prev.apply(this,arguments); const f=gear.familiar2; return (f&&ringOn()&&f.stats&&f.stats[k])?v+f.stats[k]:v; }; }
if(typeof applyGear==='function') try{ applyGear(); }catch(e){}
// ---- the second pass of the familiar, each frame, with the 2nd pet swapped in
let fam2=null;
function secondPass(dt){ const f2=ringOn()?gear.familiar2:null; if(!f2&&!fam2) return;
  const f1=fam, g1=gear.familiar, g2=gear.familiar2; fam=fam2; gear.familiar=f2; gear.familiar2=g1; FAM_SIDE=-1; FAM_PASS2=true; cnt.passes++;
  try{ const FA=window.__familiar; if(fam&&FA&&FA.stale&&FA.stale()) famRemove();   // build 508 (Matt, solo survival: "a few things arn't loading in, like my bat"): a model that lands after the 2nd pet spawned only swapped pet 1 -- the 2nd kept its stand-in body all run; it respawns now in the real one
    famUpdate(dt); } catch(e){ console.warn('second familiar',e); } finally { fam2=fam; fam=f1; gear.familiar=g1; gear.familiar2=g2; FAM_SIDE=1; FAM_PASS2=false; } }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); tick(); secondPass(dt); }; }
// ---- the ring off: the 2nd familiar back to the bag
// build 430: a ring dropped before its picture existed gets it now (Matt's thumbnails: named/beast_mode.jpg, named/malamute.jpg)
let artDone=false; function fillArt(){ if(artDone) return; const A=window.__mythicDrops&&window.__mythicDrops.art; if(!A) return; artDone=true; const all=[gear.charm].concat(Meta.bag(),Meta.armory?Meta.armory():[]); for(const it of all){ if(it&&it.named&&RING_SET.has(it.named)&&!it.art){ const p=A(it); if(p) it.art=p; } } }
// build 571 (Matt: "whenever the map changes or maybe even when you change charcters the 2nd pet is unequipping on its own"): a hero switch laid the new hero's five pieces in (71-herogear.js) but the
// 2nd pet stayed, the new hero had no ring, and this sent it to the bag -- and switching back never brought it home. Now EACH HERO KEEPS THEIR OWN 2nd pet (dd_heroPet2, beside the 2nd weapon's own
// per-hero store in 99k-dualwield.js): filed on the way out of a hero, laid back in on the way in, the current hero's mirrored there too (so a reload that lost it from ddGear finds it). And it goes
// back to the bag only when THIS hero's ring actually comes off -- never because the hero, the map or the page changed.
const PKEY='dd_heroPet2', rdP=()=>{ try{ const o=JSON.parse(localStorage.getItem(PKEY)); return o&&typeof o==='object'&&!Array.isArray(o)?o:{}; }catch(e){ return {}; } }, wrP=o=>{ try{ localStorage.setItem(PKEY,JSON.stringify(o)); }catch(e){} };
const famOk=it=>!!(it&&it.stats&&it.slot==='familiar'&&it.id), inBag=id=>{ try{ return Meta.bag().some(b=>b&&b.id===id); }catch(e){ return false; } }, heroNow=()=>typeof heroPick!=='undefined'&&heroPick?heroPick.id:null;
try{ const h=heroNow(), st=rdP(); if(h&&!gear.familiar2&&famOk(st[h])&&!inBag(st[h].id)) gear.familiar2=st[h]; }catch(e){}   // boot: the current hero's 2nd pet, if ddGear lost it
let mirId;   // the current hero's 2nd pet as last written to the store
function mirror(){ const h=heroNow(); if(!h) return; const cur=gear.familiar2||null, id=cur?cur.id:null; if(id===mirId) return; mirId=id; const st=rdP(); if(cur) st[h]=cur; else delete st[h]; wrP(st); }
if(typeof installHero==='function'){ const prev=installHero; installHero=function(h){ const from=heroNow(); const r=prev.apply(this,arguments); const to=heroNow();
  if(from&&to&&from!==to){ const st=rdP(); if(gear.familiar2) st[from]=gear.familiar2; else delete st[from]; const nx=st[to]; if(famOk(nx)&&!inBag(nx.id)) gear.familiar2=nx; else delete gear.familiar2;   /* no key at all when there is none, as before */ wrP(st); mirId=gear.familiar2?gear.familiar2.id:null; cnt.swapped=(cnt.swapped|0)+1; try{ applyGear(); }catch(e){} }   /* no saveGear here: the switch has saved its own sets; ddGear picks the pet up on the next save, the store already has it */
  return r; }; }
let tickHero=null, lastOn=null;
function tick(){ fillArt(); const h=heroNow(), on=ringOn(); if(h!==tickHero){ tickHero=h; lastOn=on; return; } lastOn=on; const f=gear.familiar2; if(!f||on){ mirror(); return; }   /* the ring off this hero (a hero change files and lays the pets in installHero above, and skips a tick here) */
  if(Meta.giveItem&&Meta.giveItem(f)){ gear.familiar2=null; cnt.returned++; saveGear(); try{ applyGear(); }catch(e){} toast('🦉 Your 2nd familiar went back to your bag'); } }
// ---- equip / unequip the 2nd
function equip2(id){ if(!ringOn()) return false; const bag=Meta.bag(); const i=bag.findIndex(b=>b.id===id); if(i<0||bag[i].slot!=='familiar') return false; const it=bag.splice(i,1)[0]; const old=gear.familiar2; gear.familiar2=it; if(old) bag.push(old);
  saveGear(); Meta.save&&Meta.save(); try{ applyGear(); }catch(e){} return true; }
function unequip2(){ const f=gear.familiar2; if(!f) return false; if(Meta.bagFull&&Meta.bagFull()){ toast('Bag is full'); return false; } gear.familiar2=null; Meta.bag().push(f); saveGear(); Meta.save&&Meta.save(); try{ applyGear(); }catch(e){} return true; }
// ---- the bag screen: "Equip as 2nd" on a spare familiar's card. The 2nd pet's own card is the sixth EQUIPPED card now (build 524 prep, 99l-bagstyle.js: Matt's mockup's OFF-HAND / 2ND PET slot), which
// replaced the separate 2ND FAMILIAR row that used to sit here under your familiar; a click on it still comes through tvClick as from 'fam2'.
// build 505 (Matt: "how to upgrade 2nd pet" / "yes fix that"): a click on the 2nd card opens its panel -- the forge (🔨 +1 / +5, 96f) and a Take off button -- the same as your first pet's.
// The panel is the worn-piece panel with gear.familiar2 standing in for the slot, so every wrap (the forge, the pictures) draws it; its Unequip/Lock buttons become one Take off.
if(typeof tvRenderDetail==='function'){ const prev=tvRenderDetail; tvRenderDetail=function(){ const s0=TV.sel; if(s0&&s0.from==='fam2'){ const f=gear.familiar2; if(!f||f.id!==s0.id){ TV.sel=null; return prev.apply(this,arguments); }
      TV.sel={ id:f.id, from:'eq', slot:'familiar2' }; try{ prev.apply(this,arguments); } finally { if(TV.sel) TV.sel=s0; }
      const db=document.querySelector('#tv-detail .db'); if(db) db.innerHTML='<button class="tv-btn" data-act="unequip2"'+(Meta.bagFull&&Meta.bagFull()?' disabled':'')+'>🦉 Take off 2nd</button>';
      const dm=document.querySelector('#tv-detail .dh .dm'); if(dm) dm.innerHTML=dm.innerHTML.replace('· WORN','· 2ND FAMILIAR'); return; }
    prev.apply(this,arguments); const s=TV.sel; if(!s||s.from!=='bag'||!ringOn()) return; const it=Meta.bag().find(b=>b.id===s.id); if(!it||it.slot!=='familiar') return;
    const row=document.querySelector('#tv-detail [data-act="equip"]'); if(row&&!document.querySelector('#tv-detail [data-act="equip2"]')) row.insertAdjacentHTML('afterend','<button class="tv-btn hot" data-act="equip2" data-id="'+it.id+'">🦉 Equip as 2nd</button>'); }; }
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-act="equip2"],[data-act="unequip2"]'); if(!t||!t.closest('#tavern')) return; e.stopPropagation();
  if(t.dataset.act==='equip2'){ const it=Meta.bag().find(b=>b.id===t.dataset.id); if(equip2(t.dataset.id)){ tvSay('2nd familiar: '+(it?it.name:'')); TV.sel=null; } }
  else if(unequip2()){ tvSay('2nd familiar taken off'); TV.sel=null; }
  if(typeof tvRenderTab==='function') tvRenderTab(true); },true);
// ---- the drops: 10% each per wave held, from the first; Matt's sound
let snd=null; function ringSound(){ if(typeof soundOff!=='undefined'&&soundOff) return; try{ if(!snd) snd=new Audio(ASSET('named-ring-two.mp3')); snd.currentTime=0; snd.volume=.9; const p=snd.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} }
function owned(id){ const is=it=>it&&it.named===id; if(SLOTS.some(s=>is(gear[s]))) return true; if(Meta.bag().some(is)) return true; if(Meta.armory&&Meta.armory().some(is)) return true;
  try{ if(Meta.heroGear&&Meta.heroGear.allWorn&&Meta.heroGear.allWorn().some(is)) return true; }catch(e){} return false; }
function dropRing(id){ const M=window.__mythic; if(!M||!M.normalize) return null; const it=M.normalize({ tier:'named', named:id, lvl:Math.max(1,typeof effWave==='function'?effWave():1) }); if(!it) return null;
  const a=Math.random()*TAU, x=hero.x+Math.cos(a)*3, z=hero.z+Math.sin(a)*3; const f=SFX.fancy; SFX.fancy=()=>{}; let l=null; try{ l=dropLoot(it,x,z,true); }finally{ SFX.fancy=f; } ringSound();
  floatText(x,(hero.y||0)+2.6,z,'💍 '+it.name.toUpperCase()+' 💍','#ff9ae0'); cnt.drops++; return it; }
{ const prev=Meta.onWaveHeld; Meta.onWaveHeld=function(){ const r=prev.apply(this,arguments); if(!TUTORIAL){ for(const id of RINGS){ if(!owned(id)&&LR()<DROP) dropRing(id); } } return r; }; }
window.__tworings={ RINGS, ringOn, equip2, unequip2, dropRing, owned, info:()=>Object.assign({ fam2:!!fam2, second:gear.familiar2?gear.familiar2.name:null },cnt), fam2:()=>fam2, fam1:()=>fam, sound:ringSound };
})();
