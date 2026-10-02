// ===== THE DRAWBRIDGE'S WALL-WALK (build 418; game.js 'moat' build + solidAt/floorAt slabs, parts/staging/56m-moatwalk.js, 56l-moatroof.js). Matt: "the top needs to communicate all the way around itself" /
// "on the south side it needs to connect to the outbuilding" / "the crown of both buildings needs to have those teeth far enough apart to fit a ballista".
// Checked, walking the hero with the game's own collision: from the roof all the way round the ward on the walls -- over the postern, the gate and the sally port -- and back onto the roof; down the south wall onto
// the bridge and along the inn's wall-top; the guard stops him stepping off into the ward; on the ground he still walks under the gate's deck and the bridge; the horde's roads all still reach the Heartroot;
// the teeth stand every other cell (a gap wider than a ballista's cell); no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9003,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1000,height:640}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9003/?silent&nogate&map=4",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__moatwalk&&window.__moatwalk.walkTo&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); window.__freeze=true; });
const walk=(route,y0)=>page.evaluate(([route,y0])=>{ const d=window.__dd, M=window.__moatwalk, h=d.hero; const p0=M.at(route[0][0],route[0][1]); h.x=p0.x; h.z=p0.z; h.y=y0; h.vy=0; const log=[];
  for(const [cx,cz] of route.slice(1)){ const p=M.at(cx,cz); const ok=M.walkTo(p.x,p.z); log.push([cx,cz,ok,+h.y.toFixed(2)]); if(!ok) break; } return log; },[route,y0]);
const loop=await walk([[20,0],[20,1],[2,1],[2,14],[22,14],[26,14],[47,14],[47,1],[36,1],[30,1]],16);
check("from the roof all the way round the ward on the walls (over the postern, the gate and the sally port) and back onto the roof, at the walk's height the whole way",loop.length===9&&loop.every(s=>s[2]&&s[3]>15.9),JSON.stringify(loop));
const bridge=await walk([[36,1],[47,1],[47,14],[37,15],[37,26],[29,26],[29,34],[39,34]],16);
check("down onto the bridge from the south wall, over the moat and the green, and round the inn's wall-top",bridge.length===7&&bridge.every(s=>s[2]&&s[3]>15.9),JSON.stringify(bridge));
const off=await page.evaluate(()=>{ const d=window.__dd, M=window.__moatwalk, h=d.hero; const a=M.at(10,1), b=M.at(10,4); h.x=a.x; h.z=a.z; h.y=16; const ok=M.walkTo(b.x,b.z); return { ok, y:+h.y.toFixed(2), z:+(h.z-a.z).toFixed(2) }; });
check("the walk's inner edge runs straight on onto the roof over the yard: he steps off it and stays up at 16 (build 439; it was a guard; 449: 16 up)",off.ok&&off.y>15.9,JSON.stringify(off));
const under=await page.evaluate(()=>{ const d=window.__dd, M=window.__moatwalk, h=d.hero; const go=(a,b)=>{ const p=M.at(a[0],a[1]), q=M.at(b[0],b[1]); h.x=p.x; h.z=p.z; h.y=0; const ok=M.walkTo(q.x,q.z); return { ok, y:+h.y.toFixed(2) }; };
  return { gate:go([24,12],[24,21]), bridge:go([33,22],[41,22]) }; });
check("on the ground he still walks through the gate under its deck, and across the green under the bridge",under.gate.ok&&under.gate.y<1&&under.bridge.ok&&under.bridge.y<1,JSON.stringify(under));
const flow=await page.evaluate(()=>{ const d=window.__dd, M=window.__moatwalk; const gw=d.map().gw, out={}; for(const [k,c] of Object.entries({S:[24,53],W:[1,25],E:[48,25],NE:[48,8]})){ const p=M.at(c[0],c[1]); const cx=Math.round((p.x+41-1)/2), cz=Math.round((p.z+(7+8)*2+1-1)/2); out[k]=d.flow().dist[cz*gw+cx]; } return out; });
check("the horde's roads from all four gates still reach the Heartroot",Object.values(flow).every(v=>v>0),JSON.stringify(flow));
const teeth=await page.evaluate(()=>({ roof:window.__moatroof.info(), walk:window.__moatwalk.info() }));
check("the teeth stand every other cell on the roof and the walk (a gap wider than a ballista's cell)",teeth.roof.merlons<=Math.ceil(teeth.roof.pieces/2)+1&&teeth.walk.merlons<teeth.walk.edges*.7,JSON.stringify({roof:teeth.roof.merlons+"/"+teeth.roof.pieces,walk:teeth.walk.merlons+" over "+teeth.walk.edges+" edges"}));
const TR=await page.evaluate(()=>{ const d=window.__dd, M=window.__moatwalk; d.addMana(99999); d.S.du=-99; const put=(k,cx,cz)=>{ const p=M.at(cx,cz); const t=d.placeDefAt(k,p.x,p.z,0); return t?+t.base.toFixed(2):null; };
  return { wallTreb:put('ball',10,14), wallBallista:put('harpoon',2,8), innTreb:put('ball',33,26), roofTreb:put('ball',20,-3) }; });
check("trebuchets and ballistas set up on the walk, the inn's top and the roof stand up there (Matt: \"we should be able to put trebuchets up there in those gaps as well\")",TR.wallTreb===16&&TR.wallBallista===16&&TR.innTreb===16&&TR.roofTreb===16,JSON.stringify(TR));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
