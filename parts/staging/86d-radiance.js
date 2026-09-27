// ===== THE RADIANCE SET'S WEAPONS (build 158): pearl-white and gold, a glowing golden star, angel wings — after Matt's
// "angelic" thumbnails (items/sets/angelic-*.jpg). The sword is the art's white longsword: a gold line of light down the
// blade, gold filigree at its root, a winged gold guard with a star at its heart, a ringed star pommel. The staff is the
// art's winged sun: a glowing cross before a sun disc (its rays turn), two white wings cupping it from the sides (so the
// front stays open), a white shaft wound with gold. The polearm is the art's winged spear: a long white crystal point with a
// gold midrib, wings spread at its base, a thin gold halo behind, a crystal foot. The bow (no art yet) matches them: white
// limbs with feathers fanned out the front like a pair of wings, a gold star about the crystal in its belly, a burning string.
(function(){
const {V,lit,shapeOf,slab,tube,helix,spike,toward,noOL,pulseGlow,faceCracks,crescent,OUTER,INNER,EDGE_IN,finish,SWORD_BOX,POLE_BOX,DIAG}=window.__setweapons.kit;

// ---------------------------------------------------------------- RADIANCE: pearl and gold, a sun behind a star
const RA={pearl:0xfff5e0,pearl2:0xe6dbc2,gold:0xe0b040,gold2:0xb8862a,glow:0xffc840,glow2:0xfff0a8,hot:0xfff8e0,sun:0xffb830,amber:0xffb428,crystal:0xf4f2fa};
const star4=(r,k,cx,cy)=>{ const i=r*(k||.22); return [[cx,cy+r],[cx+i,cy+i],[cx+r,cy],[cx+i,cy-i],[cx,cy-r],[cx-i,cy-i],[cx-r,cy],[cx-i,cy+i]]; };   // a four-pointed star (the set's mark: the amulet, the armour's studs)
// gold filigree scrolls on both faces of a flat blade, mirrored left and right
function filigree(g,pts,half){ for(const s of [-1,1]) for(const z of [half,-half]) g.add(noOL(tube(pts.map(p=>[s*p[0],p[1],z]),.0035,mat(RA.gold),pts.length*3))); }
// one feather's outline, pointing +x (s=-1: -x), its tip rounded
function featherPts(l,w,s){ return [[0,.15*w],[.3*l,.5*w],[.7*l,.48*w],[.9*l,.3*w],[l,0],[.9*l,-.25*w],[.7*l,-.42*w],[.3*l,-.45*w],[0,-.15*w]].map(([x,y])=>[s*x,y]); }
// a fan of feathers in the xy plane: `root` runs along the bone (from the body out to the tip), F = feathers from the tip
// back, each [x,y, angle (rad), length, width] at its base. A solid backing reaches most of the way out along each feather (reach, 80% unless given),
// so it reads as one wing and only the rounded tips stand free; the feathers are their own slabs, alternating in tone.
function fan(root,F,reach){ const k=reach||.8, w=new THREE.Group(); const back=root.concat(F.map(([x,y,a,l])=>[x+Math.cos(a)*l*k,y+Math.sin(a)*l*k]));
  const b=slab(back,.008,mat(RA.pearl)); b.position.z=-.002; w.add(b);
  F.forEach(([x,y,a,l,wd],i)=>{ const f=slab(featherPts(l,wd,1),.014,mat(i%2?RA.pearl2:RA.pearl)); f.position.set(x,y,-i*.0015); f.rotation.z=a; w.add(f); }); return w; }
// an angel's wing (s=1 the right one, -1 the left): a gold arm arcing up from the root and cupping whatever it flanks, white
// feathers fanned out from it — up at the top, out and down below — as in Matt's staff and spear. Rooted at the origin,
// swept back a little so it has depth side-on.
const ARM=[[0,0],[.05,.05],[.085,.12],[.1,.2],[.11,.27],[.13,.32]];
const FEATH=[[.13,.31,75,.15,.062],[.11,.23,50,.165,.068],[.1,.15,25,.16,.068],[.08,.08,0,.14,.062],[.05,.02,-25,.115,.056]];   // [x,y, angle°, length, width], top to bottom
function wing(s,sc){ const k=sc||1; const w=fan(ARM.map(([x,y])=>[s*x*k,y*k]),FEATH.map(([x,y,a,l,wd])=>[s*x*k,y*k,s>0?a*PI/180:PI-a*PI/180,l*k,wd*k]));
  w.add(tube(ARM.map(([x,y])=>[s*x*k,y*k,.004]),.011*k+.002,mat(RA.gold),16));
  w.rotation.y=s*.35; return w; }

function radianceSword(){ const g=new THREE.Group(); g.name='sword-radiance';
  g.add(slab([[.056,.21],[.058,.3],[.054,.5],[.049,.66],[.04,.8],[.024,.92],[0,1],[-.024,.92],[-.04,.8],[-.049,.66],[-.054,.5],[-.058,.3],[-.056,.21]],.028,mat(RA.pearl)));   // the pearl-white blade
  g.add(noOL(slab([[.009,.24],[.008,.6],[.006,.85],[0,.95],[-.006,.85],[-.008,.6],[-.009,.24]],.034,lit(RA.glow))));   // the line of light down its heart
  g.add(slab([[.022,.2],[.013,.26],[0,.31],[-.013,.26],[-.022,.2]],.031,mat(RA.gold)));   // a gold tongue from the guard onto the blade
  filigree(g,[[.046,.22],[.034,.25],[.024,.29],[.03,.33],[.021,.37],[.012,.4]],.0145); filigree(g,[[.03,.76],[.022,.8],[.013,.85]],.0145);   // gold scrolls at its root and toward the point
  { const half=[[.028,.182],[.065,.186],[.092,.182],[.112,.174],[.128,.178],[.146,.19],[.133,.2],[.134,.222],[.13,.246],[.12,.268],[.117,.24],[.108,.22],[.092,.21],[.065,.208],[.037,.214],[.018,.225]];
    g.add(slab([[0,.172]].concat(half,[[0,.232]],half.slice().reverse().map(([x,y])=>[-x,y])),.036,mat(RA.gold))); }   // the guard, each end a wingtip: swept up toward the blade, a second point out
  { const b=new THREE.Mesh(new THREE.OctahedronGeometry(.036,0),mat(RA.gold2)); b.scale.set(1,1.25,.55); b.position.y=.2; g.add(b); }
  g.add(noOL(slab(star4(.034,.25,0,.2),.05,lit(RA.hot))));   // a star at its heart, burning both sides
  g.add(M(G.cyl(.018,.021,.12,8),mat(RA.pearl),0,.115,0)); g.add(tube(helix(.06,.17,.021,2.5,0),.005,mat(RA.gold),26));   // a white grip wound with gold
  for(const y of [.058,.172]) g.add(M(G.cyl(.023,.023,.012,8),mat(RA.gold),0,y,0));
  { const r=new THREE.Mesh(new THREE.TorusGeometry(.024,.007,5,14),mat(RA.gold)); r.position.y=.028; g.add(r); } g.add(noOL(slab(star4(.02,.25,0,.028),.012,lit(RA.glow2))));   // a ringed star for a pommel,
  g.add(spike(.011,.04,mat(RA.gold),0,-.008,0,PI,0)); for(const s of [-1,1]) g.add(toward(spike(.007,.025,mat(RA.gold),s*.036,.028,0),s,0));   // pointed like the amulet's
  g.add(pulseGlow(RA.glow,.15,0,.55,0)); g.add(pulseGlow(RA.glow2,.13,0,.2,0));   // (small: a sword's glow held across the body reads as a lamp at the belt)
  return finish(g,'radiance',SWORD_BOX(),.11,1); }

const RA_K={name:'Staff of Radiance',tier:5,wood:RA.pearl,dark:RA.pearl2,band:RA.gold,gem:RA.glow2,glow:RA.glow,prongs:0,rings:0,motes:4,gemR:.07};
function radianceStaff(){ const g=new THREE.Group(); g.name='staff-radiance';
  g.add(M(G.cyl(.028,.034,1.14,8),mat(RA.pearl),0,.57,0));
  g.add(tube(helix(.08,1.06,.033,4,0),.0075,mat(RA.gold),56)); g.add(noOL(tube(helix(.08,1.06,.032,-4,PI/2),.0038,mat(RA.gold2),56)));   // gold wound up the white shaft, crossed by a finer thread
  g.add(M(G.cyl(.042,.042,.17,8),mat(RA.pearl2),0,.44,0)); for(const y of [.355,.525]) g.add(M(G.cyl(.046,.046,.014,8),mat(RA.gold),0,y,0));
  for(const y of [.22,.76]){ g.add(M(G.cyl(.04,.04,.03,8),mat(RA.gold),0,y,0)); const d=new THREE.Mesh(new THREE.OctahedronGeometry(.048,0),mat(RA.gold)); d.scale.set(1,1.6,.55); d.position.y=y; g.add(d); }   // gold star-knots
  g.add(M(G.cyl(.04,.03,.06,8),mat(RA.gold),0,.03,0)); g.add(spike(.03,.09,mat(RA.gold),0,-.035,0,PI,0)); for(const s of [-1,1]) g.add(toward(spike(.01,.045,mat(RA.gold2),s*.036,.0,0),s*.5,-1));   // a gold spear-foot,
  g.add(noOL(M(G.sph(.012,6,5),lit(RA.amber),0,.04,.036)));   // set with a spark
  g.add(M(G.cyl(.05,.034,.08,8),mat(RA.gold),0,1.1,0)); { const d=new THREE.Mesh(new THREE.OctahedronGeometry(.05,0),mat(RA.gold2)); d.scale.set(1,1.3,1); d.position.y=1.155; g.add(d); } g.add(M(G.cyl(.062,.04,.04,8),mat(RA.gold),0,1.2,0));   // the collar
  const head=new THREE.Group(); head.name='staffHead'; head.position.y=1.27; g.add(head);
  { const sh=M(G.sph(.105,12,8),basic(RA.sun,{transparent:true,opacity:.4,depthWrite:false}),0,.05,-.02); sh.scale.z=.4; head.add(noOL(sh)); }   // the sun behind,
  { const r=new THREE.Mesh(new THREE.TorusGeometry(.13,.009,5,28),lit(RA.sun)); r.position.set(0,.05,-.02); head.add(noOL(r)); }   // its rim,
  { const pts=[]; for(let j=0;j<8;j++){ const a=j/8*TAU, b=a+TAU/16, r=j%2?.25:.2; pts.push([Math.cos(a)*r,Math.sin(a)*r],[Math.cos(b)*.13,Math.sin(b)*.13]); }
    const h=slab(pts,.01,lit(RA.glow)); h.name='halo'; h.position.set(0,.05,-.035); head.add(noOL(h)); }   // and its rays, one sunburst behind it all (it turns)
  head.add(slab([[0,.34],[.024,.26],[.02,.078],[.1,.072],[.155,.05],[.1,.028],[.02,.022],[.022,-.085],[0,-.16],[-.022,-.085],[-.02,.022],[-.1,.028],[-.155,.05],[-.1,.072],[-.02,.078],[-.024,.26]],.036,mat(RA.gold)));   // the gold cross before it,
  head.add(noOL(slab([[0,.31],[.012,.25],[.01,.066],[.09,.06],[.135,.05],[.09,.04],[.01,.034],[.011,-.075],[0,-.13],[-.011,-.075],[-.01,.034],[-.09,.04],[-.135,.05],[-.09,.06],[-.01,.066],[-.012,.25]],.044,lit(RA.hot))));   // burning white-gold within
  { const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.038,0),lit(RA.amber)); gem.name='gem'; gem.scale.set(1,1.4,1); gem.position.set(0,.05,.012); head.add(noOL(gem)); }   // an amber crystal at the crossing (it turns)
  { const core=M(G.sph(.022,8,6),lit(0xffffff),0,.05,.045); core.name='core'; head.add(noOL(core)); }   // its white heart (it pulses)
  for(const s of [-1,1]){ const w=wing(s,1.1); w.position.set(s*.045,-.11,-.01); head.add(w); }   // two wings cupping the sun from the sides
  const gl=glow(RA.glow,1.0,.8); gl.name='glow'; gl.position.set(0,.05,.02); head.add(gl);
  for(let i=0;i<4;i++){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(.018,0),lit(i%2?RA.glow2:RA.glow)); m.name='mote'+i; head.add(noOL(m)); }   // motes of light
  g.userData.kind='radiance'; g.userData.staff=RA_K;
  return finish(g,'radiance',new THREE.Box3(V(-.26,-.09,-.26),V(.26,1.5,.26)),.36,1.64); }

function radiancePolearm(){ const g=new THREE.Group(); g.name='polearm-radiance';   // a winged spear
  g.add(M(G.cyl(.028,.034,1.3,8),mat(RA.pearl),0,.65,0));
  for(const t of [5,-5]) g.add(noOL(tube(helix(.08,1.2,.032,t,0),.0045,mat(RA.gold),64)));   // a gold lattice, crossed
  for(const y of [.1,.66,.9,1.16]) g.add(M(G.cyl(.037,.037,.026,8),mat(RA.gold),0,y,0));
  g.add(M(G.cyl(.042,.042,.16,8),mat(RA.pearl2),0,.4,0)); for(const y of [.32,.48]) g.add(M(G.cyl(.045,.045,.014,8),mat(RA.gold),0,y,0));
  g.add(M(G.cyl(.05,.035,.1,8),mat(RA.gold),0,1.26,0)); { const d=new THREE.Mesh(new THREE.OctahedronGeometry(.045,0),mat(RA.gold2)); d.scale.set(1,1.3,1); d.position.y=1.2; g.add(d); }
  g.add(slab([[0,1.32],[.044,1.37],[.052,1.415],[.042,1.48],[.024,1.56],[0,1.68],[-.024,1.56],[-.042,1.48],[-.052,1.415],[-.044,1.37]],.026,mat(RA.crystal)));   // the long white point
  g.add(noOL(slab([[0,1.34],[.009,1.42],[.006,1.52],[0,1.65],[-.006,1.52],[-.009,1.42]],.034,lit(RA.glow))));   // its midrib, alight
  g.add(slab([[0,1.3],[.05,1.33],[.064,1.372],[.04,1.365],[0,1.39],[-.04,1.365],[-.064,1.372],[-.05,1.33]],.032,mat(RA.gold)));   // gold at its root, hooked
  for(const s of [-1,1]){ const w=wing(s,.72); w.position.set(s*.04,1.3,-.01); w.rotation.z=-s*.35; g.add(w); }   // wings spread from the socket
  { const r=new THREE.Mesh(new THREE.TorusGeometry(.14,.005,4,32),lit(RA.glow)); r.position.set(0,1.46,-.02); g.add(noOL(r)); }   // a thin halo behind the point
  g.add(M(G.cyl(.036,.03,.05,8),mat(RA.gold),0,.01,0)); { const c=new THREE.Mesh(new THREE.OctahedronGeometry(.022,0),lit(RA.glow2)); c.scale.set(1,2.2,1); c.position.y=-.03; g.add(noOL(c)); }   // a crystal foot
  for(let i=0;i<3;i++){ const a=i/3*TAU; g.add(spike(.009,.05,mat(RA.gold),Math.sin(a)*.026,-.01,Math.cos(a)*.026,PI+Math.cos(a)*.45,-Math.sin(a)*.45)); }   // in gold claws
  g.add(pulseGlow(RA.glow,.4,0,1.5,0));
  return finish(g,'radiance',POLE_BOX(-.23,.23),.3,1.64); }

const RA_BOW={name:'Bow of Radiance',tier:5,len:1.0,wood:RA.pearl,dark:RA.pearl2,band:RA.gold,glow:RA.glow,tips:'gold',gem:RA.glow2,motes:3,litString:true,
  deco:(g,h)=>{ const loc=u=>{ const p=h.P(u); return [p.z-h.gp.z,p.y-h.gp.y]; };   // a point on the stave in a limb's own frame, (out the front, up)
    for(const [limb,sg] of [[h.limbU,1],[h.limbL,-1]]){ const uu=f=>.5+sg*f;   // each limb a wing: feathers fanned out the front (off the string), tipping toward the nock
      const root=[.06,.12,.18,.24,.3,.36,.42].map(f=>loc(uu(f))), F=[[.38,.18],[.3,.225],[.22,.235],[.14,.2],[.07,.15]].map(([f,l])=>{ const [x,y]=loc(uu(f)), [x1,y1]=loc(uu(f+.01)), [x0,y0]=loc(uu(f-.01)); return [x+.012,y,Math.atan2(y1-y0,x1-x0)-sg*.8,l,l*.4]; });   // each laid back ~45° from the limb toward its tip, overlapping like a wing's
      const w=fan(root,F,.68); w.rotation.y=-PI/2; limb.add(w);   // (the fan's x turned to +z)
      limb.add(tube([.05,.15,.25,.35,.44].map(f=>{ const [z,y]=loc(uu(f)); return [0,y,z+.028]; }),.009,mat(RA.gold),16)); }   // and a gold bone along its leading edge, as on the staff's wings
    for(const u of [.56,.44]) h.at(M(G.sph(.03,8,6),mat(RA.gold)),u);   // gold knuckles where the wings start
    { const f=new THREE.Group(); f.rotation.y=-PI/2; f.position.set(0,h.gp.y,h.gp.z+.08); f.add(slab(star4(.1,.2,0,0),.016,mat(RA.gold))); g.add(f); } } };   // a gold star about the belly's crystal, side-on

window.__setweapons.addSet('radiance',{ids:['angelic','radiance'],tail:/ of radiance$/i,sword:radianceSword,polearm:radiancePolearm,staff:[RA_K,radianceStaff],bow:RA_BOW});
})();
