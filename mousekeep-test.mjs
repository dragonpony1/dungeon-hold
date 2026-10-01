// ===== KEEP THE MOUSE IN THE HALL (build 398; parts/staging/97f-mousekeep.js). Matt: "we need to do something to keep the mouse on screen ... when he came back from the hideout his pointer was on a different monitor".
// A test browser cannot really capture the mouse, so the canvas's request is stood in for (it records each ask, and either takes the lock or is refused). Checked: back from the hideout, the hall asks for the mouse at once;
// closing the Tavern does too; a PAUSED card flashed up by the hideout letting go is cleared on the way back in; if the browser refuses, the PAUSED card comes up (RESUME is one click); nothing asks while a menu is still up; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8989,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:700}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:8989/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__mousekeep&&window.__hideout&&window.__tavern&&window.__pause&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); try{ if(window.__lesson&&window.__lesson.on()) window.__lesson.close(); }catch(e){}
  const c=document.querySelector('canvas'); window.__asks=0; window.__grant=true; window.__fakeLock=null;
  Object.defineProperty(document,'pointerLockElement',{configurable:true,get:()=>window.__fakeLock});
  for(const cv of document.querySelectorAll('canvas')) cv.requestPointerLock=function(){ window.__asks++; if(window.__grant){ window.__fakeLock=this; document.dispatchEvent(new Event('pointerlockchange')); } };
  window.__let=()=>{ window.__fakeLock=null; };   // the mouse let go (a menu, the hideout)
  let open=false; window.__realHideoutOpen=window.__hideout.isOpen; window.__hideout.isOpen=()=>open; window.__setHideout=v=>{ open=v; }; });
await page.waitForFunction(()=>{ try{ if(window.__lesson&&window.__lesson.on&&window.__lesson.on()) window.__lesson.close(); }catch(e){} return window.__mousekeep.info().want||(window.__fakeLock&&!window.__mousekeep.info().want&&false); },null,{timeout:20000}).catch(()=>{});   /* the hall clear of cards first (a welcome card up = rightly no grab) */
const A=await page.evaluate(async()=>{ window.__let(); window.__asks=0; window.__setHideout(true); await new Promise(r=>setTimeout(r,200)); const during=window.__asks; window.__setHideout(false); await new Promise(r=>setTimeout(r,250)); return { during, after:window.__asks, locked:window.__mousekeep.info().locked, pause:window.__pause.isOpen(), info:window.__mousekeep.info(), screens:[...document.querySelectorAll('.screen:not(.hide)')].map(e=>e.id), open:window.__meta.isOpen() }; });
check("back from the hideout the hall takes the mouse at once (and asks nothing while you are still in there)",A.during===0&&A.after>=1&&A.locked&&!A.pause,JSON.stringify(A));
const B=await page.evaluate(async()=>{ window.__let(); window.__asks=0; window.__tavern.open(); await new Promise(r=>setTimeout(r,200)); const during=window.__asks; window.__tavern.close(); await new Promise(r=>setTimeout(r,250)); return { during, after:window.__asks, locked:window.__mousekeep.info().locked }; });
check("closing the Tavern hands the mouse straight back to the hall",B.during===0&&B.after>=1&&B.locked,JSON.stringify(B));
const C=await page.evaluate(async()=>{ window.__let(); window.__asks=0; window.__setHideout(true); await new Promise(r=>setTimeout(r,120)); window.__grant=false; window.__setHideout(false); await new Promise(r=>setTimeout(r,60)); window.__pause.open(); const flashed=window.__pause.isOpen(); window.__grant=true; await new Promise(r=>setTimeout(r,500)); return { flashed, pause:window.__pause.isOpen(), locked:window.__mousekeep.info().locked }; });
check("a PAUSED card flashed up as the hideout lets go of the mouse is cleared on the way back in, and the hall has the mouse",C.flashed&&!C.pause&&C.locked,JSON.stringify(C));
const D=await page.evaluate(async()=>{ window.__let(); window.__grant=false; window.__asks=0; window.__setHideout(true); await new Promise(r=>setTimeout(r,120)); window.__setHideout(false); await new Promise(r=>setTimeout(r,1200)); const r={ asks:window.__asks, pause:window.__pause.isOpen(), fallback:window.__mousekeep.info().fallback }; window.__grant=true; return r; });
check("if the browser refuses, it tries a few times and then the PAUSED card comes up (one click on RESUME and you are in)",D.asks>=3&&D.pause&&D.fallback>=1,JSON.stringify(D));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
