// ===== THE SKY WRECKER (build 419). Matt: "this new tower is for air" (Bob's four animated firework rigs: Pictures\dungeon art,\defenses\Missles\animated\hi3d-firework-rig-t1..t4-2k-pbr_2.glb -- a launch frame of
// rockets that grows with each tier, one 6 s "Scene" clip of rockets firing and bursting; textures cut to 1024, parts/assets/sky-1..4.glb) and "add sky wrecker to the archerer" -- the Gnome Ranger's fifth key.
// ANTI-AIR ONLY: it never looks at a walker. Whatever flies within its long reach (22, the furthest of any tower) -- drakes first, the one furthest along toward the Heartroot first -- gets a volley of firework
// rockets: Mark I one, Mark II two, Mark III three, Mark IV and up four (one per launch tube the model grows). Each rocket climbs in an arc, trailing sparks, and BURSTS where its flyer is: everything flying
// within the burst (2.6) is hit, the rocket's own target in full and the rest at half. Its model plays Bob's animation all the time. Damage, reload and reach climb with the marks like every tower's (stat()).
// Test hook: window.__skywrecker.
(function(){
'use strict';
if(TUTORIAL) return;
const K='sky';
DEFS[K]={ name:'Sky Wrecker', ic:'🎆', du:3, mana:70, hp:140, top:6, range:22, rangeUp:.8, arc:360, cd:2.6, dmg:26 };
DEF_H[K]=7.2;   /* build 420 (Matt: "the sky wrecker is tiny"): twice the size -- Bob's rig counts its burst sparks, high above the rack, in its height */
DEFKEYS.push(K); DEFKEY_LABELS.push('5');
{ const cfg=DEFS[K]; const s=document.createElement('div'); s.className='slot'; s.id='slot-'+K; s.innerHTML='<div class="k">5</div><div class="ic">'+cfg.ic+'</div><div class="n">'+cfg.name+'</div><div class="cst">🌱 '+cfg.du+' · '+cfg.mana+' ◆</div>';
  s.addEventListener('click',()=>select(K)); $('hotbar').appendChild(s); }
{ const r=HEROES.find(h=>h.id==='troll'); if(r&&!r.unlocks.includes(K)) r.unlocks.push(K); }
defMarks(K,'sky');
// until Bob's model lands: a plain rack of three tubes on a frame
{ const prevMake=makeDef; makeDef=function(kind,ghost,lvl){ if(kind!==K||defTemplate(K,lvl)) return prevMake.apply(this,arguments);
    const g=new THREE.Group(), wood=mat(0x6b4a2a), tube=mat(0xc04030), dark=mat(0x2b2540); g.add(M(G.box(1.6,.3,1.4),dark,0,.15,0)); g.add(M(G.box(.2,1.2,.2),wood,-.5,.9,0)); g.add(M(G.box(.2,1.2,.2),wood,.5,.9,0));
    for(const x of [-.35,0,.35]){ const t=M(G.cyl(.12,.12,1.4,8),tube,x,1.6,.1); t.rotation.x=-.5; g.add(t); }
    if(ghost){ g.traverse(m=>{ if(m.isMesh) m.material=GHOST_OK; }); } else { outline(g); g.add(blob(.9)); } return g; }; }
const cnt={ volleys:0, rockets:0, bursts:0, hits:0, mixers:0 };
const BURST_R=2.6, SPLASH_K=.5, WRAITH_K=1.5;   /* build 436 (Matt: "we need to soften that up just a little bit" -- one Sky Wrecker took 40 s at Mark III, 23 s at Mark IV, to bring down a Feast Hall phase wraith): its rockets hit the wraith half again as hard; he stays as tough against every other tower */
const tier=d=>Math.min(4,d.lvl||1);
// ---- whom it shoots: flyers only, in reach and in sight; drakes first, then the one furthest along
function candidates(d){ const rr=stat(d,'range'), out=[]; for(const e of enemies){ if(e.dead||!e.fly) continue; const dd=Math.hypot(e.x-d.x,e.z-d.z); if(dd>rr+(e.r||.5)*.5) continue;
    const prog=flowFly.dist[idx(wc(e.x),wcz(e.z))]; out.push({ e, key:(e.kind==='wraith'?-2e5:e.kind==='drake'?-1e5:0)+(prog>=0?prog:1e6+dd) }); }
  out.sort((a,b)=>a.key-b.key); return out.map(o=>o.e); }
// ---- a rocket: a bright head and a spark trail on an arc from the rack to its flyer (it follows the flyer as it flies), then a burst
const rockets=[], bursts=[];
const COLS=[0xff5a3a,0xffd24a,0x6af0ff,0xc77aff,0x8ef05a];
function launch(d,e,dmg,i,n){ const top=(d.base||0)+DEF_H[K]*.8*(d.mdl&&d.mdl.scale?d.mdl.scale.y:1); const side=(i-(n-1)/2)*.45;
  const head=glow(0xfff2c0,.9,.95); scene.add(head); const col=COLS[(cnt.rockets+i)%COLS.length];
  rockets.push({ src:d, e, dmg, col, head, trail:[], t:-i*.12, dur:.75+Math.hypot(e.x-d.x,e.z-d.z)/30, x0:d.x+side, y0:top, z0:d.z, lift:4+Math.random()*2 }); cnt.rockets++; }
function burst(x,y,z,col){ cnt.bursts++; const g=new THREE.Group(); g.position.set(x,y,z); const sparks=[]; for(let i=0;i<14;i++){ const s=glow(i%3?col:0xffffff,.55,.95); const a=i/14*TAU, b=(Math.random()-.5)*1.6; sparks.push({ s, vx:Math.cos(a)*Math.cos(b), vy:Math.sin(b), vz:Math.sin(a)*Math.cos(b) }); g.add(s); }
  const core=glow(col,3.4,.9); g.add(core); scene.add(g); bursts.push({ g, sparks, core, t:0, life:.7 }); try{ SFX.hit&&SFX.hit(); }catch(er){} }
function volley(d){ const list=candidates(d); if(!list.length) return false; const n=tier(d)+(window.__talents&&window.__talents.skyBonus?window.__talents.skyBonus(d):0), dmg=stat(d,'dmg');   /* build 448: the Ranger's Skyfall */ cnt.volleys++; d.recoil=1;
  for(let i=0;i<n;i++) launch(d,list[i%list.length],dmg,i,n); try{ SFX.shoot?SFX.shoot():SFX.place&&SFX.place(); }catch(er){}
  try{ const t=[]; for(let i=0;i<n;i++){ const e=list[i%list.length]; t.push(e.__coopId||0); } Meta.onDefFx(d,'sky',{t}); }catch(er){} return true; }   // co-op sweep 2026-10-02: the volley's targets, for a guest's screen (99-network sends Meta.onDefFx as 'fx'; __defFxGuest below)
// ---- every frame: each Sky Wrecker fires on its reload (the core counts d.cd down); the rockets fly and burst; Bob's animation plays
{ const prev=updateDefs; updateDefs=function(dt){ prev.apply(this,arguments); for(const d of defs){ if(d.kind!==K||d.dead) continue; if(d.cd<=0&&volley(d)) d.cd=stat(d,'cd'); } }; }
function anim(d,dt){ const T=d.mdl.userData.tpl; if(T&&T.clips&&T.clips.length&&d.__mixMdl!==d.mdl){ d.__mixMdl=d.mdl; d.__mix=new THREE.AnimationMixer(d.mdl); const a=d.__mix.clipAction(T.clips[0]); a.play(); a.time=Math.random()*T.clips[0].duration; cnt.mixers++; } if(d.__mix) d.__mix.update(dt); }
// co-op sweep 2026-10-02: on a guest the towers are the host's puppets (99-network DEFPUP) -- they play Bob's loop too, and fly the host's volley at the mob puppets (no damage here: the burst hurts only this page's `enemies`, empty on a guest)
window.__defFxGuest=window.__defFxGuest||{}; window.__defFxGuest[K]={ tick:(p,dt)=>{ if(p.mdl) anim(p,dt); }, fx:(p,fx,arg,mob)=>{ if(fx!=='sky'||!arg||!Array.isArray(arg.t)) return; const t=arg.t.slice(0,12), n=t.length, pd={ x:p.x, z:p.z, base:p.y||0, mdl:p.mdl, lvl:p.lvl }; cnt.volleys++;
    t.forEach((id,i)=>{ const e=id&&mob(id); if(e) launch(pd,e,0,i,n); }); try{ SFX.shoot?SFX.shoot():SFX.place&&SFX.place(); }catch(er){} } };
WORLDANIM.push(dt=>{
  for(const d of defs){ if(d.kind!==K||!d.mdl) continue; anim(d,dt); }
  for(let i=rockets.length-1;i>=0;i--){ const r=rockets[i]; r.t+=dt; if(r.t<0){ r.head.visible=false; continue; } r.head.visible=true; const e=r.e, k=Math.min(1,r.t/r.dur);
    const live=e&&!e.dead, tx=live?e.x:(r.tx!==undefined?r.tx:r.x0), tz=live?e.z:(r.tz!==undefined?r.tz:r.z0), ty=live?(e.y||0)+(e.h||1.4)*.6:(r.ty!==undefined?r.ty:r.y0); r.tx=tx; r.tz=tz; r.ty=ty;
    const x=r.x0+(tx-r.x0)*k, z=r.z0+(tz-r.z0)*k, y=r.y0+(ty-r.y0)*k+Math.sin(k*PI)*r.lift; r.head.position.set(x,y,z);
    if(Math.random()<.8){ const s=glow(r.col,.35,.8); s.position.set(x,y,z); scene.add(s); r.trail.push({ s, t:0 }); }
    for(let j=r.trail.length-1;j>=0;j--){ const p=r.trail[j]; p.t+=dt; p.s.material.opacity=.8*(1-p.t/.45); p.s.position.y-=dt*.6; if(p.t>=.45){ scene.remove(p.s); p.s.material.dispose(); r.trail.splice(j,1); } }
    if(k>=1){ burst(x,y,z,r.col); for(const o of enemies){ if(o.dead||!o.fly) continue; const dd=Math.hypot(o.x-x,o.z-z); if(dd>BURST_R+(o.r||.5)*.5) continue; { const k=o.kind==='wraith'?WRAITH_K:1; DMGSRC=r.src||null; hurt(o,Math.round((o===e?r.dmg:r.dmg*SPLASH_K)*k*10)/10,0,0); DMGSRC=null; }   /* build 463: kills counted */ cnt.hits++; }
      scene.remove(r.head); r.head.material.dispose(); for(const p of r.trail){ scene.remove(p.s); p.s.material.dispose(); } rockets.splice(i,1); } }
  for(let i=bursts.length-1;i>=0;i--){ const b=bursts[i]; b.t+=dt; const k=b.t/b.life; if(k>=1){ scene.remove(b.g); b.g.traverse(o=>{ if(o.material) o.material.dispose(); }); bursts.splice(i,1); continue; }
    for(const s of b.sparks){ s.s.position.set(s.vx*BURST_R*Math.min(1,k*1.6),s.vy*BURST_R*Math.min(1,k*1.6)-k*k*1.2,s.vz*BURST_R*Math.min(1,k*1.6)); s.s.material.opacity=.95*(1-k); } b.core.material.opacity=.9*(1-k*1.6); } });
window.__skywrecker={ kind:K, WRAITH_K, info:()=>Object.assign({ live:rockets.length, bursting:bursts.length },cnt), candidates:d=>candidates(d).length, volley };
})();
