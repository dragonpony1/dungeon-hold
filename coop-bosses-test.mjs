// ===== CO-OP (build 375). Matt, in a game with Jacob on the pig bosses' map: "i see his towers but not him" / "he does not see the boss healthbars top middle" / "he sees wooden doll for pig bosses".
// Three real holes in what a guest sees: (1) a teammate's puppet had no height, so on a raised floor (the Deep Prison's terraces, any dais or stairs) it stood UNDER the floor -- now the height rides in the heroes message (and an older host's puppet takes
// the floor under its feet); (2) a guest builds mob puppets with makeMob, which falls back to the plain wooden mannequin for the bosses, whose models are only loaded when the HOST spawns one -- now a guest asks for the model the first time it
// sees such a kind, and swaps the real one in when it lands; (3) the boss bars read the local `enemies`, which on a guest are empty (its mobs are puppets) -- they read the puppets there, and the host sends a big mob's full health for the fraction.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-bosses-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sigPort=9641; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(8741); const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function open(map){ const ctx=await browser.newContext(); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
  const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto("http://127.0.0.1:8741/?silent&nogate"+(map?"&map="+map:""),{timeout:90000});
  await p.waitForFunction(()=>window.__dd&&window.__net&&window.__party&&window.__mobsync&&window.__pigbosses,null,{timeout:90000});
  await p.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); return p; }
async function tick(pages,batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++) for(const p of pages) await p.evaluate(()=>window.__dd.step(1/60,1)); await sleep(20); } }
async function tickUntil(pages,page,fn,arg,maxBatches=80,size=3){ for(let b=0;b<maxBatches;b++){ const v=await page.evaluate(fn,arg); if(v) return v; await tick(pages,1,size); } return await page.evaluate(fn,arg); }
async function connect(H,G,tag){ const rc=tag+"-"+Math.random().toString(36).slice(2,8);
  const hostOpen=await H.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const join=await G.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  await tick([H,G],4,5); return { hostOpen, join }; }

// ================= (2)+(3) the pig bosses, on the first map =================
{ const H=await open(0), G=await open(0); await sleep(4300);
  await H.evaluate(()=>{ const E=window.__dd.enemies; for(let i=E.length-1;i>=0;i--) E.splice(i,1); });
  const c=await connect(H,G,"bosses"); check("host and guest connect",!c.hostOpen.err&&!c.join.err,JSON.stringify(c));
  const gLoaded0=await G.evaluate(()=>window.__pigbosses.loaded()); check("the guest has NOT loaded the pig models (nothing ever asked it to)",gLoaded0===false,String(gLoaded0));
  await H.evaluate(async()=>{ await window.__pigbosses.ensure(); window.__dd.S.phase='wave'; window.__pigbosses.spawn(); });
  const seen=await tickUntil([H,G],G,()=>{ const ks=window.__mobsync.list().map(id=>window.__mobsync.get(id).kind); return ['pigflail','pigdagger','pigsling'].every(k=>ks.includes(k))?ks:null; },null,200,3);
  check("the three pig bosses reach the guest as puppets",!!seen,JSON.stringify(seen));
  // they ask for the models and swap them in
  const real=await tickUntil([H,G],G,()=>{ const ps=window.__mobsync.list().map(id=>window.__mobsync.get(id)).filter(p=>/^pig/.test(p.kind)); return ps.length>=3&&ps.every(p=>p.glb&&!p.stand)?ps.map(p=>p.kind):null; },null,600,3);
  const st=await G.evaluate(()=>window.__mobsync.list().map(id=>window.__mobsync.get(id)).filter(p=>/^pig/.test(p.kind)).map(p=>({kind:p.kind,glb:p.glb,stand:p.stand})));
  check("the guest asks for the boss models and the real pigs replace the wooden mannequins (no more 'wooden doll')",!!real&&await G.evaluate(()=>window.__pigbosses.loaded()),JSON.stringify(st));
  // the bar
  const bar0=await G.evaluate(()=>{ const el=document.getElementById('pigbar'); return { shown:el.style.display, rows:[...el.querySelectorAll('.row')].map(r=>({ k:r.dataset.k, d:r.style.display, w:r.querySelector('.fill').style.width })) }; });
  check("the boss bar shows on the guest's screen with all three rows full",bar0.shown==='block'&&bar0.rows.every(r=>r.d==='block'&&parseFloat(r.w)>95),JSON.stringify(bar0));
  await H.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.kind==='pigflail'&&!e.dead); e.hp=e.max*.4; });
  const bar1=await tickUntil([H,G],G,()=>{ const r=document.querySelector('#pigbar .row[data-k="pigflail"] .fill'); const w=parseFloat(r.style.width); return w>30&&w<50?w:null; },null,120,3);
  check("when the host hurts a boss the guest's bar drops with it (about 40%)",!!bar1,String(bar1));
  await H.evaluate(()=>{ for(const e of window.__dd.enemies) if(/^pig/.test(e.kind)) { e.hp=0; window.__dd.kill(e); } });
  const gone=await tickUntil([H,G],G,()=>document.getElementById('pigbar').style.display==='none'?1:null,null,150,3);
  check("and the bar is gone when the bosses are",!!gone);
  await H.context().close(); await G.context().close(); }

// ================= (1) a teammate on a raised floor: the Deep Prison =================
{ const H=await open(5), G=await open(5); await sleep(4300);
  const c=await connect(H,G,"height"); check("host and guest connect (the Deep Prison)",!c.hostOpen.err&&!c.join.err,JSON.stringify(c));
  const hId=c.hostOpen.id;
  // the host stands on the middle terrace (floor 4) and then the rim (floor 6): the guest's puppet of the host must stand there
  const cw=cx=>2*cx+1-47, cwz=cz=>2*cz+1-9;
  const stand=async(cx,cz)=>{ await H.evaluate(({x,z})=>{ const d=window.__dd; d.setHero(x,z,Math.PI); d.step(1/60,6); },{x:cw(cx),z:cwz(cz)}); };
  await stand(23,32); await tick([H,G],40,5);
  const onMid=await tickUntil([H,G],G,(id)=>{ const p=window.__party.get(id); return p&&p.y>3.5?p:null; },hId,80,5);
  check("the host on the middle terrace: the guest's puppet of the host stands there (height 4), not under the floor",!!onMid&&Math.abs(onMid.y-4)<.4,JSON.stringify(onMid));
  await stand(23,40); await tick([H,G],40,5);
  const onRim=await tickUntil([H,G],G,(id)=>{ const p=window.__party.get(id); return p&&p.y>5.5?p:null; },hId,80,5);
  check("and on the rim (height 6)",!!onRim&&Math.abs(onRim.y-6)<.4,JSON.stringify(onRim));
  // the puppet of the guest on the host's screen: the host simulates the guest, whose copy stands where the guest was put (floor under it)
  const gId=c.join.id; const copy=await H.evaluate(id=>window.__party.get(id),gId);
  check("the guest's puppet on the host's screen is on the floor too (the pit start, height 0)",!!copy&&Math.abs(copy.y)<.3,JSON.stringify(copy));
  // a puppet whose host sends no height (an older build) still takes the floor under its feet
  const old=await G.evaluate(({cx,cz})=>{ const d=window.__dd; const P=window.__party; P.add('oldhost','witch.glb','Old'); return new Promise(res=>{ let n=0; const iv=setInterval(()=>{ const g=P.get('oldhost'); if(g&&g.ready){ clearInterval(iv); P.setTarget('oldhost',2*cx+1-47,2*cz+1-9,0); for(let i=0;i<40;i++) d.step(1/60,1); res(P.get('oldhost')); } else if(++n>400){ clearInterval(iv); res(g); } },50); }); },{cx:23,cz:20});
  check("a puppet told no height (an older host) is set on the floor under it (the lower terrace, 2)",!!old&&Math.abs(old.y-2)<.4,JSON.stringify(old));
  await H.context().close(); await G.context().close(); }

check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
console.log(`${results.filter(Boolean).length}/${results.length} passed`); await browser.close(); server.close(); sig.close&&sig.close(); process.exit(results.every(Boolean)?0:1);
