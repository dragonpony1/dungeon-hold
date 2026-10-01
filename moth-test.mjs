// ===== THE SPECTRAL MOTH HORROR (build 422; parts/staging/95t-moth.js). Matt: "the spectral moth flies toward the heartroot and drops moth eggs that do damage".
// Checked: moths join the Throne Room from wave 2 (more later) and not the Gnome Hall; a moth flies toward the Heartroot; it lays eggs on its way (sooner over a tower); an egg falls, lies pulsing, then bursts --
// hurting a tower beside it and the hero; an egg bursting by the Heartroot hurts it; the snare can catch a moth; its model loads; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9007,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1000,height:640}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9007/?silent&nogate&map=1",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__moth&&window.__dd.heroModel(),null,{timeout:120000});
const A=await page.evaluate(()=>{ const d=window.__dd, M=d.map(); const has=w=>d.waveComp(M.wbase+w).q.filter(x=>x.kind==='moth').length; return { id:M.id, w1:has(1), w2:has(2), w4:has(4), w7:has(7) }; });
check("moths join the Throne Room from wave 2 -- one, two from wave 4, three from wave 6 (none in wave 1)",A.id==='throne'&&A.w1===0&&A.w2===1&&A.w4===2&&A.w7===3,JSON.stringify(A));
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); window.__freeze=true; d.S.phase='wave'; d.S.crystal=d.S.crystal2=1e9; window.__moth.load(); });
for(let i=0;i<60&&!(await page.evaluate(()=>window.__moth.loaded()));i++) await sleep(250);
const B=await page.evaluate(()=>{ const d=window.__dd, Mo=window.__moth; for(const e of d.enemies) d.kill(e); d.addMana(99999); d.S.du=-90; d.setHero(-60,-60,0);
  const lane=d.waveComp(d.map().wbase+1).q[0].lane; d.spawn('moth',lane); const m=d.enemies[d.enemies.length-1]; m.hp=m.max=1e5; const d0=Math.hypot(m.x,m.z);
  for(let i=0;i<60*6;i++){ d.step(1/60,1); d.S.crystal=d.S.crystal2=1e9; } const d1=Math.hypot(m.x,m.z); return { model:!!(m.mdl&&m.mdl.glb), d0:+d0.toFixed(1), d1:+d1.toFixed(1), eggs:Mo.info().eggs, flying:+(m.y-0).toFixed(1) }; });
check("its model is Bob's rigged moth",B.model,JSON.stringify(B));
check("it flies toward the Heartroot, high, and lays eggs on the way",B.d1<B.d0-5&&B.flying>2.5&&B.eggs>=2,JSON.stringify(B));
const C=await page.evaluate(()=>{ const d=window.__dd, Mo=window.__moth; for(const e of d.enemies) d.kill(e); for(let i=0;i<120;i++) d.step(1/60,1); const i0=Mo.info();
  const lane=d.waveComp(d.map().wbase+1).q[0].lane; const t=d.placeDefAt('harpoon',6,14,0); const hp0=t.hp; d.setHero(t.x+1,t.z+1,0); const h0=d.hero.hp;
  d.spawn('moth',lane); const m=d.enemies[d.enemies.length-1]; m.hp=m.max=1e5; m.spd=0; m.x=t.x; m.z=t.z; m.y=4; m.eggT=99; m.sinceEgg=5;
  for(let i=0;i<60*3;i++){ d.step(1/60,1); d.S.crystal=d.S.crystal2=1e9; m.x=t.x; m.z=t.z; m.eggT=99; } const i1=Mo.info();
  return { laidOverTower:i1.eggs-i0.eggs, bursts:i1.bursts-i0.bursts, towerLost:hp0-t.hp, heroLost:h0-d.hero.hp }; });
check("over a tower it drops an egg at once; the egg bursts and hurts the tower and the hero beside it",C.laidOverTower>=1&&C.bursts>=1&&C.towerLost>0&&C.heroLost>0,JSON.stringify(C));
const D=await page.evaluate(()=>{ const d=window.__dd, Mo=window.__moth; for(const e of d.enemies) d.kill(e); for(const t of d.defs.slice()) { t.hp=t.max; } d.S.crystal=1000; const c0=d.S.crystal; const lane=d.waveComp(d.map().wbase+1).q[0].lane;
  d.spawn('moth',lane); const m=d.enemies[d.enemies.length-1]; m.hp=m.max=1e5; m.spd=0; m.x=1; m.z=1; m.y=4; m.eggT=0; for(let i=0;i<60*2.5;i++){ d.step(1/60,1); m.x=1; m.z=1; m.eggT=99; } return { crystalLost:c0-d.S.crystal }; });
check("an egg bursting by the Heartroot hurts it",D.crystalLost>0,JSON.stringify(D));
const SN=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); const lane=d.waveComp(d.map().wbase+1).q[0].lane; d.spawn('moth',lane); const m=d.enemies[d.enemies.length-1]; m.hp=m.max=1e5; m.spd=0; const sn=d.placeDefAt('snare',m.x+2,m.z,0); if(sn) sn.cd=0; for(let i=0;i<60*3;i++){ d.step(1/60,1); d.S.crystal=d.S.crystal2=1e9; } return { placed:!!sn, noSnare:!!m.noSnare, caught:!!(m.snared||m.caught||m.snareT>0) }; });
check("the snare tower can't hold a moth (build 428)",SN.noSnare&&!SN.caught,JSON.stringify(SN));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
