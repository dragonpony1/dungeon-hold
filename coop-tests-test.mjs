// ===== CO-OP (build 159, 6/7): less on the host's upload in the big waves (99-network.js packMobs/unpackMobs, sendSnap/snapBusy).
// The mob list went to every guest as ~90 bytes of JSON per mob, 12 times a second -- ~170 KB/s of the host's upload per guest at the
// campaign's last wave -- on a reliable, ordered channel that nothing ever checked, so a link that couldn't keep up queued seconds of
// lists in front of every hit and toast. Now a guest that says so (mz on its input) gets the same numbers packed ('mobs'), an older
// build still gets the old 'enemies' list (and this build still reads one), and a link with a backlog skips snapshots until it drains,
// its mob deaths kept for its next list. A host, a real guest, and a raw PeerJS peer standing in for an older build's guest (it never
// says mz) against a local signaling server:
//  - 150 mobs of six kinds (flyers too, one with a test's own string id): the packed list, unpacked, is byte-for-byte the old list the
//    raw peer got from the same broadcast; it is well under half the size; the guest's puppets are exactly the host's mobs;
//  - the raw peer only ever gets 'enemies'; an old host's 'enemies' still makes this build's puppets;
//  - a busy link (the host's bufferedAmount faked over the limit): every snapshot skipped, a one-shot toast still arrives, the deaths
//    in the skipped lists arrive with the first list after it drains; a healthy link never skipped one.
// The build before this one fails 9 of the 19: the packing checks (it only ever sends 'enemies') and the busy-link checks (it never
// skips, and the deaths go out in lists nobody reads).
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-tests-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const sigPort=9651, PORT=8751;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(PORT);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
// map one's training guide walks its own goblin down the lane on the host (96-trainer.js); off, so the mobs are this suite's alone
for(const ctx of [hostCtx,guestCtx]) await ctx.addInitScript(()=>{ try{ localStorage.setItem('dd_trainer',JSON.stringify({done:{},off:true})); }catch(e){} });
// the guest keeps the last 'mobs' message its game parsed (the wire handler's own JSON.parse), with its size and a count
await guestCtx.addInitScript(()=>{ const jp=JSON.parse; window.__rx={}; JSON.parse=function(s){ const o=jp.apply(this,arguments);
  if(o&&typeof o==='object'&&o.type==='mobs'&&'data' in o){ const r=window.__rx.mobs||(window.__rx.mobs={n:0}); r.n++; r.o=o; r.len=typeof s==='string'?s.length:0; } return o; }; });
// the host counts the mob lists it puts on the wire (one JSON.stringify per guest per list: see hostBroadcastEnemies)
await hostCtx.addInitScript(()=>{ const js=JSON.stringify; window.__tx={}; JSON.stringify=function(o){ const s=js.apply(this,arguments);
  if(o&&typeof o==='object'&&(o.type==='mobs'||o.type==='enemies')&&'data' in o) window.__tx[o.type]=(window.__tx[o.type]|0)+1; return s; }; });
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__mobsync&&window.__gsfx,null,{timeout:60000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); });   // every page moves only when stepped here

async function tickBoth(batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await sleep(20); } }
async function waitFor(page,fn,arg,ms=15000){ try{ return await (await page.waitForFunction(fn,arg,{timeout:ms,polling:50})).jsonValue(); }catch(e){ return null; } }
// exactly one mob broadcast: the host is stepped a tick at a time until it has put one list on the wire -- one 'mobs' (the real guest)
// and one 'enemies' (the stand-in) -- and then both are waited for, so the two compared below are always from the same broadcast
async function oneList(){ const tx0=await hostPage.evaluate(()=>({m:window.__tx.mobs|0,e:window.__tx.enemies|0}));
  const rx0=await guestPage.evaluate(()=>({m:(window.__rx.mobs||{n:0}).n,e:window.__raw.n.enemies|0}));
  let tx=tx0; for(let i=0;i<12&&tx.m===tx0.m&&tx.e===tx0.e;i++) tx=await hostPage.evaluate(()=>{ window.__dd.step(1/60,1); return {m:window.__tx.mobs|0,e:window.__tx.enemies|0}; });
  const ok=await waitFor(guestPage,w=>(window.__rx.mobs||{n:0}).n===w.m&&(window.__raw.n.enemies|0)===w.e,{m:rx0.m+tx.m-tx0.m,e:rx0.e+tx.e-tx0.e});
  return !!ok&&tx.m-tx0.m===1&&tx.e-tx0.e===1; }

const code="tst-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({code,peerOpts})=>new Promise(res=>window.__net.host(code,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{code,peerOpts});
const guestJoin=await guestPage.evaluate(({code,peerOpts})=>new Promise(res=>window.__net.join(code,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{code,peerOpts});
// the stand-in for an older build's guest: a bare PeerJS connection that never sends an input (so never says mz) and keeps what it gets
const raw=await guestPage.evaluate(({code,peerOpts})=>new Promise(res=>{ window.__raw={n:{},last:{},len:{}}; const p=new Peer(undefined,peerOpts); window.__rawPeer=p;
  p.on('open',()=>{ const c=p.connect(code,{reliable:true}); c.on('open',()=>res('open')); c.on('error',e=>res('err '+e));
    c.on('data',s=>{ try{ const m=JSON.parse(s); window.__raw.n[m.type]=(window.__raw.n[m.type]|0)+1; window.__raw.last[m.type]=m; window.__raw.len[m.type]=s.length; }catch(e){} }); });
  p.on('error',e=>res('err '+e)); setTimeout(()=>res('timeout'),60000); }),{code,peerOpts});
check("host, a real guest and an older build's stand-in all connect",hostOpen.err===null&&guestJoin.err===null&&raw==='open',JSON.stringify({hostOpen,guestJoin,raw}));
const guestId=guestJoin.id;
await hostPage.evaluate(()=>window.__dd.setHero(500,0,500));   // out of everything's way
await tickBoth(8,5);   // the guest's first inputs (mz) reach the host

// ==== a big wave: 150 mobs of six kinds, flyers included, one with a test's own id and one with a fractional hp ====
const alive=await hostPage.evaluate(()=>{ const d=window.__dd; d.S.crystal=1e9; const K=['goblin','orc','archer','drake','ogre','troll'];
  for(let i=0;i<150;i++){ const e=d.spawn(K[i%K.length],'N'); e.dmg=0; e.x=-14+(i%15)*2+.37; e.z=-26+Math.floor(i/15)*1.3; e.yaw=-3+i*.041; }
  const live=d.enemies.filter(e=>!e.dead); live[7].__coopId='boss-x'; live[11].hp=12.34; return live.length; });
check("the host has the 150 mobs, and nothing else",alive===150,String(alive));
await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await sleep(100);
const listed=await oneList();
check("one broadcast: the real guest gets it as 'mobs', the older build's stand-in as 'enemies'",listed);
const pair=await guestPage.evaluate(()=>{ const m=window.__rx.mobs, e=window.__raw.last.enemies; if(!m||!e||!window.__mobsync.unpack) return {same:false,diedSame:false,n:0,kinds:null,mobsLen:NaN,oldLen:NaN,got:{mobs:!!m,enemies:!!e}};   // an older build: no packed list at all
  const un=window.__mobsync.unpack(m.o.data);
  return {same:JSON.stringify(un)===JSON.stringify(e.data.list),diedSame:JSON.stringify(m.o.data.died)===JSON.stringify(e.data.died),n:un.length,nOld:e.data.list.length,
    mobsLen:m.len,oldLen:window.__raw.len.enemies,kinds:m.o.data.k,firstRow:m.o.data.l[0],firstOld:e.data.list[0],boss:un.find(x=>x.id==='boss-x')||null,frac:un.filter(x=>x.hp===12.3).length,flyer:un.filter(x=>x.kind==='drake'&&x.y>1).length}; });
check("the packed list, unpacked, is exactly the old list the older build got from the same broadcast (every id, kind, spot, facing, stride and hp)",
  listed&&pair.same&&pair.diedSame&&pair.n===150,JSON.stringify({same:pair.same,diedSame:pair.diedSame,n:pair.n,nOld:pair.nOld,firstRow:pair.firstRow,firstOld:pair.firstOld}));
check("...a test's own id, a fractional hp and a flyer's height come through as they were",!!pair.boss&&pair.frac>=1&&pair.flyer>=1,JSON.stringify({boss:pair.boss,frac:pair.frac,flyer:pair.flyer}));
check("...each kind named once per message (six kinds)",Array.isArray(pair.kinds)&&pair.kinds.length===6&&new Set(pair.kinds).size===6,JSON.stringify(pair.kinds));
const ratio=pair.mobsLen/pair.oldLen;
console.log(`   150 mobs: packed ${pair.mobsLen} B, old ${pair.oldLen} B (${(ratio*100).toFixed(0)}%) -- at 12 lists a second, ${(pair.mobsLen*12/1024).toFixed(1)} KB/s per guest instead of ${(pair.oldLen*12/1024).toFixed(1)} KB/s`);
check("the packed list is well under half the size of the old one (150 mobs)",ratio<.4,JSON.stringify({packed:pair.mobsLen,old:pair.oldLen,ratio:+ratio.toFixed(3)}));
for(let i=0;i<4;i++){ await guestPage.evaluate(()=>window.__dd.step(1/60,1)); }
const pups=await guestPage.evaluate(()=>window.__mobsync.list().sort());
const hostIds=await hostPage.evaluate(()=>window.__dd.enemies.filter(e=>!e.dead).map(e=>e.__coopId).sort());
check("the guest's puppets are exactly the host's mobs",JSON.stringify(pups)===JSON.stringify(hostIds),JSON.stringify({guest:pups.length,host:hostIds.length,missing:hostIds.filter(x=>!pups.includes(x)).slice(0,5)}));
const onePup=await guestPage.evaluate(()=>window.__mobsync.get('boss-x'));
const oneMob=await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__coopId==='boss-x'); return {kind:e.kind,x:e.x,z:e.z}; });
check("...a puppet stands where its mob does (within the ease of a few ticks)",!!onePup&&onePup.kind===oneMob.kind&&Math.hypot(onePup.x-oneMob.x,onePup.z-oneMob.z)<.5,JSON.stringify({onePup,oneMob}));
const rawTypes=await guestPage.evaluate(()=>({mobs:window.__raw.n.mobs|0,enemies:window.__raw.n.enemies|0}));
check("the older build's stand-in never got a 'mobs' message, only the old 'enemies' list",rawTypes.mobs===0&&rawTypes.enemies>=1,JSON.stringify(rawTypes));

// ==== an older host: its 'enemies' list still makes this build's puppets (and its deaths their sound) ====
const die0=await guestPage.evaluate(()=>window.__gsfx().die);
await hostPage.evaluate(()=>window.__net.send('enemies',{list:[{id:'e777777',kind:'ogre',x:3.25,y:0,z:-4.5,yaw:1.5,walking:true,hp:123.4}],died:[{id:'e777776',kind:'goblin'}]}));
const oldHost=await waitFor(guestPage,()=>{ const l=window.__mobsync.list(); return l.length===1&&l[0]==='e777777'?{p:window.__mobsync.get('e777777'),die:window.__gsfx().die}:null; });
check("an older host's 'enemies' list is still read: its one ogre is the guest's one puppet, where it said, and its death is heard",
  !!oldHost&&oldHost.p.kind==='ogre'&&oldHost.p.x===3.25&&oldHost.p.z===-4.5&&oldHost.p.hp===123.4&&oldHost.die===die0+1,JSON.stringify({oldHost,die0}));
await oneList();
const back=await guestPage.evaluate(()=>window.__mobsync.list().length);
check("...and this host's next packed list puts the 150 back",back===150,String(back));

// ==== a busy link: the host's channels report 200 KB still waiting ====
const before=await hostPage.evaluate(()=>window.__net.links().map(l=>({id:l.id,skipped:l.skipped,held:l.held})));
check("a healthy link never skipped a snapshot (everything so far went)",before.length===2&&before.every(l=>l.skipped===0&&l.held===0),JSON.stringify(before));
await hostPage.evaluate(()=>{ const pd=Object.getOwnPropertyDescriptor(RTCDataChannel.prototype,'bufferedAmount');
  Object.defineProperty(RTCDataChannel.prototype,'bufferedAmount',{configurable:true,get(){ return window.__fakeBuf!=null?window.__fakeBuf:pd.get.call(this); }}); window.__fakeBuf=200*1024; });
const snapTypes=['enemies','mobs','heroes','world','defs','pickups'];
await sleep(300);   // anything sent before the fake (the defs and pickups lists go out after the mob list in the same step) has landed
const rawBefore=await guestPage.evaluate(T=>T.map(t=>window.__raw.n[t]|0),snapTypes);
const mobsBefore=await guestPage.evaluate(()=>(window.__rx.mobs||{n:0}).n), dieBefore=await guestPage.evaluate(()=>window.__gsfx().die);
const killed=await hostPage.evaluate(()=>{ const d=window.__dd; const live=d.enemies.filter(e=>!e.dead&&e.__coopId!=='boss-x').slice(0,3); live.forEach(e=>d.kill(e)); return live.map(e=>e.__coopId); });
for(let b=0;b<6;b++){ for(let i=0;i<5;i++) await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await sleep(30); }   // 0.5 s: six mob lists, five hero lists, five world lists...
await hostPage.evaluate(g=>window.__net.send('toast','still here',g),guestId);
const toast=await waitFor(guestPage,()=>document.getElementById('toast').textContent==='still here'||null);
await sleep(300);
const during=await hostPage.evaluate(()=>window.__net.links().map(l=>({id:l.id,skipped:l.skipped,held:l.held,alive:l.alive})));
const rawDuring=await guestPage.evaluate(T=>T.map(t=>window.__raw.n[t]|0),snapTypes);
const guestDuring=await guestPage.evaluate(k=>({mobs:(window.__rx.mobs||{n:0}).n,die:window.__gsfx().die,stale:k.filter(id=>window.__mobsync.list().includes(id)).length}),killed);
check("a busy link skips the snapshots: nothing of the five reached either guest in half a second",
  during.every(l=>l.skipped>=6)&&JSON.stringify(rawDuring)===JSON.stringify(rawBefore)&&guestDuring.mobs===mobsBefore,JSON.stringify({during,rawBefore,rawDuring,guestDuring,mobsBefore}));
check("...but a one-shot message still goes straight through (a toast)",!!toast);
check("...and the three mobs killed meanwhile wait for that link, not lost: none heard yet, their puppets still up",
  killed.length===3&&during.every(l=>l.held===3)&&guestDuring.die===dieBefore&&guestDuring.stale===3,JSON.stringify({killed,during,guestDuring,dieBefore}));
await hostPage.evaluate(()=>{ window.__fakeBuf=null; });
const drained=await oneList();
const after=await guestPage.evaluate(k=>({die:window.__gsfx().die,died:window.__rx.mobs?window.__rx.mobs.o.data.died.map(d=>d.id):[],stale:k.filter(id=>window.__mobsync.list().includes(id)).length,rawDied:window.__raw.last.enemies.data.died.map(d=>d.id)}),killed);
const links=await hostPage.evaluate(()=>window.__net.links().map(l=>({held:l.held})));
check("once it drains, its next list carries those three deaths (the guest hears them, the puppets go) -- the older build's too",
  drained&&after.die===dieBefore+3&&killed.every(id=>after.died.includes(id)&&after.rawDied.includes(id))&&after.stale===0&&links.every(l=>l.held===0),JSON.stringify({after,killed,links}));
const conn=await hostPage.evaluate(()=>window.__net.peers().length);
check("nobody was dropped for it: both guests are still connected",conn===2,String(conn));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
