// ===== THE FORGE ALWAYS CHARGES (build 411; parts/staging/90-forge.js upCost/tierNum). Matt: "OJ says it's not spending his gold, he's getting NaN by the cost".
// A piece whose saved tier is a word ('mythic', 'named' -- the hideout's records) or missing priced at NaN and upgraded FREE. Checked: such pieces get a real price, an upgrade takes exactly that much gold,
// and the forge panel shows no NaN; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8998,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:8998/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__forge&&window.__meta&&window.__tavern&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); window.__meta.setLevel&&window.__meta.setLevel(40); window.__meta.addGold(100000); });
const A=await page.evaluate(()=>{ const d=window.__dd, F=window.__forge, M=window.__meta; const out=[];
  for(const [tier,lvl] of [['mythic',20],['named',15],[undefined,undefined],['set','abc']]){ const it=d.rollItem(3,'armor',10); it.tier=tier; it.lvl=lvl; M.giveItem(it); const c=F.cost(it); const g0=M.gold(); const n=F.upgrade(it,'hp',1); out.push({tier:String(tier),cost:c,paid:g0-M.gold(),n}); }
  return out; });
check("a piece with its tier saved as a word or missing gets a real price, and an upgrade takes exactly that much gold",A.every(r=>Number.isFinite(r.cost)&&r.cost>=1&&r.n===1&&r.paid===r.cost),JSON.stringify(A));
const B=await page.evaluate(async()=>{ const T=window.__tavern; T.open(); T.tab('bag'); await new Promise(r=>setTimeout(r,200)); const card=[...document.querySelectorAll('#tv-bag .tv-card[data-from="bag"]')][0]; if(card) card.click(); await new Promise(r=>setTimeout(r,250)); const html=(document.getElementById('tv-detail')||{}).innerHTML||''; T.close(); return { hasForge:/tv-forge|tvf/.test(html), nan:/NaN/.test(html) }; });
check("the forge panel shows no NaN",B.hasForge&&!B.nan,JSON.stringify(B));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
