// ===== NO STUCK IPAD AT THE HIDEOUT (build 630). Matt, on an iPad: "Tried to go to hideout on iPad on the hideout loading screen couldn't click to enter".
// The hideout is a mouse-look room; an iPad with no mouse/trackpad can't enter it. Checked as such an iPad: the portal shows THE HIDEOUT card (PC / mouse + keys) and no room; the 5th Forest piece
// comes straight to the bag (no locker), so the horn never waits; a piece ALREADY waiting in the locker comes to the bag at the next horn; on a PC the hideout opens as ever.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8942,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
async function open(opts,q){ const ctx=await browser.newContext(opts); const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
  await ctx.addInitScript(()=>{ try{ if(sessionStorage.getItem('__ih')) return; sessionStorage.setItem('__ih','1'); localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","1"); localStorage.setItem("dd_trainer",JSON.stringify({done:{},off:true})); }catch(e){} });
  await p.goto("http://127.0.0.1:8942/?silent&nogate&nosetgate&map=0"+(q||""),{timeout:120000}); await p.waitForFunction(()=>window.__dd&&window.__forest&&window.__hideout&&window.__hideoutUsable,null,{timeout:120000}); return {ctx,p}; }
const IPAD={ viewport:{width:1180,height:820}, userAgent:"Mozilla/5.0 (iPad; CPU OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1", hasTouch:true, isMobile:true };
{ const {ctx,p}=await open(IPAD);
  const A=await p.evaluate(async()=>{ const d=window.__dd; d.start(); d.step(1/60,3); const usable=window.__hideoutUsable(), phone=!!window.__PHONE; window.__hideout.pass(); d.step(1/60,2); await new Promise(r=>setTimeout(r,800));
    return { usable, phone, isOpen:window.__hideout.isOpen(), frame:!!window.__hideout.frameWin(), card:window.__lesson.text()||'' }; });
  check("an iPad with no mouse: the portal shows THE HIDEOUT card (PC / mouse + keys) instead of a room it can't use",!A.usable&&!A.phone&&!A.isOpen&&!A.frame&&/HIDEOUT/.test(A.card)&&/mouse/.test(A.card),JSON.stringify(A));
  const B=await p.evaluate(()=>{ const d=window.__dd, F=window.__forest, M=window.__meta; try{ localStorage.removeItem(F.LOCKER_KEY); localStorage.removeItem('dd_gear_carried'); }catch(e){} M.reset(); d.resetGear();
    const mk=slot=>{ const it=d.rollItem(1,slot,3); it.rarity=1; F.make(it); M.onPickup(it); M.equip(it.id); }; ['weapon','armor','charm','amulet'].forEach(mk); d.S.phase='build'; for(let i=0;i<40;i++) d.step(1/60,1);
    const o=F.locker(), inBag=!!M.bag().find(it=>F.isForest(it)&&it.slot==='familiar'); d.startWave(); return { taken:!!(o&&o.taken), direct:!!(o&&o.direct), inBag, pending:F.lockerPending(), phase:d.S.phase, carried:JSON.parse(localStorage.getItem('dd_gear_carried')||'[]').length }; });
  check("four Forest pieces on map one: the fifth comes straight to the bag (no locker), and the horn sounds",B.taken&&B.direct&&B.inBag&&!B.pending&&B.phase==='wave'&&B.carried===0,JSON.stringify(B));
  const C=await p.evaluate(()=>{ const d=window.__dd, F=window.__forest, M=window.__meta; d.enemies.forEach(e=>{ e.hp=0; e.dead=1; }); d.S.phase='build';
    const bagged=M.bag().find(it=>F.isForest(it)&&it.slot==='familiar'); if(bagged) M.sell?M.sell(bagged.id):0; const it=d.rollItem(1,'familiar',3); it.rarity=1; F.make(it);
    localStorage.setItem(F.LOCKER_KEY,JSON.stringify({item:it,at:1,taken:false})); localStorage.setItem('dd_gear_carried',JSON.stringify([Object.assign({},it,{reward:true,takeBack:true})]));   /* an old save: the piece waiting in the locker */
    const before=F.lockerPending(); d.startWave(); return { before, after:F.lockerPending(), inBag:!!M.bag().find(b=>b.id===it.id), phase:d.S.phase }; });
  check("an iPad save with the piece already waiting in the locker: the next horn brings it to the bag and sounds",C.before&&!C.after&&C.inBag&&C.phase==='wave',JSON.stringify(C));
  await ctx.close(); }
{ const {ctx,p}=await open({ viewport:{width:1280,height:800} });
  const D=await p.evaluate(()=>({ usable:window.__hideoutUsable() })); check("on a PC the hideout is open to enter as ever",D.usable,JSON.stringify(D)); await ctx.close(); }
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
