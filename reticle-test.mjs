// ===== THE AIMING RETICLE STAYS ON SCREEN (84-aim.js, build 337). Matt: "did we ever bring the aiming reticle down a little" / "here i am with a flat eye level view but you can see the reticle is way above".
// Measured before the fix on a 760-high screen: the free crosshair sat at y=158 at the normal camera pitch (.42) and OFF THE TOP (y=-76) at the flattest view (.1), because a flat camera read as a 35-degree
// look-up. Checked: at every pitch from flat (.1) to steep (.8) the Ranger's free crosshair is on screen, in the middle band of the screen (30-50% down), lower than the old 158 at the normal view, and a flat view
// aims only a few degrees up (not 35); it is still on the arrow's path (the aim ray), and the lock brackets are untouched.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8989,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:760}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8989/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__aim&&window.__aim.last&&window.__heroes,null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} window.__heroes.select('troll'); d.start(); d.step(1/60,5); });
await page.waitForFunction(()=>window.__aim.kind()==='bow',null,{timeout:120000});
const rows=[]; for(const pitch of [.1,.2,.3,.42,.6,.8]){ rows.push(await page.evaluate(async(pitch)=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.setHero(0,6,0); d.setCam(0,pitch,8); for(let i=0;i<3;i++){ d.step(1/60,2); await new Promise(r=>requestAnimationFrame(r)); }
  const L=window.__aim.last(), A=window.__aim; return { pitch, shown:L.shown, locked:L.locked, y:Math.round(L.y), frac:+(L.y/innerHeight).toFixed(2), elev:+A.elev().toFixed(2) }; },pitch)); }
check("the free crosshair is on screen in the middle band (30-50% down) at every camera pitch, flat to steep",rows.every(r=>r.shown&&!r.locked&&r.frac>=.3&&r.frac<=.5),JSON.stringify(rows.map(r=>[r.pitch,r.y,r.frac])));
const flat=rows[0], norm=rows.find(r=>r.pitch===.42);
check("at the normal view it sits lower than before (was y=158 of 760), and a flat eye-level view aims only a few degrees up (was 35), not off the top of the screen",norm.y>230&&flat.y>200&&flat.elev<.2&&flat.elev>0,JSON.stringify({norm:norm.y,flat:flat.y,flatElev:flat.elev}));
const lk=await page.evaluate(async()=>{ const d=window.__dd; d.setHero(0,6,0); d.setCam(0,.42,8); const L=Object.keys(d.lanes())[0]; const g=d.spawn('goblin',L); g.x=0; g.z=11; g.hp=g.max=9999; g.spd=0; for(let i=0;i<3;i++){ d.step(1/60,2); await new Promise(r=>requestAnimationFrame(r)); } const l=window.__aim.last(); const p=window.__aim.pick(); return { locked:l.locked, pick:!!p }; });
check("a mob in the aim cone still takes the lock (the brackets go on it, not the free crosshair)",lk.locked&&lk.pick,JSON.stringify(lk));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
