// ===== THE CLOISTER COURT'S HEDGE MAZE (56d-courtdecor.js, build 269). Matt: "map 3 is a big open space, would you like to use these hedge pieces to start to make the mobs around, place the tree somewhere".
// Checked: the maze is there (110 hedge cells, 4 corner pieces) and Matt's models stand in it (hedges, the four trees, the twenty marble columns, the code-built ones hidden); every gate's walk to the crystal is longer
// and still possible; flyers still cross; nothing can be built on a hedge (and still can in the corridor beside it); a real wave's walkers never set foot on one and still reach the Heartroot; the hero is walled by a
// hedge from the ground but lands on and stands on top of one; other maps are untouched.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8909);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8909/?silent&nogate&map=2",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__courtdecor&&window.__dd.map()&&window.__dd.map().id==="court",null,{timeout:120000});
await page.waitForFunction(()=>window.__courtdecor.loaded(),null,{timeout:120000,polling:500});
const a=await page.evaluate(()=>{ const i=window.__courtdecor.info(); const P=window.__courtdecor.probe.procs(), tp=P.trees, pp=P.pillars; return Object.assign(i,{treeProcs:tp.length,treesHidden:tp.every(g=>!g.visible),pillarProcs:pp.length,pillarsHidden:pp.every(g=>!g.visible)}); });
check("the maze is in the court and Matt's models stand in it: 110 hedge cells, 4 corners, the hedge runs, 4 trees, 20 marble columns (the code-built trees and pillars hidden)",a.cells===110&&a.corners===4&&a.pieces>=50&&a.trees===4&&a.pillars===20&&a.treeProcs===4&&a.treesHidden&&a.pillarProcs===20&&a.pillarsHidden&&Object.keys(a.used).length===4,JSON.stringify(a));
const gates=Object.keys(a.before); const longer=gates.every(k=>a.after[k]>0&&a.after[k]>=a.before[k]+10);
check("every gate's walk to the crystal is at least 10 cells longer, and still possible",gates.length===3&&longer,JSON.stringify({before:a.before,after:a.after}));
const b=await page.evaluate(()=>{ const d=window.__dd, C=window.__courtdecor; const out={}; const [sx,sz]=[3,1]; out.walk=d.pathLen(sx,sz); out.fly=d.pathLenFly(sx,sz);
  out.gridIsHedge=C.cells().every(([x,z])=>d.cellAt(x,z)===C.probe.HEDGE); out.flyThrough=C.cells().every(([x,z])=>C.probe.flyDist(x,z)>=0); return out; });
check("flyers cross the hedges (their path runs over hedge cells and is shorter than the walkers')",b.gridIsHedge&&b.flyThrough&&b.fly>0&&b.fly<b.walk-10,JSON.stringify(b));
const c=await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} window.__meta&&window.__meta.reset&&window.__meta.reset(); d.start(); d.step(1/60,20); for(const e of d.enemies) d.kill(e); d.addMana(2000); d.step(1/60,5);
  const n0=d.defs.length; const onHedge=d.place("harpoon",20,11,0); const n1=d.defs.length; const beside=d.place("harpoon",20,13,0); const n2=d.defs.length; const at=d.defs[d.defs.length-1], Q=window.__courtdecor.probe;
  return { n0, n1, n2, onHedge:!!onHedge, besideOk:n2===n1+1, besideCell:at&&[Q.wc(at.x),Q.wcz(at.z)] }; });
check("nothing can be built on a hedge, and a defense still goes in the corridor right beside it",c.n1===c.n0&&c.besideOk,JSON.stringify(c));
const w=await page.evaluate(()=>{ const d=window.__dd, C=window.__courtdecor; for(const def of d.defs.slice()) try{ d.sell&&d.sell(def); }catch(e){}
  d.startWave(); let bad=0, seen=0, minD=1e9, t=0, firstBad=null; const Q=C.probe, onH=e=>C.isHedge(Q.wc(e.x),Q.wcz(e.z));
  while(t<90){ d.step(1/60,6); t+=.1; for(const e of d.enemies){ if(e.dead||e.fly) continue; seen++; if(onH(e)){ bad++; if(!firstBad) firstBad=[e.kind,+e.x.toFixed(1),+e.z.toFixed(1)]; } minD=Math.min(minD,Math.hypot(e.x,e.z)); } if(minD<4) break; }
  return { bad, seen, minD:+minD.toFixed(1), t:+t.toFixed(1), firstBad }; });
check("a real wave's walkers never set foot on a hedge and still reach the Heartroot",w.bad===0&&w.seen>100&&w.minD<4,JSON.stringify(w));
const h=await page.evaluate(()=>{ const d=window.__dd, C=window.__courtdecor; for(const e of d.enemies) d.kill(e); const Q=C.probe, hero=Q.hero(), solidAt=Q.solidAt, floorAt=Q.floorAt; const [cx,cz]=[24,11], top=C.top(cx,cz), x=Q.cw(cx), z=Q.cwz(cz);
  const out={ top, wallFromGround:solidAt(x,z,0,true), openOnTop:!solidAt(x,z,top,true), mobWalled:solidAt(x,z,0,false), floorOnTop:floorAt(x,z,top+.2) };
  hero.x=x; hero.z=z; hero.y=top+1.5; hero.vy=0; hero.grounded=false; d.step(1/60,90); out.landedY=+hero.y.toFixed(2); out.stillThere=Math.hypot(hero.x-x,hero.z-z)<.8; return out; });
check("the hero: walled by a hedge from the ground, but lands on and stands on top of one (mobs stay walled)",h.top>1&&h.wallFromGround&&h.openOnTop&&h.mobWalled&&Math.abs(h.floorOnTop-h.top)<1e-6&&Math.abs(h.landedY-h.top)<.05&&h.stillThere,JSON.stringify(h));
// another map: untouched
const p2=await ctx.newPage(); p2.on("pageerror",e=>errors.push(String(e))); await p2.goto("http://127.0.0.1:8909/?silent&nogate&map=0",{timeout:120000}); await p2.waitForFunction(()=>window.__dd&&window.__courtdecor&&window.__dd.map(),null,{timeout:120000});
const o=await p2.evaluate(()=>({ map:window.__dd.map().id, info:window.__courtdecor.info(), water:(()=>{ let n=0; const M=window.__dd.map(); for(let z=0;z<M.gh;z++) for(let x=0;x<M.gw;x++) if(window.__dd.cellAt(x,z)===8) n++; return n; })() }));
check("other maps are untouched (the Gnome Hall has no maze)",o.map==="hall"&&o.info===null&&o.water===0,JSON.stringify(o));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
