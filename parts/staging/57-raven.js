// ===== THE RAVEN: a terminal that flies in during the build phase, perched on a wall out of the way — off to one
// side, never right behind the crystal where it used to read as sitting on top of it — facing out into the room
// (which always stands at world (0,0), so this works on every map with no per-map wiring). Pops in fast when the
// phase turns to 'build' and pops out just as fast the moment the horn sounds or the run ends. For now E near it
// just opens the same character sheet Tab does — the I-menu tavern and the E-upgrade prompt elsewhere are
// untouched. More of the raven's own interface (beyond the sheet) is still to come.
(function(){
const NEAR=3.6; let RX=1.8, RZ=-2.0;   // off to the side and back against the wall behind the crystal, clear of it and of foot traffic
(function findPerch(){ let z=-.5; while(z>-40&&!wallAt(0,z-.5)) z-=.5; RZ=z-.7; RX=wallAt(1.8,z-.5)?1.8:0; })();   // the depth is the proven search (straight behind the crystal); slide sideways off it only once that same depth is confirmed still against a wall there too
let wrap=null, state='hidden', pop=0, lastPhase=null;
fetchBytes(ASSET('raven.glb')).then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{
    const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,2.8); toonify(root,fit.scale);
    wrap=fit.wrap; wrap.visible=false; wrap.scale.setScalar(0); scene.add(wrap);
  }catch(e){ console.warn('raven model',e); } },e=>console.warn('raven model',e))).catch(e=>console.warn('raven model',e));
function ravenY(){ return hgt[GOAL]+2.8+Math.sin(S.t*1.6)*.12; }
function near(){ return state==='perched'&&Math.hypot(hero.x-RX,hero.z-RZ)<NEAR; }
function ravenUpdate(dt){ if(!wrap) return;
  if(lastPhase===null){ lastPhase=S.phase; if(S.phase==='build') state='in'; }   // first frame ever seen already in build (a resumed run): still pop in, not just silently baseline
  else if(S.phase!==lastPhase){ if(S.phase==='build') state='in'; else if(state!=='hidden') state='out'; lastPhase=S.phase; }
  if(state==='in'){ pop=Math.min(1,pop+dt*4.5); wrap.visible=true; if(pop>=1) state='perched'; }
  else if(state==='out'){ pop=Math.max(0,pop-dt*4.5); if(pop<=0){ state='hidden'; wrap.visible=false; } }
  if(state==='hidden') return;
  wrap.position.set(RX,ravenY(),RZ); wrap.rotation.y=Math.sin(S.t*1.1)*.1; wrap.rotation.z=Math.sin(S.t*1.7)*.04;   // yaw 0: facing +Z, out into the room, not back at the wall it's perched against
  wrap.scale.setScalar(state==='perched'?1:easeOutBack(pop)); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); ravenUpdate(dt); }; }
{ const ph=Meta.hud; Meta.hud=()=>{ ph(); if(near()&&!placing&&!Meta.isOpen()){ const el=$('prompt'); const want='E  the raven (character sheet)'; if(el.textContent!==want) el.textContent=want; } }; }
{ const prev=upgrade; upgrade=function(){ if(near()){ window.__doll.open(); return; } return prev(); }; }
window.__raven={state:()=>state,near,pos:()=>({x:RX,y:ravenY(),z:RZ}),loaded:()=>!!wrap};
})();
