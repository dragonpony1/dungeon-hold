// ===== ONE BAG (game build 325 + hideout build 72). Matt: "the main bag needs to be portable to the hideout, iam not sure why we've made two seperate bags". Checked: stepping through the
// portal keeps every loose piece in your bag (no scrap); in the hideout the game's bag is your gear -- the I panel shows it, a forged piece lands in it, the trade panel lists it; a piece
// clicked onto the hotbar (for display) leaves the bag and comes back to it when you leave; gear already sitting in the hideout's own bag moves into your bag; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8979,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8979/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__hideout&&window.__hideout.pass&&window.__tavern,null,{timeout:120000});
const a=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} M.reset(); d.start(); d.step(1/60,10); const ids=[];
  for(const [r,s] of [[0,'weapon'],[1,'charm'],[2,'amulet'],[3,'armor']]){ const it=d.rollItem(r,s,2); it.rarity=r; it.name='Plain '+s; M.giveItem(it); it.locked=false; ids.push(it.id); }
  localStorage.setItem('dd_gear_bag',JSON.stringify({common:0,uncommon:0,rare:0,epic:0,legendary:0})); M.save(); window.__ids=ids; d.setHero(30,30); window.__hideout.pass();
  const cart=JSON.parse(localStorage.getItem('dd_gear_bag')); return { bag:M.bag().length, scrapped:cart.common+cart.uncommon+cart.rare+(cart.epic||0)+cart.legendary }; });
check("stepping through the portal keeps every loose piece in your bag -- nothing scrapped",a.bag===4&&a.scrapped===0,JSON.stringify(a));
let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>window.__onebag&&typeof openGearPanel==='function'&&typeof setPieceRecord==='function',null,{timeout:120000}); await sleep(200);
const b=await f.evaluate(()=>{ openGearPanel(); const shown=document.querySelectorAll('#invGame .islot:not(.empty)').length; return { on:window.__onebag.on(), gear:window.__onebag.gear(), shown, title:document.getElementById('invBagTitle').textContent, trade:window.__onebag.tradeArr('game') }; });
check("in the hideout the game's bag is your gear: the I panel shows all 4 pieces (the room's own bag is for furniture) and the trade panel lists them",b.on&&b.gear===4&&b.shown===4&&/furniture/.test(b.title)&&b.trade===4,JSON.stringify(b));
const c=await f.evaluate(()=>{ const rec=setPieceRecord('weapon'); const ok=window.__onebag.give({kind:'forged',rec}); return { ok, gear:window.__onebag.gear(), roomBag:window.__onebag.bagGear() }; });
const c2=await page.evaluate(()=>window.__meta.bag().length);
check("a piece the Forge makes lands in your bag (the game's), not the room's",c.ok&&c.gear===5&&c.roomBag===0&&c2===5,JSON.stringify({c,gameBag:c2}));
const d=await f.evaluate(()=>{ window.__onebag.toHotbar(0); return { gear:window.__onebag.gear(), hot:window.__onebag.hotbarGear() }; });
check("a piece clicked onto the hotbar (to put on display) leaves the bag for the hotbar",d.gear===4&&d.hot===1,JSON.stringify(d));
const e=await f.evaluate(()=>{ SAVE.bag[4]={kind:'carried',rec:{id:'oldpiece1',name:'Old Hideout Blade',slot:'weapon',rarity:2,lvl:3,tier:1,stats:{dmg:4},value:12,score:6}}; writeSave(); const n=oneBagMigrate(); return { n, gear:window.__onebag.gear(), roomBag:window.__onebag.bagGear() }; });
check("gear already sitting in the hideout's own bag moves into your bag",e.n===1&&e.gear===5&&e.roomBag===0,JSON.stringify(e));
await page.evaluate(()=>window.__hideout.close()); await sleep(600);
const g=await page.evaluate(()=>({ bag:window.__meta.bag().length, back:window.__meta.bag().some(x=>x.id===window.__ids[0]) }));
check("leaving the hideout, the piece on the hotbar comes back to your bag -- all 6 pieces with you in the hall",g.bag===6&&g.back,JSON.stringify(g));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
