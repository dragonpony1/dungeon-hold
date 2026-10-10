// ===== THE SPECIAL RINGS WAIT (build 613). Matt: "lets not let our special ring drop so early in the hall at least wave 3 of map 2 before they have a chance to drop".
// Checked: on the Gnome Hall's waves (and map 2's first two) neither the pet rings nor the hero rings ever roll, however many waves are held; from map 2 wave 3 (the campaign's 10th) they can.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8904,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:700}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("dd_trainer","done"); }catch(e){} });
await page.goto("http://127.0.0.1:8904/?silent&nogate&map=0",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__tworings&&window.__ringsOpen,null,{timeout:120000});
const A=await page.evaluate(()=>{ const d=window.__dd, M=d.Meta; d.start(); d.step(1/60,5); const drops=()=>window.__tworings.info().drops; const r=Math.random;
  const out={}; for(const w of [1,5,7,9,10]){ d.S.wave=w; const d0=drops(), bag0=M.bag().length; const real=Math.random; Math.random=()=>0.001; for(let i=0;i<40;i++) M.onWaveHeld(); Math.random=real;
    out[w]={ open:window.__ringsOpen(), pet:drops()-d0, bag:M.bag().length-bag0 }; } return out; });
check("Gnome Hall waves 1, 5 and 7, and the campaign's 9th (map 2 wave 2): the special rings never roll",[1,5,7,9].every(w=>!A[w].open&&A[w].pet===0),JSON.stringify(A));
check("from the 10th (map 2 wave 3) they can",A[10].open,JSON.stringify(A[10]));
const H=await page.evaluate(()=>{ const d=window.__dd, M=d.Meta, RR=['twotimer','toil_n_trouble','tootsie','bifurcation']; const out={};
  for(const w of [10,21,22]){ d.S.wave=w; const n0=d.loot.filter(l=>l.it&&RR.includes(l.it.named)).length; const real=Math.random; Math.random=()=>0.001; for(let i=0;i<40;i++) M.onWaveHeld(); Math.random=real; out[w]=d.loot.filter(l=>l.it&&RR.includes(l.it.named)).length-n0; } return out; });
check("build 618 (Matt: \"feast hall is good\"): the hero (dual-wield) rings wait for the Feast Hall -- none at map 2 wave 3 or the Cloister's last wave (21), they can from the Feast Hall's first (22)",H[10]===0&&H[21]===0&&H[22]>0,JSON.stringify(H));
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
