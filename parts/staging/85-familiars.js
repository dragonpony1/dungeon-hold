// ===== FAMILIARS v2: the six Meshy familiars replace the procedural pets, and each fights its own way =====
//   Wisp — quick spark bolts.            Cave Bat — swoops out and bites, then flaps back to your shoulder.
//   Moss Sprite — lobs seed pods that burst into a spore cloud: everything in it crawls.
//   Fire Imp — fireballs that splash and leave the target burning.
//   Crystal Owl — a beam that chains through up to three mobs.   Storm Drake — lightning that forks into the pack.
// Models come from assets/ (fam-*.glb); until one arrives (or in a single-file build) the procedural pet stands in.
(function(){
const FAM_FILES={'Wisp':'fam-wisp.glb','Bat':'fam-bat.glb','Sprite':'fam-sprite.glb','Fire Imp':'fam-imp.glb','Crystal Owl':'fam-owl.glb','Storm Drake':'fam-drake.glb'};
const FAM_H={'Wisp':.8,'Bat':.7,'Sprite':.8,'Fire Imp':.85,'Crystal Owl':.8,'Storm Drake':1.2};   // build 248: the new drake is 2.0 tall with its tail hanging, 1.8 across the wings: 1.2 tall keeps a wingspan a little over the old one's   // world height of the pet
// per-kind tuning: fire-rate and damage multipliers on the item's stats, plus what the attack does
const FAM_KIND={
  'Wisp':        {rate:1.0,dmg:1.0,desc:'spark bolts'},
  'Bat':         {rate:.55,dmg:1.7,desc:'swoops and bites · bloody'},
  'Sprite':      {rate:.8, dmg:.5, desc:'dual thorn darts · each slows',slow:1.2,r:1.0},   // build 242 (Matt: "the sprite will be shooting dual thorn darts"): two thorns a shot, each hitting for .5 pet damage in a 1-unit puff (was one seed pod, .6 in a 1.6 spore cloud)
  'Fire Imp':    {rate:.7, dmg:.9, desc:'dives and drops molten lava · burning pools',splash:1.3,burn:3,burnDmg:.25},
  'Crystal Owl': {rate:.9, dmg:.8, desc:'beam chains to 3 mobs',hops:2,chain:.7,reach:4},
  'Storm Drake': {rate:.5, dmg:1.4,desc:'lightning forks into the pack',fork:.8,r:1.8}};
const FAM_GLB={}; const famFx=[]; const famShots=[]; let swoop=null; const burnFx=new Map();
function kindOf(){ return fam?fam.g.userData.kind:'Wisp'; }
function K(){ return FAM_KIND[kindOf()]||FAM_KIND.Wisp; }
function dmgOf(m){ return Math.max(.1,Math.round(famDmg()*m*10)/10); }
// ---- models ----
// a familiar's model is fetched the first time one of that kind is called for (the pet stands in procedurally until it lands), not all six at start
const FAM_ASKED={};
function ensureFam(k){ if(!FAM_FILES[k]||FAM_ASKED[k]) return; FAM_ASKED[k]=true; fetchBytes(ASSET(FAM_FILES[k]),'first').then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{ const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,FAM_H[k]); toonify(root,fit.scale); const w=fit.wrap; w.children[0].position.y-=FAM_H[k]*.5; FAM_GLB[k]=w;
    if(fam&&fam.g.userData.kind===k&&!fam.g.userData.glb) famRemove(); }catch(e){ console.warn('familiar model '+k,e); } },e=>console.warn('familiar model '+k,e))).catch(e=>console.warn('familiar model '+k,e)); }   // the pet respawns next frame with the real model
// build 215 (Matt: "the wisp in game has been named bramblewhisk when we have an all new model and thumbs for bramblewhisk"): a named pet wears its
// own body -- the same real model its floor stand shows (93c-weaponstand.js NAMED_REAL) -- instead of the Wisp's it used to borrow (famKind reads
// words in the name, and neither name has one, so both fell back to 'Wisp'). How it fights doesn't change: kind stays what famKind says
const NAMED_PET={bramblewhisk:{file:'named-bramblewhisk.glb',h:.8,desc:'thorn shots'},old_lamplight:{file:'named-old_lamplight.glb',h:.85,desc:'lantern sparks'},gladehart:{file:'named-gladehart.glb',h:.9,desc:'spirit stag charge'},trimaw:{file:'named-trimaw.glb',h:.85,desc:'fire, frost and venom breaths'}};
const NP_GLB={}, NP_ASKED={};
function namedPet(it){ return it&&typeof it.named==='string'&&Object.prototype.hasOwnProperty.call(NAMED_PET,it.named)?it.named:null; }   // own keys only: a partner's look names it over the wire (co-op sweep 2026-10-02)
function ensureNamedPet(k){ if(NP_ASKED[k]) return; NP_ASKED[k]=true; const c=NAMED_PET[k]; fetchBytes(ASSET(c.file),'soon').then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{ const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,c.h); toonify(root,fit.scale); const w=fit.wrap; w.children[0].position.y-=c.h*.5; NP_GLB[k]=w;
    if(fam&&fam.g.userData.named!==k&&namedPet(gear.familiar)===k) famRemove(); }catch(e){ console.warn('named pet '+k,e); } },e=>console.warn('named pet '+k,e))).catch(e=>console.warn('named pet '+k,e)); }   // the pet respawns next frame in its own body
// the Wisp's own look (its Celestial Projectile and burst, below) is for the Wisp itself, not a named pet that happens to fight like one
function trueWisp(){ return !!(fam&&fam.g.userData.kind==='Wisp'&&!namedPet(gear.familiar)); }
const famModelProc=famModel;
famModel=function(it){ const nk=namedPet(it); if(nk){ ensureNamedPet(nk); const N=NP_GLB[nk]; if(N){ const g=N.clone(); const col=RCOL[it.rarity]||0xcfcfcf; const gl=glow(col,1.0,.4); gl.position.y=-.05; g.add(gl); const root=new THREE.Group(); root.add(g); root.userData={wings:[],motes:[],kind:famKind(it),glb:true,named:nk}; return root; } }   // until its own body lands it wears the stand-in below
  const kind=famKind(it); ensureFam(kind); const T=FAM_GLB[kind]; if(!T) return famModelProc(it); const g=T.clone(); const col=RCOL[it.rarity]||0xcfcfcf; const gl=glow(col,1.0,.4); gl.position.y=-.05; g.add(gl);   // rarity shows as the halo under the pet
  const root=new THREE.Group(); root.add(g); root.userData={wings:[],motes:[],kind,glb:true}; return root; };
const famRemoveProc=famRemove;
famRemove=function(){ if(fam&&fam.g.userData.glb){ scene.remove(fam.g); fam.g.traverse(m=>{ if(m.isSprite&&m.material) m.material.dispose(); }); fam=null; famClearBolts(); } else famRemoveProc(); swoop=null; };   // shared model geometry stays
const famRateProc=famRate; famRate=function(){ return famRateProc()/K().rate; };
// ---- effects: short-lived glowing segments (beams, lightning) that fade out ----
const SEG_GEO=new THREE.CylinderGeometry(1,1,1,5); const UP=new THREE.Vector3(0,1,0);
function seg(a,b,r,mt){ const d=new THREE.Vector3().subVectors(b,a); const L=d.length()||1e-3; const m=new THREE.Mesh(SEG_GEO,mt); m.userData.noOL=true; m.position.copy(a).addScaledVector(d,.5); m.scale.set(r,L,r); m.quaternion.setFromUnitVectors(UP,d.normalize()); return m; }
function fx(build,life){ const g=new THREE.Group(); const mt=basic(0xffffff,{transparent:true,opacity:1,depthWrite:false}); build(g,mt); scene.add(g); famFx.push({g,mt,t:0,life}); }
function bolt(a,b,col,r,jag){ fx((g,mt)=>{ mt.color.set(col); let p=a.clone(); const n=jag?6:1; for(let i=1;i<=n;i++){ const q=i===n?b.clone():a.clone().lerp(b,i/n); if(jag&&i<n){ q.x+=(rnd()-.5)*.5; q.y+=(rnd()-.5)*.4; q.z+=(rnd()-.5)*.5; } g.add(seg(p,q,r,mt)); p=q; } const s=glow(col,jag?1.8:1.1,.9); s.position.copy(b); g.add(s); },jag?.28:.32); }
function famFxUpdate(dt){ for(let i=famFx.length-1;i>=0;i--){ const f=famFx[i]; f.t+=dt; const k=1-f.t/f.life; if(k<=0){ scene.remove(f.g); f.mt.dispose(); f.g.traverse(o=>{ if(o.isSprite) o.material.dispose(); }); famFx.splice(i,1); continue; } f.mt.opacity=k; f.g.traverse(o=>{ if(o.isSprite) o.material.opacity=.9*k; }); } }
// ---- projectiles with weight (seed pods) and fireballs ----
function shotMesh(col,scale,core){ const g=new THREE.Group(); const c=M(G.sph(core||.09,8,6),basic(0xffffff),0,0,0); c.userData.noOL=true; g.add(c); g.add(glow(col,scale,.9)); return g; }
function muzzle(){ const fx=Math.sin(fam.yaw), fz=Math.cos(fam.yaw); return [fam.x+fx*.3,fam.y-.02,fam.z+fz*.3]; }
function nearMobs(x,z,r,skip){ const out=[]; for(const e of famFoes()){ if(e.dead||e===skip) continue; if(Math.hypot(e.x-x,e.z-z)<r+e.r*.5) out.push(e); } return out; }
function famShotsUpdate(dt){ for(let i=famShots.length-1;i>=0;i--){ const s=famShots[i]; s.t+=dt; s.vy-=s.g*dt; s.x+=s.vx*dt; s.y+=s.vy*dt; s.z+=s.vz*dt; s.mesh.position.set(s.x,s.y,s.z); if(s.spin) s.mesh.rotation.z+=dt*s.spin; if(s.thorn){ aimThorn(s.mesh,s.vx,s.vy,s.vz); if((s.t*30|0)!==((s.t-dt)*30|0)) thornTrail(s.x,s.y,s.z); } if(s.trail&&(s.t*30|0)!==((s.t-dt)*30|0)){ fx((g,mt)=>{ const p=glow(s.trailCol||0xff8a2a,.55,.7); p.position.set(s.x,s.y,s.z); g.add(p); },.25); }
    let hit=null; for(const e of famFoes()){ if(e.dead) continue; if(Math.hypot(e.x-s.x,e.z-s.z)<e.r+.45&&s.y>e.y-.3&&s.y<e.y+e.h+.6){ hit=e; break; } }
    const floor=s.y<=.12; if(hit||floor||s.t>2.2||s.y<-2){ if(hit||floor) s.land(s,hit); scene.remove(s.mesh); s.mesh.traverse(o=>{ if(o.userData.shared) return; if(o.isSprite) o.material.dispose(); else if(o.geometry) o.geometry.dispose(); }); famShots.splice(i,1); } } }
// ---- the Forest set's thorns (build 141): "the pet shots are like slow ping pong balls ... they seem to lob". With the
// five-piece Forest boon (93-gearsets.js, fam.thorns) the Wisp's sparks and the Sprite's seed pods fly as green thorns
// instead: a slim green dart with a green glow, a faint green trail, 1.6x the speed, and the pod's arc flattened to a
// low skim (its spore cloud on landing is kept). The Imp keeps its fireball, a touch quicker too.
const THORN={col:0x3dff5a,geo:null,mat:null,glowP:null,speed:1.6,UP:new THREE.Vector3(0,1,0)};
function thornsOn(){ const b=window.__forest&&window.__forest.boon&&window.__forest.boon(); return !!((b&&b.thorns)||(window.__mythic&&window.__mythic.has('bramblewhisk'))); }   // or the Bramblewhisk (build 152)
function thornMesh(){ const T=THORN; if(!T.geo){ T.geo=G.cyl(0,.05,.46,6); T.mat=basic(0xb8ffb0); T.glowP=glow(T.col,.62,.9); }
  const g=new THREE.Group(); const c=new THREE.Mesh(T.geo,T.mat); c.userData.noOL=true; c.userData.shared=true; g.add(c); const s=T.glowP.clone(); s.userData.shared=true; g.add(s); g.userData.thorn=c; return g; }   // one geometry, one material, one glow material for every thorn: nothing allocated per shot but the group
// build 242: Matt's Sprite Thorn Darts model (fam-thorn-dart.glb: a vine-wrapped emerald thorn, long along X, pointed at both ends) for the Sprite's two darts. Self-lit (tfxMake: the map on a basic
// material), fitted to .62 long and laid along +Y inside a group that aimThorn turns to face the flight; a glow rides along like the plain thorn's.
let DART=null, DARTP=null;
function dartLoad(){ if(DARTP) return; DARTP=fetchBytes(ASSET('fam-thorn-dart.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{ DART=tfxMake(g.scene||g.scenes[0],.95,null,false); }).catch(e=>console.warn('sprite dart model',e)); }
function dartMesh(){ if(!DART) return thornMesh(); if(!THORN.glowP) thornMesh();
  const g=new THREE.Group(), inner=new THREE.Group(), m=DART.clone(true); m.rotation.z=PI/2; inner.add(m); g.add(inner); g.userData.thorn=inner;
  const gl=THORN.glowP.clone(); gl.userData.shared=true; g.add(gl); return g; }
// build 245: Matt's Bat Bleeding Bite model (fam-bat-bite.glb: a flat splash of blood and slash marks, 2.0 wide, thin in Z) is what the Bat's bite leaves on the mob: it appears at the mob's middle turned to face the
// camera with a random roll, pops in (.2 s), holds and shrinks away (.55 s in all). Fetched once a Bat is worn; self-lit like the Trimaw's effects (tfxMake), one shared material, so it fades by shrinking.
let BITE=null, BITEP=null, BITE_N=0; const BITES=[];
function biteLoad(){ if(BITEP) return; BITEP=fetchBytes(ASSET('fam-bat-bite.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{ BITE=tfxMake(g.scene||g.scenes[0],1.9,null,false); }).catch(e=>console.warn('bat bite model',e)); }
function biteFx(x,y,z){ BITE_N++; if(!BITE) return; const m=BITE.clone(true); m.position.set(x,y,z); m.scale.setScalar(.001); scene.add(m); BITES.push({m,t:0,roll:rnd()*TAU}); if(BITES.length>12){ const o=BITES.shift(); scene.remove(o.m); } }
function biteUpdate(dt){ for(let i=BITES.length-1;i>=0;i--){ const b=BITES[i]; b.t+=dt; const k=b.t/.55; if(k>=1){ scene.remove(b.m); BITES.splice(i,1); continue; } b.m.lookAt(camera.position); b.m.rotateZ(b.roll); b.m.scale.setScalar(Math.max(.001,k<.2?.3+.7*(k/.2):1-Math.pow((k-.2)/.8,2)*.9)); } }
// build 248: Matt's new Storm Drake (fam-drake.glb: a deep-blue drake with gold horns and hanging tail, wings spread, facing +Z) and his Storm Drake Lightning (fam-drake-lightning.glb: one flat jagged bolt with a
// bright burst at one end and a long sharp tip at the other, lying diagonally in the XY plane, thin in Z). The lightning is what the drake's attack now is: at load the bolt is turned to lie along +X with its sharp tip
// at +X and fitted to length 1 (found from the model itself: the principal axis of its vertices, and the narrower end is the tip); each strike stretches one copy from the drake's mouth to the mob (burst end at the drake,
// tip at the mob), turned so its flat face turns to the camera, width scaled to the distance; it crackles (its width jitters), holds .1 s and thins away by .3 s. The forks to the pack are the same bolt, a size smaller.
// Until the model has landed the old procedural jagged bolt is used. Self-lit like the other effect models (tfxMake), one shared material.
let LIGHT=null, LIGHTP=null, LIGHT_W=.3, LB_N=0; const LBOLTS=[], LB_TMP={x:new THREE.Vector3(),y:new THREE.Vector3(),z:new THREE.Vector3(),m:new THREE.Matrix4(),c:new THREE.Vector3()};
function lightLoad(){ if(LIGHTP) return; LIGHTP=fetchBytes(ASSET('fam-drake-lightning.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{
    const root=g.scene||g.scenes[0]; root.updateMatrixWorld(true); const pts=[]; root.traverse(o=>{ if(!o.isMesh) return; const a=o.geometry.attributes.position, v=new THREE.Vector3(); for(let i=0;i<a.count;i+=2){ v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld); pts.push(v.x,v.y); } });
    let mx=0,my=0,n=pts.length/2; for(let i=0;i<pts.length;i+=2){ mx+=pts[i]; my+=pts[i+1]; } mx/=n; my/=n; let sxx=0,syy=0,sxy=0; for(let i=0;i<pts.length;i+=2){ const dx=pts[i]-mx, dy=pts[i+1]-my; sxx+=dx*dx; syy+=dy*dy; sxy+=dx*dy; }
    let ang=.5*Math.atan2(2*sxy,sxx-syy); const c=Math.cos(-ang), s=Math.sin(-ang); let lo=1e9,hi=-1e9; const rp=[]; for(let i=0;i<pts.length;i+=2){ const dx=pts[i]-mx, dy=pts[i+1]-my, x=dx*c-dy*s, y=dx*s+dy*c; rp.push(x,y); lo=Math.min(lo,x); hi=Math.max(hi,x); }
    const spread=(a,b)=>{ let l=1e9,h=-1e9; for(let i=0;i<rp.length;i+=2) if(rp[i]>=a&&rp[i]<=b){ l=Math.min(l,rp[i+1]); h=Math.max(h,rp[i+1]); } return h-l; };
    const endW=spread(hi-(hi-lo)*.2,hi), startW=spread(lo,lo+(hi-lo)*.2); let rot=-ang; if(startW<endW) rot+=PI;   // the narrower end is the tip: it goes to +X
    const holder=new THREE.Group(); holder.add(root); holder.rotation.z=rot; LIGHT=tfxMake(holder,1,null,false); LIGHT_W=.12;   // the bolt's own jagged band is about this thick at length 1 (its stray sparks reach much further: the whole box is nearly 1 tall)
  }).catch(e=>console.warn('storm drake lightning',e)); }
function lightBolt(a,b,size){ if(!LIGHT) return false; const len=a.distanceTo(b); if(len<.2) return true; const m=LIGHT.clone(true); LB_N++;
  LBOLTS.push({m,a:a.clone(),b:b.clone(),len,w:Math.min(.9,Math.max(.5,len*.12))*(size||1),t:0}); scene.add(m); placeBolt(LBOLTS[LBOLTS.length-1],1); if(LBOLTS.length>16){ const o=LBOLTS.shift(); scene.remove(o.m); } return true; }
function placeBolt(o,widen){ const T=LB_TMP, x=T.x.subVectors(o.b,o.a).normalize(); T.c.copy(o.a).add(o.b).multiplyScalar(.5); const cam=T.z.subVectors(camera.position,T.c); cam.addScaledVector(x,-cam.dot(x)); if(cam.lengthSq()<1e-4) cam.set(0,1,0).addScaledVector(x,-x.y);
  cam.normalize(); const y=T.y.crossVectors(cam,x); T.m.makeBasis(x,y,cam); o.m.quaternion.setFromRotationMatrix(T.m); o.m.position.copy(T.c); o.m.scale.set(o.len,Math.max(.001,o.w/LIGHT_W*widen),1); }
function lightUpdate(dt){ for(let i=LBOLTS.length-1;i>=0;i--){ const o=LBOLTS[i]; o.t+=dt; const k=o.t/.3; if(k>=1){ scene.remove(o.m); LBOLTS.splice(i,1); continue; } placeBolt(o,(k<.35?1:1-Math.pow((k-.35)/.65,2))*(.85+.3*rnd())); } }
// build 250: Matt's Owl Crystal Laser (fam-owl-laser.glb: a straight beam 2 long along X with a crystal burst at each end and three more along the shaft, flat, thin in Z) is what the Crystal Owl's beam is now.
// Fitted to length 1 at load (tfxMake, self-lit, one shared material); each beam is a run of copies laid end to end from the owl's beak to the mob (about three units each, stretched a little
// so the run meets exactly; the crystals keep their proportions, and a short hop is as thick as a 3.4 one), the whole run turned so its flat face meets the camera, crackling for .3 s. Each hop of the chain is another run,
// a little slimmer. The old procedural line is the fallback until the model has landed.
let LASER=null, LASERP=null, LZ_N=0; const LASERS=[];
function laserLoad(){ if(LASERP) return; LASERP=fetchBytes(ASSET('fam-owl-laser.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{ LASER=tfxMake(g.scene||g.scenes[0],1,null,false); }).catch(e=>console.warn('owl laser',e)); }
function laserBolt(a,b,size){ if(!LASER) return false; const len=a.distanceTo(b); if(len<.2) return true; const n=Math.max(1,Math.round(len/3.2)), seg=len/n, g=new THREE.Group(), s=Math.max(seg,3.4)*(size||1);   // a run of copies about three units long each; thickness follows the length (never under 3.4 x .16 = .55 across)
  for(let i=0;i<n;i++){ const m=LASER.clone(true); m.position.x=-len/2+(i+.5)*seg; m.scale.set(seg,s,s); g.add(m); }
  const o={m:g,a:a.clone(),b:b.clone(),len,t:0}; LZ_N++; LASERS.push(o); scene.add(g); placeLaser(o,1); if(LASERS.length>16){ const x=LASERS.shift(); scene.remove(x.m); } return true; }
function placeLaser(o,widen){ const T=LB_TMP, x=T.x.subVectors(o.b,o.a).normalize(); T.c.copy(o.a).add(o.b).multiplyScalar(.5); const cam=T.z.subVectors(camera.position,T.c); cam.addScaledVector(x,-cam.dot(x)); if(cam.lengthSq()<1e-4) cam.set(0,1,0).addScaledVector(x,-x.y);
  cam.normalize(); const y=T.y.crossVectors(cam,x); T.m.makeBasis(x,y,cam); o.m.quaternion.setFromRotationMatrix(T.m); o.m.position.copy(T.c); o.m.scale.set(1,Math.max(.001,widen),Math.max(.001,widen)); }
function laserUpdate(dt){ for(let i=LASERS.length-1;i>=0;i--){ const o=LASERS[i]; o.t+=dt; const k=o.t/.3; if(k>=1){ scene.remove(o.m); LASERS.splice(i,1); continue; } placeLaser(o,(k<.4?1:1-Math.pow((k-.4)/.6,2))*(.92+.16*rnd())); } }
function aimThorn(g,vx,vy,vz){ const c=g&&g.userData.thorn; if(!c) return; const v=new THREE.Vector3(vx,vy,vz); if(v.lengthSq()<1e-6) return; c.quaternion.setFromUnitVectors(THORN.UP,v.normalize()); }
function thornTrail(x,y,z){ fx((g,mt)=>{ const p=glow(THORN.col,.32,.6); p.position.set(x,y,z); g.add(p); },.18); }
// the Wisp's sparks come from 30-familiar.js's famBolts: re-dress the bolt it just made, speed it up, and give it a trail
{ const prev=famBoltsUpdate; famBoltsUpdate=function(dt){ for(const b of famBolts) if(b.thorn&&((b.t*30|0)!==((b.t+dt)*30|0))) thornTrail(b.x,b.y,b.z); return prev(dt); }; }
function thornify(b){ scene.remove(b.mesh); b.mesh=thornMesh(); b.vx*=THORN.speed; b.vy*=THORN.speed; b.vz*=THORN.speed; b.mesh.position.set(b.x,b.y,b.z); aimThorn(b.mesh,b.vx,b.vy,b.vz); scene.add(b.mesh); b.thorn=true; }
// ---- the attacks ----
const famFireProc=famFire;
function extraTargets(e,n){ const out=[]; const cands=famFoes().filter(m=>!m.dead&&m!==e&&Math.hypot(m.x-fam.x,m.z-fam.z)<FAM_RANGE+2&&los(fam.x,fam.z,m.x,m.z)).sort((a,b)=>Math.hypot(a.x-e.x,a.z-e.z)-Math.hypot(b.x-e.x,b.z-e.z)); for(let i=0;i<n;i++) out.push(cands[i]||e); return out; }
famFire=function(e){ const n=heroStat('fproj')|0; fireOne(e,n); const k=kindOf(); if(n>0&&(k==='Wisp'||k==='Sprite'||k==='Fire Imp')) for(const t of extraTargets(e,n)) fireOne(t,0); };
function fireOne(e,extra){ const k=kindOf(), C=FAM_KIND[k]; fam.kick=1;
  if(k==='Bat'){ const [x,y,z]=[fam.x,fam.y,fam.z]; swoop={e,t:0,dur:.6,bit:false,x0:x,y0:y,z0:z}; return; }
  if(k==='Sprite'){ const [x,y,z]=muzzle(); const T=.62/THORN.speed, g=9;   // DUAL THORN DARTS (build 242): two thorns leave side by side and skim to the mob (thorn flight: under half the time, light gravity), each a small puff that slows
    const tx0=e.x+(e.walking?Math.sin(e.yaw)*mobSpd(e)*T*.6:0), tz0=e.z+(e.walking?Math.cos(e.yaw)*mobSpd(e)*T*.6:0); const dx=tx0-x, dz=tz0-z, dl=Math.hypot(dx,dz)||1, px=-dz/dl, pz=dx/dl;
    for(const sd of [-1,1]){ const mesh=dartMesh(); const sx=x+px*sd*.16, sz=z+pz*sd*.16; mesh.position.set(sx,y,sz); scene.add(mesh); const tx=tx0+px*sd*.22, tz=tz0+pz*sd*.22;
      famShots.push({x:sx,y,z:sz,vx:(tx-sx)/T,vy:(e.y+(e.h||1.2)*.5-y)/T+.5*g*T,vz:(tz-sz)/T,g,t:0,mesh,thorn:true,land:(sh,h)=>{ const d=dmgOf(C.dmg); for(const m of nearMobs(sh.x,sh.z,C.r,null)){ famHurt(m,d,0,0,{slow:C.slow}); m.slowT=Math.max(m.slowT||0,C.slow); } SFX.spore(); famLand(sh.x,sh.z,d);   /* {slow}: a co-op guest's darts reach the host's mob too (famHurt's famHit) */
        fx((gg,mt)=>{ mt.color.set(0x3dff5a); for(let i=0;i<4;i++){ const p=glow(0x3dff5a,.5+rnd()*.3,.5); const a=rnd()*TAU, r=rnd()*.45; p.position.set(sh.x+Math.cos(a)*r,.2+rnd()*.35,sh.z+Math.sin(a)*r); gg.add(p); } },.5); }}); }
    SFX.acorn(); return; }
  if(k==='Fire Imp'){ if(swoop) return; swoop={e,t:0,dur:.85,bit:false,lava:true,x0:fam.x,y0:fam.y,z0:fam.z}; return; }   // build 227 (Matt: "no fire ball just the lava drops"): the Imp dives at the pack like the Bat and drops molten lava -- lavaPool below

  if(k==='Crystal Owl'){ famLand(e.x,e.z,dmgOf(C.dmg)); const from=new THREE.Vector3(...muzzle()); let cur=e, prev=from, d=dmgOf(C.dmg);   /* build 178: the beam's first mob is where it lands (the chain hops don't each sprout one) */ const hitList=[]; for(let hop=0;hop<=C.hops+extra&&cur;hop++){ const to=new THREE.Vector3(cur.x,cur.y+cur.h*.55,cur.z); if(!laserBolt(prev,to,hop===0?1:.75)) bolt(prev,to,0x9ee8ff,.03+.01*(hop===0),false); famHurt(cur,d,0,0); hitList.push(cur); prev=to; d=dmgOf(C.dmg*Math.pow(C.chain,hop+1));
      let nx=null, nd=C.reach; for(const m of famFoes()){ if(m.dead||hitList.includes(m)) continue; const dd=Math.hypot(m.x-cur.x,m.z-cur.z); if(dd<nd&&los(cur.x,cur.z,m.x,m.z)){ nd=dd; nx=m; } } cur=nx; } beep(1400,.14,'sine',.04,900); noise(.06,.03,6000); return; }
  if(k==='Storm Drake'){ const from=new THREE.Vector3(...muzzle()); const to=new THREE.Vector3(e.x,e.y+e.h*.6,e.z); if(!lightBolt(from,to,1)) bolt(from,to,0xd8ecff,.045,true); famHurt(e,dmgOf(C.dmg),0,0); famLand(e.x,e.z,dmgOf(C.dmg)); for(const m of nearMobs(e.x,e.z,C.r+.6*extra,e)){ const mp=new THREE.Vector3(m.x,m.y+m.h*.6,m.z); if(!lightBolt(to,mp,.6)) bolt(to,mp,0xd8ecff,.03,true); famHurt(m,dmgOf(C.fork),0,0); }
    fx((g,mt)=>{ const p=glow(0xffffff,2.6,.8); p.position.set(e.x,e.y+e.h*.5,e.z); g.add(p); },.18); noise(.18,.14,2600); beep(90,.22,'sawtooth',.05,-40); return; }
  const n0=famBolts.length; famFireProc(e); if(thornsOn()&&famBolts.length>n0) thornify(famBolts[famBolts.length-1]); }   // Wisp: the spark bolt (a Forest thorn with the boon)
function burn(e,C){ e.burnT=C.burn; e.burnDmg=dmgOf(C.burnDmg); e.burnTick=e.burnTick||0; }
function burnUpdate(dt){ for(const e of enemies){ if(!(e.burnT>0)) continue; if(e.dead){ e.burnT=0; continue; } e.burnT-=dt; e.burnTick=(e.burnTick||0)+dt; if(e.burnTick>=.5){ e.burnTick-=.5; famHurt(e,e.burnDmg,0,0); }
    let s=burnFx.get(e); if(!s){ s=glow(0xff7a20,1.1,.75); scene.add(s); burnFx.set(e,s); } s.position.set(e.x+(rnd()-.5)*.2,e.y+e.h*.6+Math.sin(S.t*23)*.08,e.z+(rnd()-.5)*.2); s.scale.setScalar(.9+Math.sin(S.t*31)*.2); }
  for(const [e,s] of burnFx){ if(!(e.burnT>0)||e.dead){ scene.remove(s); s.material.dispose(); burnFx.delete(e); } } }
// ---------------------------------------------------------------- the Fire Imp's LAVA (build 227)
// Matt: "the fire imp flies toward the mobs like the bat only he drops molten lava that does dot fire damage" / "yes no fire ball just the lava drops".
// The Imp dives over the mob it picked (swoopUpdate, lava:true) and at the top of the dive lets go of a pool: LV.r wide, LV.life seconds, hitting every mob standing
// in it for LV.mul x pet damage each LV.tick seconds, and setting them burning for LV.linger s after they leave (the burn ticks 0.25 x pet damage every 0.5 s).
// Numbers are my picks -- easy to retune here. Runs on a co-op guest too: famHurt sends a puppet's hit (and its burn) to the host.
const LV={r:2,life:4.2,tick:.5,mul:.42,linger:2.4,cap:8}; const LAVA=[]; let lavaMap=null;
function lavaTexture(){ if(lavaMap) return lavaMap; const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'); const r=g.createRadialGradient(64,64,4,64,64,62); r.addColorStop(0,'#fff3a8'); r.addColorStop(.22,'#ffb02e'); r.addColorStop(.55,'#ff5a12'); r.addColorStop(.82,'#a3200acc'); r.addColorStop(1,'#3a0e0800'); g.fillStyle=r; g.fillRect(0,0,128,128);
  for(let i=0;i<14;i++){ const a=rnd()*TAU, d=14+rnd()*36; g.fillStyle='rgba(40,8,2,'+(.25+rnd()*.3)+')'; g.beginPath(); g.ellipse(64+Math.cos(a)*d,64+Math.sin(a)*d,3+rnd()*7,2+rnd()*5,rnd()*PI,0,TAU); g.fill(); }   // dark crust flecks on the molten surface
  lavaMap=new THREE.CanvasTexture(c); lavaMap.encoding=THREE.sRGBEncoding; return lavaMap; }
// build 230: Matt's own Molten Lava Drop (a meteor of lava that falls from the Imp onto the mob) and Molten Lava Pool (the ring of dark rock and flames round the molten floor). Fetched once an Imp is worn; until then (or if they fail) the plain pool appears at once as before.
const LFX={drop:null,pool:null,loading:null}, LDROP=[];
function lavaLoad(){ if(LFX.loading) return; const get=f=>fetchBytes(ASSET(f),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>g.scene||g.scenes[0]);
  LFX.loading=Promise.all([get('fam-imp-lavadrop.glb'),get('fam-imp-lavapool.glb')]).then(([d,pl])=>{ LFX.drop=tfxMake(d,1.15,null,false); LFX.pool=tfxMake(pl,LV.r*2*.98,null,true); }).catch(e=>console.warn('imp lava models',e)); }
function lavaDrop(x0,y0,z0,x,z,y){ if(!LFX.drop){ lavaPool(x,z,y); return; } const m=LFX.drop.clone(true); m.position.set(x0,y0,z0); scene.add(m); LDROP.push({m,x0,y0,z0,x,z,y:y||0,t:0,dur:.3}); }
function lavaDropUpdate(dt){ for(let i=LDROP.length-1;i>=0;i--){ const d=LDROP[i]; d.t+=dt; const k=Math.min(1,d.t/d.dur), q=k*k; d.m.position.set(lerp(d.x0,d.x,q),lerp(d.y0,d.y+.6,q),lerp(d.z0,d.z,q)); d.m.rotation.y+=dt*6; d.m.scale.setScalar(.8+.5*k);
    if(k>=1){ scene.remove(d.m); LDROP.splice(i,1); lavaPool(d.x,d.z,d.y); if(window.__ringlook) window.__ringlook.hitAt(d.x,(d.y||0)+.7,d.z); } } }   // build 512 prep: the Imp's drop is its hit -- Beast Mode's claw / Malamute's frost burst there (97h2-ringlook.js; looks only)
function lavaPool(x,z,y){ if(LAVA.length>=LV.cap){ const o=LAVA.shift(); scene.remove(o.g); o.disc.material.dispose(); o.glow.material.dispose(); o.embers.forEach(m=>m.material.dispose()); }
  const g=new THREE.Group(); g.position.set(x,(y||0)+.04,z); const disc=new THREE.Mesh(new THREE.CircleGeometry(LV.r,40),new THREE.MeshBasicMaterial({map:lavaTexture(),transparent:true,depthWrite:false,opacity:0})); disc.rotation.x=-PI/2; disc.userData.noOL=true; disc.renderOrder=2; g.add(disc);
  const gl=glow(0xff7a20,LV.r*1.9,.5); gl.position.y=.35; g.add(gl); const embers=[]; for(let i=0;i<6;i++){ const m=glow(0xffb040,.5,.8); m.userData={a:rnd()*TAU,r:rnd()*LV.r*.8,ph:rnd()}; g.add(m); embers.push(m); }
  let rim=null; if(LFX.pool){ rim=LFX.pool.clone(true); g.add(rim); }
  scene.add(g); LAVA.push({g,disc,glow:gl,embers,rim,x,z,t:0,tk:0}); beep(150,.22,'sawtooth',.05,-40); noise(.1,.04,2200); }
function lavaUpdate(dt){ if(fam&&kindOf()==='Fire Imp') lavaLoad(); lavaDropUpdate(dt); for(let i=LAVA.length-1;i>=0;i--){ const p=LAVA[i]; p.t+=dt; if(p.t>=LV.life){ scene.remove(p.g); p.disc.material.dispose(); p.glow.material.dispose(); p.embers.forEach(m=>m.material.dispose()); LAVA.splice(i,1); continue; }
    const fin=Math.min(1,p.t/.25), fout=Math.min(1,(LV.life-p.t)/.9), k=Math.min(fin,fout), pulse=1+Math.sin(p.t*7)*.04; p.disc.material.opacity=k*.95; p.disc.scale.setScalar((.55+.45*fin)*pulse*(p.rim?.96:1)); if(p.rim){ const rs=.6+.4*fin; p.rim.scale.set(rs,rs*(.35+.65*fout),rs); p.rim.position.y=-(1-fout)*.3; }   // the rock rim sinks and flattens as the pool cools p.glow.material.opacity=.5*k*(.85+.15*Math.sin(p.t*11));
    for(const m of p.embers){ const u=(p.t*.55+m.userData.ph)%1; m.position.set(Math.cos(m.userData.a+p.t*.6)*m.userData.r,.15+u*1.2,Math.sin(m.userData.a+p.t*.6)*m.userData.r); m.material.opacity=.8*(1-u)*k; m.scale.setScalar(.35+(1-u)*.35); }
    p.tk+=dt; if(p.tk>=LV.tick&&p.t>.2){ p.tk-=LV.tick; for(const m of nearMobs(p.x,p.z,LV.r,null)){ if((m.lavaT||-9)>S.t-LV.tick*.85) continue; m.lavaT=S.t; famHurt(m,dmgOf(LV.mul),0,0,{burn:LV.linger,burnDmg:dmgOf(.25)}); burn(m,{burn:LV.linger,burnDmg:.25}); } } } }   // one tick per mob per interval however many pools it stands in: overlapping pools do not stack
window.__dart={loaded:()=>!!DART,mesh:dartMesh};
window.__owllaser={model:()=>LASER,loaded:()=>!!LASER,count:()=>LZ_N,live:()=>LASERS.length,ages:()=>LASERS.map(b=>+b.t.toFixed(2))};
window.__drakebolt={model:()=>LIGHT,loaded:()=>!!LIGHT,count:()=>LB_N,live:()=>LBOLTS.length,ages:()=>LBOLTS.map(b=>+b.t.toFixed(2)),width:()=>LIGHT_W};
window.__bite={loaded:()=>!!BITE,count:()=>BITE_N,live:()=>BITES.length,ages:()=>BITES.map(b=>+b.t.toFixed(2))};
window.__lava={pools:()=>LAVA.length,drops:()=>LDROP.length,models:()=>!!(LFX.drop&&LFX.pool),cfg:LV,drop:(x,z)=>lavaPool(x,z,0),clear:()=>{ while(LAVA.length){ const o=LAVA.pop(); scene.remove(o.g); } }};
function swoopUpdate(dt){ if(!swoop||!fam) return; const w=swoop; w.t+=dt/w.dur; const e=w.e; if(e.dead&&w.t<.5){ w.t=.5; }
  const k=Math.sin(Math.min(1,w.t)*PI);   // 0 → 1 (at the mob) → 0 (back on the shoulder)
  const tx=e.dead?w.x0:e.x, ty=e.dead?w.y0:(w.lava?e.y+e.h+.85:e.y+e.h*.7), tz=e.dead?w.z0:e.z; const px=lerp(fam.x,tx,k), py=lerp(fam.y,ty,k)+Math.sin(w.t*PI)*.3, pz=lerp(fam.z,tz,k);
  fam.g.position.set(px,py,pz); fam.g.rotation.y=Math.atan2((w.t<.5?tx:fam.x)-px,(w.t<.5?tz:fam.z)-pz); fam.g.rotation.x=(w.t<.5?.5:-.35)*k;
  if(w.lava&&!w.bit&&w.t>=.5){ w.bit=true; if(!e.dead) lavaDrop(fam.g.position.x,fam.g.position.y-.1,fam.g.position.z,e.x,e.z,e.y||0); }
  else if(!w.bit&&w.t>=.5&&!e.dead){ w.bit=true; famHurt(e,dmgOf(K().dmg),Math.sin(fam.g.rotation.y)*.6,Math.cos(fam.g.rotation.y)*.6); famLand(e.x,e.z,dmgOf(K().dmg)); biteFx(e.x,(e.y||0)+(e.h||1.2)*.55,e.z); const nb=heroStat('fproj')|0; if(nb>0) for(const m of nearMobs(e.x,e.z,1.6,e).slice(0,nb)) famHurt(m,dmgOf(K().dmg*.7),0,0); SFX.hit(); fx((g,mt)=>{ const p=glow(0xffe0a0,1.2,.8); p.position.set(e.x,e.y+e.h*.7,e.z); g.add(p); },.2); }
  if(w.t>=1){ swoop=null; fam.g.rotation.x=0; } }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(fam&&kindOf()==='Sprite') dartLoad(); if(fam&&kindOf()==='Bat') biteLoad(); biteUpdate(dt); if(fam&&kindOf()==='Storm Drake') lightLoad(); lightUpdate(dt); if(fam&&kindOf()==='Crystal Owl') laserLoad(); laserUpdate(dt); if(fam){ swoopUpdate(dt); } lavaUpdate(dt); famShotsUpdate(dt); famFxUpdate(dt); burnUpdate(dt); }; }
const famClearProc=famClearBolts; famClearBolts=function(){ famClearProc(); for(const s of famShots){ scene.remove(s.mesh); } famShots.length=0; };
// the bag / sheet says what each familiar does
const statStrProc=statStr; statStr=function(it){ const s=statStrProc(it); if(it&&it.slot==='familiar'){ const nk=namedPet(it); if(nk) return s+' · '+NAMED_PET[nk].desc; const C=FAM_KIND[famKind(it)]; if(C) return s+' · '+C.desc; } return s; };
Object.assign(window.__familiar,{build:it=>famModel(it),stale:()=>{ if(!fam) return false; const it=gear.familiar, ud=fam.g.userData||{}, nk=namedPet(it); if(nk) return !!NP_GLB[nk]&&ud.named!==nk; return !ud.glb&&!!FAM_GLB[famKind(it)]; },   /* build 508: the pet out now wears a stand-in though its real model has landed (97h asks for the 2nd pet; ensureFam/ensureNamedPet only swap the first) */ thornsOn:()=>thornsOn(),   /* late-bound (build 150): 30-familiar.js exported the procedural famModel before this module replaced it, so builds through the hook (a party puppet's pet, the suites) never asked for the Meshy model */ rate:()=>famRate(),dmg:()=>famDmg(),kinds:FAM_KIND,kindMul:()=>K(),glb:()=>Object.keys(FAM_GLB),namedGlb:()=>Object.keys(NP_GLB),   /* co-op sweep 2026-10-02: the named pets' loaded models, for a party puppet's look key (98-party.js) */fx:()=>famFx.length,shots:()=>famShots.length,swoop:()=>swoop?{t:+swoop.t.toFixed(2),bit:swoop.bit}:null,burning:()=>enemies.filter(e=>e.burnT>0&&!e.dead).length,pos:()=>fam?fam.g.position.toArray().map(v=>+v.toFixed(2)):null});
window.__thorns={on:thornsOn,speed:THORN.speed,col:THORN.col,shots:()=>famShots.map(x=>({thorn:!!x.thorn,vx:x.vx,vy:x.vy,vz:x.vz,g:x.g,t:x.t}))};
// ---- build 178: BRAMBLEWHISK's thorn patches. Its power (97-mythics.js) always read "your pet's shots leave thorn patches that slow
// and prick enemies", but all it did was dress the shots as thorns. Now wherever the wearer's pet shot lands (famLand: the Wisp's
// bolt, the Sprite's pod, the Imp's fireball, the Owl's beam and the Drake's bolt on their first mob, the Bat's bite) a patch of dark
// thorny vines sprouts on the floor: 1.4 across the radius, 4 s, sinking back into the stone over its last 0.8 s. A walking mob in
// one crawls at 60% (the Frost Spire's chill: chillT/chillK, so the deepest cold or thorn wins and nothing stacks) and is pricked
// for 15% of the shot that grew it every half second. Patches may overlap, but a mob is pricked by one of them at a time (the
// strongest) -- a pack of them on one choke is a thicket, not twelve times the damage. At most 12 live (the oldest withers early).
// The painted vine mat is one canvas texture; the thorns and arched runners share one geometry and one material each; only the
// mat's material is per patch (12 at most, disposed with it), so each can fade on its own.
// CO-OP: a guest's page has no real mobs, so a guest wearing it draws its patch on its own screen (looks only) and sends 'bramble'
// to the host (99-network.js), which grows the real one -- slow, pricks and all -- where the host sees it. co-op sweep 2026-10-02 (cross-area): the host now passes a
// guest's patch on to the other guests, and sends its own, as 'brambleFx' -- drawn there with sprout's 4th arg (looks only, never pricks; 99g2-petshots.js)
const BRAM={max:12,life:4,r:1.4,tick:.5,prick:.15,slow:.6,list:[],tex:null,thornGeo:null,vineGeo:null,thornMat:null,vineMat:null};
function brambleOn(){ return !!(window.__mythic&&window.__mythic.has('bramblewhisk')); }
function brambleTex(){ const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d'); const R=128;
  const bg=g.createRadialGradient(R,R,0,R,R,R); bg.addColorStop(0,'rgba(18,26,10,.75)'); bg.addColorStop(.7,'rgba(22,34,12,.5)'); bg.addColorStop(1,'rgba(22,34,12,0)'); g.fillStyle=bg; g.fillRect(0,0,256,256);   // the trampled, shaded earth under the tangle
  g.lineCap='round'; for(let i=0;i<16;i++){ let a=rnd()*TAU, r=rnd()*R*.35; let x=R+Math.cos(a)*r, y=R+Math.sin(a)*r; let h=rnd()*TAU; const w=3+rnd()*4; g.strokeStyle=i%3?'#2a4f17':'#3f7424'; g.lineWidth=w; g.beginPath(); g.moveTo(x,y);   // a curling runner, turning as it creeps outward
    for(let k=0;k<9;k++){ h+=(rnd()-.5)*1.4; const nx=x+Math.cos(h)*14, ny=y+Math.sin(h)*14; if(Math.hypot(nx-R,ny-R)>R*.9) break; g.quadraticCurveTo(x+Math.cos(h+.6)*9,y+Math.sin(h+.6)*9,nx,ny);
      const t=(k%2?1:-1), px=-Math.sin(h)*t, py=Math.cos(h)*t; g.save(); g.fillStyle='#8c7a3e'; g.beginPath(); g.moveTo(nx+px*w*.4,ny+py*w*.4); g.lineTo(nx+px*(w+7)+Math.cos(h)*3,ny+py*(w+7)+Math.sin(h)*3); g.lineTo(nx+px*w*.4+Math.cos(h)*5,ny+py*w*.4+Math.sin(h)*5); g.fill(); g.restore();   // a thorn off alternate sides
      x=nx; y=ny; } g.stroke(); }
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t; }
function brambleParts(){ if(BRAM.tex) return; BRAM.tex=brambleTex(); BRAM.discGeo=new THREE.CircleGeometry(BRAM.r,24); BRAM.thornGeo=G.cone(.06,.42,5); BRAM.vineGeo=new THREE.TorusGeometry(.3,.045,5,10,PI); BRAM.thornMat=mat(0x8a7038); BRAM.vineMat=mat(0x3a6420); }
function brambleSprout(x,z,dmg,looks){ brambleParts(); while(BRAM.list.length>=BRAM.max) brambleDrop(0);
  const g=new THREE.Group(), y=baseFloor(x,z); g.position.set(x,y+.03,z); g.rotation.y=rnd()*TAU;
  const disc=new THREE.Mesh(BRAM.discGeo,new THREE.MeshBasicMaterial({map:BRAM.tex,transparent:true,opacity:1,depthWrite:false})); disc.rotation.x=-PI/2; disc.userData.noOL=true; g.add(disc);
  const up=new THREE.Group(); g.add(up);   // what stands up off the mat: it grows in and sinks away
  for(let i=0;i<9;i++){ const a=rnd()*TAU, r=Math.sqrt(rnd())*BRAM.r*.85; const th=new THREE.Mesh(BRAM.thornGeo,BRAM.thornMat); th.position.set(Math.cos(a)*r,.16,Math.sin(a)*r); th.rotation.set((rnd()-.5)*.8,0,(rnd()-.5)*.8); th.scale.setScalar(.7+rnd()*.6); th.userData.noOL=true; up.add(th); }
  for(let i=0;i<4;i++){ const a=rnd()*TAU, r=.3+rnd()*BRAM.r*.55; const v=new THREE.Mesh(BRAM.vineGeo,BRAM.vineMat); v.position.set(Math.cos(a)*r,0,Math.sin(a)*r); v.rotation.y=rnd()*TAU; v.scale.set(1,.7+rnd()*.5,1); v.userData.noOL=true; up.add(v); }
  up.scale.set(1,.01,1); scene.add(g);
  const p={x,z,dmg:Math.max(.1,+dmg||0),t:0,g,up,disc,looks:!!looks}; BRAM.list.push(p); return p; }
function brambleDrop(i){ const p=BRAM.list[i]; scene.remove(p.g); p.disc.material.dispose(); BRAM.list.splice(i,1); }
function brambleClear(){ while(BRAM.list.length) brambleDrop(0); }
famLand=function(x,z,dmg){ if(!brambleOn()||!Number.isFinite(x)||!Number.isFinite(z)) return; const n=window.__net, guest=!!(n&&n.role&&n.role()==='guest');
  brambleSprout(x,z,dmg,guest); if(guest) n.send('bramble',{x:+x.toFixed(2),z:+z.toFixed(2),dmg:+(+dmg||0).toFixed(2)}); };
function brambleUpdate(dt){ if(!BRAM.list.length) return; if(S.phase!=='build'&&S.phase!=='wave'){ brambleClear(); return; }
  for(let i=BRAM.list.length-1;i>=0;i--){ const p=BRAM.list[i]; p.t+=dt; if(p.t>=BRAM.life){ brambleDrop(i); continue; }
    const grow=Math.min(1,p.t/.25), sink=Math.max(0,(p.t-(BRAM.life-.8))/.8); p.up.scale.set(1,Math.max(.01,easeOutBack(grow)*(1-sink)),1); p.up.position.y=-.1*sink; p.disc.material.opacity=Math.min(1,p.t/.15)*(1-sink); }
  for(const e of enemies){ if(e.dead||e.fly) continue; let best=null; for(const p of BRAM.list){ if(p.looks) continue; if(Math.hypot(e.x-p.x,e.z-p.z)<BRAM.r+e.r*.5&&(!best||p.dmg>best.dmg)) best=p; } if(!best) continue;
    e.chillT=Math.max(e.chillT||0,.25); e.chillK=Math.min(e.chillK||1,BRAM.slow);
    e.thornCd=(e.thornCd||0)-dt; if(e.thornCd<=0){ e.thornCd=BRAM.tick; hurt(e,Math.max(.1,Math.round(best.dmg*BRAM.prick*10)/10),0,0); } } }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); brambleUpdate(dt); }; }
window.__bramble={on:brambleOn,sprout:(x,z,dmg,looks)=>brambleSprout(x,z,dmg,!!looks),list:()=>BRAM.list.map(p=>({x:+p.x.toFixed(2),z:+p.z.toFixed(2),dmg:p.dmg,t:+p.t.toFixed(2),looks:p.looks})),max:BRAM.max,life:BRAM.life,r:BRAM.r,clear:brambleClear};   // sprout: 99-network.js grows a guest's patch on the host
// ---------------------------------------------------------------- build 203: Matt sent a matching "Celestial Impact
// Burst" model from Meshy for the new Wisp ("see if we can do something with these they go with the new wisp") -- a
// static decorative mesh, no rig or animation, so it's animated in code instead: pops up to size then shrinks back
// down over a third of a second wherever a Wisp's bolt actually lands. famLand (30-familiar.js) already fires for
// every familiar's hit -- this just layers a visual on top of it, gated to the Wisp specifically. Fetched at the
// lowest priority (no tier argument -- build 201's lesson from the pig bosses: never make a real-gameplay fetch
// tier wait behind something purely decorative), so an early Wisp hit or two may land silent until it's in.
let wispBurstGLB=null, wispBurstP=null;
function loadWispBurst(){ if(wispBurstGLB||wispBurstP) return; wispBurstP=fetchBytes(ASSET('fam-wisp-burst.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(gltf=>{ const root=gltf.scene||gltf.scenes[0]; root.traverse(o=>{ if(o.isMesh&&o.material){ const m=o.material; m.transparent=true; m.depthWrite=false; if(m.map){ m.emissive=new THREE.Color(0xffffff); m.emissiveMap=m.map; m.emissiveIntensity=.6; } } }); /* build 218: lit by its own colours (not blown out additively) instead of the hall's dim torchlight */ wispBurstGLB=root; }).catch(e=>console.warn('wisp burst model',e)); }
// build 204 fix (loadorder-test.mjs/throneload-test.mjs both caught this): calling loadWispBurst() unconditionally at
// module load fetched it for every single player, whether or not they ever touch a Wisp -- same mistake as the pig
// bosses' first draft, just smaller. ensureFam('Wisp') (this file, above) already only fetches the base Wisp model
// once a Wisp is actually equipped; the burst now rides the same real trigger instead of its own eager one.
const wispBursts=[];
function wispBurst(x,z){ if(!wispBurstGLB) return; const m=wispBurstGLB.clone(true); m.position.set(x,1.1,z); m.rotation.y=rnd()*TAU; m.scale.setScalar(.001); m.userData.noOL=true; scene.add(m); wispBursts.push({m,t:0}); }
function wispBurstUpdate(dt){ for(let i=wispBursts.length-1;i>=0;i--){ const b=wispBursts[i]; b.t+=dt; const life=.6, k=b.t/life;   // build 218: .35 s at .55 read as a flicker -- Matt hadn't noticed it at all
    const s=k<.35?(k/.35)*.75:.75*(1-(k-.35)/.65); b.m.scale.setScalar(Math.max(.001,s)); b.m.rotation.y+=dt*4;
    if(k>=1){ scene.remove(b.m); wispBursts.splice(i,1); } } }
{ const prevLand=famLand; famLand=function(x,z,dmg){ prevLand(x,z,dmg); if(trueWisp()) wispBurst(x,z); }; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); wispBurstUpdate(dt); if(trueWisp()){ loadWispBurst(); loadWispProjectile(); } }; }   // kindOf() defaults to 'Wisp' with no pet equipped at all (its own no-familiar fallback) -- checking fam directly avoids re-making the exact eager-fetch mistake this block exists to fix
window.__wispburst={loaded:()=>!!wispBurstGLB,count:()=>wispBursts.length,ensure:loadWispBurst};
// ---------------------------------------------------------------- the Wisp's own bolt: Matt's "Celestial Projectile"
// replaces the generic tiny-sphere-plus-glow every other familiar's shot still uses (famBoltMesh, 30-familiar.js) --
// same lazy trigger and fetch priority as the burst above. Keeps the rarity-colour glow sprite from the original so
// a Wisp's bolt still reads its item rarity at a glance, just built around the real model instead of a bare sphere.
// centred, not bottom-pivoted: fitModel scales to a target height and stands the result on y=0, right for anything
// that stands on a floor but wrong for something meant to fly through the air aimed from its middle (same reasoning
// 50-defmodels.js's own ballista-bolt loader uses for exactly the same shape of problem)
let wispProjGLB=null, wispProjP=null;
function loadWispProjectile(){ if(wispProjGLB||wispProjP) return; wispProjP=fetchBytes(ASSET('fam-wisp-projectile.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(gltf=>{ try{
      const root=gltf.scene||gltf.scenes[0]; root.updateMatrixWorld(true);
      const box=new THREE.Box3().setFromObject(root); const size=box.getSize(new THREE.Vector3()), ctr=box.getCenter(new THREE.Vector3());
      const sc=.5/Math.max(size.x,size.y,size.z,1e-6);
      const inner=new THREE.Group(); inner.add(root); inner.scale.setScalar(sc); inner.position.set(-ctr.x*sc,-ctr.y*sc,-ctr.z*sc);
      toonify(root,sc); root.traverse(o=>{ if(o.isMesh&&!o.userData.isOL&&o.material&&o.material.map){ o.material.emissive=new THREE.Color(0xffffff); o.material.emissiveMap=o.material.map; o.material.emissiveIntensity=.9; } });
      { const ol=[]; root.traverse(o=>{ if(o.userData.isOL) ol.push(o); }); ol.forEach(o=>o.parent.remove(o)); }   // build 218: self-lit, no ink -- on its thin swirls the outline read as a black scribble (same fix as Subterfuge's arrow)
      const w=new THREE.Group(); w.add(inner); wispProjGLB=w;
    }catch(e){ console.warn('wisp projectile model',e); } }).catch(e=>console.warn('wisp projectile model',e)); }
{ const prevBoltMesh=famBoltMesh; famBoltMesh=function(col){ if(trueWisp()&&wispProjGLB){ const b=new THREE.Group(); const m=wispProjGLB.clone(true); m.userData.noOL=true; b.add(m); b.add(glow(col,.75,.9)); return b; } return prevBoltMesh(col); }; }
// ---------------------------------------------------------------- GLADEHART's SPIRIT CHARGE (build 221)
// Matt: "gladehart will do a charge attack or send out some kind of ghost or patronus, that knocks mobs way back" / "and does tons of damage" /
// "but make the patronus bright pink". Every SC.every seconds of a wave a see-through hot-pink copy of the stag charges through the THICKEST
// group in range (my call, so it always hits something and needs no aiming), hitting every mob it passes once for SC.mult pet shots and
// throwing it back SC.knock/2 units; bosses take the full damage but only a nudge. Runs where the mobs are real (solo, or the host).
const SC={every:8,speed:8,hitR:1.4,mult:6,knock:9,bossKnock:.12,pink:0xff3fae,t:3,ghosts:[],pops:[],count:0,hits:0};
const SC_BOSS=new Set(['cyclops','pigflail','pigdagger','pigsling','trollboss','archhag','avery']);
const isGuest=()=>!!(window.__net&&window.__net.role&&window.__net.role()==='guest');
function gladeWorn(){ return !!fam&&namedPet(gear.familiar)==='gladehart'; }
function thickest(){ const fx0=fam?fam.x:hero.x, fz0=fam?fam.z:hero.z; let best=null, bn=0, bd=1e9; const live=enemies.filter(e=>!e.dead&&!e.puppet&&Math.hypot(e.x-hero.x,e.z-hero.z)<18);
  for(const c of live){ let n=0, sx=0, sz=0; for(const m of live) if(Math.hypot(m.x-c.x,m.z-c.z)<2.6){ n++; sx+=m.x; sz+=m.z; } const d=Math.hypot(c.x-fx0,c.z-fz0); if(n>bn||(n===bn&&d<bd)){ best={x:sx/n,z:sz/n,n,y:c.y||0}; bn=n; bd=d; } }
  return best; }
function scPop(x,y,z,size,life,grow){ const s=glow(SC.pink,size,.9); s.position.set(x,y,z); scene.add(s); if(SC.pops.length>240){ const o=SC.pops.shift(); scene.remove(o.s); o.s.material.dispose(); } SC.pops.push({s,t:0,life,size,grow}); }
// the patronus look: a see-through pink body with a bright pink rim where its surface turns away from you, so the shoulders, legs and antlers read (one flat colour lost the body entirely)
function glowMat(){ const m=new THREE.MeshBasicMaterial({color:C(0xff2fa8),transparent:true,opacity:.85,depthWrite:false}); m.customProgramCacheKey=()=>'gladeghost';
  m.onBeforeCompile=sh=>{ sh.vertexShader=sh.vertexShader.replace('void main() {','varying vec3 gN; varying vec3 gV;\nvoid main() {').replace('#include <project_vertex>','#include <project_vertex>\n gN=normalize(normalMatrix*normal); gV=normalize(-mvPosition.xyz);');
    sh.fragmentShader=sh.fragmentShader.replace('void main() {','varying vec3 gN; varying vec3 gV;\nvoid main() {').replace('#include <dithering_fragment>','#include <dithering_fragment>\n float gr=pow(1.0-abs(dot(normalize(gN),normalize(gV))),1.7); gl_FragColor.rgb=mix(gl_FragColor.rgb*.8,vec3(1.0,.62,.9),gr); gl_FragColor.a=opacity*mix(.45,1.0,gr);'); };
  return m; }
function ghostMesh(){ const g=new THREE.Group(), mats=[]; const T=NP_GLB.gladehart;
  if(T){ const m=T.clone(true); m.scale.setScalar(2); const ol=[]; m.traverse(o=>{ if(o.userData.isOL) ol.push(o); }); ol.forEach(o=>o.parent.remove(o));
    m.traverse(o=>{ if(o.isMesh){ const old=Array.isArray(o.material)?o.material[0]:o.material; o.material=glowMat();   /* flat hot pink, normal blending: the stag's brown texture turned it dull red, and additive washed it to white over the pink light */ mats.push(o.material); } }); g.add(m); }
  const gl=glow(SC.pink,2.6,.4); gl.position.y=.7; g.add(gl); mats.push(gl.material); return {g,mats}; }
function scLaunch(t){ const sx=fam?fam.x:hero.x, sz=fam?fam.z:hero.z; let dx=t.x-sx, dz=t.z-sz; const d=Math.hypot(dx,dz)||1; dx/=d; dz/=d; const run=Math.max(8,Math.min(15,d+5)); const {g,mats}=ghostMesh();
  g.rotation.y=Math.atan2(dx,dz); g.position.set(sx,(t.y||0)+.35,sz); scene.add(g); SC.ghosts.push({g,mats,x:sx,z:sz,y:t.y||0,dx,dz,run,age:0,tr:0,hit:new Set(),dying:0}); SC.count++;
  scPop(sx,(t.y||0)+.9,sz,2.6,.4,1.6); if(SFX.rift) SFX.rift(); }
function scTick(dt){
  for(let i=SC.ghosts.length-1;i>=0;i--){ const G=SC.ghosts[i]; G.age+=dt;
    if(!G.dying){ const step=SC.speed*dt; G.x+=G.dx*step; G.z+=G.dz*step; G.run-=step; G.g.position.set(G.x,G.y+.35+Math.sin(G.age*14)*.07,G.z);
      for(const e of enemies){ if(e.dead||e.puppet||G.hit.has(e)) continue; if(Math.hypot(e.x-G.x,e.z-G.z)<SC.hitR+(e.r||.5)*.6&&Math.abs((e.y||0)-G.y)<3){ G.hit.add(e); const k=SC_BOSS.has(e.kind)?SC.knock*SC.bossKnock:SC.knock; hurt(e,dmgOf(SC.mult),G.dx*k,G.dz*k); scPop(e.x,(e.y||0)+(e.h||1.2)*.6,e.z,2.2,.32,1.9); SC.hits++; } }
      G.tr-=dt; if(G.tr<=0){ G.tr=.04; scPop(G.x-G.dx*.4+R(-.2,.2),G.y+.5+R(0,.5),G.z-G.dz*.4+R(-.2,.2),R(.6,1.3),.9,.2); }
      if(G.run<=0||wallAt(G.x,G.z)) G.dying=.001; }
    else { G.dying+=dt; const k=1-G.dying/.35; if(k<=0){ scene.remove(G.g); G.mats.forEach(m=>m.dispose()); SC.ghosts.splice(i,1); continue; } G.mats.forEach(m=>{ m.opacity=(m.isSpriteMaterial?.6:.85)*k; }); G.g.scale.setScalar(1+(1-k)*.25); } }
  for(let i=SC.pops.length-1;i>=0;i--){ const p=SC.pops[i]; p.t+=dt; const k=1-p.t/p.life; if(k<=0){ scene.remove(p.s); p.s.material.dispose(); SC.pops.splice(i,1); continue; } p.s.material.opacity=.9*k; p.s.scale.setScalar(p.size*(1+(1-k)*p.grow)); }
  if(!gladeWorn()||S.phase!=='wave'||hero.dead>0||isGuest()) return; SC.t-=dt; if(SC.t>0) return; const t=thickest(); if(!t){ SC.t=.6; return; } SC.t=SC.every; scLaunch(t); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); scTick(dt); }; }
// the reward: felling the Cyclops (95c-cyclops.js) drops Gladehart by the crystal like a named mythic, once -- never if you already own it
// co-op sweep 2026-10-02: reward(true) is the co-op guest's own copy, called by 99-network when the host says the Cyclops fell / Trimaw's map is held -- each player earns its own pet, as in single player
function gladeReward(coop){ const M=window.__mythic; if(!M||!M.NAMED||!M.NAMED.gladehart||(isGuest()&&!coop)) return false; const has=M.has('gladehart')||Meta.bag().some(b=>b&&M.id(b)==='gladehart')||((Meta.armory&&Meta.armory())||[]).some(b=>b&&M.id(b)==='gladehart'); if(has) return false;
  const it=M.normalize({tier:'named',named:'gladehart',lvl:Math.max(1,effWave())}); if(!it) return false; it.from='dungeon-hold'; const pic=window.__mythicDrops&&window.__mythicDrops.art&&window.__mythicDrops.art(it); if(pic) it.art=pic;
  dropLoot(it,R(-1.6,1.6),4.6,true); floatText(0,2.6,4.6,'✦ GLADEHART ✦ the spirit stag','#ff7ade'); toast('Gladehart, the spirit stag, fell by the Heartroot — pick it up'); return true; }
window.__gladehart={worn:gladeWorn,charges:()=>SC.count,ghosts:()=>SC.ghosts.length,hits:()=>SC.hits,cd:()=>+SC.t.toFixed(2),fire:()=>{ const t=thickest(); if(!t) return false; scLaunch(t); return true; },thickest,reward:gladeReward,cfg:SC,ghostPos:()=>{ const G=SC.ghosts[0]; return G?{x:G.x,y:G.y,z:G.z}:null; }};
// ---------------------------------------------------------------- TRIMAW, the magma hydra (build 222)
// Matt's reward pet for Throne Room SURVIVAL wave 50 (Gladehart's is wave 20). Three heads, three breaths at up to three targets each volley:
// FIRE (burns), FROST (slows), VENOM (poison over time); every hit MARKS the mob so it takes 25% more damage from everything for a few seconds.
// Delivered at baseline; its forge upgrade cap is 400 (90-forge.js upMax) so it can grow. The shots are glowing stand-ins until Matt's own
// breath projectiles arrive. Solo / host only, like Gladehart's charge (a guest's page has puppet mobs).
const TM={heads:[{name:'fire',col:0xff7a20,mul:.9},{name:'frost',col:0x7fd8ff,mul:.8},{name:'venom',col:0x7bff3a,mul:.75}],speed:14,burn:{burn:3,burnDmg:.25},slow:2.2,poisonT:4,poisonDmg:.22,markT:3,markMul:1.25,fired:0,hits:0};
function trimawWorn(){ return !!fam&&namedPet(gear.familiar)==='trimaw'; }
{ const prev=hurt; hurt=function(e,dmg,kx,kz){ if(e&&e.markT>0) dmg=Math.round(dmg*TM.markMul*10)/10; return prev(e,dmg,kx,kz); }; }   // marked: +25% from everything (hero, towers, pets, burns)
const stFx=new Map();
function statusUpdate(dt){
  for(const e of enemies){ if(e.dead){ e.poisonT=0; e.markT=0; continue; } if(e.poisonT>0){ e.poisonT-=dt; e.poisonTick=(e.poisonTick||0)+dt; if(e.poisonTick>=.5){ e.poisonTick-=.5; famHurt(e,e.poisonDmg,0,0); } } if(e.markT>0) e.markT-=dt; }
  for(const e of enemies){ if(e.dead) continue; const want={p:e.poisonT>0,m:e.markT>0}; let o=stFx.get(e); if(!o&&(want.p||want.m)){ o={p:null,m:null}; stFx.set(e,o); }
    if(o) for(const [k,col,size,dy] of [['p',0x7bff3a,.95,.5],['m',0xffd24a,1.35,1.05]]){ if(want[k]&&!o[k]){ o[k]=glow(col,size,.7); scene.add(o[k]); } if(o[k]){ if(want[k]) o[k].position.set(e.x+(rnd()-.5)*.1,e.y+e.h*dy+Math.sin(S.t*18)*.06,e.z); else { scene.remove(o[k]); o[k].material.dispose(); o[k]=null; } } } }
  for(const [e,o] of stFx){ if(e.dead||(!o.p&&!o.m)){ [o.p,o.m].forEach(s=>{ if(s){ scene.remove(s); s.material.dispose(); } }); stFx.delete(e); } } }
const RING={geo:null,mats:{}};   // one shared torus and one material per colour: famShotsUpdate frees a shot's geometry unless it is marked shared
function ringMesh(col){ if(!RING.geo) RING.geo=new THREE.TorusGeometry(.2,.045,8,20); if(!RING.mats[col]) RING.mats[col]=new THREE.MeshBasicMaterial({color:C(col),transparent:true,opacity:.95,depthWrite:false}); const g=new THREE.Group(); const r=new THREE.Mesh(RING.geo,RING.mats[col]); r.userData.shared=true; r.userData.noOL=true; g.add(r); const r2=new THREE.Mesh(RING.geo,RING.mats[col]); r2.scale.setScalar(.62); r2.userData.shared=true; r2.userData.noOL=true; g.add(r2); g.add(glow(col,.55,.3)); return g; }   // a solid coloured ring (additive blending washed it to white) with a smaller one inside it, and a glow
// ---- Matt's own Fire Ring Projectile + Magma Impact Burst (build 224), 1K, fetched the first time a Trimaw is worn. Fire uses them as made; frost and
// venom get the same models with the colour map's hues turned (fire hues 0-70 compressed into an icy blue / a green band, greys and darks left
// alone) -- done once at load. Self-lit (a plain map, no ink shells): thin flames read as a black scribble under the toon outline. Until they
// land the code-built rings above stand in.
const TRV={};   // head name -> {ring, burst} templates
const TB=[];    // live magma bursts
let TFXP=null;
function tfxHue(src,base){ const im=src&&src.image; if(!im) return src; const w=im.width||im.naturalWidth, h=im.height||im.naturalHeight; if(!w||!h) return src; const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); g.drawImage(im,0,0); const d=g.getImageData(0,0,w,h), a=d.data;
  for(let i=0;i<a.length;i+=4){ const r=a[i]/255, gr=a[i+1]/255, b=a[i+2]/255; const mx=Math.max(r,gr,b), mn=Math.min(r,gr,b), dl=mx-mn; if(dl<.04||mx<.08) continue;
    let hh=mx===r?((gr-b)/dl+6)%6:mx===gr?(b-r)/dl+2:(r-gr)/dl+4; hh*=60; if(hh>300) hh=0; hh=Math.min(hh,70); const s=dl/mx, nh=(base+hh*.4)%360, hp=nh/60, ch=mx*s, x=ch*(1-Math.abs(hp%2-1)), m=mx-ch;
    let rr,gg,bb; if(hp<1){ rr=ch; gg=x; bb=0; } else if(hp<2){ rr=x; gg=ch; bb=0; } else if(hp<3){ rr=0; gg=ch; bb=x; } else if(hp<4){ rr=0; gg=x; bb=ch; } else if(hp<5){ rr=x; gg=0; bb=ch; } else { rr=ch; gg=0; bb=x; }
    a[i]=(rr+m)*255; a[i+1]=(gg+m)*255; a[i+2]=(bb+m)*255; }
  g.putImageData(d,0,0); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.flipY=false; t.wrapS=src.wrapS; t.wrapT=src.wrapT; t.needsUpdate=true; return t; }
function tfxMake(scene,size,base,floor){ const root=scene.clone(true); root.traverse(o=>{ if(o.isMesh){ const src=Array.isArray(o.material)?o.material[0]:o.material; o.material=new THREE.MeshBasicMaterial({map:base==null?(src.map||null):tfxHue(src.map,base),side:THREE.DoubleSide}); o.userData.shared=true; o.userData.noOL=true; o.frustumCulled=false; } });
  root.updateMatrixWorld(true); const box=new THREE.Box3().setFromObject(root), sz=box.getSize(new THREE.Vector3()), ctr=box.getCenter(new THREE.Vector3()); const sc=size/Math.max(floor?Math.max(sz.x,sz.z):Math.max(sz.x,sz.y,sz.z),1e-6);
  const inner=new THREE.Group(); inner.add(root); inner.scale.setScalar(sc); inner.position.set(-ctr.x*sc,floor?-box.min.y*sc:-ctr.y*sc,-ctr.z*sc); const w=new THREE.Group(); w.add(inner); return w; }   // a ring is centred; a burst stands on the floor
function tfxLoad(){ if(TFXP) return; const get=f=>fetchBytes(ASSET(f),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>g.scene||g.scenes[0]);
  TFXP=Promise.all([get('trimaw-ring.glb'),get('trimaw-burst.glb')]).then(([ring,burst])=>{ const bases={fire:null,frost:190,venom:95}; for(const H of TM.heads){ const b=bases[H.name]; TRV[H.name]={ring:tfxMake(ring,.95,b,false),burst:tfxMake(burst,2.4,b,true)}; } }).catch(e=>console.warn('trimaw fx',e)); }
function tfxRing(H){ const T=TRV[H.name]; if(!T) return ringMesh(H.col); const g=new THREE.Group(); g.add(T.ring.clone(true)); g.add(glow(H.col,.8,.3)); return g; }
function tfxBurst(h,H){ const T=TRV[H.name]; if(!T||!h) return; const m=T.burst.clone(true); m.position.set(h.x,h.y||0,h.z); m.rotation.y=rnd()*TAU; m.scale.setScalar(.001); scene.add(m); if(TB.length>40){ const o=TB.shift(); scene.remove(o.m); } TB.push({m,t:0,life:.55}); }
function tfxUpdate(dt){ if(trimawWorn()) tfxLoad(); for(let i=TB.length-1;i>=0;i--){ const b=TB[i]; b.t+=dt; const k=b.t/b.life; if(k>=1){ scene.remove(b.m); TB.splice(i,1); continue; } b.m.scale.setScalar(Math.max(.001,k<.3?.25+.75*(k/.3):1-(k-.3)/.7)); } }
function trimawFire(e){ fam.kick=1; const tg=[e,...extraTargets(e,2)]; const [x,y,z]=muzzle();
  TM.heads.forEach((H,i)=>{ const t=tg[i]||e; const dx=t.x-x, dy=t.y+t.h*.5-y, dz=t.z-z; const d=Math.hypot(dx,dy,dz)||1, h2=Math.hypot(dx,dz)||1; const off=(i-1)*.24;
    const mesh=tfxRing(H); mesh.position.set(x-dz/h2*off,y+(i===1?.12:0),z+dx/h2*off); mesh.lookAt(mesh.position.x+dx,mesh.position.y+dy,mesh.position.z+dz); scene.add(mesh);
    famShots.push({x:mesh.position.x,y:mesh.position.y,z:mesh.position.z,vx:dx/d*TM.speed,vy:dy/d*TM.speed,vz:dz/d*TM.speed,g:0,t:0,mesh,spin:9,trail:true,trailCol:H.col,land:(s,h)=>{ if(!h) return; const dm=dmgOf(H.mul); famHurt(h,dm,s.vx/TM.speed*.3,s.vz/TM.speed*.3,H.name==='fire'?{burn:TM.burn.burn,burnDmg:dmgOf(TM.burn.burnDmg),mark:TM.markT}:H.name==='frost'?{slow:TM.slow,mark:TM.markT}:{poison:TM.poisonT,poisonDmg:dmgOf(TM.poisonDmg),mark:TM.markT});   /* co-op sweep 2026-10-02: every head's burn / poison / mark rides up to the host too (famHit), not frost's slow alone */
      if(!h.puppet){ if(H.name==='fire') burn(h,TM.burn); else if(H.name==='frost') h.slowT=Math.max(h.slowT||0,TM.slow); else { h.poisonT=TM.poisonT; h.poisonDmg=dmgOf(TM.poisonDmg); } h.markT=TM.markT; }
      TM.hits++; tfxBurst(h,H); famLand(h.x,h.z,dm); } }); });
  TM.fired++; }
{ const prev=famFire; famFire=function(e){ if(trimawWorn()){ trimawFire(e); return; } return prev(e); }; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); statusUpdate(dt); tfxUpdate(dt); }; }
// the reward: holding Throne Room survival wave 50 (winMap) drops Trimaw by the crystal, once -- never if you already own it. Solo/host only.
function trimawReward(coop){ const M=window.__mythic; if(!M||!M.NAMED||!M.NAMED.trimaw||(isGuest()&&!coop)) return false; const has=M.has('trimaw')||Meta.bag().some(b=>b&&M.id(b)==='trimaw')||((Meta.armory&&Meta.armory())||[]).some(b=>b&&M.id(b)==='trimaw'); if(has) return false;
  const it=M.normalize({tier:'named',named:'trimaw',lvl:Math.max(1,effWave())}); if(!it) return false; it.from='dungeon-hold'; const pic=window.__mythicDrops&&window.__mythicDrops.art&&window.__mythicDrops.art(it); if(pic) it.art=pic;
  dropLoot(it,R(-1.6,1.6),4.6,true); floatText(0,2.6,4.6,'✦ TRIMAW ✦ the magma hydra','#ff7ade'); toast('Trimaw, the magma hydra, fell by the Heartroot — pick it up'); return true; }
{ const prev=winMap; winMap=function(){ const r=prev.apply(this,arguments); if(SURVIVAL&&MAPI===1) trimawReward(); return r; }; }   // Throne Room (index 1) survival's fiftieth wave
window.__trimaw={shotMeshes:()=>famShots.map(s=>s.mesh),fxLoaded:()=>!!(TRV.fire&&TRV.frost&&TRV.venom),bursts:()=>TB.length,ringReal:()=>{ const g=tfxRing(TM.heads[0]); let real=false; g.traverse(o=>{ if(o.geometry&&o.geometry.type!=='TorusGeometry'&&o.isMesh) real=true; }); return real; },worn:trimawWorn,fired:()=>TM.fired,hits:()=>TM.hits,reward:trimawReward,cfg:TM,fire:e=>{ if(!trimawWorn()||!e) return false; trimawFire(e); return true; }};
})();
