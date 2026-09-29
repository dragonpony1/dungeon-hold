// ===== GABRIEL'S CHARM (97e-gabriel.js, build 266): Matt's Silver Blitz Charm, the named mythic charm. Checked: the table piece, the BLITZ (defenses fire 50% faster for 6 s, twice a wave: at the horn and when the last mob has been
// sent), nothing without the charm on, and the hideout side (entry, card art, 3D model, the trinket proc can roll it).
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8905);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8905/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__mythic&&window.__gabriel&&window.__meta&&window.__hideout,null,{timeout:120000});
const r0=await page.evaluate(()=>{ const it=window.__mythic.normalize({tier:"named",named:"gabriels_charm"}); return { it:it&&{name:it.name,slot:it.slot,named:it.named,rarity:it.rarity,stats:it.stats,power:it.power}, byName:window.__mythic.id({name:"Gabriel's Charm",slot:"charm"}) }; });
check("the named table has Gabriel's Charm: a charm, its stats, its power in words, found by its name too",r0.it&&r0.it.name==="Gabriel's Charm"&&r0.it.slot==="charm"&&r0.it.rarity===5&&r0.it.stats.trate===22&&/BLITZ/.test(r0.it.power)&&r0.byName==="gabriels_charm",JSON.stringify(r0));
const r1=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, G=window.__gabriel; try{ window.__trainer.skip(); }catch(e){} M.reset&&M.reset(); d.resetGear(); d.start(); d.step(1/60,20); for(const e of d.enemies) d.kill(e); d.setHero(6,10,Math.PI); d.addMana(500); d.step(1/60,5);
  const def=d.place("harpoon",16,13,Math.PI); d.step(1/60,5); const out={}; out.base=G.cd(def);   // no charm: a horn does nothing extra
  d.startWave(); d.step(1/60,10); out.noCharmFired=G.fired(); out.noCharmCd=G.cd(def);
  return out; });
check("without the charm the horn blitzes nothing (the ballista's cooldown is the plain one)",r1.noCharmFired===0&&Math.abs(r1.noCharmCd-r1.base)<1e-9,JSON.stringify(r1));
const r2=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, G=window.__gabriel; for(const e of d.enemies) d.kill(e); d.step(1/60,600); const def=d.defs[0]; G.reset();
  const it=window.__mythic.normalize({tier:"named",named:"gabriels_charm"}); M.giveItem(it); const eq=M.equip(it.id); const has=window.__mythic.has("gabriels_charm"); const base=G.cd(def);
  d.startWave(); d.step(1/60,3); const out={ eq, has, phase:d.S.phase, base, t1:+G.blitz().toFixed(2), fired1:G.fired(), cd1:G.cd(def), ratio:+(base/G.cd(def)).toFixed(3) };
  d.step(1/60,60*7); out.t2=+G.blitz().toFixed(2); out.cd2=G.cd(def); return out; });
check("wearing it, the horn starts a BLITZ: 6 seconds in which the ballista's cooldown is a third shorter (50% faster), then it is back to normal",r2.eq&&r2.has&&r2.phase==="wave"&&r2.fired1===1&&r2.t1>5&&r2.t1<=6&&Math.abs(r2.ratio-1.5)<.01&&r2.t2===0&&Math.abs(r2.cd2-r2.base)<1e-9,JSON.stringify(r2));
const r3=await page.evaluate(()=>{ const d=window.__dd, G=window.__gabriel; let guard=0; while(d.S.phase==="wave"&&guard++<400){ d.step(1/60,20); for(const e of d.enemies) if(!e.dead) d.kill(e); } return { fired:G.fired(), phase:d.S.phase, guard }; });
check("by the time the wave is over it has blitzed twice: at the horn and when the last mob was sent",r3.fired===2&&r3.phase==="build",JSON.stringify(r3));
// the hideout side
await page.evaluate(()=>{ window.__dd.setHero(30,30); window.__hideout.open(); }); let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof namedRecord==="function"&&typeof NAMED_MYTHICS!=="undefined"&&typeof pieceFromForged==="function",null,{timeout:120000});
const h=await f.evaluate(async()=>{ const N=NAMED_MYTHICS.gabriels_charm; let rec=null; for(let i=0;i<300&&!rec;i++){ const r=namedRecord("trinket"); if(r.named==="gabriels_charm") rec=r; }
  const piece=rec?pieceFromForged(rec):null; const art=N?await fetch(N.art).then(r=>r.status):0, glb=await fetch(NAMED_3D_DIR+"gabriels_charm.glb.txt").then(r=>r.status);
  return { entry:!!N&&N.name==="Gabriel's Charm"&&N.type==="trinket"&&N.stats.trate===22, has3d:NAMED_3D.has("gabriels_charm"), rolled:!!rec, procd:rec&&rec.procd, slot:rec&&rec.slot, named3d:piece&&piece.named3d, pname:piece&&piece.name, art, glb, build:HIDEOUT_BUILD }; });
check("the hideout knows it: a trinket entry, its card art and 3D model load, the forge's trinket proc can roll it (a charm-slot piece, proc'd) and a rolled piece shows the model",h.entry&&h.has3d&&h.rolled&&h.procd&&h.slot==="charm"&&h.named3d==="gabriels_charm"&&h.pname==="Gabriel's Charm"&&h.art===200&&h.glb===200&&h.build>=57,JSON.stringify(h));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
