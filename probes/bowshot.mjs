// the bows on the design bench (the throne room's lower floor, world z 58..78 on this map): six in a row, close, the Bow of the Void in the troll's hand, an arrow away
import { chromium } from "playwright"; import { serve } from "../serve.mjs";
const SP=process.env.SP; const server=await serve(8933);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const page=await browser.newPage({viewport:{width:1100,height:700}}); const errs=[]; page.on("pageerror",e=>errs.push(String(e)));
const ready=()=>page.waitForFunction(()=>window.__dd&&window.__bow&&window.__weapons&&window.__dd.heroModel()&&window.__dd.mobModel("goblin"),null,{timeout:120000});
await page.goto("http://127.0.0.1:8933/?silent&nogate"); await ready(); await page.evaluate(()=>{ try{ localStorage.setItem("ddMapsCleared","5"); }catch(e){} });
await page.goto("http://127.0.0.1:8933/?silent&nogate&map=1"); await ready();
// bench shots hide the hero (the camera orbits him, so he would stand in front of the row); the loop is frozen so nothing re-shows him
const shot=async(name,hideHero)=>{ await page.evaluate((hide)=>{ document.getElementById("hud").style.display="none"; window.__freeze=true; if(hide){ const d=window.__dd; const at=new THREE.Vector3(d.hero.x,d.hero.y,d.hero.z); d.scene.children.forEach(o=>{ let sk=false; o.traverse(m=>{ if(m.isSkinnedMesh) sk=true; }); if(sk&&o.position.distanceTo(at)<.01){ o.visible=false; o.userData.hidden=true; } }); } },!!hideHero); await page.waitForTimeout(250); await page.screenshot({path:SP+"/parts/shots/"+name+".png"}); await page.evaluate(()=>{ window.__dd.scene.children.forEach(o=>{ if(o.userData.hidden){ o.visible=true; delete o.userData.hidden; } }); window.__freeze=false; }); };
const look=async(hx,hz,yaw,pitch,dist)=>page.evaluate(([hx,hz,yaw,pitch,dist])=>{ const d=window.__dd; d.setHero(hx,hz,yaw); d.hero.y=0; d.setCam(yaw,pitch,dist); d.step(1/60,30); },[hx,hz,yaw,pitch,dist]);
const row=await page.evaluate(()=>{ const d=window.__dd; window.__meta.reset(); d.resetGear(); d.start(); const ks=window.__bow.kinds(); ks.forEach((k,i)=>window.__bow.plant(k,(i-2.5)*1.6,68,0,1.6)); d.step(1/60,40); return {map:d.map().id,kinds:ks,planted:window.__bow.planted()}; });
console.log(JSON.stringify(row)); await look(-1,75,Math.PI,.14,6.5); await shot("bows-row",true); await look(3.6,71.5,Math.PI*1.3,.08,3.4); await shot("bows-close",true); await look(-4.2,71.5,Math.PI*.7,.08,3.4); await shot("bows-close2",true);
// the troll with the Bow of the Void, at rest and at the draw, and an arrow from it
await page.evaluate(()=>window.__heroes.select("troll")); await page.waitForFunction(()=>/Troll/.test(window.__dd.heroModel().label),null,{timeout:90000});
const hand=await page.evaluate(async()=>{ const d=window.__dd; window.__bow.clear(); window.__weapons.force("bow-void"); for(let i=0;i<120;i++){ d.step(1/60,1); await new Promise(r=>setTimeout(r,0)); if(/bow-void/.test(window.__weapons.state().key)&&window.__weapons.state().mounted) break; } d.step(1/60,20); return window.__weapons.state().key; });
console.log(hand); await look(0,54,Math.PI*.8,.08,3.6); await shot("bow-void-hand"); 
const draw=await page.evaluate(()=>{ const d=window.__dd; const e=d.spawn("goblin","S"); d.setHero(0,56,Math.PI); d.hero.y=0; d.setCam(Math.PI-.9,.12,4.6); d.step(1/60,5); e.x=0; e.z=46; e.spd=0; d.swing(); for(let i=0;i<40;i++){ d.step(1/60,1); e.x=0; e.z=46; if(window.__bow.arrows()&&i>6) break; } return {arrows:window.__bow.arrows(),clip:d.heroModel().cur}; });
console.log(JSON.stringify(draw)); await shot("bow-void-draw");
await page.evaluate(()=>{ window.__weapons.force(null); }); console.log("errors:",errs.join(" | ")||"none"); await browser.close(); server.close();
