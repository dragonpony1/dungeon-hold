// ===== SUBTERFUGE (build 170): the eleventh named mythic (97-mythics.js NAMED), a bow. Matt, 2026-09-27: "this bow shoots out 5
// projectiles in a wedge shape", "electric damage", "yes chain lightning". No picture of it exists yet, so it's designed here:
//   bow-subterfuge   a dark-wood recurve bound in black leather, blackened steel at the bands and forked prongs at the tips, a
//                    storm-blue crystal in the belly and at each nock, a burning blue string, lightning veins down the front of
//                    both limbs and little white-blue sparks that flicker on and off along them (K.anim below)
// What it does, through three hooks on 83-bow.js's fireArrow (K.wedge, K.arrow, K.onHit):
//   • EVERY loose -- a tap or a full draw -- is five arrows fanned across a 40° wedge about the aim, each HALF the shot's damage;
//     a full draw's pierce (two more mobs) and speed carry to all five
//   • they fly as crackling blue-white lightning bolts, not wood: a jagged white core in a blue sheath that re-jags ~20x a second
//   • the FIRST mob each arrow hits throws chain lightning: up to 3 more jumps, each to the nearest mob within CH_REACH not yet in
//     that chain and in sight, for 60% → 35% → 20% of that arrow's hit, a bolt drawn between each (after 85-familiars.js's
//     Crystal Owl beam). The damage lands at once; the bolts appear one after another, so it reads as jumping
// Single target it is weaker than a plain bow (only the middle arrow finds one goblin at range: half a shot); into a pack every
// arrow finds someone and chains -- that's the trade.
// Who holds it (86h-named.js namedModel, the same rule as the other two in reverse): only the Troll draws Subterfuge. The Knight
// holds the top sword (holy), the Witch the top staff (staff-battle) and the Fighter the top plain polearm (polearm-battle, build 510 prep) -- the stats are theirs, the wedge is a bow's.
// On the floor it always stands as itself, the bow (93c-weaponstand.js), in a storm-blue column with gold motes.
// Co-op: a guest's shot reaches the host as the guest's bow kind (99-network.js hostGuestShot → window.__bow.fireArrow), so the
// wedge and the chains happen on the host's real mobs; the host sends that guest its chains to draw ('powerFx' k:'chain').
(function(){
const {V,lit,tube,spike,noOL}=window.__setweapons.kit;
const SB={wood:0x2e2018,leather:0x121014,steel:0x39414e,glow:0x3fa8ff,gem:0xa8dcff,bolt:0x6cc0ff,hot:0xeef8ff};
const WEDGE={n:5,spread:40*PI/180,mul:.5};
const CHAIN=[.6,.35,.2], CH_REACH=4.5, CH_STAGGER=.06;
// ---------------------------------------------------------------- the bow's own fittings (hung on the limbs so they bend with the draw)
const zig=(n,h,amp,seed)=>{ const pts=[]; for(let i=0;i<=n;i++) pts.push([i%2?amp*(i%4===1?1:-1)*(.7+.3*Math.sin(seed+i)):0,-h/2+h*i/n,0]); return pts; };   // a short lightning zigzag up +y
function deco(g,h){ const leather=mat(SB.leather), steel=mat(SB.steel), bolt=lit(SB.bolt), hot=lit(SB.hot);
  for(const [u,len] of [[.2,.07],[.33,.05],[.67,.05],[.8,.07]]){ h.at(M(G.cyl(.031,.031,len,8),leather),u); h.at(M(G.cyl(.033,.033,.008,8),steel),u+(u<.5?-1:1)*len/(h.L*2.2)); }   // black leather bindings, a steel lip on each
  for(const u of [.12,.25,.38,.62,.75,.88]){ const v=noOL(tube(zig(4,.085,.011,u*20),.0042,bolt,12)); h.at(v,u,.028); }   // lightning veins down the front of the limbs
  for(const u of [.03,.97]) for(const s of [-1,1]){ const p=spike(.008,.07,steel,0,0,0,0,0); p.rotation.set(u>.5?-.5:PI+.5,0,s*.5); h.at(p,u,-.01); }   // forked prongs at the tips, swept back
  for(let i=0;i<8;i++){ const u=[.1,.18,.29,.41,.59,.71,.82,.9][i]; const sp=new THREE.Mesh(new THREE.OctahedronGeometry(.013,0),hot); sp.scale.set(.5,1.7,.5); sp.name='spark'+i; sp.userData.noOL=true; h.at(sp,u,.045+(i%3)*.01); sp.position.x=(i%2?1:-1)*.03; }   // the sparks K.anim flickers
  g.add(noOL(M(G.sph(.03,8,6),lit(SB.glow),0,h.gp.y,h.gp.z-.03))); }   // a blue coal behind the grip
function anim(root,dt,t){ for(let i=0;i<8;i++){ const s=root.getObjectByName('spark'+i); if(!s) break; const on=Math.sin(t*(7+i*1.3)+i*2.1)>.2&&rnd()>.12; s.visible=on; if(on){ s.rotation.z=rnd()*TAU; s.scale.set(.5,1.2+rnd()*1.4,.5); } }
  const n=root.getObjectByName('nocked'); if(n&&AGLB&&!n.getObjectByName('subArrow')){ while(n.children.length) n.remove(n.children[0]); const r=realArrow(true); while(r.children.length) n.add(r.children[0]); delete n.userData.zapL; ZAPS.delete(n); }   // a bow built before the model landed swaps its string's bolt for the real arrow
  const z=n&&n.visible&&zapOf(n); if(z){ z.t+=dt; if(z.t>.06){ z.t=0; jag(n); } } }   // the bolt on the string crackles too
// ---------------------------------------------------------------- the arrow: a lightning bolt
const SEG=new THREE.CylinderGeometry(1,1,1,5), UPV=new THREE.Vector3(0,1,0), _d=new THREE.Vector3(), _a=new THREE.Vector3(), _b=new THREE.Vector3();
let CORE=null, SHEATH=null, HEAD=null, HEAD2=null;
function mats(){ if(CORE) return; CORE=basic(0xf4fbff); SHEATH=basic(0x3a9cff,{transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending}); HEAD=glow(0x3a98ff,.95,.8); HEAD2=glow(0xffffff,.35,.9); }
function place(m,a,b,r){ _d.subVectors(b,a); const L=_d.length()||1e-3; m.position.copy(a).addScaledVector(_d,.5); m.scale.set(r,L,r); m.quaternion.setFromUnitVectors(UPV,_d.normalize()); }
// a bolt's pieces are found by name, not kept in userData: a mounted bow is a clone, and a clone's userData is copied as JSON
const ZAPS=new WeakMap();
function zapOf(g){ let z=ZAPS.get(g); if(z) return z; const L=g.userData.zapL; if(!L) return null; z={L,core:[],sheath:[],forks:[],t:0};
  for(let i=0;g.getObjectByName('zc'+i);i++){ z.core.push(g.getObjectByName('zc'+i)); z.sheath.push(g.getObjectByName('zs'+i)); } for(let i=0;g.getObjectByName('zf'+i);i++) z.forks.push(g.getObjectByName('zf'+i)); ZAPS.set(g,z); return z; }
function jag(g){ const z=zapOf(g); if(!z) return; const L=z.L, n=z.core.length; const pts=[];   // a fresh zigzag down the bolt's length (+z is forward), and two short forks off it
  for(let i=0;i<=n;i++){ const f=i/n; const k=i===0||i===n?0:1; pts.push(V((rnd()-.5)*.2*k,(rnd()-.5)*.2*k,-L/2+L*f)); }
  for(let i=0;i<n;i++){ place(z.core[i],pts[i],pts[i+1],.015); place(z.sheath[i],pts[i],pts[i+1],.06); }
  z.forks.forEach((f,j)=>{ const p=pts[1+((rnd()*(n-1))|0)]; _a.copy(p); _b.set(p.x+(rnd()-.5)*.45,p.y+(rnd()-.5)*.45,p.z-.1-rnd()*.25); place(f,_a,_b,.011); }); }
function makeBolt(K,nocked){ loadArrow(); if(AGLB) return realArrow(nocked); mats(); const g=new THREE.Group(); const L=nocked?1.1:1.4, n=nocked?5:7; g.userData.zapL=L;
  for(let i=0;i<n;i++){ const c=new THREE.Mesh(SEG,CORE), s=new THREE.Mesh(SEG,SHEATH); c.name='zc'+i; s.name='zs'+i; c.userData.noOL=s.userData.noOL=true; g.add(c,s); }
  for(let i=0;i<(nocked?1:2);i++){ const f=new THREE.Mesh(SEG,CORE); f.name='zf'+i; f.userData.noOL=true; g.add(f); }
  const h=HEAD.clone(); h.position.z=L/2; if(nocked) h.scale.setScalar(.7); g.add(h); if(!nocked){ const h2=HEAD2.clone(); h2.position.z=L/2; g.add(h2); }   // (clones share the sprite material: nothing to free per bolt. Kept small: five heads leaving one bow add up to a white blot)
  jag(g); return g; }
// build 214: Matt's own Electric Arrow (parts/assets/subterfuge-arrow.glb, 1K) replaces the code-built bolt once it has loaded -- fetched the
// first time a Subterfuge is built (equipped, or standing on the floor), never before; the bolt above stays the stand-in until then
let AGLB=null, AP=null;
// build 219: Matt's "Chain Lightning Impact" -- his VFX picture, its grey levelled to black (parts/assets/fx-chain-impact.jpg) so
// additive blending shows only the lightning; a quick flash that swells and fades on every mob the lightning reaches
let IMPACT=null;
function impactTex(){ if(!IMPACT){ IMPACT=new THREE.TextureLoader().load(ASSET('fx-chain-impact.jpg')); IMPACT.encoding=THREE.sRGBEncoding; } return IMPACT; }
function impactSprite(pos,size){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:impactTex(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,rotation:rnd()*TAU})); s.position.copy(pos); s.scale.setScalar(size*.45); s.userData.noOL=true; s.userData.size=size; return s; }
function loadArrow(){ impactTex(); if(AGLB||AP) return; AP=fetchBytes(ASSET('subterfuge-arrow.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(gltf=>{ try{
    const root=gltf.scene||gltf.scenes[0]; root.updateMatrixWorld(true); const box=new THREE.Box3().setFromObject(root); const size=box.getSize(new THREE.Vector3()), ctr=box.getCenter(new THREE.Vector3());
    const sc=1/Math.max(size.x,1e-6); const spin=new THREE.Group(); spin.name='subArrowSpin'; spin.add(root); root.scale.setScalar(sc); root.position.set(-ctr.x*sc,-ctr.y*sc,-ctr.z*sc);   // one unit head to tail, centred; each arrow scales it to its own length
    toonify(root,sc*1.4); root.traverse(o=>{ if(o.isMesh&&!o.userData.isOL&&o.material&&o.material.map){ o.material.emissive=new THREE.Color(0xffffff); o.material.emissiveMap=o.material.map; o.material.emissiveIntensity=.9; } });   // lightning lights itself: its own icy blues glow through the hall's warm torchlight instead of going grey
    { const ol=[]; root.traverse(o=>{ if(o.userData.isOL) ol.push(o); }); ol.forEach(o=>o.parent.remove(o)); }   // and no ink: on its thin coils the outline swallowed the lightning (the code bolt never had one either)
    const w=new THREE.Group(); w.add(spin); w.rotation.y=PI/2;   // modelled lying along x, head at -x: turned so the head leads along +z, the way fireArrow aims a projectile
    w.traverse(o=>{ if(o.isMesh&&!o.userData.isOL) o.userData.noOL=true; }); AGLB=w;   // its own ink shells only: a mounted bow's outline pass would add a second
  }catch(e){ console.warn('subterfuge arrow model',e); } }).catch(e=>console.warn('subterfuge arrow model',e)); }
function realArrow(nocked){ mats(); const L=nocked?1.1:1.4, g=new THREE.Group(); const m=AGLB.clone(true); m.name='subArrow'; m.scale.setScalar(L); g.add(m);
  const h=HEAD.clone(); h.position.z=L/2; h.scale.setScalar(nocked?.45:.6); g.add(h); return g; }   // a small blue glow at the head: five arrows leaving one bow still read as lightning at range
function arrowTick(g,dt){ const sp=g.getObjectByName('subArrowSpin'); if(sp){ sp.rotation.x+=dt*9; return; } const z=zapOf(g); if(!z) return; z.t+=dt; if(z.t>=.05){ z.t=0; jag(g); } }   // the real arrow rolls about its own shaft in flight
// ---------------------------------------------------------------- chain lightning
const FX=[]; let CHAINS=0, LAST=null, DRAWN=0;
function zap(a,b,delay,first){ const g=new THREE.Group(); g.visible=false; const core=basic(0xf4fbff,{transparent:true,depthWrite:false}), sh=basic(0x2f86ff,{transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending});
  const n=6; let p=a.clone(); for(let i=1;i<=n;i++){ const q=i===n?b.clone():a.clone().lerp(b,i/n); if(i<n){ q.x+=(rnd()-.5)*.45; q.y+=(rnd()-.5)*.35; q.z+=(rnd()-.5)*.45; } const c=new THREE.Mesh(SEG,core), s=new THREE.Mesh(SEG,sh); c.userData.noOL=s.userData.noOL=true; place(c,p,q,first?.026:.02); place(s,p,q,first?.1:.08); g.add(c,s); p=q; }
  const fl=glow(0x3f90ff,1.4,.9); fl.position.copy(b); g.add(fl); const sp=impactSprite(b,first?1.7:1.35); g.add(sp); scene.add(g); FX.push({g,core,sh,fl,sp,t:-delay,life:.34}); }
function fxTick(dt){ for(let i=FX.length-1;i>=0;i--){ const f=FX[i]; f.t+=dt; if(f.t<0) continue; f.g.visible=true; const k=1-f.t/f.life; if(k<=0){ scene.remove(f.g); f.core.dispose(); f.sh.dispose(); f.fl.material.dispose(); if(f.sp) f.sp.material.dispose(); FX.splice(i,1); continue; }
    if(f.sp){ const u=Math.min(1,f.t/(f.life*.3)); f.sp.scale.setScalar(f.sp.userData.size*(.45+.55*u)); f.sp.material.opacity=Math.min(1,k*1.4); }
    const fl=k>.5||Math.sin(f.t*90)>0; f.core.opacity=(fl?1:.35)*k; f.sh.opacity=.8*k; f.fl.material.opacity=.9*k; } }   // it flickers as it fades
const mid=e=>V(e.x,e.y+(e.h||1.2)*.55,e.z);
function draw(segs){ DRAWN++; segs.forEach((s,i)=>zap(V(s[0],s[1],s[2]),V(s[3],s[4],s[5]),i*CH_STAGGER,i===0)); if(segs.length){ noise(.12,.06,3400); beep(1800,.08,'sawtooth',.02,-1200); } }
function chain(e0,dmg,owner){ const hitList=[e0], segs=[], hits=[]; let cur=e0;
  for(const mul of CHAIN){ let nx=null, nd=CH_REACH; for(const m of enemies){ if(m.dead||hitList.includes(m)) continue; const d=Math.hypot(m.x-cur.x,m.z-cur.z); if(d<nd&&los(cur.x,cur.z,m.x,m.z)){ nd=d; nx=m; } } if(!nx) break;
    const a=mid(cur), b=mid(nx), dm=Math.round(dmg*mul*10)/10; hurt(nx,dm,0,0); hits.push(dm); segs.push([a.x,a.y,a.z,b.x,b.y,b.z].map(v=>+v.toFixed(2))); hitList.push(nx); cur=nx; }
  CHAINS++; LAST={dmg,hits}; if(!segs.length) return hits;
  draw(segs);
  if(owner&&window.__net&&window.__net.role&&window.__net.role()==='host') window.__net.send('powerFx',{k:'chain',s:segs},owner);   // a guest's page has no real mobs to chain across: show it the bolts its arrow threw
  return hits; }
function onHit(a,e){ if(a.chained) return; a.chained=true; const g=new THREE.Group(), f=glow(0x5aa8ff,1.1,.9); f.position.copy(mid(e)); g.add(f); const sp=impactSprite(mid(e),1.25); g.add(sp); scene.add(g); FX.push({g,core:{dispose(){}},sh:{dispose(){}},fl:f,sp,t:0,life:.26}); chain(e,a.dmg,a.owner); }   // only the first mob an arrow meets throws a chain (a full draw's pierce hits don't)
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); fxTick(dt); }; }
// ---------------------------------------------------------------- the bow
const K={name:'Subterfuge',tier:5,len:1.04,wood:SB.wood,dark:SB.leather,band:SB.steel,glow:SB.glow,tips:'crystal',gem:SB.gem,motes:3,recurve:true,litString:true,
  deco,anim,wedge:WEDGE,arrow:makeBolt,arrowTick,onHit};
window.__bow.addKind('subterfuge',K);
window.__subterfuge={K,WEDGE,CHAIN,CH_REACH,chain,draw,chains:()=>CHAINS,drawn:()=>DRAWN,last:()=>LAST&&{dmg:LAST.dmg,hits:LAST.hits.slice()},fx:()=>FX.length,arrowModel:()=>!!AGLB};
})();
