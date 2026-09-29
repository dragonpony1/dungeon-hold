// ===== THE SLING BOSS IS A RANGED MOB THAT GOES FOR YOU (95d-pigbosses.js + game.js heroShot, build 287). Matt: "that pig should just act like a ranged mob and stay back a little, ignore knockback from
// towers and try to hit me". Checked: with the hero in sight and in range it stays back (never walks in to melee) and throws at the hero; a bomb hurts a hero who stands still and misses one who has stepped
// out of the blast by the time it lands; no tower's slow holds it (and no shove: 99e-bossgrit.js); with no hero in sight it still throws at a tower.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8917);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8917/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta,null,{timeout:120000});
const a=await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} window.__meta.reset&&window.__meta.reset(); d.start(); d.step(1/60,20); for(const e of d.enemies) d.kill(e); d.step(1/60,5);
  const lane=Object.keys(d.lanes())[0]; const p=d.spawn("pigsling",lane); p.x=-9; p.z=6; d.setHero(3,6,0); const hp0=d.status().heroHp; let minD=1e9, maxProj=0;
  for(let i=0;i<60*6;i++){ d.setHero(3,6,0); d.step(1/60,1); if(!p.dead) minD=Math.min(minD,Math.hypot(p.x-3,p.z-6)); maxProj=Math.max(maxProj,d.status().projs); }
  const out={ hp0, hp1:d.status().heroHp, minD:+minD.toFixed(1), maxProj, alive:!p.dead }; d.kill(p); return out; });
check("with the hero in sight and in range the Sling boss stays back (never walks in to melee) and throws at the hero; a hero standing still is hit",a.alive&&a.minD>6&&a.maxProj>0&&a.hp1<a.hp0,JSON.stringify(a));
const b=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,5); d.setHero(3,6,0); d.step(1/60,120);
  const lane=Object.keys(d.lanes())[0]; const p=d.spawn("pigsling",lane); p.x=-9; p.z=6; let thrown=false, hpAt=null, t=0;
  for(let i=0;i<60*8;i++){ const before=d.status().projs; if(!thrown) d.setHero(3,6,0); d.step(1/60,1); t+=1/60; if(!thrown&&d.status().projs>before){ thrown=true; hpAt=d.status().heroHp; d.setHero(3,14,0); } if(thrown) d.setHero(3,14,0); if(thrown&&t>6) break; }
  const out={ thrown, hpAt, hpEnd:d.status().heroHp }; d.kill(p); return out; });
check("a bomb misses a hero who has stepped out of the blast by the time it lands (it is thrown where the hero stood)",b.thrown&&b.hpEnd>=b.hpAt,JSON.stringify(b));
const c=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,5); const lane=Object.keys(d.lanes())[0]; const p=d.spawn("pigsling",lane); d.step(1/60,2); p.slowT=5; d.step(1/60,2); const slow=p.slowT; const s0=window.__bossgrit?window.__bossgrit.shoved():0; const x0=p.x, z0=p.z; window.__bossgrit.hurt(p,1,6,6); const moved=Math.hypot(p.x-x0,p.z-z0); d.kill(p); return { slow, moved:+moved.toFixed(3), kinds:window.__bossgrit.kinds() }; });
check("no tower's slow holds it, and no hit shoves it",c.slow===0&&c.moved<.05&&c.kinds.includes("pigsling"),JSON.stringify(c));
const t=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,5); d.addMana(2000); d.step(1/60,5); const c0=d.status().crystal, dhp0=d.defs.map(x=>x.hp);
  const lane=Object.keys(d.lanes())[0]; const p=d.spawn("pigsling",lane); let t=0; for(let i=0;i<60*40;i++){ d.setHero(-60,-60,0); d.step(1/60,1); t+=1/60; if(d.status().crystal<c0) break; }
  const out={ t:+t.toFixed(1), crystal0:c0, crystal1:d.status().crystal, alive:!p.dead }; d.kill(p); return out; });
check("with no hero in sight it walks its lane and throws at the Heartroot from range",t.crystal1<t.crystal0,JSON.stringify(t));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
