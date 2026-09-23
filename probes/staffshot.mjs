// the battle staffs on the design bench (the throne room's floor, which has room for a camera): six in a row, a bolt in flight
// and its burst, and the battle staff in the Warden's hand
import { chromium } from "playwright"; import { serve } from "../serve.mjs";
const SP=process.env.SP; const server=await serve(8931);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const page=await browser.newPage({viewport:{width:1100,height:700}}); const errs=[]; page.on("pageerror",e=>errs.push(String(e)));
const ready=()=>page.waitForFunction(()=>window.__dd&&window.__staff&&window.__weapons&&window.__dd.heroModel()&&window.__dd.mobModel("goblin"),null,{timeout:120000});
await page.goto("http://127.0.0.1:8931/?silent&nogate"); await ready(); await page.evaluate(()=>{ try{ localStorage.setItem("ddMapsCleared","4"); }catch(e){} });
await page.goto("http://127.0.0.1:8931/?silent&nogate&map=1"); await ready();
const shot=async(name)=>{ await page.evaluate(()=>{ document.getElementById("hud").style.display="none"; window.__freeze=true; }); await page.waitForTimeout(250); await page.screenshot({path:SP+"/parts/shots/"+name+".png"}); await page.evaluate(()=>{ window.__freeze=false; }); };
const look=async(hx,hz,yaw,pitch,dist)=>page.evaluate(([hx,hz,yaw,pitch,dist])=>{ const d=window.__dd; d.setHero(hx,hz,yaw); d.hero.y=0; d.setCam(yaw,pitch,dist); d.step(1/60,30); },[hx,hz,yaw,pitch,dist]);
// the row, on the lower floor (world z 35..64 on this map), the hero off to the side
const row=await page.evaluate(()=>{ const d=window.__dd; window.__meta.reset(); d.resetGear(); d.start(); const ks=window.__staff.kinds(); ks.forEach((k,i)=>window.__staff.plant(k,(i-2.5)*1.5,46,0,1.6)); return {map:d.map().id,kinds:ks,planted:window.__staff.planted()}; });
console.log(JSON.stringify(row)); await look(-7,52,Math.PI*.78,.12,5.5); await shot("staffs-row"); await look(3.5,49.5,Math.PI*1.3,.08,3.2); await shot("staffs-close");
// a bolt across the floor from the battle staff, then its burst on the east wall
const flight=await page.evaluate(()=>{ const d=window.__dd; window.__staff.clear(); const g=window.__staff.plant("battle",-6,50,Math.PI/2,1.6); d.setHero(-2,56,Math.PI*.9); d.hero.y=0; d.setCam(Math.PI*.9,.1,5); d.step(1/60,20); window.__staff.fire(g,1,.02,0); for(let i=0;i<16;i++) d.step(1/60,1); return {bolts:window.__staff.bolts()}; });
console.log(JSON.stringify(flight)); await shot("staff-bolt");
const burst=await page.evaluate(()=>{ const d=window.__dd; let n=0; for(let i=0;i<200&&!window.__staff.bursts();i++){ d.step(1/60,1); n++; } d.step(1/60,5); return {steps:n,bursts:window.__staff.bursts()}; });
console.log(JSON.stringify(burst)); await look(8,54,Math.PI*.7,.1,5); await shot("staff-burst");
// the battle staff in the Warden's hand (forced onto the sword mount), two angles, then a bolt from it
const hand=await page.evaluate(async()=>{ const d=window.__dd; window.__staff.clear(); window.__weapons.force("staff-battle"); for(let i=0;i<90;i++){ d.step(1/60,1); await new Promise(r=>setTimeout(r,0)); if(/staff-battle/.test(window.__weapons.state().key)&&window.__weapons.state().mounted) break; } return window.__weapons.state().key; });
console.log(hand); await look(0,54,Math.PI*.8,.08,3.4); await shot("staff-hand"); await look(0,54,Math.PI*1.25,.1,3.2); await shot("staff-hand2");
const fromHand=await page.evaluate(()=>{ const d=window.__dd; d.setHero(0,56,Math.PI); d.hero.y=0; d.step(1/60,5); window.__staff.fireFromHand(0,.02,-1); for(let i=0;i<8;i++) d.step(1/60,1); d.setCam(Math.PI*.5,.12,5.5); d.step(1/60,2); return {bolts:window.__staff.bolts()}; });
console.log(JSON.stringify(fromHand)); await shot("staff-hand-bolt");
await page.evaluate(()=>{ window.__weapons.force(null); }); console.log("errors:",errs.join(" | ")||"none"); await browser.close(); server.close();
