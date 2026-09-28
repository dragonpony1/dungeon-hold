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
{ const prevMakeDef=makeDef; makeDef=function(kind,ghost,lvl){ if(kind!=='perch') return prevMakeDef(kind,ghost,lvl);
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
{ const prevGhost=updateGhost; updateGhost=function(){ prevGhost();
    if(placing==='perch'&&ghostOk&&defs.filter(d=>d.kind==='perch').length>=CAP){
      ghostOk=false; ghostReason='Only '+CAP+' perches at a time';
      const m=GHOST_BAD; ghost.traverse(o=>{ if(o.isMesh) o.material=m; });
    } }; }
// ---------------------------------------------------------------- on placement: register the three climbable tiers
// as RAILBOXES (the same mechanism the Throne Room's real railings already climb on) -- floorAt/solidAt pick these
// up for free, so "jump onto each step" needs no new physics at all, just three correctly sized, correctly tagged boxes
{ const prevPlace=placeDefAt; placeDefAt=function(kind,x,z,rot){ const d=prevPlace(kind,x,z,rot); if(d&&d.kind==='perch'){
    const base=d.mdl.position.y;
    // gaps sized against the hero's real jump (vy 10.6, ~2.8 units max reach from a standing start): each hop is
    // comfortably within one jump, but the full ground-to-top climb isn't, so the normal path is genuinely three
    // small hops, not one jump that trivially clears the whole thing
    d.railboxes=[
      {x0:x-.7,x1:x+.7,z0:z-.7,z1:z+.7,top:base+1.0},
      {x0:x-.42,x1:x+.42,z0:z-.42,z1:z+.42,top:base+1.85},
      {x0:x-.22,x1:x+.22,z0:z-.22,z1:z+.22,top:base+2.5},
    ];
    for(const b of d.railboxes) RAILBOXES.push(b);
  } return d; }; }
{ const prevRemove=removeDef; removeDef=function(d){ if(d.railboxes) for(const b of d.railboxes){ const i=RAILBOXES.indexOf(b); if(i>=0) RAILBOXES.splice(i,1); } prevRemove(d); }; }
})();
