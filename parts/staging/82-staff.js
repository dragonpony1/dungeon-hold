// ===== BATTLE STAFFS: a caster's weapon, built in code (no model to load), with a glowing head and a spell bolt =====
// Six kinds — five tiers for the forge and one for the Void set — in the same model units as the sword GLBs: the shaft runs
// up +Y from the ferrule at y=0 to the head near y=1.2, and the template says the fist closes 36% of the way up and the mount makes it body-length (lenScale). Registered
// with the weapon mount as 'staff-<kind>', so a hero whose mount node is a staff mount (or a test's force) carries one like
// a sword: scaled by the mount's length, ink-outlined, tinted by a set. The head's crystal turns, rings and motes orbit it,
// and __staff.fire() throws a bolt from the crystal that bursts on the first wall it meets.
(function(){
const STAFF_KINDS={
  hazel: {name:'Hazel Staff',        tier:1,wood:0x6b4a2a,dark:0x3a2716,band:0x8a6a3a,gem:0xbfe8ff,glow:0x9ad8ff,prongs:2,rings:0,motes:0,gemR:.05},
  copper:{name:'Copper-bound Staff', tier:2,wood:0x4e3320,dark:0x2c1c10,band:0xb87333,gem:0xffc050,glow:0xffa030,prongs:3,rings:0,motes:0,gemR:.055},
  runed: {name:'Runed Ash Staff',    tier:3,wood:0x5a4632,dark:0x33281c,band:0x8fb0c0,gem:0x8dffa8,glow:0x4dff7a,prongs:3,rings:1,motes:2,gemR:.06,runes:true},
  storm: {name:'Stormwood Staff',    tier:4,wood:0x2e2a3a,dark:0x1a1722,band:0xc0c8d8,gem:0x7fbbff,glow:0x3d8bff,prongs:4,rings:2,motes:3,gemR:.065},
  battle:{name:'Gnome Battle Staff', tier:5,wood:0x3a2416,dark:0x22150c,band:0xe0b040,gem:0xfff2c0,glow:0xffd060,prongs:4,rings:2,motes:4,gemR:.075,halo:true},
  void:  {name:'Staff of the Void',  tier:5,wood:0x1a1226,dark:0x0d0914,band:0x8a3cff,gem:0xd070ff,glow:0x9a30ff,prongs:3,rings:2,motes:3,gemR:.07,shards:true}};
function makeStaff(kind){ const K=STAFF_KINDS[kind]||STAFF_KINDS.hazel; const g=new THREE.Group(); g.name='staff-'+kind; const wood=mat(K.wood), dark=mat(K.dark), band=mat(K.band); const bright=h=>{ const b=basic(h); return b; };
  const shaft=M(G.cyl(.034,.046,1.0,9),wood,0,.5,0); g.add(shaft);                                   // the shaft, a touch thinner at the top
  g.add(M(G.cyl(.05,.05,.19,9),dark,0,.44,0)); for(let i=0;i<4;i++) g.add(M(G.cyl(.054,.054,.014,9),band,0,.37+i*.045,0));   // the leather grip, bound with four thin rings
  [.18,.72].forEach(y=>g.add(M(G.cyl(.053,.053,.035,10),band,0,y,0)));                                // two bands
  g.add(M(G.cyl(.038,.048,.07,8),band,0,.03,0)); { const sp=M(G.cone(.024,.09,6),band,0,-.045,0); sp.rotation.x=PI; g.add(sp); }   // the ferrule and its spike
  g.add(M(G.cyl(.075,.045,.11,8),band,0,1.04,0)); g.add(M(G.cyl(.082,.082,.018,10),band,0,1.095,0));    // the socket the head sits in
  if(K.runes){ for(let i=0;i<4;i++){ const r=M(G.box(.014,.07,.01),bright(K.gem),0,.86,0); r.userData.noOL=true; const a=i/4*TAU; r.position.set(Math.sin(a)*.043,.84+(i%2)*.08,Math.cos(a)*.043); r.rotation.y=a; g.add(r); } }   // runes cut into the ash
  const head=new THREE.Group(); head.name='staffHead'; head.position.y=1.27; g.add(head); const gemY=0;
  for(let i=0;i<K.prongs;i++){ const a=i/K.prongs*TAU+PI/K.prongs; const pr=new THREE.Group(); pr.position.set(Math.sin(a)*.05,-.18,Math.cos(a)*.05); pr.rotation.y=a; const arm=M(G.cyl(.016,.026,.3,6),band,0,.15,0); arm.rotation.x=-.42; pr.add(arm); const tip=M(G.sph(.024,7,6),band,0,.285,.115); pr.add(tip); head.add(pr); }   // the prongs, curling up round the crystal
  const gem=new THREE.Mesh(new THREE.OctahedronGeometry(K.gemR*1.9,0),bright(K.gem)); gem.name='gem'; gem.scale.set(1,1.7,1); gem.position.y=gemY; gem.userData.noOL=true; head.add(gem);   // the crystal
  const core=M(G.sph(K.gemR*1.0,8,6),bright(0xffffff),0,gemY,0); core.name='core'; core.userData.noOL=true; head.add(core); const gl=glow(K.glow,1.1,.8); gl.name='glow'; gl.position.y=gemY; head.add(gl);
  const rings=[]; for(let i=0;i<K.rings;i++){ const r=new THREE.Mesh(new THREE.TorusGeometry(.15+i*.05,.011,6,22),band); r.name='ring'+i; r.userData.noOL=true; r.position.y=gemY; r.rotation.x=PI/2+.5*(i?-1:1); head.add(r); rings.push(r); }   // rings that turn about the crystal
  const motes=[]; for(let i=0;i<K.motes;i++){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(.024,0),bright(K.glow)); m.name='mote'+i; m.userData.noOL=true; head.add(m); motes.push(m); }   // motes that orbit it
  let halo=null; if(K.halo){ halo=new THREE.Mesh(new THREE.TorusGeometry(.24,.014,6,28),bright(K.band)); halo.name='halo'; halo.userData.noOL=true; halo.rotation.x=PI/2; halo.position.y=gemY+.03; head.add(halo); }   // a gold halo for the battle staff
  const shards=[]; if(K.shards){ for(let i=0;i<3;i++){ const s=new THREE.Mesh(new THREE.OctahedronGeometry(.035,0),mat(K.dark)); s.name='shard'+i; s.scale.set(1,2.4,1); head.add(s); shards.push(s); } }   // dark shards for the void
  g.userData.box=new THREE.Box3(new THREE.Vector3(-.26,-.09,-.26),new THREE.Vector3(.26,1.5,.26)); g.userData.gripF=.36; g.userData.lenScale=1.64; g.userData.proc=true;   /* held a third of the way up and body-length: foot near the floor, head above the hat */ g.userData.kind=kind; g.userData.staff=K; return g; }
const ANIMS=new WeakMap();
function animFor(root){ let a=ANIMS.get(root); if(a) return a; const by=n=>root.getObjectByName(n); const gem=by('gem'), core=by('core'), gl=by('glow'), halo=by('halo'); const rings=[],motes=[],shards=[]; for(let i=0;i<4;i++){ if(by('ring'+i)) rings.push(by('ring'+i)); if(by('mote'+i)) motes.push({m:by('mote'+i),a:i/4*TAU,r:.2+.04*(i%2),h:.03*(i%3)}); if(by('shard'+i)) shards.push({s:by('shard'+i),a:i/3*TAU}); } let t=rnd()*6;
  a=dt=>{ t+=dt; if(gem) gem.rotation.y+=dt*1.3; if(core) core.scale.setScalar(.9+.2*Math.sin(t*5)); if(gl) gl.material.opacity=.6+.25*Math.sin(t*4); rings.forEach((r,i)=>{ r.rotation.z+=dt*(i?-.9:1.2); r.rotation.y+=dt*.4; }); motes.forEach(o=>{ o.a+=dt*1.8; o.m.position.set(Math.sin(o.a)*o.r,o.h+Math.sin(t*3+o.a)*.02,Math.cos(o.a)*o.r); o.m.rotation.y=o.a; }); if(halo) halo.rotation.z+=dt*.5; shards.forEach(o=>{ o.a-=dt*.7; o.s.position.set(Math.sin(o.a)*.25,Math.cos(o.a*2)*.05,Math.cos(o.a)*.25); o.s.rotation.set(Math.sin(t)*.3,o.a,.4); }); };
  ANIMS.set(root,a); return a; }
function headOf(root){ return root.getObjectByName('staffHead')||root.getObjectByName('poleTip')||root; }   // build 510 prep: a Fighter's polearm throws from near its point (80-weapons.js attachWeapon hangs poleTip there)
Object.keys(STAFF_KINDS).forEach(k=>{ window.__weapons.register('staff-'+k,()=>makeStaff(k)); });   // served by the weapon mount like a loaded sword
// which staff a weapon item shows: the tier picks the forge staff, the Void set its own
function staffFor(it){ if(!it) return 'staff-hazel'; const sw=window.__weapons.setModel&&window.__weapons.setModel(it,'staff'); if(sw) return sw;   /* build 154: a gear set's own staff (86-setweapons.js) */ const pk=Meta.packs&&Meta.packs.of(it); if(pk&&pk.models&&pk.models.staff) return pk.models.staff; if(pk&&/void/i.test(pk.name||pk.id||'')) return 'staff-void'; const t=Math.max(1,Math.min(5,it.tier||tierOf(it.lvl||1))); return 'staff-'+['hazel','copper','runed','storm','battle'][t-1]; }
// ---- the bolt: a spark of the staff's own colour, thrown from the crystal, bursting on the first wall or mob it meets ----
// Build 511 prep (Matt: "some of the projectiles are anemic", "They should travel long and fast not a slow lob"): its look is 81-rangedshots.js's pooled one -- a hot white core, a glow and halo, a streak
// behind it, all in the weapon's set colour (the set's held glow, 86w) or a plain staff's tier colour -- flown at BOLT_V (60; was 26), walked in steps of at most SUB so it never skips a mob or a wall, and a miss
// flies on to 1.5x the hero's reach (the caller's life) and fades there. A hit: a white flash, a glow, a ring and sparks (pooled too).
const BOLTS=[];
const RS=()=>window.__rshots;
function fireBolt(kind,from,dir,speed,opts){ opts=opts||{}; const R=RS(); const d=dir.clone().normalize(); const size=opts.size||1, col=R.colour('bolt',kind); const fx=R.take('bolt',col,size);
  const b={fx,g:fx.g,d,v:speed||R.BOLT_V,t:0,life:opts.life||1.8,kind,col,size,go:0,x:from.x,y:from.y,z:from.z,dmg:opts.dmg||0,splash:opts.splash||0,hit:new Set(),mine:!!opts.mine,pierce:opts.pierce|0,tal:opts.tal||null,ctr:opts.ctr||null,owner:opts.owner||null};   /* build 336: mine = the local hero's own cast (talents); pierce = mobs it passes through. Co-op sweep 2026-10-02: tal/ctr = a co-op guest's talent ranks and counters, on the host (99-network.js hostGuestShot) */
  R.place(fx,b.x,b.y,b.z,d,0,1); BOLTS.push(b); if(window.__shotEvent) window.__shotEvent('bolt',kind,from,d,b.v,opts); /* build 376: the co-op host tells the guests of every hero's bolt (99-network.js) */ return fx.g; }
function burstAt(kind,x,y,z,size,col){ const R=RS(); R.impact(x,y,z,col!=null?col:R.colour('bolt',kind),size||1); }
// a mob in the bolt's way at (nx,ny,nz): hurt it (and splash round it); true when the bolt is spent
function boltHits(b,nx,ny,nz){ let struck=null;
  for(const e of enemies){ if(e.dead||b.hit.has(e)) continue; if(Math.hypot(e.x-nx,e.z-nz)<e.r+.5&&ny>e.y-.4&&ny<e.y+e.h+.6){ b.hit.add(e); if(b.mine) window.__mineHit=true; try{ hurt(e,b.dmg,b.d.x*1.4,b.d.z*1.4); }finally{ window.__mineHit=false; } SFX.hit(); struck=e; if((b.mine||b.tal)&&window.__talents&&window.__talents.onBolt) window.__talents.onBolt(e,b); break; } }   /* a hero's bolt hurts the first mob it meets */
  if(!struck) return false;
  if(b.splash){ if(b.mine) window.__mineHit=true; try{ for(const o of enemies){ if(o.dead||o===struck) continue; if(Math.hypot(o.x-nx,o.z-nz)<b.splash+o.r*.5) hurt(o,Math.round(b.dmg*.5*10)/10,(o.x-nx)*.6,(o.z-nz)*.6); } }finally{ window.__mineHit=false; } burstAt(b.kind,nx,ny+.3,nz,b.size*1.5,b.col); }   /* a full-charge bolt bursts on the mobs round the one it hits */
  burstAt(b.kind,nx,ny,nz,b.size,b.col);
  if(b.pierce>0){ b.pierce--; return false; }   /* build 336: Charged Bolts III -- it carries on through */
  return true; }
function dropBolt(i){ const b=BOLTS[i]; RS().give(b.fx); BOLTS.splice(i,1); }
function boltsUpdate(dt){ const R=RS(), SUB=R.SUB; for(let i=BOLTS.length-1;i>=0;i--){ const b=BOLTS[i];
    if(b.dying){ burstAt(b.kind,b.x,b.y,b.z,b.size*.8,b.col); dropBolt(i); continue; }   // it met a wall or the floor last frame: it bursts where it stopped
    b.t+=dt; if(b.t>=b.life){ dropBolt(i); continue; }   // flown its full length (1.5x reach): gone, faded out
    const step=b.v*dt, n=Math.max(1,Math.ceil(step/SUB)), st=step/n; let spent=false;
    for(let k=0;k<n;k++){ const nx=b.x+b.d.x*st, ny=b.y+b.d.y*st, nz=b.z+b.d.z*st;
      if(wallAt(nx,nz)||ny<=baseFloor(nx,nz)+.05){ b.dying=true; break; }   // stops short of it, this frame (the prison's breakable walls look for it there, 56g), and bursts the next
      b.x=nx; b.y=ny; b.z=nz; b.go+=st; if(b.dmg&&boltHits(b,nx,ny,nz)){ spent=true; break; } }
    if(spent){ dropBolt(i); continue; }
    R.place(b.fx,b.x,b.y,b.z,b.d,b.go,Math.min(1,(b.life-b.t)/(b.life*.18))); } }
// the caster's attack: with a staff in hand (or, build 510 prep, the Gnome Fighter's polearm) a swing throws a bolt from the crystal (the polearm's point) instead of sweeping the sword's cone. It
// flies level with the aim, nudged toward the nearest mob ahead so a drake in the air or a goblin down a stair can be hit.
const _UP=new THREE.Vector3(0,1,0);
{ const prevHit=hitCone; hitCone=function(){ const wo=window.__weapons.mounted(); if(!window.__weapons.caster(wo)) return prevHit();   /* build 510 prep: a staff, or the Fighter's polearm (a caster's: 80-weapons.js) */ const from=staffHeadWorld(wo); const A=window.__aim, yaw=A?A.yaw():hero.yaw; const fx=Math.sin(yaw), fz=Math.cos(yaw); const range=hero.reach||9; let best=A?A.pick(yaw):null, bd=1e9;   // the aim module picks the target the reticle shows
    if(!A) for(const e of enemies){ if(e.dead) continue; const dx=e.x-hero.x, dz=e.z-hero.z, d=Math.hypot(dx,dz); if(d>range+e.r||d<.01||(dx*fx+dz*fz)/d<.8) continue; if(d<bd){ bd=d; best=e; } }
    const d3=A&&A.dir3(); const dir=best?new THREE.Vector3(best.x-from.x,(best.y+best.h*.5)-from.y,best.z-from.z):(d3?new THREE.Vector3(d3.fx,d3.fy,d3.fz):new THREE.Vector3(fx,-.02,fz));   // nothing locked: fly the real 3D aim ray, not flat
    const sh=A?A.shot():{c:1,mul:1,full:false}, R=RS(), spd=R.BOLT_V*(1+.35*sh.c); const TM=window.__talents&&window.__talents.boltMods?window.__talents.boltMods():null;   /* build 336: her talents -- bigger bolts, a blast on impact, piercing, a twin every 5th cast */
    const opt={dmg:Math.round(heroDmg()*sh.mul*10)/10,life:R.FLY*range/spd,splash:Math.max(sh.full?1.9:0,TM?TM.splash:0),size:(1+.7*sh.c)*(TM?TM.size:1),mine:true,pierce:TM?TM.pierce:0};   /* build 511 prep: a miss flies on to 1.5x her reach */
    const n=R.shots(); for(const dv of R.fan(dir,n)) fireBolt(wo.userData.kind,from,dv,spd,Object.assign({},opt));   /* build 511 prep: the weapon's SHOT points -- a volley fanned 7 degrees apart, the first on the aim (the locked mob), each a whole bolt */
    if(TM&&TM.twin){ const hw=R.halfWidth(n)+.14; for(const sg of [1,-1]) fireBolt(wo.userData.kind,from,dir.clone().applyAxisAngle(_UP,sg*hw),spd,Object.assign({},opt)); }   /* the twin pair flanks the whole volley */ SFX.harpoon(); }; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); boltsUpdate(dt); const wo=window.__weapons.mounted(); if(wo&&/^staff-/.test(wo.name)) animFor(wo)(dt); PLANTED.forEach(p=>animFor(p)(dt)); }; }
// ---- previews: staffs planted in the floor, and a shot from one (tests and the design bench) ----
const PLANTED=[];
function plantStaff(kind,x,z,yaw,scale){ const g=makeStaff(kind); const s=scale||1.5; g.scale.setScalar(s); g.position.set(x,baseFloor(x,z)+.06*s,z); g.rotation.y=yaw||0; outline(g); scene.add(g); PLANTED.push(g); return g; }
function staffHeadWorld(g){ return headOf(g).getWorldPosition(new THREE.Vector3()); }
window.__staff={boltList:()=>BOLTS.map(b=>({x:+b.x.toFixed(2),y:+b.y.toFixed(2),z:+b.z.toFixed(2),d:[+b.d.x.toFixed(2),+b.d.y.toFixed(2),+b.d.z.toFixed(2)],t:+b.t.toFixed(2),life:+b.life.toFixed(2),mine:b.mine,pierce:b.pierce,splash:b.splash,dmg:b.dmg,spd:+b.v.toFixed(2),go:+b.go.toFixed(2),kind:b.kind,col:b.col,size:+b.size.toFixed(2),owner:b.owner})),kinds:()=>Object.keys(STAFF_KINDS),info:k=>Object.assign({kind:k},STAFF_KINDS[k]),make:makeStaff,plant:plantStaff,clear:()=>{ PLANTED.forEach(g=>scene.remove(g)); PLANTED.length=0; },
  fire:(g,dx,dy,dz)=>{ const from=staffHeadWorld(g); return fireBolt(g.userData.kind,from,new THREE.Vector3(dx,dy||0,dz),RS().BOLT_V); },
  fireFromHand:(dx,dy,dz)=>{ const wo=window.__weapons.mounted(); if(!window.__weapons.caster(wo)) return null; return fireBolt(wo.userData.kind,staffHeadWorld(wo),new THREE.Vector3(dx,dy||0,dz),RS().BOLT_V); },
  bolts:()=>BOLTS.length,bursts:()=>RS().info().impacts,headWorld:g=>staffHeadWorld(g||window.__weapons.mounted()),staffFor,planted:()=>PLANTED.length,animate:(g,dt)=>animFor(g)(dt),   // build 169: a staff standing on the floor as a drop (93c-weaponstand.js) turns its crystal and motes like one in hand
  addKind:(k,K,build)=>{ STAFF_KINDS[k]=K; window.__weapons.register('staff-'+k,build); },   // build 154: a staff built elsewhere (86-setweapons.js) — K gives its bolt and burst their colours
  fireBolt};   // raw (kind,fromVec3,dirVec3,speed,opts) -- no live staff model needed, unlike fire()/fireFromHand() above; 99-network.js spawns a guest's shot straight from their host-tracked position this way
})();
