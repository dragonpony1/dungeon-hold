// ===== EACH HERO WEARS THEIR OWN GEAR (build 171). Matt: "each hero should have its own unique gear… when I switch heroes,
// his weapon will show" and the rule "If it's equipped it belongs to that hero otherwise the bag is shared." Until now one
// worn set (game.js `gear`, saved as ddGear) rode along on every hero and only the weapon's model kind changed with the rig.
// Now every hero in HEROES (70-hero2.js) keeps five slots of their own. `gear` stays THE live set -- the current hero's --
// so everything that reads it (heroStat, sets, the familiar, the weapon in hand, the sheet, co-op's guest stats) is
// untouched; a switch (installHero, the one door every picker goes through: the raven, H, the title cards, the lobby's
// NEXT, the tutorial's forced Knight) files the old hero's pieces under that hero and lays the new hero's own into `gear`.
// Everything not worn lives in the ONE shared bag and the shared armory. A piece is worn by at most one hero: equipping
// on this hero a piece another hero wears (a loadout saved when it was here, 68-paperdoll.js) takes it off them, and says so.
//
// THE SAVE: localStorage dd_heroGear = {v:1, on:<hero whose set ddGear mirrors>, sig:<hash of the ddGear we wrote>,
// heroes:{knight:{weapon:item|null,...}, witch:{...}, ...}}. ddGear is still written on every save as the current hero's
// set, so an older build (or a test that sets ddGear and reloads) keeps working: if ddGear at boot is not the one this
// build wrote (sig differs), whoever wrote it meant it for the hero it mirrored, and it is adopted for that hero. The
// wipe (95-campaign.js, every dd* key) clears both. Migration: no dd_heroGear yet = the worn set belongs to the hero
// picked now, the others start empty. The old four loadout cards (dd_loadouts) go to that same hero (dd_heroLoadouts).
(function(){
const HG_KEY='dd_heroGear', LDH_KEY='dd_heroLoadouts', LD_OLD='dd_loadouts';
const hash=s=>{ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; };
const empty=()=>{ const o={}; for(const s of SLOTS) o[s]=null; return o; };
const parse=s=>{ try{ return JSON.parse(s); }catch(e){ return null; } };
const read=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } };
// a saved set, sanitised the way loadGear + fixGear always did (validItem: a real item of a real slot) -- except that a
// worn Mythic (rarity 5) now survives the reload: game.js loadGear's old `rarity<=4` quietly dropped it from ddGear
function clean(set){ const o=empty(); if(set&&typeof set==='object') for(const s of SLOTS){ const it=set[s]; if(validItem(it)) o[s]=fixItem(it); } return o; }
const shortName=id=>{ const h=HEROES.find(h=>h.id===id); return h?h.name.replace(/^GNOME (BATTLE )?/,'').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()):id; };   // "Knight", "Witch", "Troll Archer", "Fighter"
const HG={}; let sig=0, on=heroPick.id;   // HG[id] for every hero but the current one is the truth; the current hero's truth is `gear` (HG[cur] is refreshed from it on every save)
function snap(){ const o={}; for(const s of SLOTS) o[s]=gear[s]||null; return o; }
function persist(){ HG[heroPick.id]=snap(); on=heroPick.id; try{ localStorage.setItem(HG_KEY,JSON.stringify({v:1,on,sig,heroes:HG})); }catch(e){} }
// every save of the worn set (equip, unequip, a pickup, the forge, the tutorial, a reset) now also files it under the hero
{ const prev=saveGear; saveGear=function(){ prev(); const s=read('ddGear'); sig=s==null?0:hash(s); persist(); }; }
// ---- boot ----
{ const cur=heroPick.id, saved=parse(read(HG_KEY)), raw=read('ddGear');
  for(const h of HEROES) HG[h.id]=empty();
  if(saved&&saved.heroes&&typeof saved.heroes==='object'){ for(const h of HEROES) HG[h.id]=clean(saved.heroes[h.id]);
    if(raw!=null&&hash(raw)!==saved.sig){ const who=HEROES.some(h=>h.id===saved.on)?saved.on:cur; HG[who]=clean(parse(raw)); } }   // ddGear was written by something else since (an older build, a test): it meant that hero's set
  else HG[cur]=clean(parse(raw));   // MIGRATION: the one shared set is the current pick's
  // exactly once: a piece already in the bag, the armory (its store loads later, 96-armory.js -- read it raw) or on an
  // earlier hero is not also on this one. The current hero keeps theirs; nothing here can create a piece, only drop a copy
  const seen=new Set(); const see=it=>{ if(it&&it.id) seen.add(it.id); };
  for(const s of SLOTS) see(HG[cur][s]); Meta.bag().forEach(see); { const a=parse(read('ddArmory')); if(Array.isArray(a)) a.forEach(see); }
  for(const h of HEROES){ if(h.id===cur) continue; for(const s of SLOTS){ const it=HG[h.id][s]; if(!it) continue; if(seen.has(it.id)) HG[h.id][s]=null; else seen.add(it.id); } }
  for(const s of SLOTS){ const it=HG[cur][s]; gear[s]=it&&gear[s]&&gear[s].id===it.id?gear[s]:it; }   // the same object where it is the same piece (modules before this one already looked at it)
  saveGear(); applyGear(); hero.hp=hero.max;
  // the loadout cards: the old four (one shared list) become the current hero's four (68-paperdoll.js reads dd_heroLoadouts)
  if(read(LDH_KEY)==null){ const a=parse(read(LD_OLD)); if(Array.isArray(a)) try{ localStorage.setItem(LDH_KEY,JSON.stringify({[cur]:a})); }catch(e){} } }
// ---- the switch: installHero (70-hero2.js) is every picker's way in, called by name, so wrapping it here covers them all
{ const prev=installHero; installHero=function(h){ const from=heroPick, go=!!(h&&from&&h.id!==from.id);
    if(go){ HG[from.id]=snap(); const next=HG[h.id]||empty(); for(const s of SLOTS){ const it=next[s]; gear[s]=validItem(it)?fixItem(it):null; } }   // fixItem by name: 96-armory's wrap recomputes the level ask on the way on
    const r=prev(h);   // sets heroPick = h, the reach, fetches the rig; the weapon in hand follows `gear.weapon` on the next frame (80-weapons.js)
    if(go){ saveGear(); applyGear(); if(S.phase==='start') hero.hp=hero.max; if(Meta.save) Meta.save(); }   // Meta.save: bumps the version every open view re-renders on
    return r; }; }
// ---- where a piece is worn, by any hero (the current hero's from `gear`, the rest from their saved sets)
function setOf(id){ return id===heroPick.id?gear:(HG[id]||null); }
function whereWorn(itemId){ for(const h of HEROES){ const g=setOf(h.id); if(!g) continue; for(const s of SLOTS) if(g[s]&&g[s].id===itemId) return {hero:h.id,slot:s,it:g[s]}; } return null; }
function allWorn(){ const out=[]; for(const h of HEROES){ const g=setOf(h.id); if(g) for(const s of SLOTS) if(g[s]) out.push(g[s]); } return out; }
// ---- equipping a piece another hero wears moves it to this one (their slot empties) -- the only other way to reach it is
// their unequip (it lands in the shared bag) and this hero's equip from the bag, which Meta.equip already does
{ const prev=Meta.equip; Meta.equip=function(id){ if(Meta.bag().some(b=>b.id===id)) return prev(id); const w=whereWorn(id); if(!w||w.hero===heroPick.id) return prev(id);
    const it=w.it, old=gear[it.slot];
    if(it.named){ const n=SLOTS.filter(s=>gear[s]&&gear[s].named&&s!==it.slot).length; if(n>=2){ toast('Two named mythics at once is the limit'); return false; } }   // build 152's rule, as the bag route has it
    if(old&&Meta.bagFull()){ toast('Bag is full — no room for the '+old.name); return false; }
    HG[w.hero][w.slot]=null; gear[it.slot]=it; if(old) Meta.bag().push(old);
    applyGear(); saveGear(); if(Meta.save) Meta.save(); SFX.loot(it.rarity);
    toast(it.name+' moved from the '+shortName(w.hero)+' to the '+shortName(heroPick.id)); return true; }; }
// ---- a full reset (Meta.reset, the tests' resetGear) empties every hero, not only the one on screen
{ const prev=resetGear; resetGear=function(){ for(const h of HEROES) HG[h.id]=empty(); prev(); }; }
// ---- the exactly-once check: every piece in the bag, the armory and all heroes' worn slots, and any id found twice
function check(){ const where={}, dup=[]; const add=(it,loc)=>{ if(!it) return; if(!it.id){ dup.push({id:null,a:loc}); return; } if(where[it.id]) dup.push({id:it.id,a:where[it.id],b:loc}); else where[it.id]=loc; };
  Meta.bag().forEach(it=>add(it,'bag')); (Meta.armory?Meta.armory():[]).forEach(it=>add(it,'armory'));
  for(const h of HEROES){ const g=setOf(h.id); for(const s of SLOTS) add(g&&g[s],h.id+'.'+s); }
  const cur=HG[heroPick.id]||{}, stale=SLOTS.filter(s=>((cur[s]&&cur[s].id)||null)!==((gear[s]&&gear[s].id)||null));   // the saved copy of the current hero lags `gear` only between a direct write and its save
  return {ok:!dup.length,dup,pieces:Object.keys(where).length,where,stale}; }
Meta.allWorn=allWorn;
Meta.heroGear={save:()=>persist(), of:id=>{ const g=setOf(id); return g?Object.assign({},g):null; },whereWorn,allWorn,check,shortName,HG_KEY,LDH_KEY};
window.__heroGear=Meta.heroGear;
})();
