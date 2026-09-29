// ===== THE TAVERN IN PICTURES + THE FORGE ON THE TAVERN CARD (96f-tavernpics.js, build 292). Matt: "we could simplfy this page with pictures i bet" ... "the whole idea is to find a piece of gear you love
// then max it out with gold" ... "go, put the forge on the tavern card". Checked: skills are 8 picture tiles and + still spends; a worn Forest piece shows its stats as icon chips and its set as dots (3 Forest
// + Rootsplitter = 3 green + 1 pink); the named mythic's card says "any set"; tapping a worn piece opens its forge (a tile per stat) and +1 / +5 really buy upgrades with gold; a piece in the bag has a forge
// too, a shop piece does not; with no gold the buttons are off and it says how much more; nothing spills sideways on a phone.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8945,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
async function setup(vp){ const page=await (await browser.newContext({viewport:vp,hasTouch:vp.width<500,isMobile:vp.width<500})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("http://127.0.0.1:8945/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__sets&&window.__mythic&&window.__tavern&&window.__tavpics,null,{timeout:120000});
  const ids=await page.evaluate(()=>{ window.__freeze=true; const d=window.__dd, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} M.reset(); d.start(); d.step(1/60,3); const ids={};
    for(const s of ['armor','charm','amulet']){ const it=d.rollItem(1,s,2); it.rarity=2; it.name=it.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' of the Forest'; M.giveItem(it); ids[s]=it.id; }
    const rs=window.__mythic.normalize({tier:"named",named:"rootsplitter"}); M.giveItem(rs); ids.weapon=rs.id; for(const k of ['armor','charm','amulet','weapon']) M.equip(ids[k]);
    const b=d.rollItem(2,'weapon',3); M.giveItem(b); ids.bag=b.id; M.addXP(40000); window.__tavern.open(); return ids; });
  await page.waitForTimeout(300); return {page,ids}; }
const {page,ids}=await setup({width:1280,height:800});
const sk=await page.evaluate(()=>{ window.__tavern.tab('skills'); const t=[...document.querySelectorAll('#tv-skills .tv-sk')]; const m0=window.__meta.skill('mason'); document.querySelector('#tv-sk-mason [data-act=spend]').click();
  return { tiles:t.length, pics:t.filter(x=>x.querySelector('.sic')&&x.querySelector('.sic').textContent.trim()).length, m0, m1:window.__meta.skill('mason'), cv:document.querySelector('#tv-sk-mason .cv').textContent }; });
check("skills are 8 picture tiles, and + still spends a point (Mason 0 -> 1 shows +8%)",sk.tiles===8&&sk.pics===8&&sk.m1===sk.m0+1&&sk.cv==="+8%",JSON.stringify(sk));
const card=await page.evaluate(ids=>{ window.__tavern.tab('bag'); const c=document.querySelector('.tv-card[data-id="'+ids.armor+'"]'), r=document.querySelector('.tv-card[data-id="'+ids.weapon+'"]'); const it=window.__meta.forge.find(ids.armor);
  return { chips:c.querySelectorAll('.tvp-c').length, keys:Object.keys(it.stats).length, green:c.querySelectorAll('.tvp-set b.on').length, pink:c.querySelectorAll('.tvp-set b.wild').length, bar:!!c.querySelector('.tvp-up'), any:/any set/.test(r.textContent) }; },ids);
check("a worn Forest piece shows its stats as icon chips and its set as dots: 3 green + 1 pink (Rootsplitter filling a slot), with an upgrade bar",card.chips===card.keys&&card.green===3&&card.pink===1&&card.bar,JSON.stringify(card));
check("the named mythic's card says it counts as any set",card.any,JSON.stringify(card));
const fg=await page.evaluate(ids=>{ const M=window.__meta, F=M.forge; M.giveGold(5000); window.__tavern.tab('bag'); document.querySelector('.tv-card[data-id="'+ids.armor+'"]').click(); const it=F.find(ids.armor);
  const tiles=document.querySelectorAll('#tv-forge .tvf-t').length, keys=F.keys(it).length; const g0=M.gold(), u0=F.used(it), c0=F.cost(it);
  document.querySelector('#tv-forge [data-act="tvup"][data-n="1"]:not([disabled])').click(); const g1=M.gold(), u1=F.used(it);
  document.querySelector('#tv-forge [data-act="tvup"][data-n="5"]:not([disabled])').click(); const u2=F.used(it);
  return { tiles, keys, g0, g1, c0, u0, u1, u2, bar:document.querySelector('#tv-forge .tvf-top').textContent }; },ids);
check("tapping a worn piece opens its forge, a tile per stat; +1 buys one upgrade for its gold cost and +5 buys five",fg.tiles===fg.keys&&fg.u1===fg.u0+1&&fg.g0-fg.g1===fg.c0&&fg.u2===fg.u1+5&&/6\//.test(fg.bar),JSON.stringify(fg));
const bs=await page.evaluate(ids=>{ const T=window.__tavern; T.select(ids.bag,'bag'); const bag=!!document.getElementById('tv-forge'); T.tab('shop'); const c=document.querySelector('#tv-shop .tv-card'); if(c) c.click(); const shop=!!document.getElementById('tv-forge'); return { bag, shopCard:!!c, shop }; },ids);
check("a piece in the bag has a forge too; a shop piece does not",bs.bag&&bs.shopCard&&!bs.shop,JSON.stringify(bs));
const ng=await page.evaluate(ids=>{ const M=window.__meta; M.giveGold(-M.gold()); window.__tavern.tab('bag'); window.__tavern.select(ids.armor,'eq'); const b=[...document.querySelectorAll('#tv-forge [data-act="tvup"]')];
  return { gold:M.gold(), n:b.length, off:b.every(x=>x.disabled), more:/more gold/.test(document.getElementById('tv-forge').textContent) }; },ids);
check("with no gold the forge buttons are off and it says how much more gold the next one needs",ng.gold===0&&ng.n>0&&ng.off&&ng.more,JSON.stringify(ng));
const {page:ph,ids:pid}=await setup({width:390,height:844});
const po=await ph.evaluate(ids=>{ const T=window.__tavern; T.select(ids.armor,'eq'); const a=document.documentElement.scrollWidth>innerWidth+1; T.tab('skills'); const b=document.documentElement.scrollWidth>innerWidth+1;
  const wide=[...document.querySelectorAll('#tavern *')].filter(e=>{ const r=e.getBoundingClientRect(); return r.width>0&&r.right>innerWidth+1; }).length; return { a, b, wide }; },pid);
check("on a phone nothing spills sideways (bag + forge, and the skills tiles)",!po.a&&!po.b&&po.wide===0,JSON.stringify(po));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
