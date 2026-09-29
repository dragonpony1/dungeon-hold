// ===== THE EARTH SET'S STAFF AND POLEARM ARE MATT'S OWN MODELS (build 269). Matt sent "Nature Staff" and "Nature Spear" (Weapon sets / GEAR SETS / Earth set) with their framed inventory icons; the code-built staff-earth and
// polearm-earth (86c-earth.js) give way to them, the way 86l-realvoid.js and 86m-realchaos.js did for the Void and Chaos pairs: registerReal (80-weapons.js) loads these files instead of the set's own factory, through the
// same async GLB path (same outline, mount, scale math and floor-stand glow). Same frames as the code-built ones: the STAFF 36% of the way up and body-length (the Witch and the Fighter), the POLEARM 30% up and body-length (the Knight).
// The staff's magic (its bolt colour, the charge glow) stays the set's (82-staff.js). An Earth WEAPON dropping warms both files for the floor stand (never at start).
(function(){
window.__weapons.registerReal('staff-earth','staff-earth.glb',{gripF:.36,lenScale:1.64});
window.__weapons.registerReal('polearm-earth','polearm-earth.glb',{gripF:.3,lenScale:1.64});
let warmed=false; function warm(){ if(warmed) return; warmed=true; window.__weapons.model('staff-earth',()=>{}); window.__weapons.model('polearm-earth',()=>{}); }
{ const prev=dropLoot; dropLoot=function(it){ try{ if(it&&it.slot==='weapon'&&window.__weapons.setModel&&window.__weapons.setModel(it,'staff')==='staff-earth') warm(); }catch(e){} return prev.apply(this,arguments); }; }
window.__realearth={warm,warmed:()=>warmed};
})();
