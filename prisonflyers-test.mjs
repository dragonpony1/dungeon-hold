// ===== MOTHS AND WRAITHS IN THE DEEP PRISON (build 425; 95t-moth.js, 95s-wraith.js). Matt: "add moths and wraiths to map 6 mobs ... come in on wave 2 or 3".
// Checked: wave 1 has neither; moths from wave 2 (3, then 4, 4, 5, 6); the wraith from wave 3 (two in waves 5 and 6); the final stand (wave 7) keeps its fixed list; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9009,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext()).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
await page.goto("http://127.0.0.1:9009/?silent&nogate&map=5",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__dd.waveComp&&window.__moth&&window.__wraith,null,{timeout:120000});
const W=await page.evaluate(()=>{ const d=window.__dd, M=d.map(); const out={ id:M.id, moth:[], wraith:[] }; for(let w=1;w<=7;w++){ const q=d.waveComp(M.wbase+w).q; out.moth.push(q.filter(x=>x.kind==='moth').length); out.wraith.push(q.filter(x=>x.kind==='wraith').length); } return out; });
check("the Deep Prison: moths from wave 2 (3, 4, 4, 5, 6), the wraith from wave 3 (two in waves 5 and 6), none in wave 1 or the final stand",W.id==='prison'&&W.moth.join()==='0,3,4,4,5,6,0'&&W.wraith.join()==='0,0,1,1,2,2,0',JSON.stringify(W));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
