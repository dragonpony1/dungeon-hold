// ===== FAMILIARS v2: the six Meshy familiars replace the procedural pets, and each fights its own way =====
//   Wisp — quick spark bolts.            Cave Bat — swoops out and bites, then flaps back to your shoulder.
//   Moss Sprite — lobs seed pods that burst into a spore cloud: everything in it crawls.
//   Fire Imp — fireballs that splash and leave the target burning.
//   Crystal Owl — a beam that chains through up to three mobs.   Storm Drake — lightning that forks into the pack.
// Models come from assets/ (fam-*.glb); until one arrives (or in a single-file build) the procedural pet stands in.
(function(){
const FAM_FILES={'Wisp':'fam-wisp.glb','Bat':'fam-bat.glb','Sprite':'fam-sprite.glb','Fire Imp':'fam-imp.glb','Crystal Owl':'fam-owl.glb','Storm Drake':'fam-drake.glb'};
const FAM_H={'Wisp':.8,'Bat':.7,'Sprite':.8,'Fire Imp':.85,'Crystal Owl':.8,'Storm Drake':.95};   // world height of the pet
// per-kind tuning: fire-rate and damage multipliers on the item's stats, plus what the attack does
const FAM_KIND={
  'Wisp':        {rate:1.0,dmg:1.0,desc:'spark bolts'},
  'Bat':         {rate:.55,dmg:1.7,desc:'swoops and bites'},
  'Sprite':      {rate:.8, dmg:.6, desc:'seed pods · spore cloud slows',slow:2.2,r:1.6},
  'Fire Imp':    {rate:.7, dmg:.9, desc:'fireballs · splash + burn',splash:1.3,burn:3,burnDmg:.25},
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
const NAMED_PET={bramblewhisk:{file:'named-bramblewhisk.glb',h:.8,desc:'thorn shots'},old_lamplight:{file:'named-old_lamplight.glb',h:.85,desc:'lantern sparks'}};
const NP_GLB={}, NP_ASKED={};
function namedPet(it){ return it&&it.named&&NAMED_PET[it.named]?it.named:null; }
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
function famShotsUpdate(dt){ for(let i=famShots.length-1;i>=0;i--){ const s=famShots[i]; s.t+=dt; s.vy-=s.g*dt; s.x+=s.vx*dt; s.y+=s.vy*dt; s.z+=s.vz*dt; s.mesh.position.set(s.x,s.y,s.z); if(s.thorn){ aimThorn(s.mesh,s.vx,s.vy,s.vz); if((s.t*30|0)!==((s.t-dt)*30|0)) thornTrail(s.x,s.y,s.z); } if(s.trail&&(s.t*30|0)!==((s.t-dt)*30|0)){ fx((g,mt)=>{ const p=glow(0xff8a2a,.55,.7); p.position.set(s.x,s.y,s.z); g.add(p); },.25); }
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
  if(k==='Sprite'){ const [x,y,z]=muzzle(); const th=thornsOn(); const T=th?.62/THORN.speed:.62, g=th?9:14; const tx=e.x+(e.walking?Math.sin(e.yaw)*mobSpd(e)*T*.6:0), tz=e.z+(e.walking?Math.cos(e.yaw)*mobSpd(e)*T*.6:0); const mesh=th?thornMesh():shotMesh(0x9be36a,.8,.11); mesh.position.set(x,y,z); scene.add(mesh);   /* thorns: under half the flight time and lighter gravity, so the arc tops out near 0.1 m instead of 0.7 -- a skim, not a lob */
    famShots.push({x,y,z,vx:(tx-x)/T,vy:(e.y+.3-y)/T+.5*g*T,vz:(tz-z)/T,g,t:0,mesh,thorn:th,land:(s,h)=>{ const d=dmgOf(C.dmg); for(const m of nearMobs(s.x,s.z,C.r,null)){ famHurt(m,d,0,0,{slow:C.slow}); m.slowT=Math.max(m.slowT||0,C.slow); } SFX.spore(); famLand(s.x,s.z,d);   /* {slow} (build 159, 5/7): a co-op guest's spores reach the host's mob too (famHurt's famHit), not only this page's proxy of it */
      fx((g,mt)=>{ mt.color.set(0x9be36a); for(let i=0;i<7;i++){ const p=glow(0x9be36a,.9+rnd()*.5,.55); const a=rnd()*TAU, r=rnd()*C.r*.8; p.position.set(s.x+Math.cos(a)*r,.25+rnd()*.5,s.z+Math.sin(a)*r); g.add(p); } },.9); }}); SFX.acorn(); return; }
  if(k==='Fire Imp'){ const [x,y,z]=muzzle(); const tx=e.x, ty=e.y+e.h*.5, tz=e.z; const dx=tx-x, dy=ty-y, dz=tz-z, d=Math.hypot(dx,dy,dz)||1, sp=thornsOn()?13*THORN.speed:13; const mesh=shotMesh(0xff7a20,1.3,.1); mesh.position.set(x,y,z); scene.add(mesh);
    famShots.push({x,y,z,vx:dx/d*sp,vy:dy/d*sp,vz:dz/d*sp,g:0,t:0,mesh,trail:true,land:(s,h)=>{ const d1=dmgOf(C.dmg), d2=dmgOf(C.dmg*.5), bx={burn:C.burn,burnDmg:dmgOf(C.burnDmg)}; if(h){ famHurt(h,d1,s.vx/sp*.4,s.vz/sp*.4,bx); burn(h,C); } for(const m of nearMobs(s.x,s.z,C.splash,h)){ famHurt(m,d2,0,0,bx); burn(m,C); } SFX.hit(); famLand(h?h.x:s.x,h?h.z:s.z,d1);   /* bx (build 159, 5/7): the burn rides a co-op guest's famHit to the host's mob, whose own burnUpdate ticks it -- it used to be set on the guest's proxy alone and never tick anywhere, a third of the Imp's damage */
      fx((g,mt)=>{ mt.color.set(0xff7a20); const p=glow(0xffb040,2.2,.9); p.position.set(s.x,s.y,s.z); g.add(p); const q=glow(0xff4a10,1.4,.9); q.position.set(s.x,s.y,s.z); g.add(q); },.35); }}); SFX.harpoon(); return; }
  if(k==='Crystal Owl'){ famLand(e.x,e.z,dmgOf(C.dmg)); const from=new THREE.Vector3(...muzzle()); let cur=e, prev=from, d=dmgOf(C.dmg);   /* build 178: the beam's first mob is where it lands (the chain hops don't each sprout one) */ const hitList=[]; for(let hop=0;hop<=C.hops+extra&&cur;hop++){ const to=new THREE.Vector3(cur.x,cur.y+cur.h*.55,cur.z); bolt(prev,to,0x9ee8ff,.03+.01*(hop===0),false); famHurt(cur,d,0,0); hitList.push(cur); prev=to; d=dmgOf(C.dmg*Math.pow(C.chain,hop+1));
      let nx=null, nd=C.reach; for(const m of famFoes()){ if(m.dead||hitList.includes(m)) continue; const dd=Math.hypot(m.x-cur.x,m.z-cur.z); if(dd<nd&&los(cur.x,cur.z,m.x,m.z)){ nd=dd; nx=m; } } cur=nx; } beep(1400,.14,'sine',.04,900); noise(.06,.03,6000); return; }
  if(k==='Storm Drake'){ const from=new THREE.Vector3(...muzzle()); const to=new THREE.Vector3(e.x,e.y+e.h*.6,e.z); bolt(from,to,0xd8ecff,.045,true); famHurt(e,dmgOf(C.dmg),0,0); famLand(e.x,e.z,dmgOf(C.dmg)); for(const m of nearMobs(e.x,e.z,C.r+.6*extra,e)){ bolt(to,new THREE.Vector3(m.x,m.y+m.h*.6,m.z),0xd8ecff,.03,true); famHurt(m,dmgOf(C.fork),0,0); }
    fx((g,mt)=>{ const p=glow(0xffffff,2.6,.8); p.position.set(e.x,e.y+e.h*.5,e.z); g.add(p); },.18); noise(.18,.14,2600); beep(90,.22,'sawtooth',.05,-40); return; }
  const n0=famBolts.length; famFireProc(e); if(thornsOn()&&famBolts.length>n0) thornify(famBolts[famBolts.length-1]); }   // Wisp: the spark bolt (a Forest thorn with the boon)
function burn(e,C){ e.burnT=C.burn; e.burnDmg=dmgOf(C.burnDmg); e.burnTick=e.burnTick||0; }
function burnUpdate(dt){ for(const e of enemies){ if(!(e.burnT>0)) continue; if(e.dead){ e.burnT=0; continue; } e.burnT-=dt; e.burnTick=(e.burnTick||0)+dt; if(e.burnTick>=.5){ e.burnTick-=.5; famHurt(e,e.burnDmg,0,0); }
    let s=burnFx.get(e); if(!s){ s=glow(0xff7a20,1.1,.75); scene.add(s); burnFx.set(e,s); } s.position.set(e.x+(rnd()-.5)*.2,e.y+e.h*.6+Math.sin(S.t*23)*.08,e.z+(rnd()-.5)*.2); s.scale.setScalar(.9+Math.sin(S.t*31)*.2); }
  for(const [e,s] of burnFx){ if(!(e.burnT>0)||e.dead){ scene.remove(s); s.material.dispose(); burnFx.delete(e); } } }
function swoopUpdate(dt){ if(!swoop||!fam) return; const w=swoop; w.t+=dt/w.dur; const e=w.e; if(e.dead&&w.t<.5){ w.t=.5; }
  const k=Math.sin(Math.min(1,w.t)*PI);   // 0 → 1 (at the mob) → 0 (back on the shoulder)
  const tx=e.dead?w.x0:e.x, ty=e.dead?w.y0:e.y+e.h*.7, tz=e.dead?w.z0:e.z; const px=lerp(fam.x,tx,k), py=lerp(fam.y,ty,k)+Math.sin(w.t*PI)*.3, pz=lerp(fam.z,tz,k);
  fam.g.position.set(px,py,pz); fam.g.rotation.y=Math.atan2((w.t<.5?tx:fam.x)-px,(w.t<.5?tz:fam.z)-pz); fam.g.rotation.x=(w.t<.5?.5:-.35)*k;
  if(!w.bit&&w.t>=.5&&!e.dead){ w.bit=true; famHurt(e,dmgOf(K().dmg),Math.sin(fam.g.rotation.y)*.6,Math.cos(fam.g.rotation.y)*.6); famLand(e.x,e.z,dmgOf(K().dmg)); const nb=heroStat('fproj')|0; if(nb>0) for(const m of nearMobs(e.x,e.z,1.6,e).slice(0,nb)) famHurt(m,dmgOf(K().dmg*.7),0,0); SFX.hit(); fx((g,mt)=>{ const p=glow(0xffe0a0,1.2,.8); p.position.set(e.x,e.y+e.h*.7,e.z); g.add(p); },.2); }
  if(w.t>=1){ swoop=null; fam.g.rotation.x=0; } }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(fam){ swoopUpdate(dt); } famShotsUpdate(dt); famFxUpdate(dt); burnUpdate(dt); }; }
const famClearProc=famClearBolts; famClearBolts=function(){ famClearProc(); for(const s of famShots){ scene.remove(s.mesh); } famShots.length=0; };
// the bag / sheet says what each familiar does
const statStrProc=statStr; statStr=function(it){ const s=statStrProc(it); if(it&&it.slot==='familiar'){ const nk=namedPet(it); if(nk) return s+' · '+NAMED_PET[nk].desc; const C=FAM_KIND[famKind(it)]; if(C) return s+' · '+C.desc; } return s; };
Object.assign(window.__familiar,{build:it=>famModel(it),thornsOn:()=>thornsOn(),   /* late-bound (build 150): 30-familiar.js exported the procedural famModel before this module replaced it, so builds through the hook (a party puppet's pet, the suites) never asked for the Meshy model */ rate:()=>famRate(),dmg:()=>famDmg(),kinds:FAM_KIND,kindMul:()=>K(),glb:()=>Object.keys(FAM_GLB),fx:()=>famFx.length,shots:()=>famShots.length,swoop:()=>swoop?{t:+swoop.t.toFixed(2),bit:swoop.bit}:null,burning:()=>enemies.filter(e=>e.burnT>0&&!e.dead).length,pos:()=>fam?fam.g.position.toArray().map(v=>+v.toFixed(2)):null});
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
// to the host (99-network.js), which grows the real one -- slow, pricks and all -- where the host sees it. Other guests don't see a
// guest's patches, and a guest doesn't see the host's: the patch is short-lived floor dressing, not worth a message to every page
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
window.__bramble={on:brambleOn,sprout:(x,z,dmg)=>brambleSprout(x,z,dmg,false),list:()=>BRAM.list.map(p=>({x:+p.x.toFixed(2),z:+p.z.toFixed(2),dmg:p.dmg,t:+p.t.toFixed(2),looks:p.looks})),max:BRAM.max,life:BRAM.life,r:BRAM.r,clear:brambleClear};   // sprout: 99-network.js grows a guest's patch on the host
// ---------------------------------------------------------------- build 203: Matt sent a matching "Celestial Impact
// Burst" model from Meshy for the new Wisp ("see if we can do something with these they go with the new wisp") -- a
// static decorative mesh, no rig or animation, so it's animated in code instead: pops up to size then shrinks back
// down over a third of a second wherever a Wisp's bolt actually lands. famLand (30-familiar.js) already fires for
// every familiar's hit -- this just layers a visual on top of it, gated to the Wisp specifically. Fetched at the
// lowest priority (no tier argument -- build 201's lesson from the pig bosses: never make a real-gameplay fetch
// tier wait behind something purely decorative), so an early Wisp hit or two may land silent until it's in.
let wispBurstGLB=null, wispBurstP=null;
function loadWispBurst(){ if(wispBurstGLB||wispBurstP) return; wispBurstP=fetchBytes(ASSET('fam-wisp-burst.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(gltf=>{ const root=gltf.scene||gltf.scenes[0]; root.traverse(o=>{ if(o.isMesh&&o.material){ o.material.transparent=true; o.material.depthWrite=false; } }); wispBurstGLB=root; }).catch(e=>console.warn('wisp burst model',e)); }
// build 204 fix (loadorder-test.mjs/throneload-test.mjs both caught this): calling loadWispBurst() unconditionally at
// module load fetched it for every single player, whether or not they ever touch a Wisp -- same mistake as the pig
// bosses' first draft, just smaller. ensureFam('Wisp') (this file, above) already only fetches the base Wisp model
// once a Wisp is actually equipped; the burst now rides the same real trigger instead of its own eager one.
const wispBursts=[];
function wispBurst(x,z){ if(!wispBurstGLB) return; const m=wispBurstGLB.clone(true); m.position.set(x,1.1,z); m.rotation.y=rnd()*TAU; m.scale.setScalar(.001); m.userData.noOL=true; scene.add(m); wispBursts.push({m,t:0}); }
function wispBurstUpdate(dt){ for(let i=wispBursts.length-1;i>=0;i--){ const b=wispBursts[i]; b.t+=dt; const life=.35, k=b.t/life;
    const s=k<.4?(k/.4)*.55:.55*(1-(k-.4)/.6); b.m.scale.setScalar(Math.max(.001,s)); b.m.rotation.y+=dt*4;
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
      const sc=.4/Math.max(size.x,size.y,size.z,1e-6);
      const inner=new THREE.Group(); inner.add(root); inner.scale.setScalar(sc); inner.position.set(-ctr.x*sc,-ctr.y*sc,-ctr.z*sc);
      toonify(root,sc); const w=new THREE.Group(); w.add(inner); wispProjGLB=w;
    }catch(e){ console.warn('wisp projectile model',e); } }).catch(e=>console.warn('wisp projectile model',e)); }
{ const prevBoltMesh=famBoltMesh; famBoltMesh=function(col){ if(trueWisp()&&wispProjGLB){ const b=new THREE.Group(); const m=wispProjGLB.clone(true); m.userData.noOL=true; b.add(m); b.add(glow(col,.75,.9)); return b; } return prevBoltMesh(col); }; }
})();
