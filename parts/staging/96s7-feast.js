// ===== DINNER IS SERVED -- the Great Feast Hall's opening scene (build 554). Matt: "Go" (after the plan: the smell of soup, long tables, overturned chairs, a pot bubbling by itself, Sir
// Bullion's shadow -- a teaser; his own roll-out stays for his boss wave, 95v-bullion.js). Plays once, the first time the Feast Hall's build phase begins (after the page's sound is open:
// 96s-cinematics.js); the 🎬 gallery replays it. ~30 s on the wall clock:
//    0.0  THE POT -- out of black, close on his stockpot hanging over the kitchen fire (56e3-feasthearth.js), bubbling and steaming all by itself; the camera eases back to the great hearth.
//    9.0  THE WRECK -- gliding the length of the hall over the long tables, the overturned ones, the spilled plates, the chandeliers burning for no one.
//   17.0  THE SHADOW -- by the east doors: a huge shadow lumbers along the wall (Sir Bullion's own model, flattened black against the stone, half again his size), thud by thud; a ladle clinks.
//   24.0  THE FOUR -- the heroes at the Heartroot end, looking down the hall; THE GREAT FEAST HALL.
// Music: a taste of his own theme ("A Street in France", assets/music-bullion.mp3) on the effects channel, faded out at the end (the rest is kept for his wave). Test hook: window.__feastscene.
(function(){
'use strict';
window.__feastscene={ info:()=>null };
if(!window.CINE) return;
const ID='feast', DUR=30, FEAST=typeof MAP!=='undefined'&&MAP&&MAP.id==='feast';
const SH={ pot:0, wreck:9, shadow:17, four:24 };
const cnt={ setups:0, teardowns:0, bubbles:0, thuds:0, music:0, heroes:0, weapons:0, shadow:0 };
const ssm=k=>k<=0?0:k>=1?1:k*k*(3-2*k), L3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
// ---------------------------------------------------------------- the music: his theme's opening, faded at the end
let TUNE=null, tuneBytes=null, tuneSrc=null, tuneGain=null;
function tuneFetch(){ if(tuneFetch.on) return; tuneFetch.on=true; try{ (typeof fetchBytesNow==='function'?fetchBytesNow:fetchBytes)(ASSET('music-bullion.mp3')).then(b=>{ tuneBytes=b; }).catch(()=>{}); }catch(e){} }
function tunePrep(U){ if(!TUNE&&tuneBytes&&!tuneBytes.__dec&&U&&U.a){ tuneBytes.__dec=1; U.a.decodeAudioData(tuneBytes.slice(0),b=>{ TUNE=b; },()=>{}); } }
function tunePlay(U,off){ if(tuneSrc||!TUNE||!U||!U.a) return; tuneGain=U.a.createGain(); const t=U.a.currentTime; tuneGain.gain.setValueAtTime(.0001,t); tuneGain.gain.exponentialRampToValueAtTime(.7,t+2); tuneGain.connect(U.sfx); tuneSrc=U.a.createBufferSource(); tuneSrc.buffer=TUNE; tuneSrc.connect(tuneGain); tuneSrc.start(0,Math.max(0,off)); cnt.music++; }
function tuneStop(fade){ if(!tuneSrc) return; try{ const g=tuneGain.gain, t=tuneGain.context.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value,t); g.linearRampToValueAtTime(0,t+fade); tuneSrc.stop(t+fade+.05); }catch(e){} tuneSrc=null; }
// the pot's bubbling, a ladle's clink
function bubble(U,vol){ if(!U||!U.a) return; const a=U.a, t=a.currentTime, o=a.createOscillator(), g=a.createGain(), f=180+Math.random()*260; o.type='sine'; o.frequency.setValueAtTime(f,t); o.frequency.exponentialRampToValueAtTime(f*2.4,t+.07);
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+.11); o.connect(g).connect(U.sfx); o.start(t); o.stop(t+.13); cnt.bubbles++; }
function clink(U){ if(!U||!U.a) return; const a=U.a, t=a.currentTime; for(const [f,v] of [[1850,.07],[2790,.04],[4100,.025]]){ const o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0001,t+1.2); o.connect(g).connect(U.sfx); o.start(t); o.stop(t+1.3); } }
// ---------------------------------------------------------------- the scene
const OWN=[]; let heroes=[], shadow=null, steam=null, steamMat=null, A_={}, lastCut=null, bubT=0, thudT=0;
function wallFaceX(cz){ for(let c=36;c<GW;c++){ const i=idx(c,cz); if(grid[i]===T.WALL) return cw(c)-CELL/2; } return cw(46)+CELL/2; }
// how far east the first solid surface is, looking along +x from inside the hall at height y (the map's own meshes; sprites and see-through glows ignored)
function faceX(z,y,fallback){ try{ const rc=new THREE.Raycaster(new THREE.Vector3(fallback-16,y,z),new THREE.Vector3(1,0,0),0,30); rc.camera=camera; world.updateMatrixWorld(true);   /* a sprite in the way needs the camera to test against */
    const hit=rc.intersectObject(world,true).find(h=>h.object.isMesh&&!h.object.userData.isOL&&h.object.visible&&!(h.object.material&&(h.object.material.transparent||h.object.material.blending===THREE.AdditiveBlending)));
    return hit?hit.point.x:fallback; }catch(e){ return fallback; } }
function setup(ctx){ if(!FEAST) return false; const C2=window.__prologue&&window.__prologue.crew, H=window.__feastHearth; if(!H||!H.on) return false; cnt.setups++; tuneSrc=null; heroes=[]; bubT=.2; thudT=0;
  A_.pot={ x:H.fire.x, y:H.fire.y+1.55, z:H.fire.z }; A_.front={ x:H.front.x, z:H.front.z }; A_.doorZ=cwz(15.1); A_.endZ=cwz(17.5); A_.wall=faceX((A_.doorZ+A_.endZ)/2,3.5,H.x0);   // the stone between the doors and his hearth (it stands out from the wall: measured, not assumed), walked south toward his kitchen
  // steam over the pot
  { const N=60, pos=new Float32Array(N*3), sp=new Float32Array(N); for(let i=0;i<N;i++){ pos[i*3]=A_.pot.x+(Math.random()-.5)*1.6; pos[i*3+1]=A_.pot.y+Math.random()*2.5; pos[i*3+2]=A_.pot.z+(Math.random()-.5)*1.6; sp[i]=.4+Math.random()*.6; }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); steamMat=new THREE.PointsMaterial({ color:C(0xe8e0d0), size:.9, map:GLOWT, transparent:true, depthWrite:false, opacity:.28 }); OWN.push(steamMat);
    steam=new THREE.Points(geo,steamMat); steam.userData.cineOwn=true; steam.userData.sp=sp; ctx.group.add(steam); }
  // his shadow: his own model, flattened black against the east wall, walking north from the doors
  try{ const m=makeMob('bullion'); if(m&&m.glb){ const blk=new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:.86, depthWrite:false, skinning:true }); OWN.push(blk);
      m.g.traverse(o=>{ if(o.isMesh){ if(o.userData.isOL){ o.visible=false; return; } o.material=blk; o.renderOrder=2; } });
      m.g.rotation.y=0; m.g.position.set(A_.wall-.06,baseFloor(A_.wall-1,A_.doorZ),A_.doorZ); const s=(m.g.scale.x||1)*1.5; m.g.scale.set(s*.04,s,s); m.g.visible=false; ctx.group.add(m.g); const w=m.actions&&(m.actions.walk||m.actions.idle); if(w){ w.reset(); w.play(); w.timeScale=.7; } shadow=m; cnt.shadow=1; } }catch(e){ shadow=null; }
  // the firelight his shadow is thrown into: a warm wash on the wall behind it (black on dark stone alone doesn't read)
  { const lm=new THREE.MeshBasicMaterial({ map:GLOWT, color:C(0xff8a3a), transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending }); OWN.push(lm); const pl=new THREE.Mesh(new THREE.PlaneGeometry(13,9),lm); pl.rotation.y=-PI/2; pl.position.set(A_.wall-.03,baseFloor(A_.wall-1,(A_.doorZ+A_.endZ)/2)+4.2,(A_.doorZ+A_.endZ)/2); pl.userData.cineOwn=true; pl.userData.noOL=true; ctx.group.add(pl); A_.wash=pl; }
  // the four at the Heartroot end, looking down the hall
  const P=window.__party&&window.__party.model; const hx=cw(13), hz=cwz(14); A_.four={ x:hx, z:hz, y:baseFloor(hx,hz) };   /* out on the runner, clear of the high table */ const off=[[0,-1.4],[0,1.4],[-1.4,-.4],[-1.3,.9]];
  if(C2) C2.CREW.forEach((h,i)=>{ const m=C2.MODEL[h.id]; if(!m) return; const x=hx+off[i][0], z=hz+off[i][1]; m.wrap.position.set(x,baseFloor(x,z),z); m.wrap.rotation.y=PI/2; m.wrap.visible=false; ctx.group.add(m.wrap);
    if(P&&m.actions.idle){ P.play(m,'idle',{fade:0,restart:true}); m.actions.idle.time=i*.6; } const mt=P&&P.mount(m.root); if(mt&&window.__weapons&&window.__weapons.attach) window.__weapons.attach(mt,h.w,5,null,obj=>{ m.wobj=obj; try{ m.wglow=window.__heldglow&&window.__heldglow.dress?window.__heldglow.dress(obj):null; }catch(e){} cnt.weapons++; });
    heroes.push({ h, m }); });
  cnt.heroes=heroes.length; return true; }
function camFor(t){ const Pt=A_.pot, Fr=A_.front;
  if(t<SH.wreck){ const k=ssm(t/SH.wreck); const dx=Fr.x-Pt.x, dz=Fr.z-Pt.z, dl=Math.hypot(dx,dz)||1, r=2.6+7*k; return { p:[Pt.x+dx/dl*r,Pt.y+.9+1.2*k,Pt.z+dz/dl*r+1.2*k], l:[Pt.x,Pt.y+.1+.9*k,Pt.z], fov:46, name:'pot' }; }
  if(t<SH.shadow){ const k=ssm((t-SH.wreck)/(SH.shadow-SH.wreck)), x=cw(40)-(cw(40)-cw(12))*k, z=cwz(14.5); return { p:[x,3.4,z], l:[x-8,1.6,z+.6], fov:58, name:'wreck' }; }
  if(t<SH.four){ const k=ssm((t-SH.shadow)/(SH.four-SH.shadow)); const W=A_.wall, zc=(A_.doorZ+A_.endZ)/2; return { p:[W-11+1.2*k,2.4,zc-3+1.5*k], l:[W,3.6,zc+.5], fov:54, name:'shadow' }; }
  const F=A_.four, k=ssm((t-SH.four)/(DUR-SH.four)); return { p:[F.x-4.6-1.2*k,F.y+2.1+1.4*k,F.z+1.2], l:L3([F.x+1.5,F.y+1.3,F.z],[F.x+22,F.y+2.4,F.z],k*.8), fov:56, name:'four' }; }
function step(ctx,t,dt){ const U=ctx.audio;
  ctx.black(t<1.6?1-ssm(t/1.6):0); ctx.title(ssm((t-(SH.four+2))/1.3));
  // steam
  if(steam){ const p=steam.geometry.attributes.position.array, sp=steam.userData.sp; for(let i=0;i<sp.length;i++){ let y=p[i*3+1]+sp[i]*dt; if(y>A_.pot.y+3) y=A_.pot.y; p[i*3+1]=y; p[i*3]+=Math.sin(t+i)*dt*.15; } steam.geometry.attributes.position.needsUpdate=true; }
  // the shadow
  if(A_.wash){ const k=t>=SH.shadow&&t<SH.four?ssm((t-SH.shadow)/.8)*(1-ssm((t-SH.four+.4)/.4)):0; A_.wash.material.opacity=.75*k*(1+.08*Math.sin(t*9)+.05*Math.sin(t*23)); }
  if(shadow){ const show=t>=SH.shadow&&t<SH.four; shadow.g.visible=show; if(show){ const k=(t-SH.shadow)/(SH.four-SH.shadow); shadow.g.position.z=A_.doorZ+(A_.endZ-A_.doorZ)*k; if(shadow.mixer) shadow.mixer.update(dt); } }
  // the four
  const showFour=t>=SH.four; for(const H of heroes){ H.m.wrap.visible=showFour; if(showFour&&H.m.mixer) H.m.mixer.update(dt); }
  const c=camFor(t); ctx.cam(c.p,c.l,c.fov); lastCut=c.name;
  // sound: the pot bubbles (harder when he comes), his footfalls, a ladle
  bubT-=dt; if(t<SH.four+2&&bubT<=0){ const hard=t>=SH.shadow?1.6:1; bubT=(.12+Math.random()*.3)/hard; bubble(U,(t<SH.wreck?.05:.025)*hard); }
  if(t>=SH.shadow&&t<SH.four){ thudT-=dt; if(thudT<=0){ thudT=1.05; U.boom(.32); cnt.thuds++; } }
  ctx.once('clink',SH.shadow+4.6,()=>{ clink(U); });
  ctx.once('boomTitle',SH.four+2.1,()=>{ U.boom(.4); });
  tunePrep(U); if(!tuneSrc&&TUNE&&t<DUR-2) tunePlay(U,t); if(t>DUR-3.2) tuneStop(3); }
function teardown(ctx){ cnt.teardowns++; tuneStop(.6);
  for(const H of heroes){ try{ H.m.mixer.stopAllAction(); }catch(e){} if(H.m.wobj&&H.m.wobj.parent) H.m.wobj.parent.remove(H.m.wobj); if(H.m.wrap.parent) H.m.wrap.parent.remove(H.m.wrap); H.m.wrap.rotation.y=0; }
  if(shadow) try{ shadow.mixer.stopAllAction(); }catch(e){}
  for(const m of OWN.splice(0)) try{ m.dispose(); }catch(e){}
  heroes=[]; shadow=null; steam=null; }
try{ if(FEAST&&!SILENT&&!(window.CINE.seen&&window.CINE.seen(ID))){ tuneFetch(); if(window.__bullion&&window.__bullion.load) window.__bullion.load(); } }catch(e){}
CINE.register(ID,{ title:'THE GREAT FEAST HALL', sub:'DINNER IS SERVED', map:'feast', pic:'cine-feast.jpg', dur:DUR,
  when:()=>FEAST&&!TUTORIAL&&S.phase==='build'&&S.wave===0,
  ready:()=>{ tuneFetch(); if(window.__bullion&&window.__bullion.load&&!MOBGLB.bullion) window.__bullion.load(); const C2=window.__prologue&&window.__prologue.crew; return !!(C2&&C2.get())&&!!MOBGLB.bullion&&!!(window.__feastHearth&&window.__feastHearth.on); },
  setup, step, teardown });
window.__feastscene={ info:()=>Object.assign({ tuneBytes:!!tuneBytes, tuneReady:!!TUNE, heroesLive:heroes.length, shadowZ:shadow?+shadow.g.position.z.toFixed(1):null, shadowShown:!!(shadow&&shadow.g.visible), wall:A_.wall, cut:lastCut },cnt), cam:t=>camFor(t), SH, DUR };
})();
