// ===== RIGHT-CLICK SPECIALS (build 182): one big, slow, hero-defining attack, one per hero. Matt: "start thinking
// about special charged attacks, when right clicking. an attack that takes longer but clears mobs." Right-click no
// longer swings (game.js's own mousedown handler calls specialPress() instead — a seam declared right next to
// mouseDown, the same "no-op stub a module rebinds" idea Meta's own hooks use, just not worth a whole object for two
// functions): holding it (or the new ✦ touch button) for CHARGE_TIME charges up, walking at HALF SPEED the whole
// time and still fully able to be hit — real risk for real payoff, the same trade the bow/staff's own aim-hold
// (84-aim.js) already makes, just longer and bigger. Reaching full charge fires automatically; letting go early
// cancels with nothing spent, not even the cooldown, so an interrupted charge only ever wastes the time already
// sunk into it. A full cast starts a flat COOLDOWN, never mana — canStart() is every other way a charge gets refused
// or cut short (dead, a menu open, placing a defense, the run not actually live, already mid-swing, or already
// holding a normal ranged draw — the latter two also block each other the other way, see the swing rebind below).
//
// Numbers (a judgement call each; nothing here came from Matt beyond the quote above and the per-hero briefs he gave):
//   Gnome Knight — WHIRLWIND CLEAVE: a 360° spin, radius 4, 3x heroDmg(), strong outward knockback.
//   Gnome Battle Witch — STARFALL: aim a spot up to 12 units (reuses 84-aim.js's own reticle/ray — whatever it has
//     locked, or the free crosshair's floor point), radius 5, 3x heroDmg(), slows everything hit (the Mycelium
//     Cage's own 55%, e.slowT — a shared flag, not a new one, so it stacks/refreshes with the cage exactly as
//     two real slows already do).
//   Gnome Fighter — HALO SURGE: a ring rolling outward to 8 units over .6s (2x heroDmg(), hitting only what it has
//     just reached each tick, not everything inside 8 units at once), and every halo tower (zap/venom/ember/dazzle)
//     in the WHOLE hall pulses at double dmg/poisonDur/confuseDur for 6s — a hall-wide buff, not just this hero's
//     own towers, per Matt's "should work whichever player fires it, buffing everyone's halos". Keyed through
//     stat() (two tiny game.js routings, confuseDur/poisonDur through stat() the way dmg already was — see the
//     build-182 comments there) rather than a special case, so it also stacks correctly with a Rune Totem's own
//     buffD the way any other multiplier there already does.
//   Troll Archer — VOLLEY: aim a spot up to 16 units (my own call: longer than Starfall's 12, short of his own 24
//     reach), 3x heroDmg() split across 5 waves a fifth of a second apart (1s total), each hitting a 2.5-radius zone
//     — whatever is standing there when a wave lands takes that wave, so something that walks through the zone
//     mid-volley can catch more than one.
//
// Co-op: relayed exactly like a swing/shot (99-network.js's own pattern) but entirely from THIS module, over
// window.__net's already-public surface (send/onMessage/peers/role) — 99-network.js itself needed no changes, since
// it already exposes exactly what a new message type needs. A guest computes its own numbers (heroDmg() etc, off
// ITS OWN gear) and sends a 'specialCast'; only the host ever acts on one (hostApplySpecial, applying to the real
// enemies/defs/RING_FX/HALO_SURGE_T every other function in this file also touches — solo and host are the same
// code path, there's no third branch). The caster's own screen always plays the flourish at once, optimistically,
// whether they're a guest waiting on a round trip or not; the host then re-broadcasts a 'specialFx' (cosmetic only —
// the real damage numbers already reach every other guest for free through the existing enemy-hp-diff puppet sync,
// 99-network.js's hostBroadcastEnemies, the same way a normal hit already does) to every OTHER connected player so
// they see the visual too. A second guest watching a first guest's cast is the one case that still only gets the
// damage feedback and not the flourish — the same acknowledged gap 99-network.js already notes for a guest's own
// bolt/arrow ("nobody but the host ever SEES a guest's bolt/arrow fly").
(function(){
'use strict';
const CHARGE_TIME=1.2, COOLDOWN=10;
const SPEC_NAME={knight:'Whirlwind Cleave',witch:'Starfall',fighter:'Halo Surge',troll:'Volley'};
const CHARGE_COLOR={knight:0xcfd8ff,witch:0x9a6bff,fighter:0xffd27a,troll:0x9be06a};
const CLEAVE_R=4, CLEAVE_KB=3.0;
const STARFALL_R=5, STARFALL_MAXR=12, STARFALL_SLOW=2.5;
const HALO_RING_R=8, HALO_RING_DUR=.6, HALO_SURGE_DUR=6, HALO_KINDS=['zap','venom','ember','dazzle'];
const VOLLEY_R=2.5, VOLLEY_MAXR=16, VOLLEY_WAVES=5, VOLLEY_DUR=1.0;
function heroId(){ return window.__heroes?window.__heroes.pick():'knight'; }
function NET(){ return window.__net||null; }

// ---- charge/cooldown state: per PLAYER (this page), not per hero pick -- switching heroes mid-cooldown keeps
// counting down, same as any other timer here would ----
const SP={charging:false,t:0,cd:0};
let lastDenyToast=0;
// mirrors swing()'s own gate (game.js) plus this special's own two extra ways to refuse: already mid-swing (a normal
// hit about to land) and already holding a normal ranged draw (84-aim.js's HOLD) -- either one blocks the other,
// see the swing() rebind further down for the reverse direction
function canStart(){ return !(Meta.isOpen()||placing||hero.dead>0||hero.swingT>=0||S.phase==='start'||S.phase==='dead'||S.phase==='won'||S.phase==='deathcut'||(window.__aim&&window.__aim.holding())); }
specialPress=function(){
  if(SP.charging) return;
  if(SP.cd>0){ const now=performance.now(); if(now-lastDenyToast>1200){ lastDenyToast=now; toast((SPEC_NAME[heroId()]||'Special')+' recharging ('+Math.ceil(SP.cd)+'s)'); } return; }   // build 182: no queueing, no restart -- a mash during cooldown just re-hits this same early return
  if(!canStart()) return;
  SP.charging=true; SP.t=0; beep(220,.12,'sine',.05,160);
};
specialRelease=function(){ if(!SP.charging) return; SP.charging=false; SP.t=0; };   // release before full charge: nothing happens, not even the cooldown -- a wasted charge costs only the time already spent holding it
// a special in progress and a normal ranged draw are mutually exclusive: specialPress already refuses to start while
// window.__aim.holding() is true (above); this is the other direction -- swing() (the normal-attack key, either mouse
// button before this build, still left-click/F/Q) is a no-op while a special is charging, so 84-aim.js's own wrapper
// (loaded after this file) never sees hero.swingT move and never starts its own HOLD on top of ours
{ const prevSwing=swing; swing=function(){ if(SP.charging) return; return prevSwing(); }; }

// ---- the shared charge-glow: one persistent sprite (built once, just toggled/repositioned/recoloured, never
// reallocated) standing in for "every hero gets some visible flourish while charging", since a melee hero has no
// reticle (84-aim.js's own charge ring only ever draws for a bow/staff) to show it on ----
const chargeGlow=glow(0xffe9a8,1,0); chargeGlow.visible=false; scene.add(chargeGlow);
function tickChargeGlow(){ if(!SP.charging){ chargeGlow.visible=false; return; }
  chargeGlow.visible=true; const k=SP.t/CHARGE_TIME; chargeGlow.position.set(hero.x,hero.y+1.4,hero.z);
  chargeGlow.scale.setScalar(lerp(.6,2.0,k)); chargeGlow.material.opacity=.25+.55*k; chargeGlow.material.color.copy(C(CHARGE_COLOR[heroId()]||0xffe9a8)); }

// ---- the landing circle (build 255): while a special charges, a ring on the floor shows what it will cover -- round the hero for the Knight's whirlwind (4) and the Fighter's halo (8), on the spot the aim
// picks for the Witch's starfall (5) and the Ranger's volley (2.5) -- with a disc inside growing to the ring as the charge fills. aimSpot() is the same call that fires the special, so it is where it lands. ----
const GR={r:{knight:CLEAVE_R,witch:STARFALL_R,fighter:HALO_RING_R,troll:VOLLEY_R},on:false,x:0,z:0,R:0,k:0};
const grGeo=new THREE.RingGeometry(.93,1,72), grDisc=new THREE.CircleGeometry(1,56);
const grRing=new THREE.Mesh(grGeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false})), grBack=new THREE.Mesh(grDisc,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.14,side:THREE.DoubleSide,depthWrite:false})), grFill=new THREE.Mesh(grDisc,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}));
const grGroup=new THREE.Group(); for(const m of [grBack,grFill,grRing]){ m.userData.noOL=true; m.frustumCulled=false; grGroup.add(m); } grGroup.rotation.x=-PI/2; grGroup.visible=false; scene.add(grGroup);
function tickGroundRing(){ if(!SP.charging){ if(GR.on){ GR.on=false; grGroup.visible=false; } return; }
  const hid=heroId(), R=GR.r[hid]||3, k=Math.min(1,SP.t/CHARGE_TIME); const spot=(hid==='witch')?aimSpot(STARFALL_MAXR):(hid==='troll')?aimSpot(VOLLEY_MAXR):{x:hero.x,z:hero.z};
  GR.on=true; GR.x=spot.x; GR.z=spot.z; GR.R=R; GR.k=k; const col=C(CHARGE_COLOR[hid]||0xffe9a8); for(const m of [grRing,grBack,grFill]) m.material.color.copy(col);
  grGroup.position.set(spot.x,baseFloor(spot.x,spot.z)+.09,spot.z); grRing.scale.setScalar(R); grBack.scale.setScalar(R); grFill.scale.setScalar(Math.max(.001,R*k)); grRing.material.opacity=k>=.95?.6+.4*Math.sin(S.t*30)**2:.8; grGroup.visible=true; }
// ---- the halo buff: a flat multiplier stat() (game.js) applies for every halo tower kind while HALO_SURGE_T is
// still counting down, whoever's page is actually simulating the real hall (host or solo -- a guest's own local defs
// are never what's drawn or shared, same as everywhere else in this game's co-op). Keyed through stat() itself
// (wrapping the shared top-level binding, same trick as swing above) rather than touching updateDefs's own per-kind
// branches, so it composes with a Rune Totem's buffD/buffS exactly like any other multiplier already there does ----
let HALO_SURGE_T=0;
{ const prevStat=stat;
  stat=function(d,k){ const v=prevStat(d,k); if(HALO_SURGE_T>0&&HALO_KINDS.includes(d.kind)&&(k==='dmg'||k==='confuseDur'||k==='poisonDur')) return v*2; return v; }; }

// ---- Fighter's rolling ring: a lightweight timer, not a persistent object -- ticked in the Meta.update hook below
// only while one is actually rolling (at most one at a time; a second cast can't start until the 10s cooldown clears
// anyway, so there's never a reason for more than one) ----
let RING_FX=null;
function tickRing(dt){ if(!RING_FX) return; const f=RING_FX; f.t+=dt; const k=Math.min(1,f.t/f.DUR); f.r=f.R*k;
  for(const e of enemies){ if(e.dead||f.hit.has(e)) continue; const d=Math.hypot(e.x-f.x,e.z-f.z); if(d<=f.r+e.r*.5){ f.hit.add(e); const l=Math.max(d,.01); hurt(e,f.dmg,(e.x-f.x)/l*1.2,(e.z-f.z)/l*1.2); } }
  if(k>=1) RING_FX=null; }

// ---- Troll's volley queue: up to VOLLEY_WAVES pending {x,z,dmg,at} entries, each applied once S.t reaches it.
// S.t (game.js) keeps advancing every frame regardless of phase (updateFx runs unconditionally), but Meta.update
// itself -- where this is ticked -- only runs during 'build'/'wave' (game.js's own update()), so an interrupted
// volley (the crystal falls mid-rain) simply stops delivering its remaining waves, same as everything else pausing ----
let VOLLEY_Q=[];
function tickVolley(){ for(let i=VOLLEY_Q.length-1;i>=0;i--){ const w=VOLLEY_Q[i]; if(S.t<w.at) continue; VOLLEY_Q.splice(i,1);
    let n=0; for(const e of enemies){ if(e.dead) continue; const d=Math.hypot(e.x-w.x,e.z-w.z); if(d<VOLLEY_R+e.r*.5){ hurt(e,w.dmg,0,0); n++; } } if(n) SFX.hit(); fallImpact(w.x,w.z); } }

// ---- falling bolts/arrows: a cheap one-shot visual per special that "rains" (Starfall, Volley) -- small meshes
// built per cast (a handful at most, at most once every ten seconds per player: the same allocation budget
// grenadeMesh()/arrowMesh() already spend per throw in the base game, not a per-frame cost) tweened by hand and
// cleaned up on landing, never touching game.js's own projs/updateProj switch ----
let FALL=[];
function spawnRain(x,z,color,n,style){ for(let i=0;i<n;i++){ const ox=(rnd()-.5)*1.8, oz=(rnd()-.5)*1.8; const m=style==='arrow'?M(new THREE.ConeGeometry(.09,.55,6),mat(color)):M(new THREE.OctahedronGeometry(.14,0),basic(color));
    m.userData.noOL=true; if(style==='arrow') m.rotation.x=PI; m.add(glow(color,.9,.7)); m.visible=false; scene.add(m);
    FALL.push({mesh:m,x:x+ox,z:z+oz,y0:6+rnd()*1.5,y1:baseFloor(x+ox,z+oz)+.05,dur:.32,t:0,delay:rnd()*.55}); } }
function tickFall(dt){ for(let i=FALL.length-1;i>=0;i--){ const f=FALL[i]; if(f.delay>0){ f.delay-=dt; continue; } f.mesh.visible=true; f.t+=dt; const k=Math.min(1,f.t/f.dur); f.mesh.position.set(f.x,lerp(f.y0,f.y1,k),f.z);
    if(k>=1){ scene.remove(f.mesh); FALL.splice(i,1); fallImpact(f.x,f.z); } } }
function fallImpact(x,z){ const fl=baseFloor(x,z); const g=glow(0xf4ffb0,1.5,.8); g.position.set(x,fl+.25,z); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); }

// ---- aim a ground spot up to maxRange: whatever the reticle already has locked (84-aim.js's own pick()), or the
// same wall/floor-clipped ray the free crosshair projects when nothing's locked -- reused, not reimplemented, except
// duplicated in miniature here since aim.js keeps that walk private to its own drawAim() ----
function aimSpot(maxRange){
  const A=window.__aim;
  if(!A) return {x:hero.x+Math.sin(hero.yaw)*Math.min(maxRange,4), z:hero.z+Math.cos(hero.yaw)*Math.min(maxRange,4)};
  const yaw=A.yaw(), t=A.pick(yaw);
  if(t){ const d=Math.hypot(t.x-hero.x,t.z-hero.z); if(d<=maxRange) return {x:t.x,z:t.z}; }
  const d3=A.dir3(); const y0=hero.y+1.3; let s=1; for(;s<maxRange;s+=.5){ const px=hero.x+d3.fx*s, pz=hero.z+d3.fz*s; if(wallAt(px,pz)) break; if(d3.fy<-1e-4&&y0+d3.fy*s<=baseFloor(px,pz)+.1) break; }
  return {x:hero.x+d3.fx*s, z:hero.z+d3.fz*s};
}

// ---- flourish: purely cosmetic, safe to call on any page (the caster's own optimistic play, the host's real cast,
// or a guest rendering another player's specialFx) -- never touches enemies/defs/hp itself ----
function playFlourish(hid,p){
  const fl=baseFloor(p.x,p.z);
  if(hid==='knight'){ if(window.__whirl) window.__whirl.vortex(p.x,p.z); shockRing(p.x,fl,p.z,CLEAVE_R); const g=glow(0xcfd8ff,3.2,.85); g.position.set(p.x,fl+1,p.z); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); floatText(p.x,fl+2.4,p.z,'WHIRLWIND CLEAVE','#dfe8ff'); noise(.25,.15,500); beep(120,.3,'sawtooth',.09,-40); }
  else if(hid==='witch'){ spawnRain(p.x,p.z,0x8a5cff,6,'bolt'); shockRing(p.x,fl,p.z,STARFALL_R); floatText(p.x,fl+2.4,p.z,'STARFALL','#c9a8ff'); beep(880,.22,'sine',.07,-260); beep(660,.28,'triangle',.055,-180); }
  else if(hid==='fighter'){ shockRing(p.x,fl,p.z,HALO_RING_R); const g=glow(0xffd27a,2.6,.8); g.position.set(p.x,fl+1,p.z); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); floatText(p.x,fl+2.4,p.z,'HALO SURGE','#ffd27a'); beep(140,.4,'sawtooth',.1,60); noise(.3,.12,900); }
  else if(hid==='troll'){ spawnRain(p.x,p.z,0x8ef05a,5,'arrow'); floatText(p.x,fl+2.4,p.z,'VOLLEY','#bfe89a'); beep(300,.15,'square',.05,-140); }
}

// ---- the real effect: mutates the REAL enemies/defs/RING_FX/HALO_SURGE_T -- only ever correct to call on the page
// actually simulating the shared hall (host or solo). A guest never calls these directly; see doFire()/hostApplySpecial ----
function realCleave(p){ let n=0; for(const e of enemies){ if(e.dead) continue; const dx=e.x-p.x, dz=e.z-p.z, d=Math.hypot(dx,dz); if(d<CLEAVE_R+e.r){ const l=Math.max(d,.01); hurt(e,p.dmg,dx/l*CLEAVE_KB,dz/l*CLEAVE_KB); n++; } } if(n) SFX.hit(); }
function realStarfall(p){ let n=0; for(const e of enemies){ if(e.dead) continue; const d=Math.hypot(e.x-p.x,e.z-p.z); if(d<STARFALL_R+e.r*.5){ hurt(e,p.dmg,0,0); e.slowT=Math.max(e.slowT||0,STARFALL_SLOW); n++; } } if(n) SFX.hit(); }
function realHaloSurge(p){ RING_FX={x:p.x,z:p.z,r:0,R:HALO_RING_R,DUR:HALO_RING_DUR,t:0,dmg:p.dmg,hit:new Set()}; HALO_SURGE_T=HALO_SURGE_DUR; const n=NET(); if(n) n.send('toast','⚡ Halo Surge! Every halo tower pulses at double strength for a few seconds!'); }
function realVolley(p){ const per=Math.round(p.dmg/VOLLEY_WAVES*10)/10; for(let i=0;i<VOLLEY_WAVES;i++) VOLLEY_Q.push({x:p.x,z:p.z,dmg:per,at:S.t+i*(VOLLEY_DUR/VOLLEY_WAVES)}); }
function applyReal(hid,p){ if(hid==='knight') realCleave(p); else if(hid==='witch') realStarfall(p); else if(hid==='fighter') realHaloSurge(p); else if(hid==='troll') realVolley(p); }

// ---- co-op relay: window.__net's already-public surface, no changes needed to 99-network.js itself. 99-network.js
// (file 99) loads AFTER this one, so window.__net doesn't exist yet at THIS file's own top level -- wireNet() is
// called from inside the Meta.update tick below instead, whose first real tick only ever happens once the whole
// page's synchronous script (every module) has already run, by which point it always does ----
function clampNum(v,lo,hi){ v=+v; return Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):lo; }
function broadcastFx(hid,p,exceptId){ const n=NET(); if(!n||!n.peers) return; n.peers().forEach(id=>{ if(id!==exceptId) n.send('specialFx',{hero:hid,x:p.x,z:p.z},id); }); }
let netWired=false;
function wireNet(){ if(netWired) return; const n=NET(); if(!n||!n.onMessage) return; netWired=true;
  n.onMessage('specialCast',(data,fromId)=>{ if(n.role()!=='host'||!data||!SPEC_NAME[data.hero]) return;
    const p={x:clampNum(data.x,-1e4,1e4),z:clampNum(data.z,-1e4,1e4),dmg:clampNum(data.dmg,0,1e5)};
    applyReal(data.hero,p); playFlourish(data.hero,p); broadcastFx(data.hero,p,fromId); });
  n.onMessage('specialFx',(data)=>{ if(n.role()!=='guest'||!data||!SPEC_NAME[data.hero]) return; playFlourish(data.hero,{x:clampNum(data.x,-1e4,1e4),z:clampNum(data.z,-1e4,1e4)}); });
}

// ---- fire: called the instant a charge completes (or window.__specials.fire() forces one early, for probes/tests) ----
function doFire(){
  const hid=heroId();
  const spot=(hid==='witch')?aimSpot(STARFALL_MAXR):(hid==='troll')?aimSpot(VOLLEY_MAXR):{x:hero.x,z:hero.z};
  const dmg=Math.round(heroDmg()*(hid==='fighter'?2:3)*10)/10;
  const p={x:+spot.x.toFixed(2),z:+spot.z.toFixed(2),dmg};
  if(hid==='knight'&&window.__whirl) window.__whirl.spin();   // build 260 (99f-whirl.js): the Knight's own body spins three turns, on the caster's screen
  playFlourish(hid,p);   // always shown at once on the caster's own screen, win or lose the round trip
  const n=NET(), role=n?n.role():null;
  if(role==='guest') n.send('specialCast',{hero:hid,x:p.x,z:p.z,dmg:p.dmg});
  else { applyReal(hid,p); if(role==='host') broadcastFx(hid,p,null); }
}

// ---- the HUD: a small icon near the hotbar (desktop) and the ✦ touch button both carry the same cooldown ring, a
// conic-gradient mask whose --cd custom property is just the fraction of COOLDOWN still left, in degrees ----
const style=document.createElement('style');
// build 182 bugfix (found by the HUD probe, not a review): #specialIcon is an ID selector, so a border/box-shadow
// declared directly on it would always beat the .ready/.charging CLASS overrides below regardless of how many
// classes they stack (ID specificity beats any number of classes) -- the default look never changed state until
// this moved the neutral defaults onto .special-cd itself, the same specificity tier as the state classes
style.textContent='#specialIcon{position:absolute;left:14px;bottom:14px;width:40px;height:40px;border-radius:50%;background:#2a1c34ee;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px}'
 +'.touch #specialIcon{display:none}'
 +'.special-cd{position:relative;overflow:hidden;border:2px solid #6b5a3c;box-shadow:0 3px 0 #000}'
 +'.special-cd .cdmask{position:absolute;inset:-2px;border-radius:50%;background:conic-gradient(#00000094 var(--cd,0deg),transparent 0deg);pointer-events:none;transition:opacity .15s}'
 +'.special-cd.ready .cdmask{opacity:0}'
 +'.special-cd.charging{border-color:#7fe0ff;box-shadow:0 0 12px #7fe0ffcc,0 3px 0 #000}'
 +'.special-cd.ready:not(.charging){border-color:var(--gold);box-shadow:0 0 10px #e8b94a99,0 3px 0 #000}'
 +'#specialBar{position:absolute;left:50%;transform:translateX(-50%);width:min(340px,64vw);text-align:center;pointer-events:none;opacity:0;transition:opacity .15s;z-index:6}#specialBar.on{opacity:1}'
 +'#specialBar .sbn{font:700 13px/1 "Cinzel Decorative",Georgia,serif;letter-spacing:2px;color:var(--sbc,#ffe9a8);text-shadow:0 2px 0 #000,0 0 8px #000;margin-bottom:5px}'
 +'#specialBar .sbt{height:14px;border-radius:8px;background:#120c1acc;border:2px solid #000;box-shadow:0 0 0 2px var(--sbc,#ffe9a8),0 3px 0 2px #000;overflow:hidden}'
 +'#specialBar .sbf{height:100%;width:0;background:linear-gradient(90deg,var(--sbc,#ffe9a8),#fff);border-radius:6px}'
 +'#specialBar.charging .sbt{box-shadow:0 0 14px var(--sbc),0 0 0 2px var(--sbc),0 3px 0 2px #000}'
 +'#specialBar.cool .sbf{background:var(--sbc);opacity:.55}#specialBar.cool .sbn{opacity:.75}'
 +'#specialBar.fired .sbf,#specialBar.ready .sbf{background:#fff}#specialBar.ready .sbt,#specialBar.fired .sbt{box-shadow:0 0 16px var(--sbc),0 0 0 2px var(--sbc),0 3px 0 2px #000}';
document.head.appendChild(style);
function mkIcon(id,cls){ const el=document.createElement('div'); el.id=id; el.className=cls; el.innerHTML='<span>✦</span><i class="cdmask"></i>'; return el; }
const specialIconEl=mkIcon('specialIcon','special-cd'); $('hud').appendChild(specialIconEl);
// build 255 (Matt: "the secondary attacks need a charge up meter"): a bar just above the hotbar. While the button is held it fills over the charge, in the hero's special colour; the instant the special goes off it
// flashes white, then shows the cooldown filling back up (dimmer, with the seconds left), and when the special is ready again it says so for a moment and goes away. Nothing is shown while it is ready and unused.
// The little round \u2726 icon in the corner keeps its own cooldown ring. The bar sits on the hotbar's top edge wherever the hotbar is (phones lay it out differently).
const barEl=document.createElement('div'); barEl.id='specialBar'; barEl.innerHTML='<div class="sbn"></div><div class="sbt"><div class="sbf"></div></div>'; $('hud').appendChild(barEl);
const barN=barEl.querySelector('.sbn'), barF=barEl.querySelector('.sbf'); const METER={state:'',fill:0,label:'',flashT:0,readyT:0,prevCharging:false,prevCd:0};
const cssHex=h=>'#'+(h>>>0).toString(16).padStart(6,'0');
function updateMeter(dt){ const hid=heroId(), nm=(SPEC_NAME[hid]||'Special').toUpperCase(); let st='', fill=0, label=nm;
  if(SP.charging){ st='charging'; fill=Math.min(1,SP.t/CHARGE_TIME); }
  else { if(METER.prevCharging&&SP.cd>=COOLDOWN-.05) METER.flashT=.3;   // it just went off
    if(METER.prevCd>0&&SP.cd<=0) METER.readyT=1.3;
    if(METER.flashT>0){ METER.flashT-=dt; st='fired'; fill=1; }
    else if(SP.cd>0){ st='cool'; fill=1-SP.cd/COOLDOWN; label=nm+' \u00b7 '+Math.ceil(SP.cd)+'s'; }
    else if(METER.readyT>0){ METER.readyT-=dt; st='ready'; fill=1; label='\u2726 '+nm+' READY'; } }
  METER.prevCharging=SP.charging; METER.prevCd=SP.cd; METER.state=st; METER.fill=fill; METER.label=st?label:'';
  barEl.classList.toggle('on',!!st); if(!st) return;
  barEl.className=(st?'on ':'')+st; barEl.style.setProperty('--sbc',cssHex(CHARGE_COLOR[hid]||0xffe9a8)); barN.textContent=label; barF.style.width=(fill*100).toFixed(1)+'%';
  const hb=$('hotbar'), hr=hb.getBoundingClientRect(), pr=$('hud').getBoundingClientRect(); barEl.style.bottom=Math.max(96,Math.round(pr.bottom-hr.top+10))+'px'; }
let specialBtnEl=null;
if(TOUCH){ specialBtnEl=mkIcon('specialBtn','hb special-cd'); $('btns').appendChild(specialBtnEl); }
function updateHUD2(dt){
  updateMeter(dt||0);
  const ready=SP.cd<=0, deg=Math.max(0,Math.min(1,SP.cd/COOLDOWN))*360;
  [specialIconEl,specialBtnEl].forEach(el=>{ if(!el) return; el.style.setProperty('--cd',deg+'deg'); el.classList.toggle('ready',ready); el.classList.toggle('charging',SP.charging); });
  const nm=SPEC_NAME[heroId()]||'Special'; specialIconEl.title=nm+' — hold right-click ('+(ready?'ready':Math.ceil(SP.cd)+'s')+')';
}
// the ✦ touch button: press-and-hold like the ⚔ button's own ranged draw (84-aim.js), a dedicated document-level
// listener (not a per-element one, since this button is built here, not by game.js's own fixed six) so it isn't
// tangled with theirs
document.addEventListener('touchstart',e=>{ const b=e.target&&e.target.closest&&e.target.closest('.hb'); if(b!==specialBtnEl) return; e.preventDefault(); e.stopPropagation(); specialPress(); },{capture:true,passive:false});
const specTouchEnd=e=>{ for(const t of e.changedTouches){ const b=t.target&&t.target.closest&&t.target.closest('.hb'); if(b===specialBtnEl){ specialRelease(); return; } } };
document.addEventListener('touchend',specTouchEnd,{capture:true});
document.addEventListener('touchcancel',specTouchEnd,{capture:true});

// ---- the per-tick driver: cooldown, the charge itself (auto-fires at CHARGE_TIME), and every timed effect above ----
{ const prev=Meta.update;
  Meta.update=function(dt){ prev(dt);
    wireNet();
    if(SP.cd>0) SP.cd=Math.max(0,SP.cd-dt);
    if(SP.charging&&!canStart()){ SP.charging=false; SP.t=0; }   // dead, a menu opened, placing started, the run ended, etc -- mid-charge
    if(SP.charging){ SP.t+=dt; hero.specialSlow=.5; if(SP.t>=CHARGE_TIME){ SP.charging=false; SP.t=0; SP.cd=COOLDOWN; doFire(); } }
    else hero.specialSlow=1;
    if(window.__whirl){ if(SP.charging&&heroId()==='knight') window.__whirl.charge(SP.t/CHARGE_TIME); else window.__whirl.release(); }   // the Knight winds up while he charges
    tickChargeGlow(); tickRing(dt); if(HALO_SURGE_T>0) HALO_SURGE_T=Math.max(0,HALO_SURGE_T-dt); tickVolley(); tickFall(dt); tickGroundRing(); updateHUD2(dt);
  }; }

// ---- test/probe hook (SEE IT / specials-test.mjs): fire() force-completes a charge in progress, or fires cold if
// nothing's charging -- but still honours cooldown/canStart() either way, so the SAME entry point covers both "skip
// the 1.2s wait to look at the FX" and "prove a refusal actually refuses" ----
window.__specials={
  press:specialPress, release:specialRelease,
  charging:()=>SP.charging, chargeT:()=>SP.t, chargeTime:()=>CHARGE_TIME,
  cooldown:()=>SP.cd, cooldownMax:()=>COOLDOWN, ready:()=>SP.cd<=0,
  hero:heroId, name:()=>SPEC_NAME[heroId()],
  fire:()=>{ if(!SP.charging){ if(!canStart()||SP.cd>0) return false; SP.cd=COOLDOWN; doFire(); return true; } SP.charging=false; SP.t=0; SP.cd=COOLDOWN; doFire(); return true; },
  meter:()=>({on:barEl.classList.contains('on'),state:METER.state,fill:+METER.fill.toFixed(3),label:METER.label,color:barEl.style.getPropertyValue('--sbc')}), ring:()=>({on:GR.on,visible:grGroup.visible,x:+GR.x.toFixed(2),z:+GR.z.toFixed(2),R:GR.R,k:+GR.k.toFixed(3)}),
  haloSurgeT:()=>HALO_SURGE_T, ringFx:()=>RING_FX?Object.assign({},RING_FX,{hit:undefined}):null, volleyQ:()=>VOLLEY_Q.length,
  forceReady:()=>{ SP.charging=false; SP.t=0; SP.cd=0; },   // test-only: clears any charge/cooldown in progress (this is a per-PLAYER timer, not per-hero -- a probe/suite testing several heroes in turn on one page needs this between them)
};
})();
