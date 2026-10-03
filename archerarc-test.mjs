// ===== ARCHERS DON'T PARK BEHIND A TOWER'S ARC (build 508). Matt, Throne Room survival wave 17: "these two get stuck back here every wave" -- two archers in the east feeder of the upper landing,
// shooting a Turnip Trebuchet from behind. Build 161 makes a ranged mob shooting a tower stand inside that tower's REACH so it can answer; a ballista / cannon / trebuchet only fires inside its ARC,
// so from behind it never could, and the wave never ended (the straggler net skips a mob that is attacking). Checked: archers behind a trebuchet's arc walk on (they leave the feeder); archers in
// front of it still stop and trade shots with it; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9018,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
async function run(rot){ const page=await (await browser.newContext({viewport:{width:900,height:600}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
  await page.route(/\/api\//,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
  await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
  await page.goto("http://127.0.0.1:9018/?silent&nogate&map=1",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel(),null,{timeout:120000});
  const r=await page.evaluate(rot=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,30); d.addMana(1e6); d.setHero(0,-100,0);
    const ok=!!d.placeDefAt('ball',(21-13)*2,(14-6)*2,rot); const t=d.defs.find(x=>x.kind==='ball'); if(t){ t.hp=t.max=1e6; } d.S.phase='wave';
    const A=[]; for(let i=0;i<3;i++){ const e=d.spawn('archer','EC'); if(e){ e.hp=e.max=1e9; A.push(e); } } d.step(1/60,60*20);
    return { ok, rot:t&&+t.rot.toFixed(2), towerHurt:t?t.hp<t.max:null, archers:A.map(e=>({x:+e.x.toFixed(1),z:+e.z.toFixed(1),tgt:e.tgtDef?e.tgtDef.kind:null,hurt:e.hp<e.max})) }; },rot);
  await page.context().close(); return r; }
const behind=await run(Math.PI);   // faces north, toward the throne: the feeder (south-east of it) is well outside its 100-degree arc
check("archers behind a trebuchet's arc walk on past it: none still in the east feeder after 20 s, none shooting it",behind.ok&&behind.archers.every(a=>a.x<19&&a.tgt!=='ball'),JSON.stringify(behind));
const front=await run(Math.atan2(22-16,17-16));   // faces the feeder
check("archers in front of it still stop and shoot it, and it answers them",front.ok&&front.towerHurt===true&&front.archers.some(a=>a.tgt==='ball'&&a.hurt),JSON.stringify(front));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
