// ===== THRONE ROOM DECOR: real Meshy furniture and wall art for the throne map, loaded over the procedural
// placeholders. Gated to MAP.throne so no other map is touched. The set: the throne, two big armored guardian
// statues flanking the dais, a stained-glass window and heraldic crest on the wall behind the throne, twin lit wall
// sconces either side of it, a portrait and a scepter rack on the side walls, a real gothic door standing behind
// each spawn gate's portal swirl, the ornate raked banister railing on every flight of stairs in the hall, and the
// wood-and-gem floor tile plus the stone wall panel laid as the room's motif — floor over every flat walkable cell
// of the hall, wall panel over every real wall face — both in big two-cell tiles, not a small patch. The gates' own
// portal arch and every other map's balustrade are shared code, left untouched: the door and railings here are pure
// additions alongside them, not replacements, so nothing elsewhere can break.
if(MAP.throne){
  const [tx,tz]=MAP.throne; const tx0=cw(tx), tz0=cwz(tz), ty0=hgt[idx(tx,tz)];
  // the stair treads share their mesh with the raised floors (game.js), so the floor motif's own tiles — which
  // skip stair cells, since a flat tile can't sit right on a stepped surface — leave the treads showing that
  // mesh's original cream marble. Retinting the whole mesh gold covers just the stairs in practice: everywhere
  // else it's hidden under a floor tile sitting a hair above it.
  if(world.userData.floorMesh) world.userData.floorMesh.material.color.set(C(0xe0b040));
  // every gem/gold accent baked into these models' textures gets a little self-glow, so the purple shows up even in shadow
  function purpleGlow(root){ root.traverse(o=>{ const m=o.isMesh&&o.material; if(!m||m.userData.__pg) return; m.userData.__pg=true;
    m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n  { float pf=clamp(diffuseColor.b-diffuseColor.g,0.0,1.0)*clamp(diffuseColor.r-diffuseColor.g+0.25,0.0,1.0); totalEmissiveRadiance += vec3(0.62,0.2,0.98)*pf*1.7; }'); }; }); }
  function loadThroneProp(name,targetH,cb){ fetchBytes(ASSET(name)).then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{
      const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,targetH); toonify(root,fit.scale); purpleGlow(root); cb(fit.wrap);
    }catch(e){ console.warn('throne decor '+name,e); } },e=>console.warn('throne decor '+name,e))).catch(e=>console.warn('throne decor '+name,e)); }
  const place=(wrap,x,y,z,yaw)=>{ wrap.position.set(x,y,z); if(yaw) wrap.rotation.y=yaw; world.add(wrap); };
  // the throne itself: real Meshy art replaces the procedural stone seat once it loads
  loadThroneProp('throne-seat.glb',3.2,wrap=>{ const proc=world.userData.throneProc; if(proc) proc.visible=false; place(wrap,tx0,ty0,tz0,0); });
  // two armored guardian statues flanking the dais, big enough to loom, facing the hall the same way the throne does
  for(const dx of [-2.8,2.8]) loadThroneProp('throne-statue.glb',4.0,wrap=>place(wrap,tx0+dx,ty0,tz0+.4,0));
  // the stained-glass window on the wall behind the throne, a crest above it — the dramatic backlight the throne sits under
  loadThroneProp('throne-window.glb',5.0,wrap=>place(wrap,tx0,ty0+3.6,tz0-.85,0));
  loadThroneProp('throne-crest.glb',2.2,wrap=>place(wrap,tx0,ty0+7.6,tz0-.85,0));
  // lit torches flanking the window — real point lights now, not just dark geometry, so the sconces actually read as lit
  loadThroneProp('throne-sconce.glb',1.4,wrap=>{ place(wrap,tx0-3.4,ty0+3.0,tz0-.85,0);
    const l=new THREE.PointLight(C(0xff8a2a),2.6,11,2); l.position.set(-.1,.3,.3); wrap.add(l); });
  loadThroneProp('throne-sconce.glb',1.4,wrap=>{ place(wrap,tx0+3.4,ty0+3.0,tz0-.85,0);
    const l=new THREE.PointLight(C(0xff8a2a),2.6,11,2); l.position.set(.1,.3,.3); wrap.add(l); });
  // a portrait on the left wall, a scepter rack on the right — the room's own trophies
  loadThroneProp('throne-portrait.glb',2.2,wrap=>place(wrap,cw(6),ty0+2.3,tz0+1.5,-PI/2));
  loadThroneProp('throne-scepter.glb',2.0,wrap=>place(wrap,cw(20),ty0+2.3,tz0+1.5,PI/2));
  // a real door standing behind each gate's swirling portal, facing the same way the gate does
  Object.entries(LANES).forEach(([k,l])=>{ loadThroneProp('throne-door.glb',3.4,wrap=>{
    const y=hgt[idx(l.cx,l.cz)]||0, fx=Math.sin(l.face), fz=Math.cos(l.face);   // the portal's own arch sits at local z=-1.1; the door stands a little further back, past the swirl
    place(wrap,cw(l.cx)-fx*2.0,y,cwz(l.cz)-fz*2.0,l.face+PI); }); });
  // the ornate raked railing, matched to a stair's own pitch: one on each side of every flight in the hall, six flights in all
  function railFlight(xLo,xHi,zTop){
    loadThroneProp('throne-railing.glb',2.6,wrap=>place(wrap,cw(xLo)-.3,hgt[idx(xLo,zTop)],cwz(zTop),PI/2));
    loadThroneProp('throne-railing.glb',2.6,wrap=>place(wrap,cw(xHi)+.3,hgt[idx(xHi,zTop)],cwz(zTop),-PI/2));
  }
  railFlight(11,15,10);                    // the fourth flight, up the middle to the throne
  railFlight(4,7,17); railFlight(19,22,17); // the twin third flights, one up each wall
  railFlight(11,15,24);                     // the second flight, up the middle
  railFlight(4,7,31); railFlight(19,22,31); // the twin first flights, up from the floor
  // the wall faces that already carry the game's own painted arched window (every sixth hall face — see the
  // "pillars, props, torches, banners" block in game.js): the wall/window motif below steers clear of these so it
  // never plasters a stone panel or a second window half over the ones already there
  const WIN=new Set(); { const [hx0,hx1,hz0,hz1]=MAP.hall; let k=0;
    wallFaces.forEach(f=>{ if(!(f.cx>=hx0&&f.cx<=hx1&&f.cz>=hz0&&f.cz<=hz1)) return; k++; if(k%6===2) WIN.add(f); }); }
  // the floor motif: the wood-and-gem dais tile, one per walkable flat cell (a hair oversized so neighbours overlap
  // and hide the seams) — the dais, every landing, the galleries, the runner down the middle, the whole hall's
  // floor, not just the small patch under the crystal. One tile a cell (not a 2-cell block) so odd-width rooms —
  // the 3-wide dais column included — never leave a stripe of the old floor showing between misaligned blocks.
  { const FLOORTYPES=new Set([T.FLOOR,T.CARPET,T.DAIS]);
    loadThroneProp('throne-floor.glb',2.7,wrap=>{ wrap.rotation.x=-PI/2;
      for(let cz=2;cz<=44;cz++) for(let cx=0;cx<GW;cx++){ const i=idx(cx,cz);
        if(!FLOORTYPES.has(grid[i])||rampA[i]) continue;
        const t=wrap.clone(); t.position.set(cw(cx),hgt[i]+.02,cwz(cz)); world.add(t);
      } }); }
  // the wall motif: the stone panel, over every real wall face of the hall that doesn't already carry a painted
  // window (found from the engine's own wall geometry, so it lines up exactly) — stacked bottom-up from that cell's
  // own floor (fitModel roots a wrap at the model's bottom, not its centre, so row 0 sits flush on the floor) up to
  // the hall's fixed ceiling height, however many 9-tall tiles that takes, so it reaches the floor everywhere,
  // landings included, instead of stopping partway down
  loadThroneProp('throne-panel2.glb',9,wrap=>{
    wallFaces.forEach(w=>{ if(w.cz<2||w.cz>44||WIN.has(w)) return;
      const baseY=hgt[idx(w.cx,w.cz)]||0, yaw=Math.atan2(w.nx,w.nz), span=WALLH-baseY;
      for(let dy=0;dy<span;dy+=9){ const t=wrap.clone(); t.position.set(w.x+w.nx*.18,baseY+dy,w.z+w.nz*.18); t.rotation.y=yaw; world.add(t); } });
  });
  // the stained-glass window, the same stretch-tile treatment as the wall panel but sparser — an accent spaced
  // around the hall, each one glowing for ambient light, always clear of the game's own painted windows so it
  // never lands on top of one
  loadThroneProp('throne-window.glb',4.2,wrap=>{
    wallFaces.forEach(w=>{ if(w.cz<4||w.cz>44||WIN.has(w)) return; if(Math.abs(w.cx-tx)<=5&&w.cz<=4) return;   // skip right behind the throne — the big dramatic window's already there
      const runAxisVal=(w.nz!==0)?w.cx:w.cz; if(((runAxisVal%8)+8)%8!==3) return;
      const baseY=hgt[idx(w.cx,w.cz)]||0, yaw=Math.atan2(w.nx,w.nz);
      const t=wrap.clone(); t.position.set(w.x+w.nx*.2,baseY+4.2,w.z+w.nz*.2); t.rotation.y=yaw; world.add(t);
      const l=new THREE.PointLight(C(0x9a8ad0),1.8,15,2); l.position.set(w.nx*1.2,0,w.nz*1.2); t.add(l);
    });
  });
}
