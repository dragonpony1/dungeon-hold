// ===== THE CRAFTING FORGE (hideout build 88, game build 603; 97-mythics.js keeps a forged set piece's proc). Matt: "I like crafting, I want crafting to be a part of the game and I especially want the chance to
// roll something great, like better than i expected, which is what [I] have been referring to as a proc" / "start with the forge and the proc".
// Checked: the set row has no "Any set" (you pick); picking a piece shows its three main stats (the first chosen); Craft says what is missing until piece and set are picked, then costs 6; each stoke adds 1 sludge and
// 3% proc (the meter says so); a craft always makes the piece (no failure): plain = the set and the main stat first; FINE = "Fine" and every stat at its best; PROC'D = the main stat +35% and the gold PROC'D banner,
// and the game's bag holds it proc'd (gold stat, glow); a third of procs = a Named Mythic; the stoke raises the proc; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8894,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","1"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8894/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__hideout,null,{timeout:90000});
await page.evaluate(()=>{ window.__dd.setHero(30,30); window.__hideout.open(); }); let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof openForge==="function"&&typeof SAVE!=="undefined"&&document.getElementById("forgeFocus"),null,{timeout:120000});
const A=await f.evaluate(()=>{ window.__forgeFast=true; localStorage.setItem('dd_recipes',JSON.stringify({known:{'of Shadow|weapon':1},pages:{},seeded:1,seededH:1})); SAVE.legendarySludge=100; openForge(); const btn=document.getElementById("forgeCraftBtn"); const a={ b0:btn.textContent };
  [...document.querySelectorAll("#forgeGearGrid .fgear")][0].click(); a.b1=btn.textContent; a.focus=[...document.querySelectorAll("#forgeFocus .fset")].map(b=>b.textContent+(b.classList.contains("sel")?"*":""));
  a.chips=[...document.querySelectorAll("#forgeSets .fset")].map(b=>b.textContent); return a; });
check("no 'Any set' any more: the nine sets to pick from; Craft says 'Pick a piece', then 'Pick a set'; a weapon's three main stats show, Damage chosen first",A.chips.length===9&&!A.chips.includes("Any set")&&A.b0==="Pick a piece"&&A.b1==="Pick a set"&&A.focus.join()==="Damage*,Swing speed,Defense damage",JSON.stringify(A));
const B=await f.evaluate(()=>{ const btn=document.getElementById("forgeCraftBtn"); [...document.querySelectorAll("#forgeSets .fset")].find(b=>b.textContent==="of Shadow").click(); const a={ b2:btn.textContent, pct0:document.getElementById("forgeProcPct").textContent };
  document.querySelectorAll("#forgeStoke .fflame")[1].click(); a.b3=btn.textContent; a.pct2=document.getElementById("forgeProcPct").textContent; a.flames=document.querySelectorAll("#forgeStoke .fflame.on").length;
  SAVE.legendarySludge=7; renderForgePanel(); a.dis7=btn.disabled; SAVE.legendarySludge=100; document.querySelectorAll("#forgeStoke .fflame")[1].click(); document.querySelectorAll("#forgeStoke .fflame")[0].click(); a.b4=btn.textContent; a.dis=btn.disabled; return a; });
check("with Shadow picked it costs 6 (6% PROC); two stokes make it 8 and 12% PROC (two flames lit), and 7 sludge is not enough; stoke put out again (tap the top flame, flame by flame): 6",B.b2==="Craft · 6 sludge"&&B.pct0==="6% PROC"&&B.b3==="Craft · 8 sludge"&&B.pct2==="12% PROC"&&B.flames===2&&B.dis7&&B.b4==="Craft · 6 sludge"&&!B.dis,JSON.stringify(B));
const craft=(roll,focus,stoke)=>f.evaluate(({roll,focus,stoke})=>{ if(focus){ [...document.querySelectorAll("#forgeFocus .fset")].find(b=>b.dataset.stat===focus).click(); } if(stoke) document.querySelectorAll("#forgeStoke .fflame")[stoke-1].click();
  const s0=SAVE.legendarySludge, real=Math.random; Math.random=()=>roll; try{ document.getElementById("forgeCraftBtn").click(); } finally { Math.random=real; }
  return new Promise(res=>setTimeout(()=>{ const r=window.__forgeLast; const out=document.getElementById("forgeOutput"); res({ spent:s0-SAVE.legendarySludge, id:r.id, name:r.name, set:r.set, tier:r.tier, stats:r.stats, keys:Object.keys(r.stats), procd:!!r.procd, primary:r.primary||null, fine:!!r.fine, cls:out.className, txt:out.textContent.slice(0,60), stokeAfter:forgeStoke }); },60)); },{roll,focus,stoke});
const N=await craft(.5,'spd');
check("a plain craft always makes the piece: Shadow, mythic, Swing speed first, 6 sludge, no proc",N.spent===6&&N.set==="shadow"&&N.tier==="mythic"&&N.keys[0]==="spd"&&!N.procd&&!N.fine&&N.cls==="success",JSON.stringify(N));
const Fi=await craft(.2);
check("a FINE craft: 'Fine' in its name, every stat at its best (Swing speed 52, Damage 26), the FINE banner",Fi.fine&&/^Fine /.test(Fi.name)&&Fi.stats.spd===52&&Fi.stats.dmg===26&&Fi.cls==="fine"&&/FINE/.test(Fi.txt),JSON.stringify(Fi));
const P=await craft(.05);
check("a PROC: the main stat +35% (Swing speed 70), proc'd with Swing speed its primary, the gold PROC'D banner",P.procd&&P.primary==="spd"&&P.stats.spd===70&&P.tier==="mythic"&&P.cls==="unique"&&/PROC'D/.test(P.txt),JSON.stringify(P));
let G=null; for(let i=0;i<60;i++){ G=await page.evaluate(id=>{ const M=window.__dd.Meta; const b=(M.bag?M.bag():[]).find(x=>x.id===id); return b?{ procd:!!b.procd, primary:b.primary, spd:b.stats.spd, name:b.name }:null; },P.id); if(G) break; await sleep(100); }
check("the game's bag has it PROC'D too (the gold stat and the glow are the game's)",G&&G.procd&&G.primary==="spd"&&G.spd===70,JSON.stringify(G));
const Nm=await craft(.01);
check("a third of procs is the jackpot: a NAMED MYTHIC (proc'd)",Nm.tier==="named"&&Nm.procd&&Nm.cls==="unique"&&/PROC/.test(Nm.txt),JSON.stringify(Nm));
const St=await craft(.14,null,3);
check("stoked three times (9 sludge, 15%), a roll of 14% procs; the stoke goes back to none",St.spent===9&&St.procd&&St.stokeAfter===0,JSON.stringify(St));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
