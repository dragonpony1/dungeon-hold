// ===== INTO THE GARDEN -- the Cloister Court's opening scene (build 553). Matt picked it next ("Into the garden.") and set one rule: "Don't put moving topiaries in it" -- the topiaries stand
// still, statues in their beds, the only hint that something is wrong is the garden going quiet around them. The plan said daylight through a broken wall; the court is a NIGHT garden (stars,
// its own glow), so the light is the moon's. Plays once, the first time the Cloister Court's build phase begins (after the page's sound is open: 96s-cinematics.js); the 🎬 gallery replays it.
// ~32 s on the wall clock:
//    0.0  MOONRISE -- from black, up at the stars over the colonnade: a pale moon clears the wall.
//    5.0  THE GARDEN -- down into the west lane, gliding between the hedges, fireflies drifting over the beds, crickets.
//   13.0  THE TREE -- the giant white-and-gold tree from its roots up to its glittering crown, the moon behind it.
//   20.0  THE STATUES -- a slow pass by a clipped-hedge gnome on its pedestal; the crickets stop, the fireflies dim, a cold wind.
//   26.0  THE FOUR -- the heroes on the path, looking in at the tree; the camera rises; THE CLOISTER COURT.
// Music: Matt's "Shire Fields" (Eyal Talmudi -- one of the three he sent for the tavern; assets/music-garden.mp3), from the first frame; when the scene ends by itself it plays on to its own end
// (the court's music held meanwhile, fading if the horn sounds first); skipping stops it. The four are the prologue's (window.__prologue.crew). Test hook: window.__garden.
(function(){
'use strict';
window.__garden={ info:()=>null };
if(!window.CINE) return;
const ID='garden', DUR=32, GARDEN=typeof MAP!=='undefined'&&MAP&&MAP.id==='court';
const SH={ moon:0, lane:5, tree:13, statues:20, four:26 };
const cnt={ setups:0, teardowns:0, chirps:0, music:0, heroes:0, weapons:0, flies:0 };
const ssm=k=>k<=0?0:k>=1?1:k*k*(3-2*k), L3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
let prng=1; const rand=()=>{ prng=(prng*16807)%2147483647; return (prng-1)/2147483646; };
// ---------------------------------------------------------------- the song (as the tavern's: on the effects channel, plays on after a scene that ends by itself)
let TUNE=null, tuneBytes=null, tuneSrc=null, tuneGain=null, tuneOn=false;
function tuneFetch(){ if(tuneFetch.on) return; tuneFetch.on=true; try{ (typeof fetchBytesNow==='function'?fetchBytesNow:fetchBytes)(ASSET('music-garden.mp3')).then(b=>{ tuneBytes=b; }).catch(()=>{}); }catch(e){} }
function tunePrep(U){ if(!TUNE&&tuneBytes&&!tuneBytes.__dec&&U&&U.a){ tuneBytes.__dec=1; U.a.decodeAudioData(tuneBytes.slice(0),b=>{ TUNE=b; },()=>{}); } }
function tunePlay(U){ if(tuneSrc||!TUNE||!U||!U.a) return; tuneGain=U.a.createGain(); tuneGain.gain.value=.8; tuneGain.connect(SFXOUT(U.a)); tuneSrc=U.a.createBufferSource(); tuneSrc.buffer=TUNE; tuneSrc.connect(tuneGain);
  const me=tuneSrc; tuneSrc.onended=()=>{ if(tuneSrc===me) tuneSrc=null; if(tuneOn){ tuneOn=false; try{ musicForPhase(); }catch(e){} } }; tuneSrc.start(); cnt.music++; }
function tuneStop(fade){ if(!tuneSrc) return; try{ const g=tuneGain.gain, t=tuneGain.context.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value,t); g.linearRampToValueAtTime(0,t+fade); tuneSrc.stop(t+fade+.05); }catch(e){} tuneSrc=null; }
{ const prev=setMusic; setMusic=function(m){ if(tuneOn&&tuneSrc&&m!=='none') return prev('none'); return prev.apply(this,arguments); }; }
if(typeof setMusicRaw==='function'){ const p2=setMusicRaw; setMusicRaw=function(m){ if(tuneOn&&tuneSrc&&m!=='none') return p2('none'); return p2.apply(this,arguments); }; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(tuneOn&&tuneSrc&&S.phase==='wave'){ tuneOn=false; tuneStop(2.5); try{ musicForPhase(); }catch(e){} } }; }
// night sounds on the scene's own bus: a cricket's chirp, a cold gust
function chirp(U,vol,pan){ if(!U||!U.a) return; const a=U.a, t=a.currentTime, f=4200+Math.random()*900; for(let i=0;i<3;i++){ const o=a.createOscillator(), g=a.createGain(), t0=t+i*.055; o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(.0001,t0); g.gain.exponentialRampToValueAtTime(vol,t0+.008); g.gain.exponentialRampToValueAtTime(.0001,t0+.04);
    let n=g; if(a.createStereoPanner){ const p=a.createStereoPanner(); p.pan.value=pan; g.connect(p); n=p; } o.connect(g); n.connect(U.sfx); o.start(t0); o.stop(t0+.05); } cnt.chirps++; }
function gust(U){ if(!U||!U.a) return; const a=U.a, t=a.currentTime, len=4, n=a.createBufferSource(), b=a.createBuffer(1,(a.sampleRate*len)|0,a.sampleRate), c=b.getChannelData(0); for(let i=0;i<c.length;i++) c[i]=Math.random()*2-1; n.buffer=b;
  const bp=a.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=.8; bp.frequency.setValueAtTime(300,t); bp.frequency.linearRampToValueAtTime(900,t+1.8); bp.frequency.linearRampToValueAtTime(400,t+len); const g=a.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.09,t+1.6); g.gain.exponentialRampToValueAtTime(.0001,t+len); n.connect(bp).connect(g).connect(U.sfx); n.start(t); }
// ---------------------------------------------------------------- the scene
const OWN=[]; let heroes=[], flies=null, flyMat=null, moon=null, moonG=null, A_={}, lastT=0, lastCut=null, chirpT=0;
const P_=(cx,cz)=>[cw(cx),cwz(cz)];
function setup(ctx){ if(!GARDEN) return false; const C2=window.__prologue&&window.__prologue.crew; cnt.setups++; prng=5821; tuneSrc=null; heroes=[]; lastT=0; chirpT=.4;
  const [tx,tz]=P_(21.5,21.5); A_.tree={ x:tx, z:tz, y:baseFloor(tx+3,tz+3) };
  const [lx,lz0]=P_(6,31), [,lz1]=P_(6,17); A_.lane={ x:lx, z0:lz0, z1:lz1, y:baseFloor(lx,lz0) };
  const T=(window.__courtdecor&&window.__courtdecor.topi&&window.__courtdecor.topi())||[]; const lane=T.filter(s=>!s.terrace); A_.statue=lane.sort((a,b)=>Math.hypot(a.x-tx,a.z-tz)-Math.hypot(b.x-tx,b.z-tz))[0]||{ x:tx+8, y:A_.tree.y, z:tz, face:0 };
  const [hx,hz]=P_(26,27); A_.four={ x:hx, z:hz, y:baseFloor(hx,hz) };
  // the moon: a pale disc and its halo, high over the north colonnade
  const mm=new THREE.MeshBasicMaterial({ color:C(0xf4f0e0), fog:false }); OWN.push(mm); moon=new THREE.Mesh(new THREE.CircleGeometry(6,40),mm); moon.userData.cineOwn=true; moon.userData.noOL=true; ctx.group.add(moon);
  moonG=glow(0xbcd4ff,40,.55); moonG.material.fog=false; ctx.group.add(moonG); OWN.push(moonG.material);
  // fireflies over the whole garden
  { const N=520, pos=new Float32Array(N*3); for(let i=0;i<N;i++){ const [x,z]=P_(5+rand()*33,5+rand()*33); pos[i*3]=x; pos[i*3+1]=baseFloor(x,z)+.5+rand()*2.6; pos[i*3+2]=z; }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); flyMat=new THREE.PointsMaterial({ color:C(0xd8ff6a), size:.22, map:GLOWT, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:.9 }); OWN.push(flyMat);
    flies=new THREE.Points(geo,flyMat); flies.userData.cineOwn=true; flies.userData.base=pos.slice(); ctx.group.add(flies); cnt.flies=N; }
  // the four on the path, looking in at the tree
  const P=window.__party&&window.__party.model; const off=[[-1.3,-1],[1.3,-1],[-.5,1.2],[1.8,1.4]];
  if(C2) C2.CREW.forEach((h,i)=>{ const m=C2.MODEL[h.id]; if(!m) return; const x=A_.four.x+off[i][0], z=A_.four.z+off[i][1], yaw=Math.atan2(tx-x,tz-z); m.wrap.position.set(x,baseFloor(x,z),z); m.wrap.rotation.y=yaw; m.wrap.visible=false; ctx.group.add(m.wrap);
    if(P&&m.actions.idle){ P.play(m,'idle',{fade:0,restart:true}); m.actions.idle.time=rand()*2; } const mt=P&&P.mount(m.root); if(mt&&window.__weapons&&window.__weapons.attach) window.__weapons.attach(mt,h.w,5,null,obj=>{ m.wobj=obj; try{ m.wglow=window.__heldglow&&window.__heldglow.dress?window.__heldglow.dress(obj):null; }catch(e){} cnt.weapons++; });
    heroes.push({ h, m }); });
  cnt.heroes=heroes.length; return true; }
function camFor(t){ const TR=A_.tree, L=A_.lane, St=A_.statue, F=A_.four;
  if(t<SH.lane){ const k=ssm(t/SH.lane); const p=[L.x+1.5,L.y+2+.8*k,L.z0+3]; return { p, l:[L.x+4,L.y+16-12*ssm((t-2.6)/2.4),L.z0-30], fov:58, name:'moon' }; }
  if(t<SH.tree){ const k=ssm((t-SH.lane)/(SH.tree-SH.lane)); const z=L.z0+(L.z1-L.z0)*k; return { p:[L.x+.2,L.y+1.75,z+2.5], l:[L.x+.6,L.y+1.3,z-6], fov:56, name:'lane' }; }
  if(t<SH.statues){ const k=ssm((t-SH.tree)/(SH.statues-SH.tree)), a=2.4+.7*k, r=13-2*k; return { p:[TR.x+Math.sin(a)*r,TR.y+1.4+9*k,TR.z+Math.cos(a)*r], l:[TR.x,TR.y+3+15*k,TR.z], fov:52, name:'tree' }; }
  if(t<SH.four){ const k=ssm((t-SH.statues)/(SH.four-SH.statues)), a=St.face+.9-1.5*k, r=4.2; return { p:[St.x+Math.sin(a)*r,St.y+2.3-.4*k,St.z+Math.cos(a)*r], l:[St.x,St.y+2.2,St.z], fov:44, name:'statues' }; }
  const k=ssm((t-SH.four)/(DUR-SH.four)), dx=F.x-TR.x, dz=F.z-TR.z, dl=Math.hypot(dx,dz)||1; return { p:[F.x+dx/dl*(5.2+2.2*k),F.y+1.9+3.2*k,F.z+dz/dl*(5.2+2.2*k)+1.2], l:L3([F.x,F.y+1.3,F.z],[(F.x+TR.x)/2,TR.y+2.6,(F.z+TR.z)/2],k*.8), fov:56, name:'four' }; }
function step(ctx,t,dt){ const U=ctx.audio;
  ctx.black(t<1.4?1-ssm(t/1.4):0); ctx.title(ssm((t-(SH.four+2.2))/1.3));
  // the moon, over the wall the camera first looks up at
  const L=A_.lane, rise=ssm(t/4.5); moon.position.set(L.x+12,L.y+24+8*rise,L.z0-46); moon.lookAt(camera.position); moonG.position.copy(moon.position); moonG.material.opacity=.45+.15*rise;
  // fireflies: drift and blink; they dim by the statues
  if(flies){ const p=flies.geometry.attributes.position.array, b=flies.userData.base; for(let i=0;i<p.length;i+=3){ const ph=i*.37; p[i]=b[i]+Math.sin(t*.6+ph)*.5; p[i+1]=b[i+1]+Math.sin(t*.9+ph*1.3)*.35; p[i+2]=b[i+2]+Math.cos(t*.5+ph)*.5; } flies.geometry.attributes.position.needsUpdate=true;
    const hush=t>=SH.statues&&t<SH.four?1-.75*ssm((t-SH.statues)/2):t>=SH.four?.25+.75*ssm((t-SH.four)/3):1; flyMat.opacity=(.75+.2*Math.sin(t*3))*hush; }
  // the four
  const showFour=t>=SH.four; for(const H of heroes){ H.m.wrap.visible=showFour; if(showFour&&H.m.mixer) H.m.mixer.update(dt); }
  // the camera
  const c=camFor(t); ctx.cam(c.p,c.l,c.fov); lastCut=c.name;
  // the sound: crickets until the statues, a gust there, the song throughout
  chirpT-=dt; const quiet=t>=SH.statues+.6&&t<SH.four+1.5; if(!quiet&&chirpT<=0){ chirpT=.35+Math.random()*.9; chirp(U,.018+Math.random()*.02,(Math.random()-.5)*1.6); }
  ctx.once('gust',SH.statues+.8,()=>{ gust(U); });
  ctx.once('swell',SH.four,()=>{ U.swell(.05); });
  tunePrep(U); if(!tuneSrc&&TUNE&&t<DUR-1.5) tunePlay(U);
  lastT=t; }
function teardown(ctx){ cnt.teardowns++; if(tuneSrc&&lastT>=DUR-.8){ tuneOn=true; try{ setMusic('none'); }catch(e){} } else tuneStop(.6);
  for(const H of heroes){ try{ H.m.mixer.stopAllAction(); }catch(e){} if(H.m.wobj&&H.m.wobj.parent) H.m.wobj.parent.remove(H.m.wobj); if(H.m.wrap.parent) H.m.wrap.parent.remove(H.m.wrap); H.m.wrap.rotation.y=0; }
  for(const m of OWN.splice(0)) try{ m.dispose(); }catch(e){}
  heroes=[]; flies=null; moon=null; moonG=null; }
try{ if(GARDEN&&!SILENT&&!(window.CINE.seen&&window.CINE.seen(ID))) tuneFetch(); }catch(e){}
CINE.register(ID,{ title:'THE CLOISTER COURT', sub:'INTO THE GARDEN', map:'court', pic:'cine-garden.jpg', dur:DUR,
  when:()=>GARDEN&&!TUTORIAL&&S.phase==='build'&&S.wave===0,
  ready:()=>{ tuneFetch(); const C2=window.__prologue&&window.__prologue.crew; return !!(C2&&C2.get())&&!!(window.__courtdecor&&window.__courtdecor.loaded&&window.__courtdecor.loaded()); },
  setup, step, teardown });
window.__garden={ info:()=>Object.assign({ tuneBytes:!!tuneBytes, tuneReady:!!TUNE, playingOn:tuneOn&&!!tuneSrc, heroesLive:heroes.length, flyOp:flyMat?+flyMat.opacity.toFixed(2):0, statue:A_.statue?{ x:+A_.statue.x.toFixed(1), z:+A_.statue.z.toFixed(1) }:null, cut:lastCut },cnt), cam:t=>camFor(t), SH, DUR };
})();
