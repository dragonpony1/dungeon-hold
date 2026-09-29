// ===== THE TITLE SCREEN'S ROTATING BACKGROUND (19b-titlepick.js, 20b-titlestage.js, build 256). Matt: "loading screen has our background rotation in it, add fire imp and storm drake", and the Storm Halberd "6/7" with "a moniker showing its name". Seven backgrounds: the painting
// and six slow-spinning 3D models on black (Fire Bow, Wisp projectile, Fire Imp, Storm Drake, Trimaw, 6/7), each with its name under it. A browser a test drives gets the painting (so the other suites stay steady); ?titlebg=<name> forces one. Checked: each model
// loads and draws (lit pixels), the painting is not fetched when another is picked, and the moment the game starts the canvas, the loop and the WebGL context are gone.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8895);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const open=async(q)=>{ const ctx=await browser.newContext({viewport:{width:1280,height:720}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); }catch(e){} }); const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e))); const reqs=[]; p.on("request",r=>reqs.push(r.url()));
  await p.goto("http://127.0.0.1:8895/?silent"+q,{timeout:120000}); await p.waitForFunction(()=>window.__titlestage&&window.__dd,null,{timeout:120000}); return {ctx,p,reqs}; };
{ const {ctx,p,reqs}=await open(""); const r=await p.evaluate(()=>({want:window.__titlestage.want,list:window.__titleList,canvas:!!document.getElementById("titleStage"),art:window.__titleart&&window.__titleart.on()}));
  await p.waitForTimeout(1500);
  check("a browser a test drives gets the painting (no 3D canvas), and the list holds all seven names",r.want==="portal"&&!r.canvas&&r.list.join()==="portal,firebow,wisp,imp,drake,trimaw,sixseven",JSON.stringify(r)); await ctx.close(); }
const NAMES={firebow:"DRACONIC FIRE BOW",wisp:"WISP PROJECTILE",imp:"FIRE IMP",drake:"STORM DRAKE",trimaw:"TRIMAW",sixseven:"6/7"};
for(const n of ["firebow","wisp","imp","drake","trimaw","sixseven"]){
  const {ctx,p,reqs}=await open("&titlebg="+n); await p.waitForFunction(()=>window.__titlestage.loaded(),null,{timeout:120000}).catch(()=>{}); await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{ const c=document.getElementById("titleStage"), st=document.getElementById("start"); const snap=window.__titlestage.snapshot(); return { moniker:window.__titlestage.moniker(), want:window.__titlestage.want, canvas:!!c&&c.parentNode===st, on:c&&c.classList.contains("on"), running:window.__titlestage.running(), loaded:window.__titlestage.loaded(), stage:st.classList.contains("stage"), snap }; });
  const painting=reqs.filter(u=>/title-bg/.test(u)).length;
  check(n+": the model loads and draws on black under the spotlight (a few percent of the screen lit), its name shows under it, the painting is not fetched",r.want===n&&r.moniker&&r.moniker.name===NAMES[n]&&r.moniker.on&&r.canvas&&r.on&&r.running&&r.loaded&&r.stage&&r.snap&&r.snap.lit/r.snap.total>.01&&r.snap.lit/r.snap.total<.6&&painting===0,JSON.stringify(Object.assign({},r,{painting})));
  if(n==="drake"){ await p.evaluate(()=>window.__dd.start()); await p.waitForTimeout(1500); const g=await p.evaluate(()=>({running:window.__titlestage.running(),canvas:!!document.getElementById("titleStage")}));
    check("the moment the game starts the loop stops and the canvas (and its WebGL context) is gone",!g.running&&!g.canvas,JSON.stringify(g)); }
  await ctx.close(); }
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
