// ===== HIDEOUT BUILD 49: the way back to the hall is the PORTAL -- a new save has it standing, an old save gets it placed once (taken out of its hotbar), and the embedded
// BACK TO THE HALL button (a safety hatch) only shows while no portal stands in the room. Folder build only.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8882);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function frameOf(page){ for(let i=0;i<400;i++){ const f=page.frames().find(f=>f.url().includes("hideout/index.html")); if(f) return f; await sleep(50); } return null; }
async function visit(seed){ const ctx=await browser.newContext(); if(seed) await ctx.addInitScript(s=>{ try{ if(!localStorage.getItem('dd_hideout_save_v2')) localStorage.setItem('dd_hideout_save_v2',JSON.stringify(s)); }catch(e){} },seed);
  const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e))); await p.goto("http://127.0.0.1:8882/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__hideout,null,{timeout:60000});
  await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,10); window.__hideout.open(); }); const f=await frameOf(p); await f.waitForFunction(()=>window.__hd&&window.__hd.entries().length>=3,null,{timeout:120000}); await sleep(1500); return {ctx,p,f}; }
// a brand-new player
{ const {ctx,f}=await visit(null); const portals=await f.evaluate(()=>window.__hd.portals());
  check("a new player's hideout has the portal standing (and the machines)",portals===1&&(await f.evaluate(()=>window.__hd.entries().length))>=5,String(portals));
  check("with a portal standing, the BACK TO THE HALL button is hidden",(await f.evaluate(()=>window.__hd.leaveBtn()))==="none");
  await f.evaluate(()=>{ const e=pickupables.find(p=>p.gid==='portal'); despawnEntry(e); });
  await sleep(1200);
  check("if the portal is ever taken down the button comes back (a safety hatch)",(await f.evaluate(()=>window.__hd.leaveBtn()))==="inline-block");
  await ctx.close(); }
// an old save that never set its portal down: it sits in the hotbar
{ const OLD={sludge:100,legendarySludge:20,commonSludge:0,uncommonSludge:0,gear:[],starterLayout:1,forgeBig:1,hotbar:["portal",null,null,null,null,null,null,null,null],bag:new Array(27).fill(null),
    placed:[{pid:"a",gid:"vending_machine",x:-15.22,z:-12.05,ry:0},{pid:"b",gid:"sludge_cauldron",x:-7.61,z:-12.6,ry:0},{pid:"c",gid:"ore_forge",x:7.61,z:-12.25,ry:0},{pid:"d",gid:"wall_locker",x:0,z:-13.12,ry:0}]};
  const {ctx,p,f}=await visit(OLD); const portals=await f.evaluate(()=>window.__hd.portals());
  const save=await p.evaluate(()=>JSON.parse(localStorage.getItem('dd_hideout_save_v2')||'null'));
  const inHotbar=await f.evaluate(()=>SAVE.hotbar.includes('portal')||SAVE.bag.includes('portal'));
  check("an old save that never placed its portal gets it stood up once, taken out of its hotbar",portals===1&&!inHotbar,JSON.stringify({portals,inHotbar}));
  check("...and the step is remembered (portalStep) so it never repeats",await f.evaluate(()=>SAVE.portalStep===1));
  await ctx.close(); }
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,2).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
