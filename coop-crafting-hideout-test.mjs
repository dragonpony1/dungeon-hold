// ===== CO-OP CHECK of the crafting builds in the HOST's hideout (game builds 604-611, hideout builds 89-99), with a guest visiting it:
//   * salvage-to-learn: a set piece salvaged from the GUEST's bag (the bag over the room, 96g-hideoutbag.js) teaches the GUEST's recipe, not the host's
//   * the Blacksmith (openForge / Craft, hideout page) used by the guest in the host's room: its locks read the guest's dd_recipes; a craft spends the guest's own Legendary Sludge and lands in the
//     guest's own game bag; a masterwork spends the guest's own trophy; nothing reaches the host's save, bag or book, and the guest's page sends nothing to the server
//   * the crafting tutorial's hideout half under co-op (noted, see the last checks)
// Every /api/ call is answered locally (page.route) -- nothing here talks to the live server.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-crafting-hideout-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const note=(n,d)=>console.log("NOTE "+n+(d?"  -> "+d:""));
const sigPort=9739, PORT=8981;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(PORT,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(p,fn,arg,ms=90000){ try{ await p.waitForFunction(fn,arg,{timeout:ms}); return true; }catch(e){ return false; } }
async function frameOf(page,part){ for(let i=0;i<600;i++){ const f=page.frames().find(f=>f.url().includes(part)); if(f) return f; await sleep(50); } return null; }
const room=ls=>({ sludge:500, legendarySludge:ls, commonSludge:0, uncommonSludge:0, gear:[], starterLayout:1, forgeBig:1, portalStep:1, hotbar:new Array(9).fill(null), bag:new Array(27).fill(null),
  placed:[{pid:"h-vend",gid:"vending_machine",x:-4,z:-3,ry:0},{pid:"h-cauldron",gid:"sludge_cauldron",x:6,z:2,ry:1.57},{pid:"h-locker",gid:"wall_locker",x:0,z:-13.12,ry:0},{pid:"h-forge",gid:"ore_forge",x:9,z:-8,ry:0},{pid:"h-chest",gid:"chest",x:-8,z:6,ry:0}] });
const gRoom=room(30); gRoom.placed=gRoom.placed.map(p=>Object.assign({},p,{pid:p.pid.replace(/^h-/,'g-'),x:p.x+1}));   // the guest's own room: different ids, so a visit is visible
const HOST_BOOK={ v:1, seeded:1, seededH:1, seededBoss:1, known:{}, pages:{}, named:{}, trophies:{}, bosses:{} };
const GUEST_BOOK={ v:1, seeded:1, seededH:1, seededBoss:1, known:{ 'of Chaos|amulet':1 }, pages:{}, named:{ wardens_oath:1 }, trophies:{ pigs:1 }, bosses:{ pigs:1 } };
const apiWrites={ host:[], guest:[] };
async function open(who,save,book){ const ctx=await browser.newContext({viewport:{width:1280,height:800}});
  await ctx.addInitScript(({save,book})=>{ try{ if(sessionStorage.getItem('__ch')) return; sessionStorage.setItem('__ch','1'); localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","3"); localStorage.setItem("dd_talent_card","1");
    localStorage.setItem("dd_trainer",JSON.stringify({done:{},off:true})); localStorage.setItem("dd_tip_forge","1"); localStorage.setItem("dd_craft_tut",JSON.stringify({s:99}));
    localStorage.setItem('dd_hideout_save_v2',JSON.stringify(save)); localStorage.setItem("dd_recipes",JSON.stringify(book)); }catch(e){} },{save,book});
  await ctx.route("**/api/**",r=>{ const q=r.request(); if(q.method()!=='GET') apiWrites[who].push(q.method()+' '+q.url().replace(/^https?:\/\/[^/]+/,'')); r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({items:[]})}); });
  const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(who+": "+String(e)));
  await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate",{timeout:120000});
  await p.waitForFunction(()=>window.__dd&&window.__net&&window.__hideout&&window.__coopHideout&&window.__meta&&window.__recipes&&window.__hideoutbag,null,{timeout:120000});
  await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); return p; }
const H=await open('host',room(20),HOST_BOOK), G=await open('guest',gRoom,GUEST_BOOK);
const rc="cch-"+Math.random().toString(36).slice(2,8);
const hostOpen=await H.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
const join=await G.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
check("host and guest connect",!hostOpen.err&&!join.err,JSON.stringify({hostOpen,join}));
for(let i=0;i<10;i++){ for(const p of [H,G]) await p.evaluate(()=>window.__dd.step(1/60,5)); await sleep(20); }
const hostSnap=async()=>H.evaluate(()=>{ const s=JSON.parse(localStorage.getItem('dd_hideout_save_v2')||'{}'); return { ls:s.legendarySludge, book:localStorage.getItem('dd_recipes'), bag:window.__meta.bag().map(x=>x.id).sort().join(), scrap:Object.values(JSON.parse(localStorage.getItem('dd_gear_bag')||'{}')).reduce((a,b)=>a+(+b||0),0) }; });   // the scrap as a count: the host's own room writes its empty {common:0,...} the first time it opens
const host0=await hostSnap();

await H.evaluate(()=>{ window.__dd.step(1/60,5); window.__hideout.open(); }); await G.evaluate(()=>{ window.__dd.step(1/60,5); window.__hideout.open(); });
const hf=await frameOf(H,"hideout/index.html"), gf=await frameOf(G,"hideout/index.html");
const visiting=gf?await until(gf,()=>window.__hd&&window.__hd.visiting()&&typeof openForge==='function'&&typeof openHallBag==='function'&&document.getElementById('forgeBook'),null,120000):false;
await until(gf,()=>window.__hd.entries().some(e=>e.pid==='h-forge'),null,60000);
const gEnt=gf?await gf.evaluate(()=>window.__hd.entries().map(e=>e.pid).sort().join()):null;
check("the guest is VISITING the host's room (the host's forge h-forge stands there, not its own g-forge)",visiting&&/h-forge/.test(gEnt)&&!/g-forge/.test(gEnt),gEnt);
const hfReady=hf?await until(hf,()=>typeof openForge==='function'&&typeof SAVE==='object',null,120000):false;

// ================= (4) the Blacksmith in the host's room, used by the guest =================
const F=await gf.evaluate(()=>{ window.__forgeFast=true; openForge(); const type=Object.keys(GAME_SLOT).find(t=>GAME_SLOT[t]==='amulet'); const chaos=MYTHIC_SETS.find(x=>x.tail==='of Chaos').id, rad=MYTHIC_SETS.find(x=>x.tail==='of Radiance').id;
  const btn=document.getElementById('forgeCraftBtn'); const st=sid=>{ forgeNamed=null; forgeSelected=type; forgeSet=sid; forgeFocus=SET_STAT_POOL[type][0]; buildForgeGrid(); return { known:recipeState(sid,type).known, dis:btn.disabled, txt:btn.textContent.trim() }; };
  return { type, chaos, rad, sludge:SAVE.legendarySludge, cChaos:st(chaos), cRad:st(rad) }; });
check("the guest's forge locks read the GUEST's book: Chaos Amulet known (Craft on), Radiance Amulet not (locked)",F.sludge===30&&F.cChaos.known&&!F.cChaos.dis&&!F.cRad.known&&F.cRad.dis,JSON.stringify(F));
const hLock=hfReady?await hf.evaluate(f=>recipeState(f.chaos,f.type).known,F):null;
check("(the host's own book does not know the Chaos Amulet -- so the guest's unlock was its own)",hLock===false,String(hLock));
const C=await gf.evaluate(f=>{ forgeNamed=null; forgeSelected=f.type; forgeSet=f.chaos; forgeFocus=SET_STAT_POOL[f.type][0]; forgeStoke=0; buildForgeGrid(); const real=Math.random; Math.random=()=>.5; try{ document.getElementById('forgeCraftBtn').click(); } finally{ Math.random=real; }
  return new Promise(res=>setTimeout(()=>{ const r=window.__forgeLast; res({ id:r&&r.id, set:r&&r.set, tier:r&&r.tier, name:r&&r.name, sludge:SAVE.legendarySludge, saved:JSON.parse(localStorage.getItem('dd_hideout_save_v2')).legendarySludge }); },120)); },F);
let gBag=null; for(let i=0;i<40&&!gBag;i++){ gBag=await G.evaluate(id=>{ const b=window.__meta.bag().find(x=>x.id===id); return b?{ name:b.name, set:b.set }:null; },C.id); if(!gBag) await sleep(100); }
check("the guest crafts a Chaos Amulet: 6 of the GUEST's own Legendary Sludge spent (30 -> 24, in its own save)",C.tier==='mythic'&&C.sludge===24&&C.saved===24,JSON.stringify(C));
check("the crafted piece lands in the GUEST's own game bag",!!gBag,JSON.stringify(gBag));
const hBagHas=await H.evaluate(id=>window.__meta.bag().some(x=>x.id===id),C.id);
check("...and not in the host's",hBagHas===false,String(hBagHas));
const M=await gf.evaluate(()=>{ const type=NAMED_MYTHICS.wardens_oath.type; forgeNamed='wardens_oath'; forgeSelected=type; forgeSet=null; forgeStoke=0; buildForgeGrid(); const btn=document.getElementById('forgeCraftBtn'); const a={ btn:btn.textContent.trim(), dis:btn.disabled, st:masterworkState('wardens_oath') };
  const real=Math.random; Math.random=()=>.5; try{ btn.click(); } finally{ Math.random=real; }
  return new Promise(res=>setTimeout(()=>{ const r=window.__forgeLast; a.made={ id:r.id, named:r.named, mw:!!r.masterwork }; a.tusks=readRecipes().trophies.pigs; a.sludge=SAVE.legendarySludge; res(a); },120)); });
let mBag=null; for(let i=0;i<40&&!mBag;i++){ mBag=await G.evaluate(id=>{ const b=window.__meta.bag().find(x=>x.id===id); return b?b.name:null; },M.made.id); if(!mBag) await sleep(100); }
check("a masterwork (The Warden's Oath) from the GUEST's recipe and the GUEST's own tusk (1 -> 0), 6 more of its sludge, into its own bag",!M.dis&&M.st.known&&M.st.trophies===1&&M.made.named==='wardens_oath'&&M.made.mw&&M.tusks===0&&M.sludge===18&&mBag==="The Warden's Oath",JSON.stringify({M,mBag}));

// ================= (3) salvage-to-learn from the guest's bag over the host's room =================
await gf.evaluate(()=>{ closeForge(); openHallBag(); });
const bagOpen=await until(G,()=>window.__tavern.isOpen()&&window.__hideoutbag.fromHideout(),null,10000);
const SV=await G.evaluate(()=>{ const d=window.__dd, Mt=window.__meta; const it=d.rollItem(2,'amulet',2); it.name=it.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' of Radiance'; it.rarity=2; Mt.giveItem(it); it.locked=false; window.__tavern.select(it.id,'bag');
  const setOf=Mt.sets&&Mt.sets.setOf?Mt.sets.setOf(it):null; const b1=document.querySelector('#tv-detail [data-act="tvsalv"]'); if(b1) b1.click(); const b2=document.querySelector('#tv-detail [data-act="tvsalv"]'); if(b2) b2.click();
  const b=window.__recipes.read(); return { setOf, btn:!!b1, gone:!Mt.bag().some(x=>x.id===it.id), known:!!b.known['of Radiance|amulet'], said:(document.querySelector('#tavern')||{}).textContent.includes('📖') }; });
check("salvaging a Radiance Amulet from the GUEST's bag over the host's room teaches the GUEST's recipe (gone from the bag, 📖 said)",bagOpen&&SV.setOf==='of Radiance'&&SV.btn&&SV.gone&&SV.known&&SV.said,JSON.stringify({bagOpen,SV}));
const gfKnows=await gf.evaluate(f=>recipeState(f.rad,f.type).known,F);
check("...and the forge in the host's room now unlocks the Radiance Amulet for the guest",gfKnows===true,String(gfKnows));
await G.evaluate(()=>{ try{ window.__tavern.close(); }catch(e){} });

// ================= nothing reached the host =================
await sleep(600); for(const p of [H,G]) await p.evaluate(()=>window.__dd.step(1/60,5));
const host1=await hostSnap(); const hfLs=hfReady?await hf.evaluate(()=>SAVE.legendarySludge):null;
check("the host's save is untouched: its Legendary Sludge (20), its recipe book, its bag, its scrap",host1.ls===20&&hfLs===20&&host1.book===host0.book&&host1.bag===host0.bag&&host1.scrap===host0.scrap,JSON.stringify({before:host0,after:host1,hfLs}));
check("the guest's page wrote nothing to the server while crafting and salvaging (no POST/PUT/DELETE on /api/)",apiWrites.guest.length===0,JSON.stringify(apiWrites));

// ================= the crafting tutorial's hideout half under co-op (report only) =================
const T=await gf.evaluate(f=>{ localStorage.setItem('dd_craft_tut',JSON.stringify({ s:4, key:'of Chaos|amulet' })); SAVE.legendarySludge=0; openForge(); const o=ctGet(); const force=ctForceProc(); const ban=document.getElementById('ctBanH').classList.contains('on'); const r={ s:o.s, gave:o.gave, sludge:SAVE.legendarySludge, force, ban }; closeForge(); localStorage.setItem('dd_craft_tut',JSON.stringify({s:99})); return r; },F);
await sleep(300); const banLater=await gf.evaluate(()=>document.getElementById('ctBanH').classList.contains('on'));
check("crafting tutorial (hideout half): no banner over the guest's forge in co-op",!T.ban&&!banLater,JSON.stringify({T,banLater}));
note("a guest whose own save is mid-tutorial (dd_craft_tut s=4) opening the forge in co-op: openForge still advances the tutorial, tops up its sludge and forces the next craft to PROC",JSON.stringify(T));

const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e));
check("no page errors",real.length===0,real.slice(0,4).join(" | "));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
