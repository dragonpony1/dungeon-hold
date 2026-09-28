// ===== THE PIG BOSS TRIO (build 198): Throne Room's CAMPAIGN wave-7 finale -- three bandit-pig bosses, Matt:
// "the thrown room wave 7 campaign boss, its 3 pig bosses" then, one at a time as their art arrived: Flail "he has a
// flail and hes the boss of the bosses,, lol of the pigs" (heaviest, slowest, hardest hitting); Dagger "hes slimmer"
// (fast, light); Sling "hes ranged he has a sling and it spins for a short time and throws bombs that splash".
// Structure confirmed by Matt: "all three at once".
// Judgment call flagged to Matt (matches the Cyclops's own precedent in 95c-cyclops.js): they arrive once wave 7's
// regular content (goblins/orcs/the usual trollboss, which already spawns every fifth wave from the campaign's
// twelfth effective wave -- Throne's own wave 7 lands exactly there) is fully cleared, not mixed into the queue --
// an ADD to the map's real finale, not a replacement for its existing miniboss.
// Second judgment call: these three files are heavy -- 9 real GLBs, ~87 MB total (nearly 3x the Cyclops's own ~31 MB
// for one boss), so unlike the Cyclops (gated on Survival, a mode most players never even try) this trio would
// otherwise load during every ordinary Throne Room campaign clear -- the common path, not a rare one. Fetch doesn't
// start until wave 5 of the map's own count (two waves of ordinary play before they're needed, not the moment the
// map loads) so it has time to land in the background before wave 7 actually arrives. Worth revisiting with Matt if
// it still causes a hitch in practice -- the same texture-shrink trick used on the Storm bow would trim it further.
(function(){
if(TUTORIAL) return;
// ---------------------------------------------------------------- the three models: each is its own walk+run+attack
// trio of files sharing one 24-joint rig (glbinfo confirmed matching bone names across all three bosses, same as the
// Cyclops's own three-file rig) -- the static "2K PBR" pose file each one also shipped with is never fetched, same
// as the Cyclops's own unused pose file: it was only ever needed for the studio-render check before building.
const PIGS={
  pigflail:{files:{walk:'pigflail-walk.glb',run:'pigflail-run.glb',attack:'pigflail-attack.glb'},atkName:'Axe_Spin_Attack',
    // build 200 (Matt: "make them 20% bigger again" -- on top of build 199's own height bump; "let them walk as fast
    // as the other mobs" -- they were visibly lagging behind the wave's own goblins/orcs at 1.3-2.0 speed; "they dye
    // easy" -- a wave-7 hall's already-built, already-marked-up towers were dropping them before Matt could even see
    // them, hp raised well past a token bump): fit/h/r all scaled ×1.2 together this time (no "taller not bulkier"
    // qualifier this round), spd brought up near the wave's own goblin pace (3.4), hp roughly doubled
    dim:{fit:5.16,h:4.8,r:1.14,nat:{walk:.85,run:1.9}},
    stats:{hp:520,spd:2.6,dmg:18,cd:2.5,mana:24}},
  pigdagger:{files:{walk:'pigdagger-walk.glb',run:'pigdagger-run.glb',attack:'pigdagger-attack.glb'},atkName:'Double_Blade_Spin',
    dim:{fit:3.96,h:3.6,r:.79,nat:{walk:1.0,run:2.3}},
    stats:{hp:340,spd:2.6,dmg:11,cd:1.5,mana:18}},
  pigsling:{files:{walk:'pigsling-walk.glb',run:'pigsling-run.glb',attack:'pigsling-attack.glb'},atkName:'Crouch_Charge_and_Throw',
    dim:{fit:4.32,h:3.96,r:.94,nat:{walk:.9,run:2.0}},
    stats:{hp:480,spd:2.6,dmg:14,cd:2.4,mana:20,splash:2.3}},   // hp was the lowest of the three (200) and the one Matt kept losing to focus fire before ever seeing him -- now the highest, since he's also the one standing still the longest (charging a throw) with nothing else drawing tower attention his way. No `ranged` -- same call the Cyclops made: that field only ever makes the generic AI snipe a TOWER from range (game.js's own ranged-standoff check explicitly skips it for a hero target), so a melee-seeking mob plus Sling's own charge-and-throw special below (mirroring Boulder Toss) covers both a hero and a tower without fighting itself. `splash` stays so fireArrow picks the heavier grenade visual for the throw.
};
for(const k in PIGS){ MOBDIM[k]=PIGS[k].dim; MOBS[k]=PIGS[k].stats; }
// build 187's emissiveTexture fix, confirmed present on all three of these too (checked each one's raw materials
// JSON by hand before building): Meshy's rigged export authors the look almost entirely through an emissiveTexture
// (emissiveFactor [1,1,1], metallic/roughness left at the glTF default of 1/1) -- fine in Meshy's own viewer, black
// under raw PBR with no env map, washed to solid white by toonify()'s flat-colour-only .emissive carry-over. Reset
// to an ordinary diffuse-mapped material, the same convention every other mob (including the Cyclops) already uses.
function fixMats(root){ root.traverse(o=>{ if(o.isMesh&&o.material){ o.material.metalness=0; o.material.roughness=.85; if(o.material.emissive) o.material.emissive.setRGB(0,0,0); } }); }
const pigLoadP={};
function loadPigModel(kind){ if(MOBGLB[kind]) return Promise.resolve(); if(pigLoadP[kind]) return pigLoadP[kind];
  const cfg=PIGS[kind], F=cfg.files;
  // build 201 (Matt: "everything works except the art" -- game logic fine, nothing visual finishing): these were on
  // 'soon', game.js's OWN time-critical tier ("what getting in and placing needs -- mark-I defenses and their shots,
  // the wave-one goblin, the raven..."), same as the Cyclops's own fetch. The Cyclops's ~31 MB only ever competes
  // with that tier in the rare Survival mode; this trio's ~87 MB was competing with it on every ordinary campaign
  // wave 5+ -- any real gear/weapon/mob fetch mid-fight (switching heroes, new loot, a new mob kind showing up) queued
  // behind it and never finished, which reads as "nothing new is loading" even though the game itself keeps running.
  // fetchBytes with no priority at all falls into game.js's own third, lowest tier: it waits for 'soon' to fully
  // drain before even starting, so this heavy download never competes with anything time-sensitive again.
  pigLoadP[kind]=Promise.all([F.walk,F.run,F.attack].map(f=>fetchBytes(ASSET(f)).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej)))))
    .then(([wg,rg,ag])=>{ try{ const root=wg.scene||wg.scenes[0]; fixMats(root);
      const fit=fitModel(root,cfg.dim.fit); toonify(root,fit.scale);
      const clips=[].concat(wg.animations||[],rg.animations||[],ag.animations||[]);
      const map=mapClips(clips);
      // Axe_Spin_Attack matches CLIPMAP's own /attack/i fine on its own, but Double_Blade_Spin and
      // Crouch_Charge_and_Throw don't contain any word CLIPMAP looks for -- name each attack clip explicitly instead
      // of trusting the regex, so all three definitely get a real attack animation instead of silently falling back
      // to no swing at all (the very bug build 190 found and fixed for the Cyclops's own Stomp).
      const atk=clips.find(c=>c.name.indexOf(cfg.atkName)>=0); if(atk) map.attack=atk;
      MOBGLB[kind]={wrap:fit.wrap,map,scale:fit.scale}; }catch(e){ console.warn('pig boss model '+kind,e); } })
    .catch(e=>console.warn('pig boss model '+kind,e));
  return pigLoadP[kind]; }
function loadAllPigs(){ return Promise.all(Object.keys(PIGS).map(loadPigModel)); }
function pigsLoaded(){ return Object.keys(PIGS).every(k=>!!MOBGLB[k]); }
// checked every tick, same reasoning as the Cyclops: a player can reach wave 5 on a page that's been open the whole
// time, this can't be decided once at load
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(!SURVIVAL&&MAP.id==='throne'&&S.wave>=5) loadAllPigs(); }; }
// ---------------------------------------------------------------- build 199 (Matt, after playtesting build 198's
// "arrives after the wave clears" version): "I realized they need to come out in the wave, so wave 7 should have
// about 100 mobs, bring them out together around 75" -- a bigger wave 7, with the trio bursting in partway through
// it (roughly 75 of ~100 regular mobs already out) instead of waiting for a quiet, empty room. waveComp's own
// per-wave mob counts are shared by every map and by Survival's reuse of the same formula, so the extra goblins are
// appended here, only for Throne's own campaign wave 7, rather than touched in the shared function itself.
{ const prev=waveComp; waveComp=function(w){ const c=prev(w);
    if(!SURVIVAL&&MAP.id==='throne'&&(w-MAP.wbase)===MAP.waves){
      const goblins0=c.q.filter(x=>x.kind==='goblin').length, extra=Math.max(0,100-c.q.length);
      if(extra){ const lanes=[...new Set(c.q.map(x=>x.lane))]; let t=c.q.length?c.q[c.q.length-1].t+.35:1.5;
        for(let i=0;i<extra;i++){ c.q.push({t,kind:'goblin',lane:lanes[i%lanes.length]}); t+=.35; }
        c.q.sort((a,b)=>a.t-b.t); c.desc=c.desc.replace('Goblins ×'+goblins0,'Goblins ×'+(goblins0+extra)); }
    }
    return c; }; }
// captured once at the start of wave 7 specifically -- how many total mobs this wave holds, so the trigger below can
// tell when "about 75 of them" have come out, not just count down to zero
let pigWaveTotal=0;
{ const prev=startWave; startWave=function(){ prev(); if(!SURVIVAL&&MAP.id==='throne'&&S.wave===MAP.waves) pigWaveTotal=spawnQ.length; }; }
// ---------------------------------------------------------------- when they arrive: partway through wave 7 (not
// after it clears), once roughly 75 of that wave's ~100 mobs have come out the gate -- the remaining regular mobs
// keep arriving on their own schedule around them, same as the Cyclops's banner/camera-shake/music entrance either way
let doneWave=-1;
// build 200 (Matt: "see if the towers are allowed to focus on them alone they dye easy lets bring them in with an
// instant bolus of 30 mobs"): a wall's worth of already-marked-up towers had nothing else to shoot at the instant
// the trio appeared and dropped them before they were even on screen. 30 goblins land in the SAME instant (t at or
// just before "now", not scheduled forward like the wave's own queue), spread across every lane, so every tower in
// the hall suddenly has two dozen other things demanding its attention too
function pigEscort(){ const lk=Object.keys(LANES); if(!lk.length) return; const now=S.waveT;
  for(let i=0;i<30;i++) spawnQ.push({t:now-.01,kind:'goblin',lane:lk[i%lk.length]}); spawnQ.sort((a,b)=>a.t-b.t); }
function spawnPigBosses(){ const lk=Object.keys(LANES); if(!lk.length) return; doneWave=S.wave;
  banner('🐗 THE PIG BOSSES','three raiders storm the hall'); camShake=1.0; setMusic('pigboss'); pigEscort();
  spawnEnemy('pigflail',lk[0]); spawnEnemy('pigdagger',lk[1%lk.length]); spawnEnemy('pigsling',lk[2%lk.length]); }
{ const prev=updateWave; updateWave=function(dt){
    if(!SURVIVAL&&S.phase==='wave'&&MAP.id==='throne'&&S.wave===MAP.waves&&doneWave!==S.wave&&pigWaveTotal>0){
      if(pigWaveTotal-spawnQ.length>=75) spawnPigBosses();
    }
    prev(dt); }; }
// ---------------------------------------------------------------- SLING'S charge-and-throw: same shape as the
// Cyclops's Eye Glare (a timed charge with a visible glow, telegraphed and dodgeable) feeding into Boulder Toss's own
// targeting/fireArrow call (a tower he hasn't closed on yet) -- "it spins for a short time and throws bombs that
// splash" is the charge-then-lob, not his ordinary melee, which he still falls back to if nothing's in range to throw at
const SLING_CHARGE=1.4;
function slingChargeStart(e){ e.slingCharging=true; e.slingChargeT=0; const g=glow(0xd08040,.8,0); g.position.set(e.x,baseFloor(e.x,e.z)+e.h*.55*e.sc,e.z); scene.add(g); e.slingGlow=g; toast('The Sling Boss winds up a throw…'); }
function slingThrow(e){ e.slingCharging=false; if(e.slingGlow){ scene.remove(e.slingGlow); e.slingGlow.material.dispose(); e.slingGlow=null; }
  let best=null, bd=14; for(const d of defs){ const dd=Math.hypot(d.x-e.x,d.z-e.z); if(dd<bd&&dd>2&&los(e.x,e.z,d.x,d.z)){ bd=dd; best=d; } }
  if(!best) return; e.swing=0; fireArrow(e,best.x,1.0,best.z,{kind:'def',obj:best}); }
{ const prev=updateEnemies; updateEnemies=function(dt){ prev(dt);
    for(const e of enemies){ if(e.dead||e.kind!=='pigsling') continue;
      if(e.slingCd===undefined) e.slingCd=5+R(0,2);
      if(e.slingCharging){ e.slingChargeT+=dt; if(e.slingGlow) e.slingGlow.material.opacity=Math.min(.75,e.slingChargeT/SLING_CHARGE*.75); if(e.slingChargeT>=SLING_CHARGE) slingThrow(e); }
      else { e.slingCd-=dt; if(e.slingCd<=0&&e.swing<0){ e.slingCd=8+R(-1,1); slingChargeStart(e); } } } }; }
// ---------------------------------------------------------------- the boss bar: one panel, three named rows, each
// hides on its own as that pig falls -- the whole panel hides once none of the three are left (build 192's fix
// already applies here too: the fill is a real block element, not an inline <i>)
const css=document.createElement('style'); css.textContent=
 `#pigbar{position:fixed;left:50%;top:66px;transform:translateX(-50%);width:min(420px,70vw);z-index:20;text-align:center;pointer-events:none;display:none;font:bold 12px Georgia,serif;color:#ffe6c8;text-shadow:0 2px 3px #000}
  #pigbar .row{margin-top:5px}
  #pigbar .track{height:11px;background:#1a120e;border:2px solid #4a2c14;border-radius:5px;overflow:hidden;box-shadow:0 3px 8px #000a;margin-top:2px}
  #pigbar .fill{display:block;height:100%;background:linear-gradient(#ffa050,#c8621a);width:100%;transition:width .2s}`;
document.head.appendChild(css);
const el=document.createElement('div'); el.id='pigbar';
el.innerHTML=['pigflail:FLAIL','pigdagger:DAGGER','pigsling:SLING'].map(s=>{ const [k,name]=s.split(':');
  return `<div class="row" data-k="${k}">${name}<div class="track"><i class="fill"></i></div></div>`; }).join('');
document.body.appendChild(el);
const rowEl=k=>el.querySelector(`.row[data-k="${k}"]`);
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt);
    let anyAlive=false;
    for(const k of Object.keys(PIGS)){ const e=enemies.find(x=>x.kind===k&&!x.dead); const row=rowEl(k);
      if(e){ anyAlive=true; row.style.display='block'; row.querySelector('.fill').style.width=Math.max(0,100*e.hp/e.max)+'%'; }
      else row.style.display='none'; }
    el.style.display=anyAlive?'block':'none';
    if(!anyAlive&&musicMode==='pigboss') setMusic('wave'); }; }
// ---------------------------------------------------------------- entrance music: Matt's "pigboss march.mp3" (19.2
// s, a real loop, not a short stinger like the Cyclops's roar) -- loops natively while any of the three are alive,
// reverts to the ordinary wave track the instant the last one falls (tied to them actually being dead, not a fixed
// timer like the Cyclops's old build-194 approach, since a three-boss fight has no fixed length)
TRACKS.pigboss='assets/music-pigboss-march.mp3'; musFetch('pigboss');
window.__pigbosses={loaded:pigsLoaded,spawn:spawnPigBosses,ensure:loadAllPigs,
  alive:()=>Object.keys(PIGS).map(k=>{ const e=enemies.find(x=>x.kind===k&&!x.dead); return e?{kind:k,hp:e.hp,max:e.max}:null; }).filter(Boolean)};
})();
