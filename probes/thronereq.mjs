// probe: every asset request map two (the throne room) makes while it loads -- URL, size, how many times -- and the load timer.
// usage: cd <worktree> && DIST=$PWD/dist node probes/thronereq.mjs [map index, default 1]
import { chromium } from "playwright"; import { serve } from "../serve.mjs"; import path from "path";
const SP=path.dirname(path.dirname(new URL(import.meta.url).pathname)); const DIST=process.env.DIST||SP+"/dist";
const PORT=8951, BASE="http://127.0.0.1:"+PORT; const server=await serve(PORT,{dist:DIST}); const MAPI=process.argv[2]||"1";
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const ctx=await browser.newContext({viewport:{width:1100,height:700}}); const p=await ctx.newPage();
await p.addInitScript(()=>{ try{ localStorage.setItem('ddMapsCleared','1'); }catch(e){} });
const req={}; p.on("request",r=>{ const u=r.url(); if(!/\/assets\//.test(u)) return; const k=u.replace(/^.*\/assets\//,''); (req[k]=req[k]||{n:0,bytes:0}).n++; });
p.on("response",async r=>{ const u=r.url(); if(!/\/assets\//.test(u)) return; const k=u.replace(/^.*\/assets\//,''); try{ const b=await r.body(); req[k].bytes+=b.length; req[k].size=b.length; }catch(e){} });
await p.goto(BASE+"/?silent&nogate&map="+MAPI,{timeout:300000}); await p.waitForFunction(()=>window.__loadtime&&window.__loadtime().all!==null,null,{timeout:600000,polling:250});
await p.waitForTimeout(1500);
const L=await p.evaluate(()=>({...window.__loadtime(),map:window.__dd.map().id}));
const rows=Object.entries(req).sort((a,b)=>b[1].bytes-a[1].bytes); let tot=0, n=0, dup=0;
for(const [k,v] of rows){ tot+=v.bytes; n+=v.n; if(v.n>1) dup+=v.bytes-(v.size||0); console.log(String(v.n).padStart(3)+"x "+((v.size||0)/1048576).toFixed(2).padStart(6)+" MB each  "+(v.bytes/1048576).toFixed(2).padStart(6)+" MB total  "+k); }
console.log("MAP "+L.map+": "+n+" requests, "+rows.length+" distinct URLs, "+(tot/1048576).toFixed(1)+" MB transferred, of which "+(dup/1048576).toFixed(1)+" MB repeats; LOADT bytes "+(L.bytes/1048576).toFixed(1)+" MB files "+L.files+" first "+L.first+" soon "+L.soon+" all "+L.all);
await browser.close(); server.close();
