// ===== THE WARDROBE STORES GEAR, BESIDE THE BAG (game build 447 + hideout build 87). Matt: "when i open the wardrobe i see the gear it has in it and i also see my bag, i can shift click or drag" / "fix the wardrobe".
// Checked: opening the wardrobe in the game opens the bag with THE WARDROBE over it (and the old panel stays shut); shift-click a bag piece -> stored (out of the bag); click the stored piece -> back in the bag;
// drag a bag piece onto the wardrobe -> stored; drag a stored piece onto a hotbar square -> in your hands; stored gear stays through closing and reopening; a reward (armor stand) shows and can be taken; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8986,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1600,height:1400}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8986/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__hideout&&window.__hideoutbag&&window.__tavern,null,{timeout:120000});
const ids=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); const out=[]; for(const sl of ['weapon','armor','charm','amulet']){ const it=d.rollItem(2,sl,5); M.giveItem(it); out.push(it.id); }
  const c=JSON.parse(localStorage.getItem('dd_gear_carried')||'[]'); c.push({id:'reward-stand-void',name:'Void Armor Stand',slot:'armor',rarity:4,tier:5,stats:{},value:0,score:0,model:'armor-stand-void.glb',reward:true,reason:'The Void set, complete',from:'dungeon-hold',carriedAt:Date.now()}); localStorage.setItem('dd_gear_carried',JSON.stringify(c));
  window.__hideout.open(); return out; });
let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof openLocker==='function'&&window.__onebag&&window.__onebag.inv&&window.__onebag.inv.wardrobe,null,{timeout:120000});
await f.evaluate(()=>{ document.getElementById('start').style.display='none'; openLocker(); }); await page.waitForFunction(()=>window.__hideoutbag.wardMode&&window.__hideoutbag.wardMode(),null,{timeout:5000}).catch(()=>{}); await sleep(300);
const a=await page.evaluate(()=>({ ward:!!document.getElementById('tv-ward'), bag:window.__tavern.isOpen(), rewards:document.querySelectorAll('#tv-ward .tv-wr').length })); const oldPanel=await f.evaluate(()=>document.getElementById('lockerWrap').style.display);
check("opening the wardrobe opens your bag with THE WARDROBE over it (the armor stand reward showing); the old panel stays shut",a.ward&&a.bag&&a.rewards===1&&oldPanel!=='flex',JSON.stringify({a,oldPanel}));
await page.click('#tv-bag .tv-bag2 .tv-tile[data-id="'+ids[0]+'"]',{modifiers:['Shift']}); await sleep(300);
let w=await page.evaluate(()=>window.__hideoutbag.ward()); let inBag=await page.evaluate(id=>window.__meta.bag().some(x=>x.id===id),ids[0]);
check("shift-click a bag piece: it goes into the wardrobe (out of the bag)",w.ids.includes(ids[0])&&!inBag,JSON.stringify({w,inBag}));
await page.click('#tv-ward .tv-tile[data-id="'+ids[0]+'"]'); await sleep(300);
w=await page.evaluate(()=>window.__hideoutbag.ward()); inBag=await page.evaluate(id=>window.__meta.bag().some(x=>x.id===id),ids[0]);
check("click the stored piece: back in the bag",!w.ids.includes(ids[0])&&inBag,JSON.stringify({w,inBag}));
await page.dragAndDrop('#tv-bag .tv-bag2 .tv-tile[data-id="'+ids[1]+'"]','#tv-ward'); await sleep(300);
w=await page.evaluate(()=>window.__hideoutbag.ward());
check("drag a bag piece onto the wardrobe: stored",w.ids.includes(ids[1]),JSON.stringify(w));
await page.dragAndDrop('#tv-ward .tv-tile[data-id="'+ids[1]+'"]','#tv-hands .hs[data-hk="hot"][data-hi="2"]'); await sleep(300);
const h=await page.evaluate(()=>window.__hideoutbag.hands()); w=await page.evaluate(()=>window.__hideoutbag.ward());
check("drag a stored piece onto hotbar square 3: it is in your hands",h.hot[2]==='g:'+ids[1]&&!w.ids.includes(ids[1]),JSON.stringify({h,w}));
await page.click('#tv-bag .tv-bag2 .tv-tile[data-id="'+ids[2]+'"]',{modifiers:['Shift']}); await sleep(200); await page.evaluate(()=>window.__tavern.close()); await sleep(300);
await f.evaluate(()=>openLocker()); await sleep(400); w=await page.evaluate(()=>window.__hideoutbag.ward());
check("what is stored stays there through closing and opening again",w.ids.includes(ids[2]),JSON.stringify(w));
await page.click('#tv-ward .tv-wr'); await sleep(300); const fur=await page.evaluate(()=>window.__hideoutbag.hands().fur);
check("the armor stand reward can be taken (it goes to your furniture)",fur>=1,String(fur));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
