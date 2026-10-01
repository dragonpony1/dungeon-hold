// ===== THE HOTBAR IN KEY ORDER (build 401; parts/staging/70-hero2.js). Matt: "order of the cards on the witch aren't in order, small thing" -- her cards read 2, 1, 3, 4 (the Trebuchet sat before the Frost Spire).
// Checked, for every hero: the cards on screen, left to right, read 1, 2, 3, 4 and each is the tower its key places; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8992,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:760}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
await page.goto("http://127.0.0.1:8992/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__heroes&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); window.__dd.step(1/60,5); });
for(const h of ['witch','knight','troll','fighter']){
  const r=await page.evaluate(async h=>{ await window.__heroes.select(h); window.__dd.step(1/60,3); window.__meta.hud&&window.__meta.hud(); await new Promise(r=>setTimeout(r,50)); const un=window.__heroes.unlocks();
    const cards=[...document.querySelectorAll('#hotbar .slot')].filter(s=>s.offsetParent&&getComputedStyle(s).display!=='none').map(s=>({x:s.getBoundingClientRect().left,k:s.querySelector('.k').textContent,kind:s.id.replace('slot-','')})).sort((a,b)=>a.x-b.x);
    return { keys:cards.map(c=>c.k).join(''), kinds:cards.map(c=>c.kind).join(), un:un.join() }; },h);
  const want=Array.from({length:r.un.split(',').length},(_,i)=>i+1).join('');
  check(h+": the cards read "+want.split('').join(', ')+" left to right, each the tower its key places",r.keys===want&&r.kinds===r.un,JSON.stringify(r)); }
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
