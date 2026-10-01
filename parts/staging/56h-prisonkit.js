// ===== THE DEEP PRISON, PAPERED IN ITS REAL 3D KIT (builds 350-351). Matt: "this whole place needs to be those kinds of walls, not the destructible ones. the cells and the walls the greenish ones" (350), then, looking at the big
// busted cell at a breakout gate: "see this panal of the broken cell all that size all that style", and of the first attempt (a grid of small cells): "this need to be reimagined or reingineered" (351). So: every wall face in the
// cavern is built from his own Meshy pieces instead of a painted picture -- the mossy GREENISH WALL (dungeon-wall) and the BUSTED CELL (dungeon-cell-busted) -- and every cell is now that BIG: the same size and style as the
// ones at the gates (2.6 times the raw model: five tall, nearly five wide), set in the wall as a proper panel. Along a wall it runs cell, wall, wall (one cell every third face, so the big ones have stone around them); up a
// cell column it runs cell, stone band, cell, stone band, cell -- floors of cells -- all the way to the ceiling; the wall columns are the greenish wall stacked to the ceiling in double-size slabs. The pieces are real
// instanced geometry, grouped in chunks with their own bounding spheres so the ones out of view are not drawn. The two pieces are also rendered once each into the wall's texture (whatever the real pieces do not cover shows
// them flat). The destructible walls (Bob's and the Meshy cracked one) are NOT part of this: they stay their own brown-gold selves, in their arches. Skipped: the breakable walls' openings, the four busted-cell gates, the
// four animated cells (56f).
// Only MAP.id==='prison'. Test hook: window.__prisonkit.
(function(){
window.__prisonkit={info:()=>null};
if(!MAP||MAP.id!=='prison') return;
const FRONT=.3, CHUNK=16, CELL_SCALE=3.1, SLAB=2;   // how far the front of a piece stands out of the wall plane; chunk size in world units; a cell's size against one wall segment; the wall slab's size
const cnt={ modules:0, draws:0, baked:0, cellCols:0, wallCols:0, types:0, cells:0, nested:0, interior:0, holes:0, portal:0 };
const load=name=>fetchBytes(ASSET(name),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',gl=>{ try{ const root=gl.scene||gl.scenes[0]; toonify(root,1); res(root); }catch(e){ rej(e); } },rej)));
// a model's front (+z) rendered flat, square, with no light, into a 256px canvas: that piece's picture for the wall's texture
function bakeModel(renderer0,root){ const size=256, rt=new THREE.WebGLRenderTarget(size,size,{ minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter }); rt.texture.encoding=THREE.sRGBEncoding;
  const sc=new THREE.Scene(); sc.background=new THREE.Color(0x10140e); const cl=root.clone(true); cl.traverse(o=>{ if(!o.isMesh) return; if(o.userData.isOL){ o.visible=false; return; } o.material=new THREE.MeshBasicMaterial({ map:o.material.map, color:o.material.map?0xffffff:o.material.color, skinning:!!o.isSkinnedMesh, side:THREE.DoubleSide }); });
  cl.updateMatrixWorld(true); const bx=new THREE.Box3().setFromObject(cl), ct=bx.getCenter(new THREE.Vector3()), sz=bx.getSize(new THREE.Vector3()); cl.position.sub(ct); sc.add(cl);
  const hw=Math.max(sz.x,sz.y)/2*1.02, cam=new THREE.OrthographicCamera(-hw,hw,hw,-hw,.1,20); cam.position.set(0,0,5); cam.lookAt(0,0,0);
  const keep=renderer0.getRenderTarget(); renderer0.setRenderTarget(rt); renderer0.clear(); renderer0.render(sc,cam); const px=new Uint8Array(size*size*4); renderer0.readRenderTargetPixels(rt,0,0,size,size,px); renderer0.setRenderTarget(keep); rt.dispose();
  const c=document.createElement('canvas'); c.width=c.height=size; const g=c.getContext('2d'), id=g.createImageData(size,size); for(let y=0;y<size;y++) id.data.set(px.subarray((size-1-y)*size*4,(size-y)*size*4),y*size*4); g.putImageData(id,0,0); return c; }
// Bob's cell-interior picture (a vaulted stone cell with a torch niche, chains and straw), one flat backdrop standing in the cell's doorway -- just in front of the wall's own (dark) face, behind the frame's lip and the bars: the model's real cavity is buried inside the wall, so the doorway shows the wall face, and that is what was black
const interiorTex=new Promise(res=>new THREE.TextureLoader().load(ASSET('prison-cell-interior.jpg'),res,undefined,()=>res(null)));
Promise.all([load('prison-wall.glb'),load('prison-cell-busted.glb'),interiorTex,load('prison-cell-arms-static.glb'),load('prison-cell-tentacle.glb'),load('prison-cell-arm.glb'),load('prison-cell-intact.glb')]).then(([wall,busted,interior,arms,tent,hairy,intact])=>{ try{
  if(interior){ interior.encoding=THREE.sRGBEncoding; interior.anisotropy=4; const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.36,2.0),new THREE.MeshBasicMaterial({ map:interior, color:0xeeeeee })); pl.position.set(0,0,-.56); pl.userData.noOL=true; pl.name='cellinterior'; busted.add(pl); cnt.interior=1; }
  const cellWall=world.userData.cellWall; if(!cellWall||!cellWall.material.map||!cellWall.material.map.image) throw new Error('no wall texture');
  // ---- the texture's tiles: 1 is the greenish wall; every other tile is DARK -- the wall behind a cell's bars is just dark stone (Matt: "dark in those rooms ... take those out": the small copies of cell fronts that showed through the bars are gone; his interior art piece goes here later)
  const dst=cellWall.material.map.image.getContext('2d'), cWall=bakeModel(renderer,wall); [0,2,3,4].forEach(t=>{ dst.fillStyle='#07090a'; dst.fillRect(t*256,0,256,256); dst.globalAlpha=.25; dst.fillStyle='#10140f'; for(let r=0;r<4;r++) for(let b=0;b<2;b++) dst.fillRect(t*256+b*128+(r%2)*64+4,r*64+4,120,56); dst.globalAlpha=1; }); dst.drawImage(cWall,256,0);
  cellWall.material.map.needsUpdate=true; cnt.baked=5;
  // ---- the real pieces
  const tiles=world.userData.faceTile||[], alc=world.userData.alcoveFaces||new Set(), lanes=Object.values(LANES);
  const nearLane=f=>lanes.some(l=>Math.max(Math.abs(f.cx-l.cx),Math.abs(f.cz-l.cz))<=1), rigs=new Set([[7,31],[39,31],[14,45],[32,45]].map(p=>p.join(',')));
  const prep=root=>{ root.updateMatrixWorld(true); const box=new THREE.Box3().setFromObject(root), sz=box.getSize(new THREE.Vector3()), c=box.getCenter(new THREE.Vector3()), s=2/sz.y; return { root, s, zmax:box.max.z, depth:sz.z*s, w:sz.x*s, off:new THREE.Matrix4().makeTranslation(-c.x,-box.min.y,-c.z) }; };
  // where each cell's stone FRAME front sits inside its model (raw z, measured: the models differ -- the reaching arms, the tentacles and the hairy arm stand proud of their frames): the frame is set just out of the wall (a lip of .3) and whatever reaches beyond it reaches out into the room
  const ZF={ busted:.45, arms:.30, tent:.20, hairy:.05 }, frontOf=(kind,k)=>kind==='intact'?(P.intact.zmax-.80)*P.intact.s*k:(ZF[kind]===undefined?FRONT+.25:(P[kind].zmax-ZF[kind])*P[kind].s*k+.3);
  // build 366 (Matt, of the closed cells: "just need to make the back ground black cuz they are just blending in"): the model is OPEN behind its bars (a front slab with no back), so the bars stood over the wall's own dark-but-lit stone and
  // the cells melted into it. A flat BLACK arch (unlit) is added to the model just in front of the wall's face (the model's own z .805; its bars are .8-.87, the frame's front .87-.95), and the cell is set so that the wall face always falls at z .80 whatever the cell's size (frontOf below): the black shows through the gaps of the bars, the stone frame hides its edges. It is part of the model, so it is instanced with it
  { const sh=new THREE.Shape(); sh.moveTo(-.4,-.68); sh.lineTo(.4,-.68); sh.lineTo(.4,.2); sh.absarc(0,.2,.4,0,PI,false); sh.lineTo(-.4,-.68); const bm=new THREE.Mesh(new THREE.ShapeGeometry(sh,16),new THREE.MeshBasicMaterial({ color:0x000000, side:THREE.DoubleSide })); bm.position.z=.805; bm.userData.noOL=true; bm.name='cellblack'; intact.add(bm); cnt.blackBacks=1; }
  const P={ wall:prep(wall), busted:prep(busted), arms:prep(arms), tent:prep(tent), hairy:prep(hairy), intact:prep(intact) }; cnt.types=Object.keys(P).length;
  // build 364 (Bob's thick-bars cell, 7,800 triangles): the UNBROKEN cell Matt asked for -- a closed arched door of chunky bars, a chain and a padlock, in a mossy frame. Its front is flat (the frame's front is the model's front: ZF = its zmax) and it has no doorway hole: the bars stand over the dark wall behind them
  ZF.intact=P.intact.zmax;
  // which cell goes where: the cell of reaching arms and the tentacle cell twice as often as the busted and hairy-arm ones, picked by the cell's place so a wall never repeats one in a row (the busted one was too many)
  const MIX=['intact','arms','intact','tent','intact','busted','intact','arms','tent','hairy']; const pick=(f,level)=>{ let h=(Math.imul(f.cx+101,73856093)^Math.imul(f.cz+211,19349663)^Math.imul(f.nx+2,83492791)^Math.imul(f.nz+5,40503277)^Math.imul(level+7,2654435761))>>>0; h=Math.imul(h^(h>>>15),2246822519)>>>0; h=Math.imul(h^(h>>>13),3266489917)>>>0; h=(h^(h>>>16))>>>0; return MIX[h%MIX.length]; };
  // the doorway of each cell is a hole in the wall face. Each cell kind's opening, as fractions of its model: half the width (of the box), and the height from its floor (the frames are arched or square, so it is kept inside them)
  const OPEN={ busted:{ fx:.66, y0:.05, y1:.84 }, arms:{ fx:.70, y0:.11, y1:.84 }, tent:{ fx:.62, y0:.08, y1:.72 }, hairy:{ fx:.80, y0:.09, y1:.89 } }; const maskPos=[];
  const addMask=pc=>{ const O=OPEN[pc.kind]; if(!O) return; const p=P[pc.kind], hw=O.fx*(p.w/2)*pc.k, y0=pc.y+O.y0*2*pc.k, y1=pc.y+O.y1*2*pc.k, f=pc.f, tx=f.nz, tz=-f.nx, x=f.x+f.nx*.02, z=f.z+f.nz*.02;
    const a=[x-tx*hw,y0,z-tz*hw], b=[x+tx*hw,y0,z+tz*hw], c=[x+tx*hw,y1,z+tz*hw], d=[x-tx*hw,y1,z-tz*hw]; maskPos.push(...a,...b,...c,...a,...c,...d); cnt.holes++; };
  const buckets=new Map();   // model + chunk -> matrices
  const up=new THREE.Vector3(0,1,0), Q=new THREE.Quaternion(), V=new THREE.Vector3(), Sc=new THREE.Vector3(), CEIL=WALLH-.3;
  const list=[], add=(kind,f,y,k,fr)=>list.push({ kind, f, y, k, fr });
  const put=(kind,f,y,k,fr)=>{ const p=P[kind]; Q.setFromAxisAngle(up,Math.atan2(f.nx,f.nz)); Sc.set(p.s*k,p.s*k,p.s*k); V.set(f.x+f.nx*(fr-p.depth*k/2),y,f.z+f.nz*(fr-p.depth*k/2));
    const key=kind+'|'+Math.floor(f.x/CHUNK)+'|'+Math.floor(f.z/CHUNK); let b=buckets.get(key); if(!b){ b={ kind, mats:[], pts:[] }; buckets.set(key,b); } b.mats.push(new THREE.Matrix4().compose(V,Q,Sc).multiply(p.off)); b.pts.push(V.x,V.y,V.z); cnt.modules++; };
  // ---- the layout, along RUNS. Every wall face lies on a straight line (same wall, same floor): the faces of one line that touch are a run. Along a run, three faces at a time: two CELL columns, then a plain WALL column,
  // repeated (what does not fill three at a run's end is wall). A cell is fitted to its three faces exactly (six wide), so a cell row has nothing left beside it; between its floors run stone bands; a wall column is double
  // slabs (four wide, centred between two faces) stacked to the ceiling, a single odd face single slabs. The gates' faces and the breakable rooms' are left out on purpose; the four animated cells sit in front of plain wall.
  const skipF=(f,q)=>alc.has(q)||nearLane(f);
  const lines=new Map(); wallFaces.forEach((f,q)=>{ if(skipF(f,q)) return; const a=f.nz!==0?f.cx:f.cz, y0=hgt[idx(f.cx,f.cz)]||0, key=(f.nz!==0?'z'+f.cz+'n'+f.nz:'x'+f.cx+'n'+f.nx)+'y'+y0; let L=lines.get(key); if(!L){ L=[]; lines.set(key,L); } L.push({ f, q, a, y0 }); });
  const runs=[]; for(const L of lines.values()){ L.sort((p,q)=>p.a-q.a); let run=[L[0]]; for(let i=1;i<L.length;i++){ if(L[i].a===L[i-1].a+1) run.push(L[i]); else { runs.push(run); run=[L[i]]; } } runs.push(run); }
  const mid=(e1,e2)=>({ x:(e1.f.x+e2.f.x)/2, z:(e1.f.z+e2.f.z)/2, nx:e1.f.nx, nz:e1.f.nz, cx:e1.f.cx, cz:e1.f.cz });
  // stacked plain wall over some faces from height y up to the ceiling: pairs take double slabs, a lone face single ones, and what is left under a slab's height is made up in single rows
  const stack=(ents,y,tag)=>{ const faces=[]; let i=0; for(;i+1<ents.length;i+=2){ faces.push({ pair:true, e1:ents[i], e2:ents[i+1] }); } if(i<ents.length) faces.push({ pair:false, e1:ents[i] });
    for(const F of faces){ let yy=y; if(F.pair){ const pf=mid(F.e1,F.e2); while(yy+2*SLAB<=CEIL){ add('wall',pf,yy,SLAB,FRONT+.03*(F.e1.q%3)); yy+=2*SLAB; } while(yy+2<=CEIL){ add('wall',F.e1.f,yy,1,FRONT); add('wall',F.e2.f,yy,1,FRONT); yy+=2; } }
      else { while(yy+2<=CEIL){ add('wall',F.e1.f,yy,1,FRONT); yy+=2; } } } cnt.wallCols++; };
  const cellColumn=(ents,y0)=>{ const len=ents.length, f=len===3?ents[1].f:mid(ents[0],ents[1]); let y=y0, level=0; for(;;){ const kind=pick(ents[0].f,level), k=len*2/P[kind].w, h=2*k; if(y+h>CEIL) break; level++; add(kind,f,y,k,frontOf(kind,k)); cnt.cells++; cnt['k_'+kind]=(cnt['k_'+kind]||0)+1; y+=h;
      if(y+2>CEIL) break; for(const e of ents) add('wall',e.f,y,1,FRONT); y+=2; } if(y+2<=CEIL) stack(ents,y); cnt.cellCols++; };
  let gi=0; for(const run of runs){ const n=run.length, m=Math.floor(n/3), r=n%3, sizes=[]; if(n===1) sizes.push(1); else if(r===0) for(let j=0;j<m;j++) sizes.push(3); else if(r===2){ for(let j=0;j<m;j++) sizes.push(3); sizes.push(2); } else { for(let j=0;j<m-1;j++) sizes.push(3); sizes.push(2,2); }
    const blocks=[]; let st0=0; for(const z of sizes){ blocks.push([st0,z,z>1&&(gi++%3)!==2]); st0+=z; }
    for(const [st,len,isCell] of blocks){ const ents=run.slice(st,st+len), y0=ents[0].y0; if(isCell&&!ents.some(e=>rigs.has(e.f.cx+','+e.f.cz))) cellColumn(ents,y0); else stack(ents,y0); } }
  // nothing nested: a piece lying wholly inside a bigger one on the same wall is a copy nobody can see -- out it goes
  { const groups=new Map(); for(const pc of list){ const f=pc.f, along=f.nz!==0?f.x:f.z, plane=(f.nz!==0?'z'+f.z+'n'+f.nz:'x'+f.x+'n'+f.nx); pc.lo=along-P[pc.kind].w*pc.k/2; pc.hi=along+P[pc.kind].w*pc.k/2; pc.b0=pc.y; pc.b1=pc.y+2*pc.k; const key=plane; if(!groups.has(key)) groups.set(key,[]); groups.get(key).push(pc); }
    const EPS=.06; for(const g of groups.values()){ g.sort((a,b)=>(b.hi-b.lo)*(b.b1-b.b0)-(a.hi-a.lo)*(a.b1-a.b0)); const kept=[]; for(const pc of g){ if(kept.some(k=>pc.lo>=k.lo-EPS&&pc.hi<=k.hi+EPS&&pc.b0>=k.b0-EPS&&pc.b1<=k.b1+EPS)){ cnt.nested++; continue; } kept.push(pc); put(pc.kind,pc.f,pc.y,pc.k,pc.fr); if(pc.kind!=='wall') addMask(pc); } } }
  // the stencil portal: the holes are drawn first, into the stencil buffer only (no colour, no depth); the wall face then skips every pixel they marked, so the cell's own cavity shows through
  try{ if(maskPos.length&&renderer.getContext().getContextAttributes().stencil){ const mg=new THREE.BufferGeometry(); mg.setAttribute('position',new THREE.Float32BufferAttribute(maskPos,3));
      const mm=new THREE.MeshBasicMaterial({ colorWrite:false, depthWrite:false, depthTest:false, side:THREE.DoubleSide, stencilWrite:true, stencilRef:1, stencilFunc:THREE.AlwaysStencilFunc, stencilZPass:THREE.ReplaceStencilOp, stencilFail:THREE.ReplaceStencilOp, stencilZFail:THREE.ReplaceStencilOp });
      const mk=new THREE.Mesh(mg,mm); mk.renderOrder=-100; mk.frustumCulled=false; mk.userData.noOL=true; world.add(mk); const wm=cellWall.material; wm.stencilWrite=true; wm.stencilRef=1; wm.stencilFunc=THREE.NotEqualStencilFunc; wm.stencilFail=THREE.KeepStencilOp; wm.stencilZFail=THREE.KeepStencilOp; wm.stencilZPass=THREE.KeepStencilOp; wm.needsUpdate=true; cnt.portal=1; } }catch(er){ console.warn('prison kit portal',er); }
  const m=new THREE.Matrix4();
  for(const b of buckets.values()){ const p=P[b.kind]; let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,z0=1e9,z1=-1e9; for(let i=0;i<b.pts.length;i+=3){ x0=Math.min(x0,b.pts[i]); x1=Math.max(x1,b.pts[i]); y0=Math.min(y0,b.pts[i+1]); y1=Math.max(y1,b.pts[i+1]); z0=Math.min(z0,b.pts[i+2]); z1=Math.max(z1,b.pts[i+2]); }
    const sph=new THREE.Sphere(new THREE.Vector3((x0+x1)/2,(y0+y1)/2+3,(z0+z1)/2),Math.hypot(x1-x0,y1-y0,z1-z0)/2+8);
    p.root.traverse(ob=>{ if(!ob.isMesh||ob.userData.isOL) return; const g2=new THREE.BufferGeometry(); for(const k of ['position','normal','uv']) if(ob.geometry.attributes[k]) g2.setAttribute(k,ob.geometry.attributes[k]); if(ob.geometry.index) g2.setIndex(ob.geometry.index); g2.boundingSphere=sph.clone();
      const mt=ob.material.clone(); mt.skinning=false; const im=new THREE.InstancedMesh(g2,mt,b.mats.length); b.mats.forEach((M4,i)=>{ m.multiplyMatrices(M4,ob.matrixWorld); im.setMatrixAt(i,m); }); im.instanceMatrix.needsUpdate=true; im.userData.noOL=true; world.add(im); cnt.draws++; }); }
  }catch(e){ console.warn('prison kit',e); } }).catch(e=>console.warn('prison kit',e));
window.__prisonkit={ info:()=>Object.assign({},cnt) };
})();
