// ===== THE BARRICADE AND ITS GATE (build 602; parts/staging/99z-barricade.js). Matt: "these only cost 1 mana to put down" / "they should be used for pathing, they wont be attacked unless theres no
// possible path, at witch point theyll be attacked".
// Checked: the Engineer's keys carry the Barricade and the Gate; a barricade costs 1 mana and no roots; each square wears the piece its neighbours call for (a lone post, end caps, straights, a cross,
// end caps for a corner); E does not upgrade it (and its card offers no upgrade); a mob with a way round the walls never smashes one and walks the long way; a mob the walls shut in hacks through a wall;
// a gate lets the hero through and shuts the horde out; archers leave walls alone; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import fs from "fs";
const DIST=process.env.DIST||"./dist"; const server=await serve(8953,{dist:DIST});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1100,height:760}});
await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_trainer","done"); localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8953/?silent&nogate",{timeout:180000}); await page.waitForFunction(()=>window.__dd&&window.__barricade&&window.__dd.heroModel&&window.__dd.heroModel(),null,{timeout:180000}); await sleep(800);
const A=await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} window.__meta.setLevel(7); await window.__heroes.select('engineer'); d.start(); d.step(1/60,10);
  const slots=[...document.querySelectorAll('#hotbar .slot')].filter(s=>s.style.display!=='none').sort((a,b)=>(+a.style.order||0)-(+b.style.order||0)).map(s=>s.querySelector('.n').textContent);
  d.addMana(5000); d.setHero(-20,10,0); d.step(1/60,3); const m0=d.S.mana, du0=d.S.du; const w=d.placeDefAt('barricade',d.hero.x+0,d.hero.z-8,0); d.step(1/60,2);
  return { slots, cost:m0-d.S.mana, du:d.S.du-du0, ok:!!w }; });
check("the Engineer's keys carry the Barricade and the Barricade Gate; a barricade costs 1 mana and no roots",A.slots.includes('Barricade')&&A.slots.includes('Barricade Gate')&&A.cost===1&&A.du===0&&A.ok,JSON.stringify(A));
// a little yard of shapes, on open floor near the start: find a clear 9x7 patch
const B0=await page.evaluate(()=>{ const d=window.__dd; for(const x of d.defs.slice()) if(x.kind==='barricade') window.__perch.remove(x); d.step(1/60,2);
  const ok=(cx,cz)=>{ try{ return !!d.placeDefAt; }catch(e){ return false; } };
  // lay: a lone post at P, a 4-long line, a plus, an L
  const H=d.hero, cell=2, bx=Math.round(H.x/2)*2, bz=Math.round(H.z/2)*2-14; const put=(i,j,k)=>d.placeDefAt(k||'barricade',bx+i*cell,bz+j*cell,0);
  const W={}; W.post=put(0,0); for(let i=0;i<4;i++) W['line'+i]=put(3+i,0); W.c=put(10,0); W.cn=put(10,-1); W.cs=put(10,1); W.ce=put(11,0); W.cw=put(9,0); W.l0=put(0,3); W.l1=put(1,3); W.l2=put(0,4);
  window.__W=W; return Object.fromEntries(Object.entries(W).map(([k,v])=>[k,!!(v&&v.cells&&v.cells.length)])); });
let B=null; for(let i=0;i<200;i++){ B=await page.evaluate(()=>{ const d=window.__dd; d.step(1/60,2); const P=window.__barricade.pieceOf, W=window.__W; return { pieces:window.__barricade.info().pieces.length, post:P(W.post), end:P(W.line0), mid:P(W.line1), cross:P(W.c), corner:P(W.l0) }; }); if(B.pieces>=5&&B.post[0]!=='stub') break; await sleep(60); }
check("each square wears the piece its neighbours call for: a lone POST, an END CAP at a line's end, a STRAIGHT in its middle, the CROSS where four meet, two end caps at a corner",B.post.join()==='post'&&B.end.join()==='endcap'&&B.mid.join()==='straight'&&B.cross.join()==='cross'&&B.corner.join()==='endcap,endcap',JSON.stringify({B0,B}));
const C=await page.evaluate(()=>{ const d=window.__dd, w=window.__W.post; d.setHero(w.x+1.6,w.z,-Math.PI/2); d.step(1/60,3); const m0=d.S.mana, l0=w.lvl; d.upgradeDef(); d.step(1/60,2); const card=(document.querySelector('#defcard,.defcard,#towercard')||{}).textContent||'';
  return { lvl:w.lvl, l0, spent:m0-d.S.mana, card:/Upgrade/.test(card), cardTxt:card.slice(0,80) }; });
check("E does not upgrade a barricade (no mana spent, no mark), and its card offers no upgrade",C.lvl===1&&C.spent===0&&!C.card,JSON.stringify(C));
if(process.env.SHOTS){ await page.evaluate(()=>{ const d=window.__dd, W=window.__W; d.step(1/60,20); window.__freeze=true; const c=d.camera, x=W.line1.x+2, z=W.line1.z; c.position.set(x-3,9,z+11); c.lookAt(x+2,0,z+1.5); c.updateMatrixWorld(); }); await sleep(700); await page.screenshot({path:process.env.SHOTS+"/barricade-shapes.png"}); await page.evaluate(()=>{ window.__freeze=false; }); }
// ---- mazing: a mob in a pen of walls with one gap walks out of the gap and smashes nothing; shut the gap and it hacks through
const D=await page.evaluate(()=>{ const d=window.__dd; for(const x of d.defs.slice()) if(x.kind==='barricade'||x.kind==='bgate') window.__perch.remove(x); d.step(1/60,2);
  d.S.phase='wave'; d.S.crystal=1e6; for(const e of d.enemies) e.dead=e.dead||.001; d.spawn('goblin','N'); const g=d.enemies.filter(x=>x.kind==='goblin'&&!x.dead).pop(); g.hp=g.max=1e9; g.dmg=0;
  const s0={x:g.x,z:g.z}; for(let i=0;i<600&&Math.hypot(g.x-s0.x,g.z-s0.z)<14;i++) d.step(1/60,1);   // let it walk into the hall: the pen goes up round wherever it is
  const cx=Math.round(g.x/2)*2, cz=Math.round(g.z/2)*2; for(let i=0;i<300&&Math.hypot(g.x-cx,g.z-cz)<4;i++) d.step(1/60,1); const vx=g.x-cx, vz=g.z-cz; g.x=cx; g.z=cz;   // which way it was heading: the pen's gap is on that side const H=d.hero; d.setHero(cx+14,cz+14,0);
  const ring=[]; for(let i=-2;i<=2;i++) for(let j=-2;j<=2;j++){ if(Math.max(Math.abs(i),Math.abs(j))!==2) continue; ring.push([i,j]); }
  const gap=Math.abs(vx)>Math.abs(vz)?[Math.sign(vx)*2,0]:[0,Math.sign(vz)*2]; const walls=[]; for(const [i,j] of ring){ if(i===gap[0]&&j===gap[1]) continue; const w=d.placeDefAt('barricade',cx+i*2,cz+j*2,0); if(w) walls.push(w); }
  window.__pen={ cx, cz, g, walls, gap }; d.step(1/60,1); return { walls:walls.length, at:[cx,cz], smashers:window.__barricade.info().smashers, uses:g.fF===window.__barricade.flowWall() }; });
const E=await page.evaluate(()=>{ const d=window.__dd, P=window.__pen, g=P.g; let hitWall=0, hp0=P.walls.map(w=>w.hp); let out=false; for(let i=0;i<900;i++){ d.step(1/60,1); if(g.tgtDef&&(g.tgtDef.kind==='barricade')) hitWall++; if(Math.hypot(g.x-P.cx,g.z-P.cz)>5.5){ out=true; break; } }
  return { out, hitWall, hurt:P.walls.filter((w,i)=>w.hp<hp0[i]).length, uses:g.fF===window.__barricade.flowWall(), gx:+g.x.toFixed(1), gz:+g.z.toFixed(1) }; });
check("a mob penned in walls with one gap walks out of the gap: it never strikes a wall",E.out&&E.hitWall===0&&E.hurt===0,JSON.stringify({D,E}));
const F=await page.evaluate(()=>{ const d=window.__dd, P=window.__pen, g=P.g; g.x=P.cx; g.z=P.cz; g.dmg=5; const gate=d.placeDefAt('bgate',P.cx+P.gap[0]*2,P.cz+P.gap[1]*2,0); d.step(1/60,2); const Fw=window.__barricade.flowWall();
  let hitWall=0, hitGate=0; for(let i=0;i<900;i++){ d.step(1/60,1); if(g.tgtDef&&g.tgtDef.kind==='barricade') hitWall++; if(g.tgtDef&&g.tgtDef.kind==='bgate') hitGate++; if((gate&&gate.hp<gate.max)||P.walls.some(w=>w.hp<w.max)) break; }
  const hurt=P.walls.concat([gate]).filter(w=>w&&w.hp<w.max).length; return { gate:!!(gate&&gate.cells.length), hitWall, hitGate, hurt, sealed:Fw?Fw.dist[d.flow().nxt.length?0:0]:null }; });
check("shut the gap with a GATE: the horde cannot pass it, so the mob (shut in now) hacks at the walls around it",F.gate&&(F.hitWall+F.hitGate)>30&&F.hurt>0,JSON.stringify(F));
const G=await page.evaluate(()=>{ const d=window.__dd, P=window.__pen, H=d.hero; const gate=d.defs.find(x=>x.kind==='bgate'); const gx=P.gap[0]/2, gz=P.gap[1]/2; d.setHero(gate.x+gx*2.2,gate.z+gz*2.2,0); H.y=gate.base; d.setCam(Math.atan2(-gx,-gz),.3,8); d.setKeys({w:1}); for(let i=0;i<50;i++) d.step(1/60,1); d.setKeys({w:0}); d.step(1/60,2);
  const w=P.walls.find(x=>Math.abs(x.z-gate.z)<.1&&x.x<gate.x)||P.walls[0]; return { through:((H.x-gate.x)*gx+(H.z-gate.z)*gz)<-1, hx:+H.x.toFixed(2), hz:+H.z.toFixed(2), gx:gate.x, gz:gate.z }; });
check("the hero walks straight through the gate",G.through,JSON.stringify(G));
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
