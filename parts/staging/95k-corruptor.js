// ===== THE CORRUPTOR OF FATE, a STAND-IN (build 365). Bob's first pass (hi3d-corruptor-of-fate_1.glb, Pictures/dungeon art,/mobs/corrupter of fate: a RAW sculpt -- 221 MB, 2,000,000 triangles, 8K textures, no skeleton, no
// animation) welded and simplified to 11,782 triangles with its uvs held (meshoptimizer; the tattered robes, the cracked clock-face mask, the four arms and the two rusted shears all survive) and its textures cut to 1K ->
// parts/assets/prison-corruptor.glb, 0.8 MB. Matt: "Yeah a stand in might be good for now". It cannot move its limbs (it is one mesh in a T-pose), so it HOVERS: a slow bob a unit off the floor, a sway, a lean into a blow,
// its shadow left on the floor beneath. Its blow is a SNIP: two crossing violet streaks (the shears closing) where it lands. It is the boss of the big barrier's cutscene (56i-prisonbarrier.js) and a mob the dev panel (F9)
// can spawn on any map. When Bob's rigged one arrives only the model and the clips change.
// Test hook: window.__corruptor.
(function(){
'use strict';
const K='corruptor';
MOBDIM[K]={ fit:4.3, h:4.3, r:1.0, nat:{ walk:.35, run:.35 } };   // fit = its height (hood to feet); the arms spread wider than that
MOBS[K]={ hp:700, spd:1.5, dmg:26, cd:2.4, mana:60, detour:0, swingT:1.0, hitT:.5 };
if(Meta.XP) Meta.XP[K]=Meta.XP[K]||60;
const cnt={ loaded:0, spawned:0, snips:0, bursts:0, drops:0 };
const HOVER=1.05;
let P=null;
function fixMats(root){ root.traverse(o=>{ if(o.isMesh&&o.material){ o.material.metalness=0; o.material.roughness=.85; if(o.material.emissive) o.material.emissive.setRGB(0,0,0); } }); }
function load(){ if(MOBGLB[K]) return Promise.resolve(); if(P) return P;
  P=fetchBytes(ASSET('prison-corruptor.glb')).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{
      const root=g.scene||g.scenes[0]; fixMats(root); const fit=fitModel(root,MOBDIM[K].fit); toonify(root,fit.scale);
      // a soft glow of its own paint, so the dark robes read in the gloom (as the wolves)
      root.traverse(o=>{ if(o.isMesh&&!o.userData.isOL&&o.material&&o.material.map&&o.material.emissive){ o.material.emissiveMap=o.material.map; o.material.emissive.setRGB(.6,.6,.6); o.material.needsUpdate=true; } });
      MOBGLB[K]={ wrap:fit.wrap, map:{}, scale:fit.scale }; cnt.loaded=1; })
    .catch(e=>{ console.warn('corruptor model',e); P=null; });
  return P; }
if(MAP&&MAP.id==='prison') setTimeout(load,3000);
{ const prev=spawnEnemy; spawnEnemy=function(kind,lane){ if(kind===K&&!MOBGLB[K]){ load().then(()=>{ if(MOBGLB[K]) spawnEnemy(kind,lane); }); return null; } const r=prev.apply(this,arguments); if(kind===K&&r) cnt.spawned++; return r; }; }
// ---- the snip: two violet streaks crossing, a flash behind them
let streak=null; function streakTex(){ if(streak) return streak; const c=document.createElement('canvas'); c.width=256; c.height=32; const g=c.getContext('2d'); const gr=g.createLinearGradient(0,0,256,0); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(.5,'rgba(255,255,255,1)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.beginPath(); g.moveTo(0,16); g.lineTo(128,3); g.lineTo(256,16); g.lineTo(128,29); g.closePath(); g.fill(); streak=new THREE.CanvasTexture(c); return streak; }
const fx=[];
function snip(x,y,z){ cnt.snips++; for(const a of [.62,-.62]){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({ map:streakTex(), color:C(0xe0a0ff), blending:THREE.AdditiveBlending, depthWrite:false, transparent:true, opacity:.95 })); sp.material.rotation=a; sp.scale.set(7,1,1); sp.position.set(x,y,z); sp.userData.noOL=true; scene.add(sp); fx.push({ o:sp, t:0, life:.42, kind:'streak' }); }
  const gl=glow(0xc040ff,6,.001); gl.position.set(x,y,z); scene.add(gl); fx.push({ o:gl, t:0, life:.5, kind:'glow', s0:6, s1:13 }); }
// a burst where it roars: a big violet flash and a ring racing out over the floor
function burst(x,y,z){ cnt.bursts++; const gl=glow(0xc040ff,6,.001); gl.position.set(x,y+1.5,z); scene.add(gl); fx.push({ o:gl, t:0, life:.9, kind:'glow', s0:6, s1:26 });
  const rg=new THREE.Mesh(new THREE.RingGeometry(.85,1,48),new THREE.MeshBasicMaterial({ color:C(0xb050ff), transparent:true, opacity:.85, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide })); rg.rotation.x=-PI/2; rg.position.set(x,(typeof floorH==='function'?floorH(x,z):y)+.12,z); rg.userData.noOL=true; scene.add(rg); fx.push({ o:rg, t:0, life:1.0, kind:'ring' }); }
{ const prev=landHit; landHit=function(e,tg){ if(e&&e.kind===K&&tg) snip(tg.x||e.x,(tg.kind==='hero'?(tg.hero&&tg.hero.y)||0:0)+1.8,tg.z||e.z); return prev.apply(this,arguments); }; }
// slain, it drops two good pieces
{ const prev=kill; kill=function(e){ const was=e&&!e.dead; const r=prev.apply(this,arguments); if(was&&e.dead&&e.kind===K){ cnt.drops++; try{ for(let i=0;i<2;i++) dropLoot(rollItem(2),e.x+R(-1,1),e.z+R(-1,1)); burst(e.x,e.y||0,e.z); }catch(er){ console.warn('corruptor drop',er); } } return r; }; }
// ---- per frame: the hover, the sway, the lean into a blow; the snip and burst effects
WORLDANIM.push(dt=>{
  for(const e of enemies){ if(e.kind!==K||!e.mdl||e.dead) continue; const g=e.mdl.g, t=S.t*1.6+(e.ph||0), h=HOVER+Math.sin(t)*.22; e.lift=h; g.position.y=(e.y||0)+h;
    const sw=e.swing>=0?Math.sin(Math.min(1,e.swing/(MOBS[K].swingT||1))*PI):0; g.rotation.z=Math.sin(t*.7)*.05; g.rotation.x=(e.walking?.09:0)+sw*.5;
    if(!e.blobM){ e.blobM=g.children.find(c=>c.isMesh&&c.geometry&&c.geometry.type==='CircleGeometry')||null; } if(e.blobM) e.blobM.position.y=-h/Math.max(.01,g.scale.y)+.04; }
  for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.t+=dt; const k=Math.min(1,f.t/f.life);
    if(f.kind==='streak'){ f.o.material.opacity=.95*(1-k); f.o.scale.set(7+k*3,1*(1-k*.6),1); }
    else if(f.kind==='glow'){ f.o.material.opacity=.9*(1-k); f.o.scale.setScalar(f.s0+(f.s1-f.s0)*k); }
    else if(f.kind==='ring'){ f.o.scale.setScalar(1+k*22); f.o.material.opacity=.85*(1-k); }
    if(k>=1){ if(f.o.parent) f.o.parent.remove(f.o); if(f.o.material) f.o.material.dispose(); fx.splice(i,1); } } });
window.__corruptor={ load, loaded:()=>!!MOBGLB[K], snip, burst, hover:HOVER, info:()=>Object.assign({ fx:fx.length, alive:enemies.filter(e=>e.kind===K&&!e.dead).length },cnt) };
})();
