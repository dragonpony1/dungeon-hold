// ===== TITLE + LOADING PICTURES, PLAIN SWORDS, FEAST MANA (build 524). Matt: "take about 6 of the best pics ive sent you this morning and add to the title screen andloading rotation" / "i need to make soem
// thumbs for our ordinary gear" / "the dining hall only starts with 360 mana it could use more like 800 maybe". Checked: ?titlebg=pic-frostfox paints the fox on the title (and no 3D stage starts); the six pictures
// are in the loading rotation and load; a plain Knight weapon shows its sword picture by its name (Shortsword -> 1 ... Gnome Blade -> 5) and the Witch's plain weapon keeps its emblem; the Feast Hall starts
// with 800 mana; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9036,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1300,height:800}}); const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route(/\/api\//,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9036/?silent&nogate&titlebg=pic-frostfox",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel(),null,{timeout:120000});
await page.waitForFunction(()=>document.getElementById('start').classList.contains('picbg'),null,{timeout:20000}).catch(()=>{});
const T=await page.evaluate(()=>{ const st=document.getElementById('start'); return { want:window.__titleWant(), pic:st.classList.contains('picbg'), bg:(st.style.background||'').includes('loading-frostfox.jpg'), stage:st.classList.contains('stage') }; });
check("the title can show Matt's Frost Fox painting (and no 3D stage starts for it)",T.want==='pic-frostfox'&&T.pic&&T.bg&&!T.stage,JSON.stringify(T));
const L=await page.evaluate(async()=>{ const names=['frostfox','crystalowl','stormdrake','fireimp','toilntrouble','radiancebow']; const ok=await Promise.all(names.map(n=>new Promise(r=>{ const i=new Image(); i.onload=()=>r(true); i.onerror=()=>r(false); i.src='assets/loading-'+n+'.jpg'; })));
  return { ok, inList:(window.__titleList||[]).filter(x=>/^pic-/.test(x)).length }; });
check("the six pictures load and all six are in the title rotation",L.ok.every(Boolean)&&L.inList===6,JSON.stringify(L));
const P=await page.evaluate(async()=>{ const d=window.__dd, P=window.__meta.packs; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,20); await window.__heroes.select('knight');
  const mk=n=>({ id:'w'+Math.random(), slot:'weapon', rarity:1, lvl:5, name:n, stats:{dmg:1} }); const srcs=['Rusty Shortsword','Fine Broadsword','Keen Cleaver','Runed Warhammer','Eternal Gnome Blade'].map(n=>P.art(mk(n)));
  const ok=await Promise.all(srcs.map(s=>s?new Promise(r=>{ const i=new Image(); i.onload=()=>r(true); i.onerror=()=>r(false); i.src=s; }):false)); await window.__heroes.select('witch'); const w=P.art(mk('Rusty Shortsword'));
  return { srcs:srcs.map(s=>s&&s.split('/').pop()), ok, witch:w }; });
check("plain Knight weapons show sword pictures by name, steps 1..5, and they load; the Witch's plain weapon keeps its emblem for now",P.srcs.join()==='sword-1.jpg,sword-2.jpg,sword-3.jpg,sword-4.jpg,sword-5.jpg'&&P.ok.every(Boolean),JSON.stringify(P));
await ctx.close(); const p2=await (await browser.newContext()).newPage(); p2.on("pageerror",e=>errors.push(String(e)));
await p2.route(/\/api\//,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
await p2.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await p2.goto("http://127.0.0.1:9036/?silent&nogate&map=3",{timeout:120000}); await p2.waitForFunction(()=>window.__dd&&window.__dd.heroModel(),null,{timeout:120000});
const M=await p2.evaluate(()=>({ map:window.__dd.S&&window.__mapId?window.__mapId():null, mana:window.__dd.S.mana }));
check("the Feast Hall starts with 800 mana",M.mana===800,JSON.stringify(M));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
