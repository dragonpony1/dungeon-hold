// ===== THE WHITE TREE LINKS -- MINI GOLF ON THE DRAWBRIDGE'S WEST GREEN (build 480). Matt: "that entire grassy area on the side by the white tree becomes a miniature golf mini game all around it ...
// it breaks things up and adds a quirky detail" -- "play for sludge" -- (to the map) "build it as in your map" -- "let's make our rewards more, the next map is the end and they need to be geared up for it" /
// "just more legendary sludge to gamble with". His art (Pictures\dungeon art,\drawbridge\mini golf; Bob animated the windmill, drawbridge and catapult), cut down by tools/glb-compact.mjs: parts/assets/golf-*.glb.
//   * FOUR HOLES round the white tree, par 11: 1 THE RAMPART (two stone towers to thread), 2 THE MILL (through the arch while the sails are clear), 3 THE DRAWBRIDGE (across the moat while the bridge is
//     down -- else into the water and back to the tee), 4 THE SIEGE (into the catapult's cup; it flings the ball to an island green by the tree).
//   * PUTTING: walk onto a tee in the BUILD phase and press E -- the hero takes the putter. Aim with the camera, HOLD the mouse button (the power swings up and back), let go to putt. E walks away.
//   * EVERY HOLE ONCE A RUN (walking away after a stroke counts it). It pays LEGENDARY sludge jars at the cup: hole-in-one 6, under par 4, par 2, over par 1 (my call: the next map is the last, so
//     every finish pays something); the whole course under par adds 5 more. Seven strokes and the hole is closed.
//   * The north strip of the green, where the west gate's horde walks to the drawbridge, is left clear; the course is scenery to the horde (it walks over it) and to the hero's feet.
// Only MAP.id==='moat', campaign. Test hook: window.__golf.
(function(){
'use strict';
window.__golf={ info:()=>({ on:false }) };
if(TUTORIAL||!MAP||MAP.id!=='moat') return;
const P=MAP.padN|0, W=(cx,cz)=>({ x:cw(cx), z:cwz(cz+P) });
const FW=1.35, BR=.17, TURF=.07, WALL_H=.42, WALL_D=.2, MAXST=7;
const PAY=(s,par)=>s===1?6:s<par?4:s===par?2:1, BONUS=5;
// each hole: its fairway's points (map squares), its tee and cup, and the one thing in its way
const HOLES=[
  { n:1, name:'THE RAMPART', par:2, pts:[[4,52],[4,40]], tee:[4,51.3], cup:[4,40.7], bumpers:[[3.6,47.2],[4.45,44.6]], castle:[6.1,46.2] },
  { n:2, name:'THE MILL', par:3, pts:[[4,37.4],[4,32],[9,30]], tee:[4,36.8], cup:[8.4,30.25], mill:{ at:[4,34.1], seg:0 } },
  { n:3, name:'THE DRAWBRIDGE', par:3, pts:[[13,29.6],[15,33.6],[15,39.6]], tee:[13.2,30.1], cup:[15,39], bridge:{ at:[15,36.1], seg:1 } },
  { n:4, name:'THE SIEGE', par:3, pts:[[20.2,52.6],[15.4,52.6],[15.4,50.7]], tee:[19.6,52.6], cat:{ at:[15.4,49.55] }, island:[14.6,45.2,2.5] } ];
for(const h of HOLES){ h.wp=h.pts.map(([x,z])=>W(x,z)); h.T=W(h.tee[0],h.tee[1]); if(h.cup) h.C=W(h.cup[0],h.cup[1]);
  h.segs=[]; for(let i=0;i<h.wp.length-1;i++){ const a=h.wp[i], b=h.wp[i+1], dx=b.x-a.x, dz=b.z-a.z, L=Math.hypot(dx,dz); h.segs.push({ ax:a.x, az:a.z, bx:b.x, bz:b.z, dx:dx/L, dz:dz/L, L }); }
  if(h.island){ const c=W(h.island[0],h.island[1]); h.I={ x:c.x, z:c.z, r:h.island[2] }; h.C={ x:c.x+.35, z:c.z-.25 }; } }
const cnt={ built:0, models:0, putts:0, holed:0, splashes:0, flings:0, jars:0 };
// ---------------------------------------------------------------- the course: turf, low stone-and-gold walls (his modular wall), the island
const turfTex=(()=>{ const c=document.createElement('canvas'); c.width=64; c.height=64; const g=c.getContext('2d'); for(let i=0;i<8;i++){ g.fillStyle=i%2?'#3faa38':'#49b842'; g.fillRect(i*8,0,8,64); } for(let i=0;i<220;i++){ g.fillStyle=Math.random()<.5?'#2f8f2c':'#5cc954'; g.fillRect(Math.random()*64,Math.random()*64,1,2); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; return t; })();
const turfM=new THREE.MeshToonMaterial({ map:turfTex, gradientMap:GRAD, color:C(0xffffff) });
const COURSE=new THREE.Group(); world.add(COURSE);
const yawX=(dx,dz)=>Math.atan2(-dz,dx);   // turn a thing whose length lies along its own x so it lies along (dx,dz)
const wallSpans=[];   // [x0,z0,x1,z1] -- one wall piece each, drawn when his model arrives
function strip(ax,az,bx,bz,w){ const dx=bx-ax, dz=bz-az, L=Math.hypot(dx,dz); const g=new THREE.PlaneGeometry(L,w); const uv=g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*L/2.5,uv.getY(i)*w/2.5);
  const m=new THREE.Mesh(g,turfM); m.rotation.order='YXZ'; m.rotation.set(-PI/2,yawX(dx,dz),0); m.position.set((ax+bx)/2,TURF,(az+bz)/2); m.userData.noOL=true; COURSE.add(m); }
function disc(x,z,r){ const g=new THREE.CircleGeometry(r,28); const uv=g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*r*.8,uv.getY(i)*r*.8); const m=new THREE.Mesh(g,turfM); m.rotation.x=-PI/2; m.position.set(x,TURF+.002,z); m.userData.noOL=true; COURSE.add(m); }
for(const h of HOLES){ const S=h.segs, last=S.length-1;
  S.forEach((s,i)=>{ const ax=s.ax-(i===0?s.dx*FW:0), az=s.az-(i===0?s.dz*FW:0), bx=s.bx+(i===last?s.dx*FW:0), bz=s.bz+(i===last?s.dz*FW:0); strip(ax,az,bx,bz,FW*2); if(i>0) disc(s.ax,s.az,FW); });
  // the side walls: each side's line offset FW, joined at the bends (mitred), capped across both ends
  for(const sd of [1,-1]){ const line=[]; S.forEach((s,i)=>{ const nx=-s.dz*sd, nz=s.dx*sd;
      if(i===0) line.push([s.ax-s.dx*FW+nx*FW,s.az-s.dz*FW+nz*FW]);
      if(i>0){ const p=S[i-1], pnx=-p.dz*sd, pnz=p.dx*sd; let mx=pnx+nx, mz=pnz+nz; const ml=Math.hypot(mx,mz)||1; mx/=ml; mz/=ml; const k=FW/Math.max(.35,mx*nx+mz*nz); line.push([s.ax+mx*k,s.az+mz*k]); }
      if(i===last) line.push([s.bx+s.dx*FW+nx*FW,s.bz+s.dz*FW+nz*FW]); });
    for(let i=0;i<line.length-1;i++) wallSpans.push([line[i][0],line[i][1],line[i+1][0],line[i+1][1],sd]); }
  const s0=S[0], sl=S[last]; wallSpans.push([s0.ax-s0.dx*FW-s0.dz*FW,s0.az-s0.dz*FW+s0.dx*FW,s0.ax-s0.dx*FW+s0.dz*FW,s0.az-s0.dz*FW-s0.dx*FW,0]);
  if(!h.cat) wallSpans.push([sl.bx+sl.dx*FW+sl.dz*FW,sl.bz+sl.dz*FW-sl.dx*FW,sl.bx+sl.dx*FW-sl.dz*FW,sl.bz+sl.dz*FW+sl.dx*FW,0]);
  if(h.I){ disc(h.I.x,h.I.z,h.I.r+.15); const N=16; for(let k=0;k<N;k++){ const a0=k/N*TAU, a1=(k+1)/N*TAU, R=h.I.r+.2; wallSpans.push([h.I.x+Math.cos(a0)*R,h.I.z+Math.sin(a0)*R,h.I.x+Math.cos(a1)*R,h.I.z+Math.sin(a1)*R,0]); } }
  cnt.built++; }
// hole 1's two stone towers to thread (code-built: little round towers in the course's stone, purple and gold)
const stoneM=mat(0xd8d2e0), roofM=mat(0x7a3ad0), goldM=mat(0xe8b94a);
for(const h of HOLES) for(const b of (h.bumpers||[])){ const p=W(b[0],b[1]); const g=new THREE.Group(); g.position.set(p.x,TURF,p.z); g.add(M(G.cyl(.34,.36,.85,12),stoneM,0,.42,0)); g.add(M(G.cyl(.4,.4,.08,12),goldM,0,.86,0)); g.add(M(G.cone(.38,.55,12),roofM,0,1.17,0)); COURSE.add(outline(g)); (h.bump=h.bump||[]).push({ x:p.x, z:p.z, r:.36 }); }
// ---------------------------------------------------------------- his models
const parse=n=>fetchBytes(ASSET(n),'later').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej)));
function fit(root,axis,size){ root.updateMatrixWorld(true); const box=new THREE.Box3().setFromObject(root), sz=box.getSize(new THREE.Vector3()), sc=size/Math.max(sz[axis],1e-6);
  const inner=new THREE.Group(); inner.add(root); inner.scale.setScalar(sc); inner.position.set(-(box.min.x+box.max.x)/2*sc,-box.min.y*sc,-(box.min.z+box.max.z)/2*sc); toonify(root,sc); const w=new THREE.Group(); w.add(inner); return { w, sc, root }; }
const MIX=[];   // [mixer] -- ticked every frame
parse('golf-wall.glb').then(gl=>{ const root=gl.scene; root.updateMatrixWorld(true); toonify(root,1); let mesh=null; root.traverse(o=>{ if(o.isMesh&&!o.userData.isOL&&!mesh) mesh=o; }); if(!mesh) return;
  const g=mesh.geometry.clone(); g.applyMatrix4(mesh.matrixWorld); g.computeBoundingBox(); const b=g.boundingBox, s=new THREE.Vector3(); b.getSize(s); g.translate(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2); g.scale(1/s.x,1/s.y,1/s.z); g.computeVertexNormals();
  const mats=[], q=new THREE.Quaternion(), up=new THREE.Vector3(0,1,0);
  for(const [x0,z0,x1,z1] of wallSpans){ const dx=x1-x0, dz=z1-z0, L=Math.hypot(dx,dz); if(L<.05) continue; const n=Math.max(1,Math.round(L/2.2)); q.setFromAxisAngle(up,yawX(dx,dz));
    for(let k=0;k<n;k++){ const t=(k+.5)/n; mats.push(new THREE.Matrix4().compose(new THREE.Vector3(x0+dx*t,0,z0+dz*t),q,new THREE.Vector3(L/n+.06,WALL_H,WALL_D))); } }
  const im=new THREE.InstancedMesh(g,mesh.material,mats.length); mats.forEach((m,i)=>im.setMatrixAt(i,m)); im.instanceMatrix.needsUpdate=true; im.frustumCulled=false; im.userData.noOL=true; COURSE.add(im); cnt.models++; }).catch(e=>console.warn('golf wall',e));
const TEES=[]; parse('golf-tee.glb').then(gl=>{ for(const h of HOLES){ const d=h.segs[0]; const f=fit(gl.scene.clone(),'z',2.5); f.w.position.set(h.T.x-d.dx*.35,0,h.T.z-d.dz*.35); f.w.rotation.y=Math.atan2(-d.dx,-d.dz); COURSE.add(f.w); TEES.push(f.w); } cnt.models++; }).catch(e=>console.warn('golf tee',e));
parse('golf-cup.glb').then(gl=>{ for(const h of HOLES){ const f=fit(gl.scene.clone(),'x',1.7); f.w.position.set(h.C.x,-.06,h.C.z); COURSE.add(f.w); } cnt.models++; }).catch(e=>console.warn('golf cup',e));
parse('golf-castle.glb').then(gl=>{ const h=HOLES[0], p=W(h.castle[0],h.castle[1]); const f=fit(gl.scene,'x',9); f.w.position.set(p.x,0,p.z); f.w.rotation.y=-PI/2; COURSE.add(f.w); cnt.models++; }).catch(e=>console.warn('golf castle',e));
// THE MILL: its lane runs along its own z, the sails on the +z face; the ball comes in from +z
const MILL={ sc:2.2, lane:.62, front:-.62, back:1.25, mixer:null, act:null };
parse('golf-windmill.glb').then(gl=>{ const h=HOLES[1], p=W(h.mill.at[0],h.mill.at[1]), d=h.segs[h.mill.seg]; const f=fit(gl.scene,'z',1.94*MILL.sc); f.w.position.set(p.x,0,p.z); f.w.rotation.y=Math.atan2(-d.dx,-d.dz); COURSE.add(f.w);
  MILL.mixer=new THREE.AnimationMixer(f.root); MILL.act=MILL.mixer.clipAction(gl.animations[0]); MILL.act.play(); MIX.push(MILL.mixer); cnt.models++; }).catch(e=>console.warn('golf mill',e));
const millOpen=()=>{ if(!MILL.act) return true; const t=(MILL.act.time%1+1)%1; return t<.24||t>.76; };   // four sails a turn every 4 s: one hangs across the arch for about half of each second
// THE DRAWBRIDGE: its lane along its own z, the moat at the +z end, where the ball comes in; down or up read off the bridge bone
const BRIDGE={ sc:3.7, lane:.6, entry:-3.5, moat0:-3.15, moat1:-1.05, exit:3.5, mixer:null, act:null, track:null, up:null, maxA:1 };
parse('golf-drawbridge.glb').then(gl=>{ const h=HOLES[2], p=W(h.bridge.at[0],h.bridge.at[1]), d=h.segs[h.bridge.seg]; const f=fit(gl.scene,'z',1.9*BRIDGE.sc); f.w.position.set(p.x,0,p.z); f.w.rotation.y=Math.atan2(-d.dx,-d.dz); COURSE.add(f.w);
  const clip=gl.animations.find(a=>a.name==='Bridge_Cycle')||gl.animations[0]; BRIDGE.mixer=new THREE.AnimationMixer(f.root); BRIDGE.act=BRIDGE.mixer.clipAction(clip); BRIDGE.act.play(); MIX.push(BRIDGE.mixer);
  const tr=clip.tracks.find(t=>/Bridge\.quaternion$/.test(t.name)); if(tr){ const it=tr.createInterpolant(); const q0=new THREE.Quaternion().fromArray(it.evaluate(0)); BRIDGE.track=it; BRIDGE.up=q0; let mx=0; for(let t=0;t<clip.duration;t+=.05){ const a=q0.angleTo(new THREE.Quaternion().fromArray(it.evaluate(t))); if(a>mx) mx=a; } BRIDGE.maxA=mx||1; }
  cnt.models++; }).catch(e=>console.warn('golf bridge',e));
const bridgeDown=()=>{ if(!BRIDGE.track||!BRIDGE.act) return true; const a=BRIDGE.up.angleTo(new THREE.Quaternion().fromArray(BRIDGE.track.evaluate(BRIDGE.act.time))); return a>BRIDGE.maxA*.82; };
// THE SIEGE: the catapult's length along its own x, the cup at -x, it throws toward +x -- turned to throw north at the island
const CAT={ sc:2.2, mixer:null, idle:null, fling:null };
parse('golf-catapult.glb').then(gl=>{ const h=HOLES[3], p=W(h.cat.at[0],h.cat.at[1]); const f=fit(gl.scene,'x',2*CAT.sc); f.w.position.set(p.x,0,p.z); const tx=h.I.x-p.x, tz=h.I.z-p.z; f.w.rotation.y=yawX(tx,tz); COURSE.add(f.w);
  CAT.mixer=new THREE.AnimationMixer(f.root); const by=n=>gl.animations.find(a=>a.name===n); CAT.idle=CAT.mixer.clipAction(by('Loaded_Idle')||gl.animations[0]); CAT.idle.play(); const fl=by('Fling'); if(fl){ CAT.fling=CAT.mixer.clipAction(fl); CAT.fling.setLoop(THREE.LoopOnce,1); CAT.fling.clampWhenFinished=true; }
  MIX.push(CAT.mixer); cnt.models++; }).catch(e=>console.warn('golf catapult',e));
let ballProto=null, putterProto=null;
parse('golf-ball.glb').then(gl=>{ const f=fit(gl.scene,'y',BR*2); f.w.children[0].position.y-=BR; ballProto=f.w; cnt.models++; })   // build 484 (Matt: "can the ball roll any smoother"): the ball turns about its own CENTRE -- fit() roots a model at its foot, and a ball spun about its foot wobbled and bobbed as it rolled.catch(e=>console.warn('golf ball',e));
parse('golf-putter.glb').then(gl=>{ putterProto=fit(gl.scene,'y',1.55).w; cnt.models++; }).catch(e=>console.warn('golf putter',e));
WORLDANIM.push(dt=>{ for(const m of MIX) m.update(dt); });
// ---------------------------------------------------------------- the round
const GF={ on:false, h:null, st:0, ball:null, b:null, charging:false, ct:0, power:0, aim:{ x:0, z:-1 }, putter:null, swing:0, done:{}, result:{}, total:0, wait:0 };
const done=n=>GF.done[n]!==undefined;
const nearTee=()=>{ if(S.phase!=='build') return null; let best=null, bd=2.4; for(const h of HOLES){ if(done(h.n)) continue; const d=Math.hypot(hero.x-h.T.x,hero.z-h.T.z); if(d<bd&&Math.abs((hero.y||0))<1){ bd=d; best=h; } } return best; };
function ballMesh(){ const g=ballProto?ballProto.clone():M(G.sph(BR,12,10),mat(0xffffff)); scene.add(g); return g; }
function start(h){ if(!h||GF.on||done(h.n)) return false; GF.on=true; GF.h=h; GF.st=0; const d=h.segs[0]; GF.aim={ x:d.dx, z:d.dz }; GF.b={ x:h.T.x, z:h.T.z, vx:0, vz:0, moving:false, region:'fw', flight:null, crossed:{} };
  cam.yaw=Math.atan2(d.dx,d.dz); if(cam.pitch!==undefined) cam.pitch=Math.max(cam.pitch,.32);   /* the camera turns to look down the fairway (game.js updateCamera: it looks along sin/cos of its yaw) */ GF.ball=ballMesh(); if(!GF.putter){ GF.putter=new THREE.Group(); if(putterProto){ const p=putterProto.clone(); p.position.y=-1.5; GF.putter.add(p); } else GF.putter.add(M(G.cyl(.04,.04,1.5,6),goldM,0,-.75,0)); scene.add(GF.putter); }
  GF.putter.visible=true; hud(true); return true; }
function stop(){ if(!GF.on) return; if(GF.st>0&&GF.result[GF.h.n]===undefined){ GF.done[GF.h.n]='left'; } GF.on=false; if(GF.ball){ scene.remove(GF.ball); GF.ball=null; } if(GF.putter) GF.putter.visible=false; GF.charging=false; hud(false); }
function toTee(why){ const h=GF.h; GF.b.x=h.T.x; GF.b.z=h.T.z; GF.b.vx=GF.b.vz=0; GF.b.moving=false; GF.b.region='fw'; GF.b.flight=null; GF.b.crossed={}; GF.st++; cnt.splashes++;
  floatText(h.T.x,1.4,h.T.z,why==='moat'?'💦 +1':'⛔ +1','#8ad8ff'); if(GF.st>=MAXST) finish(false); }
function finish(holed){ const h=GF.h, s=GF.st; if(holed){ const n=PAY(s,h.par); GF.done[h.n]=s; GF.result[h.n]=s; cnt.holed++;
    const pip=s===1?'⛳ ACE!':s<h.par?'★ '+s:s===h.par?'✓ '+s:'● '+s; floatText(h.C.x,2.2,h.C.z,pip,'#ffd27a');
    if(s===1){ banner('⛳ HOLE IN ONE!',h.name); camShake=Math.max(camShake,.3); }
    for(let i=0;i<n;i++) setTimeout(()=>{ if(window.__jars&&window.__jars.spawn){ window.__jars.spawn(3,h.C.x,h.C.z); cnt.jars++; } },180*i);
    if(HOLES.every(x=>GF.result[x.n]!==undefined)){ const tot=HOLES.reduce((a,x)=>a+GF.result[x.n],0); GF.total=tot; if(tot<HOLES.reduce((a,x)=>a+x.par,0)){ banner('🏆 UNDER PAR','the White Tree Links'); for(let i=0;i<BONUS;i++) setTimeout(()=>{ window.__jars&&window.__jars.spawn(3,h.C.x,h.C.z); cnt.jars++; },900+180*i); } } }
  else { GF.done[h.n]=s; floatText(h.T.x,1.8,h.T.z,'✖','#ff8a8a'); }
  setTimeout(stop,holed?900:400); }
function putt(){ if(!GF.on||GF.b.moving||GF.b.flight) return; const v=1.2+GF.power*12.5; GF.b.vx=GF.aim.x*v; GF.b.vz=GF.aim.z*v; GF.b.moving=true; GF.st++; cnt.putts++; GF.swing=1; try{ SFX.hit&&SFX.hit(); }catch(e){} GF.power=0; }
// ---------------------------------------------------------------- the ball's roll: the fairway (a run of rounded strips), hole 1's towers, the mill's arch, the moat, the catapult, the island
function closest(s,x,z){ const t=Math.max(0,Math.min(s.L,(x-s.ax)*s.dx+(z-s.az)*s.dz)); return { x:s.ax+s.dx*t, z:s.az+s.dz*t, t }; }
function bounce(b,nx,nz,e){ const vn=b.vx*nx+b.vz*nz; if(vn<0){ b.vx-=(1+e)*vn*nx; b.vz-=(1+e)*vn*nz; } }
function gate(b,h,o,i){ // an obstacle with a narrow lane: the ball meets its face; inside it is held to the lane
  const s=h.segs[i], p=W(o.at[0],o.at[1]); const sA=(b.x-p.x)*s.dx+(b.z-p.z)*s.dz, lat=-(b.x-p.x)*s.dz+(b.z-p.z)*s.dx; return { sA, lat, s, p }; }
const ROLL_C=.55, ROLL_K=.35;   // build 484 (was 1.6 and .22): about the same full-power roll (29 units against 27), a much softer finish
function step(dt){ const b=GF.b, h=GF.h; if(b.flight){ const f=b.flight; f.t+=dt; const k=Math.max(0,Math.min(1,f.t/f.T)); b.x=f.x0+(f.x1-f.x0)*k; b.z=f.z0+(f.z1-f.z0)*k; b.y=TURF+BR+f.H*4*k*(1-k)+(f.y1-TURF-BR)*k;
    if(k>=1){ b.flight=null; b.y=null; if(f.lost){ toTee('out'); return; } b.region='island'; b.vx=f.vx; b.vz=f.vz; b.moving=true; if(f.ace){ holedNow(); return; } } return; }
  if(!b.moving) return;
  const sp=Math.hypot(b.vx,b.vz), dec=(ROLL_C+ROLL_K*sp)*dt; if(sp<=dec||sp<.04){ b.vx=b.vz=0; b.moving=false; return; } b.vx-=b.vx/sp*dec; b.vz-=b.vz/sp*dec;   // build 484: mostly a gliding slow-down in proportion to its speed, little flat braking -- it eases to a stop instead of braking hard and halting
  const nx0=b.x, nz0=b.z; b.x+=b.vx*dt; b.z+=b.vz*dt;
  if(b.region==='island'){ const I=h.I, dx=b.x-I.x, dz=b.z-I.z, d=Math.hypot(dx,dz), lim=I.r-BR; if(d>lim){ b.x=I.x+dx/d*lim; b.z=I.z+dz/d*lim; bounce(b,-dx/d,-dz/d,.7); } }
  else { let best=null, bd=1e9; for(const s of h.segs){ const c=closest(s,b.x,b.z), d=Math.hypot(b.x-c.x,b.z-c.z); if(d<bd){ bd=d; best=c; } } const lim=FW-BR-.02; if(bd>lim){ const nx=(b.x-best.x)/bd, nz=(b.z-best.z)/bd; b.x=best.x+nx*lim; b.z=best.z+nz*lim; bounce(b,-nx,-nz,.72); } }
  for(const t of (h.bump||[])){ const dx=b.x-t.x, dz=b.z-t.z, d=Math.hypot(dx,dz), lim=t.r+BR; if(d<lim){ const nx=dx/d, nz=dz/d; b.x=t.x+nx*lim; b.z=t.z+nz*lim; bounce(b,nx,nz,.75); try{ SFX.step&&SFX.step(); }catch(e){} } }
  if(h.mill){ const g=gate(b,h,h.mill,h.mill.seg), F=MILL.front, B=MILL.back, ln=MILL.lane-BR; const prevS=((nx0-g.p.x)*g.s.dx+(nz0-g.p.z)*g.s.dz);
    if(prevS<F&&g.sA>=F){ if(!millOpen()||Math.abs(g.lat)>ln){ b.x=nx0; b.z=nz0; bounce(b,-g.s.dx,-g.s.dz,.55); floatText(b.x,1,b.z,!millOpen()?'🌀':'🧱','#ffffff'); } }
    else if(g.sA>F&&g.sA<B&&Math.abs(g.lat)>ln){ const sd=Math.sign(g.lat); b.x-=(-g.s.dz)*sd*(Math.abs(g.lat)-ln); b.z-=(g.s.dx)*sd*(Math.abs(g.lat)-ln); bounce(b,g.s.dz*sd,-g.s.dx*sd,.6); } }
  if(h.bridge){ const g=gate(b,h,h.bridge,h.bridge.seg), ln=BRIDGE.lane-BR; const prevS=((nx0-g.p.x)*g.s.dx+(nz0-g.p.z)*g.s.dz);
    if(prevS<BRIDGE.entry&&g.sA>=BRIDGE.entry&&Math.abs(g.lat)>ln){ b.x=nx0; b.z=nz0; bounce(b,-g.s.dx,-g.s.dz,.55); }
    else if(g.sA>BRIDGE.entry&&g.sA<BRIDGE.exit&&Math.abs(g.lat)>ln){ const sd=Math.sign(g.lat); b.x-=(-g.s.dz)*sd*(Math.abs(g.lat)-ln); b.z-=(g.s.dx)*sd*(Math.abs(g.lat)-ln); bounce(b,g.s.dz*sd,-g.s.dx*sd,.6); }
    if(g.sA>BRIDGE.moat0&&g.sA<BRIDGE.moat1&&!bridgeDown()){ const s=glow(0x6ad0ff,1.6,.9); s.position.set(b.x,.4,b.z); scene.add(s); projs.push({ kind:'splat', t:0, mesh:s }); toTee('moat'); return; } }
  if(h.cat&&b.region==='fw'){ const p=W(h.cat.at[0],h.cat.at[1]); if(Math.hypot(b.x-p.x,b.z-p.z)<1.55){ fling(Math.hypot(b.vx,b.vz)); return; } }
  if(h.C&&(b.region==='island'||!h.I)){ const d=Math.hypot(b.x-h.C.x,b.z-h.C.z), sp2=Math.hypot(b.vx,b.vz); if(d<.3&&sp2<6.5){ holedNow(); return; } if(d<.22&&sp2>=6.5){ const a=.5*(Math.random()<.5?-1:1), c=Math.cos(a), s=Math.sin(a); const vx=b.vx*c-b.vz*s; b.vz=b.vx*s+b.vz*c; b.vx=vx; } } }
function holedNow(){ const b=GF.b; b.moving=false; b.vx=b.vz=0; b.x=GF.h.C.x; b.z=GF.h.C.z; b.sink=1; try{ SFX.crystal&&SFX.crystal(); }catch(e){} finish(true); }
function fling(sp){ const b=GF.b, h=GF.h; b.moving=false; b.vx=b.vz=0; cnt.flings++; const p=W(h.cat.at[0],h.cat.at[1]); b.x=p.x; b.z=p.z;
  if(CAT.fling){ CAT.idle.stop(); CAT.fling.reset().play(); setTimeout(()=>{ if(CAT.fling){ CAT.fling.stop(); CAT.idle.reset().play(); } },3000); }
  const off=Math.min(4,Math.abs(sp-5.2)*.42+Math.random()*.4), a=Math.random()*TAU, lx=h.C.x+Math.cos(a)*off, lz=h.C.z+Math.sin(a)*off;
  const lost=Math.hypot(lx-h.I.x,lz-h.I.z)>h.I.r-BR-.05, ace=off<.3, back=Math.hypot(h.C.x-lx,h.C.z-lz)||1;
  b.flight={ t:-.35, T:1.15, H:6, x0:p.x, z0:p.z, x1:lx, z1:lz, y1:TURF+BR, lost, ace, vx:(h.C.x-lx)/back*(.6+Math.random()*1.2), vz:(h.C.z-lz)/back*(.6+Math.random()*1.2) }; try{ SFX.thud&&SFX.thud(); }catch(e){} }
// ---------------------------------------------------------------- every frame: the hero at the ball, the aim, the swing, the ball
const aimBar=new THREE.Mesh(new THREE.PlaneGeometry(1,.14),new THREE.MeshBasicMaterial({ color:C(0xffe08a), transparent:true, opacity:.85, depthWrite:false })); aimBar.rotation.order='YXZ'; aimBar.visible=false; aimBar.userData.noOL=true; scene.add(aimBar);
const v3=new THREE.Vector3(), RAX=new THREE.Vector3();
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt);
    if(GF.on&&S.phase!=='build'){ stop(); }
    if(!GF.on){ prompt(nearTee()); return; } prompt(null);
    const b=GF.b; for(let k=0;k<4;k++) step(dt/4); if(!GF.on) return;
    if(b.sink){ b.sink=Math.max(0,b.sink-dt*3); }
    if(GF.ball){ const y=(b.y!=null?b.y:TURF+BR-(b.sink!==undefined?(1-b.sink)*.4:0)); const px=GF.ball.position.x, pz=GF.ball.position.z; GF.ball.position.set(b.x,y,b.z); const mx=b.x-px, mz=b.z-pz, dd=Math.hypot(mx,mz); if(dd>1e-5&&dd<3){ RAX.set(mz/dd,0,-mx/dd); GF.ball.rotateOnWorldAxis(RAX,dd/BR); } }   // build 484: it rolls the way it actually moved this frame, about the axis across its path (bounces included)
    camera.getWorldDirection(v3); const al=Math.hypot(v3.x,v3.z)||1; GF.aim={ x:v3.x/al, z:v3.z/al };
    if(GF.charging){ GF.ct+=dt; const u=(GF.ct/1.15)%2; GF.power=u<1?u:2-u; }
    const ready=!b.moving&&!b.flight&&b.sink===undefined;
    // the hero stands at the ball, a step behind it, facing the putt
    const hx=b.x-GF.aim.x*1.05+GF.aim.z*.32, hz=b.z-GF.aim.z*1.05-GF.aim.x*.32; if(ready||!GF.placed){ hero.x=hx; hero.z=hz; GF.placed=true; } hero.yaw=Math.atan2(GF.aim.x,GF.aim.z); hero.vy=Math.min(hero.vy,0);
    if(GF.putter){ GF.swing=Math.max(0,GF.swing-dt*4); const back=GF.charging?-.15-GF.power*.85:GF.swing>0?.55*GF.swing:0; GF.putter.position.set(b.x-GF.aim.x*.12+GF.aim.z*.05,1.5+TURF,b.z-GF.aim.z*.12-GF.aim.x*.05); GF.putter.rotation.set(0,Math.atan2(GF.aim.x,GF.aim.z),0); GF.putter.rotateX(back); GF.putter.visible=ready||GF.swing>0; }
    aimBar.visible=ready; if(ready){ const L=1.2+GF.power*5; aimBar.scale.set(L,1,1); aimBar.position.set(b.x+GF.aim.x*(L/2+.25),TURF+.03,b.z+GF.aim.z*(L/2+.25)); aimBar.rotation.set(-PI/2,yawX(GF.aim.x,GF.aim.z),0); aimBar.material.color.setHex(GF.power>.8?0xff7a5a:0xffe08a); }
    hud(true); }; }
// the hero's feet never wander off the ball while putting (the game's own movement would walk him)
{ const prev=heroUpdate; heroUpdate=function(dt){ prev.apply(this,arguments); if(GF.on){ hero.moving=false; } }; }
// ---------------------------------------------------------------- THE CINEMATIC (build 481). Matt: "we should have a nice cinematic for the mini golf ... I love the cinematics. make it like 25 seconds long".
// The first time a hero steps onto a tee and presses E (once on this computer -- my call: 25 s every run would wear thin; SHIFT+E on a tee plays it again), the hall holds still and the camera tours the course:
//   0-4.5  a crane up the white tree, the title     4.5-9.5  hole 1: low down the rampart, a ball rolls the length and drops -- an ace
//   9.5-14 hole 2: round the windmill, the ball slips through the arch between the sails     14-19  hole 3: down by the moat, the bridge comes down, the ball runs across
//   19-23.5 hole 4: into the catapult, the fling, the camera rides the ball up and over onto the island by the tree     23.5-25  up and wide over the whole course, sludge bursting from all four cups
// SPACE or ENTER skips it (after its first second). Then the hole begins.
const CINE_T=25, CINE_KEY='dd_golf_cine';
let CUT=null;
{ const st=document.createElement('style'); st.textContent='#golfcut{position:fixed;inset:0;z-index:60;pointer-events:none;display:none}#golfcut .lb{position:absolute;left:0;right:0;height:11vh;background:#000}#golfcut .lbt{top:0}#golfcut .lbb{bottom:0}'
  +'#golfcut .title{position:absolute;left:50%;top:30%;transform:translate(-50%,-50%);text-align:center;opacity:0;transition:opacity .8s}#golfcut .title b{display:block;font:900 clamp(40px,6.4vw,92px) Georgia,serif;color:#ffe9a8;-webkit-text-stroke:2px #6a4a10;text-shadow:0 0 26px #7ad06a,0 6px 0 #2a4a14;letter-spacing:4px}'
  +'#golfcut .title i{display:block;margin-top:8px;font:italic 700 clamp(18px,2.2vw,30px) Georgia,serif;color:#e8ffe0;text-shadow:0 3px 6px #000}'
  +'#golfcut .card{position:absolute;left:5vw;bottom:calc(11vh + 26px);opacity:0;transform:translateX(-30px);transition:opacity .45s,transform .45s;display:flex;align-items:center;gap:14px}#golfcut .card.on{opacity:1;transform:none}'
  +'#golfcut .card .n{width:64px;height:64px;border-radius:10px;background:#2d7a2a;border:3px solid #ffd27a;font:900 40px Georgia;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 0 #14380f}'
  +'#golfcut .card .t{font:900 clamp(22px,2.6vw,36px) Georgia,serif;color:#ffe9a8;text-shadow:0 3px 6px #000;letter-spacing:2px}#golfcut .card .p{font:700 16px Georgia;color:#cfe9b8;text-shadow:0 2px 4px #000}'
  +'#golfcut .stamp{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) rotate(-6deg) scale(3);opacity:0;font:900 clamp(48px,7vw,104px) Georgia,serif;color:#b46aff;-webkit-text-stroke:3px #ffd27a;text-shadow:0 0 28px #b46aff,0 8px 0 #3a1460;white-space:nowrap}'
  +'#golfcut .skip{position:absolute;right:18px;bottom:calc(11vh + 10px);font:13px Georgia;color:#d8e8c8;opacity:.7}';
  document.head.appendChild(st); }
const cutEl=document.createElement('div'); cutEl.id='golfcut';
cutEl.innerHTML='<div class="lb lbt"></div><div class="lb lbb"></div><div class="title"><b>THE WHITE TREE LINKS</b><i>⛳ four holes · par 11 · 🫙 Legendary sludge</i></div><div class="card"><div class="n">1</div><div><div class="t"></div><div class="p"></div></div></div><div class="stamp">⛳ PLAY FOR SLUDGE</div><div class="skip">SPACE to skip ▸▸</div>';
document.body.appendChild(cutEl);
const sm=k=>k<=0?0:k>=1?1:k*k*(3-2*k), lp=(a,b,k)=>a+(b-a)*k, V=(x,y,z)=>new THREE.Vector3(x,y,z);
const vl=(a,b,k)=>V(lp(a.x,b.x,k),lp(a.y,b.y,k),lp(a.z,b.z,k));
let cineBalls=[], cineFx=[];
function cineBall(){ const m=ballMesh(); cineBalls.push(m); return m; }
function cineBurst(x,z,col){ for(let i=0;i<14;i++){ const s=glow(i%2?0xffd27a:col,.7,.95); s.position.set(x,TURF+.4,z); scene.add(s); const a=i/14*TAU; cineFx.push({ s, vx:Math.cos(a)*(2+Math.random()*2), vy:4+Math.random()*3, vz:Math.sin(a)*(2+Math.random()*2), t:0 }); } }
// the ball along a run of points, eased, at time k (0..1)
function along(pts,k){ let tot=0; const L=[]; for(let i=0;i<pts.length-1;i++){ const d=Math.hypot(pts[i+1].x-pts[i].x,pts[i+1].z-pts[i].z); L.push(d); tot+=d; } let r=Math.max(0,Math.min(1,k))*tot;
  for(let i=0;i<L.length;i++){ if(r<=L[i]||i===L.length-1){ const u=L[i]?Math.min(1,r/L[i]):1; return { x:lp(pts[i].x,pts[i+1].x,u), z:lp(pts[i].z,pts[i+1].z,u) }; } r-=L[i]; } return pts[pts.length-1]; }
function playCine(after){ if(CUT) return; try{ localStorage.setItem(CINE_KEY,'1'); }catch(e){}
  const H=HOLES, tr=W(9.5,44.5), h1=H[0], h2=H[1], h3=H[2], h4=H[3];
  const mill=W(h2.mill.at[0],h2.mill.at[1]), md=h2.segs[h2.mill.seg], brg=W(h3.bridge.at[0],h3.bridge.at[1]), bd=h3.segs[h3.bridge.seg], cat=W(h4.cat.at[0],h4.cat.at[1]);
  CUT={ t:0, after, shown:{}, slam:false,
    b1:cineBall(), b2:cineBall(), b3:cineBall(), b4:cineBall(),
    p1:[h1.T,h1.C], p2:[{ x:mill.x-md.dx*3.2, z:mill.z-md.dz*3.2 }, { x:mill.x+md.dx*1.6, z:mill.z+md.dz*1.6 }, h2.wp[2]?{ x:h2.wp[1].x, z:h2.wp[1].z }:h2.C, h2.C], p3:[{ x:brg.x-bd.dx*5, z:brg.z-bd.dz*5 }, h3.C], p4:[{ x:cat.x, z:cat.z+3.4 }, { x:cat.x, z:cat.z }],
    tr, mill, md, brg, bd, cat, h1, h2, h3, h4 };
  for(const b of [CUT.b1,CUT.b2,CUT.b3,CUT.b4]) b.visible=false;
  cutEl.style.display='block'; cutEl.querySelector('.title').style.opacity='0'; cutEl.querySelector('.stamp').style.cssText=''; document.body.classList.add('avery-cut'); pEl.style.display='none'; cEl.style.display='none'; lastP=''; }
function endCine(){ if(!CUT) return; const after=CUT.after; CUT=null; for(const b of cineBalls) scene.remove(b); cineBalls=[]; for(const f of cineFx) scene.remove(f.s); cineFx=[]; cutEl.style.display='none'; document.body.classList.remove('avery-cut'); cutEl.querySelector('.card').classList.remove('on'); if(after) after(); }
function card(n,name,sub){ const c=cutEl.querySelector('.card'); c.querySelector('.n').textContent=n; c.querySelector('.t').textContent=name; c.querySelector('.p').textContent=sub; c.classList.add('on'); }
function stepCine(dt){ const c=CUT; c.t+=dt; const t=c.t; updateFx(dt);
  for(let i=cineFx.length-1;i>=0;i--){ const f=cineFx[i]; f.t+=dt; f.vy-=9*dt; f.s.position.x+=f.vx*dt; f.s.position.y+=f.vy*dt; f.s.position.z+=f.vz*dt; f.s.material.opacity=Math.max(0,.95-f.t*.7); if(f.t>1.4){ scene.remove(f.s); cineFx.splice(i,1); } }
  const ttl=cutEl.querySelector('.title'), cd=cutEl.querySelector('.card'), stp=cutEl.querySelector('.stamp');
  let pos, look;
  if(t<4.5){ const k=sm(t/4.5); pos=vl(V(c.tr.x-6,1.6,c.tr.z+7),V(c.tr.x-8,15,c.tr.z+13),k); look=vl(V(c.tr.x,4,c.tr.z),V(c.tr.x+2,2,c.tr.z-2),k); ttl.style.opacity=t>.8&&t<4.1?'1':'0'; }
  else if(t<9.5){ ttl.style.opacity='0'; if(!c.shown[1]){ c.shown[1]=1; card(1,'THE RAMPART','par 2'); } const u=t-4.5, k=sm(u/5), h=c.h1, d=h.segs[0];
    pos=V(h.T.x-d.dx*3+lp(0,d.dx*11,k),1.3+k*.6,h.T.z-d.dz*3+lp(0,d.dz*11,k)); look=V(pos.x+d.dx*7,.4,pos.z+d.dz*7);
    const kb=sm((u-.5)/3.6); c.b1.visible=u>.4&&kb<1; const p=along(c.p1,kb); c.b1.position.set(p.x,TURF+BR,p.z); c.b1.rotation.x+=dt*8;
    if(kb>=1&&!c.shown.ace1){ c.shown.ace1=1; cineBurst(h.C.x,h.C.z,0x7ad06a); floatText(h.C.x,2.2,h.C.z,'⛳ ACE!','#ffd27a'); try{ SFX.crystal&&SFX.crystal(); }catch(e){} } }
  else if(t<14){ if(!c.shown[2]){ c.shown[2]=1; card(2,'THE MILL','par 3'); if(MILL.act) MILL.act.time=2.0; } const u=t-9.5, k=sm(u/4.5);
    pos=vl(V(c.mill.x+2.5,2.4,c.mill.z+7.5),V(c.mill.x+7.5,4.2,c.mill.z+1),k);   /* the west wall is close: the camera keeps to the course side */ look=V(c.mill.x,2.2,c.mill.z);
    const kb=Math.max(0,Math.min(1,(u-1.2)/2.4)); c.b2.visible=u>1.1&&kb<1; const p=along(c.p2,kb); c.b2.position.set(p.x,TURF+BR,p.z); c.b2.rotation.x+=dt*8; }
  else if(t<19){ if(!c.shown[3]){ c.shown[3]=1; card(3,'THE DRAWBRIDGE','par 3'); if(BRIDGE.act) BRIDGE.act.time=0; } const u=t-14, k=sm(u/5), side={ x:-c.bd.dz, z:c.bd.dx };
    pos=V(c.brg.x+side.x*6.5-c.bd.dx*(2-k*3),1.6+k*.8,c.brg.z+side.z*6.5-c.bd.dz*(2-k*3)); look=V(c.brg.x-c.bd.dx*1.5,.8,c.brg.z-c.bd.dz*1.5);
    const kb=Math.max(0,Math.min(1,(u-2.2)/2.4)); c.b3.visible=u>2.1&&kb<1; const p=along(c.p3,sm(kb)); c.b3.position.set(p.x,TURF+BR,p.z); c.b3.rotation.x+=dt*8; }
  else if(t<23.5){ if(!c.shown[4]){ c.shown[4]=1; card(4,'THE SIEGE','par 3'); } const u=t-19, h=c.h4, I=h.I;
    let bp;
    if(u<1.0){ const p=along(c.p4,sm(u/1.0)); bp=V(p.x,TURF+BR,p.z); }
    else { if(!c.shown.fling){ c.shown.fling=1; if(CAT.fling){ CAT.idle.stop(); CAT.fling.reset().play(); setTimeout(()=>{ if(CAT.fling){ CAT.fling.stop(); CAT.idle.reset().play(); } },3000); } try{ SFX.thud&&SFX.thud(); }catch(e){} }
      const kf=Math.max(0,Math.min(1,(u-1.35)/1.5)); bp=V(lp(c.cat.x,h.C.x,kf),TURF+BR+7*4*kf*(1-kf),lp(c.cat.z,h.C.z,kf)); if(kf>=1&&!c.shown.ace4){ c.shown.ace4=1; cineBurst(h.C.x,h.C.z,0xb46aff); floatText(h.C.x,2.2,h.C.z,'⛳ ACE!','#ffd27a'); try{ SFX.crystal&&SFX.crystal(); }catch(e){} } }
    c.b4.visible=u<2.9; c.b4.position.copy(bp); c.b4.rotation.x+=dt*10;
    if(u<1.3){ pos=V(c.cat.x+2.2,1.4,c.cat.z+6.5); look=V(c.cat.x,1,c.cat.z); }
    else { const k=sm((u-1.3)/2.4); pos=vl(V(c.cat.x+3,4,c.cat.z+5),V(I.x+6,6.5,I.z+7.5),k); look=vl(bp,V(I.x,1,I.z),sm((u-2.6)/1.2)); } }
  else { cd.classList.remove('on'); const u=t-23.5, k=sm(u/1.5); pos=vl(V(c.tr.x+4,11,c.tr.z+8),V(c.tr.x+5,30,c.tr.z+10),k); look=V(c.tr.x+3,0,c.tr.z-4);
    if(!c.shown.end){ c.shown.end=1; for(const h of HOLES){ cineBurst(h.C.x,h.C.z,0xb46aff); } camShake=Math.max(camShake,.35); try{ SFX.thud&&SFX.thud(); }catch(e){} }
    const s=Math.min(1,u/.18); stp.style.opacity='1'; stp.style.transform='translate(-50%,-50%) rotate(-6deg) scale('+(3-2*s).toFixed(3)+')'; }
  camera.position.copy(pos); camera.lookAt(look);
  if(t>=CINE_T) endCine(); }
{ const prev=update; update=function(dt){ if(CUT){ stepCine(dt); updateHUD(); return; } return prev(dt); }; }
addEventListener('keydown',ev=>{ if(!CUT) return; ev.stopImmediatePropagation(); if((ev.code==='Space'||ev.code==='Enter'||ev.code==='NumpadEnter')&&!ev.repeat&&CUT.t>1) CUT.t=CINE_T-.01; },true);
addEventListener('mousedown',ev=>{ if(CUT){ ev.stopImmediatePropagation(); ev.preventDefault(); } },true);
const seenCine=()=>{ try{ return !!localStorage.getItem(CINE_KEY); }catch(e){ return true; } };
// ---------------------------------------------------------------- input: E at a tee / to walk away; hold and release the mouse to putt (the sword stays sheathed)
const canvasEl=document.getElementById('c');
addEventListener('keydown',ev=>{ if(Meta.isOpen()||S.phase==='start') return;
  if(ev.code==='KeyE'&&!ev.repeat){ if(GF.on){ ev.stopImmediatePropagation(); ev.preventDefault(); stop(); return; } const h=nearTee(); if(h){ ev.stopImmediatePropagation(); ev.preventDefault(); if(!seenCine()||ev.shiftKey) playCine(()=>start(h)); else start(h); } return; }   /* build 481: the course's cinematic the first time (SHIFT+E again) */
  if(GF.on&&/^(KeyW|KeyA|KeyS|KeyD|ArrowUp|ArrowDown|Space|Digit\d|Minus|Equal|KeyX|KeyR|KeyQ|KeyF|ShiftLeft|ShiftRight)$/.test(ev.code)){ ev.stopImmediatePropagation(); ev.preventDefault(); } },true);
addEventListener('mousedown',ev=>{ if(!GF.on||Meta.isOpen()) return; ev.stopImmediatePropagation(); ev.preventDefault(); if(!document.pointerLockElement&&canvasEl&&canvasEl.requestPointerLock){ try{ canvasEl.requestPointerLock(); }catch(e){} return; }
  if(ev.button===0&&!GF.b.moving&&!GF.b.flight&&GF.b.sink===undefined){ GF.charging=true; GF.ct=0; GF.power=0; } },true);
addEventListener('mouseup',ev=>{ if(!GF.on) return; ev.stopImmediatePropagation(); if(ev.button===0&&GF.charging){ GF.charging=false; putt(); } },true);
// ---------------------------------------------------------------- pictures, not words: the tee prompt and the scorecard
{ const st=document.createElement('style'); st.textContent='#golfprompt,#golfcard{position:fixed;left:50%;transform:translateX(-50%);z-index:21;pointer-events:none;font:700 15px Georgia,serif;color:#f4ffe8;text-shadow:0 2px 3px #000;display:none;white-space:nowrap}'
  +'#golfprompt{bottom:150px;background:#1d3a1acc;border:2px solid #7ad06a;border-radius:10px;padding:6px 14px}#golfprompt kbd,#golfcard kbd{display:inline-block;min-width:20px;padding:1px 6px;margin:0 3px;border:2px solid #ffd27a;border-bottom-width:4px;border-radius:6px;background:#2a1a10;color:#ffd27a;font:700 14px Georgia}'
  +'#golfcard{top:96px;background:#132a12dd;border:2px solid #c9a24a;border-radius:12px;padding:6px 16px;text-align:center}#golfcard .pips{letter-spacing:3px;margin-top:2px;font-size:17px}#golfcard .pw{height:8px;width:180px;margin:5px auto 0;background:#08140a;border:1px solid #c9a24a;border-radius:5px;overflow:hidden}#golfcard .pw i{display:block;height:100%;background:linear-gradient(90deg,#7ad06a,#ffd27a,#ff6a4a)}';
  document.head.appendChild(st); }
const pEl=document.createElement('div'); pEl.id='golfprompt'; document.body.appendChild(pEl);
const cEl=document.createElement('div'); cEl.id='golfcard'; document.body.appendChild(cEl);
let lastP='';
function prompt(h){ const s=h?'⛳ '+h.n+' · '+h.name+' · par '+h.par+'  <kbd>E</kbd>':''; if(s!==lastP){ lastP=s; pEl.innerHTML=s; pEl.style.display=s?'block':'none'; } }
function hud(on){ if(!on){ cEl.style.display='none'; return; } const h=GF.h; const pips='●'.repeat(Math.min(GF.st,MAXST))+'○'.repeat(Math.max(0,h.par-GF.st));
  cEl.innerHTML='⛳ '+h.n+' · '+h.name+' · par '+h.par+'<div class="pips">'+pips+'</div><div class="pw"><i style="width:'+Math.round(GF.power*100)+'%"></i></div><div style="font-size:12px;margin-top:3px">🖱 hold · release &nbsp; <kbd>E</kbd> ✖</div>'; cEl.style.display='block'; }
window.__golf={ info:()=>Object.assign({ on:GF.on, hole:GF.h&&GF.h.n, strokes:GF.st, done:Object.assign({},GF.done), result:Object.assign({},GF.result), total:GF.total, millOpen:millOpen(), bridgeDown:bridgeDown() },cnt),
  holes:HOLES.map(h=>({ n:h.n, par:h.par, tee:h.T, cup:h.C })), start:n=>start(HOLES.find(h=>h.n===n)), stop, ball:()=>GF.b&&{ x:+GF.b.x.toFixed(2), z:+GF.b.z.toFixed(2), moving:GF.b.moving, flight:!!GF.b.flight, region:GF.b.region },
  putt:(ax,az,power)=>{ if(!GF.on) return false; const l=Math.hypot(ax,az)||1; GF.aim={ x:ax/l, z:az/l }; GF.power=power; const keep=GF.aim; const v=1.2+power*12.5; GF.b.vx=keep.x*v; GF.b.vz=keep.z*v; GF.b.moving=true; GF.st++; cnt.putts++; return true; },
  cine:after=>playCine(after), cineT:()=>CUT?+CUT.t.toFixed(2):null, skipCine:()=>{ if(CUT) CUT.t=CINE_T-.01; }, set:o=>{ if(o.mill!==undefined&&MILL.act) MILL.act.time=o.mill; if(o.bridge!==undefined&&BRIDGE.act) BRIDGE.act.time=o.bridge; }, ready:()=>cnt.models>=9,
  // test helpers (golf-test.mjs): each hole's bends then its cup (hole 4: its bends then the catapult), which of them the ball has reached; a fresh round; the ball put down anywhere
  path:n=>{ const h=HOLES[n-1]; if(!h.pp){ h.pp=h.wp.slice(1,h.cat?h.wp.length:-1).map(p=>({ x:p.x, z:p.z, passed:false })); if(h.cat){ const c=W(h.cat.at[0],h.cat.at[1]); h.pp.push({ x:c.x, z:c.z, passed:false }); } } return h.pp; },
  markPassed:n=>{ const h=HOLES[n-1]; if(!h.pp||!GF.b) return; for(const p of h.pp) if(Math.hypot(p.x-GF.b.x,p.z-GF.b.z)<2.2) p.passed=true; },
  reset:()=>{ stop(); GF.done={}; GF.result={}; GF.total=0; for(const h of HOLES) h.pp=null; }, setBall:(x,z)=>{ if(GF.b){ GF.b.x=x; GF.b.z=z; GF.b.vx=GF.b.vz=0; GF.b.moving=false; } } };
})();
