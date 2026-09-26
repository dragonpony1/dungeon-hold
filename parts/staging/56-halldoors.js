// ===== DOORS ON MAP ONE (build 141): "we could put the doors on map1". The throne room's gothic door (56-thronedecor.js)
// now stands in each of the Gnome Hall's three spawn archways as well, placed the same way: inside the arch on its
// room-facing side, decorated face turned toward the hall, the mobs still stepping out of the swirl behind it. Map one is
// where a new player starts, so it loads a slim copy -- hall-door.glb, the same model with its three 4K textures cut to
// 1024 px (0.7 MB instead of 7.9, made with gltf-transform resize) -- fetched once at 'soon' priority, after the hall's own
// first loads, and cloned for each gate. The throne room's own doors (56-thronedecor.js) now use this same slim file too; the
// 7.6 MB original is gone.
(function(){
let placed=[]; window.__halldoors={placed:()=>placed.slice()};
if(!MAP||MAP.id!=='hall') return;
fetchBytes(ASSET('hall-door.glb'),'soon').then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{
  const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,3.6); toonify(root,fit.scale);
  Object.entries(LANES).forEach(([k,l],i)=>{ const w=i?fit.wrap.clone():fit.wrap; const y=hgt[idx(l.cx,l.cz)]||0, fx=Math.sin(l.face), fz=Math.cos(l.face);
    w.position.set(cw(l.cx)+fx*.4,y,cwz(l.cz)+fz*.4); w.rotation.y=l.face; w.userData.hallDoor=k; world.add(w); placed.push({lane:k,x:+w.position.x.toFixed(2),z:+w.position.z.toFixed(2),face:l.face}); });
}catch(e){ console.warn('hall doors',e); } },e=>console.warn('hall doors',e))).catch(e=>console.warn('hall doors',e));
})();
