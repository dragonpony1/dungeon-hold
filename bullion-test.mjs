// ===== SIR BULLION, THE FEAST HALL'S BOSS (build 529 prep) + his kitchen hearth. Checked: the hearth stands solid at the east end and every door still reaches the Heartroot; the Feast Hall's wave 7
// brings him in with the roll-out (his music asked for, Matt's stamp line word for word, the camera given back); his clips play (Walk on the move, Attack on a tower, Slam every few seconds); a puddle
// burns a hero and a tower but never a mob, and dries up; he walks the hall to the Heartroot; at half health he boils over and is faster (Run); his fall drops every Fire piece (the weapon the
// hero's own type) and 30 Legendary jars with the picture card; the dev panel's spawn brings the whole roll-out and SPACE skips it; no page errors. Pictures in tools/test-logs/bullion-*.png.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9241,{dist:"./dist"}); const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await (await browser.newContext({viewport:{width:1100,height:680}})).newPage(); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.route("**/api/**",r=>r.fulfill({ status:200, contentType:"application/json", body:"{}" }));
await page.goto("http://127.0.0.1:9241/?silent&nogate&ownweapons&map=3",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel(),null,{timeout:120000});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?'PASS ':'FAIL ')+n+(d?'  -> '+d:'')); };
const shot=n=>page.screenshot({path:"tools/test-logs/bullion-"+n+".png"});
const H=await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); window.__freeze=true; const F=window.__feastHearth;
  const lanes={}; for(const k of ['E','N','S']){ const l=d.lanes()[k]; lanes[k]=d.pathLen(l.cx,l.cz); }
  const p=d.cw(44.6), z=F.zc; d.setHero(p,z,Math.PI/2); d.setKeys({d:0,w:0}); d.setCam(-Math.PI/2,.4,8); d.setKeys({w:1}); d.step(1/60,90); d.setKeys({w:0}); const reach=+d.hero.x.toFixed(2);
  await window.__bullion.load(); return { on:F.on, solid:F.solid(), cells:F.cells.map(([x,z])=>d.cellAt(x,z)), lanes, reach, x0:F.x0, flames:F.flames, loaded:window.__bullion.loaded(), meas:window.__bullion.meas() }; });
check('the hearth stands at the east end, its four squares solid',H.on&&H.solid&&H.flames>=12,JSON.stringify({ cells:H.cells, flames:H.flames }));
check('every door still reaches the Heartroot (E, N, S)',Object.values(H.lanes).every(v=>v>0),JSON.stringify(H.lanes));
check('the hero walking at the fire stops at the hearth, never inside it',H.reach<H.x0-1.6,JSON.stringify({ reach:H.reach, face:H.x0 }));
check('his model loads with its clips timed (slam lands, attack hit, boil peak, death fall)',H.loaded&&H.meas.slam>.3&&H.meas.attack>0&&H.meas.boil>.5&&H.meas.death>.3,JSON.stringify(H.meas));
// ---- wave 7 brings him in
const W=await page.evaluate(()=>{ const d=window.__dd; d.addMana(1e7); d.setHero(d.cw(12),d.cwz(13.5),Math.PI/2); d.setCam(Math.PI/2,.35,9); d.step(1/60,5); d.S.wave=6; d.S.phase='build'; d.startWave(); const q0=d.status().queue;
  let t=0; for(;t<60&&!window.__bullion.info().cut;t+=1/30) d.step(1/30,1); return { wave:d.S.wave, q0, t:+t.toFixed(1), info:window.__bullion.info(), st:window.__bullion.state()[0] }; });
check('the Feast Hall\'s wave 7 brings him in with the roll-out, a quarter of the way through',W.wave===7&&W.info.cut&&W.info.spawned===1&&W.st&&W.st.hp>0,JSON.stringify({ wave:W.wave, q0:W.q0, t:W.t, cut:W.info.cut }));
const TL=await page.evaluate(()=>window.__bullion.timeline());
check('the roll-out runs 25 to 30 seconds (build 530: the stamp holds 5 s longer to read)',TL.END>=25&&TL.END<=30,JSON.stringify({ END:+TL.END.toFixed(2), STAMP:+TL.STAMP.toFixed(2) }));
const M1=await page.evaluate(async T=>{ const d=window.__dd; d.step(1/30,Math.round(2.5*30)); return { asks:window.__bullion.info().musicAsks, off:window.__bullion.musOffset(), tracks:window.__mus.state().tracks }; },TL);
check('his music is asked for, starting so the stamp lands on the track\'s hit',M1.asks>=1&&M1.tracks.includes('bullion')&&Math.abs(M1.off-(TL.MUS_HIT-(TL.STAMP-2.5)))<.2,JSON.stringify(M1));
await page.evaluate(()=>window.__dd.step(1/30,Math.round(2.5*30))); await shot('1-hearth');
await page.evaluate(T=>window.__dd.step(1/30,Math.round((T.T_WALK-5-1)*30)),TL); await shot('2-walkout');
const SL=await page.evaluate(T=>{ const d=window.__dd; d.step(1/30,Math.round((T.SLAM0+1.5-(T.T_WALK-1))*30)); return window.__bullion.info(); },TL); await shot('3-slam');
check('mid-roll-out he slams: soup everywhere',SL.puddles>=3&&SL.fx>10,JSON.stringify({ puddles:SL.puddles, fx:SL.fx }));
await page.evaluate(T=>{ const d=window.__dd, now=window.__bullion.info().cutT; d.step(1/30,Math.round((T.STAMP+.6-now)*30)); },TL);
const ST=await page.evaluate(()=>window.__bullion.stamp()); await shot('4-stamp');
check('the freeze-frame stamp: SIR BULLION over Matt\'s line, word for word',ST.shown&&ST.title==='SIR BULLION'&&ST.line==="Just when you thought you couldn't screw up miso soup",JSON.stringify(ST));
const E1=await page.evaluate(()=>{ const d=window.__dd; d.step(1/30,30*12); return { info:window.__bullion.info(), st:window.__bullion.state()[0], cls:document.body.classList.contains('bullion-cut'), cam:d.camPos(), hero:{ x:d.hero.x, z:d.hero.z } }; });
check('the roll-out ends and gives the hall back, him out of the doors',!E1.info.cut&&!E1.cls&&E1.st&&E1.st.x<85&&Math.hypot(E1.cam.x-E1.hero.x,E1.cam.z-E1.hero.z)<14,JSON.stringify({ st:E1.st, cam:E1.cam }));
// ---- the fight, on its own: the rest of wave 7 is sent home (as the dev panel's jump does), the Heartroot can't fall
await page.evaluate(()=>{ const d=window.__dd; window.__clr=()=>{ d.S.crystal=Math.max(d.S.crystal,1e9); for(const e of d.enemies) if(e.kind!=='bullion'&&!e.dead&&!e.keep){ e.through=true; e.dead=.001; } }; const st=d.step; d.step=(dt,n)=>{ for(let i=0;i<(n||1);i++){ window.__clr(); st(dt,1); } }; });
// ---- the fight: Walk, Attack on a tower, Slam
const F=await page.evaluate(()=>{ const d=window.__dd, B=window.__bullion; const e=d.enemies.find(x=>x.kind==='bullion'&&!x.dead); e.hp=e.max=1e6; d.setHero(d.cw(8),d.cwz(22),0); d.step(1/60,2);
  const seen={}, rec=()=>{ const s=d.mobState(e); if(s&&s.cur) seen[s.cur]=(seen[s.cur]||0)+1; }; for(let i=0;i<60;i++){ d.step(1/30,1); rec(); }
  const fx=Math.sin(e.yaw), fz=Math.cos(e.yaw); const tw=d.placeDefAt('harpoon',e.x+fx*2.8,e.z+fz*2.8,0); tw.hp=tw.max=1e5; const hp0=tw.hp; e.atk=0; e.slamCd=30;
  for(let i=0;i<30*8&&B.info().towerPunch<1;i++){ d.step(1/30,1); rec(); } const punch=B.info().towerPunch, towerHp=tw.hp; for(let i=0;i<20;i++){ d.step(1/30,1); rec(); }
  e.slamCd=.5; for(let i=0;i<30*4;i++){ d.step(1/30,1); rec(); } const i2=B.info(); const hasTower=d.defs.includes(tw); if(hasTower){ const k=d.defs.indexOf(tw); d.defs[k].hp=1e5; }
  return { seen, punch, towerLost:+(hp0-towerHp).toFixed(1), slams:i2.slams, puddles:i2.puddles, hot:i2.hotPuddles, x:e.x }; });
check('he walks (Walk), punches the tower in his way (Attack) and slams (Slam)',F.seen.Walk>5&&F.seen.Attack>0&&F.seen.Slam>0&&F.punch>=1&&F.towerLost>0&&F.slams>=1&&F.hot>=2,JSON.stringify(F)); await shot('5-fight');
// ---- a puddle: burns a hero and a tower, never a mob, and dries up
const P=await page.evaluate(()=>{ const d=window.__dd, B=window.__bullion; const e=d.enemies.find(x=>x.kind==='bullion'&&!x.dead); e.slamCd=999; e.holdT=999; for(const t of d.defs.slice()) { t.hp=1e5; }
  const cx=d.cw(18), cz=d.cwz(16); d.setHero(cx,cz,0); d.hero.hp=d.hero.max; const tw=d.placeDefAt('snare',cx+1,cz+.6,0); tw.hp=tw.max=500; const g=d.spawn('goblin','S'); g.x=cx-1; g.z=cz-.8; g.hp=g.max=500; g.atk=1e9; g.holdT=999; g.keep=true;
  const n0=B.info().puddles, hb=B.info().heroBurn, tb=B.info().towerBurn, h0=d.hero.hp; B.addPuddle(cx,cz,2.6); for(let i=0;i<60;i++){ d.step(1/30,1); g.x=cx-1; g.z=cz-.8; d.setHero(cx,cz); }
  const out={ heroLost:+(h0-d.hero.hp).toFixed(1), towerLost:500-tw.hp, mobLost:500-g.hp, heroBurn:B.info().heroBurn-hb, towerBurn:B.info().towerBurn-tb };
  d.setHero(d.cw(8),d.cwz(22)); for(let i=0;i<30*7;i++) d.step(1/30,1); out.after=B.puddles().filter(p=>Math.hypot(p.x-cx,p.z-cz)<.5).length; d.kill(g); return out; });
check('a puddle burns the hero and a tower standing in it, never a mob, then dries up',P.heroLost>0&&P.towerLost>0&&P.mobLost===0&&P.heroBurn>0&&P.towerBurn>0&&P.after===0,JSON.stringify(P));
// ---- he walks the hall to the Heartroot (nothing in his way)
const R=await page.evaluate(()=>{ const d=window.__dd; const e=d.enemies.find(x=>x.kind==='bullion'&&!x.dead); for(let k=0;k<20&&d.defs.length;k++){ const t=d.defs[0]; d.sell({ x:t.x, z:t.z, y:0 }); }
  e.holdT=0; e.slamCd=999; d.setHero(d.cw(30),d.cwz(26.5)); let t=0, hit=false; for(;t<150;t+=1/30){ d.step(1/30,1); if(Math.hypot(e.x,e.z)<2.9+e.r+.6&&e.swing>=0){ hit=true; break; } } return { t:+t.toFixed(1), hit, at:[+e.x.toFixed(1),+e.z.toFixed(1)] }; });
check('he walks the hall to the Heartroot and hits it (never stuck)',R.hit,JSON.stringify(R));
// ---- the boil-over at half health
const B2=await page.evaluate(()=>{ const d=window.__dd, B=window.__bullion; const e=d.enemies.find(x=>x.kind==='bullion'&&!x.dead); e.x=d.cw(38); e.z=d.cwz(16); e.holdT=0; const s0=e.spd; d.setHero(d.cw(30),d.cwz(16),Math.PI/2); d.setCam(Math.PI/2,.3,10);
  e.hp=e.max*.49; d.step(1/30,1); const st=B.state()[0]; d.step(1/30,40); return { s0, st, boils:B.info().boils }; }); await shot('6-boilover');
const B3=await page.evaluate(()=>{ const d=window.__dd, B=window.__bullion; const e=d.enemies.find(x=>x.kind==='bullion'&&!x.dead); e.slamCd=999; const seen={}; for(let i=0;i<30*5;i++){ d.step(1/30,1); const s=d.mobState(e); if(s&&s.cur) seen[s.cur]=(seen[s.cur]||0)+1; } return { st:B.state()[0], seen }; });
check('at half health he boils over and is FURIOUS: faster, running',B2.boils===1&&B2.st.phase===2&&B2.st.special==='boil'&&B2.st.clip==='BoilOver'&&B3.st.spd>B2.s0*1.5&&B3.seen.Run>0,JSON.stringify({ s0:+B2.s0.toFixed(2), st:B2.st, after:B3.st, seen:B3.seen }));
// ---- his fall
const D=await page.evaluate(()=>{ const d=window.__dd; const b0=new Set(d.Meta.bag().map(b=>b.id).concat(Object.values(d.gear()).filter(Boolean).map(g=>g.id))); const j0=window.__jars.list().length, l0=d.loot.length; const e=d.enemies.find(x=>x.kind==='bullion'&&!x.dead); d.kill(e); d.step(1/30,30);
  const it=d.loot.map(l=>l.it).concat(d.Meta.bag().filter(b=>!b0.has(b.id)),Object.values(d.gear()).filter(g=>g&&!b0.has(g.id))).filter(i=>i&&i.setId==='lava'); const w=it.find(i=>i.slot==='weapon'); const info=window.__bullion.info();
  const r={ fire:it.map(i=>i.slot), names:it.map(i=>i.name), wtype:w?window.__typed.of(w):null, mine:window.__typed.heroTypes()[0], jars:window.__jars.list().length-j0, card:info.fall, cardText:document.getElementById('bullfall').textContent, corpse:info.corpses, deaths:info.deaths };
  d.step(1/30,30*7); r.corpseAfter=window.__bullion.info().corpses; return r; }); await shot('7-fall');
check('his fall drops every Fire piece (the weapon the hero\'s own type) and 30 Legendary jars',D.deaths===1&&D.fire.length===5&&new Set(D.fire).size===5&&D.wtype===D.mine&&D.jars>=30,JSON.stringify(D));
check('the picture card says SIR BULLION FALLS, his body sinks into the soup and is gone',D.card&&/SIR BULLION FALLS/.test(D.cardText)&&D.corpse===1&&D.corpseAfter===0,JSON.stringify({ card:D.card, corpse:D.corpse, after:D.corpseAfter }));
// ---- the dev panel's spawn: the whole roll-out; SPACE skips it (not a click, not a held key, not in its first second)
const V=await page.evaluate(()=>{ const d=window.__dd; const n0=window.__bullion.info().intro; window.__devpanel.spawnNow('bullion'); d.step(1/30,45); const i=window.__bullion.info(); return { started:i.intro-n0, cut:i.cut, t:i.cutT, alive:window.__bullion.state().length }; });
await page.mouse.click(500,300); await page.keyboard.down('KeyW'); for(let i=0;i<6;i++) await page.keyboard.down('KeyW'); await page.keyboard.up('KeyW');
const V2=await page.evaluate(()=>window.__bullion.info());
await page.keyboard.press('Space'); const V3=await page.evaluate(()=>{ window.__dd.step(1/30,20); return { info:window.__bullion.info(), st:window.__bullion.state()[0] }; });
check('the dev panel spawn brings him in with the whole roll-out',V.started===1&&V.cut&&V.alive===1,JSON.stringify(V));
check('a click and a held W do not skip it; SPACE does, and the fight starts',V2.cut&&V2.cutT>=V.t-.01&&!V3.info.cut&&V3.info.skipped>=1&&V3.st&&V3.st.x<85,JSON.stringify({ before:V.t, held:V2.cutT, after:V3.info.cut, st:V3.st }));
check('no page errors',errors.length===0,JSON.stringify(errors.slice(0,3))); await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
