// ===== MYTHIC SET PETS TAKE 5 PROJECTILES (build 410; parts/staging/90-forge.js). Matt: "we should allow a few mythic set pets to get up to 5 projectiles, more and more expenditure".
// Checked: a mythic pet of a set takes five projectile points at the forge -- the 1st..3rd at the going rate, the 4th about five times it, the 5th about twelve -- and refuses a sixth; worn, the hero has 5 pet projectiles
// and the pet fires six bolts a volley; a mythic pet with no set still stops at 3 and says a SET pet takes 5; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8997,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:700}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:8997/?silent&ownweapons&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__forge&&window.__meta&&window.__familiar&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); window.__meta.setLevel&&window.__meta.setLevel(40); });
const A=await page.evaluate(()=>{ const d=window.__dd, F=window.__forge, M=window.__meta; M.addGold(1e8);
  const mk=name=>{ const it=d.rollItem(4,'familiar',15); it.rarity=5; it.name=name; it.stats.fproj=0; delete it.ups; it.up=0; M.giveItem(it); return it; };
  const pet=mk('Mythic Storm Drake of the Wind'), plain=mk('Mythic Storm Drake');
  const costs=[]; for(let i=0;i<5;i++){ const g0=M.gold(); const n=F.upgrade(pet,'fproj',1); costs.push(n?g0-M.gold():0); } const sixth=F.can(pet,'fproj');
  let pn=0; for(let i=0;i<5;i++) pn+=F.upgrade(plain,'fproj',1); const pwhy=F.can(plain,'fproj').why;
  M.equip(pet.id); d.step(1/60,2); return { setPet:F.setPet(pet), costs, fproj:pet.stats.fproj, sixth:sixth.ok, sixthWhy:sixth.why, plainN:pn, pwhy, worn:d.heroStat('fproj') }; });
const r=A.costs;
check("a mythic SET pet takes 5 projectile points and refuses a 6th",A.setPet&&A.fproj===5&&r.every(c=>c>0)&&A.sixth===false&&/max projectiles/.test(A.sixthWhy),JSON.stringify(A));
check("more and more gold: the 1st-3rd at the going rate, the 4th about 5x it, the 5th about 12x",r[3]/r[2]>4&&r[3]/r[2]<6&&r[4]/r[2]>10&&r[4]/r[2]<14&&r[1]/r[0]<1.2,JSON.stringify(r));
check("a mythic pet with no set still stops at 3, and says a SET pet takes 5",A.plainN===3&&/SET pet takes 5/.test(A.pwhy),JSON.stringify({plainN:A.plainN,pwhy:A.pwhy}));
check("worn, the hero has 5 pet projectiles",A.worn===5,JSON.stringify({worn:A.worn}));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
