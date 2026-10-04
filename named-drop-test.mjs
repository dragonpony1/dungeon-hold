// ===== NAMED WEAPONS AND STANDING DROPS (build 169): Rootsplitter and The Last Lantern built in code (86h-named.js) and held by the
// Knight (a staff or bow hero holds the top staff / bow for them), and a dropped weapon with its own model standing on the floor --
// turning, a column and motes about it -- instead of a picture card (93c-weaponstand.js); picking it up takes it all away
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const s1=await serve(8811), s2=await serve(9711);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];
async function open(port,hero){ const ctx=await browser.newContext({viewport:{width:960,height:600}}); await ctx.addInitScript(h=>{ try{ localStorage.setItem("ddMapsCleared","1"); localStorage.setItem("ddHero",h); }catch(e){} },hero);
  const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(hero+": "+String(e))); page.on("console",m=>{ if(m.type()==="error"&&!/Failed to load resource|favicon/i.test(m.text())) errors.push(hero+": "+m.text().slice(0,200)); });
  await page.goto("http://127.0.0.1:"+port+"/?silent&nogate&map=0",{timeout:240000}); await page.waitForFunction(()=>window.__dd&&window.__weapons&&window.__weaponStand&&window.__named&&window.__mythic&&window.__meta,null,{timeout:180000});
  await page.evaluate(()=>{ window.__meta.reset(); window.__dd.resetGear(); window.__dd.start(); window.__dd.step(1/60,10); });
  await page.waitForFunction(()=>{ window.__dd.step(1/60,2); const s=window.__weapons.state(); return !!(s&&s.mount); },null,{timeout:120000,polling:250}); return {ctx,page}; }
const K=await open(8811,"knight"), P=K.page;
// the two models register and build in the kit's frames
const m=await P.evaluate(()=>{ const one=n=>{ let o=null; window.__weapons.model(n,x=>{ o=x; }); if(!o) return null; let meshes=0; o.traverse(x=>{ if(x.isMesh) meshes++; }); const b=o.userData.box; return {name:o.name,meshes,proc:!!o.userData.proc,gripF:o.userData.gripF,lenScale:o.userData.lenScale,h:b?+(b.max.y-b.min.y).toFixed(2):0}; };
  return {rs:one("named-rootsplitter"),ll:one("named-last_lantern"),ids:window.__named.ids()}; });
check("Rootsplitter and The Last Lantern register as named-rootsplitter / named-last_lantern and build (sword frame and polearm frame)",m.rs&&m.ll&&m.rs.meshes>40&&m.ll.meshes>40&&m.rs.proc&&m.ll.proc&&m.rs.h>=1&&m.rs.h<1.2&&m.ll.h>1.6&&m.ll.gripF===.3&&m.ids.join()==="rootsplitter,last_lantern,subterfuge,sixseven",JSON.stringify(m));   // build 170: + Subterfuge, the named bow (subterfuge-test.mjs)
// the choice: the Knight's hand holds the named model; a staff hand the top staff, a bow hand the top bow; sets unchanged
const c=await P.evaluate(()=>{ const W=window.__weapons, M=window.__mythic; const rs=M.normalize({tier:"named",named:"rootsplitter"}), ll=M.normalize({tier:"named",named:"last_lantern"}), amu=M.normalize({tier:"named",named:"wardens_oath"});
  const chaos={name:"Mythic Sword of Chaos",slot:"weapon",rarity:5,lvl:10,stats:{dmg:5},setId:"crimson",look:"sword",mythic:true}, wind={name:"Mythic Polearm of the Wind",slot:"weapon",rarity:5,lvl:10,stats:{dmg:5},setId:"wind",look:"polearm",mythic:true};
  return {rs:W.swordFor(rs),ll:W.swordFor(ll),rsStaff:W.setModel(rs,"staff"),llBow:W.setModel(ll,"bow"),chaos:W.swordFor(chaos),wind:W.swordFor(wind),chaosStaff:W.setModel(chaos,"staff"),amu:W.setModel(amu,"sword")}; });
check("swordFor: Rootsplitter -> named-rootsplitter, the Lantern -> named-last_lantern; on a staff hand staff-battle, a bow hand bow-war; set weapons as before (sword-chaos, polearm-wind, staff-chaos); a named amulet is no weapon",c.rs==="named-rootsplitter"&&c.ll==="named-last_lantern"&&c.rsStaff==="staff-battle"&&c.llBow==="bow-war"&&c.chaos==="sword-chaos"&&c.wind==="polearm-wind"&&c.chaosStaff==="staff-chaos"&&c.amu===null,JSON.stringify(c));
const eq=await P.evaluate(async()=>{ const out={}; for(const id of ["rootsplitter","last_lantern"]){ const it=window.__mythic.normalize({tier:"named",named:id}); window.__meta.giveItem(it); window.__meta.equip(it.id); for(let i=0;i<120;i++){ window.__dd.step(1/60,1); const s=window.__weapons.state(); if(s.mounted&&s.key.startsWith("named-"+id+"|")) break; await new Promise(r=>setTimeout(r,25)); } const s=window.__weapons.state(), wo=window.__weapons.mounted(); out[id]={key:s.key.split("|")[0],mounted:s.mounted,obj:wo&&wo.name}; } return out; });
check("the Knight equips each named weapon and holds its model (named-<id> mounted on his hand)",eq.rootsplitter.key==="named-rootsplitter"&&eq.rootsplitter.obj==="named-rootsplitter"&&eq.last_lantern.key==="named-last_lantern"&&eq.last_lantern.mounted&&eq.last_lantern.obj==="named-last_lantern",JSON.stringify(eq));
// the floor: a set weapon and a named weapon stand as their models; armor keeps its card
const f=await P.evaluate(()=>{ const d=window.__dd, h=d.hero, M=window.__mythic; d.loot.slice().forEach(l=>{ d.scene.remove(l.mesh); }); d.loot.length=0; d.step(1/60,2);
  const chaos={name:"Mythic Sword of Chaos",slot:"weapon",rarity:5,lvl:10,stats:{dmg:5},setId:"crimson",look:"sword",mythic:true}, rs=M.normalize({tier:"named",named:"rootsplitter"}), arm={name:"Mythic Armor of Fire",slot:"armor",rarity:5,lvl:10,stats:{hp:5},setId:"lava",mythic:true};
  window.__mythicDrops.art&&(arm.art=window.__mythicDrops.art(arm));
  d.dropLoot(chaos,h.x+5,h.z,true); d.dropLoot(rs,h.x-5,h.z,true); d.dropLoot(arm,h.x,h.z+5,true); d.step(1/60,20); const a=window.__weaponStand.list(); d.step(1/60,60); const b=window.__weaponStand.list();
  let inScene=0, pts=0; d.scene.traverse(o=>{ if(o.name==="weaponStand"){ inScene++; o.traverse(x=>{ if(x.isPoints) pts++; }); } });
  const armL=d.loot.find(l=>l.it.slot==="armor"); return {a,b,inScene,pts,loot:d.loot.length,armCard:!!(armL&&armL.mesh.userData.artSprite),armStand:!!(armL&&armL.mesh.userData.stand)}; });
const byName=n=>f.b.find(s=>s.name===n)||{}, before=n=>f.a.find(s=>s.name===n)||{};
check("a dropped set weapon and a dropped named weapon stand on the floor as their 3D models (sword-chaos, named-rootsplitter): no card, the placeholder hidden, lifted off the floor on their own stand group",f.b.length===2&&byName("sword-chaos").inScene&&byName("named-rootsplitter").inScene&&f.b.every(s=>!s.card&&!s.placeholder&&s.height>=1.2)&&f.inScene===2,JSON.stringify(f));
check("they turn (the spin grows frame to frame) and each has a cloud of drifting motes",byName("sword-chaos").spin>before("sword-chaos").spin&&byName("named-rootsplitter").spin>before("named-rootsplitter").spin&&f.pts===2&&f.b.every(s=>s.motes>=8),JSON.stringify(f.b));
check("armor keeps its picture card and gets no stand",f.armCard&&!f.armStand&&f.loot===3,JSON.stringify({armCard:f.armCard,armStand:f.armStand,loot:f.loot}));
// picking them up: walking onto each takes the drop, and its stand, motes and all, goes with it
const pk=await P.evaluate(()=>{ const d=window.__dd; for(const l of d.loot.slice()){ d.hero.x=l.x; d.hero.z=l.z; d.step(1/60,30); } let inScene=0; d.scene.traverse(o=>{ if(o.name==="weaponStand") inScene++; }); const bag=window.__meta.bag().map(b=>b&&b.name); return {loot:d.loot.length,stands:window.__weaponStand.count(),inScene,bag}; });
check("picking up takes the weapons as ever (into the bag) and the stands leave the scene with them",pk.loot===0&&pk.stands===0&&pk.inScene===0&&pk.bag.includes("Rootsplitter")&&pk.bag.includes("Mythic Sword of Chaos"),JSON.stringify(pk));
await K.ctx.close();
// a staff hero: build 525 prep (typed weapons) -- the floor shows each weapon as its own type, and the Witch cannot equip a sword-type named weapon
const Wt=await open(9711,"witch");
const w=await Wt.page.evaluate(async()=>{ const d=window.__dd, h=d.hero, M=window.__mythic; const rs=M.normalize({tier:"named",named:"rootsplitter"}); d.dropLoot({name:"Mythic Staff of Chaos",slot:"weapon",rarity:5,lvl:10,stats:{dmg:5},setId:"crimson",look:"staff",mythic:true},h.x+5,h.z,true); d.dropLoot(rs,h.x-5,h.z,true); d.step(1/60,30);
  for(let i=0;i<240&&window.__weaponStand.list().length<2;i++){ d.step(1/60,1); await new Promise(r=>setTimeout(r,25)); }   // build 270: the Chaos staff is Matt's real model (build 268), which loads on its first drop; its stand waits for it and stands when it lands
  const names=window.__weaponStand.list().map(s=>s.name).sort(); window.__meta.giveItem(rs); const eq=window.__meta.equip(rs.id); d.step(1/60,5); return {names,eq,worn:(d.gear().weapon||{}).name||null}; });
check("the Witch (build 525 prep, typed weapons): the floor shows each weapon as its own type -- the Chaos staff, Rootsplitter as itself -- and Rootsplitter, a sword, is not hers to equip",w.names.join()==="named-rootsplitter,staff-chaos"&&w.eq===false&&w.worn!=="Rootsplitter",JSON.stringify(w));
await Wt.ctx.close();
check("no page errors",errors.length===0,errors.slice(0,3).join(" | "));
await browser.close(); s1.close(); s2.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
