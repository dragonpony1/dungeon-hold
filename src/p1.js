/* DUNGEON HOLD — a Dungeon Defenders style hall in the Gnome's Tower world.
   Third-person squire, hero-sized defenses, goblin waves. Single file, Three.js r128 inlined. */
(function(){
'use strict';
const Q=new URLSearchParams(location.search), SILENT=Q.has('silent');
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
let seed=91731; const rnd=()=>{seed=(seed*1664525+1013904223)>>>0; return seed/4294967296;};
const R=(a,b)=>a+rnd()*(b-a);
const C=h=>new THREE.Color(h).convertSRGBToLinear();
const PI=Math.PI, TAU=PI*2;
const TOUCH=('ontouchstart' in window)&&matchMedia('(pointer:coarse)').matches;
if(TOUCH) document.body.classList.add('touch');

// ================= SOUND (off by default — M toggles) =================
let soundOff=SILENT||(localStorage.getItem('ddSound')!=='on');
let ac=null;
function A(){ if(soundOff) return null; if(!ac){ ac=new (window.AudioContext||window.webkitAudioContext)(); } if(ac.state==='suspended') ac.resume(); return ac; }
function beep(f,dur,type,vol,slide){ const a=A(); if(!a) return; const o=a.createOscillator(), g=a.createGain(); o.type=type||'square'; o.frequency.setValueAtTime(f,a.currentTime); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),a.currentTime+dur); g.gain.setValueAtTime(vol||.06,a.currentTime); g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+dur); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime+dur); }
function noise(dur,vol,f){ const a=A(); if(!a) return; const n=(a.sampleRate*dur)|0, b=a.createBuffer(1,n,a.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n); const s=a.createBufferSource(); s.buffer=b; const fl=a.createBiquadFilter(); fl.type='bandpass'; fl.frequency.value=f||1200; fl.Q.value=.7; const g=a.createGain(); g.gain.value=vol||.1; s.connect(fl).connect(g).connect(a.destination); s.start(); }
const SFX={ swing:()=>noise(.16,.14,900), harpoon:()=>{noise(.07,.12,2600); beep(240,.12,'square',.05,-160);}, ball:()=>beep(95,.32,'sine',.14,-45), hit:()=>beep(520,.06,'square',.04,-220), mana:()=>beep(880,.13,'sine',.05,420), crystal:()=>beep(150,.45,'sawtooth',.07,-70), place:()=>beep(330,.11,'triangle',.06,140), horn:()=>{beep(196,.7,'sawtooth',.06,0); beep(294,.7,'sawtooth',.05,0);}, held:()=>{beep(523,.15,'triangle',.06,0); setTimeout(()=>beep(659,.15,'triangle',.06,0),150); setTimeout(()=>beep(784,.3,'triangle',.06,0),300);}, hurt:()=>beep(200,.15,'square',.06,-80), sell:()=>beep(660,.1,'sine',.05,-300), destroy:()=>noise(.35,.16,400), thud:()=>beep(70,.25,'sine',.12,-30) };
function setSound(on){ soundOff=!on; localStorage.setItem('ddSound',on?'on':'off'); $('sndbtn').textContent=on?'🔊':'🔇'; if(!on&&ac) ac.suspend(); }
$('sndbtn').onclick=()=>setSound(soundOff);
$('sndbtn').textContent=soundOff?'🔇':'🔊';
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&ac) ac.suspend(); });
window.addEventListener('pagehide',()=>{ if(ac) ac.suspend(); });

// ================= GRID / MAP =================
const CELL=2, GW=34, GH=25, OX=33, OZ=35, WALLH=7;
const T={WALL:0,FLOOR:1,CARPET:2,DAIS:3,PILLAR:4,SPAWN:5,CRYSTAL:6,PROP:7};
const grid=new Uint8Array(GW*GH);
const idx=(cx,cz)=>cz*GW+cx;
const cw=cx=>cx*CELL+CELL/2-OX, cwz=cz=>cz*CELL+CELL/2-OZ;
const wc=x=>Math.floor((x+OX)/CELL), wcz=z=>Math.floor((z+OZ)/CELL);
const inb=(cx,cz)=>cx>=0&&cz>=0&&cx<GW&&cz<GH;
const gat=(cx,cz)=>inb(cx,cz)?grid[idx(cx,cz)]:T.WALL;
function fill(x0,x1,z0,z1,t){ for(let z=z0;z<=z1;z++) for(let x=x0;x<=x1;x++) grid[idx(x,z)]=t; }
fill(10,22,11,23,T.FLOOR);                                   // the great hall
fill(15,17,11,15,T.CARPET); fill(10,14,16,18,T.CARPET); fill(18,22,16,18,T.CARPET);
fill(15,17,16,18,T.DAIS); grid[idx(16,17)]=T.CRYSTAL;
fill(15,17,4,10,T.FLOOR); fill(14,18,1,3,T.FLOOR); grid[idx(16,2)]=T.SPAWN;         // north gate
fill(4,9,16,18,T.FLOOR); fill(4,6,6,18,T.FLOOR); fill(2,8,2,5,T.FLOOR); grid[idx(5,3)]=T.SPAWN; // west gate (with a bend)
fill(23,29,16,18,T.FLOOR); fill(29,32,14,20,T.FLOOR); grid[idx(31,17)]=T.SPAWN;    // east gate
[[12,13],[20,13],[12,21],[20,21]].forEach(([x,z])=>grid[idx(x,z)]=T.PILLAR);
[[10,11],[22,11],[10,23],[22,23]].forEach(([x,z])=>grid[idx(x,z)]=T.PROP);
const GOAL=idx(16,17);
const LANES={N:{cx:16,cz:2,face:0}, W:{cx:5,cz:3,face:0}, E:{cx:31,cz:17,face:-PI/2}};
const walk=t=>t===T.FLOOR||t===T.CARPET||t===T.DAIS||t===T.SPAWN;
const heroSolid=t=>t===T.WALL||t===T.PILLAR||t===T.CRYSTAL||t===T.PROP;
const defAt=new Array(GW*GH).fill(null);

// flow fields: 'free' ignores defenses, 'def' respects them
let flowFree=null, flowDef=null;
function bfs(respect){
  const nxt=new Int16Array(GW*GH).fill(-1), dist=new Int16Array(GW*GH).fill(-1);
  dist[GOAL]=0; const q=[GOAL]; let qi=0;
  while(qi<q.length){ const i=q[qi++]; const x=i%GW, z=(i/GW)|0;
    for(let k=0;k<4;k++){ const nx=x+[1,-1,0,0][k], nz=z+[0,0,1,-1][k]; if(!inb(nx,nz)) continue; const j=idx(nx,nz);
      if(dist[j]>=0||!walk(grid[j])) continue; if(respect&&defAt[j]) continue;
      dist[j]=dist[i]+1; nxt[j]=i; q.push(j); } }
  return {nxt,dist};
}
function reflow(){ flowFree=bfs(false); flowDef=bfs(true); }
reflow();
function los(ax,az,bx,bz){ const d=Math.hypot(bx-ax,bz-az); const n=Math.ceil(d/0.7)||1; for(let i=1;i<n;i++){ const t=i/n; const g=gat(wc(ax+(bx-ax)*t),wcz(az+(bz-az)*t)); if(g===T.WALL||g===T.PILLAR) return false; } return true; }

// ================= RENDERER / SCENE =================
const canvas=$('c'), ov=$('ov'), ovx=ov.getContext('2d');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0;
const scene=new THREE.Scene();
scene.background=C(0x0b0712); scene.fog=new THREE.Fog(C(0x0b0712),24,62);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,0.1,140);
function onResize(){ renderer.setSize(innerWidth,innerHeight); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); ov.width=innerWidth; ov.height=innerHeight; }
addEventListener('resize',onResize); onResize();

// lights: cool ambient, warm torches, cyan crystal
scene.add(new THREE.HemisphereLight(C(0x5a4a8a),C(0x130d1a),0.5));
const sun=new THREE.DirectionalLight(C(0x8a7ab0),0.22); sun.position.set(6,14,4); scene.add(sun);
const LIGHTS=[[-9,4.4,-9,0xff8a2a,1.5,16],[9,4.4,-9,0xff8a2a,1.5,16],[-9,4.4,9,0xff8a2a,1.5,16],[9,4.4,9,0xff8a2a,1.5,16],
  [0,5,-6,0xffb05a,.8,13],[0,3.2,0,0x4ae6ff,1.3,15],[0,4,-18,0xff8a2a,1.7,15],[0,4,-26,0xff8a2a,1.2,12],[-16,4,0,0xff8a2a,1.7,15],[-24,4,-10,0xff8a2a,1.5,14],[-24,4,-22,0xff8a2a,1.4,13],[18,4,0,0xff8a2a,1.7,15],[28,4,0,0xff8a2a,1.6,15],[-22,4,-26,0xc040ff,.9,10],[0,4,-28,0xc040ff,.9,10],[30,4,0,0xc040ff,.9,10]];
const torchLights=[];
LIGHTS.forEach(([x,y,z,c,i,d])=>{ const l=new THREE.PointLight(C(c),i,d,2); l.position.set(x,y,z); l.userData.base=i; scene.add(l); torchLights.push(l); });

// toon gradient (4 bands)
const GRAD=(()=>{ const t=new THREE.DataTexture(new Uint8Array([48,120,200,255]),4,1,THREE.LuminanceFormat); t.minFilter=t.magFilter=THREE.NearestFilter; t.needsUpdate=true; return t; })();
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
    if(t===T.CARPET){ g.fillStyle='#8c1d24'; g.fillRect(px,pz,S,S); for(let i=0;i<14;i++) splat(g,px+rnd()*S,pz+rnd()*S,R(1.5,4),rnd()<.5?'#5a0f14':'#b03038',.16);
      g.globalAlpha=.32; g.fillStyle='#e8b94a'; g.beginPath(); g.moveTo(px+16,pz+6); g.lineTo(px+26,pz+16); g.lineTo(px+16,pz+26); g.lineTo(px+6,pz+16); g.closePath(); g.fill(); g.globalAlpha=1;
      g.strokeStyle='#e8b94a'; g.lineWidth=3; g.beginPath();
      if(gat(x,z-1)!==T.CARPET){ g.moveTo(px,pz+2); g.lineTo(px+S,pz+2);} if(gat(x,z+1)!==T.CARPET){ g.moveTo(px,pz+S-2); g.lineTo(px+S,pz+S-2);} if(gat(x-1,z)!==T.CARPET){ g.moveTo(px+2,pz); g.lineTo(px+2,pz+S);} if(gat(x+1,z)!==T.CARPET){ g.moveTo(px+S-2,pz); g.lineTo(px+S-2,pz+S);} g.stroke();
    } else if(t===T.DAIS||t===T.CRYSTAL){ g.fillStyle='#2a2136'; g.fillRect(px,pz,S,S); for(let sx=0;sx<2;sx++) for(let sz=0;sz<2;sz++){ g.fillStyle=hsl(36,18,R(28,35)); g.fillRect(px+sx*16+1.5,pz+sz*16+1.5,13,13); }
      for(let i=0;i<6;i++) splat(g,px+rnd()*S,pz+rnd()*S,R(1,3),rnd()<.5?'#3a2e1e':'#c9b48a',.15);
      g.strokeStyle='#e8b94a'; g.lineWidth=2.5; g.beginPath(); const D=v=>v!==T.DAIS&&v!==T.CRYSTAL;
      if(D(gat(x,z-1))){ g.moveTo(px,pz+1.5); g.lineTo(px+S,pz+1.5);} if(D(gat(x,z+1))){ g.moveTo(px,pz+S-1.5); g.lineTo(px+S,pz+S-1.5);} if(D(gat(x-1,z))){ g.moveTo(px+1.5,pz); g.lineTo(px+1.5,pz+S);} if(D(gat(x+1,z))){ g.moveTo(px+S-1.5,pz); g.lineTo(px+S-1.5,pz+S);} g.stroke();
    } else if(t===T.SPAWN){ g.fillStyle='#1d1430'; g.fillRect(px,pz,S,S); for(let i=0;i<10;i++) splat(g,px+rnd()*S,pz+rnd()*S,R(2,5),'#6a2fb0',.18);
    } else { g.fillStyle='#1c1626'; g.fillRect(px,pz,S,S);
      for(let sx=0;sx<2;sx++) for(let sz=0;sz<2;sz++){ const L=R(30,41), H=R(246,262); g.fillStyle=hsl(H,17,L); g.fillRect(px+sx*16+1.5,pz+sz*16+1.5,13,13);
        g.fillStyle=hsl(H,20,L+12); g.globalAlpha=.35; g.fillRect(px+sx*16+1.5,pz+sz*16+1.5,13,2); g.globalAlpha=1;
        for(let i=0;i<3;i++) splat(g,px+sx*16+2+rnd()*12,pz+sz*16+2+rnd()*12,R(1,3.5),rnd()<.5?hsl(H,15,L-10):hsl(H,22,L+10),.22); }
      if(rnd()<.12){ g.strokeStyle='#120c18'; g.lineWidth=1; g.globalAlpha=.6; g.beginPath(); g.moveTo(px+rnd()*S,pz+rnd()*S); g.lineTo(px+rnd()*S,pz+rnd()*S); g.stroke(); g.globalAlpha=1; }
    }
  }
  for(let i=0;i<7000;i++) splat(g,rnd()*c.width,rnd()*c.height,R(2,7),rnd()<.5?'#000':'#fff',.045);
  const tex=new THREE.CanvasTexture(c); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy()); return tex;
}
function paintWall(){
  const c=cv(256,256), g=c.getContext('2d'); g.fillStyle='#1a1322'; g.fillRect(0,0,256,256);
  for(let r=0;r<4;r++){ const y0=r*64, off=(r%2)*64; for(let b=-1;b<3;b++){ const x0=b*128+off; const L=R(33,43), H=R(246,258);
      g.fillStyle=hsl(H,15,L); g.fillRect(x0+3,y0+3,122,58);
      g.globalAlpha=.5; g.fillStyle=hsl(H,18,L+16); g.fillRect(x0+3,y0+3,122,4); g.fillRect(x0+3,y0+3,4,58); g.globalAlpha=.4; g.fillStyle='#0d0912'; g.fillRect(x0+3,y0+56,122,5); g.fillRect(x0+121,y0+3,4,58); g.globalAlpha=1;
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
const FLOORTEX=paintFloor(), WALLTEX=paintWall(), BANNERTEX=paintBanner();

// ================= BUILD THE HALL =================
const world=new THREE.Group(); scene.add(world);
{ const floor=new THREE.Mesh(new THREE.PlaneGeometry(GW*CELL,GH*CELL),new THREE.MeshToonMaterial({map:FLOORTEX,gradientMap:GRAD,color:C(0xffffff)})); floor.rotation.x=-PI/2; floor.position.set(GW*CELL/2-OX,0,GH*CELL/2-OZ); world.add(floor);
  const dais=new THREE.Mesh(new THREE.PlaneGeometry(6,6),new THREE.MeshToonMaterial({map:FLOORTEX,gradientMap:GRAD,color:C(0xffffff)})); // raised copy of the dais cells
  const u0=15/GW,u1=18/GW,v0=1-19/GH,v1=1-16/GH; const uv=dais.geometry.attributes.uv; uv.setXY(0,u0,v1); uv.setXY(1,u1,v1); uv.setXY(2,u0,v0); uv.setXY(3,u1,v0); uv.needsUpdate=true;
  dais.rotation.x=-PI/2; dais.position.set(0,0.5,0); world.add(dais);
  const daisSide=new THREE.Mesh(G.box(6,0.5,6),mat(0x4e4236)); daisSide.position.set(0,0.25,0); world.add(daisSide);
  [[0,-3.05],[0,3.05]].forEach(([x,z])=>world.add(M(G.box(6.2,.1,.12),mat(0xe0b040),x,.5,z))); [[-3.05,0],[3.05,0]].forEach(([x,z])=>world.add(M(G.box(.12,.1,6.2),mat(0xe0b040),x,.5,z)));
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(GW*CELL,GH*CELL),mat(0x120c1a)); ceil.rotation.x=PI/2; ceil.position.set(GW*CELL/2-OX,WALLH,GH*CELL/2-OZ); world.add(ceil);
}
const wallFaces=[];
{ const pos=[],nrm=[],uv=[],ind=[]; let vi=0;
  for(let z=0;z<GH;z++) for(let x=0;x<GW;x++){ if(grid[idx(x,z)]===T.WALL) continue;
    for(let k=0;k<4;k++){ const dx=[1,-1,0,0][k], dz=[0,0,1,-1][k]; if(gat(x+dx,z+dz)!==T.WALL) continue;
      const fx=cw(x)+dx*CELL/2, fz=cwz(z)+dz*CELL/2, tx=dz, tz=-dx, hx=tx*CELL/2, hz=tz*CELL/2;
      const P=[[fx-hx,0,fz-hz],[fx-hx,WALLH,fz-hz],[fx+hx,WALLH,fz+hz],[fx+hx,0,fz+hz]];
      const ua=((fx-hx)*tx+(fz-hz)*tz)/CELL, ub=((fx+hx)*tx+(fz+hz)*tz)/CELL;
      const U=[[ua,0],[ua,WALLH/CELL],[ub,WALLH/CELL],[ub,0]];
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
// pillars, props, torches, banners
const flames=[];
function makeTorch(){ const g=new THREE.Group(); g.add(M(G.box(.14,.14,.34),mat(0x2b2540),0,0,.17)); const h=M(G.cyl(.05,.07,.7,7),mat(0x6b4a2a),0,.2,.34); h.rotation.x=-.35; g.add(h);
  g.add(M(G.cyl(.09,.07,.14,7),mat(0x3a3348),0,.56,.45));
  const f=M(G.cone(.17,.5,7),basic(0xff7a1a),0,.85,.46); f.userData.noOL=true; const f2=M(G.cone(.09,.34,7),basic(0xffd060),0,.82,.46); f2.userData.noOL=true; g.add(f,f2); const gl=glow(0xff8a2a,2.6,.7); gl.position.set(0,.9,.46); g.add(gl); flames.push({f,f2,p:rnd()*9}); return g; }
{ // pillars
  [[12,13],[20,13],[12,21],[20,21]].forEach(([x,z])=>{ const g=new THREE.Group(); g.position.set(cw(x),0,cwz(z));
    g.add(M(G.box(2,.5,2),mat(0x4a4262),0,.25,0)); g.add(M(G.cyl(.62,.7,6,12),mat(0x5a5276),0,3.5,0)); g.add(M(G.box(2,.5,2),mat(0x4a4262),0,6.75,0)); g.add(M(G.box(1.6,.2,1.6),mat(0xe0b040),0,.6,0)); world.add(g); });
  // props: barrels & crates in the hall corners
  [[10,11],[22,11]].forEach(([x,z])=>{ const g=new THREE.Group(); g.position.set(cw(x),0,cwz(z)); const bm=mat(0x7a4f2c), band=mat(0x2b2540);
    [[-.4,0,-.3],[.45,0,.35],[0,1.1,0]].forEach(([bx,by,bz])=>{ const b=new THREE.Group(); b.position.set(bx,by+.55,bz); b.add(M(G.cyl(.42,.42,1.1,10),bm)); b.add(M(G.cyl(.45,.45,.1,10),band,0,.35,0)); b.add(M(G.cyl(.45,.45,.1,10),band,0,-.35,0)); g.add(b); }); world.add(outline(g)); });
  [[10,23],[22,23]].forEach(([x,z])=>{ const g=new THREE.Group(); g.position.set(cw(x),0,cwz(z)); const cm=mat(0x8a5e34);
    g.add(M(G.box(1.1,1.1,1.1),cm,-.35,.55,.2)); g.add(M(G.box(.9,.9,.9),cm,.5,.45,-.3)); g.add(M(G.box(.8,.8,.8),cm,-.2,1.5,.2)); g.add(M(G.box(1.14,.08,.08),mat(0x3a2a20),-.35,.55,.76)); world.add(outline(g)); });
  // torches + banners along the walls
  let i=0; wallFaces.forEach(f=>{ const inHall=f.cx>=10&&f.cx<=22&&f.cz>=11&&f.cz<=23; i++;
    const yaw=Math.atan2(f.nx,f.nz);
    if(i%4===1){ const t=makeTorch(); t.position.set(f.x,3.1,f.z); t.rotation.y=yaw; world.add(t); }
    else if(inHall&&i%4===3){ const b=new THREE.Mesh(new THREE.PlaneGeometry(1.3,2.6),new THREE.MeshToonMaterial({map:BANNERTEX,gradientMap:GRAD,color:C(0xffffff),transparent:true,side:THREE.DoubleSide,alphaTest:.5})); b.position.set(f.x+f.nx*.12,4.2,f.z+f.nz*.12); b.rotation.y=yaw; world.add(b); const rod=M(G.cyl(.05,.05,1.7,6),mat(0xe0b040),f.x+f.nx*.12,5.5,f.z+f.nz*.12); rod.rotation.y=yaw; rod.rotation.z=PI/2; world.add(rod); } });
  // chandelier over the north half of the hall
  const ch=new THREE.Group(); ch.position.set(0,5.2,-6); const ring=M(new THREE.TorusGeometry(1.6,.09,6,18),mat(0x2b2540)); ring.rotation.x=PI/2; ch.add(ring); ch.add(M(G.cyl(.03,.03,1.8,5),mat(0x2b2540),0,.9,0));
  for(let k=0;k<6;k++){ const a=k/6*TAU; ch.add(M(G.cyl(.06,.06,.32,6),mat(0xf4ead0),Math.cos(a)*1.6,.2,Math.sin(a)*1.6)); const f=M(G.cone(.08,.24,6),basic(0xffd060),Math.cos(a)*1.6,.48,Math.sin(a)*1.6); f.userData.noOL=true; ch.add(f); flames.push({f,f2:f,p:k}); } const cg=glow(0xffb05a,3,.5); cg.position.y=.4; ch.add(cg); world.add(ch);
  // beams
  [-8,0,8].forEach(z=>world.add(M(G.box(26,.5,.5),mat(0x2a1f2c),0,WALLH-.25,z)));
}
// crystal on its pedestal
const crystalG=new THREE.Group(); world.add(crystalG);
const crystalMesh=(()=>{ const m=new THREE.Mesh(new THREE.OctahedronGeometry(1,0),new THREE.MeshToonMaterial({color:C(0x2fb8e8),emissive:C(0x0e7aa8),emissiveIntensity:.55,gradientMap:GRAD})); m.scale.set(1,1.9,1); return m; })();
{ crystalG.add(M(G.cyl(1.5,1.7,.3,12),mat(0x4a4262),0,.65,0)); crystalG.add(M(G.cyl(1.1,1.3,.3,12),mat(0x5a5276),0,.95,0)); crystalG.add(M(G.cyl(.7,.9,.35,10),mat(0x4a4262),0,1.27,0)); crystalG.add(M(G.cyl(1.32,1.32,.08,12),mat(0xe0b040),0,.83,0));
  const cg=new THREE.Group(); cg.position.y=3.2; cg.add(outline(crystalMesh)); cg.add(glow(0x4ae6ff,4.2,.45)); crystalG.add(cg); crystalG.userData.cg=cg;
  for(let k=0;k<4;k++){ const s=new THREE.Mesh(new THREE.OctahedronGeometry(.22,0),basic(0x9af8ff)); s.userData.noOL=true; s.userData.a=k/4*TAU; cg.add(s); crystalG.userData['s'+k]=s; } }
// spawn portals
const portals=[];
Object.entries(LANES).forEach(([k,l])=>{ const g=new THREE.Group(); g.position.set(cw(l.cx),0,cwz(l.cz)); g.rotation.y=l.face;
  const arch=new THREE.Group(); arch.position.z=-1.1; // stands at the back of the spawn room, facing the corridor
  arch.add(M(G.box(.6,4,.6),mat(0x2a2136),-1.7,2,0)); arch.add(M(G.box(.6,4,.6),mat(0x2a2136),1.7,2,0)); arch.add(M(G.box(4,.7,.7),mat(0x2a2136),0,4.2,0)); arch.add(M(G.box(.5,.5,.5),mat(0xe0b040),0,4.75,0));
  const disc=new THREE.Mesh(new THREE.CircleGeometry(1.5,20),new THREE.MeshBasicMaterial({color:C(0x4a1690),transparent:true,opacity:.9,side:THREE.DoubleSide})); disc.position.y=1.9; disc.userData.noOL=true;
  const ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.45,20,1),new THREE.MeshBasicMaterial({color:C(0xc040ff),transparent:true,opacity:.8,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false})); ring.position.y=1.9; ring.position.z=.02; ring.userData.noOL=true;
  const pg=glow(0xc040ff,4.5,.6); pg.position.y=1.9; arch.add(disc,ring,pg); g.add(outline(arch)); world.add(g); portals.push({g,ring,disc,k}); });
