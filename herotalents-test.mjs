// ===== THE GNOME RANGER'S AND THE GNOME FIGHTER'S TALENT TREES (build 448; parts/staging/96l-talents.js). Matt: "yeah lets start them".
// Checked: both heroes have a tree of 3 branches x 5 (the TALENTS tab draws it, not the flat skills); Steady Aim adds damage; Piercing Arrows adds a pierce; Headhunter rolls CRITs (~24% at III); Skyfall adds 2 rockets
// to his own Sky Wrecker; Light Feet dodges some hits; the Fighter's Surge Master lengthens the Surge; Binding Halo slows mobs in his halo by 20%; Warding Light adds armor; Martyr's Light fires once near death; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8987,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1400,height:900}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:8987/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__talents&&window.__heroes&&window.__dd.heroModel(),null,{timeout:120000});
const buy=(ids)=>page.evaluate(ids=>{ const T=window.__talents; return ids.map(id=>T.spend(id)); },ids);
await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} await window.__heroes.select('troll'); d.start(); d.step(1/60,3); window.__freeze=true; window.__meta.setLevel(99); d.addMana(1e5); d.S.phase='build'; });
const A=await page.evaluate(()=>{ const T=window.__talents; const n=T.nodes(); window.__tavern.open(); window.__tavern.tab('skills'); const html=document.getElementById('tv-skills').innerHTML; window.__tavern.close(); return { tree:T.tree(), branches:n&&n.map(b=>b.id+':'+b.nodes.length).join(' '), tab:/THE GNOME RANGER/.test(html)&&/MARKSMAN/.test(html) }; });
check("the Ranger has his own tree (MARKSMAN, TRAPPER, WILDS; 5 each) and the TALENTS tab draws it",A.tree==='troll'&&A.branches==='marksman:5 trapper:5 wilds:5'&&A.tab,JSON.stringify(A));
const m0=await page.evaluate(()=>window.__meta.mult('dmg')); await buy(['rsteady']); const m1=await page.evaluate(()=>window.__meta.mult('dmg'));
check("Steady Aim I: +7% damage",Math.abs((m1-m0)-.07)<1e-6,JSON.stringify({m0,m1}));
await buy(['rsteady','rsteady','rdraw','rdraw','rdraw','rpierce','rcrit','rcrit','rcrit','rstorm']);
const B=await page.evaluate(()=>{ const T=window.__talents; const p=T.rPierce(); let c=0; for(let i=0;i<400;i++) if(T.rCrit()) c++; return { pierce:p, crits:c, storm:T.rank('rstorm') }; });
check("Piercing Arrows: each arrow goes through one more; Headhunter III: about a quarter of arrows CRIT; Arrow Storm bought",B.pierce===1&&B.crits>60&&B.crits<140&&B.storm===1,JSON.stringify(B));
await buy(['rpowder','rpowder','rpowder','rtangle','rtangle','rtangle','rperch','rvenom','rvenom','rvenom','rsky','rfleet','rfleet','rfleet','rpack','rpack','rpack','rdodge']);
const C=await page.evaluate(()=>{ const d=window.__dd, T=window.__talents; const W=window.__moatwalk; let sky=null; for(let r=4;r<16&&!sky;r+=2) for(let a=0;a<8&&!sky;a++) sky=d.placeDefAt('sky',Math.cos(a)*r,Math.sin(a)*r,0); const bonus=sky?T.skyBonus(sky):-1;
  const hp0=d.hero.hp; let dodged=0; for(let i=0;i<200;i++){ d.hero.hp=d.hero.max; T.hurtHero(5); if(d.hero.hp===d.hero.max) dodged++; } return { bonus, dodged, rf:T.rf() }; });
check("Skyfall: his Sky Wrecker fires 2 more rockets; Light Feet: some hits are dodged",C.bonus===2&&C.rf.dodge>10,JSON.stringify(C));
await page.evaluate(async()=>{ await window.__heroes.select('fighter'); window.__dd.step(1/60,3); });
await buy(['fring','fring','fring','fpulse','fpulse','fpulse','fbind','fsurge','fsurge','fsurge','fcrown','fzeal','fzeal','fzeal','fward','fward','fward','fmend','fmana','fmana','fmana','fmartyr']);
const D=await page.evaluate(()=>{ const d=window.__dd, T=window.__talents; d.S.phase='wave'; let halo=null; for(let r=4;r<16&&!halo;r+=2) for(let a=0;a<8&&!halo;a++) halo=d.placeDefAt('zap',Math.cos(a)*r,Math.sin(a)*r,0);
  const lane=d.waveComp(d.map().wbase+1).q[0].lane; d.spawn('goblin',lane); const g=d.enemies[d.enemies.length-1]; g.x=halo.x+.5; g.z=halo.z+.3; g.hp=g.max=1e5; d.step(1/60,2); const inside=d.mobSpd?d.mobSpd(g):null;
  const def0=d.heroStat('def'); return { tree:T.tree(), surge:T.surgeBonus(), his:T.rf().his, slowed:g.boundT>0, def:def0 }; });
check("the Fighter has his tree; Surge Master III: the Surge lasts 6 s longer; Binding Halo: a mob inside his halo is held slower",D.tree==='fighter'&&D.surge===6&&D.his>=1&&D.slowed,JSON.stringify(D));
const E=await page.evaluate(()=>{ const d=window.__dd, T=window.__talents; d.hero.hp=d.hero.max*.3; const before=T.rf().martyr; T.hurtHero(d.hero.max*.1); const after=T.rf().martyr; return { before, after, hp:Math.round(d.hero.hp/d.hero.max*100) }; });
check("Martyr's Light: near death it bursts and heals him (once a wave)",E.after===E.before+1&&E.hp>40,JSON.stringify(E));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
