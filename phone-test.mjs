// ===== THE PHONE (build 595; parts/head.html's first script + parts/staging/99v-phone.js). Matt: "Can you make an iPhone version of this while I'm at work today?"
// In WebKit (Safari's engine) as an iPhone 14 Pro held sideways -- laid out as a real iPhone does with the page's viewport tag (~600 tall, scaled to fit; WebKit on Windows ignores the tag,
// so the test lays out at that size itself). Checked: the page knows it is a phone and asks for the ~600-tall layout; ENTER THE HALL shows on the title without scrolling; in the hall the
// touch buttons are thumb-sized, a 3 x 3 block clear of the mini-map, SWING in the bottom-right corner, SELL there (CANCEL only while placing); the 3D view draws at one pixel per page pixel;
// the hideout door shows a card instead of opening (no touch in the hideout yet); held upright a TURN YOUR PHONE card covers it; no page errors.
import { webkit, devices } from "playwright"; import { serve } from "./serve.mjs";
const DIST=process.env.DIST||"./dist"; const server=await serve(8877,{dist:DIST});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await webkit.launch(); const errors=[];
const base=devices['iPhone 14 Pro landscape'], W=Math.round(600*852/393);
const init=c=>c.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_bag_guide","1"); localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} });
const ctx=await browser.newContext({...base, viewport:{width:W,height:Math.round(W*343/734)}, deviceScaleFactor:734*3/W}); await init(ctx);
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e).slice(0,200)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8877/?silent",{timeout:180000}); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel&&window.__dd.heroModel()&&window.__phone,null,{timeout:180000});
const T=await page.evaluate(()=>{ const b=document.getElementById('playbtn').getBoundingClientRect(); const m=document.querySelector('meta[name=viewport]'); return { phone:!!window.__PHONE, cls:document.body.classList.contains('phone'), meta:m?m.content:null, play:{ top:Math.round(b.top), bottom:Math.round(b.bottom) }, H:innerHeight, manifest:!!document.querySelector('link[rel=manifest]'), icon:!!document.querySelector('link[rel=apple-touch-icon]') }; });
check("it knows it is a phone and lays out ~600 tall, scaled to fit (viewport tag); Add to Home Screen has its icon and manifest",T.phone&&T.cls&&/width=1\d\d\d/.test(T.meta||'')&&/user-scalable=no/.test(T.meta)&&T.manifest&&T.icon,JSON.stringify(T));
check("the title: ENTER THE HALL shows without scrolling",T.play.bottom<=T.H&&T.play.top>0,JSON.stringify(T.play));
const A=await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); for(let i=0;i<40;i++){ d.step(1/30,1); await new Promise(r=>setTimeout(r,10)); }
  const vis=[...document.querySelectorAll('#btns .hb')].filter(b=>b.offsetParent&&getComputedStyle(b).display!=='none'); const R=b=>b.getBoundingClientRect();
  const mm=document.getElementById('mmWave')||document.getElementById('minimap'), mmB=mm?R(mm).bottom:0; const top=Math.min(...vis.map(b=>R(b).top));
  const sw=vis.find(b=>b.textContent==='⚔'), maxR=Math.max(...vis.map(b=>R(b).right)), maxB=Math.max(...vis.map(b=>R(b).bottom));
  return { n:vis.length, faces:vis.map(b=>b.textContent).join(''), size:Math.round(R(vis[0]).width), top:Math.round(top), mmB:Math.round(mmB), swR:Math.round(R(sw).right), swB:Math.round(R(sw).bottom), maxR:Math.round(maxR), maxB:Math.round(maxB), sell:!!vis.find(b=>b.id==='sellBtn'), cancel:!!vis.find(b=>b.id==='cancelBtn'), pr:window.__phone.info().pr }; });
check("the touch buttons: 9 thumb-sized (75+ page px), a block clear of the mini-map, SWING in the bottom-right corner, SELL shown (CANCEL not, nothing being placed)",A.n===9&&A.size>=75&&A.top>A.mmB&&A.swR===A.maxR&&A.swB===A.maxB&&A.sell&&!A.cancel,JSON.stringify(A));
check("the 3D view draws at one pixel per page pixel on a phone",A.pr===1,JSON.stringify(A.pr));
const sl=await page.evaluate(()=>{ const e=[...document.querySelectorAll('#hotbar .slot, #hotbar > *')].find(x=>x.getBoundingClientRect().width>20); const r=e.getBoundingClientRect(); return { x:r.left+r.width/2, y:r.top+r.height/2 }; }); await page.touchscreen.tap(sl.x,sl.y);
const C=await page.evaluate(async()=>{ const d=window.__dd; for(let i=0;i<4;i++){ d.step(1/30,1); await new Promise(r=>setTimeout(r,20)); } const c=document.getElementById('cancelBtn'), s=document.getElementById('sellBtn'); return { cancel:!!(c&&c.offsetParent&&getComputedStyle(c).display!=='none'), sell:!!(s&&getComputedStyle(s).display!=='none') }; });
check("placing a tower: CANCEL shows and SELL steps aside",C.cancel&&!C.sell,JSON.stringify(C));
const H=await page.evaluate(async()=>{ try{ window.__hideout.pass(); }catch(e){} await new Promise(r=>setTimeout(r,400)); return { open:window.__hideout.isOpen(), card:/THE HIDEOUT/.test((document.getElementById('lesson')||{}).textContent||'') }; });
check("the hideout door on a phone: a card, the hideout does not open (no touch in it yet)",!H.open&&H.card,JSON.stringify(H));
await ctx.close();
// held upright
const c2=await browser.newContext({...devices['iPhone 14 Pro']}); await init(c2); const p2=await c2.newPage(); p2.on("pageerror",e=>errors.push(String(e).slice(0,200)));
await p2.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await p2.goto("http://127.0.0.1:8877/?silent",{timeout:180000}); await p2.waitForFunction(()=>window.__phone,null,{timeout:180000}); await p2.waitForTimeout(500);
const U=await p2.evaluate(()=>{ const t=document.getElementById('phoneTurn'); return { shown:!!t&&getComputedStyle(t).display!=='none', text:t?t.textContent:'' }; });
check("held upright: a TURN YOUR PHONE SIDEWAYS card",U.shown&&/TURN YOUR PHONE/.test(U.text),JSON.stringify(U));
await c2.close();
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
