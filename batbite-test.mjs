// build 245: the Bat's bite leaves Matt's Bat Bleeding Bite splash on the mob it bit (the model loads once a Bat is worn; a bite raises one splash at the mob, which pops in and is gone within about half a second)
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8886);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext()).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8886/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__familiar&&window.__bite&&window.__mythicDrops,null,{timeout:90000});
await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; window.__mythicDrops.set(0,0,0); d.start(); d.step(1/60,20); const it=d.rollItem(3,"familiar",10); it.name="Cave Bat of Testing"; it.stats={fdmg:40,frate:40}; M.giveItem(it); M.equip(it.id); d.step(1/60,10); });
for(let i=0;i<200;i++){ await page.evaluate(()=>window.__dd.step(1/60,3)); await page.waitForTimeout(60); if(await page.evaluate(()=>{ const g=window.__familiar.model(); return !!g&&g.userData.glb&&g.userData.kind==="Bat"; })&&i>10&&await page.evaluate(()=>window.__bite.loaded())) break; }
check("the Bat is out and the bite model has loaded",await page.evaluate(()=>{ const g=window.__familiar.model(); return !!g&&g.userData.kind==="Bat"&&window.__bite.loaded(); }));
const r=await page.evaluate(()=>{ const d=window.__dd; d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; d.setHero(0,5,0); d.step(1/60,8);
  const gs=[[-.7,11],[.7,11],[0,12.2]].map(([x,z])=>{ const e=d.spawn("goblin","N"); e.x=x; e.z=z; e.y=0; e.hp=e.max=9999; e.dmg=0; e.atk=999; e.holdT=1e9; return e; }); const n0=window.__bite.count(); d.step(1/60,3); let maxLive=0, first=-1;
  for(let f=0;f<60*5;f++){ d.step(1/60,1); maxLive=Math.max(maxLive,window.__bite.live()); if(first<0&&window.__bite.count()>n0) first=f; }
  for(let f=0;f<60;f++) d.step(1/60,1); return { bites:window.__bite.count()-n0, maxLive, ages:window.__bite.ages(), first }; });
check("each bite raises a splash on the mob (at least two bites in five seconds), and none outlives half a second",r.bites>=2&&r.maxLive>=1&&r.ages.every(a=>a<.56),JSON.stringify(r));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,2).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
