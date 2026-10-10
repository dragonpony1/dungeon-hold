// ===== RECIPES: TORN PAGES AND SALVAGE-TO-LEARN (game build 604, 99zb-recipes.js + 96g salvage; hideout build 89, the forge's locks, recipe book and weapon kind). Matt: "yes build the pages and salvage to learn" and
// "in the recipe picker i should be able to pick the weapon type".
// Checked: once, what you own counts as known; on the Throne Room a page is always for Chaos or Radiance; ordinary mobs can drop pages, bosses don't; a page flies to you and counts 1 of 3, three teach the recipe
// (the gold card); salvaging a set piece from the bag over the hideout teaches its recipe; the forge locks an unknown recipe (the button says so, the set shows its pages), crafts a known one, and a weapon
// recipe lets you pick sword, staff or polearm; the recipe book counts what you know of 45 and a ✓ in it picks that recipe; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8897,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ if(sessionStorage.getItem('__rt')) return; sessionStorage.setItem('__rt','1'); localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("dd_trainer","done"); localStorage.setItem("dd_recipes",JSON.stringify({seededBoss:1})); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8897/?silent&nogate&map=1",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__recipes&&window.__hideout&&window.__tavern,null,{timeout:120000});
const A=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, R=window.__recipes; try{ window.__trainer.skip(); }catch(e){} localStorage.setItem('dd_recipes',JSON.stringify({seededBoss:1}));   /* the one-time boss credit (build 605) is bossrecipes-test's */
  const it=d.rollItem(2,'armor',2); it.name=it.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' of Fire'; M.giveItem(it);
  const n1=R.seed(), n2=R.seed(); const b=R.read(); return { n1, n2, fire:!!b.known['of Fire|armor'] }; });
check("once, what you own counts as known (a Fire armor in the bag); a second time teaches nothing",A.fire&&A.n1>=1&&A.n2===0,JSON.stringify(A));
const B=await page.evaluate(()=>{ const d=window.__dd, R=window.__recipes; d.start(); d.step(1/60,10); d.S.phase='wave'; const keys=[]; for(let i=0;i<40;i++) keys.push(R.pickKey());
  return { home:keys.every(k=>/^of (Chaos|Radiance)\|/.test(k)), sample:keys.slice(0,4), gob:R.chance('goblin'), pig:R.chance('pigflail') }; });
check("on the Throne Room every page is for Chaos or Radiance; a goblin can drop one, a pig lord can't",B.home&&B.gob>0&&B.gob<=1&&B.pig===0,JSON.stringify(B));
const C=await page.evaluate(()=>{ const d=window.__dd, R=window.__recipes, H=d.hero; const k='of Chaos|weapon'; const out=[];
  for(let n=0;n<3;n++){ R.spawn(k,H.x+1.5,H.z); for(let i=0;i<90;i++) d.step(1/60,1); const b=R.read(); out.push({ floor:R.list().length, pages:b.pages[k]|0, known:!!b.known[k] }); }
  return { out, card:document.getElementById('recipeCard').classList.contains('on'), txt:document.getElementById('recipeCard').textContent }; });
check("a page flies to you: 1 of 3, then 2 of 3, and the third teaches the Chaos weapon recipe with the gold card",C.out[0].floor===0&&C.out[0].pages===1&&C.out[1].pages===2&&C.out[2].known&&C.out[2].pages===0&&C.card&&/BLUEPRINT LEARNED/.test(C.txt)&&/Chaos Weapon/.test(C.txt),JSON.stringify(C));
// ---- salvage teaches, from the bag over the hideout
await page.evaluate(()=>{ const d=window.__dd; d.S.phase='build'; d.setHero(30,30); window.__hideout.open(); });
let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof openHallBag==='function'&&typeof openForge==='function'&&typeof BAG==='object'&&document.getElementById('forgeBook'),null,{timeout:120000});
await f.evaluate(()=>{ Object.assign(BAG,loadBag()); openHallBag(); });
await page.waitForFunction(()=>window.__tavern.isOpen()&&window.__hideoutbag.fromHideout(),null,{timeout:10000});
const D=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; const it=d.rollItem(2,'amulet',2); it.name=it.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' of Radiance'; it.rarity=2; M.giveItem(it); it.locked=false; window.__tavern.select(it.id,'bag');
  const b1=document.querySelector('#tv-detail [data-act="tvsalv"]'); if(b1) b1.click(); const b2=document.querySelector('#tv-detail [data-act="tvsalv"]'); if(b2) b2.click();
  const b=window.__recipes.read(); return { gone:!M.bag().some(x=>x.id===it.id), known:!!b.known['of Radiance|amulet'], said:(document.querySelector('#tavern')||{}).textContent.includes('📖') }; });
check("salvaging a Radiance amulet from the bag teaches the Radiance amulet recipe (and says so)",D.gone&&D.known&&D.said,JSON.stringify(D));
await page.evaluate(()=>{ try{ window.__tavern.close&&window.__tavern.close(); }catch(e){} }); await sleep(200);
// ---- the forge
const E=await f.evaluate(()=>{ window.__forgeFast=true; SAVE.legendarySludge=50; openForge(); const btn=document.getElementById('forgeCraftBtn'); [...document.querySelectorAll('#forgeGearGrid .fgear')][0].click();
  const chip=n=>[...document.querySelectorAll('#forgeSets .fset')].find(b=>b.textContent.startsWith(n)); chip('of Shadow').click(); const a={ lockedBtn:btn.textContent, lockedDis:btn.disabled, tileLock:document.querySelector('#forgeGearGrid .fgear').classList.contains('flock'), odds:document.getElementById('forgeOutput').textContent };
  a.shadowChip=chip('of Shadow').textContent; chip('of Chaos').click(); a.chaosBtn=btn.textContent; a.kinds=[...document.querySelectorAll('#forgeWtype .fset')].map(b=>b.textContent); a.sel=(document.querySelector('#forgeWtype .fset.sel')||{}).textContent;
  [...document.querySelectorAll('#forgeWtype .fset')].find(b=>b.dataset.w==='polearm').click(); const real=Math.random; Math.random=()=>.5; try{ document.getElementById('forgeCraftBtn').click(); } finally { Math.random=real; }
  return new Promise(res=>setTimeout(()=>{ const r=window.__forgeLast; a.made={ set:r.set, art:r.art, name:r.name }; res(a); },60)); });
check("the forge locks a recipe you don't know: '🔒 Recipe not learned', the piece greyed, its pages and where they drop",/Blueprint not learned/.test(E.lockedBtn)&&E.lockedDis&&E.tileLock&&/Throne Room|Cloister/.test(E.odds)&&/🔒|📜/.test(E.shadowChip),JSON.stringify(E));
check("a known recipe crafts, and a weapon lets you pick Sword, Staff or Polearm: a Chaos polearm",E.chaosBtn==="Craft · 6 sludge"&&E.kinds.join()==="Sword,Staff,Polearm"&&E.made.set==="crimson"&&E.made.art==="polearm"&&/Polearm of Chaos/.test(E.made.name),JSON.stringify(E));
const G=await f.evaluate(()=>{ document.getElementById('forgeBookBtn').click(); const bk=document.getElementById('forgeBook'); const a={ on:bk.classList.contains('on'), sub:bk.querySelector('.bsub').textContent, ticks:bk.querySelectorAll('td.bc.k').length, pagesCells:bk.querySelectorAll('td.bc.p').length, btn:document.getElementById('forgeBookCount').textContent };
  const td=[...bk.querySelectorAll('td.bc.k')].find(t=>t.dataset.set==='angelic'&&t.dataset.type==='amulet'); if(td) td.click(); a.after={ open:bk.classList.contains('on'), sel:forgeSelected, set:forgeSet, btn:document.getElementById('forgeCraftBtn').textContent }; return a; });
check("the recipe book: what you know of 45 (Fire armor, Chaos weapon, Radiance amulet), and a ✓ picks that recipe to forge",G.on&&/3 of 45 known/.test(G.sub)&&G.ticks===3&&/Blueprints 3\/45/.test(G.btn)&&!G.after.open&&G.after.sel==='amulet'&&G.after.set==='angelic'&&G.after.btn==="Craft · 6 sludge",JSON.stringify(G));
// build 622 (Matt: "a little stingy" / "unless i am missing the card when i get a torn piece" -> "yes do both"): about 1 page a wave; pages 1 and 2 show a small picture card with 📜 pips
const PG=await page.evaluate(()=>{ const R=window.__recipes; const b=JSON.parse(localStorage.getItem('dd_recipes')||'{}'); const k=['of Shadow|amulet','of Ice|charm','of the Wind|armor'].find(x=>!(b.known||{})[x]&&!((b.pages||{})[x]));
  R.addPage(k,0,0,0); const on1=R.pageCardOn(), h1=R.pageCardHtml(); R.addPage(k,0,0,0); const h2=R.pageCardHtml(); return { k, on1, img:h1.includes('<img src="hideout/assets/hideout/items/sets/'), lit1:(h1.split('<b>📜</b>').length-1), dim1:(h1.split('<i>📜</i>').length-1), lit2:(h2.split('<b>📜</b>').length-1) }; });
check("a torn page shows a small corner card: the piece's picture and 📜 pips (1 lit of 3, then 2)",PG.on1&&PG.img&&PG.lit1===1&&PG.dim1===2&&PG.lit2===2,JSON.stringify(PG));
await new Promise(r=>setTimeout(r,3300)); const PG2=await page.evaluate(()=>window.__recipes.pageCardOn()); check("and it fades by itself",!PG2);
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
