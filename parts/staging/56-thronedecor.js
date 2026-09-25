// ===== THRONE ROOM DECOR: real Meshy furniture and wall art for the throne map, loaded over the procedural
// placeholders. Gated to MAP.throne so no other map is touched. The set: the throne, two big armored guardian
// statues flanking the dais, a stained-glass window and heraldic crest on the wall behind the throne, twin lit wall
// sconces either side of it, a portrait and a scepter rack on the side walls, a real gothic door standing behind
// each spawn gate's portal swirl, real hanging chandeliers over the shared procedural rings, the ornate raked
// banister railing on every flight of stairs in the hall, and the wood-and-gem floor tile plus the stone wall panel
// laid as the room's motif — floor over every flat walkable cell
// of the hall, wall panel over every real wall face — both in big two-cell tiles, not a small patch. The gates' own
// portal arch is shared code, left untouched; every other map's own gold balustrade is untouched too, since only
// the throne room's is hidden below, in favour of the real railing model.
if(MAP.throne){
  const [tx,tz]=MAP.throne; const tx0=cw(tx), tz0=cwz(tz), ty0=hgt[idx(tx,tz)];
  // the generic gold balustrade (game.js) still runs along every drop in the hall — now duplicated by the real
  // railing model on the stairs, sitting a little behind it. Hide it for this map now that it's fully replaced.
  (world.userData.railMeshes||[]).forEach(m=>{ m.visible=false; });
  // the generic procedural wall torch (game.js, every map — a bracket, a flame, a glow) is what actually reads as
  // "the sconce" in play, not the Meshy throne-sconce pair pulled above: it repeats on every fourth wall face the
  // length of the hall, throne room included. Pulled here too, same clean-wall diagnostic, throne room only —
  // every other map keeps its torches.
  (world.userData.torchProcs||[]).forEach(t=>{ t.visible=false; });
  // the stair treads share their mesh with the raised floors (game.js), so the floor motif's own tiles — which
  // skip stair cells, since a flat tile can't sit right on a stepped surface — leave the treads showing that
  // mesh's original cream marble. Retinting the whole mesh gold covers just the stairs in practice: everywhere
  // else it's hidden under a floor tile sitting a hair above it.
  if(world.userData.floorMesh) world.userData.floorMesh.material.color.set(C(0xe0b040));
  // every gem/gold accent baked into these models' textures gets a little self-glow, so the purple shows up even in shadow
  function purpleGlow(root){ root.traverse(o=>{ const m=o.isMesh&&o.material; if(!m||m.userData.__pg) return; m.userData.__pg=true;
    m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n  { float pf=clamp(diffuseColor.b-diffuseColor.g,0.0,1.0)*clamp(diffuseColor.r-diffuseColor.g+0.25,0.0,1.0); totalEmissiveRadiance += vec3(0.62,0.2,0.98)*pf*1.7; }'); }; }); }
  // a flat warm floor added to whatever emissive a model already has — for pieces whose own base colour is dark
  // enough to blend into the dark wall around it (clearing the panel geometrically wasn't enough; the sconces read
  // as buried purely because there's no contrast between them and the stone), so silhouette and colour temperature
  // carry the separation instead of brightness alone
  function warmGlow(root){ root.traverse(o=>{ const m=o.isMesh&&o.material; if(!m||m.userData.__wg) return; m.userData.__wg=true;
    m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(.22,.11,.03);'); }; }); }
  function loadThroneProp(name,targetH,cb){ fetchBytes(ASSET(name)).then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{
      const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,targetH); toonify(root,fit.scale); purpleGlow(root); cb(fit.wrap);
    }catch(e){ console.warn('throne decor '+name,e); } },e=>console.warn('throne decor '+name,e))).catch(e=>console.warn('throne decor '+name,e)); }
  // fitModel always scales a model to a target HEIGHT (its own Y extent) — right for anything that stands
  // upright (a statue, a banner, a floor tile stood on end and rotated flat afterward), wrong for a model
  // that's already lying flat as authored, where Y is its thin dimension, not its size. Scaling that by "make
  // Y equal 4" tried to stretch a few centimetres of thickness up to 4 units, and dragged X and Z (a uniform
  // scale) out to over a hundred — a slab far bigger than the room, thick enough to read as a low ceiling
  // (build 83's "ceiling under a carpet"). This fits by X (the model's long edge) instead.
  function loadThronePropW(name,targetW,cb){ fetchBytes(ASSET(name)).then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{
      const root=gltf.scene||gltf.scenes[0]; root.updateMatrixWorld(true);
      const box=new THREE.Box3().setFromObject(root), size=box.getSize(new THREE.Vector3());
      const sc=targetW/Math.max(size.x,1e-6), cx=(box.min.x+box.max.x)/2, cz=(box.min.z+box.max.z)/2;
      const inner=new THREE.Group(); inner.add(root); inner.scale.setScalar(sc); inner.position.set(-cx*sc,-box.min.y*sc,-cz*sc);
      const wrap=new THREE.Group(); wrap.add(inner); toonify(root,sc); purpleGlow(root); cb(wrap);
    }catch(e){ console.warn('throne decor '+name,e); } },e=>console.warn('throne decor '+name,e))).catch(e=>console.warn('throne decor '+name,e)); }
  const place=(wrap,x,y,z,yaw)=>{ wrap.position.set(x,y,z); if(yaw) wrap.rotation.y=yaw; world.add(wrap); };
  // a thin collision box under a railing piece, so the hero can't just walk through it and off the drop it marks —
  // RAILBOXES (game.js) is otherwise empty on every map, so this only ever matters here. alongZ: true for a piece
  // whose long axis runs along world Z (a raked stair rail); false for one running along X (the straight banister).
  // baseY is the floor the piece stands on; .top (baseY+RAIL_H) is its guard height — solidAt only blocks the hero
  // below that, and floorAt lets them land on it above it, the same "stand on a short defense" rule already used
  // elsewhere, so a jump clears the rail (or lands balanced on top of it) instead of hitting an invisible wall.
  const RAIL_H=1.15;
  const railBox=(cx,cz,halfLen,alongZ,baseY)=>{ const t=.22; RAILBOXES.push(Object.assign(alongZ?{x0:cx-t,x1:cx+t,z0:cz-halfLen,z1:cz+halfLen}:{x0:cx-halfLen,x1:cx+halfLen,z0:cz-t,z1:cz+t},{top:baseY+RAIL_H})); };
  // the throne itself: real Meshy art replaces the procedural stone seat once it loads
  loadThroneProp('throne-seat.glb',3.2,wrap=>{ const proc=world.userData.throneProc; if(proc) proc.visible=false; place(wrap,tx0,ty0,tz0,0); });
  // two armored guardian statues flanking the dais, big enough to loom, facing the hall the same way the throne does
  for(const dx of [-2.8,2.8]) loadThroneProp('throne-statue.glb',4.0,wrap=>place(wrap,tx0+dx,ty0,tz0+.4,0));
  // the stained-glass window on the wall behind the throne, a crest above it — the dramatic backlight the throne sits under.
  // Z offset: the throne's own cell is one cell clear of the true wall (a full CELL=2 away, so the wall's face sits at
  // tz0-1), and the wall panel + the ambient copies of this same window elsewhere in the hall both mount flush at that
  // face plus a ~.2 standoff (wallFaces-derived, game.js). These two were hand-placed at tz0-.15 instead — back when
  // the wall panel had its own thickness bug (fixed below) and stuck out 0.7+ units, so pulling the window that far off
  // the true wall was the only way to clear it. That bug's long fixed, but these never got moved back: they've been
  // floating .85 units out in the open room ever since, with the now-correctly-flush wall panel visible behind them —
  // "attached to the wall behind the wall". tz0-.8 lands them back on the real wall face, matching everything else.
  loadThroneProp('throne-window.glb',5.0,wrap=>place(wrap,tx0,ty0+3.6,tz0-.8,0));
  loadThroneProp('throne-crest.glb',2.2,wrap=>place(wrap,tx0,ty0+7.6,tz0-.8,0));
  // the old flanking pair is gone: real sconces now go up everywhere the pulled procedural torch used to stand —
  // see the dense wall+pillar placement below, once WIN (the painted-window face set) exists to steer clear of.
  // a portrait on the left wall, a scepter rack on the right — the room's own trophies
  loadThroneProp('throne-portrait.glb',2.2,wrap=>place(wrap,cw(6),ty0+2.3,tz0+1.5,-PI/2));
  loadThroneProp('throne-scepter.glb',2.0,wrap=>place(wrap,cw(20),ty0+2.3,tz0+1.5,PI/2));
  // a real door standing behind each gate's swirling portal, facing the same way the gate does. The spawn alcove
  // behind a gate is shallow (one cell, ~2 units, before the true back wall) — a thin flush panel sitting close to
  // the portal's own arch (local z=-1.1) reads as a door in the opening; the old thicker model stood a full 2 units
  // back and ended up inside or past that back wall, invisible from the room.
  Object.entries(LANES).forEach(([k,l])=>{ loadThroneProp('throne-door.glb',3.6,wrap=>{
    const y=hgt[idx(l.cx,l.cz)]||0, fx=Math.sin(l.face), fz=Math.cos(l.face);
    place(wrap,cw(l.cx)-fx*1.0,y,cwz(l.cz)-fz*1.0,l.face+PI); }); });
  // the real hanging chandeliers, replacing the procedural gold rings at the same ceiling spots
  (world.userData.chandelierProcs||[]).forEach(ch=>{ ch.visible=false; });
  MAP.chandeliers.forEach(([chx,chz])=>loadThroneProp('chandelier.glb',3.2,wrap=>{ place(wrap,chx,13.8,chz,0);
    const l=new THREE.PointLight(C(0xffb05a),2.75,14,2); l.position.set(0,1,0); wrap.add(l); }));
  // the real runed pillars, replacing the procedural stone columns at the same ten spots. One fetch, cloned per spot
  // (unlike the chandeliers above — only 3 of those, but 10 of these, so it's worth not re-fetching the model ten
  // times). Target height matches the procedural ones exactly: PH (the shaft) + the base/capital's own 1 unit.
  (world.userData.pillarProcs||[]).forEach(p=>{ p.visible=false; });
  { const PH=MAP.pillarH||6; loadThroneProp('throne-pillar.glb',PH+1,wrap=>{
      MAP.pillars.forEach(([px,pz])=>{ const t=wrap.clone(); t.position.set(cw(px),hgt[idx(px,pz)]||0,cwz(pz)); world.add(t); }); }); }
  // the ornate raked railing, matched to a stair's own pitch: one on each side of every flight in the hall, six
  // flights in all. Both sides use the SAME yaw, not mirrored left/right — a Y-axis rotation on an asymmetric raked
  // model (it has a thick post at its low end, an open baluster run at its high end) swaps which end is which, so
  // opposite yaws put one side's post at the top of the flight instead of the bottom. PI/2 is the orientation that
  // puts the post at the flight's low end (larger world Z, since every throne-room flight rises toward -Z).
  function railFlight(xLo,xHi,zTop){
    loadThroneProp('throne-railing.glb',2.6,wrap=>place(wrap,cw(xLo)-.3,hgt[idx(xLo,zTop)],cwz(zTop),PI/2));
    loadThroneProp('throne-railing.glb',2.6,wrap=>place(wrap,cw(xHi)+.3,hgt[idx(xHi,zTop)],cwz(zTop),PI/2));
    // the raked railing model runs the whole flight (three rows, the same span every flight in this hall climbs),
    // but the collision used to be one box near the top row only — solid there, nothing the rest of the way down,
    // which is exactly why jumping onto it only worked "about half way". One box per row instead, each at that
    // row's own floorH (the flight is a ramp: height changes row to row), so the whole rail is solid, not just its crest
    const lx=cw(xLo)-.3, hx=cw(xHi)+.3;
    for(let r=0;r<3;r++){ const wz=cwz(zTop+r); railBox(lx,wz,1,true,floorH(lx,wz)); railBox(hx,wz,1,true,floorH(hx,wz)); }
  }
  railFlight(11,15,10);                    // the fourth flight, up the middle to the throne
  railFlight(4,7,17); railFlight(19,22,17); // the twin third flights, one up each wall
  railFlight(11,15,24);                     // the second flight, up the middle
  railFlight(4,7,31); railFlight(19,22,31); // the twin first flights, up from the floor
  // the straight banister: a level, symmetric module (unlike the raked one, it has matching posts at both ends, so
  // no mirroring problem) — laid one per cell along every landing/gallery edge with a real drop, the same edges the
  // old hidden gold balustrade used to mark. Found with the same "drop of a step and a half or more" rule as that
  // balustrade (game.js), reimplemented here since its own Hc() helper is scoped to that block. Stair cells are
  // skipped — those already have the raked railing.
  { const Hc=(cx,cz,fx,fz)=>{ if(!inb(cx,cz)||grid[idx(cx,cz)]===T.WALL) return -1; return floorH(cw(cx)-CELL/2+fx*CELL,cwz(cz)-CELL/2+fz*CELL); };
    loadThroneProp('throne-banister.glb',1.33,wrap=>{
      for(let cz=0;cz<GH;cz++) for(let cx=0;cx<GW;cx++){ const i=idx(cx,cz); if(grid[i]===T.WALL||rampA[i]||(hgt[i]<=0&&!rampA[i])) continue;
        const X0=cw(cx)-CELL/2, Z0=cwz(cz)-CELL/2;
        for(const [nx,nz] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const mine=Hc(cx,cz,nx>0?.99:nx<0?.01:.5,nz>0?.99:nz<0?.01:.5), theirs=Hc(cx+nx,cz+nz,nx>0?.01:nx<0?.99:.5,nz>0?.01:nz<0?.99:.5);
          if(theirs<0||mine<theirs+1.5) continue;
          const ex=nx?X0+(nx>0?CELL:0):cw(cx), ez=nz?Z0+(nz>0?CELL:0):cwz(cz);
          const t=wrap.clone(); t.position.set(ex-nx*.15,mine,ez-nz*.15); t.rotation.y=nz?0:PI/2; world.add(t);
          railBox(ex-nx*.15,ez-nz*.15,1,!!nx,mine);
        } } }); }
  // the wall faces that already carry the game's own painted arched window (every sixth hall face — see the
  // "pillars, props, torches, banners" block in game.js): the wall/window motif below steers clear of these so it
  // never plasters a stone panel or a second window half over the ones already there
  const WIN=new Set(); { const [hx0,hx1,hz0,hz1]=MAP.hall; let k=0;
    wallFaces.forEach(f=>{ if(!(f.cx>=hx0&&f.cx<=hx1&&f.cz>=hz0&&f.cz<=hz1)) return; k++; if(k%6===2) WIN.add(f); }); }
  // real Meshy sconces, one fetch cloned everywhere: densely across the walls at the same one-in-four-faces cadence
  // the pulled procedural torch used (game.js), skipping the same painted-window faces it always skipped — so the
  // whole hall is lit by real art, as often as that placeholder bracket was, not just a pair by the throne. One
  // also rides each of the ten runed pillars, mounted facing the aisle so it isn't hidden behind the column.
  loadThroneProp('throne-sconce.glb',1.5,wrap=>{ warmGlow(wrap);
    let k=0; wallFaces.forEach(f=>{ k++; if(WIN.has(f)) return; if(k%4!==1) return;
      const yaw=Math.atan2(f.nx,f.nz), fy=hgt[idx(f.cx,f.cz)]||0;
      const t=wrap.clone(); t.position.set(f.x+f.nx*.18,fy+3.1,f.z+f.nz*.18); t.rotation.y=yaw; world.add(t);
      const l=new THREE.PointLight(C(0xffa040),5,13,2); l.position.set(f.nx*.15,.3,f.nz*.15); t.add(l); });
    MAP.pillars.forEach(([px,pz])=>{ const nx=px<tx?1:-1, fy=hgt[idx(px,pz)]||0;   // medial face — toward the centre aisle, not out toward the wall where no one walks
      const t=wrap.clone(); t.position.set(cw(px)+nx*.78,fy+3.0,cwz(pz)); t.rotation.y=Math.atan2(nx,0); world.add(t);
      const l=new THREE.PointLight(C(0xffa040),5,13,2); l.position.set(nx*.15,.3,0); t.add(l); });
  });
  // real windows: the same painted night sky the base game's own arched windows show (WINDOWTEX — stars and a moon,
  // not the flat wall behind), just sized and placed on purpose here instead of the formulaic every-sixth-face rule.
  // Four long tall ones down the main hall's side walls; two or three smaller ones high on the wall up by the
  // throne and crystal. Each claims its wall face in WIN so the stone wall-panel motif below leaves it alone.
  if(WINDOWTEX){
    const pick=(arr,n)=>{ const out=[]; if(!arr.length) return out; const step=Math.max(1,Math.floor(arr.length/n)); for(let i=0;i<n&&i*step<arr.length;i++) out.push(arr[i*step]); return out; };
    // the ambient windows (game.js, every sixth hall face) carry crimson drapes flanking the pane by 1.75 either side —
    // WIN alone only rules out the exact same face, so a custom window picked a face just one or two cells from an
    // ambient one and ended up with that window's own drape (sometimes its pane too) sharing its wall space: looked
    // through the new "sky" window and saw the old stained one and its drape behind it. Keep a real gap from any WIN face.
    const clearOfWin=f=>{ for(const w of WIN){ if(Math.hypot(f.cx-w.cx,f.cz-w.cz)<=2) return false; } return true; };   // 2 cells (4 world units) clears even the wide window's 3.2 span against a drape's 2.25 reach, with a little to spare — 3 cells was overkill and starved the near-throne pool (already tight) of any candidate at all
    const sideFaces=wallFaces.filter(f=>Math.abs(f.nx)>.5&&!WIN.has(f)&&clearOfWin(f)&&f.cz>=11&&f.cz<=40);   // starts three cells past the near-throne pool below (cz 6-8): close enough and a tall window landing right at that boundary reaches back through it via clearOfWin and empties it out
    const tallSpots=[...pick(sideFaces.filter(f=>f.nx<0),2),...pick(sideFaces.filter(f=>f.nx>0),2)];
    tallSpots.forEach(f=>{ const yaw=Math.atan2(f.nx,f.nz), fy=hgt[idx(f.cx,f.cz)]||0, wh=Math.min(9,WALLH-fy-1.5);
      const w=new THREE.Mesh(new THREE.PlaneGeometry(3.2,wh),new THREE.MeshBasicMaterial({map:WINDOWTEX,transparent:true,alphaTest:.5,side:THREE.DoubleSide}));
      w.position.set(f.x+f.nx*.22,fy+wh/2+.8,f.z+f.nz*.22); w.rotation.y=yaw; w.userData.noOL=true; world.add(w);
      const l=new THREE.PointLight(C(0x8fb8ff),1.6,12,2); l.position.set(f.nx*1.2,0,f.nz*1.2); w.add(l); WIN.add(f); });
    const nearWest=wallFaces.filter(f=>f.nx<0&&!WIN.has(f)&&clearOfWin(f)&&f.cz>=6&&f.cz<=8), nearEast=wallFaces.filter(f=>f.nx>0&&!WIN.has(f)&&clearOfWin(f)&&f.cz>=6&&f.cz<=8);   // past z 4, clear of the pillar row that stands right at the wall there
    const nearBack=wallFaces.filter(f=>f.nz<0&&!WIN.has(f)&&clearOfWin(f)&&Math.abs(f.cx-tx)>2&&f.cz<=4);
    const topSpots=[...pick(nearBack,1),...pick(nearWest,1),...pick(nearEast,1)];
    topSpots.forEach(f=>{ const yaw=Math.atan2(f.nx,f.nz);   // WALLH is the hall's one shared ceiling height, not per-landing — no baseY added here, unlike the tall run above
      const w=new THREE.Mesh(new THREE.PlaneGeometry(1.3,3.2),new THREE.MeshBasicMaterial({map:WINDOWTEX,transparent:true,alphaTest:.5,side:THREE.DoubleSide}));
      w.position.set(f.x+f.nx*.22,WALLH-2.4,f.z+f.nz*.22); w.rotation.y=yaw; w.userData.noOL=true; world.add(w);
      const l=new THREE.PointLight(C(0x8fb8ff),1.4,10,2); l.position.set(f.nx*1.0,0,f.nz*1.0); w.add(l); WIN.add(f); });
  }
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
    wrap.children[0].scale.z*=.25;   // a real wall panel doesn't get thicker just because it's taller: fitModel scales depth right along with height, which at 9 tall left it sticking 0.7+ units proud of the wall — enough to bury the sconces and window mounted on the same wall. Flatten it back to a believable relief.
    wallFaces.forEach(w=>{ if(w.cz<2||w.cz>44||WIN.has(w)) return;
      const baseY=hgt[idx(w.cx,w.cz)]||0, yaw=Math.atan2(w.nx,w.nz), span=WALLH-baseY;
      for(let dy=0;dy<span;dy+=9){ const t=wrap.clone(); t.position.set(w.x+w.nx*.18,baseY+dy,w.z+w.nz*.18); t.rotation.y=yaw; world.add(t); } });
  });
  // real hanging banners, swapped in for the painted-plane ones at their exact spots (read straight off the
  // meshes being replaced, so nothing needs re-deriving from the wall geometry a second time) — no other map
  // touched, since bannerMeshes (game.js) is throne-room-only in practice: the castle-only "banner over the
  // gate" doesn't build on this indoor map, so the wall run is the only banner this hall ever had.
  { const spots=(world.userData.bannerMeshes||[]).map(b=>({p:b.position.clone(),yaw:b.rotation.y}));
    (world.userData.bannerMeshes||[]).forEach(b=>{ b.visible=false; });
    if(spots.length) loadThroneProp('throne-banner2.glb',2.6,wrap=>{ spots.forEach(s=>{ const t=wrap.clone(); t.position.copy(s.p); t.rotation.y=s.yaw; world.add(t); }); }); }
  // the carpet motif, over the same cells the floor tile above already covers — laid a hair higher so it wins the
  // z-fight — but restricted to actual T.CARPET cells (the runner and the landings it crosses), leaving the plain
  // stone floor tile as-is everywhere else. Ramp cells stay out of both loops (a flat tile can't sit right on a
  // stepped surface); the repainted procedural carpet texture (game.js) is what covers the stair flights themselves.
  loadThroneProp('throne-carpet-tile.glb',2.7,wrap=>{ wrap.rotation.x=-PI/2;
    for(let cz=2;cz<=44;cz++) for(let cx=0;cx<GW;cx++){ const i=idx(cx,cz);
      if(grid[i]!==T.CARPET||rampA[i]) continue;
      const t=wrap.clone(); t.position.set(cw(cx),hgt[i]+.03,cwz(cz)); world.add(t);
    } });
  // one rug per landing, laid across the walkway between flights — not the dais (that wasn't the plan; the first
  // pass put a single one there, at a badly broken scale that read as a low ceiling — see loadThronePropW above).
  // the three landings each have a front walk the full width of the hall, where the two side flights and the
  // middle one all meet; the rug's long axis (local X) already runs that way at yaw 0, no rotation needed.
  [15,22,29].forEach(lz=>loadThronePropW('throne-rug.glb',8.0,wrap=>place(wrap,tx0,hgt[idx(tx,lz)]+.03,cwz(lz),0)));
  /* the ambient stained-glass windows tiled around the hall — pulled out with the pair behind the throne, same
     re-figuring-placement reason. The wall panel motif right above stays on, so the bare wall is still visible.
  loadThroneProp('throne-window.glb',4.2,wrap=>{
    wallFaces.forEach(w=>{ if(w.cz<4||w.cz>44||WIN.has(w)) return; if(Math.abs(w.cx-tx)<=5&&w.cz<=4) return;   // skip right behind the throne — the big dramatic window's already there
      const runAxisVal=(w.nz!==0)?w.cx:w.cz; if(((runAxisVal%8)+8)%8!==3) return;
      const baseY=hgt[idx(w.cx,w.cz)]||0, yaw=Math.atan2(w.nx,w.nz);
      const t=wrap.clone(); t.position.set(w.x+w.nx*.2,baseY+4.2,w.z+w.nz*.2); t.rotation.y=yaw; world.add(t);
      const l=new THREE.PointLight(C(0x9a8ad0),1.8,15,2); l.position.set(w.nx*1.2,0,w.nz*1.2); t.add(l);
    });
  });
  */
}
