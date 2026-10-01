// ===== THE ARCHER BREAKS THE ROOMS TOO (56g-prisonwalls.js, build 368). Matt: "it was going awesomely till i was on the archer and didn't have a sword" -- only a sword swing or a staff bolt broke the mortar rooms' walls. Checked: while the rooms are
// locked an arrow does nothing; once they are awake the bow's arrows loosed at a wall count as blows (four break it, like a sword), an arrow flying AWAY from a wall or high over it does nothing, and the weapon rolls out as it does for the sword.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8993,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:900,height:560}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8993/?silent&nogate&map=5&noshow",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__bow&&window.__prisonwalls&&window.__mortarwake&&window.__dd.map().id==='prison',null,{timeout:120000});
await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,5); });
for(let i=0;i<300;i++){ const n=await page.evaluate(()=>{ window.__dd.step(1/60,1); return window.__prisonwalls.walls().length; }); if(n===2) break; await new Promise(r=>setTimeout(r,100)); }
// an arrow loosed at a wall from the pit, flying north (-z) into it: from (x, 1.5, 12)
const shoot=(x,dz,y)=>page.evaluate(({x,dz,y})=>{ const d=window.__dd, B=window.__bow; B.fireArrow('ash',new THREE.Vector3(x,y||1.5,dz>0?-8:12),new THREE.Vector3(0,0,dz),40,{ dmg:0 }); for(let i=0;i<50;i++) d.step(1/60,1); return window.__prisonwalls.walls().map(w=>({ id:w.id, hp:w.health, broken:w.broken })); },{x,dz,y});
const L=await shoot(-11,-1); check("while the rooms are locked an arrow does nothing to a wall",L.every(w=>w.hp===100&&!w.broken),JSON.stringify(L));
await page.evaluate(()=>window.__mortarwake.wake());
const hp=[]; for(let k=0;k<4;k++){ const r=await shoot(-11,-1); hp.push(r.find(w=>w.id==='W').hp); }
const afterW=await page.evaluate(()=>window.__prisonwalls.walls().map(w=>({ id:w.id, hp:w.health, broken:w.broken })));
check("once the rooms are awake the archer's arrows break the west wall: each arrow that reaches it is a blow of 25, the fourth bursts it (the east wall untouched)",hp[0]===75&&hp[1]===50&&hp[2]===25&&afterW.find(w=>w.id==='W').broken&&afterW.find(w=>w.id==='E').hp===100,JSON.stringify({ hp, afterW }));
const mort=await page.evaluate(()=>{ const d=window.__dd; for(let i=0;i<60*2;i++) d.step(1/60,1); return window.__prisonwalls.spots().map(s=>({ id:s.id, open:s.open, kind:s.def&&s.def.kind, secret:s.def&&s.def.secret })); });
check("and the secret weapon rolls out of the opened room as it does for a sword",mort.find(s=>s.id==='W').open&&mort.find(s=>s.id==='W').secret&&!mort.find(s=>s.id==='E').open,JSON.stringify(mort));
// an arrow flying away from the east wall (south, from just in front of it) and one loosed high over it do nothing
const away=await page.evaluate(()=>{ const d=window.__dd, B=window.__bow; B.fireArrow('ash',new THREE.Vector3(11,1.5,3),new THREE.Vector3(0,0,1),40,{ dmg:0 }); for(let i=0;i<50;i++) d.step(1/60,1); B.fireArrow('ash',new THREE.Vector3(11,12,12),new THREE.Vector3(0,0,-1),40,{ dmg:0 }); for(let i=0;i<50;i++) d.step(1/60,1); return window.__prisonwalls.walls().find(w=>w.id==='E').health; });
check("an arrow flying away from a wall, or high over it, does nothing",away===100,JSON.stringify({ east:away }));
const E4=await page.evaluate(()=>{ const out=[]; return window.__prisonwalls.info(); });
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
