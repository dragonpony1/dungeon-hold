// the throne room as a switchback climb: paths, gates per wave, goblins climb all three flights, the hero climbs, rails and windows, screenshots
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const SP=process.env.SP; const server=await serve(8911);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const ctx=await browser.newContext({viewport:{width:1100,height:700}}); const page=await ctx.newPage(); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
const ready=()=>page.waitForFunction(()=>window.__dd&&window.__dd.map&&window.__campaign&&window.__dd.heroModel()&&window.__dd.mobModel("goblin")&&window.__room,null,{timeout:120000});
await page.goto("http://127.0.0.1:8911/?silent&nogate"); await ready(); await page.evaluate(()=>window.__campaign.unlockAll());
await page.goto("http://127.0.0.1:8911/?silent&nogate&map=1"); await ready();
const r=await page.evaluate(()=>{ const d=window.__dd; window.__meta.reset(); d.resetGear(); d.start(); d.step(1/60,5); const L=d.lanes(); const m=d.map();
  const paths=Object.fromEntries(Object.keys(L).map(k=>[k,d.pathLen(L[k].cx,L[k].cz)])); const flyPaths=Object.fromEntries(Object.keys(L).map(k=>[k,d.pathLenFly(L[k].cx,L[k].cz)]));
  const reach={}; for(const k of Object.keys(L)){ const e=d.spawn("goblin",k); e.spd=9; let ok=false, maxY=0, ys=[]; for(let i=0;i<60*60;i++){ d.step(1/60,1); maxY=Math.max(maxY,e.y); if(i%30===0) ys.push(+e.y.toFixed(1)); if(Math.hypot(e.x,e.z)<3.6){ ok=true; break; } if(e.dead) break; } reach[k]={ok,maxY:+maxY.toFixed(2),t:+(ys.length/2).toFixed(1),ys:ys.filter((y,i)=>i%4===0).join(" ")}; d.kill(e); }
  // gates by wave
  const gates={}; for(let w=1;w<=7;w++){ d.S.phase="build"; d.S.wave=w-1; d.startWave(); gates[w]=document.getElementById("banner").textContent.replace(/.*—/,"").trim(); d.S.phase="build"; for(const e of d.enemies) d.kill(e); }
  // heights
  const H={top:d.hgtAt(13,6),landingC:d.hgtAt(13,15),galleryW:d.hgtAt(7,12),landingB:d.hgtAt(13,22),landingA:d.hgtAt(13,29),floor:d.hgtAt(13,40),pit:d.hgtAt(13,32),gateW:d.hgtAt(1,22),gateEA:d.hgtAt(25,29),gateEC:d.hgtAt(25,15),flight1W:+d.floorH(d.cw(5),d.cwz(32)).toFixed(2),flight1E:+d.floorH(d.cw(20),d.cwz(32)).toFixed(2),flight2:+d.floorH(d.cw(13),d.cwz(25)).toFixed(2),flight3W:+d.floorH(d.cw(5),d.cwz(18)).toFixed(2),flight3E:+d.floorH(d.cw(20),d.cwz(18)).toFixed(2),flight4:+d.floorH(d.cw(13),d.cwz(11)).toFixed(2)};
  d.setHero(0,6,Math.PI); d.step(1/60,5); const heroY=+d.hero.y.toFixed(2);
  return {gw:m.gw,gh:m.gh,wallH:m.wallH,windows:m.windows,rails:window.__dd.rails?window.__dd.rails():null,lanes:Object.keys(L),from:Object.fromEntries(Object.keys(L).map(k=>[k,L[k].from])),paths,flyPaths,reach,gates,H,heroY,stations:window.__room.stations().length,line:window.__campaign.line(),wbase:m.wbase}; });
console.log(JSON.stringify(r));
check("27×54 marble stair hall, four gates: south from wave 1 (path ≥ 55), east lower landing from 3, west landing from 5, east upper landing from 6, each climb shorter than the last",r.gw===27&&r.gh===54&&r.lanes.join()==="S,EA,W,EC"&&r.paths.S>=55&&r.paths.EA>=38&&r.paths.EA<r.paths.S&&r.paths.W>=24&&r.paths.W<r.paths.EA&&r.paths.EC>=18&&r.paths.EC<r.paths.W&&r.from.S===1&&r.from.EA===3&&r.from.W===5&&r.from.EC===6,JSON.stringify(r.paths));
check("five levels: floor 0, landings 2, 4 and 6, throne 8; twin flights up each wall to the lower and upper landings, one up the middle to the middle landing and the throne; feeders on their landings",r.H.floor===0&&r.H.pit===0&&r.H.landingA===2&&r.H.landingB===4&&r.H.landingC===6&&r.H.galleryW===6&&r.H.top===8&&r.H.gateEA===2&&r.H.gateW===4&&r.H.gateEC===6&&r.H.flight1W>0&&r.H.flight1W<2&&r.H.flight1E>0&&r.H.flight1E<2&&r.H.flight2>2&&r.H.flight2<4&&r.H.flight3W>4&&r.H.flight3W<6&&r.H.flight3E>4&&r.H.flight3E<6&&r.H.flight4>6&&r.H.flight4<8,JSON.stringify(r.H));
check("goblins from every gate climb to the crystal (y reaches 8)",Object.values(r.reach).every(x=>x.ok&&x.maxY>=7.9),JSON.stringify(r.reach));
check("gates open as the waves go: 1–2 south only, 3–4 + east lower landing, 5 + west landing, 6–7 all four",/^South gate$/.test(r.gates[1])&&/^South gate$/.test(r.gates[2])&&/^South \+ East lower landing gates$/.test(r.gates[3])&&/^South \+ East lower landing gates$/.test(r.gates[4])&&/^South \+ East lower landing \+ West landing gates$/.test(r.gates[5])&&/East upper landing/.test(r.gates[6])&&/South \+ East lower landing \+ West landing \+ East upper landing gates/.test(r.gates[7]),JSON.stringify(r.gates));
check("hero spawns on the throne platform eight up; windows and rails built; tavern re-homed with 5 stations; wbase 7",r.heroY>=7.9&&r.windows>=6&&r.stations===5&&r.wbase===7&&/MAP 2 OF 4/.test(r.line),JSON.stringify({heroY:r.heroY,windows:r.windows,stations:r.stations}));
// the hero walks up flight 1 from the floor, and cannot climb the landing's face
const r2=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.setHero(d.cw(20),d.cwz(36),Math.PI); d.hero.y=0; d.step(1/60,5); const y0=d.hero.y; d.setKeys({w:1}); for(let i=0;i<150;i++) d.step(1/60,1); d.setKeys({w:0}); const climbed=d.hero.y, zc=d.hero.z;
  d.setHero(d.cw(13),d.cwz(33),Math.PI); d.hero.y=0; d.step(1/60,5); d.setKeys({w:1}); for(let i=0;i<120;i++) d.step(1/60,1); d.setKeys({w:0}); return {y0:+y0.toFixed(2),climbed:+climbed.toFixed(2),zc:+zc.toFixed(1),faceY:+d.hero.y.toFixed(2),faceZ:+d.hero.z.toFixed(1),landingZ:+d.cwz(30).toFixed(1)}; });
check("the hero walks up the east first flight to the lower landing (y 2); under the landing's face a straight climb is stopped",r2.y0<.3&&r2.climbed>=1.9&&r2.faceY<.3&&r2.faceZ>r2.landingZ+.8,JSON.stringify(r2));
// a defense goes on every level, not on a flight
const r3=await page.evaluate(()=>{ const d=window.__dd; d.S.mana=9000; const put=(k,cx,cz)=>{ d.setHero(d.cw(cx),d.cwz(cz)+2,0); const t=d.place(k,cx,cz,0); return t?+t.base.toFixed(1):null; }; return {floor:put("harpoon",10,40),landingA:put("acorn",8,29),landingB:put("ball",10,22),landingC:put("totem",8,15),top:put("spike",18,7),flight:put("harpoon",20,32),flight2:put("acorn",13,25)}; });
check("defenses stand on the floor, all three landings and the top; none on a flight",r3.floor===0&&r3.landingA===2&&r3.landingB===4&&r3.landingC===6&&r3.top===8&&r3.flight===null&&r3.flight2===null,JSON.stringify(r3));
// screenshots
const shot=async(name,hx,hz,yaw,pitch,dist,y)=>{ await page.evaluate(([hx,hz,yaw,pitch,dist,y])=>{ const d=window.__dd; d.setHero(hx,hz,yaw); if(y!==undefined) d.hero.y=y; d.setCam(yaw,pitch,dist); d.step(1/60,40); document.getElementById("hud").style.display="none"; window.__freeze=true; },[hx,hz,yaw,pitch,dist,y]); await page.waitForTimeout(250); await page.screenshot({path:SP+"/parts/shots/"+name+".png"}); await page.evaluate(()=>{ window.__freeze=false; }); };
await page.evaluate(()=>{ const d=window.__dd; for(const x of d.defs.slice()){ d.setHero(x.x,x.z+1,0); d.sell(); } const es=[]; for(let i=0;i<12;i++) es.push(d.spawn("goblin",["S","EA","W","EC"][i%4])); d.step(1/60,2); es.forEach((e,i)=>{ e.spd=0; }); const at=[[20,33],[5,32],[14,29],[10,29],[13,26],[12,25],[8,22],[6,19],[20,18],[9,15],[13,12],[15,40]]; es.forEach((e,i)=>{ e.x=d.cw(at[i][0]); e.z=d.cwz(at[i][1]); }); d.step(1/60,20); });
await shot("throne-from-floor",0,74,Math.PI,.22,9);
await shot("throne-flight1",-6,60,Math.PI*.8,.25,9);
await shot("throne-landingA",-6,47,-Math.PI*.75,.28,9,2);
await shot("throne-landingB",4,33,Math.PI*.9,.3,9,4);
await shot("throne-landingC",-4,20,Math.PI*.85,.3,9,6);
await shot("throne-top",0,3,Math.PI,.25,7,8);
await shot("throne-lookdown",0,4,0,.62,11,8);
await shot("throne-wide",4,80,Math.PI*1.1,.32,11);
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
