import { chromium } from "playwright"; import { serve } from "./serve.mjs";
// build 226: every ordinary familiar drop stands on the floor as its own 3D pet (it used to be the generic loot shape -- the models only loaded once a pet was EQUIPPED),
// plain non-weapon gear still gets no stand, and the asset counter shows a load that finishes between two of its checks
const server=await serve(8876);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext(); const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8876/?silent&ownweapons&nogate"); await page.waitForFunction(()=>window.__dd&&window.__weaponStand&&window.__loadctr,null,{timeout:60000});
await page.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,20); window.__mythicDrops.set(0,0); });   // a drop has a 7% chance to turn into a renamed mythic set piece, which would map to the Wisp: keep the test deterministic
const KINDS=[["Wisp","fam_wisp"],["Cave Bat","fam_bat"],["Moss Sprite","fam_sprite"],["Fire Imp","fam_imp"],["Crystal Owl","fam_owl"],["Storm Drake","fam_drake"]];
const r=await page.evaluate(async KINDS=>{ const d=window.__dd; const out={}; let i=0;
  for(const [name,key] of KINDS){ const it=d.rollItem(2,"familiar",5); it.name=name+" of Testing"; it.id="f"+(i++); d.dropLoot(it,d.hero.x+20+i*3,d.hero.z+20,false); }
  const plain=d.rollItem(2,"armor",5); plain.id="a1"; d.dropLoot(plain,d.hero.x+20,d.hero.z+30,false);
  for(let t=0;t<200;t++){ d.step(1/60,5); await new Promise(r=>setTimeout(r,60)); const names=window.__weaponStand.list().map(s=>s.name); if(KINDS.every(([n,k])=>names.includes("named-"+k))) break; }
  const list=window.__weaponStand.list(); out.names=list.map(s=>s.name).sort(); out.card=list.filter(s=>s.card).length; out.count=list.length; return out; },KINDS);
check("all six pet kinds stand on the floor as their own model, and the plain armor next to them does not",KINDS.every(([n,k])=>r.names.includes("named-"+k))&&r.count===6&&r.card===0,JSON.stringify(r));
// the counter holds a moment after a quick load
const c=await page.evaluate(async()=>{ const d=window.__dd, M=window.__meta, C=window.__loadctr; const seen=[]; const t0=performance.now(); const iv=setInterval(()=>{ seen.push(C.visible()?C.text():"-"); },100);
  const it=d.rollItem(3,"familiar",10); it.name="Storm Drake of Counting"; it.stats={fdmg:40,frate:40}; M.giveItem(it); M.equip(it.id); for(let i=0;i<40;i++){ d.step(1/60,3); await new Promise(r=>setTimeout(r,60)); }
  clearInterval(iv); return {seen:[...new Set(seen)],sawSomething:seen.some(x=>/ASSET/.test(x)),sawLoaded:seen.some(x=>/LOADED/.test(x))}; });
check("equipping a pet shows the counter (LEFT while loading, then ✓ ASSETS LOADED for a moment) -- even when the file lands in a blink",c.sawSomething,JSON.stringify(c));
await page.waitForTimeout(2200);
const gone=await page.evaluate(()=>({visible:window.__loadctr.visible()})); check("...and it goes away again once everything has settled",!gone.visible,JSON.stringify(gone));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
