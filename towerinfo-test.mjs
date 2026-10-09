// ===== WHAT IS THIS TOWER? (build 572; parts/staging/99q-towerinfo.js). Matt: "there should be a way to mouse over the diffent towers and read a short explanation of what it is".
// Checked: every tower the game has gets a short line; facing a tower in the hall shows its card (icon, name, mark, line) under the crosshair and it goes when you turn away; pointing at a tower's
// button on the bar shows the same card above the button.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8859,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const p=await (await browser.newContext({viewport:{width:1300,height:800}})).newPage(); p.on("pageerror",e=>errors.push(String(e)));
await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
await p.goto("http://127.0.0.1:8859/?silent&nogate",{timeout:120000}); await p.waitForFunction(()=>window.__dd&&window.__towerinfo&&window.__dd.heroModel(),null,{timeout:120000});
const A=await p.evaluate(()=>{ const L=window.__towerinfo.LINE; const keys=[...document.querySelectorAll('#hotbar .slot')].map(s=>s.id.slice(5)); return { keys, missing:keys.filter(k=>!L[k]) }; });
check("every tower on the bar has its short line",A.keys.length>=4&&A.missing.length===0,JSON.stringify(A));
const B=await p.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); window.__freeze=true; d.S.phase='build'; d.S.mana=9999;
  const h=d.hero, yaw=h.yaw||0; const t=d.placeDefAt('harpoon',h.x+Math.sin(yaw)*2,h.z+Math.cos(yaw)*2,0); d.step(1/60,3); await new Promise(r=>setTimeout(r,400)); const on=window.__towerinfo.info();
  h.yaw=yaw+Math.PI; d.defs.splice(d.defs.indexOf(t),1); d.step(1/60,3); await new Promise(r=>setTimeout(r,400)); return { placed:!!t, on, off:window.__towerinfo.info() }; });
check("facing a Saw Blade Gunner (was the Ballista, build 597) in the hall: its card under the crosshair -- 🪚, the name, Mark I and its line",B.placed&&B.on.shown&&B.on.mode==='world'&&/Saw Blade Gunner/.test(B.on.text)&&/Mark I/.test(B.on.text)&&/long way/.test(B.on.text),JSON.stringify(B.on));
check("no tower in front: the card goes",!B.off.shown,JSON.stringify(B.off));
const C=await p.evaluate(async()=>{ const d=window.__dd; d.S.phase='build'; const H=window.__heroes; const u=(typeof H.unlocks==='function'?H.unlocks():H.unlocks)||['harpoon']; const k=u.includes('harpoon')?'harpoon':u[0]; document.getElementById('slot-'+k).click(); await new Promise(r=>setTimeout(r,400)); const on=window.__towerinfo.info(); window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'})); document.getElementById('slot-'+k).click(); await new Promise(r=>setTimeout(r,400)); return { k, on, after:window.__towerinfo.info(), line:window.__towerinfo.LINE[k], name:window.__dd.DEFS?null:null }; });
check("picking a tower to build: its card (with its line) sits above the bar while you place it",C.on.shown&&C.on.mode==='place'&&C.on.text.includes(C.line),JSON.stringify(C));
check("put away (picked again): the card goes",!C.after.shown,JSON.stringify(C.after));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
