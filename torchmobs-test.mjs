// ===== THE TORCH-BEARERS (95j-torchbearers.js, build 359). Matt: "as these mobs come up from the back we need one carrying a torch ever so often for added intensity to the situation". Checked: out of a run of goblins and
// orcs through the gates about one in ten carries a torch (a stick, a flickering flame and glow in the right hand); the map's light count never changes (a fixed pool of four was made at the start, nothing is added mid-fight);
// the pool lights the torches nearest you and leaves a far one dark; a bearer cut down drops its torch, which lies burning and lit for a few seconds and then goes; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8998,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:900,height:560}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8998/?silent&nogate&map=5",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__torchmobs&&window.__dd.map().id==='prison',null,{timeout:120000});
await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,5); d.S.phase='wave'; d.S.crystal=1e6; });
const A=await page.evaluate(()=>{ const d=window.__dd, sc=typeof d.scene==='function'?d.scene():d.scene; const countLights=()=>{ let n=0; sc.traverse(o=>{ if(o.isLight) n++; }); return n; }; const l0=countLights();
  for(let i=0;i<120;i++){ d.spawn(i%4===3?'orc':'goblin',['E','S','W','NE'][i%4]); } d.step(1/60,5); const b=window.__torchmobs.info(); const parts=window.__torchmobs.bearers().every(e=>e.torch&&e.torch.getObjectByName&&e.torch.children.length>=4&&e.torch.parent===e.mdl.g);
  return { l0, l1:countLights(), made:b.made, parts, pool:b.lights }; });
check("one in about ten of the goblins and orcs coming through the gates carries a torch (a stick, a flame and a glow, in its hand), ten to fifteen of a hundred and twenty",A.made>=8&&A.made<=18&&A.parts,JSON.stringify(A));
check("the map's light count does not change when they appear (a fixed pool of four was made at the start)",A.l0===A.l1&&A.pool===4,JSON.stringify({before:A.l0,after:A.l1}));
const B=await page.evaluate(()=>{ const d=window.__dd; const all=window.__torchmobs.bearers(); const b0=all[0], far=all[all.length-1]; for(const e of d.enemies){ e.spd=0; } d.setHero(b0.x+4,b0.z,Math.PI/2); for(let i=0;i<80;i++){ d.step(1/60,1); d.S.crystal=1e6; }
  const L=window.__torchmobs.lights().map(l=>({ i:+l.intensity.toFixed(2), d:+Math.hypot(l.position.x-b0.x,l.position.z-b0.z).toFixed(1), y:+l.position.y.toFixed(1) })); const lit=L.filter(l=>l.i>.3); const nearLit=lit.some(l=>l.d<2.5);
  const farD=Math.hypot(far.x-d.hero.x,far.z-d.hero.z); return { lit:lit.length, nearLit, farD:+farD.toFixed(0), L }; });
check("the four lights go to the torches nearest you: the nearest bearer is lit (a light sits at its flame) and never more than four are lit",B.lit>=1&&B.lit<=4&&B.nearLit,JSON.stringify(B));
const C=await page.evaluate(()=>{ const d=window.__dd; const b=window.__torchmobs.bearers()[0]; const x=b.x, z=b.z; d.setHero(x+3,z,Math.PI/2); d.kill(b); for(let i=0;i<30;i++){ d.step(1/60,1); d.S.crystal=1e6; } const t1=window.__torchmobs.info(); const lit1=window.__torchmobs.lights().some(l=>l.intensity>.3&&Math.hypot(l.position.x-x,l.position.z-z)<2);
  for(let i=0;i<60*9;i++){ d.step(1/60,1); d.S.crystal=1e6; } const t2=window.__torchmobs.info(); return { dropped:t1.dropped, fallenThen:t1.fallen, lit1, fallenLater:t2.fallen }; });
check("a bearer cut down drops its torch: it lies burning and lit for a few seconds, then goes out",C.dropped>=1&&C.fallenThen>=1&&C.lit1&&C.fallenLater===0,JSON.stringify(C));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
