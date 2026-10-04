// ===== RETINA VIEW (build 522, 68-paperdoll.js dollFrame). OJ on a Retina Mac: after the Tab sheet his hero sat up and to the right -- the portrait pass handed the hall back a viewport 1.5x too
// big (drawing-buffer pixels passed where three.js wants CSS pixels). Checked on an emulated Retina screen (deviceScaleFactor 2 -> renderer ratio 1.5): after the sheet opens and closes, the hall's
// viewport is exactly the window again and the scissor test is off; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9032,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1200,height:760},deviceScaleFactor:2})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route(/\/api\//,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9032/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__doll&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,30); window.__doll.open(); });
await page.waitForTimeout(1500);
const R=await page.evaluate(()=>{ window.__doll.close(); const r=window.__dd.renderer, v=r.getViewport(new THREE.Vector4()); return { pr:r.getPixelRatio(), vp:[v.x,v.y,v.z,v.w], win:[innerWidth,innerHeight], sc:r.getScissorTest() }; });
check("Retina: after the Tab sheet the hall's view is exactly the window (not 1.5x, not shifted) and the scissor is off",R.pr>1&&R.vp[0]===0&&R.vp[1]===0&&Math.abs(R.vp[2]-R.win[0])<1&&Math.abs(R.vp[3]-R.win[1])<1&&R.sc===false,JSON.stringify(R));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
