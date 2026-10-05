// ===== GNOME SWEET GNOME -- the prologue's second half (build 545). Matt: "ready" (after "awesome cinematic"). The plan (memory rootgate-cinematics.md): the tavern, a mug that ripples to the
// horde's thuds, a goblin peeking in, the gnomes taking up arms, the eyes in the dark beyond the door, "...Last call.", the tavern tune quickening. Filmed in the Gnome Hall's own tavern room
// (65-tavernroom.js: bar on the east wall, hearth on the south, the table, the door north to the hall). Plays once, straight after THE ROOT REMEMBERS (the first Gnome Hall build phase, once that one
// is seen); the 🎬 gallery replays it. ~35 s on the wall clock:
//    0.0  THE MUG -- close on a foaming mug on the table; far-off thuds, each one rings the ale and makes the mug hop, closer and closer.
//    6.5  THE PEEK -- the tavern door from inside: a goblin leans round the doorframe, looks, ducks back out.
//   11.5  TO ARMS -- four quick cuts: the Knight's sword rings, the Witch's staff lights, the Fighter's polearm sweeps, the Ranger's bow comes up.
//   19.5  THE DOOR -- past the four, out through the door into the dark hall: eyes, hundreds, and a pink flash far off (Avery).
//   26.0  "...Last call." -- the tavern tune quickens; the four turn to the door.
//   31.0  GNOME SWEET GNOME -- the title.
// The heroes are the prologue's own (window.__prologue.crew: the same loaded models and set weapons); the goblin is a stand-in (makeMob); the tune is the hall's (assets/music-build.mp3) on the EFFECTS
// channel (Matt plays with music off). Everything is taken away after. Test hook: window.__tavernscene.
(function(){
'use strict';
window.__tavernscene={ info:()=>null };
if(!window.CINE) return;
const ID='tavern', DUR=35, PRE='prologue';
const SH={ mug:0, peek:6.5, arms:11.5, door:19.5, last:26, title:31 };
const HALL=typeof MAP!=='undefined'&&MAP&&MAP.id==='hall'&&!MAP.noTavern;
const cnt={ setups:0, teardowns:0, thumps:0, eyes:0, heroes:0, weapons:0, music:0, quick:0 };
const ssm=k=>k<=0?0:k>=1?1:k*k*(3-2*k), L3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
const TD=(typeof MAP!=='undefined'&&MAP&&MAP.tavern)||{ dx:0, dz:0 }; const at=(x,z)=>[cw(x+TD.dx),cwz(z+TD.dz)];
let prng=1; const rand=()=>{ prng=(prng*16807)%2147483647; return (prng-1)/2147483646; };
// ---------------------------------------------------------------- the caption ("...Last call."), the same style as the prologue's words, low on the screen
let words=null; function wordsEl(){ if(words) return words; words=document.createElement('div'); words.id='cineWords2';
  const st=document.createElement('style'); st.textContent='#cineWords2{position:fixed;left:50%;bottom:17vh;transform:translateX(-50%);z-index:96;pointer-events:none;font:italic clamp(24px,3.4vw,50px) Georgia,serif;color:#f3e2b8;letter-spacing:.05em;text-shadow:0 0 18px #ff9a4a66,0 2px 0 #000;opacity:0;white-space:nowrap}'; document.head.appendChild(st); document.body.appendChild(words); return words; }
// ---------------------------------------------------------------- the tune
let TUNE=null, tuneBytes=null, tuneSrc=null, tuneGain=null;
function tuneFetch(){ if(tuneFetch.on) return; tuneFetch.on=true; try{ (typeof fetchBytesNow==='function'?fetchBytesNow:fetchBytes)(ASSET('music-build.mp3')).then(b=>{ tuneBytes=b; }).catch(()=>{}); }catch(e){} }
function tunePrep(U){ if(!TUNE&&tuneBytes&&!tuneBytes.__dec&&U&&U.a){ tuneBytes.__dec=1; U.a.decodeAudioData(tuneBytes.slice(0),b=>{ TUNE=b; },()=>{}); } }
function tunePlay(U){ if(tuneSrc||!TUNE||!U||!U.a||!U.sfx) return; tuneGain=U.a.createGain(); tuneGain.gain.value=.55; tuneGain.connect(U.sfx); tuneSrc=U.a.createBufferSource(); tuneSrc.buffer=TUNE; tuneSrc.loop=true; tuneSrc.connect(tuneGain); tuneSrc.start(); cnt.music++; }
function tuneQuick(U){ if(!tuneSrc) return; try{ const t=U.a.currentTime; tuneSrc.playbackRate.setTargetAtTime(1.32,t,.6); tuneGain.gain.setTargetAtTime(.8,t,.6); cnt.quick++; }catch(e){} }
function tuneStop(fade){ if(!tuneSrc) return; try{ const g=tuneGain.gain, t=tuneGain.context.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value,t); g.linearRampToValueAtTime(0,t+fade); tuneSrc.stop(t+fade+.05); }catch(e){} tuneSrc=null; }
// small stings on the scene's own audio (U.a / U.sfx): a blade ringing, a staff igniting, a whoosh, a bowstring
function sting(U,kind){ if(!U||!U.a) return; const a=U.a, t=a.currentTime, g=a.createGain(); g.connect(U.sfx);
  if(kind==='shing'){ const o=a.createOscillator(); o.type='triangle'; o.frequency.setValueAtTime(2400,t); o.frequency.exponentialRampToValueAtTime(5200,t+.12); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.16,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+.9); o.connect(g); o.start(t); o.stop(t+1);
    const o2=a.createOscillator(); o2.type='sine'; o2.frequency.value=3700; const g2=a.createGain(); g2.gain.setValueAtTime(.06,t+.05); g2.gain.exponentialRampToValueAtTime(.0001,t+1.4); o2.connect(g2).connect(U.sfx); o2.start(t); o2.stop(t+1.5); return; }
  if(kind==='ignite'){ const o=a.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(90,t); o.frequency.exponentialRampToValueAtTime(420,t+.5); const lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.setValueAtTime(300,t); lp.frequency.exponentialRampToValueAtTime(2600,t+.5); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.12,t+.3); g.gain.exponentialRampToValueAtTime(.0001,t+1.1); o.connect(lp).connect(g); o.start(t); o.stop(t+1.2); return; }
  // whoosh / string: filtered noise
  const n=a.createBufferSource(), len=kind==='string'?.25:.5, b=a.createBuffer(1,(a.sampleRate*len)|0,a.sampleRate), c=b.getChannelData(0); for(let i=0;i<c.length;i++) c[i]=Math.random()*2-1; n.buffer=b;
  const bp=a.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=kind==='string'?6:1.2; bp.frequency.setValueAtTime(kind==='string'?900:400,t); bp.frequency.exponentialRampToValueAtTime(kind==='string'?300:2200,t+len);
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(kind==='string'?.25:.2,t+.03); g.gain.exponentialRampToValueAtTime(.0001,t+len); n.connect(bp).connect(g); n.start(t); }
// ---------------------------------------------------------------- the scene
const OWN=[]; function own(m){ m.userData.cineOwn=true; m.userData.noOL=true; return m; }
let heroes=[], gob=null, mug=null, rings=[], eyePts=null, eyeMat=null, pinkG=null, hearthF=null, R={}, thumpT=0, lastThump=-9, nThump=0, lastCut=null;
const SRC=[0,1,2,3,4,5].map(()=>({ x:0, y:-80, z:0, on:false, ph:0, k:1 }));
function setup(ctx){ if(!HALL) return false; const C2=window.__prologue&&window.__prologue.crew; if(!C2) return false; cnt.setups++; prng=9151; tuneSrc=null; heroes=[]; rings=[]; nThump=0; lastThump=-9; thumpT=1.1;
  // the room's spots (65-tavernroom.js)
  const [tbx,tbz]=at(15,28), [dox,doz]=at(16,24), [hx,hz]=at(16,31), [bx,bz]=at(19,28), [lx,lz]=at(12,26);
  R={ table:[tbx+1,tbz], door:[dox,doz], hearth:[hx,hz], bar:[bx,bz], locker:[lx,lz] }; const fy=baseFloor(tbx+1,tbz);  R.fy=fy;
  // the mug: on the near edge of the table, foam on top, ale under it, rings that spread on each thud
  mug=new THREE.Group(); mug.position.set(R.table[0]-.45,fy+.95,R.table[1]-.35); ctx.group.add(mug);
  const cream=new THREE.MeshToonMaterial({ color:C(0x7a4a26) }), brass=new THREE.MeshToonMaterial({ color:C(0xd8a84a) }), ale=new THREE.MeshBasicMaterial({ color:C(0xd99a30) }), foam=new THREE.MeshToonMaterial({ color:C(0xfff6e2) }); OWN.push(cream,brass,ale,foam);   /* a wooden tankard, brass bands */
  mug.add(own(new THREE.Mesh(new THREE.CylinderGeometry(.15,.135,.3,16),cream))).position.y=.15; for(const y of [.05,.25]){ const b=own(new THREE.Mesh(new THREE.TorusGeometry(.148,.012,5,20),brass)); b.rotation.x=PI/2; b.position.y=y; mug.add(b); } const hd=own(new THREE.Mesh(new THREE.TorusGeometry(.1,.026,6,12),cream)); hd.position.set(.18,.15,0); mug.add(hd);
  const aleT=own(new THREE.Mesh(new THREE.CircleGeometry(.135,20),ale)); aleT.rotation.x=-PI/2; aleT.position.y=.292; mug.add(aleT);
  for(let i=0;i<9;i++){ const f=own(new THREE.Mesh(new THREE.SphereGeometry(.045+rand()*.025,8,6),foam)); const a=i/9*TAU+rand()*.3, r=i===0?0:.06+rand()*.06; f.position.set(Math.cos(a)*r,.3+rand()*.025,Math.sin(a)*r); f.scale.y=.55; mug.add(f); }   /* a ring of foam, the ale showing in the middle */
  for(let i=0;i<3;i++){ const m=new THREE.MeshBasicMaterial({ color:C(0xffe6a8), transparent:true, opacity:0, depthWrite:false }); OWN.push(m); const rg=own(new THREE.Mesh(new THREE.RingGeometry(.8,1,24),m)); rg.rotation.x=-PI/2; rg.position.y=.29; rg.scale.setScalar(.01); mug.add(rg); rings.push({ rg, m, t:9 }); }
  // the four (the prologue's models), set where each one stands in the tavern
  const P=window.__party&&window.__party.model; const spots={ knight:[R.table[0]-1.25,R.table[1]+.2,PI*.5], witch:[R.hearth[0]-1.4,R.hearth[1]-1.6,PI*.9], fighter:[R.locker[0]+1.6,R.locker[1]+1.2,PI*.65], troll:[R.bar[0]-1.15,R.bar[1]-1.6,-PI*.6] };
  for(const h of C2.CREW){ const m=C2.MODEL[h.id]; if(!m) continue; const sp=spots[h.id]; m.wrap.position.set(sp[0],baseFloor(sp[0],sp[1]),sp[1]); m.wrap.rotation.y=sp[2]; m.wrap.visible=true; ctx.group.add(m.wrap);
    if(P&&m.actions.idle) P.play(m,'idle',{fade:0,restart:true}); const mt=P&&P.mount(m.root); if(mt&&window.__weapons&&window.__weapons.attach) window.__weapons.attach(mt,h.w,5,null,obj=>{ m.wobj=obj; try{ m.wglow=window.__heldglow&&window.__heldglow.dress?window.__heldglow.dress(obj):null; }catch(e){} cnt.weapons++; });
    heroes.push({ h, m, yaw0:sp[2], ht:2.3 }); }   /* a puppet hero stands about 2.3 here, head to toe (a skinned rig's box reads short) */
  cnt.heroes=heroes.length;
  // the goblin at the door (outside, just round the frame)
  try{ gob=makeMob('goblin'); }catch(e){ gob=null; } if(gob){ gob.g.visible=false; ctx.group.add(gob.g); const id=gob.actions&&(gob.actions.idle||gob.actions.walk); if(id){ id.reset(); id.play(); } }
  // eyes out in the hall: hundreds, in pairs, in the dark north of the door
  { const N=260, pos=new Float32Array(N*2*3), col=new Float32Array(N*2*3); for(let i=0;i<N;i++){ const z=R.door[1]-3-rand()*26, x=R.door[0]+(rand()-.5)*(2.4+(R.door[1]-z)*.55), y=baseFloor(x,z)+.9+rand()*1.1, sep=.09+rand()*.05, warm=rand()<.75;
      for(let s=0;s<2;s++){ const j=(i*2+s)*3; pos[j]=x+(s?sep:-sep); pos[j+1]=y; pos[j+2]=z; const c=warm?[1,.82,.25]:[1,.3,.2]; col[j]=c[0]; col[j+1]=c[1]; col[j+2]=c[2]; } }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    eyeMat=new THREE.PointsMaterial({ size:.2, map:GLOWT, vertexColors:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:0 }); OWN.push(eyeMat); eyePts=own(new THREE.Points(geo,eyeMat)); ctx.group.add(eyePts); cnt.eyes=N*2; }
  pinkG=glow(0xff4fc8,9,0); pinkG.position.set(R.door[0]+4,R.fy+4,R.door[1]-24); ctx.group.add(pinkG); OWN.push(pinkG.material);
  hearthF=glow(0xff8a2a,3.2,.8); hearthF.position.set(R.hearth[0],R.fy+.9,R.hearth[1]+.25); ctx.group.add(hearthF); OWN.push(hearthF.material);
  ctx.darken({ hemi:.05, emissive:.08, fog:[16,60], flat:.5, keep:[] }); const F=ctx.fireLights(6); F.I=1.6; F.dist=11; F.col=0xffa860;
  return true; }
function camFor(t){ const T=R.table, D=R.door, fy=R.fy;
  if(t<SH.peek){ const k=ssm(t/SH.peek), m=mug.position; return { p:[m.x-.62+.12*k,m.y+.78-.08*k,m.z-.5+.1*k], l:[m.x,m.y+.24,m.z], fov:42, name:'mug', f:{ x:m.x, y:m.y, z:m.z } }; }
  if(t<SH.arms){ const k=ssm((t-SH.peek)/(SH.arms-SH.peek)); return { p:[D[0]+.6,fy+1.45,D[1]+5.2-.6*k], l:[D[0]-.2,fy+1.25,D[1]-.4], fov:46, name:'peek', f:{ x:D[0], y:fy+1, z:D[1]+3 } }; }
  if(t<SH.door){ const i=Math.min(3,((t-SH.arms)/2)|0), H=heroes[i]; if(!H) return { p:[T[0],fy+2,T[1]+4], l:[T[0],fy+1,T[1]], fov:50, name:'arms'+i, f:{ x:T[0], y:fy+1, z:T[1] } };
    const p=H.m.wrap.position, y=H.yaw0, k=(t-SH.arms-i*2)/2, d=H.ht*1.55-.3*k, sd=H.ht*.35; return { p:[p.x+Math.sin(y)*d+Math.cos(y)*sd,p.y+H.ht*.82,p.z+Math.cos(y)*d-Math.sin(y)*sd], l:[p.x,p.y+H.ht*.66,p.z], fov:44, name:'arms'+i, f:{ x:p.x, y:p.y+1, z:p.z } }; }
  if(t<SH.last){ const k=ssm((t-SH.door)/(SH.last-SH.door)); return { p:L3([D[0]+.5,fy+1.5,D[1]+3.4],[D[0]+.1,fy+1.45,D[1]+.6],k), l:[D[0],fy+1.3,D[1]-12], fov:60, name:'door', f:{ x:D[0], y:fy+1, z:D[1]+3 } }; }
  if(t<SH.title){ const H=heroes.find(x=>x.h.id==='knight')||heroes[0]; const p=H.m.wrap.position, k=ssm((t-SH.last)/(SH.title-SH.last)); const hh=H.ht||2.3, y=H.m.wrap.rotation.y, d=hh*1.5-.25*k, sd=hh*.3; return { p:[p.x+Math.sin(y)*d+Math.cos(y)*sd,p.y+hh*.85,p.z+Math.cos(y)*d-Math.sin(y)*sd], l:[p.x,p.y+hh*.72,p.z], fov:40, name:'last', f:{ x:p.x, y:p.y+1, z:p.z } }; }
  const k=ssm((t-SH.title)/(DUR-SH.title)); return { p:L3([T[0]+.5,fy+2.4,T[1]+4.6],[T[0]+.5,fy+3.6,T[1]+6.2],k), l:[D[0],fy+1.2,D[1]-2], fov:54, name:'title', f:{ x:T[0], y:fy+1, z:T[1] } }; }
function step(ctx,t,dt){ const U=ctx.audio, F=ctx.fire, P=window.__party&&window.__party.model; const W=wordsEl();
  ctx.black(t<1.2?1-ssm(t/1.2):0); ctx.title(ssm((t-(SH.title+.5))/1.2));
  W.textContent='…Last call.'; W.style.opacity=String(t>=SH.last+1&&t<SH.title+.3?ssm((t-SH.last-1)/.6)*(1-ssm((t-SH.title)/.3)):0);
  // the thuds: slow and soft at first, closer and harder; each one rings the ale and makes the mug hop
  thumpT-=dt; if(t<SH.door&&thumpT<=0){ const k=Math.min(1,t/SH.door); thumpT=1.5-.6*k; lastThump=t; nThump++; cnt.thumps++; U.boom(.12+.22*k); const r=rings[nThump%rings.length]; r.t=0; if(window.__cam) {} }
  const hop=Math.exp(-(t-lastThump)*14); mug.position.y=R.fy+.95+.025*hop*(t<SH.peek?1:.3); mug.rotation.z=.03*hop*Math.sin(t*40);
  for(const r of rings){ r.t+=dt; const k=r.t/.9; if(k>=1){ r.m.opacity=0; continue; } r.rg.scale.setScalar(.01+.13*ssm(k)); r.m.opacity=.7*(1-k); }
  // the goblin: round the doorframe, a look, and back out
  if(gob){ const D=R.door, show=t>=SH.peek+.6&&t<SH.arms; gob.g.visible=show; if(show){ const k=t-SH.peek-.6, lean=k<1?ssm(k):k<3?1:1-ssm((k-3)/.9); gob.g.position.set(D[0]-1.5+.9*lean,R.fy,D[1]-.6); gob.g.rotation.y=Math.atan2(.4,1)+.25*Math.sin(k*2.2)*lean; if(gob.mixer) gob.mixer.update(dt); } }
  // the four: idle, each takes up arms on its cut, all turn to the door at the end
  for(const H of heroes){ if(H.m.mixer) H.m.mixer.update(dt); }
  heroes.forEach((H,i)=>{ ctx.once('arm'+i,SH.arms+i*2+.35,()=>{ if(P&&H.m.actions.attack) P.play(H.m,'attack',{fade:.08,restart:true}); sting(U,['shing','ignite','whoosh','string'][i]); }); ctx.once('back'+i,SH.arms+i*2+1.6,()=>{ if(P&&H.m.actions.idle) P.play(H.m,'idle',{fade:.25}); }); });
  if(t>=SH.last+1.4){ const k=ssm((t-SH.last-1.4)/1.6); for(const H of heroes){ const p=H.m.wrap.position, to=Math.atan2(R.door[0]-p.x,R.door[1]-p.z); let d=to-H.yaw0; while(d>PI) d-=TAU; while(d<-PI) d+=TAU; H.m.wrap.rotation.y=H.yaw0+d*k; } }
  // the dark beyond the door
  eyeMat.opacity=t>=SH.door?ssm((t-SH.door-.4)/2.5)*(.9+.1*Math.sin(t*3)):0; ctx.once('pink',SH.door+3.6,()=>{ U.swell(.06); });
  pinkG.material.opacity=t>=SH.door+3.6?.75*Math.exp(-(t-SH.door-3.6)*2.2):0;
  hearthF.material.opacity=.75+.15*Math.sin(t*9)+.08*Math.sin(t*23);
  // light: the hearth, the table, the bar, the door
  if(F){ const pts=[[R.hearth[0],R.fy+1.2,R.hearth[1]-.3],[R.table[0],R.fy+2.4,R.table[1]],[R.bar[0]-.8,R.fy+2.4,R.bar[1]-1],[R.locker[0]+1.8,R.fy+2.4,R.locker[1]+1],[R.door[0],R.fy+2.6,R.door[1]+1.4]];
    pts.forEach((p,i)=>{ const o=SRC[i]; o.x=p[0]; o.y=p[1]; o.z=p[2]; o.on=true; o.ph=i*1.7; o.k=i===0?1.25:.8; }); SRC[5].on=false; F.update(SRC,c0||{ x:R.table[0], y:R.fy+1, z:R.table[1] },dt,t); }
  const c=camFor(t); c0=c.f; ctx.cam(c.p,c.l,c.fov); if(c.name!==lastCut){ if(lastCut!==null&&F&&F.cut) F.cut(); lastCut=c.name; }
  // sound
  tunePrep(U); if(!tuneSrc&&TUNE&&t<DUR-1.5) tunePlay(U); ctx.once('quick',SH.last+1,()=>{ tuneQuick(U); });
  ctx.once('boomTitle',SH.title+.4,()=>{ U.boom(.45); });
  if(t>DUR-2) tuneStop(1.5); }
let c0=null;
function teardown(ctx){ cnt.teardowns++; tuneStop(.6); if(words) words.style.opacity='0';
  for(const H of heroes){ try{ H.m.mixer.stopAllAction(); }catch(e){} if(H.m.wobj&&H.m.wobj.parent) H.m.wobj.parent.remove(H.m.wobj); if(H.m.wrap.parent) H.m.wrap.parent.remove(H.m.wrap); H.m.wrap.rotation.y=0; }
  if(gob) try{ gob.mixer.stopAllAction(); }catch(e){}
  for(const m of OWN.splice(0)) try{ m.dispose(); }catch(e){}
  heroes=[]; gob=null; mug=null; rings=[]; eyePts=null; c0=null; }
CINE.register(ID,{ title:'GNOME SWEET GNOME', sub:'LAST CALL', map:'hall', pic:'cine-tavern.jpg', dur:DUR,
  when:()=>HALL&&!TUTORIAL&&S.phase==='build'&&S.wave===0&&!!(window.CINE.seen&&window.CINE.seen(PRE)),
  ready:()=>{ tuneFetch(); const C2=window.__prologue&&window.__prologue.crew; return !!(C2&&C2.get())&&!!MOBGLB.goblin; },
  setup, step, teardown });
window.__tavernscene={ info:()=>Object.assign({ tuneBytes:!!tuneBytes, tuneReady:!!TUNE, heroesLive:heroes.length, gob:!!gob, words:words?words.textContent:'', wordsOp:words?+words.style.opacity||0:0, eyeOp:eyeMat?+eyeMat.opacity.toFixed(2):0 },cnt), cam:t=>camFor(t), SH, DUR };
})();
