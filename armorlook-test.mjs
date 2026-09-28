// ===== ARMOR YOU CAN SEE (build 181, parts/staging/72b-armorlook.js): pieces appear on the hero's own rig for whatever
// set the ARMOR SLOT itself carries (shoulders + chest + a short cape), independent of the separate softer/stronger
// body-wide aura that 93-gearsets.js already draws at five pieces and this build now also draws (dimmer) at three.
// Section A runs solo. Section B is a real host + guest pair (needs the `peer` package, like the other co-op suites) and
// checks only the puppet TINT this build adds at the three-piece tier -- full shoulder/chest/cape pieces on a puppet are
// a documented follow-up, not built here (98-party.js keeps no reachable handle on a puppet's bones outside its own
// closure for this file to attach onto).
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer=null; try { ({ PeerServer } = await import("peer")); } catch(e) {}
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8823, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];
async function newPage(ctx){ const p=await (ctx||browser).newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.goto(BASE+"/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__meta&&window.__armorlook&&window.__heroes&&window.__sets&&window.__packs&&window.__mythic&&window.__net,null,{timeout:60000});
  await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); }); return p; }
// one item, forced onto a slot and a set by renaming (the same trick 93-gearsets.js's own makeSet uses)
const setItem=(p,slot,setName)=>p.evaluate(({slot,setName})=>{ const d=window.__dd, M=window.__meta; const it=d.rollItem(2,slot,10); it.rarity=Math.max(it.rarity,2); it.name=it.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' '+setName; M.giveItem(it); const ok=M.equip(it.id); return {ok,id:it.id,name:it.name}; },{slot,setName});
const namedItem=(p,key)=>p.evaluate(key=>{ const d=window.__dd, M=window.__meta; const N=window.__mythic.NAMED[key]; const it={id:'t-'+key+'-'+Math.random().toString(36).slice(2,7),name:N.name,slot:N.slot,rarity:5,lvl:10,stats:Object.assign({},N.stats),named:key,mythic:true,value:400,req:1}; M.giveItem(it); const ok=M.equip(it.id); return {ok,id:it.id}; },key);

// ==== A: solo ====
{
  const page=await newPage();

  // one armor piece of a set, alone: the pieces show; unequip and they're gone. Aura is a separate concern (below) --
  // one piece is nowhere near three, so no shell either
  await page.evaluate(()=>{ window.__meta.reset(); window.__dd.resetGear(); });
  const one=await setItem(page,'armor','of Chaos');
  await page.evaluate(()=>window.__dd.step(1/60,10));
  const look1=await page.evaluate(()=>window.__armorlook.current());
  check("one Chaos armor piece alone: shoulders/chest/cape appear (the armor slot's own set decides the look), no shell yet",one.ok&&look1.key==='set:of Chaos'&&look1.parts===true&&look1.soft.on===false,JSON.stringify({one,look1}));
  await page.evaluate(()=>window.__meta.unequip('armor'));
  await page.evaluate(()=>window.__dd.step(1/60,5));
  const look2=await page.evaluate(()=>window.__armorlook.current());
  check("unequip it: the pieces vanish",look2.key===null&&look2.parts===false,JSON.stringify(look2));

  // plain, setless armor: nothing shows at all
  const plain=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; const it=d.rollItem(0,'armor',5); it.name='Rusty Breastplate'; M.giveItem(it); M.equip(it.id); return it.name; });
  await page.evaluate(()=>window.__dd.step(1/60,5));
  const look3=await page.evaluate(()=>window.__armorlook.current());
  check("plain armor with no set and no name carries no look at all",plain==='Rusty Breastplate'&&look3.key===null&&look3.parts===false,JSON.stringify(look3));
  await page.evaluate(()=>window.__meta.unequip('armor'));

  // the aura tiers: three pieces of one set draw the SOFTER shell (this build); a fourth+fifth hand off to
  // 93-gearsets.js's own full-strength shell, and this build's soft one steps aside
  await page.evaluate(()=>{ window.__meta.reset(); window.__dd.resetGear(); });
  await setItem(page,'weapon','of the Void'); await setItem(page,'charm','of the Void'); const a3=await setItem(page,'armor','of the Void');
  await page.evaluate(()=>window.__dd.step(1/60,10));
  const tier3=await page.evaluate(()=>({active:window.__sets.active(),soft:window.__armorlook.current().soft,mainAura:window.__packs.aura(),parts:window.__armorlook.current().parts}));
  check("three Void pieces: the set is active at tier 3, this build's softer shell is on in the Void's own colour, the full-strength shell (93-gearsets.js) is NOT, and the armor's own pieces show",tier3.active.some(a=>a.name==='of the Void'&&a.tier===3)&&tier3.soft.on===true&&tier3.soft.col===0x8a3dff&&tier3.mainAura.on===false&&tier3.parts===true,JSON.stringify(tier3));
  await setItem(page,'amulet','of the Void'); await setItem(page,'familiar','of the Void');
  await page.evaluate(()=>window.__dd.step(1/60,10));
  const tier5=await page.evaluate(()=>({active:window.__sets.active(),soft:window.__armorlook.current().soft,mainAura:window.__packs.aura()}));
  check("all five: tier 5, this build's softer shell steps aside (off), and the game's own full-strength aura is on instead -- exactly one shell at a time",tier5.active.some(a=>a.name==='of the Void'&&a.tier===5)&&tier5.soft.on===false&&tier5.mainAura.on===true,JSON.stringify(tier5));
  await page.evaluate(()=>window.__meta.unequip('weapon'));
  await page.evaluate(()=>window.__dd.step(1/60,10));
  const tier3again=await page.evaluate(()=>({active:window.__sets.active(),soft:window.__armorlook.current().soft,mainAura:window.__packs.aura()}));
  check("drop back to four... no -- drop one piece off the top: back to three (weapon gone), the full shell turns off and the softer one turns back on",tier3again.active.some(a=>a.name==='of the Void'&&a.tier===3)&&tier3again.soft.on===true&&tier3again.mainAura.on===false,JSON.stringify(tier3again));

  // a hero switch: the look follows THAT hero's own gear (71-herogear.js), not a shared one
  await page.evaluate(()=>{ window.__meta.reset(); window.__dd.resetGear(); });
  await page.evaluate(()=>window.__heroes.select('knight')); await page.evaluate(()=>window.__dd.step(1/60,5));
  await setItem(page,'armor','of Chaos');
  await page.evaluate(()=>window.__dd.step(1/60,10));
  const knightLook=await page.evaluate(()=>window.__armorlook.current());
  await page.evaluate(()=>window.__heroes.select('witch'));
  await page.evaluate(()=>window.__dd.step(1/60,10));
  const witchBare=await page.evaluate(()=>window.__armorlook.current());
  await setItem(page,'armor','of Ice');
  await page.evaluate(()=>window.__dd.step(1/60,10));
  const witchLook=await page.evaluate(()=>window.__armorlook.current());
  await page.evaluate(()=>window.__heroes.select('knight'));
  await page.evaluate(()=>window.__dd.step(1/60,10));
  const knightAgain=await page.evaluate(()=>window.__armorlook.current());
  check("the Knight wears Chaos; switching to the (bare) Witch shows nothing; her own Ice piece shows on her; switching back the Knight still wears his own Chaos -- each hero keeps its own look",
    knightLook.key==='set:of Chaos'&&knightLook.parts===true&&witchBare.key===null&&witchBare.parts===false&&witchLook.key==='set:of Ice'&&witchLook.parts===true&&knightAgain.key==='set:of Chaos'&&knightAgain.parts===true,
    JSON.stringify({knightLook,witchBare,witchLook,knightAgain}));

  // all four heroes actually take the pieces (bones found, nothing thrown) -- troll and the two gnomes and the witch
  const allFour=await page.evaluate(async ids=>{ const d=window.__dd, M=window.__meta; const out={}; for(const id of ['knight','witch','troll','fighter']){ window.__heroes.select(id); for(let i=0;i<10;i++) d.step(1/60,1);
      M.reset(); d.resetGear(); const it=d.rollItem(2,'armor',10); it.name=it.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' of the Storm'; M.giveItem(it); M.equip(it.id); for(let i=0;i<10;i++) d.step(1/60,1);
      out[id]=window.__armorlook.current(); } return out; },null);
  check("all four heroes' rigs take the same look code (Storm, plate family): pieces attach cleanly on each, nothing thrown",['knight','witch','troll','fighter'].every(id=>allFour[id].key==='set:of the Storm'&&allFour[id].parts===true),JSON.stringify(allFour));

  // the two named mythics: bespoke looks, not a generic set style, and Mossheart's chest glows only while its heal is
  // actually running (idle 2s+, 97-mythics.js's own rule) -- not merely while worn
  await page.evaluate(()=>{ window.__meta.reset(); window.__dd.resetGear(); window.__heroes.select('knight'); });
  await page.evaluate(()=>window.__dd.step(1/60,5));
  await namedItem(page,'mossheart_aegis');
  await page.evaluate(()=>window.__dd.step(1/60,5));
  const mossFresh=await page.evaluate(()=>({look:window.__armorlook.current(),glow:window.__armorlook.glow(),idleT:window.__mythic.state().idleT}));
  check("Mossheart Aegis: its own bespoke look (not a generic set style), pieces show at once, but the chest doesn't glow yet (just equipped, not idle 2s)",mossFresh.look.key==='named:mossheart_aegis'&&mossFresh.look.parts===true&&(mossFresh.glow.heal===0||mossFresh.glow.heal===null)&&mossFresh.idleT<2,JSON.stringify(mossFresh));
  const mossHealing=await page.evaluate(()=>{ for(let i=0;i<20;i++) window.__dd.step(1/60,10); return {idleT:window.__mythic.state().idleT,glow:window.__armorlook.glow()}; });
  check("stand still past 2s: the heal is running (97-mythics.js) and the chest emblem is now actually glowing green",mossHealing.idleT>=2&&mossHealing.glow.heal>0,JSON.stringify(mossHealing));
  await page.evaluate(()=>window.__meta.unequip('armor'));
  await namedItem(page,'voidwoven_mantle');
  await page.evaluate(()=>window.__dd.step(1/60,10));
  const voidwoven=await page.evaluate(()=>({look:window.__armorlook.current(),glow:window.__armorlook.glow()}));
  check("Voidwoven Mantle: its own bespoke look, and its cape actually carries star flecks (not a plain cloth panel)",voidwoven.look.key==='named:voidwoven_mantle'&&voidwoven.look.parts===true&&Array.isArray(voidwoven.glow.stars)&&voidwoven.glow.stars.length>0,JSON.stringify(voidwoven));

  await page.close();
}

// ==== B: co-op -- the puppet TINT at the softer three-piece tier (full pieces on a puppet: not built, see the header) ====
if(!PeerServer) console.log("SKIP section B (co-op): the `peer` package isn't installed");
else {
  const sigPort=9723; const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" }); await new Promise(r=>setTimeout(r,300)); const peerOpts={host:"127.0.0.1",port:sigPort,path:"/peerjs"};
  const hostCtx=await browser.newContext(), guestCtx=await browser.newContext(); const hostPage=await newPage(hostCtx), guestPage=await newPage(guestCtx);
  await hostPage.evaluate(()=>{ window.__meta.reset(); window.__dd.resetGear(); });
  await setItem(hostPage,'weapon','of Ice'); await setItem(hostPage,'charm','of Ice'); await setItem(hostPage,'armor','of Ice');
  await hostPage.evaluate(()=>window.__dd.step(1/60,5));
  const rc="armorlook-"+Math.random().toString(36).slice(2,8);
  const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  check("pair connects ("+rc+")",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
  // both pages run under window.__freeze (newPage()'s own setup), so nothing advances on its own between explicit
  // step() calls -- unlike a passive waitForFunction, the 15Hz hero broadcast (99-network.js) and the puppet's own
  // ease-toward-target (98-party.js) both need repeated ticks on BOTH sides, the same loop voidset-test.mjs's own
  // co-op section uses, not a single step then a long passive wait
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  async function stepUntil(check){ for(let i=0;i<60;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,2)); await guestPage.evaluate(()=>window.__dd.step(1/60,2)); await sleep(30); const v=await check(); if(v) return v; } return null; }
  const onGuest3=await stepUntil(()=>guestPage.evaluate(()=>{ const ids=window.__party.list(); if(!ids.length) return null; const p=window.__party.get(ids[0]); return p&&p.ready&&p.glow?p:null; }));
  check("the host's three Ice pieces (tier 3): the guest sees the host's puppet with the DIM shell, told tier 3, not the full-strength one",!!onGuest3&&onGuest3.glow===true&&onGuest3.glowTier===3,JSON.stringify(onGuest3||await guestPage.evaluate(()=>window.__party.list().map(id=>window.__party.get(id)))));
  await setItem(hostPage,'amulet','of Ice'); await setItem(hostPage,'familiar','of Ice');
  const onGuest5=await stepUntil(()=>guestPage.evaluate(()=>{ const ids=window.__party.list(); const p=ids.length?window.__party.get(ids[0]):null; return p&&p.glowTier===5?p:null; }));
  check("all five: the guest's view of the host's puppet steps up to the full-strength tier",!!onGuest5&&onGuest5.glow===true&&onGuest5.glowTier===5,JSON.stringify(onGuest5||await guestPage.evaluate(()=>window.__party.list().map(id=>window.__party.get(id)))));
  await hostCtx.close(); await guestCtx.close(); sig.close&&sig.close();
}

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
