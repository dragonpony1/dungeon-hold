// ===== SIR BULLION'S KITCHEN HEARTH (build 529 prep). Matt, standing at square 46,14 by the Feast Hall's east doors: "we need a huge hearth at his end of the room".
// A great kitchen fireplace built into the east wall just south of the east doors (squares 46,18-21, between the owlbear and the corner barrels): stone jambs on plinths, a deep sooty firebox,
// a lintel of big blocks under a wide mantel shelf, a chimney breast tapering up to the ceiling with Sir Bullion's crest on it (a copper charger and two crossed ladles), a hearthstone in front.
// In the firebox a log fire that never sits still (code flames, as the boar pit's), embers drifting up, a warm flickering light, and a big iron stockpot hanging on a chain over the fire, his soup
// bubbling and steaming in it. Its four squares are solid (T.PROP: no hero, no mob, no tower walks into the fire); nothing on the horde's way -- the door is rows 12-14, the hearth rows 18-21.
// 95v-bullion.js's roll-out cinematic finds it (flare()) before he lumbers out of the doors beside it. Only MAP.id==='feast'. Test hook: window.__feastHearth.
(function(){
'use strict';
window.__feastHearth={ on:false };
if(!MAP||MAP.id!=='feast') return;
const CELLS=[[46,18],[46,19],[46,20],[46,21]];
const solidNow=[]; for(const [cx,cz] of CELLS){ const i=idx(cx,cz); if(grid[i]!==T.WALL&&grid[i]!==T.PROP){ grid[i]=T.PROP; solidNow.push([cx,cz]); } } if(solidNow.length) reflow();
const X0=cw(46)+CELL/2, ZC=(cwz(18)+cwz(21))/2, W=8.8, D=2.2, OPEN_H=5.3;   // the wall's face, the middle of the four squares; its width, depth and the firebox's mouth
// the hall's own stone: the throne-room panel's courses (moat-stone.jpg, baked from throne-panel2.glb as 56k5-moatstone.js uses it), laid on by world size so every block shows the same courses
const STONE_T=(()=>{ const t=new THREE.TextureLoader().load(ASSET('moat-stone.jpg')); t.wrapS=t.wrapT=THREE.MirroredRepeatWrapping; t.encoding=THREE.sRGBEncoding; return t; })();
const stoneMat=hex=>new THREE.MeshToonMaterial({ color:C(hex), map:STONE_T, gradientMap:GRAD_SOFT });
function worldUV(geo,tile){ geo=geo.index?geo.toNonIndexed():geo; geo.computeVertexNormals(); const p=geo.attributes.position, n=geo.attributes.normal, uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){ const ax=Math.abs(n.getX(i)), ay=Math.abs(n.getY(i)), az=Math.abs(n.getZ(i)); let u,v; if(ay>=ax&&ay>=az){ u=p.getX(i); v=p.getZ(i); } else if(ax>=az){ u=p.getZ(i); v=p.getY(i); } else { u=p.getX(i); v=p.getY(i); } uv[i*2]=u/tile; uv[i*2+1]=v/tile; }
  geo.setAttribute('uv',new THREE.BufferAttribute(uv,2)); return geo; }
const stone=stoneMat(0xc8b4ac), stone2=stoneMat(0x9a8884), cap=stoneMat(0x5a4a4a), iron=mat(0x2a2632), copper=mat(0xb8743a), wood=mat(0x5a3a22), soot=basic(0x120c14);
const g=new THREE.Group(); g.position.set(X0,0,ZC); g.rotation.y=-PI/2;   // local +z points out into the hall (west), local x along the wall (south)
const add=(geo,m,x,y,z)=>{ if(m&&m.map===STONE_T){ geo.translate(x||0,y||0,z||0); geo=worldUV(geo,3.2); geo.translate(-(x||0),-(y||0),-(z||0)); } const o=M(geo,m,x,y,z); g.add(o); return o; };
// the firebox: a sooty back, dark stone sides, a floor of ash
{ const b=add(G.box(6.4,OPEN_H,.3),soot,0,OPEN_H/2,.15); b.userData.noOL=true; for(const s of [-1,1]) add(G.box(.3,OPEN_H,D-.1),stone2,s*3.05,OPEN_H/2,D/2); const ash=add(G.box(6.2,.12,D-.3),basic(0x2a2026),0,.06,D/2); ash.userData.noOL=true; }
// the jambs on their plinths, with capitals
for(const s of [-1,1]){ const x=s*(W/2-.62); add(G.box(1.24,OPEN_H,D),stone,x,OPEN_H/2,D/2); add(G.box(1.56,.7,D+.3),cap,x,.35,D/2); add(G.box(1.5,.36,D+.25),cap,x,OPEN_H-.18,D/2);
  for(let k=0;k<4;k++) add(G.box(1.28,.06,D+.02),stone2,x,1.2+k*1.05,D/2); }   // mortar lines
// the lintel: a row of big blocks, a keystone proud of the rest, the mantel shelf over it
{ const n=7, bw=W/n; for(let k=0;k<n;k++){ const key=k===3; add(G.box(bw-.06,1.1+(key?.3:0),D+(key?.2:0)),k%2?stone2:stone,-W/2+bw*(k+.5),OPEN_H+.55+(key?.1:0),D/2+(key?.1:0)); }
  add(G.box(W+.9,.34,D+.55),cap,0,OPEN_H+1.27,D/2+.2); add(G.box(W+.5,.16,D+.35),stone2,0,OPEN_H+1.03,D/2+.12); }
// the chimney breast, tapering up to the ceiling, a band at its foot and the crest on its face
const HOOD0=OPEN_H+1.44, HOOD1=WALLH; { const hh=HOOD1-HOOD0, geo=new THREE.CylinderGeometry(6.2/Math.SQRT2,8.4/Math.SQRT2,hh,4,1); geo.rotateY(PI/4); const h=add(geo,stone,0,HOOD0+hh/2,.9); h.scale.z=1.7/8.4*1.2;
  add(G.box(8.6,.3,1.9),cap,0,HOOD0+.15,.95);
  const plate=add(G.cyl(1.05,1.05,.14,24),copper,0,HOOD0+1.55,1.75); plate.rotation.x=PI/2; const rim=add(new THREE.TorusGeometry(1.05,.08,6,24),cap,0,HOOD0+1.55,1.83); rim.userData.noOL=true;
  for(const s of [-1,1]){ const L=new THREE.Group(); L.position.set(0,HOOD0+1.55,1.95); L.rotation.z=s*.75; g.add(L); L.add(M(G.cyl(.07,.07,2.6,6),iron,0,.2,0)); const bowl=M(G.sph(.32,10,8),iron,0,-1.2,.05); bowl.scale.z=.5; L.add(bowl); } }
// the hearthstone in front, out over the floor tiles (flat: walked over)
{ const hs=add(G.box(W+.4,.1,1.3),stone2,0,.05,D+.65); hs.userData.noOL=true; for(let k=1;k<5;k++){ const ln=add(G.box(.05,.11,1.3),cap,-W/2+k*W/5,.055,D+.65); ln.userData.noOL=true; } }
// the fire: andirons, logs, a bed of coals, flames, a glow and its light
for(const s of [-1,1]){ add(G.box(.12,.9,.12),iron,s*1.7,.45,1.5); add(G.box(.12,.12,1.2),iron,s*1.7,.12,1.0); const k=add(G.sph(.13,8,6),iron,s*1.7,.95,1.5); k.userData.noOL=true; }
[[0,.32,1.0,0,.12],[0,.55,1.15,0,-.1],[-.6,.3,.75,.6,0],[.7,.3,.8,-.55,0]].forEach(([x,y,z,ry,rz])=>{ const l=add(G.cyl(.2,.22,3.4,8),wood,x,y,z); l.rotation.z=PI/2+rz; l.rotation.y=ry; });
{ const c=add(G.box(4.8,.18,1.4),basic(0x7a2006),0,.14,1.0); c.userData.noOL=true; }
const flames=[]; [[9,0xe8360a,.62,2.3,1.1,.65,4.8],[8,0xff7414,.42,1.6,.8,1.05,4.2],[5,0xffc23a,.26,1.0,.5,1.35,3.2]].forEach(([n,col,r0,h0,hv,z,span],L)=>{ for(let k=0;k<n;k++){ const u=(n>1?k/(n-1)-.5:0)*span, r=r0*(.85+((k*7)%3)*.12), h=h0+((k*5+L)%4)*hv/3;   // three layers: deep red-orange at the back, orange, a yellow heart in front
    const f=add(G.cone(r,h,7),basic(col,{ transparent:true, opacity:.92, depthWrite:false }),u,h/2,z+((k*3)%2)*.12); f.userData.noOL=true; flames.push({ f, p:k*1.37+L*2.1, h:1, base:h, u }); } });
const fireGlow=glow(0xff6a1a,8,.45); fireGlow.position.set(0,1.6,.6); g.add(fireGlow);
const light=new THREE.PointLight(C(0xff8a3a),2.6,22,2); light.position.set(0,2.4,2.6); g.add(light);
// the stockpot on its chain, his soup in it
const POT_Y=2.0; { add(G.cyl(.05,.05,OPEN_H-POT_Y-1.25,6),iron,0,POT_Y+1.25+(OPEN_H-POT_Y-1.25)/2,1.1).userData.noOL=true; add(new THREE.TorusGeometry(.18,.05,6,10),iron,0,POT_Y+1.35,1.1).userData.noOL=true; }
const potG=new THREE.Group(); potG.position.set(0,POT_Y,1.1); g.add(potG);
{ const prof=[[0,0],[.55,.02],[.95,.15],[1.2,.45],[1.28,.85],[1.24,1.18],[1.34,1.26],[1.3,1.32]].map(([x,y])=>new THREE.Vector2(x,y)); const pot=M(new THREE.LatheGeometry(prof,22),new THREE.MeshToonMaterial({ color:C(0x2a2632), gradientMap:GRAD, side:THREE.DoubleSide })); potG.add(pot);
  const bail=M(new THREE.TorusGeometry(1.3,.05,6,20,PI),iron,0,1.3,0); potG.add(bail); for(const s of [-1,1]){ const ear=M(new THREE.TorusGeometry(.14,.05,6,10),iron,s*1.3,1.15,0); ear.rotation.y=PI/2; potG.add(ear); }
  for(const s of [-1,1]){ const leg=M(G.cone(.12,.4,5),iron,s*.55,-.1,0); leg.rotation.x=PI; potG.add(leg); } }
const soupTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); const r=x.createRadialGradient(64,64,6,64,64,64); r.addColorStop(0,'#f2a24a'); r.addColorStop(.7,'#d8782a'); r.addColorStop(1,'#8a4414'); x.fillStyle=r; x.fillRect(0,0,128,128);
  for(let i=0;i<9;i++){ x.fillStyle='#fff6e6'; x.fillRect(20+Math.random()*80,20+Math.random()*80,7,7); } for(let i=0;i<14;i++){ x.fillStyle='#5aa83a'; x.beginPath(); x.ellipse(20+Math.random()*88,20+Math.random()*88,4,1.6,Math.random()*PI,0,TAU); x.fill(); }
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t; })();
const soup=M(new THREE.CircleGeometry(1.22,24),new THREE.MeshBasicMaterial({ map:soupTex })); soup.rotation.x=-PI/2; soup.position.y=1.12; soup.userData.noOL=true; potG.add(soup);
const bubbles=[]; for(let k=0;k<6;k++){ const b=M(G.sph(.12,8,6),basic(0xf4b060)); b.userData.noOL=true; potG.add(b); bubbles.push({ b, t:Math.random()*1.2, x:0, z:0 }); }
world.add(outline(g));
// embers and steam: a few sprites each, recycled
const SOFT=(()=>{ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const r=x.createRadialGradient(32,32,0,32,32,32); r.addColorStop(0,'rgba(255,255,255,.9)'); r.addColorStop(.5,'rgba(255,255,255,.35)'); r.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=r; x.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();
const toWorld=(lx,ly,lz)=>new THREE.Vector3(lx,ly,lz).applyMatrix4(g.matrixWorld);
g.updateMatrixWorld(true);
const embers=[]; for(let k=0;k<26;k++){ const s=glow(k%2?0xffb040:0xff7020,.18,.9); scene.add(s); embers.push({ s, t:Math.random()*3, life:2+Math.random()*1.5, lx:0, ly:0, lz:0, vx:0, vy:0, vz:0 }); }
const steam=[]; for(let k=0;k<10;k++){ const s=new THREE.Sprite(new THREE.SpriteMaterial({ map:SOFT, color:C(0xf0e8e0), transparent:true, opacity:0, depthWrite:false })); s.userData.noOL=true; scene.add(s); steam.push({ s, t:Math.random()*2.4, life:2.4 }); }
let flare=0, flareTo=0;
WORLDANIM.push((dt,t)=>{ flare+=(flareTo-flare)*Math.min(1,dt*2.5); const F=1+flare*.8;
  for(const o of flames){ const k=(.78+.25*Math.sin(t*9+o.p)+.14*Math.sin(t*23+o.p*2))*F; o.f.scale.set(1+flare*.25,k,1+flare*.25); o.f.position.y=o.base*k/2; o.f.rotation.y=t*.6+o.p; }
  fireGlow.material.opacity=Math.min(.9,(.4+.1*Math.sin(t*7.3))*(1+flare*.5)); fireGlow.scale.setScalar(8*(1+flare*.4)); light.intensity=(2.4+.35*Math.sin(t*11)+.25*Math.sin(t*17.3))*(1+flare*.9);
  potG.rotation.z=Math.sin(t*.8)*.02; for(const b of bubbles){ b.t+=dt; if(b.t>1.2){ b.t=0; const a=Math.random()*TAU, r=Math.random()*.9; b.x=Math.cos(a)*r; b.z=Math.sin(a)*r; } const k=b.t/1.2; b.b.position.set(b.x,1.12,b.z); b.b.scale.setScalar(Math.max(.01,Math.sin(k*PI)*(1+flare*.6))); }
  for(const e of embers){ e.t+=dt; if(e.t>e.life){ e.t=0; e.life=1.6+Math.random()*1.8; e.lx=(Math.random()-.5)*4; e.ly=.6; e.lz=.8+Math.random()*.8; e.vx=(Math.random()-.5)*.5; e.vy=1.6+Math.random()*1.4; e.vz=.2+Math.random()*.7; }
    const p=toWorld(e.lx+e.vx*e.t+Math.sin(e.t*3+e.life)*.25,e.ly+e.vy*e.t,e.lz+e.vz*e.t); e.s.position.copy(p); e.s.material.opacity=.95*Math.max(0,1-e.t/e.life); e.s.scale.setScalar(.16+.08*Math.sin(e.t*9)); }
  for(const s of steam){ s.t+=dt*(1+flare); if(s.t>s.life){ s.t=0; s.a=Math.random()*TAU; } const k=s.t/s.life; const p=toWorld(Math.cos(s.a||0)*.5,POT_Y+1.3+k*2.6,1.1+Math.sin(s.a||0)*.4+k*.5); s.s.position.copy(p); s.s.scale.setScalar(.8+k*1.8); s.s.material.opacity=.42*Math.sin(k*PI)*(1+flare*.5); } });
const fire=toWorld(0,1.6,1.1), front=toWorld(0,0,D+.65);
window.__feastHearth={ on:true, cells:CELLS.map(c=>c.slice()), solid:()=>CELLS.every(([cx,cz])=>grid[idx(cx,cz)]===T.PROP), fire:{ x:fire.x, y:fire.y, z:fire.z }, front:{ x:front.x, z:front.z }, x0:X0, zc:ZC, width:W,
  flare:k=>{ flareTo=Math.max(0,+k||0); }, flareNow:()=>+flare.toFixed(2), group:g, flames:flames.length, embers:embers.length };
})();
