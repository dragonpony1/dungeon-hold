// ===== THE CORRUPTOR OF FATE (build 365 stand-in, build 366 the real rigged one). Bob's game kit (hi3d-corruptor-game.glb, Pictures/dungeon art,/mobs/corrupter of fate/hi3d-corruptor-game-kit.zip): 10,992 triangles (from his 2,000,000
// sculpt), two 1024 textures, a custom 17-joint FOUR-ARM skeleton, six clips at 30 fps -- idle 3.0 s (loop), walk 2.0 s (loop, an in-place floating glide), attack 1.4 s (a swing of the shears), roar 2.4 s, death 2.4 s (falls and
// holds), cast 2.8 s (all four arms raised) -> parts/assets/prison-corruptor.glb, 3.3 MB. (The stand-in it replaced was the raw sculpt simplified by me, one mesh in a T-pose that hovered; Matt: "Yeah a stand in might be good for now".)
// The clips are wired as the other mobs': idle/walk/attack/death, its roar as the shout the game plays when a boss first comes into view and again at half health, and CAST for any time it is `casting` (the gate switch of
// 95l-fate.js, the build-up of the wall's cutscene in 56i): one-shot, it holds the arms-raised pose until casting ends. Its blow is a SNIP: two crossing violet streaks (the shears closing) where it lands; its roar a violet burst and
// a ring over the floor. A violet glow gathers at its chest while it casts. Slain, its fall plays at double speed (the game removes a dead mob after 1.25 s) and it drops two good pieces. The boss of the big barrier's cutscene and
// a mob the dev panel (F9) can spawn on any map. Test hook: window.__corruptor.
(function(){
'use strict';
const K='corruptor';
MOBDIM[K]={ fit:4.3, h:4.3, r:1.0, nat:{ walk:.35, run:.35 } };   // fit = its height (hood to feet), the arms and shears hang beside it
MOBS[K]={ hp:700, spd:1.5, dmg:26, cd:2.4, mana:60, detour:0, swingT:1.4, hitT:.7 };   // the whole attack clip over 1.4 s, the shears closing at the middle of it
if(Meta.XP) Meta.XP[K]=Meta.XP[K]||60;
const cnt={ loaded:0, spawned:0, snips:0, bursts:0, drops:0 };
let P=null;
function fixMats(root){ root.traverse(o=>{ if(o.isMesh&&o.material){ o.material.metalness=0; o.material.roughness=.85; if(o.material.emissive) o.material.emissive.setRGB(0,0,0); } }); }   // its metal/rough map would read as dark metal under the hall's lights
function load(){ if(MOBGLB[K]) return Promise.resolve(); if(P) return P;
  P=fetchBytes(ASSET('prison-corruptor.glb')).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{
      const root=g.scene||g.scenes[0]; fixMats(root); const fit=fitModel(root,MOBDIM[K].fit); toonify(root,fit.scale);
      // a soft glow of its own paint, so the dark robes read in the gloom (as the wolves)
      root.traverse(o=>{ if(o.isMesh&&!o.userData.isOL&&o.material&&o.material.map&&o.material.emissive){ o.material.emissiveMap=o.material.map; o.material.emissive.setRGB(.6,.6,.6); o.material.needsUpdate=true; } });
      const A=n=>(g.animations||[]).find(c=>c.name===n);
      MOBGLB[K]={ wrap:fit.wrap, map:{ idle:A('idle'), walk:A('walk'), run:A('walk'), attack:A('attack'), shout:A('roar'), death:A('death'), cast:A('cast') }, scale:fit.scale }; cnt.loaded=1; })
    .catch(e=>{ console.warn('corruptor model',e); P=null; });
  return P; }
if(MAP&&MAP.id==='prison') setTimeout(load,3000);
{ const prev=spawnEnemy; spawnEnemy=function(kind,lane){ if(kind===K&&!MOBGLB[K]){ load().then(()=>{ if(MOBGLB[K]) spawnEnemy(kind,lane); }); return null; } const r=prev.apply(this,arguments);
    if(kind===K&&r){ cnt.spawned++; const c=r.mdl&&r.mdl.actions&&r.mdl.actions.cast; if(c){ c.setLoop(THREE.LoopOnce,1); c.clampWhenFinished=true; } } return r; }; }
// ---- its animation: CAST while it is casting (held at the end), its fall at double speed
{ const prev=mobAnim; mobAnim=function(e,dt){ if(e&&e.kind===K&&e.mdl&&e.mdl.actions){ const A=e.mdl.actions, m=e.mdl;
      if(!e.dead&&e.casting&&A.cast){ if(m.cur!==A.cast) mobPlay(m,'cast',{ restart:true, fade:.25 }); m.mixer.update(dt); return; }
      const r=prev.apply(this,arguments); if(e.dead&&A.death&&m.cur===A.death) A.death.timeScale=2; return r; }
    return prev.apply(this,arguments); }; }
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
// ---- per frame: the chest glow while casting; the snip and burst effects
WORLDANIM.push(dt=>{
  for(const e of enemies){ if(e.kind!==K||!e.mdl||e.dead) continue; const g=e.mdl.g;
    e.castK=(e.castK||0)+((e.casting?1:0)-(e.castK||0))*Math.min(1,dt*4);
    if(!e.castG){ e.castG=glow(0xc040ff,6/Math.max(.01,e.sc||1),.001); e.castG.position.y=e.h*.62/Math.max(.01,e.sc||1); e.castG.visible=false; g.add(e.castG); } e.castG.visible=e.castK>.02; if(e.castG.visible) e.castG.material.opacity=.7*e.castK*(.75+.25*Math.sin(S.t*14)); }
  for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.t+=dt; const k=Math.min(1,f.t/f.life);
    if(f.kind==='streak'){ f.o.material.opacity=.95*(1-k); f.o.scale.set(7+k*3,1*(1-k*.6),1); }
    else if(f.kind==='glow'){ f.o.material.opacity=.9*(1-k); f.o.scale.setScalar(f.s0+(f.s1-f.s0)*k); }
    else if(f.kind==='ring'){ f.o.scale.setScalar(1+k*22); f.o.material.opacity=.85*(1-k); }
    if(k>=1){ if(f.o.parent) f.o.parent.remove(f.o); if(f.o.material) f.o.material.dispose(); fx.splice(i,1); } } });
window.__corruptor={ load, loaded:()=>!!MOBGLB[K], snip, burst, info:()=>Object.assign({ fx:fx.length, alive:enemies.filter(e=>e.kind===K&&!e.dead).length },cnt) };
})();
