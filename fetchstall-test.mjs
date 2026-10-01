// ===== A DOWNLOAD THAT HANGS IS ASKED FOR AGAIN (build 409; game.js FETCH_MS / fetchTimed, 11-loadbar.js). Matt: "he's in wave 5 and it bogged way down and says 4 assets and the 4 assets won't come in".
// A test page shortens the limit (?fetchms=3000). The first request for the Heartroot model is held open and never answered (a dropped connection); checked: while it hangs the counter can name it,
// past the limit it is cancelled and fetched again, the counter clears, and the game carries on; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8996,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:700}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
let asks=0, held=null;
await page.route(/heartroot[^/]*\.glb/,route=>{ asks++; if(asks===1){ held=route; return; } route.continue(); });   // the first one: never answered
await page.goto("http://127.0.0.1:8996/?silent&nogate&fetchms=3000",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__loadctr,null,{timeout:120000});
let named=[]; for(let i=0;i<30&&asks<2;i++){ if(!named.length) named=await page.evaluate(()=>window.__loadctr.stuckNames()); await sleep(500); }
const A={ asks, named };
let clear=false; for(let i=0;i<60&&!clear;i++){ clear=await page.evaluate(()=>!window.__loadctr.busy()); if(!clear) await sleep(500); }
check("the hung download is named while it waits, cancelled past the limit and asked for again",A.asks>=2&&A.named.some(n=>/heartroot/.test(n)),JSON.stringify(A));
check("...and the asset counter clears (nothing left waiting)",clear,JSON.stringify({clear,asks}));
check("no page errors",errors.filter(e=>!/abort/i.test(e)).length===0,JSON.stringify(errors.slice(0,3)));
try{ if(held) await held.abort(); }catch(e){}
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
