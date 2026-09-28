// ===== STRAGGLERS (build 179). Matt, between waves in the Throne Room: "the raven and portal didn't show up … it won't let me start the
// wave … it says one enemy left". A wave only ends when every mob is dead, so one mob wedged somewhere (a landing, the stairs, behind a
// pillar) held the whole hall: no build phase, no raven, no portal, no horn. Now, once the queue is empty and only a few are left, a mob
// that has neither moved nor attacked for STUCK_MARK seconds gets a tall red beacon (seen through walls) and a toast; if it's still
// frozen STUCK_GIVEUP seconds after that it gives up and vanishes quietly -- no loot, no xp -- and the wave ends as usual. A mob that
// is fighting (its attack timer restarts) or walking is never counted. The host decides in co-op; guests see the beacon-less result.
(function(){
const STUCK_MARK=12, STUCK_GIVEUP=30, FEW=3, MOVED=.35;
const BEACON_GEO=new THREE.CylinderGeometry(.12,.35,14,10,1,true);
function beacon(e){ const m=new THREE.Mesh(BEACON_GEO,new THREE.MeshBasicMaterial({color:0xff3a3a,transparent:true,opacity:.55,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})); m.renderOrder=999; m.userData.noOL=true; scene.add(m); return m; }
function clear(e){ if(e.__beacon){ scene.remove(e.__beacon); e.__beacon.material.dispose(); e.__beacon=null; } }
let told=false;
function tick(dt){
  const guest=window.__net&&window.__net.role&&window.__net.role()==='guest';
  const alive=enemies.filter(e=>!e.dead);
  for(const e of enemies) if(e.dead&&e.__beacon) clear(e);
  if(guest||S.phase!=='wave'||spawnQ.length||!alive.length||alive.length>FEW){ for(const e of alive){ e.__stuckT=0; e.__sx=e.x; e.__sz=e.z; clear(e); } told=false; return; }
  for(const e of alive){
    if(e.__sx===undefined){ e.__sx=e.x; e.__sz=e.z; e.__stuckT=0; e.__atk=e.atk; }
    const moved=Math.hypot(e.x-e.__sx,e.z-e.__sz)>MOVED, attacked=e.atk>(e.__atk||0)+.01; e.__atk=e.atk;
    if(moved||attacked){ e.__stuckT=0; e.__sx=e.x; e.__sz=e.z; clear(e); continue; }
    e.__stuckT=(e.__stuckT||0)+dt;
    if(e.__stuckT>=STUCK_MARK){ if(!e.__beacon){ e.__beacon=beacon(e); if(!told){ told=true; toast('A monster is stuck — follow the red beacon, or it gives up in '+STUCK_GIVEUP+' s'); } }
      const b=e.__beacon; b.position.set(e.x,(e.y||0)+7,e.z); b.material.opacity=.4+.2*Math.sin(S.t*5); }
    if(e.__stuckT>=STUCK_MARK+STUCK_GIVEUP){ clear(e); e.through=true; e.dead=.001; floatText(e.x,(e.y||0)+2,e.z,'GAVE UP','#ff8a6a'); toast('A lost straggler gave up — the wave is yours'); }   // quietly, never kill(): no orb, loot or xp
  } }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); tick(dt); }; }
window.__straggler={STUCK_MARK,STUCK_GIVEUP,FEW,marked:()=>enemies.filter(e=>!e.dead&&e.__beacon).length};
})();
