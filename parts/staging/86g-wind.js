// ===== THE WIND SET'S WEAPONS (build 158): bright silver, white feathers and ribbon, a see-through aqua gust wound round
// each one (Matt's items/sets/wind-*.jpg; the armour's white-and-teal sashes and the amulet's glowing feather give the
// colours; the gusts are broad translucent bands, as the art's swirls of air are — thin tubes read as wire):
//   sword-wind    wind-sword.jpg: a slender silver blade with an aqua fuller, a gust spiralling up it, a guard of swept
//                 feathered wings round a swirl gem, a white grip bound in silver wire, a swirl-gem pommel trailing a ribbon
//   staff-wind    wind-staff.jpg: a silver shaft twisted with wire and a white ribbon, a diamond gem under the head, silver
//                 scrolls cupping a sky-blue wind orb from the diagonals and a pair of white feathered wings rising at its
//                 sides (the front stays open), two gusts turning round it (ring0/ring1: 82-staff.js spins them),
//                 feathers for motes, a spear foot with a gem in it
//   polearm-wind  wind-polearm.jpg: a spear — a long silver point with an aqua ridge, on a pinwheel of curved feathered
//                 vanes (pitched like a windmill's, aqua at the roots) round a vortex gem; bead-and-feather tassels off
//                 the collar, a gust climbing the shaft, a gem-set spear butt
//   bow-wind      (no art yet) a silver recurve with a white feathered wing on the front of each limb, built like the
//                 staff's wings and kept ahead of the string, an aqua strip glowing under each; white wraps bound in
//                 silver wire, a gust wound round the grip, aqua crystal tips and a burning string
(function(){
const {V,lit,shapeOf,slab,tube,helix,spike,toward,noOL,pulseGlow,faceCracks,crescent,OUTER,INNER,EDGE_IN,finish,SWORD_BOX,POLE_BOX,DIAG}=window.__setweapons.kit;

// ---------------------------------------------------------------- WIND: silver and white, feathers, a pale aqua gust
const WI={silver:0xd6dde4,silver2:0xaab6c2,steel:0x5e6e80,white:0xf4f4f0,cloth:0xe2e8e6,sash:0x78c4bc,feather:0xeef3f6,glow:0x5fe4f0,glow2:0xd4fffa,gem:0x8ae8ff,orb:0x5cc4f0,wind:0x9cf0ff};
const gust=op=>basic(WI.wind,{transparent:true,opacity:op||.5,depthWrite:false});   // a see-through band of moving air
// a feather from its quill (at the origin) up +y, len long, w half-wide, flat on z
function feather(len,w,m,d){ return slab([[0,0],[w*.55,len*.12],[w,len*.4],[w*.85,len*.68],[w*.4,len*.9],[0,len],[-w*.3,len*.82],[-w*.6,len*.5],[-w*.5,len*.2],[-w*.25,len*.05]],d||.01,m); }
// a flat ribbon along a line of [x,y] points (flat on z), hw its half-width (a number, or a function of 0..1 along it)
function ribbon(pts,hw,m,d){ const L=[],R=[], n=pts.length; for(let i=0;i<n;i++){ const a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)]; let tx=b[0]-a[0], ty=b[1]-a[1]; const l=Math.hypot(tx,ty)||1; tx/=l; ty/=l; const w=typeof hw==='function'?hw(i/(n-1)):hw; L.push([pts[i][0]-ty*w,pts[i][1]+tx*w]); R.push([pts[i][0]+ty*w,pts[i][1]-tx*w]); } return slab(L.concat(R.reverse()),d||.004,m); }
// a gust: a broad see-through band spiralling round the y axis (y0..y1, radius r0..r1, turns from phase ph), w tall,
// thinning to nothing at both ends — the art's swirls of air, where a tube read as wire
function band(y0,y1,r0,r1,turns,ph,w,op){ const n=Math.max(12,Math.round(turns*26)), pos=[], idx=[];
  for(let i=0;i<=n;i++){ const f=i/n, a=ph+f*turns*TAU, r=r0+(r1-r0)*f, y=y0+(y1-y0)*f, h=w*Math.pow(Math.sin(PI*f),.6)/2; pos.push(Math.cos(a)*r,y-h,Math.sin(a)*r, Math.cos(a)*r,y+h,Math.sin(a)*r); if(i<n){ const k=i*2; idx.push(k,k+1,k+2, k+1,k+3,k+2); } }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setIndex(idx);
  return noOL(new THREE.Mesh(geo,basic(WI.wind,{transparent:true,opacity:op||.45,depthWrite:false,side:THREE.DoubleSide}))); }
// a wing on a bow limb, like the staff's: rooted on the front of the stave at u (+z, away from the string), n+1 feathers
// fanning from straight out (the short ones) round to straight up the limb (the long ones, which stay ahead of the
// string where the recurve's tip swings back across it), built flat in the stave's own (z,y) plane, with an aqua strip
// glowing along the limb under it (sg: +1 for the upper limb, -1 the lower)
function bowWing(h,u,sg,n,m){ const w=new THREE.Group(); w.rotation.y=-PI/2;   // (local x = the bow's z)
  const p=h.P(u), a=h.P(u-sg*.01), b=h.P(u+sg*.01); let ty=b.y-a.y, tz=b.z-a.z; const l=Math.hypot(ty,tz)||1; ty/=l; tz/=l;
  const ny=ty>=0?-tz:tz, nz=ty>=0?ty:-ty, bz=p.z-h.gp.z, by=p.y-h.gp.y;
  for(let k=0;k<=n;k++){ const f=k/n, phi=.2+1.25*f, dz=Math.cos(phi), dy=sg*Math.sin(phi), rz=bz+nz*.015+.045*f, ry=by+ny*.015+sg*.07*f;
    const fe=feather(.1+.17*f,.028+.012*f,m,.012); fe.position.set(rz,ry,-.002*k); fe.rotation.z=-Math.atan2(dz,dy); w.add(fe); }
  const st=[]; for(let i=0;i<=4;i++){ const q=h.P(u-sg*(.16-.06*i)); st.push([q.z-h.gp.z,q.y-h.gp.y]); } const rim=st.map(([z,y])=>[z+nz*.034,y+ny*.034]).reverse();
  w.add(noOL(slab(st.map(([z,y])=>[z+nz*.018,y+ny*.018]).concat(rim),.02,lit(WI.glow))));   // the wind glowing along the limb, like the amulet's feather
  return w; }
function swirlGem(r,x,y,z,col){ const s=M(G.sph(r,10,8),lit(col||WI.glow),x,y,z); s.scale.z=.5; return noOL(s); }

function windSword(){ const g=new THREE.Group(); g.name='sword-wind';
  g.add(slab([[.036,.21],[.038,.32],[.036,.6],[.031,.8],[.022,.9],[.01,.96],[0,1],[-.01,.96],[-.022,.9],[-.031,.8],[-.036,.6],[-.038,.32],[-.036,.21]],.026,mat(WI.silver)));   // a slender silver blade
  g.add(noOL(slab([[.009,.23],[.011,.5],[.008,.8],[.004,.9],[0,.94],[-.004,.9],[-.008,.8],[-.011,.5],[-.009,.23]],.031,lit(WI.glow))));   // the aqua fuller
  g.add(band(.23,.94,.058,.066,2.2,0,.034,.42)); g.add(noOL(tube(helix(.3,.86,.054,1.8,PI,.004),.005,gust(.7),36)));   // the gust spiralling up the blade, and a streak in it
  for(const [x,y,a] of [[.075,.43,.5],[-.07,.66,-.6]]){ const l=new THREE.Mesh(new THREE.OctahedronGeometry(.012,0),lit(WI.glow2)); l.scale.set(.5,1.5,.3); l.position.set(x,y,0); l.rotation.z=a; g.add(noOL(l)); }   // leaves the wind carries
  for(const s of [-1,1]){ g.add(slab([[.02,.186],[.02,.216],[.06,.226],[.1,.226],[.135,.216],[.162,.197],[.176,.172],[.148,.182],[.15,.162],[.122,.18],[.12,.162],[.092,.182],[.088,.168],[.056,.184]].map(([x,y])=>[s*x,y]),.02,mat(WI.silver)));   // swept feathered wings for a guard, tips drooping
    g.add(tube([[s*.02,.214,0],[s*.07,.223,0],[s*.12,.217,0],[s*.158,.198,0],[s*.172,.176,0]],.005,mat(WI.steel),12)); }   // their leading edge
  { const d=M(G.cyl(.03,.03,.032,12),mat(WI.silver2),0,.203,0); d.rotation.x=PI/2; g.add(d); } for(const z of [.017,-.017]) g.add(swirlGem(.019,0,.203,z));   // the swirl gem in the guard
  g.add(slab([[-.017,.22],[.017,.22],[0,.275]],.034,mat(WI.silver2)));   // its langet
  g.add(M(G.cyl(.018,.02,.14,8),mat(WI.white),0,.11,0)); g.add(tube(helix(.042,.178,.021,3,0),.004,mat(WI.silver2),30));   // white wrap, bound with silver wire
  g.add(M(G.cyl(.024,.02,.016,8),mat(WI.silver2),0,.184,0));
  { const r=new THREE.Mesh(new THREE.TorusGeometry(.021,.006,6,14),mat(WI.silver)); r.position.y=.02; g.add(r); } g.add(swirlGem(.016,0,.02,0));   // a swirl-gem pommel
  g.add(spike(.01,.035,mat(WI.silver),0,-.014,0,PI,0));   // its finial
  g.add(ribbon([[.014,.028],[.04,.02],[.066,.0],[.08,-.03],[.1,-.05],[.13,-.056]],f=>.013-.004*f,mat(WI.white)));   // a white ribbon off the pommel, blowing out
  g.add(pulseGlow(WI.glow,.15,0,.55,0));
  return finish(g,'wind',SWORD_BOX(),.11,1); }

const WI_K={name:'Staff of the Wind',tier:5,wood:WI.silver2,dark:WI.cloth,band:WI.silver,gem:WI.gem,glow:WI.glow,prongs:0,rings:0,motes:4,gemR:.07};
function windStaff(){ const g=new THREE.Group(); g.name='staff-wind';
  g.add(M(G.cyl(.028,.034,1.14,8),mat(WI.silver2),0,.57,0));
  g.add(tube(helix(.06,1.1,.033,4,0,0),.006,mat(WI.silver),60)); g.add(tube(helix(.06,1.1,.033,4,PI,0),.005,mat(WI.steel),60));   // silver wire twisted up the shaft
  g.add(tube(helix(.6,1.02,.038,1.3,1,0),.01,mat(WI.white),30));   // a white ribbon wound round it
  g.add(M(G.cyl(.042,.042,.17,8),mat(WI.sash),0,.44,0)); for(const y of [.35,.53]) g.add(M(G.cyl(.045,.045,.014,8),mat(WI.silver),0,y,0));
  g.add(M(G.cyl(.05,.034,.08,8),mat(WI.silver),0,1.11,0)); g.add(M(G.cyl(.054,.054,.014,10),mat(WI.steel),0,1.15,0));   // the socket
  g.add(slab([[0,.97],[.032,1.03],[0,1.09],[-.032,1.03]],.07,mat(WI.silver))); for(const z of [.036,-.036]){ const d=new THREE.Mesh(new THREE.OctahedronGeometry(.022,0),lit(WI.gem)); d.scale.set(1,1.5,.45); d.position.set(0,1.03,z); g.add(noOL(d)); }   // a diamond gem set under the head
  g.add(ribbon([[.03,1.0],[.08,.95],[.1,.87],[.085,.79],[.11,.71],[.14,.66]],f=>.012-.004*f,mat(WI.white)));   // its end streaming free
  g.add(M(G.cyl(.036,.03,.06,8),mat(WI.silver),0,.03,0)); g.add(spike(.024,.1,mat(WI.silver),0,-.04,0,PI,0));   // a spear foot
  for(const s of [-1,1]) g.add(spike(.01,.045,mat(WI.silver),s*.03,.0,0,0,PI-s*.5));
  { const d=new THREE.Mesh(new THREE.OctahedronGeometry(.014,0),lit(WI.gem)); d.scale.set(1,1.5,.45); d.position.set(0,.035,.035); g.add(noOL(d)); }
  const head=new THREE.Group(); head.name='staffHead'; head.position.y=1.27; g.add(head);
  { const gem=new THREE.Group(); gem.name='gem'; gem.position.y=.04; head.add(gem);   // the wind orb (it turns, so its swirls go round)
    gem.add(noOL(M(G.sph(.1,14,10),basic(WI.orb,{transparent:true,opacity:.82,depthWrite:false}))));
    for(const [r,t,x] of [[.104,.011,.35],[.078,.009,-.7]]){ const a=new THREE.Mesh(new THREE.TorusGeometry(r,t,5,18,PI*1.3),lit(0xe8ffff)); a.rotation.set(PI/2+x,0,x*2); gem.add(noOL(a)); } }   // white swirls wound round it
  { const core=M(G.sph(.04,8,6),lit(0xffffff),0,.04,0); core.name='core'; head.add(noOL(core)); }   // its bright heart (it pulses)
  for(let i=0;i<2;i++){ const r=new THREE.Group(); r.name='ring'+i; r.rotation.x=PI/2+(i?-.5:.45); r.position.y=.03; head.add(r); const b=band(-.012,.012,.16+i*.045,.16+i*.045,.62,i*2,.032,.5); b.rotation.x=PI/2; r.add(b); }   // two gusts turning round it (82-staff.js spins ring0/ring1)
  for(const a of DIAG){ const c=Math.cos(a), s=Math.sin(a); head.add(tube([[s*.03,-.17,c*.03],[s*.085,-.13,c*.085],[s*.125,-.075,c*.125],[s*.14,-.02,c*.14],[s*.127,.018,c*.127],[s*.103,.014,c*.103],[s*.1,-.01,c*.1],[s*.117,-.008,c*.117]],.009,mat(WI.silver),18)); }   // silver scrolls cupping the orb from below and beside it, curled at the tips
  for(const sd of [-1,1]){ const w=new THREE.Group(); w.position.set(sd*.07,-.1,0); w.rotation.y=sd*.3; head.add(w);   // a feathered wing each side, swept up and back (the front stays open)
    w.add(tube([[0,0,0],[sd*.07,.03,0],[sd*.125,.1,0],[sd*.155,.165,0]],.012,mat(WI.silver),10));
    for(let i=0;i<5;i++){ const t=i/4, px=sd*(.155*t+.017*Math.sin(t*PI)), py=.165*t, len=.11+.17*t, ang=1.35-1.05*t; const f=feather(len,.026+.009*t,mat(WI.feather)); f.position.set(px,py,-.005*i); f.rotation.z=-sd*ang; w.add(f); } }
  const gl=glow(WI.glow,1.0,.75); gl.name='glow'; gl.position.y=.04; head.add(gl);
  for(let i=0;i<4;i++){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(.024,0),lit(i%2?WI.glow2:0xffffff)); m.scale.set(.45,1.5,.2); m.name='mote'+i; head.add(noOL(m)); }   // feathers blown round it
  g.userData.kind='wind'; g.userData.staff=WI_K;
  return finish(g,'wind',new THREE.Box3(V(-.26,-.09,-.26),V(.26,1.5,.26)),.36,1.64); }

function windPolearm(){ const g=new THREE.Group(); g.name='polearm-wind';   // a spear
  g.add(M(G.cyl(.028,.034,1.22,8),mat(WI.cloth),0,.61,0)); g.add(tube(helix(.05,1.17,.032,5.5,0,0),.005,mat(WI.silver2),76));   // a white-wrapped shaft, silver wire round it
  g.add(M(G.cyl(.04,.04,.16,8),mat(WI.sash),0,.4,0)); for(const y of [.1,.49,.94]) g.add(M(G.cyl(.038,.038,.022,8),mat(WI.silver),0,y,0));
  g.add(band(.6,1.18,.06,.16,1.6,0,.06,.42)); g.add(noOL(tube(helix(.74,1.12,.075,1.1,2.4,.004),.005,gust(.7),26)));   // a gust climbing to the head, and a streak in it
  g.add(M(G.cyl(.046,.034,.08,8),mat(WI.silver),0,1.2,0));
  { const v=new THREE.Group(); v.position.y=1.27; g.add(v);   // the pinwheel: curved feathered vanes round a vortex gem, pitched like a windmill's (the top left clear for the point)
    for(let i=0;i<5;i++){ const p=new THREE.Group(); p.rotation.z=(100+i*72)*PI/180; v.add(p); const b=slab([[.03,.022],[.07,.044],[.11,.054],[.15,.046],[.178,.026],[.15,.018],[.155,.004],[.122,.01],[.126,-.004],[.094,.0],[.062,-.01],[.034,-.018]],.016,mat(WI.silver)); b.rotation.x=.55; b.scale.set(.9,.9,1); p.add(b);
      b.add(noOL(slab([[.03,.022],[.07,.044],[.1,.05],[.1,.004],[.062,-.01],[.034,-.018]],.021,lit(WI.glow)))); }   // aqua at the roots: the vortex blowing out along each vane
    { const d=M(G.cyl(.046,.046,.03,12),mat(WI.silver2)); d.rotation.x=PI/2; v.add(d); } for(const z of [.017,-.017]) v.add(swirlGem(.03,0,0,z,WI.gem));
    { const sp=[]; for(let i=0;i<=16;i++){ const f=i/16, a=f*1.6*TAU; sp.push([Math.cos(a)*(.028-.022*f),Math.sin(a)*(.028-.022*f),.022]); } v.add(noOL(tube(sp,.003,lit(0xffffff),24))); } }   // the vortex in it
  g.add(slab([[0,1.28],[.046,1.33],[.052,1.38],[.036,1.47],[0,1.625],[-.036,1.47],[-.052,1.38],[-.046,1.33]],.026,mat(WI.silver)));   // the long point
  g.add(noOL(slab([[0,1.31],[.011,1.39],[0,1.595],[-.011,1.39]],.03,lit(WI.glow))));   // its aqua ridge
  for(const s of [-1,1]){ g.add(noOL(M(G.box(.004,.06,.004),mat(WI.steel),s*.05,1.155,0))); g.add(noOL(M(G.sph(.012,6,5),lit(WI.gem),s*.05,1.12,0)));   // bead-and-feather tassels off the collar
    { const f=feather(.12,.024,mat(WI.feather)); f.position.set(s*.05,1.11,0); f.rotation.z=PI+s*.15; g.add(f); } }
  g.add(slab([[0,-.08],[.02,-.02],[.026,.03],[.017,.07],[0,.09],[-.017,.07],[-.026,.03],[-.02,-.02]],.03,mat(WI.silver)));   // the spear butt
  for(const z of [.017,-.017]){ const d=new THREE.Mesh(new THREE.OctahedronGeometry(.015,0),lit(WI.gem)); d.scale.set(1,1.6,.4); d.position.set(0,.03,z); g.add(noOL(d)); }
  g.add(pulseGlow(WI.glow,.42,0,1.27,.02));
  return finish(g,'wind',POLE_BOX(-.22,.22),.3,1.64); }

const WI_BOW={name:'Bow of the Wind',tier:5,len:1.0,wood:WI.silver2,dark:WI.cloth,band:WI.steel,glow:WI.glow,tips:'crystal',gem:WI.gem,motes:3,litString:true,recurve:true,
  deco:(g,h)=>{ const fm=mat(WI.feather);
    h.limbU.add(bowWing(h,.72,1,5,fm)); h.limbL.add(bowWing(h,.28,-1,5,fm));   // a feathered wing out the front of each limb (on the limb, so it bends with the draw)
    for(const u of [.395,.605]){ h.at(M(G.cyl(.032,.032,.05,8),mat(WI.white)),u); h.at(tube(helix(-.03,.03,.034,1.2,u*6,0),.005,mat(WI.silver2),12),u,0); }   // white wraps bound with silver wire
    { const b=band(-.07,.07,.085,.085,1.4,0,.026,.45); b.position.set(0,h.gp.y,h.gp.z); g.add(b); } } };   // a gust wound round the grip

window.__setweapons.addSet('wind',{ids:['wind'],tail:/ of the wind$/i,sword:windSword,polearm:windPolearm,staff:[WI_K,windStaff],bow:WI_BOW});
})();
