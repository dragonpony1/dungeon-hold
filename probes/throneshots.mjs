// probe: the throne room (map two) from three fixed viewpoints -- a gate and its door (east lower landing), the throne dais, a chandelier --
// once everything has loaded; the camera is placed directly and the sim frozen, so before/after shots line up pixel for pixel.
// usage: cd <worktree> && DIST=$PWD/dist node probes/throneshots.mjs <tag>  -> parts/shots/throne-<tag>-1..3.png (VIEWS=json overrides the three views)
import { chromium } from "playwright"; import { serve } from "../serve.mjs"; import path from "path";
const SP=path.dirname(path.dirname(new URL(import.meta.url).pathname)); const DIST=process.env.DIST||SP+"/dist"; const TAG=process.argv[2]||"now";
const PORT=8952, BASE="http://127.0.0.1:"+PORT; const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const ctx=await browser.newContext({viewport:{width:1100,height:700}}); const p=await ctx.newPage(); const errors=[]; p.on("pageerror",e=>errors.push(String(e)));
await p.addInitScript(()=>{ try{ localStorage.setItem('ddMapsCleared','1'); }catch(e){} });
await p.goto(BASE+"/?silent&nogate&map=1",{timeout:300000}); await p.waitForFunction(()=>window.__loadtime&&window.__loadtime().all!==null&&window.__dd&&window.__dd.map,null,{timeout:600000,polling:250});
await p.evaluate(()=>{ const d=window.__dd; d.start(); d.setHero(-6,40,Math.PI); d.step(1/60,30); for(const id of ["hud","toast","banner","prompt","ov"]){ const e=document.getElementById(id); if(e) e.style.display="none"; } window.__freeze=true; });
await p.waitForTimeout(1500);
// software GL draws this hall slowly (dozens of point lights): allow minutes per shot
const views=process.env.VIEWS?JSON.parse(process.env.VIEWS):[ {eye:[10,5.5,46],at:[23.6,3.8,46]},   // 1: the east lower-landing gate, its door standing in the feeder's arch, a raked railing beside it
  {eye:[6.5,11.5,2.5],at:[-0.5,10,-6]},              // 2: the throne dais from beside the crystal: seat, both guardian statues, the window behind
  {eye:[7,10.5,57],at:[0,15,46]} ];                  // 3: the middle chandelier over the lower landing, the far one and the dais beyond
for(let i=0;i<views.length;i++){ const v=views[i]; await p.evaluate(v=>{ const c=window.__dd.camera; c.position.set(...v.eye); c.lookAt(...v.at); c.updateMatrixWorld(true); },v);
  const r0=await p.evaluate(()=>window.__dd.renders()); await p.waitForFunction(r0=>window.__dd.renders()>=r0+2,r0,{timeout:600000,polling:500});   // software GL draws this lit hall at a frame every few seconds: let the new view land first
  await p.screenshot({path:SP+"/parts/shots/throne-"+TAG+"-"+(i+1)+".png",timeout:600000}); console.log("saved parts/shots/throne-"+TAG+"-"+(i+1)+".png"); }
console.log("page errors: "+errors.length+(errors.length?" "+errors.slice(0,3).join(" | "):""));
await browser.close(); server.close();
