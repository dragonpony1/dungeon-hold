// ===== WHO PLAYED (build 534, parts/staging/12b-whoplayed.js): the first-visit name card, the name chip on the title, and the session reports to POST /api/play.
// Nothing here ever reaches the live site: every page routes **/api/play to a local catcher (page.route), and reporting is only switched on through the test hook
// (window.__whoplayed.forceLive) -- by default a driven browser (navigator.webdriver) and ?silent never report, which this suite also checks.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP whoplayed-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const SHOT=process.env.WHOSHOT||"C:/Users/Matt/AppData/Local/Temp/whoplayed-card.png";
const sigPort=9783;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const PORT=9781, BASE="http://127.0.0.1:"+PORT+"/";
const server=await serve(PORT,{dist:"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const posts=[];   // every /api/play request any page makes: {tag, method, type, body}
async function catcher(page,tag){ page.on("pageerror",e=>errors.push(tag+": "+String(e)));
  await page.route("**/api/play",async route=>{ const r=route.request(); let body=null; try{ body=JSON.parse(r.postData()||"null"); }catch(e){ body=r.postData(); } posts.push({tag,method:r.method(),type:(r.headers()["content-type"]||""),body}); await route.fulfill({status:200,body:"ok"}); }); }
const ready=p=>p.waitForFunction(()=>window.__dd&&window.__whoplayed&&window.__net,null,{timeout:90000});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const SID=/^[A-Za-z0-9_-]{16}$/;
const FIELDS=["sid","name","map","mode","hero","wave","room","role","ver","ev"];
const shapeOk=b=>!!b&&Object.keys(b).sort().join()===FIELDS.slice().sort().join()&&SID.test(b.sid)&&typeof b.name==="string"&&b.name.length<=24&&typeof b.map==="string"&&b.map.length>0&&b.map.length<=40&&typeof b.mode==="string"&&b.mode.length<=20&&typeof b.hero==="string"&&b.hero.length<=12&&Number.isInteger(b.wave)&&typeof b.room==="string"&&b.room.length<=40&&["host","guest","solo"].includes(b.role)&&/^\d+$/.test(b.ver);

// ---- 1. the name card: first visit only, typed keys stay in the box, Enter saves; reload = no card, the chip shows the name; ✎ re-opens and edits
{ const ctx=await browser.newContext({viewport:{width:1280,height:800}}); const p=await ctx.newPage(); await catcher(p,"card");
  await p.goto(BASE+"?silent&namecard",{timeout:90000}); await ready(p);
  await p.waitForFunction(()=>window.__whoplayed.isOpen(),null,{timeout:20000}).catch(()=>{});
  const first=await p.evaluate(()=>({ open:window.__whoplayed.isOpen(), name:window.__whoplayed.name(), vis:!!document.querySelector('#whoCard:not(.hide)')&&getComputedStyle(document.getElementById('whoCard')).display!=='none' }));
  check("first visit: the who's-playing card is up and no name is stored yet",first.open&&first.vis&&first.name===null,JSON.stringify(first));
  await p.waitForTimeout(150); await p.keyboard.type("Bob Gnome");   // B (the bag) and Space (PLAY on the title) must land in the box, not the game
  await p.waitForTimeout(300); await p.screenshot({path:SHOT});
  const typed=await p.evaluate(()=>({ v:document.getElementById('whoName').value, phase:window.__dd.S.phase, bag:typeof Meta!=="undefined"&&!!Meta.isOpen() }));
  check("typing goes into the name box -- B and Space never open the bag or start the game",typed.v==="Bob Gnome"&&typed.phase==="start"&&!typed.bag,JSON.stringify(typed));
  await p.keyboard.press("Enter"); await p.waitForTimeout(200);
  const saved=await p.evaluate(()=>({ open:window.__whoplayed.isOpen(), ls:localStorage.getItem('dd_player_name'), chip:(document.getElementById('whoChip')||{}).textContent, phase:window.__dd.S.phase }));
  check("Enter saves the name (dd_player_name), closes the card, stays on the title, and the chip shows it",!saved.open&&saved.ls==="Bob Gnome"&&/Bob Gnome/.test(saved.chip||"")&&/✎/.test(saved.chip||"")&&saved.phase==="start",JSON.stringify(saved));
  await p.reload(); await ready(p); await p.waitForTimeout(2500);
  const again=await p.evaluate(()=>({ open:window.__whoplayed.isOpen(), chip:(document.getElementById('whoChip')||{}).textContent }));
  check("second visit: no card, the chip carries the saved name",!again.open&&/Bob Gnome/.test(again.chip||""),JSON.stringify(again));
  await p.click('#whoChip'); await p.waitForTimeout(200);
  const re=await p.evaluate(()=>({ open:window.__whoplayed.isOpen(), v:document.getElementById('whoName').value }));
  await p.fill('#whoName','Jacob'); await p.click('#whoOk'); await p.waitForTimeout(150);
  const ed=await p.evaluate(()=>({ open:window.__whoplayed.isOpen(), ls:localStorage.getItem('dd_player_name'), chip:document.getElementById('whoChip').textContent, phase:window.__dd.S.phase }));
  check("✎ re-opens the card with the name in it; OK saves the new one",re.open&&re.v==="Bob Gnome"&&!ed.open&&ed.ls==="Jacob"&&/Jacob/.test(ed.chip)&&ed.phase==="start",JSON.stringify({re,ed}));
  await p.click('#whoChip'); await p.click('#whoSkip'); await p.waitForTimeout(100);
  check("SKIP on a re-open keeps the name already chosen",await p.evaluate(()=>localStorage.getItem('dd_player_name'))==="Jacob");
  await ctx.close(); }

// ---- 2. SKIP on first visit stores '' (asked once); the card never shows for a driven browser / ?silent without ?namecard; nothing is posted by default
{ const ctx=await browser.newContext(); const p=await ctx.newPage(); await catcher(p,"skip");
  await p.goto(BASE+"?silent&namecard",{timeout:90000}); await ready(p); await p.waitForFunction(()=>window.__whoplayed.isOpen(),null,{timeout:20000}).catch(()=>{});
  await p.click('#whoSkip'); await p.waitForTimeout(150);
  const s=await p.evaluate(()=>({ ls:localStorage.getItem('dd_player_name'), open:window.__whoplayed.isOpen(), chip:document.getElementById('whoChip').textContent }));
  await p.reload(); await ready(p); await p.waitForTimeout(2000); const s2=await p.evaluate(()=>window.__whoplayed.isOpen());
  check("SKIP saves an empty name, the chip shows 👤 ?, and the card doesn't come back",s.ls===""&&!s.open&&/\?/.test(s.chip)&&!s2,JSON.stringify({s,s2}));
  await ctx.close(); }
{ const ctx=await browser.newContext(); const p=await ctx.newPage(); await catcher(p,"quiet");
  await p.goto(BASE+"?silent",{timeout:90000}); await ready(p); await p.waitForTimeout(2500);
  const q=await p.evaluate(()=>({ open:window.__whoplayed.isOpen(), card:!!document.getElementById('whoCard'), live:window.__whoplayed.live() }));
  check("a driven browser with ?silent (every other suite) never meets the card",!q.open&&!q.card,JSON.stringify(q));
  await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,30); }); await p.waitForTimeout(1200);
  await p.evaluate(()=>window.__whoplayed.beatNow()); await p.evaluate(()=>window.__whoplayed.endNow()); await p.waitForTimeout(400);
  const W=await p.evaluate(()=>{ const w=window.__whoplayed.wouldReport; return { live:w('rootgate.52bulls.workers.dev',false,''), other:w('dungeon-hold.52bulls.workers.dev',false,''), local:w('127.0.0.1',false,''), wd:w('rootgate.52bulls.workers.dev',true,''), silent:w('rootgate.52bulls.workers.dev',false,'?silent'), nolog:w('rootgate.52bulls.workers.dev',false,'?map=2&nolog'), fake:w('workers.dev.evil.com',false,'') }; });
  check("by default nothing is posted: the run started, a beat and an end were asked for, zero requests",!q.live&&posts.filter(x=>x.tag==="quiet").length===0&&await p.evaluate(()=>window.__whoplayed.counts().sent)===0,JSON.stringify(posts.filter(x=>x.tag==="quiet")));
  check("the live check: the real site reports; localhost, webdriver, ?silent, ?nolog and look-alike hosts don't",W.live&&W.other&&!W.local&&!W.wd&&!W.silent&&!W.nolog&&!W.fake,JSON.stringify(W));
  await ctx.close(); }

// ---- 3. forced live (solo): start / beat / end payloads
{ const ctx=await browser.newContext(); const p=await ctx.newPage(); await catcher(p,"solo");
  await p.addInitScript(()=>{ try{ localStorage.setItem('dd_player_name','Tester'); localStorage.setItem('ddSound','off'); }catch(e){}
    try{ const sb=navigator.sendBeacon.bind(navigator); navigator.sendBeacon=(u,d)=>{ const ok=sb(u,d); try{ sessionStorage.setItem('wpBeacon',JSON.stringify({u:String(u),type:d&&d.type,ok})); }catch(e){} return ok; }; }catch(e){} });   // notes that the 'end' really went by beacon (sessionStorage survives the same-origin navigation)
  await p.goto(BASE+"?silent&nogate",{timeout:90000}); await ready(p);
  await p.evaluate(()=>window.__whoplayed.forceLive(true));
  await p.waitForTimeout(1200);
  const pre=posts.filter(x=>x.tag==="solo").length;
  await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,30); }); await p.waitForTimeout(1500);
  const st=posts.filter(x=>x.tag==="solo"&&x.body&&x.body.ev==="start");
  const b0=st[0]&&st[0].body;
  check("nothing goes out while the title is up; 'start' goes out once when the run leaves the title",pre===0&&st.length===1,JSON.stringify(posts.filter(x=>x.tag==="solo").map(x=>x.body&&x.body.ev)));
  check("'start' carries exactly the agreed fields: sid (16), name, map, mode, hero, wave, room, role, ver, ev -- POSTed as JSON",b0&&shapeOk(b0)&&b0.name==="Tester"&&b0.role==="solo"&&b0.room===""&&/^campaign/.test(b0.mode)&&["knight","witch","fighter","troll"].includes(b0.hero)&&st[0].method==="POST"&&/application\/json/.test(st[0].type),JSON.stringify(st[0]));
  await p.evaluate(()=>{ window.__dd.S.wave=4; window.__dd.S.phase='build'; }); await p.waitForTimeout(700); await p.evaluate(()=>{ window.__dd.S.wave=2; }); await p.waitForTimeout(700);
  await p.evaluate(()=>window.__whoplayed.beatNow()); await p.waitForTimeout(500);
  const bt=posts.filter(x=>x.tag==="solo"&&x.body&&x.body.ev==="beat").pop();
  check("'beat' (fired now through the hook) carries the BEST wave this page reached and the same session id",bt&&shapeOk(bt.body)&&bt.body.wave===4&&bt.body.sid===b0.sid,JSON.stringify(bt));
  const ver=await p.evaluate(()=>window.__whoplayed.payload('x').ver); const dif=await p.evaluate(()=>{ window.__difficulty.set('easy',true); const m=window.__whoplayed.payload('x').mode; window.__difficulty.set('normal',true); return m; });
  check("ver is the build number; an EASY run says so in the mode",/^\d{3,}$/.test(ver)&&dif==="campaign easy",JSON.stringify({ver,dif}));
  // 'end': leaving the page sends a beacon (a JSON Blob) to the same catcher
  await p.goto(BASE+"?silent&nogate&v=2",{timeout:90000}).catch(()=>{}); await p.waitForTimeout(1500);
  const en=posts.filter(x=>x.tag==="solo"&&x.body&&x.body.ev==="end"); const bk=await p.evaluate(()=>JSON.parse(sessionStorage.getItem('wpBeacon')||'null'));
  check("leaving the page sends one 'end' (sendBeacon, application/json) for the same session with the best wave",en.length===1&&shapeOk(en[0].body)&&en[0].body.sid===b0.sid&&en[0].body.wave===4&&/application\/json/.test(en[0].type)&&bk&&bk.ok&&bk.type==="application/json"&&/\/api\/play$/.test(bk.u),JSON.stringify({en,bk}));
  const sid2=await p.evaluate(()=>window.__whoplayed.sid());
  check("a new page load is a new session id",SID.test(sid2)&&sid2!==b0.sid,sid2);
  await ctx.close(); }

// ---- 4. co-op: each player reports its own session, with the room code and its role
{ const hc=await browser.newContext(), gc=await browser.newContext(); const H=await hc.newPage(), Gp=await gc.newPage(); await catcher(H,"host"); await catcher(Gp,"guest");
  for(const p of [H,Gp]) await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
  await H.addInitScript(()=>{ try{ localStorage.setItem('dd_player_name','Hosty'); }catch(e){} }); await Gp.addInitScript(()=>{ try{ localStorage.setItem('dd_player_name','Guesty'); }catch(e){} });
  for(const p of [H,Gp]){ await p.goto(BASE+"?silent&nogate&map=4",{timeout:90000}); await ready(p); await p.evaluate(()=>window.__whoplayed.forceLive(true)); }
  await Gp.evaluate(()=>window.__heroes.select('witch'));
  const room="whop-"+Math.random().toString(36).slice(2,8);
  const ho=await H.evaluate(({room,peerOpts})=>new Promise(res=>window.__net.host(room,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{room,peerOpts});
  const gj=await Gp.evaluate(({room,peerOpts})=>new Promise(res=>window.__net.join(room,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{room,peerOpts});
  check("co-op: host and guest connect",ho.err===null&&gj.err===null,JSON.stringify({ho,gj}));
  for(const p of [H,Gp]) await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,30); });
  await wait(1500);
  const hs=posts.filter(x=>x.tag==="host"&&x.body&&x.body.ev==="start").pop(), gs=posts.filter(x=>x.tag==="guest"&&x.body&&x.body.ev==="start").pop();
  check("co-op 'start': the host reports role host + the room code, the guest role guest + the same room, each its own session",hs&&gs&&shapeOk(hs.body)&&shapeOk(gs.body)&&hs.body.role==="host"&&gs.body.role==="guest"&&hs.body.room===room&&gs.body.room===room&&hs.body.sid!==gs.body.sid&&hs.body.name==="Hosty"&&gs.body.name==="Guesty"&&gs.body.hero==="witch",JSON.stringify({h:hs&&hs.body,g:gs&&gs.body}));
  for(const p of [H,Gp]) await p.evaluate(()=>window.__whoplayed.beatNow()); await wait(500);
  const hb=posts.filter(x=>x.tag==="host"&&x.body&&x.body.ev==="beat").pop(), gb=posts.filter(x=>x.tag==="guest"&&x.body&&x.body.ev==="beat").pop();
  check("co-op 'beat' keeps the room and roles",hb&&gb&&hb.body.room===room&&gb.body.room===room&&hb.body.role==="host"&&gb.body.role==="guest"&&hb.body.map===gb.body.map,JSON.stringify({h:hb&&hb.body,g:gb&&gb.body}));
  await hc.close(); await gc.close(); }

check("every post went to the local catcher with the agreed shape",posts.length>0&&posts.every(x=>shapeOk(x.body)),JSON.stringify(posts.filter(x=>!shapeOk(x.body)).slice(0,2)));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
