// ===== TRAINING WHEELS (96-trainer.js): on map one a guide card names the one next thing to do and ticks it off by
// watching what the game did -- and a ticked step holds its ✓ until the player presses Enter (or taps the card): the
// tips never move on by themselves. Here: a fresh player sees wave zero (a lone harmless goblin walking the lane) and is
// told to dispatch it with the sword; one that reaches the crystal vanishes and another comes; then ONE tip asks for a
// ballista on its path and stays until it is really down; the horn, an orb, the dropped piece, equipping it (taught as I
// for the bag, not Tab) and a second defense follow in order; progress persists across a reload; the card never shows on
// a later map or once the ✕ is pressed; the tavern hides it.
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path";
const SP=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/,"")); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8910, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];
async function fresh(ctx,url){ const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e))); await p.goto(BASE+"/"+(url||"?silent&nogate"),{timeout:240000}); await p.waitForFunction(()=>window.__dd&&window.__meta&&window.__trainer&&window.__heroes,null,{timeout:180000}); return p; }   /* generous: this suite opens three fresh pages, and a loaded test machine can take minutes over one */
const view=p=>p.evaluate(()=>({step:window.__trainer.step(),text:window.__trainer.text(),waiting:window.__trainer.waiting(),on:document.getElementById('trainer').classList.contains('on'),n:document.querySelector('#trainer .tn').textContent,phase:window.__dd.S.phase,counts:window.__trainer.counts()}));
const next=async p=>{ await p.keyboard.press('Enter'); await p.evaluate(()=>window.__dd.step(1/60,20)); };   // the player moves the guide on
const ctx=await browser.newContext(); const page=await fresh(ctx);
const v0=await view(page);
check("on the title screen the guide is off",!v0.on&&v0.step==='slay',JSON.stringify(v0));
const w0=await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); const T=window.__trainer; const g=window.__dd.enemies.find(e=>e.training); return {w0:T.w0(),goblin:g&&{kind:g.kind,dmg:g.dmg,dead:!!g.dead},hero:window.__heroes.pick(),unlocks:[...document.querySelectorAll('#hotbar .slot')].filter(e=>e.style.display!=='none').map(e=>e.id.replace('slot-','')),mana:window.__dd.S.mana}; });
const v1=await view(page);
check("build phase on map one: wave zero — a lone harmless goblin (0 damage) walks the lane and step 1/8 says dispatch him with your sword; a fresh player is the knight with the ballista on the hotbar",v1.on&&v1.step==='slay'&&v1.n==='1/8'&&/dispatch him with your sword/.test(v1.text)&&!v1.waiting&&w0.w0.spawned&&w0.goblin&&w0.goblin.kind==='goblin'&&w0.goblin.dmg===0&&w0.hero==='knight'&&w0.unlocks.includes('harpoon'),JSON.stringify({v1,w0}));
check("the training-ground banner announced wave zero",await page.evaluate(()=>/TRAINING GROUND/.test(document.getElementById('banner').textContent)));
// the goblin reaches the crystal: it vanishes with IT GOT THROUGH, a lesson says another is coming, and another comes -- the step stays
const through=await page.evaluate(()=>{ const d=window.__dd; const g=d.enemies.find(e=>e.training&&!e.dead); g.x=0; g.z=1.2; d.step(1/60,150); const g2=d.enemies.find(e=>e.training&&!e.dead); return {first:g.through===true,again:!!g2&&g2!==g,lesson:window.__lesson.text(),crystal:d.S.crystal,w0:window.__trainer.w0()}; });
const v2=await view(page);
check("at the crystal the goblin vanishes (crystal untouched at 300), the lesson says another is coming, another walks the lane, and the step is still 'dispatch him'",through.first&&through.again&&through.crystal===300&&/another is coming/i.test(through.lesson)&&through.w0.through===1&&v2.step==='slay'&&!v2.waiting,JSON.stringify({through,v2}));
// the swing: the goblin dead ticks step 1, and the ✓ waits for Enter
await page.evaluate(()=>{ const d=window.__dd; const g=d.enemies.find(e=>e.training&&!e.dead); d.kill(g); d.step(1/60,5); });
const v3=await view(page);
check("the goblin slain ticks step 1: a green ✓ on the sword tip that says press Enter for the next tip",v3.waiting&&/^✓ /.test(v3.text)&&/dispatch him/.test(v3.text)&&/press Enter/.test(v3.text)&&v3.step==='ballista',JSON.stringify(v3));
await page.evaluate(()=>window.__dd.step(1/60,600));
const v3b=await view(page);
check("...and ten seconds later it is still waiting: the tips never move on by themselves",v3b.waiting&&/^✓ /.test(v3b.text),JSON.stringify(v3b));
await next(page);
const v4=await view(page);
check("Enter: step 2/8 is one tip — look at the goblin's path, set up a BALLISTA (press 1, then click); the hall lent the mana",!v4.waiting&&v4.n==='2/8'&&/goblin's path/.test(v4.text)&&/SAW BLADE GUNNER/.test(v4.text)&&/press 1/.test(v4.text)&&(await page.evaluate(()=>window.__dd.S.mana))>=60,JSON.stringify(v4));
// build 143: "he almost didn't notice the tool tip on the left, it needs to be a little more annoying"
const lk1=await page.evaluate(()=>window.__trainer.look());
check("a new tip slides in with a gold flash (class new) and the card is bigger (19 px type, 340 px wide, a solid gold border)",/\bnew\b/.test(lk1.cls)&&await page.evaluate(()=>{ const c=getComputedStyle(document.getElementById('trainer')); return parseFloat(c.fontSize)>=19&&parseFloat(c.width)>=330&&parseFloat(c.borderTopWidth)>=3; }),JSON.stringify(lk1));
const lk2=await page.evaluate(()=>{ window.__dd.step(1/60,Math.round(14.3*60)); return window.__trainer.look(); });   /* the wiggle runs 0.9 s from the 14 s mark */
check("left undone for 15 s, the tip nudges: a wiggle and glow (class nudge), repeating every 10 s after that",lk2.nudges>=1&&/\bnudge\b/.test(lk2.cls),JSON.stringify(lk2));
await page.evaluate(()=>{ window.__dd.select('harpoon'); window.__dd.step(1/60,30); });
const v4b=await view(page);
check("picking the ballista alone does not tick it: the tip stays until the ballista is really down",v4b.step==='ballista'&&!v4b.waiting&&/goblin's path/.test(v4b.text),JSON.stringify(v4b));
await page.evaluate(k=>{ const d=window.__dd; d.S.mana=999; const h=d.hero; let ok=false; for(let dz=3;dz<=12&&!ok;dz++) for(let dx=-6;dx<=6&&!ok;dx++){ try{ d.placeDefAt(k,h.x+dx,h.z+dz,0); }catch(e){} ok=d.defs.length>0; } d.step(1/60,5); },'harpoon');
const v5=await view(page);
check("the ballista on the lane ticks step 2 (✓, waiting for Enter)",v5.waiting&&/^✓ /.test(v5.text)&&/SAW BLADE GUNNER/.test(v5.text),JSON.stringify(v5));
await next(page); const v6=await view(page);
check("Enter: step 3/8 is the horn",v6.step==='horn'&&!v6.waiting&&/horn/i.test(v6.text)&&v6.n==='3/8',JSON.stringify(v6));
await page.evaluate(()=>{ window.__dd.startWave(); window.__dd.step(1/60,5); }); await next(page); const v7=await view(page);
check("the horn ticks step 3; Enter: step 4 is swing and orbs",v7.step==='orb'&&!v7.waiting&&/orb/i.test(v7.text)&&v7.phase==='wave',JSON.stringify(v7));
await page.evaluate(()=>{ const d=window.__dd; d.setHero(0,10,0); const e=d.spawn('goblin','N'); e.x=d.hero.x+1; e.z=d.hero.z; d.kill(e); window.__autoMana=true; for(let i=0;i<240&&d.orbs.length;i++) d.step(1/60,1); window.__autoMana=false; d.step(1/60,5); }); await next(page); const v8=await view(page);
check("an orb picked up ticks step 4; Enter: step 5 is the dropped piece",v8.step==='loot'&&v8.counts.orbs>0&&/gear|piece/i.test(v8.text),JSON.stringify(v8));
const bagged=await page.evaluate(()=>{ const d=window.__dd; const it=d.rollItem(1,'charm',2); d.dropLoot(it,d.hero.x,d.hero.z,true); for(let i=0;i<300&&!window.__meta.bag().some(b=>b.id===it.id);i++){ d.step(1/60,1); d.setHero(d.hero.x,d.hero.z); } d.step(1/60,5); return {id:it.id,inBag:window.__meta.bag().some(b=>b.id===it.id)}; }); await next(page); const v9=await view(page);
check("walking over the piece bags it and ticks step 5; Enter: step 6 is 'equip it', taught as I for the bag (not Tab)",bagged.inBag&&v9.step==='equip'&&v9.counts.picked>0&&/press I for your bag/.test(v9.text)&&!/Tab/.test(v9.text),JSON.stringify({bagged,v9}));
await page.evaluate(id=>{ window.__meta.equip(id); window.__dd.step(1/60,5); },bagged.id); const v10=await view(page); await next(page); const v11=await view(page);
check("equipping ticks step 6; Enter: the locker step (nothing waiting there) passes without showing, and step 8/8 asks for a second defense or an upgrade",v10.waiting&&v10.counts.equips>0&&v11.step==='more'&&!v11.waiting&&v11.n==='8/8'&&/second defense|Mark II/.test(v11.text),JSON.stringify({v10,v11}));
// persistence: a reload resumes at 8/8 with the earlier steps kept
await page.reload({timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__trainer,null,{timeout:60000});
await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); });
const v12=await view(page);
check("after a reload the guide resumes at 8/8 (progress kept in localStorage dd_trainer)",v12.on&&v12.step==='more'&&v12.n==='8/8',JSON.stringify(v12));
await page.evaluate(k=>{ const d=window.__dd; d.S.mana=999; const h=d.hero; for(let dz=3;dz<=12&&d.defs.length<2;dz++) for(let dx=-6;dx<=6&&d.defs.length<2;dx++){ try{ d.placeDefAt(k,h.x+dx,h.z+dz,0); }catch(e){} } d.step(1/60,5); },'harpoon');
const v13=await view(page); await next(page); const v14=await view(page);
check("a second defense completes the training: the last step needs no Enter — 'done', and the completion line names the waves to hold",!v13.waiting&&v13.step===null&&v13.n==='done'&&/Training complete/.test(v13.text)&&v13.on&&v14.n==='done',JSON.stringify({v13,v14}));
await page.evaluate(()=>{ for(let i=0;i<14*60;i++) window.__dd.step(1/60,1); });
const v15=await view(page);
check("...and twelve seconds later the card is gone for good",!v15.on,JSON.stringify(v15));
check("the state records every step done",await page.evaluate(()=>{ const s=window.__trainer.state(); return window.__trainer.steps.every(id=>s.done[id]); }));
check("the 🎓 reset puts the guide back at step 1 without an error",await page.evaluate(()=>{ try{ window.__trainer.reset(); return window.__trainer.step()==='slay'&&!window.__trainer.waiting(); }catch(e){ return String(e); } })===true);
// the tavern hides it; the ✕ hides it for good
const ctx2=await browser.newContext(); const p2=await fresh(ctx2);
await p2.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); });
const openTav=await p2.evaluate(async()=>{ window.__meta.open(); window.__dd.step(1/60,3); await new Promise(r=>setTimeout(r,600)); return document.getElementById('trainer').classList.contains('on'); });
check("with the tavern open the card steps aside",openTav===false,String(openTav));
await p2.evaluate(()=>{ if(window.__meta.isOpen()){ const b=document.querySelector('#tavern .close, #tv-close, [data-close]'); if(b) b.click(); } });
const hidden=await p2.evaluate(()=>{ document.querySelector('#trainer .tx').click(); window.__dd.step(1/60,3); return {on:document.getElementById('trainer').classList.contains('on'),off:window.__trainer.state().off,saved:JSON.parse(localStorage.getItem('dd_trainer')).off}; });
check("the ✕ hides the guide and remembers it",!hidden.on&&hidden.off&&hidden.saved===true,JSON.stringify(hidden));
await ctx2.close();
// never on a later map; still on map one after it has been held
const ctx3=await browser.newContext(); const p3=await fresh(ctx3);
await p3.evaluate(()=>{ try{ localStorage.setItem('ddMapsCleared','1'); }catch(e){} });
await p3.goto(BASE+"/?silent&ownweapons&nogate&map=1",{timeout:240000}); await p3.waitForFunction(()=>window.__dd&&window.__trainer,null,{timeout:180000});
const later=await p3.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); return {map:window.__dd.map().id,on:document.getElementById('trainer').classList.contains('on'),training:window.__trainer.training()}; });
check("on map two the guide never shows",!later.on&&!later.training,JSON.stringify(later));
await p3.goto(BASE+"/?silent&ownweapons&nogate&map=0",{timeout:240000}); await p3.waitForFunction(()=>window.__dd&&window.__trainer,null,{timeout:180000});
const held=await p3.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); return {on:document.getElementById('trainer').classList.contains('on'),training:window.__trainer.training()}; });
check("back on map one after it has been held the guide still shows (map one is the training ground whoever plays it)",held.on&&held.training,JSON.stringify(held));
await ctx3.close();
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
