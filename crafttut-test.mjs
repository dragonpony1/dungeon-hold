// ===== THE CRAFTING TUTORIAL (game build 611, 99zc-crafttut.js; hideout build 99). Matt: "a very simple tutorial for how this system works, like start in the first map. with very easy to follow clicks, like we did for
// 67 flowers" -> "yes build it". Walked end to end: on the Gnome Hall after the training guide, a page drops beside you (banner + hand), 1 of 3; the next two drop at the ends of the next waves; the third teaches
// the recipe; the hand points at the portal; in the hideout, the hand over the Blacksmith; inside, the hand taps the piece, its set, Craft (6 sludge given, and it PROCs); the hand on the recipe book; its card; the boss
// card; done. Skip ends it. No page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8903,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ if(sessionStorage.getItem('__ct')) return; sessionStorage.setItem('__ct','1'); localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","1"); localStorage.setItem("dd_trainer",JSON.stringify({done:{},off:true}));
  localStorage.setItem("dd_recipes",JSON.stringify({seeded:1,seededH:1,seededBoss:1,known:{},pages:{}})); localStorage.removeItem("dd_craft_tut"); localStorage.setItem("dd_tip_forge","1"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8903/?silent&nogate&crafttut&map=0",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__craftTut&&window.__recipes&&window.__hideout,null,{timeout:120000});
const A=await page.evaluate(async()=>{ const d=window.__dd; d.start(); for(let i=0;i<20;i++) d.step(1/60,1); await new Promise(r=>setTimeout(r,200)); const T=window.__craftTut;
  return { s:T.state().s, key:T.state().key, floor:window.__recipes.list().length, ban:T.banner(), hand:T.hand() }; });
if(process.env.SHOTS){ await page.evaluate(()=>window.__dd.step(1/60,2)); await sleep(400); await page.screenshot({path:process.env.SHOTS+"/tut-hall.png"}); }
check("on the Gnome Hall after the guide: the first Earth recipe is the tutorial's, a page drops beside you, the banner and the hand point at it",A.s===1&&A.key==='of the Earth|armor'&&A.floor===1&&/torn recipe page/i.test(A.ban),JSON.stringify(A));
const B=await page.evaluate(()=>{ const d=window.__dd, T=window.__craftTut; for(let i=0;i<120;i++) d.step(1/60,1); const b=window.__recipes.read(); return { s:T.state().s, pages:b.pages['of the Earth|armor']|0, ban:T.banner() }; });
check("walking over it: 1 of 3, and the banner says the next drops at the end of the next wave",B.s===2&&B.pages===1&&/1 of 3/.test(B.ban)&&/next wave/i.test(B.ban),JSON.stringify(B));
const C=await page.evaluate(()=>{ const d=window.__dd, T=window.__craftTut, out=[]; for(let w=0;w<2;w++){ d.S.wave++; d.S.phase='build'; for(let i=0;i<150;i++) d.step(1/60,1); const b=window.__recipes.read(); out.push({ pages:b.pages['of the Earth|armor']|0, known:!!b.known['of the Earth|armor'] }); }
  for(let i=0;i<5;i++) d.step(1/60,1); return { out, s:T.state().s, ban:T.banner() }; });
check("a page at the end of each of the next two waves: the third teaches the recipe, and the banner sends you through the portal to the Blacksmith",C.out[0].pages===2&&C.out[1].known&&C.s===3&&/portal/i.test(C.ban)&&/Blacksmith/.test(C.ban),JSON.stringify(C));
await page.evaluate(()=>{ window.__dd.setHero(30,30); window.__hideout.open(); });
let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof ctTick==='function'&&typeof openForge==='function',null,{timeout:120000});
for(let i=0;i<40;i++){ const s=await page.evaluate(()=>{ window.__dd.step(1/60,1); return window.__craftTut.state().s; }); if(s===4) break; await sleep(50); }
await sleep(300);
const D=await f.evaluate(()=>{ ctTick(); return { s:ctGet().s, ban:document.getElementById('ctBanH').textContent }; });
check("in the hideout: Walk to the Blacksmith and press E",D.s===4&&/Blacksmith/.test(D.ban)&&/E/.test(D.ban),JSON.stringify(D));
const E=await f.evaluate(async()=>{ window.__forgeFast=true; SAVE.legendarySludge=0; openForge(); ctTick(); const w=ms=>new Promise(r=>setTimeout(r,ms)); const a={ s:ctGet().s, sludge:SAVE.legendarySludge, b1:document.getElementById('ctBanH').textContent, h1:document.getElementById('ctHandH').classList.contains('on') };
  [...document.querySelectorAll('#forgeGearGrid .fgear')][Object.keys(MYTHIC_GEAR).indexOf('armor')].click(); ctTick(); a.b2=document.getElementById('ctBanH').textContent;
  [...document.querySelectorAll('#forgeSets .fset')].find(b=>b.textContent.startsWith('of the Earth')).click(); ctTick(); await w(400); a.b3=document.getElementById('ctBanH').textContent; a.h3=document.getElementById('ctHandH').classList.contains('on');
  if(window.__shotHook) await window.__shotHook(); document.getElementById('forgeCraftBtn').click(); await w(150); ctTick(); const r=window.__forgeLast; a.made={ set:r.set, type:r.type, procd:!!r.procd }; a.s2=ctGet().s; a.b4=document.getElementById('ctBanH').textContent; return a; });
check("at the Blacksmith (6 sludge given): the hand taps the piece, then its set, then Craft",E.s===5&&E.sludge===6&&/piece you just learned/.test(E.b1)&&E.h1&&/its set/.test(E.b2)&&/of the Earth/.test(E.b2)&&/Craft it/.test(E.b3)&&E.h3,JSON.stringify(E));
check("the first craft PROCs: a Proc'd Earth armor; then the hand moves to the recipe book",E.made.set==='rock'&&E.made.type==='armor'&&E.made.procd&&E.s2===6&&/recipe book/i.test(E.b4),JSON.stringify(E));
const G=await f.evaluate(async()=>{ const w=ms=>new Promise(r=>setTimeout(r,ms)); document.getElementById('forgeBookBtn').click(); await w(900); const c=document.getElementById('ctCard'); const a={ on1:c.classList.contains('on'), t1:c.textContent };
  c.querySelector('button').click(); await w(50); a.on2=c.classList.contains('on'); a.t2=c.textContent; c.querySelector('button').click(); await w(50); a.on3=c.classList.contains('on'); a.s=ctGet().s; return a; });
check("the recipe book's card (gold = you can make it, dark = still out there), then the boss card (boss, trophy, masterwork), then done",G.on1&&/RECIPE BOOK/.test(G.t1)&&/Dark/.test(G.t1)&&G.on2&&/BOSSES/.test(G.t2)&&/masterwork/.test(G.t2)&&!G.on3&&G.s===99,JSON.stringify(G));
const H=await page.evaluate(()=>{ const T=window.__craftTut; window.__dd.step(1/60,2); return { s:T.state().s, ban:T.banner() }; });
check("done for good: the hall shows no banner",H.s===99&&!H.ban,JSON.stringify(H));
const K=await page.evaluate(()=>{ const T=window.__craftTut, d=window.__dd; T.reset(); d.S.phase='build'; for(let i=0;i<5;i++) d.step(1/60,1); const had=!!document.querySelector('#ctBan.on .sk'); document.querySelector('#ctBan .sk').click(); for(let i=0;i<3;i++) d.step(1/60,1); return { had, s:T.state().s, ban:T.banner() }; });
check("Skip tutorial ends it",K.had&&K.s===99&&!K.ban,JSON.stringify(K));
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
