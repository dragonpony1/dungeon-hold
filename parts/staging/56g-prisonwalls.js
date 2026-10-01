// ===== THE DEEP PRISON'S BREAKABLE WALLS (build 343). Matt: "that destructible wall will sit on 2 sides of the apex of the triangle and when broken a secret weapon comes out and starts to fire". Bob (Hi3D) made the wall:
// a shackled dungeon wall that shakes on every hit and, at zero health, splits into 48 timber / iron / stone pieces that tumble and fade (his hi3d-breakable-wall.js, re-used here nearly as he wrote it: scripted fall, no
// physics engine). Two of them plug the side walls either side of the Heartroot's corner, each in front of a sealed alcove one cell deep; the alcove is solid stone until the wall goes. Hit one (four blows of 25: your
// sword's swing, or a staff bolt) and it bursts; the alcove opens, dust rolls out, and a SECRET WEAPON rolls out of the dark and starts firing on the horde -- a Mark VI Ballista behind the west wall, a Mark VI Acorn
// Cannon behind the east -- free, unsellable, tougher than a built tower. Only MAP.id==='prison'. Test hook: window.__prisonwalls.
(function(){
window.__prisonwalls={info:()=>null};
if(!MAP||MAP.id!=='prison') return;
const isGuest=()=>!!(window.__net&&window.__net.role&&window.__net.role()==='guest');
const OPEN_H=8.0, SCALE=OPEN_H/1.91, HIT=25, HP=100;
// the two alcoves: the solid cell, the pit cell in front of it, which way the opening faces (toward the pit), and the weapon behind each wall
// build 360 (Matt: "on the good guys end we use bobs breakable doors with the shackles and the other end the big barrier use meshys breakable door skin"): BOTH rooms by the Heartroot now wear Bob's shackled wall; the Meshy wall with the glowing crack is kept (shatter() below, one solid model cut at load into
// shards along organic lines, which fall with the same scripted tumble) for the BIG BARRIER at the far end -- the rim wall the boss breaks -- when that is built. (Earlier: 'we have 2 types of destrucable wall': west Bob's, east Meshy's; the Meshy shards were cut into
// shards along organic lines, which fall with the same scripted tumble)
// build 348 (Matt: "Make it 4x4 on both sides to start with"): each wall is now 4 squares wide and 4 tall (8 x 8), over an alcove 4 squares long and 2 deep. cin: the alcove column against the wall, cout: the one behind it, fcx: the pit column in front, z0-z1: its rows
// build 356 (Matt: "rework the whole room so its turned downfield"): both rooms now sit in the apex's NORTH wall, one each side of the Heartroot, opening SOUTH down the triangle. n: the way the opening faces (into the pit); c0-c1: the four columns it spans; rin/rout: the alcove's two rows (against the wall, behind it); front: the pit row in front
const SPOTS=[{id:'W',nx:0,nz:1,c0:16,c1:19,rin:3,rout:2,front:4,kind:'ball',src:'hi3d'},{id:'E',nx:0,nz:1,c0:27,c1:30,rin:3,rout:2,front:4,kind:'ball',src:'hi3d'}];
for(const sp of SPOTS){ sp.tx=sp.nz; sp.tz=-sp.nx; const ac=(cw(sp.c0)+cw(sp.c1))/2; sp.half=(sp.c1-sp.c0)/2*CELL+CELL/2; if(sp.nz!==0){ sp.cx0=ac; sp.cz0=cwz(sp.front)-sp.nz*CELL/2; } else { sp.cz0=(cwz(sp.c0)+cwz(sp.c1))/2; sp.cx0=cw(sp.front)-sp.nx*CELL/2; } sp.yaw=Math.atan2(sp.nx,sp.nz); }
const along=(sp,x,z)=>Math.max(-sp.half,Math.min(sp.half,(x-sp.cx0)*sp.tx+(z-sp.cz0)*sp.tz));
const nearPt=(sp,x,z)=>{ const s=along(sp,x,z); return { x:sp.cx0+sp.tx*s, z:sp.cz0+sp.tz*s }; };
const faceIndexN=(cx,cz,nx,nz)=>wallFaces.findIndex(f=>f.cx===cx&&f.cz===cz&&f.nx===nx&&f.nz===nz);
const spotCells=sp=>{ const a=[]; for(let c=sp.c0;c<=sp.c1;c++) a.push(sp.nz!==0?[c,sp.front]:[sp.front,c]); return a; };
const spotFaces=sp=>spotCells(sp).map(([cx,cz])=>faceIndexN(cx,cz,sp.nx,sp.nz));
const LVL=6, TOUGH=2, ROLL=3*CELL;   // how far the mortar rolls out of its room: three squares (Matt)
// ---------------- Bob's breakable wall (hi3d-breakable-wall.js), as he wrote it, in this game's own scope
class BreakableWall {
  constructor(intact,fragments,o){
    this.o=Object.assign({ maxHealth:HP, impulse:1, gravity:9.81, debrisLifetime:11, onHit:()=>{}, onBreak:()=>{} },o);
    this.group=new THREE.Group(); this.intact=intact; this.fragments=fragments;
    intact.position.y-=new THREE.Box3().setFromObject(intact).min.y; fragments.position.y-=new THREE.Box3().setFromObject(fragments).min.y;
    this.group.add(intact,fragments); this.group.updateMatrixWorld(true); this.chunks=[];
    fragments.traverse(node=>{ if(!node.userData.category) return;
      const bounds=new THREE.Box3(), inv=node.matrixWorld.clone().invert();
      node.traverse(mesh=>{ if(!mesh.isMesh||mesh.userData.isOL) return; mesh.geometry.computeBoundingBox(); const b=mesh.geometry.boundingBox, m=inv.clone().multiply(mesh.matrixWorld);
        for(let i=0;i<8;i++) bounds.expandByPoint(new THREE.Vector3(i&1?b.max.x:b.min.x,i&2?b.max.y:b.min.y,i&4?b.max.z:b.min.z).applyMatrix4(m)); });
      const corners=[]; for(let i=0;i<8;i++) corners.push(new THREE.Vector3(i&1?bounds.max.x:bounds.min.x,i&2?bounds.max.y:bounds.min.y,i&4?bounds.max.z:bounds.min.z));
      this.chunks.push({ node, home:node.position.clone(), rotation:node.quaternion.clone(), scale:node.scale.clone(), corners, velocity:new THREE.Vector3(), spin:new THREE.Vector3(), settled:false }); });
    this._tmp=new THREE.Vector3(); this._axis=new THREE.Vector3(); this._q=new THREE.Quaternion();
    this.health=this.o.maxHealth; this.broken=false; this.age=0; this.time=0; this.acc=0; this.lastHit=-Infinity; this.shake=0; this.fragments.visible=false; }
  hit(dmg,point,dir){ if(this.locked||this.broken||this.time-this.lastHit<.18||!(dmg>0)) return false; this.lastHit=this.time; this.health=Math.max(0,this.health-dmg); this.shake=.20; this.o.onHit(this,point); if(!this.health) this.destroy(point,dir); return true; }
  destroy(point,dir){ if(this.broken) return false; this.group.updateMatrixWorld(true);
    const impact=point?this.group.worldToLocal(point.clone()):new THREE.Vector3(0,1,0), d=dir?dir.clone().transformDirection(this.group.matrixWorld.clone().invert()):new THREE.Vector3(0,0,-1);
    this.broken=true; this.health=0; this.age=0; this.shake=0; this.intact.visible=false; this.fragments.visible=true;
    this.chunks.forEach((p,i)=>{ const seed=Math.sin((i+1)*78.233)*43758.5453, r=seed-Math.floor(seed); const radial=p.home.clone().sub(impact); radial.y=Math.abs(radial.y)*.25+.2; radial.normalize();
      const weight=p.node.userData.category==='stone'?.65:1; p.velocity.copy(radial).multiplyScalar((1.1+r)*weight).addScaledVector(d,1.0+r).multiplyScalar(this.o.impulse); p.velocity.y+=(.9+r*1.6)*weight; p.spin.set((r-.5)*5,Math.sin(i*2.1)*3,Math.cos(i*1.3)*4); });
    this.o.onBreak(this,point); return true; }
  update(dt){ if(!(dt>0)) return; dt=Math.min(dt,.05); this.time+=dt;
    if(!this.broken){ this.shake=Math.max(0,this.shake-dt); const a=this.shake*.08; this.intact.position.x=Math.sin(this.time*100)*a; this.intact.rotation.z=Math.sin(this.time*83)*a*.3; return; }
    this.acc+=dt; while(this.acc>=1/120){ this._step(1/120); this.acc-=1/120; } }
  _step(dt){ this.age+=dt; const fade=Math.max(0,Math.min(1,this.o.debrisLifetime-this.age)); if(fade===0){ this.fragments.visible=false; return; }
    for(const p of this.chunks){ if(!p.settled){ p.velocity.y-=this.o.gravity*dt; p.node.position.addScaledVector(p.velocity,dt); const sp=p.spin.length();
        if(sp>.0001) p.node.quaternion.premultiply(this._q.setFromAxisAngle(this._axis.copy(p.spin).normalize(),sp*dt));
        let minY=Infinity; for(const c of p.corners){ this._tmp.copy(c).multiply(p.scale).applyQuaternion(p.node.quaternion); minY=Math.min(minY,this._tmp.y+p.node.position.y+this.fragments.position.y); }
        if(minY<.006){ p.node.position.y+=.006-minY; p.velocity.y=Math.abs(p.velocity.y)*.18; p.velocity.x*=.72; p.velocity.z*=.72; p.spin.multiplyScalar(.55); if(this.age>.8&&p.velocity.length()<.22){ p.settled=true; p.velocity.set(0,0,0); p.spin.set(0,0,0); } } }
      p.node.scale.copy(p.scale).multiplyScalar(fade); } }
}
// ---------------- the models: fetched, parsed and toon-shaded once; each wall gets its own clone
const load=name=>fetchBytes(ASSET(name),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',gl=>{ try{ const root=gl.scene||gl.scenes[0]; toonify(root,SCALE); res(root); }catch(e){ rej(e); } },rej)));
world.userData.alcoveFaces=new Set(SPOTS.flatMap(spotFaces));
const walls=[]; let cellWall=null; const dust=[]; const timers=[]; const cnt={ built:0, hits:0, broken:0, weapons:0 };
function faceIndex(cx,cz,nx){ return wallFaces.findIndex(f=>f.cx===cx&&f.cz===cz&&f.nx===nx&&f.nz===0); }
// the wall face in front of the alcove is drawn from the top of the opening up (so the opening itself is clear to open); until it breaks, Bob's wall fills it
function lowerQuad(i,y){ if(!cellWall||i<0) return; const g=cellWall.geometry, p=g.attributes.position, uv=g.attributes.uv; for(const k of [0,3]){ p.setY(4*i+k,y); uv.setY(4*i+k,y/CELL); } p.needsUpdate=true; uv.needsUpdate=true; }
function lowerFaces(sp,y){ for(const q of spotFaces(sp)) lowerQuad(q,y); }
function puff(x,y,z,n,spread){ const sw=spread||2.2; for(let i=0;i<n;i++){ const s=glow(0xd8c8a8,5+Math.random()*4,.0); s.position.set(x+(Math.random()-.5)*2.2,y+Math.random()*3,z+(Math.random()-.5)*sw); world.add(s); dust.push({ s, t:0, life:1.3+Math.random()*.8, vy:.5+Math.random()*.8, vx:(Math.random()-.5)*1.2, vz:(Math.random()-.5)*1.2 }); } }
// ---------------- opening the alcove and rolling the weapon out
function openAlcoveOld(sp){ const cx=sp.cx, cz=sp.cz, x=cw(cx), z=cwz(cz), nx=sp.nx;
  grid[idx(cx,cz)]=T.FLOOR; hgt[idx(cx,cz)]=0; reflow();
  const dark=mat(0x2c3628,{side:THREE.DoubleSide}); const add=(w,h,px,py,pz,ry,rx)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),dark); m.position.set(px,py,pz); m.rotation.set(rx||0,ry||0,0); m.userData.noOL=true; world.add(m); };
  add(CELL,CELL,x,.03,z,0,-PI/2); add(CELL,CELL,x,OPEN_H-.03,z,0,PI/2); add(CELL,OPEN_H,x-nx*CELL/2,OPEN_H/2,z,nx>0?PI/2:-PI/2); add(CELL,OPEN_H,x,OPEN_H/2,z-CELL/2,0); add(CELL,OPEN_H,x,OPEN_H/2,z+CELL/2,0);   // the alcove's floor, ceiling, back and two sides
  const l=new THREE.PointLight(C(0xffc870),2.4,11,2); l.position.set(x+nx*.4,2.2,z); world.add(l); sp.light=l; sp.flash=1;
  puff(x+nx*1.2,.6,z,7);
  // the weapon: a real defense, placed free (its mana and defense units handed straight back), Mark VI, tougher than a built one, not for sale
  const m0=S.mana; const d=placeDefAt(sp.kind,x,z,nx>0?PI/2:-PI/2); S.mana=m0; S.du-=DEFS[sp.kind].du; d.spent=0; d.secret=true; d.lvl=LVL; d.max=Math.round(DEFS[sp.kind].hp*(1+.4*(LVL-1)))*TOUGH; d.hp=d.max; d.pop=0; sp.def=d; cnt.weapons++;
  floatText(x,d.top+1.6,z,'🔓 '+DEFS[sp.kind].ic,'#e8b94a'); try{ SFX.place&&SFX.place(); }catch(e){} }
function openAlcoveOld2(sp){ const nx=sp.nx, px=sp.px, zc=sp.zc, zh=sp.zh, dep=2*CELL, xm=px-nx*dep/2;
  for(const cc of [sp.cin,sp.cout]) for(let r=sp.z0;r<=sp.z1;r++){ grid[idx(cc,r)]=T.FLOOR; hgt[idx(cc,r)]=0; } reflow();
  const dark=mat(0x2c3628,{side:THREE.DoubleSide}); const add=(w,h,pxx,py,pz,ry,rx)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),dark); m.position.set(pxx,py,pz); m.rotation.set(rx||0,ry||0,0); m.userData.noOL=true; world.add(m); };
  // the alcove's floor, ceiling, back and two sides
  add(dep,2*zh,xm,.03,zc,0,-PI/2); add(dep,2*zh,xm,OPEN_H-.03,zc,0,PI/2); add(2*zh,OPEN_H,px-nx*dep,OPEN_H/2,zc,nx>0?PI/2:-PI/2); add(dep,OPEN_H,xm,OPEN_H/2,zc-zh,0); add(dep,OPEN_H,xm,OPEN_H/2,zc+zh,0);
  const l=new THREE.PointLight(C(0xffc870),3.8,24,2); l.position.set(px-nx*1.5,4,zc); world.add(l); sp.light=l; sp.flash=1;
  puff(px+nx*1.4,1,zc,18,2*zh);
  // the weapon: a real defense, placed free (its mana and defense units handed straight back), Mark VI, tougher than a built one, not for sale
  const x=cw(sp.cin), m0=S.mana; const d=placeDefAt(sp.kind,x,zc,nx>0?PI/4:-PI/4); S.mana=m0; S.du-=DEFS[sp.kind].du; d.spent=0; d.secret=true; d.lvl=LVL; d.max=Math.round(DEFS[sp.kind].hp*(1+.4*(LVL-1)))*TOUGH; d.hp=d.max; d.pop=0; sp.def=d; cnt.weapons++; if(!mountMortar(d,sp)) pendingMount.push(sp);
  floatText(x,d.top+1.6,zc,'🔓 '+DEFS[sp.kind].ic,'#e8b94a'); try{ SFX.place&&SFX.place(); }catch(e){} }
function openAlcove(sp){ const nx=sp.nx, nz=sp.nz, tx=sp.tx, tz=sp.tz, half=sp.half, dep=2*CELL, cx0=sp.cx0, cz0=sp.cz0;
  for(const r of [sp.rin,sp.rout]) for(let c=sp.c0;c<=sp.c1;c++){ const cc=nz!==0?[c,r]:[r,c]; grid[idx(cc[0],cc[1])]=T.FLOOR; hgt[idx(cc[0],cc[1])]=0; } reflow();
  const dark=mat(0x2c3628,{side:THREE.DoubleSide}); const add=(w,h,px0,py,pz0,ry,rx)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),dark); m.position.set(px0,py,pz0); m.rotation.set(rx||0,ry||0,0); m.userData.noOL=true; world.add(m); };
  const mx=cx0-nx*dep/2, mz=cz0-nz*dep/2, dimX=Math.abs(tx)*2*half+Math.abs(nx)*dep, dimZ=Math.abs(tz)*2*half+Math.abs(nz)*dep;
  // the alcove's floor, ceiling, back and two sides
  add(dimX,dimZ,mx,.03,mz,0,-PI/2); add(dimX,dimZ,mx,OPEN_H-.03,mz,0,PI/2); add(2*half,OPEN_H,cx0-nx*dep,OPEN_H/2,cz0-nz*dep,sp.yaw); add(dep,OPEN_H,mx+tx*half,OPEN_H/2,mz+tz*half,Math.atan2(tx,tz)); add(dep,OPEN_H,mx-tx*half,OPEN_H/2,mz-tz*half,Math.atan2(tx,tz));
  const l=new THREE.PointLight(C(0xffc870),3.8,24,2); l.position.set(cx0-nx*1.5,4,cz0-nz*1.5); world.add(l); sp.light=l; sp.flash=1;
  puff(cx0+nx*1.4,1,cz0+nz*1.4,18,2*half);
  // the weapon: a real defense, placed free (its mana and defense units handed straight back), Mark VI, tougher than a built one, not for sale. It rests facing straight out of its room, down the field
  // it comes to rest three squares out in the pit, and holds its fire until it has rolled there
  const x=cx0-nx*CELL/2+nx*ROLL, z=cz0-nz*CELL/2+nz*ROLL, m0=S.mana; const d=placeDefAt(sp.kind,x,z,sp.yaw); d.cd=Math.max(d.cd||0,3.2); S.mana=m0; S.du-=DEFS[sp.kind].du; d.spent=0; d.secret=true; d.lvl=LVL; d.max=Math.round(DEFS[sp.kind].hp*(1+.4*(LVL-1)))*TOUGH; d.hp=d.max; d.pop=0; sp.def=d; cnt.weapons++; if(!mountMortar(d,sp)) pendingMount.push(sp);
  floatText(x,d.top+1.6,z,'🔓 '+DEFS[sp.kind].ic,'#e8b94a'); try{ SFX.place&&SFX.place(); }catch(e){} }
// ---------------- the plain prison wall around the apex (Matt: "first from behind the heartroot to the exterior of it about 3 squares, no cells so all prison wall"): the same shackled wall instanced over every wall face: five high (ten up -- Matt: "take those wall upward 3 squares") along the back wall behind the Heartroot, two high down the sides
// of the first rows (the painted plain-wall tile carries the rest of the height), so the breakable walls sit in a wall made of their own kind
// (the rest of the height, and the sides above their two rows, is that same wall drawn flat: the model's front rendered once into the plain wall's tile -- the real look at no triangles)
function bakeTile(root){ const cw0=world.userData.cellWall; if(!cw0||!cw0.material.map||!cw0.material.map.image) return; const size=256, rt=new THREE.WebGLRenderTarget(size,size,{ minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter }); rt.texture.encoding=THREE.sRGBEncoding;
  const sc=new THREE.Scene(); sc.background=new THREE.Color(0x10140e); const cl=root.clone(true); cl.traverse(o=>{ if(!o.isMesh) return; if(o.userData.isOL){ o.visible=false; return; } o.material=new THREE.MeshBasicMaterial({ map:o.material.map, color:0xffffff }); });
  cl.updateMatrixWorld(true); const bx=new THREE.Box3().setFromObject(cl), ct=bx.getCenter(new THREE.Vector3()); cl.position.sub(ct); sc.add(cl); const cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,10); cam.position.set(0,0,3); cam.lookAt(0,0,0);
  const keep=renderer.getRenderTarget(); renderer.setRenderTarget(rt); renderer.clear(); renderer.render(sc,cam); const px=new Uint8Array(size*size*4); renderer.readRenderTargetPixels(rt,0,0,size,size,px); renderer.setRenderTarget(keep); rt.dispose();
  const c=document.createElement('canvas'); c.width=c.height=size; const g=c.getContext('2d'), id=g.createImageData(size,size); for(let y=0;y<size;y++) id.data.set(px.subarray((size-1-y)*size*4,(size-y)*size*4),y*size*4); g.putImageData(id,0,0);
  const dst=cw0.material.map.image.getContext('2d'); dst.drawImage(c,1024,0); cw0.material.map.needsUpdate=true; cnt.baked=1; }
function plainWall(root){ const PR=world.userData.plainRows||7; root.updateMatrixWorld(true); const box=new THREE.Box3().setFromObject(root), sz=box.getSize(new THREE.Vector3()), c=box.getCenter(new THREE.Vector3());
  const s=OPEN_H/(2*sz.y), depth=sz.z*s, skip=new Set(SPOTS.flatMap(p=>{ const a=[]; for(let r=p.z0;r<=p.z1;r++) a.push(faceIndex(p.fcx,r,p.nx)); return a; })), mats=[], m=new THREE.Matrix4(), Q=new THREE.Quaternion(), V=new THREE.Vector3(), Sc=new THREE.Vector3(s,s,s), up=new THREE.Vector3(0,1,0);
  wallFaces.forEach((f,q)=>{ if(f.cz>PR||skip.has(q)) return; const y0=hgt[idx(f.cx,f.cz)]||0; Q.setFromAxisAngle(up,Math.atan2(f.nx,f.nz));
    const rows=(f.nz===1&&f.nx===0&&f.cz===2)?5:2;   // behind the Heartroot the real wall goes five high (ten up); down the sides two, with the same wall drawn flat above it
    for(let r=0;r<rows;r++){ V.set(f.x+f.nx*.12,y0+r*sz.y*s,f.z+f.nz*.12); mats.push(new THREE.Matrix4().compose(V,Q,Sc).multiply(new THREE.Matrix4().makeTranslation(-c.x,-box.min.y,-c.z))); } });
  root.traverse(ob=>{ if(!ob.isMesh||ob.userData.isOL) return; const im=new THREE.InstancedMesh(ob.geometry,ob.material,mats.length); mats.forEach((M4,i)=>{ m.multiplyMatrices(M4,ob.matrixWorld); im.setMatrixAt(i,m); }); im.instanceMatrix.needsUpdate=true; im.frustumCulled=false; im.userData.noOL=true; world.add(im); });
  cnt.wallModules=mats.length; }
// ---------------- a solid model shattered into shards: its triangles dealt out to ~20 jittered-grid seeds by where they sit across the face, each shard its own mesh about its own centre (same material, so the glowing crack stays)
function shatter(root){ root.updateMatrixWorld(true); let mesh=null; root.traverse(o=>{ if(!mesh&&o.isMesh&&!o.userData.isOL) mesh=o; }); if(!mesh) return null;
  const g=mesh.geometry.clone(); g.applyMatrix4(mesh.matrixWorld); g.computeBoundingBox(); const bb=g.boundingBox, pos=g.attributes.position, nor=g.attributes.normal, uv=g.attributes.uv, ix=g.index, tri=ix?ix.count/3:pos.count/3, get=k=>ix?ix.getX(k):k;
  const COLS=5, ROWS=4, seeds=[]; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) seeds.push({ x:bb.min.x+(c+.5+(rnd()-.5)*.7)*(bb.max.x-bb.min.x)/COLS, y:bb.min.y+(r+.5+(rnd()-.5)*.7)*(bb.max.y-bb.min.y)/ROWS, tris:[] });
  for(let t=0;t<tri;t++){ const a=get(3*t), b=get(3*t+1), c=get(3*t+2), cx=(pos.getX(a)+pos.getX(b)+pos.getX(c))/3, cy=(pos.getY(a)+pos.getY(b)+pos.getY(c))/3; let best=0, bd=1e9; for(let i=0;i<seeds.length;i++){ const d=(seeds[i].x-cx)*(seeds[i].x-cx)+(seeds[i].y-cy)*(seeds[i].y-cy); if(d<bd){ bd=d; best=i; } } seeds[best].tris.push(a,b,c); }
  const mat0=mesh.material.clone(); mat0.side=THREE.DoubleSide; const group=new THREE.Group();
  for(const sd of seeds){ if(sd.tris.length<12) continue; const n=sd.tris.length, P=new Float32Array(n*3), N=new Float32Array(n*3), U=uv?new Float32Array(n*2):null; const box=new THREE.Box3();
    for(let k=0;k<n;k++){ const v=sd.tris[k]; P[k*3]=pos.getX(v); P[k*3+1]=pos.getY(v); P[k*3+2]=pos.getZ(v); if(nor){ N[k*3]=nor.getX(v); N[k*3+1]=nor.getY(v); N[k*3+2]=nor.getZ(v); } if(U){ U[k*2]=uv.getX(v); U[k*2+1]=uv.getY(v); } box.expandByPoint(new THREE.Vector3(P[k*3],P[k*3+1],P[k*3+2])); }
    const ctr=box.getCenter(new THREE.Vector3()); for(let k=0;k<n;k++){ P[k*3]-=ctr.x; P[k*3+1]-=ctr.y; P[k*3+2]-=ctr.z; }
    const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(P,3)); if(nor) sg.setAttribute('normal',new THREE.BufferAttribute(N,3)); if(U) sg.setAttribute('uv',new THREE.BufferAttribute(U,2));
    const node=new THREE.Group(); node.position.copy(ctr); node.userData.category=ctr.y>bb.min.y+(bb.max.y-bb.min.y)*.5?'wood':'stone'; const m=new THREE.Mesh(sg,mat0); m.userData.noOL=true; node.add(m); group.add(node); }
  return group; }
// ---------------- the walls
Promise.all([load('prison-wall-intact.glb'),load('prison-wall-fragments.glb'),load('prison-wall2.glb')]).then(([intact,frag,wall2])=>{
  let shards=null; try{ shards=shatter(wall2); }catch(e){ console.warn('prison walls shatter',e); }
  for(const sp of SPOTS){ if(spotFaces(sp).some(q=>q<0)){ console.warn('prison walls: no wall face for',sp.id); continue; }
    cellWall=cellWall||world.userData.cellWall; lowerFaces(sp,OPEN_H);
    const meshy=sp.src==='meshy'&&shards, wScale=meshy?OPEN_H/1.925:SCALE;
    const w=new BreakableWall(meshy?wall2.clone(true):intact.clone(true),meshy?shards:frag.clone(true),{ gravity:9.81/wScale, onHit:(ww,pt)=>{ cnt.hits++; try{ SFX.hit&&SFX.hit(); }catch(e){} puff(pt?pt.x:0,2.5,pt?pt.z:0,2,sp.half*1.6); },
      onBreak:(ww,pt)=>{ cnt.broken++; try{ if(window.__mortarshow) window.__mortarshow.onBreak(sp,ww); }catch(er){ console.warn('mortar show',er); } try{ SFX.boom&&SFX.boom(); SFX.hit&&SFX.hit(); }catch(e){} puff(sp.cx0,2.5,sp.cz0,22,sp.half*2); timers.push({ t:.8, fn:()=>openAlcove(sp) }); } });
    const back=.47*wScale/2;   // the wall's front on the opening's plane, its thickness behind it, in the alcove
    w.group.scale.setScalar(wScale); w.group.position.set(sp.cx0-sp.nx*back,0,sp.cz0-sp.nz*back); w.group.rotation.y=sp.yaw; world.add(w.group); w.spot=sp; w.kind=meshy?'meshy':'hi3d';
    // a soft gold glow (green on the Meshy wall's glowing crack) breathes over the wall until it breaks
    { const col=meshy?0x70ff90:0xffc860, gs=glow(col,13,.5); gs.position.set(sp.cx0+sp.nx*.8,OPEN_H/2,sp.cz0+sp.nz*.8); world.add(gs); const gl=new THREE.PointLight(C(col),2.2,16,2); gl.position.set(sp.cx0+sp.nx*1.6,OPEN_H/2,sp.cz0+sp.nz*1.6); world.add(gl); w.beacon={ gs, gl, ph:Math.random()*6 }; } sp.wall=w; walls.push(w); cnt.built++; }
}).catch(e=>console.warn('prison walls',e));
// ---------------- THE HEX MORTAR (build 349; Bob's animated model -- 'Fire' and 'Roll' clips, a 'Muzzle' bone out of the barrel). The secret weapon is a real Mark VI lobbing defense (the Turnip Trebuchet's rules: long range, splash, a
// cone) wearing the mortar: it rolls out of the alcove on its wheels, and every shot it lobs plays 'Fire' (started just before the kick, so the recoil lands with the shot), a green flash at the muzzle, the shell turned arcane green
const pendingMount=[]; const MORT={ proto:null, clips:[] }; const mounts=[]; const seenShell=new WeakSet(); const flashes=[];
fetchBytes(ASSET('prison-hexmortar.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',gl=>{ try{ const root=gl.scene||gl.scenes[0]; toonify(root,1); runeGlow(root); MORT.proto=root; MORT.clips=gl.animations||[]; res(); }catch(er){ rej(er); } },rej))).catch(er=>console.warn('prison mortar',er));
function runeGlow(root){ root.traverse(o=>{ const m=o.isMesh&&!o.userData.isOL&&o.material; if(!m||m.userData.__rg) return; m.userData.__rg=true; m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n  { float gf=clamp(diffuseColor.g-max(diffuseColor.r,diffuseColor.b)-.04,0.0,1.0); totalEmissiveRadiance += vec3(.25,1.0,.4)*gf*2.2 + vec3(.05,.07,.04); }'); }; }); }
// the canister: Matt's Hex Canister Bomb (prison-hexbomb.glb), one fetch, cloned per shell, tumbling as it flies; where it lands the blight blast (95h-blight.js) goes off, small, with a short cloud
const HEXB={ proto:null, off:null, k:1 }; const flying=[];
fetchBytes(ASSET('prison-hexbomb.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',gl=>{ try{ const root=gl.scene||gl.scenes[0]; toonify(root,1); runeGlow(root); root.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(root), c=bb.getCenter(new THREE.Vector3()); HEXB.proto=root; HEXB.off=c.negate(); HEXB.k=1.15/Math.max(1e-6,bb.max.y-bb.min.y); res(); }catch(er){ rej(er); } },rej))).catch(er=>console.warn('prison hexbomb',er));
function hexShell(shell){ if(!HEXB.proto||!shell||!shell.mesh) return; shell.mesh.children.forEach(c=>{ c.visible=false; }); const cn=HEXB.proto.clone(true); cn.position.copy(HEXB.off); const piv=new THREE.Group(); piv.name='hexbomb'; piv.scale.setScalar(HEXB.k); piv.add(cn); piv.rotation.set(rnd()*6,0,rnd()*6); shell.mesh.add(piv); shell.__hex=true; flying.push({ shell, piv, sx:5+rnd()*3, sz:2+rnd()*2 }); }
// far downfield (Matt: "once that thing hits, far downfield"): the secret mortars reach 1.8 times as far as a built trebuchet, and they lob at the THICKEST CLUSTER of mobs in their cone -- skipping any already in a mist -- so the mist lands where the most mobs can fight each other
// build 383 (Matt: "the mortar have 8 shots each but they are shooting them so fast you miss what happened. we need 4 seconds of reload time between shots"): a secret mortar reloads for FOUR seconds between shots, whatever its marks (REARM)
const REARM=4;
{ const prevStat=stat; stat=function(d,k){ const v=prevStat.apply(this,arguments); if(d&&d.secret){ if(k==='range') return v*1.8; if(k==='cd') return REARM; } return v; }; }
// build 369 (Matt: "lol let cut these mortar off at about 8 rounds each and see what happens"): each secret mortar has AMMO (8) shells; every shot spends one, and when the last is gone it goes dry -- a puff of smoke, its green light out, no more shells (it stays where it is)
const AMMO=8;
function dryOut(d){ if(d.dry) return; d.dry=1; puff(d.x,d.base+1.4,d.z,6,2.4); floatText(d.x,d.top+1.6,d.z,'\uD83D\uDCA8','#aab4b0'); try{ SFX.hit&&SFX.hit(); }catch(er){} cnt.dry=(cnt.dry||0)+1; }
{ const prevFire=fire; fire=function(d,e){ if(d&&d.secret&&d.kind==='ball'){ if(d.ammo===undefined) d.ammo=AMMO; if(d.ammo<=0){ dryOut(d); return; } d.ammo--; cnt.shells=(cnt.shells||0)+1; try{ const rng=stat(d,'range'), half=(arcOf(d)||100)/2*PI/180, fx=Math.sin(d.yaw), fz=Math.cos(d.yaw); let best=null, bs=-1e9;
      for(const q of enemies){ if(q.dead||q.fly) continue; const dx=q.x-d.x, dz=q.z-d.z, dist=Math.hypot(dx,dz); if(dist>rng||dist<6) continue; if((dx*fx+dz*fz)/dist<Math.cos(half)) continue; let n=0; for(const o of enemies){ if(!o.dead&&Math.hypot(o.x-q.x,o.z-q.z)<7) n++; } const covered=window.__blight&&window.__blight.madCover(q.x,q.z); const sc=n*10+dist*.05-(covered?1000:0)-(q.madT>0?400:0); if(sc>bs){ bs=sc; best=q; } }
      if(best) e=best; }catch(er){ console.warn('prison mortar aim',er); } } return prevFire.call(this,d,e); }; }
{ const prev=turnipSplat; turnipSplat=function(p){ prev.apply(this,arguments); if(p&&p.__hex&&window.__blight){ try{ const covered=window.__blight.madCover(p.x,p.z); window.__blight.explode(p.x,p.z,covered?{ noDamage:true, noCloud:true, scale:.5, shell:true, quiet:true }:{ noDamage:true, scale:.8, cloudR:10, cloudT:11, shell:true, quiet:true, mad:true, poison:2 }); }catch(er){ console.warn('prison hexbomb blast',er); } } }; }
function mountMortar(d,sp){ if(!MORT.proto||!d||!d.mdl) return false; const g=cloneSkinned(MORT.proto); g.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(g); g.position.set(-(bb.min.x+bb.max.x)/2,-bb.min.y,-(bb.min.z+bb.max.z)/2);
  const inner=new THREE.Group(); inner.add(g); inner.rotation.y=PI/2;   // the model's barrel points along -x; a defense faces +z
  const holder=new THREE.Group(); holder.name='hexmortar'; holder.scale.setScalar(2.2); holder.add(inner); const back=-ROLL/(d.mdl.scale.x||1); holder.position.z=back; d.mdl.add(holder);
  const mx=new THREE.AnimationMixer(g), byName=n=>THREE.AnimationClip.findByName(MORT.clips,n); const roll=byName('Roll')?mx.clipAction(byName('Roll')):null, fire=byName('Fire')?mx.clipAction(byName('Fire')):null; if(fire){ fire.setLoop(THREE.LoopOnce,1); fire.clampWhenFinished=false; } if(roll){ roll.timeScale=1.1; roll.play(); }
  const gl2=new THREE.PointLight(C(0x60ff80),1.6,10,2); gl2.position.set(0,2.4,0); holder.add(gl2);
  const m={ d, sp, holder, mx, roll, fire, back, dur:3, muzzle:g.getObjectByName('Muzzle'), t:0, rolled:false, fires:0 }; mounts.push(m); sp.mount=m; return true; }
function mortarFire(m,shell){ m.fires++; if(m.fire){ m.fire.reset(); m.fire.time=.5; m.fire.play(); }
  const p=new THREE.Vector3(); if(m.muzzle){ m.muzzle.getWorldPosition(p); } else p.set(m.d.x,m.d.base+2,m.d.z);
  const gs=glow(0x70ff90,5,.95); gs.position.copy(p); world.add(gs); flashes.push({ s:gs, t:0, life:.45 });
  if(shell&&shell.mesh){ if(HEXB.proto) hexShell(shell); else shell.mesh.traverse(o=>{ if(o.material&&o.material.color&&!o.isSprite){ o.material=o.material.clone(); o.material.color.set(0x5cff80); if(o.material.emissive) o.material.emissive.set(0x2cc850); } }); const tg=glow(0x70ff90,1.6,.8); shell.mesh.add(tg); } }
// ---------------- what breaks them: your sword's swing, or a staff bolt of yours
function nearPlane(sp,x,z,r){ const p=nearPt(sp,x,z); return Math.hypot(x-p.x,z-p.z)<r; }
function meleeWalls(){ if(isGuest()) return; const fx=Math.sin(hero.yaw), fz=Math.cos(hero.yaw);
  for(const w of walls){ if(w.broken) continue; const sp=w.spot, np=nearPt(sp,hero.x,hero.z), wx=np.x, wz=np.z, dx=wx-hero.x, dz=wz-hero.z, d=Math.hypot(dx,dz);
    if(d<Math.min(hero.reach||2.4,3.2)+1.8&&(dx*fx+dz*fz)/Math.max(d,.01)>.25) w.hit(HIT,new THREE.Vector3(wx,1.5,wz),new THREE.Vector3(fx,0,fz)); } }
{ const prev=hitCone; hitCone=function(){ prev.apply(this,arguments); meleeWalls(); }; }
// the secret weapons are not for sale, and giving one back hands back the defense units it never took
{ const prevSell=sell; sell=function(pos){ const d=typeof pickDef==='function'?pickDef(pos):null; if(d&&d.secret){ toast('🔒 A secret weapon'); return; } return prevSell.apply(this,arguments); }; }
{ const prevRemove=removeDef; removeDef=function(d){ const s=d&&d.secret; prevRemove.apply(this,arguments); if(s) S.du+=DEFS[d.kind].du; }; }
// ---------------- per frame: the walls, the dust, the light flash, the opening timers, the staff bolts
let clock=0;
WORLDANIM.push(dt=>{ clock+=dt; for(const w of walls) w.update(dt);
  for(let i=pendingMount.length-1;i>=0;i--){ const sp=pendingMount[i]; if(sp.def&&MORT.proto&&mountMortar(sp.def,sp)) pendingMount.splice(i,1); }
  // the ammo pips: eight small green lights in a row above each mortar once it has rolled out, one going dim with every shell fired; the green light on the mortar dies with the last
  { const cr=camera.matrixWorld.elements; for(const m of mounts){ const d=m.d; if(!m.pips){ m.pips=[]; for(let i=0;i<AMMO;i++){ const s=glow(0x70ff90,.95,.9); s.visible=false; world.add(s); m.pips.push(s); } }
      const alive=defs.includes(d), on=alive&&m.rolled; const left=d.ammo===undefined?AMMO:d.ammo; m.pips.forEach((s,i)=>{ s.visible=on; if(on){ s.position.set(d.x+cr[0]*(i-(AMMO-1)/2)*.5,d.base+4.4+Math.sin(clock*3+i)*.04,d.z+cr[2]*(i-(AMMO-1)/2)*.5); const live=i<left; s.material.opacity=live?.92:.2; s.material.color.setHex(live?0x70ff90:0x6a7a70); s.scale.setScalar(live?.95:.55); } });
      if(m.gl2){ const want=left>0?1.6:0; m.gl2.intensity+=(want-m.gl2.intensity)*Math.min(1,dt*3); } else { const l=m.holder.children.find(c=>c.isPointLight); if(l) m.gl2=l; } } }
  for(const m of mounts){ if(m.d.mdl&&m.holder.parent!==m.d.mdl) m.d.mdl.add(m.holder);
    m.mx.update(dt); m.t+=dt; if(!m.rolled){ const k=Math.min(1,m.t/m.dur); m.holder.position.z=m.back*(1-k*k*(3-2*k)); if(k>=1){ m.rolled=true; if(m.roll){ m.roll.stop(); } } }
    for(const c of m.d.mdl.children){ if(c!==m.holder&&c.name!=='chevrons') c.visible=false; } }
  if(mounts.length&&projs.length) for(const p of projs){ if(p.kind!=='turnip'||seenShell.has(p)) continue; seenShell.add(p); let best=null,bd=3.6; for(const m of mounts){ const dd=Math.hypot((p.x||0)-m.d.x,(p.z||0)-m.d.z); if(dd<bd){ bd=dd; best=m; } } if(best) mortarFire(best,p); }
  for(let i=flying.length-1;i>=0;i--){ const f=flying[i]; if(!projs.includes(f.shell)){ flying.splice(i,1); continue; } f.piv.rotation.x+=f.sx*dt; f.piv.rotation.z+=f.sz*dt; }
  for(let i=flashes.length-1;i>=0;i--){ const f=flashes[i]; f.t+=dt; const k=f.t/f.life; if(k>=1){ world.remove(f.s); flashes.splice(i,1); continue; } f.s.material.opacity=.95*(1-k); f.s.scale.setScalar(5+k*4); }
  for(const w of walls){ const b=w.beacon; if(!b) continue; if(w.broken){ world.remove(b.gs); world.remove(b.gl); w.beacon=null; continue; } if(w.locked){ b.gs.visible=false; b.gl.intensity=0; continue; } b.gs.visible=true; const k=.5+.5*Math.sin(clock*2.2+b.ph); const lv=window.__mortarGlow?window.__mortarGlow():0, fOp=.1+.12*k, fLt=.22+.3*k, hOp=.55+.4*k, hLt=2.6+2.6*k; b.gs.scale.setScalar(13+(19+3*k-13)*lv); b.gs.material.opacity=fOp+(hOp-fOp)*lv; b.gl.intensity=fLt+(hLt-fLt)*lv; }   // build 383 (Matt: "those mortar doors only have a very slight glow to them so only a very through player would check them. once the horde has taken out 3 of my defenses the glow becomes stronger with each defense that falls"): a very slight glow (lv 0) that swells with every defense lost past the third (95n-mortarwake.js, window.__mortarGlow)
  for(let i=timers.length-1;i>=0;i--){ const t=timers[i]; t.t-=dt; if(t.t<=0){ timers.splice(i,1); try{ t.fn(); }catch(e){ console.warn('prison walls',e); } } }
  for(let i=dust.length-1;i>=0;i--){ const p=dust[i]; p.t+=dt; const k=p.t/p.life; if(k>=1){ world.remove(p.s); dust.splice(i,1); continue; } p.s.position.x+=p.vx*dt; p.s.position.y+=p.vy*dt; p.s.position.z+=p.vz*dt; p.s.material.opacity=.5*Math.sin(Math.min(1,k*1.6)*PI)*(1-k*.4); p.s.scale.setScalar(p.s.scale.x+dt*2.2); }
  for(const sp of SPOTS) if(sp.flash>0){ sp.flash=Math.max(0,sp.flash-dt*.5); if(sp.light) sp.light.intensity=3.8+sp.flash*3.5; }
  if(!isGuest()&&walls.some(w=>!w.broken)&&window.__staff&&window.__staff.boltList){ const bl=window.__staff.boltList(); if(bl.length) for(const b of bl){ if(!b.mine||b.y>OPEN_H+1) continue; for(const w of walls){ if(w.broken) continue; const sp=w.spot; if(nearPlane(sp,b.x,b.z,2.1)) { const np=nearPt(sp,b.x,b.z); w.hit(HIT,new THREE.Vector3(np.x,1.6,np.z),new THREE.Vector3(-sp.nx,0,-sp.nz)); } } } } });
// ---- build 368 (Matt, playing the Archer: "it was going awesomely till i was on the archer and didn't have a sword"): the bow's arrows break the rooms' walls too -- an arrow of the bow module (83-bow.js) that reaches a wall's plane, flying INTO it, counts as a blow of 25, like a sword swing or a staff bolt (four break one)
function arrowBlows(){ if(isGuest()||!window.__bow||!window.__bow.arrows||!window.__bow.arrows()) return; if(!walls.some(w=>!w.broken)) return;
  for(const a of window.__bow.flying()){ if(a.y>OPEN_H+1) continue; for(const w of walls){ if(w.broken) continue; const sp=w.spot; if(!nearPlane(sp,a.x,a.z,2.6)) continue; if(a.dx*-sp.nx+a.dz*-sp.nz<.25) continue; const np=nearPt(sp,a.x,a.z); w.hit(HIT,new THREE.Vector3(np.x,Math.min(Math.max(a.y,.5),OPEN_H),np.z),new THREE.Vector3(-sp.nx,0,-sp.nz)); cnt.arrowHits=(cnt.arrowHits||0)+1; } } }
WORLDANIM.push(()=>arrowBlows());
window.__prisonwalls={ shatter, BreakableWall, AMMO, REARM, mounts:()=>mounts, spots:()=>SPOTS, raw:()=>walls, walls:()=>walls.map(w=>({ id:w.spot.id, kind:w.kind, health:w.health, broken:w.broken, locked:!!w.locked, awake:!!w.awake, x:+w.group.position.x.toFixed(2), z:+w.group.position.z.toFixed(2), chunks:w.chunks.length, debris:w.fragments.visible, glow:!!(w.beacon&&w.beacon.gs.parent) })),
  hit:(id,n)=>{ const w=walls.find(x=>x.spot.id===id); if(!w) return false; const sp=w.spot; w.time+=1; return w.hit(n||HIT,new THREE.Vector3(sp.cx0,1.5,sp.cz0),new THREE.Vector3(-sp.nx,0,-sp.nz)); },
  mortProto:()=>MORT.proto,
  mortars:()=>mounts.map(m=>({ id:m.sp.id, rolled:m.rolled, fires:m.fires, ammo:m.d.ammo===undefined?AMMO:m.d.ammo, dry:!!m.d.dry, pipsLit:(m.pips||[]).filter((s,i)=>s.visible&&i<(m.d.ammo===undefined?AMMO:m.d.ammo)).length, hasMuzzle:!!m.muzzle, shells:flying.length, clips:MORT.clips.map(c=>c.name) })),
  spots:()=>SPOTS.map(s=>({ id:s.id, open:!!s.def, def:s.def?{ rot:s.def.rot, kind:s.def.kind, lvl:s.def.lvl, secret:!!s.def.secret, hp:s.def.hp, max:s.def.max }:null })), info:()=>Object.assign({},cnt) };
})();
