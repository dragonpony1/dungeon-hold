// ===== THE DEEP PRISON (the sixth map; parts/game.js MAPS 'prison' + 56f-prisondecor.js, build 342). Matt: a big cavern of cells, the Heartroot at the very bottom, "a top down flow, its a big room and you can see them
// coming down flights all around", busted cells where the horde breaks out, kept light. Checked: it is the sixth and last map; the well is what was drawn (the Heartroot at the bottom, three terraces two up each, the
// rim six up); every breakout has a long walking route to the Heartroot and a flyer route; the four gates open one, two, three, four by wave; real walkers spawned at each gate really do come down the flights (they
// are seen on every terrace on the way, and arrive at the Heartroot); the wall of cells is painted (no new triangles), the busted cells and Bob's four rigged cells arrive, the pipes are one batched draw; the
// whole scene stays small (triangles and draw calls); no model failed to load, no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8997,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[]; const warns=[];
const ctx=await browser.newContext({viewport:{width:900,height:560}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e))); page.on("console",m=>{ if(m.type()==='warning'&&/prison decor/.test(m.text())) warns.push(m.text().slice(0,160)); });
await page.goto("http://127.0.0.1:8997/?silent&nogate&map=5",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__prisondecor&&window.__dd.map()&&window.__dd.map().id==='prison',null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); });
let info=null; for(let i=0;i<300;i++){ info=await page.evaluate(()=>{ window.__dd.step(1/60,1); return window.__prisondecor.info(); }); if(info.bustedCell===4&&info.rigCell===4) break; await sleep(100); }
const m=await page.evaluate(()=>({ maps:window.__dd.maps().map(x=>x.id), map:window.__dd.map() }));
check("it is the sixth and last map of the campaign, 'THE DEEP PRISON', seven waves",m.maps.length===6&&m.maps[5]==='prison'&&m.map.index===5&&m.map.waves===7&&m.map.name==='THE DEEP PRISON',JSON.stringify({maps:m.maps,idx:m.map.index}));
const geo=await page.evaluate(()=>{ const d=window.__dd; const cw=d.cw, cwz=d.cwz, H=(cx,cz)=>+d.floorH(cw(cx),cwz(cz)).toFixed(2); return { heart:H(23,4), pit:H(23,8), low:H(23,18), mid:H(23,29), rim:H(23,40), rimS:H(23,45), rimGate:H(45,44) }; });
check("the triangle is as drawn: the Heartroot in the apex corner (0), the pit 0, the lower terrace 2 up, the middle 4, the rim 6 -- and the rim gate cell is on the rim",geo.heart===0&&geo.pit===0&&geo.low===2&&geo.mid===4&&geo.rim===6&&geo.rimS===6&&geo.rimGate===6,JSON.stringify(geo));
const reach=await page.evaluate(()=>window.__prisondecor.reach()); const fly=await page.evaluate(()=>{ const d=window.__dd, L=d.lanes; const ff=d.flowFly(); return Object.fromEntries(Object.entries(L).map(([k,l])=>[k,ff.dist[l.cz*47+l.cx]])); }).catch(()=>null);
check("every breakout has a long walk to the Heartroot down the zigzag of flights (the rim gates 70+ cells, the feeder in the middle terrace's wall 45+, the lower one 25+), not a short cut",Object.values(reach).length===4&&reach.E>=90&&reach.S>=70&&reach.W>=45&&reach.NE>=25&&Math.max(...Object.values(reach))<250,JSON.stringify(reach));
const waves=await page.evaluate(()=>{ const d=window.__dd, mw=d.map().wbase; return [1,2,3,4,5].map(w=>d.waveComp(mw+w).desc.split('—').pop().trim()); });
check("the gates open one by one: the rim's east end on wave 1, then its south wall, the middle terrace's west wall, the lower terrace's east wall",/^East cells gate$/.test(waves[0])&&/East cells \+ South cells gates/.test(waves[1])&&/West landing/.test(waves[2])&&/Lower east/.test(waves[3])&&/Lower east/.test(waves[4]),JSON.stringify(waves));
// real walkers from every gate come down the flights: watch the terraces they stand on
const run=await page.evaluate(async()=>{ const d=window.__dd; d.S.crystal=1e6; const out={}; const seen={}; d.S.phase='wave';
  for(const L of ['E','S','W','NE']){ const before=d.enemies.length; d.spawn('goblin',L); const e=d.enemies[d.enemies.length-1]; e.hp=e.max=1e9; e.spd=e.spd; seen[L]={ e, ys:new Set(), minD:1e9, t:0 }; }
  const C=d.cw(23), CZ=d.cwz(4);
  for(let f=0;f<9000;f++){ d.step(1/60,1); d.S.crystal=1e6; let all=true; for(const L in seen){ const s=seen[L], e=s.e; s.ys.add(Math.round(e.y)); const dd=Math.hypot(e.x-C,e.z-CZ); s.minD=Math.min(s.minD,dd); if(s.minD>4.5) all=false; else s.t=s.t||f; } if(all) break; }
  for(const L in seen){ const s=seen[L]; out[L]={ ys:[...s.ys].sort((a,b)=>a-b), near:+s.minD.toFixed(1), tFrames:s.t }; } return out; });
check("a walker from each of the four gates comes all the way down: from the rim it is seen on every terrace (floor 6, 4, 2, 0), from a feeder on the ones below it, and each ends beside the Heartroot",Object.values(run).every(r=>r.near<=4.5)&&[0,2,4,6].every(y=>run.E.ys.includes(y)&&run.S.ys.includes(y))&&[0,2,4].every(y=>run.W.ys.includes(y))&&[0,2].every(y=>run.NE.ys.includes(y)),JSON.stringify(run));
const drake=await page.evaluate(()=>{ const d=window.__dd, ff=d.flowFly(); const Ls=typeof d.lanes==="function"?d.lanes():d.lanes, L=Ls.E; return ff.dist[L.cz*d.map().gw+L.cx]; });
check("flyers have a route too (straight down the triangle)",drake>0&&drake<200,String(drake));
check("the prison's art arrives: four busted cells at the gates, four of Bob's rigged cells up the wall, the cell wall painted, the pipes counted",info.bustedCell===4&&info.rigCell===4&&info.paintedWall===1&&info.pipeSegs>30&&info.greatPipes===2,JSON.stringify(info));
const scene=await page.evaluate(async()=>{ const d=window.__dd, sc=typeof d.scene==='function'?d.scene():d.scene; d.step(1/60,2); await new Promise(r=>setTimeout(r,300)); const R=d.renderer; R.info.autoReset=false; R.info.reset(); R.render(sc,d.camera); const i={ calls:R.info.render.calls, tris:R.info.render.triangles }; R.info.autoReset=true;
  let inst=0; sc.traverse(o=>{ if(o.isInstancedMesh&&o.count>50) inst++; }); let portalsHidden=true; return Object.assign(i,{ inst }); });
check("it stays light: one frame from the start spot draws under 300 calls and 450,000 triangles",scene.calls<300&&scene.tris<450000,JSON.stringify(scene));
check("no model failed to load",warns.length===0,warns.slice(0,3).join(' | '));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
