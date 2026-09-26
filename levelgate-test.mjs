// ===== THE GEAR LEVEL GATE (96-armory.js) and the training ground. A playtest on map one hit "needs level 2" on the fourth
// Forest piece at hero level 1 while the fifth waited in the hideout's locker, so the starter set could never complete.
// Now: map one has no gate at all; a Forest piece never asks for a level anywhere (a stale req saved in the bag is
// recomputed on load); on a later map the gate still holds for ordinary gear and a refusal explains itself on the
// lesson card; the sheet's red Lv tag follows the same rule.
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path";
const SP=path.dirname(new URL(import.meta.url).pathname); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8933, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];
async function fresh(ctx,url){ const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e))); await p.goto(BASE+"/"+url,{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__meta&&window.__forest,null,{timeout:60000}); return p; }
const ctx=await browser.newContext(); const page=await fresh(ctx,"?silent");   // no ?nogate: the real gate
const one=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; window.__freeze=true; d.start(); d.step(1/60,3);
  const rare=d.rollItem(2,'charm',8); rare.rarity=2; rare.req=M.reqFor(rare); M.giveItem(rare);
  const green=d.rollItem(1,'amulet',8); green.rarity=1; green.name=green.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' of the Forest'; green.req=3; /* stale, as a save from before this build */ M.giveItem(green); M.save();
  return {map:d.map().id,level:M.level(),rareReq:rare.req,rareWear:M.canWear(rare),rareEq:M.equip(rare.id),greenReq:M.reqFor(green),greenId:green.id,lesson:window.__lesson.text()}; });
check("map one, hero level 1: a rare wave-8 charm asks for level 4 on paper but the training ground has no gate — it equips",one.level===1&&one.rareReq===4&&one.rareWear&&one.rareEq===true&&one.map!=='throne',JSON.stringify(one));
check("a Forest piece never asks for a level: reqFor says 1 whatever its level or rarity",one.greenReq===1,JSON.stringify(one));
await page.reload({timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__meta.canWear,null,{timeout:60000});
const reloaded=await page.evaluate(id=>{ const M=window.__meta; const it=M.bag().find(b=>b.id===id); return it&&{req:it.req,wear:M.canWear(it)}; },one.greenId);
check("a stale level saved on a Forest piece (from before this build) is recomputed to 1 on load",reloaded&&reloaded.req===1&&reloaded.wear,JSON.stringify(reloaded));
await ctx.close();
// a later map: the gate holds for ordinary gear and explains itself; a Forest piece still passes
const ctx2=await browser.newContext(); const p2=await fresh(ctx2,"?silent"); await p2.evaluate(()=>{ try{ localStorage.setItem('ddMapsCleared','1'); }catch(e){} });
await p2.goto(BASE+"/?silent&map=1",{timeout:90000}); await p2.waitForFunction(()=>window.__dd&&window.__meta&&window.__lesson&&window.__meta.canWear,null,{timeout:60000});
const two=await p2.evaluate(()=>{ const d=window.__dd, M=window.__meta; window.__freeze=true; d.start(); d.step(1/60,3);
  const rare=d.rollItem(2,'charm',8); rare.rarity=2; rare.req=M.reqFor(rare); M.giveItem(rare);
  const green=d.rollItem(1,'amulet',8); green.rarity=1; green.name=green.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' of the Forest'; green.req=M.reqFor(green); M.giveItem(green);
  const rareEq=M.equip(rare.id); const lesson=window.__lesson.text(), lessonOn=window.__lesson.on(); const greenEq=M.equip(green.id);
  return {map:d.map().id,level:M.level(),rareWear:M.canWear(rare),rareEq,lesson,lessonOn,greenWear:M.canWear(green),greenEq}; });
check("map two, level 1: the rare charm is refused (needs level 4) and the lesson card says why and how levels come",two.map==='throne'&&two.level===1&&!two.rareWear&&two.rareEq===false&&two.lessonOn&&/Needs level 4 — you are level 1/.test(two.lesson)&&/Levels come from kills/.test(two.lesson),JSON.stringify(two));
check("...while the Forest piece still equips there",two.greenWear&&two.greenEq===true,JSON.stringify(two));
await ctx2.close();
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
