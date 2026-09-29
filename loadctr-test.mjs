// ===== THE ASSET COUNTER AND THE TUTORIAL TOOLTIP (11-loadbar.js place(), build 251). Matt: "asset count and tooltip overlap in tutorial". The tutorial's big tooltip (#tut) runs from 46 px down to ~157;
// the counter used to sit at 64 px on top of it. Now, while the tooltip is up, the counter sits just under it (and follows its height); with no tooltip (a normal room) it is back at 64 px.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8890);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const rects=p=>p.evaluate(()=>{ const rc=id=>{ const e=document.getElementById(id), r=e.getBoundingClientRect(); return {top:Math.round(r.top),bottom:Math.round(r.bottom)}; }; window.__loadctr.el().style.display="block"; window.__loadctr.place(); return { tut:rc("tut"), ctr:rc("loadctr"), on:document.getElementById("tut").classList.contains("on"), top:window.__loadctr.el().style.top }; });
for(const [w,h,label] of [[1280,720,"a computer"],[844,390,"a phone on its side"]]){
  const ctx=await browser.newContext({viewport:{width:w,height:h}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); }catch(e){} }); const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("http://127.0.0.1:8890/?tutorial=1&silent",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__tutorial&&window.__loadctr,null,{timeout:120000});
  await page.evaluate(()=>{ const b=[...document.querySelectorAll("button,a,div")].find(e=>/START THE TUTORIAL/i.test(e.textContent)&&e.children.length<3); if(b) b.click(); });
  await page.waitForFunction(()=>document.getElementById("tut")&&document.getElementById("tut").classList.contains("on"),null,{timeout:60000}).catch(()=>{}); await page.evaluate(()=>window.__dd.step(1/60,40)); await page.waitForTimeout(400);
  const r=await rects(page); check("on "+label+" the tutorial tooltip is up and the asset counter sits under it, not on it",r.on&&r.ctr.top>=r.tut.bottom,JSON.stringify(r));
  await ctx.close(); }
const ctx2=await browser.newContext({viewport:{width:1280,height:720}}); const p2=await ctx2.newPage(); p2.on("pageerror",e=>errors.push(String(e))); await p2.goto("http://127.0.0.1:8890/?silent&nogate",{timeout:120000}); await p2.waitForFunction(()=>window.__dd&&window.__loadctr&&document.getElementById("tut"),null,{timeout:120000}).catch(()=>{});
await p2.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); });   // out of the title screen and into a room
const has=await p2.evaluate(()=>!!document.getElementById("tut")); if(has){ const r2=await rects(p2); check("in an ordinary room (no tooltip) the counter stays at 64 px, under BUILD PHASE",!r2.on&&r2.top==="64px",JSON.stringify(r2)); } else { check("in an ordinary room there is no tooltip element, so the counter is at 64 px",await p2.evaluate(()=>{ window.__loadctr.place(); return window.__loadctr.el().style.top==="64px"; })); }
const ctx3=await browser.newContext({viewport:{width:1280,height:720}}); const p3=await ctx3.newPage(); p3.on("pageerror",e=>errors.push(String(e))); await p3.goto("http://127.0.0.1:8890/?silent",{timeout:120000}); await p3.waitForFunction(()=>window.__loadctr,null,{timeout:120000});
const t3=await p3.evaluate(()=>{ const el=window.__loadctr.el(); el.style.display="block"; window.__loadctr.place(); const r=el.getBoundingClientRect(), h1=document.querySelector("#start h1").getBoundingClientRect(); return { r:{l:Math.round(r.left),t:Math.round(r.top),r:Math.round(r.right),b:Math.round(r.bottom)}, h1:{l:Math.round(h1.left),t:Math.round(h1.top),r:Math.round(h1.right),b:Math.round(h1.bottom)} }; });
check("on the title screen the counter sits small in the top-left corner, clear of the ROOTGATE logo",t3.r.r<=t3.h1.l||t3.r.b<=t3.h1.t||t3.r.l>=t3.h1.r,JSON.stringify(t3));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,2).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
