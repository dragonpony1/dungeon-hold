// ===== THE LEVEL GATE, CALMER (build 314). Matt: "the pop up tool that says level 7 required, i dont understand it and it just keeps coming up" and "add to dev hud change chatcter level".
// Checked on map two (the gate is on there): a better piece you are too low to wear lands with its lock on the loot card (no "E equip now"), and E then does nothing to it -- no LEVEL card; trying to
// wear it by hand shows the picture card once for that piece, then only the one-line toast; the dev panel's character level sets, steps up and down, and a high enough level wears the piece.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8970,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1100,height:700}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8970/?silent&map=1",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__meta.reqFor&&window.__feel&&window.__lesson&&window.__devpanel,null,{timeout:120000});
const a=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} M.reset(); d.resetGear(); d.start(); d.step(1/60,3); if(window.__lesson.on()) window.__lesson.close();
  const roll=(r,s,l)=>{ let it; for(let i=0;i<80;i++){ it=d.rollItem(r,s,l); if(!/ of the (Forest|Void)$/.test(it.name||"")&&!it.named&&!it.mythic) break; } it.rarity=r; it.req=M.reqFor(it); return it; };
  const old=roll(0,"weapon",1); old.score=1; M.giveItem(old); const wore=M.equip(old.id);
  const leg=roll(4,"weapon",12); leg.score=9999; window.__legId=leg.id;
  d.dropLoot(leg,d.hero.x,d.hero.z,true); d.step(1/60,30); const card=window.__feel.card();
  window.dispatchEvent(new KeyboardEvent("keydown",{code:"KeyE",bubbles:true})); d.step(1/60,2);
  return { map:d.map().id, lvl:M.level(), req:leg.req, wore, card:card&&{canEquip:card.canEquip,outcome:card.outcome,lock:/🔒/.test(card.html)&&new RegExp('Lv '+leg.req).test(card.html),offersE:/equip now/.test(card.html)}, lessonAfterE:window.__lesson.on(), weapon:d.gear().weapon&&d.gear().weapon.id===old.id }; });
check("a better piece you are too low to wear lands with its lock on the loot card (Lv shown, no \"E equip now\"), and pressing E brings no LEVEL card and changes nothing",a.map!=="hall"&&a.req>a.lvl&&a.wore&&a.card&&a.card.outcome==="bagged"&&!a.card.canEquip&&a.card.lock&&!a.card.offersE&&!a.lessonAfterE&&a.weapon,JSON.stringify(a));
const b=await page.evaluate(()=>{ const M=window.__meta; const id=window.__legId;
  const e1=M.equip(id); const on1=window.__lesson.on(); const txt=(document.getElementById("lesson")||{}).textContent||""; window.__lesson.close();
  const e2=M.equip(id); const on2=window.__lesson.on(); window.__lesson.close(); return { e1, on1, pics:/LEVEL [0-9]+ GEAR/.test(txt)&&/You · Lv/.test(txt)&&/Waits in your bag/.test(txt), e2, on2, seen:M.lvlCardSeen() }; });
check("trying to wear it by hand shows the picture card once (you, its level, kills, your bag), and a second try only gets the one-line toast",b.e1===false&&b.on1&&b.pics&&b.e2===false&&!b.on2&&b.seen===1,JSON.stringify(b));
const c=await page.evaluate(()=>{ const M=window.__meta, $=id=>document.getElementById(id); window.__heroes.select("fighter"); /* the flat skills: the Witch (336) and the Knight (395) spend on talent trees now */ window.__devpanel.toggle(true); const shown=$("dp-lv").value==String(M.level());
  $("dp-lv").value="8"; $("dp-lv-go").click(); const set=M.level(); $("dp-lv-up").click(); const up=M.level(); $("dp-lv-dn").click(); $("dp-lv-dn").click(); const dn=M.level();
  $("dp-lv").value="10"; $("dp-lv-go").click(); const inBag=!!M.bag().find(b=>b.id===window.__legId), legReq=(M.bag().find(b=>b.id===window.__legId)||{}).req, lvAt=M.level(); const wear=M.equip(window.__legId); M.setLevel(6); M.spend("mason"); M.spend("mason"); const spent=M.spentPoints(); M.setLevel(2); const refunded=M.spentPoints(), pts=M.points(); window.__devpanel.toggle(false);
  return { shown, set, up, dn, wear, inBag, legReq, lvAt, spent, refunded, pts }; });
check("the dev panel's character level: Set to 8, +1 makes 9, -1 twice makes 7, and set to 10 it wears the piece; dropping below the points already spent hands them back",c.shown&&c.set===8&&c.up===9&&c.dn===7&&c.wear===true&&c.spent===2&&c.refunded===0&&c.pts===1,JSON.stringify(c));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
