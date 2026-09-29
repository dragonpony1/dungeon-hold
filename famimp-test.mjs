import { chromium } from "playwright"; import { serve } from "./serve.mjs";
// build 227: the Fire Imp has no fireball any more (Matt: "no fire ball just the lava drops"): it dives at the pack like the Bat and drops a molten pool that
// burns everything standing in it every 0.5 s for 4.2 s, and sets them burning for a while after they leave
const server=await serve(8877);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext(); const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8877/?silent&nogate"); await page.waitForFunction(()=>window.__dd&&window.__familiar&&window.__lava&&window.__trimaw,null,{timeout:60000});
await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; d.start(); d.step(1/60,20); const it=d.rollItem(3,"familiar",10); it.name="Fire Imp of Testing"; it.stats={fdmg:40,frate:40}; M.giveItem(it); M.equip(it.id); d.step(1/60,10); });
for(let i=0;i<120;i++){ await page.evaluate(()=>window.__dd.step(1/60,3)); await page.waitForTimeout(70); if(await page.evaluate(()=>{ const g=window.__familiar.model(); return !!g&&g.userData.glb&&g.userData.kind==="Fire Imp"; })&&i>10) break; }
const r=await page.evaluate(async()=>{ const d=window.__dd, L=window.__lava, T=window.__trimaw; d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; d.setHero(0,5,0); d.step(1/60,8); L.clear();
  const gs=[[-.7,11],[.7,11],[0,12.2]].map(([x,z])=>{ const e=d.spawn("goblin","N"); e.x=x; e.z=z; e.y=0; e.hp=e.max=9999; e.dmg=0; e.atk=999; e.holdT=1e9; return e; }); const far=d.spawn("goblin","N"); far.x=8; far.z=13; far.y=0; far.hp=far.max=9999; far.dmg=0; far.atk=999; far.holdT=1e9;
  const hp0=gs.map(e=>e.hp), far0=far.hp; d.step(1/60,2); let poolAt=-1, maxShots=0, fireballs=0; const samples=[];
  for(let f=0;f<60*7;f++){ d.step(1/60,1); maxShots=Math.max(maxShots,T.shotMeshes().length); if(poolAt<0&&L.pools()>0) poolAt=f; if(poolAt>=0&&(f-poolAt)%30===0) samples.push({t:+((f-poolAt)/60).toFixed(1),lost:+(hp0[0]-gs[0].hp).toFixed(1),burn:+(gs[0].burnT||0).toFixed(1),pools:L.pools()}); if(poolAt>=0&&L.pools()===0&&f-poolAt>60) break; }
  return {poolAtFrame:poolAt,maxShots,samples,perMob:gs.map((e,i)=>+(hp0[i]-e.hp).toFixed(1)),far:+(far0-far.hp).toFixed(1),poolsLeft:L.pools(),cfg:L.cfg,P:window.__familiar.dmg()}; });
check("no fireball: the Imp flies no projectile at all, and after a dive a lava pool lies where it went",r.poolAtFrame>0&&r.maxShots===0,JSON.stringify({poolAtFrame:r.poolAtFrame,shots:r.maxShots}));
check("mobs standing in the pool take tick after tick of fire damage (it grows through the pool's life), all three in it; the loner far away is untouched",r.perMob.every(x=>x>=r.P*r.cfg.mul*4)&&r.samples.length>=4&&r.samples[2].lost>r.samples[1].lost&&r.samples[3].lost>r.samples[2].lost&&r.far===0,JSON.stringify({P:r.P,perMob:r.perMob,far:r.far,samples:r.samples.slice(0,6)}));
const life=await page.evaluate(async()=>{ const d=window.__dd, L=window.__lava; d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; L.clear(); L.drop(0,11); let f=0; for(;f<60*9&&L.pools()>0;f++) d.step(1/60,1); return {seconds:+(f/60).toFixed(1),left:L.pools()}; });
check("a pool cools away after about four seconds and cleans up",life.left===0&&life.seconds>=3.8&&life.seconds<=4.8,JSON.stringify(life));
// overlapping pools do not stack: a mob in three pools takes the same damage as a mob in one
const stack=await page.evaluate(async()=>{ const d=window.__dd, L=window.__lava; d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; L.clear(); const mk=(x,z)=>{ const e=d.spawn("goblin","N"); e.x=x; e.z=z; e.y=0; e.hp=e.max=9999; e.dmg=0; e.atk=999; e.holdT=1e9; return e; }; const a=mk(-6,20), c=mk(6,20); L.drop(-6,20); L.drop(6,20); L.drop(6,20); L.drop(6,20); const ha=a.hp, hc=c.hp; for(let f=0;f<60*2;f++) d.step(1/60,1); return {one:+(ha-a.hp).toFixed(1),three:+(hc-c.hp).toFixed(1)}; });
check("overlapping pools do not stack: a mob standing in three pools takes about what a mob in one takes",stack.one>0&&stack.three<=stack.one*1.35,JSON.stringify(stack));
// a guest's burn still reaches the host's mob through famHurt (coop-features-test F7) -- here just: the burn lingers after the tick
const b=await page.evaluate(async()=>{ const d=window.__dd, L=window.__lava; d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; L.clear(); const e=d.spawn("goblin","N"); e.x=0; e.z=11; e.y=0; e.hp=e.max=9999; e.dmg=0; e.atk=999; e.holdT=1e9; L.drop(0,11); let burnMax=0; for(let f=0;f<200;f++){ d.step(1/60,1); burnMax=Math.max(burnMax,e.burnT||0); } return {burnMax:+burnMax.toFixed(1)}; });
check("standing in lava sets a mob burning (it lingers after the pool's own ticks)",b.burnMax>=2,JSON.stringify(b));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
