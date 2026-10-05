// ===== THE PROLOGUE -- "THE ROOT REMEMBERS" (build 543). Matt picked the cinematics series next ("1"); the plan (memory rootgate-cinematics.md) opens with this one: the myth of the Rootgate,
// the Heartroot beating in the dark, the horde's eyes opening, and the four gnome heroes standing up to it. Plays ONCE, the first time a save's Gnome Hall build phase begins (after the tutorial,
// never in it); the 🎬 gallery replays it (96s-cinematics.js: letterbox, the hall held still, SPACE skips). ~42 s on the wall clock:
//    0.0  BLACK -- two lines, one at a time: "Long before the halls were built..." / "...the Rootgate grew."
//    6.0  THE FALL -- down a shaft of roots under the hall, glowing veins and motes rising past, a light growing far below.
//   15.0  THE HEARTROOT -- close on the hall's crystal in the dark, pulsing with each heartbeat.
//   23.0  EYES -- out over the Heartroot into the dark: eyes open, pair by pair, then more; goblins and orcs stand black behind them.
//   29.0  THE FOUR -- a boom: the Knight, Witch, Fighter and Ranger back to back round the Heartroot, set weapons glowing; they raise them at 32.5.
//   36.0  ROOTGATE -- the camera rises away, the title on the big hit.
// Music: Matt's "Called to Battle" (ZapSplat, the trailer's closer; he has a paid account), its first 40 s -> assets/music-prologue.mp3, from 4.5 s so its big rise lands on the four.
// On the EFFECTS channel (Matt plays with music off; the torch line's march does the same). The heroes are the co-op puppets' own models (98-party.js __party.model), each with a set weapon;
// the mobs are stand-ins (makeMob), never in `enemies`. Everything is taken away after. Test hook: window.__prologue.
(function(){
'use strict';
window.__prologue={ info:()=>null };
if(!window.CINE) return;
const ID='prologue', DUR=42, MUSIC_AT=4.5;
const SH={ words:0, fall:6, heart:15, eyes:23, four:29, title:36 };
const HALL=typeof MAP!=='undefined'&&MAP&&MAP.id==='hall';
const CREW=[ { id:'knight', glb:'knight.glb', w:'sword-fire', a:0 }, { id:'witch', glb:'witch.glb', w:'staff-void', a:PI/2 }, { id:'fighter', glb:'fighter.glb', w:'polearm-radiance', a:PI }, { id:'troll', glb:'ranger.glb', w:'bow-wind', a:-PI/2 } ];
const cnt={ setups:0, teardowns:0, heroes:0, weapons:0, mobs:0, eyes:0, beats:0, music:0 };
const ssm=k=>k<=0?0:k>=1?1:k*k*(3-2*k), L3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
let prng=1; const rand=()=>{ prng=(prng*16807)%2147483647; return (prng-1)/2147483646; };
// ---------------------------------------------------------------- the words (a line at a time, over black)
const words=document.createElement('div'); words.id='cineWords';
{ const st=document.createElement('style'); st.textContent='#cineWords{position:fixed;left:50%;top:46%;transform:translate(-50%,-50%);z-index:96;pointer-events:none;font:italic clamp(22px,3.2vw,46px) Georgia,serif;color:#f3e2b8;letter-spacing:.04em;text-align:center;text-shadow:0 0 22px #b8ff8a55,0 2px 0 #000;opacity:0;white-space:nowrap}'; document.head.appendChild(st); }
document.body.appendChild(words);
// ---------------------------------------------------------------- files: fetched as soon as the hall opens on a save that hasn't seen it
const BUF={}, MODEL={}; let MUS=null, musBytes=null, musSrc=null, musGain=null, parsing=false;
function want(){ return HALL&&window.CINE&&!(window.CINE.seen&&window.CINE.seen(ID)); }
function prefetch(){ if(prefetch.on) return; prefetch.on=true; if(typeof fetchBytes!=='function'||typeof ASSET!=='function') return;
  for(const h of CREW) fetchBytes(ASSET(h.glb),'soon').then(b=>{ BUF[h.id]=b; }).catch(()=>{});
  warmWeapons();
  try{ (typeof fetchBytesNow==='function'?fetchBytesNow:fetchBytes)(ASSET('music-prologue.mp3')).then(b=>{ musBytes=b; }).catch(()=>{}); }catch(e){} }
try{ if(want()&&!SILENT) prefetch(); }catch(e){}
// the four set weapons are real models fetched on first use: ask for each once on a stand-in mount, so they are in hand the moment the four appear
let warmed=0; function warmWeapons(){ if(warmWeapons.on||!window.__weapons||!window.__weapons.attach) return; warmWeapons.on=true; for(const h of CREW){ const n=new THREE.Object3D(); n.name='weaponMount_90'; try{ window.__weapons.attach(n,h.w,5,null,obj=>{ if(obj&&obj.parent) obj.parent.remove(obj); warmed++; }); }catch(e){ warmed++; } } }
function parseHeroes(){ const P=window.__party&&window.__party.model; if(!P||parsing) return; if(!CREW.every(h=>BUF[h.id])) return; parsing=true;
  for(const h of CREW) P.load(BUF[h.id].slice(0),h.id,m=>{ MODEL[h.id]=m; cnt.heroes++; }); }
function musPrep(U){ if(!MUS&&musBytes&&!musBytes.__dec&&U&&U.a){ musBytes.__dec=1; U.a.decodeAudioData(musBytes.slice(0),b=>{ MUS=b; },()=>{}); } }
function musPlay(U,off){ if(musSrc||!MUS||!U||!U.a||!U.sfx) return; musGain=U.a.createGain(); musGain.gain.value=.9; musGain.connect(U.sfx); musSrc=U.a.createBufferSource(); musSrc.buffer=MUS; musSrc.connect(musGain); musSrc.start(0,Math.max(0,off)); cnt.music++; }
function musStop(fade){ if(!musSrc) return; try{ const g=musGain.gain, t=musGain.context.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value,t); g.linearRampToValueAtTime(0,t+fade); musSrc.stop(t+fade+.05); }catch(e){} musSrc=null; }
// ---------------------------------------------------------------- the shaft of roots under the hall
const OWN=[]; function own(m){ m.userData.cineOwn=true; m.userData.noOL=true; return m; } function ownMat(m){ OWN.push(m); return m; }
const TOP=-8, BOT=-74;
function buildShaft(group,cx,cz){ const g=new THREE.Group(); g.position.set(cx,0,cz); group.add(g);
  const bark=ownMat(new THREE.MeshBasicMaterial({ color:C(0x24170e) })), bark2=ownMat(new THREE.MeshBasicMaterial({ color:C(0x3a2616) })), vein=ownMat(new THREE.MeshBasicMaterial({ color:C(0x7dff5a), transparent:true, opacity:.85, blending:THREE.AdditiveBlending, depthWrite:false }));
  for(let i=0;i<34;i++){ const a0=rand()*TAU, r0=3+rand()*3.4, pts=[]; const tw=(rand()-.5)*1.4;
    for(let k=0;k<=8;k++){ const y=TOP-(TOP-BOT)*k/8+(rand()-.5)*2, a=a0+tw*k/8+(rand()-.5)*.25, r=r0+(rand()-.5)*1.2; pts.push(new THREE.Vector3(Math.sin(a)*r,y,Math.cos(a)*r)); }
    const cur=new THREE.CatmullRomCurve3(pts), rad=.16+rand()*.34; g.add(own(new THREE.Mesh(new THREE.TubeGeometry(cur,48,rad,6,false),i%3?bark:bark2)));
    if(i%2===0){ const vp=pts.map(p=>{ const q=p.clone(); const d=Math.hypot(q.x,q.z)||1; q.x-=q.x/d*rad*.9; q.z-=q.z/d*rad*.9; return q; }); g.add(own(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(vp),48,.028+rand()*.02,4,false),vein))); } }
  // rising motes
  const N=360, pos=new Float32Array(N*3), sp=new Float32Array(N); for(let i=0;i<N;i++){ const a=rand()*TAU, r=.6+rand()*5.5; pos[i*3]=Math.sin(a)*r; pos[i*3+1]=BOT+rand()*(TOP-BOT); pos[i*3+2]=Math.cos(a)*r; sp[i]=.6+rand()*1.8; }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); const pm=ownMat(new THREE.PointsMaterial({ color:C(0xc8ff7a), size:.11, map:GLOWT, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:.9 }));
  const pts=own(new THREE.Points(geo,pm)); g.add(pts);
  const deep=glow(0x9fff6a,6,.0); deep.position.set(0,BOT+2,0); g.add(deep); OWN.push(deep.material);
  g.visible=false; return { g, pos, sp, geo, deep, N }; }
// ---------------------------------------------------------------- the scene
let SHF=null, heroes=[], mobs=[], eyes=[], heartG=null, C0={ x:0, y:0, z:0 }, cy=2.7, lastBeat=-9, beatT=0, eyeOrder=[];
function setup(ctx){ if(!HALL) return false; cnt.setups++; prng=4243; musSrc=null; heroes=[]; mobs=[]; eyes=[];
  const wp=new THREE.Vector3(); crystalG.getWorldPosition(wp); C0={ x:wp.x, y:wp.y, z:wp.z }; cy=(window.__crystal&&window.__crystal.state().cgY)||2.7;
  SHF=buildShaft(ctx.group,C0.x,C0.z);
  // the Heartroot's own beat: a soft violet glow at its heart
  heartG=glow(0xb36cff,3.2,0); heartG.position.set(C0.x,C0.y+cy*.62,C0.z); ctx.group.add(heartG); OWN.push(heartG.material);
  // the four, back to back
  const P=window.__party&&window.__party.model;
  for(const h of CREW){ const m=MODEL[h.id]; if(!m) continue; const r=4.4, x=C0.x+Math.sin(h.a)*r, z=C0.z+Math.cos(h.a)*r; m.wrap.position.set(x,C0.y,z); m.wrap.rotation.y=h.a; m.wrap.visible=false; ctx.group.add(m.wrap);
    if(P&&m.actions.idle){ P.play(m,'idle',{fade:0}); m.actions.idle.time=rand()*2; }
    const mt=P&&P.mount(m.root); if(mt&&window.__weapons&&window.__weapons.attach){ window.__weapons.attach(mt,h.w,5,null,obj=>{ m.wobj=obj; try{ m.wglow=window.__heldglow&&window.__heldglow.dress?window.__heldglow.dress(obj):null; }catch(e){} cnt.weapons++; }); }
    const glowMats=[]; m.root.traverse(o=>{ if(!o.isMesh||o.userData.isOL) return; for(const mm of (Array.isArray(o.material)?o.material:[o.material])) if(mm&&mm.emissive&&!glowMats.some(q=>q.m===mm)) glowMats.push({ m:mm, c:mm.emissive.getHex(), I:mm.emissiveIntensity }); });
    heroes.push({ h, m, glowMats }); }
  // the horde in the dark: stand-ins in a wide arc, eyes on each
  const kinds=['goblin','goblin','orc','goblin','orc','goblin']; const eyeMat=c=>{ const s=glow(c,.3,0); OWN.push(s.material); return s; };
  for(let i=0;i<30;i++){ const a=(rand()-.5)*2.4+PI*.5, r=9+rand()*9, x=C0.x+Math.sin(a)*r, z=C0.z+Math.cos(a)*r, kind=kinds[i%kinds.length]; let m=null; try{ m=makeMob(kind); }catch(e){} if(!m) continue;
    const yaw=Math.atan2(C0.x-x,C0.z-z); m.g.position.set(x,baseFloor(x,z),z); m.g.rotation.y=yaw; m.g.visible=false; ctx.group.add(m.g); const idle=m.actions&&(m.actions.idle||m.actions.walk); if(idle){ idle.reset(); idle.play(); idle.time=rand()*2; }
    const dim=MOBDIM[kind]||{ h:1.5 }, hh=(dim.h||1.5)*.86, ex=Math.cos(yaw)*.09, ez=-Math.sin(yaw)*.09, fx=Math.sin(yaw)*.25, fz=Math.cos(yaw)*.25, col=kind==='orc'?0xff4a2a:0xffd23a;
    const e1=eyeMat(col), e2=eyeMat(col); e1.position.set(x+ex+fx,m.g.position.y+hh,z+ez+fz); e2.position.set(x-ex+fx,m.g.position.y+hh,z-ez+fz); ctx.group.add(e1); ctx.group.add(e2);
    mobs.push({ m, a, r }); eyes.push({ e1, e2, at:0, a }); }
  // eyes open centre-out, quicker and quicker
  eyeOrder=eyes.map((e,i)=>i).sort((i,j)=>Math.abs(eyes[i].a-PI*.5)-Math.abs(eyes[j].a-PI*.5)); eyeOrder.forEach((ix,n)=>{ eyes[ix].at=SH.eyes+.6+5*Math.pow(n/Math.max(1,eyeOrder.length-1),.6); });
  cnt.mobs=mobs.length; cnt.eyes=eyes.length*2;
  ctx.darken({ hemi:.03, emissive:.06, fog:[10,70], flat:.35 }); const F=ctx.fireLights(6); cnt.lights=F.slots.length; F.I=2.2; F.dist=12; F.col=0xb36cff;
  return true; }
function camFor(t){ const X=C0.x, Z=C0.z, Y=C0.y;
  if(t<SH.heart){ const k=ssm((t-SH.fall)/(SH.heart-SH.fall)), y=TOP-4-(TOP-BOT-12)*k, a=.4+k*2.2; return { p:[X+Math.sin(a)*1.3,y,Z+Math.cos(a)*1.3], l:[X+Math.sin(a+1.2)*.6,y-7,Z+Math.cos(a+1.2)*.6], fov:62, name:'fall' }; }
  if(t<SH.eyes){ const k=ssm((t-SH.heart)/(SH.eyes-SH.heart)), a=-.9+k*.9, r=7.6-1.3*k; return { p:[X+Math.sin(a)*r,Y+2.3+.3*k,Z+Math.cos(a)*r], l:[X,Y+cy*.55,Z], fov:42, name:'heart' }; }
  if(t<SH.four){ const k=ssm((t-SH.eyes)/(SH.four-SH.eyes)); return { p:L3([X+4.4,Y+1.6,Z+.6],[X+5.4,Y+2.1,Z-.4],k), l:L3([X+14,Y+1.3,Z+2],[X+15,Y+1.2,Z-2],k), fov:60, name:'eyes' }; }
  if(t<SH.title){ const k=ssm((t-SH.four)/(SH.title-SH.four)), a=-2.2+1.1*k, r=8.6-.8*k; return { p:[X+Math.sin(a)*r,Y+1+.35*k,Z+Math.cos(a)*r], l:[X,Y+1.4,Z], fov:52, name:'four' }; }
  const k=ssm((t-SH.title)/(DUR-SH.title)), a=-1.1+.5*k, r=7.8+7*k; return { p:[X+Math.sin(a)*r,Y+1.35+7.5*k,Z+Math.cos(a)*r], l:[X,Y+1.2,Z], fov:52, name:'title' }; }
let lastCut=null; const WARM=C(0xff9a50); const SRC=[0,1,2,3,4].map(()=>({ x:0, y:-80, z:0, on:false, ph:0, k:1 }));
function step(ctx,t,dt){ const U=ctx.audio, F=ctx.fire;
  // the screen: the words over black, then a black dip into each cut
  const w=t<SH.fall?(t<3.2?ssm((t-.6)/.9)*(1-ssm((t-2.6)/.6)):ssm((t-3.4)/.9)*(1-ssm((t-5.2)/.6))):0; words.style.opacity=String(w); words.textContent=t<3.2?'Long before the halls were built…':'…the Rootgate grew.';
  let blk=t<SH.fall?1:t<SH.fall+1.5?1-ssm((t-SH.fall)/1.5):t<SH.heart?ssm((t-(SH.heart-.6))/.6):t<SH.heart+1.2?1-ssm((t-SH.heart)/1.2):0;
  if(t>=SH.four&&t<SH.four+.08) blk=0; ctx.black(blk); ctx.title(ssm((t-(SH.title+.7))/1.3));
  // the shaft
  const inFall=t<SH.heart; SHF.g.visible=inFall;
  if(inFall){ for(let i=0;i<SHF.N;i++){ let y=SHF.pos[i*3+1]+SHF.sp[i]*dt*2.2; if(y>TOP) y=BOT; SHF.pos[i*3+1]=y; } SHF.geo.attributes.position.needsUpdate=true; const dk=ssm((t-9)/5.5); SHF.deep.material.opacity=.9*dk; SHF.deep.scale.setScalar(6+30*dk); }
  // the heartbeat
  beatT-=dt; if(t>1.2&&t<SH.title+1&&beatT<=0){ const per=t<SH.eyes?1.15:t<SH.four?.9:.75; beatT=per; lastBeat=t; U.heart(t<SH.heart?.16:.3); cnt.beats++; }
  const pulse=Math.exp(-(t-lastBeat)*4.5), showHeart=t>=SH.heart; heartG.visible=showHeart; heartG.material.opacity=showHeart?(.25+.6*pulse)*(t<SH.four?1:.7):0; heartG.scale.setScalar(2.6+2.2*pulse);
  // the eyes and the dark figures
  const showMobs=t>=SH.eyes; for(const M of mobs){ M.m.g.visible=showMobs; if(showMobs&&M.m.mixer) M.m.mixer.update(dt); }
  for(const E of eyes){ const k=showMobs?ssm((t-E.at)/.35):0, bl=(Math.sin(t*1.7+E.a*9)>.985)?.1:1; for(const e of [E.e1,E.e2]){ e.visible=k>0; e.material.opacity=.95*k*bl; e.scale.setScalar(.3+.12*k); } }
  ctx.once('eyesnd',SH.eyes+.6,()=>{ U.crackle(.05,0); });
  // the four
  const showFour=t>=SH.four, warm=showFour?.14+.05*pulse:0; for(const H of heroes){ H.m.wrap.visible=showFour; if(showFour&&H.m.mixer) H.m.mixer.update(dt); for(const q of H.glowMats){ q.m.emissive.copy(WARM); q.m.emissiveIntensity=warm; } }   /* the hall lends few lights: the four carry a warm glow of their own (put back after) */
  ctx.once('raise',SH.four+3.5,()=>{ const P=window.__party&&window.__party.model; for(const H of heroes){ if(P&&H.m.actions.attack) P.play(H.m,'attack',{fade:.12,restart:true}); } U.boom(.3); });
  ctx.once('idle2',SH.four+5,()=>{ const P=window.__party&&window.__party.model; for(const H of heroes){ if(P&&H.m.actions.idle) P.play(H.m,'idle',{fade:.3}); } });
  // light: the Heartroot's violet on its beat, then warm on the four
  if(F){ /* the same source objects every frame: the fire lights only stay on (and fade up) for a source they already hold */ const srcs=SRC; SRC[0].on=showHeart; SRC[0].x=C0.x; SRC[0].y=C0.y+cy*.7; SRC[0].z=C0.z; SRC[0].k=.35+.9*pulse;
    heroes.forEach((H,i)=>{ const p=H.m.wrap.position, o=SRC[i+1]; o.on=showFour; o.x=p.x+(p.x-C0.x)*.45; o.y=p.y+2.4; o.z=p.z+(p.z-C0.z)*.45; o.ph=H.h.a; o.k=1; }); for(let i=heroes.length+1;i<SRC.length;i++) SRC[i].on=false;
    F.col=showFour?0xffc890:0xb36cff; F.gain=showHeart?1:0; F.update(srcs,{ x:C0.x, y:C0.y+1, z:C0.z },dt,t); }
  // the camera
  const c=camFor(t); ctx.cam(c.p,c.l,c.fov); if(c.name!==lastCut){ if(lastCut!==null&&F&&F.cut) F.cut(); lastCut=c.name; }
  // the sound
  musPrep(U); if(!musSrc&&MUS&&t>=MUSIC_AT&&t<DUR-2) musPlay(U,t-MUSIC_AT);
  ctx.once('drone',0,()=>{ U.droneOn(.04,4); },99);
  ctx.once('fallswell',SH.fall,()=>{ U.swell(.06); });
  ctx.once('boomHeart',SH.heart,()=>{ U.boom(.25); });
  ctx.once('boomFour',SH.four,()=>{ U.boom(.5); U.droneVol(.02,2); });
  ctx.once('boomTitle',SH.title+.6,()=>{ U.boom(.55); });
  if(window.__freeze) words.style.transition='none'; }
function teardown(ctx){ cnt.teardowns++; musStop(.8); words.style.opacity='0';
  const P=window.__party&&window.__party.model;
  for(const H of heroes){ for(const q of H.glowMats){ q.m.emissive.setHex(q.c); q.m.emissiveIntensity=q.I; } try{ H.m.mixer.stopAllAction(); }catch(e){} if(H.m.wobj&&H.m.wobj.parent) H.m.wobj.parent.remove(H.m.wobj); if(H.m.wrap.parent) H.m.wrap.parent.remove(H.m.wrap); }
  for(const M of mobs){ try{ M.m.mixer.stopAllAction(); }catch(e){} }
  for(const m of OWN.splice(0)) try{ m.dispose(); }catch(e){}
  heroes=[]; mobs=[]; eyes=[]; SHF=null; }
CINE.register(ID,{ title:'ROOTGATE', sub:'THE ROOT REMEMBERS', map:'hall', pic:'cine-prologue.jpg', dur:DUR,
  when:()=>HALL&&!TUTORIAL&&S.phase==='build'&&S.wave===0,
  ready:()=>{ prefetch(); warmWeapons(); parseHeroes(); return warmed>=CREW.length&& !!(MOBGLB.goblin&&MOBGLB.orc)&&CREW.every(h=>MODEL[h.id])&&!!(window.__crystal&&window.__crystal.state().model); },
  setup, step, teardown });
// build 545: the four (models, weapon names, their loading) are shared with part two, the tavern (96s5-tavernscene.js)
const crew={ CREW, MODEL, get:()=>{ prefetch(); warmWeapons(); parseHeroes(); return CREW.every(h=>MODEL[h.id])&&warmed>=CREW.length; } };
window.__prologue={ crew, info:()=>Object.assign({ buffers:CREW.filter(h=>BUF[h.id]).length, warmed, models:CREW.filter(h=>MODEL[h.id]).length, musBytes:!!musBytes, musReady:!!MUS, heroes:heroes.length, mobsLive:mobs.length, words:words.textContent, wordsOp:+words.style.opacity||0 },cnt), cam:t=>camFor(t), SH, DUR };
})();
