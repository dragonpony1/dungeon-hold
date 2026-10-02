// ===== THE SETS' OWN 3D ART (build 482 onward). Chaos first: Matt's sword in the hero's hand and on the floor stand in place of the code-built one; the set's amulet and charm stand on the floor in 3D
// (a set without its own files yet keeps its card). Pictures in tools/test-logs.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9038,{dist:"./dist"}); const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await (await browser.newContext({viewport:{width:1100,height:680}})).newPage(); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9038/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel()&&window.__weaponStand&&window.__mythic,null,{timeout:120000});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?'PASS ':'FAIL ')+n+(d?'  -> '+d:'')); };
const R=await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,20); window.__mythicDrops&&window.__mythicDrops.set&&window.__mythicDrops.set(0,0);
  const N=window.__mythic.normalize; const mk=r=>N(r);
  const sw=mk({ slot:'weapon', name:'Mythic Sword of Chaos', setId:'crimson', look:'sword', rarity:5, lvl:20, stats:{ dmg:24, spd:45, tow:41 } });
  const am=mk({ slot:'amulet', name:'Amulet of Chaos', setId:'crimson', rarity:5, lvl:20, stats:{ mana:65, tow:41, hp:156 } });
  const ch=mk({ slot:'charm', name:'Charm of Chaos', setId:'crimson', rarity:5, lvl:20, stats:{ move:20, trate:20, tarea:18 } });
  const va=mk({ slot:'amulet', name:'Amulet of the Void', setId:'void', rarity:5, lvl:20, stats:{ mana:65, tow:41, hp:156 } }), vc=mk({ slot:'charm', name:'Charm of the Void', setId:'void', rarity:5, lvl:20, stats:{ move:20, trate:20, tarea:18 } });
  const ea=mk({ slot:'amulet', name:'Amulet of the Earth', setId:'rock', rarity:5, lvl:20, stats:{ mana:65, tow:41, hp:156 } }), ec=mk({ slot:'charm', name:'Charm of the Earth', setId:'rock', rarity:5, lvl:20, stats:{ move:20, trate:20, tarea:18 } });
  const fa=mk({ slot:'amulet', name:'Amulet of Fire', setId:'lava', rarity:5, lvl:20, stats:{ mana:65, tow:41, hp:156 } }), fc=mk({ slot:'charm', name:'Charm of Fire', setId:'lava', rarity:5, lvl:20, stats:{ move:20, trate:20, tarea:18 } });
  const ic=mk({ slot:'amulet', name:'Amulet of Ice', setId:'ice', rarity:5, lvl:20, stats:{ mana:65, tow:41, hp:156 } });
  const h=d.hero; [[sw,-2.5],[am,0],[ch,2.5],[ic,5],[va,-5],[vc,7.5],[ea,-7.5],[ec,10],[fa,-10],[fc,12.5]].forEach(([it,o],i)=>{ it.id='t'+i; d.dropLoot(it,h.x+o,h.z-5,true); });
  let names=[]; for(let t=0;t<200;t++){ d.step(1/60,3); await new Promise(r=>setTimeout(r,50)); names=window.__weaponStand.list().map(s=>s.name); if(['named-set_chaos_amulet','named-set_chaos_charm','named-set_void_amulet','named-set_void_charm','named-set_earth_amulet','named-set_earth_charm','named-set_fire_amulet','named-set_fire_charm'].every(n=>names.includes(n))) break; }
  const mf=window.__weaponStand.modelFor;
  // the real sword's template: Matt's mesh, thousands of points (the code-built one is a few hundred)
  const verts=await new Promise(res=>window.__weapons.model('sword-chaos',m=>{ let n=0; (m&&m.traverse)&&m.traverse(o=>{ if(o.isMesh&&o.geometry&&o.geometry.attributes.position) n+=o.geometry.attributes.position.count; }); res(n); }));
  const vverts=await new Promise(res=>window.__weapons.model('sword-void',m=>{ let n=0; (m&&m.traverse)&&m.traverse(o=>{ if(o.isMesh&&o.geometry&&o.geometry.attributes.position) n+=o.geometry.attributes.position.count; }); res(n); }));
  const overts=await new Promise(res=>window.__weapons.model('void',m=>{ let n=0; (m&&m.traverse)&&m.traverse(o=>{ if(o.isMesh&&o.geometry&&o.geometry.attributes.position) n+=o.geometry.attributes.position.count; }); res(n); }));
  const anim=window.__weaponStand.list?window.__weaponStand.list().filter(s=>/set_chaos|set_void|chaos|void/.test(s.name)).map(s=>s.name+':'+!!s.mixer):[];
  const everts=await new Promise(res=>window.__weapons.model('sword-earth',m=>{ let n=0; (m&&m.traverse)&&m.traverse(o=>{ if(o.isMesh&&o.geometry&&o.geometry.attributes.position) n+=o.geometry.attributes.position.count; }); res(n); }));
  const fverts=await new Promise(res=>window.__weapons.model('sword-fire',m=>{ let n=0; (m&&m.traverse)&&m.traverse(o=>{ if(o.isMesh&&o.geometry&&o.geometry.attributes.position) n+=o.geometry.attributes.position.count; }); res(n); }));
  return { fverts, everts, names, models:{ sw:mf(sw), am:mf(am), ch:mf(ch), ic:mf(ic) }, verts, vverts, overts, anim }; });
check("the Chaos sword is Matt's model (thousands of points), not the code-built one",R.verts>3000,JSON.stringify(R.verts));
check('the Chaos weapon (as this hero holds it), amulet and charm stand on the floor in 3D',R.names.some(n=>/^(sword|staff|polearm|bow)-chaos$/.test(n))&&R.names.includes('named-set_chaos_amulet')&&R.names.includes('named-set_chaos_charm'),JSON.stringify(R));
check("the Void longsword is Matt's model under both of the set's names",R.vverts>3000&&R.overts>3000,JSON.stringify({ v:R.vverts, o:R.overts }));
check('the Void amulet and charm stand on the floor in 3D',R.names.includes('named-set_void_amulet')&&R.names.includes('named-set_void_charm'),JSON.stringify(R.names));
check("Bob's animated pieces play their moves on the floor (the Chaos amulet and charm sway)",R.anim.includes('named-set_chaos_amulet:true')&&R.anim.includes('named-set_chaos_charm:true'),JSON.stringify(R.anim));
check("the Earth sword is Matt's model, the Earth amulet and charm stand in 3D",R.everts>3000&&R.names.includes('named-set_earth_amulet')&&R.names.includes('named-set_earth_charm'),JSON.stringify({ v:R.everts }));
check("the Fire sword is Matt's model, the Fire amulet and skull charm stand in 3D",R.fverts>3000&&R.names.includes('named-set_fire_amulet')&&R.names.includes('named-set_fire_charm'),JSON.stringify({ v:R.fverts }));
check('a set without its own 3D amulet yet keeps its card (Ice)',R.models.ic===null,JSON.stringify(R.models));
await page.evaluate(()=>{ const d=window.__dd, h=d.hero; d.setCam(Math.PI,.35,7); d.step(1/60,30); }); await page.screenshot({path:'tools/test-logs/setart-floor.png'});
const HG=await page.evaluate(async()=>{ const d=window.__dd, N=window.__mythic.normalize, M=window.__meta; const sw=N({ slot:'weapon', name:'Mythic Sword of the Void', setId:'void', look:'sword', forceLook:'sword', rarity:5, lvl:20, stats:{ dmg:24, spd:45, tow:41 } }); sw.id='held'; M.giveItem(sw); M.equip(sw.id);
  for(let t=0;t<80;t++){ d.step(1/60,2); await new Promise(r=>setTimeout(r,30)); } return window.__heldglow.info(); });
check('a real set weapon in the hand glows in its set colour and sheds motes (when the hero holds it as a blade or staff)',!HG.held||(HG.glowing>0&&HG.motes>0),JSON.stringify(HG));
check('no page errors',errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
