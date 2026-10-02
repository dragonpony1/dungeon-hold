// ===== CO-OP LOOK (build 150): "don't see the guest's sword", "can't see guests' familiars". What a player wears shows on their
// puppet on every other screen: the weapon in the hand, the familiar at the shoulder, the full-set glow. Two pages, a local
// PeerServer; the guest wears a rare halberd (the frost blade) and a Fire Imp, the host wears the whole Forest set and a Storm Drake.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer; try { ({ PeerServer } = await import("peer")); } catch(e) { console.log("SKIP co-op suite — the `peer` package isn't installed"); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9476; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>setTimeout(r,300)); const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const PORT=8889; const server=await serve(PORT);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext(); const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate",{timeout:240000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__party&&window.__weapons&&window.__familiar&&window.__setglow&&window.__meta,null,{timeout:180000}); }
await guestPage.evaluate(()=>{ const d=window.__dd, M=window.__meta; M.reset(); d.resetGear(); const w=d.rollItem(2,"weapon",8); w.name="Halberd of Winter"; M.giveItem(w); M.equip(w.id); const f=d.rollItem(3,"familiar",6); f.name="Fire Imp Totem"; M.giveItem(f); M.equip(f.id); d.start(); d.step(1/60,30); });
await hostPage.evaluate(()=>{ const d=window.__dd, M=window.__meta; M.reset(); d.resetGear(); for(const [slot,nm] of [["weapon","Broadsword"],["armor","Bark Coat"],["charm","Moss Charm"],["amulet","Acorn Amulet"],["familiar","Storm Drake Egg"]]){ const it=d.rollItem(1,slot,4); it.name=nm+" of the Forest"; M.giveItem(it); M.equip(it.id); } d.start(); d.setHero(0,10,0); d.step(1/60,30); });
for(const p of [hostPage,guestPage]) await p.waitForFunction(()=>window.__weapons.state().mounted,null,{timeout:90000}).catch(()=>{});
const looks={host:await hostPage.evaluate(()=>window.__weapons.look()),guest:await guestPage.evaluate(()=>window.__weapons.look()),hostSets:await hostPage.evaluate(()=>window.__sets.active().map(a=>a.name+":"+a.count))};
check("each client resolves its own look: the guest's halberd is the frost blade; the host's Forest sword is Matt's living-wood sword (build 491)",looks.guest.w==="frost"&&looks.host.w==="sword-forest"&&looks.host.s==="of the Forest",JSON.stringify(looks));
const roomCode="look-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
const onHost=await hostPage.waitForFunction(()=>{ const ids=window.__party.list(); if(!ids.length) return null; const p=window.__party.get(ids[0]); return p&&p.ready&&p.weapon&&p.familiar?p:null; },null,{timeout:90000,polling:200}).then(h=>h.jsonValue()).catch(()=>null);
check("the host sees the guest's puppet with the frost blade in its hand and a Fire Imp at its shoulder (no glow: no full set)",!!onHost&&onHost.weaponName==="frost"&&onHost.familiarKind==="Fire Imp"&&!onHost.glow,JSON.stringify(onHost||await hostPage.evaluate(()=>window.__party.list().map(id=>window.__party.get(id)))));
const onGuest=await guestPage.waitForFunction(()=>{ const ids=window.__party.list(); if(!ids.length) return null; const p=window.__party.get(ids[0]); return p&&p.ready&&p.weapon&&p.familiar&&p.glow?p:null; },null,{timeout:90000,polling:200}).then(h=>h.jsonValue()).catch(()=>null);
check("the guest sees the host's puppet with the living-wood Forest sword, a Storm Drake, and the full-set Forest glow",!!onGuest&&onGuest.weaponName==="sword-forest"&&onGuest.familiarKind==="Storm Drake"&&onGuest.glow===true,JSON.stringify(onGuest||await guestPage.evaluate(()=>window.__party.list().map(id=>window.__party.get(id)))));
await guestPage.evaluate(()=>{ const d=window.__dd, M=window.__meta; const w=d.rollItem(3,"weapon",9); w.name="Ember Warhammer"; M.giveItem(w); M.equip(w.id); d.gear().familiar=null; d.applyGear(); d.saveGear(); d.step(1/60,10); });
const changed=await hostPage.waitForFunction(()=>{ const ids=window.__party.list(); const p=ids.length?window.__party.get(ids[0]):null; return p&&p.weaponName==="flame"&&!p.familiar?p:null; },null,{timeout:90000,polling:200}).then(h=>h.jsonValue()).catch(()=>null);
check("a gear change on the guest re-dresses its puppet on the host (flame blade, the pet gone)",!!changed,JSON.stringify(changed||await hostPage.evaluate(()=>window.__party.list().map(id=>window.__party.get(id)))));
// the sword (build 150: "guests' defenses do damage but not the sword"): a guest's swing lands from the guest's OWN spot and facing,
// even when the host's copy of that guest is somewhere else (stuck behind a hedge, lagging) -- the host spawns a goblin far from
// the copy, the guest reports a swing from right beside it
const sw=await hostPage.evaluate(()=>{ const d=window.__dd; const g=d.spawn("goblin","N"); g.hp=g.max=999; g.spd=0; g.x=9; g.z=-14; g.y=0; d.step(1/60,2); return {hp:g.hp,x:g.x,z:g.z}; });
await guestPage.evaluate(()=>{ window.__net.send('swing',{yaw:0,x:9,z:-15.6,dmg:7,reach:2.4}); });
const swHit=await hostPage.waitForFunction(()=>{ const g=window.__dd.enemies.find(e=>Math.abs(e.x-9)<.01&&!e.dead); return g&&g.hp<999; },null,{timeout:20000,polling:100}).then(()=>true).catch(()=>false);
check("a guest's swing lands from the guest's reported spot and facing, not from the host's copy of it",swHit,JSON.stringify({before:sw,after:await hostPage.evaluate(()=>{ const g=window.__dd.enemies.find(e=>Math.abs(e.x-9)<.01); return g&&{hp:g.hp}; })}));
// the pet (build 150: "guest bat not fighting at all"): the guest's Storm Drake sees the host's mobs through proxies and its hits reach the host
await guestPage.evaluate(()=>{ const d=window.__dd, M=window.__meta; const f=d.rollItem(3,"familiar",6); f.name="Storm Drake Egg"; M.giveItem(f); M.equip(f.id); d.setHero(9,-12,0); d.step(1/60,5); });
const pet=await hostPage.evaluate(()=>{ const d=window.__dd; const g=d.spawn("goblin","N"); g.hp=g.max=999; g.spd=0; g.x=10.5; g.z=-12; g.y=0; d.step(1/60,2); return g.hp; });
const petHit=await hostPage.waitForFunction(()=>{ const g=window.__dd.enemies.find(e=>Math.abs(e.x-10.5)<.01&&!e.dead); return g&&g.hp<999; },null,{timeout:45000,polling:200}).then(()=>true).catch(()=>false);
check("a guest's familiar fights the host's mobs (it aims at the mob puppets; its hits land on the host)",petHit,JSON.stringify({foes:await guestPage.evaluate(()=>window.__mobsync.foes().length),fam:await guestPage.evaluate(()=>window.__familiar.state()&&{kind:window.__familiar.state().kind,target:window.__familiar.state().target}),goblin:await hostPage.evaluate(()=>{ const g=window.__dd.enemies.find(e=>Math.abs(e.x-10.5)<.01); return g&&{hp:g.hp}; })}));
// build 505 (Matt: "jacob second pet not showing"): a guest wearing Beast Mode shows BOTH pets on the host's screen, one at each shoulder
await guestPage.evaluate(()=>{ const d=window.__dd, M=window.__meta; const ring=window.__mythic.normalize({ tier:'named', named:'beast_mode', lvl:10 }); M.giveItem(ring); M.equip(ring.id); const f=d.rollItem(3,"familiar",6); f.name="Fire Imp Totem"; M.giveItem(f); window.__tworings.equip2(f.id); d.step(1/60,5); });
const two=await hostPage.waitForFunction(()=>{ const ids=window.__party.list(); const p=ids.length?window.__party.get(ids[0]):null; return p&&p.familiar&&p.familiar2?p:null; },null,{timeout:45000,polling:200}).then(h=>h.jsonValue()).catch(()=>null);
check("build 505: the host sees the guest's 2nd pet too (Beast Mode worn): a Fire Imp beside the Storm Drake",!!two&&two.familiarKind==="Storm Drake"&&two.familiar2==="Fire Imp",JSON.stringify(two&&{f:two.familiarKind,f2:two.familiar2}));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(0);
