// ===== GNOME SWEET GNOME (96s5-tavernscene.js). Build 550: it plays the recorded Gnome Hall footage (assets/cine-tavern.mp4) the first time the THRONE ROOM's build phase begins.
//  * it starts by itself on the Throne Room's first build phase; the video shows and runs with the scene's clock; the thuds play
//  * skipping takes it away (video hidden) and it is remembered as seen
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=await serve(8968,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--autoplay-policy=no-user-gesture-required"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:720}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("dd_talent_card","1"); localStorage.setItem("ddMapsCleared","9"); }catch(e){} });
await page.goto("http://127.0.0.1:8968/?silent&nogate&map=1&cineauto",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.CINE&&window.__tavernscene&&window.__dd.map().id==='throne',null,{timeout:120000});
await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); });
const at=async t=>{ for(let i=0;i<450;i++){ const c=await page.evaluate(()=>window.__cine.info()); if(c.active==='tavern'&&!c.wait&&c.t>=t) return c; if(i>80&&!c.active) return c; await sleep(100); } return null; };
let c=await at(8); await page.screenshot({path:process.env.TEMP+"/tavv-8.png"}); const a=await page.evaluate(()=>window.__tavernscene.info());
check("the first Throne Room build phase plays GNOME SWEET GNOME: the recorded footage shows and runs with the scene",c&&c.active==='tavern'&&a.video&&a.video.shown&&a.video.w===1280&&Math.abs(a.video.t-c.t)<1.2,JSON.stringify({c:c&&{active:c.active,t:c.t},v:a.video}));
check("the horde's thuds play over it",a.thumps>=4,JSON.stringify({thumps:a.thumps}));
c=await at(28.5); await page.screenshot({path:process.env.TEMP+"/tavv-28.png"});
await page.keyboard.press("Space"); await sleep(1800);
const after=await page.evaluate(()=>({ active:window.__cine.info().active, seen:localStorage.getItem('dd_cine_seen'), shown:window.__tavernscene.info().video.shown }));
check("skipping ends it, the video goes away, and it is remembered as seen",!after.active&&/tavern/.test(after.seen||'')&&!after.shown,JSON.stringify(after));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
