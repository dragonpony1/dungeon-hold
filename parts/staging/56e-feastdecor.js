// ===== THE GREAT FEAST HALL, LIT AND FURNISHED. Matt: "ok the next map is a dinning hall, first thing it needs is more light so hang a bunch of chandeliers in there", "you have sconses to use too"
// (build 303), then "just go ahead and use all the decorative assests and outfit the dinning hall, I am not sure about the mob pathing yet but you can still get the place ready" (build 304).
// Everything here is his real art: the throne room's set (56-thronedecor.js) and the hideout's furniture (copied in as feast-*.glb). The OPEN FLOOR IS LEFT ALONE -- the pathing is still to be
// decided -- so furniture only stands against the walls, in the corners and at the high table (those few cells made solid, T.PROP, like any table); everything else is on the walls, overhead or flat.
//   * LIGHT (303): eleven chandeliers (over the middle of every run of the three long tables, the high table, the east doors) and a sconce where every painted wall torch hung (41), each with a warm light.
//   * FLOOR: the throne room's wood-and-gem tile over the whole hall and the dais, in 2x2-cell tiles where four cells meet level (one-cell tiles fill the rest); the carpet tile over the runner. Drawn instanced.
//   * WALLS: the stone panel over every wall face (instanced); down both long walls a rhythm of real windows, tall banners, the beast-head trophy, the scepter rack and the portrait, kept clear of the
//     sconces, the hearths and the doors (the painted windows are hidden).
//   * THE HIGH TABLE: the throne seat behind the Heartroot, a guardian statue at each end of the dais, the crest above the seat with a banner either side, a portrait at each end of the west wall.
//   * THE ROOM: the four hearths are real fireplaces; real barrels and chests in the corners; a bookcase, a weapon rack, a trophy table, a shelf unit and two tables-with-stools in the quiet corners;
//     hanging lanterns inside each door; a real door in each gate.
// Only MAP.id==='feast'. Test hook: window.__feastdecor.
(function(){
window.__feastdecor={info:()=>null};
if(!MAP||MAP.id!=='feast') return;
const PROTO={}, USED={}; const counts={};
const bump=k=>{ counts[k]=(counts[k]||0)+1; };
// one fetch and parse per model and size; fitted by height (byW: by width), toon-shaded, never itself in the world
function protoOf(name,size,byW){ const key=name+'|'+size+(byW?'w':''); return PROTO[key]||(PROTO[key]=fetchBytes(ASSET(name),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',gl=>{ try{
    const root=gl.scene||gl.scenes[0]; let wrap;
    if(byW){ root.updateMatrixWorld(true); const box=new THREE.Box3().setFromObject(root), sz=box.getSize(new THREE.Vector3()); const sc=size/Math.max(sz.x,1e-6), cx=(box.min.x+box.max.x)/2, cz=(box.min.z+box.max.z)/2;
      const inner=new THREE.Group(); inner.add(root); inner.scale.setScalar(sc); inner.position.set(-cx*sc,-box.min.y*sc,-cz*sc); wrap=new THREE.Group(); wrap.add(inner); toonify(root,sc); }
    else { const fit=fitModel(root,size); toonify(root,fit.scale); wrap=fit.wrap; }
    res(wrap); }catch(e){ rej(e); } },rej)))); }
const use=(name,size,cb,byW)=>protoOf(name,size,byW).then(p=>{ USED[name]=(USED[name]||0)+1; cb(p); }).catch(e=>console.warn('feast decor '+name,e));
function warmGlow(root){ root.traverse(o=>{ const m=o.isMesh&&o.material; if(!m||m.userData.__wg) return; m.userData.__wg=true;
  m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(.22,.11,.03);'); }; }); }
function windowGlow(root){ root.traverse(o=>{ const m=o.isMesh&&o.material; if(!m||m.userData.__wgl) return; m.userData.__wgl=true; const prev=m.onBeforeCompile;
  m.onBeforeCompile=sh=>{ if(prev) prev(sh); sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n  { float bf=clamp(diffuseColor.b-diffuseColor.r-.05,0.0,1.0); totalEmissiveRadiance += vec3(.25,.5,1.0)*bf*1.5; }'); }; }); }
// many copies of one model as InstancedMeshes (every mesh of it, its toon outline shells too): one draw per mesh however many copies
// flatOnly: a floor tile or wall panel -- its toon outline shell never shows on a flat face, so it is left out (half the triangles)
function instance(wrap,mats,flatOnly){ if(!mats.length) return; wrap.updateMatrixWorld(true); const inv=new THREE.Matrix4().copy(wrap.matrixWorld).invert(), m=new THREE.Matrix4();
  wrap.traverse(ob=>{ if(!ob.isMesh||(flatOnly&&ob.userData.isOL)) return; const rel=new THREE.Matrix4().multiplyMatrices(inv,ob.matrixWorld); const im=new THREE.InstancedMesh(ob.geometry,ob.material,mats.length);
    mats.forEach((M,i)=>{ m.multiplyMatrices(M,rel); im.setMatrixAt(i,m); }); im.instanceMatrix.needsUpdate=true; im.frustumCulled=false; im.userData.noOL=true; world.add(im); }); }
const Q=(ax,ay)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(ax||0,ay||0,0));
const mtx=(x,y,z,q,sx,sy,sz)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),q||new THREE.Quaternion(),new THREE.Vector3(sx||1,sy||1,sz||1));
const put=(p,x,y,z,yaw)=>{ const t=p.clone(); t.position.set(x,y,z); t.rotation.y=yaw||0; world.add(t); return t; };
const [HX0,HX1,HZ0,HZ1]=MAP.hall;   // 3..46 x 3..24
const inHall=(cx,cz)=>cx>=HX0&&cx<=HX1&&cz>=HZ0&&cz<=HZ1;
const solidCells=[]; const solid=(cx,cz)=>{ const i=idx(cx,cz); if(grid[i]!==T.PROP){ grid[i]=T.PROP; solidCells.push([cx,cz]); } };
// ---------------- LIGHT (build 303)
const midX=(a,b)=>(cw(a)+cw(b))/2, midZ=(a,b)=>(cwz(a)+cwz(b))/2;
const SPOTS=[];
for(const [z0,z1] of [[8,9],[13,14],[18,19]]) for(const [x0,x1] of [[14,21],[24,29],[32,37]]) SPOTS.push([midX(x0,x1),midZ(z0,z1)]);
SPOTS.push([midX(4,6),midZ(12,14)]); SPOTS.push([midX(43,45),midZ(13,14)]);
const CH_H=3.2, CH_Y=WALLH-CH_H-.6;
(world.userData.chandelierProcs||[]).forEach(ch=>{ ch.visible=false; });
use('chandelier.glb',CH_H,p=>{ warmGlow(p); for(const [x,z] of SPOTS){ const t=put(p,x,CH_Y,z,0); const l=new THREE.PointLight(C(0xffd8b0),1.5,14,2); l.position.set(0,.8,0); t.add(l); bump('chandelier'); } });   // build 471: softer and whiter (the hall was one even orange)
const TORCH=(world.userData.torchProcs||[]).map(t=>({x:t.position.x,y:t.position.y,z:t.position.z,ry:t.rotation.y,t}));
use('throne-sconce.glb',1.5,p=>{ warmGlow(p); let sk=0; for(const s of TORCH){ s.t.visible=false; const nx=Math.sin(s.ry), nz=Math.cos(s.ry);
    const t=put(p,s.x+nx*.34,s.y,s.z+nz*.34,s.ry); if((sk++)%2===0){ const l=new THREE.PointLight(C(0xffa850),2.4,9,2); l.position.set(nx*.15,.3,nz*.15); t.add(l); } bump('sconce'); } });   // build 471: every other sconce casts its light, and a shorter one -- pools of warm light with shadow between, not one even glow
// ---------------- FLOOR: 2x2 tiles where four level cells meet, one-cell tiles elsewhere; the carpet tile over the runner
// build 471 (Matt: "the floor has lots of gaps and mismatched pieces"): EVERY square of the hall is tiled -- under the tables, the pit and the props too (their footprints are bigger than the models, and the
// old painted grid showed round them) -- and all at ONE size, one way round: the 2x2 tiles drew the planks twice as big and turned, next to the single ones
{ const FLOORT=new Set([T.FLOOR,T.DAIS,T.PROP,T.CRYSTAL]), ok=(x,z)=>inHall(x,z)&&FLOORT.has(grid[idx(x,z)])&&!rampA[idx(x,z)], lvl=(x,z)=>hgt[idx(x,z)]||0; const done=new Set(), big=[], small=[];
  for(let z=HZ0;z<=HZ1;z++) for(let x=HX0;x<=HX1;x++){ if(!ok(x,z)||done.has(x+','+z)) continue; const y=lvl(x,z);
    if(false){
      big.push([(cw(x)+cw(x+1))/2,y,(cwz(z)+cwz(z+1))/2]); ['0,0','1,0','0,1','1,1'].forEach(k=>{ const [a,b]=k.split(',').map(Number); done.add((x+a)+','+(z+b)); }); }
    else { small.push([cw(x),y,cwz(z)]); done.add(x+','+z); } }
  const flat=Q(-PI/2,0);
  use('throne-floor.glb',2.7,p=>{ instance(p,big.map(([x,y,z])=>mtx(x,y+.02,z,flat,2,2,1)).concat(small.map(([x,y,z])=>mtx(x,y+.02,z,flat,1,1,1))),true); counts.floorBig=big.length; counts.floorSmall=small.length; });
  const carpet=[]; for(let z=HZ0;z<=HZ1;z++) for(let x=HX0;x<=HX1;x++){ const i=idx(x,z); if(grid[i]===T.CARPET&&!rampA[i]) carpet.push(mtx(cw(x),(hgt[i]||0)+.21,cwz(z),flat,1,1,.35)); }   // build 469 (Matt: "you see how the purple rug is buried in the floor tile? we've seen this before"): the floor tile is drawn a little past its square and its gems stand .14 proud -- they came up through the rug's edges and middle. The rug is flattened to a third of its depth and laid on top of the tiles
  use('throne-carpet-tile.glb',2.7,p=>{ instance(p,carpet,true); counts.carpet=carpet.length; }); }
// ---------------- WALLS: the stone panel on every wall face of the hall (instanced), the painted windows hidden
(world.userData.windowParts||[]).forEach(o=>{ o.visible=false; });
const HALLF=wallFaces.filter(f=>inHall(f.cx,f.cz));
// build 529 prep: a panel is wider than its square (about two squares either side), so the ones beside a doorway hung half across it -- the east doors read as a solid wall with a slit, and a mob
// (and Sir Bullion's roll-out, 95v) walked out through stone. Each panel is now cut back to the wall it stands on: never past the last wall square before an opening.
use('throne-panel2.glb',WALLH,p=>{ p.children[0].scale.z*=.25; p.updateMatrixWorld(true); const pw=new THREE.Box3().setFromObject(p).getSize(new THREE.Vector3()).x||CELL*3.8;
  const isW=(x,z)=>gat(x,z)===T.WALL; let clipped=0;
  instance(p,HALLF.map(f=>{ const wx=f.cx-f.nx, wz=f.cz-f.nz, ax=f.nz, az=-f.nx; const run=s=>{ let n=0; while(n<3&&isW(wx+ax*s*(n+1),wz+az*s*(n+1))) n++; return (n+.5)*CELL; };   // the panel's own x runs along (ax, az)
    const lo=Math.max(-pw/2,-run(-1)), hi=Math.min(pw/2,run(1)), w=hi-lo, c=(lo+hi)/2; if(w<pw-.01) clipped++;
    return mtx(f.x+f.nx*.16+ax*c,hgt[idx(f.cx,f.cz)]||0,f.z+f.nz*.16+az*c,Q(0,Math.atan2(f.nx,f.nz)),w/pw,1,1); }),true); counts.panels=HALLF.length; counts.panelsClipped=clipped; });
// (build 304: the warm glow stays on the sconces and chandeliers only -- on the furniture it washed the lit room orange -- and the lights are a notch softer and less orange)
// the long walls' rhythm (the throne room's pieces and sizes): a spot every few cells, kept a cell clear of every sconce and away from the hearths and doors
const HEARTHX=(MAP.hearths||[]).map(h=>h[0]);
const DOORX={N:[],S:[]}; for(const l of Object.values(LANES)){ if(l.cz<HZ0) DOORX.N.push(l.cx); else if(l.cz>HZ1) DOORX.S.push(l.cx); }
const sconceAt=(f)=>TORCH.some(s=>Math.hypot(s.x-f.x,s.z-f.z)<CELL*1.4);
const SIZE={ window:s=>Math.min(10.5,s*.6), banner:s=>Math.min(9,s*.5), beast:s=>Math.min(7,s*.42), rack:s=>Math.min(6.4,s*.38), portrait:s=>Math.min(5,s*.34) };
const BOTTOM={ window:(b,s,h)=>b+s*.22, banner:(b,s,h)=>b+s*.92-h, beast:(b,s,h)=>b+s*.44-h/2, rack:(b,s,h)=>b+s*.44-h/2, portrait:(b,s,h)=>b+s*.46-h/2 };
const FLAT={ window:.55, banner:1, beast:.6, rack:.8, portrait:.6 };
const ART={ window:['throne-window-v2.glb',8], banner:['throne-banner2.glb',6], beast:['throne-beast.glb',3.6], rack:['throne-scepter.glb',4.4] };   // build 528: the portraits are Matt's own paintings now (below), not throne-portrait.glb
const plan=[];
{ const walls=[{nz:1,cz:HZ0,doors:DOORX.N,cycle:['window','banner','portrait','window','beast','portrait']},{nz:-1,cz:HZ1,doors:DOORX.S,cycle:['window','portrait','beast','window','banner','portrait']}];
  for(const W of walls){ const faces=HALLF.filter(f=>f.nz===W.nz&&f.nx===0&&f.cz===W.cz).sort((a,b)=>a.cx-b.cx); let last=-99, k=0;
    for(const f of faces){ if(f.cx<HX0+5||f.cx>HX1-4) continue; if(f.cx-last<4) continue; if(HEARTHX.some(hx=>Math.abs(hx-f.cx)<=3)) continue; if(W.doors.some(dx=>Math.abs(dx-f.cx)<=2)) continue; if(sconceAt(f)) continue;
      const base=hgt[idx(f.cx,f.cz)]||0; plan.push({kind:W.cycle[k++%W.cycle.length],f,base,span:WALLH-base,yaw:Math.atan2(f.nx,f.nz)}); last=f.cx; } } }
// the west wall behind the high table: the crest over the seat, a banner either side, a portrait at each end
const westFace=cz=>HALLF.find(f=>f.nx===1&&f.cx===HX0&&f.cz===cz);
for(const [kind,cz] of [['banner',11],['banner',15],['portrait',6],['portrait',20],['portrait',2],['portrait',24]]){ const f=westFace(cz); if(!f) continue; const base=hgt[idx(f.cx,f.cz)]||0; plan.push({kind,f,base,span:WALLH-base,yaw:Math.atan2(f.nx,f.nz)}); }
for(const kind of Object.keys(ART)){ const [file,H0]=ART[kind];
  use(file,H0,wrap=>{ if(kind==='window') windowGlow(wrap); wrap.children[0].scale.z*=FLAT[kind];
    for(const p of plan){ if(p.kind!==kind) continue; const h=SIZE[kind](p.span), t=wrap.clone(); t.scale.setScalar(h/H0); t.updateMatrixWorld(true);
      const back=Math.max(0,-new THREE.Box3().setFromObject(t).min.z); t.position.set(p.f.x+p.f.nx*(.42+back),BOTTOM[kind](p.base,p.span,h),p.f.z+p.f.nz*(.42+back)); t.rotation.y=p.yaw; world.add(t); bump(kind); } }); }
// build 528 (Matt: "we need to put some of our portraits around in the dinning hall" / "and the avery portrait"): his paintings in gilded frames where the portraits hang -- the two behind the high table
// first (Avery, the hero family), then down the long walls (the group hug, the bunny ears, the Witch vs. the Ogre). assets/feast-pic-<name>.jpg, each framed at its own shape. Hook: window.__feastPics
{ const PICS=['avery','family','hug','bunny','witchogre'], spots=plan.filter(p=>p.kind==='portrait').sort((a,b)=>(a.f.nx===1?0:1)-(b.f.nx===1?0:1)), hung=[];
  const gold=new THREE.MeshStandardMaterial({color:0xc9962f,metalness:.7,roughness:.35,emissive:0x3a2208,emissiveIntensity:.4}), dark=new THREE.MeshStandardMaterial({color:0x2a1608,roughness:.8});
  spots.forEach((p,i)=>{ const name=PICS[i%PICS.length], H=Math.min(5.4,p.span*.36), g=new THREE.Group(); g.position.set(p.f.x+p.f.nx*.5,p.base+p.span*.47,p.f.z+p.f.nz*.5); g.rotation.y=p.yaw; world.add(g);
    // build 529: Matt's OFFICIAL Avery portrait arrived in its own rose-and-gold frame -- hung as it is (feast-pic-avery-framed.png, background cut away), a little larger, no second frame round it
    if(name==='avery'){ new THREE.TextureLoader().load(ASSET('feast-pic-avery-framed.png'),tex=>{ tex.encoding=THREE.sRGBEncoding; const HH=H*1.3, WW=HH*tex.image.width/tex.image.height;
        const pic=new THREE.Mesh(new THREE.PlaneGeometry(WW,HH),new THREE.MeshBasicMaterial({map:tex,color:0xd8d0c4,transparent:true,alphaTest:.5})); pic.position.z=.06; pic.userData.noOL=true; g.add(pic); hung.push(name); bump('painting'); }); return; }
    new THREE.TextureLoader().load(ASSET('feast-pic-'+name+'.jpg'),tex=>{ tex.encoding=THREE.sRGBEncoding; const asp=tex.image.width/tex.image.height, W=H*asp, B=.28;
      const pic=new THREE.Mesh(new THREE.PlaneGeometry(W,H),new THREE.MeshBasicMaterial({map:tex,color:0xd8d0c4})); pic.position.z=.06; pic.userData.noOL=true; g.add(pic);
      const back=new THREE.Mesh(new THREE.BoxGeometry(W+B*2,H+B*2,.1),dark); back.userData.noOL=true; g.add(back);
      for(const [w,h,x,y] of [[W+B*2,B,0,H/2+B/2],[W+B*2,B,0,-H/2-B/2],[B,H,-W/2-B/2,0],[B,H,W/2+B/2,0]]){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.22),gold); m.position.set(x,y,.08); g.add(m); }
      hung.push(name); bump('painting'); }); });
  window.__feastPics={ spots:()=>spots.length, hung:()=>hung.slice() }; }
// ---------------- THE HIGH TABLE: the seat behind the Heartroot, a statue at each end of the dais, the crest above the seat
{ const [kx,kz]=MAP.crystal, wx=cw(HX0)-CELL/2, dy=hgt[idx(HX0,kz)]||0;
  solid(HX0,kz); use('throne-seat.glb',3.2,p=>{ put(p,wx+1.05,dy,cwz(kz),PI/2); bump('seat'); });
  for(const sz of [10,17]){ solid(HX0,sz); use('throne-statue.glb',4.0,p=>{ put(p,wx+1.1,hgt[idx(HX0,sz)]||0,cwz(sz),PI/2); bump('statue'); }); }
  use('throne-crest.glb',2.2,p=>{ put(p,wx+.45,dy+6.4,cwz(kz),PI/2); bump('crest'); }); }
// ---------------- THE TABLES (build 304, Matt's feast-hall-table: a plank table, a bench down each side, a roast and platters, candelabras, a lion banner off the end) over the old code-built ones:
// each run of table between the aisles gets one or two copies (whichever keeps them nearest his proportions), stretched along the run to fill it; a run too short for one (the single cell
// at the far end) gets a small table with stools instead
(world.userData.tableProcs||[]).forEach(g=>{ g.visible=false; });
{ const L0=7.35, runs=[]; for(const [x0,x1,z0,z1] of (MAP.tables||[])){ let run=null; const gaps=MAP.tableGaps||[]; for(let x=x0;x<=x1+1;x++){ if(x>x1||gaps.includes(x)){ if(run) runs.push({a:run[0],b:run[1],z0,z1}); run=null; continue; } if(!run) run=[x,x]; else run[1]=x; } }
  const long=runs.filter(r=>(r.b-r.a+1)*CELL>=L0*.6), stub=runs.filter(r=>(r.b-r.a+1)*CELL<L0*.6);
  use('feast-table.glb',L0,p=>{ for(const r of long){ const len=(r.b-r.a+1)*CELL, k=Math.max(1,Math.round(len/L0)), seg=len/k, x0=cw(r.a)-CELL/2, z=(cwz(r.z0)+cwz(r.z1))/2;
      for(let j=0;j<k;j++){ const t=put(p,x0+seg*(j+.5),0,z,0); t.scale.set(seg/L0,1,1); bump('table'); } } },true);
  use('feast-table-stools.glb',1.5,p=>{ for(const r of stub){ put(p,(cw(r.a)+cw(r.b))/2,0,(cwz(r.z0)+cwz(r.z1))/2,0); bump('stubTable'); } }); }
// ---------------- THE ROOM: fireplaces for the painted hearths, real barrels and chests for the corner props, furniture in the quiet corners, lanterns inside the doors, a door in each gate
(world.userData.hearthProcs||[]).forEach(g=>{ g.visible=false; });
use('feast-fireplace.glb',3.9,p=>{ for(const [x,z,yaw] of (MAP.hearths||[])){ const nz=Math.cos(yaw), nx=Math.sin(yaw); put(p,cw(x)+nx*(CELL/2+.35),0,cwz(z)+nz*(CELL/2+.35),yaw); bump('fireplace'); } });
(world.userData.barrelProcs||[]).forEach(g=>{ g.visible=false; }); (world.userData.crateProcs||[]).forEach(g=>{ g.visible=false; });
use('feast-barrel.glb',1.6,p=>{ for(const [x,z] of MAP.barrels){ put(p,cw(x)-.35,0,cwz(z)-.2,0.3); put(p,cw(x)+.45,0,cwz(z)+.35,1.4); bump('barrel'); bump('barrel'); } });
use('feast-chest.glb',1.1,p=>{ for(const [x,z] of MAP.crates){ put(p,cw(x),0,cwz(z),z>HZ0+5?PI:0); bump('chest'); } });
// against a wall: [model, height, cell, which wall it backs onto]
const WALLSTAND=[['feast-bookcase.glb',3.4,[HX0,5],'W'],['feast-weapon-rack.glb',2.6,[HX0,21],'W'],['feast-trophy-table.glb',1.7,[7,HZ0],'N'],['feast-shelf-unit.glb',3.0,[7,HZ1],'S'],
  ['feast-table-stools.glb',1.5,[43,5],'N'],['feast-table-stools.glb',1.5,[43,22],'S']];
for(const [file,h,[cx,cz],side] of WALLSTAND){ solid(cx,cz); const yaw={W:PI/2,E:-PI/2,N:0,S:PI}[side], back={W:[-1,0],E:[1,0],N:[0,-1],S:[0,1]}[side];
  use(file,h,p=>{ const t=p.clone(); t.updateMatrixWorld(true); t.rotation.y=yaw; t.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(t), half=back[0]?(bb.max.x-bb.min.x)/2:(bb.max.z-bb.min.z)/2;
    const edge=file.includes('table-stools')?0:CELL/2-half-.05; t.position.set(cw(cx)+back[0]*edge,hgt[idx(cx,cz)]||0,cwz(cz)+back[1]*edge); world.add(t); bump(file.replace('feast-','').replace('.glb','')); }); }
use('feast-lantern.glb',1.3,p=>{ warmGlow(p); for(const l of Object.values(LANES)){ const fx=Math.sin(l.face), fz=Math.cos(l.face); let cx=l.cx, cz=l.cz; for(let i=0;i<12&&!inHall(cx,cz);i++){ cx=Math.round(cx+fx); cz=Math.round(cz+fz); }
    for(const s of [-1,1]){ const x=cw(cx)+fz*s*2.6+fx*.6, z=cwz(cz)-fx*s*2.6+fz*.6; const t=put(p,x,WALLH-3.2,z,0); const gl=new THREE.PointLight(C(0xffb05a),1.6,9,2); gl.position.set(0,.4,0); t.add(gl); bump('lantern'); } } });
use('hall-door.glb',3.6,p=>{ for(const l of Object.values(LANES)){ const y=hgt[idx(l.cx,l.cz)]||0, fx=Math.sin(l.face), fz=Math.cos(l.face); put(p,cw(l.cx)+fx*.4,y,cwz(l.cz)+fz*.4,l.face); bump('door'); } });
// Matt's taxidermy owlbear (build 304): a pair just inside the east doors, one each side of the way in, rearing at whoever comes through
{ const E=LANES.E; if(E){ for(const cz of [E.cz-3,E.cz+4]){ const cx=HX1-1; if(!inHall(cx,cz)) continue; solid(cx,cz); use('feast-owlbear.glb',3.6,p=>{ put(p,cw(cx),hgt[idx(cx,cz)]||0,cwz(cz),-PI/2); bump('owlbear'); }); } } }
if(solidCells.length) reflow();
window.__feastdecor={reach:()=>Object.fromEntries(Object.entries(LANES).map(([k,l])=>[k,flowFree.dist[idx(l.cx,l.cz)]])),info:()=>Object.assign({spots:SPOTS.length,torchSpots:TORCH.length,chY:+CH_Y.toFixed(2),plan:plan.map(p=>p.kind+'@'+p.f.cx+','+p.f.cz),solid:solidCells.slice()},counts),used:()=>Object.assign({},USED)};
})();
