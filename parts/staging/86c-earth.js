// ===== THE THE EARTH SET'S WEAPONS (build 158): grey standing-stone split open on green crystal, grown over with moss and
// bound in roots and leather (the hideout's "rock" set; Matt's items/sets/rock-*.jpg):
//   sword-earth    a broad stone blade, chipped along both edges and flaked light and dark, a jagged green crack running
//                  its length and branching, moss on its edges; a blocky stone guard flaring up at the ends with a green
//                  crystal at its heart, a leather grip bound crosswise, a stone pommel set with a crystal (rock-sword)
//   staff-earth    a stone shaft wound with two roots crossing, moss and leather bands, on a stone knob; its head a big green
//                  crystal cluster rising out of four standing stones at the diagonals, a green rune cut in each, moss on
//                  their tops, pebbles circling (rock-staff)
//   polearm-earth  a spear (rock-polearm): a twisted wooden shaft in leather wraps and stone bands cut with green runes, a
//                  stone broadhead split in two halves with glowing crystal between them, runes and moss on it, a stone butt
//   bow-earth      no art yet: a wooden recurve clasped with stone plates, green crystals growing out of its limbs, moss,
//                  roots wound round them, and a stone-set crystal at the grip, to sit with the sword and staff
(function(){
const {V,lit,shapeOf,slab,tube,helix,spike,toward,noOL,pulseGlow,faceCracks,crescent,OUTER,INNER,EDGE_IN,finish,SWORD_BOX,POLE_BOX,DIAG}=window.__setweapons.kit;

// ---------------------------------------------------------------- EARTH: grey stone, moss, roots and leather, green crystal
const EA={stone:0xa29e90,stone2:0x7e7a6c,stoneHi:0xbab6a6,moss:0x76a432,moss2:0xa6cc4c,root:0x6e4a2a,root2:0x46301a,leather:0x80502c,wood:0x94704a,glow:0x4dff3a,glow2:0xaaff66,gem:0x62ff4a,gem2:0x2ed83a,hot:0xe0ffc8};
const ROCK=new THREE.DodecahedronGeometry(1,0), LUMP=new THREE.IcosahedronGeometry(1,0), XTAL=new THREE.OctahedronGeometry(1,0);
function rock(r,m,x,y,z,sx,sy,sz){ const o=M(ROCK,m,x,y,z); o.scale.set(r*(sx||1),r*(sy||1),r*(sz||1)); return o; }   // a chunk of stone
function moss(r,x,y,z,sx,sy,sz,c){ const o=M(LUMP,mat(c||EA.moss),x,y,z); o.scale.set(r*(sx||1),r*(sy||1),r*(sz||1)); o.rotation.set(x*40,y*30,z*50); return noOL(o); }   // a clump of moss
function xtal(r,c,x,y,z,sy){ const o=M(XTAL,lit(c),x,y,z); o.scale.set(r,r*(sy||1.6),r); return noOL(o); }   // a green crystal
function chip(pts,z,c){ const o=slab(pts,.004,mat(c)); o.position.z=z; return noOL(o); }   // a flake of lighter or darker stone on a flat face
const RUNE=[[-.004,-.025],[.003,-.025],[.003,-.004],[.015,.006],[.015,.014],[.003,.004],[.003,.01],[.015,.02],[.015,.028],[.003,.018],[.003,.025],[-.004,.025]];   // a rune, stem and two branches, .05 tall
function rune(x,y,z,s,back){ const o=noOL(slab(RUNE,.004,lit(EA.glow))); o.scale.set(s,s,1); o.position.set(x,y,z); if(back) o.rotation.y=PI; return o; }   // cut in and glowing
const mirror=pts=>pts.map(p=>[p[0],p[1],-p[2]]);   // a helix wound the other way
// a jagged crack of half-width w(f) along a line in the xy plane, as a closed outline for slab()
function crack(line,w){ const L=[],R=[]; for(let i=0;i<line.length;i++){ const a=line[Math.max(0,i-1)], b=line[Math.min(line.length-1,i+1)]; const dx=b[0]-a[0], dy=b[1]-a[1], d=Math.hypot(dx,dy)||1; const f=i/(line.length-1), ww=typeof w==='function'?w(f):w; L.push([line[i][0]-dy/d*ww,line[i][1]+dx/d*ww]); R.push([line[i][0]+dy/d*ww,line[i][1]-dx/d*ww]); } return L.concat(R.reverse()); }
const swell=(w,e)=>f=>w*((e||.15)+(1-(e||.15))*Math.sin(PI*f));

function earthSword(){ const g=new THREE.Group(); g.name='sword-earth';
  g.add(slab([[.064,.21],[.068,.29],[.061,.33],[.066,.43],[.06,.5],[.064,.59],[.057,.65],[.061,.73],[.054,.8],[.056,.86],[.042,.91],[.016,.985],[0,1],[-.022,.965],[-.046,.905],[-.056,.84],[-.051,.78],[-.058,.7],[-.053,.63],[-.06,.54],[-.055,.47],[-.063,.38],[-.058,.31],[-.064,.21]],.03,mat(EA.stone)));   // a broad stone blade, chipped
  for(const z of [.017,-.017]){ g.add(chip([[-.056,.25],[-.024,.26],[-.03,.32],[-.057,.335]],z,EA.stoneHi)); g.add(chip([[.026,.505],[.058,.495],[.055,.555],[.03,.56]],z,EA.stone2)); g.add(chip([[-.05,.75],[-.02,.735],[-.024,.8],[-.047,.81]],z,EA.stoneHi)); }   // flakes of lighter and darker rock
  const vein=[[0,.23],[.012,.29],[-.008,.36],[.016,.44],[-.004,.51],[.017,.59],[-.01,.67],[.008,.75],[-.007,.83],[.006,.9],[0,.96]];
  g.add(noOL(slab(crack(vein,swell(.013)),.036,lit(EA.glow))));   // the crack of green crystal down its heart
  for(const br of [[[.016,.44],[.032,.47],[.046,.485]],[[-.01,.67],[-.026,.7],[-.04,.725]],[[-.008,.36],[-.024,.38],[-.036,.405]]]) g.add(noOL(slab(crack(br,f=>.007*(1-f*.75)),.034,lit(EA.glow))));   // branching
  for(const [x,y] of [[.014,.44],[-.008,.8]]) for(const z of [.018,-.018]) g.add(xtal(.012,EA.glow2,x,y,z,1.5));   // crystal breaking the surface
  for(const [x,y,s] of [[-.058,.29,1.1],[.062,.4,1],[-.058,.58,1.2],[.057,.69,.9],[-.05,.86,.8]]) g.add(moss(.022*s,x,y,0,1.1,1.3,1.1,y>.5?EA.moss:EA.moss2));   // moss over its edges
  for(const [x,y,s] of [[-.035,.45,.9],[.036,.26,.9]]) for(const z of [.014,-.014]) g.add(moss(.018*s,x,y,z,1.3,.9,.55,z>0?EA.moss2:EA.moss));   // and on its faces
  g.add(slab([[-.118,.205],[-.12,.25],[-.105,.28],[-.085,.255],[-.045,.245],[-.02,.262],[0,.272],[.02,.262],[.045,.245],[.085,.255],[.105,.28],[.12,.25],[.118,.205],[.09,.19],[.04,.185],[.02,.172],[0,.166],[-.02,.172],[-.04,.185],[-.09,.19]],.056,mat(EA.stone2)));   // a blocky stone guard, its ends flaring up
  for(const z of [.029,-.029]) for(const s of [-1,1]) g.add(chip([[s*.11,.21],[s*.08,.2],[s*.086,.25],[s*.104,.268]],z,EA.stoneHi));
  for(const z of [.03,-.03]) g.add(xtal(.024,EA.gem,0,.218,z,1.5));   // the crystal at its heart
  for(const [x,y,s] of [[-.066,.25,1],[.08,.26,.9]]) g.add(moss(.018*s,x,y,0,1.5,.8,1.8,EA.moss2));
  g.add(M(G.cyl(.018,.021,.15,8),mat(EA.leather),0,.105,0)); g.add(tube(helix(.035,.18,.022,2.5,0),.005,mat(EA.root2),26)); g.add(tube(mirror(helix(.035,.18,.022,2.5,PI)),.005,mat(EA.root2),26));   // leather, bound crosswise
  g.add(rock(.034,mat(EA.stone),0,.012,0,1,1.15,1)); for(const z of [.03,-.03]) g.add(xtal(.013,EA.gem,0,.014,z,1.5));   // a stone pommel set with a crystal
  g.add(pulseGlow(EA.glow,.15,0,.58,0));
  return finish(g,'earth',SWORD_BOX(),.11,1); }

const EA_K={name:'Staff of the Earth',tier:5,wood:EA.stone,dark:EA.leather,band:EA.stone2,gem:0x9aff6a,glow:EA.glow,prongs:0,rings:0,motes:4,gemR:.08};
function earthStaff(){ const g=new THREE.Group(); g.name='staff-earth';
  g.add(M(G.cyl(.032,.038,1.14,8),mat(EA.stone),0,.57,0));   // a shaft of stone
  g.add(tube(helix(.08,1.12,.038,2.4,0,.005),.008,mat(EA.root),40)); g.add(tube(mirror(helix(.12,1.08,.038,2,PI,.005)),.007,mat(EA.root2),36));   // two roots winding up it, crossing
  g.add(M(G.cyl(.044,.044,.17,8),mat(EA.leather),0,.44,0)); for(const y of [.74,.98]) g.add(M(G.cyl(.042,.042,.04,8),mat(EA.leather),0,y,0));   // leather bindings
  for(const [y,a,s] of [[.28,.4,1],[.6,2.6,.9],[.86,4.4,1],[1.1,1.2,1.1]]) g.add(moss(.026*s,Math.sin(a)*.034,y,Math.cos(a)*.034,1.1,1.4,1.1,y>.7?EA.moss2:EA.moss));   // moss
  g.add(rock(.058,mat(EA.stone),0,.01,0,1,1.25,1)); g.add(moss(.028,.034,.045,.02,1.2,.8,1));   // a stone knob for a foot
  const head=new THREE.Group(); head.name='staffHead'; head.position.y=1.27; g.add(head);
  head.add(M(G.cyl(.065,.042,.1,8),mat(EA.stone2),0,-.17,0)); head.add(tube(helix(-.21,-.13,.064,1.5,0,.004),.01,mat(EA.root),20));   // the socket, root-wound
  head.add(moss(.034,.04,-.12,.03,1.4,.8,1.2)); head.add(moss(.03,-.045,-.13,-.02,1.3,.8,1.2,EA.moss2));
  for(const a of DIAG){ const s=new THREE.Group(); s.rotation.y=a; head.add(s);   // four standing stones at the diagonals, a rune cut in each, moss on top
    const st=slab([[-.036,-.2],[.036,-.2],[.042,-.02],[.036,.08],[.014,.14],[-.018,.125],[-.04,.05]],.034,mat(EA.stoneHi)); st.position.z=.135; st.rotation.x=.26; s.add(st);
    st.add(rune(-.004,-.03,.017,1.3)); st.add(moss(.024,-.004,.12,.006,1.5,.7,1.4,EA.moss2)); }
  { const gem=new THREE.Group(); gem.name='gem'; head.add(gem);   // the crystal cluster (it turns)
    gem.add(xtal(.12,EA.gem,0,.09,0,1.9)); for(const [x,z,r] of [[.05,.055,.5],[-.055,.045,-.55],[.01,-.07,.3]]){ const c=xtal(.055,EA.gem2,x,-.01,z,2.1); c.rotation.set(z*6,0,-r); gem.add(c); } }
  { const core=M(G.sph(.055,8,6),lit(EA.hot),0,.08,0); core.name='core'; head.add(noOL(core)); }   // its bright heart (it pulses)
  const gl=glow(EA.glow,1.15,.8); gl.name='glow'; gl.position.y=.08; head.add(gl);
  for(let i=0;i<4;i++){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(.02,0),lit(i%2?EA.glow2:EA.glow)); m.name='mote'+i; head.add(noOL(m)); }
  for(let i=0;i<3;i++){ const p=M(ROCK,mat(EA.stone2)); p.scale.set(.028,.034,.026); p.name='shard'+i; head.add(p); }   // pebbles circling it
  g.userData.kind='earth'; g.userData.staff=EA_K;
  return finish(g,'earth',new THREE.Box3(V(-.26,-.09,-.26),V(.26,1.5,.26)),.36,1.64); }

function earthPolearm(){ const g=new THREE.Group(); g.name='polearm-earth';   // a spear
  g.add(M(G.cyl(.03,.036,1.2,8),mat(EA.wood),0,.6,0)); g.add(tube(helix(.02,1.16,.032,2.1,0,.003),.006,mat(EA.root2),40)); g.add(tube(helix(.02,1.16,.032,2.1,PI,.003),.005,mat(EA.root2),40));   // twisted wood
  for(const [y,h] of [[.4,.16],[.78,.07],[.94,.05],[1.1,.05]]) g.add(M(G.cyl(.04,.04,h,8),mat(EA.leather),0,y,0));   // leather wraps
  for(const y of [.6,1.02]){ g.add(M(G.cyl(.044,.044,.075,8),mat(EA.stone),0,y,0)); g.add(rune(0,y,.045,1)); g.add(rune(0,y,-.045,1,true)); }   // stone bands cut with green runes
  for(const [y,a] of [[.3,.5],[.52,2.8],[.72,4.5],[.88,1.2]]) g.add(moss(.022,Math.sin(a)*.034,y,Math.cos(a)*.034,1.1,1.4,1.1,y>.8?EA.moss2:EA.moss));
  g.add(M(G.cyl(.05,.038,.09,8),mat(EA.stone2),0,1.17,0)); g.add(moss(.03,.035,1.2,.02,1.3,.8,1.2)); g.add(moss(.024,-.03,1.19,-.03,1.3,.8,1.2,EA.moss2));   // the collar
  g.add(slab([[.006,1.615],[.03,1.55],[.044,1.51],[.056,1.47],[.07,1.44],[.082,1.4],[.096,1.36],[.106,1.32],[.118,1.27],[.13,1.19],[.1,1.215],[.07,1.245],[.04,1.23],[.024,1.215],[.03,1.27],[.026,1.33],[.034,1.39],[.024,1.45],[.028,1.5],[.016,1.56]],.032,mat(EA.stone)));   // the stone broadhead, chipped, split in two
  g.add(slab([[-.006,1.615],[-.016,1.56],[-.026,1.5],[-.022,1.45],[-.032,1.39],[-.028,1.33],[-.03,1.27],[-.024,1.215],[-.04,1.23],[-.07,1.245],[-.1,1.215],[-.13,1.19],[-.12,1.26],[-.108,1.3],[-.1,1.34],[-.088,1.38],[-.074,1.42],[-.06,1.46],[-.048,1.5],[-.034,1.545]],.032,mat(EA.stone)));
  for(const z of [.018,-.018]) g.add(chip([[-.05,1.38],[-.074,1.37],[-.06,1.43],[-.044,1.44]],z,EA.stoneHi));
  g.add(noOL(slab([[0,1.6],[.02,1.54],[.03,1.47],[.026,1.4],[.034,1.33],[.03,1.26],[.02,1.21],[0,1.2],[-.02,1.21],[-.03,1.26],[-.034,1.33],[-.026,1.4],[-.03,1.47],[-.02,1.54]],.04,lit(EA.glow))));   // green crystal between the halves
  for(const z of [.02,-.02]) g.add(xtal(.015,EA.glow2,0,1.44,z,1.8));
  for(const s of [-1,1]) for(const z of [.017,-.017]) g.add(rune(s*.068,1.29,z,.9,z<0));   // a rune on each half
  for(const [x,y,s] of [[-.05,1.49,1],[-.09,1.37,1.1],[.07,1.43,.9],[.114,1.26,.8]]) g.add(moss(.022*s,x,y,0,1.4,.9,1.5,EA.moss2));   // moss along its edges
  g.add(rock(.052,mat(EA.stone),0,-.02,0,1,1.3,1)); for(const z of [.048,-.048]) g.add(noOL(M(new THREE.TorusGeometry(.016,.004,4,12),lit(EA.glow),0,-.02,z))); g.add(moss(.026,-.032,.02,.02,1.2,.8,1));   // a stone butt with a glowing spiral
  g.add(pulseGlow(EA.glow,.4,0,1.42,0));
  return finish(g,'earth',POLE_BOX(-.14,.14),.3,1.64); }

const EA_BOW={name:'Bow of the Earth',tier:5,len:1.0,wood:EA.wood,dark:EA.leather,band:EA.stone2,glow:EA.glow,tips:'crystal',gem:EA.gem,motes:3,litString:true,recurve:true,
  deco:(g,h)=>{ for(const u of [.14,.26,.74,.86]) h.at(rock(.04,mat(u<.2||u>.8?EA.stone:EA.stoneHi),0,0,0,1.25,1.5,.95),u,.014);   // stone plates clasping the limbs
    for(const u of [.2,.8]){ const c=h.at(xtal(.024,EA.gem,0,0,0,2.4),u,.055); c.rotation.x=u<.5?.6:-.6; }   // crystals growing out of them
    for(const u of [.1,.32,.68,.9]) h.at(moss(.026,0,0,0,1.3,1,1.1,u<.5?EA.moss:EA.moss2),u,.024);   // moss
    for(const u of [.37,.63]) h.at(tube(helix(-.045,.045,.031,1.6,u*6,0),.007,mat(EA.root2),16),u,0);   // roots wound round the limbs
    for(const s of [-1,1]) g.add(rock(.032,mat(EA.stone),0,h.gp.y+s*.072,h.gp.z+.062,1.2,.85,.8)); g.add(moss(.022,.02,h.gp.y+.1,h.gp.z+.05,1.3,.8,1)); } };   // stone set about the grip's crystal

window.__setweapons.addSet('earth',{ids:['rock','earth'],tail:/ of the earth$/i,sword:earthSword,polearm:earthPolearm,staff:[EA_K,earthStaff],bow:EA_BOW});
})();
