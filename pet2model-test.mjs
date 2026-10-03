// ===== THE 2ND PET WEARS ITS REAL MODEL (build 508). Matt, playing survival on his own: "a few things arn't loading in, like my bat, do 2nd pets have any problems". A pet model that finished downloading
// only swapped the FIRST pet out of its stand-in body (85-familiars.js ensureFam / ensureNamedPet check `fam`), so a 2nd pet (97h-tworings.js) that spawned before its model landed kept the plain stand-in all run.
// Checked: a Bat worn as the 2nd pet starts as the stand-in (its model not fetched yet), then wears the real Bat model once it lands; the first pet is untouched; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9012,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route(/\/api\//,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9012/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__tworings&&window.__mythic&&window.__meta&&window.__dd.heroModel(),null,{timeout:120000});
const A=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, R=window.__tworings; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3);
  const ring=window.__mythic.normalize({ tier:'named', named:'beast_mode', lvl:10 }); M.giveItem(ring); M.equip(ring.id);
  const f1=d.rollItem(2,'familiar',8), f2=d.rollItem(3,'familiar',8); f1.name='Wisp Totem'; f2.name='Cave Bat Egg'; M.giveItem(f1); M.giveItem(f2); M.equip(f1.id); R.equip2(f2.id);
  d.S.phase='wave'; d.step(1/60,4); const F2=R.fam2(); return { kind:F2&&F2.g.userData.kind, glb:!!(F2&&F2.g.userData.glb) }; });
let B=null; for(let i=0;i<60;i++){ B=await page.evaluate(()=>{ window.__dd.step(1/60,6); const F2=window.__tworings.fam2(), F1=window.__tworings.fam1(); return { kind:F2&&F2.g.userData.kind, glb:!!(F2&&F2.g.userData.glb), k1:F1&&F1.g.userData.kind, glb1:!!(F1&&F1.g.userData.glb) }; }); if(B.glb) break; await page.waitForTimeout(500); }
check("the 2nd pet (a Bat) starts as the stand-in, then wears the real Bat model once it lands",A.kind==='Bat'&&!A.glb&&B.kind==='Bat'&&B.glb,JSON.stringify({A,B}));
check("the first pet (a Wisp) is still out, in its real model",B.k1==='Wisp'&&B.glb1,JSON.stringify(B));
// build 508 (Matt: "2nd pet needs to have a card pop out so it can be upgraded"): the Tab sheet has a 2ND FAMILIAR plaque with the forge, TAKE OFF, and EQUIP AS 2ND on a spare familiar's card
const T=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, Dl=window.__doll; M.addGold(1e6); d.S.phase='build'; Dl.open(); const pane=document.querySelector('#doll .dl-pane.familiar2'); const b=pane&&pane.querySelector('[data-act="up"][data-slot="familiar2"]:not([disabled])');
  const g=d.gear(), k=b&&b.dataset.key, u0=g.familiar2.up|0, p1=JSON.stringify(g.familiar.stats); if(b) b.click(); const g2=d.gear(); const up=(g2.familiar2.up|0)-u0, p1same=JSON.stringify(g2.familiar.stats)===p1;
  const id=g2.familiar2.id; const off=document.querySelector('#doll .dl-pane.familiar2 [data-act="unequip2"]'); if(off) off.click(); const tookOff=!d.gear().familiar2&&M.bag().some(b=>b.id===id);
  Dl.select(id,'bag'); const eq2=document.querySelector('#doll [data-act="equip2"]'); if(eq2) eq2.click(); const back=!!(d.gear().familiar2&&d.gear().familiar2.id===id); Dl.close();
  return { pane:!!pane, key:k, up, p1same, tookOff, eq2:!!eq2, back }; });
check("the Tab sheet has a 2nd familiar plaque: +1 upgrades the 2nd pet (not the first), TAKE OFF puts it in the bag, EQUIP AS 2ND puts it back",T.pane&&T.up===1&&T.p1same&&T.tookOff&&T.eq2&&T.back,JSON.stringify(T));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
