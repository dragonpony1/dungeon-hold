// ===== ARCHERS SHOOT ON THEIR OWN LEVEL (build 628, game.js RANGED_UP). Matt: "on the draw bridge the archers on the ground are shooting the defenses up on top of the inn" ->
// "finish the archer fix ... it would be nice if they worked properly". Checked on the real Drawbridge with real archers walking the east road to the inn:
//  * a Frost Spire on the inn's ROOF right above their road is never hit while they are still down on the ground (they can once they've climbed the ramp up to it -- that is fair);
//  * a Frost Spire on the GROUND beside the same road is shot as ever.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8938,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
async function run(which){ const page=await (await browser.newContext({viewport:{width:1100,height:700}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
  await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
  await page.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("dd_trainer",JSON.stringify({done:{},off:true})); }catch(e){} });
  await page.goto("http://127.0.0.1:8938/?silent&nogate&map=4",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__dd.floorH,null,{timeout:120000});
  const r=await page.evaluate(which=>{ const d=window.__dd, F=d.floorH; d.start(); d.step(1/60,3); d.S.mana=1e6; d.S.phase='wave';
    const lanes=Object.keys(d.lanes()); let E=null, ground=null, t=null;
    const walkOn=L=>{ const e=d.spawn('archer',L); e.hp=e.maxHp=1e7; return e; };
    // 1: every gate in turn: where does an archer from it walk on the GROUND (no towers yet)?
    for(const L of lanes){ if(t) break; const scout=walkOn(L), path=[]; for(let i=0;i<900&&!scout.dead;i++){ d.step(1/30,1); if(i%5===0) path.push({x:scout.x,z:scout.z,f:F(scout.x,scout.z)}); } scout.hp=0; scout.dead=1; d.step(1/30,2);
    ground=path.filter(p=>p.f<1); E=L;
    // 2: a tower 3-6 from that ground road: on the roof (floor 6+ up) or on the ground, placed where it fits
    for(const p of ground){ if(t) break; for(let a=0;a<24&&!t;a++) for(const r of [3,4,5,6]){ const x=p.x+Math.cos(a*Math.PI/12)*r, z=p.z+Math.sin(a*Math.PI/12)*r; const f=F(x,z);
      if(which==='roof'?f>=6:(f>-.3&&f<.3&&!ground.some(q=>Math.hypot(q.x-x,q.z-z)<1.6))){ const def=d.placeDefAt('frost',x,z,0); if(def){ t={def,x,z,f,near:p}; break; } } } } }
    if(!t) return { err:'no spot for the '+which+' tower', ground:ground.length };
    t.def.hp=t.def.maxHp=1e6; const full=t.def.hp;
    // 3: a fresh archer walks the road for real; any hit on the tower while the archer stands on the ground counts
    const e=walkOn(E); let hitLow=0, hitHigh=0, last=full, maxF=0; for(let i=0;i<1200&&!e.dead;i++){ d.step(1/30,1); const fe=F(e.x,e.z); maxF=Math.max(maxF,fe); if(t.def.hp<last){ if(fe<3) hitLow++; else hitHigh++; last=t.def.hp; } }
    return { lane:E, ground:ground.length, tower:{x:+t.x.toFixed(1),z:+t.z.toFixed(1),floor:t.f}, hitLow, hitHigh, maxF:+maxF.toFixed(1) }; },which);
  await page.close(); return r; }
const R=await run('roof'), G=await run('ground');
check("an archer on the ground never hits a tower up high (on a roof or wall-top) above its road",R&&!R.err&&R.hitLow===0,JSON.stringify(R));
check("the same archers still shoot a tower on the ground beside their road",G&&!G.err&&G.hitLow>0,JSON.stringify(G));
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
