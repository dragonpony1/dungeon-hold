// ===== TALENTS: A SPEC TREE PER HERO (build 336). Matt: "a spec tree ... instead of adding gold to upgrade gear spots, alothoug we keep that but a full fledged spec tree" / "people love a spec
// tree" / "proc'ing gear and spec tree is secret sauce" / "yes spec tree replaces skill tab" / "it needs to say spec tree or talents on the tab" / "ok make it so". The Battle Witch first.
// Two rules from Matt shaped it:
//   * "you spend a talent point ... and you can't really tell much diffrence ... it just feels like putting money in a savings account" -- so EVERY rank shows: bigger bolts, a pierce, a blast,
//     a spread of three, slowed mobs oozing green, a purple sigil over marked ones, thorns back at whoever hits you, a green glow on towers near you, towers regrowing, extra mana orbs...
//   * "most gamers will only play a session or two, maybe finish the campaign, so its like give em the game, while they're playing" -- points come fast: one a level PLUS one for every
//     campaign wave ever held (each counted once), so a first map nearly fills a branch and a finished campaign most of the tree; N opens the tree anywhere; a card says when a point lands;
//     respec is free.
// Three branches of five tiers; a tier opens with points spent in its branch (0 / 3 / 6 / 7 / 10 -- a branch takes 11). A hero with a tree spends there instead of on the flat skills (which
// still serve the heroes whose trees are not made yet). Saved per hero in localStorage 'dd_talents'; waves held in 'dd_waves_held'.
(function(){
'use strict';
const KEY='dd_talents', WKEY='dd_waves_held', GATE=[0,3,6,7,10];
const TREES={ witch:{ name:'THE BATTLE WITCH', branches:[
  { id:'storm', name:'STORM', ic:'⚡', col:'#7fd8ff', nodes:[
    { id:'charged', tier:0, ranks:3, ic:'🔷', name:'Charged Bolts', stat:{dmg:.06}, chip:r=>'bigger bolts'+(r>=3?' · pierce':'') },
    { id:'quick',   tier:1, ranks:3, ic:'💨', name:'Quickcast',     stat:{spd:.04,move:.04}, chip:r=>'faster'+(r>=3?' · 5th cast ×3':'') },
    { id:'fork',    tier:2, ranks:1, ic:'🌩', name:'Forked Lightning', key:true, chip:()=>'4th bolt ⤳ chains 2' },
    { id:'overload',tier:3, ranks:3, ic:'💥', name:'Overload',      chip:r=>'bolts blast · '+[0,.9,1.3,1.7][r]+'m' },
    { id:'tempest', tier:4, ranks:1, ic:'🌪', name:'Tempest', cap:true, chip:()=>'✦ Starfall strikes ×4 more' } ] },
  { id:'hex', name:'HEX', ic:'🕸', col:'#c9a8ff', nodes:[
    { id:'wither',  tier:0, ranks:3, ic:'🐌', name:'Withering',     chip:r=>'hit ⤳ slowed '+r+'s' },
    { id:'mark',    tier:1, ranks:3, ic:'🎯', name:'Hex Mark',      chip:r=>'marked take +'+5*r+'%' },
    { id:'rot',     tier:2, ranks:1, ic:'☠', name:'Rot', key:true, chip:()=>'marked kill ⤳ poison spreads' },
    { id:'briar',   tier:3, ranks:3, ic:'🌵', name:'Briar Skin',    stat:{hp:.05}, chip:r=>'thorns '+15*r+'% back' },
    { id:'doom',    tier:4, ranks:1, ic:'💀', name:'Doom', cap:true, chip:()=>'✦ every 10th kill explodes' } ] },
  { id:'garden', name:'GARDEN', ic:'🌿', col:'#8ef05a', nodes:[
    { id:'ward',    tier:0, ranks:3, ic:'🏰', name:'Wardkeeper',    stat:{tow:.04}, chip:r=>'towers near you +'+8*r+'%' },
    { id:'roots',   tier:1, ranks:3, ic:'🪵', name:'Deep Roots',    stat:{thp:.08,tcd:.03}, chip:r=>'towers regrow '+r+'%/s' },
    { id:'grasp',   tier:2, ranks:1, ic:'🌱', name:'Rootgrasp', key:true, chip:()=>'10% ⤳ rooted' },
    { id:'bounty',  tier:3, ranks:3, ic:'💧', name:'Bounty',        stat:{mana:.08,fam:.08}, chip:r=>'+'+8*r+'% ◆ · extra orbs' },
    { id:'overgrow',tier:4, ranks:1, ic:'🌳', name:'Overgrowth', cap:true, chip:()=>'✦ kills heal towers' } ] } ] },
  // build 395 (Matt: "yes" to the plan -- BULWARK: tougher armor, a shield bash, thorns, a few seconds nothing can hurt him; BLADE: a wider, harder sweep, every 3rd swing bleeds, Whirlwind spins twice;
  // WARDEN: towers near him hit harder, hedges grow longer, the Mouse Trap resets faster, towers near him fire faster while he stands still). Ids start with k so no Witch effect ever reads them.
  knight:{ name:'THE GNOME KNIGHT', branches:[
  { id:'bulwark', name:'BULWARK', ic:'🛡', col:'#9fc3ff', nodes:[
    { id:'kplate',  tier:0, ranks:3, ic:'🪖', name:'Iron Plate',   stat:{hp:.06}, chip:r=>'+'+4*r+' armor · +'+6*r+'% health' },
    { id:'kbash',   tier:1, ranks:3, ic:'🛡', name:'Shield Bash',  chip:r=>'4th swing ⤳ bash · stun '+(.4*r).toFixed(1)+'s' },
    { id:'kthorns', tier:2, ranks:1, ic:'🌵', name:'Thorns', key:true, chip:()=>'hit him ⤳ 25% back' },
    { id:'kstand',  tier:3, ranks:3, ic:'🏰', name:'Last Stand',   stat:{hp:.04}, chip:r=>'low health ⤳ −'+10*r+'% harm' },
    { id:'kaegis',  tier:4, ranks:1, ic:'✨', name:'Aegis', cap:true, chip:()=>'✦ near death ⤳ 3 s untouchable' } ] },
  { id:'blade', name:'BLADE', ic:'⚔', col:'#ff8a6a', nodes:[
    { id:'kedge',   tier:0, ranks:3, ic:'🗡', name:'Keen Edge',    stat:{dmg:.07}, chip:r=>'+'+7*r+'% sword' },
    { id:'ksweep',  tier:1, ranks:3, ic:'🌙', name:'Wide Sweep',   chip:r=>'reach +'+12*r+'%'+(r>=3?' · half circle':'') },
    { id:'kbleed',  tier:2, ranks:1, ic:'🩸', name:'Bleed', key:true, chip:()=>'3rd swing ⤳ bleed 3 s' },
    { id:'kfury',   tier:3, ranks:3, ic:'🔥', name:'Fury',         stat:{spd:.03}, chip:r=>'kill ⤳ swings +'+10*r+'% 3 s' },
    { id:'kcyclone',tier:4, ranks:1, ic:'🌪', name:'Cyclone', cap:true, chip:()=>'✦ Whirlwind spins twice' } ] },
  { id:'warden', name:'WARDEN', ic:'🚩', col:'#ffd27a', nodes:[
    { id:'kward',   tier:0, ranks:3, ic:'🚩', name:'Bannerman',    stat:{tow:.04}, chip:r=>'towers near you +'+8*r+'%' },
    { id:'kthorn',  tier:1, ranks:3, ic:'🌿', name:'Thornwright',  stat:{thp:.06}, chip:r=>'hedges +'+20*r+'% thorns' },
    { id:'klong',   tier:2, ranks:1, ic:'📏', name:'Long Hedge', key:true, chip:()=>'hedges 5 squares long' },
    { id:'ktrap',   tier:3, ranks:3, ic:'🪤', name:'Trapsmith',    stat:{tcd:.03}, chip:r=>'trap resets −'+15*r+'%' },
    { id:'kvigil',  tier:4, ranks:1, ic:'👁', name:'Vigil', cap:true, chip:()=>'✦ stand still ⤳ towers near +30% speed' } ] } ] } };
let ALL={}; try{ const a=JSON.parse(localStorage.getItem(KEY)); if(a&&typeof a==='object') ALL=a; }catch(e){}
const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(ALL)); }catch(e){} };
// waves held, each campaign wave once (seeded from the maps already cleared, so a returning player starts with theirs)
let HELD=new Set(); try{ const a=JSON.parse(localStorage.getItem(WKEY)); if(Array.isArray(a)) HELD=new Set(a); else { const cl=Math.max(0,Math.min(MAPS.length,parseInt(localStorage.getItem('ddMapsCleared'))||0)); for(let i=0;i<cl;i++){ const m=MAPS[i]; if(!m||m.id==='tutorial') continue; for(let w=1;w<=(m.waves||0);w++) HELD.add(m.id+':'+w); } } }catch(e){}
const saveHeld=()=>{ try{ localStorage.setItem(WKEY,JSON.stringify([...HELD])); }catch(e){} }; saveHeld();
const heroId=()=>window.__heroes?window.__heroes.pick():'knight';
const tree=()=>TREES[heroId()]||null;
const mine=()=>{ const h=heroId(); return ALL[h]||(ALL[h]={}); };
const rank=id=>tree()?(mine()[id]|0):0;
const total=()=>Math.max(0,((Meta.level&&Meta.level())||1)-1)+HELD.size;
const spent=()=>Object.values(mine()).reduce((s,v)=>s+(v|0),0);
const avail=()=>Math.max(0,total()-spent());
const branchSpent=b=>b.nodes.reduce((s,n)=>s+rank(n.id),0);
const nodeOf=id=>{ const T=tree(); if(!T) return null; for(const b of T.branches) for(const n of b.nodes) if(n.id===id) return {b,n}; return null; };
const open=(b,n)=>branchSpent(b)>=GATE[n.tier];
function spend(id){ const f=nodeOf(id); if(!f) return false; const {b,n}=f; if(!avail()||!open(b,n)||rank(id)>=n.ranks) return false; mine()[id]=rank(id)+1; save(); if(typeof applyGear==='function') applyGear(); try{ Meta.save&&Meta.save(); }catch(e){} SFX.place&&SFX.place(); return true; }
function respec(){ if(!spent()) return false; ALL[heroId()]={}; save(); if(typeof applyGear==='function') applyGear(); try{ Meta.save&&Meta.save(); }catch(e){} toast('Talents refunded — '+avail()+' to spend'); return true; }   // free: try things
{ const prev=Meta.onWaveHeld; Meta.onWaveHeld=function(w){ const r=prev.apply(this,arguments); if(!SURVIVAL&&!TUTORIAL&&MAP&&MAP.id!=='tutorial'){ const k=MAP.id+':'+S.wave; if(!HELD.has(k)){ HELD.add(k); saveHeld(); } }
    if(tree()&&avail()>0&&window.__lesson&&window.__lesson.flow) window.__lesson.flow({ic:'✦',title:'+1 TALENT',css:'#ffd27a',steps:[{ic:{k:'N'},t:'Talents'},{ic:'✦',t:avail()+' to spend'}]},4);
    return r; }; }
// ---- the stats: a hero with a tree takes her numbers from it
function talentMult(k){ const T=tree(); let v=0; for(const b of T.branches) for(const n of b.nodes){ const r=rank(n.id); if(r&&n.stat&&n.stat[k]) v+=n.stat[k]*r; } return v; }
{ const prev=Meta.mult; Meta.mult=k=>tree()?(prev(k)||0)-skillMult(k)+talentMult(k):prev(k); }   // build 395: the tree stands in for the flat skills only -- the armor sets (92-sets.js, 93-gearsets.js) still add on top (they were being dropped for the Witch since 336)
{ const prev=Meta.points; Meta.points=()=>tree()?avail():prev(); }
// ---- her bolts: bigger with each rank of Charged Bolts, piercing at III; Overload's blast; Quickcast III's spread of three every 5th cast (82-staff.js asks for these as she casts)
let castN=0;
function boltMods(){ if(!tree()) return null; const c=rank('charged'), o=rank('overload'), q=rank('quick'); return { size:1+.2*c, pierce:c>=3?1:0, splash:[0,.9,1.3,1.7][o], twin:q>=3&&(++castN)%5===0 }; }
// ---- the procs, on her own bolts (82-staff.js: window.__mineHit around the hit, then onBolt) and her own kills
const BOSSES=new Set(['cyclops','pigflail','pigdagger','pigsling','trollboss','archhag']);
let boltN=0, killN=0;
{ const prev=hurt; hurt=function(e,dmg,kx,kz){ if(e&&!e.dead&&tree()){ const hm=rank('mark'); if(hm&&e.hexT>0) dmg*=1+.05*hm; } return prev.call(this,e,dmg,kx,kz); }; }
function zap(a,b){ for(let i=1;i<6;i++){ const t=i/6; const g=glow(0x9fe8ff,.55,.9); g.position.set(a.x+(b.x-a.x)*t,(a.y+a.h*.6)+((b.y+b.h*.6)-(a.y+a.h*.6))*t+Math.sin(i*2.1)*.25,a.z+(b.z-a.z)*t); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); } }
function puff(x,y,z,col,s){ const g=glow(col,s,.85); g.position.set(x,y,z); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); }
function onBolt(e,b){ if(!tree()||!e) return; e.mineT=S.t; const hm=rank('mark'); if(hm) e.hexT=4; const w=rank('wither'); if(w){ e.slowT=Math.max(e.slowT||0,w); e.witherT=Math.max(e.witherT||0,w); }
  if(rank('grasp')&&!e.dead&&Math.random()<.1&&!BOSSES.has(e.kind)){ e.holdT=Math.max(e.holdT||0,1.5); floatText(e.x,e.y+e.h+.3,e.z,'🌱 ROOTED','#8ef05a'); }
  if(rank('fork')&&(++boltN)%4===0){ const near=enemies.filter(o=>!o.dead&&o!==e&&Math.hypot(o.x-e.x,o.z-e.z)<4).sort((p,q)=>Math.hypot(p.x-e.x,p.z-e.z)-Math.hypot(q.x-e.x,q.z-e.z)).slice(0,2);
    for(const o of near){ zap(e,o); window.__mineHit=true; try{ hurt(o,Math.round(b.dmg*.5*10)/10,0,0); }finally{ window.__mineHit=false; } o.mineT=S.t; } if(near.length) floatText(e.x,e.y+e.h+.6,e.z,'⚡ FORK','#9fe8ff'); } }
{ const prev=kill; kill=function(e){ const was=e&&!e.dead; const r=prev.apply(this,arguments); if(!was||!tree()) return r;
    const b=rank('bounty'); if(b&&Math.random()<.08*b&&typeof spawnOrbs==='function'){ spawnOrbs(e.x,e.z,Math.max(1,e.mana|0)); floatText(e.x,e.y+e.h+.2,e.z,'+◆','#7fd8ff'); }
    if(!(e.mineT>=0)||S.t-e.mineT>.6) return r;   // below: her own kills only
    if(rank('rot')&&e.hexT>0){ for(const o of enemies){ if(o.dead||o===e||Math.hypot(o.x-e.x,o.z-e.z)>3) continue; o.poisonT=Math.max(o.poisonT||0,3); o.poisonDmg=Math.max(o.poisonDmg||0,Math.round(heroDmg()*.2*10)/10); } puff(e.x,e.y+.6,e.z,0x8ef05a,2.2); floatText(e.x,e.y+e.h,e.z,'☠ ROT','#8ef05a'); }
    if(rank('doom')&&(++killN)%10===0){ const dmg=Math.round(heroDmg()*2*10)/10; window.__mineHit=true; try{ for(const o of enemies.slice()){ if(o.dead||Math.hypot(o.x-e.x,o.z-e.z)>3) continue; hurt(o,dmg,0,0); } }finally{ window.__mineHit=false; } floatText(e.x,e.y+1.6,e.z,'💀 DOOM','#ff9a6a'); puff(e.x,e.y+.8,e.z,0xff7a3a,4.5); camShake=Math.max(camShake,.3); }
    if(rank('overgrow')){ let n=0; for(const d of defs){ if(!(d.max>0)||Math.hypot(d.x-e.x,d.z-e.z)>8||d.hp>=d.max) continue; d.hp=Math.min(d.max,d.hp+d.max*.02); n++; puff(d.x,(d.top||1)+.3,d.z,0x8ef05a,1.2); } }
    return r; }; }
// Briar Skin: a mob that strikes her (up close) takes a share of the blow back
{ const prev=landHit; landHit=function(e,tg){ const r=prev.apply(this,arguments); const br=rank('briar'); if(br&&tg&&tg.kind==='hero'&&!tg.ranged&&tg.hero&&tg.hero.hurt===hurtHero&&e&&!e.dead){ hurt(e,Math.max(1,Math.round(e.dmg*.15*br)),0,0); puff(e.x,e.y+e.h*.6,e.z,0x8ef05a,1); floatText(e.x,e.y+e.h+.2,e.z,'🌵','#8ef05a'); } return r; }; }
// Wardkeeper: towers near her hit harder (and glow green so you can see it); Deep Roots: a tower nothing has hit for 3 s grows its health back
const near=d=>hero&&hero.dead<=0&&Math.hypot(d.x-hero.x,d.z-hero.z)<=8;
{ const prev=stat; stat=function(d,k){ const v=prev.apply(this,arguments); if(k==='dmg'&&tree()){ const w=rank('ward')+rank('kward'); if(w&&near(d)) return Math.round(v*(1+.08*w)*10)/10; } return v; }; }
{ const prev=hurtDef; hurtDef=function(d,dmg){ if(d) d.hitT=S.t; return prev.apply(this,arguments); }; }
// Tempest: Starfall keeps striking -- four more falls over three seconds at the spot, each half the cast (73-specials.js calls this after the host's/solo player's own cast lands)
let tempest=[];
function onSpecial(hid,p){ if(hid==='knight'&&rank('kcyclone')&&p){ cyclone.push({at:S.t+1.15,dmg:p.dmg}); return; } if(hid!=='witch'||!rank('tempest')||!p) return; for(let i=1;i<=4;i++) tempest.push({at:S.t+i*.7,x:p.x,z:p.z,dmg:Math.round(p.dmg*.5*10)/10}); floatText(p.x,baseFloor(p.x,p.z)+2.8,p.z,'🌪 TEMPEST','#9fe8ff'); }
// the per-frame part: marks and ooze drawn, towers glowing/regrowing, the Tempest's falls
const SIG=new Map(), OOZE=new Map();
function tag(map,e,col,size,y){ let s=map.get(e); if(!s){ s=glow(col,size,.9); scene.add(s); map.set(e,s); } s.position.set(e.x,e.y+y,e.z); s.material.opacity=.7+.2*Math.sin(S.t*6); }
function untag(map,e){ const s=map.get(e); if(s){ scene.remove(s); s.material.dispose(); map.delete(e); } }
{ const prev=updateEnemies; updateEnemies=function(dt){ prev(dt);
    for(const e of enemies){ if(e.hexT>0) e.hexT-=dt; if(e.witherT>0) e.witherT-=dt; if(!e.dead&&e.hexT>0) tag(SIG,e,0xb04cff,.9,e.h+.55); else untag(SIG,e); if(!e.dead&&e.witherT>0) tag(OOZE,e,0x6aff4a,1.3,.25); else untag(OOZE,e); }
    for(const [e] of SIG) if(!enemies.includes(e)) untag(SIG,e); for(const [e] of OOZE) if(!enemies.includes(e)) untag(OOZE,e);
    const w=rank('ward')+rank('kward'), rr=rank('roots');
    for(const d of defs){ let ring=d.mdl&&d.mdl.userData.wardRing; const on=!!(w&&near(d));
      if(on&&!ring&&d.mdl){ ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.25,32),new THREE.MeshBasicMaterial({color:C(rank('kward')?0xffd27a:0x8ef05a),transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); ring.rotation.x=-PI/2; ring.position.y=.08; ring.userData.noOL=true; d.mdl.add(ring); d.mdl.userData.wardRing=ring; }
      if(ring){ ring.visible=on; if(on) ring.material.opacity=.45+.2*Math.sin(S.t*3); }
      if(rr&&d.max>0&&d.hp<d.max&&S.t-(d.hitT||-99)>3) d.hp=Math.min(d.max,d.hp+d.max*.01*rr*dt); }
    while(tempest.length&&S.t>=tempest[0].at){ const q=tempest.shift(); window.__mineHit=true; try{ for(const e of enemies.slice()){ if(e.dead||Math.hypot(e.x-q.x,e.z-q.z)>5+e.r*.5) continue; hurt(e,q.dmg,0,0); e.mineT=S.t; } }finally{ window.__mineHit=false; } puff(q.x,baseFloor(q.x,q.z)+1.2,q.z,0x9fe8ff,3.4); } }; }
// ===== THE GNOME KNIGHT'S TALENTS (build 395). Every rank shows: a steel flash and BASH on the 4th swing, red drips on bleeding mobs, a moon-arc of the sweep, a red glow while Fury runs,
// a gold shell while Aegis holds, the Whirlwind going off again, gold rings under towers near him (brighter and quicker while Vigil holds), hedges that stand five squares long.
const isK=()=>heroId()==='knight'&&!!tree();
const meleeOn=()=>{ const wo=window.__weapons&&window.__weapons.mounted&&window.__weapons.mounted(); return !(wo&&/^(staff|bow)-/.test(wo.name||'')); };
const KBOSS=new Set(['cyclops','pigflail','pigdagger','pigsling','trollboss','archhag','corruptor']);
const KC={ swings:0, bash:0, bleed:0, rush:0, aegis:0, blocked:0, thorns:0, cyclone:0, sweep:0, vigil:0 };
let swingN=0, rushT=-1, aegisT=-1, aegisReady=0, stillT=0, lastHX=0, lastHZ=0; const cyclone=[], ARCS=[];
const BLEED=new Map();
// Iron Plate: armor on top of his gear's
{ const prev=heroStat; heroStat=function(k){ const v=prev.apply(this,arguments); if(k==='def'&&isK()) return v+4*rank('kplate'); return v; }; }
// Fury: a kill of his own quickens his swings for three seconds
{ const prev=Meta.mult; Meta.mult=k=>{ let v=prev(k)||0; if(k==='spd'&&isK()&&S.t<rushT) v+=.1*rank('kfury'); return v; }; }
// Last Stand, Aegis (and the shell holding): what reaches him
{ const prev=hurtHero; hurtHero=function(dmg){ if(!isK()||hero.dead>0) return prev.apply(this,arguments);
    if(S.t<aegisT){ KC.blocked++; puff(hero.x,hero.y+1.3,hero.z,0xffe08a,1.6); return; }
    const ls=rank('kstand'); if(ls&&hero.hp<hero.max*.35) dmg=dmg*(1-.1*ls);
    if(rank('kaegis')&&S.t>=aegisReady){ const est=dmg*(1-Math.min(75,heroStat('def'))/100); if(hero.hp-est<=hero.max*.3){ aegisT=S.t+3; aegisReady=S.t+30; KC.aegis++; floatText(hero.x,hero.y+3.2,hero.z,'✨ AEGIS','#ffe08a'); puff(hero.x,hero.y+1.3,hero.z,0xffe08a,4.5); camShake=Math.max(camShake,.25); try{ SFX.setBong&&SFX.setBong(); }catch(e){} return; } }
    return prev.call(this,dmg); }; }
// Thorns: a mob that strikes him up close takes a quarter of the blow back
{ const prev=landHit; landHit=function(e,tg){ const r=prev.apply(this,arguments); if(isK()&&rank('kthorns')&&tg&&tg.kind==='hero'&&!tg.ranged&&tg.hero&&tg.hero.hurt===hurtHero&&e&&!e.dead){ hurt(e,Math.max(1,Math.round(e.dmg*.25)),0,0); KC.thorns++; puff(e.x,e.y+e.h*.6,e.z,0x9fc3ff,1); floatText(e.x,e.y+e.h+.2,e.z,'🌵','#9fc3ff'); } return r; }; }
// the sword: Wide Sweep (further, and at III a half circle), Shield Bash every 4th swing, Bleed every 3rd
function sweepArc(sw){ const ang=PI*(.55+.15*sw), g=new THREE.Mesh(new THREE.RingGeometry((hero.reach||2.4)*.35,(hero.reach||2.4)*(1+.12*sw),28,1,-ang/2,ang),new THREE.MeshBasicMaterial({color:C(0xffc0a0),transparent:true,opacity:.45,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  g.userData.noOL=true; g.rotation.x=-PI/2; const w=new THREE.Group(); w.add(g); w.position.set(hero.x,(hero.y||0)+.25,hero.z); w.rotation.y=hero.yaw-PI/2; g.rotation.z=0; scene.add(w); ARCS.push({w,g,t:0}); KC.sweep++; }
{ const prev=hitCone; hitCone=function(){ if(!isK()||!meleeOn()) return prev.apply(this,arguments);
    const sw=rank('ksweep'), r0=hero.reach||2.4; const before=new Map(); for(const e of enemies) if(!e.dead) before.set(e,e.hp);
    hero.reach=r0*(1+.12*sw); try{ prev.apply(this,arguments); }finally{ hero.reach=r0; }
    const fx=Math.sin(hero.yaw), fz=Math.cos(hero.yaw);
    if(sw>=3) for(const e of enemies){ if(e.dead||!before.has(e)||e.hp<before.get(e)) continue; const dx=e.x-hero.x, dz=e.z-hero.z, d=Math.hypot(dx,dz); if(d<r0*1.36+e.r&&(dx*fx+dz*fz)/Math.max(d,.01)>-.05) hurt(e,heroDmg(),fx*1.4,fz*1.4); }
    if(sw) sweepArc(sw);
    const hit=[]; for(const [e,hp] of before) if(e.dead||e.hp<hp) hit.push(e); for(const e of hit) e.mineT=S.t;
    swingN++; KC.swings++; if(!hit.length) return;
    if(rank('kbleed')&&swingN%3===0){ const bd=Math.round(heroDmg()*.4*10)/10; for(const e of hit){ if(e.dead) continue; e.poisonT=Math.max(e.poisonT||0,3); e.poisonDmg=Math.max(e.poisonDmg||0,bd); e.bleedT=3; } KC.bleed++; const e=hit[0]; floatText(e.x,e.y+e.h+.5,e.z,'🩸 BLEED','#ff5a5a'); }
    const bs=rank('kbash'); if(bs&&swingN%4===0){ const bd=Math.round(heroDmg()*.5*10)/10; for(const e of hit){ if(e.dead) continue; const dx=e.x-hero.x, dz=e.z-hero.z, l=Math.max(.01,Math.hypot(dx,dz)); hurt(e,bd,dx/l*4,dz/l*4); if(!KBOSS.has(e.kind)) e.holdT=Math.max(e.holdT||0,.4*bs); }
      KC.bash++; puff(hero.x+fx*1.4,hero.y+1.1,hero.z+fz*1.4,0xcfe0ff,2.4); floatText(hero.x+fx*1.6,hero.y+2.6,hero.z+fz*1.6,'🛡 BASH','#cfe0ff'); camShake=Math.max(camShake,.12); } }; }
{ const prev=kill; kill=function(e){ const was=e&&!e.dead; const r=prev.apply(this,arguments); if(was&&isK()&&rank('kfury')&&e.mineT>=0&&S.t-e.mineT<=.6){ if(S.t>=rushT) puff(hero.x,hero.y+1.2,hero.z,0xff6a3a,2); rushT=S.t+3; KC.rush++; } return r; }; }
// Thornwright: the hedge's thorns bite harder; Trapsmith: the Mouse Trap resets quicker; Vigil: towers near a Knight who stands still fire faster
{ const prev=thornsBack; thornsBack=function(d,dmg){ const v=prev.apply(this,arguments); const t=isK()?rank('kthorn'):0; return t?Math.round(v*(1+.2*t)*10)/10:v; }; }
const vigilOn=()=>isK()&&rank('kvigil')&&hero.dead<=0&&stillT>=1;
{ const prev=stat; stat=function(d,k){ let v=prev.apply(this,arguments); if(k==='cd'&&d&&isK()){ if(d.kind==='trap'){ const t=rank('ktrap'); if(t) v*=1-.15*t; } if(vigilOn()&&near(d)&&d.kind!=='trap') v*=.77; } return v; }; }
// Long Hedge: a hedge he sets down stands five squares long (the model stretched to match)
const LONG_K=1.6;
{ const prev=footprintCells; footprintCells=function(kind,x,z,yaw){ const cells=prev.apply(this,arguments); if(kind!=='spike'||!(isK()&&rank('klong'))) return cells; const ax=Math.cos(yaw||0), az=-Math.sin(yaw||0);
    for(const s of [-3.9,3.9]){ const cx=wc(x+ax*s), cz=wcz(z+az*s); if(!inb(cx,cz)) continue; const i=idx(cx,cz); if(!cells.includes(i)) cells.push(i); } return cells; }; }
{ const prev=placeDefAt; placeDefAt=function(kind,x,z,rot){ const d=prev.apply(this,arguments); if(d&&kind==='spike'&&isK()&&rank('klong')) d.long=true; return d; }; }
holdHedgeLength=function(){ for(const d of defs){ const s=d.kind==='spike'&&d.mdl.userData.stretch; if(s) s.scale.x=HEDGE_STRETCH*(d.long?LONG_K:1)/markGrow(d.lvl); } };
{ const prev=updateGhost; updateGhost=function(){ prev.apply(this,arguments); if(placing==='spike'&&ghost&&ghost.userData.stretch) ghost.userData.stretch.scale.x=HEDGE_STRETCH*(isK()&&rank('klong')?LONG_K:1); }; }
// the per-frame part: stillness for Vigil, bleeding drips, the sweep arcs, the Fury/Aegis glow on him, the Cyclone's second spin
let AURA=null;
{ const prev=updateEnemies; updateEnemies=function(dt){ prev(dt);
    const mv=Math.hypot(hero.x-lastHX,hero.z-lastHZ); lastHX=hero.x; lastHZ=hero.z; const was=vigilOn(); stillT=mv<.02*Math.max(1,dt*60)?stillT+dt:0; if(!was&&vigilOn()){ KC.vigil++; floatText(hero.x,hero.y+3,hero.z,'👁 VIGIL','#ffd27a'); }
    for(const e of enemies){ if(e.bleedT>0) e.bleedT-=dt; if(!e.dead&&e.bleedT>0) tag(BLEED,e,0xff2a2a,.8,e.h*.5+.2*Math.sin(S.t*9+e.x)); else untag(BLEED,e); } for(const [e] of BLEED) if(!enemies.includes(e)) untag(BLEED,e);
    for(let i=ARCS.length-1;i>=0;i--){ const a=ARCS[i]; a.t+=dt; a.g.material.opacity=.45*(1-a.t/.25); if(a.t>=.25){ scene.remove(a.w); a.g.geometry.dispose(); a.g.material.dispose(); ARCS.splice(i,1); } }
    const col=S.t<aegisT?0xffe08a:(S.t<rushT&&isK()?0xff5a2a:0); if(col){ if(!AURA){ AURA=glow(col,2.6,.5); scene.add(AURA); } AURA.material.color.setHex(col); AURA.visible=hero.dead<=0; AURA.position.set(hero.x,hero.y+1.2,hero.z); AURA.material.opacity=(S.t<aegisT?.55:.35)+.15*Math.sin(S.t*8); } else if(AURA) AURA.visible=false;
    if(vigilOn()) for(const d of defs){ const ring=d.mdl&&d.mdl.userData.wardRing; if(ring&&ring.visible) ring.material.opacity=.6+.3*Math.sin(S.t*9); }
    while(cyclone.length&&S.t>=cyclone[0].at){ const q=cyclone.shift(); KC.cyclone++; window.__mineHit=true; try{ for(const e of enemies.slice()){ if(e.dead) continue; const dx=e.x-hero.x, dz=e.z-hero.z, d=Math.hypot(dx,dz); if(d>=4+e.r) continue; const l=Math.max(d,.01); hurt(e,q.dmg,dx/l*3,dz/l*3); e.mineT=S.t; } }finally{ window.__mineHit=false; }
      if(window.__whirl){ window.__whirl.spin(); window.__whirl.vortex(hero.x,hero.z); } if(typeof shockRing==='function') shockRing(hero.x,baseFloor(hero.x,hero.z),hero.z,4); floatText(hero.x,hero.y+3,hero.z,'🌪 CYCLONE','#dfe8ff'); } }; }
// ---- the TALENTS tab: the tree for a hero who has one; the flat skills (under the same tab name) for one who doesn't yet. N opens it from anywhere.
const css=document.createElement('style'); css.textContent=
 '.tal-top{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}.tal-top h3{margin:0;font:800 16px Georgia,serif;letter-spacing:2px;color:#ffd27a}.tal-pts{padding:3px 10px;border-radius:12px;background:#3a2a10;border:1px solid #ffd27a;color:#ffd27a;font:800 13px system-ui}.tal-pts.none{opacity:.55}'
+'.tal-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.tal-col{border-radius:12px;background:#140e1a;border:1px solid #3a2a44;padding:8px 6px 10px;text-align:center}'
+'.tal-head{font:800 13px Georgia,serif;letter-spacing:2px;margin-bottom:6px}.tal-head small{display:block;font:600 11px system-ui;opacity:.7;letter-spacing:0}'
+'.tal-node{position:relative;margin:0 auto;width:128px;padding:6px 4px 5px;border-radius:12px;border:2px solid #3a2a44;background:#1c1424;cursor:pointer;opacity:.5;filter:grayscale(.7);transition:transform .1s}'
+'.tal-node.open{opacity:1;filter:none}.tal-node.has{border-color:var(--tc);box-shadow:0 0 12px var(--tcg)}.tal-node.cap{border-radius:50% 50% 14px 14px}.tal-node.key{border-style:double;border-width:4px}'
+'.tal-node .i{font-size:24px;line-height:28px}.tal-node .n{font:700 11px Georgia,serif;color:#e8dcc8}.tal-node .c{font:600 10px system-ui;color:#bfae90;margin-top:2px}.tal-node .p{margin-top:3px;letter-spacing:2px;font-size:10px;color:var(--tc)}'
+'.tal-node .lk{position:absolute;top:4px;right:6px;font:700 10px system-ui;color:#bfae90}.tal-link{width:3px;height:12px;margin:0 auto;background:#3a2a44}.tal-link.lit{background:var(--tc);box-shadow:0 0 6px var(--tc)}'
+'.tal-node.buy{animation:talpulse 1.4s ease-in-out infinite}.tal-node.buy:hover{transform:translateY(-2px);border-color:#ffd27a}@keyframes talpulse{0%,100%{box-shadow:0 0 0 0 #ffd27a00}50%{box-shadow:0 0 0 3px #ffd27a66}}';
document.head.appendChild(css);
function pips(n,r){ let s=''; for(let i=0;i<n.ranks;i++) s+=i<r?'●':'○'; return s; }
function treeHtml(){ const T=tree(), a=avail(); let h='<div class="tal-top"><h3>✦ TALENTS · '+T.name+'</h3><span class="tal-pts'+(a?'':' none')+'">✦ '+a+' point'+(a===1?'':'s')+'</span><span class="tv-n">one a level + one a wave held · N opens this</span><span class="sp" style="flex:1"></span><button class="tv-btn sm" data-tal-respec="1"'+(spent()?'':' disabled')+'>Respec · free</button></div><div class="tal-cols">';
  for(const b of T.branches){ const bs=branchSpent(b); h+='<div class="tal-col" style="--tc:'+b.col+';--tcg:'+b.col+'66"><div class="tal-head" style="color:'+b.col+'">'+b.ic+' '+b.name+'<small>'+bs+' spent</small></div>';
    b.nodes.forEach((n,i)=>{ const r=rank(n.id), op=open(b,n), buy=op&&a>0&&r<n.ranks; if(i) h+='<div class="tal-link'+(r?' lit':'')+'"></div>';
      h+='<div class="tal-node'+(op?' open':'')+(r?' has':'')+(n.cap?' cap':'')+(n.key?' key':'')+(buy?' buy':'')+'" data-tal="'+n.id+'" title="'+n.name+'">'+(op?'':'<span class="lk">🔒'+GATE[n.tier]+'</span>')+'<div class="i">'+n.ic+'</div><div class="n">'+n.name+'</div><div class="c">'+n.chip(Math.max(1,r))+'</div><div class="p">'+pips(n,r)+'</div></div>'; });
    h+='</div>'; }
  return h+'</div>'; }
if(typeof tvRenderSkills==='function'){ const prev=tvRenderSkills; tvRenderSkills=function(){ const el=$('tv-skills'); if(!tree()||!el) return prev.apply(this,arguments); el.innerHTML=treeHtml(); }; }
function redraw(){ if(typeof tvRenderTab==='function') tvRenderTab(true); else if(typeof tvRenderSkills==='function') tvRenderSkills(); }
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-tal],[data-tal-respec]'); if(!t||!t.closest('#tv-skills')) return; e.stopPropagation();
  if(t.dataset.talRespec) respec(); else if(!spend(t.dataset.tal)){ const f=nodeOf(t.dataset.tal); if(f&&!open(f.b,f.n)) toast('🔒 '+GATE[f.n.tier]+' points in '+f.b.name+' opens it'); else if(!avail()) toast('No points — one a level, one a wave held'); }
  redraw(); },true);
function openTree(){ const TV=window.__tavern; if(!TV) return false; if(TV.isOpen()){ TV.close(); return false; } if(S.phase==='start') return false; TV.open(); TV.tab('skills'); return true; }
addEventListener('keydown',e=>{ if(e.code!=='KeyN'||e.repeat) return; const ae=document.activeElement; if(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA')) return; if(window.__hideout&&window.__hideout.isOpen&&window.__hideout.isOpen()) return; e.preventDefault(); openTree(); },true);
window.__talents={knight:()=>Object.assign({ swingN, rush:S.t<rushT, aegis:S.t<aegisT, stillT:+stillT.toFixed(2), vigil:!!vigilOn(), bleeding:BLEED.size, arcs:ARCS.length, queued:cyclone.length },KC), cast:()=>hitCone(),tree:()=>tree()&&heroId(),rank,spend,respec,avail,spent,total,held:()=>HELD.size,mult:k=>tree()?talentMult(k):null,boltMods,onBolt,onSpecial,openTree,gate:GATE,sig:()=>SIG.size,ooze:()=>OOZE.size,
  nodes:()=>{ const T=tree(); return T?T.branches.map(b=>({id:b.id,nodes:b.nodes.map(n=>({id:n.id,tier:n.tier,ranks:n.ranks,rank:rank(n.id),open:open(b,n)}))})):null; },state:()=>JSON.parse(JSON.stringify(ALL)),html:()=>tree()?treeHtml():''};
})();
