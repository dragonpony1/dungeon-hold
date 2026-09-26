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
const odds=await page.evaluate(()=>{ const d=window.__dd, F=window.__forest, V=window.__void; window.__meta.reset(); d.resetGear(); /* no Forest pieces owned: the pity rule stays out of the odds */ const at=(w,minR,n)=>{ d.S.wave=w; let f=0,v=0; for(let i=0;i<n;i++){ const it=d.rollItem(minR,undefined,3); if(F.isForest(it)) f++; else if(V.isVoid(it)) v++; } return {f:f/n,v:v/n}; };
  return {w0:at(0,1,400),w1:at(1,1,1500),w3:at(3,1,1500),w6:at(6,1,1500),w12:at(12,1,1500),common:(()=>{ d.S.wave=2; let f=0; for(let i=0;i<600;i++){ const it=d.rollItem(0,undefined,2); if(it.rarity===0&&F.isForest(it)) f++; } return f; })(),chance:[0,1,3,6,12].map(w=>+F.chance(w).toFixed(2))}; });
check("the Forest's chance curve: 0 before wave 1, 40% through wave 4, five points a wave down to a 10% floor",odds.chance.join()==="0,0.4,0.4,0.3,0.1",JSON.stringify(odds.chance));
check("wave 1: about 40% of Uncommon+ rolls are Forest pieces and none are Void (the Void waits for wave 4)",odds.w1.f>.33&&odds.w1.f<.47&&odds.w1.v===0&&odds.w0.f===0,JSON.stringify({w0:odds.w0,w1:odds.w1}));
check("wave 6: the Forest has faded to about 30% of Uncommon+ rolls and the Void has arrived (7% of the Rare+ among them)",odds.w6.f>.24&&odds.w6.f<.36&&odds.w6.v>.005&&odds.w6.v<.06,JSON.stringify(odds.w6));
check("wave 12: the Forest sits at its 10% floor",odds.w12.f>.06&&odds.w12.f<.15,JSON.stringify(odds.w12));
check("a Common never carries the set (Uncommon is the floor)",odds.common===0,String(odds.common));
// the first set piece a player ever sees: one lesson, once
const hint=await page.evaluate(async()=>{ const d=window.__dd, F=window.__forest, L=window.__lesson; d.setHero(0,10,0); const it=d.rollItem(1,'charm',2); it.rarity=1; F.make(it); d.dropLoot(it,d.hero.x+2,d.hero.z); await new Promise(r=>setTimeout(r,1700)); d.step(1/60,1); const first=L.text(), on=L.on(), size=parseFloat(getComputedStyle(document.getElementById('lesson')).fontSize); const flag=localStorage.getItem('dd_setHint');
  for(let i=0;i<60*6;i++) d.step(1/60,1); const still=L.on(); for(let i=0;i<60*4;i++) d.step(1/60,1); const gone=!L.on();
  const it2=d.rollItem(1,'amulet',2); it2.rarity=1; F.make(it2); d.dropLoot(it2,d.hero.x+3,d.hero.z); await new Promise(r=>setTimeout(r,1700)); d.step(1/60,1); return {first,on,size,flag,still,gone,second:L.on()}; });
check("the first set piece lands with the LESSON (a big 20px card that stays 9 s: wear three for a bonus, five for the power), flagged in localStorage; the second says nothing more",/A SET PIECE — wear three of the Forest for a bonus, all five for its power/.test(hint.first)&&hint.on&&hint.size>=19&&hint.flag==='1'&&hint.still&&hint.gone&&hint.second===false,JSON.stringify(hint));
// three pieces, five pieces: the bonuses on the multiplier hook, the sheet text, the models that stand in
const wear=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, F=window.__forest; M.reset(); d.resetGear(); const ids=[]; const T=document.getElementById('toast'); const m=k=>+(M.mult(k)||0).toFixed(3); const before={hp:m('hp'),move:m('move'),dmg:m('dmg')};
  let last=''; const mk=slot=>{ const it=d.rollItem(1,slot,4); it.rarity=1; if(slot==='familiar') it.name='Glimmering Wisp'; /* a bolt-firing species: the twin shot below needs bolts to count (a Bat swoops) */ F.make(it); M.onPickup(it); M.equip(it.id); ids.push(it.id); last=T.textContent; /* the SET BONUS toast, before a step lets the reward toast follow it */ d.step(1/60,2); return it; };
  mk('weapon'); mk('armor'); const two={lvl:F.lvl(),hp:m('hp')}; mk('charm'); const three={lvl:F.lvl(),hp:m('hp'),move:m('move'),dmg:m('dmg'),toast:last}; mk('amulet'); mk('familiar'); const five={lvl:F.lvl(),hp:m('hp'),move:m('move'),dmg:m('dmg'),toast:last,after:T.textContent};
  return {before,two,three,five,ids,setText:window.__sets.SETS['of the Forest'].text}; });
check("two pieces: nothing; three: +8% health and +4% move on the multiplier hook, with the SET BONUS toast",wear.two.lvl===0&&wear.two.hp===wear.before.hp&&wear.three.lvl===3&&+(wear.three.hp-wear.before.hp).toFixed(3)===.08&&+(wear.three.move-wear.before.move).toFixed(3)===.04&&/SET BONUS · of the Forest \(3\/5\)/.test(wear.three.toast),JSON.stringify({before:wear.before,two:wear.two,three:wear.three}));
check("five: +15% health, +8% move, +10% hero damage, and the TWIN SHOT line in the big toast",wear.five.lvl===5&&+(wear.five.hp-wear.before.hp).toFixed(3)===.15&&+(wear.five.move-wear.before.move).toFixed(3)===.08&&+(wear.five.dmg-wear.before.dmg).toFixed(3)===.1&&/TWIN SHOT/.test(wear.five.toast)&&/\(5\/5\)/.test(wear.five.toast),JSON.stringify({five:wear.five}));
// the full set's locker reward
const reward=await page.evaluate(()=>{ window.__voidset.check(); const list=window.__voidset.carried(); const r=list.find(x=>x.id==='reward-stand-forest'); return {n:list.filter(x=>x.reward).length,r,led:window.__voidset.unlocks()['stand-forest']}; });
check("the full Forest set puts the Forest Armor Stand in the hideout's wall locker: an uncommon armor-slot reward with its reason, once, and the game's ledger remembers",reward.n===1&&!!reward.r&&reward.r.reward===true&&reward.r.rarity===1&&reward.r.slot==='armor'&&reward.r.reason==='The Forest set, complete'&&reward.r.model==='armor-stand-forest.glb'&&!!reward.led&&reward.led.rewardId==='reward-stand-forest',JSON.stringify(reward));
// the stand-ins: the green blade in the knight's hand (and the knight swings a real cone, which is what the five-piece powers ride)
await page.evaluate(()=>window.__heroes.select('knight'));
const sword=await page.waitForFunction(()=>{ for(let i=0;i<3;i++) window.__dd.step(1/60,1); const s=window.__weapons.state(); return s.mounted&&/^venom\|/.test(s.key)?s.key:false; },null,{timeout:90000}).then(h=>h.jsonValue()).catch(()=>null);
check("a Forest weapon in the knight's hand is the green (venom) blade, the set's stand-in",!!sword&&/^venom\|/.test(sword),String(sword));
// TWIN SHOT: with the full set on and a familiar out, each shot is two bolts, the cooldown is a third shorter, and the reach is half again
const twin=await page.evaluate(()=>{ const d=window.__dd, F=window.__forest, M=window.__meta; for(const e of d.enemies) e.dead=true; d.setHero(0,10,0); d.step(1/60,30); const boon=F.boon(); const pet=window.__familiar.state();
  const G=d.gear(); const base=1/(1.2*(1+((G.familiar&&G.familiar.stats.frate)||0)/100)); const rate=window.__familiar.rate?window.__familiar.rate():null;
  const far=d.spawn('goblin','N'); far.hp=1e9; far.spd=0; far.x=pet.x; far.z=pet.z+12; d.step(1/60,2); const targetsFar=!!(window.__familiar.state().target); for(const e of d.enemies) e.dead=true; d.step(1/60,2);
  const e=d.spawn('goblin','N'); e.hp=1e9; e.spd=0; e.x=pet.x+1; e.z=pet.z+5; const b0=window.__familiar.bolts(); let maxBolts=0, spread=0; for(let i=0;i<40;i++){ d.step(1/60,1); e.x=pet.x+1; e.z=pet.z+5; const n=window.__familiar.bolts(); maxBolts=Math.max(maxBolts,n); const bs=window.__familiar.boltList?window.__familiar.boltList():null; if(bs&&bs.length>=2){ const a=Math.atan2(bs[0].vx,bs[0].vz), b2=Math.atan2(bs[1].vx,bs[1].vz); spread=Math.max(spread,Math.abs(a-b2)); } }
  return {boon,pet:!!pet,kind:pet&&pet.kind,base:+base.toFixed(3),rate:rate===null?null:+rate.toFixed(3),targetsFar,maxBolts,b0,spread:+spread.toFixed(2)}; });
check("the boon is on the pack (twin, spread .26, rate 1.25, range 1.5) and a familiar is out",!!twin.boon&&twin.boon.twin&&twin.boon.spread===.26&&twin.boon.rate===1.25&&twin.boon.range===1.5&&twin.pet,JSON.stringify({boon:twin.boon,kind:twin.kind}));
check("the familiar targets a goblin 12 units out (its reach is 9 without the set) and a shot puts two bolts in the air, fanned apart",twin.targetsFar&&twin.maxBolts>=2&&twin.spread>.15,JSON.stringify({far:twin.targetsFar,maxBolts:twin.maxBolts,spread:twin.spread,kind:twin.kind}));
const aura=await page.evaluate(()=>{ const a=window.__packs.aura(); return {on:a.on,green:a.col===0x5ad05a||String(a.col).toLowerCase().includes('5ad05a'),col:String(a.col)}; });
check("the full-set aura is on, in the Forest's green",aura.on&&aura.green,JSON.stringify(aura));
// the pity rule: on map one a player holding three or four Forest pieces gets the missing slot from the next Uncommon+ random-slot drop
const pity=await page.evaluate(()=>{ const d=window.__dd, F=window.__forest, M=window.__meta; M.reset(); d.resetGear(); for(const l of d.loot) l.mesh.parent&&l.mesh.parent.remove(l.mesh); d.loot.length=0; /* floor loot counts as owned since the guarantee: start clean */ const mk=slot=>{ const it=d.rollItem(1,slot,3); it.rarity=1; F.make(it); M.onPickup(it); M.equip(it.id); }; mk('weapon'); mk('armor'); mk('charm'); const owned=Object.keys(F.owned()).sort(); const p=F.pity();
  d.S.wave=2; let filled=0, wrongSlot=0, n=60; const slots={}; for(let i=0;i<n;i++){ const it=d.rollItem(1,undefined,3); if(F.isForest(it)){ filled++; slots[it.slot]=(slots[it.slot]||0)+1; if(it.slot==='weapon'||it.slot==='armor'||it.slot==='charm') wrongSlot++; } }
  const commons=(()=>{ let c=0; for(let i=0;i<60;i++){ const it=d.rollItem(0,undefined,3); if(it.rarity===0&&F.isForest(it)) c++; } return c; })();
  const named=(()=>{ const it=d.rollItem(1,'weapon',3); return F.isForest(it)&&it.slot==='weapon'; })();
  return {owned,p,filled,n,slots,wrongSlot,commons,namedSlotUnaffected:!named||true}; });
check("three Forest pieces owned on map one: the pity slot is one of the two missing ones, and every Uncommon+ random-slot roll is a Forest piece for a missing slot (never a Common, never a slot already owned)",pity.owned.join()==='armor,charm,weapon'&&(pity.p==='amulet'||pity.p==='familiar')&&pity.filled===pity.n&&pity.wrongSlot===0&&pity.commons===0,JSON.stringify(pity));
// the guarantee: on map one the held waves' thanks complete the set -- two pieces owned after wave 1, four after wave 2, all five after wave 3; floor loot counts, nothing twice
const guar=await page.evaluate(()=>{ const d=window.__dd, F=window.__forest, M=window.__meta; M.reset(); d.resetGear(); for(const l of d.loot) l.mesh.parent&&l.mesh.parent.remove(l.mesh); d.loot.length=0; d.setHero(30,30,0);
  const own=()=>Object.keys(F.owned()).length, floor=()=>d.loot.filter(l=>F.isForest(l.it)).length;
  const n1=F.guarantee(1); const a1={own:own(),floor:floor(),n:n1}; const n1b=F.guarantee(1); const a1b={own:own(),floor:floor(),n:n1b};   /* a second wave-1 call hands out nothing: the floor pieces count */
  for(const l of [...d.loot]){ M.onPickup(l.it); } d.loot.length=0; const n2=F.guarantee(2); const a2={own:own(),floor:floor(),n:n2}; for(const l of [...d.loot]) M.onPickup(l.it); d.loot.length=0;
  const n3=F.guarantee(3); const a3={own:own(),floor:floor(),n:n3,slots:Object.keys(F.owned()).sort()}; const n4=F.guarantee(4);
  return {a1,a1b,a2,a3,n4,byWave:F.BY_WAVE}; });
check("wave 1 held: two Forest pieces drop by the crystal (a second call adds none while they lie there); wave 2: two more -- four owned; wave 3 and 4: nothing more in the hall (the fifth is the locker's)",guar.a1.n===2&&guar.a1.floor===2&&guar.a1b.n===0&&guar.a2.n===2&&guar.a2.own===4&&guar.a3.n===0&&guar.a3.own===4&&guar.n4===0,JSON.stringify(guar));
const guarHook=await page.evaluate(()=>{ const d=window.__dd, F=window.__forest, M=window.__meta; M.reset(); d.resetGear(); for(const l of d.loot) l.mesh.parent&&l.mesh.parent.remove(l.mesh); d.loot.length=0; M.onWaveHeld(1); return {floor:d.loot.filter(l=>F.isForest(l.it)).length}; });
check("the real wave-held hook carries it (Meta.onWaveHeld → two Forest pieces on the floor)",guarHook.floor===2,JSON.stringify(guarHook));
// the last piece: with four in hand on map one, the fifth goes to the hideout's wall locker, the horn waits, and it comes back with the player
const lk=await page.evaluate(()=>{ const d=window.__dd, F=window.__forest, M=window.__meta; try{ localStorage.removeItem(F.LOCKER_KEY); localStorage.removeItem('dd_gear_carried'); }catch(e){} M.reset(); d.resetGear(); for(const l of d.loot) l.mesh.parent&&l.mesh.parent.remove(l.mesh); d.loot.length=0;
  const mk=slot=>{ const it=d.rollItem(1,slot,3); it.rarity=1; F.make(it); M.onPickup(it); M.equip(it.id); }; ['weapon','armor','charm','amulet'].forEach(mk); const owned4=Object.keys(F.owned()).length;
  const before=F.locker(); d.S.phase='build'; for(let i=0;i<40;i++) d.step(1/60,1);   /* the offer check runs every 30 frames */
  const o=F.locker(); const carried=JSON.parse(localStorage.getItem('dd_gear_carried')||'[]'); const rec=carried.find(r=>r.reward); const lessonText=window.__lesson.text();
  // no fifth from the hall: 300 Uncommon+ random rolls, none Forest; the horn refuses
  let forest=0; for(let i=0;i<300;i++){ const it=d.rollItem(1,undefined,3); if(F.isForest(it)) forest++; } d.startWave(); const phaseAfterHorn=d.S.phase, hornLesson=window.__lesson.text();
  return {owned4,before,pending:F.lockerPending(),slot:o&&o.item&&o.item.slot,isForest:!!(o&&o.item&&F.isForest(o.item)),rec:rec&&{id:rec.id,reward:rec.reward,reason:rec.reason,slot:rec.slot,sameId:rec.id===o.item.id},lessonText,forest,phaseAfterHorn,hornLesson,step:window.__trainer.step()}; });
check("four Forest pieces in hand on map one: the fifth (the familiar slot) is rolled into the locker -- a reward record in dd_gear_carried with the reason -- and a lesson says where it is",lk.owned4===4&&lk.before===null&&lk.pending&&lk.slot==='familiar'&&lk.isForest&&lk.rec&&lk.rec.reward===true&&/last piece of the Forest/.test(lk.rec.reason)&&lk.rec.slot==='familiar'&&lk.rec.sameId&&/wall locker/.test(lk.lessonText),JSON.stringify(lk));
check("no fifth from the hall (300 Uncommon+ rolls, none Forest), and the horn refuses to sound while it waits, saying why",lk.forest===0&&lk.phaseAfterHorn==='build'&&/horn waits/i.test(lk.hornLesson),JSON.stringify({forest:lk.forest,phase:lk.phaseAfterHorn,lesson:lk.hornLesson}));
// the hideout visit: the locker opened (rewardSeen) -- on the way back the piece is bagged, the record removed, the set complete
const back=await page.evaluate(async()=>{ const d=window.__dd, F=window.__forest, M=window.__meta; const list=JSON.parse(localStorage.getItem('dd_gear_carried')); list.find(r=>r.reward).rewardSeen=true; localStorage.setItem('dd_gear_carried',JSON.stringify(list));
  window.__hideout.open(); d.step(1/60,2); await new Promise(r=>setTimeout(r,200)); window.__hideout.close(); d.step(1/60,2); const o=F.locker(); const carried=JSON.parse(localStorage.getItem('dd_gear_carried')||'[]'); const bagged=M.bag().find(it=>F.isForest(it)&&it.slot==='familiar');
  if(bagged) M.equip(bagged.id); d.step(1/60,2); return {taken:!!(o&&o.taken),pending:F.lockerPending(),recordsLeft:carried.length,bagged:!!bagged,lvl:F.lvl(),lessonText:window.__lesson.text(),horn:(d.startWave(),d.S.phase)}; });
check("back from the hideout with the locker opened: the piece is in the bag, the reward record gone, the locker no longer pending, equipping it makes 5/5, the TWIN SHOT lesson shows, and the horn sounds again",back.taken&&!back.pending&&back.recordsLeft===0&&back.bagged&&back.lvl===5&&/TWIN SHOT/.test(back.lessonText)&&back.horn==='wave',JSON.stringify(back));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
