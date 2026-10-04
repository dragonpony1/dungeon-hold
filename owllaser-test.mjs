// ===== THE CRYSTAL OWL'S LASER (build 250): Matt's Owl Crystal Laser model (fam-owl-laser.glb) is the owl's beam: a run of copies laid end to end from the owl to the mob, and one more run for each hop of the chain
// (up to three mobs), crackling for a third of a second and gone. Checked: the model loads (length 1 along X, flat), each attack raises runs on the mobs it chains through (a hop is a run of its own), and none outlives .3 s.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8889);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext()).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8889/?silent&ownweapons&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__familiar&&window.__owllaser&&window.__mythicDrops,null,{timeout:90000});
await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; window.__mythicDrops.set(0,0,0); d.start(); d.step(1/60,20); const it=d.rollItem(3,"familiar",10); it.name="Crystal Owl of Testing"; it.stats={fdmg:40,frate:40}; M.giveItem(it); M.equip(it.id); d.step(1/60,10); });
for(let i=0;i<200;i++){ await page.evaluate(()=>window.__dd.step(1/60,3)); await page.waitForTimeout(60); if(i>10&&await page.evaluate(()=>{ const g=window.__familiar.model(); return !!g&&g.userData.glb&&g.userData.kind==="Crystal Owl"&&window.__owllaser.loaded(); })) break; }
check("the Crystal Owl is out and its laser model has loaded",await page.evaluate(()=>{ const g=window.__familiar.model(); return !!g&&g.userData.kind==="Crystal Owl"&&g.userData.glb&&window.__owllaser.loaded(); }));
const bm=await page.evaluate(()=>{ const L=window.__owllaser.model(); L.updateMatrixWorld(true); const b=new THREE.Box3().setFromObject(L), s=b.getSize(new THREE.Vector3()); return [s.x,s.y,s.z]; });
check("the laser model is length 1 along X, slim and flat",Math.abs(bm[0]-1)<.05&&bm[1]<.3&&bm[2]<.15,JSON.stringify(bm.map(x=>+x.toFixed(3))));
const r=await page.evaluate(()=>{ const d=window.__dd; d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; d.setHero(0,5,0); d.step(1/60,8);
  [[-.7,11],[.7,11],[0,12.2]].map(([x,z])=>{ const e=d.spawn("goblin","N"); e.x=x; e.z=z; e.y=0; e.hp=e.max=9999; e.dmg=0; e.atk=999; e.holdT=1e9; return e; }); const n0=window.__owllaser.count(); d.step(1/60,3); let maxLive=0, maxAge=0;
  for(let f=0;f<60*5;f++){ d.step(1/60,1); maxLive=Math.max(maxLive,window.__owllaser.live()); for(const a of window.__owllaser.ages()) maxAge=Math.max(maxAge,a); }
  return { runs:window.__owllaser.count()-n0, maxLive, maxAge }; });
check("each attack raises a run for the owl's shot and one for each hop of the chain (at least four runs in five seconds), and none outlives .3 s",r.runs>=4&&r.maxLive>=1&&r.maxAge<=.31,JSON.stringify(r));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,2).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
