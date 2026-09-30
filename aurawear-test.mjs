// ===== AURAS WEAR ONLY BY USE + NO TROLL BOSS (build 326). Matt: "mobs shouldnt really hit them for damage, auras i mean ... they can only degrade thru usage. a very small tik of health per
// attack ... a level 4 aura is basically not gonna take any damage" / "so mobs are walking thru them they dont stop and hit" / "you can take the troll boss out, hes a miss". Checked on the
// hall: a goblin walks straight through a Storm Halo on its lane (nothing stops to hit it); a blow, an arrow's worth and a stomp's worth of hurtDef leave it whole; each zap wears .25 off a
// Mark I ring and .005 off a Mark IV; no campaign wave and no Survival boss wave has a troll boss (an ogre leads a boss wave out); no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8980,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1000,height:640}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8980/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__aurawear&&window.__sets8,null,{timeout:120000});
const a=await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,10); d.addMana(99999); for(const e of d.enemies) d.kill(e);
  const k=Object.keys(d.lanes())[0], L=d.lanes()[k], fx=Math.sin(L.face||0), fz=Math.cos(L.face||0); let halo=null;
  for(let s=5;s<14&&!halo;s++){ const n0=d.defs.length; try{ d.placeDefAt('zap',d.cw(L.cx)+fx*s,d.cwz(L.cz)+fz*s,0); }catch(e){} if(d.defs.length>n0) halo=d.defs[d.defs.length-1]; }
  if(!halo) return {placed:false}; window.__halo=halo; const hp0=halo.hp;
  const g=d.spawn('goblin',k); g.hp=g.max=1e6; let closest=99, stoppedAt=0, hitIt=false;
  for(let i=0;i<60*12;i++){ d.setHero(-90,-90,0); d.step(1/60,1); d.S.crystal=1e6; if(d.S.crystal2!==undefined) d.S.crystal2=1e6; const dd=Math.hypot(g.x-halo.x,g.z-halo.z); if(dd<closest) closest=dd; if(g.tgtDef===halo) hitIt=true; }
  return { placed:true, closest:+closest.toFixed(2), hitIt, hp0, hp1:+halo.hp.toFixed(3), worn:+window.__aurawear.worn().toFixed(3), goblinPast:Math.hypot(g.x-halo.x,g.z-halo.z)>2 }; });
check("a goblin walks straight through a Storm Halo on its lane -- it never stops to hit it, and the ring only lost what its own zaps wore off",a.placed&&a.closest<1.2&&!a.hitIt&&a.goblinPast&&Math.abs((a.hp0-a.hp1)-a.worn)<.01,JSON.stringify(a));
const b=await page.evaluate(()=>{ const h=window.__halo, S8=window.__sets8; const hp=h.hp; S8.hurtDef(h,30); S8.hurtDef(h,200); S8.hurtDef(h,5); return { before:hp, after:h.hp, blocked:window.__aurawear.blocked() }; });
check("nothing a mob does hurts a ring: a blow, an arrow's worth and a stomp's worth of damage leave it whole",b.after===b.before&&b.blocked>=3,JSON.stringify(b));
const c=await page.evaluate(()=>{ const d=window.__dd, W=window.__aurawear, h=window.__halo; const k=Object.keys(d.lanes())[0];
  const run=(lvl)=>{ h.lvl=lvl; const w0=W.worn(); let zaps=0; for(let i=0;i<4;i++){ const g=d.spawn('goblin',k); g.x=h.x+.4; g.z=h.z; g.spd=0; g.hp=g.max=1e6; } for(let i=0;i<60*10;i++){ const c0=h.cd; d.step(1/60,1); if(h.cd>c0+1e-6) zaps++; } for(const e of d.enemies) d.kill(e); d.step(1/60,2); const lost=W.worn()-w0; return { zaps, lost:+lost.toFixed(4), per:zaps?+(lost/zaps).toFixed(4):0 }; };   /* measured as wear, not the hp bar: a new mark also raises its max hp (the Mason sync) */
  return { m1:run(1), m4:run(4), wear1:W.wearOf({lvl:1}), wear4:W.wearOf({lvl:4}) }; });
check("each attack wears a sliver: .25 a zap off a Mark I ring, .005 off a Mark IV (basically none)",c.m1.zaps>=3&&Math.abs(c.m1.per-.25)<.01&&c.m4.zaps>=3&&Math.abs(c.m4.per-.005)<.001&&c.m4.lost<.1,JSON.stringify(c));
const t=await page.evaluate(()=>{ const d=window.__dd, M=d.map(); let camp=0; for(let w=1;w<=40;w++) camp+=d.waveComp(w).q.filter(x=>x.kind==='trollboss').length; return { camp, desc:d.waveComp(12).desc }; });
check("no campaign wave has a troll boss any more (wave 12 used to), and its wave line doesn't list one",t.camp===0&&!/TROLL BOSS/.test(t.desc),JSON.stringify(t));
const sctx=await browser.newContext(); await sctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","1"); }catch(e){} }); const sp=await sctx.newPage(); sp.on("pageerror",e=>errors.push(String(e)));
await sp.goto("http://127.0.0.1:8980/?silent&nogate",{timeout:120000}); await sp.waitForFunction(()=>window.__dd&&window.__survival,null,{timeout:120000});
const s=await sp.evaluate(()=>{ const d=window.__dd; window.__survival.set(true); if(!d.survival()) return {survival:false}; const out=[]; for(const sw of [10,20,30]){ const c=d.waveComp(d.map().wbase+sw); out.push({sw,boss:!!c.boss,first:c.q[0]&&c.q[0].kind,trolls:c.q.filter(x=>x.kind==='trollboss').length}); } return {survival:true,out}; });   /* Survival is picked on the title, before the hall starts */
check("Survival's boss waves have no troll boss either: an ogre leads each one out",s.survival&&s.out.every(o=>o.boss&&o.trolls===0&&o.first==='ogre'),JSON.stringify(s));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
