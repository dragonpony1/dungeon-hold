// ===== THE FOREST SET, the starter (93-gearsets.js): training wheels for map one. Uncommon+ from wave 1 at 30% of such
// drops (fading to 6%), never on a Common, never before the first horn; small readable bonuses at three and five pieces
// on the same multiplier hook as the Void's; BRAMBLE roots what the hero hits; the green blade, wood staff and bow, the
// forest mannequin stand in; the full set's locker reward is the Forest Armor Stand; and the first set piece a player ever
// sees lands with a one-line lesson, once per browser.
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path";
const SP=path.dirname(new URL(import.meta.url).pathname); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8909, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const page=await browser.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto(BASE+"/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__forest&&window.__void&&window.__voidset&&window.__weapons&&window.__heroes,null,{timeout:60000});
await page.evaluate(()=>{ window.__freeze=true; try{ localStorage.removeItem('dd_setHint'); localStorage.removeItem('dd_gear_carried'); localStorage.removeItem('dd_hideout_unlocks'); }catch(e){} window.__dd.start(); window.__dd.step(1/60,3); });
// drop odds by wave, from the real roll
const odds=await page.evaluate(()=>{ const d=window.__dd, F=window.__forest, V=window.__void; const at=(w,minR,n)=>{ d.S.wave=w; let f=0,v=0; for(let i=0;i<n;i++){ const it=d.rollItem(minR,undefined,3); if(F.isForest(it)) f++; else if(V.isVoid(it)) v++; } return {f:f/n,v:v/n}; };
  return {w0:at(0,1,400),w1:at(1,1,1500),w3:at(3,1,1500),w6:at(6,1,1500),w12:at(12,1,1500),common:(()=>{ d.S.wave=2; let f=0; for(let i=0;i<600;i++){ const it=d.rollItem(0,undefined,2); if(it.rarity===0&&F.isForest(it)) f++; } return f; })(),chance:[0,1,3,6,12].map(w=>+F.chance(w).toFixed(2))}; });
check("the Forest's chance curve: 0 before wave 1, 30% through wave 3, four points a wave down to a 6% floor",odds.chance.join()==="0,0.3,0.3,0.18,0.06",JSON.stringify(odds.chance));
check("wave 1: about 30% of Uncommon+ rolls are Forest pieces and none are Void (the Void waits for wave 4)",odds.w1.f>.24&&odds.w1.f<.36&&odds.w1.v===0&&odds.w0.f===0,JSON.stringify({w0:odds.w0,w1:odds.w1}));
check("wave 6: the Forest has faded to about 18% of Uncommon+ rolls and the Void has arrived (7% of the Rare+ among them)",odds.w6.f>.13&&odds.w6.f<.23&&odds.w6.v>.005&&odds.w6.v<.06,JSON.stringify(odds.w6));
check("wave 12: the Forest sits at its 6% floor",odds.w12.f>.03&&odds.w12.f<.1,JSON.stringify(odds.w12));
check("a Common never carries the set (Uncommon is the floor)",odds.common===0,String(odds.common));
// the first set piece a player ever sees: one lesson, once
const hint=await page.evaluate(async()=>{ const d=window.__dd, F=window.__forest; const T=document.getElementById('toast'); d.setHero(0,10,0); const it=d.rollItem(1,'charm',2); it.rarity=1; F.make(it); d.dropLoot(it,d.hero.x+2,d.hero.z); await new Promise(r=>setTimeout(r,1700)); const first=T.textContent; const flag=localStorage.getItem('dd_setHint');
  const it2=d.rollItem(1,'amulet',2); it2.rarity=1; F.make(it2); d.dropLoot(it2,d.hero.x+3,d.hero.z); T.textContent='—'; await new Promise(r=>setTimeout(r,1700)); return {first,flag,second:T.textContent}; });
check("the first set piece lands with the lesson (wear three for a bonus, five for the power), flagged in localStorage; the second says nothing more",/A SET PIECE — wear three of the Forest for a bonus, all five for its power/.test(hint.first)&&hint.flag==='1'&&hint.second==='—',JSON.stringify(hint));
// three pieces, five pieces: the bonuses on the multiplier hook, the sheet text, the models that stand in
const wear=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, F=window.__forest; M.reset(); d.resetGear(); const ids=[]; const T=document.getElementById('toast'); const m=k=>+(M.mult(k)||0).toFixed(3); const before={hp:m('hp'),move:m('move'),dmg:m('dmg')};
  let last=''; const mk=slot=>{ const it=d.rollItem(1,slot,4); it.rarity=1; F.make(it); M.onPickup(it); M.equip(it.id); ids.push(it.id); last=T.textContent; /* the SET BONUS toast, before a step lets the reward toast follow it */ d.step(1/60,2); return it; };
  mk('weapon'); mk('armor'); const two={lvl:F.lvl(),hp:m('hp')}; mk('charm'); const three={lvl:F.lvl(),hp:m('hp'),move:m('move'),dmg:m('dmg'),toast:last}; mk('amulet'); mk('familiar'); const five={lvl:F.lvl(),hp:m('hp'),move:m('move'),dmg:m('dmg'),toast:last,after:T.textContent};
  return {before,two,three,five,ids,setText:window.__sets.SETS['of the Forest'].text}; });
check("two pieces: nothing; three: +8% health and +4% move on the multiplier hook, with the SET BONUS toast",wear.two.lvl===0&&wear.two.hp===wear.before.hp&&wear.three.lvl===3&&+(wear.three.hp-wear.before.hp).toFixed(3)===.08&&+(wear.three.move-wear.before.move).toFixed(3)===.04&&/SET BONUS · of the Forest \(3\/5\)/.test(wear.three.toast),JSON.stringify({before:wear.before,two:wear.two,three:wear.three}));
check("five: +15% health, +8% move, +10% hero damage, and the BRAMBLE line in the big toast",wear.five.lvl===5&&+(wear.five.hp-wear.before.hp).toFixed(3)===.15&&+(wear.five.move-wear.before.move).toFixed(3)===.08&&+(wear.five.dmg-wear.before.dmg).toFixed(3)===.1&&/BRAMBLE/.test(wear.five.toast)&&/\(5\/5\)/.test(wear.five.toast),JSON.stringify({five:wear.five}));
// the full set's locker reward
const reward=await page.evaluate(()=>{ window.__voidset.check(); const list=window.__voidset.carried(); const r=list.find(x=>x.id==='reward-stand-forest'); return {n:list.filter(x=>x.reward).length,r,led:window.__voidset.unlocks()['stand-forest']}; });
check("the full Forest set puts the Forest Armor Stand in the hideout's wall locker: an uncommon armor-slot reward with its reason, once, and the game's ledger remembers",reward.n===1&&!!reward.r&&reward.r.reward===true&&reward.r.rarity===1&&reward.r.slot==='armor'&&reward.r.reason==='The Forest set, complete'&&reward.r.model==='armor-stand-forest.glb'&&!!reward.led&&reward.led.rewardId==='reward-stand-forest',JSON.stringify(reward));
// the stand-ins: the green blade in the knight's hand (and the knight swings a real cone, which is what the five-piece powers ride)
await page.evaluate(()=>window.__heroes.select('knight'));
const sword=await page.waitForFunction(()=>{ for(let i=0;i<3;i++) window.__dd.step(1/60,1); const s=window.__weapons.state(); return s.mounted&&/^venom\|/.test(s.key)?s.key:false; },null,{timeout:90000}).then(h=>h.jsonValue()).catch(()=>null);
check("a Forest weapon in the knight's hand is the green (venom) blade, the set's stand-in",!!sword&&/^venom\|/.test(sword),String(sword));
// BRAMBLE: a hit roots the target
const bramble=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) e.dead=true; d.setHero(0,10,0); const e=d.spawn('goblin','N'); e.hp=1e9; e.spd=0; e.x=d.hero.x; e.z=d.hero.z+1.4; e.slowT=0; d.step(1/60,2); const hp0=e.hp; d.swing(); let hit=false, maxSlow=0, atFrame=-1; for(let i=0;i<90;i++){ d.step(1/60,1); e.x=d.hero.x; e.z=d.hero.z+1.4; if(e.hp<hp0) hit=true; if((e.slowT||0)>maxSlow){ maxSlow=e.slowT; atFrame=i; } } /* the whole swing: the knight's cone lands partway through the animation (hitCone is synchronous, so the wrapper sees the HP drop and fires BRAMBLE); the familiar piece's pet may hit first, without a root */ return {hit,maxSlow:+maxSlow.toFixed(2),atFrame}; });
check("BRAMBLE: the knight's blow on a goblin roots it (slowT reaches 1.5 s during the swing)",bramble.hit&&bramble.maxSlow>=1.4,JSON.stringify(bramble));
const aura=await page.evaluate(()=>{ const a=window.__packs.aura(); return {on:a.on,green:a.col===0x5ad05a||String(a.col).toLowerCase().includes('5ad05a'),col:String(a.col)}; });
check("the full-set aura is on, in the Forest's green",aura.on&&aura.green,JSON.stringify(aura));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
