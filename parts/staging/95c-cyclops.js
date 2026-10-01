// ===== THE CYCLOPS (build 187): a raid boss. Matt: "this is a raid boss you see in survival mode map 2 level 20 at the
// end of the wave" -- Throne Room ('throne'), Survival, wave 20 of that map's own count (mw===20, same numbering
// waveComp's every-tenth boss wave already uses). The wave's regular content (goblins/orcs/the usual trollboss+ogre
// mini-boss) plays out first as always; only once it's fully cleared (spawnQ empty, no living enemy) does he arrive
// alone, by himself -- not mixed into the queue. That's the one judgment call flagged to Matt: this ADDS to wave 20
// rather than replacing its regular trollboss.
// Model: four Meshy files share one rig (probes/glbinfo.mjs confirmed matching bone names) -- a static pose (dropped,
// no use here) plus three real animation clips: cyclops-walk.glb ("walking_man"), cyclops-run.glb ("running"),
// cyclops-swing.glb ("Heavy_Hammer_Swing"). Loaded like any other mob GLB (fetchMobGLB in game.js) except the three
// clips are combined from three separate files onto one shared skeleton before mapClips sorts them into walk/run/attack.
// Abilities: STOMP (a shockwave that knocks back nearby heroes and dents nearby towers), a heavy lobbed BOULDER at a
// tower he hasn't closed on yet (its own timed ability, not his default engagement -- he otherwise charges straight
// into melee like any other ground mob), and EYE GLARE (a telegraphed beam along a fixed line -- dodge by moving off
// it before it fires; while it's charging and for a moment after, he takes 50% more damage, the "eye is the weak
// spot" Matt asked for, done as a timed vulnerability rather than a body-part hit system this game doesn't otherwise have).
// NOT built here: the Gladehart stag reward (a whole separate pet-companion entity that doesn't exist in code yet --
// flagged to Matt as its own future task). Killing him now pays a big one-time gold/mana bonus and a mythic-tier
// item at the crystal instead, so the encounter has a payoff today.
(function(){
if(TUTORIAL) return;
// ---------------------------------------------------------------- the model: three clips, one shared rig
const FILES={walk:'cyclops-walk.glb',run:'cyclops-run.glb',attack:'cyclops-swing.glb'};
MOBDIM.cyclops={fit:5.8,h:5.3,r:1.55,nat:{walk:.85,run:1.9}};
MOBS.cyclops={hp:860,spd:1.35,dmg:36,cd:2.9,mana:45,splash:2.6,detour:0};   // build 195 (Matt: "double the cyclops health"): was 430 (~2275 at wave 20 once Survival's own scaling applies) -- now ~4550 there   // build 190 (Matt: "when he gets attacked by defenses he stops moving forward, he should come right up to a ballista and start pounding it"): no `ranged` -- that field alone makes the game's generic mob AI hang back and snipe a tower from range instead of closing to melee (it doesn't know he's a Cyclops, just that anything with `ranged` prefers a tower at a distance). Boulder Toss is its own timed ability below instead, thrown occasionally on top of normal melee, never his default way of dealing with a tower. `splash` stays -- fireArrow (game.js) reads it to pick the heavier grenade-style projectile visual for the throw, unrelated to the ranged-targeting behavior that field caused
// build 187 fix (throneload-test.mjs: "map two's model bytes stay under 52 MB" -- these three files alone are ~31 MB):
// he can ONLY ever appear on the Throne Room's own Survival wave 20, never the map's regular 7-wave campaign clear, so
// there's no reason to spend that download on a first-time player just clearing the map -- fetch only once Survival is
// actually the chosen mode here, which is also exactly when there's real time (however long the run takes to reach
// wave 20) for it to land in the background before he'd ever need to show
let loadPromise=null;
function loadCyclopsModel(){ if(MOBGLB.cyclops) return Promise.resolve(); if(loadPromise) return loadPromise;
  loadPromise=Promise.all(Object.values(FILES).map(f=>fetchBytes(ASSET(f),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej)))))
  .then(([wg,rg,ag])=>{ try{ const root=wg.scene||wg.scenes[0];
    // Matt's Meshy export authors this rig's look almost entirely through an emissiveTexture (emissiveFactor [1,1,1],
    // metallic/roughness left at the glTF default of 1/1) -- a baked-lighting technique that reads fine in Meshy's own
    // viewer but breaks here two different ways: full metalness with no environment map starves the plain PBR path of
    // any diffuse response (near-black), and toonify() (game.js) only carries over a flat .emissive COLOR, never an
    // .emissiveMap, so the toonified version washes out to a uniform bright white instead of the textured glow. Reset
    // it to an ordinary matte diffuse-mapped material -- the same convention every other mob in this game already
    // uses -- before toonify runs, so its real (correctly diffuse-textured, confirmed by dumping the raw PNG) look
    // shows through both paths.
    root.traverse(o=>{ if(o.isMesh&&o.material){ o.material.metalness=0; o.material.roughness=.85; if(o.material.emissive) o.material.emissive.setRGB(0,0,0); } });   // toonify's own `o.emissiveIntensity||1` falls back to 1 even when this is set to 0 -- clearing the COLOR is what actually suppresses it
    const fit=fitModel(root,MOBDIM.cyclops.fit); toonify(root,fit.scale);
    const clips=[].concat(wg.animations||[],rg.animations||[],ag.animations||[]);
    MOBGLB.cyclops={wrap:fit.wrap,map:mapClips(clips),scale:fit.scale}; }catch(e){ console.warn('cyclops model',e); } })
  .catch(e=>console.warn('cyclops model',e));
  return loadPromise; }
// checked every tick (cheap: two property reads) rather than once at page load, since a player can flip the title
// screen's mode toggle to Survival on the Throne Room after this module has already finished its own top-level run
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(MAP.id==='throne'&&SURVIVAL) loadCyclopsModel(); }; }
// ---------------------------------------------------------------- when he arrives: wave 20 of the Throne Room's own
// count, Survival only, once the wave's regular content is fully cleared -- checked BEFORE updateWave's own "wave
// held" check (same function, run first), so on the exact frame the hall would otherwise go quiet he's already a
// living enemy and that check finds one, same as if a player-visible mob were still up
let doneWave=-1;   // the map-relative wave he's already answered, so a later run (a fresh page) can ask again
// build 197 (Matt: "lets take out whatever we have for the cyclops and put this in instead. just play it once"):
// replaces build 194's looping TRACKS.boss track with a plain one-shot SAMPLES entry, the same mechanism the wave
// horn/crystal-hit clips already use -- it plays once on spawn through the SFX channel and never touches the ambient
// build/wave music track, so nothing needs to "switch back" afterward
SAMPLES.cyclopsRoar='assets/sfx-cyclops-roar.mp3'; sampleFetch('cyclopsRoar');
function spawnCyclops(){ const k=Object.keys(LANES)[0]; if(!k) return; doneWave=S.wave; banner('☠ THE CYCLOPS','the ground shakes — something huge is coming');
  const e=spawnEnemy('cyclops',k); e.stompCd=5+R(0,2); e.eyeCd=7+R(0,2); e.eyeCharging=false; e.eyeOpenT=0; camShake=1.1;
  playSample('cyclopsRoar',.7); }
{ const prev=updateWave; updateWave=function(dt){
    if(SURVIVAL&&S.phase==='wave'&&MAP.id==='throne'&&!spawnQ.length&&!enemies.some(e=>!e.dead)){
      const mw=effWave()-MAP.wbase; if(mw===20&&doneWave!==S.wave) spawnCyclops();
    }
    prev(dt); }; }
// ---------------------------------------------------------------- STOMP + EYE GLARE (boulder toss is free: MOBS.cyclops's
// own ranged+splash already make the game's ordinary ranged-mob logic lob at distant towers, the same path the
// trollboss's grenade uses). The shared `projs` array's 'splat'/'shock' kinds each force their OWN fixed scale/opacity/
// lifetime onto whatever mesh rides them (checked in game.js's updateProj before writing this) -- fine for the stomp
// ring ('shock' reads a real p.r, so it can show the true hit radius), wrong for a beam or a 1.3s charge-up glow (it'd
// force a beam into a blob, and silently kill a glow at .4s no matter what timer this file thinks it's on). Those two
// get their own tiny self-owned array instead, ticked and cleaned up right here.
const _heroes=()=>[{x:hero.x,y:hero.y,z:hero.z,isDead:()=>hero.dead>0,hurt:hurtHero}].concat(Meta.heroes?Meta.heroes():[]);
const FX=[];   // {mesh,t,life,kind:'beam'} or {mesh,kind:'glow'} -- glow's own lifetime is the eye-charge state, not a timer here
function stomp(e){ const fl=baseFloor(e.x,e.z); const R_HERO=5.5, R_DEF=4.2, dmg=Math.round(MOBS.cyclops.dmg*1.15);
  e.swing=0;   // build 190 (Matt: "no arm swining animations"): Stomp had no gesture of its own -- he just stood there while the ring/knockback happened. Riding e.swing plays his real Heavy_Hammer_Swing clip (mobAnim, game.js) for the same window an ordinary melee hit would, same slam-it-down motion, no new animation needed
  const ring=glow(0xffb050,1,.85); ring.position.set(e.x,fl+.15,e.z); ring.rotation.x=-Math.PI/2; scene.add(ring); projs.push({kind:'shock',t:0,mesh:ring,r:R_HERO});
  camShake=Math.max(camShake,.9);
  for(const h of _heroes()) if(!h.isDead()){ const dx=h.x-e.x, dz=h.z-e.z, d=Math.hypot(dx,dz); if(d<=R_HERO&&d>.01) h.hurt(dmg); }
  const dxH=hero.x-e.x, dzH=hero.z-e.z, dH=Math.hypot(dxH,dzH);
  if(hero.dead<=0&&dH<=R_HERO&&dH>.01){ const nx=dxH/dH, nz=dzH/dH; for(let i=0;i<7;i++) moveCircle(hero,nx*.5,nz*.5,.42,true); }
  for(const d of defs){ const dx=d.x-e.x, dz=d.z-e.z, dd=Math.hypot(dx,dz); if(dd<=R_DEF) hurtDef(d,dmg); } }
function eyeStartGlow(e){ const g=glow(0xff4fc8,.75,0); g.position.set(e.x,baseFloor(e.x,e.z)+e.h*.7*e.sc,e.z); scene.add(g); FX.push({mesh:g,kind:'glow',owner:e}); e.eyeGlow=g; }
function eyeFire(e){ e.eyeCharging=false; e.eyeOpenT=1.0; e.eyeCd=9+R(0,2);
  const gi=FX.findIndex(f=>f.owner===e); if(gi>=0){ scene.remove(FX[gi].mesh); FX[gi].mesh.material.dispose(); FX.splice(gi,1); } e.eyeGlow=null;
  const ex=e.x+e.eyeDx*.6, ez=e.z+e.eyeDz*.6, ey=baseFloor(e.x,e.z)+e.h*.7*e.sc, L=16;
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,L,8),basic(0xff4fc8,{transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));
  beam.position.set(ex+e.eyeDx*L/2,ey,ez+e.eyeDz*L/2); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(e.eyeDx,0,e.eyeDz));
  beam.userData.noOL=true; scene.add(beam); FX.push({mesh:beam,kind:'beam',t:0,life:.3});
  SFX.harpoon(); camShake=Math.max(camShake,.6);
  const dmg=Math.round(MOBS.cyclops.dmg*1.6);
  for(const h of _heroes()) if(!h.isDead()){ const px=h.x-ex, pz=h.z-ez, along=px*e.eyeDx+pz*e.eyeDz; if(along<0||along>L) continue;
    if(Math.abs(px*e.eyeDz-pz*e.eyeDx)<=1.15) h.hurt(dmg); } }
function fxTick(dt){ for(let i=FX.length-1;i>=0;i--){ const f=FX[i];
    if(f.kind==='beam'){ f.t+=dt; f.mesh.material.opacity=.9*(1-f.t/f.life); if(f.t>=f.life){ scene.remove(f.mesh); f.mesh.material.dispose(); FX.splice(i,1); } } } }
// a tower he hasn't reached yet, worth a thrown boulder instead of waiting to walk all the way up to it (adjacent
// towers are left to his ordinary melee -- this is flavor on top of closing in, not a replacement for it)
function boulderToss(e){ let best=null, bd=14; for(const d of defs){ const dd=Math.hypot(d.x-e.x,d.z-e.z); if(dd<bd&&dd>3&&los(e.x,e.z,d.x,d.z)){ bd=dd; best=d; } } if(!best) return;
  e.swing=0; fireArrow(e,best.x,1.0,best.z,{kind:'def',obj:best}); }
{ const prev=updateEnemies; updateEnemies=function(dt){ prev(dt); fxTick(dt);
    for(const e of enemies){ if(e.dead||e.kind!=='cyclops') continue;
      if(e.stompCd===undefined){ e.stompCd=5+R(0,2); e.eyeCd=7+R(0,2); e.eyeCharging=false; e.eyeOpenT=0; e.boulderCd=6+R(0,2); }
      e.stompCd-=dt; if(e.stompCd<=0&&e.swing<0){ e.stompCd=7+R(-1,1); stomp(e); }
      e.boulderCd-=dt; if(e.boulderCd<=0&&e.swing<0){ e.boulderCd=11+R(-1,1); boulderToss(e); }
      if(e.eyeOpenT>0) e.eyeOpenT-=dt;
      if(e.eyeCharging){ e.eyeChargeT+=dt; if(e.eyeGlow) e.eyeGlow.material.opacity=Math.min(.85,e.eyeChargeT/1.3*.85);
        if(e.eyeChargeT>=1.3) eyeFire(e); }
      else { e.eyeCd-=dt; if(e.eyeCd<=0&&e.swing<0){ const nh=_heroes().filter(h=>!h.isDead()).sort((a,b)=>Math.hypot(a.x-e.x,a.z-e.z)-Math.hypot(b.x-e.x,b.z-e.z))[0];
          if(nh){ const dx=nh.x-e.x, dz=nh.z-e.z, d=Math.hypot(dx,dz)||1; e.eyeDx=dx/d; e.eyeDz=dz/d; e.eyeCharging=true; e.eyeChargeT=0; eyeStartGlow(e); toast('The Cyclops glares…'); } } } } }; }
{ const prev=hurt; hurt=function(e,dmg,kx,kz){ if(e&&e.kind==='cyclops'&&(e.eyeOpenT>0||e.eyeCharging)) dmg=Math.round(dmg*1.5); return prev(e,dmg,kx,kz); }; }
// ---------------------------------------------------------------- the boss bar (top-center, only while he's up)
const css=document.createElement('style'); css.textContent=
 `#cycbar{position:fixed;left:50%;top:66px;transform:translateX(-50%);width:min(520px,70vw);z-index:20;text-align:center;pointer-events:none;display:none;font:bold 13px Georgia,serif;color:#ffd8ec;text-shadow:0 2px 3px #000}
  #cycbar .track{height:14px;background:#1a0e14;border:2px solid #4a1420;border-radius:5px;overflow:hidden;box-shadow:0 3px 8px #000a;margin-top:3px}
  #cycbar .fill{display:block;height:100%;background:linear-gradient(#ff5a8a,#c81a4a);width:100%;transition:width .2s}`;   // build 192 (Matt: "the big one at the top is just black"): an <i> is inline by default, and height/width don't apply to an inline box -- the fill collapsed to nothing, leaving only the dark .track behind it visible
document.head.appendChild(css);
const el=document.createElement('div'); el.id='cycbar'; el.innerHTML='☠ THE CYCLOPS<div class="track"><i class="fill"></i></div>'; document.body.appendChild(el);
const fillEl=()=>el.querySelector('.fill');
const foes=()=>(window.__net&&window.__net.role&&window.__net.role()==='guest'&&window.__mobsync)?window.__mobsync.foes():enemies;   // build 375: a guest's mobs are puppets (99-network.js), not `enemies` -- the bar reads those there
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); const e=foes().find(x=>x.kind==='cyclops'&&!x.dead);
    if(e){ el.style.display='block'; fillEl().style.width=Math.max(0,100*e.hp/e.max)+'%'; } else el.style.display='none'; }; }
// ---------------------------------------------------------------- the reward: no Gladehart yet (a separate pet-companion
// entity that isn't built), so a solid one-time payout instead -- a real payoff for the fight today, upgraded to the
// stag once that system exists
{ const prev=kill; kill=function(e){ const wasCyclops=e.kind==='cyclops'&&!e.dead; prev(e);
    if(wasCyclops){ const bonus=800; S.mana+=bonus; dropLoot(rollItem(4),R(-1.6,1.6),4.6,true); dropLoot(rollItem(4),R(-1.6,1.6),4.6,true);   // 4 is Legendary, rollRarity's own natural ceiling -- 5 is the separate mythic tier 87-mythicdrops.js hands out on its own roll, not something to force here
      toast('☠ THE CYCLOPS FALLS — +'+bonus+' mana, and the hall remembers'); SFX.setBong&&SFX.setBong(); if(window.__gladehart) window.__gladehart.reward(); } }; }   // build 221: and Gladehart, once
window.__cyclops={loaded:()=>!!MOBGLB.cyclops,spawn:spawnCyclops,ensure:loadCyclopsModel,alive:()=>{ const e=enemies.find(x=>x.kind==='cyclops'&&!x.dead); return e?{hp:e.hp,max:e.max,stompCd:+e.stompCd.toFixed(2),eyeCd:+e.eyeCd.toFixed(2),eyeCharging:e.eyeCharging,eyeOpenT:+e.eyeOpenT.toFixed(2)}:null; }};
})();
