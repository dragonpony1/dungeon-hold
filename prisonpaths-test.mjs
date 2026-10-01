// ===== THE DEEP PRISON'S PATHS (build 374; parts/game.js MAP.build + MOBBLOCK, parts/staging/56k-prisonpaths.js). Matt: "the last thing on this map is getting our pathing down" / "i like the B plus A idea".
// Checked: a railing line cuts the middle and the lower terrace in two lanes joined at the east end, so every gate has a longer road; the horde's roads never cross a hero-only cell; the hero's own stairs and gates run straight down the
// middle of the hall (three flights, two gates) and a hero holding "forward" walks the whole way from the middle terrace's south lane to the pit; the same hero elsewhere along the rail is stopped by it; a mob chasing a hero will not use
// his gate; a tower cannot be set on a hero-only cell or a rail, can be set beside them, and is not lifted by the rail; Matt's railing (an instanced model) stands on both lines, every cliff lip and the open sides of the flights; no errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8990,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[]; const warns=[];
const ctx=await browser.newContext({viewport:{width:900,height:560}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e))); page.on("console",m=>{ if(m.type()==='warning'&&/railing|prison/.test(m.text())) warns.push(m.text().slice(0,160)); });
await page.goto("http://127.0.0.1:8990/?silent&nogate&map=5",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__prisonpaths&&window.__prisonpaths.refill&&window.__dd.map()&&window.__dd.map().id==='prison',null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); });
// ---- the roads
const R=await page.evaluate(()=>{ const P=window.__prisonpaths, d=window.__dd; const reach=P.reach(); const GW=47;
  // walk every gate's road cell by cell and count the hero-only cells on it
  const roads={}; for(const [k,l] of Object.entries(typeof d.lanes==="function"?d.lanes():d.lanes)){ const ff=d.flow(); let i=l.cz*GW+l.cx, n=0, bad=0, rows=new Set(); while(i>=0&&n<900){ const cx=i%GW, cz=(i/GW)|0; if(P.blocked(cx,cz)) bad++; rows.add(cz); const nx=ff.nxt[i]; if(nx<0||(cx===23&&cz===4)) break; i=nx; n++; } roads[k]={ len:n, bad }; }
  return { reach, roads, blockedCount:(()=>{ let c=0; for(let z=0;z<48;z++) for(let x=0;x<47;x++) if(P.blocked(x,z)) c++; return c; })(), info:P.info() }; });
check("every gate has a long road to the Heartroot, longer than before the rails: the rim gates 110+/100+, the middle feeder 50+, the lower one 24+ (build 389: the pit's east flight is near it)",R.reach.E>=110&&R.reach.S>=100&&R.reach.W>=50&&R.reach.NE>=24&&Math.max(...Object.values(R.reach))<260,JSON.stringify(R.reach));
check("the horde's road never touches a hero-only cell (none of the four roads crosses a railing line, a gate or the hero's stairs)",Object.keys(R.roads).length===6&&Object.values(R.roads).every(r=>r.bad===0&&r.len>20),JSON.stringify(R.roads));
check("the hero-only cells are what was drawn: 27 for his three stairs, two railing lines (26 + 16 cells; his gates are inside them) = 69",R.blockedCount===27+26+16,String(R.blockedCount));
// ---- the hero walks the road down the middle
const run=async(x,z,seconds)=>{ await page.evaluate(({x,z,seconds})=>{ const d=window.__dd; d.S.phase='build'; d.setHero(x,z,Math.PI); for(let i=0;i<8;i++) d.step(1/60,1); d.setKeys({w:true}); const frames=Math.round(seconds*60); window.__trace=[]; for(let f=0;f<frames;f++){ d.step(1/60,1); if(f%10===0){ const h=d.hero; window.__trace.push([+(h.x||0).toFixed(2),+(h.y||0).toFixed(2),+(h.z||0).toFixed(2)]); } } d.setKeys({w:false}); },{x,z,seconds}); return page.evaluate(()=>window.__trace); };
const cw=cx=>2*cx+1-47, cwz=cz=>2*cz+1-9;
// down the middle: from the middle terrace's south lane (row 32, col 23) forward for 9 seconds
const mid=await run(cw(23),cwz(32),9); const end=mid[mid.length-1];
check("the hero's road runs the whole hall down the middle: holding forward from the middle terrace's south lane he goes through the railing gate, down his stairs, through the next gate and down to the pit",end&&end[1]<.5&&end[2]<cwz(12),JSON.stringify({ end, ys:[...new Set(mid.map(p=>Math.round(p[1])))] }));
check("on the way he is seen on every level: 4 (middle), 2 (lower), 0 (the pit)",[0,2,4].every(y=>mid.some(p=>Math.round(p[1])===y)),JSON.stringify([...new Set(mid.map(p=>Math.round(p[1])))]));
check("he keeps to the road: his column never leaves the hero's three stairs and gates (x -3..3)",mid.every(p=>Math.abs(p[0])<=3.2),JSON.stringify(mid.map(p=>p[0]).filter(x=>Math.abs(x)>3.2).slice(0,5)));
// elsewhere along the rail he is stopped
const stop=await run(cw(17),cwz(32),4); const sEnd=stop[stop.length-1];
check("elsewhere along the railing he is stopped by it: walking north from the south lane at column 17 he comes to rest south of the rail (row 29 is z 49-51)",sEnd[2]>=50.2&&sEnd[2]<=52.5&&Math.abs(sEnd[1]-4)<.3,JSON.stringify(sEnd));
// ---- a mob chasing the hero will not use his gate
const chase=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) e.dead=e.dead||.001; d.S.crystal=1e6; d.S.phase='wave'; d.spawn('goblin','W'); const e=d.enemies[d.enemies.length-1]; e.hp=e.max=1e9;
  const cw=cx=>2*cx+1-47, cwz=cz=>2*cz+1-9; e.x=cw(23); e.z=cwz(31); e.y=4; d.setHero(cw(23),cwz(27),Math.PI); let minZ=1e9, onBlock=0; for(let f=0;f<240;f++){ d.step(1/60,1); d.S.crystal=1e6; d.setHero(cw(23),cwz(27),Math.PI); minZ=Math.min(minZ,e.z); if(window.__prisonpaths.blocked(Math.floor((e.x+47)/2),Math.floor((e.z+9)/2))) onBlock++; } return { minZ:+minZ.toFixed(2), z:+e.z.toFixed(2), onBlock }; });
check("a walker chasing the hero will not use his gate: with the hero just north of it the goblin stays south of the railing line (z>=51) and never stands on a hero-only cell",chase.minZ>=50.9&&chase.onBlock===0,JSON.stringify(chase));
// real walkers from the rim: never on a hero-only cell
const march=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) e.dead=e.dead||.001; d.setHero(0,6,Math.PI); d.S.crystal=1e6; d.S.phase='wave'; const mk=[]; for(const L of ['E','S','W','NE','ME','LW']){ d.spawn('goblin',L); const e=d.enemies[d.enemies.length-1]; e.hp=e.max=1e9; mk.push(e); }
  let onBlock=0, frames=0; const near=[1e9,1e9,1e9,1e9,1e9,1e9]; for(let f=0;f<14000;f++){ d.step(1/60,1); d.S.crystal=1e6; frames++; mk.forEach((e,i)=>{ if(window.__prisonpaths.blocked(Math.floor((e.x+47)/2),Math.floor((e.z+9)/2))) onBlock++; near[i]=Math.min(near[i],Math.hypot(e.x-0,e.z-(2*4+1-9))); }); if(near.every(n=>n<4.5)) break; }
  return { onBlock, frames, near:near.map(n=>+n.toFixed(1)) }; });
check("walkers from all four gates come the long way to the Heartroot and not one of them ever stands on a hero-only cell",march.onBlock===0&&march.near.every(n=>n<=4.5),JSON.stringify(march));
// a siege cart (a big hull: its collision circle is under a cell's half-width, so the five-wide flights and the lanes take it) goes the whole way from the rim strip to the Heartroot
const cart=await page.evaluate(async()=>{ const d=window.__dd; await window.__carts.load('kegcart'); for(const e of d.enemies) e.dead=e.dead||.001; d.setHero(0,6,Math.PI); d.S.crystal=1e6; d.S.phase='wave'; d.spawn('kegcart','S'); const c=d.enemies.filter(e=>e.kind==='kegcart'&&!e.dead).pop(); const crew=d.enemies.filter(e=>e.pushFor===c); c.hp=c.max=1e9; crew.forEach(o=>{ o.hp=o.max=1e9; });
  const z=2*41+1-9; c.x=9; c.z=z; c.y=6; crew.forEach((o,i)=>{ o.x=9+(i?.8:-.8); o.z=z+1.4; o.y=6; }); let near=1e9, f=0; const ys=new Set(); for(;f<24000;f++){ d.step(1/60,1); d.S.crystal=1e6; near=Math.min(near,Math.hypot(c.x,c.z-(2*4+1-9))); ys.add(Math.round(c.y||0)); if(near<5) break; } return { secs:Math.round(f/60), near:+near.toFixed(1), levels:[...ys].sort().join(',') }; });
check('a siege cart (the big hull) goes the whole way down the new roads, from the rim strip to the Heartroot, over every level, in under four minutes',cart.near<=5&&cart.secs<240&&['0','2','4','6'].every(y=>cart.levels.split(',').includes(y)),JSON.stringify(cart));
// ---- build 389: the pit's second flight (east), and the horde split between the two
const SP=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) e.dead=e.dead||.001; d.setHero(-30,60,0); d.S.crystal=1e9; d.S.phase='wave'; const cw=x=>2*x+1-47, cwz=z=>2*z+1-9; const mobs=[];
  for(let i=0;i<40;i++){ d.spawn('goblin','NE'); const g=d.enemies[d.enemies.length-1]; g.hp=g.max=1e9; g.x=cw(31)+(i%4)*.6; g.z=cwz(21)+((i/4)|0)*.4; g.y=2; mobs.push(g); }
  const W=new Set(), E=new Set(); for(let f=0;f<60*30;f++){ d.step(1/60,1); d.S.crystal=1e9; for(const g of mobs){ if(g.dead||W.has(g)||E.has(g)) continue; const cx=Math.floor((g.x+47)/2), cz=Math.floor((g.z+9)/2); if(cz<=12){ if(cx<=21) W.add(g); else if(cx>=25) E.add(g); } } }
  return { west:W.size, east:E.size, ramp:+d.floorH(cw(28),cwz(14)).toFixed(2), split:window.__prisonpaths.split() }; });
check("the pit has a second flight at the east (the other side of the hero's stairs), and forty goblins coming round the lower terrace split between the two (neither carries less than a third of them)",SP.ramp>0&&SP.ramp<2&&SP.west>=13&&SP.east>=13&&SP.west+SP.east>=36,JSON.stringify(SP));
// ---- towers
const T=await page.evaluate(()=>{ const d=window.__dd; d.S.mana=99999; d.S.du=0; const out={}; const tryPlace=(name,cx,cz)=>{ const r=d.place('harpoon',cx,cz,0); out[name]=!!r; if(r){ out[name+'Base']=r.base!==undefined?r.base:null; } return r; };
  const defsOf=()=>d.defs;
  tryPlace('gate',23,29); tryPlace('stairs',23,25); tryPlace('rail',15,29); tryPlace('lower',23,18); tryPlace('beside',15,30); tryPlace('lip',30,35); tryPlace('free',30,31);
  const lip=d.defs.find(x=>x.cx===30&&x.cz===35); return Object.assign(out,{ lipBase:lip?lip.base:null }); });
check("a tower cannot be set on a hero-only cell or a rail (the gate, his stairs, a railing cell, the lower gate) -- and can be set beside them",!T.gate&&!T.stairs&&!T.rail&&!T.lower&&T.beside&&T.free,JSON.stringify(T));
check("a tower on a cliff lip is not lifted by the rail there (it stands on the floor: 6)",T.lip&&T.lipBase===6,JSON.stringify({ lip:T.lip, base:T.lipBase }));
// ---- the railing itself
const V=await page.evaluate(()=>{ const P=window.__prisonpaths, d=window.__dd; d.setHero(0,50,Math.PI); d.setCam(Math.PI,.5,12); for(let i=0;i<10;i++) d.step(1/60,1); P.refill(); const info=P.info(); const m=P.mesh; const pcs=P.pieces(); const rails=d.rails().length; let tris=m?m.geometry.index.count/3:0; return { info, tris, count:m?m.count:-1, rails, hasMap:!!(m&&m.material.map), lowest:Math.min(...pcs.map(p=>p.y)), kinds:pcs.reduce((o,p)=>{ o[p.kind]=(o[p.kind]||0)+1; return o; },{}) }; });
check("Matt's railing is in: the model loaded as ONE instanced mesh with its picture, about a thousand triangles a piece, a hundred or so pieces in all (36 on the railing lines, the rest along every drop), one collision box each",V.info.loaded===1&&V.hasMap&&V.tris>800&&V.tris<1400&&V.info.pieces>=90&&V.info.pieces<=160&&V.kinds.wall===36&&V.kinds.lip>=40&&V.kinds.side>=12&&V.rails>=V.info.pieces,JSON.stringify({ tris:V.tris, kinds:V.kinds, rails:V.rails, info:V.info }));
check("only the pieces near the camera are drawn (the rest are skipped): from the middle terrace some, but not all of them",V.count>10&&V.count<V.info.pieces,JSON.stringify({ drawn:V.count, all:V.info.pieces }));
check("no page errors, no railing model warnings",errors.length===0&&warns.length===0,JSON.stringify({ errors:errors.slice(0,3), warns:warns.slice(0,3) }));
console.log(`${results.filter(Boolean).length}/${results.length} passed`); await browser.close(); server.close(); process.exit(results.every(Boolean)?0:1);
