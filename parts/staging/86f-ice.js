// ===== THE ICE SET'S WEAPONS (build 158): glacier ice set in white-wrapped silver, after Matt's items/sets/ice-*.jpg.
//   sword-ice    a long ice-crystal blade (a diamond ridge down each face, its edges and ridge lit pale, frost facets
//                chevroned up it), a silver guard whose arms curl toward the tip and drip ice, a blue gem at its heart, a
//                white cross-wrapped grip and a pommel of blue crystals — the ice-sword picture
//   staff-ice    a white quilted shaft wound by a silver vine, silver antlers (at the diagonals) cupping a cluster of tall
//                ice crystals that turns; snowflakes orbit it, ice shards drift round it and a frost wisp spirals up to
//                it (the staff picture's swirl, turned by the animator's halo spin); an ice point for a foot
//   polearm-ice  a trident, as in the polearm picture: a long faceted ice spearhead between two silver crescent horns
//                tipped and barbed with ice, on a white-wrapped shaft with gemmed silver collars and an ice point at the foot
//   bow-ice      no picture yet: 83-bow's recurve in white and silver with ice-crystal tips, ice growing from the limbs, a
//                silver vine, gemmed bands and silver prongs framing the crystal in its belly (the staff's head, small)
(function(){
const {V,lit,shapeOf,slab,tube,helix,spike,toward,noOL,pulseGlow,faceCracks,crescent,OUTER,INNER,EDGE_IN,finish,SWORD_BOX,POLE_BOX,DIAG}=window.__setweapons.kit;
const IC={ice:0x3a8ee0,iceE:0x0a3264,ice2:0x78c0f8,ice2E:0x1e5a98,rim:0xd8f6ff,glow:0x5cc4ff,glow2:0xa8e8ff,gem:0x2a8cff,drop:0x6cc8ff,
  silver:0xa4aec0,silver2:0x5e6a80,white:0xd8e0ea,hatch:0x7a8aa4,wrap:0x5a6e90};
const lin=h=>new THREE.Color(h).convertSRGBToLinear();
const iceMat=(h,e)=>mat(h,{emissive:lin(e)});   // toon ice with a cold light of its own: facets still shade, but it glows
const ICE=()=>iceMat(IC.ice,IC.iceE), ICE2=()=>iceMat(IC.ice2,IC.ice2E);
// faceted solids turned on a lathe: a crystal (n sides, pointed both ends, base at y=0) or a blade with a diamond section
const GEO={};
function lathe(key,prof,sides,kz){ if(!GEO[key]){ let g=new THREE.LatheGeometry(prof.map(p=>new THREE.Vector2(p[0],p[1])),sides); if(kz) g.scale(1,1,kz); g=g.toNonIndexed(); g.computeVertexNormals(); GEO[key]=g; } return GEO[key]; }   // flat normals: every facet its own shade
function crys(r,h,tip,foot,m,sides){ return new THREE.Mesh(lathe('c'+[r,h,tip,foot,sides||6],[[0,-foot],[r,0],[r,h],[0,h+tip]],sides||6),m); }
function lean(o,x,y,z,tilt,a){ o.position.set(x,y,z); o.rotation.order='YXZ'; o.rotation.set(tilt,a,0); return o; }   // tip the +y axis over by tilt, toward the heading a (0 = +z)
function hx(y0,y1,r,turns,ph){ const pts=[], n=Math.max(8,Math.round(Math.abs(turns)*12)); for(let i=0;i<=n;i++){ const f=i/n, a=ph+f*turns*TAU; pts.push([Math.cos(a)*r,y0+(y1-y0)*f,Math.sin(a)*r]); } return pts; }   // (a helix either way round)
function gemAt(g,x,y,z,s){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(s||.014,0),lit(IC.gem)); m.scale.set(1,1.4,.7); m.position.set(x,y,z); g.add(noOL(m)); return m; }
function flake(r,m){ const pts=[]; for(let i=0;i<12;i++){ const a=i/12*TAU, rr=i%2?r*.28:r; pts.push([Math.sin(a)*rr,Math.cos(a)*rr]); } return slab(pts,.006,m); }   // a six-armed snowflake

function iceSword(){ const g=new THREE.Group(); g.name='sword-ice';
  const BL=[[.05,.2],[.054,.3],[.051,.48],[.044,.66],[.031,.83],[.014,.94],[0,1]], KZ=.28, wAt=y=>{ for(let i=1;i<BL.length;i++) if(y<=BL[i][1]){ const [w0,y0]=BL[i-1],[w1,y1]=BL[i]; return w0+(w1-w0)*(y-y0)/(y1-y0); } return 0; };
  g.add(new THREE.Mesh(lathe('iceblade',BL,4,KZ),iceMat(0x56a4ec,0x10407a)));   // the ice blade: a ridge down each face, so its facets catch the light
  { const out=BL.map(([w,y])=>[w+.0025,y+(y>.99?.006:0)]); const pts=out.concat(out.slice(0,-1).reverse().map(([w,y])=>[-w,y])); g.add(noOL(slab(pts,.0045,lit(IC.rim)))); }   // its edges, rimed pale
  for(const s of [1,-1]){ g.add(noOL(tube(BL.map(([w,y])=>[0,y,s*(KZ*w+.002)]),.0035,lit(IC.rim),24)));   // the ridge lit down both faces
    for(const y of [.3,.47,.64]){ const e=.8, dy=.06; const pt=(x,yy)=>[x,yy,s*(KZ*(wAt(yy)-Math.abs(x))+.0015)]; g.add(noOL(tube([pt(-wAt(y)*e,y),pt(0,y+dy),pt(wAt(y)*e,y)],.0025,lit(IC.glow2),6))); } }   // frost facets, chevroned up the faces
  g.add(slab([[-.036,.2],[.036,.2],[.012,.24],[0,.29],[-.012,.24]],.036,mat(IC.silver)));   // a silver langet up the blade's root
  gemAt(g,0,.225,.02,.013); gemAt(g,0,.225,-.02,.013);   // the blue gem at its heart
  for(const s of [-1,1]){ g.add(tube([[s*.01,.2,0],[s*.05,.212,0],[s*.088,.205,0],[s*.112,.22,0],[s*.122,.248,0]],.011,mat(IC.silver),14));   // the guard's arms, curling toward the tip
    { const d=crys(.009,.02,.02,.006,lit(IC.drop)); d.position.set(s*.122,.258,0); g.add(noOL(d)); }   // each ending in a drop of ice
    g.add(spike(.007,.03,mat(IC.silver2),s*.06,.19,0,PI,0)); }   // small silver barbs beneath
  g.add(M(G.cyl(.018,.021,.14,8),mat(IC.white),0,.115,0)); g.add(tube(hx(.05,.18,.021,2.5,0),.004,mat(IC.hatch),30)); g.add(tube(hx(.05,.18,.021,-2.5,PI),.004,mat(IC.hatch),30));   // white wrap, bound crosswise
  g.add(M(G.cyl(.024,.019,.022,8),mat(IC.silver),0,.042,0));
  { const c=crys(.014,.022,.03,.008,lit(IC.drop)); c.rotation.x=PI; c.position.y=.034; g.add(noOL(c)); }   // a pommel of ice crystals
  for(const s of [-1,1]){ const c=crys(.009,.012,.022,.005,lit(IC.gem)); lean(c,s*.012,.035,0,PI-.6,s*PI/2); g.add(noOL(c)); }
  g.add(pulseGlow(IC.glow,.15,0,.6,0));
  return finish(g,'ice',SWORD_BOX(),.11,1); }

const IC_K={name:'Staff of Ice',tier:5,wood:IC.white,dark:IC.wrap,band:IC.silver,gem:0xc8f0ff,glow:IC.glow,prongs:0,rings:0,motes:4,gemR:.07};
function iceStaff(){ const g=new THREE.Group(); g.name='staff-ice';
  g.add(M(G.cyl(.028,.034,1.14,8),mat(IC.white),0,.57,0));
  g.add(tube(hx(.06,1.08,.033,6,0),.0035,mat(IC.hatch),72)); g.add(tube(hx(.06,1.08,.033,-6,PI),.0035,mat(IC.hatch),72));   // quilted white wrap
  g.add(tube(hx(.6,1.1,.042,2.2,1),.007,mat(IC.silver),40));   // a silver vine winding up to the head
  for(let i=0;i<3;i++){ const f=(i+.5)/3, a=1+f*2.2*TAU, y=.6+.5*f; g.add(spike(.007,.03,mat(IC.silver2),Math.cos(a)*.05,y,Math.sin(a)*.05,Math.sin(a)*1.1,-Math.cos(a)*1.1)); }   // its thorns
  g.add(M(G.cyl(.044,.044,.17,8),mat(IC.wrap),0,.44,0)); for(const y of [.35,.53]) g.add(M(G.cyl(.048,.048,.02,8),mat(IC.silver),0,y,0)); gemAt(g,0,.53,.05,.013);
  g.add(M(G.cyl(.036,.03,.07,8),mat(IC.silver),0,.04,0));
  { const c=crys(.02,.02,.06,.01,lit(IC.drop)); c.rotation.x=PI; c.position.y=.01; g.add(noOL(c)); }   // an ice point for a foot
  for(let i=0;i<3;i++){ const a=i/3*TAU; g.add(spike(.01,.05,mat(IC.silver),Math.sin(a)*.03,.0,Math.cos(a)*.03,PI+Math.cos(a)*.5,-Math.sin(a)*.5)); }
  g.add(M(G.cyl(.056,.032,.1,8),mat(IC.silver),0,1.1,0)); g.add(M(G.cyl(.062,.062,.016,8),mat(IC.silver2),0,1.15,0)); gemAt(g,0,1.1,.05,.017);   // the socket, a gem in its front
  const head=new THREE.Group(); head.name='staffHead'; head.position.y=1.27; g.add(head);
  const gem=new THREE.Group(); gem.name='gem'; head.add(gem);   // the crystal cluster (it turns)
  gem.add(lean(crys(.05,.24,.1,.03,ICE2()),0,-.1,0,0,0));   // a tall one in the middle
  for(let i=0;i<5;i++){ const a=i/5*TAU+.3; gem.add(lean(crys(.03+.006*(i%2),.1+.04*(i%3),.055,.02,ICE()),Math.sin(a)*.04,-.1,Math.cos(a)*.04,.48+.14*(i%2),a)); }   // smaller crystals fanned out round it
  { const core=M(G.sph(.046,8,6),lit(0xe8faff),0,-.09,0); core.name='core'; head.add(noOL(core)); }   // its cold heart (it pulses)
  for(const a of DIAG){ const c=Math.cos(a), s=Math.sin(a), P=(r,y)=>[s*r,y,c*r];   // silver antlers holding it, open at the front
    head.add(tube([P(.035,-.2),P(.1,-.14),P(.145,-.03),P(.15,.09),P(.17,.2),P(.22,.26)],.014,mat(IC.silver),16));
    head.add(spike(.01,.075,mat(IC.silver),s*.16,.05,c*.16,c*.75,-s*.75)); }   // a tine off each
  const gl=glow(IC.glow,1.0,.75); gl.name='glow'; gl.position.y=.03; head.add(gl);
  for(let i=0;i<4;i++){ const m=i%2?new THREE.Mesh(new THREE.OctahedronGeometry(.018,0),lit(IC.glow2)):flake(.032,lit(0xeefaff)); m.name='mote'+i; head.add(noOL(m)); }   // snowflakes and sparks
  for(let i=0;i<3;i++){ const s=crys(.013,.025,.025,.012,ICE()); s.name='shard'+i; head.add(s); }   // ice shards adrift about it
  { const sw=new THREE.Group(); sw.name='halo'; sw.rotation.x=-PI/2; head.add(sw);   // a frost wisp spiralling up to the head
    for(const ph of [0,PI]){ const pts=[]; for(let i=0;i<=36;i++){ const f=i/36, a=ph+f*1.7*TAU, r=.06+.17*f*f; pts.push([Math.cos(a)*r,Math.sin(a)*r,-.6+.78*f]); }
      sw.add(noOL(tube(pts,.007,basic(0x6ccaff,{transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}),54))); } }
  g.userData.kind='ice'; g.userData.staff=IC_K;
  return finish(g,'ice',new THREE.Box3(V(-.26,-.09,-.26),V(.26,1.5,.26)),.36,1.64); }

function icePolearm(){ const g=new THREE.Group(); g.name='polearm-ice';   // a trident
  g.add(M(G.cyl(.028,.034,1.3,8),mat(IC.white),0,.65,0));
  g.add(tube(hx(.06,1.24,.033,7,0),.0035,mat(IC.hatch),84)); g.add(tube(hx(.06,1.24,.033,-7,PI),.0035,mat(IC.hatch),84));
  g.add(M(G.cyl(.042,.042,.16,8),mat(IC.wrap),0,.4,0));
  for(const y of [.32,.48,.86]) g.add(M(G.cyl(.046,.046,.022,8),mat(IC.silver),0,y,0)); gemAt(g,0,.86,.046,.012); gemAt(g,0,.86,-.046,.012);   // gemmed silver collars
  g.add(M(G.cyl(.05,.036,.1,8),mat(IC.silver),0,1.27,0)); gemAt(g,0,1.27,.046,.016); gemAt(g,0,1.27,-.046,.016);
  g.add(new THREE.Mesh(lathe('icespear',[[.024,1.29],[.062,1.38],[.07,1.45],[.05,1.54],[.02,1.6],[0,1.64]],4,.36),ICE2()));   // the ice spearhead, faceted
  for(const s of [1,-1]) g.add(noOL(tube([[0,1.3,s*.01],[0,1.38,s*.024],[0,1.45,s*.026],[0,1.54,s*.019],[0,1.6,s*.008],[0,1.635,0]],.003,lit(IC.rim),12)));   // its ridges lit
  for(const s of [-1,1]){ const sx=p=>p.map(([x,y])=>[s*x,y]);
    g.add(slab(sx(crescent([[.03,1.26],[.11,1.27],[.18,1.32],[.215,1.41],[.215,1.53]],[[.03,1.305],[.1,1.31],[.15,1.35],[.18,1.42],[.215,1.53]])),.022,mat(IC.silver)));   // silver crescent horns
    g.add(noOL(lean(crys(.018,.05,.05,.02,lit(IC.drop),4),s*.215,1.52,0,.12,s*PI/2)));   // tipped with ice
    g.add(lean(crys(.022,.065,.06,.015,ICE(),4),s*.185,1.33,0,.95,s*PI/2)); }   // and an ice barb out each side
  g.add(M(G.cyl(.03,.026,.06,8),mat(IC.silver),0,.03,0));
  { const c=crys(.02,.02,.07,.01,lit(IC.drop)); c.rotation.x=PI; c.position.y=.0; g.add(noOL(c)); }   // an ice point at the foot
  for(let i=0;i<3;i++){ const a=i/3*TAU; g.add(spike(.009,.05,mat(IC.silver),Math.sin(a)*.028,-.01,Math.cos(a)*.028,PI+Math.cos(a)*.45,-Math.sin(a)*.45)); }
  g.add(pulseGlow(IC.glow,.5,0,1.44,0));
  return finish(g,'ice',POLE_BOX(-.24,.24),.3,1.64); }

const IC_BOW={name:'Bow of Ice',tier:5,len:1.0,wood:IC.white,dark:IC.wrap,band:IC.silver,glow:IC.glow,tips:'crystal',gem:0xb8ecff,motes:3,litString:true,recurve:true,
  deco:(g,h)=>{ for(const [u,r,l] of [[.12,.016,.07],[.19,.024,.11],[.26,.015,.06],[.74,.015,.06],[.81,.024,.11],[.88,.016,.07]]){ const up=u>.5?1:-1; const c=crys(r,l*.5,l*.6,.01,ICE(),5); c.rotation.x=PI/2-up*.55; h.at(c,u,.02); }   // ice growing out the front of the limbs
    for(const u of [.32,.68]) h.at(tube(hx(-.05,.05,.032,1.4,u*6),.006,mat(IC.silver),16),u,0);   // a silver vine round each
    for(const u of [.4,.6]){ h.at(M(G.cyl(.033,.033,.022,8),mat(IC.silver)),u); const gm=new THREE.Mesh(new THREE.OctahedronGeometry(.012,0),lit(IC.gem)); gm.scale.set(1,1.4,.7); h.at(noOL(gm),u,.034); }   // gemmed silver bands
    for(const s of [-1,1]) g.add(tube([[s*.02,h.gp.y-.08,h.gp.z+.03],[s*.05,h.gp.y-.03,h.gp.z+.07],[s*.05,h.gp.y+.04,h.gp.z+.08],[s*.03,h.gp.y+.1,h.gp.z+.07]],.007,mat(IC.silver),12));   // silver prongs framing the belly crystal
    for(const u of [.06,.94]){ const t=spike(.008,.045,mat(IC.silver),0,0,0,PI/2-(u>.5?1:-1)*.8,0); h.at(t,u,.02); }   // silver tines by the tips
    for(const u of [0,1]) for(const s of [-1,1]){ const c=crys(.014,.03,.04,.008,lit(IC.drop),5); lean(c,0,0,0,(u?0:PI)+s*.6,PI/2); h.at(noOL(c),u,0); } } };   // and small crystals fanned out sideways at each tip, clear of the string (the staff's cluster, small)

window.__setweapons.addSet('ice',{ids:['ice'],tail:/ of ice$/i,sword:iceSword,polearm:icePolearm,staff:[IC_K,iceStaff],bow:IC_BOW});
})();
