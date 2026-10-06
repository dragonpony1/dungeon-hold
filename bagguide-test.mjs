// ===== HOW TO READ YOUR GEAR (build 570; parts/staging/99o-bagguide.js). Matt: "a little more tutuorial on the bag page when you first open it, explaining the equipment cards ... the pips, the sets".
// Checked: the first bag opened with something in it shows the picture card by itself, once (dd_bag_guide); GOT IT / Esc close it; the ❔ beside the bag's tools brings it back; an empty bag or a test page (?silent) does not pop it.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8855,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
async function open(q){ const p=await (await browser.newContext({viewport:{width:1400,height:900}})).newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.route(/\/api\//,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
  await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} });
  await p.goto("http://127.0.0.1:8855/"+q,{timeout:120000}); await p.waitForFunction(()=>window.__dd&&window.__bagguide&&window.__tavern&&window.__meta,null,{timeout:120000}); return p; }
// a player's page: an empty bag first, then one with a piece in it
const p=await open("?nogate");
const A=await p.evaluate(async()=>{ const d=window.__dd, M=window.__meta, T=window.__tavern; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); M.reset&&M.reset();
  const empty0=M.bag().length; T.open(); T.tab('bag'); await new Promise(r=>setTimeout(r,1000)); const onEmpty=window.__bagguide.isOn(); T.close&&T.close();
  M.giveItem(d.rollItem(2,'armor',5)); T.open(); T.tab('bag'); await new Promise(r=>setTimeout(r,1000)); const on=window.__bagguide.isOn(); const g=document.getElementById('bagguide'); const rows=g?g.querySelectorAll('.r').length:0; const text=g?g.textContent:'';
  return { empty0, onEmpty, on, rows, pips:!!(g&&g.querySelector('.pp')), set:/collect all 5/.test(text), up:/▲\+108/.test(text), best:/BEST/.test(text), btn:!!document.getElementById('bagguide-btn'), seen:localStorage.getItem('dd_bag_guide') }; });
check("an empty bag does not pop the guide",A.onEmpty===false,JSON.stringify(A));
check("the first bag with something in it shows the picture card by itself: ten marks read (GS, ▲, BEST, level, set picture, rarity, set column, pips, forge bar, worn badges)",A.on&&A.rows===10&&A.pips&&A.set&&A.up&&A.best,JSON.stringify(A));
check("it is remembered (dd_bag_guide) and the ❔ button sits with the bag's tools",A.seen==='1'&&A.btn,JSON.stringify(A));
await p.click('#bagguide .ok'); const B1=await p.evaluate(()=>window.__bagguide.isOn());
const B2=await p.evaluate(async()=>{ const T=window.__tavern; T.close&&T.close(); await new Promise(r=>setTimeout(r,500)); T.open(); T.tab('bag'); await new Promise(r=>setTimeout(r,1200)); return window.__bagguide.isOn(); });
check("GOT IT closes it, and opening the bag again does not bring it back by itself",B1===false&&B2===false,JSON.stringify({B1,B2}));
await p.click('#bagguide-btn'); const C1=await p.evaluate(()=>window.__bagguide.isOn()); await p.keyboard.press('Escape'); const C2=await p.evaluate(()=>window.__bagguide.isOn());
check("the ❔ button brings it back; Esc closes it",C1===true&&C2===false,JSON.stringify({C1,C2}));
// a test page (?silent) never pops it by itself
const q=await open("?silent&nogate"); const D=await q.evaluate(async()=>{ const d=window.__dd, M=window.__meta, T=window.__tavern; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); M.giveItem(d.rollItem(2,'armor',5)); T.open(); T.tab('bag'); await new Promise(r=>setTimeout(r,1000)); return window.__bagguide.isOn(); });
check("a ?silent page does not pop it",D===false,String(D));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
