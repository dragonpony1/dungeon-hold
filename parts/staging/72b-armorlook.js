// ===== ARMOR YOU CAN SEE (build 181). Matt: "we could have armor show somehow on character" -- two things, both keyed off
// what is actually WORN, never a flat cosmetic toggle: (1) a softer body-wide aura at 3 pieces of a set, on top of the
// full-set aura 93-gearsets.js already draws at 5 (that one shell is untouched here -- this file only adds the dimmer
// three-piece tier, reusing its own dress/undress/pulse kit so there is exactly one shell-building code path); (2) three
// code-built pieces hung on the hero's own skinned rig -- shoulder guards (both), a chest emblem, and a short cape/sash on
// the back -- in the colours and style of whichever set the ARMOR SLOT itself carries (86-setweapons.js's setOf-style
// lookup, mirrored here against Meta.sets/Meta.packs so a mythic set piece or a plain "of X" drop both match the same
// way a real 86-setweapons weapon does). The aura's tier and the body pieces are deliberately independent: a single
// Void chestpiece alone (1/5) still shows Void shoulders/chest/cape (the item on your back looks like what it is), but
// draws no shell until three pieces of ANY one set are actually worn (the shell is the achievement, the pieces are the
// gear). Two named mythics get bespoke looks instead of a generic set style: MOSSHEART AEGIS (a mossy chestplate that
// glows while its "stand still 2s" heal, 97-mythics.js, is actually running) and VOIDWOVEN MANTLE (a star-flecked void
// cape). Plain, setless, unnamed armor -- most of the game -- shows nothing at all, same as today.
//
// Rig: all four Meshy hero rigs (probes/glbinfo.mjs on knight/witch/troll/fighter.glb) share one skeleton naming --
// LeftShoulder/RightShoulder, Spine/Spine01/Spine02, Hips, neck, Head, headfront (the same marker 70-hero2.js's merge
// pipeline uses to find facing) -- so bones are found BY NAME at runtime (getObjectByName, with a couple of regex
// fallbacks in case a future rig differs) rather than hardcoded per hero. Sizing reads the ACTUAL measured shoulder
// width and torso length of whichever rig is currently worn (world-space distances between those named bones), so the
// same fractions read right on the short, wide gnomes and the tall, thin Troll without any per-hero special-casing.
// Every piece is parented to the bone it belongs to (shoulder pad -> shoulder bone, chest/cape -> neck/spine) so it
// rides the walk/attack/death animation for free -- no per-frame bone tracking, only a per-frame cosmetic sway/pulse.
//
// Geometry and materials are built ONCE at module load (a handful of shared THREE.BufferGeometry instances; mat()
// already caches by colour so the ten sets' materials are ~30 cached entries total, not built per hero) and reused by
// every instance; a rebuild only happens when the current hero's armor-slot look actually changes (equip/unequip/hero
// switch), detected by a cheap string-key compare in the existing Meta.update tick -- nothing here allocates per frame.
// Every mesh goes through the game's own outline()/mat() helpers so the ink outline and toon shading match the hero's
// own body exactly; nothing here touches toonify() or the body's own materials.
//
// Co-op puppets (98-party.js): a puppet is dressed from a network-carried "look" object computed on the WEARER's own
// page (99-network.js lookOf()), and only ever gets the pieces its wearer's client chose to send -- the full-set glow
// was already wired that way. This build widens that one field so a puppet's shell also shows at the softer three-piece
// tier (the same window.__setglow.pulse kit, told which tier to draw), which is cheap: one extra byte on the wire, no
// new message type. Full shoulder/chest/cape pieces on a puppet are NOT built by this file -- 98-party.js keeps no
// reachable handle on a puppet's root bones outside its own closure, and wiring the armor-slot's set + tier + named key
// through the network "look" and back out to a bone-attach pass on every puppet is a materially bigger protocol change
// than the tint. Left for later; said plainly in this build's notes, not silently dropped.
(function(){
const ZERO=new THREE.Vector3(0,0,0), UPV=new THREE.Vector3(0,1,0);

// ---------------------------------------------------------------- shared geometry (built once, reused by every set)
const PAD_GEO=new THREE.SphereGeometry(1,10,8,0,Math.PI*2,0,Math.PI*0.58);          // a shallow dome: the pauldron shell (open side down, bulges up/out)
const RIM_GEO=new THREE.TorusGeometry(1,0.16,6,16);                                  // a trim ring, for a plated look
const SPIKE_GEO=new THREE.ConeGeometry(0.22,1,5);                                    // a barb/spike/horn accent
const SHARD_GEO=new THREE.OctahedronGeometry(1,0);                                   // a crystal shard / gem accent, also the cape's stars' big sibling would use glow() instead
const CRACK_GEO=new THREE.BoxGeometry(0.05,1,0.018);                                 // a thin glowing sliver, for Fire's/Storm's cracked plate
function shape(pts,closeLast){ const s=new THREE.Shape(); s.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) s.lineTo(pts[i][0],pts[i][1]); if(closeLast!==false) s.closePath(); return s; }
const LEAF_GEO=new THREE.ExtrudeGeometry(shape([[0,0],[.42,.55],[0,1.15],[-.42,.55]]),{depth:.045,bevelEnabled:false});   // a simple four-point leaf, flat
const FEATHER_GEO=new THREE.ExtrudeGeometry(shape([[0,0],[.2,.32],[.06,1],[0,1.08],[-.06,1],[-.2,.32]]),{depth:.03,bevelEnabled:false});   // a narrow vane
const CHEST_GEO=new THREE.ExtrudeGeometry(shape([[0,1],[-.6,.34],[-.4,-1],[0,-.6],[.4,-1],[.6,.34]]),{depth:.09,bevelEnabled:true,bevelThickness:.03,bevelSize:.03,bevelSegments:1});   // a rounded heraldic diamond, the chest emblem's base plate (wound CCW so ExtrudeGeometry's front cap -- and this piece's "front" for facingQuat -- is +Z, same convention as the cape below)
// a cape/sash panel, tapered (wide at the collar, narrower at the hem): built once as a unit shape (top edge at local
// y=0, hem at y=-1, half-width baked into x), every set just scales and recolours it -- no per-set geometry
function tapered(wTop,wBot,segs){ const g=new THREE.PlaneGeometry(1,1,1,segs||5); const pos=g.attributes.position;
  for(let i=0;i<pos.count;i++){ const x=pos.getX(i), y=pos.getY(i); const f=y+.5; const w=(wBot+(wTop-wBot)*f)/2; pos.setX(i,Math.sign(x)*w); pos.setY(i,(y-.5)); }
  g.computeVertexNormals(); return g; }
const CAPE_GEO=tapered(1,.6,5);

// ---------------------------------------------------------------- the ten sets' looks + the two named mythics'
// family: which accent shape rides the pad/chest ('plate' ring, 'crystal' shard, 'spiked' horns, 'organic' leaves/feathers)
const STYLE={
  'of the Void':  {family:'crystal',primary:0x14101c,accent:0x9a30ff,emissive:0x5a2bd0},
  'of the Forest':{family:'organic',primary:0x6b4a2a,accent:0x5ad05a,emissive:0x1f6a2a},
  'of Chaos':     {family:'spiked', primary:0x6e4e3a,accent:0xff2a50,emissive:0x7a1414},
  'of the Earth': {family:'plate',  primary:0xa07a4a,accent:0x6a8a4a,emissive:0x4a3016},
  'of Fire':      {family:'plate',  primary:0x1e1614,accent:0xff6a2a,emissive:0x8a2a08,crack:true},
  'of Radiance':  {family:'organic',primary:0xf2ecd8,accent:0xffe28a,emissive:0x8a7020,feather:true},
  'of the Storm': {family:'plate',  primary:0x2a2e36,accent:0x8ad0ff,emissive:0x2a5a8a,crack:true},
  'of Shadow':    {family:'spiked', primary:0x3a3a2e,accent:0x7aff2a,emissive:0x2a1a3a,bone:true},
  'of Ice':       {family:'crystal',primary:0xbfefff,accent:0x2a6a8a,emissive:0x2a6a8a},
  'of the Wind':  {family:'organic',primary:0xc8d0d8,accent:0xcfe8a0,emissive:0x4a6a2a,feather:true}};
const NAMED_STYLE={
  mossheart_aegis:  {family:'organic',primary:0x3a5a2e,accent:0x6ef0a0,emissive:0x2fd86a,heal:true},
  voidwoven_mantle: {family:'crystal',primary:0x140c1e,accent:0xd8c0ff,emissive:0x8a3dff,stars:true}};

// ---------------------------------------------------------------- finding the rig's own bones, by name (all four
// Meshy hero rigs share this skeleton; the regex fallbacks are for a rig that one day doesn't)
function findFirst(root,names){ for(const n of names){ const o=root.getObjectByName(n); if(o) return o; } return null; }
function findByPattern(root,re){ let f=null; root.traverse(o=>{ if(!f&&re.test(o.name)) f=o; }); return f; }
function heroBones(root){
  // LeftShoulder/RightShoulder is the CLAVICLE (probes/glbinfo.mjs: a short bone hugging the spine); the actual ball
  // joint a pauldron sits on -- and the true shoulder-to-shoulder span used to size everything below -- is where
  // LeftArm/RightArm (the upper arm bone) starts, well out past the clavicle
  const lsh=findFirst(root,['LeftArm'])||findByPattern(root,/^left.*arm$/i)||findFirst(root,['LeftShoulder']);
  const rsh=findFirst(root,['RightArm'])||findByPattern(root,/^right.*arm$/i)||findFirst(root,['RightShoulder']);
  const lClav=findFirst(root,['LeftShoulder']), rClav=findFirst(root,['RightShoulder']);
  const spine2=findFirst(root,['Spine02','Spine2'])||findByPattern(root,/spine.?2$/i);
  const spine1=findFirst(root,['Spine01','Spine1'])||findByPattern(root,/spine.?1$/i);
  const spine0=findFirst(root,['Spine'])||findByPattern(root,/^spine$/i);
  const hips=findFirst(root,['Hips'])||findByPattern(root,/hips|pelvis/i);
  const neck=findFirst(root,['neck','Neck'])||findByPattern(root,/neck/i);
  const head=findFirst(root,['Head']); const headfront=findFirst(root,['headfront']);
  const spineTop=spine2||spine1||spine0, collar=neck||spineTop;
  return {lsh,rsh,lClav,rClav,spineTop,collar,hips,head,headfront};
}
// forward = the rig's own facing, read off the headfront marker (the same convention 70-hero2.js's merge pipeline
// uses) so this needs no per-hero axis assumption; falls back to the game's own yaw convention if a rig lacks it
function forwardOf(B){ if(B.head&&B.headfront){ const a=new THREE.Vector3(), b=new THREE.Vector3(); B.head.getWorldPosition(a); B.headfront.getWorldPosition(b); const d=b.sub(a); d.y=0; if(d.lengthSq()>1e-8) return d.normalize(); }
  return new THREE.Vector3(Math.sin((typeof hero!=='undefined'&&hero.yaw)||0),0,Math.cos((typeof hero!=='undefined'&&hero.yaw)||0)); }

// ---------------------------------------------------------------- placement: a piece is given a WORLD position, facing
// and uniform size, then dropped onto a bone by solving matrix = inverse(boneWorld) * desiredWorld -- exact regardless
// of whatever scale that bone's own rig happens to carry (these rigs bake a large, non-1 scale down the joint chain, so
// the naive "divide by the bone's world scale" shortcut this started with under-sized every piece by an order of
// magnitude; a full matrix solve has no such assumption to get wrong), so it rides that bone's animation afterward
// unchanged (build once per equip/switch, not per frame; no allocations in the per-frame tick below)
function setWorldTransform(piece,bone,worldMatrix){ bone.add(piece); bone.updateWorldMatrix(true,false);
  const inv=new THREE.Matrix4().copy(bone.matrixWorld).invert(); const local=new THREE.Matrix4().multiplyMatrices(inv,worldMatrix);
  local.decompose(piece.position,piece.quaternion,piece.scale); }
function placeRadial(piece,bone,outward,worldRadius){ bone.updateWorldMatrix(true,false);
  const bp=new THREE.Vector3(); bone.getWorldPosition(bp);
  const wp=bp.clone().addScaledVector(outward,worldRadius*.55).addScaledVector(UPV,-worldRadius*.15);
  const q=new THREE.Quaternion().setFromUnitVectors(UPV,outward);
  setWorldTransform(piece,bone,new THREE.Matrix4().compose(wp,q,new THREE.Vector3(worldRadius,worldRadius,worldRadius))); }
function facingQuat(dir){ const m=new THREE.Matrix4(); m.lookAt(ZERO,dir.clone().negate(),UPV); return new THREE.Quaternion().setFromRotationMatrix(m); }
function placeFacing(piece,bone,worldPos,dir,worldSize){
  setWorldTransform(piece,bone,new THREE.Matrix4().compose(worldPos,facingQuat(dir),new THREE.Vector3(worldSize,worldSize,worldSize))); }

// ---------------------------------------------------------------- the pieces themselves
function padMesh(style){ const g=new THREE.Group(); g.name='armorPad';
  g.add(new THREE.Mesh(PAD_GEO,mat(style.primary,style.emissive?{emissive:C(style.emissive),emissiveIntensity:.3}:undefined)));
  if(style.family==='plate'){ const r=new THREE.Mesh(RIM_GEO,mat(style.accent,{emissive:C(style.accent),emissiveIntensity:.45})); r.rotation.x=Math.PI/2; r.scale.set(.92,.92,.2); r.position.y=-.06; g.add(r); }
  else if(style.family==='crystal'){ const s=new THREE.Mesh(SHARD_GEO,mat(style.accent,{emissive:C(style.accent),emissiveIntensity:.8})); s.scale.set(.4,.68,.4); s.position.y=.5; g.add(s); }
  else if(style.family==='spiked'){ const col=style.bone?0xd8c8a0:style.primary; for(let i=0;i<3;i++){ const a=(i-1)*.62; const sp=new THREE.Mesh(SPIKE_GEO,mat(col,{emissive:C(style.accent),emissiveIntensity:.35})); sp.position.set(Math.sin(a)*.48,.28,Math.cos(a)*.2); sp.rotation.z=-a*.7; sp.scale.set(.32,.62,.32); g.add(sp); } }
  else if(style.family==='organic'){ const geo=style.feather?FEATHER_GEO:LEAF_GEO; for(let i=0;i<3;i++){ const l=new THREE.Mesh(geo,mat(style.accent,{emissive:C(style.emissive||style.accent),emissiveIntensity:.22})); l.scale.setScalar(.5); l.position.set((i-1)*.24,.1,.3); l.rotation.x=-Math.PI/2.3; l.rotation.z=(i-1)*.3; g.add(l); } }
  if(style.crack) for(const x of [-.16,.16]){ const c=new THREE.Mesh(CRACK_GEO,basic(style.accent)); c.scale.set(1,.55,1); c.position.set(x,.32,.6); g.add(c); }
  return g; }
function chestMesh(style){ const g=new THREE.Group(); g.name='armorChest';
  g.add(new THREE.Mesh(CHEST_GEO,mat(style.primary,style.emissive?{emissive:C(style.emissive),emissiveIntensity:.28}:undefined)));
  const gem=new THREE.Mesh(SHARD_GEO,mat(style.accent,{emissive:C(style.accent),emissiveIntensity:.85})); gem.scale.set(.26,.38,.15); gem.position.z=.14; g.add(gem);
  if(style.heal){ const hg=glow(style.accent,.85,0); hg.name='healGlow'; hg.position.z=.22; g.add(hg); }
  return g; }
function capeMesh(style){ const g=new THREE.Group(); g.name='armorCape';
  // double-sided (build 181 probe: a puff of hair/quiver geometry sometimes sits between the collar and the camera on
  // the Troll, and a single-sided cloth plane seen from the "wrong" side at some head/camera angles just vanished)
  const trim=new THREE.Mesh(CAPE_GEO,mat(style.accent,{emissive:C(style.emissive||style.accent),emissiveIntensity:.22,side:THREE.DoubleSide})); trim.scale.set(1.1,1.05,1); trim.position.z=-.016; g.add(trim);
  g.add(new THREE.Mesh(CAPE_GEO,mat(style.primary,{side:THREE.DoubleSide})));
  if(style.stars) for(let i=0;i<6;i++){ const s=glow(0xf0e8ff,.1+LR()*.06,.85); s.position.set((LR()-.5)*.62,-.12-LR()*.72,.03); s.name='star'; g.add(s); }
  return g; }

// ---------------------------------------------------------------- build/teardown for the CURRENT (local) hero
let CUR={key:null,parts:null,lastErr:null};
function teardown(){ if(!CUR.parts) return; for(const p of CUR.parts.all) if(p.parent) p.parent.remove(p); CUR.parts=null; }
function buildLook(root,style){
  const B=heroBones(root); if(!B.lsh||!B.rsh) return null;
  root.updateMatrixWorld(true);
  const lp=new THREE.Vector3(), rp=new THREE.Vector3(), sp=new THREE.Vector3();
  B.lsh.getWorldPosition(lp); B.rsh.getWorldPosition(rp); (B.spineTop||B.lsh).getWorldPosition(sp);
  const shoulderW=Math.max(.1,lp.distanceTo(rp));
  const fwd=forwardOf(B), back=fwd.clone().negate();
  const outL=lp.clone().sub(sp); outL.y=0; if(outL.lengthSq()<1e-6) outL.set(-1,0,0); outL.normalize();
  const outR=rp.clone().sub(sp); outR.y=0; if(outR.lengthSq()<1e-6) outR.set(1,0,0); outR.normalize();
  // build 181 fix (main session, before publishing): the first pass sized the pad's own radius at .36 of the FULL
  // shoulder-to-shoulder span, then pushed it out another .55 of that already-huge radius -- a pauldron nearly as wide
  // as both shoulders together, floating well clear of the arm. A real pauldron caps the joint; it reads right at
  // roughly a sixth of the shoulder span, sitting close in (placeRadial's own outward push is relative to worldRadius,
  // so shrinking the radius alone pulls it back in to scale). Same story on the chest emblem: .56 of the shoulder span
  // as its OWN scale, on a shape that already spans 2 local units tall, stood taller than the torso and floated a good
  // way out in front of it on a .42 forward offset; a badge-sized emblem sitting close to the chest reads as armor
  // instead of a hovering sign
  const ls=padMesh(style), rs=padMesh(style); placeRadial(ls,B.lsh,outL,shoulderW*.16); placeRadial(rs,B.rsh,outR,shoulderW*.16);
  const chest=chestMesh(style); const chestBone=B.spineTop||B.collar; chestBone.updateWorldMatrix(true,false);
  const cbp=new THREE.Vector3(); chestBone.getWorldPosition(cbp); const chestWorld=cbp.clone().addScaledVector(fwd,shoulderW*.2).addScaledVector(UPV,shoulderW*.02);
  placeFacing(chest,chestBone,chestWorld,fwd,shoulderW*.28);
  const cape=capeMesh(style); const capeBone=B.collar; capeBone.updateWorldMatrix(true,false);
  const capeAnchor=new THREE.Vector3(); capeBone.getWorldPosition(capeAnchor); capeAnchor.addScaledVector(back,shoulderW*.14).addScaledVector(UPV,-shoulderW*.05);
  placeFacing(cape,capeBone,capeAnchor,back,shoulderW*1.15);
  const all=[ls,rs,chest,cape]; for(const p of all) outline(p);
  return {all,ls,rs,chest,cape}; }
function computeStyleKey(){ const a=gear.armor; if(!a) return null;
  if(a.named&&NAMED_STYLE[a.named]) return 'named:'+a.named;
  const sn=Meta.sets&&Meta.sets.setOf?Meta.sets.setOf(a):null; return sn&&STYLE[sn]?'set:'+sn:null; }
function styleFor(key){ if(!key) return null; if(key.slice(0,6)==='named:') return NAMED_STYLE[key.slice(6)]; return STYLE[key.slice(4)]; }

// ---------------------------------------------------------------- the softer three-piece aura (5-piece stays
// 93-gearsets.js's own AURA, untouched; this is purely additive, its own shell, its own dim pulse)
let SOFT={root:null,col:null,meshes:[]};
function softClear(){ if(SOFT.meshes.length&&window.__setglow) window.__setglow.undress(SOFT.meshes); SOFT.meshes=[]; SOFT.root=null; SOFT.col=null; }
function softTick(root){
  const act=(Meta.sets&&Meta.sets.active)?Meta.sets.active():[]; const three=act.find(a=>a.tier===3);
  const pk=three&&Meta.packs?Meta.packs.get(three.name):null; const col=(pk&&pk.col)?pk.col:null;
  if(!col||!root){ if(SOFT.meshes.length) softClear(); return; }
  if(SOFT.root!==root||SOFT.col!==col){ softClear(); const sc=(useGLB&&GLBH&&GLBH.scale)||1; SOFT.meshes=window.__setglow.dress(root,col,sc); SOFT.root=root; SOFT.col=col; }
  window.__setglow.pulse(SOFT.meshes,S.t,3); }

// ---------------------------------------------------------------- per-frame: rebuild on change only, animate what's on
function tick(){
  const root=(useGLB&&GLBH)?GLBH.root:null;
  const key=root?computeStyleKey():null; const full=key&&root?(key+'|'+root.uuid):null;
  if(full!==CUR.key){ teardown(); if(full){ const st=styleFor(key); let built=null; try{ built=st&&buildLook(root,st); }catch(e){ CUR.lastErr=String(e&&e.stack||e); } if(built){ CUR.parts=built; CUR.key=full; CUR.styleName=key; } else { CUR.key=null; CUR.styleName=null; } } else { CUR.key=null; CUR.styleName=null; } }
  if(CUR.parts){ const t=S.t;
    CUR.parts.cape.rotation.x=Math.sin(t*1.1)*.05; CUR.parts.cape.rotation.z=Math.sin(t*.8+1)*.03;   // a short, gentle sway, not a cloth sim
    for(const c of CUR.parts.cape.children) if(c.name==='star'){ c.material.opacity=.5+.4*Math.sin(t*3+c.position.x*9); }
    const hg=CUR.parts.chest.children.find(c=>c.name==='healGlow');
    if(hg){ const healing=!!(window.__mythic&&window.__mythic.state&&window.__mythic.state().idleT>=2); hg.material.opacity=healing?(.55+.25*Math.sin(t*5)):0; } }
  if(window.__setglow) softTick(root);
}
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); tick(); }; }

function glowState(){ if(!CUR.parts) return null; const hg=CUR.parts.chest.children.find(c=>c.name==='healGlow'); const stars=CUR.parts.cape.children.filter(c=>c.name==='star');
  return {heal:hg?+hg.material.opacity.toFixed(2):null,stars:stars.length?stars.map(s=>+s.material.opacity.toFixed(2)):null}; }
function debugInfo(){ const out={}; if(CUR.parts) for(const k of ['ls','rs','chest','cape']){ const o=CUR.parts[k]; if(!o) continue; o.updateWorldMatrix(true,false); const wp=new THREE.Vector3(); o.getWorldPosition(wp); const box=new THREE.Box3().setFromObject(o); const sz=box.getSize(new THREE.Vector3()); out[k]={world:[+wp.x.toFixed(2),+wp.y.toFixed(2),+wp.z.toFixed(2)],size:[+sz.x.toFixed(2),+sz.y.toFixed(2),+sz.z.toFixed(2)],scale:+o.scale.x.toFixed(3),parent:o.parent&&o.parent.name,visible:o.visible}; }
  const root=(useGLB&&GLBH)?GLBH.root:null; if(root){ root.updateMatrixWorld(true); const B=heroBones(root); out.bones={}; for(const k in B){ const b=B[k]; if(!b) continue; const v=new THREE.Vector3(); b.getWorldPosition(v); out.bones[k]=[+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)]; } }
  return out; }
window.__armorlook={STYLE:()=>Object.keys(STYLE),NAMED:()=>Object.keys(NAMED_STYLE),
  current:()=>({key:CUR.styleName||null,parts:!!CUR.parts,soft:{on:SOFT.meshes.length>0,col:SOFT.col}}),
  debug:debugInfo,glow:glowState,
  raw:()=>({useGLB,hasGLBH:!!GLBH,root:(useGLB&&GLBH)?GLBH.root.uuid:null,computeKey:computeStyleKey(),curKey:CUR.key,curStyleName:CUR.styleName,armor:gear.armor&&gear.armor.name,lastErr:CUR.lastErr,bones:(useGLB&&GLBH)?(()=>{ const B=heroBones(GLBH.root); return {lsh:!!B.lsh,rsh:!!B.rsh,spineTop:!!B.spineTop,collar:!!B.collar,hips:!!B.hips,head:!!B.head,headfront:!!B.headfront}; })():null}),
  styleOf:it=>{ if(!it) return null; if(it.named&&NAMED_STYLE[it.named]) return 'named:'+it.named; const sn=Meta.sets&&Meta.sets.setOf?Meta.sets.setOf(it):null; return sn&&STYLE[sn]?'set:'+sn:null; }};
})();
