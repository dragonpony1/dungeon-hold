// ===== THE ELECTRIFIER (build 386; parts/staging/96n-electrifier.js). Matt: "electrifier incoming" + Bob's four animated Shocker Towers. Checked: it is the Gnome Battle Witch's fourth tower (her hotbar, key 4); placed, it wears Bob's model and plays
// its animation; Mark I strikes one mob, Mark II two, Mark III chains on to more mobs, Mark IV a storm on every mob in reach (six at most); it hits a drake in the air; it leaves alone what is out of reach; each mark wears its own model.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8987,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:900,height:560}})).newPage(); page.on("pageerror",e=>errors.push(String(e))); page.on("console",m=>{ if(m.type()==='warning'&&/shock|defense model/i.test(m.text())) errors.push('warn '+m.text().slice(0,150)); });
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
await page.goto("http://127.0.0.1:8987/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__electrifier&&window.__heroes&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(async()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; await window.__heroes.select('witch'); d.start(); d.step(1/60,5); window.__freeze=true; });
const H=await page.evaluate(()=>({ unlocks:window.__heroes.unlocks(), slot:!!document.getElementById('slot-shock') }));
check("the Electrifier is the Gnome Battle Witch's fourth tower (key 4) with its hotbar slot",H.unlocks.join()==="frost,ball,pit,shock"&&H.slot,JSON.stringify(H));
const setup=(lvl,n,opts)=>page.evaluate(({lvl,n,opts})=>{ const d=window.__dd; for(const e of d.enemies) e.dead=e.dead||.001; for(const t of d.defs.slice()) if(t.kind==='shock'){ t.hp=0; } d.S.mana=99999; d.S.du=0; d.S.phase='wave'; d.S.crystal=1e9; d.setHero(-14,12,0);
  let t=window.__shockT; if(!t||!d.defs.includes(t)){ t=d.placeDefAt('shock',0,-8,0); window.__shockT=t; } t.lvl=lvl; t.cd=0; const mobs=[]; for(let i=0;i<n;i++){ d.spawn(opts&&opts.kind||'goblin','N'); const g=d.enemies[d.enemies.length-1]; g.hp=g.max=1e6; g.spd=0; g.dmg=0; g.atk=1e9; const a=i/n*6.28; g.x=t.x+Math.cos(a)*(opts&&opts.r||4)+(opts&&opts.dx||0); g.z=t.z+Math.sin(a)*(opts&&opts.r||4); mobs.push(g); }
  window.__mobs=mobs; const b0=window.__electrifier.info().bolts; d.step(1/60,2); return { hurt:mobs.filter(g=>g.hp<g.max).length, bolts:window.__electrifier.info().bolts-b0 }; },{lvl,n,opts});
const m1=await setup(1,5), m2=await setup(2,5), m3=await setup(3,6,{r:2.2}), m4=await setup(4,9);
check("Mark I strikes one mob a shot",m1.hurt===1&&m1.bolts===1,JSON.stringify(m1));
check("Mark II a double strike: two mobs",m2.hurt===2,JSON.stringify(m2));
check("Mark III chain lightning: the bolt leaps on to three more (four mobs hurt in one shot)",m3.hurt===4,JSON.stringify(m3));
check("Mark IV an electrical storm: every mob in reach, six at most",m4.hurt===6&&m4.bolts===6,JSON.stringify(m4));
const fly=await setup(1,1,{kind:'drake'}); check("it hits a drake in the air",fly.hurt===1,JSON.stringify(fly));
const far=await setup(1,3,{r:16}); check("it leaves alone what is out of its reach",far.hurt===0&&far.bolts===0,JSON.stringify(far));
// the model and its animation, each mark its own
const M=await page.evaluate(async()=>{ const d=window.__dd; const t=window.__shockT; const out={}; for(const lvl of [1,2,3,4]){ t.lvl=lvl; for(let i=0;i<300;i++){ d.step(1/60,1); await new Promise(r=>setTimeout(r,10)); if(t.mdl.userData.tpl&&t.mdl.userData.glb&&d.defs.includes(t)){ const T=t.mdl.userData.tpl; if(window.__dd.defTemplate?true:true) break; } } out[lvl]={ glb:!!t.mdl.userData.glb, clips:(t.mdl.userData.tpl&&t.mdl.userData.tpl.clips||[]).map(c=>c.name.slice(0,22)), mix:!!t.__mix }; } return out; });
check("each mark wears Bob's own model and plays its own animation (Strike, Double Strike, Chain Lightning, Electrical Storm)",[1,2,3,4].every(l=>M[l].glb&&M[l].clips.length===1&&M[l].mix)&&/Shocker/.test(M[1].clips[0])&&/Double/.test(M[2].clips[0])&&/Chain/.test(M[3].clips[0])&&/Electrical/.test(M[4].clips[0]),JSON.stringify(M));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
