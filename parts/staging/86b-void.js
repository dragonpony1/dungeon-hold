// ===== THE VOID SET'S WEAPONS (build 158): shaped after Matt's Void thumbnails (items/sets/void-*.jpg) — near-black
// obsidian and dark iron, silver-grey fittings, violet crystal and runes that burn. The set's one shared mark is the silver
// CRESCENT: a guard whose ends curl into up-and-down horns, lined with violet on their hollow side (the sword's crossguard,
// the spear's socket and its butt, the bow's grip all wear it).
//   sword-void    a straight obsidian longsword, both edges lit violet, a rune column below the guard and violet cracks
//                 lightning across the lower blade; the crescent guard round a violet eye; a violet crystal for a pommel
//                 held in silver claws with a thin ring about it (void-sword.jpg)
//   staff-void    a black shaft twisted with silver, violet insets, a lit rune band; four silver prongs with inner barbs at
//                 the diagonals round a tall faceted violet crystal carved with a burning rune; crystal shards, motes and a
//                 thin orbit ring circle it (void-staff.jpg)
//   polearm-void  a crystal spear, not a scythe: a long faceted violet blade with a lit edge, ridge and circle rune, rising
//                 out of a doubled silver crescent socket; black wrapped shaft with silver bands and violet diamonds; a
//                 violet crystal spike for a butt in its own small crescent (void-polearm.jpg)
//   bow-void      no art yet: a dark recurve with a violet vein down the face of each limb (the sword's lit edge) set with
//                 rune diamonds, silver bands and spurs, silver horns curling forward at the tips, crystal nocks, the
//                 crescent through the grip about its crystal, violet crystal shards adrift along it (83-bow.js's bow)
// It replaces the older plain staff-void and bow-void (82/83); 94-voidset.js's own 'void' sword template is left alone.
(function(){
const {V,lit,shapeOf,slab,tube,helix,spike,toward,noOL,pulseGlow,faceCracks,crescent,OUTER,INNER,EDGE_IN,finish,SWORD_BOX,POLE_BOX,DIAG}=window.__setweapons.kit;
const VO={obs:0x17131f,obs2:0x231d2e,iron:0x2c2638,silver:0xaeacbf,silver2:0x7a778e,wrap:0x1c1824,glow:0x9a48ff,glow2:0xc58cff,rune:0xe4c8ff,crys:0x6a30e0,crysE:0x3a12a0};
const crysMat=()=>mat(VO.crys,{emissive:C(VO.crysE),emissiveIntensity:.8});   // violet crystal: toon-shaded facets that still glow
// flat pieces from several outlines at once (runes, cracks: one mesh each), centred on z
function flat(shapes,depth,m){ const geo=new THREE.ExtrudeGeometry(shapes,{depth,bevelEnabled:false,curveSegments:10}); geo.translate(0,0,-depth/2); return new THREE.Mesh(geo,m); }
function ringS(x,y,r,w){ const s=new THREE.Shape(); s.absarc(x,y,r,0,TAU,false); const h=new THREE.Path(); h.absarc(x,y,r-w,0,TAU,true); s.holes.push(h); return s; }
function discS(x,y,r){ const s=new THREE.Shape(); s.absarc(x,y,r,0,TAU,false); return s; }
function diamondS(x,y,w,h){ return shapeOf([[x,y-h],[x+w,y],[x,y+h],[x-w,y]]); }
function strip(pts,w){ const L=[],R=[],n=pts.length; for(let i=0;i<n;i++){ const a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)]; let dx=b[0]-a[0], dy=b[1]-a[1]; const l=Math.hypot(dx,dy)||1; dx/=l; dy/=l; const hw=w/2*((i===0||i===n-1)?.2:1); L.push([pts[i][0]-dy*hw,pts[i][1]+dx*hw]); R.push([pts[i][0]+dy*hw,pts[i][1]-dx*hw]); } return shapeOf(L.concat(R.reverse())); }   // a line with width, pointed at both ends
function outlineWithHole(out,inn){ const s=shapeOf(out); s.holes.push(shapeOf(inn)); return s; }
// a blade's burning edge: lit on both faces between its outline and an inner one, but its thickness wall stays dark, with
// only a thin violet line standing just proud of the outline — so edge-on it reads as dark stone with a lit edge, not a bar
function burningEdge(out,inn,depth,sideMat,cy){ const geo=new THREE.ExtrudeGeometry([outlineWithHole(out,inn)],{depth,bevelEnabled:false}); geo.translate(0,0,-depth/2);
  const q=new THREE.Group(); q.add(noOL(new THREE.Mesh(geo,[lit(VO.glow),sideMat])));   // (an extrusion's group 0 is its faces, group 1 its walls)
  const grow=out.map(([x,y])=>x===0?[0,y+Math.sign(y-cy)*.004]:[x+Math.sign(x)*.0035,y]); q.add(noOL(flat([outlineWithHole(grow,out)],.009,lit(VO.glow)))); return q; }
const mirror=R=>R.concat(R.slice(1,-1).reverse().map(([x,y])=>[-x,y]));   // a right half (bottom centre round to top centre) made whole
// a faceted crystal turned from its profile ([r,y] pairs), flat-shaded
function crystalGeo(prof,seg,rot){ const geo=new THREE.LatheGeometry(prof.map(p=>new THREE.Vector2(p[0],p[1])),seg||6); if(rot) geo.rotateY(rot); const ng=geo.index?geo.toNonIndexed():geo; ng.computeVertexNormals(); return ng; }
// THE CRESCENT: a guard plate whose ends curl into horns up and down, hollow outward, lined violet on the hollow (centre at 0,0)
const CRES=mirror([[0,-.042],[.024,-.026],[.045,-.014],[.068,-.012],[.074,-.03],[.09,-.052],[.128,-.074],[.106,-.042],[.098,-.018],[.098,.012],[.106,.04],[.132,.078],[.094,.056],[.076,.034],[.068,.013],[.045,.014],[.024,.026],[0,.042]]);
const CRES_LINE=[[.121,-.066],[.102,-.04],[.093,-.018],[.093,.012],[.101,.038],[.125,.07]];
function crescentGuard(sc,depth,metal){ const q=new THREE.Group(); const s=p=>p.map(([x,y])=>[x*sc,y*sc]);
  q.add(slab(s(CRES),depth,mat(metal)));
  q.add(noOL(flat([strip(s(CRES_LINE),.008*sc),strip(s(CRES_LINE).map(([x,y])=>[-x,y]),.008*sc)],depth+.006,[lit(VO.glow),mat(metal)])));   // violet in the hollow of each horn (its walls stay metal)
  return q; }

// ---------------------------------------------------------------- the sword (void-sword.jpg)
function voidSword(){ const g=new THREE.Group(); g.name='sword-void';
  const BL=[[.05,.21],[.052,.3],[.05,.45],[.051,.62],[.05,.78],[.044,.86],[.026,.935],[0,1]], BI=[[.04,.214],[.042,.3],[.04,.45],[.041,.62],[.04,.78],[.035,.853],[.019,.922],[0,.968]];
  const half=R=>R.concat(R.slice(0,-1).reverse().map(([x,y])=>[-x,y]));
  g.add(slab(half(BL),.028,mat(VO.obs)));   // the obsidian blade, straight, a long point
  g.add(burningEdge(half(BL),half(BI),.032,mat(VO.obs),.6));   // both edges burning violet, and the point
  g.add(slab([[.014,.2],[.014,.47],[0,.52],[-.014,.47],[-.014,.2]],.034,mat(VO.obs2)));   // a raised spine below the guard
  g.add(noOL(flat([ringS(0,.262,.012,.0035),discS(0,.262,.004),strip([[0,.232],[0,.249]],.004),strip([[0,.276],[0,.47]],.0035),
    strip([[-.009,.318],[0,.306],[.009,.318]],.0035),strip([[-.009,.358],[0,.346],[.009,.358]],.0035),diamondS(0,.4,.008,.014),strip([[-.009,.45],[0,.438],[.009,.45]],.0035)],.038,lit(VO.glow2))));   // the rune column: an eye, arrows, a diamond
  g.add(noOL(flat([strip([[.042,.5],[.02,.545],[.028,.575],[.004,.625],[.012,.655],[-.018,.72],[-.01,.745],[-.04,.8]],.006),strip([[.012,.655],[.03,.68],[.026,.7],[.04,.73]],.0045),
    strip([[-.04,.56],[-.022,.6],[-.028,.63],[-.006,.66]],.0045),strip([[-.03,.8],[-.012,.83],[-.018,.855],[0,.9]],.0045),diamondS(.012,.87,.006,.012)],.032,lit(VO.glow))));   // violet cracks lightning across the lower blade, a rune by the point
  { const gd=crescentGuard(1,.05,VO.silver2); gd.position.y=.207; g.add(gd); }   // the crescent guard
  for(const s of [-1,1]) g.add(slab([[s*.04,.2],[s*.059,.2],[s*.059,.255],[s*.05,.3],[s*.046,.255],[s*.04,.24]],.036,mat(VO.silver2)));   // langets gripping the blade's shoulders
  g.add(noOL(flat([ringS(0,.207,.029,.008)],.058,mat(VO.silver)))); { const orb=M(G.cyl(.022,.022,.056,12),lit(VO.glow),0,.207,0); orb.rotation.x=PI/2; g.add(noOL(orb)); g.add(noOL(flat([discS(0,.212,.007)],.06,lit(VO.rune)))); }   // the violet eye in a silver ring, both faces, a spark in it
  g.add(M(G.cyl(.017,.02,.13,8),mat(VO.wrap),0,.115,0)); g.add(tube(helix(.055,.175,.021,2.5,0),.004,mat(VO.silver2),26)); g.add(tube(helix(.055,.175,.021,-2.5,PI),.004,mat(VO.silver2),26));   // the grip, bound crosswise
  for(const y of [.052,.182]){ g.add(M(G.cyl(.024,.024,.016,8),mat(VO.silver),0,y,0)); g.add(noOL(M(G.sph(.006,5,4),lit(VO.glow2),0,y,.024))); }   // silver collars, a violet stud on each
  g.add(M(G.cyl(.014,.026,.022,8),mat(VO.silver),0,.034,0));   // the claw-cup
  for(let i=0;i<4;i++){ const a=i/4*TAU+PI/4; g.add(spike(.007,.04,mat(VO.silver),Math.sin(a)*.022,.01,Math.cos(a)*.022,PI+Math.cos(a)*.35,Math.sin(a)*.35)); }   // four claws down round the crystal
  { const c=new THREE.Mesh(new THREE.OctahedronGeometry(.023,0),lit(VO.glow2)); c.scale.set(1,2,1); c.position.y=-.002; g.add(noOL(c)); }   // the crystal pommel
  { const r=new THREE.Mesh(new THREE.TorusGeometry(.034,.0028,4,20),lit(VO.glow)); r.position.y=-.004; r.rotation.x=PI/2-.35; g.add(noOL(r)); }   // a thin ring about it
  g.add(pulseGlow(VO.glow,.15,0,.62,0)); g.add(pulseGlow(VO.glow2,.12,0,-.004,0));   // (a sword's glows stay small)
  return finish(g,'void',SWORD_BOX(),.11,1); }

// ---------------------------------------------------------------- the staff (void-staff.jpg)
const VO_K={name:'Staff of the Void',tier:5,wood:VO.obs,dark:VO.wrap,band:VO.silver,gem:0xd070ff,glow:0x9a30ff,prongs:0,rings:0,motes:4,gemR:.07};
function voidStaff(){ const g=new THREE.Group(); g.name='staff-void';
  g.add(M(G.cyl(.03,.038,1.14,8),mat(VO.obs),0,.57,0));
  for(const ph of [0,PI]) g.add(tube(helix(.08,.98,.037,3,ph),.0075,mat(VO.silver2),40));   // silver ribbons twisting up the shaft
  for(const y of [.2,.66,.84]){ const d=new THREE.Mesh(new THREE.OctahedronGeometry(.014,0),lit(VO.glow)); d.scale.set(1,1.8,.5); d.position.set(0,y,.037); g.add(noOL(d)); }   // violet insets between them
  g.add(M(G.cyl(.044,.044,.17,8),mat(VO.wrap),0,.44,0)); for(const y of [.355,.525]) g.add(M(G.cyl(.047,.047,.016,8),mat(VO.silver),0,y,0));   // the grip
  g.add(M(G.cyl(.05,.05,.075,8),mat(VO.silver),0,1.0,0)); g.add(noOL(M(G.cyl(.052,.052,.016,8),lit(VO.glow),0,1.0,0)));   // the rune band, burning
  g.add(M(G.cyl(.052,.038,.07,8),mat(VO.silver2),0,1.07,0));   // the socket
  g.add(M(G.cyl(.036,.03,.06,8),mat(VO.silver),0,.02,0)); for(let i=0;i<3;i++){ const a=i/3*TAU; g.add(spike(.009,.045,mat(VO.silver),Math.sin(a)*.03,0,Math.cos(a)*.03,PI+Math.cos(a)*.5,-Math.sin(a)*.5)); }
  { const c=new THREE.Mesh(new THREE.OctahedronGeometry(.022,0),lit(VO.glow2)); c.scale.set(1,2.2,1); c.position.y=-.035; g.add(noOL(c)); }   // a violet crystal for a foot
  const head=new THREE.Group(); head.name='staffHead'; head.position.y=1.27; g.add(head);
  for(const a of DIAG){ const c=Math.cos(a), s=Math.sin(a);
    head.add(tube([[s*.035,-.21,c*.035],[s*.1,-.15,c*.1],[s*.14,-.05,c*.14],[s*.135,.05,c*.135],[s*.105,.12,c*.105]],.0125,mat(VO.silver2),16));
    head.add(spike(.014,.075,mat(VO.silver),s*.098,.15,c*.098,-c*.35,s*.35));   // silver prongs at the diagonals, pointed
    head.add(spike(.009,.055,mat(VO.silver),s*.125,-.07,c*.125,-c*1.1,s*1.1)); }   // an inner barb on each
  { const geo=crystalGeo([[0,-.13],[.07,-.05],[.076,.12],[.052,.23],[0,.34]],6,PI/6); const gem=new THREE.Mesh(geo,crysMat()); gem.name='gem';
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:C(VO.glow2)})); gem.add(edges);   // its facets' edges catch the light
    for(const z of [1,-1]){ const r=noOL(flat([strip([[0,-.045],[0,.135]],.009),ringS(0,.085,.026,.008),ringS(0,.0,.019,.007),discS(0,0,.006)],.004,lit(VO.rune))); r.position.z=z*.066; if(z<0) r.rotation.y=PI; gem.add(r); }   // the burning rune, front and back
    head.add(gem); }   // the tall crystal (it turns)
  const gl=glow(VO.glow,1.15,.8); gl.name='glow'; gl.position.y=.05; head.add(gl);
  for(let i=0;i<4;i++){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(.018,0),lit(i%2?VO.glow2:VO.glow)); m.name='mote'+i; head.add(noOL(m)); }
  for(let i=0;i<3;i++){ const s=new THREE.Mesh(new THREE.OctahedronGeometry(.028,0),crysMat()); s.name='shard'+i; s.scale.set(1,2.4,1); head.add(s); }   // crystal shards adrift about it
  { const r=new THREE.Mesh(new THREE.TorusGeometry(.22,.0035,4,36),lit(VO.glow)); r.name='ring0'; r.rotation.x=PI/2+.35; r.position.y=.05; head.add(noOL(r)); }   // a thin orbit ring
  g.userData.kind='void'; g.userData.staff=VO_K;
  return finish(g,'void',new THREE.Box3(V(-.26,-.09,-.26),V(.26,1.5,.26)),.36,1.64); }

// ---------------------------------------------------------------- the polearm: a crystal spear (void-polearm.jpg)
function voidPolearm(){ const g=new THREE.Group(); g.name='polearm-void';
  g.add(M(G.cyl(.028,.034,1.22,8),mat(VO.obs),0,.61,0));
  g.add(M(G.cyl(.038,.038,.3,8),mat(VO.wrap),0,.42,0)); g.add(tube(helix(.28,.56,.039,4,0),.004,mat(VO.iron),40)); g.add(tube(helix(.28,.56,.039,-4,PI),.004,mat(VO.iron),40));   // the wrapped grip, cross-bound
  for(const y of [.2,.7,.98]){ g.add(M(G.cyl(.04,.04,.035,8),mat(VO.silver),0,y,0)); for(const z of [.04,-.04]){ const d=new THREE.Mesh(new THREE.OctahedronGeometry(.016,0),lit(VO.glow)); d.scale.set(1,1.7,.5); d.position.set(0,y,z); g.add(noOL(d)); } }   // silver bands set with violet diamonds
  g.add(M(G.cyl(.046,.036,.1,8),mat(VO.silver2),0,1.2,0)); for(const z of [.047,-.047]){ const d=new THREE.Mesh(new THREE.OctahedronGeometry(.02,0),lit(VO.glow)); d.scale.set(1,1.6,.45); d.position.set(0,1.19,z); g.add(noOL(d)); }   // the socket, a violet diamond set in each face
  { const gd=crescentGuard(1.3,.036,VO.silver2); gd.position.y=1.235; g.add(gd); const g2=crescentGuard(1.05,.03,VO.silver2); g2.position.y=1.345; g.add(g2); }   // a doubled crescent the blade rises from
  const BR=[[0,1.24],[.05,1.27],[.09,1.33],[.098,1.38],[.086,1.42],[.09,1.46],[.062,1.53],[.042,1.58],[.022,1.62],[0,1.67]], BRI=[[0,1.262],[.043,1.287],[.08,1.338],[.087,1.38],[.075,1.42],[.078,1.46],[.052,1.525],[.033,1.572],[.015,1.608],[0,1.642]];
  { const geo=new THREE.ExtrudeGeometry(shapeOf(mirror(BRI)),{depth:.008,bevelEnabled:true,bevelThickness:.017,bevelSize:.011,bevelSegments:1}); geo.translate(0,0,-.004); g.add(new THREE.Mesh(geo,crysMat())); }   // the crystal blade, its edges ground to facets
  g.add(slab(BRI.map(([x,y])=>[x*.8,y+(1.45-y)*.04]),.046,mat(0x9a70ff,{emissive:C(0x4a20b0),emissiveIntensity:.8})));   // one face of it catching the light
  { const grow=mirror(BR).map(([x,y])=>x===0?[0,y+Math.sign(y-1.45)*.004]:[x+Math.sign(x)*.004,y]); g.add(noOL(flat([outlineWithHole(grow,mirror(BR))],.01,lit(VO.glow)))); }   // its edge, burning
  g.add(noOL(flat([strip([[0,1.29],[0,1.35]],.007),strip([[0,1.41],[0,1.63]],.006),ringS(0,1.38,.03,.007),discS(0,1.38,.007),strip([[-.014,1.48],[0,1.462],[.014,1.48]],.006),diamondS(0,1.535,.009,.016)],.05,lit(VO.rune))));   // a lit ridge, the circle rune, arrows
  g.add(noOL(flat([strip([[0,1.575],[.03,1.53]],.0035),strip([[0,1.5],[-.05,1.455],[-.07,1.44]],.0035),strip([[-.004,1.43],[-.045,1.36]],.003),strip([[0,1.33],[.055,1.36],[.075,1.4]],.0035)],.048,lit(VO.glow2))));   // fractures in the crystal
  g.add(M(G.cyl(.028,.036,.07,8),mat(VO.silver),0,.03,0)); { const gd=crescentGuard(.6,.03,VO.silver2); gd.position.y=.07; g.add(gd); }   // the butt's small crescent
  { const sp=new THREE.Mesh(crystalGeo([[0,-.1],[.026,-.02],[.028,.01],[0,.03]],5),crysMat()); g.add(sp); }   // a violet crystal spike for a foot
  g.add(pulseGlow(VO.glow,.5,0,1.42,0));
  return finish(g,'void',POLE_BOX(-.18,.18),.3,1.64); }

// ---------------------------------------------------------------- the bow (no art yet: dressed to sit with the others)
const VO_BOW={name:'Bow of the Void',tier:5,len:1.0,wood:VO.obs2,dark:VO.wrap,band:VO.silver,glow:0x9a40ff,tips:'crystal',gem:0xc070ff,motes:3,litString:true,recurve:true,
  deco:(g,h)=>{ const front=(u,d)=>{ const a=h.P(Math.max(0,u-.01)), b=h.P(Math.min(1,u+.01)); const ty=b.y-a.y, tz=b.z-a.z, l=Math.hypot(ty,tz)||1; const p=h.P(u); return [0,p.y-h.gp.y-tz/l*d,p.z-h.gp.z+ty/l*d]; };   // a point on the face of the stave (away from the string), grip-relative
    for(const [limb,u0,u1] of [[h.limbL,.07,.43],[h.limbU,.57,.93]]){ const pts=[]; for(let i=0;i<=8;i++) pts.push(front(u0+(u1-u0)*i/8,.024)); limb.add(noOL(tube(pts,.0065,lit(VO.glow),16))); }   // a violet vein down the face of each limb, like the sword's edges
    for(const u of [.16,.26,.74,.84]){ const d=new THREE.Mesh(new THREE.OctahedronGeometry(.017,0),lit(VO.rune)); d.scale.set(.8,1.7,.8); h.at(noOL(d),u,.03); }   // rune diamonds set in it
    for(const u of [.4,.6]) h.at(M(G.cyl(.035,.035,.035,8),mat(VO.silver)),u);   // silver bands where the limbs leave the grip
    for(const u of [.05,.95]){ const s=u>.5?1:-1; h.at(tube([[0,0,-.01],[0,s*.025,.04],[0,s*.07,.07],[0,s*.12,.065]],.01,mat(VO.silver),10),u,.01); }   // silver horns curling forward at the tips
    for(const u of [.2,.8]){ const s=u>.5?1:-1; h.at(spike(.012,.06,mat(VO.silver),0,0,0,s>0?PI/3:PI-PI/3,0),u,.03); }   // silver spurs
    { const gd=crescentGuard(.9,.03,VO.silver2); gd.rotation.y=PI/2; gd.position.set(0,h.gp.y,h.gp.z+.01); g.add(gd); }   // the crescent through the grip, turned to show side-on (its back horns stop well short of the string)
    { const r=new THREE.Mesh(new THREE.TorusGeometry(.052,.007,5,20),mat(VO.silver)); r.position.set(0,h.gp.y,h.gp.z+.075); g.add(r); }   // a silver ring round the belly crystal
    for(let i=0;i<3;i++){ const s=new THREE.Mesh(new THREE.OctahedronGeometry(.024,0),crysMat()); s.name='shard'+i; s.scale.set(1,2.2,1); g.add(s); } } };   // violet crystal shards adrift along it

window.__setweapons.addSet('void',{ids:['void'],tail:/ of the void$/i,sword:voidSword,polearm:voidPolearm,staff:[VO_K,voidStaff],bow:VO_BOW});
})();
