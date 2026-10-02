// ===== THE WIND SET'S STAFF AND POLEARM ARE MATT'S OWN MODELS (build 295). Matt sent "wind-staff-2k-pbr" and "wind-spear-2k-pbr" (Weapon sets / GEAR SETS / Windair) with their framed inventory icons; the code-built
// staff-wind and polearm-wind (86g-wind.js) give way to them, the way 86l-86r did for the Void, Chaos, Earth, Fire, Radiance, Tempest, Forest and Ice pairs: registerReal (80-weapons.js) loads these files instead of the set's own
// factory, through the same async GLB path (same outline, mount, scale math and floor-stand glow). Same frames as the code-built ones: the STAFF 36% of the way up and body-length (the Witch and the Fighter), the POLEARM
// 30% up and body-length (the Knight). The staff's magic (its bolt colour, the charge glow) stays the set's (82-staff.js). A Wind WEAPON dropping warms both files for the floor stand (never at start).
(function(){
window.__weapons.registerReal('staff-wind','staff-wind.glb',{gripF:.36,lenScale:1.64});
window.__weapons.registerReal('sword-wind','sword-wind.glb');   // build 494: Matt's Wind sword (GEAR SETS / Windair / animated), turned blade-up (tools/glb-flip.mjs) -- the last set sword
window.__weapons.registerReal('polearm-wind','polearm-wind.glb',{gripF:.3,lenScale:1.64});
let warmed=false; function warm(){ if(warmed) return; warmed=true; window.__weapons.model('staff-wind',()=>{}); window.__weapons.model('polearm-wind',()=>{}); }
{ const prev=dropLoot; dropLoot=function(it){ try{ if(it&&it.slot==='weapon'&&window.__weapons.setModel&&window.__weapons.setModel(it,'staff')==='staff-wind') warm(); }catch(e){} return prev.apply(this,arguments); }; }
window.__realwind={warm,warmed:()=>warmed};
})();
