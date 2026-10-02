// ===== THE DRAWBRIDGE IN THRONE-ROOM STONE (build 465). Matt: "the exterior all needs to be horizontal stone" -- "I was thinking throne room walls". Every wall face of the map gets
// the throne room's stone panel (throne-panel2.glb), laid in runs: the faces that line up in one straight wall are one run, filled with whole panels at the panel's own shape (stretched a
// little to fit the run, never squashed), rows stacked from the foot of the wall to its top -- so the courses stay level and the blocks long. One instanced mesh for the lot.
// And (Matt, standing on the green: "big white tree that we have from cloister goes where I am standing", square 9, 44): the Cloister's white-and-gold tree, its trunk solid (game.js).
// Test hook: window.__moatstone.
(function(){
'use strict';
window.__moatstone={ info:()=>({ on:false }) };
if(!MAP||MAP.id!=='moat') return;
const P=MAP.padN|0, PH=6, DEPTH=.16, OUT=.04, cnt={ runs:0, panels:0, tree:false };
// ---- the runs: faces sharing a plane and a height, side by side
const groups=new Map(), add=(f,y0,top,kind)=>{ const along=f.nx!==0?f.z:f.x, plane=f.nx!==0?f.x:f.z; const key=f.nx+','+f.nz+','+plane.toFixed(2)+','+y0.toFixed(2)+','+top.toFixed(2);
  (groups.get(key)||groups.set(key,[]).get(key)).push({ f, along, y0, top, kind }); };
for(const f of wallFaces){ const wx=f.cx-f.nx, wz=f.cz-f.nz; const y0=Math.min(0,hgt[idx(f.cx,f.cz)]||0), top=wallTopAt(wx,wz); if(top-y0<1) continue; add(f,y0,top); }   // the map's border walls
// the castle, the ward's curtain walls and the inn are raised ground (game.js h()), not wall squares: every side of a step 3 or more high is wall too (not a stair's)
const STEP=3, rA=(typeof rampA!=='undefined')?rampA:null;
for(let z=0;z<GH;z++) for(let x=0;x<GW;x++){ const i=idx(x,z); if(grid[i]===T.WALL||(rA&&rA[i])) continue; const hc=hgt[i]||0;
  for(let k=0;k<4;k++){ const dx=[1,-1,0,0][k], dz=[0,0,1,-1][k], nx=x+dx, nz=z+dz; if(nx<0||nz<0||nx>=GW||nz>=GH) continue; const j=idx(nx,nz); if(grid[j]===T.WALL||(rA&&rA[j])) continue;
    const hn=hgt[j]||0; if(hn-hc<STEP) continue; add({ x:cw(x)+dx*CELL/2, z:cwz(z)+dz*CELL/2, nx:-dx, nz:-dz, cx:x, cz:z },hc,hn,'step'); } }
// the block over the castle gate (MAP.castle.arches: its faces to the moat and to the yard)
for(const [x0,x1,z0,z1,ay] of ((MAP.castle&&MAP.castle.arches)||[])) for(const sz of [-1,1]) for(let x=x0;x<=x1;x++){ const zf=sz<0?cwz(z0)-CELL/2-.15:cwz(z1)+CELL/2+.15; add({ x:cw(x), z:zf, nx:0, nz:sz, cx:x, cz:sz<0?z0-1:z1+1 },ay,WALLH); }
const runs=[]; for(const list of groups.values()){ list.sort((a,b)=>a.along-b.along); let cur=null;
  for(const r of list){ if(cur&&Math.abs(r.along-cur.b)<CELL*1.01){ cur.b=r.along; cur.n++; } else { cur={ f:r.f, a:r.along, b:r.along, n:1, y0:r.y0, top:r.top, kind:r.kind }; runs.push(cur); } } }
cnt.runs=runs.length;
const mats=[]; const q=new THREE.Quaternion(), up=new THREE.Vector3(0,1,0);
function plan(W){ for(const r of runs){ const f=r.f, len=r.n*CELL, k=Math.max(1,Math.round(len/W)), w=len/k, span=r.top-r.y0, rows=Math.max(1,Math.round(span/PH)), h=span/rows;
    const mid=(r.a+r.b)/2, yaw=Math.atan2(f.nx,f.nz); q.setFromAxisAngle(up,yaw); const tx=f.nz, tz=-f.nx;   // along the wall: z when it faces east/west, x when north/south
    const px=f.nx!==0?f.x:0, pz=f.nx!==0?0:f.z;
    for(let i=0;i<k;i++){ const s=-len/2+w*(i+.5); const cx=f.nx!==0?px:mid+s, cz=f.nx!==0?mid+s:pz;
      for(let j=0;j<rows;j++) mats.push(new THREE.Matrix4().compose(new THREE.Vector3(cx+f.nx*(OUT+DEPTH/2),r.y0+h*j,cz+f.nz*(OUT+DEPTH/2)),q,new THREE.Vector3(w*1.02,h*1.01,DEPTH))); } } }
fetchBytes(ASSET('throne-panel2.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(gltf=>{
  const root=gltf.scene||gltf.scenes[0]; root.updateMatrixWorld(true); toonify(root,1); let mesh=null; root.traverse(o=>{ if(o.isMesh&&!mesh) mesh=o; }); if(!mesh) return;
  const mt=mesh.material=mesh.material.clone(); mt.color.setRGB(2.1,2.0,2.4);   // Meshy's stone is near-black grey: lifted to the castle's own cool purple-grey under this map's night light
  // the panel as a unit block: one wide, one tall from its foot, one deep centred -- each placement scales it to its piece of wall
  const g=mesh.geometry.clone(); g.applyMatrix4(mesh.matrixWorld); g.computeBoundingBox(); const b=g.boundingBox, s=new THREE.Vector3(); b.getSize(s);
  g.translate(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2); g.scale(1/s.x,1/s.y,1/s.z); g.computeVertexNormals();
  plan(PH*s.x/s.y);
  const im=new THREE.InstancedMesh(g,mesh.material,mats.length); mats.forEach((m,i)=>im.setMatrixAt(i,m)); im.instanceMatrix.needsUpdate=true; im.frustumCulled=false; im.userData.noOL=true; world.add(im); cnt.panels=mats.length;
}).catch(e=>console.warn('moat stone',e));
// ---- the castle's own stone (Matt: "do that"): the towers, the block over the gate, the keep, the wall-walk's parapets and merlons, the bridge's rails, the stair rails -- every piece built in the
// castle's purple-grey (mat 0x5a5276, one shared material) -- wears the same throne-room courses, a flat picture of the panel (moat-stone.jpg, baked from throne-panel2.glb) laid on by WHERE the
// surface is in the world, not by the piece's own shape: the courses run level and the same size on a tower, a merlon and a long parapet alike, and line up from one piece to the next.
{ const TW=PH*.761, TH=PH; const tex=new THREE.TextureLoader().load(ASSET('moat-stone.jpg')); tex.wrapS=tex.wrapT=THREE.MirroredRepeatWrapping; tex.encoding=THREE.sRGBEncoding; tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  // keepTops: a walking surface stays its own colour (the bridge's steps, the deck's paving): only its sides take the stone
  const stoneify=(m,keepTops)=>{ const o=m.color.clone(), T=[1.55,1.45,1.8]; m.map=tex; m.color.setRGB(T[0],T[1],T[2]); m.needsUpdate=true;
    const top=keepTops?'if(an.y>.7) texelColor=vec4('+(o.r/T[0]).toFixed(4)+','+(o.g/T[1]).toFixed(4)+','+(o.b/T[2]).toFixed(4)+',1.0);':'';
    m.onBeforeCompile=sh=>{ sh.vertexShader='varying vec3 vSWP; varying vec3 vSWN;\n'+sh.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
  vec4 swp=vec4(transformed,1.0); vec3 swn=objectNormal;
  #ifdef USE_INSTANCING
  swp=instanceMatrix*swp; swn=mat3(instanceMatrix)*swn;
  #endif
  vSWP=(modelMatrix*swp).xyz; vSWN=normalize(mat3(modelMatrix)*swn);`);
      sh.fragmentShader='varying vec3 vSWP; varying vec3 vSWN;\n'+sh.fragmentShader.replace('#include <map_fragment>',`vec3 an=abs(vSWN); vec2 suv=an.y>.7?vSWP.xz:(an.x>an.z?vSWP.zy:vSWP.xy);
  vec4 texelColor=texture2D(map,suv/vec2(${TW.toFixed(3)},${TH.toFixed(3)})); texelColor=mapTexelToLinear(texelColor); ${top} diffuseColor*=texelColor;`); }; };
  stoneify(mat(0x5a5276),false); stoneify(mat(0x6a6080),true); cnt.castleStone=true; }
// ---- sconces (Matt: "a few sconces scattered about the exterior and inside walls of the large walls surrounding the whole thing"): the throne room's sconce, lit, on both faces of the castle's
// curtain walls -- the raised walls, outside and in -- one every 12 or so along each long stretch, at a hand's height over the ground at its foot
const SC_GAP=12; cnt.sconces=0;
fetchBytes(ASSET('throne-sconce.glb'),'later').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(gltf=>{
  const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,1.5); toonify(root,fit.scale); const w=fit.wrap;
  w.traverse(o=>{ const m=o.isMesh&&o.material; if(!m) return; m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(.32,.16,.05);'); }; });
  for(const r of runs){ if(r.kind!=='step') continue; const foot=Math.max(0,r.y0); if(r.top-foot<8) continue; const len=r.n*CELL; if(len<SC_GAP*.75) continue;
    const k=Math.max(1,Math.floor(len/SC_GAP)), f=r.f, mid=(r.a+r.b)/2, yaw=Math.atan2(f.nx,f.nz);
    for(let i=0;i<k;i++){ const s=-len/2+len*(i+.5)/k; const x=f.nx!==0?f.x:mid+s, z=f.nx!==0?mid+s:f.z;
      const t=w.clone(); t.position.set(x+f.nx*(OUT+DEPTH+.05),foot+3.2,z+f.nz*(OUT+DEPTH+.05)); t.rotation.y=yaw; world.add(t);
      const g=glow(0xffa040,3.2,.75); g.position.set(x+f.nx*.9,foot+4.3,z+f.nz*.9); world.add(g); cnt.sconces++; } }
}).catch(e=>console.warn('moat sconce',e));
// ---- the road to the drawbridge (Matt: "you can put the lighter one in, it just goes on the road to the drawbridge"): his castle road tile -- cobbles between two banks of gold rock --
// as a flat picture (castle-road.jpg, baked from the light 2k model: the same look as the heavy one), one tile the road's full width every road-width along it, from the south gate to the bridge's foot
const ROAD=MAP.castleRoad; if(ROAD){ const [x0,x1,z0,z1]=ROAD, W=(x1-x0+1)*CELL, L=(z1-z0+1)*CELL, X=(cw(x0)+cw(x1))/2, Z=(cwz(z0+P)+cwz(z1+P))/2;
  const tex=new THREE.TextureLoader().load(ASSET('castle-road.jpg')); tex.wrapS=THREE.ClampToEdgeWrapping; tex.wrapT=THREE.MirroredRepeatWrapping; tex.repeat.set(1,Math.max(1,Math.round(L/W))); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const road=new THREE.Mesh(new THREE.PlaneGeometry(W,L),new THREE.MeshToonMaterial({map:tex,gradientMap:GRAD,color:C(0xffffff),polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  road.rotation.x=-Math.PI/2; road.position.set(X,(hgt[idx(x0,z0+P)]||0)+.03,Z); road.userData.noOL=true; world.add(road); cnt.road=true; }
// ---- the bridge-foot statues (Matt: "this just finished, it should replace the two statues out in front by the bridge"): his black chess knight (moat-knight.glb) stands on each plinth where the
// stone gnome king stood, looking out over the green at whatever comes up the road
{ const kings=(world.userData.statueKings||[]).slice(); if(kings.length){ kings.forEach(k=>{ k.visible=false; });   /* the king hides at once; his plinth when the knight arrives */
  fetchBytes(ASSET('moat-knight.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(gltf=>{
    const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,4.8); toonify(root,fit.scale); const w=fit.wrap;
    for(const k of kings){ const g=k.parent; g.children.forEach(c=>{ c.visible=false; }); const t=w.clone(); t.position.set(0,0,0); t.rotation.y=PI/2; g.add(t);   /* build 470 (Matt: "both are faced west, can you turn them to face south"): the model looks west as made; a quarter turn faces it down the road */ cnt.knights=(cnt.knights|0)+1; } }).catch(e=>{ console.warn('moat knight',e); kings.forEach(k=>{ k.visible=true; }); }); } }   // the knight brings its own carved pedestal: the old plinth goes too
// ---- the Cloister's white tree on the green (its trunk cells are solid: game.js)
const TREE=MAP.whiteTree; if(TREE){ fetchBytes(ASSET('court-tree.glb'),'later').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(gltf=>{
    const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,TREE[2]||21); toonify(root,fit.scale); const t=fit.wrap; const x=(cw(TREE[0])+cw(TREE[0]+1))/2, z=(cwz(TREE[1]+P)+cwz(TREE[1]+P+1))/2;
    t.position.set(x,hgt[idx(TREE[0],TREE[1]+P)]||0,z); t.rotation.y=Math.atan2(0-x,0-z); world.add(t); cnt.tree=true; }).catch(e=>console.warn('moat tree',e)); }
window.__moatstone={ info:()=>Object.assign({ on:true },cnt), runs:()=>runs.map(r=>({ n:r.n, nx:r.f.nx, nz:r.f.nz, cell:[r.f.cx,r.f.cz-P], y0:r.y0, top:r.top })) };
})();
