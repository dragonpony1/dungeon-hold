// ===== THE TUTORIAL HALL (build 166, 89-tutorial.js). Matt: "prior to room one there is a tutorial hall. tutorial as a selection on
// the title screen gets rid of some buttons too. kill a goblin melee. next place a ballista, here's how, now g, oh look loot was
// dropped. its a tutorial room with one hall and in your face instruction". A brand-new player's PLAY reloads into the tutorial hall --
// its own tiny map, one straight hall from a door to the crystal -- which starts by itself: seven steps, one at a time, big and high in
// the middle with an arrow at the thing, each ticking ✓ and moving on by itself once the player has really done it. Played through here
// by real inputs where it is practical (keys, clicks, taps; __dd for walking and turning), on a computer and once on a phone (touch
// wording), to MOVE ON landing in room one (started by itself) with dd_tutorial 'done'. Also: "skip" goes to room one (from the title,
// and from the tutorial's own title); a page nobody pressed PLAY on is untouched, and so is PLAY on a ?silent page or in a browser a test
// drives (navigator.webdriver -- music-test.mjs presses PLAY on a fresh save); 🎓 TUTORIAL on any title still goes (as the knight, the
// saved hero pick untouched). The "real player" contexts here hide navigator.webdriver. Screenshots in tools/scratch-tutorial/. Port 8807.
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path"; import fs from "fs";
const SP=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/,"")); const DIST=process.env.DIST||SP+"/dist";
const SHOTS=SP+"/tools/scratch-tutorial"; fs.mkdirSync(SHOTS,{recursive:true});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8807, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];
const READY=()=>window.__dd&&window.__tutorial&&window.__campaign&&window.__tavern&&window.__heroes&&window.__trainer;
async function context(opts,o){ o=o||{}; const ctx=await browser.newContext(opts); await ctx.addInitScript(o=>{ try{ if(o.real) Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false,configurable:true});   /* a real player's browser, not one a test drives */
    if(!localStorage.getItem('ddSound')) localStorage.setItem('ddSound','off'); if(o.seed&&!sessionStorage.getItem('seeded')){ sessionStorage.setItem('seeded','1'); for(const k in o.seed) localStorage.setItem(k,o.seed[k]); } }catch(e){} },o); return ctx; }   // sound off is no part of the fresh-save rule (dd_tutorial, ddMapsCleared); a seed goes in once, before the first load
async function open(ctx,url){ const p=await ctx.newPage(); p.setDefaultTimeout(120000); p.on("pageerror",e=>errors.push(String(e))); await p.goto(BASE+"/"+(url||""),{timeout:240000}); await p.waitForFunction(READY,null,{timeout:180000}); return p; }
async function landed(p,rx,phase){ await p.waitForURL(rx,{timeout:90000}).catch(()=>{}); await p.waitForFunction(READY,null,{timeout:180000}).catch(()=>{}); if(phase) await p.waitForFunction(ph=>window.__dd.S.phase===ph,phase,{timeout:60000}).catch(()=>{}); }
const view=p=>p.evaluate(()=>{ const T=window.__tutorial, d=window.__dd; return {step:T.step(),i:T.index(),beat:T.beat(),main:T.main(),how:T.how(),shown:T.shown(),low:T.low(),arrow:T.arrow(),glow:T.glow(),marker:T.marker(),phase:d.S.phase,wave:d.S.wave,held:d.S.held,mana:Math.round(d.S.mana),finished:T.finished()}; });
const run=(p,sec)=>p.evaluate(s=>window.__dd.step(1/60,Math.round(s*60)),sec);
async function until(p,fn,arg,maxSec){ for(let t=0;t<=maxSec;t+=.25){ const r=await p.evaluate(fn,arg); if(r) return r; await run(p,.25); } return null; }
const onStep=(p,id,maxSec)=>until(p,id=>window.__tutorial.step()===id&&!window.__tutorial.beat(),id,maxSec||6);   // the ✓ beat, then the next step comes by itself
const ticked=(p,maxSec)=>until(p,()=>window.__tutorial.beat()&&/^✓ /.test(window.__tutorial.main())?window.__tutorial.main():null,null,maxSec||3);
// face the nearest mob (walking up to it if it's far) and strike with the real button: F on a computer, ⚔ on a phone
async function strike(p,press){ const ok=await p.evaluate(()=>{ const d=window.__dd, h=d.hero; const al=d.enemies.filter(e=>!e.dead); if(!al.length) return false; let e=al[0], bd=1e9; for(const o of al){ const q=Math.hypot(o.x-h.x,o.z-h.z); if(q<bd){ bd=q; e=o; } }
    if(bd>2.1){ const dx=h.x-e.x, dz=h.z-e.z, l=Math.hypot(dx,dz)||1; d.setHero(e.x+dx/l*1.3,e.z+dz/l*1.3); } const yaw=Math.atan2(e.x-d.hero.x,e.z-d.hero.z); d.setHero(d.hero.x,d.hero.z,yaw); d.setCam(yaw,.34,8); d.step(1/60,1); return true; });
  if(ok){ await press(); await run(p,.45); } return ok; }
// a wave: the ballista works the lane; whatever gets within 11 of the crystal gets the sword. Returns whether a ballista bolt flew
async function holdWave(p,press,maxSec){ let bolt=false; for(let t=0;t<maxSec;t+=.5){ const s=await p.evaluate(()=>{ const d=window.__dd; return {phase:d.S.phase,held:d.S.held,near:d.enemies.some(e=>!e.dead&&Math.hypot(e.x,e.z)<11),bolt:d.projs.some(q=>q.kind==='harpoon')}; });
    bolt=bolt||s.bolt; if(s.phase!=='wave') return {bolt,held:s.held,phase:s.phase}; if(s.near) await strike(p,press); else await run(p,.5); } return {bolt,timeout:true}; }
async function walkToOrbs(p){ for(let k=0;k<30;k++){ const n=await p.evaluate(()=>{ const d=window.__dd; if(!d.orbs.length) return 0; const o=d.orbs[0]; d.setHero(o.x,o.z+.8); return d.orbs.length; }); if(!n) return true; await run(p,.5); } return false; }
async function pickLoot(p){ return until(p,()=>{ const d=window.__dd; if(window.__tutorial.lootItem()) return true; const l=d.loot[d.loot.length-1]; if(l) d.setHero(l.x,l.z+.5); return false; },null,8); }   // onto it: a piece at rest is picked up by walking over it

// ================= a computer: a brand-new player presses PLAY =================
{ const ctx=await context({viewport:{width:1280,height:720}},{real:true}); const p=await open(ctx);
  const t0=await p.evaluate(()=>{ const vis=id=>{ const e=document.getElementById(id); return !!e&&getComputedStyle(e).display!=='none'&&e.getClientRects().length>0; }; return {map:window.__dd.map(),phase:window.__dd.S.phase,fresh:window.__tutorial.fresh(),play:document.getElementById('playbtn').textContent,skip:vis('tutskip'),skipText:(document.getElementById('tutskip')||{}).textContent,tut:vis('tutbtn'),mp:vis('mpbtn'),heroes:vis('heroline')}; });
  check("a fresh save loads room one exactly as before (nothing changes until PLAY); the title keeps ENTER THE HALL, with a small 'skip the tutorial' under it and 🎓 TUTORIAL beside MULTIPLAYER",t0.map.index===0&&!t0.map.tutorial&&t0.phase==='start'&&t0.fresh&&/ENTER THE HALL/.test(t0.play)&&t0.skip&&/skip the tutorial/.test(t0.skipText)&&t0.tut&&t0.mp&&t0.heroes,JSON.stringify(t0));
  await p.click('#playbtn'); await landed(p,/tutorial=/,'build');
  const t1=await p.evaluate(()=>({map:window.__dd.map(),url:location.search,phase:window.__dd.S.phase,hero:window.__heroes.pick(),raven:!!window.__raven,portal:!!window.__portal}));
  check("PLAY sends the brand-new player to the TUTORIAL HALL (its own two-wave map, not one of the campaign's), which starts by itself; the address keeps ?tutorial=1 for a reload",t1.map.tutorial&&t1.map.id==='tutorial'&&t1.map.index===0&&t1.map.waves===2&&t1.phase==='build'&&/tutorial=1/.test(t1.url)&&!/tutorial=go/.test(t1.url),JSON.stringify(t1));
  check("no raven and no hideout portal in the tutorial hall; the knight is the hero",!t1.raven&&!t1.portal&&t1.hero==='knight',JSON.stringify(t1));
  await p.evaluate(()=>{ window.__freeze=true; window.__dd.step(1/60,20); });
  const v1=await view(p);
  check("step 1 of 7, big and high in the middle — 'Walk to the glowing spot', W A S D; the arrow stands over the spot, its marker glows",v1.step==='walk'&&v1.shown&&/Walk to the glowing spot/.test(v1.main)&&/W A S D/.test(v1.how)&&v1.arrow&&v1.arrow.to==='hall'&&Math.abs(v1.arrow.a-Math.PI/2)<.01&&v1.marker==='spot',JSON.stringify(v1));
  const look=await p.evaluate(()=>{ const r=document.getElementById('tut').getBoundingClientRect(), cs=getComputedStyle(document.querySelector('#tut .tm')); const slots=[...document.querySelectorAll('#hotbar .slot')].filter(e=>e.style.display!=='none').map(e=>e.id); return {top:Math.round(r.top),bottom:Math.round(r.bottom),left:Math.round(r.left),right:Math.round(r.right),font:parseFloat(cs.fontSize),slots,trainer:document.getElementById('trainer').classList.contains('on'),phaset:getComputedStyle(document.getElementById('phaset')).visibility}; });
  check("the panel is centred high (below the wave line, clear of the corner bars and buttons), its main line 30 px; only the Ballista's slot on the hotbar; no old guide card, no 'place defenses' line",look.top>=40&&look.bottom<200&&Math.abs((look.left+look.right)/2-640)<3&&look.left>270&&look.right<1010&&look.font>=28&&look.slots.join()==='slot-harpoon'&&!look.trainer&&look.phaset==='hidden',JSON.stringify(look));
  check("...and the arrow is below the panel, on the hall",v1.arrow.y>look.bottom,JSON.stringify({arrow:v1.arrow,panel:look.bottom}));
  await p.screenshot({path:SHOTS+"/tut-desktop-step1.png"});
  // the horn waits for its step
  await p.keyboard.press('KeyG'); await run(p,.2); const early=await p.evaluate(()=>({phase:window.__dd.S.phase,toast:document.getElementById('toast').textContent}));
  check("G before its step does nothing but say 'Not yet'",early.phase==='build'&&/Not yet/.test(early.toast),JSON.stringify(early));
  // 1. walk: real W
  await p.keyboard.down('KeyW'); const walked=await until(p,()=>window.__tutorial.beat(),null,4); await p.keyboard.up('KeyW');
  const v1b=await view(p);
  check("holding W walks the knight up the hall onto the spot: ✓ — and the arrow and marker step aside for the beat",!!walked&&/^✓ /.test(v1b.main)&&!v1b.arrow&&!v1b.marker,JSON.stringify(v1b));
  // 2. the goblin
  const g0=await onStep(p,'goblin'); const v2=await view(p);
  const gob=await p.evaluate(()=>{ const e=window.__tutorial.goblin(); return e?{kind:e.kind,dmg:e.dmg,z:Math.round(e.z)}:null; });
  check("the next step comes by itself: 'A goblin! Kill it with your sword' — click to swing (F too); a harmless goblin walks in at the door and the arrow is on it",!!g0&&/A goblin! Kill it with your sword/.test(v2.main)&&/click/.test(v2.how)&&gob&&gob.kind==='goblin'&&gob.dmg===0&&gob.z<=-26&&v2.arrow&&v2.i===1,JSON.stringify({v2,gob}));
  await until(p,()=>{ const e=window.__tutorial.goblin(); return !!e&&Math.hypot(e.x-window.__dd.hero.x,e.z-window.__dd.hero.z)<6; },null,12);
  let slain=null; for(let k=0;k<14&&!slain;k++){ await strike(p,()=>p.keyboard.press('KeyF')); slain=await p.evaluate(()=>window.__tutorial.beat()); }
  const v2b=await view(p);
  check("F swings the sword: the goblin falls and the step ticks ✓ Goblin down!",!!slain&&/Goblin down/.test(v2b.main),JSON.stringify(v2b));
  // 3. the ballista: press 1, look at the marker, click, click
  await onStep(p,'ballista'); const v3=await view(p);
  check("'Build a BALLISTA' — press 1; the arrow points at the Ballista's hotbar slot, which glows, and the marker shows on the lane",/Build a SAW BLADE GUNNER/.test(v3.main)&&/press 1/.test(v3.how)&&v3.arrow&&v3.arrow.to==='slot-harpoon'&&v3.glow.includes('slot-harpoon')&&v3.marker==='mark',JSON.stringify(v3));
  await p.keyboard.press('Digit1'); await p.keyboard.press('Digit2'); await run(p,.1);
  const v3b=await view(p); const pk=await p.evaluate(()=>window.__dd.ghost()&&document.querySelector('#hotbar .slot.sel')?document.querySelector('#hotbar .slot.sel').id:null);
  check("1 picks the ballista (2, the hedge, does nothing here): 'Put it on the glowing marker' — look at it, click to set it down; the marker is behind the knight, so the arrow waits at the screen's edge",pk==='slot-harpoon'&&/Put it on the glowing marker/.test(v3b.main)&&/click to set it down/.test(v3b.how)&&v3b.arrow&&v3b.arrow.to==='edge'&&v3b.marker==='mark',JSON.stringify({pk,v3b}));
  await p.evaluate(()=>{ const d=window.__dd, T=window.__tutorial; d.setHero(0,T.mark[1]-6,0); d.setCam(0,.34,8); d.step(1/60,20); });   // turn round and look back down the hall at the marker (the crystal beyond it)
  const gh=await p.evaluate(()=>window.__dd.ghost()); const v3x=await view(p);
  check("aimed near it, the ghost snaps onto the marker, green, facing the door (north) whichever way the knight looks; the arrow is on the marker now",!!gh&&Math.abs(gh.x-0)<.01&&Math.abs(gh.z-(-12))<.01&&gh.ok&&Math.abs(Math.abs(gh.yaw)-Math.PI)<.01&&v3x.arrow&&v3x.arrow.to==='hall',JSON.stringify({gh,arrow:v3x.arrow}));
  await p.screenshot({path:SHOTS+"/tut-desktop-step3.png"});
  await p.mouse.click(640,420); await run(p,.1); const v3c=await view(p);
  check("a click sets it down: 'Click once more to build it'",/Click once more to build it/.test(v3c.main),JSON.stringify(v3c));
  await p.mouse.click(640,420); await run(p,.1);
  const built=await p.evaluate(()=>{ const b=window.__dd.defs.find(d=>d.kind==='harpoon'); return b?{x:b.x,z:b.z,rot:+b.rot.toFixed(3)}:null; }); const v3d=await view(p);
  check("a second click builds it on the marker, facing the door: ✓ Ballista built!",!!built&&built.x===0&&built.z===-12&&Math.abs(Math.abs(built.rot)-Math.PI)<.01&&/Saw Blade Gunner built/.test(v3d.main),JSON.stringify({built,v3d}));
  // 4. the horn and the first wave
  await onStep(p,'horn'); const v4=await view(p);
  check("'Now sound the horn' — press G; the arrow is on START WAVE, which glows",/Now sound the horn/.test(v4.main)&&/press G/.test(v4.how)&&v4.arrow&&v4.arrow.to==='wavebtn'&&v4.glow.includes('wavebtn'),JSON.stringify(v4));
  await p.keyboard.press('KeyG'); await run(p,.3); const v4b=await view(p); const comp=await p.evaluate(()=>window.__dd.status().queue+window.__dd.status().enemies);
  check("G sounds it: a tiny wave (three goblins), and the panel says 'Here they come!'",v4b.phase==='wave'&&v4b.wave===1&&comp===3&&/Here they come/.test(v4b.main),JSON.stringify({v4b,comp}));
  const w1=await holdWave(p,()=>p.keyboard.press('KeyF'),120); await p.evaluate(()=>window.__dd.setHero(0,-16,Math.PI));   // the player is up the hall when the reward lands by the crystal
  const v4c=await view(p); const rails=await p.evaluate(()=>({guarantee:window.__forest.guarantee(1),locker:localStorage.getItem('dd_forest_locker'),cleared:localStorage.getItem('ddMapsCleared')}));
  check("the ballista shoots down the hall and the wave is held: ✓ Wave held!",w1.bolt&&w1.phase==='build'&&/Wave held/.test(v4c.main),JSON.stringify({w1,v4c}));
  check("none of map one's Forest rails run in here (no guaranteed pieces, nothing in the locker)",rails.guarantee===0&&rails.locker===null,JSON.stringify(rails));
  // 5. loot: pick it up, open the bag, equip it
  await onStep(p,'loot'); const v5=await view(p);
  check("'Oh look — LOOT!': walk over the piece by the crystal; the arrow points the way",/Oh look — LOOT/.test(v5.main)&&v5.arrow,JSON.stringify(v5));
  await pickLoot(p); await run(p,.2); const v5b=await view(p);
  check("walked over, it is bagged: 'Open your bag' — press B, the arrow on the 🎒 button",/Open your bag/.test(v5b.main)&&/press B/.test(v5b.how)&&v5b.arrow&&v5b.arrow.to==='bagbtn',JSON.stringify(v5b));
  await p.keyboard.press('KeyB'); await sleep(150); await run(p,.1); await sleep(150);
  const v5c=await view(p); const det=await p.evaluate(()=>{ const b=document.querySelector('#tv-detail [data-act="equip"]'); const r=b&&b.getBoundingClientRect(); return {btn:!!b&&r.width>0,sel:window.__tavern.state().sel,item:window.__tutorial.lootItem()&&window.__tutorial.lootItem().id}; });
  check("B opens the bag with the new piece already picked: 'Equip it' — click EQUIP, the arrow on the EQUIP button; the panel moves down out of the bag's way",/Equip it/.test(v5c.main)&&/click EQUIP/.test(v5c.how)&&det.btn&&det.sel&&det.sel.id===det.item&&v5c.arrow&&/Equip/.test(v5c.arrow.to)&&v5c.low,JSON.stringify({v5c,det}));
  await p.screenshot({path:SHOTS+"/tut-desktop-equip.png"});
  await p.click('#tv-detail [data-act="equip"]'); await sleep(100); await run(p,.1);
  const v5d=await view(p); const worn=await p.evaluate(id=>Object.values(window.__dd.gear()).some(g=>g&&g.id===id),det.item);
  check("clicking EQUIP wears it: ✓ Equipped",worn&&/Equipped/.test(v5d.main),JSON.stringify(v5d));
  // 6. close the bag, the orbs, the upgrade
  await onStep(p,'upgrade'); const v6=await view(p);
  check("'Close your bag' — press B, the arrow on the bag's ✕",/Close your bag/.test(v6.main)&&/press B/.test(v6.how)&&v6.arrow&&v6.arrow.to==='tv-close',JSON.stringify(v6));
  await p.keyboard.press('KeyB'); await run(p,.2); const v6b=await view(p);
  check("B closes it: 'Grab the blue mana orbs'",/Grab the blue mana orbs/.test(v6b.main)&&v6b.arrow,JSON.stringify(v6b));
  await walkToOrbs(p); await run(p,.3); const v6c=await view(p);
  check("orbs grabbed: 'Upgrade your ballista' — walk up to it and press E (and the hall has lent what the upgrade costs)",/Upgrade your saw blade gunner/.test(v6c.main)&&/press E/.test(v6c.how)&&v6c.arrow&&v6c.mana>=100,JSON.stringify(v6c));
  await p.evaluate(()=>{ const d=window.__dd, b=d.defs.find(x=>x.kind==='harpoon'); d.setHero(b.x,b.z+2,Math.PI); d.setCam(Math.PI,.34,8); d.step(1/60,4); });
  await p.keyboard.press('KeyE'); await run(p,.1); const up=await p.evaluate(()=>window.__dd.defs.find(x=>x.kind==='harpoon').lvl); const v6d=await view(p);
  check("E by the ballista makes it Mark II: ✓ Mark II",up===2&&/Mark II/.test(v6d.main),JSON.stringify({up,v6d}));
  // 7. the last wave, HALL HELD, MOVE ON
  await onStep(p,'last'); const v7=await view(p);
  check("'One last wave' — press G, the arrow on the horn",/One last wave/.test(v7.main)&&/press G/.test(v7.how)&&v7.arrow&&v7.arrow.to==='wavebtn',JSON.stringify(v7));
  await p.keyboard.press('KeyG'); await run(p,.2); const v7b=await view(p);
  check("G: the last wave (five goblins) — 'Hold the hall!'",v7b.phase==='wave'&&v7b.wave===2&&/Hold the hall/.test(v7b.main),JSON.stringify(v7b));
  const w2=await holdWave(p,()=>p.keyboard.press('KeyF'),150); await run(p,.2); const v7c=await view(p);
  const lap=await p.evaluate(()=>({btn:document.getElementById('wavebtn').textContent,cleared:localStorage.getItem('ddMapsCleared'),tut:localStorage.getItem('dd_tutorial')}));
  check("held: the victory lap (build 160) — 'HALL HELD!', press G to move on to room one, the horn button reads ▶ MOVE ON; nothing unlocked (ddMapsCleared untouched), not marked done yet",w2.held&&v7c.held&&/HALL HELD/.test(v7c.main)&&/press G to move on to room one/.test(v7c.how)&&/MOVE ON/.test(lap.btn)&&lap.cleared===null&&lap.tut===null,JSON.stringify({w2,v7c,lap}));
  await sleep(2200); await p.keyboard.press('KeyG'); await sleep(100); const v7d=await view(p); const done=await p.evaluate(()=>localStorage.getItem('dd_tutorial'));
  check("G moves on: '✓ Tutorial complete!' and dd_tutorial is 'done'",v7d.finished&&/Tutorial complete/.test(v7d.main)&&done==='done',JSON.stringify({v7d,done}));
  await landed(p,/[?&]map=0/,'build');
  const r1=await p.evaluate(()=>({url:location.search,map:window.__dd.map(),phase:window.__dd.S.phase,tut:window.__tutorial.on,done:localStorage.getItem('dd_tutorial'),trainer:JSON.parse(localStorage.getItem('dd_trainer')||'null'),btn:!!document.getElementById('tutbtn'),skip:!!document.getElementById('tutskip'),gear:Object.values(window.__dd.gear()).filter(Boolean).length}));
  check("...and straight into room one (?map=0, THE GNOME HALL, started by itself); no more 'skip the tutorial' under PLAY, the 🎓 TUTORIAL button there to take it again; the equipped piece came along",r1.map.index===0&&!r1.map.tutorial&&r1.map.id==='hall'&&r1.phase==='build'&&!r1.tut&&/map=0/.test(r1.url)&&!/tutorial/.test(r1.url)&&r1.btn&&!r1.skip&&r1.gear>=1,JSON.stringify(r1));
  const g1=await p.evaluate(()=>({card:document.getElementById('trainer').classList.contains('on'),banner:document.getElementById('banner').textContent,goblin:window.__trainer.w0().spawned}));
  check("room one's old guide card has nothing left to teach (every dd_trainer step done): no card, no TRAINING GROUND banner, no wave-zero goblin",!!r1.trainer&&['slay','ballista','horn','orb','loot','equip','locker','more'].every(k=>r1.trainer.done[k])&&!g1.card&&!/TRAINING GROUND/.test(g1.banner)&&!g1.goblin,JSON.stringify({t:r1.trainer,g1}));
  await p.goto(BASE+"/",{timeout:240000}); await p.waitForFunction(READY,null,{timeout:180000}); await sleep(800);
  check("a plain load after that is room one's title, and PLAY no longer goes to the tutorial",await p.evaluate(()=>!window.__dd.map().tutorial&&window.__dd.S.phase==='start'&&!window.__tutorial.fresh()));
  await ctx.close(); }

// ================= a phone (touch): a brand-new player taps PLAY =================
// build 595: a phone held upright now shows a TURN YOUR PHONE card over everything (99v-phone.js) -- the phone here is held sideways, as the game is played
{ const ctx=await context({viewport:{width:844,height:390},hasTouch:true,isMobile:true},{real:true}); const p=await open(ctx);
  const tap=async sel=>{ await p.tap(sel); await run(p,.05); };
  const tapHb=async t=>{ await p.locator('#btns .hb',{hasText:t}).first().tap(); await run(p,.05); };
  await p.tap('#playbtn'); await landed(p,/tutorial=/,'build');
  check("the phone's PLAY sends a fresh save to the tutorial hall too, started by itself",await p.evaluate(()=>window.__dd.map().tutorial&&window.__dd.S.phase==='build'&&document.body.classList.contains('touch')));
  await p.evaluate(()=>{ window.__freeze=true; window.__dd.step(1/60,20); });
  const t1=await view(p); const box=await p.evaluate(()=>{ const r=document.getElementById('tut').getBoundingClientRect(); return {top:Math.round(r.top),bottom:Math.round(r.bottom),left:Math.round(r.left),right:Math.round(r.right),font:parseFloat(getComputedStyle(document.querySelector('#tut .tm')).fontSize)}; });
  check("touch wording: 'Walk to the glowing spot' — drag the joystick; the joystick glows",/Walk to the glowing spot/.test(t1.main)&&/joystick/.test(t1.how)&&!/W A S D/.test(t1.how)&&t1.glow.includes('joy'),JSON.stringify(t1));
  const bl=await p.evaluate(()=>{ const xs=[...document.querySelectorAll("#btns .hb")].filter(b=>b.offsetParent).map(b=>b.getBoundingClientRect().left); return { btnL:Math.round(Math.min(...xs)), W:innerWidth }; });
  check("on a phone held sideways (build 595) the panel sits on screen, clear of the touch buttons on the right, with a 20 px+ main line",box.left>=4&&box.right<=bl.btnL-4&&box.right<=bl.W&&box.font>=20&&box.top>=40,JSON.stringify({box,bl}));
  await p.screenshot({path:SHOTS+"/tut-phone-step1.png"});
  await p.evaluate(()=>{ const d=window.__dd, T=window.__tutorial; d.setHero(T.spot[0],T.spot[1]+.5); }); await ticked(p);
  await onStep(p,'goblin'); const t2=await view(p);
  check("touch: 'A goblin! Kill it with your sword' — tap ⚔, which glows",/tap ⚔/.test(t2.how)&&t2.glow.includes('⚔'),JSON.stringify(t2));
  await until(p,()=>{ const e=window.__tutorial.goblin(); return !!e&&Math.hypot(e.x-window.__dd.hero.x,e.z-window.__dd.hero.z)<6; },null,12);
  let slain=null; for(let k=0;k<14&&!slain;k++){ await strike(p,()=>tapHb('⚔')); slain=await p.evaluate(()=>window.__tutorial.beat()); }
  check("tapping ⚔ slays it",!!slain);
  await onStep(p,'ballista'); const t3=await view(p);
  check("touch: 'Build a BALLISTA' — tap the 🏹 Ballista slot at the bottom, the arrow on it",/tap the 🪚 Saw Blade Gunner slot/.test(t3.how)&&t3.arrow&&t3.arrow.to==='slot-harpoon',JSON.stringify(t3));
  await p.screenshot({path:SHOTS+"/tut-phone-step3.png"});
  await tap('#slot-harpoon'); await p.evaluate(()=>{ const d=window.__dd, T=window.__tutorial; d.setHero(0,T.mark[1]-5.5,0); d.setCam(0,.34,8); d.step(1/60,20); });
  const t3b=await view(p);
  check("touch: 'Put it on the glowing marker' — walk toward it, tap ✔ (glowing)",/Put it on the glowing marker/.test(t3b.main)&&/tap ✔/.test(t3b.how)&&t3b.glow.includes('✔'),JSON.stringify(t3b));
  await tapHb('✔'); const t3c=await view(p); await tapHb('✔'); await run(p,.1);
  const tb=await p.evaluate(()=>{ const b=window.__dd.defs.find(d=>d.kind==='harpoon'); return b?{x:b.x,z:b.z,rot:+b.rot.toFixed(3)}:null; });
  check("✔ sets it down ('Tap ✔ again'), ✔ again builds it on the marker, facing the door",/Tap ✔ again/.test(t3c.main)&&!!tb&&tb.x===0&&tb.z===-12&&Math.abs(Math.abs(tb.rot)-Math.PI)<.01,JSON.stringify({t3c,tb}));
  await onStep(p,'horn'); const t4=await view(p);
  check("touch: 'Now sound the horn' — tap 📯 START WAVE",/tap 📯 START WAVE/.test(t4.how),JSON.stringify(t4));
  await tap('#wavebtn'); const w1=await holdWave(p,()=>tapHb('⚔'),120);
  check("tapping START WAVE sounds it and the wave is held",w1.phase==='build'&&!w1.timeout,JSON.stringify(w1));
  await onStep(p,'loot'); await pickLoot(p); await run(p,.2); const t5=await view(p);
  check("touch: 'Open your bag' — tap 🎒 (glowing)",/Open your bag/.test(t5.main)&&/tap 🎒/.test(t5.how)&&t5.glow.includes('🎒'),JSON.stringify(t5));
  await tapHb('🎒'); await sleep(150); await run(p,.1); await sleep(150); const t5b=await view(p);
  check("touch: 'Equip it' — tap EQUIP (the panel moves to the top, out of the bag's way)",/tap EQUIP/.test(t5b.how)&&t5b.low,JSON.stringify(t5b));
  await p.screenshot({path:SHOTS+"/tut-phone-equip.png"});
  await tap('#tv-detail [data-act="equip"]'); await onStep(p,'upgrade'); const t6=await view(p);
  check("touch: 'Close your bag' — tap ✕",/Close your bag/.test(t6.main)&&/tap ✕/.test(t6.how),JSON.stringify(t6));
  await tap('#tv-close'); await walkToOrbs(p); await run(p,.3); const t6b=await view(p);
  check("touch: 'Upgrade your ballista' — tap 🔧 (glowing)",/Upgrade your saw blade gunner/.test(t6b.main)&&/tap 🔧/.test(t6b.how)&&t6b.glow.includes('🔧'),JSON.stringify(t6b));
  await p.evaluate(()=>{ const d=window.__dd, b=d.defs.find(x=>x.kind==='harpoon'); d.setHero(b.x,b.z+2,Math.PI); d.setCam(Math.PI,.34,8); d.step(1/60,4); }); await tapHb('🔧');
  check("🔧 by the ballista upgrades it",await p.evaluate(()=>window.__dd.defs.find(x=>x.kind==='harpoon').lvl===2));
  await onStep(p,'last'); await tap('#wavebtn'); const w2=await holdWave(p,()=>tapHb('⚔'),150); await run(p,.2); const t7=await view(p);
  check("touch: the last wave held — 'HALL HELD!', tap ▶ MOVE ON (top right) to go to room one",w2.held&&/HALL HELD/.test(t7.main)&&/tap ▶ MOVE ON/.test(t7.how),JSON.stringify({w2,t7}));
  await p.tap('#wavebtn'); await landed(p,/[?&]map=0/,'build');
  const r=await p.evaluate(()=>({map:window.__dd.map(),phase:window.__dd.S.phase,done:localStorage.getItem('dd_tutorial')}));
  check("▶ MOVE ON goes straight into room one, the tutorial marked done",r.map.index===0&&!r.map.tutorial&&r.phase==='build'&&r.done==='done',JSON.stringify(r));
  await ctx.close(); }

// ================= the skips =================
{ const ctx=await context({viewport:{width:1100,height:700}},{real:true}); const p=await open(ctx);
  await p.click('#tutskip'); await sleep(300);
  const s=await p.evaluate(()=>({map:window.__dd.map(),phase:window.__dd.S.phase,done:localStorage.getItem('dd_tutorial'),url:location.search,link:!!document.getElementById('tutskip')}));
  check("the title's 'skip the tutorial' goes straight into room one (no reload) and remembers it (dd_tutorial 'skipped')",s.map.index===0&&!s.map.tutorial&&s.phase==='build'&&s.done==='skipped'&&!s.link,JSON.stringify(s));
  await ctx.close(); }
{ const ctx=await context({viewport:{width:1100,height:700}},{real:true}); const p=await open(ctx,"?tutorial=1");
  const q=await p.evaluate(()=>{ const vis=id=>{ const e=document.getElementById(id); return !!e&&getComputedStyle(e).display!=='none'&&e.getClientRects().length>0; }; return {map:window.__dd.map(),phase:window.__dd.S.phase,play:document.getElementById('playbtn').textContent,skip:vis('tutskip'),heroes:vis('heroline'),hideout:vis('hideoutbtn'),mp:vis('mpRow'),line:document.getElementById('mapline').textContent}; });
  check("?tutorial=1 (a reload in the tutorial) shows its own title: START THE TUTORIAL with a 'skip' under it; the hero cards, THE HIDEOUT and MULTIPLAYER gone; the map line is the tutorial hall",q.map.tutorial&&q.phase==='start'&&/START THE TUTORIAL/.test(q.play)&&q.skip&&!q.heroes&&!q.hideout&&!q.mp&&/TUTORIAL HALL/.test(q.line),JSON.stringify(q));
  await p.screenshot({path:SHOTS+"/tut-title.png"});
  await p.click('#tutskip'); await landed(p,/[?&]map=0/,'build');
  const s2=await p.evaluate(()=>({map:window.__dd.map(),phase:window.__dd.S.phase,done:localStorage.getItem('dd_tutorial'),url:location.search}));
  check("its 'skip' goes straight into room one too (dd_tutorial 'skipped')",s2.map.index===0&&!s2.map.tutorial&&s2.phase==='build'&&s2.done==='skipped'&&!/tutorial/.test(s2.url),JSON.stringify(s2));
  await ctx.close(); }
// ================= pages that are not a real player's fresh PLAY =================
{ const ctx=await context({viewport:{width:1100,height:700}}); const p=await open(ctx);
  const a=await p.evaluate(()=>({fresh:window.__tutorial.fresh(),skip:!!document.getElementById('tutskip')})); await p.click('#playbtn'); await sleep(500);
  const a2=await p.evaluate(()=>({map:window.__dd.map(),phase:window.__dd.S.phase,url:location.search}));
  check("a browser a test drives (navigator.webdriver, like music-test.mjs) presses PLAY on a fresh save without ?silent: room one, as before",!a.fresh&&!a.skip&&!a2.map.tutorial&&a2.phase==='build'&&a2.map.index===0,JSON.stringify({a,a2}));
  await ctx.close(); }
{ const ctx=await context({viewport:{width:1100,height:700}},{real:true,seed:{ddMapsCleared:'1',ddHero:'witch'}}); const p=await open(ctx,"?silent&nogate");
  const q=await p.evaluate(()=>({map:window.__dd.map(),on:window.__tutorial.on,fresh:window.__tutorial.fresh(),btn:!!document.getElementById('tutbtn')&&getComputedStyle(document.getElementById('tutbtn')).display!=='none',hero:window.__heroes.pick()}));
  check("a ?silent page is never sent to the tutorial (the test suites' pages stay as they were); the title has a 🎓 TUTORIAL button",!q.map.tutorial&&!q.on&&!q.fresh&&q.btn&&q.hero==='witch',JSON.stringify(q));
  await p.click('#tutbtn'); await landed(p,/tutorial=/,'build');
  const q2=await p.evaluate(()=>({map:window.__dd.map(),phase:window.__dd.S.phase,on:window.__tutorial.on,url:location.search,hero:window.__heroes.pick(),saved:localStorage.getItem('ddHero')}));
  check("🎓 TUTORIAL goes into it and starts it (other flags kept) — as the knight, though the witch is picked; her pick stays saved",q2.map.tutorial&&q2.on&&q2.phase==='build'&&/silent/.test(q2.url)&&q2.hero==='knight'&&q2.saved==='witch',JSON.stringify(q2));
  await ctx.close(); }
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
const bad=results.filter(x=>!x).length; console.log(`\n${results.length-bad}/${results.length} passed`); process.exit(bad?1:0);
