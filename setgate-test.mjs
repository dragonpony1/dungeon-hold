// ===== WHICH SETS CAN DROP WHERE (97b-setgate.js, 87-mythicdrops.js, game.js waveRewardItem): map one = only the Forest set; the Throne Room waves 1-6 = Forest and the
// Arcane (Void) set; from wave 7 and every later room = all sets; and the Throne Room's wave 7 reward is a mythic set piece 80% of the time.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8880);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
async function open(map){ const ctx=await browser.newContext(); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","1"); }catch(e){} }); const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:8880/?silent&nogate&map="+map,{timeout:300000}); await p.waitForFunction(()=>window.__dd&&window.__setGate&&window.__mythicDrops&&window.__forest,null,{timeout:300000}); await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,20); }); return p; }
// ---- the rule itself (pure)
const rule=await (await open(0)).evaluate(()=>{ const g=window.__setGate; return { hall:[1,4,9].map(w=>g.stageFor(0,w)), throne:[1,3,6,7,8].map(w=>g.stageFor(1,w)), later:[2,3,4].map(m=>g.stageFor(m,1)), tut:g.stageFor(1,3,true) }; });
check("the stages: the hall is 0; the Throne Room is 1 for waves 1-6 and 2 from wave 7; every later room is 2; the tutorial is 0",rule.hall.every(x=>x===0)&&rule.throne.join()==="1,1,1,2,2"&&rule.later.every(x=>x===2)&&rule.tut===0,JSON.stringify(rule));
// ---- live in the hall (map one)
const H=await open(0);
const hall=await H.evaluate(()=>{ const g=window.__setGate, M=window.__mythicDrops, d=window.__dd; const names=g.names(); const open=names.filter(n=>g.allowed(n)); d.S.wave=5;
  const chance=n=>window.__dd&&Meta_chance(n); function Meta_chance(n){ return window.__gateChance?window.__gateChance(n):null; }
  M.set(1,0,0); let mythic=0; for(let i=0;i<200;i++){ const it=d.rollItem(1); if(!M.eligible(it)) continue; d.dropLoot(it,3,3,true); if(it.mythic) mythic++; } d.loot.slice().forEach(l=>d.scene.remove(l.mesh)); d.loot.length=0; M.set(.025,.05,.00015);
  return { open, forestChance:window.__forest.chance(5), voidChance:window.__void.chance(5), mythicIds:Object.keys(g.tail).filter(id=>g.mythic(id)), mythic }; });
check("the hall: only the Forest set is open (the Void and the other eight are shut), so no mythic set piece can drop at all",hall.open.length===1&&hall.open[0]==="of the Forest"&&hall.mythicIds.length===0&&hall.mythic===0,JSON.stringify({open:hall.open,mythic:hall.mythic}));
check("the hall: the Forest set still has its chance, the Void's is zero",hall.forestChance>0&&hall.voidChance===0,JSON.stringify({f:hall.forestChance,v:hall.voidChance}));
// ---- live in the Throne Room (map two)
const T=await open(1);
const th=await T.evaluate(()=>{ const g=window.__setGate, M=window.__mythicDrops, d=window.__dd; const out={};
  const run=(wave)=>{ d.S.wave=wave; const open=g.names().filter(n=>g.allowed(n)); M.set(1,0,0); const ids=new Set(); for(let i=0;i<300;i++){ const it=d.rollItem(1); if(M.eligible(it)){ d.dropLoot(it,3,3,true); if(it.mythic) ids.add(it.setId); } } d.loot.slice().forEach(l=>d.scene.remove(l.mesh)); d.loot.length=0; M.set(.025,.05,.00015); return { open, ids:[...ids].sort(), voidChance:window.__void.chance(6), chaosChance:window.Meta?null:null }; };
  out.w3=run(3); out.w7=run(7);
  const reward=(wave,n)=>{ d.S.wave=wave; let mythic=0; for(let i=0;i<n;i++){ const it=g.reward(); if(it&&g.isSet(it)) mythic++; } return mythic/n; };
  out.r6=reward(6,400); out.r7=reward(7,600); out.r8=reward(8,300); out.stage=[3,6,7].map(w=>{ d.S.wave=w; return g.stage(); }); return out; });
check("the Throne Room, waves 1-6: only the Forest and Arcane (Void) sets are open, and the mythic set pieces that drop are all Void",th.w3.open.slice().sort().join()==="of the Forest,of the Void"&&th.w3.ids.join()==="void",JSON.stringify(th.w3));
check("the Throne Room, wave 7: every set is open and mythic pieces come in several sets",th.w7.open.length===10&&th.w7.ids.length>=5,JSON.stringify(th.w7));
check("the Throne Room's wave 7 reward is a set piece 80% of the time (a bit over: a reward that is already a set piece by the ordinary roll counts too)",th.r7>=.76&&th.r7<.92,String(th.r7));
check("...and wave 6's and wave 8's rewards are not forced (only the ordinary set-piece chance, well under the 80%)",th.r6<.55&&th.r8<.55&&th.r7>Math.max(th.r6,th.r8)+.25,JSON.stringify({r6:th.r6,r7:th.r7,r8:th.r8}));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,2).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
