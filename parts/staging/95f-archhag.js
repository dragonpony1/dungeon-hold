// ===== THE ARCHHAG, THE CLOISTER COURT'S BOSS (build 308). Matt: "just had two ideas, archhags and topiaries" -> "yes the archhag wakes the topiaries" -> "shes going to be the boss for the cloister" ->
// "more legendary jars, like 30" -> "when she first comes in she will cast and ressurect stickmen to fight for her. they are alarmingly faster that most mobs. she has a two phase healthbar. once the
// first one is gone she animates the topiaries" -> "let her stickmen run ahead but she walks more slowly staying back and casting".
// His art: the Archhag (a tall brier hag) rigged, with Walking, a spell cast (mage_soell_cast, 2.3 s), Idle_3 and Electrocuted_Fall on one 23-joint skeleton (archhag-walk/-cast/-idle/-death.glb),
// fetched in the background from the court's wave 5, like the pig trio (95d-pigbosses.js). The stickmen are code-built twig figures until he makes their art.
//   * SHE ARRIVES partway through the court's last wave (once ~75 of its mobs are out), a banner and a TWO-PHASE health bar. She walks slowly and hangs back as a ranged caster (16), no knockback
//     (99e-bossgrit.js), no tower slow holds her.
//   * PHASE ONE -- her arrival cast RAISES STICKMEN: ten twig men climb out of the ground round her and run ahead, alarmingly fast (about twice a goblin's pace -- a deliberate exception to the
//     "no mob speeds up" rule, Matt's call), frail and light-hitting.
//   * PHASE TWO -- when her first bar is gone (a single blow never skips it: it stops at the line) she holds, untouchable for her cast, and ANIMATES THE TOPIARIES: every one in the garden
//     (56d-courtdecor.js, his gnome witch / fighter / ranger) leaps out of its bed onto the nearest lane and hops on towards a Heartroot. One cut down regrows asleep after 18 s while she lives,
//     and her next cast wakes it.
//   * EVERY OTHER CAST CURSES: a tower in reach is wrapped in purple chains and cannot fire for 5 s (its cooldown held open); with none in reach she casts at the hero (a bolt) or the Heartroot.
//   * KILL HER: her whole fall plays out (the body stays for it), every topiary still hopping FALLS ASLEEP where it stands (a statue again, off the field), and 30 Legendary jars burst out
//     (99g-sludgejars.js BOSS), plus the boss chance at a named mythic (87-mythicdrops.js).
// Only MAP.id==='court', campaign. Test hook: window.__archhag.
(function(){
window.__archhag={loaded:()=>false};
if(TUTORIAL) return;
const K='archhag', TK='topiary', SK='stickman';
const FILES={walk:'archhag-walk.glb',attack:'archhag-cast.glb',idle:'archhag-idle.glb',death:'archhag-death.glb'};
MOBDIM[K]={fit:3.6,h:3.4,r:.75,nat:{walk:1.0,run:2.0}};
// build 416 (Matt: "on her second health bar she needs 5 times more health"): phase one keeps the health it had (half of the old 1400 x the map), phase two is FIVE times that -- her whole health is three times
// what it was, and the line between the bars sits at 5/6 of it (LINE). P2K is the multiple.
const P2HP=2;   /* build 416: what rises in her second life (the topiaries, stickmen, wolves) has double health */
const P2K=5, LINE=e=>e.max*P2K/(P2K+1);
MOBS[K]={hp:1400,spd:1.25,dmg:18,cd:4.6,mana:40,swingT:2.33,hitT:1.55};   // build 327: no longer a ranged mob -- she walks on (her hex, below, reaches 16 as she goes)
// build 327 (Matt, after a full run: "she only becaem less menacing when she stopped walking, she got to an auroa and stopped"): a ranged mob stops for anything in reach -- she no longer does.
// Her hex fires as she walks, every 4.6 s: it curses the nearest uncursed tower within 16 (never an aura ring or the cage: nothing stops for those), or failing one, throws a bolt at a hero she
// can see. Only her big spells (the raises, GROW, the garden's wake) stop her for the whole cast.
const HEX_R=16, HEX_EVERY=4.6;   // both bars together; she walks slowly (a goblin is 3.4); the whole cast clip over its own 2.33 s, the spell leaving her hands at two thirds
MOBDIM[TK]={fit:3.3,h:3.1,r:.7,nat:{walk:1.0,run:1.0}};
MOBS[TK]={hp:70,spd:2.1,dmg:9,cd:1.7,mana:6};   // a hedge gnome: sturdier than a goblin, no faster
MOBDIM[SK]={fit:1.9,h:1.8,r:.34,nat:{walk:1.0,run:2.2}};   // run: his Running clip covers about 2.2 body-heights a second
MOBS[SK]={hp:22,spd:6.6,dmg:7,cd:1.3,mana:3,swingT:1.2,hitT:.34};   // twig men: frail, light-hitting, and nearly twice a goblin's speed
// build 312: Matt's 3.5 s Punch_Forward_with_Both_Fists plays over 1.2 s, the blow as the first fist goes out (1.0 s of 3.5); a punch every 1.3 s (was .9) so each is 7 (was 5), about the same damage over time
if(Meta.XP){ Meta.XP[K]=Meta.XP[K]||90; Meta.XP[SK]=Meta.XP[SK]||1; }
const CURSE_T=5, REGROW_T=18, DEATH_HOLD=5.6, STICKMEN=10;
// build 320 (Matt: "the first round of stickmen come after about 10 seconds not right away then repeat until initial hp bar is gone"): a raise every 10 s through her first bar, none after it; at most
// 30 of hers on the field at once (a raise tops up to that) so a long first bar cannot bury the court
const RAISE_FIRST=10, RAISE_EVERY=10, STICK_CAP=30, RAISE_WOLVES_FIRST=5;   // build 330 (Matt: "shes not making wolves"): the first pack 5 s after the first stickmen, so a quick first bar still sees wolves
// ---------------------------------------------------------------- her model: four clip files on one rig, fetched once
function fixMats(root){ root.traverse(o=>{ if(o.isMesh&&o.material){ o.material.metalness=0; o.material.roughness=.85; if(o.material.emissive) o.material.emissive.setRGB(0,0,0); } }); }
let loadP=null;
// build 330 (Matt: "the archag kinda blends in with the other mobs, you couldnt find her unless you got up close. can we put a light on her or out line, or some color on her garb?"): all three --
// a thick glowing violet rim instead of everyone's dark ink line, a faint violet glow in her robes, and (per spawn) a pool of violet light on the ground round her with a turning sigil at her feet.
// The "light" is a glow laid on the floor, not a real light: adding a real one when she appears would make every material in the hall rebuild at that moment (a hitch at her entrance).
const HAG_RIM=0xb44cff, HAG_BRIGHT=.5;   // build 332 (Matt: "that looks like a little much ... maybe just some white light in her garb or somethign or just brighten her up some"): her own colours lit up
// (a white glow through her own texture) instead of a violet wash; the violet rim thinner (x1.7, was x2.4); the floor pool softer
function hagLook(root){ root.traverse(o=>{ if(!o.isMesh||!o.material) return;
  if(o.userData.isOL&&o.material.uniforms&&o.material.uniforms.col){ o.material.uniforms.col.value=C(HAG_RIM); } }); }   // build 333 (Matt: "its too much it takes her art out"): her own art untouched -- only the ink line turns violet (normal thickness); no glow on her
function hagAura(e){ const g=e.mdl.g; if(g.userData.hagAura) return; const grp=new THREE.Group(); grp.name='hagAura';
  const pool=new THREE.Mesh(new THREE.PlaneGeometry(8,8),new THREE.MeshBasicMaterial({map:GLOWT,color:C(0xa040ff),transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false}));
  pool.rotation.x=-PI/2; pool.position.y=.05; pool.userData.noOL=true; pool.visible=false; grp.add(pool);   // build 333: the pool's haze hid her art -- kept, switched off
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.25,1.55,48),new THREE.MeshBasicMaterial({color:C(0xd08aff),transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  ring.rotation.x=-PI/2; ring.position.y=.07; ring.userData.noOL=true; grp.add(ring);
  for(let i=0;i<6;i++){ const r=new THREE.Mesh(new THREE.CircleGeometry(.13,5),ring.material); const a=i/6*TAU; r.position.set(Math.cos(a)*1.4,.075,Math.sin(a)*1.4); r.rotation.x=-PI/2; r.userData.noOL=true; grp.add(r); }   // runes on the ring
  g.add(grp); g.userData.hagAura=grp; }
if(typeof TRACKS!=='undefined') TRACKS.archhag='assets/music-archhag.mp3';   // build 310: his drumline, fetched with her model (never at start)
function load(){ if(typeof musFetch==='function'&&typeof TRACKS!=='undefined'&&TRACKS.archhag) musFetch('archhag'); loadSticks(); loadTopiRigs(); if(window.__direwolf&&window.__direwolf.load) window.__direwolf.load();   /* build 330: her wolves too, wherever she comes */
  if(MOBGLB[K]) return Promise.resolve(); if(loadP) return loadP;   /* build 413: these two had been swallowed by the comment above since build 330 -- load() ran every frame from wave 5, re-downloading and re-parsing her 15 MB each frame (Matt: "on wave 6 ... the 4 assets that are hung causing the game to slide show") */
  const names=['walk','attack','idle','death'];
  loadP=Promise.all(names.map(k=>fetchBytes(ASSET(FILES[k])).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej)))))
    .then(gs=>{ try{ const root=gs[0].scene||gs[0].scenes[0]; fixMats(root); const fit=fitModel(root,MOBDIM[K].fit); toonify(root,fit.scale); hagLook(root);
        const clip=i=>(gs[i].animations||[])[0]; const map={walk:clip(0),run:clip(0),attack:clip(1),idle:clip(2),death:clip(3)};
        MOBGLB[K]={wrap:fit.wrap,map,scale:fit.scale}; }catch(e){ console.warn('archhag model',e); } })
    .catch(e=>console.warn('archhag model',e));
  return loadP; }
const court=()=>!SURVIVAL&&MAP&&MAP.id==='court';
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(court()&&S.wave>=5) load(); }; }
// ---------------------------------------------------------------- the stickman: a twig figure, limbs on named pivots (swung in code below)
function makeStick(){ const g=new THREE.Group(), twig=mat(0x8a6a44), dark=mat(0x5a4028), eyeM=basic(0xb8ff6a);   // pale bark, not black: in the night garden a dark twig was a silhouette
  const cyl=(r,l,m)=>{ const o=M(G.cyl(r*.7,r,l,5),m); return o; };
  const body=new THREE.Group(); body.position.y=.95; g.add(body);
  const torso=cyl(.07,.78,twig); torso.position.y=.3; torso.rotation.z=.08; body.add(torso);
  const head=M(G.sph(.15,7,6),dark,0,.82,0); body.add(head); for(const sx of [-1,1]){ const eye=M(G.sph(.05,6,5),eyeM,sx*.06,.84,.12); eye.userData.noOL=true; body.add(eye); } { const gl=glow(0x9aff5a,.9,.7); gl.position.set(0,.84,.14); body.add(gl); }   // eyes that glow
  for(let k=0;k<4;k++){ const sp=M(G.cone(.03,.22,4),twig,Math.cos(k*1.6)*.12,.95+k*.02,Math.sin(k*1.6)*.1); sp.rotation.z=Math.cos(k*1.6)*.9; sp.rotation.x=Math.sin(k*1.6)*.9; body.add(sp); }   // a crown of twigs
  const limb=(name,x,y,len,rz)=>{ const p=new THREE.Group(); p.name=name; p.position.set(x,y,0); const l=cyl(.045,len,twig); l.position.y=-len/2; p.add(l); if(/arm/.test(name)) for(let f=0;f<3;f++){ const c=M(G.cone(.02,.16,4),twig,(f-1)*.04,-len-.05,0); c.rotation.x=PI; p.add(c); } p.rotation.z=rz; return p; };
  body.add(limb('armL',-.12,.6,.62,.35)); body.add(limb('armR',.12,.6,.62,-.35));
  g.add(limb('legL',-.08,.97,.92,.06)); g.add(limb('legR',.08,.97,.92,-.06));
  outline(g); const wrap=new THREE.Group(); wrap.add(g); return wrap; }
MOBGLB[SK]={wrap:makeStick(),map:{},scale:1};
// build 312: Matt's moss stickman (rigged, Walking 1.07 s + Running 0.67 s on one 24-joint skeleton; stickman-walk/-run.glb, 512 textures) replaces the code-built twig man once it lands (fetched with
// her model); his Punch_Forward_with_Both_Fists is their attack (Running stands in if it can't load). Until they land (or if they can't), the twig man above stands in.
let stickP=null, stickDone=false;   // stickDone: the fetch has settled (his model in, or given up on)
function loadSticks(){ if(stickP) return stickP;
  stickP=Promise.all(['stickman-walk.glb','stickman-run.glb','stickman-punch.glb'].map((f,i)=>fetchBytes(ASSET(f)).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).catch(e=>{ if(i<2) throw e; console.warn('stickman punch',e); return null; })))
    .then(([wg,rg,pg])=>{ try{ const root=wg.scene||wg.scenes[0]; fixMats(root); const fit=fitModel(root,MOBDIM[SK].fit); toonify(root,fit.scale);
        const walkC=(wg.animations||[])[0]||(rg.animations||[])[0], runC=(rg.animations||[])[0]||walkC;
        // the stand (and a Running stand-in for the punch) get their own copies: one clip on one rig is one action, and an attack is set to play once and hold -- shared, it froze their running legs after a stride
        MOBGLB[SK]={wrap:fit.wrap,map:{walk:walkC,run:runC,attack:(pg&&(pg.animations||[])[0])||runC.clone(),idle:walkC.clone()},scale:fit.scale,real:true}; }catch(e){ console.warn('stickman model',e); } })
    .catch(e=>console.warn('stickman model',e)).then(()=>{ stickDone=true; });
  return stickP; }
// ---------------------------------------------------------------- the topiary mobs: each kind's own statue, as a static model the mob system can carry (no clips: they hop in code)
function topiKind(file){ return TK+'-'+file.replace('topiary-','').replace('.glb',''); }
// build 318 (Matt: "the topiiaries came to life wich was cool. but,.... they bounce along the way ... we need to do something about the pedestle" -> "lets try your pick with the lurching"): each
// topiary is cut at the top of its pedestal (the grass disc on the stone drum; heights read off each model's profile). The figure is the mob, the stone stays in the flower bed -- the empty plinth
// shows where it came from, and a regrown one grows back up out of it. The mob stands its feet on the ground on a pivot at foot level, which its lurch sways and leans (no more hopping).
const TOPI_CUT={'topiary-witch.glb':.62,'topiary-fighter.glb':.78,'topiary-ranger.glb':.70};
const cutOf=t=>TOPI_CUT[t.kind]||.7;
const cutGeo=new Map();
// keep only the triangles above (or below) a height in the root's own space; each cut geometry is made once and shared
function cutModel(root,cut,above){ root.updateMatrixWorld(true); const inv=new THREE.Matrix4().copy(root.matrixWorld).invert(), m=new THREE.Matrix4(), A=new THREE.Vector3(), B=new THREE.Vector3(), C=new THREE.Vector3();
  root.traverse(o=>{ if(!o.isMesh||!o.geometry||!o.geometry.attributes.position) return; m.multiplyMatrices(inv,o.matrixWorld);
    const key=o.geometry.uuid+'|'+cut+'|'+above+'|'+m.elements.map(v=>v.toFixed(3)).join(','); let g=cutGeo.get(key);
    if(!g){ const src=o.geometry, pos=src.attributes.position, ix=src.index, n=ix?ix.count:pos.count, keep=[];
      for(let i=0;i<n;i+=3){ const a=ix?ix.getX(i):i, b=ix?ix.getX(i+1):i+1, c=ix?ix.getX(i+2):i+2; A.fromBufferAttribute(pos,a).applyMatrix4(m); B.fromBufferAttribute(pos,b).applyMatrix4(m); C.fromBufferAttribute(pos,c).applyMatrix4(m); if(((A.y+B.y+C.y)/3>=cut)===above) keep.push(a,b,c); }
      g=src.clone(); g.setIndex(keep); const bb=new THREE.Box3(), P=new THREE.Vector3(); for(const i of keep){ P.fromBufferAttribute(pos,i); bb.expandByPoint(P); } if(keep.length){ g.boundingBox=bb; g.boundingSphere=bb.getBoundingSphere(new THREE.Sphere()); }   // bounds of what is kept (the unused points stay in the buffer)
      cutGeo.set(key,g); }
    o.geometry=g; });
  return root; }
// build 324 (Matt: "iam gonna have the topiaries rigged by bob, they just kinda look like cardboard cutouts" -> Bob's hi3d-topiary-game-pack.zip): each topiary kind is Bob's rigged figure --
// pedestal already off, a 16-bone skeleton, Walk (1.1 s, in place, looping) and Attack (1.03 s, the blow at half way); his 8K textures cut to 1K (topi-<kind>-rig.glb, ~1 MB each). Sized to the
// statue's own figure (its height less the pedestal), with the statues' night-garden glow. Fetched with her model; until they land (or if they can't) the cut statue + lurch stands in.
const TOPI_RIG={'topiary-witch.glb':'topi-witch-rig.glb','topiary-fighter.glb':'topi-fighter-rig.glb','topiary-ranger.glb':'topi-ranger-rig.glb'}, TOPI_FULL=3.3;
let rigP=null, rigN=0;
function loadTopiRigs(){ if(rigP) return rigP;
  rigP=Promise.all(Object.keys(TOPI_RIG).map(src=>fetchBytes(ASSET(TOPI_RIG[src])).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{
      const k=topiKind(src), root=g.scene||g.scenes[0], hgt=TOPI_FULL-(TOPI_CUT[src]||.7); fixMats(root); const fit=fitModel(root,hgt); toonify(root,fit.scale);
      root.traverse(o=>{ if(o.isMesh&&!o.userData.isOL&&o.material&&o.material.map&&o.material.emissive){ o.material.emissiveMap=o.material.map; o.material.emissive.setRGB(.42,.42,.42); o.material.needsUpdate=true; } });
      const A=n=>(g.animations||[]).find(c=>c.name===n), walk=A('Walk'), atk=A('Attack'); if(!walk||!atk) return;
      const idle=THREE.AnimationUtils.subclip(walk,'idle',0,1,30);   // standing still: the walk's first pose held
      MOBDIM[k]={fit:hgt,h:MOBDIM[TK].h,r:MOBDIM[TK].r,nat:{walk:.7,run:.7}}; MOBS[k]=Object.assign({},MOBS[TK],{swingT:1.0,hitT:.5}); if(Meta.XP) Meta.XP[k]=Meta.XP[k]||3;
      MOBGLB[k]={wrap:fit.wrap,map:{walk,run:walk,attack:atk,idle},scale:fit.scale,rig:true}; rigN++; }).catch(e=>console.warn('topiary rig '+src,e))));
  return rigP; }
function ensureTopiKinds(){ const D=window.__courtdecor; if(!D||!D.topiList) return; for(const t of D.topiList()){ const k=topiKind(t.kind); if(MOBGLB[k]) continue;   // Bob's rig when it has landed (it replaces this stand-in if it lands later)
    const wrap=new THREE.Group(); const inner=t.mesh.clone(); inner.position.set(0,0,0); inner.rotation.set(0,0,0); inner.scale.setScalar(1); inner.visible=true; cutModel(inner,cutOf(t),true); inner.position.y=-cutOf(t);
    const pivot=new THREE.Group(); pivot.name='topiPivot'; pivot.add(inner); wrap.add(pivot);
    MOBDIM[k]=MOBDIM[TK]; MOBS[k]=MOBS[TK]; MOBGLB[k]={wrap,map:{},scale:1}; if(Meta.XP) Meta.XP[k]=Meta.XP[k]||3; } }
// the nearest cell a mob can walk from towards a Heartroot, within r cells of (cx,cz)
function hagDoor(){ let best=null, bd=-1; for(const k in LANES){ const L=LANES[k]; const inX=Math.round(Math.sin(L.face||0)*2), inZ=Math.round(Math.cos(L.face||0)*2); const c=laneNear(L.cx+inX,L.cz+inZ,3); if(!c) continue; const fd=flowFree.dist[idx(c.x,c.z)]; if(fd>bd){ bd=fd; best=c; } } return best; }   // two cells in from a gate; the gate farthest (by path) from a Heartroot
function hagSpot(){ let best=null, bs=-1e9; const R=9; for(let dx=-R;dx<=R;dx++) for(let dz=-R;dz<=R;dz++){ const dd=Math.hypot(dx,dz); if(dd<4||dd>R) continue; const x=21+dx, z=21+dz; if(x<0||z<0||x>=GW||z>=GH) continue;
    const i=idx(x,z); if(!walk(grid[i])) continue; const fd=flowFree.dist[i]; if(!(fd>0&&fd<1e5)) continue; const wx=cw(x), wz=cwz(z); const h=Math.min(Math.hypot(wx,wz),GOAL2>=0?Math.hypot(wx-C2X,wz-C2Z):1e9); const sc=h-dd*.3; if(sc>bs){ bs=sc; best={x,z}; } }
  return best; }
function laneNear(cx,cz,r,minD){ let best=null, bd=1e9; for(let dx=-r;dx<=r;dx++) for(let dz=-r;dz<=r;dz++){ const x=cx+dx, z=cz+dz; if(x<0||z<0||x>=GW||z>=GH) continue; const i=idx(x,z); if(!walk(grid[i])) continue; const fd=flowFree.dist[i]; if(!(fd>0&&fd<1e5)) continue; const d=Math.hypot(dx,dz); if(minD&&d<minD) continue; if(d<bd){ bd=d; best={x,z}; } } return best; }   // minD (cells): at least that far out
let awake=[], wokeOnce=false;
const asleep=[];   // statues frozen where a topiary stood when she fell
function wakeOne(t){ if(t.mesh.userData.awake) return null; ensureTopiKinds(); const k=topiKind(t.kind); const lk=Object.keys(LANES);
  const best=laneNear(t.c.cx,t.c.cz,10); if(!best) return null;
  if(!t.plinth){ const pl=cutModel(t.mesh.clone(),cutOf(t),false); pl.visible=true; pl.scale.setScalar(1); (t.mesh.parent||world).add(pl); t.plinth=pl; cutModel(t.mesh,cutOf(t),true); }   // build 318: the stone stays in the bed
  const e=spawnEnemy(k,lk[0]); const from={x:t.mesh.position.x,y:t.mesh.position.y+cutOf(t),z:t.mesh.position.z}, to={x:cw(best.x),z:cwz(best.z)};
  e.x=from.x; e.z=from.z; e.yaw=t.mesh.rotation.y; e.topi=t; e.leap={t:0,dur:.8,from,to}; e.mdl.g.position.set(e.x,from.y,e.z);
  t.mesh.visible=false; t.mesh.userData.awake=true; t.mesh.userData.stump=false; t.mesh.userData.regrown=false; awake.push(e); return e; }
// build 376 (Matt: a guest "didn't see topiaries moving"): on the host a woken topiary leaves its pedestal (wakeOne: the stone stays, the figure is hidden and a mob takes its place). On a guest the mob is a puppet (99-network.js) and the garden's own static figure just kept standing -- a guest now does the visual half: the sleeping topiary nearest to where a topiary puppet first shows is cut down to its stone and hidden
function guestWake(x,z){ const D=window.__courtdecor; if(!D||!D.topiList) return false; let best=null, bd=1e9; for(const t of D.topiList()){ if(t.mesh.userData.awake) continue; const d=Math.hypot(t.mesh.position.x-x,t.mesh.position.z-z); if(d<bd){ bd=d; best=t; } } if(!best||bd>14) return false; const t=best;
  if(!t.plinth){ const pl=cutModel(t.mesh.clone(),cutOf(t),false); pl.visible=true; pl.scale.setScalar(1); (t.mesh.parent||world).add(pl); t.plinth=pl; cutModel(t.mesh,cutOf(t),true); } t.mesh.visible=false; t.mesh.userData.awake=true; return true; }
function flash(x,y,z,col,r){ const g=glow(col,r||3,.9); g.position.set(x,y,z); scene.add(g); let a=.9; const f=()=>{ a-=.04; g.material.opacity=Math.max(0,a); if(a>0) requestAnimationFrame(f); else { scene.remove(g); g.material.dispose(); } }; requestAnimationFrame(f); }
function wakeAll(){ const D=window.__courtdecor; if(!D||!D.topiList) return 0; let n=0; for(const t of D.topiList()){ if(t.mesh.userData.awake||t.mesh.userData.stump) continue; const e=wakeOne(t); if(e){ n++; flash(t.mesh.position.x,t.mesh.position.y+2,t.mesh.position.z,0x7aff5a,4); } }
  if(n&&!wokeOnce){ wokeOnce=true; banner('🌿 THE GARDEN WAKES','the Archhag calls the topiaries off their pedestals'); camShake=Math.max(camShake,.6); } return n; }
// ---------------------------------------------------------------- her arrival cast: ten stickmen climb out of the ground round her
let sticks=[];
let raisedOnce=false;
// build 327 (Matt: "make sure that she can cast some [dire wolves] in when she comes in. alternating with stickmen"): every second raise is a pack of five wolves climbing out of the ground
// round her (at most 15 of hers alive at once); if the wolf model has not landed yet, that raise is stickmen instead
const WOLVES=5, WOLF_CAP=15; let hwolves=[];
function raiseWolves(h){ const lk=Object.keys(LANES); let n=0; const cx=wc(h.x), cz=wcz(h.z); const want=Math.max(0,Math.min(WOLVES,WOLF_CAP-hwolves.filter(x=>!x.dead).length));
  for(let i=0;i<want;i++){ const a=i/Math.max(1,want)*TAU+.4, r=2.2+(i%2)*.9; const cell=laneNear(wc(h.x+Math.cos(a)*r),wcz(h.z+Math.sin(a)*r),3)||laneNear(cx,cz,4); if(!cell) continue;
    const e=spawnEnemy('direwolf',lk[0]); e.x=cw(cell.x)+(Math.random()-.5)*.8; e.z=cwz(cell.z)+(Math.random()-.5)*.8; e.rise=0; e.mdl.g.position.set(e.x,-1.4,e.z); hwolves.push(e); n++; flash(e.x,.5,e.z,0x7aff5a,2); }
  if(n){ floatText(h.x,h.y+h.h+1.2,h.z,'🐺 ×'+n,'#b8ff6a'); if(typeof noise==='function') noise(.5,.05,260); } return n; }
// build 322 (Matt: "lets make sure she comes out with pleanty of base mobs as well, when she comes out wait about 10 seconds when she calls her first stickment the give a bolus of 30 mobs. no
// ranged mobs"): with her first raise, 30 of the plain horde (20 goblins, 10 orcs -- nothing that shoots) pour in through every door over about 3 s. Game-time queue, so it runs in any phase
const BOLUS=[['goblin',20],['orc',10]];
let bolusQ=[];
function queueBolus(){ const lk=Object.keys(LANES); if(!lk.length) return 0; const list=[]; for(const [k,n] of BOLUS) for(let j=0;j<n;j++) list.push(k); for(let i=list.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [list[i],list[j]]=[list[j],list[i]]; }
  list.forEach((k,i)=>bolusQ.push({at:S.t+.3+i*.1,kind:k,lane:lk[i%lk.length]})); return list.length; }
{ const prev=updateEnemies; updateEnemies=function(dt){ prev(dt); while(bolusQ.length&&S.t>=bolusQ[0].at){ const q=bolusQ.shift(); if(LANES[q.lane]) spawnEnemy(q.kind,q.lane); } }; }
function raiseStickmen(h){ const lk=Object.keys(LANES); let n=0; const cx=wc(h.x), cz=wcz(h.z); const want=Math.max(0,Math.min(STICKMEN,STICK_CAP-sticks.filter(x=>!x.dead).length));
  for(let i=0;i<want;i++){ const a=i/STICKMEN*TAU, r=1.6+(i%3)*.8; const px=h.x+Math.cos(a)*r, pz=h.z+Math.sin(a)*r; const cell=laneNear(wc(px),wcz(pz),3)||laneNear(cx,cz,4); if(!cell) continue;
    const e=spawnEnemy(SK,lk[0]); e.x=cw(cell.x)+(Math.random()-.5)*.8; e.z=cwz(cell.z)+(Math.random()-.5)*.8; e.rise=0; e.mdl.g.position.set(e.x,-1.8,e.z); sticks.push(e); n++;
    flash(e.x,.4,e.z,0x9aff5a,1.6); }
  if(!raisedOnce){ raisedOnce=true; banner('💀 THE STICKMEN RISE','the Archhag calls them out of the earth -- they are fast'); queueBolus(); } else if(n) floatText(h.x,h.y+h.h+1.2,h.z,'💀 ×'+n,'#b8ff6a'); return n; }
// ---------------------------------------------------------------- the curse: purple chains round the tower, its next shot held off
function chains(d){ const g=new THREE.Group(); const m=new THREE.MeshBasicMaterial({color:C(0xb050ff),transparent:true,opacity:.85,depthWrite:false});
  for(let k=0;k<3;k++){ const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.07,6,20),m); ring.rotation.x=PI/2; ring.position.y=.6+k*.85; ring.userData.noOL=true; g.add(ring); }
  const gl=glow(0xa040ff,3,.5); gl.position.y=1.4; g.add(gl); g.position.set(d.x,d.base||0,d.z); scene.add(g); return g; }
function hex(e){ let best=null, bd=HEX_R+.5; for(const d of defs){ if(d.curseT>0||NOWALK_DEF[d.kind]) continue; const dd=Math.hypot(d.x-e.x,d.z-e.z); if(dd<bd){ bd=dd; best=d; } }
  const hy=e.y+e.h*.8; if(best){ curse(best); flash(e.x,hy,e.z,0x9a40ff,2.6); SFX.implode&&SFX.implode(); return true; }
  const cand=[]; if(hero.dead<=0) cand.push({x:hero.x,y:hero.y,z:hero.z}); try{ for(const h of Meta.heroes()||[]) if(h&&!(h.isDead&&h.isDead())) cand.push({x:h.x,y:h.y,z:h.z}); }catch(err){}
  let tg=null, td=HEX_R; for(const h of cand){ const dd=Math.hypot(h.x-e.x,h.z-e.z); if(dd<td&&los(e.x,e.z,h.x,h.z)){ td=dd; tg=h; } }
  if(tg){ fireArrow(e,tg.x,(tg.y||0)+1,tg.z,{kind:'hero'}); flash(e.x,hy,e.z,0x9a40ff,2); return true; } return false; }
function curse(d){ d.curseT=CURSE_T; d.cd=Math.max(d.cd,CURSE_T); if(!d.curseFx) d.curseFx=chains(d); }
{ const prev=updateDefs; updateDefs=function(dt){ for(const d of defs){ if(d.curseT>0){ d.curseT-=dt; d.cd=Math.max(d.cd,d.curseT); if(d.curseFx){ d.curseFx.rotation.y+=dt*1.6; d.curseFx.children.forEach((c,i)=>{ if(c.material) c.material.opacity=.45+.4*Math.abs(Math.sin(S.t*3+i)); }); }
        if(d.curseT<=0&&d.curseFx){ scene.remove(d.curseFx); d.curseFx=null; } } } return prev.apply(this,arguments); }; }
{ const prev=removeDef; removeDef=function(d){ if(d&&d.curseFx){ scene.remove(d.curseFx); d.curseFx=null; } return prev.apply(this,arguments); }; }
// a forced cast: the special spell, cast wherever she stands (the AI waits while a swing is running)
function castSpecial(e,what){ e.special=what; e.swing=0; e.pending={kind:'special'}; e.atk=MOBS[K].cd; }
// build 335 (Matt, after a grown topiary flattened a tower: "lol no thats what i want ... that thing has to be your priority in game"): a topiary she has GROWN crushes any tower it strikes in one
// blow (an aura ring is still untouchable, 96i). Made certain rather than left to chance -- a grown one is the thing to kill first.
{ const prev=landHit; landHit=function(e,tg){ if(e&&e.topi&&(e.big||e.grow)&&tg&&tg.kind==='def'&&tg.obj&&!tg.ranged){ const d=tg.obj; if(!defs.includes(d)) return; const was=d.hp; hurtDef(d,1e6); if(!defs.includes(d)||d.hp<was){ floatText(d.x,(d.top||1)+1,d.z,'CRUSHED','#ff6a5a'); camShake=Math.max(camShake,.35); } return; } return prev.apply(this,arguments); }; }
{ const prev=landHit; landHit=function(e,tg){ if(e.kind!==K) return prev.apply(this,arguments);
    flash(e.x,e.y+e.h*.8,e.z,0x9a40ff,2.6);
    if(e.special){ const w=e.special; e.special=null; const n0=enemies.length; if(w==='raise'){ const n=e.raiseN=(e.raiseN||0)+1; if(n%2===0&&window.__direwolf&&window.__direwolf.loaded()) raiseWolves(e); else raiseStickmen(e); } else if(w==='wake'){ wakeAll(); e.shield=0; }
    if((w==='raise'||w==='wake')&&e.phase===2) for(let i=n0;i<enemies.length;i++){ const m=enemies[i]; if(m.dead||m.p2x) continue; m.p2x=1; m.hp=Math.round(m.hp*P2HP); m.max=Math.round(m.max*P2HP); }   /* build 416 (Matt: "during second phase double topiaries health, and keep spawning stick men and dogs with double health") */ else if(w==='grow') growMobs(e); return; }
    if(e.phase===2&&window.__courtdecor&&window.__courtdecor.topiList&&window.__courtdecor.topiList().some(t=>!t.mesh.userData.awake&&!t.mesh.userData.stump&&t.mesh.userData.growing===undefined&&t.mesh.userData.regrown)){ wakeAll(); return; }   // a regrown one: this cast wakes it
    let best=null, bd=HEX_R+.5; for(const d of defs){ if(d.curseT>0||NOWALK_DEF[d.kind]) continue; const dd=Math.hypot(d.x-e.x,d.z-e.z); if(dd<bd){ bd=dd; best=d; } }
    if(best){ curse(best); SFX.implode&&SFX.implode(); return; }
    if(tg&&tg.kind==='special') return;
    return prev.apply(this,arguments); }; }
// the two bars: a blow never carries her past the line between them, and she is untouchable while she casts the garden awake
{ const prev=hurt; hurt=function(e,dmg,kx,kz){ if(e&&e.kind===K&&!e.dead){ if(e.shield>0) return; if(e.phase===1&&e.hp-dmg<LINE(e)){ dmg=Math.max(0,e.hp-LINE(e)); } }
    const r=prev.apply(this,arguments); if(e&&e.kind===K) e.squash=0;   // no flinch
    if(e&&e.kind===K&&!e.dead&&e.phase===1&&e.hp<=LINE(e)+.01){ e.phase=2; e.hp=LINE(e); e.shield=4; e.raiseT=RAISE_EVERY; castSpecial(e,'wake'); banner('🌑 THE ARCHHAG RAGES','her second life -- the garden stirs'); camShake=Math.max(camShake,.7); }
    return r; }; }
// ---------------------------------------------------------------- each frame: stickmen rising and running, the leaps, the hops, no slow on her, the regrowth, her fall held, the sleep when she falls
// build 318 (Matt: "shes doing a knock back or some kind of intruputionevery time she gets hit. she needs to ignore any of that"): no shove (99e-bossgrit.js), and now nothing pins or flinches her either --
// no hit-squash (every blow squashed her whole body), no hold (Rootsplitter's roots), no crawl (the Hourglass), no chill, no slow
{ const prev=updateEnemies; updateEnemies=function(dt){ for(const e of enemies) if(!e.dead&&e.kind===K){ e.slowT=0; e.squash=0; e.holdT=0; e.crawlT=0; e.chillT=0; if(e.shield>0) e.shield-=dt;
      // build 317 (Matt: "oh dear, mabye that stikmen didnt load all the way"): if his moss stickmen are still on the way when she casts, she holds the spell until they land (at most 6 s more) rather than raise the twig stand-ins
      { const A=e.mdl.g.userData.hagAura; if(A){ A.rotation.y+=dt*.6; A.children[0].material.opacity=.46+.1*Math.sin(S.t*2.2); A.visible=!e.dead||e.dead<.6; } }
      if(e.hagRise>=1){ e.hexT=(e.hexT===undefined?2:e.hexT)-dt; if(e.hexT<=0&&!(e.swing>=0)&&!e.special){ e.hexT=hex(e)?HEX_EVERY:.5; } }   // build 327: her hex, cast on the move
      if(e.hagRise>=1){ e.growT=(e.growT===undefined?GROW_FIRST:e.growT)-dt; if(e.growT<=0&&!(e.swing>=0)&&!e.special&&!(e.shield>0)){ e.growT=GROW_EVERY; castSpecial(e,'grow'); } }   // build 318: GROW on her own clock
      if(e.raiseT>0){ e.raiseT-=dt; if(e.raiseT<=0){ if(!MOBGLB[SK].real&&!stickDone&&(e.raiseWait=(e.raiseWait||0)+dt)<6){ loadSticks(); e.raiseT=.001; } else if(e.special||e.swing>=0){ e.raiseT=.001; } else { castSpecial(e,'raise'); e.raiseT=(e.raiseN||0)===0?RAISE_WOLVES_FIRST:RAISE_EVERY;   /* build 416: in her second life too */ } } }   // another cast still running: the raise waits for it
      if(e.phase===1&&e.hp<=LINE(e)+.01){ e.phase=2; e.hp=LINE(e); e.shield=4; e.raiseT=RAISE_EVERY; castSpecial(e,'wake'); banner('🌑 THE ARCHHAG RAGES','her second life -- the garden stirs'); camShake=Math.max(camShake,.7); } }   // any damage that skipped hurt() (a poison tick) still turns the page
    prev(dt);
    for(const e of enemies){ if(e.kind!==K||e.dead||e.hagRise===undefined||e.hagRise>=1) continue; e.hagRise=Math.min(1,e.hagRise+dt/1.4); e.mdl.g.position.y=e.y-4*(1-e.hagRise)*(1-e.hagRise); }   // rising out of the ground, slowing as she stands clear
    // the twig man's limbs swing in code; his rigged model has no such pivots, so they are looked up once, then skipped
    for(const e of sticks){ if(e.dead) continue; const g=e.mdl.g;
      if(e.rise!==undefined&&e.rise<1){ e.rise=Math.min(1,e.rise+dt/.7); g.position.y=e.y-1.8*(1-e.rise); }
      const run=S.t*16+(e.ph||0), w=e.walking?1:.15;
      const L=n=>{ const c=e.limbs=e.limbs||{}; return n in c?c[n]:(c[n]=g.getObjectByName(n)||null); }; const lL=L('legL'), lR=L('legR'), aL=L('armL'), aR=L('armR');
      if(lL){ lL.rotation.x=Math.sin(run)*.9*w; lR.rotation.x=-Math.sin(run)*.9*w; aL.rotation.x=-Math.sin(run)*.8*w; aR.rotation.x=Math.sin(run)*.8*w; } }
    sticks=sticks.filter(e=>!e.dead||e.dead<.4);
    for(const e of hwolves){ if(e.dead||e.rise===undefined||e.rise>=1) continue; e.rise=Math.min(1,e.rise+dt/.8); e.mdl.g.position.y=e.y-1.4*(1-e.rise); }
    hwolves=hwolves.filter(e=>!e.dead||e.dead<1.3);
    for(const e of awake){ if(e.dead) continue; const g=e.mdl.g;
      if(e.leap){ const L=e.leap; L.t+=dt; const k=Math.min(1,L.t/L.dur); e.x=L.from.x+(L.to.x-L.from.x)*k; e.z=L.from.z+(L.to.z-L.from.z)*k; const fy=baseFloor(e.x,e.z); g.position.set(e.x,fy+Math.sin(k*PI)*2.2+(1-k)*(L.from.y-fy),e.z); if(k>=1) e.leap=null; continue; }
      lurch(e,g,dt); }
    awake=awake.filter(e=>!e.dead||e.dead<1.3);
    const hag=enemies.find(x=>x.kind===K&&!x.dead);
    for(const e of enemies){ if(!e.topi||!e.dead||e.topiGone) continue; e.topiGone=true; const u=e.topi.mesh.userData; u.awake=false; u.stump=true; u.regrowT=REGROW_T; }
    const D=window.__courtdecor; if(D&&D.topiList) for(const t of D.topiList()){ const u=t.mesh.userData;
      if(u.stump&&hag){ u.regrowT-=dt; if(u.regrowT<=0){ u.stump=false; t.mesh.visible=true; t.mesh.scale.setScalar(.05); u.growing=0; } }
      if(u.growing!==undefined){ u.growing+=dt; const s=Math.min(1,u.growing/2.5); t.mesh.scale.setScalar(Math.max(.05,s)); if(s>=1){ delete u.growing; u.regrown=true; } } }   // regrown: her next cast wakes it
    for(const e of enemies){ if(e.kind!==K||!e.dead) continue; if(e.deathHold===undefined){ e.deathHold=DEATH_HOLD; sleepAll(e); } if(e.deathHold>0){ e.deathHold-=dt; e.dead=Math.min(e.dead,.5); } } }; }
function sleepAll(hagE){ const list=enemies.filter(e=>e.topi&&!e.dead);   // collected first: removing from enemies while walking it would skip every other one
  for(const e of list){ const t=e.topi; const st=t.mesh.clone(); st.visible=true; st.scale.setScalar(1); st.position.set(e.x,baseFloor(e.x,e.z)-(t.plinth?cutOf(t):0),e.z); st.rotation.y=e.yaw||0; world.add(st); asleep.push(st);
    scene.remove(e.mdl.g); const i=enemies.indexOf(e); if(i>=0) enemies.splice(i,1); t.mesh.userData.awake=false; }
  awake=awake.filter(e=>enemies.includes(e)); if(list.length) floatText(hagE.x,hagE.y+hagE.h+1,hagE.z,'the garden sleeps','#9aff7a'); return list.length; }
// ---------------------------------------------------------------- her arrival in the court's last wave, once ~75 of its mobs are out
let waveTotal=0, doneWave=-1;
{ const prev=startWave; startWave=function(){ prev(); if(court()&&S.wave===MAP.waves) waveTotal=spawnQ.length; }; }
function spawnHag(){ const lk=Object.keys(LANES); if(!lk.length) return null; doneWave=S.wave; ensureTopiKinds();
  banner('🌑 THE ARCHHAG','the brier matron walks into the garden'); camShake=1.0;
  // build 310 (Matt: "all goes quite when she comes on and just this solitary drumline"): the music falls silent as she rises, then only his drumline (music-archhag.mp3), until she falls
  setMusic('none'); setTimeout(()=>{ if(enemies.some(x=>x.kind===K&&!x.dead)) setMusic('archhag'); },1800);
  const e=spawnEnemy(K,lk[0]); e.max=Math.round(e.max*(1+P2K)/2); e.hp=e.max; e.phase=1; e.shield=0; e.raiseT=RAISE_FIRST;   // her first raise, 10 s after she rises (game time: counted in updateEnemies); then every 10 s while her first bar lasts
  // build 308 (Matt: "the archheg doesnt come out of a side door. she just appears on the map"): she rises out of the ground in the middle of the garden, by the giant tree, in a burst of purple light
  // build 317 (Matt, spawning her: "shes stuck in the tree though"): the nearest lane cell to the middle was inside the giant tree's trunk (only its centre 2x2 cells are solid; the bark reaches
  // ~5.7 units out at body height, the roots ~6.6 at the ground) and, hanging back to cast, she stayed there -- she rises on the nearest lane cell at least 4 cells (8 units) from the tree's centre
  // build 319 (Matt: "spawn her in further away cuz the tree is right next to a ... heartroot"): the tree stands halfway between the two Heartroots (~25 units from each), so a spot just beside it
  // was on the way to one of them -- she rises on the reachable lane cell near the tree (4-9 cells out) that is farthest from BOTH Heartroots, out to the side of the line between them
  // build 320 (Matt: "lets move the arch hag back near one of the doors and let her walk again, that will be scary"): she rises just inside the door with the longest walk to a Heartroot, and walks it
  hagAura(e);
  const at=hagDoor()||hagSpot()||laneNear(21,21,10,4)||laneNear(21,21,8); if(at){ e.x=cw(at.x); e.z=cwz(at.z); } e.hagRise=0; e.mdl.g.position.set(e.x,-4,e.z); flash(e.x,1.5,e.z,0x9a40ff,7); flash(e.x,.4,e.z,0x6aff5a,4);
  return e; }
{ const prev=updateWave; updateWave=function(dt){ if(court()&&S.phase==='wave'&&S.wave===MAP.waves&&doneWave!==S.wave&&waveTotal>0&&MOBGLB[K]&&waveTotal-spawnQ.length>=Math.min(75,Math.floor(waveTotal*.66))) spawnHag(); prev(dt); }; }
// ---------------------------------------------------------------- a stickman's death (build 312, Matt: "when the stikman dies he just poofs into a cloud of green glow and fades away"):
// a puff of green glow blooms from his chest and drifts up, his body fading into it in a third of a second; the cloud thins out over about a second
let poofs=[], poofSnd=0;
const POOF_COLS=[0x3fc24e,0x5ad86a,0x2a9a44,0x7ae06a];   // deep greens: the cloud's puffs blend over the scene (not added up), so a crowd of them stays green instead of burning white
function poofStick(e){ const g=e.mdl.g, y0=(e.y||0)+.95; const grp=new THREE.Group(); grp.position.set(e.x,y0,e.z); scene.add(grp); const bits=[];
  for(let i=0;i<14;i++){ const a=Math.random()*TAU, up=Math.random(); const sp=glow(POOF_COLS[i%4],.55+Math.random()*.45,.9); sp.material.blending=THREE.NormalBlending; sp.position.set(Math.cos(a)*.15,(up-.5)*.9,Math.sin(a)*.15); grp.add(sp);
    bits.push({sp,vx:Math.cos(a)*(.9+Math.random()*1.2),vy:.5+up*1.3,vz:Math.sin(a)*(.9+Math.random()*1.2),s0:sp.scale.x,op:.55+Math.random()*.25}); }
  const core=glow(0x7aff4a,1.2,.75); grp.add(core);
  const mats=[]; g.traverse(o=>{ if(o.isMesh&&o.material&&!o.userData.noOL){ o.material=o.material.clone(); o.material.transparent=true; mats.push([o.material,o.material.opacity]); } });
  poofs.push({grp,bits,core,g,mats,t:0});
  if(S.t-poofSnd>.12&&typeof noise==='function'){ poofSnd=S.t; noise(.22,.05,1400); } }
{ const prev=updateEnemies; updateEnemies=function(dt){ prev(dt);
    for(const e of enemies) if(e.kind===SK&&e.dead&&!e.poofed){ e.poofed=true; poofStick(e); }
    for(const p of poofs){ p.t+=dt; const k=Math.min(1,p.t/1.1), fade=Math.max(0,1-p.t/.32);
      for(const [m,o] of p.mats) m.opacity=o*fade; if(fade<=0) p.g.visible=false;
      for(const b of p.bits){ const d=Math.max(0,1-p.t*1.6); b.sp.position.x+=b.vx*dt*d; b.sp.position.y+=b.vy*dt; b.sp.position.z+=b.vz*dt*d; const s=b.s0*(1+k*1.8); b.sp.scale.set(s,s,1); b.sp.material.opacity=b.op*(1-k)*(1-k); }
      const c=Math.max(0,1-p.t/.35); p.core.material.opacity=.75*c; p.core.scale.setScalar(1.2*(1+p.t*2)); }
    poofs=poofs.filter(p=>{ if(p.t<1.1) return true; scene.remove(p.grp); for(const b of p.bits) b.sp.material.dispose(); p.core.material.dispose(); for(const [m] of p.mats) m.dispose(); return false; }); }; }
// ---------------------------------------------------------------- sparks: small glowing bits that fly, fall and fade (the grow spell's green-and-gold poof, the leaves a lurching topiary sheds)
let sparks=[];
function spark(x,y,z,col,size,vx,vy,vz,life,grav,blend){ if(sparks.length>500) return; const sp=glow(col,size,.9); if(blend) sp.material.blending=THREE.NormalBlending; sp.position.set(x,y,z); scene.add(sp); sparks.push({sp,vx,vy,vz,life,grav:grav||0,t:0,op:.9}); }
function tickSparks(dt){ for(const p of sparks){ p.t+=dt; p.vy-=p.grav*dt; const dr=Math.max(0,1-dt*1.8); p.vx*=dr; p.vz*=dr; p.sp.position.x+=p.vx*dt; p.sp.position.y+=p.vy*dt; p.sp.position.z+=p.vz*dt; const k=p.t/p.life; p.sp.material.opacity=p.op*(1-k)*(k<.12?k/.12:1); }
  sparks=sparks.filter(p=>{ if(p.t<p.life) return true; scene.remove(p.sp); p.sp.material.dispose(); return false; }); }
// ---------------------------------------------------------------- the lurch (build 318): a statue that should not move -- a heavy side-to-side sway on its foot-level pivot, leaning into the walk, a
// small lift between steps (no bounce), and a few leaves shaken off at each step with a soft rustle
const LEAF=[0x3f9a3a,0x5ab84a,0x2e7a30];
let rustleT=-9;
function lurch(e,g,dt){ if(e.mdl.actions&&e.mdl.actions.walk){ if(e.walking){ e.leafT=(e.leafT||0)-dt; if(e.leafT<=0){ e.leafT=.55; for(let i=0;i<2;i++) spark(e.x+R(-.45,.45),e.y+.3+Math.random()*.9,e.z+R(-.45,.45),LEAF[i],.24,R(-.35,.35),R(.2,.7),R(-.35,.35),1.2,1.4,true); } } return; }   // build 324: Bob's rig walks for itself
  const pv=e.pivot||(e.pivot=g.getObjectByName('topiPivot')); const mv=!!e.walking; e.lph=(e.lph===undefined?(e.ph||0):e.lph)+dt*(mv?4.4:1.1); const sw=Math.sin(e.lph);
  if(pv){ pv.rotation.z=sw*(mv?.17:.035); pv.rotation.x=mv?.13:0; }
  g.position.y=e.y+(mv?(1-Math.abs(sw))*.06:0); g.scale.setScalar(e.sc);
  const step=Math.floor(e.lph/PI+.5); if(mv&&step!==e.lstep){ e.lstep=step; for(let i=0;i<3;i++) spark(e.x+R(-.45,.45),e.y+.3+Math.random()*.9,e.z+R(-.45,.45),LEAF[i],.24,R(-.35,.35),R(.2,.7),R(-.35,.35),1.2,1.4,true);
    if(S.t-rustleT>.3&&typeof noise==='function'){ rustleT=S.t; noise(.12,.018,2600); } } }
// ---------------------------------------------------------------- GROW (build 318, Matt: "shell do a spell animation sequice that will poof green and gold particles and mobs will temorarily double in
// size"): every ~15 s (the first ~9 s after she stands up) she casts -- her whole cast clip -- and a green-and-gold poof bursts off her; every mob within her reach (16) poofs too and swells to twice its
// size over half a second, stays big for about 7 s, then shrinks back. Size only (its hit box grows with it); a mob still big when she casts again just stays big longer.
const WOLF_GROW_HP=1.3, GROW_R=16, GROW_DUR=8, GROW_EVERY=15, GROW_FIRST=9, GROW_COLS=[0x5aff4a,0xffd23a,0x8aff6a,0xffe98a];
function poofAt(x,y,z,n,sz){ for(let i=0;i<n;i++){ const a=Math.random()*TAU, sp=1.2+Math.random()*2.4; spark(x,y,z,GROW_COLS[i%4],sz*(.6+Math.random()*.6),Math.cos(a)*sp,.6+Math.random()*2.4,Math.sin(a)*sp,.9+Math.random()*.6,1.6,i%2===0); } }   // greens blend over the scene, golds glow
// build 321 (Matt: "when she makes these guys big its awesome especially on the ogres, lets not have them shrink back down leave big"): a grown mob stays twice its size for the rest of its life; one already big is left as it is (never past 2x)
function growMobs(h){ let n=0; for(const e of enemies){ if(e.dead||e===h||e.kind===K||e.grow||e.big) continue; if(Math.hypot(e.x-h.x,e.z-h.z)>GROW_R) continue;
    e.gBase={sc:e.sc,r:e.r,h:e.h}; e.grow={t:0}; n++; poofAt(e.x,e.y+e.h*.6,e.z,10,.55);
    if(e.kind==='direwolf'){ e.max=Math.round(e.max*WOLF_GROW_HP); e.hp=Math.round(e.hp*WOLF_GROW_HP); } }   // build 328 (Matt: "when she makes wolves bigger they have 30% more health"): a grown wolf is tougher too (only wolves)
  poofAt(h.x,h.y+h.h*.7,h.z,40,1.1); flash(h.x,h.y+h.h*.6,h.z,0xffd23a,5); floatText(h.x,h.y+h.h+1.2,h.z,'⬆ GROW ⬆','#ffd23a'); if(typeof noise==='function') noise(.35,.05,700); return n; }
function tickGrow(dt){ for(const e of enemies){ const G=e.grow, B=e.gBase; if(!G||!B) continue; G.t+=dt; if(e.dead) continue;
    const f=Math.min(2,1+G.t/.5); e.sc=B.sc*f; e.r=B.r*f; e.h=B.h*f;
    if(G.t>=.5){ e.big=true; delete e.grow; } } }   // fully grown: big for good
{ const prev=updateEnemies; updateEnemies=function(dt){ tickGrow(dt); prev(dt); tickSparks(dt); }; }
// ---------------------------------------------------------------- her two-phase health bar
{ const css=document.createElement('style'); css.textContent='#hagbar{position:fixed;left:50%;top:66px;transform:translateX(-50%);width:min(460px,74vw);z-index:20;text-align:center;pointer-events:none;display:none;font:bold 13px Georgia,serif;color:#e6d2ff;text-shadow:0 2px 3px #000;letter-spacing:2px}#hagbar .bars{display:flex;gap:6px;margin-top:3px}#hagbar .track{flex:1;height:12px;background:#140c1a;border:2px solid #3e2450;border-radius:6px;overflow:hidden;box-shadow:0 3px 8px #000a}#hagbar .fill{display:block;height:100%;width:100%;transition:width .2s}#hagbar .p1 .fill{background:linear-gradient(#b070ff,#5a1c9a)}#hagbar .p2 .fill{background:linear-gradient(#8aff6a,#2a8a1a)}#hagbar .track.done{opacity:.35}'; document.head.appendChild(css); }
const bar=document.createElement('div'); bar.id='hagbar'; bar.innerHTML='🌑 THE ARCHHAG<div class="bars"><div class="track p2"><i class="fill"></i></div><div class="track p1"><i class="fill"></i></div></div>'; document.body.appendChild(bar);
const foes=()=>(window.__net&&window.__net.role&&window.__net.role()==='guest'&&window.__mobsync)?window.__mobsync.foes():enemies;   // build 375: a guest's mobs are puppets (99-network.js), not `enemies` -- the bar reads those there
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); const e=foes().find(x=>x.kind===K&&!x.dead); bar.style.display=e?'block':'none'; if(!e){ if(musicMode==='archhag') setMusic(S.phase==='wave'?'wave':'build'); return; } const half=LINE(e);   /* build 416: the line between her bars */
    bar.querySelector('.p1 .fill').style.width=Math.max(0,100*(e.hp-half)/Math.max(1,e.max-half))+'%'; bar.querySelector('.p2 .fill').style.width=Math.max(0,Math.min(100,100*e.hp/half))+'%'; bar.querySelector('.p1').classList.toggle('done',e.hp<=half+.01); }; }
window.__archhag={ensure:load,ensureTopi:ensureTopiKinds,guestWake,loaded:()=>!!MOBGLB[K],poofs:()=>poofs.map(p=>({t:+p.t.toFixed(2),bits:p.bits.length,body:p.g.visible?+(p.mats.length?p.mats[0][0].opacity:1).toFixed(2):0})),bolusLeft:()=>bolusQ.length,rigsReady:()=>rigN===3,strike:(e,d)=>landHit(e,{kind:'def',obj:d,x:d.x,z:d.z}),look:()=>{ const h=enemies.find(x=>x.kind===K&&!x.dead); if(!h) return null; let rim=null, t=null, robe=null; h.mdl.g.traverse(o=>{ if(!o.isMesh||!o.material) return; if(o.userData.isOL&&o.material.uniforms&&o.material.uniforms.col&&rim===null){ rim=o.material.uniforms.col.value.getHex(); t=o.material.uniforms.t.value; } else if(o.material.emissive&&robe===null&&!o.userData.noOL) robe=o.material.emissive.getHex(); }); return { rim, t, robe, aura:!!h.mdl.g.userData.hagAura }; },hwolves:()=>hwolves.filter(x=>!x.dead).length,hex:()=>{ const h=enemies.find(x=>x.kind===K&&!x.dead); return h?hex(h):false; },loadTopiRigs,loadSticks,sticksReady:()=>!!MOBGLB[SK].real,castGrow:()=>{ const h=enemies.find(x=>x.kind===K&&!x.dead); if(h){ h.swing=-1; h.special=null; castSpecial(h,'grow'); } return !!h; },grown:()=>enemies.filter(e=>(e.grow||e.big)&&e.gBase&&!e.dead).map(e=>({kind:e.kind,f:+(e.sc/e.gBase.sc).toFixed(2)})),sparks:()=>sparks.length,plinths:()=>{ const D=window.__courtdecor; return D&&D.topiList?D.topiList().filter(t=>t.plinth&&t.plinth.visible&&t.plinth.parent).length:0; },topiCut:TOPI_CUT,stickModel:()=>({real:!!MOBGLB[SK].real,clips:Object.keys(MOBGLB[SK].map),attack:MOBGLB[SK].map.attack?MOBGLB[SK].map.attack.name:''}),ensure:load,spawn:()=>{ ensureTopiKinds(); return spawnHag(); },wake:wakeAll,awake:()=>awake.filter(e=>!e.dead).length,asleep:()=>asleep.length,curse,
  sticks:()=>sticks.filter(e=>!e.dead).length,cursed:()=>defs.filter(d=>d.curseT>0).length,kind:K};
})();
