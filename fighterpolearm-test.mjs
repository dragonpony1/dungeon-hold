// ===== THE FIGHTER WIELDS POLEARMS (build 510 prep; parts/staging/86v-fighterpole.js, 80-weapons.js heldFor/caster, 82-staff.js, 84-aim.js, 99k-dualwield.js, 98-party.js). Matt: "we have polearms so
// maybe we just say witch can use staffs and fighter can use polearms", then "we have polearm art already, he can only use what he can only use".
// Build 525 prep, TYPED WEAPONS: a weapon's model now follows its own type (it.wtype), not the hand -- the checks below that said "whatever its look" now ask about polearm-typed pieces, and a staff or
// sword piece shows as its own type's model on every hero. Was: the Fighter's hand holds a POLEARM for every item -- a plain one by tier, a set piece's own polearm whatever its look (staff / sword / polearm, the Forest's too), a named polearm as itself,
// any other named weapon as the top plain polearm -- and the Witch still a staff, the Knight still his sword-or-polearm by the item; the Fighter's weapon emblem is 🔱 and a mythic dropped while
// playing him is a polearm (look) that the Witch then holds as her staff; his bolts are unchanged (the same damage, reach, speed and swing length as from a staff) and leave from near the polearm's
// point; a set polearm glows in his hand (86w) and a light at its point brightens as he charges; a dropped weapon stands on the floor as his polearm; Tootsie's 2nd weapon is a 2nd POLEARM in his
// other hand and its bolts leave from its own point; in co-op the host sees a guest Fighter's puppet holding his polearm (and the 2nd one), and the guest sees the host Witch's staff; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer=null; try { ({ PeerServer } = await import("peer")); } catch(e) {}
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=9581; const server=await serve(PORT,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const newPage=async()=>{ const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.route(/\/api\//,r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
  const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
  await p.goto("http://127.0.0.1:"+PORT+"/?silent&ownweapons&nogate",{timeout:240000}); await p.waitForFunction(()=>window.__dd&&window.__dualwield&&window.__mythic&&window.__meta&&window.__fighterpole&&window.__dd.heroModel(),null,{timeout:240000});
  await p.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,3); window.__freeze=true; window.__meta.setLevel&&window.__meta.setLevel(40); d.S.phase='build'; });
  return p; };
const page=await newPage();
const pick=(p,id)=>p.evaluate(async id=>{ await window.__heroes.select(id); const want={knight:'Knight',witch:'Witch',fighter:'Fighter',troll:'Ranger'}[id]; for(let i=0;i<600;i++){ window.__dd.step(1/60,1); const m=window.__dd.heroModel(), s=window.__weapons.state(); if(m&&m.label.includes(want)&&s.mounted&&s.key.includes(want)) return m.label; await new Promise(r=>setTimeout(r,50)); } return null; },id);
// the items every hero is asked about (built fresh on the page each time)
const ITEMS=`(()=>{ const d=window.__dd, N=window.__mythic; const plain=t=>{ const it=d.rollItem(2,'weapon',10); it.name='Plain Shortsword'; delete it.look; delete it.setId; it.tier=t; return it; };
  const myth=(set,art,name)=>N.normalize({tier:'mythic',slot:'weapon',set,art,name,lvl:20,rarity:5,stats:{dmg:11}});
  const forest=()=>{ const it=d.rollItem(2,'weapon',5); it.name='Bark Broadsword of the Forest'; delete it.look; delete it.setId; return it; };
  const forestPole=()=>{ const it=d.rollItem(2,'weapon',5); it.name='Bark Hazel Spear of the Forest'; it.wtype=it.look='polearm'; delete it.setId; return it; };
  return { plain1:plain(1), plain3:plain(3), plain5:plain(5), voidStaff:myth('void','staff','Mythic Staff of the Void'), fireSword:myth('lava','sword','Mythic Sword of Fire'), chaosPole:myth('crimson','polearm','Mythic Polearm of Chaos'),
    iceStaff:myth('ice','staff','Mythic Staff of Ice'), forest:forest(), voidPole:myth('void','polearm','Mythic Polearm of the Void'), firePole:myth('lava','polearm','Mythic Polearm of Fire'), icePole:myth('ice','polearm','Mythic Polearm of Ice'), forestPole:forestPole(), lantern:N.normalize({tier:'named',named:'last_lantern',lvl:20}), sixseven:N.normalize({tier:'named',named:'sixseven',lvl:20}), rootsplitter:N.normalize({tier:'named',named:'rootsplitter',lvl:20}) }; })()`;
const heldAll=p=>p.evaluate(src=>{ const I=eval(src), W=window.__weapons, out={}; for(const k in I) out[k]=W.heldFor(I[k]); return out; },ITEMS);
const equipWait=(p,key)=>p.evaluate(async([src,key])=>{ const d=window.__dd, M=window.__meta, W=window.__weapons; const it=eval(src)[key]; M.giveItem(it); M.equip(it.id); const want=W.heldFor(it); let m=null;
  for(let i=0;i<400;i++){ d.step(1/60,1); m=W.mounted(); if(m&&m.parent&&m.name===want) break; await new Promise(r=>setTimeout(r,30)); } d.hero.swingT=-1; for(let i=0;i<10;i++) d.step(1/60,1);
  const s=W.state(); return { want, held:m&&m.name, pole:s.pole, caster:s.caster, staff:s.staff, mountPole:!!(s.mount&&s.mount.pole), kind:m&&m.userData.kind, tip:!!(m&&m.getObjectByName('poleTip')), emblem:window.__emblem.kind(it), icon:window.__emblem.slotIcon(it) }; },[ITEMS,key]);
// ---------------------------------------------------------------- the Fighter
check("the Fighter loads",!!await pick(page,'fighter'));
const FH=await heldAll(page);
check("the Fighter's hand holds a PLAIN POLEARM for a plain weapon, one per tier (hazel spear / runed glaive / battle halberd)",FH.plain1==='polearm-hazel'&&FH.plain3==='polearm-runed'&&FH.plain5==='polearm-battle',JSON.stringify(FH));
check("a polearm set piece is that set's own polearm (Void, Fire, Chaos, Ice, Forest); a staff or sword piece keeps its own type's model in his view (typed weapons)",FH.voidPole==='polearm-void'&&FH.firePole==='polearm-fire'&&FH.chaosPole==='polearm-chaos'&&FH.icePole==='polearm-ice'&&FH.forestPole==='polearm-forest'&&FH.voidStaff==='staff-void'&&FH.fireSword==='sword-fire',JSON.stringify(FH));
check("a named polearm is itself (The Last Lantern, 6/7); Rootsplitter, a sword-type named weapon, is itself too (typed weapons)",FH.lantern==='named-last_lantern'&&FH.sixseven==='named-sixseven'&&FH.rootsplitter==='named-rootsplitter',JSON.stringify(FH));
const FP=await equipWait(page,'plain3');
check("worn: a plain weapon puts the runed glaive in his hand -- a polearm, a caster's (bolts), not a staff; the mount says pole",FP.held==='polearm-runed'&&FP.pole&&FP.caster&&!FP.staff&&FP.mountPole&&FP.tip&&FP.kind==='runed',JSON.stringify(FP));
check("his weapon's emblem is the polearm 🔱 (bag cards, the sheet, tooltips)",FP.emblem==='polearm'&&FP.icon==='🔱',JSON.stringify(FP));
const FV=await equipWait(page,'voidPole');
check("worn: a Void polearm piece is the Void polearm (Matt's spear) in his hand, its bolts in the Void's colours",FV.held==='polearm-void'&&FV.pole&&FV.caster&&FV.kind==='void',JSON.stringify(FV));
const GL=await page.evaluate(async()=>{ const d=window.__dd; for(let i=0;i<60;i++){ d.step(1/60,1); const g=window.__heldglow.info(); if(g.glowing>0&&g.held==='polearm-void') break; await new Promise(r=>setTimeout(r,20)); } return Object.assign({ light:window.__fighterpole.light() },window.__heldglow.info()); });
check("the held glow is on the set polearm (86w), and a soft light sits at its point",GL.held==='polearm-void'&&GL.glowing>0&&!!GL.light&&GL.light.opacity>0,JSON.stringify(GL));
// the bolt: same numbers as from a staff, from near the point
const shoot=(p,force)=>p.evaluate(async force=>{ const d=window.__dd, W=window.__weapons; W.force(force||null); for(let i=0;i<300;i++){ d.step(1/60,1); const m=W.mounted(); if(m&&m.parent&&(!force||m.name===force)&&(force||W.caster(m))) break; await new Promise(r=>setTimeout(r,20)); }
  d.hero.swingT=-1; for(let i=0;i<20;i++) d.step(1/60,1); const got=[]; const prev=window.__shotEvent;
  window.__shotEvent=function(t,k,from,dir,spd,opts){ const m=W.mounted(), h=m&&(m.getObjectByName('poleTip')||m.getObjectByName('staffHead')), at=h?h.getWorldPosition(new THREE.Vector3()):null; const sd=m&&m.userData.sword; const tipW=sd?m.localToWorld(new THREE.Vector3(0,sd.tipY,0)):null, gripW=m&&m.parent?m.parent.getWorldPosition(new THREE.Vector3()):null;
    got.push({t,k,spd,life:opts&&opts.life,dmg:opts&&opts.dmg,fromHead:at?+from.distanceTo(at).toFixed(3):null,toTip:tipW?+from.distanceTo(tipW).toFixed(3):null,fromGrip:gripW?+from.distanceTo(gripW).toFixed(3):null,len:sd&&gripW&&tipW?+gripW.distanceTo(tipW).toFixed(3):null}); if(prev) return prev.apply(this,arguments); };
  const lens=[]; try{ for(let s=0;s<2;s++){ d.swing(); let n=0; while(d.hero.swingT>=0&&n<300){ d.step(1/60,1); n++; } lens.push(n); for(let i=0;i<6;i++) d.step(1/60,1); } } finally { window.__shotEvent=prev; }
  const name=W.mounted()&&W.mounted().name; W.force(null); return { name, got, lens, dmg:d.heroDmg(), reach:d.hero.reach }; },force);
const SP=await shoot(page,null), SS=await shoot(page,'staff-void');
const b=SP.got[0]||{}, s=SS.got[0]||{};
check("his swing still throws a bolt from the polearm (one a swing), at full hero damage (build 528: no charging, every shot 100%) and reach 18 (build 511 prep: a miss flies on to 1.5x it)",SP.name==='polearm-void'&&SP.got.length===2&&SP.got.every(g=>g.t==='bolt')&&b.dmg===Math.round(SP.dmg*1*10)/10&&SP.reach===18&&Math.abs(b.life*b.spd-1.5*SP.reach)<.01,JSON.stringify(SP));
check("the same damage, reach, speed and swing length as from a staff in the same hand (gameplay unchanged)",SS.name==='staff-void'&&b.dmg===s.dmg&&b.life===s.life&&b.spd===s.spd&&SP.lens.join()===SS.lens.join(),JSON.stringify({pole:{dmg:b.dmg,life:b.life,spd:b.spd,lens:SP.lens},staff:{dmg:s.dmg,life:s.life,spd:s.spd,lens:SS.lens}}));
check("the bolt leaves from near the polearm's point (its poleTip; within 12% of the grip-to-point length of the very tip), far from the fist",b.fromHead!==null&&b.fromHead<.02&&b.toTip<b.len*.12&&b.fromGrip>b.len*.8,JSON.stringify(b));
// a mythic dropped while playing him is a polearm by look -- and the Witch holds that same piece as her staff
const MY=await page.evaluate(()=>{ const d=window.__dd; const it=d.rollItem(3,'weapon',12); it.name='Plain Shortsword'; delete it.look; const g=window.__setGate; window.__setGate=null; try{ window.__mythicDrops.mythicize(it); } finally { window.__setGate=g; } return { look:it.look, name:it.name, held:window.__weapons.heldFor(it), rec:JSON.stringify(it) }; });
check("a mythic weapon rolled while playing the Fighter is a polearm (its look and name), held as its set's polearm",MY.look==='polearm'&&/^Mythic Polearm /.test(MY.name)&&/^polearm-/.test(MY.held),JSON.stringify({look:MY.look,name:MY.name,held:MY.held}));
// a dropped weapon stands on the floor as the polearm he'd hold
const ST=await page.evaluate(async src=>{ const d=window.__dd; for(const l of d.loot.slice()){ try{ l.mesh.parent&&l.mesh.parent.remove(l.mesh); }catch(e){} } d.loot.length=0; const it=eval(src).firePole; d.dropLoot(it,d.hero.x+3,d.hero.z,true);
  for(let i=0;i<300;i++){ d.step(1/60,1); if(window.__weaponStand.list().length) break; await new Promise(r=>setTimeout(r,25)); } const l=window.__weaponStand.list().map(s=>s.name); for(const x of d.loot.slice()){ try{ x.mesh.parent&&x.mesh.parent.remove(x.mesh); }catch(e){} } d.loot.length=0; d.step(1/60,2); return l; },ITEMS);
check("a polearm dropped while playing him stands on the floor as that polearm (the Fire polearm)",ST.includes('polearm-fire'),JSON.stringify(ST));
// Tootsie: the 2nd weapon is a 2nd polearm in his other hand, and its bolt leaves from its own point
const TT=await page.evaluate(async src=>{ const d=window.__dd, M=window.__meta, N=window.__mythic, D=window.__dualwield, W=window.__weapons; const ring=N.normalize({tier:'named',named:'tootsie',lvl:20}); M.giveItem(ring); M.equip(ring.id);
  const w2=eval(src).firePole; M.giveItem(w2); const ok=D.equip2(w2.id); for(let i=0;i<400;i++){ d.step(1/60,1); const o=D.off(); if(o&&o.name==='polearm-fire') break; await new Promise(r=>setTimeout(r,25)); }
  const off=D.off(); const info=D.info(); d.hero.swingT=-1; for(let i=0;i<20;i++) d.step(1/60,1); D.clearLog(); const got=[]; const prev=window.__shotEvent;
  window.__shotEvent=function(t,k,from){ const m=W.mounted(), tp=m&&m.getObjectByName('poleTip'); got.push({t,k,hand:D.hand(),name:m&&m.name,fromTip:tp?+from.distanceTo(tp.getWorldPosition(new THREE.Vector3())).toFixed(3):null}); if(prev) return prev.apply(this,arguments); };
  try{ for(let s=0;s<2;s++){ for(let i=0;i<6;i++) d.step(1/60,1); d.swing(); let n=0; while(d.hero.swingT>=0&&n<300){ d.step(1/60,1); n++; } } } finally { window.__shotEvent=prev; }
  const log=D.log().map(e=>({hand:e.hand,side:e.side,shotSide:e.shotSide,shot:e.shot&&e.shot.kind})); const chip=window.__tavpics&&window.__tavpics.chips?window.__tavpics.chips(ring):'';
  return { ok, off:info.off, caster:W.caster(off), pole:!!(off&&off.userData.pole), got, log, word:D.kindWord(), icon:D.kindIcon(), two:/2 POLEARMS/.test(chip), power:N.NAMED.tootsie.power }; },ITEMS);
check("Tootsie: the 2nd weapon (a Fire polearm piece) is a 2nd POLEARM -- the Fire polearm -- on the free (right) hand's mount, a caster's, glowing",TT.ok&&TT.off&&TT.off.name==='polearm-fire'&&TT.off.hand==='RightHand'&&/^staffOff_/.test(TT.off.node)&&TT.caster&&TT.pole&&TT.off.glow>0,JSON.stringify(TT.off));
check("Tootsie: the bolts alternate polearms -- main, then 2nd -- each from its own polearm's point, from its own side",TT.got.length===2&&TT.got[0].name==='polearm-void'&&TT.got[1].name==='polearm-fire'&&TT.got.every(g=>g.t==='bolt'&&g.fromTip!==null&&g.fromTip<.02)&&TT.log.length===2&&TT.log.every(e=>e.shot==='bolt'&&e.shotSide===e.side&&e.side!==0)&&TT.log[0].side===-TT.log[1].side,JSON.stringify({got:TT.got,log:TT.log}));
check("Tootsie's words follow: 🔱 polearm, 2 POLEARMS on its card, two battle polearms in its power",TT.word==='polearm'&&TT.icon==='🔱'&&TT.two&&/POLEARMS/.test(TT.power)&&!/STAFF/.test(TT.power),JSON.stringify({word:TT.word,icon:TT.icon,two:TT.two,power:TT.power}));
await page.evaluate(()=>{ const D=window.__dualwield, M=window.__meta, d=window.__dd; D.unequip2(); M.unequip('charm'); d.step(1/60,3); });
// ---------------------------------------------------------------- the Witch keeps her staffs; the Knight his sword or polearm by the item
check("the Witch loads",!!await pick(page,'witch'));
const WH=await heldAll(page);
check("the Witch: her plain staffs by tier and a staff set piece's own staff; a sword or polearm piece shows its own type's model (typed weapons: sword-fire, polearm-chaos, The Last Lantern itself)",WH.plain1==='staff-hazel'&&WH.plain5==='staff-battle'&&WH.voidStaff==='staff-void'&&WH.forest==='staff-forest'&&WH.fireSword==='sword-fire'&&WH.chaosPole==='polearm-chaos'&&WH.lantern==='named-last_lantern',JSON.stringify(WH));
const WV=await equipWait(page,'iceStaff');
check("worn: an Ice staff piece is her Ice staff in her hand; no pole flag; its emblem is the staff 🪄",WV.held==='staff-ice'&&WV.staff&&!WV.pole&&!WV.mountPole&&WV.emblem==='staff'&&WV.icon==='🪄',JSON.stringify(WV));
const WM=await page.evaluate(rec=>window.__weapons.heldFor(JSON.parse(rec)),MY.rec);
check("the mythic polearm rolled by the Fighter stays that polearm in the Witch's view (typed weapons: the type decides the model)",/^polearm-/.test(WM)&&WM===MY.held,JSON.stringify({fighter:MY.held,witch:WM}));
await equipWait(page,'plain3'); const WS=await shoot(page,null);
check("her staff still throws its bolt from the staff's head (her runed staff for a plain weapon)",WS.name==='staff-runed'&&WS.got.length===2&&WS.got.every(g=>g.t==='bolt'&&g.fromHead!==null&&g.fromHead<.02),JSON.stringify(WS));
check("the Knight loads",!!await pick(page,'knight'));
const KH=await heldAll(page);
check("the Knight: a set sword piece is the set's sword, a polearm piece its polearm, a plain weapon a plain blade; a staff piece shows as its staff (typed weapons)",KH.voidStaff==='staff-void'&&KH.fireSword==='sword-fire'&&KH.chaosPole==='polearm-chaos'&&!/^polearm-/.test(KH.plain3)&&KH.lantern==='named-last_lantern',JSON.stringify(KH));
// ---------------------------------------------------------------- co-op: a guest Fighter's puppet holds his polearms on the host's screen
if(!PeerServer) console.log("SKIP co-op part -- the `peer` package isn't installed");
else {
  const sigPort=9582; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>setTimeout(r,300)); const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
  const host=await newPage(), guest=page; for(const p of [host,guest]) await p.evaluate(()=>{ window.__freeze=false; });   // the real loop runs from here: the network ticks with it
  await pick(host,'witch'); await host.evaluate(async src=>{ const d=window.__dd, M=window.__meta, W=window.__weapons; const it=eval(src).iceStaff; M.giveItem(it); M.equip(it.id); for(let i=0;i<300;i++){ d.step(1/60,1); const m=W.mounted(); if(m&&m.name==='staff-ice') break; await new Promise(r=>setTimeout(r,25)); } },ITEMS);
  await pick(guest,'fighter');
  await guest.evaluate(async src=>{ const d=window.__dd, M=window.__meta, N=window.__mythic, D=window.__dualwield, W=window.__weapons; const I=eval(src); M.giveItem(I.voidPole); M.equip(I.voidPole.id);
    const ring=N.normalize({tier:'named',named:'tootsie',lvl:20}); M.giveItem(ring); M.equip(ring.id); M.giveItem(I.firePole); D.equip2(I.firePole.id);
    for(let i=0;i<400;i++){ d.step(1/60,1); const m=W.mounted(), o=D.off(); if(m&&m.name==='polearm-void'&&o&&o.name==='polearm-fire') break; await new Promise(r=>setTimeout(r,25)); } },ITEMS);
  await host.evaluate(()=>{ const d=window.__dd; d.setHero(0,10,0); d.step(1/60,5); });
  const rc="fpole-"+Math.random().toString(36).slice(2,8);
  const ho=await host.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const gj=await guest.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  check("co-op: host and guest connect",ho.err===null&&gj.err===null,JSON.stringify({ho,gj}));
  const onHost=await host.waitForFunction(()=>{ const ids=window.__party.list(); for(const id of ids){ const p=window.__party.get(id); if(p&&p.ready&&p.weaponName==='polearm-void'&&p.weapon2==='polearm-fire') return p; } return null; },null,{timeout:120000,polling:250}).then(h=>h.jsonValue()).catch(()=>null);
  const pz=await host.evaluate(()=>{ const ids=window.__party.list(); return ids.map(id=>window.__party.get(id)).map(p=>({glb:p.glb,ready:p.ready,w:p.weaponName,w2:p.weapon2,hand2:p.weapon2Hand,glow:p.weaponGlow,glow2:p.weapon2Glow})); });
  check("co-op: the host sees the guest Fighter's puppet holding the Void polearm, with Tootsie's Fire polearm in its right hand, both glowing",!!onHost&&onHost.glb==='fighter.glb'&&onHost.weapon2Hand==='RightHand'&&onHost.weaponGlow>0&&onHost.weapon2Glow>0,JSON.stringify(onHost||pz));
  const onGuest=await guest.waitForFunction(()=>{ const ids=window.__party.list(); for(const id of ids){ const p=window.__party.get(id); if(p&&p.ready&&p.weaponName) return p; } return null; },null,{timeout:120000,polling:250}).then(h=>h.jsonValue()).catch(()=>null);
  check("co-op: and the guest sees the host Witch's puppet still holding her staff (the Ice staff)",!!onGuest&&onGuest.glb==='witch.glb'&&onGuest.weaponName==='staff-ice',JSON.stringify(onGuest));
  try{ sig.close&&sig.close(); }catch(e){}
}
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis|peer|PeerJS|WebRTC|ICE/i.test(e));
check("no page errors",real.length===0,JSON.stringify(real.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
