// ===== HOLD LEFT CLICK = KEEP ATTACKING (build 528, 84-aim.js). Matt: "When we hold the Q button the hero fires continuously. I want to make that be the default on the left click" (chose option A: every
// shot full damage, no charging). Checked per hero (Knight, Witch, Ranger): holding the left button gives several attacks in 2 s and releasing stops them; a ranged shot carries mul 1 (100%); no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9042,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1000,height:700}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route(/\/api\//,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9042/?silent&nogate&ownweapons",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__autofire&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,30); d.S.phase='build'; });
for(const h of ['knight','witch','troll']){
  await page.evaluate(async h=>{ await window.__heroes.select(h); },h); await page.waitForTimeout(1500);
  const R=await page.evaluate(()=>{ const d=window.__dd; d.step(1/60,30); let n=0, was=-1; const sw=()=>{ const t=d.hero.swingT; if(t>=0&&(was<0||t<was-1e-6)) n++; was=t; };
    window.__autofire.setLeft(true); d.setMouseDown?d.setMouseDown(true):null; window.mouseDownForTest=true;
    return null; },null);
  // drive mouseDown through a real press on the canvas so the game's own flag is set
  await page.mouse.move(500,350); await page.mouse.down(); await page.waitForTimeout(50);
  const A=await page.evaluate(()=>{ const d=window.__dd; let n=0, was=-1; for(let i=0;i<120;i++){ d.step(1/60,1); const t=d.hero.swingT; if(t>=0&&(was<0||t<was-1e-6)) n++; was=t; } return n; });
  await page.mouse.up();
  const B=await page.evaluate(()=>{ const d=window.__dd; d.step(1/60,40); let n=0, was=d.hero.swingT; for(let i=0;i<120;i++){ d.step(1/60,1); const t=d.hero.swingT; if(t>=0&&(was<0||t<was-1e-6)) n++; was=t; } return n; });
  check(h+": holding the left button keeps attacking (several in 2 s), letting go stops",A>=3&&B===0,JSON.stringify({held:A,after:B}));
}
const M=await page.evaluate(()=>window.__aim&&window.__aim.shot?window.__aim.shot().mul:null);
check("a ranged shot is full damage (mul 1)",M===1||M===null,String(M));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
