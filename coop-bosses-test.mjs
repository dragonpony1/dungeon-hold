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
  await p.waitForFunction(()=>window.__dd&&window.__net&&window.__party&&window.__mobsync&&window.__pigbosses&&window.__archhag,null,{timeout:90000});
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

// ================= (4) the Archer's Perch: a guest climbs it too (build 376) =================
{ const H=await open(0), G=await open(0); await sleep(4300);
  const c=await connect(H,G,'perch'); check('host and guest connect (the perch)',!c.hostOpen.err&&!c.join.err,JSON.stringify(c));
  const placed=await H.evaluate(()=>{ const d=window.__dd; window.__heroes.select('troll'); d.addMana(5000); d.setHero(8,10,0); d.step(1/60,3); const p=d.place('perch',12,14,0); return p?{x:p.x,z:p.z,base:p.base}:null; });
  check("the host places an Archer's Perch",!!placed,JSON.stringify(placed));
  const got=await tickUntil([H,G],G,()=>window.__dd.rails().length>=3?window.__dd.rails().length:null,null,120,3);
  check('the guest builds the perch footholds too (three boxes in its own world)',got===3,String(got));
  const wearing=await tickUntil([H,G],G,id=>{ const p=window.__party.get(id); return p&&p.glb==='ranger.glb'?p.glb:null; },c.hostOpen.id,150,3);
  check("the host is the Gnome Ranger: the guest's puppet of the host wears ranger.glb, not the retired troll.glb",wearing==='ranger.glb',String(wearing));
  const drop=(dx,dz)=>G.evaluate(({dx,dz,placed})=>{ const d=window.__dd, Hh=d.hero; Hh.x=placed.x+dx; Hh.z=placed.z+dz; Hh.y=placed.base+4.2; Hh.vy=0; Hh.grounded=false; for(let i=0;i<120;i++){ Hh.x=placed.x+dx; Hh.z=placed.z+dz; d.step(1/60,1); } return +(Hh.y-placed.base).toFixed(2); },{dx,dz,placed});
  const [f,r,k,off]=[await drop(.05,1.15),await drop(1.15,.05),await drop(-.3,-.3),await drop(-1.4,0)];
  check('a GUEST dropped onto the front step stands at 1.47, the right step 2.06, the deck 2.5 (it fell through before), and off the back falls to the ground',Math.abs(f-1.47)<.05&&Math.abs(r-2.06)<.05&&Math.abs(k-2.5)<.05&&off<.1,JSON.stringify({f,r,k,off}));
  await H.evaluate(()=>{ const d=window.__dd; const p=d.defs.find(x=>x.kind==='perch'); d.defs.splice(d.defs.indexOf(p),1); });
  const gone=await tickUntil([H,G],G,()=>window.__dd.rails().length===0?1:null,null,120,3);
  check('and the footholds go when the perch does',!!gone);
  await H.context().close(); await G.context().close(); }

// ================= (5) a tower's shot: the ballista's bolt shows on the guest's screen (build 376) =================
{ const H=await open(0), G=await open(0); await sleep(4300);
  const c=await connect(H,G,'shots'); check('host and guest connect (the shots)',!c.hostOpen.err&&!c.join.err,JSON.stringify(c));
  await H.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) e.dead=e.dead||.001; d.S.mana=99999; d.S.du=0; d.S.phase='wave'; d.S.crystal=1e6; const tw=d.placeDefAt('harpoon',6,-6,0); tw.hp=tw.max=1e6; d.spawn('goblin','N'); const g=d.enemies[d.enemies.length-1]; g.hp=g.max=1e9; g.x=6; g.z=1; g.y=0; g.spd=0; g.dmg=0; g.atk=999; });
  const sent=await tickUntil([H,G],H,()=>window.__shotsync.sent()>0?window.__shotsync.sent():null,null,200,2);
  check('the ballista fires and the host says so',!!sent,String(sent));
  const sawBolt=await tickUntil([H,G],G,()=>window.__shotsync.cosmetic()>0?window.__shotsync.cosmetic():null,null,200,1);
  const seen=await G.evaluate(()=>window.__shotsync.seen());
  check("the guest flies the bolt on its own screen (a projectile there, with no damage of its own)",!!sawBolt&&seen>0,JSON.stringify({sawBolt,seen}));
  const moved=await G.evaluate(()=>{ const d=window.__dd; const p=window.__shotsync; return p.cosmetic(); });
  check('and it is gone again once it has flown (not left hanging)',(await tickUntil([H,G],G,()=>window.__shotsync.cosmetic()===0?1:null,null,200,3))===1,String(moved));
  // the heroes' own shots: a bolt and an arrow the host fires are flown on the guest's screen too
  const hb=await H.evaluate(()=>{ const T=window.THREE; window.__staff.fireBolt('hazel',new T.Vector3(0,2,0),new T.Vector3(0,0,1),22,{life:1.5,dmg:3}); window.__bow.fireArrow('ash',new T.Vector3(2,2,0),new T.Vector3(0,0,1),30,{life:1.2,dmg:3}); return { bolts:window.__staff.bolts(), arrows:window.__bow.arrows() }; });
  const gb=await tickUntil([H,G],G,()=>window.__staff.bolts()>0&&window.__bow.arrows()>0?{ bolts:window.__staff.bolts(), arrows:window.__bow.arrows() }:null,null,60,1);
  check("a bolt and an arrow the host fires are flown on the guest's screen too",hb.bolts>0&&!!gb,JSON.stringify({ hb, gb }));
  // a drake beats its wings on the guest's screen
  await H.evaluate(()=>{ const d=window.__dd; d.spawn('drake','N'); const e=d.enemies.filter(x=>x.kind==='drake'&&!x.dead).pop(); e.hp=e.max=1e9; });
  const wings=[]; for(let i=0;i<6;i++){ await tick([H,G],1,4); wings.push(await G.evaluate(()=>{ const id=window.__mobsync.list().find(i=>window.__mobsync.get(i).kind==='drake'); return id?window.__mobsync.get(id).wing:null; })); }
  check("a drake's wings beat on the guest's screen (the wing hinge turns from tick to tick)",wings.filter(w=>w!==null).length>=4&&new Set(wings.filter(w=>w!==null)).size>=3,JSON.stringify(wings));
  // the Archhag's GROW: a mob made twice the size on the host is twice the size on the guest's screen
  const grown=await H.evaluate(()=>{ const d=window.__dd; d.spawn('orc','N'); const e=d.enemies.filter(x=>x.kind==='orc'&&!x.dead).pop(); e.hp=e.max=1e9; e.gBase={sc:e.sc,r:e.r,h:e.h}; e.sc*=2; e.big=true; return { id:e.__coopId||null, sc:e.sc }; });
  const gs=await tickUntil([H,G],G,()=>{ const ps=window.__mobsync.list().map(id=>window.__mobsync.get(id)).filter(p=>p.kind==='orc'); return ps.length&&ps.some(p=>p.scale>1.8)?ps.map(p=>p.scale):null; },null,150,3);
  check("a mob the Archhag has GROWN (twice the size on the host) is twice the size on the guest's screen too",!!gs,JSON.stringify(gs));
  await H.context().close(); await G.context().close(); }

// ================= (6) the Archhag on the Cloister Court: a guest sees her, not a wooden doll (build 376) =================
{ const H=await open(2), G=await open(2); await sleep(4300);
  const c=await connect(H,G,'hag'); check('host and guest connect (the Cloister Court)',!c.hostOpen.err&&!c.join.err,JSON.stringify(c));
  await H.evaluate(async()=>{ const d=window.__dd; for(const e of d.enemies) e.dead=e.dead||.001; await window.__archhag.ensure(); d.S.phase='wave'; d.S.crystal=d.S.crystal2=1e6; window.__archhag.spawn(); });
  const real=await tickUntil([H,G],G,()=>{ const ps=window.__mobsync.list().map(id=>window.__mobsync.get(id)).filter(p=>p.kind==='archhag'); return ps.length&&ps.every(p=>p.glb&&!p.stand)?ps.length:null; },null,900,3);
  const st=await G.evaluate(()=>window.__mobsync.list().map(id=>window.__mobsync.get(id)).filter(p=>p.kind==='archhag').map(p=>({kind:p.kind,glb:p.glb,stand:p.stand})));
  check('the guest asks for her model and she replaces the wooden mannequin on its screen',!!real,JSON.stringify(st));
  const bar=await tickUntil([H,G],G,()=>{ const el=document.getElementById('hagbar'); return el&&el.style.display==='block'?1:null; },null,150,3);
  check("and her boss bar shows on the guest's screen",!!bar);
  // the garden wakes: the topiaries come off their pedestals on the guest's screen too
  const woke=await H.evaluate(()=>window.__archhag.wake());
  const topi=await tickUntil([H,G],G,()=>{ const ps=window.__mobsync.list().map(id=>window.__mobsync.get(id)).filter(p=>/^topiary-/.test(p.kind)); return ps.length>=3?ps.map(p=>({kind:p.kind,x:p.x,z:p.z})):null; },null,300,3);
  check('the topiaries the host woke arrive on the guest as puppets',woke>=3&&!!topi,JSON.stringify({ woke, n:topi&&topi.length }));
  const stones=await tickUntil([H,G],G,()=>window.__archhag.plinths()>=3?window.__archhag.plinths():null,null,200,3);
  check("and the garden's own figures come off their stone on the guest's screen (no statue left standing beside its walking copy)",!!stones,String(stones));
  const mv=await G.evaluate(()=>window.__mobsync.list().map(id=>window.__mobsync.get(id)).filter(p=>/^topiary-/.test(p.kind)).map(p=>[p.x,p.z]));
  await tick([H,G],40,5);
  const mv2=await G.evaluate(()=>window.__mobsync.list().map(id=>window.__mobsync.get(id)).filter(p=>/^topiary-/.test(p.kind)).map(p=>[p.x,p.z]));
  check('and they MOVE there (the puppets walk, they do not stand on the spot)',mv.length>0&&mv2.some((q,i)=>mv[i]&&Math.hypot(q[0]-mv[i][0],q[1]-mv[i][1])>1),JSON.stringify({ a:mv.slice(0,2), b:mv2.slice(0,2) }));
  await H.context().close(); await G.context().close(); }

// ================= (7) a guest sets a ballista on a perch (build 381) =================
{ const H=await open(0), G=await open(0); await sleep(4300);
  const c=await connect(H,G,'stack'); check('host and guest connect (ballista on a perch)',!c.hostOpen.err&&!c.join.err,JSON.stringify(c));
  const perch=await H.evaluate(async()=>{ const d=window.__dd; await window.__heroes.select('troll'); d.addMana(5000); d.setHero(0,8,Math.PI); d.step(1/60,3); const p=d.place('perch',16,24,0); d.step(1/60,2); return p?{x:p.x,z:p.z}:null; });
  await tickUntil([H,G],G,()=>window.__defsync&&window.__defsync.list().length>0?1:null,null,150,3);
  await G.evaluate(({perch})=>{ window.__net.send('place',{ kind:'harpoon', x:perch.x+.3, z:perch.z-.2, yaw:0 }); },{perch});
  const got=await tickUntil([H,G],H,()=>{ const t=window.__dd.defs.find(x=>x.kind==='harpoon'); return t?{ base:t.base, onSurf:!!t.onSurf, cells:t.cells.length }:null; },null,150,3);
  check("the co-op host lets a guest set a ballista on a free perch (it stands on the deck, 2.5 up)",!!got&&Math.abs(got.base-2.5)<.05&&got.onSurf&&got.cells===0,JSON.stringify(got));
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
