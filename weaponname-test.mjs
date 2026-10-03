// ===== A WEAPON'S NAME FOLLOWS THE HAND (build 516, 96r-weaponname.js). Matt: "my ranger is dual wielding bows ... the other is named mythic polearm of the void" / "it might help be less confusing".
// Checked: "Mythic Polearm of the Void" in the bag reads Bow for the Ranger, Staff for the Witch, Polearm for the Fighter, Sword for the Knight (a staff-look piece) and Polearm for the Knight's polearm
// piece; a worn and a 2nd weapon rename too; a plain "Shortsword" / "Gnome Blade" is never touched; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9028,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:900,height:600}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route(/\/api\//,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9028/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__weaponName&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,30);
  const mk=(name,look)=>{ const it=d.rollItem(4,'weapon',10); it.name=name; if(look) it.look=look; else delete it.look; M.giveItem(it); return it.id; };
  window.__T={ a:mk('Mythic Polearm of the Void','polearm'), b:mk('Mythic Staff of Chaos','staff'), c:mk('Keen Shortsword'), e:mk('Gnome Blade') }; });
const names={};
for(const h of ['troll','witch','fighter','knight']){ names[h]=await page.evaluate(async h=>{ await window.__heroes.select(h); window.__weaponName.pass(); const M=window.__meta, T=window.__T; const n=id=>M.bag().find(b=>b.id===id).name; return { a:n(T.a), b:n(T.b), c:n(T.c), e:n(T.e) }; },h); }
check("the Ranger: both mythics say Bow",names.troll.a==='Mythic Bow of the Void'&&names.troll.b==='Mythic Bow of Chaos',JSON.stringify(names.troll));
check("the Witch: Staff",names.witch.a==='Mythic Staff of the Void'&&names.witch.b==='Mythic Staff of Chaos',JSON.stringify(names.witch));
check("the Fighter: Polearm",names.fighter.a==='Mythic Polearm of the Void'&&names.fighter.b==='Mythic Polearm of Chaos',JSON.stringify(names.fighter));
check("the Knight: a polearm piece stays Polearm, the staff piece is his Sword",names.knight.a==='Mythic Polearm of the Void'&&names.knight.b==='Mythic Sword of Chaos',JSON.stringify(names.knight));
check("plain names are never touched (Keen Shortsword, Gnome Blade)",Object.values(names).every(o=>o.c==='Keen Shortsword'&&o.e==='Gnome Blade'),JSON.stringify(names.troll));
const W=await page.evaluate(async()=>{ const M=window.__meta, T=window.__T; await window.__heroes.select('troll'); M.equip(T.a); window.__weaponName.pass(); const w=window.__dd.gear().weapon; return w&&w.name; });
check("a worn weapon renames too",W==='Mythic Bow of the Void',W);
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
