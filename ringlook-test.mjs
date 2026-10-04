// ===== THE PET RINGS' LOOKS (build 512 prep; parts/staging/97h2-ringlook.js). Matt: "Using malamute vs beast mode should have some cosmetic application", then "That would be awesome",
// and "It's important on the ring card to mention these advantages".
// Checked: Beast Mode -- both pets 15% bigger, the red-orange glow under each, the red rim and tint; Malamute -- both pets' icy glow, snowflakes and frosty rim; all of it gone when the ring comes off;
// the claw slash / frost burst spawn on pet hits from fixed pools; the howl once a wave, Malamute only, never with sound off; the card chips on both rings (bag/hover card, detail panel, Tab sheet,
// pickup card) and on no other named piece; the stats are the same with and without the looks; co-op: the host sees a guest's Malamute pets frosted, and a guest's pet shot lands as a frost burst.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const server=await serve(9047,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9047/?silent&ownweapons&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__ringlook&&window.__tworings&&window.__mythic&&window.__meta&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(async()=>{ const d=window.__dd, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} await window.__heroes.select('knight'); d.start(); d.step(1/60,3); window.__freeze=true; M.setLevel&&M.setLevel(40);
  for(const l of d.loot.slice()){ try{ d.scene.remove(l.mesh); }catch(e){} } d.loot.length=0;
  const f1=d.rollItem(3,'familiar',8); f1.name='Wisp of Embers'; const f2=d.rollItem(3,'familiar',8); f2.name='Crystal Owl Egg'; M.giveItem(f1); M.giveItem(f2); M.equip(f1.id); window.__f2=f2.id; d.S.phase='build'; d.step(1/60,5); });
await page.evaluate(()=>{ for(const n of ['Wisp of Embers','Crystal Owl Egg']) window.__familiar.build({name:n,rarity:3,slot:'familiar'}); });   // ask for both real models now: a model landing mid-check respawns the pet
await page.waitForFunction(()=>{ const g=window.__familiar.glb?window.__familiar.glb():[]; return g.includes('Wisp')&&g.includes('Crystal Owl'); },null,{timeout:120000}).catch(()=>{});
const wear=id=>page.evaluate(id=>{ const d=window.__dd, M=window.__meta; const it=id?window.__mythic.normalize({tier:'named',named:id,lvl:10}):d.rollItem(1,'charm',5); M.giveItem(it); M.equip(it.id); if(id&&!d.gear().familiar2) window.__tworings.equip2(window.__f2); for(let i=0;i<20;i++) d.step(1/60,1); return it.id; },id);
const info=()=>page.evaluate(()=>window.__ringlook.info());
const stats=()=>page.evaluate(()=>{ const d=window.__dd, F=window.__familiar; return { fdmg:d.heroStat('fdmg'), frate:d.heroStat('frate'), move:d.heroStat('move'), tow:d.heroStat('tow'), dmg:F.dmg(), rate:+F.rate().toFixed(6), hp:d.hero.max }; });

// ---- Beast Mode
await wear('beast_mode'); const B=await info();
check("Beast Mode: BOTH pets ~15% bigger, with the red-orange glow under each, the red rim and tint, embers",B.look==='beast_mode'&&B.pets.every(p=>p&&p.look==='beast_mode'&&Math.abs(p.scale-1.15)<.01&&p.glow===2&&p.glowInPet&&p.rim>=1&&p.tint>=1&&p.embers>0&&p.flakes===0),JSON.stringify(B.pets));
const BSP=await page.evaluate(()=>{ const R=window.__tworings; return [R.fam1(),R.fam2()].map(f=>f&&f.g&&f.g.children[0]?+f.g.children[0].scale.x.toFixed(4):null); });
// ---- Malamute
await wear('malamute'); const Mm=await info();
check("Malamute: BOTH pets get the icy glow, drifting snowflakes and the frosty rim (no size change)",Mm.look==='malamute'&&Mm.pets.every(p=>p&&p.look==='malamute'&&p.scale===1&&p.glow===2&&p.flakes===8&&p.flakeShown>=4&&p.rim>=1&&p.tint>=1&&p.embers===0),JSON.stringify(Mm.pets));
const MSP=await page.evaluate(()=>{ const R=window.__tworings; return [R.fam1(),R.fam2()].map(f=>f&&f.g&&f.g.children[0]?+f.g.children[0].scale.x.toFixed(4):null); });
check("switching rings puts Beast Mode's 15% back before Malamute dresses the pets",BSP.every((s,i)=>s&&MSP[i]&&Math.abs(s/MSP[i]-1.15)<.01),JSON.stringify({BSP,MSP}));
// ---- stats are untouched by the looks
const S1=await stats(); await page.evaluate(()=>{ window.__ringlook.enabled(false); window.__dd.step(1/60,3); }); const off=await info(); const S0=await stats(); await page.evaluate(()=>{ window.__ringlook.enabled(true); window.__dd.step(1/60,3); });
check("the stats are exactly the same with and without the looks (pet damage, pet rate, move, hp...)",JSON.stringify(S1)===JSON.stringify(S0)&&off.active===0,JSON.stringify({S1,S0,offActive:off.active}));
// ---- the hit effects, pooled
const H=await page.evaluate(()=>{ const d=window.__dd, R=window.__ringlook; const c0={claw:R.cnt.claw,frost:R.cnt.frost}; const g=d.spawn('goblin','N'); g.hp=g.max=99999; g.spd=0; g.atk=1e9; d.S.phase='wave';
  for(let i=0;i<60*4;i++){ g.x=d.hero.x+2; g.z=d.hero.z+2.5; d.step(1/60,1); } const fromPets=R.cnt.frost-c0.frost; const p0=R.pools(), m0=R.info().mats;
  for(let i=0;i<40;i++){ R.hitFx('malamute',g.x,1,g.z); R.hitFx('beast_mode',g.x,1,g.z); d.step(1/60,1); } const p1=R.pools();
  const same=k=>p0[k].every(u=>p1[k].includes(u)); g.hp=0; g.dead=true; d.S.phase='build'; d.step(1/60,40);
  return { fromPets, frostPool:p1.frost.length, clawPool:p1.claw.length, kept:same('frost')&&same('claw'), mats0:m0, mats1:R.info().mats, live:R.info().live, hurt:g.hp<99999 }; });
check("Malamute: the pets' hits leave frost bursts (famLand), on the mob",H.fromPets>0,JSON.stringify(H));
check("hit effects come from fixed pools: 80 more hits, at most 10 of each, the same objects reused, no new materials",H.frostPool<=10&&H.clawPool<=10&&H.kept&&H.mats1===H.mats0,JSON.stringify(H));
check("hit effects finish and leave the scene",H.live===0,JSON.stringify(H));
// ---- the howl
const HW=await page.evaluate(()=>{ const d=window.__dd, R=window.__ringlook, S=d.S; const btn=document.getElementById('sndbtn'); const out={};
  const g=d.spawn('goblin','N'); g.hp=g.max=1e9; g.spd=0; g.atk=0;   /* a mob alive keeps each wave going while it is checked */
  const wave=n=>{ S.wave=n; S.phase='wave'; d.step(1/60,1); return R.cnt.howls; };
  if(btn.textContent!=='🔊') btn.click(); out.soundOn=btn.textContent==='🔊';
  S.phase='build'; d.step(1/60,2); const h0=R.cnt.howls; d.startWave(); d.step(1/60,1); out.real=S.phase; out.w1=R.cnt.howls-h0; S.phase='wave'; d.step(1/60,30); out.w1later=R.cnt.howls-h0; out.w2=wave((S.wave|0)+1)-h0;
  const ring=window.__mythic.normalize({tier:'named',named:'beast_mode',lvl:10}); window.__meta.giveItem(ring); window.__meta.equip(ring.id); d.step(1/60,2); out.beast=wave((S.wave|0)+1)-h0;
  const m=window.__mythic.normalize({tier:'named',named:'malamute',lvl:10}); window.__meta.giveItem(m); window.__meta.equip(m.id); d.step(1/60,2);
  btn.click(); out.soundOff=btn.textContent==='🔇'; out.off=wave((S.wave|0)+1)-h0; g.hp=0; g.dead=true; S.phase='build'; d.step(1/60,2); return out; });
check("the howl plays once as a wave starts with Malamute worn (the real horn, then the next wave) -- once per wave, not every frame",HW.soundOn&&HW.real==='wave'&&HW.w1===1&&HW.w1later===1&&HW.w2===2,JSON.stringify(HW));
check("no howl with Beast Mode, and none with the sound off",HW.beast===2&&HW.soundOff&&HW.off===2,JSON.stringify(HW));
// ---- the ring off: all of it goes away
await wear(null); const OFF=await info(); const tree=await page.evaluate(()=>{ const f=window.__tworings.fam1(); const fresh=window.__familiar.build(window.__dd.gear().familiar); const base=fresh.children[0].scale.x; let aura=0, look=0; if(f) f.g.traverse(o=>{ if(o.name==='ringlook-aura') aura++; if(o.material&&o.material.userData&&o.material.userData.rlLook) look++; }); return {aura,look,base,scale:f&&f.g.children[0]?f.g.children[0].scale.x:null}; });
check("take the ring off and the looks go away: no glow, no tint or rim, the size back",OFF.look===null&&OFF.active===0&&OFF.pets[0]&&OFF.pets[0].look===null&&OFF.pets[0].scale===1&&OFF.pets[0].glow===0&&OFF.pets[0].rim===0&&tree.aura===0&&tree.look===0&&Math.abs(tree.scale-tree.base)<1e-6,JSON.stringify({OFF:OFF.pets,tree}));
const noHit=await page.evaluate(()=>{ const R=window.__ringlook, c=R.cnt.claw+R.cnt.frost; R.hitAt(1,1,1); return R.cnt.claw+R.cnt.frost-c; });
check("and pet hits flash nothing without a ring",noHit===0,String(noHit));
// ---- the cards
const CARDS=await page.evaluate(async()=>{ const P=window.__tavpics, R=window.__ringlook, d=window.__dd, M=window.__meta, T=window.__tavern; const N=window.__mythic.normalize;
  const bm=N({tier:'named',named:'beast_mode',lvl:5}), mm=N({tier:'named',named:'malamute',lvl:5}), gc=N({tier:'named',named:'gabriels_charm',lvl:5}), tt=N({tier:'named',named:'twotimer',lvl:5});
  const out={ bag:{ bm:P.chips(bm), mm:P.chips(mm), other:P.chips(gc)+P.chips(tt) } };
  M.giveItem(mm); T.open(); T.tab('bag'); const tile=document.querySelector('.tv-tile[data-id="'+mm.id+'"]'); if(tile){ tile.dispatchEvent(new MouseEvent('mouseover',{bubbles:true})); out.hover=(document.getElementById('tv-hover')||{}).textContent||''; tile.click(); }
  out.detail=(document.getElementById('tv-detail')||{}).textContent||''; T.close();
  M.giveItem(bm); M.equip(bm.id); d.step(1/60,2); const D=window.__doll; D.open(); out.sheetSlot=D.html(); D.select&&D.select(bm.id,'eq','charm'); out.sheetCard=D.html(); D.close();
  const l=d.dropLoot(N({tier:'named',named:'malamute',lvl:5}),d.hero.x+1,d.hero.z+1,true); d.pickup(l); out.pickup=(window.__feel.card()||{}).html||'';
  return out; });
const has=(h,...w)=>w.every(x=>h.includes(x));
check("bag cards: Beast Mode shows 🔥 FERAL · 🐾 bigger · 💢 claw hits beside 2 PETS; Malamute ❄️ FROST · ✨ snow glow · 🐺 howl",has(CARDS.bag.bm,'2 PETS','FERAL','bigger','claw hits')&&has(CARDS.bag.mm,'2 PETS','FROST','snow glow','howl')&&!/FROST/.test(CARDS.bag.bm)&&!/FERAL/.test(CARDS.bag.mm),JSON.stringify({bm:CARDS.bag.bm.length,mm:CARDS.bag.mm.length}));
check("other named pieces (Gabriel's Charm, Twotimer) show no ring-look chips",!/FERAL|FROST|claw hits|howl/.test(CARDS.bag.other),'');
check("the hover card and the detail panel show them",has(CARDS.hover,'FROST','howl')&&has(CARDS.detail,'FROST','howl'),JSON.stringify({hover:CARDS.hover.slice(0,160),detail:CARDS.detail.slice(0,200)}));
check("the Tab sheet shows them (the charm slot and the piece's card)",has(CARDS.sheetSlot,'FERAL','claw hits','2 PETS')&&has(CARDS.sheetCard,'FERAL'),JSON.stringify({slot:/FERAL/.test(CARDS.sheetSlot),card:/FERAL/.test(CARDS.sheetCard)}));
check("the pickup card shows them",has(CARDS.pickup,'FROST','snow glow','2 PETS'),CARDS.pickup.replace(/<[^>]+>/g,' ').slice(0,200));
check("no page errors (single page)",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close();

// ---- co-op: the host sees a guest's Malamute pets frosted
let PeerServer=null; try{ ({ PeerServer } = await import("peer")); }catch(e){ console.log("SKIP co-op part -- the `peer` package isn't installed"); }
if(PeerServer){
  const sigPort=9541; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>setTimeout(r,300)); const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
  const server2=await serve(8957,{dist:process.env.DIST||"./dist"});
  const b2=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const hostPage=await (await b2.newContext()).newPage(), guestPage=await (await b2.newContext()).newPage(); const errs=[];
  for(const p of [hostPage,guestPage]){ p.on("pageerror",e=>errs.push(String(e))); await p.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"})); await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
    await p.goto("http://127.0.0.1:8957/?silent&ownweapons&nogate",{timeout:180000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__party&&window.__familiar&&window.__ringlook&&window.__meta,null,{timeout:180000}); }
  await guestPage.evaluate(()=>{ const d=window.__dd, M=window.__meta; M.reset(); d.resetGear(); M.setLevel&&M.setLevel(40); const f=d.rollItem(3,"familiar",6); f.name="Storm Drake Egg"; M.giveItem(f); M.equip(f.id); const f2=d.rollItem(3,"familiar",6); f2.name="Crystal Owl Egg"; M.giveItem(f2);
    const ring=window.__mythic.normalize({tier:'named',named:'malamute',lvl:10}); M.giveItem(ring); M.equip(ring.id); window.__tworings.equip2(f2.id); d.start(); d.step(1/60,30); });
  await hostPage.evaluate(()=>{ const d=window.__dd, M=window.__meta; M.reset(); d.resetGear(); d.start(); d.setHero(0,10,0); d.step(1/60,30); });
  const rc="ringlook-"+Math.random().toString(36).slice(2,8);
  const ho=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const gj=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  check("co-op: host and guest connect",ho.err===null&&gj.err===null,JSON.stringify({ho,gj}));
  const mine=await guestPage.evaluate(()=>window.__ringlook.info().pets.map(p=>p&&p.look));
  check("co-op: the guest's own two pets are frosted on its own screen",mine[0]==='malamute'&&mine[1]==='malamute',JSON.stringify(mine));
  const pup=await hostPage.waitForFunction(()=>{ const ids=window.__party.list(); const p=ids.length?window.__party.get(ids[0]):null; return p&&p.ready&&p.familiar&&p.familiar2&&p.ringLook&&p.ringLook[0]==='malamute'&&p.ringLook[1]==='malamute'?p:null; },null,{timeout:90000,polling:200}).then(h=>h.jsonValue()).catch(()=>null);
  const hostAura=await hostPage.evaluate(()=>{ const I=window.__ringlook.info(); return { active:I.active, mine:I.look }; });
  check("co-op: the host sees BOTH of the guest's pets frosted (look rg rides the guest's look)",!!pup&&pup.look&&pup.look.rg==='malamute'&&hostAura.active>=2&&hostAura.mine===null,JSON.stringify({pup:pup&&{rl:pup.ringLook,rg:pup.look&&pup.look.rg},hostAura}));
  // a guest's pet shot lands on the host as a frost burst (99g2-petshots.js)
  const f0=await hostPage.evaluate(()=>window.__ringlook.cnt.frost);
  await guestPage.evaluate(()=>{ const h=window.__dd.hero; window.__net.send('pshot',{s:1,c:0x9ee8ff,x:+(h.x+3).toFixed(2),y:1,z:+(h.z+3).toFixed(2)}); });
  const fr=await hostPage.waitForFunction(f0=>{ window.__dd.step(1/60,2); return window.__ringlook.cnt.frost>f0; },f0,{timeout:20000,polling:100}).then(()=>true).catch(()=>false);
  check("co-op: a Malamute partner's pet shot lands as a frost burst on the other screen",fr,'');
  // the guest takes the ring off: the host's copy goes plain
  await guestPage.evaluate(()=>{ const d=window.__dd, M=window.__meta; const c=d.rollItem(1,'charm',5); M.giveItem(c); M.equip(c.id); d.step(1/60,10); });
  const plain=await hostPage.waitForFunction(()=>{ const ids=window.__party.list(); const p=ids.length?window.__party.get(ids[0]):null; return p&&p.familiar&&!p.ringLook[0]&&!p.ringLook[1]&&window.__ringlook.info().active===0?p:null; },null,{timeout:60000,polling:200}).then(h=>h.jsonValue()).catch(()=>null);
  check("co-op: the guest takes the ring off and the host's copy of its pets goes plain",!!plain,'');
  const re=errs.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors (co-op)",re.length===0,re.slice(0,3).join(" | "));
  await b2.close(); server2.close(); sig.close&&sig.close();
}
console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
