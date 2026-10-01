// ===== THE ARCHHAG LOADS ONCE (build 413; parts/staging/95f-archhag.js load()). Matt: "on wave 6 there is a broken problem, it's the 4 assets that are hung causing the game to slide show".
// A comment had swallowed load()'s "already loaded / already loading" returns since build 330, so from wave 5 in the Cloister every frame started her four files (15 MB) again and parsed them.
// Checked: from wave 5 her four files are each asked for ONCE however many frames pass, the asset counter clears, and once loaded more frames start nothing new; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9001,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:700}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
const asks={}; page.on("request",r=>{ const m=r.url().match(/archhag-(walk|cast|idle|death)/); if(m) asks[m[1]]=(asks[m[1]]||0)+1; });
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9001/?silent&nogate&map=2",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__archhag&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); window.__freeze=true; d.S.wave=5; d.S.crystal=1e9; });
for(let i=0;i<60;i++){ await page.evaluate(()=>{ for(let k=0;k<10;k++) window.__dd.step(1/60,1); }); await sleep(100); }   // 600 frames over ~6 s while her files come down
let loaded=false; for(let i=0;i<60&&!loaded;i++){ loaded=await page.evaluate(()=>window.__archhag.loaded()); if(!loaded){ await page.evaluate(()=>window.__dd.step(1/60,5)); await sleep(250); } }
const a1=JSON.parse(JSON.stringify(asks));
for(let i=0;i<30;i++){ await page.evaluate(()=>{ for(let k=0;k<10;k++) window.__dd.step(1/60,1); }); await sleep(50); }
let clear=false; for(let i=0;i<40&&!clear;i++){ clear=await page.evaluate(()=>!window.__loadctr.busy()); if(!clear) await sleep(250); }
check("from wave 5 her four files are each asked for once, however many frames pass",["walk","cast","idle","death"].every(k=>a1[k]===1),JSON.stringify(a1));
check("she loads, and 300 more frames ask for nothing new",loaded&&JSON.stringify(asks)===JSON.stringify(a1),JSON.stringify({loaded,asks}));
check("the asset counter clears",clear,JSON.stringify({clear}));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
