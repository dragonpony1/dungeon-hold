// ===== BUILD 241: set pieces, mythics and named mythics AUTO-LOCK on pickup; the bag holds 50; a mythic/named drop gets a loud fanfare and a light beam; the game's pause menu
// never opens while the hideout is up (Escape there is only for closing menus)
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8881);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext()).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8881/?silent&nogate&nosetgate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__mythic&&window.__mythicDrops&&window.__forest&&window.__pause&&window.__hideout,null,{timeout:90000});
await page.evaluate(()=>{ const d=window.__dd; d.start(); d.step(1/60,20); window.__mythicDrops.set(0,0,0); });
check("Matt's drop sound file ships with the game",(await page.evaluate(async()=>(await (await fetch("assets/sfx-fancy.mp3")).arrayBuffer()).byteLength))>50000);
check("the bag holds 50",await page.evaluate(()=>window.__meta.BAG_CAP)===50);
const lock=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; const mk=(slot)=>{ const it=d.rollItem(2,slot); it.rarity=2; return it; };
  const plain=mk("armor"); M.onPickup(plain);
  const mythic=mk("charm"); mythic.rarity=5; mythic.mythic=true; mythic.name="Mythic Trinket of Chaos"; mythic.setId="crimson"; M.onPickup(mythic);
  const named=window.__mythic.normalize({tier:"named",named:"bramblewhisk"}); M.onPickup(named);
  const forest=mk("amulet"); window.__forest.make(forest); M.onPickup(forest);
  const bag=M.bag(); const by=id=>bag.find(b=>b.id===id);
  return { plain:!!by(plain.id).locked, mythic:!!by(mythic.id).locked, named:!!by(named.id).locked, forest:!!by(forest.id).locked }; });
check("a plain Rare stays unlocked; a mythic, a named mythic and a set-pack piece lock themselves on pickup",lock.plain===false&&lock.mythic&&lock.named&&lock.forest,JSON.stringify(lock));
const full=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; M.reset(); d.resetGear&&d.resetGear(); for(let i=0;i<60;i++){ const it=d.rollItem(0,"charm"); it.rarity=0; M.onPickup(it); } return M.bag().length; });
check("the bag stops at 50 (the rest sell for gold)",full===50,String(full));
// the fanfare and the beam
const fx=await page.evaluate(()=>{ const d=window.__dd, X=window.__mythicDrops; d.S.phase="wave"; const f0=X.fancy(), b0=X.beams(); X.set(1,0,0); const it=d.rollItem(2,"weapon"); it.rarity=2; d.dropLoot(it,3,3,true); X.set(.025,.05,.00015); return {f:X.fancy()-f0,b:X.beams()-b0,mythic:!!it.mythic}; });
check("a drop that turns mythic plays the fanfare once and raises a light beam",fx.mythic&&fx.f===1&&fx.b===1,JSON.stringify(fx));
const nm=await page.evaluate(()=>{ const d=window.__dd, X=window.__mythicDrops; d.S.phase="wave"; const f0=X.fancy(), b0=X.beams(); X.set(0,0,1); const e=d.spawn("goblin","N"); e.x=4; e.z=8; e.y=0; e.hp=e.max=10; d.kill(e); d.step(1/60,2); X.set(.025,.05,.00015); return {f:X.fancy()-f0,b:X.beams()-b0}; });
check("a named mythic dropping from a mob plays the fanfare and raises a beam too",nm.f===1&&nm.b===1,JSON.stringify(nm));
const pk=await page.evaluate(()=>{ const d=window.__dd, X=window.__mythicDrops; d.S.phase="wave"; const f0=X.fancy(); const it=d.rollItem(2,"armor"); it.rarity=2; window.__forest.make(it); d.dropLoot(it,3,3,true); return X.fancy()-f0; });
check("a set-pack piece landing plays the same sound",pk===1,String(pk));
const gl=await page.evaluate(()=>{ const d=window.__dd, X=window.__mythicDrops; const f0=X.fancy(), b0=X.beams(); const it=window.__mythic.normalize({tier:"named",named:"gladehart"}); d.dropLoot(it,2,2,true); return {f:X.fancy()-f0,b:X.beams()-b0}; });
check("any named drop (Gladehart here) plays it once and raises a beam",gl.f===1&&gl.b===1,JSON.stringify(gl));
// the pause menu: it opens in the hall; it never opens while the hideout is up
const pause=await page.evaluate(()=>{ const d=window.__dd; d.S.phase="build"; d.step(1/60,2); const a=window.__pause.open(); window.__pause.close(false); window.__hideout.open(); const b=window.__pause.open(); window.__hideout.close(); return {hall:a,hideout:b,after:window.__pause.isOpen()}; });
check("Escape's game menu opens in the main room but never while the hideout is open",pause.hall===true&&pause.hideout===false&&pause.after===false,JSON.stringify(pause));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,2).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
