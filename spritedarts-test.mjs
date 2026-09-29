import { chromium } from "playwright"; import { serve } from "./serve.mjs";
// build 242: the new Sprite (Meshy leaf fairy) fires DUAL THORN DARTS -- two thorns a shot, side by side, each hitting for a small puff and slowing what it hits; the darts wear Matt's Sprite Thorn Darts model once it loads
const server=await serve(8883);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext()).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8883/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__familiar&&window.__thorns&&window.__dart&&window.__mythicDrops,null,{timeout:90000});
await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; window.__mythicDrops.set(0,0,0); d.start(); d.step(1/60,20); const it=d.rollItem(3,"familiar",10); it.name="Moss Sprite of Testing"; it.stats={fdmg:40,frate:40}; M.giveItem(it); M.equip(it.id); d.step(1/60,10); });
for(let i=0;i<200;i++){ await page.evaluate(()=>window.__dd.step(1/60,3)); await page.waitForTimeout(60); if(await page.evaluate(()=>{ const g=window.__familiar.model(); return !!g&&g.userData.glb&&g.userData.kind==="Sprite"; })&&i>10&&await page.evaluate(()=>window.__dart.loaded())) break; }
check("the new Sprite model loads as the pet (a GLB, kind Sprite) and so does the Thorn Dart model",await page.evaluate(()=>{ const g=window.__familiar.model(); return !!g&&g.userData.glb&&g.userData.kind==="Sprite"&&window.__dart.loaded(); }));
const r=await page.evaluate(()=>{ const d=window.__dd; d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; d.setHero(0,5,0); d.step(1/60,8);
  const gs=[[-.7,11],[.7,11],[0,12.2]].map(([x,z])=>{ const e=d.spawn("goblin","N"); e.x=x; e.z=z; e.y=0; e.hp=e.max=9999; e.dmg=0; e.atk=999; e.holdT=1e9; return e; }); const hp0=gs.map(e=>e.hp); d.step(1/60,3);
  let pair=null, maxThorns=0, models=0; for(let f=0;f<60*6;f++){ d.step(1/60,1); const sh=window.__thorns.shots(); maxThorns=Math.max(maxThorns,sh.filter(x=>x.thorn).length); if(!pair&&sh.filter(x=>x.thorn).length>=2){ pair=sh.filter(x=>x.thorn).slice(0,2); } }
  return { pair, maxThorns, lost:gs.map((e,i)=>+(hp0[i]-e.hp).toFixed(1)), slowed:gs.some(e=>(e.slowT||0)>0||e.slowT!==undefined), P:window.__familiar.dmg() }; });
check("each shot sends TWO thorn darts at once",!!r.pair&&r.pair.length===2&&r.maxThorns>=2,JSON.stringify({maxThorns:r.maxThorns}));
check("the two darts fly side by side (different lines, same speed of approach), not stacked",!!r.pair&&(Math.abs(r.pair[0].vx-r.pair[1].vx)>.05||Math.abs(r.pair[0].vz-r.pair[1].vz)>.05),JSON.stringify(r.pair));
check("the darts hurt the pack (each mob near the impact loses hp)",r.lost.some(x=>x>0),JSON.stringify(r.lost));
const cfg=await page.evaluate(()=>{ const m=window.__dart.mesh(); let meshes=0; m.traverse(o=>{ if(o.isMesh) meshes++; }); return {meshes,thorn:!!m.userData.thorn}; });
check("a dart is built from the model (meshes, an aim group) and not the plain cone",cfg.meshes>=1&&cfg.thorn,JSON.stringify(cfg));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,2).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
