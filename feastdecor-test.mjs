// ===== THE GREAT FEAST HALL, LIT AND FURNISHED (56e-feastdecor.js, builds 303-304). Matt: "hang a bunch of chandeliers in there", "you have sconses to use too", "use all the decorative assests and outfit
// the dinning hall, I am not sure about the mob pathing yet but you can still get the place ready", and his feast table and taxidermy owlbear. Checked: every piece of art arrives (11 chandeliers, a sconce at
// every painted torch, his tables over the old ones, the fireplaces, doors, the high table's seat/statues/crest, the wall rhythm, the corner furniture, two owlbears); the old procedural pieces are hidden;
// only cells near the walls and in the corners were made solid (within a few cells of a wall) and every gate still has a path to the Heartroot; the floor and wall panels are drawn in a handful of batched draws; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8961,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:800,height:500}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e))); const warns=[]; page.on("console",m=>{ if(m.type()==='warning'&&/feast decor/.test(m.text())) warns.push(m.text().slice(0,160)); });
await page.goto("http://127.0.0.1:8961/?silent&nogate&map=3",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__feastdecor&&window.__dd.map()&&window.__dd.map().id==='feast',null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); });
let i0=null; for(let i=0;i<400;i++){ i0=await page.evaluate(()=>{ window.__dd.step(1/60,1); return window.__feastdecor.info(); }); if(i0.owlbear===2&&i0.table&&i0.fireplace===4&&i0.door===3&&i0.panels&&i0.floorBig) break; await sleep(80); }
check("every piece arrives: 11 chandeliers, a sconce at every painted torch, (build 468: the tables are 56e2-feastwreck.js now) 2 fireplaces (the north two went under the gallery), 3 doors, the seat, 2 statues, the crest, 2 owlbears, the wall rhythm, the corner furniture",
  i0.chandelier===11&&i0.sconce===i0.torchSpots&&i0.sconce>30&&i0.fireplace===2&&i0.door===3&&i0.seat===1&&i0.statue===2&&i0.crest===1&&i0.owlbear===2&&i0.window>=3&&i0.banner>=3&&i0.bookcase===1&&i0.chest===2&&i0.barrel===4,JSON.stringify(i0));
const h=await page.evaluate(()=>{ const U=window.__dd.world?window.__dd.world():null; const sc=window.__dd.scene; const root=typeof sc==='function'?sc():sc; let world=null; root.traverse(o=>{ if(!world&&o.userData&&(o.userData.tableProcs||o.userData.hearthProcs)) world=o; });
  const vis=k=>(world.userData[k]||[]).filter(o=>o.visible).length; return { tables:vis('tableProcs'), hearths:vis('hearthProcs'), barrels:vis('barrelProcs'), crates:vis('crateProcs'), torches:vis('torchProcs'), rings:vis('chandelierProcs'), windows:vis('windowParts') }; });
check("the old procedural tables, hearths, barrels, crates, torches, candle rings and painted windows are all hidden",Object.values(h).every(n=>n===0),JSON.stringify(h));
const r=await page.evaluate(()=>({ reach:window.__feastdecor.reach(), solid:window.__feastdecor.info().solid }));
check("only cells near the walls and in the corners were made solid (within a few cells of a wall), and every gate still has a path to the Heartroot",Object.values(r.reach).every(d=>d>0&&d<1e5)&&r.solid.every(([x,z])=>x<=4||x>=43||z<=5||z>=22),JSON.stringify(r));
const b=await page.evaluate(()=>{ const sc=window.__dd.scene; const root=typeof sc==='function'?sc():sc; const inst=[]; root.traverse(o=>{ if(o.isInstancedMesh&&o.count>20) inst.push(o.count); }); return inst; });
check("the floor, carpet and wall panels are drawn as a handful of batched draws (hundreds of tiles each)",b.length>=3&&b.length<=8&&b.some(n=>n>=250),JSON.stringify(b));
check("no model failed to load",warns.length===0,warns.slice(0,3).join(' | '));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
