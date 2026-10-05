// ===== GNOME SWEET GNOME -- the prologue's second half. Built in build 545 (the tavern, the mug that ripples to the horde's thuds, a goblin peeking in, the gnomes taking up arms, the eyes beyond
// the door, "...Last call.") and filmed live in the Gnome Hall's own tavern room. Build 549 moved it to the Throne Room (Matt: "gnome sweet gnome upon entering the thrown room"), which has no
// tavern room, and rebuilt it on a set; build 550 (Matt: "You don't have to reshoot it just use the same video but move it to the throne room"): it plays THE SAME FOOTAGE he watched -- the Gnome
// Hall version recorded frame by frame (assets/cine-tavern.mp4, 1280x720 30 fps, 35 s, its letterbox, "...Last call." and title card already in the picture) -- as a video over the held hall, the
// first time the Throne Room's build phase begins. Its sound is played live in time with it: Matt's pick, Eyal Talmudi's "Drunken Barrel" (assets/music-tavernscene.mp3; at its own pace, and when the
// scene ends by itself it plays on to its own end, the hall's music held meanwhile, fading if the horn sounds first), the horde's thuds (harder and quicker as they near) and the four's stings.
// SPACE skips (96s-cinematics.js); the 🎬 gallery replays it. Test hook: window.__tavernscene.
(function(){
'use strict';
window.__tavernscene={ info:()=>null };
if(!window.CINE) return;
const ID='tavern', DUR=34.9;
const SH={ mug:0, peek:6.5, arms:11.5, door:19.5, last:26, title:31 };
const HALL=typeof MAP!=='undefined'&&MAP&&MAP.id==='throne';
const cnt={ setups:0, teardowns:0, thumps:0, stings:0, music:0, seeks:0 };
// ---------------------------------------------------------------- the footage
let vid=null; function video(){ if(vid) return vid; vid=document.createElement('video'); vid.id='cineVideo'; vid.muted=true; vid.playsInline=true; vid.preload='auto';
  const st=document.createElement('style'); st.textContent='#cineVideo{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:2;display:none;pointer-events:none}'; document.head.appendChild(st);
  (document.getElementById('cine')||document.body).appendChild(vid); vid.src=(typeof ASSET==='function'?ASSET('cine-tavern.mp4'):'assets/cine-tavern.mp4')+'?v=1'; return vid; }
const want=()=>HALL&&!(window.CINE.seen&&window.CINE.seen(ID));
// ---------------------------------------------------------------- the tune
let TUNE=null, tuneBytes=null, tuneSrc=null, tuneGain=null;
function tuneFetch(){ if(tuneFetch.on) return; tuneFetch.on=true; try{ (typeof fetchBytesNow==='function'?fetchBytesNow:fetchBytes)(ASSET('music-tavernscene.mp3')).then(b=>{ tuneBytes=b; }).catch(()=>{}); }catch(e){} }
function tunePrep(U){ if(!TUNE&&tuneBytes&&!tuneBytes.__dec&&U&&U.a){ tuneBytes.__dec=1; U.a.decodeAudioData(tuneBytes.slice(0),b=>{ TUNE=b; },()=>{}); } }
function tunePlay(U){ if(tuneSrc||!TUNE||!U||!U.a||!U.sfx) return; tuneGain=U.a.createGain(); tuneGain.gain.value=.75; tuneGain.connect(SFXOUT(U.a));   /* the effects channel itself, not the scene's own bus: it may outlive the scene */ tuneSrc=U.a.createBufferSource(); tuneSrc.buffer=TUNE; tuneSrc.loop=false; tuneSrc.connect(tuneGain); const me=tuneSrc; tuneSrc.onended=()=>{ if(tuneSrc===me) tuneSrc=null; if(tuneOn){ tuneOn=false; try{ musicForPhase(); }catch(e){} } }; tuneSrc.start(); cnt.music++; }
let tuneOn=false;   // the song playing on after the scene (the hall's own music held till it ends)
{ const prev=setMusic; setMusic=function(m){ if(tuneOn&&tuneSrc&&m!=='none') return prev('none'); return prev.apply(this,arguments); }; }
if(typeof setMusicRaw==='function'){ const p2=setMusicRaw; setMusicRaw=function(m){ if(tuneOn&&tuneSrc&&m!=='none') return p2('none'); return p2.apply(this,arguments); }; }   // the cinematics' own way back to the hall's music (96s-cinematics.js finish) waits too
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(tuneOn&&tuneSrc&&S.phase==='wave'){ tuneOn=false; tuneStop(2.5); try{ musicForPhase(); }catch(e){} } }; }
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
// ---------------------------------------------------------------- the scene: the video, held to the scene's clock; the sound on top
let thumpT=0, nThump=0, lastT=0;
function setup(ctx){ const v=video(); cnt.setups++; tuneSrc=null; thumpT=1.1; nThump=0; lastT=0; try{ v.currentTime=0; }catch(e){} v.style.display='block'; const p=v.play(); if(p&&p.catch) p.catch(()=>{}); return true; }
function step(ctx,t,dt){ const U=ctx.audio, v=vid; ctx.black(0); ctx.title(0);
  if(v){ if(window.__freeze){ if(!v.paused) v.pause(); if(Math.abs(v.currentTime-t)>.02){ v.currentTime=Math.min(t,DUR); } }
    else { if(v.paused&&t<DUR-.2){ const p=v.play(); if(p&&p.catch) p.catch(()=>{}); } if(Math.abs(v.currentTime-t)>.3){ v.currentTime=Math.min(t,DUR); cnt.seeks++; } } }
  // the thuds: slow and soft at first, closer and harder
  thumpT-=dt; if(t<SH.door&&thumpT<=0){ const k=Math.min(1,t/SH.door); thumpT=1.5-.6*k; nThump++; cnt.thumps++; U.boom(.12+.22*k); }
  // the four take up arms, one cut each
  ['shing','ignite','whoosh','string'].forEach((s,i)=>ctx.once('arm'+i,SH.arms+i*2+.35,()=>{ sting(U,s); cnt.stings++; }));
  ctx.once('boomTitle',SH.title+.4,()=>{ U.boom(.45); });
  tunePrep(U); if(!tuneSrc&&TUNE&&t<DUR-1.5) tunePlay(U);
  lastT=t; }
function teardown(ctx){ cnt.teardowns++; if(vid){ try{ vid.pause(); }catch(e){} vid.style.display='none'; }
  if(tuneSrc&&lastT>=DUR-.8){ tuneOn=true; cnt.playOn=(cnt.playOn|0)+1; try{ setMusic('none'); }catch(e){} } else tuneStop(.6);   /* ended by itself: the song plays on; skipped: it stops */ }
try{ if(want()&&!SILENT){ video(); tuneFetch(); } }catch(e){}
CINE.register(ID,{ title:'GNOME SWEET GNOME', sub:'LAST CALL', map:'throne', pic:'cine-tavern.jpg', dur:DUR,
  when:()=>HALL&&!TUTORIAL&&S.phase==='build'&&S.wave===0,
  ready:()=>{ tuneFetch(); const v=video(); return v.readyState>=3; },
  setup, step, teardown });
window.__tavernscene={ info:()=>Object.assign({ tuneBytes:!!tuneBytes, tuneReady:!!TUNE, playingOn:tuneOn&&!!tuneSrc, video:vid?{ ready:vid.readyState, t:+vid.currentTime.toFixed(2), shown:vid.style.display==='block', w:vid.videoWidth, src:vid.currentSrc.slice(-24) }:null },cnt), SH, DUR };
})();
