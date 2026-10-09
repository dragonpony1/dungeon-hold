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
// Build 599 (Matt's engineer zip: the new LOOKOUT PERCH -- a timber lookout with a round railed deck, a ladder down its front, a lantern and a steam whistle; parts/assets/lookout.glb):
// its deck sits at 0.64 of its height (tools: a height map from above), so the model stands 2.5/0.64 tall to keep the deck at the 2.5 the perch always had.
DEF_H.perch=2.5/.64;
let perchAsked=false;
{ const prevMakeDef=makeDef; makeDef=function(kind,ghost,lvl){ if(kind!=='perch') return prevMakeDef(kind,ghost,lvl);
    if(defTemplate('perch')) return prevMakeDef(kind,ghost,lvl);
    if(!perchAsked){ perchAsked=true; fetchDefGLB('perch',ASSET('lookout.glb'),0,'first'); }   // build 599: the new lookout (was perch.glb)
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
// Build 599: the new lookout's footholds -- the round DECK (top 2.5) over its frame, and its LADDER down the front (+z) as one foothold at 1.3 out at its foot (a hero's body reaches the deck
// from anywhere higher up the ladder, so one foothold is all it needs): ground -> ladder -> deck, two easy hops (measured from the model's height map, scaled to its 3.9 height)
const PERCH_BOXES=[
  {x0:-.9,x1:.75,z0:-1.0,z1:.45,top:2.5},      // the deck
  {x0:-.45,x1:.25,z0:.85,z1:1.3,top:1.3}];     // the ladder
// build 601 (Matt: "when i upgrade the lookout perch i want them to get taller and taller"): every mark lifts the lookout LIFT higher on a timber scaffold (Mark I 2.5 ... Mark VII 10), so the deck is at deckOf(lvl).
// The ladder's foothold carries climb (the deck's height): a hero pressed against it holding W (or Space) climbs it (heroUpdate below), however tall the perch has grown.
const LIFT=1.25, liftOf=l=>LIFT*(Math.max(1,l||1)-1), deckOf=l=>PERCH_BOXES[0].top+liftOf(l);
function perchBoxes(x,z,rot,base,lvl){ const deck=base+deckOf(lvl); return PERCH_BOXES.map((b,i)=>Object.assign(turnBox(b,rot,x,z),{top:i===0?deck:base+b.top},i===1?{ climb:deck, cbot:base, cx:x, cz:z }:{})); }
function turnBox(b,r,x,z){ const c=Math.round(Math.cos(r)), s=Math.round(Math.sin(r)); const pts=[[b.x0,b.z0],[b.x1,b.z0],[b.x0,b.z1],[b.x1,b.z1]].map(([lx,lz])=>[lx*c+lz*s,-lx*s+lz*c]);
  return {x0:x+Math.min(...pts.map(p=>p[0])),x1:x+Math.max(...pts.map(p=>p[0])),z0:z+Math.min(...pts.map(p=>p[1])),z1:z+Math.max(...pts.map(p=>p[1]))}; }   // three.js's turn about y: x' = x cos + z sin, z' = -x sin + z cos
{ const prevPlace=placeDefAt; placeDefAt=function(kind,x,z,rot){ const d=prevPlace(kind,x,z,rot); if(d&&d.kind==='perch'){
    const base=d.mdl.position.y; d.rot=d.yaw=snapRot(d.rot); d.mdl.rotation.y=d.rot;
    d.railboxes=perchBoxes(x,z,d.rot,base,d.lvl);
    for(const b of d.railboxes) RAILBOXES.push(b);
  } return d; }; }
// build 376 (Matt: "jacob cant stand on the perch"): the footholds exist only where the perch was PLACED -- the host. A guest's perch is a read-only puppet (99-network.js), so its own hero had no boxes to climb and fell through it. A guest now builds the same boxes (boxesFor) for every perch puppet it sees, and takes them down with it
// ---------------------------------------------------------------- build 381 (Matt: "make it so i can place a balista on a perch" / "need to be able to place ballista on hedges in cloister as well"): a ballista can be set ON a surface: a free perch's deck, or (the Cloister Court,
// 56d-courtdecor.js) a hedge. Aim the placement at the perch (the cell it stands in) or at a hedge and the ghost snaps to the middle of it, up at its top, and turns red only for the usual reasons (defense units, mana,
// an enemy too close) or when a tower already stands there (one to a surface). The tower is its own defense (it takes no floor cell, so mobs still walk through a perch as always, and never reach a hedge) tied to what it stands on
// (d.onSurf): sell or lose the perch and the tower comes down with it, 70% of its mana back. STACK is the list of towers that may stand on a surface -- the ballista (harpoon) for now. A surface is a function
// (kind,x,z) -> {x,z,y,key} | null pushed on window.__standSurf (this file adds the perch's; 56d adds the hedge's). Works for a co-op guest too (99-network.js asks deckFor).
const STACK=new Set(['harpoon','turret','sky']);   // build 599: every tower that may stand on SOME surface (the Gnome Turret, and the Sky Wrecker on the Sky Platform); each surface says which it takes (PERCH_TAKES etc.)
const PERCH_TAKES=new Set(['harpoon','turret']);
const STANDS=new Set(['perch','skyplat']);   // build 599: the stands a tower comes down with, and is picked through
function perchFor(kind,x,z){ const cx=wc(x), cz=wcz(z); if(!inb(cx,cz)) return null; const d=defAt[idx(cx,cz)]; return (d&&d.kind==='perch')?d:null; }
const SURF=window.__standSurf=window.__standSurf||[];
SURF.push((kind,x,z)=>{ if(!PERCH_TAKES.has(kind)) return null; const p=perchFor(kind,x,z); return p?{ x:p.x, z:p.z, y:p.base+deckOf(p.lvl), key:p }:null; });   // build 601: up at however tall it has grown
const surfaceAt=(kind,x,z)=>{ if(!STACK.has(kind)) return null; for(const f of SURF){ const s=f(kind,x,z); if(s) return s; } return null; };
const towerOn=key=>defs.find(o=>o.onSurf===key);
const deckFor=(kind,x,z)=>{ const s=surfaceAt(kind,x,z); return (s&&!towerOn(s.key))?s:null; };
{ const prevPlace2=placeDefAt; placeDefAt=function(kind,x,z,rot){ const s=surfaceAt(kind,x,z); if(!s) return prevPlace2.apply(this,arguments); if(towerOn(s.key)) return null;   /* one tower to a surface */
    const d=prevPlace2.call(this,kind,s.x,s.z,rot); if(d){ d.onSurf=s.key; d.base=s.y; d.top=DEFS[kind].top+s.y; if(d.mdl) d.mdl.position.y=s.y; } return d; }; }   // snapped to the middle of it and set up at its top
{ const prevRemove2=removeDef; removeDef=function(d){ if(d&&STANDS.has(d.kind)){ for(const o of defs.slice()){ if(o.onSurf!==d) continue; const back=Math.round((o.spent||0)*.7); S.mana+=back; floatText(o.x,o.top+.8,o.z,'+'+back+' mana','#5ee9ff'); toast('The tower comes down with its perch'); prevRemove2.call(this,o); } } return prevRemove2.apply(this,arguments); }; }
{ const prevGhost2=updateGhost; updateGhost=function(){ prevGhost2.apply(this,arguments); if(!placing||!ghost||!STACK.has(placing)) return;
    const [px,pz]=placeStage===1?anchorPos:aimPoint(); const s=surfaceAt(placing,px,pz); if(!s) return;
    const cfg=DEFS[placing]; let reason=''; if(towerOn(s.key)) reason='A tower already stands here'; else if(S.du+cfg.du>DU_CAP) reason='Not enough Defense Units'; else if(S.mana<cfg.mana) reason='Not enough mana'; else if(enemies.some(e=>!e.dead&&Math.hypot(e.x-s.x,e.z-s.z)<2.2)) reason='Enemy too close';
    ghostOk=!reason; ghostReason=reason; ghostPos=[s.x,s.z]; ghostCell=[wc(s.x),wcz(s.z)]; ghost.position.set(s.x,s.y,s.z); const m=ghostOk?GHOST_OK:GHOST_BAD; ghost.traverse(o=>{ if(o.isMesh) o.material=m; });
    if(typeof ghostSector!=='undefined'&&ghostSector){ ghostSector.position.set(s.x,s.y,s.z); if(typeof tintSector==='function') tintSector(ghostSector,ghostOk?0x40ff80:0xff3030); } }; }
// build 407 (Matt: "when ballista is on a perch, can't upgrade the ballista cuz it's not selectable"): the ballista stands at the perch's very spot, so game.js's pickDef tied them and the perch (built first) always won.
// The perch is a stand -- nothing to upgrade, nothing to mend -- so aiming at a perch with a tower on it picks the TOWER (E upgrades it, X sells it, the card and ring are its). An empty perch is picked as ever.
{ const prevPick=pickDef; pickDef=function(pos){ const d=prevPick.apply(this,arguments); if(d&&STANDS.has(d.kind)){ const on=towerOn(d); if(on) return on; } return d; }; }
window.__perch={ deckFor, towerOn, surfaceAt, stack:()=>[...STACK], remove:d=>removeDef(d), boxesFor:(x,z,rot,base,lvl)=>perchBoxes(x,z,snapRot(rot),base,lvl), cap:CAP, liftOf, deckOf, LIFT };
{ const prevRemove=removeDef; removeDef=function(d){ if(d.railboxes) for(const b of d.railboxes){ const i=RAILBOXES.indexOf(b); if(i>=0) RAILBOXES.splice(i,1); } prevRemove(d); }; }
// ---------------------------------------------------------------- build 601: TALLER AND TALLER. Matt: "when i upgrade the lookout perch i want them to get taller and taller".
//  * The perch upgrades like any tower (E, the usual mana, Marks I-VII); each mark lifts the lookout LIFT (1.25) higher on a timber scaffold -- four posts, a girt and a cross-brace every storey -- with a ladder up its front
//    to the lookout's own. It rises in a moment, and the tower standing on it (and a hero on its deck) ride up with it.
//  * A perch with a tower on it: aiming at it from the ground still picks the TOWER (build 407); STAND ON ITS DECK (or hang on its ladder) and E raises the PERCH.
//  * The tower on top reaches 5% further for every mark of the perch under it (my call: height should be worth something).
//  * The ladder: press against it holding W (or Space) and the hero climbs; let go and he slides back down. Works for a co-op guest too (the foothold carries the climb, 99-network.js builds it).
const PERCH_RANGE=.05, CLIMB=4.6;
function scaffold(h){ const g=new THREE.Group(); g.name='perchScaf'; g.userData.h=h; if(h<=.01) return g; const wood=mat(0x7a4f2c), dark=mat(0x4a3320);
  const X0=-.7,X1=.55,Z0=-.85,Z1=.3, W=X1-X0, D=Z1-Z0, n=Math.max(1,Math.round(h/LIFT)), sh=h/n;
  for(const [x,z] of [[X0,Z0],[X1,Z0],[X0,Z1],[X1,Z1]]) g.add(M(G.box(.2,h,.2),dark,x,h/2,z));
  for(let i=1;i<=n;i++){ const y=i*sh-.07, ym=(i-.5)*sh, f=i%2?1:-1;
    g.add(M(G.box(W+.2,.14,.14),wood,(X0+X1)/2,y,Z0)); g.add(M(G.box(W+.2,.14,.14),wood,(X0+X1)/2,y,Z1)); g.add(M(G.box(.14,.14,D+.2),wood,X0,y,(Z0+Z1)/2)); g.add(M(G.box(.14,.14,D+.2),wood,X1,y,(Z0+Z1)/2));
    const lx=Math.hypot(W,sh), lz=Math.hypot(D,sh);
    { const b=M(G.box(lx,.1,.08),wood,(X0+X1)/2,ym,Z0-.02); b.rotation.z=f*Math.atan2(sh,W); g.add(b); }   // the back and the two sides braced (the front is the ladder's)
    for(const x of [X0,X1]){ const b=M(G.box(.08,.1,lz),wood,x+(x<0?-.02:.02),ym,(Z0+Z1)/2); b.rotation.x=-f*Math.atan2(sh,D); g.add(b); } }
  const LZ=1.08; for(const x of [-.4,.2]) g.add(M(G.box(.08,h+.1,.08),wood,x,h/2,LZ)); for(let y=.32;y<h;y+=.34) g.add(M(G.box(.6,.06,.07),wood,-.1,y,LZ));   // the ladder, up to the lookout's own
  g.add(M(G.box(.08,.08,LZ-Z1),dark,-.1,h-.2,(LZ+Z1)/2));   // its stay back to the frame
  try{ outline(g); }catch(e){} return g; }
// the lookout lifted inside the model, on an inner group (updateDefs sets d.mdl.scale every frame, 7% a mark: held back here, as the Mouse Trap does, so the deck is exactly where the footholds say)
{ const prev=makeDef; makeDef=function(kind,ghost,lvl){ const m=prev.apply(this,arguments); if(kind!=='perch'||ghost) return m;
    const hold=new THREE.Group(), lift=new THREE.Group(); hold.name='perchHold'; lift.name='perchLift';
    for(const c of m.children.slice()){ if(c.material===SHADOWMAT) continue; lift.add(c); }   // the ground shadow stays on the ground
    hold.add(lift); m.add(hold); const R=liftOf(lvl); lift.position.y=R; const sc=scaffold(R); hold.add(sc); hold.scale.setScalar(1/markGrow(lvl));
    m.userData.perchHold=hold; m.userData.perchLift=lift; m.userData.perchScaf=sc; return m; }; }
const RAISE=[];   // perches on their way up
const cnt={ raised:0, climbs:0 };
function onDeck(p,x,z,y){ const b=p.railboxes&&p.railboxes[0]; return !!(b&&x>=b.x0-.15&&x<=b.x1+.15&&z>=b.z0-.15&&z<=b.z1+.15&&y>=b.top-.4); }
function setLift(p,R){ const u=p.mdl&&p.mdl.userData, deck=PERCH_BOXES[0].top+R, b=p.railboxes&&p.railboxes[0], top0=b?b.top:p.top;
  const riding=!!(b&&hero.dead<=0&&onDeck(p,hero.x,hero.z,hero.y));   // a hero on the deck rides up with it
  if(u&&u.perchLift){ u.perchLift.position.y=R; u.perchHold.scale.setScalar(1/markGrow(p.lvl)); const sc=u.perchScaf; if(sc&&sc.userData.h>0) sc.scale.y=R/sc.userData.h; }
  p.lift=R; p.top=p.base+deck; if(b){ b.top=p.base+deck; if(p.railboxes[1]) p.railboxes[1].climb=p.base+deck; }
  const t=towerOn(p); if(t){ t.base=p.base+deck; t.top=DEFS[t.kind].top+t.base; if(t.mdl) t.mdl.position.y=t.base; }
  if(riding&&hero.y<p.base+deck){ hero.y=p.base+deck; hero.vy=0; hero.grounded=true; } }
function raise(p){ const R1=liftOf(p.lvl); const u=p.mdl&&p.mdl.userData; if(u&&u.perchHold){ const old=u.perchScaf; if(old) u.perchHold.remove(old); const sc=scaffold(R1); u.perchHold.add(sc); u.perchScaf=sc; }
  if(!RAISE.includes(p)) RAISE.push(p); cnt.raised++; setLift(p,p.lift||0); }
WORLDANIM.push(dt=>{ for(let i=RAISE.length-1;i>=0;i--){ const p=RAISE[i]; if(!defs.includes(p)){ RAISE.splice(i,1); continue; } const R1=liftOf(p.lvl), R=Math.min(R1,(p.lift||0)+dt*2.6); setLift(p,R); if(R>=R1) RAISE.splice(i,1); } });
{ const prev=upgradeDef; upgradeDef=function(pos){ const d=pickDef(pos), l0=d&&d.lvl; const r=prev.apply(this,arguments); if(d&&d.kind==='perch'&&d.lvl>l0) raise(d); return r; }; }
// standing on its deck (or on its ladder), E is the PERCH's: a tower on it is picked from the ground
{ const prev=pickDef; pickDef=function(pos){ const P=pos||hero; for(const p of defs){ if(p.kind!=='perch'||p.dead) continue; if(onDeck(p,P.x,P.z,P.y||0)||(P===hero&&hero.climbing===p)) return p; } return prev.apply(this,arguments); }; }
{ const prev=stat; stat=function(d,k){ const v=prev.apply(this,arguments); if(k==='range'&&d&&d.onSurf&&d.onSurf.kind==='perch'&&(d.onSurf.lvl||1)>1) return v*(1+PERCH_RANGE*((d.onSurf.lvl||1)-1)); return v; }; }
// ---- the ladder
let SPACE=false; addEventListener('keydown',e=>{ if(e.code==='Space') SPACE=true; }); addEventListener('keyup',e=>{ if(e.code==='Space') SPACE=false; }); addEventListener('blur',()=>{ SPACE=false; });
function ladderAt(x,z,y){ for(const b of RAILBOXES){ if(b.climb===undefined) continue; const m=.62; if(x<b.x0-m||x>b.x1+m||z<b.z0-m||z>b.z1+m||y<b.cbot-.3||y>b.climb+.2) continue; return b; } return null; }
{ const prev=heroUpdate; heroUpdate=function(dt){ const y0=hero.y; const r=prev.apply(this,arguments); if(hero.dead>0||S.phase==='start'){ hero.climbing=null; return r; }
    const L=ladderAt(hero.x,hero.z,y0); if(!L){ hero.climbing=null; return r; }
    const tx=L.cx-hero.x, tz=L.cz-hero.z, tl=Math.hypot(tx,tz)||1, facing=(Math.sin(hero.yaw)*tx+Math.cos(hero.yaw)*tz)/tl;   // toward the perch: the ladder is on its face
    const up=(K.w||SPACE||(TOUCH&&typeof joy!=='undefined'&&joy.y>.3))&&(facing>.2||!!hero.climbing);
    if(up&&y0<L.climb+.1){ if(!hero.climbing) cnt.climbs++; hero.climbing=defs.find(p=>p.railboxes&&p.railboxes[1]===L)||true; hero.y=Math.min(L.climb+.12,Math.max(hero.y,y0+CLIMB*dt)); hero.vy=0; hero.grounded=false; }
    else if(hero.climbing&&!hero.grounded){ hero.vy=Math.max(hero.vy,-3.2); }
    else if(hero.grounded) hero.climbing=null;
    return r; }; }
window.__perch.raise=raise; window.__perch.info=()=>Object.assign({ rising:RAISE.length },cnt); window.__perch.onDeck=onDeck; window.__perch.ladderAt=ladderAt;
})();
