// ===== THE FEAST HALL'S NEW FLOOR (build 468: the gallery, the wrecked tables, the fire pit). Checked: from each of the three doors a goblin reaches the Heartroot; the gallery stands 5 up with its
// railings, the tables and the pit are drawn; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9021,{dist:process.env.DIST||"./dist"}); const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await (await browser.newContext({viewport:{width:1000,height:640}})).newPage(); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9021/?silent&nogate&map=3",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel(),null,{timeout:120000});
await page.waitForTimeout(3000);
const out=await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); window.__freeze=true; d.setHero(60,60,0); d.S.phase='wave'; const res={ lanes:{}, info:window.__feastwreck.info(), gal:d.hgtAt?d.hgtAt(16,4):null };
  for(const lane of ['E','N','S']){ d.S.crystal=1e9; const c0=d.S.crystal; d.spawn('goblin',lane); const m=d.enemies[d.enemies.length-1]; m.hp=m.max=1e6; let t=0, hit=0; for(;t<120;t+=1/30){ d.step(1/30,1); if(d.S.crystal<c0){ hit=t; break; } }
    res.lanes[lane]={ reachedIn:+(+hit).toFixed(1), at:[+m.x.toFixed(1),+m.z.toFixed(1)] }; d.kill(m); d.step(1/60,5); }
  return res; });
const J=await page.evaluate(()=>{ const d=window.__dd, w=(cx,cz)=>({ x:(cx-5)*2, z:(cz-13)*2 }); d.S.phase='build'; const T=w(21,13);   /* the overturned table across the way to the high table (MAP.wreck [21,13,6,95,1]) */
  let best=null, bx=-1e9; for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){ const p=w(30,22); d.setHero(p.x,p.z,0); d.setCam(yaw,.4,8); d.setKeys({w:1}); d.step(1/60,40); d.setKeys({w:0}); const dx=d.hero.x-p.x; if(dx>bx){ bx=dx; best=yaw; } }
  const run=(jumpIt)=>{ d.setHero(T.x-3.2,T.z,0); d.hero.y=0; d.setCam(best,.4,8); d.step(1/60,5); d.setKeys({w:1}); let jumped=false; for(let i=0;i<120;i++){ if(jumpIt&&!jumped&&d.hero.x>T.x-1.6){ d.jump(); jumped=true; } d.step(1/60,1); } d.setKeys({w:0}); return +(d.hero.x-T.x).toFixed(2); };
  return { walk:run(false), jump:run(true) }; });
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?'PASS ':'FAIL ')+n+(d?'  -> '+d:'')); };
for(const l of ['E','N','S']){ const r=out.lanes[l]; check('a goblin from the '+l+' door reaches the Heartroot',r&&r.reachedIn>0,JSON.stringify(r)); }
check('the tables, the overturned ones, the fire pit and the gallery railings are all there',out.info.tables===5&&out.info.over===2&&out.info.pit&&out.info.rails>20,JSON.stringify(out.info));
check('the hero walking into an overturned table stops at it, and clears it with a jump',J.walk<0&&J.jump>1,JSON.stringify(J));
check('no page errors',errors.length===0,JSON.stringify(errors.slice(0,2))); await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
