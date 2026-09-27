// ===== MYTHIC DROPS (build 157). Matt, 2026-09-27: "mythic gear or gear sets like this lets drop at like 7% for now" and
// "named gear can drop in a wave but its like 5% (it can proc in the forge at like 6%)". Until now mythic gear came only
// from the hideout's forge. Now:
//  • every loot drop in the hall that isn't already a set piece or a mythic — a kill's roll, the wave's reward, and in
//    co-op each player's own re-roll (99-network.js re-rolls a drop on every page, so each rolls their own 7%) — has
//    MYTHIC_DROP to come out a MYTHIC SET PIECE: rarity 5, one of the hideout forge's nine sets (Nature/Forest skipped),
//    named like the forge's ("Mythic Staff of Chaos"; the Void one joins your Void set bonus), carrying Matt's set picture
//    on its card and over it on the floor (mythicArt, cardOnFloor), a weapon in the kind YOUR
//    hero holds (the Knight a sword or now and then a polearm, the Witch and Fighter a staff, the Troll a bow — so it shows
//    as that set's weapon, 86-setweapons.js), its stats re-rolled at rarity 5 on the item's own level (rollStat).
//  • each wave held has NAMED_DROP to drop one of the ten named mythics (97-mythics.js's table, favouring one you don't
//    have) by the crystal with the wave's reward. In co-op every player rolls their own 5% (build 159, 3/7, which corrected
//    "host-side only" here): it isn't a rollItem roll, so the lootDrop relay doesn't carry it, but 99-network.js's waveHeld
//    relay runs this same Meta.onWaveHeld on a guest's page -- now at the hall's wave (atHallWave), so a guest's named mythic
//    comes out at the host's level, not level 1. Each player's own drop, on their own floor.
// A mythic scrapped on the way to the hideout counts as legendary scrap (59-hideout.js clamps rarity to 4), so it still
// feeds the sludge cycle. Rates are two numbers here — tune freely; __mythicDrops.rates() / .set() for tests.
(function(){
let MYTHIC_DROP=.07, NAMED_DROP=.05;
const SETS=[['void','of the Void'],['crimson','of Chaos'],['rock','of the Earth'],['lava','of Fire'],['angelic','of Radiance'],['storm','of the Storm'],['shadow','of Shadow'],['ice','of Ice'],['wind','of the Wind']];
const BASE={armor:'Armor',amulet:'Amulet',charm:'Trinket',familiar:'Familiar'};
const GOLDC='#ffcf3a';
// a mythic's card picture: Matt's art, which ships inside the game with the embedded hideout (dist/hideout/…). it.art is
// the game's own per-item picture override (93-gearsets.js itemArt → the bag, the shop, the sheet); the weapon's kind
// rides in it.look (sword/staff/polearm/bow). No bow pictures yet, no familiar ones: those keep the slot's emoji.
const PICS='hideout/assets/hideout/items/', NAMED_PIC={hourglass_of_hollow_sand:'hourglass_hollow_sand'};
function mythicArt(it){ if(!it) return null; if(it.named) return PICS+'named/'+(NAMED_PIC[it.named]||it.named)+'.jpg'; if(!it.setId) return null;
  const piece=it.slot==='weapon'?(it.look==='bow'?null:(it.look||'sword')):{armor:'armor',amulet:'amulet',charm:'trinket'}[it.slot];
  return piece?PICS+'sets/'+it.setId+'-'+piece+'.jpg':null; }
function eligible(it){ return !!(it&&typeof it==='object'&&SLOTS.includes(it.slot)&&!it.mythic&&!it.named&&(it.rarity|0)<5&&it.stats&&!(Meta.packs&&Meta.packs.of(it))); }
function weaponKind(){ const hm=window.__weapons&&window.__weapons.mount&&window.__weapons.mount(); if(hm&&hm.staff) return 'staff'; if(hm&&hm.bow) return 'bow'; return LR()<.3?'polearm':'sword'; }
function mythicize(it){ const [id,tail]=SETS[Math.floor(LR()*SETS.length)]; const L=Math.max(1,it.lvl|0); let kind=null;
  if(it.slot==='weapon'){ kind=weaponKind(); it.look=kind; }
  it.name='Mythic '+(kind?kind[0].toUpperCase()+kind.slice(1):(BASE[it.slot]||'Relic'))+' '+tail;
  it.setId=id; it.rarity=5; it.mythic=true; it.mythicTier='mythic'; const pic=mythicArt(it); if(pic) it.art=pic;
  for(const k in it.stats){ const v=rollStat(k,L,5); it.stats[k]=Number.isFinite(v)?v:Math.round((+it.stats[k]||0)*1.6*10)/10; }   // rarity 5 on its own level
  let sc=0; for(const k in it.stats) sc+=(it.stats[k]||0)*(STATW[k]||1); it.score=Math.round(sc*10)/10; it.value=Math.max(+it.value||0,250);
  return it; }
function namedItem(){ const M=window.__mythic; if(!M||!M.NAMED) return null; const ids=Object.keys(M.NAMED);
  const owned=k=>M.has(k)||Meta.bag().some(b=>b&&M.id(b)===k); const fresh=ids.filter(k=>!owned(k)); const pool=fresh.length?fresh:ids;
  const it=M.normalize({tier:'named',named:pool[Math.floor(LR()*pool.length)],lvl:Math.max(1,effWave())}); if(it){ it.from='dungeon-hold'; const pic=mythicArt(it); if(pic) it.art=pic; } return it; }
// a mythic lying on the floor shows its card picture over the loot shape (93-gearsets.js does this for its sets' pieces —
// the Void set's included, so a Void mythic is left to it); if the file can't load, the shape comes back
function cardOnFloor(l,it){ const item=l.mesh.userData.item; const tex=new THREE.TextureLoader().load(it.art,undefined,undefined,()=>{ if(item) item.visible=true; }); tex.encoding=THREE.sRGBEncoding;
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true})); spr.scale.set(.7,.7,1); spr.position.y=.6; spr.userData.noOL=true; l.mesh.add(spr); l.mesh.userData.artSprite=spr; if(item) item.visible=false; }
// a drop: maybe mythic
{ const prev=dropLoot; dropLoot=function(it,x,z,gentle){ const turned=eligible(it)&&LR()<MYTHIC_DROP; if(turned) mythicize(it); const l=prev(it,x,z,gentle);
    if(l&&l.mesh&&it&&(it.mythic||it.named)&&it.art&&!(Meta.packs&&Meta.packs.of(it))) cardOnFloor(l,it);
    if(turned){ floatText(x,1.9,z,'✦ MYTHIC ✦ '+it.name,GOLDC); if(SFX.setBong) SFX.setBong(); } return l; }; }
// a wave held: maybe a named mythic by the crystal
{ const prev=Meta.onWaveHeld; Meta.onWaveHeld=function(w){ const r=prev.apply(this,arguments);
    if(LR()<NAMED_DROP){ const it=namedItem(); if(it){ dropLoot(it,R(-1.6,1.6),4.6,true); floatText(0,2.6,4.6,'✦ A NAMED MYTHIC ✦ '+it.name,GOLDC); if(SFX.setBong) SFX.setBong(); if(typeof toast==='function') toast('A named mythic fell by the crystal: '+it.name); } }
    return r; }; }
window.__mythicDrops={rates:()=>({mythic:MYTHIC_DROP,named:NAMED_DROP}),set:(m,n)=>{ if(Number.isFinite(m)) MYTHIC_DROP=m; if(Number.isFinite(n)) NAMED_DROP=n; },mythicize,namedItem,eligible,art:mythicArt,SETS};
})();
