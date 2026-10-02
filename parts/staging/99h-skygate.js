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
    for(let i=n0;i<enemies.length;i++){ const e=enemies[i]; if(!e) continue; e.x=cw(SG.at[0])+(Math.random()-.5)*3; e.z=cwz(SG.at[1]+P)+(Math.random()-.5)*3; e.y=Math.max(e.y||0,hy); e.skyGate=true; cnt.sent++; }
    return r; }; }
window.__skygate={ info:()=>Object.assign({ at:SG.at, from:FROM },cnt) };
})();
