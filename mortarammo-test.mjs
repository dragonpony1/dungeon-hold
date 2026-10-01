// ===== THE MORTARS RUN DRY (56g-prisonwalls.js, build 369). Matt: "lol let cut these mortar off at about 8 rounds each and see what happens". Checked: a Hex Mortar rolls out with eight shells and a row of eight lit pips above it;
// each shell fired puts one out; the eighth is the last (it fires exactly eight, no more, however long a target stays in range); then it goes dry (a puff of smoke, its green light out, the dry flag) and the pips are all dark.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8992,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:900,height:560}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8992/?silent&nogate&map=5&noshow",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__prisonwalls&&window.__mortarwake&&window.__dd.map().id==='prison',null,{timeout:120000});
await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,5); });
for(let i=0;i<300;i++){ const n=await page.evaluate(()=>{ window.__dd.step(1/60,1); return window.__prisonwalls.walls().length; }); if(n===2) break; await new Promise(r=>setTimeout(r,100)); }
await page.evaluate(async()=>{ const d=window.__dd; window.__mortarwake.wake(); d.S.phase='wave'; d.S.crystal=1e6; window.__prisonwalls.hit('W',100); for(let i=0;i<60*6;i++){ d.step(1/60,1); d.S.crystal=1e6; } });
for(let i=0;i<100;i++){ const m=await page.evaluate(()=>{ window.__dd.step(1/60,1); return window.__prisonwalls.mortars(); }); if(m.length&&m[0].rolled) break; await new Promise(r=>setTimeout(r,100)); }
const A=await page.evaluate(()=>{ const d=window.__dd; for(let i=0;i<20;i++) d.step(1/60,1); const m=window.__prisonwalls.mortars()[0]; return { m, AMMO:window.__prisonwalls.AMMO }; });
check("a Hex Mortar rolls out with eight shells and eight lit pips above it",A.AMMO===8&&A.m.ammo===8&&A.m.pipsLit===8&&!A.m.dry,JSON.stringify(A));
const B=await page.evaluate(()=>{ const d=window.__dd; d.spawn('goblin','E'); const e=d.enemies[d.enemies.length-1]; e.hp=e.max=1e12; e.spd=0; e.x=-11; e.z=8; let shellsAt3=null; const seen=[8];
  for(let i=0;i<60*120;i++){ d.step(1/60,1); d.S.crystal=1e6; e.hp=e.max=1e12; e.x=-11; e.z=8; const m=window.__prisonwalls.mortars()[0]; if(m.ammo!==seen[seen.length-1]){ seen.push(m.ammo); if(m.ammo===5) shellsAt3={ ammo:m.ammo, pips:m.pipsLit, fires:m.fires }; } }
  const m=window.__prisonwalls.mortars()[0]; const info=window.__prisonwalls.info(); return { seen, shellsAt3, m, shells:info.shells, dryCount:info.dry }; });
check("every shell puts a pip out (eight, seven, six ... down to none), and it fires exactly eight shells however long the goblin stands in range for two minutes",B.seen[0]===8&&B.seen[B.seen.length-1]===0&&B.seen.length===9&&B.m.fires===8&&B.shells===8,JSON.stringify({ seen:B.seen, fires:B.m.fires, shells:B.shells }));
check("at five shells left five pips were lit; empty, all dark",B.shellsAt3&&B.shellsAt3.pips===5&&B.m.pipsLit===0,JSON.stringify({ at5:B.shellsAt3, end:B.m.pipsLit }));
check("then it goes dry: the dry flag, once (a puff of smoke, no more shells), the other mortar's room is untouched",B.m.dry&&B.dryCount===1,JSON.stringify({ dry:B.m.dry, dryCount:B.dryCount }));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
