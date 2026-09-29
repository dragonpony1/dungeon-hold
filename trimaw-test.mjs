import { chromium } from "playwright"; import { serve } from "./serve.mjs";
// build 222: TRIMAW, the magma hydra -- Throne Room survival wave 50's reward pet. Reward-only, wears the hydra, three heads breathe fire (burn),
// frost (slow) and venom (poison) at three targets, everything it hits is marked (+25% from everything), forge upgrade cap 400
const server=await serve(8874);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext(); const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8874/?silent&nogate"); await page.waitForFunction(()=>window.__dd&&window.__trimaw&&window.__mythic&&window.__mythicDrops&&window.__familiar,null,{timeout:60000});
const it0=await page.evaluate(()=>{ const M=window.__mythic, N=M.NAMED.trimaw; const it=M.normalize({tier:"named",named:"trimaw"}); const rolled=new Set(); for(let i=0;i<400;i++){ const x=window.__mythicDrops.namedItem(); if(x) rolled.add(x.named); }
  return {has:!!N,slot:it&&it.slot,reward:N&&N.reward,rolledNever:!rolled.has("trimaw"),cap:window.__dd.Meta&&window.__dd.Meta.forge?window.__dd.Meta.forge.max(it):null}; });
check("Trimaw is a reward-only named familiar: 400 random named drops never roll it",it0.has&&it0.slot==="familiar"&&it0.reward&&it0.rolledNever,JSON.stringify(it0));
const cap=await page.evaluate(()=>{ const F=window.__meta&&window.__meta.forge?window.__meta.forge:null; const tri=window.__mythic.normalize({tier:"named",named:"trimaw"}), other=window.__mythic.normalize({tier:"named",named:"bramblewhisk"}); return F?{tri:F.max(tri),other:F.max(other)}:{note:"no forge hook on __meta"}; });
check("its forge upgrade cap is 400 (an ordinary mythic's is 260)",cap.tri===400&&cap.other===260,JSON.stringify(cap));
await page.evaluate(()=>{ const d=window.__dd; d.start(); d.step(1/60,20); const it=window.__mythic.normalize({tier:"named",named:"trimaw"}); window.__meta.giveItem(it); window.__meta.equip(it.id); d.step(1/60,10); });
for(let i=0;i<150;i++){ await page.evaluate(()=>window.__dd.step(1/60,3)); await page.waitForTimeout(80); if(await page.evaluate(()=>{ const g=window.__familiar.model(); return !!g&&g.userData.named==="trimaw"; })) break; }
const body=await page.evaluate(()=>{ const g=window.__familiar.model(); return {named:g&&g.userData.named,glb:g&&g.userData.glb,worn:window.__trimaw.worn()}; });
check("equipped, Trimaw wears its own hydra (not the Wisp's body)",body.named==="trimaw"&&body.glb&&body.worn,JSON.stringify(body));
// three goblins in a row: one volley = three shots, three effects, all marked
const vol=await page.evaluate(async()=>{ const d=window.__dd, T=window.__trimaw; d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; d.setHero(0,5,0); d.step(1/60,5);
  const gs=[[-1.2,11],[0,11],[1.2,11]].map(([x,z])=>{ const e=d.spawn("goblin","N"); e.x=x; e.z=z; e.y=0; e.hp=e.max=9999; e.dmg=0; e.atk=999; e.holdT=1e9; return e; }); d.step(1/60,3);
  const f0=T.fired(), h0=T.hits(); const ok=T.fire(gs[1]); for(let i=0;i<70;i++) d.step(1/60,1);
  const st=gs.map(e=>({hp:e.max-e.hp,burn:+(e.burnT||0).toFixed(1),slow:+(e.slowT||0).toFixed(1),poison:+(e.poisonT||0).toFixed(1),mark:+(e.markT||0).toFixed(1)}));
  window.__tg=gs; return {ok,fired:T.fired()-f0,hits:T.hits()-h0,st}; });
check("a volley fires three shots (fire, frost, venom): the goblins end up burning, slowed and poisoned, all marked and hurt",vol.ok&&vol.fired>=1&&vol.hits>=3&&vol.hits%3===0&&vol.st.some(s=>s.burn>0)&&vol.st.some(s=>s.slow>0)&&vol.st.some(s=>s.poison>0)&&vol.st.every(s=>s.mark>0&&s.hp>0),JSON.stringify(vol));
// the mark: +25% from everything (the hero's own hit included)
const mk=await page.evaluate(()=>{ const d=window.__dd, G=window.__tg; const a=G[0], b=d.spawn("goblin","N"); b.x=6; b.z=12; b.y=0; b.hp=b.max=9999; b.dmg=0; b.atk=999; b.holdT=1e9; a.markT=3; a.burnT=0; a.poisonT=0; const h0=a.hp, i0=b.hp; window.__mythic.hurt(a,100); window.__mythic.hurt(b,100); return {marked:+(h0-a.hp).toFixed(1),plain:+(i0-b.hp).toFixed(1)}; });
check("a marked mob takes 25% more from a plain hit (125 vs 100)",mk.marked===125&&mk.plain===100,JSON.stringify(mk));
// the marks and the poison wear off
const gone=await page.evaluate(()=>{ const d=window.__dd; d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; const e=d.spawn("goblin","N"); e.x=0; e.z=60; e.y=0; e.hp=e.max=9999; e.dmg=0; e.atk=999; e.holdT=1e9; e.markT=3; e.poisonT=4; e.poisonDmg=1; const s0={mark:e.markT,poison:e.poisonT}; d.step(1/60,60*7); return [{start:s0,mark:+(e.markT||0).toFixed(1),poison:+(e.poisonT||0).toFixed(1),alive:!e.dead}]; });
check("marks and poison wear off on their own",gone.every(g=>g.mark<=0&&g.poison<=0),JSON.stringify(gone));
const ctx2=await browser.newContext(); const page2=await ctx2.newPage(); page2.on("pageerror",e=>errors.push(String(e))); await page2.goto("http://127.0.0.1:8874/?silent&nogate"); await page2.waitForFunction(()=>window.__dd&&window.__trimaw,null,{timeout:60000});
const rw=await page2.evaluate(()=>{ const d=window.__dd, T=window.__trimaw; d.start(); d.step(1/60,5); const a=T.reward(); d.step(1/60,5); const dropped=d.loot.map(l=>l.it&&l.it.named).filter(Boolean); window.__meta.giveItem(window.__mythic.normalize({tier:"named",named:"trimaw"})); const b=T.reward(); return {first:a,dropped,secondWhenOwned:b}; });
check("holding survival wave 50 drops Trimaw by the crystal once, and never again if you already own it",rw.first&&rw.dropped.includes("trimaw")&&rw.secondWhenOwned===false,JSON.stringify(rw));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
