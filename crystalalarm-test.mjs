// ===== THE CRYSTAL on the training ground has twice the life (300, map one only), and any hit on it raises the UNDER ATTACK
// strip for 2.5 s and rings a low bell at most once every 3 s (55-crystal.js). The music has a visible switch on the HUD.
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path";
const SP=path.dirname(new URL(import.meta.url).pathname); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8912, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const ctx=await browser.newContext(); const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto(BASE+"/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__alarm&&window.__meta,null,{timeout:60000});
const c0=await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); return {crystal:window.__dd.S.crystal,max:window.__alarm.max(),map:window.__dd.map().id,bar:document.getElementById('cbar').style.width}; });
check("map one: the crystal starts at 300 of 300 (doubled for the training ground), the bar full",c0.crystal===300&&c0.max===300&&c0.map==='hall'&&c0.bar==='100%',JSON.stringify(c0));
const hit=await page.evaluate(()=>{ const d=window.__dd; d.startWave(); d.step(1/60,2); const on0=window.__alarm.on(); d.hurtCrystal(10); d.step(1/60,2); const on1=window.__alarm.on(), rings1=window.__alarm.rings(); d.hurtCrystal(10); d.step(1/60,2); d.hurtCrystal(10); d.step(1/60,2); const rings2=window.__alarm.rings(), hits=window.__alarm.hits();
  for(let i=0;i<60*2.8;i++) d.step(1/60,1); const onLater=window.__alarm.on(); d.step(1/60,20); d.hurtCrystal(10); d.step(1/60,2); const rings3=window.__alarm.rings(); return {on0,on1,rings1,rings2,hits,onLater,rings3,text:document.getElementById('alarm').textContent,crystal:d.S.crystal}; });
check("a hit raises the UNDER ATTACK strip (off before, on after) and rings the bell; two more hits inside 3 s add hits but no second ring",!hit.on0&&hit.on1&&hit.rings1===1&&hit.rings2===1&&hit.hits===3&&/UNDER ATTACK/.test(hit.text),JSON.stringify(hit));
check("the strip stays 2.5 s after the last hit and drops; a hit after the 3 s cooldown rings again",!hit.onLater&&hit.rings3===2&&hit.crystal===260,JSON.stringify({onLater:hit.onLater,rings3:hit.rings3,crystal:hit.crystal}));
// the music switch
const mus=await page.evaluate(()=>{ const b=document.getElementById('musbtn'); const vis=b&&b.getBoundingClientRect().width>0; const on0=window.__dd.music().on; b.click(); const on1=window.__dd.music().on, off1=b.classList.contains('off'), saved=localStorage.getItem('ddMusic'); b.click(); const on2=window.__dd.music().on, off2=b.classList.contains('off'); return {vis,on0,on1,off1,saved,on2,off2}; });
check("a 🎵 button sits by the sound button: a click turns the music off (struck through, saved as off), another turns it back on",mus.vis&&mus.on0===true&&mus.on1===false&&mus.off1&&mus.saved==='off'&&mus.on2===true&&!mus.off2,JSON.stringify(mus));
// map two keeps the ordinary crystal
await page.evaluate(()=>{ try{ localStorage.setItem('ddMapsCleared','1'); }catch(e){} });
await page.goto(BASE+"/?silent&nogate&map=1",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__alarm,null,{timeout:60000});
const c1=await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); return {crystal:window.__dd.S.crystal,max:window.__alarm.max(),map:window.__dd.map().id}; });
check("map two: the crystal is the ordinary 150",c1.crystal===150&&c1.max===150&&c1.map!=='hall',JSON.stringify(c1));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
