// ===== WEAPON EMBLEMS (build 314). Matt: "on the bag, on the card, weapons are represented by crossing swords i need that to show bow, sword, staff or stave" -- "just that little emblem".
// Build 525 prep: TYPED WEAPONS -- the emblem is now the weapon's own type on every hero (this suite was: a weapon's emblem is the hand that would hold it -- the Knight's sword (a polearm piece his polearm), the Witch's staff, the Fighter's polearm (build 510 prep), the Ranger's bow -- on the tavern bag card, its detail,
// the loot card and the sheet; other slots keep theirs.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8968,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1100,height:700}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8968/?silent&nogate&map=1",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__heroes&&window.__feel,null,{timeout:120000});
// build 525 prep: TYPED WEAPONS -- the emblem is the WEAPON'S OWN TYPE now (it.wtype), the same on every hero; with no item the slot shows the hero's own first type
const out={};
for(const h of ["knight","witch","fighter","troll"]){
  out[h]=await page.evaluate(h=>{ window.__heroes.select(h); const d=window.__dd, T=window.__typed, E=window.__emblem, o={};
    for(const t of ["sword","polearm","staff","bow"]){ let it; for(let i=0;i<80;i++){ T.force(t); it=d.rollItem(1,"weapon",3); T.force(null); if(!/ of the /.test(it.name||"")&&!it.named&&!it.mythic) break; } o[t]={card:E.card(it),icon:E.slotIcon(it)}; }
    const arm=d.rollItem(1,"armor",3); o.armor=E.card(arm); o.sicon=E.sicon("weapon"); return o; },h);
}
const has=(s,e)=>s.includes('<span class="ic">'+e+'</span>')||s.includes('<span class="ie">'+e+'</span>');   // build 524: a plain weapon with a picture keeps its emblem under it
const EM={sword:"🗡️",polearm:"🔱",staff:"🪄",bow:"🏹"};
for(const t of ["sword","polearm","staff","bow"]) check("a "+t+" shows "+EM[t]+" on its bag card and as its icon -- on every hero",["knight","witch","fighter","troll"].every(h=>has(out[h][t].card,EM[t])&&out[h][t].icon===EM[t]),JSON.stringify(["knight","witch","fighter","troll"].map(h=>out[h][t].icon)));
check("with no weapon the slot shows the hero's own first type: Knight 🗡️, Witch 🪄, Fighter 🔱, Ranger 🏹",out.knight.sicon==="🗡️"&&out.witch.sicon==="🪄"&&out.fighter.sicon==="🔱"&&out.troll.sicon==="🏹",JSON.stringify([out.knight.sicon,out.witch.sicon,out.fighter.sicon,out.troll.sicon]));
check("armor keeps its shield (a set piece: its picture, the shield emblem under it -- build 514)",Object.values(out).every(o=>has(o.armor,"🛡")||o.armor.includes('<span class="ie">🛡</span>')),"");
const lc=await page.evaluate(()=>{ const d=window.__dd, T=window.__typed; d.start(); d.step(1/60,3); const out=[]; for(const t of ["bow","staff"]){ T.force(t); const it=d.rollItem(2,"weapon",5); T.force(null); it.stats.dmg=999; it.score=99999; d.dropLoot(it,d.hero.x,d.hero.z,true); d.step(1/60,30); const c=window.__feel.card(); out.push(c?c.html.slice(0,120):null); } return out; });
check("the loot card's emblem is the piece's type on the Ranger: 🏹 for a bow, 🪄 for a staff",!!lc[0]&&lc[0].includes("🏹")&&!!lc[1]&&lc[1].includes("🪄"),JSON.stringify(lc));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
