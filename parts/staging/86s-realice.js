// ===== THE ICE SET'S STAFF AND POLEARM ARE MATT'S OWN MODELS (build 293). Matt sent "frost-staff-2k-pbr" and "frost-spear-2k-pbr" (Weapon sets / GEAR SETS / water set) with their framed inventory icons; the code-built
// staff-ice and polearm-ice (86f-ice.js) give way to them, the way 86l-86r did for the Void, Chaos, Earth, Fire, Radiance, Tempest and Forest pairs: registerReal (80-weapons.js) loads these files instead of the set's own
// factory, through the same async GLB path (same outline, mount, scale math and floor-stand glow). Same frames as the code-built ones: the STAFF 36% of the way up and body-length (the Witch and the Fighter), the POLEARM
// 30% up and body-length (the Knight). The staff's magic (its bolt colour, the charge glow) stays the set's (82-staff.js). An Ice WEAPON dropping warms both files for the floor stand (never at start).
(function(){
window.__weapons.registerReal('staff-ice','staff-ice.glb',{gripF:.36,lenScale:1.64});
window.__weapons.registerReal('sword-ice','sword-ice.glb');   // build 493: Matt's Ice ('frost') sword (GEAR SETS / water set / animated), turned blade-up (tools/glb-flip.mjs)
window.__weapons.registerReal('polearm-ice','polearm-ice.glb',{gripF:.3,lenScale:1.64});
let warmed=false; function warm(){ if(warmed) return; warmed=true; window.__weapons.model('staff-ice',()=>{}); window.__weapons.model('polearm-ice',()=>{}); }
{ const prev=dropLoot; dropLoot=function(it){ try{ if(it&&it.slot==='weapon'&&window.__weapons.setModel&&window.__weapons.setModel(it,'staff')==='staff-ice') warm(); }catch(e){} return prev.apply(this,arguments); }; }
window.__realice={warm,warmed:()=>warmed};
})();
