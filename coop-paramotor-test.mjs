// ===== THE PARAMOTOR IN CO-OP (build 578; 99r-paramotor.js + 99-network.js lookOf pm). Matt: "could 2 or 3 or 4 be flying around?" / "yes build it".
// Checked with a host and a guest on the Drawbridge: four paramotors on the towers; each takes one and both fly at once; each sees the other's paramotor (wing open) riding over the other's hero, and
// the one they took gone from its tower; the guest lands -> on the host's screen it flies home and parks; the host's horn brings a flying guest down.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer; try { ({ PeerServer } = await import("peer")); } catch(e) { console.log("SKIP coop-paramotor-test.mjs — the `peer` package isn't installed"); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9493; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>setTimeout(r,300)); const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(8933,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const H=await (await browser.newContext()).newPage(), G=await (await browser.newContext()).newPage(); const errors=[]; for(const p of [H,G]) p.on("pageerror",e=>errors.push(String(e)));
for(const p of [H,G]) await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
for(const p of [H,G]){ await p.goto("http://127.0.0.1:8933/?silent&nogate&map=4",{timeout:120000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__para&&window.__para.perches,null,{timeout:120000}); }
for(const p of [H,G]) await p.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); window.__dd.step(1/60,30); });
async function tick(n=10,size=5){ for(let b=0;b<n;b++){ for(let i=0;i<size;i++){ await H.evaluate(()=>window.__dd.step(1/60,1)); await G.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); } }
const rc="coopfly-"+Math.random().toString(36).slice(2,8);
const ho=await H.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
const gj=await G.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
check("host and guest connect",ho.err===null&&gj.err===null,JSON.stringify({ho,gj}));
await H.evaluate(()=>{ const d=window.__dd; d.enemies.length=0; d.S.phase='build'; }); await tick(8,5);
const n=await H.evaluate(()=>window.__para.perches().length);
check("four paramotors on the towers",n===4,String(n));
// each stands by a different one and takes off
const up=(p,i)=>p.evaluate(i=>{ const d=window.__dd, P=window.__para, pe=P.perches()[i]; d.hero.x=pe.x; d.hero.z=pe.z; d.hero.y=pe.y; d.step(1/60,3); return P.launch(i); },i);
const a1=await up(H,3), a2=await up(G,0); await tick(12,5);
const hs=await H.evaluate(()=>{ const P=window.__para.info(), g=window.__party.list()[0], q=g?window.__party.get(g):null; return { on:P.on, peers:P.peers, taken:P.taken, puppet:q?{x:q.x,y:q.y,z:q.z}:null }; });
const gs=await G.evaluate(()=>{ const P=window.__para.info(), g=window.__party.list()[0], q=g?window.__party.get(g):null; return { on:P.on, peers:P.peers, taken:P.taken, puppet:q?{x:q.x,y:q.y,z:q.z}:null }; });
check("both take off: two players flying at once",a1&&a2&&hs.on&&gs.on,JSON.stringify({a1,a2,h:hs.on,g:gs.on}));
const near=(pf,q)=>pf&&q&&Math.hypot(pf.x-q.x,pf.z-q.z)<1.5&&Math.abs(pf.y-q.y)<1.5;
check("the host sees the guest's paramotor (#1), wing open, riding over the guest's hero high above the walk",hs.peers.length===1&&hs.peers[0].k===1&&hs.peers[0].wing&&!hs.peers[0].spare&&near(hs.peers[0],hs.puppet)&&hs.puppet.y>16.5,JSON.stringify(hs));
check("the guest sees the host's (#4) the same way",gs.peers.length===1&&gs.peers[0].k===4&&gs.peers[0].wing&&near(gs.peers[0],gs.puppet),JSON.stringify(gs));
check("on each screen the two taken are marked taken, the other two still there",hs.taken[3]==='me'&&hs.taken[0]&&hs.taken[0]!=='me'&&hs.taken[1]===null&&hs.taken[2]===null&&gs.taken[0]==='me'&&gs.taken[3]&&gs.taken[3]!=='me',JSON.stringify({h:hs.taken,g:gs.taken}));
// the guest drops; on the host's screen #1 flies home
await G.evaluate(()=>window.__para.land()); for(let i=0;i<40;i++){ await tick(1,5); if(!(await G.evaluate(()=>window.__para.info().on))) break; } await tick(4,5);
const h2=await H.evaluate(()=>{ const P=window.__para.info(); return { peers:P.peers.length, taken:P.taken }; });
check("the guest lands: on the host's screen it leaves him and flies home",h2.peers===0&&(h2.taken[0]==='back'||h2.taken[0]===null),JSON.stringify(h2));
await tick(20,5); const h3=await H.evaluate(()=>window.__para.info().taken);
check("...and parks again (free to take)",h3[0]===null,JSON.stringify(h3));
// the host's horn brings a flying guest down
await H.evaluate(()=>window.__para.land()); for(let i=0;i<40;i++){ await tick(1,5); if(!(await H.evaluate(()=>window.__para.info().on))) break; } await tick(20,5);
await up(G,1); await tick(4,5); const gUp=await G.evaluate(()=>window.__para.info().on);
await H.evaluate(()=>{ const d=window.__dd; d.S.phase='wave'; for(let i=0;i<4;i++) d.spawn('goblin','S'); }); let down=false; for(let i=0;i<60&&!down;i++){ await tick(1,5); down=!(await G.evaluate(()=>window.__para.info().on)); }
check("the host sounds the horn: the flying guest is brought down",gUp&&down,JSON.stringify({gUp,down}));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); sig.close&&sig.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
