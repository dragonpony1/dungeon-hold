// ===== THE NINJA'S BO STAFF, BY HAND: built when the rig's baked walk read like the staff was a cane (planted and
// poked with every step) and its attack dropped into a low, slow crouch. Same technique as the witch's own
// hand-made strike (72-witchswing.js, also dormant): aim the arm bones at a world-space direction each frame,
// blended in on top of whatever the mixer is already doing, instead of trusting the baked clip's own arm motion.
// Now that all six clips are Matt's own Mixamo exports (retargeted with the source clip's own frame-0 pose as
// the rest reference, not the file's raw bind pose — that raw reference is what was reading as a deep crouch
// on every clip it touched), every state including idle runs fully on its own baked clip again. Dormant, not
// deleted: hold()/strike() stay here as a fallback if a future baked clip needs the same fix a different hero got.
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
})();
