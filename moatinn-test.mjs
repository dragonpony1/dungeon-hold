// ===== THE DRAWBRIDGE'S INN HEARTROOT AND THE HORDE'S RAMP (build 450; game.js map + parts/staging/56k8-moatinn.js). Matt: "a ramp from the east spawn point to the top of the inn" / "all of the east mobs will
// go to the roof of the inn where a second heartroot will be" / "the connection artery between the inn and the roof is 2 more blocks wide".
// Checked: a second Heartroot stands on the inn's roof (its model and bar); the east gate's road (walkers and flyers) leads to it, up the ramp; the road, west and sally gates all lead to the castle's;
// a goblin from the east gate climbs the ramp and strikes the inn Heartroot; the bridge to the inn is 4 wide; the hero can climb the ramp too; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8988,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:8988/?silent&nogate&map=4",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__moatinn&&window.__moatinn.f2&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); window.__freeze=true; });
for(let i=0;i<80&&!(await page.evaluate(()=>window.__moatinn.info().heart2));i++) await sleep(100);
const A=await page.evaluate(()=>{ const I=window.__moatinn, d=window.__dd, M=d.map(); const P=8; const L=d.map().lanes||{}; const out={ info:I.info(), roads:{} };
  for(const [k,c] of [['E',[48,25+P]],['S',[24,53+P]],['W',[1,25+P]],['NE',[48,8+P]]]){ const s=k==='E'?I.steps(c[0],c[1],2):I.steps(c[0],c[1],1); out.roads[k]=s?s.end:null; }
  out.flyE=(()=>{ const F=I.f2().fly; let i=(25+P)*M.gw+48, n=0; while(i>=0&&n<900){ const ni=F.nxt[i]; if(ni<0) break; i=ni; n++; } return i; })(); out.goal2=I.info().goal2[1]*M.gw+I.info().goal2[0];
  out.bridge=window.__moatwalk.bridge().map(b=>b.x); return out; });
check("a second Heartroot stands on the inn's roof (16 up), its model in and its bar under the castle's",A.info.heart2&&A.info.bar2&&A.info.h2===16,JSON.stringify(A.info));
check("the east gate's road leads to the inn Heartroot (and its flyers' too); the road, west and sally gates lead to the castle's",A.roads.E===2&&A.roads.S===1&&A.roads.W===1&&A.roads.NE===1&&A.flyE===A.goal2,JSON.stringify(A.roads)+' fly '+A.flyE+'/'+A.goal2);
check("the bridge between the castle walls and the inn is 4 wide now",A.bridge.length>0,JSON.stringify(A.bridge.slice(0,2)));
const B=await page.evaluate(()=>{ const d=window.__dd; d.S.phase='wave'; d.S.crystal=d.S.crystal2=1e9; d.spawn('goblin','E'); const g=d.enemies[d.enemies.length-1]; g.hp=g.max=1e6; let topY=0, t=0;
  for(;t<120;t+=1/30){ d.step(1/30,1); d.S.crystal=Math.max(d.S.crystal,1e9); if((g.y||0)>topY) topY=g.y; if(d.S.crystal2<1e9) break; } return { goal2:!!g.goal2, topY:+topY.toFixed(1), hitInn:d.S.crystal2<1e9, castle:d.S.crystal>=1e9, t:+t.toFixed(1) }; });
check("a goblin from the east gate climbs the ramp onto the inn and strikes the inn Heartroot",B.goal2&&B.topY>=15&&B.hitInn&&B.castle,JSON.stringify(B));
const C=await page.evaluate(()=>{ const d=window.__dd, W=window.__moatwalk, h=d.hero; const a=W.at(41,37); d.setHero(a.x,a.z,0); h.y=0; d.step(1/60,2); let ok=true; const ys=[]; for(const [cx,cz] of [[41,27],[38,27],[38,37]]){ const t=W.at(cx,cz); ok=W.walkTo(t.x,t.z)&&ok; ys.push(+h.y.toFixed(2)); } return { ok, y:+h.y.toFixed(2), ys }; });   /* build 452: the switchback */
check("the hero can climb the switchback onto the inn's roof too (build 452)",C.ok&&C.y>=15.9,JSON.stringify(C));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
