// ===== BEAST MODE AND MALAMUTE: TWO FAMILIARS (build 426; parts/staging/97h-tworings.js, 30-familiar.js FAM_SIDE). Matt: "a ring as a named trinket that allows the wearer to have 2 familiars, one on each side" /
// "a second slot for familiars in the bag" / "two named rings ... each with a 10% chance to drop per round from the beginning -- Beast Mode, Malamute".
// Checked: both are named charms; over 100 waves held each drops about one wave in ten; worn, the second familiar slot opens (bag card) and a spare pet goes in; the two pets fly at opposite shoulders and both
// fight; both pets' stats count; take the ring off and the 2nd pet goes back to the bag; it is saved with what you wear; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9010,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e))); const reqs=[]; page.on("request",r=>reqs.push(r.url()));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9010/?silent&ownweapons&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__tworings&&window.__mythic&&window.__meta&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} await window.__heroes.select('knight'); d.start(); d.step(1/60,3); window.__freeze=true; window.__meta.setLevel&&window.__meta.setLevel(40); });
const A=await page.evaluate(()=>{ const N=window.__mythic.NAMED; return { bm:N.beast_mode&&[N.beast_mode.name,N.beast_mode.slot], mm:N.malamute&&[N.malamute.name,N.malamute.slot] }; });
check("Beast Mode and Malamute are named charms",A.bm&&A.bm.join()==='Beast Mode,charm'&&A.mm&&A.mm.join()==='Malamute,charm',JSON.stringify(A));
const B=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; const n0=window.__tworings.info().drops; d.S.phase='build'; for(let w=1;w<=100;w++){ d.S.wave=12; M.onWaveHeld(12);   /* build 613: rings roll from map 2 wave 3 */ } return { drops:window.__tworings.info().drops-n0 }; });
check("over 100 waves held, the two rings drop about one wave in ten each (5 to 40 drops between them)",B.drops>=5&&B.drops<=40,JSON.stringify(B));
const C=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, R=window.__tworings, T=window.__tavern; for(const l of d.loot.slice()){ try{ d.scene.remove(l.mesh); }catch(e){} } d.loot.length=0;
  const ring=window.__mythic.normalize({ tier:'named', named:'beast_mode', lvl:10 }); M.giveItem(ring); M.equip(ring.id);
  const f1=d.rollItem(2,'familiar',8), f2=d.rollItem(3,'familiar',8); M.giveItem(f1); M.giveItem(f2); M.equip(f1.id); const fd0=d.heroStat('fdmg'); const ok=R.equip2(f2.id);
  T.open(); T.tab('bag'); const card=document.querySelector('#bs-off[data-from="fam2"]'); const cardText=card?card.textContent:'';   /* build 524 prep: the 6th EQUIPPED card (99l-bagstyle.js) replaced the 2ND FAMILIAR row */ T.close();
  d.S.phase='wave'; for(let i=0;i<60;i++) d.step(1/60,1); const h=d.hero, fx=Math.sin(h.yaw), fz=Math.cos(h.yaw), rx=-fz, rz=fx;   /* the hero's right */
  const F1=R.fam1(), F2=R.fam2(); const side=p=>p?Math.sign((p.x-h.x)*rx+(p.z-h.z)*rz):0;
  return { ringOn:R.ringOn(), ok, cardText, fdmg:{ before:fd0, after:d.heroStat('fdmg'), f2:f2.stats.fdmg||0 }, fam2:!!F2, side2:side(F2), side1:F1?side(F1):'n/a', second:R.info().second }; });
check("worn, the second slot opens: a spare familiar goes in, and its card is the sixth EQUIPPED card (2ND PET)",C.ringOn&&C.ok&&/2ND PET/.test(C.cardText)&&!!C.second,JSON.stringify(C));
check("both pets' stats count",C.fdmg.after===C.fdmg.before+C.fdmg.f2,JSON.stringify(C.fdmg));
check("the second pet flies at the other shoulder",C.fam2&&C.side2!==0&&C.side1===-C.side2,JSON.stringify({side1:C.side1,side2:C.side2}));
const D=await page.evaluate(()=>{ const d=window.__dd, R=window.__tworings; d.spawn('goblin','N'); const g=d.enemies[d.enemies.length-1]; g.hp=g.max=9999; g.spd=0; g.atk=1e9; const F2=R.fam2(); g.x=d.hero.x+3; g.z=d.hero.z+3; for(let i=0;i<60*4;i++){ d.step(1/60,1); g.x=d.hero.x+3; g.z=d.hero.z+3; } return { hurt:g.hp<9999, t2:!!(F2&&F2.target), kick:F2?F2.kick:null }; });
check("the second pet fights too (it picks a target)",D.t2&&D.hurt,JSON.stringify(D));
// build 505 (Matt: "how to upgrade 2nd pet"): a click on the 2nd card opens its panel with the forge; +1 there upgrades the 2nd pet (not the first) and there's a Take off button
const UP=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, T=window.__tavern; M.addGold(1e6); T.open(); T.tab('bag'); const c=document.querySelector('#bs-off[data-from="fam2"]'); if(c) c.click();
  const det=document.getElementById('tv-detail'), forge=det&&det.querySelector('#tv-forge'), b=forge&&forge.querySelector('[data-act="tvup"][data-n="1"]:not([disabled])'); const g=d.gear(), id=g.familiar2&&g.familiar2.id, k=b&&b.dataset.key;
  const v2=k?(g.familiar2.stats[k]||0):null, v1=k?(g.familiar.stats[k]||0):null, u0=g.familiar2.up|0; if(b) b.click(); const g2=d.gear();
  const r={ opened:!!(det&&!det.classList.contains('hide')), forge:!!forge, takeOff:!!document.querySelector('#tv-detail [data-act="unequip2"]'), key:k, v2, v2a:k?g2.familiar2.stats[k]:null, v1, v1a:k?g2.familiar.stats[k]:null, up:(g2.familiar2.up|0)-u0, stillSel:!!document.querySelector('#tv-detail #tv-forge') }; T.close(); return r; });
check("build 505: clicking the 2nd pet's card opens its forge; +1 upgrades the 2nd pet only, and the panel has Take off",UP.opened&&UP.forge&&UP.takeOff&&UP.up===1&&UP.v2a>UP.v2&&UP.v1a===UP.v1&&UP.stillSel,JSON.stringify(UP));
const E=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, R=window.__tworings; const saved=JSON.parse(localStorage.getItem('ddGear')).familiar2; const other=d.rollItem(1,'charm',5); M.giveItem(other); M.equip(other.id); d.step(1/60,2); return { saved:!!(saved&&saved.id), ringOn:R.ringOn(), back:!R.info().second&&M.bag().some(b=>b.slot==='familiar') }; });
check("it is saved with your gear; take the ring off and the 2nd pet goes back to the bag",E.saved&&!E.ringOn&&E.back,JSON.stringify(E));
await page.evaluate(()=>{ const d=window.__dd; d.S.phase='build'; window.__tworings.dropRing('beast_mode'); window.__tworings.dropRing('malamute'); for(let i=0;i<30;i++) d.step(1/60,1); }); await new Promise(r=>setTimeout(r,2500));
check("dropped, Beast Mode and Malamute stand on the floor as Matt's own 3D rings (builds 427, 429)",reqs.some(u=>/named-beast_mode/.test(u))&&reqs.some(u=>/named-malamute/.test(u)),JSON.stringify(reqs.filter(u=>/named-/.test(u)).map(u=>u.split('/').pop())));
const ART=await page.evaluate(async()=>{ const it=window.__tworings.dropRing('malamute'), it2=window.__tworings.dropRing('beast_mode'); const st=async u=>u?(await fetch(u)).status:0; return { m:it&&it.art, b:it2&&it2.art, ms:await st(it&&it.art), bs:await st(it2&&it2.art) }; });
check("each ring carries Matt's own picture for its card (build 430)",/malamute.jpg$/.test(ART.m||'')&&/beast_mode.jpg$/.test(ART.b||'')&&ART.ms===200&&ART.bs===200,JSON.stringify(ART));
const TP=await page.evaluate(async()=>{ const P=window.__tavpics, it=window.__mythic.normalize({tier:'named',named:'malamute',lvl:5}), other=window.__mythic.normalize({tier:'named',named:'gabriels_charm',lvl:5}); return { ring:/2 PETS/.test(P.chips(it)), other:/2 PETS/.test(P.chips(other)) }; });
check("the rings' cards say 2 PETS (and other named pieces don't)",TP.ring&&!TP.other,JSON.stringify(TP));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
