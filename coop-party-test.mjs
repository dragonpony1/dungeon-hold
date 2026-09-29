// ===== CO-OP: THE PARTY BETWEEN RUNS (build 159, 7/7). "Every run end breaks up the party": every way on from a run reloads the page,
// HOST A GAME drew a fresh code every time, and a guest had no way back but typing the new one in. Now the host's tab hosts on its old
// code again, a finished hall leaves the matchmaking server (nobody walks into a run that's over), a guest's end screen offers
// ⟲ REJOIN <CODE> beside TRY AGAIN (still solo) -- a join that waits for the host's next game and never lands a guest past its own
// unlock -- and the JOIN box comes up holding the last code. And (LC9) two tabs of the game in one browser say so on the title screens.
// Real browsers, the real buttons, a local PeerJS signaling server (the same client code path as the public broker). It checks:
//  - HOST A GAME keeps its code in this tab; the host plays map two, the guest (map one unlocked only) is moved there by the lobby
//  - the crystal falls: the host leaves the matchmaking server but keeps its guest's link, a join on its code finds no such room; the
//    guest's THE GATE HAS OPENED offers ⟲ REJOIN <code> beside TRY AGAIN (unchanged: a plain reload), and REJOIN would take it home, not to map two
//  - REJOIN: the guest reloads onto its OWN map one, the multiplayer screen open, "Waiting for the host's next game"
//  - the host's GO AGAIN, then HOST A GAME (~50 s after the REJOIN, a host reading its run summary): the SAME code, and it says so;
//    the waiting guest is in its lobby within seconds (a plain join would still be sitting out its 48 s backoff), and the lobby moves
//    it on to map two as it does any joiner
//  - a tab whose kept code is live elsewhere (a duplicated host tab) gets a fresh code, quietly
//  - THE HOST LEFT offers REJOIN too, and a guest on a map of its own keeps that map (?coopmap = its map)
//  - after a reload the JOIN box holds the last code, and nothing joins by itself
//  - two tabs in one browser: both carry the note on the title and multiplayer screens (and it fits a phone), another browser's tab
//    doesn't, and it goes when the other tab closes
// Ports 8761 (http), 9661 (signaling).
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-party-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const SP=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/,"")); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const T0=Date.now(); const stamp=l=>console.log("   ["+Math.round((Date.now()-T0)/1000)+" s] "+l);

const PORT=8761, sigPort=9661;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const BASE="http://127.0.0.1:"+PORT+"/?silent&nogate&peerhost=127.0.0.1&peerport="+sigPort+"&peerpath=/peerjs";
const errors=[];
const slowFrames=()=>{ window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),250); };   // the hall still draws, a few times a second: nothing here rides the frame loop
async function newCtx(o){ o=o||{}; const ctx=await browser.newContext({viewport:{width:o.w||800,height:o.h||600}}); await ctx.addInitScript(slowFrames);
  if(o.mapsCleared) await ctx.addInitScript(n=>{ try{ localStorage.setItem('ddMapsCleared',String(n)); }catch(e){} },o.mapsCleared); return ctx; }
const ready=p=>p.waitForFunction(()=>window.__dd&&window.__net&&window.__lobby&&window.__mp&&window.__tabs&&document.getElementById('lobbyPanel'),null,{timeout:240000});
async function newPage(ctx,url){ const p=await ctx.newPage(); p.setDefaultTimeout(240000); p.on("pageerror",e=>errors.push(String(e))); await p.goto(url||BASE,{timeout:240000}); await ready(p); return p; }
// poll a condition in the page, riding out the page reloading underneath it; {v,ms} or null
async function until(p,fn,arg,ms,label){ const t0=Date.now(); let last=null;
  while(Date.now()-t0<ms){ try{ last=await p.evaluate(fn,arg); if(last) return {v:last,ms:Date.now()-t0}; }catch(e){ last='(navigating) '+String(e).slice(0,80); } await sleep(300); }
  const diag=await p.evaluate(()=>({url:location.search,map:window.__dd&&window.__dd.map().index,phase:window.__dd&&window.__dd.S.phase,role:window.__net&&window.__net.role(),peers:window.__net&&window.__net.peers(),lobby:window.__lobby&&window.__lobby.state(),join:(document.getElementById('joinMsg')||{}).textContent})).catch(e=>String(e).slice(0,120));
  console.log("   … gave up waiting for: "+label+" (last: "+JSON.stringify(last).slice(0,300)+")\n     page then: "+JSON.stringify(diag).slice(0,1200)); return null; }
const reloadVia=async(p,act)=>{ const ld=p.waitForEvent('load',{timeout:240000}); await act().catch(()=>{}); await ld; await ready(p); };   // wait for the NEW document, not the old one still unloading
const codeShown=p=>until(p,()=>{ const el=document.getElementById('hostCode'); return el&&/^[A-Z0-9]{5}$/.test(el.textContent)?{code:el.textContent,same:!!document.getElementById('hostSame'),kept:sessionStorage.getItem('ddHostCode'),err:document.getElementById('coopMsg').textContent}:null; },null,60000,'room code');
const endScreen=p=>p.evaluate(()=>{ const r=document.getElementById('rejoinbtn'), a=document.getElementById('againbtn');
  return {shown:!document.getElementById('dead').classList.contains('hide'),h1:document.getElementById('deadh1').textContent,p:document.getElementById('deadp').textContent,
    rejoin:!!r&&getComputedStyle(r).display!=='none'&&r.getClientRects().length>0,rejoinText:r?r.textContent:null,again:a.textContent,againClick:a.getAttribute('onclick'),to:window.__net.rejoinTo(),role:window.__net.role()}; });
const startOpen=(p,label,ms)=>until(p,()=>{ const s=window.__lobby.state(); return !s.startDisabled&&/2\/2 ready/.test(s.startLabel)?s:null; },null,ms||240000,label);

// ==== A: the host on map two, the guest from map one ====
const Hctx=await newCtx({mapsCleared:1}), Gctx=await newCtx();
const H=await newPage(Hctx,BASE+"&map=1"), G=await newPage(Gctx);
await H.evaluate(()=>window.__mp.open()); await H.click('#hostbtn');
const h1=await codeShown(H); const code1=h1&&h1.v.code;
check("HOST A GAME shows a code and this tab keeps it (sessionStorage ddHostCode) -- the first time, no word about a last game",!!code1&&h1.v.kept===code1&&!h1.v.same,JSON.stringify(h1));
if(!code1){ await browser.close(); server.close(); process.exit(1); }
stamp("hosting "+code1);
await G.evaluate(()=>window.__mp.open()); await G.click('#joinbtn'); await G.fill('#joinCode',code1); await G.click('#joinGoBtn');
const gMoved1=await until(G,()=>{ const s=window.__lobby&&window.__lobby.state(); return s&&s.role==='guest'&&s.phase==='lobby'&&s.map===1&&s.gated?s:null; },null,240000,'guest moved onto map two');
const open1=await startOpen(H,'START open');
check("the guest (map one its own) is moved onto the host's map two by the lobby, and START opens",!!gMoved1&&!!open1,JSON.stringify({g:gMoved1&&gMoved1.v.movedFrom,start:open1&&open1.v.startLabel}));
await H.click('#lobbyStart');
const inHall=await Promise.all([H,G].map(p=>until(p,()=>window.__dd.S.phase==='build'?true:null,null,120000,'in the hall')));
check("START puts both into the hall",inHall.every(Boolean));
stamp("in the hall");

// ==== the crystal falls ====
await H.evaluate(()=>window.__dd.hurtCrystal(999999));
for(let i=0;i<15;i++) await H.evaluate(()=>window.__dd.step(1/60,10));
const hEnd=await until(H,()=>window.__dd.S.phase==='dead'?{broker:window.__net.onBroker(),peers:window.__net.peers().length,role:window.__net.role()}:null,null,30000,'host run over');
const gShown=await until(G,()=>!document.getElementById('dead').classList.contains('hide')?true:null,null,30000,"guest's end screen");
const gEnd=await endScreen(G);
check("the run over, the host leaves the matchmaking server -- and keeps its link to the guest (it needs no server)",!!hEnd&&hEnd.v.broker===false&&hEnd.v.peers===1&&hEnd.v.role==='host',JSON.stringify(hEnd));
check("the guest's THE GATE HAS OPENED offers ⟲ REJOIN "+code1+" beside TRY AGAIN, which is unchanged (TRY AGAIN, a plain reload: solo), and says what REJOIN does",
  !!gShown&&gEnd.h1==='THE GATE HAS OPENED'&&gEnd.rejoin&&gEnd.rejoinText==='⟲ REJOIN '+code1&&gEnd.again==='TRY AGAIN'&&gEnd.againClick==='location.reload()'&&/REJOIN/.test(gEnd.p),JSON.stringify(gEnd));
check("...and REJOIN would take this guest HOME (map two is past its own unlock): the rejoin link carries the code but no map",
  !!gEnd.to&&/coopjoin=/.test(gEnd.to)&&gEnd.to.includes('coopjoin='+code1)&&!/coopmap=/.test(gEnd.to),gEnd.to);
const Xctx=await newCtx({w:400,h:760}); const X=await newPage(Xctx);
const xj=await X.evaluate(({c,o})=>new Promise(res=>{ window.__net.join(c,(err,id)=>res({err:err?String(err.type||err):null,id}),o); setTimeout(()=>res({err:'timeout'}),20000); }),{c:code1,o:peerOpts});
await X.evaluate(()=>window.__net.leave());
check("nobody walks into the finished hall: a join on its code finds no such room ('peer-unavailable')",xj.err==='peer-unavailable',JSON.stringify(xj));

// ==== the guest's REJOIN, with the host still on its run summary ====
await reloadVia(G,()=>G.click('#rejoinbtn'));
const g0=Date.now();   // about when the rejoin's first ask went out (the page joins the moment it has loaded)
const gWait=await until(G,()=>{ const m=document.getElementById('joinMsg').textContent; return /Waiting for the host's next game/.test(m)?{map:window.__dd.map().index,gated:window.__lobby.state().gated,lobby:window.__lobby.state().phase,mp:window.__mp.isOpen(),joinPanel:!document.getElementById('joinPanel').classList.contains('hide'),url:location.search,role:window.__net.role(),msg:m,err:document.getElementById('joinMsg').classList.contains('err'),box:document.getElementById('joinCode').value}:null; },null,60000,'guest waiting');
check("REJOIN reloads the guest onto its OWN map one (not past its unlock), the multiplayer screen open on the join, 'Waiting for the host's next game' (not an error), the link gone from the address bar",
  !!gWait&&gWait.v.map===0&&!gWait.v.gated&&gWait.v.lobby==='off'&&gWait.v.mp&&gWait.v.joinPanel&&!gWait.v.err&&gWait.v.role==='guest'&&gWait.v.box===code1&&!/coop/.test(gWait.v.url),JSON.stringify(gWait));
stamp("guest waiting");

// ==== the host goes again, reading its summary a while first ====
await reloadVia(H,()=>H.evaluate(()=>{ const b=document.getElementById('tv-again'); if(b) b.click(); else location.reload(); }));
const hBack=await H.evaluate(()=>({phase:window.__dd.S.phase,map:window.__dd.map().index,kept:sessionStorage.getItem('ddHostCode')}));
check("the host's GO AGAIN (a reload) keeps its code in the tab",hBack.phase==='start'&&hBack.map===1&&hBack.kept===code1,JSON.stringify(hBack));
// the host hosts again ~50 s after the guest started asking: a plain join asks at 0, 12, 36 and 84 s (each ask stays at the server ~5 s,
// and a room that opens meanwhile gets it), so it would sit there until ~84 s -- half a minute after the room opened
await sleep(Math.max(0,50000-(Date.now()-g0)));
await H.evaluate(()=>window.__mp.open()); await H.click('#hostbtn');
const h2=await codeShown(H); const tHosted=Date.now();
check("HOST A GAME comes back on the SAME code ("+code1+") and says so",!!h2&&h2.v.code===code1&&h2.v.same&&h2.v.kept===code1,JSON.stringify(h2));
stamp("hosting again");
const back=await until(H,()=>window.__lobby.roster().length>=2?window.__lobby.roster().map(r=>({id:r.id,light:r.light,status:r.status})):null,null,120000,"the guest back in the host's lobby");
const backMs=back?Date.now()-tHosted:null;
check("the waiting guest is back in the host's lobby by itself within seconds of it opening (it asks again every few seconds; a plain join waited up to a minute)",!!back&&backMs<15000,JSON.stringify({backMs,rows:back&&back.v}));
const gMoved2=await until(G,()=>{ const s=window.__lobby&&window.__lobby.state(); return s&&s.role==='guest'&&s.phase==='lobby'&&s.map===1&&s.lobbyMap===1&&s.gated&&!/coop/.test(location.search)?s:null; },null,240000,'guest moved onto map two again');
const open2=await startOpen(H,'START open again');
check("...and the lobby moves it on to the host's map two, as it does any joiner, and START opens for both again",!!gMoved2&&!!open2,JSON.stringify({g:gMoved2&&gMoved2.v,start:open2&&open2.v.startLabel}));
stamp("party back together");

// ==== a duplicated host tab: its kept code is live elsewhere ====
await X.evaluate(c=>{ sessionStorage.setItem('ddHostCode',c); window.__mp.open(); },code1); await X.click('#hostbtn');
const xh=await codeShown(X);
check("a tab whose kept code is live elsewhere (a duplicated host tab) quietly gets a fresh code, and keeps that one from then on",!!xh&&xh.v.code!==code1&&!xh.v.same&&xh.v.kept===xh.v.code&&!xh.v.err&&xh.ms<10000,JSON.stringify(xh));
const code3=xh&&xh.v.code;

// ==== THE HOST LEFT, on a map of the guest's own; a second tab of X's browser is the guest ====
const Y=await newPage(Xctx);
await Y.evaluate(()=>window.__mp.open()); await Y.click('#joinbtn'); await Y.fill('#joinCode',code3||'NONE0'); await Y.click('#joinGoBtn');
const open3=await startOpen(X,'X START open');
if(open3) await X.click('#lobbyStart');
const inHall3=await Promise.all([X,Y].map(p=>until(p,()=>window.__dd.S.phase==='build'?true:null,null,120000,'X and Y in the hall')));
const xLeave=reloadVia(X,()=>X.evaluate(()=>window.__pause.toTitle()));
const yShown=await until(Y,()=>!document.getElementById('dead').classList.contains('hide')?true:null,null,30000,"Y's end screen");
const yEnd=await endScreen(Y); await xLeave;
check("the host's RETURN TO TITLE gives its guest THE HOST LEFT with ⟲ REJOIN "+code3+" beside BACK TO THE TITLE, and on the guest's own map the link keeps it there (coopmap=0)",
  inHall3.every(Boolean)&&!!yShown&&yEnd.h1==='THE HOST LEFT'&&yEnd.rejoin&&yEnd.rejoinText==='⟲ REJOIN '+code3&&/BACK TO THE TITLE/.test(yEnd.again)&&/REJOIN/.test(yEnd.p)&&/coopmap=0/.test(yEnd.to||'')&&(yEnd.to||'').includes('coopjoin='+code3),JSON.stringify(yEnd));
await reloadVia(Y,()=>Y.click('#againbtn'));
await sleep(3000);
const yTitle=await Y.evaluate(()=>({box:document.getElementById('joinCode').value,role:window.__net.role(),lobby:window.__lobby.state().phase,phase:window.__dd.S.phase}));
check("back on the title the JOIN box holds the last code ("+code3+"), and nothing joined by itself",yTitle.box===code3&&yTitle.role===null&&yTitle.lobby==='off'&&yTitle.phase==='start',JSON.stringify(yTitle));

// ==== LC9: two tabs of the game in one browser ====
const tabs=await until(X,()=>window.__tabs.shown()?true:null,null,15000,'X shows the note');
const state=p=>p.evaluate(()=>{ const n=[...document.querySelectorAll('.tabWarn')]; const vis=e=>getComputedStyle(e).display!=='none'&&e.getClientRects().length>0;
  return {others:window.__tabs.others(),shown:window.__tabs.shown(),title:!!n[0]&&!n[0].classList.contains('hide')&&n[0].closest('#start')!==null,mp:!!n[1]&&!n[1].classList.contains('hide')&&n[1].closest('#mpScreen')!==null,text:n[0]?n[0].textContent:'',
    fit:n.filter(vis).every(e=>{ const r=e.getBoundingClientRect(); return r.left>=0&&r.right<=innerWidth+1; })&&document.getElementById('start').scrollWidth<=innerWidth,count:n.length}; });
const [xs,ys,hs]=await Promise.all([X,Y,H].map(state));
check("two tabs of the game in one browser: both carry the note, on the title and on the multiplayer screen ('only one tab's gold and gear will be kept … another browser or a private window')",
  !!tabs&&xs.shown&&ys.shown&&xs.title&&xs.mp&&ys.title&&ys.mp&&/another tab/.test(xs.text)&&/private window/.test(xs.text)&&xs.count===2,JSON.stringify({xs,ys}));
await X.evaluate(()=>window.__mp.open());
const xFit=await state(X);
check("...it fits a phone-width (400 px) screen, the title's and the multiplayer screen's",xs.fit&&xFit.fit,JSON.stringify({xs:xs.fit,xFit:xFit.fit}));
check("a tab in another browser (its own storage) shows no such note",!hs.shown&&hs.others===0,JSON.stringify(hs));
await Y.close();
const gone=await until(X,()=>!window.__tabs.shown()&&window.__tabs.others()===0?true:null,null,30000,'the note goes');
check("the other tab closing takes the note away",!!gone,JSON.stringify(gone));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon|Could not connect to peer|Lost connection to server|ERR_CONNECTION_REFUSED|WebSocket/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
stamp("done");
for(const c of [Hctx,Gctx,Xctx]) await Promise.race([c.close().catch(()=>{}),sleep(8000)]);
await browser.close().catch(()=>{}); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
