// ===== CO-OP: MANA DROPPED TO GUESTS (99-network.js, build 257). Matt: "in coop drop mana to guests so they can build". Every kill's mana also goes straight into each guest's OWN pool (the same amount those orbs are worth to that guest),
// summed and sent as one orbGrant every .8 s; the host's own pool is untouched by it, the floor orbs still exist, and a guest can spend what it got on a defense.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coopmana-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9472; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" }; const server=await serve(8897);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostPage=await (await browser.newContext()).newPage(), guestPage=await (await browser.newContext()).newPage(); const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));
for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8897/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat&&window.__pickupsync,null,{timeout:60000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); });
const roomCode="mana-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin})); const guestId=guestJoin.id;
async function tickBoth(batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); } }
await hostPage.evaluate(()=>{ const d=window.__dd; d.setHero(500,0,500); d.enemies.forEach(e=>{ e.dead=1; }); d.enemies.length=0; }); await tickBoth(6,5); await guestPage.waitForTimeout(500);   // the host far away, nothing alive to pay anyone
const base=await hostPage.evaluate(id=>({guest:window.__combat.guestMana(id),host:window.__dd.status().mana}),guestId);
// a goblin dies on the host, far from the guest and far from its own orbs: the guest is still paid
const r=await hostPage.evaluate(()=>{ const d=window.__dd; const e=d.spawn("goblin","N"); e.x=0; e.z=-40; e.y=0; e.hp=1; const n=e.mana; d.kill(e); return { n }; });
await tickBoth(4,10);   // > .8 s of host time so the summed grant goes out
const after=await hostPage.evaluate(id=>({guest:window.__combat.guestMana(id),host:window.__dd.status().mana}),guestId);
const want=Math.round(6.3*r.n*10)/10;   // 5 x 1.25 = 6.25, an orb rounds to 6.3
check("a kill's mana lands in the guest's own pool at once (the same as orbs are worth: 5 x 1.25 per orb), wherever the guest stands",Math.abs((after.guest-base.guest)-want)<.11&&r.n>0,JSON.stringify({base,after,want,n:r.n}));
check("the host's own mana is not touched by it",after.host===base.host,JSON.stringify({base:base.host,after:after.host}));
await tickBoth(3,10); const shown=await guestPage.evaluate(()=>+document.getElementById("mana").textContent);
check("the guest's own screen shows the new number (its HUD reads its own pool)",shown===Math.floor(after.guest),JSON.stringify({shown,pool:after.guest}));
// fifty kills, all paid, and a defense the guest could not have afforded before now goes down
const many=await hostPage.evaluate(id=>{ const d=window.__dd; const before=window.__combat.guestMana(id); for(let i=0;i<50;i++){ const e=d.spawn("goblin","N"); e.x=0; e.z=-40; e.y=0; e.hp=1; d.kill(e); } return before; },guestId);
await tickBoth(4,10);
const rich=await hostPage.evaluate(id=>window.__combat.guestMana(id),guestId);
check("fifty more kills add fifty kills' worth to the guest's pool",Math.abs((rich-many)-50*want)<.6,JSON.stringify({many,rich,each:want}));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(0);
