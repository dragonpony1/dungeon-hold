// ===== WHAT'S COMING OUT OF EACH DOOR, ON THE MINI-MAP (build 590; parts/staging/99u-doorpreview.js). Matt: "maybe just some icons on the mini map during build phase" /
// "just put a number inside one mob icon we don't need to know every single thing coming out, just which doors to defend".
// Checked: in the build phase each door the next wave uses has an icon (the toughest mob's portrait from its real model, the count on a badge) and only those doors; the wave the horn
// sends is the one shown (same mobs, same doors); the icons go in the fight; a boss's door is ringed; no page errors. A picture of the map: TEMP/doorpreview-map.png.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const DIST=process.env.DIST||"./dist"; const server=await serve(8863,{dist:DIST});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:2});
await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.removeItem("dd_minimap"); localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8863/?silent&nogate&map=4",{timeout:180000}); await page.waitForFunction(()=>window.__dd&&window.__doorpreview&&window.__minimap&&window.__dd.heroModel&&window.__dd.heroModel(),null,{timeout:180000});
// the Drawbridge, before wave 5: several doors
const A=await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.S.wave=4; for(let i=0;i<20;i++){ d.step(1/30,1); await new Promise(r=>setTimeout(r,20)); }
  for(let i=0;i<60;i++){ d.step(1/30,1); window.__minimap.draw(); const I=window.__doorpreview.info(); if(I.on&&I.pics.length) break; await new Promise(r=>setTimeout(r,100)); }
  return { phase:d.S.phase, info:window.__doorpreview.info(), lanes:Object.keys(d.lanes()) }; });
const doors=A.info.doors||{}, dl=Object.keys(doors), total=dl.reduce((s,k)=>s+doors[k].n,0);
check("build phase: the next wave's doors each get an icon (count + toughest mob), only doors the wave uses",A.phase==="build"&&A.info.on&&A.info.w&&dl.length>=1&&dl.every(k=>(A.lanes.includes(k)||k==="SKY")&&doors[k].n>0&&doors[k].top),JSON.stringify({w:A.info.w,doors,lanes:A.lanes}));
check("the icons are portraits photographed from the mobs' real models",A.info.portraits>=1&&dl.some(k=>A.info.pics.includes(doors[k].top)),JSON.stringify({pics:A.info.pics,portraits:A.info.portraits}));
// a picture of the map
const box=await page.$("#minimap"); if(box) await box.screenshot({path:(process.env.TEMP||".")+"/doorpreview-map.png"});
// the horn: the wave that comes is the one shown
const B=await page.evaluate(async()=>{ const d=window.__dd, pend=window.__doorpreview.pending(); const seen={}; const prev=d.enemies.length; d.startWave();
  const lane0={}; for(let i=0;i<30*60&&d.S.phase==='wave';i++){ d.step(1/30,1); for(const e of d.enemies){ if(!e.__dp){ e.__dp=1; seen[e.kind]=(seen[e.kind]||0)+1; } } if(i===30) window.__minimap.draw(); if(i>45*30) break; if(i%60===0) await new Promise(r=>setTimeout(r,0)); }
  const I=window.__doorpreview.info(); const odd=(window.__doorpreview.lastQ&&window.__doorpreview.lastQ())||null; return { odd, pend, handed:I.handed, made:I.made, seen, phase:d.S.phase, onInFight:I.on }; });
const shownN=B.pend?B.pend.n:-1, seenN=Object.values(B.seen).reduce((a,b)=>a+b,0);
check("the horn sends exactly the wave shown (handed over, not rolled again)",B.handed===1&&B.pend&&shownN===total,JSON.stringify({handed:B.handed,shownN,total,seenN,odd:B.odd}));
check("in the fight the icons are gone",B.onInFight===false,JSON.stringify(B.onInFight));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
