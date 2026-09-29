// ===== MASON, THE TOWER-HEALTH SKILL (10-meta.js SKILLS + 96e-mason.js, build 290). Matt: "we need to add a stat called tower health in the skills maybe". Checked: the Skills tab lists Mason (8 skills);
// with no points a tower's health is what it always was; each point is +8% health for every tower, including one already standing (a hurt tower stays just as hurt -- its share of health is kept);
// an upgraded tower keeps the bonus on top of its upgrade; and a tower placed afterwards gets it at once.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8942,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8942/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__mason,null,{timeout:120000});
const a=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} M.reset&&M.reset(); d.start(); d.step(1/60,20); for(const e of d.enemies) d.kill(e);
  d.addMana(9000); d.setHero(8,10,0); d.step(1/60,3); const t=d.place('harpoon',16,14,Math.PI); d.step(1/60,5); window.__mt=t; const base=d.DEFS.harpoon.hp;
  return { ids:M.SKILLS.map(s=>s.id), base, max0:t&&t.max, hp0:t&&t.hp }; });
check("the Skills list has Mason (tower health, +8% a point) -- 8 skills",a.ids.includes("mason")&&a.ids.length===8,JSON.stringify(a.ids));
check("with no Mason points a tower's health is what it always was",a.max0===a.base&&a.hp0===a.base,JSON.stringify(a));
const b=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, t=window.__mt; M.addXP(40000); t.hp=Math.round(t.max/2); const frac0=t.hp/t.max; let sp=0; for(let i=0;i<5;i++) if(M.spend('mason')) sp++; d.step(1/60,3);
  return { sp, lvl:M.level(), max:t.max, hp:t.hp, frac0, frac1:+(t.hp/t.max).toFixed(3), want:Math.round(d.DEFS.harpoon.hp*1.4) }; });
check("5 points: a tower already standing goes to +40% health, and a half-hurt one is still half hurt",b.sp===5&&b.max===b.want&&Math.abs(b.frac1-b.frac0)<.02,JSON.stringify(b));
const c=await page.evaluate(()=>{ const d=window.__dd, t=window.__mt; d.setHero(t.x,t.z+2,0); for(let i=0;i<3&&t.lvl<2;i++){ d.upgrade(); d.step(1/60,3); } const lv2=Math.round(d.DEFS.harpoon.hp*1.4);
  return { lvl:t.lvl, max:t.max, hp:t.hp, want:Math.round(lv2*1.4) }; });
check("an upgraded tower keeps the Mason bonus on top of its upgrade (and is fully healed as before)",c.lvl===2&&c.max===c.want&&c.hp===c.max,JSON.stringify(c));
const e=await page.evaluate(()=>{ const d=window.__dd; d.setHero(8,10,0); d.step(1/60,3); const t2=d.place('harpoon',20,14,Math.PI); d.step(1/60,2); return t2?{ max:t2.max, hp:t2.hp, want:Math.round(d.DEFS.harpoon.hp*1.4) }:null; });
check("a tower placed afterwards gets the bonus at once, at full health",e&&e.max===e.want&&e.hp===e.max,JSON.stringify(e));
const f=await page.evaluate(()=>{ window.__tavern.open(); window.__tavern.tab('skills'); const r=document.getElementById('tv-sk-mason'); return r?r.innerText.replace(/\s+/g,' '):null; });
check("the tavern's Skills tab shows the Mason tile with its bonus (+40%)",!!f&&/Mason/i.test(f)&&/[+]40%/.test(f),f);
if(process.env.SHOT){ const box=await page.evaluate(()=>{ const r=[...document.querySelectorAll('.tv-sk')].map(x=>x.getBoundingClientRect()); const x0=Math.min(...r.map(a=>a.left)), y0=Math.min(...r.map(a=>a.top)), x1=Math.max(...r.map(a=>a.right)), y1=Math.max(...r.map(a=>a.bottom)); return {x:x0-8,y:y0-36,width:x1-x0+16,height:y1-y0+44}; }); await page.screenshot({path:process.env.SHOT,clip:box}); }
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
