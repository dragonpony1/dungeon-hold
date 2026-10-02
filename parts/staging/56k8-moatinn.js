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
const P=MAP.padN|0, L2=new Set(MAP.goal2Lanes), cnt={ sent:0 };
if(Array.isArray(MAP.mobRamp)){ const [x0,x1,z0,z1]=MAP.mobRamp; RAMPOK=new Uint8Array(GW*GH); for(let z=z0+P;z<=z1+P;z++) for(let x=x0;x<=x1;x++) if(inb(x,z)) RAMPOK[idx(x,z)]=1; }
let F2=null;
function aim(e){ if(!F2) return; e.fF=F2.free; e.fD=F2.def; e.fFly=F2.fly; }
function fields(){ flowFree=bfs(false,false,GOAL); flowDef=bfs(true,false,GOAL); flowFly=bfs(false,true,GOAL); F2={ free:bfs(false,false,GOAL2), def:bfs(true,false,GOAL2), fly:bfs(false,true,GOAL2) }; for(const e of enemies) if(e.goal2) aim(e); }
{ const prev=reflow; reflow=function(){ prev.apply(this,arguments); fields(); }; }
reflow();
{ const prev=spawnEnemy; spawnEnemy=function(kind,lane){ const n0=enemies.length; const r=prev.apply(this,arguments); if(L2.has(lane)) for(let i=n0;i<enemies.length;i++){ const e=enemies[i]; if(e&&!e.goal2){ e.goal2=true; aim(e); cnt.sent++; } } return r; }; }
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
window.__moatinn={ info:()=>({ sent:cnt.sent, heart2:!!H2CG, bar2:!!bar2, goal2:[GOAL2%GW,(GOAL2/GW)|0], h2:hgt[GOAL2] }), f2:()=>F2, steps:(cx,cz,which)=>{ const F=which===2?F2.free:flowFree; let i=idx(cx,cz), n=0; while(i>=0&&!isGoal(i)&&n<900){ i=F.nxt[i]; n++; } return i>=0&&isGoal(i)?{ n, end:i===GOAL2?2:1 }:null; } };
})();
