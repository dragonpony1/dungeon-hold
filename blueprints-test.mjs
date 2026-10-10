// ===== THE BLUEPRINT BOOK FROM THE TAB SHEET (build 617, 99zd-blueprints.js + 68-paperdoll.js). Matt: "the tab button is a page i can access from anywhere. lets put a shiny button in there that says blueprint
// book and change all recipes verbage to blueprint". Checked: the Tab sheet has a shiny BLUEPRINT BOOK button; it opens the book in the hall (45 blueprints, 15 masterworks, what you know in gold, a page count),
// a known blueprint spotlights "forge it at the Blacksmith"; Esc closes it; the learned card says BLUEPRINT LEARNED; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8906,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("dd_trainer","done");
  localStorage.setItem("dd_recipes",JSON.stringify({seeded:1,seededH:1,seededBoss:1,known:{"of Chaos|weapon":1,"of Fire|armor":1},pages:{"of Ice|amulet":2},named:{rootsplitter:1},trophies:{pigs:1},bosses:{pigs:1}})); }catch(e){} });
await page.goto("http://127.0.0.1:8906/?silent&nogate&map=1",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__blueprints&&window.__dd.heroModel&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,10); });
await page.keyboard.press('Tab'); await sleep(600);
const A=await page.evaluate(()=>{ const b=document.querySelector('#doll .dl-bp'); return { btn:!!b, txt:b&&b.textContent, vis:!!(b&&b.getBoundingClientRect().width) }; });
check("the Tab sheet has a shiny BLUEPRINT BOOK button",A.btn&&A.vis&&/BLUEPRINT BOOK/.test(A.txt),JSON.stringify(A));
if(A.btn) await page.click("#doll .dl-bp"); await sleep(2500);
if(process.env.SHOTS) await page.screenshot({path:process.env.SHOTS+"/bp-hall.png"});
const B=await page.evaluate(()=>{ const bk=document.getElementById('bpBook'); const td=[...bk.querySelectorAll('td.bc.k')][0]; if(td) td.click(); const sp=bk.querySelector('.pg.l .spot').textContent;
  return { on:bk.classList.contains('on'), title:bk.querySelector('h2').textContent, sub:bk.querySelector('.bsub').textContent, cells:bk.querySelectorAll('td.bc').length, known:bk.querySelectorAll('td.bc.k').length, pages:bk.querySelectorAll('td.bc.p').length, mw:bk.querySelectorAll('td.bmw').length, mwk:bk.querySelectorAll('td.bmw.k').length, ready:bk.querySelectorAll('td.bmw.ready').length, sp }; });
check("it opens the Blueprint Book in the hall: 45 blueprints (2 known, 1 with pages), 15 masterworks (Rootsplitter known and READY with a tusk)",B.on&&B.title==='Blueprint Book'&&/2 of 45 known/.test(B.sub)&&B.cells===45&&B.known===2&&B.pages===1&&B.mw===15&&B.mwk===1&&B.ready===1,JSON.stringify(B));
check("a known blueprint spotlights 'forge it at the Blacksmith'",/forge it at the Blacksmith/.test(B.sp),JSON.stringify(B.sp));
await page.keyboard.press('Escape'); await sleep(150);
const C=await page.evaluate(()=>({ on:document.getElementById('bpBook').classList.contains('on') }));
check("Esc closes it",!C.on,JSON.stringify(C));
const D=await page.evaluate(()=>{ const R=window.__recipes; R.learn('of Wind|weapon'.replace('Wind','the Wind'),'pages'); return document.getElementById('recipeCard').textContent; });
check("learning one says BLUEPRINT LEARNED",/BLUEPRINT LEARNED/.test(D),D);
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
