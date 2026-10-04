// ===== CO-OP: SIR BULLION on a GUEST (build 529 prep, Avery's way -- coop-avery-test.mjs). The host's roll-out starts the guest's own copy (the stamp, the music); after it the guest sees his real
// model walking, his health bar from the host's numbers, his slam's puddles and his boil-over; on his fall the guest's own page gets its own Fire set (its own weapon type), the picture card and his body
// sinking into the soup. No page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-bullion-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9393;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(9391,{dist:"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));
for(const p of [hostPage,guestPage]){ await p.route("**/api/**",r=>r.fulfill({ status:200, contentType:"application/json", body:"{}" })); await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} }); }
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:9391/?silent&nogate&ownweapons&map=3",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat,null,{timeout:60000}); }
await guestPage.evaluate(()=>window.__heroes.select('witch'));
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,30); });
async function tickBoth(batches=10,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); } }
const roomCode="coopb-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
await hostPage.evaluate(()=>{ const d=window.__dd; d.setHero(d.cw(8),d.cwz(22),0); d.S.crystal=1e9; });
await guestPage.evaluate(()=>{ const d=window.__dd; d.setHero(d.cw(10),d.cwz(22),0); d.setCam(0,.42,8); });
await hostPage.evaluate(async()=>{ const d=window.__dd; d.S.phase='wave'; await window.__bullion.load(); });
await guestPage.evaluate(async()=>{ await window.__bullion.load(); });
await hostPage.evaluate(()=>window.__bullion.startCut());
await tickBoth(6,5);
const C=await guestPage.evaluate(()=>({ cut:window.__bullion.info().cut, stage:getComputedStyle(document.getElementById('bullcut')).display, line:window.__bullion.stamp().line, music:window.__bullion.info().musicAsks }));
check('the host starting his roll-out starts it on the guest too (the stamp, the music)',C.cut===true&&C.stage==='block'&&C.line==="Just when you thought you couldn't screw up miso soup",JSON.stringify(C));
await hostPage.evaluate(()=>window.__bullion.skip()); await tickBoth(4,5);
await tickBoth(14,5);
const P=await guestPage.evaluate(()=>{ let out=null; window.__mobsync.each((p,id)=>{ if(p.kind==='bullion') out={ glb:!!(p.mdl&&p.mdl.glb), vis:p.mdl&&p.mdl.g.visible, hp:p.hp, max:p.max }; }); const bar=document.getElementById('bullbar'); return { pup:out, bar:bar&&bar.style.display, cut:window.__bullion.info().cut }; });
check('after the roll-out the guest sees his real model and his health bar',P.pup&&P.pup.glb&&P.pup.vis&&P.bar==='block'&&!P.cut,JSON.stringify(P));
await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(x=>x.kind==='bullion'&&!x.dead); e.slamCd=0; });
await tickBoth(16,5);
const S=await guestPage.evaluate(()=>{ const B=window.__bullion; let clip=null; window.__mobsync.each(p=>{ if(p.kind==='bullion'&&p.mdl&&p.mdl.cur) clip=p.mdl.cur.getClip().name; }); return { puddles:B.info().puddles, hot:B.info().hotPuddles, fx:B.info().guestFx, clip }; });
check('his slam on the host: the guest sees the Slam and the puddles (looks only)',S.puddles>=2&&S.hot===0&&S.fx>=2,JSON.stringify(S));
await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(x=>x.kind==='bullion'&&!x.dead); e.special=null; e.hp=e.max*.45; e.slamCd=99; });
await tickBoth(6,5);
const B=await guestPage.evaluate(()=>{ let clip=null, fur=false; window.__mobsync.each(p=>{ if(p.kind==='bullion'){ fur=!!p.fur; if(p.mdl&&p.mdl.cur) clip=p.mdl.cur.getClip().name; } }); return { clip, fur, fx:window.__bullion.info().guestFx }; });
check('his boil-over on the host boils over on the guest (furious: he runs there too)',B.fur&&B.clip==='BoilOver',JSON.stringify(B));
const L0=await guestPage.evaluate(()=>({ loot:window.__dd.loot.length, bag:window.__dd.Meta.bag().map(b=>b.id).concat(Object.values(window.__dd.gear()).filter(Boolean).map(g=>g.id)) }));
await hostPage.evaluate(()=>{ const d=window.__dd; const e=d.enemies.find(x=>x.kind==='bullion'&&!x.dead); d.kill(e); });
await tickBoth(12,5);
const D=await guestPage.evaluate(L0=>{ const d=window.__dd, b0=new Set(L0.bag); const it=d.loot.map(l=>l.it).concat(d.Meta.bag().filter(b=>!b0.has(b.id)),Object.values(d.gear()).filter(g=>g&&!b0.has(g.id))).filter(i=>i&&i.setId==='lava'); const w=it.find(i=>i.slot==='weapon'); const I=window.__bullion.info();
  return { slots:it.map(i=>i.slot), wtype:w?window.__typed.of(w):null, mine:window.__typed.heroTypes()[0], falls:I.guestFalls, card:I.fall, dies:I.guestDies, corpses:I.corpses }; },L0);
check('his fall: the guest gets its own Fire set (its own weapon type), the card, and his body sinking into the soup',D.falls===1&&D.slots.length===5&&new Set(D.slots).size===5&&D.wtype===D.mine&&D.card&&D.dies===1,JSON.stringify(D));
check('no page errors',errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
