// ===== MAP 3 TUNING (build 291). Matt: "i was kinda not haveing fun on map 3 then i gave myself some mana and it became more fun. we need about 400 more mana, 20 more roots and you can increase that
// starting wave mob count by 30". Checked: the Cloister Court starts with 920 mana (was 520) and 80 roots (was 60); its first wave has 30 more goblins than the formula gives, in time order; its second
// wave is untouched; the first map (the hall) is untouched; (build 294) no mob speeds up by wave and damage climbs only 1% a wave; (build 299) ten topiaries stand in the beds.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8943,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8943/?silent&nogate&map=2",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__courtdecor&&window.__dd.map()&&window.__dd.map().id==="court",null,{timeout:120000});
const a=await page.evaluate(()=>{ const d=window.__dd; const M=d.map(); const w1=M.wbase+1, w2=M.wbase+2; const gob=w=>d.waveComp(w).q.filter(x=>x.kind==='goblin').length;
  const q1=d.waveComp(w1).q; let sorted=true; for(let i=1;i<q1.length;i++) if(q1[i].t<q1[i-1].t) sorted=false;
  return { mana:d.status().mana, duCap:d.worldInfo().duCap, w1, g1:gob(w1), want1:6+3*w1+30+Math.floor(w1/2)*(w1>=3?1:0)+0, g2:gob(w2), want2:6+3*w2+(w2>=3?Math.floor(w2/2):0)+0, total1:q1.length, sorted, desc:d.waveComp(w1).desc }; });
check("the Cloister Court starts with 920 mana (was 520) and 80 roots (was 60)",a.mana===920&&a.duCap===80,JSON.stringify({mana:a.mana,duCap:a.duCap}));
check("its first wave brings 30 more goblins than before, coming out in time order",a.g1===a.want1&&a.sorted,JSON.stringify(a));
check("its second wave has only its own goblins, plus one for each bandit and troll archer taken out (builds 313-314)",a.g2===a.want2,JSON.stringify({g2:a.g2,want2:a.want2}));
const nb=await page.evaluate(()=>{ const d=window.__dd, M=d.map(); const out=[]; window.__wb=M.wbase; for(let k=1;k<=M.waves;k++){ const c=d.waveComp(M.wbase+k); const n=kd=>c.q.filter(x=>x.kind===kd).length; out.push({k,total:c.q.length,bandits:n('archer'),trolls:n('troll'),wolves:n('direwolf'),goblins:n('goblin'),orcs:n('orc'),drakes:n('drake'),desc:c.desc}); } return out; });
const last=nb[nb.length-1]; const wb=await page.evaluate(()=>window.__wb);
check("build 327 (Matt: \"trad out all the trol archers for dire wolves\"): no court wave has a troll archer -- each one is a pair of dire wolves, and the wave line says Dire Wolves",nb.every(x=>x.trolls===0)&&nb.every((x,i)=>x.wolves===2*Math.min(4,1+Math.floor((wb+i+1-8)/3))&&(x.wolves?/Dire Wolves ×/.test(x.desc):true)),JSON.stringify(nb.map(x=>[x.k,x.trolls,x.wolves])));
check("build 313 (Matt: take out all bandits from entire map): no court wave has a bandit, and none says so in its wave line",nb.every(x=>x.bandits===0&&!/Bandit/.test(x.desc)),JSON.stringify(nb.map(x=>[x.k,x.bandits,x.desc])));
check("build 313 (Matt, for the Archhag's wave: keep the goblins and orcs, take out ranged mobs): her wave has no troll archers either, keeps its orcs, and its crowd is still over a hundred",last.trolls===0&&last.orcs>0&&last.goblins>60&&last.total>=100&&!/Troll Archer/.test(last.desc)&&last.wolves>0,JSON.stringify(last));
const sp=await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); d.S.wave=7; const lane=Object.keys(d.lanes())[0]; const out=[];
  for(const k of ['goblin','orc','ogre']){ const B=d.MOBS[k]; for(let i=0;i<4;i++){ const e=d.spawn(k,lane); out.push({k,spd:+(e.spd/B.spd).toFixed(3),dmg:e.dmg,base:B.dmg,cap:Math.round(B.dmg*1.2)}); d.kill(e); } } d.step(1/60,2); return out; });
check("build 294 (Matt: \"we dont need any mobs to speed up anywhere\" ... \"they can do more damage but very little\"): on map 3's LAST wave a mob walks at its own speed (within its 10% jitter) and hits at most about 20% harder",sp.every(x=>x.spd>=.9&&x.spd<=1.1&&x.dmg<=x.cap),JSON.stringify(sp));
let tp=null; for(let i=0;i<400;i++){ tp=await page.evaluate(()=>{ window.__dd.step(1/60,2); return window.__courtdecor.topiaries(); }); if(tp.placed>=12) break; await new Promise(r=>setTimeout(r,60)); }
const tq=await page.evaluate(()=>{ const D=window.__courtdecor, P=D.probe, T=D.topiaries(); const open=new Set(D.open().map(([x,z])=>x+','+z));
  return { n:T.cells.length, placed:T.placed, mirrored:T.cells.every(([x,z])=>T.cells.some(([a,b])=>a===43-x&&b===43-z)), onPath:T.cells.some(([x,z])=>open.has(x+','+z)), solid:T.cells.every(([x,z])=>P.solidAt(P.cw(x),P.cwz(z),0,true)), kinds:T.kinds }; });
check("build 299 (Matt's gnome witch topiary; build 300 his gnome fighter, build 302 his gnome ranger -- four of each, two rangers up on the raised terraces): twelve stand in the court, each with its turned twin, none on a lane, and the hero cannot walk through one",tq.n===12&&tq.placed===12&&tq.mirrored&&!tq.onPath&&tq.solid&&tq.kinds['topiary-witch.glb']===4&&tq.kinds['topiary-fighter.glb']===4&&tq.kinds['topiary-ranger.glb']===4,JSON.stringify(tq));
const p2=await ctx.newPage(); p2.on("pageerror",e=>errors.push(String(e)));
await p2.goto("http://127.0.0.1:8943/?silent&nogate&map=0",{timeout:120000}); await p2.waitForFunction(()=>window.__dd&&window.__dd.map(),null,{timeout:120000});
const h=await p2.evaluate(()=>{ const d=window.__dd; const gob=d.waveComp(1).q.filter(x=>x.kind==='goblin').length; return { id:d.map().id, g1:gob, duCap:d.worldInfo().duCap }; });
check("the first map is untouched (its first wave is still five goblins)",h.id!=="court"&&h.g1===5,JSON.stringify(h));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
