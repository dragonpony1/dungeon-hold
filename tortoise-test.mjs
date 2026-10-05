// ===== build 539: THE STONE TORTOISE, the tank pet (85c-tortoise.js).
//  * build 540: it is the Feast Hall's wave-7 reward (Sir Bullion's wave), Rare or better, and no longer a random drop; its card picture loads, the dev panel lists it, its card says what it does
//  * it loads Matt's rigged model with its crawl clip, and WALKS on the floor beside the hero (not at the shoulder), following as the hero moves
//  * it taunts: mobs within 4.5 stop (shoutT) for ~2.2 s; a boss doesn't
//  * its shell slam hurts its target
//  * as the 2nd pet it walks on the other side; a partner's tortoise walks beside their puppet
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const server=await serve(8961,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:960,height:600}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("ddMapsCleared","9"); }catch(e){} });
await page.goto("http://127.0.0.1:8961/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__familiar&&window.__tortoise&&window.__tworings,null,{timeout:120000});
// ---- drops, picture, card, dev panel
const drop=await page.evaluate(async()=>{ const d=window.__dd; let n=0, owl=0; for(let i=0;i<400;i++){ const it=d.rollItem(4,"familiar",8); if(it.name.includes("Stone Tortoise")) n++; if(it.name.includes("Crystal Owl")) owl++; } const tort=window.__tortoise.reward();
  const src="hideout/assets/hideout/items/pets/"+window.__petPics["Stone Tortoise"]+".jpg"; const img=await new Promise(r=>{ const im=new Image(); im.onload=()=>r({w:im.naturalWidth}); im.onerror=()=>r(null); im.src=src; });
  window.__devpanel.toggle(); const opt=!!document.querySelector('#dp-fam option[value="Stone Tortoise"]'); window.__devpanel.toggle();
  return {n,owl,name:tort&&tort.name,desc:tort&&d.statStr(tort),img,opt}; });
check("it is NOT a random drop any more (owls stay owls); its card says what it does",drop.n===0&&drop.owl>50&&/Stone Tortoise/.test(drop.name||"")&&/taunts the pack/.test(drop.desc||""),JSON.stringify(drop));
check("its card picture loads and the dev panel lists it",!!drop.img&&drop.img.w===512&&drop.opt,JSON.stringify(drop));
// ---- wear it: real model, on the floor at the hero's side, following
await page.evaluate(()=>{ const d=window.__dd; if(d.start) d.start(); for(const e of d.enemies.slice()) d.kill(e); d.step(1/60,20);
  const it=d.rollItem(3,"familiar",8); it.name="Runed Stone Tortoise"; it.stats={fdmg:30,frate:30}; d.gear().familiar=it; d.applyGear(); d.setHero(0,5,0); d.step(1/60,30); });
await page.waitForFunction(()=>window.__familiar.glb().includes("Stone Tortoise"),null,{timeout:120000});
const walk=await page.evaluate(()=>{ const d=window.__dd, W=window.__tortoise; d.step(1/60,60); const s0=W.state(), h=d.hero; const fl=d.floorAt?d.floorAt(s0.x,s0.z,h.y+.6):0;
  const sideD=Math.hypot(s0.x-h.x,s0.z-h.z); const ts0=s0.ts;
  d.setHero(6,5,0); let ts1=0; for(let i=0;i<20;i++){ d.step(1/60,1); ts1=Math.max(ts1,W.state().ts||0); } d.step(1/60,120); const s1=W.state();
  return {s0,fl,heroY:h.y,sideD:+sideD.toFixed(2),ts0,ts1,s1,d1:+Math.hypot(s1.x-d.hero.x,s1.z-d.hero.z).toFixed(2),on:W.isOn()}; });
check("it wears Matt's model and plays its crawl clip",walk.s0.glb&&/Crawl/.test(walk.s0.clip||"")&&walk.on,JSON.stringify(walk.s0));
check("it walks ON THE FLOOR (feet on the ground, not at the shoulder) about 1.3 from the hero",Math.abs(walk.s0.y-walk.s0.walker-walk.heroY)<.3&&walk.sideD>.9&&walk.sideD<1.8,JSON.stringify(walk));
check("it follows the hero when they move, crawl sped up while walking",walk.d1<1.8&&walk.ts1>1&&walk.ts0<.5,JSON.stringify(walk));
// ---- taunt + slam
const fight=await page.evaluate(()=>{ const d=window.__dd, W=window.__tortoise; const h=d.hero; const i0=W.info();
  const mk=(k,dx,dz)=>{ const e=d.spawn(k,"N"); e.x=h.x+dx; e.z=h.z+dz; e.y=0; e.hp=e.max=99999; e.dmg=0; return e; };
  const g1=mk("goblin",2.5,2), g2=mk("goblin",-1,3), far=mk("goblin",0,14); d.step(1/60,2); const t=W.taunt(); d.step(1/60,1);
  const held={g1:+(g1.shoutT||0).toFixed(2),g2:+(g2.shoutT||0).toFixed(2),far:+(far.shoutT||0).toFixed(2)}; const hp0=g1.hp+g2.hp;
  for(let i=0;i<60*6;i++) d.step(1/60,1); const i1=W.info();
  return {t,held,dmg:hp0-(g1.hp+g2.hp),taunts:i1.taunts-i0.taunts,slams:i1.slams-i0.slams}; });
check("a taunt stops the mobs near it for ~2.2 s (not the one far away)",fight.t&&fight.held.g1>2&&fight.held.g2>2&&fight.held.far===0,JSON.stringify(fight));
check("it slams the pack (damage) and taunts again on its cooldown",fight.dmg>0&&fight.slams>=2&&fight.taunts>=1,JSON.stringify(fight));
const boss=await page.evaluate(()=>{ const d=window.__dd, W=window.__tortoise; for(const e of d.enemies.slice()) d.kill(e); d.step(1/60,20); const h=d.hero; const e=d.spawn("goblin","N"); e.kind="cyclops"; e.x=h.x+2; e.z=h.z+2; e.hp=e.max=99999; e.dmg=0; const g=d.spawn("goblin","N"); g.x=h.x-2; g.z=h.z+2; g.hp=g.max=99999; g.dmg=0; d.step(1/60,1); W.taunt(); return {boss:e.shoutT||0,gob:g.shoutT||0}; });
check("a boss ignores the taunt",boss.boss===0&&boss.gob>2,JSON.stringify(boss));
// ---- 2nd pet: walks on the OTHER side
const two=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; for(const e of d.enemies.slice()) d.kill(e); d.step(1/60,20); const ring=window.__mythic.normalize({tier:'named',named:'beast_mode',lvl:10}); M.giveItem(ring); M.equip(ring.id);
  const a=d.rollItem(3,"familiar",8); a.name="Runed Wisp"; const b=d.rollItem(3,"familiar",8); b.name="Runed Stone Tortoise"; d.gear().familiar=a; d.gear().familiar2=b; d.applyGear(); d.setHero(0,5,0); d.step(1/60,120);
  const T=window.__tworings, f2=T.fam2(), m2=f2&&f2.g; const h=d.hero; if(!m2) return {none:true,keys:Object.keys(T)}; const p=m2.position; const sx=Math.cos(h.yaw), sz=-Math.sin(h.yaw);
  return {y:+(p.y-h.y).toFixed(2),side:+((p.x-h.x)*sx+(p.z-h.z)*sz).toFixed(2),walker:m2.userData.walker}; });
check("as the 2nd pet it walks on the floor on the other side",!two.none&&Math.abs(two.y-two.walker)<.3&&Math.abs(two.side)>.8,JSON.stringify(two));
// ---- the Feast Hall's wave-7 reward
await page.goto("http://127.0.0.1:8961/?silent&nogate&map=3",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__setGate&&window.__tortoise&&window.__dd.map,null,{timeout:120000});
const rw=await page.evaluate(()=>{ const d=window.__dd, G=window.__setGate; d.start(); d.step(1/60,2); const out={}; for(const w of [6,7]){ d.S.wave=w; const its=[]; for(let i=0;i<6;i++) its.push(G.reward()); out[w]=its.map(it=>({n:it.name,r:it.rarity,s:it.slot})); } return {map:d.map&&d.map.id,out}; });
check("in the Feast Hall the wave-7 reward is always a Stone Tortoise, Rare or better (wave 6's is not)",rw.out[7].every(x=>x.s==="familiar"&&/Stone Tortoise/.test(x.n)&&x.r>=2)&&!rw.out[6].some(x=>/Stone Tortoise/.test(x.n)),JSON.stringify(rw));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await page.screenshot({path:process.env.TEMP+"/tortoise-shot.png"});
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
