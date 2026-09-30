
/* ROOTGATE (called Dungeon Hold until 2026-09-27) — a Dungeon Defenders style hall in the Gnome's Tower world.
   Third-person hero, hero-sized defenses, goblin waves. Single file, Three.js r128 inlined. */
(function(){
'use strict';
const Q=new URLSearchParams(location.search), SILENT=Q.has('silent');
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
let seed=91731; const rnd=()=>{seed=(seed*1664525+1013904223)>>>0; return seed/4294967296;};
const R=(a,b)=>a+rnd()*(b-a);
const C=h=>new THREE.Color(h).convertSRGBToLinear();
const PI=Math.PI, TAU=PI*2;
let TOUCH=('ontouchstart' in window)&&matchMedia('(pointer:coarse)').matches;   // let, not const (build 167): see setTouchMode below
if(TOUCH) document.body.classList.add('touch');
// build 167 (Matt's wife, on an iPad with a keyboard and a mouse: "it was stuck in touchscreen controls"): an iPad always loads as a touch
// screen, and in touch mode every mouse click and move was thrown away -- no click to swing, no mouse look, and the tutorial said "tap ⚔".
// Now the input actually in use decides: a mouse or trackpad moving or clicking (pointerType 'mouse') switches to mouse & keyboard
// (click to swing, pointer-locked look, the keyboard wording); a finger on the screen switches back. Only on a device that started as
// touch -- its on-screen buttons exist; a laptop with a touchscreen stays the mouse-first page it always was. Modules that word things
// for touch read TOUCH as they draw, and listen for 'inputmode' when they cache it
function setTouchMode(on){ if(TOUCH===on) return; TOUCH=on; document.body.classList.toggle('touch',on); if(on&&document.pointerLockElement&&document.exitPointerLock) document.exitPointerLock(); try{ dispatchEvent(new Event('inputmode')); }catch(e){} }
if(TOUCH){ addEventListener('pointerdown',e=>{ if(e.pointerType==='mouse') setTouchMode(false); else if(e.pointerType==='touch') setTouchMode(true); },true); let lpx=null, lpy=null; addEventListener('pointermove',e=>{ if(e.pointerType!=='mouse') return; if(lpx!==null&&(Math.abs(e.clientX-lpx)+Math.abs(e.clientY-lpy)>2||e.movementX||e.movementY)) setTouchMode(false); lpx=e.clientX; lpy=e.clientY; },true); }   /* Safari reports no movementX on an unlocked pointer: the position's own change says the mouse moved */

// ================= SOUND (off by default — M toggles) =================
let soundOff=SILENT||(localStorage.getItem('ddSound')==='off');
let ac=null;
// the sound menu (build 143: "a sound menu so you can adjust efx vs music sound volumes"): two channels made with the context,
// an effects gain and a music gain, each set from localStorage dd_audio ({music,sfx}, 0..1) and changed live by 41-soundmenu.js.
// Every effect connects to SFXOUT(a); the music tracks, the procedural music and the ambient drone connect to MUSOUT(a).
const AUDV=(()=>{ const c=(v,d)=>{ v=+v; return v>=0&&v<=1?v:d; }; try{ const v=JSON.parse(localStorage.getItem('dd_audio')); if(v&&typeof v==='object') return {music:c(v.music,.8),sfx:c(v.sfx,1)}; }catch(e){} return {music:.8,sfx:1}; })();
function A(){ if(soundOff) return null; if(!ac){ ac=new (window.AudioContext||window.webkitAudioContext)(); const s=ac.createGain(), m=ac.createGain(); s.gain.value=AUDV.sfx; m.gain.value=AUDV.music; s.connect(ac.destination); m.connect(ac.destination); ac.__mix={sfx:s,music:m}; } if(ac.state==='suspended') ac.resume(); return ac; }
function SFXOUT(a){ return (a.__mix&&a.__mix.sfx)||a.destination; } function MUSOUT(a){ return (a.__mix&&a.__mix.music)||a.destination; }
function beep(f,dur,type,vol,slide){ const a=A(); if(!a) return; const o=a.createOscillator(), g=a.createGain(); o.type=type||'square'; o.frequency.setValueAtTime(f,a.currentTime); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),a.currentTime+dur); g.gain.setValueAtTime(vol||.06,a.currentTime); g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+dur); o.connect(g).connect(SFXOUT(a)); o.start(); o.stop(a.currentTime+dur); }
function noise(dur,vol,f){ const a=A(); if(!a) return; const n=(a.sampleRate*dur)|0, b=a.createBuffer(1,n,a.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n); const s=a.createBufferSource(); s.buffer=b; const fl=a.createBiquadFilter(); fl.type='bandpass'; fl.frequency.value=f||1200; fl.Q.value=.7; const g=a.createGain(); g.gain.value=vol||.1; s.connect(fl).connect(g).connect(SFXOUT(a)); s.start(); }
const SFX={ acorn:()=>{ beep(520,.08,'triangle',.05,-200); noise(.05,.06,3000); }, spore:()=>noise(.2,.045,520), swing:()=>noise(.16,.14,900), harpoon:()=>{noise(.07,.12,2600); beep(240,.12,'square',.05,-160);}, ball:()=>beep(95,.32,'sine',.14,-45), hit:()=>beep(520,.06,'square',.04,-220), mana:()=>beep(880,.13,'sine',.05,420), crystal:()=>beep(150,.45,'sawtooth',.07,-70), place:()=>beep(330,.11,'triangle',.06,140), horn:()=>{beep(196,.7,'sawtooth',.06,0); beep(294,.7,'sawtooth',.05,0);}, held:()=>{beep(523,.15,'triangle',.06,0); setTimeout(()=>beep(659,.15,'triangle',.06,0),150); setTimeout(()=>beep(784,.3,'triangle',.06,0),300);}, hurt:()=>beep(200,.15,'square',.06,-80), frost:()=>beep(1500,.07,'sine',.028,-600), implode:()=>{ noise(.32,.14,700); beep(140,.42,'sawtooth',.06,-90); setTimeout(()=>{ beep(1046,.14,'sine',.045,-500); beep(62,.45,'sine',.14,-20); },140); }, sell:()=>beep(660,.1,'sine',.05,-300), die:()=>{ noise(.16,.11,650); beep(320,.18,'square',.045,-220); }, bigDie:()=>{ noise(.4,.18,300); beep(85,.55,'sawtooth',.12,-45); }, jump:()=>beep(380,.09,'square',.035,320), land:()=>noise(.05,.07,320), step:()=>noise(.03,.035,420), enter:()=>{ beep(392,.18,'triangle',.05,0); setTimeout(()=>beep(523,.28,'triangle',.05,0),160); }, loot:(r)=>{ const n=[523,659,784,1047,1319]; for(let i=0;i<=Math.min(4,r+1);i++) setTimeout(()=>beep(n[i],.14,'triangle',.06,0),i*90); }, destroy:()=>noise(.35,.16,400), thud:()=>beep(70,.25,'sine',.12,-30) };
// ================= MUSIC (procedural: hall theme while building, battle loop during waves) =================
let musicOn=localStorage.getItem('ddMusic')!=='off', musicMode='none', musicTimer=null, mNext=0, mStep=0, mGain=null;
const mf=m=>440*Math.pow(2,(m-69)/12);
const MUS_WAVE={bpm:132,chords:[[45,'m'],[41,'M'],[48,'M'],[43,'M']]}, MUS_BUILD={bpm:76,chords:[[45,'m'],[50,'m'],[41,'M'],[43,'M']]};
function mnote(freq,t,dur,type,vol,attack){ const a=A(); if(!a||!mGain) return; const o=a.createOscillator(), g=a.createGain(); o.type=type; o.frequency.setValueAtTime(freq,t); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+(attack||.01)); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(g).connect(mGain); o.start(t); o.stop(t+dur+.02); }
function mnoise(t,dur,vol,f){ const a=A(); if(!a||!mGain) return; const n=(a.sampleRate*dur)|0, b=a.createBuffer(1,n,a.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n); const s=a.createBufferSource(); s.buffer=b; const fl=a.createBiquadFilter(); fl.type='bandpass'; fl.frequency.value=f; fl.Q.value=.8; const g=a.createGain(); g.gain.setValueAtTime(vol,t); s.connect(fl).connect(g).connect(mGain); s.start(t); }
function mkick(t){ const a=A(); if(!a||!mGain) return; const o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(45,t+.16); g.gain.setValueAtTime(.16,t); g.gain.exponentialRampToValueAtTime(.0001,t+.2); o.connect(g).connect(mGain); o.start(t); o.stop(t+.22); }
const mrand=i=>(((i+1)*2654435761)>>>0)/4294967296;
function mschedule(step,t){ const M=musicMode==='wave'?MUS_WAVE:MUS_BUILD; const sd=60/M.bpm/4; const bar=(step>>4), s16=step&15; const [root,q]=M.chords[(bar>>1)%M.chords.length]; const tones=q==='m'?[0,3,7,12,15,19]:[0,4,7,12,16,19];
  if(musicMode==='wave'){
    if(s16%4===0) mkick(t); if(s16%4===2) mnoise(t,.05,.05,7000); if(s16===4||s16===12) mnoise(t,.12,.11,1800);
    if(s16%2===0){ const oct=(s16%8===4)?12:0; mnote(mf(root+oct-12),t,sd*1.8,'square',.045); }
    const ti=[0,2,4,5,4,2,3,1][s16%8]; mnote(mf(root+12+tones[ti]),t,sd*1.6,'triangle',.04);
    if(s16===0&&bar%2===0) mnote(mf(root+24+tones[(bar>>1)%3*2]),t,sd*14,'sawtooth',.02,.4);
  } else {
    if(s16===0){ mnote(mf(root-12),t,sd*30,'triangle',.05,.6); mnote(mf(root+7-12),t,sd*30,'triangle',.035,.9); }
    if(s16%4===0&&mrand(step)<.55){ const pent=[0,3,5,7,10,12,15]; mnote(mf(root+12+pent[Math.floor(mrand(step*7)*pent.length)]),t,sd*6,'sine',.05,.02); }
    if(s16===8&&bar%2===1) mnoise(t,.3,.02,900);
  } }
function mtick(){ const a=A(); if(!a||musicMode==='none') return; if(mNext<a.currentTime-.5) mNext=a.currentTime+.05; const M=musicMode==='wave'?MUS_WAVE:MUS_BUILD; const sd=60/M.bpm/4; while(mNext<a.currentTime+.35){ mschedule(mStep,mNext); mStep++; mNext+=sd; } }
function setMusic(mode){ const want=(musicOn&&!soundOff)?mode:'none'; if(want===musicMode) return; const a=want==='none'?ac:A(); musicMode=want;
  if(want==='none'){ if(musicTimer){ clearInterval(musicTimer); musicTimer=null; } if(mGain&&a){ const g=mGain; mGain=null; g.gain.setTargetAtTime(.0001,a.currentTime,.3); setTimeout(()=>{ try{ g.disconnect(); }catch(e){} },1500); } return; }
  if(!a) return; if(!mGain){ mGain=a.createGain(); mGain.gain.value=.8; mGain.connect(MUSOUT(a)); } mStep=0; mNext=a.currentTime+.05; if(!musicTimer) musicTimer=setInterval(mtick,100); }
function musicForPhase(){ setMusic(S.phase==='wave'?'wave':S.phase==='build'?'build':'none'); }
function musicBtn(){ const b=$('musbtn'); if(b) b.classList.toggle('off',!musicOn); }
function toggleMusic(){ musicOn=!musicOn; localStorage.setItem('ddMusic',musicOn?'on':'off'); musicForPhase(); musicBtn(); toast(musicOn?'Music on':'Music off (N or the 🎵 button turns it back on)'); }
function sting(){ [[220,0],[207,.25],[196,.5],[185,.8]].forEach(([f,d])=>setTimeout(()=>beep(f,.7,'sawtooth',.06,-20),d*1000)); }
let droneN=null;
function droneOn(){ const a=A(); if(!a||droneN) return; const g=a.createGain(); g.gain.setValueAtTime(.0001,a.currentTime); g.gain.exponentialRampToValueAtTime(.028,a.currentTime+1.5); const fl=a.createBiquadFilter(); fl.type='lowpass'; fl.frequency.value=220; const os=[55,82.4,110].map((f,i)=>{ const o=a.createOscillator(); o.type=i?'sawtooth':'triangle'; o.frequency.value=f; o.detune.value=(i-1)*6; o.connect(fl); o.start(); return o; }); fl.connect(g).connect(MUSOUT(a)); droneN={g,os}; }
function droneOff(){ if(!droneN||!ac) return; const d=droneN; droneN=null; d.g.gain.setTargetAtTime(.0001,ac.currentTime,.4); setTimeout(()=>d.os.forEach(o=>{ try{o.stop();}catch(e){} }),1500); }
function setSound(on){ soundOff=!on; if(!on){ droneOff(); setMusic('none'); } else setTimeout(musicForPhase,0); localStorage.setItem('ddSound',on?'on':'off'); $('sndbtn').textContent=on?'🔊':'🔇'; if(!on&&ac) ac.suspend(); }
$('sndbtn').onclick=()=>setSound(soundOff); const pb=$('pausebtn'); if(pb) pb.onclick=()=>{ if(window.__pause) window.__pause.open(); }; const mb=$('musbtn'); if(mb){ mb.onclick=()=>toggleMusic(); musicBtn(); }   // the visible music switch (N is the other): the state shows as a struck-through note   // the visible way to the pause menu (Escape is the other): RESUME, or RETURN TO TITLE SCREEN without closing the tab
$('sndbtn').textContent=soundOff?'🔇':'🔊';
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&ac) ac.suspend(); });
window.addEventListener('pagehide',()=>{ if(ac) ac.suspend(); });

// ================= GRID / MAP =================
// ================= MAPS =================
// A campaign map: its grid (built with f=fill and g=set when the page loads), where the crystal stands, the gates the
// horde comes through, the hall's props and lights, and where the tavern room sits (an offset from map 1's room, which
// the room module is written against). Hold MAP.waves waves and the map is cleared: the next one unlocks, and the horde
// carries on where it left off (map 2 wave 1 fights like wave 8). The map is chosen when the page loads (?map=N or the
// saved ddMap) so the hall is built once.
const MAPS=[
 {id:'hall',crystalHp:300,name:'THE GNOME HALL',sub:'three gates · seven waves',gw:34,gh:33,crystal:[16,17],waves:7,
  build(f,g){ f(10,22,11,23,T.FLOOR);                                   // the great hall
    f(15,17,11,15,T.CARPET); f(10,14,16,18,T.CARPET); f(18,22,16,18,T.CARPET); f(15,17,16,18,T.DAIS); g(16,17,T.CRYSTAL);
    f(15,17,4,10,T.FLOOR); f(14,18,1,3,T.FLOOR); g(16,2,T.SPAWN);          // north gate
    f(4,9,16,18,T.FLOOR); f(4,6,6,18,T.FLOOR); f(2,8,2,5,T.FLOOR); g(5,3,T.SPAWN);   // west gate (with a bend)
    f(23,29,16,18,T.FLOOR); f(29,32,14,20,T.FLOOR); g(31,17,T.SPAWN);      // east gate
    f(12,20,25,31,T.FLOOR); g(16,24,T.FLOOR); f(16,16,25,27,T.CARPET);     // the tavern: a snug room through the south door
    [[12,26],[13,30],[19,27],[19,28],[19,29],[16,31]].forEach(([x,z])=>g(x,z,T.PROP));   // locker · trainer's dummy · the bar · the hearth
    [[12,13],[20,13],[12,21],[20,21]].forEach(([x,z])=>g(x,z,T.PILLAR)); [[10,11],[22,11],[10,23],[22,23]].forEach(([x,z])=>g(x,z,T.PROP)); },
  lanes:{N:{cx:16,cz:2,face:0,name:'North'}, W:{cx:5,cz:3,face:0,name:'West'}, E:{cx:31,cz:17,face:-PI/2,name:'East'}},
  hall:[10,22,11,23],pillars:[[12,13],[20,13],[12,21],[20,21]],barrels:[[10,11],[22,11]],crates:[[10,23],[22,23]],chandelier:[0,-6],beams:{zs:[-8,0,8],w:26},tavern:{dx:0,dz:0},
  lights:[[-9,4.4,-9,0xff8a2a,1.5,16],[9,4.4,-9,0xff8a2a,1.5,16],[-9,4.4,9,0xff8a2a,1.5,16],[9,4.4,9,0xff8a2a,1.5,16],
   [0,5,-6,0xffb05a,.8,13],[0,3.2,0,0xb494ff,1.3,15],[0,4,-18,0xff8a2a,1.7,15],[0,4,-26,0xff8a2a,1.2,12],[-16,4,0,0xff8a2a,1.7,15],[-24,4,-10,0xff8a2a,1.5,14],[-24,4,-22,0xff8a2a,1.4,13],[18,4,0,0xff8a2a,1.7,15],[28,4,0,0xff8a2a,1.6,15],[-22,4,-26,0xc040ff,.9,10],[0,4,-28,0xc040ff,.9,10],[30,4,0,0xc040ff,.9,10],
   [0,4.2,19,0xffb05a,1.3,13],[-6,3.8,24,0xff8a2a,1.2,12],[6,3.8,22,0xff8a2a,1.2,12],[0,2.2,26.4,0xff7a1a,1.6,9]]},   // the tavern: lamps and the hearth
 {id:'throne',name:'THE THRONE ROOM',sub:'a marble stair hall four flights high: twin stairs up each wall, one up the middle, landings where the streams meet · feeder gates on the landings · seven waves',gw:27,gh:54,crystal:[13,6],waves:7,wallH:18,du:80,mana:480,fog:[36,110],style:{marble:true,windows:true,rails:true},
  build(f,g,h,ramp){ f(4,22,3,9,T.FLOOR); h(4,22,3,9,8); f(12,14,3,9,T.CARPET); f(12,14,5,7,T.DAIS); g(13,6,T.CRYSTAL);   // the top: the throne and the crystal, eight up
    f(11,15,10,13,T.CARPET); ramp(11,15,10,13,1,6,8);   // the fourth flight: up the middle to the throne — where the upper landing's two streams meet
    f(4,10,10,13,T.FLOOR); h(4,10,10,13,6); f(16,22,10,13,T.FLOOR); h(16,22,10,13,6); f(4,22,14,16,T.FLOOR); h(4,22,14,16,6);   // the upper landing, six up: galleries either side of the flight, a walk along the front
    f(23,25,14,16,T.FLOOR); h(23,25,14,16,6); g(25,15,T.SPAWN);   // the east feeder onto the upper landing
    f(4,7,17,20,T.CARPET); ramp(4,7,17,20,1,4,6); f(19,22,17,20,T.CARPET); ramp(19,22,17,20,1,4,6);   // twin third flights, one up each wall: the horde splits here
    f(8,18,17,20,T.FLOOR); h(8,18,17,20,4); f(4,22,21,23,T.FLOOR); h(4,22,21,23,4);   // the middle landing, four up
    f(1,3,21,23,T.FLOOR); h(1,3,21,23,4); g(1,22,T.SPAWN);   // the west feeder onto the middle landing
    f(11,15,24,27,T.CARPET); ramp(11,15,24,27,1,2,4);   // the second flight: up the middle — the lower landing's two streams meet at its foot
    f(4,10,24,27,T.FLOOR); h(4,10,24,27,2); f(16,22,24,27,T.FLOOR); h(16,22,24,27,2); f(4,22,28,30,T.FLOOR); h(4,22,28,30,2);   // the lower landing, two up
    f(23,25,28,30,T.FLOOR); h(23,25,28,30,2); g(25,29,T.SPAWN);   // the east feeder onto the lower landing
    f(4,7,31,34,T.CARPET); ramp(4,7,31,34,1,0,2); f(19,22,31,34,T.CARPET); ramp(19,22,31,34,1,0,2);   // twin first flights up from the floor, one at each wall
    f(8,18,31,34,T.FLOOR); f(4,22,35,44,T.FLOOR); f(12,14,31,44,T.CARPET);   // the floor of the hall, where the horde comes in; the runner ends under the lower landing's face
    f(12,14,45,48,T.FLOOR); g(13,47,T.SPAWN);   // the main gate, south
    // the tavern is off this map for now (noTavern below) — no room, no door: the south wall runs solid where it used to open
    [[6,4],[20,4],[7,12],[19,12],[6,26],[20,26],[7,38],[19,38],[7,42],[19,42]].forEach(([x,z])=>g(x,z,T.PILLAR)); [[4,44],[22,44],[4,36],[22,36]].forEach(([x,z])=>g(x,z,T.PROP)); },
  lanes:{S:{cx:13,cz:47,face:PI,name:'South',from:1}, EA:{cx:25,cz:29,face:-PI/2,name:'East lower landing',from:3}, W:{cx:1,cz:22,face:PI/2,name:'West landing',from:5}, EC:{cx:25,cz:15,face:-PI/2,name:'East upper landing',from:6}},   // from: the map's wave the gate first opens on
  hall:[4,22,3,44],pillars:[[6,4],[20,4],[7,12],[19,12],[6,26],[20,26],[7,38],[19,38],[7,42],[19,42]],barrels:[[4,44],[22,44]],crates:[[4,36],[22,36]],chandeliers:[[0,18],[0,46],[0,68]],beams:{zs:[-2,12,26,38,52,66],w:40},tavern:{dx:4,dz:21},throne:[13,3],noTavern:true,
  raven:{cx:9,cz:3,face:0},   // against the back wall behind the crystal, off to the west of the throne itself and clear of the flanking pillars (at x 6 and 20, z 4) — facing 0 (+z, south) so it looks out into the room
  portal:{cx:17,cz:3,face:0},   // mirrored to the east of the crystal, same back wall row as the raven and clear of the same flanking pillars — the two sit symmetrically, neither in the other's way
  lights:[{cx:6,cz:4,up:4.2,c:0xff8a2a,i:1.4,d:15},{cx:20,cz:4,up:4.2,c:0xff8a2a,i:1.4,d:15},{cx:6,cz:9,up:4,c:0xff8a2a,i:1.3,d:14},{cx:20,cz:9,up:4,c:0xff8a2a,i:1.3,d:14},[0,11.2,0,0xb494ff,1.3,15],
   {cx:6,cz:12,up:3.6,c:0xff8a2a,i:1.4,d:14},{cx:20,cz:12,up:3.6,c:0xff8a2a,i:1.4,d:14},{cx:13,cz:15,up:3.6,c:0xffb05a,i:1.2,d:14},{cx:25,cz:15,up:3.4,c:0xc040ff,i:.9,d:10},
   {cx:6,cz:19,up:3.6,c:0xff8a2a,i:1.4,d:14},{cx:20,cz:19,up:3.6,c:0xff8a2a,i:1.4,d:14},{cx:13,cz:22,up:3.6,c:0xffb05a,i:1.2,d:14},{cx:1,cz:22,up:3.4,c:0xc040ff,i:.9,d:10},
   {cx:6,cz:26,up:3.6,c:0xff8a2a,i:1.4,d:14},{cx:20,cz:26,up:3.6,c:0xff8a2a,i:1.4,d:14},{cx:13,cz:29,up:3.6,c:0xffb05a,i:1.2,d:14},{cx:25,cz:29,up:3.4,c:0xc040ff,i:.9,d:10},
   {cx:6,cz:33,up:3.6,c:0xff8a2a,i:1.4,d:14},{cx:20,cz:33,up:3.6,c:0xff8a2a,i:1.4,d:14},{cx:13,cz:36,up:4.4,c:0xffb05a,i:1.0,d:16},{cx:5,cz:40,up:4,c:0xff8a2a,i:1.5,d:15},{cx:21,cz:40,up:4,c:0xff8a2a,i:1.5,d:15},{cx:13,cz:44,up:4,c:0xff8a2a,i:1.3,d:14},{cx:13,cz:47,up:3.4,c:0xc040ff,i:.9,d:10},
   ]},
 {id:'court',name:'THE CLOISTER COURT',sub:'a sunken garden, two Heartroots and the long way round · seven waves',gw:44,gh:52,crystal:[32,15],crystal2:[11,28],waves:7,wallH:9,du:80,mana:920,fog:[34,110],style:{outdoor:true,moss:true},
  build(f,g,h,ramp){ f(2,41,2,41,T.FLOOR); h(2,41,2,41,1.5); h(5,38,5,38,0);   // the cloister walkway a step and a half up, the court sunken
    f(31,33,13,17,T.CARPET); f(31,33,14,16,T.DAIS); g(32,15,T.CRYSTAL); f(10,12,26,30,T.CARPET); f(10,12,27,29,T.DAIS); g(11,28,T.CRYSTAL);   // build 282 (H2): two Heartroots, at 2 o'clock and 8 o'clock
    f(7,9,5,6,T.FLOOR); ramp(7,9,5,6,1,0,1.5); f(34,36,37,38,T.FLOOR); ramp(34,36,37,38,2,0,1.5);   // two flights down, in the north-west and south-east corners
    h(19,24,13,16,1.5); h(19,24,27,30,1.5);   // two raised terraces either side of the giant tree: no stair, so only towers and a jumping hero get up
    [[21,21],[22,21],[21,22],[22,22]].forEach(([x,z])=>g(x,z,T.PROP));   // the giant tree's trunk
    f(2,4,1,1,T.FLOOR); h(2,4,1,1,1.5); g(3,1,T.SPAWN); f(39,41,1,1,T.FLOOR); h(39,41,1,1,1.5); g(40,1,T.SPAWN); f(1,1,39,41,T.FLOOR); h(1,1,39,41,1.5); g(1,40,T.SPAWN);   // gates in three corners: the horde walks the cloister to a stair
    f(17,25,44,50,T.FLOOR); f(21,21,42,43,T.FLOOR); h(21,21,42,43,1.5); h(17,25,44,50,1.5); f(21,21,44,46,T.CARPET); [[17,45],[18,49],[24,46],[24,47],[24,48],[21,50]].forEach(([x,z])=>g(x,z,T.PROP));   // the tavern through the south wall, on the walkway's level
    for(let x=6;x<=38;x+=8){ g(x,4,T.PILLAR); g(x,39,T.PILLAR); } for(let z=6;z<=38;z+=8){ g(4,z,T.PILLAR); g(39,z,T.PILLAR); } },   // the colonnade along the inner edge of the walkway
  lanes:{NW:{cx:3,cz:1,face:0,name:'North-west'}, NE:{cx:40,cz:1,face:0,name:'North-east'}, SW:{cx:1,cz:40,face:PI/2,name:'South-west'}},
  hall:[2,41,2,41],pillars:(()=>{ const p=[]; for(let x=6;x<=38;x+=8){ p.push([x,4],[x,39]); } for(let z=6;z<=38;z+=8){ p.push([4,z],[39,z]); } return p; })(),pillarH:4.4,barrels:[],crates:[],chandeliers:[],beams:{zs:[],w:0},tavern:{dx:5,dz:19},
  roofs:[[2,41,2,4],[2,41,39,41],[2,4,5,38],[39,41,5,38],[16,26,42,51]],trees:[],
  lights:[[0,4.2,0,0xb494ff,1.3,15],{cx:11,cz:28,y:4.2,c:0xb494ff,i:1.3,d:15},{cx:21,cz:21,y:7,c:0xfff0c8,i:1.1,d:24},{cx:6,cz:3,y:4,c:0xff8a2a,i:1.4,d:13},{cx:22,cz:3,y:4,c:0xff8a2a,i:1.4,d:13},{cx:38,cz:3,y:4,c:0xff8a2a,i:1.4,d:13},{cx:6,cz:40,y:4,c:0xff8a2a,i:1.4,d:13},{cx:38,cz:40,y:4,c:0xff8a2a,i:1.4,d:13},{cx:3,cz:14,y:4,c:0xff8a2a,i:1.4,d:13},{cx:3,cz:30,y:4,c:0xff8a2a,i:1.4,d:13},{cx:40,cz:14,y:4,c:0xff8a2a,i:1.4,d:13},{cx:40,cz:30,y:4,c:0xff8a2a,i:1.4,d:13},
   {cx:3,cz:1,y:4,c:0xc040ff,i:.9,d:10},{cx:40,cz:1,y:4,c:0xc040ff,i:.9,d:10},{cx:1,cz:40,y:4,c:0xc040ff,i:.9,d:10},{cx:21,cz:43,y:4.2,c:0xffb05a,i:1.3,d:13},{cx:19,cz:45,y:3.8,c:0xff8a2a,i:1.2,d:12},{cx:23,cz:49,y:3.8,c:0xff8a2a,i:1.2,d:12},{cx:21,cz:50,y:2.2,c:0xff7a1a,i:1.6,d:9,oz:.4}]},
 {id:'feast',name:'THE GREAT FEAST HALL',sub:'three long tables, three doors, the Heartroot at the high table · seven waves',gw:52,gh:35,crystal:[5,13],waves:7,wallH:10,du:60,mana:360,fog:[30,100],style:{windows:true},
  build(f,g,h,ramp){ f(3,46,3,24,T.FLOOR); f(3,8,10,17,T.FLOOR); h(3,8,10,17,1); f(9,10,10,17,T.FLOOR); ramp(9,10,10,17,4,0,1); f(4,6,12,14,T.DAIS); g(5,13,T.CRYSTAL); f(11,46,13,14,T.CARPET);   // the hall, the high table's dais a step up at the west end, a runner down the middle
    for(const [z0,z1] of [[8,9],[13,14],[18,19]]) for(let x=14;x<=40;x++){ if(x===22||x===23||x===30||x===31||x===38||x===39) continue; g(x,z0,T.PROP); g(x,z1,T.PROP); }   // three long tables with benches; gaps to cross between the aisles
    f(47,50,12,14,T.FLOOR); g(50,13,T.SPAWN); f(23,25,1,2,T.FLOOR); g(24,1,T.SPAWN); f(31,33,25,27,T.FLOOR); g(32,27,T.SPAWN);   // gates: the east doors at the far end, a door in each long wall
    f(42,50,27,33,T.FLOOR); f(46,46,25,26,T.FLOOR); f(46,46,27,29,T.CARPET); [[42,28],[43,32],[49,29],[49,30],[49,31],[46,33]].forEach(([x,z])=>g(x,z,T.PROP));   // the tavern off the south-east corner
    [[3,3],[46,3],[3,24],[46,24]].forEach(([x,z])=>g(x,z,T.PROP)); },
  lanes:{E:{cx:50,cz:13,face:-PI/2,name:'East'}, N:{cx:24,cz:1,face:0,name:'North'}, S:{cx:32,cz:27,face:PI,name:'South'}},
  hall:[3,46,3,24],pillars:[],barrels:[[3,3],[46,3]],crates:[[3,24],[46,24]],chandeliers:[[14,0],[30,0],[46,0]],beams:{zs:[-14,-6,2,10],w:90},tavern:{dx:30,dz:2},
  tables:[[14,40,8,9],[14,40,13,14],[14,40,18,19]],tableGaps:[22,23,30,31,38,39],hearths:[[20,2,0],[34,2,0],[20,25,PI],[34,25,PI]],
  lights:[[0,4.2,0,0xb494ff,1.3,15],[14,7,0,0xffb05a,.9,15],[30,7,0,0xffb05a,.9,15],[46,7,0,0xffb05a,.9,15],{cx:20,cz:3,y:2.4,c:0xff7a1a,i:1.8,d:12},{cx:34,cz:3,y:2.4,c:0xff7a1a,i:1.8,d:12},{cx:20,cz:24,y:2.4,c:0xff7a1a,i:1.8,d:12},{cx:34,cz:24,y:2.4,c:0xff7a1a,i:1.8,d:12},
   {cx:6,cz:11,y:4.4,c:0xff8a2a,i:1.4,d:13},{cx:6,cz:16,y:4.4,c:0xff8a2a,i:1.4,d:13},{cx:12,cz:4,y:4,c:0xff8a2a,i:1.4,d:13},{cx:12,cz:23,y:4,c:0xff8a2a,i:1.4,d:13},{cx:42,cz:4,y:4,c:0xff8a2a,i:1.4,d:13},{cx:42,cz:23,y:4,c:0xff8a2a,i:1.4,d:13},
   {cx:50,cz:13,y:4,c:0xc040ff,i:.9,d:10},{cx:24,cz:1,y:4,c:0xc040ff,i:.9,d:10},{cx:32,cz:27,y:4,c:0xc040ff,i:.9,d:10},{cx:46,cz:26,y:4.2,c:0xffb05a,i:1.3,d:13},{cx:44,cz:28,y:3.8,c:0xff8a2a,i:1.2,d:12},{cx:48,cz:32,y:3.8,c:0xff8a2a,i:1.2,d:12},{cx:46,cz:33,y:2.2,c:0xff7a1a,i:1.6,d:9,oz:.4}]},
 {id:'moat',name:'THE DRAWBRIDGE',sub:'the castle\'s outer ward behind a moat: one drawbridge, an old ford at the west end, a wide green before the walls · gates on the road and in the woods, a sally port late · seven waves',gw:50,gh:56,crystal:[20,7],waves:7,wallH:10,fog:[48,134],du:90,mana:520,style:{outdoor:true,grass:true,road:true,windows:true},
  build(f,g,h,ramp){ f(3,46,2,13,T.FLOOR); f(23,25,2,13,T.CARPET); f(18,22,4,10,T.CARPET); f(19,21,6,8,T.DAIS); g(20,7,T.CRYSTAL);   // the outer ward: the road runs from the gate to the keep's door, the crystal on a dais beside it
    f(23,25,14,15,T.CARPET); f(4,5,14,15,T.FLOOR);                                                     // the gate through the curtain wall, and a postern at the west end
    f(1,48,16,19,T.WATER); f(23,25,16,19,T.CARPET); f(4,5,16,19,T.CARPET);                            // the moat, the drawbridge over it, the old ford (a causeway) below the postern
    f(2,47,20,53,T.FLOOR); f(23,25,20,53,T.CARPET);                                                   // the green before the walls, the royal road down the middle
    g(24,53,T.SPAWN); f(1,1,24,26,T.FLOOR); g(1,25,T.SPAWN); f(48,48,24,26,T.FLOOR); g(48,25,T.SPAWN);   // gates: the road's far end, the west and east woods
    f(47,48,7,9,T.FLOOR); g(48,8,T.SPAWN);                                                            // the sally port in the ward's east wall
    f(29,39,41,49,T.WALL); f(30,38,42,48,T.FLOOR); g(34,41,T.FLOOR); f(34,34,43,45,T.CARPET); [[30,43],[31,47],[37,44],[37,45],[37,46],[34,48]].forEach(([x,z])=>g(x,z,T.PROP));   // the roadside inn (the tavern), walled, its door on the road side
    [[22,24],[26,24],[22,32],[26,32],[22,40],[26,40],[22,48],[26,48]].forEach(([x,z])=>g(x,z,T.PROP));   // lamp posts along the road
    [[21,21],[27,21],[9,3],[16,3],[31,3],[38,3]].forEach(([x,z])=>g(x,z,T.PROP));                    // statues: two at the bridge foot, four kings along the keep
    [[21,12],[27,12],[17,5],[17,9]].forEach(([x,z])=>g(x,z,T.PROP));                                 // braziers at the gate and the dais
    [[3,21],[3,33],[3,45],[3,52],[46,21],[46,33],[46,52],[9,52],[16,52],[42,52],[10,30],[39,30],[13,44],[7,38],[43,36],[19,50]].forEach(([x,z])=>g(x,z,T.PROP)); },   // trees
  lanes:{S:{cx:24,cz:53,face:PI,name:'Road',from:1}, W:{cx:1,cz:25,face:PI/2,name:'West wood',from:2}, E:{cx:48,cz:25,face:-PI/2,name:'East wood',from:3}, NE:{cx:48,cz:8,face:-PI/2,name:'Sally port',from:5}},
  hall:[3,46,2,13],pillars:[],barrels:[[44,3],[44,12]],crates:[[5,3]],chandeliers:[],beams:{zs:[],w:0},tavern:{dx:18,dz:17},
  trees:[[3,21],[3,33],[3,45],[3,52],[46,21],[46,33],[46,52],[9,52],[16,52],[42,52],[10,30],[39,30],[13,44],[7,38],[43,36],[19,50]],
  castle:{towers:[[21.5,14.5,2,14],[26.5,14.5,2,14],[2.5,14.5,1.8,12],[47.5,14.5,1.8,12],[13.5,.5,2.4,26,'cone'],[34.5,.5,2.4,26,'cone']],keep:[[14,34,-5,1,20]],arches:[[23,25,14,15,6.5]],bridge:[23,25,16,19],chains:[[21.6,12.6,15.6,22.4,1.2,19.6],[26.4,12.6,15.6,25.6,1.2,19.6]],
    lamps:[[22,24],[26,24],[22,32],[26,32],[22,40],[26,40],[22,48],[26,48]],statues:[[21,21,0],[27,21,0],[9,3,0],[16,3,0],[31,3,0],[38,3,0]],braziers:[[21,12],[27,12],[17,5],[17,9]]},
  lights:[{cx:20,cz:7,up:4.2,c:0xb494ff,i:1.3,d:15},{cx:23,cz:13,up:3.4,c:0xff8a2a,i:1.4,d:14},{cx:25,cz:13,up:3.4,c:0xff8a2a,i:1.4,d:14},
   {cx:21,cz:12,up:2.2,c:0xff7a1a,i:1.6,d:10},{cx:27,cz:12,up:2.2,c:0xff7a1a,i:1.6,d:10},{cx:17,cz:5,up:2.2,c:0xff7a1a,i:1.6,d:10},{cx:17,cz:9,up:2.2,c:0xff7a1a,i:1.6,d:10},
   {cx:8,cz:3,up:4,c:0xff8a2a,i:1.3,d:14},{cx:24,cz:3,up:4,c:0xff8a2a,i:1.3,d:14},{cx:40,cz:3,up:4,c:0xff8a2a,i:1.3,d:14},{cx:5,cz:10,up:4,c:0xff8a2a,i:1.2,d:13},{cx:44,cz:10,up:4,c:0xff8a2a,i:1.2,d:13},
   {cx:22,cz:24,up:3.6,c:0xffb05a,i:1.1,d:12},{cx:26,cz:24,up:3.6,c:0xffb05a,i:1.1,d:12},{cx:22,cz:32,up:3.6,c:0xffb05a,i:1.1,d:12},{cx:26,cz:32,up:3.6,c:0xffb05a,i:1.1,d:12},{cx:22,cz:40,up:3.6,c:0xffb05a,i:1.1,d:12},{cx:26,cz:40,up:3.6,c:0xffb05a,i:1.1,d:12},{cx:22,cz:48,up:3.6,c:0xffb05a,i:1.1,d:12},{cx:26,cz:48,up:3.6,c:0xffb05a,i:1.1,d:12},
   {cx:24,cz:53,up:3.4,c:0xc040ff,i:.9,d:10},{cx:1,cz:25,up:3.4,c:0xc040ff,i:.9,d:10},{cx:48,cz:25,up:3.4,c:0xc040ff,i:.9,d:10},{cx:48,cz:8,up:3.4,c:0xc040ff,i:.9,d:10},
   {cx:34,cz:40,up:4.2,c:0xffb05a,i:1.3,d:13},{cx:32,cz:42,up:3.8,c:0xff8a2a,i:1.2,d:12},{cx:36,cz:46,up:3.8,c:0xff8a2a,i:1.2,d:12},{cx:34,cz:47,up:2.2,c:0xff7a1a,i:1.6,d:9,oz:.4}]},
 // THE DEEP PRISON (build 342; Matt: a big cavern of cells, the Heartroot at the very bottom, "a top down flow ... you can see them coming down flights all around", then "it was gonna be a triangle with the
 // heartroot in one corner"). A TRIANGLE in plan: the wide end is the rim, a flat stone ledge six up along the south wall where the cells are; the sides close in toward the north until they meet at the apex, where
 // the Heartroot sits in the corner on the pit floor. Between them three terraces step down (rim 6, middle 4, lower 2, pit 0). The horde breaks out of busted cells along the rim and ZIGZAGS down: the rim's flight
 // is at the west end, the middle terrace's at the east end, the lower terrace's at the west end again -- every terrace is walked its full width, and the flights are seen all around. Feeder gates in the side walls
 // join on later waves (the middle terrace's west wall, the lower terrace's east wall). A flight is three cells long and five wide, sitting in the north rows of the terrace above it. The hero starts in the pit,
 // looking down the triangle. z counts from the apex (row 2) to the rim's south wall (row 46); a row's half-width is the smaller of 20 and half the rows down from the apex.
 {id:'prison',name:'THE DEEP PRISON',sub:'a triangular cavern of cells narrowing to the Heartroot in its corner: the horde breaks out along the wide rim and zigzags down the flights · four breakouts · seven waves',gw:47,gh:48,crystal:[23,4],waves:7,wallH:19,du:90,mana:560,fog:[46,135],style:{moss:true},
  // build 344-345 (Matt: "widen the whole thing out top to bottom by a couple squares" -- two in all, one more each side): WIDEN cells more on each side of every row than the first triangle had; the dais, flights and gates moved with it
  build(f,g,h,ramp){ const WIDEN=1, hw=z=>Math.min(20+WIDEN,Math.ceil((z-1)/2)+WIDEN), Y=z=>z<=12?0:z<=23?2:z<=34?4:6;
    for(let z=2;z<=45;z++){ const w=hw(z); f(23-w,23+w,z,z,T.FLOOR); h(23-w,23+w,z,z,Y(z)); }   // the triangle, row by row, each row at its terrace's height
    f(16,30,4,9,T.FLOOR); h(16,30,4,9,0);
    f(22,24,3,5,T.DAIS); g(23,4,T.CRYSTAL);   // the Heartroot in the apex, on its dais
    ramp(6,10,35,37,2,4,6); ramp(31,35,24,26,2,2,4); ramp(16,20,13,15,2,0,2);   // the flights (rising south): rim to middle at the west end, middle to lower at the east end, lower to pit at the west end
    g(45,44,T.SPAWN); h(45,45,44,44,6); g(23,46,T.SPAWN); h(23,23,46,46,6); g(7,28,T.SPAWN); h(7,7,28,28,4); g(34,19,T.SPAWN); h(34,34,19,19,2); },   // the busted cells: the rim's east end and south wall, the middle terrace's west wall, the lower terrace's east wall
  lanes:{E:{cx:45,cz:44,face:-PI/2,name:'East cells',from:1}, S:{cx:23,cz:46,face:PI,name:'South cells',from:2}, W:{cx:7,cz:28,face:PI/2,name:'West landing',from:3}, NE:{cx:34,cz:19,face:-PI/2,name:'Lower east',from:4}},
  hall:[-9,-9,-9,-9],pillars:[],barrels:[],crates:[],chandeliers:[],beams:{zs:[],w:0},tavern:{dx:0,dz:0},noTavern:true,
  lights:(()=>{ const L=[[0,3.4,0,0xb494ff,1.3,15],[0,1.2,5,0x58c070,.7,12]];
    for(const [cx,cz,up] of [[20,9,3.4],[26,9,3.4],[16,18,3.6],[30,18,3.6],[23,21,3.6],[12,30,3.6],[34,30,3.6],[23,28,3.6],[8,42,4.2],[23,41,4.2],[38,42,4.2],[23,45,4.2]]) L.push({cx,cz,up,c:0xff8a2a,i:1.3,d:14});   // braziers down the terraces
    for(const [cx,cz] of [[45,44],[23,46],[7,28],[34,19]]) L.push({cx,cz,up:3.4,c:0xc040ff,i:1.6,d:13});   // the broken cells glow where the horde comes out
    return L; })()}];
// THE TUTORIAL HALL (build 166, Matt: "we need to reimagine the entire tutorial ... prior to room one there is a tutorial hall ...
// its a tutorial room with one hall and in your face instruction"). A tiny map of its own, deliberately NOT in MAPS (the campaign's
// count, its unlocks and NEXT MAP never see it): one straight hall from a door to the crystal, readable at a glance. It is built
// instead of the chosen map when the page loads with ?tutorial -- the title's 🎓 TUTORIAL button, and a brand-new player's PLAY
// (89-tutorial.js sends them there; a page nobody pressed PLAY on loads exactly as it always did). 89-tutorial.js runs it. MAPI
// stays 0 in it (the hall is "before room one": map one's waves, loot and no level gate), so what is keyed to map one checks
// TUTORIAL as well -- the Forest rails (93-gearsets.js) and the old guide card (96-trainer.js) stay out of it
const TUTORIAL=!Q.get('coopjoin')&&Q.has('tutorial')&&Q.get('tutorial')!=='0';
const TUT_MAP={id:'tutorial',name:'THE TUTORIAL HALL',sub:'one hall, one door, the Heartroot · two small waves',gw:11,gh:25,crystal:[5,17],waves:2,crystalHp:300,du:40,mana:60,wallH:11,fog:[30,90],style:{windows:true},noTavern:true,
  build(f,g){ f(3,7,1,13,T.FLOOR); f(1,9,14,23,T.FLOOR); f(5,5,2,15,T.CARPET); f(4,6,16,18,T.DAIS); g(5,17,T.CRYSTAL); g(5,2,T.SPAWN);   // the hall, five wide: one lane (the runner) from the door in the north wall to the crystal's chamber
    [[1,23],[9,14],[9,23],[1,14]].forEach(([x,z])=>g(x,z,T.PROP)); },   // barrels and crates in the chamber's corners
  lanes:{N:{cx:5,cz:2,face:0,name:'the door'}},
  hall:[1,9,1,23],pillars:[],barrels:[[1,23],[9,14]],crates:[[9,23],[1,14]],chandeliers:[[0,-18],[0,4]],beams:{zs:[-26,-14,-2,10],w:20},
  start:[5,12],spot:[5,8],mark:[5,11],   // 89-tutorial.js: where the knight starts (in the hall, the door ahead and the crystal behind -- from the usual start the crystal hid the lane), the glowing spot the first step walks to, and the ballista's marker on the lane (its bolts fly straight up the runner to the door)
  lights:[[0,3.2,0,0xb494ff,1.3,15],{cx:3,cz:5,up:4,c:0xff8a2a,i:1.4,d:13},{cx:7,cz:5,up:4,c:0xff8a2a,i:1.4,d:13},{cx:3,cz:11,up:4,c:0xff8a2a,i:1.4,d:13},{cx:7,cz:11,up:4,c:0xff8a2a,i:1.4,d:13},
   {cx:1,cz:16,up:4,c:0xff8a2a,i:1.4,d:13},{cx:9,cz:16,up:4,c:0xff8a2a,i:1.4,d:13},{cx:1,cz:22,up:4,c:0xff8a2a,i:1.4,d:13},{cx:9,cz:22,up:4,c:0xff8a2a,i:1.4,d:13},{cx:5,cz:20,up:4.4,c:0xffb05a,i:1.2,d:13},{cx:5,cz:2,up:3.4,c:0xc040ff,i:.9,d:10}]};
const MAPS_CLEARED=(()=>{ try{ return Math.max(0,Math.min(MAPS.length,parseInt(localStorage.getItem('ddMapsCleared'))||0)); }catch(e){ return 0; } })();
// co-op lobby (99b-lobby.js): a guest following its host onto the host's map reloads with ?coopmap=N&coopjoin=<room code>.
// Only that pair lifts this player's own unlock gate, and only for this one page load (the lobby strips both from the address
// bar as soon as it has read them); ?coopmap without a room code, and ?map= for everyone, stay gated exactly as before.
const MAPI=TUTORIAL?0:(()=>{ const cm=parseInt(Q.get('coopmap')); if(Q.get('coopjoin')&&cm>=0) return Math.min(cm,MAPS.length-1); let i=parseInt(Q.get('map')); if(!(i>=0)){ try{ i=parseInt(localStorage.getItem('ddMap'))||0; }catch(e){ i=0; } } return Math.max(0,Math.min(i,MAPS_CLEARED,MAPS.length-1)); })();   // a map past the last one cleared is locked
const MAP=TUTORIAL?TUT_MAP:MAPS[MAPI]; MAP.wbase=MAPS.slice(0,MAPI).reduce((a,m)=>a+m.waves,0);
// SURVIVAL (build 176). Matt: "we need a mode choice so i can do a map in survival mode" ... "the max waves is 50 for now" ... "the thing
// that should make it harder and harder is sheer volume of mobs". A map already held in the campaign can be played again in Survival:
// the same hall, the horde coming on past the map's own count up to SURVIVAL_WAVES. Its first waves ARE the campaign's (nothing harder
// than the map already was); past them waveComp keeps its own formulas climbing with higher caps and quicker spawns -- volume is the
// ramp -- while a mob's own hp/damage/speed climb at SURVIVAL_STAT_RATE of the campaign's pace (statWave), and no more than
// SURVIVAL_LIVE are ever alive at once (updateWave holds the rest in the queue: a laptop or an iPad keeps its frame rate, and the
// flood comes as fast as the hall kills it). Every tenth wave is a boss wave (a troll boss leads, ogres behind it). Holding the last is
// SURVIVAL COMPLETE (winMap: build 160's victory lap, nothing unlocked, the campaign untouched); the crystal falling ends it as ever.
// The title's mode row (95b-survival.js) sets SURVIVAL before PLAY and remembers it (ddMode), honoured only on a map already cleared --
// never in the tutorial, on a ?silent test page, or on a page that followed a co-op host (a guest takes its host's mode from the world
// broadcast, 99-network.js). A let, so the title flips it without a reload: nothing reads it before the first wave
const SURVIVAL_WAVES=50, SURVIVAL_STAT_RATE=.5, SURVIVAL_LIVE=60;
let SURVIVAL=(()=>{ if(TUTORIAL||SILENT||Q.get('coopjoin')||MAPI>=MAPS_CLEARED) return false; try{ return localStorage.getItem('ddMode')==='survival'; }catch(e){ return false; } })();
function runWaves(){ return SURVIVAL?SURVIVAL_WAVES:MAP.waves; }   // the waves this run holds: the map's own, or Survival's fifty
function survivalPast(mw){ return SURVIVAL?Math.max(0,(mw===undefined?S.wave:mw)-MAP.waves):0; }   // how far a Survival wave is past the map's own count (0 = a campaign wave)
const CELL=2, GW=MAP.gw, GH=MAP.gh, OX=MAP.crystal[0]*CELL+CELL/2, OZ=MAP.crystal[1]*CELL+CELL/2, WALLH=MAP.wallH||7;   // the crystal stands at world (0,0)
const T={WALL:0,FLOOR:1,CARPET:2,DAIS:3,PILLAR:4,SPAWN:5,CRYSTAL:6,PROP:7,WATER:8};   // WATER: a moat — walkers and the hero stop at the bank, flyers cross it
const grid=new Uint8Array(GW*GH);
const idx=(cx,cz)=>cz*GW+cx;
const cw=cx=>cx*CELL+CELL/2-OX, cwz=cz=>cz*CELL+CELL/2-OZ;
const wc=x=>Math.floor((x+OX)/CELL), wcz=z=>Math.floor((z+OZ)/CELL);
const inb=(cx,cz)=>cx>=0&&cz>=0&&cx<GW&&cz<GH;
const gat=(cx,cz)=>inb(cx,cz)?grid[idx(cx,cz)]:T.WALL;
function fill(x0,x1,z0,z1,t){ for(let z=z0;z<=z1;z++) for(let x=x0;x<=x1;x++) grid[idx(x,z)]=t; }
// floor height per cell (raised floors), and stairs: an axis (1 rises north/-z, 2 south/+z, 3 east/+x, 4 west/-x) with the low and high heights of each cell's two steps
const hgt=new Float32Array(GW*GH), rampA=new Int8Array(GW*GH), rampL=new Float32Array(GW*GH), rampH=new Float32Array(GW*GH);
function hfill(x0,x1,z0,z1,y){ for(let z=z0;z<=z1;z++) for(let x=x0;x<=x1;x++) hgt[idx(x,z)]=y; }
function ramp(x0,x1,z0,z1,dir,y0,y1){ const alongZ=dir===1||dir===2; const n=alongZ?(z1-z0+1):(x1-x0+1); for(let z=z0;z<=z1;z++) for(let x=x0;x<=x1;x++){ const k=alongZ?(dir===1?z1-z:z-z0):(dir===3?x-x0:x1-x); const i=idx(x,z); rampA[i]=dir; rampL[i]=y0+(y1-y0)*k/n; rampH[i]=y0+(y1-y0)*(k+1)/n; hgt[i]=(rampL[i]+rampH[i])/2; } }
MAP.build(fill,(x,z,t)=>{ grid[idx(x,z)]=t; },hfill,ramp);
const HASWATER=grid.includes(T.WATER), WATER_BED=-1.5, WATER_Y=-.8; if(HASWATER) for(let i=0;i<grid.length;i++) if(grid[i]===T.WATER) hgt[i]=WATER_BED;   // the moat's bed lies below the banks, its surface a little under them
const GOAL=idx(MAP.crystal[0],MAP.crystal[1]);
const GOAL2=MAP.crystal2?idx(MAP.crystal2[0],MAP.crystal2[1]):-1, C2X=MAP.crystal2?cw(MAP.crystal2[0]):0, C2Z=MAP.crystal2?cwz(MAP.crystal2[1]):0;   // build 282: a map's SECOND Heartroot (the Cloister Court), world C2X/C2Z; -1 on every other map
const isGoal=i=>i===GOAL||(GOAL2>=0&&i===GOAL2), goalCr=(i,e)=>(GOAL2>=0&&i===GOAL2)?{kind:'crystal',x:C2X,z:C2Z,reach:2.9+e.r,which:2}:{kind:'crystal',x:0,z:0,reach:2.9+e.r};   // which Heartroot a flow step leads into, and the target that means
let crystal2Shake=0;
const LANES=MAP.lanes;
const walk=t=>t===T.FLOOR||t===T.CARPET||t===T.DAIS||t===T.SPAWN;
const heroSolid=t=>t===T.WALL||t===T.PILLAR||t===T.CRYSTAL||t===T.PROP||t===T.WATER;
const defAt=new Array(GW*GH).fill(null);
const NOWALK_DEF={slice:1};   // kinds mobs (and the hero's generic def-collision) treat as if they aren't there at all -- the Mycelium Cage today; a staging module can add its own kind here rather than this list being touched per feature

// flow fields: 'free' ignores defenses, 'def' respects them
let flowFree=null, flowDef=null, flowFly=null;
function bfs(respect,fly){
  const nxt=new Int16Array(GW*GH).fill(-1), dist=new Int16Array(GW*GH).fill(-1);
  dist[GOAL]=0; const q=[GOAL]; let qi=0; if(GOAL2>=0){ dist[GOAL2]=0; q.push(GOAL2); }
  while(qi<q.length){ const i=q[qi++]; const x=i%GW, z=(i/GW)|0;
    for(let k=0;k<4;k++){ const nx=x+[1,-1,0,0][k], nz=z+[0,0,1,-1][k]; if(!inb(nx,nz)) continue; const j=idx(nx,nz); if(!fly){ if(Math.abs(hgt[j]-hgt[i])>.8) continue; /* no path over a ledge: stairs only (flyers ignore it) */ const ai=rampA[i], aj=rampA[j], alongZ=k>=2; if((ai&&((ai<=2)!==alongZ))||(aj&&((aj<=2)!==alongZ))) continue; } /* a flight is entered and left at its ends, never over its side (the side of a stair is a ledge the steps can't climb) */
      if(dist[j]>=0||!(walk(grid[j])||(fly&&grid[j]===T.WATER))) continue; if(respect&&defAt[j]&&!NOWALK_DEF[defAt[j].kind]) continue;
      dist[j]=dist[i]+1; nxt[j]=i; q.push(j); } }
  return {nxt,dist};
}
function reflow(){ flowFree=bfs(false); flowDef=bfs(true); flowFly=bfs(false,true); }
reflow();
function los(ax,az,bx,bz){ const d=Math.hypot(bx-ax,bz-az); const n=Math.ceil(d/0.7)||1; for(let i=1;i<n;i++){ const t=i/n; const g=gat(wc(ax+(bx-ax)*t),wcz(az+(bz-az)*t)); if(g===T.WALL||g===T.PILLAR) return false; } return true; }

// ================= RENDERER / SCENE =================
const canvas=$('c'), ov=$('ov'), ovx=ov.getContext('2d');
{ const rpl=canvas.requestPointerLock; if(rpl) canvas.requestPointerLock=function(){ try{ const r=rpl.apply(this,arguments); if(r&&r.catch) r.catch(()=>{}); return r; }catch(e){} }; }   // build 167: newer browsers return a promise that rejects when the page isn't focused (Safari: 'Pointer lock requires the window to have focus') -- a refused lock is fine (the next click asks again), an unhandled rejection is noise
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0;
const scene=new THREE.Scene();
const OUT=!!(MAP.style&&MAP.style.outdoor); scene.background=C(OUT?0x0c1230:0x0b0712); scene.fog=new THREE.Fog(C(OUT?0x0c1230:0x0b0712),(MAP.fog||[24,62])[0],(MAP.fog||[24,62])[1]);   // a big hall needs to be seen end to end; a courtyard sees the night sky
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,0.1,140);
function onResize(){ renderer.setSize(innerWidth,innerHeight); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); ov.width=innerWidth; ov.height=innerHeight; }
addEventListener('resize',onResize); onResize();

// lights: cool ambient, warm torches, cyan crystal
scene.add(new THREE.HemisphereLight(C(OUT?0x7a86c8:0x5a4a8a),C(OUT?0x1a2418:0x130d1a),OUT?.8:0.62));
const sun=new THREE.DirectionalLight(C(OUT?0xa8b8ff:0x8a7ab0),OUT?.45:0.22); sun.position.set(6,14,4); scene.add(sun);
const LIGHTS=MAP.lights.map(l=>Array.isArray(l)?l:[cw(l.cx)+(l.ox||0),l.y!==undefined?l.y:(hgt[idx(l.cx,l.cz)]||0)+l.up,cwz(l.cz)+(l.oz||0),l.c,l.i,l.d]);   // world coords, or {cx,cz} grid cells (y absolute, or up: above that cell's floor)
const torchLights=[];
// sconces burn brighter and reach further than the crystal / portal glows (the hall was too dark)
const SCONCE_BOOST=1.75, SCONCE_REACH=1.3;
LIGHTS.forEach(([x,y,z,c,i,d])=>{ const torch=(c===0xff8a2a||c===0xffb05a); if(torch){ i*=SCONCE_BOOST; d*=SCONCE_REACH; } const l=new THREE.PointLight(C(c),i,d,2); l.position.set(x,y,z); l.userData.base=i; scene.add(l); torchLights.push(l); });

// toon gradient (4 bands)
const GRAD=(()=>{ const t=new THREE.DataTexture(new Uint8Array([48,120,200,255]),4,1,THREE.LuminanceFormat); t.minFilter=t.magFilter=THREE.NearestFilter; t.needsUpdate=true; return t; })();
const GRAD_SOFT=(()=>{ const t=new THREE.DataTexture(new Uint8Array([110,165,215,255]),4,1,THREE.LuminanceFormat); t.minFilter=t.magFilter=THREE.NearestFilter; t.needsUpdate=true; return t; })();
const MATS={};
function mat(hex,o){ const k=hex+JSON.stringify(o||{}); if(!MATS[k]) MATS[k]=new THREE.MeshToonMaterial(Object.assign({color:C(hex),gradientMap:GRAD},o||{})); return MATS[k]; }
function basic(hex,o){ return new THREE.MeshBasicMaterial(Object.assign({color:C(hex)},o||{})); }
// outline: back-face hull pushed along normals, fog-aware
const OL=new THREE.ShaderMaterial({side:THREE.BackSide,fog:true,
  uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{t:{value:0.028},col:{value:C(0x160c1e)}}]),
  vertexShader:'uniform float t;\n#include <fog_pars_vertex>\nvoid main(){ vec3 p=position+normal*t; vec4 mvPosition=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
  fragmentShader:'uniform vec3 col;\n#include <fog_pars_fragment>\nvoid main(){ gl_FragColor=vec4(col,1.0);\n#include <fog_fragment>\n}'});
function outline(root){ root.traverse(m=>{ if(m.isMesh&&m.material!==OL&&!m.userData.noOL&&!m.isSprite&&!m.userData.isOL){ const o=new THREE.Mesh(m.geometry,OL); o.userData.isOL=true; m.add(o); } }); return root; }
const G={box:(w,h,d)=>new THREE.BoxGeometry(w,h,d), cyl:(rt,rb,h,s)=>new THREE.CylinderGeometry(rt,rb,h,s||10), sph:(r,a,b)=>new THREE.SphereGeometry(r,a||12,b||9), cone:(r,h,s)=>new THREE.ConeGeometry(r,h,s||8)};
function M(geo,m,x,y,z){ const o=new THREE.Mesh(geo,m); if(x!==undefined) o.position.set(x,y,z); return o; }
function glowTex(){ const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'); const r=g.createRadialGradient(32,32,0,32,32,32); r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(.35,'rgba(255,255,255,.45)'); r.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=r; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); }
const GLOWT=glowTex();
function glow(hex,scale,op){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOWT,color:C(hex),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op||.8})); s.scale.set(scale,scale,1); s.userData.noOL=true; return s; }
const SHADOWMAT=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.42,depthWrite:false});
function blob(r){ const m=new THREE.Mesh(new THREE.CircleGeometry(r,14),SHADOWMAT); m.rotation.x=-PI/2; m.position.y=.04; m.userData.noOL=true; return m; }

// ================= PAINTED TEXTURES =================
function cv(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
function splat(g,x,y,r,col,a){ g.globalAlpha=a; g.fillStyle=col; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); g.globalAlpha=1; }
function hsl(h,s,l){ return 'hsl('+h+','+s+'%,'+l+'%)'; }
function paintFloor(){
  const S=32, c=cv(GW*S*2,GH*S*2), g=c.getContext("2d"); g.scale(2,2);
  g.fillStyle='#0f0a16'; g.fillRect(0,0,c.width,c.height);
  for(let z=0;z<GH;z++) for(let x=0;x<GW;x++){ const t=grid[idx(x,z)]; if(t===T.WALL) continue; const px=x*S, pz=z*S;
    if(t===T.CARPET){ if(MAP.style&&MAP.style.road){ g.fillStyle='#5e5a52'; g.fillRect(px,pz,S,S); for(let sx=0;sx<2;sx++) for(let sz=0;sz<2;sz++){ g.fillStyle=hsl(38,10,R(46,58)); g.fillRect(px+sx*16+1.5,pz+sz*16+1.5,13,13); for(let i=0;i<2;i++) splat(g,px+sx*16+2+rnd()*12,pz+sz*16+2+rnd()*12,R(1,3),rnd()<.5?hsl(38,8,40):hsl(40,14,66),.22); } }   // a paved royal road, gold-edged
      else { const throne=MAP.id==='throne'; g.fillStyle=throne?'#2c1a5e':'#8c1d24'; g.fillRect(px,pz,S,S); for(let i=0;i<14;i++) splat(g,px+rnd()*S,pz+rnd()*S,R(1.5,4),rnd()<.5?(throne?'#180f3a':'#5a0f14'):(throne?'#4a2f96':'#b03038'),.16);
      g.globalAlpha=.32; g.fillStyle='#e8b94a'; g.beginPath(); g.moveTo(px+16,pz+6); g.lineTo(px+26,pz+16); g.lineTo(px+16,pz+26); g.lineTo(px+6,pz+16); g.closePath(); g.fill(); g.globalAlpha=1; }
      g.strokeStyle='#e8b94a'; g.lineWidth=3; g.beginPath();
      if(gat(x,z-1)!==T.CARPET){ g.moveTo(px,pz+2); g.lineTo(px+S,pz+2);} if(gat(x,z+1)!==T.CARPET){ g.moveTo(px,pz+S-2); g.lineTo(px+S,pz+S-2);} if(gat(x-1,z)!==T.CARPET){ g.moveTo(px+2,pz); g.lineTo(px+2,pz+S);} if(gat(x+1,z)!==T.CARPET){ g.moveTo(px+S-2,pz); g.lineTo(px+S-2,pz+S);} g.stroke();
    } else if(t===T.DAIS||t===T.CRYSTAL){ g.fillStyle='#2a2136'; g.fillRect(px,pz,S,S); for(let sx=0;sx<2;sx++) for(let sz=0;sz<2;sz++){ g.fillStyle=hsl(36,18,R(28,35)); g.fillRect(px+sx*16+1.5,pz+sz*16+1.5,13,13); }
      for(let i=0;i<6;i++) splat(g,px+rnd()*S,pz+rnd()*S,R(1,3),rnd()<.5?'#3a2e1e':'#c9b48a',.15);
      g.strokeStyle='#e8b94a'; g.lineWidth=2.5; g.beginPath(); const D=v=>v!==T.DAIS&&v!==T.CRYSTAL;
      if(D(gat(x,z-1))){ g.moveTo(px,pz+1.5); g.lineTo(px+S,pz+1.5);} if(D(gat(x,z+1))){ g.moveTo(px,pz+S-1.5); g.lineTo(px+S,pz+S-1.5);} if(D(gat(x-1,z))){ g.moveTo(px+1.5,pz); g.lineTo(px+1.5,pz+S);} if(D(gat(x+1,z))){ g.moveTo(px+S-1.5,pz); g.lineTo(px+S-1.5,pz+S);} g.stroke();
    } else if(t===T.SPAWN){ g.fillStyle='#1d1430'; g.fillRect(px,pz,S,S); for(let i=0;i<10;i++) splat(g,px+rnd()*S,pz+rnd()*S,R(2,5),'#6a2fb0',.18);
    } else if(t===T.WATER){ g.fillStyle='#0a1630'; g.fillRect(px,pz,S,S); for(let i=0;i<8;i++) splat(g,px+rnd()*S,pz+rnd()*S,R(2,6),rnd()<.5?'#061024':'#16305a',.25);   // the moat's bed, seen through the water
    } else if(MAP.style&&MAP.style.grass&&t===T.FLOOR){ g.fillStyle='#1c3a1a'; g.fillRect(px,pz,S,S); for(let i=0;i<9;i++) splat(g,px+rnd()*S,pz+rnd()*S,R(2,6),hsl(R(95,130),R(28,40),R(16,30)),.5); g.strokeStyle=hsl(110,35,34); g.lineWidth=1; g.globalAlpha=.55; g.beginPath(); for(let i=0;i<5;i++){ const bx=px+rnd()*S, bz=pz+rnd()*S; g.moveTo(bx,bz); g.lineTo(bx+R(-2,2),bz-R(3,6)); } g.stroke(); g.globalAlpha=1;   // a green: turf with blades
    } else { const mar=!!(MAP.style&&MAP.style.marble), moss=!!(MAP.style&&MAP.style.moss); g.fillStyle=mar?'#a89c88':moss?'#1a2418':'#1c1626'; g.fillRect(px,pz,S,S);
      for(let sx=0;sx<2;sx++) for(let sz=0;sz<2;sz++){ const L=mar?R(58,70)-((x+z)%2?7:0):moss?R(30,40):R(30,41), H=mar?R(34,46):moss?R(95,140):R(246,262), SA=mar?14:moss?12:17; g.fillStyle=hsl(H,SA,L); g.fillRect(px+sx*16+1.5,pz+sz*16+1.5,13,13);
        g.fillStyle=hsl(H,SA+3,L+12); g.globalAlpha=.35; g.fillRect(px+sx*16+1.5,pz+sz*16+1.5,13,2); g.globalAlpha=1;
        for(let i=0;i<3;i++) splat(g,px+sx*16+2+rnd()*12,pz+sz*16+2+rnd()*12,R(1,3.5),rnd()<.5?hsl(H,15,L-10):hsl(H,22,L+10),.22); }
      if(rnd()<.12){ g.strokeStyle='#120c18'; g.lineWidth=1; g.globalAlpha=.6; g.beginPath(); g.moveTo(px+rnd()*S,pz+rnd()*S); g.lineTo(px+rnd()*S,pz+rnd()*S); g.stroke(); g.globalAlpha=1; }
    }
  }
  for(let i=0;i<7000;i++) splat(g,rnd()*c.width,rnd()*c.height,R(2,7),rnd()<.5?'#000':'#fff',.045);
  const tex=new THREE.CanvasTexture(c); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy()); return tex;
}
function paintWall(){
  const mar=!!(MAP.style&&MAP.style.marble); const c=cv(256,256), g=c.getContext('2d'); g.fillStyle=mar?'#8a7c6a':'#1a1322'; g.fillRect(0,0,256,256);
  for(let r=0;r<4;r++){ const y0=r*64, off=(r%2)*64; for(let b=-1;b<3;b++){ const x0=b*128+off; const L=mar?R(60,70):R(33,43), H=mar?R(34,44):R(246,258), SA=mar?16:15;
      g.fillStyle=hsl(H,SA,L); g.fillRect(x0+3,y0+3,122,58);
      g.globalAlpha=.5; g.fillStyle=hsl(H,SA+3,L+16); g.fillRect(x0+3,y0+3,122,4); g.fillRect(x0+3,y0+3,4,58); g.globalAlpha=.4; g.fillStyle=mar?'#6a5d4e':'#0d0912'; g.fillRect(x0+3,y0+56,122,5); g.fillRect(x0+121,y0+3,4,58); g.globalAlpha=1;
      for(let i=0;i<9;i++) splat(g,x0+6+rnd()*116,y0+6+rnd()*52,R(2,7),rnd()<.5?hsl(H,12,L-12):hsl(H,20,L+12),.2); } }
  for(let i=0;i<1800;i++) splat(g,rnd()*256,rnd()*256,R(1,5),rnd()<.5?'#000':'#fff',.05);
  const tex=new THREE.CanvasTexture(c); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.encoding=THREE.sRGBEncoding; tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy()); return tex;
}
function paintBanner(){
  const c=cv(128,256), g=c.getContext('2d'); g.clearRect(0,0,128,256);
  g.beginPath(); g.moveTo(0,0); g.lineTo(128,0); g.lineTo(128,214); g.lineTo(64,256); g.lineTo(0,214); g.closePath();
  g.fillStyle='#8c1d24'; g.fill(); g.lineWidth=9; g.strokeStyle='#e8b94a'; g.stroke();
  for(let i=0;i<40;i++) splat(g,rnd()*128,rnd()*230,R(2,6),rnd()<.5?'#5a0f14':'#b03038',.18);
  g.fillStyle='#e8b94a'; g.beginPath(); g.arc(64,100,34,0,TAU); g.fill();
  g.fillStyle='#8c1d24'; g.beginPath(); g.moveTo(64,62); g.lineTo(88,116); g.lineTo(40,116); g.closePath(); g.fill();
  g.fillStyle='#e8b94a'; g.fillRect(28,150,72,8); g.fillRect(28,170,72,8);
  const tex=new THREE.CanvasTexture(c); tex.encoding=THREE.sRGBEncoding; return tex;
}
function paintWindow(){ const c=cv(128,320), g=c.getContext('2d'); g.clearRect(0,0,128,320); const arch=()=>{ g.beginPath(); g.moveTo(10,312); g.lineTo(10,110); g.quadraticCurveTo(10,28,64,10); g.quadraticCurveTo(118,28,118,110); g.lineTo(118,312); g.closePath(); };
  arch(); const gr=g.createLinearGradient(0,0,0,320); gr.addColorStop(0,'#1a2a6a'); gr.addColorStop(.6,'#2a3f9a'); gr.addColorStop(1,'#141a44'); g.fillStyle=gr; g.fill();
  g.save(); arch(); g.clip(); for(let i=0;i<40;i++) splat(g,rnd()*128,rnd()*320,R(.6,1.8),'#dfe8ff',.7); g.globalAlpha=.35; g.fillStyle='#8fb8ff'; g.beginPath(); g.arc(88,72,30,0,TAU); g.fill(); g.globalAlpha=.95; g.fillStyle='#f4efd8'; g.beginPath(); g.arc(88,72,15,0,TAU); g.fill(); g.globalAlpha=1;
  g.strokeStyle='#e8b94a'; g.lineWidth=4; g.beginPath(); g.moveTo(64,10); g.lineTo(64,312); g.moveTo(10,150); g.lineTo(118,150); g.moveTo(10,230); g.lineTo(118,230); g.stroke(); g.restore();
  arch(); g.strokeStyle='#e8b94a'; g.lineWidth=9; g.stroke(); arch(); g.strokeStyle='#5a4220'; g.lineWidth=3; g.stroke(); const tex=new THREE.CanvasTexture(c); tex.encoding=THREE.sRGBEncoding; return tex; }
function paintDrape(){ const throne=MAP.id==='throne'; const c=cv(64,256), g=c.getContext('2d'); g.fillStyle=throne?'#2c1a5e':'#8c1d24'; g.fillRect(0,0,64,256); for(let x=0;x<64;x+=8){ g.fillStyle=(x/8)%2?(throne?'#20134a':'#6a1219'):(throne?'#3a2478':'#a3282f'); g.fillRect(x,0,8,256); g.globalAlpha=.5; g.fillStyle=throne?'#5a3aa8':'#b8383f'; g.fillRect(x+2,0,2,256); g.globalAlpha=1; }
  for(let i=0;i<60;i++) splat(g,rnd()*64,rnd()*256,R(1,4),rnd()<.5?(throne?'#180f3a':'#5a0f14'):(throne?'#6a48c0':'#c04048'),.15); g.fillStyle='#e8b94a'; g.fillRect(0,0,64,9); g.fillRect(0,247,64,9); g.beginPath(); g.moveTo(0,150); g.quadraticCurveTo(32,172,64,150); g.lineTo(64,162); g.quadraticCurveTo(32,184,0,162); g.closePath(); g.fill();
  const tex=new THREE.CanvasTexture(c); tex.encoding=THREE.sRGBEncoding; return tex; }
const FLOORTEX=paintFloor(), WALLTEX=paintWall(), BANNERTEX=paintBanner(); const WINDOWTEX=(MAP.style&&MAP.style.windows)?paintWindow():null, DRAPETEX=WINDOWTEX?paintDrape():null;

// ================= BUILD THE HALL =================
const world=new THREE.Group(); scene.add(world);
{ if(!HASWATER){ const floor=new THREE.Mesh(new THREE.PlaneGeometry(GW*CELL,GH*CELL),new THREE.MeshToonMaterial({map:FLOORTEX,gradientMap:GRAD,color:C(0xffffff)})); floor.rotation.x=-PI/2; floor.position.set(GW*CELL/2-OX,0,GH*CELL/2-OZ); world.add(floor); }   // a water map draws every cell's top itself (the moat bed is sunken)
  // no raised dais: the crystal's own carved base stands straight on the floor (the DAIS cells stay as an inlaid floor marking)
  [[0,-3.05],[0,3.05]].forEach(([x,z])=>world.add(M(G.box(6.2,.1,.12),mat(0xe0b040),x,.5,z))); [[-3.05,0],[3.05,0]].forEach(([x,z])=>world.add(M(G.box(.12,.1,6.2),mat(0xe0b040),x,.5,z)));
  if(!OUT){ const ceil=new THREE.Mesh(new THREE.PlaneGeometry(GW*CELL,GH*CELL),mat(0x120c1a)); ceil.rotation.x=PI/2; ceil.position.set(GW*CELL/2-OX,WALLH,GH*CELL/2-OZ); world.add(ceil); }
  else { const st=new THREE.BufferGeometry(); const pts=[]; for(let i=0;i<400;i++){ const a=rnd()*TAU, e=.15+rnd()*1.2, r=120; pts.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r); } st.setAttribute('position',new THREE.Float32BufferAttribute(pts,3)); scene.add(new THREE.Points(st,new THREE.PointsMaterial({color:C(0xdfe8ff),size:1.1,sizeAttenuation:true,transparent:true,opacity:.85,fog:false})));
    const moon=glow(0xf4efd8,22,.95); moon.material.fog=false; moon.position.set(40,70,-70); scene.add(moon); const halo=glow(0x8fb8ff,60,.25); halo.material.fog=false; halo.position.copy(moon.position); scene.add(halo); }   // stars and a moon
}
const wallFaces=[];
{ const pos=[],nrm=[],uv=[],ind=[]; let vi=0;
  for(let z=0;z<GH;z++) for(let x=0;x<GW;x++){ if(grid[idx(x,z)]===T.WALL) continue;
    for(let k=0;k<4;k++){ const dx=[1,-1,0,0][k], dz=[0,0,1,-1][k]; if(gat(x+dx,z+dz)!==T.WALL) continue;
      const fx=cw(x)+dx*CELL/2, fz=cwz(z)+dz*CELL/2, tx=dz, tz=-dx, hx=tx*CELL/2, hz=tz*CELL/2;
      const y0=Math.min(0,hgt[idx(x,z)]||0); const P=[[fx-hx,y0,fz-hz],[fx-hx,WALLH,fz-hz],[fx+hx,WALLH,fz+hz],[fx+hx,y0,fz+hz]];   // down to the bed of a sunken cell
      const ua=((fx-hx)*tx+(fz-hz)*tz)/CELL, ub=((fx+hx)*tx+(fz+hz)*tz)/CELL;
      const U=[[ua,y0/CELL],[ua,WALLH/CELL],[ub,WALLH/CELL],[ub,y0/CELL]];
      for(let i=0;i<4;i++){ pos.push(P[i][0],P[i][1],P[i][2]); nrm.push(-dx,0,-dz); uv.push(U[i][0],U[i][1]); }
      ind.push(vi,vi+1,vi+2,vi,vi+2,vi+3); vi+=4;
      wallFaces.push({x:fx,z:fz,nx:-dx,nz:-dz,cx:x,cz:z}); } }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('normal',new THREE.Float32BufferAttribute(nrm,3)); geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geo.setIndex(ind);
  const walls=new THREE.Mesh(geo,new THREE.MeshToonMaterial({map:WALLTEX,gradientMap:GRAD,color:C(0xffffff),side:THREE.DoubleSide})); world.add(walls);
  // dark cap so nothing leaks over the top edge
  const capGeo=new THREE.BufferGeometry(); const cp=[],ci=[]; let cvi=0;
  for(let z=0;z<GH;z++) for(let x=0;x<GW;x++){ if(grid[idx(x,z)]!==T.WALL) continue; const x0=cw(x)-1,x1=cw(x)+1,z0=cwz(z)-1,z1=cwz(z)+1; cp.push(x0,WALLH,z0,x1,WALLH,z0,x1,WALLH,z1,x0,WALLH,z1); ci.push(cvi,cvi+2,cvi+1,cvi,cvi+3,cvi+2); cvi+=4; }
  capGeo.setAttribute('position',new THREE.Float32BufferAttribute(cp,3)); capGeo.setIndex(ci); world.add(new THREE.Mesh(capGeo,basic(0x0b0712)));
}
// raised floors and stairs: tops carry the painted floor (same texture window as the flat floor), drops and risers are stone
{ const tp=[],tn=[],tu=[],ti=[]; let tv=0; const sp=[],sn=[],si=[]; let sv=0;
  const Hc=(cx,cz,fx,fz)=>{ if(!inb(cx,cz)||grid[idx(cx,cz)]===T.WALL) return -1; return floorH(cw(cx)-CELL/2+fx*CELL,cwz(cz)-CELL/2+fz*CELL); };   // -1: a wall (its face covers the drop)
  const side=(A,B,lo,hi,nx,nz)=>{ sp.push(A[0],lo,A[1], A[0],hi,A[1], B[0],hi,B[1], B[0],lo,B[1]); for(let q=0;q<4;q++) sn.push(nx,0,nz); si.push(sv,sv+1,sv+2,sv,sv+2,sv+3); sv+=4; };
  for(let cz=0;cz<GH;cz++) for(let cx=0;cx<GW;cx++){ const i=idx(cx,cz); if(grid[i]===T.WALL||(!HASWATER&&hgt[i]<=0&&!rampA[i])) continue; const a=rampA[i], alongZ=a===1||a===2; const X0=cw(cx)-CELL/2, Z0=cwz(cz)-CELL/2;
    for(let k=0;k<(a?2:1);k++){ const fx0=(a&&!alongZ)?k/2:0, fx1=(a&&!alongZ)?(k+1)/2:1, fz0=(a&&alongZ)?k/2:0, fz1=(a&&alongZ)?(k+1)/2:1; const y=Hc(cx,cz,(fx0+fx1)/2,(fz0+fz1)/2);
      const P=[[X0+fx0*CELL,Z0+fz0*CELL],[X0+fx0*CELL,Z0+fz1*CELL],[X0+fx1*CELL,Z0+fz1*CELL],[X0+fx1*CELL,Z0+fz0*CELL]], U=[[fx0,fz0],[fx0,fz1],[fx1,fz1],[fx1,fz0]];
      for(let q=0;q<4;q++){ tp.push(P[q][0],y,P[q][1]); tn.push(0,1,0); tu.push((cx+U[q][0])/GW,1-(cz+U[q][1])/GH); } ti.push(tv,tv+1,tv+2,tv,tv+2,tv+3); tv+=4; }
    // drops to lower neighbours and the riser between a stair cell's two steps, in half-cell segments
    for(let sgm=0;sgm<2;sgm++){ const f0=sgm/2, f1=(sgm+1)/2, fm=(f0+f1)/2;
      const E=[[1,0,[X0+CELL,Z0+f0*CELL],[X0+CELL,Z0+f1*CELL],Hc(cx,cz,.99,fm),Hc(cx+1,cz,.01,fm)],[-1,0,[X0,Z0+f1*CELL],[X0,Z0+f0*CELL],Hc(cx,cz,.01,fm),Hc(cx-1,cz,.99,fm)],[0,1,[X0+f1*CELL,Z0+CELL],[X0+f0*CELL,Z0+CELL],Hc(cx,cz,fm,.99),Hc(cx,cz+1,fm,.01)],[0,-1,[X0+f0*CELL,Z0],[X0+f1*CELL,Z0],Hc(cx,cz,fm,.01),Hc(cx,cz-1,fm,.99)]];
      for(const [nx,nz,A,B,mine,theirs] of E){ if(theirs<0||mine<=theirs+.01) continue; side(A,B,theirs,mine,nx,nz); }
      if(a){ const lo=Hc(cx,cz,alongZ?fm:(a===3?.49:.51),alongZ?(a===1?.51:.49):fm), hi=Hc(cx,cz,alongZ?fm:(a===3?.51:.49),alongZ?(a===1?.49:.51):fm); if(hi>lo+.01){ const A=alongZ?[X0+f0*CELL,Z0+CELL/2]:[X0+CELL/2,Z0+f0*CELL], B=alongZ?[X0+f1*CELL,Z0+CELL/2]:[X0+CELL/2,Z0+f1*CELL]; const nx=a===3?-1:a===4?1:0, nz=a===1?1:a===2?-1:0; side(nx===-1||nz===-1?B:A,nx===-1||nz===-1?A:B,lo,hi,nx,nz); } } } }
  if(tv){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(tp,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(tn,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(tu,2)); g.setIndex(ti); const floorMesh=new THREE.Mesh(g,new THREE.MeshToonMaterial({map:FLOORTEX,gradientMap:GRAD,color:C(0xffffff),side:THREE.DoubleSide})); world.add(floorMesh); world.userData.floorMesh=floorMesh;   // a handle so a map can retint its own stair treads (56-thronedecor.js) without a second mesh
    const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3)); sg.setAttribute('normal',new THREE.Float32BufferAttribute(sn,3)); sg.setIndex(si); world.add(new THREE.Mesh(sg,mat((MAP.style&&MAP.style.marble)?0x7a6e62:HASWATER?0x4d4b52:0x3e3450,{side:THREE.DoubleSide}))); }
  if(MAP.style&&MAP.style.rails){ const P=[], RX=[], RZ=[];   // a balustrade along every drop of a step and a half or more: a post each half cell on the edge, a gold rail between
    for(let cz=0;cz<GH;cz++) for(let cx=0;cx<GW;cx++){ const i=idx(cx,cz); if(grid[i]===T.WALL||(hgt[i]<=0&&!rampA[i])) continue; const X0=cw(cx)-CELL/2, Z0=cwz(cz)-CELL/2;
      for(const [nx,nz] of [[1,0],[-1,0],[0,1],[0,-1]]) for(let sgm=0;sgm<2;sgm++){ const f0=sgm/2, f1=(sgm+1)/2, fm=(f0+f1)/2; const mine=Hc(cx,cz,nx?(nx>0?.99:.01):fm,nz?(nz>0?.99:.01):fm), theirs=Hc(cx+nx,cz+nz,nx?(nx>0?.01:.99):fm,nz?(nz>0?.01:.99):fm); if(theirs<0||mine<theirs+1.5) continue;
        const ex=nx?X0+(nx>0?CELL:0):0, ez=nz?Z0+(nz>0?CELL:0):0, ax=nx?ex:X0+f0*CELL, az=nz?ez:Z0+f0*CELL, bx=nx?ex:X0+f1*CELL, bz=nz?ez:Z0+f1*CELL, ox=-nx*.14, oz=-nz*.14;
        P.push(ax+ox,mine+.45,az+oz); (nx?RZ:RX).push((ax+bx)/2+ox,mine+.92,(az+bz)/2+oz); } }
    const inst=(geo,m,arr)=>{ const n=arr.length/3; if(!n) return null; const im=new THREE.InstancedMesh(geo,m,n); const o=new THREE.Object3D(); for(let k=0;k<n;k++){ o.position.set(arr[k*3],arr[k*3+1],arr[k*3+2]); o.updateMatrix(); im.setMatrixAt(k,o.matrix); } im.userData.noOL=true; world.add(im); return im; };
    const railMeshes=[inst(G.box(.16,.9,.16),mat(0x8a7c6a),P),inst(G.box(CELL/2,.08,.1),mat(0xe0b040),RX),inst(G.box(.1,.08,CELL/2),mat(0xe0b040),RZ)].filter(Boolean);
    world.userData.rails=P.length/3; world.userData.railMeshes=railMeshes;   // a handle so a map can hide the generic gold balustrade where it's been replaced with real art (56-thronedecor.js)
  } }
// pillars, props, torches, banners
const flames=[], WORLDANIM=[];   // WORLDANIM: per-frame animators for the world's moving bits (water, pennants)
// the moat: a painted ripple texture drifting over the sunken bed, and a fainter sheen drifting the other way
if(HASWATER){ const c=cv(128,128), g=c.getContext('2d'); g.fillStyle='#143059'; g.fillRect(0,0,128,128); g.strokeStyle='#4f86c8'; g.lineWidth=2; g.globalAlpha=.5; for(let i=0;i<9;i++){ g.beginPath(); const y=i*14+rnd()*6; for(let x=0;x<=128;x+=8) g.lineTo(x,y+Math.sin(x/128*TAU*2+i)*3); g.stroke(); } g.globalAlpha=.35; g.strokeStyle='#a8d0ff'; for(let i=0;i<12;i++){ g.beginPath(); const x0=rnd()*128,y0=rnd()*128; g.moveTo(x0,y0); g.lineTo(x0+R(6,16),y0+R(-2,2)); g.stroke(); } g.globalAlpha=1;
  const tex=new THREE.CanvasTexture(c); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.encoding=THREE.sRGBEncoding; const tex2=tex.clone(); tex2.needsUpdate=true;
  const pos=[],uv=[],ind=[]; let vi=0; for(let cz=0;cz<GH;cz++) for(let cx=0;cx<GW;cx++){ if(grid[idx(cx,cz)]!==T.WATER) continue; const X0=cw(cx)-CELL/2, Z0=cwz(cz)-CELL/2; pos.push(X0,0,Z0, X0,0,Z0+CELL, X0+CELL,0,Z0+CELL, X0+CELL,0,Z0); uv.push(cx/2,cz/2, cx/2,(cz+1)/2, (cx+1)/2,(cz+1)/2, (cx+1)/2,cz/2); ind.push(vi,vi+1,vi+2,vi,vi+2,vi+3); vi+=4; }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geo.setIndex(ind); geo.computeVertexNormals();
  const wm=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide}); const water=new THREE.Mesh(geo,wm); water.position.y=WATER_Y; water.userData.noOL=true; world.add(water);
  const wm2=new THREE.MeshBasicMaterial({map:tex2,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}); const sheen=new THREE.Mesh(geo,wm2); sheen.position.y=WATER_Y+.03; sheen.userData.noOL=true; world.add(sheen);
  WORLDANIM.push((dt,t)=>{ tex.offset.x=t*.012; tex.offset.y=Math.sin(t*.5)*.02; tex2.offset.x=-t*.02; tex2.offset.y=t*.015; wm2.opacity=.13+.06*Math.sin(t*1.7); }); world.userData.water=vi/4; }
function makeTorch(){ const g=new THREE.Group(); g.add(M(G.box(.14,.14,.34),mat(0x2b2540),0,0,.17)); const h=M(G.cyl(.05,.07,.7,7),mat(0x6b4a2a),0,.2,.34); h.rotation.x=-.35; g.add(h);
  g.add(M(G.cyl(.09,.07,.14,7),mat(0x3a3348),0,.56,.45));
  const f=M(G.cone(.17,.5,7),basic(0xff7a1a),0,.85,.46); f.userData.noOL=true; const f2=M(G.cone(.09,.34,7),basic(0xffd060),0,.82,.46); f2.userData.noOL=true; g.add(f,f2); const gl=glow(0xff8a2a,2.6,.7); gl.position.set(0,.9,.46); g.add(gl); flames.push({f,f2,p:rnd()*9}); return g; }
{ // pillars
  const PH=MAP.pillarH||6; const pillarProcs=[]; MAP.pillars.forEach(([x,z])=>{ const g=new THREE.Group(); g.position.set(cw(x),hgt[idx(x,z)]||0,cwz(z));
    g.add(M(G.box(2,.5,2),mat(0x4a4262),0,.25,0)); g.add(M(G.cyl(.62,.7,PH,12),mat(0x5a5276),0,.5+PH/2,0)); g.add(M(G.box(2,.5,2),mat(0x4a4262),0,PH+.75,0)); g.add(M(G.box(1.6,.2,1.6),mat(0xe0b040),0,.6,0)); world.add(g); pillarProcs.push(g); });
  world.userData.pillarProcs=pillarProcs;
  // props: barrels & crates in the hall corners
  world.userData.barrelProcs=[]; world.userData.crateProcs=[]; world.userData.hearthProcs=[];   // build 304: handles so a map can stand real art in their place (56e-feastdecor.js)
  MAP.barrels.forEach(([x,z])=>{ const g=new THREE.Group(); world.userData.barrelProcs.push(g); g.position.set(cw(x),0,cwz(z)); const bm=mat(0x7a4f2c), band=mat(0x2b2540);
    [[-.4,0,-.3],[.45,0,.35],[0,1.1,0]].forEach(([bx,by,bz])=>{ const b=new THREE.Group(); b.position.set(bx,by+.55,bz); b.add(M(G.cyl(.42,.42,1.1,10),bm)); b.add(M(G.cyl(.45,.45,.1,10),band,0,.35,0)); b.add(M(G.cyl(.45,.45,.1,10),band,0,-.35,0)); g.add(b); }); world.add(outline(g)); });
  MAP.crates.forEach(([x,z])=>{ const g=new THREE.Group(); world.userData.crateProcs.push(g); g.position.set(cw(x),0,cwz(z)); const cm=mat(0x8a5e34);
    g.add(M(G.box(1.1,1.1,1.1),cm,-.35,.55,.2)); g.add(M(G.box(.9,.9,.9),cm,.5,.45,-.3)); g.add(M(G.box(.8,.8,.8),cm,-.2,1.5,.2)); g.add(M(G.box(1.14,.08,.08),mat(0x3a2a20),-.35,.55,.76)); world.add(outline(g)); });
  // torches + banners along the walls
  const [hx0,hx1,hz0,hz1]=MAP.hall; const WIN=new Set(); let nWin=0; const WINPARTS=[];
  if(WINDOWTEX){ let k=0; wallFaces.forEach(f=>{ if(!(f.cx>=hx0&&f.cx<=hx1&&f.cz>=hz0&&f.cz<=hz1)) return; k++; if(k%6!==2) return; WIN.add(f); nWin++; const yaw=Math.atan2(f.nx,f.nz), tx=f.nz, tz=-f.nx; const fy=hgt[idx(f.cx,f.cz)]||0, wh=WALLH-fy;   // tall arched windows with crimson drapes, every sixth hall face, in the wall above that cell's floor
      const w=new THREE.Mesh(new THREE.PlaneGeometry(2.4,Math.min(6,wh*.6)),new THREE.MeshBasicMaterial({map:WINDOWTEX,transparent:true,alphaTest:.5,side:THREE.DoubleSide})); w.position.set(f.x+f.nx*.1,fy+wh*.56,f.z+f.nz*.1); w.rotation.y=yaw; w.userData.noOL=true; w.userData.window=true; world.add(w); WINPARTS.push(w);
      const dh=wh*.62; for(const sd of [-1,1]){ const d=new THREE.Mesh(new THREE.PlaneGeometry(1.0,dh),new THREE.MeshToonMaterial({map:DRAPETEX,gradientMap:GRAD,color:C(0xffffff),side:THREE.DoubleSide})); d.position.set(f.x+f.nx*.16+tx*sd*1.75,fy+wh*.5,f.z+f.nz*.16+tz*sd*1.75); d.rotation.y=yaw; d.userData.noOL=true; world.add(d); WINPARTS.push(d); }
      const rod=M(G.cyl(.06,.06,4.9,6),mat(0xe0b040),f.x+f.nx*.2,fy+wh*.5+dh/2+.12,f.z+f.nz*.2); rod.rotation.set(0,yaw,PI/2); world.add(rod); WINPARTS.push(rod); for(const sd of [-1,1]){ const fin=M(G.sph(.14,7,6),mat(0xe0b040),f.x+f.nx*.2+tx*sd*2.45,fy+wh*.5+dh/2+.12,f.z+f.nz*.2+tz*sd*2.45); world.add(fin); WINPARTS.push(fin); } }); }
  world.userData.windows=nWin; world.userData.windowParts=WINPARTS;
  const torchProcs=[], bannerMeshes=[], bannerRods=[]; let i=0; wallFaces.forEach(f=>{ const inHall=f.cx>=hx0&&f.cx<=hx1&&f.cz>=hz0&&f.cz<=hz1; i++; if(WIN.has(f)) return;
    const yaw=Math.atan2(f.nx,f.nz), fy=hgt[idx(f.cx,f.cz)]||0;   // torches and banners hang above the floor of the cell they face (a landing's wall carries its own)
    if(i%4===1){ const t=makeTorch(); t.position.set(f.x,fy+3.1,f.z); t.rotation.y=yaw; world.add(t); torchProcs.push(t); }
    else if(inHall&&i%4===3){ const b=new THREE.Mesh(new THREE.PlaneGeometry(1.3,2.6),new THREE.MeshToonMaterial({map:BANNERTEX,gradientMap:GRAD,color:C(0xffffff),transparent:true,side:THREE.DoubleSide,alphaTest:.5})); b.position.set(f.x+f.nx*.12,fy+4.2,f.z+f.nz*.12); b.rotation.y=yaw; world.add(b); const rod=M(G.cyl(.05,.05,1.7,6),mat(0xe0b040),f.x+f.nx*.12,fy+5.5,f.z+f.nz*.12); rod.rotation.y=yaw; rod.rotation.z=PI/2; world.add(rod); bannerMeshes.push(b); bannerRods.push(rod); } });
  world.userData.torchProcs=torchProcs; world.userData.bannerMeshes=bannerMeshes; world.userData.bannerRods=bannerRods;   // a handle so a map can swap the painted banners for real art (56-thronedecor.js), same idea as railMeshes/floorMesh
  (MAP.roofs||[]).forEach(([x0,x1,z0,z1])=>{ const y=(MAP.pillarH||6)+1.0; const w=(x1-x0+1)*CELL, d=(z1-z0+1)*CELL; const r=M(G.box(w,.45,d),mat(0x2a1f2c),(cw(x0)+cw(x1))/2,y,(cwz(z0)+cwz(z1))/2); world.add(r); world.add(M(G.box(w,.12,d),mat(0x4a4262),(cw(x0)+cw(x1))/2,y+.28,(cwz(z0)+cwz(z1))/2)); });   // covered walkways: a slab on the colonnade
  (MAP.trees||[]).forEach(([x,z])=>{ const g=new THREE.Group(); g.position.set(cw(x),hgt[idx(x,z)]||0,cwz(z)); g.add(M(G.cyl(.22,.3,2.2,7),mat(0x5a3a22),0,1.1,0)); [[0,2.6,0,1.5],[.7,2.2,.4,1.0],[-.6,2.3,-.5,1.0],[0,3.5,0,1.1]].forEach(([ox,oy,oz,r])=>g.add(M(G.sph(r,8,6),mat(0x2f6a2a),ox,oy,oz))); world.add(outline(g)); (world.userData.treeProcs=world.userData.treeProcs||[]).push(g); });   // trees in the court (kept in treeProcs so a real model can stand in: 56d-courtdecor.js)
  // a castle's outside: battlements on every wall, towers with pennants, the keep rising behind the ward, the gate arch with its
  // portcullis raised, the drawbridge on its chains, lamp posts, stone kings on plinths and braziers
  if(MAP.castle){ const CS=MAP.castle, stone=mat(0x5a5276), dark=mat(0x2b2540), gold=mat(0xe0b040), wood=mat(0x6b4a2a), plank=mat(0x8a5e34), iron=mat(0x3a3348), roofm=mat(0x5a1e2a), grey=mat(0x8a8898), TD=MAP.tavern||{dx:0,dz:0};
    { const inTav=f=>f.cx>=11+TD.dx&&f.cx<=21+TD.dx&&f.cz>=23+TD.dz&&f.cz<=32+TD.dz; const arr=[]; wallFaces.forEach(f=>{ if(inTav(f)) return; arr.push(f.x-f.nx*.32,WALLH+.55,f.z-f.nz*.32,Math.atan2(f.nx,f.nz)); });   // merlons: one per face, none on the inn
      const n=arr.length/4; if(n){ const im=new THREE.InstancedMesh(G.box(1.0,1.1,.64),stone,n); const o=new THREE.Object3D(); for(let k=0;k<n;k++){ o.position.set(arr[k*4],arr[k*4+1],arr[k*4+2]); o.rotation.set(0,arr[k*4+3],0); o.updateMatrix(); im.setMatrixAt(k,o.matrix); } im.userData.noOL=true; world.add(im); world.userData.merlons=n; } }
    const merlonRing=(x,z,r,y,n)=>{ for(let k=0;k<n;k++){ const a=k/n*TAU; const m=M(G.box(.9,1.0,.5),stone,x+Math.cos(a)*r,y,z+Math.sin(a)*r); m.rotation.y=-a+PI/2; m.userData.noOL=true; world.add(m); } };
    const pennant=(x,y,z)=>{ world.add(M(G.cyl(.05,.05,3.2,6),dark,x,y+1.6,z)); const sh=new THREE.Shape(); sh.moveTo(0,0); sh.lineTo(1.7,.3); sh.lineTo(0,.6); const pen=new THREE.Mesh(new THREE.ShapeGeometry(sh),mat(0xa01c28,{side:THREE.DoubleSide})); pen.position.set(x,y+2.5,z); pen.userData.noOL=true; world.add(pen); WORLDANIM.push((dt,t)=>{ pen.rotation.y=Math.sin(t*2.1+x)*.35+.3; pen.scale.y=.9+.1*Math.sin(t*6+z); }); };
    (CS.towers||[]).forEach(([x,z,r,h,cap])=>{ const wx=cw(x), wz=cwz(z); world.add(M(G.cyl(r,r,h,14),stone,wx,h/2,wz)); world.add(M(G.cyl(r+.35,r+.35,.5,14),dark,wx,h+.15,wz)); if(cap==='cone'){ world.add(M(G.cone(r+.5,r*1.6,14),roofm,wx,h+.4+r*.8,wz)); pennant(wx,h+.4+r*1.6,wz); } else { merlonRing(wx,wz,r+.05,h+.85,Math.round(r*4)); pennant(wx,h+.4,wz); } });
    (CS.keep||[]).forEach(([x0,x1,z0,z1,h])=>{ const X=(cw(x0)+cw(x1))/2, Z=(cwz(z0)+cwz(z1))/2-.05, w=(x1-x0+1)*CELL, d=(z1-z0+1)*CELL; world.add(M(G.box(w,h,d-.1),stone,X,h/2,Z)); world.add(M(G.box(w+.4,.6,d+.3),dark,X,h+.3,Z));
      const sh=new THREE.Shape(); sh.moveTo(-d/2,0); sh.lineTo(d/2,0); sh.lineTo(0,h*.28); const roof=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:w-1,bevelEnabled:false}),roofm); roof.rotation.y=PI/2; roof.position.set(X-(w-1)/2,h+.6,Z); world.add(roof);
      const zf=Z+d/2+.04; for(const k of [-2,-1,1,2]){ const wx=X+k*w/6; const win=M(new THREE.PlaneGeometry(1.2,2.4),basic(0xffd060),wx,h*.7,zf+.02); win.userData.noOL=true; world.add(win); world.add(M(G.box(1.6,2.8,.12),dark,wx,h*.7,zf-.04)); }   // lit windows high in the keep's face
      const b=new THREE.Mesh(new THREE.PlaneGeometry(3.2,6.4),new THREE.MeshToonMaterial({map:BANNERTEX,gradientMap:GRAD,color:C(0xffffff),transparent:true,side:THREE.DoubleSide,alphaTest:.5})); b.position.set(X,h*.66,zf+.06); world.add(b); const rod=M(G.cyl(.08,.08,4,6),gold,X,h*.66+3.3,zf+.06); rod.rotation.z=PI/2; world.add(rod); });   // the royal banner over the gate
    (CS.arches||[]).forEach(([x0,x1,z0,z1,y0])=>{ const X=(cw(x0)+cw(x1))/2, Z=(cwz(z0)+cwz(z1))/2, w=(x1-x0+1)*CELL+.5, d=(z1-z0+1)*CELL+.3; world.add(M(G.box(w,WALLH-y0,d),stone,X,(WALLH+y0)/2,Z)); world.add(M(G.box(w+.3,.3,d+.3),gold,X,y0-.15,Z));
      for(let k=0;k<=8;k++){ world.add(M(G.cyl(.06,.06,2.6,6),iron,X-w/2+.25+k*(w-.5)/8,y0-1.0,Z)); } for(const yy of [y0-.4,y0-1.6]){ const hb=M(G.cyl(.05,.05,w-.5,6),iron,X,yy,Z); hb.rotation.z=PI/2; world.add(hb); } });   // the gate arch, the portcullis raised inside it
    if(CS.bridge){ const [x0,x1,z0,z1]=CS.bridge; const X=(cw(x0)+cw(x1))/2, Z=(cwz(z0)+cwz(z1))/2, w=(x1-x0+1)*CELL+.4, d=(z1-z0+1)*CELL+.6; const g=new THREE.Group(); g.position.set(X,0,Z);
      g.add(M(G.box(w,.22,d),wood,0,.11,0)); for(let k=-d/2+.35;k<d/2;k+=.7){ const gr=M(G.box(w,.02,.05),dark,0,.23,k); gr.userData.noOL=true; g.add(gr); } for(const sx of [-1,1]){ g.add(M(G.box(.2,.3,d),plank,sx*(w/2-.1),.37,0)); for(let k=-d/2+.5;k<d/2;k+=2) g.add(M(G.box(.18,1.1,.18),wood,sx*(w/2-.1),.9,k)); g.add(M(G.box(.12,.1,d),gold,sx*(w/2-.1),1.45,0)); }
      world.add(outline(g)); world.userData.bridge=true;
      (CS.chains||[]).forEach(([ax,ay,az,bx,by,bz])=>{ const A=new THREE.Vector3(cw(ax),ay,cwz(az)), B=new THREE.Vector3(cw(bx),by,cwz(bz)); const ch=M(G.cyl(.07,.07,A.distanceTo(B),6),iron); ch.position.copy(A).lerp(B,.5); ch.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize()); world.add(ch); }); }   // the deck, its rails, the chains that would raise it
    (CS.lamps||[]).forEach(([x,z])=>{ const g=new THREE.Group(); g.position.set(cw(x),hgt[idx(x,z)]||0,cwz(z)); g.add(M(G.cyl(.22,.3,.3,8),stone,0,.15,0)); g.add(M(G.cyl(.07,.1,3.0,7),iron,0,1.8,0)); for(const sx of [-1,1]) for(const sz of [-1,1]) g.add(M(G.box(.07,.72,.07),iron,sx*.3,3.55,sz*.3)); g.add(M(G.box(.7,.08,.7),iron,0,3.18,0)); g.add(M(G.box(.7,.08,.7),iron,0,3.92,0)); const lit=M(G.box(.5,.56,.5),basic(0xffd060),0,3.55,0); lit.userData.noOL=true; g.add(lit); g.add(M(G.cone(.5,.4,4),dark,0,4.15,0)); const gl=glow(0xffb05a,3.2,.6); gl.position.y=3.55; g.add(gl); world.add(outline(g)); });
    (CS.statues||[]).forEach(([x,z,yaw])=>{ const g=new THREE.Group(); g.position.set(cw(x),hgt[idx(x,z)]||0,cwz(z)); g.rotation.y=yaw||0; g.add(M(G.box(1.8,.5,1.8),stone,0,.25,0)); g.add(M(G.box(1.3,1.0,1.3),dark,0,1.0,0)); g.add(M(G.box(1.45,.1,1.45),gold,0,1.55,0));
      const s=new THREE.Group(); s.position.y=1.6; s.add(M(G.cyl(.34,.42,.9,9),grey,0,.45,0)); s.add(M(G.sph(.42,10,8),grey,0,1.15,0)); s.add(M(G.cone(.36,1.0,9),grey,0,1.95,0)); s.add(M(G.box(.5,.55,.3),grey,0,.95,.3)); s.add(M(G.box(.22,.7,.22),grey,-.5,.75,0)); const arm=M(G.box(.22,.7,.22),grey,.5,1.1,.15); arm.rotation.x=-.9; s.add(arm); s.add(M(G.box(.08,1.5,.16),grey,.5,1.9,.35)); s.add(M(G.box(.4,.08,.14),gold,.5,1.35,.35)); g.add(s); world.add(outline(g)); });   // a stone gnome king, sword raised
    (CS.braziers||[]).forEach(([x,z])=>{ const g=new THREE.Group(); g.position.set(cw(x),hgt[idx(x,z)]||0,cwz(z)); for(let k=0;k<3;k++){ const a=k/3*TAU; const lg=M(G.cyl(.04,.05,1.1,5),iron,Math.cos(a)*.3,.55,Math.sin(a)*.3); lg.rotation.z=Math.cos(a)*.25; lg.rotation.x=-Math.sin(a)*.25; g.add(lg); } g.add(M(G.cyl(.55,.32,.4,10),iron,0,1.15,0)); g.add(M(G.cyl(.58,.58,.08,10),gold,0,1.36,0)); const f=M(G.cone(.42,1.0,7),basic(0xff7a1a),0,1.8,0); f.userData.noOL=true; const f2=M(G.cone(.22,.7,7),basic(0xffd060),0,1.75,0); f2.userData.noOL=true; g.add(f,f2); flames.push({f,f2,p:rnd()*9}); const gl=glow(0xff8a2a,4,.7); gl.position.y=1.9; g.add(gl); world.add(outline(g)); }); }
  (MAP.tables||[]).forEach(([x0,x1,z0,z1])=>{ const gaps=MAP.tableGaps||[]; let run=null; const flush=()=>{ if(!run) return; const [a,b]=run; const w=(b-a+1)*CELL-.3, cx0=(cw(a)+cw(b))/2, cz0=(cwz(z0)+cwz(z1))/2; const g=new THREE.Group(); (world.userData.tableProcs=world.userData.tableProcs||[]).push(g); g.position.set(cx0,0,cz0); const wood=mat(0x6b4a2a), plank=mat(0x8a5e34), cream=mat(0xf1e6d0);
      g.add(M(G.box(w,.14,1.6),plank,0,1.0,0)); for(const sx of [-1,1]) g.add(M(G.box(.3,.9,1.3),wood,sx*(w/2-.5),.45,0)); for(const sz of [-1,1]){ g.add(M(G.box(w-.4,.1,.5),plank,0,.55,sz*1.35)); for(const sx of [-1,1]) g.add(M(G.box(.2,.5,.45),wood,sx*(w/2-.8),.25,sz*1.35)); }
      for(let u=-w/2+1;u<w/2-.5;u+=2.2){ g.add(M(G.cyl(.28,.28,.05,10),cream,u,1.1,(u/2.2%2?1:-1)*.35)); g.add(M(G.cyl(.11,.09,.24,7),cream,u+.7,1.19,.1)); if(((u+w)/2.2|0)%2===0){ const cd=M(G.cyl(.05,.05,.35,6),cream,u+.3,1.25,-.2); g.add(cd); const f=M(G.cone(.07,.18,6),basic(0xffd060),u+.3,1.5,-.2); f.userData.noOL=true; g.add(f); flames.push({f,f2:f,p:1.2+rnd()}); const gl=glow(0xffb05a,1.1,.55); gl.position.set(u+.3,1.5,-.2); g.add(gl); } }
      world.add(outline(g)); run=null; }; for(let x=x0;x<=x1;x++){ if(gaps.includes(x)){ flush(); continue; } if(!run) run=[x,x]; else run[1]=x; } flush(); });   // feast tables: planks, benches, plates, mugs and candles
  (MAP.hearths||[]).forEach(([x,z,yaw])=>{ const g=new THREE.Group(); (world.userData.hearthProcs=world.userData.hearthProcs||[]).push(g); g.position.set(cw(x),0,cwz(z)); g.rotation.y=yaw; const stone=mat(0x4a4262); g.add(M(G.box(4.2,3.4,1.2),stone,0,1.7,-.4)); g.add(M(G.box(4.6,.3,1.5),mat(0x5a5276),0,3.5,-.4)); g.add(M(G.box(2.4,2.0,.8),mat(0x1a1420),0,1.0,0));
    const f=M(G.cone(.6,1.3,7),basic(0xff7a1a),0,.8,.1); f.userData.noOL=true; const f2=M(G.cone(.32,.9,7),basic(0xffd060),0,.75,.12); f2.userData.noOL=true; g.add(f,f2); flames.push({f,f2,p:1.7}); const gl=glow(0xff8a2a,5,.7); gl.position.set(0,1.2,.2); g.add(gl); [[-.7,.3,.1],[.6,.3,.15]].forEach(([lx,ly,lz])=>{ const lg=M(G.cyl(.12,.12,1.2,6),mat(0x5a3a22),lx,ly,lz); lg.rotation.z=PI/2; g.add(lg); }); world.add(outline(g)); });   // great hearths
  if(MAP.throne){ const [tx,tz]=MAP.throne; const g=new THREE.Group(); g.position.set(cw(tx),hgt[idx(tx,tz)],cwz(tz)); const st=mat(0x4a4262), gd=mat(0xe0b040), rd=mat(0xa01c28), dk=mat(0x2b2540);   // the throne: a wide stone seat, tall back, gold trim, red cushion, facing the hall — a Meshy model hides this and stands in its place when it loads (56-thronedecor.js)
    g.add(M(G.box(4.2,.35,3.2),st,0,.17,.2)); g.add(M(G.box(2.6,1.0,1.9),dk,0,.85,-.1)); g.add(M(G.box(2.4,.28,1.6),rd,0,1.45,0)); g.add(M(G.box(3.0,3.6,.5),dk,0,2.6,-1.15)); g.add(M(G.box(2.6,3.2,.12),rd,0,2.7,-.85)); g.add(M(G.box(3.2,.2,.6),gd,0,4.45,-1.15));
    for(const sx of [-1,1]){ g.add(M(G.box(.4,.7,1.9),dk,sx*1.5,1.55,-.1)); g.add(M(G.box(.5,.12,2.0),gd,sx*1.5,1.95,-.1)); g.add(M(G.sph(.28,8,6),gd,sx*1.4,4.7,-1.15)); g.add(M(G.cyl(.16,.2,.9,7),gd,sx*1.45,.8,.9)); }
    world.add(outline(g)); world.userData.throneProc=g; }
  // chandelier over the north half of the hall
  world.userData.chandelierProcs=[];
  for(const [chx,chz] of (MAP.chandeliers||[MAP.chandelier])){ const ch=new THREE.Group(); ch.position.set(chx,WALLH-1.8,chz); const ring=M(new THREE.TorusGeometry(1.6,.09,6,18),mat(0x2b2540)); ring.rotation.x=PI/2; ch.add(ring); ch.add(M(G.cyl(.03,.03,1.8,5),mat(0x2b2540),0,.9,0));
  for(let k=0;k<6;k++){ const a=k/6*TAU; ch.add(M(G.cyl(.06,.06,.32,6),mat(0xf4ead0),Math.cos(a)*1.6,.2,Math.sin(a)*1.6)); const f=M(G.cone(.08,.24,6),basic(0xffd060),Math.cos(a)*1.6,.48,Math.sin(a)*1.6); f.userData.noOL=true; ch.add(f); flames.push({f,f2:f,p:k}); } const cg=glow(0xffb05a,3,.5); cg.position.y=.4; ch.add(cg); world.add(ch); world.userData.chandelierProcs.push(ch); }   // a handle so a map can hide these once a real chandelier model stands in their place (56-thronedecor.js)
  // beams
  MAP.beams.zs.forEach(z=>world.add(M(G.box(MAP.beams.w,.5,.5),mat(0x2a1f2c),0,WALLH-.25,z)));
}
// crystal on its pedestal
const crystalG=new THREE.Group(); crystalG.position.y=hgt[GOAL]; world.add(crystalG);
const crystalMesh=(()=>{ const m=new THREE.Mesh(new THREE.OctahedronGeometry(1,0),new THREE.MeshToonMaterial({color:C(0x2fb8e8),emissive:C(0x0e7aa8),emissiveIntensity:.55,gradientMap:GRAD})); m.scale.set(1,1.9,1); return m; })();
{ crystalG.add(M(G.cyl(1.5,1.7,.3,12),mat(0x4a4262),0,.15,0)); crystalG.add(M(G.cyl(1.1,1.3,.3,12),mat(0x5a5276),0,.45,0)); crystalG.add(M(G.cyl(.7,.9,.35,10),mat(0x4a4262),0,.77,0)); crystalG.add(M(G.cyl(1.32,1.32,.08,12),mat(0xe0b040),0,.83,0));
  const cg=new THREE.Group(); cg.position.y=2.7; cg.add(outline(crystalMesh)); cg.add(glow(0xa08cff,4.2,.45)); crystalG.add(cg); crystalG.userData.cg=cg;
  for(let k=0;k<4;k++){ const s=new THREE.Mesh(new THREE.OctahedronGeometry(.22,0),basic(0x9af8ff)); s.userData.noOL=true; s.userData.a=k/4*TAU; cg.add(s); crystalG.userData['s'+k]=s; } }
// spawn portals
const portals=[];
Object.entries(LANES).forEach(([k,l])=>{ const g=new THREE.Group(); g.position.set(cw(l.cx),hgt[idx(l.cx,l.cz)]||0,cwz(l.cz)); g.rotation.y=l.face;   // a gate on a landing stands on the landing
  const arch=new THREE.Group(); arch.position.z=-1.1; // stands at the back of the spawn room, facing the corridor
  arch.add(M(G.box(.6,4,.6),mat(0x2a2136),-1.7,2,0)); arch.add(M(G.box(.6,4,.6),mat(0x2a2136),1.7,2,0)); arch.add(M(G.box(4,.7,.7),mat(0x2a2136),0,4.2,0)); arch.add(M(G.box(.5,.5,.5),mat(0xe0b040),0,4.75,0));
  const disc=new THREE.Mesh(new THREE.CircleGeometry(1.5,20),new THREE.MeshBasicMaterial({color:C(0x4a1690),transparent:true,opacity:.9,side:THREE.DoubleSide})); disc.position.y=1.9; disc.userData.noOL=true;
  const ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.45,20,1),new THREE.MeshBasicMaterial({color:C(0xc040ff),transparent:true,opacity:.8,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false})); ring.position.y=1.9; ring.position.z=.02; ring.userData.noOL=true;
  const pg=glow(0xc040ff,4.5,.6); pg.position.y=1.9; arch.add(disc,ring,pg); g.add(outline(arch)); world.add(g); portals.push({g,ring,disc,k}); });

// ================= MODELS =================
function limb(x,y,len,r,m){ const l=new THREE.Group(); l.position.set(x,y,0); l.add(M(G.cyl(r,r*.85,len,7),m,0,-len/2,0)); l.userData.len=len; return l; }
function makeHero(){
  const g=new THREE.Group();
  const skin=mat(0xf2c39a), armor=mat(0x5b6f9e), steel=mat(0xc4ced9), gold=mat(0xe0b040), red=mat(0xc8262b), beard=mat(0xf4f0ea), boot=mat(0x4a3423), dark=mat(0x2b2540), capeM=mat(0x2b4a9e,{side:THREE.DoubleSide});
  function leg(x){ const l=new THREE.Group(); l.position.set(x,.5,0); l.add(M(G.cyl(.13,.15,.42,8),dark,0,-.2,0)); l.add(M(G.box(.28,.16,.4),boot,0,-.44,.05)); return l; }
  const legL=leg(-.19), legR=leg(.19); g.add(legL,legR);
  g.add(M(G.cyl(.4,.36,.7,10),armor,0,.85,0)); g.add(M(G.cyl(.43,.43,.1,10),gold,0,.55,0)); g.add(M(G.box(.5,.42,.12),steel,0,.95,.36));
  const em=M(G.sph(.16,8,6),gold,0,.98,.42); em.scale.set(1,1,.5); g.add(em);
  const head=new THREE.Group(); head.position.y=1.55; g.add(head);
  head.add(M(G.sph(.42,14,11),skin)); head.add(M(G.sph(.11,8,6),skin,0,-.07,.4));
  const eL=M(G.sph(.05,6,5),basic(0x1a1020),-.14,.05,.37), eR=M(G.sph(.05,6,5),basic(0x1a1020),.14,.05,.37); eL.userData.noOL=eR.userData.noOL=true; head.add(eL,eR);
  const bd=M(G.sph(.33,12,9),beard,0,-.23,.22); bd.scale.set(1,1.15,.75); head.add(bd);
  const hat=M(G.cone(.47,.95,12),red,0,.62,0); hat.rotation.x=-.12; head.add(hat); head.add(M(G.cyl(.48,.5,.12,12),steel,0,.2,0));
  function arm(x){ const a=new THREE.Group(); a.position.set(x,1.12,0); a.add(M(G.cyl(.1,.09,.5,8),armor,0,-.25,0)); a.add(M(G.sph(.12,8,6),skin,0,-.52,0)); return a; }
  const armR=arm(-.46), armL=arm(.46); g.add(armR,armL);
  const sw=new THREE.Group(); sw.position.set(0,-.52,0); sw.add(M(G.cyl(.04,.04,.22,6),dark,0,.02,0)); sw.add(M(G.sph(.06,6,5),gold,0,.14,0)); sw.add(M(G.box(.36,.06,.1),gold,0,-.1,0)); sw.add(M(G.box(.12,.95,.03),steel,0,-.6,0)); const tip=M(G.cone(.06,.14,4),steel,0,-1.14,0); tip.rotation.x=PI; sw.add(tip); armR.add(sw);
  const sh=new THREE.Group(); sh.position.set(0,-.4,.16); const disc=M(G.cyl(.45,.45,.06,14),red); disc.rotation.x=PI/2; sh.add(disc); const rim=M(new THREE.TorusGeometry(.45,.04,6,16),gold); sh.add(rim); sh.add(M(G.sph(.1,8,6),gold,0,0,.05)); armL.add(sh);
  const capeG=new THREE.Group(); capeG.position.set(0,1.25,-.36); const cp=M(new THREE.PlaneGeometry(.9,1.0),capeM,0,-.5,0); cp.userData.noOL=true; capeG.add(cp); g.add(capeG);
  outline(g);
  return {g,legL,legR,armR,armL,capeG,head};
}
function makeGoblin(kind){
  const g=new THREE.Group(); let skin,cloth,sc=1,h=1.4,r=.42; const steel=mat(0xc4ced9), wood=mat(0x6b4a2a), eye=basic(0xff3030);
  if(kind==='goblin'){ skin=mat(0x62b03c); cloth=mat(0x5a3a22); }
  else if(kind==='orc'){ skin=mat(0x4f8a35); cloth=mat(0x3a2a1a); sc=1.55; h=2.1; r=.65; }
  else if(kind==='archer'){ skin=mat(0xc8843a); cloth=mat(0x3a2a1a); sc=1.1; h=1.55; r=.42; }
  else if(kind==='drake'){ skin=mat(0xc0301c); cloth=mat(0x6a1a12); sc=1.25; h=1.6; r=.7; }
  else { skin=mat(0x9a8a5c); cloth=mat(0x4a2e1a); sc=2.4; h=3.3; r=1.05; }
  const bulky=kind==='orc'||kind==='ogre';
  if(kind==='drake') for(const sd of [-1,1]){ const w=M(G.box(.95,.05,.55),mat(0x8a1a12),sd*.7,1.05,-.1); w.rotation.z=sd*.3; g.add(w); }
  const legL=limb(-.14,.42,.36,bulky?.11:.08,skin), legR=limb(.14,.42,.36,bulky?.11:.08,skin); g.add(legL,legR);
  g.add(M(G.cyl(bulky?.3:.2,bulky?.36:.24,.44,8),skin,0,.66,0)); g.add(M(G.box(bulky?.62:.44,.22,bulky?.5:.34),cloth,0,.44,0));
  if(bulky){ const belly=M(G.sph(.33,10,8),skin,0,.62,.08); belly.scale.set(1,.85,.9); g.add(belly); }
  const head=new THREE.Group(); head.position.y=bulky?1.08:1.1; g.add(head);
  head.add(M(G.sph(bulky?.32:.3,12,9),skin));
  const eL=M(G.sph(.05,6,5),eye,-.11,.04,.26), eR=M(G.sph(.05,6,5),eye,.11,.04,.26); eL.userData.noOL=eR.userData.noOL=true; head.add(eL,eR);
  const nose=M(G.cone(.06,.18,5),skin,0,-.04,.32); nose.rotation.x=PI/2; head.add(nose);
  if(kind==='goblin'||kind==='archer'){ const earL=M(G.cone(.08,.38,5),skin,-.34,.08,0); earL.rotation.z=PI/2; const earR=M(G.cone(.08,.38,5),skin,.34,.08,0); earR.rotation.z=-PI/2; head.add(earL,earR); }
  if(bulky){ const jaw=M(G.box(.34,.14,.24),skin,0,-.22,.16); head.add(jaw); [-.1,.1].forEach(x=>{ const t=M(G.cone(.035,.16,5),mat(0xf4f0ea),x,-.1,.3); head.add(t); }); }
  if(kind==='archer'){ const hood=M(G.cone(.36,.6,9),cloth,0,.2,-.02); head.add(hood); const cl=M(G.cyl(.3,.4,.5,8),cloth,0,.7,0); g.add(cl); }
  if(kind==='ogre'){ const horn=M(G.cone(.07,.3,5),mat(0xf4f0ea),0,.28,.02); head.add(horn); }
  const armL=limb(.3,.86,.38,bulky?.09:.06,skin), armR=limb(-.3,.86,.38,bulky?.09:.06,skin); g.add(armL,armR);
  if(kind==='goblin'){ const d=new THREE.Group(); d.position.y=-.4; d.add(M(G.box(.05,.34,.02),steel,0,-.15,0)); d.add(M(G.box(.14,.04,.05),wood,0,.02,0)); armR.add(d); }
  else if(kind==='archer'){ const bow=M(new THREE.TorusGeometry(.42,.025,5,12,PI),wood,0,-.36,.1); bow.rotation.y=PI/2; bow.rotation.z=-PI/2; armL.add(bow); const qv=M(G.cyl(.08,.08,.5,6),cloth,-.18,.8,-.22); qv.rotation.x=.4; g.add(qv); }
  else { const c=new THREE.Group(); c.position.y=-.36; c.add(M(G.cyl(.05,.07,.6,6),wood,0,-.25,0)); c.add(M(G.sph(.15,8,6),wood,0,-.58,0)); if(kind==='ogre'){ for(let k=0;k<4;k++){ const a=k/4*TAU; const sp=M(G.cone(.03,.14,4),steel,Math.cos(a)*.16,-.58,Math.sin(a)*.16); sp.rotation.z=-Math.cos(a)*PI/2; sp.rotation.x=Math.sin(a)*PI/2; c.add(sp); } } armR.add(c); }
  g.scale.set(sc,sc,sc); const sh=blob(r*1.1/sc); sh.position.y=.04/sc; g.add(sh);
  outline(g);
  return {g,legs:[legL,legR],arms:[armL,armR],head,h,r};
}
function makeDef(kind,ghost){
  const g=new THREE.Group(); const stone=mat(0x5a5276), wood=mat(0x7a4f2c), dark=mat(0x2b2540), steel=mat(0xc4ced9), rope=mat(0xcbb58a), gold=mat(0xe0b040), red=mat(0xc8262b);
  if(kind==='harpoon'){
    g.add(M(G.cyl(.85,.95,.3,10),stone,0,.15,0)); g.add(M(G.cyl(.16,.2,.8,8),wood,0,.7,0)); g.add(M(G.box(.5,.12,.5),dark,0,1.05,0));
    const yoke=new THREE.Group(); yoke.position.y=1.18; yoke.add(M(G.box(.26,.2,1.7),wood,0,0,.1));
    const lL=M(G.box(.08,.1,.9),wood,-.45,.02,.55); lL.rotation.y=-.55; const lR=M(G.box(.08,.1,.9),wood,.45,.02,.55); lR.rotation.y=.55; yoke.add(lL,lR);
    const s=M(G.cyl(.015,.015,1.7,4),rope,0,.02,.2); s.rotation.z=PI/2; yoke.add(s);
    const hp=new THREE.Group(); hp.position.set(0,.17,.2); const shaft=M(G.cyl(.035,.035,1.5,6),dark); shaft.rotation.x=PI/2; hp.add(shaft); const tip=M(G.cone(.07,.28,6),steel,0,0,.85); tip.rotation.x=PI/2; hp.add(tip); yoke.add(hp);
    const w=M(G.cyl(.08,.08,.4,8),dark,0,.02,-.75); w.rotation.z=PI/2; yoke.add(w); yoke.add(M(G.box(.06,.06,.5),wood,0,.02,-.45));
    g.add(yoke); g.userData.yoke=yoke; g.userData.hp=hp;
  } else if(kind==='acorn'){
    const bark=mat(0x5a3a1e), leaf=mat(0x4f8f3a); g.add(M(G.cyl(.62,.78,.9,9),wood,0,.45,0)); g.add(M(G.cyl(.66,.66,.08,9),bark,0,.3,0)); g.add(M(G.cyl(.7,.7,.08,9),bark,0,.7,0));
    [[.5,.6,.2,.4],[-.45,.7,-.3,-1.2],[.2,.75,-.55,2.1]].forEach(([x,y,z,r])=>{ const l=M(G.box(.34,.03,.2),leaf,x,y,z); l.rotation.y=r; l.rotation.x=.3; g.add(l); });
    const yoke=new THREE.Group(); yoke.position.y=1.05; const barrel=M(G.cyl(.2,.24,1.2,9),bark,0,0,.25); barrel.rotation.x=PI/2; yoke.add(barrel); [-.1,.35,.7].forEach(z=>{ const b=M(G.cyl(.25,.25,.08,9),steel,0,0,z); b.rotation.x=PI/2; yoke.add(b); });
    yoke.add(M(G.box(.5,.14,.4),dark,0,-.14,-.1)); const hp=acornMesh(); hp.position.set(0,0,.9); yoke.add(hp); g.add(yoke); g.userData.yoke=yoke; g.userData.hp=hp;
  } else if(kind==='ball'){
    g.add(M(G.cyl(.85,.95,.3,10),stone,0,.15,0)); const tur=new THREE.Group(); tur.position.y=.3; tur.add(M(G.box(1.2,.16,1.4),wood,0,.08,0));
    [-.42,.42].forEach(x=>{ const a=M(G.box(.12,1.7,.12),wood,x,.9,.35); a.rotation.x=.4; const b=M(G.box(.12,1.7,.12),wood,x,.9,-.35); b.rotation.x=-.4; tur.add(a,b); });
    const axle=M(G.cyl(.06,.06,1.0,6),dark,0,1.62,0); axle.rotation.z=PI/2; tur.add(axle);
    const arm=new THREE.Group(); arm.position.y=1.62; arm.rotation.x=-.9; arm.add(M(G.box(.1,.12,2.6),wood,0,0,-.3)); arm.add(M(G.box(.5,.42,.42),dark,0,-.1,.85)); const sling=M(G.cyl(.02,.02,.5,4),rope,0,-.22,-1.5); arm.add(sling);
    const turnip=turnipMesh(); turnip.position.set(0,-.45,-1.55); arm.add(turnip); tur.add(arm); g.add(tur); g.userData.yoke=tur; g.userData.arm=arm; g.userData.ball=turnip;
  } else if(kind==='slice'){
    const cream=mat(0xf1e6d0), capM=mat(0xb04ad0), spot=basic(0xffffff);
    for(let k=0;k<8;k++){ const a=k/8*TAU+.2, r=2.3, sc=.8+((k*7)%3)*.2; g.add(M(G.cyl(.07,.1,.42*sc,6),cream,Math.cos(a)*r,.21*sc,Math.sin(a)*r)); const cap=M(G.sph(.24*sc,9,7),capM,Math.cos(a)*r,.44*sc,Math.sin(a)*r); cap.scale.y=.6; g.add(cap);
      for(let q=0;q<3;q++){ const b=(q/3)*TAU+k; const sp=M(G.sph(.045,5,4),spot,Math.cos(a)*r+Math.cos(b)*.15*sc,.5*sc,Math.sin(a)*r+Math.sin(b)*.15*sc); sp.userData.noOL=true; g.add(sp); } }
    const disc=new THREE.Mesh(new THREE.CircleGeometry(2.5,24),new THREE.MeshBasicMaterial({color:C(0xb04ad0),transparent:true,opacity:.14,blending:THREE.AdditiveBlending,depthWrite:false})); disc.rotation.x=-PI/2; disc.position.y=.05; disc.userData.noOL=true; g.add(disc);
    const hub=new THREE.Group(); for(let k=0;k<7;k++){ const a=k/7*TAU, r=.4+((k*5)%3)*.55; const pf=glow(0xd08aff,.7+((k*3)%2)*.3,.3); pf.position.set(Math.cos(a)*r,.4,Math.sin(a)*r); pf.userData.ph=k*.31; pf.userData.a=a; pf.userData.r=r; hub.add(pf); } g.add(hub); g.userData.hub=hub;
  } else {
    const leafD=mat(0x2f5a2a), leafL=mat(0x3f7a36), thorn=mat(0x6b4a2a), berry=basic(0xd8323c);
    for(let k=0;k<7;k++){ const x=-.85+k*.28, h=.7+((k*5)%3)*.18; const b=M(G.box(.42,h,.5),k%2?leafD:leafL,x,h/2+.05,(k%3-1)*.08); b.rotation.y=((k*7)%5-2)*.18; b.rotation.z=((k*3)%3-1)*.08; g.add(b); }
    g.add(M(G.box(1.9,.16,.44),leafD,0,.9,0));
    for(let k=0;k<12;k++){ const x=-.9+k*.16, zf=k%2?.32:-.32; const t=M(G.cone(.045,.28,4),thorn,x,.35+((k*5)%4)*.16,zf); t.rotation.x=zf>0?PI/2-.3:-(PI/2-.3); t.rotation.z=((k*3)%3-1)*.3; g.add(t); }
    for(let k=0;k<6;k++){ const b=M(G.sph(.05,5,4),berry,-.7+k*.28,.55+((k*7)%3)*.14,k%2?.28:-.28); b.userData.noOL=true; g.add(b); }
  }
  if(ghost){ g.traverse(m=>{ if(m.isMesh) m.material=GHOST_OK; }); } else { outline(g); g.add(blob(.95)); }
  if(kind==='frost'){ const ice=mat(0x9ee8ff), deep=mat(0x4aa8e0); g.add(M(G.cyl(1.0,1.1,.2,12),stone,0,.1,0)); const big=M(G.cone(.42,2.2,6),ice,0,1.3,0); big.rotation.y=.4; g.add(big); [[.5,0,.9,-.25],[-.45,.25,.8,.3],[.1,-.5,1.1,.35],[-.2,.45,.7,-.3]].forEach(([x,z,h,tilt])=>{ const c=M(G.cone(.2,h,5),deep,x,.2+h/2,z); c.rotation.z=tilt; c.rotation.x=-tilt*.6; g.add(c); }); }
  if(kind==='totem'){ const ice=mat(0x5ec8ff); g.add(M(G.cyl(1.1,1.2,.22,14),stone,0,.11,0)); g.add(M(G.cyl(.42,.5,2.2,8),stone,0,1.32,0)); g.add(M(G.box(.5,.32,.5),dark,0,2.55,0)); const gem=M(G.sph(.2,8,6),ice,0,2.85,0); gem.userData.noOL=true; g.add(gem); for(let k=0;k<3;k++){ const r=M(G.box(.06,.5,.03),ice,0,1.1+k*.45,.47); r.userData.noOL=true; g.add(r); } }
  return g;
}
const GHOST_OK=new THREE.MeshBasicMaterial({color:C(0x40ff80),transparent:true,opacity:.45,depthWrite:false});
// a defense's sector of fire drawn on the floor: translucent wedge + bright edge
function sectorMesh(range,arcDeg,hex){ const g=new THREE.Group(); if(!range) return g; const arc=Math.min(TAU,arcDeg*PI/180), full=arc>=TAU-.01, n=Math.max(10,Math.round(arc/(PI/18)));
  const pos=[0,0,0]; for(let i=0;i<=n;i++){ const a=-arc/2+arc*i/n; pos.push(Math.sin(a)*range,0,Math.cos(a)*range); } const ind=[]; for(let i=1;i<=n;i++) ind.push(0,i,i+1);
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setIndex(ind);
  const fill=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:C(hex),transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide})); fill.position.y=.06; fill.userData.noOL=true; g.add(fill);
  const lp=[]; if(!full) lp.push(0,0,0); for(let i=0;i<=n;i++){ const a=-arc/2+arc*i/n; lp.push(Math.sin(a)*range,0,Math.cos(a)*range); }
  const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3)); const line=new THREE.LineLoop(lg,new THREE.LineBasicMaterial({color:C(hex),transparent:true,opacity:.9})); line.position.y=.07; line.userData.noOL=true; g.add(line);
  g.userData.fill=fill; g.userData.line=line; return g; }
function tintSector(g,hex){ if(!g.userData.fill) return; g.userData.fill.material.color=C(hex); g.userData.line.material.color=C(hex); }
let ghostSector=null, hoverSector=null, hoverFor=null;
const GHOST_BAD=new THREE.MeshBasicMaterial({color:C(0xff3030),transparent:true,opacity:.45,depthWrite:false});
function harpoonMesh(){ const g=new THREE.Group(); const s=M(G.cyl(.06,.075,1.4,7),mat(0x2b2540)); s.rotation.x=PI/2; g.add(s); const t=M(G.cone(.12,.34,7),mat(0xc4ced9),0,0,.85); t.rotation.x=PI/2; g.add(t); const f=M(G.box(.05,.22,.3),mat(0x8a2a2a),0,0,-.55); g.add(f); const f2=M(G.box(.22,.05,.3),mat(0x8a2a2a),0,0,-.55); g.add(f2); return g; }   // a stout bolt: thick shaft, broad head, fletching
function acornMesh(){ const g=new THREE.Group(); g.add(M(G.sph(.28,8,6),mat(0x9a6a3a),0,0,0)); const cap=M(G.cyl(.3,.34,.2,8),mat(0x5a3a1e),0,.17,0); g.add(cap); g.add(M(G.cyl(.03,.03,.14,4),mat(0x5a3a1e),0,.34,0)); outline(g); return g; }
function turnipMesh(){ const g=new THREE.Group(); const body=M(G.sph(.3,10,8),mat(0xece2f2)); body.scale.y=.85; g.add(body); const top=M(G.sph(.24,10,8),mat(0x9a5ab8),0,.14,0); top.scale.y=.6; g.add(top); const leaf=mat(0x4f8f3a); [[.08,.3,0,.4],[-.06,.34,.05,-.3],[0,.32,-.08,1.2]].forEach(([x,y,z,r])=>{ const l=M(G.box(.06,.24,.02),leaf,x,y,z); l.rotation.z=r; g.add(l); }); outline(g); return g; }
function ballMesh(){ const g=new THREE.Group(); const m=M(G.sph(.42,12,10),mat(0x1a1620)); [[.1,.34,.22],[-.12,.34,.22],[0,.4,.1]].forEach(([x,y,z])=>{ const h=M(G.sph(.06,6,5),basic(0x000000),x,y,z); h.userData.noOL=true; m.add(h); }); outline(m); g.add(m); g.userData.m=m; return g; }
function arrowMesh(){ const g=new THREE.Group(); const r=M(new THREE.DodecahedronGeometry(.2,0),mat(0x6e6a70)); r.rotation.set(rnd()*3,rnd()*3,0); g.add(r); g.userData.spin=1; return g; }   // the bandit's rock
function grenadeMesh(){ const g=new THREE.Group(); const o=new THREE.Mesh(new THREE.IcosahedronGeometry(.24,0),basic(0xc060ff)); o.userData.noOL=true; g.add(o); const core=M(new THREE.SphereGeometry(.1,7,6),basic(0xf0d0ff)); core.userData.noOL=true; g.add(core); g.add(glow(0xa040ff,2.0,.85)); g.userData.spin=1; return g; }   // the troll boss's lobbed grenade — a bigger, brighter orb that bursts on landing
function orbMesh(){ const g=new THREE.Group(); const o=new THREE.Mesh(new THREE.OctahedronGeometry(.16,0),basic(0x7af4ff)); o.userData.noOL=true; g.add(o); g.add(glow(0x4ae6ff,1.2,.7)); g.userData.o=o; return g; }

// ================= GAME STATE =================
// the defenses. Internal keys are historical; the names are what the player sees.
const DEFS={
  // build 161 (Matt: "the tier one towers die too fast, they need a little more health"): every tower's health +30% (the hedge,
  // already the wall, stays 220) -- and see updateEnemies/updateDefs: an archer or troll shooting a tower now has to stand inside
  // that tower's reach, and a tower shot at answers its attacker first
  harpoon:{name:'Ballista',ic:'🏹',du:4,mana:60,hp:120,top:1.95,range:22,arc:16,arcs:[16,22,28,34,40],cd:1.6,dmg:6},        // single bolt, long range; cone widens with each of its four upgrades
  acorn:{name:'Acorn Cannon',ic:'🌰',du:3,mana:45,hp:105,top:1.4,range:12,rangeUp:1.5,arc:70,cd:1.1,dmg:3,shots:3},          // a hollow oak stump that sprays three bouncing acorns in a cone
  ball:{name:'Turnip Trebuchet',ic:'🥔',du:5,mana:80,hp:120,top:2.4,range:25,arc:100,cd:2.8,dmg:10,splash:3.8,splashUp:.35},   // lobs a turnip that splats for area damage: a wide splash (+.35 a mark) with a gentle falloff -- the trebuchet is the crowd-breaker. Build 161 (Matt: "the turnip trebuchet needs the longest range and big splash damage"): reach 17 → 25, the longest of any tower (the ballista's is 22); damage 7 → 10; splash 3.2 → 3.8; still the slowest arm
  slice:{name:'Mycelium Cage',ic:'🍄',du:6,mana:90,hp:140,top:.05,range:2.6,rangeUp:.6,arc:360,cd:.45,dmg:2,slow:.55,charge:[1.3,2.9],burst:5,cloud:3},     // a cage of glowing roots: mobs inside are slowed, and at a random interval the cage implodes on them (a spore vortex, a violet flash of burst x dmg, a lingering cloud that poisons for cloud s); heavy traffic tramples it
  spike:{name:'Bramble Hedge',ic:'🌿',du:3,mana:50,hp:220,top:1.0,thorns:2,regrow:3},                                       // a thorn wall that hurts attackers and regrows when left alone
  totem:{name:'Rune Totem',ic:'🗿',du:4,mana:70,hp:155,top:2.8,range:7,rangeUp:1,arc:360,buff:.15,buffUp:.05},           // a runed pillar: every other defense in its ring hits 15% harder and fires 15% faster (+5% a mark each), plus half its placer's defense damage / defense attack speed points (build 178, stat buffD/buffS); totems never stack
  frost:{name:'Frost Spire',ic:'❄',du:4,mana:60,hp:130,top:2.8,range:6,rangeUp:.8,arc:360,chill:.6,chillUp:.06,cd:.9,dmg:2},   // a cold tower: mobs in its ring crawl at 60% (6 points slower a mark) AND take a bite of cold every .9 s (build 150: 'they need to do cold/slowing damage'); the deepest cold wins, it never stacks                                       // a thorn wall that hurts attackers and regrows when left alone
  snare:{name:'Snare Tower',ic:'🕸',du:4,mana:65,hp:130,top:2.6,range:9,rangeUp:1,arc:360,cd:6,dmg:0},                    // a net-winch tower for flying mobs only: on cooldown it nets the nearest flyer in range and takes it off the field outright — no damage stat, it doesn't hurt what it doesn't catch
  // four elemental halo rings — flat glowing sigils on the floor, like the mushroom ring but each doing its own thing
  zap:{name:'Storm Halo',ic:'⚡',du:4,mana:65,hp:120,top:.08,range:5,rangeUp:.8,arc:360,cd:1.8,dmg:7},                     // electric: a burst on every mob in the ring at once, on a cooldown — a jolt, not a tick
  venom:{name:'Venom Halo',ic:'☠',du:4,mana:65,hp:120,top:.08,range:5,rangeUp:.8,arc:360,cd:.5,dmg:1.4,poisonDur:3},      // poison: a DOT that keeps ticking for a few seconds after a mob leaves the ring, unlike the others
  ember:{name:'Ember Halo',ic:'🔥',du:4,mana:65,hp:120,top:.08,range:5,rangeUp:.8,arc:360,cd:.5,dmg:2.2},                 // fire: burns everything standing in the ring, same tick pattern as the mushroom ring
  dazzle:{name:'Dazzling Halo',ic:'🌀',du:4,mana:65,hp:120,top:.08,range:5,rangeUp:.8,arc:360,confuseDur:1.2}};           // confusion: no damage — a mob in the ring wanders instead of advancing, for as long as it stays in range plus a little after
const DEFKEYS=['harpoon','acorn','ball','slice','spike','totem','frost','snare','zap','venom','ember','dazzle']; const DEFKEY_LABELS=['1','2','3','4','5','6','7','8','9','0','-','='];
// build 177 (Matt: "add more upgrades but just like chevrons once its a level 4" / "shouldn't need to get to 10 upgrades"): a tower
// now climbs to Mark VII. MAXLVL is the one knob -- the roman names, the upgrade toast, the card and the chevrons all follow it.
// There are four tower models (Marks I..IV); from CHEV_FROM (Mark V) up a tower keeps the Mark IV look and wears one gold chevron
// per mark past IV instead (towerChevrons, below)
const MAXLVL=7, CHEV_FROM=5;
function roman(n){ let s=''; for(const [v,r] of [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]) while(n>=v){ s+=r; n-=v; } return s; }
const MARK=['',...Array.from({length:MAXLVL},(_,i)=>roman(i+1))];
function chevCount(lvl){ return Math.max(0,(lvl||1)-CHEV_FROM+1); }   // V=1, VI=2, VII=3
function markGrow(lvl){ return 1+.07*(Math.min(lvl||1,CHEV_FROM)-1); }   // a mark makes a tower 7% bigger -- through Mark V only (the old top); past that the chevrons say it, so a Mark VII model isn't 42% oversize and poking into the next cell
// a defense's sector of fire at its current mark
function arcOf(d){ const cfg=DEFS[d.kind]; if(cfg.arcs) return cfg.arcs[Math.min(cfg.arcs.length-1,(d.lvl||1)-1)]; return cfg.arc||360; }
function mobSpd(e){ return e.spd*(e.slowT>0?DEFS.slice.slow:1)*(e.chillT>0?(e.chillK||DEFS.frost.chill):1)*(e.holdT>0?0:1)*(e.crawlT>0?.15:1); }   // holdT: Rootsplitter's roots; crawlT: the Hourglass (97-mythics.js)   // spored mobs crawl; chilled ones too
const MOBS={goblin:{hp:10,spd:3.4,dmg:3,cd:1.0,mana:1,detour:3}, orc:{hp:45,spd:2.1,dmg:8,cd:1.4,mana:3,detour:1}, archer:{hp:22,spd:2.8,dmg:4,cd:1.6,mana:2,ranged:11,detour:4}, drake:{hp:32,spd:2.6,dmg:9,cd:1.8,mana:4,detour:0,fly:2.6}, ogre:{hp:200,spd:1.7,dmg:20,cd:2.2,mana:8,detour:0,swingT:1.1,hitT:.64}, troll:{hp:65,spd:2.3,dmg:10,cd:2.0,mana:6,ranged:13,detour:3},
  trollboss:{hp:340,spd:1.9,dmg:14,cd:2.6,mana:14,ranged:11,splash:2.2,detour:2,healAmt:14,healR:6.5,healCd:3.2}};   // the lavender troll: a healer mini-boss — a slow lob that splashes, and a heal-pulse that mends nearby mobs (kill this one first)
const DU_CAP=MAP.du||40, SENS=0.0042;   // roots: a bigger map gives more to build with
const CRYSTAL_MAX=MAP.crystalHp||150;   // the crystal's life: half again what it was, so a leak costs a wave, not the run; a map may set its own (the training ground doubles it)
const S={mana:MAP.mana||260,du:0,crystal:CRYSTAL_MAX,crystal2:CRYSTAL_MAX,wave:0,phase:'start',t:0,waveT:0,kills:0,held:false};   // held (build 160): the last wave is held and the hall is on its victory lap -- phase 'build', no more waves, MOVE ON ends the run (winMap/moveOn)
function effWave(w){ return MAP.wbase+(w===undefined?S.wave:w); }   // map 2 wave 1 is the eighth wave of the campaign: mobs, loot and pay scale with this
function statWave(){ return effWave()-survivalPast()*(1-SURVIVAL_STAT_RATE); }   // build 176: the wave a mob's own hp/damage/speed scale off -- effWave in the campaign; past a map's own waves in Survival it climbs at half pace (volume is Survival's ramp, not hide). Loot, pay and mana keep effWave
const hero={x:0,y:0,z:6,vy:0,yaw:PI,hp:100,max:100,swingT:-1,hitDone:false,dead:0,ph:0,moving:false,hurtT:0,grounded:true,reach:2.4};   // reach: how far the swing lands (a whip reaches further than a sword)
const H=makeHero(); scene.add(H.g); const heroShadow=blob(.5); scene.add(heroShadow);
const cam={yaw:PI,pitch:.42,dist:8,d:8,x:0,y:5,z:14};
// build 345 (Matt: "fix my camera tilt so i could look up"): the view used to stop at a flat .1 -- the camera could not go below the hero, so there was no looking up at the tall walls, drakes or ceiling. It now tilts down to -.9: the camera sinks toward the hero (the floor keeps it above the ground) and looks up; the aim follows (84-aim.js already aims up by how far the view is tilted)
const CAM_PITCH_MIN=-.9;
const enemies=[], defs=[], projs=[], orbs=[], floats=[], loot=[];
let gear={weapon:null,armor:null,charm:null,amulet:null,familiar:null};
// ===== META SEAM: the tavern / bag / gold / xp / skills / familiar modules extend this object (see parts/modules) =====
const Meta={
  mult:k=>0,            // multiplicative bonus from skills for a key: 'dmg','hp','spd','move','tow','tcd','aoe','mana' (0.25 = +25%)
  onPickup:it=>false,   // return true when the module took the item (into the bag); false = old behaviour (auto equip / sell)
  onKill:e=>{}, onWaveHeld:w=>{}, onRunEnd:w=>false, onMapHeld:(w,o)=>{}, onDefFx:(d,fx)=>{},   // onMapHeld (build 160): the map's last wave held -- the module pays the run then and there, and onRunEnd (at MOVE ON) shows the tally without paying twice   // a defense's one-shot effect (the cage's implosion) for a module to relay (99-network.js sends it to the guests)   // onRunEnd: true when the module shows its own run-summary/tavern screen
  update:dt=>{}, hud:()=>{}, open:()=>{}, isOpen:()=>false,
  sharedHall:()=>false,   // co-op (build 159): true while this page hosts a hall with guests in it -- then the hall runs on under this page's menus (update() below), since it is theirs too (99-network.js)
  heroes:()=>[],   // co-op: other players' heroes an enemy should also be able to notice, each {x,y,z,isDead:()=>bool,hurt:dmg=>void} — empty outside a hosted session (99-network.js)
  defOwnerStat:(id,k)=>undefined, defOwnerMult:(id,k)=>undefined };   // co-op: a connected guest's own heroStat/heroMult value for a defense they placed — undefined (not 0/1) means "no such live guest", so stat()'s oStat/oMult fall back to the local hero's own numbers (99-network.js)
let spawnQ=[], placing=null, ghost=null, ghostRot=0, ghostCell=null, ghostPos=[0,0], ghostOk=false, ghostReason='', ghostYaw=0;
let placeStage=0, anchorPos=null, anchorYaw=0;   // 0: ghost follows your aim · 1: set down, rotating in place
let bannerT=0, toastT=0, dmgFlash=0, crystalShake=0, camShake=0, introA=0, locked=false, edgeX=.5, mouseDown=false, deathCut=null;
// build 182: the right-click charged special (73-specials.js) -- a seam like Meta's, not a real function, so a page
// with no such module (an old build, a test that never loads it) just gets a right-click that does nothing instead of erroring
let specialPress=()=>{}, specialRelease=()=>{};
const joy={x:0,y:0,id:null,ox:0,oy:0}; let lookId=null, lookX=0, lookY=0;

function angDiff(a,b){ let d=(b-a)%TAU; if(d>PI) d-=TAU; if(d<-PI) d+=TAU; return d; }
function angLerp(a,b,t){ return a+angDiff(a,b)*t; }
function easeOutBack(t){ const c=1.7; return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2); }
const RAILBOXES=[];   // thin collision boxes along edges where a real railing model stands (56-thronedecor.js pushes these, each with its own .top); empty on every other map, so this is a no-op there
// build 196 (Matt: "we need to talk about the hitboxes on defenses, i keep getting stuck in them"): every defense
// blocked the HERO across its whole grid cell (a full 2x2 unit square, defAt's own placement unit) no matter how much
// smaller the model actually looks -- the ballista's real base is a fraction of that, so a player caught an invisible
// wall well past the visible edge, worst at a corner where two cells meet. A mob's own collision (forHero=false) is
// untouched below -- pathing/detour logic already handles mobs its own way, and mobs are never the ones complaining
// about a wall they can't see. The bramble hedge (Matt: "we probably need to keep hedge box") is the one exception:
// it deliberately spans 5 cells to seal a whole corridor (86h build note: "a hedge closes a hall, not just a
// corridor"), so it keeps blocking that full length -- just narrower across it, the same shrink applied lengthwise.
const DEF_HERO_R=.62, DEF_HERO_HEDGE_LEN=2.2, DEF_HERO_HEDGE_HALF=.5;
function defBlocksHero(d,x,z){ const dx=x-d.x, dz=z-d.z;
  if(d.kind==='spike'){ const c=Math.cos(d.rot||0), s=Math.sin(d.rot||0); return Math.abs(dx*c-dz*s)<=DEF_HERO_HEDGE_LEN&&Math.abs(dx*s+dz*c)<=DEF_HERO_HEDGE_HALF; }
  return dx*dx+dz*dz<=DEF_HERO_R*DEF_HERO_R; }
function solidAt(x,z,y,forHero){ const cx=wc(x),cz=wcz(z); const t=gat(cx,cz); if(forHero?heroSolid(t):!(walk(t)||(y>=1e5&&t===T.WATER))) return true; /* a flyer (y far above) may cross the moat */ if(baseFloor(x,z)>y+.62) return true; /* a ledge taller than a step: no climbing it (a jumping hero clears what it can) */ if(forHero) for(let i=0;i<RAILBOXES.length;i++){ const b=RAILBOXES[i]; if(x>=b.x0&&x<=b.x1&&z>=b.z0&&z<=b.z1&&y<b.top-.25) return true; } /* hero only, and only below its guard height: a jump can clear the rail and land on it (floorAt), same "stand on top" rule as a short defense — a mob's pathing already avoids these edges via the height-diff check above, and a box that's fine for the hero's own width can still clip a mob's path along a narrow stair */ const d=inb(cx,cz)?defAt[idx(cx,cz)]:null; if(d){ if(NOWALK_DEF[d.kind]||y>d.top+.3) return false; if(forHero) return defBlocksHero(d,x,z)&&y<d.top-.25; return true; } return false; }
const ARC=[[1,0],[-1,0],[0,1],[0,-1],[.71,.71],[-.71,.71],[.71,-.71],[-.71,-.71]];
function moveCircle(e,dx,dz,r,forHero){ const y=e.fly?1e6:(e.y||0); let nx=e.x+dx, ok=true; for(const a of ARC){ if(solidAt(nx+a[0]*r,e.z+a[1]*r,y,forHero)){ ok=false; break; } } if(ok) e.x=nx;
  let nz=e.z+dz; ok=true; for(const a of ARC){ if(solidAt(e.x+a[0]*r,nz+a[1]*r,y,forHero)){ ok=false; break; } } if(ok) e.z=nz; }
function wallAt(x,z){ const t=gat(wc(x),wcz(z)); return t===T.WALL||t===T.PILLAR||t===T.CRYSTAL||t===T.PROP; }
// floor height at a point: raised floors, and stairs as two flat steps per cell (climbing them bobs a little, like stairs do)
function floorH(x,z){ const cx=wc(x),cz=wcz(z); if(!inb(cx,cz)) return 0; const i=idx(cx,cz), a=rampA[i]; if(!a) return hgt[i]; const fx=(x+OX)/CELL-cx, fz=(z+OZ)/CELL-cz; const t=a===1?1-fz:a===2?fz:a===3?fx:1-fx; return rampL[i]+(rampH[i]-rampL[i])*(t<.5?.5:1); }
function baseFloor(x,z){ return floorH(x,z); }   // the crystal's cells are level with the floor around them
function floorAt(x,z,y){ const cx=wc(x),cz=wcz(z); let f=baseFloor(x,z); const d=inb(cx,cz)?defAt[idx(cx,cz)]:null; if(d&&y>=d.top-.25) f=Math.max(f,d.top); for(let i=0;i<RAILBOXES.length;i++){ const b=RAILBOXES[i]; if(x>=b.x0&&x<=b.x1&&z>=b.z0&&z<=b.z1&&y>=b.top-.25) f=Math.max(f,b.top); } return f; }
function floatText(x,y,z,txt,col){ floats.push({x,y,z,txt,col:col||'#fff',t:0}); }
function banner(t,sub){ $('banner').innerHTML=t+'<small>'+(sub||'')+'</small>'; $('banner').style.opacity=1; bannerT=3.4; }
function toast(t){ $('toast').textContent=t; $('toast').style.opacity=1; toastT=2.2; }
function flashDmg(){ dmgFlash=1; }

// ================= HERO =================
function heroUpdate(dt){
  if(hero.dead>0){ hero.dead-=dt; if(hero.dead<=0){ hero.dead=0; hero.hp=hero.max; hero.x=0; hero.z=6; hero.y=0; hero.vy=0; H.g.visible=!useGLB; heroShadow.visible=true; if(GLBH){ GLBH.wrap.visible=useGLB; playHero('idle',{restart:true}); } toast('Back on your feet!'); } heroModelUpdate(dt); return; }
  let mx=0,mz=0; if(K.w) mz+=1; if(K.s) mz-=1; if(K.d) mx+=1; if(K.a) mx-=1; if(TOUCH){ mx+=joy.x; mz+=joy.y; }
  const len=Math.hypot(mx,mz); hero.moving=len>.05; hero.slow=len<.5;
  if(hero.moving){ mx/=Math.max(len,1); mz/=Math.max(len,1); const fx=Math.sin(cam.yaw), fz=Math.cos(cam.yaw), rx=-Math.cos(cam.yaw), rz=Math.sin(cam.yaw);
    const vx=fx*mz+rx*mx, vz=fz*mz+rz*mx; const mul=(K.shift?11:7.5)/7.5*(1+heroStat('move')/100)*heroMult('move'); hero.spdMul=mul; const spd=7.5*mul*(hero.aimSlow||1)*(hero.specialSlow||1); moveCircle(hero,vx*spd*dt,vz*spd*dt,.42,true);   /* build 182: specialSlow is its own multiplier (73-specials.js), separate from aim.js's aimSlow -- both are blanket-assigned every tick by their own Meta.update hook, so a shared slot would have one clobber the other */
    hero.yaw=angLerp(hero.yaw,Math.atan2(vx,vz),1-Math.exp(-12*dt)); hero.ph+=dt*10*mul; }
  const fl=floorAt(hero.x,hero.z,hero.y); hero.vy-=20*dt; hero.y+=hero.vy*dt; if(hero.y<=fl){ if(!hero.grounded&&hero.vy<-3) SFX.land(); hero.y=fl; hero.vy=0; hero.grounded=true; } else hero.grounded=false;
  const stp=Math.floor(hero.ph/PI); if(stp!==hero.lastStep){ hero.lastStep=stp; if(hero.moving&&hero.grounded) SFX.step(); }
  if(hero.swingT>=0){ const sd=swingDur(); hero.swingT+=dt; if(!hero.hitDone&&hero.swingT>sd*hitFrac()){ hero.hitDone=true; hitCone(); } if(hero.swingT>sd) hero.swingT=-1; }
  hero.hurtT-=dt; if(hero.hurtT<0&&hero.hp<hero.max) hero.hp=Math.min(hero.max,hero.hp+(1.5+heroStat('regen'))*dt);
  // animate
  const ph=hero.ph, walk=hero.moving?1:0; H.legL.rotation.x=Math.sin(ph)*.7*walk; H.legR.rotation.x=-Math.sin(ph)*.7*walk;
  if(hero.swingT>=0){ const p=hero.swingT/swingDur(); H.armR.rotation.x=p<.3?lerp(-.4,-2.6,p/.3):lerp(-2.6,.5,(p-.3)/.7); } else H.armR.rotation.x=lerp(-.35,-Math.sin(ph)*.5*walk,.5);
  H.armL.rotation.x=Math.sin(ph)*.4*walk-.25; H.capeG.rotation.x=-.15-walk*.45-Math.sin(ph*.5)*.08*walk-(hero.grounded?0:.5);
  H.g.position.set(hero.x,hero.y+Math.abs(Math.sin(ph))*.05*walk,hero.z); H.g.rotation.y=hero.yaw; H.head.rotation.x=Math.sin(ph*.5)*.04*walk;
  heroShadow.position.set(hero.x,baseFloor(hero.x,hero.z)+.04,hero.z); heroShadow.scale.setScalar(clamp(1-(hero.y-baseFloor(hero.x,hero.z))*.3,.4,1));
  heroModelUpdate(dt);
}
function jump(){ if(hero.grounded&&hero.dead<=0&&S.phase!=='start'){ hero.vy=10.6; hero.grounded=false; SFX.jump(); } }
function swing(){ if(hero.swingT>=0||hero.dead>0||S.phase==='start'||S.phase==='dead'||S.phase==='won'||S.phase==='deathcut') return; hero.swingT=0; hero.hitDone=false; SFX.swing(); if(!hero.moving) hero.yaw=cam.yaw;
  if(useGLB&&GLBH&&GLBH.actions.attack) playHero('attack',{restart:true,fade:.05,speed:GLBH.map.attack.duration/swingDur()}); }
function hitCone(){ const fx=Math.sin(hero.yaw), fz=Math.cos(hero.yaw); let n=0; for(const e of enemies){ if(e.dead) continue; const dx=e.x-hero.x, dz=e.z-hero.z, d=Math.hypot(dx,dz); if(d<(hero.reach||2.4)+e.r&&(dx*fx+dz*fz)/Math.max(d,.01)>.4){ hurt(e,heroDmg(),fx*1.4,fz*1.4); n++; } } if(n) SFX.hit(); }
function hurtHero(dmg){ if(hero.dead>0) return; dmg=Math.max(1,Math.round(dmg*(1-Math.min(75,heroStat('def'))/100))); hero.hp-=dmg; hero.hurtT=3; flashDmg(); SFX.hurt(); if(hero.hp<=0){ hero.hp=0; hero.dead=4; toast('You fell! Back in 4 seconds…'); H.g.visible=false; heroShadow.visible=false; } }
function hurtCrystal(dmg,killer,which){ if(S.phase==='dead'||S.phase==='won'||S.phase==='deathcut'||S.held) return;   /* build 160: nothing ends a victory lap but MOVE ON -- a crystal that has held its map can't fall on the lap */ if(which===2){ S.crystal2-=dmg; flashDmg(); SFX.crystal(); crystal2Shake=.4; if(S.crystal2<=0){ S.crystal2=0; startDeathCut(killer,2); } return; }   /* build 282: the second Heartroot; either one falling ends the run */
  S.crystal-=dmg; flashDmg(); SFX.crystal(); crystalShake=.4; if(S.crystal<=0){ S.crystal=0; startDeathCut(killer); } }
function finishDeath(){ S.phase='dead'; droneOff(); setMusic('none'); sting(); if(document.exitPointerLock) document.exitPointerLock(); document.body.classList.remove('play'); if(!Meta.onRunEnd(S.wave)){ $('deadwave').textContent=S.wave; $('dead').classList.remove('hide'); } deathCut=null; }
function startDeathCut(killer,which){ const k=(killer&&!killer.dead)?killer:null; deathCut={t:0,dur:2,killer:k,eye:null,eye2:null,look:null,hx:which===2?C2X:0,hz:which===2?C2Z:0}; if(k&&k.mdl&&k.mdl.glb&&k.mdl.actions&&k.mdl.actions.attack){ k.swing=0; mobPlay(k.mdl,'attack',{restart:true,fade:0,speed:.5}); } S.phase='deathcut'; }
function updateDeathCut(dt){ const c=deathCut; if(!c) return; c.t+=dt; const k=c.killer; if(k&&!k.dead&&k.mdl&&k.mdl.actions) mobAnim(k,dt);   /* only a rigged (GLB) killer has clips to drive; a mob still on its procedural body while its model is on the way (loading tiers, build 123) used to throw here and stall the death cut */
  const cy=crystalG.position.y+2.5, hx=c.hx||0, hz=c.hz||0; const kx=k?k.x:hx, kz=k?k.z:hz+2.5, ky=k?k.y+(k.h||1.6)*.55:cy;
  if(!c.eye){ const rx=kx-hx, rz=kz-hz, dl=Math.hypot(rx,rz)||1, nx=rx/dl, nz=rz/dl, px=-nz, pz=nx; c.eye=[hx+nx*1.7+px*3.3,Math.max(cy,ky)+.5,hz+nz*1.7+pz*3.3]; c.look=[hx+rx*.4,(cy+ky)/2,hz+rz*.4]; c.eye2=[lerp(c.eye[0],c.look[0],.3),lerp(c.eye[1],c.look[1],.15),lerp(c.eye[2],c.look[2],.3)]; }
  const p=Math.min(1,c.t/c.dur); camera.position.set(lerp(c.eye[0],c.eye2[0],p),lerp(c.eye[1],c.eye2[1],p),lerp(c.eye[2],c.eye2[2],p)); camera.lookAt(c.look[0],c.look[1],c.look[2]);
  crystalShake=.45; if(c.t>=c.dur) finishDeath(); }

// ================= GLB HERO (fetched from assets/, or drop any .glb on the page) =================
let GLBH=null, useGLB=false, heroYawOff=0, heroLoadError='';
const BUILD=360;
// the load timer (build 142: "I wish you could time how long it's taking to load map 2"). Every map is a fresh page load, so
// performance.now() counts from the moment the browser started on this URL. page: this script running (the 3 MB page itself
// down and parsed); first: the start screen's tier (hero, crystal, sword in hand); soon: what building and the first wave need;
// all: the moment nothing is left in flight once 'soon' is done (the rest streamed behind). bytes: what the model fetches
// transferred (base64 text as sent). Shown on the build line, and as a toast in the hall when everything has arrived.
const LOADT={page:Math.round(performance.now()),first:null,soon:null,all:null,bytes:0,files:0,inflight:0};
const fmtS=ms=>(ms/1000).toFixed(1)+' s', fmtMB=b=>(b/1048576).toFixed(b<10485760?1:0)+' MB';
function loadLine(){ const L=LOADT; if(L.all!==null) return '⏱ ready '+fmtS(L.first)+' · everything '+fmtS(L.all)+' · '+fmtMB(L.bytes); if(L.first!==null) return '⏱ ready '+fmtS(L.first)+' · still loading'; return ''; }
let HIDEOUT_SHOWN=false, RENDERS=0;   // 59-hideout.js raises HIDEOUT_SHOWN while its overlay covers the hall: the hall keeps simulating (a co-op host must) but stops drawing under it
const HIDEOUT_BUILD=/*HIDEOUT*/0;   // the embedded hideout page's own build number (its <meta name="hideout-build">), stamped in by assemble.mjs when the hideout rides along; 0 in a page without it
{ const sa=$('standalone'); if(sa&&/github\.io$|rootgate\.52bulls\.workers\.dev$/i.test(location.hostname)) sa.style.display='none'; }
{ const es=$('essentials'); if(es){ const deskHtml=es.innerHTML, touchHtml='<kbd>joystick</kbd> move &nbsp;·&nbsp; <kbd>drag</kbd> look &nbsp;·&nbsp; <kbd>⚔</kbd> swing &nbsp;·&nbsp; <kbd>tap a hotbar slot</kbd> to place a defense &nbsp;·&nbsp; <kbd>📯</kbd> sounds the horn &nbsp;·&nbsp; the tutorial teaches the rest'; const fit=()=>{ es.innerHTML=TOUCH?touchHtml:deskHtml; }; fit(); addEventListener('inputmode',fit); } }   // the one line a new player needs; the rest is folded below the buttons   // the link to the standalone build shows everywhere but on that build
const WASM_OK=(()=>{ try{ new WebAssembly.Module(new Uint8Array([0,97,115,109,1,0,0,0])); return true; }catch(e){ return false; } })();   /* does this host let a page compile WebAssembly? (a Content-Security-Policy without 'wasm-unsafe-eval' refuses it) -- shown on the build line so a playtest can say; the hideout's models are decoded at build time either way (unmeshopt.mjs) */ window.__wasm=WASM_OK;
let lastStatus='';
function heroStatus(msg){ if(msg!==undefined) lastStatus=msg; const el=$('buildline'); const ll=loadLine(); if(el) el.textContent='build '+BUILD+(HIDEOUT_BUILD?' · hideout build '+HIDEOUT_BUILD:'')+(WASM_OK?'':' · no wasm')+(ll?' · '+ll:'')+' · '+lastStatus; }
heroStatus('hero model: loading…');   // head.html's own text is a placeholder from an old build; the real number goes up before any model is asked for
const OLSKIN=new THREE.ShaderMaterial({side:THREE.BackSide,fog:true,skinning:true,
  uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{t:{value:0.028},col:{value:C(0x160c1e)}}]),
  vertexShader:'uniform float t;\n#include <common>\n#include <skinning_pars_vertex>\n#include <fog_pars_vertex>\nvoid main(){\n#include <beginnormal_vertex>\n#include <skinbase_vertex>\nvec3 transformed=position+normalize(objectNormal)*t;\n#include <skinning_vertex>\nvec4 mvPosition=modelViewMatrix*vec4(transformed,1.0); gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
  fragmentShader:'uniform vec3 col;\n#include <fog_pars_fragment>\nvoid main(){ gl_FragColor=vec4(col,1.0);\n#include <fog_fragment>\n}'});
// any material -> the hall's toon shading + ink outline (skinned meshes get a skinned outline; the outline offset uses the
// raw vertex normal, not the skinned one, because a rig with a unit-scale on its armature scales the skinned normal too)
function toonify(root,scale){ scale=scale||1; const meshes=[]; root.traverse(m=>{ if(m.isMesh&&!m.userData.isOL) meshes.push(m); });
  // ink outline: same on-screen thickness as the rest of the hall regardless of the model's units, and nudged
  // behind the surface so it can't poke through concave spots on a dense mesh
  const mkOL=base=>{ const o=base.clone(); o.uniforms.t.value=.02/scale; o.polygonOffset=true; o.polygonOffsetFactor=1.5; o.polygonOffsetUnits=1.5; return o; };
  const olSkin=mkOL(OLSKIN), olStatic=mkOL(OL);
  for(const m of meshes){ const mats=Array.isArray(m.material)?m.material:[m.material];
    const conv=mats.map(o=>{ const t=new THREE.MeshToonMaterial({color:o.color?o.color.clone():new THREE.Color(1,1,1),map:o.map||null,gradientMap:o.map?GRAD_SOFT:GRAD,vertexColors:!!o.vertexColors,skinning:!!m.isSkinnedMesh,side:o.side!==undefined?o.side:THREE.FrontSide,transparent:!!o.transparent,opacity:o.opacity!==undefined?o.opacity:1,alphaTest:o.alphaTest||0}); if(o.emissive){ t.emissive=o.emissive.clone(); t.emissiveIntensity=o.emissiveIntensity||1; } return t; });
    m.material=Array.isArray(m.material)?conv:conv[0]; m.frustumCulled=false;
    if(m.isSkinnedMesh){ const o=new THREE.SkinnedMesh(m.geometry,olSkin); o.userData.isOL=true; o.frustumCulled=false; o.bind(m.skeleton,m.bindMatrix); m.add(o); }
    else { const o=new THREE.Mesh(m.geometry,olStatic); o.userData.isOL=true; m.add(o); } } }
// scale any model to hero height, feet on the floor, centred on the hips
const HERO_H=2.6;
// bounds of a rigged model in its rest pose, computed the way the skinning shader does (a plain bounding box is wrong when the rig carries a scale)
function skinnedBounds(root){ root.updateMatrixWorld(true); const box=new THREE.Box3(); let any=false; const v=new THREE.Vector3(), acc=new THREE.Vector3(), t=new THREE.Vector3(), m4=new THREE.Matrix4();
  root.traverse(o=>{ if(!o.isMesh||o.userData.isOL) return; if(!o.isSkinnedMesh){ box.union(new THREE.Box3().setFromObject(o)); any=true; return; }
    const g=o.geometry, pos=g.attributes.position, si=g.attributes.skinIndex, sw=g.attributes.skinWeight; if(!si||!sw){ box.union(new THREE.Box3().setFromObject(o)); any=true; return; }
    o.skeleton.update(); const bm=o.skeleton.boneMatrices;
    for(let i=0;i<pos.count;i++){ v.fromBufferAttribute(pos,i).applyMatrix4(o.bindMatrix); acc.set(0,0,0); const idx=[si.getX(i),si.getY(i),si.getZ(i),si.getW(i)], w=[sw.getX(i),sw.getY(i),sw.getZ(i),sw.getW(i)];
      for(let k=0;k<4;k++){ if(!w[k]) continue; m4.fromArray(bm,idx[k]*16); t.copy(v).applyMatrix4(m4); acc.addScaledVector(t,w[k]); }
      acc.applyMatrix4(o.bindMatrixInverse).applyMatrix4(o.matrixWorld); box.expandByPoint(acc); any=true; } });
  return any?box:null; }
function fitHero(root){ return fitModel(root,HERO_H); }
function fitModel(root,targetH){ root.updateMatrixWorld(true); const box=skinnedBounds(root)||new THREE.Box3().setFromObject(root); const size=box.getSize(new THREE.Vector3()); const sc=targetH/Math.max(size.y,1e-6);
  const hips=root.getObjectByName('Hips')||root.getObjectByName('mixamorigHips')||root.getObjectByName('hips'); let cx=(box.min.x+box.max.x)/2, cz=(box.min.z+box.max.z)/2; if(hips){ const v=new THREE.Vector3(); hips.getWorldPosition(v); cx=v.x; cz=v.z; }
  const inner=new THREE.Group(); inner.add(root); inner.scale.setScalar(sc); inner.position.set(-cx*sc,-box.min.y*sc,-cz*sc); const wrap=new THREE.Group(); wrap.add(inner); return {wrap,scale:sc,height:size.y}; }
const CLIPMAP={idle:/idle|breath|stand/i,walk:/walk/i,run:/run|sprint|jog/i,attack:/attack|slash|swing|punch|strike|melee|hit/i,jump:/jump|leap/i,death:/death|die|dead|defeat/i,shout:/shout|roar|taunt|skill/i};
function mapClips(clips){ const m={}; for(const k in CLIPMAP){ const c=clips.find(c=>CLIPMAP[k].test(c.name)); if(c) m[k]=c; } if(!m.walk&&m.run) m.walk=m.run; if(!m.run&&m.walk) m.run=m.walk; if(!m.idle&&clips.length) m.idle=clips[0]; return m; }
function setHeroGLB(gltf,label,quiet){ const root=gltf.scene||gltf.scenes[0]; if(!root) throw new Error('no scene'); const fit=fitHero(root); toonify(root,fit.scale);
  const mixer=new THREE.AnimationMixer(root); const map=mapClips(gltf.animations||[]); const actions={};
  for(const k in map){ const a=mixer.clipAction(map[k]); if(k==='attack'||k==='jump'||k==='death'){ a.setLoop(THREE.LoopOnce,1); a.clampWhenFinished=true; } actions[k]=a; }
  let attackDur=0, hitF=0;
  if(map.attack){ const c=map.attack; attackDur=Math.min(.75,Math.max(.38,c.duration*.7)); let best=0, bt=0;
    for(const t of c.tracks){ if(!/(Hand|Arm|arm|hand).*\.quaternion$/.test(t.name)) continue; const v=t.values, tm=t.times;
      for(let i=1;i<tm.length;i++){ const d=Math.abs(v[(i-1)*4]*v[i*4]+v[(i-1)*4+1]*v[i*4+1]+v[(i-1)*4+2]*v[i*4+2]+v[(i-1)*4+3]*v[i*4+3]); const ang=2*Math.acos(Math.min(1,d)); const sp=ang/Math.max(1e-4,tm[i]-tm[i-1]); if(sp>best){ best=sp; bt=tm[i]; } } }
    if(best>0) hitF=Math.min(.65,Math.max(.25,bt/c.duration)); }
  if(GLBH){ scene.remove(GLBH.wrap); GLBH.mixer.stopAllAction(); GLBH.root.traverse(o=>{ if(!o.isMesh) return; if(!o.userData.isOL&&o.geometry) o.geometry.dispose(); const mats=Array.isArray(o.material)?o.material:[o.material]; mats.forEach(m=>{ if(m&&m.map&&!o.userData.isOL) m.map.dispose(); if(m) m.dispose(); }); }); }   // the replaced model (an earlier hero, or an earlier drop) frees its GPU memory
  GLBH={wrap:fit.wrap,root,mixer,actions,map,cur:null,label,scale:fit.scale,height:fit.height,attackDur,hitFrac:hitF}; scene.add(fit.wrap); useGLB=true; H.g.visible=false; heroYawOff=0;
  if(actions.idle) playHero('idle',{fade:0}); if(!quiet) toast('Hero model: '+label+' · clips: '+(Object.keys(map).join(', ')||'none')); }
function playHero(name,o){ if(!GLBH) return; const a=GLBH.actions[name]; if(!a) return; o=o||{}; if(GLBH.cur===a&&!o.restart) return; const prev=GLBH.cur; GLBH.cur=a; a.reset(); a.timeScale=o.speed||1; a.setEffectiveWeight(1); if(prev&&prev!==a){ if(o.fade) a.crossFadeFrom(prev,o.fade,false); else prev.stop(); } a.play(); }
function heroModelUpdate(dt){ if(!GLBH) return; if(!useGLB){ GLBH.wrap.visible=false; return; } const dead=hero.dead>0;
  let st; if(dead) st='death'; else if(hero.swingT>=0) st='attack'; else if(!hero.grounded) st='jump'; else if(hero.moving) st=(hero.slow||!GLBH.actions.run)?'walk':'run'; else st='idle';
  if(st==='run') GLBH.actions.run.timeScale=1.25*(hero.spdMul||1); else if(st==='walk'&&GLBH.actions.walk) GLBH.actions.walk.timeScale=(hero.spdMul||1);
  if(st==='attack'){ if(!GLBH.actions.attack) playHero(hero.moving?'walk':'idle',{fade:.1}); }
  else if(st==='death'){ if(GLBH.actions.death){ if(GLBH.cur!==GLBH.actions.death) playHero('death',{restart:true,fade:.08}); } else playHero('idle',{fade:.1}); }
  else playHero(st,{fade:.15});
  GLBH.mixer.update(dt); GLBH.wrap.position.set(hero.x,hero.y,hero.z); GLBH.wrap.rotation.y=hero.yaw+heroYawOff; GLBH.wrap.visible=!dead||(4-hero.dead)<Math.max(1.4,(GLBH.actions.death?GLBH.actions.death.getClip().duration:0)+.4); }   // build 220: the body stays through the hero's own death clip, then a beat on the ground (hurtHero's timer is 4 s; the Ranger's Meshy fall is 3.5 s, the made-up ones fit the old 1.4)
function loadHeroGLB(buf,label,quiet){ if(!THREE.GLTFLoader){ heroLoadError='model loader missing'; heroStatus('hero model: loader missing — old gnome in use'); toast('Model loader missing'); return; }
  const bad=err=>{ const why=(err&&err.message)?String(err.message).slice(0,80):'unreadable file'; heroLoadError=why; heroStatus('hero model failed ('+why+') — old gnome in use'); toast('Not a valid GLB file ('+why+')'); };
  try{ new THREE.GLTFLoader().parse(buf,'',g=>{ try{ setHeroGLB(g,label,quiet); heroLoadError=''; heroStatus('hero: '+label+' · '+Object.keys(GLBH.map).length+' clips'); }catch(err){ heroLoadError=err.message; heroStatus('hero model failed ('+err.message+') — old gnome in use'); toast('That model could not be used: '+err.message); } },bad); }catch(err){ bad(err); } }
function toggleHero(){ if(!GLBH){ toast('No GLB hero loaded — drop a .glb on the page'); return; } useGLB=!useGLB; H.g.visible=!useGLB; GLBH.wrap.visible=useGLB; toast(useGLB?'Hero: '+GLBH.label:'Hero: original primitives'); }
addEventListener('dragover',e=>{ e.preventDefault(); });
addEventListener('drop',e=>{ e.preventDefault(); const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0]; if(!f) return; if(!/\.(glb|gltf)$/i.test(f.name)){ toast('Drop a .glb file to play as that character'); return; } f.arrayBuffer().then(buf=>loadHeroGLB(buf,f.name)).catch(()=>toast('Could not read that file')); });
// assets next to the page: the host serves only a fixed set of file types, so binary models travel as base64 .txt.
// HAS_ASSETS is stamped by the assembler: true for the folder build (index.html + assets/), false for the single file,
// where every asset fetch simply never resolves and the baked-in models / procedural music stay in use.
const HAS_ASSETS=/*ASSETS*/false;
// build 307: on Cloudflare (rootgate.52bulls.workers.dev) models ship as plain .glb (assemble.mjs RAWGLB=1 flips ASSET_TXT): the base64 .glb.txt form was a third bigger and only the old artifact host needed it
const ASSET_TXT=/*TXT*/true;
const ASSET_STAMPS=/*STAMPS*/{};   // per-file content stamps, filled in by the assembler for the folder build: a changed model gets a new URL, so no browser keeps serving the old one
const ASSET=n=>ASSET_STAMPS[n]&&/\.glb$/.test(n)?'assets/'+n.replace(/\.glb$/,'')+'.'+ASSET_STAMPS[n]+'.glb'+(ASSET_TXT?'.txt':''):'assets/'+n+(/\.glb$/.test(n)&&ASSET_TXT?'.txt':'');   // a model's file name carries its content stamp (witch.1a2b3c4d.glb.txt): a re-export is a new file, and no cache anywhere can hand out the old one
function fetchRetry(url,tries){ return fetch(url).then(r=>{ if(!r.ok&&tries>1&&r.status!==404) throw new Error('HTTP '+r.status); return r; }).catch(e=>{ if(tries<=1) throw e; return new Promise(res=>setTimeout(res,600*(4-tries))).then(()=>fetchRetry(url,tries-1)); }); }   // three goes at each file, a beat apart: one dropped fetch must not cost the hero model
// Load order matters more than load size: some sixty models (~80MB of base64) are requested the moment the page runs,
// and a browser only keeps ~6 connections open per host, so whatever is asked for last waits for everything before it.
// The hero used to be near the end of that queue -- 'build 21 · hero model: loading…' for minutes on a phone while
// cannons and armor stands nobody could see yet came down first, and the sword in the hero's hand arrived after wave
// one. Loads now run in three tiers, each waiting for the one before it to land (or a timeout, so one hung fetch can
// never hold the hall hostage): 'first' is what the start screen shows (the hero, the crystal, the sword in hand);
// 'soon' is what getting in and placing needs (mark-I defenses and their shots, the wave-one goblin, the raven, the
// portal, a map's own decor, a co-op friend's hero); everything else is 'later' and streams behind while the player
// is already building. Upgrade marks, familiars and the tavern's armor stands aren't loaded at all until something
// first asks for them (see their own modules). Total bytes at rest are unchanged; what changes is when they matter.
const loadTiers={first:[],soon:[]}; const tierGates={};
function tierDone(t){ if(!tierGates[t]) tierGates[t]=new Promise(res=>{ setTimeout(()=>{ (t==='soon'?tierDone('first'):Promise.resolve()).then(()=>Promise.allSettled(loadTiers[t])).then(res); setTimeout(res,t==='first'?15000:40000); },0); }); return tierGates[t]; }   // the snapshot waits one tick so every module's own top-level fetches have been registered first
let loadAllT=null;
function loadCheck(){ const L=LOADT; if(L.soon===null||L.all!==null||L.inflight>0) return; clearTimeout(loadAllT); loadAllT=setTimeout(()=>{ if(L.inflight>0||L.all!==null) return; L.all=Math.round(performance.now()); heroStatus(); if(S.phase!=='start') toast('⏱ Map loaded: ready in '+fmtS(L.first)+', everything in '+fmtS(L.all)+' · '+fmtMB(L.bytes)); },400); }   // a quiet 0.4 s with nothing in flight after the 'soon' tier: the rest has streamed in
setTimeout(()=>{ tierDone('first').then(()=>{ LOADT.first=Math.round(performance.now()); heroStatus(); }); tierDone('soon').then(()=>{ LOADT.soon=Math.round(performance.now()); heroStatus(); loadCheck(); }); },0);
const LOADQ={asked:new Set(),got:new Set()};   // build 277: every file asked for (whatever its tier, even one still waiting its turn) and every one landed or failed -- the loading screen's percentage (11b-loadscreen.js)
function fetchBytes(url,prio){ if(!HAS_ASSETS) return new Promise(()=>{}); LOADQ.asked.add(url); const q=p=>{ p.then(()=>LOADQ.got.add(url),()=>LOADQ.got.add(url)); return p; }; if(prio==='first'){ const p=fetchBytesNow(url); loadTiers.first.push(p.catch(()=>{})); return q(p); } if(prio==='soon'){ const p=tierDone('first').then(()=>fetchBytesNow(url)); loadTiers.soon.push(p.catch(()=>{})); return q(p); } return q(tierDone('soon').then(()=>fetchBytesNow(url))); }
// one download per file at a time: a second ask for a URL that is still coming down gets the same promise (the same bytes,
// counted once in LOADT) instead of a second copy over the wire -- the throne room used to pull its 10 MB door four times at
// once. Only while in flight: the entry goes when it lands, so nothing here keeps a model's bytes once its callers are done.
// Sharing one ArrayBuffer is safe: every caller hands it to GLTFLoader.parse, which only reads it (the binary chunk is sliced off).
// But a download can hang (a dropped connection answers nothing, and fetch has no timeout): before sharing, a second ask made
// its own request and got the file; joined to a hung one it would wait with it forever -- pick the troll, it stalls, pick the
// knight and the troll again, and the troll never comes. So sharing has a limit: a download someone else joined that still
// hasn't landed 40 s after it started (the 'soon' tier's own give-up time) is let go, and one fresh download starts for
// everyone waiting on it, whichever lands first wins. A download nobody joined is left alone however slow it is (a big file
// on a slow line is not a hang, and a second copy would only slow it further). Past 40 s no download is offered for sharing,
// so an ask after that fetches afresh, as every ask did before sharing. Never more bytes than before sharing: one extra
// download at most, and only where a joiner used to make its own.
const INFLIGHT=new Map(), SHARE_MS=40000;
function fetchBytesNow(url){ const had=INFLIGHT.get(url); if(had){ had.joins++; return had.p; } LOADT.inflight++; LOADT.files++;
  const raw=fetchBytesRaw(url), e={joins:0}; let tm; const done=()=>{ clearTimeout(tm); if(INFLIGHT.get(url)===e) INFLIGHT.delete(url); LOADT.inflight--; loadCheck(); };
  const stale=new Promise(res=>{ tm=setTimeout(res,SHARE_MS); }).then(()=>{ if(INFLIGHT.get(url)===e) INFLIGHT.delete(url); return e.joins?fetchBytesNow(url):new Promise(()=>{}); });   // only fires while raw is still out (done clears it)
  e.p=Promise.race([raw,stale]); INFLIGHT.set(url,e); raw.then(done,done); return e.p; }
window.__fetchlayer={now:fetchBytesNow,asset:ASSET,inflight:()=>[...INFLIGHT.keys()],shareMs:SHARE_MS};   // test hook (throneload-test.mjs): the shared in-flight download, checked directly
function fetchBytesRaw(url){ const plain=url.replace(/\.[0-9a-f]{8}\.glb(\.txt)?$/,'.glb$1'); return fetchRetry(url,3).then(r=>r.ok||plain===url?r:fetchRetry(plain,2)).catch(()=>fetchRetry(plain,2)).then(r=>{   /* the unstamped file is kept alongside as a fallback */ if(!r.ok) throw new Error('HTTP '+r.status+' '+url); if(!/\.txt(\?|$)/.test(url)) return r.arrayBuffer().then(ab=>{ LOADT.bytes+=ab.byteLength; return ab; }); return r.text().then(t=>{ LOADT.bytes+=t.length; const b=atob(t.replace(/\s+/g,'')); const u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u.buffer; }); }); }
// the hero model itself is fetched by installHero() (70-hero2.js, runs right after this) — H.g (the plain
// primitive hero) covers the moment before that fetch resolves, same as it always covers a hero switch mid-game.
// A second, separate fetch here used to race it for a "faster" placeholder (an embedded, synchronous blob in the
// old build); once both became async fetches of comparable speed, whichever's own GLTFLoader.parse() callback
// happened to land second would silently clobber the other's already-loaded hero. Not worth the race.

// ================= GLB MOBS =================
// three's SkeletonUtils.clone, inlined: a rigged model cloned so each copy animates on its own skeleton
function cloneSkinned(source){ const sl=new Map(), cl=new Map(); const clone=source.clone(); (function walk(a,b){ sl.set(b,a); cl.set(a,b); for(let i=0;i<a.children.length;i++) walk(a.children[i],b.children[i]); })(source,clone);
  clone.traverse(n=>{ if(!n.isSkinnedMesh) return; const src=sl.get(n); n.skeleton=src.skeleton.clone(); n.bindMatrix.copy(src.bindMatrix); n.skeleton.bones=src.skeleton.bones.map(b=>cl.get(b)); n.bind(n.skeleton,n.bindMatrix); }); return clone; }
// per kind: model height to fit to, hit box, and the walk/run speeds (in body heights per second) the clips were made for
const MOBDIM={goblin:{fit:1.55,h:1.4,r:.42,nat:{walk:1.0,run:2.4}}, orc:{fit:2.45,h:2.1,r:.65,nat:{walk:1.0,run:2.2}}, ogre:{fit:3.5,h:3.3,r:1.05,nat:{walk:.9,run:2.0}}, archer:{fit:1.85,h:1.7,r:.42,nat:{walk:1.0,run:2.2}}, drake:{fit:2.4,h:1.6,r:.7,nat:{walk:1,run:1}}, troll:{fit:2.6,h:2.3,r:.62,nat:{walk:1.0,run:2.2}}, trollboss:{fit:3.1,h:2.9,r:.85,nat:{walk:1.0,run:2.2}}};
SFX.roar=()=>{ noise(.5,.12,300); beep(60,1.0,'sawtooth',.1,-25); };
SFX.setBong=()=>{ beep(392,1.1,'sine',.16,-60); setTimeout(()=>beep(784,.7,'sine',.05,-40),40); };   // a set piece landing: one low bell strike, a soft overtone just after
const MOBGLB={};   // kind -> {wrap,map,scale}
function loadMobGLB(kind,b64){ try{ const u=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)); new THREE.GLTFLoader().parse(u.buffer,'',gltf=>{ try{ const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,MOBDIM[kind].fit); toonify(root,fit.scale); MOBGLB[kind]={wrap:fit.wrap,map:mapClips(gltf.animations||[]),scale:fit.scale}; }catch(e){ console.warn('mob model '+kind,e); } },e=>console.warn('mob model '+kind,e)); }catch(e){ console.warn('mob model '+kind,e); } }
function makeMobGLB(kind){ const T=MOBGLB[kind], dim=MOBDIM[kind]; const g=cloneSkinned(T.wrap); const mixer=new THREE.AnimationMixer(g); const actions={};
  for(const k in T.map){ const a=mixer.clipAction(T.map[k]); if(k==='attack'||k==='death'||k==='shout'){ a.setLoop(THREE.LoopOnce,1); a.clampWhenFinished=true; } actions[k]=a; }
  g.add(blob(dim.r*1.1)); const parts={}; for(const k of ['wingL','wingR','tail']){ const o=g.getObjectByName(k); if(o) parts[k]=o; }   // a procedurally rigged model (the drake) carries hinged parts by name
  return {g,glb:true,mixer,actions,cur:null,h:dim.h,r:dim.r,legs:[],arms:[],head:null,parts}; }
function makeMob(kind){ return MOBGLB[kind]?makeMobGLB(kind):makeGoblin(kind); }
function mobPlay(m,name,o){ const a=m.actions[name]; if(!a) return; o=o||{}; if(m.cur===a&&!o.restart) return; const prev=m.cur; m.cur=a; a.reset(); a.timeScale=o.speed||1; a.setEffectiveWeight(1); if(prev&&prev!==a){ if(o.fade) a.crossFadeFrom(prev,o.fade,false); else prev.stop(); } a.play(); }
const SHOUT_SPEED=.6;   // the war cry plays slowed so it reads as a roar, not a twitch
function ogreRoar(e,n){ e.roar=n; e.shoutT=e.mdl.actions.shout.getClip().duration/SHOUT_SPEED; SFX.roar(); camShake=.7;
  if(n===2){ e.dmg=Math.round(e.dmg*1.1); e.enraged=true; const g=glow(0xff3020,2.6/e.sc,.6); g.position.y=e.h*.55/e.sc; e.mdl.g.add(g); floatText(e.x,e.y+e.h+.6,e.z,'ENRAGED!','#ff5a3a'); }   // half health: a little harder, burning red (build 294, Matt: "we dont need any mobs to speed up anywhere, its just volume and volume boluses" -- was also 30% faster; no mob speeds up by wave either, spawnEnemy)
  else floatText(e.x,e.y+e.h+.6,e.z,'RAAAGH!','#ff9a5a'); }
function mobAnim(e,dt){ const m=e.mdl, A=m.actions; let st; if(e.dead) st='death'; else if(e.shoutT>0&&A.shout) st='shout'; else if(e.swing>=0&&A.attack) st='attack'; else if(e.walking) st='walk'; else st='idle';
  if(st==='shout'){ if(m.cur!==A.shout) mobPlay(m,'shout',{restart:true,fade:.1,speed:SHOUT_SPEED}); }
  else if(st==='attack'){ if(m.cur!==A.attack) mobPlay(m,'attack',{restart:true,fade:.06,speed:A.attack.getClip().duration/((MOBS[e.kind]&&MOBS[e.kind].swingT)||.45)}); }   // build 288: a mob with its own swingT plays its whole attack clip over it
  else if(st==='death'){ if(A.death){ if(m.cur!==A.death) mobPlay(m,'death',{restart:true,fade:.08}); } else mobPlay(m,'idle',{fade:.1}); }
  else if(st==='walk'){ const nat=MOBDIM[e.kind].nat, hs=mobSpd(e)/e.h; const useRun=A.run&&A.run!==A.walk&&Math.abs(hs-nat.run)<Math.abs(hs-nat.walk); const k=useRun?'run':(A.walk?'walk':'run'); if(A[k]){ A[k].timeScale=Math.max(.7,hs/(useRun?nat.run:nat.walk)); mobPlay(m,k,{fade:.15}); } }
  else mobPlay(m,'idle',{fade:.2});
  m.mixer.update(dt); }
function fetchMobGLB(kind,url,prio){ fetchBytes(url,prio).then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{ const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,MOBDIM[kind].fit); toonify(root,fit.scale); MOBGLB[kind]={wrap:fit.wrap,map:mapClips(gltf.animations||[]),scale:fit.scale}; }catch(e){ console.warn('mob model '+kind,e); } },e=>console.warn('mob model '+kind,e))).catch(e=>console.warn('mob model '+kind+' ('+url+')',e)); }
if(typeof GOBLIN_GLB_B64!=='undefined') loadMobGLB('goblin',GOBLIN_GLB_B64); else fetchMobGLB('goblin',ASSET('goblin.glb'),'soon');   // wave one's mob: needed before the horn, not before the hero
fetchMobGLB('orc',ASSET('orc.glb')); fetchMobGLB('ogre',ASSET('ogre.glb')); fetchMobGLB('archer',ASSET('bandit.glb')); fetchMobGLB('troll',ASSET('trollmob.glb')); fetchMobGLB('trollboss',ASSET('trollboss.glb'));   // mobs with a model in assets/ use it; in the single-file build these never resolve and the block figures stay

// ================= CAMERA =================
function updateCamera(dt){
  if(S.phase==='start'){ introA+=dt*.1; camera.position.set(Math.sin(introA)*15,6.5,Math.cos(introA)*15); camera.lookAt(0,2.6,0); return; }
  let tx=hero.x, ty=hero.y+1.5, tz=hero.z;
  if(cam.shoulder>.01){ const rx=-Math.cos(cam.yaw), rz=Math.sin(cam.yaw); let o=cam.shoulder*1.1; for(;o>.05;o*=.5){ const g=gat(wc(hero.x+rx*o),wcz(hero.z+rz*o)); if(!(g===T.WALL||g===T.PILLAR||g===T.PROP)) break; } if(o>.05){ tx+=rx*o; tz+=rz*o; } }   // over the right shoulder (a ranged hero), so the hero doesn't stand over what they aim at; less when a wall is at that shoulder
  const cp=Math.cos(cam.pitch), fx=Math.sin(cam.yaw)*cp, fz=Math.cos(cam.yaw)*cp, fy=Math.sin(cam.pitch);
  let d=cam.dist; for(let s=.5;s<cam.dist;s+=.25){ const px=tx-fx*s, py=ty+fy*s, pz=tz-fz*s; if(!OUT&&py>WALLH-.35){ d=s-.3; break; } /* under a roof the camera stays below it; outdoors it may rise over the walls */ if(py<floorH(px,pz)+.5){ d=s-.4; break; } const g=gat(wc(px),wcz(pz)); if(g===T.WALL||g===T.PILLAR||g===T.PROP){ d=s-.5; break; } }
  d=Math.max(d,1.0); cam.d=dt>0?(d<cam.d?d:lerp(cam.d,d,1-Math.exp(-6*dt))):d;
  const dx=tx-fx*cam.d, dy=ty+fy*cam.d, dz=tz-fz*cam.d; const k=dt>0?1-Math.exp(-16*dt):1;
  cam.x=lerp(cam.x,dx,k); cam.y=lerp(cam.y,dy,k); cam.z=lerp(cam.z,dz,k);
  const sh=camShake>0?camShake*.35:0; camShake=Math.max(0,camShake-dt); camera.position.set(cam.x+(rnd()-.5)*sh,Math.max(cam.y,.4)+(rnd()-.5)*sh,cam.z+(rnd()-.5)*sh); let lx=tx, ly=ty, lz=tz; const eu=Math.max(0,.1-cam.pitch)*.55; if(eu>0){ const vx=tx-camera.position.x, vy=ty-camera.position.y, vz=tz-camera.position.z, hl=Math.hypot(vx,vz)||1, an=Math.atan2(vy,hl)+eu, rr=10; lx=camera.position.x+vx/hl*Math.cos(an)*rr; ly=camera.position.y+Math.sin(an)*rr; lz=camera.position.z+vz/hl*Math.cos(an)*rr; }   /* build 345 (Matt: look up): tilted below the old flat stop, the view aims ABOVE the hero by .55 rad per rad of tilt -- at the lowest tilt the hero is off the bottom of the screen and you see the walls, the ceiling and what flies over */
  camera.lookAt(lx+(rnd()-.5)*sh,ly+(rnd()-.5)*sh,lz+(rnd()-.5)*sh);
}

// ================= ENEMIES =================
function spawnEnemy(kind,lane){ const L=LANES[lane]||LANES.N; const m=makeMob(kind); const cfg=MOBS[kind]; const w=Math.max(0,statWave()-1); const hpm=(1+.22*w)*(1+.08*gearScore()/100); /* waves get harder by wave, not by what you wear — good gear should feel good */ const dmm=(1+.01*w)*(S.wave===1?.65:1);   /* build 294 (Matt: "they can do more damage but very little"): +1% a campaign wave, was +8% (map 3 hit more than twice as hard as map 1) */   // a map's own wave 1 hits 35% softer — the count and HP still scale off the campaign-wide wave (wbase carries a later map in hard), just not the damage on the wave you're still getting your bearings on
  const inX=Math.sin(L.face||0), inZ=Math.cos(L.face||0), jit=R(-.5,.5), step=m.r+.35;   /* build 180 (Matt: monsters keep getting stuck "right at one of the spawn points"): the Throne Room's side gates are one cell deep against the outer wall, and a big mob jittered toward the wall spawned half inside it and never moved -- now it appears a body's width in from the gate along the way it faces, jittered only sideways */
  const e={kind,x:cw(L.cx)+inX*step+inZ*jit,y:0,z:cwz(L.cz)+inZ*step-inX*jit,hp:Math.round(cfg.hp*hpm),max:Math.round(cfg.hp*hpm),spd:cfg.spd*R(.9,1.1),dmg:Math.round(cfg.dmg*dmm),cd:cfg.cd,atk:R(0,.5),r:m.r,h:m.h,mdl:m,sc:m.g.scale.x,ph:rnd()*6,yaw:L.face,dead:0,mana:cfg.mana,ranged:cfg.ranged||0,pop:0,squash:0,swing:-1,walking:false,sx:0,sz:0,shoutT:0,fly:cfg.fly||0}; if(e.fly) e.y=e.fly;
  e.roar=(m.glb&&m.actions.shout)?0:-1;   // a mini-boss roars when it first comes into view (and again, enraged, at half health) — see ogreRoar
  m.g.position.set(e.x,0,e.z); m.g.rotation.y=e.yaw; scene.add(m.g); enemies.push(e); const p=portals.find(p=>p.k===lane); if(p) p.pulse=1; return e; }
function hurt(e,dmg,kx,kz){ if(e.dead) return; e.hp-=dmg; e.squash=1; floatText(e.x,e.y+e.h+.4,e.z,String(dmg),'#ffd060'); if(kx||kz) moveCircle(e,kx*.5,kz*.5,e.r*.8,false); if(e.hp<=0) kill(e); }
function kill(e){ e.dead=.001; S.kills++; spawnOrbs(e.x,e.z,e.mana); rollDrop(e); Meta.onKill(e); if(e.kind==='ogre'||e.kind==='orc'||e.kind==='drake'||e.kind==='troll'||e.kind==='trollboss') SFX.bigDie(); else SFX.die(); }
function attack(e,tg){ e.swing=0; e.pending=tg; }
function landHit(e,tg){
  if(tg.kind==='mob'){ if(window.__madHit) window.__madHit(e,tg); return; }   /* build 358: a blow one mob lands on another, maddened by the mist */
  if(tg.kind==='hero'){ if(tg.ranged){ const H=tg.hero.hurt===hurtHero?hero:tg.hero; fireArrow(e,H.x,(H.y||0)+1,H.z,{kind:'hero'}); } else if(!tg.hero.isDead()){ const H=tg.hero.hurt===hurtHero?hero:tg.hero; if(Math.hypot(H.x-e.x,H.z-e.z)<=(tg.reach||e.r+1.3)+.8) tg.hero.hurt(e.dmg); } }   /* build 289: a blow lands only on a hero still within reach when it lands -- a real wind-up can be dodged */
  else if(tg.kind==='crystal'){ if(tg.ranged) fireArrow(e,tg.x||0,2.6,tg.z||0,{kind:'crystal',which:tg.which}); else hurtCrystal(e.dmg,e,tg.which); }
  else if(tg.kind==='def'){ const d=tg.obj; if(!defs.includes(d)) return; if(tg.ranged) fireArrow(e,d.x,1.0,d.z,{kind:'def',obj:d}); else { hurtDef(d,e.dmg); if(d.kind==='spike'&&!e.dead){ hurt(e,thornsBack(d,e.dmg),0,0); thornSpark(e); } } } }
// the hedge's thorns (build 163, Matt: "I want the bramble barrier tower to return damage, like thorn damage"): each melee hit it takes
// comes back as half the blow plus DEFS.spike.thorns, +25% a mark, scaled by the owner's defense-damage gear -- it used to be a flat 2
// whoever swung, so an ogre's 20 cost the ogre 2. Now a goblin's 3 costs it 4, an orc's 8 costs it 6-7, an ogre's 20 costs it 12
function thornsBack(d,hit){ return Math.max(1,Math.round((DEFS.spike.thorns+hit*.5)*(1+.25*((d.lvl||1)-1))*(1+oStat(d,'tow')/100))); }
function thornSpark(e){ const fx=glow(0x8fd65a,1.1,.85); fx.position.set(e.x+R(-.2,.2),e.y+e.h*.55,e.z+R(-.2,.2)); scene.add(fx); projs.push({kind:'spark',t:0,mesh:fx}); }
// co-op: which hero (the local one, or another player's, via Meta.heroes()) is nearest and close enough for e to
// notice at all — same melee-proximity check the local hero always had, just no longer hardcoded to just it
function nearestHero(e,extra){
  let best=null, bd=e.r+1.1;
  if(hero.dead<=0){ const hd=Math.hypot(hero.x-e.x,hero.z-e.z); if(hd<bd&&hero.y-e.y<1.4){ best={x:hero.x,y:hero.y,z:hero.z,isDead:()=>hero.dead>0,hurt:hurtHero}; bd=hd; } }
  for(const h of extra){ if(h.isDead()) continue; const hd=Math.hypot(h.x-e.x,h.z-e.z); if(hd<bd&&h.y-e.y<1.4){ best=h; bd=hd; } }
  return best;
}
const BALLISTA_UP=1.22;   // build 164 (Matt: "I want the ballistas to be a little bigger"): the ballista stands 22% taller (50-defmodels.js DEF_H), and its bolt leaves from the raised bow
const DEF_HITS_BACK={harpoon:1,acorn:1,ball:1,frost:1,zap:1,venom:1,ember:1,dazzle:1};   // towers that can hit a mob on foot (build 161: a ranged mob shooting one of these must stand inside its reach)
function updateEnemies(dt){
  const alive=enemies.filter(e=>!e.dead);
  for(const a of alive){ a.sx=0; a.sz=0; }
  for(let i=0;i<alive.length;i++) for(let j=i+1;j<alive.length;j++){ const a=alive[i], b=alive[j]; const dx=b.x-a.x, dz=b.z-a.z, d=Math.hypot(dx,dz), min=(a.r+b.r)*.9; if(d<min&&d>.001){ const p=(min-d)/min*3; a.sx-=dx/d*p; a.sz-=dz/d*p; b.sx+=dx/d*p; b.sz+=dz/d*p; } }
  const extraHeroes=Meta.heroes();   // co-op: fetched once per tick, not per enemy -- at co-op's scale (a handful of enemies, at most three guests) this loop is trivial either way, but no reason to rebuild it enemies.length times
  for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; const g=e.mdl.g;
    if(e.dead){ e.dead+=dt;
      if(e.fly){ e.y=Math.max(baseFloor(e.x,e.z),e.y-9*dt); g.position.y=e.y; g.rotation.z+=dt*2.5; }   // a dead flyer drops
      if(e.mdl.glb){ mobAnim(e,dt); const t=e.dead-.9; if(t>0){ const s=Math.max(0,1-t/.35)*e.sc; g.scale.setScalar(Math.max(s,.001)); g.position.y=e.y-(1-s)*.4; } if(e.dead>1.25){ scene.remove(g); enemies.splice(i,1); } continue; }
      const s=Math.max(0,1-e.dead/.3)*e.sc; g.scale.set(s*1.3,s*.6,s*1.3); if(e.dead>.3){ scene.remove(g); enemies.splice(i,1); } continue; }
    e.pop=Math.min(1,e.pop+dt*3); e.atk-=dt; e.slowT=Math.max(0,(e.slowT||0)-dt); if(e.holdT>0) e.holdT-=dt; if(e.crawlT>0) e.crawlT-=dt; if(e.lanternT>0) e.lanternT-=dt; e.chillT=Math.max(0,(e.chillT||0)-dt); if(!e.chillT) e.chillK=1; if(e.swing>=0){ e.swing+=dt; const MSW=MOBS[e.kind]||{}; if(e.pending&&e.swing>=(MSW.hitT||.2)){ const tg=e.pending; e.pending=null; landHit(e,tg); } if(e.swing>(MSW.swingT||.4)) e.swing=-1; }
    if(e.lift>0) e.lift=Math.max(0,e.lift-dt*1.4);   // the cage's lift, a look only: the mob's real y (its floor) is untouched
    if(e.poisonT>0){ e.poisonT-=dt; e.poisonTick=(e.poisonTick||0)-dt; if(e.poisonTick<=0){ e.poisonTick=.5; hurt(e,e.poisonDmg*.5,0,0); } } e.confuseT=Math.max(0,(e.confuseT||0)-dt);   // the venom halo's lingering DOT (keeps ticking after a mob leaves the ring) and the dazzling halo's wander timer
    let target=null;
    // co-op: the roar/enrage check below wants the nearest hero at ANY range (not nearestHero's own tight melee-
    // proximity cap), and which one it is, so its line-of-sight check looks at the right position -- otherwise a
    // mini-boss fought entirely by a guest, off in another lane, never notices or enrages, since hd/hero.x/hero.z
    // stayed hardcoded to whichever hero this machine's own local `hero` binding happens to be (the host's own)
    let hd=Math.hypot(hero.x-e.x,hero.z-e.z), hx=hero.x, hz=hero.z;
    for(const h of extraHeroes){ if(h.isDead()) continue; const hd2=Math.hypot(h.x-e.x,h.z-e.z); if(hd2<hd){ hd=hd2; hx=h.x; hz=h.z; } }
    const nh=nearestHero(e,extraHeroes);
    if(nh) target={kind:'hero',x:nh.x,z:nh.z,reach:e.r+1.3,hero:nh};
    else if(e.fly){ const ci=idx(wc(e.x),wcz(e.z)); const n=flowFly.nxt[ci]; const cr=goalCr(isGoal(ci)?ci:n,e); target=(isGoal(ci)||isGoal(n))?cr:(n>=0?{kind:'move',x:cw(n%GW),z:cwz((n/GW)|0)}:null); }   // straight over stairs, ledges and defenses
    else { const ci=idx(wc(e.x),wcz(e.z)); let n=flowDef.nxt[ci]; const cr=goalCr(isGoal(ci)?ci:n,e);
      // defenses in the way get smashed, not politely walked around: if going round costs more than this mob's patience
      // (in grid squares — ogres have none, goblins a little), follow the straight path and break whatever blocks it
      const dD=flowDef.dist[ci], dF=flowFree.dist[ci]; const patience=MOBS[e.kind].detour!==undefined?MOBS[e.kind].detour:3; const smash=dD<0||(dF>=0&&dD-dF>patience);
      if(isGoal(ci)||isGoal(n)) target=cr; else if(n>=0&&!smash) target={kind:'move',x:cw(n%GW),z:cwz((n/GW)|0)};
      else { n=flowFree.nxt[ci]; if(isGoal(n)) target=goalCr(n,e); else if(n>=0){ const d=defAt[n]; target=(d&&!NOWALK_DEF[d.kind])?{kind:'def',obj:d,x:d.x,z:d.z,reach:1.35+e.r}:{kind:'move',x:cw(n%GW),z:cwz((n/GW)|0)}; } } }
    const onStairs=e.ranged&&!e.fly&&(Math.abs(baseFloor(e.x+.9,e.z)-baseFloor(e.x-.9,e.z))+Math.abs(baseFloor(e.x,e.z+.9)-baseFloor(e.x,e.z-.9))>.25);   /* build 180: an archer or troll on a staircase keeps climbing to flat ground before it stops to shoot -- parked on the Throne Room's top flight they plugged it, and the orcs and ogres behind were shoved off its side and jammed ("these 2 enemies keep getting stuck") */
    if(e.ranged&&target&&target.kind!=='hero'&&!onStairs){ let best=null, bd=e.ranged; for(const d of defs){ if(d.kind==="spike"||NOWALK_DEF[d.kind]) continue;   /* build 327: anything mobs walk through (the cage; the four aura rings, 96i) is never a ranged target either */ const dd=Math.hypot(d.x-e.x,d.z-e.z); if(dd<bd&&los(e.x,e.z,d.x,d.z)){ bd=dd; best={kind:"def",obj:d,x:d.x,z:d.z}; } } const cd=Math.hypot(e.x,e.z), pd=GOAL2>=0?flowFree.dist[idx(wc(e.x),wcz(e.z))]:0, pathNear=GOAL2<0||(pd>=0&&pd*CELL<=e.ranged*1.5); if(cd<e.ranged&&pathNear&&los(e.x,e.z,0,0)) best={kind:'crystal',x:0,z:0}; if(GOAL2>=0){ const c2=Math.hypot(e.x-C2X,e.z-C2Z); if(c2<e.ranged&&c2<cd&&pathNear&&los(e.x,e.z,C2X,C2Z)) best={kind:'crystal',x:C2X,z:C2Z,which:2}; }   /* build 282: on a two-Heartroot map (the Cloister Court's garden) an archer walking a lane past a Heartroot could shoot it through the hedges and skip the long way: it shoots one only once its path has brought it near (within half again its range) */ if(best){ best.reach=e.ranged-1; if(best.kind==='def'&&DEF_HITS_BACK[best.obj.kind]) best.reach=Math.min(best.reach,Math.max(1.6,stat(best.obj,'range')-.8)); best.ranged=true; target=best; } }   /* build 161 (Matt: "a ranged mob is allowed to stand just outside their range and poke at them"): an archer (11) or troll (13) shooting a TOWER comes inside that tower's own reach first -- a halo's 5, the frost's 6, the cannon's 12 -- so it can always answer; the crystal and heroes are still shot from full range, and a tower that can't hit a walker (totem, snare) is shot from anywhere */
    if(MOBS[e.kind].heroShot&&e.ranged&&target&&target.kind!=='hero'){ let hb=null, hd=e.ranged; const cand=[]; if(hero.dead<=0) cand.push({x:hero.x,y:hero.y,z:hero.z,isDead:()=>hero.dead>0,hurt:hurtHero}); for(const h of extraHeroes) if(!h.isDead()) cand.push(h);
      for(const h of cand){ const d=Math.hypot(h.x-e.x,h.z-e.z); if(d<hd&&los(e.x,e.z,h.x,h.z)){ hd=d; hb=h; } } if(hb) target={kind:'hero',x:hb.x,z:hb.z,reach:e.ranged-1,hero:hb,ranged:true}; }   /* build 287: a heroShot mob (the Sling boss) throws at a hero it can see before a tower */
    if(e.madT>0&&window.__madTarget){ const mt=window.__madTarget(e); if(mt) target=mt; }   /* build 358: a mob in the Hex Mortar's green mist turns on the nearest other mob (95h-blight.js) */
    e.tgtDef=target&&target.kind==='def'?target.obj:null;   // which tower this mob is attacking right now (updateDefs: that tower answers it first)
    if(e.roar===0&&((hd<14&&los(e.x,e.z,hx,hz))||Math.hypot(e.x,e.z)<12)) ogreRoar(e,1); else if(e.roar===1&&e.hp<=e.max*.5) ogreRoar(e,2);
    if(e.kind==='trollboss'){ e.healT=(e.healT===undefined?0:e.healT)-dt; if(e.healT<=0){ const cfg=MOBS.trollboss; let healed=0; for(const o of enemies){ if(o===e||o.dead||o.hp>=o.max) continue; if(Math.hypot(o.x-e.x,o.z-e.z)>cfg.healR) continue; const before=o.hp; o.hp=Math.min(o.max,o.hp+cfg.healAmt); if(o.hp>before){ floatText(o.x,o.y+o.h+.3,o.z,'+'+Math.round(o.hp-before),'#8ef4c0'); healed++; } } if(healed) healPulse(e); e.healT=cfg.healCd; } }   // the healer's pulse: any wounded mob nearby is mended — kill this one first or the horde outlasts you
    if(e.shoutT>0){ e.shoutT-=dt; target=null; }
    e.walking=false;
    if(target){ const dx=target.x-e.x, dz=target.z-e.z, d=Math.hypot(dx,dz)||.001; const ty=Math.atan2(dx,dz);
      if(target.kind==='move'||d>target.reach){ const sp=mobSpd(e); let mx=dx/d, mz=dz/d, facing=ty;
        if(e.confuseT>0){ e.confuseAng=(e.confuseAng===undefined?rnd()*TAU:e.confuseAng)+R(-2.2,2.2)*dt; mx=Math.sin(e.confuseAng); mz=Math.cos(e.confuseAng); facing=e.confuseAng; }   // the dazzling halo: wanders instead of advancing, for as long as it's confused
        moveCircle(e,(mx*sp+e.sx)*dt,(mz*sp+e.sz)*dt,e.r*.8,false); e.ph+=dt*9; e.yaw=angLerp(e.yaw,facing,1-Math.exp(-10*dt)); e.walking=true; }
      else { e.yaw=angLerp(e.yaw,ty,1-Math.exp(-10*dt)); if(e.atk<=0){ e.atk=e.cd; attack(e,target); } } }
    if(e.fly){ const ty=baseFloor(e.x,e.z)+e.fly+Math.sin(S.t*2.2+e.ph)*.25; e.y=lerp(e.y,ty,1-Math.exp(-3*dt)); } else e.y=baseFloor(e.x,e.z); e.squash=Math.max(0,e.squash-dt*7);
    const sc=e.sc*(e.pop<1?easeOutBack(e.pop):1), sq=e.squash; g.scale.set(sc*(1+sq*.25),sc*(1-sq*.35),sc*(1+sq*.25));
    g.position.set(e.x,e.y+(e.lift||0),e.z); g.rotation.y=e.yaw; const w=e.walking?1:0; const m=e.mdl;
    if(e.fly){ g.rotation.z=Math.sin(S.t*2.2+e.ph)*.07; g.rotation.x=e.walking?-.12:0; const P=m.parts; if(P){ const f=Math.sin(S.t*7+e.ph)*.55; if(P.wingL) P.wingL.rotation.z=f; if(P.wingR) P.wingR.rotation.z=-f; if(P.tail) P.tail.rotation.y=Math.sin(S.t*2.6+e.ph)*.25; } }   // wingbeats, a tail sway, a lean into the flight
    if(m.glb){ mobAnim(e,dt); continue; }
    m.legs[0].rotation.x=Math.sin(e.ph)*.8*w; m.legs[1].rotation.x=-Math.sin(e.ph)*.8*w; m.arms[0].rotation.x=-Math.sin(e.ph)*.6*w;
    m.arms[1].rotation.x=e.swing>=0?(e.swing<.15?lerp(-.3,-2.4,e.swing/.15):lerp(-2.4,.6,(e.swing-.15)/.25)):Math.sin(e.ph)*.6*w;
    m.head.rotation.z=Math.sin(e.ph*.5)*.06*w; g.position.y+=Math.abs(Math.sin(e.ph))*.06*w*e.sc; }
}

// ================= DEFENSES =================
// the grid squares a defense really covers: its centre, plus both ends of a blockade
function footprintCells(kind,x,z,yaw){ const cells=[idx(wc(x),wcz(z))]; if(kind==='spike'){ const ax=Math.cos(yaw), az=-Math.sin(yaw); for(const s of [-1.9,-.9,.9,1.9]){   /* five cells wide: a hedge closes a hall, not just a corridor */ const cx=wc(x+ax*s), cz=wcz(z+az*s); if(!inb(cx,cz)) continue; const i=idx(cx,cz); if(!cells.includes(i)) cells.push(i); } } return cells; }
// where the camera is looking on the floor, kept within reach of the hero (look further away to build further away)
function aimPoint(){ const fx=Math.sin(cam.yaw), fz=Math.cos(cam.yaw);
  if(!TOUCH){ const dir=new THREE.Vector3(); camera.getWorldDirection(dir); if(dir.y<-.02){ const t=(camera.position.y-hero.y)/-dir.y; let px=camera.position.x+dir.x*t, pz=camera.position.z+dir.z*t; const dx=px-hero.x, dz=pz-hero.z, d=Math.hypot(dx,dz); const md=Math.min(8,Math.max(1.6,d)); if(d>.01){ px=hero.x+dx/d*md; pz=hero.z+dz/d*md; } return [px,pz]; } }
  return [hero.x+fx*3.2,hero.z+fz*3.2]; }
function standH(cells,x,z){ let h=-1e9; for(const i of cells) h=Math.max(h,rampA[i]?rampH[i]:hgt[i]);
  if(x!==undefined) for(const b of RAILBOXES){ const m=.7; if(x>=b.x0-m&&x<=b.x1+m&&z>=b.z0-m&&z<=b.z1+m) h=Math.max(h,b.top); }   // a real railing (throne room only) can be built on, not just walked over — the margin is wider than the rail's own thin collision box, since a player aiming from a few steps back needs a real target to land on, not a 0.44-unit line
  return h>-1e8?h:0; }
function placeDefAt(kind,x,z,rot){ const cfg=DEFS[kind]; const cx=wc(x), cz=wcz(z); const cells=footprintCells(kind,x,z,rot||0).filter(i=>walk(grid[i])&&!defAt[i]); const base=standH(cells,x,z);
  const d={kind,cx,cz,cells,x,z,base,rot:rot||0,hp:cfg.hp,max:cfg.hp,top:cfg.top+base,cd:R(.2,cfg.cd),yaw:rot||0,mdl:makeDef(kind,false),pop:0,recoil:0,spin:0,shake:0,lvl:1,spent:cfg.mana};
  d.mdl.position.set(d.x,base,d.z); d.mdl.rotation.y=d.rot; scene.add(d.mdl); defs.push(d); for(const i of cells) defAt[i]=d; S.du+=cfg.du; S.mana-=cfg.mana; reflow(); SFX.place(); return d; }
function placeDef(kind,cx,cz,rot){ const t=gat(cx,cz); if(!(t===T.FLOOR||t===T.CARPET)||footprintCells(kind,cw(cx),cwz(cz),rot||0).some(i=>!walk(grid[i]))) return null; /* the same 'can't build there' as the ghost: floor or carpet, stairs included */ return placeDefAt(kind,cw(cx),cwz(cz),rot||0); }
function removeDef(d){ scene.remove(d.mdl); if(hoverFor===d){ if(hoverSector) scene.remove(hoverSector); hoverSector=null; hoverFor=null; } for(const i of (d.cells||[idx(d.cx,d.cz)])) if(defAt[i]===d) defAt[i]=null; const i=defs.indexOf(d); if(i>=0) defs.splice(i,1); S.du-=DEFS[d.kind].du; reflow(); }
// build 175 (Matt: "the campaign shouldn't be sooo hard, especially if your towers are leveled up, but they keep taking damage so fast and
// easy, we need to back off on the mob damage to towers"): a tower takes TOWER_TAKES of every blow, and each mark above I hardens it
// TOWER_MARK_ARMOR more (Mark V: about 60% less than before). Crystal and heroes are untouched. Build 177: Mark VII hardens 48%
// (about 69% less than before build 175); TOWER_ARMOR_MAX caps the hardening so a later, higher MAXLVL can't make a tower immune
const TOWER_TAKES=.6, TOWER_MARK_ARMOR=.08, TOWER_ARMOR_MAX=.6;
function towerHit(d,dmg){ return Math.max(.5,dmg*TOWER_TAKES*(1-Math.min(TOWER_ARMOR_MAX,TOWER_MARK_ARMOR*Math.max(0,(d.lvl||1)-1)))); }
// the chevrons (build 177): gold rank stripes floating over a Mark V+ tower, one per mark past IV, stacked upward, bobbing gently and
// always turned to the camera. They hang off the tower's own model (a host's d.mdl, a guest's puppet mdl -- 99-network.js), so a sale,
// a trample or a reskin takes them down with it and the next tick hangs them on the new model; the model's scale (the pop, the mark
// growth, the cage's reach) and its turn are undone on them, so every chevron is the same size and faces you the same way
let CHEV_GEO=null, CHEV_MAT=null, CHEV_RIM=null;
function chevGroup(n){ if(!CHEV_GEO){ const w=.3,h=.17,t=.1,c=(h+t)/2, s=new THREE.Shape(); s.moveTo(-w,c-h); s.lineTo(0,c); s.lineTo(w,c-h); s.lineTo(w,c-h-t); s.lineTo(0,c-t); s.lineTo(-w,c-h-t); s.closePath();   /* a ^ of even thickness, centred so the dark rim can scale about the middle */
    CHEV_GEO=new THREE.ShapeGeometry(s); CHEV_MAT=new THREE.MeshBasicMaterial({color:C(0xffc83a),side:THREE.DoubleSide}); CHEV_RIM=new THREE.MeshBasicMaterial({color:C(0x2a1606),side:THREE.DoubleSide}); }   // unlit: the same bright gold in a dark hall as under a torch
  const g=new THREE.Group(); g.name='chevrons'; g.userData.n=n; g.userData.noOL=true;
  for(let k=0;k<n;k++){ const y=k*.21; const rim=new THREE.Mesh(CHEV_GEO,CHEV_RIM); rim.scale.set(1.18,1.45,1); rim.position.set(0,y,-.012); const gold=new THREE.Mesh(CHEV_GEO,CHEV_MAT); gold.position.set(0,y,0); for(const m of [rim,gold]){ m.userData.noOL=true; m.raycast=()=>{}; g.add(m); } }   // a dark rim behind each so it reads over a bright wall or a torch
  return g; }
function towerChevrons(h,mdl,kind,lvl){ const n=chevCount(lvl); let g=h.chev;
  if(g&&g.userData.n!==n){ if(g.parent) g.parent.remove(g); g=h.chev=null; }
  if(!n||!mdl) return; if(!g) g=h.chev=chevGroup(n); if(g.parent!==mdl) mdl.add(g);
  const T=mdl.userData.tpl; let H=DEFS[kind].top||0; if(T){ if(T.chevH===undefined){ T.wrap.updateMatrixWorld(true); const b=new THREE.Box3().setFromObject(T.wrap); T.chevH=b.isEmpty()?H:b.max.y; } H=T.chevH; }   // a Meshy model's own height (measured once per model: the trebuchet's arm and the cage's roots stand well over their DEFS top)
  H=Math.max(H,1); const s=mdl.scale.y||1, p=mdl.position, bob=.07*Math.sin(performance.now()/1000*2.2+(p.x+p.z)*.7);   // flat halos and the cage get a 1-unit floor so the stripes don't sit in the roots
  g.position.set(0,H+(.5+bob)/s,0); g.scale.setScalar(1/s); g.quaternion.copy(mdl.quaternion).invert().multiply(camera.quaternion); }
function hurtDef(d,dmg){ dmg=Math.round(towerHit(d,dmg)*10)/10; d.hp-=dmg; d.shake=.25; d.calm=0; floatText(d.x,d.top+.6,d.z,String(Math.round(dmg)||dmg),'#ff6a5a'); if(d.hp<=0){ removeDef(d); SFX.destroy(); toast(DEFS[d.kind].name+' destroyed!'); } }
function fire(d,e){ const cfg=DEFS[d.kind]; const fx=Math.sin(d.yaw), fz=Math.cos(d.yaw); d.recoil=1;
  if(d.kind==='harpoon'){ const m=harpoonMesh(); const pt=d.pitch||0, cp=Math.cos(pt), sp=Math.sin(pt); m.rotation.set(-pt,d.yaw,0,'YXZ'); scene.add(m); projs.push({kind:'harpoon',x:d.x+fx*cp*.9,y:d.base+1.35*BALLISTA_UP+sp*.9,z:d.z+fz*cp*.9,fx:fx*cp,fz:fz*cp,vy:26*sp,spd:26,life:stat(d,'range')/26,hit:new Set(),dmg:stat(d,'dmg'),mesh:m}); SFX.harpoon(); }   // the bolt leaves along the yoke's tilt
  else if(d.kind==='acorn'){ for(let k=0;k<(cfg.shots||3);k++){ const a=d.yaw+(k-1)*.21+R(-.05,.05); const ax=Math.sin(a), az=Math.cos(a); const m=acornMesh(); scene.add(m); projs.push({kind:'acorn',x:d.x+ax*.9,y:d.base+1.25,z:d.z+az*.9,vx:ax*15,vy:2.2,vz:az*15,life:1.3,bounces:0,dmg:stat(d,'dmg'),mesh:m}); } SFX.acorn(); }
  else { // trebuchet: lob a turnip so it lands where the target is heading
    const m=turnipMesh(); scene.add(m); const x0=d.x+fx*.6, z0=d.z+fz*.6, y0=d.base+2.4; const T=clamp(Math.hypot(e.x-x0,e.z-z0)/11,.5,1.6); const lead=(e.walking?mobSpd(e)*T*.8:0); const tx=e.x+Math.sin(e.yaw)*lead, tz=e.z+Math.cos(e.yaw)*lead; /* lead a walking target by most of the flight time */ const fl=baseFloor(tx,tz)+.35; const vy=((fl-y0)+.5*18*T*T)/T;
    projs.push({kind:'turnip',x:x0,y:y0,z:z0,vx:(tx-x0)/T,vy,vz:(tz-z0)/T,life:T+1,dmg:stat(d,'dmg'),splash:(cfg.splash+(cfg.splashUp||0)*((d.lvl||1)-1))*oMult(d,'aoe')*(1+oStat(d,'tarea')/100),mesh:m}); SFX.ball(); } }
function turnipSplat(p){ const fl=baseFloor(p.x,p.z); for(const e of enemies){ if(e.dead||e.fly) continue; const dx=e.x-p.x, dz=e.z-p.z, dd=Math.hypot(dx,dz); if(dd<p.splash+e.r*.5){ const l=Math.max(dd,.01); hurt(e,Math.max(1,Math.round(p.dmg*(1-.35*dd/p.splash)*10)/10),dx/l*1.1,dz/l*1.1); } }   /* build 150: 65% of the hit at the very edge (was 50%), a harder shove */
  SFX.thud(); const fx=glow(0xd9e59a,2.2+p.splash*.5,.7); fx.position.set(p.x,fl+.3,p.z); scene.add(fx); projs.push({kind:'splat',t:0,mesh:fx}); shockRing(p.x,fl,p.z,p.splash); }
// the splash's reach, drawn: a pale ring that races out to the splash radius and fades (build 150), so the player sees what the trebuchet covers
function frostBite(e){ const fx=glow(0xbfefff,.9,.75); fx.position.set(e.x+R(-.2,.2),e.y+e.h*.6,e.z+R(-.2,.2)); scene.add(fx); projs.push({kind:'spark',t:0,mesh:fx}); }
function shockRing(x,y,z,r){ const m=new THREE.Mesh(new THREE.RingGeometry(.7,1,40),new THREE.MeshBasicMaterial({color:C(0xf1e6a0),transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})); m.rotation.x=-PI/2; m.position.set(x,y+.06,z); m.scale.setScalar(.3); m.userData.noOL=true; scene.add(m); projs.push({kind:'shock',t:0,mesh:m,r}); }
function grenadeBurst(x,y,z){ SFX.destroy(); const fx=glow(0xb060ff,3.0,.85); fx.position.set(x,y+.2,z); scene.add(fx); projs.push({kind:'splat',t:0,mesh:fx}); }
function healPulse(e){ SFX.mana(); const fl=baseFloor(e.x,e.z); const fx=glow(0x8ef4c0,e.r*3.2,.75); fx.position.set(e.x,fl+e.h*.5,e.z); scene.add(fx); projs.push({kind:'splat',t:0,mesh:fx}); }
// co-op: a defense a GUEST placed (d.ownerId set, 99-network.js) draws on THAT player's own tow/trate/tarea gear
// and skills, not whoever's sitting at the host's own keyboard -- Meta.defOwnerStat/defOwnerMult return undefined
// for a host-placed defense (d.ownerId unset) or once that guest disconnects, so oStat/oMult transparently fall
// back to the local hero's own heroStat/heroMult exactly as before -- a defense keeps its placer's buffs only for
// as long as they're actually in the game
function oStat(d,k){ const v=d.ownerId?Meta.defOwnerStat(d.ownerId,k):undefined; return v!==undefined?v:heroStat(k); }
function oMult(d,k){ const v=d.ownerId?Meta.defOwnerMult(d.ownerId,k):undefined; return v!==undefined?v:heroMult(k); }
function stat(d,k){ const cfg=DEFS[d.kind], l=d.lvl||1; if(k==='dmg') return Math.max(1,Math.round(cfg.dmg*(1+.5*(l-1))*(1+oStat(d,'tow')/100)*oMult(d,'tow')*(1+(d.buffD||0))*10)/10); if(k==='cd') return cfg.cd*Math.pow(.8,l-1)/oMult(d,'tcd')/(1+oStat(d,'trate')/100)/(1+(d.buffS||0)); if(k==='buff') return (cfg.buff||0)+(cfg.buffUp||0)*(l-1); if(k==='buffD') return cfg.buff?stat(d,'buff')+oStat(d,'tow')/100*.5:0; if(k==='buffS') return cfg.buff?stat(d,'buff')+oStat(d,'trate')/100*.5:0;   /* build 178: a totem's two auras -- see updateDefs */ if(k==='chill') return Math.max(.2,(cfg.chill||1)-(cfg.chillUp||0)*(l-1)); if(k==='range') return ((cfg.range||0)+(cfg.rangeUp!==undefined?cfg.rangeUp:2)*(l-1))*(cfg.arc===360?oMult(d,'aoe'):1)*(1+oStat(d,'tarea')/100); return cfg[k]; }
// build 177: the chevron marks cost half again more for every chevron already worn -- IV→V 400 as always, V→VI 750, VI→VII 1200
// (2950 all told from Mark I), so a Mark VII is a real investment and not just the next 100 up
function upCost(d){ const l=d.lvl||1; return Math.round(100*l*(1+.5*chevCount(l))); }
// upgrade's own top-level binding gets wrapped by other modules too (tavern stations, the raven's hero-doll panel
// both intercept the 'E' key's call to it, opening their own UI instead when the player's standing by one of
// those) -- those wrappers take no arguments and don't forward any, so a co-op caller reaching `upgrade` through
// that chain would have its `pos` silently dropped. upgradeDef is the actual logic, under a name nothing else
// wraps, so a host-side guest request can call it directly and skip those (purely single-player-local) UI checks.
function upgrade(pos){ return upgradeDef(pos); }
function upgradeDef(pos){ const d=pickDef(pos); if(!d) return; if(d.hp<d.max){ repair(pos); return; } if(d.lvl>=MAXLVL){ toast('Already Mark '+MARK[MAXLVL]+' — that is as good as it gets'); return; } const cost=upCost(d); if(S.mana<cost){ toast('Need '+cost+' mana to upgrade'); return; }
  S.mana-=cost; d.spent+=cost; d.lvl++; d.max=Math.round(DEFS[d.kind].hp*(1+.4*(d.lvl-1))); d.hp=d.max; d.pop=0; if(d.lvl<CHEV_FROM){ const ring=M(new THREE.TorusGeometry(d.kind==='spike'?1.1:.98,.045,6,18),mat(0xe0b040),0,.16+.1*(d.lvl-2),0); ring.rotation.x=PI/2; d.mdl.add(ring); }   /* build 177: the gold base ring marks II-IV; from V the chevrons do (towerChevrons) -- no more red "top mark" ring */ SFX.place(); floatText(d.x,d.top+.9,d.z,'MARK '+MARK[d.lvl]+(DEFS[d.kind].arcs?'  ·  '+arcOf(d)+'° cone':''),'#e8b94a'); floatText(d.x,d.top+1.7,d.z,'-'+cost+' ◆ mana','#5ee9ff'); toast(DEFS[d.kind].name+' → Mark '+MARK[d.lvl]+'  ·  '+cost+' mana spent'); if(hoverFor===d){ if(hoverSector) scene.remove(hoverSector); hoverSector=null; hoverFor=null; } }
function fireArrow(e,x,y,z,hit){ const splash=MOBS[e.kind]&&MOBS[e.kind].splash||0; const m=splash?grenadeMesh():arrowMesh(); scene.add(m); const x0=e.x, y0=e.y+1.2*e.sc, z0=e.z; const dur=Math.hypot(x-x0,z-z0)/(splash?13:18); projs.push({kind:'arrow',x0,y0,z0,x1:x,y1:y,z1:z,t:0,dur:Math.max(.2,dur),dmg:e.dmg,hit,mesh:m,splash,owner:e}); }   // a splash-tagged mob throws a grenade, slower and heavier than a plain shot
// the floor ring the four elemental halos share: a glow ring at the reach, a small inner spinner — same idea as the
// totem/frost aura but flatter and lower, since these stand barely off the ground (top .08) instead of being a spire
/* build 161, Matt: "i like the thin column on the halos, they could be just a notch darker" -- .06 → .045; build 174: "darker" meant a stronger colour, not dimmer -- "not dimmer I want to see them a little more" → .075 */
/* build 305, Matt: "i want the aura on the aura rings to be darker still". An ADDED glow can only ever lighten, and on the lit halls' red carpet and warm floors it read as a pale, near-white circle.
   The column now lays a DEEP version of the halo's own colour over the floor (normal blending, the colour darkened and saturated: deepAura) -- darker on any floor, bright or dark.
   build 306, Matt: "its the glow coming of the floor in a column i am taking about, thats the part i need to be alttle darker": the RING is back as it always was (its own colour, added glow); only the column is deep, a notch darker again (lightness .26, .34 strong). Then "or more color full": at .26 it went murky, so the column is FULL saturation, lightness .38, .42 strong -- vivid and still deeper than the ring's glow. */
const HALO_COL_H=4.5, HALO_COL_OP=.56;   // build 331 (Matt: "the auroras are perfect shade now take that clyinder up higher"): 2.4 -> 4.5 tall, the shade untouched   // build 326 (Matt: "that color column could be darker still, i mean more color"): .42 -> .56, and the colour itself deeper (lightness at most .30, was .38)   // the halo column: how tall, and how strong at rest (stronger while a mob stands in the ring)
// the halo colours arrive as plain sRGB hex; the deep one is made in sRGB and converted (C's convertSRGBToLinear) -- unconverted, the renderer's sRGB output shows it paler than it is (threejs colour gotcha)
const deepAura=c=>{ const k=new THREE.Color(c), h={}; k.getHSL(h); return new THREE.Color().setHSL(h.h,1,Math.min(h.l,.30)).convertSRGBToLinear(); };
let HALO_FADE=null;   // the column's fade, strongest at the floor and gone by the top: an alpha ramp down the cylinder's height (its uv v runs 0 at the bottom to 1 at the top)
function haloFade(){ if(HALO_FADE) return HALO_FADE; const c=document.createElement('canvas'); c.width=2; c.height=64; const x=c.getContext('2d'); for(let r=0;r<64;r++){ const t=r/63, v=Math.round(255*t*t); x.fillStyle='rgb('+v+','+v+','+v+')'; x.fillRect(0,r,2,1); } HALO_FADE=new THREE.CanvasTexture(c); return HALO_FADE; }
function auraRing(d,rr,col,active,s){ let a=d.mdl.userData.aura; if(!a){ a=new THREE.Group(); const deep=deepAura(col); const ring=new THREE.Mesh(new THREE.RingGeometry(.94,1,48),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})); ring.rotation.x=-PI/2; ring.userData.noOL=true; a.add(ring); const inner=new THREE.Mesh(new THREE.RingGeometry(.2,.24,24),ring.material.clone()); inner.rotation.x=-PI/2; inner.userData.noOL=true; a.add(inner); a.userData.ring=ring; a.userData.inner=inner;
    // the column: a faint see-through wall of the halo's own colour standing on the ring, HALO_COL_H tall, brightest at the floor and gone by the top (vertex colours fade to black, and under additive blending black adds nothing) -- a mob walks through it, and from the camera's height it says which halo this is and who is inside it, where the flat ring alone is hidden behind the mobs; kept faint so four overlapping halos never wash out the lane
    const cg=new THREE.CylinderGeometry(1,1,HALO_COL_H,48,1,true);
    const column=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({color:deep,alphaMap:haloFade(),transparent:true,opacity:HALO_COL_OP,side:THREE.DoubleSide,depthWrite:false})); column.position.y=HALO_COL_H/2; column.userData.noOL=true; a.add(column); a.userData.column=column; d.mdl.add(a); d.mdl.userData.aura=a; }
  a.position.y=.03; a.scale.set(rr/s,1/s,rr/s); a.userData.inner.rotation.z+=(active?2.5:.8)*.016; a.userData.ring.material.opacity=.3+.1*Math.sin(S.t*2.4)+(active?.15:0); a.userData.column.material.opacity=HALO_COL_OP+.05*Math.sin(S.t*1.7)+(active?.14:0); }
// ---- the Mycelium Cage: rest, charge, implode. At rest the cage only slows what walks in and its spores drift up. With
// victims inside it charges for a random while (its roots relax outward, the spores start to swirl inward), then IMPLODES:
// the roots snap shut, the vortex is sucked to the centre, the victims are lifted a little, a violet-cyan flash bursts for
// burst x dmg, and a toxic cloud lingers over the cage poisoning whoever is in it (the venom halo's own DOT fields). No
// screen shake. Empty, it still flexes now and then so it reads as alive. d.fx carries the state ({phase,t,k,cloud}); the
// animation itself lives in cageAnim(mdl,fx,dt) so a guest can run the same look on its puppet from the host's cue.
function cageState(){ return {phase:'rest',t:0,k:0,cloud:0,next:R(3,7),booms:0,last:0}; }
function cageTick(d,near,dt,rr,trampled){ const cfg=DEFS[d.kind]; const fx=d.fx||(d.fx=cageState()); fx.t+=dt;
  if(fx.phase==='rest'){ fx.k=Math.max(0,fx.k-dt*2); if(near.length&&d.pop>=1){ fx.phase='charge'; fx.t=0; fx.dur=R(cfg.charge[0],cfg.charge[1]); SFX.spore(); Meta.onDefFx(d,'charge',fx.dur); } else if(fx.t>fx.next){ fx.t=0; fx.next=R(3,7); fx.flex=.5; } }
  else if(fx.phase==='charge'){ fx.k=Math.min(1,fx.t/fx.dur); if(!near.length){ fx.phase='rest'; fx.t=0; Meta.onDefFx(d,'calm'); } else if(fx.t>=fx.dur){ cageImplode(d,near,cfg,trampled); } }
  else if(fx.phase==='boom'){ if(fx.t>=.45){ fx.phase='rest'; fx.t=0; fx.k=0; } }
  if(fx.cloud>0){ fx.cloud-=dt; const dur=cfg.cloud, dmg=stat(d,'dmg'); for(const e of near){ if(!(e.poisonT>fx.cloud)){ e.poisonT=fx.cloud; e.poisonDmg=Math.max(e.poisonDmg||0,dmg); } } }   // the cloud keeps poisoning whoever stands in it while it lasts; a mob that leaves keeps ticking for what it caught
  if(fx.phase==='charge') for(const e of near) e.lift=Math.max(e.lift||0,.12*fx.k);
  cageAnim(d.mdl,fx,dt,near.length); }
function cageImplode(d,near,cfg,trampled){ const fx=d.fx; fx.phase='boom'; fx.t=0; fx.k=1; fx.booms++; fx.last=S.t; fx.cloud=cfg.cloud; const dmg=stat(d,'dmg')*cfg.burst;
  for(const e of near){ e.lift=.5; hurt(e,dmg,0,0); e.poisonT=cfg.cloud; e.poisonDmg=Math.max(e.poisonDmg||0,stat(d,'dmg')); }
  SFX.implode(); floatText(d.x,d.base+1.6,d.z,'IMPLOSION','#d08aff'); d.hp-=near.length*1.2; if(d.hp<=0&&trampled) trampled.push(d); Meta.onDefFx(d,'implode'); }
// the look, on any cage model (the host's real one or a guest's puppet): the inner 'cage' group breathes at rest, relaxes
// outward while charging, snaps shut on the boom and eases back; the spores drift up at rest and get pulled in to the
// centre as the charge builds; a flash sprite at the heart blooms violet then cyan on the boom; a toxic cloud hangs after
function cageAnim(mdl,fx,dt,n){ const u=mdl.userData; const cage=u.cage; const t=S.t; let sc=1+.015*Math.sin(t*1.7);
  if(fx.flex>0){ fx.flex-=dt; sc+=.05*Math.sin((.5-fx.flex)*TAU*2)*(fx.flex/.5); }   // the idle flex: a quick swell and settle
  if(fx.phase==='charge') sc=1+.12*easeOut(fx.k)+.02*Math.sin(t*14)*fx.k;   // roots relax outward, trembling more as it comes
  else if(fx.phase==='boom'){ const q=fx.t/.45; sc=q<.22?1.12-(.3*q/.22):.82+.18*easeOutBack(Math.min(1,(q-.22)/.78)); }   // the snap shut, then the ease back
  if(cage) cage.scale.setScalar(sc);
  const hub=u.hub; if(hub){ hub.rotation.y+=dt*(fx.phase==='charge'?(1.2+4*fx.k):fx.phase==='boom'?7:.5); const pull=fx.phase==='charge'?fx.k:fx.phase==='boom'?1:0; const lift=n?1.7:1.1;
    for(const pf of hub.children){ const ud=pf.userData; const k=((t*.45+ud.ph)%1.1)/1.1; const r=ud.r*(1-.85*pull); pf.position.set(Math.cos(ud.a)*r,fx.phase==='boom'?.6:.25+k*lift*(1-.6*pull),Math.sin(ud.a)*r); pf.material.opacity=(.22+Math.min(n,4)*.06+.3*pull)*(fx.phase==='boom'?Math.max(0,1-fx.t/.3):(1-k*(1-pull*.5))); } }
  const fl=u.flash; if(fl){ let o=0, s=1; if(fx.phase==='boom'){ const q=fx.t/.45; o=q<.15?q/.15:Math.max(0,1-(q-.15)/.85); s=1.4+5.2*Math.min(1,q/.3); fl.material.color.setHex(q<.3?0xc060ff:0x7ff6ff); } else if(fx.phase==='charge'){ o=.25*fx.k; s=.8+.6*fx.k; fl.material.color.setHex(0xb060ff); } fl.material.opacity=o; fl.scale.set(s,s,1); }
  const disc=u.disc; if(disc){ const q=fx.phase==='boom'?fx.t/.45:0; disc.material.opacity=fx.phase==='boom'?.1+.55*Math.max(0,1-q):.1+.12*(fx.phase==='charge'?fx.k:0); disc.material.color.setHex(fx.phase==='boom'&&q>.3?0x7ff6ff:0xb04ad0); }   // the floor disc flares with the flash (it shows through the roots where the sprite cannot)
  const cl=u.cloud; if(cl){ const on=fx.cloud>0; cl.visible=on; if(on){ const a=Math.min(1,fx.cloud/.6)*Math.min(1,(DEFS.slice.cloud-fx.cloud)/.25+.2); cl.rotation.y+=dt*.6; for(const pf of cl.children){ const ud=pf.userData; pf.position.y=ud.y+.12*Math.sin(t*1.3+ud.ph); pf.material.opacity=a*ud.op; } } } }
function easeOut(k){ return 1-(1-k)*(1-k); }
// ---- build 178: the rune-light, so a player can SEE which towers a totem is feeding. Every totem->tower link is a faint gold arc from
// the totem's crown down to the tower -- a fine thread (ONE LineSegments for every link on the map) strung with beads of light (ONE
// Points cloud on the soft glow texture, so a bead reads from any angle; a 1 px line alone was too faint to find), both rewritten in
// place each frame with a brighter pulse and a mote running down it toward the tower; every boosted tower stands in a slowly turning
// gold circle of runes (one canvas texture) with a small glow above it. Rings, glows and motes are pooled scene objects on
// shared geometry/materials, placed each frame by position (not parented to d.mdl, which a mark-up re-skin can swap), so nothing is
// allocated per frame and a sold tower's glow simply goes back to the pool. Host and solo only: a co-op guest's towers are puppets
const RUNE={n:0,max:48,seg:10,beads:14,links:[],line:null,motes:[],rings:[],glows:[],col:0xffd27a};
function runeTex(){ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'); g.translate(64,64); g.strokeStyle='#fff'; g.fillStyle='#fff'; g.lineCap='round';
  g.lineWidth=3; g.beginPath(); g.arc(0,0,58,0,TAU); g.stroke(); g.lineWidth=1.5; g.beginPath(); g.arc(0,0,44,0,TAU); g.stroke();   // two rims, and eight little runes of strokes between them
  const RN=[[[-4,-6,-4,6],[-4,-6,4,-1]],[[0,-6,0,6],[-4,-2,4,2]],[[-4,6,0,-6],[0,-6,4,6]],[[-4,-6,4,6],[4,-6,-4,6]],[[-4,-6,-4,6],[-4,0,4,-5],[-4,0,4,5]],[[0,-6,0,6],[0,-6,4,-3]],[[-4,-5,4,-5],[0,-5,0,6]],[[-4,6,-4,-6],[-4,-6,4,6],[4,6,4,-6]]];
  g.lineWidth=2.2; for(let i=0;i<8;i++){ g.save(); g.rotate(i*TAU/8); g.translate(0,-51); for(const [x0,y0,x1,y1] of RN[i]){ g.beginPath(); g.moveTo(x0*.9,y0*.9); g.lineTo(x1*.9,y1*.9); g.stroke(); } g.restore(); }
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t; }
function runeTakes(d){ const c=DEFS[d.kind]; return c.dmg>0||c.cd!==undefined; }
function runePool(arr,i,make){ let o=arr[i]; if(!o){ o=make(); arr[i]=o; } if(o.parent!==scene) scene.add(o); o.visible=true; return o; }
function runeDraw(dt){ const R=RUNE;
  if(!R.line){ const n=R.max*R.seg*2, g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3)); g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(n*3),3));
    R.line=new THREE.LineSegments(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})); R.line.frustumCulled=false; R.line.userData.noOL=true; R.lc=C(R.col);
    const nb=R.max*R.beads, pg=new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(nb*3),3)); pg.setAttribute('color',new THREE.BufferAttribute(new Float32Array(nb*3),3));
    R.pts=new THREE.Points(pg,new THREE.PointsMaterial({size:.34,map:GLOWT,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true})); R.pts.frustumCulled=false; R.pts.userData.noOL=true;
    R.moteMat=new THREE.SpriteMaterial({map:GLOWT,color:C(R.col),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.9});
    R.glowMat=new THREE.SpriteMaterial({map:GLOWT,color:C(R.col),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.5});
    R.ringGeo=new THREE.PlaneGeometry(2.1,2.1); R.ringMat=new THREE.MeshBasicMaterial({map:runeTex(),color:C(R.col),transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}); }   /* a circle of runes: reads as a sigil, not another range ring */
  if(R.line.parent!==scene) scene.add(R.line); if(R.pts.parent!==scene) scene.add(R.pts);
  const pos=R.line.geometry.attributes.position, col=R.line.geometry.attributes.color, P=pos.array, Cc=col.array, lc=R.lc, N=R.seg; let v=0;
  const bpos=R.pts.geometry.attributes.position, bcol=R.pts.geometry.attributes.color, BP=bpos.array, BC=bcol.array, NB=R.beads; let w=0;
  for(let i=0;i<R.n;i++){ const t=R.links[i].t, d=R.links[i].d; const ax=t.x, ay=t.base+DEFS.totem.top*.95*markGrow(t.lvl), az=t.z, bx=d.x, by=d.base+Math.max(.3,DEFS[d.kind].top*.55*markGrow(d.lvl)), bz=d.z;
    const lift=.6+.08*Math.hypot(bx-ax,bz-az), ph=(S.t*.7+i*.37)%1;   /* a gentle arch, higher for a longer link; each link's pulse runs out of step with its neighbours */
    const at=u=>{ const w=1-u; return [ax*w+bx*u, ay*w+by*u+lift*4*u*w, az*w+bz*u]; };
    for(let k=0;k<N;k++){ for(const u of [k/N,(k+1)/N]){ const p=at(u); P[v*3]=p[0]; P[v*3+1]=p[1]; P[v*3+2]=p[2]; const q=u-ph, b=.22+.78*Math.exp(-q*q/.012); Cc[v*3]=lc.r*b; Cc[v*3+1]=lc.g*b; Cc[v*3+2]=lc.b*b; v++; } }
    for(let k=0;k<NB;k++){ const u=(k+.5)/NB, p=at(u); BP[w*3]=p[0]; BP[w*3+1]=p[1]; BP[w*3+2]=p[2]; const q=u-ph, b=.3+.9*Math.exp(-q*q/.012); BC[w*3]=lc.r*b; BC[w*3+1]=lc.g*b; BC[w*3+2]=lc.b*b; w++; }
    const m=runePool(R.motes,i,()=>{ const s=new THREE.Sprite(R.moteMat); s.scale.set(.42,.42,1); s.userData.noOL=true; return s; }); const p=at(ph); m.position.set(p[0],p[1],p[2]); }
  for(let i=R.n;i<R.motes.length;i++) R.motes[i].visible=false;
  pos.needsUpdate=true; col.needsUpdate=true; R.line.geometry.setDrawRange(0,v); bpos.needsUpdate=true; bcol.needsUpdate=true; R.pts.geometry.setDrawRange(0,w);
  let j=0; for(const d of defs){ if(!(d.buffD>0||d.buffS>0)) continue; const k=markGrow(d.lvl);
    const r=runePool(R.rings,j,()=>{ const m=new THREE.Mesh(R.ringGeo,R.ringMat); m.rotation.x=-PI/2; m.userData.noOL=true; return m; }); r.position.set(d.x,d.base+.05,d.z); r.rotation.z=S.t*.5+j; r.scale.setScalar(k*(d.kind==='ball'?1.3:1.1));
    const g=runePool(R.glows,j,()=>{ const s=new THREE.Sprite(R.glowMat); s.scale.set(.9,.9,1); s.userData.noOL=true; return s; }); g.position.set(d.x,d.base+DEFS[d.kind].top*k+.35,d.z); j++; }
  for(let i=j;i<R.rings.length;i++){ R.rings[i].visible=false; R.glows[i].visible=false; }
  R.ringMat.opacity=.5+.15*Math.sin(S.t*2.2); R.glowMat.opacity=.42+.14*Math.sin(S.t*3.1); }
function updateDefs(dt){ const trampled=[];
  // the totems' rings. Build 178 (Matt: "they were supposed to be buff towers, like any tower in proximity is faster or does more
  // damage based on what points you put into your buff towers"): a totem lends two auras now, split so the placer's points show --
  // DAMAGE (buffD) = 15% +5% a mark + half its placer's 🏹 defense damage; SPEED (buffS) = 15% +5% a mark + half their 🔁 defense
  // attack speed (oStat: the placer's own stats in co-op, the local hero's solo); the ring still grows with ◎ defense range. A tower
  // in several rings takes the strongest damage aura and, separately, the strongest speed aura -- never a sum, so totems don't stack.
  // Only a tower with a damage or a firing cooldown takes one (runeTakes: the hedge and the Dazzling Halo have nothing to boost).
  // Each totem->tower pair is kept for the rune-light drawn after (runeDraw)
  for(const d of defs){ d.buffD=0; d.buffS=0; } RUNE.n=0;
  for(const t of defs){ if(t.kind!=='totem'||t.pop<1) continue; const r=stat(t,'range'), bd=stat(t,'buffD'), bs=stat(t,'buffS'); for(const d of defs){ if(d===t||d.kind==='totem'||!runeTakes(d)) continue; if(Math.hypot(d.x-t.x,d.z-t.z)<=r){ d.buffD=Math.max(d.buffD,bd); d.buffS=Math.max(d.buffS,bs); if(RUNE.n<RUNE.max){ const L=RUNE.links[RUNE.n]||(RUNE.links[RUNE.n]={}); L.t=t; L.d=d; RUNE.n++; } } } }
  runeDraw(dt);
  for(const d of defs){ const cfg=DEFS[d.kind]; d.pop=Math.min(1,d.pop+dt*4); const s=(d.pop<1?easeOutBack(d.pop):1)*(d.kind==='slice'?stat(d,'range')/cfg.range:markGrow(d.lvl)); d.mdl.scale.set(s,s,s); d.cd-=dt; d.shake=Math.max(0,d.shake-dt); d.recoil=Math.max(0,d.recoil-dt*4);
    d.mdl.position.set(d.x+(d.shake>0?(rnd()-.5)*.12:0),d.base,d.z+(d.shake>0?(rnd()-.5)*.12:0));
    if(d.kind==='harpoon'||d.kind==='ball'||d.kind==='acorn'){ const half=arcOf(d)*PI/360, range=stat(d,'range'); let best=null, bestProg=1e18;   // among everything in range/arc/sight, engage whoever is furthest along toward the crystal (path distance, not raw distance to this tower) — a tower otherwise happily plinks the mob that wandered nearest to IT while one about to breach sits in range ignored
      for(const e of enemies){ if(e.dead) continue; const dd=Math.hypot(e.x-d.x,e.z-d.z); if(dd>range||Math.abs(angDiff(d.rot,Math.atan2(e.x-d.x,e.z-d.z)))>half||!los(d.x,d.z,e.x,e.z)) continue;
        const prog=(e.fly?flowFly:flowFree).dist[idx(wc(e.x),wcz(e.z))]; const key=(e.marked?-1e5:e.tgtDef===d?-5e4:0)+(prog>=0?prog:1e6+dd);   /* a marked mob (the Warden's Oath) is engaged first; then (build 161) a mob attacking THIS tower -- it answers whoever is hitting it before plinking the lane */ if(key<bestProg){ bestProg=key; best=e; } }
      if(best){ const ty=Math.atan2(best.x-d.x,best.z-d.z); d.yaw=angLerp(d.yaw,ty,1-Math.exp(-7*dt)); if(d.kind==='harpoon'){ const tp=clamp(Math.atan2((best.y+best.h*.55)-(d.base+1.35*BALLISTA_UP),Math.max(.4,Math.hypot(best.x-d.x,best.z-d.z))),-1.2,1.3); d.pitch=lerp(d.pitch||0,tp,1-Math.exp(-7*dt)); }   /* wide vertical reach (+-69-75deg) and a lower distance floor: a mob standing right under or right above the tower on the next step still needs a steep shot, not the shallow one a far-off target gets; a ballista also tilts to a drake in the air or a mob on a landing */ if(d.cd<=0&&Math.abs(angDiff(d.yaw,ty))<.25){ d.cd=stat(d,'cd'); fire(d,best); } } else { d.yaw=angLerp(d.yaw,d.rot,1-Math.exp(-2*dt)); if(d.kind==='harpoon') d.pitch=lerp(d.pitch||0,0,1-Math.exp(-2*dt)); }
      d.yaw=d.rot+clamp(angDiff(d.rot,d.yaw),-half,half);
      const y=d.mdl.userData.yoke; y.rotation.y=d.yaw-d.rot; if(d.kind==='harpoon') (d.mdl.userData.pitch||y).rotation.x=-(d.pitch||0); /* the Meshy ballista hinges its bow assembly on the pedestal; the procedural one tilts its yoke */ if(d.kind==='ball'){ if(d.mdl.userData.arm) d.mdl.userData.arm.rotation.x=-.9+d.recoil*2.0; else if(d.mdl.userData.glb) y.rotation.x=-d.recoil*.14; /* the Meshy trebuchet is one piece: it lurches on the throw (build 150) */ d.mdl.userData.ball.visible=d.cd<cfg.cd*.5; } else { y.position.z=-d.recoil*.22; d.mdl.userData.hp.visible=d.cd<cfg.cd*.45; } }
    else if(d.kind==='slice'){ const rr=stat(d,'range'); const near=[]; for(const e of enemies){ if(!e.dead&&!e.fly&&Math.hypot(e.x-d.x,e.z-d.z)<rr+e.r*.5) near.push(e); }
      for(const e of near) e.slowT=.5;
      cageTick(d,near,dt,rr,trampled); }
    else if(d.kind==='spike'){ d.calm=(d.calm||0)+dt; if(d.calm>4&&d.hp<d.max) d.hp=Math.min(d.max,d.hp+cfg.regrow*dt); }
    else if(d.kind==='totem'||d.kind==='frost'){ const rr=stat(d,'range'); let n=0; if(d.kind==='frost'){ const k=stat(d,'chill'); const bite=[]; for(const e of enemies){ if(!e.dead&&Math.hypot(e.x-d.x,e.z-d.z)<rr+e.r*.5){ e.chillT=.5; e.chillK=Math.min(e.chillK||1,k); n++; if(d.cd<=0) bite.push(e); } } if(bite.length){ d.cd=stat(d,'cd'); for(const e of bite){ hurt(e,stat(d,'dmg'),0,0); frostBite(e); } SFX.frost(); } }   /* build 150: the cold bites too -- every mob in the ring takes dmg each cd, with a glint of ice on it */ else { for(const o of defs) if(o!==d&&o.kind!=='totem'&&Math.hypot(o.x-d.x,o.z-d.z)<=rr) n++; }
      let a=d.mdl.userData.aura; if(!a){ const col=d.kind==='frost'?0x8ee0ff:0xffd27a; a=new THREE.Group(); const ring=new THREE.Mesh(new THREE.RingGeometry(.94,1,48),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})); ring.rotation.x=-PI/2; ring.userData.noOL=true; a.add(ring); const inner=new THREE.Mesh(new THREE.RingGeometry(.2,.24,24),ring.material.clone()); inner.rotation.x=-PI/2; inner.userData.noOL=true; a.add(inner); const plume=glow(col,1.5,.55); a.add(plume); a.userData.ring=ring; a.userData.inner=inner; a.userData.plume=plume; d.mdl.add(a); d.mdl.userData.aura=a; }   /* the ring on the floor at the reach, a small spinner, a plume of light at the top */
      a.position.y=.03; a.scale.set(rr/s,1/s,rr/s); a.userData.plume.scale.set(1.5/rr,1.5,1); a.userData.plume.position.set(0,cfg.top-.1,0); a.userData.inner.rotation.z+=dt*(n?2.5:.8); a.userData.ring.material.opacity=.28+.1*Math.sin(S.t*2.4)+(n?.12:0); a.userData.plume.material.opacity=.45+.15*Math.sin(S.t*3.1); }
    else if(d.kind==='snare'){ const rr=stat(d,'range'); if(d.cd<=0){ let best=null, bd=rr; for(const e of enemies){ if(e.dead||!e.fly) continue; const dd=Math.hypot(e.x-d.x,e.z-d.z); if(dd<bd){ bd=dd; best=e; } } if(best){ d.cd=stat(d,'cd'); snareCapture(d,best); } } }
    else if(d.kind==='zap'||d.kind==='venom'||d.kind==='ember'||d.kind==='dazzle'){ const rr=stat(d,'range'); const near=[]; for(const e of enemies){ if(!e.dead&&!e.fly&&Math.hypot(e.x-d.x,e.z-d.z)<rr+e.r*.5) near.push(e); }
      const col=d.kind==='zap'?0x7fd8ff:d.kind==='venom'?0x8ef05a:d.kind==='ember'?0xff6a2a:0xffd060;
      auraRing(d,rr,col,near.length,s);
      if(d.kind==='dazzle'){ for(const e of near) e.confuseT=Math.max(e.confuseT||0,stat(d,'confuseDur')); }   /* build 182: routed through stat() (its own fallback already returned cfg.confuseDur unchanged) so a Halo Surge can double it same as dmg/poisonDur, below */
      else if(d.kind==='venom'){ if(near.length&&d.cd<=0){ d.cd=stat(d,'cd'); for(const e of near){ e.poisonT=stat(d,'poisonDur'); e.poisonDmg=stat(d,'dmg'); } } }   /* build 182: same stat() routing as confuseDur above */
      else if(near.length&&d.cd<=0){ d.cd=stat(d,'cd'); for(const e of near) hurt(e,stat(d,'dmg'),0,0); SFX.hit(); } } }
  for(const d of trampled){ removeDef(d); SFX.destroy(); toast(DEFS[d.kind].name+' trampled flat!'); }
}
// the net: a streak from the tower to its catch, then the mob is gone outright (a full kill: mana, loot, XP — same as any other) —
// what it doesn't catch, it never scratches, so it's purely a flying-mob answer, not a damage tower
function snareCapture(d,e){ const from=new THREE.Vector3(d.x,d.top*.6,d.z), to=new THREE.Vector3(e.x,e.y+e.h*.5,e.z); const streak=glow(0xc9a8ff,1.4,.8); streak.position.copy(from).lerp(to,.5); streak.scale.set(.5,.5,from.distanceTo(to)*1.6); streak.lookAt(to); scene.add(streak); projs.push({kind:'splat',t:0,mesh:streak}); const burst=glow(0x8a3cff,e.r*2.6,.85); burst.position.copy(to); scene.add(burst); projs.push({kind:'splat',t:0,mesh:burst}); floatText(e.x,e.y+e.h+.5,e.z,'SNARED!','#c9a8ff'); SFX.destroy(); kill(e); }
function updateProj(dt){}
function updateProj(dt){
  for(let i=projs.length-1;i>=0;i--){ const p=projs[i]; let dead=false;
    if(p.kind==='harpoon'){ p.life-=dt; dead=p.life<=0; const nx=p.x+p.fx*p.spd*dt, nz=p.z+p.fz*p.spd*dt, ny=p.y+(p.vy||0)*dt; const g=gat(wc(nx),wcz(nz)); if(g===T.WALL||g===T.PILLAR||ny<baseFloor(nx,nz)+.05||ny>WALLH) dead=true; /* into a wall, the floor, a landing's face or the ceiling */ p.x=nx; p.z=nz; p.y=ny;
      for(const e of enemies){ if(e.dead||p.hit.has(e)) continue; if(Math.hypot(e.x-p.x,e.z-p.z)<e.r+.5&&p.y>e.y-.4&&p.y<e.y+e.h+.5){ p.hit.add(e); hurt(e,p.dmg,p.fx*.9,p.fz*.9); SFX.hit(); } } p.mesh.position.set(p.x,p.y,p.z); }   // a bolt hits what it flies through, at its own height
    else if(p.kind==='acorn'){ p.life-=dt; dead=p.life<=0; const nx=p.x+p.vx*dt; if(wallAt(nx+Math.sign(p.vx)*.3,p.z)){ p.vx=-p.vx*.8; p.bounces++; } else p.x=nx; const nz=p.z+p.vz*dt; if(wallAt(p.x,nz+Math.sign(p.vz)*.3)){ p.vz=-p.vz*.8; p.bounces++; } else p.z=nz;
      const fl=baseFloor(p.x,p.z)+.3; p.vy-=14*dt; p.y+=p.vy*dt; if(p.y<fl){ p.y=fl; p.vy=-p.vy*.45; p.vx*=.8; p.vz*=.8; p.bounces++; } if(p.bounces>2) dead=true;
      for(const e of enemies){ if(e.dead) continue; if(Math.hypot(e.x-p.x,e.z-p.z)<e.r+.45&&Math.abs(e.y+e.h*.5-p.y)<e.h){ hurt(e,p.dmg,p.vx*.05,p.vz*.05); SFX.hit(); dead=true; break; } }
      p.mesh.rotation.x+=dt*9; p.mesh.position.set(p.x,p.y,p.z); }
    else if(p.kind==='turnip'){ p.life-=dt; p.vy-=18*dt; const nx=p.x+p.vx*dt, nz=p.z+p.vz*dt; p.y+=p.vy*dt; let hit=wallAt(nx,nz)||p.life<=0; if(!hit){ p.x=nx; p.z=nz; }
      if(!hit) for(const e of enemies){ if(e.dead) continue; if(Math.hypot(e.x-p.x,e.z-p.z)<e.r+.4&&p.y<e.y+e.h+.4){ hit=true; break; } }
      if(!hit&&p.y<=baseFloor(p.x,p.z)+.3) hit=true;
      if(hit){ turnipSplat(p); dead=true; } else { p.mesh.rotation.x+=dt*5; p.mesh.position.set(p.x,p.y,p.z); } }
    else if(p.kind==='splat'){ p.t+=dt; const k=p.t/.4; p.mesh.scale.set(2.2+k*2.8,2.2+k*2.8,1); p.mesh.material.opacity=.7*(1-k); dead=p.t>=.4; }
    else if(p.kind==='shock'){ p.t+=dt; const k=p.t/.45; p.mesh.scale.setScalar(.3+easeOut(k)*p.r); p.mesh.material.opacity=.6*(1-k); dead=p.t>=.45; }   // the trebuchet's splash ring (build 150)
    else if(p.kind==='spark'){ p.t+=dt; const k=p.t/.3; p.mesh.position.y+=dt*.8; p.mesh.scale.set(.9*(1-k*.5),.9*(1-k*.5),1); p.mesh.material.opacity=.75*(1-k); dead=p.t>=.3; }   // the spire's frostbite glint (build 150)
    else { p.t+=dt/p.dur; const t=Math.min(1,p.t); const x=lerp(p.x0,p.x1,t), z=lerp(p.z0,p.z1,t), y=lerp(p.y0,p.y1,t)+Math.sin(t*PI)*1.4; p.mesh.position.set(x,y,z); const t2=Math.min(1,t+.05); p.mesh.lookAt(lerp(p.x0,p.x1,t2),lerp(p.y0,p.y1,t2)+Math.sin(t2*PI)*1.4,lerp(p.z0,p.z1,t2));
      if(p.t>=1){ dead=true; if(p.hit.kind==='crystal') hurtCrystal(p.dmg,p.owner,p.hit.which); else if(p.hit.obj&&defs.includes(p.hit.obj)) hurtDef(p.hit.obj,p.dmg); else if(p.hit.kind==='hero'){ const R=(p.splash||1)+.6; if(hero.dead<=0&&Math.hypot(hero.x-p.x1,hero.z-p.z1)<R) hurtHero(p.dmg); for(const h of Meta.heroes()) if(!h.isDead()&&Math.hypot(h.x-p.x1,h.z-p.z1)<R) h.hurt(p.dmg); }   /* build 287: a bomb thrown at a hero hurts whoever is still in the blast */
        if(p.splash){ grenadeBurst(p.x1,p.y1,p.z1); const hitCrystal=Math.hypot(p.x1,p.z1)<p.splash; if(GOAL2>=0&&Math.hypot(p.x1-C2X,p.z1-C2Z)<p.splash&&!(p.hit.kind==='crystal'&&p.hit.which===2)) hurtCrystal(Math.round(p.dmg*.6*10)/10,p.owner,2); if(hitCrystal&&!(p.hit.kind==='crystal'&&!p.hit.which)) hurtCrystal(Math.round(p.dmg*.6*10)/10,p.owner); for(const d2 of defs){ if(d2===p.hit.obj) continue; if(Math.hypot(d2.x-p.x1,d2.z-p.z1)<p.splash+.6) hurtDef(d2,Math.round(p.dmg*.6*10)/10); } } /* the grenade bursts: everything nearby (not just what it was aimed at) takes half again what it hit */ } }
    if(dead){ scene.remove(p.mesh); projs.splice(i,1); } }
}
const MANA_ORB_MUL=1.25;   // every mob's mana orbs are worth this much more (a playtest ask); one place to retune, and the co-op orb grant reads it too
function spawnOrbs(x,z,n){ for(let k=0;k<n;k++){ const a=rnd()*TAU; const o={x,y:.8,z,vx:Math.cos(a)*2.5,vy:4+rnd()*2.5,vz:Math.sin(a)*2.5,mesh:orbMesh(),t:0}; o.mesh.position.set(x,.8,z); scene.add(o.mesh); orbs.push(o); } }
function updateOrbs(dt){
  for(let i=orbs.length-1;i>=0;i--){ const o=orbs[i]; o.t+=dt; const hd=Math.hypot(hero.x-o.x,hero.z-o.z);
    if(hero.dead<=0&&hd<(window.__autoMana?1e9:3.6)&&!(o.spill==='host'&&o.t<4)){ const tx=hero.x, ty=hero.y+1, tz=hero.z; const dx=tx-o.x, dy=ty-o.y, dz=tz-o.z, d=Math.hypot(dx,dy,dz); if(d<.7){ const v=o.val!==undefined?o.val:Math.round(5*MANA_ORB_MUL*(1+heroStat('mana')/100)*heroMult('mana')*10)/10; S.mana=Math.round((S.mana+v)*10)/10; SFX.mana(); floatText(o.x,o.y+.4,o.z,'+'+v,'#5ee9ff'); scene.remove(o.mesh); orbs.splice(i,1); continue; } const sp=11*dt/d; o.x+=dx*sp; o.y+=dy*sp; o.z+=dz*sp; }
    else { o.vy-=14*dt; const nx=o.x+o.vx*dt, nz=o.z+o.vz*dt; if(!solidAt(nx,nz,0,true)){ o.x=nx; o.z=nz; } else { o.vx=-o.vx*.5; o.vz=-o.vz*.5; } o.y+=o.vy*dt; const fl=baseFloor(o.x,o.z)+.3; if(o.y<fl){ o.y=fl; o.vy=-o.vy*.4; o.vx*=.7; o.vz*=.7; } }
    o.mesh.position.set(o.x,o.y+Math.sin(o.t*4)*.05,o.z); o.mesh.userData.o.rotation.y+=dt*3; }
}

// ================= LOOT =================
const LR=()=>Math.random();   // loot uses real randomness, not the seeded world rng
const RCOL=[0xcfcfcf,0x5ad05a,0x4a90ff,0xb050ff,0xffb830,0xff7ade], RCSS=['#d8d8d8','#5ad05a','#6aa8ff','#c070ff','#ffc040','#ff7ade'], RNAME=['Common','Uncommon','Rare','Epic','Legendary','Mythic'];   // Mythic (rarity 5, build 152): the hideout's forge alone makes it; the hall never drops it
const SLOTS=['weapon','armor','charm','amulet','familiar'], SICON={weapon:'⚔',armor:'🛡',charm:'🔮',amulet:'📿',familiar:'🦉'};
// build 314 (Matt: "on the bag, on the card, weapons are represented by crossing swords i need that to show bow, sword, staff or stave" -- "just that little emblem"): a weapon becomes whatever the hand
// holding it uses (80-weapons.js), so its emblem is the current hero's: the Ranger's bow, the Witch's and Fighter's staff, the Knight's sword -- or, on the Knight, a polearm piece's polearm (slotIcon)
const WEAPON_EMBLEM={sword:'🗡️',bow:'🏹',staff:'🪄',polearm:'🔱'};
function weaponKind(it){ const h=window.__heroes?window.__heroes.pick():'knight'; if(h==='troll') return 'bow'; if(h==='witch'||h==='fighter') return 'staff'; return it&&(it.look==='polearm'||/\bpolearm\b/i.test(it.name||''))?'polearm':'sword'; }
Object.defineProperty(SICON,'weapon',{get:()=>WEAPON_EMBLEM[weaponKind(null)],enumerable:true});
function slotIcon(it,slot){ const s=(it&&it.slot)||slot; return s==='weapon'?WEAPON_EMBLEM[weaponKind(it)]:SICON[s]; }
window.__emblem={slotIcon,kind:weaponKind,sicon:s=>SICON[s],card:(it,from)=>typeof tvCard==='function'?tvCard(it,from||'bag'):''};   // emblem-test.mjs
const BASES={weapon:['Shortsword','Broadsword','Cleaver','Warhammer','Halberd','Gnome Blade'],armor:['Jerkin','Chainmail','Breastplate','Plate Harness','Tower Plate','Warden Mail'],charm:['Charm','Talisman','Idol','Sigil','Lantern','Relic'],amulet:['Pendant','Amulet','Locket','Torc','Medallion','Heartstone'],familiar:['Wisp','Cave Bat','Moss Sprite','Fire Imp','Crystal Owl','Storm Drake']};
const PREFIX=[['Rusty','Plain','Worn','Sturdy','Old'],['Fine','Hardened','Keen','Polished'],['Gleaming','Runed','Tempered','Silvered'],['Ancient','Stormforged','Dragonbone','Moonlit'],['Mythic','Eternal','Goblinbane','Crystalheart']];
const SUFFIX=['of Goblin Slaying','of Embers','of Fury','of Stone','of Vigil','of Thorns'];   // flavour only; "of the …" names that mean a set come from 93-gearsets.js
const DROP={goblin:.075,archer:.15,orc:.33,ogre:1,drake:.45,troll:.42,trollboss:1}, OGRE2=.75;   // build 270 (Matt: "we just need more loot drops cuz we use gold for the upgrades too"): every ordinary gear drop 25% more likely again (goblin .06, archer .12, orc .264, drake .36, troll .336, the ogre's second piece .6), beside the new sludge jars (99g-sludgejars.js). Build 246 (Matt: "we made the fancy loot more rare now increase the trash loot, the random loot gen by 20%"): every ordinary gear drop 20% more likely than before (goblin .05, archer .10, orc .22, drake .30, troll .28; the ogre's second piece .5); the ogre's first piece and the troll boss's were already certain
 const LOOT_HOOK=3.2;   // how close a landed piece has to be before it flies to you
const STATL={dmg:v=>'+'+v+' dmg',spd:v=>'+'+v+'% swing',hp:v=>'+'+v+' hp',def:v=>'+'+v+'% armor',regen:v=>'+'+v+' hp/s',tow:v=>'+'+v+'% defenses',mana:v=>'+'+v+'% mana',move:v=>'+'+v+'% speed',fdmg:v=>v+' pet dmg',frate:v=>'+'+v+'% pet rate',trate:v=>'+'+v+'% defense speed',tarea:v=>'+'+v+'% defense range',fproj:v=>'+'+v+' pet projectile'+(v===1?'':'s')};
const STATW={dmg:3,spd:1,hp:.6,def:1.5,regen:4,tow:1.2,mana:.5,move:1.5,fdmg:2.5,frate:.8,trate:1.2,tarea:1.2,fproj:12}; const ROLLABLE=['dmg','spd','hp','def','regen','tow','mana','move','fdmg','frate'];
function heroStat(k){ let v=0; for(const s of SLOTS){ const it=gear[s]; if(it&&it.stats[k]) v+=it.stats[k]; } return v; }
function heroMult(k){ return 1+(Meta.mult(k)||0); }
function swingBase(){ return (useGLB&&GLBH&&GLBH.attackDur)?GLBH.attackDur:.38; }
function heroDmg(){ return Math.round((8+heroStat('dmg'))*heroMult('dmg')*(swingBase()/.38)*10)/10; }   // one decimal, like stat(d,'dmg'): a single Blade point (+8%) is visible on an 8-damage swing
function gearScore(){ let v=0; for(const s of SLOTS){ if(gear[s]) v+=gear[s].score; } return v; }
function swingDur(){ return swingBase()/((1+heroStat('spd')/100)*heroMult('spd')); }
function hitFrac(){ return (useGLB&&GLBH&&GLBH.hitFrac)||.32; }
function rollRarity(minR){ const w=Math.max(1,effWave()); const wt=[Math.max(25,64-1.2*w),25,8.5+.7*w,w>=3?2+.35*w:0,w>=6?.5+.12*w:0]; const tot=wt.reduce((a,b)=>a+b,0); let r=LR()*tot, i=0; while(i<4&&r>=wt[i]){ r-=wt[i]; i++; } return Math.max(minR||0,i); }
function rollStat(k,L,r){ const j=.8+LR()*.4; const v={dmg:(1.5+L*.6)*(1+r*.45),spd:5+r*6+L,hp:(8+L*4)*(1+r*.45),def:3+r*3+L*.6,regen:(.5+r*.5+L*.15)*10,tow:4+r*5+L*1.2,mana:10+r*8+L*1.5,move:3+r*2.5+L*.5,fdmg:(2+L*.8)*(1+r*.5),frate:8+r*8+L*1.5}[k]*j;
  return k==='regen'?Math.round(v)/10:Math.round(Math.min(k==='def'?45:k==='move'?40:999,v)); }
// tier: which bracket of waves an item belongs to (shop stock is sold by tier)
function tierOf(L){ return Math.min(5,1+Math.floor((Math.max(1,L)-1)/3)); }
function rollItem(minR,slot,lvl){ slot=slot||SLOTS[(LR()*SLOTS.length)|0]; const r=rollRarity(minR), L=Math.max(1,lvl||effWave());
  const pools={weapon:['dmg','spd'],armor:['hp','def','regen'],charm:['tow','mana','move'],amulet:['hp','regen','def','spd'],familiar:['fdmg','frate']}; const keys=pools[slot].slice(0,1+Math.min(r,pools[slot].length-1));
  if(r===4){ const others=ROLLABLE.filter(k=>!keys.includes(k)); keys.push(others[(LR()*others.length)|0]); }   /* a legendary's bonus stat comes from the stats a drop can roll; the forge-only ones (defense speed/range, pet projectiles) are bought, never rolled */
  const stats={}; keys.forEach(k=>{ stats[k]=rollStat(k,L,r); });
  const name=PREFIX[r][(LR()*PREFIX[r].length)|0]+' '+BASES[slot][Math.min(BASES[slot].length-1,(r+((LR()*2)|0)))]+(r>=1?' '+SUFFIX[(LR()*SUFFIX.length)|0]:'');
  let score=0; for(const k in stats) score+=stats[k]*STATW[k];
  const value=Math.round(10*(1+L*.5)*[1,2,4,8,16][r]);
  return {slot,rarity:r,lvl:L,tier:tierOf(L),name,stats,score:Math.round(score*10)/10,value,id:Math.floor(LR()*1e9).toString(36)+L.toString(36)}; }
function statStr(it){ return Object.keys(it.stats).map(k=>STATL[k](it.stats[k])).join(' · '); }
function lootMesh(it){ const g=new THREE.Group(); const col=RCOL[it.rarity]; const m=mat(col), steel=mat(0xc4ced9); const item=new THREE.Group(); item.position.y=.55;
  if(it.slot==='weapon'){ item.add(M(G.box(.1,.8,.04),steel,0,.15,0)); item.add(M(G.box(.34,.06,.08),m,0,-.25,0)); item.add(M(G.cyl(.035,.035,.22,6),mat(0x2b2540),0,-.39,0)); item.add(M(G.sph(.06,6,5),m,0,-.52,0)); }
  else if(it.slot==='armor'){ item.add(M(G.box(.5,.5,.28),m)); item.add(M(G.box(.54,.1,.32),steel,0,.28,0)); item.add(M(G.sph(.08,6,5),steel,0,.02,.16)); }
  else if(it.slot==='amulet'){ const chain=M(new THREE.TorusGeometry(.24,.03,6,16),steel,0,.1,0); chain.rotation.x=.3; item.add(chain); item.add(M(G.sph(.12,8,6),m,0,-.16,0)); item.add(M(G.box(.05,.09,.04),steel,0,-.02,0)); }
  else if(it.slot==='familiar'){ const egg=M(G.sph(.17,10,8),m,0,.02,0); egg.scale.set(.85,1.15,.85); item.add(egg); item.add(M(new THREE.TorusGeometry(.26,.025,5,16),steel,0,-.12,0)); item.add(M(G.sph(.05,6,5),steel,0,.25,0)); }
  else { item.add(M(new THREE.TorusGeometry(.2,.06,6,14),m)); item.add(M(G.sph(.09,8,6),steel,0,-.2,0)); }
  outline(item); g.add(item); g.userData.item=item;
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.14,.3,3.2,10,1,true),new THREE.MeshBasicMaterial({color:C(col),transparent:true,opacity:.22+it.rarity*.05,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); beam.position.y=1.6; beam.userData.noOL=true; g.add(beam);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.35,.55,20),new THREE.MeshBasicMaterial({color:C(col),transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); ring.rotation.x=-PI/2; ring.position.y=.05; ring.userData.noOL=true; g.add(ring); g.userData.ring=ring;
  const gl=glow(col,1.6+it.rarity*.35,.6); gl.position.y=.55; g.add(gl); return g; }
function dropLoot(it,x,z,gentle){ const a=LR()*TAU, sp=gentle?.6:2.2; const l={it,x,y:.6,z,vx:Math.cos(a)*sp,vy:gentle?3:5,vz:Math.sin(a)*sp,mesh:lootMesh(it),t:0}; l.mesh.position.set(x,.6,z); scene.add(l.mesh); loot.push(l); return l; }
// the wave-clear reward (a staging module may reshape it: 97b-setgate.js makes the Throne Room's wave 7 reward a set piece 80% of the time)
function waveRewardItem(){ return rollItem(effWave()%5===0?2:1); }
function rollDrop(e){ const ch=DROP[e.kind]||0; if(LR()<ch) dropLoot(rollItem(e.kind==='ogre'?(effWave()>=6?2:1):0),e.x,e.z); if(e.kind==='ogre'&&LR()<OGRE2) dropLoot(rollItem(1),e.x,e.z); }
window.__lootRates={table:DROP,ogre2:OGRE2,roll:e=>rollDrop(e),count:()=>loot.length,clear:()=>{ while(loot.length){ const l=loot.pop(); scene.remove(l.mesh); } }};
function lootToast(it,verb){ $('toast').innerHTML='<b style="color:'+RCSS[it.rarity]+'">'+it.name+'</b> · '+(it.procd&&window.__procHtml?window.__procHtml(statStr(it)):statStr(it))+' — '+verb; $('toast').style.opacity=1; toastT=3.4; }
function applyGear(){ const oldMax=hero.max; hero.max=Math.round((100+heroStat('hp'))*heroMult('hp')); if(hero.max>oldMax) hero.hp+=hero.max-oldMax; hero.hp=Math.min(hero.hp,hero.max); }
function saveGear(){ try{ localStorage.setItem('ddGear',JSON.stringify(gear)); }catch(e){} }
function loadGear(){ try{ const g=JSON.parse(localStorage.getItem('ddGear')); if(g&&typeof g==='object'){ for(const s of SLOTS){ const it=g[s]; if(it&&it.stats&&SLOTS.includes(it.slot)&&it.rarity>=0&&it.rarity<=4) gear[s]=it; } } }catch(e){} applyGear(); hero.hp=hero.max; }
function resetGear(){ gear={weapon:null,armor:null,charm:null,amulet:null,familiar:null}; saveGear(); applyGear(); }
function holdNag(l){ const d=Math.hypot(hero.x-l.x,hero.z-l.z); if(d<2.4&&S.t-(l.nagT===undefined?-99:l.nagT)>6){ l.nagT=S.t; toast('Bag is full of pieces you kept — make room to pick up '+l.it.name); } return true; }   // build 223: see Meta.holdsOnFloor
function pickup(l){ const it=l.it, cur=gear[it.slot];
  if(Meta.onPickup(it,l)) return;
  if(!cur||it.score>cur.score){ if(cur) S.mana+=cur.value; gear[it.slot]=it; applyGear(); saveGear(); SFX.loot(it.rarity); floatText(l.x,l.y+1,l.z,RNAME[it.rarity].toUpperCase()+' '+slotIcon(it),RCSS[it.rarity]); lootToast(it,cur?'equipped (old one sold for '+cur.value+' mana)':'equipped'); }
  else { S.mana+=it.value; SFX.mana(); floatText(l.x,l.y+.8,l.z,'+'+it.value,'#5ee9ff'); lootToast(it,'sold for '+it.value+' mana'); } }
function updateLoot(dt){
  for(let i=loot.length-1;i>=0;i--){ const l=loot[i]; l.t+=dt;
    // the hook: a piece within reach flies to the hero's hands once it has landed (no need to stand on it; the pull grows with pet-less patience: 3.2 units, or anywhere with the test magnet)
    if(hero.dead<=0&&l.t>.5&&l.vy<=.01&&!(Meta.holdsOnFloor&&Meta.holdsOnFloor(l.it)&&holdNag(l))){ const hd=Math.hypot(hero.x-l.x,hero.z-l.z), hy=Math.abs(hero.y-l.y); if(hd<(window.__autoMana?1e9:LOOT_HOOK)&&hy<4){ const tx=hero.x, ty=hero.y+.9, tz=hero.z, dx=tx-l.x, dy=ty-l.y, dz=tz-l.z, dd=Math.hypot(dx,dy,dz); if(dd<.6){ pickup(l); scene.remove(l.mesh); loot.splice(i,1); continue; } const sp=Math.min(1,10*dt/dd); l.x+=dx*sp; l.y+=dy*sp; l.z+=dz*sp; l.vx=0; l.vz=0; l.vy=0; l.mesh.position.set(l.x,l.y,l.z); l.mesh.userData.item.rotation.y+=dt*6; continue; } }
    l.vy-=14*dt; const nx=l.x+l.vx*dt, nz=l.z+l.vz*dt; if(!solidAt(nx,nz,0,true)){ l.x=nx; l.z=nz; } else { l.vx=-l.vx*.5; l.vz=-l.vz*.5; } l.y+=l.vy*dt; const fl=baseFloor(l.x,l.z); if(l.y<fl){ l.y=fl; l.vy=-l.vy*.3; l.vx*=.6; l.vz*=.6; }
    l.mesh.position.set(l.x,l.y,l.z); l.mesh.userData.item.position.y=.55+Math.sin(l.t*3)*.08; l.mesh.userData.item.rotation.y+=dt*2; l.mesh.userData.ring.scale.setScalar(1+Math.sin(l.t*4)*.08);
    if(l.mesh.userData.artSprite) l.mesh.userData.artSprite.position.y=.55+Math.sin(l.t*3)*.08;   // a set piece's card art bobs the same as the placeholder it replaced (a sprite always faces the camera, so no spin to match)
    if(hero.dead<=0&&Math.hypot(hero.x-l.x,hero.z-l.z)<1.15&&Math.abs(hero.y-l.y)<1.6&&!(Meta.holdsOnFloor&&Meta.holdsOnFloor(l.it)&&holdNag(l))){ pickup(l); scene.remove(l.mesh); loot.splice(i,1); } }
}
let gearHTML='';
function updateGearHUD(){ let h=''; for(const s of SLOTS){ const it=gear[s]; h+='<div class="gr"><span class="gi">'+slotIcon(it,s)+'</span>'+(it?'<span class="gn" style="color:'+RCSS[it.rarity]+'">'+it.name+'</span><span class="gs">'+statStr(it)+'</span>':'<span class="ge">no '+s+' yet</span>')+'</div>'; } if(h!==gearHTML){ gearHTML=h; $('gear').innerHTML=h; } }
loadGear();

// ================= WAVES =================
function waveComp(w){ const all=Object.keys(LANES); const mw=w-MAP.wbase; const lanes=all.some(k=>LANES[k].from)?all.filter(k=>(LANES[k].from||1)<=mw):(w<2?all.slice(0,1):w<4?all.slice(0,2):all); /* a map can say which of its waves each gate opens on (feeders join as the climb goes on); otherwise the gates open one, two, all */ /* build 176, Survival: past = how far this wave is past the map's own count (0 in the campaign, and on Survival's first waves, which are
     the campaign's exactly). Past the map every formula below keeps climbing as it always did, its campaign cap lifted to a higher
     Survival one (cap(): goblins 180, orcs 60, bandits 30, drakes 12 -> 30 and troll archers 4 -> 14 a little more each wave, ogres a
     few more every sixth), and the spawns come closer together (pace) so a big wave is a flood, not a two-minute trickle. Every tenth
     wave is a BOSS WAVE: a troll boss leads it out and a guard of ogres (one per ten waves) follows it */
  const past=survivalPast(mw), cap=(n,c)=>past?Math.min(c,n):n, pace=past?Math.max(.4,1-.015*past):1, bossW=SURVIVAL&&mw>0&&mw%10===0;
  const q=[]; let t=w===1?2.5:1.5; const n=cap(w===1?5:6+3*w,180); const gap=(w===1?1.1:Math.max(.35,.8-.03*w))*(past?Math.max(.6,1-.01*past):1);   /* wave one is a gentle on-ramp: five goblins, a slower trickle, more time to build first — the climb picks up from wave two */ for(let i=0;i<n;i++){ q.push({t,kind:'goblin',lane:lanes[i%lanes.length]}); t+=gap; }
  const orcs=cap(w>=2?w-1:0,60); for(let i=0;i<orcs;i++) q.push({t:3+i*2.2*pace,kind:'orc',lane:lanes[(i+1)%lanes.length]});
  const arch=cap(w>=3?Math.floor(w/2):0,30); for(let i=0;i<arch;i++) q.push({t:4+i*1.8*pace,kind:'archer',lane:lanes[i%lanes.length]});
  const ogres=Math.min(6,(w>=4&&(w-4)%3===0?(w>=10?2:1):0)+Math.floor(past/6)); for(let i=0;i<ogres;i++) q.push({t:t+2+i*4*pace,kind:'ogre',lane:i===0?lanes[0]:i===1?lanes[lanes.length-1]:lanes[i%lanes.length]});
  const drakes=w>=6?Math.min(past?Math.min(30,12+Math.floor(past/2)):12,Math.floor((w-3)/1.5)):0;   /* drakes are frail (32 hp) but come in growing flights: 2 on the sixth wave, 6 by the twelfth, a dozen by the twenty-first */ for(let i=0;i<drakes;i++) q.push({t:6+i*3*pace,kind:'drake',lane:lanes[(i+2)%lanes.length]});   // from the eighth-ish wave the sky joins in
  const trolls=w>=8?Math.min(past?Math.min(14,4+Math.floor(past/4)):4,1+Math.floor((w-8)/3)):0; for(let i=0;i<trolls;i++) q.push({t:5+i*4*pace,kind:'troll',lane:lanes[(i+3)%lanes.length]});   // troll archers: tougher, longer-ranged bowmen, one every third wave from the eighth, capped at four
  const boss=bossW||(w>=12&&(w-12)%5===0)?1:0; for(let i=0;i<boss;i++) q.push({t:bossW?1:t+7,kind:'trollboss',lane:lanes[0]});   // the lavender healer: rare (every fifth wave from the twelfth), never more than one — mend-the-horde means it has to die first (a Survival boss wave's leads the wave out, first through the gate)
  const guard=bossW?Math.max(1,Math.floor(mw/10)):0; for(let i=0;i<guard;i++) q.push({t:2.5+i*1.5,kind:'ogre',lane:lanes[i%lanes.length]});   // the boss's guard of ogres, right behind it
  q.sort((a,b)=>a.t-b.t);
  const og=ogres+guard, parts=['Goblins ×'+n]; if(orcs) parts.push('Orcs ×'+orcs); if(arch) parts.push('Bandits ×'+arch); if(drakes) parts.push('Drakes ×'+drakes); if(trolls) parts.push('Troll Archers ×'+trolls); if(og) parts.push(og===1?'AN OGRE':og===2?'TWO OGRES':'OGRES ×'+og); if(boss) parts.push('A TROLL BOSS');
  const gates=lanes.map(l=>LANES[l].name||l).join(' + ')+' gate'+(lanes.length>1?'s':'');
  return {q,boss:bossW,desc:(bossW?'☠ BOSS WAVE · ':'')+parts.join(' · ')+'  —  '+gates}; }
function startWave(){ if(S.held){ moveOn(); return; }   /* build 160: on the victory lap the horn is MOVE ON -- the G key, the 📯 button (it reads ▶ MOVE ON then) and anything else that sounds it; by name, so 99-network.js's wrap of moveOn runs */
  if(S.phase!=='build') return; S.wave++; S.phase='wave'; S.waveT=0; const c=waveComp(effWave()); spawnQ=c.q; banner((SURVIVAL?(c.boss?'☠ BOSS WAVE ':'SURVIVAL · WAVE '):'WAVE ')+S.wave+' OF '+runWaves(),c.desc); SFX.horn(); setMusic('wave'); cancelPlace(); }
function updateWave(dt){ if(S.phase!=='wave') return; S.waveT+=dt; let live=SURVIVAL?enemies.reduce((a,e)=>a+(e.dead?0:1),0):0;
  while(spawnQ.length&&spawnQ[0].t<=S.waveT){ if(SURVIVAL&&live>=SURVIVAL_LIVE) break; /* build 176: Survival's cap on the living -- the rest wait at the gate and come out as the hall thins them (the campaign never needs it) */ const s=spawnQ.shift(); spawnEnemy(s.kind,s.lane); live++; }
  if(!spawnQ.length&&!enemies.some(e=>!e.dead)){ const bonus=50+10*effWave(); S.mana+=bonus; dropLoot(waveRewardItem(),R(-1.6,1.6),4.6,true); Meta.onWaveHeld(effWave());
    if(S.wave>=runWaves()) winMap(); else { S.phase='build'; banner('HALL HELD','wave '+S.wave+' of '+runWaves()+' repelled  ·  +'+bonus+' mana  ·  a reward drops by the Heartroot'); setMusic('build'); SFX.held(); } } }
// the last wave of a map held: the map is cleared, the next one unlocks, the run is paid -- and the hall stays open.
// Build 160, Matt after his first hall: it said HALL HELD and then "didn't let me walk around or have any control of moving on" --
// "you should be able to walk around and collect mana, spend your gold on upgrades, maybe even go to the hideout and back and move
// on to the next map at your discretion". So holding the map starts a VICTORY LAP instead of ending the run: S.held, and the phase
// goes back to 'build', so everything that already works between waves just works -- walking, the orbs and the loot on the floor,
// placing/upgrading/repairing/selling, the bag, the tavern stations, the raven, the hideout portal there and back -- with no waves
// left to start. What must not wait for the player is done here: ddMapsCleared, and the win's gold (Meta.onMapHeld, 10-meta.js),
// so closing the tab mid-lap loses nothing. The tally (NEXT MAP / TAVERN / REPLAY) waits for MOVE ON (moveOn, below): the horn
// button reads ▶ MOVE ON on the lap, and it or G ends the run the way the last wave used to. Nothing else can: hurtCrystal ignores
// a held hall, and no mob is left to hurt it -- whatever a direct call (a test's __dd.winMap() mid-wave) leaves walking goes quietly
function winMap(){ if(S.held) return; S.held=true; S.heldAt=performance.now(); S.phase='build'; spawnQ=[]; for(const e of enemies) if(!e.dead){ e.through=true; e.dead=.001; }
  if(SURVIVAL) banner('SURVIVAL COMPLETE','all '+S.wave+' waves held  ·  '+MAP.name+' stands'); else banner('HALL HELD','the horde broke on wave '+S.wave+'  ·  '+MAP.name+' is yours'); SFX.held(); setTimeout(()=>SFX.horn(),500); setMusic('build'); droneOff();
  if(!TUTORIAL){ if(!SURVIVAL) try{ localStorage.setItem('ddMapsCleared',String(Math.max(MAPS_CLEARED,MAPI+1))); }catch(e){}   /* build 166: the tutorial hall is not map one -- holding it unlocks nothing (no heroes, no map two) */   /* build 176: nor does Survival -- it is played on a map already cleared, and it never moves the campaign */
    Meta.onMapHeld(effWave(),{won:true,map:MAPI,mapName:MAP.name,hasNext:!SURVIVAL&&MAPI+1<MAPS.length}); }   // nor pays a campaign win or sets a best wave: its waves pay as they are held, like any other
  setTimeout(()=>{ if(S.held&&S.phase==='build'&&!TUTORIAL) toast('The hall is yours — walk it, collect, spend, visit the hideout. '+(TOUCH?'Tap ▶ MOVE ON':'G (or ▶ MOVE ON)')+' when you are ready'); },3600); }   // after the banner has had its moment
// MOVE ON (build 160): the lap is over when the player says so -- the run ends as the held last wave used to end it: the phase 'won'
// (update() stops the hall), the mouse freed, and Meta.onRunEnd's tally (it knows the gold went out at HALL HELD and pays nothing twice)
function moveOn(){ if(!S.held||S.phase!=='build') return; S.phase='won'; cancelPlace(); setMusic('none'); droneOff();
  if(document.pointerLockElement&&document.exitPointerLock) document.exitPointerLock(); document.body.classList.remove('play');
  const shown=Meta.onRunEnd(effWave(),{won:true,map:MAPI,mapName:MAP.name,hasNext:!SURVIVAL&&MAPI+1<MAPS.length}); /* build 176: a Survival run offers no NEXT MAP (the next map may not be open, and Survival is a map's own challenge) */ if(!shown){ $('deadwave').textContent=S.wave; $('dead').classList.remove('hide'); } }

// ================= PLACEMENT / REPAIR / SELL =================
function select(kind){ if(S.phase==='start'||S.phase==='dead'||S.phase==='won'||S.phase==='deathcut') return; if(placing===kind){ cancelPlace(); return; } cancelPlace(); placing=kind; ghost=makeDef(kind,true); scene.add(ghost); const cfg=DEFS[kind]; ghostSector=sectorMesh(cfg.range||0,cfg.arc||360,0x40ff80); scene.add(ghostSector); ghostRot=0; placeStage=0; anchorPos=null; updateGhost(); }
function cancelPlace(){ if(ghost){ scene.remove(ghost); ghost=null; } if(ghostSector){ scene.remove(ghostSector); ghostSector=null; } placing=null; placeStage=0; anchorPos=null; }
function updateHoverSector(){ const d=placing?null:pickDef(); if(d!==hoverFor){ if(hoverSector){ scene.remove(hoverSector); hoverSector=null; } hoverFor=d; if(d&&DEFS[d.kind].range){ hoverSector=sectorMesh(stat(d,'range'),arcOf(d),0xe8b94a); hoverSector.position.set(d.x,d.base,d.z); hoverSector.rotation.y=d.rot; scene.add(hoverSector); } }
  pickRing(d); }
// the tower E / 🔧 / X will act on (build 165, Matt: "when you're trying to heal a tower mid wave it's very difficult to target a
// specific tower if there are several"). It was simply the nearest within reach. Now, among the towers within reach: a hurt one
// before a whole one (a hurt one mid-wave is what you came for -- E repairs first), then the one the gnome is facing, then the
// nearest. A guest's action (99-network.js) passes where it stands and, if it sent one, its facing. The same pick drives the
// range outline, the tower card (60-lootfeel.js) and a ring on the floor under it, so what you see is what the key will hit
function pickDef(pos){ pos=pos||hero; const yaw=pos===hero?hero.yaw:pos.yaw; const fx=Number.isFinite(yaw)?Math.sin(yaw):0, fz=Number.isFinite(yaw)?Math.cos(yaw):0; let best=null, bs=1e9;
  for(const d of defs){ const dx=d.x-pos.x, dz=d.z-pos.z, dist=Math.hypot(dx,dz); if(dist>=3.4) continue;
    const facing=dist>.05&&(fx||fz)?(1-(dx*fx+dz*fz)/dist):1;   // 0 dead ahead .. 2 right behind
    const sc=(d.hp<d.max?0:10)+facing*1.6+dist*.35; if(sc<bs){ bs=sc; best=d; } }
  return best; }
let pickRingM=null;
function pickRing(d){ if(!d||!defs.includes(d)){ if(pickRingM) pickRingM.visible=false; return; }
  if(!pickRingM){ pickRingM=new THREE.Mesh(new THREE.RingGeometry(.82,1,40),new THREE.MeshBasicMaterial({color:0xe8b94a,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})); pickRingM.rotation.x=-PI/2; pickRingM.userData.noOL=true; scene.add(pickRingM); }
  const hurt=d.hp<d.max, r=d.kind==='slice'?stat(d,'range')*.55:1.25; pickRingM.visible=true; pickRingM.material.color.setHex(hurt?0x5ef0a0:0xe8b94a); pickRingM.scale.set(r,r,r); pickRingM.position.set(d.x,d.base+.06,d.z); pickRingM.material.opacity=.45+.25*Math.sin(S.t*6); }   // green: E repairs it, gold: E upgrades it
function unstick(){ if(placeStage===1){ placeStage=0; anchorPos=null; ghostRot=anchorYaw-cam.yaw; } }
function rotateGhost(a){ if(placeStage===1) anchorYaw+=a; else ghostRot+=a; }
function updateGhost(){ if(!placing) return; const [px,pz]=placeStage===1?anchorPos:aimPoint(); const cx=wc(px), cz=wcz(pz); const t=gat(cx,cz), cfg=DEFS[placing]; let reason='';
  const yaw=placeStage===1?anchorYaw:cam.yaw+ghostRot; const cells=footprintCells(placing,px,pz,yaw); const heroCell=idx(wc(hero.x),wcz(hero.z));
  // build 196 (Matt: "if your too close to a placeable when you put it down you get trapped in its box"): this used to
  // be a flat 1.1-unit circle from the placement point regardless of the defense's real shape -- fine for a round
  // tower (barely: 1.1 only just clears the new DEF_HERO_R+hero radius, ~1.04), but the bramble hedge spans far
  // more than 1.1 units along its own length (DEF_HERO_HEDGE_LEN), so standing that "safe" distance away ALONG the
  // hedge still left you inside its real collision zone the instant it landed. Ask the same function solidAt uses
  // to decide it instead of guessing a circle: would the hero's own current spot actually be blocked by this exact
  // defense, in this exact spot and orientation, once it exists
  if(!(t===T.FLOOR||t===T.CARPET)||cells.some(i=>!walk(grid[i]))) reason="Can't build there"; else if(cells.some(i=>defAt[i])) reason='Already occupied'; else if(cells.includes(heroCell)||defBlocksHero({x:px,z:pz,rot:yaw,kind:placing},hero.x,hero.z)) reason="You're standing there"; else if(S.du+cfg.du>DU_CAP) reason='Not enough Defense Units'; else if(S.mana<cfg.mana) reason='Not enough mana'; else if(enemies.some(e=>!e.dead&&Math.hypot(e.x-px,e.z-pz)<2.2)) reason='Enemy too close';
  ghostOk=!reason; ghostReason=reason; ghostCell=[cx,cz]; ghostPos=[px,pz]; ghostYaw=yaw;
  ghost.position.set(px,standH(cells,px,pz),pz); ghost.rotation.y=ghostYaw; const m=ghostOk?GHOST_OK:GHOST_BAD; ghost.traverse(o=>{ if(o.isMesh) o.material=m; });
  if(ghostSector){ ghostSector.position.set(px,baseFloor(px,pz),pz); ghostSector.rotation.y=ghostYaw; tintSector(ghostSector,ghostOk?0x40ff80:0xff3030); } }
function confirmPlace(){ if(!placing) return; if(!ghostOk){ toast(ghostReason); return; }
  if(placeStage===0){ anchorPos=[ghostPos[0],ghostPos[1]]; anchorYaw=ghostYaw; placeStage=1; SFX.hit(); updateGhost(); return; }   // first click: set it down
  placeDefAt(placing,ghostPos[0],ghostPos[1],ghostYaw); floatText(ghostPos[0],2.2,ghostPos[1],DEFS[placing].name,'#e8b94a'); cancelPlace(); }
// co-op: pos defaults to the local hero so every existing single-player call site (keyboard, prompts, the hover
// sector) behaves exactly as before — a guest's relayed repair/upgrade/sell just passes their own position instead,
// reusing this single real implementation rather than a second, drift-prone copy of the cost/effect math
function nearestDef(rad,pos){ pos=pos||hero; let best=null, bd=rad; for(const d of defs){ const dd=Math.hypot(d.x-pos.x,d.z-pos.z); if(dd<bd){ bd=dd; best=d; } } return best; }
function repair(pos){ const d=pickDef(pos); if(!d) return; if(d.hp>=d.max){ toast('Already at full health'); return; } const cost=Math.ceil((d.max-d.hp)/8); if(S.mana<cost){ toast('Need '+cost+' mana to repair'); return; } S.mana-=cost; d.hp=d.max; SFX.place(); floatText(d.x,d.top+.8,d.z,'REPAIRED','#5ee9ff'); floatText(d.x,d.top+1.6,d.z,'-'+cost+' ◆ mana','#5ee9ff'); }
function sell(pos){ const d=pickDef(pos); if(!d) return; const back=Math.round(d.spent*.7); S.mana+=back; removeDef(d); SFX.sell(); floatText(d.x,2,d.z,'+'+back+' mana','#5ee9ff'); }

// ================= FX / HUD / OVERLAY =================
function updateFx(dt){ S.t+=dt; const t=S.t;
  flames.forEach((f,i)=>{ const s=1+Math.sin(t*13+f.p)*.18+Math.sin(t*7.3+f.p*2)*.1; f.f.scale.set(1,s,1); f.f2.scale.set(1,1.1-(s-1),1); }); WORLDANIM.forEach(f=>f(dt,t));
  torchLights.forEach((l,i)=>{ l.intensity=l.userData.base*(.92+Math.sin(t*9+i*1.7)*.05+Math.sin(t*23+i)*.04); });
  const cg=crystalG.userData.cg; cg.rotation.y=t*.7; cg.position.y=(crystalG.userData.cgY||2.7)+Math.sin(t*1.6)*.15+(crystalShake>0?(rnd()-.5)*.3:0); crystalShake=Math.max(0,crystalShake-dt);
  for(let k=0;k<4;k++){ const s=crystalG.userData['s'+k]; const a=s.userData.a+t*1.4; s.position.set(Math.cos(a)*1.7,Math.sin(t*2+k)*.5,Math.sin(a)*1.7); s.rotation.y=t*3; }
  crystalMesh.material.emissiveIntensity=S.phase==="dead"?.1:.55+Math.sin(t*3)*.15+(crystalShake>0?.6:0);
  portals.forEach(p=>{ p.ring.rotation.z=t*1.2; p.pulse=Math.max(0,(p.pulse||0)-dt*2); const s=1+p.pulse*.35; p.ring.scale.set(s,s,1); p.disc.material.opacity=.85+Math.sin(t*4)*.08; });
  bannerT-=dt; if(bannerT<0&&bannerT>-1){ $('banner').style.opacity=0; bannerT=-2; } toastT-=dt; if(toastT<0&&toastT>-1){ $('toast').style.opacity=0; toastT=-2; }
  dmgFlash=Math.max(0,dmgFlash-dt*2.5); $('dmg').style.opacity=dmgFlash;
  for(let i=floats.length-1;i>=0;i--){ const f=floats[i]; f.t+=dt; if(f.t>1.1) floats.splice(i,1); }
}
const hud={}; function setT(id,v){ if(hud[id]!==v){ hud[id]=v; $(id).textContent=v; } }
function updateHUD(){ const cw_=Math.max(0,S.crystal/CRYSTAL_MAX*100)+'%'; if(hud.cbar!==cw_){ hud.cbar=cw_; $('cbar').style.width=cw_; } const hw=(hero.hp/hero.max*100)+'%'; if(hud.hbar!==hw){ hud.hbar=hw; $('hbar').style.width=hw; }
  setT('mana',Math.floor(S.mana)); setT('du',S.du+'/'+DU_CAP); updateGearHUD();
  const alive=enemies.filter(e=>!e.dead).length+spawnQ.length;
  const heldT=SURVIVAL?'SURVIVAL COMPLETE — '+MAP.name+' STANDS':'HALL HELD — '+MAP.name+' CLEARED';   // build 176
  if(S.phase==='wave'){ setT('wavet',(SURVIVAL?'SURVIVAL · WAVE ':'WAVE ')+S.wave+' / '+runWaves()); setT('phaset',alive+' enem'+(alive===1?'y':'ies')+' left'); } else if(S.phase==='won'){ setT('wavet',heldT); setT('phaset',''); } else if(S.held){ setT('wavet',heldT); setT('phaset',TOUCH?'The hall is yours — tap ▶ MOVE ON when ready':'The hall is yours — walk, collect, spend · G moves on when you are ready'); } else if(S.phase==='build'){ setT('wavet',S.wave?'HALL HELD — BUILD PHASE':'BUILD PHASE'); setT('phaset',TOUCH?'Place defenses, then tap 📯':'Place defenses (1–7), then press G to sound the horn'); }
  DEFKEYS.forEach(k=>{ const el=$('slot-'+k), cfg=DEFS[k]; const cls='slot'+(placing===k?' sel':'')+((S.mana<cfg.mana||S.du+cfg.du>DU_CAP)?' poor':''); if(el.className!==cls) el.className=cls; });
  let pr=''; if(placing){ pr=placeStage===1?(ghostOk?(TOUCH?'Drag or ↻ to turn it  ·  tap ✔ to build':'Move the mouse, R or wheel to turn it  ·  click to build  ·  right-click to pick it up'):ghostReason):(ghostOk?(TOUCH?'Tap ✔ to set it down · look to aim':'Click to set it down  ·  look to aim  ·  Esc cancel'):ghostReason); } else { const d=nearestDef(3.4); if(d){ const cost=Math.ceil((d.max-d.hp)/8); pr=DEFS[d.kind].name+(d.lvl>1?' Mk '+MARK[d.lvl]:'')+'  '+Math.ceil(d.hp)+'/'+d.max+(cost?'  ·  E repair ('+cost+' mana)':(d.lvl<MAXLVL?'  ·  E upgrade ('+upCost(d)+' mana)':''))+'  ·  X sell (+'+Math.round(d.spent*.7)+')'; } }
  setT('prompt',pr); const wb=S.phase!=='build'; if(hud.wb!==wb){ hud.wb=wb; $('wavebtn').disabled=wb; }
  setT('wavebtn',S.held?'▶ MOVE ON':'📯 START WAVE');   // build 160: the horn button on the victory lap (a co-op guest's reads the host's lap, 99-network.js)
}
const PV=new THREE.Vector3();
function proj(x,y,z){ PV.set(x,y,z).project(camera); if(PV.z>1) return null; return [(PV.x+1)/2*ov.width,(1-PV.y)/2*ov.height]; }
function drawOverlay(){ ovx.clearRect(0,0,ov.width,ov.height); if(S.phase==='start') return;
  const bar=(p,w,frac,col)=>{ ovx.fillStyle='#120c1a'; ovx.fillRect(p[0]-w/2-1,p[1]-4,w+2,7); ovx.fillStyle=col; ovx.fillRect(p[0]-w/2,p[1]-3,w*clamp(frac,0,1),5); };
  for(const e of enemies){ if(e.dead||e.hp>=e.max) continue; const p=proj(e.x,e.y+e.h+.35,e.z); if(p) bar(p,(e.kind==='ogre'||e.kind==='trollboss')?80:40,e.hp/e.max,'#e03a3a'); }
  for(const d of defs){ if(d.hp>=d.max) continue; const p=proj(d.x,d.top+.5,d.z); if(p) bar(p,44,d.hp/d.max,'#5ad05a'); }
  ovx.font='bold 17px Georgia,serif'; ovx.textAlign='center'; ovx.lineWidth=3; ovx.strokeStyle='#120c1a';
  for(const f of floats){ const p=proj(f.x,f.y+f.t*1.2,f.z); if(!p) continue; ovx.globalAlpha=clamp(1.4-f.t,0,1); ovx.fillStyle=f.col; ovx.strokeText(f.txt,p[0],p[1]); ovx.fillText(f.txt,p[0],p[1]); } ovx.globalAlpha=1;
}

// ================= INPUT =================
const K={};
addEventListener('keydown',e=>{ const c=e.code; if(Meta.isOpen()) return; if(c==='KeyI'||c==='KeyB'){ if(!e.repeat) Meta.open(); return; } if(S.phase==='start'){ if(c==='Enter'||c==='Space'){ e.preventDefault(); play(); } return; }
  if(c==='KeyW'||c==='ArrowUp') K.w=1; if(c==='KeyS'||c==='ArrowDown') K.s=1; if(c==='KeyA') K.a=1; if(c==='KeyD') K.d=1; if(c==='ShiftLeft'||c==='ShiftRight') K.shift=1; if(c==='ArrowLeft') K.tl=1; if(c==='ArrowRight') K.tr=1;
  if(c==='Space'){ jump(); e.preventDefault(); }
  if(c==='Digit1') select('harpoon'); if(c==='Digit2') select('acorn'); if(c==='Digit3') select('ball'); if(c==='Digit4') select('slice'); if(c==='Digit5') select('spike'); if(c==='Digit6') select('totem'); if(c==='Digit7') select('frost'); if(c==='Digit8') select('snare'); if(c==='Digit9') select('zap'); if(c==='Digit0') select('venom'); if(c==='Minus') select('ember'); if(c==='Equal') select('dazzle');
  if(c==='KeyR'){ rotateGhost(PI/12); } if(c==='Escape') cancelPlace(); if(c==='KeyG'&&!(S.held&&performance.now()-(S.heldAt||0)<2000)) startWave(); /* a G already on its way as the last mob falls doesn't skip the lap (build 160) */ if(c==='KeyE') upgrade(); if(c==='KeyX') sell(); if(c==='KeyM') setSound(soundOff); if(c==='KeyN') toggleMusic(); if(c==='KeyF'||c==='KeyQ') swing(); if(c==='KeyH'){ if(window.__raven&&window.__raven.near()) window.__heroes.next(); else toggleHero(); } });
addEventListener('keyup',e=>{ const c=e.code; if(c==='KeyW'||c==='ArrowUp') K.w=0; if(c==='KeyS'||c==='ArrowDown') K.s=0; if(c==='KeyA') K.a=0; if(c==='KeyD') K.d=0; if(c==='ShiftLeft'||c==='ShiftRight') K.shift=0; if(c==='ArrowLeft') K.tl=0; if(c==='ArrowRight') K.tr=0; });
addEventListener('blur',()=>{ for(const k in K) K[k]=0; });
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('mousedown',e=>{ if(TOUCH||S.phase==='start'||S.phase==='dead'||S.phase==='won'||S.phase==='deathcut'||Meta.isOpen()) return; mouseDown=true; if(!locked&&canvas.requestPointerLock) canvas.requestPointerLock();
  if(e.button===0){ if(placing) confirmPlace(); else swing(); } else if(e.button===2){ if(placing){ if(placeStage===1) unstick(); else cancelPlace(); } else specialPress(); } });   /* build 182: right-click starts charging the special instead of swinging (placement-cancel is unchanged) */
addEventListener('mouseup',e=>{ mouseDown=false; if(e.button===2) specialRelease(); });
addEventListener('mousemove',e=>{ if(TOUCH||S.phase==='start'||Meta.isOpen()) return; edgeX=e.clientX/innerWidth; const dx=e.movementX||0, dy=e.movementY||0; if(placing&&placeStage===1){ anchorYaw-=dx*SENS*1.6; return; } cam.yaw-=dx*SENS; cam.pitch=clamp(cam.pitch+dy*SENS,CAM_PITCH_MIN,1.15); });
addEventListener('wheel',e=>{ if(S.phase==='start'||Meta.isOpen()) return; const s=Math.sign(e.deltaY); if(placing) rotateGhost(s*PI/12); else cam.dist=clamp(cam.dist+s*.8,4,12); },{passive:true});
document.addEventListener('pointerlockchange',()=>{ locked=document.pointerLockElement===canvas; document.body.classList.toggle('play',locked); });
// touch: left half joystick, right half look
canvas.addEventListener('touchstart',e=>{ for(const t of e.changedTouches){ if(t.clientX<innerWidth/2&&joy.id===null){ joy.id=t.identifier; joy.ox=t.clientX; joy.oy=t.clientY; } else if(lookId===null){ lookId=t.identifier; lookX=t.clientX; lookY=t.clientY; } } e.preventDefault(); },{passive:false});
canvas.addEventListener('touchmove',e=>{ for(const t of e.changedTouches){ if(t.identifier===joy.id){ let dx=t.clientX-joy.ox, dy=t.clientY-joy.oy; const l=Math.hypot(dx,dy); if(l>50){ dx*=50/l; dy*=50/l; } joy.x=dx/50; joy.y=-dy/50; $('joy').firstElementChild.style.transform='translate('+dx+'px,'+dy+'px)'; }
  else if(t.identifier===lookId){ if(placing&&placeStage===1){ anchorYaw-=(t.clientX-lookX)*.01; } else { cam.yaw-=(t.clientX-lookX)*.007; cam.pitch=clamp(cam.pitch+(t.clientY-lookY)*.007,CAM_PITCH_MIN,1.15); } lookX=t.clientX; lookY=t.clientY; } } e.preventDefault(); },{passive:false});
const touchEnd=e=>{ for(const t of e.changedTouches){ if(t.identifier===joy.id){ joy.id=null; joy.x=joy.y=0; $('joy').firstElementChild.style.transform=''; } if(t.identifier===lookId) lookId=null; } };
canvas.addEventListener('touchend',touchEnd); canvas.addEventListener('touchcancel',touchEnd);
DEFKEYS.forEach((k,i)=>{ const cfg=DEFS[k]; const s=document.createElement('div'); s.className='slot'; s.id='slot-'+k; s.innerHTML='<div class="k">'+DEFKEY_LABELS[i]+'</div><div class="ic">'+cfg.ic+'</div><div class="n">'+cfg.name+'</div><div class=\"cst\">🌱 '+cfg.du+' · '+cfg.mana+' ◆</div>'; s.addEventListener('click',()=>select(k)); $('hotbar').appendChild(s); });
if(TOUCH){ [['⚔',()=>swing()],['⤴',()=>jump()],['✔',()=>{ if(placing) confirmPlace(); }],['↻',()=>{ rotateGhost(PI/4); }],['🔧',()=>upgrade()],['🎒',()=>Meta.open()]].forEach(   /* by NAME at the tap, not the function as it stood here (build 159, Matt on his iPad: "the wrench doesn't work"): the modules load after this line and wrap swing/upgrade -- the portal, the tavern stations, the raven, a co-op guest's relayed swing and repair -- and the buttons were still holding the bare originals */([t,f])=>{ const b=document.createElement('div'); b.className='hb'; b.textContent=t; b.addEventListener('touchstart',e=>{ e.preventDefault(); f(); },{passive:false}); $('btns').appendChild(b); }); }
$('wavebtn').addEventListener('click',()=>{ startWave(); if(!TOUCH&&S.phase!=='won'&&canvas.requestPointerLock) canvas.requestPointerLock(); });   // build 160: not after a MOVE ON -- the tally needs the mouse
function play(){ if(S.phase!=='start') return; S.phase='build'; $('start').classList.add('hide'); SFX.enter(); setTimeout(()=>setMusic('build'),400); if(heroLoadError) setTimeout(()=>toast('Hero model failed to load ('+heroLoadError+') — using the old gnome'),600); if(!TOUCH&&canvas.requestPointerLock){ const r=canvas.requestPointerLock(); if(r&&r.catch) r.catch(()=>{}); }   /* build 166: a hall that starts by itself (89-tutorial.js: the tutorial, and room one after it) has no click to capture the mouse with -- the browser says no (a rejected promise in newer Chrome), and the first click in the hall captures it instead */ cam.x=hero.x; cam.y=hero.y+5; cam.z=hero.z+8; cam.d=cam.dist; if(!TUTORIAL) toast('Build phase — pick a defense with the number keys, then G to start the wave'); }   // build 166: the tutorial hall says one thing at a time (89-tutorial.js), and it isn't this
$('playbtn').addEventListener('click',play); $('tavbtn').addEventListener('click',()=>Meta.open()); $('bagbtn').addEventListener('click',()=>Meta.open());

// ================= MAIN LOOP =================
function update(dt){ if(S.phase==='start'){ updateFx(dt); updateCamera(dt); return; }
  if(S.phase==='deathcut'){ updateFx(dt); updateDeathCut(dt); updateHUD(); return; }
  if(S.phase!=='dead'&&S.phase!=='won'&&(!Meta.isOpen()||Meta.sharedHall())){ /* the tavern pauses the hall: nothing walks, swings or fires behind the overlay -- except a co-op host's with guests in it (build 159): their hall runs on, and the host's gnome just stands (99-network.js clears its keys) */ if(!Meta.isOpen()){ if(!TOUCH&&!locked&&S.phase!=='start'){ if(edgeX<.1) cam.yaw+=1.6*dt; else if(edgeX>.9) cam.yaw-=1.6*dt; } if(K.tl) cam.yaw+=2.2*dt; if(K.tr) cam.yaw-=2.2*dt; }   /* no camera pan from under a menu: the mouse's last spot (edgeX) is stale there */
    heroUpdate(dt); updateDefs(dt); updateEnemies(dt); updateProj(dt); updateOrbs(dt); updateLoot(dt); updateWave(dt); updateGhost(); updateHoverSector(); Meta.update(dt); }
  updateFx(dt); updateCamera(dt); for(const d of defs) towerChevrons(d,d.mdl,d.kind,d.lvl); /* build 177: after the camera moves, so they face this frame's view */ updateHUD(); Meta.hud(); if(S.phase!=='build'&&S.phase!=='wave') pickRing(null); }
let lastT=performance.now();
function frame(now){ requestAnimationFrame(frame); const dt=Math.min(.05,(now-lastT)/1000); lastT=now; if(!window.__freeze) update(dt); if(!Meta.isOpen()&&!HIDEOUT_SHOWN){ renderer.render(scene,camera); drawOverlay(); RENDERS++; } }   /* __freeze: tests step the hall themselves and still see it drawn */   // the tavern is opaque: no GPU work behind it
requestAnimationFrame(frame);

// ================= TEST HOOK =================
window.__loadtime=()=>Object.assign({},LOADT);
window.__dd={renders:()=>RENDERS,placeDefAt,upgradeDef,marks:()=>({max:MAXLVL,names:MARK.slice(),chevFrom:CHEV_FROM}),upCost,towerHit,chevrons:d=>{ const g=d&&d.chev; return g&&g.parent===d.mdl&&g.parent.parent?g.userData.n:0; },   /* build 177: chevron-test.mjs */ rune:()=>({links:RUNE.n,drawn:RUNE.line?RUNE.line.geometry.drawRange.count:0,rings:RUNE.rings.filter(o=>o.visible&&o.parent).length,glows:RUNE.glows.filter(o=>o.visible&&o.parent).length,motes:RUNE.motes.filter(o=>o.visible&&o.parent).length,pairs:RUNE.links.slice(0,RUNE.n).map(L=>[defs.indexOf(L.t),defs.indexOf(L.d)])}),   /* build 178: totem-bramble-test.mjs */ S,hero,cam,renderer,camera,enemies,defs,projs,orbs,loot,grid,DEFS,MOBS,stat,mobSpd,gear:()=>gear,rollItem,dropLoot,resetGear,heroStat,heroMult,heroDmg,kill,Meta,SLOTS,applyGear,saveGear,pickup,tierOf,statStr,RNAME,RCSS,loadHeroGLB,toggleHero,ghost:()=>placing?{x:ghostPos[0],z:ghostPos[1],yaw:ghostYaw,ok:ghostOk,why:ghostReason,stage:placeStage,dist:Math.hypot(ghostPos[0]-hero.x,ghostPos[1]-hero.z),sector:!!ghostSector&&ghostSector.children.length>0}:null,rotateGhost,unstick,music:()=>({on:musicOn,mode:musicMode,step:mStep}),hoverSector:()=>!!hoverSector,heroModel:()=>GLBH?{label:GLBH.label,useGLB,clips:Object.keys(GLBH.map),cur:GLBH.cur?GLBH.cur.getClip().name:null,scale:GLBH.scale,height:GLBH.height,visible:GLBH.wrap.visible}:null,mobTemplate:k=>MOBGLB[k],scene,mobModel:k=>MOBGLB[k]?{clips:Object.keys(MOBGLB[k].map),scale:MOBGLB[k].scale}:null,mobState:e=>e&&e.mdl&&e.mdl.glb?{cur:e.mdl.cur?e.mdl.cur.getClip().name:null,time:e.mdl.cur?e.mdl.cur.time:0}:null,setHeroYaw:d=>{ heroYawOff=d; },deathCut:()=>deathCut,camPos:()=>({x:camera.position.x,y:camera.position.y,z:camera.position.z}),hurtCrystal,SFX,rails:()=>RAILBOXES.map(b=>({x0:+b.x0.toFixed(2),x1:+b.x1.toFixed(2),z0:+b.z0.toFixed(2),z1:+b.z1.toFixed(2),top:+b.top.toFixed(2)})),
  start:()=>{ if(S.phase==='start'){ S.phase='build'; $('start').classList.add('hide'); cam.x=hero.x; cam.y=hero.y+5; cam.z=hero.z+8; cam.d=cam.dist; } },
  startWave, winMap, moveOn, place:(k,cx,cz,rot)=>placeDef(k,cx,cz,rot||0), spawn:spawnEnemy, select, confirmPlace, swing, repair, upgrade, sell, jump, setKeys:(o)=>Object.assign(K,o), r:renderer,
  step:(dt,n)=>{ for(let i=0;i<(n||1);i++) update(dt||1/60); },
  shot:(w,h)=>{ w=w||960; h=h||540; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); updateCamera(0); renderer.render(scene,camera); const d=renderer.domElement.toDataURL('image/png'); onResize(); return d; },
  setHero:(x,z,yaw)=>{ hero.x=x; hero.z=z; if(yaw!==undefined) hero.yaw=yaw; }, setCam:(yaw,pitch,dist)=>{ cam.yaw=yaw; cam.pitch=pitch; cam.dist=dist; cam.d=dist; },
  status:()=>({phase:S.phase,held:S.held,wave:S.wave,mana:S.mana,du:S.du,crystal:S.crystal,crystal2:GOAL2>=0?S.crystal2:null,heroHp:Math.round(hero.hp),enemies:enemies.filter(e=>!e.dead).length,defs:defs.length,projs:projs.length,orbs:orbs.length,queue:spawnQ.length,kills:S.kills,loot:loot.length,t:+S.t.toFixed(1)}),
  addMana:n=>{ S.mana+=n; }, mute:()=>setSound(false), reflow, flow:()=>flowDef, flowFly:()=>flowFly, worldInfo:()=>Object.assign({duCap:DU_CAP},world.userData),
  survival:()=>SURVIVAL, runWaves, waveComp:w=>waveComp(w===undefined?effWave():w), statWave,   // build 176 (survival-test.mjs)
  map:()=>({index:MAPI,tutorial:TUTORIAL,id:MAP.id,name:MAP.name,waves:MAP.waves,wbase:MAP.wbase,total:MAPS.length,cleared:MAPS_CLEARED,gw:GW,gh:GH,wallH:WALLH,windows:world.userData.windows|0,style:MAP.style||null}), maps:()=>MAPS.map(m=>({id:m.id,name:m.name,waves:m.waves})), effWave, winMap, lanes:()=>LANES, pathLen:(cx,cz)=>flowFree.dist[idx(cx,cz)], pathLenFly:(cx,cz)=>flowFly.dist[idx(cx,cz)], cellAt:(cx,cz)=>gat(cx,cz), hearts:()=>GOAL2>=0?[{x:0,z:0,cell:[GOAL%GW,(GOAL/GW)|0],hp:S.crystal},{x:C2X,z:C2Z,cell:[GOAL2%GW,(GOAL2/GW)|0],hp:S.crystal2}]:[{x:0,z:0,cell:[GOAL%GW,(GOAL/GW)|0],hp:S.crystal}], cw, cwz, floorH, baseFloor, hgtAt:(cx,cz)=>hgt[idx(cx,cz)] };
})();

