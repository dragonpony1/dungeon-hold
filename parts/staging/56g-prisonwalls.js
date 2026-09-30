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
// two kinds of breakable wall (Matt: "we have 2 types of destrucable wall"): the west one is Bob's (48 modelled pieces), the east one is Matt's Meshy wall with the glowing crack (one solid model -- shattered here, at load, into
// shards along organic lines, which fall with the same scripted tumble)
// build 348 (Matt: "Make it 4x4 on both sides to start with"): each wall is now 4 squares wide and 4 tall (8 x 8), over an alcove 4 squares long and 2 deep. cin: the alcove column against the wall, cout: the one behind it, fcx: the pit column in front, z0-z1: its rows
const SPOTS=[{id:'W',nx:1,cin:18,cout:17,fcx:19,z0:5,z1:8,kind:'harpoon',src:'hi3d'},{id:'E',nx:-1,cin:28,cout:29,fcx:27,z0:5,z1:8,kind:'acorn',src:'meshy'}];
for(const sp of SPOTS){ sp.px=cw(sp.cin)+sp.nx*CELL/2; sp.zc=(cwz(sp.z0)+cwz(sp.z1))/2; sp.zh=(cwz(sp.z1)-cwz(sp.z0))/2+CELL/2; }
const clampZ=(sp,z)=>Math.max(sp.zc-sp.zh,Math.min(sp.zc+sp.zh,z));
const LVL=6, TOUGH=2;
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
  hit(dmg,point,dir){ if(this.broken||this.time-this.lastHit<.18||!(dmg>0)) return false; this.lastHit=this.time; this.health=Math.max(0,this.health-dmg); this.shake=.20; this.o.onHit(this,point); if(!this.health) this.destroy(point,dir); return true; }
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
const walls=[]; let cellWall=null; const dust=[]; const timers=[]; const cnt={ built:0, hits:0, broken:0, weapons:0 };
function faceIndex(cx,cz,nx){ return wallFaces.findIndex(f=>f.cx===cx&&f.cz===cz&&f.nx===nx&&f.nz===0); }
// the wall face in front of the alcove is drawn from the top of the opening up (so the opening itself is clear to open); until it breaks, Bob's wall fills it
function lowerQuad(i,y){ if(!cellWall||i<0) return; const g=cellWall.geometry, p=g.attributes.position, uv=g.attributes.uv; for(const k of [0,3]){ p.setY(4*i+k,y); uv.setY(4*i+k,y/CELL); } p.needsUpdate=true; uv.needsUpdate=true; }
function lowerFaces(sp,y){ for(let r=sp.z0;r<=sp.z1;r++) lowerQuad(faceIndex(sp.fcx,r,sp.nx),y); }
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
function openAlcove(sp){ const nx=sp.nx, px=sp.px, zc=sp.zc, zh=sp.zh, dep=2*CELL, xm=px-nx*dep/2;
  for(const cc of [sp.cin,sp.cout]) for(let r=sp.z0;r<=sp.z1;r++){ grid[idx(cc,r)]=T.FLOOR; hgt[idx(cc,r)]=0; } reflow();
  const dark=mat(0x2c3628,{side:THREE.DoubleSide}); const add=(w,h,pxx,py,pz,ry,rx)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),dark); m.position.set(pxx,py,pz); m.rotation.set(rx||0,ry||0,0); m.userData.noOL=true; world.add(m); };
  // the alcove's floor, ceiling, back and two sides
  add(dep,2*zh,xm,.03,zc,0,-PI/2); add(dep,2*zh,xm,OPEN_H-.03,zc,0,PI/2); add(2*zh,OPEN_H,px-nx*dep,OPEN_H/2,zc,nx>0?PI/2:-PI/2); add(dep,OPEN_H,xm,OPEN_H/2,zc-zh,0); add(dep,OPEN_H,xm,OPEN_H/2,zc+zh,0);
  const l=new THREE.PointLight(C(0xffc870),3.2,20,2); l.position.set(px-nx*1.5,4,zc); world.add(l); sp.light=l; sp.flash=1;
  puff(px+nx*1.4,1,zc,18,2*zh);
  // the weapon: a real defense, placed free (its mana and defense units handed straight back), Mark VI, tougher than a built one, not for sale
  const x=cw(sp.cin), m0=S.mana; const d=placeDefAt(sp.kind,x,zc,nx>0?PI/2:-PI/2); S.mana=m0; S.du-=DEFS[sp.kind].du; d.spent=0; d.secret=true; d.lvl=LVL; d.max=Math.round(DEFS[sp.kind].hp*(1+.4*(LVL-1)))*TOUGH; d.hp=d.max; d.pop=0; sp.def=d; cnt.weapons++;
  floatText(x,d.top+1.6,zc,'🔓 '+DEFS[sp.kind].ic,'#e8b94a'); try{ SFX.place&&SFX.place(); }catch(e){} }
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
  try{ plainWall(intact); bakeTile(intact); }catch(e){ console.warn('prison walls plain',e); }
  for(const sp of SPOTS){ if(faceIndex(sp.fcx,sp.z0,sp.nx)<0){ console.warn('prison walls: no wall face at',sp.fcx,sp.z0); continue; }
    cellWall=cellWall||world.userData.cellWall; lowerFaces(sp,OPEN_H);
    const meshy=sp.src==='meshy'&&shards, wScale=meshy?OPEN_H/1.925:SCALE;
    const w=new BreakableWall(meshy?wall2.clone(true):intact.clone(true),meshy?shards:frag.clone(true),{ gravity:9.81/wScale, onHit:(ww,pt)=>{ cnt.hits++; try{ SFX.hit&&SFX.hit(); }catch(e){} puff(pt?pt.x:0,2.5,pt?pt.z:0,2,sp.zh*1.6); },
      onBreak:(ww,pt)=>{ cnt.broken++; try{ SFX.boom&&SFX.boom(); SFX.hit&&SFX.hit(); }catch(e){} puff(sp.px,2.5,sp.zc,22,sp.zh*2); timers.push({ t:.8, fn:()=>openAlcove(sp) }); } });
    const face=sp.px, back=.47*wScale/2;   // the wall's front on the opening's plane, its thickness behind it, in the alcove
    w.group.scale.setScalar(wScale); w.group.position.set(face-sp.nx*back,0,sp.zc); w.group.rotation.y=sp.nx>0?PI/2:-PI/2; world.add(w.group); w.spot=sp; w.kind=meshy?'meshy':'hi3d';
    // a soft gold glow (green on the Meshy wall's glowing crack) breathes over the wall until it breaks
    { const col=meshy?0x70ff90:0xffc860, gs=glow(col,13,.5); gs.position.set(face+sp.nx*.8,OPEN_H/2,sp.zc); world.add(gs); const gl=new THREE.PointLight(C(col),2.2,16,2); gl.position.set(face+sp.nx*1.6,OPEN_H/2,sp.zc); world.add(gl); w.beacon={ gs, gl, ph:Math.random()*6 }; } sp.wall=w; walls.push(w); cnt.built++; }
}).catch(e=>console.warn('prison walls',e));
// ---------------- what breaks them: your sword's swing, or a staff bolt of yours
function nearPlane(sp,x,z,r){ return Math.hypot(x-sp.px,z-clampZ(sp,z))<r; }
function meleeWalls(){ if(isGuest()) return; const fx=Math.sin(hero.yaw), fz=Math.cos(hero.yaw);
  for(const w of walls){ if(w.broken) continue; const sp=w.spot, wx=sp.px, wz=clampZ(sp,hero.z), dx=wx-hero.x, dz=wz-hero.z, d=Math.hypot(dx,dz);
    if(d<Math.min(hero.reach||2.4,3.2)+1.8&&(dx*fx+dz*fz)/Math.max(d,.01)>.25) w.hit(HIT,new THREE.Vector3(wx,1.5,wz),new THREE.Vector3(fx,0,fz)); } }
{ const prev=hitCone; hitCone=function(){ prev.apply(this,arguments); meleeWalls(); }; }
// the secret weapons are not for sale, and giving one back hands back the defense units it never took
{ const prevSell=sell; sell=function(pos){ const d=typeof pickDef==='function'?pickDef(pos):null; if(d&&d.secret){ toast('🔒 A secret weapon'); return; } return prevSell.apply(this,arguments); }; }
{ const prevRemove=removeDef; removeDef=function(d){ const s=d&&d.secret; prevRemove.apply(this,arguments); if(s) S.du+=DEFS[d.kind].du; }; }
// ---------------- per frame: the walls, the dust, the light flash, the opening timers, the staff bolts
let clock=0;
WORLDANIM.push(dt=>{ clock+=dt; for(const w of walls) w.update(dt);
  for(const w of walls){ const b=w.beacon; if(!b) continue; if(w.broken){ world.remove(b.gs); world.remove(b.gl); w.beacon=null; continue; } const k=.5+.5*Math.sin(clock*2.2+b.ph); b.gs.material.opacity=.3+.5*k; b.gl.intensity=.9+1.6*k; }
  for(let i=timers.length-1;i>=0;i--){ const t=timers[i]; t.t-=dt; if(t.t<=0){ timers.splice(i,1); try{ t.fn(); }catch(e){ console.warn('prison walls',e); } } }
  for(let i=dust.length-1;i>=0;i--){ const p=dust[i]; p.t+=dt; const k=p.t/p.life; if(k>=1){ world.remove(p.s); dust.splice(i,1); continue; } p.s.position.x+=p.vx*dt; p.s.position.y+=p.vy*dt; p.s.position.z+=p.vz*dt; p.s.material.opacity=.5*Math.sin(Math.min(1,k*1.6)*PI)*(1-k*.4); p.s.scale.setScalar(p.s.scale.x+dt*2.2); }
  for(const sp of SPOTS) if(sp.flash>0){ sp.flash=Math.max(0,sp.flash-dt*.5); if(sp.light) sp.light.intensity=2.4+sp.flash*3.5; }
  if(!isGuest()&&walls.some(w=>!w.broken)&&window.__staff&&window.__staff.boltList){ const bl=window.__staff.boltList(); if(bl.length) for(const b of bl){ if(!b.mine||b.y>OPEN_H+1) continue; for(const w of walls){ if(w.broken) continue; const sp=w.spot; if(nearPlane(sp,b.x,b.z,2.1)) w.hit(HIT,new THREE.Vector3(sp.px,1.6,clampZ(sp,b.z)),new THREE.Vector3(-sp.nx,0,0)); } } } });
window.__prisonwalls={ walls:()=>walls.map(w=>({ id:w.spot.id, kind:w.kind, health:w.health, broken:w.broken, x:+w.group.position.x.toFixed(2), z:+w.group.position.z.toFixed(2), chunks:w.chunks.length, debris:w.fragments.visible, glow:!!(w.beacon&&w.beacon.gs.parent) })),
  hit:(id,n)=>{ const w=walls.find(x=>x.spot.id===id); if(!w) return false; const sp=w.spot; w.time+=1; return w.hit(n||HIT,new THREE.Vector3(sp.px,1.5,sp.zc),new THREE.Vector3(-sp.nx,0,0)); },
  spots:()=>SPOTS.map(s=>({ id:s.id, open:!!s.def, def:s.def?{ kind:s.def.kind, lvl:s.def.lvl, secret:!!s.def.secret, hp:s.def.hp, max:s.def.max }:null })), info:()=>Object.assign({},cnt) };
})();
