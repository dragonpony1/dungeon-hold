import { chromium } from "playwright"; import { serve } from "./serve.mjs";
// build 223: a full bag never sells a named mythic / mythic / rarity-5 piece for gold (Matt: Subterfuge "drops in the world but cant equip and
// doesnt show up in hideout" -- it was being auto-sold the moment he walked over it). It sells your cheapest unlocked ordinary piece instead;
// with nothing of that kind to sell, the piece stays on the floor with a "make room" message until there is room.
const server=await serve(8875);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
async function fresh(){ const ctx=await browser.newContext(); const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e))); await page.goto("http://127.0.0.1:8875/?silent&nogate"); await page.waitForFunction(()=>window.__dd&&window.__mythic&&window.__meta,null,{timeout:60000});
  await page.evaluate(()=>{ const d=window.__dd; window.__meta.reset&&window.__meta.reset(); d.start(); d.step(1/60,20); }); return page; }
const fill=(page,lockAll)=>page.evaluate(lockAll=>{ const M=window.__meta, d=window.__dd; let n=0; while(!M.bagFull()&&n<200){ const it=d.rollItem(0,"weapon",1); it.value=5+n; it.id="junk"+n; if(M.giveItem(it)) n++; else break; } if(lockAll) for(const b of M.bag()) M.toggleLock(b.id); return {bag:M.bag().length,full:M.bagFull()}; },lockAll);
const walkOver=page=>page.evaluate(async()=>{ const d=window.__dd, M=window.__meta; const it=window.__mythic.normalize({tier:"named",named:"subterfuge"}); const gold0=M.gold&&M.gold(); const l=d.dropLoot(it,d.hero.x+4.5,d.hero.z,true); d.step(1/60,40); d.setHero(l.x,l.z); for(let i=0;i<40;i++) d.step(1/60,5);
  return {id:it.id,inBag:M.bag().some(b=>b.named==="subterfuge"),onFloor:d.loot.some(x=>x.it&&x.it.named==="subterfuge"),bagLen:M.bag().length,toast:document.getElementById("toast").textContent,gold0,gold1:M.gold&&M.gold()}; });
// 1) a full bag of ordinary pieces: the cheapest goes, Subterfuge comes in
{ const page=await fresh(); const f=await fill(page,false); const r=await walkOver(page);
  check("full bag of ordinary pieces: walking over Subterfuge bags it (the cheapest ordinary piece is sold to make room, and the message says so)",f.full&&r.inBag&&!r.onFloor&&r.bagLen===f.bag&&/sold junk0 .*to make room for Subterfuge|sold .* to make room/.test(r.toast)&&(r.gold1===undefined||r.gold1>=r.gold0),JSON.stringify({full:f.full,inBag:r.inBag,bagLen:r.bagLen,toast:r.toast}));
  const eq=await page.evaluate(id=>{ const M=window.__meta; return {ok:M.equip(id),worn:(window.__dd.gear().weapon||{}).name}; },r.id); check("...and it equips",eq.ok&&eq.worn==="Subterfuge",JSON.stringify(eq)); await page.context().close(); }
// 2) a full bag with every piece locked: nothing can be sold, so Subterfuge waits on the floor -- and is picked up the moment there is room
{ const page=await fresh(); await fill(page,true); const r=await walkOver(page);
  check("full bag, every piece locked: Subterfuge is NOT sold -- it stays on the floor and the game says to make room",!r.inBag&&r.onFloor&&/make room/i.test(r.toast),JSON.stringify({inBag:r.inBag,onFloor:r.onFloor,toast:r.toast}));
  const later=await page.evaluate(()=>{ const M=window.__meta, d=window.__dd; const b=M.bag()[0]; M.toggleLock(b.id); M.sell(b.id); d.step(1/60,10); for(let i=0;i<40;i++) d.step(1/60,5); return {inBag:M.bag().some(x=>x.named==="subterfuge"),onFloor:d.loot.some(x=>x.it&&x.it.named==="subterfuge")}; });
  check("...and once you make room it is picked up",later.inBag&&!later.onFloor,JSON.stringify(later)); await page.context().close(); }
// 3) the ordinary rules are unchanged: a full bag still sells an ordinary drop
{ const page=await fresh(); await fill(page,false); const r=await page.evaluate(async()=>{ const d=window.__dd, M=window.__meta; const it=d.rollItem(0,"weapon",1); it.id="plain1"; it.value=77; const g0=M.gold(); const l=d.dropLoot(it,d.hero.x+4.5,d.hero.z,true); d.step(1/60,40); d.setHero(l.x,l.z); for(let i=0;i<40;i++) d.step(1/60,5); return {inBag:M.bag().some(b=>b.id==="plain1"),gained:M.gold()-g0,toast:document.getElementById("toast").textContent}; });
  check("an ordinary drop into a full bag is still sold for gold, as before",!r.inBag&&r.gained>0&&/Bag is full/.test(r.toast),JSON.stringify(r)); await page.context().close(); }
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
