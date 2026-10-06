// ===== THE PARAMOTOR (build 575). Matt, up on THE DRAWBRIDGE's gate (square 24, 13, 16 up): "at the moment you cant jump up on this thing cuz its like a false platiform you just walk into it.
// but what if you could jump up on here and para motor around the castle.. i mean its already a crazy map" -- then "yes build phase only like the mini golf".
//  * THE GATE TOWERS ARE REAL: the two round towers over the gate (MAP.castle.towers, the ones without a cone, 4 up from the 16-up walk) are solid now -- you no longer walk into them -- and each
//    has a stone stair up its inner side to a flat top inside its ring of merlons (RAILBOXES with a bot: hero-only, the horde's roads below untouched).
//  * THE PARAMOTOR stands on the EAST tower's top: a fan on a backpack frame and a folded wing. In the BUILD phase walk up to it and press E: the wing opens over you and you launch.
//    Flying: it goes where you look (the mouse), W faster, S slower, SPACE climbs (the motor), SHIFT dives; otherwise a gentle glide down. Land on any floor, roof or wall-walk -- or E to drop.
//    The camera pulls back while you fly; a propeller hum rises and falls with the throttle. When you land, the paramotor flies itself back to its tower.
//  * BUILD PHASE ONLY, like the mini golf: when the horn sounds mid-flight the wing pulls you gently straight down.
// The paramotor is drawn in code for now (Matt's Meshy model can replace it). Test hook: window.__para.
(function(){
'use strict';
window.__para={ info:()=>null };
if(!MAP||MAP.id!=='moat'||!MAP.castle) return;
const CS=MAP.castle, TOWERS=(CS.towers||[]).filter(t=>t[4]!=='cone'&&t[3]>=19.5&&t[3]<=20.5);   // the two gate towers (top 20); the corner towers are lower (19) and stand in the walls
if(TOWERS.length<1) return;
const cnt={ flights:0, landings:0, drops:0, steps:0 };
const WALK=16, STEP=.5, DEPTH=.62;
const stone=new THREE.MeshToonMaterial({ color:new THREE.Color(0x3c3650) });   // the castle's weathered stone, a shade darker than the wall faces' light side
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
// ---- the paramotor
const EAST=tops.reduce((a,b)=>b.x>a.x?b:a,tops[0]);
const PERCH={ x:EAST.x, y:EAST.h, z:EAST.z };
const pm=new THREE.Group(); world.add(pm);
const metal=new THREE.MeshToonMaterial({ color:C3(0x3a3a46) }), brass=new THREE.MeshToonMaterial({ color:C3(0xd8a84a) }), cloth=new THREE.MeshToonMaterial({ color:C3(0xd8402a), side:THREE.DoubleSide }), cloth2=new THREE.MeshToonMaterial({ color:C3(0xffd27a), side:THREE.DoubleSide });
const pack=new THREE.Group(); pm.add(pack);
const frame=new THREE.Mesh(new THREE.BoxGeometry(.7,1.1,.3),metal); frame.position.set(0,1.3,-.35); pack.add(frame);
const cage=new THREE.Mesh(new THREE.TorusGeometry(.95,.05,6,24),brass); cage.position.set(0,1.4,-.6); pack.add(cage);
const hub=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.25,8),metal); hub.rotation.x=Math.PI/2; hub.position.set(0,1.4,-.6); pack.add(hub);
const prop=new THREE.Group(); prop.position.set(0,1.4,-.62); pack.add(prop);
for(let b=0;b<2;b++){ const bl=new THREE.Mesh(new THREE.BoxGeometry(1.7,.12,.04),new THREE.MeshToonMaterial({ color:C3(0x6b4a2a) })); bl.rotation.z=b*Math.PI/2; prop.add(bl); }
// the wing: a curved strip of panels in two colours, lines down to the pack
const wing=new THREE.Group(); pm.add(wing);
const SEG=9, SPAN=7.2, ARC=1.1;
for(let s=0;s<SEG;s++){ const u=(s+.5)/SEG-.5, a=u*ARC*2; const p=new THREE.Mesh(new THREE.BoxGeometry(SPAN/SEG+.05,.08,1.6),s%2?cloth2:cloth); p.position.set(Math.sin(a)*SPAN/2/ARC*.9,Math.cos(a)*1.4,0); p.rotation.z=-a; wing.add(p); }
const lineM=new THREE.LineBasicMaterial({ color:0xeeeeee, transparent:true, opacity:.6 });
{ const pts=[]; for(let s=0;s<=SEG;s+=3){ const u=s/SEG-.5, a=u*ARC*2; pts.push(new THREE.Vector3(Math.sin(a)*SPAN/2/ARC*.9,Math.cos(a)*1.4-.05,0),new THREE.Vector3(0,-3.2,-.3)); } const g=new THREE.BufferGeometry().setFromPoints(pts); wing.add(new THREE.LineSegments(g,lineM)); }
pm.traverse(o=>{ if(o.isMesh) o.userData.noOL=true; });
// parked: on the tower top, the wing folded small behind it
function park(){ pm.position.set(PERCH.x,PERCH.y,PERCH.z); pm.rotation.set(0,-Math.PI/2,0); wing.position.set(0,.5,-1.1); wing.scale.set(.18,.35,.6); wing.rotation.set(-1.2,0,0); }
park();
// ---- the prompt and the flight bar
const css=document.createElement('style'); css.textContent='#paraPrompt,#paraBar{position:fixed;left:50%;transform:translateX(-50%);z-index:25;pointer-events:none;display:none;background:#0b0912e8;border:2px solid #c9962f;border-radius:999px;color:#ffe2b8;font:bold 15px Georgia,serif;padding:7px 16px;box-shadow:0 3px 12px #000}#paraPrompt{top:62%}#paraBar{bottom:130px;font-size:14px}#paraPrompt kbd,#paraBar kbd{display:inline-block;min-width:20px;padding:0 6px;margin:0 3px;border:2px solid #ffd27a;border-radius:6px;font:bold 13px system-ui;color:#ffd27a;background:#000}';
document.head.appendChild(css);
const prm=document.createElement('div'); prm.id='paraPrompt'; prm.innerHTML='🪂 <kbd>E</kbd> fly the paramotor'; document.body.appendChild(prm);
const bar=document.createElement('div'); bar.id='paraBar'; bar.innerHTML='🖱 steer · <kbd>W</kbd>faster · <kbd>S</kbd>slower · <kbd>Space</kbd>climb · <kbd>Shift</kbd>dive · <kbd>E</kbd>drop'; document.body.appendChild(bar);
// ---- the hum
let hum=null;
function humOn(){ try{ const a=A(); if(!a||hum) return; const o=a.createOscillator(), o2=a.createOscillator(), g=a.createGain(), f=a.createBiquadFilter(); o.type='sawtooth'; o2.type='square'; o.frequency.value=62; o2.frequency.value=124.5; f.type='lowpass'; f.frequency.value=700; g.gain.value=0;
  o.connect(f); o2.connect(f); f.connect(g).connect(SFXOUT(a)); o.start(); o2.start(); hum={ o, o2, g, a }; }catch(e){} }
function humSet(th){ if(!hum) return; const t=hum.a.currentTime; hum.g.gain.setTargetAtTime(soundOff?0:.035+.05*th,t,.15); hum.o.frequency.setTargetAtTime(55+40*th,t,.2); hum.o2.frequency.setTargetAtTime(110+80*th,t,.2); }
function humOff(){ if(!hum) return; const h=hum; hum=null; try{ const t=h.a.currentTime; h.g.gain.setTargetAtTime(0,t,.2); setTimeout(()=>{ try{ h.o.stop(); h.o2.stop(); }catch(e){} },900); }catch(e){} }
// ---- the flight
const FL={ on:false, t:0, x:0, y:0, z:0, sp:9, vy:0, th:.5, dropping:false, back:null, camD:null };
const keys={ space:0 };
addEventListener('keydown',e=>{ if(e.code==='Space'&&FL.on){ keys.space=1; e.preventDefault(); e.stopImmediatePropagation(); } },true);
addEventListener('keyup',e=>{ if(e.code==='Space') keys.space=0; },true);
const phase=()=>{ try{ return typeof hallPhase==='function'?hallPhase():S.phase; }catch(e){ return S.phase; } };
const near=()=>!FL.on&&!FL.back&&phase()==='build'&&!Meta.isOpen()&&Math.hypot(hero.x-PERCH.x,hero.z-PERCH.z)<2.6&&Math.abs((hero.y||0)-PERCH.y)<1.2;
function launch(){ FL.on=true; FL.t=0; FL.x=hero.x; FL.y=(hero.y||0)+.2; FL.z=hero.z; FL.sp=8; FL.vy=2.5; FL.th=.6; FL.dropping=false; FL.camD=cam.dist; cnt.flights++;
  wing.position.set(0,3.6,0); wing.scale.set(1,1,1); wing.rotation.set(0,0,0); humOn(); prm.style.display='none'; bar.style.display='block'; }
function land(dropped){ FL.on=false; humOff(); bar.style.display='none'; if(FL.camD!=null) cam.dist=FL.camD; hero.vy=0; if(dropped) cnt.drops++; else cnt.landings++;
  FL.back={ t:0, from:new THREE.Vector3(FL.x,FL.y+.2,FL.z) }; wing.scale.set(.18,.35,.6); wing.rotation.set(-1.2,0,0); wing.position.set(0,.5,-1.1); }
addEventListener('keydown',e=>{ if(e.code!=='KeyE'||e.repeat) return; if(FL.on){ e.preventDefault(); e.stopImmediatePropagation(); FL.dropping=true; return; } if(near()){ e.preventDefault(); e.stopImmediatePropagation(); launch(); } },true);
const v3=new THREE.Vector3();
const MINX=-OX+1, MAXX=GW*CELL-OX-1, MINZ=-OZ+1, MAXZ=GH*CELL-OZ-1;
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
  // the paramotor rides on the hero, the wing banked into turns
  pm.position.set(FL.x,FL.y,FL.z); pm.rotation.set(0,hero.yaw,0); const bank=(K.a?1:0)-(K.d?1:0); wing.rotation.z+=((bank*.25)-wing.rotation.z)*Math.min(1,dt*3); wing.rotation.x=-.15-FL.vy*.03;
  prop.rotation.z+=dt*(30+FL.th*40); humSet(drop?0:FL.th);
  cam.dist+=((Math.max(FL.camD||8,15))-cam.dist)*Math.min(1,dt*2); }
{ const prev=heroUpdate; heroUpdate=function(dt){ prev.apply(this,arguments); if(FL.on) fly(dt); }; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt);
    prm.style.display=near()?'block':'none';
    if(FL.back){ FL.back.t+=dt; const k=Math.min(1,FL.back.t/3), s=k*k*(3-2*k); pm.position.set(FL.back.from.x+(PERCH.x-FL.back.from.x)*s,FL.back.from.y+(PERCH.y-FL.back.from.y)*s+Math.sin(k*Math.PI)*6,FL.back.from.z+(PERCH.z-FL.back.from.z)*s); prop.rotation.z+=dt*25; if(k>=1){ FL.back=null; park(); } }
    else if(!FL.on) prop.rotation.z+=dt*.4; }; }
window.__para={ info:()=>Object.assign({ on:FL.on, dropping:FL.dropping, back:!!FL.back, near:near(), x:+FL.x.toFixed(2), y:+FL.y.toFixed(2), z:+FL.z.toFixed(2), sp:+FL.sp.toFixed(2), perch:PERCH, towers:tops.length },cnt), launch, land:()=>{ if(FL.on) FL.dropping=true; },
  scan:(x0,x1,z0,z1,y)=>{ const out=[]; for(let z=z0;z<=z1;z++){ const row=[]; for(let x=x0;x<=x1;x++) row.push(Math.round(floorAt(cw(x),cwz(z),y==null?99:y))); out.push((z-((MAP.padN)|0))+': '+row.join(' ')); } return out; }, perch:()=>PERCH, keys, profile:(x0,x1,z,stp)=>{ const o=[]; let y=WALK; for(let x=x0;x<=x1+1e-6;x+=stp){ y=floorAt(x,z,y+.6); o.push(+y.toFixed(2)); } return o; }, solid:(x,z,y)=>solidAt(x,z,y,true) };
})();
