// ===== THE LOAD TIMER (build 142): "I wish you could time how long it's taking to load map 2". The game times its own load:
// ready (the start screen's tier), everything (nothing left in flight after the 'soon' tier), and the megabytes the model
// fetches brought down, on the build line and as a toast in the hall. This suite checks the timer on map one and map two,
// then loads map two under a throttled connection (MBPS, default 25 and 100) and prints the times and the biggest files.
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path";
const SP=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/,"")); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8936, BASE="http://127.0.0.1:"+PORT; const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];
async function measure(url,mbps){ const ctx=await browser.newContext({viewport:{width:1100,height:700}}); const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.addInitScript(()=>{ try{ localStorage.setItem('ddMapsCleared','1'); }catch(e){} });
  const sizes={}; p.on("response",async r=>{ const u=r.url(); if(!/\/assets\//.test(u)) return; try{ const b=await r.body(); sizes[u.replace(/^.*\/assets\//,'')]=b.length; }catch(e){} });
  if(mbps){ const cdp=await ctx.newCDPSession(p); await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions",{offline:false,latency:30,downloadThroughput:mbps*1e6/8,uploadThroughput:10e6/8}); }
  const t0=Date.now(); await p.goto(BASE+url,{timeout:300000}); await p.waitForFunction(()=>window.__loadtime&&window.__loadtime().all!==null,null,{timeout:600000,polling:250});
  const L=await p.evaluate(()=>({...window.__loadtime(),line:document.getElementById('buildline').textContent,map:window.__dd.map().id})); await ctx.close();
  const big=Object.entries(sizes).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([f,b])=>f+' '+(b/1048576).toFixed(1)+'MB'); return {...L,wall:Date.now()-t0,big}; }
const one=await measure("/?silent&nogate&map=0");
check("map one times its own load: page, ready, soon, everything in order, bytes counted, and the build line shows it",one.map==='hall'&&one.first>0&&one.soon>=one.first&&one.all>=one.soon&&one.bytes>1e6&&/⏱ ready [0-9.]+ s · everything [0-9.]+ s · [0-9.]+ MB/.test(one.line),JSON.stringify({map:one.map,page:one.page,first:one.first,soon:one.soon,all:one.all,mb:+(one.bytes/1048576).toFixed(1),files:one.files,line:one.line}));
const two=await measure("/?silent&nogate&map=1");
check("map two too",two.map==='throne'&&two.first>0&&two.all>=two.soon&&two.bytes>1e6,JSON.stringify({map:two.map,page:two.page,first:two.first,soon:two.soon,all:two.all,mb:+(two.bytes/1048576).toFixed(1),files:two.files}));
console.log("MAP TWO, unthrottled (this machine: software GL, so parse/build time is inflated): ready "+(two.first/1000).toFixed(1)+" s, playable tier "+(two.soon/1000).toFixed(1)+" s, everything "+(two.all/1000).toFixed(1)+" s, "+(two.bytes/1048576).toFixed(1)+" MB in "+two.files+" files");
console.log("  biggest: "+two.big.join(" · "));
for(const mbps of (process.env.MBPS||"25,100").split(",").map(Number)){ const m=await measure("/?silent&nogate&map=1",mbps); console.log("MAP TWO at "+mbps+" Mbps: page "+(m.page/1000).toFixed(1)+" s, ready "+(m.first/1000).toFixed(1)+" s, playable tier "+(m.soon/1000).toFixed(1)+" s, everything "+(m.all/1000).toFixed(1)+" s, "+(m.bytes/1048576).toFixed(1)+" MB"); }
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
