// ===== THE CHAOS SET'S STAFF AND POLEARM ARE MATT'S OWN MODELS (build 268). Matt sent "Blood Eye Staff" and "Blood Scythe" (Weapon sets / GEAR SETS / chaos) with their framed inventory icons; the code-built staff-chaos and
// polearm-chaos (86-setweapons.js) give way to them, the same way 86l-realvoid.js did for the Void pair: registerReal (80-weapons.js) loads these files instead of calling the set's own factory, through the same async GLB path
// (same outline, mount, scale math and floor-stand glow). Same frames as the code-built ones: the STAFF held 36% of the way up and body-length (the Witch and the Fighter), the POLEARM 30% up and body-length (the Knight).
// The staff's magic (its bolt colour, the charge glow) stays the set's (82-staff.js), only what it looks like changes. A Chaos WEAPON dropping warms both files for the floor stand (never at start).
(function(){
window.__weapons.registerReal('staff-chaos','staff-chaos.glb',{gripF:.36,lenScale:1.64});
window.__weapons.registerReal('polearm-chaos','polearm-chaos.glb',{gripF:.3,lenScale:1.64});
window.__weapons.registerReal('sword-chaos','sword-chaos.glb');   // build 482: Matt's Chaos sword (GEAR SETS / chaos, made 3D from his sword concept) takes over the code-built one; turned blade-up when it was cut down
let warmed=false; function warm(){ if(warmed) return; warmed=true; window.__weapons.model('staff-chaos',()=>{}); window.__weapons.model('polearm-chaos',()=>{}); window.__weapons.model('sword-chaos',()=>{}); }
{ const prev=dropLoot; dropLoot=function(it){ try{ if(it&&it.slot==='weapon'&&window.__weapons.setModel&&window.__weapons.setModel(it,'staff')==='staff-chaos') warm(); }catch(e){} return prev.apply(this,arguments); }; }
window.__realchaos={warm,warmed:()=>warmed};
})();
