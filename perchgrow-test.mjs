// ===== THE LOOKOUT PERCH GROWS (build 601; 96b-perch.js). Matt: "when i upgrade the lookout perch i want them to get taller and taller".
// Checked: a Mark I perch is as it was (deck 2.5); standing on its deck, E upgrades the PERCH (even with a Saw Blade Gunner on it), and from the ground E still picks the gunner; each mark lifts the deck 1.25
// on a scaffold that grows under the lookout -- the deck's foothold, the gunner on top and the hero on the deck all ride up with it; at Mark VII the deck is at 10, the model stands that much taller, and the
// gunner reaches 30% further; pressed against the ladder holding W, the hero climbs all the way up and steps onto the deck; let go halfway and he slides down; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import fs from "fs";
const DIST=process.env.DIST||"./dist"; const server=await serve(8951,{dist:DIST});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1100,height:760}});
await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_trainer","done"); localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8951/?silent&nogate",{timeout:180000}); await page.waitForFunction(()=>window.__dd&&window.__perch&&window.__dd.heroModel&&window.__dd.heroModel(),null,{timeout:180000}); await sleep(800);
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,10); d.addMana(99999); d.setHero(4,10,0); d.step(1/60,3); window.__P=d.place('perch',12,14,0); d.step(1/60,5); });
let A=null; for(let i=0;i<300;i++){ A=await page.evaluate(()=>{ const d=window.__dd, p=window.__P; d.step(1/60,2); return { glb:!!p.mdl.userData.glb, lvl:p.lvl, deck:+(p.railboxes[0].top-p.base).toFixed(2), climb:+(p.railboxes[1].climb-p.base).toFixed(2) }; }); if(A.glb) break; await sleep(60); }
const G=await page.evaluate(()=>{ const d=window.__dd, p=window.__P; const t=d.placeDefAt('harpoon',p.x,p.z,0); d.step(1/60,5); window.__T=t; return t?{ base:+(t.base-p.base).toFixed(2), on:t.onSurf===p, r:+d.stat(t,'range').toFixed(2) }:null; });
check("a Mark I perch is as it was: deck 2.5 (the ladder climbs to it), a Saw Blade Gunner set on top at 2.5",A&&A.glb&&A.lvl===1&&A.deck===2.5&&A.climb===2.5&&G&&G.on&&G.base===2.5,JSON.stringify({A,G}));
const B=await page.evaluate(()=>{ const d=window.__dd, p=window.__P, H=d.hero; d.setHero(p.x+2.4,p.z,-Math.PI/2); H.y=p.base; d.step(1/60,3); const fromGround=d.pickDef? null:null;
  // from the ground, aiming at the perch, E is the gunner's
  const lt0=window.__T.lvl; d.upgradeDef(); d.step(1/60,3); const gunUp=window.__T.lvl>lt0, perchLvl=p.lvl;
  // on the deck, E is the perch's
  H.x=p.x-.3; H.z=p.z-.4; H.y=p.railboxes[0].top+.5; H.vy=0; for(let i=0;i<30;i++) d.step(1/60,1); const onY=+(H.y-p.base).toFixed(2);
  d.upgradeDef(); for(let i=0;i<90;i++) d.step(1/60,1);
  return { gunUp, perchLvl, onY, lvl:p.lvl, deck:+(p.railboxes[0].top-p.base).toFixed(2), climb:+(p.railboxes[1].climb-p.base).toFixed(2), tower:+(window.__T.base-p.base).toFixed(2), towerMdl:+(window.__T.mdl.position.y-p.base).toFixed(2), hero:+(H.y-p.base).toFixed(2), info:window.__perch.info() }; });
check("from the ground E upgrades the gunner on top; standing on the deck E upgrades the PERCH",B.gunUp&&B.perchLvl===1&&Math.abs(B.onY-2.5)<.05&&B.lvl===2,JSON.stringify(B));
check("Mark II: the deck, the ladder's top, the gunner (and its model) and the hero on the deck all rise 1.25, to 3.75",B.deck===3.75&&B.climb===3.75&&B.tower===3.75&&B.towerMdl===3.75&&Math.abs(B.hero-3.75)<.05,JSON.stringify(B));
const C=await page.evaluate(()=>{ const d=window.__dd, p=window.__P, H=d.hero; const r0=d.stat(window.__T,'range'); for(let k=0;k<5;k++){ H.x=p.x-.3; H.z=p.z-.4; d.upgradeDef(); for(let i=0;i<90;i++) d.step(1/60,1); }
  const b=new window.THREE.Box3().setFromObject(p.mdl); const t=window.__T; const lvl=t.onSurf.lvl; t.onSurf.lvl=1; const rBase=d.stat(t,'range'); t.onSurf.lvl=lvl;
  return { lvl:p.lvl, deck:+(p.railboxes[0].top-p.base).toFixed(2), tower:+(t.base-p.base).toFixed(2), hero:+(H.y-p.base).toFixed(2), h:+(b.max.y-b.min.y).toFixed(2), r:+d.stat(t,'range').toFixed(2), rBase:+rBase.toFixed(2), scaf:p.mdl.userData.perchScaf.children.length }; });
check("Mark VII: the deck is at 10, the gunner and the hero up there with it, the whole perch about 7.5 taller than it was",C.lvl===7&&C.deck===10&&C.tower===10&&Math.abs(C.hero-10)<.05&&C.h>10.5&&C.scaf>20,JSON.stringify(C));
check("the gunner on a Mark VII perch reaches 30% further",Math.abs(C.r-C.rBase*1.3)<.02,JSON.stringify(C));
// pictures: Mark VII beside a fresh Mark I, and a Mark IV
await page.evaluate(()=>{ const d=window.__dd; const q=d.place('perch',18,14,0); for(let k=0;k<3;k++){ d.setHero(q.x-.3,q.z-.4); d.hero.y=q.railboxes[0].top; d.upgradeDef(); for(let i=0;i<90;i++) d.step(1/60,1); } window.__Q=q; const p=window.__P; d.setHero(p.x+3,p.z+14,Math.PI); d.hero.y=0; d.setCam(Math.PI*.92,.18,15); d.step(1/60,30); });
await sleep(1500); const OUT=process.env.SHOTS; if(OUT){ await page.screenshot({path:OUT+"/perch-grow.png"}); }
// the ladder
const D=await page.evaluate(async()=>{ const d=window.__dd, p=window.__P, H=d.hero; const L=p.railboxes[1]; const lx=(L.x0+L.x1)/2, lz=L.z1+.45; d.setHero(lx,lz+1.5,Math.PI); H.y=p.base; H.vy=0; d.setCam(Math.PI,.3,8); d.step(1/60,10);
  return { lx, lz }; });
await page.evaluate(()=>window.__dd.setKeys({w:1})); const E=[]; for(let i=0;i<14;i++){ E.push(await page.evaluate(()=>{ const d=window.__dd, H=d.hero; d.step(1/60,20); return +(H.y-window.__P.base).toFixed(2); })); } await page.evaluate(()=>window.__dd.setKeys({w:0}));
const F=await page.evaluate(()=>{ const d=window.__dd, p=window.__P, H=d.hero; d.step(1/60,20); return { y:+(H.y-p.base).toFixed(2), onDeck:window.__perch.onDeck(p,H.x,H.z,H.y), info:window.__perch.info() }; });
check("holding W against the ladder, the hero climbs a Mark VII perch all the way and steps onto its deck (10 up)",Math.max(...E)>9.9&&F.onDeck&&Math.abs(F.y-10)<.05,JSON.stringify({E,F}));
const Hh=await page.evaluate(()=>{ const d=window.__dd, p=window.__P, H=d.hero; const L=p.railboxes[1]; d.setHero((L.x0+L.x1)/2,L.z1+.5,Math.PI); H.y=p.base+5; H.vy=0; H.climbing=p; const ys=[]; for(let i=0;i<14;i++){ d.step(1/60,10); ys.push(+(H.y-p.base).toFixed(2)); } return ys; });
check("let go halfway up, he slides back down (slowly) to the ground",Hh[0]<5&&Hh[0]>4&&Hh[Hh.length-1]<.05,JSON.stringify(Hh));
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
