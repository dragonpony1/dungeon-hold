// ===== THE DEEP PRISON'S PATHS (build 374). Matt: "the last thing on this map is getting our pathing down" / "i have a railing being made now, we're gonna create paths and we probably need more stairs" / "i like the B plus A idea".
// The map itself (game.js, MAP.build) now cuts the middle and lower terraces in two lanes by a railing line each, joined at the EAST end -- the horde walks every terrace out and back, so the short gates get long roads -- moves the middle flight to the
// west end, and gives the HERO his own stairs (three wide, the middle of each cliff) with a gate through each railing line: MOBBLOCK cells (game.js), ordinary floor to the hero, a wall to the walking horde (flyers ignore them), unbuildable.
// This file puts Matt's sewer railing (parts/assets/prison-railing.glb: his 3,921-triangle model cut to 1,083 -- 0.5 MB, one colour picture) where it stands: along both railing lines (but for the hero's gates) and along EVERY real drop on the map --
// each cliff's lip and the open sides of every flight, found from the floor heights themselves -- as ONE instanced draw, refilled with the pieces near the camera. The hero cannot walk through a rail (RAILBOXES, a thin box with a guard height that
// a jump clears, as the Throne Room's); a walking mob is kept off by the map's own rules, flyers and bolts pass over. A rail never lifts a tower set beside it (noStand). Only MAP.id==='prison'. Test hook: window.__prisonpaths.
(function(){
'use strict';
window.__prisonpaths={ info:()=>null };
if(!MAP||MAP.id!=='prison') return;
const RAIL_H=1.15, INSET=.85, HALF=.12, R_NEAR=36, OWN=.3, DIM=0xdcdcdc;
const cnt={ pieces:0, walls:0, lips:0, sides:0, boxes:0, near:0, loaded:0 };
const pieces=[];   // { x, y, z, rot }  rot 0: the piece lies along x; PI/2: along z
const addBox=(p)=>{ const along=p.rot===0; const b=along?{ x0:p.x-CELL/2, x1:p.x+CELL/2, z0:p.z-HALF, z1:p.z+HALF }:{ x0:p.x-HALF, x1:p.x+HALF, z0:p.z-CELL/2, z1:p.z+CELL/2 }; b.top=p.y+RAIL_H; b.noStand=true; RAILBOXES.push(b); cnt.boxes++; };
// ---- the two railing lines (every cell of them but the hero's gate, x 22-24)
for(const [row,x0,x1] of [[29,8,33],[18,13,28]]) for(let cx=x0;cx<=x1;cx++){ if(cx>=22&&cx<=24) continue; pieces.push({ x:cw(cx), y:hgt[idx(cx,row)], z:cwz(row), rot:0, kind:'wall' }); cnt.walls++; }
// ---- every drop: a cell of flat floor with a neighbour more than a step lower gets a rail along that edge (a cliff's lip, the open side of a flight)
for(let cz=0;cz<GH;cz++) for(let cx=0;cx<GW;cx++){ const i=idx(cx,cz); if(!walk(grid[i])||rampA[i]) continue;
  for(const [dx,dz] of [[0,-1],[0,1],[-1,0],[1,0]]){ const nx=cx+dx, nz=cz+dz; if(!inb(nx,nz)) continue; const j=idx(nx,nz); if(!walk(grid[j])) continue; if(hgt[i]-hgt[j]<=.6) continue;
    const p=dz!==0?{ x:cw(cx), y:hgt[i], z:cwz(cz)+dz*INSET, rot:0, kind:'lip' }:{ x:cw(cx)+dx*INSET, y:hgt[i], z:cwz(cz), rot:PI/2, kind:'side' }; pieces.push(p); cnt[p.kind==='lip'?'lips':'sides']++; } }
cnt.pieces=pieces.length; for(const p of pieces) addBox(p);
// ---- the model, instanced
fetchBytes(ASSET('prison-railing.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',gl=>res(gl.scene||gl.scenes[0]),rej))).then(root=>{ try{
  let m=null; root.traverse(o=>{ if(!m&&o.isMesh) m=o; }); if(!m) throw new Error('the railing has no mesh');
  const geo=m.geometry.clone(); geo.computeBoundingBox(); const bb=geo.boundingBox; geo.translate(-(bb.min.x+bb.max.x)/2,-bb.min.y,-(bb.min.z+bb.max.z)/2);   // standing on its foot, centred
  const tex=m.material.map; if(tex){ tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy()); }
  const mat=new THREE.MeshToonMaterial({ map:tex, emissiveMap:tex, emissive:new THREE.Color(OWN,OWN,OWN), gradientMap:GRAD, color:DIM, side:THREE.DoubleSide });   // its own colour lights it a little, as the floor's tiles, so the moss shows through the firelight
  const im=new THREE.InstancedMesh(geo,mat,Math.max(1,pieces.length)); im.count=0; im.frustumCulled=false; im.userData.noOL=true; world.add(im);
  const Mx=new THREE.Matrix4(), Q=new THREE.Quaternion(), V=new THREE.Vector3(), S1=new THREE.Vector3(1,1,1), up=new THREE.Vector3(0,1,0);
  for(const p of pieces){ Q.setFromAxisAngle(up,p.rot); V.set(p.x,p.y,p.z); p.m=new THREE.Matrix4().compose(V,Q,S1); }
  const DIR=new THREE.Vector3(); let frame=0; const R2=R_NEAR*R_NEAR;
  function refill(){ const cx=camera.position.x, cz=camera.position.z; camera.getWorldDirection(DIR); const fl=Math.hypot(DIR.x,DIR.z)||1, fx=DIR.x/fl, fz=DIR.z/fl; let n=0;
    for(const p of pieces){ const dx=p.x-cx, dz=p.z-cz, d2=dx*dx+dz*dz; if(d2>R2) continue; if(d2>36&&(dx*fx+dz*fz)<-.2*Math.sqrt(d2)) continue; im.setMatrixAt(n++,p.m); }
    im.count=n; im.instanceMatrix.needsUpdate=true; cnt.near=n; }
  WORLDANIM.push(()=>{ if((frame++%2)===0) refill(); }); refill(); cnt.loaded=1;
  window.__prisonpaths.mesh=im; window.__prisonpaths.refill=refill;
  }catch(e){ console.warn('prison railing',e); } }).catch(e=>console.warn('prison railing',e));
// ---- build 388: the rim's TWO flights (game.js: the west one, and the new east one Matt asked for). The east flight lands beside the middle terrace's gap, so by the shortest road nearly the whole rim would take it and choke it instead. So every second
// mob that walks out is a WEST-goer: while it is on the rim it follows a field of its own in which the east flight is shut (FIELD_W, worked out with the rest at every reflow), and the horde splits between the two; off the rim it is an ordinary mob again
const EAST_FLIGHT=[36,40,35,37], RIM_ROW=35; let FW=null, splitN=0; const split={ west:0, east:0 };
function fieldW(){ const [x0,x1,z0,z1]=EAST_FLIGHT, saved=[]; for(let z=z0;z<=z1;z++) for(let x=x0;x<=x1;x++){ const i=idx(x,z); saved.push([i,MOBBLOCK[i]]); MOBBLOCK[i]=1; } try{ FW={ def:bfs(true), free:bfs(false) }; } finally { for(const [i,v] of saved) MOBBLOCK[i]=v; } }
{ const prev=reflow; reflow=function(){ prev.apply(this,arguments); fieldW(); }; } fieldW();
{ const prev=spawnEnemy; spawnEnemy=function(){ const r=prev.apply(this,arguments); for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(e.__split!==undefined) break; e.__split=(e.fly||e.kind==='kegcart'||e.kind==='firecart'||e.pushFor)?0:((splitN++%2)?1:2);   /* a siege cart (and its crew) keeps the one road: a long cart turning back along the rim jams it */ if(e.__split===1) split.west++; else if(e.__split===2) split.east++; } return r; }; }
{ const prev=updateEnemies; updateEnemies=function(dt){ for(const e of enemies){ if(e.dead||e.__split!==1) continue; const cz=wcz(e.z); if(cz>=RIM_ROW&&(e.y||0)>4.5&&FW){ e.fD=FW.def; e.fF=FW.free; } else if(e.fD){ e.fD=null; e.fF=null; } } return prev.apply(this,arguments); }; }
// ---- the test hook
const flowFrom=(cx,cz)=>{ let i=idx(cx,cz), n=0; while(i>=0&&!isGoal(i)&&n<900){ i=flowFree.nxt[i]; n++; } return i>=0&&isGoal(i)?n:-1; };
window.__prisonpaths=Object.assign(window.__prisonpaths,{ info:()=>Object.assign({},cnt), pieces:()=>pieces.slice(), reach:()=>Object.fromEntries(Object.entries(LANES).map(([k,l])=>[k,flowFrom(l.cx,l.cz)])), blocked:(cx,cz)=>!!MOBBLOCK[idx(cx,cz)], flowFrom, split:()=>Object.assign({},split), westDist:(cx,cz)=>FW?FW.free.dist[idx(cx,cz)]:null, solid:(x,z,y,h)=>solidAt(x,z,y,!!h) });
})();
