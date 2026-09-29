// ===== THE GNOME HALL'S WALLS AND PILLARS (56c-halldecor.js, build 247): Matt, "fix up map 1 ... use the assets we already have". The throne room's finished models hang on map one: eighteen wall pieces (six windows,
// eight banners, two scepter racks, two dragon plaques), four real pillars with a sconce each, the painted banners / windows and the crowded torches hidden. Checked: every piece placed from ONE fetch per model, none in a corner cell
// or a pillar's row or column, the stand-ins hidden, some torches still lit, and no other map touched.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8887);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext(); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","1"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e))); page.on("console",m=>{ if(m.type()==="error"&&/shader|GLSL|WebGLProgram/i.test(m.text())) errors.push(m.text().slice(0,200)); });
await page.goto("http://127.0.0.1:8887/?silent&nogate&map=0",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__halldecor&&window.__halldecor.loaded(),null,{timeout:180000,polling:500});
const r=await page.evaluate(()=>{ const h=window.__halldecor, ps=h.pieces(); let w=null; window.__dd.scene.traverse(o=>{ if(o.userData&&o.userData.bannerMeshes) w=o; });
  const u=w.userData, vis=a=>(a||[]).filter(o=>o.visible).length;
  return { n:ps.length, done:ps.filter(p=>p.done).length, kinds:ps.reduce((a,p)=>(a[p.kind]=(a[p.kind]||0)+1,a),{}), used:h.used(), protos:h.protos().length, pillars:h.pillars(), sconces:h.sconces(), torchesHidden:h.torchesHidden(),
    ps, banners:[(u.bannerMeshes||[]).length,vis(u.bannerMeshes)], rods:[(u.bannerRods||[]).length,vis(u.bannerRods)], win:[(u.windowParts||[]).length,vis(u.windowParts)], pil:[(u.pillarProcs||[]).length,vis(u.pillarProcs)], torches:[(u.torchProcs||[]).length,vis(u.torchProcs)] }; });
check("eighteen wall pieces, all placed: six windows, eight banners, two scepter racks, two dragon plaques",r.n===18&&r.done===18&&r.kinds.window===6&&r.kinds.banner===8&&r.kinds.rack===2&&r.kinds.beast===2,JSON.stringify(r.kinds));
check("one fetch per model (six models) however many spots each serves",r.protos===6&&Object.values(r.used).every(v=>v===1),JSON.stringify(r.used));
check("four real pillars, one sconce on each",r.pillars===4&&r.sconces===4);
check("no piece in a corner cell, a pillar's column (12, 20) on the north and south walls, or a pillar's row (13, 21) on the side walls",r.ps.every(p=>{ const corner=(p.cx===10||p.cx===22)&&(p.cz===11||p.cz===23); const col=p.nz!==0&&(p.cx===12||p.cx===20), row=p.nx!==0&&(p.cz===13||p.cz===21); return !corner&&!col&&!row; }));
check("the small painted banners, their rods, the painted windows and the purple stand-in pillars are all hidden",r.banners[0]>0&&r.banners[1]===0&&r.rods[0]===r.banners[0]&&r.rods[1]===0&&r.win[1]===0&&r.pil[0]===4&&r.pil[1]===0,JSON.stringify({banners:r.banners,rods:r.rods,win:r.win,pil:r.pil}));
check("only the torches a piece would crowd are hidden; the rest of the hall's torches stay lit",r.torchesHidden>0&&r.torches[1]>0&&r.torches[1]===r.torches[0]-r.torchesHidden,JSON.stringify({hidden:r.torchesHidden,torches:r.torches}));
const other=await ctx.newPage(); other.on("pageerror",e=>errors.push(String(e))); await other.goto("http://127.0.0.1:8887/?silent&nogate&map=2",{timeout:120000}); await other.waitForFunction(()=>window.__dd,null,{timeout:120000,polling:500}); await other.waitForTimeout(1500);
check("another map (the Cloister Court) is not touched: no hall pieces, nothing loaded",await other.evaluate(()=>window.__halldecor.pieces().length===0&&!window.__halldecor.loaded()));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no shader or page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
