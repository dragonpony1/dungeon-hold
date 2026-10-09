// ===== MOBS STRIKE A BRAMBLE HEDGE (build 437). Matt: "are bramble hedges taking damage?" -- they were not: a hedge is five squares wide and a mob held at it aimed at its middle, out of reach, and stood there.
// Checked: the Heartroot ringed in hedges; a goblin and an orc walk in, strike a hedge within 2 s of arriving, and take thorns back.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9014,{dist:process.env.DIST||"./dist"}); const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await (await browser.newContext({viewport:{width:1000,height:640}})).newPage(); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9014/?silent&nogate&map=1",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel(),null,{timeout:120000});
const out=await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); window.__freeze=true; d.S.crystal=d.S.crystal2=1e9; d.setHero(-60,-60,0); d.addMana(1e7); d.S.phase='wave';
  for(const R of [5,6.5]) for(let a=0;a<64;a++) d.placeDefAt('spike',Math.cos(a/64*6.283)*R,Math.sin(a/64*6.283)*R,0); d.step(1/60,30);
  const hedges=d.defs.filter(x=>x.kind==='spike'); const lane=d.waveComp(d.map().wbase+1).q[0].lane; const res={ hedges:hedges.length, max:hedges[0]&&hedges[0].max, kinds:{} };
  for(const kind of ['goblin','orc']){ for(const h of hedges) h.hp=h.max; d.spawn(kind,lane); const mob=d.enemies[d.enemies.length-1]; mob.hp=mob.max=1e5;
    let t=0, hit=0, arr=0; const hp0=new Map(hedges.map(h=>[h,h.hp])); for(;t<90;t+=1/60){ d.step(1/60,1); d.S.crystal=d.S.crystal2=1e9; let lost=0; for(const h of hedges) lost+=Math.max(0,hp0.get(h)-h.hp); if(lost>0&&!hit) hit=t; if(!arr&&Math.hypot(mob.x,mob.z)<10) arr=t; if(hit&&t-hit>8) break; }
    let lost=0, worst=0; for(const h of hedges){ const l=hp0.get(h)-h.hp; if(l>0){ lost+=l; worst=Math.max(worst,l); } } res.kinds[kind]={ arrivedAt:+(+arr).toFixed(1), firstHitAt:+(+hit).toFixed(1), hedgeLostTotal:Math.round(lost), worstHedgeLost:Math.round(worst), thornsDealt:Math.round(1e5-mob.hp), mobDmg:mob.dmg, toHeart:+Math.hypot(mob.x,mob.z).toFixed(1) }; d.kill(mob); d.step(1/60,10); }
  return res; });
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?'PASS ':'FAIL ')+n+(d?'  -> '+d:'')); };
for(const k of ['goblin','orc']){ const r=out.kinds[k]; check('a '+k+' held at a hedge strikes it (within 2 s of arriving) and takes thorns back',r&&r.arrivedAt>0&&r.hedgeLostTotal>0&&r.firstHitAt-r.arrivedAt<2&&r.thornsDealt>0,JSON.stringify(r)); }
check('no page errors',errors.length===0,JSON.stringify(errors.slice(0,2))); await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
