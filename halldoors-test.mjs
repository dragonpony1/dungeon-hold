// ===== DOORS ON MAP ONE (56-halldoors.js, build 141): the throne room's gothic door stands in each of the Gnome Hall's three
// spawn archways, from a slim copy of the model (textures cut to 1024 px); map two keeps its own doors and gets no extra.
// Since the throne-room slim pass map two's doors are that same slim file (56-thronedecor.js, throneload-test.mjs), so the
// 7.6 MB original is no longer shipped at all: check 2 now checks that instead of comparing against it.
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path"; import fs from "fs";
const SP=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/,"")); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8935, BASE="http://127.0.0.1:"+PORT; const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const page=await browser.newPage({viewport:{width:1100,height:700}}); page.on("pageerror",e=>errors.push(String(e)));
await page.goto(BASE+"/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__halldoors,null,{timeout:60000});
await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); });
const got=await page.waitForFunction(()=>window.__halldoors.placed().length>=3,null,{timeout:90000}).then(()=>true).catch(()=>false);
const d=await page.evaluate(()=>({map:window.__dd.map().id,placed:window.__halldoors.placed(),inWorld:(()=>{ let n=0; window.__dd.scene.traverse(o=>{ if(o.userData&&o.userData.hallDoor) n++; }); return n; })()}));
check("map one: a door stands in each of the hall's three spawn archways (North, West, East), in the world",got&&d.map==='hall'&&d.placed.map(p=>p.lane).sort().join()==='E,N,W'&&d.inWorld===3,JSON.stringify(d));
const raw=fs.statSync(SP+"/parts/assets/hall-door.glb").size, big=fs.existsSync(SP+"/parts/assets/throne-door.glb"), bigDist=fs.readdirSync(DIST+"/assets").filter(f=>/^throne-door\./.test(f));
check("the hall's door is the slim copy, under 1 MB -- and the one door file for both maps: the 7.9 MB throne-door original is gone from the source and the build",raw<1024*1024&&!big&&!bigDist.length&&fs.existsSync(DIST+"/assets/hall-door.glb.txt"),JSON.stringify({raw,throneDoorSource:big,throneDoorDist:bigDist}));
try{ await page.evaluate(()=>{ const dd=window.__dd; dd.setHero(0,-21); dd.setHeroYaw&&dd.setHeroYaw(Math.PI); dd.setCam&&dd.setCam(Math.PI,.12,5.5); dd.step(1/60,20); }); await page.screenshot({path:SP+"/parts/shots/hall-door-north.png",timeout:60000}); console.log("screenshot saved"); }catch(e){ console.log("screenshot skipped: "+String(e).slice(0,80)); }
await page.evaluate(()=>{ try{ localStorage.setItem('ddMapsCleared','1'); }catch(e){} });
await page.goto(BASE+"/?silent&nogate&map=1",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__halldoors,null,{timeout:60000});
await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); }); await page.waitForTimeout(3000);
const two=await page.evaluate(()=>({map:window.__dd.map().id,placed:window.__halldoors.placed().length}));
check("map two keeps its own doors and gets none from the hall module",two.map==='throne'&&two.placed===0,JSON.stringify(two));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
