// ===== WHOSE HIDEOUT (build 377; parts/staging/59-hideout.js, 99-network.js, assemble.mjs, and the Worker's /api/hideout/k/<key>/...). Matt: "the whole point of being co-op is that you can go in and share space together ... of course you should have
// your own hideout if you're playing single player by yourself, but not when you're playing with somebody else". Before: ONE gear table for every player alive, so a friend's hideout was yours. Now: the gear on display lives in one table per hideout KEY.
// Checked: a brand-new player gets a private random key (kept across reloads); a player who already keeps a hideout and has no key stays on the original table ('main', no key sent: the very same request as before); ?hideoutkey=new gives a
// private one to such a player (once), ?hideoutkey=<name> picks one, a malformed one is ignored; the hideout page's gear calls carry the key in the path (and nothing for 'main'); a co-op GUEST's hideout is the HOST's (the key rides the host's
// world snapshot), an older host that sends none puts the guest on 'main'; the host in a co-op visit uses its own.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP hideoutkey-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const sigPort=9661; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(8743); const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const API="http://127.0.0.1:9";   // nothing listens: every /api/hideout call is answered by the route below
async function open(opts){ opts=opts||{}; const ctx=await browser.newContext(); const urls=[];
  await ctx.addInitScript(({save,key})=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); if(save) localStorage.setItem("dd_hideout_save_v2",JSON.stringify({placed:[]})); if(key) localStorage.setItem("ddHideoutKey",key); }catch(e){} },{ save:!!opts.save, key:opts.key||null });
  await ctx.route("**/api/hideout/**",route=>{ urls.push(route.request().url()); route.fulfill({ status:200, contentType:"application/json", headers:{ "access-control-allow-origin":"*" }, body:JSON.stringify({ items:[] }) }); });
  const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:8743/?silent&nogate&hideoutapi="+encodeURIComponent(API)+(opts.q?"&"+opts.q:""),{timeout:90000});
  await p.waitForFunction(()=>window.__dd&&window.__hideout&&window.__hideout.key,null,{timeout:90000});
  await p.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); window.__dd.step(1/60,10); }); p.__urls=urls; p.__ctx=ctx; return p; }
const RE=/^h-[a-z0-9]{10}$/;
// ---- the keys
{ const p=await open(); const k=await p.evaluate(()=>({ key:window.__hideout.key(), stored:localStorage.getItem("ddHideoutKey") }));
  check("a brand-new player (no hideout save, no key) is given a private random key, and it is kept",RE.test(k.key)&&k.stored===k.key,JSON.stringify(k));
  await p.reload(); await p.waitForFunction(()=>window.__hideout&&window.__hideout.key,null,{timeout:90000}); const k2=await p.evaluate(()=>window.__hideout.key());
  check("and it is the same key after a reload",k2===k.key,k2); await p.__ctx.close(); }
{ const p=await open({ save:true }); const k=await p.evaluate(()=>({ key:window.__hideout.key(), stored:localStorage.getItem("ddHideoutKey") }));
  check("a player who already keeps a hideout and has no key stays on the original table: 'main' (nothing stored)",k.key==="main"&&k.stored===null,JSON.stringify(k)); await p.__ctx.close(); }
{ const p=await open({ save:true, q:"hideoutkey=new" }); const k=await p.evaluate(()=>({ key:window.__hideout.key(), stored:localStorage.getItem("ddHideoutKey") }));
  check("?hideoutkey=new gives that player a private table (stored)",RE.test(k.key)&&k.stored===k.key,JSON.stringify(k));
  await p.goto("http://127.0.0.1:8743/?silent&nogate&hideoutkey=new&hideoutapi="+encodeURIComponent(API),{timeout:90000}); await p.waitForFunction(()=>window.__hideout&&window.__hideout.key,null,{timeout:90000}); const k2=await p.evaluate(()=>window.__hideout.key());
  check("and opening the same link again does not reset it",k2===k.key,k2); await p.__ctx.close(); }
{ const p=await open({ save:true, q:"hideoutkey=jacob-room1" }); const k=await p.evaluate(()=>window.__hideout.key()); check("?hideoutkey=<name> picks the table",k==="jacob-room1",k); await p.__ctx.close(); }
{ const p=await open({ save:true, q:"hideoutkey=ab" }); const k=await p.evaluate(()=>window.__hideout.key()); check("a malformed key (too short) is ignored",k==="main",k); await p.__ctx.close(); }
// ---- what the hideout page asks the server for
{ const p=await open({ key:"matt-room1" }); await p.evaluate(()=>window.__hideout.open()); await sleep(2500);
  const u=p.__urls.filter(x=>/\/gear/.test(x)); const frame=await p.evaluate(()=>window.__hideout.url());
  check("the hideout page asks for ITS key's table: the gear call carries /k/<key>/ in its path, and the frame was opened with hk=",u.length>0&&u.every(x=>/\/api\/hideout\/k\/matt-room1\/gear/.test(x))&&/hk=matt-room1/.test(frame||""),JSON.stringify({ u:u.slice(0,2), frame })); await p.__ctx.close(); }
{ const p=await open({ save:true }); await p.evaluate(()=>window.__hideout.open()); await sleep(2500);
  const u=p.__urls.filter(x=>/\/gear/.test(x)); const frame=await p.evaluate(()=>window.__hideout.url());
  check("'main' sends no key: the call is the original /api/hideout/gear and the frame has no hk",u.length>0&&u.every(x=>/\/api\/hideout\/gear(\?|$)/.test(x))&&!/hk=/.test(frame||""),JSON.stringify({ u:u.slice(0,2), frame })); await p.__ctx.close(); }
// ---- a co-op visit: the guest stands in the host's hideout
async function tick(pages,batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++) for(const p of pages) await p.evaluate(()=>window.__dd.step(1/60,1)); await sleep(20); } }
async function pair(H,G,tag){ const rc=tag+"-"+Math.random().toString(36).slice(2,8);
  const ho=await H.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const jo=await G.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts}); await tick([H,G],20,5); return { ho, jo }; }
async function until(pages,page,fn,arg,max=120){ for(let i=0;i<max;i++){ const v=await page.evaluate(fn,arg); if(v) return v; await tick(pages,1,3); } return await page.evaluate(fn,arg); }
{ const H=await open({ key:"host-room-9" }), G=await open({ key:"guest-own-1" }); await sleep(4300);
  const c=await pair(H,G,"hk"); check("host and guest connect",!c.ho.err&&!c.jo.err,JSON.stringify(c));
  const hk=await until([H,G],G,()=>{ const w=window.__net.world(); return w&&w.hk?w.hk:null; });
  check("the host's hideout key rides its world snapshot to the guest",hk==="host-room-9",String(hk));
  const gk=await G.evaluate(()=>window.__hideout.key()), hkey=await H.evaluate(()=>window.__hideout.key());
  check("the guest's hideout is the HOST's table (its own key is not used), the host's is its own",gk==="host-room-9"&&hkey==="host-room-9",JSON.stringify({ gk, hkey }));
  const n0=G.__urls.length;   // (a page that started alone preloaded a frame on its own key before it joined; the visit itself is what counts)
  await G.evaluate(()=>window.__hideout.open()); await sleep(2500);
  const gu=G.__urls.slice(n0).filter(x=>/\/gear/.test(x)), gf=await G.evaluate(()=>window.__hideout.url());
  check("the guest's hideout page asks the server for the host's table",gu.length>0&&gu.every(x=>/\/api\/hideout\/k\/host-room-9\/gear/.test(x))&&/hk=host-room-9/.test(gf||""),JSON.stringify({ gu:gu.slice(0,2), gf }));
  await H.__ctx.close(); await G.__ctx.close(); }
{ const H=await open({ save:true }), G=await open({ key:"guest-own-2" }); await sleep(4300);
  const c=await pair(H,G,"hk2"); check("(host on the original table) host and guest connect",!c.ho.err&&!c.jo.err,JSON.stringify(c));
  const hk=await until([H,G],G,()=>{ const w=window.__net.world(); return w&&w.hk?w.hk:null; });
  const gk=await G.evaluate(()=>window.__hideout.key());
  check("a guest visiting a host who is on the original table is on the original table too ('main', no key sent)",hk==="main"&&gk==="main",JSON.stringify({ hk, gk }));
  await H.__ctx.close(); await G.__ctx.close(); }
{ const H=await open({ key:"older-host-1" }), G=await open({ key:"guest-own-3" }); await sleep(4300);
  const c=await pair(H,G,"hk3"); await until([H,G],G,()=>{ const w=window.__net.world(); return w&&w.hk?w.hk:null; });
  await G.evaluate(()=>{ const w=window.__net.world(); delete w.hk; });   // an older host: its snapshots carry no key
  const gk=await G.evaluate(()=>window.__hideout.key()); check("an older host that sends no key puts the guest on the only table it ever had ('main')",gk==="main",gk);
  await H.__ctx.close(); await G.__ctx.close(); }
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
console.log(`${results.filter(Boolean).length}/${results.length} passed`); await browser.close(); server.close(); sig.close&&sig.close(); process.exit(results.every(Boolean)?0:1);
