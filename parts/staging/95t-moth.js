// ===== THE SPECTRAL MOTH HORROR (build 422). Matt's art (Pictures\dungeon art,\mobs\spectral moth horror\animated\hi3d-spectral-moth-2k-pbr_2.glb, Bob's rig with one clip, Spectral_Moth_Hover_Flight; textures cut
// to 1024: parts/assets/moth.glb) and his words: "the spectral moth flies toward the heartroot and drops moth eggs that do damage".
//  * A FLYER: it takes the flyers' road to the Heartroot (the core's flowFly, like a drake, a little higher) and strikes it when it gets there. The Snare Tower can't hold it (build 428); the Sky Wrecker and the towers that
//    shoot flyers bring it down.
//  * EGGS: every EGG_CD (2.5 s) it lets one fall -- at once if it is over a tower and its last egg is a second old. The egg drops to the floor, lies there pulsing pale for HATCH (1.6 s), then BURSTS in a ring of
//    spectral dust: towers within BURST_R take EGG_TOWER (scaled with the moth's own damage), the hero EGG_HERO, the Heartroot EGG_CRYSTAL if it burst within 4 of it.
//  * WHERE (my call): from THE THRONE ROOM on, wave 2 and up -- one, two from wave 4, three from wave 6; in Survival every wave from the eighth (after the map's own seven), one to four.
// Test hook: window.__moth.
(function(){
'use strict';
const K='moth';
MOBS[K]={ hp:60, spd:2.2, dmg:6, cd:1.6, mana:6, detour:0, fly:3.8 };
MOBDIM[K]={ fit:2.3, h:1.8, r:.7, nat:{walk:1,run:1} };
const EGG_CD=2.5, OVER_CD=1, HATCH=1.6, BURST_R=2.6, EGG_TOWER=2.6, EGG_HERO=8, EGG_CRYSTAL=10;
const cnt={ spawned:0, eggs:0, bursts:0, towerHits:0, heroHits:0, crystalHits:0 };
const ON=new Set(['throne','court','feast','moat','prison']);
const howMany=w=>{ if(TUTORIAL) return 0; if(window.__finalstand&&window.__finalstand.isFinal&&window.__finalstand.isFinal(w)) return 0;
  if(SURVIVAL) return w>=8?Math.min(4,1+((w-8)/10|0)):0;   /* Survival: after the map's own waves, every wave, slowly more (a wave never shrinks) */ if(!MAP||!ON.has(MAP.id)) return 0; const mw=w-(MAP.wbase|0); if(MAP.id==='prison') return [0,0,3,4,4,5,6][mw]||0;   /* build 425 (Matt: "add moths and wraiths to map 6 ... come in on wave 2 or 3"): the prison's waves are ~200 strong -- one moth was lost in them */
  return mw<2?0:mw<4?1:mw<6?2:3; };
// ---- the model, fetched once (the once-only guard every loader keeps)
let loadP=null;
function load(){ if(MOBGLB[K]) return Promise.resolve(); if(loadP) return loadP;
  loadP=fetchBytes(ASSET('moth.glb')).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{ const root=g.scene||g.scenes[0]; const fit=fitModel(root,MOBDIM[K].fit); toonify(root,fit.scale);
    root.traverse(o=>{ if(o.isMesh&&o.material&&!o.userData.isOL){ const m=o.material; if(m.emissive&&m.map){ m.emissiveMap=m.map; m.emissive.setHex(0x7a8aa0); m.emissiveIntensity=1; m.needsUpdate=true; } } });   // spectral: its own wings glow a little
    MOBGLB[K]={ wrap:fit.wrap, map:mapClips(g.animations||[]), scale:fit.scale }; }).catch(e=>console.warn('moth model',e));
  return loadP; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(!TUTORIAL&&(SURVIVAL?S.wave>=4:(MAP&&ON.has(MAP.id)))) load(); }; }
// ---- into the waves, spread through each
{ const prev=waveComp; waveComp=function(w){ const c=prev.apply(this,arguments); const n=howMany(w); if(!n||!c||!Array.isArray(c.q)||!c.q.length) return c;
    const ts=c.q.map(x=>+x.t||0), t0=Math.min(...ts), t1=Math.max(...ts); const add=[]; for(let i=0;i<n;i++){ const src=c.q[((i+1)*c.q.length/(n+1))|0]; add.push({ t:+(t0+(t1-t0)*(i+1)/(n+1)).toFixed(2), kind:K, lane:src.lane }); }
    return Object.assign({},c,{ q:c.q.concat(add).sort((a,b)=>(+a.t||0)-(+b.t||0)) }); }; }
{ const prev=spawnEnemy; spawnEnemy=function(kind){ const r=prev.apply(this,arguments); if(kind===K){ const e=enemies[enemies.length-1]; if(e&&e.kind===K&&e.eggT===undefined){ e.eggT=EGG_CD*(.4+Math.random()*.4); e.sinceEgg=0; e.noSnare=true;   /* build 428 (Matt: "yes moth too"): the snare can't hold a moth either */ cnt.spawned++; } } return r; }; }
// ---- the eggs
const eggs=[];
let EGG_GEO=null, EGG_MAT=null;
function layEgg(e){ cnt.eggs++; if(!EGG_GEO){ EGG_GEO=new THREE.SphereGeometry(.28,10,8); EGG_MAT=new THREE.MeshBasicMaterial({ color:C(0xd8e6ff) }); }
  const g=new THREE.Group(); const shell=new THREE.Mesh(EGG_GEO,EGG_MAT); shell.scale.set(1,1.35,1); shell.userData.noOL=true; g.add(shell); const halo=glow(0x9fd0ff,1.1,.7); g.add(halo);
  g.position.set(e.x,(e.y||0)+.6,e.z); scene.add(g); eggs.push({ g, halo, x:e.x, z:e.z, y:(e.y||0)+.6, vy:0, landed:false, t:0, dmg:Math.max(4,Math.round(e.dmg*EGG_TOWER)) }); }
// build 462 (Matt: "get our moths and phase wraiths in there"): an egg lands on the Drawbridge yard's roof (56k9-moatdeck.js) rather than through it, and bursts on whichever Heartroot it falls by -- the castle's, the inn's or the keep's
const eggFloor=(x,z)=>{ const D=window.__moatdeck; const deck=D&&D.cell&&D.cell(wc(x),wcz(z))?D.Y:-1e9; return Math.max(baseFloor(x,z),deck); };
function burstEgg(q){ cnt.bursts++; const fl=eggFloor(q.x,q.z);
  for(let i=0;i<12;i++){ const a=i/12*TAU; const s=glow(i%2?0xc8dcff:0xffffff,.7,.85); s.position.set(q.x+Math.cos(a)*.4,fl+.4,q.z+Math.sin(a)*.4); scene.add(s); dust.push({ s, vx:Math.cos(a)*4, vz:Math.sin(a)*4, t:0 }); }
  const g=glow(0xb8d0ff,3.2,.9); g.position.set(q.x,fl+.6,q.z); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); try{ SFX.hit&&SFX.hit(); }catch(e){}
  for(const d of defs){ if(d.dead) continue; if(Math.hypot(d.x-q.x,d.z-q.z)<=BURST_R){ hurtDef(d,q.dmg); cnt.towerHits++; } }
  if(hero.dead<=0&&Math.hypot(hero.x-q.x,hero.z-q.z)<=BURST_R&&Math.abs((hero.y||0)-fl)<2){ hurtHero(EGG_HERO); cnt.heroHits++; }
  for(const h of (Meta.heroes&&Meta.heroes())||[]) if(!h.isDead()&&Math.hypot(h.x-q.x,h.z-q.z)<=BURST_R&&Math.abs((h.y||0)-fl)<2){ h.hurt(EGG_HERO); cnt.heroHits++; }   // co-op sweep 2026-10-02: a teammate standing on the burst takes it too, as the host's hero does
  if(Math.hypot(q.x,q.z)<=4){ hurtCrystal(EGG_CRYSTAL,null,1); cnt.crystalHits++; }
  else if(typeof GOAL3!=='undefined'&&GOAL3>=0&&Math.hypot(q.x-C3X,q.z-C3Z)<=4){ hurtCrystal(EGG_CRYSTAL,null,3); cnt.crystalHits++; }
  else if(GOAL2>=0&&Math.hypot(q.x-C2X,q.z-C2Z)<=4){ hurtCrystal(EGG_CRYSTAL,null,2); cnt.crystalHits++; } }
const dust=[];
// ---- every frame: each moth counts down to its next egg (sooner over a tower); eggs fall, pulse and burst
{ const prev=updateEnemies; updateEnemies=function(dt){ prev(dt); const guest=!!(window.__net&&window.__net.role&&window.__net.role()==='guest'); if(guest) return;
    for(const e of enemies){ if(e.dead||e.kind!==K||e.eggT===undefined) continue; e.eggT-=dt; e.sinceEgg+=dt;
      const over=e.sinceEgg>=OVER_CD&&defs.some(d=>!d.dead&&Math.hypot(d.x-e.x,d.z-e.z)<1.6);
      if(e.eggT<=0||over){ layEgg(e); e.eggT=EGG_CD; e.sinceEgg=0; } }
    for(let i=eggs.length-1;i>=0;i--){ const q=eggs[i]; const fl=eggFloor(q.x,q.z)+.3;
      if(!q.landed){ q.vy-=18*dt; q.y+=q.vy*dt; if(q.y<=fl){ q.y=fl; q.landed=true; } q.g.position.y=q.y; continue; }
      q.t+=dt; const k=q.t/HATCH; q.g.scale.setScalar(1+.18*Math.sin(q.t*14)*k); q.halo.material.opacity=.4+.5*k;
      if(q.t>=HATCH){ burstEgg(q); scene.remove(q.g); q.halo.material.dispose(); eggs.splice(i,1); } }
    for(let i=dust.length-1;i>=0;i--){ const p=dust[i]; p.t+=dt; p.s.position.x+=p.vx*dt; p.s.position.z+=p.vz*dt; p.s.position.y+=dt*.8; p.s.material.opacity=.85*(1-p.t/.7); if(p.t>=.7){ scene.remove(p.s); p.s.material.dispose(); dust.splice(i,1); } } }; }
window.__moth={ kind:K, load, loaded:()=>!!MOBGLB[K], info:()=>Object.assign({ live:eggs.length },cnt), howMany, eggs:()=>eggs.map(q=>({ x:+q.x.toFixed(1), z:+q.z.toFixed(1), landed:q.landed, t:+q.t.toFixed(2) })) };
})();
