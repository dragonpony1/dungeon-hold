// ===== co-op sweep 2026-10-02 (cross-area): a host and a guest, real time, a local PeerServer.
//  * armour pieces: each sees the other's shoulder guards / chest / cape (72b-armorlook.js build + 98-party.js, look.a)
//  * mana orbs: a guest's reach is the single-player 3.6 magnet, not 1.1 (99-network.js guestPickupTick)
//  * a guest can't set a tower down on top of the host's hero: red ghost + the host refuses (99-network.js hostTryPlaceDef)
//  * a guest's pet keeps fighting while the guest has a menu open, as the host's does (99-network.js update wrap)
//  * partners see each other's pet shots, and the host's Bramblewhisk patches (99g2-petshots.js)
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer; try { ({ PeerServer } = await import("peer")); } catch(e) { console.log("SKIP coop-sweep-cross-area-test.mjs -- the `peer` package isn't installed"); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9543; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>setTimeout(r,300)); const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const PORT=9863; const server=await serve(PORT,{dist:"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
for(const c of [hostCtx,guestCtx]) await c.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate",{timeout:240000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__party&&window.__familiar&&window.__meta&&window.__armorlook&&window.__petshots&&window.__mythic,null,{timeout:180000}); }
await guestPage.evaluate(()=>{ const d=window.__dd, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} window.__heroes.select('knight'); M.reset(); d.resetGear();   /* the hero first: each hero wears its own gear */ const f=d.rollItem(3,"familiar",6); f.name="Storm Drake Egg"; M.giveItem(f); M.equip(f.id);
  const a=window.__mythic.normalize({tier:'named',named:'mossheart_aegis',lvl:10}); M.giveItem(a); M.equip(a.id); d.start(); d.setHero(-6,6,Math.PI); d.step(1/60,30); });
await hostPage.evaluate(()=>{ const d=window.__dd, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} M.reset(); d.resetGear(); const a=d.rollItem(1,"armor",4); a.name="Bark Coat of the Void"; M.giveItem(a); M.equip(a.id);
  const f=window.__mythic.normalize({tier:'named',named:'bramblewhisk',lvl:10}); M.giveItem(f); M.equip(f.id); d.start(); d.setHero(6,6,0); d.step(1/60,30); });
const rc="xa-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
const gid=guestJoin.id, hid=hostOpen.id;
await hostPage.evaluate(gid=>{ const d=window.__dd; d.addMana(1e5); d.S.du=-200; window.__combat.setGuestMana(gid,1e5); },gid);

// ---- armour pieces on the partner's puppet
const arH=await hostPage.waitForFunction(gid=>{ const p=window.__party.get(gid); return p&&p.ready&&p.armor===4?{a:p.look&&p.look.a,armor:p.armor}:null; },gid,{timeout:90000,polling:250}).then(h=>h.jsonValue()).catch(()=>null);
check("the host sees the guest's Mossheart Aegis chestplate, shoulder guards and cape on its puppet",!!arH&&arH.a==="named:mossheart_aegis",JSON.stringify(arH||await hostPage.evaluate(gid=>window.__party.get(gid),gid)));
const arG=await guestPage.waitForFunction(hid=>{ const p=window.__party.get(hid); return p&&p.ready&&p.armor===4?{a:p.look&&p.look.a,armor:p.armor}:null; },hid,{timeout:90000,polling:250}).then(h=>h.jsonValue()).catch(()=>null);
check("the guest sees the host's Void armour pieces on its puppet",!!arG&&arG.a==="set:of the Void",JSON.stringify(arG||await guestPage.evaluate(hid=>window.__party.get(hid),hid)));

// ---- a guest can't box the host in
await guestPage.evaluate(()=>{ const d=window.__dd; d.setHero(-6,6,Math.PI); d.select('harpoon'); });
await sleep(600);
const g0=await guestPage.evaluate(()=>window.__dd.ghost());
check("the guest's ballista ghost is green on a free spot",!!g0&&g0.ok,JSON.stringify(g0));
await hostPage.evaluate(g0=>{ window.__dd.setHero(g0.x,g0.z,0); },g0);
const g1=await guestPage.waitForFunction(()=>{ const g=window.__dd.ghost(); return g&&!g.ok?g:null; },null,{timeout:15000,polling:100}).then(h=>h.jsonValue()).catch(()=>null);
check("the host walks onto that spot: the guest's ghost turns red, 'Teammate there'",!!g1&&/Teammate there/.test(g1.why),JSON.stringify(g1));
const n0=await hostPage.evaluate(()=>window.__dd.defs.filter(d=>d.kind==='harpoon').length);
await guestPage.evaluate(g0=>{ document.getElementById('toast').textContent=''; window.__dd.placeDefAt('harpoon',g0.x,g0.z,0); },g0);
await sleep(1200);
const n1=await hostPage.evaluate(()=>window.__dd.defs.filter(d=>d.kind==='harpoon').length), t1=await guestPage.evaluate(()=>document.getElementById('toast').textContent);
check("the host refuses a guest's tower on top of the host's hero",n1===n0&&/Teammate there/.test(t1),JSON.stringify({n0,n1,t1}));
await hostPage.evaluate(()=>window.__dd.setHero(6,6,0));
const g2=await guestPage.waitForFunction(()=>{ const g=window.__dd.ghost(); return g&&g.ok?g:null; },null,{timeout:15000,polling:100}).then(h=>h.jsonValue()).catch(()=>null);
check("the host walks off: green again",!!g2,JSON.stringify(g2||await guestPage.evaluate(()=>window.__dd.ghost())));
await guestPage.evaluate(g0=>window.__dd.placeDefAt('harpoon',g0.x,g0.z,0),g0);
const n2=await hostPage.waitForFunction(n0=>{ const n=window.__dd.defs.filter(d=>d.kind==='harpoon').length; return n>n0?n:null; },n0,{timeout:15000,polling:100}).then(h=>h.jsonValue()).catch(()=>null);
check("...and the guest's ballista goes down there",n2===n0+1,JSON.stringify({n0,n2}));
await guestPage.evaluate(()=>{ const d=window.__dd; if(d.ghost()) d.select('harpoon'); });
await hostPage.evaluate(()=>{ const d=window.__dd; for(const t of d.defs.slice()) if(t.kind==='harpoon') window.__perch.remove(t); });

// ---- mana orbs: the single-player reach
await guestPage.evaluate(()=>window.__dd.setHero(-6,6,Math.PI)); await sleep(800);
const m0=await hostPage.evaluate(gid=>window.__combat.guestMana(gid),gid);
const orbN=await hostPage.evaluate(()=>{ const d=window.__dd; const g=d.spawn("goblin","N"); g.x=-6; g.z=3.6; g.y=0; g.spd=0; d.kill(g); return d.orbs.length; });
const orbs=await hostPage.waitForFunction(m0=>{ const d=window.__dd; return d.orbs.length===0?true:null; },m0,{timeout:15000,polling:100}).then(()=>true).catch(()=>false);
const m1=await hostPage.evaluate(gid=>window.__combat.guestMana(gid),gid);
check("orbs from a kill 2.4 away fly to the guest and bank (single player's 3.6 reach, was 1.1)",orbN>0&&orbs&&m1>m0,JSON.stringify({orbN,left:await hostPage.evaluate(()=>window.__dd.orbs.map(o=>[+o.x.toFixed(1),+o.z.toFixed(1)])),m0,m1}));

// ---- the guest's pet fights on under its menu
const gob=await hostPage.evaluate(()=>{ const d=window.__dd; const g=d.spawn("goblin","N"); g.hp=g.max=99999; g.spd=0; g.x=-4.4; g.z=6; g.y=0; g.__xa=1; return g.hp; });
await guestPage.evaluate(()=>window.__pause.open());
await sleep(1500);
const hpA=await hostPage.evaluate(()=>{ const g=window.__dd.enemies.find(e=>e.__xa&&!e.dead); return g?g.hp:null; });
await sleep(4500);
const hpB=await hostPage.evaluate(()=>{ const g=window.__dd.enemies.find(e=>e.__xa&&!e.dead); return g?g.hp:null; });
const open=await guestPage.evaluate(()=>({pause:window.__pause.isOpen(),meta:window.__meta.isOpen()}));
check("a guest with the pause card open: its pet still hits the host's mob (as the host's pet does under his menus)",open.meta&&hpA!=null&&hpB!=null&&hpB<hpA,JSON.stringify({gob,hpA,hpB,open}));
await guestPage.evaluate(()=>window.__pause.close());

// ---- pet shots on the partner's screen
const drawnH=await hostPage.waitForFunction(()=>window.__petshots.cnt.drawn>0?window.__petshots.cnt.drawn:null,null,{timeout:15000,polling:100}).then(h=>h.jsonValue()).catch(()=>null);
check("the host sees the guest's pet shoot (bolts from its puppet's pet)",!!drawnH,JSON.stringify({h:await hostPage.evaluate(()=>window.__petshots.cnt),g:await guestPage.evaluate(()=>({cnt:window.__petshots.cnt,fam:window.__familiar.state(),foes:window.__mobsync.foes().map(e=>[e.x,e.z])}))}));
await hostPage.evaluate(()=>{ const d=window.__dd; const g=d.spawn("goblin","N"); g.hp=g.max=99999; g.spd=0; g.x=7.8; g.z=6; g.y=0; });
const drawnG=await guestPage.waitForFunction(()=>window.__petshots.cnt.drawn>0?window.__petshots.cnt.drawn:null,null,{timeout:20000,polling:100}).then(h=>h.jsonValue()).catch(()=>null);
check("the guest sees the host's pet shoot",!!drawnG,JSON.stringify({g:await guestPage.evaluate(()=>window.__petshots.cnt),h:await hostPage.evaluate(()=>({cnt:window.__petshots.cnt,fam:window.__familiar.state()}))}));
const bram=await guestPage.waitForFunction(()=>{ const l=window.__bramble.list().filter(p=>p.looks); return l.length?l:null; },null,{timeout:20000,polling:100}).then(h=>h.jsonValue()).catch(()=>null);
check("the guest sees the host's Bramblewhisk thorn patch (looks only)",!!bram&&bram.every(p=>p.looks),JSON.stringify(bram||{g:await guestPage.evaluate(()=>window.__bramble.list()),h:await hostPage.evaluate(()=>({on:window.__bramble.on(),list:window.__bramble.list()}))}));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); try{ sig.close(); }catch(e){}
const fails=results.filter(r=>!r).length; console.log(`\n${results.length-fails} pass  ${fails} fail`); process.exit(fails?1:0);
