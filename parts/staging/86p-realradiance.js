// ===== THE RADIANCE (HOLY) SET'S STAFF AND POLEARM ARE MATT'S OWN MODELS (build 274). Matt sent "Holy Staff" and "Holy Spear" (Weapon sets / GEAR SETS / Holy) with their framed inventory icons; the code-built staff-radiance and
// polearm-radiance (86d-radiance.js) give way to them, the way 86l-86o did for the Void, Chaos, Earth and Fire pairs: registerReal (80-weapons.js) loads these files instead of the set's own factory, through the
// same async GLB path (same outline, mount, scale math and floor-stand glow). Same frames as the code-built ones: the STAFF 36% of the way up and body-length (the Witch and the Fighter), the POLEARM 30% up and body-length (the Knight).
// The staff's magic (its bolt colour, the charge glow) stays the set's (82-staff.js). A Radiance WEAPON dropping warms both files for the floor stand (never at start).
(function(){
window.__weapons.registerReal('staff-radiance','staff-radiance.glb',{gripF:.36,lenScale:1.64});
window.__weapons.registerReal('polearm-radiance','polearm-radiance.glb',{gripF:.3,lenScale:1.64});
window.__weapons.registerReal('sword-radiance','sword-radiance.glb');   // build 489: Matt's Radiance sword (GEAR SETS / Holy / animated), turned blade-up (tools/glb-flip.mjs)
let warmed=false; function warm(){ if(warmed) return; warmed=true; window.__weapons.model('staff-radiance',()=>{}); window.__weapons.model('polearm-radiance',()=>{}); }
{ const prev=dropLoot; dropLoot=function(it){ try{ if(it&&it.slot==='weapon'&&window.__weapons.setModel&&window.__weapons.setModel(it,'staff')==='staff-radiance') warm(); }catch(e){} return prev.apply(this,arguments); }; }
window.__realradiance={warm,warmed:()=>warmed};
})();
