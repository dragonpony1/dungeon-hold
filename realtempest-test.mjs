// ===== THE TEMPEST (LIGHTNING) SET'S STAFF AND POLEARM ARE MATT'S OWN MODELS (86q-realtempest.js, build 281): Lightning Staff and Lightning Trident replace the code-built staff-tempest / polearm-tempest. The Witch holds the real staff, the Knight the
// real scythe (real GLBs, a handful of meshes), gripped where the frames say; a Tempest weapon dropping warms both files for the floor stand; the hideout's storm cards show his new icons.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8915);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8915/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__heroes&&window.__weapons&&window.__realtempest&&window.__meta&&window.__dd.heroModel(),null,{timeout:120000});
async function equipVoid(hero,re,slotLook,name){ await page.evaluate(i=>window.__heroes.select(i),hero); await page.waitForFunction(r=>new RegExp(r).test(window.__dd.heroModel().label),re,{timeout:90000});
  await page.evaluate(({look,name})=>{ const d=window.__dd, M=window.__meta; M.reset&&M.reset(); d.resetGear(); d.start(); d.step(1/60,10); const it=d.rollItem(4,"weapon",10); it.name=name; it.rarity=5; it.mythic=true; it.setId="storm"; it.look=look; it.stats=it.stats||{dmg:10}; M.giveItem(it); M.equip(it.id); },{look:slotLook,name});
  for(let i=0;i<400;i++){ const ok=await page.evaluate(()=>{ window.__dd.step(1/60,2); const m=window.__weapons.mounted(); return !!(m&&m.parent&&/^(staff|polearm)-tempest$/.test(m.name)&&window.__weapons.state().loaded.some(n=>/^(staff|polearm)-tempest$/.test(n))); }); if(ok) break; await sleep(60); }
  return page.evaluate(()=>{ const m=window.__weapons.mounted(), sd=m&&m.userData.sword; let meshes=0; m&&m.traverse(o=>{ if(o.isMesh&&!o.userData.isOL) meshes++; }); return { name:m&&m.name, meshes, grip:sd&&+((sd.gripY-(sd.tipY-sd.len))/sd.len).toFixed(2), tip:sd&&+sd.tipY.toFixed(2), void:!!(m&&m.userData.void) }; }); }
const s=await equipVoid("witch","Witch","staff","Mythic Staff of the Tempest");
check("the Witch holds the real Lightning Staff (staff-tempest, a handful of meshes, not the code-built forty-odd), gripped a third of the way up",s.name==="staff-tempest"&&s.meshes>=1&&s.meshes<12&&s.grip>.3&&s.grip<.42,JSON.stringify(s));
const p=await equipVoid("knight","Knight","polearm","Mythic Polearm of the Tempest");
check("the Knight holds the real Lightning Trident (polearm-tempest), gripped 30% of the way up",p.name==="polearm-tempest"&&p.meshes>=1&&p.meshes<12&&p.grip>.25&&p.grip<.36,JSON.stringify(p));
const w=await page.evaluate(async()=>{ const d=window.__dd, R=window.__realtempest; const before=R.warmed(); const it=d.rollItem(4,"weapon",10); it.name="Mythic Staff of the Tempest"; it.setId="storm"; it.rarity=5; it.mythic=true; d.dropLoot(it,20,20,true); const after=R.warmed(); const plain=d.rollItem(1,"weapon",2); plain.name="Rusty Sword"; d.dropLoot(plain,22,22,true);
  const a=await new Promise(r=>window.__weapons.model("staff-tempest",root=>r({proc:!!root.userData.proc}))), b=await new Promise(r=>window.__weapons.model("polearm-tempest",root=>r({proc:!!root.userData.proc}))); return { before, after, a, b }; });
check("a Tempest weapon dropping warms both models for the floor stand (and they are the real files, not the code-built ones)",w.after===true&&!w.a.proc&&!w.b.proc,JSON.stringify(w));
// the hideout's cards
await page.evaluate(()=>{ window.__dd.setHero(30,30); window.__hideout.open(); }); let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof SET_ART_DIR!=="undefined",null,{timeout:120000});
const h=await f.evaluate(async()=>{ const get=async n=>{ const r=await fetch(SET_ART_DIR+n); const b=await r.blob(); const im=new Image(); im.src=URL.createObjectURL(b); await im.decode(); return { status:r.status, w:im.naturalWidth, h:im.naturalHeight, size:b.size }; }; return { staff:await get("storm-staff.jpg"), polearm:await get("storm-polearm.jpg") }; });
check("the hideout's Tempest staff and polearm cards are the new framed icons (square, both load)",h.staff.status===200&&h.polearm.status===200&&h.staff.w===h.staff.h&&h.polearm.w===h.polearm.h&&h.staff.size>20000&&h.polearm.size>20000,JSON.stringify(h));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
