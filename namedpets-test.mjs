import { chromium } from "playwright"; import { serve } from "./serve.mjs";
// build 215: a named pet (Bramblewhisk, Old Lamplight) wears its own real body instead of the Wisp's it used to borrow, and the Wisp's own
// look -- its Celestial Projectile and impact burst -- stays on the Wisp itself
const server=await serve(8872);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];
async function pet(which){ const ctx=await browser.newContext(); const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("http://127.0.0.1:8872/?silent&nogate"); await page.waitForFunction(()=>window.__dd&&window.__familiar&&window.__wispburst&&window.__mythic,null,{timeout:60000});
  await page.evaluate(which=>{ const d=window.__dd; d.start(); d.step(1/60,20);
    const it=which==="wisp"?window.__mythic.normalize({slot:"familiar",name:"Wisp of the Void",setId:"void",rarity:5,lvl:20,stats:{fdmg:30,frate:40}}):window.__mythic.normalize({tier:"named",named:which});
    window.__meta.giveItem(it); window.__meta.equip(it.id); d.step(1/60,10); },which);
  // its body (and, for the Wisp, its projectile + burst) arrive over the network: give them a moment
  for(let i=0;i<120;i++){ await page.evaluate(()=>window.__dd.step(1/60,3)); await page.waitForTimeout(100); const ok=await page.evaluate(w=>{ const g=window.__familiar.model(); return !!g&&(w==="wisp"?(window.__wispburst.loaded()&&g.userData.glb):g.userData.named===w); },which); if(ok&&i>10) break; }
  const r=await page.evaluate(()=>{ const d=window.__dd; const g=window.__familiar.model(); const body={kind:g&&g.userData.kind,named:(g&&g.userData.named)||null};
    d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0; d.setHero(0,5,0); d.step(1/60,5);
    const e=d.spawn("goblin","N"); e.x=0; e.z=9; e.y=0; e.hp=e.max=9999; e.dmg=0; e.atk=999; e.holdT=1e9; d.step(1/60,2);
    for(let i=0;i<400;i++){ d.step(1/60,1); if(window.__familiar.bolts()>0) break; }
    const bm=window.__familiar.boltMesh(0); let meshes=0; if(bm) bm.traverse(o=>{ if(o.isMesh&&!o.userData.isOL) meshes++; }); const box=new THREE.Box3(); if(bm) bm.traverse(o=>{ if(o.isMesh&&!o.userData.isOL) box.expandByObject(o); });
    const raw=box.isEmpty()?0:+box.getSize(new THREE.Vector3()).x.toFixed(2); const thorn=!!(window.__familiar.boltList()[0]||{}).thorn;
    let bursts=0; for(let i=0;i<90;i++){ d.step(1/60,1); bursts=Math.max(bursts,window.__wispburst.count()); }
    return {body,shot:bm?{meshes,raw,thorn}:null,bursts,hurt:e.hp<e.max}; });
  await ctx.close(); return r; }
const w=await pet("wisp"), bw=await pet("bramblewhisk"), ol=await pet("old_lamplight");
check("the Wisp wears the Wisp, fires its Celestial Projectile (the real model, not the little sphere) and its burst plays on the hit",w.body.kind==="Wisp"&&!w.body.named&&w.shot&&w.shot.raw>1&&!w.shot.thorn&&w.bursts>=1&&w.hurt,JSON.stringify(w));
check("Bramblewhisk wears its own thorny fox (not the Wisp), still fights like one, shoots thorns -- and no Wisp burst",bw.body.named==="bramblewhisk"&&bw.body.kind==="Wisp"&&bw.shot&&bw.shot.thorn&&bw.bursts===0&&bw.hurt,JSON.stringify(bw));
check("Old Lamplight wears its own lantern owl, fires plain sparks (no Celestial Projectile) -- and no Wisp burst",ol.body.named==="old_lamplight"&&ol.shot&&ol.shot.raw<.5&&!ol.shot.thorn&&ol.bursts===0&&ol.hurt,JSON.stringify(ol));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
