// ===== BAG SORTING: the bag page sorts by type (slot order, best rarity first within each, with a heading per group),
// by rarity (best first, with a heading per rarity), or newest first; one button cycles the three; the choice survives
// a reload; the character sheet's inventory grid follows the same order. The bag itself is never reordered.
// -- sortedBag/setBagSort in 10-meta.js, tvRenderBag in 20-tavern.js, bagGrid in 68-paperdoll.js
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
import fs from "fs"; import path from "path"; import { execSync } from "child_process";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const SP=path.dirname(new URL(import.meta.url).pathname); const DIST=process.env.DIST||SP+"/dist";
if(!fs.existsSync(DIST+"/index.html")){ console.log("building "+DIST+" first"); execSync("DIST="+DIST+" EXTRA=./parts/staging node assemble.mjs",{cwd:SP,stdio:"inherit"}); }
const PORT=8902, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const ctx=await browser.newContext(); const errors=[];
async function newPage(){ const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e))); await p.goto(BASE+"/?silent&nogate",{timeout:90000});
  await p.waitForFunction(()=>window.__dd&&window.__meta&&window.__tavern&&window.__doll,null,{timeout:60000}); await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); }); return p; }
const SLOTS=['weapon','armor','charm','amulet','familiar'];
const cardOrder=p=>p.evaluate(()=>{ const bag=window.__meta.bag(); return [...document.querySelectorAll('#tv-bag .tv-card[data-from="bag"]')].map(c=>{ const it=bag.find(b=>b.id===c.dataset.id); return {id:it.id,slot:it.slot,r:it.rarity}; }); });
const headers=p=>p.evaluate(()=>[...document.querySelectorAll('#tv-bag .tv-grp')].map(h=>h.textContent.trim()));
const nonIncreasing=a=>a.every((v,i)=>i===0||a[i-1]>=v);

const page=await newPage();
check("a fresh browser sorts by type out of the box",await page.evaluate(()=>window.__meta.bagSort())==='type');
// eight pieces, bagged in a deliberately scrambled order
const pickupOrder=await page.evaluate(()=>{ const spec=[['familiar',0],['weapon',2],['armor',1],['weapon',4],['charm',0],['amulet',3],['weapon',0],['armor',3]]; const ids=[];
  for(const [slot,r] of spec){ const it=window.__dd.rollItem(r,slot); it.rarity=r; if(!window.__meta.onPickup(it)) throw new Error('pickup refused'); ids.push(it.id); } return ids; });
check("eight pieces bagged, in pickup order",await page.evaluate(()=>window.__meta.bag().length)===8);
check("the bag array itself is untouched by the sort (still pickup order)",JSON.stringify(await page.evaluate(()=>window.__meta.bag().map(b=>b.id)))===JSON.stringify(pickupOrder));

await page.evaluate(()=>{ window.__tavern.open(); window.__tavern.tab('bag'); });
await page.waitForSelector('#tv-bag .tv-card[data-from="bag"]',{timeout:10000});
let order=await cardOrder(page);
check("by type: cards run weapon → armor → charm → amulet → familiar",order.every((c,i)=>i===0||SLOTS.indexOf(order[i-1].slot)<=SLOTS.indexOf(c.slot)),order.map(c=>c.slot+c.r).join(' '));
check("...and within a type the best rarity comes first (the three weapons: legendary, rare, common)",nonIncreasing(order.filter(c=>c.slot==='weapon').map(c=>c.r)),order.filter(c=>c.slot==='weapon').map(c=>c.r).join(','));
let hs=await headers(page);
check("one heading per type present, starting with weapons, with counts",hs.length===5&&/WEAPONS\s*3/.test(hs[0])&&/ARMOR\s*2/.test(hs[1])&&/FAMILIARS\s*1/.test(hs[4]),JSON.stringify(hs));
check("the sort button reads by type",/by type/.test(await page.evaluate(()=>document.getElementById('tv-sort').textContent)));

await page.click('#tv-sort'); await page.waitForTimeout(100);
order=await cardOrder(page); hs=await headers(page);
check("one click: by rarity -- best first across the whole bag",nonIncreasing(order.map(c=>c.r)),order.map(c=>c.slot+c.r).join(' '));
check("...with a heading per rarity, legendary at the top",hs.length===5&&/^LEGENDARY/.test(hs[0])&&/^COMMON/.test(hs[4]),JSON.stringify(hs));
check("the button now reads by rarity",/by rarity/.test(await page.evaluate(()=>document.getElementById('tv-sort').textContent)));

await page.click('#tv-sort'); await page.waitForTimeout(100);
order=await cardOrder(page); hs=await headers(page);
check("two clicks: newest first is the exact reverse of pickup order, no headings",JSON.stringify(order.map(c=>c.id))===JSON.stringify(pickupOrder.slice().reverse())&&hs.length===0,order.map(c=>c.slot+c.r).join(' '));
await page.click('#tv-sort'); await page.waitForTimeout(100);
check("three clicks: back to type",await page.evaluate(()=>window.__meta.bagSort())==='type'&&(await headers(page)).length===5);

// remembered across a reload
await page.click('#tv-sort'); await page.waitForTimeout(100);
check("the choice is written to localStorage (ddBagSort)",await page.evaluate(()=>localStorage.getItem('ddBagSort'))==='rarity');
await page.close();
const page2=await newPage();
check("a reload comes back sorted by rarity",await page2.evaluate(()=>window.__meta.bagSort())==='rarity');
check("...with the bag intact",await page2.evaluate(()=>window.__meta.bag().length)===8);

// the character sheet's grid follows the same order
await page2.evaluate(()=>window.__doll.open()); await page2.waitForTimeout(150);
const dollIds=await page2.evaluate(()=>[...document.querySelectorAll('.inv-c.has[data-id]')].map(c=>c.dataset.id));
const sortedIds=await page2.evaluate(()=>window.__meta.sortedBag().map(b=>b.id));
check("the sheet's inventory grid shows the same sorted order",JSON.stringify(dollIds)===JSON.stringify(sortedIds)&&dollIds.length===8,dollIds.length+' cells');
await page2.evaluate(()=>window.__doll.close());

// acting on a sorted card still acts on the right item
await page2.evaluate(()=>{ window.__tavern.open(); window.__tavern.tab('bag'); }); await page2.waitForSelector('#tv-bag .tv-card[data-from="bag"]');
const first=(await cardOrder(page2))[0];
check("the top card by rarity is the legendary weapon",first.r===4&&first.slot==='weapon',JSON.stringify(first));
await page2.click('#tv-bag .tv-card[data-id="'+first.id+'"]'); await page2.waitForTimeout(100);
await page2.click('#tv-detail [data-act="equip"][data-id="'+first.id+'"]'); await page2.waitForTimeout(150);
check("equipping it from the sorted view equips exactly that piece",await page2.evaluate(id=>{ const g=window.__dd.gear(); return g.weapon&&g.weapon.id===id&&window.__meta.bag().length===7; },first.id));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
