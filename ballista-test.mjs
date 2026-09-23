// the ballista tilts: it pitches up at a drake and hits it, still hits a goblin on the floor, and from the throne room's floor
// its bolt climbs to a mob on the lower landing
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const SP=process.env.SP; const server=await serve(8936);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const page=await browser.newPage({viewport:{width:1000,height:640}}); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
const ready=()=>page.waitForFunction(()=>window.__dd&&window.__dd.heroModel()&&window.__dd.mobModel("goblin")&&window.__dd.mobModel("drake"),null,{timeout:120000});
await page.goto("http://127.0.0.1:8936/?silent&nogate"); await ready();
const r1=await page.evaluate(()=>{ const d=window.__dd; window.__meta.reset(); d.resetGear(); d.start(); d.addMana(9000); d.setHero(8,10,0); d.step(1/60,3);
  const t=d.place("harpoon",16,14,Math.PI); const dr=d.spawn("drake","N"); dr.hp=dr.max=1e6; dr.x=t.x; dr.z=t.z-9; dr.spd=0; d.step(1/60,2); dr.x=t.x; dr.z=t.z-9;   // a drake hangs in the air nine squares north
  let pitchMax=0, bolt=null, hpBefore=dr.hp, hitAt=-1; for(let i=0;i<240;i++){ d.step(1/60,1); dr.x=t.x; dr.z=t.z-9; pitchMax=Math.max(pitchMax,t.pitch||0); const p=d.projs.find(p=>p.kind==="harpoon"); if(p&&!bolt) bolt={vy:+p.vy.toFixed(2),y0:+p.y.toFixed(2)}; if(dr.hp<hpBefore&&hitAt<0){ hitAt=i; break; } }
  const yoke=t.mdl.userData.pitch||t.mdl.userData.yoke; return {drakeY:+dr.y.toFixed(2),pitch:+pitchMax.toFixed(2),hinged:!!t.mdl.userData.pitch,yokeX:+yoke.rotation.x.toFixed(2),bolt,hitAt,hp:[hpBefore,dr.hp]}; });
check("the ballista pitches up at a drake (its bow assembly tilts on the pedestal's hinge, the bolt climbs) and the bolt hits it",r1.pitch>.12&&r1.yokeX<-.1&&r1.bolt&&r1.bolt.vy>2&&r1.hitAt>=0&&r1.hp[1]<r1.hp[0],JSON.stringify(r1));
const r2=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,80); const t=d.defs.find(x=>x.kind==="harpoon"); const g=d.spawn("goblin","N"); g.hp=g.max=1e6; g.spd=0; g.x=t.x; g.z=t.z-8; d.step(1/60,2); g.x=t.x; g.z=t.z-8;
  let hit=-1, pitchMin=1, pitchMax=-1; for(let i=0;i<240;i++){ d.step(1/60,1); g.x=t.x; g.z=t.z-8; pitchMin=Math.min(pitchMin,t.pitch||0); pitchMax=Math.max(pitchMax,t.pitch||0); if(g.hp<g.max){ hit=i; break; } } return {hit,pitchMin:+pitchMin.toFixed(2),pitchMax:+pitchMax.toFixed(2)}; });
check("a goblin on the floor is still hit, with the yoke near level",r2.hit>=0&&r2.pitchMax<.15&&r2.pitchMin>-.3,JSON.stringify(r2));
// the throne room: a ballista on the floor, a goblin standing on the lower landing two up
await page.evaluate(()=>{ try{ localStorage.setItem("ddMapsCleared","4"); }catch(e){} }); await page.goto("http://127.0.0.1:8936/?silent&nogate&map=1"); await ready();
const r3=await page.evaluate(()=>{ const d=window.__dd; window.__meta.reset(); d.resetGear(); d.start(); d.addMana(9000); d.setHero(-6,58,0); d.step(1/60,3);
  const t=d.place("harpoon",13,38,Math.PI); const g=d.spawn("goblin","S"); g.hp=g.max=1e6; g.spd=0; const gx=d.cw(13), gz=d.cwz(29); g.x=gx; g.z=gz; d.step(1/60,2); g.x=gx; g.z=gz;   // on the lower landing, straight north of the ballista
  let hit=-1, pitchMax=0, boltTop=0, floorAt=null; for(let i=0;i<300;i++){ d.step(1/60,1); g.x=gx; g.z=gz; pitchMax=Math.max(pitchMax,t.pitch||0); const p=d.projs.find(p=>p.kind==="harpoon"); if(p) boltTop=Math.max(boltTop,p.y); if(g.hp<g.max){ hit=i; break; } }
  return {ballistaBase:t.base,goblinY:+g.y.toFixed(2),pitch:+pitchMax.toFixed(2),boltTop:+boltTop.toFixed(2),hit,dist:+Math.hypot(g.x-t.x,g.z-t.z).toFixed(1)}; });
check("from the throne room floor the bolt climbs to a goblin on the landing two up and hits it",r3.ballistaBase===0&&r3.goblinY>=1.9&&r3.pitch>.05&&r3.boltTop>1.8&&r3.hit>=0,JSON.stringify(r3));
// screenshot: the ballista tilted up at a drake
await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); const t=d.defs.find(x=>x.kind==="harpoon"); const dr=d.spawn("drake","S"); dr.hp=dr.max=1e6; dr.spd=0; dr.x=t.x-1; dr.z=t.z-7; d.step(1/60,2); dr.x=t.x-1; dr.z=t.z-7; d.setHero(t.x+3.5,t.z+4,Math.PI*.85); d.setCam(Math.PI*.85,.12,6); for(let i=0;i<50;i++){ d.step(1/60,1); dr.x=t.x-1; dr.z=t.z-7; } document.getElementById("hud").style.display="none"; window.__freeze=true; });
await page.waitForTimeout(250); await page.screenshot({path:SP+"/parts/shots/ballista-drake.png"});
check("no page errors",errors.length===0,errors.join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
