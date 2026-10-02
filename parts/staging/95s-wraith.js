// ===== THE CRIMSON PHASE WRAITH (build 420). Matt's art (Pictures\dungeon art,\mobs\crimson Phase Wraith\animated\hi3d-phase-wraith-2k-pbr_2.glb, Bob's rig with one clip, Wraith_Hover_Flight; textures cut
// to 1024: parts/assets/wraith.glb) and his words: "when he enters the battlefield he flies around just above the mobs giving full health to several mobs that needed it, then he hides in the corner charging
// up, the next volley is a healing plus diving quick attack on any ballistas or trebuchets. he's a big damage doer, he has to be taken out by any means but a snare tower won't do it, best use is a sky
// wrecker to home in on him, and explosion in color like fireworks lighting up the night".
//  * TOUR: flies low over the horde (3.2 up), to the most hurt mobs one after another, and gives each FULL health (a crimson beam and a mend sigil) -- five of them, or nine seconds.
//  * HIDE: off to the corner of the map furthest from the Heartroot, high up; there he CHARGES for seven seconds (a crimson orb swelling round him).
//  * VOLLEY: a healing pulse (four more hurt mobs to full) and a quick DIVE onto a ballista or a trebuchet (any tower if there are none): 45% of its health in one blow (at least 60). Back to his corner, charge, again.
//  * The Snare Tower can't hold him (game.js: noSnare). The Sky Wrecker goes for him before anything else (96p-skywrecker.js). He dies in a burst of coloured fireworks.
//  * WHERE (my call): one a wave from wave 3 of THE FEAST HALL, THE DRAWBRIDGE and THE DEEP PRISON; in Survival every third wave from the twelfth. He arrives a third of the way into the wave.
// Test hook: window.__wraith.
(function(){
'use strict';
const K='wraith';
MOBS[K]={ hp:520, spd:0, dmg:0, cd:99, mana:30, detour:0, fly:3.2 };
MOBDIM[K]={ fit:2.9, h:2.6, r:.8, nat:{walk:1,run:1} };
const TOUR_T=9, TOUR_HEALS=5, CHARGE_T=7, VOLLEY_HEALS=4, DIVE_K=.45, DIVE_MIN=60, LOW=3.2, HIGH=6, SPD={ tour:6, hide:7, dive:16, back:9 };
const cnt={ spawned:0, heals:0, dives:0, towerHits:0, deaths:0, charges:0 };
const MAPS_ON=new Set(['feast','moat','prison']);
const wantsWave=w=>{ if(TUTORIAL) return false; if(window.__finalstand&&window.__finalstand.isFinal&&window.__finalstand.isFinal(w)) return false;   /* the Deep Prison's final stand keeps its own fixed 300 */ if(SURVIVAL) return w>=12&&w%3===0; return MAP&&MAPS_ON.has(MAP.id)&&(w-(MAP.wbase|0))>=3; };
// ---- his model, fetched once when a map he visits is reached (the same once-only guard as every loader: if it's in, or on its way, nothing more is asked)
let loadP=null;
function load(){ if(MOBGLB[K]) return Promise.resolve(); if(loadP) return loadP;
  loadP=fetchBytes(ASSET('wraith.glb')).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{ const root=g.scene||g.scenes[0]; const fit=fitModel(root,MOBDIM[K].fit); toonify(root,fit.scale);
    root.traverse(o=>{ if(o.isMesh&&o.material&&!o.userData.isOL){ const m=o.material; if(m.emissive){ if(m.map){ m.emissiveMap=m.map; m.emissive.setHex(0xb06060); } else m.emissive.setHex(0x601010); m.emissiveIntensity=1; m.needsUpdate=true; } } });   // a faint crimson glow of his own
    MOBGLB[K]={ wrap:fit.wrap, map:mapClips(g.animations||[]), scale:fit.scale }; }).catch(e=>console.warn('wraith model',e));
  return loadP; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(!TUTORIAL&&(SURVIVAL?S.wave>=10:(MAP&&MAPS_ON.has(MAP.id)&&(S.wave>=2)))) load(); }; }
// ---- one to a wave, a third of the way in
{ const prev=waveComp; waveComp=function(w){ const c=prev.apply(this,arguments); if(!c||!Array.isArray(c.q)||!c.q.length||!wantsWave(w)) return c;
    const ts=c.q.map(x=>+x.t||0), t0=Math.min(...ts), t1=Math.max(...ts), lanes=Object.keys(LANES); const lane=c.q[(c.q.length/3)|0].lane||lanes[0];
    const add=[{ t:+(t0+(t1-t0)/3).toFixed(2), kind:K, lane }]; if(!SURVIVAL&&MAP&&MAP.id==='prison'&&(w-(MAP.wbase|0))>=5){ const l2=c.q[(c.q.length*2/3)|0].lane||lane; add.push({ t:+(t0+(t1-t0)*2/3).toFixed(2), kind:K, lane:l2 }); }   /* build 425: two in the prison's fifth and sixth waves */
    const q=c.q.concat(add).sort((a,b)=>(+a.t||0)-(+b.t||0)); return Object.assign({},c,{ q }); }; }
// ---- the corner he hides in: the walkable floor furthest from the Heartroot -- but never in a spawn alcove (build 435, Matt: "if phase wraith is the last mob he can't hide too far in a corner in a spawn
// alcove"; the old pick was a corner of the box round all the floor, which on some maps sat right in a mob door). Floor within SPAWN_KEEP of a lane's door is out, and so is floor the mobs never walk to the Heartroot from.
const SPAWN_KEEP=10, LAST_R=9;
let corner=null, cornerMap=null, lastSpot=null;
const spawnPts=()=>Object.values(LANES||{}).filter(L=>L&&L.cx!==undefined).map(L=>({ x:cw(L.cx), z:cwz(L.cz) }));
function openFloor(){ const sp=spawnPts(), out=[]; for(let cz=0;cz<GH;cz++) for(let cx=0;cx<GW;cx++){ const i=idx(cx,cz); if(!walk(grid[i])||(typeof MOBBLOCK!=='undefined'&&MOBBLOCK[i])) continue;
    const x=cw(cx), z=cwz(cz); if(sp.some(p=>Math.hypot(p.x-x,p.z-z)<SPAWN_KEEP)) continue; if(flowFree&&flowFree.dist&&!(flowFree.dist[i]>=0)) continue; out.push({ x, z }); } return out; }
function hideSpot(){ if(corner&&cornerMap===MAP) return corner; cornerMap=MAP; lastSpot=null; const fl=openFloor(); let best=null, bd=-1; for(const p of fl){ const d=Math.hypot(p.x,p.z); if(d>bd){ bd=d; best=p; } }
  if(!best){ best={ x:0, z:-LAST_R }; } corner={ x:best.x*.92, z:best.z*.92 }; return corner; }
// THE LAST MOB: with nothing else alive and nothing left to come, he can't hold the wave up from a far corner -- he charges close in, over open floor LAST_R from the Heartroot (on his corner's side), low enough to hit
const isLast=e=>!(typeof spawnQ!=='undefined'&&spawnQ.length)&&!enemies.some(o=>!o.dead&&o!==e&&o.kind!==K);
function lastStandSpot(){ hideSpot(); if(lastSpot) return lastSpot; const c=corner, d=Math.hypot(c.x,c.z)||1, want={ x:c.x/d*LAST_R, z:c.z/d*LAST_R }; let best=null, bd=1e9;
  for(const p of openFloor()){ const dd=Math.hypot(p.x-want.x,p.z-want.z)+Math.abs(Math.hypot(p.x,p.z)-LAST_R); if(dd<bd){ bd=dd; best=p; } } lastSpot=best||want; return lastSpot; }
const spotFor=e=>isLast(e)?lastStandSpot():hideSpot();
const highFor=e=>isLast(e)?LOW+.8:HIGH;
// ---- looks: a crimson beam to whom he mends, a sigil over them, his charging orb, the death fireworks
function beam(a,b){ for(let i=1;i<7;i++){ const t=i/7; const g=glow(i%2?0xff3a4a:0xffb0b0,.5,.9); g.position.set(a.x+(b.x-a.x)*t,(a.y+1.4)+((b.y||0)+1-(a.y+1.4))*t,a.z+(b.z-a.z)*t); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); } }
function mend(w,e){ e.hp=e.max; cnt.heals++; beam(w,e); const s=glow(0xff4a5a,1.4,.95); s.position.set(e.x,(e.y||0)+(e.h||1.4)+.4,e.z); scene.add(s); projs.push({kind:'splat',t:0,mesh:s}); floatText(e.x,(e.y||0)+(e.h||1.4)+.6,e.z,'✚','#ff6a7a'); }
const hurtMobs=(w,n,near)=>enemies.filter(e=>!e.dead&&e!==w&&e.kind!==K&&e.hp<e.max*.9&&(!near||Math.hypot(e.x-w.x,e.z-w.z)<near)).sort((a,b)=>a.hp/a.max-b.hp/b.max).slice(0,n);
function fireworks(x,y,z){ const C=[0xff3a4a,0xffd24a,0x6af0ff,0xc77aff,0x8ef05a,0xff8a2a]; for(let k=0;k<6;k++){ const at={ x:x+(Math.random()-.5)*3, y:y+1+Math.random()*3, z:z+(Math.random()-.5)*3 };
    for(let i=0;i<16;i++){ const a=i/16*TAU, b=(Math.random()-.5)*1.4, col=C[(k+i)%C.length]; const s=glow(col,.6,.95); s.position.set(at.x,at.y,at.z); scene.add(s); fx.push({ s, vx:Math.cos(a)*Math.cos(b)*5, vy:Math.sin(b)*5+1, vz:Math.sin(a)*Math.cos(b)*5, t:-k*.12, life:1.1 }); }
    const core=glow(C[k],4,.9); core.position.set(at.x,at.y,at.z); scene.add(core); fx.push({ s:core, vx:0, vy:0, vz:0, t:-k*.12, life:.5, core:true }); }
  camShake=Math.max(camShake,.35); try{ SFX.thud&&SFX.thud(); SFX.hit&&SFX.hit(); }catch(e){} }
const fx=[];
// ---- spawn: set him up
{ const prev=spawnEnemy; spawnEnemy=function(kind){ const r=prev.apply(this,arguments); if(kind===K){ const e=enemies[enemies.length-1]; if(e&&e.kind===K&&!e.wst){ e.wst='tour'; e.wt=0; e.wheals=0; e.noSnare=true; e.atk=1e9; e.fly=LOW; e.y=baseFloor(e.x,e.z)+LOW; cnt.spawned++; } } return r; }; }
// ---- his mind, every frame (the core keeps him aloft at e.fly; he is never moved by its roads: spd 0)
function goTo(e,x,z,spd,dt){ const dx=x-e.x, dz=z-e.z, d=Math.hypot(dx,dz); if(d<.05) return 0; const s=Math.min(d,spd*dt); e.x+=dx/d*s; e.z+=dz/d*s; if(e.mdl&&e.mdl.g) e.mdl.g.rotation.y=Math.atan2(dx,dz); return d-s; }
{ const prev=updateEnemies; updateEnemies=function(dt){ prev(dt);
    for(const e of enemies){ if(e.dead||e.kind!==K||!e.wst) continue; e.atk=1e9; e.holdT=0; e.slowT=0; e.chillT=0; e.wt+=dt;
      if(e.orb){ e.orb.position.set(e.x,(e.y||0)+1.4,e.z); }
      if(e.wst==='tour'){ e.fly=LOW; const tg=e.wtg&&!e.wtg.dead&&e.wtg.hp<e.wtg.max?e.wtg:(e.wtg=hurtMobs(e,1)[0]||null);
        if(tg){ if(goTo(e,tg.x,tg.z,SPD.tour,dt)<2.5){ mend(e,tg); e.wheals++; e.wtg=null; } }
        else { const c=enemies.filter(o=>!o.dead&&o.kind!==K); if(c.length){ const mx=c.reduce((a,o)=>a+o.x,0)/c.length, mz=c.reduce((a,o)=>a+o.z,0)/c.length; goTo(e,mx,mz,SPD.tour*.6,dt); } }
        if(e.wheals>=TOUR_HEALS||e.wt>=TOUR_T){ e.wst='hide'; e.wt=0; } }
      else if(e.wst==='hide'||e.wst==='back'){ e.fly=highFor(e); const c=spotFor(e); if(goTo(e,c.x,c.z,e.wst==='hide'?SPD.hide:SPD.back,dt)<.3){ e.wst='charge'; e.wt=0; cnt.charges++; if(!e.orb){ e.orb=glow(0xff2a3a,1,.0); scene.add(e.orb); } } }
      else if(e.wst==='charge'){ e.fly=highFor(e); { const c=spotFor(e); if(Math.hypot(c.x-e.x,c.z-e.z)>.6){ e.wst='back'; continue; } }   /* left the last alive while charging far off: he comes in */ const k=Math.min(1,e.wt/CHARGE_T); if(e.orb){ e.orb.scale.setScalar(1+k*4); e.orb.material.opacity=.25+.55*k+.1*Math.sin(S.t*12); }
        if(e.wt>=CHARGE_T){ for(const m of hurtMobs(e,VOLLEY_HEALS)) mend(e,m);   // the healing half of the volley, from his corner
          const pool=defs.filter(d=>!d.dead&&(d.kind==='harpoon'||d.kind==='ball')), any=defs.filter(d=>!d.dead&&d.kind!=='perch'&&d.kind!=='trap'&&d.kind!=='pit');
          const list=pool.length?pool:any; let tg=null, bd=1e9; for(const d of list){ const dd=Math.hypot(d.x-e.x,d.z-e.z); if(dd<bd){ bd=dd; tg=d; } }
          if(e.orb){ e.orb.material.opacity=0; } if(tg){ e.wst='dive'; e.wdef=tg; e.wt=0; } else { e.wst='tour'; e.wt=0; e.wheals=0; } } }
      else if(e.wst==='dive'){ const d=e.wdef; if(!d||d.dead||!defs.includes(d)){ e.wst='back'; e.wt=0; continue; } e.fly=Math.max(1,(d.top||2)-(d.base||0)+.4);
        if(goTo(e,d.x,d.z,SPD.dive,dt)<1.2){ const dmg=Math.max(DIVE_MIN,Math.round((d.max||100)*DIVE_K)); const h0=d.hp; hurtDef(d,dmg); if(defs.includes(d)&&d.hp>0&&h0-d.hp<dmg) d.hp=Math.max(1,h0-dmg);   /* the full blow lands: a tower's own toughness does not soften his dive */ cnt.dives++; cnt.towerHits+=dmg;
          const g=glow(0xff2a3a,4.5,.95); g.position.set(d.x,(d.top||2)+.5,d.z); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); camShake=Math.max(camShake,.3); try{ SFX.hit&&SFX.hit(); }catch(er){}
          e.wst='back'; e.wt=0; } } }
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.t+=dt; if(f.t<0){ f.s.visible=false; continue; } f.s.visible=true; const k=f.t/f.life; if(k>=1){ scene.remove(f.s); f.s.material.dispose(); fx.splice(i,1); continue; }
      f.s.position.x+=f.vx*dt; f.s.position.y+=f.vy*dt-k*2*dt; f.s.position.z+=f.vz*dt; f.vx*=.96; f.vz*=.96; f.s.material.opacity=.95*(1-k); if(f.core) f.s.scale.setScalar(1+k*3); } }; }
// ---- his death: the orb goes, fireworks light up the night
{ const prev=kill; kill=function(e){ const was=e&&!e.dead&&e.kind===K; const r=prev.apply(this,arguments); if(was){ cnt.deaths++; if(e.orb){ scene.remove(e.orb); e.orb.material.dispose(); e.orb=null; } fireworks(e.x,(e.y||0)+1,e.z); } return r; }; }
window.__wraith={ kind:K, load, loaded:()=>!!MOBGLB[K], info:()=>Object.assign({ fx:fx.length },cnt), state:()=>enemies.filter(e=>!e.dead&&e.kind===K).map(e=>({ st:e.wst, x:+e.x.toFixed(1), z:+e.z.toFixed(1), y:+(e.y||0).toFixed(1), hp:e.hp })), hideSpot, lastStandSpot, isLast, spotFor, doorDist:p=>Math.min(...spawnPts().map(q=>Math.hypot(q.x-p.x,q.z-p.z))), wantsWave };
})();
