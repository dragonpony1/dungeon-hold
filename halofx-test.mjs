// ===== build 541: the Fighter's Halo Surge wears Matt's radial shockwave (73c-halofx.js). Looks only.
//  * holding right-click as the Fighter lays the charge piece at his feet (brighter as it fills); it goes when the charge ends
//  * the cast rolls a big copy out at the cast spot, its last ring sized to the damage ring (8), and it is gone (pooled) a little after the ring
//  * it is gold by default; the damage ring and surge still work
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const server=await serve(8963,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1000,height:640}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("ddMapsCleared","9"); }catch(e){} });
await page.goto("http://127.0.0.1:8963/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__specials&&window.__halofx&&window.__heroes,null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; window.__heroes.select("fighter"); d.start(); for(const e of d.enemies.slice()) d.kill(e); d.setHero(5,6,0); d.step(1/60,10); window.__halofx.load(); });
await page.waitForFunction(()=>window.__halofx.info().loaded,null,{timeout:120000});
const ch=await page.evaluate(()=>{ const d=window.__dd, S=window.__specials, H=window.__halofx; S.forceReady(); S.press(); const seen=[]; let on=false;
  for(let i=0;i<40;i++){ d.step(1/60,1); if(H.info().charging) on=true; }
  const r=H.chargeRoot(); const mid={on,scale:r?+r.scale.x.toFixed(2):0,charging:S.charging()}; return mid; });
check("holding the special as the Fighter lays the charge piece at his feet",ch.on&&ch.charging&&ch.scale>.4&&ch.scale<.8,JSON.stringify(ch));
await page.screenshot({path:process.env.TEMP+"/halo-charge.png"});
// (the page also runs in real time between evaluate calls, so the charge may finish during the screenshot: count bursts in total)
const fire=await page.evaluate(()=>{ const d=window.__dd, S=window.__specials, H=window.__halofx; const b0=H.info().bursts; for(let i=0;i<60&&S.charging();i++) d.step(1/60,1); d.step(1/60,8);
  const roots=H.liveRoots(); const r=roots[roots.length-1]; let col=null; if(r) r.traverse(o=>{ if(o.isMesh&&o.material&&o.material.userData.key==='full'&&!col) col=o.material.color.getHexString(); });
  const info=H.info(); const ring=S.ringFx(); return {bursts:info.bursts,live:info.live,scale:r?+r.scale.x.toFixed(2):0,col,charging:info.charging,ring:!!ring,surge:S.haloSurgeT()}; });
check("the cast rolls Matt's shockwave out, its last ring sized to the damage ring (8 / 4.2)",fire.bursts===1&&fire.live===1&&Math.abs(fire.scale-8/4.2)<.05,JSON.stringify(fire));
check("the charge piece goes when the charge ends; the damage ring and surge still run",!fire.charging&&fire.ring&&fire.surge>0,JSON.stringify(fire));
check("it is the Halo gold by default (a warm colour, not the model's cyan)",!!fire.col&&parseInt(fire.col.slice(0,2),16)>parseInt(fire.col.slice(4,6),16),JSON.stringify(fire));
await page.screenshot({path:process.env.TEMP+"/halo-burst.png"});
const after=await page.evaluate(()=>{ const d=window.__dd, H=window.__halofx; d.step(1/60,90); return H.info(); });
check("it is gone a little after the ring (back in the pool)",after.live===0&&after.pooled>=1,JSON.stringify(after));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
