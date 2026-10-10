// ===== CO-OP CHECK of the crafting builds (game builds 602-611), in the hall with a host and a guest on the Gnome Hall:
//   * the crafting tutorial (99zc-crafttut.js) is solo-only: no banner, no tutorial page, its state untouched, on either page in co-op (both URLs ask for it with &crafttut)
//   * torn recipe pages (99zb-recipes.js): the host rolls a page for the guest ('pageDrop'); the guest drops its own, keyed from ITS OWN book, banks it in its own dd_recipes; the host never takes it (and vice versa)
//   * boss recipes ('bossBeat'): the Pig Lords count on the guest only when the LAST of the three falls on the host; the guest learns into its own book and sees the gold card; Avery too
//   * yesterday's builds: the Engineer's Barricade tiles on the guest's puppets (end cap / straight / end cap), and a Lookout Perch the host raises grows on the guest's puppet and its footholds
// Every /api/ call is answered locally (page.route) -- nothing here talks to the live server.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-crafting-recipes-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9737, PORT=8979;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(PORT,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const EARTH=['weapon','armor','amulet','familiar','charm'].map(p=>'of the Earth|'+p);
async function open(who,book){ const ctx=await browser.newContext({viewport:{width:1100,height:740}});
  await ctx.addInitScript(b=>{ try{ if(sessionStorage.getItem('__cc')) return; sessionStorage.setItem('__cc','1'); localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","1"); localStorage.setItem("dd_talent_card","1");
    localStorage.setItem("dd_trainer",JSON.stringify({done:{},off:true})); localStorage.removeItem("dd_craft_tut"); localStorage.removeItem("ddAutoMana"); localStorage.setItem("dd_recipes",JSON.stringify(b)); }catch(e){} },book);
  await ctx.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({items:[]})}));
  const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(who+": "+String(e)));
  await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate&crafttut&map=0",{timeout:120000});
  await p.waitForFunction(()=>window.__dd&&window.__net&&window.__recipes&&window.__craftTut&&window.__barricade&&window.__perch&&window.__defsync&&window.__lootRates,null,{timeout:120000});
  await p.evaluate(()=>{ window.__freeze=true; }); return p; }
async function tick(pages,batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++) for(const p of pages) await p.evaluate(()=>window.__dd.step(1/60,1)); await sleep(15); } }
async function tickUntil(pages,page,fn,arg,maxBatches=80,size=3){ for(let b=0;b<maxBatches;b++){ const v=await page.evaluate(fn,arg); if(v) return v; await tick(pages,1,size); } return await page.evaluate(fn,arg); }
const book=()=>({ v:1, seeded:1, seededH:1, seededBoss:1, known:{}, pages:{} });
const H=await open('host',book());
const gBook=book(); for(const k of EARTH.slice(0,4)) gBook.known[k]=1;   // the guest knows every Earth piece but the CHARM: its page can only be the Earth charm
const G=await open('guest',gBook);
const P=[H,G];

// ---- connect BEFORE the hall starts, as a real co-op game is set up from the title
const rc="ccr-"+Math.random().toString(36).slice(2,8);
const hostOpen=await H.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
const join=await G.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
check("host and guest connect",!hostOpen.err&&!join.err,JSON.stringify({hostOpen,join}));
for(const p of P) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,10); });
await tick(P,30,5); await sleep(1800); await tick(P,10,5);   // past the recipes' 1.5 s seeding

// ================= (5) the crafting tutorial stays out of co-op =================
const tut=async p=>p.evaluate(()=>{ const T=window.__craftTut, b=document.getElementById('ctBan'); return { role:window.__net.role(), ready:T.ready(), s:T.state().s, ban:!!(b&&b.classList.contains('on')), hand:T.hand(), floor:window.__recipes.list().length, map:window.__dd.S&&window.__dd.S.map }; });
const tH=await tut(H), tG=await tut(G);
check("crafting tutorial: no #ctBan banner or hand on the HOST in co-op, its state never left 0, no tutorial page dropped",tH.role==='host'&&!tH.ready&&!tH.ban&&!tH.hand&&tH.s===0&&tH.floor===0,JSON.stringify(tH));
check("crafting tutorial: none on the GUEST either",tG.role==='guest'&&!tG.ready&&!tG.ban&&!tG.hand&&tG.s===0&&tG.floor===0,JSON.stringify(tG));

// ================= (1) torn recipe pages =================
const S0=await H.evaluate(()=>{ const d=window.__dd; return { x:+d.hero.x.toFixed(2), z:+d.hero.z.toFixed(2), chance:window.__recipes.chance('goblin') }; });
const spot={ x:S0.x, z:S0.z+3 };
await H.evaluate(s=>window.__dd.setHero(s.x+12,s.z),spot); await G.evaluate(s=>window.__dd.setHero(s.x-12,s.z),spot);
const hBook0=await H.evaluate(()=>window.__recipes.read()), gBook0=await G.evaluate(()=>window.__recipes.read());
const roll=await H.evaluate(s=>{ const e={ kind:'goblin', x:s.x, y:0, z:s.z, dead:.001, hp:0, max:1, mana:0, r:.5 }; const real=Math.random; Math.random=()=>0.001;
  try{ window.__lootRates.roll(e); } finally{ Math.random=real; } return { floor:window.__recipes.list(), info:window.__recipes.info() }; },spot);
const gGot=await tickUntil(P,G,()=>window.__recipes.list().length?window.__recipes.list():null,null,60,2);
check("a goblin the host kills rolls a page for itself AND one for the guest ('pageDrop'): the guest drops its own on its floor",S0.chance>0&&roll.floor.length===1&&!!gGot&&gGot.length===1,JSON.stringify({chance:S0.chance,host:roll.floor,guest:gGot}));
check("the guest's page is keyed from ITS OWN book (the one Earth piece it doesn't know: the charm); the host's from the host's",!!gGot&&gGot[0].k==='of the Earth|charm'&&EARTH.includes(roll.floor[0]&&roll.floor[0].k),JSON.stringify({host:roll.floor.map(p=>p.k),guest:gGot&&gGot.map(p=>p.k)}));
// the HOST walks onto the spot: it takes ITS page, the guest's page is untouched
await H.evaluate(s=>window.__dd.setHero(s.x,s.z),spot); await tick(P,30,5);
const A=await H.evaluate(()=>({ floor:window.__recipes.list().length, pages:window.__recipes.read().pages })), Ag=await G.evaluate(()=>({ floor:window.__recipes.list().length, pages:window.__recipes.read().pages }));
const sum=o=>Object.values(o||{}).reduce((a,b)=>a+(b|0),0);
check("the host on the spot takes only its own page (+1 in the HOST's book); the guest's page stays on the guest's floor, the guest's book unchanged",A.floor===0&&sum(A.pages)===sum(hBook0.pages)+1&&Ag.floor===1&&sum(Ag.pages)===sum(gBook0.pages),JSON.stringify({host:A,guest:Ag}));
// then the GUEST walks onto it
await H.evaluate(s=>window.__dd.setHero(s.x+12,s.z),spot); await G.evaluate(s=>window.__dd.setHero(s.x,s.z),spot);
const Bg=await tickUntil(P,G,()=>window.__recipes.list().length===0?window.__recipes.read():null,null,60,4);
const Bh=await H.evaluate(()=>window.__recipes.read());
check("the guest picks its page up: +1 on the Earth charm in the GUEST's own dd_recipes",!!Bg&&(Bg.pages['of the Earth|charm']|0)===1,JSON.stringify(Bg&&Bg.pages));
check("and the host's book did not move when the guest took it (the host never picks up the guest's page)",JSON.stringify(Bh.pages)===JSON.stringify(A.pages)&&!Bh.pages['of the Earth|charm']===!A.pages['of the Earth|charm'],JSON.stringify({before:A.pages,after:Bh.pages}));

// ================= (2) boss recipes =================
await H.evaluate(()=>{ const E=window.__dd.enemies; for(const e of E) e.dead=e.dead||.001; });
const gB0=await G.evaluate(()=>{ const b=window.__recipes.read(); return { bosses:b.bosses||{}, card:document.getElementById('bossRecipeCard').classList.contains('on') }; });
const pig=await H.evaluate(()=>{ const d=window.__dd, Hh=d.hero; const mk=k=>({ kind:k, x:Hh.x+3, y:0, z:Hh.z+3, dead:0, hp:1, max:1, mana:0, r:.5 }); const Ps=['pigflail','pigdagger','pigsling'].map(mk); d.enemies.push(...Ps); window.__pigs=Ps;
  for(const p of Ps.slice(0,2)){ p.dead=.001; window.__lootRates.roll(p); } return (window.__recipes.read().bosses||{}).pigs|0; });
await sleep(700);
const g2=await G.evaluate(()=>({ pigs:(window.__recipes.read().bosses||{}).pigs|0, card:document.getElementById('bossRecipeCard').classList.contains('on') }));
check("two Pig Lords down on the host: nothing yet, host or guest",pig===0&&g2.pigs===0&&!g2.card&&!gB0.card,JSON.stringify({host:pig,guest:g2}));
const pig3=await H.evaluate(()=>{ const d=window.__dd, Ps=window.__pigs; Ps[2].dead=.001; window.__lootRates.roll(Ps[2]); for(const p of Ps){ const i=d.enemies.indexOf(p); if(i>=0) d.enemies.splice(i,1); } const b=window.__recipes.read(); return { pigs:b.bosses.pigs, named:Object.keys(b.named||{}), tusk:(b.trophies||{}).pigs|0 }; });
const g3=await tickUntil(P,G,()=>{ const b=window.__recipes.read(); if(!((b.bosses||{}).pigs>0)) return null; const c=document.getElementById('bossRecipeCard'); return { pigs:b.bosses.pigs, tusk:(b.trophies||{}).pigs|0, named:Object.keys(b.named||{}), sets:Object.keys(b.known).filter(k=>/^of (Chaos|Radiance)\|/.test(k)), card:c.classList.contains('on'), txt:c.textContent }; },null,40,2);
check("the LAST Pig Lord falls on the host: the host counts once (Rootsplitter, a tusk)",pig3.pigs===1&&pig3.tusk===1&&pig3.named.includes('rootsplitter'),JSON.stringify(pig3));
check("...and the GUEST learns into its own book too: the Pig Lords beaten once, a tusk, Rootsplitter, a Chaos/Radiance recipe, and the gold PIG LORDS BEATEN card on its screen",!!g3&&g3.pigs===1&&g3.tusk===1&&g3.named.includes('rootsplitter')&&g3.sets.length===1&&g3.card&&/PIG LORDS BEATEN/.test(g3.txt)&&/MASTERWORK: Rootsplitter/.test(g3.txt),JSON.stringify(g3));
await tick(P,6,5); const g3b=await G.evaluate(()=>(window.__recipes.read().bosses||{}).pigs|0);
check("and only once (no second count from the guest's own side)",g3b===1,String(g3b));
await H.evaluate(()=>{ const d=window.__dd, Hh=d.hero; window.__lootRates.roll({ kind:'avery', x:Hh.x+3, y:0, z:Hh.z+3, dead:.001, hp:0, max:1, mana:0, r:.5 }); });
const gAv=await tickUntil(P,G,()=>{ const b=window.__recipes.read(); return (b.bosses||{}).avery>0?{ avery:b.bosses.avery, scale:(b.trophies||{}).avery|0, tear:!!(b.named||{}).tear_of_the_rootgate }:null; },null,40,2);
check("Avery beaten by the host: the guest gets its Avery win (a scale, Tear of the Rootgate)",!!gAv&&gAv.avery===1&&gAv.scale===1&&gAv.tear,JSON.stringify(gAv));

// ================= (6a) the Barricade tiles on the guest's puppets =================
const lay=await H.evaluate(()=>{ const d=window.__dd; d.addMana(5000); const Hh=d.hero; const bx=Math.round(Hh.x/2)*2, bz=Math.round(Hh.z/2)*2-10; const out=[];
  for(let i=-1;i<=1;i++){ const w=d.placeDefAt('barricade',bx+i*2,bz,0); out.push(w?{x:w.x,z:w.z}:null); } d.step(1/60,2); return out; });
check("the host lays three barricades in a row",lay.every(Boolean),JSON.stringify(lay));
const hostPieces=await tickUntil(P,H,()=>{ const ws=window.__dd.defs.filter(d=>d.kind==='barricade').sort((a,b)=>a.x-b.x); const ps=ws.map(w=>window.__barricade.pieceOf(w).join('+')); return window.__barricade.info().pieces.length>=5&&ps.every(s=>s&&!/stub/.test(s))?ps:null; },null,300,2);
const guestPieces=await tickUntil(P,G,()=>{ const out=[]; window.__dd.scene.traverse(o=>{ if(o.userData&&o.userData.wallKind==='barricade'&&o.userData.pieces) out.push({ x:o.position.x, p:o.userData.pieces.children.map(c=>c.userData.pn||'stub').join('+') }); });
  out.sort((a,b)=>a.x-b.x); const ps=out.map(o=>o.p); return out.length===3&&window.__barricade.info().pieces.length>=5&&ps.every(s=>s&&!/stub/.test(s))?ps:null; },null,300,2);
check("the guest's three wall puppets tile like the host's walls: end cap, straight, end cap (not three lone posts)",!!guestPieces&&JSON.stringify(guestPieces)===JSON.stringify(hostPieces)&&guestPieces[0]==='endcap'&&guestPieces[1]==='straight'&&guestPieces[2]==='endcap',JSON.stringify({host:hostPieces,guest:guestPieces}));

// ================= (6b) a Lookout Perch the host raises grows on the guest =================
const perch=await H.evaluate(()=>{ const d=window.__dd; d.addMana(50000); const p=d.placeDefAt('perch',12,14,0); d.step(1/60,2); return p?{x:p.x,z:p.z,base:p.base,lvl:p.lvl}:null; });
check("the host sets a Lookout Perch",!!perch,JSON.stringify(perch));
const gp1=await tickUntil(P,G,()=>{ let m=null; window.__dd.scene.traverse(o=>{ if(o.userData&&o.userData.perchLift&&!m) m=o; }); const r=window.__dd.rails(); return m&&r.length>=2?{ lift:m.userData.perchLift.position.y, scaf:m.userData.perchScaf.userData.h, rails:r.length }:null; },null,150,3);
const up=await H.evaluate(()=>{ const d=window.__dd, p=d.defs.find(x=>x.kind==='perch'), Hh=d.hero; const tops=[];
  for(let k=0;k<2;k++){ Hh.x=p.x-.3; Hh.z=p.z-.4; Hh.y=p.railboxes[0].top; Hh.vy=0; d.upgradeDef(); for(let i=0;i<90;i++) d.step(1/60,1); tops.push(+(p.railboxes[0].top-p.base).toFixed(2)); }
  return { lvl:p.lvl, deck:+(p.railboxes[0].top-p.base).toFixed(2), climb:+(p.railboxes[1].climb-p.base).toFixed(2), tops }; });
check("the host raises it twice from its deck: Mark III, deck at 5",up.lvl===3&&up.deck===5,JSON.stringify(up));
const gp3=await tickUntil(P,G,()=>{ let m=null; window.__dd.scene.traverse(o=>{ if(o.userData&&o.userData.perchLift&&!m) m=o; }); if(!m) return null; const lift=m.userData.perchLift.position.y; if(Math.abs(lift-2.5)>.01) return null;
  const r=window.__dd.rails(); const tops=r.map(b=>b.top); return { lift, scaf:m.userData.perchScaf.userData.h, rails:r.length, maxTop:Math.max(...tops), raw:r }; },null,200,3);
check("on the guest the perch puppet was Mark I (lookout lifted 0) before",!!gp1&&gp1.lift===0&&gp1.rails===2,JSON.stringify(gp1));
check("on the guest the perch puppet grows with it: lookout lifted 2.5 on a 2.5 scaffold, still two footholds, the deck foothold at 5 above the base",!!gp3&&gp3.scaf===2.5&&gp3.rails===2&&Math.abs(gp3.maxTop-(perch.base+5))<.05,JSON.stringify(gp3));

const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis/i.test(e));
check("no page errors",real.length===0,real.slice(0,4).join(" | "));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
