// ================= GAME STATE =================
const DEFS={
  harpoon:{name:'Harpoon Turret',ic:'🏹',du:4,mana:60,hp:90,top:1.6,range:22,cd:1.6,dmg:6},
  ball:{name:'Bowling Ball',ic:'🎳',du:5,mana:80,hp:90,top:1.5,range:17,cd:2.8,dmg:6},
  slice:{name:'Slice N Dice',ic:'🌀',du:6,mana:90,hp:130,top:1.7,range:2.6,cd:.45,dmg:2},
  spike:{name:'Spike Blockade',ic:'🪵',du:3,mana:40,hp:170,top:1.0,thorns:2}};
const DEFKEYS=['harpoon','ball','slice','spike'];
const MOBS={goblin:{hp:10,spd:3.4,dmg:3,cd:1.0,mana:1}, orc:{hp:45,spd:2.1,dmg:8,cd:1.4,mana:3}, archer:{hp:18,spd:2.8,dmg:3,cd:1.6,mana:2,ranged:11}, ogre:{hp:200,spd:1.5,dmg:20,cd:2.2,mana:8}};
const DU_CAP=40, SENS=0.0042;
const S={mana:260,du:0,crystal:100,wave:0,phase:'start',t:0,waveT:0,kills:0};
const hero={x:0,y:0,z:6,vy:0,yaw:PI,hp:100,max:100,swingT:-1,hitDone:false,dead:0,ph:0,moving:false,hurtT:0,grounded:true};
const H=makeHero(); scene.add(H.g); const heroShadow=blob(.5); scene.add(heroShadow);
const cam={yaw:PI,pitch:.42,dist:8,d:8,x:0,y:5,z:14};
const enemies=[], defs=[], projs=[], orbs=[], floats=[];
let spawnQ=[], placing=null, ghost=null, ghostRot=0, ghostCell=null, ghostOk=false, ghostReason='', ghostYaw=0;
let bannerT=0, toastT=0, dmgFlash=0, crystalShake=0, introA=0, locked=false, edgeX=.5, mouseDown=false;
const joy={x:0,y:0,id:null,ox:0,oy:0}; let lookId=null, lookX=0, lookY=0;

function angDiff(a,b){ let d=(b-a)%TAU; if(d>PI) d-=TAU; if(d<-PI) d+=TAU; return d; }
function angLerp(a,b,t){ return a+angDiff(a,b)*t; }
function easeOutBack(t){ const c=1.7; return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2); }
function solidAt(x,z,y,forHero){ const cx=wc(x),cz=wcz(z); const t=gat(cx,cz); if(forHero?heroSolid(t):!walk(t)) return true; const d=inb(cx,cz)?defAt[idx(cx,cz)]:null; if(d){ return forHero?y<d.top-.25:true; } return false; }
const ARC=[[1,0],[-1,0],[0,1],[0,-1],[.71,.71],[-.71,.71],[.71,-.71],[-.71,-.71]];
function moveCircle(e,dx,dz,r,forHero){ const y=e.y||0; let nx=e.x+dx, ok=true; for(const a of ARC){ if(solidAt(nx+a[0]*r,e.z+a[1]*r,y,forHero)){ ok=false; break; } } if(ok) e.x=nx;
  let nz=e.z+dz; ok=true; for(const a of ARC){ if(solidAt(e.x+a[0]*r,nz+a[1]*r,y,forHero)){ ok=false; break; } } if(ok) e.z=nz; }
function wallAt(x,z){ const t=gat(wc(x),wcz(z)); return t===T.WALL||t===T.PILLAR||t===T.CRYSTAL||t===T.PROP; }
function baseFloor(x,z){ return gat(wc(x),wcz(z))===T.DAIS?.5:0; }
function floorAt(x,z,y){ const cx=wc(x),cz=wcz(z); let f=baseFloor(x,z); const d=inb(cx,cz)?defAt[idx(cx,cz)]:null; if(d&&y>=d.top-.25) f=Math.max(f,d.top); return f; }
function floatText(x,y,z,txt,col){ floats.push({x,y,z,txt,col:col||'#fff',t:0}); }
function banner(t,sub){ $('banner').innerHTML=t+'<small>'+(sub||'')+'</small>'; $('banner').style.opacity=1; bannerT=3.4; }
function toast(t){ $('toast').textContent=t; $('toast').style.opacity=1; toastT=2.2; }
function flashDmg(){ dmgFlash=1; }

// ================= HERO =================
function heroUpdate(dt){
  if(hero.dead>0){ hero.dead-=dt; if(hero.dead<=0){ hero.dead=0; hero.hp=hero.max; hero.x=0; hero.z=6; hero.y=0; hero.vy=0; H.g.visible=true; heroShadow.visible=true; toast('Back on your feet!'); } return; }
  let mx=0,mz=0; if(K.w) mz+=1; if(K.s) mz-=1; if(K.d) mx+=1; if(K.a) mx-=1; if(TOUCH){ mx+=joy.x; mz+=joy.y; }
  const len=Math.hypot(mx,mz); hero.moving=len>.05;
  if(hero.moving){ mx/=Math.max(len,1); mz/=Math.max(len,1); const fx=Math.sin(cam.yaw), fz=Math.cos(cam.yaw), rx=-Math.cos(cam.yaw), rz=Math.sin(cam.yaw);
    const vx=fx*mz+rx*mx, vz=fz*mz+rz*mx; const spd=K.shift?8:5.5; moveCircle(hero,vx*spd*dt,vz*spd*dt,.42,true);
    hero.yaw=angLerp(hero.yaw,Math.atan2(vx,vz),1-Math.exp(-12*dt)); hero.ph+=dt*(K.shift?13:10); }
  const fl=floorAt(hero.x,hero.z,hero.y); hero.vy-=20*dt; hero.y+=hero.vy*dt; if(hero.y<=fl){ hero.y=fl; hero.vy=0; hero.grounded=true; } else hero.grounded=false;
  if(hero.swingT>=0){ hero.swingT+=dt; if(!hero.hitDone&&hero.swingT>.12){ hero.hitDone=true; hitCone(); } if(hero.swingT>.38) hero.swingT=-1; }
  hero.hurtT-=dt; if(hero.hurtT<0&&hero.hp<hero.max) hero.hp=Math.min(hero.max,hero.hp+3*dt);
  // animate
  const ph=hero.ph, walk=hero.moving?1:0; H.legL.rotation.x=Math.sin(ph)*.7*walk; H.legR.rotation.x=-Math.sin(ph)*.7*walk;
  if(hero.swingT>=0){ const p=hero.swingT/.38; H.armR.rotation.x=p<.3?lerp(-.4,-2.6,p/.3):lerp(-2.6,.5,(p-.3)/.7); } else H.armR.rotation.x=lerp(-.35,-Math.sin(ph)*.5*walk,.5);
  H.armL.rotation.x=Math.sin(ph)*.4*walk-.25; H.capeG.rotation.x=-.15-walk*.45-Math.sin(ph*.5)*.08*walk-(hero.grounded?0:.5);
  H.g.position.set(hero.x,hero.y+Math.abs(Math.sin(ph))*.05*walk,hero.z); H.g.rotation.y=hero.yaw; H.head.rotation.x=Math.sin(ph*.5)*.04*walk;
  heroShadow.position.set(hero.x,baseFloor(hero.x,hero.z)+.04,hero.z); heroShadow.scale.setScalar(clamp(1-(hero.y-baseFloor(hero.x,hero.z))*.3,.4,1));
}
function jump(){ if(hero.grounded&&hero.dead<=0&&S.phase!=='start'){ hero.vy=7.2; hero.grounded=false; } }
function swing(){ if(hero.swingT>=0||hero.dead>0||S.phase==='start'||S.phase==='dead') return; hero.swingT=0; hero.hitDone=false; SFX.swing(); if(!hero.moving) hero.yaw=cam.yaw; }
function hitCone(){ const fx=Math.sin(hero.yaw), fz=Math.cos(hero.yaw); let n=0; for(const e of enemies){ if(e.dead) continue; const dx=e.x-hero.x, dz=e.z-hero.z, d=Math.hypot(dx,dz); if(d<2.4+e.r&&(dx*fx+dz*fz)/Math.max(d,.01)>.4){ hurt(e,7,fx*1.4,fz*1.4); n++; } } if(n) SFX.hit(); }
function hurtHero(dmg){ if(hero.dead>0) return; hero.hp-=dmg; hero.hurtT=3; flashDmg(); SFX.hurt(); if(hero.hp<=0){ hero.hp=0; hero.dead=4; toast('You fell! Back in 4 seconds…'); H.g.visible=false; heroShadow.visible=false; } }
function hurtCrystal(dmg){ if(S.phase==='dead') return; S.crystal-=dmg; flashDmg(); SFX.crystal(); crystalShake=.4; if(S.crystal<=0){ S.crystal=0; S.phase='dead'; $('deadwave').textContent=S.wave; $('dead').classList.remove('hide'); if(document.exitPointerLock) document.exitPointerLock(); document.body.classList.remove('play'); } }

// ================= CAMERA =================
function updateCamera(dt){
  if(S.phase==='start'){ introA+=dt*.1; camera.position.set(Math.sin(introA)*15,6.5,Math.cos(introA)*15); camera.lookAt(0,2.6,0); return; }
  const tx=hero.x, ty=hero.y+1.5, tz=hero.z;
  const cp=Math.cos(cam.pitch), fx=Math.sin(cam.yaw)*cp, fz=Math.cos(cam.yaw)*cp, fy=Math.sin(cam.pitch);
  let d=cam.dist; for(let s=.5;s<cam.dist;s+=.25){ const px=tx-fx*s, py=ty+fy*s, pz=tz-fz*s; if(py>WALLH-.35){ d=s-.3; break; } const g=gat(wc(px),wcz(pz)); if(g===T.WALL||g===T.PILLAR||g===T.PROP){ d=s-.5; break; } }
  d=Math.max(d,1.0); cam.d=dt>0?(d<cam.d?d:lerp(cam.d,d,1-Math.exp(-6*dt))):d;
  const dx=tx-fx*cam.d, dy=ty+fy*cam.d, dz=tz-fz*cam.d; const k=dt>0?1-Math.exp(-16*dt):1;
  cam.x=lerp(cam.x,dx,k); cam.y=lerp(cam.y,dy,k); cam.z=lerp(cam.z,dz,k);
  camera.position.set(cam.x,Math.max(cam.y,.4),cam.z); camera.lookAt(tx,ty,tz);
}

// ================= ENEMIES =================
function spawnEnemy(kind,lane){ const L=LANES[lane]||LANES.N; const m=makeGoblin(kind); const cfg=MOBS[kind]; const hpm=1+.15*Math.max(0,S.wave-1);
  const e={kind,x:cw(L.cx)+R(-.6,.6),y:0,z:cwz(L.cz)+R(-.6,.6),hp:Math.round(cfg.hp*hpm),max:Math.round(cfg.hp*hpm),spd:cfg.spd*R(.9,1.1),dmg:cfg.dmg,cd:cfg.cd,atk:R(0,.5),r:m.r,h:m.h,mdl:m,sc:m.g.scale.x,ph:rnd()*6,yaw:L.face,dead:0,mana:cfg.mana,ranged:cfg.ranged||0,pop:0,squash:0,swing:-1,walking:false,sx:0,sz:0};
  m.g.position.set(e.x,0,e.z); m.g.rotation.y=e.yaw; scene.add(m.g); enemies.push(e); const p=portals.find(p=>p.k===lane); if(p) p.pulse=1; return e; }
function hurt(e,dmg,kx,kz){ if(e.dead) return; e.hp-=dmg; e.squash=1; floatText(e.x,e.y+e.h+.4,e.z,String(dmg),'#ffd060'); if(kx||kz) moveCircle(e,kx*.5,kz*.5,e.r*.8,false); if(e.hp<=0) kill(e); }
function kill(e){ e.dead=.001; S.kills++; spawnOrbs(e.x,e.z,e.mana); }
function attack(e,tg){ e.swing=0;
  if(tg.kind==='hero') hurtHero(e.dmg);
  else if(tg.kind==='crystal'){ if(tg.ranged) fireArrow(e,0,2.6,0,{kind:'crystal'}); else hurtCrystal(e.dmg); }
  else if(tg.kind==='def'){ const d=tg.obj; if(tg.ranged) fireArrow(e,d.x,1.0,d.z,{kind:'def',obj:d}); else { hurtDef(d,e.dmg); if(d.kind==='spike') hurt(e,DEFS.spike.thorns,0,0); } } }
function updateEnemies(dt){
  const alive=enemies.filter(e=>!e.dead);
  for(const a of alive){ a.sx=0; a.sz=0; }
  for(let i=0;i<alive.length;i++) for(let j=i+1;j<alive.length;j++){ const a=alive[i], b=alive[j]; const dx=b.x-a.x, dz=b.z-a.z, d=Math.hypot(dx,dz), min=(a.r+b.r)*.9; if(d<min&&d>.001){ const p=(min-d)/min*3; a.sx-=dx/d*p; a.sz-=dz/d*p; b.sx+=dx/d*p; b.sz+=dz/d*p; } }
  for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; const g=e.mdl.g;
    if(e.dead){ e.dead+=dt; const s=Math.max(0,1-e.dead/.3)*e.sc; g.scale.set(s*1.3,s*.6,s*1.3); if(e.dead>.3){ scene.remove(g); enemies.splice(i,1); } continue; }
    e.pop=Math.min(1,e.pop+dt*3); e.atk-=dt; if(e.swing>=0){ e.swing+=dt; if(e.swing>.4) e.swing=-1; }
    let target=null; const hd=Math.hypot(hero.x-e.x,hero.z-e.z);
    if(hero.dead<=0&&hd<e.r+1.1&&hero.y-e.y<1.4) target={kind:'hero',x:hero.x,z:hero.z,reach:e.r+1.3};
    else { const ci=idx(wc(e.x),wcz(e.z)); let n=flowDef.nxt[ci]; const cr={kind:'crystal',x:0,z:0,reach:2.9+e.r};
      if(ci===GOAL||n===GOAL) target=cr; else if(n>=0) target={kind:'move',x:cw(n%GW),z:cwz((n/GW)|0)};
      else { n=flowFree.nxt[ci]; if(n===GOAL) target=cr; else if(n>=0){ const d=defAt[n]; target=d?{kind:'def',obj:d,x:d.x,z:d.z,reach:1.35+e.r}:{kind:'move',x:cw(n%GW),z:cwz((n/GW)|0)}; } } }
    if(e.ranged&&target&&target.kind!=='hero'){ let best=null, bd=e.ranged; for(const d of defs){ if(d.kind==="spike"||d.kind==="slice") continue; const dd=Math.hypot(d.x-e.x,d.z-e.z); if(dd<bd&&los(e.x,e.z,d.x,d.z)){ bd=dd; best={kind:"def",obj:d,x:d.x,z:d.z}; } } const cd=Math.hypot(e.x,e.z); if(cd<e.ranged&&los(e.x,e.z,0,0)) best={kind:'crystal',x:0,z:0}; if(best){ best.reach=e.ranged-1; best.ranged=true; target=best; } }
    e.walking=false;
    if(target){ const dx=target.x-e.x, dz=target.z-e.z, d=Math.hypot(dx,dz)||.001; const ty=Math.atan2(dx,dz);
      if(target.kind==='move'||d>target.reach){ moveCircle(e,(dx/d*e.spd+e.sx)*dt,(dz/d*e.spd+e.sz)*dt,e.r*.8,false); e.ph+=dt*9; e.yaw=angLerp(e.yaw,ty,1-Math.exp(-10*dt)); e.walking=true; }
      else { e.yaw=angLerp(e.yaw,ty,1-Math.exp(-10*dt)); if(e.atk<=0){ e.atk=e.cd; attack(e,target); } } }
    e.y=baseFloor(e.x,e.z); e.squash=Math.max(0,e.squash-dt*7);
    const sc=e.sc*(e.pop<1?easeOutBack(e.pop):1), sq=e.squash; g.scale.set(sc*(1+sq*.25),sc*(1-sq*.35),sc*(1+sq*.25));
    g.position.set(e.x,e.y,e.z); g.rotation.y=e.yaw; const w=e.walking?1:0; const m=e.mdl;
    m.legs[0].rotation.x=Math.sin(e.ph)*.8*w; m.legs[1].rotation.x=-Math.sin(e.ph)*.8*w; m.arms[0].rotation.x=-Math.sin(e.ph)*.6*w;
    m.arms[1].rotation.x=e.swing>=0?(e.swing<.15?lerp(-.3,-2.4,e.swing/.15):lerp(-2.4,.6,(e.swing-.15)/.25)):Math.sin(e.ph)*.6*w;
    m.head.rotation.z=Math.sin(e.ph*.5)*.06*w; g.position.y+=Math.abs(Math.sin(e.ph))*.06*w*e.sc; }
}

// ================= DEFENSES =================
function placeDef(kind,cx,cz,rot){ const cfg=DEFS[kind]; const base=gat(cx,cz)===T.DAIS?.5:0;
  const d={kind,cx,cz,x:cw(cx),z:cwz(cz),base,rot:rot||0,hp:cfg.hp,max:cfg.hp,top:cfg.top+base,cd:R(.2,cfg.cd),yaw:rot||0,mdl:makeDef(kind,false),pop:0,recoil:0,spin:0,shake:0,lvl:1,spent:cfg.mana};
  d.mdl.position.set(d.x,base,d.z); d.mdl.rotation.y=d.rot; scene.add(d.mdl); defs.push(d); defAt[idx(cx,cz)]=d; S.du+=cfg.du; S.mana-=cfg.mana; reflow(); SFX.place(); return d; }
function removeDef(d){ scene.remove(d.mdl); defAt[idx(d.cx,d.cz)]=null; const i=defs.indexOf(d); if(i>=0) defs.splice(i,1); S.du-=DEFS[d.kind].du; reflow(); }
function hurtDef(d,dmg){ d.hp-=dmg; d.shake=.25; floatText(d.x,d.top+.6,d.z,String(dmg),'#ff6a5a'); if(d.hp<=0){ removeDef(d); SFX.destroy(); toast(DEFS[d.kind].name+' destroyed!'); } }
function fire(d,e){ const cfg=DEFS[d.kind]; const fx=Math.sin(d.yaw), fz=Math.cos(d.yaw); d.recoil=1;
  if(d.kind==='harpoon'){ const m=harpoonMesh(); m.rotation.y=d.yaw; scene.add(m); projs.push({kind:'harpoon',x:d.x+fx*.9,y:d.base+1.35,z:d.z+fz*.9,fx,fz,spd:26,life:stat(d,'range')/26,hit:new Set(),dmg:stat(d,'dmg'),mesh:m}); SFX.harpoon(); }
  else { const m=ballMesh(); scene.add(m); const dx=e.x-d.x, dz=e.z-d.z, dd=Math.hypot(dx,dz)||1; projs.push({kind:'ball',x:d.x+fx*1.1,y:d.base+1.6,z:d.z+fz*1.1,vx:dx/dd*10,vz:dz/dd*10,vy:1.5,life:3.4,dmg:stat(d,'dmg'),mesh:m,hitT:new Map()}); SFX.ball(); } }
function stat(d,k){ const cfg=DEFS[d.kind], l=d.lvl||1; if(k==='dmg') return Math.round(cfg.dmg*(1+.5*(l-1))); if(k==='cd') return cfg.cd*Math.pow(.8,l-1); if(k==='range') return (cfg.range||0)+2*(l-1); return cfg[k]; }
function upCost(d){ return 100*(d.lvl||1); }
function upgrade(){ const d=nearestDef(3.4); if(!d) return; if(d.hp<d.max){ repair(); return; } if(d.lvl>=3){ toast('Already Mark III — that is as good as it gets'); return; } const cost=upCost(d); if(S.mana<cost){ toast('Need '+cost+' mana to upgrade'); return; }
  S.mana-=cost; d.spent+=cost; d.lvl++; d.max=Math.round(DEFS[d.kind].hp*(1+.4*(d.lvl-1))); d.hp=d.max; d.pop=0; const ring=M(new THREE.TorusGeometry(d.kind==='spike'?1.1:.98,.045,6,18),mat(d.lvl===3?0xd8322c:0xe0b040),0,.16+.12*(d.lvl-2),0); ring.rotation.x=PI/2; d.mdl.add(ring); SFX.place(); floatText(d.x,d.top+.9,d.z,d.lvl===2?'MARK II':'MARK III','#e8b94a'); }
function fireArrow(e,x,y,z,hit){ const m=arrowMesh(); scene.add(m); const x0=e.x, y0=e.y+1.2*e.sc, z0=e.z; const dur=Math.hypot(x-x0,z-z0)/18; projs.push({kind:'arrow',x0,y0,z0,x1:x,y1:y,z1:z,t:0,dur:Math.max(.2,dur),dmg:e.dmg,hit,mesh:m}); }
function updateDefs(dt){
  for(const d of defs){ const cfg=DEFS[d.kind]; d.pop=Math.min(1,d.pop+dt*4); const s=(d.pop<1?easeOutBack(d.pop):1)*(1+.12*(d.lvl-1)); d.mdl.scale.set(s,s,s); d.cd-=dt; d.shake=Math.max(0,d.shake-dt); d.recoil=Math.max(0,d.recoil-dt*4);
    d.mdl.position.set(d.x+(d.shake>0?(rnd()-.5)*.12:0),d.base,d.z+(d.shake>0?(rnd()-.5)*.12:0));
    if(d.kind==='harpoon'||d.kind==='ball'){ let best=null, bd=stat(d,'range'); for(const e of enemies){ if(e.dead) continue; const dd=Math.hypot(e.x-d.x,e.z-d.z); if(dd<bd&&los(d.x,d.z,e.x,e.z)){ bd=dd; best=e; } }
      if(best){ const ty=Math.atan2(best.x-d.x,best.z-d.z); d.yaw=angLerp(d.yaw,ty,1-Math.exp(-7*dt)); if(d.cd<=0&&Math.abs(angDiff(d.yaw,ty))<.25){ d.cd=stat(d,'cd'); fire(d,best); } }
      const y=d.mdl.userData.yoke; y.rotation.y=d.yaw-d.rot; y.position.z=-d.recoil*.22;
      if(d.kind==='harpoon') d.mdl.userData.hp.visible=d.cd<cfg.cd*.45; else d.mdl.userData.ball.visible=d.cd<cfg.cd*.5; }
    else if(d.kind==='slice'){ let near=[]; for(const e of enemies){ if(!e.dead&&Math.hypot(e.x-d.x,e.z-d.z)<cfg.range+e.r*.5) near.push(e); } d.spin=lerp(d.spin,near.length?24:2.5,1-Math.exp(-3*dt)); d.mdl.userData.hub.rotation.y+=d.spin*dt;
      if(near.length&&d.cd<=0){ d.cd=stat(d,'cd'); for(const e of near){ const dx=e.x-d.x, dz=e.z-d.z, l=Math.hypot(dx,dz)||1; hurt(e,stat(d,'dmg'),dx/l*.4,dz/l*.4); } SFX.hit(); } } }
}
function updateProj(dt){
  for(let i=projs.length-1;i>=0;i--){ const p=projs[i]; let dead=false;
    if(p.kind==='harpoon'){ p.life-=dt; dead=p.life<=0; const nx=p.x+p.fx*p.spd*dt, nz=p.z+p.fz*p.spd*dt; const g=gat(wc(nx),wcz(nz)); if(g===T.WALL||g===T.PILLAR) dead=true; p.x=nx; p.z=nz;
      for(const e of enemies){ if(e.dead||p.hit.has(e)) continue; if(Math.hypot(e.x-p.x,e.z-p.z)<e.r+.5){ p.hit.add(e); hurt(e,p.dmg,p.fx*.9,p.fz*.9); SFX.hit(); } } p.mesh.position.set(p.x,p.y,p.z); }
    else if(p.kind==='ball'){ p.life-=dt; dead=p.life<=0; const nx=p.x+p.vx*dt; if(wallAt(nx+Math.sign(p.vx)*.42,p.z)){ p.vx=-p.vx*.92; SFX.thud(); } else p.x=nx; const nz=p.z+p.vz*dt; if(wallAt(p.x,nz+Math.sign(p.vz)*.42)){ p.vz=-p.vz*.92; SFX.thud(); } else p.z=nz;
      const fl=baseFloor(p.x,p.z)+.42; p.vy-=18*dt; p.y+=p.vy*dt; if(p.y<fl){ p.y=fl; p.vy=-p.vy*.3; }
      for(const e of enemies){ if(e.dead) continue; const t=p.hitT.get(e)||-9; if(S.t-t>.5&&Math.hypot(e.x-p.x,e.z-p.z)<e.r+.45){ p.hitT.set(e,S.t); hurt(e,p.dmg,p.vx*.16,p.vz*.16); SFX.hit(); } }
      const sp=Math.hypot(p.vx,p.vz); if(sp>.1){ p.mesh.userData.m.rotateOnWorldAxis(new THREE.Vector3(p.vz/sp,0,-p.vx/sp),sp*dt/.42); } p.mesh.position.set(p.x,p.y,p.z); }
    else { p.t+=dt/p.dur; const t=Math.min(1,p.t); const x=lerp(p.x0,p.x1,t), z=lerp(p.z0,p.z1,t), y=lerp(p.y0,p.y1,t)+Math.sin(t*PI)*1.4; p.mesh.position.set(x,y,z); const t2=Math.min(1,t+.05); p.mesh.lookAt(lerp(p.x0,p.x1,t2),lerp(p.y0,p.y1,t2)+Math.sin(t2*PI)*1.4,lerp(p.z0,p.z1,t2));
      if(p.t>=1){ dead=true; if(p.hit.kind==='crystal') hurtCrystal(p.dmg); else if(p.hit.obj&&defs.includes(p.hit.obj)) hurtDef(p.hit.obj,p.dmg); } }
    if(dead){ scene.remove(p.mesh); projs.splice(i,1); } }
}
function spawnOrbs(x,z,n){ for(let k=0;k<n;k++){ const a=rnd()*TAU; const o={x,y:.8,z,vx:Math.cos(a)*2.5,vy:4+rnd()*2.5,vz:Math.sin(a)*2.5,mesh:orbMesh(),t:0}; o.mesh.position.set(x,.8,z); scene.add(o.mesh); orbs.push(o); } }
function updateOrbs(dt){
  for(let i=orbs.length-1;i>=0;i--){ const o=orbs[i]; o.t+=dt; const hd=Math.hypot(hero.x-o.x,hero.z-o.z);
    if(hero.dead<=0&&hd<3.6){ const tx=hero.x, ty=hero.y+1, tz=hero.z; const dx=tx-o.x, dy=ty-o.y, dz=tz-o.z, d=Math.hypot(dx,dy,dz); if(d<.7){ S.mana+=5; SFX.mana(); floatText(o.x,o.y+.4,o.z,'+5','#5ee9ff'); scene.remove(o.mesh); orbs.splice(i,1); continue; } const sp=11*dt/d; o.x+=dx*sp; o.y+=dy*sp; o.z+=dz*sp; }
    else { o.vy-=14*dt; const nx=o.x+o.vx*dt, nz=o.z+o.vz*dt; if(!solidAt(nx,nz,0,true)){ o.x=nx; o.z=nz; } else { o.vx=-o.vx*.5; o.vz=-o.vz*.5; } o.y+=o.vy*dt; const fl=baseFloor(o.x,o.z)+.3; if(o.y<fl){ o.y=fl; o.vy=-o.vy*.4; o.vx*=.7; o.vz*=.7; } }
    o.mesh.position.set(o.x,o.y+Math.sin(o.t*4)*.05,o.z); o.mesh.userData.o.rotation.y+=dt*3; }
}

// ================= WAVES =================
function waveComp(w){ const lanes=w<3?['N']:w<5?['N','W']:['N','W','E']; const q=[]; let t=1.5; const n=5+2*w; for(let i=0;i<n;i++){ q.push({t,kind:'goblin',lane:lanes[i%lanes.length]}); t+=.8; }
  const orcs=w>=3?w-2:0; for(let i=0;i<orcs;i++) q.push({t:3+i*2.5,kind:'orc',lane:lanes[(i+1)%lanes.length]});
  const arch=w>=4?Math.floor(w/2):0; for(let i=0;i<arch;i++) q.push({t:4+i*2,kind:'archer',lane:lanes[i%lanes.length]});
  if(w%5===0) q.push({t:t+2,kind:'ogre',lane:'N'});
  q.sort((a,b)=>a.t-b.t);
  const parts=['Goblins ×'+n]; if(orcs) parts.push('Orcs ×'+orcs); if(arch) parts.push('Dark Elf Archers ×'+arch); if(w%5===0) parts.push('AN OGRE');
  const gates=lanes.map(l=>({N:'North',W:'West',E:'East'})[l]).join(' + ')+' gate'+(lanes.length>1?'s':'');
  return {q,desc:parts.join(' · ')+'  —  '+gates}; }
function startWave(){ if(S.phase!=='build') return; S.wave++; S.phase='wave'; S.waveT=0; const c=waveComp(S.wave); spawnQ=c.q; banner('WAVE '+S.wave,c.desc); SFX.horn(); cancelPlace(); }
function updateWave(dt){ if(S.phase!=='wave') return; S.waveT+=dt; while(spawnQ.length&&spawnQ[0].t<=S.waveT){ const s=spawnQ.shift(); spawnEnemy(s.kind,s.lane); }
  if(!spawnQ.length&&!enemies.some(e=>!e.dead)){ S.phase='build'; const bonus=50+10*S.wave; S.mana+=bonus; banner('HALL HELD','wave '+S.wave+' repelled  ·  +'+bonus+' mana'); SFX.held(); } }

// ================= PLACEMENT / REPAIR / SELL =================
function select(kind){ if(S.phase==='start'||S.phase==='dead') return; if(placing===kind){ cancelPlace(); return; } cancelPlace(); placing=kind; ghost=makeDef(kind,true); scene.add(ghost); ghostRot=0; updateGhost(); }
function cancelPlace(){ if(ghost){ scene.remove(ghost); ghost=null; } placing=null; }
function updateGhost(){ if(!placing) return; const fx=Math.sin(cam.yaw), fz=Math.cos(cam.yaw); const cx=wc(hero.x+fx*3.2), cz=wcz(hero.z+fz*3.2); const t=gat(cx,cz), cfg=DEFS[placing]; let reason='';
  if(!(t===T.FLOOR||t===T.CARPET)) reason="Can't build there"; else if(defAt[idx(cx,cz)]) reason='Already occupied'; else if(cx===wc(hero.x)&&cz===wcz(hero.z)) reason="You're standing there"; else if(S.du+cfg.du>DU_CAP) reason='Not enough Defense Units'; else if(S.mana<cfg.mana) reason='Not enough mana'; else if(enemies.some(e=>!e.dead&&Math.hypot(e.x-cw(cx),e.z-cwz(cz))<2.2)) reason='Enemy too close';
  ghostOk=!reason; ghostReason=reason; ghostCell=[cx,cz]; ghostYaw=Math.round(cam.yaw/(PI/4))*(PI/4)+ghostRot*PI/4;
  ghost.position.set(cw(cx),t===T.DAIS?.5:0,cwz(cz)); ghost.rotation.y=ghostYaw; const m=ghostOk?GHOST_OK:GHOST_BAD; ghost.traverse(o=>{ if(o.isMesh) o.material=m; }); }
function confirmPlace(){ if(!placing) return; if(!ghostOk){ toast(ghostReason); return; } placeDef(placing,ghostCell[0],ghostCell[1],ghostYaw); floatText(cw(ghostCell[0]),2.2,cwz(ghostCell[1]),DEFS[placing].name,'#e8b94a'); cancelPlace(); }
function nearestDef(rad){ let best=null, bd=rad; for(const d of defs){ const dd=Math.hypot(d.x-hero.x,d.z-hero.z); if(dd<bd){ bd=dd; best=d; } } return best; }
function repair(){ const d=nearestDef(3.4); if(!d) return; if(d.hp>=d.max){ toast('Already at full health'); return; } const cost=Math.ceil((d.max-d.hp)/8); if(S.mana<cost){ toast('Need '+cost+' mana to repair'); return; } S.mana-=cost; d.hp=d.max; SFX.place(); floatText(d.x,d.top+.8,d.z,'REPAIRED','#5ee9ff'); }
function sell(){ const d=nearestDef(3.4); if(!d) return; const back=Math.round(d.spent*.7); S.mana+=back; removeDef(d); SFX.sell(); floatText(d.x,2,d.z,'+'+back+' mana','#5ee9ff'); }

// ================= FX / HUD / OVERLAY =================
function updateFx(dt){ S.t+=dt; const t=S.t;
  flames.forEach((f,i)=>{ const s=1+Math.sin(t*13+f.p)*.18+Math.sin(t*7.3+f.p*2)*.1; f.f.scale.set(1,s,1); f.f2.scale.set(1,1.1-(s-1),1); });
  torchLights.forEach((l,i)=>{ l.intensity=l.userData.base*(.92+Math.sin(t*9+i*1.7)*.05+Math.sin(t*23+i)*.04); });
  const cg=crystalG.userData.cg; cg.rotation.y=t*.7; cg.position.y=3.2+Math.sin(t*1.6)*.15+(crystalShake>0?(rnd()-.5)*.3:0); crystalShake=Math.max(0,crystalShake-dt);
  for(let k=0;k<4;k++){ const s=crystalG.userData['s'+k]; const a=s.userData.a+t*1.4; s.position.set(Math.cos(a)*1.7,Math.sin(t*2+k)*.5,Math.sin(a)*1.7); s.rotation.y=t*3; }
  crystalMesh.material.emissiveIntensity=S.phase==="dead"?.1:.55+Math.sin(t*3)*.15+(crystalShake>0?.6:0);
  portals.forEach(p=>{ p.ring.rotation.z=t*1.2; p.pulse=Math.max(0,(p.pulse||0)-dt*2); const s=1+p.pulse*.35; p.ring.scale.set(s,s,1); p.disc.material.opacity=.85+Math.sin(t*4)*.08; });
  bannerT-=dt; if(bannerT<0&&bannerT>-1){ $('banner').style.opacity=0; bannerT=-2; } toastT-=dt; if(toastT<0&&toastT>-1){ $('toast').style.opacity=0; toastT=-2; }
  dmgFlash=Math.max(0,dmgFlash-dt*2.5); $('dmg').style.opacity=dmgFlash;
  for(let i=floats.length-1;i>=0;i--){ const f=floats[i]; f.t+=dt; if(f.t>1.1) floats.splice(i,1); }
}
const hud={}; function setT(id,v){ if(hud[id]!==v){ hud[id]=v; $(id).textContent=v; } }
function updateHUD(){ const cw_=Math.max(0,S.crystal)+'%'; if(hud.cbar!==cw_){ hud.cbar=cw_; $('cbar').style.width=cw_; } const hw=(hero.hp/hero.max*100)+'%'; if(hud.hbar!==hw){ hud.hbar=hw; $('hbar').style.width=hw; }
  setT('mana',S.mana); setT('du',S.du+'/'+DU_CAP);
  const alive=enemies.filter(e=>!e.dead).length+spawnQ.length;
  if(S.phase==='wave'){ setT('wavet','WAVE '+S.wave); setT('phaset',alive+' enem'+(alive===1?'y':'ies')+' left'); } else if(S.phase==='build'){ setT('wavet',S.wave?'HALL HELD — BUILD PHASE':'BUILD PHASE'); setT('phaset',TOUCH?'Place defenses, then tap 📯':'Place defenses (1–4), then press G to sound the horn'); }
  DEFKEYS.forEach(k=>{ const el=$('slot-'+k), cfg=DEFS[k]; const cls='slot'+(placing===k?' sel':'')+((S.mana<cfg.mana||S.du+cfg.du>DU_CAP)?' poor':''); if(el.className!==cls) el.className=cls; });
  let pr=''; if(placing){ pr=ghostOk?(TOUCH?'Tap ✔ to place · ↻ rotate':'Click to place  ·  R rotate  ·  Esc cancel'):ghostReason; } else { const d=nearestDef(3.4); if(d){ const cost=Math.ceil((d.max-d.hp)/8); pr=DEFS[d.kind].name+(d.lvl>1?' Mk '+['','','II','III'][d.lvl]:'')+'  '+Math.ceil(d.hp)+'/'+d.max+(cost?'  ·  E repair ('+cost+' mana)':(d.lvl<3?'  ·  E upgrade ('+upCost(d)+' mana)':''))+'  ·  X sell (+'+Math.round(d.spent*.7)+')'; } }
  setT('prompt',pr); const wb=S.phase!=='build'; if(hud.wb!==wb){ hud.wb=wb; $('wavebtn').disabled=wb; }
}
const PV=new THREE.Vector3();
function proj(x,y,z){ PV.set(x,y,z).project(camera); if(PV.z>1) return null; return [(PV.x+1)/2*ov.width,(1-PV.y)/2*ov.height]; }
function drawOverlay(){ ovx.clearRect(0,0,ov.width,ov.height); if(S.phase==='start') return;
  const bar=(p,w,frac,col)=>{ ovx.fillStyle='#120c1a'; ovx.fillRect(p[0]-w/2-1,p[1]-4,w+2,7); ovx.fillStyle=col; ovx.fillRect(p[0]-w/2,p[1]-3,w*clamp(frac,0,1),5); };
  for(const e of enemies){ if(e.dead||e.hp>=e.max) continue; const p=proj(e.x,e.y+e.h+.35,e.z); if(p) bar(p,e.kind==='ogre'?80:40,e.hp/e.max,'#e03a3a'); }
  for(const d of defs){ if(d.hp>=d.max) continue; const p=proj(d.x,d.top+.5,d.z); if(p) bar(p,44,d.hp/d.max,'#5ad05a'); }
  ovx.font='bold 17px Georgia,serif'; ovx.textAlign='center'; ovx.lineWidth=3; ovx.strokeStyle='#120c1a';
  for(const f of floats){ const p=proj(f.x,f.y+f.t*1.2,f.z); if(!p) continue; ovx.globalAlpha=clamp(1.4-f.t,0,1); ovx.fillStyle=f.col; ovx.strokeText(f.txt,p[0],p[1]); ovx.fillText(f.txt,p[0],p[1]); } ovx.globalAlpha=1;
}

// ================= INPUT =================
const K={};
addEventListener('keydown',e=>{ const c=e.code; if(S.phase==='start'){ if(c==='Enter'||c==='Space') play(); return; }
  if(c==='KeyW'||c==='ArrowUp') K.w=1; if(c==='KeyS'||c==='ArrowDown') K.s=1; if(c==='KeyA') K.a=1; if(c==='KeyD') K.d=1; if(c==='ShiftLeft'||c==='ShiftRight') K.shift=1; if(c==='ArrowLeft') K.tl=1; if(c==='ArrowRight') K.tr=1;
  if(c==='Space'){ jump(); e.preventDefault(); }
  if(c==='Digit1') select('harpoon'); if(c==='Digit2') select('ball'); if(c==='Digit3') select('slice'); if(c==='Digit4') select('spike');
  if(c==='KeyR'){ ghostRot=(ghostRot+1)%8; } if(c==='Escape') cancelPlace(); if(c==='KeyG') startWave(); if(c==='KeyE') upgrade(); if(c==='KeyX') sell(); if(c==='KeyM') setSound(soundOff); if(c==='KeyF'||c==='KeyQ') swing(); });
addEventListener('keyup',e=>{ const c=e.code; if(c==='KeyW'||c==='ArrowUp') K.w=0; if(c==='KeyS'||c==='ArrowDown') K.s=0; if(c==='KeyA') K.a=0; if(c==='KeyD') K.d=0; if(c==='ShiftLeft'||c==='ShiftRight') K.shift=0; if(c==='ArrowLeft') K.tl=0; if(c==='ArrowRight') K.tr=0; });
addEventListener('blur',()=>{ for(const k in K) K[k]=0; });
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('mousedown',e=>{ if(TOUCH||S.phase==='start'||S.phase==='dead') return; mouseDown=true; if(!locked&&canvas.requestPointerLock) canvas.requestPointerLock();
  if(e.button===0){ if(placing) confirmPlace(); else swing(); } else if(e.button===2){ if(placing) cancelPlace(); else swing(); } });
addEventListener('mouseup',()=>{ mouseDown=false; });
addEventListener('mousemove',e=>{ if(TOUCH||S.phase==='start') return; edgeX=e.clientX/innerWidth; const dx=e.movementX||0, dy=e.movementY||0; cam.yaw-=dx*SENS; cam.pitch=clamp(cam.pitch+dy*SENS,.1,1.15); });
addEventListener('wheel',e=>{ if(S.phase==='start') return; const s=Math.sign(e.deltaY); if(placing) ghostRot=(ghostRot+s+8)%8; else cam.dist=clamp(cam.dist+s*.8,4,12); },{passive:true});
document.addEventListener('pointerlockchange',()=>{ locked=document.pointerLockElement===canvas; document.body.classList.toggle('play',locked); });
// touch: left half joystick, right half look
canvas.addEventListener('touchstart',e=>{ for(const t of e.changedTouches){ if(t.clientX<innerWidth/2&&joy.id===null){ joy.id=t.identifier; joy.ox=t.clientX; joy.oy=t.clientY; } else if(lookId===null){ lookId=t.identifier; lookX=t.clientX; lookY=t.clientY; } } e.preventDefault(); },{passive:false});
canvas.addEventListener('touchmove',e=>{ for(const t of e.changedTouches){ if(t.identifier===joy.id){ let dx=t.clientX-joy.ox, dy=t.clientY-joy.oy; const l=Math.hypot(dx,dy); if(l>50){ dx*=50/l; dy*=50/l; } joy.x=dx/50; joy.y=-dy/50; $('joy').firstElementChild.style.transform='translate('+dx+'px,'+dy+'px)'; }
  else if(t.identifier===lookId){ cam.yaw-=(t.clientX-lookX)*.007; cam.pitch=clamp(cam.pitch+(t.clientY-lookY)*.007,.1,1.15); lookX=t.clientX; lookY=t.clientY; } } e.preventDefault(); },{passive:false});
const touchEnd=e=>{ for(const t of e.changedTouches){ if(t.identifier===joy.id){ joy.id=null; joy.x=joy.y=0; $('joy').firstElementChild.style.transform=''; } if(t.identifier===lookId) lookId=null; } };
canvas.addEventListener('touchend',touchEnd); canvas.addEventListener('touchcancel',touchEnd);
DEFKEYS.forEach((k,i)=>{ const cfg=DEFS[k]; const s=document.createElement('div'); s.className='slot'; s.id='slot-'+k; s.innerHTML='<div class="k">'+(i+1)+'</div><div class="ic">'+cfg.ic+'</div><div class="n">'+cfg.name+'</div><div class="cst">'+cfg.du+' DU · '+cfg.mana+' ◆</div>'; s.addEventListener('click',()=>select(k)); $('hotbar').appendChild(s); });
if(TOUCH){ [['⚔',swing],['⤴',jump],['✔',()=>{ if(placing) confirmPlace(); }],['↻',()=>{ ghostRot=(ghostRot+1)%8; }],['🔧',upgrade]].forEach(([t,f])=>{ const b=document.createElement('div'); b.className='hb'; b.textContent=t; b.addEventListener('touchstart',e=>{ e.preventDefault(); f(); },{passive:false}); $('btns').appendChild(b); }); }
$('wavebtn').addEventListener('click',()=>{ startWave(); if(!TOUCH&&canvas.requestPointerLock) canvas.requestPointerLock(); });
function play(){ if(S.phase!=='start') return; S.phase='build'; $('start').classList.add('hide'); if(!TOUCH&&canvas.requestPointerLock) canvas.requestPointerLock(); cam.x=hero.x; cam.y=hero.y+5; cam.z=hero.z+8; cam.d=cam.dist; toast('Build phase — pick a defense with 1–4, then G to start the wave'); }
$('playbtn').addEventListener('click',play);

// ================= MAIN LOOP =================
function update(dt){ if(S.phase==='start'){ updateFx(dt); updateCamera(dt); return; }
  if(S.phase!=='dead'){ if(!TOUCH&&!locked&&S.phase!=='start'){ if(edgeX<.1) cam.yaw+=1.6*dt; else if(edgeX>.9) cam.yaw-=1.6*dt; } if(K.tl) cam.yaw+=2.2*dt; if(K.tr) cam.yaw-=2.2*dt;
    heroUpdate(dt); updateDefs(dt); updateEnemies(dt); updateProj(dt); updateOrbs(dt); updateWave(dt); updateGhost(); }
  updateFx(dt); updateCamera(dt); updateHUD(); }
let lastT=performance.now();
function frame(now){ requestAnimationFrame(frame); const dt=Math.min(.05,(now-lastT)/1000); lastT=now; update(dt); renderer.render(scene,camera); drawOverlay(); }
requestAnimationFrame(frame);

// ================= TEST HOOK =================
window.__dd={S,hero,cam,enemies,defs,projs,orbs,grid,DEFS,MOBS,
  start:()=>{ if(S.phase==='start'){ S.phase='build'; $('start').classList.add('hide'); cam.x=hero.x; cam.y=hero.y+5; cam.z=hero.z+8; cam.d=cam.dist; } },
  startWave, place:(k,cx,cz,rot)=>placeDef(k,cx,cz,rot||0), spawn:spawnEnemy, select, confirmPlace, swing, repair, upgrade, sell, jump, setKeys:(o)=>Object.assign(K,o), r:renderer,
  step:(dt,n)=>{ for(let i=0;i<(n||1);i++) update(dt||1/60); },
  shot:(w,h)=>{ w=w||960; h=h||540; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); updateCamera(0); renderer.render(scene,camera); const d=renderer.domElement.toDataURL('image/png'); onResize(); return d; },
  setHero:(x,z,yaw)=>{ hero.x=x; hero.z=z; if(yaw!==undefined) hero.yaw=yaw; }, setCam:(yaw,pitch,dist)=>{ cam.yaw=yaw; cam.pitch=pitch; cam.dist=dist; cam.d=dist; },
  status:()=>({phase:S.phase,wave:S.wave,mana:S.mana,du:S.du,crystal:S.crystal,heroHp:Math.round(hero.hp),enemies:enemies.filter(e=>!e.dead).length,defs:defs.length,projs:projs.length,orbs:orbs.length,queue:spawnQ.length,kills:S.kills,t:+S.t.toFixed(1)}),
  addMana:n=>{ S.mana+=n; }, mute:()=>setSound(false), reflow, flow:()=>flowDef };
})();
