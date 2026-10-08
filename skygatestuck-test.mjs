// ===== NO FLYER HANGS AT THE DRAWBRIDGE'S SKY GATE (build 594; parts/staging/99h-skygate.js). Matt, F9 square 47,1 at 16 up: "at the end of each wave there are flying mobs stuck
// right here". Checked: 24 drakes and moths let in at the sky gate all leave it within 25 s (none still hanging within 4 of the gate); no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const DIST=process.env.DIST||"./dist"; const server=await serve(8871,{dist:DIST});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1000,height:700}});
await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8871/?silent&nogate&map=4",{timeout:180000}); await page.waitForFunction(()=>window.__dd&&window.__skygate&&window.__dd.map&&window.__dd.map().id==='moat',null,{timeout:180000});
const R=await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/30,5); d.S.phase='wave'; d.hero.x=-80; d.hero.z=-80;
  const G=window.__skygate.info().at, gx=d.cw(G[0]), gz=d.cwz(G[1]+((d.map().padN)|0)||G[1]);
  const mine=[]; for(let i=0;i<24;i++){ const n0=d.enemies.length; d.spawn(i%3===2?'moth':'drake','SKY'); for(let k=n0;k<d.enemies.length;k++) mine.push(d.enemies[k]); }
  const at0=mine.map(e=>[+e.x.toFixed(1),+e.z.toFixed(1)]);
  for(let i=0;i<30*25;i++){ d.step(1/30,1); for(const e of mine) if(!e.dead) e.hp=e.max; if(i%60===0) await new Promise(r=>setTimeout(r,0)); }
  const near=mine.filter(e=>!e.dead&&Math.hypot(e.x-at0[mine.indexOf(e)][0],e.z-at0[mine.indexOf(e)][1])<4);
  return { n:mine.length, stuck:near.length, where:near.slice(0,4).map(e=>[+e.x.toFixed(1),+e.z.toFixed(1),+(e.y||0).toFixed(1)]), moved:window.__skygate.info().moved||0, sent:window.__skygate.info().sent }; });
check("every flyer let in at the sky gate leaves it (none still hanging there 25 s on)",R.n===24&&R.stuck===0,JSON.stringify(R));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
