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
    cb({wrap:fit.wrap,root,mixer,actions,map,cur:null,label});
  }catch(e){ console.warn('party glb '+label,e); } },e=>console.warn('party glb '+label,e));
}
function playPuppet(p,name,o){ const a=p.actions[name]; if(!a) return; o=o||{}; if(p.cur===a&&!o.restart) return; const prev=p.cur; p.cur=a; a.reset(); a.timeScale=o.speed||1; a.setEffectiveWeight(1); if(prev&&prev!==a){ if(o.fade) a.crossFadeFrom(prev,o.fade,false); else prev.stop(); } a.play(); }
function disposePuppet(p){ if(!p.root) return; p.root.traverse(o=>{ if(!o.isMesh) return; if(!o.userData.isOL&&o.geometry) o.geometry.dispose(); const mats=Array.isArray(o.material)?o.material:[o.material]; mats.forEach(m=>{ if(m&&m.map&&!o.userData.isOL) m.map.dispose(); if(m) m.dispose(); }); }); }
function add(id,heroGlbName,label){
  if(PARTY.has(id)) return id;
  const p={id,x:0,y:0,z:0,yaw:0,targetX:0,targetZ:0,targetYaw:0,moving:false,ready:false,wrap:null};
  PARTY.set(id,p);
  fetchBytes(ASSET(heroGlbName)).then(buf=>{
    if(!PARTY.has(id)) return;   // removed while its model was still loading
    loadPuppetGLB(buf,label||heroGlbName,loaded=>{
      if(!PARTY.has(id)){ disposePuppet(loaded); return; }
      Object.assign(p,loaded,{ready:true});
      p.wrap.position.set(p.x,p.y,p.z); p.wrap.rotation.y=p.yaw; scene.add(p.wrap);
      if(p.actions.idle) playPuppet(p,'idle',{fade:0});
    });
  }).catch(e=>console.warn('party hero fetch '+id,e));
  return id;
}
function remove(id){ const p=PARTY.get(id); if(!p) return; if(p.wrap) scene.remove(p.wrap); disposePuppet(p); PARTY.delete(id); }
// what the network layer (or, today, a test script) calls each time it hears where a party member is: puppets ease
// toward the latest target rather than snapping to it, since real updates will arrive far slower than the render
// framerate and a snap would read as teleporting
function setTarget(id,x,z,yaw){ const p=PARTY.get(id); if(!p) return; p.targetX=x; p.targetZ=z; if(yaw!==undefined) p.targetYaw=yaw; if(!p.ready){ p.x=x; p.z=z; p.yaw=p.targetYaw; } }
const TURN=8;   // rad/s the yaw eases toward its target at
function updateParty(dt){
  PARTY.forEach(p=>{ if(!p.ready) return;
    const dx=p.targetX-p.x, dz=p.targetZ-p.z, d=Math.hypot(dx,dz);
    p.moving=d>.05;
    if(p.moving){ const sp=Math.min(d,6*dt); p.x+=dx/d*sp; p.z+=dz/d*sp; }
    let dy=p.targetYaw-p.yaw; dy=((dy+PI)%(2*PI)+2*PI)%(2*PI)-PI; const maxTurn=TURN*dt; p.yaw+=Math.max(-maxTurn,Math.min(maxTurn,dy));
    const st=p.moving?(p.actions.run?'run':'walk'):'idle';
    if(p.actions[st]) playPuppet(p,st,{fade:.15}); else if(p.actions.idle) playPuppet(p,'idle',{fade:.15});
    p.mixer.update(dt); p.wrap.position.set(p.x,p.y,p.z); p.wrap.rotation.y=p.yaw; });
}
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); updateParty(dt); }; }
window.__party={ add, remove, setTarget,
  list:()=>[...PARTY.keys()],
  get:id=>{ const p=PARTY.get(id); if(!p) return null; return {id:p.id,x:+p.x.toFixed(3),z:+p.z.toFixed(3),yaw:+p.yaw.toFixed(3),ready:p.ready,moving:p.moving,cur:p.cur?Object.keys(p.actions).find(k=>p.actions[k]===p.cur):null,label:p.label}; } };
})();
