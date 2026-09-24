// ===== THE RAVEN: a terminal that flies in during the build phase, landing on a waist-high gnarled perch that
// stands on the floor near the crystal (which always stands at world (0,0), so this works on every map with no
// per-map wiring) — no wall-hugging, no depth-matching headaches, just a simple floor spot clear of foot traffic.
// Pops in fast when the phase turns to 'build' and pops out just as fast the moment the horn sounds or the run
// ends. For now E near it just opens the same character sheet Tab does — the I-menu tavern and the E-upgrade
// prompt elsewhere are untouched. More of the raven's own interface (beyond the sheet) is still to come.
(function(){
const NEAR=3.6, RX=2.5, RZ=2, PERCH_H=1.0;   // a simple fixed floor spot beside the crystal — no wall search needed now that the raven has its own ground-standing perch
const baseY=floorH(RX,RZ);
// the perch: a gnarled dead-wood post, twisted and knobby, waist high
const perch=(()=>{ const g=new THREE.Group(); const bark=mat(0x2b2018), barkD=mat(0x1c150f);
  const segs=5; let x=0,z=0,y=0;
  for(let i=0;i<segs;i++){ const h=PERCH_H/segs, r0=.13-i*.016, r1=.13-(i+1)*.016, dx=Math.sin(i*1.7)*.05, dz=Math.cos(i*2.1)*.05;
    const seg=M(G.cyl(Math.max(r1,.02),Math.max(r0,.03),h,7),bark,x+dx/2,y+h/2,z+dz/2); seg.rotation.z=Math.sin(i*1.3)*.12; seg.rotation.x=Math.cos(i*1.9)*.1; g.add(seg); x+=dx; z+=dz; y+=h; }
  // a couple of stubby broken branches
  for(const [bx,by,bz,rot] of [[.14,.55,.03,.9],[-.11,.32,-.09,-1.3]]){ const b=M(G.cyl(.02,.04,.22,5),barkD,bx,by,bz); b.rotation.z=rot; g.add(b); }
  g.add(M(G.cyl(.15,.17,.06,8),barkD,x,y,z));   // a knotty cap where the raven's feet grip
  return outline(g); })();
perch.position.set(RX,baseY,RZ);
world.add(perch);
let wrap=null, state='hidden', pop=0, lastPhase=null;
fetchBytes(ASSET('raven.glb')).then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{
    const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,1.6); toonify(root,fit.scale);
    wrap=fit.wrap; wrap.visible=false; wrap.scale.setScalar(0); scene.add(wrap);
  }catch(e){ console.warn('raven model',e); } },e=>console.warn('raven model',e))).catch(e=>console.warn('raven model',e));
function ravenY(){ return baseY+PERCH_H+.08+Math.sin(S.t*1.6)*.05; }
function near(){ return state==='perched'&&Math.hypot(hero.x-RX,hero.z-RZ)<NEAR; }
function ravenUpdate(dt){ if(!wrap) return;
  if(lastPhase===null){ lastPhase=S.phase; if(S.phase==='build') state='in'; }   // first frame ever seen already in build (a resumed run): still pop in, not just silently baseline
  else if(S.phase!==lastPhase){ if(S.phase==='build') state='in'; else if(state!=='hidden') state='out'; lastPhase=S.phase; }
  if(state==='in'){ pop=Math.min(1,pop+dt*4.5); wrap.visible=true; if(pop>=1) state='perched'; }
  else if(state==='out'){ pop=Math.max(0,pop-dt*4.5); if(pop<=0){ state='hidden'; wrap.visible=false; } }
  if(state==='hidden') return;
  wrap.position.set(RX,ravenY(),RZ); wrap.rotation.y=Math.sin(S.t*1.1)*.1; wrap.rotation.z=Math.sin(S.t*1.7)*.04;
  wrap.scale.setScalar(state==='perched'?1:easeOutBack(pop)); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); ravenUpdate(dt); }; }
{ const ph=Meta.hud; Meta.hud=()=>{ ph(); if(near()&&!placing&&!Meta.isOpen()){ const el=$('prompt'); const want='E  the raven (character sheet)'; if(el.textContent!==want) el.textContent=want; } }; }
{ const prev=upgrade; upgrade=function(){ if(near()){ window.__doll.open(); return; } return prev(); }; }
window.__raven={state:()=>state,near,pos:()=>({x:RX,y:ravenY(),z:RZ}),loaded:()=>!!wrap};
})();
