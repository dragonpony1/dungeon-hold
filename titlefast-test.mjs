// ===== THE TITLE SONG DOES NOT WAIT FOR THE HALL'S DOWNLOADS (build 579; 40-music.js musFetch, 40b-titlemusic.js). Matt: "dang happened again brand new browser and i cant hear it".
// A fresh browser on a busy line: every music fetch waited for the hall's first tier of downloads (models, pictures), so the title stayed silent -- 15 s and counting in this test before the fix.
// Checked: with every model and picture held back 25 s, the title song plays within a few seconds of the first click, the strip saying LOADING SONG… meanwhile.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8874,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const p=await (await browser.newContext({viewport:{width:1200,height:800}})).newPage();
let held=0; await p.route(/\.(glb|glb\.txt|webp|jpg|png)(\?|$)/,async r=>{ held++; await new Promise(res=>setTimeout(res,25000)); r.continue().catch(()=>{}); });
await p.goto("http://127.0.0.1:8874/",{waitUntil:"domcontentloaded",timeout:90000}); await p.waitForFunction(()=>window.__titlemusic&&window.__mus,null,{timeout:90000});
await p.mouse.click(30,780); const t0=Date.now(); let s=null;
for(let i=0;i<40;i++){ s=await p.evaluate(()=>({ st:window.__mus.state(), strip:(document.getElementById('jukebox')||{}).textContent })); if(s.st.playing&&/^title/.test(s.st.track)) break; await p.waitForTimeout(250); }
const secs=(Date.now()-t0)/1000;
check("with the hall's downloads held back, the title song still plays within a few seconds of the first click",held>5&&s.st.playing&&/^title/.test(s.st.track)&&secs<6,JSON.stringify({ held, secs:+secs.toFixed(1), track:s.st.track }));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
