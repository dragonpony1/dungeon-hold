// ===== THE OTHER EIGHT SETS (build 167): "all these weapon sets will start to drop at a conservative rate". Matt's endings and
// art (assets/item-<key>-<slot>.jpg, set-<key>.jpg; the tavern's armor stands already use the same keys), each with a
// three-piece bonus, a five-piece power and a colour, on the same frame as the Void and the Forest (93-gearsets.js addSet).
// The weapons themselves are 86-setweapons.js's code-built ones (by the name's ending); models here carry only the armor stand.
// Build 157's mythic drops (87-mythicdrops.js) name their pieces with these same endings, so a Mythic Staff of Chaos counts
// toward the Chaos bonus like any other piece.
// Conservative: Rare-or-better rolls only, from wave 4, 1.2% a set climbing to 3% (the Void's rule is the ceiling), and
// once a player owns pieces of one of these, most set rolls go to THAT set, so one set completes before another starts.
(function(){
const add=d=>Meta.packs.add(d);
const chance=w=>w>=4?Math.min(.03,.012+.003*(w-4)):0;
const unlock=(key,name)=>({id:'stand-'+key,name:name+' Armor Stand',model:'armor-stand-'+key+'.glb',slot:'armor',rarity:3,reason:'The '+name+' set, complete'});
const art=key=>({sword:'item-'+key+'-sword.jpg',staff:'item-'+key+'-sword.jpg',bow:'item-'+key+'-sword.jpg',armor:'item-'+key+'-armor.jpg',charm:'item-'+key+'-charm.jpg',amulet:'item-'+key+'-amulet.jpg'});   /* one weapon picture a set (Matt drew the sword); the witch and the troll see it too */
const chime=(a,b,c)=>()=>{ beep(a,.35,'sine',.06,0); setTimeout(()=>beep(b,.35,'triangle',.05,0),90); setTimeout(()=>beep(c,.45,'sine',.045,300),180); };
const near=(x,z,r)=>Math.hypot(x-hero.x,z-hero.z)<=r;
const burst=(x,y,z,col,sc)=>{ const g=glow(col,sc||1.6,.85); g.position.set(x,y,z); scene.add(g); projs.push({kind:'splat',t:0,mesh:g}); };
let stormHits=0;
add({name:'of Chaos',key:'crimson',ic:'🔥',col:0xd83a3a,css:'#ff5a5a',emissive:0x7a1414,minR:2,chance,valueMul:2,
  three:{dmg:.10,spd:.08},five:{dmg:.18,spd:.15,tow:.10},text:['+10% hero damage · +8% swing speed','+18% hero damage · +15% swing speed · +10% defense damage · CHAOS: one hit in five strikes twice'],
  unlock:unlock('crimson','Chaos'),models:{armor:'stand-crimson'},art:art('crimson'),sfx:chime(220,330,880),
  onHit:(e,dmg)=>{ if(LR()<.2){ hurt(e,dmg,0,0); floatText(e.x,e.y+e.h+.9,e.z,'CHAOS!','#ff5a5a'); burst(e.x,e.y+e.h*.6,e.z,0xff3a3a,1.8); } }});
add({name:'of the Earth',key:'rock',ic:'🪨',col:0xa07a4a,css:'#c9a06a',emissive:0x4a3016,minR:2,chance,valueMul:2,
  three:{hp:.12,tow:.05},five:{hp:.22,tow:.12,tcd:.08},text:['+12% health · +5% defense damage','+22% health · +12% defense damage · +8% defense speed · BULWARK: defenses within 8 of you take half damage'],
  unlock:unlock('rock','Earth'),models:{armor:'stand-rock'},art:art('rock'),sfx:chime(110,165,220)});
add({name:'of Fire',key:'lava',ic:'🌋',col:0xff6a2a,css:'#ff8a3a',emissive:0x8a2a08,minR:2,chance,valueMul:2,
  three:{dmg:.12,tow:.06},five:{dmg:.20,tow:.14},text:['+12% hero damage · +6% defense damage','+20% hero damage · +14% defense damage · EMBER: your hits burn for 3 s, a quarter of the blow a second'],
  unlock:unlock('lava','Fire'),models:{armor:'stand-lava'},art:art('lava'),sfx:chime(196,262,392),
  onHit:(e,dmg)=>{ e.poisonT=Math.max(e.poisonT||0,3); e.poisonDmg=Math.max(e.poisonDmg||0,Math.round(dmg*.25*10)/10); floatText(e.x,e.y+e.h+.9,e.z,'BURN','#ff8a3a'); burst(e.x,e.y+e.h*.5,e.z,0xff6a2a,1.4); }});
add({name:'of Radiance',key:'angelic',ic:'✨',col:0xffe28a,css:'#ffe28a',emissive:0x8a7020,minR:2,chance,valueMul:2,
  three:{hp:.10,mana:.08},five:{hp:.18,mana:.15,tow:.08},text:['+10% health · +8% mana from orbs','+18% health · +15% mana from orbs · +8% defense damage · HALO: every hit heals you 15% of it and mends the defenses beside you'],
  unlock:unlock('angelic','Radiance'),models:{armor:'stand-angelic'},art:art('angelic'),sfx:chime(523,659,1047),
  onHit:(e,dmg,who)=>{ const w=who||hero; w.hp=Math.min(w.max,w.hp+dmg*.15); for(const d of defs) if(Math.hypot(d.x-w.x,d.z-w.z)<=6) d.hp=Math.min(d.max,d.hp+1); burst(w.x,(w.y||0)+1.2,w.z,0xffe28a,1.5); }});   // who (co-op sweep 2026-10-02): a guest's swing on the host heals that guest (93-gearsets.js guestSwing)
add({name:'of the Storm',key:'storm',ic:'⚡',col:0x8ad0ff,css:'#8ad0ff',emissive:0x2a5a8a,minR:2,chance,valueMul:2,
  three:{spd:.10,tcd:.06},five:{spd:.18,tcd:.12,dmg:.08},text:['+10% swing speed · +6% defense speed','+18% swing speed · +12% defense speed · +8% hero damage · CHAIN: every third hit arcs to two enemies near it for half the blow'],
  unlock:unlock('storm','Storm'),models:{armor:'stand-storm'},art:art('storm'),sfx:chime(330,440,1319),
  onHit:(e,dmg)=>{ stormHits++; if(stormHits%3) return; const others=enemies.filter(m=>!m.dead&&m!==e&&Math.hypot(m.x-e.x,m.z-e.z)<4).sort((a,b)=>Math.hypot(a.x-e.x,a.z-e.z)-Math.hypot(b.x-e.x,b.z-e.z)).slice(0,2); for(const m of others){ hurt(m,Math.round(dmg*.5*10)/10,0,0); burst(m.x,m.y+m.h*.6,m.z,0x8ad0ff,1.4); } burst(e.x,e.y+e.h*.7,e.z,0xd8ecff,1.8); if(others.length) floatText(e.x,e.y+e.h+.9,e.z,'CHAIN','#8ad0ff'); }});
add({name:'of Shadow',key:'shadow',ic:'🌑',col:0x6a4a8a,css:'#b090d0',emissive:0x2a1a3a,minR:2,chance,valueMul:2,
  three:{move:.10,dmg:.06},five:{move:.18,dmg:.14},text:['+10% move · +6% hero damage','+18% move · +14% hero damage · BACKSTAB: a hit from behind is half again as strong'],
  unlock:unlock('shadow','Shadow'),models:{armor:'stand-shadow'},art:art('shadow'),sfx:chime(147,196,294),
  onHit:(e,dmg,who)=>{ const w=who||hero; const fx=Math.sin(e.yaw||0), fz=Math.cos(e.yaw||0); const dx=w.x-e.x, dz=w.z-e.z, d=Math.hypot(dx,dz)||1; if((dx*fx+dz*fz)/d<-.2){ hurt(e,Math.round(dmg*.5*10)/10,0,0); floatText(e.x,e.y+e.h+.9,e.z,'BACKSTAB','#b090d0'); } }});
add({name:'of Ice',key:'ice',ic:'❄',col:0x9ee8ff,css:'#bfefff',emissive:0x2a6a8a,minR:2,chance,valueMul:2,
  three:{hp:.08,aoe:.08},five:{hp:.15,aoe:.15,tow:.10},text:['+8% health · +8% defense range & area','+15% health · +15% defense range & area · +10% defense damage · FROSTBITE: your hits chill for 1.5 s'],
  unlock:unlock('ice','Ice'),models:{armor:'stand-ice'},art:art('ice'),sfx:chime(880,1175,1760),
  onHit:(e,dmg)=>{ e.chillT=Math.max(e.chillT||0,1.5); e.chillK=Math.min(e.chillK||1,.6); burst(e.x,e.y+e.h*.6,e.z,0xbfefff,1.3); }});
add({name:'of the Wind',key:'wind',ic:'🌬',col:0xcfe8a0,css:'#d8f0b0',emissive:0x4a6a2a,minR:2,chance,valueMul:2,
  three:{move:.12,fam:.10},five:{move:.20,fam:.20,spd:.10},text:['+12% move · +10% familiar damage','+20% move · +20% familiar damage · +10% swing speed · GALE: your swings reach 40% further and throw enemies back']});
Meta.packs.get('of the Wind').unlock=unlock('wind','Wind'); Meta.packs.get('of the Wind').models={armor:'stand-wind'}; Meta.packs.get('of the Wind').art=art('wind'); Meta.packs.get('of the Wind').sfx=chime(392,523,784);
const full=n=>!!(Meta.sets.active().find(a=>a.name===n&&a.tier>=5));
// the Wind: reach and a shove, around the swing itself
{ const prev=hitCone; hitCone=function(){ if(!full('of the Wind')) return prev(); const r0=hero.reach||2.4; hero.reach=r0*1.4; const before=[]; for(const e of enemies) if(!e.dead) before.push([e,e.hp]); try{ prev(); }finally{ hero.reach=r0; } const fx=Math.sin(hero.yaw), fz=Math.cos(hero.yaw); for(const [e,h] of before) if(e.hp<h||e.dead){ for(let i=0;i<3;i++) moveCircle(e,fx*.9,fz*.9,e.r*.8,false); burst(e.x,e.y+.4,e.z,0xd8f0b0,1.2); } }; }
// the Earth: a defense beside you takes half
{ const prev=hurtDef; hurtDef=function(d,dmg){ if(d&&((full('of the Earth')&&near(d.x,d.z,8))||((Meta.coopFive&&Meta.coopFive())||[]).some(c=>c.five.includes('of the Earth')&&Math.hypot(d.x-c.g.x,d.z-c.g.z)<=8))) dmg=Math.max(1,Math.round(dmg*.5*10)/10); return prev(d,dmg); }; }   // co-op sweep 2026-10-02: a co-op guest's full Earth set guards the defenses beside HIM too (99-network.js Meta.coopFive), halved once whoever stands there
// one set at a time: a set roll that lands on a set the player has not started, while another of these eight is started,
// mostly goes to the started one (the most pieces owned, worn or bagged)
const EIGHT=['of Chaos','of the Earth','of Fire','of Radiance','of the Storm','of Shadow','of Ice','of the Wind'];
function ownedCounts(){ const c={}; const tag=it=>{ const n=it&&Meta.sets.setOf(it); if(n&&EIGHT.includes(n)) c[n]=(c[n]|0)+1; }; for(const it of (Meta.allWorn?Meta.allWorn():SLOTS.map(s=>gear[s]))) tag(it); for(const it of (Meta.bag?Meta.bag():[])) tag(it); return c; }   // worn by any hero (build 171)
function focus(it){ const n=Meta.sets.setOf(it); if(!n||!EIGHT.includes(n)) return it; const c=ownedCounts(); let best=null, bn=0; for(const k in c) if(c[k]>bn){ bn=c[k]; best=k; } if(!best||best===n||LR()>=.6) return it; const base=it.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,''); it.name=base+' '+best; return it; }
{ const prev=rollItem; rollItem=function(minR,slot,lvl){ return focus(prev(minR,slot,lvl)); }; }
window.__sets8={EIGHT,chance,ownedCounts,full,focus,hurtDef:(d,dmg)=>hurtDef(d,dmg),stormHits:()=>stormHits};
})();
