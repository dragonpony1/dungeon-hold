// ===== THE SETS PANEL COUNTS A NAMED MYTHIC (68-paperdoll.js setsPanel, build 283). Matt, wearing Rootsplitter with three Forest pieces: "i am getting the bonus just doesnt say it on the page screen".
// The real bonus (92-sets.js counts()) counts a worn named mythic as one piece of every set you wear a real piece of; the sheet's Sets panel now says the same: 3 Forest + Rootsplitter = Forest 4/5 with the
// weapon pip marked as counting, and with the Forest familiar on too it says 5/5 with ALL 5 lit -- matching what the game really gives.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const DIST = process.env.DIST || "./dist";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8935; const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1600,height:900}}); const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:"+PORT+"/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__doll&&window.__sets&&window.__mythic,null,{timeout:60000});
await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); });
const kit=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; const out={};
  for(const s of ['armor','charm','amulet','familiar']){ const it=d.rollItem(1,s,2); it.rarity=1; it.name=it.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' of the Forest'; M.giveItem(it); out[s]=it.id; }
  const rs=window.__mythic.normalize({tier:"named",named:"rootsplitter"}); M.giveItem(rs); out.weapon=rs.id;
  M.equip(out.weapon); M.equip(out.armor); M.equip(out.charm); M.equip(out.amulet); return out; });
const read=()=>page.evaluate(()=>{ const c=[...document.querySelectorAll('#doll .dl-setband .sr')].find(x=>/Forest/.test(x.querySelector('.sn').textContent)); const real=window.__sets.active?window.__sets.active().find(a=>/Forest/.test(a.name)):null;
  return { text:c&&c.querySelector('.sn').textContent, lit:c?c.querySelectorAll('.sb.lit').length:0, named:c?c.querySelectorAll('.spips .named').length:0, realCount:real?real.count:null }; });
await page.evaluate(()=>{ window.__doll.open(); }); await page.waitForTimeout(400);
const a=await read();
check("three Forest pieces worn with Rootsplitter: the panel says Forest 4/5, the weapon pip marked as counting, the small bonus lit -- the same count the real bonus uses",/4\/5/.test(a.text||"")&&a.named===1&&a.lit===1&&a.realCount===4,JSON.stringify(a));
await page.evaluate(id=>{ window.__doll.close&&window.__doll.close(); window.__meta.equip(id); window.__doll.open(); },kit.familiar); await page.waitForTimeout(400);
const b=await read();
check("with the Forest familiar on as well: the panel says 5/5 and ALL 5 is lit (the power really is on)",/5\/5/.test(b.text||"")&&b.lit===2&&b.realCount===5,JSON.stringify(b));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
