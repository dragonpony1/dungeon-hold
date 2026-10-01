// ===== THE CORRUPTOR'S FATE POWER: THE GATES SWITCH (build 366). Matt, about the prison boss: "I like the switching gates depending on how we set it up" and "4 seconds is fine" (the warning), later "yeah do the gate switching".
// While a Corruptor of Fate is alive on a wave, the horde's way in is not fixed: every 15 seconds it pulls one open gate SHUT and lets the one it shut before open again. Four seconds before a gate shuts it shows it: the Corruptor
// leans back, a violet beam of light runs from him to the gate, a violet veil shimmers up in the doorway and a clock-face sigil on the floor in front of it spins faster and faster (a clock racing out). A shut gate stays veiled
// and its sigil turns slowly; whatever the wave would have sent through it comes out of another open gate instead (spawnEnemy is the one place every mob comes from). Mobs already out keep coming, of course. There are never fewer
// than two gates open: with only two (waves one and two), the power does nothing at all. When the Corruptor dies every gate opens again, a flash at each. Only on THE DEEP PRISON; not in a co-op hall (guests would see none of it).
// The first gate shuts 8 seconds after the Corruptor comes into the fight (its warning starts at 4). No lights are made (violet sprites and flat planes only). Test hook: window.__fate.
(function(){
'use strict';
window.__fate={ info:()=>null };
if(!MAP||MAP.id!=='prison') return;
const WARN=4, PERIOD=15, FIRST=8, K='corruptor';
const inCoop=()=>{ try{ return !!(window.__net&&window.__net.role&&window.__net.role()); }catch(er){ return false; } };
const cnt={ shuts:0, warns:0, remaps:0, reopens:0 };
const FATE={ on:false, clock:0, next:FIRST, shut:null, warn:null, warnAt:0 };
const openLanes=()=>{ const mw=effWave()-MAP.wbase, all=Object.keys(LANES); return all.some(k=>LANES[k].from)?all.filter(k=>(LANES[k].from||1)<=mw):all; };
const boss=()=>enemies.find(e=>e.kind===K&&!e.dead&&e.mdl)||null;
const cutscene=()=>!!(window.__finale&&window.__finale.active&&window.__finale.active());
// ---- the gate's look: a veil in the doorway, a clock-face sigil on the floor, a glow above; one set per gate, made the first time it is needed
let VEIL=null, SIGIL=null;
function veilTex(){ if(VEIL) return VEIL; const c=document.createElement('canvas'); c.width=128; c.height=256; const g=c.getContext('2d'); const gr=g.createLinearGradient(0,0,128,0); gr.addColorStop(0,'rgba(170,70,255,0)'); gr.addColorStop(.2,'rgba(185,95,255,.6)'); gr.addColorStop(.5,'rgba(235,180,255,.95)'); gr.addColorStop(.8,'rgba(185,95,255,.6)'); gr.addColorStop(1,'rgba(170,70,255,0)'); g.fillStyle=gr; g.fillRect(0,0,128,256);
  for(let i=0;i<30;i++){ const x=8+Math.random()*112, w=1+Math.random()*3; g.fillStyle='rgba(255,255,255,'+(.15+Math.random()*.4)+')'; g.fillRect(x,0,w,256); }
  g.globalCompositeOperation='destination-in'; const vg=g.createLinearGradient(0,0,0,256); vg.addColorStop(0,'rgba(0,0,0,.15)'); vg.addColorStop(.25,'rgba(0,0,0,1)'); vg.addColorStop(.8,'rgba(0,0,0,1)'); vg.addColorStop(1,'rgba(0,0,0,.4)'); g.fillStyle=vg; g.fillRect(0,0,128,256); VEIL=new THREE.CanvasTexture(c); return VEIL; }
function sigilTex(){ if(SIGIL) return SIGIL; const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d'); g.translate(128,128); g.strokeStyle='#e6b8ff'; g.lineWidth=7; g.beginPath(); g.arc(0,0,118,0,TAU); g.stroke(); g.lineWidth=2.5; g.beginPath(); g.arc(0,0,102,0,TAU); g.stroke();
  for(let i=0;i<12;i++){ const a=i/12*TAU; g.lineWidth=i%3===0?6:3; g.beginPath(); g.moveTo(Math.sin(a)*(i%3===0?80:90),-Math.cos(a)*(i%3===0?80:90)); g.lineTo(Math.sin(a)*100,-Math.cos(a)*100); g.stroke(); }
  g.lineWidth=7; g.lineCap='round'; g.beginPath(); g.moveTo(0,0); g.lineTo(0,-72); g.stroke(); g.lineWidth=5; g.beginPath(); g.moveTo(0,0); g.lineTo(52,22); g.stroke(); g.fillStyle='#e6b8ff'; g.beginPath(); g.arc(0,0,9,0,TAU); g.fill();
  SIGIL=new THREE.CanvasTexture(c); return SIGIL; }
const gates={};
function gateFor(k){ if(gates[k]) return gates[k]; const L=LANES[k], dx=Math.sin(L.face), dz=Math.cos(L.face), mx=cw(L.cx)+dx*1.05, mz=cwz(L.cz)+dz*1.05, y=floorH(mx,mz);
  const mkMat=(map,col)=>new THREE.MeshBasicMaterial({ map, color:C(col), transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
  const veil=new THREE.Mesh(new THREE.PlaneGeometry(4.4,5.6),mkMat(veilTex(),0xb050ff)); veil.position.set(mx,y+2.8,mz); veil.rotation.y=L.face; veil.userData.noOL=true; veil.visible=false; scene.add(veil);
  const sig=new THREE.Mesh(new THREE.PlaneGeometry(5,5),mkMat(sigilTex(),0xc070ff)); sig.position.set(mx+dx*2.5,y+.12,mz+dz*2.5); sig.rotation.set(-PI/2,0,0); sig.userData.noOL=true; sig.visible=false; scene.add(sig);
  const gl=glow(0xc040ff,8,.001); gl.position.set(mx,y+3,mz); gl.visible=false; scene.add(gl);
  return gates[k]={ k, veil, sig, gl, x:mx, y, z:mz, mode:'off', t:0, spin:Math.random()*6, fade:0, sig_:0 }; }
// ---- the beam from the Corruptor to the gate about to shut: a string of glow sprites
const BEAM=[]; for(let i=0;i<14;i++){ const s=glow(0xc040ff,1.5,.001); s.visible=false; scene.add(s); BEAM.push(s); }
const flashes=[];
function flashAt(x,y,z){ const s=glow(0xbaffd0,6,.001); s.position.set(x,y+2.5,z); scene.add(s); flashes.push({ s, t:0, life:.6 }); }
// ---- the power
function setMode(k,mode){ const G=gateFor(k); G.mode=mode; G.t=0; if(mode==='warn'||mode==='shut'){ G.veil.visible=G.sig.visible=G.gl.visible=true; } }
function beginWarn(){ const open=openLanes(); if(open.length<3) return; const pool=open.filter(k=>k!==FATE.shut); const k=pool[(rnd()*pool.length)|0]; FATE.warn=k; FATE.warnAt=FATE.clock; setMode(k,'warn'); cnt.warns++; try{ SFX.roar&&SFX.roar(); }catch(er){} }
function doSwitch(){ const k=FATE.warn; if(!k) return; if(FATE.shut){ const old=gateFor(FATE.shut); old.mode='open'; old.t=0; old.fade=1; flashAt(old.x,old.y,old.z); cnt.reopens++; }
  FATE.shut=k; FATE.warn=null; setMode(k,'shut'); cnt.shuts++; camShake=Math.max(camShake,.35); try{ SFX.boom&&SFX.boom(); }catch(er){} }
function stopAll(){ for(const k in gates){ const G=gates[k]; if(G.mode==='shut'||G.mode==='warn'){ G.mode='open'; G.t=0; G.fade=1; flashAt(G.x,G.y,G.z); cnt.reopens++; } } FATE.on=false; FATE.shut=null; FATE.warn=null; for(const s of BEAM) s.visible=false; for(const e of enemies) if(e.kind===K) e.casting=false; }
// every mob comes through spawnEnemy: one bound for a shut gate goes out of another open one
{ const prev=spawnEnemy; spawnEnemy=function(kind,lane){ if(FATE.shut&&lane===FATE.shut&&FATE.on){ const open=openLanes().filter(k=>k!==FATE.shut); if(open.length){ lane=open[(rnd()*open.length)|0]; cnt.remaps++; } } return prev.call(this,kind,lane); }; }
WORLDANIM.push(dt=>{
  const b=boss(), act=!inCoop()&&S.phase==='wave'&&!cutscene()&&!!b;
  if(act){ if(!FATE.on){ FATE.on=true; FATE.clock=0; FATE.next=FIRST; } FATE.clock+=dt;
    if(!FATE.warn&&FATE.clock>=FATE.next-WARN){ beginWarn(); if(!FATE.warn) FATE.next+=PERIOD; }   // too few gates open: nothing this round
    if(FATE.warn&&FATE.clock>=FATE.next){ doSwitch(); FATE.next+=PERIOD; } }
  else if(FATE.on&&!cutscene()) stopAll();
  if(b) b.casting=!!(act&&FATE.warn);
  // the looks
  const S_=S.t; for(const k in gates){ const G=gates[k]; G.t+=dt; let vo=0, so=0, go=0, rate=0;
    if(G.mode==='warn'){ const p=Math.min(1,(FATE.clock-FATE.warnAt)/WARN); vo=(.1+.5*p)*(.75+.25*Math.sin(S_*(8+30*p))); so=.2+.65*p; go=(.25+.6*p)*(.7+.3*Math.sin(S_*(6+20*p))); rate=1+9*p; }
    else if(G.mode==='shut'){ vo=.5*(.85+.15*Math.sin(S_*3+G.spin)); so=.6; go=.5+.1*Math.sin(S_*2); rate=.6; }
    else if(G.mode==='open'){ G.fade=Math.max(0,G.fade-dt/.7); vo=.5*G.fade; so=.6*G.fade; go=.5*G.fade; rate=.6; if(G.fade<=0){ G.mode='off'; G.veil.visible=G.sig.visible=G.gl.visible=false; } }
    if(G.mode!=='off'){ G.veil.material.opacity=vo; G.sig.material.opacity=so; G.gl.material.opacity=go; G.gl.scale.setScalar(7+go*5); G.spin+=dt*rate; G.sig.rotation.z=G.spin; } }
  // the beam
  const wk=FATE.warn&&b?gates[FATE.warn]:null; if(wk){ const ax=b.x, ay=(b.y||0)+3.4, az=b.z, bx=wk.x, by=wk.y+2.8, bz=wk.z, px=-(bz-az), pz=(bx-ax), pl=Math.hypot(px,pz)||1;
    BEAM.forEach((s,i)=>{ const u=i/(BEAM.length-1), w=Math.sin(S_*7+i*.9)*.45*Math.sin(u*PI); s.visible=true; s.position.set(ax+(bx-ax)*u+px/pl*w,ay+(by-ay)*u+Math.sin(S_*5+i)*.2,az+(bz-az)*u+pz/pl*w); s.material.opacity=.45+.35*Math.sin(S_*10+i*1.3); s.scale.setScalar(1.3+.5*Math.sin(S_*8+i)); }); }
  else for(const s of BEAM) if(s.visible) s.visible=false;
  for(let i=flashes.length-1;i>=0;i--){ const f=flashes[i]; f.t+=dt; const k=f.t/f.life; if(k>=1){ scene.remove(f.s); f.s.material.dispose(); flashes.splice(i,1); continue; } f.s.material.opacity=.9*(1-k); f.s.scale.setScalar(6+k*10); } });
window.__fate={ makeSigil:(size,col)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(size||5,size||5),new THREE.MeshBasicMaterial({ map:sigilTex(), color:C(col||0xc070ff), transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide })); m.rotation.set(-PI/2,0,0); m.userData.noOL=true; return m; }, info:()=>Object.assign({ on:FATE.on, shut:FATE.shut, warn:FATE.warn, clock:+FATE.clock.toFixed(2), next:FATE.next, open:openLanes().filter(k=>k!==FATE.shut), modes:Object.fromEntries(Object.keys(gates).map(k=>[k,gates[k].mode])), beam:BEAM.filter(s=>s.visible).length },cnt), consts:{ WARN, PERIOD, FIRST }, gate:k=>{ const G=gates[k]; return G?{ x:G.x, y:G.y, z:G.z, mode:G.mode, veil:G.veil.visible, vo:+G.veil.material.opacity.toFixed(2), sig:G.sig.visible, so:+G.sig.material.opacity.toFixed(2) }:null; } };
})();
