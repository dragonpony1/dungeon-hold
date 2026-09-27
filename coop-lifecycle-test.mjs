// ===== CO-OP LIFECYCLE (build 159): "nobody notices when the host leaves or a tab closes". PeerJS closes a connection only when
// ICE says 'failed' or 'closed', and Chrome never does for a tab that dies -- so a host kept a dead guest's frozen gnome in the hall
// for good, and a guest whose host had gone stood in a dead hall forever. 99-network.js now runs a heartbeat ('alive' once a
// second, on a timer) and drops a peer whose link is dead, or who has gone silent AND whose link stopped answering; whoever leaves
// on purpose says 'bye' from pagehide; a guest in the hall whose host is gone gets THE HOST LEFT and a way back to the title.
// Real browsers against a local PeerJS signaling server (the same client code path as the public broker). It checks:
//  - both sides hear each other's heartbeat; a page that is only BUSY for 9 s (a phone decoding the throne room) is not dropped
//  - a guest's tab crashing (no goodbye at all -- CDP Page.crash) is noticed by the host: its gnome, its hero record, its mob
//    target all go
//  - the host's tab crashing mid-hall gives the guest THE HOST LEFT (the connection dropped), role none, the hall's puppets gone
//  - the host's RETURN TO TITLE (a reload) gives the guest THE HOST LEFT at once, and its button goes back to the title
//  - a guest leaving on purpose sees no such screen, and the host lets it go
//  - four players at most: a fifth connection is told 'full' and let go; a real JOIN of a full hall says "That game is full"
//  - a double Enter on the join box makes ONE connection (it made two: double rewards, a puppet of yourself)
//  - two live guests sharing one lobby seat (a "Duplicate tab") both keep their rows; a duplicated tab takes a fresh seat
//  - the error messages say what went wrong: the matchmaking server down (HOST and JOIN), no game with that code
//  - hosting alone doesn't pile up mob deaths for the first joiner (P6)
// Ports 8701 (http), 9601 (signaling), 9609 (nothing listening: "the matchmaking server is down").
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-lifecycle-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const SP=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/,"")); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const T0=Date.now(); const stamp=l=>console.log("   ["+Math.round((Date.now()-T0)/1000)+" s] "+l);

const PORT=8701, sigPort=9601, DEAD=9609;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const BASE="http://127.0.0.1:"+PORT+"/?silent&nogate";
const UI=port=>BASE+"&peerhost=127.0.0.1&peerport="+port+"&peerpath=/peerjs";
const errors=[];
const slowFrames=()=>{ window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),250); };   // the hall still draws, just a few times a second: nothing here rides the frame loop, and six pages of GL would starve the run
async function newPage(url,opts){ const ctx=(opts&&opts.ctx)||await browser.newContext({viewport:{width:800,height:600}});
  if(!(opts&&opts.ctx)){ await ctx.addInitScript(slowFrames); if(opts&&opts.seat) await ctx.addInitScript(s=>{ try{ sessionStorage.setItem('ddLobbySeat',s); }catch(e){} },opts.seat); }
  const p=await ctx.newPage(); p.setDefaultTimeout(240000); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto(url||BASE,{timeout:240000}); await ready(p); return {ctx,p}; }
const ready=p=>p.waitForFunction(()=>window.__dd&&window.__net&&window.__party&&window.__lobby&&window.__mp&&window.__mobsync,null,{timeout:240000});
async function until(p,fn,arg,ms,label){ const t0=Date.now(); let last=null;
  while(Date.now()-t0<ms){ try{ last=await p.evaluate(fn,arg); if(last) return {v:last,ms:Date.now()-t0}; }catch(e){ last='(navigating) '+String(e).slice(0,80); } await sleep(250); }
  console.log("   … gave up waiting for: "+label+" (last: "+JSON.stringify(last).slice(0,400)+")"); return null; }
const host=(p,rc)=>p.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err.type||err):null,id}),peerOpts)),{rc,peerOpts});
const join=(p,rc)=>p.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err.type||err):null,id}),peerOpts)),{rc,peerOpts});
const step=(p,n)=>p.evaluate(n=>window.__dd.step(1/60,n),n||20);
const endScreen=p=>p.evaluate(()=>({shown:!document.getElementById('dead').classList.contains('hide'),h1:document.getElementById('deadh1').textContent,h2:document.getElementById('deadh2').textContent,again:document.getElementById('againbtn').textContent,
  role:window.__net.role(),peers:window.__net.peers().length,puppets:window.__party.list().length,mobs:window.__mobsync.list().length,orbs:window.__pickupsync.orbs().length,world:!!window.__world.host(),phase:window.__dd.S.phase,said:window.__hostLeft?window.__hostLeft():false}));
const crash=async x=>{ const s=await x.ctx.newCDPSession(x.p); s.send('Page.crash').catch(()=>{}); await sleep(300); };   // the renderer dies on the spot: no pagehide, no goodbye, no clean close -- a crashed tab, a phone's browser killed
const closeCtx=x=>Promise.race([x.ctx.close().catch(()=>{}),sleep(8000)]);
const rc=()=>"lc-"+Math.random().toString(36).slice(2,8);

// ==== A: the heartbeat, a busy page, and a tab that dies without a word ====
const H=await newPage(), G=await newPage();
for(const x of [H,G]) await x.p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); });
const room1=rc(); const h1=await host(H.p,room1), g1=await join(G.p,room1);
check("host and guest connect",!h1.err&&!g1.err,JSON.stringify({h1,g1}));
for(let i=0;i<4;i++){ await step(G.p,10); await step(H.p,10); }
await sleep(2500);
const links=await Promise.all([H,G].map(x=>x.p.evaluate(()=>(window.__net.links?window.__net.links():[]))));
check("both sides hear the other's heartbeat once a second (alive, quiet under 2 s, the link connected)",
  links.every(l=>l.length===1&&l[0].alive&&l[0].quiet<2000&&/connected|completed/.test(l[0].ice)),JSON.stringify(links));

// a page that is only busy -- its main thread blocked for 9 s, as a phone decoding the throne room can be -- still has a live link
await H.p.evaluate(()=>{ const t=Date.now(); while(Date.now()-t<9000){} });
await sleep(1500);
const afterHBusy=await G.p.evaluate(()=>({role:window.__net.role(),peers:window.__net.peers().length,said:window.__hostLeft?window.__hostLeft():false,dead:!document.getElementById('dead').classList.contains('hide')}));
await G.p.evaluate(()=>{ const t=Date.now(); while(Date.now()-t<9000){} });
await sleep(1500);
const afterGBusy=await H.p.evaluate(()=>({peers:window.__net.peers().length}));
check("a page busy for 9 s is NOT taken for gone -- the guest keeps its host, the host keeps its guest (silence over a live link never drops anyone)",
  afterHBusy.role==='guest'&&afterHBusy.peers===1&&!afterHBusy.said&&!afterHBusy.dead&&afterGBusy.peers===1,JSON.stringify({afterHBusy,afterGBusy}));

// the guest's tab dies without a word
for(let i=0;i<4;i++){ await step(G.p,10); await step(H.p,10); }
const gid=g1.id;
const before=await H.p.evaluate(id=>({hero:window.__combat.guestHero(id),targets:window.__dd.Meta.heroes().length,puppet:window.__party.list().includes(id)}),gid);
stamp("crashing the guest's tab");
await crash(G);
const ghostGone=await until(H.p,id=>{ window.__dd.step(1/60,2); return window.__net.peers().length===0&&!window.__combat.guestHero(id)&&window.__dd.Meta.heroes().length===0&&!window.__party.list().includes(id)?true:null; },gid,40000,'host drops the crashed guest');
check("a guest's tab crashing is noticed by the host: its gnome, its hero record and its mob target all go (was: a frozen ghost for good)",
  !!before.hero&&before.targets===1&&before.puppet&&!!ghostGone&&ghostGone.ms<30000,JSON.stringify({before,after:ghostGone&&ghostGone.ms+' ms'}));
await closeCtx(G);

// the host's tab dies without a word while a guest is in the hall with it
const G2=await newPage();
await G2.p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); });
const g2=await join(G2.p,room1);
await H.p.evaluate(()=>window.__dd.startWave());
for(let i=0;i<8;i++){ await step(G2.p,10); await step(H.p,15); }
await sleep(500); await step(G2.p,10);
const g2before=await endScreen(G2.p);
stamp("crashing the host's tab");
await crash(H);
const hostGone=await until(G2.p,()=>!document.getElementById('dead').classList.contains('hide')?true:null,null,40000,"guest's end screen");
const g2after=await endScreen(G2.p);
check("the host's tab crashing mid-hall gives the guest the end screen: THE HOST LEFT, the connection dropped (was: a frozen hall, nothing said)",
  !g2.err&&g2before.role==='guest'&&g2before.puppets>=1&&!!hostGone&&hostGone.ms<30000&&g2after.h1==='THE HOST LEFT'&&/CONNECTION/.test(g2after.h2),JSON.stringify({g2before,g2after,ms:hostGone&&hostGone.ms}));
check("...and the host's hall is gone from the guest's screen: no role, no connection, no puppets, no mobs, no orbs, no cached world, the way back is BACK TO THE TITLE",
  g2after.role===null&&g2after.peers===0&&g2after.puppets===0&&g2after.mobs===0&&g2after.orbs===0&&!g2after.world&&g2after.phase==='dead'&&/BACK TO THE TITLE/.test(g2after.again),JSON.stringify(g2after));
await closeCtx(H);

// ==== B: leaving on purpose -- the host's RETURN TO TITLE, then a guest's own leave ====
const H2=await newPage(UI(sigPort));
const reloadVia=async(x,act)=>{ const ld=x.p.waitForEvent('load',{timeout:240000}); await act().catch(()=>{}); await ld; await ready(x.p); };   // wait for the NEW document, not the old one still unloading
await reloadVia(G2,()=>G2.p.click('#againbtn'));
const g2title=await G2.p.evaluate(()=>({phase:window.__dd.S.phase,role:window.__net.role()}));
check("the end screen's BACK TO THE TITLE goes back to the title screen",g2title.phase==='start'&&g2title.role===null,JSON.stringify(g2title));
const room2=rc(); await host(H2.p,room2);
await G2.p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); });
await join(G2.p,room2); for(let i=0;i<3;i++){ await step(G2.p,10); await step(H2.p,10); }
stamp("host: RETURN TO TITLE");
const h2reload=reloadVia(H2,()=>H2.p.evaluate(()=>window.__pause.toTitle()));
const bye=await until(G2.p,()=>!document.getElementById('dead').classList.contains('hide')?true:null,null,20000,'end screen after RETURN TO TITLE');
const g2bye=await endScreen(G2.p);
check("the host's RETURN TO TITLE (a reload) gives the guest THE HOST LEFT within a few seconds -- the host said goodbye",
  !!bye&&bye.ms<6000&&g2bye.h1==='THE HOST LEFT'&&/CLOSED WITH THEM/.test(g2bye.h2)&&g2bye.role===null,JSON.stringify({g2bye,ms:bye&&bye.ms}));
await h2reload;
await reloadVia(G2,()=>G2.p.click('#againbtn'));
const room3=rc(); await host(H2.p,room3);
await G2.p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); });
const g3=await join(G2.p,room3); for(let i=0;i<3;i++){ await step(G2.p,10); await step(H2.p,10); }
await G2.p.evaluate(()=>window.__net.leave());
const hostLetGo=await until(H2.p,()=>window.__net.peers().length===0?true:null,null,10000,'host lets the leaving guest go');
await sleep(800);
const g2own=await endScreen(G2.p);
check("a guest leaving on purpose sees no THE HOST LEFT (its own close is not the host leaving), and the host lets it go at once",
  !g3.err&&!g2own.shown&&!g2own.said&&g2own.role===null&&g2own.phase==='build'&&!!hostLetGo&&hostLetGo.ms<3000,JSON.stringify({g2own,ms:hostLetGo&&hostLetGo.ms}));

// ==== P6: hosting alone, mobs die with nobody to tell -- the first joiner must not get the backlog ====
const room4=rc(); await host(G2.p,room4);   // G2 hosts now: it is in the hall
const killed=await G2.p.evaluate(()=>{ let n=0; for(let i=0;i<12;i++){ window.__dd.spawn('goblin'); } window.__dd.enemies.filter(e=>!e.dead).forEach(e=>{ window.__dd.kill(e); n++; }); window.__dd.step(1/60,10); return n; });

// ==== C: four at most, and the double Enter ====
// three raw connections (a test's stand-ins for three guests) fill H2's hall; a fourth is told 'full' and let go
const H2code=await (async()=>{ await H2.p.evaluate(()=>window.__mp.open()); await H2.p.click('#hostbtn'); const r=await until(H2.p,()=>{ const el=document.getElementById('hostCode'); return el&&/^[A-Z0-9]{5}$/.test(el.textContent)?el.textContent:null; },null,60000,'room code'); return r&&r.v; })();
const raw=await G2.p.evaluate(({code,port})=>new Promise(res=>{ window.__raw=[]; const out=[]; let n=0;
  const one=i=>{ const p=new Peer(undefined,{host:'127.0.0.1',port,path:'/peerjs'}); window.__raw.push(p); const r={i,open:false,full:false,closed:false};
    p.on('open',()=>{ const c=p.connect(code,{reliable:true}); r.c=c; c.on('open',()=>{ r.open=true; if(i<3) next(); }); c.on('data',d=>{ try{ if(JSON.parse(d).type==='full') r.full=true; }catch(e){} }); c.on('close',()=>{ r.closed=true; }); });
    out.push(r); };
  const next=()=>{ n++; if(n<4) one(n); };
  one(0); setTimeout(()=>res(out.map(r=>({i:r.i,open:r.open,full:r.full,closed:r.closed}))),9000); }),{code:H2code,port:sigPort});
const rawAfter=await G2.p.evaluate(()=>new Promise(r=>setTimeout(()=>r(1),2500))).then(()=>G2.p.evaluate(()=>window.__raw.map((p,i)=>({i,conns:Object.values(p.connections||{}).flat().filter(c=>c.open).length}))));
const h2peers=await H2.p.evaluate(()=>window.__net.peers().length);
check("four players at most: three guests get in, a fourth connection is told 'full' and let go (was: anyone, and past eight unlisted)",
  !!H2code&&h2peers===3&&raw.slice(0,3).every(r=>r.open&&!r.full)&&raw[3]&&raw[3].full&&rawAfter[3].conns===0,JSON.stringify({h2peers,raw,rawAfter}));
// two of those guests claim one lobby seat (a "Duplicate tab" copies it): both rows stay
await G2.p.evaluate(()=>{ window.__raw.slice(0,2).forEach((p,i)=>{ const c=Object.values(p.connections).flat()[0]; c.send(JSON.stringify({type:'lobbyMe',data:{hero:'knight',name:'Twin '+(i+1),seat:'dupseat9',soon:1000,first:500,t:5000,map:0,build:159}})); }); });
const twins=[]; for(let i=0;i<8;i++){ await sleep(400); twins.push(await H2.p.evaluate(()=>window.__lobby.roster().filter(r=>/Twin/.test(r.who)).length)); }
check("two live guests sharing one seat both keep their rows in the host's roster (they used to evict each other)",twins.every(n=>n===2),JSON.stringify(twins));
// a real JOIN of the full hall
const G3=await newPage(UI(sigPort));
await G3.p.evaluate(()=>window.__mp.open()); await G3.p.click('#joinbtn'); await G3.p.fill('#joinCode',H2code); await G3.p.click('#joinGoBtn');
const full=await until(G3.p,()=>{ const s=window.__lobby.state(); return /full/i.test(s.note)&&s.phase==='off'?{note:s.note,role:window.__net.role(),row:!document.getElementById('coopRow').classList.contains('hide')}:null; },null,30000,'full note');
check("JOIN on a full hall says so: 'That game is full', back to the HOST/JOIN buttons, no connection",!!full&&full.v.role===null&&full.v.row,JSON.stringify(full));
await G2.p.evaluate(()=>window.__raw.forEach(p=>p.destroy()));
const emptied=await until(H2.p,()=>window.__net.peers().length===0?true:null,null,15000,'raw guests gone');
// the double Enter: two keydowns on the join box 300 ms apart -- the first attempt is under way by then (in the same instant the
// old code's first attempt quietly gave up by itself; 300 ms apart it made two connections, checked against the build before 159)
await G3.p.click('#joinbtn'); await G3.p.fill('#joinCode',H2code);
await G3.p.evaluate(()=>{ const i=document.getElementById('joinCode'), ev=()=>i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true,cancelable:true})); ev(); setTimeout(ev,300); });
await until(G3.p,()=>window.__lobby.state().phase==='lobby'?true:null,null,30000,'G3 in the lobby');
await sleep(6000);
const dbl=await Promise.all([H2.p.evaluate(()=>window.__net.peers()),G3.p.evaluate(()=>({me:window.__net.myId(),peers:window.__net.peers()}))]);
check("a double Enter on the join box makes ONE connection (it made two: the host simulated two of you, every reward came twice)",
  !!emptied&&dbl[0].length===1&&dbl[0][0]===dbl[1].me&&dbl[1].peers.length===1,JSON.stringify(dbl));

// P6, the other half: a guest joins the lone host that killed mobs -- it hears none of those deaths
const g4=await join(G3.p,room4);
for(let i=0;i<4;i++){ await step(G2.p,10); await sleep(150); }
const sfx=await G3.p.evaluate(()=>window.__gsfx());
check("hosting alone, the mobs that died with nobody to tell are not piled onto the first joiner ("+killed+" killed before it came)",
  !g4.err&&killed>0&&sfx.die===0,JSON.stringify({killed,die:sfx.die}));

// ==== D: what the messages say ====
await G3.p.evaluate(()=>window.__net.leave());
await G3.p.evaluate(()=>{ document.getElementById('lobbyLeave').click(); });
await G3.p.click('#joinbtn'); await G3.p.fill('#joinCode','ZZZZZ'); await G3.p.click('#joinGoBtn');
const wrong=await until(G3.p,()=>{ const t=document.getElementById('joinMsg').textContent; return t&&t!=='Connecting…'?t:null; },null,30000,'wrong code message');
check("a code with no game behind it says so: 'No open game with that code'",!!wrong&&/No open game with that code/.test(wrong.v),JSON.stringify(wrong));
const E=await newPage(UI(DEAD),{seat:'dupseat1'});
await E.p.evaluate(()=>window.__mp.open()); await E.p.click('#hostbtn');
const hostDown=await until(E.p,()=>{ let n=document.getElementById('coopMsg'); const t=n&&n.textContent; if(!t) return null; while(n){ if(n.classList&&n.classList.contains('hide')) return null; n=n.parentElement; } return t; },null,30000,'HOST error (visible)');
const hostBtn=await E.p.evaluate(()=>!document.getElementById('coopRow').classList.contains('hide'));
check("HOST with the matchmaking server down says so, where it can be seen (it used to be hidden the moment it was written)",!!hostDown&&/matchmaking server/.test(hostDown.v)&&hostBtn,JSON.stringify({hostDown,hostBtn}));
await E.p.click('#joinbtn'); await E.p.fill('#joinCode','ABCDE'); await E.p.click('#joinGoBtn');
const joinDown=await until(E.p,()=>{ const t=document.getElementById('joinMsg').textContent; return t&&t!=='Connecting…'?t:null; },null,30000,'JOIN error');
check("JOIN with the matchmaking server down blames the server, not the code",!!joinDown&&/matchmaking server/.test(joinDown.v),JSON.stringify(joinDown));
// a duplicated tab: a second tab of the same browser starting with the same seat takes a fresh one
await sleep(3500);   // the first tab has settled into its seat
const E2=await newPage(UI(DEAD),{ctx:E.ctx});
await sleep(1500);
const seats=await Promise.all([E,E2].map(x=>x.p.evaluate(()=>window.__lobby.state().seat)));
check("a duplicated tab (its sessionStorage copied, seat and all) takes a fresh seat; the first keeps its own",seats[0]==='dupseat1'&&/^[a-z0-9]{8}$/.test(seats[1])&&seats[1]!==seats[0],JSON.stringify(seats));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon|Could not connect to peer|Lost connection to server|ERR_CONNECTION_REFUSED|WebSocket/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
stamp("done");
for(const x of [G2,H2,G3,E]) await closeCtx(x);
await browser.close().catch(()=>{}); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
