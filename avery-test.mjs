// ===== AVERY, THE DRAWBRIDGE'S BOSS (build 473). Checked: her two models load; the cut scene runs (the glide in, the bust, the stamp) and gives the hall back; she circles, swoops and her feathers
// hurt a tower; below half she is furious; every fourth swoop she lands on the hall roof; her fall drops the five Wind pieces and 40 Legendary jars; no page errors. Pictures of each beat in tools/test-logs.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9024,{dist:"./dist"}); const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await (await browser.newContext({viewport:{width:1100,height:680}})).newPage(); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9024/?silent&nogate&map=4",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel(),null,{timeout:120000});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?'PASS ':'FAIL ')+n+(d?'  -> '+d:'')); };
const shot=n=>page.screenshot({path:"tools/test-logs/avery-"+n+".png"});
const L=await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); window.__freeze=true; d.S.phase='wave'; d.S.crystal=d.S.crystal2=d.S.crystal3=150;
  await window.__avery.load(); return window.__avery.loaded(); });
check('her flyer and her bust load',L);
const A=await page.evaluate(()=>{ const d=window.__dd, W=window.__moatwalk; const p=W.at(24,30); d.setHero(p.x,p.z,Math.PI); d.hero.y=0; d.addMana(1e7);
  for(const [cx,cz] of [[12,8],[30,10]]){ const q=W.at(cx,cz); d.placeDefAt('harpoon',q.x,q.z,0); } d.step(1/60,10);
  window.__avery.startCut(); d.step(1/30,60); return window.__avery.info(); });
check('the cut scene starts with the spotlights up and Avery out',A.cut&&A.beams>0&&A.spawned===1,JSON.stringify(A)); await shot('1-glide');
await page.evaluate(()=>window.__dd.step(1/30,90)); await shot('2-bust');
await page.evaluate(()=>window.__dd.step(1/30,88)); await shot('3-stamp');
const B=await page.evaluate(()=>{ window.__dd.step(1/30,80); return { info:window.__avery.info(), st:window.__avery.state()[0] }; });
check('the cut scene ends and gives the hall back, Avery cruising the roofs',!B.info.cut&&B.st&&B.st.st==='cruise'&&B.st.y>18,JSON.stringify(B));
const C=await page.evaluate(()=>{ const d=window.__dd; const t0=d.defs.reduce((s,x)=>s+x.hp,0); for(let i=0;i<60*24;i++){ d.step(1/60,1); for(const x of d.defs) x.hp=Math.max(x.hp,1); } return { info:window.__avery.info(), st:window.__avery.state()[0] }; });
check('she swoops and her feathers land on a tower',C.info.swoops>=2&&C.info.towerHits>0,JSON.stringify(C)); await shot('4-fight');
const D=await page.evaluate(()=>{ const d=window.__dd; const e=d.enemies.find(x=>x.kind==='avery'&&!x.dead); e.hp=e.max*.45; e.aswoops=4; e.perched=false; e.acd=0; d.step(1/60,2); const ph=e.phase; for(let i=0;i<60*6;i++) d.step(1/60,1); return { phase:ph, st:window.__avery.state()[0], perches:window.__avery.info().perches }; });
check('below half she is furious, and she lands on the hall roof to preen',D.phase===2&&D.perches>=1&&D.st&&D.st.y<19,JSON.stringify(D)); await shot('5-perch');
const E=await page.evaluate(()=>{ const d=window.__dd; const j0=window.__jars.list().length, l0=d.loot.length; const e=d.enemies.find(x=>x.kind==='avery'&&!x.dead); d.kill(e); d.step(1/60,30);
  const wind=d.loot.slice(l0).filter(l=>l.it&&l.it.setId==='wind').map(l=>l.it.slot); return { jars:window.__jars.list().length-j0, wind, deaths:window.__avery.info().deaths }; });
check('her fall drops all five Wind pieces and 40 Legendary jars',E.deaths===1&&E.wind.length===5&&new Set(E.wind).size===5&&E.jars>=40,JSON.stringify(E)); await shot('6-fall');
check('no page errors',errors.length===0,JSON.stringify(errors.slice(0,3))); await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
