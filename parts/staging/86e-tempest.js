// ===== THE STORM SET'S WEAPONS (build 158): storm-grey steel, navy leather and silver, with blue lightning running through
// every piece (the hideout's "storm" set, shaped after Matt's items/sets/storm-*.jpg). Its key is 'tempest', not 'storm':
// staff-storm and bow-storm are already the forge's tier-4 Stormwood staff and bow.
//   sword-tempest    a broad grey blade chipped along both edges, a forked bolt of lightning down its heart and arcs
//                    leaping off its edges; a winged guard of swept-up hooks round a blue stone, a navy grip bound in
//                    silver, and a storm crystal for a pommel (storm-sword.jpg)
//   staff-tempest    a navy shaft cross-bound in black cord and banded in silver, a tall blue crystal in a crown of silver
//                    prongs each shaped like a lightning bolt — a big pair at the sides, flat to the front as in the
//                    picture, four small at the diagonals, so the front stays open and the crystal shows — sparks
//                    leaping off the tips, a little spear point for a foot (storm-staff.jpg)
//   polearm-tempest  a lightning trident: a long serrated centre blade with a bolt down it and two side tines shaped like
//                    lightning bolts, a black shaft with lightning crawling up it, a wrapped grip, a spear-point foot
//                    (storm-polearm.jpg)
//   bow-tempest      no art yet: a gunmetal recurve with storm crystals at the nocks, silver lightning-bolt fins out the
//                    front of each limb (the staff's prongs), lightning streaks down the limbs and a burning blue string
(function(){
const {V,lit,shapeOf,slab,tube,helix,spike,toward,noOL,pulseGlow,faceCracks,crescent,OUTER,INNER,EDGE_IN,finish,SWORD_BOX,POLE_BOX,DIAG}=window.__setweapons.kit;

// ---------------------------------------------------------------- THE STORM: grey steel, navy leather, silver, blue lightning
const ST={steel:0x8698b2,steel2:0xc4ccd8,silver:0xa4aec0,guard:0x626d80,gun:0x5a6478,dark:0x3a404c,iron:0x1d212a,navy:0x22346e,navy2:0x151d3c,glow:0x3d8bff,bolt:0x5aa6ff,pale:0x9fd0ff,hot:0xeaf6ff};
// a jagged line from (x0,y0) to (x1,y1): n kinks, each pushed off the line by up to amp, alternately left and right
function zag(x0,y0,x1,y1,n,amp,seed){ const dx=x1-x0, dy=y1-y0, l=Math.hypot(dx,dy)||1, nx=-dy/l, ny=dx/l, pts=[]; for(let i=0;i<=n;i++){ const f=i/n, o=(i===0||i===n)?0:(i%2?1:-1)*amp*(.55+.45*Math.abs(Math.sin(i*7.3+seed*3.1))); pts.push([x0+dx*f+nx*o,y0+dy*f+ny*o]); } return pts; }
// a thin streak of lightning drawn along pts (w0 thick at the start, tapering to w1), as a flat slab
function boltPoly(pts,w0,w1){ const Lf=[],Rt=[], n=pts.length; for(let i=0;i<n;i++){ const a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)]; const dx=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dx,dy)||1, nx=-dy/l, ny=dx/l, w=w0+(w1-w0)*i/(n-1); Lf.push([pts[i][0]+nx*w,pts[i][1]+ny*w]); Rt.push([pts[i][0]-nx*w,pts[i][1]-ny*w]); } return Lf.concat(Rt.reverse()); }
const streak=(pts,w0,w1,depth,m)=>slab(boltPoly(pts,w0,w1),depth,m);
const flipX=pts=>pts.map(([x,y])=>[-x,y]), flipY=pts=>pts.map(([x,y])=>[x,-y]);
// a jagged ring of points winding up a shaft (lightning crawling round it)
function jagHelix(y0,y1,r,turns,ph,n){ const pts=[]; for(let i=0;i<=n;i++){ const f=i/n, a=ph+f*turns*TAU+(i%2?.32:-.32); const rr=r+(i%2?.01:0); pts.push([Math.cos(a)*rr,y0+(y1-y0)*f,Math.sin(a)*rr]); } return pts; }

function tempestSword(){ const g=new THREE.Group(); g.name='sword-tempest';
  const R=[[.05,.21],[.058,.29],[.038,.314],[.06,.338],[.062,.42],[.04,.45],[.059,.476],[.056,.57],[.034,.6],[.053,.626],[.048,.72],[.027,.748],[.043,.772],[.034,.85],[.015,.874],[.027,.894],[.012,.95],[0,1]];
  const L=[[-.052,.21],[-.059,.26],[-.039,.284],[-.06,.308],[-.062,.39],[-.041,.418],[-.06,.444],[-.057,.53],[-.035,.558],[-.055,.584],[-.051,.68],[-.03,.708],[-.046,.734],[-.039,.81],[-.018,.836],[-.031,.862],[-.016,.93]];
  g.add(slab(R.concat(L.slice().reverse()),.03,mat(ST.steel)));   // a broad storm-grey blade, chipped in along both edges
  g.add(slab([[.016,.22],[.014,.8],[0,.93],[-.014,.8],[-.016,.22]],.034,mat(ST.dark)));   // its dark ridge
  const vein=zag(0,.225,0,.95,13,.016,1);
  g.add(noOL(streak(vein,.008,.002,.037,lit(ST.bolt)))); g.add(noOL(streak(vein,.0032,.0008,.04,lit(ST.hot))));   // a bolt of lightning down its heart, white at the core
  for(const [i,dx,dy,s] of [[3,.085,.07,2],[6,-.09,.06,3],[9,.08,.05,4],[11,-.07,.04,5]]){ const p=vein[i]; g.add(noOL(streak(zag(p[0],p[1],p[0]+dx,p[1]+dy,3,.01,s),.0042,.001,.036,lit(ST.bolt)))); }   // forks leaping out past the edges
  for(const [x,y0,y1,s] of [[.063,.34,.52,7],[-.064,.56,.74,8],[.05,.7,.84,9]]) g.add(noOL(streak(zag(x,y0,x*.9,y1,6,.008,s),.003,.0012,.03,lit(ST.bolt))));   // and crawling along them
  const GR=[[0,.178],[.035,.182],[.075,.192],[.105,.208],[.124,.232],[.132,.262],[.13,.292],[.114,.258],[.098,.236],[.084,.228],[.08,.262],[.068,.226],[.044,.218],[.03,.222],[.024,.262],[.012,.232],[0,.24]];
  g.add(slab(GR.concat(flipX(GR.slice(1,-1).reverse())),.045,mat(ST.guard)));   // the guard: hooks swept up like wings, a spur on each and a crown on the blade
  { const c=new THREE.Mesh(new THREE.OctahedronGeometry(.026,0),lit(ST.bolt)); c.scale.set(1,1.4,1); c.position.y=.205; g.add(noOL(c)); }   // a blue stone at its heart
  g.add(M(G.cyl(.018,.02,.15,8),mat(ST.navy2),0,.105,0)); g.add(tube(helix(.035,.175,.021,2.5,0),.0045,mat(ST.steel2),26)); g.add(tube(helix(.035,.175,.021,-2.5,PI),.0045,mat(ST.steel2),26));   // navy leather, bound crosswise in silver
  for(const y of [.03,.178]) g.add(M(G.cyl(.024,.024,.014,8),mat(ST.steel2),0,y,0));
  { const c=new THREE.Mesh(new THREE.OctahedronGeometry(.021,0),lit(ST.pale)); c.scale.set(1,1.9,1); c.position.y=-.006; g.add(noOL(c)); }   // a storm crystal for a pommel
  for(let i=0;i<3;i++){ const a=i/3*TAU; g.add(spike(.006,.036,mat(ST.steel2),Math.sin(a)*.018,.004,Math.cos(a)*.018,PI+Math.cos(a)*.45,-Math.sin(a)*.45)); }   // held in three silver claws
  g.add(pulseGlow(ST.glow,.16,0,.58,0)); g.add(pulseGlow(ST.pale,.11,0,-.006,0));
  return finish(g,'tempest',SWORD_BOX(),.11,1); }

// a staff prong in its own plane (x out from the axis, y up): a lightning bolt, its lower stroke out from the cup, a jog in,
// a longer stroke up to the tip. The two big ones stand at the sides, flat to the front like the picture; four small at the diagonals.
const PRONG=[[.04,-.15],[.1,-.15],[.19,.02],[.14,.02],[.25,.33],[.1,.045],[.13,.03],[.055,-.09]];
const PRONG_C=[[.07,-.14],[.155,.0],[.125,.035],[.235,.3]];   // the glowing streak along its middle
const ST_K={name:'Staff of the Storm',tier:5,wood:ST.navy,dark:ST.navy2,band:ST.steel2,gem:0x9fd4ff,glow:ST.glow,prongs:0,rings:0,motes:4,gemR:.07};
function tempestStaff(){ const g=new THREE.Group(); g.name='staff-tempest';
  g.add(M(G.cyl(.03,.036,1.14,8),mat(ST.navy),0,.57,0));
  g.add(tube(helix(.06,1.0,.034,7,0),.005,mat(ST.iron),84)); g.add(tube(helix(.06,1.0,.034,-7,PI),.005,mat(ST.iron),84));   // navy leather, cross-bound in black cord
  for(const y of [.08,.32,.62,.9]) g.add(M(G.cyl(.041,.041,.03,8),mat(ST.steel2),0,y,0));   // silver bands
  g.add(M(G.cyl(.052,.036,.1,8),mat(ST.steel2),0,1.08,0)); g.add(noOL(M(new THREE.OctahedronGeometry(.018,0),lit(ST.bolt),0,1.08,.05)));   // the collar, a blue stone in its front
  for(const s of [-1,1]) g.add(slab((s>0?x=>x:flipX)([[.04,1.03],[.075,1.06],[.07,1.09],[.1,1.15],[.055,1.09],[.06,1.07],[.035,1.06]]),.016,mat(ST.steel2)));   // little bolt-fins off it
  g.add(slab([[0,-.1],[.028,-.045],[.018,.03],[-.018,.03],[-.028,-.045]],.026,mat(ST.steel2))); g.add(noOL(slab([[0,-.075],[.011,-.04],[0,-.005],[-.011,-.04]],.03,lit(ST.bolt))));   // a spear point for a foot, lit inside
  for(const s of [-1,1]) g.add(toward(spike(.008,.05,mat(ST.dark),s*.03,.0,0),s*.6,-1));
  const head=new THREE.Group(); head.name='staffHead'; head.position.y=1.27; g.add(head);
  head.add(M(G.cyl(.07,.04,.07,8),mat(ST.dark),0,-.15,0)); head.add(M(G.cyl(.074,.074,.015,8),mat(ST.steel2),0,-.115,0));   // the cup the crystal sits in
  { const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.11,0),basic(ST.bolt,{transparent:true,opacity:.85})); gem.name='gem'; gem.scale.set(1,1.9,1); gem.position.y=.06; head.add(noOL(gem)); }   // the storm crystal (it turns)
  { const core=new THREE.Mesh(new THREE.OctahedronGeometry(.06,0),lit(ST.hot)); core.name='core'; core.scale.set(1,2,1); core.position.y=.06; head.add(noOL(core)); }   // lightning caught inside it (it pulses)
  for(const [a,sc] of [[PI/2,1],[-PI/2,1]].concat(DIAG.map(a=>[a,.62]))){ const pr=new THREE.Group(); pr.rotation.y=a-PI/2; pr.scale.setScalar(sc); pr.position.y=-.15*(1-sc); pr.add(slab(PRONG,.022,mat(ST.silver))); pr.add(noOL(streak(PRONG_C,.007,.002,.028,lit(ST.bolt))));
    if(sc===1) pr.add(noOL(streak(zag(.25,.33,.33,.25,4,.014,a),.0045,.001,.022,lit(ST.bolt)))); head.add(pr); }   // silver prongs shaped like bolts, charged — the big pair with sparks leaping off their tips
  const gl=glow(0x62aaff,1.3,.9); gl.name='glow'; gl.position.y=.06; head.add(gl);   // (a paler blue than the bolts: a deep blue haze barely shows against the hall's red brick)
  for(let i=0;i<4;i++){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(.02,0),lit(i%2?ST.pale:ST.bolt)); m.scale.set(.6,1.8,.6); m.name='mote'+i; head.add(noOL(m)); }   // sparks
  g.userData.kind='tempest'; g.userData.staff=ST_K;
  return finish(g,'tempest',new THREE.Box3(V(-.26,-.09,-.26),V(.26,1.5,.26)),.36,1.64); }

// the trident's right tine (the left is its mirror): a lightning bolt out of the collar, stepping once, pointing up and out
const TINE=[[.03,1.3],[.09,1.3],[.16,1.42],[.13,1.425],[.2,1.56],[.07,1.44],[.1,1.42]];
const TINE_C=[[.06,1.31],[.13,1.415],[.11,1.43],[.192,1.55]];
function tempestPolearm(){ const g=new THREE.Group(); g.name='polearm-tempest';   // a lightning trident
  g.add(M(G.cyl(.028,.034,1.3,8),mat(ST.iron),0,.65,0));
  g.add(M(G.cyl(.04,.04,.2,8),mat(ST.navy2),0,.4,0)); g.add(tube(helix(.31,.49,.041,2.5,0),.005,mat(ST.dark),26)); g.add(tube(helix(.31,.49,.041,-2.5,PI),.005,mat(ST.dark),26));   // the wrapped grip
  for(const y of [.28,.52,.8,1.12]) g.add(M(G.cyl(.038,.038,.03,8),mat(ST.steel2),0,y,0));
  g.add(noOL(tube(jagHelix(.62,1.26,.038,1.3,0,14),.0045,lit(ST.bolt),56))); g.add(noOL(tube(jagHelix(.06,.26,.038,.6,2,6),.0045,lit(ST.bolt),24)));   // lightning crawling up the shaft
  g.add(M(G.cyl(.05,.036,.1,8),mat(ST.dark),0,1.3,0)); g.add(M(G.cyl(.052,.052,.015,8),mat(ST.steel2),0,1.345,0));
  const R=[[.03,1.33],[.05,1.38],[.038,1.396],[.058,1.43],[.045,1.452],[.056,1.49],[.041,1.512],[.049,1.55],[.033,1.572],[.038,1.605],[.021,1.628],[.02,1.65],[0,1.7]];
  const L=[[-.03,1.33],[-.049,1.4],[-.037,1.416],[-.057,1.45],[-.044,1.472],[-.054,1.51],[-.039,1.532],[-.046,1.57],[-.03,1.592],[-.033,1.625],[-.017,1.65]];
  g.add(slab(R.concat(L.slice().reverse()),.028,mat(ST.steel)));   // the centre blade, long and serrated
  const vein=zag(0,1.35,0,1.66,8,.01,5); g.add(noOL(streak(vein,.008,.0015,.034,lit(ST.bolt)))); g.add(noOL(streak(vein,.003,.0008,.037,lit(ST.hot))));   // a bolt down it
  for(const s of [-1,1]){ const f=s>0?x=>x:flipX; g.add(slab(f(TINE),.026,mat(ST.steel))); g.add(noOL(streak(f(TINE_C),.007,.002,.032,lit(ST.bolt))));   // the side tines, shaped like bolts and charged
    g.add(noOL(streak(zag(s*.155,1.415,s*.235,1.385,3,.012,s+2),.004,.001,.03,lit(ST.bolt)))); }   // a spark leaping off each
  g.add(slab([[0,-.1],[.03,-.04],[.02,.03],[-.02,.03],[-.03,-.04]],.028,mat(ST.steel2))); g.add(noOL(slab([[0,-.075],[.012,-.035],[0,0],[-.012,-.035]],.032,lit(ST.bolt))));   // the spear-point foot
  for(const s of [-1,1]) g.add(toward(spike(.008,.05,mat(ST.dark),s*.032,.0,0),s*.6,-1));
  g.add(pulseGlow(ST.glow,.5,0,1.46,0));
  return finish(g,'tempest',POLE_BOX(-.2,.2),.3,1.64); }

// a bow fin in its own plane (x forward, y toward the limb's tip): a small lightning bolt, like the staff's prongs
const FIN=[[0,-.04],[.06,-.04],[.12,.05],[.09,.055],[.17,.2],[.04,.07],[.07,.05],[0,.01]];
const FIN_C=[[.03,-.035],[.095,.045],[.07,.06],[.16,.185]];
const ST_BOW={name:'Bow of the Storm',tier:5,len:1.0,wood:ST.gun,dark:ST.navy2,band:ST.steel2,glow:ST.glow,tips:'crystal',gem:0x9fd4ff,motes:3,litString:true,recurve:true,
  deco:(g,h)=>{ for(const [u,up] of [[.24,false],[.76,true]]){ const f=slab(up?FIN:flipY(FIN),.016,mat(ST.silver)); f.rotation.y=-PI/2; h.at(f,u,.012); const c=noOL(streak(up?FIN_C:flipY(FIN_C),.006,.0015,.021,lit(ST.bolt))); c.rotation.y=-PI/2; h.at(c,u,.012);
      const sp=noOL(streak(zag(.17,.2*(up?1:-1),.24,.16*(up?1:-1),3,.01,u*7),.0035,.001,.018,lit(ST.bolt))); sp.rotation.y=-PI/2; h.at(sp,u,.012); }   // silver fins shaped like bolts, a spark leaping off each
    for(const u of [.12,.36,.64,.88]) h.at(spike(.009,.04,mat(ST.steel2),0,0,0,PI/2,0),u,.03);   // spurs out the front
    for(const u of [.16,.3,.7,.84]) h.at(noOL(streak(zag(0,-.035,0,.035,4,.009,u*10),.003,.003,.006,lit(ST.bolt))),u,.026);   // lightning down the front of the limbs
    for(const u of [.42,.58]) h.at(M(G.cyl(.032,.032,.05,8),mat(ST.navy)),u);
    for(const sy of [-1,1]) g.add(spike(.008,.05,mat(ST.steel2),0,h.gp.y+sy*.075,h.gp.z+.03,Math.atan2(1,-sy*.7),0)); } };   // silver claws holding the storm crystal

window.__setweapons.addSet('tempest',{ids:['storm','tempest'],tail:/ of the storm$/i,sword:tempestSword,polearm:tempestPolearm,staff:[ST_K,tempestStaff],bow:ST_BOW});
})();
