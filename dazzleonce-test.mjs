// ===== AURAS SLOWER, THE DAZZLE ONCE (build 384; game.js DEFS + updateDefs). Matt: "turn down the aura attacks speed and make it so when a mob is attacked by the dazzling aura it can only be affected once". Checked: the Storm, Venom and Ember
// halos strike half as often as before (cooldowns 3.6, 1.0, 1.0); a goblin walking into a Dazzling Halo is dazed once (about three seconds), and standing in it -- or walking into a second one -- never dazes it again; a fresh goblin is still dazed.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8988,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:900,height:560}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
await page.goto("http://127.0.0.1:8988/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,5); window.__freeze=true; });
const A=await page.evaluate(()=>{ const D=window.__dd.DEFS||null; return D?{ zap:D.zap.cd, venom:D.venom.cd, ember:D.ember.cd }:null; });
check("the Storm, Venom and Ember halos strike half as often (cooldowns 3.6, 1.0, 1.0)",A&&A.zap===3.6&&A.venom===1&&A.ember===1,JSON.stringify(A));
const B=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) e.dead=e.dead||.001; d.S.mana=9999; d.S.du=0; d.S.phase='wave'; d.S.crystal=1e9; d.setHero(-14,10,0);
  const z=d.placeDefAt('dazzle',6,-6,0); d.spawn('goblin','N'); const g=d.enemies.filter(e=>!e.dead).pop(); g.hp=g.max=1e9; g.spd=0; g.x=z.x; g.z=z.z; g.dmg=0;
  const log=[]; let maxT=0, doses=0, prev=0; for(let f=0;f<60*8;f++){ d.step(1/60,1); d.S.crystal=1e9; g.x=z.x; g.z=z.z; const c=g.confuseT||0; if(c>prev+.05) doses++; prev=c; maxT=Math.max(maxT,c); if(f%60===0) log.push(+c.toFixed(2)); }
  const in8=g.confuseT||0; const z2=d.placeDefAt('dazzle',-6,-6,0); for(let f=0;f<60*2;f++){ d.step(1/60,1); g.x=z2.x; g.z=z2.z; } const second=g.confuseT||0;
  d.spawn('goblin','N'); const g2=d.enemies.filter(e=>!e.dead).pop(); g2.hp=g2.max=1e9; g2.spd=0; g2.x=z.x; g2.z=z.z; d.step(1/60,3); g2.x=z.x; g2.z=z.z;
  return { maxT:+maxT.toFixed(2), doses, log, in8:+in8.toFixed(2), second:+second.toFixed(2), fresh:+(g2.confuseT||0).toFixed(2) }; });
check("a goblin standing in a Dazzling Halo is dazed ONCE (about three seconds, one dose) and then never again while it stays there",B.doses===1&&B.maxT>=2.8&&B.maxT<=3.2&&B.in8===0,JSON.stringify(B));
check("walking into a second Dazzling Halo does not daze it again, but a fresh goblin is dazed as before",B.second===0&&B.fresh>2.5,JSON.stringify(B));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
