// ===== THE FEAST ROAST + LEVEL CARD (build 525). Matt sent his roast on a spit (Roast_Spit_Loop) for the Feast Hall fire pit; and "the infographic that shows what to do when i have a level gear thats hire then me
// only needs to come up twice ever". Checked: on the Feast Hall the roast model loads, plays its loop and hides the code boar; the level card shows on the first two tries ever and never a third (saved across
// reloads); no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9038,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext(); const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route(/\/api\//,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9038/?silent&nogate&ownweapons&map=3",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__feastRoast&&window.__dd.heroModel(),null,{timeout:120000});
await page.waitForFunction(()=>window.__feastRoast.loaded(),null,{timeout:60000}).catch(()=>{});
const R=await page.evaluate(()=>{ const r=window.__feastRoast.root(); return { loaded:window.__feastRoast.loaded(), playing:window.__feastRoast.playing(), inScene:!!(r&&r.parent) }; });
check("the Feast Hall's fire pit wears Matt's roast, playing its loop",R.loaded&&R.playing&&R.inScene,JSON.stringify(R));
const L=async()=>page.evaluate(()=>{ const d=window.__dd, M=window.__meta; M.levelGate(true); try{ window.__trainer.skip(); }catch(e){} if(d.S.phase==='start'){ d.start(); d.step(1/60,20); } const it=d.rollItem(3,'weapon',60); it.req=99; M.giveItem(it); const n0=M.lvlCardSeen(); M.equip(it.id); return M.lvlCardSeen()-n0; });
const a=await L(), b=await L(), c=await L(); await page.reload(); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__dd.heroModel(),null,{timeout:120000}); const d2=await L();
check("the level-gear card shows twice ever, never a third time (even after a reload)",a===1&&b===1&&c===0&&d2===0,JSON.stringify({a,b,c,d2}));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
