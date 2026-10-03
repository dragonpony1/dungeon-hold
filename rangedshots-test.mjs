// ===== RANGED SHOTS (build 511 prep; parts/staging/81-rangedshots.js, 82-staff.js, 83-bow.js, 80-weapons.js, 90-forge.js 'wproj', 96f-tavernpics.js / 68-paperdoll.js forge UIs, 99-network.js relay).
// Matt: "Yes I was gonna say some of the projectiles are anemic.", "Also on their card let the player pay gold to upgrade their shot count. It should cost a decent amount per additional count.",
// "They should travel long and fast not a slow lob. Do this for all ranged weapons".
// Checked: SHOTS (wproj) shows on a weapon's card in the bag's forge and the Tab sheet for the Witch, Fighter and Ranger, never the Knight (the points stay on the piece); buying +1 costs the table's
// price, adds one shot and stops at the rarity's cap with a lock; a volley of N is N projectiles fanned 7 degrees apart about the aim, each a whole shot's damage; with lock-on the middle one takes the
// locked mob; bolts and arrows fly dead straight at the new speeds (60 / 70) and a miss carries on to 1.5x the reach; the Witch's real set staff fires from its head in the set's colour; each hand of a
// dual-wield fires its own weapon's count; Subterfuge's wedge is its volley (5, up to 7); in co-op a guest's 3-shot volley lands on the host's mob three times and the host sees the three bolts.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer=null; try { ({ PeerServer } = await import("peer")); } catch(e) {}
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=9691; const server=await serve(PORT,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const newPage=async()=>{ const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.route(/\/api\//,r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
  const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
  await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate",{timeout:240000}); await p.waitForFunction(()=>window.__dd&&window.__rshots&&window.__dualwield&&window.__mythic&&window.__meta&&window.__tavern&&window.__doll&&window.__dd.heroModel(),null,{timeout:240000});
  await p.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,3); window.__freeze=true; window.__meta.setLevel&&window.__meta.setLevel(40); d.S.phase='build'; });
  return p; };
const page=await newPage();
const pick=(p,id)=>p.evaluate(async id=>{ await window.__heroes.select(id); const want={knight:'Knight',witch:'Witch',fighter:'Fighter',troll:'Ranger'}[id]; for(let i=0;i<600;i++){ window.__dd.step(1/60,1); const m=window.__dd.heroModel(), s=window.__weapons.state(); if(m&&m.label.includes(want)&&s.mounted&&s.key.includes(want)) return m.label; await new Promise(r=>setTimeout(r,50)); } return null; },id);
// a plain Legendary tier-4 weapon (rarity 4, level 10), worn, with `extra` shot points already in it
const wear=(p,extra,opt)=>p.evaluate(async([extra,opt])=>{ const d=window.__dd, M=window.__meta, N=window.__mythic, W=window.__weapons; opt=opt||{};
  const it=opt.named?N.normalize({tier:'named',named:opt.named,lvl:20}):opt.set?N.normalize({tier:'mythic',slot:'weapon',set:opt.set,art:opt.art,name:opt.name,lvl:20,rarity:5,stats:{dmg:11}}):(()=>{ const x=d.rollItem(4,'weapon',10); x.name='Plain Shortsword'; delete x.look; delete x.setId; x.rarity=4; x.lvl=10; x.tier=4; return x; })();
  it.ups={}; it.up=0; if(extra){ it.ups.wproj=extra; it.stats.wproj=extra; } M.giveItem(it); M.equip(it.id); const want=W.heldFor(it); let m=null;
  for(let i=0;i<600;i++){ d.step(1/60,1); m=W.mounted(); if(m&&m.parent&&m.name===want) break; await new Promise(r=>setTimeout(r,30)); } d.hero.swingT=-1; d.step(1/60,10); window.__wpn=it;
  return { id:it.id, want, held:m&&m.name, kind:m&&m.userData.kind, shots:window.__rshots.shots() }; },[extra,opt]);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// ---------------------------------------------------------------- 1. SHOTS on the card, for a ranged hero only
check("the Witch loads",!!await pick(page,'witch'));
await wear(page,0);
const UI=p=>p.evaluate(async()=>{ const it=window.__wpn, F=window.__meta.forge, T=window.__tavern; T.open(); T.tab('bag'); T.select(it.id,'eq'); await new Promise(r=>setTimeout(r,150));
  const tile=document.querySelector('#tv-forge .tvf-t[data-k="wproj"]'); const r={ keys:F.keys(it), bag:!!tile, bagBtn:!!(tile&&tile.querySelector('[data-act="tvup"][data-key="wproj"]')), bagIcon:tile?tile.querySelector('.i').textContent:null }; T.close();
  window.__doll.open(); await new Promise(r=>setTimeout(r,350)); const row=document.querySelector('#doll .dl-slot.weapon .fg-row[data-k="wproj"]'); r.sheet=!!row; r.sheetText=row?row.textContent:null; window.__doll.close(); return r; });
const WU=await UI(page);
check("the Witch: her weapon's card has a 🏹 SHOTS tile in the bag's forge (with its +1) and a Shots row on the Tab sheet",WU.keys.includes('wproj')&&WU.bag&&WU.bagBtn&&WU.sheet&&/Shots/.test(WU.sheetText)&&/🏹/.test(WU.bagIcon),JSON.stringify(WU));
const OTHER={};
for(const h of ['fighter','troll']){ await pick(page,h); await wear(page,0); OTHER[h]=await UI(page); }
check("the Fighter and the Ranger get it too",['fighter','troll'].every(h=>OTHER[h].keys.includes('wproj')&&OTHER[h].bag&&OTHER[h].sheet),JSON.stringify(OTHER));
check("the Knight loads",!!await pick(page,'knight'));
await wear(page,2);
const KU=await UI(page); const KC=await page.evaluate(()=>{ const it=window.__wpn, F=window.__meta.forge; return { can:F.can(it,'wproj'), ups:it.ups.wproj, line:window.__dd.statStr(it) }; });
check("the Knight: no SHOTS on his weapon's card (bag or sheet), it can't be bought, and points already on the piece stay on it",!KU.keys.includes('wproj')&&!KU.bag&&!KU.sheet&&!KC.can.ok&&KC.ups===2&&/\+2 shots/.test(KC.line),JSON.stringify({KU,KC}));
// ---------------------------------------------------------------- 2. buying: the table's price, one shot each, a lock at the cap
await pick(page,'witch'); await wear(page,0);
const BUY=await page.evaluate(async()=>{ const it=window.__wpn, M=window.__meta, F=M.forge, T=window.__tavern, R=window.__rshots; M.giveGold(200000); const table=F.wprojTable(it); const steps=[]; const up0=it.up|0;
  T.open(); T.tab('bag'); T.select(it.id,'eq'); await new Promise(r=>setTimeout(r,120));
  for(let i=0;i<5;i++){ const b=document.querySelector('#tv-forge .tvf-t[data-k="wproj"] [data-act="tvup"][data-n="1"]:not([disabled])'); const g0=M.gold(); if(b) b.click(); await new Promise(r=>setTimeout(r,60)); steps.push({ btn:!!b, paid:g0-M.gold(), pts:(it.ups&&it.ups.wproj)|0, shots:R.shots(it) }); }
  const tile=document.querySelector('#tv-forge .tvf-t[data-k="wproj"]'); const lock=tile?(tile.querySelector('.lk')||{}).textContent:null, five=!!document.querySelector('#tv-forge .tvf-t[data-k="wproj"] [data-n="5"]'); T.close();
  const g1=M.gold(); const forced=F.upgrade(it.id,'wproj',1); return { table, steps, lock, five, can:F.can(it,'wproj'), forced, still:g1===M.gold(), up0, up1:it.up|0, cap:F.cap(it,'wproj'), rarity:it.rarity, tier:it.tier }; });
check("a Legendary tier-4 weapon's shots cost 2,500 / 6,450 / 14,300 / 31,450 gold (rising steeply), four of them at most",JSON.stringify(BUY.table)==='[2500,6450,14300,31450]'&&BUY.cap===4&&BUY.rarity===4&&BUY.tier===4,JSON.stringify({table:BUY.table,cap:BUY.cap}));
check("each +1 on the card costs exactly the table's price and adds one shot (2, 3, 4, 5)",BUY.steps.slice(0,4).every((s,i)=>s.btn&&s.paid===BUY.table[i]&&s.pts===i+1&&s.shots===i+2),JSON.stringify(BUY.steps));
check("at the cap: no +1 any more, a 🔒 on the tile, the forge refuses (no gold taken), and shots leave the piece's upgrade allowance alone (one at a time, no +5)",!BUY.steps[4].btn&&BUY.steps[4].paid===0&&BUY.steps[4].shots===5&&/🔒/.test(BUY.lock||'')&&!BUY.can.ok&&BUY.can.max&&/🔒/.test(BUY.can.why)&&BUY.forced===0&&BUY.still&&BUY.up1===BUY.up0&&!BUY.five,JSON.stringify({last:BUY.steps[4],lock:BUY.lock,can:BUY.can,forced:BUY.forced,up:[BUY.up0,BUY.up1],five:BUY.five}));
const MORE=await page.evaluate(()=>{ const d=window.__dd, F=window.__meta.forge; const mk=(r,l)=>{ const x=d.rollItem(Math.min(r,4),'weapon',l); x.rarity=r; x.lvl=l; x.tier=d.tierOf(l); x.ups={}; return x; }; return { common:F.wprojTable(mk(0,1)), rare:F.wprojTable(mk(2,5)), epic:F.wprojTable(mk(3,8)), mythic:F.wprojTable(mk(5,13)) }; });
console.log("      shot prices: "+JSON.stringify(MORE));
check("every rarity has its cap (Common 1, Rare 2, Epic 3, Mythic 4) and no shot is ever under 1,000 gold",MORE.common.length===1&&MORE.rare.length===2&&MORE.epic.length===3&&MORE.mythic.length===4&&[MORE.common,MORE.rare,MORE.epic,MORE.mythic].every(t=>t.every(v=>v>=1000)&&t.every((v,i)=>!i||v>t[i-1])),JSON.stringify(MORE));
// ---------------------------------------------------------------- 3. a volley: N projectiles, fanned, each a whole shot
// a lane to shoot down: from the hero's spot along +z, clear of walls and stairs for `len`
const lane=(p,len)=>p.evaluate(len=>{ const d=window.__dd; const ok=(x,z,dx,dz)=>{ const f0=window.__rshots.floor(x,z); for(let s=-1;s<=len;s+=.5){ const px=x+dx*s, pz=z+dz*s; if(window.__rshots.wallAt(px,pz)||Math.abs(window.__rshots.floor(px,pz)-f0)>.3) return false; for(const o of [-.8,.8]){ if(window.__rshots.wallAt(px+dz*o,pz-dx*o)) return false; } } return true; };
  const cand=[[0,6]]; for(let x=-40;x<=40;x+=2) for(let z=-40;z<=40;z+=2) cand.push([x,z]); for(const [x,z] of cand) for(const [dx,dz,yaw] of [[0,1,0],[1,0,Math.PI/2],[0,-1,Math.PI],[-1,0,-Math.PI/2]]) if(ok(x,z,dx,dz)) return {x,z,dx,dz,yaw}; return null; },len);
const stage=(p,L,mobs)=>p.evaluate(([L,mobs])=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,3); d.setHero(L.x,L.z,L.yaw); d.hero.y=window.__rshots.floor(L.x,L.z); d.setCam(L.yaw,.42,6); d.step(1/60,8);
  window.__mobs=mobs.map(([s,side])=>{ const e=d.spawn('goblin','N'); e.x=L.x+L.dx*s+L.dz*side; e.z=L.z+L.dz*s-L.dx*side; e.y=window.__rshots.floor(e.x,e.z); e.spd=0; e.hp=e.max=50000; e.dmg=0; return e; }); window.__mobsAt=window.__mobs.map(e=>[e.x,e.z]); d.step(1/60,2); return window.__mobs.length; },[L,mobs]);
// fire one tap and watch: every projectile as it leaves, then until all are gone (the mobs held in place)
const volley=(p,w)=>p.evaluate(async w=>{ const d=window.__dd, keep=()=>(window.__mobs||[]).forEach((e,i)=>{ e.x=window.__mobsAt[i][0]; e.z=window.__mobsAt[i][1]; }); const list=()=>w==='arrow'?window.__bow.flying():window.__staff.boltList();
  const hp0=(window.__mobs||[]).map(e=>e.hp); d.hero.swingT=-1; d.step(1/60,2); const ev=[]; const prev=window.__shotEvent; window.__shotEvent=function(t,k,from,dir,spd,opts){ ev.push({t,k,from:[from.x,from.y,from.z],dir:[dir.x,dir.y,dir.z],spd,dmg:opts&&opts.dmg,life:opts&&opts.life}); if(prev) return prev.apply(this,arguments); };
  let first=null, track=[]; try{ d.swing(); for(let i=0;i<240;i++){ d.step(1/60,1); keep(); const l=list(); if(!first&&l.length) first=l; if(first&&l.length) track.push(l.map(b=>({x:b.x,y:b.y,z:b.z,go:b.go,spd:b.spd,life:b.life}))); if(first&&!l.length) break; } } finally { window.__shotEvent=prev; }
  const tap=Math.round(d.heroDmg()*.6*10)/10; return { ev, first, track:track.slice(0,60), lost:(window.__mobs||[]).map((e,i)=>+(hp0[i]-e.hp).toFixed(1)), tap, aim:window.__aim.pick()?true:false }; },w);
const ang=(a,b)=>{ const la=Math.hypot(a[0],a[2]), lb=Math.hypot(b[0],b[2]); return Math.acos(Math.max(-1,Math.min(1,(a[0]*b[0]+a[2]*b[2])/(la*lb))))*180/Math.PI; };
const sgn=(a,b)=>Math.sign(a[0]*b[2]-a[2]*b[0]);
const L30=await lane(page,40);
check("a clear lane to shoot down (40 units)",!!L30,JSON.stringify(L30));
await wear(page,2);   // three shots
await stage(page,L30,[[4,0]]);
const V3=await volley(page,'bolt');
const fanA=V3.ev.slice(1).map(e=>+ang(V3.ev[0].dir,e.dir).toFixed(2)), sides=V3.ev.slice(1).map(e=>sgn(V3.ev[0].dir,e.dir));
check("a 3-shot weapon looses 3 bolts per attack, one on the aim and one 7 degrees to either side",V3.ev.length===3&&V3.ev.every(e=>e.t==='bolt')&&fanA.every(a=>Math.abs(a-7)<.3)&&sides[0]===-sides[1],JSON.stringify({n:V3.ev.length,fanA,sides}));
check("each bolt carries the whole shot's damage (the tap's 60%), and a goblin 4 away takes all three",V3.ev.every(e=>e.dmg===V3.tap)&&Math.abs(V3.lost[0]-3*V3.tap)<.2,JSON.stringify({dmg:V3.ev.map(e=>e.dmg),tap:V3.tap,lost:V3.lost}));
await wear(page,4);   // five shots
await stage(page,L30,[]);
const V5=await volley(page,'bolt'); const fan5=V5.ev.map(e=>+ang(V5.ev[0].dir,e.dir).toFixed(1)).sort((a,b)=>a-b);
check("five shots: five bolts at 0, 7, 7, 14, 14 degrees off the aim (centred, a tight fan)",V5.ev.length===5&&JSON.stringify(fan5)===JSON.stringify([0,7,7,14,14]),JSON.stringify(fan5));
// lock-on: the middle shot takes the locked mob, off to one side of the camera's aim
await wear(page,2);
await stage(page,L30,[[14,-3]]);
const LK=await page.evaluate(()=>{ const t=window.__aim.pick(); return { locked:t===window.__mobs[0] }; });
const V3L=await volley(page,'bolt');
const m=await page.evaluate(()=>{ const e=window.__mobs[0]; return [e.x,e.y+e.h*.5,e.z]; });
const toMob=[m[0]-V3L.ev[0].from[0],0,m[2]-V3L.ev[0].from[2]];
check("lock-on: the reticle locks the goblin 12 degrees off the camera's aim; the middle bolt flies straight at it and hits it once (the side shots pass it by)",LK.locked&&ang(V3L.ev[0].dir,toMob)<.5&&Math.abs(V3L.lost[0]-V3L.tap)<.2,JSON.stringify({LK,off:+ang(V3L.ev[0].dir,toMob).toFixed(2),lost:V3L.lost,tap:V3L.tap}));
// ---------------------------------------------------------------- 4. the flight: straight, fast, long
await wear(page,0);
await stage(page,L30,[]);
const FL=await volley(page,'bolt'); const reach=await page.evaluate(()=>window.__dd.hero.reach);
const tr=FL.track.map(f=>f[0]).filter(Boolean); const dys=[]; for(let i=1;i<tr.length;i++) dys.push(+(tr[i].y-tr[i-1].y).toFixed(4));
const maxGo=Math.max(...tr.map(b=>b.go));
check("a bolt flies at 60 (it was 26) dead straight: no drop from one frame to the next",FL.ev[0].spd===60&&tr.length>5&&dys.every(v=>Math.abs(v-dys[0])<1e-3),JSON.stringify({spd:FL.ev[0].spd,dys:dys.slice(0,8)}));
check("a miss flies on to 1.5x the Witch's reach (27) before it fades -- not stopping at the aim point",Math.abs(FL.ev[0].life*FL.ev[0].spd-1.5*reach)<.01&&maxGo>1.5*reach-1.5&&maxGo<1.5*reach+1.5,JSON.stringify({reach,life:FL.ev[0].life,maxGo}));
await pick(page,'troll'); await wear(page,0); const L2=await lane(page,40); await stage(page,L2||L30,[]);
const FA=await volley(page,'arrow'); const reachR=await page.evaluate(()=>window.__dd.hero.reach); const ta=FA.track.map(f=>f[0]).filter(Boolean); const dya=[]; for(let i=1;i<ta.length;i++) dya.push(+(ta[i].y-ta[i-1].y).toFixed(4));
check("an arrow flies at 70 (it was 30), straight, and a miss carries to 1.5x the Ranger's reach (36)",FA.ev[0].spd===70&&dya.every(v=>Math.abs(v-dya[0])<1e-3)&&Math.abs(FA.ev[0].life*FA.ev[0].spd-1.5*reachR)<.01&&Math.max(...ta.map(a=>a.go))>Math.min(1.5*reachR,40)-2,JSON.stringify({spd:FA.ev[0].spd,life:FA.ev[0].life,reachR,go:Math.max(...ta.map(a=>a.go))}));
// the Ranger's 5-arrow volley, and a set bow's arrows in the set's colour
await wear(page,4,{set:'ice',art:'bow',name:'Mythic Bow of Ice'}); await stage(page,L2||L30,[]);
const RA=await volley(page,'arrow');
check("the Ranger: a 5-shot Ice bow looses five glowing arrows in the Ice set's colour (the set's held glow), the pooled arrow, not a wooden stick",RA.ev.length===5&&RA.first.length===5&&RA.first.every(a=>a.col===0x8ae8ff&&a.part==='arrowBody'),JSON.stringify(RA.first&&RA.first.map(a=>({col:a.col,part:a.part}))));
// ---------------------------------------------------------------- 5. the Witch's real set staff: from its head, in its colour
await pick(page,'witch');
const CH=await wear(page,0,{set:'crimson',art:'staff',name:'Mythic Staff of Chaos'});
const HD=await page.evaluate(()=>{ const d=window.__dd, W=window.__weapons, wo=W.mounted(); wo.updateWorldMatrix(true,true); const sd=wo.userData.sword, hd=wo.getObjectByName('staffHead'), grip=wo.parent.getWorldPosition(new THREE.Vector3()), tip=wo.localToWorld(new THREE.Vector3(0,sd.tipY,0)), head=hd?hd.getWorldPosition(new THREE.Vector3()):null;
  for(const e of d.enemies) d.kill(e); d.hero.swingT=-1; d.step(1/60,2); let got=null; const prev=window.__shotEvent; window.__shotEvent=function(t,k,from){ if(!got){ const h=W.mounted().getObjectByName('staffHead'); got={ k, fromHead:h?from.distanceTo(h.getWorldPosition(new THREE.Vector3())):null, toTip:from.distanceTo(W.mounted().localToWorld(new THREE.Vector3(0,W.mounted().userData.sword.tipY,0))), fromGrip:from.distanceTo(W.mounted().parent.getWorldPosition(new THREE.Vector3())) }; } if(prev) return prev.apply(this,arguments); };
  try{ d.swing(); for(let i=0;i<120&&!got;i++) d.step(1/60,1); }finally{ window.__shotEvent=prev; } const b=window.__staff.boltList()[0]; return { name:wo.name, kind:wo.userData.kind, head:!!hd, len:grip.distanceTo(tip), got, col:b&&b.col }; });
check("the Witch's real Chaos staff (Matt's model) carries the set's kind and a head",CH.held==='staff-chaos'&&HD.kind==='chaos'&&HD.head,JSON.stringify({CH,kind:HD.kind,head:HD.head}));
check("its bolt leaves from the staff's HEAD (the top of the staff, far from the fist -- not partway up the shaft) in the Chaos colour, not the plain pale blue",!!HD.got&&HD.got.fromHead<.02&&HD.got.toTip<HD.len*.3&&HD.got.fromGrip>HD.len*.6&&HD.col===0xff3a5a,JSON.stringify(HD));
// ---------------------------------------------------------------- 6. dual-wield: each hand's own count
const DW=await page.evaluate(async()=>{ const d=window.__dd, M=window.__meta, N=window.__mythic, D=window.__dualwield, W=window.__weapons; const ring=N.normalize({tier:'named',named:'toil_n_trouble',lvl:20}); M.giveItem(ring); M.equip(ring.id);
  const main=d.rollItem(4,'weapon',10); main.name='Plain Shortsword'; delete main.look; delete main.setId; main.ups={wproj:2}; main.stats.wproj=2; M.giveItem(main); M.equip(main.id);
  const w2=d.rollItem(3,'weapon',9); w2.name='Plain Broadsword'; delete w2.look; delete w2.setId; w2.ups={}; M.giveItem(w2); const ok=D.equip2(w2.id);
  for(let i=0;i<400;i++){ d.step(1/60,1); if(D.off()&&W.mounted()&&W.mounted().parent) break; await new Promise(r=>setTimeout(r,25)); } for(const e of d.enemies) d.kill(e); d.hero.swingT=-1; d.step(1/60,10);
  const got=[]; const prev=window.__shotEvent; window.__shotEvent=function(t){ got.push({t,hand:D.hand()}); if(prev) return prev.apply(this,arguments); };
  try{ for(let s=0;s<2;s++){ for(let i=0;i<6;i++) d.step(1/60,1); d.swing(); let n=0; while(d.hero.swingT>=0&&n<300){ d.step(1/60,1); n++; } } }finally{ window.__shotEvent=prev; }
  const per={}; got.forEach(g=>{ per[g.hand]=(per[g.hand]||0)+1; }); const r={ ok, dual:D.dual(), per }; D.unequip2(); M.unequip('charm'); d.step(1/60,3); return r; });
check("dual-wield (Toil-n-Trouble): the main staff's swing looses its weapon's 3, the 2nd staff's its own 1",DW.ok&&DW.dual&&DW.per.main===3&&DW.per.off===1,JSON.stringify(DW));
// ---------------------------------------------------------------- 7. Subterfuge: its wedge is its volley
await pick(page,'troll');
const SUB=[]; for(const extra of [0,4]){ await wear(page,extra,{named:'subterfuge'}); await stage(page,L2||L30,[]);
  SUB.push(await page.evaluate(async()=>{ const d=window.__dd, F=window.__meta.forge, it=window.__wpn; d.hero.swingT=-1; d.step(1/60,2); d.swing(); let n=0; for(let i=0;i<200;i++){ d.step(1/60,1); const f=window.__bow.flying().filter(a=>a.kind==='subterfuge'); if(f.length){ n=f.length; break; } }
    for(let i=0;i<150&&window.__bow.flying().length;i++) d.step(1/60,1); return { n, shots:window.__rshots.shots(it), cap:F.cap(it,'wproj'), can:F.can(it,'wproj'), held:window.__weapons.mounted().name }; })); }
check("Subterfuge: its five-arrow wedge IS its volley (5, not 5 x shots); shot points add arrows to it, two at most (7, never 25), and its card stops at 2",SUB[0].n===5&&SUB[1].n===7&&SUB[1].cap===2&&!SUB[1].can.ok&&SUB[1].can.max&&SUB[0].held==='bow-subterfuge',JSON.stringify(SUB));
// ---------------------------------------------------------------- 8. the look stays pooled
const PO=await page.evaluate(()=>window.__rshots.info());
check("the shots' look is pooled: a few dozen projectiles and impacts built in all of the above, no per-shot geometry",PO.made.bolt<=40&&PO.made.arrow<=40&&PO.takes>PO.made.bolt+PO.made.arrow&&PO.impactsMade<=48,JSON.stringify(PO));
// ---------------------------------------------------------------- 9. co-op: a guest's 3-shot volley on the host's mob
if(!PeerServer) console.log("SKIP co-op part -- the `peer` package isn't installed");
else {
  const sigPort=9692; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await sleep(300); const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
  const host=await newPage(), guest=page;
  await pick(guest,'witch'); await wear(guest,2);
  for(const p of [host,guest]) await p.evaluate(()=>{ window.__freeze=true; const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,3); });
  const rc="rshots-"+Math.random().toString(36).slice(2,8);
  const ho=await host.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const gj=await guest.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  check("co-op: host and guest connect",ho.err===null&&gj.err===null,JSON.stringify({ho,gj}));
  const tickBoth=async(n)=>{ for(let i=0;i<n;i++){ await host.evaluate(()=>{ window.__dd.step(1/60,1); (window.__mobs||[]).forEach((e,i)=>{ e.x=window.__mobsAt[i][0]; e.z=window.__mobsAt[i][1]; }); }); await guest.evaluate(()=>window.__dd.step(1/60,1)); if(i%5===4) await sleep(15); } };
  await host.evaluate(()=>window.__dd.setHero(0,-25,0)); await guest.evaluate(()=>{ window.__dd.setHero(0,6,0); window.__dd.setCam(0,.42,8); }); await tickBoth(60);
  const gid=gj.id; await host.evaluate(()=>{ const d=window.__dd; const e=d.spawn('goblin','N'); e.x=0; e.z=10; e.y=0; e.spd=0; e.hp=e.max=50000; e.dmg=0; e.atk=999; e.__coopId='rsvol'; window.__mobs=[e]; window.__mobsAt=[[0,10]]; });
  await tickBoth(40);   // the goblin reaches the guest's page (its puppet, for the guest's lock-on)
  const G=await guest.evaluate(()=>({ shots:window.__rshots.shots(), tap:Math.round(window.__dd.heroDmg()*.6*10)/10, kind:window.__aim.kind() }));
  const hp0=await host.evaluate(()=>window.__mobs[0].hp);
  await host.evaluate(gid=>{ window.__seenBolts=0; const prev=window.__staff.fireBolt; window.__staff.fireBolt=function(k,from,dir,spd,o){ if(o&&o.owner===gid) window.__seenBolts++; return prev.apply(this,arguments); }; window.__liveMax=0; },gid);
  await guest.evaluate(()=>window.__dd.swing());
  let seen=0, live=0; for(let k=0;k<40;k++){ await tickBoth(3); const s=await host.evaluate(gid=>({ n:window.__staff.boltList().filter(b=>b.owner===gid).length, live:window.__rshots.info().live }),gid); seen=Math.max(seen,s.n); live=Math.max(live,s.live); if(seen>=3&&s.n===0) break; }
  await tickBoth(30);
  const hp1=await host.evaluate(()=>window.__mobs[0].hp); const fired=await host.evaluate(()=>window.__seenBolts);
  check("co-op: the guest's weapon has 3 shots; the host flies all three of its bolts (it SEES the volley: three in the air at once, each drawn)",G.shots===3&&fired===3&&seen===3&&live>=3,JSON.stringify({G,fired,seen,live}));
  check("co-op: and the host's goblin takes the guest's shot three times (3 x the guest's tap damage)",Math.abs((hp0-hp1)-3*G.tap)<.25,JSON.stringify({lost:+(hp0-hp1).toFixed(1),tap:G.tap}));
  try{ sig.close&&sig.close(); }catch(e){}
}
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis|peer|PeerJS|WebRTC|ICE/i.test(e));
check("no page errors",real.length===0,JSON.stringify(real.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
