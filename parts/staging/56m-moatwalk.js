// ===== THE DRAWBRIDGE'S WALL-WALK (build 418). Matt, of the hall roof: "the top needs to communicate all the way around itself" / "on the south side it needs to connect to the outbuilding" / (to the sketch) "yes your map is what i want".
// game.js (MAPS 'moat' build) makes the ward's curtain walls a paved walk at the roof's height (8) joined to the roof at both ends, and the inn's walls a walk at their own lowered height. This file:
//  * lays SLABS where the walk crosses an opening the horde uses -- the postern, the gate (under the arch) and the sally port: a stone deck the hero walks over and the mobs walk under (RAILBOXES with a bot,
//    game.js solidAt/floorAt: hero-only, so the paths below are untouched);
//  * builds the BRIDGE from the south wall down to the inn's wall-top over the moat and the green: a run of slab steps (each a little lower; step boxes climb a stair-step at a time), walked under too;
//  * guards every open edge of the walk: a crenellated parapet on the outside, a low wall on the ward / inn side, and along the slabs' and the bridge's open sides -- all RAILBOXES (a jump clears them,
//    a tower beside one is not lifted). Edges against a wall, the roof, the next stretch of walk, a slab or the bridge are left open.
// The horde never climbs up here (the walls are far too high for its paths): a tower on the walk is reached only by shots and bombs. Only MAP.id==='moat'. Test hook: window.__moatwalk.
(function(){
'use strict';
window.__moatwalk={ info:()=>null };
if(!MAP||MAP.id!=='moat'||!MAP.walk) return;
const Wk=MAP.walk, P=MAP.padN|0, W=Wk.h, IH=WALLH-(Wk.innDrop||2), RAIL_H=1.15, WALL_H=.75, MER_H=.65, DEPTH=.3, SLAB=.5;   /* DEPTH .3: a slim parapet, so a one-cell wall walk keeps room to walk */
const cnt={ slabs:0, steps:0, guards:0, merlons:0, edges:0 };
const R=(x0,x1,z0,z1)=>({ x0:cw(x0)-CELL/2, x1:cw(x1)+CELL/2, z0:cwz(z0+P)-CELL/2, z1:cwz(z1+P)+CELL/2 });
const inR=(r,cx,cz)=>cx>=r[0]&&cx<=r[1]&&cz>=r[2]+P&&cz<=r[3]+P;
// ---- what is a walk cell, and what an edge may open onto
const roof=MAP.roof, inRoof=(cx,cz)=>roof&&cx>=roof.x0&&cx<=roof.x1&&cz>=roof.z0&&cz<=roof.z1;
const H=(cx,cz)=>inb(cx,cz)?(rampA[idx(cx,cz)]?rampH[idx(cx,cz)]:hgt[idx(cx,cz)]):-99;
const walkCell=(cx,cz)=>inb(cx,cz)&&gat(cx,cz)===T.CARPET&&!inRoof(cx,cz)&&(Math.abs(H(cx,cz)-W)<.01||(inR(Wk.inn,cx,cz)&&Math.abs(H(cx,cz)-IH)<.01));
const DK=window.__moatdeck, deckCell=(cx,cz)=>!!(DK&&DK.cell(cx,cz));   /* build 439: the yard roofed over (56k9-moatdeck.js): no guard where the walk runs on onto the deck */
const slabCell=(cx,cz)=>Wk.slabs.some(s=>inR(s,cx,cz))||inR(Wk.bridge,cx,cz);
// ---- the look: one stone, a darker cap; every piece instanced
const stone=mat(0x5a5276), cap=mat(0x2b2540), deck=mat(0x6a6080);
const parts={ wall:[], cap:[], mer:[], slab:[] };
const O=new THREE.Object3D();
function piece(list,x,y,z,sx,sy,sz){ O.position.set(x,y,z); O.scale.set(sx,sy,sz); O.rotation.set(0,0,0); O.updateMatrix(); list.push(O.matrix.clone()); }
// build 418 (Matt: "the crown of both buildings needs to have those teeth far enough apart to fit a ballista"): a merlon on every OTHER cell -- a gap of about three units between them, wider than a ballista's cell.
// mer: which cell along this guard starts the pattern (0 = a merlon on its first cell, 1 = a gap first), so the teeth run on unbroken from one guard to the next.
function guard(x0,x1,z0,z1,top,bot,outer,mer){ const cx=(x0+x1)/2, cz=(z0+z1)/2, sx=x1-x0, sz=z1-z0, base=top-RAIL_H;
  RAILBOXES.push(Object.assign({ x0, x1, z0, z1, top, noStand:true },bot!==undefined?{bot}:{})); cnt.guards++;
  piece(parts.wall,cx,base+WALL_H/2,cz,sx,WALL_H,sz); piece(parts.cap,cx,base+WALL_H+.06,cz,sx+.06,.12,sz+.06);
  if(outer){ const along=sx>sz; const n=Math.max(1,Math.round((along?sx:sz)/CELL)); for(let i=0;i<n;i++){ if(((i+(mer|0))&1)!==0) continue; const t=(i+.5)/n; piece(parts.mer,along?x0+sx*t:cx,base+WALL_H+.12+MER_H/2,along?cz:z0+sz*t,along?sx/n*.48:sx+.04,MER_H,along?sz+.04:sz/n*.48); cnt.merlons++; } } }
// ---- the walk's open edges
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
for(let cz=0;cz<GH;cz++) for(let cx=0;cx<GW;cx++){ if(!walkCell(cx,cz)) continue; const y=H(cx,cz);
  for(const [dx,dz] of DIRS){ const nx=cx+dx, nz=cz+dz; if(!inb(nx,nz)) continue; const t=gat(nx,nz);
    if(walkCell(nx,nz)||inRoof(nx,nz)||slabCell(nx,nz)||deckCell(nx,nz)||t===T.WALL||t===T.PILLAR) continue; if(H(nx,nz)>=y-.6) continue;
    const ex=cw(cx)+dx*(CELL/2-DEPTH/2), ez=cwz(cz)+dz*(CELL/2-DEPTH/2), hx=dx?DEPTH/2:CELL/2, hz=dz?DEPTH/2:CELL/2;
    const inner=inR(Wk.ward,nx,nz)||(inR(Wk.inn,nx,nz)&&nx>Wk.inn[0]&&nx<Wk.inn[1]&&nz>Wk.inn[2]+P&&nz<Wk.inn[3]+P);
    guard(ex-hx,ex+hx,ez-hz,ez+hz,y+RAIL_H,undefined,!inner,(dx?cz:cx)&1); cnt.edges++; } }
// ---- the slabs over the postern, the gate and the sally port: a deck at the walk's height, walked under; guards along their open sides
for(const s of Wk.slabs){ const r=R(s[0],s[1],s[2],s[3]), bot=s[4];
  RAILBOXES.push({ x0:r.x0, x1:r.x1, z0:r.z0, z1:r.z1, top:W, bot, noStand:true }); cnt.slabs++;
  piece(parts.slab,(r.x0+r.x1)/2,(W+bot)/2,(r.z0+r.z1)/2,r.x1-r.x0,Math.max(SLAB,W-bot),r.z1-r.z0);   /* build 449: a lintel down to the gate's top */
  const alongX=(s[1]-s[0])>=(s[3]-s[2]);   // the walk runs across the opening's long side: guard the other two
  if(s[0]===s[1]){ /* a one-wide crossing in an east/west wall (the sally port): guard its west and east faces */ if(!deckCell(s[0]-1,s[2]+P)) guard(r.x0-DEPTH/2,r.x0+DEPTH/2,r.z0,r.z1,W+RAIL_H,W-.1,false); guard(r.x1-DEPTH/2,r.x1+DEPTH/2,r.z0,r.z1,W+RAIL_H,W-.1,true,(s[2]+P)&1); }
  else { if(!deckCell(s[0],s[2]+P-1)) guard(r.x0,r.x1,r.z0-DEPTH/2,r.z0+DEPTH/2,W+RAIL_H,W-.1,false); guard(r.x0,r.x1,r.z1-DEPTH/2,r.z1+DEPTH/2,W+RAIL_H,W-.1,true,s[0]&1); } }
// ---- the bridge: slab steps from the south wall down to the inn's wall-top, each a row long; guards both sides
const B=Wk.bridge, nB=B[3]-B[2]+1;
for(let i=0;i<nB;i++){ const z=B[2]+i, top=+(W-(W-IH)*(i+1)/(nB+1)).toFixed(3), r=R(B[0],B[1],z,z);
  RAILBOXES.push({ x0:r.x0, x1:r.x1, z0:r.z0, z1:r.z1, top, bot:top-.6, step:true, noStand:true }); cnt.steps++;
  piece(parts.slab,(r.x0+r.x1)/2,top-SLAB/2,(r.z0+r.z1)/2,r.x1-r.x0,SLAB,r.z1-r.z0);
  guard(r.x0-DEPTH/2,r.x0+DEPTH/2,r.z0,r.z1,top+RAIL_H,top-.1,true,(z+P)&1); guard(r.x1-DEPTH/2,r.x1+DEPTH/2,r.z0,r.z1,top+RAIL_H,top-.1,true,(z+P)&1); }
// ---- draw it: four instanced meshes
const mk=(geo,m,list)=>{ const im=new THREE.InstancedMesh(geo,m,Math.max(1,list.length)); list.forEach((M,i)=>im.setMatrixAt(i,M)); im.count=list.length; im.instanceMatrix.needsUpdate=true; im.userData.noOL=true; im.frustumCulled=false; world.add(im); return im; };
const unit=G.box(1,1,1); mk(unit,stone,parts.wall); mk(unit,cap,parts.cap); mk(unit,stone,parts.mer); mk(unit,deck,parts.slab);
// test helpers (moatwalk-test.mjs): where a cell is in the world, and the hero walked there in small steps with the game's own collision (moveCircle) and floor (floorAt)
const at=(cx,cz)=>({ x:cw(cx), z:cwz(cz+P) });
function walkTo(x,z){ const h=hero; for(let i=0;i<400;i++){ const dx=x-h.x, dz=z-h.z, d=Math.hypot(dx,dz); if(d<.15) return true; const s=Math.min(.12,d); const x0=h.x, z0=h.z; moveCircle(h,dx/d*s,dz/d*s,.42,true); h.y=floorAt(h.x,h.z,h.y+.01); if(Math.hypot(h.x-x0,h.z-z0)<.005) return false; } return false; }
window.__moatwalk={ at, walkTo, probe:(x,z,y)=>({ floor:floorAt(x,z,y), solid:solidAt(x,z,y,true) }), info:()=>Object.assign({ W, IH, cells:(()=>{ let n=0; for(let cz=0;cz<GH;cz++) for(let cx=0;cx<GW;cx++) if(walkCell(cx,cz)) n++; return n; })() },cnt), bridge:()=>RAILBOXES.filter(b=>b.step).map(b=>({ top:b.top, z:+((b.z0+b.z1)/2).toFixed(1), x:+((b.x0+b.x1)/2).toFixed(1) })), walkCell, slabCell };
})();
