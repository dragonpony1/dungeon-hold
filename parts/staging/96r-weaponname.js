// ===== A WEAPON'S NAME FOLLOWS THE HAND THAT HOLDS IT (build 516). Matt: "right now my ranger is dual wielding bows. oneis the mythic bow of chaos but he other is named mythic polearm of the void.
// is this related to a rule i made?" -- yes: a weapon becomes whatever the hand holding it uses (build 314, 80-weapons.js), but its NAME kept the word from the hero it dropped for. "it might help be
// less confusing": a weapon whose name carries one of the four type words (Sword / Staff / Polearm / Bow -- the mythic set pieces, "Mythic Polearm of the Void") now says the current hero's:
// the Ranger's Bow, the Witch's Staff, the Fighter's Polearm, the Knight's Sword -- or Polearm for a polearm piece (its look). Its look is filled in once from the old word before the first rename,
// so a Knight's polearm stays a polearm. Everything the player owns (worn, 2nd weapon, bag, armory) and everything on the floor, checked twice a second. Test hook: window.__weaponName.
(function(){
const WORD={sword:'Sword',staff:'Staff',polearm:'Polearm',bow:'Bow'}, RX=/\b(Sword|Staff|Polearm|Bow)\b/;
function kindFor(it){ const h=window.__heroes?window.__heroes.pick():'knight'; if(h==='troll') return 'bow'; if(h==='witch') return 'staff'; if(h==='fighter') return 'polearm'; return it.look==='polearm'?'polearm':'sword'; }
function fix(it){ if(!it||it.slot!=='weapon'||typeof it.name!=='string') return false; const m=it.name.match(RX); if(!m) return false;
  if(!it.look) it.look=m[1].toLowerCase();   // remember what it was, once
  const w=WORD[kindFor(it)]; if(m[1]===w) return false; it.name=it.name.replace(RX,w); return true; }
function all(){ const out=[]; for(const s of SLOTS) if(gear[s]) out.push(gear[s]); if(gear.weapon2) out.push(gear.weapon2); out.push(...Meta.bag()); if(Meta.armory) out.push(...Meta.armory()); for(const l of loot) if(l&&l.it) out.push(l.it); return out; }
let t=0, n=0; function pass(){ let ch=0; for(const it of all()){ try{ if(fix(it)) ch++; }catch(e){} } if(ch){ n+=ch; try{ saveGear(); }catch(e){} try{ Meta.save&&Meta.save(); }catch(e){} } return ch; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); t+=dt; if(t<.5) return; t=0; pass(); }; }
{ const prev=dropLoot; dropLoot=function(it){ try{ fix(it); }catch(e){} return prev.apply(this,arguments); }; }   // a drop says the right word from the start
window.__weaponName={ pass, fix, kindFor, renamed:()=>n };
})();
