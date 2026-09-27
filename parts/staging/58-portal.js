// ===== THE HIDEOUT PORTAL: a crystal archway that pops in during the build phase and pops back out the moment
// the horn sounds or the run ends -- same lifecycle as the raven (57-raven.js), same easeOutBack pop, tucked out
// of the way on a map that sets MAP.portal (cx,cz,face), or a plain floor spot beside the crystal otherwise (the
// crystal always stands at world (0,0), so the fallback lands somewhere sane with no per-map wiring). This module
// is the archway itself -- where it stands and when it shows. Stepping through it (E, and the hideout opening over
// the hall) is 59-hideout.js, which reads window.__portal below to know where the doorway is.
// hallPhase (build 159, 5/7): the phase of the hall this page PLAYS in. A co-op guest's own S.phase sits at 'build' the whole run
// (only the host's startWave moves it, 99-network.js), so the portal stayed up through the host's waves and a guest could go
// shopping in the hideout mid-wave, and never heard the horn call it back. A guest in the hall reads the host's phase from its world
// broadcast instead; solo, the host, a guest before the first broadcast, and a guest whose own run is over (the end screen set its
// S.phase, or the host left, which drops the broadcast) read S.phase as always. Top level: 59-hideout.js and 97-mythics.js use it too
function hallPhase(){ const n=window.__net; if(S.phase==='build'&&n&&n.role&&n.role()==='guest'){ const w=n.world&&n.world(); if(w&&typeof w.phase==='string') return w.phase; } return S.phase; }
(function(){
const PORTAL_CFG=MAP.portal||null;
const PX=PORTAL_CFG?cw(PORTAL_CFG.cx):-2.5, PZ=PORTAL_CFG?cwz(PORTAL_CFG.cz):2, PFACE=PORTAL_CFG?PORTAL_CFG.face:0;
const baseY=floorH(PX,PZ);
let wrap=null, state='hidden', pop=0, lastPhase=null;
fetchBytes(ASSET('hideout-portal.glb'),'soon').then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{
    const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,2.4); toonify(root,fit.scale);
    wrap=fit.wrap; wrap.visible=false; wrap.scale.setScalar(0); scene.add(wrap);
  }catch(e){ console.warn('portal model',e); } },e=>console.warn('portal model',e))).catch(e=>console.warn('portal model',e));
function portalUpdate(dt){ if(!wrap) return; const ph=hallPhase();   // the host's phase on a co-op guest (above): out with the host's horn, back in with its build phase
  if(lastPhase===null){ lastPhase=ph; if(ph==='build') state='in'; }   // first frame ever seen already in build (a resumed run): still pop in, not just silently baseline
  else if(ph!==lastPhase){ if(ph==='build') state='in'; else if(state!=='hidden') state='out'; lastPhase=ph; }
  if(state==='in'){ pop=Math.min(1,pop+dt*4.5); wrap.visible=true; if(pop>=1) state='shown'; }
  else if(state==='out'){ pop=Math.max(0,pop-dt*4.5); if(pop<=0){ state='hidden'; wrap.visible=false; } }
  if(state==='hidden') return;
  wrap.position.set(PX,baseY,PZ); wrap.rotation.y=PFACE;
  wrap.scale.setScalar(state==='shown'?1:easeOutBack(pop)); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); portalUpdate(dt); }; }
window.__portal={state:()=>state,pos:()=>({x:PX,y:baseY,z:PZ}),loaded:()=>!!wrap};
})();
