// ===== CO-OP SWEEP 2026-10-02 (towers): a guest's towers on the Drawbridge, as the host's are.
//  * a guest's roof tower goes on the level the GUEST stands on (not the host's), crowding says so; a guest's yard tower stays in the yard while the host is up top -- 56k9-moatdeck.js / 99-network.js
//  * a guest picks (card, E) the towers at its own level, not a hurt one in the yard below -- 56k9-moatdeck.js / 99-network.js
//  * Wardkeeper and Vigil boost the towers near a GUEST, and the guest sees its ward ring -- 99-network.js
//  * the guest's hero bumps into towers and a roof tower's box -- 99-network.js (GDEFAT)
//  * puppets drawn at their mark's size, Marks II-IV's gold ring on a halo, the pit at its range -- 99-network.js / 96c-pitfall.js
//  * the Rune Totem's links and the Snare's capture on the guest -- 99-network.js
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-sweep-towers-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9671;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(9672,{dist:"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function open(){ const ctx=await browser.newContext(); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
  const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:9672/?silent&nogate&map=4",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__moatdeck&&window.__moatdeck.placeAt&&window.__moatwalk&&window.__moatwalk.at&&window.__talents,null,{timeout:90000});
  await p.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); return p; }
const hostPage=await open(), guestPage=await open();
async function tickBoth(batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await sleep(20); } }
const roomCode="tw-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
await tickBoth(8,5);   // the host places the joining guest at its spawn once (a snap) -- let that land before moving it
const Y=await hostPage.evaluate(()=>window.__moatdeck.Y);
await hostPage.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.addMana(1e6); d.S.du=-200; d.S.phase='build'; const W=window.__moatwalk, a=W.at(30,30); d.setHero(a.x,a.z,0); d.hero.y=0; });
// guest up on the roof (the host down on the ground)
const put=async(page,cx,cz,y,yaw=0)=>page.evaluate(({cx,cz,y,yaw})=>{ const d=window.__dd, a=window.__moatwalk.at(cx,cz); d.setHero(a.x,a.z,yaw); d.hero.y=y; d.hero.yaw=yaw; d.step(1/60,1); d.hero.y=y; },{cx,cz,y,yaw});
await put(guestPage,14,6,Y); await tickBoth(6,5);
await guestPage.evaluate(()=>{ window.__dd.addMana&&window.__dd.addMana(0); const c=window.__moatwalk.at(14,9); window.__dd.placeDefAt('harpoon',c.x,c.z,0); });
await tickBoth(6,5);
const A=await hostPage.evaluate(()=>window.__dd.defs.map(d=>({ k:d.kind, deck:!!d.onDeck, base:d.base, own:!!d.ownerId, cells:(d.cells||[]).length })));
check("the guest standing on the roof (the host down on the ground) builds its ballista ON the roof",A.length===1&&A[0].deck&&A[0].base===Y&&A[0].own&&A[0].cells===0,JSON.stringify(A));
await guestPage.evaluate(()=>{ document.getElementById('toast').textContent=''; const c=window.__moatwalk.at(14,9); window.__dd.placeDefAt('harpoon',c.x+.6,c.z,0); });
await tickBoth(6,5);
const B=await Promise.all([hostPage.evaluate(()=>window.__dd.defs.length),guestPage.evaluate(()=>document.getElementById('toast').textContent)]);
check("a second roof tower crowding it is refused and the guest is told so",B[0]===1&&/Already occupied/.test(B[1]),JSON.stringify(B));
// the host builds a HURT ballista in the yard just below; the guest on the roof presses E -- it upgrades its roof tower, not the yard one under it
const C0=await hostPage.evaluate(()=>{ const d=window.__dd, c=window.__moatwalk.at(14,7); const t=d.placeDefAt('harpoon',c.x,c.z,0); if(t){ t.hp=t.max*.5; } return t?{ deck:!!t.onDeck, base:t.base }:null; });
await put(guestPage,14,8,Y,0); await tickBoth(8,5);   // the guest steps up beside its roof tower (2 away), the hurt yard tower 2 away below it
const pk=await guestPage.evaluate(()=>{ const p=window.__defsync.pick(); return p&&{ y:p.y, kind:p.kind }; });
check("the guest's own pick (the ring) is the roof tower, not the hurt yard tower below",C0&&!C0.deck&&pk&&pk.y===Y,JSON.stringify({C0,pk}));
const card=await guestPage.evaluate(()=>{ const c=window.__defsync.card(); return c&&{ y:c.y, hurt:c.hurt }; });
check("the host's card for the guest is the roof tower's",card&&card.y===Y&&!card.hurt,JSON.stringify(card));
await guestPage.evaluate(()=>window.__dd.upgrade()); await tickBoth(6,5);
const C=await hostPage.evaluate(()=>window.__dd.defs.map(d=>({ deck:!!d.onDeck, lvl:d.lvl, hurt:d.hp<d.max })));
check("E on the roof upgrades the roof tower (Mark II) and leaves the yard one alone",C.find(x=>x.deck).lvl===2&&C.find(x=>!x.deck).lvl===1&&C.find(x=>!x.deck).hurt,JSON.stringify(C));
// the other way round: the host up on the roof, the guest down in the yard -- the guest's tower stays in the yard
await put(hostPage,20,6,Y); await put(guestPage,18,6,0); await tickBoth(6,5);
await guestPage.evaluate(()=>{ const c=window.__moatwalk.at(18,8); window.__dd.placeDefAt('harpoon',c.x,c.z,0); });
await tickBoth(6,5);
const D=await hostPage.evaluate(()=>{ const c=window.__moatwalk.at(18,8); const t=window.__dd.defs.find(d=>Math.hypot(d.x-c.x,d.z-c.z)<.1); return t?{ deck:!!t.onDeck, base:t.base, own:!!t.ownerId }:null; });
check("the guest down in the yard (the host up on the roof) builds in the yard",D&&!D.deck&&D.base<1&&D.own,JSON.stringify(D));
// the guest bumps into the yard tower and the roof tower's box
await tickBoth(4,5);
const E=await guestPage.evaluate(Y=>{ const W=window.__moatwalk, c=W.at(18,8), r=W.at(14,9); const D=window.__dd.defs; let deckX=null; const g=window.__defsync; for(const id of g.list()){ const p=g.get(id); if(p.deckBox) deckX=p; }
  return { yard:W.probe(c.x+.3,c.z,0).solid, yardFloorAbove:W.probe(c.x,c.z,30).floor, roof:deckX?W.probe(deckX.x+.3,deckX.z,Y).solid:null, roofDeckFree:W.probe(r.x+3,r.z,Y).solid, localDefs:D.length }; },Y);
check("on the guest, its hero is blocked by the yard ballista and by the roof ballista's box, and can stand on a tower top (GDEFAT)",E.yard===true&&E.roof===true&&E.roofDeckFree===false&&E.yardFloorAbove>1&&E.localDefs===0,JSON.stringify(E));
// mark size, the gold rings on a halo, the pit's size
await hostPage.evaluate(()=>{ const d=window.__dd, W=window.__moatwalk; d.setHero(W.at(30,30).x,W.at(30,30).z,0); d.hero.y=0; const z=W.at(24,30), p=W.at(28,34); const h=d.placeDefAt('zap',z.x,z.z,0); if(h) h.lvl=3; d.placeDefAt('pit',p.x,p.z,0); });
await tickBoth(8,5);
const F=await guestPage.evaluate(()=>{ const g=window.__defsync; const all=g.list().map(id=>g.get(id)); return { roof:all.find(p=>p.kind==='harpoon'&&p.deckBox), zap:all.find(p=>p.kind==='zap'), pit:all.find(p=>p.kind==='pit') }; });
const pitRR=await hostPage.evaluate(()=>{ const t=window.__dd.defs.find(d=>d.kind==='pit'); return t?window.__dd.stat(t,'range'):null; });
check("puppets are drawn at their mark's size (Mark II 1.07x), a Mark III halo wears two gold rings, the pit is as wide as its range",F.roof&&Math.abs(F.roof.sc-1.07)<.002&&F.zap&&F.zap.mr===2&&F.pit&&pitRR&&Math.abs(F.pit.pitB-pitRR)<.05,JSON.stringify({F,pitRR}));
// Wardkeeper and Vigil near the guest
const before=await hostPage.evaluate(()=>{ const t=window.__dd.defs.find(d=>d.ownerId&&d.onDeck)||window.__dd.defs[0]; window.__tw=t; return { dmg:window.__dd.stat(t,'dmg'), cd:window.__dd.stat(t,'cd') }; });
await put(guestPage,14,6,Y);
await guestPage.evaluate(()=>{ const T=window.__talents, r=T.rank; T.tree=()=>'witch'; T.rank=id=>id==='ward'?3:r(id); const k=T.knight; T.knight=()=>Object.assign(k(),{vigil:true}); });
await tickBoth(8,5);
const after=await hostPage.evaluate(()=>({ dmg:window.__dd.stat(window.__tw,'dmg'), cd:window.__dd.stat(window.__tw,'cd') }));
check("a guest with Wardkeeper III and Vigil beside a tower: +24% damage and x.77 cooldown on the host, as single player",Math.abs(after.dmg/before.dmg-1.24)<.03&&Math.abs(after.cd/before.cd-.77)<.01,JSON.stringify({before,after}));
const wr=await guestPage.evaluate(()=>{ const g=window.__defsync; return g.list().map(id=>g.get(id)).filter(p=>p.ward).length; });
check("and the guest sees the ward ring under the towers near it",wr>=1,JSON.stringify({wr}));
// the Rune Totem's links, the Snare's capture
await hostPage.evaluate(()=>{ const d=window.__dd, W=window.__moatwalk, t=W.at(24,36), b=W.at(26,36), s=W.at(30,36); d.placeDefAt('totem',t.x,t.z,0); d.placeDefAt('acorn',b.x,b.z,0); const sn=d.placeDefAt('snare',s.x,s.z,0); window.__sn=sn; });
await tickBoth(10,5);
const R=await guestPage.evaluate(()=>({ n:window.__defsync.rune(), r:window.__dd.rune() }));
check("the guest sees the Rune Totem's rune-light link to the cannon beside it",R.n>=1&&R.r.links>=1&&R.r.rings>=1,JSON.stringify(R));
const s0=await guestPage.evaluate(()=>window.__gsfx().snare|0);
for(let i=0;i<6;i++){ await hostPage.evaluate(()=>{ const d=window.__dd; d.S.phase='wave'; const sn=window.__sn; if(!d.enemies.some(e=>e.kind==='drake'&&!e.dead)){ d.spawn('drake','S'); const e=d.enemies[d.enemies.length-1]; e.x=sn.x+2; e.z=sn.z+1; e.spd=0; } sn.cd=0; }); await tickBoth(2,4); }
const s1=await guestPage.evaluate(()=>window.__gsfx().snare|0);
check("a Snare netting a drake on the host shows its capture on the guest",s1>s0,JSON.stringify({s0,s1}));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
