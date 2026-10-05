// ===== THE STONE TORTOISE (build 539): the tank pet. Matt's Meshy tortoise (fam-tortoise.glb, rigged, "Slow Crawl" loop). Every other pet flies at your shoulder; this one WALKS
// on the ground at your side (its crawl speeds up while it moves and nearly stops while it stands), and every 7 s it TAUNTS: a crystal flash and an amber rune ring roll out across
// the floor, and every mob inside 4.5 (not a boss) stops dead for 2.2 s, turned toward the tortoise, an amber mark over its head -- no walking, no swinging, no shooting (the same
// pause an ogre's roar uses: e.shoutT). Its own hit is a slow SHELL SLAM: it lunges, and the stone under its target bursts up (pet damage x1.6, a half-second stagger on a non-boss;
// extra pet projectiles slam that many mobs beside it). It is the Feast Hall's wave-7 reward (build 540, below). Works as a 2nd pet, with the
// Beast Mode / Malamute ring looks, and on a partner's screen (98-party.js walks it beside their puppet). On a co-op guest the taunt rides up as a slow (famHurt can't pause a host mob).
// Test hook: window.__tortoise.
(function(){
const T={h:.95,side:1.25,back:.35,tauntR:4.5,tauntEvery:7,hold:2.2,slam:1.6,stagger:.5,col:0xff8a10,crystal:0x2fc4ff,taunts:0,held:0,slams:0,rewards:0};
const KIND='Stone Tortoise';
const BOSS=new Set(['cyclops','pigflail','pigdagger','pigsling','trollboss','archhag','avery','bullion','corruptor']);
function isT(){ return !!(fam&&fam.g&&fam.g.userData.kind===KIND&&!fam.g.userData.named); }
function dmgOf(m){ return Math.max(.1,Math.round(famDmg()*m*10)/10); }
function guest(){ return !!(window.__net&&window.__net.role&&window.__net.role()==='guest'); }
// ---- where it comes from (Matt, build 540: "I think he is the wave 7 reward in the dinning hall"): beat the Feast Hall's wave 7 -- Sir Bullion's wave -- and the reward that drops by the
// Heartroot is always a Stone Tortoise, Rare or better. It no longer turns up in the random drops (build 539 had half the Crystal Owls roll as one), so it is earned there. A co-op guest
// rolls the held wave's reward on their own page (99-network.js, rw) and gets theirs the same way. Ones already in a bag keep working.
const SPECIES=['Crystal Owl','Storm Drake','Fire Imp','Moss Sprite','Cave Bat','Frost Fox','Wisp'];
function tortoiseReward(){ const it=rollItem(2,'familiar'); if(!it||it.slot!=='familiar') return it; let done=false; for(const k of SPECIES) if(!done&&it.name.includes(k)){ it.name=it.name.replace(k,KIND); done=true; } if(!done) it.name=it.name+' '+KIND; return it; }
{ const prev=waveRewardItem; waveRewardItem=function(){ const it=prev.apply(this,arguments); if(!SURVIVAL&&!TUTORIAL&&MAP&&MAP.id==='feast'&&S.wave===7){ T.rewards++; return tortoiseReward(); } return it; }; }
// ---- a walker: its model's feet sit T.h/2 under its centre (85-familiars centres every pet); the flag tells a partner's puppet (98-party.js) to walk it too
{ const prev=famModel; famModel=function(it){ const g=prev(it); if(g&&it&&!it.named&&famKind(it)===KIND) g.userData.walker=T.h*.5; return g; }; }
// ---- effects: short-lived floor rings, flashes, rune marks over held mobs, stone shards
const FX=[]; let RING=null, SHARD=null;
function geo(){ if(!RING){ RING=new THREE.RingGeometry(.86,1,48); SHARD=new THREE.DodecahedronGeometry(.12,0); } }
function ring(x,y,z,r0,r1,col,life){ geo();
  const m=new THREE.Mesh(RING,new THREE.MeshBasicMaterial({color:C(col),transparent:true,depthWrite:false,side:THREE.DoubleSide}));   /* normal blending: additive washed the amber out to white on the pink floors */ m.rotation.x=-PI/2; m.position.set(x,y+.07,z); m.userData.noOL=true; scene.add(m);
  FX.push({m,t:0,life,own:true,tick:(o,k)=>{ const s=r0+(r1-r0)*(1-Math.pow(1-k,3)); o.m.scale.set(s,s,s); o.m.material.opacity=.9*(1-k); }}); }
function flash(x,y,z,col,sc,life){ const s=glow(col,sc,.95); s.position.set(x,y,z); scene.add(s); FX.push({m:s,t:0,life,own:true,tick:(o,k)=>{ o.m.material.opacity=.95*(1-k); o.m.scale.setScalar(sc*(1+k*.6)); }}); }
function mark(e){ const s=glow(T.col,.55,.9); scene.add(s); FX.push({m:s,t:0,life:T.hold,own:true,tick:(o,k)=>{ if(e.dead){ o.t=o.life; return; } o.m.position.set(e.x,(e.y||0)+(e.h||1.2)+.35+Math.sin(o.t*6)*.06,e.z); o.m.material.opacity=.9*(k>.8?(1-k)/.2:1); }}); }
function shards(x,y,z){ geo(); for(let i=0;i<6;i++){ const m=new THREE.Mesh(SHARD,mat(0x8a7f70)); const a=rnd()*TAU, v=1.5+rnd()*1.5; m.position.set(x,y+.1,z); scene.add(m);
    FX.push({m,t:0,life:.6,vx:Math.cos(a)*v,vz:Math.sin(a)*v,vy:3+rnd()*2.5,tick:(o,k,dt)=>{ o.vy-=14*dt; o.m.position.x+=o.vx*dt; o.m.position.y=Math.max(y,o.m.position.y+o.vy*dt); o.m.position.z+=o.vz*dt; o.m.rotation.x+=dt*9; o.m.rotation.z+=dt*7; o.m.scale.setScalar(Math.max(.01,1-k*k)); }}); } }
function fxTick(dt){ for(let i=FX.length-1;i>=0;i--){ const o=FX[i]; o.t+=dt; const k=o.t/o.life; if(k>=1){ scene.remove(o.m); if(o.own) o.m.material.dispose(); FX.splice(i,1); continue; } o.tick(o,k,dt); } }
// ---- the taunt
function taunt(){ const f=fam, foes=famFoes(); let n=0;
  for(const e of foes){ if(e.dead||BOSS.has(e.kind)) continue; if(Math.hypot(e.x-f.x,e.z-f.z)>T.tauntR+(e.r||.4)*.5) continue; n++;
    if(e.puppet){ if(guest()) famHurt(e,0,0,0,{slow:T.hold}); }
    else { e.shoutT=Math.max(e.shoutT||0,T.hold); e.yaw=Math.atan2(f.x-e.x,f.z-e.z); e.swing=-1; T.held++; }
    mark(e); }
  if(!n) return false; T.taunts++; const gy=f.gy;
  ring(f.x,gy,f.z,.4,T.tauntR,T.col,.7); ring(f.x,gy,f.z,.2,T.tauntR*.6,T.crystal,.5); flash(f.x,gy+T.h*.7,f.z,T.crystal,2.2,.45); flash(f.x,gy+.3,f.z,T.col,3.2,.35);
  fam.kick=1; SFX.place(); return true; }
// ---- the shell slam (its "shot")
{ const prev=famFire; famFire=function(e){ if(!isT()) return prev.apply(this,arguments); if(!e||e.dead) return; const f=fam; f.lungeT=.45; f.slamE=e; f.slamHit=false; f.kick=1; }; }
function slamLand(e){ const f=fam; const dx=e.x-f.x, dz=e.z-f.z, d=Math.hypot(dx,dz)||1, dm=dmgOf(T.slam); T.slams++;
  famHurt(e,dm,dx/d*.8,dz/d*.8); if(!e.puppet&&!BOSS.has(e.kind)) e.holdT=Math.max(e.holdT||0,T.stagger); famLand(e.x,e.z,dm);
  const nb=heroStat('fproj')|0; if(nb>0){ const near=famFoes().filter(m=>!m.dead&&m!==e&&Math.hypot(m.x-e.x,m.z-e.z)<1.8).slice(0,nb); for(const m of near){ famHurt(m,dmgOf(T.slam*.7),0,0); shards(m.x,m.y||0,m.z); } }
  const y=e.y||0; ring(e.x,y,e.z,.2,1.4,0xc8a070,.4); flash(e.x,y+.3,e.z,T.col,1.6,.25); shards(e.x,y,e.z); if(window.__ringlook) window.__ringlook.hitAt(e.x,y+.7,e.z); SFX.thud(); }
// ---- the walk: run after the shoulder code each frame and put it on the floor beside the hero
function walk(dt){ const f=fam; if(!f||hero.dead>0||!f.g.visible) return; const g=f.g;
  const fx=Math.sin(hero.yaw), fz=Math.cos(hero.yaw), tx=hero.x-fx*T.back-fz*T.side*FAM_SIDE, tz=hero.z-fz*T.back+fx*T.side*FAM_SIDE;
  if(f.gx===undefined||Math.hypot(tx-f.gx,tz-f.gz)>8){ f.gx=tx; f.gz=tz; f.gy=floorAt(tx,tz,hero.y+.6); f.tcd=1.5; }   // first frame, or left far behind (a jump down, a teleport): it catches up at once
  let dx=tx-f.gx, dz=tz-f.gz; const d=Math.hypot(dx,dz), moving=d>.12; if(moving){ const st=Math.min(d,Math.min(9,d*3+1.5)*dt); f.gx+=dx/d*st; f.gz+=dz/d*st; }
  f.gy=lerp(f.gy,floorAt(f.gx,f.gz,hero.y+.6),1-Math.exp(-12*dt));
  let ox=0, oz=0; if(f.lungeT>0){ const e=f.slamE; f.lungeT-=dt; const k=1-f.lungeT/.45; if(e&&!e.dead){ const ex=e.x-f.gx, ez=e.z-f.gz, el=Math.hypot(ex,ez)||1, L=Math.sin(PI*Math.min(1,k))*Math.min(.7,el*.4); ox=ex/el*L; oz=ez/el*L; }
    if(!f.slamHit&&k>=.45){ f.slamHit=true; if(e&&!e.dead) slamLand(e); } }
  f.x=f.gx+ox; f.z=f.gz+oz; f.y=f.gy+T.h*.5;
  if(!f.target&&moving) f.yaw=angLerp(f.yaw,Math.atan2(dx,dz),1-Math.exp(-8*dt));
  g.position.set(f.x,f.y,f.z); g.rotation.set(0,f.yaw,0);
  const u=g.userData; if(u.action) u.action.timeScale=f.lungeT>0?2.6:moving?1.5:.2;
  f.tcd=(f.tcd===undefined?1.5:f.tcd)-dt; if(f.tcd<=0) f.tcd=taunt()?T.tauntEvery:.4; }
{ const prev=famUpdate; famUpdate=function(dt){ prev(dt); if(isT()) walk(dt); }; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); fxTick(dt); }; }
window.__tortoise={cfg:T,reward:tortoiseReward,info:()=>({rewards:T.rewards,taunts:T.taunts,held:T.held,slams:T.slams,fx:FX.length}),isOn:isT,taunt:()=>isT()&&taunt(),state:()=>fam?{x:fam.x,y:fam.y,z:fam.z,gy:fam.gy,walker:fam.g.userData.walker,clip:fam.g.userData.clip||null,glb:!!fam.g.userData.glb,ts:fam.g.userData.action?fam.g.userData.action.timeScale:null}:null};
})();
