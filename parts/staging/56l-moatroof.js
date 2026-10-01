// ===== THE MAIN HALL'S ROOF (build 383). Matt, of THE DRAWBRIDGE: "give me stair access to the roof of the main hall, the top will be a defense area so build it out roughly". The map (game.js, MAPS 'moat': padN, roof) is padded eight rows to the
// north and the hall in front of the keep has a flat paved roof eight up (x14-35), its front edge where the curtain wall stood, the keep rising behind it, a stair three wide up to it from the ward at its east end; towers can be set up there like
// anywhere (it is ordinary floor, eight up). This file adds what makes it a battlement: a crenellated parapet along the front edge (a low wall with merlons, all one instanced draw), and a guard along it so the hero cannot just walk off -- the same
// RAILBOXES the railings use (a jump clears it, a tower beside it is not lifted). The stair (eight up in eight cells) is too steep for the horde's pathing, so their roads never climb to the roof: a tower up there is hit only by shots and bombs. Only MAP.id==='moat'. Test hook: window.__moatroof.
(function(){
'use strict';
window.__moatroof={ info:()=>null };
if(!MAP||MAP.id!=='moat'||!MAP.roof) return;
const RF=MAP.roof, Y=RF.y, WALL_H=.75, MER_H=.65, DEPTH=.55, RAIL_H=1.15;
const zEdge=cwz(RF.z1)+CELL/2-DEPTH/2;   // the parapet stands on the roof's front edge
const cells=[]; for(let x=RF.x0;x<=RF.x1;x++){ if(RF.stair&&x>=RF.stair[0]&&x<=RF.stair[1]) continue; cells.push(x); }
const cnt={ pieces:0, merlons:0, boxes:0 };
// the guard: one box a cell, along the edge
for(const x of cells){ RAILBOXES.push({ x0:cw(x)-CELL/2, x1:cw(x)+CELL/2, z0:zEdge-DEPTH/2, z1:zEdge+DEPTH/2, top:Y+RAIL_H, noStand:true }); cnt.boxes++; }
// the look: a low wall the length of the edge (a piece a cell) and a merlon on every cell, the castle's own stone
{ const stone=mat(0x5a5276), cap=mat(0x2b2540); const wallG=G.box(CELL,WALL_H,DEPTH), merG=G.box(CELL*.48,MER_H,DEPTH+.04), capG=G.box(CELL,.12,DEPTH+.1);
  const mk=(geo,m,n)=>{ const im=new THREE.InstancedMesh(geo,m,Math.max(1,n)); im.userData.noOL=true; im.frustumCulled=false; world.add(im); return im; };
  const W=mk(wallG,stone,cells.length), Cp=mk(capG,cap,cells.length), Me=mk(merG,stone,cells.length), O=new THREE.Object3D();
  cells.forEach((x,i)=>{ O.position.set(cw(x),Y+WALL_H/2,zEdge); O.updateMatrix(); W.setMatrixAt(i,O.matrix); O.position.set(cw(x),Y+WALL_H+.06,zEdge); O.updateMatrix(); Cp.setMatrixAt(i,O.matrix); O.position.set(cw(x)-CELL*.22,Y+WALL_H+.12+MER_H/2,zEdge); O.updateMatrix(); Me.setMatrixAt(i,O.matrix); cnt.pieces++; cnt.merlons++; });
  for(const im of [W,Cp,Me]) im.instanceMatrix.needsUpdate=true; }
window.__moatroof={ info:()=>Object.assign({ y:Y, x0:RF.x0, x1:RF.x1, z0:RF.z0, z1:RF.z1, stair:RF.stair },cnt) };
})();
