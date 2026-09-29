// ===== THE FORGE'S SET PICKER AND THE SLUDGE WIPE (hideout build 52). Matt: "make picking cost 3 extra" and "take away all my sludge so i can feel the economy". The forge has a row of set buttons: "Any set" (5 sludge a try, a random
// set) and the nine forge sets (8 a try, that set); the odds are the same. ?zerosludge=1 on the game's address zeroes all four sludges once when the hideout opens, then the word is taken out of the address.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8893);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
async function openHideout(page){ await page.evaluate(()=>{ window.__dd.setHero(30,30); window.__hideout.open(); }); let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
  await f.waitForFunction(()=>typeof openForge==="function"&&typeof SAVE!=="undefined"&&document.getElementById("forgeSets"),null,{timeout:120000}); return f; }
// ---- the picker
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","1"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8893/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__hideout,null,{timeout:90000});
const f=await openHideout(page);
const r1=await f.evaluate(()=>{ SAVE.legendarySludge=40; openForge(); forgeSelected="weapon"; buildForgeGrid(); const chips=[...document.querySelectorAll("#forgeSets .fset")].map(b=>b.textContent); return { chips, label:document.querySelector("#forgeSets .fsetlabel").textContent, btn:document.getElementById("forgeCraftBtn").textContent, disabled:document.getElementById("forgeCraftBtn").disabled, odds:document.getElementById("forgeOutput").textContent }; });
check("the forge has a set row: a label, 'Any set' and the nine forge sets (Forest is not one); a random set costs 5",r1.chips.length===10&&r1.chips[0]==="Any set"&&r1.chips.includes("of Shadow")&&!r1.chips.includes("of the Forest")&&/\+3/.test(r1.label)&&r1.btn==="Craft · 5 sludge"&&!r1.disabled&&/random set/.test(r1.odds),JSON.stringify(r1));
const r2=await f.evaluate(()=>{ [...document.querySelectorAll("#forgeSets .fset")].find(b=>b.textContent==="of Shadow").click(); const a={ set:forgeSet, btn:document.getElementById("forgeCraftBtn").textContent, odds:document.getElementById("forgeOutput").textContent, sel:[...document.querySelectorAll("#forgeSets .fset.sel")].map(b=>b.textContent) };
  SAVE.legendarySludge=7; renderForgePanel(); a.dis7=document.getElementById("forgeCraftBtn").disabled; SAVE.legendarySludge=8; renderForgePanel(); a.dis8=document.getElementById("forgeCraftBtn").disabled; return a; });
check("picking a set costs 3 more (Craft · 8 sludge), the odds text names it, and the button is off at 7 sludge and on at 8",r2.set==="shadow"&&r2.btn==="Craft · 8 sludge"&&/of Shadow/.test(r2.odds)&&r2.sel.join()==="of Shadow"&&r2.dis7===true&&r2.dis8===false,JSON.stringify(r2));
const r3=await f.evaluate(()=>{ SAVE.legendarySludge=40; renderForgePanel(); const real=Math.random; Math.random=()=>0.2; const before=SAVE.legendarySludge, out=[]; try{ for(let i=0;i<3;i++){ document.getElementById("forgeCraftBtn").click(); out.push(SAVE.legendarySludge); } } finally { Math.random=real; }
  const recs=slotArrays().flat().filter(v=>isGearItem(v)&&v.kind==="forged").map(v=>v.rec).concat(SAVE.gear); return { before, out, sets:recs.map(r=>r.set+"/"+r.tier) }; });
check("three crafts with a set picked spend 8 each and every piece comes out of that set",r3.out.join()==="32,24,16"&&r3.sets.length>=3&&r3.sets.slice(-3).every(s=>s==="shadow/mythic"),JSON.stringify(r3));
const r4=await f.evaluate(()=>{ [...document.querySelectorAll("#forgeSets .fset")].find(b=>b.textContent==="of Shadow").click(); const a={ back:forgeSet, btn:document.getElementById("forgeCraftBtn").textContent };
  SAVE.legendarySludge=40; renderForgePanel(); const real=Math.random; Math.random=()=>0.2; try{ document.getElementById("forgeCraftBtn").click(); } finally { Math.random=real; } a.left=SAVE.legendarySludge; return a; });
check("pressing the same set again puts it back to a random set, and a random craft costs 5",r4.back===null&&r4.btn==="Craft · 5 sludge"&&r4.left===35,JSON.stringify(r4));
await ctx.close();
// ---- the wipe
const ctx2=await browser.newContext({viewport:{width:1280,height:800}}); await ctx2.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","1"); if(!sessionStorage.getItem("seeded")){ sessionStorage.setItem("seeded","1"); localStorage.setItem("dd_hideout_save_v2",JSON.stringify({sludge:500,legendarySludge:20,commonSludge:3,uncommonSludge:4})); } }catch(e){} });
const p2=await ctx2.newPage(); p2.on("pageerror",e=>errors.push(String(e)));
await p2.goto("http://127.0.0.1:8893/?silent&nogate&zerosludge=1",{timeout:90000}); await p2.waitForFunction(()=>window.__dd&&window.__hideout,null,{timeout:90000});
const f2=await openHideout(p2);
const w1=await f2.evaluate(()=>({ s:[SAVE.sludge,SAVE.legendarySludge,SAVE.commonSludge,SAVE.uncommonSludge], stored:(()=>{ const o=JSON.parse(localStorage.getItem("dd_hideout_save_v2")); return [o.sludge,o.legendarySludge,o.commonSludge,o.uncommonSludge]; })() }));
const url1=await p2.evaluate(()=>location.search);
check("?zerosludge=1 on the game's address zeroes all four sludges when the hideout opens, in the save too",w1.s.join()==="0,0,0,0"&&w1.stored.join()==="0,0,0,0",JSON.stringify(w1));
check("and the word is taken out of the address at once (a later portal trip cannot wipe again)",!/zerosludge/.test(url1),url1);
await f2.evaluate(()=>{ SAVE.sludge=9; SAVE.legendarySludge=6; writeSave(); }); await p2.evaluate(()=>window.__hideout.close()); await sleep(400);
const f3=await openHideout(p2); const w2=await f3.evaluate(()=>[SAVE.sludge,SAVE.legendarySludge]);
check("a second trip through the portal keeps what was earned since",w2.join()==="9,6",w2.join());
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
