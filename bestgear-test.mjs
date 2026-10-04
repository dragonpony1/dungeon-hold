// ===== BEST GEAR AT A GLANCE (96h-bestgear.js, build 315). Matt: "when i look in the bag there needs to be a very easy and quick way for me to tell if iam wearing the best gear or whats beter".
// Checked on map two (the level gate is on): in the tavern bag a better piece you can wear glows green with a ▲, a better piece above your level is amber with 🔒, a worse one is dimmed; the worn
// weapon shows ▲ (the bag beats it), the worn armor ✓ (nothing beats it), the empty charm slot ▲ (a charm waits in the bag); the headline says 2 UPGRADES; wearing them turns it to ✓ YOUR BEST GEAR
// IS ON; the Tab sheet's bag grid carries the same badges.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8971,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_bagcols_v1","1"); localStorage.setItem("ddBagSort","type");   /* build 441: these check the card grid (now the "by type" sort; the bag opens on columns) */ }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8971/?silent&ownweapons&map=1",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__meta.setLevel&&window.__tavern&&window.__best&&window.__doll,null,{timeout:120000});
const a=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} M.reset(); d.resetGear(); M.setLevel(5);
  const roll=(r,s,l)=>{ let it; for(let i=0;i<80;i++){ it=d.rollItem(r,s,l); if(!/ of the (Forest|Void)$/.test(it.name||"")&&!it.named&&!it.mythic) break; } it.rarity=r; it.req=M.reqFor(it); return it; };
  const worn=roll(1,"weapon",3); let better; for(let i=0;i<40;i++){ better=roll(2,"weapon",6); if(better.score>worn.score&&better.req<=5) break; }
  let worse; for(let i=0;i<60;i++){ worse=roll(0,"weapon",1); if(worse.score<worn.score) break; } const locked=roll(4,"weapon",20);
  const armor=roll(1,"armor",3), charm=roll(1,"charm",3);
  for(const it of [worn,armor]){ M.giveItem(it); M.equip(it.id); } for(const it of [better,worse,locked,charm]) M.giveItem(it);
  window.__ids={better:better.id,worse:worse.id,locked:locked.id,charm:charm.id};
  window.__tavern.open(); window.__tavern.tab("bag");
  const card=(id,from)=>document.querySelector('#tv-bag .tv-card[data-id="'+id+'"][data-from="'+from+'"]'); const info=el=>el?{cls:[...el.classList].filter(c=>/^bg-/.test(c)),b:(el.querySelector(".bg-b")||{}).textContent||""}:null;
  const empty=document.querySelector('#tv-bag .tv-card[data-from="eq"][data-slot="charm"]');
  return { scores:{worn:worn.score,better:better.score,worse:worse.score,locked:locked.score,lockedReq:locked.req}, better:info(card(better.id,"bag")), worse:info(card(worse.id,"bag")), locked:info(card(locked.id,"bag")), charm:info(card(charm.id,"bag")),
    wornW:info(card(worn.id,"eq")), wornA:info(card(armor.id,"eq")), emptyCharm:info(empty), head:(document.querySelector("#tv-bag .bg-head")||{}).textContent||"" }; });
check("a better piece you can wear glows green with ▲; one above your level is amber with 🔒; a worse one is dimmed",a.better&&a.better.cls.includes("bg-up")&&a.better.b==="▲"&&a.locked&&a.locked.cls.includes("bg-warn")&&a.locked.b==="🔒"&&a.worse&&a.worse.cls.includes("bg-dn")&&!a.worse.b,JSON.stringify(a));
check("worn pieces: the weapon shows ▲ (the bag beats it), the armor ✓ (nothing beats it); the empty charm slot shows ▲ (a charm waits)",a.wornW&&a.wornW.cls.includes("bg-up")&&a.wornW.b==="▲"&&a.wornA&&a.wornA.cls.includes("bg-ok")&&a.wornA.b==="✓"&&a.emptyCharm&&a.emptyCharm.cls.includes("bg-up"),JSON.stringify({w:a.wornW,a:a.wornA,e:a.emptyCharm}));
check("the headline over the worn column says ▲ 2 UPGRADES",/▲\s*2 UPGRADES$/.test(a.head),a.head);
const b=await page.evaluate(async()=>{ const M=window.__meta, I=window.__ids; M.equip(I.better); M.equip(I.charm); window.__tavern.tab("bag"); window.__tavern.close(); window.__tavern.open(); window.__tavern.tab("bag"); await new Promise(r=>setTimeout(r,100));
  const head=(document.querySelector("#tv-bag .bg-head")||{}).textContent||""; const oks=document.querySelectorAll('#tv-bag .tv-card[data-from="eq"].bg-ok').length; window.__tavern.close(); return { head, oks }; });
check("wearing them turns the headline to ✓ BEST GEAR ON, every worn piece ✓ (the locked one does not count against you)",/✓\s*BEST GEAR ON$/.test(b.head)&&b.oks===3,JSON.stringify(b));
const c=await page.evaluate(async()=>{ const M=window.__meta, d=window.__dd; d.start(); d.step(1/60,3); const up=d.rollItem(3,"armor",8); up.rarity=3; up.req=M.reqFor(up); up.score=9e5; M.giveItem(up); window.dispatchEvent(new KeyboardEvent("keydown",{code:"Tab",key:"Tab",bubbles:true})); await new Promise(r=>setTimeout(r,300));
  const html=window.__doll.html(); const open=window.__doll.isOpen(); window.dispatchEvent(new KeyboardEvent("keydown",{code:"Tab",key:"Tab",bubbles:true})); await new Promise(r=>setTimeout(r,200));
  return { open, ups:(html.match(/inv-c has[^"]*bg-up/g)||[]).length, warns:(html.match(/inv-c has[^"]*bg-warn/g)||[]).length, dns:(html.match(/inv-c has[^"]*bg-dn/g)||[]).length }; });
check("the Tab sheet's bag grid carries the same badges (the new armor ▲, the locked weapon amber, the old weapon dimmed)",c.open&&c.ups===1&&c.warns===1&&c.dns>=1,JSON.stringify(c));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
