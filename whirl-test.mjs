// ===== THE KNIGHT'S WHIRLWIND SPINS (99f-whirl.js, build 260). Matt: "on the knights special attack he needs to actually spin like a tornado". While he charges his body winds back away from the swing; when it goes off he spins three full
// turns in about a second (through heroYawOff, the model's turn about his feet) inside a tornado of light streaks that fades as he slows, and ends facing the way he started. Only the Knight; damage and cooldown are 73-specials.js's own.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8901);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await browser.newPage({viewport:{width:1100,height:700}}); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8901/?silent&nogate"); await page.waitForFunction(()=>window.__dd&&window.__heroes&&window.__specials&&window.__whirl&&window.__dd.heroModel()&&window.__dd.mobModel("goblin"),null,{timeout:120000});
async function pick(id,re){ await page.evaluate(i=>window.__heroes.select(i),id); await page.waitForFunction(r=>new RegExp(r).test(window.__dd.heroModel().label),re,{timeout:90000}); }
await pick("knight","Knight");
const r=await page.evaluate(()=>{ const d=window.__dd, S=window.__specials, W=window.__whirl; d.start(); d.step(1/60,20); for(const e of d.enemies) d.kill(e); d.setHero(0,10,0); d.step(1/60,5); S.forceReady();
  const gob=d.spawn("goblin","N"); gob.x=0; gob.z=12.5; gob.y=0; gob.spd=0; gob.hp=gob.max=9999; const hp0=gob.hp; d.step(1/60,3);
  const out={}; out.idle=W.state(); S.press(); d.step(1/60,20); out.wind1=W.state(); d.step(1/60,40); out.wind2=W.state();   // 0.33 s then 1.0 s: fully wound at the top
  d.step(1/60,20); out.fired=W.state(); out.hurt=hp0-gob.hp;   // 1.2 s in: it went off
  let maxA=0, spinFrames=0, maxTorn=0, maxOp=0; for(let f=0;f<80;f++){ d.step(1/60,1); const s=W.state(); maxA=Math.max(maxA,s.angle); if(s.spinning) spinFrames++; maxTorn=Math.max(maxTorn,s.tornados); maxOp=Math.max(maxOp,s.opacity); }
  out.spin={maxA:+maxA.toFixed(2),turns:+(maxA/(2*Math.PI)).toFixed(2),spinFrames,maxTorn,maxOp}; out.end=W.state(); d.step(1/60,60); out.after=W.state(); out.cd=S.cooldown(); return out; });
check("idle: no wind-up, no spin, no tornado",r.idle.angle===0&&!r.idle.spinning&&r.idle.tornados===0,JSON.stringify(r.idle));
check("charging, the Knight winds back away from the swing (a turn of the model that grows with the charge, about 50 degrees at most)",r.wind1.angle<-.1&&r.wind2.angle<r.wind1.angle&&r.wind2.angle>=-.95&&r.wind1.charging,JSON.stringify([r.wind1,r.wind2]));
check("when it goes off it spins: the model's turn reaches about three full turns (6 pi) within about a second, and a tornado stands round him",r.fired.spinning&&r.spin.turns>2.7&&r.spin.turns<3.3&&r.spin.spinFrames>=48&&r.spin.spinFrames<=70&&r.spin.maxTorn>=1&&r.spin.maxOp>.2,JSON.stringify({fired:r.fired,spin:r.spin}));
check("the special itself is unchanged: the goblin in range took its hit at the moment it went off, and the cooldown started",r.hurt>0&&r.cd>6,JSON.stringify({hurt:r.hurt,cd:r.cd}));
check("afterwards he is facing the way he was (the turn is back to zero) and the tornado is gone",Math.abs(r.after.off)<1e-6&&r.after.tornados===0&&!r.after.spinning,JSON.stringify(r.after));
// another hero does not spin
await pick("witch","Witch");
const w=await page.evaluate(()=>{ const d=window.__dd, S=window.__specials, W=window.__whirl; d.setHero(0,10,0); d.step(1/60,5); S.forceReady(); S.press(); d.step(1/60,90); let spun=false, torn=0; for(let f=0;f<60;f++){ d.step(1/60,1); const s=W.state(); if(s.spinning) spun=true; torn=Math.max(torn,s.tornados); } return { spun, torn, off:W.state().off }; });
check("the Witch's Starfall does not spin anyone or raise a tornado",!w.spun&&w.torn===0&&w.off===0,JSON.stringify(w));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
