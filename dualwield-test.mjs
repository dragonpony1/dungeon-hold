// ===== THE DUAL-WIELD RINGS (build 509 prep; parts/staging/99k-dualwield.js). Matt approved them: "build it ill do the art later". Twotimer (Knight, two swords), Toil-n-Trouble (Witch, two staffs),
// Tootsie (Fighter, two polearms -- build 510 prep), Bifurcation (Ranger, two bows).
// Checked: the four are named charms; each drops about one wave in ten held, and never while you have it; each opens the 2nd weapon slot for its own hero only; the Knight never takes a polearm as his 2nd, and
// sleeps (💤) while his MAIN is a polearm; the 2nd weapon's stats count in full and never toward a set; the ring off sends it back to the bag; each hero keeps their own across a hero switch; it is saved and
// comes back after a reload (and the 2nd PET now does too -- it used to vanish); the bag's 2ND WEAPON card, its forge panel and "Equip as 2nd"; the Tab sheet's plaque (+1 upgrades the 2nd weapon only);
// the 2nd weapon's model sits on the FREE hand's mount (the Knight's left, the others' right); the attacks alternate hands (the mirrored clip, the bolt / arrow / blade from that side, same damage, same rate);
// the dev panel lists the four; the ring cards' chips; the stand-in ring on the floor; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const PORT=9131; const server=await serve(PORT,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.route(/\/api\//,r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
const boot=async()=>{ await page.goto("http://127.0.0.1:"+PORT+"/?silent&nogate",{timeout:180000}); await page.waitForFunction(()=>window.__dd&&window.__dualwield&&window.__mythic&&window.__meta&&window.__dd.heroModel(),null,{timeout:180000});
  await page.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,3); window.__freeze=true; window.__meta.setLevel&&window.__meta.setLevel(40); d.S.phase='build'; }); };
await boot();
// pick a hero and wait for its own model (the free hand's mount is made from it)
const pick=id=>page.evaluate(async id=>{ await window.__heroes.select(id); const want={knight:'Knight',witch:'Witch',fighter:'Fighter',troll:'Ranger'}[id]; for(let i=0;i<600;i++){ const m=window.__dd.heroModel(); if(m&&m.label.includes(want)&&window.__weapons.state().mounted) return m.label; await new Promise(r=>setTimeout(r,50)); } return null; },id);
// a hero wearing their own ring and a 2nd weapon with known stats, its model in the free hand
const arm=(id,stats)=>page.evaluate(async([id,stats])=>{ const d=window.__dd, M=window.__meta, D=window.__dualwield, N=window.__mythic; d.S.phase='build'; d.S.held=false;
  const ring=N.normalize({tier:'named',named:D.RING_OF[id],lvl:20}); M.giveItem(ring); M.equip(ring.id);
  const w2=d.rollItem(3,'weapon',20); w2.name='Plain Shortsword'; w2.stats=Object.assign({},stats||{dmg:7,hp:33,def:4}); delete w2.look; M.giveItem(w2); const ok=D.equip2(w2.id);
  for(let i=0;i<400;i++){ d.step(1/60,1); if(D.info().off) break; await new Promise(r=>setTimeout(r,25)); } return Object.assign({ ok, w2:w2.id },D.info()); },[id,stats]);
// ---- the four rings
const A=await page.evaluate(()=>{ const N=window.__mythic.NAMED; return ['twotimer','toil_n_trouble','tootsie','bifurcation'].map(k=>N[k]&&[k,N[k].name,N[k].slot,!!N[k].reward,N[k].hero].join(':')); });
check("the four dual-wield rings are named charms, one per hero (reward: their own drop, never the ordinary named roll)",A.join('|')==='twotimer:Twotimer:charm:true:knight|toil_n_trouble:Toil-n-Trouble:charm:true:witch|tootsie:Tootsie:charm:true:fighter|bifurcation:Bifurcation:charm:true:troll',A.join(' | '));
// ---- the drops: about one wave in ten held each; never while you have it
const B=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, D=window.__dualwield; const clear=()=>{ for(const l of d.loot.slice()){ try{ l.mesh.parent&&l.mesh.parent.remove(l.mesh); }catch(e){} } d.loot.length=0; };
  clear(); M.reset(); d.resetGear(); const n=id=>d.loot.filter(l=>l.it&&l.it.named===id).length; d.S.phase='build'; for(let w=0;w<200;w++){ d.S.wave=1; M.onWaveHeld(1); }
  const free={}; for(const id of D.RINGS) free[id]=n(id); clear();
  for(const id of D.RINGS) M.giveItem(window.__mythic.normalize({tier:'named',named:id,lvl:5})); for(let w=0;w<100;w++){ d.S.wave=1; M.onWaveHeld(1); } const own={}; for(const id of D.RINGS) own[id]=n(id); clear(); M.reset(); d.resetGear(); M.setLevel&&M.setLevel(40); return { free, own }; });
check("over 200 waves held each ring drops about one wave in ten (8 to 40 times each)",Object.values(B.free).every(v=>v>=8&&v<=40),JSON.stringify(B.free));
check("and never while you already have it (in the bag here)",Object.values(B.own).every(v=>v===0),JSON.stringify(B.own));
// ---- each opens the 2nd slot only for its own hero; the left (free) hand; alternating attacks -- per hero
const SIDE={knight:'LeftHand',witch:'RightHand',fighter:'RightHand',troll:'RightHand'}, MAIN={knight:'RightHand',witch:'LeftHand',fighter:'LeftHand',troll:'LeftHand'};
for(const id of ['knight','witch','fighter','troll']){
  const lab=await pick(id);
  const own=await page.evaluate(id=>{ const d=window.__dd, M=window.__meta, D=window.__dualwield, N=window.__mythic; M.reset(); d.resetGear(); M.setLevel&&M.setLevel(40); d.S.phase='build'; const out={};
    const w=d.rollItem(2,'weapon',10); w.name='Plain Shortsword'; delete w.look; M.giveItem(w);
    for(const r of D.RINGS){ const ring=N.normalize({tier:'named',named:r,lvl:10}); M.giveItem(ring); M.equip(ring.id); out[r]={ mine:D.ringMine(), can:D.canEquip2(w) }; M.unequip('charm'); }
    return out; },id);
  const okOwn=Object.entries(own).every(([r,v])=>v.mine===(r===({knight:'twotimer',witch:'toil_n_trouble',fighter:'tootsie',troll:'bifurcation'})[id])&&v.can===v.mine);
  check(lab+": only "+({knight:'Twotimer',witch:'Toil-n-Trouble',fighter:'Tootsie',troll:'Bifurcation'})[id]+" opens the 2nd weapon slot for this hero",okOwn,JSON.stringify(own));
  const st=await arm(id,{dmg:7,hp:33,def:4});
  check(lab+": the 2nd weapon's model sits on the FREE hand ("+SIDE[id]+"), on a mount mirrored from the main hand's ("+MAIN[id]+")",st.ok&&st.off&&st.off.hand===SIDE[id]&&/Off_\d+$/.test(st.off.node)&&st.rig&&st.rig.main===MAIN[id]&&st.rig.off===SIDE[id],JSON.stringify({ok:st.ok,off:st.off,rig:st.rig}));
  // four blows: main, 2nd, main, 2nd -- each from its own side, the 2nd hand's swing the attack mirrored, the same damage and the same length of swing
  const S=await page.evaluate(async()=>{ const d=window.__dd, D=window.__dualwield; D.clearLog(); const lens=[], clips=[], dmgs=[], dmg0=d.heroDmg();
    for(let s=0;s<4;s++){ for(let i=0;i<6;i++) d.step(1/60,1); d.swing(); let n=0, clip=null; while(d.hero.swingT>=0&&n<200){ d.step(1/60,1); n++; if(n===3){ const m=d.heroModel(); clip=m&&m.cur; } } lens.push(n); clips.push(clip); }
    return { log:D.log().map(e=>({hand:e.hand,side:e.side,bone:e.bone,at:e.at,tip:e.tip,tipSide:e.tipSide,shot:e.shot,shotSide:e.shotSide,dmg:e.dmg})), lens, clips }; });
  const hands=S.log.map(e=>e.hand).join(','), sides=S.log.map(e=>e.side).join(','), bones=S.log.map(e=>e.bone).join(',');
  const fromOwn=S.log.every(e=>!e.shot||(e.shotSide===e.side&&e.side!==0));
  const mirrored=S.clips[1]&&/_mirror$/.test(S.clips[1])&&S.clips[0]&&!/_mirror$/.test(S.clips[0]);
  check(lab+": the blows alternate hands -- main, 2nd, main, 2nd -- from opposite sides of the body, the 2nd hand's swing the attack clip mirrored",hands==='main,off,main,off'&&bones===[MAIN[id],SIDE[id],MAIN[id],SIDE[id]].join(',')&&S.log[0].side===-S.log[1].side&&S.log[0].side!==0&&mirrored,JSON.stringify({hands,sides,bones,clips:S.clips}));
  if(id==='knight') check(lab+": the left sword's blow ends on the other side from the right one's (its own slash, mirrored)",S.log[0].tipSide&&S.log[1].tipSide===-S.log[0].tipSide,JSON.stringify(S.log.map(e=>e.tipSide)));
  else check(lab+": each "+(id==='troll'?'arrow':'bolt')+" leaves from the weapon in the hand that swung",S.log.every(e=>e.shot&&e.shot.kind===(id==='troll'?'arrow':'bolt'))&&fromOwn,JSON.stringify(S.log.map(e=>({hand:e.hand,side:e.side,shotSide:e.shotSide,shot:e.shot}))));
  const dm=S.log.map(e=>e.shot?e.shot.dmg:e.dmg);
  check(lab+": the same rate and the same damage either hand (a visual alternation, not double attacks)",Math.max(...S.lens)-Math.min(...S.lens)<=1&&dm.length===4&&dm.every(v=>v>0&&v===dm[0]),JSON.stringify({frames:S.lens,dmg:dm}));
}
// ---- a named bow's power stays with the main hand: Subterfuge in the main hand wedges on every shot (both bows); as the 2nd bow it is only its stats
const SUB=await page.evaluate(async()=>{ const d=window.__dd, M=window.__meta, D=window.__dualwield, N=window.__mythic; const shots=async n=>{ D.clearLog(); for(let s=0;s<n;s++){ for(let i=0;i<6;i++) d.step(1/60,1); d.swing(); let k=0; while(d.hero.swingT>=0&&k<200){ d.step(1/60,1); k++; } } return D.log().map(e=>e.hand+':'+(e.shot?e.shot.n:0)); };
  const sub=N.normalize({tier:'named',named:'subterfuge',lvl:20}), plain=d.rollItem(3,'weapon',20); plain.name='Plain Shortsword'; delete plain.look; M.giveItem(sub); M.giveItem(plain); M.equip(sub.id); D.equip2(plain.id);
  for(let i=0;i<200;i++){ d.step(1/60,1); const o=D.off(), m=window.__weapons.mounted(); if(o&&m&&/subterfuge/.test(m.name)) break; await new Promise(r=>setTimeout(r,25)); } const a=await shots(2);
  D.unequip2(); M.equip(plain.id); D.equip2(sub.id); for(let i=0;i<200;i++){ d.step(1/60,1); const o=D.off(); if(o&&/subterfuge/.test(o.name)) break; await new Promise(r=>setTimeout(r,25)); } const b=await shots(2); return { mainSub:a, offSub:b }; });
check("Gnome Ranger: Subterfuge as the MAIN bow wedges on every shot, either hand's; as the 2nd bow it is its stats, not its wedge",SUB.mainSub.join()==='main:5,off:5'&&SUB.offSub.join()==='main:1,off:1',JSON.stringify(SUB));
// ---- the Knight: never a polearm as his 2nd; asleep while his main is a polearm
await pick('knight');
const P=await page.evaluate(async()=>{ const d=window.__dd, M=window.__meta, D=window.__dualwield, N=window.__mythic; M.reset(); d.resetGear(); M.setLevel&&M.setLevel(40); d.S.phase='build';
  const ring=N.normalize({tier:'named',named:'twotimer',lvl:20}); M.giveItem(ring); M.equip(ring.id);
  const pole=d.rollItem(3,'weapon',20); pole.name='Iron Halberd'; M.giveItem(pole); const pole2=d.rollItem(3,'weapon',20); pole2.name='Mythic Relic'; pole2.look='polearm'; M.giveItem(pole2);
  const sw=d.rollItem(3,'weapon',20); sw.name='Plain Shortsword'; delete sw.look; sw.stats={dmg:9}; M.giveItem(sw);
  const r={ halberd:D.equip2(pole.id), lookPole:D.equip2(pole2.id), sword:D.equip2(sw.id) }; const adds=()=>{ const wz=d.gear().weapon2, a=d.heroStat('dmg'); d.gear().weapon2=null; const n=d.heroStat('dmg'); d.gear().weapon2=wz; return +(a-n).toFixed(2); }; r.awakeAdds=adds();
  const main=d.rollItem(3,'weapon',20); main.name='Iron Spear'; M.giveItem(main); M.equip(main.id); for(let i=0;i<5;i++) d.step(1/60,1);
  window.__tavern.open(); window.__tavern.tab('bag'); const card=(document.querySelector('#tv-wpn2')||{}).textContent||''; window.__tavern.close();
  Object.assign(r,{ asleep:D.asleep(), dual:D.dual(), sleepAdds:adds(), card, offShown:!!D.off(), still:!!d.gear().weapon2 });
  const sword2=d.rollItem(3,'weapon',20); sword2.name='Plain Broadsword'; delete sword2.look; M.giveItem(sword2); M.equip(sword2.id); for(let i=0;i<5;i++) d.step(1/60,1); r.wakes=D.dual(); return r; });
check("the Knight never takes a polearm as his 2nd (a halberd by name, a polearm by look); a sword goes in",!P.halberd&&!P.lookPole&&P.sword,JSON.stringify(P));
check("with a polearm as his MAIN weapon his 2nd sword sleeps (💤 on its card, no stats, not in his hand) and wakes with a sword back in his main hand",P.awakeAdds===9&&P.asleep&&!P.dual&&P.sleepAdds===0&&/💤/.test(P.card)&&!P.offShown&&P.still&&P.wakes,JSON.stringify(P));
// ---- stats count in full; never toward a set
const ST=await page.evaluate(async()=>{ const d=window.__dd, M=window.__meta, D=window.__dualwield, N=window.__mythic; M.reset(); d.resetGear(); M.setLevel&&M.setLevel(40); d.S.phase='build';
  const ring=N.normalize({tier:'named',named:'twotimer',lvl:20}); M.giveItem(ring); M.equip(ring.id); const b={ hp:d.heroStat('hp'), def:d.heroStat('def'), dmg:d.heroStat('dmg'), max:d.hero.max };
  const v=N.normalize({tier:'mythic',slot:'weapon',set:'void',art:'sword',name:'Mythic Sword of the Void',lvl:20,rarity:5,stats:{dmg:11,hp:40,def:6}}); M.giveItem(v); const S=M.sets; const sname=S.setOf(v); const c0=JSON.stringify(S.counts());
  const ok=D.equip2(v.id); d.step(1/60,2); const c1=JSON.stringify(S.counts());
  return { ok, b, a:{ hp:d.heroStat('hp'), def:d.heroStat('def'), dmg:d.heroStat('dmg'), max:d.hero.max }, sname, c0, c1 }; });
check("the 2nd weapon's stats count in full (health, armour, damage -- and his max health with them)",ST.ok&&ST.a.hp===ST.b.hp+40&&ST.a.def===ST.b.def+6&&ST.a.dmg===ST.b.dmg+11&&ST.a.max>ST.b.max,JSON.stringify(ST));
check("it never counts toward a set (a Void sword as the 2nd leaves the set counts as they were)",!!ST.sname&&ST.c0===ST.c1,JSON.stringify({set:ST.sname,before:ST.c0,after:ST.c1}));
const GL=await page.evaluate(async()=>{ const d=window.__dd, D=window.__dualwield; for(let i=0;i<300;i++){ d.step(1/60,1); const o=D.info().off; if(o&&o.name==='sword-void'&&o.glow) break; await new Promise(r=>setTimeout(r,30)); } return D.info().off; });
check("a real set weapon shows as itself in the left hand, glowing in its set's colour like the main hand's (86w)",!!GL&&GL.name==='sword-void'&&GL.hand==='LeftHand'&&GL.glow>0,JSON.stringify(GL));
// ---- the bag (tavern): the 2ND WEAPON card, its forge panel and Take off; Equip as 2nd on a spare weapon
const BAG=await page.evaluate(async()=>{ const d=window.__dd, M=window.__meta, T=window.__tavern, D=window.__dualwield; M.addGold(1e7); const r={};
  D.unequip2(); const spare=M.bag().find(b=>b.slot==='weapon'&&D.canEquip2(b)); T.open(); T.tab('bag'); r.emptyCard=((document.querySelector('#tv-wpn2')||{}).textContent||'');
  const tile=document.querySelector('#tv-bag [data-act="sel"][data-from="bag"][data-id="'+spare.id+'"]'); if(tile) tile.click(); const eb=document.querySelector('#tv-detail [data-act="equipw2"]'); r.equipBtn=!!eb; if(eb) eb.click(); r.equipped=!!(d.gear().weapon2&&d.gear().weapon2.id===spare.id);
  const c=document.querySelector('#tv-wpn2 .tv-card'); r.card=((document.querySelector('#tv-wpn2')||{}).textContent||''); if(c) c.click(); const det=document.getElementById('tv-detail'), forge=det&&det.querySelector('#tv-forge');
  const b=forge&&forge.querySelector('[data-act="tvup"][data-n="1"]:not([disabled])'), k=b&&b.dataset.key, g=d.gear(); const v2=k?(g.weapon2.stats[k]||0):null, v1=k&&g.weapon?(g.weapon.stats[k]||0):null, u0=g.weapon2.up|0; if(b) b.click(); const g2=d.gear();
  Object.assign(r,{ opened:!!(det&&!det.classList.contains('hide')), forge:!!forge, takeOff:!!document.querySelector('#tv-detail [data-act="unequipw2"]'), tag:((det&&det.querySelector('.dh .dm'))||{}).textContent||'', key:k, up:(g2.weapon2.up|0)-u0, v2, v2a:k?g2.weapon2.stats[k]:null, v1, v1a:k&&g2.weapon?g2.weapon.stats[k]:null });
  const tk=document.querySelector('#tv-detail [data-act="unequipw2"]'); if(tk) tk.click(); r.tookOff=!d.gear().weapon2&&M.bag().some(x=>x.id===spare.id); T.close(); D.equip2(spare.id); return r; });
check("the bag: a 2ND WEAPON card under the equipped row; a spare sword's panel has Equip as 2nd, and it goes in",/2ND WEAPON/.test(BAG.emptyCard)&&BAG.equipBtn&&BAG.equipped&&/2ND WEAPON/.test(BAG.card),JSON.stringify({empty:BAG.emptyCard,equipBtn:BAG.equipBtn,equipped:BAG.equipped,card:BAG.card.slice(0,80)}));
check("clicking the 2nd weapon's card opens its panel: the forge (+1 upgrades the 2nd weapon only) and Take off (back to the bag)",BAG.opened&&BAG.forge&&BAG.up===1&&BAG.v2a>BAG.v2&&BAG.v1a===BAG.v1&&BAG.takeOff&&/2ND WEAPON/.test(BAG.tag)&&BAG.tookOff,JSON.stringify(BAG));
// ---- the Tab sheet: the 2nd weapon's plaque, its forge rows, TAKE OFF, and EQUIP AS 2ND on a spare weapon
const TAB=await page.evaluate(async()=>{ const d=window.__dd, M=window.__meta, D=window.__dualwield, P=window.__doll; M.addGold(1e7); for(let i=0;i<3;i++) d.step(1/60,1); P.open(); const r={};
  const el=document.getElementById('doll'), plaque=el&&el.querySelector('.dl-slot.weapon2'); r.plaque=!!plaque; r.plaqueText=plaque?plaque.textContent.slice(0,120):''; r.takeOff=!!(plaque&&plaque.querySelector('[data-act="unequipw2"]'));
  const b=plaque&&plaque.querySelector('[data-act="up"][data-slot="weapon2"][data-n="1"]:not([disabled])'), k=b&&b.dataset.key, g=d.gear(); const v2=k?(g.weapon2.stats[k]||0):null, v1=k&&g.weapon?(g.weapon.stats[k]||0):null; if(b) b.click(); const g2=d.gear();
  Object.assign(r,{ key:k, v2, v2a:k?g2.weapon2.stats[k]:null, v1, v1a:k&&g2.weapon?g2.weapon.stats[k]:null });
  const sp=d.rollItem(2,'weapon',10); sp.name='Plain Broadsword'; delete sp.look; M.giveItem(sp); P.select(sp.id,'bag'); r.equipAs2nd=/data-act="equipw2"/.test(P.html()); const eb=el.querySelector('[data-act="equipw2"]'); if(eb) eb.click(); r.swapped=!!(d.gear().weapon2&&d.gear().weapon2.id===sp.id);
  P.close(); return r; });
check("the Tab sheet: a 2nd-weapon plaque with its forge rows (+1 upgrades the 2nd weapon only) and TAKE OFF; a spare sword's card says EQUIP AS 2ND",TAB.plaque&&TAB.takeOff&&TAB.key&&TAB.v2a>TAB.v2&&TAB.v1a===TAB.v1&&TAB.equipAs2nd&&TAB.swapped,JSON.stringify(TAB));
// ---- the ring off: back to the bag; the hero switch: each hero keeps their own; saved and reloaded
const OFFR=await page.evaluate(async()=>{ const d=window.__dd, M=window.__meta, D=window.__dualwield; const w=d.gear().weapon2; const c=d.rollItem(1,'charm',5); M.giveItem(c); M.equip(c.id); d.step(1/60,2);
  const r={ id:w&&w.id, gone:!d.gear().weapon2, inBag:M.bag().some(b=>b.id===(w&&w.id)), returned:D.info().returned };
  const ring=M.bag().find(b=>b.named==='twotimer'); M.equip(ring.id); D.equip2(w.id); r.back=!!(d.gear().weapon2&&d.gear().weapon2.id===w.id); return r; });
check("take the ring off and the 2nd weapon goes back into the bag by itself",OFFR.gone&&OFFR.inBag&&OFFR.back,JSON.stringify(OFFR));
const kid=await page.evaluate(()=>window.__dd.gear().weapon2.id);
await pick('witch');
const SW1=await page.evaluate(()=>({ w2:window.__dd.gear().weapon2&&window.__dd.gear().weapon2.id, stored:Object.keys(window.__dualwield.stored()), knight:(window.__dualwield.stored().knight||{}).id, bag:window.__meta.bag().some(b=>b.id===window.__dualwield.stored().knight.id) }));
await pick('knight');
const SW2=await page.evaluate(()=>({ w2:window.__dd.gear().weapon2&&window.__dd.gear().weapon2.id, dual:window.__dualwield.dual() }));
check("each hero keeps their own: switch to the Witch and the Knight's 2nd sword is filed under him (not in her hand, not in the bag); switch back and it's in his hand again",!SW1.w2&&SW1.knight===kid&&!SW1.bag&&SW2.w2===kid&&SW2.dual,JSON.stringify({kid,SW1,SW2}));
// the 2nd PET (97h) rides through a reload too now -- it used to vanish (71-herogear.js rewrote ddGear before 97h read it back)
const saved=await page.evaluate(()=>{ const g=JSON.parse(localStorage.getItem('ddGear')); return { inDdGear:g.weapon2&&g.weapon2.id, store:(JSON.parse(localStorage.getItem('dd_heroWeapon2'))||{}).knight }; });
await boot(); await pick('knight');
const RL=await page.evaluate(()=>({ w2:window.__dd.gear().weapon2&&window.__dd.gear().weapon2.id, dual:window.__dualwield.dual(), ring:window.__dd.gear().charm&&window.__dd.gear().charm.named }));
check("saved and reloaded: the 2nd weapon rides ddGear and its hero's store, and is back in his hand after a reload",saved.inDdGear===kid&&saved.store&&saved.store.id===kid&&RL.w2===kid&&RL.dual&&RL.ring==='twotimer',JSON.stringify({kid,saved:{inDdGear:saved.inDdGear,store:saved.store&&saved.store.id},RL}));
const PET=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, R=window.__tworings, N=window.__mythic; const ring=N.normalize({tier:'named',named:'beast_mode',lvl:10}); M.giveItem(ring); M.equip(ring.id); const f=d.rollItem(2,'familiar',8); M.giveItem(f); R.equip2(f.id); return f.id; });
await boot();
const PET2=await page.evaluate(()=>({ second:window.__dd.gear().familiar2&&window.__dd.gear().familiar2.id }));
check("the 2nd PET (Beast Mode) survives a reload now too -- it used to vanish",PET2.second===PET,JSON.stringify({PET,PET2}));
// ---- the dev panel, the chips, the stand-in ring on the floor
const DEV=await page.evaluate(()=>{ window.__devpanel.toggle(); const sel=document.getElementById('dp-named'); const opts=sel?[...sel.options].map(o=>o.value):[]; window.__devpanel.toggle(); return opts; });
check("the dev panel's named-mythic list has the four rings (Give / Drop here)",['twotimer','toil_n_trouble','tootsie','bifurcation'].every(k=>DEV.includes(k)),JSON.stringify(DEV.slice(-6)));
const CH=await page.evaluate(()=>{ const P=window.__tavpics, N=window.__mythic; const c=id=>P.chips(N.normalize({tier:'named',named:id,lvl:5})); return { k:c('twotimer'), w:c('toil_n_trouble'), f:c('tootsie'), r:c('bifurcation'), other:c('gabriels_charm') }; });
check("the ring cards say what they do and whose they are: 2 SWORDS · KNIGHT, 2 STAFFS · WITCH, 2 POLEARMS · FIGHTER, 2 BOWS · RANGER (other named pieces don't)",/2 SWORDS/.test(CH.k)&&/KNIGHT/.test(CH.k)&&/2 STAFFS/.test(CH.w)&&/WITCH/.test(CH.w)&&/2 POLEARMS/.test(CH.f)&&/FIGHTER/.test(CH.f)&&/2 BOWS/.test(CH.r)&&/RANGER/.test(CH.r)&&!/2 (SWORDS|STAFFS|POLEARMS|BOWS)/.test(CH.other),JSON.stringify({k:CH.k.length,other:CH.other.length}));
const FL=await page.evaluate(async()=>{ const d=window.__dd, D=window.__dualwield; window.__freeze=true; d.S.phase='build'; for(const l of d.loot.slice()){ try{ l.mesh.parent&&l.mesh.parent.remove(l.mesh); }catch(e){} } d.loot.length=0; d.setHero(0,8,0); for(const id of D.RINGS) D.dropRing(id); for(let i=0;i<10;i++){ d.step(1/60,1); }
  return window.__weaponStand.list().map(s=>s.name); });
check("dropped, each ring stands on the floor (the code-built stand-in until Matt's 3D art lands)",['twotimer','toil_n_trouble','tootsie','bifurcation'].every(k=>FL.includes('named-'+k)),JSON.stringify(FL));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
