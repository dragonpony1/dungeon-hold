// ===== MYTHIC GEAR (build 152): the hideout's forge makes a tier one step above legendary -- rarity 5 -- and the game wears it.
// Two kinds, both Matt's: NAMED mythics (ten from the forge, a proc, and since build 170 Subterfuge, a drop only; fixed stats and a signature power; up to two worn at once, each
// counting toward any set bonus, 92-sets.js) and mythic SET pieces ("Mythic Staff of the Void", ordinary set pieces at the
// top rarity). They reach the hall through dd_gear_return: a localStorage array the hideout appends to when the player
// sends gear back; every record is moved into the bag (Meta.onPickup) when the hideout closes, when a title-screen visit
// ends, and once at load, and the key is cleared. The powers below run on the page that wears them -- and, since build 159 (5/7),
// the host runs a co-op guest's too: a guest's page has no real mobs, so its mob-side powers never touched the hall until the host
// learned what each guest wears (GW below; the Mantle and the sword's powers are 99-network.js's). The stat halves travel with the look.
(function(){
const RETURN_KEY='dd_gear_return';
const NAMED={
  rootsplitter:{name:'Rootsplitter',slot:'weapon',stats:{dmg:30,hp:90,spd:15},power:'every 4th swing sends roots along the ground that hold enemies in place for 2 s'},
  last_lantern:{name:'The Last Lantern',slot:'weapon',stats:{dmg:24,tow:30,tarea:15},power:'enemies near you glow and take 25% more damage from your defenses'},
  mossheart_aegis:{name:'Mossheart Aegis',slot:'armor',stats:{hp:170,def:22,regen:4.5},power:'stand still 2 s and you and nearby defenses start healing'},
  voidwoven_mantle:{name:'Voidwoven Mantle',slot:'armor',stats:{def:24,move:18,mana:50},power:'the first hit you take each wave is swallowed and you blink a few steps away'},
  tear_of_the_rootgate:{name:'Tear of the Rootgate',slot:'amulet',stats:{mana:70,move:15,tow:25},power:'once a wave, face a gate and press T to step through a portal to it'},
  wardens_oath:{name:"The Warden's Oath",slot:'amulet',stats:{tow:42,def:12,hp:80},power:'the first enemy through each gate each wave is slowed and marked; defenses focus it'},
  bramblewhisk:{name:'Bramblewhisk',slot:'familiar',stats:{fdmg:36,frate:45,move:10},power:"your pet's shots leave thorn patches that slow and prick enemies"},
  gladehart:{name:'Gladehart',slot:'familiar',reward:true,stats:{fdmg:34,frate:40,move:12},power:'every 8 s a bright pink spirit stag charges through the thickest pack, hitting everything for six pet shots and throwing it way back'},   // reward:true -- earned by felling the Cyclops, never in the random named drop pool (87-mythicdrops.js namedItem)
  trimaw:{name:'Trimaw',slot:'familiar',reward:true,stats:{fdmg:28,frate:35,move:10},power:'three heads breathe fire (burn), frost (slow) and venom (poison) at three targets, and everything it hits takes 25% more damage from everything for a few seconds'},   // reward:true -- earned at Throne Room survival wave 50, never rolled; upgrades to 400 (90-forge.js upMax)
  old_lamplight:{name:'Old Lamplight',slot:'familiar',stats:{fdmg:30,frate:60,fproj:1},power:'+1 pet projectile, and your pet fires at whatever is being hit'},
  gloomcap_censer:{name:'Gloomcap Censer',slot:'charm',stats:{trate:20,tarea:18,regen:3},power:'defenses near you build 50% faster and fire 15% faster'},
  hourglass_of_hollow_sand:{name:'Hourglass of Hollow Sand',slot:'charm',stats:{spd:35,move:18,mana:40},power:'once a wave, when the Heartroot is about to fall, the horde crawls for 4 s'},
  subterfuge:{name:'Subterfuge',slot:'weapon',stats:{dmg:26,spd:18,move:12},power:'a bow: every shot is five lightning arrows in a 40° wedge, each half an arrow, and each one that hits jumps to 3 more enemies (60%, 35%, 20%)'},   // build 170, Matt's; the eleventh, a game-made one (the hideout's forge doesn't know it). Its power is 86i-subterfuge.js's
};
const slug=str=>String(str||'').toLowerCase().replace(/^the /,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const BY_NAME={}; for(const k in NAMED){ BY_NAME[slug(NAMED[k].name)]=k; BY_NAME[k]=k; }
BY_NAME.hourglass_hollow_sand='hourglass_of_hollow_sand';   // the hideout's own id for it (NAMED_MYTHICS in hideout.html)
function mythicId(it){ if(!it) return null; if(it.named&&typeof it.named==='string'&&BY_NAME[slug(it.named)]) return BY_NAME[slug(it.named)]; const k=BY_NAME[slug(it.name)]; return k||null; }
function has(id){ for(const s of SLOTS){ const it=gear[s]; if(it&&it.named&&mythicId(it)===id) return true; } return false; }
// ---- a hideout record into a game item: the hideout's tier word is kept aside (the game's tier is a number from the level),
// a named piece takes the table's stats (Matt's numbers, rebalanced here), nothing from the hideout asks for a level
function normalize(rec){ if(!rec||typeof rec!=='object') return null; const it={id:rec.id||Math.floor(Math.random()*1e9).toString(36),name:String(rec.name||'Mythic piece'),slot:rec.slot,rarity:Number.isFinite(+rec.rarity)?+rec.rarity:5,lvl:Math.max(1,+rec.lvl||10),stats:{},value:0,mythic:true,from:'hideout'};
  if(!SLOTS.includes(it.slot)){ const k=mythicId(rec); if(k) it.slot=NAMED[k].slot; else return null; }
  const st=(rec.stats&&typeof rec.stats==='object')?rec.stats:{}; for(const k in st){ const v=+st[k]; if(Number.isFinite(v)&&STATL[k]) it.stats[k]=v; }
  const k=mythicId(rec); if(rec.tier==='named'||(rec.named&&k)){ if(!k) return null; it.named=k; it.name=NAMED[k].name; it.slot=NAMED[k].slot; it.stats=Object.assign({},NAMED[k].stats); it.rarity=5; it.power=NAMED[k].power;
    if(rec.procd){ const pk=Object.keys(it.stats)[0]; if(pk){ it.stats[pk]=Math.round(it.stats[pk]*1.35*10)/10; it.primary=pk; it.procd=true; } } }   // build 243: PROC'D GEAR (97c-procd.js): only the hideout's forge sets rec.procd; the primary stat is the first of the named table's stats, +35%
  // build 154/157: the set id and the weapon's kind ride along, so the hand shows the set's own weapon. A forged record calls
  // them set and art (art = sword/staff/polearm there); a game item that went to the hideout and came back calls them setId
  // and look, and its art is already a picture path
  { const sid=rec.set||rec.setId, lk=[rec.look,rec.art].find(v=>/^(sword|staff|polearm|bow)$/.test(v));
    if(sid&&typeof sid==='string') it.setId=sid.slice(0,24); if(lk) it.look=lk; }
  if(rec.forceLook&&/^(sword|staff|bow)$/.test(rec.forceLook)) it.forceLook=rec.forceLook;   // build 208 (74-devpanel.js): normalize only ever copies fields it already knows about, so this dev-panel-only override needs its own explicit pass-through or it's silently dropped here, same as it would be for any other unrecognized field
  it.mythicTier=typeof rec.tier==='string'?rec.tier:(it.rarity>=5?'mythic':''); it.tier=tierOf(it.lvl); it.value=it.named?400:it.rarity>=5?250:[10,25,60,150,300][Math.max(0,Math.min(4,it.rarity|0))]; it.req=1;
  { const A=window.__mythicDrops&&window.__mythicDrops.art, pic=A&&A(it); if(pic) it.art=pic; else if(typeof rec.art==='string'&&/\.(jpe?g|png|webp)$/i.test(rec.art)) it.art=rec.art.slice(0,200); }   // build 157: Matt's picture on its card (87-mythicdrops.js)
  return it; }
function returnGear(){ let list=[]; try{ const a=JSON.parse(localStorage.getItem(RETURN_KEY)); if(Array.isArray(a)) list=a; }catch(e){} if(!list.length) return 0;
  let n=0; const left=[]; for(const rec of list){ const it=normalize(rec); if(!it){ continue; } if(Meta.onPickup(it,{x:hero.x,y:hero.y+1,z:hero.z})) n++; else left.push(rec); }
  try{ if(left.length) localStorage.setItem(RETURN_KEY,JSON.stringify(left)); else localStorage.removeItem(RETURN_KEY); }catch(e){}
  if(n) toast(n+' piece'+(n>1?'s':'')+' came back from the hideout — in your bag'); return n; }
// ---- the powers
const W={wave:-1,swings:0,mantle:false,tear:false,hour:false,oath:{},idleT:0,healT:0,healAcc:0};
function newWave(){ W.mantle=false; W.tear=false; W.hour=false; W.oath={}; }
function near(x,z,r){ return Math.hypot(x-hero.x,z-hero.z)<=r; }
// ---- build 159 (5/7): a co-op GUEST's named mythics. has() reads this page's gear, and a guest's page has no real mobs, so a guest's
// Hourglass, Oath, Lantern and Censer never touched the hall. The guest's input now names what it wears (99-network.js), and on the
// host GW is that list for this frame, each guest with the host's copy of its hero (Meta.coopWear): a hall-wide power (the Hourglass,
// the Oath) fires if ANYONE wears it, once a wave as ever; a power around its wearer (the Lantern, the Censer, Mossheart's healing)
// works around each wearer's own spot. Solo and a guest page have no GW, so every check below is exactly has() as before. A guest's
// Mantle is hurtGuestHero's (99-network.js: that is where a guest is hit); its Rootsplitter relays its own 4th swing ('roots', below)
let GW=null;
function wornIds(){ const out=[]; for(const s of SLOTS){ const it=gear[s]; const k=it&&it.named?mythicId(it):null; if(k&&!out.includes(k)) out.push(k); } return out; }   // what this page wears, for its co-op input
function guestsWith(id){ return GW?GW.filter(w=>w.myth.includes(id)):[]; }
function anyWears(id){ return has(id)||!!(GW&&GW.some(w=>w.myth.includes(id))); }
function nearWearer(id,x,z,r){ if(has(id)&&near(x,z,r)) return true; if(GW) for(const w of GW) if(w.myth.includes(id)&&Math.hypot(x-w.g.x,z-w.g.z)<=r) return true; return false; }
const netRole=()=>{ const n=window.__net; return n&&n.role?n.role():null; };
let HERO_HIT=false;
function asHero(fn){ const was=HERO_HIT; HERO_HIT=true; try{ return fn(); }finally{ HERO_HIT=was; } }   // a hero's own blow, not a defense's (the Lantern's 25% is for defenses): 99-network.js swings a guest's sword through this
// Rootsplitter's roots, from any spot and facing: this hero's 4th swing, or a guest's (relayed as 'roots', applied here on the host)
function roots(x,y,z,yaw,reach){ const fx=Math.sin(yaw), fz=Math.cos(yaw); let n=0;
  for(const e of enemies){ if(e.dead||e.fly) continue; const dx=e.x-x, dz=e.z-z, d=Math.hypot(dx,dz); if(d<reach+e.r&&(dx*fx+dz*fz)/Math.max(d,.01)>.3){ e.holdT=2; n++; } }
  for(let i=0;i<5;i++){ const g=glow(0x5ad05a,.7+i*.15,.7); g.position.set(x+fx*(.6+i*.55),baseFloor(x+fx*(.6+i*.55),z+fz*(.6+i*.55))+.15,z+fz*(.6+i*.55)); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); }
  if(n) floatText(x+fx*1.5,y+1.4,z+fz*1.5,'ROOTS','#5ad05a'); return n; }
{ const prev=hitCone; hitCone=function(){ HERO_HIT=true; try{ prev(); }finally{ HERO_HIT=false; }
    if(!has('rootsplitter')) return; W.swings++; if(W.swings%4) return;
    const reach=(hero.reach||2.4)+2.5; roots(hero.x,hero.y,hero.z,hero.yaw,reach);
    if(netRole()==='guest') window.__net.send('roots',{x:+hero.x.toFixed(2),z:+hero.z.toFixed(2),yaw:+hero.yaw.toFixed(3),reach:+reach.toFixed(2)}); }; }   // build 159 (5/7): a guest's roots here only drew the splats (its page has no real mobs); the host holds its mobs (99-network.js)
// build 223 (Matt, twice: "i cant equip subterfuge"): the two-named-mythics limit (10-meta.js equip, build 152) refused with a short toast that
// never said why. Say it plainly and name the two worn pieces, on the lesson banner as well; the rule itself is unchanged.
{ const prev=Meta.equip; Meta.equip=function(id){ const it=Meta.bag().find(b=>b.id===id); if(it&&it.named){ const on=SLOTS.filter(s=>gear[s]&&gear[s].named&&s!==it.slot); if(on.length>=2){ const names=on.map(s=>gear[s].name).join(' and '); const msg='You already wear two named mythics ('+names+'). Take one off to wear '+it.name+'.'; toast(msg); if(window.__lesson) window.__lesson.show(msg+' Two at once is the limit.',8); return false; } } try{ return prev(id); }catch(e){ console.error(e); const m='Equip failed: '+(e&&e.message||e); toast(m); if(window.__lesson) window.__lesson.show(m+' (tell Claude this exact line)',12); return false; } }; }   // an equip that throws used to do nothing at all on screen
{ const prev=hurt; hurt=function(e,dmg,kx,kz){ if(e&&e.lanternT>0&&!HERO_HIT&&anyWears('last_lantern')) dmg=Math.round(dmg*1.25*10)/10; return prev(e,dmg,kx,kz); }; }
{ const prev=hurtHero; hurtHero=function(dmg){ if(has('voidwoven_mantle')&&!W.mantle&&S.phase==='wave'&&hero.dead<=0){ W.mantle=true; let bx=-Math.sin(hero.yaw), bz=-Math.cos(hero.yaw); let nearest=null, nd=1e9; for(const e of enemies){ if(e.dead) continue; const d=Math.hypot(e.x-hero.x,e.z-hero.z); if(d<nd){ nd=d; nearest=e; } } if(nearest&&nd>.01){ bx=(hero.x-nearest.x)/nd; bz=(hero.z-nearest.z)/nd; }
      for(let i=0;i<6;i++) moveCircle(hero,bx*.6,bz*.6,.42,true); hero.hurtT=1; const g=glow(0xc070ff,2.4,.9); g.position.set(hero.x,hero.y+.9,hero.z); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); toast('The mantle swallows the blow'); return; }
    return prev(dmg); }; }
{ const prev=spawnEnemy; spawnEnemy=function(kind,lane){ const e=prev(kind,lane); if(e&&anyWears('wardens_oath')&&S.phase==='wave'&&!W.oath[lane||'N']){ W.oath[lane||'N']=true; e.marked=true; e.slowT=1e9; const g=glow(0xff6a5a,.9,.85); g.position.y=(e.h||1.2)+.7; if(e.mdl&&e.mdl.g) e.mdl.g.add(g); } return e; }; }
{ const prev=stat; stat=function(d,k){ const v=prev(d,k); if(k==='cd'&&d&&nearWearer('gloomcap_censer',d.x,d.z,6)) return v/1.15; return v; }; }
{ const prev=famTarget; famTarget=function(){ if(has('old_lamplight')&&typeof fam!=='undefined'&&fam){ let best=null, bd=FAM_RANGE; for(const e of famFoes()){ if(e.dead||!(e.squash>.2)) continue; const d=Math.hypot(e.x-fam.x,e.z-fam.z); if(d<bd&&los(fam.x,fam.z,e.x,e.z)){ bd=d; best=e; } } if(best) return best; } return prev(); }; }
function gateFacing(){ let best=null, bd=-2; const fx=Math.sin(cam.yaw), fz=Math.cos(cam.yaw); for(const k in LANES){ const L=LANES[k]; const gx=cw(L.cx), gz=cwz(L.cz); const dx=gx-hero.x, dz=gz-hero.z, d=Math.hypot(dx,dz)||1; const dot=(dx*fx+dz*fz)/d; if(dot>bd){ bd=dot; best={k,x:gx,z:gz}; } } return best; }
function tear(){ const ph=hallPhase(); if(!has('tear_of_the_rootgate')||W.tear||!(ph==='wave'||ph==='build')||hero.dead>0) return false; const g=gateFacing(); if(!g) return false; W.tear=true;   // hallPhase (58-portal.js): the host's phase on a co-op guest. The host's copy follows the jump (99-network.js, build 159 4/7)
  const a=glow(0xd08aff,2.6,.9); a.position.set(hero.x,hero.y+.9,hero.z); scene.add(a); projs.push({kind:'splat',t:0,mesh:a});
  hero.x=g.x; hero.z=g.z; hero.y=baseFloor(g.x,g.z); const b=glow(0xd08aff,2.6,.9); b.position.set(hero.x,hero.y+.9,hero.z); scene.add(b); projs.push({kind:'splat',t:0,mesh:b}); if(SFX.rift) SFX.rift(); toast('Through the Rootgate: the '+g.k+' gate'); return true; }
addEventListener('keydown',e=>{ if(e.code!=='KeyT'||e.repeat||Meta.isOpen()) return; const t=e.target&&e.target.tagName; if(t==='INPUT'||t==='TEXTAREA') return; if(tear()){ e.preventDefault(); e.stopImmediatePropagation(); } },true);
// build 159 (5/7): "once a wave" is the HALL's wave -- a co-op guest's own S.wave never moves (only the host counts waves), so its Tear
// of the Rootgate worked once a session. A guest counts the host's wave from its world broadcast
function hallWave(){ const n=window.__net; if(n&&n.role&&n.role()==='guest'){ const w=n.world&&n.world(); if(w&&Number.isFinite(w.wave)) return w.wave; } return S.wave; }
// build 162 (Matt: "maybe a little particulate animation when it's working"): a tower the Mossheart is mending sheds soft green motes
// that drift up off it and fade -- a few a second while its health is actually climbing, none once it's full
// build 172 (Matt: "the healing armor needs to be more pronounced"): a tower now mends 3% of ITS max a second (a flat 2/s was nothing on a
// 400-hp tower), the motes are bigger and brighter, and each healed tower and the wearer float a green "+N" about once a second. The
// motes are pooled -- a spent one waits in MOTE_FREE for the next instead of a new sprite and material each time
const MOTES=[], MOTE_FREE=[], MOSS=0x6ef0a0, MOSS_DEEP=0x2fd86a, MOSS_CSS='#6dff9e';
function mossHeal(d,dt){ if(d.hp>=d.max) return false; const add=Math.min(d.max-d.hp,d.max*.03*dt); d.hp+=add;
  const top=(DEFS[d.kind]&&DEFS[d.kind].top)||1, fy=baseFloor(d.x,d.z);
  d.mossAcc=(d.mossAcc||0)+add; d.mossNum=(d.mossNum||0)+dt; if(d.mossNum>=1){ d.mossNum=0; if(d.mossAcc>=1) floatText(d.x,fy+top+.5,d.z,'+'+Math.round(d.mossAcc),MOSS_CSS); d.mossAcc=0; }
  d.mossMote=(d.mossMote||0)-dt; if(d.mossMote>0) return true; d.mossMote=.15;
  mote(d.x+R(-.6,.6),fy+R(.2,Math.max(.7,top*.85)),d.z+R(-.6,.6)); return true; }
function mote(x,y,z){ const m=MOTE_FREE.pop()||mossGlow(.8,1); m.visible=true; m.position.set(x,y,z); m.name='mossMote'; m.userData.noOL=true; scene.add(m); MOTES.push({m,t:0}); }
function motesTick(dt){ for(let i=MOTES.length-1;i>=0;i--){ const o=MOTES[i]; o.t+=dt; const k=o.t/1.1; o.m.position.y+=dt*1.2; o.m.material.opacity=(1-k)*Math.min(1,o.t*6); o.m.scale.setScalar(.8*(1-k*.4)); if(k>=1){ scene.remove(o.m); MOTES.splice(i,1); if(MOTE_FREE.length<48) MOTE_FREE.push(o.m); else o.m.material.dispose(); } } }
// build 172: while the Mossheart is working, its wearer shows it -- a soft green ring on the floor at the 6-unit reach, a gentle glow on
// the wearer, and a thin beam of light to each tower it is actually mending (full ones get none). One AURA per wearer (the local hero,
// or on the host each guest who wears it -- the guest's own screen draws none, it has no defenses to mend). The ring's quad, its soft
// texture and the beam tube are shared; an aura makes its four materials once when it starts, and it all fades in, fades out, and is
// removed and disposed when it stops. Nothing below allocates per frame: the beams are a pool per aura, the vectors are scratch
const AURAS=new Map(); let AURA_GEO=null;
function auraGeo(){ if(AURA_GEO) return AURA_GEO;
  const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'); const r=g.createRadialGradient(64,64,0,64,64,64);
  r.addColorStop(0,'rgba(255,255,255,.05)'); r.addColorStop(.74,'rgba(255,255,255,.05)'); r.addColorStop(.9,'rgba(255,255,255,.32)'); r.addColorStop(.965,'rgba(255,255,255,1)'); r.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=r; g.fillRect(0,0,128,128); const ring=new THREE.PlaneGeometry(12,12); ring.rotateX(-Math.PI/2);   // 12 across: the ring's bright edge sits at the 6-unit reach
  const beam=new THREE.CylinderGeometry(1,1,1,6,1,true);   // a unit tube, scaled per beam: its radius on x/z, its length on y
  return AURA_GEO={tex:new THREE.CanvasTexture(c),ring,beam,UP:new THREE.Vector3(0,1,0),A:new THREE.Vector3(),B:new THREE.Vector3()}; }
// toneMapped:false and a deeper green (C: sRGB in, as every colour here): through ACES an additive pale green on the lit floor reads white
function mossMat(op){ return new THREE.MeshBasicMaterial({color:C(MOSS_DEEP),transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}); }
function mossGlow(scale,op){ const s=glow(MOSS,scale,op); s.material.toneMapped=false; return s; }
function auraOf(key){ let a=AURAS.get(key); if(a) return a; const G=auraGeo();
  const rm=mossMat(0); rm.map=G.tex; rm.side=THREE.DoubleSide; rm.polygonOffset=true; rm.polygonOffsetFactor=-2; const ring=new THREE.Mesh(G.ring,rm); ring.userData.noOL=true; ring.renderOrder=2;
  const halo=mossGlow(2.6,0); halo.material.depthTest=false; halo.renderOrder=4; a={key,x:0,y:0,z:0,a:0,on:false,seen:false,t:R(0,6),ring,halo,core:mossMat(0),soft:mossMat(0),beams:[],list:[]};
  AURAS.set(key,a); return a; }
function auraDrop(a){ scene.remove(a.ring); scene.remove(a.halo); for(const b of a.beams){ scene.remove(b.c); scene.remove(b.s); }
  a.ring.material.dispose(); a.halo.material.dispose(); a.core.dispose(); a.soft.dispose(); AURAS.delete(a.key); }
// this frame's wearer: where it stands, whether it is mending now, and which towers it mended (mossHeal's true). Merely wearing it
// makes nothing; the aura is born the moment it starts mending
function auraMark(key,x,y,z,on){ if(!on&&!AURAS.has(key)) return null; const a=auraOf(key); a.x=x; a.y=y; a.z=z; a.on=on; a.seen=true; a.list.length=0; return a; }
function beamAim(m,r,len){ const G=AURA_GEO; if(m.parent!==scene) scene.add(m); m.visible=true; m.quaternion.setFromUnitVectors(G.UP,G.B); m.scale.set(r,len,r); m.position.copy(G.A).addScaledVector(G.B,len/2); }   // G.A the wearer's chest, G.B the unit way to the tower
function aurasTick(dt){ const G=AURA_GEO; if(!G) return;
  for(const a of AURAS.values()){ if(!a.seen) a.on=false; a.seen=false; a.t+=dt;   // a wearer gone this frame (unequipped, a guest left) just fades where it stood
    a.a=a.on?Math.min(1,a.a+dt*2):Math.max(0,a.a-dt*1.6); if(a.a<=0&&!a.on){ auraDrop(a); continue; }
    const pulse=.85+.15*Math.sin(a.t*2.4), fy=baseFloor(a.x,a.z);
    if(a.ring.parent!==scene) scene.add(a.ring); if(a.halo.parent!==scene) scene.add(a.halo);   // re-added if a level load cleared the scene under it
    a.ring.position.set(a.x,fy+.06,a.z); a.ring.rotation.y=a.t*.15; a.ring.material.opacity=.5*a.a*pulse;
    a.halo.position.set(a.x,a.y+1,a.z); a.halo.material.opacity=.5*a.a*pulse; a.halo.scale.setScalar(2.4+.2*Math.sin(a.t*2.4));   // drawn over the wearer (depthTest off) so the glow washes the model, not just the air behind it
    if(a.on&&(a.mt=(a.mt||0)-dt)<=0){ a.mt=.1; const ang=R(0,6.283), rr=R(.3,.65); mote(a.x+Math.cos(ang)*rr,a.y+R(.1,1.3),a.z+Math.sin(ang)*rr); }   // and the same motes rise off the wearer: a big soft sprite alone read as a faint wash over the whole view, not a glow ON someone
    a.core.opacity=.75*a.a*pulse; a.soft.opacity=.22*a.a*pulse;
    const n=a.on?a.list.length:0; G.A.set(a.x,a.y+.85,a.z);
    for(let i=0;i<n;i++){ let b=a.beams[i]; if(!b){ b={c:new THREE.Mesh(G.beam,a.core),s:new THREE.Mesh(G.beam,a.soft)}; b.c.userData.noOL=b.s.userData.noOL=true; b.c.renderOrder=b.s.renderOrder=3; a.beams.push(b); }
      const d=a.list[i], top=(DEFS[d.kind]&&DEFS[d.kind].top)||1; G.B.set(d.x,baseFloor(d.x,d.z)+Math.max(.6,top*.6),d.z).sub(G.A); const len=G.B.length(); if(len<.05){ b.c.visible=b.s.visible=false; continue; }
      G.B.multiplyScalar(1/len); beamAim(b.c,.028,len); beamAim(b.s,.075,len); }
    for(let i=n;i<a.beams.length;i++){ a.beams[i].c.visible=a.beams[i].s.visible=false; } } }
function tick(dt){ const wv=hallWave(); if(wv!==W.wave){ W.wave=wv; newWave(); } motesTick(dt);
  GW=(Meta.coopWear&&netRole()==='host')?Meta.coopWear():null; if(GW&&!GW.length) GW=null;   // the guests who wear named mythics, this frame (see GW above)
  if(anyWears('last_lantern')) for(const e of enemies){ if(e.dead) continue; const lit=nearWearer('last_lantern',e.x,e.z,5); if(lit){ e.lanternT=.35; if(!e.lanternFx&&e.mdl&&e.mdl.g){ const g=glow(0xffd27a,1.7,.35); g.position.y=(e.h||1.2)*.6; e.mdl.g.add(g); e.lanternFx=g; } } if(e.lanternFx) e.lanternFx.visible=e.lanternT>0; }
  if(has('mossheart_aegis')){ if(!hero.moving&&hero.swingT<0&&hero.dead<=0) W.idleT+=dt; else W.idleT=0; const on=W.idleT>=2, a=auraMark('me',hero.x,hero.y,hero.z,on);
    if(on){ const h0=hero.hp; hero.hp=Math.min(hero.max,hero.hp+hero.max*.03*dt); W.healAcc+=hero.hp-h0; for(const d of defs) if(near(d.x,d.z,6)&&mossHeal(d,dt)) a.list.push(d);
      W.healT+=dt; if(W.healT>=1){ W.healT=0; if(W.healAcc>=1) floatText(hero.x,hero.y+1.8,hero.z,'+'+Math.round(W.healAcc),MOSS_CSS); W.healAcc=0; } } } else W.idleT=0;   // build 172: "+N", what it actually mended this second (was a bare ✚ even at full health)
  // a guest's Mossheart, on the host: the same heal on the host's copy of that guest (its idle flag rides the input) and the defenses
  // near it. The guest's own page heals its own bar by the same rule, side by side, as passive regen always has -- the copy used to stay
  // put, so the bar showed health the guest didn't have and the next hit took it all back at once
  for(const w of guestsWith('mossheart_aegis')){ const g=w.g; if(w.idle&&!(g.dead>0)) g.mossT=(g.mossT||0)+dt; else g.mossT=0;
    const on=g.mossT>=2, a=auraMark('g:'+w.id,g.x,g.y||0,g.z,on);
    if(on){ const h0=g.hp; g.hp=Math.min(g.max,g.hp+g.max*.03*dt); g.mossAcc=(g.mossAcc||0)+g.hp-h0; for(const d of defs) if(Math.hypot(d.x-g.x,d.z-g.z)<=6&&mossHeal(d,dt)) a.list.push(d);
      g.mossFx=(g.mossFx||0)+dt; if(g.mossFx>=1){ g.mossFx=0; if(g.mossAcc>=1) floatText(g.x,(g.y||0)+1.8,g.z,'+'+Math.round(g.mossAcc),MOSS_CSS); g.mossAcc=0; } } }
  aurasTick(dt);   // after both: this frame's wearers are marked, and any not marked fade out
  if(anyWears('gloomcap_censer')) for(const d of defs){ if(d.pop<1&&nearWearer('gloomcap_censer',d.x,d.z,6)) d.pop=Math.min(1,d.pop+dt*2); }
  if(anyWears('hourglass_of_hollow_sand')&&!W.hour&&S.phase==='wave'&&S.crystal<CRYSTAL_MAX*.3){ W.hour=true; for(const e of enemies) if(!e.dead) e.crawlT=4; toast('The sand runs out — the horde crawls'); if(SFX.rift) SFX.rift(); if(netRole()==='host') window.__net.send('toast','The sand runs out — the horde crawls'); } }   // co-op: every guest hears it too, whoever wears the Hourglass
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); tick(dt); }; }
// ---- the return: at load, when the hideout closes, when a title-screen visit ends (both show as open -> closed)
let wasOpen=false; setInterval(()=>{ const open=!!(window.__hideout&&window.__hideout.isOpen()); if(wasOpen&&!open) returnGear(); wasOpen=open; },400);
setTimeout(returnGear,1500);
window.__mythic={NAMED,has,id:mythicId,normalize,returnGear,KEY:RETURN_KEY,hurt:(e,d)=>hurt(e,d,0,0),hurtHero:d=>hurtHero(d),tear,state:()=>({wave:W.wave,swings:W.swings,mantle:W.mantle,tear:W.tear,hour:W.hour,oath:Object.keys(W.oath),idleT:+W.idleT.toFixed(2),auras:[...AURAS.values()].map(a=>({key:a.key,a:+a.a.toFixed(2),on:a.on,beams:a.beams.filter(b=>b.c.visible&&b.c.parent).length}))}),
  worn:wornIds,roots,asHero,wearers:()=>GW?GW.map(w=>({id:w.id,myth:w.myth.slice(),idle:!!w.idle})):[]};   // build 159 (5/7): for 99-network.js (a guest's input, a guest's roots and sword) and the suites
})();
