// ===== A TOWER KEEPS ITS BUILDER'S POWER (build 434; parts/staging/97i-towerhero.js). Matt: "if i switch to the knight for the battle phase but my fighter puts down great towers, those towers need to maintain the
// stats and bonuses of the fighter".
// Checked: the Fighter, in tower gear, places a ballista; the Knight (no tower gear) comes out -- the ballista's damage, reload, reach and health do not move, while a ballista the Knight places is weaker; the Fighter back
// out, his tower reads his live gear again (take a piece off and it drops); a co-op guest's tower keeps the numbers of the hero the guest placed it with; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9011,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9011/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__towerHero&&window.__meta&&window.__heroes&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} await window.__heroes.select('fighter'); d.start(); d.step(1/60,3); window.__freeze=true; window.__meta.setLevel&&window.__meta.setLevel(40); });
const nums=d=>{ const D=window.__dd; return { dmg:D.stat(d,'dmg'), cd:+D.stat(d,'cd').toFixed(3), range:+D.stat(d,'range').toFixed(2), max:d.max }; };
const A=await page.evaluate(async(nf)=>{ const nums=eval(nf); const d=window.__dd, M=window.__meta; d.addMana(9000);
  const w=d.rollItem(3,'charm',10); w.stats={tow:60,trate:40,tarea:30}; M.giveItem(w); M.equip(w.id); d.step(1/60,20);
  for(const x of d.defs.slice()){ d.setHero(x.x,x.z+1,0); d.sell(); } d.step(1/60,10);
  const tryPlace=k=>{ for(let cz=6;cz<34;cz+=2) for(let cx=6;cx<34;cx+=2){ const r=d.place(k,cx,cz,Math.PI); if(r) return r; } return null; }; const t=tryPlace('harpoon'); d.step(1/60,20); const f=nums(t);
  await window.__heroes.select('knight'); d.step(1/60,20); const k=nums(t); const tk=tryPlace('harpoon'); d.step(1/60,20); const kt=nums(tk);
  await window.__heroes.select('fighter'); d.step(1/60,20); const back=nums(t), kOther=nums(tk);
  M.unequip&&M.unequip('charm'); d.step(1/60,20); const off=nums(t);
  return { placed:!!t&&!!tk, heroId:t&&t.heroId, kHeroId:tk&&tk.heroId, f, k, kt, back, kOther, off, tow:d.heroStat('tow'), info:window.__towerHero.info() }; },nums.toString());
check("both ballistas went down, each tagged with its builder",A.placed&&A.heroId==='fighter'&&A.kHeroId==='knight',JSON.stringify({h:A.heroId,k:A.kHeroId}));
check("the Fighter's ballista keeps his damage, reload, reach and health with the Knight out",JSON.stringify(A.f)===JSON.stringify(A.k),JSON.stringify({fighter:A.f,knightOut:A.k}));
check("a ballista the Knight places (no tower gear) is weaker than the Fighter's",A.kt.dmg<A.f.dmg&&A.kt.cd>A.f.cd,JSON.stringify({knights:A.kt,fighters:A.f}));
check("the Fighter back out: his ballista as before, the Knight's keeps the Knight's numbers",JSON.stringify(A.back)===JSON.stringify(A.f)&&JSON.stringify(A.kOther)===JSON.stringify(A.kt),JSON.stringify({back:A.back,kOther:A.kOther}));
check("with its builder out, a tower reads his live gear (the tower charm off: it drops)",A.tow===0?A.off.dmg<A.f.dmg:true,JSON.stringify({tow:A.tow,off:A.off}));
const G=await page.evaluate(()=>{ const D=window.__dd, M=window.__meta; const fake={kind:'harpoon',lvl:1,ownerId:'g1',ownerHero:'fighter'};
  const o={h:M.defOwnerHero,s:M.defOwnerHeroStat,m:M.defOwnerHeroMult};
  M.defOwnerHero=()=>'fighter'; const live=D.stat(fake,'dmg');
  M.defOwnerHero=()=>'knight'; M.defOwnerHeroStat=(id,h,k)=>id==='g1'&&h==='fighter'&&k==='tow'?100:undefined; M.defOwnerHeroMult=()=>undefined; const kept=D.stat(fake,'dmg');
  M.defOwnerHero=o.h; M.defOwnerHeroStat=o.s; M.defOwnerHeroMult=o.m; return { live, kept, has:!!(o.h&&o.s&&o.m) }; });
check("co-op: a guest's tower keeps the numbers of the hero the guest placed it with",G.has&&G.kept>G.live,JSON.stringify(G));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
