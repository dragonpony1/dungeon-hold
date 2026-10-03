// ===== THE OTHER EIGHT SETS (build 167): Chaos, Earth, Fire, Radiance, Storm, Shadow, Ice, Wind drop in the hall at a
// conservative rate (Rare+, from wave 4, 1.2%..3% a set), most set rolls go to a set you have started, Matt's pictures
// are served, and each five-piece power does what its line says.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const SP=process.env.SP||process.cwd(); const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8893; const server=await serve(PORT);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const page=await browser.newPage({viewport:{width:960,height:600}});
const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:"+PORT+"/?silent&nogate&nosetgate&map=0",{timeout:240000}); await page.waitForFunction(()=>window.__dd&&window.__sets8&&window.__meta&&window.__sets&&window.__packs,null,{timeout:180000});
const EIGHT=['of Chaos','of the Earth','of Fire','of Radiance','of the Storm','of Shadow','of Ice','of the Wind'];
// registered, on the same frame as the Void and the Forest
const reg=await page.evaluate(()=>{ const P=window.__packs; const names=P.list(); const rows={}; for(const n of window.__sets8.EIGHT){ const d=P.get(n); rows[n]=d&&{minR:d.minR,vm:d.valueMul,c3:d.chance(3),c4:+d.chance(4).toFixed(3),c10:+d.chance(10).toFixed(3),c40:+d.chance(40).toFixed(3),three:Object.keys(d.three).length,five:Object.keys(d.five).length,text:d.text.length,unlock:d.unlock&&d.unlock.model,art:d.art&&d.art.sword,stand:d.models&&d.models.armor,sfx:typeof d.sfx}; } return {names,rows,setsNames:window.__sets.names.length}; });
check("ten sets are registered: the Void, the Forest and the eight",reg.names.length===10&&EIGHT.every(n=>reg.names.includes(n))&&reg.setsNames===10,JSON.stringify(reg.names));
check("each of the eight: Rare+, value x2, two bonus tiers, two text lines, a stand unlock, sword art, the set's armor stand (weapons are 86-setweapons.js's), a chime",EIGHT.every(n=>{ const r=reg.rows[n]; return r&&r.minR===2&&r.vm===2&&r.three>=2&&r.five>=2&&r.text===2&&/^armor-stand-\w+\.glb$/.test(r.unlock)&&/^item-\w+-sword\.jpg$/.test(r.art)&&/^stand-\w+$/.test(r.stand||'')&&r.sfx==='function'; }),JSON.stringify(reg.rows));
check("conservative: nothing before wave 4, 1.2% at wave 4, 3% at the ceiling (the Void's rule stays higher)",EIGHT.every(n=>{ const r=reg.rows[n]; return r.c3===0&&r.c4===.012&&r.c10===.03&&r.c40===.03; }),JSON.stringify(reg.rows['of Chaos']));
// the pictures are served (item art for every slot, and the set picture for the sheet)
const KEYS=['crimson','rock','lava','angelic','storm','shadow','ice','wind'];
const art=await page.evaluate(async KEYS=>{ const out={}; for(const k of KEYS){ for(const f of ['item-'+k+'-sword.jpg','item-'+k+'-armor.jpg','item-'+k+'-charm.jpg','item-'+k+'-amulet.jpg','set-'+k+'.jpg']){ try{ const r=await fetch('assets/'+f); out[f]=r.status+':'+(r.headers.get('content-type')||''); }catch(e){ out[f]='ERR'; } } } return out; },KEYS);
const bad=Object.entries(art).filter(([f,v])=>!/^200:image/.test(v));
check("40 pictures served: item-<key>-{sword,armor,charm,amulet}.jpg and set-<key>.jpg for the eight keys",Object.keys(art).length===40&&bad.length===0,bad.length?JSON.stringify(bad.slice(0,5)):"all 200");
const card=await page.evaluate(()=>{ const d=window.__dd; const it=d.rollItem(2,'weapon',5); it.name='Blade of Chaos'; const a=window.__packs.art(it); const it2=d.rollItem(2,'charm',5); it2.name='Charm of the Wind'; return {a,b:window.__packs.art(it2),html:window.__packs.artHtml(it2)}; });
check("a Chaos sword and a Wind charm show Matt's card art (build 514: the set's per-piece pictures)",/sets\/crimson-sword\.jpg$/.test(card.a||'')&&/sets\/wind-trinket\.jpg$/.test(card.b||'')&&/<img class="ia"/.test(card.html),JSON.stringify(card));
// the drop rule: at wave 10 the eight show up among Rare+ rolls, and none before wave 4
const drops=await page.evaluate(EIGHT=>{ const d=window.__dd, M=window.__meta; M.reset(); d.resetGear(); const count=w=>{ d.S.wave=w; const c={}; for(let i=0;i<1500;i++){ const it=d.rollItem(2,'armor',8); const n=window.__sets.setOf(it)||'-'; c[n]=(c[n]|0)+1; } return c; }; const late=count(10), early=count(2); d.S.wave=0; return {late,early,eightLate:EIGHT.filter(n=>late[n]>0).length,eightEarly:EIGHT.filter(n=>early[n]>0).length,share:+((EIGHT.reduce((a,n)=>a+(late[n]|0),0))/1500).toFixed(3)}; },EIGHT);
check("wave 10: most of the eight appear among 1500 Rare+ rolls, together a modest share (under 35%); wave 2: none of them",drops.eightLate>=5&&drops.share<.35&&drops.eightEarly===0,JSON.stringify(drops));
// one set at a time: own two Chaos pieces and a roll that lands on another of the eight mostly becomes Chaos
const bias=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; M.reset(); d.resetGear(); for(const s of ['armor','charm']){ const it=d.rollItem(2,s,5); it.name=it.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' of Chaos'; M.giveItem(it); } const owned=window.__sets8.ownedCounts(); let toChaos=0, kept=0, forest=0; for(let i=0;i<300;i++){ const it=d.rollItem(2,'amulet',5); it.name='Amulet of Ice'; const r=window.__sets8.focus(it); if(/of Chaos$/.test(r.name)) toChaos++; else if(/of Ice$/.test(r.name)) kept++; } for(let i=0;i<50;i++){ const it=d.rollItem(2,'amulet',5); it.name='Amulet of the Forest'; if(/of the Forest$/.test(window.__sets8.focus(it).name)) forest++; } const same=d.rollItem(2,'amulet',5); same.name='Amulet of Chaos'; const sameOut=window.__sets8.focus(same).name; return {owned,toChaos,kept,forest,sameOut}; });
check("with two Chaos pieces in the bag, an Ice roll becomes Chaos about 60% of the time (the rest stay Ice); Forest and Chaos rolls are left alone",bias.owned['of Chaos']===2&&bias.toChaos>=140&&bias.toChaos<=220&&bias.toChaos+bias.kept===300&&bias.forest===50&&bias.sameOut==='Amulet of Chaos',JSON.stringify(bias));
// the powers. helper: wear a full set of five, alone
const wearFull=n=>page.evaluate(n=>{ const d=window.__dd, M=window.__meta; M.reset(); d.resetGear(); for(const s of ['weapon','armor','charm','amulet','familiar']){ const it=d.rollItem(2,s,5); it.name=it.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' '+n; M.giveItem(it); M.equip(it.id); } d.step(1/60,2); const a=window.__sets.active().find(x=>x.name===n); return {full:window.__sets8.full(n),count:a&&a.count,tier:a&&a.tier,worn:Object.values(d.gear()).filter(Boolean).length}; },n);
await page.evaluate(()=>{ const d=window.__dd; d.start(); d.step(1/60,30); for(const e of d.enemies) d.kill(e); d.step(1/60,30); });
// Fire: a swing burns
let w=await wearFull('of Fire');
const fire=await page.evaluate(()=>{ const d=window.__dd; d.setHero(0,10,0); d.setCam(0,.42,8); const g=d.spawn('goblin','N'); g.hp=g.max=9999; g.spd=0; g.x=0; g.z=11.8; d.swing(); for(let i=0;i<40;i++) d.step(1/60,1); const out={hit:g.hp<g.max,poisonT:+(g.poisonT||0).toFixed(2),poisonDmg:g.poisonDmg||0}; d.kill(g); return out; });
check("of Fire, five worn: a hit burns for about 3 s at a quarter of the blow a second",w.full&&w.count===5&&fire.hit&&fire.poisonT>2&&fire.poisonDmg>0,JSON.stringify({w,fire}));
// Ice: a swing chills
w=await wearFull('of Ice');
const ice=await page.evaluate(()=>{ const d=window.__dd; const g=d.spawn('goblin','N'); g.hp=g.max=9999; g.x=0; g.z=11.8; const base=g.spd; d.swing(); for(let i=0;i<40;i++) d.step(1/60,1); const out={hit:g.hp<g.max,chillT:+(g.chillT||0).toFixed(2),chillK:g.chillK,spd:+d.mobSpd(g).toFixed(3),base:+base.toFixed(3)}; d.kill(g); return out; });
check("of Ice, five worn: a hit chills for 1.5 s (speed x0.6)",w.full&&ice.hit&&ice.chillT>=.8&&ice.chillK===.6&&ice.spd<ice.base*.7,JSON.stringify(ice));
// Chaos: one hit in five lands twice
w=await wearFull('of Chaos');
const chaos=await page.evaluate(()=>{ const d=window.__dd; const g=d.spawn('goblin','N'); g.hp=g.max=99999; g.spd=0; const P=window.__packs.get('of Chaos'); let doubles=0; for(let i=0;i<400;i++){ const h=g.hp; P.onHit(g,10); if(h-g.hp>=10) doubles++; } d.kill(g); return {doubles}; });
check("of Chaos, five worn: about one hit in five strikes twice (400 tries)",w.full&&chaos.doubles>=50&&chaos.doubles<=115,JSON.stringify(chaos));
// Storm: the third hit arcs to a neighbour for half
w=await wearFull('of the Storm');
const storm=await page.evaluate(()=>{ const d=window.__dd; const a=d.spawn('goblin','N'), b=d.spawn('goblin','N'); a.hp=a.max=9999; b.hp=b.max=9999; a.spd=b.spd=0; a.x=0; a.z=11.8; b.x=3; b.z=11.5; const P=window.__packs.get('of the Storm'); const log=[]; for(let i=0;i<3;i++){ const hb=b.hp; P.onHit(a,10); log.push(hb-b.hp); } const out={log,n:window.__sets8.stormHits()}; d.kill(a); d.kill(b); return out; });
check("of the Storm, five worn: within three hits exactly one arcs half the blow (5) to the goblin beside the target",w.full&&storm.log.filter(x=>x===5).length===1&&storm.log.filter(x=>x===0).length===2,JSON.stringify(storm));
// Shadow: from behind, half again
w=await wearFull('of Shadow');
const shadow=await page.evaluate(()=>{ const d=window.__dd; d.setHero(0,10,0); const g=d.spawn('goblin','N'); g.hp=g.max=9999; g.spd=0; g.x=0; g.z=11.8; const P=window.__packs.get('of Shadow'); g.yaw=0; /* faces +z, away from the hero at z=10 */ let h=g.hp; P.onHit(g,10); const behind=h-g.hp; g.yaw=Math.PI; h=g.hp; P.onHit(g,10); const front=h-g.hp; d.kill(g); return {behind,front}; });
check("of Shadow, five worn: a hit from behind adds half the blow; from the front nothing",w.full&&shadow.behind===5&&shadow.front===0,JSON.stringify(shadow));
// Radiance: a hit heals you and mends a defense beside you
w=await wearFull('of Radiance');
const rad=await page.evaluate(()=>{ const d=window.__dd; d.S.mana=999; d.setHero(0,10,0); let def=null; for(let dx=-4;dx<=4&&!def;dx++){ try{ def=d.placeDefAt('harpoon',d.hero.x+dx,d.hero.z+2,0); }catch(e){} } if(def) def.hp=def.max-3; const g=d.spawn('goblin','N'); g.hp=g.max=9999; g.spd=0; g.x=0; g.z=11.8; d.hero.hp=50; const P=window.__packs.get('of Radiance'); P.onHit(g,20); const out={hp:d.hero.hp,def:def?def.max-def.hp:null}; d.kill(g); return out; });
check("of Radiance, five worn: a 20 hit heals you 3 and mends the defense beside you by 1",w.full&&rad.hp===53&&rad.def===2,JSON.stringify(rad));
// Wind: the swing reaches further and throws the goblin back
w=await wearFull('of the Wind');
const wind=await page.evaluate(()=>{ const d=window.__dd; d.setHero(0,10,0); d.setCam(0,.42,8); const g=d.spawn('goblin','N'); g.hp=g.max=9999; g.spd=0; g.x=0; g.z=13.1; const z0=g.z; d.swing(); for(let i=0;i<40;i++) d.step(1/60,1); const out={hit:g.hp<g.max,pushed:+(g.z-z0).toFixed(2),reach:d.hero.reach}; d.kill(g); return out; });
const noWind=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; M.reset(); d.resetGear(); d.setHero(0,10,0); d.setCam(0,.42,8); const g=d.spawn('goblin','N'); g.hp=g.max=9999; g.spd=0; g.x=0; g.z=13.1; d.swing(); for(let i=0;i<40;i++) d.step(1/60,1); const out={hit:g.hp<g.max}; d.kill(g); return out; });
check("of the Wind, five worn: a goblin 3.1 away is hit (out of reach without the set) and thrown back; reach restored after",w.full&&wind.hit&&wind.pushed>.5&&wind.reach===2.4&&!noWind.hit,JSON.stringify({wind,noWind}));
// Earth: a defense beside you takes half, one far away takes it all
w=await wearFull('of the Earth');
const earth=await page.evaluate(()=>{ const d=window.__dd; d.S.mana=999; d.setHero(0,10,0); let nearD=null, farD=null; for(let dx=-4;dx<=4&&!nearD;dx++){ try{ nearD=d.placeDefAt('harpoon',d.hero.x+dx,d.hero.z+2,0); }catch(e){} } for(let dx=-4;dx<=4&&!farD;dx++){ try{ farD=d.placeDefAt('harpoon',d.hero.x+dx,d.hero.z-14,0); }catch(e){} } const out={}; if(nearD){ nearD.hp=nearD.max; window.__sets8.hurtDef(nearD,10); out.near=nearD.max-nearD.hp; out.nd=+Math.hypot(nearD.x-d.hero.x,nearD.z-d.hero.z).toFixed(1); } if(farD){ farD.hp=farD.max; window.__sets8.hurtDef(farD,10); out.far=farD.max-farD.hp; out.fd=+Math.hypot(farD.x-d.hero.x,farD.z-d.hero.z).toFixed(1); } return out; });
check("of the Earth, five worn: a hit on a defense within 8 of you costs it half what the same hit costs one 14 away (build 175: towers take 60% of a blow, so a 10 costs 3 near and 6 far)",w.full&&earth.near===3&&earth.far===6,JSON.stringify(earth));
// the bonuses ride the multiplier hook, not flat points
const mult=await page.evaluate(()=>{ const d=window.__dd; return {hpMult:+d.Meta.mult('hp').toFixed(3),max:d.hero.max}; });
check("of the Earth worn: +22% health reads on the multiplier hook (hero max above 120)",Math.abs(mult.hpMult-.22)<.001&&mult.max>=122,JSON.stringify(mult));
check("no page errors",errors.length===0,errors.join(" | ").slice(0,400));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
