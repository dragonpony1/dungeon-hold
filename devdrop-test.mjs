// ===== THE DEV PANEL'S "DROP HERE" IN THE HIDEOUT (build 396; parts/staging/74-devpanel.js). Matt: "when oj was in the hideout he used the dev tool to drop himself gear and it didn't drop in the hideout it dropped in the hall".
// Checked: in the hall "Drop here" still drops the piece on the floor (not the bag); with the hideout open it goes straight into the bag the hideout shows, and nothing lands on the hall floor; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8988,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:700}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
await page.goto("http://127.0.0.1:8988/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__devpanel&&window.__hideout&&window.__meta&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); window.__devpanel.toggle(true); });
const drop=()=>page.evaluate(()=>{ const d=window.__dd, M=window.__meta; const bag0=M.bag().length, floor0=d.loot.length; document.getElementById('dp-named-drop').click(); d.step(1/60,2); return { bag:M.bag().length-bag0, floor:d.loot.length-floor0 }; });
const hall=await drop();
check("in the hall, Drop here still drops the piece on the floor (not into the bag)",hall.floor===1&&hall.bag===0,JSON.stringify(hall));
await page.evaluate(()=>{ window.__realOpen=window.__hideout.isOpen; window.__hideout.isOpen=()=>true; });   // the hideout's own page is not served here: the panel only asks whether it is open
const hide=await drop();
check("in the hideout, Drop here puts the piece straight into the bag the hideout shows, and nothing lands on the hall floor",hide.bag===1&&hide.floor===0,JSON.stringify(hide));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
