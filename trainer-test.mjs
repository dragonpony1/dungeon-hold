// ===== TRAINING WHEELS (96-trainer.js): on map one a guide card names the one next thing to do and ticks it off by
// watching what the game did. Here: a fresh player sees wave zero (a lone harmless goblin walking the lane) and is asked
// for a ballista, lent to any hero here; picking, placing, the horn, an orb, the dropped piece, equipping it and a second defense each advance the card in
// order; progress persists across a reload and resumes; the card never shows on a later map, after map one is held, or
// once the ✕ is pressed; and the tavern hides it.
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path";
const SP=path.dirname(new URL(import.meta.url).pathname); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8910, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];
async function fresh(ctx,url){ const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e))); await p.goto(BASE+"/"+(url||"?silent&nogate"),{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__meta&&window.__trainer&&window.__heroes,null,{timeout:60000}); return p; }
const view=p=>p.evaluate(()=>({step:window.__trainer.step(),text:window.__trainer.text(),on:document.getElementById('trainer').classList.contains('on'),n:document.querySelector('#trainer .tn').textContent,phase:window.__dd.S.phase,counts:window.__trainer.counts()}));
const ctx=await browser.newContext(); const page=await fresh(ctx);
// before the run: nothing; in the build phase: step 1, naming the hero's first hotbar slot
const v0=await view(page);
check("on the title screen the guide is off",!v0.on&&v0.step==='watch',JSON.stringify(v0));
const w0=await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); const T=window.__trainer; const g=window.__dd.enemies.find(e=>e.training); return {w0:T.w0(),goblin:g&&{kind:g.kind,dmg:g.dmg,dead:!!g.dead},hero:window.__heroes.pick(),unlocks:[...document.querySelectorAll('#hotbar .slot')].filter(e=>e.style.display!=='none').map(e=>e.id.replace('slot-','')),mana:window.__dd.S.mana}; });
const v1=await view(page);
check("build phase on map one: wave zero — a lone harmless goblin (0 damage) is walking the lane, the guide is on at 1/8 saying watch it, and a fresh player is the knight with the ballista on the hotbar",v1.on&&v1.step==='watch'&&v1.n==='1/8'&&/goblin/i.test(v1.text)&&w0.w0.spawned&&w0.goblin&&w0.goblin.kind==='goblin'&&w0.goblin.dmg===0&&w0.hero==='knight'&&w0.unlocks.includes('harpoon'),JSON.stringify({v1,w0}));
check("the training-ground banner announced wave zero",await page.evaluate(()=>/TRAINING GROUND/.test(document.getElementById('banner').textContent)&&/wave zero/i.test(document.getElementById('banner').textContent)));
// the goblin reaches the crystal: it vanishes with IT GOT THROUGH and a lesson; step 2 is the ballista
const through=await page.evaluate(()=>{ const d=window.__dd; const g=d.enemies.find(e=>e.training); g.x=0; g.z=1.2; d.step(1/60,300); return {gone:!d.enemies.some(e=>e.training&&!e.dead),lesson:window.__lesson.text(),crystal:d.S.crystal}; });
const v2=await view(page);
check("at the crystal the goblin is gone, the crystal untouched, the lesson says a defense on its path stops the next; step 2 asks for a BALLISTA by its key",through.gone&&/stops the next/.test(through.lesson)&&v2.step==='pick'&&/BALLISTA/.test(v2.text)&&/press 1/.test(v2.text),JSON.stringify({through,v2}));
const first={kind:'harpoon',key:'1',name:'Ballista'};
await page.evaluate(k=>{ window.__dd.select(k); window.__dd.step(1/60,1); },first.kind);
const v2b=await view(page);
const mana=await page.evaluate(()=>window.__dd.S.mana);
check("picking the ballista ticks step 2 (a green ✓), step 3 is 'set it down'; the hall lent the mana for it",v2b.step==='place'&&/✓/.test(v2b.text)&&mana>=60,JSON.stringify({v2b,mana}));
await page.evaluate(k=>{ const d=window.__dd; d.S.mana=999; const h=d.hero; let ok=false; for(let dz=3;dz<=12&&!ok;dz++) for(let dx=-6;dx<=6&&!ok;dx++){ try{ d.placeDefAt(k,h.x+dx,h.z+dz,0); }catch(e){} ok=d.defs.length>0; } d.step(1/60,300);   /* past the 2.2 s ✓ flash of the step before, which a following step waits out, plus its own */ },first.kind);
const v3=await view(page);
check("the ballista on the lane ticks step 3; step 4 is the horn",v3.step==='horn'&&/horn/i.test(v3.text)&&v3.n==='4/8',JSON.stringify(v3));
await page.evaluate(()=>{ window.__dd.startWave(); window.__dd.step(1/60,300);   /* past the 2.2 s ✓ flash of the step before, which a following step waits out, plus its own */ });
const v4=await view(page);
check("the horn ticks step 4; step 5 is swing and orbs",v4.step==='orb'&&/orb/i.test(v4.text)&&v4.phase==='wave',JSON.stringify(v4));
// 4 an orb lands
await page.evaluate(()=>{ const d=window.__dd; d.setHero(0,10,0); const e=d.spawn('goblin','N'); e.x=d.hero.x+1; e.z=d.hero.z; d.kill(e); window.__autoMana=true; for(let i=0;i<240&&d.orbs.length;i++) d.step(1/60,1); window.__autoMana=false; d.step(1/60,300);   /* past the 2.2 s ✓ flash of the step before, which a following step waits out, plus its own */ });
const v5=await view(page);
check("an orb picked up ticks step 5; step 6 is the dropped piece",v5.step==='loot'&&v5.counts.orbs>0&&/gear|piece/i.test(v5.text),JSON.stringify(v5));
// 5 the piece, walked over
const bagged=await page.evaluate(()=>{ const d=window.__dd; const it=d.rollItem(1,'charm',2); d.dropLoot(it,d.hero.x,d.hero.z,true); for(let i=0;i<300&&!window.__meta.bag().some(b=>b.id===it.id);i++){ d.step(1/60,1); d.setHero(d.hero.x,d.hero.z); } d.step(1/60,300);   /* past the 2.2 s ✓ flash of the step before, which a following step waits out, plus its own */ return {id:it.id,inBag:window.__meta.bag().some(b=>b.id===it.id)}; });
const v6=await view(page);
check("walking over the piece bags it and ticks step 6; step 7 is 'equip it'",bagged.inBag&&v6.step==='equip'&&v6.counts.picked>0,JSON.stringify({bagged,v6}));
await page.evaluate(id=>{ window.__meta.equip(id); window.__dd.step(1/60,300);   /* past the 2.2 s ✓ flash of the step before, which a following step waits out, plus its own */ },bagged.id);
const v7=await view(page);
check("equipping ticks step 7; step 8 asks for a second defense or an upgrade",v7.step==='more'&&v7.counts.equips>0&&/second defense|Mark II/.test(v7.text),JSON.stringify(v7));
// persistence: a reload mid-way resumes at step 7 with the earlier steps kept
await page.reload({timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__trainer,null,{timeout:60000});
await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); });
const v8=await view(page);
check("after a reload the guide resumes at 8/8 (progress kept in localStorage dd_trainer)",v8.on&&v8.step==='more'&&v8.n==='8/8',JSON.stringify(v8));
await page.evaluate(k=>{ const d=window.__dd; d.S.mana=999; const h=d.hero; let n0=d.defs.length; for(let dz=3;dz<=12&&d.defs.length<2;dz++) for(let dx=-6;dx<=6&&d.defs.length<2;dx++){ try{ d.placeDefAt(k,h.x+dx,h.z+dz,0); }catch(e){} } d.step(1/60,300);   /* past the 2.2 s ✓ flash of the step before, which a following step waits out, plus its own */ },first.kind);
const v9=await view(page);
check("a second defense completes the training: 'done', the completion line names the waves to hold",v9.step===null&&v9.n==='done'&&/Training complete/.test(v9.text)&&v9.on,JSON.stringify(v9));
await page.evaluate(()=>{ for(let i=0;i<14*60;i++) window.__dd.step(1/60,1); });   /* past the 12 s completion line */
const v10=await view(page);
check("...and twelve seconds later the card is gone for good",!v10.on,JSON.stringify(v10));
check("the state records every step done",await page.evaluate(()=>{ const s=window.__trainer.state(); return window.__trainer.steps.every(id=>s.done[id]); }));
// the tavern hides it; the ✕ hides it for good
const ctx2=await browser.newContext(); const p2=await fresh(ctx2);
await p2.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); });
const openTav=await p2.evaluate(async()=>{ window.__meta.open(); window.__dd.step(1/60,3); await new Promise(r=>setTimeout(r,600)); /* the card refreshes on its own 250 ms timer while the loop is paused */ return document.getElementById('trainer').classList.contains('on'); });
check("with the tavern open the card steps aside",openTav===false,String(openTav));
await p2.evaluate(()=>{ if(window.__meta.isOpen()){ const b=document.querySelector('#tavern .close, #tv-close, [data-close]'); if(b) b.click(); } });
const hidden=await p2.evaluate(()=>{ document.querySelector('#trainer .tx').click(); window.__dd.step(1/60,3); return {on:document.getElementById('trainer').classList.contains('on'),off:window.__trainer.state().off,saved:JSON.parse(localStorage.getItem('dd_trainer')).off}; });
check("the ✕ hides the guide and remembers it",!hidden.on&&hidden.off&&hidden.saved===true,JSON.stringify(hidden));
await ctx2.close();
// never on a later map, never once map one is held
const ctx3=await browser.newContext(); const p3=await fresh(ctx3);
await p3.evaluate(()=>{ try{ localStorage.setItem('ddMapsCleared','1'); }catch(e){} });
await p3.goto(BASE+"/?silent&nogate&map=1",{timeout:90000}); await p3.waitForFunction(()=>window.__dd&&window.__trainer,null,{timeout:60000});
const later=await p3.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); return {map:window.__dd.map().id,on:document.getElementById('trainer').classList.contains('on'),training:window.__trainer.training()}; });
check("on map two the guide never shows",!later.on&&!later.training,JSON.stringify(later));
await p3.goto(BASE+"/?silent&nogate&map=0",{timeout:90000}); await p3.waitForFunction(()=>window.__dd&&window.__trainer,null,{timeout:60000});
const held=await p3.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); return {on:document.getElementById('trainer').classList.contains('on'),training:window.__trainer.training()}; });
check("back on map one after it has been held: the guide still shows (map one is the training ground whoever plays it; only its steps done or the ✕ end it)",held.on&&held.training,JSON.stringify(held));
await ctx3.close();
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
