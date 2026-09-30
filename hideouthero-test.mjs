// ===== CHANGE HERO IN THE HIDEOUT (game build 329 + hideout build 75). Matt: "oh we need a way to change heros in the hideout". Checked: H inside the hideout opens the hero cards over the room
// (all four, the current one lit); clicking another switches hero (its own gear goes on) and hands the room back ('hideout:bagClosed'); a locked hero is refused; closing the hideout (as the
// horn does) takes the picker with it; the hideout's controls line lists H; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8981,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8981/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__hideout&&window.__hideouthero&&window.__heroes,null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} window.__heroes.select('knight'); d.start(); d.step(1/60,5); window.__hideout.open(); });
let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof openHeroPick==='function',null,{timeout:120000});
const help=await f.evaluate(()=>document.getElementById('start').textContent);
let got=[]; await f.evaluate(()=>{ window.__msgs=[]; addEventListener('message',e=>{ if(typeof e.data==='string') window.__msgs.push(e.data); }); openHeroPick(); });
await page.waitForFunction(()=>window.__hideouthero.isOpen(),null,{timeout:5000});
const a=await page.evaluate(()=>{ const cards=[...document.querySelectorAll('#hdHero .hc')]; return { n:cards.length, sel:(document.querySelector('#hdHero .hc.sel')||{}).dataset?.id, imgs:cards.every(c=>/hero-/.test(c.querySelector('img').src)), z:+getComputedStyle(document.getElementById('hdHero')).zIndex }; });
check("H in the hideout opens the hero cards over the room: all four with their portraits, the one you play (the Knight) lit; the hideout's controls line lists H",a.n===4&&a.sel==='knight'&&a.imgs&&a.z>=25&&/H: hero/.test(help),JSON.stringify({a,help:/H: hero/.test(help)}));
await page.click('#hdHero .hc[data-id="witch"]'); await sleep(300);
const b=await page.evaluate(()=>({ hero:window.__heroes.pick(), open:window.__hideouthero.isOpen() })); got=await f.evaluate(()=>window.__msgs.slice());
check("clicking the Witch switches to her and hands the room back (the picker closes, the hideout is told)",b.hero==='witch'&&!b.open&&got.includes('hideout:bagClosed'),JSON.stringify({b,got}));
const lctx=await browser.newContext({viewport:{width:1100,height:700}}); await lctx.addInitScript(()=>{ try{ localStorage.setItem('ddSound','off'); }catch(e){} }); const lp=await lctx.newPage(); lp.on('pageerror',e=>errors.push(String(e)));
await lp.goto('http://127.0.0.1:8981/?silent&nogate',{timeout:120000}); await lp.waitForFunction(()=>window.__dd&&window.__hideout&&window.__hideouthero&&window.__heroes,null,{timeout:120000});
const c=await lp.evaluate(()=>{ const HR=window.__heroes; try{ window.__trainer.skip(); }catch(e){} HR.select('knight'); window.__hideout.open(); const lockedWitch=HR.list().find(h=>h.id==='witch').locked; window.__hideouthero.open(); const cardLocked=!!document.querySelector('#hdHero .hc.locked[data-id="witch"]'); const ok=window.__hideouthero.pick('witch'); return { lockedWitch, cardLocked, ok, hero:HR.pick() }; }); await lctx.close();   /* a fresh save: only the Knight is open until the first hall is held */
check('a locked hero (a fresh save: the Witch) shows its lock and is refused -- you stay the Knight',c.lockedWitch&&c.cardLocked&&c.ok===false&&c.hero==='knight',JSON.stringify(c));
const d2=await page.evaluate(()=>{ window.__hideouthero.open(); const was=window.__hideouthero.isOpen(); window.__hideout.close(); return { was, after:window.__hideouthero.isOpen() }; });
check("closing the hideout (as the horn does) takes the picker with it",d2.was&&!d2.after,JSON.stringify(d2));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
