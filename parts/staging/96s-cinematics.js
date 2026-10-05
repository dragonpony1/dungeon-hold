// ===== CINEMATICS -- THE FRAMEWORK (build 535 prep). Matt wants a series of story scenes (memory: rootgate-cinematics.md -- a prologue, one between each map, the ending), and he had a vision of the
// first one himself: "I keep having a vision on one of the cinematic scenes you make have it come in dark then a light in the distance then as it gets closer its the fire from the torches in that long line
// of goblins and orcs coming in in that last map" (that scene is 96s2-torchline.js). This file is the part every scene shares, the same ideas Avery's cut (95u) and Sir Bullion's (95v) use, made general:
//   * CINE.register(id, { title, sub, map, pic, dur, when, ready, setup, step, teardown })   -- a scene. map: the MAP.id it is filmed on; pic: a frame of it in assets/ for the gallery card;
//       when(): true on the frame its trigger has come (checked every frame, once per page); ready(): its models are in (the screen stays black until then, at most READY_MAX s);
//       setup(ctx) builds its stand-ins (false = can't, here), step(ctx, t, dt) films one frame at scene time t, teardown(ctx) takes it all away.
//   * CINE.play(id, opts)   -- plays one now (opts.replay: from the gallery or the dev panel, not marked as new). Scenes never overlap each other or the prison's two big cut scenes.
//   * while one plays: the letterbox comes in, the HUD steps aside (body.cine-on), the game holds still (update() is replaced: no wave clock, no mobs, no towers, no hero -- only the world's own
//     animation and the scene), the scene runs on the WALL CLOCK (a slow frame rate can't make it drift from its sound), SPACE / ENTER / the ⏭ button skip after the first second (a fade to black).
//   * each scene plays ONCE per save on its trigger (localStorage dd_cine_seen); a "🎬 CINEMATICS" button on the title screen opens a gallery of the ones seen so far (a frame of each; the others locked)
//     and plays any of them again; the dev panel (F9) has a picker.
//   * CO-OP: the host's scene plays for everyone -- 'cinePlay' (with where it is), 'cineSkip', 'cineEnd'. A guest never starts one by itself; one that joins after it began just misses it.
//   * helpers on ctx for every scene: ctx.cam(p, l, fov), ctx.black(k), ctx.title(k), ctx.group (a THREE.Group, removed after), ctx.darken(opts) (the map's lights down, glows hidden, fog black --
//     all put back after), ctx.fire (a handful of the map's OWN point lights borrowed and moved onto torches: no light is ever added or removed, so no material is rebuilt mid-scene), ctx.audio (a
//     small synth: drone, heartbeat, drips, booms, crackle, footfalls, a swell), ctx.once(key, t, fn).
// Test hook: window.__cine (and window.CINE).
(function(){
'use strict';
const SEEN_KEY='dd_cine_seen', READY_MAX=9, SKIP_AFTER=1, FADE_OUT=.5, FADE_IN=1.0;
const DEFS={}, ORDER=[];
const cnt={ plays:0, ends:0, skips:0, autos:0, guestPlays:0, sent:0, refused:0, replays:0, navs:0, waits:0, frames:0, slowFrames:0 };
const AUTO=!(navigator.webdriver||SILENT)||Q.has('cineauto');   // the test suites drive the game themselves: a scene starting by itself would hold their hall (they opt in with ?cineauto)
const COOPJOIN=!!Q.get('coopjoin');
const NET=()=>window.__net, role=()=>{ const n=NET(); return n&&n.role?n.role():null; }, isGuest=()=>role()==='guest'||COOPJOIN, isHost=()=>role()==='host';
const ssm=k=>k<=0?0:k>=1?1:k*k*(3-2*k), clamp01=k=>k<0?0:k>1?1:k;
// ---------------------------------------------------------------- seen, once per save
function seenList(){ try{ const a=JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'); return Array.isArray(a)?a.filter(x=>typeof x==='string'):[]; }catch(e){ return []; } }
function isSeen(id){ return seenList().includes(id); }
function markSeen(id){ const a=seenList(); if(a.includes(id)) return; a.push(id); try{ localStorage.setItem(SEEN_KEY,JSON.stringify(a)); }catch(e){} }
function forget(id){ const a=seenList().filter(x=>id&&x!==id); try{ localStorage.setItem(SEEN_KEY,JSON.stringify(a)); }catch(e){} }
// ---------------------------------------------------------------- the screen: black, letterbox, title card, skip
{ const st=document.createElement('style'); st.textContent=
   '#cine{position:fixed;inset:0;z-index:95;pointer-events:none;display:none}#cine.cn-on{display:block}'
  +'#cine .cn-black{position:absolute;inset:0;background:#000;opacity:0}'
  +'#cine .cn-lb{position:absolute;left:0;right:0;height:0;background:#000;transition:height .9s ease}#cine.cn-bars .cn-lb{height:11vh}#cine .cn-t{top:0}#cine .cn-b{bottom:0}'
  +'#cine .cn-title{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);text-align:center;opacity:0;white-space:nowrap}'
  +'#cine .cn-title .cn-row{display:flex;align-items:center;justify-content:center;gap:2.2vw}'
  +'#cine .cn-title b{display:block;font:900 clamp(40px,7.2vw,110px) Georgia,serif;color:#ffc46a;letter-spacing:.12em;-webkit-text-stroke:2px #3a1606;text-shadow:0 0 34px #ff7a1a,0 0 80px #ff5a0a66,0 6px 0 #2a0e04}'
  +'#cine .cn-title i{display:block;margin-top:1.2vh;font:italic 700 clamp(14px,1.7vw,24px) Georgia,serif;color:#ffe2b8;letter-spacing:.5em;text-shadow:0 2px 6px #000,0 0 14px #ff8a2a88}'
  +'#cine .cn-title .cn-rule{height:2px;margin:1.4vh auto 0;width:62%;background:linear-gradient(90deg,transparent,#ffb347,transparent)}'
  +'#cine .cn-title svg{width:clamp(34px,4.6vw,70px);height:auto;filter:drop-shadow(0 0 14px #ff7a1a)}'
  +'#cine .cn-skip{position:absolute;right:2.2vw;bottom:calc(11vh + 1.4vh);font:3.2vh/1 Georgia,serif;color:#ffe2b8;background:#1a0e06cc;border:1px solid #8a5a2a;border-radius:8px;padding:.6vh 1.1vw;cursor:pointer;opacity:0;transition:opacity .5s;pointer-events:none}'
  +'#cine.cn-canskip .cn-skip{opacity:.8;pointer-events:auto}#cine .cn-skip small{font-size:1.5vh;letter-spacing:.2em;margin-left:.6vw;opacity:.75;vertical-align:middle}'
  +'#cine .cn-wait{position:absolute;right:2.4vw;top:2.4vh;font-size:3vh;opacity:0}#cine.cn-waiting .cn-wait{opacity:.6;animation:cnpulse 1.4s ease-in-out infinite}@keyframes cnpulse{50%{opacity:.15}}'
  +'body.cine-on>*:not(#c):not(#cine):not(#vig):not(script):not(style){visibility:hidden!important}'
  // the gallery (title screen)
  +'#cinebtn{position:absolute;top:54px;right:12px;z-index:2;background:linear-gradient(#2a1a10,#140b06);border:2px solid #8a5a2a;border-radius:999px;color:#ffe2b8;font:bold 13px Georgia,serif;letter-spacing:2px;padding:7px 14px;cursor:pointer;box-shadow:0 2px 0 #000}#cinebtn:hover{border-color:#ffc46a;color:#fff}body.tutorial #cinebtn{display:none}'
  +'#cineGal{position:fixed;inset:0;z-index:200;display:none;align-items:center;justify-content:center;background:#05030ae6}#cineGal.cg-on{display:flex}'
  +'#cineGal .cg-box{position:relative;max-width:min(980px,94vw);padding:26px 26px 22px;border:2px solid #6a4a2a;border-radius:14px;background:linear-gradient(#1a1008,#0c0704);box-shadow:0 0 40px #000}'
  +'#cineGal h2{margin:0 0 16px;text-align:center;font:900 26px Georgia,serif;color:#ffc46a;letter-spacing:.2em;text-shadow:0 0 18px #ff7a1a88}'
  +'#cineGal .cg-x{position:absolute;right:12px;top:8px;font:bold 26px Georgia;color:#ffd27a;cursor:pointer;background:none;border:0}'
  +'#cineGal .cg-grid{display:flex;flex-wrap:wrap;gap:16px;justify-content:center}'
  +'#cineGal .cg-card{position:relative;width:min(280px,80vw);border:2px solid #8a5a2a;border-radius:10px;overflow:hidden;cursor:pointer;background:#000;transition:transform .15s,border-color .15s;padding:0;color:inherit;text-align:left}'
  +'#cineGal .cg-card:hover{transform:translateY(-3px) scale(1.02);border-color:#ffc46a}'
  +'#cineGal .cg-pic{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:radial-gradient(circle at 50% 60%,#5a2a0a,#000 70%)}'
  +'#cineGal .cg-play{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font-size:46px;color:#fff;text-shadow:0 0 16px #000,0 0 30px #ff7a1a;opacity:.85}'
  +'#cineGal .cg-name{display:block;padding:8px 10px 9px;font:bold 15px Georgia,serif;color:#ffe2b8;letter-spacing:.12em;background:#120a05}'
  +'#cineGal .cg-name small{display:block;font:italic 12px Georgia;color:#c8a070;letter-spacing:.2em;margin-top:2px}'
  +'#cineGal .cg-card.locked{cursor:default;border-color:#3a2a1a}#cineGal .cg-card.locked:hover{transform:none}#cineGal .cg-card.locked .cg-pic{filter:grayscale(1) brightness(.18) blur(3px)}'
  +'#cineGal .cg-card.locked .cg-play{font-size:40px;opacity:.9}#cineGal .cg-card.locked .cg-name{color:#7a6650}';
  document.head.appendChild(st); }
const FLAME_SVG='<svg viewBox="0 0 40 64" aria-hidden="true"><defs><radialGradient id="cnfl" cx="50%" cy="70%" r="60%"><stop offset="0" stop-color="#fff6c0"/><stop offset=".35" stop-color="#ffc040"/><stop offset=".75" stop-color="#ff6a10"/><stop offset="1" stop-color="#a02000"/></radialGradient></defs>'
  +'<path d="M20 2C24 14 34 20 34 34c0 9-6 15-14 15S6 43 6 34c0-7 4-11 7-16 1 5 3 8 6 9-1-8 0-17 1-25z" fill="url(#cnfl)"/><rect x="17" y="47" width="6" height="15" rx="2" fill="#5a3a20"/><rect x="14" y="46" width="12" height="4" rx="1.5" fill="#8a6a3a"/></svg>';
const el=document.createElement('div'); el.id='cine';
el.innerHTML='<div class="cn-black"></div><div class="cn-lb cn-t"></div><div class="cn-lb cn-b"></div><div class="cn-title"><div class="cn-row">'+FLAME_SVG+'<b></b>'+FLAME_SVG+'</div><div class="cn-rule"></div><i></i></div><div class="cn-skip">⏭<small>SPACE</small></div><div class="cn-wait">🎬</div>';
document.body.appendChild(el);
const blackEl=el.querySelector('.cn-black'), titleEl=el.querySelector('.cn-title'), skipEl=el.querySelector('.cn-skip');
// ---------------------------------------------------------------- the world darkened, and put back
// Every light keeps its slot (adding or removing one would rebuild every material: a hitch); the ones on the map are turned down (the torches' base too, which updateFx re-reads every frame), glows and
// unlit pictures are hidden, emissive surfaces dimmed, the fog and the sky go black. Point lights standing free in the world are BORROWED for the scene's own fire (ctx.fire) and put back where they were.
function makeDark(){ const D={ on:false, lights:[], pool:[], mats:[], hidden:[], flats:[], fog:null, bg:null, far:camera.far, fov:camera.fov, opts:null };
  D.apply=function(o){ o=Object.assign({ hemi:.03, sun:0, point:0, emissive:.1, fog:[70,220], hide:true },o||{}); D.opts=o; if(D.on) return D; D.on=true; world.updateMatrixWorld(true);
    const ident=world.matrixWorld.equals(new THREE.Matrix4());
    const skip=new Set(); const mark=r=>{ if(r) r.traverse(x=>skip.add(x)); }; mark(R0.group); if(typeof crystalG!=='undefined') mark(crystalG); if(o.keep) o.keep.forEach(mark);
    scene.traverse(x=>{ if(skip.has(x)) return;
      if(x.isLight){ const s={ l:x, I:x.intensity, base:x.userData&&x.userData.base, pos:x.position.clone(), col:x.color.getHex(), dist:x.distance, decay:x.decay };
        if(x.isPointLight&&(x.parent===scene||(x.parent===world&&ident))) D.pool.push(s); else D.lights.push(s); if(s.base!==undefined) x.userData.base=0; return; }
      if(x.material){ const ms=Array.isArray(x.material)?x.material:[x.material];
        for(const m of ms){ if(m.emissive&&m.emissiveIntensity>0&&m.emissive.getHex()!==0&&!D.mats.some(q=>q.m===m)) D.mats.push({ m, I:m.emissiveIntensity }); }
        if(o.hide&&x.visible){ const m=ms[0]; const lum=m&&m.color?(m.color.r+m.color.g+m.color.b)/3:0;
          if(m&&(m.isSpriteMaterial||m.isPointsMaterial||m.blending===THREE.AdditiveBlending||(m.userData&&m.userData.__wg)||(m.isMeshBasicMaterial&&m.colorWrite!==false&&(m.map||lum>.12)))) D.hidden.push(x); } } });
    // opts.flat: the map's plain untextured stone (cliff faces, flights' treads -- pale, they turn cream in firelight) taken darker, as the textured stone reads
    if(o.flat) world.traverse(x=>{ if(skip.has(x)||!x.isMesh) return; const ms=Array.isArray(x.material)?x.material:[x.material]; for(const m of ms){ if(m&&m.isMeshToonMaterial&&!m.map&&m.color&&!D.flats.some(q=>q.m===m)){ D.flats.push({ m, c:m.color.getHex() }); m.color.multiplyScalar(o.flat); } } });
    D.fog=scene.fog?{ n:scene.fog.near, f:scene.fog.far, c:scene.fog.color.getHex() }:null; D.bg=scene.background&&scene.background.isColor?scene.background.getHex():null;
    D.far=camera.far; D.fov=camera.fov; camera.far=Math.max(camera.far,260); camera.updateProjectionMatrix(); D.tick(); return D; };
  D.tick=function(){ if(!D.on) return; const o=D.opts;
    for(const s of D.lights){ const l=s.l; l.intensity=l.isHemisphereLight||l.isAmbientLight?o.hemi:l.isDirectionalLight?s.I*o.sun:s.I*o.point; }
    for(const s of D.pool) s.l.intensity=0;   // the fire (ctx.fire) lights the ones it has taken, after this
    for(const q of D.mats) q.m.emissiveIntensity=q.I*o.emissive;
    for(const x of D.hidden) x.visible=false;
    if(scene.fog){ scene.fog.near=o.fog[0]; scene.fog.far=o.fog[1]; scene.fog.color.setHex(0); } if(scene.background&&scene.background.isColor) scene.background.setHex(0); };
  D.restore=function(){ if(!D.on) return; D.on=false;
    for(const s of D.lights.concat(D.pool)){ const l=s.l; l.intensity=s.I; if(s.base!==undefined) l.userData.base=s.base; l.position.copy(s.pos); l.color.setHex(s.col); l.distance=s.dist; l.decay=s.decay; }
    for(const q of D.mats) q.m.emissiveIntensity=q.I; for(const x of D.hidden) x.visible=true; for(const q of D.flats) q.m.color.setHex(q.c);
    if(D.fog&&scene.fog){ scene.fog.near=D.fog.n; scene.fog.far=D.fog.f; scene.fog.color.setHex(D.fog.c); } if(D.bg!==null&&scene.background&&scene.background.isColor) scene.background.setHex(D.bg);
    camera.far=D.far; camera.fov=D.fov; camera.updateProjectionMatrix(); D.lights=[]; D.pool=[]; D.mats=[]; D.hidden=[]; D.flats=[]; };
  return D; }
// ---------------------------------------------------------------- borrowed firelight: N of the map's own point lights follow the torches nearest a focus point
// A light stays on its torch while that torch is among the nearest; one no longer wanted fades out first and only then jumps to a new torch and fades in (no light ever pops from place to place).
function makeFire(D){ const F={ slots:[], gain:1, col:0xff9a48, dist:15, decay:2, I:3.0 };
  F.take=function(n){ F.slots=D.pool.slice(0,n).map(s=>({ s, l:s.l, src:null, I:0 })); for(const k of F.slots){ k.l.intensity=0; k.l.color.setHex(F.col); k.l.distance=F.dist; k.l.decay=F.decay; k.l.position.set(0,-80,0); } return F.slots.length; };
  F.update=function(srcs,focus,dt,t){ const N=F.slots.length; if(!N) return; for(const k of F.slots){ k.l.color.setHex(F.col); k.l.distance=F.dist; k.l.decay=F.decay; }
    const want=srcs.filter(s=>s.on).map(s=>({ s, d:Math.hypot(s.x-focus.x,(s.y-focus.y)*.5,s.z-focus.z)*(s.w||1) })).sort((a,b)=>a.d-b.d).slice(0,N).map(o=>o.s); const wset=new Set(want);
    if(F.snap){ F.snap=false; F.slots.forEach((k,i)=>{ k.src=want[i]||null; k.I=k.src?1:0; }); }   // a cut: the lights are already on the new shot's torches
    const held=new Set(F.slots.map(k=>k.src).filter(Boolean));
    for(const k of F.slots){ const keep=k.src&&wset.has(k.src)&&k.src.on; if(!keep){ k.I=Math.max(0,k.I-dt*6); if(k.I<=.02){ k.I=0; const nx=want.find(s=>!held.has(s)); if(k.src) held.delete(k.src); k.src=nx||null; if(nx) held.add(nx); } }
      else k.I=Math.min(1,k.I+dt*3);
      if(k.src){ k.l.position.set(k.src.x,k.src.y,k.src.z); const ph=k.src.ph||0; k.l.intensity=F.I*F.gain*k.I*(1+Math.sin(t*11+ph)*.12+Math.sin(t*5.3+ph*2)*.08)*(k.src.k===undefined?1:k.src.k); }
      else { k.l.intensity=0; k.l.position.y=-80; } } };
  F.cut=()=>{ F.snap=true; };
  F.lit=()=>F.slots.filter(k=>k.src&&k.l.intensity>.05).length;
  return F; }
// ---------------------------------------------------------------- the scene's sound: a small synth on the game's own audio context (A(): null when the sound is off -- then every call is silent)
function makeAudio(){ const U={ a:null, sfx:null, mus:null, echo:null, nodes:[], drone:null };
  U.start=function(){ const a=A(); if(!a) return U; U.a=a; U.sfx=a.createGain(); U.sfx.gain.value=1; U.sfx.connect(SFXOUT(a)); U.mus=a.createGain(); U.mus.gain.value=musicOn?1:0; U.mus.connect(MUSOUT(a));
    // a cavern: a long echo, darkened each time round
    const d=a.createDelay(1.5); d.delayTime.value=.29; const fb=a.createGain(); fb.gain.value=.42; const lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1800; d.connect(lp).connect(fb).connect(d); const wet=a.createGain(); wet.gain.value=.55; lp.connect(wet).connect(U.sfx); U.echo=d; return U; };
  const T0=()=>U.a.currentTime;
  function nbuf(dur){ const a=U.a, n=Math.max(1,(a.sampleRate*dur)|0), b=a.createBuffer(1,n,a.sampleRate), c=b.getChannelData(0); for(let i=0;i<n;i++) c[i]=Math.random()*2-1; return b; }
  function out(node,wet,pan){ let n=node; if(pan&&U.a.createStereoPanner){ const p=U.a.createStereoPanner(); p.pan.value=Math.max(-1,Math.min(1,pan)); n.connect(p); n=p; } n.connect(U.sfx); if(wet&&U.echo){ const g=U.a.createGain(); g.gain.value=wet; n.connect(g).connect(U.echo); } }
  U.droneOn=function(vol,fadeS){ if(!U.a||U.drone) return; const a=U.a, t=T0(), g=a.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol||.07,t+(fadeS||4));
    const lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=190; lp.Q.value=2; const lfo=a.createOscillator(), lg=a.createGain(); lfo.frequency.value=.07; lg.gain.value=70; lfo.connect(lg).connect(lp.frequency); lfo.start();
    const os=[[41.2,'triangle',0],[61.7,'sawtooth',-7],[82.4,'sawtooth',6],[123.5,'sine',0]].map(([f,ty,dt])=>{ const o=a.createOscillator(); o.type=ty; o.frequency.value=f; o.detune.value=dt; o.connect(lp); o.start(); return o; });
    const nz=a.createBufferSource(); nz.buffer=nbuf(2); nz.loop=true; const nl=a.createBiquadFilter(); nl.type='lowpass'; nl.frequency.value=90; const ng=a.createGain(); ng.gain.value=.6; nz.connect(nl).connect(ng).connect(lp); nz.start();
    lp.connect(g).connect(U.mus); U.drone={ g, os:os.concat([lfo,nz]) }; };
  U.droneVol=function(v,s){ if(!U.drone) return; U.drone.g.gain.setTargetAtTime(Math.max(.0001,v),T0(),s||1); };
  U.heart=function(vol){ if(!U.a) return; const a=U.a; for(const [dt,k] of [[0,1],[.26,.7]]){ const t=T0()+dt, o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.setValueAtTime(68,t); o.frequency.exponentialRampToValueAtTime(34,t+.2);
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime((vol||.3)*k,t+.015); g.gain.exponentialRampToValueAtTime(.0001,t+.28); o.connect(g).connect(U.mus); o.start(t); o.stop(t+.3); } };
  U.drip=function(vol,pan){ if(!U.a) return; const a=U.a, t=T0(), o=a.createOscillator(), g=a.createGain(), f=900+Math.random()*900; o.type='sine'; o.frequency.setValueAtTime(f*1.6,t); o.frequency.exponentialRampToValueAtTime(f*.55,t+.07);
    g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol||.05,t+.004); g.gain.exponentialRampToValueAtTime(.0001,t+.11); o.connect(g); out(g,.9,pan); o.start(t); o.stop(t+.13); };
  U.boom=function(vol){ if(!U.a) return; const a=U.a, t=T0(), o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.setValueAtTime(62,t); o.frequency.exponentialRampToValueAtTime(27,t+1.4);
    g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol||.4,t+.02); g.gain.exponentialRampToValueAtTime(.0001,t+2.2); o.connect(g); out(g,.25); o.start(t); o.stop(t+2.3);
    const n=a.createBufferSource(); n.buffer=nbuf(2); const lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=160; const ng=a.createGain(); ng.gain.setValueAtTime((vol||.4)*.8,t); ng.gain.exponentialRampToValueAtTime(.0001,t+1.8); n.connect(lp).connect(ng); out(ng,.4); n.start(t); };
  U.crackle=function(vol,pan){ if(!U.a||vol<.004) return; const a=U.a; for(let i=0;i<3;i++){ const t=T0()+Math.random()*.12, n=a.createBufferSource(); n.buffer=nbuf(.012+Math.random()*.02); const hp=a.createBiquadFilter(); hp.type='bandpass'; hp.frequency.value=1800+Math.random()*3500; hp.Q.value=1.2;
      const g=a.createGain(); g.gain.value=vol*(.4+Math.random()); n.connect(hp).connect(g); out(g,.15,pan); n.start(t); } };
  U.step=function(vol,pan){ if(!U.a||vol<.004) return; const a=U.a, t=T0(), n=a.createBufferSource(); n.buffer=nbuf(.12); const lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=150+Math.random()*80; const g=a.createGain();
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+.12); n.connect(lp).connect(g); out(g,.35,pan); n.start(t); };
  U.swell=function(vol){ if(!U.a) return; const a=U.a, t=T0(), lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.setValueAtTime(240,t); lp.frequency.exponentialRampToValueAtTime(1400,t+2.2); lp.frequency.exponentialRampToValueAtTime(300,t+6);
    const g=a.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol||.1,t+1.6); g.gain.exponentialRampToValueAtTime(.0001,t+6.5); lp.connect(g).connect(U.mus);
    for(const [f,dt] of [[55,0],[82.4,-5],[110,4],[164.8,-3],[220,7]]){ const o=a.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.detune.value=dt; o.connect(lp); o.start(t); o.stop(t+6.6); } };
  U.stop=function(s){ if(!U.a) return; const a=U.a, t=a.currentTime; s=s||.4; for(const g of [U.sfx,U.mus]) if(g){ g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(.0001,t,s/3); }
    const dr=U.drone, sx=U.sfx, mu=U.mus; U.drone=null; setTimeout(()=>{ try{ if(dr) dr.os.forEach(o=>{ try{ o.stop(); }catch(e){} }); sx&&sx.disconnect(); mu&&mu.disconnect(); }catch(e){} },(s+.6)*1000); U.a=null; };
  return U; }
// ---------------------------------------------------------------- one run
let R0={ group:null };   // the current run's group, for makeDark's skip set (a run sets it before darkening)
let run=null;   // { id, def, t, real0, ctx, opts, wait, waitT, skipAt, endFade, dark, fire, audio, ev }
let pendingMusic=null, autoDone={}, lastFrameAt=0;
function camSet(p,l,fov){ camera.position.set(p[0],p[1],p[2]); camera.lookAt(l[0],l[1],l[2]); if(fov&&Math.abs(camera.fov-fov)>.01){ camera.fov=fov; camera.updateProjectionMatrix(); } }
function busyElsewhere(){ try{ if(window.__finale&&window.__finale.info&&window.__finale.info().active) return 'finale'; }catch(e){} try{ const m=window.__mortarshow&&window.__mortarshow.info&&window.__mortarshow.info(); if(m&&m.active) return 'mortarshow'; }catch(e){}
  try{ if(window.__avery&&window.__avery.info&&window.__avery.info().cut) return 'avery'; }catch(e){} try{ if(window.__bullion&&window.__bullion.info&&window.__bullion.info().cut) return 'bullion'; }catch(e){}
  if(S.phase==='dead'||S.phase==='won'||S.phase==='deathcut') return 'phase'; if(typeof Meta!=='undefined'&&Meta.isOpen&&Meta.isOpen()) return 'menu'; return null; }
function play(id,opts){ opts=opts||{}; const def=DEFS[id]; if(!def){ cnt.refused++; return false; } if(run){ cnt.refused++; return false; }
  if(def.map&&MAP.id!==def.map){ if(opts.replay&&!opts.guest) return navReplay(id); cnt.refused++; return false; }
  const busy=busyElsewhere(); if(busy&&!opts.force){ cnt.refused++; return false; }
  const group=new THREE.Group(); group.name='cine-'+id; R0.group=group; scene.add(group);
  const D=makeDark(), U=makeAudio();
  run={ id, def, t:0, real0:0, opts, wait:true, waitT:0, skipAt:null, endFade:0, dark:D, fire:null, audio:U, ev:{}, group, startPhase:S.phase, recv:opts.recvAt||0, enemies0:enemies.length };
  const ctx=run.ctx={ id, group, t:0, dt:0, replay:!!opts.replay, guest:!!opts.guest,
    cam:camSet, black:k=>{ run.blackK=k; }, title:k=>{ run.titleK=k; },
    darken:o=>{ D.apply(o); return D; }, fire:null, audio:U,
    once:(key,t0,fn,win)=>{ if(run.ev[key]) return; if(ctx.t>=t0){ run.ev[key]=true; if(ctx.t<t0+(win===undefined?.6:win)) try{ fn(); }catch(e){ console.warn('cine once',key,e); } } },
    ease:ssm, clamp01 };
  ctx.fireLights=n=>{ const F=makeFire(D); F.take(n); run.fire=ctx.fire=F; return F; };
  run.blackK=1; run.titleK=0;
  titleEl.querySelector('b').textContent=def.title||''; titleEl.querySelector('i').textContent=def.sub||'';
  blackEl.style.transition='none'; blackEl.style.opacity='1'; el.classList.add('cn-on','cn-waiting'); el.classList.remove('cn-canskip'); void el.offsetWidth; el.classList.add('cn-bars'); document.body.classList.add('cine-on');
  if(typeof setMusicRaw==='function') setMusicRaw('none');
  cnt.plays++; if(opts.replay) cnt.replays++; if(opts.guest) cnt.guestPlays++;
  if(!opts.replay) markSeen(id);
  return true; }
function begin(){ const r=run, def=r.def; r.wait=false; el.classList.remove('cn-waiting');
  let ok=true; try{ ok=def.setup?def.setup(r.ctx)!==false:true; }catch(e){ console.warn('cine setup',e); ok=false; }
  if(!ok){ finish(true); return; }
  r.audio.start(); r.t=0; r.real0=0;
  if(r.opts.guest&&r.opts.at>0){ r.t=Math.min(def.dur-FADE_OUT-.05,r.opts.at+(r.recv?(performance.now()-r.recv)/1000:0)); }
  if(isHost()&&!r.opts.replay){ try{ const n=NET(); if(n.peers().length){ n.send('cinePlay',{ id:r.id, t:+r.t.toFixed(2) }); cnt.sent++; } }catch(e){} } }
function skip(fromHost){ if(!run||run.wait&&!fromHost) return false; if(run.wait){ finish(); return true; } if(run.t<SKIP_AFTER&&!fromHost) return false; if(run.skipAt!==null) return false;
  run.skipAt=run.t; cnt.skips++; run.audio.stop(FADE_OUT); if(isHost()&&!run.opts.replay){ try{ const n=NET(); if(n.peers().length) n.send('cineSkip',{ id:run.id }); }catch(e){} } return true; }
function finish(failed){ const r=run; if(!r) return; run=null;
  try{ if(r.def.teardown&&!r.wait) r.def.teardown(r.ctx); }catch(e){ console.warn('cine teardown',e); }
  r.dark.restore(); r.audio.stop(.3); scene.remove(r.group); r.group.traverse(o=>{ if(o.geometry&&o.geometry.dispose&&!o.isSkinnedMesh&&o.userData.cineOwn) o.geometry.dispose(); }); R0.group=null;
  document.body.classList.remove('cine-on'); el.classList.remove('cn-bars','cn-canskip','cn-waiting'); titleEl.style.opacity='0';
  cnt.ends++; if(isHost()&&!r.opts.replay){ try{ const n=NET(); if(n.peers().length) n.send('cineEnd',{ id:r.id }); }catch(e){} }
  if(r.opts.nav){ const back=(()=>{ try{ return sessionStorage.getItem('ddCineBack'); }catch(e){ return null; } })(); try{ sessionStorage.removeItem('ddCineBack'); }catch(e){}
    if(back&&/^https?:/.test(back)){ blackEl.style.transition='none'; blackEl.style.opacity='1'; location.replace(back); return; } }
  blackEl.style.transition='opacity '+FADE_IN+'s ease'; blackEl.style.opacity='0'; setTimeout(()=>{ if(!run) el.classList.remove('cn-on'); },FADE_IN*1000+50);
  if(r.startPhase==='start'&&S.phase==='start'){ /* a replay from the title: the title comes back as it was */ }
  const pm=pendingMusic; pendingMusic=null; if(typeof setMusicRaw==='function'){ if(pm!==null&&S.phase!=='start') setMusicRaw(pm); else musicForPhase(); }
  if(!failed) r.endedAt=performance.now(); last=r; }
let last=null;
function stepRun(dt){ const r=run; cnt.frames++; const now=performance.now();
  let rdt=dt; if(!window.__freeze){ if(!r.real0||(now-r.real0)/1000<r.t) r.real0=now-r.t*1000; rdt=Math.max(0,Math.min(.25,(now-r.real0)/1000-r.t)); }
  if(lastFrameAt&&now-lastFrameAt>50) cnt.slowFrames++; lastFrameAt=now;
  try{ const n=NET(); if(n&&n.holdTick&&role()) n.holdTick(dt); }catch(e){}
  if(r.wait){ r.waitT+=window.__freeze?dt:Math.min(.25,dt); cnt.waits++; let ready=true; try{ ready=!r.def.ready||!!r.def.ready(); }catch(e){} if(ready||r.waitT>READY_MAX) begin(); return; }
  r.t+=rdt; const ctx=r.ctx; ctx.t=r.t; ctx.dt=rdt;
  try{ updateFx(rdt); }catch(e){}
  r.dark.tick();
  try{ r.def.step(ctx,r.t,rdt); }catch(e){ console.warn('cine step',e); }
  // the screen: black (the scene's own, the skip's fade, the end's fade), title, skip button
  let blk=r.blackK||0; if(r.skipAt!==null) blk=Math.max(blk,clamp01((r.t-r.skipAt)/FADE_OUT)); const endIn=r.def.dur-FADE_OUT; if(r.t>endIn) blk=Math.max(blk,clamp01((r.t-endIn)/FADE_OUT));
  blackEl.style.opacity=String(+blk.toFixed(3)); titleEl.style.opacity=String(+clamp01(r.titleK||0).toFixed(3)); titleEl.style.transform='translate(-50%,-50%) scale('+(1.04-.04*clamp01(r.titleK||0)).toFixed(4)+')';
  el.classList.toggle('cn-canskip',r.t>=SKIP_AFTER&&r.skipAt===null);
  if(r.t>=r.def.dur||(r.skipAt!==null&&r.t-r.skipAt>=FADE_OUT)) finish(); }
// ---------------------------------------------------------------- hold the game: the scene replaces the frame; the trigger is looked at after each normal frame
{ const prev=update; update=function(dt){ hookNet(); if(run){ stepRun(dt); return; } const r=prev.apply(this,arguments); autoCheck(); guestPendingCheck(); return r; }; }
function autoCheck(){ if(run||!AUTO||isGuest()) return; for(const id of ORDER){ const def=DEFS[id]; if(autoDone[id]||!def.when) continue; if(def.map&&MAP.id!==def.map){ autoDone[id]=true; continue; }
    let go=false; try{ go=!!def.when(); }catch(e){} if(!go) continue; autoDone[id]=true; if(isSeen(id)) continue; if(play(id)){ cnt.autos++; return; } } }
// the music waits: anything that asks for a track while a scene plays (play()'s own build track 0.4 s in, say) is remembered and put on after
let setMusicRaw=null; { const prev=setMusic; setMusicRaw=function(){ return prev.apply(this,arguments); }; setMusic=function(mode){ if(run){ pendingMusic=mode; return; } return prev.apply(this,arguments); }; }
// keys and the mouse belong to the scene while it plays: SPACE / ENTER skip; nothing reaches the game (no horn, no swing, no turning the camera)
const block=ev=>{ if(!run) return; if(ev.type==='keydown'){ if((ev.code==='Space'||ev.code==='Enter'||ev.code==='NumpadEnter')&&!ev.repeat) skip(); if(ev.code==='F9') return; }   // F9: the dev panel still opens
  const onSkip=ev.target&&ev.target.closest&&ev.target.closest('#cine .cn-skip'); if(onSkip&&(ev.type==='mousedown'||ev.type==='touchstart')) skip();
  if(!onSkip&&ev.target&&ev.target.closest&&ev.target.closest('#devpanel')) return; ev.stopImmediatePropagation(); if(ev.type==='keydown'&&ev.code!=='F12') ev.preventDefault(); };
for(const ty of ['keydown','mousedown','mouseup','click','mousemove','wheel','touchstart','contextmenu']) addEventListener(ty,block,{ capture:true, passive:false });
// ---------------------------------------------------------------- co-op: the host's scene for everyone
let netHooked=false, gPending=null;
function hookNet(){ if(netHooked) return; const n=NET(); if(!(n&&n.onMessage)) return; netHooked=true;
  n.onMessage('cinePlay',d=>{ if(role()!=='guest'||!d||typeof d.id!=='string'||!DEFS[d.id]) return; const def=DEFS[d.id], at=Math.max(0,+d.t||0); if(at>def.dur-2) return;
    if(run) return; if(S.phase==='start'){ gPending={ id:d.id, at, recv:performance.now() }; return; } play(d.id,{ guest:true, at, recvAt:performance.now(), force:true }); });
  n.onMessage('cineSkip',d=>{ if(role()!=='guest') return; gPending=null; if(run&&run.opts.guest&&(!d||d.id===run.id)) skip(true); });
  n.onMessage('cineEnd',d=>{ if(role()!=='guest') return; gPending=null; if(run&&run.opts.guest&&(!d||d.id===run.id)) skip(true); }); }
function guestPendingCheck(){ if(!gPending||run) return; const age=(performance.now()-gPending.recv)/1000; if(age>6){ gPending=null; return; } if(S.phase==='build'||S.phase==='wave'){ const p=gPending; gPending=null; play(p.id,{ guest:true, at:p.at, recvAt:p.recv, force:true }); } }
// ---------------------------------------------------------------- a replay of a scene filmed on another map: that map's page, which plays it and comes back here
function mapIndexOf(id){ return MAPS.findIndex(m=>m.id===id); }
function navReplay(id){ const def=DEFS[id], mi=mapIndexOf(def.map); if(mi<0||mi>MAPS_CLEARED){ cnt.refused++; return false; } cnt.navs++;
  try{ sessionStorage.setItem('ddCineBack',location.href); }catch(e){} blackEl.style.transition='none'; blackEl.style.opacity='1'; el.classList.add('cn-on','cn-waiting');
  const q=new URLSearchParams(location.search); q.set('map',String(mi)); q.set('cine',id); q.delete('coopjoin'); q.delete('tutorial'); location.href=location.pathname+'?'+q.toString(); return true; }   // the page's other flags ride along (?hk=, say)
{ const want=Q.get('cine'); if(want&&!COOPJOIN){ blackEl.style.opacity='1'; el.classList.add('cn-on','cn-waiting');
    const iv=setInterval(()=>{ const def=DEFS[want]; if(!def){ return; } clearInterval(iv); if(def.map&&MAP.id!==def.map){ el.classList.remove('cn-on','cn-waiting'); return; }
      if(!play(want,{ replay:true, nav:true, force:true })) el.classList.remove('cn-on','cn-waiting'); },250); } }
// ---------------------------------------------------------------- the gallery: the title screen's 🎬 CINEMATICS
const gal=document.createElement('div'); gal.id='cineGal'; gal.innerHTML='<div class="cg-box"><button class="cg-x" aria-label="close">✕</button><h2>🎬 CINEMATICS</h2><div class="cg-grid"></div></div>'; document.body.appendChild(gal);
gal.addEventListener('click',e=>{ e.stopPropagation(); if(e.target===gal||e.target.closest('.cg-x')){ closeGallery(); return; } const c=e.target.closest('.cg-card'); if(!c||c.classList.contains('locked')) return; closeGallery(); replay(c.dataset.id); });
addEventListener('keydown',e=>{ if(!gal.classList.contains('cg-on')) return; e.stopImmediatePropagation(); if(e.code==='Escape'){ e.preventDefault(); closeGallery(); } },true);   // while the gallery is open the title's keys (Enter / Space: ENTER THE HALL) wait; Esc closes it
function picUrl(def){ if(!def.pic||typeof HAS_ASSETS==='undefined'||!HAS_ASSETS) return null; try{ return ASSET(def.pic); }catch(e){ return null; } }
function renderGallery(){ const g=gal.querySelector('.cg-grid'); g.innerHTML=''; for(const id of ORDER){ const def=DEFS[id], seen=isSeen(id), b=document.createElement('button'); b.className='cg-card'+(seen?'':' locked'); b.dataset.id=id;
    const u=picUrl(def); b.innerHTML=(u?'<img class="cg-pic" alt="" src="'+u+'">':'<span class="cg-pic"></span>')+'<span class="cg-play">'+(seen?'▶':'🔒')+'</span><span class="cg-name">'+(seen?def.title:'? ? ?')+'<small>'+(seen?(def.sub||''):'not yet seen')+'</small></span>'; g.appendChild(b); } }
function openGallery(){ renderGallery(); gal.classList.add('cg-on'); }
function closeGallery(){ gal.classList.remove('cg-on'); }
function replay(id){ return play(id,{ replay:true, force:true }); }
function addTitleButton(){ if(document.getElementById('cinebtn')) return; const st=document.getElementById('start'); if(!st) return;   // the title's top-right corner, under SHARE: seen without scrolling (the button column is full)
  const b=document.createElement('button'); b.id='cinebtn'; b.textContent='🎬 CINEMATICS'; b.addEventListener('click',e=>{ e.stopPropagation(); openGallery(); }); st.appendChild(b); }
if(!TUTORIAL&&!COOPJOIN) addTitleButton();
// ---------------------------------------------------------------- the dev panel (F9): play any scene, forget which have been seen
setInterval(()=>{ const p=document.getElementById('devpanel'); if(!p||document.getElementById('dp-cine')) return; const sec=document.createElement('div'); sec.className='sect'; sec.id='dp-cine';
  sec.innerHTML='<label>play cinematic</label><div class="row"><select id="dp-cine-pick"></select><button id="dp-cine-go">🎬 Play</button><button id="dp-cine-forget" title="forget which scenes have been seen (they play again on their trigger)">↺ unseen</button></div>';
  const note=p.querySelector('.note'); if(note) p.insertBefore(sec,note); else p.appendChild(sec);
  const sel=document.getElementById('dp-cine-pick'); sel.innerHTML=ORDER.map(id=>'<option value="'+id+'">'+DEFS[id].title+(DEFS[id].sub?' · '+DEFS[id].sub:'')+'</option>').join('');
  document.getElementById('dp-cine-go').onclick=()=>{ const id=sel.value; if(id){ try{ if(window.__devpanel&&window.__devpanel.toggle) window.__devpanel.toggle(false); }catch(e){} replay(id); } };
  document.getElementById('dp-cine-forget').onclick=()=>{ forget(); for(const k in autoDone) delete autoDone[k]; toast('🎬 every scene unseen again'); }; },800);
// ---------------------------------------------------------------- the API
function register(id,def){ if(!id||!def||typeof def.step!=='function') return false; def=Object.assign({ dur:30 },def); def.id=id; if(!DEFS[id]) ORDER.push(id); DEFS[id]=def; return true; }
const API={ register, play, replay, skip, forget, seen:isSeen, seenList, active:()=>run?run.id:null, list:()=>ORDER.map(id=>({ id, title:DEFS[id].title, sub:DEFS[id].sub||'', map:DEFS[id].map||null, seen:isSeen(id), dur:DEFS[id].dur })),
  openGallery, closeGallery, ease:ssm };
window.CINE=API;
window.__cine=Object.assign({},API,{ info:()=>Object.assign({ active:run?run.id:null, t:run?+run.t.toFixed(2):null, wait:run?run.wait:null, skipAt:run&&run.skipAt!==null?+run.skipAt.toFixed(2):null, guest:run?!!run.opts.guest:null,
    replay:run?!!run.opts.replay:null, lit:run&&run.fire?run.fire.lit():0, borrowed:run&&run.fire?run.fire.slots.length:0, darkened:run?run.dark.on:false, hidden:run?run.dark.hidden.length:0, auto:AUTO, pendingMusic, body:document.body.classList.contains('cine-on'),
    black:+(+blackEl.style.opacity||0).toFixed(2), title:+(+titleEl.style.opacity||0).toFixed(2), bars:el.classList.contains('cn-bars'), last:last?{ id:last.id, skipped:last.skipAt!==null, endedAt:last.endedAt||null }:null },cnt),
  seek:t=>{ if(!run||run.wait) return false; run.t=Math.max(0,t); run.real0=0; return true; }, ctx:()=>run?run.ctx:null, defs:()=>DEFS, group:()=>run?run.group:null, gallery:()=>gal, finish:()=>finish() });
})();
