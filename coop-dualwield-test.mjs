// ===== CO-OP DUAL-WIELD (build 509 prep; parts/staging/99k-dualwield.js, 99-network.js lookOf w2/dh, 98-party.js). A guest Knight wearing Twotimer with a 2nd sword: the host sees that sword in the
// LEFT hand of the guest's puppet, the guest's 2nd-weapon stats count on the host the way the rest of its gear does (its own heroStat numbers, relayed on its input), a 2nd-hand swing plays mirrored on the
// puppet, and taking the ring off clears both. Two pages, a local PeerServer.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer; try { ({ PeerServer } = await import("peer")); } catch(e) { console.log("SKIP co-op suite — the `peer` package isn't installed"); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9134; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>setTimeout(r,300)); const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const PORT=9133; const server=await serve(PORT,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext(); for(const c of [hostCtx,guestCtx]) await c.route(/\/api\//,r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));
for(const p of [hostPage,guestPage]){ await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
  await p.goto("http://127.0.0.1:"+PORT+"/?silent&ownweapons&nogate",{timeout:240000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__party&&window.__weapons&&window.__dualwield&&window.__meta&&window.__dd.heroModel(),null,{timeout:180000}); }
const knight=p=>p.evaluate(async()=>{ try{ window.__trainer.skip(); }catch(e){} await window.__heroes.select('knight'); for(let i=0;i<600;i++){ const m=window.__dd.heroModel(); if(m&&m.label.includes('Knight')&&window.__weapons.state().mounted) return true; await new Promise(r=>setTimeout(r,50)); } return false; });
await knight(guestPage); await knight(hostPage);
const G0=await guestPage.evaluate(async()=>{ const d=window.__dd, M=window.__meta, D=window.__dualwield, N=window.__mythic; M.reset(); d.resetGear(); M.setLevel&&M.setLevel(40); d.start();
  const ring=N.normalize({tier:'named',named:'twotimer',lvl:20}); M.giveItem(ring); M.equip(ring.id); const w=d.rollItem(2,'weapon',8); w.name='Plain Shortsword'; delete w.look; M.giveItem(w); M.equip(w.id);
  const tow0=d.heroStat('tow'); const w2=d.rollItem(3,'weapon',9); w2.name='Ember Blade'; delete w2.look; w2.stats={tow:40,def:9,dmg:5}; M.giveItem(w2); const ok=D.equip2(w2.id);
  for(let i=0;i<200;i++){ if(D.info().off) break; await new Promise(r=>setTimeout(r,50)); } return { ok, tow0, tow1:d.heroStat('tow'), look:D.look(), off:D.info().off }; });
check("the guest wears Twotimer with an Ember Blade as its 2nd sword (in its own left hand)",G0.ok&&G0.off&&G0.off.hand==='LeftHand'&&G0.look&&G0.look.w==='flame'&&G0.tow1===G0.tow0+40,JSON.stringify(G0));
await hostPage.evaluate(()=>{ const d=window.__dd, M=window.__meta; M.reset(); d.resetGear(); d.start(); d.setHero(0,10,0); d.step(1/60,10); });
const roomCode="dw-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
const onHost=await hostPage.waitForFunction(()=>{ const ids=window.__party.list(); if(!ids.length) return null; const p=window.__party.get(ids[0]); return p&&p.ready&&p.weapon&&p.weapon2?p:null; },null,{timeout:90000,polling:200}).then(h=>h.jsonValue()).catch(()=>null);
check("the host sees the guest's 2nd sword (the flame blade) in its puppet's LEFT hand, its main sword in the right",!!onHost&&onHost.weapon2==='flame'&&onHost.weapon2Hand==='LeftHand'&&!!onHost.weaponName,JSON.stringify(onHost&&{w:onHost.weaponName,w2:onHost.weapon2,hand:onHost.weapon2Hand,look:onHost.look&&onHost.look.w2}));
// the 2nd sword's stats count on the host: the guest's tow (what its towers fire with) and def (what its hero takes) ride its input, 2nd weapon included
const gid=await hostPage.evaluate(()=>window.__party.list()[0]);
const ST=await hostPage.waitForFunction(gid=>{ const M=window.__meta; const t=M.defOwnerStat&&M.defOwnerStat(gid,'tow'), d=M.defOwnerStat&&M.defOwnerStat(gid,'def'); return (t!==undefined)?{tow:t,def:d}:null; },gid,{timeout:30000,polling:200}).then(h=>h.jsonValue()).catch(()=>null);
const GS=await guestPage.evaluate(()=>({ tow:window.__dd.heroStat('tow'), def:window.__dd.heroStat('def') }));
check("the guest's 2nd-weapon stats count on the host, as its other gear's do (its defense damage and armour as the host reads them)",!!ST&&ST.tow===GS.tow&&ST.def===GS.def&&GS.tow===G0.tow1,JSON.stringify({host:ST,guest:GS}));
// a 2nd-hand swing plays mirrored on the puppet
let seenM=false, seenA=false; for(let k=0;k<12&&!(seenM&&seenA);k++){ await guestPage.evaluate(()=>window.__dd.swing()); for(let t=0;t<12;t++){ const c=await hostPage.evaluate(gid=>{ const p=window.__party.get(gid); return p&&p.cur; },gid); if(c==='attackM') seenM=true; if(c==='attack') seenA=true; await hostPage.waitForTimeout(40); } await guestPage.waitForTimeout(150); }
check("the guest's swings alternate on the host's screen too: its puppet plays the attack, then the attack mirrored",seenM&&seenA,JSON.stringify({seenA,seenM}));
// the ring off: the 2nd sword back in the guest's bag, gone from the puppet, its stats gone from the host's numbers
await guestPage.evaluate(()=>{ const d=window.__dd, M=window.__meta; const c=d.rollItem(1,'charm',5); c.stats={hp:1}; M.giveItem(c); M.equip(c.id); });
const after=await hostPage.waitForFunction(gid=>{ const p=window.__party.get(gid), t=window.__meta.defOwnerStat(gid,'tow'); return p&&!p.weapon2&&p.weapon?{w2:p.weapon2,tow:t}:null; },gid,{timeout:30000,polling:200}).then(h=>h.jsonValue()).catch(()=>null);
const GB=await guestPage.evaluate(()=>({ back:!window.__dd.gear().weapon2&&window.__meta.bag().some(b=>b.name==='Ember Blade'), tow:window.__dd.heroStat('tow') }));
const T2=await hostPage.waitForFunction(([gid,tow])=>window.__meta.defOwnerStat(gid,'tow')===tow?{tow}:null,[gid,GB.tow],{timeout:20000,polling:200}).then(h=>h.jsonValue()).then(o=>o.tow).catch(()=>null);
check("the guest takes the ring off: the sword goes back to its bag, its puppet's left hand empties, and the host's numbers lose its stats",!!after&&GB.back&&T2===G0.tow0,JSON.stringify({after,GB,T2,tow0:G0.tow0}));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
