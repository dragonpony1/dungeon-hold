// ===== ORDINARY LOOT +20% (game.js DROP, build 246). Matt: "we made the fancy loot more rare now increase the trash loot, the random loot gen by 20%". Every ordinary gear drop chance is the old one x1.2
// (goblin .05->.06, archer .10->.12, orc .22->.264, drake .30->.36, troll .28->.336, the ogre's second piece .5->.6; the ogre's first and the troll boss's were already 100%), checked as numbers and by rolling
// thousands of kills and counting the pieces that land.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8886);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext()).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8886/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__lootRates,null,{timeout:90000});
const t=await page.evaluate(()=>window.__lootRates.table); const o2=await page.evaluate(()=>window.__lootRates.ogre2);
const near=(a,b)=>Math.abs(a-b)<1e-9;
check("the table is the old chances x1.2 (goblin, archer, orc, drake, troll) and the ogre's second piece is .6",near(t.goblin,.06)&&near(t.archer,.12)&&near(t.orc,.264)&&near(t.drake,.36)&&near(t.troll,.336)&&near(o2,.6),JSON.stringify({t,o2}));
check("the ogre and the troll boss still always drop",t.ogre===1&&t.trollboss===1);
const got=await page.evaluate(()=>{ const L=window.__lootRates, out={}; for(const k of ["goblin","archer","orc","drake","troll"]){ L.clear(); const N=6000; for(let i=0;i<N;i++) L.roll({kind:k,x:0,z:0}); out[k]=L.count()/N; L.clear(); } return out; });
const want={goblin:.06,archer:.12,orc:.264,drake:.36,troll:.336};
check("rolling thousands of kills lands about the new rate of pieces for each mob",Object.keys(want).every(k=>Math.abs(got[k]-want[k])<.02),JSON.stringify(got));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
