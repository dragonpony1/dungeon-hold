// ===== HOLD IT, THEN PUT IT ON THE TABLE (hideout build 76). Matt: "I need to be able to come from the hall with a sweet sword and I need to be able to put that sword on the table". Checked with a
// FULL hotbar (nine furniture pieces) and a rare sword in the bag: one click on it in "Your gear" holds it (a furniture piece steps into the room's bag to make room, the panel closes, its slot is selected, the
// ghost is in the hands), a click places it (the server call is stubbed here: nothing lands on the real shared table) and it is gone from every bag; a WORN sword is listed too and one click takes it off and
// holds it; a piece not put down comes back to the bag when you leave; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8991,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
const posts=[]; await page.route("**/api/hideout/gear",async r=>{ const req=r.request(); const H={"access-control-allow-origin":"*"}; if(req.method()==="POST"){ const b=JSON.parse(req.postData()||"{}"); posts.push(b); await r.fulfill({status:200,contentType:"application/json",headers:H,body:JSON.stringify({item:Object.assign({id:"t"+posts.length,at:Date.now()},b)})}); } else await r.fulfill({status:200,contentType:"application/json",headers:H,body:JSON.stringify({items:[]})}); });
await page.goto("http://127.0.0.1:8991/?silent&ownweapons&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__hideout,null,{timeout:120000});
const made=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} M.reset(); d.resetGear(); d.start(); d.step(1/60,5);
  const mk=(r)=>{ const it=d.rollItem(r,'weapon',6); it.rarity=r; it.name='Sweet Sword '+r; return it; }; const bagSword=mk(3), wornSword=mk(2); M.giveItem(wornSword); M.equip(wornSword.id); M.giveItem(bagSword); window.__hideout.open();
  return { bagId:bagSword.id, wornId:wornSword.id, worn:!!(d.gear().weapon&&d.gear().weapon.id===wornSword.id) }; });
let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>window.__onebag&&typeof holdToHotbar==='function'&&typeof updateDropGhost==='function',null,{timeout:120000}); await sleep(400);
const a=await f.evaluate(()=>{ for(let i=0;i<SAVE.hotbar.length;i++) if(!SAVE.hotbar[i]) SAVE.hotbar[i]='table_stools'; writeSave(); openGearPanel(); return { hotFull:SAVE.hotbar.every(Boolean), gear:document.querySelectorAll('#invGame .islot:not(.empty)').length, worn:document.querySelectorAll('#invWorn .islot:not(.empty)').length }; });
check("in the hideout's I panel, with a FULL hotbar: the sword in your bag is listed under Your gear, and the sword you wear is listed under What you are wearing",a.hotFull&&a.gear===1&&a.worn===1,JSON.stringify(a));
const b=await f.evaluate(()=>{ const bagBefore=SAVE.bag.filter(Boolean).length; window.__onebag.toHotbar(0); return { panelShut:document.getElementById('gearWrap').style.display==='none', holding:window.__onebag.holding(), hotGear:window.__onebag.hotbarGear(), hotFull:SAVE.hotbar.every(Boolean), bagMoved:SAVE.bag.filter(Boolean).length-bagBefore }; });
check("one click on the bag sword HOLDS it: the panel closes, its hotbar slot is selected (a furniture piece stepped into the room's bag to make room)",b.panelShut&&b.holding.slot!==null&&!!b.holding.dropId&&b.hotGear===1&&b.hotFull&&b.bagMoved===1,JSON.stringify(b));
const c=await f.evaluate(async()=>{ active=true; updateDropGhost(); const ghost=!!dropGhost; await commitDropPlacement(); return { ghost, handsEmpty:window.__onebag.hotbarGear()===0, worldGear:worldGear.size }; }); await sleep(300);
const gameBagHas=await page.evaluate(id=>window.__meta.bag().some(x=>x.id===id),made.bagId);
check("the ghost is in its hands and a click puts it on the table: the server is sent a weapon named Sweet Sword 3, it stands in the room, and it is in no bag any more",c.ghost&&c.handsEmpty&&c.worldGear===1&&posts.length===1&&posts[0].name==='Sweet Sword 3'&&!gameBagHas,JSON.stringify({c,posts:posts.length,name:posts[0]&&posts[0].name,gameBagHas}));
const d=await f.evaluate(()=>{ openGearPanel(); const wornBefore=window.__onebag.worn(); window.__onebag.wornToHotbar('weapon'); return { wornBefore, wornAfter:window.__onebag.worn(), holding:window.__onebag.holding(), hotGear:window.__onebag.hotbarGear() }; });
const weaponOff=await page.evaluate(()=>!window.__dd.gear().weapon);
check("the sword you WEAR: one click takes it off you and holds it (your weapon slot is empty, the piece is in your hands)",d.wornBefore===1&&d.wornAfter===0&&!!d.holding.dropId&&d.hotGear===1&&weaponOff,JSON.stringify({d,weaponOff}));
await page.evaluate(()=>window.__hideout.close()); await sleep(600);
const e=await page.evaluate(id=>({ bagHas:window.__meta.bag().some(x=>x.id===id), n:window.__meta.bag().length }),made.wornId);
check("not put down, it comes back to your bag when you leave",e.bagHas,JSON.stringify(e));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
