// ===== SURVIVAL TROPHIES (build 623, 99zb-recipes.js). Matt: "have we tuned how this stuff drops for survival mode" -> "yes build it".
// Checked: in Survival every boss wave held (10, 20 ...) banks one of THIS map's boss trophy, with a picture card; the waves between give none; a held wave in the campaign gives none;
// no new masterwork blueprint comes with it; the Gnome Hall's is the Cyclops Eye; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8934,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
async function run(map,survival){ const page=await (await browser.newContext({viewport:{width:1100,height:700}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
  await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
  await page.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("dd_trainer",JSON.stringify({done:{},off:true}));
    localStorage.setItem("dd_recipes",JSON.stringify({seeded:1,seededH:1,seededBoss:1,known:{},pages:{},named:{},trophies:{},bosses:{}})); }catch(e){} });
  await page.goto("http://127.0.0.1:8934/?silent&nogate&map="+map,{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__recipes&&window.__survival,null,{timeout:120000});
  const r=await page.evaluate(sv=>{ const d=window.__dd, M=d.Meta||window.__meta, R=window.__recipes; if(sv) window.__survival.set(true); const on=window.__survival.on(); d.start(); d.step(1/60,3);
    const base=effWaveBase(); function effWaveBase(){ const w=d.S.wave; d.S.wave=0; const b=window.__dd.effWave?window.__dd.effWave():null; d.S.wave=w; return b; }
    const tro=()=>Object.assign({},R.read().trophies||{}); const out={ on, base };
    const held=mw=>{ const t0=JSON.stringify(tro()); M.onWaveHeld((base|0)+mw); return JSON.stringify(tro())!==t0; };
    out.w9=held(9); out.w10=held(10); out.card=document.getElementById('bossRecipeCard').innerHTML; out.w11=held(11); out.w20=held(20); out.tro=tro(); out.named=Object.keys(R.read().named||{}).length; return out; },survival);
  await page.close(); return r; }
const C=await run(2,true);
check("Survival on the Cloister: wave 10 and 20 each bank an Archhag's Heart (none on 9 or 11), with its picture card",C.on&&!C.w9&&C.w10&&!C.w11&&C.w20&&C.tro.archhag===2&&/trophies\/archhag\.webp/.test(C.card),JSON.stringify(C).slice(0,400));
check("trophies only: no masterwork blueprint comes with them",C.named===0,JSON.stringify(C.named));
const G=await run(0,true);
check("Survival in the Gnome Hall: the Cyclops Eye",G.on&&G.w10&&G.tro.cyclops===2,JSON.stringify(G.tro));
const K=await run(2,false);
check("the campaign's waves give no trophy for a held wave",!K.on&&!K.w10&&!K.w20&&Object.keys(K.tro).length===0,JSON.stringify(K).slice(0,300));
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
