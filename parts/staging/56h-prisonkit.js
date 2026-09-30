// ===== THE DEEP PRISON, PAPERED IN ITS REAL 3D KIT (build 350). Matt: "this whole place needs to be those kinds of walls, not the destructible ones. the cells and the walls the greenish ones." Every wall face in the cavern is
// now built from his own Meshy pieces instead of a painted picture: the mossy GREENISH WALL (dungeon-wall) and two CELLS -- the busted cell and the cell of reaching arms (dungeon-cell arms). Down at floor level, three modules
// high (six up), they are real instanced geometry you can walk up to; higher up the same three pieces are rendered once into the wall's texture, so the whole height reads as that kit at no extra triangles. The pattern runs
// cell, wall, cell, wall along every wall, and a cell column alternates cell / wall / cell up its height -- floors of cells with stone between. Behind the Heartroot the wall is the plain greenish wall five high (ten up).
// The destructible walls (Bob's and the Meshy cracked one) are NOT part of this: they stay their own brown-gold selves, in their arches. Skipped: the breakable walls' openings, the four busted-cell gates, and the four
// animated cells (56f). The instanced pieces are grouped into chunks with their own bounding spheres so the ones out of view are not drawn.
// Only MAP.id==='prison'. Test hook: window.__prisonkit.
(function(){
window.__prisonkit={info:()=>null};
if(!MAP||MAP.id!=='prison') return;
const KIT_ROWS=5, FRONT=.3, CHUNK=16;   // modules high on a wall / behind the Heartroot; how far the front of a piece stands out of the wall plane; chunk size in world units
const cnt={ modules:0, draws:0, baked:0, cellCols:0, wallCols:0, types:0 };
const load=name=>fetchBytes(ASSET(name),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',gl=>{ try{ const root=gl.scene||gl.scenes[0]; toonify(root,1); res(root); }catch(e){ rej(e); } },rej)));
// a model's front (+z) rendered flat, square, with no light, into a 256px canvas: that piece's picture for the wall's texture
function bakeModel(renderer0,root){ const size=256, rt=new THREE.WebGLRenderTarget(size,size,{ minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter }); rt.texture.encoding=THREE.sRGBEncoding;
  const sc=new THREE.Scene(); sc.background=new THREE.Color(0x10140e); const cl=root.clone(true); cl.traverse(o=>{ if(!o.isMesh) return; if(o.userData.isOL){ o.visible=false; return; } o.material=new THREE.MeshBasicMaterial({ map:o.material.map, color:o.material.map?0xffffff:o.material.color, skinning:!!o.isSkinnedMesh, side:THREE.DoubleSide }); });
  cl.updateMatrixWorld(true); const bx=new THREE.Box3().setFromObject(cl), ct=bx.getCenter(new THREE.Vector3()), sz=bx.getSize(new THREE.Vector3()); cl.position.sub(ct); sc.add(cl);
  const hw=Math.max(sz.x,sz.y)/2*1.02, cam=new THREE.OrthographicCamera(-hw,hw,hw,-hw,.1,20); cam.position.set(0,0,5); cam.lookAt(0,0,0);
  const keep=renderer0.getRenderTarget(); renderer0.setRenderTarget(rt); renderer0.clear(); renderer0.render(sc,cam); const px=new Uint8Array(size*size*4); renderer0.readRenderTargetPixels(rt,0,0,size,size,px); renderer0.setRenderTarget(keep); rt.dispose();
  const c=document.createElement('canvas'); c.width=c.height=size; const g=c.getContext('2d'), id=g.createImageData(size,size); for(let y=0;y<size;y++) id.data.set(px.subarray((size-1-y)*size*4,(size-y)*size*4),y*size*4); g.putImageData(id,0,0); return c; }
Promise.all([load('prison-wall.glb'),load('prison-cell-busted.glb'),load('prison-cell-arms-static.glb'),load('prison-cell-tentacle.glb'),load('prison-cell-arm.glb')]).then(([wall,busted,arms,tent,arm])=>{ try{
  const cellWall=world.userData.cellWall; if(!cellWall||!cellWall.material.map||!cellWall.material.map.image) throw new Error('no wall texture');
  // ---- the texture: five tiles, one per kind of wall -- 0 busted cell, 1 the greenish wall (and all the apex), 2 cell of arms, 3 tentacle cell, 4 hairy-arm cell
  const dst=cellWall.material.map.image.getContext('2d'); [wall,busted,arms,tent,arm].forEach((r,i)=>{ const tile=[1,0,2,3,4][i]; dst.drawImage(bakeModel(renderer,r),tile*256,0); });
  cellWall.material.map.needsUpdate=true; cnt.baked=5;
  // ---- the real pieces
  const tiles=world.userData.faceTile||[], alc=world.userData.alcoveFaces||new Set(), lanes=Object.values(LANES);
  const nearLane=f=>lanes.some(l=>Math.max(Math.abs(f.cx-l.cx),Math.abs(f.cz-l.cz))<=2), rigs=new Set([[7,31],[39,31],[14,45],[32,45]].map(p=>p.join(',')));
  const prep=root=>{ root.updateMatrixWorld(true); const box=new THREE.Box3().setFromObject(root), sz=box.getSize(new THREE.Vector3()), c=box.getCenter(new THREE.Vector3()), s=2/sz.y; return { root, s, depth:sz.z*s, off:new THREE.Matrix4().makeTranslation(-c.x,-box.min.y,-c.z) }; };
  const P={ wall:prep(wall), busted:prep(busted), arms:prep(arms), tent:prep(tent), arm:prep(arm) }; cnt.types=Object.keys(P).length;
  const buckets=new Map();   // model + chunk -> matrices
  const up=new THREE.Vector3(0,1,0), Q=new THREE.Quaternion(), V=new THREE.Vector3(), Sc=new THREE.Vector3();
  const put=(kind,f,row,y0)=>{ const p=P[kind]; Q.setFromAxisAngle(up,Math.atan2(f.nx,f.nz)); Sc.set(p.s,p.s,p.s); V.set(f.x+f.nx*(FRONT-p.depth/2),y0+row*2,f.z+f.nz*(FRONT-p.depth/2));
    const key=kind+'|'+Math.floor(f.x/CHUNK)+'|'+Math.floor(f.z/CHUNK); let b=buckets.get(key); if(!b){ b={ kind, mats:[], pts:[] }; buckets.set(key,b); } b.mats.push(new THREE.Matrix4().compose(V,Q,Sc).multiply(p.off)); b.pts.push(V.x,V.y,V.z); cnt.modules++; };
  wallFaces.forEach((f,q)=>{ if(alc.has(q)||nearLane(f)||rigs.has(f.cx+','+f.cz)) return; const t=tiles[q]; const y0=hgt[idx(f.cx,f.cz)]||0;
    if(t===0||t===2||t===3||t===4){ const kind=['busted',null,'arms','tent','arm'][t]; for(let r=0;r<KIT_ROWS;r++) put(r%2===0?kind:'wall',f,r,y0); cnt.cellCols++; }
    else { for(let r=0;r<KIT_ROWS;r++) put('wall',f,r,y0); cnt.wallCols++; } });
  const m=new THREE.Matrix4();
  for(const b of buckets.values()){ const p=P[b.kind]; let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,z0=1e9,z1=-1e9; for(let i=0;i<b.pts.length;i+=3){ x0=Math.min(x0,b.pts[i]); x1=Math.max(x1,b.pts[i]); y0=Math.min(y0,b.pts[i+1]); y1=Math.max(y1,b.pts[i+1]); z0=Math.min(z0,b.pts[i+2]); z1=Math.max(z1,b.pts[i+2]); }
    const sph=new THREE.Sphere(new THREE.Vector3((x0+x1)/2,(y0+y1)/2+1,(z0+z1)/2),Math.hypot(x1-x0,y1-y0,z1-z0)/2+4);
    p.root.traverse(ob=>{ if(!ob.isMesh||ob.userData.isOL) return; const g2=new THREE.BufferGeometry(); for(const k of ['position','normal','uv']) if(ob.geometry.attributes[k]) g2.setAttribute(k,ob.geometry.attributes[k]); if(ob.geometry.index) g2.setIndex(ob.geometry.index); g2.boundingSphere=sph.clone();
      const mt=ob.material.clone(); mt.skinning=false; const im=new THREE.InstancedMesh(g2,mt,b.mats.length); b.mats.forEach((M4,i)=>{ m.multiplyMatrices(M4,ob.matrixWorld); im.setMatrixAt(i,m); }); im.instanceMatrix.needsUpdate=true; im.userData.noOL=true; world.add(im); cnt.draws++; }); }
  }catch(e){ console.warn('prison kit',e); } }).catch(e=>console.warn('prison kit',e));
window.__prisonkit={ info:()=>Object.assign({},cnt) };
})();
