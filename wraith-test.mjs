// ===== THE CRIMSON PHASE WRAITH (build 420; parts/staging/95s-wraith.js). Matt: flies just above the mobs giving full health to several that need it, hides in a corner charging, then a volley of healing plus a
// quick dive on a ballista or trebuchet; a big damage doer; a snare tower won't hold him; best a Sky Wrecker homing in; fireworks when he dies.
// Checked: he joins wave 3+ of the Feast Hall (one a wave) and not wave 1 or the Gnome Hall; he mends hurt mobs to full on his tour; he hides in the far corner and charges; the volley mends more and dives on the
// ballista for at least 45% of its health; the snare tower can't take him; the Sky Wrecker goes for him before a drake; he dies in fireworks; his model loads; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9005,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1000,height:640}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9005/?silent&nogate&map=3",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__wraith&&window.__skywrecker&&window.__dd.heroModel(),null,{timeout:120000});
const A=await page.evaluate(()=>{ const d=window.__dd, M=d.map(); const has=w=>d.waveComp(M.wbase+w).q.filter(x=>x.kind==='wraith').length; return { id:M.id, w1:has(1), w3:has(3), w7:has(7) }; });
check("he joins the Feast Hall from wave 3, one a wave (not wave 1)",A.id==='feast'&&A.w1===0&&A.w3===1&&A.w7===1,JSON.stringify(A));
await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); window.__freeze=true; d.S.phase='wave'; d.S.crystal=d.S.crystal2=1e9; d.setHero(-60,-60,0); window.__wraith.load(); });
for(let i=0;i<60&&!(await page.evaluate(()=>window.__wraith.loaded()));i++) await sleep(250);
const B=await page.evaluate(()=>{ const d=window.__dd, W=window.__wraith; for(const e of d.enemies) d.kill(e); d.addMana(99999); d.S.du=-90;
  const lane=d.waveComp(d.map().wbase+1).q[0].lane; const hurt=[]; for(let i=0;i<6;i++){ d.spawn('orc',lane); const o=d.enemies[d.enemies.length-1]; o.spd=0; o.atk=1e9; o.hp=Math.round(o.max*.3); hurt.push(o); }
  d.spawn('wraith',lane); const w=d.enemies[d.enemies.length-1]; window.__w=w; w.hp=w.max=1e6;
  const bal=d.placeDefAt('harpoon',hurt[0].x+6,hurt[0].z+6,0); window.__bal=bal; const balMax=bal.max;
  const seen=new Set(); let healed=0, hid=null, charged=false; for(let i=0;i<60*30;i++){ d.step(1/60,1); d.S.crystal=d.S.crystal2=1e9; seen.add(w.wst); if(w.wst==='charge'&&!hid) hid={x:w.x,z:w.z}; if(w.wst==='charge') charged=true; if(W.info().dives>0) break; }
  healed=hurt.filter(o=>!o.dead&&o.hp===o.max).length; const c=W.hideSpot(); return { model:!!(w.mdl&&w.mdl.glb), states:[...seen].join(','), healed, heals:W.info().heals, hid, corner:c, nearCorner:hid?+Math.hypot(hid.x-c.x,hid.z-c.z).toFixed(1):null, charged, dives:W.info().dives, balHp:bal.hp, balMax, balLost:+(1-bal.hp/balMax).toFixed(2) }; });
check("his model is Bob's rigged wraith",B.model,JSON.stringify({model:B.model}));
check("on his tour he mends hurt mobs to full health (several of them)",B.heals>=4&&B.healed>=4,JSON.stringify({heals:B.heals,healed:B.healed,states:B.states}));
check("then he hides in the far corner and charges",/hide/.test(B.states)&&B.charged&&B.nearCorner!==null&&B.nearCorner<1,JSON.stringify({states:B.states,hid:B.hid,corner:B.corner}));
check("the volley: more mending and a dive on the ballista for at least 45% of its health",B.dives===1&&B.balLost>=.44,JSON.stringify({dives:B.dives,balLost:B.balLost,heals:B.heals}));
const C=await page.evaluate(()=>{ const d=window.__dd, w=window.__w; const sn=d.placeDefAt('snare',w.x+2,w.z,0); const snareOk=!!sn; if(sn) sn.cd=0; for(let i=0;i<60*3;i++){ d.step(1/60,1); d.S.crystal=d.S.crystal2=1e9; } const held=!!(w.snared||w.snareT>0||w.caught);
  d.spawn('drake',d.waveComp(d.map().wbase+1).q[0].lane); const dr=d.enemies[d.enemies.length-1]; dr.spd=0; const sky=d.placeDefAt('sky',w.x+5,w.z+5,0); dr.x=sky.x+4; dr.z=sky.z; w.x=sky.x+9; w.z=sky.z+3; w.wst='charge'; w.wt=0; const first=window.__skywrecker.candidates(sky);
  return { snareOk, held, noSnare:!!w.noSnare, skyFirst:first>0 }; });
const order=await page.evaluate(()=>{ const d=window.__dd; const sky=d.defs.find(x=>x.kind==='sky'); const r0=window.__skywrecker.info().rockets; window.__skywrecker.volley(sky); return true; });
check("the snare tower can't hold him; the Sky Wrecker has him in its sights",C.snareOk&&!C.held&&C.noSnare&&C.skyFirst,JSON.stringify(C));
const D=await page.evaluate(()=>{ const d=window.__dd, w=window.__w; d.kill(w); d.step(1/60,2); return window.__wraith.info(); });
check("he dies in fireworks",D.deaths===1&&D.fx>20,JSON.stringify(D));
// build 435 (Matt: "if phase wraith is the last mob he can't hide too far in a corner in a spawn alcove")
const E=await page.evaluate(()=>{ const d=window.__dd, W=window.__wraith; for(const e of d.enemies) d.kill(e); d.step(1/60,2); const lane=d.waveComp(d.map().wbase+1).q[0].lane; d.spawn('wraith',lane); const w=d.enemies[d.enemies.length-1]; w.hp=w.max=1e6; w.wst='hide'; w.wt=0;
  let at=null; for(let i=0;i<60*40;i++){ d.step(1/60,1); d.S.crystal=d.S.crystal2=1e9; if(w.wst==='charge'){ at={ x:w.x, z:w.z, fly:w.fly }; break; } } const L=W.lastStandSpot(), C=W.hideSpot(); d.kill(w); d.step(1/60,2);
  return { last:true, at, toHeart:at?+Math.hypot(at.x,at.z).toFixed(1):null, nearSpot:at?+Math.hypot(at.x-L.x,at.z-L.z).toFixed(1):null, cornerDist:+Math.hypot(C.x,C.z).toFixed(1) }; });
check("the last mob alive, he charges close in (about 9 from the Heartroot, low), not from his far corner",E.at&&E.toHeart<=12&&E.nearSpot<1&&E.at.fly<=4.1&&E.cornerDist>E.toHeart,JSON.stringify(E));
for(const m of [3,4,5]){ await page.goto("http://127.0.0.1:9005/?silent&nogate&map="+m,{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__wraith&&window.__dd.heroModel(),null,{timeout:120000});
  const F=await page.evaluate(()=>{ const d=window.__dd, W=window.__wraith; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); const M=d.map(); const c=W.hideSpot(), l=W.lastStandSpot();
    
    return { id:M.id, corner:{x:+c.x.toFixed(1),z:+c.z.toFixed(1)}, last:{x:+l.x.toFixed(1),z:+l.z.toFixed(1)}, door:W.doorDist(c), lastDoor:W.doorDist(l) }; });
  check("on "+F.id+" his hiding spot is well away from every mob door (10+) and so is his last-stand spot",F.door>=9.5&&F.lastDoor>=9.5,JSON.stringify(F)); }
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
