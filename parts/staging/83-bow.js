// ===== BOWS: the archer's weapon, built in code like the staffs — five forge tiers and the Void bow — and the arrow it looses =====
// The stave runs up +Y from the lower tip at y=0 to the upper at y=L (1.5 × the kind's len: a shortbow is short, a war bow
// tall) and bows forward (+z), a recurve curling its tips back; the string joins the tips, the grip wraps the belly, and the
// template says the fist closes halfway up (gripF .5) with the mount making it about three-quarters the archer's height
// (lenScale .72 × len). Each kind has its own fittings: horn knobs, leather wraps, horn plates, gold caps, runes, a crystal
// in the belly with motes about it, a gold halo, void shards, a string that burns. Registered with the weapon mount as 'bow-<kind>' for a hero whose mount node is a bow mount. With a bow in
// hand a swing looses an arrow from the grip at the nearest mob in the cone within hero.reach; it flies flat and hurts the
// first mob it meets, or dies on a wall, the floor or at the end of its range.
(function(){
const BOW_KINDS={
  ash:  {name:'Ash Shortbow',    tier:1,len:.82, wood:0x7a5a3a,dark:0x3a2716,band:0x8a6a3a,glow:null,    tips:'horn'},
  yew:  {name:'Yew Longbow',     tier:2,len:1.02,wood:0x5a3f28,dark:0x2c1c10,band:0xb87333,glow:null,    tips:'horn',wraps:true},
  horn: {name:'Horn Recurve',    tier:3,len:.92, wood:0x4a3a30,dark:0x2a2018,band:0xd8d0c0,glow:0x8dffa8,tips:'horn',recurve:true,plates:true,runes:true},
  storm:{name:'Stormwood Bow',   tier:4,len:1.0, wood:0x2e2a3a,dark:0x1a1722,band:0xc0c8d8,glow:0x3d8bff,tips:'gold',gem:0x7fbbff,motes:3,runes:true,litString:true},
  war:  {name:'Troll War Bow',   tier:5,len:1.06,wood:0x3a2416,dark:0x22150c,band:0xe0b040,glow:0xffd060,tips:'gold',gem:0xfff2c0,motes:4,halo:true,recurve:true,litString:true},
  void: {name:'Bow of the Void', tier:5,len:1.0, wood:0x1a1226,dark:0x0d0914,band:0x8a3cff,glow:0x9a30ff,tips:'crystal',gem:0xd070ff,motes:3,shards:3,litString:true}};
// the stave's line: a plain bow is one arc bowing forward (+z); a recurve curls its tips back (-z) past the string
function staveCurve(L,recurve){ const k=L/1.5; if(!recurve) return new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,0,0),new THREE.Vector3(0,L/2,.34*k*2),new THREE.Vector3(0,L,0));   // control point at 2× the bulge: the curve peaks at .34
  const pts=[[0,-.10],[.1,.03],[.3,.25],[.5,.34],[.7,.25],[.9,.03],[1,-.10]].map(([u,z])=>new THREE.Vector3(0,u*L,z*k)); return new THREE.CatmullRomCurve3(pts,false,'catmullrom',.5); }
function makeBow(kind){ const K=BOW_KINDS[kind]||BOW_KINDS.ash; const g=new THREE.Group(); g.name='bow-'+kind; const wood=mat(K.wood), dark=mat(K.dark), band=mat(K.band), bright=h=>basic(h); const L=1.5*(K.len||1); const curve=staveCurve(L,K.recurve); const P=u=>curve.getPoint(u);
  const at=(mesh,u,dz)=>{ const p=P(u); mesh.position.set(0,p.y,p.z+(dz||0)); return mesh; };
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve,28,.026,6,false),wood));                                                           // the stave
  g.add(at(M(G.cyl(.04,.04,.24,8),dark),.5)); for(const u of [.46,.5,.54]) g.add(at(M(G.cyl(.043,.043,.014,8),band),u));                 // the leather grip and its three rings
  for(const u of [.08,.92]) g.add(at(M(G.cyl(.03,.03,.03,8),band),u));                                                                   // bands near the tips
  if(K.wraps) for(const u of [.24,.76]) g.add(at(M(G.cyl(.032,.032,.1,8),dark),u));                                                       // leather wraps down the limbs
  if(K.plates) for(const u of [.15,.22,.29,.71,.78,.85]) g.add(at(M(G.cyl(.031,.031,.035,8),band),u));                                    // horn plates
  const tipMat=K.tips==='gold'?band:K.tips==='crystal'?bright(K.gem):band; for(const u of [0,1]){ let t; if(K.tips==='gold'){ t=M(G.cone(.03,.09,6),band); t.rotation.x=u?0:PI; } else if(K.tips==='crystal'){ t=new THREE.Mesh(new THREE.OctahedronGeometry(.035,0),tipMat); t.scale.set(1,1.8,1); t.userData.noOL=true; } else t=M(G.sph(.03,6,5),band); g.add(at(t,u,0)); }   // the nocks: horn knobs, gold caps or void crystals
  const zs=P(0).z; for(const i of [0,1]){ const str=M(G.cyl(K.litString?.007:.005,K.litString?.007:.005,1,4),K.litString?bright(K.glow):dark); str.name='string'+i; if(K.litString) str.userData.noOL=true; g.add(str); }   // the string in two halves, tip to nock, so a draw pulls it back (a magic bow's burns)
  const nocked=makeArrow(K,true); nocked.name='nocked'; nocked.visible=false; g.add(nocked);                                              // the arrow on the string while the archer draws
  if(K.runes) for(let i=0;i<3;i++){ const r=at(M(G.box(.012,.06,.008),bright(K.glow)),.28+i*.06,.028); r.userData.noOL=true; r.name='rune'+i; g.add(r); }   // runes down the lower limb
  const gp=P(.5); if(K.gem){ const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.045,0),bright(K.gem)); gem.name='gem'; gem.scale.set(1,1.6,1); gem.position.set(0,gp.y,gp.z+.075); gem.userData.noOL=true; g.add(gem); }   // a crystal set in the belly
  if(K.glow){ const gl=glow(K.glow,K.gem?1.1:.8,.75); gl.name='glow'; gl.position.set(0,gp.y,gp.z+.06); g.add(gl); }
  for(let i=0;i<(K.motes||0);i++){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(.02,0),bright(K.glow)); m.name='mote'+i; m.userData.noOL=true; g.add(m); }   // motes that orbit the grip
  if(K.halo){ const h=new THREE.Mesh(new THREE.TorusGeometry(.12,.011,6,24),bright(K.band)); h.name='halo'; h.userData.noOL=true; h.rotation.x=PI/2; h.position.set(0,gp.y,gp.z); g.add(h); }   // a gold halo about the grip
  for(let i=0;i<(K.shards||0);i++){ const sh=new THREE.Mesh(new THREE.OctahedronGeometry(.03,0),mat(K.dark)); sh.name='shard'+i; sh.scale.set(1,2.2,1); g.add(sh); }   // dark shards adrift along the limbs
  const grip=new THREE.Object3D(); grip.name='bowGrip'; grip.position.set(0,gp.y,gp.z); g.add(grip);                                    // where an arrow leaves
  g.userData.box=new THREE.Box3(new THREE.Vector3(-.12,-.05,-.15),new THREE.Vector3(.12,L+.05,.45)); g.userData.gripF=.5; g.userData.lenScale=.72*(K.len||1); g.userData.proc=true; g.userData.kind=kind; g.userData.bowKind=K; g.userData.L=L; g.userData.zs=zs; setDraw(g,0); return g; }
// the string's pull: 0 at brace, 1 at full draw — the halves meet at the nock, and the nocked arrow shows while drawing
const _Y=new THREE.Vector3(0,1,0), _nock=new THREE.Vector3(), _tip=new THREE.Vector3(), _dir=new THREE.Vector3();
function setDraw(root,pull){ const L=root.userData.L||1.5, zs=root.userData.zs||0; _nock.set(0,L/2,zs-pull*.42); for(const i of [0,1]){ const st=root.getObjectByName('string'+i); if(!st) continue; _tip.set(0,i?L:0,zs); _dir.copy(_nock).sub(_tip); const len=_dir.length(); st.position.copy(_tip).lerp(_nock,.5); st.scale.set(1,len,1); st.quaternion.setFromUnitVectors(_Y,_dir.normalize()); } const n=root.getObjectByName('nocked'); if(n){ n.visible=pull>.05; n.position.set(0,L/2,_nock.z+ARROW_L/2); } }
// the moving bits, found by name so a mounted clone keeps them (clones lose userData functions)
const ANIMS=new WeakMap();
function animFor(root){ let a=ANIMS.get(root); if(a) return a; const by=n=>root.getObjectByName(n); const gem=by('gem'), gl=by('glow'), halo=by('halo'), str=by('string0'), str1=by('string1'), grip=by('bowGrip'); const L=root.userData.L||1.5; const motes=[],shards=[]; for(let i=0;i<4;i++){ if(by('mote'+i)) motes.push({m:by('mote'+i),a:i/4*TAU,r:.11+.03*(i%2)}); if(by('shard'+i)) shards.push({s:by('shard'+i),u:.22+i*.28,ph:i*2.1}); } let t=rnd()*6; const gx=grip?grip.position:new THREE.Vector3(0,L/2,.34);
  a=dt=>{ t+=dt; if(gem) gem.rotation.y+=dt*1.4; if(gl) gl.material.opacity=.55+.25*Math.sin(t*4); if(halo) halo.rotation.y+=dt*.8; if(str) str.material.opacity=.7+.3*Math.sin(t*6); if(str1) str1.material.opacity=str.material.opacity; motes.forEach(o=>{ o.a+=dt*2.0; o.m.position.set(Math.sin(o.a)*o.r,gx.y+Math.sin(t*3+o.a)*.03,gx.z+Math.cos(o.a)*o.r); o.m.rotation.y=o.a; }); shards.forEach(o=>{ const y=o.u*L+Math.sin(t*1.3+o.ph)*.05; o.s.position.set(Math.sin(t*.9+o.ph)*.09,y,gx.z*.6+Math.cos(t*.9+o.ph)*.05); o.s.rotation.set(Math.sin(t+o.ph)*.3,t*.7,.3); }); };
  ANIMS.set(root,a); return a; }
// which bow a weapon item shows: the tier picks the forge bow, the Void set its own
function bowFor(it){ if(!it) return 'bow-ash'; const pk=Meta.packs&&Meta.packs.of(it); if(pk&&pk.models&&pk.models.bow) return pk.models.bow; if(pk&&/void/i.test(pk.name||pk.id||'')) return 'bow-void'; const t=Math.max(1,Math.min(5,it.tier||tierOf(it.lvl||1))); return 'bow-'+['ash','yew','horn','storm','war'][t-1]; }
// ---- the arrow: a shaft with a steel head and fletching in the bow's colour, flying flat ----
const ARROWS=[];
const ARROW_L=1.4, ARROW_V=30;
function makeArrow(K,nocked){ const g=new THREE.Group(); const fl=K.glow||0xe8d8b0; const shaft=M(G.cyl(.03,.036,ARROW_L,6),mat(0x8a6a3a),0,0,0); shaft.rotation.x=PI/2; g.add(shaft); const head=M(G.cone(.075,.24,6),mat(0xb0b8c8),0,0,ARROW_L/2+.1); head.rotation.x=PI/2; g.add(head);
  for(const sx of [-1,1]){ g.add(M(G.box(.025,.13,.24),mat(fl),sx*.045,0,-ARROW_L/2+.16)); } g.add(M(G.box(.13,.025,.24),mat(fl),0,.045,-ARROW_L/2+.16));
  if(!nocked){ const gl=glow(K.glow||0xffe0a0,1.1,.7); gl.position.z=ARROW_L/2; g.add(gl); const tr=M(G.box(.06,.06,1.6),basic(fl,{transparent:true,opacity:.45}),0,0,-ARROW_L/2-.7); g.add(tr); }   // a flying arrow carries a glow at the head and a streak behind
  g.traverse(m=>{ if(m.isMesh) m.userData.noOL=true; }); return g; }
function fireArrow(kind,from,dir,speed,opts){ opts=opts||{}; const K=BOW_KINDS[kind]||BOW_KINDS.ash; const g=makeArrow(K); g.position.copy(from); const d=dir.clone().normalize(); g.lookAt(from.clone().add(d)); scene.add(g); ARROWS.push({g,d,v:speed||ARROW_V,t:0,life:opts.life||1.2,x:from.x,y:from.y,z:from.z,dmg:opts.dmg||0,hit:new Set(),kind}); return g; }
function arrowsUpdate(dt){ for(let i=ARROWS.length-1;i>=0;i--){ const a=ARROWS[i]; a.t+=dt; const step=a.v*dt; const nx=a.x+a.d.x*step, ny=a.y+a.d.y*step, nz=a.z+a.d.z*step;
    if(wallAt(nx,nz)||ny<=baseFloor(nx,nz)+.05||ny>WALLH||a.t>=a.life){ scene.remove(a.g); ARROWS.splice(i,1); continue; } a.x=nx; a.y=ny; a.z=nz; a.g.position.set(nx,ny,nz);
    if(a.dmg){ for(const e of enemies){ if(e.dead||a.hit.has(e)) continue; if(Math.hypot(e.x-nx,e.z-nz)<e.r+.45&&ny>e.y-.4&&ny<e.y+e.h+.6){ a.hit.add(e); hurt(e,a.dmg,a.d.x*1.2,a.d.z*1.2); SFX.hit(); scene.remove(a.g); ARROWS.splice(i,1); break; } } } } }   // an arrow stops in the first mob it meets
function gripWorld(g){ return (g.getObjectByName('bowGrip')||g).getWorldPosition(new THREE.Vector3()); }
// the archer's attack: with a bow in hand a swing looses an arrow instead of sweeping the sword's cone (the staff's wrapper sits under this one)
{ const prevHit=hitCone; hitCone=function(){ const wo=window.__weapons.mounted(); if(!(wo&&/^bow-/.test(wo.name))) return prevHit(); const from=gripWorld(wo); const fx=Math.sin(hero.yaw), fz=Math.cos(hero.yaw); const range=hero.reach||12; let best=null, bd=1e9;
    for(const e of enemies){ if(e.dead) continue; const dx=e.x-hero.x, dz=e.z-hero.z, d=Math.hypot(dx,dz); if(d>range+e.r||d<.01||(dx*fx+dz*fz)/d<.75) continue; if(d<bd){ bd=d; best=e; } }
    const dir=best?new THREE.Vector3(best.x-from.x,(best.y+best.h*.5)-from.y,best.z-from.z):new THREE.Vector3(fx,-.01,fz);
    fireArrow(wo.userData.kind,from,dir,ARROW_V,{dmg:heroDmg(),life:(range+1)/ARROW_V}); SFX.harpoon(); }; }
// a bow is always held upright and facing the way the archer faces, wherever the hand is: the mount's own turn (measured for a
// staff hanging at the hip) would lay it flat when the arm comes up to aim. Each frame the mounted bow is re-aimed in world space
// and slid so its grip (the stave's belly, ahead of the string) stays in the fist.
const _pq=new THREE.Quaternion(), _q=new THREE.Quaternion(), _e=new THREE.Euler(), _g=new THREE.Vector3();
const GRIPS=new WeakMap();   // each mounted bow's grip node (its belly, where the fist closes on the stave — not the string line)
function holdBow(wo){ const sd=wo.userData.sword; if(!sd||!wo.parent) return; wo.parent.getWorldQuaternion(_pq); _q.setFromEuler(_e.set(0,hero.yaw,0)); wo.quaternion.copy(_pq.invert()).multiply(_q);
  let gp=GRIPS.get(wo); if(gp===undefined){ gp=wo.getObjectByName('bowGrip')||null; GRIPS.set(wo,gp); } if(gp) _g.copy(gp.position).multiplyScalar(sd.scale); else _g.set(0,sd.gripY*sd.scale,0); _g.applyQuaternion(wo.quaternion); wo.position.copy(_g).negate(); }
const PLANTED=[];
function plantBow(kind,x,z,yaw,scale){ const g=makeBow(kind); const s=scale||1.5; g.scale.setScalar(s); g.position.set(x,baseFloor(x,z)+.05*s,z); g.rotation.y=yaw||0; outline(g); scene.add(g); PLANTED.push(g); return g; }
// the archer shoots side-on: the Meshy archery clip aims 90° left of the body (as a real archer stands), so while the shot
// plays the body turns 90° (heroYawOff, the model's turn about the hero's facing; the sign was found by measuring the arm) and the bow arm points down the aim;
// the string is drawn back with an arrow on it until the release, when the real arrow flies
const ATTACK_TURN=-PI/2; let DRAW=0;
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); arrowsUpdate(dt); const wo=window.__weapons.mounted(); const bow=!!(wo&&/^bow-/.test(wo.name)); const swinging=bow&&hero.swingT>=0&&!(hero.dead>0);
    if(bow||heroYawOff!==0) heroYawOff=angLerp(heroYawOff,swinging?ATTACK_TURN:0,1-Math.exp(-14*dt));
    if(bow){ holdBow(wo); animFor(wo)(dt); const drawing=swinging&&hero.swingT<swingDur()*hitFrac(); DRAW=lerp(DRAW,drawing?1:0,1-Math.exp(-(drawing?16:40)*dt)); setDraw(wo,DRAW); } PLANTED.forEach(p=>animFor(p)(dt)); }; }
Object.keys(BOW_KINDS).forEach(k=>{ window.__weapons.register('bow-'+k,()=>makeBow(k)); });   // served by the weapon mount like a loaded sword
window.__bow={kinds:()=>Object.keys(BOW_KINDS),info:k=>Object.assign({kind:k},BOW_KINDS[k]),make:makeBow,bowFor,arrows:()=>ARROWS.length,plant:plantBow,planted:()=>PLANTED.length,clear:()=>{ PLANTED.forEach(g=>scene.remove(g)); PLANTED.length=0; },
  fire:(g,dx,dy,dz)=>fireArrow(g.userData.kind,gripWorld(g),new THREE.Vector3(dx,dy||0,dz),ARROW_V),
  fireFromHand:(dx,dy,dz)=>{ const wo=window.__weapons.mounted(); if(!(wo&&/^bow-/.test(wo.name))) return null; return fireArrow(wo.userData.kind,gripWorld(wo),new THREE.Vector3(dx,dy||0,dz),ARROW_V); },draw:()=>+DRAW.toFixed(2),turn:()=>+heroYawOff.toFixed(2)};
})();
