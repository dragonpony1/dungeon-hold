// ===== build 545: GNOME SWEET GNOME (96s5-tavernscene.js) -- the prologue's second half, in the Gnome Hall's tavern, straight after THE ROOT REMEMBERS.
//  * it starts by itself once the prologue is seen (here: marked seen), and not before; the mug rings to the thuds
//  * the goblin peeks in, the four take up arms (each with a set weapon), the eyes fill the dark beyond the door
//  * "...Last call." comes up and the tune quickens; skipping takes it all away and it is remembered as seen
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=await serve(8968,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:620}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("dd_talent_card","1"); localStorage.setItem("ddMapsCleared","9"); }catch(e){} });
await page.goto("http://127.0.0.1:8968/?silent&nogate&map=1&cineauto",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.CINE&&window.__tavernscene&&window.__dd.map().id==='throne',null,{timeout:120000});
await page.evaluate(()=>{ localStorage.setItem("dd_cine_seen",'["prologue"]'); try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); });   // marked seen here, not in an init script (that runs again in every frame the page opens and would wipe the record)
const at=async t=>{ for(let i=0;i<450;i++){ const c=await page.evaluate(()=>window.__cine.info()); if(c.active==='tavern'&&!c.wait&&c.t>=t) return c; if(i>60&&!c.active) return c; await sleep(100); } return null; };
let c=await at(4); await page.screenshot({path:process.env.TEMP+"/tav-mug.png"});
const a=await page.evaluate(()=>window.__tavernscene.info());
check("once the prologue is seen, the first Throne Room build phase plays GNOME SWEET GNOME; the thuds ring the mug",c&&c.active==='tavern'&&a.thumps>=2,JSON.stringify({c:c&&{active:c.active,t:c.t},thumps:a.thumps}));
c=await at(8.6); await page.screenshot({path:process.env.TEMP+"/tav-peek.png"}); const b=await page.evaluate(()=>window.__tavernscene.info());
check("a goblin peeks in at the door",b.gob,JSON.stringify(b));
c=await at(14.2); await page.screenshot({path:process.env.TEMP+"/tav-arms.png"});
c=await at(23.6); await page.screenshot({path:process.env.TEMP+"/tav-door.png"}); const d=await page.evaluate(()=>window.__tavernscene.info());
check("the four are there with set weapons, and the eyes fill the dark beyond the door",d.heroesLive===4&&d.weapons===4&&d.eyeOp>.5&&d.eyes>=400,JSON.stringify(d));
c=await at(28.6); await page.screenshot({path:process.env.TEMP+"/tav-last.png"}); const e=await page.evaluate(()=>window.__tavernscene.info());
check("'...Last call.' comes up",/Last call/.test(e.words)&&e.wordsOp>.5,JSON.stringify({w:e.words,op:e.wordsOp}));
c=await at(33.2); await page.screenshot({path:process.env.TEMP+"/tav-title.png"});
await page.keyboard.press("Space"); await sleep(1800);
const after=await page.evaluate(()=>({ active:window.__cine.info().active, seen:localStorage.getItem('dd_cine_seen'), w:+(document.getElementById('cineWords2')||{style:{}}).style.opacity||0 }));
check("skipping ends it, takes it all away, and it is remembered as seen",!after.active&&/tavern/.test(after.seen||'')&&after.w===0,JSON.stringify(after));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
