// ===== MYTHIC GEAR (build 152): the hideout's forge makes a tier one step above legendary -- rarity 5 -- and the game wears it.
// Two kinds, both Matt's: NAMED mythics (ten, a forge proc; fixed stats and a signature power; up to two worn at once, each
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
  old_lamplight:{name:'Old Lamplight',slot:'familiar',stats:{fdmg:30,frate:60,fproj:1},power:'+1 pet projectile, and your pet fires at whatever is being hit'},
  gloomcap_censer:{name:'Gloomcap Censer',slot:'charm',stats:{trate:20,tarea:18,regen:3},power:'defenses near you build 50% faster and fire 15% faster'},
  hourglass_of_hollow_sand:{name:'Hourglass of Hollow Sand',slot:'charm',stats:{spd:35,move:18,mana:40},power:'once a wave, when the crystal is about to fall, the horde crawls for 4 s'},
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
  const k=mythicId(rec); if(rec.tier==='named'||(rec.named&&k)){ if(!k) return null; it.named=k; it.name=NAMED[k].name; it.slot=NAMED[k].slot; it.stats=Object.assign({},NAMED[k].stats); it.rarity=5; it.power=NAMED[k].power; }
  // build 154/157: the set id and the weapon's kind ride along, so the hand shows the set's own weapon. A forged record calls
  // them set and art (art = sword/staff/polearm there); a game item that went to the hideout and came back calls them setId
  // and look, and its art is already a picture path
  { const sid=rec.set||rec.setId, lk=[rec.look,rec.art].find(v=>/^(sword|staff|polearm|bow)$/.test(v));
    if(sid&&typeof sid==='string') it.setId=sid.slice(0,24); if(lk) it.look=lk; }
  it.mythicTier=typeof rec.tier==='string'?rec.tier:(it.rarity>=5?'mythic':''); it.tier=tierOf(it.lvl); it.value=it.named?400:it.rarity>=5?250:[10,25,60,150,300][Math.max(0,Math.min(4,it.rarity|0))]; it.req=1;
  { const A=window.__mythicDrops&&window.__mythicDrops.art, pic=A&&A(it); if(pic) it.art=pic; else if(typeof rec.art==='string'&&/\.(jpe?g|png|webp)$/i.test(rec.art)) it.art=rec.art.slice(0,200); }   // build 157: Matt's picture on its card (87-mythicdrops.js)
  return it; }
function returnGear(){ let list=[]; try{ const a=JSON.parse(localStorage.getItem(RETURN_KEY)); if(Array.isArray(a)) list=a; }catch(e){} if(!list.length) return 0;
  let n=0; const left=[]; for(const rec of list){ const it=normalize(rec); if(!it){ continue; } if(Meta.onPickup(it,{x:hero.x,y:hero.y+1,z:hero.z})) n++; else left.push(rec); }
  try{ if(left.length) localStorage.setItem(RETURN_KEY,JSON.stringify(left)); else localStorage.removeItem(RETURN_KEY); }catch(e){}
  if(n) toast(n+' piece'+(n>1?'s':'')+' came back from the hideout — in your bag'); return n; }
// ---- the powers
const W={wave:-1,swings:0,mantle:false,tear:false,hour:false,oath:{},idleT:0,healT:0};
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
const MOTES=[];
function mossHeal(d,dt){ if(d.hp>=d.max) return; d.hp=Math.min(d.max,d.hp+2*dt); d.mossMote=(d.mossMote||0)-dt; if(d.mossMote>0) return; d.mossMote=.22;
  const top=(DEFS[d.kind]&&DEFS[d.kind].top)||1; const m=glow(0x8ef4c0,.5,.8); m.position.set(d.x+R(-.55,.55),baseFloor(d.x,d.z)+R(.2,Math.max(.6,top*.8)),d.z+R(-.55,.55)); m.name='mossMote'; m.userData.noOL=true; scene.add(m); MOTES.push({m,t:0}); }
function motesTick(dt){ for(let i=MOTES.length-1;i>=0;i--){ const o=MOTES[i]; o.t+=dt; const k=o.t/.9; o.m.position.y+=dt*1.1; o.m.material.opacity=.8*(1-k)*Math.min(1,o.t*6); o.m.scale.setScalar(.5*(1-k*.4)); if(k>=1){ scene.remove(o.m); o.m.material.dispose(); MOTES.splice(i,1); } } }
function tick(dt){ const wv=hallWave(); if(wv!==W.wave){ W.wave=wv; newWave(); } motesTick(dt);
  GW=(Meta.coopWear&&netRole()==='host')?Meta.coopWear():null; if(GW&&!GW.length) GW=null;   // the guests who wear named mythics, this frame (see GW above)
  if(anyWears('last_lantern')) for(const e of enemies){ if(e.dead) continue; const lit=nearWearer('last_lantern',e.x,e.z,5); if(lit){ e.lanternT=.35; if(!e.lanternFx&&e.mdl&&e.mdl.g){ const g=glow(0xffd27a,1.7,.35); g.position.y=(e.h||1.2)*.6; e.mdl.g.add(g); e.lanternFx=g; } } if(e.lanternFx) e.lanternFx.visible=e.lanternT>0; }
  if(has('mossheart_aegis')){ if(!hero.moving&&hero.swingT<0&&hero.dead<=0) W.idleT+=dt; else W.idleT=0; if(W.idleT>=2){ hero.hp=Math.min(hero.max,hero.hp+hero.max*.03*dt); for(const d of defs) if(near(d.x,d.z,6)) mossHeal(d,dt); W.healT+=dt; if(W.healT>=1){ W.healT=0; floatText(hero.x,hero.y+1.6,hero.z,'✚','#8ef4c0'); } } } else W.idleT=0;
  // a guest's Mossheart, on the host: the same heal on the host's copy of that guest (its idle flag rides the input) and the defenses
  // near it. The guest's own page heals its own bar by the same rule, side by side, as passive regen always has -- the copy used to stay
  // put, so the bar showed health the guest didn't have and the next hit took it all back at once
  for(const w of guestsWith('mossheart_aegis')){ const g=w.g; if(w.idle&&!(g.dead>0)) g.mossT=(g.mossT||0)+dt; else g.mossT=0;
    if(g.mossT>=2){ g.hp=Math.min(g.max,g.hp+g.max*.03*dt); for(const d of defs) if(Math.hypot(d.x-g.x,d.z-g.z)<=6) mossHeal(d,dt); g.mossFx=(g.mossFx||0)+dt; if(g.mossFx>=1){ g.mossFx=0; floatText(g.x,g.y+1.6,g.z,'✚','#8ef4c0'); } } }
  if(anyWears('gloomcap_censer')) for(const d of defs){ if(d.pop<1&&nearWearer('gloomcap_censer',d.x,d.z,6)) d.pop=Math.min(1,d.pop+dt*2); }
  if(anyWears('hourglass_of_hollow_sand')&&!W.hour&&S.phase==='wave'&&S.crystal<CRYSTAL_MAX*.3){ W.hour=true; for(const e of enemies) if(!e.dead) e.crawlT=4; toast('The sand runs out — the horde crawls'); if(SFX.rift) SFX.rift(); if(netRole()==='host') window.__net.send('toast','The sand runs out — the horde crawls'); } }   // co-op: every guest hears it too, whoever wears the Hourglass
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); tick(dt); }; }
// ---- the return: at load, when the hideout closes, when a title-screen visit ends (both show as open -> closed)
let wasOpen=false; setInterval(()=>{ const open=!!(window.__hideout&&window.__hideout.isOpen()); if(wasOpen&&!open) returnGear(); wasOpen=open; },400);
setTimeout(returnGear,1500);
window.__mythic={NAMED,has,id:mythicId,normalize,returnGear,KEY:RETURN_KEY,hurt:(e,d)=>hurt(e,d,0,0),hurtHero:d=>hurtHero(d),tear,state:()=>({wave:W.wave,swings:W.swings,mantle:W.mantle,tear:W.tear,hour:W.hour,oath:Object.keys(W.oath),idleT:+W.idleT.toFixed(2)}),
  worn:wornIds,roots,asHero,wearers:()=>GW?GW.map(w=>({id:w.id,myth:w.myth.slice(),idle:!!w.idle})):[]};   // build 159 (5/7): for 99-network.js (a guest's input, a guest's roots and sword) and the suites
})();
