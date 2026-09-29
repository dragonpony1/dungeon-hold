// ===== THE SHADOW (NECROTIC) SET'S STAFF AND POLEARM ARE MATT'S OWN MODELS (build 297) -- the LAST code-built pair; every set now holds his models. Matt sent "necrotic_staff_2k_pbr" and "necrotic_scythe_2k_pb" (Weapon sets / GEAR SETS / Necrotic) with their framed inventory icons; the code-built
// staff-necrotic and polearm-necrotic (86-setweapons.js) give way to them, the way 86l-86r did for the Void, Chaos, Earth, Fire, Radiance, Tempest, Forest, Ice and Wind pairs: registerReal (80-weapons.js) loads these files instead of the set's own
// factory, through the same async GLB path (same outline, mount, scale math and floor-stand glow). Same frames as the code-built ones: the STAFF 36% of the way up and body-length (the Witch and the Fighter), the POLEARM
// 30% up and body-length (the Knight). The staff's magic (its bolt colour, the charge glow) stays the set's (82-staff.js). A Shadow WEAPON dropping warms both files for the floor stand (never at start).
(function(){
window.__weapons.registerReal('staff-necrotic','staff-necrotic.glb',{gripF:.36,lenScale:1.64});
window.__weapons.registerReal('polearm-necrotic','polearm-necrotic.glb',{gripF:.3,lenScale:1.64});
let warmed=false; function warm(){ if(warmed) return; warmed=true; window.__weapons.model('staff-necrotic',()=>{}); window.__weapons.model('polearm-necrotic',()=>{}); }
{ const prev=dropLoot; dropLoot=function(it){ try{ if(it&&it.slot==='weapon'&&window.__weapons.setModel&&window.__weapons.setModel(it,'staff')==='staff-necrotic') warm(); }catch(e){} return prev.apply(this,arguments); }; }
window.__realnecrotic={warm,warmed:()=>warmed};
})();
