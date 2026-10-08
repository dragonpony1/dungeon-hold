// ===== ARCHERS CAN'T SHOOT THE INN HEARTROOT FROM BELOW (build 593; parts/game.js, the ranged mob's target pick). Matt, on the Drawbridge: "from the ground these archers are shooting the
// hearroot up on top of the inn". Checked: a troll archer (range 13) from the east door, climbing the inn's switchback, does no harm to the inn Heartroot while it is still more than 2.5
// below it (old: it shot from part way up); once up on the roof it does; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const DIST=process.env.DIST||"./dist"; const server=await serve(8867,{dist:DIST});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1000,height:700}});
await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8867/?silent&nogate&map=4",{timeout:180000}); await page.waitForFunction(()=>window.__dd&&window.__dd.map&&window.__dd.map().id==='moat',null,{timeout:180000});
const R=await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/30,5);
  const I=window.__moatinn.info(), top=I.h2; d.S.phase='wave'; d.hero.x=-60; d.hero.z=-60;
  d.spawn('troll',d.lanes().E?'E':Object.keys(d.lanes())[2]); const e=d.enemies[d.enemies.length-1]; const byH={}; let maxY=0;
  for(let i=0;i<30*90;i++){ const cb=d.S.crystal2; d.step(1/30,1); const y=e.y||0; maxY=Math.max(maxY,y); if(d.S.crystal2<cb){ const k=(top-y)>2.5?'below':'up'; byH[k]=(byH[k]||0)+(cb-d.S.crystal2); }
    if(e.dead||d.S.phase!=='wave') break; if(i%90===0) await new Promise(r=>setTimeout(r,0)); }
  return { top, maxY:+maxY.toFixed(1), byH, c2:d.S.crystal2, dead:!!e.dead }; });
check("a troll archer climbing to the inn does NO damage to its Heartroot while still more than 2.5 below it",!R.byH.below,JSON.stringify(R));
check("once it is up on the roof it does shoot it",R.byH.up>0,JSON.stringify(R));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
