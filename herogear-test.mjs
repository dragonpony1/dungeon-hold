// ===== EACH HERO WEARS THEIR OWN GEAR (build 171, 71-herogear.js). Matt: "each hero should have its own unique gearâ€¦ when
// I switch heroes, his weapon will show" -- "If it's equipped it belongs to that hero otherwise the bag is shared."
// One page: a sword on the Knight; the Witch starts empty with her own staff model; a piece on her; back to the Knight and
// his sword is in hand again; a worn piece moved between heroes leaves the first; a reload keeps it all; the exactly-once
// census; per-hero loadouts (and one that takes its piece back off the other hero); migration from an old single-gear save;
// the tutorial's forced Knight. Two pages: a co-op guest switching hero re-dresses its puppet and its stats on the host.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8815, SIG=9715, URL="http://127.0.0.1:"+PORT+"/?silent&ownweapons&nogate";
const server=await serve(PORT);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const ctx=await browser.newContext(); const page=await ctx.newPage();
const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
const ready=async p=>{ await p.waitForFunction(()=>window.__dd&&window.__meta&&window.__heroes&&window.__heroGear&&window.__weapons&&window.__doll,null,{timeout:120000}); };
const load=async(p,u)=>{ await p.goto(u||URL,{timeout:120000}); await ready(p); await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); }); };
// the weapon in hand, once the rig has its mount and the right kind is on it
const inHand=(p,want)=>p.waitForFunction(w=>{ const s=window.__weapons.state(), l=window.__weapons.look(); return s.mounted&&(w===null?true:typeof w==='string'?l.w===w:new RegExp(w.re).test(l.w||''))?l.w:null; },want,{timeout:60000,polling:100}).then(h=>h.jsonValue()).catch(()=>null);
const pick=(p,id)=>p.evaluate(id=>Promise.resolve(window.__heroes.select(id)).then(()=>window.__heroes.pick()),id);

// ---- a clean slate: every hero unlocked, nothing saved
await page.goto(URL,{timeout:120000}); await ready(page);
await page.evaluate(()=>{ Object.keys(localStorage).filter(k=>/^dd/.test(k)).forEach(k=>localStorage.removeItem(k)); localStorage.setItem('ddMapsCleared','1'); localStorage.setItem('ddHero','knight'); });
await load(page);
await page.evaluate(()=>{ window.__meta.reset(); window.__dd.resetGear(); });
const A=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; const mk=(slot,name,st)=>{ const it=d.rollItem(2,slot,5); it.name=name; if(slot==='weapon') window.__typed.type(it,/Staff/.test(name)?'staff':'sword');   /* build 525 prep: typed weapons */ if(st) it.stats=st; M.giveItem(it); return it; };
  const sword=mk('weapon','Ember Broadsword of Testing',{dmg:11}), staff=mk('weapon','Runed Staff of Testing',{dmg:5}), armor=mk('armor','Chainmail of Testing',{hp:40}), charm=mk('charm','Charm of Testing',{tow:9});
  const ok=M.equip(sword.id); return {ok,sword:{id:sword.id,kind:window.__weapons.swordFor(sword)},staff:{id:staff.id,kind:window.__staff.staffFor(staff)},armor:armor.id,charm:charm.id,pick:window.__heroes.pick()}; });
check("setup: the Knight is picked and wears the sword",A.ok&&A.pick==='knight',JSON.stringify(A));
const k1=await inHand(page,A.sword.kind);
check("the Knight's sword is in his hand ("+A.sword.kind+")",k1===A.sword.kind,String(k1));

// ---- to the Witch: her own (empty) slots, her own staff model
await pick(page,'witch');
const w0=await page.evaluate(()=>({gear:Object.values(window.__dd.gear()).filter(Boolean).length,dmg:window.__dd.heroStat('dmg'),knight:window.__heroGear.of('knight').weapon&&window.__heroGear.of('knight').weapon.id}));
check("switching to the Witch: her slots are empty and the Knight's sword stays filed under the Knight",w0.gear===0&&w0.dmg===0&&w0.knight===A.sword.id,JSON.stringify(w0));
const wh0=await inHand(page,{re:'^staff-'});
check("the Witch holds her own plain staff (not the Knight's sword)",!!wh0&&wh0==='staff-hazel',String(wh0));
const w1=await page.evaluate(A=>{ const M=window.__meta; const a=M.equip(A.staff.id), b=M.equip(A.armor); return {a,b,w:window.__dd.gear().weapon.id,ar:window.__dd.gear().armor.id,max:window.__dd.hero.max}; },A);
check("the Witch equips a staff and the chainmail from the shared bag",w1.a&&w1.b&&w1.w===A.staff.id&&w1.ar===A.armor&&w1.max>=140,JSON.stringify(w1));
const wh1=await inHand(page,A.staff.kind);
check("her new staff shows in her hand ("+A.staff.kind+")",wh1===A.staff.kind,String(wh1));

// ---- back to the Knight: his sword again
await pick(page,'knight');
const k2=await page.evaluate(()=>{ const g=window.__dd.gear(); return {w:g.weapon&&g.weapon.id,ar:g.armor&&g.armor.id,witch:window.__heroGear.of('witch'),max:window.__dd.hero.max,dmg:window.__dd.heroStat('dmg')}; });
check("back on the Knight: his sword (and only his) is on, the Witch keeps her staff and chainmail",k2.w===A.sword.id&&!k2.ar&&k2.witch.weapon.id===A.staff.id&&k2.witch.armor.id===A.armor&&k2.max===100&&k2.dmg===11,JSON.stringify({w:k2.w,ar:k2.ar,max:k2.max,dmg:k2.dmg}));
const k3=await inHand(page,A.sword.kind);
check("the Knight's sword is back in his hand",k3===A.sword.kind,String(k3));

// ---- a loadout on the Knight (sword + charm); the Witch's four are her own
const L=await page.evaluate(A=>{ const M=window.__meta, D=window.__doll; M.equip(A.charm); D.saveLoadout(0); const kl=D.loadouts(); return {k0:kl[0]&&kl[0].ids,stored:JSON.parse(localStorage.getItem('dd_heroLoadouts'))}; },A);
check("the Knight saves loadout 1 (sword + charm)",!!L.k0&&L.k0.weapon===A.sword.id&&L.k0.charm===A.charm&&!!L.stored.knight,JSON.stringify(L.k0));
await pick(page,'witch');
const L2=await page.evaluate(()=>{ const D=window.__doll; const before=D.loadouts().map(Boolean); D.saveLoadout(1); return {before,after:D.loadouts().map(x=>x&&x.ids)}; });
check("the Witch's loadout cards are her own: empty until she saves one",L2.before.every(b=>!b)&&!L2.after[0]&&!!L2.after[1]&&!!L2.after[1].weapon,JSON.stringify(L2));

// ---- moving a worn piece between heroes: the Witch takes the Knight's charm (it leaves him)
const mv=await page.evaluate(A=>{ const M=window.__meta; const ok=M.equip(A.charm); const toast=document.getElementById('toast').textContent; return {ok,toast,on:window.__dd.gear().charm&&window.__dd.gear().charm.id,knight:window.__heroGear.of('knight').charm,where:window.__heroGear.whereWorn(A.charm),check:window.__heroGear.check()}; },A);
check("equipping on the Witch the charm the Knight wears moves it: his slot empties, a toast says so",mv.ok&&mv.on===A.charm&&mv.knight===null&&mv.where.hero==='witch'&&/moved from the Knight to the Witch/.test(mv.toast),JSON.stringify({ok:mv.ok,toast:mv.toast,knight:mv.knight}));
check("every piece exists exactly once (bag + armory + every hero)",mv.check.ok&&mv.check.stale.length===0,JSON.stringify(mv.check.dup));
// and back: the Knight's loadout takes it off her again
await pick(page,'knight');
const lw=await page.evaluate(()=>{ const r=window.__doll.wearLoadout(0); return {r,toast:document.getElementById('toast').textContent,charm:window.__dd.gear().charm&&window.__dd.gear().charm.id,witch:window.__heroGear.of('witch').charm,check:window.__heroGear.check()}; });
check("the Knight's loadout takes his charm back off the Witch",lw.r&&lw.charm===A.charm&&lw.witch===null&&/taken from the Witch/.test(lw.toast)&&lw.check.ok,JSON.stringify({r:lw.r,toast:lw.toast,charm:lw.charm}));
const sheet=await page.evaluate(()=>{ const D=window.__doll; window.__dd.S.phase='build'; D.open(); const h=D.html(); D.close(); return h; });
check("the character sheet says whose gear it is",/The GNOME KNIGHT/.test(sheet)&&/the Knight's own/.test(sheet),(sheet.match(/dl-whose[^<]*<?[^<]*/)||[''])[0].slice(0,160));

// ---- a reload keeps every hero's set, the loadouts and the census
const snap=await page.evaluate(()=>({k:window.__heroGear.of('knight'),w:window.__heroGear.of('witch'),bag:window.__meta.bag().map(i=>i.id).sort()}));
await load(page);
const re=await page.evaluate(()=>({pick:window.__heroes.pick(),k:window.__heroGear.of('knight'),w:window.__heroGear.of('witch'),bag:window.__meta.bag().map(i=>i.id).sort(),ld:window.__doll.loadouts()[0],check:window.__heroGear.check()}));
const ids=g=>Object.fromEntries(Object.entries(g).map(([s,it])=>[s,it&&it.id]));
check("after a reload the Knight is back in his own gear and the Witch's is filed under her",re.pick==='knight'&&JSON.stringify(ids(re.k))===JSON.stringify(ids(snap.k))&&JSON.stringify(ids(re.w))===JSON.stringify(ids(snap.w))&&re.k.weapon.id===A.sword.id&&re.w.weapon.id===A.staff.id,JSON.stringify({k:ids(re.k),w:ids(re.w)}));
check("after a reload the bag, the Knight's loadout and the exactly-once census all hold",JSON.stringify(re.bag)===JSON.stringify(snap.bag)&&!!re.ld&&re.ld.ids.weapon===A.sword.id&&re.check.ok,JSON.stringify(re.check.dup));
const k4=await inHand(page,A.sword.kind);
check("after the reload the Knight's sword is in his hand",k4===A.sword.kind,String(k4));
await pick(page,'witch'); const wh2=await inHand(page,A.staff.kind);
check("â€¦and switching to the Witch puts her staff in hers",wh2===A.staff.kind,String(wh2));

// ---- the tutorial forces the Knight: it runs in the Knight's own gear, and the Witch's comes back after
await page.evaluate(()=>localStorage.setItem('ddHero','witch'));
await load(page,URL.replace('?','?tutorial=1&'));
const tu=await page.evaluate(()=>({pick:window.__heroes.pick(),w:window.__dd.gear().weapon&&window.__dd.gear().weapon.id,saved:localStorage.getItem('ddHero'),witch:window.__heroGear.of('witch').weapon&&window.__heroGear.of('witch').weapon.id}));
check("the tutorial page is the Knight in his own gear, the Witch's staff still hers and her pick still saved",tu.pick==='knight'&&tu.w===A.sword.id&&tu.witch===A.staff.id&&tu.saved==='witch',JSON.stringify(tu));
await load(page);
const af=await page.evaluate(()=>({pick:window.__heroes.pick(),w:window.__dd.gear().weapon&&window.__dd.gear().weapon.id,check:window.__heroGear.check().ok}));
check("after the tutorial the Witch comes back in her own gear",af.pick==='witch'&&af.w===A.staff.id&&af.check,JSON.stringify(af));

// ---- migration: an old save (one shared ddGear, the old four loadouts, no per-hero keys) goes to the hero picked now
await page.evaluate(()=>{ const it=(slot,id,name,r)=>({id,slot,name,rarity:r,lvl:6,tier:2,stats:slot==='weapon'?{dmg:9}:{hp:20},score:30,value:50});
  Object.keys(localStorage).filter(k=>/^dd/.test(k)).forEach(k=>localStorage.removeItem(k)); localStorage.setItem('ddMapsCleared','1'); localStorage.setItem('ddHero','troll');
  localStorage.setItem('ddGear',JSON.stringify({weapon:it('weapon','oldbow1','Yew Longbow of Old',2),armor:it('armor','oldmyth1','Mythic Mail of Old',5),charm:null,amulet:null,familiar:null}));
  localStorage.setItem('ddMeta',JSON.stringify({v:1,gold:5,xp:0,level:3,skills:{},bag:[it('amulet','oldbag1','Pendant of Old',1)],best:0,stock:[],stockTier:1,runs:1}));
  localStorage.setItem('dd_loadouts',JSON.stringify([{ids:{weapon:'oldbow1',armor:'oldmyth1'},names:{},at:1},null,null,null])); });
await load(page);
const mg=await page.evaluate(()=>({pick:window.__heroes.pick(),w:window.__dd.gear().weapon&&window.__dd.gear().weapon.id,ar:window.__dd.gear().armor&&window.__dd.gear().armor.id,knight:Object.values(window.__heroGear.of('knight')).filter(Boolean).length,saved:JSON.parse(localStorage.getItem('dd_heroGear')),ld:window.__doll.loadouts()[0],check:window.__heroGear.check()}));
check("migration: the old shared set (a worn Mythic too) becomes the Troll's -- the hero picked -- and the others start empty",mg.pick==='troll'&&mg.w==='oldbow1'&&mg.ar==='oldmyth1'&&mg.knight===0&&!!mg.saved&&mg.saved.heroes.troll.weapon.id==='oldbow1'&&mg.check.ok,JSON.stringify({pick:mg.pick,w:mg.w,ar:mg.ar,knight:mg.knight}));
check("migration: the old four loadout cards become the Troll's",!!mg.ld&&mg.ld.ids.weapon==='oldbow1',JSON.stringify(mg.ld));
await pick(page,'knight');
const mg2=await page.evaluate(()=>({ld:window.__doll.loadouts().filter(Boolean).length,gear:Object.values(window.__dd.gear()).filter(Boolean).length}));
check("migration: the Knight has no loadouts and no gear of his own yet",mg2.ld===0&&mg2.gear===0,JSON.stringify(mg2));
// a ddGear written by something else since (an older build, a test) is adopted for the hero it mirrored
await page.evaluate(()=>{ localStorage.setItem('ddGear',JSON.stringify({weapon:{id:'ext1',slot:'weapon',name:'Outside Blade',rarity:1,lvl:2,stats:{dmg:3}}})); });
await load(page);
const ex=await page.evaluate(()=>({pick:window.__heroes.pick(),w:window.__dd.gear().weapon&&window.__dd.gear().weapon.id,troll:window.__heroGear.of('troll').weapon&&window.__heroGear.of('troll').weapon.id}));
check("a ddGear this build did not write is adopted for the hero it belonged to (older builds and tests keep working)",ex.pick==='knight'&&ex.w==='ext1'&&ex.troll==='oldbow1',JSON.stringify(ex));

// ---- co-op: a guest switching hero re-dresses its puppet and re-reports its stats on the host
let PeerServer=null; try { ({ PeerServer } = await import("peer")); } catch(e) { console.log("SKIP co-op part â€” the `peer` package isn't installed"); }
if(PeerServer){
  const sig=PeerServer({ port:SIG, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>setTimeout(r,300)); const peerOpts={ host:"127.0.0.1", port:SIG, path:"/peerjs" };
  const gctx=await browser.newContext(); const guest=await gctx.newPage(); guest.on("pageerror",e=>errors.push("guest: "+e));
  await guest.goto(URL,{timeout:120000}); await ready(guest); await guest.evaluate(()=>{ Object.keys(localStorage).filter(k=>/^dd/.test(k)).forEach(k=>localStorage.removeItem(k)); localStorage.setItem('ddMapsCleared','1'); localStorage.setItem('ddHero','knight'); });
  await load(guest); await load(page);
  const G=await guest.evaluate(async()=>{ const d=window.__dd, M=window.__meta; M.reset(); d.resetGear(); const mk=(slot,name,st)=>{ const it=d.rollItem(2,slot,5); it.name=name; if(slot==='weapon') window.__typed.type(it,/Staff/.test(name)?'staff':'sword');   /* build 525 prep: typed weapons */ it.stats=st; M.giveItem(it); return it; };
    const sword=mk('weapon','Ember Broadsword of the Guest',{dmg:6}); M.equip(sword.id);
    await window.__heroes.select('witch'); const staff=mk('weapon','Runed Staff of the Guest',{dmg:4}), coat=mk('armor','Jerkin of the Guest',{hp:60}); M.equip(staff.id); M.equip(coat.id);
    await window.__heroes.select('knight'); return {sword:window.__weapons.swordFor(sword),staff:window.__staff.staffFor(staff)}; });
  await inHand(guest,G.sword);
  const rc="hg-"+Math.random().toString(36).slice(2,8);
  const ho=await page.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const gj=await guest.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  check("co-op: host and guest connect",ho.err===null&&gj.err===null,JSON.stringify({ho,gj}));
  const seen=(want)=>page.waitForFunction(w=>{ const ids=window.__party.list(); const p=ids.length?window.__party.get(ids[0]):null; return p&&p.ready&&p.weaponName===w.name&&p.glb===w.glb?{glb:p.glb,w:p.weaponName}:null; },want,{timeout:90000,polling:200}).then(h=>h.jsonValue()).catch(()=>null);
  const s1=await seen({name:G.sword,glb:'knight.glb'});
  check("co-op: the host sees the guest's Knight with the guest's sword",!!s1,JSON.stringify(s1||await page.evaluate(()=>window.__party.list().map(id=>window.__party.get(id)))));
  const hp0=await page.evaluate(id=>window.__meta.defOwnerStat(id,'hp'),gj.id);
  await guest.evaluate(()=>window.__heroes.select('witch'));
  const s2=await seen({name:G.staff,glb:'witch.glb'});
  check("co-op: the guest switches to the Witch and the host's puppet follows -- her own staff in hand",!!s2,JSON.stringify(s2||await page.evaluate(()=>window.__party.list().map(id=>window.__party.get(id)))));
  const hp1=await page.waitForFunction(id=>{ const v=window.__meta.defOwnerStat(id,'hp'); return v===60?v:null; },gj.id,{timeout:20000,polling:100}).then(h=>h.jsonValue()).catch(()=>null);
  check("co-op: the host's copy of the guest's stats follows the switch (the Witch's jerkin: +60 hp; the Knight had none)",hp0===0&&hp1===60,JSON.stringify({hp0,hp1}));
  await guest.close(); await gctx.close(); sig.close&&sig.close();
}

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
