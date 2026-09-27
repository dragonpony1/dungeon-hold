// ===== CO-OP LOBBY (phase 14, 99b-lobby.js): "maybe we need a lobby, its a little clunky to wait until everyone is [in]. besides we
// could wait in the lobby until theres a green light the room is loaded, would work great for bigger maps like 2." Three real
// browser contexts -- a host and two guests -- against a local PeerJS signaling server, driven through the REAL title-screen buttons:
// the host hosts on map two (the heavy throne room; ddMapsCleared=1 only in the host's context), both guests start on map one and
// are moved onto the host's map (a reload that rejoins the room by itself), each shows up in the roster with its hero and a loading
// light, START stays shut while one guest is still amber (that guest runs with ?lobbyhold, the lobby's documented test hook: it
// reports "still loading" until the test calls window.__lobby.release() -- deterministic, where holding its network is not, since
// the game's load tiers stop waiting after 40 s and a loaded machine can take longer than that just to get a page up), a hero change
// and a hostile name/hero show up in the roster as plain text, a raw peer sending malformed lobby messages breaks nothing, a guest
// leaving updates the roster, START puts all three into the hall on the same map, a late joiner waits while its room loads and then
// goes straight in, and the host leaving sends a waiting guest back to its own title screen.
// Every page is phone-width (400 CSS px), so the panel's fit is checked too. To keep software GL from starving the run, pages render
// at half pixel density (deviceScaleFactor 0.5 -- layout unchanged) and their frame loop is throttled by an init script to one frame
// every few seconds, slower still for a page just idling in the hall (measured here: one idle title page costs the software-GL process
// ~3.7 cores at full rate, ~2 cores even at 4 fps); the lobby runs on its own timer, never on frames, so nothing tested here depends
// on the frame rate. Waits are long on purpose:
// three pages of software GL, two on the heavy throne room and several reloading, can be very slow on a busy machine.
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP lobby-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const SP=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/,"")); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const T0=Date.now(); const stamp=l=>console.log("   ["+Math.round((Date.now()-T0)/1000)+" s] "+l);

const sigPort=9474, PORT=8941;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const BASE="http://127.0.0.1:"+PORT+"/?silent&nogate&peerhost=127.0.0.1&peerport="+sigPort+"&peerpath=/peerjs";
const errors=[];
// every lobby line / title-screen note a page ever shows, kept in its tab's sessionStorage so it survives the reload that follows
const recordMsgs=()=>{ const log=t=>{ try{ const a=JSON.parse(sessionStorage.getItem('__lobbyMsgs')||'[]'); if(!a.includes(t)&&a.length<200){ a.push(t); sessionStorage.setItem('__lobbyMsgs',JSON.stringify(a)); } }catch(e){} };
  addEventListener('DOMContentLoaded',()=>{ const m=document.getElementById('lobbyMsg'), n=document.getElementById('coopMsg'); if(!m) return; new MutationObserver(()=>{ if(m.textContent) log(m.textContent); if(n&&n.textContent) log(n.textContent); }).observe(document.getElementById('start'),{subtree:true,childList:true,characterData:true}); }); };
const slowFrames=()=>{ window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),window.__testFrameMs||4000); };   // the hall behind the title screen still draws, just not 60 times a second
async function newCtx(opts){ const ctx=await browser.newContext({viewport:{width:400,height:760},deviceScaleFactor:.5}); await ctx.addInitScript(recordMsgs); await ctx.addInitScript(slowFrames);
  if(opts&&opts.mapsCleared) await ctx.addInitScript(()=>{ try{ localStorage.setItem('ddMapsCleared','1'); }catch(e){} });
  const page=await ctx.newPage(); page.setDefaultTimeout(240000); page.on("pageerror",e=>errors.push(String(e))); return {ctx,page}; }
// poll a condition in the page, riding out the page reloading underneath it (a guest moving maps); null on timeout
async function until(page,fn,arg,ms,label){ const t0=Date.now(); let last=null;
  while(Date.now()-t0<(ms||300000)){ try{ last=await page.evaluate(fn,arg); if(last) return last; }catch(e){ last='(navigating)'; } await sleep(400); }
  const diag=await page.evaluate(()=>({url:location.search,map:window.__dd&&window.__dd.map().index,phase:window.__dd&&window.__dd.S.phase,role:window.__net&&window.__net.role(),me:window.__net&&window.__net.myId(),peers:window.__net&&window.__net.peers(),lobby:window.__lobby&&window.__lobby.state(),rows:window.__lobby&&window.__lobby.roster(),join:(document.getElementById('joinMsg')||{}).textContent,load:window.__loadtime&&window.__loadtime()})).catch(e=>String(e).slice(0,120));
  console.log("   … gave up waiting for: "+(label||'condition')+" (last: "+JSON.stringify(last).slice(0,300)+")\n     page then: "+JSON.stringify(diag).slice(0,1500)); return null; }
const ready=p=>until(p,()=>!!(window.__dd&&window.__net&&window.__lobby&&document.getElementById('lobbyPanel')),null,480000,'page ready');
const msgs=p=>p.evaluate(()=>{ try{ return JSON.parse(sessionStorage.getItem('__lobbyMsgs')||'[]'); }catch(e){ return []; } });
async function joinVia(page,code){ await page.evaluate(()=>window.__mp.open()); await page.click('#joinbtn'); await page.fill('#joinCode',code); await page.click('#joinGoBtn'); }
// the guest has rejoined the lobby ON the host's map, has the host's roster, and the rejoin pair is gone from its address bar
const rejoined=(page,map)=>until(page,m=>{ const s=window.__lobby&&window.__lobby.state(); return s&&s.role==='guest'&&(s.phase==='lobby'||s.phase==='waiting')&&s.map===m&&s.lobbyMap===m&&window.__lobby.roster().length>=2&&!/coopjoin|coopmap/.test(location.search)?s:null; },map,900000,'rejoined on map '+(map+1));
// the host's roster once it has n real rows (no row held for a guest still moving) and a condition on rows r / state s holds
const hostRows=(n,pred)=>until(H.page,({n,pred})=>{ const r=window.__lobby.roster(), s=window.__lobby.state(); return r.length===n&&!r.some(x=>/^seat:/.test(x.id))&&(!pred||new Function('r','s','return '+pred)(r,s))?{r,s}:null; },{n,pred},600000,'host roster of '+n+(pred?' where '+pred:''));

// ==== the host: map two, via the real HOST A GAME ====
const H=await newCtx({mapsCleared:true}); await H.page.goto(BASE+"&map=1&lobbywait=20000",{timeout:480000}); await ready(H.page);
const A=await newCtx(); await A.page.goto(BASE,{timeout:480000}); await ready(A.page);
const MAP2=(await H.page.evaluate(()=>window.__dd.maps()))[1].name;
const hm=await H.page.evaluate(()=>window.__dd.map().index), am=await A.page.evaluate(()=>window.__dd.map().index);
check("the host opened map two (ddMapsCleared=1 in its context only) and the guest is on map one",hm===1&&am===0,JSON.stringify({host:hm,guest:am,map2:MAP2}));
await H.page.evaluate(()=>window.__mp.open()); await H.page.click('#hostbtn');
const code=await until(H.page,()=>{ const el=document.getElementById('hostCode'); return el&&/^[A-Z0-9]{5}$/.test(el.textContent)?el.textContent:null; },null,240000,'room code');
if(!code){ check("hosting shows a room code",false); await browser.close(); server.close(); process.exit(1); }
stamp("hosting "+code);
const h0=await H.page.evaluate(()=>({s:window.__lobby.state(),rows:window.__lobby.roster(),panel:!document.getElementById('lobbyPanel').classList.contains('hide'),playHidden:getComputedStyle(document.getElementById('playbtn')).display==='none',mapLine:document.getElementById('lobbyMap').textContent,phase:window.__dd.S.phase}));
check("HOST A GAME opens the lobby: the code, the map being played, one row (the host's own, marked) with its hero portrait, and START -- not straight into the hall",
  h0.panel&&h0.s.role==='host'&&h0.s.phase==='lobby'&&h0.rows.length===1&&h0.rows[0].me&&/hero-[a-z]+\.png$/.test(h0.rows[0].img||'')&&h0.mapLine.includes(MAP2)&&/START · \d\/1 ready/.test(h0.s.startLabel)&&h0.playHidden&&h0.phase==='start',JSON.stringify(h0));

// ==== guest A joins from map one: moved onto map two, and rejoins by itself ====
await joinVia(A.page,code);
const a1=await rejoined(A.page,1); stamp("A rejoined");
const aMsgs=await msgs(A.page);
check("a guest on map one is moved to the host's map: 'Moving to "+MAP2+"…', a reload onto it, and it rejoins the room by itself",
  !!a1&&a1.movedFrom===0&&a1.gated===true&&aMsgs.some(t=>t.includes('Moving to '+MAP2)),JSON.stringify({state:a1,msgs:aMsgs.slice(-6)}));
const aUrl=await A.page.evaluate(()=>location.search);
check("the rejoin pair (coopmap/coopjoin) is gone from the address bar once read -- the other query params stay",!/coop/.test(aUrl)&&/peerhost=/.test(aUrl),aUrl);
const hA=await hostRows(2);
check("the host's roster shows the rejoined guest (host first and marked as the host's own row)",!!hA&&hA.r[0].me&&!hA.r[1].me,JSON.stringify(hA&&hA.r));
const aGreen=await hostRows(2,"r.every(x=>x.light==='green')");
check("both lights go green once each room is loaded ('ready N s'), and START opens: 'START · 2/2 ready'",!!aGreen&&aGreen.r.every(x=>/ready \d+\.\d s/.test(x.status))&&!aGreen.s.startDisabled&&/2\/2 ready/.test(aGreen.s.startLabel),JSON.stringify(aGreen));

// ==== guest B, still loading (?lobbyhold): amber, and START stays shut ====
const B=await newCtx(); await B.page.goto(BASE+"&lobbyhold=1",{timeout:480000}); await ready(B.page);
await joinVia(B.page,code);
const bIn=await hostRows(3,"r[2].light==='amber'&&/loading/.test(r[2].status)"); stamp("B in the roster");
const bLoad=await until(B.page,()=>{ const s=window.__lobby&&window.__lobby.state(); return s&&s.role==='guest'&&s.map===1&&s.lobbyMap===1?{map:window.__dd.map().index,s}:null; },null,120000,'B state');
check("a guest whose room is still loading shows AMBER 'loading N s' in the host's roster, after it too was moved onto map two",
  !!bIn&&/loading \d+ s/.test(bIn.r[2].status)&&!!bLoad&&bLoad.map===1&&bLoad.s.ready===false&&bLoad.s.held&&bLoad.s.movedFrom===0,JSON.stringify({row:bIn&&bIn.r[2],b:bLoad}));
check("START stays shut while any light is amber, and says so: 'START · 2/3 ready'",!!bIn&&bIn.s.startDisabled&&/START · 2\/3 ready/.test(bIn.s.startLabel),JSON.stringify(bIn&&bIn.s));
const force=await H.page.evaluate(()=>!document.getElementById('lobbyForce').classList.contains('hide'));
check("once the wait has passed (?lobbywait=20000 here, 45 s in play) the host is offered 'start without waiting' while someone is still amber",force,String(force));
const aSees3=await until(A.page,()=>{ const r=window.__lobby.roster(); return r.length===3?r:null; },null,120000,'A sees 3');
check("a guest sees the same roster, live: three rows, its own marked",!!aSees3&&aSees3.filter(x=>x.me).length===1&&aSees3[1].me,JSON.stringify(aSees3));
const fit=await B.page.evaluate(()=>{ const p=document.getElementById('lobbyPanel').getBoundingClientRect(); const over=[...document.querySelectorAll('#lobbyPanel *')].filter(e=>{ const r=e.getBoundingClientRect(); return r.width&&(r.left<-1||r.right>innerWidth+1); }).map(e=>e.id||e.className); return {left:Math.round(p.left),right:Math.round(p.right),vw:innerWidth,start:document.getElementById('start').scrollWidth,over}; });
check("the lobby fits a phone-width (400 px) screen: the panel and everything in it inside the screen, no sideways scroll",fit.left>=0&&fit.right<=fit.vw&&fit.start<=fit.vw&&!fit.over.length,JSON.stringify(fit));

// ==== a hero change shows up live: the host picks a card, a guest switches hero ====
await H.page.evaluate(()=>window.__heroes.select('troll'));   /* build 151: the cards sit behind the multiplayer screen; the screen's own 'change hero' cycles through __heroes.next, the same call */
await A.page.evaluate(()=>window.__heroes.select('fighter'));   // a fresh guest's own cards are knight-only; the programmatic pick (the one the raven's H key uses) is how its hero changes here
const heroA=await until(A.page,()=>{ const r=window.__lobby.roster(); return r[0]&&/TROLL ARCHER/.test(r[0].hero)&&/hero-troll\.png$/.test(r[0].img||'')?r[0]:null; },null,120000,'A sees host troll');
const heroH=await until(H.page,()=>{ const r=window.__lobby.roster(); return r[1]&&/GNOME FIGHTER/.test(r[1].hero)&&/hero-fighter\.png$/.test(r[1].img||'')?r[1]:null; },null,120000,'host sees A fighter');
check("a hero change on the title screen shows up in everyone's roster, portrait and name (host -> guests, guest -> host)",!!heroA&&!!heroH,JSON.stringify({onA:heroA,onH:heroH}));

// ==== hostile text: a name typed into the real input, then a raw peer sending HTML and malformed lobby messages ====
await A.page.fill('#lobbyName','<i id=x1>A</i>');
const nameH=await until(H.page,()=>{ const r=window.__lobby.roster(); return r[1]&&r[1].who.includes('<i id=x1>A</i>')?{row:r[1],el:!!document.getElementById('x1')}:null; },null,120000,'name as text');
const nameB=await until(B.page,()=>{ const r=window.__lobby.roster(); return r.some(x=>x.who.includes('<i id=x1>'))?{el:!!document.getElementById('x1')}:null; },null,120000,'B sees name');
check("a player name with HTML in it is shown as text on every screen (no element made from it)",!!nameH&&!nameH.el&&!!nameB&&!nameB.el,JSON.stringify({nameH,nameB}));
const rogue=await B.page.evaluate(({code,port})=>new Promise(res=>{ const p=new Peer(undefined,{host:'127.0.0.1',port,path:'/peerjs'}); window.__rogue=p;
  p.on('open',()=>{ const c=p.connect(code,{reliable:true}); c.on('open',()=>{ const S=(t,d)=>c.send(JSON.stringify({type:t,data:d}));
    S('lobbyMe',null); S('lobbyMe',[1,2]); S('lobbyMe','junk'); S('lobbyStart',{}); S('lobby',{map:'x',roster:'no'}); c.send('not json at all');
    S('lobbyMe',{hero:'<img id=x2 src=x onerror="window.__pwned=1">',name:'<svg id=x3 onload=1>',soon:'fast',t:-5,map:1.5,seat:'<x>',build:'<b>'}); res('sent'); }); c.on('error',e=>res('err '+e)); });
  p.on('error',e=>res('err '+e)); setTimeout(()=>res('timeout'),120000); }),{code,port:sigPort});
const rogueRow=await until(H.page,()=>{ const r=window.__lobby.roster(); const x=r.find(x=>x.hero.includes('<img id=x2')); return x?{x,n:r.length,s:window.__lobby.state(),els:['x2','x3'].filter(id=>document.getElementById(id)),phase:window.__dd.S.phase,pwned:!!window.__pwned}:null; },null,120000,'rogue row');
check("a raw peer's hero and name full of HTML are shown as text, clamped, on the host (no element made, nothing run)",!!rogueRow&&rogueRow.els.length===0&&!rogueRow.pwned&&rogueRow.x.who.includes('<svg id=x3')&&rogue==='sent',JSON.stringify({rogue,rogueRow}));
check("malformed lobby messages (null, an array, a string, not-JSON, a guest's 'lobbyStart') break nothing: the host is still in its lobby and counts 2/4",!!rogueRow&&rogueRow.phase==='start'&&rogueRow.n===4&&/2\/4 ready/.test(rogueRow.s.startLabel)&&rogueRow.s.startDisabled,JSON.stringify(rogueRow&&rogueRow.s));
await B.page.evaluate(()=>window.__rogue.destroy());
const rogueGone=await hostRows(3,"/2\\/3 ready/.test(s.startLabel)");
check("that peer disconnecting drops its row, and START recounts back to 2/3",!!rogueGone,JSON.stringify(rogueGone&&rogueGone.s.startLabel));

// ==== a guest leaving: A's ✕ leave -- its row goes, START recounts, and A (past its own unlock gate) goes back to its own map ====
await A.page.click('#lobbyLeave');
const hAfterLeave=await hostRows(2,"/1\\/2 ready/.test(s.startLabel)");
check("a guest leaving (✕ leave the lobby) disappears from the host's roster, and START recounts (1/2 ready)",!!hAfterLeave,JSON.stringify(hAfterLeave&&hAfterLeave.r.map(x=>x.who)));
const aHome=await until(A.page,()=>{ const s=window.__lobby&&window.__lobby.state(); return s&&s.phase==='off'&&window.__dd.map().index===0&&!/coop/.test(location.search)?{s,note:document.getElementById('coopMsg').textContent,row:!document.getElementById('coopRow').classList.contains('hide'),play:getComputedStyle(document.getElementById('playbtn')).display!=='none'}:null; },null,600000,'A home');
check("the guest that left went back to its OWN map one (it had only followed the host past its own gate), with the normal title screen",!!aHome&&aHome.row&&aHome.play&&/own map/i.test(aHome.note),JSON.stringify(aHome));
stamp("A home");
await joinVia(A.page,code); await rejoined(A.page,1); stamp("A back");
await B.page.evaluate(()=>window.__lobby.release());
const allGreen=await hostRows(3,"r.every(x=>x.light==='green')&&!s.startDisabled");
check("A back in, and B's room in: every light green, START open: 'START · 3/3 ready'",!!allGreen&&/3\/3 ready/.test(allGreen.s.startLabel),JSON.stringify(allGreen&&allGreen.s.startLabel));
const forceGone=await H.page.evaluate(()=>document.getElementById('lobbyForce').classList.contains('hide'));
check("'start without waiting' goes away once everyone is green",forceGone);

// ==== START: all three into the hall at once, on the same map ====
await H.page.click('#lobbyStart');
const inHall=await Promise.all([H,A,B].map(x=>until(x.page,()=>window.__dd.S.phase!=='start'?{phase:window.__dd.S.phase,map:window.__dd.map().index,lobby:window.__lobby.state().phase}:null,null,240000,'in hall')));
check("START puts all three into the hall together (S.phase leaves 'start'), all on map two",inHall.every(x=>x&&x.phase==='build'&&x.map===1),JSON.stringify(inHall));
const peers=await H.page.evaluate(()=>window.__net.peers().length);
check("the host has both guests connected in the hall",peers===2,String(peers));
stamp("in the hall");
for(const x of [H,A]) await x.page.evaluate(()=>{ window.__testFrameMs=30000; });   // from here on these two just idle in the hall: let the late joiner have the machine

// ==== a late joiner: B leaves the hall and comes back into the running game -- through the same rejoin link a moved guest's
// reload carries (?coopjoin=CODE&coopmap=1), still loading (?lobbyhold): it waits on the title screen, then goes straight in ====
await B.page.goto(BASE+"&lobbyhold=1&coopmap=1&coopjoin="+code,{timeout:480000}); await ready(B.page);
const bWait=await until(B.page,()=>{ const s=window.__lobby&&window.__lobby.state(); return s&&s.phase==='waiting'&&s.map===1?{s,phase:window.__dd.S.phase,enter:!document.getElementById('lobbyEnter').classList.contains('hide')}:null; },null,600000,'B waiting');
check("a player arriving after START while its room is still loading waits on the title screen ('you'll go in as soon as your room is loaded', ENTER NOW offered)",!!bWait&&bWait.phase==='start'&&bWait.enter&&/as soon as your room is loaded/.test(bWait.s.msg),JSON.stringify(bWait));
await B.page.evaluate(()=>window.__lobby.release());
const late=await until(B.page,()=>{ const s=window.__lobby.state(); return window.__dd.S.phase==='build'?{s,map:window.__dd.map().index}:null; },null,240000,'late joiner in hall');
check("...and goes straight into the hall, on the host's map, the moment its room is loaded",!!late&&late.s.phase==='in'&&late.map===1,JSON.stringify(late));
const lateOnHost=await until(H.page,()=>window.__net.peers().length===2&&window.__lobby.rows().filter(r=>!r.host&&r.inHall&&r.map===1).length>=1?window.__lobby.rows().map(r=>({host:r.host,inHall:r.inHall,map:r.map})):null,null,240000,'host sees late B');
check("the host counts the late joiner in",!!lateOnHost,JSON.stringify(lateOnHost));

// ==== the host leaving: B comes back once more, still loading, and the host's tab goes away while it waits ====
await B.page.goto(BASE+"&lobbyhold=1&coopmap=1&coopjoin="+code,{timeout:480000}); await ready(B.page);
const bWait2=await until(B.page,()=>{ const s=window.__lobby&&window.__lobby.state(); return s&&s.phase==='waiting'?s:null; },null,600000,'B waiting again');
stamp("B waiting; closing the host");
await H.ctx.close();
const bGone=await until(B.page,()=>{ const s=window.__lobby&&window.__lobby.state(); return s&&s.phase==='off'&&window.__dd.map().index===0&&/host left/i.test(document.getElementById('coopMsg').textContent)?{s,note:document.getElementById('coopMsg').textContent,role:window.__net.role(),row:!document.getElementById('coopRow').classList.contains('hide')}:null; },null,600000,'B sees host left');
const bLog=await msgs(B.page).catch(()=>[]);
check("when the host leaves, a waiting guest sees 'the host left' and gets the normal title screen back (its own map, no connection)",!!bWait2&&!!bGone&&bGone.role===null&&bGone.row,JSON.stringify({bGone,log:bLog.slice(-4)}));
const aStill=await A.page.evaluate(()=>({phase:window.__dd.S.phase,lobby:window.__lobby.state().phase}));
check("a guest already in the hall is left alone by the lobby when the host goes (no title screen pulled over its game)",aStill.phase==='build'&&aStill.lobby==='in',JSON.stringify(aStill));

const pwned=await Promise.all([A,B].map(x=>x.page.evaluate(()=>!!window.__pwned).catch(()=>'?')));
check("no page ran any injected handler",pwned.every(v=>v===false),JSON.stringify(pwned));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
stamp("done");
await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
