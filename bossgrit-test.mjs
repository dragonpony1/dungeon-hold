// ===== BOSSES ARE NOT SHOVED (99e-bossgrit.js, build 253). Matt: "the shove back prevents the boss from advancing and attacking structures". A hit that carries a knockback moves an ordinary mob back as before; a boss takes the
// damage and no shove, and a boss standing in the open walks forward to a tower while being hit every frame by the knight's biggest knockback.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8892);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext()).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8892/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__bossgrit,null,{timeout:90000});
const r=await page.evaluate(()=>{ const d=window.__dd, B=window.__bossgrit; d.start(); d.step(1/60,10); for(const e of d.enemies) d.kill(e); d.step(1/60,5);
  const mk=(kind,x,z)=>{ const e=d.spawn(kind,"N"); e.x=x; e.z=z; e.y=0; e.hp=e.max=99999; e.spd=0; e.atk=999; e.holdT=1e9; return e; };
  const g=mk("goblin",0,14), t=mk("trollboss",4,14); const gx=g.x, gz=g.z, tx=t.x, tz=t.z;
  B.hurt(g,1,0,3); B.hurt(t,1,0,3);   // the same shove, straight back, on both
  return { kinds:B.kinds(), goblinMoved:+Math.hypot(g.x-gx,g.z-gz).toFixed(2), bossMoved:+Math.hypot(t.x-tx,t.z-tz).toFixed(2), bossHpLost:99999-t.hp, shoved:B.shoved() }; });
check("the bosses are covered (the five, since build 308 the Archhag, Avery, since build 529 Sir Bullion, since build 532 the Corruptor)",r.kinds.length===9&&["cyclops","pigflail","pigdagger","pigsling","trollboss","archhag","avery","bullion","corruptor"].every(k=>r.kinds.includes(k)),JSON.stringify(r.kinds));
check("a goblin is shoved back by a knockback hit as before; a boss is not moved at all but still takes the damage",r.goblinMoved>.5&&r.bossMoved===0&&r.bossHpLost>=1,JSON.stringify(r));
const r2=await page.evaluate(()=>{ const d=window.__dd, B=window.__bossgrit; for(const e of d.enemies) d.kill(e); d.step(1/60,5);
  const t=d.spawn("trollboss","N"); t.hp=t.max=99999; t.atk=999; const z0=t.z; let moved=0;   // let him walk his own route; hit him every frame with the biggest knockback the game has (the whirlwind's)
  for(let f=0;f<120;f++){ B.hurt(t,1,0,3); d.step(1/60,1); } return { z0, z1:t.z, walked:+Math.abs(t.z-z0).toFixed(2), x1:t.x }; });
check("hit every frame for two seconds with the whirlwind's shove, a boss still walks on (it gets somewhere)",r2.walked>1,JSON.stringify(r2));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,2).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
