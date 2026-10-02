// ===== THE TEMPEST (LIGHTNING) SET'S STAFF AND POLEARM ARE MATT'S OWN MODELS (build 281). Matt sent "Lightning Staff" and "Lightning Trident" (Weapon sets / GEAR SETS / Lightningstorm) with their framed inventory icons; the code-built staff-tempest and
// polearm-tempest (86e-tempest.js) give way to them, the way 86l-86p did for the Void, Chaos, Earth, Fire and Radiance pairs: registerReal (80-weapons.js) loads these files instead of the set's own factory, through the
// same async GLB path (same outline, mount, scale math and floor-stand glow). Same frames as the code-built ones: the STAFF 36% of the way up and body-length (the Witch and the Fighter), the POLEARM 30% up and body-length (the Knight).
// The staff's magic (its bolt colour, the charge glow) stays the set's (82-staff.js). A Tempest WEAPON dropping warms both files for the floor stand (never at start).
(function(){
window.__weapons.registerReal('staff-tempest','staff-tempest.glb',{gripF:.36,lenScale:1.64});
window.__weapons.registerReal('polearm-tempest','polearm-tempest.glb',{gripF:.3,lenScale:1.64});
window.__weapons.registerReal('sword-tempest','sword-tempest.glb');   // build 490: Matt's Storm sword (GEAR SETS / Lightningstorm / animated), turned blade-up (tools/glb-flip.mjs)
let warmed=false; function warm(){ if(warmed) return; warmed=true; window.__weapons.model('staff-tempest',()=>{}); window.__weapons.model('polearm-tempest',()=>{}); }
{ const prev=dropLoot; dropLoot=function(it){ try{ if(it&&it.slot==='weapon'&&window.__weapons.setModel&&window.__weapons.setModel(it,'staff')==='staff-tempest') warm(); }catch(e){} return prev.apply(this,arguments); }; }
window.__realtempest={warm,warmed:()=>warmed};
})();
