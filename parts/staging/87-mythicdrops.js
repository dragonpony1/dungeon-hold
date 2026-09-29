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
//  • each wave held has NAMED_DROP to drop one of the named mythics (eleven since build 170; 97-mythics.js's table, favouring one you don't
//    have) by the crystal with the wave's reward. In co-op every player rolls their own 5% (build 159, 3/7, which corrected
//    "host-side only" here): it isn't a rollItem roll, so the lootDrop relay doesn't carry it, but 99-network.js's waveHeld
//    relay runs this same Meta.onWaveHeld on a guest's page -- now at the hall's wave (atHallWave), so a guest's named mythic
//    comes out at the host's level, not level 1. Each player's own drop, on their own floor.
// A mythic scrapped on the way to the hideout counts as legendary scrap (59-hideout.js clamps rarity to 4), so it still
// feeds the sludge cycle. Rates are two numbers here — tune freely; __mythicDrops.rates() / .set() for tests.
(function(){
let MYTHIC_DROP=.025, NAMED_DROP=.05, NAMED_MOB=.00015;   // NAMED_MOB (build 238, Matt: "allow it at .015% on a regular mob in a regular wave"): any ordinary mob kill during a wave -- one in ~6,700 -- may drop a NAMED mythic where it fell; bosses never do
const SETS=[['void','of the Void'],['crimson','of Chaos'],['rock','of the Earth'],['lava','of Fire'],['angelic','of Radiance'],['storm','of the Storm'],['shadow','of Shadow'],['ice','of Ice'],['wind','of the Wind']];
const gateOk=id=>{ const g=window.__setGate; return !g||g.mythic(id); };   // 97b-setgate.js: which sets may drop in this room and wave (asked at call time; none gated until it loads)
const BASE={armor:'Armor',amulet:'Amulet',charm:'Trinket',familiar:'Familiar'};
const GOLDC='#ffcf3a';
// build 241 (Matt: the higher-end pieces are rare on purpose and "when one drops a sound comes with it, it's an attention grabber, so you want to stop and go look"): a mythic or a named mythic
// landing gets a rising four-note fanfare, LOUDER than an ordinary drop chime, and a tall beam of light over it for eight seconds (set-pack pieces already have their own chime and column, 93-gearsets.js)
let FANCY=0; const fancySynth=named=>{ const g=named?1.25:1; beep(523,.55,'triangle',.2*g,0); setTimeout(()=>beep(659,.55,'triangle',.2*g,0),120); setTimeout(()=>beep(784,.65,'triangle',.22*g,0),240); setTimeout(()=>beep(1047,1.4,'sine',.26*g,0),380); setTimeout(()=>beep(1568,1.1,'sine',.09*g,0),400); if(named){ setTimeout(()=>beep(262,1.6,'sine',.2,0),380); } noise(.18,.05,5200); };
SFX.fancy=named=>{ FANCY++; if(SFX.fancySample&&SFX.fancySample(!!named)) return; fancySynth(named); };
const BEAMS=[], BEAM_GEO=new THREE.CylinderGeometry(.16,.36,9,14,1,true);
function dropBeam(x,z,col){ const m=new THREE.Mesh(BEAM_GEO,new THREE.MeshBasicMaterial({color:C(col),transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false})); m.position.set(x,4.5,z); m.userData.noOL=true; scene.add(m); BEAMS.push({m,t:0}); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); for(let i=BEAMS.length-1;i>=0;i--){ const b=BEAMS[i]; b.t+=dt; b.m.material.opacity=Math.max(0,.5*(1-b.t/8)); b.m.rotation.y+=dt*1.2; if(b.t>=8){ scene.remove(b.m); b.m.material.dispose(); BEAMS.splice(i,1); } } }; }
// a mythic's card picture: Matt's art, which ships inside the game with the embedded hideout (dist/hideout/…). it.art is
// the game's own per-item picture override (93-gearsets.js itemArt → the bag, the shop, the sheet); the weapon's kind
// rides in it.look (sword/staff/polearm/bow). No bow pictures yet, no familiar ones: those keep the slot's emoji.
const PICS='hideout/assets/hideout/items/', NAMED_PIC={hourglass_of_hollow_sand:'hourglass_hollow_sand'};   // null: no picture yet (build 170's Subterfuge) -- its card keeps the weapon emoji, its floor shows the bow
function mythicArt(it){ if(!it) return null; if(it.named){ const f=NAMED_PIC[it.named]; return f===null?null:PICS+'named/'+(f||it.named)+'.jpg'; } if(!it.setId) return null;
  const piece=it.slot==='weapon'?(it.look==='bow'?null:(it.look||'sword')):{armor:'armor',amulet:'amulet',charm:'trinket'}[it.slot];
  return piece?PICS+'sets/'+it.setId+'-'+piece+'.jpg':null; }
function eligible(it){ return !!(it&&typeof it==='object'&&SLOTS.includes(it.slot)&&!it.mythic&&!it.named&&(it.rarity|0)<5&&it.stats&&!(Meta.packs&&Meta.packs.of(it))&&SETS.some(s=>gateOk(s[0]))); }
function weaponKind(){ const hm=window.__weapons&&window.__weapons.mount&&window.__weapons.mount(); if(hm&&hm.staff) return 'staff'; if(hm&&hm.bow) return 'bow'; return LR()<.3?'polearm':'sword'; }
function mythicize(it){ const pool=SETS.filter(s=>gateOk(s[0])); if(!pool.length) return it; const [id,tail]=pool[Math.floor(LR()*pool.length)]; const L=Math.max(1,it.lvl|0); let kind=null;
  if(it.slot==='weapon'){ kind=weaponKind(); it.look=kind; }
  it.name='Mythic '+(kind?kind[0].toUpperCase()+kind.slice(1):(BASE[it.slot]||'Relic'))+' '+tail;
  it.setId=id; it.rarity=5; it.mythic=true; it.mythicTier='mythic'; const pic=mythicArt(it); if(pic) it.art=pic;
  for(const k in it.stats){ const v=rollStat(k,L,5); it.stats[k]=Number.isFinite(v)?v:Math.round((+it.stats[k]||0)*1.6*10)/10; }   // rarity 5 on its own level
  let sc=0; for(const k in it.stats) sc+=(it.stats[k]||0)*(STATW[k]||1); it.score=Math.round(sc*10)/10; it.value=Math.max(+it.value||0,250);
  return it; }
function namedItem(){ const M=window.__mythic; if(!M||!M.NAMED) return null; const ids=Object.keys(M.NAMED).filter(k=>!M.NAMED[k].reward);   // reward pets (Gladehart) are earned, not rolled
  const owned=k=>M.has(k)||Meta.bag().some(b=>b&&M.id(b)===k); const fresh=ids.filter(k=>!owned(k)); const pool=fresh.length?fresh:ids;
  const it=M.normalize({tier:'named',named:pool[Math.floor(LR()*pool.length)],lvl:Math.max(1,effWave())}); if(it){ it.from='dungeon-hold'; const pic=mythicArt(it); if(pic) it.art=pic; } return it; }
// a mythic lying on the floor shows its card picture over the loot shape (93-gearsets.js does this for its sets' pieces —
// the Void set's included, so a Void mythic is left to it); if the file can't load, the shape comes back
function cardOnFloor(l,it){ const item=l.mesh.userData.item; const tex=new THREE.TextureLoader().load(it.art,undefined,undefined,()=>{ if(item) item.visible=true; }); tex.encoding=THREE.sRGBEncoding;
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true})); spr.scale.set(.7,.7,1); spr.position.y=.6; spr.userData.noOL=true; l.mesh.add(spr); l.mesh.userData.artSprite=spr; if(item) item.visible=false; }
// a drop: maybe mythic
{ const prev=dropLoot; dropLoot=function(it,x,z,gentle){ const turned=eligible(it)&&LR()<MYTHIC_DROP; if(turned) mythicize(it); const l=prev(it,x,z,gentle);
    if(l&&l.mesh&&it&&(it.mythic||it.named)&&it.art&&!(Meta.packs&&Meta.packs.of(it))) cardOnFloor(l,it);
    if(turned||(it&&it.__announce)){ if(it) delete it.__announce; floatText(x,1.9,z,'✦ MYTHIC ✦ '+it.name,GOLDC); SFX.fancy(false); dropBeam(x,z,0xffcf3a); } else if(it&&it.named){ SFX.fancy(true); dropBeam(x,z,0xff7ade); } return l; }; }
// a wave held: maybe a named mythic by the crystal
{ const prev=Meta.onWaveHeld; Meta.onWaveHeld=function(w){ const r=prev.apply(this,arguments);
    if(LR()<NAMED_DROP){ const it=namedItem(); if(it){ dropLoot(it,R(-1.6,1.6),4.6,true); floatText(0,2.6,4.6,'✦ A NAMED MYTHIC ✦ '+it.name,GOLDC); if(typeof toast==='function') toast('A named mythic fell by the Heartroot: '+it.name); } }
    return r; }; }
// a regular mob killed in a regular wave: a very small chance of a named mythic where it fell (host or solo: the kill is real there; a co-op guest's floor gets it only from the wave reward roll)
const MOB_BOSS=new Set(['trollboss','cyclops','pigflail','pigdagger','pigsling']);
{ const prev=rollDrop; rollDrop=function(e){ prev(e); if(TUTORIAL||S.phase!=='wave'||!e||e.puppet||MOB_BOSS.has(e.kind)) return;
    if(LR()<NAMED_MOB){ const it=namedItem(); if(it){ dropLoot(it,e.x,e.z); floatText(e.x,2.4,e.z,'✦ A NAMED MYTHIC ✦ '+it.name,GOLDC); if(typeof toast==='function') toast('A named mythic dropped from a '+(e.kind||'mob')+': '+it.name); } } }; }
window.__mythicDrops={fancy:()=>FANCY,beams:()=>BEAMS.length,rates:()=>({mythic:MYTHIC_DROP,named:NAMED_DROP,mob:NAMED_MOB}),set:(m,n,k)=>{ if(Number.isFinite(m)) MYTHIC_DROP=m; if(Number.isFinite(n)) NAMED_DROP=n; if(Number.isFinite(k)) NAMED_MOB=k; },mythicize,namedItem,eligible,art:mythicArt,SETS};
})();
