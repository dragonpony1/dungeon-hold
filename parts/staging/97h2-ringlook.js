// ===== THE TWO PET RINGS LOOK DIFFERENT (build 512 prep). Matt: "Using malamute vs beast mode should have some cosmetic application", then on the plan: "That would be awesome", and
// "It's important on the ring card to mention these advantages". LOOKS AND SOUND ONLY -- no stat, damage, rate or range changes anywhere.
//  * BEAST MODE -- FERAL: both pets 15% bigger, a deep red-orange glow under each, a red rim (a thick red ink outline) and a red tint (the Meshy pets are one mesh each, so there are no eyes to
//    light; a procedural stand-in pet's eyes do glow red), and every pet hit flashes a red claw slash -- three quick streaks -- on the mob.
//  * MALAMUTE -- FROST WOLF: both pets get an icy blue glow with snowflakes drifting off them and a frosty white rim; every pet hit leaves a small frost burst; a soft wolf howl (WebAudio,
//    through the effects channel like every other SFX, silent with sound off) when a wave starts, once a wave.
//  * Applies to BOTH pets (the first and the 2nd one the ring opens) while the ring is worn; take it off and it all goes away (materials, size and glow put back).
//  * THE RING CARDS SAY SO in pictures, beside "🦉🦉 2 PETS": 🔥 FERAL · 🐾 bigger · 💢 claw hits / ❄️ FROST · ✨ snow glow · 🐺 howl -- on the bag and hover cards and the detail panel
//    (96f-tavernpics.js), the Tab sheet (68-paperdoll.js) and the pickup card (60-lootfeel.js).
//  * CO-OP: lookOf (99-network.js) carries rg (the ring's id); 98-party.js dresses a partner's puppet pets the same way; a partner's pet shots (99g2-petshots.js) flash his ring's hit where they land.
// Everything is pooled: the tinted/rim materials are cached per source material, the glow and snowflake sprites share module materials, the hit effects come from fixed pools.
// Test hook: window.__ringlook.
(function(){
'use strict';
const LOOKS={
  // tint: the body's emissive; fres/fresK: the rim light on its edges; rim/rimK: the ink outline's colour and thickness (kept near 1: a thick shell pokes through the Meshy pets' split faces)
  beast_mode:{ key:'feral', scale:1.15, tint:0x3a0800, fres:0xff2400, fresK:2.8, fresP:1.5, rim:0xff2400, rimK:1.35, eyes:0xff2a10, glow:[[0xff3a00,1.8,1,-.3],[0xff1a00,1.0,.95,-.22]], embers:6 },
  malamute:{ key:'frost', scale:1, tint:0x0c2c44, fres:0x8fe2ff, fresK:1.5, fresP:2.2, rim:0xe8f8ff, rimK:1.25, glow:[[0x3ab4ff,1.45,.9,-.2],[0xbfeaff,.6,.75,-.05]], flakes:8 } };
const isLook=v=>typeof v==='string'&&Object.prototype.hasOwnProperty.call(LOOKS,v);
let ON=true;   // test switch: false takes every cosmetic off (the stats check compares with and without)
const cnt={ claw:0, frost:0, howls:0, attached:0, detached:0 };
function myLook(){ if(!ON) return null; const c=gear.charm, R=window.__tworings; if(!c||!c.named||!isLook(c.named)) return null; if(R&&R.ringOn&&!R.ringOn()) return null; return c.named; }

// ---- shared textures and materials
function canvasTex(w,h,draw){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t; }
let FLAKE_T=null, STREAK_T=null;
function flakeTex(){ if(FLAKE_T) return FLAKE_T; FLAKE_T=canvasTex(64,64,(g,w)=>{ const r=g.createRadialGradient(32,32,0,32,32,30); r.addColorStop(0,'rgba(255,255,255,.55)'); r.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=r; g.fillRect(0,0,64,64);
  g.strokeStyle='#fff'; g.lineCap='round'; g.translate(32,32); for(let i=0;i<6;i++){ g.rotate(Math.PI/3); g.lineWidth=4; g.beginPath(); g.moveTo(0,0); g.lineTo(0,-25); g.stroke(); g.lineWidth=3; for(const y of [-11,-18]){ g.beginPath(); g.moveTo(0,y); g.lineTo(-6,y-6); g.moveTo(0,y); g.lineTo(6,y-6); g.stroke(); } } }); return FLAKE_T; }
function streakTex(){ if(STREAK_T) return STREAK_T; STREAK_T=canvasTex(32,128,g=>{ const gr=g.createLinearGradient(0,0,32,0); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(.5,'rgba(255,255,255,1)'); gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr; g.beginPath(); g.moveTo(16,0); g.quadraticCurveTo(31,58,16,128); g.quadraticCurveTo(1,58,16,0); g.fill(); }); return STREAK_T; }
const SPR={};   // one SpriteMaterial per glow colour / the flakes, shared by every pet wearing the look
function sprMat(k,col,op,map){ if(!SPR[k]) SPR[k]=new THREE.SpriteMaterial({map:map||GLOWT,color:C(col),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op}); return SPR[k]; }
const EYE={};
function eyeMat(col){ if(!EYE[col]) EYE[col]=new THREE.MeshBasicMaterial({color:C(col)}); return EYE[col]; }

// ---- the pet's own materials: a tinted copy of each body material with a rim light on its edges, and a recoloured copy of its ink outline, cached per source material and look.
// The pet animation (85b-petanim.js) lives in the material's onBeforeCompile and cache key -- a plain clone drops both, so they are carried over (and the rim added after) and the wings still beat.
const MCACHE=new Map();
function lookMat(m,look){ if(!m||(m.userData&&m.userData.rlLook)) return m; const L=LOOKS[look], key=m.uuid+'|'+look; let c=MCACHE.get(key); if(c) return c;
  const prevOBC=m.onBeforeCompile, pk=String(m.customProgramCacheKey?m.customProgramCacheKey():'');
  if(m.isShaderMaterial&&m.uniforms&&m.uniforms.col&&m.uniforms.t){ c=m.clone(); c.uniforms.col.value=C(L.rim); c.uniforms.t.value=m.uniforms.t.value*L.rimK; c.onBeforeCompile=prevOBC; if(m.hasOwnProperty('customProgramCacheKey')) c.customProgramCacheKey=m.customProgramCacheKey; }
  else if(m.emissive&&(m.isMeshToonMaterial||m.isMeshStandardMaterial||m.isMeshLambertMaterial||m.isMeshPhongMaterial)){ c=m.clone(); c.emissive=C(L.tint); c.emissiveIntensity=1; const rc=C(L.fres), k=L.fresK.toFixed(2);
    c.onBeforeCompile=function(sh,r){ if(prevOBC) prevOBC.call(this,sh,r); sh.uniforms.rlRim={value:rc};
      sh.fragmentShader=sh.fragmentShader.replace('void main() {','uniform vec3 rlRim;\nvoid main() {').replace('#include <tonemapping_fragment>','{ float rlF=1.0-abs(dot(normalize(normal),normalize(vViewPosition))); gl_FragColor.rgb+=rlRim*pow(rlF,'+L.fresP.toFixed(2)+')*'+k+'; }\n#include <tonemapping_fragment>'); };
    c.customProgramCacheKey=()=>'ringlook:'+look+':'+pk; }
  else return m;
  if(m.__petAnim) c.__petAnim=true; c.userData=Object.assign({},m.userData,{rlLook:look}); MCACHE.set(key,c); return c; }
const EYE_DARK=C(0x14101c); const isEye=o=>o.isMesh&&!o.isSprite&&o.userData.noOL&&o.material&&o.material.isMeshBasicMaterial&&o.material.color&&o.material.color.equals(EYE_DARK);   // 30-familiar.js famEye

// ---- dress a pet root (local or a partner's puppet pet): returns a handle; detach undoes it all
const ACTIVE=new Set(), FREE={beast_mode:[],malamute:[]};
function makeAura(look){ const L=LOOKS[look], g=new THREE.Group(); g.name='ringlook-aura'; const glows=[];
  L.glow.forEach(([col,s,op,y],i)=>{ const sp=new THREE.Sprite(sprMat(look+'g'+i,col,op)); sp.scale.set(s,s,1); sp.position.y=y; sp.userData.noOL=true; sp.userData.base=s; g.add(sp); glows.push(sp); });
  const flakes=[]; for(let i=0;i<(L.flakes||0);i++){ const sp=new THREE.Sprite(sprMat('flake',0xe6f8ff,.95,flakeTex())); sp.userData.noOL=true; sp.userData.ph=i/L.flakes; sp.userData.a=i*2.39996; sp.userData.r=.18+(i%3)*.06; sp.userData.sp=.42+(i%4)*.06; g.add(sp); flakes.push(sp); }
  for(let i=0;i<(L.embers||0);i++){ const sp=new THREE.Sprite(sprMat('ember',0xff5a10,1)); sp.userData.noOL=true; sp.userData.ember=true; sp.userData.ph=i/L.embers; sp.userData.a=i*2.39996; sp.userData.r=.16+(i%3)*.07; sp.userData.sp=.55+(i%4)*.08; g.add(sp); flakes.push(sp); }   // Beast Mode: embers rising off the pet
  return {g,glows,flakes,look}; }
function attach(root,look){ if(!root||!isLook(look)) return null; const L=LOOKS[look];
  const h={root,look,swaps:[],inner:root.children[0]||null,base:null,t:Math.random()*5};
  root.traverse(o=>{ if(!o.isMesh||o.isSprite) return; const mats=o.material; if(Array.isArray(mats)) return;
    if(L.eyes&&isEye(o)){ h.swaps.push([o,mats]); o.material=eyeMat(L.eyes); return; }
    const n=lookMat(mats,look); if(n!==mats){ h.swaps.push([o,mats]); o.material=n; } });
  if(h.inner&&L.scale!==1){ h.base=h.inner.scale.clone(); h.inner.scale.multiplyScalar(L.scale); }
  h.aura=FREE[look].pop()||makeAura(look); root.add(h.aura.g); ACTIVE.add(h); cnt.attached++; return h; }
function detach(h){ if(!h||!ACTIVE.has(h)) return; ACTIVE.delete(h); for(const [o,m] of h.swaps) o.material=m; h.swaps.length=0; if(h.inner&&h.base) h.inner.scale.copy(h.base);
  if(h.aura){ if(h.aura.g.parent) h.aura.g.parent.remove(h.aura.g); FREE[h.look].push(h.aura); h.aura=null; } cnt.detached++; }
function animate(h,dt){ h.t+=dt; const a=h.aura; if(!a) return; const pulse=1+Math.sin(h.t*2.6)*.08;
  for(const sp of a.glows){ const s=sp.userData.base*pulse; sp.scale.set(s,s,1); }
  for(const f of a.flakes){ const d=f.userData, u=(h.t*d.sp+d.ph)%1, ang=d.a+h.t*.7;
    if(d.ember){ const r=d.r*(1-u*.4); f.position.set(Math.cos(ang)*r,-.25+u*.95,Math.sin(ang)*r); const s=.26*Math.sin(u*Math.PI); f.scale.set(s,s,1); continue; }
    const r=d.r+u*.42; f.position.set(Math.cos(ang)*r,.12-u*.85+Math.sin(h.t*3+d.a)*.04,Math.sin(ang)*r); const s=.17*Math.sin(u*Math.PI); f.scale.set(s,s,1); } }

// ---- the local pets: both of them, while the ring is worn
const LOCAL=[null,null];
function petRoots(){ const R=window.__tworings; let f1=null, f2=null; try{ f1=(R&&R.fam1)?R.fam1():fam; f2=R&&R.fam2?R.fam2():null; }catch(e){} return [f1&&f1.g||null,f2&&f2.g||null]; }
function syncLocal(){ const lk=myLook(), roots=petRoots();
  for(let i=0;i<2;i++){ const h=LOCAL[i], r=roots[i]; if(h&&(h.root!==r||h.look!==lk||!ACTIVE.has(h))){ detach(h); LOCAL[i]=null; } if(r&&lk&&!LOCAL[i]) LOCAL[i]=attach(r,lk); } }
// a pet that goes away (gear change, the ring off, the hall ends) is undressed first: the procedural stand-in's teardown disposes basic and sprite materials, and those are shared here
{ const prev=famRemove; famRemove=function(){ if(fam&&fam.g){ for(let i=0;i<2;i++){ const h=LOCAL[i]; if(h&&h.root===fam.g){ detach(h); LOCAL[i]=null; } } for(const h of ACTIVE) if(h.root===fam.g) detach(h); } return prev.apply(this,arguments); }; }

// ---- hit effects (pooled): the claw slash and the frost burst
const PLANE=new THREE.PlaneGeometry(1,1); const FX={claw:[],frost:[]}, LIVE=[], MAXFX=10;
function makeClaw(){ const g=new THREE.Group(); g.name='ringlook-claw'; const outer=new THREE.MeshBasicMaterial({map:streakTex(),color:C(0xff2a00),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,depthTest:false,side:THREE.DoubleSide});
  const inner=new THREE.MeshBasicMaterial({map:streakTex(),color:C(0xffb040),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,depthTest:false,side:THREE.DoubleSide}); const st=[];
  for(let i=0;i<3;i++){ const L=i===1?1.35:1.1; const a=new THREE.Mesh(PLANE,outer), b=new THREE.Mesh(PLANE,inner); for(const m of [a,b]){ m.userData.noOL=true; m.renderOrder=20; m.frustumCulled=false; g.add(m); } st.push({a,b,x:(i-1)*.26,L,delay:i*.03}); }
  return {kind:'claw',g,mats:[outer,inner],st,t:0,life:.36,ang:0}; }
function makeFrost(){ const g=new THREE.Group(); g.name='ringlook-frost'; const gl=new THREE.SpriteMaterial({map:GLOWT,color:C(0x5cc4ff),blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,transparent:true});
  const fm=new THREE.SpriteMaterial({map:flakeTex(),color:C(0xf0fbff),blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,transparent:true});
  const rm=new THREE.MeshBasicMaterial({map:GLOWT,color:C(0x6fd0ff),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,depthTest:false,side:THREE.DoubleSide});
  const glow=new THREE.Sprite(gl), ring=new THREE.Mesh(RING_GEO(),rm); glow.renderOrder=ring.renderOrder=20; g.add(glow); g.add(ring); const flakes=[]; for(let i=0;i<7;i++){ const f=new THREE.Sprite(fm); f.renderOrder=21; f.userData.a=i*TAU/7; g.add(f); flakes.push(f); }
  g.traverse(o=>{ o.userData.noOL=true; o.frustumCulled=false; }); return {kind:'frost',g,mats:[gl,fm,rm],glow,ring,flakes,t:0,life:.55}; }
let RG=null; function RING_GEO(){ if(!RG) RG=new THREE.RingGeometry(.34,.5,24); return RG; }
function spawnFx(kind,x,y,z){ if(![x,y,z].every(Number.isFinite)) return null; const pool=FX[kind]; let f=pool.find(p=>!p.on);
  if(!f){ if(pool.length<MAXFX){ f=kind==='claw'?makeClaw():makeFrost(); pool.push(f); } else { f=pool.reduce((a,b)=>a.t>b.t?a:b); } }   // all busy: the oldest is reused
  f.on=true; f.t=0; f.g.position.set(x,y,z); f.ang=-.6+(Math.random()-.5)*.5; if(!f.g.parent) scene.add(f.g); if(!LIVE.includes(f)) LIVE.push(f); cnt[kind]++; fxTick(f,0); return f; }
function fxTick(f,dt){ f.t+=dt; const k=f.t/f.life; if(k>=1){ f.on=false; if(f.g.parent) f.g.parent.remove(f.g); return false; }
  f.g.quaternion.copy(camera.quaternion);
  if(f.kind==='claw'){ f.g.rotateZ(f.ang); const fade=f.t<.13?1:Math.max(0,1-(f.t-.13)/(f.life-.13)); f.mats[0].opacity=fade; f.mats[1].opacity=fade; const grow=1+k*.15;
    for(const s of f.st){ const d=Math.max(0,Math.min(1,(f.t-s.delay)/.07)), L=s.L*d*grow; for(const [m,w] of [[s.a,.3],[s.b,.09]]){ m.visible=d>0; m.scale.set(w*grow,Math.max(.001,L),1); m.position.set(s.x,(s.L*grow-L)/2,0); } } }
  else { const e=1-Math.pow(1-k,3), fade=1-k; f.mats[0].opacity=.95*fade; f.mats[1].opacity=fade; f.mats[2].opacity=.85*fade; const gs=.5+e*1.1; f.glow.scale.set(gs,gs,1); const rs=.35+e*1.15; f.ring.scale.set(rs,rs,1);
    f.mats[1].rotation=k*1.6; for(const fl of f.flakes){ const r=.1+e*.75; fl.position.set(Math.cos(fl.userData.a)*r,Math.sin(fl.userData.a)*r,0); const s=.3*(1-k*.5); fl.scale.set(s,s,1); } }
  return true; }
function fxUpdate(dt){ for(let i=LIVE.length-1;i>=0;i--){ if(!LIVE[i].on||!fxTick(LIVE[i],dt)) LIVE.splice(i,1); } }
function hitFx(look,x,y,z){ if(!isLook(look)) return null; return spawnFx(look==='beast_mode'?'claw':'frost',x,y,z); }
// where a local pet's shot lands (famLand: the Wisp's bolt, the Sprite's darts, the Owl's beam and the Drake's bolt on their first mob, the Bat's bite, the Trimaw's breaths) -- on the mob it hit
function foeAt(x,z){ let best=null, bd=2.2; let list=enemies; try{ list=famFoes(); }catch(e){} for(const e of list){ if(!e||e.dead) continue; const d=Math.hypot(e.x-x,e.z-z); if(d<bd){ bd=d; best=e; } } return best; }
function hitAt(x,y,z){ const lk=myLook(); if(!lk) return null; return hitFx(lk,x,y,z); }
function landHit(x,z){ const lk=myLook(); if(!lk||!Number.isFinite(x)||!Number.isFinite(z)) return; const e=foeAt(x,z); const y=e?(e.y||0)+(e.h||1.2)*.55:(hero.y||0)+1; hitFx(lk,e?e.x:x,y,e?e.z:z); }
{ const prev=famLand; famLand=function(x,z,dmg){ const r=prev.apply(this,arguments); try{ landHit(x,z); }catch(e){} return r; }; }

// ---- the howl: Malamute worn, once as each wave starts. Soft: under the hit blip's loudness, through the effects channel (the sound menu's slider), nothing with sound off.
let lastWave=null;
function howl(){ const a=A(); if(!a) return false; try{ const t0=a.currentTime+.04, out=SFXOUT(a);
    const g=a.createGain(); g.gain.setValueAtTime(.0001,t0); g.gain.exponentialRampToValueAtTime(.045,t0+.4); g.gain.setValueAtTime(.045,t0+1.15); g.gain.exponentialRampToValueAtTime(.0001,t0+2.4);
    const lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1500; lp.Q.value=.8;
    const dl=a.createDelay(1), fb=a.createGain(), wet=a.createGain(); dl.delayTime.value=.3; fb.gain.value=.28; wet.gain.value=.35;   // a far-off echo off the hall walls
    const lfo=a.createOscillator(), ld=a.createGain(); lfo.frequency.value=5.2; ld.gain.setValueAtTime(0,t0); ld.gain.linearRampToValueAtTime(9,t0+1.4);
    const v=[['triangle',1,1],['sine',2,.28],['sawtooth',1,.06]], oscs=[];
    for(const [type,mul,vol] of v){ const o=a.createOscillator(), og=a.createGain(); o.type=type; const f=o.frequency; f.setValueAtTime(330*mul,t0); f.exponentialRampToValueAtTime(560*mul,t0+.5); f.linearRampToValueAtTime(600*mul,t0+1.2); f.exponentialRampToValueAtTime(370*mul,t0+2.35);
      og.gain.value=vol; lfo.connect(ld); ld.connect(f); o.connect(og).connect(g); oscs.push(o); }
    g.connect(lp); lp.connect(out); lp.connect(dl); dl.connect(fb).connect(dl); dl.connect(wet).connect(out);
    lfo.start(t0); lfo.stop(t0+2.5); for(const o of oscs){ o.start(t0); o.stop(t0+2.5); } cnt.howls++; return true; }catch(e){ return false; } }
// a wave number not howled for yet; a lost or won run, or a new one (the wave count back down), starts the count over
function waveWatch(){ const w=S.wave|0; if(S.phase!=='wave'){ if(lastWave!==null&&(S.phase==='dead'||S.phase==='won'||S.phase==='deathcut'||w<lastWave)) lastWave=null; return; } if(lastWave===w) return; lastWave=w; if(myLook()==='malamute') howl(); }

// ---- every frame
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); try{ syncLocal(); for(const h of ACTIVE) animate(h,dt); fxUpdate(dt); waveWatch(); }catch(e){ console.warn('ring look',e); } }; }

// ---- the card chips: pictures, beside 2 PETS
const CHIPS={ beast_mode:{cls:'rl-feral',tip:'Looks only: both pets grow bigger, glow deep red-orange with a red rim, and every pet hit flashes a claw slash',items:['🔥 FERAL','🐾 bigger','💢 claw hits']},
  malamute:{cls:'rl-frost',tip:'Looks only: both pets glow icy blue with drifting snowflakes and a frosty rim, every pet hit leaves a frost burst, and a wolf howls as each wave starts',items:['❄️ FROST','✨ snow glow','🐺 howl']} };
{ const st=document.createElement('style'); st.textContent='.tvp-c.rl-feral{border-color:#ff5a24!important;color:#ffd0b8!important;background:#3a0d05!important}.tvp-c.rl-feral.main{color:#ff8a4a!important;font-weight:800;box-shadow:0 0 6px #ff3a0088}'+
  '.tvp-c.rl-frost{border-color:#8fdcff!important;color:#e6f9ff!important;background:#0b2436!important}.tvp-c.rl-frost.main{color:#bff0ff!important;font-weight:800;box-shadow:0 0 6px #5fc8ff88}'+
  '.rl-chips{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px}.rl-chips .tvp-c{background:#120c1a;border:1px solid #4a3a54;border-radius:10px;padding:0 6px;font:bold 12px/18px system-ui,sans-serif;color:#f0e0c8;white-space:nowrap}'+
  '.rl-chips .tvp-c.two{border-color:#5ff0ff;color:#bff8ff;background:#0e2a33;font-weight:800}'; document.head.appendChild(st); }
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function chip(it){ const c=it&&isLook(it.named)&&CHIPS[it.named]; if(!c) return ''; return c.items.map((t,i)=>'<span class="tvp-c '+c.cls+(i?'':' main')+'" title="'+esc(c.tip)+'">'+t+'</span>').join(''); }
// a whole row for a card that has no picture chips of its own (the Tab sheet, the pickup card): 2 PETS and the look
function cardChips(it){ const c=chip(it); if(!c) return ''; return '<div class="rl-chips tvp-chips"><span class="tvp-c two" title="Wear it and a SECOND familiar slot opens: two pets, one at each shoulder">🦉🦉 2 PETS</span>'+c+'</div>'; }

window.__ringlook={ LOOKS, mine:myLook, chip, cardChips, attach, detach, hitFx, hitAt, howl, enabled:v=>{ ON=!!v; syncLocal(); return ON; },
  info:()=>{ const roots=petRoots(); const pet=(r,i)=>{ const h=LOCAL[i]; if(!r) return null; let rim=0, tint=0, eyes=0; r.traverse(o=>{ if(!o.isMesh||!o.material||!o.material.userData) return; if(o.material.userData.rlLook){ if(o.userData.isOL) rim++; else tint++; } if(Object.values(EYE).includes(o.material)) eyes++; });
      const a=h&&h.aura; return { look:h?h.look:null, scale:h&&h.inner&&h.base?+(h.inner.scale.x/h.base.x).toFixed(3):1, glow:a?a.glows.length:0, glowInPet:!!(a&&a.g.parent===r), flakes:a?a.flakes.filter(f=>!f.userData.ember).length:0, embers:a?a.flakes.filter(f=>f.userData.ember).length:0, flakeShown:a?a.flakes.filter(f=>f.scale.x>.01).length:0, rim, tint, eyes }; };
    return Object.assign({ look:myLook(), pets:[pet(roots[0],0),pet(roots[1],1)], active:ACTIVE.size, pool:{claw:FX.claw.length,frost:FX.frost.length}, live:LIVE.length, mats:MCACHE.size },cnt); },
  pools:()=>({claw:FX.claw.map(f=>f.g.uuid),frost:FX.frost.map(f=>f.g.uuid)}), cnt };
})();
