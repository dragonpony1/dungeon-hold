// ===== BOSS RECIPES AND MASTERWORKS (game build 605, 99zb-recipes.js; hideout build 92). Matt: "yes do the boss recipes next".
// Checked: one time, bosses of maps already cleared count as beaten once (3 cleared = the Gnome Hall, the Throne Room, the Cloister Court: the Pig Lords and the Archhag -- a set recipe each, their first masterwork, a trophy each); the Pig Lords
// count when the LAST of the three falls: the next masterwork (The Warden's Oath) and a second tusk, with the gold BEATEN card; Avery's first win: a Storm or Ice recipe, Tear of the Rootgate, a scale;
// the forge offers the masterworks of the picked piece (known ones with their trophy count, the rest locked), crafts The Warden's Oath for 6 sludge + 1 tusk (a MASTERWORK, the trophy spent; the game's bag has it),
// a proc makes it Proc'd (+35% main stat); no trophy, no craft; a proc on a SET craft is a Proc'd set piece, never a named one now; the recipe book's masterwork page picks one; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8899,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ if(sessionStorage.getItem('__bt')) return; sessionStorage.setItem('__bt','1'); localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","3"); localStorage.setItem("dd_trainer","done"); localStorage.setItem("dd_tip_forge","1"); localStorage.removeItem("dd_recipes"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8899/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__recipes&&window.__hideout,null,{timeout:120000});
await page.waitForFunction(()=>{ const b=JSON.parse(localStorage.getItem('dd_recipes')||'{}'); return !!b.seededBoss; },null,{timeout:20000});
const A=await page.evaluate(()=>{ const b=window.__recipes.read(); return { bosses:b.bosses, trophies:b.trophies, named:Object.keys(b.named||{}).sort(), sets:Object.keys(b.known) }; });
check("one time: with 3 maps cleared, the Pig Lords and the Archhag count as beaten once -- a set recipe, the first masterwork and a trophy each (Sir Bullion's hall is the 4th: not yet)",JSON.stringify(A.bosses)==='{"pigs":1,"archhag":1}'&&A.trophies.pigs===1&&A.trophies.archhag===1&&A.named.join()==="bramblewhisk,rootsplitter"&&A.sets.some(k=>/^of (Chaos|Radiance)\|/.test(k))&&A.sets.some(k=>/^of (Shadow|the Wind)\|/.test(k)),JSON.stringify(A));
const B=await page.evaluate(()=>{ const d=window.__dd, R=window.__recipes; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); const H=d.hero;
  const mk=k=>({ kind:k, x:H.x+3, y:0, z:H.z+3, dead:0, hp:1, max:1, mana:0, r:.5 }); const P=['pigflail','pigdagger','pigsling'].map(mk); d.enemies.push(...P);
  const steps=[]; for(const p of P){ p.dead=.001; window.__lootRates.roll(p); const b=R.read(); steps.push(b.bosses.pigs); }
  for(const p of P){ const i=d.enemies.indexOf(p); if(i>=0) d.enemies.splice(i,1); }
  const b=R.read(); const card=document.getElementById('bossRecipeCard'); return { steps, tusks:b.trophies.pigs, oath:!!b.named.wardens_oath, card:card.classList.contains('on'), txt:card.textContent }; });
check("the Pig Lords count when the last of the three falls: their next masterwork (The Warden's Oath), a second tusk, and the gold BEATEN card",B.steps.join()==="1,1,2"&&B.tusks===2&&B.oath&&B.card&&/PIG LORDS BEATEN/.test(B.txt)&&/MASTERWORK: The Warden's Oath/.test(B.txt),JSON.stringify(B));
const C=await page.evaluate(()=>{ const d=window.__dd, R=window.__recipes, H=d.hero; const e={ kind:'avery', x:H.x+3, y:0, z:H.z+3, dead:.001, hp:0, max:1, mana:0, r:.5 }; window.__lootRates.roll(e); const b=R.read(); return { avery:b.bosses.avery, scale:b.trophies.avery, tear:!!b.named.tear_of_the_rootgate, set:Object.keys(b.known).filter(k=>/^of (the Storm|Ice)\|/.test(k)).length }; });
check("Avery's first win: a Storm or Ice recipe, Tear of the Rootgate, an Avery's Scale",C.avery===1&&C.scale===1&&C.tear&&C.set===1,JSON.stringify(C));
// ---- the forge
await page.evaluate(()=>{ const d=window.__dd; d.setHero(30,30); window.__hideout.open(); });
let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof openForge==='function'&&document.getElementById('forgeMaster'),null,{timeout:120000});
const D=await f.evaluate(()=>{ window.__forgeFast=true; SAVE.legendarySludge=60; openForge(); const amulet=[...document.querySelectorAll('#forgeGearGrid .fgear')].find(t=>/Amulet/.test(t.textContent)); amulet.click();
  const chips=[...document.querySelectorAll('#forgeMaster .fmw')].map(b=>b.textContent+(b.classList.contains('lock')?'(L)':'')); [...document.querySelectorAll('#forgeMaster .fmw')].find(b=>b.dataset.named==='wardens_oath').click();
  const btn=document.getElementById('forgeCraftBtn'); const a={ chips, btn:btn.textContent, focusRows:document.querySelectorAll('#forgeFocus .fset').length, odds:document.getElementById('forgeOutput').textContent };
  const real=Math.random; Math.random=()=>.5; try{ btn.click(); } finally { Math.random=real; }
  return new Promise(res=>setTimeout(()=>{ const r=window.__forgeLast, out=document.getElementById('forgeOutput'); a.made={ tier:r.tier, named:r.named, procd:!!r.procd, mw:!!r.masterwork }; a.banner=out.textContent.slice(0,40); a.tusks=readRecipes().trophies.pigs; a.sludge=SAVE.legendarySludge; a.id=r.id; res(a); },60)); });
check("an amulet offers its masterworks (The Warden's Oath 🦷×2, Tear of the Rootgate 🐉×1); picked, no main-stat row, 'Craft · 6 sludge + 1 🦷'",D.chips.some(c=>/The Warden's Oath\s+🦷×2/.test(c))&&D.chips.some(c=>/Tear of the Rootgate\s+🐉×1/.test(c))&&D.focusRows===0&&D.btn==="Craft · 6 sludge + 1 🦷"&&/masterwork of the Pig Lords/.test(D.odds),JSON.stringify(D));
check("it makes The Warden's Oath -- a MASTERWORK, a tusk spent, 6 sludge",D.made.tier==='named'&&D.made.named==='wardens_oath'&&D.made.mw&&!D.made.procd&&/MASTERWORK/.test(D.banner)&&D.tusks===1&&D.sludge===54,JSON.stringify(D));
let G=null; for(let i=0;i<40;i++){ G=await page.evaluate(id=>{ const M=window.__dd.Meta; const b=(M.bag?M.bag():[]).find(x=>x.id===id); return b?{ name:b.name, named:b.named }:null; },D.id); if(G) break; await sleep(100); }
check("the game's bag has it",G&&G.name==="The Warden's Oath",JSON.stringify(G));
const E=await f.evaluate(()=>{ const btn=document.getElementById('forgeCraftBtn'); const real=Math.random; Math.random=()=>.01; try{ btn.click(); } finally { Math.random=real; }
  return new Promise(res=>setTimeout(()=>{ const r=window.__forgeLast; const a={ procd:!!r.procd, named:r.named, primary:r.primary, banner:document.getElementById('forgeOutput').textContent.slice(0,40), tusks:readRecipes().trophies.pigs };
    a.btnNone=btn.textContent; a.disNone=btn.disabled; res(a); },60)); });
check("a proc makes it PROC'D (+35% on its main stat); with no tusk left the button says what it needs and is off",E.procd&&E.named==='wardens_oath'&&!!E.primary&&/PROC'D/.test(E.banner)&&E.tusks===0&&/Need a Pig Lord's Tusk/.test(E.btnNone)&&E.disNone,JSON.stringify(E));
const F2=await f.evaluate(()=>{ const b=readRecipes(); const k=Object.keys(b.known).find(k=>/^of (Chaos|Radiance|Shadow|the Wind)\|/.test(k)); const [tail,slot]=k.split('|'); const type=Object.keys(GAME_SLOT).find(t=>GAME_SLOT[t]===slot); const sid=MYTHIC_SETS.find(x=>x.tail===tail).id;
  forgeNamed=null; forgeSelected=type; forgeSet=sid; forgeFocus=SET_STAT_POOL[type][0]; buildForgeGrid(); const btn=document.getElementById('forgeCraftBtn'); const real=Math.random; Math.random=()=>.005; try{ btn.click(); } finally { Math.random=real; }
  return new Promise(res=>setTimeout(()=>{ const r=window.__forgeLast; res({ k, sid, tier:r.tier, procd:!!r.procd, set:r.set }); },60)); });
check("a proc on a SET craft is a Proc'd set piece now -- never a named one",F2.tier==='mythic'&&F2.procd&&F2.set===F2.sid,JSON.stringify(F2));
const H2=await f.evaluate(()=>{ document.getElementById('forgeBookBtn').click(); const bk=document.getElementById('forgeBook'); const a={ mwKnown:bk.querySelectorAll('td.bmw.k').length, mwAll:bk.querySelectorAll('td.bmw').length, txt:bk.textContent.includes('MASTERWORKS') };
  const td=[...bk.querySelectorAll('td.bmw.k')].find(t=>t.dataset.named==='bramblewhisk'); if(td) td.click(); a.after={ open:bk.classList.contains('on'), named:forgeNamed, sel:forgeSelected, btn:document.getElementById('forgeCraftBtn').textContent }; return a; });
check("the recipe book's masterwork page: 4 of 15 known (Rootsplitter, Bramblewhisk, The Warden's Oath, Tear of the Rootgate); tapping Bramblewhisk picks it (1 heart to spend)",H2.txt&&H2.mwAll===15&&H2.mwKnown===4&&!H2.after.open&&H2.after.named==='bramblewhisk'&&H2.after.sel==='familiar'&&/\+ 1 🖤/.test(H2.after.btn),JSON.stringify(H2));
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
