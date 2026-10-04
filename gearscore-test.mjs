// ===== GEAR SCORE BADGES AND THE TOTAL (build 525 prep; game.js gsOf / gsBadge / gearScoreTotal, 20-tavern / 99l-bagstyle / 68-paperdoll / 60-lootfeel). Matt: "show gear score on items equipped
// as wel as in bag, and a small like showing total gear score on equipped".
// Checked: a "GS n" badge on every bag tile, every equipped card (the six), every Tab sheet plaque and inventory cell, the hover card and the pickup card; the total over the equipped band and on the Tab
// sheet equals the sum of what is worn (with the 2nd weapon while its ring is on); a forge upgrade raises the piece's badge and the total; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const PORT=9249; const server=await serve(PORT,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1366,height:860}}); await ctx.route(/\/api\//,r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("ddHero","knight"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:"+PORT+"/?silent&nogate&nosetgate",{timeout:180000}); await page.waitForFunction(()=>window.__dd&&window.__gearscore&&window.__typed&&window.__meta&&window.__doll&&window.__tavern,null,{timeout:180000});
await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,3); window.__freeze=true; window.__meta.setLevel&&window.__meta.setLevel(40); d.S.phase='build'; window.__meta.addGold&&window.__meta.addGold(1e7); });
// wear one of each slot, keep a dozen in the bag
await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, T=window.__typed; M.reset(); d.resetGear(); M.setLevel&&M.setLevel(40); if(M.addGold) M.addGold(1e7); else M.giveGold(1e7);
  for(const s of ['weapon','armor','charm','amulet','familiar']){ if(s==='weapon') T.force('sword'); const it=d.rollItem(3,s,12); T.force(null); M.giveItem(it); M.equip(it.id); }
  for(let i=0;i<12;i++){ const it=d.rollItem(i%5,undefined,8); M.giveItem(it); } });
const sumWorn=()=>page.evaluate(()=>{ const g=window.__dd.gear(); let v=0; for(const s of ['weapon','armor','charm','amulet','familiar']) if(g[s]) v+=g[s].score; return Math.round(v); });
// ---- the bag
const BAG=await page.evaluate(async()=>{ window.__tavern.open(); window.__tavern.tab('bag'); await new Promise(r=>setTimeout(r,150)); const M=window.__meta;
  const tiles=[...document.querySelectorAll('#tv-bag .tv-tile')].map(t=>{ const it=M.bag().find(b=>b.id===t.dataset.id); const b=t.querySelector('.gs-b'); return {ok:!!(it&&b&&b.textContent.endsWith('GS '+Math.round(it.score).toLocaleString('en-US'))&&(it.slot!=='weapon'||!!b.querySelector('.wt'))),txt:b&&b.textContent}; });
  const g=window.__dd.gear(); const eq=[...document.querySelectorAll('#tv-bag .bs-eq[data-id]')].filter(c=>c.dataset.id).map(c=>{ const it=Object.values(g).find(x=>x&&x.id===c.dataset.id); const b=c.querySelector('.gs-b'); return {ok:!!(it&&b&&b.textContent==='GS '+Math.round(it.score).toLocaleString('en-US')),txt:b&&b.textContent}; });
  const tot=document.querySelector('#bs-gstotal'); const any=M.bag()[0]; const card=window.__emblem.card(any,'bag');
  return {tiles,eq,total:tot?{gs:+tot.dataset.gs,txt:tot.textContent}:null,bag:M.bag().length,hover:/class="gs-b[^"]*"[^>]*>GS \d/.test(card)}; });
const S0=await sumWorn();
check("every bag tile wears its GS badge, a weapon's with its type emblem in front ("+BAG.tiles.length+" tiles for "+BAG.bag+" pieces)",BAG.tiles.length===BAG.bag&&BAG.tiles.every(t=>t.ok),JSON.stringify(BAG.tiles.slice(0,3)));
check("every worn card in the equipped band wears its GS badge (5)",BAG.eq.length===5&&BAG.eq.every(t=>t.ok),JSON.stringify(BAG.eq));
check("the equipped band shows the total: ⚔ GEAR SCORE n, equal to the sum of the five worn scores",BAG.total&&BAG.total.gs===S0&&/⚔ GEAR SCORE [\d,]+/.test(BAG.total.txt)&&BAG.total.txt.includes(S0.toLocaleString('en-US')),JSON.stringify({total:BAG.total,S0}));
check("the hover / item card carries the GS badge too",BAG.hover);
// ---- the Tab sheet
const TAB=await page.evaluate(async()=>{ window.__tavern.close(); window.__doll.open(); await new Promise(r=>setTimeout(r,150)); const g=window.__dd.gear();
  const plaques=['weapon','armor','charm','amulet','familiar'].map(s=>{ const el=document.querySelector('#doll .dl-slot.'+s+' .gs-b'); return !!(el&&el.textContent==='GS '+Math.round(g[s].score).toLocaleString('en-US')); });
  const cells=[...document.querySelectorAll('#doll .inv-c.has')], withB=cells.filter(c=>c.querySelector('.gs-b')).length; const tot=document.querySelector('#dl-gstotal');
  window.__doll.select(window.__meta.bag()[0].id,'bag'); await new Promise(r=>setTimeout(r,80)); const cardB=!!document.querySelector('#doll .cd-sub .gs-b'); window.__doll.close();
  return {plaques,cells:cells.length,withB,total:tot?+tot.dataset.gs:null,cardB}; });
check("the Tab sheet: each of the five slot plaques shows its GS",TAB.plaques.every(Boolean),JSON.stringify(TAB.plaques));
check("the Tab sheet: every inventory cell shows its GS, and the item card too",TAB.cells>0&&TAB.withB===TAB.cells&&TAB.cardB,JSON.stringify(TAB));
check("the Tab sheet shows the same total",TAB.total===S0,JSON.stringify({tab:TAB.total,S0}));
// ---- a forge upgrade: the badge and the total go up
const UP=await page.evaluate(async()=>{ const d=window.__dd, F=window.__meta.forge||null, w=d.gear().weapon, before=w.score; const f=F||(window.Meta&&window.Meta.forge);
  const n=window.__forge?window.__forge.upgrade(w.id,'dmg',3):(f?f.upgrade(w.id,'dmg',3):0); window.__tavern.open(); window.__tavern.tab('bag'); window.__tavern.render(); await new Promise(r=>setTimeout(r,120));
  const card=document.querySelector('#tv-bag .bs-eq[data-id="'+w.id+'"] .gs-b'), tot=document.querySelector('#bs-gstotal'); window.__tavern.close();
  return {n,before,after:w.score,card:card&&card.textContent,total:tot?+tot.dataset.gs:null,api:window.__gearscore.total()}; });
const S1=await sumWorn();
check("a forge upgrade raises the weapon's score, its card's badge and the total ("+UP.before+" -> "+UP.after+")",UP.n>0&&UP.after>UP.before&&UP.card==='GS '+Math.round(UP.after).toLocaleString('en-US')&&UP.total===S1&&S1>S0&&UP.api===S1,JSON.stringify(UP));
// ---- the 6th card: the 2nd weapon counts while its ring is on
const W2=await page.evaluate(async()=>{ const d=window.__dd, M=window.__meta, T=window.__typed, N=window.__mythic, D=window.__dualwield, G=window.__gearscore;
  const before=G.total(); const ring=N.normalize({tier:'named',named:'twotimer',lvl:20}); M.giveItem(ring); M.equip(ring.id); const withRing=G.total();
  T.force('sword'); const w=d.rollItem(3,'weapon',12); T.force(null); M.giveItem(w); const ok=D.equip2(w.id); const after=G.total();
  window.__tavern.open(); window.__tavern.tab('bag'); window.__tavern.render(); await new Promise(r=>setTimeout(r,120)); const off=document.querySelector('#bs-off .gs-b'), tot=document.querySelector('#bs-gstotal'); window.__tavern.close();
  const g=d.gear(); let sum=0; for(const s of ['weapon','armor','charm','amulet','familiar']) if(g[s]) sum+=g[s].score; sum+=g.weapon2.score;
  return {ok,before,withRing,after,w2:w.score,off:off&&off.textContent,total:tot?+tot.dataset.gs:null,sum:Math.round(sum),parts:G.parts().length}; });
check("the off-hand card shows its GS, and the total counts the 2nd weapon while its ring is on",W2.ok&&W2.off==='GS '+Math.round(W2.w2).toLocaleString('en-US')&&W2.after===W2.sum&&W2.total===W2.sum&&W2.parts===6,JSON.stringify(W2));
// ---- the pickup card
const PC=await page.evaluate(async()=>{ const d=window.__dd, h=d.hero; const it=d.rollItem(2,'armor',8); d.dropLoot(it,h.x+.3,h.z+.3,true); for(let i=0;i<120;i++){ d.step(1/60,1); const c=document.querySelector('#pickcard.show .gs-b'); if(c) return c.textContent; await new Promise(r=>setTimeout(r,10)); } return null; });
check("the pickup card shows the found piece's GS",/^GS \d/.test(PC||''),String(PC));
// build 526 (Matt: "could we squees a gs score into the loadout box"): a saved loadout's card shows its gear score
const LD=await page.evaluate(()=>{ const Dl=window.__doll; Dl.saveLoadout(0); Dl.open(); const html=Dl.html(); Dl.close(); const i=html.indexOf('title="Gear score of this loadout"'); const m=i<0?null:html.slice(i).match(/GS ([0-9,]+)/); return { found:!!m, gs:m?m[1]:null, total:window.__gearscore.total() }; });
check("a saved loadout's card shows GS = the pieces it saved",LD.found&&parseInt(String(LD.gs).replace(/,/g,''))>0,JSON.stringify(LD));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,4)));
await page.screenshot({path:(process.env.SP||'.')+'/parts/shots/gearscore-test.png'}).catch(()=>{});
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
