// ===== CINEMATICS (build 535 prep): the framework (parts/staging/96s-cinematics.js) and its first scene, THE TORCH LINE (96s2-torchline.js) -- Matt's own vision for the Deep Prison: "come in dark then a
// light in the distance then as it gets closer its the fire from the torches in that long line of goblins and orcs". Checked: entering the prison plays it by itself, once (not again on the next visit);
// while it plays the HUD steps aside, the letterbox is on, the hall holds still (G does not sound the horn), and its marchers are stand-ins (no real enemy is ever made); SPACE skips it; afterwards the
// hall is exactly as it was (HUD back, build phase, wave 0, every light put back, no scene object left); the title's 🎬 gallery shows it locked before, then as a card that plays it again; the dev panel's
// picker plays it; in co-op the host's scene plays on the guest and the host's skip ends it there, and a guest who joins after it began never starts it.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=await serve(9153,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const BASE="http://127.0.0.1:9153/";
async function newPage(seen){ const ctx=await browser.newContext({viewport:{width:1100,height:640}}); await ctx.addInitScript(s=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); if(s) localStorage.setItem("dd_cine_seen",s); }catch(e){} },seen||null);
  const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e))); await page.route("**/api/**",r=>r.fulfill({status:200,body:"ok"})); return { ctx, page }; }
async function loadPrison(page,q){ await page.goto(BASE+"?silent&nogate&map=5"+(q||""),{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__prisondecor&&window.__dd.map().id==='prison'&&window.CINE&&window.__torchline,null,{timeout:120000});
  for(let i=0;i<160;i++){ const ok=await page.evaluate(()=>{ const k=window.__prisonkit&&window.__prisonkit.info(); return !!(k&&k.modules>0&&window.__dd.mobModel&&window.__dd.mobModel('goblin')&&window.__dd.mobModel('orc')); }).catch(()=>false); if(ok) break; await sleep(250); } }
const lightsSnap=()=>{ const sc=window.__dd.scene; const out=[]; sc.traverse(o=>{ if(o.isLight) out.push([o.type,o.color.getHex(),+(o.distance||0).toFixed(2),+(o.decay||0).toFixed(2),+o.position.x.toFixed(2),+o.position.y.toFixed(2),+o.position.z.toFixed(2),o.userData&&o.userData.base!==undefined?+o.userData.base.toFixed(3):null,o.type!=='PointLight'?+o.intensity.toFixed(3):null].join('|')); });
  if(!window.__visBefore){ window.__visBefore=[]; sc.traverse(o=>{ if(o.visible) window.__visBefore.push(o); }); } const lost=window.__visBefore.filter(o=>!o.visible).length;   // the game's own first frames add a line set and a points cloud: kids counted without those
  return { lights:out, kids:sc.children.filter(o=>!o.isLineSegments&&!o.isPoints).length, lost, fog:[sc.fog.near,sc.fog.far,sc.fog.color.getHex()], bg:sc.background&&sc.background.getHex?sc.background.getHex():null, far:window.__dd.camera.far }; };

// ---------------------------------------------------------------- 1. entering the prison: it plays by itself, once
{ const { ctx, page }=await newPage();
  await loadPrison(page,"&cineauto");
  const g0=await page.evaluate(()=>{ const c=document.querySelector('#cineGal'); window.CINE.openGallery(); const card=c.querySelector('.cg-card'); const o={ n:c.querySelectorAll('.cg-card').length, locked:!!(card&&card.classList.contains('locked')), btn:!!document.getElementById('cinebtn') }; window.CINE.closeGallery(); return o; });
  check("before it is seen, the title's 🎬 CINEMATICS gallery shows THE TORCH LINE as a locked card",g0.btn&&g0.n===1&&g0.locked,JSON.stringify(g0));
  await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__freeze=true; window.__dd.start(); });
  const before=await page.evaluate(lightsSnap); await page.evaluate(()=>{ window.__freeze=false; });
  let st=null; for(let i=0;i<120;i++){ st=await page.evaluate(()=>window.__cine.info()); if(st.active&&!st.wait&&st.t>2.2) break; await sleep(100); }
  check("the first build phase of the Deep Prison starts THE TORCH LINE by itself (letterbox on, the screen black for its opening)",st.active==='torchline'&&st.autos===1&&st.bars&&st.body,JSON.stringify({ active:st.active, autos:st.autos, t:st.t, bars:st.bars }));
  const hud=await page.evaluate(()=>({ hud:getComputedStyle(document.getElementById('hud')).visibility, mm:document.getElementById('minimap')?getComputedStyle(document.getElementById('minimap')).visibility:null }));
  check("while it plays the HUD and the mini-map step aside",hud.hud==='hidden'&&(hud.mm===null||hud.mm==='hidden'),JSON.stringify(hud));
  for(let i=0;i<60;i++){ const t=await page.evaluate(()=>window.__cine.info().t); if(t>12) break; await sleep(200); }
  const mid=await page.evaluate(()=>{ const d=window.__dd, tl=window.__torchline.info(), ci=window.__cine.info(); let inEnemies=0; const g=window.__cine.group(); if(g) g.traverse(o=>{ if(d.enemies.some(e=>e.mdl&&e.mdl.g===o)) inEnemies++; });
    return { marchers:tl.marchers, torches:tl.torches, alive:tl.alive, glb:tl.glb, enemies:d.enemies.length, status:d.status(), inEnemies, lit:ci.lit, borrowed:ci.borrowed, darkened:ci.darkened, lane:tl.path&&tl.path.lane, len:tl.path&&tl.path.len }; });
  check("a long line of goblins and orcs (the real models) with torches walks the horde's own road from the east cells; eight of the map's own lights follow the torches",mid.marchers>=60&&mid.torches>=40&&mid.alive>=3&&mid.glb>=60&&mid.lane==='E'&&mid.len>200&&mid.borrowed===8&&mid.lit>=1&&mid.darkened,JSON.stringify(mid));
  check("they are stand-ins: no real enemy exists (none counted, none can hurt or drop)",mid.enemies===0&&mid.status.enemies===0&&mid.inEnemies===0&&mid.status.queue===0,JSON.stringify({ enemies:mid.enemies, inEnemies:mid.inEnemies, queue:mid.status.queue }));
  await page.keyboard.press("KeyG"); await page.keyboard.down("KeyW"); await sleep(400); await page.keyboard.up("KeyW");
  const held=await page.evaluate(()=>{ const s=window.__dd.status(); return { phase:s.phase, wave:s.wave, active:window.__cine.info().active }; });
  check("the hall holds still under it: G does not sound the horn (still build phase, wave 0)",held.phase==='build'&&held.wave===0&&held.active==='torchline',JSON.stringify(held));
  await page.keyboard.press("Space"); await sleep(1400);
  const after=await page.evaluate(()=>({ info:window.__cine.info(), status:window.__dd.status(), hud:getComputedStyle(document.getElementById('hud')).visibility, grp:(()=>{ let n=0; window.__dd.scene.traverse(o=>{ if(/^cine-/.test(o.name||'')) n++; }); return n; })(), seen:localStorage.getItem('dd_cine_seen') }));
  check("SPACE skips it (a quick fade to black) and it ends",after.info.active===null&&after.info.skips===1&&after.info.last&&after.info.last.skipped===true,JSON.stringify({ active:after.info.active, skips:after.info.skips, last:after.info.last }));
  const now=await page.evaluate(lightsSnap);
  const same=JSON.stringify(now.lights)===JSON.stringify(before.lights);
  check("the game resumes cleanly: HUD back, build phase, wave 0, no scene object left, every light, the fog, the sky and the view distance exactly as before",after.hud==='visible'&&after.status.phase==='build'&&after.status.wave===0&&after.grp===0&&same&&now.kids===before.kids&&JSON.stringify(now.fog)===JSON.stringify(before.fog)&&now.bg===before.bg&&now.far===before.far&&now.lost===0,
    JSON.stringify({ hud:after.hud, phase:after.status.phase, grp:after.grp, sameLights:same, kids:[before.kids,now.kids], lost:now.lost, fog:[before.fog,now.fog], far:[before.far,now.far], diff:now.lights.filter((l,i)=>l!==before.lights[i]).slice(0,3) }));
  check("it is remembered as seen (dd_cine_seen)",/torchline/.test(after.seen||''),String(after.seen));
  // the gallery now: a card that plays it again
  const g1=await page.evaluate(()=>{ window.CINE.openGallery(); const card=document.querySelector('#cineGal .cg-card'); const o={ locked:card.classList.contains('locked'), name:card.querySelector('.cg-name').textContent, img:!!card.querySelector('img.cg-pic') }; card.click(); return o; });
  await sleep(300); let rp=null; for(let i=0;i<60;i++){ rp=await page.evaluate(()=>window.__cine.info()); if(rp.active&&!rp.wait&&rp.t>1.3) break; await sleep(150); }
  check("after it is seen the gallery lists it as a picture card (THE DEEP PRISON · THE TORCH LINE), and clicking it plays it again",!g1.locked&&/DEEP PRISON/.test(g1.name)&&g1.img&&rp.active==='torchline'&&rp.replay===true&&rp.replays===1,JSON.stringify({ g1, active:rp.active, replay:rp.replay }));
  await page.keyboard.press("Enter"); await sleep(1300);
  const rpEnd=await page.evaluate(()=>window.__cine.info());
  check("ENTER skips a replay too",rpEnd.active===null&&rpEnd.skips===2,JSON.stringify({ active:rpEnd.active, skips:rpEnd.skips }));
  // the dev panel (F9): a picker
  await page.keyboard.press("F9"); await sleep(1300);
  const dp=await page.evaluate(()=>{ const s=document.getElementById('dp-cine-pick'); return { sect:!!document.getElementById('dp-cine'), opts:s?[...s.options].map(o=>o.value):[] }; });
  await page.evaluate(()=>{ document.getElementById('dp-cine-go').click(); }); await sleep(300);
  let dpi=null; for(let i=0;i<40;i++){ dpi=await page.evaluate(()=>window.__cine.info()); if(dpi.active&&!dpi.wait) break; await sleep(150); }
  check("the dev panel (F9) has a 'play cinematic' picker that plays it",dp.sect&&dp.opts.includes('torchline')&&dpi.active==='torchline'&&dpi.replays===2,JSON.stringify({ dp, active:dpi.active, replays:dpi.replays }));
  await page.evaluate(()=>window.__cine.finish()); await sleep(300);
  await ctx.close(); }
// ---------------------------------------------------------------- 2. the next visit: not again
{ const { ctx, page }=await newPage('["torchline"]');
  await loadPrison(page,"&cineauto"); await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); }); await sleep(2500);
  const n=await page.evaluate(()=>({ info:window.__cine.info(), hud:getComputedStyle(document.getElementById('hud')).visibility }));
  check("on the next visit to the prison it does not play again",n.info.active===null&&n.info.plays===0&&n.hud==='visible',JSON.stringify({ active:n.info.active, plays:n.info.plays }));
  await ctx.close(); }
// ---------------------------------------------------------------- 3. co-op: the host's scene on the guest
let PeerServer=null; try{ ({ PeerServer }=await import("peer")); }catch(e){ console.log("SKIP co-op part -- the `peer` package isn't installed"); }
if(PeerServer){ const sigPort=9157; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await sleep(300); const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
  const H=await newPage('["torchline"]'), Gp=await newPage();
  await loadPrison(H.page); await loadPrison(Gp.page);
  for(const p of [H.page,Gp.page]) await p.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); });
  const rc="cine-"+Math.random().toString(36).slice(2,8);
  const ho=await H.page.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null}),peerOpts)),{rc,peerOpts});
  const gj=await Gp.page.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null}),peerOpts)),{rc,peerOpts});
  check("co-op: host and guest connect",!ho.err&&!gj.err,JSON.stringify({ ho, gj }));
  await sleep(800);
  await H.page.evaluate(()=>window.CINE.play('torchline'));
  let gi=null; for(let i=0;i<80;i++){ gi=await Gp.page.evaluate(()=>window.__cine.info()); if(gi.active&&!gi.wait&&gi.t>1.2) break; await sleep(150); }
  const hi=await H.page.evaluate(()=>window.__cine.info());
  check("co-op: the host's scene plays on the guest too (its own copy, in step)",hi.active==='torchline'&&hi.sent>=1&&gi.active==='torchline'&&gi.guest===true&&Math.abs(gi.t-hi.t)<2.5,JSON.stringify({ host:{ a:hi.active, t:hi.t, sent:hi.sent }, guest:{ a:gi.active, t:gi.t, guest:gi.guest } }));
  await H.page.keyboard.press("Space"); await sleep(1600);
  const ge=await Gp.page.evaluate(()=>({ info:window.__cine.info(), hud:getComputedStyle(document.getElementById('hud')).visibility })), he=await H.page.evaluate(()=>window.__cine.info());
  check("co-op: the host's skip ends it on the guest (HUD back there)",he.active===null&&ge.info.active===null&&ge.info.last&&ge.info.last.skipped===true&&ge.hud==='visible',JSON.stringify({ host:he.active, guest:ge.info.active, last:ge.info.last }));
  // a late joiner: the host's scene is already running when a second guest joins -- that guest never starts it
  const L=await newPage(); await loadPrison(L.page); await L.page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); });
  await H.page.evaluate(()=>{ window.CINE.forget(); window.CINE.play('torchline'); }); await sleep(2500);
  const lj=await L.page.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null}),peerOpts)),{rc,peerOpts});
  await sleep(2500); const li=await L.page.evaluate(()=>window.__cine.info());
  check("co-op: a guest who joins after the scene began just misses it (it never starts there)",!lj.err&&li.active===null&&li.plays===0,JSON.stringify({ lj, active:li.active, plays:li.plays }));
  await H.page.evaluate(()=>window.__cine.finish());
  await H.ctx.close(); await Gp.ctx.close(); await L.ctx.close(); try{ sig.close&&sig.close(); }catch(e){} }
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
