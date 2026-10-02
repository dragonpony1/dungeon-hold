// ===== TAB IN THE HIDEOUT, AND THE TEN ARMOR STANDS (game build 440 + hideout build 82). Matt: "that tab menu the one we were callling tavern needs to work in the hide out" / "the armor stands are not really
// available in the wall locker, when you earn them, they have a place holder but they arn't really there" (and his ten retextured stands).
// Checked: Tab inside the hideout opens the character sheet over the room (on top of it); closing it hands the room back ('hideout:bagClosed'); the controls line lists Tab; every one of the ten stands has its
// real model and picture in the hideout, and each model and picture loads; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8983,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8983/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__hideout&&window.__hideoutbag&&window.__doll,null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); window.__hideout.open(); });
let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof openHallSheet==='function'&&typeof MODEL_MAP!=='undefined',null,{timeout:120000});
const help=await f.evaluate(()=>document.getElementById('start').textContent);
await f.evaluate(()=>{ window.__msgs=[]; addEventListener('message',e=>{ if(typeof e.data==='string') window.__msgs.push(e.data); }); openHallSheet(); });
await page.waitForFunction(()=>window.__doll.isOpen(),null,{timeout:5000});
const a=await page.evaluate(()=>({ open:window.__doll.isOpen(), z:+getComputedStyle(document.getElementById('doll')).zIndex, wrapZ:+getComputedStyle(document.getElementById('hideoutWrap')).zIndex, from:window.__hideoutbag.sheetOpen() }));
check("Tab in the hideout opens the character sheet right over the room; the controls line lists Tab",a.open&&a.from&&a.z>a.wrapZ&&/Tab: sheet/.test(help),JSON.stringify({a,help:/Tab: sheet/.test(help)}));
await page.evaluate(()=>window.__doll.close()); await sleep(400);
const got=await f.evaluate(()=>window.__msgs.slice()); const b=await page.evaluate(()=>({ open:window.__doll.isOpen(), from:window.__hideoutbag.sheetOpen(), z:document.getElementById('doll').style.zIndex }));
check("closing it hands the room back (the hideout is told)",!b.open&&!b.from&&b.z===''&&got.includes('hideout:bagClosed'),JSON.stringify({b,got}));
const st=await f.evaluate(async()=>{ const out={}; for(const s of STAND_SETS){ const gid='stand_'+s, m=MODEL_MAP[gid], ic=GEAR[gid]&&GEAR[gid].icon; const ok=async u=>{ try{ const r=await fetch(u); return r.status; }catch(e){ return 0; } };
    out[s]={ model:m||null, ms:m?Math.min(await ok(PROPS_DIR+m),await ok(PROPS_DIR+m+'.txt')):0, is:ic?await ok(ic):0 }; } return out; }).catch(async e=>{ return await f.evaluate(async()=>{ const out={}; for(const s of STAND_SETS){ const gid='stand_'+s, m=MODEL_MAP[gid], ic=GEAR[gid]&&GEAR[gid].icon; const ok=async u=>{ try{ return (await fetch(u)).status; }catch(e){ return 0; } }; out[s]={ model:m||null, ms:m?await ok('assets/hideout/props/'+m):0, is:ic?await ok(ic):0 }; } return out; }); });
check("all ten armor stands have their real model and picture, and both load",Object.keys(st).length===10&&Object.values(st).every(v=>v.model&&v.ms===200&&v.is===200),JSON.stringify(st));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
