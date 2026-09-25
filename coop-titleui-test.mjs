// ===== CO-OP (phase 10): the title-screen HOST A GAME / JOIN A FRIEND buttons -- co-op was previously a
// window.__net-only API with no in-game way for an ordinary player to actually reach it. This suite drives the
// REAL buttons/input (parts/head.html's #start screen, wired in 99-network.js), not window.__net directly, so it
// exercises exactly what a real player clicks and types.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-titleui-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9465;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };

const server=await serve(8892);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));

const pageUrl="http://127.0.0.1:8892/?silent&nogate&peerhost=127.0.0.1&peerport="+sigPort+"&peerpath=/peerjs";   // points the REAL title-screen buttons at this test's local signaling server instead of the public 0.peerjs.com broker they use by default
for(const p of [hostPage,guestPage]){ await p.goto(pageUrl,{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net,null,{timeout:60000}); }
// note: no window.__dd.start()/step() here, deliberately -- these tests exercise the REAL title screen, which
// starts life with S.phase==='start' exactly as it would for a real player who hasn't clicked anything yet

// ---- host: click HOST A GAME, wait for a room code to appear, confirm it matches what __net actually opened ----
await hostPage.click('#hostbtn');
await hostPage.waitForFunction(()=>{ const el=document.getElementById('hostCode'); return el&&el.textContent&&el.textContent.length>3; },null,{timeout:20000});
const hostCode=await hostPage.evaluate(()=>document.getElementById('hostCode').textContent);
const hostNetId=await hostPage.evaluate(()=>window.__net.myId());
check("hosting shows a real room code matching what __net actually opened",hostCode===hostNetId,JSON.stringify({hostCode,hostNetId}));
const hostRole=await hostPage.evaluate(()=>window.__net.role());
check("hosting sets the real host role",hostRole==='host',hostRole);
const phaseBeforeEnter=await hostPage.evaluate(()=>window.__dd.S.phase);
check("the host hasn't entered the hall yet -- the code stays on screen until they choose to",phaseBeforeEnter==='start',phaseBeforeEnter);

// ---- guest: a WRONG code first, to prove both the error path and the Enter-key guard (game.js's own keydown
// handler calls play() on Enter while S.phase==='start', with no check for a focused input -- unguarded, pressing
// Enter to submit a code would ALSO fire that, same conflict 60-lootfeel.js/65-tavernroom.js's own hotkeys already
// guard against for their own inputs/overlays) ----
await guestPage.click('#joinbtn');
await guestPage.fill('#joinCode','not-a-real-room-code-xyz');
await guestPage.press('#joinCode','Enter');
// 'Connecting…' is set synchronously the instant doJoin() runs, so waiting for "any text" would resolve
// immediately without ever observing the real outcome -- wait for it to actually CHANGE away from that instead
await guestPage.waitForFunction(()=>{ const el=document.getElementById('joinMsg'); return el&&el.textContent&&el.textContent!=='Connecting…'; },null,{timeout:20000});
const badMsg=await guestPage.evaluate(()=>document.getElementById('joinMsg').textContent);
const guestPhaseAfterBad=await guestPage.evaluate(()=>window.__dd.S.phase);
check("a wrong code shows a real error, not a silent hang",badMsg.length>0&&badMsg!=='Connecting…',badMsg);
check("the Enter-key guard holds -- game.js's own Enter->play() handler did NOT fire while typing/submitting the code",
  guestPhaseAfterBad==='start',guestPhaseAfterBad);

// ---- guest: the REAL code this time ----
await guestPage.fill('#joinCode',hostCode);
await guestPage.click('#joinGoBtn');
await guestPage.waitForFunction(()=>window.__dd.S.phase!=='start',null,{timeout:20000});
const guestRole=await guestPage.evaluate(()=>window.__net.role());
check("joining with the real code connects as a real guest",guestRole==='guest',guestRole);
const guestPhase=await guestPage.evaluate(()=>window.__dd.S.phase);
check("a successful join enters the hall automatically (no separate 'enter' step needed, unlike hosting)",guestPhase==='build',guestPhase);

// ---- host: now actually enter, via the button the code panel left on screen ----
await hostPage.click('#hostEnterBtn');
await hostPage.waitForFunction(()=>window.__dd.S.phase!=='start',null,{timeout:20000});
const hostPhase=await hostPage.evaluate(()=>window.__dd.S.phase);
check("clicking ENTER THE HALL after hosting actually enters it",hostPhase==='build',hostPhase);

// ---- the connection is real: tick both and confirm the host sees the guest's simulated hero ----
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__freeze=true; window.__dd.step(1/60,30); });
async function tickBoth(batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); } }
await guestPage.evaluate(()=>window.__dd.setCam(0,.42,8));
await tickBoth(6,5);
const guestSeenOnHost=await hostPage.evaluate(()=>window.__combat.guestHero([...window.__net.peers()][0]));
check("the host genuinely registers the guest's simulated hero -- a real connection, not just a UI state change",
  !!guestSeenOnHost,JSON.stringify(guestSeenOnHost));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
