// ===== THE MORTAR SHOW (build 383). Matt: "when i break the first door a cut scene, about 20 seconds long showing the mortars roll out a victory fanfair, and the launching of projectiles, the mist and the horde fighting itself, if 20 seconds is too short add more.
// make it fun to watch". THE DEEP PRISON only, played once a run, solo (a co-op hall has no cutscenes: the doors just open as they always did). The game keeps RUNNING underneath -- the horde marches, the towers fire -- but the hero is held, untouchable and
// deaf to the keys while the bars are on; Enter (or the skip button) ends it. 23.5 seconds:
//    0.0-2.8  the door he broke: a low camera pushing in on it as the dust rolls out and the mortar starts out of the dark on its wheels
//    1.8      the OTHER door bursts open by itself, its mortar rolling out a beat behind the first
//    2.8-6.0  a wide shot from the pit, both rooms either side of the Heartroot, both mortars rolling out
//    6.0      THE FANFARE (brass, synthesised: window.__mortarshow.fanfare) and a burst of gold sparks over each mortar, the camera swinging low round them
//    9.0-19.2 eight volleys, the two mortars taking turns (free: their ammo is put back), each a green flash and the recoil, the hex canister chased through the air by the camera, then the canisters bursting into green MIST over the thickest knots of the
//             horde, and the mist MADDENING them -- the camera lifts over the mist, then comes down among the horde fighting itself
//    21.5     the camera is handed back to the game over a second
// Test hook: window.__mortarshow.
(function(){
'use strict';
window.__mortarshow={ info:()=>null };
if(!MAP||MAP.id!=='prison') return;
const PW=window.__prisonwalls; if(!PW||!PW.raw||!PW.mounts) return;
const isGuest=()=>!!(window.__net&&window.__net.role&&window.__net.role()==='guest');
const inCoop=()=>{ try{ return !!(window.__net&&window.__net.role&&window.__net.role()); }catch(er){ return false; } };
const T_SECOND=1.8, T_FAN=6.0, T_END=28, BLEND=1.2, BARS='12vh';
const VOLLEYS=[[9,0],[11,1],[13,0],[15,1],[17,0],[19,1],[21,0],[23,1]];   // [when, which room (0 = the door he broke)]: a shell every two seconds, each mortar's own four seconds apart (build 383, Matt: "4 seconds of reload time between shots")
const SHOTS=[[0,2.8],[2.8,6.0],[6.0,9.0],[9.0,12.5],[12.5,18.0],[18.0,25.0],[25.0,T_END]];
const smooth=k=>k<=0?0:k>=1?1:k*k*(3-2*k), lerp=(a,b,k)=>a+(b-a)*k;
const cnt={ starts:0, ends:0, volleys:0, skips:0, fanfares:0, sparks:0 };
const SH={ active:false, done:false, t:0, first:null, second:null, ev:{}, vi:0, shells:[], impact:null, focus:null, hp0:0, blend:0, endP:null, endQ:null, skipped:false, dustT:0, shot:-1 };
const fx=[];   // sparks and dust: { s, t, life, vx, vy, vz, g, grow, op }
// ---- the bars and the skip button (a picture, no words)
const bars=['top','bottom'].map(side=>{ const d=document.createElement('div'); d.style.cssText='position:fixed;left:0;right:0;'+side+':0;height:0;background:#000;z-index:92;pointer-events:none;transition:height .6s ease'; document.body.appendChild(d); return d; });
const letterbox=on=>bars.forEach(d=>{ d.style.height=on?BARS:'0'; });
const skipBtn=document.createElement('div'); skipBtn.textContent='⏭'; skipBtn.style.cssText='position:fixed;right:2.2vw;bottom:2.4vh;z-index:93;font-size:3.2vh;line-height:1;color:#e6ffe8;background:#0e2014cc;border:1px solid #4a9a5a;border-radius:8px;padding:.5vh 1vw;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .5s'; document.body.appendChild(skipBtn);
skipBtn.onclick=()=>skip(); addEventListener('keydown',e=>{ if(e.code==='Enter'&&SH.active) skip(); });
// ---- build 384 (Matt sent music_smt_Power-Up_027.mp3: "for the mortar cinematic, start at count 7"): the show plays MATT'S TRACK (parts/assets/music-mortarshow.mp3, 185 s) from its 7-second mark, faded in over half a second, the wall's own music
// (95m) ducked under it; at the end it fades out over 2.5 s and the wall's music comes back. The synthesised brass below only plays if the track could not be loaded
const SHOW_FILE='assets/music-mortarshow.mp3', SHOW_OFFSET=7, SHOW_VOL=1.0; let showBuf=null, showLoading=null, showNode=null; const mus={ played:0, failed:0 };
const musOn=()=>{ try{ return !!(!soundOff&&musicOn&&A()); }catch(er){ return false; } };
function loadShow(){ if(showBuf) return Promise.resolve(showBuf); if(showLoading) return showLoading; const a=musOn()?A():null; if(!a) return Promise.resolve(null);
  showLoading=fetch(SHOW_FILE).then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.arrayBuffer(); }).then(b=>new Promise((res,rej)=>{ const p=a.decodeAudioData(b,res,rej); if(p&&p.catch) p.catch(()=>{}); })).then(buf=>{ showBuf=buf; return buf; }).catch(er=>{ mus.failed++; showLoading=null; console.warn('mortar show music',er); return null; });
  return showLoading; }
setTimeout(loadShow,9000);
function showMusic(){ const a=musOn()?A():null; if(!a) return false; const go=buf=>{ if(!buf||!SH.active) return; try{ const g=a.createGain(), s=a.createBufferSource(); s.buffer=buf; g.gain.setValueAtTime(.0001,a.currentTime); g.gain.exponentialRampToValueAtTime(Math.max(.0002,MUS_VOL*SHOW_VOL),a.currentTime+.5); s.connect(g).connect(MUSOUT(a)); s.start(0,SHOW_OFFSET); showNode={ s, g }; mus.played++; }catch(er){ console.warn('mortar show music',er); } };
  try{ if(window.__bossMusic&&window.__bossMusic.duck) window.__bossMusic.duck(.08,.6); }catch(er){} if(showBuf){ go(showBuf); return true; } loadShow().then(go); return true; }
function showMusicOff(){ const a=A&&A(); const n=showNode; showNode=null; if(n&&a){ try{ n.g.gain.cancelScheduledValues(a.currentTime); n.g.gain.setValueAtTime(Math.max(.0002,n.g.gain.value),a.currentTime); n.g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+2.5); }catch(er){} setTimeout(()=>{ try{ n.s.stop(); n.s.disconnect(); n.g.disconnect(); }catch(er){} },2800); }
  try{ if(window.__bossMusic&&window.__bossMusic.duck) window.__bossMusic.duck(1,2.2); }catch(er){} }
// ---- the fanfare: brass (a sawtooth and a square an octave down), three short calls and a long chord, then a crash
function fanfare(){ cnt.fanfares++; if(typeof beep!=='function') return; const seq=[[392,0,.16],[392,.18,.16],[392,.36,.16],[523.25,.55,.5],[440,1.12,.18],[523.25,1.32,.18],[659.25,1.52,1.1],[783.99,1.52,1.1],[1046.5,1.52,1.1]];
  for(const [f,at,d] of seq) setTimeout(()=>{ try{ beep(f,d,'sawtooth',.05); beep(f/2,d,'square',.025); }catch(er){} },at*1000);
  setTimeout(()=>{ try{ if(typeof noise==='function') noise(.6,.05,2600); }catch(er){} },1520); }
// ---- little things to look at: dust behind a rolling mortar, gold sparks at the fanfare
function dust(x,y,z,n){ for(let i=0;i<n;i++){ const s=glow(0xd8c8a8,3+Math.random()*3,.001); s.position.set(x+(Math.random()-.5)*2,y+Math.random()*1.2,z+(Math.random()-.5)*2); world.add(s); fx.push({ s, t:0, life:1+Math.random()*.7, vx:(Math.random()-.5)*1.2, vy:.5+Math.random()*.7, vz:(Math.random()-.5)*1.2, g:0, grow:2.2, op:.45 }); } }
function sparks(x,y,z,n){ cnt.sparks+=n; for(let i=0;i<n;i++){ const s=glow(Math.random()<.5?0xffd24a:0x9dff9a,.55+Math.random()*.5,.001); s.position.set(x,y,z); world.add(s); const a=Math.random()*6.283, v=3+Math.random()*5; fx.push({ s, t:0, life:1.6+Math.random()*1.2, vx:Math.cos(a)*v*.6, vy:7+Math.random()*6, vz:Math.sin(a)*v*.6, g:-14, grow:0, op:.95 }); } }
WORLDANIM.push(dt=>{ for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.t+=dt; const k=f.t/f.life; if(k>=1){ world.remove(f.s); f.s.material.dispose(); fx.splice(i,1); continue; } f.vy+=f.g*dt; f.s.position.x+=f.vx*dt; f.s.position.y+=f.vy*dt; f.s.position.z+=f.vz*dt; f.s.material.opacity=f.op*Math.sin(Math.min(1,k*1.6)*PI)*(1-k*.3); if(f.grow) f.s.scale.setScalar(f.s.scale.x+dt*f.grow); } });
// ---- where things are
const mountOf=sp=>PW.mounts().find(m=>m.sp===sp);
const restOf=sp=>({ x:sp.cx0+sp.nx*5, z:sp.cz0+sp.nz*5 });
const mortarPos=sp=>{ const m=mountOf(sp); if(m&&m.holder){ const v=new THREE.Vector3(); m.holder.getWorldPosition(v); return v; } const r=restOf(sp); return new THREE.Vector3(r.x,0,r.z); };
function pickTarget(d){ let best=null, bs=-1e9; const fx_=Math.sin(d.yaw), fz_=Math.cos(d.yaw);
  for(const q of enemies){ if(q.dead||q.fly) continue; const dx=q.x-d.x, dz=q.z-d.z, dist=Math.hypot(dx,dz); if(dist<8||dist>70) continue; let n=0; for(const o of enemies){ if(!o.dead&&!o.fly&&Math.hypot(o.x-q.x,o.z-q.z)<7) n++; }
    const covered=window.__blight&&window.__blight.madCover(q.x,q.z), cone=((dx*fx_+dz*fz_)/dist)>.45?1:0; const sc=n*10+cone*40-(covered?1000:0)-(q.madT>0?400:0)-dist*.1; if(sc>bs){ bs=sc; best=q; } }
  return best; }
function volley(which){ const sp=which===0?SH.first:SH.second; const m=mountOf(sp); if(!m||!m.d||!defs.includes(m.d)) return; const d=m.d; const tg=pickTarget(d); if(!tg) return;
  const before=new Set(projs); d.yaw=Math.atan2(tg.x-d.x,tg.z-d.z); fire(d,tg); d.ammo=PW.AMMO;   // free: the shell it just spent is put back
  const sh=projs.find(p=>!before.has(p)&&p.kind==='turnip'); if(sh) SH.shells.push({ p:sh, which, t0:SH.t, last:null }); cnt.volleys++; }
const centroid=list=>{ let x=0,z=0,n=0; for(const e of list){ x+=e.x; z+=e.z; n++; } return n?{ x:x/n, z:z/n, n }:null; };
function meleeFocus(){ const mad=enemies.filter(e=>!e.dead&&e.madT>0); let c=centroid(mad); if(!c&&SH.impact) c={ x:SH.impact.x, z:SH.impact.z, n:0 }; if(!c){ const live=enemies.filter(e=>!e.dead&&!e.fly); c=centroid(live)||{ x:0, z:20, n:0 }; } return c; }
// ---- the camera
const P=new THREE.Vector3(), L=new THREE.Vector3(), V=new THREE.Vector3();
// a clear angle round a point: the first of sixteen headings (from a0) where the camera stands in open air (not in a wall, not below a higher terrace) and sees the point (nothing solid between); chosen once a shot so the sweep never cuts into stone
function clearAng(f,r,h,a0,sweep){ const fy=((typeof floorH==='function'?floorH(f.x,f.z):0)||0); for(let k=0;k<16;k++){ const a=a0+k*PI/8; let ok=true; for(const s of [0,.5,1]){ const aa=a+(sweep||0)*s, x=f.x+Math.sin(aa)*r, z=f.z+Math.cos(aa)*r, c=gat(wc(x),wcz(z)); if(!inb(wc(x),wcz(z))||c===T.WALL||c===T.PILLAR||((typeof floorH==='function'?floorH(x,z):0)||0)>fy+h-2||!los(x,z,f.x,f.z)){ ok=false; break; } } if(ok) return a; } return a0; }
const camY=(x,z,y,min)=>Math.max(y,((typeof floorH==='function'?floorH(x,z):0)||0)+(min||4.5));   // never below the floor under the camera by more than the least height (the terraces' pipes and walls)
// build 384 (Matt: "the camera goes behind a wall during part of it"): every shot's camera is made SAFE before it is used -- if it would stand in a wall or a pillar, below the floor under it (inside a terrace), or with stone between it and what it looks at, it slides
// along the line toward what it looks at until it is in open air with a clear view (and never closer than three units). cnt.pulled counts the frames it had to
const fH=(x,z)=>((typeof floorH==='function'?floorH(x,z):0)||0);
const clearAt=(x,y,z,lx,ly,lz)=>{ const cx=wc(x), cz=wcz(z); if(!inb(cx,cz)) return false; const c=gat(cx,cz); if(c===T.WALL||c===T.PILLAR) return false; if(y<fH(x,z)+.9) return false; if(!los(x,z,lx,lz)) return false;
  for(let t=.08;t<.92;t+=.08){ const px=x+(lx-x)*t, py=y+(ly-y)*t, pz=z+(lz-z)*t; if(fH(px,pz)>py-.3) return false; } return true; };   // and no terrace edge between it and what it looks at
function put(px,py,pz,lx,ly,lz){ let x=px, y=py, z=pz; if(!clearAt(x,y,z,lx,ly,lz)){ const d=Math.hypot(px-lx,py-ly,pz-lz)||1; for(let s=.05;s<=1;s+=.05){ const k=Math.min(s,Math.max(0,1-3/d)); x=px+(lx-px)*k; y=py+(ly-py)*k; z=pz+(lz-pz)*k; if(clearAt(x,y,z,lx,ly,lz)) break; } y=Math.max(y,((typeof floorH==='function'?floorH(x,z):0)||0)+1.2); cnt.pulled=(cnt.pulled||0)+1; }
  camera.position.set(x,y,z); camera.lookAt(lx,ly,lz); }
function showCamera(dt){ const t=SH.t; let si=SHOTS.findIndex(([a,b])=>t>=a&&t<b); if(si<0) si=SHOTS.length-1; SH.shot=si; const [a,b]=SHOTS[si], k=smooth((t-a)/(b-a)), sp=SH.first, sp2=SH.second;
  const side=-(Math.sign(sp.cx0)||1), C=new THREE.Vector3(sp.cx0,3.4,sp.cz0);
  if(si===0){ P.set(C.x+sp.nx*13+sp.tx*side*7,4.6,C.z+sp.nz*13+sp.tz*side*7); V.set(C.x+sp.nx*7+sp.tx*side*3,2.1,C.z+sp.nz*7+sp.tz*side*3); P.lerp(V,k); put(P.x,P.y,P.z,C.x,C.y,C.z); }
  else if(si===1){ put(lerp(0,0,k),lerp(5.8,4.4,k),lerp(25,15.5,k),0,3.2,-1); }
  else if(si===2){ const ang=lerp(-.8,.8,k), r=lerp(11,9.5,k); put(Math.sin(ang)*r,lerp(2.2,3.6,k),2.5+Math.cos(ang)*r,0,3.4,3); }   // (build 384: a tighter swing, so it stays in the pit and never dips into the lower terrace's edge)
  else if(si===3){ const s0=SH.shells[0]; const sp0=SH.shells.length?(SH.shells[0].which===0?sp:sp2):sp, mp=mortarPos(sp0);
    if(t<9.9||!s0){ const sd=Math.sign(mp.x)||1; put(mp.x-sd*4.6,mp.y+3.4,mp.z+3,mp.x,mp.y+3.6,mp.z-1); }
    else { const p=s0.p; if(projs.includes(p)){ const vx=p.vx||0, vz=p.vz||0, vl=Math.hypot(vx,vz)||1; s0.last={ x:p.x, y:p.y, z:p.z }; SH.impact={ x:p.x, z:p.z }; put(p.x-vx/vl*8,p.y+3.4,p.z-vz/vl*8,p.x+vx/vl*6,p.y-.4,p.z+vz/vl*6); }
      else { const im=s0.last||SH.impact||{ x:0, y:0, z:20 }; if(s0.last) SH.impact={ x:s0.last.x, z:s0.last.z }; if(SH.a3===undefined) SH.a3=clearAng(im,13,11,.2,.6); const ang=SH.a3+lerp(0,.6,k), cx=im.x+Math.sin(ang)*13, cz=im.z+Math.cos(ang)*13; put(cx,camY(cx,cz,(im.y||0)+11,6),cz,im.x,(im.y||0)+1.2,im.z); } } }
  else if(si===4){ const c=meleeFocus(); SH.focus=SH.focus||{ x:c.x, z:c.z }; SH.focus.x+=(c.x-SH.focus.x)*Math.min(1,dt*2.5); SH.focus.z+=(c.z-SH.focus.z)*Math.min(1,dt*2.5); if(SH.a4===undefined) SH.a4=clearAng(SH.focus,28,14,.3,1.1); const ang=SH.a4+lerp(0,1.1,k), r=lerp(27,30,k), h=lerp(15,13,k), f=SH.focus; const fy=(typeof floorH==='function'?floorH(f.x,f.z):0)||0, cx=f.x+Math.sin(ang)*r, cz=f.z+Math.cos(ang)*r; put(cx,camY(cx,cz,fy+h,6),cz,f.x,fy+1.4,f.z); }
  else if(si===5){ const c=meleeFocus(); SH.focus=SH.focus||{ x:c.x, z:c.z }; SH.focus.x+=(c.x-SH.focus.x)*Math.min(1,dt*2.5); SH.focus.z+=(c.z-SH.focus.z)*Math.min(1,dt*2.5); if(SH.a5===undefined) SH.a5=clearAng(SH.focus,10,5,1.4,1.6); const ang=SH.a5+lerp(0,1.6,k), r=lerp(11,9,k), h=lerp(5.2,4.4,k), f=SH.focus; const fy=(typeof floorH==='function'?floorH(f.x,f.z):0)||0, cx=f.x+Math.sin(ang)*r, cz=f.z+Math.cos(ang)*r; put(cx,camY(cx,cz,fy+h,2),cz,f.x,fy+1.5,f.z); }
  else { const f=SH.focus||meleeFocus(), fy=(typeof floorH==='function'?floorH(f.x,f.z):0)||0; if(SH.a6===undefined) SH.a6=clearAng(f,14,8,(SH.a5===undefined?3.6:SH.a5+1.6),.4); const ang=SH.a6+lerp(0,.4,k), r=lerp(10,18,k), cx=f.x+Math.sin(ang)*r, cz=f.z+Math.cos(ang)*r; put(cx,camY(cx,cz,fy+lerp(5,12,k),2),cz,f.x,fy+1.6,f.z); } }
// ---- the show
function start(sp){ SH.active=true; SH.t=0; SH.a3=SH.a4=SH.a5=SH.a6=undefined; SH.first=sp; SH.second=PW.raw().map(w=>w.spot).find(s=>s&&s!==sp); SH.ev={}; SH.vi=0; SH.shells=[]; SH.impact=null; SH.focus=null; SH.hp0=hero.hp; SH.skipped=false; SH.dustT=0; SH.shot=-1; SH.blend=0; cnt.starts++; letterbox(true); skipBtn.style.opacity=.85; skipBtn.style.pointerEvents='auto'; showMusic(); return true; }
const NOSHOW=new URLSearchParams(location.search).has('noshow');   // ?noshow: the doors just open (the tests that break them and then act)
function onBreak(sp){ if(SH.active||SH.done||NOSHOW||isGuest()||inCoop()||!sp) return false; return start(sp); }
function breakSecond(){ const sp2=SH.second; const w=PW.raw().find(q=>q.spot===sp2); if(w&&!w.broken){ w.locked=false; w.hit(1e9,new THREE.Vector3(sp2.cx0,2,sp2.cz0),new THREE.Vector3(-sp2.nx,0,-sp2.nz)); } }
function step(dt){ const t=SH.t; if(S.phase==='dead'||S.phase==='won'){ end(); return; }
  if(hero.dead<=0&&hero.hp<SH.hp0) hero.hp=SH.hp0;   // untouchable while the bars are on
  for(const m of PW.mounts()){ if(!m.d||!m.rolled) continue; if(m.d.ammo===undefined||m.d.ammo<PW.AMMO) m.d.ammo=PW.AMMO; }   // the whole show is free and SCRIPTED: the mortars take only the eight volleys below, never one of their own (their cooldown is held), so every shell is seen and the mist is not a wall
  if(!SH.ev.second&&t>=T_SECOND){ SH.ev.second=1; breakSecond(); }
  SH.dustT-=dt; if(SH.dustT<=0){ SH.dustT=.14; for(const m of PW.mounts()){ if(m.rolled||!m.holder) continue; const v=mortarPos(m.sp); dust(v.x,.5,v.z,2); } }
  if(!SH.ev.fan&&t>=T_FAN){ SH.ev.fan=1; if(!showNode) fanfare(); for(const sp of [SH.first,SH.second]){ const v=mortarPos(sp); sparks(v.x,v.y+2.4,v.z,34); } camShake=Math.max(camShake,.5); }
  while(SH.vi<VOLLEYS.length&&t>=VOLLEYS[SH.vi][0]){ volley(VOLLEYS[SH.vi][1]); SH.vi++; }
  if(t>=T_END) end(); }
function end(){ if(!SH.active) return; SH.active=false; SH.done=true; showMusicOff(); releaseHeld(); letterbox(false); skipBtn.style.opacity=0; skipBtn.style.pointerEvents='none';
  for(const m of PW.mounts()){ if(m.d) m.d.ammo=PW.AMMO; }   // every volley was free
  SH.endP=camera.position.clone(); SH.endQ=camera.quaternion.clone(); SH.blend=BLEND; cnt.ends++; }
function skip(){ if(!SH.active) return false; SH.skipped=true; cnt.skips++; if(!SH.ev.second){ SH.ev.second=1; breakSecond(); } for(const m of PW.mounts()) if(!m.rolled) m.t=m.dur; end(); return true; }
// build 385 (Matt: "i think the game should pause so i can enjoy the cinematic"): while the show plays the hall is PAUSED for everything but the show -- the wave clock stops (no one new comes out), the towers hold their fire, nothing can hurt the
// Heartroot, a tower or the hero, and the horde stands where it is -- except the mobs the mist has maddened, which fight each other in front of the camera, and the mortars' shells, flying and bursting. When it ends the game picks up exactly where it was
const held=new Map();   // a mob -> its own speed, while it is held
function holdTick(dt){ for(const e of enemies){ if(e.dead) continue; if(!held.has(e)) held.set(e,{ spd:e.spd, spd0:e.spd0 }); const h=held.get(e); if(e.madT>0){ e.spd=h.spd; if(h.spd0!==undefined) e.spd0=h.spd0; } else { e.spd=0; if(h.spd0!==undefined) e.spd0=0; } }
  const pos=new Map(); for(const e of enemies) if(!e.dead&&!(e.madT>0)) pos.set(e,[e.x,e.z]);
  updateEnemies(dt); updateProj(dt);
  for(const [e,p] of pos){ if(e.dead||e.madT>0) continue; e.x=p[0]; e.z=p[1]; if(e.mdl&&e.mdl.g){ e.mdl.g.position.x=e.x; e.mdl.g.position.z=e.z; } }   /* held: not a step (a cart's crew, a shove) */ }
function releaseHeld(){ for(const [e,h] of held){ if(e.dead) continue; e.spd=h.spd; if(h.spd0!==undefined) e.spd0=h.spd0; } held.clear(); }
{ const prev=update; update=function(dt){ if(!SH.active) return prev.apply(this,arguments); if(S.phase==='dead'||S.phase==='won'||S.phase==='start'){ end(); return prev.apply(this,arguments); }
    SH.t+=dt; step(dt); if(!SH.active) return prev.apply(this,arguments);
    holdTick(dt); updateFx(dt); updateCamera(dt); for(const d of defs) towerChevrons(d,d.mdl,d.kind,d.lvl); updateHUD(); Meta.hud(); cnt.paused=(cnt.paused||0)+1; }; }
{ const prev=hurtDef; hurtDef=function(){ if(SH.active) return; return prev.apply(this,arguments); }; }
{ const prev=hurtCrystal; hurtCrystal=function(){ if(SH.active) return; return prev.apply(this,arguments); }; }
{ const prev=heroUpdate; heroUpdate=function(dt){ if(SH.active) return; return prev.apply(this,arguments); }; }   // held: no walking, no swing, no gravity change
{ const prev=hurtHero; hurtHero=function(){ if(SH.active) return; return prev.apply(this,arguments); }; }   // untouchable: no blow reaches him while the bars are on
{ const prev=swing; swing=function(){ if(SH.active) return; return prev.apply(this,arguments); }; }
{ const prev=jump; jump=function(){ if(SH.active) return; return prev.apply(this,arguments); }; }
{ const prev=confirmPlace; confirmPlace=function(){ if(SH.active) return; return prev.apply(this,arguments); }; }
{ const prev=updateCamera; updateCamera=function(dt){ if(SH.active){ showCamera(dt); return; } prev.apply(this,arguments);
    if(SH.blend>0&&SH.endP){ SH.blend=Math.max(0,SH.blend-dt); const k=smooth(1-SH.blend/BLEND), q=camera.quaternion.clone(); camera.position.copy(SH.endP).lerp(camera.position,k); camera.quaternion.copy(SH.endQ).slerp(q,k); } }; }
// ---- a new run plays it again; the dev panel can play it
let sawStart=false; WORLDANIM.push(()=>{ if(S.phase==='start'){ if(!sawStart){ sawStart=true; SH.done=false; } } else sawStart=false; });
setInterval(()=>{ const p=document.getElementById('devpanel'); if(!p||document.getElementById('dp-mortarshow')) return; const sec=document.createElement('div'); sec.className='sect'; sec.id='dp-mortarshow';
  sec.innerHTML='<label>the mortar show (plays when the first door breaks)</label><div class="row"><button id="dp-ms-go">🎺 Break a door now</button></div>'; const note=p.querySelector('.note'); if(note) p.insertBefore(sec,note); else p.appendChild(sec);
  document.getElementById('dp-ms-go').onclick=()=>{ try{ window.__mortarwake.wake(); }catch(er){} const w=PW.raw().find(q=>!q.broken); if(w){ w.locked=false; w.hit(1e9,new THREE.Vector3(w.spot.cx0,2,w.spot.cz0),new THREE.Vector3(-w.spot.nx,0,-w.spot.nz)); } }; },800);
window.__mortarshow={ onBreak, skip, fanfare, reset:()=>{ if(SH.active) return false; SH.done=false; SH.blend=0; return true; }, active:()=>SH.active, done:()=>SH.done, times:{ T_SECOND, T_FAN, T_END, VOLLEYS:VOLLEYS.map(v=>v.slice()), SHOTS:SHOTS.map(s=>s.slice()) },
  music:()=>({ loaded:!!showBuf, playing:!!showNode, played:mus.played, failed:mus.failed, offset:SHOW_OFFSET }), loadMusic:loadShow,
  info:()=>Object.assign({ pulled:cnt.pulled||0, first:SH.first&&SH.first.id, second:SH.second&&SH.second.id, secondWall:(()=>{ const w=SH.second&&PW.raw().find(q=>q.spot===SH.second); return w?{ broken:w.broken, locked:w.locked }:null; })(), active:SH.active, done:SH.done, t:+SH.t.toFixed(2), shot:SH.shot, vi:SH.vi, shells:SH.shells.length, impact:SH.impact?{ x:+SH.impact.x.toFixed(1), z:+SH.impact.z.toFixed(1) }:null, skipped:SH.skipped, bars:bars.map(b=>b.style.height), blend:+SH.blend.toFixed(2), fx:fx.length, ev:Object.assign({},SH.ev) },cnt) };
})();
