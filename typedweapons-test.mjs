// ===== TYPED WEAPONS (build 525 prep; game.js WTYPES / rollWtype / typeWeapon, parts/staging/99m-typedweapons.js). Matt: "yeah we really need typed weapons".
// Checked: every weapon carries it.wtype; each hero's drops are ~70% its own type(s) (the Knight's mostly swords) and ~30% the others; names follow the type's ladder; a mythic / set / named weapon
// has its type (the four named weapons fixed); a wrong-type weapon is refused in the bag (and its Equip button is a disabled picture), on the Tab sheet and as a 2nd weapon (the Knight's 2nd only a
// sword); the model, picture and emblem follow the item's type, not the hero; the dev panel gives every type; an OLD SAVE migrates once (worn per hero, 2nd weapons, bag with and without type
// words, armory) and nothing is lost; a co-op guest's drop rolls the GUEST's hero; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const PORT=9247; const server=await serve(PORT,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function openPage(init,arg){ const ctx=await browser.newContext({viewport:{width:1366,height:860}}); await ctx.route(/\/api\//,r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
  await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
  if(init) await ctx.addInitScript(init,arg); const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e))); return {ctx,p}; }
const boot=async(p,q)=>{ await p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate&nosetgate"+(q||""),{timeout:180000}); await p.waitForFunction(()=>window.__dd&&window.__typed&&window.__gearscore&&window.__meta&&window.__dualwield&&window.__devpanel,null,{timeout:180000});
  await p.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,3); window.__freeze=true; window.__meta.setLevel&&window.__meta.setLevel(40); d.S.phase='build'; }); };
const pick=(p,id)=>p.evaluate(async id=>{ await window.__heroes.select(id); const want={knight:'Knight',witch:'Witch',fighter:'Fighter',troll:'Ranger'}[id]; for(let i=0;i<600;i++){ const m=window.__dd.heroModel(); if(m&&m.label.includes(want)) return m.label; await new Promise(r=>setTimeout(r,50)); } return null; },id);

// ================= THE MIGRATION of an old save (its own page, seeded before the game loads; sessionStorage keeps the seed to the first load only) =================
const SEED=()=>{ if(sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded','1');
  const mk=(id,name,x)=>Object.assign({id,slot:'weapon',rarity:2,lvl:5,tier:2,name,stats:{dmg:10,spd:8},value:40,score:38},x||{});
  const sets={ knight:{weapon:mk('kw','Keen Broadsword'),armor:null,charm:null,amulet:null,familiar:null}, witch:{weapon:mk('ww','Fine Broadsword of Might'),armor:null,charm:null,amulet:null,familiar:null},
    fighter:{weapon:mk('fw','Mythic Staff of Chaos',{look:'staff',setId:'crimson',rarity:5,mythic:true,art:'hideout/assets/hideout/items/sets/crimson-staff.jpg'}),armor:null,charm:null,amulet:null,familiar:null},
    troll:{weapon:mk('tw','Rusty Shortsword'),armor:null,charm:null,amulet:null,familiar:null} };
  const gs=JSON.stringify(sets.witch); let h=2166136261; for(let i=0;i<gs.length;i++){ h^=gs.charCodeAt(i); h=Math.imul(h,16777619); }
  localStorage.setItem('ddHero','witch'); localStorage.setItem('ddGear',gs); localStorage.setItem('dd_heroGear',JSON.stringify({v:1,on:'witch',sig:h>>>0,heroes:sets}));
  localStorage.setItem('dd_heroWeapon2',JSON.stringify({knight:mk('k2','Mythic Polearm of the Void',{look:'polearm',setId:'void',rarity:5,mythic:true}),witch:mk('w2','Plain Shortsword')}));
  const bag=[mk('b1','Keen Yew Longbow'),mk('b2','Mythic Sword of the Void',{look:'staff',setId:'void',rarity:5,mythic:true}),mk('b3','Gleaming Cleaver'),mk('b4','Worn Thing'),mk('b5','Ancient Halberd'),
    {id:'b6',slot:'armor',rarity:1,lvl:3,tier:1,name:'Fine Jerkin',stats:{hp:30,def:4},value:20},mk('b7','Polished Warhammer',{score:-5}),{id:'n1',slot:'weapon',rarity:5,lvl:10,tier:4,name:'Subterfuge',named:'subterfuge',stats:{dmg:26,spd:18,move:12},value:400,score:114}];
  localStorage.setItem('ddMeta',JSON.stringify({v:1,gold:500,xp:0,level:5,skills:{},bag,best:3,stock:[],stockTier:1,runs:2}));
  localStorage.setItem('ddArmory',JSON.stringify([mk('a1','Sturdy Warhammer')]));
  localStorage.removeItem('dd_wtype_v1'); };
{ const {ctx,p}=await openPage(SEED); await boot(p);
  const snap=()=>p.evaluate(()=>{ const M=window.__meta, D=window.__dualwield, HG=window.__heroGear, out={};
    const put=(it,where)=>{ if(it&&it.id) out[it.id]={where,name:it.name,wtype:it.wtype||null,look:it.look||null,score:it.score,slot:it.slot,art:it.art||null}; };
    for(const h of ['knight','witch','fighter','troll']){ const g=HG.of(h); for(const s in g) put(g[s],'worn:'+h); } const st=D.store(); for(const h in st) put(st[h],'w2:'+h); put(window.__dd.gear().weapon2,'w2:cur');
    M.bag().forEach(it=>put(it,'bag')); (M.armory?M.armory():[]).forEach(it=>put(it,'armory')); return {out,rep:window.__typed.report(),flag:localStorage.getItem('dd_wtype_v1'),check:HG.check().ok,calc:window.__gearscore.calc({stats:{dmg:10,spd:8}})}; });
  const A=await snap(), o=A.out; const T=id=>o[id]&&o[id].wtype, N=id=>o[id]&&o[id].name;
  check("migration ran once and set its flag",A.rep.ran&&A.flag==='1',JSON.stringify(A.rep));
  check("nothing lost: all 14 pieces are still there (5 worn by 4 heroes, 2 second weapons, 7 in the bag, 1 in the armory) and the exactly-once check holds",['kw','ww','fw','tw','k2','w2','b1','b2','b3','b4','b5','b6','b7','n1','a1'].every(id=>o[id])&&A.check,Object.keys(o).join(','));
  check("worn: Knight's Keen Broadsword stays a sword",T('kw')==='sword'&&N('kw')==='Keen Broadsword',JSON.stringify(o.kw));
  check("worn: the Witch's Fine Broadsword of Might becomes her staff at the same step (Fine Copper Staff of Might)",T('ww')==='staff'&&N('ww')==='Fine Copper Staff of Might',JSON.stringify(o.ww));
  check("worn: the Fighter's Mythic Staff of Chaos becomes a polearm -- name and set picture follow",T('fw')==='polearm'&&N('fw')==='Mythic Polearm of Chaos'&&/crimson-polearm\.jpg$/.test(o.fw.art||''),JSON.stringify(o.fw));
  check("worn: the Ranger's Rusty Shortsword becomes a bow (Rusty Ash Shortbow)",T('tw')==='bow'&&N('tw')==='Rusty Ash Shortbow',JSON.stringify(o.tw));
  check("2nd weapons: the Knight's is a sword (Mythic Sword of the Void), the Witch's a staff (Plain Hazel Staff)",T('k2')==='sword'&&N('k2')==='Mythic Sword of the Void'&&T('w2')==='staff'&&N('w2')==='Plain Hazel Staff',JSON.stringify([o.k2,o.w2]));
  check("bag: a name that says bow keeps it (Keen Yew Longbow)",T('b1')==='bow'&&N('b1')==='Keen Yew Longbow',JSON.stringify(o.b1));
  check("bag: its look wins over a renamed word (look staff -> Mythic Staff of the Void)",T('b2')==='staff'&&N('b2')==='Mythic Staff of the Void',JSON.stringify(o.b2));
  check("bag: Gleaming Cleaver is a sword; Ancient Halberd a polearm (Ancient Gnome Battle Halberd)",T('b3')==='sword'&&T('b5')==='polearm'&&N('b5')==='Ancient Gnome Battle Halberd',JSON.stringify([o.b3,o.b5]));
  check("bag: a weapon whose name says nothing takes the hero being played (the Witch: staff)",T('b4')==='staff'&&N('b4')==='Worn Thing',JSON.stringify(o.b4));
  check("bag: the armor piece is untouched; Subterfuge is a bow; the armory's Sturdy Warhammer a sword",!o.b6.wtype&&o.b6.name==='Fine Jerkin'&&T('n1')==='bow'&&N('n1')==='Subterfuge'&&T('a1')==='sword',JSON.stringify([o.b6,o.n1,o.a1]));
  check("every weapon's look now equals its type",Object.values(o).filter(x=>x.slot==='weapon').every(x=>x.look===x.wtype));
  check("a broken gear score (-5) is worked out again from its stats",o.b7.score===A.calc&&A.calc>0,JSON.stringify(o.b7));
  await p.reload(); await p.waitForFunction(()=>window.__typed&&window.__meta,null,{timeout:180000}); await sleep(300);
  const B=await snap();
  check("run once: after a reload it does not run again and nothing changes",!B.rep.ran&&Object.keys(o).every(id=>B.out[id]&&B.out[id].name===o[id].name&&B.out[id].wtype===o[id].wtype),JSON.stringify(B.rep));
  await ctx.close(); }

// ================= THE MAIN PAGE =================
const {ctx,p:page}=await openPage(); await boot(page);
// ---- drops: 70/30 per hero
for(const h of ['knight','witch','fighter','troll']){ await pick(page,h);
  const R=await page.evaluate(()=>{ const d=window.__dd, T=window.__typed, n=4000, c={sword:0,polearm:0,staff:0,bow:0}; let typed=0, named=0;
    for(let i=0;i<n;i++){ const it=d.rollItem(1,'weapon',10); if(['sword','polearm','staff','bow'].includes(it.wtype)) typed++; c[it.wtype]=(c[it.wtype]||0)+1;
      const L=T.bases()[it.wtype]; if(L.some(w=>it.name.includes(w))&&it.look===it.wtype) named++; }
    return {c,n,typed,named,own:T.heroTypes()}; });
  const own=R.own.reduce((a,t)=>a+R.c[t],0)/R.n, others=['sword','polearm','staff','bow'].filter(t=>!R.own.includes(t));
  check(h+": every rolled weapon is typed and named off its type's ladder",R.typed===R.n&&R.named===R.n,JSON.stringify(R));
  check(h+": about 70% of weapon drops are its own type ("+(own*100).toFixed(1)+"%)",own>.66&&own<.74,JSON.stringify(R.c));
  check(h+": the other 30% spread over the other types",others.every(t=>Math.abs(R.c[t]/R.n-.3/others.length)<.03),JSON.stringify(R.c));
  if(h==='knight') check("knight: his own drops are mostly swords (about 3 in 4), the rest polearms",R.c.sword/(R.c.sword+R.c.polearm)>.7&&R.c.sword/(R.c.sword+R.c.polearm)<.8,JSON.stringify(R.c));
}
// ---- names by type
const NM=await page.evaluate(()=>{ const T=window.__typed, d=window.__dd, out={}; for(const t of ['sword','polearm','staff','bow']){ T.force(t); const its=[]; for(let i=0;i<300;i++) its.push(d.rollItem(Math.floor(Math.random()*5),'weapon',10)); T.force(null);
    out[t]=[...new Set(its.map(it=>T.bases()[t].find(w=>it.name.includes(w))||'??'))].sort(); } return {out,bases:T.bases()}; });
check("names by type: swords use Shortsword..Gnome Blade (no Halberd), staffs Hazel..Battle Staff, polearms Hazel Spear..Gnome Battle Halberd, bows Ash Shortbow..Gnome Battle Bow",
  ['sword','polearm','staff','bow'].every(t=>!NM.out[t].includes('??')&&NM.out[t].length===5)&&!NM.bases.sword.includes('Halberd')&&NM.bases.bow[2]==='Runed Recurve'&&NM.bases.bow[4]==='Gnome Battle Bow'&&NM.bases.staff.join()==='Hazel Staff,Copper Staff,Runed Staff,Storm Staff,Battle Staff',JSON.stringify(NM.out));
// ---- set / mythic / named
await pick(page,'knight');
const SM=await page.evaluate(()=>{ const T=window.__typed, d=window.__dd, MD=window.__mythicDrops, N=window.__mythic, out={};
  T.force('staff'); const a=d.rollItem(2,'weapon',10); T.force(null); MD.mythicize(a); out.myth={name:a.name,wtype:a.wtype,art:a.art};
  T.force('bow'); const b=d.rollItem(2,'weapon',10); T.force(null); MD.mythicize(b); out.mythBow={name:b.name,wtype:b.wtype,art:b.art};
  out.named={}; for(const k of ['rootsplitter','last_lantern','sixseven','subterfuge']){ const it=N.normalize({tier:'named',named:k,lvl:10}); out.named[k]=it.wtype; }
  const r=N.normalize({tier:'mythic',set:'storm',art:'polearm',slot:'weapon',name:'Mythic Polearm of the Storm',rarity:5,lvl:10,stats:{dmg:20}}); out.forged={name:r.name,wtype:r.wtype};
  const r2=N.normalize({tier:'mythic',set:'ice',slot:'weapon',name:'Mythic Sword of Ice',rarity:5,lvl:10,stats:{dmg:20},wtype:'bow'}); out.carried={name:r2.name,wtype:r2.wtype};
  const p=window.__meta.packs; d.S.wave=8; let set=null; for(let i=0;i<4000&&!set;i++){ const it=d.rollItem(2,'weapon',12); if(p.of(it)) set=it; } out.set=set?{name:set.name,wtype:set.wtype}:null;
  return out; });
check("a mythic set weapon keeps the type it rolled: Mythic Staff of ... with its staff picture, even on the Knight",SM.myth.wtype==='staff'&&/^Mythic Staff /.test(SM.myth.name)&&/-staff\.jpg$/.test(SM.myth.art||''),JSON.stringify(SM.myth));
check("and a bow one is Mythic Bow of ... with the set's bow picture",SM.mythBow.wtype==='bow'&&/^Mythic Bow /.test(SM.mythBow.name)&&/-bow\.jpg$/.test(SM.mythBow.art||''),JSON.stringify(SM.mythBow));
check("named weapons have fixed types: Rootsplitter sword, The Last Lantern and 6/7 polearm, Subterfuge bow",JSON.stringify(SM.named)==='{"rootsplitter":"sword","last_lantern":"polearm","sixseven":"polearm","subterfuge":"bow"}',JSON.stringify(SM.named));
check("a forged hideout record keeps its art's type (polearm); a record carrying wtype keeps it (bow) and is renamed to say it",SM.forged.wtype==='polearm'&&SM.carried.wtype==='bow'&&SM.carried.name==='Mythic Bow of Ice',JSON.stringify([SM.forged,SM.carried]));
check("an ordinary set piece is typed like any drop",SM.set&&['sword','polearm','staff','bow'].includes(SM.set.wtype),JSON.stringify(SM.set));
// ---- model, picture, emblem follow the type, not the hero
const MP={}; for(const h of ['knight','witch','troll']){ await pick(page,h);
  MP[h]=await page.evaluate(()=>{ const T=window.__typed, d=window.__dd, W=window.__weapons, E=window.__emblem, P=window.__plainPics, out={};
    for(const t of ['sword','polearm','staff','bow']){ T.force(t); const it=d.rollItem(1,'weapon',10); T.force(null); it.name='Keen '+T.bases()[t][1]; it.rarity=1;
      out[t]={model:W.heldFor(it),pic:P.of(it),em:E.slotIcon(it),art:window.__meta.packs.artHtml(it)}; }
    const set=window.__mythic.normalize({tier:'mythic',set:'void',slot:'weapon',name:'Mythic Bow of the Void',rarity:5,lvl:10,stats:{dmg:20},wtype:'bow'}); out.set={model:W.heldFor(set),art:window.__meta.packs.artHtml(set)};
    return out; }); }
const same=k=>['witch','troll'].every(h=>JSON.stringify(MP[h][k])===JSON.stringify(MP.knight[k]));
check("the model in the hand follows the type on every hero: sword -> a sword, polearm -> polearm-*, staff -> staff-*, bow -> bow-*",['knight','witch','troll'].every(h=>!/^(staff|bow|polearm)-/.test(MP[h].sword.model)&&/^polearm-/.test(MP[h].polearm.model)&&/^staff-/.test(MP[h].staff.model)&&/^bow-/.test(MP[h].bow.model)),JSON.stringify(MP.knight)+' | '+JSON.stringify(MP.troll));
check("the plain picture follows the type on every hero (plain/<type>-2.jpg for all four types)",['sword','polearm','staff','bow'].every(t=>same(t)&&/plain\/(\w+)-2\.jpg$/.test(MP.knight[t].pic)&&MP.knight[t].pic.includes('plain/'+t+'-2.jpg')),JSON.stringify(['sword','polearm','staff','bow'].map(t=>MP.knight[t].pic)));
check("the emblem follows the type: 🗡️ 🔱 🪄 🏹 whoever plays",['knight','witch','troll'].every(h=>MP[h].sword.em==='🗡️'&&MP[h].polearm.em==='🔱'&&MP[h].staff.em==='🪄'&&MP[h].bow.em==='🏹'),JSON.stringify(MP.witch));
check("a set bow shows the set's bow model and picture on the Knight and the Witch alike",same('set')&&/^bow-/.test(MP.knight.set.model)&&/void-bow\.jpg/.test(MP.knight.set.art),JSON.stringify(MP.knight.set));
// a real equip on the Ranger mounts a bow; the Knight's polearm mounts a polearm
const EQ=await page.evaluate(async()=>{ const T=window.__typed, d=window.__dd, M=window.__meta, W=window.__weapons, out={};
  await window.__heroes.select('troll'); for(let i=0;i<300&&!(d.heroModel()&&d.heroModel().label.includes('Ranger'));i++) await new Promise(r=>setTimeout(r,50));
  T.force('bow'); const b=d.rollItem(2,'weapon',10); T.force(null); M.giveItem(b); out.bowEq=M.equip(b.id); for(let i=0;i<200;i++){ d.step(1/60,1); if(W.state().bow) break; await new Promise(r=>setTimeout(r,25)); } out.bow=W.state().bow;
  await window.__heroes.select('knight'); for(let i=0;i<300&&!(d.heroModel()&&d.heroModel().label.includes('Knight'));i++) await new Promise(r=>setTimeout(r,50));
  T.force('polearm'); const p=d.rollItem(2,'weapon',10); T.force(null); M.giveItem(p); out.poleEq=M.equip(p.id); for(let i=0;i<200;i++){ d.step(1/60,1); if(/^polearm-/.test(W.state().key)) break; await new Promise(r=>setTimeout(r,25)); } out.key=W.state().key;
  return out; });
check("equipped: the Ranger's bow mounts as a bow; the Knight's polearm mounts as a polearm model",EQ.bowEq&&EQ.bow&&EQ.poleEq&&/^polearm-/.test(EQ.key),JSON.stringify(EQ));
// ---- wrong-type equip refused: the bag (and its Equip button), the Tab sheet, Equip as 2nd
const RF=await page.evaluate(async()=>{ const T=window.__typed, d=window.__dd, M=window.__meta, out={}; d.S.phase='build';
  T.force('bow'); const bow=d.rollItem(2,'weapon',10); T.force('staff'); const staff=d.rollItem(2,'weapon',10); T.force(null); M.giveItem(bow); M.giveItem(staff); window.__T={bow:bow.id,staff:staff.id};
  const before=d.gear().weapon&&d.gear().weapon.id; out.bowEq=M.equip(bow.id); out.unchanged=(d.gear().weapon&&d.gear().weapon.id)===before; out.inBag=M.bag().some(b=>b.id===bow.id); out.refused=T.report().refused;
  window.__tavern.open(); window.__tavern.tab('bag'); window.__tavern.select(bow.id,'bag'); await new Promise(r=>setTimeout(r,120));
  const btn=document.querySelector('#tv-detail [data-act="equip"]'); out.btn=btn?{disabled:btn.disabled,text:btn.textContent}:null; window.__tavern.close();
  window.__doll.open(); window.__doll.select(staff.id,'bag'); await new Promise(r=>setTimeout(r,120)); const db=document.querySelector('#doll .tw-no'); out.doll=db?{disabled:db.disabled,text:db.textContent}:null;
  db&&db.click(); out.dollUnchanged=(d.gear().weapon&&d.gear().weapon.id)===before; window.__doll.close();
  return out; });
check("the bag: the Knight cannot equip a bow (refused, still in the bag, his weapon unchanged)",RF.bowEq===false&&RF.unchanged&&RF.inBag&&RF.refused>0,JSON.stringify(RF));
check("the bag's Equip button is a disabled picture: 🚫 🏹 ➜ 🌲",RF.btn&&RF.btn.disabled&&RF.btn.text.includes('🚫')&&RF.btn.text.includes('🏹')&&RF.btn.text.includes('🌲'),JSON.stringify(RF.btn));
check("the Tab sheet: the staff's EQUIP is a disabled picture (🚫 🪄 ➜ 🧙) and does nothing",RF.doll&&RF.doll.disabled&&RF.doll.text.includes('🪄')&&RF.doll.text.includes('🧙')&&RF.dollUnchanged,JSON.stringify(RF.doll));
const W2=await page.evaluate(async()=>{ const T=window.__typed, d=window.__dd, M=window.__meta, D=window.__dualwield, N=window.__mythic, out={};
  T.force('sword'); const main=d.rollItem(2,'weapon',10); T.force(null); M.giveItem(main); M.equip(main.id);
  const ring=N.normalize({tier:'named',named:'twotimer',lvl:20}); M.giveItem(ring); M.equip(ring.id);
  const mk=t=>{ T.force(t); const it=d.rollItem(2,'weapon',10); T.force(null); M.giveItem(it); return it; };
  out.pole=D.equip2(mk('polearm').id); out.bow=D.equip2(mk('bow').id); out.sword=D.equip2(mk('sword').id); out.w2=d.gear().weapon2&&d.gear().weapon2.wtype;
  await window.__heroes.select('witch'); const ring2=N.normalize({tier:'named',named:'toil_n_trouble',lvl:20}); M.giveItem(ring2); M.equip(ring2.id);
  out.wSword=D.equip2(mk('sword').id); out.wStaff=D.equip2(mk('staff').id); return out; });
check("Equip as 2nd: the Knight's 2nd is a sword only (polearm and bow refused)",W2.pole===false&&W2.bow===false&&W2.sword===true&&W2.w2==='sword',JSON.stringify(W2));
check("Equip as 2nd: the Witch's 2nd must be a staff",W2.wSword===false&&W2.wStaff===true,JSON.stringify(W2));
// ---- the dev panel gives every type
const DV=await page.evaluate(()=>{ const P=window.__devpanel, M=window.__meta, out={}; for(const t of ['sword','polearm','staff','bow']){ const it=P.givePlain(t,1,false); out[t]=M.bag().some(b=>b.id===it.id)&&it.wtype===t; }
  const n0=M.bag().length; P.giveSet('weapon','void','bow',false); const it=M.bag()[M.bag().length-1]; out.set=M.bag().length===n0+1&&it.wtype==='bow'&&it.name==='Mythic Bow of the Void'; return out; });
check("the dev panel gives a plain weapon of each type, and a set weapon of the type picked",Object.values(DV).every(Boolean),JSON.stringify(DV));
// ---- another hero's weapon is never this hero's junk, and the card offers no E
const JK=await page.evaluate(()=>{ const T=window.__typed, d=window.__dd, M=window.__meta; T.force('bow'); const it=d.rollItem(0,'weapon',1); T.force(null); it.score=0.1; M.giveItem(it); return M.isJunk?M.isJunk(it):null; });
check("a weak bow is not the Witch's junk (Sell junk never sells another hero's weapon)",JK===false,String(JK));
// ---- ordinary armor / charm / amulet pictures (Matt's plain/<slot>-<step>.jpg): the LONGEST base word picks the step; a set piece is not plain
const PL=await page.evaluate(()=>{ const P=window.__plainPics, mk=(slot,name,x)=>Object.assign({id:'p'+Math.random(),slot,name,rarity:1,lvl:3,stats:{hp:1}},x||{});
  return { harness:P.of(mk('armor','Fine Plate Harness of Life')), tower:P.of(mk('armor','Old Tower Plate')), jerkin:P.of(mk('armor','Worn Jerkin')), amulet:P.of(mk('amulet','Keen Amulet of Mana')), torc:P.of(mk('amulet','Fine Torc')),
    relic:P.of(mk('charm','Fine Relic')), set:P.of(mk('armor','Fine Chainmail of the Void',{setId:'void'})), pet:P.of(mk('familiar','Wisp')) }; });
check("ordinary armor, charm and amulet pieces show Matt's plain pictures by their longest base word (Plate Harness 4, Tower Plate 5, Jerkin 1, Amulet 2, Torc 4, Relic 6); a set piece and a pet are not plain pictures",
  /plain\/armor-4\.jpg$/.test(PL.harness)&&/plain\/armor-5\.jpg$/.test(PL.tower)&&/plain\/armor-1\.jpg$/.test(PL.jerkin)&&/plain\/amulet-2\.jpg$/.test(PL.amulet)&&/plain\/amulet-4\.jpg$/.test(PL.torc)&&/plain\/charm-6\.jpg$/.test(PL.relic)&&PL.set===null&&PL.pet===null,JSON.stringify(PL));
await ctx.close();

// ================= CO-OP: a guest's drop rolls the GUEST's hero =================
let PeerServer=null; try{ ({ PeerServer }=await import("peer")); }catch(e){ console.log("SKIP co-op part -- the `peer` package isn't installed"); }
if(PeerServer){ const sigPort=9647; const sig=PeerServer({port:sigPort,path:"/peerjs",host:"127.0.0.1"}); await sleep(300); const peerOpts={host:"127.0.0.1",port:sigPort,path:"/peerjs"};
  const H=await openPage(h=>{ try{ localStorage.setItem('ddHero',h); }catch(e){} },'knight'), G=await openPage(h=>{ try{ localStorage.setItem('ddHero',h); }catch(e){} },'troll');
  for(const x of [H,G]){ await x.p.goto("http://127.0.0.1:"+PORT+"/?silent&nogate&nosetgate",{timeout:180000}); await x.p.waitForFunction(()=>window.__dd&&window.__net&&window.__typed&&window.__mythicDrops,null,{timeout:180000}); await x.p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); }); }
  const rc="tw-"+Math.random().toString(36).slice(2,8);
  const ho=await H.p.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const gj=await G.p.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  check("co-op: host (Knight) and guest (Ranger) connect",ho.err===null&&gj.err===null,JSON.stringify({ho,gj}));
  const tick=async n=>{ for(let b=0;b<n;b++){ for(const x of [H,G]) await x.p.evaluate(()=>window.__dd.step(1/60,3)); await sleep(20); } };
  await tick(10); for(const x of [H,G]) await x.p.evaluate(()=>{ window.__mythicDrops.set(0,0); window.__dd.setHero(500,500,0); window.__dd.loot.splice(0).forEach(l=>window.__dd.scene.remove(l.mesh)); });
  const n=300; await H.p.evaluate(n=>{ const d=window.__dd; d.S.wave=6; for(let i=0;i<n;i++) d.dropLoot(d.rollItem(0,'weapon'),2,4.6,true); },n);
  for(let i=0;i<80;i++){ if(await G.p.evaluate(n=>window.__dd.loot.length>=n,n)) break; await tick(1); }
  const cnt=p=>p.evaluate(()=>{ const c={sword:0,polearm:0,staff:0,bow:0,n:0,hero:window.__heroes.pick()}; for(const l of window.__dd.loot){ if(l.it.slot!=='weapon') continue; c[l.it.wtype]++; c.n++; } return c; });
  const hc=await cnt(H.p), gc=await cnt(G.p);
  check("co-op: the host's own floor is ~70% Knight types (sword + polearm)",hc.n>=250&&(hc.sword+hc.polearm)/hc.n>.62&&(hc.sword+hc.polearm)/hc.n<.78,JSON.stringify(hc));
  check("co-op: the guest's re-roll of the same drops uses the GUEST's hero -- ~70% bows",gc.hero==='troll'&&gc.n>=250&&gc.bow/gc.n>.62&&gc.bow/gc.n<.78,JSON.stringify(gc));
  await H.ctx.close(); await G.ctx.close(); try{ sig.close(); }catch(e){} }

check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,4)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
