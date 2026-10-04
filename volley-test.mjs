// ===== THE RANGER'S VOLLEY IN MATT'S ARROW ART (build 533 prep; parts/staging/73b-volleyfx.js, 73-specials.js, parts/assets/volley-rain.glb).
// Matt: "so these are to inhance the rangers secondary skill i was hoping you could at a little color and effect".
// Checked: holding the special shows the ring of arrows over the aimed spot (the landing ring's own spot) with a rune circle under it, both glowing brighter as the charge fills; the release plays
// Matt's arrow rain at that spot, all 32 arrows landing (each an impact) inside the volley's second; the damage is the old volley's to the decimal (15 waves of a fifth of 3x heroDmg()); repeat
// volleys build nothing new once warm (pools, scene children, geometries, textures, programs); the colour is the bow's (plain green, the Ice set's, the Fire set's); in co-op the partner sees the
// charge and the rain at the right spot in the caster's colour (guest -> host and host -> guest); no page errors. Prints the draw calls a volley adds.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer=null; try { ({ PeerServer } = await import("peer")); } catch(e) {}
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=9783, SIG=9784; const server=await serve(PORT,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const newPage=async()=>{ const ctx=await browser.newContext({viewport:{width:1100,height:700}}); await ctx.route(/\/api\//,r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
  const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
  await p.goto("http://127.0.0.1:"+PORT+"/?silent&ownweapons&nogate",{timeout:240000}); await p.waitForFunction(()=>window.__dd&&window.__rshots&&window.__mythic&&window.__meta&&window.__volleyfx&&window.__specials&&window.__dd.heroModel(),null,{timeout:240000});
  await p.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,3); window.__freeze=true; window.__meta.setLevel&&window.__meta.setLevel(40); d.S.phase='build'; });
  return p; };
const pick=(p,id)=>p.evaluate(async id=>{ await window.__heroes.select(id); const want={knight:'Knight',witch:'Witch',fighter:'Fighter',troll:'Ranger'}[id]; for(let i=0;i<600;i++){ window.__dd.step(1/60,1); const m=window.__dd.heroModel(), s=window.__weapons.state(); if(m&&m.label.includes(want)&&s.mounted&&s.key.includes(want)) return m.label; await new Promise(r=>setTimeout(r,50)); } return null; },id);
const wear=(p,opt)=>p.evaluate(async opt=>{ const d=window.__dd, M=window.__meta, N=window.__mythic, W=window.__weapons;
  const it=opt&&opt.set?N.normalize({tier:'mythic',slot:'weapon',set:opt.set,art:'bow',name:opt.name,lvl:20,rarity:5,stats:{dmg:11}}):(()=>{ const x=d.rollItem(1,'weapon',1); delete x.look; delete x.setId; x.rarity=1; x.lvl=1; x.tier=1; return x; })();
  M.giveItem(it); M.equip(it.id); const want=W.heldFor(it); let m=null; for(let i=0;i<600;i++){ d.step(1/60,1); m=W.mounted(); if(m&&m.parent&&m.name===want) break; await new Promise(r=>setTimeout(r,30)); } d.hero.swingT=-1; d.step(1/60,10);
  return { want, held:m&&m.name, kind:m&&m.userData.kind, col:window.__volleyfx.col() }; },opt);
const ready=p=>p.evaluate(async()=>{ window.__volleyfx.load(); for(let i=0;i<600;i++){ window.__dd.step(1/60,1); if(window.__volleyfx.ready()) return true; await new Promise(r=>setTimeout(r,50)); } return window.__volleyfx.error()||false; });
// an open lane: the hero at its start, three goblins 10 ahead (the aim locks the middle one: the volley's spot)
const LANE=p=>p.evaluate(len=>{ const R=window.__rshots; const ok=(x,z,dx,dz)=>{ const f0=R.floor(x,z); for(let s=-1;s<=len;s+=.5){ const px=x+dx*s, pz=z+dz*s; if(R.wallAt(px,pz)||Math.abs(R.floor(px,pz)-f0)>.3) return false; for(const o of [-3.5,3.5]){ if(R.wallAt(px+dz*o,pz-dx*o)||Math.abs(R.floor(px+dz*o,pz-dx*o)-f0)>.3) return false; } } return true; };
  for(let x=-30;x<=30;x+=2) for(let z=-30;z<=30;z+=2) for(const [dx,dz,yaw] of [[0,1,0],[1,0,Math.PI/2],[0,-1,Math.PI],[-1,0,-Math.PI/2]]) if(ok(x,z,dx,dz)) return {x:x+dx*4,z:z+dz*4,dx,dz,yaw}; return null; },16);
const stage=(p,L)=>p.evaluate(L=>{ const d=window.__dd, S=window.__specials; for(const e of d.enemies) d.kill(e); d.step(1/60,3); S.forceReady(); d.setHero(L.x,L.z,L.yaw); d.hero.y=window.__rshots.floor(L.x,L.z); d.setCam(L.yaw,.42,8); d.step(1/60,20);
  window.__mobs=[[10,0],[10.8,1.2],[9.4,-1.3]].map(([s,o])=>{ const e=d.spawn('goblin','N'); e.x=L.x+L.dx*s+L.dz*o; e.z=L.z+L.dz*s-L.dx*o; e.y=window.__rshots.floor(e.x,e.z); e.spd=0; e.hp=e.max=50000; e.dmg=0; e.atk=0; return e; }); window.__mobsAt=window.__mobs.map(e=>[e.x,e.z]); d.step(1/60,2); return true; },L);
const page=await newPage();
check("the Ranger loads",!!await pick(page,'troll'));
check("Matt's arrow-volley model loads (parts/assets/volley-rain.glb) with its clip and pieces",(await ready(page))===true&&await page.evaluate(()=>{ const i=window.__volleyfx.info(); return i.arrowsN===32&&i.rocksN===161&&i.dustN===192&&i.lastLand>3&&i.lastLand<3.7; }),JSON.stringify(await page.evaluate(()=>{ const i=window.__volleyfx.info(); return { arrowsN:i.arrowsN, rocksN:i.rocksN, dustN:i.dustN, lastLand:i.lastLand, err:window.__volleyfx.error() }; })));
const W0=await wear(page,null); const L=await LANE(page); check("an open lane to cast down",!!L,JSON.stringify(L));
// ---------------------------------------------------------------- 1. the charge
await stage(page,L);
const CH=await page.evaluate(()=>{ const d=window.__dd, S=window.__specials, V=window.__volleyfx; S.press(); d.step(1/60,30); const a=V.info().charge, ra=S.ring(); d.step(1/60,30); const b=V.info().charge, rb=S.ring(); return { a, b, ra, rb, charging:S.charging() }; });
const ca=CH.a[0]||{}, cb=CH.b[0]||{};
check("charging: the ring of arrows is up (in the scene), over the aimed spot -- the landing ring's own spot -- at the volley's radius",CH.a.length===1&&ca.key==='local'&&ca.inScene&&Math.hypot(ca.x-CH.ra.x,ca.z-CH.ra.z)<.05&&ca.R===2.5&&CH.ra.visible,JSON.stringify({ca,ring:CH.ra}));
check("it glows brighter as the charge fills (the arrows' glow and the rune circle both climb)",cb.k>ca.k+.3&&cb.emissive>ca.emissive+.3&&cb.rune>ca.rune,JSON.stringify({half:{k:ca.k,em:ca.emissive,rune:ca.rune},full:{k:cb.k,em:cb.emissive,rune:cb.rune}}));
check("in the bow's colour (a plain bow: the Ranger's green)",ca.col===0x9be06a&&W0.col===0x9be06a,JSON.stringify({col:ca.col,W0}));
// ---------------------------------------------------------------- 2. the release: the rain at the spot, its impacts, and the old volley's damage
const RA=await page.evaluate(async()=>{ const d=window.__dd, S=window.__specials, V=window.__volleyfx; const keep=()=>(window.__mobs||[]).forEach((e,i)=>{ e.x=window.__mobsAt[i][0]; e.z=window.__mobsAt[i][1]; });
  const spot=S.ring(); const hp0=window.__mobs.map(e=>e.hp); const dmg=Math.round(d.heroDmg()*3*10)/10, per=Math.round(dmg/5*10)/10; const imp0=V.info().impacts;
  let fired=null, t=0; for(let i=0;i<80&&!fired;i++){ d.step(1/60,1); keep(); t++; if(!S.charging()) fired=V.info(); }
  const q=S.volleyQ(); const mid=[]; for(let i=0;i<70;i++){ d.step(1/60,1); keep(); if(i%10===9) mid.push((({rain,points,streaks,parts,impacts})=>({ landed:rain[0]&&rain[0].landed, ct:rain[0]&&rain[0].ct, points, streaks, parts, impacts }))(V.info())); }
  const end=V.info(); const lost=window.__mobs.map((e,i)=>+(hp0[i]-e.hp).toFixed(1)); d.step(1/60,240); keep(); const gone=V.info();
  return { spot, fired, q, mid, end, lost, dmg, per, imp:end.impacts-imp0, gone:{ rainsLive:gone.rainsLive, chargesLive:gone.chargesLive, runesLive:gone.runesLive, parts:gone.parts, points:gone.points } }; });
const rf=(RA.fired&&RA.fired.rain[0])||{};
check("release: Matt's rain plays at the aimed spot, in the bow's colour, scaled to the 2.5 radius (his 2.1-wide landing x 1.19)",RA.fired&&RA.fired.rain.length===1&&Math.hypot(rf.x-RA.spot.x,rf.z-RA.spot.z)<.05&&rf.col===0x9be06a&&Math.abs(rf.S-2.5/2.1)<.01&&rf.arrowsVisible,JSON.stringify({rf,spot:RA.spot}));
check("the charge ring launches (flies up and fades) as the rain starts",RA.fired&&RA.fired.charge.length===1&&RA.fired.charge[0].launching,JSON.stringify(RA.fired&&RA.fired.charge));
check("all 32 arrows land inside the volley's ~1 s (each an impact: a flash, sparks, Matt's dust and debris), with streaks and glows while they fall",RA.end.rain[0]&&RA.end.rain[0].landed===32&&RA.imp===32&&RA.mid.some(m=>m.streaks>10)&&RA.mid.some(m=>m.parts>50)&&RA.mid.findIndex(m=>m.landed===32)<=5,JSON.stringify(RA.mid));
check("the damage is the old volley's exactly: 15 waves of a fifth of 3x heroDmg() on the spot's goblins",RA.q>=13&&RA.q<=15&&RA.lost.every(v=>Math.abs(v-15*RA.per)<.05),JSON.stringify({lost:RA.lost,per:RA.per,dmg:RA.dmg,waves:RA.q}));
check("the camera shook on the big impacts (the caster is near)",RA.end.shakes>=3,JSON.stringify({shakes:RA.end.shakes}));
check("when it is over nothing is left showing (the rain, the ring, the runes and every glow back in their pools)",RA.gone.rainsLive===0&&RA.gone.chargesLive===0&&RA.gone.runesLive===0&&RA.gone.parts===0&&RA.gone.points===0,JSON.stringify(RA.gone));
// ---------------------------------------------------------------- 3. pooled: repeat volleys build nothing new
const POOL=await page.evaluate(async()=>{ const d=window.__dd, S=window.__specials, V=window.__volleyfx, R=d.renderer;
  const cast=(overlap)=>{ S.forceReady(); S.press(); for(let i=0;i<80&&S.charging();i++) d.step(1/60,1); d.step(1/60,overlap?30:300); };
  const snap=()=>{ const i=V.info(); d.renderer.render(d.scene,d.camera); return { rainsPool:i.rainsPool, chargesPool:i.chargesPool, runesPool:i.runesPool, rainsMade:i.rainsMade, chargesMade:i.chargesMade, runesMade:i.runesMade, kids:d.scene.children.length, geo:R.info.memory.geometries, tex:R.info.memory.textures, progs:R.info.programs.length }; };
  cast(true); cast(false); d.step(1/60,200); const a=snap(); for(let k=0;k<4;k++) cast(k%2===0); d.step(1/60,300); const b=snap(); return { a, b }; });
check("pooled: four more volleys (two overlapping the last) build no new rain, ring, rune, scene child, geometry, texture or shader",JSON.stringify(POOL.a)===JSON.stringify(POOL.b),JSON.stringify(POOL));
// ---------------------------------------------------------------- 4. draw calls (reported)
const DC=await page.evaluate(()=>{ const d=window.__dd, S=window.__specials, R=d.renderer; const calls=()=>{ R.render(d.scene,d.camera); return R.info.render.calls; };
  S.forceReady(); d.step(1/60,5); const base=calls(); S.press(); d.step(1/60,50); const charge=calls(); for(let i=0;i<80&&S.charging();i++) d.step(1/60,1); d.step(1/60,20); const rain=calls(); d.step(1/60,300); return { base, charge:charge-base, rain:rain-base }; });
console.log("      draw calls: idle "+DC.base+", charging +"+DC.charge+", mid-rain +"+DC.rain);
check("a volley costs only a handful of draw calls (its 386 pieces drawn as instances)",DC.charge<=10&&DC.rain<=12,JSON.stringify(DC));
// ---------------------------------------------------------------- 5. the colour follows the bow's set
const COL={};
for(const [k,opt,want] of [['ice',{set:'ice',name:'Mythic Bow of Ice'},0x8ae8ff],['fire',{set:'lava',name:'Mythic Bow of Fire'},0xff7a2a]]){ const w=await wear(page,opt); await stage(page,L);
  COL[k]=await page.evaluate(()=>{ const d=window.__dd, S=window.__specials, V=window.__volleyfx; S.press(); d.step(1/60,30); const c=V.info().charge[0]; for(let i=0;i<80&&S.charging();i++) d.step(1/60,1); d.step(1/60,5); const r=V.info().rain[0]; d.step(1/60,300); return { charge:c&&c.col, rain:r&&r.col, bar:S.ring().on }; });
  COL[k].want=want; COL[k].held=w.held; }
check("the colour follows the bow's set: an Ice bow's charge and rain are the Ice set's colour, a Fire bow's the Fire set's",COL.ice.charge===0x8ae8ff&&COL.ice.rain===0x8ae8ff&&COL.fire.charge===0xff7a2a&&COL.fire.rain===0xff7a2a,JSON.stringify(COL));
// ---------------------------------------------------------------- 6. co-op: the partner sees the charge and the rain
if(!PeerServer){ console.log("SKIP co-op part -- the `peer` package isn't installed"); }
else {
  const sig=PeerServer({ port:SIG, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>setTimeout(r,300)); const peerOpts={ host:"127.0.0.1", port:SIG, path:"/peerjs" };
  const host=await newPage(), guest=await newPage();
  const room="volley-"+Math.random().toString(36).slice(2,8);
  const ho=await host.evaluate(({room,peerOpts})=>new Promise(res=>window.__net.host(room,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{room,peerOpts});
  const gj=await guest.evaluate(({room,peerOpts})=>new Promise(res=>window.__net.join(room,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{room,peerOpts});
  check("co-op: host and guest connect",!ho.err&&!gj.err,JSON.stringify({ho,gj}));
  const tickBoth=async(n)=>{ for(let i=0;i<n;i++){ await host.evaluate(()=>window.__dd.step(1/60,2)); await guest.evaluate(()=>window.__dd.step(1/60,2)); await new Promise(r=>setTimeout(r,8)); } };
  await tickBoth(20);
  // (a) the guest's Ranger (an Ice bow) charges and looses: the host (a Knight, who never fetched the model himself) sees both
  await pick(guest,'troll'); const gw=await wear(guest,{set:'ice',name:'Mythic Bow of Ice'}); await ready(guest);
  const hostReadyBefore=await host.evaluate(()=>window.__volleyfx.ready());
  const gsp=await guest.evaluate(()=>{ const d=window.__dd, S=window.__specials; S.forceReady(); d.setCam(d.hero.yaw,.42,8); S.press(); d.step(1/60,2); return S.ring(); });
  let seen=null; for(let i=0;i<30&&!seen;i++){ await host.evaluate(()=>window.__dd.step(1/60,1)); await guest.evaluate(()=>{ if(window.__specials.charging()&&window.__specials.chargeT()<1.0) window.__dd.step(1/60,1); }); await new Promise(r=>setTimeout(r,60)); seen=await host.evaluate(()=>window.__volleyfx.info().charge.find(c=>/^net:/.test(c.key))||null); }
  await guest.evaluate(()=>{ const d=window.__dd; d.step(1/60,1); });
  check("co-op: the host sees the guest's charging ring over the guest's aimed spot, in the guest's Ice colour (and fetched the model for it)",!hostReadyBefore&&seen&&Math.hypot(seen.x-gsp.x,seen.z-gsp.z)<.1&&seen.col===0x8ae8ff,JSON.stringify({hostReadyBefore,seen,gsp,gw}));
  await guest.evaluate(()=>{ const d=window.__dd, S=window.__specials; for(let i=0;i<90&&S.charging();i++) d.step(1/60,1); });
  let hr=null; for(let i=0;i<40&&!hr;i++){ await tickBoth(1); await new Promise(r=>setTimeout(r,40)); hr=await host.evaluate(()=>window.__volleyfx.info().rain[0]||null); }
  check("co-op: the host sees the guest's arrow rain land at the guest's spot, in the Ice colour",hr&&Math.hypot(hr.x-gsp.x,hr.z-gsp.z)<.1&&hr.col===0x8ae8ff,JSON.stringify({hr,gsp}));
  await tickBoth(120);
  // (b) the host's Ranger (plain bow) looses: the guest sees the charge and the rain
  await pick(host,'troll'); await wear(host,null); await ready(host);
  const hsp=await host.evaluate(()=>{ const d=window.__dd, S=window.__specials; S.forceReady(); d.setCam(d.hero.yaw,.42,8); S.press(); d.step(1/60,2); return S.ring(); });
  let gseen=null; for(let i=0;i<30&&!gseen;i++){ await guest.evaluate(()=>window.__dd.step(1/60,1)); await host.evaluate(()=>{ if(window.__specials.charging()&&window.__specials.chargeT()<1.0) window.__dd.step(1/60,1); }); await new Promise(r=>setTimeout(r,60)); gseen=await guest.evaluate(()=>window.__volleyfx.info().charge.find(c=>/^net:/.test(c.key))||null); }
  await host.evaluate(()=>{ const d=window.__dd, S=window.__specials; for(let i=0;i<90&&S.charging();i++) d.step(1/60,1); });
  let gr=null; for(let i=0;i<40&&!gr;i++){ await tickBoth(1); await new Promise(r=>setTimeout(r,40)); gr=await guest.evaluate(()=>window.__volleyfx.info().rain[0]||null); }
  check("co-op: the guest sees the host's charging ring and then the rain at the host's spot, in the host's green",gseen&&Math.hypot(gseen.x-hsp.x,gseen.z-hsp.z)<.1&&gseen.col===0x9be06a&&gr&&Math.hypot(gr.x-hsp.x,gr.z-hsp.z)<.1&&gr.col===0x9be06a,JSON.stringify({gseen,gr,hsp}));
  await tickBoth(100);
  const gone=await guest.evaluate(()=>{ const i=window.__volleyfx.info(); return { charges:i.chargesLive, rains:i.rainsLive }; });
  check("co-op: and it clears off the partner's screen afterwards",gone.charges===0&&gone.rains===0,JSON.stringify(gone));
  try{ sig.close&&sig.close(); }catch(e){}
}
const real=errors.filter(e=>!/Failed to load resource|favicon|pointer ?lock/i.test(e));
check("no page errors",real.length===0,real.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.some(r=>!r)?1:0);
