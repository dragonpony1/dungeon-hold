// ===== THE RANGER'S VOLLEY WEARS MATT'S ARROW ART (build 533 prep). Matt: "so these are to inhance the rangers secondary skill i was hoping you could at a little color and effect".
// Looks only -- the damage, its fifteen waves and their timing are 73-specials.js's, untouched. Three parts, all in the colour of the Ranger's bow (81-rangedshots.js colour(): a set bow's
// set colour, 86w-setglow.js, else the bow's own glow, else his green):
//   * THE CHARGE (holding right-click): a ring of twelve of Matt's arrows (his arrow from the rain model), tips down, circling over the aimed spot and spinning faster as the charge fills,
//     glowing brighter; a rune circle turns on the ground under it (over 73-specials.js's own landing ring, which stays). At full charge the ring flashes and its arrows shoot up out of sight.
//     (His hi3d-arrow-volley_1.glb turned out to be the same 32 falling arrows and clip as the rain, less the ground impacts -- not a circling ring -- so the ring is built here.)
//   * THE RAIN: Matt's arrow-volley model (parts/assets/volley-rain.glb, from his hi3d-arrow-volley_2.glb: 32 arrows, a dust cloud and debris for every one, ground stones) plays at the spot,
//     scaled to the volley's 2.5 radius and turned so the arrows come in from the Ranger's side. His 6 s clip is played from its 1.45 s mark at 2.26x until the last arrow is down, so the
//     32 arrows land across the same second the 15 damage waves do, then at 1x while they stand in the ground. Each falling arrow trails a glowing streak; each landing flashes white,
//     throws sparks of the colour and kicks up Matt's dust and debris; every eighth one (the big ones) gives the camera a small shake (only near it); the arrows left standing glow, then fade.
//   * CO-OP: partners see the charge (a 'vcharge' message, ~8 a second while it fills; the host passes a guest's on to the others) and the rain (73-specials.js's specialFx, which now carries
//     the colour and the caster's spot).
// Drawing: the model's 386 pieces are 3 InstancedMeshes (arrows; debris and ground stones; dust) plus a soft scorch disc; every glow, flash and spark is a point in one of TWO Points draws
// (hot and added on / the colour's halos) and every streak a quad in ONE mesh, shared by all volleys. Everything is pooled: nothing is built per volley once the pools are warm (window.__volleyfx.info() counts it). Until the model is in, 73-specials.js's old cone rain stands in.
// Test hook: window.__volleyfx. Tests: volley-test.mjs.
(function(){
'use strict';
const FILE='volley-rain.glb', LAND_R=2.1, CLIP0=1.45, FAST=2.26, FAST_END=3.65, ARROW_LEN=.9, TRAIL=1.6, HERO_GREEN=0x9be06a;
const RING_N=12, RING_H=2.6, RING_SCALE=1.25;
const lin=hex=>new THREE.Color(hex).convertSRGBToLinear();
const cnt={ rains:0, rainsMade:0, charges:0, chargesMade:0, runesMade:0, impacts:0, shakes:0, fallback:0, netCharge:0, netChargeIn:0 };
let gl=null, loadP=null, loadErr=null;
// ---------------------------------------------------------------- the model, fetched once the Ranger is picked (or a partner's Ranger casts)
function load(){ if(loadP||gl) return loadP; if(typeof fetchBytes!=='function'||!THREE.GLTFLoader) return null;
  loadP=fetchBytes(ASSET(FILE)).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{ gl=prep(g); }).catch(e=>{ loadErr=String(e); console.warn('volley model',e); loadP=null; });
  return loadP; }
function prep(g){ const root=g.scene||g.scenes[0], clip=(g.animations||[])[0]; if(!clip) throw new Error('volley: no clip'); const kids=root.children.slice();
  const pick=rx=>kids.filter(o=>rx.test(o.name)).sort((a,b)=>a.name<b.name?-1:1);
  const arrows=pick(/^Volley_Arrow/), rocks=pick(/^(Impact_Debris|Ground_Stone)/), dust=pick(/^Impact_Dust/);
  const arrowSrc=arrows[0]; if(!arrowSrc||!rocks.length||!dust.length) throw new Error('volley: pieces missing');
  const map=arrowSrc.material&&arrowSrc.material.map||null; if(map) map.anisotropy=4;
  // each arrow's landing (the first key at its resting height), from the clip itself
  const land=[]; for(const a of arrows){ const tp=clip.tracks.find(t=>t.name===a.name+'.position'); let L=CLIP0+.1;
    if(tp){ const v=tp.values, n=tp.times.length, yEnd=v[(n-1)*3+1]; for(let i=0;i<n;i++){ if(Math.abs(v[i*3+1]-yEnd)<1e-3){ L=tp.times[i]; break; } } } land.push(L); }
  const order=land.map((t,i)=>i).sort((a,b)=>land[a]-land[b]); const big=new Uint8Array(arrows.length); order.forEach((i,k)=>{ if(k%8===0) big[i]=1; });
  const proto=o=>({ name:o.name, p:o.position.clone(), q:o.quaternion.clone(), s:o.scale.clone(), stone:/^Ground_Stone/.test(o.name) });
  return { clip, arrowGeo:arrowSrc.geometry, arrowMap:map, rockGeo:(rocks.find(o=>/^Impact_Debris/.test(o.name))||rocks[0]).geometry, dustGeo:dust[0].geometry,
    rockCol:rocks[0].material.color.clone(), dustCol:dust[0].material.color.clone(), arrows:arrows.map(proto), rocks:rocks.map(proto), dust:dust.map(proto), land, big, lastLand:Math.max(...land), dur:clip.duration }; }
// ---------------------------------------------------------------- the shared glow layer: every glow, flash and spark is a point of one of TWO Points objects
// ADD (hot cores, sparks, flashes: added on, so they burn white where they pile up) and WASH (the colour's soft halos, laid over the scene, so a pile of them stays that colour)
const PT_VS='attribute float size; attribute vec4 rgba; uniform float uH; varying vec4 vC;\n'+
  'void main(){ vC=rgba; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=size*uH*projectionMatrix[1][1]/max(.2,-mv.z); gl_Position=projectionMatrix*mv; }';
const PT_FS='uniform sampler2D map; varying vec4 vC;\n'+
  'void main(){ vec4 t=texture2D(map,gl_PointCoord); gl_FragColor=vec4(vC.rgb,t.a*vC.a);\n #include <tonemapping_fragment>\n #include <encodings_fragment>\n}';
function layer(name,max,blending,order){ const L={ max, pos:new Float32Array(max*3), rgba:new Float32Array(max*4), size:new Float32Array(max), n:0 }; const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(L.pos,3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('rgba',new THREE.BufferAttribute(L.rgba,4).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('size',new THREE.BufferAttribute(L.size,1).setUsage(THREE.DynamicDrawUsage)); g.setDrawRange(0,0);
  L.mat=new THREE.ShaderMaterial({ uniforms:{ map:{ value:GLOWT }, uH:{ value:400 } }, vertexShader:PT_VS, fragmentShader:PT_FS, transparent:true, depthWrite:false, blending });
  L.obj=new THREE.Points(g,L.mat); L.obj.name=name; L.obj.frustumCulled=false; L.obj.userData.noOL=true; L.obj.renderOrder=order; L.obj.visible=false; scene.add(L.obj); L.geo=g; return L; }
const ADD=layer('volleyGlows',900,THREE.AdditiveBlending,4), WASH=layer('volleyHalos',400,THREE.NormalBlending,3);
function flush(L){ if(L.n){ const a=L.geo.attributes; a.position.needsUpdate=a.rgba.needsUpdate=a.size.needsUpdate=true; L.mat.uniforms.uH.value=renderer.domElement.height*.5; } L.geo.setDrawRange(0,L.n); L.obj.visible=L.n>0; }
const _c=new THREE.Color(), _w=new THREE.Color(1,1,1);
function pt(x,y,z,col,a,size,white,wash){ const L=wash?WASH:ADD; if(L.n>=L.max||a<=.003||size<=.01) return; const i=L.n++; L.pos[i*3]=x; L.pos[i*3+1]=y; L.pos[i*3+2]=z; _c.copy(col); if(white) _c.lerp(_w,white); L.rgba[i*4]=_c.r; L.rgba[i*4+1]=_c.g; L.rgba[i*4+2]=_c.b; L.rgba[i*4+3]=Math.min(1,a); L.size[i]=size; }
// sparks and flashes live a moment on their own: a fixed pool of particles, reused
const PART_MAX=520, PARTS=[]; for(let i=0;i<PART_MAX;i++) PARTS.push({ on:false }); let partNext=0;
function part(o){ let p=null; for(let k=0;k<PART_MAX;k++){ const q=PARTS[(partNext+k)%PART_MAX]; if(!q.on){ p=q; partNext=(partNext+k+1)%PART_MAX; break; } } if(!p){ p=PARTS[partNext]; partNext=(partNext+1)%PART_MAX; }
  p.on=true; p.t=0; p.x=o.x; p.y=o.y; p.z=o.z; p.vx=o.vx||0; p.vy=o.vy||0; p.vz=o.vz||0; p.life=o.life; p.s0=o.s0; p.s1=o.s1!==undefined?o.s1:o.s0; p.a0=o.a0!==undefined?o.a0:1; p.g=o.g||0; p.drag=o.drag||0; p.white=o.white||0; p.wash=!!o.wash; p.col=p.col||new THREE.Color(); p.col.copy(o.col); p.floor=o.floor; return p; }
function tickParts(dt){ for(const p of PARTS){ if(!p.on) continue; p.t+=dt; if(p.t>=p.life){ p.on=false; continue; } const k=p.t/p.life;
    if(p.drag){ const d=Math.exp(-p.drag*dt); p.vx*=d; p.vz*=d; } p.vy-=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt; if(p.floor!==undefined&&p.y<p.floor){ p.y=p.floor; p.vy*=-.3; p.vx*=.6; p.vz*=.6; }
    pt(p.x,p.y,p.z,p.col,p.a0*(1-k*k),lerp(p.s0,p.s1,Math.sqrt(k)),p.white*(1-k),p.wash); } }
// ---------------------------------------------------------------- the streaks: camera-facing ribbons, all in ONE mesh
const ST_MAX=96, ST={ n:0 }; const stPos=new Float32Array(ST_MAX*4*3), stUv=new Float32Array(ST_MAX*4*2), stCol=new Float32Array(ST_MAX*4*4), stIx=[];
for(let i=0;i<ST_MAX;i++){ const b=i*4; stIx.push(b,b+2,b+1, b+1,b+2,b+3); stUv.set([0,1, 1,1, 0,0, 1,0],i*8); }
const ST_VS='attribute vec4 rgba; varying vec2 vUv; varying vec4 vC; void main(){ vUv=uv; vC=rgba; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
const ST_FS='varying vec2 vUv; varying vec4 vC;\n'+
  'void main(){ float a=vUv.y, x=abs(vUv.x-.5)*2.; float edge=1.-x*x; float core=1.-smoothstep(0.,.45,x); float k=pow(a,1.5)*edge*vC.a;\n'+
  ' gl_FragColor=vec4(mix(vC.rgb,vec3(1.),core*(.08+.3*a)),k);\n #include <tonemapping_fragment>\n #include <encodings_fragment>\n}';
const stGeo=new THREE.BufferGeometry(); stGeo.setAttribute('position',new THREE.BufferAttribute(stPos,3).setUsage(THREE.DynamicDrawUsage)); stGeo.setAttribute('uv',new THREE.BufferAttribute(stUv,2)); stGeo.setAttribute('rgba',new THREE.BufferAttribute(stCol,4).setUsage(THREE.DynamicDrawUsage)); stGeo.setIndex(stIx); stGeo.setDrawRange(0,0);
const streaks=new THREE.Mesh(stGeo,new THREE.ShaderMaterial({ vertexShader:ST_VS, fragmentShader:ST_FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide }));
streaks.name='volleyStreaks'; streaks.frustumCulled=false; streaks.userData.noOL=true; streaks.renderOrder=2; streaks.visible=false; scene.add(streaks);
const _s=new THREE.Vector3(), _v=new THREE.Vector3(), _d=new THREE.Vector3(), _Y=new THREE.Vector3(0,1,0);
// a streak from head (hx,hy,hz) back along -d for len, half-width w at the head
function streak(hx,hy,hz,d,len,w,col,a){ if(ST.n>=ST_MAX||a<=.01) return; const i=ST.n++, tx=hx-d.x*len, ty=hy-d.y*len, tz=hz-d.z*len;
  _v.set(camera.position.x-hx,camera.position.y-hy,camera.position.z-hz); _s.crossVectors(d,_v); if(_s.lengthSq()<1e-8) _s.crossVectors(d,_Y); if(_s.lengthSq()<1e-8) _s.set(1,0,0); _s.normalize(); const w1=w*.35;
  stPos.set([hx-_s.x*w,hy-_s.y*w,hz-_s.z*w, hx+_s.x*w,hy+_s.y*w,hz+_s.z*w, tx-_s.x*w1,ty-_s.y*w1,tz-_s.z*w1, tx+_s.x*w1,ty+_s.y*w1,tz+_s.z*w1],i*12);
  for(let k=0;k<4;k++) stCol.set([col.r,col.g,col.b,a],i*16+k*4); }
// ---------------------------------------------------------------- the rune circle (one picture, drawn once; a pooled plane per circle on the floor)
let RUNE_TEX=null;
function runeTex(){ if(RUNE_TEX) return RUNE_TEX; const S=512, c=document.createElement('canvas'); c.width=c.height=S; const x=c.getContext('2d'); x.translate(S/2,S/2); x.strokeStyle='#fff'; x.fillStyle='#fff'; x.lineCap='round'; x.shadowColor='#fff'; x.shadowBlur=10;
  const ring=(r,w)=>{ x.lineWidth=w; x.beginPath(); x.arc(0,0,r,0,TAU); x.stroke(); };
  ring(240,7); ring(222,2.5); ring(168,4); ring(150,1.5); ring(54,3);
  let sd=7; const rr=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
  for(let i=0;i<24;i++){ const a=i/24*TAU; x.save(); x.rotate(a); x.translate(0,-195); x.lineWidth=3.2; x.beginPath(); const n=2+((rr()*3)|0);   // a rune: a stem and two or three strokes off it
      x.moveTo(0,-15); x.lineTo(0,15); for(let k=0;k<n;k++){ const y=-12+rr()*24, s=rr()<.5?-1:1; x.moveTo(0,y); x.lineTo(s*(6+rr()*6),y+(rr()-.5)*14); } if(rr()<.4){ x.moveTo(-7,-15); x.lineTo(7,-15); } x.stroke(); x.restore(); }
  for(let i=0;i<72;i++){ const a=i/72*TAU, l=i%6===0?16:7; x.lineWidth=i%6===0?3:1.5; x.beginPath(); x.moveTo(Math.sin(a)*222,-Math.cos(a)*222); x.lineTo(Math.sin(a)*(222-l),-Math.cos(a)*(222-l)); x.stroke(); }   // ticks inside the outer band
  x.lineWidth=3; for(const off of [0,PI]){ x.beginPath(); for(let k=0;k<=3;k++){ const a=off+k/3*TAU; const px=Math.sin(a)*150, py=-Math.cos(a)*150; if(k) x.lineTo(px,py); else x.moveTo(px,py); } x.stroke(); }   // two triangles: a six-point star
  for(let k=0;k<6;k++){ const a=k/6*TAU+PI/6; x.beginPath(); x.arc(Math.sin(a)*100,-Math.cos(a)*100,9,0,TAU); x.fill(); }
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; RUNE_TEX=t; return t; }
const RUNES=[]; let runeGeo=null;
function takeRune(){ let r=RUNES.find(q=>!q.on); if(!r){ if(!runeGeo){ runeGeo=new THREE.PlaneGeometry(2,2); runeGeo.rotateX(-PI/2); }
    const m=new THREE.Mesh(runeGeo,new THREE.MeshBasicMaterial({ map:runeTex(), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2 }));
    m.name='volleyRune'; m.userData.noOL=true; m.frustumCulled=false; m.renderOrder=1; r={ m, on:false }; RUNES.push(r); cnt.runesMade++; }
  r.on=true; r.m.visible=true; scene.add(r.m); return r; }
function giveRune(r){ if(!r) return; r.on=false; r.m.visible=false; if(r.m.parent) r.m.parent.remove(r.m); }
function placeRune(r,x,y,z,R,col,op,spin){ r.m.position.set(x,y,z); r.m.scale.setScalar(R/.9375); r.m.rotation.y=spin; r.m.material.color.copy(col); r.m.material.opacity=op; }
// ---------------------------------------------------------------- the arrows' material: Matt's arrow, lit in the colour all over (it is dark wood: lighting only its bright texels left a black stick)
// and drawn a little longer (game arrows are 1.4) and much fatter than the model's (a 2 cm sliver at the volley's scale)
const ARROW_LONG=1.3, ARROW_FAT=2.6, DUST_K=3.5, DEBRIS_K=2.2;
function arrowMat(){ return new THREE.MeshToonMaterial({ map:gl.arrowMap, gradientMap:GRAD_SOFT, emissive:new THREE.Color(0), emissiveIntensity:1, side:THREE.DoubleSide }); }
const _m=new THREE.Matrix4(), _q=new THREE.Quaternion(), _p=new THREE.Vector3(), _sc=new THREE.Vector3(), _X=new THREE.Vector3(1,0,0);
// ---------------------------------------------------------------- THE CHARGE: a ring of arrows over the spot, a rune circle under it
const CHARGES=[];   // pooled: { im, mat, on, key, x,z,R,k,col, fade, spin, rune, seen }
function takeCharge(key){ let c=CHARGES.find(q=>q.on&&q.key===key); if(c) return c; c=CHARGES.find(q=>!q.on);
  if(!c){ const mt=arrowMat(), im=new THREE.InstancedMesh(gl.arrowGeo,mt,RING_N); im.name='volleyRing'; im.frustumCulled=false; im.userData.noOL=true; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); c={ im, mat:mt, on:false, col:new THREE.Color() }; CHARGES.push(c); cnt.chargesMade++; }
  c.on=true; c.key=key; c.fade=-1; c.spin=Math.random()*TAU; c.k=0; c.seen=performance.now(); c.rune=takeRune(); scene.add(c.im); c.im.visible=true; cnt.charges++; return c; }
function giveCharge(c){ c.on=false; c.key=null; if(c.im.parent) c.im.parent.remove(c.im); giveRune(c.rune); c.rune=null; }
function setCharge(key,x,z,R,k,hex){ if(!gl){ load(); return null; } const c=takeCharge(key); if(c.fade>=0){ c.fade=-1; } c.x=x; c.z=z; c.R=R; c.k=clamp(k,0,1); c.col.copy(lin(hex)); c.hex=hex; c.seen=performance.now(); return c; }
function endCharge(key,fired){ const c=CHARGES.find(q=>q.on&&q.key===key); if(!c) return; if(fired){ c.fade=0; c.fired=true; } else giveCharge(c); }
function tickCharges(dt){ for(const c of CHARGES){ if(!c.on) continue; if(c.key!=='local'&&c.fade<0&&performance.now()-c.seen>700){ giveCharge(c); continue; }   // a partner's that stopped coming (they let go)
    const fl=baseFloor(c.x,c.z), k=c.k, launching=c.fade>=0, LF=.5; if(launching){ c.fade+=dt; if(c.fade>LF){ giveCharge(c); continue; } } else if(c.key!=='local') c.k=Math.min(1,c.k+dt/1.2);   // a partner's fills on between their messages
    const lf=launching?c.fade/LF:0, fade=1-lf; c.spin+=dt*(1.0+5*k*k)*(launching?1.5:1); const r=c.R*(.86-.16*k), h=fl+RING_H+.2*Math.sin(c.spin*.6)-.5*k, up=launching?lf*lf*16:0, tl=ARROW_LEN*RING_SCALE*ARROW_LONG;
    for(let i=0;i<RING_N;i++){ const a=c.spin+i/RING_N*TAU, px=c.x+Math.cos(a)*r, pz=c.z+Math.sin(a)*r, py=h+up;
      // tip down and leading round the ring: the shaft (the model's +x, tip at its origin) runs up and back along the turn; launching, the tips turn to the sky
      if(launching) _d.set(0,-1,0); else _d.set(Math.sin(a)*.28,.96,-Math.cos(a)*.28).normalize(); _q.setFromUnitVectors(_X,_d); _p.set(px,py,pz); _sc.setScalar(RING_SCALE); _m.compose(_p,_q,_sc); _m.scale(_sc.set(ARROW_LONG,ARROW_FAT,ARROW_FAT)); c.im.setMatrixAt(i,_m);
      _v.copy(_d).negate(); streak(px,py,pz,_v,tl*(launching?3:1.5),.1+.05*k,c.col,(.3+.5*k)*fade);   // a glow down the shaft from the head (launching: a long trail under it)
      pt(px,py,pz,c.col,(.3+.45*k)*fade,.55+.45*k,0,true); pt(px,py,pz,c.col,(.25+.6*k)*fade,.22+.18*k,.45); }
    if(!launching) for(let j=0;j<40;j++){ const a=c.spin+j/40*TAU; pt(c.x+Math.cos(a)*r,h,c.z+Math.sin(a)*r,c.col,(.12+.3*k)*(.4+.6*((j%10)/10)),.16+.1*k,.3); }   // the ring's own glowing track, brightest just behind each arrow
    c.im.instanceMatrix.needsUpdate=true; c.mat.emissive.copy(c.col); c.mat.emissiveIntensity=launching?1.1:.18+.75*k+(k>=.98?.3*Math.sin(S.t*30)**2:0);
    placeRune(c.rune,c.x,fl+.07,c.z,c.R,c.col,Math.min(1,launching?fade*1.1:.3+.65*k),-c.spin*.2);
    pt(c.x,fl+.25,c.z,c.col,(.08+.22*k)*fade,c.R*1.6,0,true);   // the floor in the circle lit in the colour
    if(launching&&!c.flashed){ c.flashed=true; part({ x:c.x,y:fl+.4,z:c.z, col:c.col, life:.3, s0:c.R*.6, s1:c.R*1.6, a0:.8, white:.5 }); } } }
// ---------------------------------------------------------------- THE RAIN
const RAINS=[], _tip=new THREE.Vector3(), _dir=new THREE.Vector3();
function buildRain(){ const grp=new THREE.Group(); grp.name='volleyRain'; grp.userData.noOL=true;
  const mt=arrowMat(), arrows=new THREE.InstancedMesh(gl.arrowGeo,mt,gl.arrows.length);
  const rockMat=new THREE.MeshToonMaterial({ color:gl.rockCol.clone().multiplyScalar(1.6), gradientMap:GRAD, side:THREE.DoubleSide }), rocks=new THREE.InstancedMesh(gl.rockGeo,rockMat,gl.rocks.length);
  const dustMat=new THREE.MeshToonMaterial({ color:gl.dustCol.clone().lerp(new THREE.Color(.62,.55,.45),.45), gradientMap:GRAD_SOFT, transparent:true, opacity:.78, depthWrite:false, side:THREE.DoubleSide }), dust=new THREE.InstancedMesh(gl.dustGeo,dustMat,gl.dust.length);
  for(const im of [arrows,rocks,dust]){ im.frustumCulled=false; im.userData.noOL=true; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); grp.add(im); } arrows.name='volleyArrows'; rocks.name='volleyRocks'; dust.name='volleyDust';
  const scorch=new THREE.Mesh(scorchGeo(),new THREE.MeshBasicMaterial({ map:scorchTex(), color:0x000000, transparent:true, depthWrite:false, opacity:0, polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1 })); scorch.name='volleyScorch'; scorch.userData.noOL=true; scorch.renderOrder=0; scorch.frustumCulled=false; grp.add(scorch);
  // the proxies the clip moves (one plain node per piece of the model, by its name); each frame their matrices go into the instances
  const proxy=new THREE.Object3D(); const mk=P=>P.map(o=>{ const n=new THREE.Object3D(); n.name=o.name; n.position.copy(o.p); n.quaternion.copy(o.q); n.scale.copy(o.s); n.userData.stone=o.stone; proxy.add(n); return n; });
  const pa=mk(gl.arrows), pr=mk(gl.rocks), pd=mk(gl.dust); const mixer=new THREE.AnimationMixer(proxy), act=mixer.clipAction(gl.clip); act.setLoop(THREE.LoopOnce,1); act.clampWhenFinished=true;
  cnt.rainsMade++; return { grp, arrows, rocks, dust, scorch, mat:mt, rockMat, dustMat, proxy, pa, pr, pd, mixer, act, on:false, col:new THREE.Color(), landed:new Float32Array(gl.arrows.length), S:1 }; }
let SCORCH_GEO=null, SCORCH_TEX=null;
function scorchGeo(){ if(!SCORCH_GEO){ SCORCH_GEO=new THREE.CircleGeometry(1,40); SCORCH_GEO.rotateX(-PI/2); } return SCORCH_GEO; }
function scorchTex(){ if(SCORCH_TEX) return SCORCH_TEX; const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,255,255,.85)'); g.addColorStop(.6,'rgba(255,255,255,.55)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); SCORCH_TEX=new THREE.CanvasTexture(c); return SCORCH_TEX; }
function rain(x,z,hex,hx,hz,R){ if(!gl){ load(); cnt.fallback++; return false; }
  let r=RAINS.find(q=>!q.on); if(!r){ r=buildRain(); RAINS.push(r); }
  r.on=true; r.x=x; r.z=z; r.fl=baseFloor(x,z); r.hex=hex; r.col.copy(lin(hex)); r.ct=CLIP0; r.real=0; r.landed.fill(-1); r.R=R||2.5; r.S=r.R/LAND_R; r.lastLand=0; r.done=false;
  let dx=x-(hx!==undefined?hx:hero.x), dz=z-(hz!==undefined?hz:hero.z); const l=Math.hypot(dx,dz); if(l<.01){ dx=Math.sin(hero.yaw); dz=Math.cos(hero.yaw); } else { dx/=l; dz/=l; }
  r.grp.position.set(x,r.fl,z); r.grp.rotation.set(0,Math.atan2(-dz,dx),0); r.grp.scale.setScalar(r.S); r.grp.updateMatrixWorld(true);   // the model's arrows fly in along its +x: turned so they come from the Ranger's side
  r.mat.emissive.copy(r.col); r.mat.emissiveIntensity=.62; r.scorch.scale.setScalar(LAND_R*1.15); r.scorch.material.opacity=0;
  r.act.reset(); r.act.play(); r.act.time=r.ct; r.mixer.update(0); scene.add(r.grp); r.grp.visible=true; r.rune=takeRune(); cnt.rains++;
  pose(r); return true; }
// the instances follow the proxies; the stones lie still and show only once arrows are coming down
function pose(r){ const ct=r.ct, gs=clamp((ct-1.55)/1.2,0,1)*clamp((gl.dur-.05-ct)/.35,0,1);
  r.pa.forEach((n,i)=>{ n.updateMatrix(); _m.copy(n.matrix).scale(_sc.set(ARROW_LONG,ARROW_FAT,ARROW_FAT)); r.arrows.setMatrixAt(i,_m); });
  r.pr.forEach((n,i)=>{ n.updateMatrix(); _m.copy(n.matrix).scale(_sc.setScalar(n.userData.stone?gs*1.4:DEBRIS_K)); r.rocks.setMatrixAt(i,_m); });
  r.pd.forEach((n,i)=>{ n.updateMatrix(); _m.copy(n.matrix).scale(_sc.setScalar(DUST_K)); r.dust.setMatrixAt(i,_m); });
  r.arrows.instanceMatrix.needsUpdate=r.rocks.instanceMatrix.needsUpdate=r.dust.instanceMatrix.needsUpdate=true; }
function shake(x,z,amt){ const d=Math.hypot(x-hero.x,z-hero.z); if(d>22) return; camShake=Math.max(camShake,amt*(d<8?1:1-(d-8)/14)); cnt.shakes++; }
function tickRains(dt){ for(const r of RAINS){ if(!r.on) continue; r.real+=dt; r.ct=Math.min(gl.dur,r.ct+dt*(r.ct<FAST_END?FAST:1)); r.act.time=r.ct; r.mixer.update(0); pose(r);
    const M4=r.grp.matrixWorld, S=r.S, L=ARROW_LEN*ARROW_LONG*S, col=r.col;
    for(let i=0;i<r.pa.length;i++){ const n=r.pa[i], land=gl.land[i]; if(n.scale.x<.05) continue;
      _tip.copy(n.position).applyMatrix4(M4); _dir.copy(_X).applyQuaternion(n.quaternion).transformDirection(M4);   // the head (the model's arrow has its tip at its origin) and the way back up the shaft
      if(r.ct<land){ streak(_tip.x,_tip.y,_tip.z,_d.copy(_dir).negate(),L+TRAIL*S,.085*S,col,.7); pt(_tip.x,_tip.y,_tip.z,col,.5,.55*S,0,true); pt(_tip.x,_tip.y,_tip.z,col,.9,.2*S,.6); }   // falling: a streak up the shaft and on behind it, a halo and a hot point at the head
      else { if(r.landed[i]<0){ r.landed[i]=r.real; impact(r,_tip,i); }
        const since=r.real-r.landed[i], a=Math.max(0,1-since/1.8); if(a>0){ const fx=_tip.x+_dir.x*L*.85, fy=_tip.y+_dir.y*L*.85, fz=_tip.z+_dir.z*L*.85; pt(fx,fy,fz,col,.5*a,.45*S,0,true); pt(fx,fy,fz,col,.7*a,.14*S,.4); pt(_tip.x,_tip.y+.05,_tip.z,col,.35*a,.6*S,0,true); } } }   // standing in the ground: the fletching glows on, and the floor round the shaft, then both fade
    const after=r.ct>=gl.lastLand?r.real-r.lastLand:0; r.mat.emissiveIntensity=r.ct<gl.lastLand?.62:Math.max(.08,.62-after*.35);
    r.scorch.material.opacity=.5*clamp((r.ct-1.6)/1.0,0,1)*clamp((gl.dur-r.ct)/.8,0,1);
    const rk=r.real; placeRune(r.rune,r.x,r.fl+.07,r.z,r.R,col,Math.max(0,.8-rk*.4),rk*.6);
    if(r.ct>=gl.dur-1e-3){ r.on=false; r.grp.visible=false; scene.remove(r.grp); giveRune(r.rune); r.rune=null; r.act.stop(); } } }
function impact(r,tip,i){ const col=r.col, fl=tip.y; cnt.impacts++;
  part({ x:tip.x,y:fl+.2,z:tip.z, col, life:.18, s0:.45*r.S, s1:1.1*r.S, a0:.95, white:.75 });   // the white-hot flash
  part({ x:tip.x,y:fl+.25,z:tip.z, col, life:.45, s0:.8*r.S, s1:1.9*r.S, a0:.55, wash:true });   // the colour's glow round it
  for(let k=0;k<8;k++){ const a=Math.random()*TAU, e=.35+Math.random()*1.0, sp=3.5+Math.random()*4.5; part({ x:tip.x,y:fl+.12,z:tip.z, vx:Math.cos(a)*Math.cos(e)*sp, vy:Math.sin(e)*sp+1.5, vz:Math.sin(a)*Math.cos(e)*sp, g:16, drag:2.5, floor:fl+.04, col, life:.4+Math.random()*.25, s0:.2, s1:.07, a0:1, white:.45 }); }   // sparks of the colour
  if(gl.big[i]) shake(tip.x,tip.z,.2);
  r.lastLand=r.real; }   // the last landing's real time, for the stuck arrows' fade
// ---------------------------------------------------------------- the colour: the bow in the caster's hand
function localCol(){ const W=window.__weapons, wo=W&&W.mounted&&W.mounted(), R=window.__rshots; if(wo&&/^bow-/.test(wo.name)&&R&&R.colour) return R.colour('arrow',wo.userData.kind); return HERO_GREEN; }
// ---------------------------------------------------------------- co-op: the charge goes to the partners (the rain already rides 73-specials.js's specialFx)
const NET=()=>window.__net||null; let wired=false, sentAt=0, wasCharging=false;
function wire(){ if(wired) return; const n=NET(); if(!n||!n.onMessage) return; wired=true;
  n.onMessage('vcharge',(data,fromId)=>{ if(!data) return; cnt.netChargeIn++; const key='net:'+(n.role()==='host'?fromId:(data.from||'host'));
    const x=clamp(+data.x||0,-1e4,1e4), z=clamp(+data.z||0,-1e4,1e4), k=clamp(+data.k||0,0,1), R=clamp(+data.R||2.5,.5,10), col=(+data.col>>>0)&0xffffff;
    if(data.on) setCharge(key,x,z,R,k,col); else endCharge(key,!!data.fired);
    if(n.role()==='host'&&n.peers) n.peers().forEach(id=>{ if(id!==fromId) n.send('vcharge',Object.assign({},data,{ from:fromId }),id); }); });   // the host passes a guest's charge on to the others
}
function netCharge(on,x,z,R,k,col,fired){ const n=NET(); if(!n||!n.role||!n.role()||!n.peers||!n.peers().length) return; n.send('vcharge',{ on:on?1:0, x:+(+x).toFixed(2), z:+(+z).toFixed(2), R, k:+k.toFixed(2), col, fired:fired?1:0 }); cnt.netCharge++; }
// 73-specials.js calls this every tick of a Ranger's charge (x,z = the aimed spot) and once with on=false when it stops (fired = it went off)
function localCharge(on,x,z,R,k,fired){ if(on){ const col=localCol(); setCharge('local',x,z,R,k,col); const now=performance.now(); if(!wasCharging||now-sentAt>=120){ sentAt=now; netCharge(true,x,z,R,k,col); } wasCharging=true; }
  else if(wasCharging){ wasCharging=false; endCharge('local',fired); netCharge(false,0,0,R,0,0,fired); } }
// ---------------------------------------------------------------- the per-tick driver
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); wire(); if(!gl&&!loadP&&window.__heroes&&window.__heroes.pick()==='troll') load();
    ADD.n=WASH.n=0; ST.n=0; if(gl){ tickCharges(dt); tickRains(dt); } tickParts(dt);
    flush(ADD); flush(WASH);
    if(ST.n){ stGeo.attributes.position.needsUpdate=stGeo.attributes.rgba.needsUpdate=true; } stGeo.setDrawRange(0,ST.n*6); streaks.visible=ST.n>0; }; }
window.__volleyfx={ load:()=>load(), ready:()=>!!gl, error:()=>loadErr, rain, localCharge, setCharge, endCharge, col:localCol, CLIP0, FAST, FAST_END, LAND_R,
  info:()=>{ const liveR=RAINS.filter(r=>r.on), liveC=CHARGES.filter(c=>c.on);
    return Object.assign({ ready:!!gl, rainsPool:RAINS.length, rainsLive:liveR.length, chargesPool:CHARGES.length, chargesLive:liveC.length, runesPool:RUNES.length, runesLive:RUNES.filter(q=>q.on).length,
      points:ADD.n+WASH.n, streaks:ST.n, parts:PARTS.filter(p=>p.on).length, partsCap:PART_MAX, arrowsN:gl?gl.arrows.length:0, rocksN:gl?gl.rocks.length:0, dustN:gl?gl.dust.length:0, lastLand:gl?gl.lastLand:0,
      rain:liveR.map(r=>({ x:+r.x.toFixed(2), z:+r.z.toFixed(2), ct:+r.ct.toFixed(3), real:+r.real.toFixed(3), col:r.hex, S:+r.S.toFixed(3), landed:Array.from(r.landed).filter(v=>v>=0).length, emissive:+r.mat.emissiveIntensity.toFixed(2), arrowsVisible:r.arrows.visible&&!!r.grp.parent })),
      charge:liveC.map(c=>({ key:c.key, x:+c.x.toFixed(2), z:+c.z.toFixed(2), R:c.R, k:+c.k.toFixed(3), col:c.hex, emissive:+c.mat.emissiveIntensity.toFixed(3), launching:c.fade>=0, inScene:!!c.im.parent, rune:c.rune?+c.rune.m.material.opacity.toFixed(3):0 })) },cnt); } };
})();
