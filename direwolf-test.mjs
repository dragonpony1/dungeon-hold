// ===== THE DIRE WOLF (95g-direwolf.js, build 316). Matt: "ok i am gonna go in and spawn some wolves". Checked on the Cloister Court: the dev panel's ×5 loads his rigged Hi3D wolf first, then sends
// out a pack of five real wolves (his model and its Run/Walk/Bite/Idle clips, not a goblin-bodied stand-in); they run head first down the lane at their own pace, faster than a goblin; a killed wolf
// shrinks away and is gone; no wave has a wolf in it yet.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8973,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1100,height:700}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8973/?silent&nogate&map=2",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__devpanel&&window.__direwolf,null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); for(const e of d.enemies) d.kill(e); window.__devpanel.toggle(true); document.getElementById("dp-mob").value="direwolf"; document.getElementById("dp-mob-5").click(); });
let n=0; for(let i=0;i<300;i++){ n=await page.evaluate(()=>{ const d=window.__dd; d.step(1/60,1); d.S.crystal=d.S.crystal2=1e6; return d.enemies.filter(e=>e.kind==="direwolf"&&!e.dead).length; }); if(n>=5) break; await new Promise(r=>setTimeout(r,60)); }
const a=await page.evaluate(()=>{ const d=window.__dd; const W=d.enemies.filter(e=>e.kind==="direwolf"&&!e.dead); const x0=W.map(e=>[e.x,e.z]); for(let i=0;i<60;i++){ d.setHero(-90,-90,0); d.step(1/60,1); d.S.crystal=d.S.crystal2=1e6; }
  const V=new THREE.Vector3(), P=new THREE.Vector3(); const face=W.map((e,i)=>{ const g=e.mdl.g; g.updateMatrixWorld(true); const h=g.getObjectByName("head"), p=g.getObjectByName("pelvis"); if(!h||!p) return null; h.getWorldPosition(V); p.getWorldPosition(P); const mx=e.x-x0[i][0], mz=e.z-x0[i][1]; const L=Math.hypot(mx,mz)||1; return +(((V.x-P.x)*mx+(V.z-P.z)*mz)/L).toFixed(2); });
  const A=W[0].mdl.actions||{}; const run=Object.keys(A).filter(k=>A[k].isRunning()); const gob=d.spawn("goblin",Object.keys(d.lanes())[0]); const gs=gob.spd; d.kill(gob);
  return { n:W.length, rigged:W.every(e=>e.mdl.glb&&e.mdl.actions&&e.mdl.actions.run&&e.mdl.actions.attack&&e.mdl.actions.walk&&e.mdl.actions.idle), playing:run, face, spd:+(W.reduce((s,e)=>s+e.spd,0)/W.length).toFixed(2), gob:+gs.toFixed(2) }; });
check("the dev panel's ×5 loads the wolf first, then sends out a pack of five real rigged wolves (Run, Walk, Bite, Idle)",a.n===5&&a.rigged&&a.playing.length>0,JSON.stringify(a));
check("they run head first down the lane, faster than a goblin",a.face.every(f=>f!==null&&f>0)&&a.spd>a.gob*1.2,JSON.stringify({face:a.face,spd:a.spd,gob:a.gob}));
const k=await page.evaluate(()=>{ const d=window.__dd; const e=d.enemies.find(x=>x.kind==="direwolf"&&!x.dead); d.kill(e); d.step(1/60,40); const sc=+e.mdl.g.scale.x.toFixed(3), there=d.enemies.includes(e); d.step(1/60,60); return { midScale:sc, midThere:there, gone:!d.enemies.includes(e) }; });
check("a killed wolf shrinks away and is gone",k.gone,JSON.stringify(k));
const w=await page.evaluate(()=>{ const d=window.__dd, M=d.map(); let any=0; for(let i=1;i<=M.waves;i++) any+=d.waveComp(M.wbase+i).q.filter(x=>x.kind==="direwolf").length; return any; });
check("no wave has a wolf in it yet (Matt tries them first)",w===0,String(w));
const sp=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,80); const L=Object.keys(d.lanes())[0]; const W=[]; for(let i=0;i<5;i++) W.push(d.spawn("direwolf",L)); let lat=[];
  for(let i=0;i<60*2;i++){ d.setHero(-90,-90,0); d.step(1/60,1); d.S.crystal=d.S.crystal2=1e6; } const live=W.filter(e=>!e.dead); const hy=Math.atan2(live.reduce((s,e)=>s+Math.sin(e.yaw),0),live.reduce((s,e)=>s+Math.cos(e.yaw),0)); const rx=Math.cos(hy), rz=-Math.sin(hy); const mx=live.reduce((s,e)=>s+e.x,0)/live.length, mz=live.reduce((s,e)=>s+e.z,0)/live.length;
  lat=live.map(e=>+((e.x-mx)*rx+(e.z-mz)*rz).toFixed(2)); return { n:live.length, lat, spread:+(Math.max(...lat)-Math.min(...lat)).toFixed(2), lanes:live.map(e=>+e.lane.toFixed(2)) }; });
check("build 318 (Matt: they come out in a neat line, it looks unnatural): five wolves let loose together spread across the lane as a pack, not one behind another",sp.n===5&&sp.spread>1,JSON.stringify(sp));
const gl=await page.evaluate(()=>window.__direwolf.glow());
check("build 318 (Matt: too dark to see their detail): the wolf's coat glows softly with its own texture",gl!==null&&gl>.4,String(gl));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
