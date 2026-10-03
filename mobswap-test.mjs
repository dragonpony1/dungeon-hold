// ===== MOBSWAP (build 513, 96q-mobswap.js). Matt, Throne Room survival: "its something flying thats coming as a wooden doll". A mob that spawned before its kind's model landed (the code
// stand-in) is rebuilt in the real model once it lands. Checked: a moth spawned while its model is missing is a stand-in; within a second of the model being there it wears the real one; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9022,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:900,height:600}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route(/\/api\//,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9022/?silent&nogate&map=1",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__moth&&window.__mobswap&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>window.__moth.load()); await page.waitForFunction(()=>window.__moth.loaded(),null,{timeout:90000});
const R=await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,30); d.S.phase='wave'; d.setHero(0,-100,0);
  const e=window.__mobswap.withoutModel('moth',()=>d.spawn('moth','S')); e.hp=e.max=1e9; const was=!!e.mdl.glb; d.step(1/60,40);
  return { was, now:!!e.mdl.glb, inScene:!!e.mdl.g.parent, swaps:window.__mobswap.info().swaps, stand:window.__mobswap.stand() }; });
check("a moth that spawned before its model landed starts as the stand-in, then wears the real moth model",R.was===false&&R.now===true&&R.inScene&&R.swaps>=1&&!R.stand.includes('moth'),JSON.stringify(R));
// build 515 (Matt: "right now the wood doll is in for phase wraith"): a wraith met where its model is never asked for (the Throne Room campaign, wave 1) fetches it itself and swaps in
const W=await page.evaluate(async()=>{ const d=window.__dd; const was0=window.__wraith.loaded(); const e=d.spawn('wraith','S'); e.hp=e.max=1e9; const was=!!e.mdl.glb;
  for(let i=0;i<120&&!e.mdl.glb;i++){ d.step(1/60,40); await new Promise(r=>setTimeout(r,250)); } return { was0, was, now:!!e.mdl.glb, loaded:window.__wraith.loaded() }; });
check("a wraith on the Throne Room campaign (its model never asked for there) fetches its model and swaps out of the stand-in",W.was0===false&&W.was===false&&W.now===true&&W.loaded,JSON.stringify(W));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
