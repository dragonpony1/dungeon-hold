// ===== DIFFICULTY LEVELS (build 415; parts/staging/95r-difficulty.js). OJ's idea, Matt: "I agree" -- EASY / NORMAL / HARD / NIGHTMARE: more mobs (never faster), more health and damage, more gold and better loot.
// Checked: the title row (NORMAL out of the box); a wave's mob count follows the level (copies of ordinary mobs only, spread over the wave -- no boss doubled); health and damage on spawn; gold for a wave held;
// mythic drop chances; the pick is remembered; a map held records its medal; a guest takes its host's level; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9002,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ if(!sessionStorage.getItem('__df')){ sessionStorage.setItem('__df','1'); localStorage.removeItem('dd_difficulty'); localStorage.removeItem('dd_diff_best'); } localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:9002/?silent&nogate&map=2",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__difficulty&&window.__mythicDrops&&document.getElementById('diffline'),null,{timeout:120000});
const A=await page.evaluate(()=>{ const r=document.getElementById('diffline'); const b=[...r.querySelectorAll('button.dl')]; return { n:b.length, sel:(r.querySelector('.sel')||{}).textContent, id:window.__difficulty.id(), text:r.textContent }; });
check("the title has the DIFFICULTY row: EASY, NORMAL, HARD, NIGHTMARE -- NORMAL out of the box",A.n===4&&/NORMAL/.test(A.sel)&&A.id==='normal',JSON.stringify(A));
const B=await page.evaluate(()=>{ const d=window.__dd, D=window.__difficulty, M=d.map(), w=M.wbase+3; const BOSS=new Set(['corruptor','trollboss','pigflail','pigdagger','pigsling','cyclops','archhag','firecart','kegcart']);
  const count=id=>{ D.set(id,true); const c=d.waveComp(w); const ts=c.q.map(x=>+x.t||0); return { n:c.q.length, boss:c.q.filter(x=>BOSS.has(x.kind)).length, t0:Math.min(...ts), t1:Math.max(...ts) }; };
  const r={ normal:count('normal'), easy:count('easy'), hard:count('hard'), nightmare:count('nightmare') }; D.set('normal',true); return r; });
const k=x=>+(B[x].n/B.normal.n).toFixed(2);
check("a wave's mobs follow the level -- about 0.7x, 1.4x, 1.8x -- the extras spread over the wave's own span, no boss doubled",k('easy')>.6&&k('easy')<.8&&k('hard')>1.3&&k('hard')<1.5&&k('nightmare')>1.65&&k('nightmare')<1.95&&B.nightmare.t1<=B.normal.t1+1&&B.nightmare.boss===B.normal.boss,JSON.stringify({ratios:{easy:k('easy'),hard:k('hard'),nightmare:k('nightmare')},B}));
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); window.__freeze=true; });
const C=await page.evaluate(()=>{ const d=window.__dd, D=window.__difficulty; const lane=d.waveComp(d.map().wbase+1).q[0].lane; const sp=id=>{ D.set(id,true); d.spawn('goblin',lane); const g=d.enemies[d.enemies.length-1]; const r={hp:g.max,dmg:g.dmg,spd:g.spd}; d.kill(g); return r; };
  const n=sp('normal'), h=sp('nightmare'); D.set('normal',true); return { n, h, hpK:+(h.hp/n.hp).toFixed(2), dmgK:+(h.dmg/n.dmg).toFixed(2), spdK:+(h.spd/n.spd).toFixed(2) }; });
check("NIGHTMARE: health x1.5 and damage x1.25 as they spawn, and no faster",Math.abs(C.hpK-1.5)<.06&&Math.abs(C.dmgK-1.25)<.08&&C.spdK<1.25,JSON.stringify(C));
const G=await page.evaluate(()=>{ const D=window.__difficulty, M=window.__meta, d=window.__dd; const pay=id=>{ D.set(id,true); const g0=M.gold(); d.S.wave=3; M.onWaveHeld(3); return M.gold()-g0; }; const r={ normal:pay('normal'), nightmare:pay('nightmare'), easy:pay('easy') };
  D.set('normal',true); const rn=window.__mythicDrops.rates(); D.set('nightmare',true); const rm=window.__mythicDrops.rates(); D.set('normal',true); r.myth=+(rm.mythic/rn.mythic).toFixed(2); return r; });
check("gold for a wave held follows the level (x1.6 NIGHTMARE, x0.85 EASY), and NIGHTMARE's mythic drop chance is x1.8",G.nightmare===Math.round(G.normal*1.6)&&G.easy===Math.round(G.normal*.85)&&G.myth===1.8,JSON.stringify(G));
const P=await page.evaluate(()=>{ const D=window.__difficulty, d=window.__dd; D.set('hard',true); const saved=localStorage.getItem('dd_difficulty'); window.__meta.onMapHeld(d.S.wave,{won:true,map:0,mapName:'x',hasNext:true}); const b=D.best(); D.fromHost('nightmare'); const host=D.id(); return { saved, best:b[d.map().id], host }; });
check("the pick is remembered; a map held on HARD records its medal; a guest takes its host's level",P.saved==='hard'&&P.best===2&&P.host==='nightmare',JSON.stringify(P));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
