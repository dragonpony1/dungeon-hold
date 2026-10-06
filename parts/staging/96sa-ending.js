// ===== THE GATE HOLDS -- the ending (build 560). Matt: "ok do the gates hold". The last scene of the series (memory rootgate-cinematics.md): the Heartroot blazes, roots seal the gate,
// the gnomes raise their mugs in the tavern. Plays once, the moment the Deep Prison is held (its victory lap begins: game.js winMap, S.held) in the campaign; the 🎬 gallery replays it. ~36 s:
//    0.0  out of black, THE HEARTROOT -- close on the crystal; its light swells green and gold and floods the pit, motes pouring up.
//    9.0  THE ROOTS -- glowing roots snake out from it across the floor; then at the cells' gate the horde came through, roots weave across the doorway, one after another, until it is sealed.
//   18.0  THE TAVERN -- the four round the table, mugs on it, warm firelight; they raise them together (shot wide).
//   29.0  ROOTGATE / THE GATE HOLDS, the camera drawing back; to black.
// The prison has no tavern room, so the tavern is the set built for the scene (the same one build 549 built for the Throne Room: buildSet, out past the map). Music: the closing stretch of
// "Called to Battle" (ZapSplat, the trailer's closer; assets/music-ending.mp3), from the first frame to its own end. The four are the prologue's (window.__prologue.crew).
// Test hook: window.__ending.
(function(){
'use strict';
window.__ending={ info:()=>null };
if(!window.CINE) return;
const ID='ending', DUR=36, PRISON=typeof MAP!=='undefined'&&MAP&&MAP.id==='prison';
const SH={ blaze:0, roots:9, gate:13.5, tavern:18, toast:22.5, title:29 };
const cnt={ setups:0, teardowns:0, roots:0, gateRoots:0, heroes:0, mugs:0, music:0 };
const ssm=k=>k<=0?0:k>=1?1:k*k*(3-2*k), L3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
let prng=1; const rand=()=>{ prng=(prng*16807)%2147483647; return (prng-1)/2147483646; };
const OWN=[]; function own(m){ m.userData.cineOwn=true; m.userData.noOL=true; return m; }
const SX=400, SZ=0;   // the tavern set: far out past the prison
function canvasTex(w,h,draw){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; return t; }
let setFlames=null, setNpc=null;
function buildSet(group){ const g=new THREE.Group(); g.position.set(SX,0,SZ); group.add(g); const mk=(geo,m,x,y,z)=>{ const o=own(new THREE.Mesh(geo,m)); o.position.set(x,y,z); g.add(o); return o; };
  const tm=(col,map,em)=>{ const m=new THREE.MeshToonMaterial({ color:C(col), map:map||null }); m.emissive=map?C(0x2a1c30):C(col); m.emissiveIntensity=em===undefined?.06:em; OWN.push(m); return m; };   /* a faint floor of colour so nothing goes pitch black; the firelight does the rest */
  const brick=canvasTex(256,256,(x,w,h)=>{ x.fillStyle='#4f4258'; x.fillRect(0,0,w,h); x.strokeStyle='#1c1522'; x.lineWidth=6; for(let r=0;r<8;r++){ const y=r*32; x.beginPath(); x.moveTo(0,y); x.lineTo(w,y); x.stroke(); for(let c=0;c<5;c++){ const bx=c*64+(r%2?32:0); x.beginPath(); x.moveTo(bx,y); x.lineTo(bx,y+32); x.stroke(); } } for(let i=0;i<400;i++){ x.fillStyle='rgba(0,0,0,'+(Math.random()*.12)+')'; x.fillRect(Math.random()*w,Math.random()*h,6,4); } });
  const tiles=canvasTex(128,128,(x,w,h)=>{ x.fillStyle='#352c40'; x.fillRect(0,0,w,h); x.fillStyle='#2a2233'; x.fillRect(0,0,64,64); x.fillRect(64,64,64,64); x.strokeStyle='#17121e'; x.lineWidth=5; x.strokeRect(0,0,64,64); x.strokeRect(64,0,64,64); x.strokeRect(0,64,64,64); x.strokeRect(64,64,64,64); });
  OWN.push(brick,tiles);
  const texM=(tex,ru,rv,em)=>{ const t=tex.clone(); t.repeat.set(ru,rv); t.needsUpdate=true; OWN.push(t); return tm(0xffffff,t,em); };
  const wood=tm(0x6b4a2a), plank=tm(0x8a5e34), dark=tm(0x2b2540), stone=tm(0x4a4262), cream=tm(0xf1e6d0), gold=tm(0xe0b040);
  const fl=mk(new THREE.PlaneGeometry(16,12),texM(tiles,4,3,.5),0,0,0); fl.rotation.x=-PI/2;
  const hf=mk(new THREE.PlaneGeometry(12,34),texM(tiles,3,8.5,.2),0,0,-25); hf.rotation.x=-PI/2;
  const wall=(w,h,d,x,y,z,ru,rv)=>mk(new THREE.BoxGeometry(w,h,d),texM(brick,ru,rv,.5),x,y,z);
  wall(16,6,.6,0,3,6.3,4,1.5); wall(.6,6,12,8.3,3,0,3,1.5); wall(.6,6,12,-8.3,3,0,3,1.5);   // south, east, west
  wall(6.6,6,2,-4.7,3,-7,1.7,1.5); wall(6.6,6,2,4.7,3,-7,1.7,1.5); wall(2.8,1.6,2,0,5.2,-7,.7,.4);   // the north wall either side of the door, its lintel
  wall(.6,5,34,-6,2.5,-25,8.5,1.2); wall(.6,5,34,6,2.5,-25,8.5,1.2);   // the dark hall's sides, past the door
  // the bar along the east wall: counter, mugs, a shelf of bottles behind
  { const bx=6.6; mk(new THREE.BoxGeometry(1,1.05,5.6),wood,bx-1.2,.52,0); mk(new THREE.BoxGeometry(1.2,.12,5.8),plank,bx-1.2,1.1,0); for(const mz of [-2,-.6,1.1,2.2]) mk(new THREE.CylinderGeometry(.13,.11,.26,8),cream,bx-1.3,1.29,mz);
    mk(new THREE.BoxGeometry(.3,.08,5.4),plank,bx+.9,2.3,0); mk(new THREE.BoxGeometry(.3,.08,5.4),plank,bx+.9,3.1,0); const cols=[0x6a9a3a,0xc8262b,0x2fb8e8,0xe0b040,0x9a5ab8,0xf1e6d0]; for(let k=0;k<11;k++) mk(new THREE.CylinderGeometry(.09,.11,.42,7),tm(cols[k%cols.length]),bx+.9,(k%2?2.55:3.35),-2.4+k*.48); }
  // the hearth on the south wall, logs and a fire
  { mk(new THREE.BoxGeometry(3,2.6,.9),stone,0,1.3,5.6); mk(new THREE.BoxGeometry(3.3,.25,1.1),tm(0x5a5276),0,2.7,5.6); mk(new THREE.BoxGeometry(1.6,1.4,.6),tm(0x1a1420,null,0),0,.75,5.3); for(const x of [-.5,.4]){ const lg=mk(new THREE.CylinderGeometry(.09,.09,.8,6),wood,x,.2,5.25); lg.rotation.z=PI/2; }
    const f1=glow(0xff6a14,1.5,.95), f2=glow(0xffd060,.8,.95); f1.position.set(0,.62,4.86); f2.position.set(0,.46,4.8); g.add(f1); g.add(f2); OWN.push(f1.material,f2.material); setFlames=[f1,f2]; }   /* glowing flames, not cones */
  // the round table and four stools
  { mk(new THREE.CylinderGeometry(.9,.9,.1,14),plank,-1,.9,0); mk(new THREE.CylinderGeometry(.12,.16,.9,7),wood,-1,.45,0); for(const [x,z] of [[1.2,0],[-1.2,0],[0,1.2],[0,-1.2]]){ mk(new THREE.CylinderGeometry(.3,.3,.08,9),plank,-1+x,.5,z); mk(new THREE.CylinderGeometry(.06,.08,.5,6),wood,-1+x,.25,z); } }
  // the locker on the west wall, a rug by the door, two barrels
  { mk(new THREE.BoxGeometry(.7,2.3,1.4),dark,-7.6,1.15,-3); mk(new THREE.BoxGeometry(.74,.08,1.44),gold,-7.6,2.3,-3); mk(new THREE.BoxGeometry(2.2,.03,3.2),tm(0x8a2030),0,.02,-3.6); for(const [x,z] of [[-7.2,4.8],[-6.2,5.2]]) mk(new THREE.CylinderGeometry(.42,.42,1.1,10),wood,x,.55,z); }
  // the barkeep behind the bar
  try{ const n=makeHero(); n.g.position.set(SX+7.5,0,SZ+.6); n.g.rotation.y=-PI/2; n.g.scale.setScalar(.95); group.add(n.g); setNpc=n.g; }catch(e){}
  return g; }
// ---------------------------------------------------------------- the song: to its own end
let TUNE=null, tuneBytes=null, tuneSrc=null;
function tuneFetch(){ if(tuneFetch.on) return; tuneFetch.on=true; try{ (typeof fetchBytesNow==='function'?fetchBytesNow:fetchBytes)(ASSET('music-ending.mp3')).then(b=>{ tuneBytes=b; }).catch(()=>{}); }catch(e){} }
function tunePrep(U){ if(!TUNE&&tuneBytes&&!tuneBytes.__dec&&U&&U.a){ tuneBytes.__dec=1; U.a.decodeAudioData(tuneBytes.slice(0),b=>{ TUNE=b; },()=>{}); } }
function tunePlay(U,off){ if(tuneSrc||!TUNE||!U||!U.a) return; const g=U.a.createGain(); g.gain.value=.8; g.connect(SFXOUT(U.a)); tuneSrc=U.a.createBufferSource(); tuneSrc.buffer=TUNE; tuneSrc.connect(g); tuneSrc.__g=g; tuneSrc.start(0,Math.max(0,off)); cnt.music++; }
function tuneStop(fade){ if(!tuneSrc) return; try{ const g=tuneSrc.__g.gain, t=tuneSrc.context.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value,t); g.linearRampToValueAtTime(0,t+fade); tuneSrc.stop(t+fade+.05); }catch(e){} tuneSrc=null; }
function clink(U){ if(!U||!U.a) return; const a=U.a, t=a.currentTime; for(let i=0;i<4;i++) for(const [f,v] of [[1900+i*140,.05],[3100+i*90,.03]]){ const o=a.createOscillator(), g=a.createGain(), t0=t+i*.035; o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(v,t0); g.gain.exponentialRampToValueAtTime(.0001,t0+.9); o.connect(g).connect(U.sfx); o.start(t0); o.stop(t0+1); } }
// ---------------------------------------------------------------- roots: tubes that grow along their own length (their draw range opens)
function growRoot(group,pts,rad,mat){ const cur=new THREE.CatmullRomCurve3(pts), geo=new THREE.TubeGeometry(cur,64,rad,6,false); geo.setDrawRange(0,0); const m=own(new THREE.Mesh(geo,mat)); group.add(m); return { m, geo, n:geo.index?geo.index.count:geo.attributes.position.count }; }
function setGrow(r,k){ const c=Math.floor(r.n*Math.max(0,Math.min(1,k))/18)*18; r.geo.setDrawRange(0,c); }
// ---------------------------------------------------------------- the scene
let hidRaven=[], heroes=[], roots=[], gateRoots=[], heartG=null, motes=null, moteMat=null, mugs=[], A_={}, lastCut=null;
const SRC=[0,1,2,3,4,5,6,7].map(()=>({ x:0, y:-80, z:0, on:false, ph:0, k:1 }));
const _v1=new THREE.Vector3(), _v2=new THREE.Vector3(), _v3=new THREE.Vector3(), _q1=new THREE.Quaternion(), _q2=new THREE.Quaternion(), _q3=new THREE.Quaternion();
function aim(ch,target){ if(!ch) return; ch.upper.getWorldPosition(_v1); ch.hand.getWorldPosition(_v2); _v2.sub(_v1).normalize(); _v3.copy(target).sub(_v1).normalize(); _q1.setFromUnitVectors(_v2,_v3);
  ch.upper.getWorldQuaternion(_q2); _q2.premultiply(_q1); ch.upper.parent.getWorldQuaternion(_q3); ch.upper.quaternion.copy(_q3.invert().multiply(_q2)); ch.upper.updateMatrixWorld(true); }
const chainOf=n=>{ const hand=n&&n.parent, fore=hand&&hand.parent, upper=fore&&fore.parent; return upper&&upper.parent?{ hand, upper }:null; };
function makeMug(){ const g=new THREE.Group(), wood=new THREE.MeshToonMaterial({ color:C(0x7a4a26) }), brass=new THREE.MeshToonMaterial({ color:C(0xd8a84a) }), foam=new THREE.MeshToonMaterial({ color:C(0xfff6e2) }); OWN.push(wood,brass,foam);
  const add=(geo,m,y)=>{ const o=own(new THREE.Mesh(geo,m)); o.position.y=y; g.add(o); return o; }; add(new THREE.CylinderGeometry(.15,.135,.3,14),wood,.15); for(const y of [.05,.25]){ const b=add(new THREE.TorusGeometry(.148,.012,5,18),brass,y); b.rotation.x=PI/2; }
  for(let i=0;i<6;i++){ const f=own(new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),foam)); const a=i/6*TAU; f.position.set(Math.cos(a)*.07,.31,Math.sin(a)*.07); f.scale.y=.55; g.add(f); } g.scale.setScalar(1.35); return g; }
function setup(ctx){ if(!PRISON) return false; const C2=window.__prologue&&window.__prologue.crew; cnt.setups++; prng=7717; heroes=[]; roots=[]; gateRoots=[]; mugs=[]; tuneSrc=null;
  const gy=hgt[GOAL]||0; A_.heart={ x:0, y:gy, z:0 };
  const rootM=new THREE.MeshToonMaterial({ color:C(0x5a3a22) }); rootM.emissive=C(0x2a1a0e); const veinM=new THREE.MeshBasicMaterial({ color:C(0x9fff6a), transparent:true, opacity:.9, blending:THREE.AdditiveBlending, depthWrite:false }); OWN.push(rootM,veinM);
  // the Heartroot's blaze and the motes pouring up
  heartG=glow(0xb8ff7a,6,0); heartG.material.fog=false; heartG.position.set(0,gy+2,0); ctx.group.add(heartG); OWN.push(heartG.material);
  { const N=260, pos=new Float32Array(N*3), sp=new Float32Array(N); for(let i=0;i<N;i++){ const a=rand()*TAU, r=rand()*4; pos[i*3]=Math.cos(a)*r; pos[i*3+1]=gy+rand()*14; pos[i*3+2]=Math.sin(a)*r; sp[i]=1+rand()*2.5; }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); moteMat=new THREE.PointsMaterial({ color:C(0xd8ff8a), size:.22, map:GLOWT, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:0 }); OWN.push(moteMat);
    motes=new THREE.Points(geo,moteMat); motes.userData.cineOwn=true; motes.userData.sp=sp; ctx.group.add(motes); }
  // roots out across the pit floor from the Heartroot
  for(let i=0;i<12;i++){ const a=i/12*TAU+rand()*.3, L=9+rand()*9, pts=[]; for(let k=0;k<=6;k++){ const r=1.4+L*k/6, aa=a+Math.sin(k*1.3+i)*.18; const x=Math.cos(aa)*r, z=Math.sin(aa)*r; pts.push(new THREE.Vector3(x,baseFloor(x,z)+.18+(k===0?.6:0),z)); }
    const R1=growRoot(ctx.group,pts,.16+rand()*.12,rootM), R2=growRoot(ctx.group,pts.map(p=>p.clone().add(new THREE.Vector3(0,.16,0))),.04,veinM); roots.push({ R1, R2, at:SH.roots+.3+i*.12 }); }
  cnt.roots=roots.length;
  // the gate the horde came through: the east cells' doorway (the torch line's own road starts there)
  { const L=(typeof LANES!=='undefined'&&(LANES.E||LANES[Object.keys(LANES)[0]]))||null; const gx=L?cw(L.cx):20, gz=L?cwz(L.cz):20, fa=L?(L.face||0):0, fy=L?(hgt[idx(L.cx,L.cz)]||0):gy; A_.gate={ x:gx, z:gz, y:fy, fx:Math.sin(fa), fz:Math.cos(fa) };
    const sx=-A_.gate.fz, sz=A_.gate.fx;   // across the doorway
    for(let i=0;i<9;i++){ const s0=(i%2?1:-1)*(.85+rand()*.45), s1=-s0, h0=rand()*.6, h1=2.6+rand()*2.8, inF=.4+rand()*.5, pts=[];
      for(let k=0;k<=5;k++){ const u=k/5, s=s0+(s1-s0)*u, h=h0+(h1-h0)*u+Math.sin(u*PI)*1.2; pts.push(new THREE.Vector3(gx+sx*s+A_.gate.fx*inF,fy+h,gz+sz*s+A_.gate.fz*inF)); }
      const R1=growRoot(ctx.group,pts,.18+rand()*.1,rootM), R2=growRoot(ctx.group,pts.map(p=>p.clone().add(new THREE.Vector3(A_.gate.fx*.2,0,A_.gate.fz*.2))),.07,veinM);   /* the glowing vein on the side facing into the prison */ gateRoots.push({ R1, R2, at:SH.gate+.5+i*.32, thud:false }); }
    { const gg=glow(0xb8ff7a,9,0); gg.material.fog=false; gg.position.set(gx-A_.gate.fx*.8,fy+2.6,gz-A_.gate.fz*.8); ctx.group.add(gg); OWN.push(gg.material); A_.gateGlow=gg; }   // the seal's own light, behind the roots
    cnt.gateRoots=gateRoots.length; }
  // the tavern set, the four round the table, mugs in front of them
  buildSet(ctx.group); A_.table={ x:SX-1, z:SZ };
  const P=window.__party&&window.__party.model; const seats=[[-1.55,0],[1.55,0],[0,-1.55],[0,1.55]];
  if(C2) C2.CREW.forEach((h,i)=>{ const m=C2.MODEL[h.id]; if(!m) return; const x=A_.table.x+seats[i][0], z=A_.table.z+seats[i][1]; m.wrap.position.set(x,0,z); m.wrap.rotation.y=Math.atan2(A_.table.x-x,A_.table.z-z); m.wrap.visible=false; ctx.group.add(m.wrap);
    if(P&&m.actions.idle){ P.play(m,'idle',{fade:0,restart:true}); m.actions.idle.time=i*.7; } const mt=P&&P.mount(m.root); let left=null; try{ const dw=window.__dualwield&&window.__dualwield.prep?window.__dualwield.prep(m.root):null; left=dw&&dw.node?chainOf(dw.node):null; }catch(e){}
    const mug=makeMug(); mug.visible=false; ctx.group.add(mug); mugs.push(mug); heroes.push({ h, m, right:mt?chainOf(mt):null, left, mug, x, z }); });
  cnt.heroes=heroes.length; cnt.mugs=mugs.length;
  // the raven and its perch (57-raven.js) sit by the Heartroot: they step out of the ending (found by the raven's own spots), back after
  hidRaven=[]; try{ const sp=(window.__raven&&window.__raven.spots&&window.__raven.spots())||[]; for(const root of [scene,world]) for(const o of root.children){ if(!o.visible||o===ctx.group) continue; if(sp.some(p=>Math.hypot(o.position.x-p.x,o.position.z-p.z)<1.6&&Math.abs(o.position.y-p.y)<4)){ o.visible=false; hidRaven.push(o); } } }catch(e){}
  ctx.darken({ hemi:.04, emissive:.08, fog:[90,240], flat:.45 }); const F=ctx.fireLights(8); F.I=2; F.dist=16; F.col=0xc8ff8a;
  return true; }
function camFor(t){ const H=A_.heart, G=A_.gate, T=A_.table;
  if(t<SH.roots){ const k=ssm(t/SH.roots), a=.6+.7*k, r=8-2*k; return { p:[H.x+Math.sin(a)*r,H.y+2.4+1.5*k,H.z+Math.cos(a)*r], l:[H.x,H.y+2.2+1*k,H.z], fov:48, name:'blaze', f:{ x:H.x, y:H.y+2, z:H.z } }; }
  if(t<SH.gate){ const k=ssm((t-SH.roots)/(SH.gate-SH.roots)); return { p:[H.x+6+4*k,H.y+11+5*k,H.z+10+5*k], l:[H.x,H.y,H.z], fov:52, name:'roots', f:{ x:H.x, y:H.y+1, z:H.z } }; }
  if(t<SH.tavern){ const k=ssm((t-SH.gate)/(SH.tavern-SH.gate)), bx=G.x+G.fx*10, bz=G.z+G.fz*10;   /* inside the prison, looking back at the doorway */ return { p:[bx-G.fz*1.5*(1-k),G.y+3,bz+G.fx*1.5*(1-k)], l:[G.x,G.y+2.4,G.z], fov:50, name:'gate', f:{ x:G.x, y:G.y+2, z:G.z } }; }
  if(t<SH.title){ const k=ssm((t-SH.tavern)/(SH.title-SH.tavern)), a=2.2+.9*k, r=6.6-.6*k; return { p:[T.x+Math.sin(a)*r,2.6+.2*k,T.z+Math.cos(a)*r], l:[T.x,1.3,T.z], fov:50, name:'tavern', f:{ x:T.x, y:1.5, z:T.z } }; }
  const k=ssm((t-SH.title)/(DUR-SH.title)), a=3.1, r=5.6+1.6*k; return { p:[T.x+Math.sin(a)*r,2.8+2.4*k,T.z+Math.cos(a)*r], l:[T.x,1.3,T.z], fov:54, name:'title', f:{ x:T.x, y:1.5, z:T.z } }; }
function step(ctx,t,dt){ const U=ctx.audio, F=ctx.fire, P=window.__party&&window.__party.model;
  ctx.black(t<1.6?1-ssm(t/1.6):t>DUR-2?ssm((t-(DUR-2))/1.8):(t>=SH.tavern-.4&&t<SH.tavern+.6?(t<SH.tavern?ssm((t-SH.tavern+.4)/.4):1-ssm((t-SH.tavern)/.6)):0)); ctx.title(ssm((t-(SH.title+.6))/1.3)*(1-ssm((t-(DUR-1.6))/1)));
  // the blaze
  const bl=ssm((t-1)/6), pulse=.5+.5*Math.sin(t*2.4); heartG.material.opacity=t<SH.tavern?(.2+.5*bl)*(.85+.15*pulse):0; heartG.scale.setScalar(5+9*bl);   /* a blaze round the crystal, not a wash over the screen */
  if(motes){ moteMat.opacity=t<SH.tavern?.85*bl:0; const p=motes.geometry.attributes.position.array, sp=motes.userData.sp; for(let i=0;i<sp.length;i++){ let y=p[i*3+1]+sp[i]*dt*(1+bl); if(y>A_.heart.y+16) y=A_.heart.y; p[i*3+1]=y; } motes.geometry.attributes.position.needsUpdate=true; }
  ctx.once('rumble',1.2,()=>{ U.swell(.08); U.boom(.25); });
  // the roots
  for(const r of roots){ const k=(t-r.at)/2.6; setGrow(r.R1,k); setGrow(r.R2,k); }
  for(const r of gateRoots){ const k=(t-r.at)/1; setGrow(r.R1,k); setGrow(r.R2,k); if(k>=1&&!r.thud){ r.thud=true; U.boom(.22); } }
  if(A_.gateGlow){ const n=gateRoots.filter(r=>t-r.at>0).length/Math.max(1,gateRoots.length); A_.gateGlow.material.opacity=t>=SH.gate&&t<SH.tavern?.25+.6*n:0; A_.gateGlow.scale.setScalar(7+5*n); }
  ctx.once('sealed',SH.gate+.5+8*.32+1,()=>{ U.boom(.45); U.swell(.05); });
  // the tavern
  const showT=t>=SH.tavern; for(const H of heroes){ const m=H.m; m.wrap.visible=showT; H.mug.visible=showT; if(!showT) continue; if(m.mixer) m.mixer.update(dt); m.wrap.updateMatrixWorld(true);
    const raise=ssm((t-SH.toast)/1.1)*(1-ssm((t-SH.toast-2.6)/1)), T=A_.table, dx=T.x-H.x, dz=T.z-H.z, dl=Math.hypot(dx,dz)||1, yaw=m.wrap.rotation.y, rx=-Math.cos(yaw), rz=Math.sin(yaw);
    aim(H.right,new THREE.Vector3(H.x+dx/dl*(.55+.35*raise)-rx*.32,1.0+1.9*raise,H.z+dz/dl*(.55+.35*raise)-rz*.32));   // his mug at the table's edge, then raised over it with the others
    aim(H.left,new THREE.Vector3(H.x-rx*.5,.3,H.z-rz*.5));
    if(H.right){ H.right.hand.getWorldPosition(_v1); H.mug.position.set(_v1.x,_v1.y-.42,_v1.z); H.mug.rotation.set(0,yaw,0); } else { H.mug.position.set(H.x+dx/dl*.7,.95,H.z+dz/dl*.7); } }
  if(setFlames){ setFlames[0].scale.set(1.5*(1+.1*Math.sin(t*11)),1.9*(1+.15*Math.sin(t*13)),1); setFlames[1].scale.set(.8,1.1*(1+.12*Math.sin(t*17+1)),1); }
  ctx.once('clink',SH.toast+1.05,()=>{ clink(U); });
  // light: the Heartroot's green-gold through the prison shots, the hearth and the table in the tavern
  if(F){ const inT=t>=SH.tavern; F.col=inT?0xffb070:0xc8ff8a; F.I=inT?1.25:.9+1*bl; if(!inT) F.col=t>=SH.gate?0xffd890:0xd8ff9a;
    const pts=inT?[[SX,1.2,SZ+5],[A_.table.x,2.6,A_.table.z],[SX+5.4,2.4,SZ-1],[SX-5.8,2.4,SZ-1.8],[SX,2.6,SZ-5.2]]:[[A_.heart.x,A_.heart.y+3,A_.heart.z],[A_.heart.x+4,A_.heart.y+2,A_.heart.z+4],[A_.heart.x-4,A_.heart.y+2,A_.heart.z-3],[A_.gate.x+A_.gate.fx*3,A_.gate.y+3,A_.gate.z+A_.gate.fz*3],[A_.gate.x+A_.gate.fx*5-A_.gate.fz*2,A_.gate.y+2,A_.gate.z+A_.gate.fz*5+A_.gate.fx*2]];
    SRC.forEach((o,i)=>{ const p=pts[i]; if(!p){ o.on=false; return; } o.x=p[0]; o.y=p[1]; o.z=p[2]; o.on=true; o.ph=i*1.3; o.k=1; }); F.update(SRC,camFor(t).f,dt,t); }
  const c=camFor(t); ctx.cam(c.p,c.l,c.fov); if(c.name!==lastCut){ if(lastCut!==null&&F&&F.cut) F.cut(); lastCut=c.name; }
  tunePrep(U); if(!tuneSrc&&TUNE&&t<DUR-1) tunePlay(U,t); }
function teardown(ctx){ cnt.teardowns++; for(const o of hidRaven) o.visible=true; hidRaven=[]; if(lastCut!=='title') tuneStop(.6); else tuneSrc=null;   /* ended by itself: the song runs out on its own */
  for(const H of heroes){ try{ H.m.mixer.stopAllAction(); }catch(e){} if(H.m.wrap.parent) H.m.wrap.parent.remove(H.m.wrap); H.m.wrap.rotation.y=0; }
  for(const m of OWN.splice(0)) try{ m.dispose(); }catch(e){}
  heroes=[]; roots=[]; gateRoots=[]; mugs=[]; motes=null; setFlames=null; setNpc=null; }
CINE.register(ID,{ title:'ROOTGATE', sub:'THE GATE HOLDS', map:'prison', pic:'cine-ending.jpg', dur:DUR,
  when:()=>PRISON&&!TUTORIAL&&!SURVIVAL&&!!S.held,
  ready:()=>{ tuneFetch(); const C2=window.__prologue&&window.__prologue.crew; return !!(C2&&C2.get()); },
  setup, step, teardown });
window.__ending={ info:()=>Object.assign({ heroesLive:heroes.filter(H=>H.m.wrap.visible).length, grown:roots.filter(r=>r.R1.geo.drawRange.count>0).length, sealed:gateRoots.filter(r=>r.thud).length, blaze:heartG?+heartG.material.opacity.toFixed(2):0, cut:lastCut, gate:A_.gate },cnt), cam:t=>camFor(t), SH, DUR };
})();
