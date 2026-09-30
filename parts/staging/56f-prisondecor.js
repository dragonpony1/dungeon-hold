// ===== THE DEEP PRISON, DRESSED (build 342). Matt: a cavern of cells falling away to the Heartroot -- "floors of cells above you", damp and cold, big pipes following the terraces down, cells busted open where the horde
// breaks out, "a top down flow, a big room and you can see them coming down flights all around". Kept LIGHT (he asked): the cells up the wall are PAINTED onto the wall texture (rows of barred doors, bricked-up
// ones, open ones, a pair of eyes in one, every two units of height -- a floor of cells each), so the whole rim wall costs no triangles; the real art is only where you look at it close: a busted cell (his Meshy
// model, 0.4 MB) at each of the four breakouts, and four of Bob's rigged cells (a clawing hairy arm, a writhing tentacle) up the wall, looping. Pipes are one instanced cylinder mesh along each terrace edge.
// Only MAP.id==='prison'. Test hook: window.__prisondecor.
(function(){
window.__prisondecor={info:()=>null};
if(!MAP||MAP.id!=='prison') return;
const counts={}; const bump=k=>{ counts[k]=(counts[k]||0)+1; };
const PROTO={};
function protoOf(name,size){ const key=name+'|'+size; return PROTO[key]||(PROTO[key]=fetchBytes(ASSET(name),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',gl=>{ try{
    const root=gl.scene||gl.scenes[0]; const fit=fitModel(root,size); toonify(root,fit.scale); fit.wrap.userData.clips=gl.animations||[]; res(fit.wrap); }catch(e){ rej(e); } },rej)))); }
const use=(name,size,cb)=>protoOf(name,size).then(p=>cb(p)).catch(e=>console.warn('prison decor '+name,e));
const PLAIN_ROWS=9;   // the wall faces of the apex's first rows -- behind the Heartroot and down its two sides -- are plain prison wall, no cells (Matt)
const CX=23, WIDEN=1, HW=z=>Math.min(20+WIDEN,Math.ceil((z-1)/2)+WIDEN);   // the triangle's half-width at row z (the same rule the map is built by)
// ---------------- THE RIM WALL: rows of cells, painted (four different doors, repeated every four cells along the wall)
function paintCells(){ const W=1280,H=256, c=cv(W,H), g=c.getContext('2d'); g.fillStyle='#0d110c'; g.fillRect(0,0,W,H);
  for(let k=0;k<4;k++){ const X=k*256; g.save(); g.beginPath(); g.rect(X,0,256,256); g.clip();
    for(let r=0;r<4;r++){ const y0=r*64, off=((r+k)%2)*64; for(let b=-1;b<3;b++){ const x0=X+b*128+off; const L=R(22,33), Hh=R(85,135), SA=R(9,17);
        g.fillStyle=hsl(Hh,SA,L); g.fillRect(x0+3,y0+3,122,58); g.globalAlpha=.4; g.fillStyle=hsl(Hh,SA+4,L+14); g.fillRect(x0+3,y0+3,122,4); g.globalAlpha=.45; g.fillStyle='#070a06'; g.fillRect(x0+3,y0+56,122,5); g.globalAlpha=1;
        for(let i=0;i<9;i++) splat(g,x0+6+rnd()*116,y0+6+rnd()*52,R(2,8),rnd()<.5?hsl(Hh,14,L-10):hsl(R(78,100),30,L+8),.22); } }
    // the cell door: an arched recess, black inside, a stone surround
    const cx=X+128; const arch=()=>{ g.beginPath(); g.moveTo(X+50,238); g.lineTo(X+50,112); g.arc(cx,112,78,Math.PI,0); g.lineTo(X+206,238); g.closePath(); };
    arch(); g.fillStyle='#040504'; g.fill(); g.lineWidth=11; g.strokeStyle='#323a2c'; g.stroke(); g.lineWidth=3; g.strokeStyle='#161b13'; g.stroke();
    if(k===0||k===1){ g.strokeStyle='#6a4426'; g.lineWidth=6; for(let bx=X+66;bx<X+200;bx+=22){ g.beginPath(); g.moveTo(bx,46); g.lineTo(bx,238); g.stroke(); } g.lineWidth=7; for(const by of [120,196]){ g.beginPath(); g.moveTo(X+52,by); g.lineTo(X+204,by); g.stroke(); }
      g.globalAlpha=.5; g.strokeStyle='#a66a34'; g.lineWidth=2; for(let bx=X+64;bx<X+200;bx+=22){ g.beginPath(); g.moveTo(bx,50); g.lineTo(bx,236); g.stroke(); } g.globalAlpha=1; }
    if(k===1){ for(const ex of [-17,17]){ const gr=g.createRadialGradient(cx+ex,158,0,cx+ex,158,14); gr.addColorStop(0,'rgba(255,236,120,1)'); gr.addColorStop(.35,'rgba(255,210,70,.9)'); gr.addColorStop(1,'rgba(255,200,60,0)'); g.fillStyle=gr; g.fillRect(cx+ex-14,144,28,28); } }   // something is watching from this one
    if(k===2){ g.save(); arch(); g.clip(); for(let r=0;r<4;r++){ const y0=150+r*24, off=(r%2)*28; for(let b=-1;b<5;b++){ const x0=X+46+b*56+off; g.fillStyle=hsl(R(85,125),12,R(24,32)); g.fillRect(x0+2,y0+2,52,20); g.fillStyle='#070a06'; g.fillRect(x0+2,y0+19,52,4); } } g.restore(); }   // bricked up
    if(k===3){ g.strokeStyle='#44483e'; g.lineWidth=4; g.beginPath(); g.moveTo(cx-44,60); g.lineTo(cx-44,120); g.stroke(); g.beginPath(); g.arc(cx-44,128,8,0,Math.PI*2); g.stroke(); g.beginPath(); g.moveTo(cx+38,60); g.lineTo(cx+38,150); g.stroke(); g.beginPath(); g.arc(cx+38,158,8,0,Math.PI*2); g.stroke();
      const gr=g.createRadialGradient(cx,238,0,cx,238,90); gr.addColorStop(0,'rgba(80,190,100,.45)'); gr.addColorStop(1,'rgba(80,190,100,0)'); g.fillStyle=gr; g.fillRect(X+40,150,176,100); }   // an open door, chains, a green seep from the sewer
    // the ledge every floor stands on, and the damp running down from it
    g.fillStyle='#2e3629'; g.fillRect(X,238,256,18); g.globalAlpha=.5; g.fillStyle='#6a7a58'; g.fillRect(X,238,256,3); g.globalAlpha=.6; g.fillStyle='#050704'; g.fillRect(X,253,256,3); g.globalAlpha=1;
    g.globalAlpha=.22; for(let i=0;i<7;i++){ const dx=X+8+rnd()*240; g.fillStyle=i%2?'#3a6a3a':'#1a2a1e'; g.fillRect(dx,rnd()*60,R(2,5),R(40,150)); } g.globalAlpha=1; g.restore(); }
  { const X=1024; g.save(); g.beginPath(); g.rect(X,0,256,256); g.clip();   // tile 5: the plain prison wall behind the Heartroot
    for(let r=0;r<4;r++){ const y0=r*64, off=(r%2)*64; for(let b=-1;b<3;b++){ const x0=X+b*128+off; const L=R(24,36), Hh=R(85,135), SA=R(9,17);
        g.fillStyle=hsl(Hh,SA,L); g.fillRect(x0+3,y0+3,122,58); g.globalAlpha=.4; g.fillStyle=hsl(Hh,SA+4,L+14); g.fillRect(x0+3,y0+3,122,4); g.globalAlpha=.45; g.fillStyle='#070a06'; g.fillRect(x0+3,y0+56,122,5); g.globalAlpha=1;
        for(let i=0;i<10;i++) splat(g,x0+6+rnd()*116,y0+6+rnd()*52,R(2,9),rnd()<.5?hsl(Hh,14,L-10):hsl(R(78,100),32,L+9),.24); } }
    g.strokeStyle='#44483e'; g.lineWidth=4; for(const [sx,sy,len] of [[70,0,96],[182,0,132]]){ g.beginPath(); g.moveTo(X+sx,sy); g.lineTo(X+sx,sy+len); g.stroke(); g.beginPath(); g.arc(X+sx,sy+len+9,9,0,Math.PI*2); g.stroke(); g.lineWidth=3; g.beginPath(); g.arc(X+sx,sy+len+9,4,0,Math.PI*2); g.stroke(); g.lineWidth=4; }   // shackles on chains
    g.globalAlpha=.22; for(let i=0;i<9;i++){ const dx=X+6+rnd()*244; g.fillStyle=i%2?'#3a6a3a':'#1a2a1e'; g.fillRect(dx,rnd()*50,R(2,6),R(50,170)); } g.globalAlpha=1; g.restore(); }
  for(let i=0;i<2600;i++) splat(g,rnd()*W,rnd()*H,R(1,5),rnd()<.5?'#000':'#fff',.04);
  const tex=new THREE.CanvasTexture(c); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.encoding=THREE.sRGBEncoding; tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy()); return tex; }
{ const walls=world.children.find(o=>o.isMesh&&o.material&&o.material.map===WALLTEX);
  if(walls){ const uv=walls.geometry.attributes.uv; let plain=0; const tiles=[]; for(let q=0;q<wallFaces.length;q++){ const fc=wallFaces[q]; const pp=((Math.round(uv.getX(4*q))%3)+3)%3; let t=pp===0?0:1; if(fc.cz<=PLAIN_ROWS){ t=1; plain++; } tiles[q]=t; for(let k=0;k<4;k++) uv.setX(4*q+k,(t+(k<2?0:1))/5); } world.userData.faceTile=tiles; uv.needsUpdate=true; counts.plainFaces=plain; world.userData.plainRows=PLAIN_ROWS; walls.material.map=paintCells(); walls.material.needsUpdate=true; counts.paintedWall=1; world.userData.cellWall=walls; } }
// the terraces' drops: damp grey-green stone instead of the plain purple-brown
{ const cliff=world.children.find(o=>o.isMesh&&o.material&&o.material.isMeshToonMaterial&&!o.material.map&&o.material.side===THREE.DoubleSide&&o.geometry.attributes.normal&&!o.geometry.attributes.uv&&o.geometry.index);
  if(cliff){ cliff.material=cliff.material.clone(); cliff.material.color.setHex(0x3c4a3c); counts.cliff=1; } }
// ---------------- the gates: the generic violet archways come down, the broken cells go up
(typeof portals!=='undefined'?portals:[]).forEach(p=>{ p.g.visible=false; });
use('prison-cell-busted.glb',5.2,p=>{ for(const L of Object.values(LANES)){ const nx=Math.sin(L.face), nz=Math.cos(L.face), D=3.1, y=hgt[idx(L.cx,L.cz)]||0;
    const t=p.clone(); t.position.set(cw(L.cx)+nx*(CELL/2-D/2),y,cwz(L.cz)+nz*(CELL/2-D/2)); t.rotation.y=L.face; world.add(t); bump('bustedCell'); } });
// ---------------- Bob's rigged cells up the wall, looping: [model, floor cell, which way its wall faces (toward the floor), how many floors up the wall]
const CELLS=[['prison-cell-tentacle.glb',7,31,1,0,1],['prison-cell-arm.glb',39,31,-1,0,1],['prison-cell-arm.glb',14,45,0,-1,1],['prison-cell-tentacle.glb',32,45,0,-1,2]];
for(const [file,cx,cz,nx,nz,row] of CELLS){ const fc=wallFaces.find(w=>w.cx===cx&&w.cz===cz&&w.nx===nx&&w.nz===nz); if(!fc){ console.warn('prison decor: no wall face at',cx,cz); continue; }
  use(file,3.4,p=>{ const t=(typeof cloneSkinned==='function')?cloneSkinned(p):p.clone(); const y0=(hgt[idx(cx,cz)]||0)+row*4+.6; t.position.set(fc.x+nx*.75,y0,fc.z+nz*.75); t.rotation.y=Math.atan2(nx,nz); world.add(t); bump('rigCell');
    const clips=p.userData.clips||[]; if(clips.length){ const mx=new THREE.AnimationMixer(t); const a=mx.clipAction(clips[0]); a.play(); a.time=rnd()*clips[0].duration; WORLDANIM.push(dt=>mx.update(dt)); }
    const l=new THREE.PointLight(C(0xffb060),1.2,9,2); l.position.set(fc.x+nx*2.2,y0+1.6,fc.z+nz*2.2); world.add(l); }); }
// ---------------- PIPES: one fat pipe along every terrace edge (broken where a flight comes down), and two great ones overhead running down the triangle's sides into the Heartroot's corner
{ const pts=[]; const EDGE=[[12,0,[16,20]],[23,2,[31,35]],[34,4,[6,10]]];   // [the lower terrace's last row before the drop, its floor, the flight columns that break the pipe]
  for(const [zr,y,[fa,fb]] of EDGE){ const w=HW(zr), zw=cwz(zr)+CELL/2-.36, x0=cw(CX-w)-CELL/2, x1=cw(CX+w)+CELL/2, n=Math.round((x1-x0)/CELL);
    for(let i=0;i<n;i++){ const x=x0+CELL*(i+.5); if(x>cw(fa)-CELL/2-.1&&x<cw(fb)+CELL/2+.1) continue; pts.push(x,y+1,zw); } }
  const geo=new THREE.CylinderGeometry(.34,.34,CELL+.02,8); geo.rotateZ(Math.PI/2);   // lying along x
  const im=new THREE.InstancedMesh(geo,mat(0x59503f),pts.length/3), m=new THREE.Matrix4(), q=new THREE.Quaternion(), sc=new THREE.Vector3(1,1,1), v=new THREE.Vector3();
  for(let i=0;i<pts.length/3;i++){ v.set(pts[i*3],pts[i*3+1],pts[i*3+2]); m.compose(v,q,sc); im.setMatrixAt(i,m); }
  im.instanceMatrix.needsUpdate=true; im.frustumCulled=false; im.userData.noOL=true; world.add(im); counts.pipeSegs=pts.length/3;
  // the great pipes: from high on the wide end down to the apex, hugging each side wall and sinking as they go
  const gm=mat(0x4d5a48), cg=new THREE.CylinderGeometry(.56,.56,1,10), collarG=new THREE.CylinderGeometry(.78,.78,.5,10), up=new THREE.Vector3(0,1,0);
  for(const sd of [-1,1]){ const A=new THREE.Vector3(sd*3.7,7,cwz(2)), B=new THREE.Vector3(sd*41.7,15,cwz(44)), dir=B.clone().sub(A), L=dir.length(); dir.normalize();
    const qq=new THREE.Quaternion().setFromUnitVectors(up,dir); const p=new THREE.Mesh(cg,gm); p.scale.set(1,L,1); p.quaternion.copy(qq); p.position.copy(A).add(B).multiplyScalar(.5); p.userData.noOL=true; world.add(p);
    for(let k=1;k<9;k++){ const c=new THREE.Mesh(collarG,gm); c.quaternion.copy(qq); c.position.copy(A).addScaledVector(dir,L*k/9); c.userData.noOL=true; world.add(c); }
    // where it ends: a green glow, the outfall into the pit
    const og=new THREE.PointLight(C(0x58c070),.8,9,2); og.position.set(sd*2.6,5.6,cwz(2)+1); world.add(og); }
  counts.greatPipes=2; }
// ---------------- SCONCES (build 346; Matt: "take all the wall torches out and put our sconses in"): every painted wall torch comes down and Matt's real Meshy sconce (the one the throne room and feast hall wear) goes up in its place,
// instanced in one draw with the warm glow on it. No light per sconce here -- the braziers in the map's own list light the cavern, as they did when these were painted torches -- so 45 sconces cost no lights at all.
function warmGlow(root){ root.traverse(o=>{ const m=o.isMesh&&o.material; if(!m||m.userData.__wg) return; m.userData.__wg=true; m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(.22,.11,.03);'); }; }); }
function instanceAll(wrap,mats){ if(!mats.length) return; wrap.updateMatrixWorld(true); const inv=new THREE.Matrix4().copy(wrap.matrixWorld).invert(), m=new THREE.Matrix4();
  wrap.traverse(ob=>{ if(!ob.isMesh||ob.userData.isOL) return; const rel=new THREE.Matrix4().multiplyMatrices(inv,ob.matrixWorld); const im=new THREE.InstancedMesh(ob.geometry,ob.material,mats.length);
    mats.forEach((M,i)=>{ m.multiplyMatrices(M,rel); im.setMatrixAt(i,m); }); im.instanceMatrix.needsUpdate=true; im.frustumCulled=false; im.userData.noOL=true; world.add(im); }); }
{ const torches=world.userData.torchProcs||[]; const spots=torches.map(t=>({ x:t.position.x, y:t.position.y, z:t.position.z, ry:t.rotation.y })); torches.forEach(t=>{ t.visible=false; }); counts.torchesOff=torches.length;
  use('throne-sconce.glb',1.5,p=>{ warmGlow(p); const plainZ=cwz(PLAIN_ROWS)+CELL*.75;   // faces around the apex wear the real wall modules, which stand a little out of the wall: the sconce stands out past them
    const mats=spots.map(sp=>{ const nx=Math.sin(sp.ry), nz=Math.cos(sp.ry), off=.9; return new THREE.Matrix4().compose(new THREE.Vector3(sp.x+nx*off,sp.y,sp.z+nz*off),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),sp.ry),new THREE.Vector3(1,1,1)); });
    instanceAll(p,mats); counts.sconces=mats.length; }); }
// ---------------- ARCHES AND PILLARS (build 346; Matt: "we should use these nice arches and pillars somewhere"): his doorway arch stands over the head of every flight, where the horde turns down the stairs (five wide to match), a
// smaller one frames each breakable wall, and two of his corner pillars stand behind the Heartroot's dais. 26K triangles in all.
{ const FL=[[8,38,6],[33,27,4],[18,16,2]];   // [the flight's centre column, the first row of the upper floor past its head, that floor's height]
  use('prison-arch.glb',4.95,p=>{ for(const [cx,cz,y] of FL){ const t=p.clone(); t.position.set(cw(cx),y,cwz(cz)); world.add(t); bump('flightArch'); }
    for(const sd of [-1,1]){ const t=p.clone(); t.scale.setScalar(1.6); const plane=cw(sd<0?18:28)-sd*CELL/2; t.position.set(plane-sd*.9,0,(cwz(5)+cwz(8))/2); t.rotation.y=-sd*PI/2; world.add(t); bump('alcoveArch'); } });
  use('prison-pillar.glb',8,p=>{ for(const cxx of [21,25]){ const t=p.clone(); t.position.set(cw(cxx),0,cwz(2)); world.add(t); bump('pillar'); } }); }
// ---------------- the cavern's own light: dark and moody (Matt: "probably just dark is fine") -- the game's own ambient with only a small lift (.62 -> .8), because with the real dark wall kit the stone went to pure black at the far end
scene.traverse(o=>{ if(o.isHemisphereLight) o.intensity=.8; else if(o.isDirectionalLight) o.intensity=.3; });
// ---------------- the test hook
window.__prisondecor={reach:()=>Object.fromEntries(Object.entries(LANES).map(([k,l])=>[k,flowFree.dist[idx(l.cx,l.cz)]])),info:()=>Object.assign({},counts)};
})();
