// ===== THE BLIGHT BLAST (build 357). Matt, about the Blight Keg Sapper cart (a mob cart of green-glowing kegs that orcs push down the field): "can you handle the explosions?" -- "lets do the blight cloud". One reusable
// effect, window.__blight.explode(x, z): a flash and a green-orange fireball swelling and fading, a shockwave ring racing across the floor, the cart's pieces (wood, iron, kegs) flying and tumbling, a camera shake that is
// stronger the closer you are, a boom -- and the damage: everything within the blast is hurt, less the further out it is (mobs, your towers and secret mortars, you, and the Heartroot if it is close). Then the BLIGHT CLOUD
// stays on the ground for nine seconds: a flat green glow and drifting puffs, and anything that walks through it is poisoned and slowed, your own hero included (a little poison, no slow). It does not hurt towers.
// No lights are created (a light added or removed mid-fight makes every material rebuild -- a hitch): only glowing sprites, a flat ring and a few small boxes. Not wired to any mob yet: the carts are not animated; the dev
// panel (F9) has a button that blows one up ahead of you. Host only for damage (a co-op guest sees no blast yet).
// Test hook: window.__blight.
(function(){
'use strict';
const R_BLAST=6, R_CLOUD=5.5, CLOUD_T=9, MAX_CLOUDS=10;
const MAD_MULT=3, MAD_SEEK=18, MAD_STICK=22, MAD_GROW=1.6;   // a maddened mob's blow is this many times its usual; how far it looks for one to fight; how far it keeps a chosen one
const DMG_MOB=55, DMG_DEF=40, DMG_HERO=22, DMG_CRYSTAL=16, TICK=.5, HERO_TICK=.8, HERO_DMG=2, POISON=7;
const isGuest=()=>!!(window.__net&&window.__net.role&&window.__net.role()==='guest');
const fx=[], clouds=[]; const cnt={ blasts:0, cloudsMade:0, hurt:0, hero:0, defs:0 };
let RING=null, DISC=null, BOX=null; const mats={};
const geo=()=>{ if(!RING){ RING=new THREE.RingGeometry(.86,1,48); RING.rotateX(-PI/2); DISC=new THREE.CircleGeometry(1,40); DISC.rotateX(-PI/2); BOX=new THREE.BoxGeometry(1,1,1); } };
const flat=(hex,op,norm)=>{ const k=hex+'|'+op+'|'+(norm?1:0); return mats[k]||(mats[k]=new THREE.MeshBasicMaterial({ color:C(hex), transparent:true, opacity:op, blending:norm?THREE.NormalBlending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide })); };
const solid=hex=>mats['s'+hex]||(mats['s'+hex]=new THREE.MeshToonMaterial({ color:C(hex), gradientMap:GRAD }));
const mine=o=>{ o.userData.blight=1; return o; };
const gone=o=>{ if(o.parent) o.parent.remove(o); if(o.material&&o.material.dispose&&o.isSprite) o.material.dispose(); };
function sound(v){ v=v||1; try{ if(typeof noise==='function'){ noise(.9,.42*v,260); noise(.35,.3*v,1800); } if(typeof beep==='function') beep(62,.55,'sawtooth',.32*v,-40); }catch(e){} }
// opt: noDamage (the caller does its own), noCloud, scale (visual size of the blast; 1 = a whole cart), cloudR / cloudT (the cloud's reach and seconds), shell (the pieces are iron and green glass, not cart wood), quiet
function explode(x,z,opt){ opt=opt||{}; geo(); cnt.blasts++; const y=(typeof floorH==='function'?floorH(x,z):0)||0, sc=opt.scale||1; sound(opt.quiet?.45:1);
  // ---- light show
  const flash=glow(0xfff0b0,14*sc,1); flash.position.set(x,y+1.6*sc,z); scene.add(mine(flash)); fx.push({ k:'flash', o:flash, t:0, life:.3 });
  for(const [hex,s0,s1,dl,h] of [[0xff9a30,3,15,.75,1.2],[0x8aff6a,2,12,.9,1.8],[0x4a3a22,4,13,1.1,2.6]]){ const b=glow(hex,s0*sc,.9); b.position.set(x,y+h*sc,z); scene.add(mine(b)); fx.push({ k:'ball', o:b, t:0, life:dl, s0:s0*sc, s1:s1*sc, h:h*sc, y, rise:2.2*sc }); }
  const ring=new THREE.Mesh(RING,flat(0x9cff7a,.85).clone()); ring.position.set(x,y+.2,z); ring.scale.setScalar(1); ring.userData.noOL=true; scene.add(mine(ring)); fx.push({ k:'ring', o:ring, t:0, life:.55, r1:R_BLAST*1.25*sc });
  // ---- the cart's pieces
  const PIECES=opt.shell?[[0x3a3a3c,.3,.12,.22],[0x4a3a2a,.22,.22,.12],[0x55e04a,.14,.3,.14],[0x2f2f32,.26,.1,.3]]:[[0x6a4a2a,.9,.25,.25],[0x6a4a2a,.6,.2,.6],[0x3a3a3c,.35,.35,.35],[0x2f5a2a,.45,.6,.45],[0x2f5a2a,.4,.55,.4],[0x7a5a34,.8,.15,.3]];
  for(let i=0;i<(opt.shell?10:16);i++){ const p=PIECES[i%PIECES.length], m=new THREE.Mesh(BOX,solid(p[0])); m.scale.set(p[1],p[2],p[3]); m.userData.noOL=true; const a=rnd()*TAU, sp=(3+rnd()*5)*(.5+.5*sc); m.position.set(x+Math.cos(a)*.4,y+.8,z+Math.sin(a)*.4); m.rotation.set(rnd()*6,rnd()*6,rnd()*6); scene.add(mine(m));
    fx.push({ k:'bit', o:m, t:0, life:1.9+rnd()*.5, vx:Math.cos(a)*sp, vy:5+rnd()*5, vz:Math.sin(a)*sp, sx:(rnd()-.5)*10, sy:(rnd()-.5)*10, sz:(rnd()-.5)*10, s:p, y }); }
  try{ const d=Math.hypot(hero.x-x,hero.z-z); if(d<26) camShake=Math.max(camShake,sc*Math.min(1.1,1.3*(1-d/26)+.15)); }catch(e){}
  // ---- damage (the host's: a guest's mobs and towers are the host's to hurt)
  if(!isGuest()&&!opt.noDamage){
    for(const e of enemies){ if(e.dead) continue; const dx=e.x-x, dz=e.z-z, d=Math.hypot(dx,dz), reach=R_BLAST+(e.r||.5); if(d>reach) continue; const k=Math.max(.25,1-d/reach); hurt(e,Math.max(1,Math.round(DMG_MOB*k)),dx/(d||1)*1.6,dz/(d||1)*1.6); cnt.hurt++; }
    for(const d of defs.slice()){ const dd=Math.hypot(d.x-x,d.z-z); if(dd>R_BLAST) continue; hurtDef(d,Math.round(DMG_DEF*Math.max(.3,1-dd/R_BLAST))); cnt.defs++; }
    { const dh=Math.hypot(hero.x-x,hero.z-z); if(dh<R_BLAST&&hero.dead<=0){ hurtHero(Math.round(DMG_HERO*Math.max(.3,1-dh/R_BLAST))); cnt.hero++; } }
    { const dc=Math.hypot(x,z); if(dc<R_BLAST-1){ try{ hurtCrystal(Math.round((opt.crystalDmg||DMG_CRYSTAL)*(1-dc/R_BLAST)),null); }catch(e){} } }
  }
  if(!opt.noCloud) cloud(x,z,y,opt.cloudR||R_CLOUD,opt.cloudT||CLOUD_T,!!opt.mad,opt.poison);
  return true; }
function cloud(x,z,y,cr,ct,mad,poison){ cr=cr||R_CLOUD; ct=ct||CLOUD_T; while(clouds.length>=MAX_CLOUDS) endCloud(clouds.shift()); cnt.cloudsMade++;
  const disc=new THREE.Mesh(DISC,flat(0x3dbb2e,.36,true).clone()); disc.position.set(x,y+.12,z); disc.scale.setScalar(cr); disc.userData.noOL=true; scene.add(mine(disc));
  const edge=new THREE.Mesh(RING,flat(0x8aff62,.5).clone()); edge.position.set(x,y+.14,z); edge.scale.setScalar(cr); edge.userData.noOL=true; scene.add(mine(edge));
  const puffs=[]; for(let i=0;i<(mad?30:16);i++){ const a=rnd()*TAU, r=Math.sqrt(rnd())*.9, s=glow(rnd()<.35?0x6fd04a:0x36a228,5.5+rnd()*3.5,.001); s.material.blending=THREE.NormalBlending; s.userData.base=.24+rnd()*.14; s.userData.a=a; s.userData.r=r; s.userData.ph=rnd()*6; s.userData.h=.5+rnd()*(mad?3.4:1.8); scene.add(mine(s)); puffs.push(s); }
  clouds.push({ x, z, y, R:cr, T:ct, mad:!!mad, poison:poison===undefined?POISON:poison, t:0, tick:0, htick:0, disc, edge, puffs }); }
function endCloud(c){ gone(c.disc); c.disc.material.dispose(); gone(c.edge); c.edge.material.dispose(); c.puffs.forEach(gone); }
WORLDANIM.push(dt=>{
  for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.t+=dt; const k=Math.min(1,f.t/f.life); let done=k>=1;
    if(f.k==='flash'){ f.o.material.opacity=1-k; f.o.scale.setScalar(14+k*6); }
    else if(f.k==='ball'){ const e=1-Math.pow(1-k,2); f.o.scale.setScalar(f.s0+(f.s1-f.s0)*e); f.o.material.opacity=.9*(1-k*k); f.o.position.y=f.y+f.h+f.rise*k; }
    else if(f.k==='hit'){ f.o.material.opacity=.95*(1-k); f.o.scale.setScalar(1.9+k*1.6); }
    else if(f.k==='ring'){ f.o.scale.setScalar(1+(f.r1-1)*(1-Math.pow(1-k,2))); f.o.material.opacity=.85*(1-k); }
    else if(f.k==='bit'){ f.vy-=16*dt; f.o.position.x+=f.vx*dt; f.o.position.y+=f.vy*dt; f.o.position.z+=f.vz*dt; f.o.rotation.x+=f.sx*dt; f.o.rotation.y+=f.sy*dt; f.o.rotation.z+=f.sz*dt;
      if(f.o.position.y<f.y+.15){ f.o.position.y=f.y+.15; f.vy=Math.abs(f.vy)*.25; f.vx*=.55; f.vz*=.55; f.sx*=.5; f.sy*=.5; f.sz*=.5; } const fade=k>.75?(1-k)/.25:1; f.o.scale.set(f.s[1]*fade,f.s[2]*fade,f.s[3]*fade); }
    if(done){ gone(f.o); if(f.k==='ring') f.o.material.dispose(); fx.splice(i,1); } }
  for(let i=clouds.length-1;i>=0;i--){ const c=clouds[i]; c.t+=dt; if(c.t>=c.T){ endCloud(c); clouds.splice(i,1); continue; }
    const rad=c.R*(c.mad?Math.min(1,.35+.65*c.t/MAD_GROW):1), env=Math.min(1,c.t/.7)*Math.min(1,(c.T-c.t)/1.6); c.rad=rad; c.disc.material.opacity=(c.mad?.3:.36)*env*(.85+.15*Math.sin(c.t*3)); c.disc.scale.setScalar(rad*(.9+.1*Math.min(1,c.t/.7))); c.edge.material.opacity=.5*env*(.8+.2*Math.sin(c.t*4)); c.edge.scale.copy(c.disc.scale);
    c.puffs.forEach(s=>{ const u=s.userData, a=u.a+c.t*.22; s.position.set(c.x+Math.cos(a)*u.r*rad,c.y+u.h+Math.sin(c.t*.9+u.ph)*.45,c.z+Math.sin(a)*u.r*rad); s.material.opacity=u.base*env; s.scale.setScalar((6+Math.sin(c.t*.7+u.ph)*.9)*Math.max(.55,rad/R_CLOUD)); });
    if(isGuest()) continue; c.tick+=dt; if(c.tick>=TICK){ c.tick=0;
      for(const e of enemies){ if(e.dead) continue; if(Math.hypot(e.x-c.x,e.z-c.z)<c.rad+(e.r||.5)){ if(c.mad){ e.madT=Math.max(e.madT||0,1.3); } else { e.chillT=Math.max(e.chillT||0,.7); e.chillK=Math.min(e.chillK||1,.6); } if(c.poison>0){ e.poisonT=Math.max(e.poisonT||0,1.2); e.poisonDmg=Math.max(e.poisonDmg||0,c.poison); } } } }
    c.htick+=dt; if(c.htick>=HERO_TICK){ c.htick=0; if(hero.dead<=0&&Math.hypot(hero.x-c.x,hero.z-c.z)<c.rad){ hurtHero(HERO_DMG); cnt.hero++; } } }
  for(const e2 of enemies) if(e2.madT>0) e2.madT=Math.max(0,e2.madT-dt); });
// ---- a maddened mob picks the nearest other mob and fights it (the core calls these two: updateEnemies -> __madTarget, landHit -> __madHit)
window.__madTarget=function(e){ let o=e.madTgt; if(!(o&&!o.dead&&o!==e&&Math.hypot(o.x-e.x,o.z-e.z)<MAD_STICK)){ o=null; let bd=MAD_SEEK; for(const q of enemies){ if(q===e||q.dead) continue; const d=Math.hypot(q.x-e.x,q.z-e.z); if(d<bd){ bd=d; o=q; } } e.madTgt=o; }
  if(!o) return null; const reach=e.ranged?Math.min(e.ranged-1,7):(e.r+o.r+.5); return { kind:'mob', obj:o, x:o.x, z:o.z, reach }; };
window.__madHit=function(e,tg){ const o=tg.obj; if(!o||o.dead||o===e) return; const dx=o.x-e.x, dz=o.z-e.z, d=Math.hypot(dx,dz)||1; if(d>tg.reach+1.8) return; cnt.mad=(cnt.mad||0)+1; hurt(o,Math.max(1,Math.round(e.dmg*MAD_MULT)),dx/d*1.2,dz/d*1.2);
  const sp=glow(0x8aff6a,1.9,.95); sp.position.set(o.x,(o.y||0)+(o.h||1.4)*.6,o.z); scene.add(mine(sp)); fx.push({ k:'hit', o:sp, t:0, life:.3 }); };
// ---- the dev panel (F9): a button that blows one up ahead of you
setInterval(()=>{ const p=document.getElementById('devpanel'); if(!p||document.getElementById('dp-blight')) return; const sec=document.createElement('div'); sec.className='sect'; sec.id='dp-blight';
  sec.innerHTML='<label>blight keg blast</label><div class="row"><button id="dp-blight-go">💥 Blow one up ahead</button></div>'; const note=p.querySelector('.note'); if(note) p.insertBefore(sec,note); else p.appendChild(sec);
  document.getElementById('dp-blight-go').onclick=()=>{ const fx_=Math.sin(hero.yaw), fz_=Math.cos(hero.yaw); explode(hero.x+fx_*8,hero.z+fz_*8); }; },800);
window.__blight={ explode, madCover:(x,z)=>clouds.some(c=>c.mad&&Math.hypot(x-c.x,z-c.z)<(c.rad||c.R)+2), info:()=>Object.assign({ live:fx.length, clouds:clouds.length, mad:cnt.mad||0, madMobs:enemies.filter(q=>!q.dead&&q.madT>0).length, R_BLAST, R_CLOUD, CLOUD_T },cnt), cloudAt:()=>clouds.map(c=>({ x:c.x, z:c.z, t:+c.t.toFixed(1) })), clear:()=>{ fx.splice(0).forEach(f=>gone(f.o)); clouds.splice(0).forEach(endCloud); } };
})();
