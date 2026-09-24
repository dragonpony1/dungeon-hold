// ===== THRONE ROOM DECOR: real Meshy furniture and wall art for the throne map, loaded over the procedural
// placeholders. Gated to MAP.throne so no other map is touched. The full set: the throne, two flanking guardian
// statues, a stained-glass window and heraldic crest on the wall behind the throne, twin wall sconces either side of
// it, a portrait and a scepter rack on the side walls, a real gothic door standing behind each spawn gate's portal
// swirl, and a pair of the ornate railing model flanking the top of the main stair. The plain stone wall panel isn't
// placed — nothing in the room needed a plain filler once the rest was in. The gates' own portal arch and every
// other map's balustrade are shared code, left untouched: the door and railing here are pure additions alongside
// them, not replacements, so nothing elsewhere can break.
if(MAP.throne){
  const [tx,tz]=MAP.throne; const tx0=cw(tx), tz0=cwz(tz), ty0=hgt[idx(tx,tz)];
  function loadThroneProp(name,targetH,cb){ fetchBytes(ASSET(name)).then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{
      const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,targetH); toonify(root,fit.scale); cb(fit.wrap);
    }catch(e){ console.warn('throne decor '+name,e); } },e=>console.warn('throne decor '+name,e))).catch(e=>console.warn('throne decor '+name,e)); }
  const place=(wrap,x,y,z,yaw)=>{ wrap.position.set(x,y,z); if(yaw) wrap.rotation.y=yaw; world.add(wrap); };
  // the throne itself: real Meshy art replaces the procedural stone seat once it loads
  loadThroneProp('throne-seat.glb',3.2,wrap=>{ const proc=world.userData.throneProc; if(proc) proc.visible=false; place(wrap,tx0,ty0,tz0,0); });
  // two guardian statues flanking the dais, facing the hall the same way the throne does
  for(const dx of [-2.3,2.3]) loadThroneProp('throne-statue.glb',2.4,wrap=>place(wrap,tx0+dx,ty0,tz0+.4,0));
  // the stained-glass window on the wall behind the throne, a crest above it — the dramatic backlight the throne sits under
  loadThroneProp('throne-window.glb',5.0,wrap=>place(wrap,tx0,ty0+3.6,tz0-.85,0));
  loadThroneProp('throne-crest.glb',2.2,wrap=>place(wrap,tx0,ty0+7.6,tz0-.85,0));
  // torches flanking the window
  for(const dx of [-3.4,3.4]) loadThroneProp('throne-sconce.glb',1.4,wrap=>place(wrap,tx0+dx,ty0+3.0,tz0-.85,0));
  // a portrait on the left wall, a scepter rack on the right — the room's own trophies
  loadThroneProp('throne-portrait.glb',2.2,wrap=>place(wrap,cw(6),ty0+2.3,tz0+1.5,-PI/2));
  loadThroneProp('throne-scepter.glb',2.0,wrap=>place(wrap,cw(20),ty0+2.3,tz0+1.5,PI/2));
  // a real door standing behind each gate's swirling portal, facing the same way the gate does
  Object.entries(LANES).forEach(([k,l])=>{ loadThroneProp('throne-door.glb',3.4,wrap=>{
    const y=hgt[idx(l.cx,l.cz)]||0, fx=Math.sin(l.face), fz=Math.cos(l.face);   // the portal's own arch sits at local z=-1.1; the door stands a little further back, past the swirl
    place(wrap,cw(l.cx)-fx*2.0,y,cwz(l.cz)-fz*2.0,l.face+PI); }); });
  // the ornate railing, flanking the top of the main stair up to the dais — one of four flights, the one every wave climbs
  loadThroneProp('throne-railing.glb',2.6,wrap=>place(wrap,cw(11)-.3,hgt[idx(11,10)],cwz(10),PI/2));
  loadThroneProp('throne-railing.glb',2.6,wrap=>place(wrap,cw(15)+.3,hgt[idx(15,10)],cwz(10),-PI/2));
  // the dais floor: real wood-and-gem tile laid flush over the carpet, one tile a cell, right under the crystal and throne
  loadThroneProp('throne-floor.glb',2.0,wrap=>{ wrap.rotation.x=-PI/2;
    for(let cx=12;cx<=14;cx++) for(let cz=5;cz<=7;cz++){ const t=wrap.clone(); t.position.set(cw(cx),hgt[idx(cx,cz)]+.02,cwz(cz)); world.add(t); } });
  // the wall behind the throne, tiled with the same stone panel — set a hair further back than the window/crest/sconces so it reads as the wall they're mounted on, not fighting with them
  loadThroneProp('throne-panel2.glb',2.0,wrap=>{
    for(const dx of [-4,-2,0,2,4]) for(const dy of [1.2,3.2,5.2]){ const t=wrap.clone(); t.position.set(tx0+dx,ty0+dy,tz0-1.0); world.add(t); } });
}
