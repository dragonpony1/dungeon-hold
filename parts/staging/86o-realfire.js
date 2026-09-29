// ===== THE FIRE SET'S STAFF AND POLEARM ARE MATT'S OWN MODELS (build 271). Matt sent "Fire Staff" and "Fire Halberd" (Weapon sets / GEAR SETS / Fire set) with their framed inventory icons; the code-built staff-fire and
// polearm-fire (86-setweapons.js) give way to them, the way 86l, 86m and 86n did for the Void, Chaos and Earth pairs: registerReal (80-weapons.js) loads these files instead of the set's own factory, through the
// same async GLB path (same outline, mount, scale math and floor-stand glow). Same frames as the code-built ones: the STAFF 36% of the way up and body-length (the Witch and the Fighter), the POLEARM 30% up and body-length (the Knight).
// The staff's magic (its bolt colour, the charge glow) stays the set's (82-staff.js). A Fire WEAPON dropping warms both files for the floor stand (never at start).
(function(){
window.__weapons.registerReal('staff-fire','staff-fire.glb',{gripF:.36,lenScale:1.64});
window.__weapons.registerReal('polearm-fire','polearm-fire.glb',{gripF:.3,lenScale:1.64});
let warmed=false; function warm(){ if(warmed) return; warmed=true; window.__weapons.model('staff-fire',()=>{}); window.__weapons.model('polearm-fire',()=>{}); }
{ const prev=dropLoot; dropLoot=function(it){ try{ if(it&&it.slot==='weapon'&&window.__weapons.setModel&&window.__weapons.setModel(it,'staff')==='staff-fire') warm(); }catch(e){} return prev.apply(this,arguments); }; }
window.__realfire={warm,warmed:()=>warmed};
})();
