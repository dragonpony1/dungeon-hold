// ===== THE LOCK: a bag piece locked from the tavern or the character sheet is never scrapped at the hideout portal and
// never sold (Sell junk skips it, the Sell button refuses it), leads its group in the sorted bag, and at the portal
// rides through WHOLE -- appended as an item record to localStorage 'dd_gear_carried' (the hideout's second contract)
// while the unlocked pieces become the usual per-rarity counts in 'dd_gear_bag'. -- toggleLock in 10-meta.js,
// 20-tavern.js, 68-paperdoll.js, carryGear/askThenGo in 59-hideout.js. Folder build only (serves dist/).
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
import fs from "fs"; import path from "path"; import { execSync } from "child_process";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const SP=path.dirname(new URL(import.meta.url).pathname); const DIST=process.env.DIST||SP+"/dist";
if(!fs.existsSync(DIST+"/hideout/index.html")){ console.log("building "+DIST+" first"); execSync("DIST="+DIST+" EXTRA=./parts/staging node assemble.mjs",{cwd:SP,stdio:"inherit"}); }
const PORT=8903, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const ctx=await browser.newContext(); const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function newPage(){ const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e))); await p.goto(BASE+"/?silent&nogate",{timeout:90000});
  await p.waitForFunction(()=>window.__dd&&window.__meta&&window.__tavern&&window.__doll&&window.__hideout&&window.__portal,null,{timeout:60000});
  await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); }); return p; }
const page=await newPage();

// ---- seed: a worn epic armor (so a worse armor counts as junk), then a bag of five ----
const ids=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; const mk=(slot,r,name)=>{ const it=d.rollItem(r,slot); it.rarity=r; if(name) it.name=name; M.onPickup(it); return it.id; };
  const worn=mk('armor',3,'Worn Epic Plate'); M.equip(worn);
  const out={}; out.mythic=mk('weapon',4,'Emberfang, the Cool One'); out.rival=mk('weapon',4,'Plain Legendary Blade'); out.junk=mk('armor',0,'Rusty Scraps'); out.charm=mk('charm',2,'Blue Charm'); out.amulet=mk('amulet',0,'Bead String');
  const bag=M.bag(); const my=bag.find(b=>b.id===out.mythic), rv=bag.find(b=>b.id===out.rival); my.score=Math.min(my.score,rv.score)-1;   // the rival scores higher, so only the lock can put the mythic first
  return out; });
check("five pieces in the bag, an epic armor worn",await page.evaluate(()=>window.__meta.bag().length===5&&!!window.__dd.gear().armor));

// ---- the lock itself ----
check("Meta.toggleLock locks and reports it",await page.evaluate(id=>window.__meta.toggleLock(id)===true&&window.__meta.isLocked(id),ids.mythic));
check("the flag lives on the item and is already persisted in ddMeta",await page.evaluate(id=>{ const st=JSON.parse(localStorage.getItem('ddMeta')); return st.bag.find(b=>b.id===id).locked===true; },ids.mythic));
check("Meta.sell refuses a locked piece (0 gold, bag unchanged)",await page.evaluate(id=>{ const n=window.__meta.bag().length; return window.__meta.sell(id)===0&&window.__meta.bag().length===n; },ids.mythic));
check("an unknown id toggles to null, not a crash",await page.evaluate(()=>window.__meta.toggleLock('nope')===null));

// ---- the junk sale skips a locked piece ----
check("the rusty armor counts as junk next to the worn epic",await page.evaluate(id=>window.__meta.isJunk(window.__meta.bag().find(b=>b.id===id)),ids.junk));
await page.evaluate(id=>window.__meta.toggleLock(id),ids.junk);
check("...but not while locked: Sell junk sells nothing",await page.evaluate(()=>window.__meta.sellJunk().n===0));
await page.evaluate(id=>window.__meta.toggleLock(id),ids.junk);
check("unlocked again, Sell junk sells exactly it",await page.evaluate(id=>{ const r=window.__meta.sellJunk(); return r.n===1&&!window.__meta.bag().some(b=>b.id===id); },ids.junk));

// ---- the sorted bag: the locked mythic leads the weapons despite the rival's higher score ----
const order=await page.evaluate(()=>window.__meta.sortedBag().map(b=>b.id));
check("by type, the locked mythic is first among the weapons though the rival scores higher",order[0]===ids.mythic&&order[1]===ids.rival,JSON.stringify(order.slice(0,2)));

// ---- the tavern: badge, button, disabled sell ----
await page.evaluate(()=>{ window.__tavern.open(); window.__tavern.tab('bag'); }); await page.waitForSelector('#tv-bag .tv-card[data-from="bag"]');
check("the locked card wears a 🔒 badge; the others don't",await page.evaluate(ids=>!!document.querySelector('#tv-bag .tv-card[data-id="'+ids.mythic+'"] .tv-lock')&&!document.querySelector('#tv-bag .tv-card[data-id="'+ids.rival+'"] .tv-lock'),ids));
await page.click('#tv-bag .tv-card[data-id="'+ids.mythic+'"]'); await sleep(100);
check("its detail panel offers Unlock and has Sell disabled",await page.evaluate(()=>{ const l=document.querySelector('#tv-detail [data-act="lock"]'), s=document.querySelector('#tv-detail [data-act="sell"]'); return !!l&&/Unlock/.test(l.textContent)&&!!s&&s.disabled; }));
await page.click('#tv-detail [data-act="lock"]'); await sleep(100);
check("clicking it unlocks: Lock offered, Sell enabled, badge gone",await page.evaluate(ids=>{ const l=document.querySelector('#tv-detail [data-act="lock"]'), s=document.querySelector('#tv-detail [data-act="sell"]'); return /Lock/.test(l.textContent)&&!/Unlock/.test(l.textContent)&&!s.disabled&&!document.querySelector('#tv-bag .tv-card[data-id="'+ids.mythic+'"] .tv-lock')&&!window.__meta.isLocked(ids.mythic); },ids));
await page.click('#tv-detail [data-act="lock"]'); await sleep(100);
check("and again locks it back",await page.evaluate(id=>window.__meta.isLocked(id),ids.mythic));
await page.evaluate(()=>window.__tavern.close());

// ---- the character sheet: badge on the cell, LOCK on the card ----
await page.evaluate(()=>window.__doll.open()); await sleep(150);
check("the sheet's inventory cell for it shows the lock",await page.evaluate(id=>!!document.querySelector('#doll .inv-c[data-id="'+id+'"] .dl-lock'),ids.mythic));
await page.click('#doll .inv-c[data-id="'+ids.rival+'"]'); await sleep(120);
check("the rival's card offers LOCK with Sell enabled",await page.evaluate(()=>{ const l=document.querySelector('#doll [data-act="lock"]'), s=document.querySelector('#doll [data-act="sell"]'); return !!l&&/LOCK/.test(l.textContent)&&!/UNLOCK/.test(l.textContent)&&!!s&&!s.disabled; }));
await page.click('#doll [data-act="lock"]'); await sleep(120);
check("LOCK from the sheet locks it (UNLOCK offered, Sell disabled, cell badged)",await page.evaluate(id=>{ const l=document.querySelector('#doll [data-act="lock"]'), s=document.querySelector('#doll [data-act="sell"]'); return window.__meta.isLocked(id)&&/UNLOCK/.test(l.textContent)&&s.disabled&&!!document.querySelector('#doll .inv-c[data-id="'+id+'"] .dl-lock'); },ids.rival));
await page.click('#doll [data-act="lock"]'); await sleep(120);
check("UNLOCK from the sheet unlocks it",await page.evaluate(id=>!window.__meta.isLocked(id),ids.rival));
await page.evaluate(()=>window.__doll.close());

// ---- the portal: the split prompt, the two contracts ----
await page.waitForFunction(()=>window.__portal.loaded(),null,{timeout:60000}); await page.evaluate(()=>window.__dd.step(1/60,40));
await page.evaluate(()=>{ localStorage.setItem('dd_gear_bag',JSON.stringify({common:2})); localStorage.setItem('dd_gear_carried',JSON.stringify([{id:'theirs-1',name:'Already Displayed',slot:'charm',rarity:3,from:'hideout'}])); });
const ppos=await page.evaluate(()=>window.__portal.pos());
await page.evaluate(p=>{ window.__dd.setHero(p.x+.6,p.z+.6); window.__dd.step(1/60,3); },ppos);
await page.keyboard.press('KeyE');
await page.waitForFunction(()=>window.__hideout.isOpen(),null,{timeout:5000}).catch(()=>{});
const after=await page.evaluate(ids=>({bag:window.__meta.bag().length,counts:JSON.parse(localStorage.getItem('dd_gear_bag')),carried:JSON.parse(localStorage.getItem('dd_gear_carried')),last:window.__hideout.lastCarry()}),ids);
check("no prompt at the door: E walked straight through into the hideout",await page.evaluate(()=>window.__hideout.isOpen()&&!document.getElementById('hideoutAsk')));
check("the unlocked three became counts, added to what was there (common 2+1=3, rare 1, legendary 1)",after.counts.common===3&&after.counts.rare===1&&after.counts.legendary===1&&after.counts.epic===0,JSON.stringify(after.counts));
check("the locked mythic rode through whole: a record with its id, name, slot, rarity and stats, from dungeon-hold, no lock flag",(()=>{ const r=after.carried.find(x=>x.id===ids.mythic); return !!r&&r.name==='Emberfang, the Cool One'&&r.slot==='weapon'&&r.rarity===4&&r.stats&&Object.keys(r.stats).length>0&&r.from==='dungeon-hold'&&typeof r.carriedAt==='number'&&r.locked===undefined; })(),JSON.stringify(after.carried.map(x=>x.name)));
check("a record the hideout side already held was left alone (read-modify-write)",after.carried.length===2&&after.carried[0].id==='theirs-1'&&after.carried[0].name==='Already Displayed');
check("the bag is empty afterwards and lastCarry reports both halves",after.bag===0&&after.last.n===3&&after.last.carried.length===1&&after.last.carried[0]===ids.mythic,JSON.stringify(after.last));
await page.evaluate(()=>window.__hideout.close());

// ---- all locked: nothing to scrap, the prompt says so, counts untouched ----
const solo=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; const it=d.rollItem(3,'amulet'); it.rarity=3; it.name='Kept Amulet'; M.onPickup(it); M.toggleLock(it.id); d.step(1/60,2); return it.id; });
await page.keyboard.press('KeyE'); await page.waitForFunction(()=>window.__hideout.isOpen(),null,{timeout:5000}).catch(()=>{});
const after2=await page.evaluate(()=>({counts:JSON.parse(localStorage.getItem('dd_gear_bag')),carried:JSON.parse(localStorage.getItem('dd_gear_carried')).map(x=>x.id),bag:window.__meta.bag().length}));
check("with only a locked piece: nothing scrapped, the amulet appended whole, bag empty",after2.counts.common===3&&after2.counts.epic===0&&after2.carried.length===3&&after2.carried[2]===solo&&after2.bag===0,JSON.stringify(after2));
await page.evaluate(()=>window.__hideout.close());
await page.evaluate(()=>{ const d=window.__dd; d.setHero(30,30); d.step(1/60,2); });

// ---- a reload keeps everything ----
await page.close();
const page2=await newPage();
const persisted=await page2.evaluate(()=>({carried:JSON.parse(localStorage.getItem('dd_gear_carried')).length,bag:window.__meta.bag().length,armor:!!window.__dd.gear().armor}));
check("a fresh load: three carried records intact, the bag empty, the worn armor still worn",persisted.carried===3&&persisted.bag===0&&persisted.armor,JSON.stringify(persisted));
await page2.close();

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
