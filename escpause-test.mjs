// ===== ESC NEVER LANDS ON THE GAME MENU FROM A MENU (build 423; parts/staging/97-pause.js). Matt: "while in his bag in the hideout he tries to esc out and it takes him to the gui that takes you to title screen
// -- esc should just take you to the clean open hideout or hall or wherever you are".
// Checked: in the hideout with the bag open, Esc closes the bag and leaves the hideout open with no game menu; a second Esc there opens no game menu; in the hall with the bag open, Esc closes it and no game menu
// comes up (even a stray Escape right after); in the hall with nothing open, Esc still opens the game menu; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9008,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:700}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9008/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__hideout&&window.__hideoutbag&&window.__tavern&&window.__pause,null,{timeout:120000});
const st=()=>page.evaluate(()=>({ tavern:window.__tavern.isOpen(), pause:window.__pause.isOpen(), hideout:window.__hideout.isOpen() }));
const esc=()=>page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape',bubbles:true,cancelable:true})));
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); d.setHero(30,30); window.__hideout.open(); });
let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof openHallBag==='function'&&typeof BAG==='object',null,{timeout:120000}); await f.evaluate(()=>{ Object.assign(BAG,loadBag()); openHallBag(); });
await page.waitForFunction(()=>window.__tavern.isOpen(),null,{timeout:10000});
await esc(); await sleep(150); const a1=await st(); await esc(); await sleep(150); const a2=await st();
check("in the hideout with the bag open, Esc closes the bag and leaves you in the hideout -- no game menu (and a second Esc opens none either)",!a1.tavern&&!a1.pause&&a1.hideout&&!a2.pause&&a2.hideout,JSON.stringify({a1,a2}));
await page.evaluate(()=>window.__hideout.close()); await sleep(900); await page.evaluate(()=>{ if(window.__pause.isOpen()) window.__pause.close(false); window.__tavern.open(); }); await sleep(300);   /* the bag open a moment, as a player has it */
await esc(); await sleep(50); await esc(); await sleep(150); const b=await st();
check("in the hall with the bag open, Esc closes it and no game menu comes up, even with a stray Escape right after",!b.tavern&&!b.pause,JSON.stringify(b));
await sleep(800); await esc(); await sleep(150); const c=await st();
check("in the hall with nothing open, Esc still opens the game menu",c.pause===true,JSON.stringify(c));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
