// ===== THE CHARACTER SHEET, build 141 (68-paperdoll.js): "make this gui fill the screen cuz it's so small to read ... give me 4
// loadout buttons ... maybe a picture of the armor set ... mostly I need to see my sets and their bonuses a little better".
// Here: the sheet fills the window with larger type; a full-width sets band shows each set with its armor picture, a pip per
// slot (worn / in the bag / not found) and both bonuses lit as they apply; four loadout cards save what you wear and put it
// back on from the bag or the armory, report pieces that are gone, persist across a reload, and show the set's picture.
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path"; import fs from "fs";
const SP=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/,"")); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8934, BASE="http://127.0.0.1:"+PORT; const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const ctx=await browser.newContext({viewport:{width:1600,height:900}}); const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto(BASE+"/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__doll&&window.__sets&&window.__forest,null,{timeout:60000});
await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); });
// a Forest kit: three pieces worn, one in the bag, one in the armory
const kit=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; const P=window.__meta.packs.get('of the Forest'); const out={};
  for(const s of ['weapon','armor','charm','amulet','familiar']){ const it=d.rollItem(1,s,2); it.rarity=1; it.name=it.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' of the Forest'; M.giveItem(it); out[s]=it.id; }
  M.equip(out.weapon); M.equip(out.armor); M.equip(out.charm); if(M.stash) M.stash(out.familiar); return out; });
await page.evaluate(()=>{ window.__doll.open(); }); await page.waitForTimeout(400);
const goldLine=await page.evaluate(()=>{ const el=document.querySelector('#doll .dl-gold'); return {text:el&&el.textContent,gold:window.__meta.gold(),shown:!!el&&getComputedStyle(el).display!=='none'}; });
check("the sheet's header shows the player's gold and level (build 150: 'no way to see how much gold you have' on the full-screen sheet)",goldLine.shown&&new RegExp('● '+Math.round(goldLine.gold).toLocaleString('en-US')+' gold · level \\d+').test(goldLine.text||''),JSON.stringify(goldLine));
const look=await page.evaluate(()=>{ const box=document.querySelector('#doll .dl-box'), r=box.getBoundingClientRect(), fs=parseFloat(getComputedStyle(box).fontSize), nm=document.querySelector('#doll .dl-slot .nm'); return {w:Math.round(r.width),h:Math.round(r.height),vw:innerWidth,vh:innerHeight,fs,nmFs:nm?parseFloat(getComputedStyle(nm).fontSize):0}; });
check("the sheet fills the window (within 16 px each way) and its type is larger: 14 px or more base, item names 15 px or more (was 12 and 13)",look.w>=look.vw-20&&look.h>=look.vh-20&&look.fs>=14&&look.nmFs>=15,JSON.stringify(look));
const band=await page.evaluate(()=>{ const cards=[...document.querySelectorAll('#doll .dl-setband .sr')]; return cards.map(c=>({text:c.querySelector('.sn').textContent,img:(c.querySelector('.sp img')||{}).getAttribute?c.querySelector('.sp img').getAttribute('src'):null,worn:c.querySelectorAll('.spips .worn').length,bag:c.querySelectorAll('.spips .bag').length,lit:c.querySelectorAll('.sb.lit').length,on:c.classList.contains('on'),mid:!!c.closest('.dl-col.mid')})); });
const forest=band.find(b=>/Forest/.test(b.text)), voidc=band.find(b=>/Void/.test(b.text));
const fold=await page.evaluate(()=>{ const b=document.querySelector("#doll .dl-setband"), r=b.getBoundingClientRect(), box=document.querySelector("#doll .dl-box").getBoundingClientRect(); return {top:Math.round(r.top),bottom:Math.round(r.bottom),boxBottom:Math.round(box.bottom),scroll:document.querySelector("#doll .dl-box").scrollTop}; });
check("the sets band sits in the middle column, under the loadouts, and is fully visible without scrolling on a 1600x900 screen",fold.scroll===0&&fold.bottom<=fold.boxBottom,JSON.stringify(fold));
check("the sets band (middle column, under the hero) has a card per set -- ten since build 167, the nine not found yet as tiles -- each with a picture of its armor",band.length===10&&band.every(b=>b.mid)&&forest&&forest.img==='assets/set-forest.png'&&voidc&&voidc.img==='assets/set-void.png'&&band.filter(b=>/not found yet/.test(b.text)).length===9,JSON.stringify(band));
check("the Forest card reads 3/5 with three pips worn, two 'in bag' (the bag and the armory count), the three-piece bonus lit and the five-piece not",forest&&/of the Forest 3\/5/.test(forest.text)&&forest.worn===3&&forest.bag===2&&forest.lit===1&&forest.on,JSON.stringify(forest));
check("the set pictures ship with the dist",["set-forest.png","set-void.png"].every(f=>fs.existsSync(DIST+"/assets/"+f)&&fs.statSync(DIST+"/assets/"+f).size>20000));
const imgOk=await page.evaluate(async()=>{ const im=[...document.querySelectorAll('#doll .sp img')]; await Promise.all(im.map(i=>i.complete?0:new Promise(r=>{ i.onload=i.onerror=r; }))); return im.map(i=>i.naturalWidth); });
check("...and they load in the page (all ten)",imgOk.length===10&&imgOk.every(w=>w>=100),JSON.stringify(imgOk));
const tile=await page.evaluate(()=>{ const t=[...document.querySelectorAll("#doll .dl-zero .sr.zero")].find(x=>/Chaos/.test(x.textContent)); if(!t) return null; const before=getComputedStyle(t.querySelector(".sz")).display; t.click(); const t2=[...document.querySelectorAll("#doll .dl-zero .sr.zero")].find(x=>/Chaos/.test(x.textContent)); return {before,open:t2.classList.contains("open"),after:getComputedStyle(t2.querySelector(".sz")).display,text:t2.querySelector(".sz").textContent.slice(0,40)}; });
check("a tile for a set not found yet opens on a tap to show its bonuses",!!tile&&tile.before==="none"&&tile.open&&tile.after==="block"&&/3/.test(tile.text),JSON.stringify(tile));
// loadouts: four empty cards; SAVE keeps the worn kit
const ld0=await page.evaluate(()=>({cards:document.querySelectorAll('#doll .dl-loads .ld').length,empty:document.querySelectorAll('#doll .dl-loads .ld.empty').length,inMid:!!document.querySelector('#doll .dl-col.mid .dl-loads')}));
check("four loadout cards sit in the middle column under the hero, all empty at first",ld0.cards===4&&ld0.empty===4&&ld0.inMid,JSON.stringify(ld0));
await page.click('#doll .dl-loads .ld:nth-child(1) [data-act="ldsave"]'); await page.waitForTimeout(300);
const s1=await page.evaluate(()=>({ld:window.__doll.loadouts()[0],stored:JSON.parse(localStorage.getItem('dd_loadouts'))[0],card:document.querySelector('#doll .dl-loads .ld:nth-child(1)').outerHTML}));
check("SAVE on loadout 1 keeps the three worn pieces (in localStorage dd_loadouts) and the card shows WORN",!!s1.ld&&Object.keys(s1.ld.ids).length===3&&s1.ld.ids.weapon===kit.weapon&&!!s1.stored&&/WORN/.test(s1.card)&&/ld cur/.test(s1.card),JSON.stringify({ids:s1.ld&&s1.ld.ids}));
// a second kit: the bag piece and the armory piece on, plus two ordinary pieces -> five Forest? no: amulet + familiar Forest, weapon/armor/charm ordinary
const kit2=await page.evaluate(k=>{ const d=window.__dd, M=window.__meta; M.unstash&&M.unstash(k.familiar); M.equip(k.amulet); M.equip(k.familiar); const w=d.rollItem(2,'weapon',3), a=d.rollItem(2,'armor',3); M.giveItem(w); M.giveItem(a); M.equip(w.id); M.equip(a.id); return {w:w.id,a:a.id}; },kit);
await page.waitForTimeout(300);
const f5=await page.evaluate(()=>{ const c=[...document.querySelectorAll('#doll .dl-setband .sr')].find(x=>/Forest/.test(x.textContent)); return {text:c.querySelector('.sn').textContent,lit:c.querySelectorAll('.sb.lit').length}; });
check("the band follows the gear live: with the weapon and armor swapped out the Forest card reads 3/5 again (charm, amulet, familiar)",/3\/5/.test(f5.text)&&f5.lit===1,JSON.stringify(f5));
await page.click('#doll .dl-loads .ld:nth-child(2) [data-act="ldsave"]'); await page.waitForTimeout(200);
// loadout 1 again: the saved weapon/armor come back from the bag; the charm is still worn; amulet and familiar stay as they are (loadout 1 never had them)
await page.click('#doll .dl-loads .ld:nth-child(1) [data-act="ldwear"]'); await page.waitForTimeout(300);
const w1=await page.evaluate(k=>{ const g=window.__dd.gear(); return {weapon:g.weapon&&g.weapon.id===k.weapon,armor:g.armor&&g.armor.id===k.armor,charm:g.charm&&g.charm.id===k.charm,amulet:g.amulet&&g.amulet.id===k.amulet,count:window.__sets.counts()['of the Forest']}; },kit);
check("WEAR on loadout 1 puts its weapon and armor back on from the bag (the Forest set is 5/5 now with the amulet and familiar still on)",w1.weapon&&w1.armor&&w1.charm&&w1.amulet&&w1.count===5,JSON.stringify(w1));
const pic1=await page.evaluate(()=>{ const c=document.querySelector('#doll .dl-loads .ld:nth-child(2)'); return {name:c.querySelector('.ld-nm').textContent,img:(c.querySelector('.ld-pic img')||{}).src||null,cur:c.classList.contains('cur')}; });
check("loadout 2 (three Forest pieces) is named for its set and shows the set's armor picture",/Forest set/i.test(pic1.name)&&/assets\/set-forest\.png$/.test(pic1.img||'')&&!pic1.cur,JSON.stringify(pic1));
// "I am wanting to see the sets so I can see the buff": each card names the bonus it brings, and pointing at one previews it
await page.click('#doll .dl-loads .ld:nth-child(3) [data-act="ldsave"]'); await page.waitForTimeout(250);   /* all five Forest pieces are worn right now */
const buffs=await page.evaluate(()=>[...document.querySelectorAll('#doll .dl-loads .ld[data-ld]')].map(c=>({buff:c.querySelector('.ld-buff').textContent,title:c.querySelector('.ld-buff').title})));
check("each saved loadout card names the set bonus it brings: loadout 3 (all five Forest) reads 5/5 · TWIN SHOT with the whole bonus on hover, loadouts 1 and 2 (three each) read 3/5 with their stats",buffs.length===3&&/5\/5 · TWIN SHOT/.test(buffs[2].buff)&&/TWIN SHOT: your familiar/.test(buffs[2].title)&&/3\/5 · \+8% health/.test(buffs[0].buff)&&/3\/5 · \+8% health/.test(buffs[1].buff),JSON.stringify(buffs));
await page.evaluate(k=>{ window.__meta.unequip('amulet'); window.__meta.unequip('familiar'); },kit); await page.waitForTimeout(300);
await page.hover('#doll .dl-loads .ld:nth-child(3) .ld-pic'); await page.waitForTimeout(350);
const pv=await page.evaluate(()=>{ const b=document.querySelector('#doll .dl-setband'), f=[...b.querySelectorAll('.sr')].find(x=>/Forest/.test(x.textContent)); return {prev:b.classList.contains('prev'),head:b.querySelector('.pl').textContent,forest:f.querySelector('.sn').textContent,lit:f.querySelectorAll('.sb.lit').length,inIt:f.querySelectorAll('.spips .worn').length,worn:window.__sets.counts()['of the Forest']}; });
check("pointing at loadout 3 turns the sets band into its preview: 'loadout 3 would give', Forest 5/5 with both bonuses lit, while only three pieces are worn",pv.prev&&/loadout 3 would give/.test(pv.head)&&/5\/5/.test(pv.forest)&&pv.lit===2&&pv.inIt===5&&pv.worn===3,JSON.stringify(pv));
await page.mouse.move(5,5); await page.waitForTimeout(350);
const back=await page.evaluate(()=>{ const b=document.querySelector('#doll .dl-setband'); return {prev:b.classList.contains('prev'),forest:[...b.querySelectorAll('.sr')].find(x=>/Forest/.test(x.textContent)).querySelector('.sn').textContent}; });
check("...and moving off it shows what is worn again (3/5)",!back.prev&&/3\/5/.test(back.forest),JSON.stringify(back));
await page.evaluate(k=>{ window.__meta.equip(k.amulet); window.__meta.equip(k.familiar); },kit);
// pull from the armory, and report a piece that is gone
const w2=await page.evaluate(k=>{ const M=window.__meta; M.unequip('weapon'); M.unequip('armor'); if(M.stash) M.stash(k.w); const sold=M.sell(k.a); const toasts=[]; const pt=window.toast; return {stashed:(M.armory?M.armory():[]).some(x=>x.id===k.w),sold:!!sold}; },kit2);
const t2=await page.evaluate(async()=>{ const seen=[]; const el=document.getElementById('toast'); window.__doll.wearLoadout(1); await new Promise(r=>setTimeout(r,120)); return {weapon:window.__dd.gear().weapon&&window.__dd.gear().weapon.id,armor:window.__dd.gear().armor&&window.__dd.gear().armor.id,toast:el?el.textContent:''}; });
check("WEAR on loadout 2 takes its weapon out of the armory, and says its armor is gone (it was sold)",w2.stashed&&w2.sold&&t2.weapon===kit2.w&&t2.armor!==kit2.a&&/1 gone/.test(t2.toast),JSON.stringify({w2,t2}));
// SAVE over a filled loadout asks once first
await page.click('#doll .dl-loads .ld:nth-child(1) [data-act="ldsave"]'); await page.waitForTimeout(150);
const arm=await page.evaluate(()=>({btn:document.querySelector('#doll .dl-loads .ld:nth-child(1) [data-act="ldsave"]').textContent,same:window.__doll.loadouts()[0].ids}));
check("SAVE on a filled loadout asks first (REPLACE?) and changes nothing until the second click",arm.btn==='REPLACE?'&&arm.same.weapon===kit.weapon,JSON.stringify(arm));
await page.click('#doll .dl-loads .ld:nth-child(1) [data-act="ldsave"]'); await page.waitForTimeout(150);
const replaced=await page.evaluate(()=>window.__doll.loadouts()[0].ids);
check("...and the second click replaces it with what is worn now",replaced.weapon===kit2.w,JSON.stringify(replaced));
// persistence
await page.reload({timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__doll,null,{timeout:60000});
const after=await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); window.__doll.open(); return new Promise(r=>setTimeout(()=>r({saved:window.__doll.loadouts().filter(Boolean).length,cards:document.querySelectorAll('#doll .dl-loads .ld:not(.empty)').length}),400)); });
check("the loadouts survive a reload",after.saved===3&&after.cards===3,JSON.stringify(after));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
try{ await page.screenshot({path:SP+"/parts/shots/sheet-141.png",timeout:60000}); console.log("screenshot saved"); }catch(e){ console.log("screenshot skipped: "+String(e).slice(0,80)); }
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
