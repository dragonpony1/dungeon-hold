// ===== ARCHER'S PERCH (build 200): Matt: "i also want to add a placeable, its a ramp with a platform so you can
// stand up high without[...] an option to standing on the towers. can be placed on any flat surface, give me two
// total, no root cost, and put it on the archer" -- then, clarifying: "the archer drops it but after that anyone
// can move or use it, its like the other towers, one class puts it down everyone benefits" (buildable through the
// normal menu, gated to the archer hero for PLACEMENT only), confirmed walk-through for mobs (pure positioning, not
// a wall), and "jumping up a few small platforms like a goat" (climbed exactly like standing on a tower already
// works -- jump onto each step -- not real ramp-slope physics, a bigger change to core movement Matt didn't want).
// "shouldn't take up any more than a square": three concentric tiers within one grid cell, each smaller and higher
// than the last, so climbing it is jump-jump-jump straight up rather than a walk along a length.
(function(){
if(TUTORIAL) return;
DEFS.perch={name:"Archer's Perch",ic:'🪜',du:0,mana:0,hp:999999,top:2.5};
DEFKEYS.push('perch'); DEFKEY_LABELS.push('4');
// game.js builds one hotbar DOM slot per DEFKEYS entry in a plain top-level loop that's already run by the time this
// (a staging module) loads -- pushing onto DEFKEYS above doesn't retroactively create one, so build this one slot by
// hand, identical markup/handler to what that loop would have made
{ const cfg=DEFS.perch; const s=document.createElement('div'); s.className='slot'; s.id='slot-perch';
  s.innerHTML='<div class="k">4</div><div class="ic">'+cfg.ic+'</div><div class="n">'+cfg.name+'</div><div class="cst">🌱 '+cfg.du+' · '+cfg.mana+' ◆</div>';
  s.addEventListener('click',()=>select('perch')); $('hotbar').appendChild(s); }
{ const t=HEROES.find(h=>h.id==='troll'); if(t&&!t.unlocks.includes('perch')) t.unlocks.push('perch'); }
NOWALK_DEF.perch=1;   // mobs path straight through/over it, same treatment the Mycelium Cage already gets (game.js's shared NOWALK_DEF lookup)
const CAP=2;
// ---------------------------------------------------------------- the model: three stacked, shrinking tiers (wood
// steps, stone-topped platform) -- climbing collision comes entirely from the three RAILBOXES pushed on placement
// below, not from this defense's own generic hp/collision (bypassed via NOWALK_DEF), so the visual just has to
// roughly match those box sizes/heights for it to look right underfoot
// Build 296: Matt's own model, "Hero Lookout Perch" (a plank post on a stone footing, a round iron-rimmed deck, two
// step-blocks jutting from the post: the front one lower, the right one higher). It is asked for the first time anyone
// picks the perch (never at start: only the Ranger places it) and 50-defmodels.js's template path draws it from then on
// (its reskinDefs swaps any perch already standing). Fitted so its deck is at 2.5, the top the perch always had: the
// deck is 1.70 of the model's 2.0 height, so the whole model stands 2.5*2/1.7 tall. Until it arrives, the old tiers.
DEF_H.perch=2.5*2/1.70;
let perchAsked=false;
{ const prevMakeDef=makeDef; makeDef=function(kind,ghost,lvl){ if(kind!=='perch') return prevMakeDef(kind,ghost,lvl);
    if(defTemplate('perch')) return prevMakeDef(kind,ghost,lvl);
    if(!perchAsked){ perchAsked=true; fetchDefGLB('perch',ASSET('perch.glb'),0,'first'); }
    const g=new THREE.Group(); const wood=mat(0x7a4f2c), stone=mat(0x8a8698), dark=mat(0x4a3320);
    g.add(M(G.box(1.4,1.0,1.4),wood,0,.5,0));
    g.add(M(G.box(.84,.85,.84),wood,0,1.425,0));
    g.add(M(G.box(.44,.65,.44),stone,0,2.175,0));
    for(const [x,z] of [[-.66,-.66],[.66,-.66],[-.66,.66],[.66,.66]]){ g.add(M(G.cyl(.04,.04,1.0,5),dark,x,.5,z)); }
    // makeDef's own shared tail (every other kind falls through to this at the end of the function) -- ghost preview
    // gets the translucent placement material, a real one gets its outline + floor shadow; matched here since the
    // early return above skips straight past it
    if(ghost){ g.traverse(m=>{ if(m.isMesh) m.material=GHOST_OK; }); } else { outline(g); g.add(blob(.95)); }
    return g; }; }
// ---------------------------------------------------------------- placement cap: never a third -- who's allowed to
// place one at all is already handled for free (select()/hero-switch in 70-hero2.js both gate on heroPick.unlocks,
// same as every other hero-locked tower). Extends the ghost preview the same way build 196's "you're standing
// there" fix did: a wrap, not a touch to the shared reason chain in game.js.
const QUARTER=Math.PI/2, snapRot=r=>Math.round((r||0)/QUARTER)*QUARTER;   // build 296: the real model has a front and a side, so it stands square to the grid (a quarter turn at a time) and its footholds stay boxes
{ const prevGhost=updateGhost; updateGhost=function(){ prevGhost(); if(placing==='perch'&&ghost) ghost.rotation.y=snapRot(ghost.rotation.y);
    if(placing==='perch'&&ghostOk&&defs.filter(d=>d.kind==='perch').length>=CAP){
      ghostOk=false; ghostReason='Only '+CAP+' perches at a time';
      const m=GHOST_BAD; ghost.traverse(o=>{ if(o.isMesh) o.material=m; });
    } }; }
// ---------------------------------------------------------------- on placement: register the three climbable tiers
// as RAILBOXES (the same mechanism the Throne Room's real railings already climb on) -- floorAt/solidAt pick these
// up for free, so "jump onto each step" needs no new physics at all, just three correctly sized, correctly tagged boxes
// Build 296: the boxes follow Matt's model (measured from above, tools/scratch-main/heightmap.mjs, then scaled x1.47):
// the DECK (top 2.5) is solid all the way down -- the hero is 2.6 tall, taller than the deck, so nobody fits under it --
// and its two step-blocks are FOOTHOLDS at their tips: the FRONT step (+z, top 1.47) and the RIGHT step (+x, top 2.06),
// each reaching out past the deck's rim far enough for the hero's 0.42 body to stand at the step's end. Ground -> front
// step -> right step (or straight) -> deck: hops within one jump each (vy 10.6, ~2.8 reach). Local boxes, turned with
// the perch a quarter turn at a time.
const PERCH_BOXES=[
  {x0:-.72,x1:.62,z0:-.72,z1:.58,top:2.5},     // the deck over the post
  {x0:-.35,x1:.4,z0:.58,z1:1.3,top:1.47},      // the front step's end
  {x0:.62,x1:1.3,z0:-.35,z1:.42,top:2.06}];    // the right step's end
function turnBox(b,r,x,z){ const c=Math.round(Math.cos(r)), s=Math.round(Math.sin(r)); const pts=[[b.x0,b.z0],[b.x1,b.z0],[b.x0,b.z1],[b.x1,b.z1]].map(([lx,lz])=>[lx*c+lz*s,-lx*s+lz*c]);
  return {x0:x+Math.min(...pts.map(p=>p[0])),x1:x+Math.max(...pts.map(p=>p[0])),z0:z+Math.min(...pts.map(p=>p[1])),z1:z+Math.max(...pts.map(p=>p[1]))}; }   // three.js's turn about y: x' = x cos + z sin, z' = -x sin + z cos
{ const prevPlace=placeDefAt; placeDefAt=function(kind,x,z,rot){ const d=prevPlace(kind,x,z,rot); if(d&&d.kind==='perch'){
    const base=d.mdl.position.y; d.rot=d.yaw=snapRot(d.rot); d.mdl.rotation.y=d.rot;
    d.railboxes=PERCH_BOXES.map(b=>Object.assign(turnBox(b,d.rot,x,z),{top:base+b.top}));
    for(const b of d.railboxes) RAILBOXES.push(b);
  } return d; }; }
// build 376 (Matt: "jacob cant stand on the perch"): the footholds exist only where the perch was PLACED -- the host. A guest's perch is a read-only puppet (99-network.js), so its own hero had no boxes to climb and fell through it. A guest now builds the same boxes (boxesFor) for every perch puppet it sees, and takes them down with it
// ---------------------------------------------------------------- build 381 (Matt: "make it so i can place a balista on a perch" / "need to be able to place ballista on hedges in cloister as well"): a ballista can be set ON a surface: a free perch's deck, or (the Cloister Court,
// 56d-courtdecor.js) a hedge. Aim the placement at the perch (the cell it stands in) or at a hedge and the ghost snaps to the middle of it, up at its top, and turns red only for the usual reasons (defense units, mana,
// an enemy too close) or when a tower already stands there (one to a surface). The tower is its own defense (it takes no floor cell, so mobs still walk through a perch as always, and never reach a hedge) tied to what it stands on
// (d.onSurf): sell or lose the perch and the tower comes down with it, 70% of its mana back. STACK is the list of towers that may stand on a surface -- the ballista (harpoon) for now. A surface is a function
// (kind,x,z) -> {x,z,y,key} | null pushed on window.__standSurf (this file adds the perch's; 56d adds the hedge's). Works for a co-op guest too (99-network.js asks deckFor).
const STACK=new Set(['harpoon']);
function perchFor(kind,x,z){ const cx=wc(x), cz=wcz(z); if(!inb(cx,cz)) return null; const d=defAt[idx(cx,cz)]; return (d&&d.kind==='perch')?d:null; }
const SURF=window.__standSurf=window.__standSurf||[];
SURF.push((kind,x,z)=>{ const p=perchFor(kind,x,z); return p?{ x:p.x, z:p.z, y:p.base+DEFS.perch.top, key:p }:null; });
const surfaceAt=(kind,x,z)=>{ if(!STACK.has(kind)) return null; for(const f of SURF){ const s=f(kind,x,z); if(s) return s; } return null; };
const towerOn=key=>defs.find(o=>o.onSurf===key);
const deckFor=(kind,x,z)=>{ const s=surfaceAt(kind,x,z); return (s&&!towerOn(s.key))?s:null; };
{ const prevPlace2=placeDefAt; placeDefAt=function(kind,x,z,rot){ const s=surfaceAt(kind,x,z); if(!s) return prevPlace2.apply(this,arguments); if(towerOn(s.key)) return null;   /* one tower to a surface */
    const d=prevPlace2.call(this,kind,s.x,s.z,rot); if(d){ d.onSurf=s.key; d.base=s.y; d.top=DEFS[kind].top+s.y; if(d.mdl) d.mdl.position.y=s.y; } return d; }; }   // snapped to the middle of it and set up at its top
{ const prevRemove2=removeDef; removeDef=function(d){ if(d&&d.kind==='perch'){ for(const o of defs.slice()){ if(o.onSurf!==d) continue; const back=Math.round((o.spent||0)*.7); S.mana+=back; floatText(o.x,o.top+.8,o.z,'+'+back+' mana','#5ee9ff'); toast('The tower comes down with its perch'); prevRemove2.call(this,o); } } return prevRemove2.apply(this,arguments); }; }
{ const prevGhost2=updateGhost; updateGhost=function(){ prevGhost2.apply(this,arguments); if(!placing||!ghost||!STACK.has(placing)) return;
    const [px,pz]=placeStage===1?anchorPos:aimPoint(); const s=surfaceAt(placing,px,pz); if(!s) return;
    const cfg=DEFS[placing]; let reason=''; if(towerOn(s.key)) reason='A tower already stands here'; else if(S.du+cfg.du>DU_CAP) reason='Not enough Defense Units'; else if(S.mana<cfg.mana) reason='Not enough mana'; else if(enemies.some(e=>!e.dead&&Math.hypot(e.x-s.x,e.z-s.z)<2.2)) reason='Enemy too close';
    ghostOk=!reason; ghostReason=reason; ghostPos=[s.x,s.z]; ghostCell=[wc(s.x),wcz(s.z)]; ghost.position.set(s.x,s.y,s.z); const m=ghostOk?GHOST_OK:GHOST_BAD; ghost.traverse(o=>{ if(o.isMesh) o.material=m; });
    if(typeof ghostSector!=='undefined'&&ghostSector){ ghostSector.position.set(s.x,s.y,s.z); if(typeof tintSector==='function') tintSector(ghostSector,ghostOk?0x40ff80:0xff3030); } }; }
// build 407 (Matt: "when ballista is on a perch, can't upgrade the ballista cuz it's not selectable"): the ballista stands at the perch's very spot, so game.js's pickDef tied them and the perch (built first) always won.
// The perch is a stand -- nothing to upgrade, nothing to mend -- so aiming at a perch with a tower on it picks the TOWER (E upgrades it, X sells it, the card and ring are its). An empty perch is picked as ever.
{ const prevPick=pickDef; pickDef=function(pos){ const d=prevPick.apply(this,arguments); if(d&&d.kind==='perch'){ const on=towerOn(d); if(on) return on; } return d; }; }
window.__perch={ deckFor, towerOn, surfaceAt, stack:()=>[...STACK], remove:d=>removeDef(d), boxesFor:(x,z,rot,base)=>PERCH_BOXES.map(b=>Object.assign(turnBox(b,snapRot(rot),x,z),{top:base+b.top})), cap:CAP };
{ const prevRemove=removeDef; removeDef=function(d){ if(d.railboxes) for(const b of d.railboxes){ const i=RAILBOXES.indexOf(b); if(i>=0) RAILBOXES.splice(i,1); } prevRemove(d); }; }
})();
