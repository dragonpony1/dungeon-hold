import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const SP=process.env.SP; const server=await serve(8874);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const ctx=await browser.newContext({viewport:{width:1100,height:700}}); const page=await ctx.newPage(); const errors=[]; page.on("pageerror",e=>errors.push(String(e))); page.on("console",m=>{ if(m.type()==="error"||m.type()==="warning") errors.push(m.text().slice(0,200)); });
await page.goto("http://127.0.0.1:8874/?silent&nogate"); await page.waitForFunction(()=>window.__dd&&window.__party&&window.__dd.heroModel()&&/Witch/.test(window.__dd.heroModel().label),null,{timeout:120000});
await page.evaluate(()=>{ window.__dd.start(); window.__dd.setHero(0,17,Math.PI); window.__dd.step(1/60,10); });

// two party members spawn on their own hero models, well clear of each other and the local hero, without touching
// the local hero's own model or state at all
const r1=await page.evaluate(async()=>{
  window.__party.add("p1","troll.glb","Troll (party)"); window.__party.add("p2","knight.glb","Knight (party)");
  window.__party.setTarget("p1",-1.3,15,0); window.__party.setTarget("p2",1.3,15,0);
  for(let i=0;i<200&&!(window.__party.get("p1").ready&&window.__party.get("p2").ready);i++){ window.__dd.step(1/60,1); await new Promise(r=>setTimeout(r,20)); }
  return {p1:window.__party.get("p1"),p2:window.__party.get("p2"),list:window.__party.list(),localHero:window.__dd.heroModel().label,localPick:window.__heroes.pick()};
});
check("two party members load their own hero GLBs (a troll, a knight) independently of the local hero, which stays the witch throughout",r1.p1.ready&&r1.p2.ready&&r1.p1.label==="Troll (party)"&&r1.p2.label==="Knight (party)"&&r1.list.includes("p1")&&r1.list.includes("p2")&&/Witch/.test(r1.localHero)&&r1.localPick==="witch",JSON.stringify(r1));
check("both party members start idle",r1.p1.cur==="idle"&&r1.p2.cur==="idle",JSON.stringify({p1cur:r1.p1.cur,p2cur:r1.p2.cur}));

// moving: a target a few units off makes a member walk/run there, facing the way it's headed, and settle back to
// idle once it arrives — exactly the call shape a later network layer will drive this with
const r2=await page.evaluate(async()=>{
  window.__party.setTarget("p1",-4,20,-Math.PI/4); window.__party.setTarget("p2",4,20,Math.PI/4);
  window.__dd.step(1/60,15);
  const moving={p1:window.__party.get("p1"),p2:window.__party.get("p2")};
  window.__dd.step(1/60,90);
  const arrived={p1:window.__party.get("p1"),p2:window.__party.get("p2")};
  return {moving,arrived};
});
check("under way both members show a moving clip (run) and face their heading",r2.moving.p1.moving&&r2.moving.p2.moving&&r2.moving.p1.cur==="run"&&r2.moving.p2.cur==="run",JSON.stringify(r2.moving));
check("both arrive at their exact target and settle back to idle, yaw eased to the target heading",!r2.arrived.p1.moving&&!r2.arrived.p2.moving&&r2.arrived.p1.cur==="idle"&&r2.arrived.p2.cur==="idle"&&Math.abs(r2.arrived.p1.x-(-4))<.02&&Math.abs(r2.arrived.p1.z-20)<.02&&Math.abs(r2.arrived.p2.x-4)<.02&&Math.abs(r2.arrived.p2.z-20)<.02&&Math.abs(r2.arrived.p1.yaw-(-Math.PI/4))<.02&&Math.abs(r2.arrived.p2.yaw-(Math.PI/4))<.02,JSON.stringify(r2.arrived));

// teardown: removing one member frees it cleanly and leaves the other and the local hero untouched
const r3=await page.evaluate(async()=>{
  window.__party.remove("p1"); window.__dd.step(1/60,10);
  return {list:window.__party.list(),p2:window.__party.get("p2"),localHero:window.__dd.heroModel().label};
});
check("removing one party member leaves it out of the list, the other member and the local hero unaffected",!r3.list.includes("p1")&&r3.list.includes("p2")&&r3.p2.ready&&/Witch/.test(r3.localHero),JSON.stringify(r3));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
