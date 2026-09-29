// ===== THE FOREST SET'S STAFF AND POLEARM ARE MATT'S OWN MODELS (build 286). Matt sent "living wood staff" and "living wood spear" (Weapon sets / GEAR SETS / Nature -- the Forest set, his "Nature") with their
// framed inventory icons. Meshy's image-to-3D files were 470k and 360k triangles (41 MB and 35 MB); they are shrunk to 1K textures and simplified to ~7k and ~5k triangles (gltf-transform weld + simplify,
// 1.5% of the triangles) -- about what his other weapons are.
// The Forest was never one of 86-setweapons.js's sets (it is the starter set: 93-gearsets.js gives it the plain hazel staff and a stand-in blade), so this ADDS its own two names instead of replacing
// code-built ones: 'staff-forest' for a staff hand (the Witch, the Fighter) and 'polearm-forest' for the Knight when the piece is a polearm (its look, or halberd / spear / polearm in its name), both
// through registerReal's GLB path and the same frames as every other set (staff 36% up, polearm 30% up, body-length). window.__weapons.setModel answers for Forest pieces first; everything else as before.
// A Forest WEAPON dropping warms both files for the floor stand (never at start).
(function(){
window.__weapons.registerReal('staff-forest','staff-forest.glb',{gripF:.36,lenScale:1.64});
window.__weapons.registerReal('polearm-forest','polearm-forest.glb',{gripF:.3,lenScale:1.64});
const isForest=it=>{ const pk=it&&Meta.packs&&Meta.packs.of&&Meta.packs.of(it); return !!(pk&&/Forest/.test(pk.name||'')); };
{ const prev=window.__weapons.setModel; window.__weapons.setModel=function(it,mount){ const r=prev?prev.apply(this,arguments):null; if(r||!isForest(it)) return r;
    if(mount==='staff') return 'staff-forest'; if(mount==='bow') return null; return (it.look==='polearm'||/\b(polearm|halberd|spear)\b/i.test(it.name||''))?'polearm-forest':null; }; }
let warmed=false; function warm(){ if(warmed) return; warmed=true; window.__weapons.model('staff-forest',()=>{}); window.__weapons.model('polearm-forest',()=>{}); }
{ const prev=dropLoot; dropLoot=function(it){ try{ if(it&&it.slot==='weapon'&&isForest(it)) warm(); }catch(e){} return prev.apply(this,arguments); }; }
window.__realforest={warm,warmed:()=>warmed,isForest};
})();
