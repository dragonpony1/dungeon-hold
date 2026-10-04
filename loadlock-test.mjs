// ===== LOCKS FOR LOADOUTS AND WORN GEAR (build 408). Matt: "if a loadout is saved all those items need to be automatically locked, also need to add locking to items that are equipped".
// Checked: saving a loadout locks every piece in it; a loadout's piece will not unlock (it says which loadout keeps it); a worn piece not in a loadout locks and unlocks (the Tavern's worn card has the button);
// a locked piece taken off keeps its lock and Sell all passes it by; a loadout saved before this build has its pieces locked as the game starts; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8995,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}});
await ctx.addInitScript(()=>{ try{ if(!sessionStorage.getItem('__ll')){ sessionStorage.setItem('__ll','1'); for(const k of ['ddMeta','ddGear','dd_heroGear','dd_heroLoadouts','dd_loadouts','ddArmory']) localStorage.removeItem(k); } localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
const boot=async()=>{ await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__doll&&window.__tavern&&window.__dd.heroModel(),null,{timeout:120000}); await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} await window.__heroes.select('knight'); d.start(); d.step(1/60,3); }); };
await page.goto("http://127.0.0.1:8995/?silent&ownweapons&nogate",{timeout:120000}); await boot();
const A=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; M.setLevel&&M.setLevel(40); const give=slot=>{ const it=d.rollItem(2,slot,5); it.locked=false; delete it.locked; M.giveItem(it); return it; };
  const w=give('weapon'), a=give('armor'), c=give('charm'); M.equip(w.id); M.equip(a.id); M.equip(c.id); const before=[w,a,c].map(x=>!!x.locked);
  window.__doll.saveLoadout(0); const after=[w,a,c].map(x=>!!x.locked); const stay=M.toggleLock(w.id); const msg=document.getElementById('toast').textContent; window.__A={w,a,c};
  return { before, after, stay, msg, stillLocked:!!w.locked }; });
check("saving a loadout locks every piece in it",A.before.every(v=>!v)&&A.after.every(Boolean),JSON.stringify(A));
check("a loadout's piece will not unlock -- it says which loadout keeps it",A.stay===true&&A.stillLocked&&/loadout 1/i.test(A.msg),JSON.stringify(A));
const B=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; const am=d.rollItem(2,'amulet',5); delete am.locked; M.giveItem(am); M.equip(am.id); const l1=M.toggleLock(am.id), l1b=!!am.locked; const l2=M.toggleLock(am.id); const l3=M.toggleLock(am.id);
  // the old weapon comes off for a new one: the loadout's lock goes with it; the amulet (locked by hand) comes off too
  const w2=d.rollItem(2,'weapon',5); delete w2.locked; M.giveItem(w2); M.equip(w2.id); M.unequip('amulet'); const junk=d.rollItem(1,'charm',5); delete junk.locked; M.giveItem(junk);
  const r=M.sellAll(); const ids=M.bag().map(b=>b.id); return { l1, l1b, l2, l3, sold:r.n, keptOldWeapon:ids.includes(window.__A.w.id), keptAmulet:ids.includes(am.id), junkGone:!ids.includes(junk.id) }; });
check("a worn piece not in a loadout locks and unlocks (L and the button), and a locked piece taken off keeps its lock -- Sell all passes it by",B.l1===true&&B.l1b&&B.l2===false&&B.l3===true&&B.keptOldWeapon&&B.keptAmulet&&B.junkGone,JSON.stringify(B));
const C=await page.evaluate(async()=>{ const T=window.__tavern; T.open(); T.tab('bag'); await new Promise(r=>setTimeout(r,200)); const eq=document.querySelector('#tavern [data-from="eq"]'); if(eq) eq.click(); await new Promise(r=>setTimeout(r,200)); const btn=document.querySelector('#tv-detail [data-act="lock"]'); const r={ eqCard:!!eq, lockBtn:!!btn, text:btn&&btn.textContent }; T.close(); return r; });
check("the Tavern's card for a worn piece has the Lock button",C.eqCard&&C.lockBtn,JSON.stringify(C));
// a loadout saved before this build: a bag piece it names, unlocked, is locked as the game starts
await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; const p=d.rollItem(2,'familiar',5); delete p.locked; M.giveItem(p); window.__dd.step(1/60,1); M.save&&M.save(); const all=JSON.parse(localStorage.getItem('dd_heroLoadouts')||'{}'); all.knight=all.knight||[null,null,null,null]; all.knight[2]={ids:{familiar:p.id},names:{familiar:p.name},at:1}; localStorage.setItem('dd_heroLoadouts',JSON.stringify(all)); localStorage.setItem('__oldLd',p.id); const m=JSON.parse(localStorage.getItem('ddMeta')); const b=m.bag.find(x=>x.id===p.id); if(b) delete b.locked; localStorage.setItem('ddMeta',JSON.stringify(m)); });
await page.reload(); await boot(); await page.waitForTimeout(2200);
const D=await page.evaluate(()=>{ const id=localStorage.getItem('__oldLd'); const it=window.__meta.bag().find(b=>b.id===id); return { found:!!it, locked:!!(it&&it.locked), which:window.__meta.loadoutOf(id) }; });
check("a loadout saved before this build has its pieces locked as the game starts",D.found&&D.locked&&D.which===3,JSON.stringify(D));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
