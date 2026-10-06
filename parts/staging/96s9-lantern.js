// ===== THE LAST LANTERN -- the Deep Prison's first scene, before THE TORCH LINE (build 556). Matt chose where it plays ("ok try it"): the first time the Deep Prison's build phase begins,
// and when it ends the Torch Line follows straight on (96s2-torchline.js now waits for this one) -- the Corruptor's snip leaves the prison black, and the Torch Line's lights come out of that black.
// From the plan (memory rootgate-cinematics.md): black, the drip and a slow heartbeat; one gnome's lantern at the top of the switchbacks; chains and day-tally scratches on the wall; a whisper,
// "...hold..."; the Heartroot pulsing weak far below; the Corruptor of Fate unfolding above, shears open on a glowing thread -- snick -- every torch out; the lantern flickers and holds, raised
// higher; "Fate can be cut. The gate must hold." ~34 s on the wall clock:
//    0.0  BLACK -- drips, a slow heartbeat.
//    4.0  THE LANTERN -- the Knight on the rim, a lantern in his hand, torches burning round the pit.
//   10.0  THE WALL -- along the stone beside him: chains hanging, rows of tally scratches; a whisper, "...hold...".
//   16.0  BELOW -- down the pit to the Heartroot, glowing weak, slow to beat.
//   21.0  THE CORRUPTOR -- across the pit he rises, four arms lifting (his own rig, cast), a gold thread running from the Heartroot to his hands; the shears swing -- snick -- the thread parts,
//         every torch round the pit dies.
//   28.0  THE LANTERN HOLDS -- it gutters, nearly out, then steadies and burns brighter; he lifts it; "Fate can be cut. The gate must hold."; to black.
// The Corruptor is a stand-in (makeMob), never in `enemies`. The Knight is the prologue's (window.__prologue.crew). Test hook: window.__lantern.
(function(){
'use strict';
window.__lantern={ info:()=>null };
if(!window.CINE) return;
const ID='lantern', DUR=30, PRISON=typeof MAP!=='undefined'&&MAP&&MAP.id==='prison';
const SH={ black:0, lantern:3, wall:9, below:13, corrupt:17, snick:22.4, holds:24.4 };   // build 557: four seconds shorter, the wall shot cut to four
const cnt={ setups:0, teardowns:0, torches:0, out:0, whisper:0, snick:0, knight:0, corruptor:0 };
const ssm=k=>k<=0?0:k>=1?1:k*k*(3-2*k), L3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
let prng=1; const rand=()=>{ prng=(prng*16807)%2147483647; return (prng-1)/2147483646; };
// ---------------------------------------------------------------- words (inside #cine: the page's other children are hidden while a scene plays)
let flash=null, flashT=null; function flashEl(){ if(flash) return flash; flash=document.createElement('div'); flash.style.cssText='position:fixed;inset:0;background:#fff8f0;opacity:0;pointer-events:none;z-index:97'; (document.getElementById('cine')||document.body).appendChild(flash); flashT=0; return flash; }
let words=null; function wordsEl(){ if(words) return words; words=document.createElement('div'); words.id='cineWords3';
  const st=document.createElement('style'); st.textContent='#cineWords3{position:fixed;left:50%;bottom:16vh;transform:translateX(-50%);z-index:96;pointer-events:none;font:italic clamp(22px,3.1vw,46px) Georgia,serif;color:#e8f0ff;letter-spacing:.05em;text-shadow:0 0 20px #9fd0ff66,0 2px 0 #000;opacity:0;white-space:nowrap;text-align:center}'; document.head.appendChild(st);
  (document.getElementById('cine')||document.body).appendChild(words); return words; }
// ---------------------------------------------------------------- sounds
function noiseBuf(a,len){ const b=a.createBuffer(1,(a.sampleRate*len)|0,a.sampleRate), c=b.getChannelData(0); for(let i=0;i<c.length;i++) c[i]=Math.random()*2-1; return b; }
function whisper(U){ if(!U||!U.a) return; const a=U.a, t=a.currentTime; for(const [f,dt,len,v] of [[1100,0,.35,.05],[700,.28,.9,.06]]){ const n=a.createBufferSource(); n.buffer=noiseBuf(a,len); const bp=a.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=4; bp.frequency.setValueAtTime(f,t+dt); bp.frequency.linearRampToValueAtTime(f*.7,t+dt+len);
    const g=a.createGain(); g.gain.setValueAtTime(.0001,t+dt); g.gain.exponentialRampToValueAtTime(v,t+dt+.08); g.gain.exponentialRampToValueAtTime(.0001,t+dt+len); n.connect(bp).connect(g); const d=a.createDelay(1); d.delayTime.value=.33; const fb=a.createGain(); fb.gain.value=.45; g.connect(U.sfx); g.connect(d); d.connect(fb).connect(d); d.connect(U.sfx); n.start(t+dt); } cnt.whisper++; }
function snickSnd(U){ if(!U||!U.a) return; const a=U.a, t=a.currentTime; for(const dt of [0,.07]){ const n=a.createBufferSource(); n.buffer=noiseBuf(a,.09); const hp=a.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=3500; const g=a.createGain(); g.gain.setValueAtTime(.35,t+dt); g.gain.exponentialRampToValueAtTime(.0001,t+dt+.09); n.connect(hp).connect(g).connect(U.sfx); n.start(t+dt); }
  const o=a.createOscillator(), g=a.createGain(); o.type='triangle'; o.frequency.setValueAtTime(5200,t+.07); o.frequency.exponentialRampToValueAtTime(2600,t+.6); g.gain.setValueAtTime(.08,t+.07); g.gain.exponentialRampToValueAtTime(.0001,t+1.2); o.connect(g).connect(U.sfx); o.start(t+.07); o.stop(t+1.3); cnt.snick++; }
function hiss(U){ if(!U||!U.a) return; const a=U.a, t=a.currentTime, n=a.createBufferSource(); n.buffer=noiseBuf(a,1.6); const bp=a.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=.7; bp.frequency.setValueAtTime(2400,t); bp.frequency.exponentialRampToValueAtTime(500,t+1.5); const g=a.createGain(); g.gain.setValueAtTime(.12,t); g.gain.exponentialRampToValueAtTime(.0001,t+1.6); n.connect(bp).connect(g).connect(U.sfx); n.start(t); }
// ---------------------------------------------------------------- the scene
const OWN=[]; function own(m){ m.userData.cineOwn=true; m.userData.noOL=true; return m; }
let knight=null, lantern=null, lanternG=null, corr=null, thread=null, threadM=null, heartG=null, torches=[], A_={}, lastCut=null, dripT=0, beatT=0, lastBeat=-9;
const SRC=[0,1,2,3,4,5,6,7].map(()=>({ x:0, y:-80, z:0, on:false, ph:0, k:1 }));
function rayHit(o,d,max){ try{ const rc=new THREE.Raycaster(o,d,0,max); rc.camera=camera; world.updateMatrixWorld(true); const h=rc.intersectObject(world,true).find(h=>h.object.isMesh&&!h.object.userData.isOL&&h.object.visible&&!(h.object.material&&(h.object.material.transparent||h.object.material.blending===THREE.AdditiveBlending))); return h||null; }catch(e){ return null; } }
function makeLantern(){ const g=new THREE.Group(), iron=new THREE.MeshToonMaterial({ color:C(0x5a4a3a) }), brass=new THREE.MeshToonMaterial({ color:C(0xd8a84a) }); brass.emissive=C(0x4a3010); OWN.push(iron,brass);
  const add=(geo,m,x,y,z)=>{ const o=own(new THREE.Mesh(geo,m)); o.position.set(x,y,z); g.add(o); return o; };
  add(new THREE.CylinderGeometry(.13,.15,.04,8),brass,0,0,0); add(new THREE.ConeGeometry(.16,.14,8),brass,0,.37,0); add(new THREE.TorusGeometry(.06,.012,5,12),brass,0,.48,0);
  for(let i=0;i<4;i++){ const a=i/4*TAU+PI/4; add(new THREE.BoxGeometry(.02,.3,.02),iron,Math.cos(a)*.12,.17,Math.sin(a)*.12); }
  const gm=new THREE.MeshBasicMaterial({ color:C(0xffe2a8), transparent:true, opacity:.9 }); OWN.push(gm); add(new THREE.CylinderGeometry(.1,.1,.26,10),gm,0,.17,0);
  const flame=glow(0xffb050,.5,.95); flame.position.y=.17; g.add(flame); const halo=glow(0xffa040,3.2,.45); halo.position.y=.17; g.add(halo); OWN.push(flame.material,halo.material); g.userData.flame=flame; g.userData.halo=halo; return g; }
let TT=null; function tallyTex(){ if(TT) return TT; const c=document.createElement('canvas'); c.width=128; c.height=128;   /* build 559 (Matt: "the hashmarks run off the pillar"): two groups across, four rows -- a block that fits the pillar */ const g=c.getContext('2d'); g.strokeStyle='rgba(225,215,200,.75)'; g.lineCap='round';
  for(let row=0;row<4;row++) for(let grp=0;grp<2;grp++){ const x0=14+grp*48+(Math.random()-.5)*4, y0=12+row*29; g.lineWidth=2+Math.random(); for(let k=0;k<4;k++){ g.beginPath(); g.moveTo(x0+k*8,y0+Math.random()*2); g.lineTo(x0+k*8+(Math.random()-.5)*3,y0+20); g.stroke(); } g.beginPath(); g.moveTo(x0-4,y0+16); g.lineTo(x0+30,y0+4); g.stroke(); }
  TT=new THREE.CanvasTexture(c); TT.encoding=THREE.sRGBEncoding; return TT; }
function setup(ctx){ if(!PRISON) return false; const C2=window.__prologue&&window.__prologue.crew; cnt.setups++; prng=3301; torches=[]; dripT=0; beatT=0;
  const gy=hgt[GOAL]||0; A_.heart={ x:0, y:gy, z:0 };
  // the lantern's spot: the head of the switchbacks on the west rim (the torch line's flight top)
  const sx=-28.5, sz=64.5; A_.spot={ x:sx, z:sz, y:baseFloor(sx,sz) };
  // the knight with the lantern in his hand
  const P=window.__party&&window.__party.model; const km=C2&&C2.MODEL.knight;
  if(km){ km.wrap.position.set(sx,A_.spot.y,sz); km.wrap.rotation.y=Math.atan2(-sx,-sz); km.wrap.visible=true; ctx.group.add(km.wrap); if(P&&km.actions.idle) P.play(km,'idle',{fade:0,restart:true});
    lantern=makeLantern(); const mt=P&&P.mount(km.root); lantern.scale.setScalar(1.5); lantern.position.set(sx+.6,A_.spot.y+1.1,sz); ctx.group.add(lantern);   /* hung from his hand each frame, always upright (step) */
    const chain=n=>{ const hand=n&&n.parent, fore=hand&&hand.parent, upper=fore&&fore.parent; return upper&&upper.parent?{ hand, upper }:null; };
    let left=null; try{ const DW=window.__dualwield, dw=DW&&DW.prep?DW.prep(km.root):null; left=dw&&dw.node?chain(dw.node):null; }catch(e){}
    knight={ m:km, right:mt?chain(mt):null, left }; cnt.knight=1; }
  // torches round the pit: on the rim, a ring of points where the floor stands high
  for(let i=0;i<220&&torches.length<14;i++){ const x=-44+rand()*88, z=-6+rand()*82, y=baseFloor(x,z); if(!(y>3)||Math.hypot(x-sx,z-sz)>48||Math.hypot(x-sx,z-sz)<4||torches.some(T=>Math.hypot(T.x-x,T.z-z)<7)) continue; const f1=glow(0xff7a1a,1.4,.9), f2=glow(0xffd060,.7,.9); f1.position.set(x,y+2.4,z); f2.position.set(x,y+2.3,z); ctx.group.add(f1); ctx.group.add(f2); OWN.push(f1.material,f2.material); const sm=glow(0x8a8494,1.4,0); sm.position.set(x,y+2.4,z); ctx.group.add(sm); OWN.push(sm.material); torches.push({ f1, f2, x, y:y+2.4, z, ph:rand()*6, smoke:sm }); }
  cnt.torches=torches.length;
  // the wall beside him: tally scratches and chains, found by looking out from his spot
  { let best=null; for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const h=rayHit(new THREE.Vector3(sx,A_.spot.y+1.6,sz),new THREE.Vector3(dx,0,dz),9); if(h&&(!best||h.distance<best.h.distance)) best={ h, dx, dz }; }
    if(best){ const p=best.h.point, nx=-best.dx, nz=-best.dz; A_.wall={ x:p.x+nx*.04, y:p.y, z:p.z+nz*.04, nx, nz };
      const tm=new THREE.MeshBasicMaterial({ map:tallyTex(), transparent:true, depthWrite:false, opacity:.85 }); OWN.push(tm); const tp=own(new THREE.Mesh(new THREE.PlaneGeometry(.78,.78),tm)); tp.position.set(A_.wall.x,A_.spot.y+1.4,A_.wall.z); tp.lookAt(A_.wall.x+nx,A_.spot.y+1.4,A_.wall.z+nz); ctx.group.add(tp);
      const iron=new THREE.MeshToonMaterial({ color:C(0x3a3348) }); OWN.push(iron); const tx=-nz, tz=nx; for(const off of [-1.6,1.4]){ for(let k=0;k<9;k++){ const l=own(new THREE.Mesh(new THREE.TorusGeometry(.07,.02,5,10),iron)); l.position.set(A_.wall.x+nx*.12+tx*off,A_.spot.y+3.2-k*.17,A_.wall.z+nz*.12+tz*off); l.rotation.y=k%2?PI/2:0; ctx.group.add(l); }
        const cuff=own(new THREE.Mesh(new THREE.TorusGeometry(.12,.035,6,12),iron)); cuff.position.set(A_.wall.x+nx*.14+tx*off,A_.spot.y+1.62,A_.wall.z+nz*.14+tz*off); ctx.group.add(cuff); } } }
  if(!A_.wall) A_.wall={ x:sx+2, y:A_.spot.y+1.5, z:sz, nx:-1, nz:0 };
  // the Heartroot's weak glow
  heartG=glow(0x6cff9a,8,0); heartG.material.fog=false; heartG.position.set(0,gy+1.8,0); ctx.group.add(heartG); OWN.push(heartG.material);
  // the Corruptor, across the pit from him, huge, and the gold thread from the Heartroot to his hands
  try{ const m=makeMob('corruptor'); if(m&&m.glb){ const dx=-sx, dz=-sz, dl=Math.hypot(dx,dz); const cx=sx+dx/dl*27, cz=sz+dz/dl*27; A_.corrBase=A_.spot.y+3.5;   /* towering over the arches past the rim */ m.g.position.set(cx,A_.corrBase,cz); m.g.rotation.y=Math.atan2(sx-cx,sz-cz); const s=(m.g.scale.x||1)*2.2; m.g.scale.setScalar(s); m.g.visible=false; ctx.group.add(m.g); corr=m; cnt.corruptor=1;
    const bl=glow(0x9a4dff,13,0); bl.material.fog=false; bl.position.set(cx+dx/dl*1.6,A_.corrBase+5,cz+dz/dl*1.6); ctx.group.add(bl); OWN.push(bl.material); A_.back=bl; } }catch(e){ corr=null; }
  threadM=new THREE.MeshBasicMaterial({ color:C(0xffd770), transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending }); OWN.push(threadM); thread=own(new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,1,6),threadM)); ctx.group.add(thread);
  A_.hand=corr?{ x:corr.g.position.x, y:A_.corrBase+4.3*2.2*.62, z:corr.g.position.z }:{ x:0, y:gy+14, z:0 };
  ctx.darken({ hemi:.03, emissive:.07, fog:[90,240], flat:.42 }); const F=ctx.fireLights(8); F.I=1.4; F.dist=15; F.col=0xff9a48;
  return true; }
// turn the upper arm so the hand points at a spot (world): its swing measured from the clip's own pose this frame
const _v1=new THREE.Vector3(), _v2=new THREE.Vector3(), _v3=new THREE.Vector3(), _q1=new THREE.Quaternion(), _q2=new THREE.Quaternion(), _q3=new THREE.Quaternion();
function aim(ch,target,k){ if(!ch||k<=0) return; ch.upper.getWorldPosition(_v1); ch.hand.getWorldPosition(_v2); _v2.sub(_v1).normalize(); _v3.copy(target).sub(_v1).normalize(); _q1.setFromUnitVectors(_v2,_v3); if(k<1) _q1.slerp(_q3.identity(),1-k);
  ch.upper.getWorldQuaternion(_q2); _q2.premultiply(_q1); ch.upper.parent.getWorldQuaternion(_q3); ch.upper.quaternion.copy(_q3.invert().multiply(_q2)); ch.upper.updateMatrixWorld(true); }
function placeThread(a,b){ const A=new THREE.Vector3(a.x,a.y,a.z), B=new THREE.Vector3(b.x,b.y,b.z), L=A.distanceTo(B); thread.position.copy(A).lerp(B,.5); thread.scale.set(1,Math.max(.01,L),1); thread.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.sub(A).normalize()); }
function camFor(t){ const S0=A_.spot, W=A_.wall, Hh=A_.heart, Hd=A_.hand;
  const toPit=Math.atan2(-S0.x,-S0.z);
  if(t<SH.wall){ const k=ssm((t-SH.lantern)/(SH.wall-SH.lantern)), a=toPit-.5+.6*k, r=6.2-.8*k; return { p:[S0.x+Math.sin(a)*r,S0.y+2,S0.z+Math.cos(a)*r], l:[S0.x,S0.y+1.5,S0.z], fov:44, name:'lantern', f:{ x:S0.x, y:S0.y+1, z:S0.z } }; }
  if(t<SH.below){ const k=ssm((t-SH.wall)/(SH.below-SH.wall)), tx=-W.nz, tz=W.nx, along=-2.4+4.4*k; return { p:[W.x+W.nx*2.2+tx*along,S0.y+1.6,W.z+W.nz*2.2+tz*along], l:[W.x+tx*(along+.6),S0.y+1.8,W.z+tz*(along+.6)], fov:48, name:'wall', f:{ x:W.x, y:S0.y+1, z:W.z } }; }
  if(t<SH.corrupt){ const k=ssm((t-SH.below)/(SH.corrupt-SH.below)), dx=-S0.x, dz=-S0.z, dl=Math.hypot(dx,dz); return { p:[Hh.x+6-1.6*k,Hh.y+3.6-.6*k,Hh.z+7-1.8*k], l:[Hh.x,Hh.y+2,Hh.z], fov:46, name:'below', f:{ x:Hh.x, y:Hh.y+1, z:Hh.z } }; }
  if(t<SH.holds){ const k=ssm((t-SH.corrupt)/(SH.holds-SH.corrupt)), dx=-S0.x, dz=-S0.z, dl=Math.hypot(dx,dz); const cb=A_.corrBase||Hd.y-6; let p=[S0.x+dx/dl*3.2-dz/dl*1.2,S0.y+1.3,S0.z+dz/dl*3.2+dx/dl*1.2];   /* out on the rim's edge, nothing between him and the camera */ if(A_.shakeT>0){ p=[p[0]+(Math.random()-.5)*.5*A_.shakeT,p[1]+(Math.random()-.5)*.4*A_.shakeT,p[2]+(Math.random()-.5)*.5*A_.shakeT]; } return { p, l:L3([Hd.x,cb+2,Hd.z],[Hd.x,cb+5,Hd.z],k), fov:56, name:'corrupt', f:{ x:S0.x, y:S0.y+1, z:S0.z } }; }
  const k=ssm((t-SH.holds)/(DUR-SH.holds)), a=toPit+.35, r=7.2-.8*k; return { p:[S0.x+Math.sin(a)*r,S0.y+2.1+.3*k,S0.z+Math.cos(a)*r], l:[S0.x,S0.y+1.7+.3*k,S0.z], fov:44, name:'holds', f:{ x:S0.x, y:S0.y+1, z:S0.z } }; }
function step(ctx,t,dt){ const U=ctx.audio, F=ctx.fire, P=window.__party&&window.__party.model, W=wordsEl();
  ctx.black(t<SH.lantern?1:t<SH.lantern+1.6?1-ssm((t-SH.lantern)/1.6):t>DUR-1.6?ssm((t-(DUR-1.6))/1.4):0); ctx.title(0);
  // the words
  const wd=t>=SH.wall+2.6&&t<SH.below?['…hold…',ssm((t-SH.wall-2.6)/.5)*(1-ssm((t-SH.below+.8)/.6))]:t>=SH.holds+2.2?['Fate can be cut. The gate must hold.',ssm((t-SH.holds-2.2)/.8)*(1-ssm((t-DUR+1.4)/1))]:['',0];
  W.textContent=wd[0]; W.style.opacity=String(wd[1]);
  // the heartbeat, slow; the Heartroot's glow on it
  beatT-=dt; if(t>.8&&beatT<=0){ beatT=t<SH.snick?1.7:2.4; lastBeat=t; U.heart(t<SH.snick?.14:.09); } const pulse=Math.exp(-(t-lastBeat)*4);
  heartG.material.opacity=(t>=SH.below?(.18+.35*pulse):0)*(t>=SH.snick?.55:1);
  dripT-=dt; if(t<SH.corrupt&&dripT<=0){ dripT=.9+Math.random()*1.6; U.drip(.03+Math.random()*.03,(Math.random()-.5)*1.4); }
  ctx.once('drone',0,()=>{ U.droneOn(.045,5); },99);
  // the knight and his lantern
  if(knight){ const m=knight.m; if(m.mixer) m.mixer.update(dt); m.wrap.updateMatrixWorld(true); const W0=m.wrap.position, yaw=m.wrap.rotation.y, fx=Math.sin(yaw), fz=Math.cos(yaw), rx=-fz, rz=fx, HT=2.3;
    const lift=0, y=HT*.38, fwd=.32, side=.62;   /* build 559: held low at his side the whole scene -- no lift that puts his hand in the middle of the shot */   /* held out low at his side, then lifted high above his head -- never across his face */
    aim(knight.right,new THREE.Vector3(W0.x+fx*fwd-rx*side,W0.y+y,W0.z+fz*fwd-rz*side),1);
    if(knight.right&&lantern){ knight.right.hand.getWorldPosition(_v1); lantern.position.set(_v1.x,_v1.y-.74,_v1.z); lantern.rotation.set(0,yaw,0); }   /* the ring at his hand, the lantern hanging straight */
    aim(knight.left,new THREE.Vector3(W0.x+rx*.5+fx*.08,W0.y+HT*.12,W0.z+rz*.5+fz*.08),1); }
  let lf=1+.08*Math.sin(t*13)+.05*Math.sin(t*29); if(t>=SH.holds&&t<SH.holds+1.6){ const k=(t-SH.holds)/1.6; lf*=(.2+.8*Math.abs(Math.sin(k*9)))*(1-.6*Math.sin(k*PI)); } else if(t>=SH.holds+1.6) lf*=1+.8*ssm((t-SH.holds-1.6)/1.2);   /* ...it blazes up instead */
  if(lantern){ lantern.userData.flame.material.opacity=.95*Math.min(1,lf); lantern.userData.halo.material.opacity=.45*lf; lantern.userData.halo.scale.setScalar(3.6*lf); }
  // the torches: burning, then out at the snick
  const out=t>=SH.snick; torches.forEach((T,i)=>{ const k=out?Math.max(0,1-(t-SH.snick-i*.03)/.35):1, fl=1+.12*Math.sin(t*11+T.ph); T.f1.material.opacity=.9*k; T.f2.material.opacity=.9*k; T.f1.scale.set(1.4*fl,1.9*fl,1); });
  ctx.once('hiss',SH.snick+.05,()=>{ hiss(U); cnt.out=torches.length; });
  // the Corruptor: rises, casts, swings -- snick
  if(corr){ const show=t>=SH.corrupt&&t<SH.holds+.5; corr.g.visible=show; if(show){ const k=ssm((t-SH.corrupt)/2.4); corr.g.position.y=A_.corrBase-7*(1-k); if(corr.mixer) corr.mixer.update(dt); }
    ctx.once('cast',SH.corrupt,()=>{ const a=corr.actions&&(corr.actions.cast||corr.actions.idle); if(a){ a.reset(); a.setLoop(THREE.LoopOnce,1); a.clampWhenFinished=true; a.play(); corr.cur=a; } U.swell(.06); });
    ctx.once('swing',SH.snick-.7,()=>{ const a=corr.actions&&corr.actions.attack; if(a){ if(corr.cur) corr.cur.stop(); a.reset(); a.setLoop(THREE.LoopOnce,1); a.clampWhenFinished=true; a.play(); corr.cur=a; } }); }
  if(A_.back) A_.back.material.opacity=t>=SH.corrupt&&t<SH.holds+.5?.55*ssm((t-SH.corrupt)/1.5)*(t>=SH.snick?.6:1):0;
  // the thread: from the Heartroot to his hands, glowing; parted at the snick (two ends drawing back)
  { const H=A_.heart, D=A_.hand, from={ x:H.x, y:H.y+1.6, z:H.z }; if(t>=SH.corrupt+1.2&&t<SH.snick){ threadM.opacity=.85*ssm((t-SH.corrupt-1.2)/1); placeThread(from,D); }
    else if(t>=SH.snick&&t<SH.snick+.6){ const k=(t-SH.snick)/.6; threadM.opacity=.85*(1-k); const mid={ x:(from.x+D.x)/2, y:(from.y+D.y)/2, z:(from.z+D.z)/2 }; placeThread(from,{ x:mid.x+(from.x-mid.x)*k, y:mid.y+(from.y-mid.y)*k, z:mid.z+(from.z-mid.z)*k }); }
    else threadM.opacity=0;
    ctx.once('snick',SH.snick,()=>{ snickSnd(U); A_.shakeT=1; flashEl().style.opacity='.9'; U.boom(.6); const mid={ x:(from.x+D.x)/2, y:(from.y+D.y)/2, z:(from.z+D.z)/2 }; try{ if(window.__corruptor&&window.__corruptor.snip) window.__corruptor.snip(mid.x,mid.y,mid.z); }catch(e){} U.boom(.3); }); }
  if(A_.shakeT>0) A_.shakeT=Math.max(0,A_.shakeT-dt*1.8); if(flashT!==null){ const fo=Math.max(0,+(flashEl().style.opacity)-dt*2.2); flashEl().style.opacity=String(fo); }
  torches.forEach(T=>{ const k=t-SH.snick-.05; if(!T.smoke) return; if(k>0&&k<2){ T.smoke.material.opacity=.35*(1-k/2); T.smoke.position.y=T.y+k*1.6; T.smoke.scale.setScalar(1.4+k*1.6); } else T.smoke.material.opacity=0; });
  // light: the lantern always; the torches until the snick
  if(F){ const S0=A_.spot, lp=new THREE.Vector3(); if(lantern) lantern.getWorldPosition(lp); else lp.set(S0.x,S0.y+1.2,S0.z);
    SRC[0].x=lp.x; SRC[0].y=lp.y+.2; SRC[0].z=lp.z; SRC[0].on=t>=SH.lantern-.5; SRC[0].k=Math.min(1.6,lf); SRC[0].ph=0;
    for(let i=1;i<SRC.length-1;i++){ const T=torches[i-1]; const o=SRC[i]; if(!T){ o.on=false; continue; } o.x=T.x; o.y=T.y; o.z=T.z; o.on=!out||t<SH.snick+.3; o.k=out?Math.max(0,1-(t-SH.snick)/.35):1; o.ph=T.ph; }
    const below=t>=SH.below&&t<SH.corrupt, hs=SRC[SRC.length-1]; if(below){ hs.x=A_.heart.x+1.5; hs.y=A_.heart.y+3.5; hs.z=A_.heart.z+2; hs.on=true; hs.k=.7+.8*pulse; } F.col=below?0x6cff9a:0xff9a48;
    F.gain=t<SH.lantern?0:1; F.update(SRC,camFor(t).f,dt,t); }
  const c=camFor(t); ctx.cam(c.p,c.l,c.fov); if(c.name!==lastCut){ if(lastCut!==null&&F&&F.cut) F.cut(); lastCut=c.name; } }
function teardown(ctx){ cnt.teardowns++; if(words) words.style.opacity='0'; if(flash) flash.style.opacity='0'; A_.shakeT=0;
  if(knight){ try{ knight.m.mixer.stopAllAction(); }catch(e){} if(lantern&&lantern.parent) lantern.parent.remove(lantern); if(knight.m.wrap.parent) knight.m.wrap.parent.remove(knight.m.wrap); knight.m.wrap.rotation.y=0; }
  if(corr) try{ corr.mixer.stopAllAction(); }catch(e){}
  for(const m of OWN.splice(0)) try{ m.dispose(); }catch(e){}
  knight=null; lantern=null; corr=null; thread=null; torches=[]; }
CINE.register(ID,{ title:'THE DEEP PRISON', sub:'THE LAST LANTERN', map:'prison', pic:'cine-lantern.jpg', dur:DUR,
  when:()=>PRISON&&!TUTORIAL&&S.phase==='build'&&S.wave===0,
  ready:()=>{ if(window.__corruptor&&window.__corruptor.load&&!MOBGLB.corruptor) window.__corruptor.load(); const C2=window.__prologue&&window.__prologue.crew; return !!(C2&&C2.get())&&!!MOBGLB.corruptor; },
  setup, step, teardown });
window.__lantern={ info:()=>Object.assign({ knightLive:!!knight, lanternInHand:!!(lantern&&lantern.parent&&lantern.parent.type!=='Group'||lantern&&lantern.parent&&/Mount/.test(lantern.parent.name||'')), corrShown:!!(corr&&corr.g.visible), litTorches:torches.filter(T=>T.f1.material.opacity>.3).length, words:words?words.textContent:'', wordsOp:words?+words.style.opacity||0:0, cut:lastCut, spot:A_.spot, wall:A_.wall },cnt), cam:t=>camFor(t), SH, DUR };
})();
