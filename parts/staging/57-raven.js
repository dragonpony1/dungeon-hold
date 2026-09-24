// ===== THE RAVEN: a terminal that flies in during the build phase, landing on a waist-high gnarled perch — backed
// against a wall on a map that sets MAP.raven (cx,cz,face), or a plain floor spot beside the crystal otherwise
// (the crystal always stands at world (0,0), so that fallback lands somewhere sane with no per-map wiring).
// Pops in fast when the phase turns to 'build' and pops out just as fast the moment the horn sounds or the run
// ends. For now E near it just opens the same character sheet Tab does — the I-menu tavern and the E-upgrade
// prompt elsewhere are untouched. More of the raven's own interface (beyond the sheet) is still to come.
(function(){
const NEAR=3.6, PERCH_H=1.0;
const RAVEN_CFG=MAP.raven||null;
const RX=RAVEN_CFG?cw(RAVEN_CFG.cx):2.5, RZ=RAVEN_CFG?cwz(RAVEN_CFG.cz):2, RFACE=RAVEN_CFG?RAVEN_CFG.face:0;
const baseY=floorH(RX,RZ);
// the perch: a gnarled dead-wood post, twisted and knobby, waist high
const perch=(()=>{ const g=new THREE.Group(); const bark=mat(0x6a4e34), barkD=mat(0x543922);   // lighter weathered wood, not the near-black it started as — it read as a dark blob against the floor
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
  wrap.position.set(RX,ravenY(),RZ); wrap.rotation.y=RFACE+Math.sin(S.t*1.1)*.1; wrap.rotation.z=Math.sin(S.t*1.7)*.04;
  wrap.scale.setScalar(state==='perched'?1:easeOutBack(pop)); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); ravenUpdate(dt); }; }
{ const ph=Meta.hud; Meta.hud=()=>{ ph(); if(near()&&!placing&&!Meta.isOpen()){ const el=$('prompt'); const want='E  the raven (character sheet)  ·  H  switch hero'; if(el.textContent!==want) el.textContent=want; } }; }
{ const prev=upgrade; upgrade=function(){ if(near()){ window.__doll.open(); return; } return prev(); }; }
// a real button row, not just the H key — four hero buttons that show up near the raven so the choice is visible
// and clickable (touch included), not a hint you have to already know about. Built lazily (first raven update,
// not at load) since window.__heroes (70-hero2.js) isn't set up yet when this module's own top level runs.
let heroPick=null;
function syncHeroPick(){ if(!heroPick) return; const cur=window.__heroes.pick(); [...heroPick.children].forEach(b=>{ const on=b.dataset.hero===cur;
  b.style.borderColor=on?'#e8b94a':'#6b5a3c'; b.style.background=on?'linear-gradient(#5a4066,#2a1c34)':'linear-gradient(#3a2a44,#1c1424)'; b.style.boxShadow=on?'0 0 10px #e8b94a66':'none'; }); }
function ensureHeroPick(){ if(heroPick) return heroPick;
  heroPick=document.createElement('div'); heroPick.id='heroPick';
  heroPick.style.cssText='position:absolute;left:50%;bottom:150px;transform:translateX(-50%);display:none;gap:8px;pointer-events:auto;z-index:5;';
  window.__heroes.list().forEach(h=>{ const b=document.createElement('button'); b.textContent=h.name; b.dataset.hero=h.id;
    b.style.cssText='padding:8px 12px;border-radius:6px;border:2px solid #6b5a3c;background:linear-gradient(#3a2a44,#1c1424);color:#fff;font:bold 11px Georgia,serif;letter-spacing:.5px;cursor:pointer;white-space:nowrap';
    b.addEventListener('click',e=>{ e.stopPropagation(); if(window.__heroes.pick()!==h.id) window.__heroes.select(h.id); syncHeroPick(); });
    heroPick.appendChild(b); });
  document.getElementById('hud').appendChild(heroPick); syncHeroPick(); return heroPick; }
{ const prev=ravenUpdate; ravenUpdate=function(dt){ prev(dt); const show=near()&&!placing&&!Meta.isOpen(); const hp=ensureHeroPick(); if((hp.style.display==='flex')!==show){ hp.style.display=show?'flex':'none'; if(show) syncHeroPick(); } }; }
window.__raven={state:()=>state,near,pos:()=>({x:RX,y:ravenY(),z:RZ}),loaded:()=>!!wrap,heroPickVisible:()=>heroPick&&heroPick.style.display==='flex',heroPickButtons:()=>heroPick?[...heroPick.children].map(b=>b.dataset.hero):[]};
})();
