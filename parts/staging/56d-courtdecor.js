// ===== THE CLOISTER COURT'S HEDGE MAZE, TREES AND MARBLE COLONNADE (build 269). Matt sent his courtyard decor (a flowering straight hedge, a gold-flecked corner hedge, the white-and-gold hero tree, a marble column),
// then: "map 3 is a big open space, would you like to use these hedge pieces to start to make the mobs around, place the tree somewhere".
//   * THE MAZE: two square hedge rings round the Heartroot. The outer ring's four gaps turn like a pinwheel (each by a corner, never facing a stair) and the inner ring opens only east and west, so a mob coming down any
//     of the four stairs walks along the outer ring, in, then half the corridor between the rings before it reaches the crystal. A hedge cell is walled the way the moat is (T.WATER: walkers go round it, flyers cross
//     it, nothing is built on it) -- changed after the map is built, then the flow fields are recomputed (reflow). The hero is not a mob: a hedge is a ledge he can jump onto and run along (the solidAt/floorAt wraps
//     below, the Throne Room railings' rule), so the maze never makes him walk the long way round.
//   * THE TREE stands where the four code-built trees stood (the court's corners, cells that were already solid), turned to face the Heartroot. My call: all four spots, not one.
//   * THE COLONNADE: the twenty stand-in pillars become the marble column, same spots, same height.
// Every model is fetched once at the 'later' tier and cloned. Only MAP.id==='court'. Test hook: window.__courtdecor.
(function(){
window.__courtdecor={info:()=>null,loaded:()=>false};
if(!MAP||MAP.id!=='court') return;
const HEDGE=T.WATER, H_STRAIGHT=1.2, H_CORNER=1.6;
const RINGS=[
  {x0:12,x1:32,z0:11,z1:31,gaps:{n:[13,15],e:[12,14],s:[29,31],w:[28,30]}},   // the outer ring: a pinwheel, each gap round the corner from a stair
  {x0:16,x1:28,z0:15,z1:27,gaps:{w:[20,22],e:[20,22]}}];                        // the inner ring: in only from the east or the west
const inGap=(g,v)=>!!g&&v>=g[0]&&v<=g[1];
const CELLS=new Map();
const SP=[]; for(let z=0;z<GH;z++) for(let x=0;x<GW;x++) if(grid[idx(x,z)]===T.SPAWN) SP.push([x,z]);
const before={}; SP.forEach(([x,z])=>{ before[x+','+z]=flowFree.dist[idx(x,z)]; });
function mark(cx,cz){ const i=idx(cx,cz); if(grid[i]!==T.FLOOR||rampA[i]) return; CELLS.set(i,{cx,cz,base:hgt[i]||0,top:(hgt[i]||0)+H_STRAIGHT}); }
for(const r of RINGS){ for(let x=r.x0;x<=r.x1;x++){ if(!inGap(r.gaps.n,x)) mark(x,r.z0); if(!inGap(r.gaps.s,x)) mark(x,r.z1); }
  for(let z=r.z0+1;z<r.z1;z++){ if(!inGap(r.gaps.w,z)) mark(r.x0,z); if(!inGap(r.gaps.e,z)) mark(r.x1,z); } }
const cellOf=(cx,cz)=>cx>=0&&cz>=0&&cx<GW&&cz<GH?CELLS.get(idx(cx,cz)):undefined;
CELLS.forEach((c,i)=>{ grid[i]=HEDGE; });
reflow();
const after={}; SP.forEach(([x,z])=>{ after[x+','+z]=flowFree.dist[idx(x,z)]; });
// ---- the hero climbs them: below a hedge's top it is a wall, at or above it a floor (mobs, loot and orbs keep the moat's rules)
{ const prev=solidAt; solidAt=function(x,z,y,forHero){ if(forHero){ const c=cellOf(wc(x),wcz(z)); if(c) return y<c.top-.25; } return prev.apply(this,arguments); }; }
{ const prev=floorAt; floorAt=function(x,z,y){ const f=prev.apply(this,arguments); const c=cellOf(wc(x),wcz(z)); return c&&y>=c.top-.25?Math.max(f,c.top):f; }; }
// ---- the shape of each hedge: corners (a neighbour along x AND along z) take the corner piece, which also covers one cell along each arm; the rest are straight runs
const has=(x,z)=>!!cellOf(x,z);
const corners=[]; CELLS.forEach(c=>{ const ex=has(c.cx-1,c.cz)||has(c.cx+1,c.cz), ez=has(c.cx,c.cz-1)||has(c.cx,c.cz+1); c.alongX=ex; if(ex&&ez){ const dx=has(c.cx+1,c.cz)?1:-1, dz=has(c.cx,c.cz+1)?1:-1; corners.push({c,dx,dz}); } });
corners.forEach(({c,dx,dz})=>{ [c,cellOf(c.cx+dx,c.cz),cellOf(c.cx,c.cz+dz)].forEach(k=>{ if(k){ k.inCorner=true; k.top=k.base+H_CORNER; } }); });
const runs=[]; const seen=new Set();
CELLS.forEach((c,i)=>{ if(c.inCorner||seen.has(i)) return; const ax=c.alongX; let a=c; while(true){ const p=ax?cellOf(a.cx-1,a.cz):cellOf(a.cx,a.cz-1); if(!p||p.inCorner||p.alongX!==ax) break; a=p; }
  const cells=[]; let b=a; while(b&&!b.inCorner&&b.alongX===ax){ cells.push(b); seen.add(idx(b.cx,b.cz)); b=ax?cellOf(b.cx+1,b.cz):cellOf(b.cx,b.cz+1); } runs.push({ax,cells}); });
// ---- one fetch and one parse per model, a clone per placement
const PROTO={}, USED={}; let DONE=0, WANT=0, pieces=0, trees=0, pillars=0;
function protoOf(name,size){ const key=name+'|'+size; return PROTO[key]||(PROTO[key]=fetchBytes(ASSET(name),'later').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{
    const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,size); toonify(root,fit.scale); fit.wrap.updateMatrixWorld(true); res(fit.wrap); }catch(e){ rej(e); } },rej)))); }
const useProp=(name,size,cb)=>{ WANT++; return protoOf(name,size).then(p=>{ USED[name]=(USED[name]||0)+1; cb(p); }).catch(e=>console.warn('court decor '+name,e)).then(()=>{ DONE++; }); };
// straight runs: pieces about two cells long (the model's own proportions at this height), stretched a little so a run of any length is filled end to end
useProp('court-hedge.glb',H_STRAIGHT,wrap=>{ const bb=new THREE.Box3().setFromObject(wrap), L0=bb.max.x-bb.min.x;
  for(const r of runs){ const n=r.cells.length, len=n*CELL, k=Math.max(1,Math.round(len/L0)), each=len/k; const c0=r.cells[0];
    for(let j=0;j<k;j++){ const t=wrap.clone(); t.scale.x=each/L0*1.04; const along=-CELL/2+each*(j+.5);
      if(r.ax) t.position.set(cw(c0.cx)+along,c0.base,cwz(c0.cz)); else { t.position.set(cw(c0.cx),c0.base,cwz(c0.cz)+along); t.rotation.y=Math.PI/2; }
      world.add(t); pieces++; } } });
// corners: the piece's L is found from its own shape (its outer corner is where its geometry leans), then turned so that corner faces out of the ring; the 2x2 block it covers is the corner cell and the
// cells one along each arm: stretched across (not up) to FOOT so its arms reach the straight runs, and set in so each arm (ARM_F of the piece's width, measured off Matt's model) sits on the row the straight hedges stand on
const FOOT=4.2, ARM_F=.27;
useProp('court-hedge-corner.glb',H_CORNER,wrap=>{ const bb=new THREE.Box3().setFromObject(wrap); let sx=0,sz=0,n=0; const v=new THREE.Vector3();
  wrap.traverse(o=>{ if(!o.isMesh||o.userData.isOL) return; const pa=o.geometry.attributes.position; for(let i=0;i<pa.count;i+=7){ v.fromBufferAttribute(pa,i).applyMatrix4(o.matrixWorld); sx+=v.x; sz+=v.z; n++; } });
  const ox=Math.sign(sx/n-(bb.min.x+bb.max.x)/2)||1, oz=Math.sign(sz/n-(bb.min.z+bb.max.z)/2)||1;
  const W=Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z), sxz=FOOT/W, set=FOOT/2-ARM_F*FOOT/2;
  for(const {c,dx,dz} of corners){ const t=wrap.clone(); t.scale.set(sxz,1,sxz); let rot=0; for(let q=0;q<4;q++){ const a=q*Math.PI/2, rx=ox*Math.cos(a)+oz*Math.sin(a), rz=-ox*Math.sin(a)+oz*Math.cos(a); if(Math.sign(Math.round(rx))===-dx&&Math.sign(Math.round(rz))===-dz){ rot=a; break; } }
    t.rotation.y=rot; t.position.set(cw(c.cx)+dx*set,c.base,cwz(c.cz)+dz*set); world.add(t); pieces++; } });
// the trees, at the four corner spots, facing the Heartroot
(world.userData.treeProcs||[]).forEach(g=>{ g.visible=false; });
const TREE_H=7.2;
useProp('court-tree.glb',TREE_H,wrap=>{ (MAP.trees||[]).forEach(([x,z])=>{ const t=wrap.clone(); t.position.set(cw(x),hgt[idx(x,z)]||0,cwz(z)); t.rotation.y=Math.atan2(cw(MAP.crystal[0])-cw(x),cwz(MAP.crystal[1])-cwz(z)); world.add(t); trees++; }); });
// the colonnade, the marble column at each stand-in's spot and height (its shaft PH plus the base and capital's own 1)
(world.userData.pillarProcs||[]).forEach(p=>{ p.visible=false; });
const PH=MAP.pillarH||6;
useProp('court-pillar.glb',PH+1,wrap=>{ MAP.pillars.forEach(([px,pz])=>{ const t=wrap.clone(); t.position.set(cw(px),hgt[idx(px,pz)]||0,cwz(pz)); world.add(t); pillars++; }); });
window.__courtdecor={ info:()=>({cells:CELLS.size,corners:corners.length,runs:runs.length,pieces,trees,pillars,before:Object.assign({},before),after:Object.assign({},after),used:Object.assign({},USED)}),
  loaded:()=>WANT>0&&DONE>=WANT, isHedge:(cx,cz)=>has(cx,cz), top:(cx,cz)=>{ const c=cellOf(cx,cz); return c?c.top:null; }, cells:()=>[...CELLS.values()].map(c=>[c.cx,c.cz]),
  probe:{ HEDGE, cw, cwz, wc, wcz, solidAt:(x,z,y,h)=>solidAt(x,z,y,h), floorAt:(x,z,y)=>floorAt(x,z,y), hero:()=>hero, flyDist:(cx,cz)=>flowFly.dist[idx(cx,cz)], procs:()=>({trees:world.userData.treeProcs||[],pillars:world.userData.pillarProcs||[]}) } };   // test-only
})();
