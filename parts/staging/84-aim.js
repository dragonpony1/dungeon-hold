// ===== AIMING FOR RANGED HEROES: a reticle, press to draw or charge, let go to loose =====
// With a bow or a staff in hand the camera's facing is the aim. The reticle locks onto the mob a shot would take (the one
// nearest the aim line within reach and in sight) and shows a crosshair where the shot would land when nothing is in reach.
// Press to draw (the archer) or charge (the witch): the archer's clip holds at full draw, the witch's at the wind-up with her
// staff levelled at the target, the hero keeps facing the aim and walks at half speed, and the charge fills over fullT()
// seconds (quicker with attack speed). Let go to loose: a tap does 60% damage, a full charge 130% — a full-draw arrow flies
// faster and pierces two more mobs, a full-charge bolt is bigger and bursts on the mobs round the one it hits.
(function(){
const HOLD={on:false,t:0,src:'',kind:null,paused:null,fullRung:false}; let ATK_TOUCH=false, API_HOLD=false, LAST_C=0;
const LAST={x:0,y:0,locked:false,shown:false,charge:0};
const FULL_BASE=.75, TAP_MUL=.6, FULL_MUL=1.3;
function rangedKind(){ const w=window.__weapons&&window.__weapons.mounted(); if(!w||!w.parent) return null; return /^bow-/.test(w.name)?'bow':/^staff-/.test(w.name)?'staff':null; }
function fullT(){ return FULL_BASE*swingDur()/swingBase(); }
function charge(){ return HOLD.on?clamp(HOLD.t/fullT(),0,1):0; }
function aimYaw(){ return cam.yaw; }
// the mob a shot would take: nearest the aim line (within ~28°, or ~60° up close), within reach, not behind a wall
function pick(yaw){ const fx=Math.sin(yaw), fz=Math.cos(yaw); const range=hero.reach||9; let best=null, bs=1e9;
  for(const e of enemies){ if(e.dead) continue; const dx=e.x-hero.x, dz=e.z-hero.z, d=Math.hypot(dx,dz); if(d>range+e.r||d<.01) continue; const c=(dx*fx+dz*fz)/d; if(c<(d<3?.5:.88)) continue; if(!los(hero.x,hero.z,e.x,e.z)) continue; const s=(1-c)*8+d/range; if(s<bs){ bs=s; best=e; } }
  return best; }
// what the shot being loosed carries (read by the bow and staff shots)
function shot(){ const c=LAST_C; return {c,mul:TAP_MUL+(FULL_MUL-TAP_MUL)*c,full:c>=.999}; }
// ---- press: a ranged hero's swing starts a draw that holds until the button comes up ----
{ const prev=swing; swing=function(){ const k=rangedKind(); if(!k) return prev(); if(hero.swingT>=0) return; prev(); if(hero.swingT!==0) return;   // not allowed now (dead, between runs)
    hero.yaw=aimYaw(); LAST_C=0; const src=mouseDown?'mouse':ATK_TOUCH?'touch':API_HOLD?'api':''; if(!src) return;   // a swing with nothing held (a test's tap) looses at once, uncharged
    HOLD.on=true; HOLD.t=0; HOLD.src=src; HOLD.kind=k; HOLD.paused=null; HOLD.fullRung=false; }; }
// while held the shot never lands: the swing waits just short of its release point
{ const prev=hitCone; hitCone=function(){ if(HOLD.on&&rangedKind()){ hero.hitDone=false; hero.swingT=swingDur()*hitFrac()-1e-4; return; } return prev(); }; }
function release(){ if(!HOLD.on) return; LAST_C=charge(); HOLD.on=false; const a=HOLD.paused; HOLD.paused=null;
  if(a&&GLBH&&GLBH.map.attack){ a.timeScale=GLBH.map.attack.duration/swingDur(); hero.swingT=Math.min(hero.swingT,a.time/a.getClip().duration*swingDur()); } }   // the clip plays on from where it held; the shot lands when it reaches the release
function cancel(){ const a=HOLD.paused; HOLD.on=false; HOLD.paused=null; if(a&&GLBH&&GLBH.map.attack) a.timeScale=GLBH.map.attack.duration/swingDur(); }
// the touch ⚔ button: for a ranged hero it presses on touchstart and lets go on touchend (the button's own handler taps)
const isAtk=t=>{ const b=t&&t.closest&&t.closest('.hb'); return !!(b&&b.textContent==='⚔'); };
document.addEventListener('touchstart',e=>{ if(!isAtk(e.target)||!rangedKind()) return; e.preventDefault(); e.stopPropagation(); ATK_TOUCH=true; swing(); },{capture:true,passive:false});
const touchUp=e=>{ if(!ATK_TOUCH) return; for(const t of e.changedTouches) if(isAtk(t.target)) ATK_TOUCH=false; }; document.addEventListener('touchend',touchUp,{capture:true}); document.addEventListener('touchcancel',touchUp,{capture:true});
// ---- the staff levelled at the target while it charges and fires, its head glowing brighter with the charge ----
const PT={w:0,glow:0}, _pq=new THREE.Quaternion(), _qa=new THREE.Quaternion(), _q=new THREE.Quaternion(), _q0=new THREE.Quaternion(), _v=new THREE.Vector3(), _d=new THREE.Vector3(), _g=new THREE.Vector3(), _Y=new THREE.Vector3(0,1,0); const GLOWS=new WeakMap();
function pointStaff(dt,k){ const wo=window.__weapons&&window.__weapons.mounted(); if(k!=='staff'||!wo||!wo.parent||!wo.userData.sword){ PT.w=0; PT.glow=0; return; } const sd=wo.userData.sword;
  const on=HOLD.on||hero.swingT>=0; PT.w=lerp(PT.w,on?1:0,1-Math.exp(-(on?14:6)*dt)); PT.glow=lerp(PT.glow,charge(),1-Math.exp(-10*dt));
  const fist=wo.parent.getWorldPosition(_v); const yaw=aimYaw(); const t=pick(yaw); let hx, hz, el;
  if(t){ const dx=t.x-fist.x, dz=t.z-fist.z, dh=Math.max(.01,Math.hypot(dx,dz)); hx=dx/dh; hz=dz/dh; el=Math.atan2((t.y+t.h*.55)-fist.y,dh); } else { hx=Math.sin(yaw); hz=Math.cos(yaw); el=0; }
  el=clamp(el+.5,-.2,1.25); _d.set(hx*Math.cos(el),Math.sin(el),hz*Math.cos(el));   // the head lifted about 30° over the line to the target: levelled, not lanced
  wo.parent.getWorldQuaternion(_pq); _qa.setFromUnitVectors(_Y,_d); _qa.premultiply(_pq.invert()); _q.copy(_q0).slerp(_qa,PT.w); wo.quaternion.copy(_q); _g.set(0,sd.gripY*sd.scale,0).applyQuaternion(wo.quaternion); wo.position.copy(_g).negate();   // turned about the grip: the fist keeps its place on the shaft
  const gl=wo.getObjectByName('glow'); if(gl){ let base=GLOWS.get(gl); if(base===undefined){ base=gl.scale.x; GLOWS.set(gl,base); } gl.scale.setScalar(base*(1+2.2*PT.glow)); } }
// ---- every frame: hold the clip at the draw, keep facing the aim, let go when the button is up ----
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); const k=rangedKind();
    if(HOLD.on){ if(!k||hero.dead>0||S.phase==='dead'||S.phase==='won'){ cancel(); }
      else { HOLD.t+=dt; hero.yaw=aimYaw(); const a=GLBH&&GLBH.actions.attack;
        if(a&&GLBH.cur===a&&!HOLD.paused){ const th=a.getClip().duration*hitFrac()*(HOLD.kind==='staff'?.55:.97); if(a.time>=th){ a.time=th; a.timeScale=0; HOLD.paused=a; } }   // the archer holds at full draw, the witch at her wind-up
        if(!HOLD.fullRung&&charge()>=1){ HOLD.fullRung=true; beep(HOLD.kind==='bow'?660:880,.09,'triangle',.05,1.5); }   // a ping when the charge is full
        const up=HOLD.src==='mouse'?!mouseDown:HOLD.src==='touch'?!ATK_TOUCH:!API_HOLD; if(up) release(); } }
    else if(k&&hero.swingT>=0) hero.yaw=aimYaw();   // a shot on its way out keeps facing the aim
    hero.aimSlow=HOLD.on?.5:1; cam.shoulder=lerp(cam.shoulder||0,k?1:0,1-Math.exp(-5*dt)); pointStaff(dt,k); }; }   // a ranged hero gets the over-the-shoulder camera
// ---- the reticle, drawn over the hall ----
function colFor(k){ if(k==='staff'&&window.__staff){ const w=window.__weapons.mounted(); const inf=window.__staff.info(w.userData.kind); if(inf&&inf.glow!==undefined) return '#'+inf.glow.toString(16).padStart(6,'0'); } return '#ffd060'; }
function stroke2(g,col,w,path){ g.strokeStyle='#120c1a'; g.lineWidth=w+2.5; g.beginPath(); path(); g.stroke(); g.strokeStyle=col; g.lineWidth=w; g.beginPath(); path(); g.stroke(); }
function drawAim(){ LAST.shown=false; const k=rangedKind(); if(!k||placing||hero.dead>0||Meta.isOpen()||!(S.phase==='build'||S.phase==='wave')) return;
  const g=ovx, yaw=aimYaw(), c=charge(), full=HOLD.on&&c>=1, col=colFor(k); const t=pick(yaw); let cx, cy, r;
  g.save(); g.globalAlpha=1; g.lineCap='round';
  if(t){ const top=proj(t.x,t.y+t.h,t.z), bot=proj(t.x,t.y,t.z); if(!top||!bot){ g.restore(); return; } const h=Math.max(24,bot[1]-top[1]), w=Math.max(24,h*.72); cx=(top[0]+bot[0])/2; cy=(top[1]+bot[1])/2; const L=Math.min(w,h)*.3; r=Math.max(w,h)/2+10;
    const pul=full?.5+.5*Math.sin(S.t*18):0, cc=full?'#ffffff':col;
    for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const x=cx+sx*w/2, y=cy+sy*h/2; stroke2(g,cc,2.5+pul*1.5,()=>{ g.moveTo(x-sx*L,y); g.lineTo(x,y); g.lineTo(x,y-sy*L); }); }   // corner brackets round the locked mob
    stroke2(g,cc,2,()=>{ g.moveTo(cx-4,cy); g.lineTo(cx+4,cy); g.moveTo(cx,cy-4); g.lineTo(cx,cy+4); });
    Object.assign(LAST,{x:cx,y:cy,locked:true}); }
  else { const fx=Math.sin(yaw), fz=Math.cos(yaw), reach=hero.reach||9; let s=1; for(;s<reach;s+=.5){ if(wallAt(hero.x+fx*s,hero.z+fz*s)) break; } const p=proj(hero.x+fx*s,hero.y+1.3,hero.z+fz*s); if(!p){ g.restore(); return; } cx=p[0]; cy=p[1]; r=16;   // nothing in reach: a crosshair where the shot would end
    g.globalAlpha=.75; stroke2(g,col,2,()=>{ g.arc(cx,cy,7,0,TAU); }); stroke2(g,col,2,()=>{ for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ g.moveTo(cx+dx*10,cy+dy*10); g.lineTo(cx+dx*15,cy+dy*15); } }); g.globalAlpha=1;
    Object.assign(LAST,{x:cx,y:cy,locked:false}); }
  if(HOLD.on){ g.globalAlpha=.35; stroke2(g,col,3,()=>{ g.arc(cx,cy,r,0,TAU); }); g.globalAlpha=1; if(c>0) stroke2(g,full?'#ffffff':col,3.5,()=>{ g.arc(cx,cy,r,-PI/2,-PI/2+c*TAU); }); }   // the charge ring fills as the string comes back
  LAST.shown=true; LAST.charge=c; g.restore(); }
{ const prev=drawOverlay; drawOverlay=function(){ prev(); drawAim(); }; }
window.__aim={kind:rangedKind,holding:()=>HOLD.on,charge,lastCharge:()=>LAST_C,pick:y=>pick(y===undefined?aimYaw():y),yaw:aimYaw,shot,fullT,
  press:()=>{ API_HOLD=true; swing(); }, release:()=>{ API_HOLD=false; }, reticle:()=>Object.assign({},LAST), point:()=>+PT.w.toFixed(2), paused:()=>!!HOLD.paused};
})();
