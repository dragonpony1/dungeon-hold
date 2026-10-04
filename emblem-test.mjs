// ===== WEAPON EMBLEMS (build 314). Matt: "on the bag, on the card, weapons are represented by crossing swords i need that to show bow, sword, staff or stave" -- "just that little emblem".
// Checked: a weapon's emblem is the hand that would hold it -- the Knight's sword (a polearm piece his polearm), the Witch's staff, the Fighter's polearm (build 510 prep), the Ranger's bow -- on the tavern bag card, its detail,
// the loot card and the sheet; other slots keep theirs.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8968,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1100,height:700}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8968/?silent&nogate&map=1",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__heroes&&window.__feel,null,{timeout:120000});
const out={};
for(const h of ["knight","witch","fighter","troll"]){
  out[h]=await page.evaluate(h=>{ window.__heroes.select(h); const d=window.__dd;
    const roll=()=>{ let it; for(let i=0;i<80;i++){ it=d.rollItem(1,"weapon",3); if(!/ of the /.test(it.name||"")&&!it.named&&!it.mythic) break; } return it; };
    const w=roll(), p=roll(); p.look="polearm"; const arm=d.rollItem(1,"armor",3);
    const E=window.__emblem; return { card:E.card(w), pole:E.card(p), armor:E.card(arm), icon:E.slotIcon(w), poleIcon:E.slotIcon(p), sicon:E.sicon("weapon") }; },h);
}
const has=(s,e)=>s.includes('<span class="ic">'+e+'</span>')||s.includes('<span class="ie">'+e+'</span>');   // build 524: a plain weapon with a picture keeps its emblem under it
check("the Knight's weapon shows a sword on its bag card, a polearm piece a polearm",has(out.knight.card,"🗡️")&&has(out.knight.pole,"🔱")&&!has(out.knight.card,"⚔"),JSON.stringify({i:out.knight.icon,p:out.knight.poleIcon}));
check("the Witch's weapons show a staff (a polearm piece too: she holds it as a staff)",has(out.witch.card,"🪄")&&has(out.witch.pole,"🪄"),JSON.stringify({w:out.witch.icon,wp:out.witch.poleIcon}));
check("the Fighter's weapons show a polearm, whatever the piece (build 510 prep: he holds only polearms)",has(out.fighter.card,"🔱")&&has(out.fighter.pole,"🔱")&&out.fighter.icon==="🔱"&&out.fighter.sicon==="🔱",JSON.stringify({f:out.fighter.icon,fp:out.fighter.poleIcon,s:out.fighter.sicon}));
check("the Ranger's weapons show a bow",has(out.troll.card,"🏹")&&has(out.troll.pole,"🏹"),JSON.stringify({r:out.troll.icon}));
check("armor keeps its shield (a set piece: its picture, the shield emblem under it -- build 514)",Object.values(out).every(o=>has(o.armor,"🛡")||o.armor.includes('<span class="ie">🛡</span>')),"");
const lc=await page.evaluate(()=>{ const d=window.__dd; d.start(); d.step(1/60,3); const it=d.rollItem(2,"weapon",5); it.stats.dmg=999; it.score=99999; d.dropLoot(it,d.hero.x,d.hero.z,true); d.step(1/60,30); const c=window.__feel.card(); return c?c.html.slice(0,200):null; });
check("the loot card's emblem is the Ranger's bow too",!!lc&&lc.includes("🏹"),lc);
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
