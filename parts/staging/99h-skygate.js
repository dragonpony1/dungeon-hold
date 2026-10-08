// ===== THE DRAWBRIDGE'S SKY GATE (build 461). Matt, watching a line of drakes come in for the keep Heartroot: "add coming in from the opposite direction, maybe that's in the next wave".
// From the map's second wave on, every other flyer (drakes, moths -- not the Phase Wraith, not a boss) comes in from the NORTH instead: it rises out over the far north-east corner of the castle wall
// (MAP.skyGate.at, the map's own numbers) at roof height and makes for the keep Heartroot from there, so the flying line is pinched from both sides. Last in the module order on purpose: the bosses and
// specials that borrow a lane from the wave's queue (95d, 95g, 95s, 95t) have already picked theirs from the ordinary gates before any flyer is moved here. Test hook: window.__skygate.
(function(){
'use strict';
window.__skygate={ info:()=>null };
const SG=MAP&&MAP.skyGate; if(!SG||!Array.isArray(SG.at)) return;
const P=MAP.padN|0, FROM=SG.from||2, cnt={ sent:0 };
const isFlyer=k=>!!(MOBS[k]&&MOBS[k].fly)&&k!=='wraith';
{ const prev=waveComp; waveComp=function(w){ const c=prev.apply(this,arguments); if(!c||!Array.isArray(c.q)||TUTORIAL||SURVIVAL) return c; if(w-(MAP.wbase|0)<FROM) return c;
    let k=0; const q=c.q.map(x=>(x&&isFlyer(x.kind)&&(k++%2===1))?Object.assign({},x,{lane:'SKY'}):x); return Object.assign({},c,{q}); }; }
{ const prev=spawnEnemy; spawnEnemy=function(kind,lane){ if(lane!=='SKY') return prev.apply(this,arguments);
    const n0=enemies.length; const r=prev.call(this,kind,SG.via||Object.keys(LANES)[0]); const hy=MAP.crystal3Y!=null?MAP.crystal3Y+2:WALLH;
    for(let i=n0;i<enemies.length;i++){ const e=enemies[i]; if(!e) continue; e.x=cw(SG.at[0])+(Math.random()-.5)*3; e.z=cwz(SG.at[1]+P)+(Math.random()-.5)*3; e.y=Math.max(e.y||0,hy); e.skyGate=true; cnt.sent++; onRoute(e); }
    return r; }; }
// build 594 (Matt, F9 square 47,1 at 16 up: 'at the end of each wave there are flying mobs stuck right here'): the scatter round the gate could set a flyer over a cell its flight field
// does not reach, or tight against the castle's corner where a drake's body over the wall pinned it (moveCircle) -- so it hung there for good. A flyer that lands like that moves to the
// nearest cell that is on its field with open air all round (the gate's spot itself first).
function onRoute(e){ const F=e.fFly||flowFly; if(!F||!F.nxt) return; const open=(x,z)=>inb(x,z)&&(walk(gat(x,z))||gat(x,z)===T.WATER);   /* what a flyer may cross (solidAt) */
  const clear=(x,z)=>{ for(let dz=-1;dz<=1;dz++) for(let dx=-1;dx<=1;dx++) if(!open(x+dx,z+dz)) return false; return true; };   /* and room round it: a drake's body over a wall cell pins it (moveCircle) */
  const ok=i=>i>=0&&(isGoal(i)||F.nxt[i]>=0)&&clear(i%GW,(i/GW)|0); let cx=wc(e.x), cz=wcz(e.z); if(ok(idx(cx,cz))) return;
  for(let r=0;r<=8;r++){ let best=null, bd=1e9; for(let dz=-r;dz<=r;dz++) for(let dx=-r;dx<=r;dx++){ if(Math.max(Math.abs(dx),Math.abs(dz))!==r) continue; const x=cx+dx, z=cz+dz; if(x<0||z<0||x>=GW||z>=GH) continue; const i=idx(x,z); if(!ok(i)) continue; const d=dx*dx+dz*dz; if(d<bd){ bd=d; best=[x,z]; } }
    if(best){ e.x=cw(best[0]); e.z=cwz(best[1]); cnt.moved=(cnt.moved|0)+1; return; } } }
window.__skygate={ info:()=>Object.assign({ at:SG.at, from:FROM },cnt) };
})();
