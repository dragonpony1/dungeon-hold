// ===== CO-OP: two real-world join/host UX bugs a real two-player test turned up, neither one a connectivity
// problem this module's own code controls, both now handled instead of leaving a player stuck with zero signal.
// (1) PeerJS's own default room code is a full auto-generated UUID -- fine for a machine, a real mouthful to read
// aloud or thumb-type on a phone. Now a short, spoken-friendly code (shortRoomCode, 99-network.js) this module
// generates and hands to Peer() itself, with a quiet retry on the rare real collision (PeerJS's 'unavailable-id').
// (2) WebRTC's own peer-to-peer negotiation can hang indefinitely -- neither an 'open' nor an 'error' ever fires --
// on some wifi/cellular networks (symmetric NAT, a firewall blocking UDP, a backgrounded tab throttled mid-
// negotiation). A real player hit exactly this: "Connecting…" forever, no error, no way to know anything was
// wrong. JOIN_TIMEOUT now bounds that wait with a real, actionable message, without cancelling the underlying
// attempt -- a slow connection that lands late still lets them in.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-joinux-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };

const sigPort=9469;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const server=await serve(8895);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];

async function openPage(qs){
  const ctx=await browser.newContext(); const page=await ctx.newPage();
  page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("http://127.0.0.1:8895/?silent&nogate&peerhost=127.0.0.1&peerport="+sigPort+"&peerpath=/peerjs"+(qs||""),{timeout:90000});
  await page.waitForFunction(()=>window.__dd&&window.__net,null,{timeout:60000});
  return {ctx,page};
}

// ==== 1: the room code itself is short and easy to read/type, not PeerJS's own raw UUID ====
{
  const {ctx,page}=await openPage();
  await page.click('#hostbtn');
  await page.waitForFunction(()=>{ const el=document.getElementById('hostCode'); return el&&el.textContent&&el.textContent.length>3; },null,{timeout:20000});
  const code=await page.evaluate(()=>document.getElementById('hostCode').textContent);
  check("the room code is short and friendly (5 chars, no ambiguous 0/O/1/I/L), not a raw UUID",
    /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/.test(code),code);
  await ctx.close();
}

// ==== 2: a real 'unavailable-id' collision is retried quietly, not surfaced as a dead end ====
{
  const {ctx,page}=await openPage();
  const calls=await page.evaluate(()=>{
    let n=0; const origHost=window.__net.host;
    window.__net.host=(code,cb,opts)=>{ n++; if(n<3){ cb({type:'unavailable-id',message:'ID taken'}); return; } origHost(code,cb,opts); };
    window.__testHostCalls=()=>n;
    return new Promise(res=>{
      document.getElementById('hostbtn').click();
      const iv=setInterval(()=>{ const el=document.getElementById('hostCode'); if(el&&el.textContent&&el.textContent.length>3){ clearInterval(iv); res(n); } },50);
    });
  });
  check("two fake collisions were quietly retried before the third (real) attempt succeeded",calls===3,"calls="+calls);
  const panelShown=await page.evaluate(()=>!document.getElementById('hostPanel').classList.contains('hide'));
  check("the host panel still shows the real code after retrying through collisions",panelShown);
  await ctx.close();
}

// ==== 3: giving up after repeated collisions shows a real error, not an infinite retry loop ====
{
  const {ctx,page}=await openPage();
  const calls=await page.evaluate(()=>new Promise(res=>{
    let n=0;
    window.__net.host=(code,cb)=>{ n++; cb({type:'unavailable-id',message:'ID taken'}); };
    document.getElementById('hostbtn').click();
    const iv=setInterval(()=>{ const el=document.getElementById('hostMsg'); if(el&&/try again/i.test(el.textContent)){ clearInterval(iv); res(n); } },50);
    setTimeout(()=>{ clearInterval(iv); res(n); },5000);
  }));
  check("gives up after a bounded number of collisions rather than retrying forever",calls>=1&&calls<=6,"calls="+calls);
  const coopRowShown=await page.evaluate(()=>!document.getElementById('coopRow').classList.contains('hide'));
  check("falls back to the HOST/JOIN buttons so they can try again",coopRowShown);
  await ctx.close();
}

// ==== 4: a stuck WebRTC negotiation (neither 'open' nor 'error' ever fires) times out with a real message ====
{
  const {ctx,page}=await openPage("&jointimeout=300");   // test-only override, real play defaults to 20000ms
  await page.evaluate(()=>{
    window.__savedJoinCb=null;
    window.__net.join=(code,cb)=>{ window.__savedJoinCb=cb; };   // never calls back on its own -- the real hang
  });
  await page.click('#joinbtn');
  await page.fill('#joinCode','ANYCODE');
  await page.click('#joinGoBtn');
  const msgImmediately=await page.evaluate(()=>document.getElementById('joinMsg').textContent);
  check("shows Connecting… right away, same as always",msgImmediately==='Connecting…',msgImmediately);

  await page.waitForFunction(()=>document.getElementById('joinMsg').textContent!=='Connecting…',null,{timeout:5000});
  const msgAfterTimeout=await page.evaluate(()=>document.getElementById('joinMsg').textContent);
  check("times out with a real, actionable message instead of hanging forever",
    /wifi|cellular|network/i.test(msgAfterTimeout),msgAfterTimeout);
  const btnEnabled=await page.evaluate(()=>!document.getElementById('joinGoBtn').disabled);
  check("CONNECT re-enables after the timeout so they can retry",btnEnabled);

  // the underlying attempt was never cancelled -- a late real success should still let them in
  const phaseBefore=await page.evaluate(()=>window.__dd.S.phase);
  check("still on the title screen while waiting",phaseBefore==='start',phaseBefore);
  await page.evaluate(()=>window.__savedJoinCb(null,'fake-guest-id'));
  await page.waitForFunction(()=>window.__dd.S.phase!=='start',null,{timeout:5000});
  const phaseAfter=await page.evaluate(()=>window.__dd.S.phase);
  check("a late success after the timeout still lets them into the hall, not stranded",phaseAfter==='build',phaseAfter);
  await ctx.close();
}

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
