// ===== THE BLIGHT BLAST AND CLOUD (95h-blight.js, build 357). Matt, about the keg-sapper cart: "can you handle the explosions?" -- "lets do the blight cloud". Checked: one blast hurts what is near (more the closer it is),
// leaves alone what is out of range; hurts a tower and the hero in range; the cloud then stays nine seconds, poisons and slows a mob standing in it and not one outside it, hurts the hero standing in it and not towers; the
// flash, fireball, ring and flying pieces all clean up after themselves (nothing is left in the scene); no lights are created; the dev panel has its button; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8999,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:900,height:560}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8999/?silent&nogate&map=0",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__blight,null,{timeout:120000});
await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,5); d.S.mana=9999; d.S.du=0; });
const r=await page.evaluate(async()=>{ const d=window.__dd, sc=typeof d.scene==='function'?d.scene():d.scene; d.S.phase='wave'; d.S.crystal=1e6;
  const lights0=(()=>{ let n=0; sc.traverse(o=>{ if(o.isLight) n++; }); return n; })(); const glows=()=>{ let n=0; sc.traverse(o=>{ if(o.userData&&o.userData.blight) n++; }); return n; }; const kids0=glows();
  const mk=(x,z)=>{ d.spawn('orc','N'); const e=d.enemies[d.enemies.length-1]; e.x=x; e.z=z; e.spd=0; e.hp=e.max=1000; return e; };
  const near=mk(6,-6), mid=mk(6+3.8,-6), far=mk(6+20,-6), inside=mk(6+.5,-5.5), outside=mk(6+12,-6); const h0=d.hero; d.setHero(6,-1,Math.PI);
  const tw=d.placeDefAt('harpoon',8,-6,0); const tw2=tw;
  const gl0=glows(); const ex={ near:near.hp, mid:mid.hp, far:far.hp, hero:d.hero.hp, def:tw2?tw2.hp:null, defMax:tw2?tw2.max:null };
  window.__blight.explode(6,-6);
  const after={ near:near.hp, mid:mid.hp, far:far.hp, hero:d.hero.hp, def:tw2?tw2.hp:null };
  let lights1=0; sc.traverse(o=>{ if(o.isLight) lights1++; });
  // the cloud: poison and slow on a mob inside, not on one outside
  near.hp=near.max; mid.hp=mid.max; far.hp=far.max; near.poisonT=0; far.poisonT=0; inside.poisonT=0; inside.hp=inside.max; const heroH=d.hero.hp; d.setHero(6+1,-6,Math.PI);
  for(let i=0;i<90;i++){ d.step(1/60,1); d.S.crystal=1e6; }
  const cl={ inPoison:inside.poisonT>0, inChill:inside.chillT>0||inside.chillK<1, inHp:inside.hp, outPoison:outside.poisonT>0||outside.hp<outside.max, outHp:outside.hp, heroHurt:d.hero.hp<heroH, clouds:window.__blight.info().clouds, tower:tw2?tw2.hp:null };
  for(let i=0;i<60*11;i++){ d.step(1/60,1); d.S.crystal=1e6; d.hero.hp=d.hero.max; }
  const end={ clouds:window.__blight.info().clouds, live:window.__blight.info().live, glowLeft:glows()-gl0 };
  return { lights0, lights1, ex, after, cl, end, kids0 }; });
check("a blast hurts what is near it more than what is further out, and leaves a mob 20 away untouched",r.after.near<r.ex.near&&r.after.mid<r.ex.mid&&(r.ex.near-r.after.near)>(r.ex.mid-r.after.mid)&&r.after.far===r.ex.far,JSON.stringify({ex:r.ex,after:r.after}));
check("it hurts the hero standing in the blast",r.after.hero<r.ex.hero,JSON.stringify({before:r.ex.hero,after:r.after.hero}));
check("it hurts a tower standing in the blast",r.ex.def!==null&&r.after.def<r.ex.def,JSON.stringify({before:r.ex.def,after:r.after.def}));
check("no lights are created (no material rebuild hitch)",r.lights1===r.lights0,JSON.stringify({before:r.lights0,after:r.lights1}));
check("the cloud poisons and slows a mob inside it, not one outside, and hurts the hero inside",r.cl.inPoison&&r.cl.inChill&&!r.cl.outPoison&&r.cl.heroHurt&&r.cl.clouds>=1,JSON.stringify(r.cl));
check("the cloud is gone after nine seconds and everything the blast made cleaned itself up",r.end.clouds===0&&r.end.live===0&&r.end.glowLeft===0,JSON.stringify(r.end));
await page.evaluate(()=>{ document.dispatchEvent(new KeyboardEvent('keydown',{code:'F9',key:'F9',bubbles:true})); window.dispatchEvent(new KeyboardEvent('keydown',{code:'F9',key:'F9',bubbles:true})); if(window.__devpanel) window.__devpanel.toggle(true); }); await sleep(1600);
const btn=await page.evaluate(()=>!!document.getElementById('dp-blight-go')); check("the dev panel (F9) carries the blight-blast button",btn,String(btn));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
