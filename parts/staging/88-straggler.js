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
// build 180: the cause, not just the safety net. A mob shoved off a stair's edge lands pressed into the stair's side, overlapping its
// higher steps, and moveCircle refuses every move that still overlaps -- frozen while it 'walks' (the Throne Room's top flight, the
// feeder gates). A walking mob that hasn't budged for UNSTICK seconds is set down in the middle of the floor cell it stands on
const UNSTICK=1.5;
function unstick(dt){ for(const e of enemies){ if(e.dead||e.fly) continue; if(!e.walking){ e.__wt=0; e.__wx=e.x; e.__wz=e.z; continue; }
    if(e.__wx===undefined||Math.hypot(e.x-e.__wx,e.z-e.__wz)>.08){ e.__wx=e.x; e.__wz=e.z; e.__wt=0; continue; }
    e.__wt=(e.__wt||0)+dt; if(e.__wt<UNSTICK) continue; e.__wt=0; const cx=cw(wc(e.x)), cz=cwz(wcz(e.z)); if(Math.hypot(cx-e.x,cz-e.z)<.05) continue; e.x=cx; e.z=cz; e.__wx=e.x; e.__wz=e.z; e.__unstuck=(e.__unstuck||0)+1; } }
function tick(dt){ if(!(window.__net&&window.__net.role&&window.__net.role()==='guest')) unstick(dt);
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
window.__straggler={unstuck:()=>enemies.reduce((a,e)=>a+(e.__unstuck||0),0),STUCK_MARK,STUCK_GIVEUP,FEW,marked:()=>enemies.filter(e=>!e.dead&&e.__beacon).length};
})();
