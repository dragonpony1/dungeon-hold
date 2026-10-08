// ===== DIFFICULTY AT THE RAVEN (build 591; parts/staging/95r-difficulty.js). Matt: "it would be nice if i could go into like the same picker mechanism as the hero picker at the raven
// and change the difficulty" / "yes i agree on the medals rule".
// Checked: by the raven in the build phase a row of the four levels shows above the hero buttons (not away from it, not in a wave); a click switches (remembered, toast); the next wave
// uses it; the map's medal is the EASIEST level played this run (HARD on the title, NIGHTMARE at the raven -> HARD medal; then EASY -> EASY medal); no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const DIST=process.env.DIST||"./dist"; const server=await serve(8866,{dist:DIST});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}});
await ctx.addInitScript(()=>{ try{ if(sessionStorage.getItem('__dr')) return; sessionStorage.setItem('__dr','1'); localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_difficulty","hard"); localStorage.removeItem("dd_diff_best"); localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8866/?silent&nogate&map=1",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__difficulty&&window.__raven&&window.__dd.map,null,{timeout:120000});
const A=await page.evaluate(async()=>{ const d=window.__dd, D=window.__difficulty; try{ window.__trainer.skip(); }catch(e){} d.start(); for(let i=0;i<40;i++){ d.step(1/30,1); await new Promise(r=>setTimeout(r,10)); }
  const far=D.ravenRow(); const p=window.__raven.pos(); d.hero.x=p.x+1.2; d.hero.z=p.z+1.2; for(let i=0;i<10;i++) d.step(1/30,1);
  const near=D.ravenRow(), btns=[...document.querySelectorAll('#diffPick button')].map(b=>b.textContent), hero=window.__raven.heroPickVisible();
  return { far, near, btns, hero, id:D.id(), run:D.runMin() }; });
await page.screenshot({path:(process.env.TEMP||".")+"/diffraven.png",clip:{x:240,y:470,width:800,height:330}});
check("by the raven in the build phase the four levels show (with the hero buttons); away from it they don't",!A.far&&A.near&&A.hero&&A.btns.length===4&&/EASY/.test(A.btns[0])&&/NIGHTMARE/.test(A.btns[3]),JSON.stringify(A));
const B=await page.evaluate(async()=>{ const d=window.__dd, D=window.__difficulty; document.querySelectorAll('#diffPick button')[3].click(); await new Promise(r=>setTimeout(r,50));
  return { id:D.id(), saved:localStorage.getItem('dd_difficulty'), run:D.runMin(), toast:(document.getElementById('toast')||{}).textContent||'' }; });
check("a click switches it (NIGHTMARE), remembered; the run's medal level stays HARD (the easiest played)",B.id==='nightmare'&&B.saved==='nightmare'&&B.run==='hard',JSON.stringify(B));
const C=await page.evaluate(async()=>{ const d=window.__dd, D=window.__difficulty; d.startWave(); for(let i=0;i<5;i++) d.step(1/30,1); const inWave=D.ravenRow(); const mobs=d.enemies.length;
  D.record(); const b1=D.best(); d.enemies.length=0; d.S.phase='build'; for(let i=0;i<10;i++) d.step(1/30,1);
  document.querySelectorAll('#diffPick button')[0].click(); await new Promise(r=>setTimeout(r,50)); const run2=D.runMin(); localStorage.removeItem('dd_diff_best'); D.record(); const b2=D.best();
  return { inWave, mobs, b1, run2, b2, id:D.id() }; });
check("in a wave the row is gone",C.inWave===false,JSON.stringify(C.inWave));
check("medal rule: held with HARD then NIGHTMARE -> a HARD medal; after a switch down to EASY -> an EASY medal",C.b1.throne===2&&C.run2==='easy'&&C.b2.throne===0&&C.id==='easy',JSON.stringify(C));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
