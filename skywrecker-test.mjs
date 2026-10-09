// ===== THE SKY WRECKER (build 419; parts/staging/96p-skywrecker.js). Matt: "this new tower is for air" / "add sky wrecker to the archerer".
// Checked: the Gnome Ranger's fifth key; anti-air only (a walker beside it is ignored; a drake in reach gets a volley); its rockets reach the drake and burst, hurting it; the volley grows with the mark
// (Mark III three rockets); Bob's model loads and plays its animation; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9004,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1000,height:640}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9004/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__skywrecker&&window.__heroes&&window.__dd.heroModel(),null,{timeout:120000});
const A=await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} await window.__heroes.select('troll'); d.start(); d.step(1/60,3); window.__freeze=true; return { unlocks:window.__heroes.unlocks().join(), def:d.DEFS.sky&&{mana:d.DEFS.sky.mana,range:d.DEFS.sky.range} }; });
check("the Sky Wrecker is on the Gnome Ranger's keys (his fourth since build 598: the Lookout Perch went to the Engineer)",/acorn,snare,venom,sky/.test(A.unlocks)&&A.def&&A.def.range>=22,JSON.stringify(A));
const B=await page.evaluate(()=>{ const d=window.__dd, S=window.__skywrecker; for(const e of d.enemies) d.kill(e); d.addMana(9999); d.S.du=-50; d.S.phase='wave'; d.S.crystal=1e9; d.setHero(-30,-30,0);
  const t=d.placeDefAt('sky',0,-8,0); window.__sky=t; t.cd=0; d.spawn('goblin','N'); const g=d.enemies[d.enemies.length-1]; g.spd=0; g.atk=1e9; g.x=t.x+3; g.z=t.z; g.hp=g.max=999;
  for(let i=0;i<60;i++) d.step(1/60,1); const walker={ volleys:S.info().volleys, gHp:g.hp };
  d.spawn('drake','N'); const dr=d.enemies[d.enemies.length-1]; dr.spd=0; dr.atk=1e9; dr.x=t.x+8; dr.z=t.z+4; dr.hp=dr.max=5000; window.__drk=dr; t.cd=0;
  d.step(1/60,2); const v=S.info(); for(let i=0;i<60*3;i++){ d.step(1/60,1); dr.x=t.x+8; dr.z=t.z+4; } return { walker, volleys:v.volleys, rockets:v.rockets, after:S.info(), drakeHp:dr.hp }; });
check("anti-air only: a walker beside it is left alone; a drake in reach gets a volley",B.walker.volleys===0&&B.walker.gHp===999&&B.volleys>=1,JSON.stringify(B));
check("the rockets reach the drake and burst, hurting it",B.after.bursts>=1&&B.after.hits>=1&&B.drakeHp<5000,JSON.stringify({after:B.after,drakeHp:B.drakeHp}));
const C=await page.evaluate(()=>{ const d=window.__dd, S=window.__skywrecker, t=window.__sky; t.lvl=3; const r0=S.info().rockets; S.volley(t); return { fired:S.info().rockets-r0 }; });
check("the volley grows with the mark: Mark III fires three rockets",C.fired===3,JSON.stringify(C));
let D=null; for(let i=0;i<40;i++){ D=await page.evaluate(()=>{ const d=window.__dd; for(let k=0;k<10;k++) d.step(1/60,1); return { tpl:!!window.__sky.mdl.userData.tpl, mixers:window.__skywrecker.info().mixers }; }); if(D.tpl&&D.mixers>0) break; await sleep(250); }
check("Bob's model is the tower and its animation plays",D.tpl&&D.mixers>0,JSON.stringify(D));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
