// ===== THE DRAWBRIDGE: THE CASTLE YARD ROOFED OVER (build 439). Matt: "on the draw bridge level just cover both buildings except the place where the stairs come up" -- and, asked, the castle yard AND the inn.
// (The inn is game.js: its middle is filled up to its wall-top, one solid platform. This file is the castle's.)
//  * A STONE DECK over the whole yard inside the curtain walls, level with the wall-walk and the hall roof (8 up): one platform from wall to wall. It is a slab -- the hero walks on top of it,
//    and under it (RAILBOXES with a bot; game.js solidAt/floorAt), the horde and the Heartroot stay down in the yard below, their roads untouched.
//  * THE STAIRWELL: open over the stair up to the hall roof (the stair and a square either side, so a hero on the stair never brushes the deck), with a railing round its three open sides.
//  * Down in the yard the camera stays under the deck, as it does under a hall's walls indoors; up top it is the open sky as before.
//  * TOWERS UP TOP: standing on the deck (or the walk), aim at the deck and a tower goes up there -- any tower that shoots or works at range, not the ground pieces (the hedge, the cage, the halos, the pit,
//    the mouse trap, the perch). It takes no square of the yard below (the mobs walk on underneath it), it is solid to the hero up top, and the horde reaches it only with shots and bombs. Aiming picks
//    the towers at your own level: up top, the deck's; down below, the yard's.
// Only MAP.id==='moat'. Test hook: window.__moatdeck.
(function(){
'use strict';
window.__moatdeck={ info:()=>null, cell:()=>false };
if(!MAP||MAP.id!=='moat'||!MAP.walk) return;
const Wk=MAP.walk, P=MAP.padN|0, Y=Wk.h, SLAB=.45, BOT=Y-SLAB, RAIL_H=1.15, WALL_H=.75, DEPTH=.3;
const X0=Wk.ward[0], X1=Wk.ward[1], Z0=Wk.ward[2]+P, Z1=Wk.ward[3]+P;   // the yard inside the curtain walls (the wall-walk rings it)
const inYard=(cx,cz)=>cx>=X0&&cx<=X1&&cz>=Z0&&cz<=Z1;
// ---- the stairwell: the stair's own squares and one either side
let hx0=1e9, hx1=-1e9, hz0=1e9, hz1=-1e9;
for(let cz=Z0;cz<=Z1;cz++) for(let cx=X0;cx<=X1;cx++){ if(!rampA[idx(cx,cz)]) continue; hx0=Math.min(hx0,cx); hx1=Math.max(hx1,cx); hz0=Math.min(hz0,cz); hz1=Math.max(hz1,cz); }
let HAS_HOLE=hx0<=hx1; if(HAS_HOLE){ hx0=Math.max(X0,hx0-1); hx1=Math.min(X1,hx1+1); }
if(Array.isArray(Wk.hole)){ hx0=Wk.hole[0]; hx1=Wk.hole[1]; hz0=Wk.hole[2]+P; hz1=Wk.hole[3]+P; HAS_HOLE=true; }   /* build 449: the switchback's whole well, as the map gives it */
const EXIT=Array.isArray(Wk.holeExit)?Wk.holeExit:null;   /* where the top flight comes out (no railing there) */
const inHole=(cx,cz)=>HAS_HOLE&&cx>=hx0&&cx<=hx1&&cz>=hz0&&cz<=hz1;
const cell=(cx,cz)=>inb(cx,cz)&&inYard(cx,cz)&&!inHole(cx,cz)&&hgt[idx(cx,cz)]<Y-.01;
const cnt={ cells:0, boxes:0, rails:0, placed:0, camClamp:0 };
// ---- the deck: a slab per run of squares along each row
const stone=mat(0x6a6080), wood=mat(0x4a3320), wallM=mat(0x5a5276), capM=mat(0x2b2540);
const parts={ slab:[], beam:[], wall:[], cap:[] }, O=new THREE.Object3D();
// its top paved like the hall roof and the walk (game.js paintFloor's royal road: four stones a square on dark grout), one stone texture repeated a square at a time
function paveTex(){ const S=64, c=cv(S,S), g=c.getContext('2d'); g.fillStyle='#5e5a52'; g.fillRect(0,0,S,S); for(let sx=0;sx<2;sx++) for(let sz=0;sz<2;sz++){ g.fillStyle=hsl(38,10,R(48,56)); g.fillRect(sx*32+3,sz*32+3,26,26); for(let i=0;i<5;i++) splat(g,sx*32+4+rnd()*24,sz*32+4+rnd()*24,R(2,5),rnd()<.5?hsl(38,8,40):hsl(40,14,66),.22); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy()); return t; }
const PAVE=new THREE.MeshToonMaterial({ map:paveTex(), gradientMap:GRAD, color:C(0xffffff) }); const tops=[];
function paveRun(x0,x1,z0,z1){ const w=x1-x0, d=z1-z0, geo=new THREE.PlaneGeometry(w,d); const uv=geo.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*w/CELL,uv.getY(i)*d/CELL); uv.needsUpdate=true;
  const m=new THREE.Mesh(geo,PAVE); m.rotation.x=-PI/2; m.position.set((x0+x1)/2,Y+.01,(z0+z1)/2); m.userData.noOL=true; world.add(m); tops.push(m); }
function piece(list,x,y,z,sx,sy,sz){ O.position.set(x,y,z); O.scale.set(sx,sy,sz); O.rotation.set(0,0,0); O.updateMatrix(); list.push(O.matrix.clone()); }
for(let cz=Z0;cz<=Z1;cz++){ let cx=X0; while(cx<=X1){ if(!cell(cx,cz)){ cx++; continue; } let e=cx; while(e+1<=X1&&cell(e+1,cz)) e++;
    const x0=cw(cx)-CELL/2, x1=cw(e)+CELL/2, z0=cwz(cz)-CELL/2, z1=cwz(cz)+CELL/2; cnt.cells+=e-cx+1;
    RAILBOXES.push({ x0, x1, z0, z1, top:Y, bot:BOT, noStand:true, deck:true }); cnt.boxes++;
    piece(parts.slab,(x0+x1)/2,Y-SLAB/2,(z0+z1)/2,x1-x0,SLAB,z1-z0); paveRun(x0,x1,z0,z1);
    if((cz-Z0)%3===1) piece(parts.beam,(x0+x1)/2,BOT-.18,(z0+z1)/2,x1-x0,.36,.45);   // a timber under every third row: it reads as a roof from below
    cx=e+1; } }
// ---- the railing round the stairwell (west, east and south; the north side is the stair's top, onto the hall roof)
function rail(x0,x1,z0,z1){ RAILBOXES.push({ x0, x1, z0, z1, top:Y+RAIL_H, bot:Y-.1, noStand:true }); cnt.rails++; const cx=(x0+x1)/2, cz=(z0+z1)/2, sx=x1-x0, sz=z1-z0;
  piece(parts.wall,cx,Y+WALL_H/2,cz,sx,WALL_H,sz); piece(parts.cap,cx,Y+WALL_H+.06,cz,sx+.06,.12,sz+.06); }
if(HAS_HOLE){ const za=cwz(hz0)-CELL/2, zb=cwz(hz1)+CELL/2, xa=cw(hx0)-CELL/2, xb=cw(hx1)+CELL/2;
  if(cell(hx0-1,hz1)) rail(xa-DEPTH,xa,za,zb);
  if(cell(hx1+1,hz1)) rail(xb,xb+DEPTH,za,zb);
  if(cell(hx0,hz1+1)){ if(!EXIT) rail(xa-DEPTH,xb+DEPTH,zb,zb+DEPTH); else { const ea=cw(EXIT[0])-CELL/2, eb=cw(EXIT[1])+CELL/2; if(ea>xa) rail(xa-DEPTH,ea,zb,zb+DEPTH); if(eb<xb) rail(eb,xb+DEPTH,zb,zb+DEPTH); } } }
{ const mk=(geo,m,list)=>{ const im=new THREE.InstancedMesh(geo,m,Math.max(1,list.length)); list.forEach((M,i)=>im.setMatrixAt(i,M)); im.count=list.length; im.instanceMatrix.needsUpdate=true; im.userData.noOL=true; im.frustumCulled=false; world.add(im); return im; };
  const unit=G.box(1,1,1); mk(unit,stone,parts.slab); mk(unit,wood,parts.beam); mk(unit,wallM,parts.wall); mk(unit,capM,parts.cap); }
// ---- the camera: down in the yard, it stays under the deck (slid in along its own line to the hero, still looking where it looked)
const under=()=>{ const cx=wc(hero.x), cz=wcz(hero.z); return inYard(cx,cz)&&(hero.y||0)<Y-1; };
const LIM=BOT-.45, V=new THREE.Vector3(), L=new THREE.Vector3();
{ const prev=updateCamera; updateCamera=function(dt){ prev.apply(this,arguments); if(S.phase==='start'||!under()) return; const p=camera.position; if(p.y<=LIM) return;
    const ty=(hero.y||0)+1.5; if(ty>=LIM) return; camera.getWorldDirection(V); const dist=Math.hypot(p.x-hero.x,p.y-ty,p.z-hero.z); L.copy(p).addScaledVector(V,dist);
    const k=(LIM-ty)/(p.y-ty); p.set(hero.x+(p.x-hero.x)*k,LIM,hero.z+(p.z-hero.z)*k); camera.lookAt(L); cnt.camClamp++; }; }
// ---- towers on the deck
const NO_DECK=k=>!!NOWALK_DEF[k]||k==='spike';
// co-op sweep 2026-10-02: the host placing a GUEST's tower asks at the GUEST's height (forceY, set by __moatdeck.placeAt below) -- it used to ask the host's own hero, so a guest's roof tower went into the yard
// whenever the host stood on the ground (and a guest's yard tower went up on the roof whenever the host stood up there)
let forceY=null; const up=()=>(forceY!=null?forceY:(hero.y||0))>=Y-.6;
const towerAt=(cx,cz)=>defs.find(d=>d.onDeck&&d.cx===cx&&d.cz===cz)||null;
// build 497 (Matt: "they snap to the grid instead of being able to place them" -- ballistas on the Drawbridge): a tower on the deck goes exactly where it is aimed, as on the ground -- not to the middle of its
// square. Crowding is a distance now: too close to another deck tower is 'Already occupied'.
const DECK_GAP=1.6, crowded=(x,z)=>defs.find(d=>d.onDeck&&Math.hypot(d.x-x,d.z-z)<DECK_GAP)||null;
{ const prev=updateGhost; updateGhost=function(){ prev.apply(this,arguments); if(!placing||!ghost||!up()) return; const [px,pz]=placeStage===1?anchorPos:aimPoint(); const cx=wc(px), cz=wcz(pz); if(!cell(cx,cz)) return;
    const cfg=DEFS[placing], x=px, z=pz; let reason='';
    if(NO_DECK(placing)) reason="That one goes on the ground"; else if(crowded(x,z)) reason='Already occupied'; else if(Math.hypot(hero.x-x,hero.z-z)<1.05) reason="You're standing there"; else if(S.du+cfg.du>DU_CAP) reason='Not enough Defense Units'; else if(S.mana<cfg.mana) reason='Not enough mana';
    ghostOk=!reason; ghostReason=reason; ghostPos=[x,z]; ghostCell=[cx,cz]; ghost.position.set(x,Y,z); const m=ghostOk?GHOST_OK:GHOST_BAD; ghost.traverse(o=>{ if(o.isMesh) o.material=m; });
    if(typeof ghostSector!=='undefined'&&ghostSector){ ghostSector.position.set(x,Y,z); if(typeof tintSector==='function') tintSector(ghostSector,ghostOk?0x40ff80:0xff3030); } }; }
{ const prev=placeDefAt; placeDefAt=function(kind,x,z,rot){ const cx=wc(x), cz=wcz(z); if(!(up()&&cell(cx,cz)&&!NO_DECK(kind))) return prev.apply(this,arguments); if(crowded(x,z)) return null;
    const d=prev.call(this,kind,x,z,rot); if(!d) return d;
    for(const i of d.cells||[]) if(defAt[i]===d) defAt[i]=null; d.cells=[]; d.onDeck=true; d.cx=cx; d.cz=cz; d.base=Y; d.top=DEFS[kind].top+Y; if(d.mdl) d.mdl.position.y=Y;
    const r=.7, b={ x0:d.x-r, x1:d.x+r, z0:d.z-r, z1:d.z+r, top:d.top, bot:Y, noStand:true }; RAILBOXES.push(b); d.railboxes=(d.railboxes||[]).concat(b);   /* solid to the hero up top (96b-perch.js's removeDef wrap takes d.railboxes down with it) */
    reflow(); cnt.placed++; return d; }; }
// aiming picks the towers at your own level
// co-op sweep 2026-10-02: the host picking for a guest (its card, its E/X) passes the guest's height as pos.y, so a guest picks at his own level too; a pos with no y is left alone, as before
{ const prev=pickDef; pickDef=function(pos){ const other=pos&&pos!==hero; if(other&&!Number.isFinite(pos.y)) return prev.apply(this,arguments); const hy=other?pos.y:(hero.y||0); const all=defs.slice(), keep=all.filter(d=>Math.abs((d.base||0)-hy)<3);
    if(keep.length===all.length) return prev.apply(this,arguments); defs.length=0; for(const d of keep) defs.push(d); try{ return prev.apply(this,arguments); } finally { defs.length=0; for(const d of all) defs.push(d); } }; }
window.__moatdeck={ cell, inHole, towerAt, under, Y, crowded, noDeck:NO_DECK, deckAt:(x,z,y)=>(y||0)>=Y-.6&&cell(wc(x),wcz(z)), placeAt:(kind,x,z,rot,y)=>{ forceY=Number.isFinite(y)?y:null; try{ return placeDefAt(kind,x,z,rot); } finally{ forceY=null; } },   /* co-op sweep 2026-10-02: hostTryPlaceDef (99-network.js) */ hole:()=>HAS_HOLE?{ x0:hx0, x1:hx1, z0:hz0, z1:hz1 }:null, info:()=>Object.assign({ onDeck:defs.filter(d=>d.onDeck).length },cnt) };
})();
