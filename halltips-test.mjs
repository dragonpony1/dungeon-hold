// ===== THREE ONE-TIME PICTURE CARDS (build 571; parts/staging/99p-halltips.js, hideout build 90 hoTip). Matt: the hero's second attack "just once in the hall"; "a sludge tutorial from pick up, salvage
// all the way thru forge" (proc'd = "you won the lottery"); the Malamute / Beast Mode "stop and explain ... as you walk over it". Checked on a player's page (no ?silent): each shows once, by itself, at its moment.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8857,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const p=await (await browser.newContext({viewport:{width:1300,height:800}})).newPage(); p.on("pageerror",e=>errors.push(String(e)));
await p.route(/\/api\//,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
await p.route(/workers\.dev/,r=>r.fulfill({status:404,body:''}));
await p.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_bag_guide","1"); localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} });
await p.goto("http://127.0.0.1:8857/?nogate",{timeout:120000}); await p.waitForFunction(()=>window.__dd&&window.__halltips&&window.__lesson&&window.__jars&&window.__dd.heroModel(),null,{timeout:120000});
await p.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); window.__freeze=true; window.__lesson.close(); });
// 1. the second attack: the first build break after wave 2 in the hall
const A=await p.evaluate(async()=>{ const d=window.__dd; d.S.wave=1; d.S.phase='build'; await new Promise(r=>setTimeout(r,3500)); const early=window.__halltips.info().special;
  d.S.wave=2; for(let i=0;i<10&&!window.__halltips.info().special;i++) await new Promise(r=>setTimeout(r,500)); const t=window.__lesson.text(); window.__lesson.close();
  return { early, n:window.__halltips.info().special, text:t, name:window.__specials.name(), seen:localStorage.getItem('dd_tip_special') }; });
check("the second attack: not after wave 1; after wave 2, in the build break, a card with the hero's special and 'HOLD right-click'",A.early===0&&A.n===1&&A.text.toUpperCase().includes(A.name.toUpperCase())&&/HOLD right-click/i.test(A.text)&&A.seen==='1',JSON.stringify(A));
// 2. sludge: the first jar picked up
const B=await p.evaluate(async()=>{ const d=window.__dd, J=window.__jars, h=d.hero; d.S.phase='wave'; window.__lesson.close(); J.spawn(0,h.x+.5,h.z+.5); for(let i=0;i<120&&!J.run().some(n=>n>0);i++) d.step(1/60,1);
  for(let i=0;i<40&&!window.__halltips.info().sludge;i++){ if(window.__lesson.on()&&!/SLUDGE/.test(window.__lesson.text())) window.__lesson.close(); await new Promise(r=>setTimeout(r,300)); } const t=window.__lesson.text(); window.__lesson.close(); return { run:J.run(), n:window.__halltips.info().sludge, text:t }; });
check("sludge: the first jar picked up shows the SLUDGE card (walk over jars, take it to the hideout, the forge)",B.n===1&&/SLUDGE/.test(B.text)&&/hideout/i.test(B.text)&&/forge/i.test(B.text),JSON.stringify(B));
// 3. the ring: the hall stops as the hero nears it; CONTINUE lets it go on
const C=await p.evaluate(async()=>{ const d=window.__dd, N=window.__mythic, h=d.hero; const it=N.normalize({tier:'named',named:'malamute',lvl:5}); d.dropLoot(it,h.x+4,h.z); window.__freeze=false;
  for(let i=0;i<40&&!window.__halltips.info().ringOn;i++) await new Promise(r=>setTimeout(r,100)); const el=document.getElementById('ringtip'); return { on:window.__halltips.info().ringOn, frozen:window.__freeze===true, text:el?el.textContent:'' }; });
check("a two-pet ring near the hero: the hall STOPS (frozen) under the MALAMUTE card -- wear it, two pets, Equip as 2nd",C.on&&C.frozen&&/MALAMUTE/.test(C.text)&&/TWO pets/.test(C.text)&&/Equip as 2nd/.test(C.text),JSON.stringify(C));
await p.waitForTimeout(500); await p.keyboard.press('Enter');
const D=await p.evaluate(()=>({ on:window.__halltips.info().ringOn, frozen:!!window.__freeze, seen:localStorage.getItem('dd_tip_ring') }));
check("Enter (CONTINUE) and the hall moves again; it never stops for a ring a second time",!D.on&&!D.frozen&&D.seen==='1',JSON.stringify(D));
// 4. the hideout's halves: the cauldron and the forge, the first time each opens
const E=await p.evaluate(async()=>{ window.__freeze=true; window.__hideout.open(); for(let i=0;i<80&&!(window.__hideout.frameWin()&&window.__hideout.frameWin().openForge);i++) await new Promise(r=>setTimeout(r,250)); const w=window.__hideout.frameWin(); if(!w||!w.openForge) return { ok:false };
  const out={ ok:true }; try{ w.openCauldron(); }catch(e){ out.ce=String(e); } let t=w.document.getElementById('hotip'); out.cauldron=t?t.textContent:''; if(t) t.querySelector('button').click();
  try{ w.openForge(); }catch(e){ out.fe=String(e); } t=w.document.getElementById('hotip'); out.forge=t?t.textContent:''; if(t) t.querySelector('button').click();
  try{ w.openForge(); }catch(e){} out.again=!!w.document.getElementById('hotip'); return out; });
check("hideout: the first cauldron shows its card (gear in, sludge out, 3 make 1)",E.ok&&/CAULDRON/.test(E.cauldron)&&/Sludge/i.test(E.cauldron)&&/3 smaller/.test(E.cauldron),JSON.stringify(E).slice(0,300));
check("hideout: the first forge shows its card, with PROC'D = 'You won the lottery!'; never twice",E.ok&&/FORGE/.test(E.forge)&&/PROC'D/.test(E.forge)&&/won the lottery/.test(E.forge)&&!E.again,JSON.stringify(E).slice(0,400));
// 5. build 573: the Gnome Hall held for the first time -- the three new heroes and how to switch
const H=await p.evaluate(async()=>{ const d=window.__dd; try{ window.__hideout.close(); }catch(e){} window.__freeze=true; window.__lesson.close(); d.S.phase='build'; d.S.held=true; for(let i=0;i<30&&!window.__halltips.info().heroOn;i++) await new Promise(r=>setTimeout(r,300)); const el=document.getElementById('herotip'); return { on:window.__halltips.info().heroOn, text:el?el.textContent:'', imgs:el?el.querySelectorAll('img').length:0 }; });
check('first hall held: the 3 NEW HEROES card -- witch, ranger, fighter pictures, H to switch, the title cards',H.on&&/3 NEW HEROES/.test(H.text)&&/RANGER/.test(H.text)&&/switch hero/.test(H.text)&&H.imgs===3,JSON.stringify(H).slice(0,300));
await p.waitForTimeout(500); await p.keyboard.press('Enter'); const H2=await p.evaluate(()=>({ on:window.__halltips.info().heroOn, seen:localStorage.getItem('dd_tip_heroes') }));
check('Enter closes it, and it is remembered',!H2.on&&H2.seen==='1',JSON.stringify(H2));
const real=errors.filter(e=>!/Failed to fetch|Load failed|NetworkError/i.test(e));
check("no page errors",real.length===0,JSON.stringify(real.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
