// ===== THE ENGINEER'S KIT (build 599; parts/staging/99y-engineerkit.js + 96b-perch.js). Matt's engineer zip: the Sky Platform, the Gnome Turret and a new Lookout Perch.
// Checked: a Sky Platform takes a Sky Wrecker up on its deck (3) and comes down with it; the perch takes a Gnome Turret (deck 2.5) but not a Sky Wrecker, and a hedge-less map's floor takes
// a turret; only two platforms at a time; the turret turns and shoots goblins, its bolts hurt them; the new lookout perch is climbable (its deck and its ladder's two footholds); no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const DIST=process.env.DIST||"./dist"; const server=await serve(8892,{dist:DIST});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1000,height:700}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_trainer","done"); localStorage.setItem("ddHero","engineer"); localStorage.setItem("ddMeta",JSON.stringify({level:8})); localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8892/?silent&nogate&map=4",{timeout:180000}); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel&&window.__dd.heroModel()&&window.__engkit&&window.__perch,null,{timeout:180000});
const A=await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.addMana(9000); for(let i=0;i<10;i++) d.step(1/30,1);
  const X=d.cw(24), Z=d.cwz(36), r={ hero:window.__heroes.pick() };
  const plat=d.placeDefAt('skyplat',X-5,Z,0); const sky=d.placeDefAt('sky',X-5,Z,0); r.plat=!!plat; r.skyY=sky?sky.base:null; r.skyOn=!!(sky&&sky.onSurf===plat);
  const perch=d.placeDefAt('perch',X+4,Z,0); const skyOnPerch=d.placeDefAt('sky',X+4,Z,0); r.skyOnPerch=!!(skyOnPerch&&skyOnPerch.onSurf===perch); const tur=d.placeDefAt('turret',X+4,Z,Math.PI); r.turY=tur?tur.base:null; r.turOn=!!(tur&&tur.onSurf===perch);
  r.boxes=(perch&&perch.railboxes||[]).map(b=>+(b.top-perch.base).toFixed(2));
  d.placeDefAt('skyplat',X-12,Z+6,0); const third=d.placeDefAt('skyplat',X+12,Z+6,0); r.third=!!third; r.plats=d.defs.filter(x=>x.kind==='skyplat').length;
  d.removeDef?d.removeDef(plat):window.__perch.remove(plat); r.skyGone=!d.defs.includes(sky);
  return r; });
check("the Engineer is the hero; a Sky Platform takes a Sky Wrecker up on its deck (3)",A.hero==='engineer'&&A.plat&&A.skyOn&&Math.abs(A.skyY-3)<.01,JSON.stringify(A));
check("the Lookout Perch takes a Gnome Turret (deck 2.5) but not a Sky Wrecker",A.turOn&&Math.abs(A.turY-2.5)<.01&&!A.skyOnPerch,JSON.stringify(A));
check("the new lookout is climbable: its deck (2.5) and its ladder (1.3)",A.boxes.join(',')==='2.5,1.3',JSON.stringify(A.boxes));
check("only two sky platforms at a time; the Sky Wrecker comes down with its platform",!A.third&&A.plats===2&&A.skyGone,JSON.stringify(A));
const B=await page.evaluate(async()=>{ const d=window.__dd; const X=d.cw(24), Z=d.cwz(36); d.placeDefAt('turret',X,Z+2,Math.PI); d.S.phase='wave'; const L=Object.keys(d.lanes())[0]; const gs=[];
  for(let i=0;i<4;i++){ d.spawn('goblin',L); const e=d.enemies[d.enemies.length-1]; e.x=X-3+i*1.6; e.z=Z-6; e.spd=0; gs.push(e); } const hp0=gs.reduce((s,e)=>s+e.hp,0);
  const k0=window.__engkit.info(); for(let i=0;i<90;i++){ d.step(1/30,1); if(i%30===0) await new Promise(r=>setTimeout(r,20)); } const k1=window.__engkit.info(); const hp1=gs.reduce((s,e)=>s+(e.dead?0:e.hp),0);
  return { shots:k1.shots-k0.shots, hits:k1.hits-k0.hits, hp0, hp1 }; });
check("the Gnome Turret turns and shoots goblins; its bolts hurt them",B.shots>=3&&B.hits>=2&&B.hp1<B.hp0,JSON.stringify(B));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
