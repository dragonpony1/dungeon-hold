// ===== THE BAG RESTYLED AFTER MATT'S MOCKUP (build 524 prep, parts/staging/99l-bagstyle.js). Checks: the EQUIPPED band has six cards -- the five slots plus the dynamic OFF-HAND / 2ND PET card, which
// shows the 2nd weapon while a dual-wield ring is on, the 2nd pet while Beast Mode is on, and a locked 💍 slot otherwise; the ten set medallions load; the green +N badge is the forge upgrades bought on the
// piece; and every button still works in its new place (Sell junk, Sell all's two taps, the sort cycle, lock, equip from a tile, forge +1 from the panel, the sixth card's panel, BACK TO THE HALL).
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
import fs from "fs"; import path from "path"; import { execSync } from "child_process";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const SP=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/,"")); const DIST=process.env.DIST||SP+"/dist";
if(!fs.existsSync(DIST+"/index.html")){ console.log("building "+DIST+" first"); execSync("DIST="+DIST+" EXTRA=./parts/staging node assemble.mjs",{cwd:SP,stdio:"inherit"}); }
const PORT=9478; const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1500,height:950}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route(/\/api\//,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:"+PORT+"/?silent&ownweapons&nogate",{timeout:120000});
await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__meta.packs&&window.__tavern&&window.__bagstyle&&window.__dualwield&&window.__tworings,null,{timeout:120000});
await page.evaluate(async()=>{ await window.__heroes.select('knight'); }); await page.waitForTimeout(500);
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); window.__freeze=true; d.S.phase='build'; });
// a bag: a piece of every set and slot, some junk, five worn pieces with forge upgrades bought on four of them
const W=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, P=M.packs, F=M.forge, D=window.__dualwield; M.setLevel&&M.setLevel(40); M.addGold(5e6);
  const SL=['weapon','armor','charm','amulet','familiar']; const roll=(r,sl)=>{ let it=d.rollItem(r,sl,20); for(let q=0;q<40&&sl==='weapon'&&D.isPolearm(it);q++) it=d.rollItem(r,sl,20); it.rarity=r; return it; };
  for(const n of P.list()) for(const sl of SL){ const it=roll(2,sl); it.name=it.name+' '+n; M.giveItem(it); }
  for(let i=0;i<6;i++){ const it=roll(0,SL[i%5]); it.score=0; M.giveItem(it); }
  const ups={}; SL.forEach((sl,i)=>{ const it=roll(3,sl); M.giveItem(it); M.equip(it.id); const ks=F.keys(it); for(let j=0;j<i;j++) F.upgrade(it.id,ks[0],1); ups[sl]={ id:it.id, used:F.used(it) }; });
  return { ups, bag:M.bag().length }; });
const open=()=>page.evaluate(()=>{ const T=window.__tavern; if(T.isOpen()) T.close(); T.open(); T.tab('bag'); });
const eqRow=()=>page.evaluate(()=>[...document.querySelectorAll('#tv-bag .tv-eq .bs-eqrow > .bs-eq')].map(c=>({ from:c.dataset.from||'', act:c.dataset.act, id:c.dataset.id||'', slot:c.dataset.slot||'', off:c.dataset.off||'', up:(c.querySelector('.bs-up')||{}).textContent||'', text:c.textContent })));
await open(); await page.waitForTimeout(300);
// ---- six cards, the sixth locked with no ring on
let row=await eqRow();
check("the EQUIPPED band holds six cards: the five slots plus the OFF-HAND / 2ND PET card",row.length===6&&row.filter(c=>c.from==='eq').length===5&&row.filter(c=>c.off).length===1,JSON.stringify(row.map(c=>c.from+c.slot+c.off)));
check("each worn card shows its slot, Lv. and rarity",row.filter(c=>c.from==='eq').every(c=>new RegExp(c.slot,'i').test(c.text)&&/Lv\. \d+/.test(c.text)&&/(Common|Uncommon|Rare|Epic|Legendary|Mythic)/.test(c.text)),row.map(c=>c.text.slice(0,40)).join(' | '));
const lockedC=row.find(c=>c.off);
check("no ring on: the sixth card is the locked 💍 slot (OFF-HAND / 2ND PET), beside the weapon",lockedC&&lockedC.off==='locked'&&/💍/.test(lockedC.text)&&/OFF-HAND/.test(lockedC.text)&&row[1].off==='locked',JSON.stringify(lockedC));
check("the old separate 2ND FAMILIAR / 2ND WEAPON rows are gone",await page.evaluate(()=>!document.querySelector('#tv-fam2')&&!document.querySelector('#tv-wpn2')));
await page.click('#bs-off'); await page.waitForTimeout(100);
check("a click on the locked slot says what opens it (and opens no panel)",await page.evaluate(()=>/💍/.test(document.getElementById('tv-msg').textContent)&&document.getElementById('tv-detail').classList.contains('hide')));
// ---- the +N badges
const badge=row.filter(c=>c.from==='eq').map(c=>({ slot:c.slot, up:c.up, want:W.ups[c.slot].used }));
check("the green +N on each worn card is the forge upgrades bought on it (none shown at 0)",badge.every(b=>b.want?b.up==='+'+b.want:b.up==='')&&badge.some(b=>b.want>0),JSON.stringify(badge));
// ---- the medallions
const med=await page.evaluate(async()=>{ const imgs=[...document.querySelectorAll('#tv-bag .bs-sets .bs-set .bs-med')]; await Promise.all(imgs.map(i=>i.complete?0:new Promise(r=>{ i.onload=i.onerror=r; setTimeout(r,8000); })));
  return { sets:document.querySelectorAll('#tv-bag .bs-sets .bs-set').length, n:imgs.length, ok:imgs.filter(i=>i.naturalWidth>0).length, keys:imgs.map(i=>i.dataset.medal).join(','), srcOk:imgs.every(i=>/assets\/medal-[a-z]+\.png/.test(i.getAttribute('src'))) }; });
check("ten gold-framed set columns, each with its medallion -- all ten pictures load",med.sets===10&&med.n===10&&med.ok===10&&med.srcOk&&med.keys==='void,forest,crimson,rock,lava,angelic,storm,shadow,ice,wind',JSON.stringify(med));
const cols=await page.evaluate(()=>[...document.querySelectorAll('#tv-bag .bs-set')].map(s=>s.querySelectorAll('.tv-sc').length+':'+(s.querySelector('.tv-n')||{}).textContent).join(' '));
check("every set column keeps all five slot squares and its n/5 count",/^(5:5\/5 ?){10}$/.test(cols),cols);
check("OTHER GEAR (NO SET) is five framed panels",await page.evaluate(()=>/OTHER GEAR \(NO SET\)/.test((document.querySelector('#tv-bag .tv-oth')||{}).textContent||'')&&document.querySelectorAll('#tv-bag .tv-cols .tv-col').length===5));
// ---- the tools beside the tabs
const tools=await page.evaluate(()=>{ const t=document.getElementById('bs-tools'); return { sort:!!t.querySelector('#tv-sort'), junk:!!t.querySelector('#tv-selljunk'), all:!!t.querySelector('#tv-sellall'), lk:!!t.querySelector('.lk-hint'), inTabs:!!t.closest('.tv-tabs'), shown:getComputedStyle(t).display!=='none' }; });
check("the bag's buttons sit in the tab row (sort, Sell junk, Sell all, the L-lock chip)",Object.values(tools).every(Boolean),JSON.stringify(tools));
await page.click('#tv-tab-shop'); await page.waitForTimeout(100);
check("...and hide on the SHOP tab",await page.evaluate(()=>getComputedStyle(document.getElementById('bs-tools')).display==='none'));
await page.click('#tv-tab-bag'); await page.waitForTimeout(100);
// ---- sort cycle
const s0=await page.evaluate(()=>window.__meta.bagSort()); await page.click('#tv-sort'); await page.waitForTimeout(100);
const s1=await page.evaluate(()=>({ m:window.__meta.bagSort(), lbl:document.getElementById('tv-sort').textContent, six:document.querySelectorAll('#tv-bag .bs-eqrow > .bs-eq').length }));
check("the sort button still cycles (by set -> by piece), the six cards stay in every sort",s0==='setcols'&&s1.m==='columns'&&/by piece/.test(s1.lbl)&&s1.six===6,JSON.stringify({s0,s1}));
for(let i=0;i<6&&await page.evaluate(()=>window.__meta.bagSort())!=='setcols';i++){ await page.click('#tv-sort'); await page.waitForTimeout(80); }
check("...and round again to by set",await page.evaluate(()=>window.__meta.bagSort())==='setcols');
// ---- lock from a tile's panel, equip from a tile
const tileId=await page.evaluate(()=>{ const t=document.querySelector('#tv-bag .bs-sets .tv-tile'); return t&&t.dataset.id; });
await page.click('#tv-bag .bs-sets .tv-tile[data-id="'+tileId+'"]'); await page.waitForTimeout(100);
await page.click('#tv-detail [data-act="lock"]'); await page.waitForTimeout(100);
check("lock: a tile's panel locks the piece",await page.evaluate(id=>!!(window.__meta.bag().find(b=>b.id===id)||{}).locked,tileId));
await page.keyboard.press('Escape'); await open(); await page.waitForTimeout(100);
const eqTarget=await page.evaluate(()=>{ const t=[...document.querySelectorAll('#tv-bag .bs-sets .tv-tile')].find(t=>{ const it=window.__meta.bag().find(b=>b.id===t.dataset.id); return it&&!it.locked&&it.slot==='amulet'; }); return t&&t.dataset.id; });
await page.click('#tv-bag .tv-tile[data-id="'+eqTarget+'"]'); await page.waitForTimeout(100); await page.click('#tv-detail [data-act="equip"]'); await page.waitForTimeout(150);
const eqd=await page.evaluate(id=>({ worn:(window.__dd.gear().amulet||{}).id===id, card:!!document.querySelector('#tv-bag .bs-eqrow .bs-eq[data-from="eq"][data-id="'+id+'"]') }),eqTarget);
check("equip from a tile: Equip puts it on, and its card takes the AMULET place in the band",eqd.worn&&eqd.card,JSON.stringify(eqd));
// ---- forge +1 from a worn card's panel
const fw=await page.evaluate(()=>{ const w=window.__dd.gear().weapon; return { id:w.id, used:window.__meta.forge.used(w) }; });
await page.click('#tv-bag .bs-eqrow .bs-eq[data-from="eq"][data-slot="weapon"]'); await page.waitForTimeout(100);
const selOn=await page.evaluate(()=>!!document.querySelector('#tv-bag .bs-eq.sel[data-slot="weapon"]')&&!!document.querySelector('#tv-detail #tv-forge'));
await page.click('#tv-detail #tv-forge [data-act="tvup"][data-n="1"]:not([disabled])'); await page.waitForTimeout(150);
const fw2=await page.evaluate(()=>{ const w=window.__dd.gear().weapon; return { used:window.__meta.forge.used(w), badge:(document.querySelector('#tv-bag .bs-eq[data-slot="weapon"] .bs-up')||{}).textContent||'' }; });
check("forge: a worn card opens its panel (the card lit as selected); +1 buys one, and the card's badge follows",selOn&&fw2.used===fw.used+1&&fw2.badge==='+'+fw2.used,JSON.stringify({fw,fw2,selOn}));
await page.keyboard.press('Escape');
// ---- the sixth card: Twotimer on, a 2nd sword in
const DW=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, D=window.__dualwield, N=window.__mythic; const ring=N.normalize({tier:'named',named:'twotimer',lvl:20}); M.giveItem(ring); M.equip(ring.id);
  let w=d.rollItem(3,'weapon',20); for(let q=0;q<40&&D.isPolearm(w);q++) w=d.rollItem(3,'weapon',20); M.giveItem(w); const before=window.__bagstyle.offState().kind; const ok=D.equip2(w.id); M.forge.upgrade(w.id,M.forge.keys(w)[0],1); return { id:w.id, ok, before }; });
await open(); await page.waitForTimeout(150); row=await eqRow();
const dw=row.find(c=>c.off);
check("Twotimer on, nothing in it yet: the sixth card was the open OFF-HAND slot",DW.before==='open-weapon',DW.before);
check("a 2nd sword in: the sixth card IS that sword (OFF-HAND, its +1), beside the weapon",DW.ok&&dw&&dw.off==='weapon2'&&dw.from==='wpn2'&&dw.id===DW.id&&dw.up==='+1'&&/OFF-HAND/.test(dw.text)&&row[1]===dw,JSON.stringify(dw));
await page.click('#bs-off'); await page.waitForTimeout(100);
const dp=await page.evaluate(()=>({ open:!document.getElementById('tv-detail').classList.contains('hide'), forge:!!document.querySelector('#tv-detail #tv-forge'), off:!!document.querySelector('#tv-detail [data-act="unequipw2"]'), tag:(document.querySelector('#tv-detail .dh .dm')||{}).textContent||'' }));
check("...a click opens its panel: the forge and Take off 2nd (the 2ND WEAPON tag)",dp.open&&dp.forge&&dp.off&&/2ND WEAPON/.test(dp.tag),JSON.stringify(dp));
await page.keyboard.press('Escape');
// ---- the sixth card: Beast Mode on, a 2nd pet in (the 2nd sword goes back to the bag by itself)
const PT=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, R=window.__tworings, N=window.__mythic; const ring=N.normalize({tier:'named',named:'beast_mode',lvl:20}); M.giveItem(ring); M.equip(ring.id);
  const f=d.rollItem(3,'familiar',20); M.giveItem(f); const ok=R.equip2(f.id); return { id:f.id, ok, w2:!!d.gear().weapon2 }; });
await open(); await page.waitForTimeout(150); row=await eqRow(); const pt=row.find(c=>c.off);
check("Beast Mode on, a 2nd pet in: the sixth card IS that pet (2ND PET), beside the familiar",PT.ok&&pt&&pt.off==='pet2'&&pt.from==='fam2'&&pt.id===PT.id&&/2ND PET/.test(pt.text)&&row[5]===pt,JSON.stringify({PT,pt}));
await page.click('#bs-off'); await page.waitForTimeout(100);
check("...a click opens its panel with Take off 2nd",await page.evaluate(()=>!document.getElementById('tv-detail').classList.contains('hide')&&!!document.querySelector('#tv-detail [data-act="unequip2"]')&&!!document.querySelector('#tv-detail #tv-forge')));
await page.keyboard.press('Escape');
// ---- a plain charm on again: the pet waits in its slot asleep (frozen game: the ring-off return runs on the next tick) -> faded with 💤, still clickable; then locked once it is back in the bag
await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; const c=d.rollItem(3,'charm',20); M.giveItem(c); M.equip(c.id); });
await open(); await page.waitForTimeout(150); row=await eqRow(); const zz=row.find(c=>c.off);
check("the ring off, the 2nd pet still filed: the sixth card shows it faded and asleep (💤)",zz&&zz.off==='pet2-asleep'&&/💤/.test(zz.text),JSON.stringify(zz));
await page.evaluate(()=>{ window.__freeze=false; const M=window.__meta; M.update(1/60); window.__freeze=true; }); await open(); await page.waitForTimeout(150); row=await eqRow();
check("...and once it has gone back to the bag, the slot is locked again",row.find(c=>c.off).off==='locked',JSON.stringify(row.find(c=>c.off)));
await open(); await page.waitForTimeout(100);
// ---- sell junk
const j0=await page.evaluate(()=>({ n:window.__meta.bag().filter(window.__meta.isJunk).length, bag:window.__meta.bag().length, g:window.__meta.gold() }));
await page.click('#tv-selljunk'); await page.waitForTimeout(100);
const j1=await page.evaluate(()=>({ n:window.__meta.bag().filter(window.__meta.isJunk).length, bag:window.__meta.bag().length, g:window.__meta.gold() }));
check("Sell junk (in the tab row) sells the junk for gold",j0.n>0&&j1.n===0&&j1.bag===j0.bag-j0.n&&j1.g>j0.g,JSON.stringify({j0,j1}));
// ---- sell all: two taps
const a0=await page.evaluate(()=>({ unlocked:window.__meta.bag().filter(b=>!b.locked).length, locked:window.__meta.bag().filter(b=>b.locked).length }));
await page.click('#tv-sellall'); await page.waitForTimeout(100);
const a1=await page.evaluate(()=>({ unlocked:window.__meta.bag().filter(b=>!b.locked).length, lbl:document.getElementById('tv-sellall').textContent, inTools:!!document.getElementById('tv-sellall').closest('#bs-tools') }));
check("Sell all: the first tap only arms it (Tap again...), nothing sold",a1.unlocked===a0.unlocked&&/Tap again/.test(a1.lbl)&&a1.inTools,JSON.stringify({a0,a1}));
await page.click('#tv-sellall'); await page.waitForTimeout(100);
const a2=await page.evaluate(()=>({ unlocked:window.__meta.bag().filter(b=>!b.locked).length, locked:window.__meta.bag().filter(b=>b.locked).length }));
check("...the second tap sells every unlocked piece; locked ones stay",a2.unlocked===0&&a2.locked===a0.locked&&a0.locked>0,JSON.stringify(a2));
// ---- the window's dress
const dress=await page.evaluate(()=>({ bs:document.getElementById('tavern').classList.contains('bs'), corners:document.querySelectorAll('#tv-box > .bs-cn').length, banners:document.querySelectorAll('#tv-box > .bs-ban').length, title:document.querySelector('.tv-title').textContent, lvlInHead:!!document.querySelector('.tv-head #tv-lv'), gold:!!document.querySelector('.tv-head #tv-goldn') }));
check("the window wears its frame: four carved corners, two banners, the plaque, level and gold in the head",dress.bs&&dress.corners===4&&dress.banners===2&&/THE TAVERN/.test(dress.title)&&dress.lvlInHead&&dress.gold,JSON.stringify(dress));
// ---- iPad landscape: nothing spills sideways
await page.setViewportSize({width:1180,height:820}); await page.waitForTimeout(200);
const ipad=await page.evaluate(()=>{ const b=document.getElementById('tv-box').getBoundingClientRect(), body=document.getElementById('tv-body'); const over=[...document.querySelectorAll('#tv-box .tv-tabs > *, #tv-box .bs-eq, #tv-box .bs-set')].filter(e=>{ const r=e.getBoundingClientRect(); return r.right>b.right+1||r.left<b.left-1; }).length;
  return { fits:b.width<=1180, over, hscroll:body.scrollWidth>body.clientWidth+1 }; });
check("iPad landscape (1180x820): the window fits, no tab, card or set column spills, no sideways scroll",ipad.fits&&ipad.over===0&&!ipad.hscroll,JSON.stringify(ipad));
await page.setViewportSize({width:1500,height:950});
// ---- BACK TO THE HALL
await open(); await page.click('#tv-defend'); await page.waitForTimeout(100);
check("BACK TO THE HALL closes the tavern",await page.evaluate(()=>!window.__tavern.isOpen()));
check("no page errors",errors.length===0,errors.slice(0,3).join(' | '));
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
await browser.close(); server.close(); process.exit(results.every(Boolean)?0:1);
