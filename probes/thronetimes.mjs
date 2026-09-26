// probe: map two's load timer, BEFORE vs AFTER builds measured alternately (so both share the same machine load), at
// several throttles. usage: cd <worktree> && A=<dist a> B=<dist b> ROUNDS=2 MBPS=0,100,25 node probes/thronetimes.mjs
// Prints ready (first tier), playable ('soon' tier), everything, MB and files per run, then the median per build/throttle.
import { chromium } from "playwright"; import { serve } from "../serve.mjs";
const D={A:process.env.A,B:process.env.B}, PORTS={A:8956,B:8957}, ROUNDS=+(process.env.ROUNDS||2), MBPS=(process.env.MBPS||"0,100,25").split(",").map(Number);
const servers=[await serve(PORTS.A,{dist:D.A}),await serve(PORTS.B,{dist:D.B})];
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
async function one(k,mbps){ const ctx=await browser.newContext({viewport:{width:1100,height:700}}); const p=await ctx.newPage();
  await p.addInitScript(()=>{ try{ localStorage.setItem('ddMapsCleared','1'); }catch(e){} });
  if(mbps){ const cdp=await ctx.newCDPSession(p); await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions",{offline:false,latency:30,downloadThroughput:mbps*1e6/8,uploadThroughput:10e6/8}); }
  await p.goto("http://127.0.0.1:"+PORTS[k]+"/?silent&nogate&map=1",{timeout:300000}); await p.waitForFunction(()=>window.__loadtime&&window.__loadtime().all!==null,null,{timeout:600000,polling:250});
  const L=await p.evaluate(()=>window.__loadtime()); await ctx.close(); return L; }
const res={}; const f=ms=>(ms/1000).toFixed(1);
for(let r=0;r<ROUNDS;r++) for(const mbps of MBPS) for(const k of (r%2?["B","A"]:["A","B"])){ const L=await one(k,mbps); (res[k+mbps]=res[k+mbps]||[]).push(L);
  console.log("round "+(r+1)+" "+k+" "+(mbps?mbps+" Mbps":"unthrottled")+": ready "+f(L.first)+" s, playable "+f(L.soon)+" s, everything "+f(L.all)+" s, "+(L.bytes/1048576).toFixed(1)+" MB in "+L.files+" files"); }
const med=a=>{ const s=a.slice().sort((x,y)=>x-y); return s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2; };
for(const mbps of MBPS) for(const k of ["A","B"]){ const a=res[k+mbps]; console.log("MEDIAN "+k+" "+(mbps?mbps+" Mbps":"unthrottled")+": ready "+f(med(a.map(x=>x.first)))+" s, playable "+f(med(a.map(x=>x.soon)))+" s, everything "+f(med(a.map(x=>x.all)))+" s ("+a.length+" runs)"); }
await browser.close(); servers.forEach(s=>s.close());
