// ===== THE NEW STORM DRAKE (build 248): Matt's Storm Drake model is the familiar (fam-drake.glb) and his Storm Drake Lightning model (fam-drake-lightning.glb) is its attack: each strike stretches one bolt from the
// drake to the mob (forks to the pack are the same bolt, a size smaller), it crackles for a third of a second and is gone. Checked: the pet's size, the bolt model turned to lie along X and flat, bolts raised on the
// mobs the drake hits, and none outliving .3 s.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8888);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext()).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8888/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__familiar&&window.__drakebolt&&window.__mythicDrops,null,{timeout:90000});
await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; window.__mythicDrops.set(0,0,0); d.start(); d.step(1/60,20); const it=d.rollItem(3,"familiar",10); it.name="Storm Drake of Testing"; it.stats={fdmg:40,frate:40}; M.giveItem(it); M.equip(it.id); d.step(1/60,10); });
for(let i=0;i<200;i++){ await page.evaluate(()=>window.__dd.step(1/60,3)); await page.waitForTimeout(60); if(i>10&&await page.evaluate(()=>{ const g=window.__familiar.model(); return !!g&&g.userData.glb&&g.userData.kind==="Storm Drake"&&window.__drakebolt.loaded(); })) break; }
check("the Storm Drake is out and its lightning model has loaded",await page.evaluate(()=>{ const g=window.__familiar.model(); return !!g&&g.userData.kind==="Storm Drake"&&g.userData.glb&&window.__drakebolt.loaded(); }));
const sz=await page.evaluate(()=>{ const g=window.__familiar.build({name:"Storm Drake of Testing",rarity:3,slot:"familiar"}); g.updateMatrixWorld(true); const b=new THREE.Box3().setFromObject(g), s=b.getSize(new THREE.Vector3()); return [s.x,s.y,s.z]; });
check("the new drake is the pet: about 1.2 tall and nearly as wide across the wings (the old one was a wider, lower model)",sz[1]>1.1&&sz[1]<1.45&&sz[0]>.9&&sz[0]<1.6,JSON.stringify(sz.map(x=>+x.toFixed(2))));
const bm=await page.evaluate(()=>{ const L=window.__drakebolt.model(); L.updateMatrixWorld(true); const b=new THREE.Box3().setFromObject(L), s=b.getSize(new THREE.Vector3()); return [s.x,s.y,s.z]; });
check("the bolt model is turned to lie along X, length 1, and stays flat",Math.abs(bm[0]-1)<.05&&bm[2]<.15&&bm[1]<1.1,JSON.stringify(bm.map(x=>+x.toFixed(3))));
const r=await page.evaluate(()=>{ const d=window.__dd; d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; d.setHero(0,5,0); d.step(1/60,8);
  [[-.7,11],[.7,11],[0,12.2]].map(([x,z])=>{ const e=d.spawn("goblin","N"); e.x=x; e.z=z; e.y=0; e.hp=e.max=9999; e.dmg=0; e.atk=999; e.holdT=1e9; return e; }); const n0=window.__drakebolt.count(); d.step(1/60,3); let maxLive=0, maxAge=0;
  for(let f=0;f<60*5;f++){ d.step(1/60,1); maxLive=Math.max(maxLive,window.__drakebolt.live()); for(const a of window.__drakebolt.ages()) maxAge=Math.max(maxAge,a); }
  return { bolts:window.__drakebolt.count()-n0, maxLive, maxAge }; });
check("each strike raises a bolt (with forks to the pack: at least three bolts in five seconds), and none outlives .3 s",r.bolts>=3&&r.maxLive>=1&&r.maxAge<=.31,JSON.stringify(r));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,2).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
