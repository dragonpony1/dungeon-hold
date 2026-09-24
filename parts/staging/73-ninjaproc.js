// ===== THE NINJA'S BO STAFF, BY HAND: the new rig's baked walk reads like the staff is a cane (planted and poked
// with every step) and its attack drops into a low, slow crouch — not what a "quick and close" fighter should look
// like next to the other three heroes. Same technique as the witch's own hand-made strike (72-witchswing.js, now
// dormant): aim the arm bones at a world-space direction each frame, blended in on top of whatever the mixer is
// already doing, instead of trusting the baked clip's own arm motion. The legs keep running the baked Walk/Run
// clip untouched — only the two arms (and the staff riding on them) are ours.
(function(){
const _f=new THREE.Vector3(), _u=new THREE.Vector3(0,1,0), _l=new THREE.Vector3(), _d=new THREE.Vector3(), _a=new THREE.Vector3(), _b=new THREE.Vector3(), _c=new THREE.Vector3(), _q=new THREE.Quaternion(), _pw=new THREE.Quaternion(), _bw=new THREE.Quaternion(), _r=new THREE.Quaternion();
function isNinja(){ return window.__heroes&&window.__heroes.pick()==='ninja'; }
function bones(){ if(!GLBH) return null; if(GLBH.ninjaArms===undefined){ GLBH.ninjaArms=null; let lu=null,lf=null,lh=null,ru=null,rf=null,rh=null;
    GLBH.root.traverse(o=>{ if(!o.isBone) return; if(/LeftArm$/.test(o.name)) lu=o; else if(/LeftForeArm$/.test(o.name)) lf=o; else if(/LeftHand$/.test(o.name)) lh=o; else if(/RightArm$/.test(o.name)) ru=o; else if(/RightForeArm$/.test(o.name)) rf=o; else if(/RightHand$/.test(o.name)) rh=o; });
    if(lu&&lf&&lh&&ru&&rf&&rh) GLBH.ninjaArms={lu,lf,lh,ru,rf,rh}; }
  return GLBH.ninjaArms; }
// turn a bone so the segment to its child points along dir (world), blended into the animated pose by w — same helper as 72-witchswing.js
function aim(bone,child,dir,w){ bone.getWorldPosition(_a); child.getWorldPosition(_b); _c.copy(_b).sub(_a).normalize(); _r.setFromUnitVectors(_c,dir); bone.parent.getWorldQuaternion(_pw); bone.getWorldQuaternion(_bw); _q.copy(_pw).invert().multiply(_r).multiply(_bw); bone.quaternion.slerp(_q,w); bone.updateWorldMatrix(false,true); }
const smooth=t=>{ t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };
// carried at a steady diagonal across the body — left hand low and forward, right hand up by the shoulder, the
// same two-handed grip whether standing still or walking, so there's no "poking the ground" motion tied to steps
function hold(w){ const B=bones(); if(!B) return; const yaw=hero.yaw; _f.set(Math.sin(yaw),0,Math.cos(yaw)); _l.set(Math.cos(yaw),0,-Math.sin(yaw));
  _d.copy(_f).addScaledVector(_u,-.35).addScaledVector(_l,.4).normalize(); aim(B.lu,B.lf,_d,w); _d.addScaledVector(_u,-.1); aim(B.lf,B.lh,_d,w);
  _d.copy(_f).addScaledVector(_u,.25).addScaledVector(_l,-.15).normalize(); aim(B.ru,B.rf,_d,w); _d.addScaledVector(_u,.15); aim(B.rf,B.rh,_d,w); }
// the spin: both arms wind up together (staff drawn back and up over the right shoulder), snap through level and
// forward at the hit, recover to the carry — upright throughout, no crouch
function strike(p){ const B=bones(); if(!B) return; const yaw=hero.yaw; _f.set(Math.sin(yaw),0,Math.cos(yaw)); _l.set(Math.cos(yaw),0,-Math.sin(yaw));
  const W=new THREE.Vector3().copy(_u).addScaledVector(_f,-.3).addScaledVector(_l,-.5).normalize();
  const S=new THREE.Vector3().copy(_f).addScaledVector(_u,.1).addScaledVector(_l,.15).normalize();
  let w,dir; if(p<.35){ w=smooth(p/.12); dir=W; } else if(p<.55){ const t=(p-.35)/.2; w=1; dir=new THREE.Vector3().copy(W).lerp(S,1-Math.pow(1-t,3)).normalize(); } else { w=1-smooth((p-.65)/.35); dir=S; }
  if(w<=0){ hold(1); return; } aim(B.ru,B.rf,dir,w); aim(B.rf,B.rh,dir,w);
  const ldir=new THREE.Vector3().copy(dir).addScaledVector(_l,.5).normalize(); aim(B.lu,B.lf,ldir,w); aim(B.lf,B.lh,ldir,w); }
// the baked "Idle" clip turned out not to be an idle loop at all — it's the Meshy rig's Arise (stand-up) clip,
// which opens flat on the ground and spends its whole 2s cycle rising and re-settling into a crouch, never
// holding still — that's the "constantly doing something" that made it impossible to evaluate. There's no good
// standing frame in it to freeze on, so pin it to the one point (t=1.0s) where it's at least fully risen and
// composed, not mid-rise off the floor. The arms are already fully overridden by hold() below regardless.
const IDLE_FREEZE_T=1.0;
{ const prev=heroModelUpdate; heroModelUpdate=function(dt){ const ninja=isNinja(); const act=(ninja&&GLBH)?GLBH.actions.attack:null; if(act) GLBH.actions.attack=null; prev(dt); if(act) GLBH.actions.attack=act;
    if(!ninja||!GLBH||!useGLB||hero.dead>0) return;
    const idleSt=hero.grounded&&!hero.moving&&hero.swingT<0;
    if(idleSt&&GLBH.actions.idle&&GLBH.actions.idle.timeScale!==0){ const a=GLBH.actions.idle; a.time=IDLE_FREEZE_T; a.timeScale=0; a.setEffectiveWeight(1); }
    if(hero.swingT>=0) strike(Math.min(1,hero.swingT/swingDur())); else if(hero.grounded) hold(1); }; }
{ const prev=hitFrac; hitFrac=function(){ return (isNinja()&&useGLB&&GLBH)?.55:prev(); }; }   // the blow lands at the snap
})();
