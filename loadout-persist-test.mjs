// ===== Persistent per-player loadouts (task queued alongside co-op phase 8): confirms, empirically rather than by
// reading the code, that gold/bag/equipped-gear/skill points already survive a real page reload -- the same
// mechanism a browser tab closing and reopening (or a guest reconnecting later) goes through. ddMeta/ddGear
// (parts/modules/10-meta.js, parts/game.js) save on every change already, independent of co-op networking
// (confirmed separately: nothing in 99-network.js touches localStorage or calls Meta.reset()/resetGear() on
// join) -- this test is the first time that claim is actually exercised end-to-end rather than just read.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const server=await serve(8888);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const ctx=await browser.newContext();
const page=await ctx.newPage();
const errors=[]; page.on("pageerror",e=>errors.push(String(e)));

await page.goto("http://127.0.0.1:8888/?silent&nogate",{timeout:90000});
await page.waitForFunction(()=>window.__dd&&window.__meta,null,{timeout:60000});
await page.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,30); });

// clean slate: wipe any localStorage this fresh profile might already carry, then re-load Meta/gear from that clean state
await page.evaluate(()=>{ Object.keys(localStorage).filter(k=>/^dd/.test(k)).forEach(k=>localStorage.removeItem(k)); window.__meta.reset(); window.__dd.resetGear(); });

const TEST_ITEM={name:'Test Blade of Verifying',slot:'weapon',rarity:3,stats:{dmg:37},value:250};

const before=await page.evaluate(item=>{
  const M=window.__meta;
  M.giveGold(1234);
  M.addXP(500);   // enough to clear level 2 and bank at least one skill point
  const spentOk=M.spend('blade');
  const gaveOk=M.giveItem(item);
  const bagged=M.bag().find(it=>it.name===item.name);
  const equipOk=bagged?M.equip(bagged.id):false;
  return {gold:M.gold(),level:M.level(),bladePts:M.skill('blade'),spentOk,gaveOk,equipOk,
    weapon:window.__dd.gear().weapon?{name:window.__dd.gear().weapon.name,dmg:window.__dd.gear().weapon.stats.dmg}:null,
    bagLen:M.bag().length};
},TEST_ITEM);
check("setup: gold/xp/skill/bag/equip all applied before reload",
  before.gold===1234&&before.level>=2&&before.bladePts===1&&before.spentOk&&before.gaveOk&&before.equipOk&&
  before.weapon&&before.weapon.name===TEST_ITEM.name&&before.weapon.dmg===37,
  JSON.stringify(before));

await page.reload({waitUntil:"load"});
await page.waitForFunction(()=>window.__dd&&window.__meta,null,{timeout:60000});
await page.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); });

const after=await page.evaluate(()=>{
  const M=window.__meta;
  return {gold:M.gold(),level:M.level(),bladePts:M.skill('blade'),
    weapon:window.__dd.gear().weapon?{name:window.__dd.gear().weapon.name,dmg:window.__dd.gear().weapon.stats.dmg}:null,
    heroDmgHasBonus:window.__dd.heroStat('dmg')===37};
});
check("gold survives a real page reload",after.gold===1234,JSON.stringify(after));
check("level (from banked xp) survives a real page reload",after.level===before.level,JSON.stringify(after));
check("spent skill point survives a real page reload",after.bladePts===1,JSON.stringify(after));
check("equipped weapon (and its real stat) survives a real page reload",
  after.weapon&&after.weapon.name===TEST_ITEM.name&&after.weapon.dmg===37,JSON.stringify(after));
check("the reloaded gear is genuinely live, not just redisplayed (heroStat('dmg') reflects it)",
  after.heroDmgHasBonus,JSON.stringify(after));

// bag: the item was equipped (moved out of the bag), not left sitting there -- confirm the bag itself also round-trips
// by giving a SECOND item that stays unequipped, reloading again, and checking it's still exactly there
const bagBefore=await page.evaluate(()=>{ const M=window.__meta; M.giveItem({name:'Test Charm of the Bag',slot:'charm',rarity:1,stats:{tow:12}}); return M.bag().map(it=>it.name); });
check("a second item was added to the bag (not equipped)",bagBefore.includes('Test Charm of the Bag'),JSON.stringify(bagBefore));
await page.reload({waitUntil:"load"});
await page.waitForFunction(()=>window.__dd&&window.__meta,null,{timeout:60000});
const bagAfter=await page.evaluate(()=>window.__meta.bag().map(it=>it.name));
check("bag contents (not just equipped gear) survive a real page reload",bagAfter.includes('Test Charm of the Bag'),JSON.stringify(bagAfter));

// tidy up: don't leave the test's fake progress sitting in this profile's real save
await page.evaluate(()=>{ Object.keys(localStorage).filter(k=>/^dd/.test(k)).forEach(k=>localStorage.removeItem(k)); });

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
