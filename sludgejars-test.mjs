// ===== SLUDGE JARS (99g-sludgejars.js, build 270; hideout build 61). Matt: "Could add sludge jars to dropped loot by mobs" -> "Yeah go on that". Checked: a wave's ordinary mobs share one budget of sludge
// (each mob's chance is the budget times its weight over the wave's, over what its jar is worth -- so the whole wave is worth BUDGET), rolls land at those chances with the right jar kinds, ogres and bosses always
// pay Legendary, a kill really drops jars, walking over one banks it straight into the hideout's hand-off and the HUD counter, jars left on the floor fly to you when the room is won, and the hideout takes the
// banked jars into its four sludges on its first open and again on a later visit.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8910);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8910/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__jars&&window.__meta&&window.__hideout,null,{timeout:120000});
const a=await page.evaluate(()=>{ const d=window.__dd, J=window.__jars; try{ window.__trainer.skip(); }catch(e){} window.__meta.reset&&window.__meta.reset(); d.resetGear(); d.start(); d.step(1/60,20); for(const e of d.enemies) d.kill(e); J.clear();
  const out={tut:J.tut,budget:J.budget}; const waves={};
  for(let w=1;w<=7;w++){ d.S.wave=w-(d.map().wbase||0); const q=d.waveComp(w).q, VAL=[1/27,1/9,1/3,1], R={goblin:[.85,.15,0,0],archer:[0,.8,.2,0],orc:[0,.7,.3,0],drake:[0,0,.85,.15],troll:[0,0,.8,.2]};
    let worth=0; for(const s of q){ const r=R[s.kind]; if(!r) continue; worth+=J.chance(s.kind)*r.reduce((x,p,i)=>x+p*VAL[i],0); } waves[w]={worth:+worth.toFixed(3),goblin:+J.chance('goblin').toFixed(3),orc:+J.chance('orc').toFixed(3)}; }
  out.waves=waves; return out; });
const w7=a.waves[7], w1=a.waves[1];
check("not the tutorial; each wave's ordinary mobs are worth the budget in sludge (wave 1's five goblins at their cap), later waves' bigger crowds each drop less often",!a.tut&&a.budget===.6&&Math.abs(w7.worth-.6)<.01&&w1.goblin===1&&w7.goblin<w1.goblin&&w7.goblin>0,JSON.stringify(a.waves));
const b=await page.evaluate(()=>{ const d=window.__dd, J=window.__jars; d.S.wave=7-(d.map().wbase||0); const N=20000; const cnt={goblin:[0,0,0,0,0],orc:[0,0,0,0,0]};
  for(const k of ["goblin","orc"]) for(let i=0;i<N;i++){ const r=J.roll(k); if(!r.length) cnt[k][4]++; else cnt[k][r[0]]++; }
  const f=k=>({rate:+(1-cnt[k][4]/N).toFixed(3),want:+J.chance(k).toFixed(3),split:cnt[k].slice(0,4).map(n=>+(n/Math.max(1,N-cnt[k][4])).toFixed(2))});
  return { goblin:f("goblin"), orc:f("orc"), ogre:J.roll("ogre"), boss:J.roll("trollboss"), cyclops:J.roll("cyclops"), rat:J.roll("nobody") }; });
check("rolls land at those chances with the right jars (goblins 85% Common / 15% Uncommon, orcs 70% Uncommon / 30% Rare); an ogre always a Legendary, a boss two",Math.abs(b.goblin.rate-b.goblin.want)<.02&&Math.abs(b.goblin.split[0]-.85)<.03&&Math.abs(b.orc.rate-b.orc.want)<.02&&Math.abs(b.orc.split[2]-.3)<.04&&b.ogre.join()==="3"&&b.boss.join()==="3,3"&&b.cyclops.join()==="3,3"&&b.rat.length===0,JSON.stringify(b));
const c=await page.evaluate(()=>{ const d=window.__dd, J=window.__jars; J.clear(); localStorage.removeItem("dd_sludge_in"); d.setHero(0,10,0); d.step(1/60,5);
  d.spawn("ogre"); d.step(1/60,2); const e=d.enemies[d.enemies.length-1]; e.x=14; e.z=14; d.kill(e); const list=J.list(); return { n:list.length, rs:list.map(j=>j.r) }; });
check("a kill really drops jars on the floor (an ogre: its Legendary jar)",c.n>=1&&c.rs.includes(3),JSON.stringify(c));
const dd=await page.evaluate(async()=>{ const d=window.__dd, J=window.__jars; J.clear(); localStorage.removeItem("dd_sludge_in"); const run0=J.run(); d.setHero(0,10,0); d.step(1/60,5); J.spawn(2,1,11); J.spawn(0,-1,9);
  for(let i=0;i<180&&J.list().length;i++) d.step(1/60,1); const hud=document.getElementById("jarHud"); return { left:J.list().length, banked:J.banked(), run0, run:J.run(), hudOn:!!hud&&hud.classList.contains("on"), hudImgs:hud?hud.querySelectorAll("img").length:0, hudText:hud?hud.textContent:"" }; });
check("walking by a jar takes it: banked at once in the hideout's hand-off, counted on the HUD with the jar thumbnails",dd.left===0&&dd.banked.rare===1&&dd.banked.common===1&&dd.run[2]-dd.run0[2]===1&&dd.run[0]-dd.run0[0]===1&&dd.hudOn&&dd.hudImgs>=2,JSON.stringify(dd));
const ck=await page.evaluate(()=>{ const d=window.__dd, J=window.__jars; J.clear(); d.setHero(0,10,0); const c0=J.clinks(); const L=J.spawn(3,12,-8); L.vx=0; L.vz=0; const C=J.spawn(0,-12,-8); C.vx=0; C.vz=0; const R=J.spawn(2,12,-12); R.vx=0; R.vz=0; for(let i=0;i<180;i++) d.step(1/60,1); const out={ clinks:J.clinks()-c0, left:J.list().length }; J.clear(); return out; });
check("build 275 (Matt: hi pitched clink): a Legendary jar clinks once when it lands, the Common and Rare beside it land quietly",ck.clinks===1&&ck.left===3,JSON.stringify(ck));
const s1=await page.evaluate(()=>{ const d=window.__dd, J=window.__jars; J.clear(); d.setHero(0,10,0); const c0=J.banked().uncommon; const j=J.spawn(1,9,-4); j.vx=0; j.vz=0; for(let i=0;i<240;i++) d.step(1/60,1); const settled=J.list().length, y=J.list()[0]&&J.list()[0].y;
  d.setHero(9,-1.5,0); for(let i=0;i<90&&J.list().length;i++) d.step(1/60,1); const hooked=J.list().length===0; J.clear(); const j2=J.spawn(0,-9,-4); j2.vx=0; j2.vz=0; for(let i=0;i<240;i++) d.step(1/60,1); d.setHero(-9,-4,0); for(let i=0;i<20&&J.list().length;i++) d.step(1/60,1); return { settled, y, hooked, walked:J.list().length===0, got:J.banked().uncommon-c0 }; });
check("build 272 (Matt: these jars wont allow me to pick them up): a jar that settled on the floor long before you came still flies to you, and one you stand right on is taken",s1.settled===1&&s1.hooked&&s1.walked&&s1.got===1,JSON.stringify(s1));
const e=await page.evaluate(()=>{ const d=window.__dd, J=window.__jars; J.clear(); d.setHero(0,10,0); const l0=J.banked().legendary; J.spawn(3,30,-30); d.step(1/60,40); const before=J.list().length; const held0=d.S.held, ph=d.S.phase; d.S.held=true; d.S.phase="build"; d.startWave(); const out={ before, after:J.list().length, got:J.banked().legendary-l0, phase:d.S.phase }; d.S.held=held0; d.S.phase=ph; return out; });
check("a jar left out of reach stays put, and is banked for you when you MOVE ON from the held hall",e.before===1&&e.after===0&&e.got===1&&e.phase==="won",JSON.stringify(e));
// the hideout takes them in: on its first open, and again on a later visit (its frame is kept, 'hideout:show')
await page.evaluate(()=>{ localStorage.setItem("dd_sludge_in",JSON.stringify({common:3,uncommon:2,rare:1,legendary:1})); let s=null; try{ s=JSON.parse(localStorage.getItem("dd_hideout_save_v2")); }catch(e){} window.__base=s?{c:s.commonSludge||0,u:s.uncommonSludge||0,r:s.sludge||0,l:s.legendarySludge||0}:{c:0,u:0,r:0,l:0};
  const d=window.__dd; d.S.phase="build"; d.setHero(30,30); window.__hideout.open(); });
let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof SAVE!=="undefined"&&typeof absorbSludgeJars==="function",null,{timeout:120000});
const h1=await f.evaluate(()=>({ c:SAVE.commonSludge, u:SAVE.uncommonSludge, r:SAVE.sludge, l:SAVE.legendarySludge, key:JSON.parse(localStorage.getItem("dd_sludge_in")), pending:JARS_PENDING, build:HIDEOUT_BUILD }));
const base=await page.evaluate(()=>window.__base);
check("the hideout takes the banked jars into its four sludges on its first open, zeroes the hand-off, and has a message waiting for when you walk in",h1.c-base.c===3&&h1.u-base.u===2&&h1.r-base.r===1&&h1.l-base.l===1&&h1.key.common===0&&h1.key.legendary===0&&h1.pending&&h1.pending.common===3&&h1.build>=61,JSON.stringify({h1,base}));
await page.evaluate(()=>{ window.__hideout.close&&window.__hideout.close(); }); await sleep(300);
await page.evaluate(()=>{ localStorage.setItem("dd_sludge_in",JSON.stringify({common:0,uncommon:0,rare:2,legendary:0})); window.__hideout.open(); }); await sleep(800);
const h2=await f.evaluate(()=>({ r:SAVE.sludge, key:JSON.parse(localStorage.getItem("dd_sludge_in")) }));
check("and again on a later visit (the kept frame re-reads the hand-off when shown)",h2.r-h1.r===2&&h2.key.rare===0,JSON.stringify({h2,h1r:h1.r}));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
