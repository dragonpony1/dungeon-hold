// ===== THE BUFF BAR (build 527 prep; parts/staging/97j-buffbar.js). Matt: "when iam getting a buff from the talent tree and little icon in the top right" / "I am thinking specivically about vigil right now,
// how long do i need to stand still for my towers to be buffed, maybe that icone shows up when the buff is active".
// Checked: nothing on the title screen or with no talents; a Knight with Vigil standing still shows the dim charging chip (its ring filling), then the bright chip after ~1 s, gone once he moves; Aegis and Fury show
// with a countdown ring and leave when they run out; Last Stand under 35% health; a Ranger on a perch shows Eagle Eye; a Fighter's Halo Surge (ring) and Mending Light; a Witch's Doom with its kill count;
// Gabriel's BLITZ; the bar sits under the mini-map's wave strip at the right edge and moves up when M hides the map; hidden in a cut scene; a co-op GUEST's own Vigil and the Aegis the host catches for it show
// on the guest's bar (not the host's); no page errors. Screenshots: C:\Users\Matt\AppData\Local\Temp\buffbar-*.png
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const SHOTS="C:/Users/Matt/AppData/Local/Temp/";
const server=await serve(9571,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]}); const errors=[];
const PRESET={ troll:{rperch:1}, fighter:{fmend:1,fsurge:3}, witch:{doom:1} };
const page=await (await browser.newContext({viewport:{width:1280,height:760}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(t=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.removeItem("dd_minimap"); localStorage.setItem("dd_talents",JSON.stringify(t)); }catch(e){} },PRESET);
await page.goto("http://127.0.0.1:9571/?silent&ownweapons&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__talents&&window.__heroes&&window.__buffbar&&window.__minimap&&window.__dd.heroModel(),null,{timeout:120000});
const title=await page.evaluate(()=>({ shown:window.__buffbar.shown(), n:window.__buffbar.list().length }));
await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} await window.__heroes.select('knight'); d.start(); d.step(1/60,5); window.__meta.setLevel(40); d.addMana(99999); d.S.du=-80; d.S.crystal=1e9; });
await page.waitForFunction(()=>{ const w=window.__weapons&&window.__weapons.mounted(); return w&&!/^(staff|bow)-/.test(w.name); },null,{timeout:120000});
await page.evaluate(()=>{ window.__freeze=true; });
const B=`const d=window.__dd, T=window.__talents, h=d.hero, BB=window.__buffbar; const tk=()=>BB.tick(); const still=n=>{ for(let i=0;i<n;i++) d.step(1/60,1); tk(); };`;
const ev=(body)=>page.evaluate(new Function(`return (async()=>{ ${B} ${body} })()`));
// ---- no talents
const none=await ev(`d.setHero(0,8,0); h.hp=h.max; still(120); return { tree:T.tree(), spent:T.spent(), list:BB.list(), shown:BB.shown() };`);
check("nothing on the title screen; a Knight with no talents standing still 2 s shows no chips and no bar",!title.shown&&title.n===0&&none.spent===0&&none.list.length===0&&!none.shown,JSON.stringify({title,none}));
// ---- Vigil: charging, then on, then gone when he moves
const V=await ev(`for(const id of ['kward','kward','kward','kthorn','kthorn','kthorn','klong','ktrap','ktrap','ktrap','kvigil','kplate','kplate','kplate','kbash','kbash','kbash','kthorns','kstand','kstand','kstand','kaegis','kedge','kedge','kedge','ksweep','ksweep','ksweep','kbleed','kfury','kfury','kfury']) T.spend(id);
  d.placeDefAt('harpoon',h.x+3,h.z-2,0); for(let i=0;i<10;i++){ d.setHero(h.x+(i%2?.5:-.5),h.z,0); d.step(1/60,1); } tk(); const moving=BB.dom();
  still(33); const half=BB.dom(), halfT=T.timers().still; return { vigil:T.rank('kvigil'), moving, half, halfT, shown:BB.shown() };`);
const hv=V.half.find(c=>c.id==='kvigil');
check("Vigil bought; moving shows nothing; half a second standing still shows the DIM charging 👁 with its ring part-filled",V.vigil===1&&V.moving.length===0&&hv&&hv.ic==='👁'&&hv.chg&&hv.ring&&hv.p>.3&&hv.p<.8&&V.shown,JSON.stringify(V));
await page.screenshot({path:SHOTS+"buffbar-vigil-charging.png",clip:{x:1280-330,y:90,width:330,height:330}});
const V2=await ev(`still(42); const on=BB.dom(); return { on, vigil:T.timers().vigil, still:T.timers().still, pops:BB.counts().pops };`);
const ov=V2.on.find(c=>c.id==='kvigil');
check("...after ~1 s still it lights up: the bright 👁 (no ring), popped in with the gold glow, and the tip names it with its own chip line",V2.vigil&&ov&&!ov.chg&&!ov.ring&&V2.pops>=1&&/Vigil/.test(ov.tip)&&/stand still/.test(ov.tip),JSON.stringify(V2));
await page.waitForTimeout(250);
const V3=await ev(`for(let i=0;i<12;i++){ d.setHero(h.x+(i%2?.6:-.6),h.z,0); d.step(1/60,1); } tk(); return { list:BB.list(), vigil:T.timers().vigil };`);
check("...and once he moves the Vigil chip goes",!V3.vigil&&!V3.list.some(b=>b.id==='kvigil'),JSON.stringify(V3));
// ---- Aegis, Fury, Last Stand
const A=await ev(`d.setHero(0,8,0); h.yaw=0; h.hp=h.max*.6; T.hurtHero(h.max*.5); still(6); const a1=BB.dom().find(c=>c.id==='kaegis');
  d.spawn('goblin','N'); const g=d.enemies[d.enemies.length-1]; g.hp=1; g.max=50; g.spd=0; g.dmg=0; g.atk=1e9; g.x=h.x; g.z=h.z+1.5; g.y=h.y; g.mineT=d.S.t; T.cast(); still(6); const f1=BB.dom().find(c=>c.id==='kfury');
  still(60); const a2=BB.dom().find(c=>c.id==='kaegis'), f2=BB.dom().find(c=>c.id==='kfury'); return { a1, f1, a2, f2, t:T.timers() };`);
check("Aegis and Fury show with their countdown rings, the ring running down",A.a1&&A.a1.ic==='✨'&&A.a1.ring&&A.a1.p>.85&&A.f1&&A.f1.ic==='🔥'&&A.f1.ring&&A.f1.p>.85&&A.a2&&A.a2.p<A.a1.p-.25&&A.f2&&A.f2.p<A.f1.p-.25,JSON.stringify(A));
await page.waitForTimeout(700);
await page.screenshot({path:SHOTS+"buffbar-vigil-aegis.png",clip:{x:1280-330,y:90,width:330,height:330}});   // Vigil back on (he has stood still since), Aegis and Fury running
const A3=await ev(`still(140); return { list:BB.list(), t:T.timers() };`);
check("...and leave when they run out (3 s)",!A3.list.some(b=>b.id==='kaegis'||b.id==='kfury'),JSON.stringify(A3));
const L=await ev(`h.hp=h.max*.3; still(6); const low=BB.list().some(b=>b.id==='kstand'); h.hp=h.max; still(6); return { low, after:BB.list().some(b=>b.id==='kstand') };`);
check("Last Stand shows under 35% health and goes when healed",L.low&&!L.after,JSON.stringify(L));
// ---- where it sits
const P=await ev(`still(6); const wv=document.getElementById('mmWave').getBoundingClientRect(), mm=document.getElementById('minimap').getBoundingClientRect(); const on=BB.rect();
  window.__minimap.toggle(false); still(6); const off=BB.rect(), wv2=document.getElementById('mmWave').getBoundingClientRect(); window.__minimap.toggle(true); still(6);
  return { on, off, mapBottom:Math.round(mm.bottom), waveBottom:Math.round(wv.bottom), wave2Bottom:Math.round(wv2.bottom), back:BB.rect() };`);
check("the bar sits at the right edge just under the mini-map's wave strip; with the map hidden (M) it moves up under the strip",P.on.right<30&&P.on.top>=P.waveBottom&&P.on.top<P.waveBottom+20&&P.waveBottom>P.mapBottom&&P.off.top<P.on.top-100&&P.off.top>=P.wave2Bottom&&P.back.top===P.on.top,JSON.stringify(P));
const CUT=await ev(`document.body.classList.add('avery-cut'); const c=BB.shown(); document.body.classList.remove('avery-cut'); return { inCut:c, after:BB.shown() };`);
check("hidden while a cut scene has the HUD (body.avery-cut)",!CUT.inCut&&CUT.after,JSON.stringify(CUT));
const GB=await ev(`window.__gabriel.force(); still(6); const b=BB.dom().find(c=>c.id==='blitz'); window.__gabriel.reset(); still(6); return { b, after:BB.list().some(x=>x.id==='blitz') };`);
check("Gabriel's Charm BLITZ shows with its 6 s ring",GB.b&&GB.b.ring&&GB.b.p>.85&&!GB.after,JSON.stringify(GB));
// ---- Ranger: Eagle Eye on a perch
await page.evaluate(async()=>{ await window.__heroes.select('troll'); window.__dd.step(1/60,3); });
const R=await ev(`d.setHero(8,10,0); still(3); const off=BB.list().map(b=>b.id); const p=d.place('perch',12,14,0)||d.defs.find(x=>x.kind==='perch'); for(let i=0;i<20;i++){ h.x=p.x-.3; h.z=p.z-.3; h.y=p.base+2.5; h.vy=0; d.step(1/60,1); } tk(); const on=BB.dom().find(c=>c.id==='rperch'); return { tree:T.tree(), off, on, eagle:T.timers().eagle };`);
check("a Ranger on the ground shows nothing; up on a perch his 🦅 Eagle Eye chip shows",R.tree==='troll'&&!R.off.includes('rperch')&&R.on&&R.on.ic==='🦅'&&R.eagle,JSON.stringify(R));
await page.waitForTimeout(700);
await page.screenshot({path:SHOTS+"buffbar-ranger.png",clip:{x:1280-330,y:90,width:330,height:330}});
// ---- Fighter: Halo Surge and Mending Light
await page.evaluate(async()=>{ await window.__heroes.select('fighter'); window.__dd.step(1/60,3); });
const F=await ev(`d.setHero(0,8,0); still(3); let halo=null; for(let r=2;r<8&&!halo;r+=1) for(let a=0;a<8&&!halo;a++) halo=d.placeDefAt('zap',h.x+Math.cos(a)*r,h.z+Math.sin(a)*r,0);
  window.__specials.forceReady(); const fired=window.__specials.fire(); h.hp=h.max*.5; still(12); const dom=BB.dom(); const s=dom.find(c=>c.id==='surge'), m=dom.find(c=>c.id==='fmend'); h.hp=h.max; window.__specials.forceReady();
  return { tree:T.tree(), fired, surgeT:window.__specials.haloSurgeT(), s, m, halo:!!halo };`);
check("a Fighter's Halo Surge shows with its ring (12 s with Surge Master III) and his 💚 Mending Light while it heals him in his halo",F.tree==='fighter'&&F.fired&&F.s&&F.s.ring&&F.s.p>.9&&/\+6 s/.test(F.s.tip)&&F.m&&F.m.ic==='💚',JSON.stringify(F));
// ---- Witch: Doom's kill count
await page.evaluate(async()=>{ await window.__heroes.select('witch'); window.__dd.step(1/60,3); });
const W=await ev(`still(3); const t0=T.timers().doom; for(let i=0;i<3;i++){ d.spawn('goblin','N'); const g=d.enemies[d.enemies.length-1]; g.mineT=d.S.t; d.kill(g); } still(6); const c=BB.dom().find(x=>x.id==='doom'); return { tree:T.tree(), t0, t1:T.timers().doom, c };`);
check("a Witch's 💀 Doom shows its kill count toward the next explosion",W.tree==='witch'&&W.c&&W.c.ic==='💀'&&W.c.n===(W.t1%10)&&W.c.n>=3,JSON.stringify(W));
await browser.close(); server.close();
// ---- co-op: the guest's own bar
let PeerServer=null; try{ ({ PeerServer } = await import("peer")); }catch(e){ console.log("SKIP the co-op part -- the `peer` package isn't installed"); }
if(PeerServer){
  const sigPort=9573; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>setTimeout(r,300)); const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
  const server2=await serve(9572,{dist:process.env.DIST||"./dist"}); const br=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]});
  const hostPage=await (await br.newContext()).newPage(), guestPage=await (await br.newContext()).newPage(); for(const p of [hostPage,guestPage]){ p.on("pageerror",e=>errors.push(String(e))); await p.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"})); }
  await hostPage.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.removeItem("dd_talents"); }catch(e){} });
  await guestPage.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_talents",JSON.stringify({knight:{kvigil:1,kaegis:1}})); }catch(e){} });
  for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:9572/?silent&ownweapons&nogate",{timeout:120000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat&&window.__talents&&window.__buffbar,null,{timeout:120000}); }
  for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__freeze=true; try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); window.__dd.step(1/60,30); });
  const tickBoth=async(b=6,s=5)=>{ for(let i=0;i<b;i++){ for(let j=0;j<s;j++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); } };
  const rc="buffbar-"+Math.random().toString(36).slice(2,8);
  const ho=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const gj=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const gid=gj.id; await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0)); await guestPage.evaluate(()=>window.__dd.setHero(0,6,0)); await tickBoth(12,5);
  await guestPage.evaluate(h=>window.__heroes.select(h),'knight'); for(let i=0;i<150;i++){ const ok=await guestPage.evaluate(()=>window.__heroes.pick()==='knight'&&!(window.__aim&&window.__aim.kind())); if(ok) break; await tickBoth(1,2); } await tickBoth(8,5);
  const G1=await guestPage.evaluate(()=>{ window.__buffbar.tick(); return { role:window.__net.role(), list:window.__buffbar.list(), shown:window.__buffbar.shown() }; });
  check("co-op: the guest Knight standing still sees its own Vigil on its own bar",gj.err===null&&G1.role==='guest'&&G1.list.some(b=>b.id==='kvigil'&&b.st==='on')&&G1.shown,JSON.stringify({ho,gj,G1}));
  const aeg=await hostPage.evaluate(id=>{ const H=window.__dd.Meta.heroes().find(h=>h.gid===id); let last=window.__combat.guestHero(id).hp; for(let n=0;n<40;n++){ H.hurt(12); const g=window.__combat.guestHero(id); if(g.hp===last) break; last=g.hp; } return window.__combat.guestHero(id); },gid);
  await tickBoth(2,5);
  const G2=await guestPage.evaluate(()=>{ window.__buffbar.tick(); return window.__buffbar.list(); }), H2=await hostPage.evaluate(()=>{ window.__buffbar.tick(); return window.__buffbar.list(); });
  check("co-op: the Aegis the host catches for the guest shows on the GUEST's bar with its ring, not on the host's",G2.some(b=>b.id==='kaegis'&&b.p>.5)&&!H2.some(b=>b.id==='kaegis'),JSON.stringify({aeg,G2,H2}));
  await br.close(); server2.close(); try{ sig.close&&sig.close(); }catch(e){}
}
const real=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
