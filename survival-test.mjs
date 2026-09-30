// ===== SURVIVAL MODE (build 176). Matt: "we need a mode choice so i can do a map in survival mode" ... "the max waves is 50 for now" ...
// "the thing that should make it harder and harder is sheer volume of mobs". game.js: SURVIVAL, runWaves, waveComp's survival branch,
// statWave, the live cap in updateWave, winMap's SURVIVAL COMPLETE; 95b-survival.js: the title's mode row, dd_survivalBest, the end
// words; 99-network.js / 99b-lobby.js: a guest follows the host's mode.
//  - title: the MODE row sits under the map picker; on a fresh save Survival is locked and says why (a click does nothing but tell you);
//    with the map cleared it opens, the pick is saved (ddMode) and remembered on the next load -- but not on a ?silent page, and not on
//    a map past the one cleared; screenshots at desktop and phone width (parts/shots/survival-title-*.png)
//  - the curve: Survival's first seven waves are the campaign's exactly; past them the waves only grow (and a mob's own hp at half
//    the campaign's pace); wave 10 is a boss wave led by a troll boss with an ogre guard; never more than SURVIVAL_LIVE alive at once
//  - play: waves 7 and 8 held for real -- no HALL HELD at 7, the HUD reads SURVIVAL · WAVE 8 / 50, the best (8) saved and on the row;
//    wave 50 held: SURVIVAL COMPLETE, the victory lap (held, ▶ MOVE ON), then the tally with no NEXT MAP; ddMapsCleared never moves
//  - the crystal falling on wave 23: THE GATE HAS OPENED · SURVIVED 22 WAVES — A NEW BEST, and the best saved
//  - co-op: a guest in the host's Survival run reads SURVIVAL · WAVE n / 50, gets SURVIVAL COMPLETE on the lap and at the end, and its
//    own campaign stays where it was
// Ports 8817 (http), 9717 (signaling).
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import fs from "fs"; import path from "path";
let PeerServer=null; try { ({ PeerServer } = await import("peer")); } catch(e) {}
const SP=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/,""));
const SHOTS=path.join(process.env.SP||SP,"parts","shots"); fs.mkdirSync(SHOTS,{recursive:true});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8817, sigPort=9717, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:process.env.DIST||SP+"/dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];
// a page with the given saves; q is the address's query. Nothing started yet
async function page(q,saves,ctxOpts){ const ctx=await browser.newContext(Object.assign({viewport:{width:1100,height:700}},ctxOpts||{})); const p=await ctx.newPage(); p.setDefaultTimeout(120000); p.on("pageerror",e=>errors.push(String(e)));
  if(saves) await ctx.addInitScript(s=>{ if(sessionStorage.getItem('__sv_seeded')) return; sessionStorage.setItem('__sv_seeded','1'); for(const k in s) localStorage.setItem(k,s[k]); },saves);
  await p.goto(BASE+"/"+q,{timeout:120000});
  await p.waitForFunction(()=>window.__dd&&window.__meta&&window.__survival&&window.__net&&window.__tavern,null,{timeout:120000});
  return {ctx,p}; }
const row=p=>p.evaluate(()=>{ const el=document.getElementById('modeline'), ml=document.getElementById('mapline'); const b=[...(el?el.querySelectorAll('button.mode'):[])];
  return {exists:!!el,afterMap:!!el&&!!ml&&ml.nextElementSibling===el,text:el?el.textContent:'',sel:(b.find(x=>x.classList.contains('sel'))||{dataset:{}}).dataset.m||null,locked:b.some(x=>x.dataset.m==='survival'&&x.classList.contains('locked')),on:window.__dd.survival(),mode:localStorage.getItem('ddMode')}; });
const hud=p=>p.evaluate(()=>{ const $=id=>document.getElementById(id), d=window.__dd;
  return {phase:d.S.phase,held:d.S.held,wave:d.S.wave,banner:$('banner').textContent,wavet:$('wavet').textContent,phaset:$('phaset').textContent,btn:$('wavebtn').textContent,cleared:localStorage.getItem('ddMapsCleared'),best:localStorage.getItem('dd_survivalBest'),tally:window.__tavern.isOpen()}; });
// (every play page marks map one's last Forest piece as long since taken: its locker gate would hold the horn after wave 8 -- victorylap-test.mjs covers that gate)
// run the current wave out, killing everything as it comes (the hero stands far off so nothing is picked up or fought)
const clearWave=(p,maxSteps)=>p.evaluate(m=>{ const d=window.__dd; let n=0, g=0; while(d.S.phase==='wave'&&g++<(m||20000)){ d.step(1/60,4); for(const e of d.enemies) if(!e.dead){ d.kill(e); n++; } } d.step(1/60,2); return n; },maxSteps);

// ==================== THE TITLE: locked on a fresh save ====================
{ const {ctx,p}=await page("?silent&nogate");
  const r0=await row(p);
  check("the MODE row sits right under the map picker: CAMPAIGN picked, SURVIVAL locked with the reason",r0.exists&&r0.afterMap&&r0.sel==='campaign'&&r0.locked&&/Survival opens once THE GNOME HALL is cleared/.test(r0.text)&&!r0.on,JSON.stringify(r0));
  await p.click('#modeline button[data-m="survival"]'); const r1=await row(p); const toast=await p.evaluate(()=>document.getElementById('toast').textContent);
  check("clicking a locked SURVIVAL changes nothing and says how to open it",r1.sel==='campaign'&&!r1.on&&r1.mode===null&&/Hold all 7 waves of THE GNOME HALL/.test(toast),JSON.stringify({r1,toast}));
  await ctx.close(); }

// ==================== THE TITLE: open, picked, remembered ====================
let shotDesk=null, shotPhone=null;
{ const {ctx,p}=await page("?silent&nogate",{ddMapsCleared:'1'});
  const r0=await row(p);
  check("map one cleared: SURVIVAL opens, CAMPAIGN still the default",r0.sel==='campaign'&&!r0.locked&&!r0.on&&!/🔒/.test(r0.text),JSON.stringify(r0));
  await p.click('#modeline button[data-m="survival"]'); const r1=await row(p);
  check("clicking SURVIVAL picks it: the mode is on, saved (ddMode), and the row tells the rules and the best",r1.sel==='survival'&&r1.on&&r1.mode==='survival'&&/50 waves/.test(r1.text)&&/no best yet/.test(r1.text),JSON.stringify(r1));
  shotDesk=path.join(SHOTS,"survival-title-desktop.png"); await p.screenshot({path:shotDesk});
  // the curve, read before the hall starts: Survival's first seven waves are the campaign's own, exactly
  const same=await p.evaluate(()=>{ const d=window.__dd, S=window.__survival; const comp=()=>[1,2,3,4,5,6,7].map(w=>JSON.stringify(d.waveComp(w))); const sv=comp(); S.set(false); const cp=comp(); S.set(true); return {same:sv.every((x,i)=>x===cp[i]),on:d.survival()}; });
  check("Survival's waves 1-7 on map one are the campaign's waves 1-7 exactly (nothing harder than the map already was)",same.same&&same.on,JSON.stringify(same));
  const curve=await p.evaluate(()=>{ const d=window.__dd, out=[]; for(let sw=7;sw<=50;sw++){ d.S.wave=sw; const c=d.waveComp(sw), k={}; c.q.forEach(x=>k[x.kind]=(k[x.kind]||0)+1); out.push({sw,total:c.q.length,horde:c.q.length-(k.trollboss||0)-(c.boss?Math.max(1,Math.floor(sw/10)):0),stat:d.statWave(),boss:!!c.boss,first:c.q[0].kind,k}); } d.S.wave=0; return out; });
  const grows=curve.every((c,i)=>i===0||c.horde>=curve[i-1].horde)&&[7,10,20,30,40,50].map(w=>curve.find(c=>c.sw===w).total).every((t,i,a)=>i===0||t>a[i-1]);
  const at=w=>curve.find(c=>c.sw===w);
  console.log("      curve (map one): "+[7,8,10,20,30,40,50].map(w=>"w"+w+"="+at(w).total+(at(w).boss?"☠":"")).join(" "));
  check("past the map the waves only grow: the horde never shrinks wave to wave, and waves 10/20/30/40/50 each outnumber the last ("+[7,10,20,30,40,50].map(w=>at(w).total).join(' → ')+")",grows&&at(50).total>=5*at(7).total,JSON.stringify([7,10,20,30,40,50].map(w=>at(w).total)));
  check("a mob's own hp climbs at half the campaign's pace past the map (wave 8 fights like 7.5, wave 50 like 28.5)",at(7).stat===7&&at(8).stat===7.5&&at(50).stat===28.5,JSON.stringify([at(7).stat,at(8).stat,at(50).stat]));
  check("every tenth wave is a boss wave, led out by an ogre (10, 20 ... 50; build 326: the troll boss is out), and only those",curve.filter(c=>c.boss).map(c=>c.sw).join()==='10,20,30,40,50'&&curve.filter(c=>c.boss).every(c=>c.first==='ogre'&&c.k.ogre>=Math.floor(c.sw/10)),JSON.stringify(curve.filter(c=>c.boss).map(c=>({sw:c.sw,first:c.first,ogre:c.k.ogre}))));
  await ctx.close(); }
{ const {ctx,p}=await page("?nogate",{ddMapsCleared:'1',ddMode:'survival'});
  const r=await row(p);
  check("the pick is remembered: a page loaded with ddMode=survival on a cleared map starts in Survival",r.sel==='survival'&&r.on,JSON.stringify(r));
  await ctx.close(); }
{ const {ctx,p}=await page("?silent&nogate",{ddMapsCleared:'1',ddMode:'survival'});
  const r=await row(p);
  check("...but a ?silent test page defaults to Campaign exactly as before",r.sel==='campaign'&&!r.on,JSON.stringify(r));
  await ctx.close(); }
{ const {ctx,p}=await page("?nogate&map=1",{ddMapsCleared:'1',ddMode:'survival'});
  const r=await row(p); const m=await p.evaluate(()=>window.__dd.map().index);
  check("on map two (open, not yet cleared) Survival is locked and the saved pick doesn't apply",m===1&&r.sel==='campaign'&&r.locked&&!r.on&&/THE THRONE ROOM is cleared/.test(r.text),JSON.stringify({m,r}));
  await ctx.close(); }
{ const {ctx,p}=await page("?silent&nogate",{ddMapsCleared:'1',dd_survivalBest:JSON.stringify({hall:23})},{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await p.click('#modeline button[data-m="survival"]'); const r=await row(p);
  const fit=await p.evaluate(()=>{ const el=document.getElementById('modeline'), b=el.getBoundingClientRect(); return {w:b.width,left:b.left,right:b.right,vw:innerWidth,scroll:document.documentElement.scrollWidth}; });
  shotPhone=path.join(SHOTS,"survival-title-phone.png"); await p.screenshot({path:shotPhone});
  check("phone width: the row fits the screen (no sideways scroll) and shows the saved best ("+r.text.replace(/\s+/g,' ').slice(0,90)+")",r.on&&/your best: 23 of 50/.test(r.text)&&fit.left>=0&&fit.right<=fit.vw+1&&fit.scroll<=fit.vw+1,JSON.stringify(fit));
  await ctx.close(); }

// ==================== PLAY: past the map's waves, the live cap, the best, wave 50 ====================
{ const {ctx,p}=await page("?silent&nogate",{ddMapsCleared:'1'});
  await p.click('#modeline button[data-m="survival"]');
  await p.evaluate(()=>{ window.__freeze=true; window.__meta.reset(); window.__dd.resetGear(); localStorage.setItem(window.__forest.LOCKER_KEY,JSON.stringify({item:{id:'sv-taken'},at:1,taken:true})); window.__dd.start(); window.__dd.step(1/60,30); window.__dd.setHero(500,500,0); window.__dd.step(1/60,2); });
  // waves 7 and 8, for real
  const w7=await p.evaluate(()=>{ const d=window.__dd; d.S.wave=6; d.S.phase='build'; d.startWave(); return document.getElementById('banner').textContent; });
  const k7=await clearWave(p); const h7=await hud(p);
  check("wave 7 (the map's last) held in Survival: no HALL HELD lap -- back to building, 'wave 7 of 50 repelled', the campaign untouched",/SURVIVAL · WAVE 7 OF 50/.test(w7)&&k7>0&&h7.phase==='build'&&!h7.held&&/wave 7 of 50 repelled/.test(h7.banner)&&h7.cleared==='1',JSON.stringify({w7,k7,h7}));
  const w8=await p.evaluate(()=>{ window.__dd.startWave(); window.__dd.step(1/60,3); return {banner:document.getElementById('banner').textContent,wavet:document.getElementById('wavet').textContent}; });
  check("wave 8 comes: SURVIVAL · WAVE 8 OF 50 on the banner and SURVIVAL · WAVE 8 / 50 on the HUD",/SURVIVAL · WAVE 8 OF 50/.test(w8.banner)&&w8.wavet==='SURVIVAL · WAVE 8 / 50',JSON.stringify(w8));
  await clearWave(p); const h8=await hud(p);
  check("wave 8 held: the map's best (dd_survivalBest) is 8, saved as it happened",h8.phase==='build'&&JSON.parse(h8.best||'{}').hall===8,JSON.stringify(h8));
  // wave 10: the boss
  const b10=await p.evaluate(()=>{ const d=window.__dd; d.S.wave=9; d.startWave(); const banner=document.getElementById('banner').textContent; let first=null; for(let i=0;i<600&&!first;i++){ d.step(1/60,1); const e=d.enemies.find(e=>!e.dead); if(e) first=e.kind; } return {banner,first}; });
  check("wave 10 is a BOSS WAVE: the banner says so and the first thing through the gate is an ogre (build 326: the troll boss is out)",/BOSS WAVE 10 OF 50/.test(b10.banner)&&b10.first==='ogre',JSON.stringify(b10));
  await clearWave(p);
  // the live cap on a big late wave: nobody killed, the crystal made unbreakable for the count
  const cap=await p.evaluate(()=>{ const d=window.__dd; d.S.wave=39; d.S.crystal=1e9; d.startWave(); const q0=d.S.phase==='wave'?d.status().queue:0; let max=0, held=0; for(let i=0;i<60*50;i++){ d.step(1/60,1); const a=d.enemies.filter(e=>!e.dead).length; if(a>max) max=a; if(a>=60&&d.status().queue>0) held++; }
    const g=d.enemies.find(e=>!e.dead&&e.kind==='goblin'); return {q0,max,held,queue:d.status().queue,gob:g?g.max:null}; });
  const gobCamp=Math.round(10*(1+.22*39));   // a goblin at effWave 40 by the campaign's own pace (no gear)
  check("wave 40 ("+cap.q0+" mobs): never more than 60 alive at once -- the rest wait in the queue",cap.q0>200&&cap.max<=60&&cap.max>=55&&cap.held>0&&cap.queue>0,JSON.stringify(cap));
  check("...and its goblins are tougher than map one's, but at half the campaign's pace ("+cap.gob+" hp, where effWave 40 would give "+gobCamp+")",cap.gob>40&&cap.gob<gobCamp,JSON.stringify({gob:cap.gob,gobCamp}));
  await clearWave(p,60000);
  // wave 50: SURVIVAL COMPLETE
  const g0=await p.evaluate(()=>window.__meta.gold());
  await p.evaluate(()=>{ const d=window.__dd; d.S.wave=49; d.S.crystal=150; d.startWave(); });
  const k50=await clearWave(p,60000); const h50=await hud(p);
  check("wave 50 held ("+k50+" mobs): SURVIVAL COMPLETE -- the victory lap (held, phase build, ▶ MOVE ON), the HUD says so",k50>250&&/SURVIVAL COMPLETE/.test(h50.banner)&&h50.phase==='build'&&h50.held&&/SURVIVAL COMPLETE/.test(h50.wavet)&&h50.btn==='▶ MOVE ON',JSON.stringify(h50));
  const pay=await p.evaluate(g0=>({gain:window.__meta.gold()-g0,payout:window.__meta.summary().payout}),g0);
  check("the campaign is untouched (ddMapsCleared still 1) and the best is 50; the run is paid as a hall held (25x50+150)",h50.cleared==='1'&&JSON.parse(h50.best).hall===50&&pay.payout===25*50+150,JSON.stringify({cleared:h50.cleared,best:h50.best,pay}));
  await p.evaluate(()=>{ window.__dd.moveOn(); window.__dd.step(1/60,2); });
  const end=await p.evaluate(()=>{ const s=document.getElementById('tv-sum'); return {phase:window.__dd.S.phase,tally:window.__tavern.isOpen(),h1:s?(s.querySelector('h1')||{}).textContent:'',h2:s?(s.querySelector('h2')||{}).textContent:'',next:!!document.getElementById('tv-nextmap'),again:(document.getElementById('tv-again')||{}).textContent,deadh1:document.getElementById('deadh1').textContent,cleared:localStorage.getItem('ddMapsCleared')}; });
  check("MOVE ON: the tally says SURVIVAL COMPLETE · ALL 50 WAVES HELD, offers ↻ SURVIVE AGAIN and no NEXT MAP; the campaign still at 1",end.phase==='won'&&end.tally&&end.h1==='SURVIVAL COMPLETE'&&/ALL 50 WAVES HELD/.test(end.h2)&&!end.next&&end.again==='↻ SURVIVE AGAIN'&&end.deadh1==='SURVIVAL COMPLETE'&&end.cleared==='1',JSON.stringify(end));
  await ctx.close(); }

// ==================== THE CRYSTAL FALLS ====================
{ const {ctx,p}=await page("?silent&nogate",{ddMapsCleared:'1',dd_survivalBest:JSON.stringify({hall:10,throne:4})});
  await p.click('#modeline button[data-m="survival"]');
  await p.evaluate(()=>{ window.__freeze=true; window.__meta.reset(); window.__dd.resetGear(); localStorage.setItem(window.__forest.LOCKER_KEY,JSON.stringify({item:{id:'sv-taken'},at:1,taken:true})); window.__dd.start(); window.__dd.step(1/60,30); window.__dd.setHero(500,500,0); });
  await p.evaluate(()=>{ const d=window.__dd; d.S.wave=22; d.S.phase='build'; d.startWave(); d.step(1/60,120); d.hurtCrystal(99999); for(let i=0;i<200&&d.S.phase!=='dead';i++) d.step(1/60,1); });
  const end=await p.evaluate(()=>{ const s=document.getElementById('tv-sum'); return {phase:window.__dd.S.phase,tally:window.__tavern.isOpen(),h1:s?(s.querySelector('h1')||{}).textContent:'',h2:s?(s.querySelector('h2')||{}).textContent:'',again:(document.getElementById('tv-again')||{}).textContent,dead:document.getElementById('deadh2').textContent,best:localStorage.getItem('dd_survivalBest'),cleared:localStorage.getItem('ddMapsCleared')}; });
  check("the crystal falls on wave 23: THE GATE HAS OPENED · THE HEARTROOT FELL ON WAVE 23 · SURVIVED 22 WAVES — A NEW BEST (the old best was 10)",end.phase==='dead'&&end.tally&&end.h1==='THE GATE HAS OPENED'&&end.h2==='THE HEARTROOT FELL ON WAVE 23 · SURVIVED 22 WAVES — A NEW BEST'&&end.again==='↻ SURVIVE AGAIN'&&/SURVIVED 22 WAVES/.test(end.dead),JSON.stringify(end));
  const b=JSON.parse(end.best||'{}');
  check("the new best is saved for this map only (hall 22, the throne room's 4 untouched), the campaign still at 1",b.hall===22&&b.throne===4&&end.cleared==='1',JSON.stringify({b,cleared:end.cleared}));
  // closing the tally puts the old end screen back with the wave filled in (its #deadwave kept)
  const back=await p.evaluate(()=>{ window.__tavern.close(); return {shown:!document.getElementById('dead').classList.contains('hide'),h2:document.getElementById('deadh2').textContent}; });
  check("the end screen behind it reads the same (wave 23, 22 survived)",back.shown&&/WAVE 23 · SURVIVED 22 WAVES/.test(back.h2),JSON.stringify(back));
  await ctx.close(); }

// ==================== CO-OP: the guest follows the host's Survival ====================
if(!PeerServer){ console.log("SKIP the co-op half of survival-test.mjs — the `peer` package isn't installed (npm i peer)."); }
else {
  const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
  await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
  const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
  const tick=async(pages,batches=6,size=5)=>{ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++) for(const p of pages) await p.evaluate(()=>window.__dd.step(1/60,1)); await sleep(20); } };
  const tickUntil=async(pages,page,fn,arg,max=60)=>{ for(let b=0;b<max;b++){ if(await page.evaluate(fn,arg)) return true; await tick(pages,1,3); } return !!(await page.evaluate(fn,arg)); };
  const {p:H}=await page("?silent&nogate",{ddMapsCleared:'1'}), {p:G}=await page("?silent&nogate");
  await H.click('#modeline button[data-m="survival"]');
  const lob=await H.evaluate(()=>window.__dd.survival());
  const go=async p=>p.evaluate(()=>{ window.__freeze=true; window.__meta.reset(); window.__dd.resetGear(); localStorage.setItem(window.__forest.LOCKER_KEY,JSON.stringify({item:{id:'sv-taken'},at:1,taken:true})); window.__dd.start(); window.__dd.step(1/60,30); window.__dd.setHero(500,500,0); });
  await go(H); await go(G);
  const rc="surv-"+Math.random().toString(36).slice(2,8);
  const ho=await H.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const gj=await G.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  check("host (in Survival) and guest (a fresh save, Campaign on its own title) connect ("+rc+")",lob&&ho.err===null&&gj.err===null,JSON.stringify({lob,ho,gj}));
  await tick([H,G],6,5);
  await H.evaluate(()=>{ const d=window.__dd; d.S.wave=11; d.S.phase='build'; d.startWave(); });
  const saw=await tickUntil([H,G],G,()=>/SURVIVAL · WAVE 12 \/ 50/.test(document.getElementById('wavet').textContent),null,60);
  const gw=await G.evaluate(()=>({wavet:document.getElementById('wavet').textContent,on:window.__dd.survival(),world:window.__net.world()&&{survival:window.__net.world().survival,waveTotal:window.__net.world().waveTotal}}));
  check("guest: its HUD reads the host's SURVIVAL · WAVE 12 / 50, and its page takes the host's mode",saw&&gw.on&&gw.world&&gw.world.survival===true&&gw.world.waveTotal===50,JSON.stringify(gw));
  await H.evaluate(()=>{ const d=window.__dd; let g=0; while(d.S.phase==='wave'&&g++<6000){ d.step(1/60,4); for(const e of d.enemies) if(!e.dead) d.kill(e); } });
  await tick([H,G],4,5);
  // wave 50 held by the host: SURVIVAL COMPLETE on the guest's lap, and nothing opened in its campaign
  await H.evaluate(()=>{ const d=window.__dd; d.S.wave=49; d.S.crystal=150; d.startWave(); let g=0; while(d.S.phase==='wave'&&g++<20000){ d.step(1/60,4); for(const e of d.enemies) if(!e.dead) d.kill(e); } });
  const lap=await tickUntil([H,G],G,()=>{ const w=window.__net.world(); return !!(w&&w.held); },null,80); await tick([H,G],4,3);
  const gl=await hud(G);
  check("guest: the host's wave 50 held reaches it as SURVIVAL COMPLETE (banner and HUD) -- and its own campaign stays unopened (no ddMapsCleared)",lap&&/SURVIVAL COMPLETE/.test(gl.banner)&&/SURVIVAL COMPLETE/.test(gl.wavet)&&gl.cleared===null&&gl.phase==='build'&&!gl.tally,JSON.stringify(gl));
  await H.evaluate(()=>window.__dd.moveOn());
  const ended=await tickUntil([H,G],G,()=>!document.getElementById('dead').classList.contains('hide'),null,60);
  const ge=await G.evaluate(()=>({h1:document.getElementById('deadh1').textContent,h2:document.getElementById('deadh2').textContent,next:document.getElementById('nextmapbtn').style.display,cleared:localStorage.getItem('ddMapsCleared'),best:localStorage.getItem('dd_survivalBest')}));
  check("guest: the host's MOVE ON ends it on SURVIVAL COMPLETE · ALL 50 WAVES HELD, no NEXT MAP, its best recorded (50), its campaign still unopened",ended&&ge.h1==='SURVIVAL COMPLETE'&&/ALL 50 WAVES HELD/.test(ge.h2)&&ge.next==='none'&&ge.cleared===null&&JSON.parse(ge.best||'{}').hall===50,JSON.stringify(ge));
  try{ sig.close&&sig.close(); }catch(e){}
}

check("no page errors",errors.length===0,errors.slice(0,5).join(" | "));
console.log("\nscreenshots: "+shotDesk+"  "+shotPhone);
console.log(results.filter(x=>x).length+"/"+results.length+" passed");
await browser.close(); server.close(); process.exit(results.every(x=>x)?0:1);
