// ===== A WEAPON STANDS ON THE FLOOR (build 169). Matt, 2026-09-27: "lets hit go on have the drop, i am envisioning a tall
// standing weapon with glow and particulate." A dropped weapon that has its own model -- any of the nine sets' (86-setweapons.js,
// 86b-g: a 7% mythic drop from 87-mythicdrops.js, a set pack's piece from 93-gearsets.js / 93b-sets8.js) or a named one (86h-named.js)
// -- no longer lies there as a picture card: THAT weapon stands on the floor, tip up, a hand above the ground, slowly turning,
// in a soft column of its set's colour (gold for a named one) with motes drifting up round it. The model is the one this page's
// hero would hold for it (swordFor / staffFor / bowFor by the hand, as 80-weapons.js mounts it), so the floor shows what you'll
// get in hand. Armor, amulets, trinkets and familiars keep their card. Pickup is untouched: the loot entry, its radius, the hook
// and co-op's own-loot rolls are game.js's and 99-network.js's as ever -- the stand is its own group in the scene that follows
// the loot's mesh and goes (geometry freed) the frame that mesh leaves the scene, however it left. Per drop: the model, two
// glow sprites and one Points cloud of MOTES (one draw call, one shared material).
(function(){
const MOTES=14, RISE=2.0, LIFE=2.6, LIFT=.18, SPIN=.8;   // motes per drop; how high they drift and how long it takes; the gap under the weapon; its turn (radians a second)
const GOLD=0xffc84a;
const STANDS=[]; let PM=null;
// ---------------------------------------------------------------- build 206+: non-weapon named mythics with real art.
// Matt confirmed the rule for all eight of them going forward: "the named mythics even non weapons will have floor
// art" -- Bramblewhisk (familiar) first, Gloomcap Censer (charm) second, more to come. Each is a real Meshy model,
// not one of the code-built weapon kit's shapes, so they share one generic load/cache/retry path keyed by named id
// instead of window.__weapons.model's. Fetched only once that specific item actually drops (a rare-drop item has no
// earlier natural trigger the way an equippable familiar has). Matt: "sit tall within your column of light not on
// the floor directly" -- NAMED_REAL's own `lift` sits well above the normal LIFT every weapon stand uses.
const NAMED_REAL={
  bramblewhisk:{file:'named-bramblewhisk.glb',h:.85,lift:.55},
  gloomcap_censer:{file:'named-gloomcap_censer.glb',h:.9,lift:.6},
  mossheart_aegis:{file:'named-mossheart_aegis.glb',h:.95,lift:.5},
  old_lamplight:{file:'named-old_lamplight.glb',h:.85,lift:.55},
  tear_of_the_rootgate:{file:'named-tear_of_the_rootgate.glb',h:.8,lift:.65},
  voidwoven_mantle:{file:'named-voidwoven_mantle.glb',h:.95,lift:.5},
  gladehart:{file:'named-gladehart.glb',h:.95,lift:.55},
  trimaw:{file:'named-trimaw.glb',h:.85,lift:.6},
  wardens_oath:{file:'named-wardens_oath.glb',h:.8,lift:.65},
  hourglass_of_hollow_sand:{file:'named-hourglass_of_hollow_sand.glb',h:.9,lift:.6},
  gabriels_charm:{file:'named-gabriels_charm.glb',h:.95,lift:.6},   // build 266
  beast_mode:{file:'named-beast_mode.glb',h:.95,lift:.6},
  malamute:{file:'named-malamute.glb',h:.95,lift:.6},   // build 429: Matt's Malamute ring (named myths 3D\Mallamute.glb, 1K)   // build 427: Matt's Beast Mode ring (named myths 3D\Beast Mode.glb, 1K)
};
// build 226 (Matt: the new bat "is perfect when equipped but it didn't show on the floor or in the hideout"): a plain familiar drop was the generic loot shape -- the pet models only ever
// loaded once one was EQUIPPED (85-familiars.js). Every kind stands as its own model now, through this same loader: fam_<kind> -> the pet's own file, so a re-made pet updates here for free
Object.assign(NAMED_REAL,{fam_wisp:{file:'fam-wisp.glb',h:.95,lift:.55},fam_bat:{file:'fam-bat.glb',h:.85,lift:.6},fam_sprite:{file:'fam-sprite.glb',h:.95,lift:.55},fam_imp:{file:'fam-imp.glb',h:1,lift:.55},fam_owl:{file:'fam-owl.glb',h:.95,lift:.55},fam_drake:{file:'fam-drake.glb',h:1.35,lift:.55}});
// build 482 (Matt sent the Chaos set's sword, amulet and charm as real 3D -- "ask for 3d art on all of it"): a SET's amulet and charm stand in 3D too, set_<set>_amulet / set_<set>_charm -> its file.
// A set without its own files yet keeps its card. The rest of the sets join by adding their two lines here.
Object.assign(NAMED_REAL,{ set_chaos_amulet:{file:'set-chaos-amulet.glb',h:.9,lift:.6}, set_chaos_charm:{file:'set-chaos-charm.glb',h:.9,lift:.6},
  set_void_amulet:{file:'set-void-amulet.glb',h:.9,lift:.6}, set_void_charm:{file:'set-void-charm.glb',h:.9,lift:.6},
  set_earth_amulet:{file:'set-earth-amulet.glb',h:.9,lift:.6}, set_earth_charm:{file:'set-earth-charm.glb',h:.9,lift:.6},
  set_fire_amulet:{file:'set-fire-amulet.glb',h:.9,lift:.6}, set_fire_charm:{file:'set-fire-charm.glb',h:.85,lift:.6},
  set_radiance_amulet:{file:'set-radiance-amulet.glb',h:.9,lift:.6}, set_radiance_charm:{file:'set-radiance-charm.glb',h:.95,lift:.6},
  set_tempest_amulet:{file:'set-tempest-amulet.glb',h:.9,lift:.6}, set_tempest_charm:{file:'set-tempest-charm.glb',h:.85,lift:.6},
  set_forest_amulet:{file:'set-forest-amulet.glb',h:.9,lift:.6}, set_forest_charm:{file:'set-forest-charm.glb',h:.85,lift:.6},
  set_necrotic_amulet:{file:'set-necrotic-amulet.glb',h:.9,lift:.6}, set_necrotic_charm:{file:'set-necrotic-charm.glb',h:.85,lift:.6},
  set_ice_amulet:{file:'set-ice-amulet.glb',h:.9,lift:.6}, set_ice_charm:{file:'set-ice-charm.glb',h:.9,lift:.6} });   // build 493: his frost amulet and frost crystal charm   // build 492: the Shadow set (the game's 'necrotic'): his fel amulet and fel skull charm   // build 491: the Forest (his 'Nature'): the leaf amulet, the acorn charm
const setKeyOf=it=>(window.__setweapons&&window.__setweapons.setOf(it))||(window.__realforest&&window.__realforest.isForest(it)?'forest':null);   // build 491: the Forest is not one of 86-setweapons' sets   // build 490: the Storm set (the game's 'tempest'); the charm is his crystal shard, with its own hover   // build 489 (the charm is his golden feather, with its own drift)   // build 488 (the charm is his molten skull, with its own hover)   // build 486   // build 483
const FAM_KEY={'Wisp':'fam_wisp','Bat':'fam_bat','Sprite':'fam_sprite','Fire Imp':'fam_imp','Crystal Owl':'fam_owl','Storm Drake':'fam_drake'};
const NR_GLB={}, NR_P={}, NR_PENDING=[], NR_CLIP={};   // NR_CLIP (build 485): a named/set model's own animation (Bob's Hanging_Sway_Loop), played on its stand
function loadNamedReal(k){ const cfg=NAMED_REAL[k]; if(!cfg||NR_GLB[k]||NR_P[k]) return; NR_P[k]=fetchBytes(ASSET(cfg.file)).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(gltf=>{ try{
      const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,cfg.h); toonify(root,fit.scale); NR_GLB[k]=fit.wrap; if(gltf.animations&&gltf.animations.length) NR_CLIP[k]=gltf.animations[0];
    }catch(e){ console.warn('named model '+k,e); } }).catch(e=>console.warn('named model '+k,e)); }
function pmat(){ if(!PM) PM=new THREE.PointsMaterial({map:GLOWT,size:.3,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true}); return PM; }   // shared by every drop: each mote's colour (and fade) is its vertex colour
// the model this page's hero would hold for the item, or null for anything without its own (a plain sword, a Forest piece)
function modelFor(it){ if(!it) return null; if(it.named&&NAMED_REAL[it.named]) return 'named-'+it.named; if(it.slot==='familiar'&&!it.named&&typeof famKind==='function'){ const k=FAM_KEY[famKind(it)]; if(k) return 'named-'+k; }   // window.__named.id() only ever resolves weapon-slot named items by design (86h-named.js's namedId guards on it.slot==='weapon') -- it.named itself is set regardless of slot (97-mythics.js), so that's the real check for anything non-weapon
  if(it.slot==='amulet'||it.slot==='charm'||it.slot==='trinket'){ const st=setKeyOf(it), k=st&&('set_'+st+'_'+(it.slot==='amulet'?'amulet':'charm')); return k&&NAMED_REAL[k]?'named-'+k:null; }   // build 482: a set's own jewellery
  if(it.slot!=='weapon') return null; const named=window.__named&&window.__named.id(it), set=setKeyOf(it); if(!named&&!set) return null;
  if(named&&window.__named.own&&window.__named.own(named)==='bow') return 'bow-'+named;   // build 170: a named BOW stands as itself for every hero (the Knight's stand-in for Subterfuge is a loaded .glb sword, which can't stand here)
  const W=window.__weapons;
  if(it.forceLook) return it.forceLook==='staff'&&window.__staff?window.__staff.staffFor(it):it.forceLook==='bow'&&window.__bow?window.__bow.bowFor(it):W.swordFor(it);   // dev-panel-only field (74-devpanel.js): lets Matt preview a set's bow/staff/sword look on the floor regardless of which hero he's actually playing -- a real drop never carries this, so every other weapon still tracks the current hero exactly as before
  const hm=W.mount&&W.mount(); return hm&&hm.staff&&window.__staff?window.__staff.staffFor(it):hm&&hm.bow&&window.__bow?window.__bow.bowFor(it):W.swordFor(it); }
function colours(it){ const named=it.named||(window.__named&&window.__named.id(it)); if(named==='subterfuge'||named==='sixseven') return [0x4aa8ff,GOLD]; if(named==='gabriels_charm') return [0x7fd8ff,0xffffff]; if(named==='beast_mode') return [0xff7a3a,0xffd27a]; if(named==='malamute') return [0x9fd8ff,0xffffff];   /* build 429: the Malamute ring -- an ice-blue column */   /* build 427: the Beast Mode ring -- a fiery amber column */ if(named) return [GOLD,named==='rootsplitter'?0x7aff3a:0xfff2c0];   // named: a gold column; Rootsplitter's motes half green; Subterfuge a storm-blue column with gold motes (build 170). it.named itself (set regardless of slot) catches Bramblewhisk and future non-weapon named mythics that window.__named.id() never will
  const k=window.__setweapons.setOf(it), K=k&&window.__staff&&window.__staff.info(k); const c=K&&K.glow!=null?K.glow:RCOL[Math.max(0,Math.min(5,it.rarity|0))]; return [c,K&&K.gem!=null?K.gem:0xffffff]; }
function heightFor(name){ const nr=name.startsWith('named-')&&NAMED_REAL[name.slice(6)]; return nr?nr.h:/^bow-/.test(name)?1.4:/^(polearm-|staff-|named-last|named-sixseven)/.test(name)?1.75:1.4; }   // world units, foot to tip (the Knight is 1.7): a sword or a bow a bit under his height, a polearm or staff just over it -- the pictures from the game's camera read small any shorter
function stand(l,it){ const name=modelFor(it); if(!name) return null;
  const nrKey=name.startsWith('named-')&&NAMED_REAL[name.slice(6)]?name.slice(6):null; let obj;
  if(nrKey){ if(!NR_GLB[nrKey]){ loadNamedReal(nrKey); if(!NR_PENDING.some(p=>p.l===l)) NR_PENDING.push({l,it}); return null; } obj=NR_GLB[nrKey].clone(true); obj.position.y=NAMED_REAL[nrKey].lift; }   // already sized+bottom-pivoted by fitModel at load, and toonify already gave it its own outline shells -- neither of the code-built path's two steps below apply here
  else{ obj=null; window.__weapons.model(name,o=>{ obj=o; }); if(!obj){ if(!NR_PENDING.some(p=>p.l===l)) NR_PENDING.push({l,it,t0:performance.now()}); return null; }   // (code-built models come back at once; build 270: a set weapon that is one of Matt's real models -- the Void, Chaos and Earth staff and polearm -- is still loading the first time one drops, so it waits in the same retry list as a named-real one and stands as soon as it lands)
    const b=obj.userData.box, y0=b?b.min.y:0, H=b?b.max.y-b.min.y:1, s=heightFor(name)/H; obj.scale.setScalar(s); obj.position.y=LIFT-y0*s; outline(obj); }
  const [col,col2]=colours(it); const root=new THREE.Group(); root.name='weaponStand'; const spin=new THREE.Group(); spin.add(obj); root.add(spin);
  const halo=glow(col,1.9,.3); halo.position.y=(nrKey?NAMED_REAL[nrKey].lift:LIFT)+heightFor(name)*.55; root.add(halo);   // the soft halo about it
  const foot=glow(col,1.3,.45); foot.position.y=.12; root.add(foot);
  const pos=new Float32Array(MOTES*3), cols=new Float32Array(MOTES*3), m=[]; const c1=C(col), c2=C(col2), m1=c1.clone().lerp(new THREE.Color(1,1,1),.3), m2=c2.clone().lerp(new THREE.Color(1,1,1),.3);   // motes a shade brighter than the column, so they read against it
  for(let i=0;i<MOTES;i++) m.push({ph:i/MOTES*LIFE+rnd()*.2,a:rnd()*TAU,r:.2+rnd()*.25,c:i%3===2?m2:m1});
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('color',new THREE.BufferAttribute(cols,3));
  const pts=new THREE.Points(geo,pmat()); pts.frustumCulled=false; pts.userData.noOL=true; root.add(pts);
  // the loot's own look steps aside: the placeholder shape and any card picture hidden, its beam, ring and glow in the set's colour
  const art=l.mesh.userData.artSprite; if(art){ l.mesh.remove(art); if(art.material.map) art.material.map.dispose(); art.material.dispose(); delete l.mesh.userData.artSprite; }
  l.mesh.userData.item.visible=false; l.mesh.children.forEach(c=>{ if(c===l.mesh.userData.item) return; if(c.material&&c.material.color){ c.material.color.copy(c1); if(c.isSprite){ c.material.opacity=.35; c.scale.set(1.8,1.8,1); } else if(c!==l.mesh.userData.ring) c.material.opacity=.14; } });
  root.position.copy(l.mesh.position); scene.add(root);
  const S={l,root,spin,obj,halo,foot,pts,m,name,t:rnd()*6,staff:/^staff-/.test(name),bow:/^bow-/.test(name),pulses:[]}; obj.traverse(o=>{ if(o.name==='glowPulse') S.pulses.push(o); });
  // build 485 (Matt sent Bob's animated set pieces -- "should be void set animated"): a model that came with its own moves plays them on its stand -- a pendant's sway on its chain, a sword's flourish
  { const clip=nrKey?NR_CLIP[nrKey]:(window.__weapons.clips&&(window.__weapons.clips(name)||[])[0]); if(clip){ try{ S.mixer=new THREE.AnimationMixer(obj); const a=S.mixer.clipAction(clip); a.play(); a.time=rnd()*clip.duration; S.mixer.update(0); }catch(e){ S.mixer=null; } } }
  l.mesh.userData.stand=S; STANDS.push(S); tickOne(S,0); return S; }
function tickOne(S,dt){ const l=S.l; S.t+=dt; S.root.position.copy(l.mesh.position); S.root.visible=l.mesh.visible; l.mesh.userData.item.visible=false;   // (a set's card that fails to load turns the placeholder back on: 93-gearsets.js)
  S.spin.rotation.y+=dt*SPIN; S.spin.position.y=Math.sin(S.t*1.6)*.035; if(S.mixer) S.mixer.update(dt);
  S.halo.material.opacity=.26+.08*Math.sin(S.t*2.1); S.pulses.forEach((p,i)=>{ p.material.opacity=.38+.2*Math.sin(S.t*3.3+i*1.7); });
  if(S.staff&&window.__staff.animate) window.__staff.animate(S.obj,dt); else if(S.bow&&window.__bow.animate) window.__bow.animate(S.obj,dt);   // a staff's crystal turns and its motes orbit, a bow's too
  const P=S.pts.geometry.attributes.position.array, Cc=S.pts.geometry.attributes.color.array;
  for(let i=0;i<S.m.length;i++){ const o=S.m[i], f=((S.t+o.ph)%LIFE)/LIFE, a=o.a+f*1.4, r=o.r*(1-f*.45), k=Math.sin(PI*f);
    P[i*3]=Math.cos(a)*r; P[i*3+1]=.1+f*RISE; P[i*3+2]=Math.sin(a)*r; Cc[i*3]=o.c.r*k; Cc[i*3+1]=o.c.g*k; Cc[i*3+2]=o.c.b*k; }   // rising, curling in, fading in and out (additive: dark is gone)
  S.pts.geometry.attributes.position.needsUpdate=true; S.pts.geometry.attributes.color.needsUpdate=true; }
function drop(S){ scene.remove(S.root); S.pts.geometry.dispose(); S.halo.material.dispose(); S.foot.material.dispose(); if(S.l.mesh.userData.stand===S) delete S.l.mesh.userData.stand; }
function tick(dt){ for(let i=STANDS.length-1;i>=0;i--){ const S=STANDS[i]; if(!S.l.mesh.parent){ drop(S); STANDS.splice(i,1); continue; } tickOne(S,dt); }
  if(NR_PENDING.length) for(let i=NR_PENDING.length-1;i>=0;i--){ const {l,it,t0}=NR_PENDING[i]; if(!l.mesh.parent||l.mesh.userData.stand||(t0&&performance.now()-t0>90000)){ NR_PENDING.splice(i,1); continue; } try{ if(stand(l,it)) NR_PENDING.splice(i,1); }catch(e){ console.warn('named-real stand',e); NR_PENDING.splice(i,1); } } }   // picked up, grabbed in co-op, or swept away: gone with it (also drops a still-loading named-real item from the retry list the same way)
{ const prev=dropLoot; dropLoot=function(it,x,z,gentle){ const l=prev(it,x,z,gentle); if(l&&l.mesh&&it&&(it.slot==='weapon'||modelFor(it))){ try{ stand(l,it); }catch(e){ console.warn('weapon stand',e); } } return l; }; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); tick(dt); }; }
window.__weaponStand={count:()=>STANDS.length,modelFor,
  list:()=>STANDS.map(S=>({name:S.name,mixer:!!S.mixer,x:+S.root.position.x.toFixed(2),y:+S.root.position.y.toFixed(2),z:+S.root.position.z.toFixed(2),spin:+S.spin.rotation.y.toFixed(3),motes:S.m.length,inScene:!!S.root.parent,height:+(heightFor(S.name)).toFixed(2),card:!!S.l.mesh.userData.artSprite,placeholder:S.l.mesh.userData.item.visible}))};
})();
