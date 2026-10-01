// ===== THE CLOISTER COURT, H2 "THE LONG WAY" (build 282). Matt, after three rounds of drawings (tools/scratch-main/court-layouts3.mjs): two Heartroots on the diagonal ("what if we put roothart diagonal from
// each other"), lanes that go "all the way down ... then all the way back ... long tortuous paths to the roothart", "2 raised positions toward the middle", and "yes see H2 is giving lots more lane time for the
// mobs to pass defenses". game.js lays the court out (both Heartroots, the corner flights, the terraces, the tree's trunk); this module carves the garden on top of it:
//   * PATHS, PLAZAS and TOWER NOOKS are cut through FLOWER BEDS, exactly as drawn: one half, turned 180 degrees for the other. Every other plain floor cell of the court becomes bed, walled the way the moat
//     is (T.WATER: walkers go round, flyers cross, nothing is built on it) -- then the flow fields are recomputed (reflow);
//   * a bed cell beside a path is a HEDGE (Matt's hedge pieces, runs and corners, drawn INSTANCED -- one draw per mesh however many pieces); the rest of a bed is soil with bushes and flowers;
//   * the hero is not a mob: a hedge is a ledge he jumps onto and runs along, a flower bed he walks straight through (the solidAt/floorAt wraps below);
//   * the GIANT TREE (Matt's white-and-gold tree at five times its old size) stands in the middle clearing; the colonnade is his marble column;
//   * the SECOND HEARTROOT (game.js crystal2, "either falls its a fail") gets the first one's model and glow, its own bar under the first, and the UNDER ATTACK strip when it is hit.
// Only MAP.id==='court'. Test hook: window.__courtdecor.
(function(){
window.__courtdecor={info:()=>null,loaded:()=>false};
if(!MAP||MAP.id!=='court') return;
const HEDGE=T.WATER, H_HEDGE=1.2, H_BED=.2, TREE_H=21;   // build 283 (Matt: "just decrease its size by 15%"): 36 -> 30.6; build 319 (Matt: "decrease tree size again by 15"): -> 26; build 326 (Matt: "this white tree shorter i cant see the leaves"): -> 21
// ---- the layout, as drawn (H2): one half; the other is the same turned 180 degrees about the court's centre
const HALF={ rooms:[[29,34,12,19],[19,24,19,24]], paths:[{p:[[8,7],[7,7]],w:3},{p:[[6,7],[6,35],[26,35],[26,15],[29,15]]},{p:[[24,21],[26,21]]}], nooks:[[9,10,11,13],[9,10,20,22],[12,14,32,33],[23,24,31,33],[27,28,25,27]] };
const inCourt=(x,z)=>x>=5&&x<=38&&z>=5&&z<=38;
const OPEN=new Set(); const o=(x,z)=>{ if(inCourt(x,z)) OPEN.add(idx(x,z)); };
function leg([x0,z0],[x1,z1],w){ const lo=-Math.floor((w-1)/2), hi=Math.ceil((w-1)/2); for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++) for(let z=Math.min(z0,z1);z<=Math.max(z0,z1);z++) for(let k=lo;k<=hi;k++){ if(x0===x1) o(x+k,z); else o(x,z+k); } }
const MR=([x0,x1,z0,z1])=>[43-x1,43-x0,43-z1,43-z0];
// a 2-wide lane covers its cell and the next, so its turned twin sits one over (42, not 43)
const PATHS=HALF.paths.concat(HALF.paths.map(P=>{ const w=P.w||2, c=w%2?43:42; return {p:P.p.map(([x,z])=>[c-x,c-z]),w}; }));
for(const P of PATHS) for(let i=0;i+1<P.p.length;i++) leg(P.p[i],P.p[i+1],P.w||2);
for(const [x0,x1,z0,z1] of HALF.rooms.concat(HALF.rooms.map(MR)).concat(HALF.nooks).concat(HALF.nooks.map(MR))) for(let x=x0;x<=x1;x++) for(let z=z0;z<=z1;z++) o(x,z);
// ---- the beds: every plain, unraised floor cell of the court the carving left
const SP=[]; for(let z=0;z<GH;z++) for(let x=0;x<GW;x++) if(grid[idx(x,z)]===T.SPAWN) SP.push([x,z]);
const before={}; SP.forEach(([x,z])=>{ before[x+','+z]=flowFree.dist[idx(x,z)]; });
const BED=new Map();
for(let z=5;z<=38;z++) for(let x=5;x<=38;x++){ const i=idx(x,z); if(OPEN.has(i)||grid[i]!==T.FLOOR||rampA[i]||(hgt[i]||0)>.5) continue; BED.set(i,{cx:x,cz:z,base:hgt[i]||0}); }
const openAt=(x,z)=>{ if(x<0||z<0||x>=GW||z>=GH) return false; const j=idx(x,z); return !BED.has(j)&&walk(grid[j]); };
BED.forEach(c=>{ const px=openAt(c.cx+1,c.cz), nx=openAt(c.cx-1,c.cz), pz=openAt(c.cx,c.cz+1), nz=openAt(c.cx,c.cz-1);
  c.ox=px||nx; c.oz=pz||nz; c.sx=(px?1:0)-(nx?1:0); c.sz=(pz?1:0)-(nz?1:0); c.edge=c.ox||c.oz;
  if(!c.edge){ for(const [dx,dz] of [[1,1],[1,-1],[-1,1],[-1,-1]]) if(openAt(c.cx+dx,c.cz+dz)){ c.edge=true; c.inner=[dx,dz]; break; } }   // a bed's inside corner (a lane turning past it): the hedge closes it
  c.top=c.base+(c.edge?H_HEDGE:H_BED); });
BED.forEach((c,i)=>{ grid[i]=HEDGE; });
reflow();
const after={}; SP.forEach(([x,z])=>{ after[x+','+z]=flowFree.dist[idx(x,z)]; });
const cellOf=(cx,cz)=>cx>=0&&cz>=0&&cx<GW&&cz<GH?BED.get(idx(cx,cz)):undefined;
// build 381 (Matt: "need to be able to place ballista on hedges in cloister as well"): a HEDGE (a bed cell beside a path) is a surface a ballista may be set on (96b-perch.js, the same rule as a perch's deck): the tower stands at the hedge's top, in the middle of its cell
(window.__standSurf=window.__standSurf||[]).push((kind,x,z)=>{ const c=cellOf(wc(x),wcz(z)); return (c&&c.edge)?{ x:cw(c.cx), z:cwz(c.cz), y:c.top, key:c }:null; });
// ---- build 285 (Matt, killed by drakes: "those guys need a little pathing or something its overwhelming ... hard is good. something in the middle"): flyers still cross the beds, but a bed cell costs them
// BED_FLY steps instead of one, and they come down into the court by a stair like everyone else (they used to glide round the raised walkway and drop in beside a Heartroot), so they mostly keep to the lanes and only cut across where it saves a lot -- harder than a walker, no longer a straight dash to a Heartroot. A weighted field (a bucket
// queue: the weights are small whole numbers) replaces game.js's plain one for flyers, rebuilt whenever reflow() is (a defense placed or sold).
let BED_FLY=3;
function flyField(){ const N=GW*GH, nxt=new Int16Array(N).fill(-1), dist=new Int16Array(N).fill(-1), best=new Int32Array(N).fill(1e9), buckets=[]; const push=(i,d)=>{ (buckets[d]||(buckets[d]=[])).push(i); };
  for(const g of [GOAL,GOAL2]) if(g>=0){ best[g]=0; push(g,0); }
  for(let d=0;d<buckets.length;d++){ const B=buckets[d]; if(!B) continue; for(let k=0;k<B.length;k++){ const i=B[k]; if(best[i]!==d) continue; const x=i%GW, z=(i/GW)|0;
      for(let q=0;q<4;q++){ const nx=x+[1,-1,0,0][q], nz=z+[0,0,1,-1][q]; if(!inb(nx,nz)) continue; const j=idx(nx,nz), t=grid[j]; if(!(walk(t)||t===T.WATER)) continue; if(Math.abs((hgt[j]||0)-(hgt[i]||0))>.8) continue; const nd=d+(BED.has(j)?BED_FLY:1); if(nd<best[j]){ best[j]=nd; nxt[j]=i; push(j,nd); } } } }
  for(let i=0;i<N;i++) if(best[i]<1e9) dist[i]=Math.min(32767,best[i]); return {nxt,dist}; }
flowFly=flyField();
{ const prev=reflow; reflow=function(){ prev.apply(this,arguments); flowFly=flyField(); }; }
// ---- the hero climbs hedges and walks through beds; mobs, loot and orbs keep the moat's rules
{ const prev=solidAt; solidAt=function(x,z,y,forHero){ if(forHero){ const c=cellOf(wc(x),wcz(z)); if(c) return y<c.top-.25; } return prev.apply(this,arguments); }; }
{ const prev=floorAt; floorAt=function(x,z,y){ const f=prev.apply(this,arguments); const c=cellOf(wc(x),wcz(z)); return c&&y>=c.top-.25?Math.max(f,c.top):f; }; }
// ---- the hedge shapes: a straight cell runs along the side its lane is on; a cell open on an x side AND a z side (a bed's outside corner) or only diagonally (its inside corner) takes the corner piece
const straight=[], corners=[];
BED.forEach(c=>{ if(!c.edge) return; if(c.inner){ corners.push({c,dx:c.inner[0],dz:c.inner[1]}); return; }
  if(c.ox&&c.oz&&c.sx&&c.sz){ corners.push({c,dx:-c.sx,dz:-c.sz}); return; }
  c.ax=c.oz&&!(c.ox&&!c.sz)?'x':'z'; c.st=true; straight.push(c); });
const runs=[]; const seen=new Set();
const same=(x,z,ax)=>{ const d=cellOf(x,z); return d&&d.st&&d.ax===ax?d:null; };
for(const c of straight){ const k=idx(c.cx,c.cz); if(seen.has(k)) continue; const ax=c.ax;
  let a=c; for(let p=ax==='x'?same(a.cx-1,a.cz,ax):same(a.cx,a.cz-1,ax); p; p=ax==='x'?same(a.cx-1,a.cz,ax):same(a.cx,a.cz-1,ax)) a=p;
  const cells=[]; for(let b=a; b; b=ax==='x'?same(b.cx+1,b.cz,ax):same(b.cx,b.cz+1,ax)){ const kb=idx(b.cx,b.cz); if(seen.has(kb)) break; seen.add(kb); cells.push(b); } if(cells.length) runs.push({ax,cells}); }
// ---- models: one fetch each, the pieces drawn instanced (every mesh of a model, its toon outline shells too, as one InstancedMesh)
const PROTO={}; let DONE=0, WANT=0, pieces=0, trees=0, pillars=0; const USED={};
function protoOf(name,size){ const key=name+'|'+size; return PROTO[key]||(PROTO[key]=fetchBytes(ASSET(name),'later').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{
    const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,size); toonify(root,fit.scale); fit.wrap.updateMatrixWorld(true); res(fit.wrap); }catch(e){ rej(e); } },rej)))); }
const useProp=(name,size,cb)=>{ WANT++; return protoOf(name,size).then(p=>{ USED[name]=(USED[name]||0)+1; cb(p); }).catch(e=>console.warn('court decor '+name,e)).then(()=>{ DONE++; }); };
function instance(wrap,mats){ if(!mats.length) return; const inv=new THREE.Matrix4().copy(wrap.matrixWorld).invert(); const m=new THREE.Matrix4();
  wrap.traverse(ob=>{ if(!ob.isMesh) return; const rel=new THREE.Matrix4().multiplyMatrices(inv,ob.matrixWorld); const im=new THREE.InstancedMesh(ob.geometry,ob.material,mats.length);
    mats.forEach((M,i)=>{ m.multiplyMatrices(M,rel); im.setMatrixAt(i,m); }); im.instanceMatrix.needsUpdate=true; im.frustumCulled=false; im.userData.noOL=true; world.add(im); }); }
const mtx=(x,y,z,ry,sx,sz)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),ry||0),new THREE.Vector3(sx||1,1,sz||1));
useProp('court-hedge.glb',H_HEDGE,wrap=>{ const bb=new THREE.Box3().setFromObject(wrap), L0=bb.max.x-bb.min.x; const M=[];
  for(const r of runs){ const n=r.cells.length, len=n*CELL, k=Math.max(1,Math.round(len/L0)), each=len/k, c0=r.cells[0];
    for(let j=0;j<k;j++){ const along=-CELL/2+each*(j+.5); M.push(r.ax==='x'?mtx(cw(c0.cx)+along,c0.base,cwz(c0.cz),0,each/L0*1.04):mtx(cw(c0.cx),c0.base,cwz(c0.cz)+along,Math.PI/2,each/L0*1.04)); } }
  instance(wrap,M); pieces+=M.length; });
const FOOT=2.7, ARM_F=.27;
useProp('court-hedge-corner.glb',H_HEDGE,wrap=>{ const bb=new THREE.Box3().setFromObject(wrap); let sx=0,sz=0,n=0; const v=new THREE.Vector3();
  wrap.traverse(ob=>{ if(!ob.isMesh||ob.userData.isOL) return; const pa=ob.geometry.attributes.position; for(let i=0;i<pa.count;i+=7){ v.fromBufferAttribute(pa,i).applyMatrix4(ob.matrixWorld); sx+=v.x; sz+=v.z; n++; } });
  const ox=Math.sign(sx/n-(bb.min.x+bb.max.x)/2)||1, oz=Math.sign(sz/n-(bb.min.z+bb.max.z)/2)||1, W=Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z), sxz=FOOT/W, set=FOOT/2-ARM_F*FOOT/2; const M=[];
  for(const {c,dx,dz} of corners){ let rot=0; for(let q=0;q<4;q++){ const a=q*Math.PI/2, rx=ox*Math.cos(a)+oz*Math.sin(a), rz=-ox*Math.sin(a)+oz*Math.cos(a); if(Math.sign(Math.round(rx))===-dx&&Math.sign(Math.round(rz))===-dz){ rot=a; break; } }
    M.push(mtx(cw(c.cx)+dx*set,c.base,cwz(c.cz)+dz*set,rot,sxz,sxz)); }
  instance(wrap,M); pieces+=M.length; });
// ---- the beds themselves: soil under everything, and bushes and flowers on the cells no hedge stands on (all instanced, seeded so every player sees the same garden)
{ const pos=[], ind=[]; let vi=0; BED.forEach(c=>{ const X0=cw(c.cx)-CELL/2, Z0=cwz(c.cz)-CELL/2, y=c.base+.03; pos.push(X0,y,Z0, X0,y,Z0+CELL, X0+CELL,y,Z0+CELL, X0+CELL,y,Z0); ind.push(vi,vi+1,vi+2, vi,vi+2,vi+3); vi+=4; });
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(ind); g.computeVertexNormals(); const soil=new THREE.Mesh(g,mat(0x2f4a24,{side:THREE.DoubleSide})); soil.userData.noOL=true; world.add(soil); }
// ---- build 299: TOPIARIES. Matt's gnome witch clipped from hedge on a stone pedestal (topiary-witch.glb; his idea: "archhags and topiaries" -> "yes the archhag wakes the topiaries") stands in the beds,
// one cell in from a hedge where a lane passes -- the garden's statues for now; the Archhag (not built yet, rootgate-todo.md) will wake them. Picked the same way every time (half the court, then each one's
// turned twin), at least 7 cells apart, each facing its nearest lane; nothing else grows on its cell and the hero cannot walk through one.
const TOPI_KINDS=['topiary-witch.glb','topiary-fighter.glb','topiary-ranger.glb'];   // build 300: Matt's gnome fighter joins the gnome witch; build 302 his gnome ranger
const TOPI_H=3.3, TOPI_PAIRS=5, TOPI=[], TOPI_CELLS=[];   // her pedestal clears the 1.2 hedge, her hat stands well over it
{ const N4=[[1,0],[-1,0],[0,1],[0,-1]];
  const nearHedge=c=>N4.some(([dx,dz])=>{ const d=cellOf(c.cx+dx,c.cz+dz); return d&&d.edge; }), roomy=c=>N4.every(([dx,dz])=>cellOf(c.cx+dx,c.cz+dz));
  const nearLane=c=>{ for(let r=1;r<=2;r++) for(let dx=-r;dx<=r;dx++) for(let dz=-r;dz<=r;dz++) if(openAt(c.cx+dx,c.cz+dz)) return true; return false; };
  const hash=c=>(((c.cx*73856093)^(c.cz*19349663))>>>0)%9973;
  const cand=[...BED.values()].filter(c=>!c.edge&&nearHedge(c)&&roomy(c)&&nearLane(c)&&c.cx+c.cz<43).sort((a,b)=>hash(a)-hash(b));
  const picked=[]; for(const c of cand){ if(picked.length>=TOPI_PAIRS) break; const tw=cellOf(43-c.cx,43-c.cz); if(!tw||tw.edge||tw===c) continue;
    if(picked.some(p=>Math.hypot(p.cx-c.cx,p.cz-c.cz)<7||Math.hypot((43-p.cx)-c.cx,(43-p.cz)-c.cz)<7)) continue; picked.push(c); }
  picked.forEach((c,k)=>{ const tw=cellOf(43-c.cx,43-c.cz); c.kind=tw.kind=k%TOPI_KINDS.length; TOPI_CELLS.push(c,tw); });   // build 300: the kinds take turns by pair, a pair always matching
  // build 302 (Matt: "or just put one on a raised platform"): the gnome ranger also stands on each of the two raised terraces (turned twins), in the terrace's outer corner, looking in at the giant tree;
  // its cell is solid (T.PROP, like the tree's trunk) so no one walks or builds into it
  const terr=[]; for(const [x,z] of [[19,13],[24,30]]){ const i=idx(x,z); if(!((hgt[i]||0)>1)) continue; grid[i]=T.PROP; terr.push({cx:x,cz:z,base:hgt[i],kind:TOPI_KINDS.indexOf('topiary-ranger.glb'),terrace:true,face:Math.atan2(21.5-x,21.5-z)}); }
  if(terr.length){ reflow(); TOPI_CELLS.push(...terr); }
  for(const c of TOPI_CELLS){ if(c.terrace) continue; c.topiary=true; c.top=c.base+TOPI_H;
    let fx=0,fz=0; for(let dx=-2;dx<=2;dx++) for(let dz=-2;dz<=2;dz++) if(openAt(c.cx+dx,c.cz+dz)){ const d=Math.hypot(dx,dz)||1; fx+=dx/d; fz+=dz/d; } c.face=Math.atan2(fx,fz); } }
TOPI_KINDS.forEach((file,kind)=>useProp(file,TOPI_H,wrap=>{ wrap.traverse(o=>{ if(o.isMesh&&!o.userData.isOL&&o.material&&o.material.map&&o.material.emissive){ o.material.emissiveMap=o.material.map; o.material.emissive.setRGB(.42,.42,.42); o.material.needsUpdate=true; } });   // the court is a night garden: a soft glow of her own leaves keeps her the bright clipped green Matt made
  for(const c of TOPI_CELLS){ if(c.kind!==kind) continue; const t=wrap.clone(); t.position.set(cw(c.cx),c.base,cwz(c.cz)); t.rotation.y=c.face; world.add(t); TOPI.push({mesh:t,c,kind:file}); } }));
let BUSHES=0, FLOWERS=0;
{ const inner=[...BED.values()].filter(c=>!c.edge&&!c.topiary); const bushG=new THREE.IcosahedronGeometry(.62,0), flowerG=new THREE.OctahedronGeometry(.13,0);
  const bushM=[mat(0x3f7a34),mat(0x2f6a2c)], flowerM=[mat(0xff7ab8,{emissive:C(0x5a1a30)}),mat(0xffd84a,{emissive:C(0x4a3a08)}),mat(0xf4f0ff,{emissive:C(0x303040)})];
  const B=[[],[]], F=[[],[],[]]; const R=(a,b)=>a+rnd()*(b-a);
  for(const c of inner){ const x=cw(c.cx), z=cwz(c.cz); B[(rnd()*2)|0].push(new THREE.Matrix4().compose(new THREE.Vector3(x+R(-.35,.35),c.base+.3,z+R(-.35,.35)),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,R(0,6.28),0)),new THREE.Vector3(R(.8,1.25),R(.55,.9),R(.8,1.25))));
    for(let k=0;k<3;k++) F[(rnd()*3)|0].push(new THREE.Matrix4().compose(new THREE.Vector3(x+R(-.85,.85),c.base+R(.55,.85),z+R(-.85,.85)),new THREE.Quaternion(),new THREE.Vector3(1,1,1))); }
  const put=(geo,m,list)=>{ if(!list.length) return; const im=new THREE.InstancedMesh(geo,m,list.length); list.forEach((M,i)=>im.setMatrixAt(i,M)); im.instanceMatrix.needsUpdate=true; im.frustumCulled=false; im.userData.noOL=true; world.add(im); };
  B.forEach((l,i)=>{ put(bushG,bushM[i],l); BUSHES+=l.length; }); F.forEach((l,i)=>{ put(flowerG,flowerM[i],l); FLOWERS+=l.length; }); }
// ---- the giant tree in the middle clearing (its trunk cells are solid: game.js), turned broadside to the 2 o'clock heart; the old four corner trees are gone from the map
const TREE_OBJS=[];
useProp('court-tree.glb',TREE_H,wrap=>{ const t=wrap.clone(); const x=(cw(21)+cw(22))/2, z=(cwz(21)+cwz(22))/2; t.position.set(x,0,z); t.rotation.y=Math.atan2(0-x,0-z); world.add(t); TREE_OBJS.push(t); trees++; });
// ---- the colonnade: the marble column at each stand-in's spot and height
(world.userData.pillarProcs||[]).forEach(p=>{ p.visible=false; });
const PH=MAP.pillarH||6;
useProp('court-pillar.glb',PH+1,wrap=>{ MAP.pillars.forEach(([px,pz])=>{ const t=wrap.clone(); t.position.set(cw(px),hgt[idx(px,pz)]||0,cwz(pz)); world.add(t); pillars++; }); });
// ---- the second Heartroot: the first one's pieces cloned (its own materials, so a hit on one never flashes the other) once 55-crystal.js has put the real model in, its crystal turning and bobbing the same way
const H2G=new THREE.Group(); H2G.position.set(C2X,hgt[GOAL2]||0,C2Z); world.add(H2G); let H2CG=null, h2t=0; const H2SH=[];
function buildHeart2(){ if(H2CG||!crystalG.userData.model) return; for(const ch of crystalG.children){ const cl=ch.clone(true); cl.traverse(ob=>{ if(ob.material) ob.material=Array.isArray(ob.material)?ob.material.map(m=>m.clone()):ob.material.clone(); }); H2G.add(cl); if(ch===crystalG.userData.cg) H2CG=cl; }
  if(H2CG) H2CG.children.forEach(s=>{ if(s.userData&&s.userData.a!==undefined) H2SH.push(s); }); }
const h2poll=setInterval(()=>{ buildHeart2(); if(H2CG) clearInterval(h2poll); },300);   // built the moment the model is in, title screen or not
// its bar, under the first (a copy of the HUD's own bar), and the red strip when it is hit (55-crystal.js's strip)
const bar1=document.getElementById('cbar'), bar1B=bar1&&bar1.parentNode; let bar2=null;
if(bar1B){ const b=bar1B.cloneNode(true); const i=b.querySelector('i'); if(i){ i.id='cbar2'; i.style.width='100%'; } const lbl=b.querySelector('b'); if(lbl) lbl.textContent='WEST HEARTROOT'; const l1=bar1B.querySelector('b'); if(l1) l1.textContent='EAST HEARTROOT'; bar1B.parentNode.insertBefore(b,bar1B.nextSibling); bar2=i; }
let last2=null, strip2T=0;
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); buildHeart2(); h2t+=dt;
    if(H2CG){ H2CG.rotation.y=h2t*.7; H2CG.position.y=(crystalG.userData.cgY||2.7)+Math.sin(h2t*1.6)*.15+(crystal2Shake>0?(rnd()-.5)*.3:0); H2SH.forEach((s,k)=>{ const a=s.userData.a+h2t*1.4; s.position.set(Math.cos(a)*1.7,Math.sin(h2t*2+k)*.5,Math.sin(a)*1.7); }); }
    crystal2Shake=Math.max(0,crystal2Shake-dt);
    const N=window.__net, guest=!!(N&&N.role&&N.role()==='guest'), hw=N&&N.world&&N.world(); const c2=guest&&hw&&hw.crystal2!=null?hw.crystal2:S.crystal2, max=guest&&hw&&hw.crystalMax?hw.crystalMax:CRYSTAL_MAX;
    if(bar2) bar2.style.width=Math.max(0,c2/max*100)+'%';
    const strip=document.getElementById('alarm'); if(last2!==null&&c2<last2&&c2>0&&(S.phase==='wave'||S.phase==='build'||guest)&&strip){ strip.textContent='⚠ THE WEST HEARTROOT IS UNDER ATTACK'; strip.classList.add('on'); strip2T=2.5; }
    if(strip2T>0){ strip2T-=dt; if(strip2T<=0&&strip){ strip.classList.remove('on'); strip.textContent='⚠ THE HEARTROOT IS UNDER ATTACK'; } } last2=c2; }; }
window.__courtdecor={ info:()=>({beds:BED.size,edges:[...BED.values()].filter(c=>c.edge).length,straight:straight.length,corners:corners.length,runs:runs.length,pieces,bushes:BUSHES,flowers:FLOWERS,trees,pillars,heart2:!!H2CG,bar2:!!bar2,before:Object.assign({},before),after:Object.assign({},after),used:Object.assign({},USED)}),
  loaded:()=>WANT>0&&DONE>=WANT, flyCost:n=>{ if(n!=null){ BED_FLY=n; flowFly=flyField(); } return BED_FLY; }, flySteps:(cx,cz)=>{ let i=idx(cx,cz), n=0; while(i>=0&&!isGoal(i)&&n<500){ i=flowFly.nxt[i]; n++; } return i>=0&&isGoal(i)?n:-1; }, isBed:(cx,cz)=>!!cellOf(cx,cz), isHedge:(cx,cz)=>{ const c=cellOf(cx,cz); return !!(c&&c.edge); }, top:(cx,cz)=>{ const c=cellOf(cx,cz); return c?c.top:null; }, open:()=>[...OPEN].map(i=>[i%GW,(i/GW)|0]),
  probe:{ HEDGE, cw, cwz, wc, wcz, solidAt:(x,z,y,h)=>solidAt(x,z,y,h), floorAt:(x,z,y)=>floorAt(x,z,y), hero:()=>hero, flyDist:(cx,cz)=>flowFly.dist[idx(cx,cz)], trees:()=>TREE_OBJS, procs:()=>({pillars:world.userData.pillarProcs||[]}), heart2:()=>({x:C2X,z:C2Z,cell:[GOAL2%GW,(GOAL2/GW)|0]}) } };
// build 291, Matt: "i was kinda not haveing fun on map 3 then i gave myself some mana and it became more fun. we need about 400 more mana, 20 more roots and you can increase that starting wave mob count
// by 30" (game.js: mana 520 -> 920, roots du 60 -> 80). The court's FIRST wave brings 30 more goblins, on the gates that wave opens, coming out between and after its own.
const W1_EXTRA=30;
{ const prevWC=waveComp; waveComp=function(w){ const c=prevWC(w); if(SURVIVAL||(w-MAP.wbase)!==1) return c; const lanes=[...new Set(c.q.map(x=>x.lane))]; if(!lanes.length) return c;
  let t=2; for(let i=0;i<W1_EXTRA;i++){ c.q.push({t,kind:'goblin',lane:lanes[i%lanes.length]}); t+=.6; } c.q.sort((a,b)=>a.t-b.t);
  const g=c.q.filter(x=>x.kind==='goblin').length; if(c.desc) c.desc=String(c.desc).replace(/Goblins ×[0-9]+/,'Goblins ×'+g); return c; }; }
// build 313 (Matt: "take out all bandits from entire map"; and for the Archhag's wave, "keep the goblins and orcs take out ranged mobs"): no bandit on any court wave, and her wave (the last)
// has no troll archers either -- each one taken out comes out as a goblin instead, in its place in the line, so the crowd stays the same size (drakes stay: they bite, they don't shoot)
const NO_RANGED=x=>x.kind==='archer', NO_RANGED_LAST=x=>x.kind==='archer'||x.kind==='troll', WOLF='direwolf';
{ const prevWC=waveComp; waveComp=function(w){ const c=prevWC(w); if(!MAP||MAP.id!=='court') return c; const out=(!SURVIVAL&&(w-MAP.wbase)===MAP.waves)?NO_RANGED_LAST:NO_RANGED;
    // build 327 (Matt, after a full run: "lets basically trad out all the trol archers for dire wolves"): every troll archer (all seven waves) comes out as a PAIR of dire wolves, together on its
    // lane -- a pack, not a lone wolf (the build-314 halving is gone with them); bandits are still goblins
    let n=0; const packs=[]; for(const x of c.q){ if(x.kind==='troll'){ x.kind=WOLF; packs.push({t:x.t+.15,kind:WOLF,lane:x.lane}); n++; } else if(out(x)){ x.kind='goblin'; n++; } }
    if(packs.length){ c.q.push(...packs); c.q.sort((a,b)=>a.t-b.t); } if(!n||!c.desc) return c;
    const g=c.q.filter(x=>x.kind==='goblin').length, wv=c.q.filter(x=>x.kind===WOLF).length; c.desc=String(c.desc).replace(/Goblins ×[0-9]+/,'Goblins ×'+g).replace(/ · Bandits ×[0-9]+/,'').replace(/ · Troll Archers ×[0-9]+/,wv?' · Dire Wolves ×'+wv:''); return c; }; }
window.__courtdecor.w1Extra=W1_EXTRA;
window.__courtdecor.hedgeCells=()=>[...BED.values()].filter(c=>c.edge).map(c=>({cx:c.cx,cz:c.cz,top:c.top}));
window.__courtdecor.topiList=()=>TOPI;   // build 308: the Archhag (95f-archhag.js) wakes them
window.__courtdecor.topiaries=()=>({placed:TOPI.length,cells:TOPI_CELLS.map(c=>[c.cx,c.cz]),h:TOPI_H,kinds:TOPI.reduce((o,t)=>{ o[t.kind]=(o[t.kind]||0)+1; return o; },{})});
})();
