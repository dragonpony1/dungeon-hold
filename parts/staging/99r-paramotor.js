// ===== THE PARAMOTOR (build 575). Matt, up on THE DRAWBRIDGE's gate (square 24, 13, 16 up): "at the moment you cant jump up on this thing cuz its like a false platiform you just walk into it.
// but what if you could jump up on here and para motor around the castle.. i mean its already a crazy map" -- then "yes build phase only like the mini golf".
//  * THE GATE TOWERS ARE REAL: the two round towers over the gate (MAP.castle.towers, the ones without a cone, 4 up from the 16-up walk) are solid now -- you no longer walk into them -- and each
//    has a stone stair up its inner side to a flat top inside its ring of merlons (RAILBOXES with a bot: hero-only, the horde's roads below untouched).
//  * A PARAMOTOR waits on each tower top (build 578: two a tower, four in all -- one each for a full co-op party). In the BUILD phase walk up to one and press E: the wing opens over you and you launch.
//    Flying: it goes where you look (the mouse), W faster, S slower, SPACE climbs (the motor), SHIFT dives; otherwise a gentle glide down. Land on any floor, roof or wall-walk -- or E to drop.
//    The camera pulls back while you fly; a propeller hum rises and falls with the throttle. When you land, the paramotor flies itself back to its own spot.
//  * BUILD PHASE ONLY, like the mini golf: when the horn sounds mid-flight the wing pulls you gently straight down (a co-op guest: the host's horn).
// Matt's Meshy models (build 576: para-pack/-propeller/-wing/-wing-folded.glb) dress it; a drawn stand-in flies until they are in. Test hook: window.__para.
(function(){
'use strict';
window.__para={ info:()=>null };
if(!MAP||MAP.id!=='moat'||!MAP.castle) return;
const CS=MAP.castle, TOWERS=(CS.towers||[]).filter(t=>t[4]!=='cone'&&t[3]>=19.5&&t[3]<=20.5);   // the two gate towers (top 20); the corner towers are lower (19) and stand in the walls
if(TOWERS.length<1) return;
const cnt={ flights:0, landings:0, drops:0, steps:0 };
const WALK=16, STEP=.5, DEPTH=.62;
const stone=new THREE.MeshToonMaterial({ color:new THREE.Color(0x5a5276) }); try{ if(window.__stoneify) window.__stoneify(stone,false); }catch(e){}   // build 577 (Matt: 'make the stairs match the castle stone'): the walls' own stone (56k5-moatstone.js), projected the same way
const C3=h=>new THREE.Color(h);
// ---- the towers made solid, with a stair up the inside of each
const tops=[];
TOWERS.forEach(([x,z,r,h],i)=>{ const wx=cw(x), wz=cwz(z), k=r*.95;
  RAILBOXES.push({ x0:wx-k, x1:wx+k, z0:wz-k, z1:wz+k, top:h, bot:WALK-.1, noStand:true }); tops.push({ x:wx, z:wz, r, h });
  // the stair: from the walk up the side facing the other tower, steps of half a unit
  const other=TOWERS[1-i]||TOWERS[0], dir=Math.sign(cw(other[0])-wx)||-1;   // which way the stair runs (toward the gap between the towers)
  const n=Math.ceil((h-WALK)/STEP), x0=wx+dir*k;
  for(let s=0;s<n;s++){ const top=WALK+STEP*(s+1), xa=x0+dir*(n-1-s)*DEPTH, xb=xa+dir*DEPTH; const lo=Math.min(xa,xb), hi=Math.max(xa,xb);
    RAILBOXES.push({ x0:lo, x1:hi, z0:wz-1.1, z1:wz+1.1, top, bot:WALK-.1, step:true, noStand:true });
    const m=new THREE.Mesh(new THREE.BoxGeometry(hi-lo,top-WALK,2.2),stone); m.position.set((lo+hi)/2,WALK+(top-WALK)/2,wz); m.userData.noOL=true; world.add(m); cnt.steps++; }
});
// ---- build 578 (Matt: "ok now will this work coop, could 2 or 3 or 4 be flying around?" / "yes build it"): FOUR PARAMOTORS, two on each gate tower's top (on the half away from its stair, the folded
// wing on its crate in a corner). Whichever you take is yours: it flies with you and goes home to its own spot when you land. Your look tells every partner (99-network.js lookOf: pm = which one,
// 1-4, while you fly), so on their screens that one leaves its tower and flies over your hero -- wing, pack, spinning propeller, banking as you turn -- with a quieter hum as you pass near them.
const metal=new THREE.MeshToonMaterial({ color:C3(0x3a3a46) }), brass=new THREE.MeshToonMaterial({ color:C3(0xd8a84a) }), cloth=new THREE.MeshToonMaterial({ color:C3(0xd8402a), side:THREE.DoubleSide }), cloth2=new THREE.MeshToonMaterial({ color:C3(0xffd27a), side:THREE.DoubleSide });
const WING_Y=1.0;   // where the wing's lines meet: the handles clip onto the pack's cage (build 577, Matt: 'the handles on the canopy are floating')
let MODELS=false, SRC=null;
const PEERFLY=new Map();   // partner id -> { k, rig, spare, yaw, grow, bank }
const FL={ on:false, t:0, x:0, y:0, z:0, sp:9, vy:0, th:.5, dropping:false, camD:null, perch:-1, rig:null, grow:1 };
// a rig: the pack (with its propeller) and the wing, one group that sits on a perch or rides a flyer
function standInRig(){ const g=new THREE.Group(), pack=new THREE.Group(); g.add(pack);
  const frame=new THREE.Mesh(new THREE.BoxGeometry(.7,1.1,.3),metal); frame.position.set(0,1.3,-.35); pack.add(frame);
  const cage=new THREE.Mesh(new THREE.TorusGeometry(.95,.05,6,24),brass); cage.position.set(0,1.4,-.6); pack.add(cage);
  const prop=new THREE.Group(); prop.position.set(0,1.4,-.62); pack.add(prop);
  for(let b=0;b<2;b++){ const bl=new THREE.Mesh(new THREE.BoxGeometry(1.7,.12,.04),new THREE.MeshToonMaterial({ color:C3(0x6b4a2a) })); bl.rotation.z=b*Math.PI/2; prop.add(bl); }
  const wing=new THREE.Group(); const SEG=9, SPAN=7.2, ARC=1.1;
  for(let s=0;s<SEG;s++){ const u=(s+.5)/SEG-.5, a=u*ARC*2; const p=new THREE.Mesh(new THREE.BoxGeometry(SPAN/SEG+.05,.08,1.6),s%2?cloth2:cloth); p.position.set(Math.sin(a)*SPAN/2/ARC*.9,Math.cos(a)*1.4+3.2,0); p.rotation.z=-a; wing.add(p); }
  wing.visible=false; g.add(wing); g.traverse(o=>{ if(o.isMesh) o.userData.noOL=true; }); return { g, pack, prop, wing, model:false }; }
function modelRig(){ const g=new THREE.Group(), pack=new THREE.Group(); g.add(pack); pack.add(SRC.pack.clone(true));
  const prop=new THREE.Group(); prop.position.copy(SRC.propPos); prop.add(SRC.prop.clone(true)); pack.add(prop);
  const wing=new THREE.Group(); wing.add(SRC.wing.clone(true)); wing.visible=false; g.add(wing); return { g, pack, prop, wing, model:true }; }
const newRig=()=>{ const r=MODELS?modelRig():standInRig(); world.add(r.g); return r; };
function dropRig(r){ if(r&&r.g&&r.g.parent) r.g.parent.remove(r.g); }
// the perches: two a tower, on the far half from the stair, facing it
const PERCHES=[], CRATES=[];
tops.forEach((t,ti)=>{ const other=tops[1-ti]||tops[0], dir=Math.sign(other.x-t.x)||-1, away=-dir;
  for(const sz of [-1,1]) PERCHES.push({ i:PERCHES.length, x:t.x+away*.95, y:t.h, z:t.z+sz*.95, yaw:dir>0?Math.PI/2:-Math.PI/2, rig:null, taken:null, back:null });
  CRATES.push({ x:t.x+dir*.55, y:t.h, z:t.z+1.45, g:null }); });
function parkRig(p){ const r=p.rig; if(!r) return; r.g.position.set(p.x,p.y,p.z); r.g.rotation.set(0,p.yaw,0); r.wing.visible=false; r.wing.rotation.set(0,0,0); r.pack.visible=true; }
PERCHES.forEach(p=>{ p.rig=newRig(); parkRig(p); });
{ const parse=n=>fetchBytes(ASSET(n),'later').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej)));
  // fit: scaled so its largest side (or the given axis) is SIZE; 'bottom' puts its lowest point at 0, else its centre
  const fit=(root,size,axis,bottom)=>{ root.updateMatrixWorld(true); const b=new THREE.Box3().setFromObject(root), sz=b.getSize(new THREE.Vector3()), c=b.getCenter(new THREE.Vector3()); const sc=size/Math.max(axis?sz[axis]:Math.max(sz.x,sz.y,sz.z),1e-6);
    const inner=new THREE.Group(); inner.add(root); inner.scale.setScalar(sc); inner.position.set(-c.x*sc,bottom?-b.min.y*sc:-c.y*sc,-c.z*sc); try{ toonify(root,sc); }catch(e){} inner.traverse(o=>{ if(o.isMesh) o.userData.noOL=true; }); const w=new THREE.Group(); w.add(inner); w.userData.size=sz.clone().multiplyScalar(sc); return w; };
  Promise.all(['para-pack.glb','para-propeller.glb','para-wing.glb','para-wing-folded.glb'].map(parse)).then(([P,Q,Wg,F])=>{
    // build 576/577: the pack on the hero's back (harness toward him), the propeller inside its cage, the wing's handles on the cage, the folded wing on its crate
    const pk=fit(P.scene,1.55,'y',true); pk.position.set(0,.55,-.62); const H=pk.userData.size;
    const pr=fit(Q.scene,H.x*.8,'x',false); const wg=fit(Wg.scene,6.4,'x',true); wg.position.set(0,WING_Y,-.6);
    SRC={ pack:pk, prop:pr, propPos:new THREE.Vector3(0,.55+H.y*.5,-.62-H.z*.32), wing:wg };
    MODELS=true; cnt.models=4;
    // every rig rebuilt from the models where it stands (one in flight keeps flying)
    const swap=r=>{ const n=modelRig(); n.g.position.copy(r.g.position); n.g.rotation.copy(r.g.rotation); n.wing.visible=r.wing.visible; n.wing.scale.copy(r.wing.scale); n.wing.rotation.copy(r.wing.rotation); world.add(n.g); dropRig(r); return n; };
    PERCHES.forEach(p=>{ const was=p.rig; p.rig=swap(was); if(FL.rig===was) FL.rig=p.rig; for(const pf of PEERFLY.values()) if(pf.rig===was) pf.rig=p.rig; });
    for(const pf of PEERFLY.values()) if(pf.spare&&!pf.rig.model) pf.rig=swap(pf.rig);
    for(const c of CRATES){ c.g=fit(F.scene.clone(true),1.0,'x',true); c.g.position.set(c.x,c.y,c.z); world.add(c.g); } }).catch(e=>{ console.warn('paramotor models',e); });
}
// ---- the prompt and the flight bar
const css=document.createElement('style'); css.textContent='#paraPrompt,#paraBar{position:fixed;left:50%;transform:translateX(-50%);z-index:25;pointer-events:none;display:none;background:#0b0912e8;border:2px solid #c9962f;border-radius:999px;color:#ffe2b8;font:bold 15px Georgia,serif;padding:7px 16px;box-shadow:0 3px 12px #000}#paraPrompt{top:62%}#paraBar{bottom:130px;font-size:14px}#paraPrompt kbd,#paraBar kbd{display:inline-block;min-width:20px;padding:0 6px;margin:0 3px;border:2px solid #ffd27a;border-radius:6px;font:bold 13px system-ui;color:#ffd27a;background:#000}';
document.head.appendChild(css);
const prm=document.createElement('div'); prm.id='paraPrompt'; prm.innerHTML='🪂 <kbd>E</kbd> fly the paramotor'; document.body.appendChild(prm);
const bar=document.createElement('div'); bar.id='paraBar'; bar.innerHTML='🖱 steer · <kbd>W</kbd>faster · <kbd>S</kbd>slower · <kbd>Space</kbd>climb · <kbd>Shift</kbd>dive · <kbd>E</kbd>drop'; document.body.appendChild(bar);
// ---- the hum: yours, and one shared quieter hum for partners flying near you
function mkHum(){ try{ const a=A(); if(!a) return null; const o=a.createOscillator(), o2=a.createOscillator(), g=a.createGain(), f=a.createBiquadFilter(); o.type='sawtooth'; o2.type='square'; o.frequency.value=62; o2.frequency.value=124.5; f.type='lowpass'; f.frequency.value=700; g.gain.value=0;
  o.connect(f); o2.connect(f); f.connect(g).connect(SFXOUT(a)); o.start(); o2.start(); return { o, o2, g, a }; }catch(e){ return null; } }
function humSet(h,gain,th){ if(!h) return; const t=h.a.currentTime; h.g.gain.setTargetAtTime(soundOff?0:gain,t,.15); h.o.frequency.setTargetAtTime(55+40*th,t,.2); h.o2.frequency.setTargetAtTime(110+80*th,t,.2); }
function humOff(h){ if(!h) return; try{ const t=h.a.currentTime; h.g.gain.setTargetAtTime(0,t,.2); setTimeout(()=>{ try{ h.o.stop(); h.o2.stop(); }catch(e){} },900); }catch(e){} }
let hum=null, farHum=null;
// ---- your flight
const keys={ space:0 };
addEventListener('keydown',e=>{ if(e.code==='Space'&&FL.on){ keys.space=1; e.preventDefault(); e.stopImmediatePropagation(); } },true);
addEventListener('keyup',e=>{ if(e.code==='Space') keys.space=0; },true);
const phase=()=>{ try{ return typeof hallPhase==='function'?hallPhase():S.phase; }catch(e){ return S.phase; } };
const free=p=>!p.taken&&!p.back;
function nearest(){ let best=null, bd=2.6; for(const p of PERCHES){ if(!free(p)) continue; const d=Math.hypot(hero.x-p.x,hero.z-p.z); if(d<bd&&Math.abs((hero.y||0)-p.y)<1.2){ bd=d; best=p; } } return best; }
const near=()=>!FL.on&&phase()==='build'&&!Meta.isOpen()&&!!nearest();
function openWing(r){ r.wing.visible=true; r.wing.scale.setScalar(.15); r.wing.rotation.set(0,0,0); }
function launch(p){ p=p||nearest()||PERCHES.find(free); if(!p||!free(p)) return false; p.taken='me'; FL.perch=p.i; FL.rig=p.rig;
  FL.on=true; FL.t=0; FL.x=hero.x; FL.y=(hero.y||0)+.2; FL.z=hero.z; FL.sp=8; FL.vy=2.5; FL.th=.6; FL.dropping=false; FL.camD=cam.dist; FL.grow=0; cnt.flights++;
  openWing(FL.rig); hum=hum||mkHum(); prm.style.display='none'; bar.style.display='block'; return true; }
function sendHome(p,from){ p.back={ t:0, from:from.clone() }; p.rig.wing.visible=false; }
function land(dropped){ FL.on=false; humOff(hum); hum=null; bar.style.display='none'; if(FL.camD!=null) cam.dist=FL.camD; hero.vy=0; if(dropped) cnt.drops++; else cnt.landings++;
  const p=PERCHES[FL.perch]; if(p){ p.taken=null; sendHome(p,new THREE.Vector3(FL.x,FL.y+.2,FL.z)); } FL.perch=-1; FL.rig=null; }
addEventListener('keydown',e=>{ if(e.code!=='KeyE'||e.repeat) return; if(FL.on){ e.preventDefault(); e.stopImmediatePropagation(); FL.dropping=true; return; } if(near()){ e.preventDefault(); e.stopImmediatePropagation(); launch(); } },true);
const v3=new THREE.Vector3();
const MINX=-OX+1, MAXX=GW*CELL-OX-1, MINZ=-OZ+1, MAXZ=GH*CELL-OZ-1;
function grow(r,k){ const g=1-Math.pow(1-k,3); r.wing.scale.set(g,.3+.7*g,g); }
function fly(dt){ FL.t+=dt;
  const drop=FL.dropping||phase()!=='build';
  camera.getWorldDirection(v3); const hl=Math.hypot(v3.x,v3.z)||1, fx=v3.x/hl, fz=v3.z/hl;
  if(!drop){ if(K.w) FL.th=Math.min(1,FL.th+dt*.9); if(K.s) FL.th=Math.max(0,FL.th-dt*.9); FL.sp=6+FL.th*10; }
  else FL.sp=Math.max(0,FL.sp-dt*8);
  const climb=!drop&&keys.space, dive=!drop&&K.shift;
  const want=drop?-5:climb?3.8:dive?-7:-1.1; FL.vy+=(want-FL.vy)*Math.min(1,dt*2.2);
  let nx=FL.x+fx*FL.sp*dt, nz=FL.z+fz*FL.sp*dt, ny=Math.min(46,FL.y+FL.vy*dt);
  nx=Math.max(MINX,Math.min(MAXX,nx)); nz=Math.max(MINZ,Math.min(MAXZ,nz));
  if(solidAt(nx,nz,ny,true)){ if(!solidAt(nx,FL.z,ny,true)) nz=FL.z; else if(!solidAt(FL.x,nz,ny,true)) nx=FL.x; else { nx=FL.x; nz=FL.z; } FL.sp*=.5; }
  const fl=floorAt(nx,nz,ny+.3);
  if(ny<=fl+.02&&(FL.t>1.2||drop)){ FL.x=nx; FL.z=nz; FL.y=fl; hero.x=nx; hero.z=nz; hero.y=fl; land(drop&&FL.dropping); return; }
  FL.x=nx; FL.z=nz; FL.y=Math.max(ny,fl);
  hero.x=FL.x; hero.z=FL.z; hero.y=FL.y; hero.vy=0; hero.moving=false; hero.yaw=Math.atan2(fx,fz);
  const r=FL.rig; if(r){ r.g.position.set(FL.x,FL.y,FL.z); r.g.rotation.set(0,hero.yaw,0); const bank=(K.a?1:0)-(K.d?1:0); r.wing.rotation.z+=((bank*.25)-r.wing.rotation.z)*Math.min(1,dt*3); r.wing.rotation.x=-.15-FL.vy*.03;
    if(FL.grow<1){ FL.grow=Math.min(1,FL.grow+dt*1.6); grow(r,FL.grow); } r.prop.rotation.z+=dt*(30+FL.th*40); }
  humSet(hum,drop?0:.035+.05*FL.th,drop?0:FL.th);
  cam.dist+=((Math.max(FL.camD||8,15))-cam.dist)*Math.min(1,dt*2); }
{ const prev=heroUpdate; heroUpdate=function(dt){ prev.apply(this,arguments); if(FL.on) fly(dt); }; }
// ---- partners in flight (co-op): their look carries pm = which paramotor (1-4) while they fly
function peerLook(id,pm){ pm=pm|0; const pf=PEERFLY.get(id);
  if(pm>0&&!pf){ const p=PERCHES[pm-1]; let rig=null, spare=false;
    if(p&&p.taken===null&&!p.back){ p.taken=id; rig=p.rig; } else { rig=newRig(); spare=true; }   // the one they took -- or, if ours is in that spot (a race), a copy for them
    openWing(rig); PEERFLY.set(id,{ k:pm, rig, spare, yaw:null, grow:0, bank:0 }); cnt.peerFlights=(cnt.peerFlights|0)+1; return; }
  if(pm===0&&pf) peerLanded(id); }
function peerLanded(id){ const pf=PEERFLY.get(id); if(!pf) return; PEERFLY.delete(id); const from=pf.rig.g.position.clone();
  if(pf.spare){ dropRig(pf.rig); return; } const p=PERCHES[pf.k-1]; if(p&&p.taken===id){ p.taken=null; sendHome(p,from); } }
let partyHooked=false;
function hookParty(){ const P=window.__party; if(partyHooked||!P||!P.setLook) return; partyHooked=true; const sl=P.setLook; P.setLook=function(id,look){ try{ peerLook(id,look&&look.pm); }catch(e){} return sl.apply(this,arguments); }; }
function peersTick(dt){ hookParty(); if(!PEERFLY.size){ if(farHum) humSet(farHum,0,0); return; } const P=window.__party, live=P&&P.list?P.list():[]; let loud=0;
  for(const [id,pf] of PEERFLY){ if(!live.includes(id)){ peerLanded(id); continue; } const q=P.get(id); if(!q) continue; const r=pf.rig;
    r.g.position.set(q.x,q.y,q.z); const yaw=q.yaw; if(pf.yaw!=null&&dt>0){ let dy=yaw-pf.yaw; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); pf.bank+=((Math.max(-1,Math.min(1,dy/dt/1.5))*.25)-pf.bank)*Math.min(1,dt*3); } pf.yaw=yaw;
    r.g.rotation.set(0,yaw,0); r.wing.rotation.z=pf.bank; r.wing.rotation.x=-.15; if(pf.grow<1){ pf.grow=Math.min(1,pf.grow+dt*1.6); grow(r,pf.grow); } r.prop.rotation.z+=dt*50;
    loud=Math.max(loud,Math.max(0,1-Math.hypot(q.x-hero.x,q.z-hero.z,(q.y||0)-(hero.y||0))/32)); }
  if(loud>0&&!farHum) farHum=mkHum(); humSet(farHum,.04*loud,.6); }
// ---- every frame: the prompt, the paramotors going home, partners' paramotors, idle propellers
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt);
    prm.style.display=near()?'block':'none';
    for(const p of PERCHES){ if(p.back){ const B=p.back, r=p.rig; B.t+=dt; const k=Math.min(1,B.t/3), s=k*k*(3-2*k); r.g.position.set(B.from.x+(p.x-B.from.x)*s,B.from.y+(p.y-B.from.y)*s+Math.sin(k*Math.PI)*6,B.from.z+(p.z-B.from.z)*s); r.prop.rotation.z+=dt*25; if(k>=1){ p.back=null; parkRig(p); } }
      else if(!p.taken) p.rig.prop.rotation.z+=dt*.4; }
    try{ peersTick(dt); }catch(e){} }; }
const PP=PERCHES[PERCHES.length-1], PERCH={ x:PP.x, y:PP.y, z:PP.z };   // tests: one on the east tower (where the single paramotor stood before build 578)
window.__para={ models:()=>MODELS, mine:()=>FL.on?FL.perch+1:0,
  info:()=>Object.assign({ on:FL.on, dropping:FL.dropping, back:PERCHES.some(p=>!!p.back), near:near(), x:+FL.x.toFixed(2), y:+FL.y.toFixed(2), z:+FL.z.toFixed(2), sp:+FL.sp.toFixed(2), perch:PERCH, perches:PERCHES.length, towers:tops.length,
    taken:PERCHES.map(p=>p.taken===null?(p.back?'back':null):p.taken), peers:[...PEERFLY.entries()].map(([id,pf])=>({ id, k:pf.k, spare:pf.spare, wing:pf.rig.wing.visible, x:+pf.rig.g.position.x.toFixed(1), y:+pf.rig.g.position.y.toFixed(1), z:+pf.rig.g.position.z.toFixed(1) })) },cnt),
  launch:i=>launch(typeof i==='number'?PERCHES[i]:null), land:()=>{ if(FL.on) FL.dropping=true; }, perches:()=>PERCHES.map(p=>({ i:p.i, x:p.x, y:p.y, z:p.z })),
  scan:(x0,x1,z0,z1,y)=>{ const out=[]; for(let z=z0;z<=z1;z++){ const row=[]; for(let x=x0;x<=x1;x++) row.push(Math.round(floorAt(cw(x),cwz(z),y==null?99:y))); out.push((z-((MAP.padN)|0))+': '+row.join(' ')); } return out; }, perch:()=>PERCH, keys, profile:(x0,x1,z,stp)=>{ const o=[]; let y=WALK; for(let x=x0;x<=x1+1e-6;x+=stp){ y=floorAt(x,z,y+.6); o.push(+y.toFixed(2)); } return o; }, solid:(x,z,y)=>solidAt(x,z,y,true) };
})();
