// ===== REAL BOWS (build 185): Matt's own Meshy exports replace the nine forge sets' code-built bows. "The 3D drop run" --
// all 10 sets now have a real bow file (rootgate-todo.md); Forest/Nature isn't wired into the set-weapon system at all yet
// (no sword/staff/polearm registered for it either), so it's left out here until that's decided.
// Each export is a symmetric -1..1 GLB (grip at the model's own centre, y=0) at 2K (Storm is still the 4K test file --
// swap for a 2K remake when Matt sends one, same registerReal call, same name). registerReal (80-weapons.js) makes
// 'bow-<key>' load this file instead of calling the set's own K.deco-built makeBow, through the SAME async GLB path the
// five base swords already use -- so it gets the same outline, the same mount/scale math (80-weapons.js attachWeapon),
// and the same floor-stand glow (93c-weaponstand.js: modelFor asks window.__weapons for 'bow-<key>' by name, same as ever).
// gripF .5 + lenScale .72: every set's own bow K used len:1 (lenScale=.72*1), and Matt's bows are exported grip-at-centre,
// so the same two numbers that fit the procedural bows fit his real ones.
(function(){
const REAL={ice:'bow-ice.glb',fire:'bow-fire.glb',void:'bow-void.glb',earth:'bow-earth.glb',necrotic:'bow-necrotic.glb',
  radiance:'bow-radiance.glb',chaos:'bow-chaos.glb',tempest:'bow-tempest.glb',wind:'bow-wind.glb'};
for(const k in REAL) window.__weapons.registerReal('bow-'+k,REAL[k],{gripF:.5,lenScale:.72});
// a floor drop's stand (93c-weaponstand.js) reads window.__weapons.model() synchronously -- fine for a procedural bow (comes
// back at once) but not a real GLB's first-ever fetch, so an Ice-set item dropping before anyone has equipped an Ice bow
// would miss its stand once. Warm all nine the moment a Troll -- the only hero who ever draws a bow -- is actually in
// play (fresh start or a mid-game hero switch, 71-herogear.js), never for the other three heroes: ~120 MB nobody but a
// Troll's own page needs
let warmed=false;
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(warmed) return; const hm=window.__weapons.mount&&window.__weapons.mount(); if(hm&&hm.bow){ warmed=true; for(const k in REAL) window.__weapons.model('bow-'+k,()=>{}); } }; }
})();
