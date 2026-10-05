// ===== build 555: THE CASTLE WAKES (96s8-castle.js) -- the Drawbridge's opening scene.
//  * it starts by itself on the map's first build phase; the map's own drawbridge is hidden and a copy stands raised
//  * the torches light along the battlements; the copy swings down flat; Avery's feather drifts onto the moat
//  * the four with set weapons; skipping ends it, the real drawbridge comes back, it is remembered as seen
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=await serve(8973,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:620}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("dd_talent_card","1"); localStorage.setItem("ddMapsCleared","9"); }catch(e){} });
await page.goto("http://127.0.0.1:8973/?silent&nogate&map=4&cineauto",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.CINE&&window.__castlescene&&window.__dd.map().id==='moat',null,{timeout:120000});
await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); });
const at=async t=>{ for(let i=0;i<600;i++){ const c=await page.evaluate(()=>window.__cine.info()); if(c.active==='castle'&&!c.wait&&c.t>=t) return c; if(i>120&&!c.active) return c; await sleep(100); } return null; };
let c=await at(3); await page.screenshot({path:process.env.TEMP+"/cas-moat.png"}); const a=await page.evaluate(()=>window.__castlescene.info());
check("the first Drawbridge build phase plays THE CASTLE WAKES: the real drawbridge hidden, the copy standing raised",c&&c.active==='castle'&&a.realBridgeHidden>=3&&Math.abs(a.deckAngle+1.57)<.05,JSON.stringify({c:c&&{active:c.active,t:c.t},a}));
c=await at(12.6); await page.screenshot({path:process.env.TEMP+"/cas-wake.png"}); const b=await page.evaluate(()=>window.__castlescene.info());
check("the torches flare along the battlements",b.lit>=8,JSON.stringify({lit:b.lit}));
c=await at(17); await page.screenshot({path:process.env.TEMP+"/cas-bridge.png"});
c=await at(20.6); const d=await page.evaluate(()=>window.__castlescene.info());
check("the drawbridge swings down flat (its chains follow it)",Math.abs(d.deckAngle)<.05,JSON.stringify({deck:d.deckAngle,clanks:d.clanks}));
c=await at(23.5); await page.screenshot({path:process.env.TEMP+"/cas-feather.png"});
c=await at(25.6); const e=await page.evaluate(()=>window.__castlescene.info());
check("Avery's feather comes down onto the moat",e.featherY!==null&&e.featherY<0,JSON.stringify({featherY:e.featherY}));
c=await at(29.5); await page.screenshot({path:process.env.TEMP+"/cas-four.png"}); const f=await page.evaluate(()=>window.__castlescene.info());
check("the four stand at the bridge's foot with their set weapons",f.heroesLive===4&&f.weapons===4,JSON.stringify(f));
await page.keyboard.press("Space"); await sleep(1800);
const after=await page.evaluate(()=>{ let vis=0; for(const o of window.__dd.scene.children) o.traverse(x=>{}); return { active:window.__cine.info().active, seen:localStorage.getItem('dd_cine_seen'), hidden:window.__castlescene.info().realBridgeHidden }; });
check("skipping ends it, the real drawbridge is back, and it is remembered as seen",!after.active&&/castle/.test(after.seen||'')&&after.hidden===0,JSON.stringify(after));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
