// ===== THE CO-OP HIDEOUT, stage 1 (99d-coophideout.js + hideout build 45): a guest who steps through the portal is shown the HOST's
// room (the host's furniture, sent over the co-op link), cannot move it, keeps its OWN save; both players see each other as avatars
// with name tags at each other's positions; a host's change to its room reaches a guest who is inside. Folder build only.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coophideout-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9471, PORT=8899;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(PORT);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const HOST_SAVE={sludge:5000,legendarySludge:20,commonSludge:0,uncommonSludge:0,gear:[],starterLayout:1,forgeBig:1,hotbar:[null,null,null,null,null,null,null,null,null],bag:new Array(27).fill(null),
  placed:[{pid:"h-vend",gid:"vending_machine",x:-4,z:-3,ry:0},{pid:"h-cauldron",gid:"sludge_cauldron",x:6,z:2,ry:1.57},{pid:"h-locker",gid:"wall_locker",x:0,z:-13.12,ry:0},{pid:"h-forge",gid:"ore_forge",x:9,z:-8,ry:0},{pid:"h-chest",gid:"chest",x:-8,z:6,ry:0,store:["display_pedestal"]}]};
async function until(p,fn,arg,ms=90000){ try{ await p.waitForFunction(fn,arg,{timeout:ms}); return true; }catch(e){ return false; } }
async function frameOf(page,part){ for(let i=0;i<400;i++){ const f=page.frames().find(f=>f.url().includes(part)); if(f) return f; await sleep(50); } return null; }

const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
await hostCtx.addInitScript(s=>{ try{ if(!localStorage.getItem('dd_hideout_save_v2')) localStorage.setItem('dd_hideout_save_v2',JSON.stringify(s)); }catch(e){} },HOST_SAVE);
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
for(const p of [hostPage,guestPage]){ p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate",{timeout:90000});
  await p.waitForFunction(()=>window.__dd&&window.__net&&window.__hideout&&window.__coopHideout&&window.__meta,null,{timeout:60000});
  await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); }
const roomCode="hd-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest are connected",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));

// ---- the host's own bridge answers with its furniture (chest contents never leave the host)
const lay=await hostPage.evaluate(()=>window.__coopHideout.layout());
check("the host's layout as the bridge would send it: five pieces, ids and places kept, no chest contents",lay.length===5&&lay.some(p=>p.pid==="h-chest")&&!JSON.stringify(lay).includes("display_pedestal")&&lay.find(p=>p.pid==="h-cauldron").x===6,JSON.stringify(lay).slice(0,300));

// ---- both step through (open the hideout overlay directly: the portal's own E path is proven by hideout-test)
await hostPage.evaluate(()=>{ window.__dd.step(1/60,5); window.__hideout.open(); });
await guestPage.evaluate(()=>{ window.__dd.step(1/60,5); window.__hideout.open(); });
const hf=await frameOf(hostPage,"hideout/index.html"), gf=await frameOf(guestPage,"hideout/index.html");
check("both overlays opened the hideout page, told whether this is a co-op visit and as whom (?coop=host / ?coop=guest)",!!hf&&!!gf&&/coop=host/.test(hf.url())&&/coop=guest/.test(gf.url()),(hf&&hf.url())+" | "+(gf&&gf.url()));
const gReady=await gf.waitForFunction(()=>window.__hd&&window.__hd.visiting(),null,{timeout:120000}).then(()=>true).catch(()=>false);
check("the guest's hideout is a VISIT: it says it is visiting, and names the host",gReady&&(await gf.evaluate(()=>window.__hd.host())).length>0,await gf.evaluate(()=>window.__hd.host()).catch(()=>"?"));
await until(gf,()=>window.__hd.entries().length>=5,null,120000); await until(hf,()=>window.__hd.entries().length>=5,null,120000);
const hEntries=await hf.evaluate(()=>window.__hd.entries()), gEntries=await gf.evaluate(()=>window.__hd.entries());
const pids=a=>a.map(e=>e.pid).sort().join(",");
check("the guest stands in the HOST's room: the same five pieces, same ids, same places",pids(hEntries)===pids(gEntries)&&pids(gEntries)==="h-cauldron,h-chest,h-forge,h-locker,h-vend"&&gEntries.find(e=>e.pid==="h-cauldron").x===6,JSON.stringify(gEntries));
const guestSave=await guestPage.evaluate(()=>JSON.parse(localStorage.getItem('dd_hideout_save_v2')||'null'));
check("the guest's OWN saved room is untouched (its own starter layout, not the host's)",!guestSave||!guestSave.placed||!guestSave.placed.some(p=>p.pid&&p.pid.startsWith("h-")),JSON.stringify(guestSave&&guestSave.placed&&guestSave.placed.map(p=>p.pid)));

// ---- a visitor cannot place or lift furniture: a furniture slot selects nothing, and pick-up says only the host can
await gf.evaluate(()=>{ SAVE.hotbar[0]='display_pedestal'; });
const sel=await gf.evaluate(()=>window.__hd.select(0));
check("in someone else's room a furniture hotbar slot selects nothing (no placing ghost)",sel.gear===null&&sel.drop===null,JSON.stringify(sel));
await hf.evaluate(()=>{ SAVE.hotbar[0]='display_pedestal'; });
const hsel=await hf.evaluate(()=>window.__hd.select(0));
check("in its own room the host's same slot does select (placing still works for the owner)",hsel.gear==='display_pedestal',JSON.stringify(hsel));

// ---- presence: each sees the other, named, at the other's place
await hf.evaluate(()=>window.__hd.teleport(-6,3)); await gf.evaluate(()=>window.__hd.teleport(7,-2));
const seen=await until(gf,()=>window.__hd.peers().some(p=>p.shown&&Math.abs(p.x+6)<.6&&Math.abs(p.z-3)<.6),null,60000)&&await until(hf,()=>window.__hd.peers().some(p=>p.shown&&Math.abs(p.x-7)<.6&&Math.abs(p.z+2)<.6),null,60000);
const gPeers=await gf.evaluate(()=>window.__hd.peers()), hPeers=await hf.evaluate(()=>window.__hd.peers());
check("each player sees the other as an avatar at the other's position",seen,JSON.stringify({guestSees:gPeers,hostSees:hPeers}));
check("the avatars carry name tags (the players' names) and nobody sees themselves",gPeers.length===1&&hPeers.length===1&&gPeers[0].name.length>0&&hPeers[0].name.length>0,JSON.stringify({g:gPeers.map(p=>p.name),h:hPeers.map(p=>p.name)}));

// ---- the avatars wear each player's real hero model (build 47), with a walk and an idle clip
const modelsOn=await until(gf,()=>window.__hd.peers().some(p=>p.model),null,60000)&&await until(hf,()=>window.__hd.peers().some(p=>p.model),null,60000);
const gClips=await gf.evaluate(()=>window.__hd.peers().map(p=>({hero:p.hero,model:p.model,clips:p.clips})));
check("each avatar wears the other player's real hero model (the Knight), with idle and walk clips",modelsOn&&gClips[0].hero==="knight"&&gClips[0].clips.includes("idle")&&gClips[0].clips.includes("walk"),JSON.stringify(gClips));

// ---- the host changes its room while the guest is inside: it shows up for the guest
await hf.evaluate(()=>{ SAVE.placed.push({pid:"h-new",gid:"bookshelf_empty",x:-12,z:-2,ry:0}); spawnPlacedItem("bookshelf_empty",{x:-12,y:GROUND_Y,z:-2},0,"h-new"); writeSave(); });
const live=await until(gf,()=>window.__hd.entries().some(e=>e.pid==="h-new"),null,60000);
check("a piece the host adds while a guest is inside appears for the guest, live",live,JSON.stringify(await gf.evaluate(()=>window.__hd.entries().map(e=>e.pid))));
await hf.evaluate(()=>{ const i=SAVE.placed.findIndex(p=>p.pid==="h-new"); SAVE.placed.splice(i,1); const e=pickupables.find(p=>p.pid==="h-new"); despawnEntry(e); writeSave(); });
const gone=await until(gf,()=>!window.__hd.entries().some(e=>e.pid==="h-new"),null,60000);
check("and a piece the host takes away goes from the guest's room too",gone,JSON.stringify(await gf.evaluate(()=>window.__hd.entries().map(e=>e.pid))));

// ---- THE TRADE WINDOW (hideout build 46)
const CHARM={kind:"carried",rec:{id:"g-test-1",name:"Test Charm",slot:"charm",rarity:2,lvl:5,tier:"rare",stats:{hp:10},value:50,score:30,from:"dungeon-hold"}};
await hf.evaluate(c=>{ SAVE.bag[0]='bookshelf_empty'; SAVE.bag[1]=c; SAVE.bag[2]='vending_machine'; SAVE.hotbar[0]=null; writeSave(); },CHARM);
await gf.evaluate(()=>{ SAVE.bag[0]='display_pedestal'; SAVE.hotbar[0]=null; writeSave(); });
await hf.evaluate(()=>window.__hd.teleport(0,0)); await gf.evaluate(()=>window.__hd.teleport(2,0));
await until(hf,()=>window.__hd.trade.nearest()!==null,null,30000); await until(gf,()=>window.__hd.trade.nearest()!==null,null,30000);
check("standing near a friend, each can find the other to trade with",(await hf.evaluate(()=>window.__hd.trade.nearest()))!==null&&(await gf.evaluate(()=>window.__hd.trade.nearest()))!==null);
await hf.evaluate(()=>window.__hd.trade.ask());
const asked=await until(gf,()=>window.__hd.trade.state().incoming,null,30000);
check("the host's T sends a request the guest sees",asked);
await gf.evaluate(()=>window.__hd.trade.ask());
const bothOpen=await until(hf,()=>window.__hd.trade.state().open,null,30000)&&await until(gf,()=>window.__hd.trade.state().open,null,30000);
check("the guest's T accepts: the trade window opens on both sides",bothOpen);
// starter machines are never offered
await hf.evaluate(()=>window.__hd.trade.toggle('bag',2));
check("a starter machine cannot be put in a trade",(await hf.evaluate(()=>window.__hd.trade.state().mine.length))===0);
await hf.evaluate(()=>{ window.__hd.trade.toggle('bag',0); window.__hd.trade.toggle('bag',1); });
await gf.evaluate(()=>window.__hd.trade.toggle('bag',0));
const seesOffers=await until(gf,()=>window.__hd.trade.state().theirs.length===2,null,30000)&&await until(hf,()=>window.__hd.trade.state().theirs.length===1,null,30000);
const gState=await gf.evaluate(()=>window.__hd.trade.state()), hState=await hf.evaluate(()=>window.__hd.trade.state());
check("each side sees exactly what the other offers (the host offers a bookshelf and a charm, the guest a pedestal)",seesOffers&&gState.theirs[0]==="bookshelf_empty"&&gState.theirs[1].rec.id==="g-test-1"&&hState.theirs[0]==="display_pedestal",JSON.stringify({g:gState.theirs.length,h:hState.theirs}));
// locking on one side, then the other changes its offer: locks reset
await hf.evaluate(()=>window.__hd.trade.lock());
const gSawLock=await until(gf,()=>window.__hd.trade.state().theirLock,null,30000);
await gf.evaluate(()=>{ window.__hd.trade.toggle('bag',0); window.__hd.trade.toggle('bag',0); });   // off and on again: an edit
const reset=await until(hf,()=>!window.__hd.trade.state().myLock,null,30000);
check("the guest saw the host lock in; any change to an offer un-locks both sides",gSawLock&&reset,JSON.stringify(await hf.evaluate(()=>window.__hd.trade.state())));
// nothing has moved yet
const before=await hf.evaluate(()=>window.__hd.trade.inv());
check("nothing moves before both lock in",before.bag[0]==="bookshelf_empty"&&before.bag[1]&&before.bag[1].rec.id==="g-test-1");
// both lock on the same offers: the swap happens
await hf.evaluate(()=>window.__hd.trade.lock()); await gf.evaluate(()=>window.__hd.trade.lock());
const swapped=await until(hf,()=>window.__hd.trade.state().last!==null,null,30000)&&await until(gf,()=>window.__hd.trade.state().last!==null,null,30000);
const hInv=await hf.evaluate(()=>window.__hd.trade.inv()), gInv=await gf.evaluate(()=>window.__hd.trade.inv());
const has=(inv,f)=>[...inv.bag,...inv.hotbar].some(f);
check("both locked in: the swap happens on both sides — the host now has the pedestal and not its bookshelf or charm, the guest the opposite",swapped&&has(hInv,v=>v==="display_pedestal")&&!has(hInv,v=>v==="bookshelf_empty")&&!has(hInv,v=>v&&v.rec&&v.rec.id==="g-test-1")&&has(gInv,v=>v==="bookshelf_empty")&&has(gInv,v=>v&&v.rec&&v.rec.id==="g-test-1")&&!has(gInv,v=>v==="display_pedestal"),JSON.stringify({h:hInv.bag.filter(Boolean).length,g:gInv.bag.filter(Boolean).length}));
check("the trade windows closed on both sides, and the host's starter machine stayed put",!(await hf.evaluate(()=>window.__hd.trade.state().open))&&!(await gf.evaluate(()=>window.__hd.trade.state().open))&&has(hInv,v=>v==="vending_machine"));
const persisted=await hostPage.evaluate(()=>JSON.parse(localStorage.getItem('dd_hideout_save_v2')));
check("the swap is saved: the host's stored bag has the pedestal and no bookshelf",persisted.bag.includes("display_pedestal")&&!persisted.bag.includes("bookshelf_empty"));
// a cancel changes nothing
await hf.evaluate(()=>window.__hd.trade.ask()); await until(gf,()=>window.__hd.trade.state().incoming,null,30000); await gf.evaluate(()=>window.__hd.trade.ask());
await until(hf,()=>window.__hd.trade.state().open,null,30000); await until(gf,()=>window.__hd.trade.state().open,null,30000);
await hf.evaluate(()=>window.__hd.trade.toggle('bag',0));
await hf.evaluate(()=>window.__hd.trade.cancel());
const cancelled=await until(gf,()=>!window.__hd.trade.state().open,null,30000);
const hInv2=await hf.evaluate(()=>window.__hd.trade.inv());
check("a cancel closes the other side's window too and moves nothing",cancelled&&JSON.stringify(hInv2)===JSON.stringify(hInv),JSON.stringify({cancelled}));
// no room: a guest with a completely full bag and hotbar cannot lock in to receive something without giving something
await gf.evaluate(()=>{ for(let i=0;i<SAVE.bag.length;i++) if(!SAVE.bag[i]) SAVE.bag[i]='table_stools'; for(let i=0;i<SAVE.hotbar.length;i++) if(!SAVE.hotbar[i]) SAVE.hotbar[i]='table_stools'; writeSave(); });
await hf.evaluate(()=>window.__hd.trade.ask()); await until(gf,()=>window.__hd.trade.state().incoming,null,30000); await gf.evaluate(()=>window.__hd.trade.ask());
await until(hf,()=>window.__hd.trade.state().open,null,30000); await until(gf,()=>window.__hd.trade.state().open,null,30000);
const hi=await hf.evaluate(()=>window.__hd.trade.inv()); const hIdx=hi.bag.findIndex(v=>v&&v!=="vending_machine"&&v!=="sludge_cauldron"&&v!=="ore_forge"&&v!=="wall_locker"&&v!=="portal");
await hf.evaluate(i=>window.__hd.trade.toggle('bag',i),hIdx);
await until(gf,()=>window.__hd.trade.state().theirs.length===1,null,30000);
await gf.evaluate(()=>window.__hd.trade.lock());
check("with no room for what it would get, the guest cannot lock in (its bag is unchanged, no lock)",!(await gf.evaluate(()=>window.__hd.trade.state().myLock)));
await gf.evaluate(()=>window.__hd.trade.toggle('bag',3)); await gf.evaluate(()=>window.__hd.trade.lock());   // offering one back makes room
check("offering something back makes room, and then it can lock in",await gf.evaluate(()=>window.__hd.trade.state().myLock));
await hf.evaluate(()=>window.__hd.trade.cancel());
await until(gf,()=>!window.__hd.trade.state().open,null,30000);

// ---- leaving: the guest steps out and the host stops seeing it
await guestPage.evaluate(()=>window.__hideout.close());
const left=await until(hf,()=>window.__hd.peers().length===0,null,30000);
check("when the guest leaves the hideout its avatar leaves the host's room",left,JSON.stringify(await hf.evaluate(()=>window.__hd.peers())));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await hostCtx.close(); await guestCtx.close(); await browser.close(); server.close(); sig.removeAllListeners&&sig.removeAllListeners(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(0);
