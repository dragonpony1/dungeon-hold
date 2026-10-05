// ===== THE CASTLE WAKES -- the Drawbridge's opening scene (build 555). Matt: "Go" (the plan: the drawbridge creaks down, a pink flash across the sky, Avery's boa feather drifts onto the moat).
// Plays once, the first time the Drawbridge's build phase begins (after the page's sound is open: 96s-cinematics.js); the 🎬 gallery replays it. ~31 s on the wall clock:
//    0.0  THE MOAT -- out of black, low over the dark water toward the castle; the drawbridge stands raised against the gate.
//    5.0  THE CASTLE WAKES -- from the green: torches flare along the battlements one by one, outside in.
//   13.0  THE BRIDGE -- from the road at its foot: chains clank, the timbers creak, the drawbridge swings down over the moat and lands with a boom and a puff of dust.
//   21.0  AVERY -- a pink streak across the sky; a pink boa feather turns and drifts down onto the moat and settles in a ring of ripples.
//   26.0  THE FOUR -- at the bridge's foot, looking in at the open gate; THE DRAWBRIDGE.
// The map's own drawbridge (game.js MAP.castle.bridge / chains) is hidden while it plays and a copy hinged at the gate does the lowering, its own chains running to its far corners; all put back
// after. Sound: night water and wind, torch whooshes, the chains and the creak, a boom; Avery's theme (assets/music-avery.mp3) comes in with the pink flash and fades at the end (the rest is kept
// for her). The four are the prologue's (window.__prologue.crew). Test hook: window.__castlescene.
(function(){
'use strict';
window.__castlescene={ info:()=>null };
if(!window.CINE) return;
const ID='castle', DUR=31, MOAT=typeof MAP!=='undefined'&&MAP&&MAP.id==='moat'&&!!MAP.castle&&!!MAP.castle.bridge;
const SH={ moat:0, wake:5, bridge:13, avery:21, four:26 }, DOWN0=13.8, DOWN1=19.8;
const cnt={ setups:0, teardowns:0, torches:0, clanks:0, music:0, heroes:0, weapons:0, hidden:0 };
const ssm=k=>k<=0?0:k>=1?1:k*k*(3-2*k), L3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
// ---------------------------------------------------------------- Avery's theme, from the pink flash
let TUNE=null, tuneBytes=null, tuneSrc=null, tuneGain=null;
function tuneFetch(){ if(tuneFetch.on) return; tuneFetch.on=true; try{ (typeof fetchBytesNow==='function'?fetchBytesNow:fetchBytes)(ASSET('music-avery.mp3')).then(b=>{ tuneBytes=b; }).catch(()=>{}); }catch(e){} }
function tunePrep(U){ if(!TUNE&&tuneBytes&&!tuneBytes.__dec&&U&&U.a){ tuneBytes.__dec=1; U.a.decodeAudioData(tuneBytes.slice(0),b=>{ TUNE=b; },()=>{}); } }
function tunePlay(U,off){ if(tuneSrc||!TUNE||!U||!U.a) return; tuneGain=U.a.createGain(); const t=U.a.currentTime; tuneGain.gain.setValueAtTime(.0001,t); tuneGain.gain.exponentialRampToValueAtTime(.75,t+1.2); tuneGain.connect(U.sfx); tuneSrc=U.a.createBufferSource(); tuneSrc.buffer=TUNE; tuneSrc.connect(tuneGain); tuneSrc.start(0,Math.max(0,off)); cnt.music++; }
function tuneStop(fade){ if(!tuneSrc) return; try{ const g=tuneGain.gain, t=tuneGain.context.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value,t); g.linearRampToValueAtTime(0,t+fade); tuneSrc.stop(t+fade+.05); }catch(e){} tuneSrc=null; }
// ---------------------------------------------------------------- sounds of the castle
function noiseBuf(a,len){ const b=a.createBuffer(1,(a.sampleRate*len)|0,a.sampleRate), c=b.getChannelData(0); for(let i=0;i<c.length;i++) c[i]=Math.random()*2-1; return b; }
function whoosh(U,pan){ if(!U||!U.a) return; const a=U.a, t=a.currentTime, n=a.createBufferSource(); n.buffer=noiseBuf(a,.7); const bp=a.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=.9; bp.frequency.setValueAtTime(250,t); bp.frequency.exponentialRampToValueAtTime(1500,t+.25); bp.frequency.exponentialRampToValueAtTime(600,t+.7);
  const g=a.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.12,t+.08); g.gain.exponentialRampToValueAtTime(.0001,t+.7); let o=g; if(a.createStereoPanner){ const p=a.createStereoPanner(); p.pan.value=pan||0; g.connect(p); o=p; } n.connect(bp).connect(g); o.connect(U.sfx); n.start(t); cnt.torches++; }
function clank(U,vol){ if(!U||!U.a) return; const a=U.a, t=a.currentTime; for(const [f,v] of [[620,1],[1340,.6],[2110,.35]]){ const o=a.createOscillator(), g=a.createGain(); o.type='square'; o.frequency.value=f*(.97+Math.random()*.06); g.gain.setValueAtTime(vol*v*.25,t); g.gain.exponentialRampToValueAtTime(.0001,t+.18); const lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3000; o.connect(lp).connect(g).connect(U.sfx); o.start(t); o.stop(t+.2); } cnt.clanks++; }
function creak(U){ if(!U||!U.a) return; const a=U.a, t=a.currentTime, o=a.createOscillator(), g=a.createGain(), lp=a.createBiquadFilter(); o.type='sawtooth'; o.frequency.setValueAtTime(70,t); o.frequency.linearRampToValueAtTime(52,t+5.5); const lfo=a.createOscillator(), lg=a.createGain(); lfo.frequency.value=13; lg.gain.value=9; lfo.connect(lg).connect(o.frequency);
  lp.type='bandpass'; lp.frequency.value=420; lp.Q.value=3; g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.09,t+.6); g.gain.setValueAtTime(.09,t+5); g.gain.exponentialRampToValueAtTime(.0001,t+6); o.connect(lp).connect(g).connect(U.sfx); o.start(t); lfo.start(t); o.stop(t+6.1); lfo.stop(t+6.1); }
function lap(U){ if(!U||!U.a) return; const a=U.a, t=a.currentTime, n=a.createBufferSource(); n.buffer=noiseBuf(a,.6); const lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=500+Math.random()*400; const g=a.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.03,t+.15); g.gain.exponentialRampToValueAtTime(.0001,t+.6); n.connect(lp).connect(g).connect(U.sfx); n.start(t); }
// ---------------------------------------------------------------- the feather (a pink boa plume drawn once)
let FT=null; function featherTex(){ if(FT) return FT; const c=document.createElement('canvas'); c.width=64; c.height=256; const g=c.getContext('2d');
  for(let i=0;i<140;i++){ const y=20+i*1.6, half=Math.sin(Math.min(1,(y-14)/220)*PI)*26+4; for(const s of [-1,1]){ g.strokeStyle='rgba(255,'+(90+Math.random()*80|0)+','+(190+Math.random()*50|0)+','+(.55+Math.random()*.4)+')'; g.lineWidth=1.2; g.beginPath(); g.moveTo(32,y); g.quadraticCurveTo(32+s*half*.6,y-6,32+s*(half+Math.random()*6),y-12-Math.random()*8); g.stroke(); } }
  g.strokeStyle='rgba(255,240,250,.95)'; g.lineWidth=2; g.beginPath(); g.moveTo(32,8); g.lineTo(32,250); g.stroke(); FT=new THREE.CanvasTexture(c); FT.encoding=THREE.sRGBEncoding; return FT; }
// ---------------------------------------------------------------- the scene
const OWN=[]; let heroes=[], deck=null, myChains=[], hiddenObjs=[], torches=[], feather=null, ripple=null, pinkG=null, dust=null, A_={}, lastCut=null, lapT=0, clankT=0;
const SRC=[0,1,2,3,4,5,6,7,8].map(()=>({ x:0, y:-80, z:0, on:false, ph:0, k:1 }));
// the castle wall's face, measured (looking north at height y from out on the green): the first solid surface
function faceZ(x,y,from,fallback){ try{ const rc=new THREE.Raycaster(new THREE.Vector3(x,y,from),new THREE.Vector3(0,0,-1),0,60); rc.camera=camera; world.updateMatrixWorld(true);
    const hit=rc.intersectObject(world,true).find(h=>h.object.isMesh&&!h.object.userData.isOL&&h.object.visible&&!(h.object.material&&(h.object.material.transparent||h.object.material.blending===THREE.AdditiveBlending)));
    return hit?hit.point.z:fallback; }catch(e){ return fallback; } }
function own(m){ m.userData.cineOwn=true; m.userData.noOL=true; return m; }
function setup(ctx){ if(!MOAT) return false; const CS=MAP.castle, C2=window.__prologue&&window.__prologue.crew; cnt.setups++; tuneSrc=null; heroes=[]; myChains=[]; hiddenObjs=[]; torches=[]; lapT=.3; clankT=0;
  const [x0,x1,z0,z1]=CS.bridge, X=(cw(x0)+cw(x1))/2, Z=(cwz(z0)+cwz(z1))/2, w=(x1-x0+1)*CELL+.4, d=(z1-z0+1)*CELL+.6; A_.bridge={ X, Z, w, d, hingeZ:Z-d/2 };
  // hide the map's own deck and chains (found where game.js put them)
  const near=(o,x,y,z)=>Math.abs(o.position.x-x)<.05&&Math.abs(o.position.y-y)<.05&&Math.abs(o.position.z-z)<.05;
  for(const o of world.children){ if(o.isGroup&&near(o,X,0,Z)&&o.visible){ o.visible=false; hiddenObjs.push(o); } }
  for(const [ax,ay,az,bx,by,bz] of (CS.chains||[])){ const mx=(cw(ax)+cw(bx))/2, my=(ay+by)/2, mz=(cwz(az)+cwz(bz))/2; for(const o of world.children){ if(o.isMesh&&near(o,mx,my,mz)&&o.visible){ o.visible=false; hiddenObjs.push(o); } } }
  cnt.hidden=hiddenObjs.length;
  // the copy that lowers: hinged at the gate (its north edge), the deck reaching south over the moat
  { const wood=new THREE.MeshToonMaterial({ color:C(0x6b4a2a) }), plank=new THREE.MeshToonMaterial({ color:C(0x8a5e34) }), dark=new THREE.MeshBasicMaterial({ color:C(0x2b2540) }), gold=new THREE.MeshToonMaterial({ color:C(0xe0b040) }); OWN.push(wood,plank,dark,gold);
    deck=new THREE.Group(); deck.position.set(X,.0,A_.bridge.hingeZ); const body=new THREE.Group(); body.position.z=d/2; deck.add(body); ctx.group.add(deck);
    const add=(geo,m,x,y,z)=>{ const o=own(new THREE.Mesh(geo,m)); o.position.set(x,y,z); body.add(o); return o; };
    add(new THREE.BoxGeometry(w,.22,d),wood,0,.11,0); for(let k=-d/2+.35;k<d/2;k+=.7) add(new THREE.BoxGeometry(w,.02,.05),dark,0,.23,k);
    for(const sx of [-1,1]){ add(new THREE.BoxGeometry(.2,.3,d),plank,sx*(w/2-.1),.37,0); for(let k=-d/2+.5;k<d/2;k+=2) add(new THREE.BoxGeometry(.18,1.1,.18),wood,sx*(w/2-.1),.9,k); add(new THREE.BoxGeometry(.12,.1,d),gold,sx*(w/2-.1),1.45,0); }
    deck.rotation.x=-PI/2;   // raised: standing up against the gate
    const iron=new THREE.MeshToonMaterial({ color:C(0x3a3348) }); OWN.push(iron); for(const [ax,ay,az] of (CS.chains||[])){ const ch=own(new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,1,6),iron)); ctx.group.add(ch); myChains.push({ ch, A:new THREE.Vector3(cw(ax),ay,cwz(az)) }); } }
  // torches along the battlements (the ward wall over the gate, 8 up)
  { const wz=A_.bridge.hingeZ+.35-1.1, xs=[3,7,11,15,19,29,33,37,41,45]; xs.forEach((cx,i)=>{ const x=cw(cx), y=6.4, fz=faceZ(x,y,A_.bridge.hingeZ+A_.bridge.d+12,A_.bridge.hingeZ)+.3;   /* on the wall's face under the battlements, where the shot from the green sees them */ const f1=glow(0xff7a1a,1.6,0), f2=glow(0xffd060,.8,0); f1.material.fog=false; f2.material.fog=false; f1.position.set(x,y,fz); f2.position.set(x,y-.15,fz+.05); ctx.group.add(f1); ctx.group.add(f2); OWN.push(f1.material,f2.material);
      const order=Math.abs(cx-24); torches.push({ f1, f2, at:SH.wake+.6+(1-order/21)*0+(order<=6?5.6:order<=14?2.6:.2)+(i%2)*.35, src:SRC[i%9], x, y, z:fz, pan:(cx-24)/24 }); }); }
  // until the deck lands there is no way across: the bridge's stone floor (the map's own tiles under the deck) covered with the moat's own water
  { let wm=null; for(const o of world.children){ if(o.isMesh&&Math.abs(o.position.y-WATER_Y)<.01&&o.material&&o.material.map){ wm=o.material; break; } }
    if(wm){ const pl=own(new THREE.Mesh(new THREE.PlaneGeometry(A_.bridge.w+.2,A_.bridge.d-.2),wm)); pl.rotation.x=-PI/2; pl.position.set(X,.05,Z); ctx.group.add(pl); A_.patch=pl; } }
  // dust where the deck lands, the pink streak, the feather and its ripple
  { const dm=new THREE.PointsMaterial({ color:C(0xb8a888), size:1.2, map:GLOWT, transparent:true, depthWrite:false, opacity:0 }); OWN.push(dm); const N=50, pos=new Float32Array(N*3), vel=new Float32Array(N*3);
    for(let i=0;i<N;i++){ pos[i*3]=X+(Math.random()-.5)*A_.bridge.w; pos[i*3+1]=.3; pos[i*3+2]=A_.bridge.hingeZ+d-.3+(Math.random()-.5); vel[i*3]=(Math.random()-.5)*2; vel[i*3+1]=.6+Math.random()*1.4; vel[i*3+2]=Math.random()*1.5; }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); dust=new THREE.Points(geo,dm); dust.userData.cineOwn=true; dust.userData.vel=vel; dust.userData.base=pos.slice(); ctx.group.add(dust); }
  pinkG=glow(0xff4fd0,26,0); pinkG.material.fog=false; ctx.group.add(pinkG); OWN.push(pinkG.material);
  { const fm=new THREE.MeshBasicMaterial({ map:featherTex(), transparent:true, side:THREE.DoubleSide, depthWrite:false }); OWN.push(fm); feather=own(new THREE.Mesh(new THREE.PlaneGeometry(.7,2.6),fm)); feather.visible=false; ctx.group.add(feather);
    const rm=new THREE.MeshBasicMaterial({ color:C(0xffc8ec), transparent:true, opacity:0, depthWrite:false }); OWN.push(rm); ripple=own(new THREE.Mesh(new THREE.RingGeometry(.85,1,40),rm)); ripple.rotation.x=-PI/2; ctx.group.add(ripple); }
  A_.feather={ x:X-w/2-3.2, z:Z+1.5, y:WATER_Y+.05 };   /* on the moat, just west of the bridge */
  // the four at the bridge's foot, facing the gate
  const P=window.__party&&window.__party.model; const fx=X, fz=A_.bridge.hingeZ+d+2.2; A_.four={ x:fx, z:fz, y:baseFloor(fx,fz) }; const off=[[-1.5,0],[1.5,0],[-.5,1.5],[1.2,1.6]];
  if(C2) C2.CREW.forEach((h,i)=>{ const m=C2.MODEL[h.id]; if(!m) return; const x=fx+off[i][0], z=fz+off[i][1]; m.wrap.position.set(x,baseFloor(x,z),z); m.wrap.rotation.y=PI; m.wrap.visible=false; ctx.group.add(m.wrap);
    if(P&&m.actions.idle){ P.play(m,'idle',{fade:0,restart:true}); m.actions.idle.time=i*.6; } const mt=P&&P.mount(m.root); if(mt&&window.__weapons&&window.__weapons.attach) window.__weapons.attach(mt,h.w,5,null,obj=>{ m.wobj=obj; try{ m.wglow=window.__heldglow&&window.__heldglow.dress?window.__heldglow.dress(obj):null; }catch(e){} cnt.weapons++; });
    heroes.push({ h, m }); });
  cnt.heroes=heroes.length;
  // no darkening here: an outdoor map keeps its own night light (darkening blacked it out and hid the moat's water); the torches flare on top of it
  return true; }
function camFor(t){ const B=A_.bridge, gx=B.X, gz=B.hingeZ, Fe=A_.feather, F=A_.four;
  if(t<SH.wake){ const k=ssm(t/SH.wake); return { p:[cw(8)+9*k,2.3+.3*k,B.Z], l:[gx-2,3.2,B.Z-2], fov:52, name:'moat', f:{ x:gx, y:6, z:gz } }; }   /* along the moat, the water ahead, toward the raised bridge */
  if(t<SH.bridge){ const k=ssm((t-SH.wake)/(SH.bridge-SH.wake)); return { p:[gx+3-6*k,5.5+1.5*k,cwz(40)-3*k], l:[gx,8,gz-2], fov:58, name:'wake', f:{ x:gx, y:9, z:gz } }; }
  if(t<SH.avery){ const k=ssm((t-SH.bridge)/(SH.avery-SH.bridge)); return { p:[gx-B.w/2-4.5+1.5*k,3.4+.4*k,gz+B.d+5-1*k], l:[gx,3.4-1.6*ssm((t-DOWN0)/(DOWN1-DOWN0)),gz+B.d*.45], fov:56, name:'bridge', f:{ x:gx, y:3, z:gz+B.d*.5 } }; }
  if(t<SH.four){ const ft=Math.min(1,(t-SH.avery-1.1)/3.8); if(t<SH.avery+1.1) return { p:[Fe.x+4,Fe.y+2.2,Fe.z+7], l:[Fe.x-6,Fe.y+16,Fe.z-14], fov:62, name:'sky', f:{ x:gx, y:6, z:gz } };
    const fy=Fe.y+7.5*(1-ssm(ft)); return { p:[Fe.x+2.6,Math.max(Fe.y+.9,fy+.6),Fe.z+2.6], l:[Fe.x,fy,Fe.z], fov:46, name:'feather', f:{ x:Fe.x, y:2, z:Fe.z } }; }
  const k=ssm((t-SH.four)/(DUR-SH.four)); return { p:[F.x+1.2,F.y+2+2.4*k,F.z+5.5+2.5*k], l:L3([F.x,F.y+1.5,F.z-2],[gx,5,gz-6],k*.85), fov:56, name:'four', f:{ x:F.x, y:3, z:F.z-4 } }; }
function step(ctx,t,dt){ const U=ctx.audio, Fi=ctx.fire, B=A_.bridge;
  ctx.black(t<1.5?1-ssm(t/1.5):0); ctx.title(ssm((t-(SH.four+2.1))/1.3));
  // torches
  torches.forEach((T,i)=>{ const k=ssm((t-T.at)/.35), fl=1+.12*Math.sin(t*11+i)+.08*Math.sin(t*23+i*2); T.f1.material.opacity=.95*k; T.f2.material.opacity=.95*k; T.f1.scale.set(2.8*fl,3.6*fl,1); T.f2.scale.set(1.4,1.9*fl,1); if(t>=T.at&&!T.lit){ T.lit=true; whoosh(U,T.pan); } });
  if(A_.patch) A_.patch.visible=t<DOWN1-.05;
  // the bridge comes down
  const dk=t<DOWN0?0:t>=DOWN1?1:(()=>{ const u=(t-DOWN0)/(DOWN1-DOWN0); return u<.85?ssm(u/.85)*1.0:1; })(); deck.rotation.x=-PI/2*(1-dk); if(t>=DOWN1&&t<DOWN1+.35) deck.rotation.x=.012*Math.sin((t-DOWN1)*40)*Math.exp(-(t-DOWN1)*8);
  deck.updateMatrixWorld(true); for(const [i,C_] of myChains.entries()){ const corner=new THREE.Vector3((i?1:-1)*(B.w/2-.2),.4,B.d).applyMatrix4(deck.matrixWorld); const A=C_.A, L=A.distanceTo(corner); C_.ch.position.copy(A).lerp(corner,.5); C_.ch.scale.set(1,L,1); C_.ch.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),corner.clone().sub(A).normalize()); }
  if(t>=DOWN0&&t<DOWN1){ clankT-=dt; if(clankT<=0){ clankT=.22+Math.random()*.12; clank(U,.6); } } ctx.once('creak',DOWN0,()=>{ creak(U); }); ctx.once('land',DOWN1,()=>{ U.boom(.5); });
  if(dust){ const k=t-DOWN1, p=dust.geometry.attributes.position.array, b=dust.userData.base, v=dust.userData.vel; if(k>0&&k<3){ for(let i=0;i<p.length;i++) p[i]=b[i]+v[i]*k*(i%3===1?1:1.2); dust.geometry.attributes.position.needsUpdate=true; dust.material.opacity=.5*(1-k/3); } else dust.material.opacity=0; }
  // Avery: the pink streak, then her feather
  { const k=(t-SH.avery-.1)/1; if(k>0&&k<1.4){ const Fe=A_.feather; pinkG.position.set(Fe.x-30+70*k,Fe.y+26+6*k,Fe.z-26); pinkG.material.opacity=.85*Math.sin(Math.min(1,k)*PI); } else pinkG.material.opacity=0; }
  ctx.once('swish',SH.avery+.1,()=>{ U.swell(.07); });
  { const Fe=A_.feather, ft=(t-SH.avery-1.1)/3.8; feather.visible=t>=SH.avery+1.1&&t<SH.four+1.5; if(feather.visible){ const fall=ssm(Math.min(1,ft)), y=Fe.y+7.5*(1-fall); feather.position.set(Fe.x+Math.sin(t*1.6)*.9*(1-fall),y+.02,Fe.z+Math.cos(t*1.2)*.6*(1-fall));
      if(ft<1){ feather.rotation.set(Math.sin(t*2.3)*.5,t*1.8,PI/2+Math.sin(t*1.7)*.6); } else feather.rotation.set(-PI/2,feather.rotation.y,0); }
    const rk=t-(SH.avery+4.9); if(rk>0&&rk<2.5){ ripple.position.set(Fe.x,Fe.y+.03,Fe.z); ripple.scale.setScalar(.3+2.2*ssm(rk/2.5)); ripple.material.opacity=.6*(1-rk/2.5); } else ripple.material.opacity=0; }
  // the four
  const showFour=t>=SH.four; for(const H of heroes){ H.m.wrap.visible=showFour; if(showFour&&H.m.mixer) H.m.mixer.update(dt); }
  // light: the lit torches, near the shot
  if(Fi){ torches.forEach((T,i)=>{ const o=SRC[i%9]; if(i<9){ o.x=T.x; o.y=T.y; o.z=T.z; o.on=t>=T.at; o.ph=i; o.k=1; } }); const c0=camFor(t).f; Fi.update(SRC,c0,dt,t); }
  const c=camFor(t); ctx.cam(c.p,c.l,c.fov); if(c.name!==lastCut){ if(lastCut!==null&&Fi&&Fi.cut) Fi.cut(); lastCut=c.name; }
  // night water, the music from the flash
  lapT-=dt; if(t<SH.bridge&&lapT<=0){ lapT=.5+Math.random()*.9; lap(U); }
  ctx.once('drone',0,()=>{ U.droneOn(.03,3); },99);
  tunePrep(U); if(!tuneSrc&&TUNE&&t>=SH.avery&&t<DUR-2) tunePlay(U,t-SH.avery); if(t>DUR-3.2) tuneStop(3); }
function teardown(ctx){ cnt.teardowns++; tuneStop(.6); for(const o of hiddenObjs) o.visible=true; hiddenObjs=[];
  for(const H of heroes){ try{ H.m.mixer.stopAllAction(); }catch(e){} if(H.m.wobj&&H.m.wobj.parent) H.m.wobj.parent.remove(H.m.wobj); if(H.m.wrap.parent) H.m.wrap.parent.remove(H.m.wrap); H.m.wrap.rotation.y=0; }
  for(const m of OWN.splice(0)) try{ m.dispose(); }catch(e){}
  heroes=[]; deck=null; myChains=[]; torches=[]; feather=null; ripple=null; pinkG=null; dust=null; }
try{ if(MOAT&&!SILENT&&!(window.CINE.seen&&window.CINE.seen(ID))) tuneFetch(); }catch(e){}
CINE.register(ID,{ title:'THE DRAWBRIDGE', sub:'THE CASTLE WAKES', map:'moat', pic:'cine-castle.jpg', dur:DUR,
  when:()=>MOAT&&!TUTORIAL&&S.phase==='build'&&S.wave===0,
  ready:()=>{ tuneFetch(); const C2=window.__prologue&&window.__prologue.crew; return !!(C2&&C2.get()); },
  setup, step, teardown });
window.__castlescene={ info:()=>Object.assign({ tuneBytes:!!tuneBytes, tuneReady:!!TUNE, heroesLive:heroes.length, deckAngle:deck?+deck.rotation.x.toFixed(2):null, lit:torches.filter(T=>T.lit).length, featherY:feather&&feather.visible?+feather.position.y.toFixed(2):null, cut:lastCut, realBridgeHidden:hiddenObjs.length },cnt), cam:t=>camFor(t), SH, DUR };
})();
