// ===== THE CART TEAMS (build 359). Matt's two siege carts, animated by Bob (Hi3D) -- hi3d-blight-keg-sapper (clip Roll) and hi3d-rammed-iron-fire-cart (clips Roll, Fire, Ram), bones PushLeft/PushRight at the handles, a Muzzle
// bone on the fire cart's barrel -- each PUSHED BY TWO REAL ORCS ("real orcs"). A team is three mobs: the cart and two ordinary orcs that stand at its handles, walk with it and can be killed on their own. The cart goes at
// the orcs' pace times the share of its crew still alive (two orcs: full pace, one: half, none: it stops dead where it is and its wheels stop turning). When the cart dies or blows, the orcs that are left are let go and
// carry on as plain orcs. Matt, about where they come from: "these teams all come from that wave that's behind the wall" -- that wave is not built yet, so for now a team is spawned from the dev panel (F9 -> the mob list).
//   THE BLIGHT KEG CART: a bomb on wheels. Whatever it touches (a tower, the Heartroot, you) it blows up on, and so does it when it is shot to death: the blight blast and the lingering green cloud (95h-blight.js), the pushers
//   caught in it too. A stalled one (crew dead) just sits there ticking: shoot it from far off.
//   THE RAMMED IRON FIRE CART: spits a short jet of green fire (from its muzzle, 7 units) at towers and you, and rams anything right in front of it (its Ram clip, a blow half as hard again). Its barrel burns at rest.
// Models: prison-kegcart.glb and prison-firecart.glb (1024px textures, 1.2-1.3 MB each), loaded the first time a team is asked for, and ahead of time on THE DEEP PRISON. Test hook: window.__carts.
(function(){
'use strict';
const KINDS={
  kegcart:{ file:'prison-kegcart.glb', fit:2.7, cfg:{ hp:270, spd:2.6, dmg:18, cd:1.2, mana:10, detour:1, swingT:.5, hitT:.25, splash:2.6, siege:true } },
  firecart:{ file:'prison-firecart.glb', fit:3.0, cfg:{ hp:450, spd:2.6, dmg:18, cd:2.4, mana:12, ranged:17, detour:2, swingT:2.0, hitT:.65, siege:true } } };
// build 385 (Matt: "the siege machines ... need be more menacing, shoot from a distance or go faster"): BOTH -- the carts roll half again as fast (1.7 -> 2.6, the orcs at a run behind them) and shoot from much further off: the fire cart's jet reaches 17 (was 10), every 2.4 s, 18 a blow;
// the keg cart lobs its kegs from 20 (was 10) every 2.4 s (was 3.2), 18 a blow, a wider blast
// build 382 (Matt: "let those siege carts take shots at my defenses ... including the halos auras"): BOTH carts shoot defenses now, ANY defense -- the bramble hedge and the four aura rings too, which no other ranged mob will pick (a perch, which has nothing to hurt, is spared). The FIRE cart is a siege mob (cfg.siege, read by the core's ranged targeting, game.js): it stops within 10 units (was 7) of a defense and spits its green jet. The KEG cart keeps rolling on its way to blow itself up, and as it rolls LOBS a keg (the core's grenade arc, splash 2.3, 14 a blow) at the nearest defense within 10 units every 3.2 s while its pushers live (a stalled one, crew dead, still just sits there ticking).
// // build 373 (Matt: "give those siege carts extra life"): both carts have THREE times the health they had (the keg cart 90 -> 270, the fire cart 150 -> 450 before the wave scaling, and on THE DEEP PRISON the doubling of 95o-prisonmobs.js on top: a keg cart there is 540 base)
// (the wheels turn at .81 of the Roll clip's own speed at the cart's pace: nat.walk below)
const SIDE=.7;   // where the pushers stand: to either side of the cart's centre line (the handles), and behind its handle tips (the model's length is 2 units across its front, so the tips are one model-unit scaled back from the middle: MOBGLB[kind].back)
for(const k in KINDS){ MOBDIM[k]={ fit:KINDS[k].fit, h:KINDS[k].fit, r:1.2, nat:{ walk:KINDS[k].cfg.spd/KINDS[k].fit/.81, run:2.4 } }; MOBS[k]=KINDS[k].cfg; if(Meta.XP) Meta.XP[k]=Meta.XP[k]||12; }
const LOB_R=20, LOB_CD=2.4; const cnt={ teams:0, blasts:0, flames:0, rams:0, lobs:0 }; const fx=[]; const P={};
const isGuest=()=>!!(window.__net&&window.__net.role&&window.__net.role()==='guest');
function load(kind){ const K=KINDS[kind]; if(!K) return Promise.resolve(); if(MOBGLB[kind]) return Promise.resolve(); if(P[kind]) return P[kind];
  P[kind]=fetchBytes(ASSET(K.file)).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{
      const root=g.scene||g.scenes[0]; const fit=fitModel(root,K.fit); toonify(root,fit.scale);
      // a soft glow of its own paint (as the wolves), so the dark iron and wood read in the gloom; the cart's front is +x in the model: turned to face +z, which is forward for a mob
      root.traverse(o=>{ if(o.isMesh&&!o.userData.isOL&&o.material&&o.material.map&&o.material.emissive){ o.material.emissiveMap=o.material.map; o.material.emissive.setRGB(.5,.5,.5); o.material.needsUpdate=true; } });
      fit.wrap.rotation.y=-PI/2; const A=n=>(g.animations||[]).find(c=>c.name===n); const map={ walk:A('Roll') }; if(kind==='firecart') map.attack=A('Fire');
      MOBGLB[kind]={ wrap:fit.wrap, map, scale:fit.scale, back:fit.scale*1.0+.7, ramClip:A('Ram') }; })
    .catch(e=>{ console.warn('cart model '+kind,e); P[kind]=null; });
  return P[kind]; }
if(MAP&&MAP.id==='prison') setTimeout(()=>{ Object.keys(KINDS).forEach(load); },2500);
// ---- a team: the cart and its two orcs, spawned together at the gate
{ const prev=spawnEnemy; spawnEnemy=function(kind,lane){
    if(KINDS[kind]&&!MOBGLB[kind]){ load(kind).then(()=>{ if(MOBGLB[kind]) spawnEnemy(kind,lane); }); return; }
    const r=prev.apply(this,arguments);
    if(KINDS[kind]){ const cart=enemies[enemies.length-1]; if(cart&&cart.kind===kind){ cart.spd0=cart.spd; cart.crew=[]; cnt.teams++;
        for(let i=0;i<2;i++){ prev.call(this,'orc',lane); const o=enemies[enemies.length-1]; o.pushFor=cart; o.pushSide=i?1:-1; o.spd0=o.spd; o.spd=0; cart.crew.push(o); } } }
    return r; }; }
// ---- per frame: the wheels turn only while it rolls; the orcs keep their places at the handles; the cart's pace follows its crew
{ const prev=updateEnemies; updateEnemies=function(dt){
    for(const e of enemies){ if(e.dead||!KINDS[e.kind]||!e.mdl||!e.mdl.mixer) continue; e.mdl.mixer.timeScale=(e.walking&&mobSpd(e)>.05)?1:0; }
    prev(dt);
    // build 382: the keg cart's lobs
    if(!isGuest()) for(const c of enemies){ if(c.dead||c.kind!=='kegcart'||!(c.spd>.01)) continue; c.lobT=(c.lobT===undefined?1.2:c.lobT)-dt; if(c.lobT>0) continue; let best=null, bd=LOB_R; for(const d of defs){ if(d.kind==='perch'||BARRICADE_K[d.kind]) continue; const dd=Math.hypot(d.x-c.x,d.z-c.z); if(dd<bd&&los(c.x,c.z,d.x,d.z)){ bd=dd; best=d; } } if(best){ c.lobT=LOB_CD; const n0=projs.length; fireArrow(c,best.x,1.0,best.z,{kind:'none'}); const p=projs[projs.length-1]; if(projs.length>n0&&p){ p.dmg=0; p.splash=0; lobs.push({ p, d:best, c }); } cnt.lobs++; } else c.lobT=.4; }   /* the keg flies as before; where it lands is ours (below): a quarter of the tower's health */
    for(let i=lobs.length-1;i>=0;i--){ const L=lobs[i]; if(projs.includes(L.p)) continue; lobs.splice(i,1); try{ grenadeBurst(L.p.x1,L.p.y1,L.p.z1); }catch(er){} if(defs.includes(L.d)&&Math.hypot(L.d.x-L.p.x1,L.d.z-L.p.z1)<2.6) siegeHit(L.c,{ kind:'def', obj:L.d }); }
    // build 366 (Matt: "the two siege machines turn perpendicular to the line. they need to stay straight"): the core turns a mob toward the middle of the next cell, fine for a goblin, but it swings a long cart sideways whenever the crowd
    // shoves it off the line of the path or it straddles the line between two rows (one row's path says south, the next one's west). A walking cart is turned instead to the way it is ACTUALLY MOVING, averaged over a second so the steps and
    // shoves blend into one straight line, and slowly; it holds its facing while jammed (hardly moving); stopped or swinging it still faces what it fights
    for(const c of enemies){ if(c.dead||!KINDS[c.kind]||!c.mdl) continue; if(c.hvx===undefined){ c.hvx=Math.sin(c.yaw); c.hvz=Math.cos(c.yaw); c.hy=c.yaw; c.px=c.x; c.pz=c.z; }
      const vx=(c.x-c.px)/Math.max(dt,1e-4), vz=(c.z-c.pz)/Math.max(dt,1e-4), vl=Math.hypot(vx,vz), cap=vl>3.2?3.2/vl:1; c.px=c.x; c.pz=c.z;
      if(!c.walking||c.swing>=0){ c.hy=c.yaw; continue; } const k=Math.min(1,dt/.9); c.hvx+=(vx*cap-c.hvx)*k; c.hvz+=(vz*cap-c.hvz)*k;
      if(Math.hypot(c.hvx,c.hvz)>.45) c.hy=angLerp(c.hy,Math.atan2(c.hvx,c.hvz),1-Math.exp(-5*dt)); c.yaw=c.hy; c.mdl.g.rotation.y=c.yaw; }   /* its own heading (hy) is the cart's facing: the core's turn toward the next cell's middle, made every frame before this, is overwritten */
    for(const c of enemies){ if(!c.crew||c.crewDone) continue;
      if(c.dead){ for(const o of c.crew){ if(!o.dead){ o.spd=o.spd0; o.pushFor=null; } } c.crewDone=true; continue; }
      const alive=c.crew.filter(o=>!o.dead); c.spd=c.spd0*(alive.length/2);
      const fx_=Math.sin(c.yaw), fz_=Math.cos(c.yaw), rx=fz_, rz=-fx_, BACK=(MOBGLB[c.kind]&&MOBGLB[c.kind].back)||3;
      for(const o of alive){ o.x=c.x-fx_*BACK+rx*o.pushSide*SIDE; o.z=c.z-fz_*BACK+rz*o.pushSide*SIDE; o.yaw=c.yaw; o.y=baseFloor(o.x,o.z); const g=o.mdl.g; g.position.set(o.x,o.y+(o.lift||0),o.z); g.rotation.y=o.yaw; } } }; }
// ---- the fire cart: flame at range, the Ram clip when it is right up against what it hits
{ const prev=attack; attack=function(e,tg){ if(e&&e.kind==='firecart'&&e.mdl&&e.mdl.actions){ const A=e.mdl.actions, T=MOBGLB.firecart; if(!A.fire) A.fire=A.attack; const d=Math.hypot((tg.x||0)-e.x,(tg.z||0)-e.z); const ram=d<3.6&&T&&T.ramClip;
      if(ram){ if(!A.ram){ A.ram=e.mdl.mixer.clipAction(T.ramClip); A.ram.setLoop(THREE.LoopOnce,1); A.ram.clampWhenFinished=true; } A.attack=A.ram; } else A.attack=A.fire; e.ramming=!!ram; }
    return prev.apply(this,arguments); }; }
function jet(e,tx,tz){ const g=e.mdl&&e.mdl.g; let p=new THREE.Vector3(e.x,(e.y||0)+2.4,e.z); try{ const mz=g&&g.getObjectByName('Muzzle'); if(mz){ g.updateMatrixWorld(true); mz.getWorldPosition(p); } }catch(er){}
  const ty=(typeof floorH==='function'?floorH(tx,tz):0)+1.1; cnt.flames++;
  for(let i=0;i<14;i++){ const s=glow(i%3?0xb8ff5a:0x5aff7a,1.6,.001); s.userData.cartfx=1; scene.add(s); fx.push({ o:s, t:-i*.022, life:.42, x0:p.x, y0:p.y, z0:p.z, x1:tx+R(-.5,.5), y1:ty+R(-.3,.4), z1:tz+R(-.5,.5), w:R(-.4,.4) }); } }
// build 392 (Matt: "the siege machines made it all the way up, they are a bit anemic, let's let them do 1/4 damage of whatever it hits existing health"): every blow a cart lands -- the fire cart's jet, the keg cart's lobbed keg, the keg going off on what it touches -- takes a QUARTER of
// what its target has left: a tower (the aura rings too; never less than SIEGE_MIN, so a battered one does go down), the Heartroot, the hero (his armour still softens it). A teammate's hero takes a quarter of his own health too (co-op sweep 2026-10-02: the host tracks it, Meta.heroes hpNow; an older entry with no hpNow takes the cart's own blow)
const SIEGE_K=.25, SIEGE_MIN=4; const lobs=[];
function siegeHit(e,tg){ if(isGuest()||!tg) return; cnt.siegeHits=(cnt.siegeHits||0)+1;
  if(tg.kind==='def'){ const d=tg.obj; if(!d||!defs.includes(d)||d.kind==='perch'||BARRICADE_K[d.kind]||d.kind==='trap') return; const dmg=Math.round(Math.max(SIEGE_MIN,d.hp*SIEGE_K)*10)/10; d.hp-=dmg; d.shake=.25; d.calm=0; floatText(d.x,(d.top||1)+.6,d.z,'-'+Math.round(dmg),'#ff6a5a'); if(d.hp<=0){ removeDef(d); try{ SFX.destroy(); }catch(er){} toast(DEFS[d.kind].name+' destroyed!'); } }
  else if(tg.kind==='hero'){ if(tg.hero&&tg.hero.hurt===hurtHero){ if(hero.dead<=0) hurtHero(Math.max(1,hero.hp*SIEGE_K)); } else if(tg.hero&&!(tg.hero.isDead&&tg.hero.isDead())) tg.hero.hurt(typeof tg.hero.hpNow==='function'?Math.max(1,tg.hero.hpNow()*SIEGE_K):e.dmg); }
  else if(tg.kind==='crystal'){ const cur=tg.which===2?(S.crystal2||0):S.crystal; hurtCrystal(Math.max(1,cur*SIEGE_K),e,tg.which); } }
function flame(e,tg){ jet(e,tg.x||e.x,tg.z||e.z); const k=e.ramming?1.5:1; if(isGuest()) return;
  if(tg.kind==='def'||tg.kind==='crystal') siegeHit(e,tg);
  else if(tg.kind==='hero'){ const H=tg.hero&&tg.hero.hurt===hurtHero?hero:tg.hero; if(H&&!(tg.hero.isDead&&tg.hero.isDead())&&Math.hypot(H.x-e.x,H.z-e.z)<=(tg.reach||e.ranged)+1.5) siegeHit(e,tg); }
  else if(tg.kind==='mob'){ const o=tg.obj; if(o&&!o.dead) hurt(o,Math.round(e.dmg*3),0,0); } if(e.ramming) cnt.rams++; }
// ---- the keg cart goes off on whatever it touches
function detonate(e){ if(e.boom) return; e.boom=true; cnt.blasts++; try{ if(window.__blight) window.__blight.explode(e.x,e.z,{ crystalDmg:45 }); }catch(er){ console.warn('keg blast',er); } e.hp=0; if(!e.dead) kill(e); }
{ const prev=landHit; landHit=function(e,tg){ if(e&&e.kind==='kegcart'){ if(!isGuest()){ siegeHit(e,tg); detonate(e); } return; } if(e&&e.kind==='firecart'){ flame(e,tg); return; } return prev.apply(this,arguments); }; }
// shot to death, a keg cart still goes up; a fire cart only flares
{ const prev=kill; kill=function(e){ const was=e&&!e.dead; const r=prev.apply(this,arguments);
    if(was&&e.dead&&e.kind==='kegcart'&&!e.boom&&!isGuest()){ e.boom=true; cnt.blasts++; try{ if(window.__blight) window.__blight.explode(e.x,e.z,{ crystalDmg:45 }); }catch(er){ console.warn('keg blast',er); } }
    else if(was&&e.dead&&e.kind==='firecart'){ try{ if(window.__blight) window.__blight.explode(e.x,e.z,{ noDamage:true, noCloud:true, scale:.55, shell:true, quiet:true }); }catch(er){} }
    return r; }; }
WORLDANIM.push(dt=>{ for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.t+=dt; if(f.t<0){ f.o.visible=false; continue; } f.o.visible=true; const k=Math.min(1,f.t/f.life); const e2=1-Math.pow(1-k,2);
    f.o.position.set(f.x0+(f.x1-f.x0)*e2+f.w*Math.sin(k*3),f.y0+(f.y1-f.y0)*e2,f.z0+(f.z1-f.z0)*e2); f.o.scale.setScalar(1.4+k*2.6); f.o.material.opacity=.85*(1-k*k);
    if(k>=1){ if(f.o.parent) f.o.parent.remove(f.o); f.o.material.dispose(); fx.splice(i,1); } } });
window.__carts={ siegeHit:(e,tg)=>siegeHit(e,tg), SIEGE_K, pathFrom:(x,z)=>{ const ci=idx(wc(x),wcz(z)), n=flowDef.nxt[ci]; return n<0?null:[(cw(n%GW)-cw(ci%GW))/2,(cwz((n/GW)|0)-cwz((ci/GW)|0))/2]; }, kinds:Object.keys(KINDS), load, loaded:k=>!!MOBGLB[k], info:()=>Object.assign({ fx:fx.length },cnt), back:k=>MOBGLB[k]&&MOBGLB[k].back, SIDE };
})();
