// ===== THE HIDEOUT CHEST: 100 SLOTS AND SHIFT-CLICK (hideout build 79; parts/hideout/index.html). Matt: "the chest in the hideout you can buy needs to hold about 100 items" / "transferring items from bag to
// chest in the hideout needs a clean up -- either drag or better would be a shift click".
// Checked: a chest holds 100 (a 25-slot chest already placed grows to 100); with it open a shift-click on a bag item sends it to the chest's first free slot, and a shift-click on a chest item back to the bag's;
// a plain click still starts a drag (moves nothing by itself); no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9006,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:9006/hideout/index.html",{timeout:120000}); await page.waitForFunction(()=>typeof SAVE!=="undefined"&&typeof openChest==="function"&&typeof CHEST_SIZE!=="undefined",null,{timeout:120000});
const R=await page.evaluate(async()=>{ const out={ size:CHEST_SIZE };
  SAVE.placed.push({ gid:'chest', pid:'tchest', store:padSlots([],25) }); openChest({ pid:'tchest' }); const rec=SAVE.placed.find(p=>p.pid==='tchest'); out.grown=rec.store.length; out.cells=document.querySelectorAll('#chestSlots .islot').length;
  const id=Object.keys(typeof CATALOG!=='undefined'?CATALOG:{torch_sconce:1}).find(k=>k!=='chest')||'torch_sconce'; SAVE.bag[0]=id; refreshSlotViews();
  const press=(el,shift)=>el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,shiftKey:!!shift,clientX:10,clientY:10}));
  const bagSlot=()=>document.querySelectorAll('#chestBag .islot')[0];
  press(bagSlot(),false); window.dispatchEvent(new PointerEvent('pointerup',{clientX:2,clientY:2})); out.plain={ bag:SAVE.bag[0], chest:rec.store[0] };
  press(bagSlot(),true); out.toChest={ bag:SAVE.bag[0], chest:rec.store[0] };
  const chestSlot=document.querySelectorAll('#chestSlots .islot')[0]; press(chestSlot,true); out.back={ bag:SAVE.bag[0], chest:rec.store[0] }; out.id=id; closeChest(); return out; });
check("the chest holds 100, and one already placed with 25 grows to 100 (a 10-wide grid)",R.size===100&&R.grown===100&&R.cells===100,JSON.stringify(R));
check("a plain click on a bag item moves nothing by itself (it is the start of a drag)",R.plain.bag===R.id&&R.plain.chest===null,JSON.stringify(R.plain));
check("shift-click on a bag item sends it into the chest; shift-click on it in the chest sends it back to the bag",R.toChest.bag===null&&R.toChest.chest===R.id&&R.back.bag===R.id&&R.back.chest===null,JSON.stringify({toChest:R.toChest,back:R.back}));
const W=await page.evaluate(async()=>{ const rec={ id:'worn1', slot:'weapon', rarity:2, name:'Keen Broadsword of Fury', stats:{ dmg:4, spd:9 }, lvl:4, tier:2 }; wornGear=()=>[{ slot:'weapon', kind:'carried', rec }];   /* the game's worn set, stood in for (the standalone page has no game) */
  SAVE.bag[2]={ kind:'carried', rec:Object.assign({},rec) }; openChest({ pid:'tchest' }); const row=document.querySelectorAll('#chestWorn .islot'); const bagEl=document.querySelectorAll('#chestBag .islot')[2];
  const rec0=SAVE.placed.find(p=>p.pid==='tchest'); const free=rec0.store.indexOf(null); bagEl.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,shiftKey:true})); const stayed=!!(SAVE.bag[2]&&SAVE.bag[2].rec&&SAVE.bag[2].rec.id==='worn1')&&rec0.store[free]===null;
  const r={ wornRow:row.length, rowMarked:row[0]&&row[0].classList.contains('worn')&&!!row[0].querySelector('.wornE'), bagMarked:bagEl.classList.contains('worn'), stayed }; closeChest(); return r; });
check("what you wear shows in the chest panel (a Worn row, gold with an E), and a worn piece in the bag is marked the same and will not go into the chest",W.wornRow===1&&W.rowMarked&&W.bagMarked&&W.stayed,JSON.stringify(W));
check("no page errors",errors.filter(e=>!/fonts\.googleapis|Failed to fetch|NetworkError/i.test(e)).length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
