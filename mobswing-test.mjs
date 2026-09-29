// ===== A MOB'S OWN ATTACK TIMING (game.js swingT/hitT, builds 288-289). Matt: "it never could actually swing it around", then "i think ogre's have that same problem". Every mob attack used to be a 0.4 s
// swing, its clip squeezed into 0.45 s. Checked: an ogre's smash lasts about 1.1 s and its blow lands as the club comes down (about 0.64 s in); a hero who steps back out of reach before then is not hit;
// the flail and dagger pig bosses swing for 1.8 s and 2.4 s; a goblin's blow still lands 0.2 s in; an ogre still smashes a tower.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8918);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8918/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta,null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} window.__meta.reset&&window.__meta.reset(); d.start(); d.step(1/60,20); for(const e of d.enemies) d.kill(e); d.step(1/60,5); });
// melee at the hero: time from the swing starting to the hero's health dropping; `away` steps the hero out of reach that many seconds into the swing
const blow=(kind,away)=>page.evaluate(({kind,away})=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,5); d.setHero(3,6,0); d.step(1/60,30);
  const lane=Object.keys(d.lanes())[0]; const m=d.spawn(kind,lane); m.x=3+(m.r||.6)+.7; m.z=6; const hp0=d.status().heroHp; let start=null, hit=null, maxSw=0, t=0, moved=false;
  for(let i=0;i<60*6;i++){ if(!moved) d.setHero(3,6,0); else d.setHero(3,14,0); m.x=Math.max(m.x,3+(m.r||.6)+.2); d.step(1/60,1); t+=1/60; if(m.swing>=0&&start===null) start=t; if(m.swing>maxSw) maxSw=m.swing;
    if(start!==null&&away!=null&&!moved&&t-start>=away){ moved=true; d.setHero(3,14,0); } if(start!==null&&hit===null&&d.status().heroHp<hp0) hit=t; if(start!==null&&t-start>2.8) break; }
  const out={ kind, windUp:hit!==null&&start!==null?+(hit-start).toFixed(2):null, hit:hit!==null, maxSwing:+maxSw.toFixed(2), hp0, hp1:d.status().heroHp }; d.kill(m); d.setHero(3,6,0); return out; },{kind,away});
const o=await blow("ogre",null);
check("an ogre's smash lasts about 1.1 s and its blow lands as the club comes down (about 0.64 s in, was 0.2)",o.hit&&o.windUp>=.55&&o.windUp<=.8&&o.maxSwing>=1,JSON.stringify(o));
const od=await blow("ogre",.3);
check("a hero who steps back out of reach before the club lands is not hit",!od.hit,JSON.stringify(od));
const g=await blow("goblin",null);
check("a goblin's blow still lands about 0.2 s in (ordinary mobs unchanged)",g.hit&&g.windUp<=.3,JSON.stringify(g));
const f=await blow("pigflail",null), dg=await blow("pigdagger",null);
check("the flail pig swings for about 1.8 s and the dagger pig for about 2.4 s (their spins played out, not squeezed into 0.45 s)",f.maxSwing>=1.6&&dg.maxSwing>=2.2,JSON.stringify({f,dg}));
const t=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,5); d.setHero(-60,-60,0); d.step(1/60,3); const c0=d.status().crystal; const lane=Object.keys(d.lanes())[0]; const m=d.spawn("ogre",lane); m.x=2.6; m.z=0; let tt=0; for(let i=0;i<60*6;i++){ d.setHero(-60,-60,0); d.step(1/60,1); tt+=1/60; if(d.status().crystal<c0) break; } const out={ t:+tt.toFixed(2), c0, c1:d.status().crystal }; d.kill(m); return out; });
check("an ogre still smashes the Heartroot (structures do not dodge)",t.c1<t.c0,JSON.stringify(t));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
