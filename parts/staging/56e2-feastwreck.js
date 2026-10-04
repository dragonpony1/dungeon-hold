// ===== THE FEAST GONE WRONG + THE MINSTRELS' GALLERY (build 468). Matt: "the dining hall is my least favorite map right now ... it's just ugly and has straight paths and the skin is bad" -- shown three
// floor plans, "yeah maybe mix A and B". game.js lays it out (the gallery 5 up along the north wall in two halves either side of the north door, a stair down from each, the solid squares of every table
// and of the fire pit); this file draws it, after 56e-feastdecor.js has furnished the rest of the hall:
//   * MAP.wreck [cx, cz, length, angle, overturned]: Matt's feast table (feast-table.glb), stretched to its length and turned to its angle; an overturned one is a table knocked on its side -- its top
//     standing up as a barricade, legs out, the plates spilled;
//   * MAP.pit [cx, cz, radius]: a ring of stones, a bed of coals, a fire that never sits still, and a whole boar turning on a spit over it (a stand-in until there's art for it);
//   * railings on every open edge of the gallery and up both sides of its stairs (RAILBOXES: the hero can't step off; a jump clears them).
// Only MAP.id==='feast'. Test hook: window.__feastwreck.
(function(){
'use strict';
window.__feastwreck={ info:()=>({ on:false }) };
if(!MAP||MAP.id!=='feast') return;
const cnt={ tables:0, over:0, rails:0, pit:false };
const wood=mat(0x6b4a2a), plank=mat(0x8a5e34), cream=mat(0xf1e6d0), iron=mat(0x3a3348), stoneM=mat(0x5a5276), capM=mat(0x2b2540);
const cx2w=cx=>cw(cx), cz2w=cz=>cwz(cz);   // map squares (fractions allowed) to the world
// ---- the tables still standing: Matt's model, fitted by its length
const L0=7.35;
fetchBytes(ASSET('feast-table.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(gltf=>{
  const root=gltf.scene||gltf.scenes[0]; root.updateMatrixWorld(true); const box=new THREE.Box3().setFromObject(root), sz=box.getSize(new THREE.Vector3()); const sc=L0/Math.max(sz.x,1e-6);
  const inner=new THREE.Group(); inner.add(root); inner.scale.setScalar(sc); inner.position.set(-(box.min.x+box.max.x)/2*sc,-box.min.y*sc,-(box.min.z+box.max.z)/2*sc); toonify(root,sc);
  const proto=new THREE.Group(); proto.add(inner);
  for(const [cx,cz,len,ang,over] of (MAP.wreck||[])){ if(over) continue; const t=proto.clone(); t.position.set(cx2w(cx),0,cz2w(cz)); t.rotation.y=-ang*PI/180; t.scale.set(len*CELL/L0,1,1); world.add(t); cnt.tables++; }
}).catch(e=>console.warn('feast wreck tables',e));
// ---- the overturned ones: on their side, the top a barricade, legs out, plates spilled at its foot
for(const [cx,cz,len,ang,over] of (MAP.wreck||[])){ if(!over) continue; const w=len*CELL-.3, g=new THREE.Group(); g.position.set(cx2w(cx),0,cz2w(cz)); g.rotation.y=-ang*PI/180;
  g.add(M(G.box(w,1.2,.16),plank,0,.6,0)); for(let k=0;k<4;k++){ const lx=(k<2?-1:1)*(w/2-.6), ly=k%2?1.0:.25; g.add(M(G.box(.2,.2,.95),wood,lx,ly,-.55)); }   // the top on edge (build 475: a low barricade, 1.2 -- you can jump it); its four legs sticking out behind
  { const a=ang*PI/180, ux=Math.cos(a), uz=Math.sin(a), X=cx2w(cx), Z=cz2w(cz), n=Math.ceil(w/.6); for(let k=0;k<n;k++){ const s=-w/2+(k+.5)*w/n, px=X+ux*s, pz=Z+uz*s; RAILBOXES.push({ x0:px-.32, x1:px+.32, z0:pz-.32, z1:pz+.32, top:1.15, noStand:true }); } }   // build 475: the hero's collision, a chain of slim boxes along the table's own line, low enough to jump
  g.add(M(G.box(w-.8,.1,.5),plank,.3,.06,.75)); g.children[g.children.length-1].rotation.y=.08;   // a bench thrown down beside it
  for(let k=0;k<5;k++){ const u=-w/2+1+k*(w-2)/4, p=M(G.cyl(.28,.28,.05,10),cream,u,.04,.9+(k%2)*.5); p.rotation.z=(k%3-1)*.25; g.add(p); }   // the plates, spilled
  world.add(outline(g)); cnt.over++; }
// ---- the fire pit and the boar on its spit
if(MAP.pit){ const [pcx,pcz,pr]=MAP.pit, X=cx2w(pcx), Z=cz2w(pcz), R=(pr-.45)*CELL, g=new THREE.Group(); g.position.set(X,0,Z);
  const ringN=14; for(let k=0;k<ringN;k++){ const a=k/ringN*TAU, s=M(G.box(1.25,.7,.9),stoneM,Math.cos(a)*R,.35,Math.sin(a)*R); s.rotation.y=-a; g.add(s); }
  const coal=M(G.cyl(R-.4,R-.2,.25,20),basic(0x5a1606),0,.12,0); coal.userData.noOL=true; g.add(coal);
  const flames=[]; for(let k=0;k<9;k++){ const a=k/9*TAU, r=k?1.1+(k%3)*.5:0, f=M(G.cone(.45+(k%2)*.2,1.8+(k%3)*.6,7),basic(k%2?0xffa040:0xff6a1a),Math.cos(a)*r,1,Math.sin(a)*r); f.userData.noOL=true; f.material=f.material.clone(); f.material.transparent=true; f.material.opacity=.85; g.add(f); flames.push({ f, p:k*1.7, h:f.scale.y }); }
  const gl=glow(0xff8a2a,9,.85); gl.position.set(0,1.6,0); g.add(gl);
  const posts=[]; for(const sx of [-1,1]){ const post=M(G.cyl(.12,.14,3,7),iron,sx*(R+.2),1.5,0); g.add(post); const fork=M(G.box(.1,.6,.5),iron,sx*(R+.2),3,0); g.add(fork); posts.push(post,fork); }
  // build 525 (Matt sent "roast_beast_spit": his roast on a turning spit with glowing coals and floating embers, a 10 s loop): once it lands it replaces the code boar, spit and posts; the stone ring,
  // the code flames and the glow stay under it. feast-roast.glb (glb-compact 1024). Sized to span the ring (ROAST_W of the pit's width), its own Roast_Spit_Loop playing. Hook: window.__feastRoast
  { const ROAST_W=1.02; let mixer=null, root=null; fetchBytes(ASSET('feast-roast.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(gl2=>{
      root=gl2.scene||gl2.scenes[0]; root.updateMatrixWorld(true); const b0=new THREE.Box3().setFromObject(root), s0=new THREE.Vector3(); b0.getSize(s0); const k=(2*(R+.2))*ROAST_W/Math.max(.01,s0.x,s0.z);
      root.scale.setScalar(k); root.updateMatrixWorld(true); const b1=new THREE.Box3().setFromObject(root); root.position.y=-b1.min.y; toonify(root,k);
      g.add(root); for(const o of posts) o.visible=false; spit.visible=false; if(gl2.animations&&gl2.animations.length){ mixer=new THREE.AnimationMixer(root); const a=mixer.clipAction(gl2.animations[0]); a.play(); }
      WORLDANIM.push(dt=>{ if(mixer) mixer.update(dt); }); cnt.roast=true; }).catch(e=>console.warn('feast roast',e));
    window.__feastRoast={ loaded:()=>!!root, playing:()=>!!mixer, root:()=>root }; }
  const spit=new THREE.Group(); spit.position.set(0,2.9,0); g.add(spit); const bar=M(G.cyl(.07,.07,2*R+.8,7),iron,0,0,0); bar.rotation.z=PI/2; spit.add(bar);
  const hide=mat(0x7a3c1a), dark=mat(0x4a2210);
  const body=M(G.sphere?G.sphere(1,14,10):new THREE.SphereGeometry(1,14,10),hide,0,0,0); body.scale.set(2.1,1.05,1.15); spit.add(body);
  const head=M(new THREE.SphereGeometry(.62,12,9),hide,2.15,.2,0); head.scale.set(1.15,.9,.85); spit.add(head); const snout=M(G.cyl(.26,.3,.4,9),dark,2.75,.05,0); snout.rotation.z=PI/2; spit.add(snout);
  for(const sz of [-1,1]){ const ear=M(G.cone(.16,.38,5),dark,2.05,.75,sz*.32); spit.add(ear); }
  for(const [lx,lz] of [[1.2,.55],[1.2,-.55],[-1.2,.55],[-1.2,-.55]]){ const leg=M(G.cyl(.14,.1,.8,6),dark,lx,-.9,lz); spit.add(leg); }
  world.add(outline(g)); cnt.pit=true;
  WORLDANIM.push((dt,t)=>{ spit.rotation.x=t*.6; for(const o of flames){ const k=.8+.25*Math.sin(t*9+o.p)+.12*Math.sin(t*23+o.p*2); o.f.scale.y=o.h*k; o.f.position.y=.9*k; o.f.rotation.y=t*.7+o.p; } gl.material.opacity=.7+.15*Math.sin(t*7.3); }); }
// ---- railings: every open edge of the gallery, and both sides of its stairs, a low stone wall the hero can't step off
{ const parts=[], caps=[], O=new THREE.Object3D(), RH=1.0, T_=.3;
  const topOf=i=>rampA[i]?rampH[i]:(hgt[i]||0), baseOf=i=>rampA[i]?rampL[i]:(hgt[i]||0);
  for(let z=0;z<GH;z++) for(let x=0;x<GW;x++){ const i=idx(x,z); if(grid[i]===T.WALL) continue; const top=topOf(i); if(top<1.5) continue;
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, nz=z+dz; if(nx<0||nz<0||nx>=GW||nz>=GH) continue; const j=idx(nx,nz); if(grid[j]===T.WALL) continue;
      if(top-topOf(j)<1.2) continue; if(rampA[j]&&Math.abs(rampH[j]-top)<.7) continue;   // onto the next stair step or the stair's head: open
      const ex=cw(x)+dx*(CELL/2-T_/2), ez=cwz(z)+dz*(CELL/2-T_/2), sx=dx?T_:CELL, sz=dz?T_:CELL, y0=baseOf(i)-.05, y1=top+RH;
      RAILBOXES.push({ x0:ex-sx/2, x1:ex+sx/2, z0:ez-sz/2, z1:ez+sz/2, top:y1, noStand:true }); cnt.rails++;
      O.position.set(ex,(y0+y1)/2,ez); O.scale.set(sx,y1-y0,sz); O.rotation.set(0,0,0); O.updateMatrix(); parts.push(O.matrix.clone());
      O.position.set(ex,y1+.06,ez); O.scale.set(sx+.12,.12,sz+.12); O.updateMatrix(); caps.push(O.matrix.clone()); } }
  const mk=(m,list)=>{ if(!list.length) return; const im=new THREE.InstancedMesh(G.box(1,1,1),m,list.length); list.forEach((M_,k)=>im.setMatrixAt(k,M_)); im.instanceMatrix.needsUpdate=true; im.userData.noOL=true; im.frustumCulled=false; world.add(im); };
  mk(stoneM,parts); mk(capM,caps); }
// ---- build 471: the hall's own sky light cooler and lower, so the lamps make pools and the dark between them reads as stone, not orange
scene.traverse(o=>{ if(o.isHemisphereLight){ o.color.set(C(0x4a4c8a)); o.groundColor.set(C(0x100a18)); o.intensity=.5; } });
// ---- build 471: the gallery's face in the throne room's stone -- the same panel the hall's walls wear (throne-panel2.glb), laid in runs along every side of it 3 or more high
{ const runs=[], groups=new Map(); for(let z=0;z<GH;z++) for(let x=0;x<GW;x++){ const i=idx(x,z); if(grid[i]===T.WALL||rampA[i]) continue; const hc=hgt[i]||0;
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const j=idx(x+dx,z+dz); if(x+dx<0||z+dz<0||x+dx>=GW||z+dz>=GH||grid[j]===T.WALL||rampA[j]) continue; const hn=hgt[j]||0; if(hn-hc<3) continue;
      const fx=cw(x)+dx*CELL/2, fz=cwz(z)+dz*CELL/2, nx=-dx, nz=-dz, along=nx?fz:fx, plane=nx?fx:fz, key=nx+','+nz+','+plane.toFixed(2)+','+hc+','+hn; (groups.get(key)||groups.set(key,[]).get(key)).push({ fx, fz, nx, nz, along, y0:hc, top:hn }); } }
  for(const list of groups.values()){ list.sort((a,b)=>a.along-b.along); let cur=null; for(const r of list){ if(cur&&Math.abs(r.along-cur.b)<CELL*1.01){ cur.b=r.along; cur.n++; } else { cur=Object.assign({ a:r.along, b:r.along, n:1 },r); runs.push(cur); } } }
  fetchBytes(ASSET('throne-panel2.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(gltf=>{
    const root=gltf.scene||gltf.scenes[0]; root.updateMatrixWorld(true); toonify(root,1); let mesh=null; root.traverse(o=>{ if(o.isMesh&&!o.userData.isOL&&!mesh) mesh=o; }); if(!mesh) return;
    const g=mesh.geometry.clone(); g.applyMatrix4(mesh.matrixWorld); g.computeBoundingBox(); const b=g.boundingBox, sz=new THREE.Vector3(); b.getSize(sz); g.translate(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2); g.scale(1/sz.x,1/sz.y,1/sz.z); g.computeVertexNormals();
    const mats=[], q=new THREE.Quaternion(), up=new THREE.Vector3(0,1,0), D=.14;
    for(const r of runs){ const len=r.n*CELL, span=r.top-r.y0, W=span*sz.x/sz.y, k=Math.max(1,Math.round(len/W)), w=len/k, mid=(r.a+r.b)/2; q.setFromAxisAngle(up,Math.atan2(r.nx,r.nz));
      for(let i=0;i<k;i++){ const s_=-len/2+w*(i+.5), x=r.nx?r.fx:mid+s_, z=r.nx?mid+s_:r.fz; mats.push(new THREE.Matrix4().compose(new THREE.Vector3(x+r.nx*(.03+D/2),r.y0,z+r.nz*(.03+D/2)),q,new THREE.Vector3(w*1.02,span,D))); } }
    // the stairs' sides: each step's own square of wall, panels the width of a square laid bottom-up at the panel's own shape, the top one cut to the step
    const RH=CELL*sz.y/sz.x; for(let z=0;z<GH;z++) for(let x=0;x<GW;x++){ const i=idx(x,z); if(!rampA[i]) continue; const top=rampH[i];
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const j=idx(x+dx,z+dz); if(x+dx<0||z+dz<0||x+dx>=GW||z+dz>=GH||grid[j]===T.WALL||rampA[j]) continue; const y0=hgt[j]||0; if(top-y0<.8) continue;
        const nx=dx, nz=dz, fx=cw(x)+dx*CELL/2, fz=cwz(z)+dz*CELL/2; q.setFromAxisAngle(up,Math.atan2(nx,nz));
        for(let y=y0;y<top-.05;y+=RH){ const h=Math.min(RH,top-y); mats.push(new THREE.Matrix4().compose(new THREE.Vector3(fx+nx*(.03+D/2),y,fz+nz*(.03+D/2)),q,new THREE.Vector3(CELL*1.02,h,D))); } } }
    const im=new THREE.InstancedMesh(g,mesh.material,mats.length); mats.forEach((m,i)=>im.setMatrixAt(i,m)); im.instanceMatrix.needsUpdate=true; im.frustumCulled=false; im.userData.noOL=true; world.add(im); cnt.galleryPanels=mats.length; }).catch(e=>console.warn('feast gallery stone',e)); }
// ---- build 472: a rug under every table still standing (the throne room's long rug, turned with its table, a little longer than it), laid flat on top of the floor tiles (see 56e's rug note)
const loadFlat=(name,W,cb)=>fetchBytes(ASSET(name),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(gltf=>{ const root=gltf.scene||gltf.scenes[0]; root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root), sz=box.getSize(new THREE.Vector3()), sc=W/Math.max(sz.x,1e-6); const inner=new THREE.Group(); inner.add(root); inner.scale.setScalar(sc); inner.position.set(-(box.min.x+box.max.x)/2*sc,-box.min.y*sc,-(box.min.z+box.max.z)/2*sc); toonify(root,sc);
  const w=new THREE.Group(); w.add(inner); cb(w,sz.y*sc); }).catch(e=>console.warn('feast '+name,e));
loadFlat('throne-rug.glb',8,(w,th)=>{ for(const [cx,cz,len,ang,over] of (MAP.wreck||[])){ if(over) continue; const t=w.clone(); t.position.set(cx2w(cx),.16,cz2w(cz)); t.rotation.y=-ang*PI/180;
  const L=len*CELL+1.6; t.scale.set(L/8,Math.min(1,.12/Math.max(th,1e-3)),1.15); world.add(t); cnt.rugs=(cnt.rugs|0)+1; } });
// ---- build 472: banners hanging off the gallery's rail into the hall, clear of its stairs and the north door
{ const GZ=5, spots=[6,16,20,30,35,39,45].filter(x=>grid[idx(x,GZ)]!==T.WALL&&(hgt[idx(x,GZ)]||0)>=4&&!rampA[idx(x,GZ+1)]&&(hgt[idx(x,GZ+1)]||0)<1);
  fetchBytes(ASSET('throne-banner2.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(gltf=>{ const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,3.4); toonify(root,fit.scale);
    for(const x of spots){ const top=hgt[idx(x,GZ)]||0; const t=fit.wrap.clone(); t.position.set(cw(x),top+.9-3.4,cwz(GZ)+CELL/2+.12); t.rotation.y=0; world.add(t); cnt.banners=(cnt.banners|0)+1; } }).catch(e=>console.warn('feast banner',e)); }
window.__feastwreck={ info:()=>Object.assign({ on:true },cnt) };
})();
