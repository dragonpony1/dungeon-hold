// ===== UNSTUCK (build 405; parts/staging/89b-herostuck.js). Matt: "is there an unstuck button" / "or one you can put in fast" / "u said you are not stuck".
// Checked: a hero caged so the spot under him is clear but every step is blocked (what fooled the old U into "You're not stuck") is now seen as stuck, and U moves him out to where he can walk;
// a free hero, and one standing in a corner, are not moved; pushing with no headway for 2 s shows the U keycap above the hotbar, and it goes when he moves; the Esc menu has an UNSTUCK line that works;
// the touch screen has its button; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8994,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:700}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:8994/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__herostuck&&window.__pause&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); window.__freeze=true; try{ if(window.__lesson&&window.__lesson.on()) window.__lesson.close(); }catch(e){} });
const A=await page.evaluate(()=>{ const d=window.__dd, H=window.__herostuck, h=d.hero; d.setHero(0,8,0); d.step(1/60,2); const x=h.x, z=h.z, y=h.y;
  const free=H.mobility(x,z,y); const msg0=(H.tryUnstick(),document.getElementById('toast').textContent); const stayed=Math.hypot(h.x-x,h.z-z)<.01;
  // a cage of four thin boxes just outside the hero's middle: the point under him clear, every step blocked
  const t=y+3, w=.6, r=.2, un=[ H.box({x0:x+r,x1:x+r+w,z0:z-1,z1:z+1,top:t}), H.box({x0:x-r-w,x1:x-r,z0:z-1,z1:z+1,top:t}), H.box({x0:x-1,x1:x+1,z0:z+r,z1:z+r+w,top:t}), H.box({x0:x-1,x1:x+1,z0:z-r-w,z1:z-r,top:t}) ];
  const caged=H.mobility(x,z,y); const ok=H.tryUnstick(); const msg=document.getElementById('toast').textContent; const out={ x:h.x, z:h.z, moved:+Math.hypot(h.x-x,h.z-z).toFixed(2), after:H.mobility(h.x,h.z,h.y) }; un.forEach(f=>f()); d.setHero(0,8,0);
  return { free, msg0, stayed, caged, ok, msg, moved:out.moved, after:out.after }; });
check("a free hero is told he is not stuck and is not moved",A.free>=7&&A.stayed&&/not stuck/.test(A.msg0),JSON.stringify(A));
check("caged with the spot under him clear but every step blocked (what fooled the old U): seen as stuck, and U moves him out to where he can walk",A.caged<=2&&A.ok&&/Unstuck/.test(A.msg)&&A.moved>.3&&A.after>=3,JSON.stringify(A));
const B=await page.evaluate(()=>{ const d=window.__dd, H=window.__herostuck, h=d.hero; d.setHero(0,8,0); d.step(1/60,2); const x=h.x, z=h.z, y=h.y; const t=y+3, w=.08;
  const un=[ H.box({x0:x+.45,x1:x+.45+w,z0:z-2,z1:z+2,top:t}), H.box({x0:x-2,x1:x+2,z0:z+.45,z1:z+.45+w,top:t}) ]; const m=H.mobility(x,z,y); const ok=H.tryUnstick(); const stayed=Math.hypot(h.x-x,h.z-z)<.01; un.forEach(f=>f()); d.setHero(0,8,0); return { m, ok, stayed }; });
check("a hero in a corner (two walls touching him) is not stuck and stays put",B.m>=3&&!B.ok&&B.stayed,JSON.stringify(B));
const C=await page.evaluate(async()=>{ const d=window.__dd, H=window.__herostuck, h=d.hero; d.setHero(0,8,0); d.step(1/60,2); const x=h.x, z=h.z, y=h.y, t=y+3, w=.6, r=.2;
  const un=[ H.box({x0:x+r,x1:x+r+w,z0:z-1,z1:z+1,top:t}), H.box({x0:x-r-w,x1:x-r,z0:z-1,z1:z+1,top:t}), H.box({x0:x-1,x1:x+1,z0:z+r,z1:z+r+w,top:t}), H.box({x0:x-1,x1:x+1,z0:z-r-w,z1:z-r,top:t}) ];
  const press=v=>window.dispatchEvent(new KeyboardEvent(v?'keydown':'keyup',{code:'KeyW',bubbles:true})); press(true); for(let i=0;i<60;i++) d.step(1/60,1); const early=H.hint(); for(let i=0;i<90;i++) d.step(1/60,1); const shown=H.hint();
  window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyU',bubbles:true})); d.step(1/60,2); const afterU=H.hint(); press(false); un.forEach(f=>f()); d.setHero(0,8,0); d.step(1/60,2); return { early, shown, afterU, moving:h.moving }; });
check("pushing with no headway: after 2 s the U keycap shows above the hotbar (not before), and pressing U clears it",C.early===false&&C.shown===true&&C.afterU===false,JSON.stringify(C));
const D=await page.evaluate(async()=>{ const d=window.__dd, H=window.__herostuck, h=d.hero; window.__pause.open(); await new Promise(r=>setTimeout(r,500)); const btn=document.querySelector('#pause [data-act="unstuck"]'); const has=!!btn;
  d.setHero(0,8,0); d.step(1/60,2); const x=h.x, z=h.z, y=h.y, t=y+3, w=.6, r=.2; const un=[ H.box({x0:x+r,x1:x+r+w,z0:z-1,z1:z+1,top:t}), H.box({x0:x-r-w,x1:x-r,z0:z-1,z1:z+1,top:t}), H.box({x0:x-1,x1:x+1,z0:z+r,z1:z+r+w,top:t}), H.box({x0:x-1,x1:x+1,z0:z-r-w,z1:z-r,top:t}) ];
  if(btn) btn.click(); const moved=Math.hypot(h.x-x,h.z-z)>.3; un.forEach(f=>f()); return { has, closed:!window.__pause.isOpen(), moved, touch:!!document.getElementById('unstuckBtn') }; });
check("the Esc menu has an UNSTUCK line: it closes the menu and gets him out; the touch screen has its 🆘 button",D.has&&D.closed&&D.moved&&D.touch,JSON.stringify(D));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
