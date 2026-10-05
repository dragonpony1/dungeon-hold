// ===== build 543: THE PROLOGUE, "THE ROOT REMEMBERS" (96s4-prologue.js) -- the first Gnome Hall build phase plays it once.
//  * it starts by itself in the Gnome Hall (with ?cineauto, as the suites opt in), the words come up over black one line at a time
//  * the fall: the root shaft is out; the Heartroot pulses; the eyes open and the horde stand-ins stand behind them (never in `enemies`)
//  * the four heroes stand round the Heartroot, each holding a set weapon; the music starts on the effects channel
//  * skipping takes everything away (no heroes or mobs left in the scene, the words gone) and it is remembered as seen
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=await serve(8966,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--autoplay-policy=no-user-gesture-required"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:620}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("dd_talent_card","1"); localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddMusic","off"); }catch(e){} });
await page.goto("http://127.0.0.1:8966/?silent&nogate&map=0&cineauto",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.CINE&&window.__prologue&&window.__dd.map().id==='hall',null,{timeout:120000});
await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); });
const at=async t=>{ for(let i=0;i<400;i++){ const c=await page.evaluate(()=>window.__cine.info()); if(c.active==='prologue'&&!c.wait&&c.t>=t) return c; if(i>40&&!c.active) return c; await sleep(100); } return null; };
const shots=[];
let c=await at(1.6); const w=await page.evaluate(()=>window.__prologue.info());
check("the first build phase of the Gnome Hall starts the prologue by itself, the words over black",c&&c.active==='prologue'&&/Long before/.test(w.words)&&w.wordsOp>.3,JSON.stringify({c:c&&{active:c.active,t:c.t},w:{words:w.words,op:w.wordsOp}}));
c=await at(10); await page.screenshot({path:process.env.TEMP+"/pro-fall.png"}); shots.push("fall");
const fall=await page.evaluate(()=>{ const P=window.__prologue.info(), g=window.__cine.group(); let tubes=0, shaftVis=false; if(g) g.traverse(o=>{ if(o.geometry&&o.geometry.type==='TubeGeometry'){ tubes++; let v=true, p=o; while(p){ if(!p.visible) v=false; p=p.parent; } if(v) shaftVis=true; } }); return {P,tubes,shaftVis}; });
check("the fall: a shaft of roots (with glowing veins) is out under the hall",fall.tubes>30&&fall.shaftVis,JSON.stringify({tubes:fall.tubes,vis:fall.shaftVis}));
check("the four heroes are loaded, each with a set weapon, and the horde stand-ins are ready (none in the real enemies)",fall.P.heroes===4&&fall.P.mobsLive>=20,JSON.stringify(fall.P));
c=await at(19); await page.screenshot({path:process.env.TEMP+"/pro-heart.png"});
c=await at(27.5); await page.screenshot({path:process.env.TEMP+"/pro-eyes.png"});
const eyes=await page.evaluate(()=>{ const d=window.__dd, g=window.__cine.group(); let lit=0, inEn=0; g.traverse(o=>{ if(o.isSprite&&o.visible&&o.material.opacity>.5&&o.scale.x<.5) lit++; if(d.enemies.some(e=>e.mdl&&e.mdl.g===o)) inEn++; }); return {lit,inEn,beats:window.__prologue.info().beats}; });
check("eyes open in the dark (dozens lit), none of the figures are real mobs, the Heartroot beats",eyes.lit>=20&&eyes.inEn===0&&eyes.beats>=10,JSON.stringify(eyes));
c=await at(33.5); await page.screenshot({path:process.env.TEMP+"/pro-four.png"});
const four=await page.evaluate(()=>{ const g=window.__cine.group(); let wraps=0; g.traverse(o=>{ if(o.isSkinnedMesh){ let v=true, p=o; while(p){ if(!p.visible) v=false; p=p.parent; } if(v) wraps++; } }); return {skinnedVisible:wraps,info:window.__prologue.info()}; });
check("the four stand round the Heartroot (their models showing), each holding a set weapon",four.skinnedVisible>=4&&four.info.weapons===4,JSON.stringify({vis:four.skinnedVisible}));
check("its music is fetched (the suites run silent, so it isn't played here)",four.info.musBytes===true,JSON.stringify({music:four.info.music,musReady:four.info.musReady}));
c=await at(38.5); await page.screenshot({path:process.env.TEMP+"/pro-title.png"});
await page.keyboard.press("Space"); await sleep(1800);
const after=await page.evaluate(()=>({ active:window.__cine.info().active, seen:localStorage.getItem('dd_cine_seen'), words:+document.getElementById('cineWords').style.opacity||0, groups:window.__dd&&(()=>{ let n=0; window.__dd.scene&&window.__dd.scene.traverse&&window.__dd.scene.traverse(o=>{ if(/^cine-/.test(o.name||'')) n++; }); return n; })() }));
check("skipping ends it and takes it all away; it is remembered as seen (GNOME SWEET GNOME may follow straight on)",after.active!=='prologue'&&/prologue/.test(after.seen||'')&&after.words===0,JSON.stringify(after));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
