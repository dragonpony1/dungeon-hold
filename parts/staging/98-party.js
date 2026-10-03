// ===== PARTY: other players' heroes, rendered alongside the local one — phase 1 of co-op multiplayer. Pure local
// groundwork, no networking yet: each puppet is driven by a test hook (window.__party) today, and will be driven
// by state received over the network later (the same setTarget(id,x,z,yaw) call either way, just called from a
// data-channel handler instead of a script). A puppet loads its own hero GLB through the same fit/toonify/clip-map
// pipeline the local hero uses (fitHero, toonify, mapClips — game.js), but keeps its own wrap/mixer/actions instead
// of touching GLBH/hero: nothing here changes how the local hero works, and the local hero has no idea puppets exist.
(function(){
const PARTY=new Map();   // id -> puppet
function loadPuppetGLB(buf,label,cb){
  new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{
    const root=gltf.scene||gltf.scenes[0]; if(!root) return;
    const fit=fitHero(root); toonify(root,fit.scale);
    const mixer=new THREE.AnimationMixer(root); const map=mapClips(gltf.animations||[]); const actions={};
    for(const k in map){ const a=mixer.clipAction(map[k]); if(k==='attack'||k==='jump'||k==='death'){ a.setLoop(THREE.LoopOnce,1); a.clampWhenFinished=true; } actions[k]=a; }
    cb({wrap:fit.wrap,root,mixer,actions,map,cur:null,label,scale:fit.scale});
  }catch(e){ console.warn('party glb '+label,e); } },e=>console.warn('party glb '+label,e));
}
function playPuppet(p,name,o){ const a=p.actions[name]; if(!a) return; o=o||{}; if(p.cur===a&&!o.restart) return; const prev=p.cur; p.cur=a; a.reset(); a.timeScale=o.speed||1; a.setEffectiveWeight(1); if(prev&&prev!==a){ if(o.fade) a.crossFadeFrom(prev,o.fade,false); else prev.stop(); } a.play(); }
function disposePuppet(p){ if(!p.root) return; p.root.traverse(o=>{ if(!o.isMesh) return; if(!o.userData.isOL&&o.geometry) o.geometry.dispose(); const mats=Array.isArray(o.material)?o.material:[o.material]; mats.forEach(m=>{ if(m&&m.map&&!o.userData.isOL) m.map.dispose(); if(m) m.dispose(); }); }); }
function add(id,heroGlbName,label){
  const old=PARTY.get(id); if(old&&old.glb===heroGlbName) return id;   // same rig: nothing to do (callers may call this every tick)
  const gen=(old?old.gen||0:0)+1;   // a pick change re-skins (build 150): the old rig goes, a stale load of it is discarded by the generation
  if(old){ undress(old); if(old.wrap) scene.remove(old.wrap); disposePuppet(old); }
  const p={id,glb:heroGlbName,gen,x:old?old.x:0,y:0,z:old?old.z:0,yaw:old?old.yaw:0,targetX:old?old.targetX:0,targetZ:old?old.targetZ:0,targetYaw:old?old.targetYaw:0,moving:false,ready:false,wrap:null,look:old?old.look:null};
  PARTY.set(id,p);
  fetchBytes(ASSET(heroGlbName),'soon').then(buf=>{
    const cur=PARTY.get(id); if(!cur||cur.gen!==gen) return;   // removed, or re-skinned again, while its model was still loading
    loadPuppetGLB(buf,label||heroGlbName,loaded=>{
      const c2=PARTY.get(id); if(!c2||c2.gen!==gen){ disposePuppet(loaded); return; }
      Object.assign(p,loaded,{ready:true});
      p.wrap.position.set(p.x,p.y,p.z); p.wrap.rotation.y=p.yaw; scene.add(p.wrap);
      if(p.actions.idle) playPuppet(p,'idle',{fade:0});
    });
  }).catch(e=>console.warn('party hero fetch '+id,e));
  return id;
}
function remove(id){ const p=PARTY.get(id); if(!p) return; undress(p); if(p.wrap) scene.remove(p.wrap); disposePuppet(p); PARTY.delete(id); }
// ---- the look (build 150: "don't see the guest's sword / familiars"): what a player wears, resolved on THEIR client
// (99-network.js lookOf: the weapon model key their own rig mounted, its tier, its set for the tint, the full set for
// the glow, the familiar's name and rarity) and rendered here on their puppet through the same builders the local hero
// uses -- attachWeapon on the puppet's own mount node, __familiar.build for the pet (decorative: it hovers at the
// shoulder, its shots are not synced), __setglow.dress for the aura shells. Re-dressed whenever the look key changes.
function mountNode(root){ let n=null; root.traverse(o=>{ if(!n&&/^(weapon|staff|bow)Mount_\d+/.test(o.name)) n=o; }); return n; }
function setLook(id,look){ const p=PARTY.get(id); if(!p) return; p.look=look||null; }
function undress(p){ if(p.wobj&&p.wobj.parent) p.wobj.parent.remove(p.wobj); p.wobj=null; p.wglow=null; if(p.fam){ scene.remove(p.fam); p.fam=null; } if(p.fam2){ scene.remove(p.fam2); p.fam2=null; } if(p.glow){ if(window.__setglow) window.__setglow.undress(p.glow); p.glow=null; } if(p.pglow){ scene.remove(p.pglow); p.pglow=null; } p.lookKey=undefined; }
// (the loaded pet models are part of the look key, so a pet is rebuilt once its Meshy model lands)
function dress(p){ const lk=p.look; const fams=(window.__familiar&&window.__familiar.glb)?window.__familiar.glb().join(',')+'/'+(window.__familiar.namedGlb?window.__familiar.namedGlb().join(','):''):'';   /* co-op sweep 2026-10-02: a named pet's model landing rebuilds the puppet's pet too */ const key=lk?[lk.w,lk.t,lk.ws,lk.s,lk.f&&lk.f.n,lk.f&&lk.f.r,lk.f2&&lk.f2.n,lk.f2&&lk.f2.r,lk.f&&lk.f.nm,lk.f2&&lk.f2.nm,lk.pd,fams].join('|'):''; if(key===p.lookKey) return; undress(p); p.lookKey=key; if(!lk) return;
  if(lk.w&&window.__weapons&&window.__weapons.attach){ if(p.mount===undefined) p.mount=mountNode(p.root); if(p.mount){ const myKey=key; window.__weapons.attach(p.mount,lk.w,lk.t||1,lk.ws||null,obj=>{ if(p.lookKey!==myKey||!PARTY.has(p.id)){ if(obj.parent) obj.parent.remove(obj); return; } if(p.wobj&&p.wobj.parent) p.wobj.parent.remove(p.wobj); p.wobj=obj; p.wglow=window.__heldglow&&window.__heldglow.dress?window.__heldglow.dress(obj):null; });   /* co-op sweep 2026-10-02: a partner's set weapon glows in his hand on our screen too (86w-setglow.js) */ } }
  if(lk.pd&&window.__procglow){ p.pglow=window.__procglow.make(); scene.add(p.pglow); }   // build 243: a teammate wearing proc'd gear glows gold on our screen too
  if(lk.f&&window.__familiar&&window.__familiar.build){ try{ const g=window.__familiar.build({name:lk.f.n||'Wisp',rarity:lk.f.r|0,slot:'familiar',named:lk.f.nm||undefined}); scene.add(g); p.fam=g; p.famT=0; }catch(e){ console.warn('party familiar',e); } }
  // build 505 (Matt: "jacob second pet not showing"): a teammate wearing Beast Mode or Malamute (97h) shows the 2nd pet at the other shoulder
  if(lk.f2&&window.__familiar&&window.__familiar.build){ try{ const g=window.__familiar.build({name:lk.f2.n||'Wisp',rarity:lk.f2.r|0,slot:'familiar',named:lk.f2.nm||undefined}); scene.add(g); p.fam2=g; }catch(e){ console.warn('party familiar 2',e); } }
  if(lk.s&&window.__setglow&&Meta.packs){ const pk=Meta.packs.get(lk.s); if(pk&&pk.col){ try{ p.glow=window.__setglow.dress(p.root,pk.col,p.scale||1); p.glowTier=lk.st||5; }catch(e){ console.warn('party glow',e); } } } }
function dressTick(p,dt){ if(p.wglow&&window.__heldglow) window.__heldglow.tick(p.wglow,dt); if(p.pglow&&window.__procglow) window.__procglow.tick(p.pglow,p.x,p.y,p.z,S.t); if(p.fam){ p.famT+=dt; const a=p.yaw+2.3; p.fam.position.set(p.x+Math.sin(a)*.85,p.y+1.45+Math.sin(p.famT*2.3)*.09,p.z+Math.cos(a)*.85); p.fam.rotation.y=p.yaw; const ud=p.fam.userData; if(ud&&ud.wings) ud.wings.forEach(w=>{ w.rotation.z=(w.userData.side||1)*Math.sin(p.famT*14)*.45; }); }
  if(p.fam2){ const t=(p.famT||0)+1.3, a=p.yaw-2.3; p.fam2.position.set(p.x+Math.sin(a)*.85,p.y+1.45+Math.sin(t*2.3)*.09,p.z+Math.cos(a)*.85); p.fam2.rotation.y=p.yaw; const ud=p.fam2.userData; if(ud&&ud.wings) ud.wings.forEach(w=>{ w.rotation.z=(w.userData.side||1)*Math.sin(t*14)*.45; }); }
  if(p.glow&&window.__setglow) window.__setglow.pulse(p.glow,S.t,p.glowTier);   // build 181: dimmer at three pieces, told by glowTier (set alongside p.glow in dress())
  if(p.wobj&&p.wobj.parent&&/^bow-/.test(p.wobj.name)&&window.__bow&&window.__bow.holdFor){ window.__bow.holdFor(p.wobj,p.yaw,0); window.__bow.animate(p.wobj,dt); } }   // build 159 (4/7): a Troll teammate carries his bow like a briefcase on our screen too (builds 155-156), the way his own screen shows it -- the mount alone stood it upright -- and its motes orbit instead of sitting in a heap at the lower tip
// what the network layer (or, today, a test script) calls each time it hears where a party member is: puppets ease
// toward the latest target rather than snapping to it, since real updates will arrive far slower than the render
// framerate and a snap would read as teleporting
// build 375 (Matt, in a game with Jacob on the pig bosses' map: "i see his towers but not him"): a teammate's puppet was only ever given x, z and a facing, so it stood at floor 0 -- UNDER any raised floor (the Deep Prison's terraces are 2, 4 and 6 up; the dais and stairs of the older halls). The height now rides along (y); an older host that sends none gets the floor under the puppet's feet
function setTarget(id,x,z,yaw,y){ const p=PARTY.get(id); if(!p) return; p.targetX=x; p.targetZ=z; if(yaw!==undefined) p.targetYaw=yaw; if(y!==undefined&&isFinite(y)) p.targetY=y; if(!p.ready){ p.x=x; p.z=z; p.yaw=p.targetYaw; if(p.targetY!==undefined) p.y=p.targetY; } }
const TURN=8;   // rad/s the yaw eases toward its target at
function updateParty(dt){
  PARTY.forEach(p=>{ if(!p.ready) return;
    const dx=p.targetX-p.x, dz=p.targetZ-p.z, d=Math.hypot(dx,dz);
    p.moving=d>.05;
    // build 159 (4/7): a flat 6 a second was slower than any player -- a walk is 7.5, a sprint 11, a geared sprint 20 and more -- so
    // every teammate on the move fell further behind on everyone else's screen (a sprinting host was nearly 5 behind after one
    // second) and only caught up once they stopped. Now it closes the gap at 8 times its length a second (never under the old 6): a
    // walker is shown about 1 behind, a sprinter 1.4. A jump too big for any stride -- a Tear of the Rootgate to a gate, a fall and
    // back up at the spawn -- is shown where it lands, not walked across the hall
    if(p.moving){ if(d>12){ p.x=p.targetX; p.z=p.targetZ; } else { const sp=Math.min(d,Math.max(6,8*d)*dt); p.x+=dx/d*sp; p.z+=dz/d*sp; } }
    let dy=p.targetYaw-p.yaw; dy=((dy+PI)%(2*PI)+2*PI)%(2*PI)-PI; const maxTurn=TURN*dt; p.yaw+=Math.max(-maxTurn,Math.min(maxTurn,dy));
    const st=p.moving?(p.actions.run?'run':'walk'):'idle';
    if(p.actions[st]) playPuppet(p,st,{fade:.15}); else if(p.actions.idle) playPuppet(p,'idle',{fade:.15});
    { const ty=p.targetY!==undefined?p.targetY:baseFloor(p.x,p.z); p.y=(typeof p.y!=='number'||!isFinite(p.y))?ty:p.y+(ty-p.y)*Math.min(1,dt*14); }   /* ride the floor (and a jump) at a few frames' lag, not a pop */
    p.mixer.update(dt); p.wrap.position.set(p.x,p.y,p.z); p.wrap.rotation.y=p.yaw; dress(p); dressTick(p,dt); });
}
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); updateParty(dt); }; }
window.__party={ add, remove, setTarget, setLook,
  list:()=>[...PARTY.keys()],
  get:id=>{ const p=PARTY.get(id); if(!p) return null; return {id:p.id,glb:p.glb,x:+p.x.toFixed(3),y:+(p.y||0).toFixed(3),z:+p.z.toFixed(3),yaw:+p.yaw.toFixed(3),ready:p.ready,moving:p.moving,cur:p.cur?Object.keys(p.actions).find(k=>p.actions[k]===p.cur):null,label:p.label,look:p.look||null,weapon:!!(p.wobj&&p.wobj.parent),weaponName:p.wobj&&p.wobj.userData.sword?p.wobj.userData.sword.name:null,weaponGlow:p.wglow?p.wglow.mats.length:0,familiar:!!p.fam,familiar2:p.fam2?(p.fam2.userData&&p.fam2.userData.kind)||true:null,familiarKind:p.fam&&p.fam.userData?p.fam.userData.kind||null:null,familiarNamed:p.fam&&p.fam.userData?p.fam.userData.named||null:null,familiar2Named:p.fam2&&p.fam2.userData?p.fam2.userData.named||null:null,glow:!!(p.glow&&p.glow.length),glowTier:p.glow&&p.glow.length?(p.glowTier||5):0}; } };   // build 181: glowTier (armorlook-test.mjs) -- the softer three-piece shell now rides the same puppet glow, told which tier to draw
})();
