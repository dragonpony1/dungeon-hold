// ===== YOUR INVENTORY TRAVELS WITH YOU (hideout build 54). Matt: "we shouldnt have to move gear into that little box to bring back to the hall. if its in our inventory it travels with us." Stepping through the hideout's portal
// takes every piece of gear in the hotbar, the bag and the waiting list back to the hall (into the hero's bag), leaves furniture and the rest alone, and the "Send to the hall" box is gone from the I panel.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8900);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","1"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8900/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__hideout&&window.__meta,null,{timeout:120000});
await page.evaluate(()=>{ window.__meta.reset&&window.__meta.reset(); window.__dd.start(); window.__dd.step(1/60,20); window.__dd.setHero(30,30); window.__hideout.open(); });
let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof usePortal==="function"&&typeof sendInventoryToHall==="function"&&typeof namedRecord==="function"&&typeof SAVE!=="undefined"&&document.getElementById("invSendWrap"),null,{timeout:120000});
const before=await page.evaluate(()=>window.__meta.bag().length);
const setup=await f.evaluate(()=>{ const named=namedRecord("weapon"), armor=setPieceRecord("armor"), amulet=setPieceRecord("amulet"), extra=setPieceRecord("trinket");
  SAVE.hotbar[0]={kind:"forged",rec:named}; SAVE.bag[0]={kind:"forged",rec:armor}; SAVE.bag[1]={kind:"forged",rec:extra}; SAVE.gear.push(amulet);
  const furn=SAVE.hotbar.filter(v=>typeof v==="string").length+SAVE.bag.filter(v=>typeof v==="string").length; openGearPanel(); const box=getComputedStyle(document.getElementById("invSendWrap")).display; closeGearPanel&&0;
  return { names:[named.name,armor.name,extra.name,amulet.name], furn, box }; });
check("the I panel no longer offers a 'Send to the hall' box",setup.box==="none",JSON.stringify(setup));
await f.evaluate(()=>{ try{ usePortal(); }catch(e){} }).catch(()=>{}); await sleep(1500);
const after=await page.evaluate(()=>{ const bag=window.__meta.bag(); return { n:bag.length, names:bag.map(b=>b.name), hideoutOpen:window.__hideout.isOpen() }; });
check("stepping through the portal put all four pieces (hotbar, two in the bag, one on the waiting list) into the hero's bag in the hall",after.n-before===4&&setup.names.every(n=>after.names.includes(n)),JSON.stringify({before,after,want:setup.names}));
const saved=await page.evaluate(()=>{ const o=JSON.parse(localStorage.getItem("dd_hideout_save_v2")||"{}"); const gear=a=>(a||[]).filter(v=>v&&typeof v==="object"&&v.rec).length; return { hotbarGear:gear(o.hotbar), bagGear:gear(o.bag), waiting:(o.gear||[]).length, furniture:[...(o.hotbar||[]),...(o.bag||[])].filter(v=>typeof v==="string").length, ret:JSON.parse(localStorage.getItem("dd_gear_return")||"[]").length }; });
check("the hideout keeps nothing of it (no gear left in its hotbar, bag or waiting list), its furniture is untouched, and the hand-over key is emptied by the game",saved.hotbarGear===0&&saved.bagGear===0&&saved.waiting===0&&saved.furniture>=setup.furn&&saved.ret===0,JSON.stringify({saved,furn:setup.furn}));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
