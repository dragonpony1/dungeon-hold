// ===== EVERY TOWER COUNTS ITS KILLS (build 463). Matt: "when I look at a tower one of the little numbers should show how many mobs it's killed".
// Checked: a ring of ballistas, cannons, frost and a storm halo round the Heartroot with goblins walking in -- the towers' kills add up to the mobs they killed, each tower's own number; a mob the hero kills
// is nobody's; the tower card shows 💀 Kills with the tower's number.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9015,{dist:"./dist"}); const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await (await browser.newContext({viewport:{width:1200,height:760}})).newPage(); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9015/?silent&nogate&map=1",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel(),null,{timeout:120000});
const out=await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); window.__freeze=true; d.S.crystal=d.S.crystal2=1e9; d.setHero(-60,-60,0); d.addMana(1e7); d.S.phase='wave';
  const kinds=['harpoon','acorn','harpoon','acorn','frost','zap']; kinds.forEach((k,i)=>{ const a=i/kinds.length*6.283; d.placeDefAt(k,Math.cos(a)*5,Math.sin(a)*5,0); }); d.step(1/60,30);
  const towers=d.defs.slice(); const lane=d.waveComp(d.map().wbase+1).q[0].lane; const K0=d.S.kills; let spawned=0;
  for(let t=0;t<60;t+=1/60){ if(spawned<30&&Math.round(t*60)%40===0){ d.spawn('goblin',lane); spawned++; } d.step(1/60,1); d.S.crystal=d.S.crystal2=1e9; for(const x of towers) x.hp=x.max; }
  const mobKills=d.S.kills-K0, towerKills=towers.reduce((s,x)=>s+(x.kills|0),0);
  // the hero's kill: nobody's
  d.spawn('goblin',lane); const m=d.enemies[d.enemies.length-1]; const before=towerKills; d.kill(m); d.step(1/60,2); const after=towers.reduce((s,x)=>s+(x.kills|0),0);
  // the card
  const best=towers.slice().sort((a,b)=>(b.kills|0)-(a.kills|0))[0]; d.S.phase='build'; d.setHero(best.x+1.6,best.z+1.6,0); d.step(1/60,20); const card=document.getElementById('defcard');
  return { spawned, mobKills, towerKills, per:towers.map(x=>x.kind+':'+(x.kills|0)), heroKillCredited:after-before, best:best.kills|0, card:card?card.innerText.replace(/\s+/g,' ').slice(0,200):null, total:window.__killcount.total() }; });
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?'PASS ':'FAIL ')+n+(d?'  -> '+d:'')); };
check('the towers killed most of the goblins, and their kills add up to no more than the goblins that died',out.towerKills>=out.mobKills*.8&&out.towerKills<=out.mobKills,JSON.stringify(out));
check('more than one tower has kills of its own',out.per.filter(s=>!s.endsWith(':0')).length>=2,out.per.join(' '));
check('a mob the hero kills is nobody\'s',out.heroKillCredited===0,''+out.heroKillCredited);
check('the tower card shows 💀 Kills with that tower\'s number',!!out.card&&/Kills ([0-9]+)/.test(out.card)&&out.per.includes((/Ballista/.test(out.card)?'harpoon':/Cannon/.test(out.card)?'acorn':/Halo/.test(out.card)?'zap':'frost')+':'+out.card.match(/Kills ([0-9]+)/)[1])&&+out.card.match(/Kills ([0-9]+)/)[1]>0,out.card);
check('no page errors',errors.length===0,JSON.stringify(errors.slice(0,2))); await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
