// ===== THE KNIGHT'S WHIRLWIND SPINS (build 260). Matt: "on the knights special attack he needs to actually spin like a tornado". Until now Whirlwind Cleave was a flash and a ring: the Knight stood still. Now (visual only; the damage,
// the timing, the cooldown and the co-op relay of 73-specials.js are untouched):
//   * WHILE HE CHARGES he winds up: his body turns slowly AWAY from the swing (up to about 50 degrees, easing out as the charge fills), like a man coiling before a spin;
//   * WHEN IT GOES OFF he spins three full turns in about a second (fast at first, slowing to a stop facing the way he was), rotating the whole model about his feet -- the sword arm and shield swing round with him;
//   * a TORNADO stands round him for the same second: three open cones of drifting light-streaks, narrow at his feet and wide overhead, turning at different speeds and opposite ways, growing out from him, a swirl of light on the
//     floor, fading away as he slows. Everyone sees the tornado (a co-op teammate's whirl shows one where it happens: 73-specials.js playFlourish calls window.__whirl.vortex); only the caster's own body spins on their screen.
// It turns the model through heroYawOff (game.js: the wrap's rotation is hero.yaw + heroYawOff, applied when the hero is drawn), set from a Meta.update wrapper that loads AFTER 83-bow.js's (which also eases heroYawOff, for the
// bow's turn) so this one has the last word while it is on. Test hook: window.__whirl.
(function(){
const TURNS=3, DUR=1.05, WIND=-.9;
let spinT=-1, windK=0, charging=false;
const V=[];   // live tornados {g,bands,t,dur}
let TEX=null; function tex(){ if(TEX) return TEX; const c=document.createElement('canvas'); c.width=256; c.height=64; const g=c.getContext('2d'); g.clearRect(0,0,256,64);
  for(let i=0;i<12;i++){ const x=i*21.3+(i%3)*3, w=5+(i%4)*2.5; const gr=g.createLinearGradient(x,0,x+w+110,64); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(.5,'rgba(226,238,255,'+(.5+(i%3)*.2)+')'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.beginPath(); g.moveTo(x,0); g.lineTo(x+w,0); g.lineTo(x+w+110,64); g.lineTo(x+110,64); g.closePath(); g.fill(); }
  TEX=new THREE.CanvasTexture(c); TEX.wrapS=THREE.RepeatWrapping; TEX.wrapT=THREE.ClampToEdgeWrapping; TEX.repeat.set(1,1); return TEX; }
const BANDS=[{rb:.5,rt:1.25,h:3.4,sp:13,off:1.1,op:.5},{rb:.85,rt:2.0,h:3.0,sp:-9,off:-.8,op:.4},{rb:1.3,rt:3.0,h:2.4,sp:7,off:.6,op:.3}];
function vortex(x,z){ const y=(typeof baseFloor==='function'?baseFloor(x,z):0)+.05; const g=new THREE.Group(); g.position.set(x,y,z); const bands=[];
  for(const b of BANDS){ const m=new THREE.MeshBasicMaterial({map:tex().clone(),transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,color:0xdfe8ff}); m.map.needsUpdate=true; m.map.wrapS=THREE.RepeatWrapping; m.map.repeat.set(1,1);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(b.rt,b.rb,b.h,28,1,true),m); mesh.position.y=b.h/2; mesh.userData.noOL=true; mesh.frustumCulled=false; g.add(mesh); bands.push({mesh,m,b}); }
  const ringM=new THREE.MeshBasicMaterial({color:0xcfd8ff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}); const ring=new THREE.Mesh(new THREE.RingGeometry(3.1,4,64,1),ringM); ring.rotation.x=-PI/2; ring.position.y=.04; ring.userData.noOL=true; g.add(ring);
  const dust=[]; for(let i=0;i<22;i++){ const sp=glow(0xe8eef8,.16+rnd()*.14,.7); sp.userData.shared=false; g.add(sp); dust.push({sp,a:rnd()*TAU,r:.7+rnd()*2.6,h:.1+rnd()*2.6,w:5+rnd()*6}); }
  scene.add(g); V.push({g,bands,ring,ringM,dust,t:0,dur:DUR}); if(V.length>4){ const o=V.shift(); scene.remove(o.g); } }
function vortexUpdate(dt){ for(let i=V.length-1;i>=0;i--){ const v=V[i]; v.t+=dt; const k=v.t/v.dur; if(k>=1){ scene.remove(v.g); v.bands.forEach(b=>{ b.mesh.geometry.dispose(); b.m.dispose(); }); v.dust.forEach(d=>d.sp.material.dispose()); V.splice(i,1); continue; }
    const grow=Math.min(1,k/.22), fade=k<.6?1:1-(k-.6)/.4; v.g.scale.setScalar(.3+.7*(1-Math.pow(1-grow,3)));
    for(const b of v.bands){ b.mesh.rotation.y+=b.b.sp*dt*(1.4-k*.9); b.m.map.offset.x+=b.b.off*dt*2; b.m.opacity=b.b.op*fade; }
    for(const d of v.dust){ d.a+=d.w*dt*(1.3-k*.8); const rr=d.r*(.5+.5*Math.min(1,k/.3)); d.sp.position.set(Math.cos(d.a)*rr,d.h*(.6+.4*Math.sin(v.t*5+d.a)),Math.sin(d.a)*rr); d.sp.material.opacity=.7*fade; }
    v.ringM.opacity=.3*fade; v.ring.scale.setScalar(.6+.4*grow); v.ring.rotation.z+=dt*6; } }
const ease=t=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3);
function spin(){ spinT=0; charging=false; try{ noise(.9,.1,1300); beep(300,.5,'sawtooth',.05,600); }catch(e){} }
function charge(k){ charging=true; windK=Math.max(0,Math.min(1,k)); }
function release(){ charging=false; windK=0; }
// the model's turn: wound back while charging, then three turns out of the wind-up angle, then home
function angle(){ if(spinT>=0) return WIND*(1-ease(spinT/.18))+TURNS*2*PI*ease(spinT/DUR); if(windK>0) return WIND*ease(windK); return 0; }
let lastSet=false;
{ const prev=Meta.update; Meta.update=function(dt){ prev.apply(this,arguments); vortexUpdate(dt);
    if(spinT>=0){ spinT+=dt; if(spinT>=DUR){ spinT=-1; } }
    if(!charging&&spinT<0&&windK>0){ windK=Math.max(0,windK-dt*4); }   // a charge let go of early unwinds
    const a=angle(); if(spinT>=0||windK>0||charging){ heroYawOff=a; lastSet=true; } else if(lastSet){ heroYawOff=0; lastSet=false; } }; }
window.__whirl={spin,charge,release,vortex,angle,state:()=>({spinning:spinT>=0,t:+spinT.toFixed(3),wind:+windK.toFixed(2),charging,angle:+angle().toFixed(3),off:+heroYawOff.toFixed(3),tornados:V.length,bands:V.reduce((a,v)=>a+v.bands.length,0),opacity:V.length?+V[V.length-1].bands[0].m.opacity.toFixed(2):0}),TURNS,DUR};
})();
