// ===== THE BAG FROM THE FORGE (hideout build 83, game build 443). Matt: "i need to be able to look in my bag from the forge gui".
// Checked: the forge has a Bag button; it (and B) opens the game's bag over the forge; closing the bag comes straight back to the forge (still open, no "click to enter" card over it); no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8984,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1600,height:900}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8984/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__hideout&&window.__hideoutbag&&window.__tavern,null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); window.__meta.giveItem(d.rollItem(2,'weapon',5)); window.__hideout.open(); });
let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof openForge==='function'&&!!document.getElementById('forgeBagBtn'),null,{timeout:120000});
await f.evaluate(()=>{ document.getElementById('start').style.display='none'; openForge(); });
await f.click('#forgeBagBtn'); await page.waitForFunction(()=>window.__hideoutbag.fromHideout(),null,{timeout:5000}).catch(()=>{});
const a=await page.evaluate(()=>({ bag:window.__tavern.isOpen(), from:window.__hideoutbag.fromHideout(), mat:!!document.querySelector('#tv-bag .tv-smat') })); const fo=await f.evaluate(()=>document.getElementById('forgeWrap').style.display);
check("the forge's Bag button opens your bag (the set view) over the forge",a.bag&&a.from&&a.mat&&fo==='flex',JSON.stringify({a,fo}));
await page.evaluate(()=>window.__tavern.close()); await sleep(400);
const b=await f.evaluate(()=>({ forge:document.getElementById('forgeWrap').style.display, start:document.getElementById('start').style.display }));
check("closing the bag comes straight back to the forge (no 'click to enter' card over it)",b.forge==='flex'&&b.start!=='flex',JSON.stringify(b));
await f.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyB',key:'b'}))); await sleep(400);
const c=await page.evaluate(()=>window.__tavern.isOpen()); check("B in the forge opens it too",c,String(c)); await page.evaluate(()=>window.__tavern.close());
// build 444 / hideout 84 (Matt: Esc from the bag, forge, cauldron or anything must leave you in the open room, not the big entry card)
await f.evaluate(()=>{ entered=true; document.getElementById('start').style.display='none'; openForge(); }); await sleep(200);
await f.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}))); await sleep(400);
const d=await f.evaluate(()=>({ forge:document.getElementById('forgeWrap').style.display, start:document.getElementById('start').style.display, sign:document.getElementById('clickPlay').style.display }));
check('Esc out of the forge: the forge closes, the room stays in view with the small CLICK TO PLAY sign (no big entry card)',d.forge==='none'&&d.start!=='flex'&&d.sign==='block',JSON.stringify(d));
await f.evaluate(()=>{ openCauldron&&openCauldron(); }); await sleep(200); await f.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}))); await sleep(400);
const e2=await f.evaluate(()=>({ c:document.getElementById('cauldronWrap').style.display, start:document.getElementById('start').style.display, sign:document.getElementById('clickPlay').style.display }));
check('...and the same out of the cauldron',e2.c==='none'&&e2.start!=='flex'&&e2.sign==='block',JSON.stringify(e2));
await f.evaluate(()=>openHallBag()); await sleep(400); const sg=await f.evaluate(()=>document.getElementById('clickPlay').style.display); await page.evaluate(()=>window.__tavern.close()); await sleep(500);
const g=await f.evaluate(()=>({ start:document.getElementById('start').style.display, sign:document.getElementById('clickPlay').style.display }));
check('...and out of the bag (the sign hides while the bag is up, comes back after)',sg==='none'&&g.start!=='flex'&&g.sign==='block',JSON.stringify({sg,g}));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
