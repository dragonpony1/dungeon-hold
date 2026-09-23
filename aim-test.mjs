// ranged aiming: the reticle locks on, a held draw doesn't loose, letting go does (charged), a tap looses weak; a full-draw arrow
// pierces, the witch's staff levels at the target while she charges and a full-charge bolt splashes; shots of both reticles
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const SP=process.env.SP; const server=await serve(8921);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const page=await browser.newPage({viewport:{width:1100,height:700}}); const errors=[]; page.on("pageerror",e=>errors.push(String(e))); page.on("console",m=>{ if(m.type()==="error") errors.push(m.text().slice(0,200)); });
const ready=()=>page.waitForFunction(()=>window.__dd&&window.__heroes&&window.__weapons&&window.__bow&&window.__aim&&window.__staff&&window.__dd.heroModel()&&window.__dd.mobModel("goblin"),null,{timeout:120000});
await page.goto("http://127.0.0.1:8921/?silent&nogate"); await ready();
const pick=async(id,re,key)=>{ await page.evaluate(i=>window.__heroes.select(i),id); await page.waitForFunction(r=>new RegExp(r).test(window.__dd.heroModel().label),re,{timeout:90000});
  await page.evaluate(async k=>{ const d=window.__dd; window.__meta.reset(); d.resetGear(); d.start(); for(let i=0;i<240;i++){ d.step(1/60,1); const s=window.__weapons.state(); if(s.mounted&&s[k]) break; await new Promise(r=>setTimeout(r,25)); } },key); };
// the mouse, as the page sees it: a press on the canvas, a release on the window
const down=()=>page.evaluate(()=>document.getElementById("c").dispatchEvent(new MouseEvent("mousedown",{button:0,bubbles:true})));
const up=()=>page.evaluate(()=>window.dispatchEvent(new MouseEvent("mouseup",{button:0,bubbles:true})));
await pick("troll","Troll","bow");
// 1) the reticle locks on a goblin eight units down the aim, and shows a crosshair when nothing is there
const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const r1=await page.evaluate(async()=>{ const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); const d=window.__dd; for(const e of d.enemies) d.kill(e); d.setHero(0,10,0); d.hero.y=0; d.setCam(0,.3,6); d.step(1/60,60); await raf(); const free=window.__aim.reticle(); const e=d.spawn("goblin","N"); e.x=0; e.z=18; e.spd=0; e.hp=e.max=500; d.step(1/60,3); await raf(); const r=window.__aim.reticle(); const off=d.spawn("goblin","N"); off.x=7; off.z=12; off.spd=0; d.step(1/60,2); const t=window.__aim.pick(); return {free,locked:r,pickIsFront:t===e,kind:window.__aim.kind(),shoulder:+(d.cam.shoulder||0).toFixed(2)}; });
check("the over-the-shoulder camera is on; the reticle: a crosshair with nothing in reach, a lock on the goblin down the aim (not the one off to the side)",r1.kind==="bow"&&r1.shoulder>.9&&r1.free.shown&&!r1.free.locked&&r1.locked.shown&&r1.locked.locked&&r1.pickIsFront,JSON.stringify(r1));
// 2) press and hold a second: no arrow, the clip holds at full draw, the string comes back, he walks at half speed; let go: a full-charge arrow
await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) if(e.x!==0) d.kill(e); });
await down();
const r2=await page.evaluate(async()=>{ const d=window.__dd; const e=d.enemies.find(e=>!e.dead); const hp0=e.hp; for(let i=0;i<66;i++){ d.step(1/60,1); e.x=0; e.z=18; } await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); return {holding:window.__aim.holding(),charge:+window.__aim.charge().toFixed(2),paused:window.__aim.paused(),arrows:window.__bow.arrows(),hpSame:e.hp===hp0,draw:window.__bow.draw(),slow:d.hero.aimSlow,ret:window.__aim.reticle()}; });
check("held for a second: the draw holds (clip paused at full draw, no arrow, the goblin untouched), the charge is full, the string is back, he walks at half speed, the reticle shows the full ring",r2.holding&&r2.charge===1&&r2.paused&&r2.arrows===0&&r2.hpSame&&r2.draw>.9&&r2.slow===.5&&r2.ret.charge===1,JSON.stringify(r2));
await page.screenshot({path:SP+"/parts/shots/aim-bow-hold.png"});
await up();
const r3=await page.evaluate(()=>{ const d=window.__dd; const e=d.enemies.find(e=>!e.dead); const hp0=e.hp; let fired=-1, hit=-1; for(let i=0;i<60;i++){ d.step(1/60,1); e.x=0; e.z=18; if(fired<0&&window.__bow.arrows()) fired=i; if(hit<0&&e.hp<hp0) hit=i; } return {fired,hit,lost:+(hp0-e.hp).toFixed(1),dmg:d.heroDmg(),last:window.__aim.lastCharge(),holding:window.__aim.holding()}; });
check("let go: the arrow looses at once and hits, a full charge for 130% damage",!r3.holding&&r3.fired>=0&&r3.fired<6&&r3.hit>0&&r3.last===1&&Math.abs(r3.lost-r3.dmg*1.3)<.25,JSON.stringify(r3));
// 3) a tap: 60% damage
await page.evaluate(()=>window.__dd.step(1/60,40)); await down(); await up();
const r4=await page.evaluate(()=>{ const d=window.__dd; const e=d.enemies.find(e=>!e.dead); const hp0=e.hp; for(let i=0;i<60;i++){ d.step(1/60,1); e.x=0; e.z=18; } return {lost:+(hp0-e.hp).toFixed(1),dmg:d.heroDmg(),last:+window.__aim.lastCharge().toFixed(2)}; });
check("a tap looses weak: about 60% damage",r4.last<.2&&r4.lost>0&&r4.lost<=r4.dmg*.75,JSON.stringify(r4));
// 4) a full-draw arrow goes through two goblins into a third
const r5=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,20); const line=[15,17.5,20].map(z=>{ const e=d.spawn("goblin","N"); e.x=0; e.z=z; e.spd=0; e.hp=e.max=500; return e; }); d.step(1/60,2); window.__line=line; return line.length; });
await down(); await page.evaluate(()=>{ const d=window.__dd; for(let i=0;i<66;i++){ d.step(1/60,1); window.__line.forEach((e,k)=>{ e.x=0; e.z=[15,17.5,20][k]; }); } }); await up();
const r6=await page.evaluate(()=>{ const d=window.__dd; for(let i=0;i<60;i++){ d.step(1/60,1); window.__line.forEach((e,k)=>{ e.x=0; e.z=[15,17.5,20][k]; }); } return window.__line.map(e=>+(500-e.hp).toFixed(1)); });
check("a full-draw arrow pierces: all three goblins in the line are hit",r6.every(v=>v>0),JSON.stringify(r6));
// 5) the witch: her staff levels at the goblin while she charges, the head glows up; a full-charge bolt hits it and splashes the one beside it
await pick("witch","Witch","staff");
await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.setHero(0,10,0); d.hero.y=0; d.setCam(0,.3,6); d.step(1/60,5); const a=d.spawn("goblin","N"); a.x=0; a.z=17; a.spd=0; a.hp=a.max=500; const b=d.spawn("goblin","N"); b.x=1.3; b.z=17.4; b.spd=0; b.hp=b.max=500; window.__pair=[a,b]; d.step(1/60,2); });
await down();
const r7=await page.evaluate(()=>{ const d=window.__dd; const [a,b]=window.__pair; const hold=()=>{ a.x=0; a.z=17; b.x=1.3; b.z=17.4; }; for(let i=0;i<66;i++){ d.step(1/60,1); hold(); } const wo=window.__weapons.mounted(); wo.updateWorldMatrix(true,false); const o=wo.localToWorld(new THREE.Vector3(0,0,0)), y=wo.localToWorld(new THREE.Vector3(0,1,0)).sub(o).normalize(); const to=new THREE.Vector3(a.x-o.x,0,a.z-o.z).normalize(); return {point:window.__aim.point(),horiz:+(y.x*to.x+y.z*to.z).toFixed(2),up:+y.y.toFixed(2),holding:window.__aim.holding(),charge:window.__aim.charge(),bolts:window.__staff.bolts(),hp:[a.hp,b.hp]}; });
check("charging, the witch levels her staff at the goblin (its head leads toward it, lifted, not upright), no bolt yet",r7.holding&&r7.charge===1&&r7.point>.9&&r7.horiz>.6&&r7.up>.15&&r7.up<.8&&r7.bolts===0&&r7.hp[0]===500,JSON.stringify(r7));
await page.screenshot({path:SP+"/parts/shots/aim-staff-hold.png"});
await up();
const r8=await page.evaluate(()=>{ const d=window.__dd; const [a,b]=window.__pair; for(let i=0;i<70;i++){ d.step(1/60,1); a.x=0; a.z=17; b.x=1.3; b.z=17.4; } return {a:+(500-a.hp).toFixed(1),b:+(500-b.hp).toFixed(1),dmg:d.heroDmg()}; });
check("let go: the full-charge bolt hits for 130% and bursts on the goblin beside it for half that",Math.abs(r8.a-r8.dmg*1.3)<.25&&r8.b>0&&r8.b<r8.a,JSON.stringify(r8));
// 6) building: the reticle stays out of the way
const r9=await page.evaluate(async()=>{ const d=window.__dd; d.step(1/60,60); const k=new KeyboardEvent('keydown',{code:'Digit1',bubbles:true}); window.dispatchEvent(k); d.step(1/60,2); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); return {placing:!!d.ghost(),shown:window.__aim.reticle().shown}; });
check("no reticle while placing a defense",r9.placing&&r9.shown===false,JSON.stringify(r9));
const real=errors.filter(e=>!/Failed to load resource|favicon|pointer ?lock/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
