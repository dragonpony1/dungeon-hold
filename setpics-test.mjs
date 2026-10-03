// ===== SET PIECE PICTURES (build 514, 93-gearsets.js setPicOf). Matt: "some of these set peices dont have thumnails i guess". Every set piece's card shows the set's own per-piece picture (the forge's
// art: sword/staff/polearm/armor/amulet/trinket, all ten sets incl. the Forest, which had none), the weapon by the hand that holds it. Checked per hero: every set's weapon/armor/charm/amulet card has a
// picture that actually loads (no broken image); the Witch sees staffs, the Fighter polearms, the Knight swords; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9024,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1300,height:850}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route(/\/api\//,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9024/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__meta.packs&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,30); });
for(const hero of ['knight','witch','fighter']){
  await page.evaluate(async h=>{ await window.__heroes.select(h); },hero); await page.waitForTimeout(500);
  const R=await page.evaluate(async()=>{ const P=window.__meta.packs, out=[]; for(const name of P.list()){ for(const slot of ['weapon','armor','charm','amulet']){ const it={ id:'t'+Math.random(), slot, rarity:3, lvl:10, name:'Test '+name, stats:{dmg:1}, set:name };
        const pk=P.of(it)||P.of(Object.assign(it,{ name:'Gleaming Thing '+name })); const src=P.art(it); out.push({ name, slot, src, pack:!!pk }); } }
    const imgs=await Promise.all(out.map(o=>o.src?new Promise(r=>{ const i=new Image(); i.onload=()=>r(true); i.onerror=()=>r(false); i.src=o.src; }):Promise.resolve(false)));
    return out.map((o,i)=>Object.assign(o,{ ok:imgs[i] })); });
  const bad=R.filter(o=>o.pack&&!o.ok), nopack=R.filter(o=>!o.pack).length, weap=R.filter(o=>o.slot==='weapon'&&o.src).map(o=>o.src.split('/').pop());
  const want={knight:'-sword.jpg',witch:'-staff.jpg',fighter:'-polearm.jpg'}[hero];
  check(hero+": every set's weapon / armor / charm / amulet card has a picture that loads",nopack===0&&bad.length===0,JSON.stringify({nopack,bad:bad.slice(0,6)}));
  check(hero+": weapon pictures are the hand's own ("+want+")",weap.length>=10&&weap.every(s=>s.endsWith(want)),JSON.stringify(weap.slice(0,4)));
}
// build 517: set bows -- Storm / Forest / Shadow have Matt's bow picture for the Ranger; a mythic set weapon's picture follows the hand
const B=await page.evaluate(async()=>{ await window.__heroes.select('troll'); const P=window.__meta.packs; const mk=n=>({ id:'b'+Math.random(), slot:'weapon', rarity:3, lvl:10, name:'Test of the '+n, stats:{dmg:1} });
  const st=P.art(mk('Storm')), fo=P.art(mk('Forest')), my=P.art({ id:'m1', slot:'weapon', rarity:5, lvl:10, name:'Mythic Polearm of the Storm', setId:'storm', look:'polearm', art:'hideout/assets/hideout/items/sets/storm-polearm.jpg', stats:{dmg:1} });
  const ok=await Promise.all([st,fo,my].map(src=>src?new Promise(r=>{ const i=new Image(); i.onload=()=>r(true); i.onerror=()=>r(false); i.src=src; }):false)); return { st, fo, my, ok }; });
check("the Ranger: Storm and Forest set bows show Matt's bow pictures, and a mythic Storm polearm in his hand shows the bow too",/storm-bow.jpg$/.test(B.st||'')&&/forest-bow.jpg$/.test(B.fo||'')&&/storm-bow.jpg$/.test(B.my||'')&&B.ok.every(Boolean),JSON.stringify(B));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
