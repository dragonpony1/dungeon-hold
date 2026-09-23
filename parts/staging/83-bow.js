// ===== BOWS: the archer's weapon, built in code like the staffs — five forge tiers and the Void bow — and the arrow it looses =====
// The stave runs up +Y from the lower tip at y=0 to the upper at y=1.5 and bows forward (+z); the string joins the tips, the
// grip wraps the belly, and the template says the fist closes halfway up (gripF .5) with the mount making it near body-length
// (lenScale .72: a longbow three-quarters the archer's height). Registered with the weapon mount as 'bow-<kind>' for a hero whose mount node is a bow mount. With a bow in
// hand a swing looses an arrow from the grip at the nearest mob in the cone within hero.reach; it flies flat and hurts the
// first mob it meets, or dies on a wall, the floor or at the end of its range.
(function(){
const BOW_KINDS={
  ash:  {name:'Ash Shortbow',    tier:1,wood:0x7a5a3a,dark:0x3a2716,band:0x8a6a3a,glow:null},
  yew:  {name:'Yew Longbow',     tier:2,wood:0x5a3f28,dark:0x2c1c10,band:0xb87333,glow:null},
  horn: {name:'Horn Recurve',    tier:3,wood:0x4a3a30,dark:0x2a2018,band:0xd8d0c0,glow:0x8dffa8},
  storm:{name:'Stormwood Bow',   tier:4,wood:0x2e2a3a,dark:0x1a1722,band:0xc0c8d8,glow:0x3d8bff},
  war:  {name:'Troll War Bow',   tier:5,wood:0x3a2416,dark:0x22150c,band:0xe0b040,glow:0xffd060},
  void: {name:'Bow of the Void', tier:5,wood:0x1a1226,dark:0x0d0914,band:0x8a3cff,glow:0x9a30ff}};
const zAt=y=>{ const t=y/1.5; return .34*2*(1-t)*t; };   // where the stave sits (its bow forward) at a height
function makeBow(kind){ const K=BOW_KINDS[kind]||BOW_KINDS.ash; const g=new THREE.Group(); g.name='bow-'+kind; const wood=mat(K.wood), dark=mat(K.dark), band=mat(K.band);
  const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,0,0),new THREE.Vector3(0,.75,.34),new THREE.Vector3(0,1.5,0));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve,20,.026,6,false),wood));                                    // the stave
  g.add(M(G.cyl(.04,.04,.24,8),dark,0,.75,zAt(.75)));                                                          // the leather grip at the belly
  for(const y of [.6,.9]) g.add(M(G.cyl(.036,.036,.02,8),band,0,y,zAt(y)));                                     // bands at the grip's ends
  for(const y of [.14,1.36]) g.add(M(G.cyl(.03,.03,.03,8),band,0,y,zAt(y)));                                    // and near the tips
  g.add(M(G.cyl(.005,.005,1.5,4),dark,0,.75,0));                                                                // the string, tip to tip
  for(const y of [0,1.5]) g.add(M(G.sph(.03,6,5),band,0,y,0));                                                  // the nocks
  if(K.glow){ const gl=glow(K.glow,.9,.7); gl.name='glow'; gl.position.set(0,.75,zAt(.75)); g.add(gl); for(let i=0;i<3;i++){ const y=.3+i*.1; const r=M(G.box(.012,.06,.008),basic(K.glow),0,y,zAt(y)+.028); r.userData.noOL=true; r.name='rune'+i; g.add(r); } }   // a magic bow glows at the grip and carries runes down the lower limb
  const grip=new THREE.Object3D(); grip.name='bowGrip'; grip.position.set(0,.75,zAt(.75)); g.add(grip);        // where an arrow leaves
  g.userData.box=new THREE.Box3(new THREE.Vector3(-.06,-.03,-.03),new THREE.Vector3(.06,1.53,.4)); g.userData.gripF=.5; g.userData.lenScale=.72; g.userData.proc=true; g.userData.kind=kind; g.userData.bowKind=K; return g; }
// which bow a weapon item shows: the tier picks the forge bow, the Void set its own
function bowFor(it){ if(!it) return 'bow-ash'; const pk=Meta.packs&&Meta.packs.of(it); if(pk&&pk.models&&pk.models.bow) return pk.models.bow; if(pk&&/void/i.test(pk.name||pk.id||'')) return 'bow-void'; const t=Math.max(1,Math.min(5,it.tier||tierOf(it.lvl||1))); return 'bow-'+['ash','yew','horn','storm','war'][t-1]; }
// ---- the arrow: a shaft with a steel head and fletching in the bow's colour, flying flat ----
const ARROWS=[];
function makeArrow(K){ const g=new THREE.Group(); const shaft=M(G.cyl(.022,.026,1.1,6),mat(0x8a6a3a),0,0,0); shaft.rotation.x=PI/2; g.add(shaft); const head=M(G.cone(.055,.18,6),mat(0xb0b8c8),0,0,.63); head.rotation.x=PI/2; g.add(head);
  for(const sx of [-1,1]){ g.add(M(G.box(.02,.1,.18),mat(K.glow||0xe0d0b0),sx*.035,0,-.44)); } g.add(M(G.box(.1,.02,.18),mat(K.glow||0xe0d0b0),0,.035,-.44)); if(K.glow){ const gl=glow(K.glow,.8,.6); gl.position.z=.5; g.add(gl); }
  g.traverse(m=>{ if(m.isMesh) m.userData.noOL=true; }); return g; }
function fireArrow(kind,from,dir,speed,opts){ opts=opts||{}; const K=BOW_KINDS[kind]||BOW_KINDS.ash; const g=makeArrow(K); g.position.copy(from); const d=dir.clone().normalize(); g.lookAt(from.clone().add(d)); scene.add(g); ARROWS.push({g,d,v:speed||38,t:0,life:opts.life||1.2,x:from.x,y:from.y,z:from.z,dmg:opts.dmg||0,hit:new Set(),kind}); return g; }
function arrowsUpdate(dt){ for(let i=ARROWS.length-1;i>=0;i--){ const a=ARROWS[i]; a.t+=dt; const step=a.v*dt; const nx=a.x+a.d.x*step, ny=a.y+a.d.y*step, nz=a.z+a.d.z*step;
    if(wallAt(nx,nz)||ny<=baseFloor(nx,nz)+.05||ny>WALLH||a.t>=a.life){ scene.remove(a.g); ARROWS.splice(i,1); continue; } a.x=nx; a.y=ny; a.z=nz; a.g.position.set(nx,ny,nz);
    if(a.dmg){ for(const e of enemies){ if(e.dead||a.hit.has(e)) continue; if(Math.hypot(e.x-nx,e.z-nz)<e.r+.45&&ny>e.y-.4&&ny<e.y+e.h+.6){ a.hit.add(e); hurt(e,a.dmg,a.d.x*1.2,a.d.z*1.2); SFX.hit(); scene.remove(a.g); ARROWS.splice(i,1); break; } } } } }   // an arrow stops in the first mob it meets
function gripWorld(g){ return (g.getObjectByName('bowGrip')||g).getWorldPosition(new THREE.Vector3()); }
// the archer's attack: with a bow in hand a swing looses an arrow instead of sweeping the sword's cone (the staff's wrapper sits under this one)
{ const prevHit=hitCone; hitCone=function(){ const wo=window.__weapons.mounted(); if(!(wo&&/^bow-/.test(wo.name))) return prevHit(); const from=gripWorld(wo); const fx=Math.sin(hero.yaw), fz=Math.cos(hero.yaw); const range=hero.reach||12; let best=null, bd=1e9;
    for(const e of enemies){ if(e.dead) continue; const dx=e.x-hero.x, dz=e.z-hero.z, d=Math.hypot(dx,dz); if(d>range+e.r||d<.01||(dx*fx+dz*fz)/d<.75) continue; if(d<bd){ bd=d; best=e; } }
    const dir=best?new THREE.Vector3(best.x-from.x,(best.y+best.h*.5)-from.y,best.z-from.z):new THREE.Vector3(fx,-.01,fz);
    fireArrow(wo.userData.kind,from,dir,38,{dmg:heroDmg(),life:(range+1)/38}); SFX.harpoon(); }; }
// a bow is always held upright and facing the way the archer faces, wherever the hand is: the mount's own turn (measured for a
// staff hanging at the hip) would lay it flat when the arm comes up to aim. Each frame the mounted bow is re-aimed in world space
// and slid so its grip stays in the fist.
const _pq=new THREE.Quaternion(), _q=new THREE.Quaternion(), _e=new THREE.Euler(), _g=new THREE.Vector3();
function holdBow(wo){ const sd=wo.userData.sword; if(!sd||!wo.parent) return; wo.parent.getWorldQuaternion(_pq); _q.setFromEuler(_e.set(0,hero.yaw+(typeof heroYawOff==='number'?heroYawOff:0),0)); wo.quaternion.copy(_pq.invert()).multiply(_q); _g.set(0,sd.gripY*sd.scale,0).applyQuaternion(wo.quaternion); wo.position.copy(_g).negate(); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); arrowsUpdate(dt); const wo=window.__weapons.mounted(); if(wo&&/^bow-/.test(wo.name)) holdBow(wo); }; }
Object.keys(BOW_KINDS).forEach(k=>{ window.__weapons.register('bow-'+k,()=>makeBow(k)); });   // served by the weapon mount like a loaded sword
window.__bow={kinds:()=>Object.keys(BOW_KINDS),info:k=>Object.assign({kind:k},BOW_KINDS[k]),make:makeBow,bowFor,arrows:()=>ARROWS.length,
  fireFromHand:(dx,dy,dz)=>{ const wo=window.__weapons.mounted(); if(!(wo&&/^bow-/.test(wo.name))) return null; return fireArrow(wo.userData.kind,gripWorld(wo),new THREE.Vector3(dx,dy||0,dz),38); }};
})();
