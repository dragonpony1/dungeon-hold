// ===== THE DEEP PRISON'S FLOOR, LAID IN MATT'S SIX TILES (build 370). Matt sent the six Meshy floor tiles (dungeon-floor-tile-1..6, 2K PBR, 19-29 MB each) -- a framed stone slab with a wooden frame and iron corner plates, in six kinds:
// 1 plain mossy flagstones, 2 a pool of green slime, 3 cracked and heaped with rubble, 4 an iron drain grate, 5 an iron ring and a chain, 6 overgrown with glowing teal moss and mushrooms. They are 2 x 2 units: one grid cell each.
// Meshy's own uv atlases do not survive simplifying (the picture smeared), so each tile was looked at from straight above (tools/scratch-main/floor-bake.mjs, orthographic): its colour picture (a clean top-down 512 jpeg) and its HEIGHT,
// read into a 26 x 26 height-field mesh of 1,250 triangles with a plain planar uv -- 0.13-0.15 MB each (parts/assets/prison-floor-1..6.glb). Every walkable cell of the prison is then given one of the six, by a hash of its place
// (a plain slab 44%, rubble 16%, glowing moss 13%, slime 12%, drain 8%, ring 7%) and one of four turns, in TWO layers:
//  - FAR: the whole floor is repainted from a 3 x 2 atlas of the six pictures (the raised terraces by rewriting the uvs of the game's own floor mesh, the pit by a floor mesh of its own; the old painted plane is hidden), lowered 0.12.
//  - NEAR: the real relief tiles (relief squashed to 60%, tops at the floor + .03) are instanced within 17 units of the camera (and not behind it), one instanced draw per kind, so the picture a step away is real stone, frames, chains and
//    mushrooms. Every tile lights itself a little with its own colour (OWN) so the true greens and the wood show through the firelight. (Meshy's glowing mushrooms were an emissive layer that did not come with the base colour, so tile 6 is plain overgrown moss.)
// Only MAP.id==='prison'. Test hook: window.__prisonfloor.
(function(){
'use strict';
window.__prisonfloor={ info:()=>null };
if(!MAP||MAP.id!=='prison') return;
const LOWER=.12, RELIEF=.6, TOP=.03, R_NEAR=17, ATL=256, KINDS=6, OWN=.32, DIM=0xcdcdcd;   // OWN: how much of a tile's own colour it lights itself with, so the firelight does not turn every moss orange
const WEIGHTS=[[1,.44],[3,.16],[6,.13],[2,.12],[4,.08],[5,.07]];
const cnt={ kinds:0, atlas:0, farQuads:0, pitCells:0, cells:0, near:0 };
function pick(cx,cz){ let h=(Math.imul(cx+17,73856093)^Math.imul(cz+31,19349663))>>>0; h=Math.imul(h^(h>>>15),2246822519)>>>0; h=Math.imul(h^(h>>>13),3266489917)>>>0; h=(h^(h>>>16))>>>0; const r=(h%10000)/10000; let a=0, kind=1; for(const [k,w] of WEIGHTS){ a+=w; if(r<a){ kind=k; break; } } return { kind, rot:(h>>>14)&3 }; }
const load=n=>fetchBytes(ASSET('prison-floor-'+n+'.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',gl=>res(gl.scene||gl.scenes[0]),rej)));
Promise.all([1,2,3,4,5,6].map(load)).then(roots=>{ try{
  const meshes=roots.map(r=>{ let m=null; r.traverse(o=>{ if(!m&&o.isMesh) m=o; }); return m; }); if(meshes.some(m=>!m)) throw new Error('a tile has no mesh'); cnt.kinds=meshes.length;
  // ---- the atlas: the six top-down pictures, 3 x 2
  const cv=document.createElement('canvas'); cv.width=ATL*3; cv.height=ATL*2; const g2=cv.getContext('2d'); meshes.forEach((m,i)=>{ const im=m.material.map&&m.material.map.image; if(im) g2.drawImage(im,(i%3)*ATL,((i/3)|0)*ATL,ATL,ATL); });
  const atlas=new THREE.CanvasTexture(cv); atlas.encoding=THREE.sRGBEncoding; atlas.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy()); cnt.atlas=1;
  const tileOf=new Map(); const tileAt=(cx,cz)=>{ const k=cx*4096+cz; let t=tileOf.get(k); if(!t){ t=pick(cx,cz); tileOf.set(k,t); } return t; };
  const cellUV=(tile,u,v)=>{ let uu=u, vv=v; for(let r=0;r<tile.rot;r++){ const t=uu; uu=1-vv; vv=t; } const pad=.004; uu=pad+uu*(1-2*pad); vv=pad+vv*(1-2*pad); const col=(tile.kind-1)%3, row=((tile.kind-1)/3)|0; return [(col+uu)/3,1-(row+vv)/2]; };
  const cells=[];   // the cells that get a real tile: full flat cells (a stair's half-steps keep only the picture)
  // ---- FAR, the raised terraces: rewrite the uvs of the game's own floor mesh
  const fm=world.userData.floorMesh; if(!fm) throw new Error('no floor mesh');
  { const P=fm.geometry.attributes.position, U=fm.geometry.attributes.uv; for(let q=0;q<P.count;q+=4){ let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(let k=0;k<4;k++){ x0=Math.min(x0,P.getX(q+k)); x1=Math.max(x1,P.getX(q+k)); z0=Math.min(z0,P.getZ(q+k)); z1=Math.max(z1,P.getZ(q+k)); }
      const mx=(x0+x1)/2, mz=(z0+z1)/2, cx=wc(mx), cz=wcz(mz), tile=tileAt(cx,cz), X0=cw(cx)-CELL/2, Z0=cwz(cz)-CELL/2;
      for(let k=0;k<4;k++){ const uv=cellUV(tile,(P.getX(q+k)-X0)/CELL,(P.getZ(q+k)-Z0)/CELL); U.setXY(q+k,uv[0],uv[1]); }
      if(x1-x0>CELL*.99&&z1-z0>CELL*.99) cells.push({ cx, cz, x:cw(cx), z:cwz(cz), y:P.getY(q), tile }); cnt.farQuads++; }
    U.needsUpdate=true; fm.material=fm.material.clone(); fm.material.map=atlas; fm.material.emissiveMap=atlas; fm.material.emissive=new THREE.Color(OWN,OWN,OWN); fm.material.color.setHex(DIM); fm.material.needsUpdate=true; fm.position.y=-LOWER; }
  // ---- FAR, the pit: the old painted plane is hidden and the pit's cells get a floor of their own
  { const old=world.children.find(o=>o.isMesh&&o.geometry&&o.geometry.type==='PlaneGeometry'&&Math.abs(o.rotation.x+PI/2)<1e-3&&Math.abs(o.position.y)<.01&&o.geometry.parameters.width>=GW*CELL-1); if(old) old.visible=false;
    const pos=[], nrm=[], uvs=[], ind=[]; let vi=0; for(let cz=0;cz<GH;cz++) for(let cx=0;cx<GW;cx++){ const i=idx(cx,cz); if(grid[i]===T.WALL||hgt[i]>0||rampA[i]) continue; const tile=tileAt(cx,cz), X0=cw(cx)-CELL/2, Z0=cwz(cz)-CELL/2;
      for(const [u,v] of [[0,0],[0,1],[1,1],[1,0]]){ pos.push(X0+u*CELL,0,Z0+v*CELL); nrm.push(0,1,0); const uv=cellUV(tile,u,v); uvs.push(uv[0],uv[1]); } ind.push(vi,vi+1,vi+2,vi,vi+2,vi+3); vi+=4; cells.push({ cx, cz, x:cw(cx), z:cwz(cz), y:0, tile }); cnt.pitCells++; }
    if(vi){ const gg=new THREE.BufferGeometry(); gg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); gg.setAttribute('normal',new THREE.Float32BufferAttribute(nrm,3)); gg.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2)); gg.setIndex(ind);
      const pm=new THREE.Mesh(gg,new THREE.MeshToonMaterial({ map:atlas, emissiveMap:atlas, emissive:new THREE.Color(OWN,OWN,OWN), gradientMap:GRAD, color:DIM, side:THREE.DoubleSide })); pm.position.y=-LOWER; world.add(pm); world.userData.pitFloor=pm; } }
  // ---- NEAR: the real relief tiles, one instanced draw per kind, refilled with the cells near the camera
  const km=[null], R2=R_NEAR*R_NEAR, bykind=[0,0,0,0,0,0,0]; for(const c of cells) bykind[c.tile.kind]++; cnt.cells=cells.length;
  const Mx=new THREE.Matrix4(), Q=new THREE.Quaternion(), V=new THREE.Vector3(), Sc=new THREE.Vector3(1,RELIEF,1), up=new THREE.Vector3(0,1,0);
  meshes.forEach((m,i)=>{ const kind=i+1; const box=new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position); m.userData.ymax=box.max.y;
    const mat=new THREE.MeshToonMaterial({ map:m.material.map, emissiveMap:m.material.map, emissive:new THREE.Color(OWN,OWN,OWN), gradientMap:GRAD, color:DIM });
    const im=new THREE.InstancedMesh(m.geometry,mat,Math.max(1,bykind[kind])); im.count=0; im.frustumCulled=false; im.userData.noOL=true; world.add(im); km[kind]=im; });
  for(const c of cells){ Q.setFromAxisAngle(up,c.tile.rot*PI/2); V.set(c.x,c.y+TOP-meshes[c.tile.kind-1].userData.ymax*RELIEF,c.z); c.m=new THREE.Matrix4().compose(V,Q,Sc); }
  const DIR=new THREE.Vector3(); let frame=0;
  function refill(){ const cx=camera.position.x, cz=camera.position.z; camera.getWorldDirection(DIR); const fl=Math.hypot(DIR.x,DIR.z)||1, fx=DIR.x/fl, fz=DIR.z/fl; const n=[0,0,0,0,0,0,0];
    for(const c of cells){ const dx=c.x-cx, dz=c.z-cz, d2=dx*dx+dz*dz; if(d2>R2) continue; if(d2>36&&(dx*fx+dz*fz)<-.2*Math.sqrt(d2)) continue; const k=c.tile.kind; km[k].setMatrixAt(n[k]++,c.m); }
    let tot=0; for(let k=1;k<=KINDS;k++){ km[k].count=n[k]; km[k].instanceMatrix.needsUpdate=true; tot+=n[k]; } cnt.near=tot; }
  WORLDANIM.push(()=>{ if((frame++%2)===0) refill(); });
  refill();
  window.__prisonfloor={ info:()=>Object.assign({ tris:KINDS?meshes.map(m=>m.geometry.index.count/3):[], near:cnt.near, byKind:bykind.slice(1), lowered:LOWER },cnt), tileAt:(cx,cz)=>tileAt(cx,cz), refill, kindsMeshes:()=>km.slice(1), mix:()=>{ const o={}; for(const c of cells) o[c.tile.kind]=(o[c.tile.kind]||0)+1; return o; } };
  }catch(e){ console.warn('prison floor',e); } }).catch(e=>console.warn('prison floor',e));
})();
