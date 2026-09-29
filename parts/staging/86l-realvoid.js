// ===== THE VOID SET'S STAFF AND POLEARM ARE MATT'S OWN MODELS (build 267). Matt sent "Arcane Staff 2K PBR.glb" and "Arcane Spear 2K PBR.glb" (Weapon sets / GEAR SETS / Arcane) with their framed inventory icons; the code-built staff-void and
// polearm-void (86b-void.js, shaped after his thumbnails) give way to them, the way 86j-realbows.js did for the nine bows: registerReal (80-weapons.js) makes 'staff-void' / 'polearm-void' load these files instead of calling the set's
// own factory, through the same async GLB path, so they get the same outline, mount and scale math and the same floor-stand glow. Both are tall models, butt at the bottom and the head at the top (1K textures, ~1.1 MB each).
// The frames are the ones the code-built ones used (86b-void.js): the STAFF is held 36% of the way up and body-length (the Witch and the Fighter), the POLEARM 30% of the way up and body-length (the Knight). Everything about
// the staff's magic (its bolt colour, the charge glow) stays the set's (82-staff.js), only what it looks like changes.
// A floor drop's stand reads window.__weapons.model() synchronously, and a real GLB's first-ever fetch is not: so the moment a Void WEAPON drops, both files are warmed (never at start: ~2 MB nobody without a Void weapon needs).
(function(){
window.__weapons.registerReal('staff-void','staff-void.glb',{gripF:.36,lenScale:1.64});
window.__weapons.registerReal('polearm-void','polearm-void.glb',{gripF:.3,lenScale:1.64});
let warmed=false; function warm(){ if(warmed) return; warmed=true; window.__weapons.model('staff-void',()=>{}); window.__weapons.model('polearm-void',()=>{}); }
{ const prev=dropLoot; dropLoot=function(it){ try{ if(it&&it.slot==='weapon'&&window.__void&&window.__void.isVoid&&window.__void.isVoid(it)) warm(); }catch(e){} return prev.apply(this,arguments); }; }
window.__realvoid={warm,warmed:()=>warmed};
})();
