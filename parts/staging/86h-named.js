// ===== THE NAMED WEAPONS (build 169): the two named mythic weapons (97-mythics.js NAMED), built in code with the set weapons'
// kit (86-setweapons.js) and shaped after Matt's pictures (the hideout's items/named/<id>.jpg). Matt, 2026-09-27: "lets have you
// do the two named weapons ... then when its equipped it shows in your hand."
//   named-rootsplitter   rootsplitter.jpg: a big axe. A gnarled bark haft wound with green vines and leaves, a green vein
//                        glowing in the bark's cracks; the haft's top bends over into the head, bark on the back and a
//                        crescent of faceted green crystal for the edge, its point dripping; a crystal cluster at the butt.
//                        The sword frame (the Knight holds it like his sword), a touch longer than a sword
//   named-last_lantern   last_lantern.jpg: a halberd. A dark shaft wound with gold filigree and gold knots, a gold finial
//                        with a star; at the head a gold-caged lantern burning gold, a silver spear point above it, a
//                        silver crescent axe blade with a gold star engraved on it, and a silver fluke swept out the back.
//                        The polearm frame (body-length, held a third of the way up)
// Who holds them (a judgment call, kept): only the Knight holds the axe or the halberd. A staff hero (Witch, Fighter) casts
// through a staff and the Troll draws a bow, so on them a named weapon shows as the top staff (staff-battle) and the top bow
// (bow-war). The choice is namedModel below, asked before the sets' setModel by swordFor / staffFor / bowFor (80, 82, 83).
(function(){
const {V,lit,slab,tube,helix,spike,toward,noOL,pulseGlow,finish}=window.__setweapons.kit;
const NAMED_WEAPONS=['rootsplitter','last_lantern','subterfuge'];   // build 170: + Subterfuge, a bow (its model and power are 86i-subterfuge.js's)
const OWN={rootsplitter:'sword',last_lantern:'sword',subterfuge:'bow'}, TOP={sword:'holy',staff:'staff-battle',bow:'bow-war'};   // the hand each is made for; what any other hand holds instead
const jitter=(a,b,n,amp,seed)=>{ const pts=[]; for(let i=0;i<=n;i++){ const f=i/n; pts.push([a[0]+(b[0]-a[0])*f+Math.sin(i*2.7+seed)*amp,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f+Math.cos(i*1.9+seed)*amp]); } return pts; }
function leaf(m,x,y,z,rz,s){ const l=new THREE.Mesh(new THREE.OctahedronGeometry(.016*(s||1),0),m); l.scale.set(.5,1.5,.25); l.position.set(x,y,z); l.rotation.z=rz; return noOL(l); }
function shard(m,r,x,y,z,rz,sy){ const c=new THREE.Mesh(new THREE.OctahedronGeometry(r,0),m); c.scale.set(1,sy||1.8,.7); c.position.set(x,y,z); c.rotation.set(0,.4,rz||0); return c; }

// ---------------------------------------------------------------- ROOTSPLITTER: bark, vines, green crystal
const RS={bark:0x7e5634,bark2:0xa87e4a,barkDark:0x4a3020,vine:0x7f9f2a,vine2:0xb0cc44,glow:0x8cff40,glow2:0xd8ff7a,crys:0x6ae84a,crysDark:0x2fb02a};
function rootsplitter(){ const g=new THREE.Group(); g.name='named-rootsplitter'; const bark=mat(RS.bark), bark2=mat(RS.bark2), dark=mat(RS.barkDark);
  const crys=mat(RS.crys,{emissive:C(0x1e7010),flatShading:true}), crysD=mat(RS.crysDark,{emissive:C(0x0e5a0a),flatShading:true}), glowM=lit(RS.glow), glow2=lit(RS.glow2);   // (flat-shaded: the crystal's facets catch the light)
  const haft=[[0,.03,0],[.008,.2,0],[-.006,.4,0],[.007,.6,0],[-.004,.78,0],[.004,.9,0]];
  g.add(tube(haft,.034,bark,24)); g.add(M(G.sph(.034,8,6),bark,.004,.9,0));   // a gnarled branch for a haft
  for(let k=0;k<4;k++){ const a=k/4*TAU+.3; g.add(tube(haft.map(([x,y,z],i)=>[x+Math.sin(a)*.03+Math.sin(i*1.7+k)*.004,y,z+Math.cos(a)*.03]).slice(0,5),.009,k%2?dark:bark2,18)); }   // ridges of bark along it
  for(const [y,a] of [[.33,.8],[.55,-1.9],[.74,2.6]]) g.add(M(G.sph(.02,6,5),dark,Math.sin(a)*.03,y,Math.cos(a)*.03));   // knots
  for(const z of [.03,-.03]){ const t=tube(jitter([0,.12,z],[0,.84,z],12,.008,z>0?0:2),.0045,glowM,40); g.add(noOL(t)); }   // the green vein glowing in the bark's cracks, front and back
  g.add(tube(helix(.1,.88,.043,2.6,0,.006),.009,mat(RS.vine),60)); g.add(tube(helix(.16,.8,.041,1.9,2.2,.006),.007,mat(RS.vine2),48));   // vines wound up it
  for(const [y,a] of [[.2,.4],[.34,2.2],[.47,-1],[.6,1.3],[.72,3.4],[.83,-.3]]) g.add(leaf(glow2,Math.cos(a)*.056,y,Math.sin(a)*.056,a*.6-.5,1));   // bright leaves off the vines
  // the head: the haft bends over into a bark arm (the back), a crescent of crystal hangs from it for the edge
  g.add(slab([[-.03,.9],[-.012,.975],[.05,1.0],[.14,.995],[.23,.975],[.3,.945],[.335,.89],[.3,.83],[.24,.8],[.17,.785],[.1,.775],[.05,.775],[0,.785]],.054,bark));   // the bark arm the haft bends over into: the axe's back
  for(const z of [.029,-.029]){ g.add(tube([[-.02,.935,z],[.06,.985,z],[.16,.982,z],[.26,.95,z],[.31,.89,z]],.006,bark2,16)); g.add(noOL(tube([[.02,.87,z],[.08,.9,z],[.15,.905,z],[.22,.88,z],[.27,.85,z]],.005,glowM,16))); }   // its rim, and the vein running out into it
  g.add(tube([[0,.86,.03],[.05,.95,.03],[.13,.975,.02],[.2,.96,.0],[.26,.93,-.03]],.008,mat(RS.vine),16)); g.add(leaf(glow2,.12,1.0,.02,-1.2,1.1)); g.add(leaf(glow2,.27,.95,-.03,-2,1));   // a vine over the top of the head
  const CR_OUT=[[.25,.975],[.33,.955],[.39,.89],[.43,.8],[.445,.7],[.43,.6],[.39,.52],[.33,.46],[.26,.43]], CR_IN=[[.25,.47],[.27,.53],[.275,.6],[.26,.67],[.23,.73],[.19,.78],[.2,.84]];   // the crescent: its outer (cutting) edge, and the inner curve back up to the arm (the beard's point curls in toward the haft)
  g.add(slab(CR_OUT.concat(CR_IN),.04,crysD));   // the crystal blade, darker at heart
  g.add(noOL(slab(CR_OUT.concat(CR_OUT.slice(1,-1).reverse().map(([x,y])=>[x-.028-.01*Math.abs(y-.7),y+(y>.7?-.012:y<.62?.012:0)])),.046,glowM)));   // its edge, burning green
  for(const [x,y,r,rz] of [[.34,.94,.034,-.6],[.4,.87,.04,-1],[.43,.77,.042,-1.45],[.43,.66,.04,-1.9],[.4,.56,.036,-2.3],[.34,.48,.032,-2.6],[.33,.8,.034,-1.2],[.34,.66,.032,-1.7],[.3,.56,.03,-2.2]]) g.add(shard(crys,r,x,y,.013*((x*97|0)%2?1:-1),rz,1.9));   // faceted shards along it
  for(const [x,y,r,rz] of [[.37,.91,.02,-.7],[.41,.72,.022,-1.6],[.36,.52,.02,-2.4],[.3,.7,.018,-1.5]]) g.add(noOL(shard(glow2,r,x,y,.029,rz,1.6)));   // a few burning bright
  for(const [x,y,h] of [[.27,.43,.055],[.34,.47,.035],[.4,.54,.03]]) g.add(noOL(spike(.007,h,glowM,x,y-h/2,0,PI,0)));   // dripping from the point
  // the butt: a bark knob gripping a cluster of crystal
  g.add(M(G.sph(.045,8,6),bark,0,.03,0)); g.add(tube(helix(-.01,.07,.044,1.2,1,.004),.008,mat(RS.vine),16));
  for(const [x,y,z,rz,r] of [[.03,.01,.02,-.9,.024],[-.02,-.01,.025,.7,.022],[0,-.03,-.02,PI,.026],[.025,.05,-.03,-.4,.018]]) g.add(shard(crys,r,x,y,z,rz,1.7));
  g.add(noOL(shard(glow2,.014,.0,-.02,.035,2.8,1.5)));
  g.add(pulseGlow(RS.glow,.2,.3,.74,0)); g.add(pulseGlow(RS.glow,.12,0,.01,0));   // (small, like a sword's: held across the body)
  return finish(g,'named',new THREE.Box3(V(-.1,-.04,-.06),V(.42,1,.06)),.12,1.18); }

// ---------------------------------------------------------------- THE LAST LANTERN: dark wood, gold, silver, a lantern burning
const LL={shaft:0x2a1c16,gold:0xe0b040,gold2:0xb88a2a,silver:0xd4dae2,silver2:0xa8b2be,edge:0xf4f8fc,flame:0xffc040,hot:0xfff2c0,glow:0xffc84a};
function lastLantern(){ const g=new THREE.Group(); g.name='named-last_lantern'; const gold=mat(LL.gold), gold2=mat(LL.gold2), silver=mat(LL.silver), silver2=mat(LL.silver2);
  g.add(M(G.cyl(.026,.03,1.14,8),mat(LL.shaft),0,.63,0));   // the dark shaft
  g.add(tube(helix(.1,1.14,.03,4.2,0,0),.0045,gold,70)); g.add(tube(helix(.1,1.14,.03,4.2,PI,0),.0035,gold2,70));   // gold filigree wound up it
  for(const [y,h,r] of [[.1,.02,.036],[.4,.02,.036],[.5,.02,.036],[.78,.024,.036],[1.06,.02,.034]]) g.add(M(G.cyl(r,r,h,10),gold,0,y,0));   // gold rings
  { const k=M(G.sph(.042,10,8),gold,0,.45,0); k.scale.y=1.3; g.add(k); }   // the gold knot at the grip
  // the foot: a gold finial, a diamond point, a little star
  g.add(M(G.cyl(.034,.026,.06,8),gold,0,.05,0)); g.add(M(G.sph(.032,8,6),gold,0,.0,0));
  { const d=new THREE.Mesh(new THREE.OctahedronGeometry(.03,0),gold); d.scale.set(.8,2,.8); d.position.y=-.06; g.add(d); }
  for(const s of [-1,1]) g.add(spike(.01,.05,gold,s*.035,.0,0,0,-s*1.9));
  g.add(noOL(M(G.sph(.009,6,5),lit(LL.hot),0,.0,.03)));
  // the collar under the head
  g.add(M(G.cyl(.04,.03,.06,10),gold,0,1.17,0)); g.add(M(G.cyl(.052,.052,.018,12),gold2,0,1.205,0)); g.add(M(G.cyl(.045,.056,.04,12),gold,0,1.235,0));
  // the lantern: a gold cage round a burning core, amber glass, a cap and a finial
  const LY=1.34;
  { const core=M(G.sph(.058,12,10),lit(LL.flame),0,LY,0); core.scale.y=1.2; g.add(noOL(core)); g.add(noOL(M(G.sph(.034,8,6),lit(LL.hot),0,LY,0))); }
  g.add(noOL(M(G.sph(.078,12,10),basic(0xffd070,{transparent:true,opacity:.28,depthWrite:false}),0,LY,0)));   // the glass
  for(let i=0;i<6;i++){ const a=i/6*TAU; const c=Math.sin(a), s=Math.cos(a); g.add(tube([[c*.04,1.255,s*.04],[c*.078,1.29,s*.078],[c*.086,LY,s*.086],[c*.078,1.39,s*.078],[c*.04,1.43,s*.04]],.0065,gold,12)); }   // the cage's ribs
  { const r=new THREE.Mesh(new THREE.TorusGeometry(.086,.006,5,20),gold); r.rotation.x=PI/2; r.position.y=LY; g.add(r); }
  g.add(M(G.cyl(.03,.058,.035,12),gold,0,1.445,0)); g.add(M(G.cyl(.016,.03,.03,8),gold2,0,1.475,0));   // its cap
  // the spear point above it
  g.add(M(G.sph(.02,8,6),gold,0,1.5,0));
  g.add(slab([[0,1.505],[.028,1.55],[.02,1.59],[0,1.665],[-.02,1.59],[-.028,1.55]],.022,silver)); g.add(noOL(slab([[0,1.52],[.006,1.57],[0,1.645],[-.006,1.57]],.026,lit(LL.edge))));
  for(const s of [-1,1]) g.add(slab([[0,1.51],[s*.045,1.52],[s*.035,1.535],[0,1.53]],.012,gold));   // little gold wings at its base
  // the axe blade: a silver crescent out the front (+x), on a gold arm, a gold star engraved on it
  g.add(slab([[.02,1.31],[.08,1.3],[.13,1.32],[.17,1.35],[.17,1.4],[.13,1.42],[.08,1.43],[.02,1.415]],.02,gold));   // the arm
  g.add(tube([[.03,1.27,0],[.07,1.25,0],[.1,1.27,0],[.095,1.3,0]],.007,gold,12));   // a curl beneath it
  g.add(slab([[.2,1.62],[.25,1.58],[.29,1.52],[.315,1.45],[.325,1.37],[.315,1.28],[.29,1.2],[.25,1.14],[.2,1.1],[.215,1.16],[.225,1.22],[.23,1.29],[.23,1.36],[.225,1.44],[.215,1.51],[.205,1.57]],.02,silver));   // the crescent
  g.add(noOL(slab([[.25,1.58],[.29,1.52],[.315,1.45],[.325,1.37],[.315,1.28],[.29,1.2],[.25,1.14],[.262,1.19],[.29,1.26],[.302,1.37],[.294,1.46],[.275,1.52]],.024,mat(LL.edge,{emissive:C(0x5a6068)}))));   // its bright edge
  g.add(slab([[.16,1.34],[.23,1.33],[.23,1.43],[.16,1.42]],.024,gold2));   // where the arm grips the blade
  for(const z of [.013,-.013]){ const st=new THREE.Group(); st.position.set(.265,1.37,z); g.add(st);   // the engraved star, gold, a spark at its heart
    for(let i=0;i<4;i++){ const p=slab([[0,0],[.008,.008],[0,.045],[-.008,.008]],.003,gold); p.rotation.z=i*PI/2; st.add(noOL(p)); } st.add(noOL(M(G.sph(.007,6,5),lit(LL.hot),0,0,0))); }
  // the fluke out the back (-x), silver, swept out and down, on a gold bracket
  g.add(slab([[-.02,1.33],[-.07,1.315],[-.13,1.28],[-.19,1.23],[-.235,1.19],[-.2,1.23],[-.15,1.29],[-.1,1.335],[-.05,1.365],[-.02,1.37]],.018,silver2));
  g.add(noOL(slab([[-.13,1.28],[-.19,1.23],[-.235,1.19],[-.2,1.225],[-.14,1.275]],.022,mat(LL.edge,{emissive:C(0x5a6068)}))));
  g.add(tube([[-.02,1.3,0],[-.06,1.28,0],[-.08,1.3,0],[-.07,1.33,0]],.007,gold,12));
  for(const [x,y,z,s] of [[.07,1.45,.05,1],[-.08,1.4,-.04,.8],[.05,1.24,-.05,.7],[-.04,1.52,.04,.7]]){ const sp=new THREE.Mesh(new THREE.OctahedronGeometry(.012*s,0),lit(LL.hot)); sp.scale.set(.5,1.6,.5); sp.position.set(x,y,z); g.add(noOL(sp)); }   // sparks about the lantern
  g.add(pulseGlow(LL.glow,.6,0,LY,0));
  return finish(g,'named',new THREE.Box3(V(-.24,-.09,-.09),V(.33,1.665,.09)),.3,1.64); }

window.__weapons.register('named-rootsplitter',rootsplitter); window.__weapons.register('named-last_lantern',lastLantern);
// which model a named weapon shows, by the hand it's in: the Knight's sword mount holds its own model, a staff hand the top staff,
// a bow hand the top bow (see the head of this file). Asked first; anything that isn't a named weapon goes on to the sets' setModel.
// Build 170, the same rule in reverse for the bow: the Troll draws Subterfuge (bow-subterfuge), the Knight holds the top sword and the
// Witch and Fighter the top staff -- they get its stats, not its wedge (86i-subterfuge.js)
function namedId(it){ if(!it||it.slot!=='weapon'||!it.named) return null; const M=window.__mythic; const k=M&&M.id?M.id(it):String(it.named); return NAMED_WEAPONS.includes(k)?k:null; }
function namedModel(it,mount){ const k=namedId(it); if(!k) return null; const m=mount==='staff'||mount==='bow'?mount:'sword'; return m!==OWN[k]?TOP[m]:m==='bow'?'bow-'+k:'named-'+k; }
{ const setModel=window.__weapons.setModel; window.__weapons.setModel=(it,mount)=>namedModel(it,mount)||(setModel?setModel(it,mount):null); }
window.__named={ids:()=>NAMED_WEAPONS.slice(),id:namedId,model:namedModel,own:k=>OWN[k]||null};
})();
