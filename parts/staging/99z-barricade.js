// ===== THE BARRICADE and its GATE -- the Gnome Engineer's mazing walls (build 602). Matt: "i think the barricade and the turret are musts" / "these only cost 1 mana to put down" /
// "i am not sure we need to upgrade the walls, they should be used for pathing, they wont be attacked unless theres no possible path, at witch point theyll be attacked".
// His Meshy wall set (Pictures\dungeon art,\Hero's\gnome engineer: straight, end cap, post, cross; the gate from Meshy_models_20261009_172453.zip), cut to 1024 px as parts/assets/barricade-*.glb.
//  * BARRICADE: one square, 1 mana, no roots, no upgrades. Click and it goes down at once and you keep building -- hold the button and sweep to lay a line. Each square picks its piece from its
//    neighbours: a STRAIGHT through a line, the CROSS where four meet, a lone POST on its own, and END CAPS meeting at a post for an end, a corner or a T (so no T piece is needed).
//  * GATE: a barricade square the heroes walk through and the horde does not (Matt's gate model, laid along the line it sits in). 1 mana too.
//  * MAZING: the horde never breaks a wall while ANY way round exists (it walks the long way, however long) -- towers are still smashed when going round them is too far, as ever. Only when the
//    walls (and gates) shut every way to a Heartroot do the mobs that are shut out hack through the wall in their way. Archers, carts, Avery and the soup leave walls alone (game.js BARRICADE_K).
//  * Flyers fly over. A co-op guest's walls tile the same (the tiling reads every wall model in the hall, real or puppet).
// Test hook: window.__barricade.
(function(){
'use strict';
if(TUTORIAL) return;
const KW='barricade', KG='bgate', SC=2/1.9;   // the straight, cross and gate are 1.9 long in their files: one 2-wide square
function slot(k){ const cfg=DEFS[k]; const s=document.createElement('div'); s.className='slot'; s.id='slot-'+k; s.innerHTML='<div class="k">?</div><div class="ic">'+cfg.ic+'</div><div class="n">'+cfg.name+'</div><div class="cst">🌱 '+cfg.du+' · '+cfg.mana+' ◆</div>'; s.addEventListener('click',()=>select(k)); $('hotbar').appendChild(s); }
DEFS[KW]={ name:'Barricade', ic:'🪵', du:0, mana:1, hp:100, top:1.2, noUp:true };
DEFS[KG]={ name:'Barricade Gate', ic:'🚪', du:0, mana:1, hp:100, top:1.2, noUp:true };
for(const k of [KW,KG]){ DEFKEYS.push(k); DEFKEY_LABELS.push('?'); slot(k); BARRICADE_K[k]=1; }
const cnt={ placed:0, tiled:0, smashers:0, painted:0 };
// ---------------------------------------------------------------- the pieces
const PIECE={ straight:{ s:SC }, cross:{ s:SC }, gate:{ s:SC }, post:{ s:.7 }, endcap:{ s:1.15*SC/1.82, px:.70 } };   // the end cap's pickets stand 1.82 in its file (its post 1.9): brought down to the straight's; its post's middle is .70 along x
const TPL={}; let asked=false;
function ask(){ if(asked) return; asked=true; for(const n of Object.keys(PIECE)) fetchBytes(ASSET('barricade-'+n+'.glb'),'first').then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{ const root=gltf.scene||gltf.scenes[0]; const P=PIECE[n];
    const b=new THREE.Box3().setFromObject(root), c=b.getCenter(new THREE.Vector3()); root.position.set(-(P.px!==undefined?P.px:c.x),-b.min.y,-c.z); const g=new THREE.Group(); g.add(root); g.scale.setScalar(P.s); toonify(root,P.s); TPL[n]=g; DIRTY=true; }catch(e){ console.warn('barricade '+n,e); } },e=>console.warn('barricade '+n,e))).catch(e=>console.warn('barricade '+n,e)); }
const MDLS=new Set(); let DIRTY=true;
{ const prev=makeDef; makeDef=function(kind,ghost,lvl){ if(kind!==KW&&kind!==KG) return prev.apply(this,arguments); ask();
    const g=new THREE.Group(); g.userData.wallKind=kind; const hold=new THREE.Group(); hold.name='wallPieces'; g.add(hold); g.userData.pieces=hold;
    if(ghost){ hold.add(stub(kind)); g.traverse(m=>{ if(m.isMesh) m.material=GHOST_OK; }); return g; }
    g.add(blob(.8)); MDLS.add(g); DIRTY=true; return g; }; }
function stub(kind){ const g=new THREE.Group(), w=mat(kind===KG?0x8a6034:0x7a4f2c); g.add(M(G.box(.3,1.3,.3),w,0,.65,0)); g.add(M(G.box(1.9,.9,.18),w,0,.55,0)); return g; }   // a plain fence until the pieces land
function piece(n,rot,k){ const T=TPL[n]; if(!T) return null; const c=T.clone(); c.userData.pn=n; c.rotation.y=rot; if(k) c.scale.multiplyScalar(k); return c; }
// which way each piece faces: the straight and the gate run along x; an end cap's wall runs from its post toward -x (rotation r turns (-1,0) to (-cos r, sin r))
const DIRS=[ { dx:1, dz:0, r:PI }, { dx:-1, dz:0, r:0 }, { dx:0, dz:1, r:PI/2 }, { dx:0, dz:-1, r:-PI/2 } ];
function tile(){ DIRTY=false; const at=new Map(), live=[];
  for(const m of MDLS){ if(!m.parent){ MDLS.delete(m); continue; } const cx=wc(m.position.x), cz=wcz(m.position.z); at.set(cx+','+cz,m); live.push([m,cx,cz]); }
  for(const [m,cx,cz] of live){ const nb=DIRS.map(d=>at.has((cx+d.dx)+','+(cz+d.dz))); const key=nb.map(b=>b?1:0).join('')+'|'+m.userData.wallKind+'|'+(Object.keys(TPL).length);
    if(m.userData.tileKey===key) continue; m.userData.tileKey=key; const hold=m.userData.pieces; while(hold.children.length) hold.remove(hold.children[0]); cnt.tiled++;
    const n=nb.filter(Boolean).length, ew=nb[0]||nb[1], ns=nb[2]||nb[3]; let ok=true; const add=o=>{ if(o) hold.add(o); else ok=false; };
    if(m.userData.wallKind===KG) add(piece('gate',(ns&&!ew)?PI/2:0));
    else if(n===0) add(piece('post',0));
    else if(n===4) add(piece('cross',0));
    else if(n===2&&nb[0]&&nb[1]) add(piece('straight',0));
    else if(n===2&&nb[2]&&nb[3]) add(piece('straight',PI/2));
    else { let j=0; DIRS.forEach((d,i)=>{ if(nb[i]) add(piece('endcap',d.r,1+.012*(j++))); }); }   // an end, a corner or a T: an end cap toward each neighbour, their posts on one spot (each a hair bigger, so their faces never flicker)
    if(!ok){ while(hold.children.length) hold.remove(hold.children[0]); hold.add(stub(m.userData.wallKind)); if(nb[2]||nb[3]) if(!(nb[0]||nb[1])) hold.children[0].rotation.y=PI/2; m.userData.tileKey=null; } } }
let seen=0;
WORLDANIM.push(()=>{ let n=0; for(const m of MDLS) if(m.parent) n++; if(n!==seen){ seen=n; DIRTY=true; } if(DIRTY) tile(); });
// ---------------------------------------------------------------- building: one click each, keep building; hold and sweep to lay a line
let paint=false, lastCell=-1, lastLay=0;
const snap=(x,z)=>[cw(wc(x)),cwz(wcz(z))];
function layHere(){ if(!ghostOk||!ghostPos) return null; const [x,z]=snap(ghostPos[0],ghostPos[1]); const ci=idx(wc(x),wcz(z)); if(ci===lastCell) return null; lastCell=ci;
  const d=placeDefAt(placing,x,z,0); if(d){ cnt.placed++; lastLay=performance.now(); } return d; }
{ const prev=confirmPlace; confirmPlace=function(){ if(placing!==KW&&placing!==KG) return prev.apply(this,arguments); if(!ghostOk){ if(performance.now()-lastLay>400) toast(ghostReason); return; }   /* the sweep may have laid this one a moment ago */ lastCell=-1; layHere(); updateGhost(); }; }
addEventListener('mousedown',e=>{ if(e.button===0&&(document.pointerLockElement||(e.target&&e.target.tagName==='CANVAS'))) paint=true; });   /* the hall itself, not a menu or the hotbar */ addEventListener('mouseup',e=>{ if(e.button===0){ paint=false; lastCell=-1; } }); addEventListener('blur',()=>{ paint=false; });
{ const prev=updateGhost; updateGhost=function(){ prev.apply(this,arguments); if((placing===KW||placing===KG)&&ghost){ ghost.rotation.y=0; if(ghostPos){ const [x,z]=snap(ghostPos[0],ghostPos[1]); ghost.position.x=x; ghost.position.z=z; } if(placeStage) placeStage=0; } }; }
WORLDANIM.push(()=>{ if(paint&&(placing===KW||placing===KG)&&ghostOk&&S.mana>=1){ if(layHere()){ cnt.painted++; updateGhost(); } } });
// no upgrades: E mends a hurt one, and that is all
{ const prev=upgradeDef; upgradeDef=function(pos){ const d=pickDef(pos); if(d&&DEFS[d.kind]&&DEFS[d.kind].noUp&&!(d.hp<d.max)) return; return prev.apply(this,arguments); }; }
// heroes walk through a gate; the horde does not (it is a wall to the flow fields)
{ const prev=defBlocksHero; defBlocksHero=function(d){ if(d&&d.kind===KG) return false; return prev.apply(this,arguments); }; }
// ---------------------------------------------------------------- MAZING: a field where only the walls stand in the way. A mob that can still get round the walls follows it whenever it means to smash
// (game.js: "follow the straight path and break whatever blocks it") -- so it breaks towers, never walls; a mob the walls have shut in keeps the old field and hacks through.
let flowWall=null;
function wallField(){ const added=[]; for(const d of defs){ if(!BARRICADE_K[d.kind]&&!NOWALK_DEF[d.kind]){ NOWALK_DEF[d.kind]=1; added.push(d.kind); } }
  try{ return bfs(true); } finally{ for(const k of added) delete NOWALK_DEF[k]; } }
{ const prev=reflow; reflow=function(){ prev.apply(this,arguments); flowWall=defs.some(d=>BARRICADE_K[d.kind])?wallField():null; }; }
{ const prev=updateEnemies; updateEnemies=function(dt){ let n=0;
    for(const e of enemies){ if(e.dead||e.fly) continue; if(e.fF&&!e.__wallF) continue;   /* a mob on a field of its own (the Deep Prison's flights) keeps it */
      if(flowWall&&flowWall.dist[idx(wc(e.x),wcz(e.z))]>=0){ e.fF=flowWall; e.__wallF=true; }
      else if(e.__wallF){ e.fF=undefined; e.__wallF=false; if(flowWall) n++; } else if(flowWall) n++; }
    cnt.smashers=n; return prev.apply(this,arguments); }; }
window.__barricade={ KW, KG, info:()=>Object.assign({ walls:defs.filter(d=>d.kind===KW).length, gates:defs.filter(d=>d.kind===KG).length, pieces:Object.keys(TPL), field:!!flowWall },cnt), tile, flowWall:()=>flowWall,
  pieceOf:d=>{ const h=d&&d.mdl&&d.mdl.userData.pieces; return h?h.children.map(c=>c.userData.pn||'stub'):[]; } };
})();
