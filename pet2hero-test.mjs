// ===== EACH HERO KEEPS THEIR OWN 2ND PET (build 571; parts/staging/97h-tworings.js dd_heroPet2). Matt: "whenever the map changes or maybe even when you change charcters the 2nd pet is unequipping on its own".
// Checked: the Knight in Malamute with a 2nd pet keeps it through a reload onto another map; switching to the Witch (no ring) she has none and nothing goes to the bag; back to the Knight, his 2nd pet is back;
// taking the ring off sends it to the bag as before.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8858,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const ctx=await browser.newContext({viewport:{width:1100,height:700}}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.route(/workers\.dev|\/api\//,r=>r.fulfill({status:404,body:''}));
await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const ready=async()=>p.waitForFunction(()=>window.__dd&&window.__tworings&&window.__dd.heroModel()&&window.__heroes,null,{timeout:120000});
await p.goto("http://127.0.0.1:8858/?silent&nogate&map=0"); await ready();
const A=await p.evaluate(async()=>{ const d=window.__dd, M=window.__meta, N=window.__mythic, R=window.__tworings; try{ window.__trainer.skip(); }catch(e){} await window.__heroes.select('knight'); d.start(); d.step(1/60,5);
  const ring=N.normalize({tier:'named',named:'malamute',lvl:5}); M.giveItem(ring); M.equip(ring.id); const f1=d.rollItem(2,'familiar',5); M.giveItem(f1); M.equip(f1.id); const f2=d.rollItem(2,'familiar',5); M.giveItem(f2); const ok=R.equip2(f2.id); d.step(1/60,30); M.save&&M.save();
  return { ok, id:f2.id }; });
await p.goto("http://127.0.0.1:8858/?silent&nogate&map=1"); await ready(); await p.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,60); });
const B=await p.evaluate(()=>{ const g=window.__dd.gear(); return { id:g.familiar2&&g.familiar2.id, returned:window.__tworings.info().returned }; });
check("a reload onto another map: the Knight's 2nd pet is still on",A.ok&&B.id===A.id&&B.returned===0,JSON.stringify({A,B}));
const C=await p.evaluate(async()=>{ const d=window.__dd, M=window.__meta; const bag0=M.bag().length; await window.__heroes.select('witch'); d.step(1/60,30); const w={ id:d.gear().familiar2&&d.gear().familiar2.id, bagGrew:M.bag().length>bag0, returned:window.__tworings.info().returned };
  await window.__heroes.select('knight'); d.step(1/60,30); return { w, k:d.gear().familiar2&&d.gear().familiar2.id, ring:d.gear().charm&&d.gear().charm.named }; });
check("to the Witch: she wears none and nothing went to the bag; back to the Knight: his 2nd pet and his ring are back",!C.w.id&&!C.w.bagGrew&&C.w.returned===0&&C.k===A.id&&C.ring==='malamute',JSON.stringify(C));
const D=await p.evaluate(()=>{ const d=window.__dd, M=window.__meta; M.unequip('charm'); d.step(1/60,10); return { id:d.gear().familiar2&&d.gear().familiar2.id, inBag:M.bag().some(b=>b.id&&d.gear().familiar2===undefined||b.slot==='familiar'), returned:window.__tworings.info().returned }; });
check("the ring off: the 2nd pet goes to the bag, as before",!D.id&&D.returned===1,JSON.stringify(D));
check("no page errors",errs.length===0,JSON.stringify(errs.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
