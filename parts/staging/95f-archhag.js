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
MOBS[K]={hp:1400,spd:1.25,dmg:18,cd:4.6,mana:40,ranged:16,heroShot:true,swingT:2.33,hitT:1.55};   // both bars together; she walks slowly (a goblin is 3.4); the whole cast clip over its own 2.33 s, the spell leaving her hands at two thirds
MOBDIM[TK]={fit:3.3,h:3.1,r:.7,nat:{walk:1.0,run:1.0}};
MOBS[TK]={hp:70,spd:2.1,dmg:9,cd:1.7,mana:6};   // a hedge gnome: sturdier than a goblin, no faster
MOBDIM[SK]={fit:1.9,h:1.8,r:.34,nat:{walk:1.0,run:2.2}};   // run: his Running clip covers about 2.2 body-heights a second
MOBS[SK]={hp:22,spd:6.6,dmg:7,cd:1.3,mana:3,swingT:1.2,hitT:.34};   // twig men: frail, light-hitting, and nearly twice a goblin's speed
// build 312: Matt's 3.5 s Punch_Forward_with_Both_Fists plays over 1.2 s, the blow as the first fist goes out (1.0 s of 3.5); a punch every 1.3 s (was .9) so each is 7 (was 5), about the same damage over time
if(Meta.XP){ Meta.XP[K]=Meta.XP[K]||90; Meta.XP[SK]=Meta.XP[SK]||1; }
const CURSE_T=5, REGROW_T=18, DEATH_HOLD=5.6, STICKMEN=10;
// ---------------------------------------------------------------- her model: four clip files on one rig, fetched once
function fixMats(root){ root.traverse(o=>{ if(o.isMesh&&o.material){ o.material.metalness=0; o.material.roughness=.85; if(o.material.emissive) o.material.emissive.setRGB(0,0,0); } }); }
let loadP=null;
if(typeof TRACKS!=='undefined') TRACKS.archhag='assets/music-archhag.mp3';   // build 310: his drumline, fetched with her model (never at start)
function load(){ if(typeof musFetch==='function'&&typeof TRACKS!=='undefined'&&TRACKS.archhag) musFetch('archhag'); loadSticks(); if(MOBGLB[K]) return Promise.resolve(); if(loadP) return loadP;
  const names=['walk','attack','idle','death'];
  loadP=Promise.all(names.map(k=>fetchBytes(ASSET(FILES[k])).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej)))))
    .then(gs=>{ try{ const root=gs[0].scene||gs[0].scenes[0]; fixMats(root); const fit=fitModel(root,MOBDIM[K].fit); toonify(root,fit.scale);
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
let stickP=null;
function loadSticks(){ if(stickP) return stickP;
  stickP=Promise.all(['stickman-walk.glb','stickman-run.glb','stickman-punch.glb'].map((f,i)=>fetchBytes(ASSET(f)).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).catch(e=>{ if(i<2) throw e; console.warn('stickman punch',e); return null; })))
    .then(([wg,rg,pg])=>{ try{ const root=wg.scene||wg.scenes[0]; fixMats(root); const fit=fitModel(root,MOBDIM[SK].fit); toonify(root,fit.scale);
        const walkC=(wg.animations||[])[0]||(rg.animations||[])[0], runC=(rg.animations||[])[0]||walkC;
        // the stand (and a Running stand-in for the punch) get their own copies: one clip on one rig is one action, and an attack is set to play once and hold -- shared, it froze their running legs after a stride
        MOBGLB[SK]={wrap:fit.wrap,map:{walk:walkC,run:runC,attack:(pg&&(pg.animations||[])[0])||runC.clone(),idle:walkC.clone()},scale:fit.scale,real:true}; }catch(e){ console.warn('stickman model',e); } })
    .catch(e=>console.warn('stickman model',e));
  return stickP; }
// ---------------------------------------------------------------- the topiary mobs: each kind's own statue, as a static model the mob system can carry (no clips: they hop in code)
function topiKind(file){ return TK+'-'+file.replace('topiary-','').replace('.glb',''); }
function ensureTopiKinds(){ const D=window.__courtdecor; if(!D||!D.topiList) return; for(const t of D.topiList()){ const k=topiKind(t.kind); if(MOBGLB[k]) continue;
    const wrap=new THREE.Group(); const inner=t.mesh.clone(); inner.position.set(0,0,0); inner.rotation.set(0,0,0); inner.scale.setScalar(1); inner.visible=true; wrap.add(inner);
    MOBDIM[k]=MOBDIM[TK]; MOBS[k]=MOBS[TK]; MOBGLB[k]={wrap,map:{},scale:1}; if(Meta.XP) Meta.XP[k]=Meta.XP[k]||3; } }
// the nearest cell a mob can walk from towards a Heartroot, within r cells of (cx,cz)
function laneNear(cx,cz,r){ let best=null, bd=1e9; for(let dx=-r;dx<=r;dx++) for(let dz=-r;dz<=r;dz++){ const x=cx+dx, z=cz+dz; if(x<0||z<0||x>=GW||z>=GH) continue; const i=idx(x,z); if(!walk(grid[i])) continue; const fd=flowFree.dist[i]; if(!(fd>0&&fd<1e5)) continue; const d=Math.hypot(dx,dz); if(d<bd){ bd=d; best={x,z}; } } return best; }
let awake=[], wokeOnce=false;
const asleep=[];   // statues frozen where a topiary stood when she fell
function wakeOne(t){ if(t.mesh.userData.awake) return null; ensureTopiKinds(); const k=topiKind(t.kind); const lk=Object.keys(LANES);
  const best=laneNear(t.c.cx,t.c.cz,10); if(!best) return null;
  const e=spawnEnemy(k,lk[0]); const from={x:t.mesh.position.x,y:t.mesh.position.y,z:t.mesh.position.z}, to={x:cw(best.x),z:cwz(best.z)};
  e.x=from.x; e.z=from.z; e.yaw=t.mesh.rotation.y; e.topi=t; e.leap={t:0,dur:.8,from,to}; e.mdl.g.position.set(e.x,from.y,e.z);
  t.mesh.visible=false; t.mesh.userData.awake=true; t.mesh.userData.stump=false; t.mesh.userData.regrown=false; awake.push(e); return e; }
function flash(x,y,z,col,r){ const g=glow(col,r||3,.9); g.position.set(x,y,z); scene.add(g); let a=.9; const f=()=>{ a-=.04; g.material.opacity=Math.max(0,a); if(a>0) requestAnimationFrame(f); else { scene.remove(g); g.material.dispose(); } }; requestAnimationFrame(f); }
function wakeAll(){ const D=window.__courtdecor; if(!D||!D.topiList) return 0; let n=0; for(const t of D.topiList()){ if(t.mesh.userData.awake||t.mesh.userData.stump) continue; const e=wakeOne(t); if(e){ n++; flash(t.mesh.position.x,t.mesh.position.y+2,t.mesh.position.z,0x7aff5a,4); } }
  if(n&&!wokeOnce){ wokeOnce=true; banner('🌿 THE GARDEN WAKES','the Archhag calls the topiaries off their pedestals'); camShake=Math.max(camShake,.6); } return n; }
// ---------------------------------------------------------------- her arrival cast: ten stickmen climb out of the ground round her
let sticks=[];
function raiseStickmen(h){ const lk=Object.keys(LANES); let n=0; const cx=wc(h.x), cz=wcz(h.z);
  for(let i=0;i<STICKMEN;i++){ const a=i/STICKMEN*TAU, r=1.6+(i%3)*.8; const px=h.x+Math.cos(a)*r, pz=h.z+Math.sin(a)*r; const cell=laneNear(wc(px),wcz(pz),3)||laneNear(cx,cz,4); if(!cell) continue;
    const e=spawnEnemy(SK,lk[0]); e.x=cw(cell.x)+(Math.random()-.5)*.8; e.z=cwz(cell.z)+(Math.random()-.5)*.8; e.rise=0; e.mdl.g.position.set(e.x,-1.8,e.z); sticks.push(e); n++;
    flash(e.x,.4,e.z,0x9aff5a,1.6); }
  banner('💀 THE STICKMEN RISE','the Archhag calls them out of the earth -- they are fast'); return n; }
// ---------------------------------------------------------------- the curse: purple chains round the tower, its next shot held off
function chains(d){ const g=new THREE.Group(); const m=new THREE.MeshBasicMaterial({color:C(0xb050ff),transparent:true,opacity:.85,depthWrite:false});
  for(let k=0;k<3;k++){ const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.07,6,20),m); ring.rotation.x=PI/2; ring.position.y=.6+k*.85; ring.userData.noOL=true; g.add(ring); }
  const gl=glow(0xa040ff,3,.5); gl.position.y=1.4; g.add(gl); g.position.set(d.x,d.base||0,d.z); scene.add(g); return g; }
function curse(d){ d.curseT=CURSE_T; d.cd=Math.max(d.cd,CURSE_T); if(!d.curseFx) d.curseFx=chains(d); }
{ const prev=updateDefs; updateDefs=function(dt){ for(const d of defs){ if(d.curseT>0){ d.curseT-=dt; d.cd=Math.max(d.cd,d.curseT); if(d.curseFx){ d.curseFx.rotation.y+=dt*1.6; d.curseFx.children.forEach((c,i)=>{ if(c.material) c.material.opacity=.45+.4*Math.abs(Math.sin(S.t*3+i)); }); }
        if(d.curseT<=0&&d.curseFx){ scene.remove(d.curseFx); d.curseFx=null; } } } return prev.apply(this,arguments); }; }
{ const prev=removeDef; removeDef=function(d){ if(d&&d.curseFx){ scene.remove(d.curseFx); d.curseFx=null; } return prev.apply(this,arguments); }; }
// a forced cast: the special spell, cast wherever she stands (the AI waits while a swing is running)
function castSpecial(e,what){ e.special=what; e.swing=0; e.pending={kind:'special'}; e.atk=MOBS[K].cd; }
{ const prev=landHit; landHit=function(e,tg){ if(e.kind!==K) return prev.apply(this,arguments);
    flash(e.x,e.y+e.h*.8,e.z,0x9a40ff,2.6);
    if(e.special){ const w=e.special; e.special=null; if(w==='raise') raiseStickmen(e); else if(w==='wake'){ wakeAll(); e.shield=0; } return; }
    if(e.phase===2&&window.__courtdecor&&window.__courtdecor.topiList&&window.__courtdecor.topiList().some(t=>!t.mesh.userData.awake&&!t.mesh.userData.stump&&t.mesh.userData.growing===undefined&&t.mesh.userData.regrown)){ wakeAll(); return; }   // a regrown one: this cast wakes it
    let best=null, bd=MOBS[K].ranged+.5; for(const d of defs){ if(d.curseT>0) continue; const dd=Math.hypot(d.x-e.x,d.z-e.z); if(dd<bd){ bd=dd; best=d; } }
    if(best){ curse(best); SFX.implode&&SFX.implode(); return; }
    if(tg&&tg.kind==='special') return;
    return prev.apply(this,arguments); }; }
// the two bars: a blow never carries her past the line between them, and she is untouchable while she casts the garden awake
{ const prev=hurt; hurt=function(e,dmg,kx,kz){ if(e&&e.kind===K&&!e.dead){ if(e.shield>0) return; if(e.phase===1&&e.hp-dmg<e.max/2){ dmg=Math.max(0,e.hp-e.max/2); } }
    const r=prev.apply(this,arguments);
    if(e&&e.kind===K&&!e.dead&&e.phase===1&&e.hp<=e.max/2+.01){ e.phase=2; e.hp=e.max/2; e.shield=4; castSpecial(e,'wake'); banner('🌑 THE ARCHHAG RAGES','her second life -- the garden stirs'); camShake=Math.max(camShake,.7); }
    return r; }; }
// ---------------------------------------------------------------- each frame: stickmen rising and running, the leaps, the hops, no slow on her, the regrowth, her fall held, the sleep when she falls
{ const prev=updateEnemies; updateEnemies=function(dt){ for(const e of enemies) if(!e.dead&&e.kind===K){ e.slowT=0; if(e.shield>0) e.shield-=dt;
      if(e.raiseT>0){ e.raiseT-=dt; if(e.raiseT<=0) castSpecial(e,'raise'); }
      if(e.phase===1&&e.hp<=e.max/2+.01){ e.phase=2; e.hp=e.max/2; e.shield=4; castSpecial(e,'wake'); banner('🌑 THE ARCHHAG RAGES','her second life -- the garden stirs'); camShake=Math.max(camShake,.7); } }   // any damage that skipped hurt() (a poison tick) still turns the page
    prev(dt);
    for(const e of enemies){ if(e.kind!==K||e.dead||e.hagRise===undefined||e.hagRise>=1) continue; e.hagRise=Math.min(1,e.hagRise+dt/1.4); e.mdl.g.position.y=e.y-4*(1-e.hagRise)*(1-e.hagRise); }   // rising out of the ground, slowing as she stands clear
    // the twig man's limbs swing in code; his rigged model has no such pivots, so they are looked up once, then skipped
    for(const e of sticks){ if(e.dead) continue; const g=e.mdl.g;
      if(e.rise!==undefined&&e.rise<1){ e.rise=Math.min(1,e.rise+dt/.7); g.position.y=e.y-1.8*(1-e.rise); }
      const run=S.t*16+(e.ph||0), w=e.walking?1:.15;
      const L=n=>{ const c=e.limbs=e.limbs||{}; return n in c?c[n]:(c[n]=g.getObjectByName(n)||null); }; const lL=L('legL'), lR=L('legR'), aL=L('armL'), aR=L('armR');
      if(lL){ lL.rotation.x=Math.sin(run)*.9*w; lR.rotation.x=-Math.sin(run)*.9*w; aL.rotation.x=-Math.sin(run)*.8*w; aR.rotation.x=Math.sin(run)*.8*w; } }
    sticks=sticks.filter(e=>!e.dead||e.dead<.4);
    for(const e of awake){ if(e.dead) continue; const g=e.mdl.g;
      if(e.leap){ const L=e.leap; L.t+=dt; const k=Math.min(1,L.t/L.dur); e.x=L.from.x+(L.to.x-L.from.x)*k; e.z=L.from.z+(L.to.z-L.from.z)*k; const fy=baseFloor(e.x,e.z); g.position.set(e.x,fy+Math.sin(k*PI)*2.2+(1-k)*(L.from.y-fy),e.z); if(k>=1) e.leap=null; continue; }
      const hop=Math.abs(Math.sin(S.t*6.5+(e.ph||0))); g.position.y=e.y+hop*.45; const sq=1+.08*(1-hop); g.scale.set(e.sc*sq,e.sc/sq,e.sc*sq); }
    awake=awake.filter(e=>!e.dead||e.dead<1.3);
    const hag=enemies.find(x=>x.kind===K&&!x.dead);
    for(const e of enemies){ if(!e.topi||!e.dead||e.topiGone) continue; e.topiGone=true; const u=e.topi.mesh.userData; u.awake=false; u.stump=true; u.regrowT=REGROW_T; }
    const D=window.__courtdecor; if(D&&D.topiList) for(const t of D.topiList()){ const u=t.mesh.userData;
      if(u.stump&&hag){ u.regrowT-=dt; if(u.regrowT<=0){ u.stump=false; t.mesh.visible=true; t.mesh.scale.setScalar(.05); u.growing=0; } }
      if(u.growing!==undefined){ u.growing+=dt; const s=Math.min(1,u.growing/2.5); t.mesh.scale.setScalar(Math.max(.05,s)); if(s>=1){ delete u.growing; u.regrown=true; } } }   // regrown: her next cast wakes it
    for(const e of enemies){ if(e.kind!==K||!e.dead) continue; if(e.deathHold===undefined){ e.deathHold=DEATH_HOLD; sleepAll(e); } if(e.deathHold>0){ e.deathHold-=dt; e.dead=Math.min(e.dead,.5); } } }; }
function sleepAll(hagE){ const list=enemies.filter(e=>e.topi&&!e.dead);   // collected first: removing from enemies while walking it would skip every other one
  for(const e of list){ const t=e.topi; const st=t.mesh.clone(); st.visible=true; st.scale.setScalar(1); st.position.set(e.x,baseFloor(e.x,e.z),e.z); st.rotation.y=e.yaw||0; world.add(st); asleep.push(st);
    scene.remove(e.mdl.g); const i=enemies.indexOf(e); if(i>=0) enemies.splice(i,1); t.mesh.userData.awake=false; }
  awake=awake.filter(e=>enemies.includes(e)); if(list.length) floatText(hagE.x,hagE.y+hagE.h+1,hagE.z,'the garden sleeps','#9aff7a'); return list.length; }
// ---------------------------------------------------------------- her arrival in the court's last wave, once ~75 of its mobs are out
let waveTotal=0, doneWave=-1;
{ const prev=startWave; startWave=function(){ prev(); if(court()&&S.wave===MAP.waves) waveTotal=spawnQ.length; }; }
function spawnHag(){ const lk=Object.keys(LANES); if(!lk.length) return null; doneWave=S.wave; ensureTopiKinds();
  banner('🌑 THE ARCHHAG','the brier matron walks into the garden'); camShake=1.0;
  // build 310 (Matt: "all goes quite when she comes on and just this solitary drumline"): the music falls silent as she rises, then only his drumline (music-archhag.mp3), until she falls
  setMusic('none'); setTimeout(()=>{ if(enemies.some(x=>x.kind===K&&!x.dead)) setMusic('archhag'); },1800);
  const e=spawnEnemy(K,lk[0]); e.phase=1; e.shield=0; e.raiseT=2.2;   // her arrival cast, a breath after she has risen (game time: counted in updateEnemies)
  // build 308 (Matt: "the archheg doesnt come out of a side door. she just appears on the map"): she rises out of the ground in the middle of the garden, by the giant tree, in a burst of purple light
  const at=laneNear(21,21,8); if(at){ e.x=cw(at.x); e.z=cwz(at.z); } e.hagRise=0; e.mdl.g.position.set(e.x,-4,e.z); flash(e.x,1.5,e.z,0x9a40ff,7); flash(e.x,.4,e.z,0x6aff5a,4);
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
// ---------------------------------------------------------------- her two-phase health bar
{ const css=document.createElement('style'); css.textContent='#hagbar{position:fixed;left:50%;top:66px;transform:translateX(-50%);width:min(460px,74vw);z-index:20;text-align:center;pointer-events:none;display:none;font:bold 13px Georgia,serif;color:#e6d2ff;text-shadow:0 2px 3px #000;letter-spacing:2px}#hagbar .bars{display:flex;gap:6px;margin-top:3px}#hagbar .track{flex:1;height:12px;background:#140c1a;border:2px solid #3e2450;border-radius:6px;overflow:hidden;box-shadow:0 3px 8px #000a}#hagbar .fill{display:block;height:100%;width:100%;transition:width .2s}#hagbar .p1 .fill{background:linear-gradient(#b070ff,#5a1c9a)}#hagbar .p2 .fill{background:linear-gradient(#8aff6a,#2a8a1a)}#hagbar .track.done{opacity:.35}'; document.head.appendChild(css); }
const bar=document.createElement('div'); bar.id='hagbar'; bar.innerHTML='🌑 THE ARCHHAG<div class="bars"><div class="track p2"><i class="fill"></i></div><div class="track p1"><i class="fill"></i></div></div>'; document.body.appendChild(bar);
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); const e=enemies.find(x=>x.kind===K&&!x.dead); bar.style.display=e?'block':'none'; if(!e){ if(musicMode==='archhag') setMusic(S.phase==='wave'?'wave':'build'); return; } const half=e.max/2;
    bar.querySelector('.p1 .fill').style.width=Math.max(0,100*(e.hp-half)/half)+'%'; bar.querySelector('.p2 .fill').style.width=Math.max(0,Math.min(100,100*e.hp/half))+'%'; bar.querySelector('.p1').classList.toggle('done',e.hp<=half+.01); }; }
window.__archhag={loaded:()=>!!MOBGLB[K],poofs:()=>poofs.map(p=>({t:+p.t.toFixed(2),bits:p.bits.length,body:p.g.visible?+(p.mats.length?p.mats[0][0].opacity:1).toFixed(2):0})),stickModel:()=>({real:!!MOBGLB[SK].real,clips:Object.keys(MOBGLB[SK].map),attack:MOBGLB[SK].map.attack?MOBGLB[SK].map.attack.name:''}),ensure:load,spawn:()=>{ ensureTopiKinds(); return spawnHag(); },wake:wakeAll,awake:()=>awake.filter(e=>!e.dead).length,asleep:()=>asleep.length,curse,
  sticks:()=>sticks.filter(e=>!e.dead).length,cursed:()=>defs.filter(d=>d.curseT>0).length,kind:K};
})();
