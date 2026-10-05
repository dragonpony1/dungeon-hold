// ===== THE TORCH LINE -- the Deep Prison's opening scene (build 535 prep), Matt's own vision: "I keep having a vision on one of the cinematic scenes you make have it come in dark then a light in the
// distance then as it gets closer its the fire from the torches in that long line of goblins and orcs coming in in that last map". Plays once, the first time the Deep Prison's build phase begins
// (96s-cinematics.js: letterbox, the hall held still, SPACE skips, the 🎬 gallery replays it). ~39 s on the wall clock:
//    0.0  BLACK -- silence, then a drone, slow drips echoing, a heartbeat.
//    3.5  THE PINPRICK -- low on the rim's west end, looking down its whole length: far away in the dark the east cells' doorway breathes out one point of light.
//         It grows and splits -- a second, a third -- bobbing; the camera creeps forward and their glow starts to touch the stone.
//   16.0  THE FLIGHT -- a boom: they are torches, carried by goblins and orcs, a single file pouring down the rim's flight, firelight sliding over the cells and bars of the west wall.
//   21.5  FACES -- close on an orc's face in the torchlight, walking at us.   25.0  FEET -- down at the floor, feet marching past, the fire overhead.
//   28.5  THE RIVER -- from beside the Heartroot the camera rises: the whole line snaking down the switchbacks, rim to pit, a river of torches pouring toward the Heartroot.
//   35.0  THE DEEP PRISON -- the title, picture-led (flames either side), and the game begins.
// The marchers are STAND-INS (the real goblin and orc models, makeMob): never in `enemies`, so they don't count, can't hurt, don't drop, and are all gone after. Each carries the torch the prison's
// torch-bearers carry (95j: stick, flame, glow); real light comes from eight of the map's own point lights, borrowed and moved along with the torches nearest the camera, plus a warm additive pool on
// the floor under every torch. Test hook: window.__torchline.
(function(){
'use strict';
window.__torchline={ info:()=>null };
if(!window.CINE) return;
const ID='torchline', DUR=39.5, N=72, SP=3.3, GAP=7, LIGHTS=8;
// shots: [start, end) on the scene clock; head = where the head of the line is (metres along the path, s0 + v per second); cuts may jump it forward (a cut is a cut)
const SH={ black:0, approach:3.5, flight:16, face:21.5, feet:25, river:28.5, title:35 };
const PRISON=typeof MAP!=='undefined'&&MAP&&MAP.id==='prison';
let P=null, marchers=[], A={}, pools=null, poolGeo=null, prng=1, cnt={ setups:0, teardowns:0, marchers:0, torches:0, frameMs:0, maxFrameMs:0, frames:0 }, lastCut=null, face=1;
const rand=()=>{ prng=(prng*16807)%2147483647; return (prng-1)/2147483646; };
const ssm=k=>k<=0?0:k>=1?1:k*k*(3-2*k), L3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
// ---------------------------------------------------------------- the road: the horde's own, out of the east cells (the flow field), smoothed, metre by metre
function smoothFloor(x,z){ const cx=wc(x), cz=wcz(z); if(!inb(cx,cz)) return 0; const i=idx(cx,cz), a=rampA[i]; if(!a) return hgt[i]; const fx=(x+OX)/CELL-cx, fz=(z+OZ)/CELL-cz; const t=a===1?1-fz:a===2?fz:a===3?fx:1-fx; return rampL[i]+(rampH[i]-rampL[i])*Math.max(0,Math.min(1,t)); }
function buildPath(){ const ff=flowFree; if(!ff) return null; const lk=LANES.E?'E':Object.keys(LANES)[0], L=LANES[lk]; if(!L) return null;
  let i=idx(L.cx,L.cz); const pts=[]; let n=0; const fx=Math.sin(L.face||0), fz=Math.cos(L.face||0);
  pts.push([cw(L.cx)-fx*2.2,cwz(L.cz)-fz*2.2]);   // from inside the cell's dark doorway
  while(i>=0&&n<900){ pts.push([cw(i%GW),cwz((i/GW)|0)]); if(isGoal(i)) break; const nx=ff.nxt[i]; if(nx<0||nx===i) break; i=nx; n++; }
  if(pts.length<8) return null;
  let q=pts; for(let it=0;it<3;it++){ const o=[q[0]]; for(let k=0;k<q.length-1;k++){ const a=q[k], b=q[k+1]; o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]); } o.push(q[q.length-1]); q=o; }
  const X=[], Z=[], Y=[], Sx=[]; let acc=0, carry=0; X.push(q[0][0]); Z.push(q[0][1]); Sx.push(0);
  for(let k=1;k<q.length;k++){ let ax=q[k-1][0], az=q[k-1][1]; const bx=q[k][0], bz=q[k][1]; let seg=Math.hypot(bx-ax,bz-az); if(seg<1e-6) continue; let used=0;
    while(carry+seg-used>=.5){ const need=.5-carry; used+=need; const f=used/seg; X.push(ax+(bx-ax)*f); Z.push(az+(bz-az)*f); acc+=.5; Sx.push(acc); carry=0; } carry+=seg-used; }
  const yLane=hgt[idx(L.cx,L.cz)]||0; for(let k=0;k<X.length;k++){ const c=gat(wc(X[k]),wcz(Z[k])); Y.push(c===T.WALL?yLane:smoothFloor(X[k],Z[k])); }   // the doorway's own spot stands in the wall: the gate's floor
  const Ys=Y.map((_,k)=>{ let s=0, c=0; for(let d=-3;d<=3;d++){ const j=k+d; if(j<0||j>=Y.length) continue; s+=Y[j]; c++; } return s/c; });
  return { X, Z, Y:Ys, len:acc, lane:lk };
}
function at(s,out){ const p=P, n=p.X.length; let f=s/.5; if(f<0) f=0; if(f>n-1.001) f=n-1.001; const k=f|0, u=f-k; out.x=p.X[k]+(p.X[k+1]-p.X[k])*u; out.z=p.Z[k]+(p.Z[k+1]-p.Z[k])*u; out.y=p.Y[k]+(p.Y[k+1]-p.Y[k])*u; return out; }
function nearestS(x,z){ let best=0, bd=1e9; for(let k=0;k<P.X.length;k++){ const d=(P.X[k]-x)**2+(P.Z[k]-z)**2; if(d<bd){ bd=d; best=k; } } return best*.5; }
// ---------------------------------------------------------------- the line
function head(t){ // where the head is, and how fast the line walks, at scene time t
  if(t<SH.approach) return { s:-12, v:0 };
  if(t<SH.flight) return { s:-1+3.0*(t-SH.approach), v:3.0 };
  if(t<SH.face) return { s:A.flightTop-1+2.6*(t-SH.flight), v:2.6 };
  if(t<SH.river) return { s:A.lane+2.6*(t-SH.face), v:2.6 };
  if(t<SH.title) return { s:A.pitTop-3+2.4*(t-SH.river), v:2.4 };
  const s1=A.pitTop-3+2.4*(SH.title-SH.river); return { s:Math.min(P.len-6,s1+1.3*(t-SH.title)), v:1.3 }; }
function ownTorch(){ const g=new THREE.Group(); const st=new THREE.Mesh(G.cyl(.04,.055,.8,6),mat(0x4a3220)); st.position.y=.4; g.add(st); const fl=new THREE.Mesh(G.cone(.13,.42,7),basic(0xff7a1a)); fl.position.y=.98; g.add(fl);
  const fl2=new THREE.Mesh(G.cone(.07,.3,7),basic(0xffd060)); fl2.position.y=.94; g.add(fl2); const gl=glow(0xff8a2a,2.4,.6); gl.position.y=1.0; g.add(gl); g.userData.parts={ fl, fl2, gl, ph:Math.random()*6 }; return g; }
// a real-looking flame for the close shots: two soft teardrop sprites (an orange body, a hot core) where the in-game torch has two cones
let FLT=null; function flameTex(){ if(FLT) return FLT; const c=document.createElement('canvas'); c.width=64; c.height=128; const g=c.getContext('2d');
  g.globalCompositeOperation='lighter'; const drop=(w,top,bot,a)=>{ const gr=g.createLinearGradient(0,top,0,bot); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(.45,'rgba(255,255,255,'+(a*.6)+')'); gr.addColorStop(.85,'rgba(255,255,255,'+a+')'); gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr; g.beginPath(); g.moveTo(32,top); g.bezierCurveTo(32+w*.25,top+(bot-top)*.35,32+w,top+(bot-top)*.6,32+w*.8,bot-(bot-top)*.12); g.bezierCurveTo(32+w*.5,bot,32-w*.5,bot,32-w*.8,bot-(bot-top)*.12); g.bezierCurveTo(32-w,top+(bot-top)*.6,32-w*.25,top+(bot-top)*.35,32,top); g.fill(); };
  drop(26,4,124,.35); drop(17,26,122,.5); drop(9,58,118,.8); FLT=new THREE.CanvasTexture(c); FLT.encoding=THREE.sRGBEncoding; return FLT; }
function flameSprite(col,w,h,op){ const s=new THREE.Sprite(new THREE.SpriteMaterial({ map:flameTex(), color:C(col), blending:THREE.AdditiveBlending, transparent:true, depthWrite:false, opacity:op })); s.scale.set(w,h,1); s.userData.noOL=true; s.userData.w=w; s.userData.h=h; return s; }
function gait(M,v){ const A_=M.m.actions||{}, nat=M.natAll||{ walk:1, run:2.2 }, hs=v/M.h; const useRun=!A_.walk||(A_.run&&A_.run!==A_.walk&&hs>nat.run*.95);   /* a march, not a charge: the walk, quickened (the run only past its own pace) */ const a=useRun?A_.run:(A_.walk||A_.run); if(!a) return;
  a.timeScale=Math.max(.35,Math.min(2.1,hs/(useRun?nat.run:nat.walk))); if(M.act!==a){ a.reset(); a.play(); if(M.act) a.crossFadeFrom(M.act,.25,false); M.act=a; } }
function makeMarcher(i,group){ const kind=i===0||i%3===2?'orc':'goblin', m=makeMob(kind), dim=MOBDIM[kind]||{ h:1.5, r:.5, nat:{ walk:1, run:2 } };
  m.g.visible=false; group.add(m.g); const act=m.actions&&(m.actions.walk||m.actions.run); if(act){ act.reset(); act.play(); act.time=rand()*act.getClip().duration; m.cur=act; }
  const torch=i<6||i%4!==3; const sc=m.g.scale.x||1; const M={ i, kind, m, act, h:dim.h, r:dim.r, nat:(dim.nat&&dim.nat.walk)||1, natAll:dim.nat, off:i*SP+(i?(rand()-.5)*.7:0), lead:i?GAP:0, ph:rand()*6, sway:.18+rand()*.22, sc, t:null, src:null, pool:null, haze:null };
  if(torch){ const mk=window.__torchmobs&&window.__torchmobs.make; const t=mk?mk():ownTorch(); const lx=-(dim.r||.6)*.95, ly=(dim.h||1.6)*.42, lz=.3; t.position.set(lx/sc,ly/sc,lz/sc); t.rotation.z=.12; t.scale.setScalar(1.35/sc); m.g.add(t);
    const hz=glow(0xff6a20,5,.12); hz.position.y=1.0; t.add(hz); M.haze=hz;
    const pr=t.userData.parts; if(pr){ if(pr.fl) pr.fl.visible=false; if(pr.fl2) pr.fl2.visible=false; } const fo=flameSprite(0xff6a1c,.34,.74,.95), fc=flameSprite(0xffe2a0,.17,.36,.85); fo.position.y=1.12; fc.position.y=.98; t.add(fo); t.add(fc); M.fo=fo; M.fc=fc; M.t=t; M.fl=[lx-.158,ly+1.313,lz];   // the flame's spot on the marcher (world units, before its turn)
    const pm=new THREE.MeshBasicMaterial({ map:GLOWT, color:C(0xff7424), blending:THREE.AdditiveBlending, transparent:true, depthWrite:false, opacity:.3 }); const pool=new THREE.Mesh(poolGeo,pm); pool.rotation.x=-PI/2; pool.userData.noOL=true; pool.visible=false; group.add(pool); M.pool=pool;
    M.src={ x:0, y:-80, z:0, on:false, ph:M.ph, k:1 }; cnt.torches++; }
  return M; }
// ---------------------------------------------------------------- the camera, shot by shot
const V0={ x:0, y:0, z:0 }, V1={ x:0, y:0, z:0 };
function shot(t){ const out={}; let p, l, fov=50, focus=null, name;
  if(t<SH.flight){ name=t<SH.approach?'black':'approach'; const k=ssm((t-SH.approach)/(SH.flight-SH.approach)); p=L3([-34,8.0,69.6],[-5,7.7,69.9],k);
    const hd=head(t); at(Math.max(0,hd.s),V0); const gate=[A.gate.x,A.gate.y+1.4,A.gate.z]; l=L3(gate,[V0.x,V0.y+1.5,V0.z],ssm((t-8)/6)); fov=44-6*k; focus={ x:p[0], y:p[1], z:p[2] }; }
  else if(t<SH.face){ name='flight'; const k=ssm((t-SH.flight)/(SH.face-SH.flight)); p=L3([-31.2,5.1,54.6],[-31.8,5.25,53.6],k); const hd=head(t); at(Math.max(0,hd.s-9),V0);
    l=L3([-29.5,7.2,66],[V0.x,V0.y+1.2,V0.z],.12+.18*k); fov=52; focus={ x:(p[0]+V0.x)/2, y:V0.y+1, z:(p[2]+V0.z)/2 }; }
  else if(t<SH.feet){ name='face'; const k=(t-SH.face)/(SH.feet-SH.face); const M=marchers[face]; const hd=head(t); const s=hd.s-M.off; at(s,V0); at(s+1.2,V1); const dx=V1.x-V0.x, dz=V1.z-V0.z, dl=Math.hypot(dx,dz)||1, fx=dx/dl, fz=dz/dl;
    const dist=2.7-.9*ssm(k), side=.85; p=[V0.x+fx*dist+fz*side,V0.y+M.h*.62,V0.z+fz*dist-fx*side]; l=[V0.x+fx*.25,V0.y+M.h*.8,V0.z+fz*.25]; fov=44; focus={ x:V0.x, y:V0.y+1, z:V0.z }; }
  else if(t<SH.river){ name='feet'; const k=ssm((t-SH.feet)/(SH.river-SH.feet)); const y=A.feetY; p=L3([A.feet.x-4.6,y+.24,A.feet.z+1.55],[A.feet.x-2.2,y+.24,A.feet.z+1.55],k); l=L3([A.feet.x-9.5,y+.32,A.feet.z-.1],[A.feet.x-7.1,y+.32,A.feet.z-.1],k); fov=52; focus={ x:p[0]-2, y:y+1, z:p[2]-2 }; }
  else { name=t<SH.title?'river':'title'; const k=ssm((t-SH.river)/(SH.title-SH.river)), k2=ssm((t-SH.title)/(DUR-SH.title));
    p=L3(L3([5.5,1.45,6.6],[.4,16.6,-1.8],k),[.2,17.3,-2.3],k2); l=L3(L3([12,2.5,21],[2,1.8,34],k),[2,1.6,36],k2); fov=50-4*k;
    const hd=head(t); at(Math.max(0,hd.s-6),V0); focus={ x:V0.x, y:V0.y, z:V0.z }; }
  out.p=p; out.l=l; out.fov=fov; out.focus=focus; out.name=name; return out; }
// ---------------------------------------------------------------- the scene
function setup(ctx){ if(!PRISON) return false; cnt.setups++; prng=7177; P=buildPath(); if(!P) return false;
  A.flightTop=nearestS(-27,66.5); A.lane=nearestS(-4,52); A.pitTop=nearestS(12,22.5); const g0=at(0,{}); A.gate={ x:g0.x, y:g0.y, z:g0.z };
  const fs=nearestS(6,52); const fp=at(fs,{}); A.feet={ x:fp.x, z:fp.z }; A.feetY=fp.y;
  poolGeo=new THREE.CircleGeometry(1,28); marchers=[]; for(let i=0;i<N;i++) marchers.push(makeMarcher(i,ctx.group)); cnt.marchers=marchers.length;
  face=marchers.findIndex((M,i)=>i>=1&&i<=4&&M.kind==='orc'&&M.t); if(face<0) face=1;
  ctx.darken({ hemi:.03, emissive:.07, fog:[95,240], flat:.42 }); const F=ctx.fireLights(LIGHTS); F.I=1.2; F.dist=14; F.col=0xff7a30;
  lastCut=null; return true; }
let stepT=0, beatT=0, dripT=0, crackT=0, stepSnd=0, drumT=0;
function step(ctx,t,dt){ const t0=performance.now(); const U=ctx.audio, F=ctx.fire;
  // the screen
  ctx.black(t<SH.approach?1:1-ssm((t-SH.approach)/1.8)); ctx.title(ssm((t-(SH.title+.6))/1.4));
  // the line
  const hd=head(t), cam=camera.position; let nearD=1e9, nearX=0;
  const gapK=t<SH.flight?1:0;   // the lone first light: its gap closes at the cut (no one sees the jump)
  for(const M of marchers){ const s=hd.s-M.off-M.lead*gapK, show=s>.3&&s<P.len-1; M.m.g.visible=show; if(M.pool) M.pool.visible=show; if(M.src) M.src.on=show; if(!show) continue;
    at(s,V0); at(Math.min(P.len,s+.9),V1); let dx=V1.x-V0.x, dz=V1.z-V0.z; const dl=Math.hypot(dx,dz)||1; dx/=dl; dz/=dl;
    const sw=Math.sin(s*.23+M.ph)*M.sway, x=V0.x-dz*sw, z=V0.z+dx*sw, y=V0.y, yaw=Math.atan2(dx,dz);
    const g=M.m.g; g.position.set(x,y,z); g.rotation.y=yaw;
    gait(M,hd.v); if(dt>0&&M.m.mixer) M.m.mixer.update(dt);
    const d=Math.hypot(x-cam.x,z-cam.z); if(d<nearD){ nearD=d; nearX=x; }
    if(M.t){ const fx=M.fl[0], fy=M.fl[1], fz=M.fl[2], c=Math.cos(yaw), sn=Math.sin(yaw); const wx=x+fx*c+fz*sn, wz=z-fx*sn+fz*c, wy=y+fy+Math.sin(t*9+M.ph)*.03;
      M.src.x=wx; M.src.y=wy+.25; M.src.z=wz;
      const dc=Math.hypot(wx-cam.x,wy-cam.y,wz-cam.z); const pr=M.t.userData.parts; if(pr){ if(window.__torchmobs&&window.__torchmobs.flicker) window.__torchmobs.flicker(M.t); else { const kk=1+Math.sin(t*13+pr.ph)*.18; pr.fl.scale.set(1,kk,1); }
        pr.gl.scale.setScalar(Math.max(2.4,dc*.034)/(1.35/M.sc)); }
      if(M.haze){ M.haze.scale.setScalar(Math.max(5,dc*.075)/(1.35/M.sc)); M.haze.material.opacity=(.1+.3*Math.max(0,Math.min(1,(dc-30)/40)))*(1+.3*Math.sin(t*7+M.ph)); }   /* far off, the glow carries the point of light */
      if(M.fo){ const a=1+Math.sin(t*13+M.ph)*.16+Math.sin(t*7.3+M.ph*2)*.1, b=1+Math.sin(t*17+M.ph*3)*.12; M.fo.scale.set(M.fo.userData.w*(1.05-.1*(a-1)),M.fo.userData.h*a,1); M.fo.position.x=Math.sin(t*9+M.ph)*.02; M.fc.scale.set(M.fc.userData.w,M.fc.userData.h*b,1); }
      const fy0=smoothFloor(wx,wz); M.pool.position.set(wx,Math.max(fy0,y-.3)+.07,wz); const fk=1+Math.sin(t*10.7+M.ph)*.1+Math.sin(t*4.1+M.ph*2)*.07; M.pool.scale.setScalar(4.0*fk); M.pool.material.opacity=.13*fk; } }
  // the camera
  const sh=shot(t); ctx.cam(sh.p,sh.l,sh.fov); if(sh.name!==lastCut){ if(lastCut!==null&&F&&F.cut) F.cut(); lastCut=sh.name; }
  if(F){ F.gain=t<SH.flight?.04+.96*ssm((t-5.5)/9.5):sh.name==='face'?.72:1; F.update(marchers.filter(M=>M.src).map(M=>M.src),sh.focus||{ x:cam.x, y:cam.y, z:cam.z },dt,t); }
  // the sound
  ctx.once('drone',0,()=>{ U.droneOn(.055,5); },99);
  ctx.once('boom1',SH.flight,()=>{ U.boom(.42); U.droneVol(.075,2); });
  ctx.once('boom2',SH.river,()=>{ U.boom(.38); });
  ctx.once('boom3',SH.title+.5,()=>{ U.boom(.55); U.swell(.08); U.droneVol(.03,3); });
  beatT-=dt; if(t>1.6&&t<SH.title+.5&&beatT<=0){ const per=1.35-.4*ssm((t-4)/18); beatT=per; U.heart(.2+.12*ssm((t-4)/18)); }
  dripT-=dt; if(dripT<=0){ dripT=.9+Math.random()*1.9; U.drip(.03+Math.random()*.035,(Math.random()-.5)*1.6); }
  if(t>9&&t<SH.flight){ drumT-=dt; if(drumT<=0){ drumT=2.4; U.boom(.05+.1*ssm((t-9)/7)); } }
  crackT-=dt; if(crackT<=0&&nearD<34){ crackT=.07; U.crackle(.05*Math.max(0,1-nearD/34),Math.max(-.8,Math.min(.8,(nearX-cam.x)/12))); }
  stepSnd-=dt; if(stepSnd<=0&&hd.v>0&&nearD<30){ stepSnd=.42*(2.6/hd.v)*(.85+Math.random()*.3); U.step(.13*Math.max(0,1-nearD/30),(Math.random()-.5)*.6); }
  const ms=performance.now()-t0; cnt.frames++; cnt.frameMs+=(ms-cnt.frameMs)*.1; cnt.maxFrameMs=Math.max(cnt.maxFrameMs,ms); }
function teardown(ctx){ cnt.teardowns++;
  for(const M of marchers){ if(M.t){ M.t.traverse(o=>{ if(o.geometry&&o.geometry.type==='ConeGeometry') o.geometry.dispose(); if(o.material&&(o.material.isSpriteMaterial||o.material.isMeshBasicMaterial)) o.material.dispose(); }); } if(M.pool) M.pool.material.dispose(); try{ M.m.mixer.stopAllAction(); }catch(e){} }
  if(poolGeo){ poolGeo.dispose(); poolGeo=null; } marchers=[]; }
CINE.register(ID,{ title:'THE DEEP PRISON', sub:'THE TORCH LINE', map:'prison', pic:'cine-torchline.jpg', dur:DUR,
  when:()=>PRISON&&!TUTORIAL&&S.phase==='build'&&S.wave===0,
  ready:()=>!!(MOBGLB.goblin&&MOBGLB.orc)&&!!(window.__prisonkit&&window.__prisonkit.info&&(window.__prisonkit.info()||{}).modules>0),
  setup, step, teardown });
window.__torchline={ info:()=>Object.assign({ glb:marchers.filter(M=>M.m.glb).length, path:P?{ len:+P.len.toFixed(1), lane:P.lane, n:P.X.length }:null, anchors:Object.assign({},A), alive:marchers.filter(M=>M.m.g.visible).length, face },cnt), shot:t=>{ const s=shot(t); return { name:s.name, p:s.p, l:s.l }; }, head, SH, DUR, N };
})();
