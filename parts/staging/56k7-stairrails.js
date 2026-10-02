// ===== RAILINGS ON THE DRAWBRIDGE'S SWITCHBACKS (build 453). Matt, of the stairs up to the inn: "we need rails or walls along the edges of these stairs".
// Every flight and landing inside MAP.stairRails (the castle yard's switchback and the inn's) gets a low stone wall wherever its side drops away -- the outer sides, the landing's open edges, and between the
// two flights (on the higher one's edge) -- and stays open where you step on and off (a flight's ends, the landing where a flight meets it, the inn's roof). Each piece follows its own step's height, so the
// railing climbs with the stair. They are hero guards (RAILBOXES: a jump clears one); the horde never walks off a flight's side anyway (its roads only enter a flight at its ends).
// Test hook: window.__stairrails.
(function(){
'use strict';
window.__stairrails={ info:()=>null };
if(!MAP||!Array.isArray(MAP.stairRails)) return;
const P=MAP.padN|0, RAIL_H=1.15, WALL_H=.75, DEPTH=.3, cnt={ rails:0 };
const inReg=(cx,cz)=>MAP.stairRails.some(r=>cx>=r[0]&&cx<=r[1]&&cz>=r[2]+P&&cz<=r[3]+P);
const top0=i=>rampA[i]?rampH[i]:hgt[i], low=i=>rampA[i]?rampL[i]:hgt[i];
// the castle yard's roof (56k9-moatdeck.js, built after this) is a slab at the walk's height over the yard, outside the stairwell: a stair stepping out onto it is not a drop
const Wk=MAP.walk, inDeck=(cx,cz)=>!!(Wk&&Wk.ward&&cx>=Wk.ward[0]&&cx<=Wk.ward[1]&&cz>=Wk.ward[2]+P&&cz<=Wk.ward[3]+P&&!(Array.isArray(Wk.hole)&&cx>=Wk.hole[0]&&cx<=Wk.hole[1]&&cz>=Wk.hole[2]+P&&cz<=Wk.hole[3]+P));
const top=i=>{ const t=top0(i); const cx=i%GW, cz=(i/GW)|0; return inDeck(cx,cz)?Math.max(t,Wk.h):t; };
const isStair=(cx,cz)=>{ if(!inb(cx,cz)||!inReg(cx,cz)) return false; const i=idx(cx,cz); return !!rampA[i]||hgt[i]>.3; };
// two stair cells join (you walk from one to the other): along a flight's own line, or a flight's end onto the landing it meets (or landing to landing), at about the same height
function joined(i,j,alongZ){ const a=rampA[i], b=rampA[j]; if(Math.abs(top(i)-low(j))>1.2&&Math.abs(top(j)-low(i))>1.2&&Math.abs(top(i)-top(j))>1.2) return false;
  if(a&&((a<=2)!==alongZ)) return false; if(b&&((b<=2)!==alongZ)) return false; return true; }
const stone=mat(0x5a5276), cap=mat(0x2b2540), walls=[], caps=[], O=new THREE.Object3D();
function piece(list,x,y,z,sx,sy,sz){ O.position.set(x,y,z); O.scale.set(sx,sy,sz); O.updateMatrix(); list.push(O.matrix.clone()); }
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
for(let cz=0;cz<GH;cz++) for(let cx=0;cx<GW;cx++){ if(!isStair(cx,cz)) continue; const i=idx(cx,cz), t=top(i), l=low(i);
  for(const [dx,dz] of DIRS){ const nx=cx+dx, nz=cz+dz; if(!inb(nx,nz)) continue; const j=idx(nx,nz), g=gat(nx,nz); if(g===T.WALL||g===T.PILLAR) continue;
    if(isStair(nx,nz)&&joined(i,j,dz!==0)) continue;
    if(top(j)>=l-.3) continue;   // the neighbour is as high or higher: nothing to fall off (the inn's roof, the hall's roof, the next flight up)
    const ex=cw(cx)+dx*(CELL/2-DEPTH/2), ez=cwz(cz)+dz*(CELL/2-DEPTH/2), hx=dx?DEPTH/2:CELL/2, hz=dz?DEPTH/2:CELL/2;
    RAILBOXES.push({ x0:ex-hx, x1:ex+hx, z0:ez-hz, z1:ez+hz, top:t+RAIL_H, noStand:true }); cnt.rails++;
    const sx=hx*2, sz=hz*2, base=t; piece(walls,ex,base+WALL_H/2,ez,sx,WALL_H,sz); piece(caps,ex,base+WALL_H+.06,ez,sx+.06,.12,sz+.06);
    const drop=base-top(j); if(drop>.3) piece(walls,ex,top(j)+drop/2,ez,sx,drop,sz); } }   // the wall carries on down to the ground below, so the stair reads as built, not floating
const mk=(m,list)=>{ if(!list.length) return; const im=new THREE.InstancedMesh(G.box(1,1,1),m,list.length); list.forEach((M,k)=>im.setMatrixAt(k,M)); im.instanceMatrix.needsUpdate=true; im.userData.noOL=true; im.frustumCulled=false; world.add(im); };
mk(stone,walls); mk(cap,caps);
window.__stairrails={ info:()=>Object.assign({},cnt) };
})();
