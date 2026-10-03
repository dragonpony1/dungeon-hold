// ===== RANGED SHOTS (build 511 prep). Matt: "Yes I was gonna say some of the projectiles are anemic.", "Also on their card let the player pay gold to upgrade their shot count. It should cost a decent
// amount per additional count.", "They should travel long and fast not a slow lob. Do this for all ranged weapons". What every ranged hero's shot shares -- the Witch's staff bolt (82-staff.js), the
// Fighter's polearm bolt (the same bolt from its point, 86v-fighterpole.js) and the Ranger's arrow (83-bow.js) -- lives here, loaded just before both:
//   * THE FLIGHT: one speed per kind (BOLT_V 60, was 26; ARROW_V 70, was 30 -- a full charge still adds its 35% / 45% on top), dead straight, and a shot that misses flies on to FLY (1.5x) the hero's reach
//     before it fades instead of stopping at the aim point. Both update loops walk a frame's flight in steps of at most SUB, so a fast shot never skips a mob or a wall between two frames.
//   * THE VOLLEY: a weapon's SHOT points (the forge key 'wproj', 90-forge.js: bought with gold on the weapon's card, capped by rarity) are extra projectiles per attack. shots(it) = 1 + its points;
//     fan(dir,n) spreads them FAN (7 degrees) apart about the world's up -- the first ON the aim (so a lock-on's mob still takes the middle shot), then one right, one left, two right ... Each one is a
//     whole shot: the same damage, crit, pierce, set effects and talents. The attack rate does not change. With two weapons in hand (99k-dualwield.js) each hand's volley is THAT weapon's count.
//     Subterfuge (86i) already looses a five-arrow wedge: its wedge IS its volley, and its shot points add arrows to the wedge (wedgeN), at most 2 of them (90-forge caps the item there).
//   * THE LOOK, pooled (nothing is built per shot once the pools are warm -- a five-shot volley at a fast attack rate is a lot of projectiles): a hot white core, a glow and a wide halo in the shot's
//     colour, a camera-facing streak behind it (white down the middle, the colour at its edges, fading to the tail), and for an arrow a glowing shaft, a white-hot head and bright fletching. A hit is
//     a white flash, a glow, a ring and a burst of sparks. The colour is the weapon's SET colour (86w-setglow.js COL, the glow the set weapon wears in the hand), else the plain weapon's own (a staff
//     or polearm its tier's, as ever; a plain bow with no colour of its own the Ranger's green).
// Test hook: window.__rshots. Tests: rangedshots-test.mjs.
(function(){
'use strict';
const BOLT_V=60, ARROW_V=70, FLY=1.5, FAN=7*PI/180, SUB=.5, SUB_WEDGE_MAX=2;
const OLD={ BOLT_V:26, ARROW_V:30 };   // the speeds before build 511, for the record (and the suite's before/after)
const _Y=new THREE.Vector3(0,1,0), _c=new THREE.Vector3(), _s=new THREE.Vector3(), _v=new THREE.Vector3(), _t=new THREE.Vector3();
const heroId=()=>{ try{ return heroPick.id; }catch(e){ return window.__heroes?window.__heroes.pick():'knight'; } };
const RANGED={ witch:1, fighter:1, troll:1 };
const ranged=h=>!!RANGED[h===undefined?heroId():h];
// ---- how many: 1 + the weapon's shot points (never past its cap)
function extra(it){ if(!it||!it.ups) return 0; const n=+it.ups.wproj|0; if(n<=0) return 0; const F=Meta.forge, cap=F&&F.cap?F.cap(it,'wproj'):4; return clamp(n,0,Number.isFinite(cap)?cap:4); }
function handItem(){ const D=window.__dualwield; return (D&&D.offSwing&&D.dual&&D.offSwing()&&D.dual())?gear.weapon2:gear.weapon; }   // the weapon loosing THIS shot: the 2nd one while its hand swings
function shots(it){ return 1+extra(it===undefined?handItem():it); }
// ---- the fan
function offsets(n){ const o=[]; for(let i=0;i<n;i++) o.push(i===0?0:(i%2?1:-1)*((i+1)>>1)*FAN); return o; }   // 0, +7, -7, +14, -14 ...
function fan(dir,n){ return offsets(Math.max(1,n|0)).map(a=>a?dir.clone().applyAxisAngle(_Y,a):dir.clone()); }
function halfWidth(n){ let w=0; for(const a of offsets(Math.max(1,n|0))) w=Math.max(w,Math.abs(a)); return w; }
function wedgeN(kind,n){ const K=window.__bow&&window.__bow.info?window.__bow.info(kind):null; if(!K||!K.wedge) return 0; return K.wedge.n+Math.min(SUB_WEDGE_MAX,Math.max(0,(n|0)-1)); }
// ---- the colour: a set's own (86w), else the weapon's, else the hero's
const HERO_COL={ witch:0x9a6bff, fighter:0xffd27a, troll:0x9be06a };   // 73-specials.js CHARGE_COLOR
function colour(w,kind){ const H=window.__heldglow, sc=H&&H.col?H.col(kind):null; if(sc!=null) return sc;
  if(w==='bolt'){ const K=window.__staff&&window.__staff.info?window.__staff.info(kind||'hazel'):null; return K&&K.glow!=null?K.glow:HERO_COL.witch; }
  const K=window.__bow&&window.__bow.info?window.__bow.info(kind||'ash'):null; return K&&K.glow!=null?K.glow:HERO_COL.troll; }
// ---------------------------------------------------------------- the pooled look
const lin=hex=>new THREE.Color(hex).convertSRGBToLinear();
const SPR=new Map(), RIB=new Map(), BODY=new Map();
function sprMat(hex,op,wash){ const k=hex+'|'+op+'|'+(wash?1:0); let m=SPR.get(k); if(!m){ m=new THREE.SpriteMaterial({ map:GLOWT, color:lin(hex), blending:wash?THREE.NormalBlending:THREE.AdditiveBlending, depthWrite:false, transparent:true, opacity:op }); SPR.set(k,m); } return m; }   // wash: a soft orb of the colour laid OVER the scene (normal blending), so a volley's glows overlapping stay that colour instead of adding up to white
const RIB_VS='varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
const RIB_FS='uniform vec3 col; uniform float op; varying vec2 vUv;\n'+
  'void main(){ float a=vUv.y, x=abs(vUv.x-.5)*2.; float edge=1.-x*x; float core=1.-smoothstep(0.,.42,x); float k=pow(a,1.4)*edge*op;\n'+
  ' gl_FragColor=vec4(mix(col,vec3(1.),core*(.08+.32*a)),k);\n #include <tonemapping_fragment>\n #include <encodings_fragment>\n}';
function ribMat(hex){ let m=RIB.get(hex); if(!m){ m=new THREE.ShaderMaterial({ uniforms:{ col:{ value:lin(hex) }, op:{ value:.85 } }, vertexShader:RIB_VS, fragmentShader:RIB_FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide }); RIB.set(hex,m); } return m; }
function bodyMat(hex){ let m=BODY.get(hex); if(!m){ m=new THREE.MeshBasicMaterial({ color:lin(hex) }); BODY.set(hex,m); } return m; }
const ARROW_L=1.4; let AG=null;   // the arrow's shared pieces, made once
function arrowGeo(){ if(AG) return AG; const shaft=new THREE.CylinderGeometry(.038,.045,ARROW_L,6); shaft.rotateX(PI/2);
  const head=new THREE.ConeGeometry(.1,.34,6); head.rotateX(PI/2); head.translate(0,0,ARROW_L/2+.15);
  const f1=new THREE.BoxGeometry(.02,.17,.32); f1.translate(0,0,-ARROW_L/2+.2); const f2=new THREE.BoxGeometry(.17,.02,.32); f2.translate(0,0,-ARROW_L/2+.2);
  AG={ shaft, head, f1, f2 }; return AG; }
const RIB_UV=new Float32Array([0,1, 1,1, 0,0, 1,0]), RIB_IX=[0,2,1, 1,2,3];
function ribbon(){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12),3)); g.setAttribute('uv',new THREE.BufferAttribute(RIB_UV,2)); g.setIndex(RIB_IX);
  const m=new THREE.Mesh(g,ribMat(0xffffff)); m.frustumCulled=false; m.matrixAutoUpdate=false; m.userData.noOL=true; m.renderOrder=2; return m; }
// sizes at size 1, world units: [hot core, glow, halo] sprite widths, the streak's half-width and its longest length
const LOOK={ bolt:{ hot:.8, mid:2.8, halo:5.6, w:.48, trail:7, lead:.15 }, arrow:{ hot:.55, mid:1.6, halo:3.4, w:.3, trail:7.5, lead:ARROW_L/2+.25 } };
const POOL={ bolt:[], arrow:[] }, made={ bolt:0, arrow:0 }; let live=0, takes=0;
function build(w){ const g=new THREE.Group(); g.name=w+'Shot'; g.userData.noOL=true; const L=LOOK[w];
  const halo=new THREE.Sprite(sprMat(0xffffff,.4)), mid=new THREE.Sprite(sprMat(0xffffff,.95)), hot=new THREE.Sprite(sprMat(0xffffff,1)); for(const s of [halo,mid,hot]){ s.userData.noOL=true; g.add(s); }
  let body=null; if(w==='arrow'){ const A=arrowGeo(); body=new THREE.Group(); body.name='arrowBody'; const parts={ shaft:new THREE.Mesh(A.shaft,bodyMat(0xffffff)), head:new THREE.Mesh(A.head,bodyMat(0xffffff)), f1:new THREE.Mesh(A.f1,bodyMat(0xffffff)), f2:new THREE.Mesh(A.f2,bodyMat(0xffffff)) };
    for(const k in parts){ parts[k].userData.noOL=true; body.add(parts[k]); } body.userData.parts=parts; g.add(body); mid.position.z=hot.position.z=L.lead; }
  made[w]++; return { w, g, halo, mid, hot, body, rib:ribbon(), hex:-1, size:1, bare:false }; }
// a pooled shot of colour hex, size (a charge's, a crit's), bare = the streak only (an arrow kind with its own projectile: Subterfuge's lightning)
function take(w,hex,size,bare){ const v=POOL[w].pop()||build(w); v.size=size||1; v.bare=!!bare; takes++; live++;
  if(v.hex!==hex){ v.hex=hex; v.halo.material=sprMat(hex,.5,true); v.mid.material=sprMat(hex,1,true); v.hot.material=sprMat(0xffffff,1); v.rib.material=ribMat(hex);
    if(v.body){ const P=v.body.userData.parts, hi=new THREE.Color(hex).lerp(new THREE.Color(0xffffff),.35).getHex(); P.shaft.material=bodyMat(hi); P.f1.material=P.f2.material=bodyMat(hex); P.head.material=bodyMat(0xfff6e0); } }
  v.halo.visible=v.mid.visible=v.hot.visible=!bare; if(v.body) v.body.visible=!bare; v.rib.visible=false; if(!bare) scene.add(v.g); scene.add(v.rib); return v; }
function give(v){ if(!v) return; if(v.g.parent) v.g.parent.remove(v.g); if(v.rib.parent) v.rib.parent.remove(v.rib); live--; POOL[v.w].push(v); }
// each frame: where it is, which way it flies, how long its streak is (it grows from nothing as the shot leaves), and fade 1..0 (its last stretch)
function place(v,x,y,z,d,trail,fade){ const L=LOOK[v.w], s=v.size*Math.max(0,fade);
  if(!v.bare){ v.g.position.set(x,y,z); if(v.body){ _t.set(x+d.x,y+d.y,z+d.z); v.g.lookAt(_t); v.body.scale.setScalar(Math.max(.001,s)); v.mid.position.z=v.hot.position.z=L.lead*s; }
    v.hot.scale.setScalar(L.hot*s); v.mid.scale.setScalar(L.mid*s); v.halo.scale.setScalar(L.halo*s); }
  const len=Math.min(trail,L.trail*v.size)*Math.max(0,fade); if(len<.05||s<.01){ v.rib.visible=false; return; } v.rib.visible=true;
  const lead=v.bare?.2:L.lead*s; const hx=x+d.x*lead, hy=y+d.y*lead, hz=z+d.z*lead, tx=x-d.x*len, ty=y-d.y*len, tz=z-d.z*len;
  _v.set(camera.position.x-x,camera.position.y-y,camera.position.z-z); _s.crossVectors(d,_v); if(_s.lengthSq()<1e-8) _s.crossVectors(d,_Y); if(_s.lengthSq()<1e-8) _s.set(1,0,0); _s.normalize();
  const w0=L.w*s*(v.bare?.8:1), w1=w0*.3, p=v.rib.geometry.attributes.position, a=p.array;
  a[0]=hx-_s.x*w0; a[1]=hy-_s.y*w0; a[2]=hz-_s.z*w0;  a[3]=hx+_s.x*w0; a[4]=hy+_s.y*w0; a[5]=hz+_s.z*w0;
  a[6]=tx-_s.x*w1; a[7]=ty-_s.y*w1; a[8]=tz-_s.z*w1;  a[9]=tx+_s.x*w1; a[10]=ty+_s.y*w1; a[11]=tz+_s.z*w1; p.needsUpdate=true; }
// ---------------------------------------------------------------- the hit: a white flash, a glow, a ring, sparks -- pooled too
const SPARKS=14, IMP=[], IFREE=[], IMP_MAX=48; let RINGG=null, impN=0;
function buildImpact(){ const g=new THREE.Group(); g.name='shotImpact'; g.userData.noOL=true; const sm=c=>new THREE.SpriteMaterial({ map:GLOWT, color:c, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true });
  const flash=new THREE.Sprite(sm(0xffffff)), glw=new THREE.Sprite(sm(0xffffff)); if(!RINGG) RINGG=new THREE.RingGeometry(.62,.82,28);
  const ring=new THREE.Mesh(RINGG,new THREE.MeshBasicMaterial({ transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide }));
  const pg=new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(SPARKS*3),3)); const pts=new THREE.Points(pg,new THREE.PointsMaterial({ map:GLOWT, size:.34, sizeAttenuation:true, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true })); pts.frustumCulled=false;
  for(const o of [glw,ring,pts,flash]){ o.userData.noOL=true; g.add(o); } return { g, flash, glw, ring, pts, vel:new Float32Array(SPARKS*3), t:0, life:.42, size:1 }; }
function impact(x,y,z,hex,size,small){ let u=IFREE.pop(); if(!u) u=IMP.length>=IMP_MAX?IMP.shift():buildImpact(); IMP.push(u);   /* past IMP_MAX the oldest one still showing is reused */
  u.t=0; u.size=(size||1)*(small?.6:1); u.life=small?.3:.42; u.g.position.set(x,y,z); const c=lin(hex); u.glw.material.color.copy(c); u.ring.material.color.copy(c); u.pts.material.color.copy(c).lerp(lin(0xffffff),.35);
  const p=u.pts.geometry.attributes.position.array, V=u.vel, sp=(small?7:10)*Math.sqrt(u.size); for(let i=0;i<SPARKS;i++){ p[i*3]=p[i*3+1]=p[i*3+2]=0; const a=Math.random()*TAU, e=(Math.random()*1.4-.3), r=sp*(.45+Math.random()*.7); V[i*3]=Math.cos(a)*Math.cos(e)*r; V[i*3+1]=Math.sin(e)*r+2; V[i*3+2]=Math.sin(a)*Math.cos(e)*r; }
  u.pts.geometry.attributes.position.needsUpdate=true; impTick(u,0); scene.add(u.g); impN++; return u; }
function impTick(u,dt){ u.t+=dt; const k=Math.min(1,u.t/u.life), s=u.size, f=Math.min(1,u.t/(u.life*.35));
  u.flash.scale.setScalar(s*(1.1+2.4*f)); u.flash.material.opacity=Math.max(0,1-f); u.glw.scale.setScalar(s*(2.2+3.6*k)); u.glw.material.opacity=.95*(1-k);
  u.ring.scale.setScalar(s*(.35+2.8*Math.sqrt(k))); u.ring.material.opacity=.95*Math.pow(1-k,1.4); u.ring.lookAt(camera.position);
  if(dt>0){ const p=u.pts.geometry.attributes.position.array, V=u.vel, dr=Math.exp(-3.2*dt); for(let i=0;i<SPARKS;i++){ V[i*3]*=dr; V[i*3+2]*=dr; V[i*3+1]=V[i*3+1]*dr-16*dt; p[i*3]+=V[i*3]*dt; p[i*3+1]+=V[i*3+1]*dt; p[i*3+2]+=V[i*3+2]*dt; } u.pts.geometry.attributes.position.needsUpdate=true; }
  u.pts.material.size=.34*Math.sqrt(s)*(1-.55*k); u.pts.material.opacity=1-k*k; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); for(let i=IMP.length-1;i>=0;i--){ const u=IMP[i]; impTick(u,dt); if(u.t>=u.life){ scene.remove(u.g); IMP.splice(i,1); IFREE.push(u); } } }; }
window.__rshots={ BOLT_V, ARROW_V, FLY, FAN, SUB, OLD, SUB_WEDGE_MAX, ranged, heroId, extra, shots, handItem, offsets, fan, halfWidth, wedgeN, colour, HERO_COL,
  take, give, place, impact, ARROW_L, wallAt:(x,z)=>!!wallAt(x,z), floor:(x,z)=>baseFloor(x,z),   // the last two for the suites: a clear lane to shoot down
  info:()=>({ pool:{ bolt:POOL.bolt.length, arrow:POOL.arrow.length }, made:Object.assign({},made), live, takes, impacts:IMP.length, impactsMade:IMP.length+IFREE.length, impN, mats:{ spr:SPR.size, rib:RIB.size, body:BODY.size } }) };
})();
