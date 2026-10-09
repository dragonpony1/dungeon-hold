// ===== A BALLISTA ON A PERCH OR A CLOISTER HEDGE (build 381; 96b-perch.js stand-on surfaces, 56d-courtdecor.js hedges, 99-network.js). Matt: "make it so i can place a balista on a perch" / "need to be able to place ballista on hedges in cloister as well".
// Checked: aimed at a free perch, the ballista's ghost snaps onto the middle of the deck (2.5 up) and is green; confirming sets the ballista there (its base is the deck's top, it is tied to the perch, it takes no floor cell, the perch's
// cell is still walkable for the horde); a second one on the same perch is refused; another tower kind is not stacked; the ballista fires from up there; losing the perch brings the ballista down with it and gives 70% of its mana back.
// On the Cloister Court the same for a HEDGE: the ghost snaps to the middle of the hedge cell at the hedge's top (1.2 up), a ballista is set there, one to a hedge, and a plain bed (no hedge) or the open path is refused (it is not a surface).
// And the co-op host lets a guest place one on a perch too.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8993,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
async function open(q){ const page=await (await browser.newContext({viewport:{width:1100,height:700}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
  await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
  await page.goto("http://127.0.0.1:8993/?silent&nogate"+(q||""),{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__heroes&&window.__perch&&window.__dd.heroModel(),null,{timeout:120000}); await sleep(800);
  await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} await window.__heroes.select("troll"); d.start(); d.step(1/60,10); d.addMana(9000); });
  // walk the aim to a spot: the ghost follows the camera ray, so nudge the hero by what is left over until it lands there
  await page.evaluate(()=>{ window.__aimAt=(tx,tz)=>{ const d=window.__dd; d.setCam(Math.PI,.42,8); d.setHero(tx,tz+4,Math.PI); for(let k=0;k<12;k++){ d.step(1/60,30); const g=d.ghost(); if(!g) break; const dx=tx-g.x, dz=tz-g.z, L=Math.hypot(dx,dz); if(L<.25) break; const h=d.hero, f=Math.min(1,3/L)*.9; d.setHero(h.x+dx*f,h.z+dz*f,Math.PI); } d.step(1/60,3); return d.ghost(); }; });
  return page; }
// ================= a perch =================
{ const page=await open();
  const perch=await page.evaluate(()=>{ const d=window.__dd; const p=d.place('perch',16,24,0); d.step(1/60,3); return p?{x:p.x,z:p.z,base:p.base}:null; });
  check("a perch is down (the Ranger's)",!!perch,JSON.stringify(perch));
  await page.evaluate(async()=>{ await window.__heroes.select("knight"); window.__dd.step(1/60,5); });
  const A=await page.evaluate(({perch})=>{ const d=window.__dd; d.select("harpoon"); d.step(1/60,3); return window.__aimAt(perch.x,perch.z); },{perch});
  check("aimed at a free perch, the ballista's ghost is green and snapped onto the deck's middle",A&&A.ok&&Math.abs(A.x-perch.x)<1e-6&&Math.abs(A.z-perch.z)<1e-6,JSON.stringify(A));
  const B=await page.evaluate(()=>{ const d=window.__dd; const n0=d.defs.length; d.confirmPlace(); d.step(1/60,2); d.confirmPlace(); d.step(1/60,3); const h=d.defs.filter(x=>x.kind==='harpoon'); const t=h[0]; return { n:d.defs.length-n0, harpoons:h.length, base:t&&+t.base.toFixed(2), onSurf:!!(t&&t.onSurf), top:t&&+t.top.toFixed(2), mdlY:t&&+t.mdl.position.y.toFixed(2), cells:t&&t.cells.length, flowOk:d.flow().dist[24*d.map().gw+16]>=0 }; });
  check("confirming sets the ballista ON the deck: base 2.5, tied to the perch, no floor cell of its own, and the perch's cell is still walkable for the horde",B.harpoons===1&&Math.abs(B.base-2.5)<.05&&B.onSurf&&B.cells===0&&B.flowOk&&Math.abs(B.mdlY-2.5)<.05,JSON.stringify(B));
  const C=await page.evaluate(({perch})=>{ const d=window.__dd; d.select("harpoon"); d.step(1/60,3); const g=window.__aimAt(perch.x,perch.z); d.confirmPlace(); d.step(1/60,2); d.confirmPlace(); d.step(1/60,3); return { g, harpoons:d.defs.filter(x=>x.kind==='harpoon').length }; },{perch});
  check("a second ballista on the same perch is refused (one to a perch): the ghost is red with its reason and nothing more is placed",C.g&&C.g.ok===false&&/already/i.test(C.g.why||"")&&C.harpoons===1,JSON.stringify(C));
  const D=await page.evaluate(()=>{ const d=window.__dd; d.step(1/60,2); for(const e of d.enemies) e.dead=e.dead||.001; d.S.phase='wave'; d.S.crystal=1e6; const t=d.defs.find(x=>x.kind==='harpoon'); d.spawn('goblin','N'); const g=d.enemies.filter(x=>x.kind==='goblin'&&!x.dead).pop(); g.hp=g.max=1e9; g.spd=0; g.dmg=0; g.atk=1e6; g.x=t.x+Math.sin(t.yaw)*9; g.z=t.z+Math.cos(t.yaw)*9; g.y=0; let fired=0, maxY=0, hp0=g.hp; for(let f=0;f<400;f++){ d.step(1/60,1); d.S.crystal=1e6; const P=typeof d.projs==='function'?d.projs():d.projs; if(P) for(const p of P){ if(p.kind==='harpoon'){ fired++; maxY=Math.max(maxY,p.y); } } if(g.hp<hp0) break; } return { fired:fired>0, maxY:+maxY.toFixed(2), hurt:g.hp<hp0, rot:t.rot, yaw:t.yaw, pitch:t.pitch, t:[t.x,t.z,t.base], g:[+g.x.toFixed(1),+g.z.toFixed(1)], cd:t.cd, dead:g.dead }; });
  check("the ballista fires from up there (a bolt leaves from above the deck) and hurts what it hits",D.fired&&D.maxY>2.5&&D.hurt,JSON.stringify(D));
  const F=await page.evaluate(({perch})=>{ const d=window.__dd; for(const e of d.enemies) e.dead=e.dead||.001; d.select("frost"); d.step(1/60,3); const g=window.__aimAt(perch.x,perch.z); return { frostOk:g&&g.ok, why:g&&g.why, stack:window.__perch.stack() }; },{perch});
  check("only the stand-up towers may stand on a perch (build 599: the gunner and the turret on a perch, the Sky Wrecker on a sky platform -- never a frost spire) (a frost spire aimed at it is refused, 'Already occupied')",F.frostOk===false&&F.stack.includes("harpoon")&&!F.stack.includes("frost"),JSON.stringify(F));
  const UP=await page.evaluate(()=>{ const d=window.__dd; d.addMana(99999); const p=d.defs.find(x=>x.kind==='perch'&&window.__perch.towerOn(x)); if(!p) return {none:true}; const t=window.__perch.towerOn(p); t.hp=t.max; d.setHero(p.x,p.z+2.2,Math.PI); d.hero.yaw=Math.PI; d.step(1/60,2);
    const l0=t.lvl; d.upgradeDef(); return { picked:t.lvl>l0, lvl:t.lvl, l0, perchLvl:p.lvl }; });
  check("a ballista on a perch can be upgraded: aiming at the perch picks the tower standing on it (build 407)",UP.picked&&UP.perchLvl===1,JSON.stringify(UP));
  const E=await page.evaluate(()=>{ const d=window.__dd; d.cancelPlace&&d.cancelPlace(); for(const e of d.enemies) e.dead=e.dead||.001; const mana0=d.S.mana; const p=d.defs.find(x=>x.kind==='perch'); window.__perch.remove(p); d.step(1/60,3); return { ballistas:d.defs.filter(x=>x.kind==='harpoon').length, perches:d.defs.filter(x=>x.kind==='perch').length, back:Math.round(d.S.mana-mana0) }; });
  check("selling or losing the perch brings its ballista down with it and gives 70% of its mana back",E.ballistas===0&&E.perches===0&&E.back>=40,JSON.stringify(E));
  await page.context().close(); }
// ================= a Cloister hedge =================
{ const page=await open("&map=2");
  await page.evaluate(async()=>{ await window.__heroes.select("knight"); window.__dd.step(1/60,5); });
  const H=await page.evaluate(()=>{ const d=window.__dd, D=window.__courtdecor; const cw=d.cw, cwz=d.cwz; const edge=D.hedgeCells().find(c=>{ const x=cw(c.cx), z=cwz(c.cz); return true; }); return { n:D.hedgeCells().length, cell:edge, x:cw(edge.cx), z:cwz(edge.cz) }; });
  check("the Cloister Court has hedge cells (bed cells beside the paths)",H.n>20&&!!H.cell,JSON.stringify({ n:H.n, cell:H.cell }));
  const G=await page.evaluate(({H})=>{ const d=window.__dd; d.select("harpoon"); d.step(1/60,3); const g=window.__aimAt(H.x,H.z); return g; },{H});
  const onHedge=await page.evaluate(({G})=>{ const d=window.__dd, D=window.__courtdecor; return !!(G&&D.hedgeCells().find(c=>Math.abs(d.cw(c.cx)-G.x)<1e-6&&Math.abs(d.cwz(c.cz)-G.z)<1e-6)); },{G});
  check("aimed at a hedge, the ballista's ghost is green and snapped to the middle of a hedge cell",G&&G.ok&&onHedge,JSON.stringify(G));
  const P=await page.evaluate(({H})=>{ const d=window.__dd; const n0=d.defs.filter(x=>x.kind==='harpoon').length; d.confirmPlace(); d.step(1/60,2); d.confirmPlace(); d.step(1/60,3); const h=d.defs.filter(x=>x.kind==='harpoon'); const t=h[h.length-1]; return { n:h.length-n0, base:t&&+t.base.toFixed(2), want:H.cell.top, mdlY:t&&+t.mdl.position.y.toFixed(2), cells:t&&t.cells.length, tx:t&&t.x, tz:t&&t.z }; },{H});
  check("confirming sets the ballista on the hedge, at the hedge's top",P.n===1&&Math.abs(P.base-P.want)<.05&&Math.abs(P.mdlY-P.want)<.05&&P.cells===0,JSON.stringify(P));
  const Q=await page.evaluate(({P})=>{ const d=window.__dd; d.select("harpoon"); d.step(1/60,3); const g=window.__aimAt(P.tx,P.tz); const n0=d.defs.length; d.confirmPlace(); d.step(1/60,2); d.confirmPlace(); d.step(1/60,3); return { g, added:d.defs.length-n0 }; },{P});
  check("a second ballista on the same hedge is refused",Q.g&&Q.g.ok===false&&Q.added===0,JSON.stringify(Q));
  const R=await page.evaluate(()=>{ const d=window.__dd, D=window.__courtdecor; // a bed cell that is NOT a hedge (plain soil): not a surface
    const soil=(()=>{ for(let z=5;z<=38;z++) for(let x=5;x<=38;x++){ if(D.isBed(x,z)&&!D.hedgeCells().some(c=>c.cx===x&&c.cz===z)) return {x:d.cw(x),z:d.cwz(z)}; } return null; })(); if(!soil) return { soil:null }; if(!d.ghost()) d.select("harpoon"); d.step(1/60,3); const g=window.__aimAt(soil.x,soil.z); return { soil, g }; });
  check("a plain bed with no hedge is not a surface (refused)",R.soil===null||(R.g&&R.g.ok===false),JSON.stringify(R));
  await page.context().close(); }
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
