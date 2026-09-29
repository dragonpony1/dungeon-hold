// ===== THE CLOISTER COURT, H2 "THE LONG WAY" (56d-courtdecor.js + game.js crystal2, build 282). Matt picked H2: two Heartroots on the diagonal, lanes all the way down and all the way back, two raised
// terraces toward the middle, the giant tree, "either falls its a fail". Checked: two Heartroots where drawn; the garden is carved (beds, hedges, bushes, the tree, the columns, the second Heartroot's model
// and its bar); every gate's walk is the long way (80+ steps) and still possible; flyers cross the beds; nothing is built on a bed but a tower goes on a lane and on a terrace (which no walker can reach);
// a real wave's walkers never set foot in a bed and reach a Heartroot; a mob at the WEST Heartroot hurts it (not the east one) and its falling ends the run; the hero walks through beds and stands on
// hedges; other maps are untouched.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8909);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8909/?silent&nogate&map=2",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__courtdecor&&window.__dd.map()&&window.__dd.map().id==="court",null,{timeout:120000});
await page.waitForFunction(()=>window.__courtdecor.loaded()&&window.__courtdecor.info().heart2,null,{timeout:120000,polling:500});
const a=await page.evaluate(()=>{ const i=window.__courtdecor.info(), H=window.__dd.hearts(); return Object.assign(i,{hearts:H.map(h=>h.cell.join(",")),procsHidden:window.__courtdecor.probe.procs().pillars.every(p=>!p.visible)}); });
check("two Heartroots where drawn (2 o'clock, 8 o'clock); the garden is carved: beds, hedges on their edges, bushes, the giant tree, twenty marble columns, the West Heartroot's model and its own bar",a.hearts.join("|")==="32,15|11,28"&&a.beds>500&&a.edges>300&&a.pieces>100&&a.bushes>50&&a.trees===1&&a.pillars===20&&a.procsHidden&&a.heart2&&a.bar2,JSON.stringify(a));
const gates=Object.keys(a.after); check("every gate's walk is the long way now (80+ steps) and still possible",gates.length===3&&gates.every(k=>a.after[k]>=80),JSON.stringify({before:a.before,after:a.after}));
const b=await page.evaluate(()=>{ const d=window.__dd, C=window.__courtdecor, Q=C.probe; const beds=[]; for(let z=5;z<=38;z++) for(let x=5;x<=38;x++) if(C.isBed(x,z)) beds.push([x,z]); const fly=beds.every(([x,z])=>Q.flyDist(x,z)>=0); return { fly, walk:d.pathLen(3,1), flyLen:d.pathLenFly(3,1), terraceWalk:d.pathLen(21,14) }; });
check("flyers cross the beds (their way is far shorter); no walker can reach a terrace",b.fly&&b.flyLen>0&&b.flyLen<b.walk-20&&b.terraceWalk<0,JSON.stringify(b));
const w=await page.evaluate(()=>{ const d=window.__dd, C=window.__courtdecor, Q=C.probe, H=d.hearts(); try{ window.__trainer.skip(); }catch(e){} window.__meta&&window.__meta.reset&&window.__meta.reset(); d.start(); d.step(1/60,20); for(const e of d.enemies) d.kill(e);
  d.startWave(); let bad=0, seen=0, minD=1e9, t=0, first=null; const onBed=e=>C.isBed(Q.wc(e.x),Q.wcz(e.z));
  while(t<150){ d.step(1/60,6); t+=.1; d.S.crystal=d.S.crystal2=150; for(const e of d.enemies) if(e.fly&&!e.dead) d.kill(e);   /* flyers cross the beds by design, and an undefended Heartroot falls to a full wave: this checks the WALKERS keep to the lanes and get there */
    for(const e of d.enemies){ if(e.dead||e.fly) continue; seen++; if(onBed(e)){ bad++; if(!first) first=[e.kind,+e.x.toFixed(1),+e.z.toFixed(1)]; } for(const h of H) minD=Math.min(minD,Math.hypot(e.x-h.x,e.z-h.z)); } if(minD<4) break; }
  return { bad, seen, minD:+minD.toFixed(1), t:+t.toFixed(1), first }; });
check("a real wave's walkers never set foot in a bed, and reach a Heartroot the long way",w.bad===0&&w.seen>100&&w.minD<4,JSON.stringify(w));
const c=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,5); d.addMana(3000); d.step(1/60,5);
  const n0=d.defs.length; d.place("harpoon",15,20,0); const n1=d.defs.length; d.place("harpoon",6,20,0); const n2=d.defs.length; d.place("harpoon",21,14,0); const n3=d.defs.length; const t=d.defs[d.defs.length-1];
  return { bed:n1===n0, lane:n2===n1+1, terrace:n3===n2+1, at:t?[+t.x.toFixed(1),+t.z.toFixed(1)]:null }; });
check("nothing is built on a bed; a tower goes on a lane and up on a terrace",c.bed&&c.lane&&c.terrace,JSON.stringify(c));
const h2=await page.evaluate(()=>{ const d=window.__dd, H=d.hearts()[1]; for(const e of d.enemies) d.kill(e); d.step(1/60,3); const s0=d.status(); d.spawn("orc","NW"); d.step(1/60,1); const e=d.enemies[d.enemies.length-1]; e.x=H.x+2.2; e.z=H.z; for(let i=0;i<240;i++){ d.step(1/60,1); e.x=H.x+2.2; e.z=H.z; }
  const s1=d.status(); const out={ c1:s0.crystal, c2:s0.crystal2, c1b:s1.crystal, c2b:s1.crystal2 }; d.kill(e); d.step(1/60,2); d.hurtCrystal(9999,null,2); d.step(1/60,2); out.phase=d.status().phase; return out; });
check("a mob at the WEST Heartroot hurts it (not the east one), and its falling ends the run",h2.c2b<h2.c2&&h2.c1b===h2.c1&&(h2.phase==="deathcut"||h2.phase==="dead"),JSON.stringify(h2));
const p2=await ctx.newPage(); p2.on("pageerror",e=>errors.push(String(e))); await p2.goto("http://127.0.0.1:8909/?silent&nogate&map=2",{timeout:120000}); await p2.waitForFunction(()=>window.__dd&&window.__courtdecor&&window.__courtdecor.probe,null,{timeout:120000});
const hh=await p2.evaluate(()=>{ const d=window.__dd, C=window.__courtdecor, Q=C.probe, hero=Q.hero(); let hx=null, bx=null; for(let z=5;z<=38&&(!hx||!bx);z++) for(let x=5;x<=38;x++){ if(!hx&&C.isHedge(x,z)) hx=[x,z]; if(!bx&&C.isBed(x,z)&&!C.isHedge(x,z)) bx=[x,z]; }
  const top=C.top(hx[0],hx[1]), X=Q.cw(hx[0]), Z=Q.cwz(hx[1]), BX=Q.cw(bx[0]), BZ=Q.cwz(bx[1]);
  const out={ hedgeWall:Q.solidAt(X,Z,0,true), hedgeTopOpen:!Q.solidAt(X,Z,top,true), bedWalk:!Q.solidAt(BX,BZ,0,true), mobWalled:Q.solidAt(BX,BZ,0,false) };
  d.start(); d.step(1/60,5); hero.x=X; hero.z=Z; hero.y=top+1.5; hero.vy=0; hero.grounded=false; d.step(1/60,90); out.landed=+hero.y.toFixed(2); out.top=top; return out; });
check("the hero: a hedge walls him from the ground but he lands and stands on top; he walks straight through a flower bed; mobs are walled by both",hh.hedgeWall&&hh.hedgeTopOpen&&hh.bedWalk&&hh.mobWalled&&Math.abs(hh.landed-hh.top)<.05,JSON.stringify(hh));
const p3=await ctx.newPage(); p3.on("pageerror",e=>errors.push(String(e))); await p3.goto("http://127.0.0.1:8909/?silent&nogate&map=0",{timeout:120000}); await p3.waitForFunction(()=>window.__dd&&window.__courtdecor&&window.__dd.map(),null,{timeout:120000});
const o=await p3.evaluate(()=>({ map:window.__dd.map().id, info:window.__courtdecor.info(), hearts:window.__dd.hearts().length, c2:window.__dd.status().crystal2, bar2:!!document.getElementById("cbar2") }));
check("other maps are untouched: one Heartroot, no second bar, no garden",o.map==="hall"&&o.info===null&&o.hearts===1&&o.c2===null&&!o.bar2,JSON.stringify(o));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
