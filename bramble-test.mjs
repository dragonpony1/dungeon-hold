// ===== THE BRAMBLE HEDGE BY MARK: the hedge (kind 'spike') gets its own model per mark like the other defenses --
// defMarks('spike','hedge') in 50-defmodels.js: hedge-1 (the old all-marks hedge) comes down with the 'soon' tier, hedge-2..4
// (the player's T2-T4, cut to one 1024 px base-colour map each) are fetched only when a hedge first reaches that mark, plus the
// next mark up, prefetched; Mark V keeps the tier-4 look. Also pins the five-cell stretch: it lives on an inner group now,
// because updateDefs sets d.mdl.scale uniformly every frame and used to wipe a stretch on the root after one frame; and it
// gives a mark's growth back along the hedge, so a mark makes a hedge taller, never longer than its footprint. And a co-op
// guest's hedge puppets (99-network.js) fetch and wear their own mark's model, as the host's do.
// Serves dist/ (DIST env, or ./dist) and records the real request order, as loadorder-test.mjs does.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
import fs from "fs"; import path from "path"; import { execSync } from "child_process";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const SP=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/,"")); const DIST=process.env.DIST||SP+"/dist";
if(!fs.existsSync(DIST+"/index.html")){ console.log("building "+DIST+" first"); execSync("DIST="+DIST+" EXTRA=./parts/staging node assemble.mjs",{cwd:SP,stdio:"inherit"}); }
// the files themselves: small like the other tier models, and each one's vertex count (read from its glTF JSON) so the
// test can tell which file a hedge on screen was actually built from
const glbVerts=f=>{ const b=fs.readFileSync(f); const len=b.readUInt32LE(12); const j=JSON.parse(b.slice(20,20+len).toString("utf8")); return j.meshes.flatMap(m=>m.primitives).reduce((a,p)=>a+j.accessors[p.attributes.POSITION].count,0); };
const FILES=[1,2,3,4].map(n=>SP+"/parts/assets/hedge-"+n+".glb"), MB=FILES.map(f=>+(fs.statSync(f).size/1e6).toFixed(2)), VERTS=FILES.map(glbVerts);
check("hedge-1..4.glb all ship, each under 1.6 MB",MB.every(m=>m>0&&m<1.6),JSON.stringify(MB));
check("the four marks are four different models (vertex counts differ)",new Set(VERTS).size===4,JSON.stringify(VERTS));
check("nothing ships or asks for the old single hedge.glb any more",!fs.existsSync(SP+"/parts/assets/hedge.glb")&&!/ASSET\('hedge\.glb'\)/.test(fs.readFileSync(DIST+"/index.html","utf8")));
const PORT=8964, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await browser.newPage(); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
const t0=Date.now(); const started=[], finished=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
page.on("request",r=>{ const u=r.url().replace(BASE,''); if(/\.glb\.txt$/.test(u)) started.push({u,t:Date.now()-t0}); });
page.on("requestfinished",r=>{ const u=r.url().replace(BASE,''); if(/\.glb\.txt$/.test(u)) finished.push({u,t:Date.now()-t0}); });
const name=u=>u.replace(/^\/assets\//,'').replace(/\.[0-9a-f]{8}\.glb\.txt$/,'').replace(/\.glb\.txt$/,'');
const isFirst=u=>/^(gnome|knight|witch|fighter|squire|ninja|crystal|sword-[a-z]+)$/.test(name(u));
const isLater=u=>/^(orc|ogre|bandit|trollmob|trollboss|drake|smith)$/.test(name(u));
const asked=n=>started.filter(s=>name(s.u)===n), doneAt=n=>{ const f=finished.find(f=>name(f.u)===n); return f?f.t:Infinity; };
await page.goto(BASE+"/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__defglb,null,{timeout:90000});
// let the whole startup stream settle: no new request for 3 s (90 s cap)
for(let i=0,last=-1,quiet=0;i<360&&quiet<12;i++){ await sleep(250); if(started.length===last) quiet++; else { quiet=0; last=started.length; } }
await page.waitForFunction(()=>{ const l=window.__defglb.list().spike; return l&&l[0]; },null,{timeout:60000}).catch(()=>{});
const firstDone=Math.max(...started.filter(s=>isFirst(s.u)).slice(0,3).map(s=>doneAt(name(s.u)))), h1=asked('hedge-1')[0], laterStarted=started.filter(s=>isLater(s.u));
check("Mark I: hedge-1 is requested once, and only after the first tier (hero, crystal, sword) has landed",asked('hedge-1').length===1&&firstDone<Infinity&&h1.t>=firstDone,JSON.stringify({firstDone,hedge1:h1&&h1.t}));
check("...and it is part of the 'soon' tier: the later tier (the other mobs, the smith) waits for it to land",laterStarted.length>=3&&doneAt('hedge-1')<Infinity&&laterStarted.every(s=>s.t>=doneAt('hedge-1')),JSON.stringify({hedge1Done:doneAt('hedge-1'),firstLater:laterStarted[0]&&{n:name(laterStarted[0].u),t:laterStarted[0].t}}));
const atLoad=await page.evaluate(()=>({list:window.__defglb.list().spike,asked:window.__defglb.asked().filter(k=>/^spike/.test(k))}));
check("on load hedge-2..4 are NOT requested (and no Mark II-IV hedge template exists yet)",!started.some(s=>/^hedge-[234]$/.test(name(s.u)))&&atLoad.asked.length===0&&atLoad.list.filter(Boolean).length===1,JSON.stringify({requested:started.filter(s=>/^hedge/.test(name(s.u))).map(s=>name(s.u)),atLoad}));
check("the Mark I template is built from hedge-1 (its vertex count)",await page.evaluate(v=>{ let n=0; window.__defglb.template('spike',1).wrap.traverse(o=>{ if(o.isMesh&&!o.userData.isOL) n+=o.geometry.attributes.position.count; }); return n===v; },VERTS[0]));

// one hedge on map one's hall floor (row 20, three cells across), then up through the marks the real way (upgradeDef)
await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); window.__dd.addMana(99999); });
// build 177: the Mark V+ gold chevrons (ShapeGeometry, game.js towerChevrons) float over the model and aren't part of it
const measure=`(t)=>{ const d=window.__dd; t.mdl.updateMatrixWorld(true); const b=new THREE.Box3(); t.mdl.traverse(m=>{ if(m.isMesh&&!m.userData.isOL&&m.geometry.type!=='CircleGeometry'&&m.geometry.type!=='TorusGeometry'&&m.geometry.type!=='ShapeGeometry') b.union(new THREE.Box3().setFromObject(m,true)); }); const s=b.getSize(new THREE.Vector3()); let verts=0; t.mdl.traverse(o=>{ if(o.isMesh&&!o.userData.isOL&&o.geometry.type!=='CircleGeometry'&&o.geometry.type!=='TorusGeometry'&&o.geometry.type!=='ShapeGeometry') verts+=o.geometry.attributes.position.count; }); const xs=t.cells.map(i=>i%d.map().gw), zs=t.cells.map(i=>Math.floor(i/d.map().gw)); return {lvl:t.lvl,sx:+s.x.toFixed(2),sy:+s.y.toFixed(2),sz:+s.z.toFixed(2),minY:+(b.min.y-t.base).toFixed(3),verts,tpl:[1,2,3,4].find(l=>window.__defglb.template('spike',l)===t.mdl.userData.tpl)||0,cellsX:new Set(xs).size,cellsZ:new Set(zs).size,ovhX:+Math.max(0,d.cw(Math.min(...xs))-1-b.min.x,b.max.x-d.cw(Math.max(...xs))-1).toFixed(3),rootScale:t.mdl.scale.toArray().map(v=>+v.toFixed(3))}; }`;
const placed=await page.evaluate(()=>{ const d=window.__dd; const t=d.place('spike',17,20,0); if(!t) return null; d.step(1/60,30); window.__hedge=t; return {x:t.x,z:t.z,lvl:t.lvl,asked:window.__defglb.asked().filter(k=>/^spike/.test(k))}; });   // 30 frames: the placing pop is over before Mark I is measured
await sleep(300);
check("placing a Mark I hedge prefetches Mark II only (hedge-2 asked for, hedge-3/4 not)",!!placed&&placed.lvl===1&&placed.asked.join()==='spike:1'&&asked('hedge-2').length===1&&!asked('hedge-3').length&&!asked('hedge-4').length,JSON.stringify(placed));
const m1=await page.evaluate(`(${measure})(window.__hedge)`);
const up2=await page.evaluate(()=>{ const d=window.__dd, t=window.__hedge; d.upgradeDef({x:t.x,z:t.z}); d.step(1/60,2); return {lvl:t.lvl,asked:window.__defglb.asked().filter(k=>/^spike/.test(k))}; });
await sleep(300);
check("upgrading it to Mark II: hedge-2 is the model it needs (asked for once) and hedge-3 is prefetched, hedge-4 not yet",up2.lvl===2&&asked('hedge-2').length===1&&up2.asked.includes('spike:2')&&asked('hedge-3').length===1&&!asked('hedge-4').length,JSON.stringify(up2));
const sw2=await page.waitForFunction(()=>{ window.__dd.step(1/60,1); const t=window.__hedge; return !!window.__defglb.list().spike[1]&&t.mdl.userData.tpl===window.__defglb.template('spike',2); },null,{timeout:90000,polling:250}).then(()=>true).catch(()=>false);
await page.evaluate(()=>window.__dd.step(1/60,30));   // let the upgrade pop finish before measuring
const m2=await page.evaluate(`(${measure})(window.__hedge)`);
check("...and its model swaps to the tier-2 template, built from hedge-2",sw2&&m2.tpl===2&&m2.verts===VERTS[1]&&m1.tpl===1&&m1.verts===VERTS[0],JSON.stringify({m1:[m1.tpl,m1.verts],m2:[m2.tpl,m2.verts],want:VERTS}));
const up4=await page.evaluate(()=>{ const d=window.__dd, t=window.__hedge; for(let k=0;k<2;k++){ d.upgradeDef({x:t.x,z:t.z}); d.step(1/60,2); } return {lvl:t.lvl}; });
const sw4=await page.waitForFunction(()=>{ window.__dd.step(1/60,1); const t=window.__hedge; return !!window.__defglb.list().spike[3]&&t.mdl.userData.tpl===window.__defglb.template('spike',4); },null,{timeout:90000,polling:250}).then(()=>true).catch(()=>false);
await page.evaluate(()=>window.__dd.step(1/60,30));
const m4=await page.evaluate(`(${measure})(window.__hedge)`);
check("a Mark IV hedge shows hedge-4 (tier-4 template, hedge-4's vertex count), each of hedge-2..4 fetched exactly once",up4.lvl===4&&sw4&&m4.tpl===4&&m4.verts===VERTS[3]&&[2,3,4].every(n=>asked('hedge-'+n).length===1),JSON.stringify({lvl:up4.lvl,m4:[m4.tpl,m4.verts],want:VERTS[3],asked:[2,3,4].map(n=>asked('hedge-'+n).length)}));
const m5=await page.evaluate(`(()=>{ const d=window.__dd, t=window.__hedge; d.upgradeDef({x:t.x,z:t.z}); d.step(1/60,40); return (${measure})(t); })()`);
check("Mark V keeps the tier-4 look (and asks for nothing past hedge-4)",m5.lvl===5&&m5.tpl===4&&m5.verts===VERTS[3]&&!started.some(s=>/^hedge-[05-9]/.test(name(s.u))),JSON.stringify({lvl:m5.lvl,tpl:m5.tpl}));

// how each mark sits: on the floor, the target height (1.1, +7% a mark as the game grows it), the five-cell stretch kept
// (a hedge used to snap back to its unstretched 2.6 wide one frame after placing) but NOT grown with the mark -- about
// Mark I's length at every mark, so it stays inside its footprint -- lying along its footprint; a quarter-turned one lies along z
const sits=await page.evaluate(`(()=>{ const d=window.__dd; for(const [i,cx] of [11,14,20].entries()){ const t=d.place('spike',cx,22,0); if(!t) continue; for(let k=0;k<i+1;k++){ d.upgradeDef({x:t.x,z:t.z}); d.step(1/60,1); } } for(let i=0;i<600;i++){ d.step(1/60,1); if(d.defs.filter(t=>t.kind==='spike').every(t=>t.mdl.userData.tpl===window.__defglb.template('spike',t.lvl))) break; } const q=d.place('spike',5,8,Math.PI/2); d.step(1/60,30); const rows=d.defs.filter(t=>t.kind==='spike'&&t.cz===22).concat([window.__hedge]).map(t=>(${measure})(t)); return {rows,q:q?(${measure})(q):null}; })()`);
const byLvl=Object.fromEntries(sits.rows.map(s=>[s.lvl,s])), q=sits.q, w1=m1.sx;
for(const L of [2,3,4,5]){ const s=byLvl[L]; if(!s){ check("Mark "+L+" hedge measured",false); continue; } const g=1+.07*(L-1);
  check("Mark "+L+" ("+["","","hedge-2","hedge-3","hedge-4","hedge-4"][L]+"): stands on the floor (not sunk, not floating), 1.1 tall x the mark's growth, as long as Mark I (the mark grows it taller, not longer), along its three footprint cells",Math.abs(s.minY)<.02&&Math.abs(s.sy-1.1*g)<.03&&Math.abs(s.sx-w1)/w1<.05&&s.sx/s.sy>3.3/g&&s.sx<=6.2&&s.sz<s.sx/3&&s.cellsX===3&&s.cellsZ===1&&s.tpl===Math.min(L,4),JSON.stringify(Object.assign({want:{sy:+(1.1*g).toFixed(2),sx:w1}},s))); }
check("Mark I: the same on the floor, 1.1 tall, and the stretch survives the per-frame scale (root scale uniform, still ~4.3 wide, not 2.6)",Math.abs(m1.minY)<.02&&Math.abs(m1.sy-1.1)<.03&&m1.sx>4.1&&m1.sx<4.5&&m1.rootScale.every(v=>v===m1.rootScale[0]),JSON.stringify(m1));
check("a quarter-turned hedge lies along z, across its three footprint cells",!!q&&q.sz>q.sx*3&&q.cellsZ===3&&q.cellsX===1&&Math.abs(q.minY)<.02,JSON.stringify(q));
// set down off a cell centre -- 0.9 west of cell 11's middle on row 14, the hall's west wall one cell on -- a Mark I hedge's
// west end reaches about 0.06 past its footprint cells (as its ghost always did); Mark V may overhang no more than that plus
// the ~1.6% the tier models differ in length (a stretch that grew with the mark put it 0.67 into the wall)
const off=await page.evaluate(`(()=>{ const d=window.__dd; const t=d.placeDefAt('spike',d.cw(11)-.9,d.cwz(14),0); d.step(1/60,30); const a=(${measure})(t); for(let k=0;k<4;k++){ d.upgradeDef({x:t.x,z:t.z}); d.step(1/60,2); } for(let i=0;i<60&&t.mdl.userData.tpl!==window.__defglb.template('spike',4);i++) d.step(1/60,1); d.step(1/60,40); return {a,b:(${measure})(t)}; })()`);
check("off a cell centre, a Mark V hedge overhangs its footprint cells no more than Mark I does (the length does not grow with the mark)",off.a.lvl===1&&off.b.lvl===5&&off.b.tpl===4&&off.a.cellsX===3&&off.b.cellsX===3&&off.a.ovhX<.1&&off.b.ovhX<=off.a.ovhX+.05&&Math.abs(off.b.sx-off.a.sx)/off.a.sx<.05&&Math.abs(off.b.sy-1.1*1.28)<.03,JSON.stringify(off));
// the placement ghost is the same width as the hedge it puts down (it always had the stretch; now the placed one keeps it too)
// -- the hedge is the knight's (70-hero2.js: select() refuses a defense the current hero hasn't unlocked), so switch if need be
const ghostOf=()=>page.evaluate(()=>{ const d=window.__dd; try{ d.select('spike'); d.step(1/60,3); if(!d.ghost()) return null; const tpl=window.__defglb.template('spike',1); const mine=new Set(d.defs.map(t=>t.mdl)); let g=null; for(const o of d.scene.children) if(o.userData&&o.userData.tpl===tpl&&!mine.has(o)) g=o; if(!g) return {err:'no ghost object'}; const ry=g.rotation.y; g.rotation.y=0; g.updateMatrixWorld(true); const b=new THREE.Box3(); g.traverse(m=>{ if(m.isMesh&&!m.userData.isOL&&m.geometry.type!=='CircleGeometry') b.union(new THREE.Box3().setFromObject(m,true)); }); const s=b.getSize(new THREE.Vector3()); const w=s.x; g.rotation.y=ry; d.select('spike'); return {w:+w.toFixed(2),h:+s.y.toFixed(2)}; }catch(err){ return {err:String(err)}; } });
let gh=await ghostOf(); if(!gh){ await page.evaluate(()=>window.__heroes.select('knight')); await page.waitForFunction(()=>/Knight/i.test(window.__dd.heroModel().label),null,{timeout:90000}).catch(()=>{}); gh=await ghostOf(); }
check("the placement ghost (Mark I) is as wide as the Mark I hedge it puts down",!!gh&&!gh.err&&Math.abs(gh.w-m1.sx)<.1&&Math.abs(gh.h-1.1)<.05,JSON.stringify({ghost:gh,placed:m1.sx}));

// ---- co-op: a guest builds on the host, so its own defs list stays empty and the hedges it sees are puppets of the host's
// list (99-network.js defPuppetAdd and the 'defs' handler). Nothing asked for Marks II-IV on a guest (only reskinDefs asks,
// over the local defs) and a puppet was never rebuilt when a model landed, so a guest saw every mark in the Mark I look.
// A puppet's first build cannot have its mark's model yet (the fetch starts in that same call), so a puppet found wearing
// its own mark's model has been rebuilt when the model landed.
let PeerServer=null; try{ ({ PeerServer }=await import("peer")); }catch(e){}
if(!PeerServer) console.log("SKIP the co-op checks: the `peer` package isn't installed (npm i peer), and they need a local signaling server");
else {
  const sigPort=8965, sig=PeerServer({port:sigPort,path:"/peerjs",host:"127.0.0.1"}); await sleep(300); const peerOpts={host:"127.0.0.1",port:sigPort,path:"/peerjs"};
  const gctx=await browser.newContext(), gp=await gctx.newPage(); gp.on("pageerror",e=>errors.push("guest: "+String(e))); const gAsked=[]; gp.on("request",r=>{ const u=r.url().replace(BASE,''); if(/\.glb\.txt$/.test(u)&&/^hedge-/.test(name(u))) gAsked.push(name(u)); });
  await gp.goto(BASE+"/?silent&nogate",{timeout:120000}); await gp.waitForFunction(()=>window.__dd&&window.__net&&window.__defsync&&window.__defglb,null,{timeout:90000});
  await gp.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,3); }); await gp.waitForFunction(()=>{ const l=window.__defglb.list().spike; return l&&l[0]; },null,{timeout:90000}).catch(()=>{});
  const gBefore=gAsked.slice(), rc="bramble-"+Math.random().toString(36).slice(2,8);
  const ho=await page.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,err=>res(err?String(err):null),peerOpts)),{rc,peerOpts});
  const gj=await gp.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,err=>res(err?String(err):null),peerOpts)),{rc,peerOpts});
  check("co-op: host and guest connect",ho===null&&gj===null,JSON.stringify({ho,gj}));
  const hostLvls=await page.evaluate(()=>window.__dd.defs.filter(t=>t.kind==='spike').map(t=>t.lvl).sort());
  // each spike puppet on the guest: which mark's template its model was built from, and its length along its own axis
  const pup=()=>gp.evaluate(()=>{ const d=window.__dd, tpls=[1,2,3,4].map(l=>window.__defglb.template('spike',l)); return window.__defsync.list().map(id=>window.__defsync.get(id)).filter(p=>p.kind==='spike').map(p=>{ const o=d.scene.children.find(o=>o.userData&&o.userData.tpl&&tpls.includes(o.userData.tpl)&&Math.abs(o.position.x-p.x)<.02&&Math.abs(o.position.z-p.z)<.02); if(!o) return {lvl:p.lvl,missing:true}; const ry=o.rotation.y; o.rotation.y=0; o.updateMatrixWorld(true); const b=new THREE.Box3(); o.traverse(m=>{ if(m.isMesh&&!m.userData.isOL&&m.geometry.type!=='CircleGeometry'&&m.geometry.type!=='TorusGeometry') b.union(new THREE.Box3().setFromObject(m,true)); }); o.rotation.y=ry; o.updateMatrixWorld(true); return {lvl:p.lvl,tpl:tpls.indexOf(o.userData.tpl)+1,want:Math.min(p.lvl,4),w:+b.getSize(new THREE.Vector3()).x.toFixed(2)}; }).sort((a,b)=>a.lvl-b.lvl); });
  let first=null, last=[]; for(let i=0;i<240;i++){ await page.evaluate(()=>window.__dd.step(1/60,35)); await sleep(250); last=await pup(); if(!first&&last.length) first=last; if(last.length===hostLvls.length&&last.every(p=>p.tpl===p.want)) break; }   // 35 host frames is over half a second: at least one 'defs' list each time
  check("co-op: the guest asked for no hedge-2..4 of its own on load, then for each of hedge-2..4 once, when the host's hedges needed them",gBefore.join()==='hedge-1'&&[2,3,4].every(n=>gAsked.filter(x=>x==='hedge-'+n).length===1),JSON.stringify({gBefore,gAsked}));
  check("co-op: every hedge puppet on the guest wears its own mark's model (Marks II-IV their tier models, Mark V tier 4), rebuilt when that model landed",last.length===hostLvls.length&&hostLvls.some(l=>l>=2)&&last.every(p=>!p.missing&&p.tpl===p.want),JSON.stringify({hostLvls,first,last}));
  check("co-op: ...and each is as long as the host's hedges (the stretch is on the puppets too)",last.length===hostLvls.length&&last.every(p=>Math.abs(p.w-w1)/w1<.05),JSON.stringify({w1,widths:last.map(p=>p.w)}));
  await gp.evaluate(()=>window.__net.leave()).catch(()=>{}); await page.evaluate(()=>window.__net.leave()).catch(()=>{}); await gctx.close(); if(sig.close) sig.close();
}
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
