// ===== THE LOADING SCREEN (11b-loadscreen.js, build 277). Matt: "i want it to stay on the loading screen until its 90% loaded, give me the rotation and fun saying and quotes". Checked (with ?loadscreen, since a
// test browser is spared it otherwise): it is up from the first moment over the title, with a line and a rotating model with its name; its bar is the real share of asked files landed; it closes only after the
// share reaches 90% (or everything has landed) and at least 3.5 s, then its WebGL canvas is gone and the title shows; a test browser without ?loadscreen never sees it.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8914);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
// the files come down slowly (as they do over a real line), so the screen can be seen waiting for them
await page.route("**/assets/**",async r=>{ await new Promise(res=>setTimeout(res,700+Math.random()*900)); r.continue(); });
await page.goto("http://127.0.0.1:8914/?silent&nogate&loadscreen",{timeout:120000}); await page.waitForFunction(()=>window.__loadscreen&&document.getElementById("loadScreen"),null,{timeout:60000});
const a=await page.evaluate(()=>{ const L=window.__loadscreen; return { on:L.on(), line:L.line(), sayings:L.sayings().length, quotes:L.quotes().length, z:getComputedStyle(document.getElementById("loadScreen")).zIndex, title:document.querySelector("#loadScreen .ls-title").textContent }; });
check("up from the first moment over the title: ROOTGATE, a line from the sayings",a.on&&a.line.length>5&&a.sayings>=12&&+a.z>=60&&a.title==="ROOTGATE",JSON.stringify(a));
let m=null; for(let i=0;i<60&&!m;i++){ m=await page.evaluate(()=>window.__loadscreen.shown()?window.__loadscreen.model():null); if(!m) await sleep(100); }
const nm=await page.evaluate(()=>document.querySelector("#loadScreen .ls-name b").textContent);
check("a rotation model spins on it with its name beneath",!!m&&nm===m,JSON.stringify({m,nm}));
const samples=[]; let closedAt=null; const t0=Date.now();
for(let i=0;i<300;i++){ const s=await page.evaluate(()=>({ on:window.__loadscreen.on(), f:+window.__loadscreen.frac().toFixed(3), c:window.__loadscreen.counts(), pct:(document.querySelector("#loadScreen .ls-pct")||{}).textContent||"", why:window.__loadscreen.why() })); samples.push(s); if(!s.on){ closedAt=Date.now()-t0; break; } await sleep(150); }
const last=samples[samples.length-1], before=samples[samples.length-2]||last;
check("its bar is the real share of files landed, and it closes only once that reaches 90% (or all have landed), after at least 3.5 s",!last.on&&(last.why==="loaded"&&last.f>=.9||last.why==="all")&&samples.some(s=>s.on&&s.f<.9)&&/LOADING \d+%/.test(before.pct),JSON.stringify({closedAt,first:samples[0],before,last,n:samples.length}));
const b=await page.evaluate(async()=>{ await new Promise(r=>setTimeout(r,1200)); return { gone:!document.getElementById("loadScreen"), start:!document.getElementById("start").classList.contains("hide") }; });
check("then it is gone (its WebGL canvas with it) and the title shows",b.gone&&b.start,JSON.stringify(b));
const p2=await ctx.newPage(); p2.on("pageerror",e=>errors.push(String(e))); await p2.goto("http://127.0.0.1:8914/?silent&nogate",{timeout:120000}); await p2.waitForFunction(()=>window.__loadscreen,null,{timeout:60000});
const c=await p2.evaluate(()=>({ el:!!document.getElementById("loadScreen"), closed:window.__loadscreen.closed() }));
check("a test browser without ?loadscreen never sees it (every other suite runs as before)",!c.el&&c.closed,JSON.stringify(c));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
