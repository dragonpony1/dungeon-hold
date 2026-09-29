// ===== YOUR BAG IN THE HIDEOUT (96g-hideoutbag.js, game build 298 + hideout build 69). Matt: "why cant b for bag just work in the hide out. pull the salvagable gear right of it. or let me dump with a button
// into the cauldron ... when i go to the forge i need to pick what piece i am going for, but i cant remember what part of my set i am missing". Checked: B in the hideout opens the game's bag over it (on top,
// its footer says back to the hideout); "Salvage" puts every unlocked bag piece into the Cauldron Cart by rarity (the hideout re-reads it at once) and never a locked or worn one; one piece salvages from its
// card; closing hands the hideout back (click to enter); the forge shows a dot per set piece you have and, with a set picked, a check or cross on each piece.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8954,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8954/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__hideout&&window.__hideoutbag&&window.__tavern,null,{timeout:120000});
const ids=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} M.reset(); d.start(); d.step(1/60,10); const ids={junk:[]};
  const va=d.rollItem(2,'armor',2); va.name=va.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' of the Void'; M.giveItem(va); M.equip(va.id); ids.voidArmor=va.id;
  const vm=d.rollItem(2,'amulet',2); vm.name=vm.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' of the Void'; M.giveItem(vm); vm.locked=true; ids.voidAmulet=vm.id;
  for(const [r,s] of [[0,'weapon'],[1,'charm'],[2,'amulet']]){ const it=d.rollItem(r,s,1); it.rarity=r; it.name='Plain '+s; M.giveItem(it); it.locked=false; ids.junk.push(it.id); }
  localStorage.setItem('dd_gear_bag',JSON.stringify({common:0,uncommon:0,rare:0,epic:0,legendary:0})); M.save(); d.setHero(30,30); window.__hideout.open(); return ids; });
let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof openHallBag==='function'&&typeof buildForgeGrid==='function'&&typeof BAG==='object',null,{timeout:120000});
await f.evaluate(()=>{ Object.assign(BAG,loadBag()); openHallBag(); });
await page.waitForFunction(()=>window.__tavern.isOpen()&&window.__hideoutbag.fromHideout(),null,{timeout:10000});
const a=await page.evaluate(()=>{ const tz=+getComputedStyle(document.getElementById('tavern')).zIndex, hz=+getComputedStyle(document.getElementById('hideoutWrap')).zIndex; const sb=document.getElementById('tv-salvall');
  return { tz, hz, foot:document.getElementById('tv-defend').textContent, salv:sb&&sb.textContent, eq:[...document.querySelectorAll('#tavern .tv-eq .tv-card')].length }; });
check("B in the hideout opens the game's bag over it (on top of the hideout, what every slot has on), its footer says back to the hideout, and a Salvage button counts the 3 unlocked pieces",a.tz>a.hz&&/HIDEOUT/.test(a.foot)&&/\(3\)/.test(a.salv||'')&&a.eq>=5,JSON.stringify(a));
await page.click('#tv-salvall'); await sleep(300);
const b=await page.evaluate(ids=>{ const M=window.__meta; const bag=M.bag().map(x=>x.id); const cart=JSON.parse(localStorage.getItem('dd_gear_bag')); return { bag, cart, amuletKept:bag.includes(ids.voidAmulet), armorWorn:!!Object.values(window.__dd.gear()).find(x=>x&&x.id===ids.voidArmor), msg:document.getElementById('tv-msg').textContent }; },ids);
const fb=await f.evaluate(()=>({...BAG}));
check("Salvage puts every unlocked bag piece into the Cauldron Cart by rarity (1 common, 1 uncommon, 1 rare), keeps the locked Void amulet and the worn Void armor, and the hideout re-reads the Cart at once",b.cart.common===1&&b.cart.uncommon===1&&b.cart.rare===1&&b.amuletKept&&b.armorWorn&&b.bag.length===1&&fb.common===1&&fb.rare===1,JSON.stringify({b,fb}));
const c=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; const it=d.rollItem(3,'charm',1); it.rarity=3; it.name='Spare charm'; M.giveItem(it); it.locked=false; window.__tavern.select(it.id,'bag'); const btn=document.querySelector('#tv-detail [data-act="tvsalv"]'); const had=!!btn; if(btn) btn.click(); const cart=JSON.parse(localStorage.getItem('dd_gear_bag')); return { had, epic:cart.epic, gone:!M.bag().some(x=>x.id===it.id) }; });
check("one piece salvages from its own card (an epic charm: +1 epic scrap, gone from the bag)",c.had&&c.epic===1&&c.gone,JSON.stringify(c));
await page.evaluate(()=>window.__tavern.close()); await sleep(300);
const d=await page.evaluate(()=>({ open:window.__tavern.isOpen(), from:window.__hideoutbag.fromHideout(), z:document.getElementById('tavern').style.zIndex }));
const ds=await f.evaluate(()=>document.getElementById('start').style.display);
check("closing hands the hideout back: the bag is gone and the hideout shows its click-to-enter",!d.open&&!d.from&&d.z===''&&ds==='flex',JSON.stringify({d,ds}));
const o=await page.evaluate(()=>{ window.__hideoutbag.writeOwned(); const o=window.__hideoutbag.owned(); return o&&o.sets&&o.sets['of the Void']; });
check("what you own is written for the forge: the Void armor worn, the Void amulet in the bag",o&&o.armor==='worn'&&o.amulet==='bag',JSON.stringify(o));
const g=await f.evaluate(()=>{ openForge(); forgeSet='void'; buildForgeGrid(); const btn=[...document.querySelectorAll('#forgeSets .fset')].find(b=>/of the Void/.test(b.textContent)); const tile=k=>{ const el=[...document.querySelectorAll('#forgeGearGrid .fgear')].find(x=>x.querySelector('img[data-cat="'+k+'"]')); const h=el&&el.querySelector('.fhave'); return h?(h.classList.contains('have')?'have':'miss'):null; };
  return { dots:btn?btn.querySelectorAll('.fdots i').length:0, on:btn?btn.querySelectorAll('.fdots i.on').length:0, armor:tile('armor'), amulet:tile('amulet'), trinket:tile('trinket'), weapon:tile('weapon') }; });
check("the forge's Void button shows 5 dots with 2 filled (armor, amulet); with Void picked, armor and amulet are checked and the charm and weapon crossed",g.dots===5&&g.on===2&&g.armor==='have'&&g.amulet==='have'&&g.trinket==='miss'&&g.weapon==='miss',JSON.stringify(g));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
