// ===== THE RAVEN'S LIT NAMEPLATE FOLLOWS H (build 626, 57-raven.js). Matt: "at the raven hero picker the hero changes when you press H but the highlighted name plate doesn't change".
// Checked: by the raven, H switches the hero AND the gold-lit plate moves to the new hero (twice over), a click still lights its plate; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8937,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}});
await ctx.addInitScript(()=>{ try{ if(sessionStorage.getItem('__rp')) return; sessionStorage.setItem('__rp','1'); localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_trainer",JSON.stringify({done:{},off:true})); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8937/?silent&nogate&map=1",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__raven&&window.__heroes,null,{timeout:120000});
await page.evaluate(async()=>{ const d=window.__dd; d.start(); for(let i=0;i<40;i++){ d.step(1/30,1); await new Promise(r=>setTimeout(r,10)); } const p=window.__raven.pos(); d.hero.x=p.x+1.2; d.hero.z=p.z+1.2; for(let i=0;i<10;i++) d.step(1/30,1); });
const lit=()=>page.evaluate(()=>{ const hp=document.getElementById('heroPick'); const on=[...hp.children].filter(b=>b.style.borderColor==='rgb(232, 185, 74)'||b.style.borderColor==='#e8b94a').map(b=>b.dataset.hero); return { hero:window.__heroes.pick(), on, vis:window.__raven.heroPickVisible() }; });
const A=await lit();
check("by the raven: the picker shows, the hero out is the one lit",A.vis&&A.on.length===1&&A.on[0]===A.hero,JSON.stringify(A));
const step=async()=>{ await page.keyboard.press('KeyH'); await page.evaluate(()=>{ for(let i=0;i<3;i++) window.__dd.step(1/30,1); }); await sleep(100); return lit(); };
const B=await step(), C=await step();
check("H: the hero changes and the lit plate moves with it -- both times",B.hero!==A.hero&&B.on.length===1&&B.on[0]===B.hero&&C.hero!==B.hero&&C.on.length===1&&C.on[0]===C.hero,JSON.stringify({A,B,C}));
await page.evaluate(()=>{ const b=[...document.getElementById('heroPick').children].find(b=>b.dataset.hero!==window.__heroes.pick()&&!window.__heroes.locked(b.dataset.hero)); b&&b.click(); for(let i=0;i<3;i++) window.__dd.step(1/30,1); }); await sleep(100);
const D=await lit(); check("a click still lights its plate",D.on.length===1&&D.on[0]===D.hero&&D.hero!==C.hero,JSON.stringify(D));
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
