// ===== THE DRAWBRIDGE'S INN HEARTROOT (build 450). Matt: "a ramp from the east spawn point to the top of the inn" / "all of the east mobs will go to the roof of the inn where a second heartroot will be".
//  * A SECOND HEARTROOT on the inn's roof (MAP.crystal2; game.js already plays a map with two -- the Cloister Court): its own bar under the first, its own alarm, the first one's model cloned.
//  * EVERY mob from the EAST gate (MAP.goal2Lanes) -- walkers and flyers -- follows a road of its own to it (e.fF/e.fD/e.fFly: fields to the inn alone); every other gate's horde goes to the castle's
//    Heartroot alone, however near the inn may be (the shared fields are worked out to the castle only).
//  * THE RAMP (game.js map build): from beside the east gate, west along the inn's north side, under the bridge, to a porch on the inn's top. A whole step a square -- too steep for an ordinary road, so only
//    its own cells (MAP.mobRamp -> RAMPOK) are let rise that much.
// Test hook: window.__moatinn.
(function(){
'use strict';
window.__moatinn={ info:()=>null };
if(!MAP||MAP.id!=='moat'||!(GOAL2>=0)||!Array.isArray(MAP.goal2Lanes)) return;
const P=MAP.padN|0, L2=new Set(MAP.goal2Lanes), cnt={ sent:0, keep:0 };
if(Array.isArray(MAP.mobRamp)){ const [x0,x1,z0,z1]=MAP.mobRamp; RAMPOK=new Uint8Array(GW*GH); for(let z=z0+P;z<=z1+P;z++) for(let x=x0;x<=x1;x++) if(inb(x,z)) RAMPOK[idx(x,z)]=1; }
let F2=null, F3=null;
function aim(e){ if(e.goal3){ if(F3) e.fFly=F3; return; } if(!F2) return; e.fF=F2.free; e.fD=F2.def; e.fFly=F2.fly; }
function fields(){ flowFree=bfs(false,false,GOAL); flowDef=bfs(true,false,GOAL); flowFly=bfs(false,true,GOAL); F2={ free:bfs(false,false,GOAL2), def:bfs(true,false,GOAL2), fly:bfs(false,true,GOAL2) }; F3=GOAL3>=0?bfs(false,true,GOAL3):null; for(const e of enemies) if(e.goal2||e.goal3) aim(e); }
{ const prev=reflow; reflow=function(){ prev.apply(this,arguments); fields(); }; }
reflow();
{ const prev=spawnEnemy; spawnEnemy=function(kind,lane){ const n0=enemies.length; const r=prev.apply(this,arguments); for(let i=n0;i<enemies.length;i++){ const e=enemies[i]; if(!e) continue;
      if(e.fly&&F3&&MAP.goal3Fly&&e.kind!=='wraith'){ if(!e.goal3){ e.goal3=true; aim(e); cnt.keep++; } continue; }   /* build 454: every flyer for the keep's Heartroot (the Phase Wraith keeps its own mind) */
      if(L2.has(lane)&&!e.goal2){ e.goal2=true; aim(e); cnt.sent++; } } return r; }; }
// ---- the second Heartroot: the first one's pieces cloned once 55-crystal.js has the model in (the Cloister's way), up on the inn's roof, turning and bobbing
const H2G=new THREE.Group(); H2G.position.set(C2X,hgt[GOAL2]||0,C2Z); world.add(H2G); let H2CG=null, h2t=0; const H2SH=[];
function buildHeart2(){ if(H2CG||!crystalG.userData.model) return; for(const ch of crystalG.children){ const cl=ch.clone(true); cl.traverse(ob=>{ if(ob.material) ob.material=Array.isArray(ob.material)?ob.material.map(m=>m.clone()):ob.material.clone(); }); H2G.add(cl); if(ch===crystalG.userData.cg) H2CG=cl; }
  if(H2CG) H2CG.children.forEach(s=>{ if(s.userData&&s.userData.a!==undefined) H2SH.push(s); }); }
const h2poll=setInterval(()=>{ buildHeart2(); if(H2CG) clearInterval(h2poll); },300);
const bar1=document.getElementById('cbar'), bar1B=bar1&&bar1.parentNode; let bar2=null;
if(bar1B){ const b=bar1B.cloneNode(true); const i=b.querySelector('i'); if(i){ i.id='cbar2'; i.style.width='100%'; } const lbl=b.querySelector('b'); if(lbl) lbl.textContent='INN HEARTROOT'; const l1=bar1B.querySelector('b'); if(l1) l1.textContent='CASTLE HEARTROOT'; bar1B.parentNode.insertBefore(b,bar1B.nextSibling); bar2=i; }
let last2=null, strip2T=0;
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); buildHeart2(); h2t+=dt;
    if(H2CG){ H2CG.rotation.y=h2t*.7; H2CG.position.y=(crystalG.userData.cgY||2.7)+Math.sin(h2t*1.6)*.15+(crystal2Shake>0?(rnd()-.5)*.3:0); H2SH.forEach((s,k)=>{ const a=s.userData.a+h2t*1.4; s.position.set(Math.cos(a)*1.7,Math.sin(h2t*2+k)*.5,Math.sin(a)*1.7); }); }
    crystal2Shake=Math.max(0,crystal2Shake-dt);
    const N=window.__net, guest=!!(N&&N.role&&N.role()==='guest'), hw=N&&N.world&&N.world(); const c2=guest&&hw&&hw.crystal2!=null?hw.crystal2:S.crystal2, max=guest&&hw&&hw.crystalMax?hw.crystalMax:CRYSTAL_MAX;
    if(bar2) bar2.style.width=Math.max(0,c2/max*100)+'%';
    const strip=document.getElementById('alarm'); if(last2!==null&&c2<last2&&c2>0&&(S.phase==='wave'||S.phase==='build'||guest)&&strip){ strip.textContent='⚠ THE INN HEARTROOT IS UNDER ATTACK'; strip.classList.add('on'); strip2T=2.5; }
    if(strip2T>0){ strip2T-=dt; if(strip2T<=0&&strip){ strip.classList.remove('on'); strip.textContent='⚠ THE HEARTROOT IS UNDER ATTACK'; } } last2=c2; }; }
// ---- build 454: the KEEP HEARTROOT, the same way: the model cloned onto the hall roof's north-west corner, its bar third, its own alarm
const H3Y=MAP.crystal3Y!=null?MAP.crystal3Y:(GOAL3>=0?hgt[GOAL3]:0);   /* build 458: it stands on the yard roof (a slab, not the ground under it) */
const H3G=new THREE.Group(); if(GOAL3>=0){ H3G.position.set(C3X,H3Y,C3Z); world.add(H3G); }
// the flyers making for it keep up at the roof over the castle yard (game.js asks); nothing on foot treads its square below the roof (MOBBLOCK), so no walker strikes it from underneath
const Wk=MAP.walk; window.__flyFloor=(x,z)=>{ if(!Wk||!Wk.ward) return -1e9; const cx=wc(x), cz=wcz(z); return (cx>=Wk.ward[0]-1&&cx<=Wk.ward[1]+1&&cz>=Wk.ward[2]+P-1&&cz<=Wk.ward[3]+P+1)?H3Y:-1e9; };
if(GOAL3>=0&&MAP.crystal3Y!=null){ MOBBLOCK[GOAL3]=1; reflow(); } let H3CG=null; const H3SH=[];
function buildHeart3(){ if(GOAL3<0||H3CG||!crystalG.userData.model) return; for(const ch of crystalG.children){ const cl=ch.clone(true); cl.traverse(ob=>{ if(ob.material) ob.material=Array.isArray(ob.material)?ob.material.map(m=>m.clone()):ob.material.clone(); }); H3G.add(cl); if(ch===crystalG.userData.cg) H3CG=cl; }
  if(H3CG) H3CG.children.forEach(s=>{ if(s.userData&&s.userData.a!==undefined) H3SH.push(s); }); }
let bar3=null; if(GOAL3>=0&&bar1B){ const b=bar1B.cloneNode(true); const i=b.querySelector('i'); if(i){ i.id='cbar3'; i.style.width='100%'; } const lbl=b.querySelector('b'); if(lbl) lbl.textContent='KEEP HEARTROOT'; const after=(bar2&&bar2.parentNode)||bar1B; after.parentNode.insertBefore(b,after.nextSibling); bar3=i; }
let last3=null, strip3T=0;
if(GOAL3>=0){ const prev=Meta.update; Meta.update=dt=>{ prev(dt); buildHeart3();
    if(H3CG){ H3CG.rotation.y=h2t*.7+1; H3CG.position.y=(crystalG.userData.cgY||2.7)+Math.sin(h2t*1.6+1)*.15+(crystal3Shake>0?(rnd()-.5)*.3:0); H3SH.forEach((s,k)=>{ const a=s.userData.a+h2t*1.4; s.position.set(Math.cos(a)*1.7,Math.sin(h2t*2+k)*.5,Math.sin(a)*1.7); }); }
    crystal3Shake=Math.max(0,crystal3Shake-dt); const c3=S.crystal3; if(bar3) bar3.style.width=Math.max(0,c3/CRYSTAL_MAX*100)+'%';
    const strip=document.getElementById('alarm'); if(last3!==null&&c3<last3&&c3>0&&(S.phase==='wave'||S.phase==='build')&&strip){ strip.textContent='⚠ THE KEEP HEARTROOT IS UNDER ATTACK'; strip.classList.add('on'); strip3T=2.5; }
    if(strip3T>0){ strip3T-=dt; if(strip3T<=0&&strip){ strip.classList.remove('on'); strip.textContent='⚠ THE HEARTROOT IS UNDER ATTACK'; } } last3=c3; }; }
window.__moatinn={ keep:()=>({ goal3:GOAL3>=0?[GOAL3%GW,(GOAL3/GW)|0]:null, h3:GOAL3>=0?H3Y:null, heart3:!!H3CG, bar3:!!bar3, keepSent:cnt.keep }), f3:()=>F3, info:()=>({ sent:cnt.sent, heart2:!!H2CG, bar2:!!bar2, goal2:[GOAL2%GW,(GOAL2/GW)|0], h2:hgt[GOAL2] }), f2:()=>F2, steps:(cx,cz,which)=>{ const F=which===2?F2.free:flowFree; let i=idx(cx,cz), n=0; while(i>=0&&!isGoal(i)&&n<900){ i=F.nxt[i]; n++; } return i>=0&&isGoal(i)?{ n, end:i===GOAL2?2:1 }:null; } };
})();
