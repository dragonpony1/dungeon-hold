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
let P=null;
function load(){ if(MOBGLB[K]) return Promise.resolve(); if(P) return P;
  P=fetchBytes(ASSET('direwolf.glb')).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{
      const root=g.scene||g.scenes[0]; fixMats(root); const fit=fitModel(root,MOBDIM[K].fit); toonify(root,fit.scale); const A=n=>(g.animations||[]).find(c=>c.name===n);
      MOBGLB[K]={wrap:fit.wrap,map:{walk:A('Walk'),run:A('Run'),attack:A('Bite'),idle:A('Idle')},scale:fit.scale}; })
    .catch(e=>{ console.warn('dire wolf model',e); P=null; });
  return P; }
window.__direwolf={load,loaded:()=>!!MOBGLB[K],kind:K};
})();
