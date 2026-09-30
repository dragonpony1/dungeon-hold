// ===== THE DIRE WOLF (build 316). Matt's Hi3D wolf ("direwolf running.glb" in Pictures/dungeon art,/mobs/direWolf: 9,500 triangles, a 32-bone four-legged rig, Bite 1.0 s, Idle 2.0 s,
// Run .77 s, Walk 1.23 s, all running in place; its 8K textures cut to 1K -> parts/assets/direwolf.glb, 1.0 MB). Matt: "ok i am gonna go in and spawn some wolves, if i like it well uses this starting
// wave 3 in the cloister, wolves drop frost gear set" -- so for now it is a mob the dev panel can spawn (F9 -> spawn now), and in no wave yet. Its model loads the first time one is asked for.
// A fast pack hunter between a goblin and an orc: quicker than either (not a stickman's sprint), a light bite; no death clip, so it shrinks away like the others.
(function(){
'use strict';
const K='direwolf';
MOBDIM[K]={fit:1.5,h:1.3,r:.62,nat:{walk:.8,run:2.4}};   // fit = its height (ears up); a body about a goblin tall and two units long
MOBS[K]={hp:30,spd:4.6,dmg:5,cd:1.1,mana:3,detour:2,swingT:.8,hitT:.4};   // the whole Bite over .8 s, the snap landing at half way
if(Meta.XP) Meta.XP[K]=Meta.XP[K]||3;
function fixMats(root){ root.traverse(o=>{ if(o.isMesh&&o.material){ o.material.metalness=0; o.material.roughness=.85; if(o.material.emissive) o.material.emissive.setRGB(0,0,0); } }); }   // its metal/rough map would read as dark metal under the hall's lights
const WOLF_GLOW=.55;
let P=null;
function load(){ if(MOBGLB[K]) return Promise.resolve(); if(P) return P;
  P=fetchBytes(ASSET('direwolf.glb')).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{
      const root=g.scene||g.scenes[0]; fixMats(root); const fit=fitModel(root,MOBDIM[K].fit); toonify(root,fit.scale);
      // build 318 (Matt: "dire wolves come out nice but too dark to see their detail"): a soft glow of its own fur and moss (the topiaries' night-garden fix, 56d-courtdecor.js), so the dark coat reads
      root.traverse(o=>{ if(o.isMesh&&!o.userData.isOL&&o.material&&o.material.map&&o.material.emissive){ o.material.emissiveMap=o.material.map; o.material.emissive.setRGB(WOLF_GLOW,WOLF_GLOW,WOLF_GLOW); o.material.needsUpdate=true; } }); const A=n=>(g.animations||[]).find(c=>c.name===n);
      MOBGLB[K]={wrap:fit.wrap,map:{walk:A('Walk'),run:A('Run'),attack:A('Bite'),idle:A('Idle')},scale:fit.scale}; })
    .catch(e=>{ console.warn('dire wolf model',e); P=null; });
  return P; }
// build 318 (Matt: "the dire wolves seem to come out in a nice neat line ... it looks unatrual"): every mob steers from one lane cell's centre to the next, so a fast pack threads onto one
// centre line. Each wolf keeps its own place across the lane instead (some left, some right, up to .8 of a 2-unit cell) with a slow weave, and runs at its own pace, so they fan out like a pack
const SPOTS=[-.8,.4,-.4,.8,0]; let wolfN=0;   // each new wolf takes the next place across the lane (left, right, middle...), so any pack of them spreads -- five random picks sometimes bunched
{ const prev=updateEnemies; updateEnemies=function(dt){ prev(dt); for(const e of enemies){ if(e.kind!==K||e.dead) continue; if(e.lane===undefined){ e.lane=SPOTS[(wolfN++)%SPOTS.length]+R(-.12,.12); e.wph=Math.random()*TAU; e.spd*=R(.92,1.1); }
    if(!e.walking||e.swing>=0) continue; const fx=Math.sin(e.yaw), fz=Math.cos(e.yaw), rx=fz, rz=-fx; const off=(e.x-cw(wc(e.x)))*rx+(e.z-cwz(wcz(e.z)))*rz; const want=e.lane+Math.sin(S.t*1.3+e.wph)*.3;
    const push=clamp(want-off,-1,1)*2.4*dt; moveCircle(e,rx*push,rz*push,e.r*.8,false); } }; }
window.__direwolf={load,loaded:()=>!!MOBGLB[K],kind:K,glow:()=>{ let v=null; if(MOBGLB[K]) MOBGLB[K].wrap.traverse(o=>{ if(v===null&&o.isMesh&&!o.userData.isOL&&o.material&&o.material.emissiveMap) v=o.material.emissive.r; }); return v; }};
})();
