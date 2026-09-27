// ===== SET WEAPONS (build 154): the gear sets' own weapons, built in code like the battle staffs and the bows (Matt: the
// Witch's code-built staff "was really good and on brand"). Shaped after Matt's gear-set thumbnails (the hideout's
// items/sets/<set>-<piece>.jpg). Three sets so far — Chaos (the hideout's "crimson" set), Necrotic ("shadow") and Fire
// ("lava") — each with four weapons, one per hand:
//   sword-<set>    the Gnome Knight's sword mount (1 unit long: pommel at y=0, tip at y=1, fist at 11%)
//   polearm-<set>  the Knight too, when the item is a polearm (a scythe for Chaos and Necrotic, a halberd for Fire) —
//                  body-length like a staff, held a third of the way up
//   staff-<set>    the Battle Witch's and Gnome Fighter's staff mount (the staff frame of 82-staff.js: head at y=1.27,
//                  children named gem/core/glow/mote<n> so its animator turns and pulses them; its bolts take K's colours)
//   bow-<set>      the Troll Archer's bow mount (83-bow.js's own bow with this set's fittings hung on its limbs)
// Which one a hero holds: the hand decides the kind, as for every weapon here (80-weapons.js) — a Chaos item shows the
// Chaos sword on the Knight, the Chaos staff on the Witch, the Chaos bow on the Troll — except that the Knight holds a
// forged polearm as a polearm. A piece is known by the hideout's set id (it.setId, 97-mythics.js keeps it) or by its
// name's ending ("Mythic Staff of Chaos"), and a polearm by it.look or its name. window.__setweapons.bench() lines them
// all up in the hall for a look. Build 158: the other six forge sets (Void, Earth, Radiance, Storm, Ice, Wind) each have
// their own file, 86b-void.js … 86g-wind.js, built with this file's kit and registered through addSet (below); the
// Storm set's key is 'tempest' because staff-storm / bow-storm are the forge's tier-4 staff and bow.
// tools/weapon-shot.mjs takes pictures of any set's four, alone and in the heroes' hands.
(function(){
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const lit=h=>basic(h);   // unlit: glowing veins, eyes, crystals, lava
function shapeOf(pts){ const s=new THREE.Shape(); s.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) s.lineTo(pts[i][0],pts[i][1]); s.closePath(); return s; }
function slab(pts,depth,m){ const g=new THREE.ExtrudeGeometry(shapeOf(pts),{depth,bevelEnabled:false}); g.translate(0,0,-depth/2); return new THREE.Mesh(g,m); }   // a flat blade from its outline, centred on z
function tube(pts,r,m,seg){ return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>V(p[0],p[1],p[2]))),seg||20,r,6,false),m); }
function helix(y0,y1,r,turns,ph,jit){ const pts=[], n=Math.max(8,Math.round(turns*12)); for(let i=0;i<=n;i++){ const f=i/n, a=ph+f*turns*TAU, rr=r+(jit?Math.sin(i*2.3+ph*5)*jit:0); pts.push([Math.cos(a)*rr,y0+(y1-y0)*f,Math.sin(a)*rr]); } return pts; }
function spike(r,h,m,x,y,z,rx,rz){ const c=new THREE.Mesh(G.cone(r,h,5),m); c.position.set(x,y,z); c.rotation.set(rx||0,0,rz||0); return c; }
function toward(c,dx,dy){ c.rotation.z=-Math.atan2(dx,dy); return c; }   // turn a cone (points +y) to point along (dx,dy) in the xy plane
function noOL(o){ o.traverse(m=>{ m.userData.noOL=true; }); return o; }
function pulseGlow(hex,size,x,y,z){ const s=glow(hex,size,.6); s.name='glowPulse'; s.position.set(x,y,z); return s; }
// jagged glowing cracks on both faces of a flat blade (x spread, y from..to, the blade's half-thickness)
function faceCracks(g,col,xs,y0,y1,half,seed){ for(let c=0;c<xs.length;c++){ const pts=[]; for(let y=y0+c*.03,i=0;y<y1;y+=.055,i++) pts.push([xs[c]+Math.sin(i*2.1+c*1.7+seed)*.011,y,0]); if(pts.length<3) continue; for(const z of [half,-half]){ const t=tube(pts.map(p=>[p[0],p[1],z]),.0035,lit(col),pts.length*3); noOL(t); g.add(t); } } }
// the flat of a crescent: outer curve out, inner (cutting) curve back
function crescent(outer,inner){ const a=outer[outer.length-1], b=inner[inner.length-1]; const tail=(a[0]===b[0]&&a[1]===b[1])?inner.slice(0,-1):inner; return outer.concat(tail.slice().reverse()); }   // (a shared tip point only once)
const OUTER=[[.03,1.3],[.1,1.45],[.22,1.54],[.37,1.54],[.49,1.45],[.56,1.3],[.57,1.12],[.53,.94]];   // the scythe's back, curling down to its point
const INNER=[[.04,1.24],[.12,1.32],[.23,1.36],[.34,1.34],[.42,1.26],[.47,1.14],[.5,1.02],[.53,.94]];   // its cutting edge (a broad crescent, as in the thumbnails)
const EDGE_IN=[[.05,1.27],[.125,1.345],[.233,1.385],[.35,1.365],[.44,1.285],[.495,1.16],[.522,1.03],[.535,.955]];   // a little inside the edge: the glowing strip lies between this and INNER
function finish(g,set,box,gripF,lenScale){ g.userData.box=box; g.userData.gripF=gripF; g.userData.lenScale=lenScale; g.userData.proc=true; g.userData.setw=set; return g; }
const SWORD_BOX=()=>new THREE.Box3(V(-.12,0,-.06),V(.12,1,.06));
const POLE_BOX=(x0,x1)=>new THREE.Box3(V(x0,-.08,-.07),V(x1,1.62,.07));
const DIAG=[1,3,5,7].map(i=>i*PI/4);   // claws at the four diagonals: the front of a staff's head stays open, so its eye, skull or crystal shows

// ---------------------------------------------------------------- CHAOS: corrupted bronze, crimson flesh, a burning eye
const CH={metal:0x6e4e3a,dark:0x2a1426,flesh:0x8c2044,flesh2:0x5a1430,bone:0xd9c2a0,glow:0xff2a50,glow2:0xc03cff,shaft:0x3a2420,wrap:0x2a1622};
function chaosSword(){ const g=new THREE.Group(); g.name='sword-chaos';
  g.add(slab([[.05,.21],[.072,.26],[.046,.29],[.076,.36],[.048,.39],[.073,.47],[.046,.5],[.069,.58],[.043,.61],[.063,.69],[.04,.72],[.056,.8],[.034,.83],[.044,.9],[.02,.95],[0,1],[-.02,.95],[-.046,.88],[-.03,.85],[-.061,.77],[-.041,.74],[-.067,.65],[-.045,.62],[-.071,.54],[-.047,.51],[-.073,.43],[-.048,.4],[-.07,.32],[-.05,.29],[-.055,.21]],.03,mat(CH.dark)));   // the barbed blade, every barb hooked upward
  g.add(noOL(slab([[.012,.23],[.02,.32],[.006,.4],[.018,.5],[.004,.6],[.014,.7],[.002,.8],[.008,.9],[0,.95],[-.008,.88],[-.002,.78],[-.016,.68],[-.004,.58],[-.02,.48],[-.006,.38],[-.018,.3],[-.012,.23]],.036,lit(CH.glow))));   // the burning vein down its heart
  for(const [x,y] of [[.03,.34],[-.035,.52],[.028,.66],[-.02,.8]]) for(const z of [.017,-.017]) g.add(noOL(M(G.sph(.011,6,5),lit(CH.glow2),x,y,z)));   // magenta blisters on both faces
  g.add(tube(helix(.2,.6,.058,1.2,0,.006),.01,mat(CH.flesh),30)); g.add(tube(helix(.2,.5,.05,1,PI,.006),.008,mat(CH.flesh2),26));   // two tentacles coiling up from the guard
  for(const s of [-1,1]) g.add(tube([[0,.195,0],[s*.05,.2,0],[s*.095,.225,0],[s*.115,.265,.01]],.013,mat(CH.metal),14));   // hooked horns for a guard
  g.add(M(G.box(.05,.028,.04),mat(0x3a2228),0,.195,0)); g.add(noOL(M(G.sph(.014,8,6),lit(CH.glow),0,.197,.022)));   // an eye between them
  g.add(M(G.cyl(.018,.021,.15,8),mat(CH.wrap),0,.105,0)); g.add(tube(helix(.04,.175,.021,3,0),.006,mat(CH.flesh),30));   // the grip, wound by a thin tendril
  g.add(M(G.sph(.028,8,6),mat(0x3a1a28),0,.022,0)); g.add(noOL(M(G.sph(.012,6,5),lit(CH.glow),0,.022,.024)));   // a pommel that watches
  for(let i=0;i<3;i++){ const a=i/3*TAU; g.add(spike(.008,.04,mat(CH.metal),Math.sin(a)*.026,.03,Math.cos(a)*.026,Math.cos(a)*.6,-Math.sin(a)*.6)); }
  g.add(pulseGlow(CH.glow,.16,0,.6,0));
  return finish(g,'chaos',SWORD_BOX(),.11,1); }
const CH_K={name:'Staff of Chaos',tier:5,wood:CH.shaft,dark:CH.wrap,band:CH.metal,gem:0xff4a6a,glow:CH.glow,prongs:0,rings:0,motes:3,gemR:.07};
function chaosStaff(){ const g=new THREE.Group(); g.name='staff-chaos';
  g.add(M(G.cyl(.03,.04,1.14,8),mat(CH.shaft),0,.57,0));
  g.add(tube(helix(.06,1.12,.04,4.5,0,.004),.01,mat(CH.flesh),60)); g.add(tube(helix(.1,1,.04,3.5,PI,.004),.007,mat(CH.flesh2),48));   // crimson tendrils twisting up the shaft
  for(let i=0;i<9;i++){ const y=.15+i*.1, a=i*2.4; g.add(spike(.009,.045,mat(CH.metal),Math.sin(a)*.04,y,Math.cos(a)*.04,Math.cos(a)*1.2,-Math.sin(a)*1.2)); }   // thorns
  g.add(M(G.cyl(.046,.046,.17,8),mat(CH.wrap),0,.44,0));
  for(let i=0;i<3;i++){ const a=i/3*TAU; g.add(spike(.012,.07,mat(CH.metal),Math.sin(a)*.02,-.02,Math.cos(a)*.02,PI+Math.cos(a)*.4,-Math.sin(a)*.4)); }   // a clawed foot
  const head=new THREE.Group(); head.name='staffHead'; head.position.y=1.27; g.add(head);
  for(const a of DIAG){ const c=Math.cos(a), s=Math.sin(a); head.add(tube([[s*.04,-.16,c*.04],[s*.13,-.06,c*.13],[s*.16,.06,c*.16],[s*.13,.17,c*.13],[s*.08,.23,c*.08]],.012,mat(CH.metal),16)); head.add(spike(.012,.05,mat(CH.bone),s*.08,.25,c*.08,-c*.7,s*.7)); }   // claws curling up round the eye, bone-tipped
  head.add(M(G.sph(.095,12,10),mat(0x3a0c18),0,.02,0));   // the eye
  { const iris=M(G.sph(.07,14,10),lit(0xff2a40),0,.02,.07); iris.scale.set(1,1,.35); head.add(noOL(iris)); head.add(noOL(M(G.box(.016,.1,.01),basic(0x120004),0,.02,.097))); head.add(noOL(M(G.sph(.012,6,5),lit(0xffc0c8),.022,.045,.094))); }   // a burning iris, slit black, with a glint
  const gl=glow(CH.glow,1.25,.85); gl.name='glow'; gl.position.z=.05; head.add(gl);
  for(let i=0;i<3;i++){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(.022,0),lit(i%2?CH.glow2:0xff3a5a)); m.name='mote'+i; head.add(noOL(m)); }
  for(const s of [-1,1]) head.add(tube([[s*.07,-.12,.02],[s*.1,-.2,.05],[s*.08,-.28,.02],[s*.1,-.33,-.01]],.007,mat(CH.flesh),14));   // tendrils hanging from the head
  g.userData.kind='chaos'; g.userData.staff=CH_K;
  return finish(g,'chaos',new THREE.Box3(V(-.26,-.09,-.26),V(.26,1.5,.26)),.36,1.64); }
function chaosPolearm(){ const g=new THREE.Group(); g.name='polearm-chaos';   // a scythe
  g.add(M(G.cyl(.03,.038,1.3,8),mat(CH.shaft),0,.65,0)); g.add(tube(helix(.05,1.28,.038,5,0,.004),.009,mat(CH.flesh),70));
  g.add(M(G.cyl(.044,.044,.16,8),mat(CH.wrap),0,.4,0)); g.add(M(G.cyl(.052,.04,.09,8),mat(CH.metal),0,1.3,0));
  for(let i=0;i<3;i++){ const a=i/3*TAU+.4; g.add(spike(.011,.06,mat(CH.metal),Math.sin(a)*.035,1.37,Math.cos(a)*.035,Math.cos(a)*.35,-Math.sin(a)*.35)); }   // a spiked crown on the collar
  g.add(slab(crescent(OUTER,INNER),.026,mat(0x3a1228)));   // the crimson blade
  g.add(noOL(slab(crescent(EDGE_IN,INNER),.03,lit(CH.glow))));   // its edge, burning
  for(let i=1;i<OUTER.length-1;i++){ const [x,y]=OUTER[i]; g.add(toward(spike(.011,.05,mat(CH.bone),x,y+.01,0),x-.25,y-1.27)); }   // bone teeth along the back
  g.add(tube(helix(.02,.36,.04,1.5,0,.004),.008,mat(CH.flesh2),24)); g.add(spike(.014,.09,mat(CH.metal),0,-.04,0,PI,0));   // the foot
  g.add(pulseGlow(CH.glow,.55,.3,1.3,0));
  return finish(g,'chaos',POLE_BOX(-.08,.6),.3,1.64); }
const CH_BOW={name:'Bow of Chaos',tier:5,len:1.0,wood:CH.dark,dark:0x1a0c18,band:CH.metal,glow:CH.glow,tips:'crystal',gem:0xff4060,motes:3,litString:true,recurve:true,
  deco:(g,h)=>{ for(const u of [.14,.24,.34,.66,.76,.86]) h.at(spike(.012,.055,mat(CH.metal),0,0,0,PI/2,0),u,.035);   // thorns out the front of the limbs
    for(const u of [.2,.8]) h.at(noOL(M(G.sph(.016,6,5),lit(CH.glow2))),u,.028);   // magenta blisters
    for(const u of [.3,.7]) h.at(tube(helix(-.04,.04,.034,1.4,u*6,0),.007,mat(CH.flesh),14),u,0); } };   // tendrils wound round the limbs

// ---------------------------------------------------------------- NECROTIC: bone and grave-iron, toxic green
const NE={bone:0xd8c8a0,bone2:0xcdbd98,boneDark:0x5a5040,iron:0x24221c,cloth:0x3a3a2e,rag:0x2e2e24,glow:0x7aff2a,glow2:0xb8ff6a,hole:0x0a0a08};
function necroticSword(){ const g=new THREE.Group(); g.name='sword-necrotic';
  g.add(slab([[.042,.21],[.05,.36],[.051,.6],[.044,.8],[.024,.94],[0,1],[-.012,.94],[-.03,.8],[-.036,.6],[-.04,.4],[-.046,.21]],.03,mat(NE.iron)));   // a grave-iron blade, one edge
  g.add(noOL(slab([[.03,.23],[.038,.36],[.039,.6],[.033,.8],[.017,.93],[0,.985],[.02,.94],[.042,.8],[.049,.6],[.048,.36],[.04,.23]],.034,lit(NE.glow))));   // the edge, glowing green
  faceCracks(g,NE.glow,[.012,-.012],.3,.85,.0155,1.3);
  for(let y=.28;y<.9;y+=.08) g.add(spike(.009,.045,mat(NE.bone),-.04+(y-.28)*.03,y,0,0,PI/2));   // bone spines down its back
  for(const s of [-1,1]){ g.add(tube([[0,.2,0],[s*.06,.205,0],[s*.1,.19,0],[s*.115,.16,0]],.011,mat(NE.bone),12)); g.add(spike(.009,.03,mat(NE.bone),s*.116,.14,0,PI,0)); }   // a bone guard, claws down
  g.add(M(G.sph(.026,8,6),mat(NE.bone),0,.205,0)); for(const s of [-1,1]) g.add(noOL(M(G.sph(.006,5,4),lit(NE.glow),s*.009,.21,.023)));   // a small skull, its eyes lit
  g.add(M(G.cyl(.019,.021,.15,8),mat(NE.cloth),0,.105,0)); for(const y of [.05,.16]) g.add(M(G.cyl(.022,.022,.012,8),mat(NE.bone),0,y,0));
  { const rag=M(G.box(.018,.14,.004),mat(NE.rag),-.035,.13,.02); rag.rotation.z=.3; g.add(rag); }   // a strip of shroud from the guard
  g.add(M(G.sph(.024,8,6),mat(NE.bone),0,.022,0)); for(let i=0;i<3;i++){ const a=i/3*TAU; g.add(spike(.007,.035,mat(NE.bone),Math.sin(a)*.02,.04,Math.cos(a)*.02,Math.cos(a)*.5,-Math.sin(a)*.5)); } g.add(noOL(M(G.sph(.009,5,4),lit(NE.glow),0,.022,.022)));
  g.add(pulseGlow(NE.glow,.16,.035,.6,0));
  return finish(g,'necrotic',SWORD_BOX(),.11,1); }
const NE_K={name:'Staff of Shadow',tier:5,wood:NE.bone2,dark:NE.cloth,band:NE.boneDark,gem:NE.glow2,glow:0x6aff2a,prongs:0,rings:0,motes:3,gemR:.07};
function necroticStaff(){ const g=new THREE.Group(); g.name='staff-necrotic';
  g.add(M(G.cyl(.028,.034,1.14,8),mat(NE.bone2),0,.57,0)); for(let y=.12;y<1.1;y+=.16) g.add(M(G.sph(.036,8,5),mat(NE.bone),0,y,0));   // a spine of a staff, knuckled
  for(const [y,h] of [[.3,.06],[.44,.17],[.9,.07]]) g.add(M(G.cyl(.042,.042,h,8),mat(NE.cloth),0,y,0));   // shroud wrappings
  for(let i=0;i<3;i++){ const a=i/3*TAU; g.add(spike(.011,.07,mat(NE.bone),Math.sin(a)*.02,-.02,Math.cos(a)*.02,PI+Math.cos(a)*.4,-Math.sin(a)*.4)); } g.add(noOL(M(G.sph(.014,6,5),lit(NE.glow),0,.02,0)));
  const head=new THREE.Group(); head.name='staffHead'; head.position.y=1.27; g.add(head);
  { const sk=M(G.sph(.085,12,10),mat(NE.bone),0,.04,.02); sk.scale.set(1,1.05,1.12); head.add(sk); head.add(M(G.box(.095,.036,.07),mat(NE.bone),0,-.045,.045)); head.add(noOL(M(G.box(.085,.014,.012),basic(0xf0e8d0),0,-.026,.08))); }   // the skull, jaw and teeth, turned to face out
  for(const s of [-1,1]){ head.add(noOL(M(G.sph(.021,8,6),basic(NE.hole),s*.032,.05,.085))); head.add(noOL(M(G.sph(.011,6,5),lit(NE.glow),s*.032,.05,.1))); }   // eye sockets, burning green
  { const n=spike(.01,.025,basic(NE.hole),0,.02,.1,PI,0); head.add(noOL(n)); }
  for(const s of [-1,1]){ head.add(tube([[s*.07,.1,0],[s*.13,.17,-.02],[s*.18,.25,-.06],[s*.19,.34,-.1]],.016,mat(NE.boneDark),14)); head.add(spike(.014,.06,mat(NE.boneDark),s*.192,.38,-.115,-.4,-s*.2)); }   // horns, sweeping up and back
  for(const a of DIAG){ const c=Math.cos(a), s=Math.sin(a); head.add(tube([[s*.07,-.11,c*.07],[s*.15,-.02,c*.15],[s*.16,.1,c*.16],[s*.12,.19,c*.12]],.009,mat(NE.bone2),12)); }   // rib-claws cupping it from the sides
  for(const x of [-.03,0,.03]) head.add(noOL(spike(.008,.04,lit(NE.glow),x,-.075,.03,PI,0)));   // ichor dripping from the jaw
  for(const s of [-1,1]){ const rag=M(G.box(.03,.16,.004),mat(NE.rag),s*.06,-.2,.02); rag.rotation.z=s*.25; head.add(rag); }
  const gl=glow(0x6aff2a,1.1,.8); gl.name='glow'; head.add(gl);
  for(let i=0;i<3;i++){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(.02,0),lit(i%2?NE.glow2:NE.glow)); m.name='mote'+i; head.add(noOL(m)); }
  g.userData.kind='necrotic'; g.userData.staff=NE_K;
  return finish(g,'necrotic',new THREE.Box3(V(-.26,-.09,-.26),V(.26,1.5,.26)),.36,1.64); }
function necroticPolearm(){ const g=new THREE.Group(); g.name='polearm-necrotic';   // a bone scythe
  g.add(M(G.cyl(.028,.034,1.3,8),mat(NE.bone2),0,.65,0)); for(let y=.1;y<1.25;y+=.15) g.add(M(G.sph(.034,8,5),mat(NE.bone),0,y,0));
  for(const [y,h] of [[.4,.16],[.75,.06],[1.05,.06]]) g.add(M(G.cyl(.04,.04,h,8),mat(NE.cloth),0,y,0));
  for(const [y,a] of [[.82,.5],[.95,.2],[1.08,.7]]){ const rag=M(G.box(.035,.2,.004),mat(NE.rag),.05,y-.1,.02); rag.rotation.z=a; g.add(rag); }   // tattered shroud hanging off it
  g.add(M(G.cyl(.05,.04,.09,8),mat(NE.boneDark),0,1.3,0)); for(let i=0;i<4;i++){ const a=i/4*TAU; g.add(spike(.01,.07,mat(NE.bone),Math.sin(a)*.035,1.37,Math.cos(a)*.035,Math.cos(a)*.5,-Math.sin(a)*.5)); }
  g.add(slab(crescent(OUTER,INNER),.026,mat(0x2c2a22)));
  g.add(noOL(slab(crescent(EDGE_IN,INNER),.03,lit(NE.glow))));
  for(let i=1;i<4;i++){ const [x,y]=OUTER[i]; g.add(toward(spike(.012,.07,mat(NE.bone),x,y+.015,0),x-.2,y-1.2)); }   // bone horns along the top
  for(let i=0;i<3;i++){ const a=i/3*TAU; g.add(spike(.01,.07,mat(NE.bone),Math.sin(a)*.018,-.03,Math.cos(a)*.018,PI+Math.cos(a)*.35,-Math.sin(a)*.35)); } g.add(noOL(M(G.sph(.013,6,5),lit(NE.glow),0,.0,0)));
  g.add(pulseGlow(NE.glow,.6,.32,1.3,0));
  return finish(g,'necrotic',POLE_BOX(-.08,.6),.3,1.64); }
const NE_BOW={name:'Bow of Shadow',tier:5,len:1.0,wood:NE.bone2,dark:NE.cloth,band:NE.bone,glow:NE.glow,tips:'horn',gem:NE.glow2,motes:3,litString:true,recurve:true,
  deco:(g,h)=>{ for(const u of [.12,.2,.28,.72,.8,.88]) h.at(spike(.01,.05,mat(NE.bone),0,0,0,PI/2,0),u,.03);   // bone spines out the front
    for(const u of [.36,.64]) h.at(M(G.cyl(.034,.034,.05,8),mat(NE.cloth)),u);   // shroud wraps
    g.add(M(G.sph(.034,8,6),mat(NE.bone),0,h.gp.y,h.gp.z+.06)); for(const s of [-1,1]) g.add(noOL(M(G.sph(.007,5,4),lit(NE.glow),s*.012,h.gp.y+.006,h.gp.z+.09)));   // a skull at the grip
    for(const s of [-1,1]){ const rag=M(G.box(.025,.14,.004),mat(NE.rag),s*.03,h.gp.y-.12,h.gp.z); rag.rotation.z=s*.2; g.add(rag); } } };

// ---------------------------------------------------------------- FIRE: obsidian cracked open, lava beneath
const FI={obs:0x1e1614,obs2:0x2c221e,leather:0x5a3824,lava:0xff5a10,lava2:0xff8a20,hot:0xffe0a0};
function fireSword(){ const g=new THREE.Group(); g.name='sword-fire';
  g.add(slab([[.05,.21],[.058,.3],[.052,.4],[.058,.5],[.05,.62],[.053,.72],[.04,.84],[.022,.94],[0,1],[-.02,.94],[-.04,.84],[-.052,.72],[-.05,.6],[-.058,.5],[-.052,.4],[-.058,.3],[-.05,.21]],.03,mat(FI.obs)));   // an obsidian blade, chipped
  g.add(noOL(slab([[.038,.23],[.046,.3],[.041,.4],[.046,.5],[.039,.62],[.041,.72],[.03,.84],[.016,.93],[0,.99],[.022,.94],[.04,.84],[.053,.72],[.05,.62],[.058,.5],[.052,.4],[.058,.3],[.05,.23]],.034,lit(0xff6a14))));   // its edge, molten
  faceCracks(g,FI.lava,[-.03,-.008,.014],.25,.93,.0155,0);
  for(const s of [-1,1]){ g.add(tube([[0,.195,0],[s*.05,.2,0],[s*.09,.23,0],[s*.1,.28,0]],.013,mat(FI.obs2),14)); g.add(noOL(M(G.sph(.011,6,5),lit(FI.lava2),s*.1,.285,0))); }   // horns, their tips aglow
  { const c=new THREE.Mesh(new THREE.OctahedronGeometry(.022,0),lit(0xff7a1a)); c.scale.set(1,1.4,1); c.position.set(0,.2,.02); g.add(noOL(c)); }
  g.add(M(G.cyl(.019,.021,.15,8),mat(FI.leather),0,.105,0)); g.add(tube(helix(.035,.18,.022,2.5,0),.005,mat(FI.obs2),26)); g.add(tube(helix(.035,.18,.022,-2.5,PI),.005,mat(FI.obs2),26));   // leather, bound crosswise
  { const c=new THREE.Mesh(new THREE.OctahedronGeometry(.03,0),lit(FI.lava2)); c.scale.set(1,1.7,1); c.position.y=.005; g.add(noOL(c)); }   // a flame crystal for a pommel
  g.add(pulseGlow(0xff6a14,.16,.02,.5,0)); g.add(pulseGlow(FI.lava2,.14,0,.005,0));   // (a sword's glows stay small: held across the body, a big one read as a lamp at the belt)
  return finish(g,'fire',SWORD_BOX(),.11,1); }
const FI_K={name:'Staff of Fire',tier:5,wood:FI.obs,dark:0x0e0a0a,band:FI.leather,gem:0xffb040,glow:FI.lava,prongs:0,rings:0,motes:4,gemR:.08};
function fireStaff(){ const g=new THREE.Group(); g.name='staff-fire';
  g.add(M(G.cyl(.03,.038,1.14,8),mat(FI.obs),0,.57,0));
  for(let i=0;i<3;i++){ const t=tube(helix(.05,1.1,.036,.7+.3*i,i*2.1,.009),.0045,lit(FI.lava),30); g.add(noOL(t)); }   // lava cracks creeping up the shaft
  g.add(M(G.cyl(.044,.044,.17,8),mat(FI.leather),0,.44,0)); for(const y of [.72,.98]) g.add(M(G.cyl(.046,.046,.035,8),mat(FI.obs2),0,y,0));
  for(let i=0;i<3;i++){ const a=i/3*TAU; g.add(spike(.012,.07,mat(FI.obs2),Math.sin(a)*.02,-.02,Math.cos(a)*.02,PI+Math.cos(a)*.4,-Math.sin(a)*.4)); } g.add(noOL(M(G.sph(.012,6,5),lit(FI.lava),0,.01,0)));
  const head=new THREE.Group(); head.name='staffHead'; head.position.y=1.27; g.add(head);
  { const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.11,0),lit(FI.lava2)); gem.name='gem'; gem.scale.set(1,1.8,1); gem.position.y=.03; head.add(noOL(gem)); }   // the flame crystal (it turns)
  { const core=M(G.sph(.055,8,6),lit(FI.hot),0,.03,0); core.name='core'; head.add(noOL(core)); }   // its white-hot heart (it pulses)
  { const sh=new THREE.Mesh(new THREE.OctahedronGeometry(.14,0),basic(FI.lava,{transparent:true,opacity:.3,depthWrite:false})); sh.scale.set(1,2,1); sh.position.y=.03; head.add(noOL(sh)); }   // a flame about it
  for(const a of DIAG){ const c=Math.cos(a), s=Math.sin(a); head.add(tube([[s*.04,-.15,c*.04],[s*.12,-.05,c*.12],[s*.15,.08,c*.15],[s*.12,.22,c*.12]],.013,mat(FI.obs2),14)); head.add(spike(.012,.07,mat(FI.obs),s*.11,.26,c*.11,-c*.35,s*.35)); head.add(noOL(M(G.sph(.009,5,4),lit(FI.lava2),s*.125,-.05,c*.125))); }   // obsidian claws holding it, cracks glowing
  const gl=glow(FI.lava,1.2,.85); gl.name='glow'; head.add(gl);
  for(let i=0;i<4;i++){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(.02,0),lit(i%2?FI.lava2:0xffc040)); m.name='mote'+i; head.add(noOL(m)); }   // embers
  g.userData.kind='fire'; g.userData.staff=FI_K;
  return finish(g,'fire',new THREE.Box3(V(-.26,-.09,-.26),V(.26,1.5,.26)),.36,1.64); }
function firePolearm(){ const g=new THREE.Group(); g.name='polearm-fire';   // a halberd
  g.add(M(G.cyl(.03,.036,1.3,8),mat(FI.obs),0,.65,0)); for(let i=0;i<3;i++){ const t=tube(helix(.05,1.25,.034,.8+.3*i,i*2.1,.008),.0045,lit(FI.lava),34); g.add(noOL(t)); }
  for(const [y,h] of [[.4,.16],[.9,.06]]) g.add(M(G.cyl(.042,.042,h,8),mat(FI.leather),0,y,0)); g.add(M(G.cyl(.048,.04,.08,8),mat(FI.obs2),0,1.3,0));
  g.add(slab([[0,1.3],[.04,1.42],[.028,1.5],[0,1.62],[-.028,1.5],[-.04,1.42]],.03,mat(FI.obs)));   // the spear point
  g.add(noOL(slab([[0,1.33],[.012,1.42],[.008,1.5],[0,1.58],[-.008,1.5],[-.012,1.42]],.034,lit(FI.lava))));
  g.add(slab([[.02,1.3],[.1,1.27],[.19,1.21],[.25,1.26],[.27,1.36],[.25,1.46],[.19,1.52],[.1,1.47],[.02,1.43]],.026,mat(FI.obs)));   // the axe blade
  g.add(noOL(slab([[.19,1.23],[.245,1.27],[.262,1.36],[.244,1.45],[.19,1.505],[.2,1.52],[.255,1.46],[.275,1.36],[.255,1.255],[.195,1.21]],.03,lit(0xff6a14))));   // its molten edge
  faceCracks(g,FI.lava,[.07,.13],1.3,1.46,.0135,2);
  g.add(spike(.02,.12,mat(FI.obs2),-.07,1.38,0,0,PI/2));   // the back spike
  g.add(spike(.016,.1,mat(FI.obs2),0,-.045,0,PI,0)); g.add(noOL(M(G.sph(.012,6,5),lit(FI.lava),0,0,0)));
  g.add(pulseGlow(0xff6a14,.5,.16,1.38,0));
  return finish(g,'fire',POLE_BOX(-.14,.3),.3,1.64); }
const FI_BOW={name:'Bow of Fire',tier:5,len:1.0,wood:FI.obs,dark:0x0e0a0a,band:FI.leather,glow:FI.lava,tips:'crystal',gem:0xffb040,motes:3,litString:true,
  deco:(g,h)=>{ for(const u of [.1,.18,.26,.34,.66,.74,.82,.9]) h.at(noOL(M(G.box(.006,.05,.006),lit(FI.lava))),u,.022);   // lava cracks down the front of the limbs
    for(const u of [.15,.3,.7,.85]) h.at(spike(.011,.05,mat(FI.obs2),0,0,0,PI/2,0),u,.03);   // obsidian spurs
    for(const u of [.42,.58]) h.at(M(G.cyl(.032,.032,.05,8),mat(FI.leather)),u); } };

// ---------------------------------------------------------------- registration and the item -> weapon choice
// addSet(key,{ids,tail,sword,polearm,staff:[K,build],bow:K}): a set's four weapons under sword-<key>, polearm-<key>,
// staff-<key>, bow-<key>. ids = the hideout's set ids that mean this set (it.setId), tail = its name ending. Build 158: the
// other six forge sets live in their own files (86b-void.js … 86g-wind.js) and call this with the same kit (below).
const SETS={};
function addSet(key,d){ SETS[key]={ids:d.ids,tail:d.tail};
  if(d.sword) window.__weapons.register('sword-'+key,d.sword); if(d.polearm) window.__weapons.register('polearm-'+key,d.polearm);
  if(d.staff) window.__staff.addKind(key,d.staff[0],d.staff[1]); if(d.bow) window.__bow.addKind(key,d.bow); }
addSet('chaos',{ids:['crimson','chaos'],tail:/ of chaos$/i,sword:chaosSword,polearm:chaosPolearm,staff:[CH_K,chaosStaff],bow:CH_BOW});
addSet('necrotic',{ids:['shadow','necrotic'],tail:/ of shadow$/i,sword:necroticSword,polearm:necroticPolearm,staff:[NE_K,necroticStaff],bow:NE_BOW});
addSet('fire',{ids:['lava','fire'],tail:/ of fire$/i,sword:fireSword,polearm:firePolearm,staff:[FI_K,fireStaff],bow:FI_BOW});
function setOf(it){ if(!it) return null; const id=String(it.setId||'').toLowerCase(); for(const k in SETS) if(SETS[k].ids.includes(id)) return k; const n=String(it.name||''); for(const k in SETS) if(SETS[k].tail.test(n)) return k; return null; }
function setModel(it,mount){ const k=setOf(it); if(!k) return null; if(mount==='staff') return 'staff-'+k; if(mount==='bow') return 'bow-'+k;
  return (it.look==='polearm'||/\bpolearm\b/i.test(it.name||'')?'polearm-':'sword-')+k; }   // the Knight: a polearm item stays a polearm, anything else is the set's sword (it.look = the weapon's kind; it.art is the game's picture override)
window.__weapons.setModel=setModel;
// the swords' and polearms' glows breathe (a staff's and a bow's own animators already move theirs)
const PULSES=new WeakMap(); let T=0;
function pulse(root){ let list=PULSES.get(root); if(!list){ list=[]; root.traverse(o=>{ if(o.name==='glowPulse') list.push(o); }); PULSES.set(root,list); } list.forEach((s,i)=>{ s.material.opacity=.38+.2*Math.sin(T*3.3+i*1.7); }); }
const BENCH=[];
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); T+=dt; const wo=window.__weapons.mounted(); if(wo&&wo.userData.setw) pulse(wo); BENCH.forEach(pulse); }; }
// a look at them all (or just `only`, a set key or list of keys): stood in a row on the floor, facing yaw, `gap` apart
function bench(x,z,yaw,gap,only){ clearBench(); gap=gap||1.1; const names=[]; const keys=only?[].concat(only):Object.keys(SETS); for(const k of keys) for(const w of ['sword','staff','polearm','bow']) names.push(w+'-'+k);
  const fx=Math.cos(yaw||0), fz=-Math.sin(yaw||0); names.forEach((n,i)=>{ window.__weapons.model(n,obj=>{ const s=/^sword/.test(n)?1.7:1.5; obj.scale.setScalar(s); const off=(i-(names.length-1)/2)*gap; const px=x+fx*off, pz=z+fz*off; obj.position.set(px,baseFloor(px,pz)+(/^bow/.test(n)?.05:.08)*s,pz); obj.rotation.y=(yaw||0)+(/^bow/.test(n)?PI/2:0); outline(obj); scene.add(obj); BENCH.push(obj); }); }); return names; }   // a bow turned side-on, so its curve shows
function clearBench(){ BENCH.forEach(o=>scene.remove(o)); BENCH.length=0; }
// the kit the other sets' files build with (the same helpers and frames as the three above)
const kit={V,lit,shapeOf,slab,tube,helix,spike,toward,noOL,pulseGlow,faceCracks,crescent,OUTER,INNER,EDGE_IN,finish,SWORD_BOX,POLE_BOX,DIAG,
  g:{mat,basic,glow,M,G,PI,TAU,outline}};   // g: the game's own helpers, for tools/weapon-shot.mjs to hand a set file tried from outside the build
window.__setweapons={sets:()=>Object.keys(SETS),setOf,setModel,bench,clear:clearBench,benched:()=>BENCH.length,addSet,kit};
})();
