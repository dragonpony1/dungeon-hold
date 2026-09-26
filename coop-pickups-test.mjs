// ===== CO-OP (phase 12): loot and mana orbs, now real for a guest, not just for the host. "i joined him and never
// saw any loot drop" turned out to share its exact root cause with the earlier hit-feedback bug (phase 11): kill(e)
// (game.js) spawns both into the host's own loot/orbs arrays, and updateLoot/updateOrbs (game.js) only ever check
// proximity against the LOCAL hero -- so a guest's own local, always-empty arrays never grow. Puppets alone would
// only be half the fix; loot and orbs are meant to be COLLECTED, into something genuinely this player's own, not
// just looked at. And separately: "mana seems to be shared, we need to change that -- split into separate pools per
// player." Both land together here since orb pickup is exactly where a guest's own mana pool gets earned into.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
let PeerServer;
try { ({ PeerServer } = await import("peer")); }
catch(e) { console.log("SKIP coop-pickups-test.mjs — the `peer` package isn't installed (npm i peer)."); process.exit(0); }

const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const near=(a,b,eps)=>Math.abs(a-b)<=eps;

const sigPort=9471;
const sig=PeerServer({ port:sigPort, path:"/peerjs", host:"127.0.0.1" });
await new Promise(r=>sig.on('connection',()=>{}) && setTimeout(r,300));
const peerOpts={ host:"127.0.0.1", port:sigPort, path:"/peerjs" };
const server=await serve(8896);
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const hostCtx=await browser.newContext(), guestCtx=await browser.newContext();
const hostPage=await hostCtx.newPage(), guestPage=await guestCtx.newPage();
const errors=[]; for(const p of [hostPage,guestPage]) p.on("pageerror",e=>errors.push(String(e)));

for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8896/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__combat&&window.__pickupsync,null,{timeout:60000}); }
for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,30); });

const roomCode="pick-"+Math.random().toString(36).slice(2,8);
const hostOpen=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
const guestJoin=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc:roomCode,peerOpts});
check("host and guest connect",hostOpen.err===null&&guestJoin.err===null,JSON.stringify({hostOpen,guestJoin}));
const guestId=guestJoin.id;

async function tickBoth(batches=6,size=5){ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await new Promise(r=>setTimeout(r,20)); } }
async function walkGuestTo(tx,tz,maxBatches=50){
  for(let b=0;b<maxBatches;b++){
    const g=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId); if(!g) return false;
    const dx=tx-g.x, dz=tz-g.z, d=Math.hypot(dx,dz);
    if(d<0.6){ await guestPage.evaluate(()=>window.__dd.setKeys({w:0})); return true; }
    const yaw=Math.atan2(dx,dz);
    await guestPage.evaluate(y=>{ window.__dd.setCam(y,.42,8); window.__dd.setKeys({w:1}); },yaw);
    await tickBoth(1,5);
  }
  await guestPage.evaluate(()=>window.__dd.setKeys({w:0}));
  return false;
}

await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0));   // keep the host's own hero clear of anything meant for the guest
await guestPage.evaluate(()=>window.__dd.setCam(0,.42,8));
await tickBoth(6,5);   // register the guest's simulated hero (and its baseline guestMana) on the host
await guestPage.waitForTimeout(4300);   // let 65-tavernroom.js's one-shot new-player toast burn off first, same as other coop suites

const baseline=await hostPage.evaluate(id=>window.__combat.guestMana(id),guestId);
const hostStartingMana=await hostPage.evaluate(()=>window.__dd.status().mana);   // map().mana doesn't exist -- the host's own S.mana, read before anything has spent or earned a cent of it, is the same MAP.mana baseline both started from
check("a freshly-connected guest starts with their OWN pool at the hall's own baseline mana",baseline===hostStartingMana,JSON.stringify({baseline,hostStartingMana}));

// ==== 1: mana is genuinely separate -- boosting the host's own pool changes nothing for the guest's, and a
// guest's own spend comes out of THEIR pool, never touches the host's real one ====
await hostPage.evaluate(()=>window.__dd.addMana(50000));
const hostManaBoosted=await hostPage.evaluate(()=>window.__dd.status().mana);
check("host's own mana really did jump", hostManaBoosted>40000, "mana="+hostManaBoosted);
const guestManaUnaffected=await hostPage.evaluate(id=>window.__combat.guestMana(id),guestId);
check("the guest's own pool is completely unaffected by the host's own mana changing",guestManaUnaffected===baseline,JSON.stringify({guestManaUnaffected,baseline}));

const defKind=await guestPage.evaluate(()=>Object.keys(window.__dd.DEFS)[0]);
const defCost=await hostPage.evaluate(k=>window.__dd.DEFS[k].mana,defKind);
const gPos=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
await guestPage.evaluate(({k,pos})=>{ window.__net.send('place',{kind:k,x:pos.x+3,z:pos.z+3,yaw:0}); },{k:defKind,pos:gPos});
await tickBoth(4,5);
const guestManaAfterPlace=await hostPage.evaluate(id=>window.__combat.guestMana(id),guestId);
const hostManaAfterGuestPlace=await hostPage.evaluate(()=>window.__dd.status().mana);
check("placing a defense spends the ACTING guest's own mana, not a shared pool",
  near(guestManaAfterPlace,baseline-defCost,.05),JSON.stringify({guestManaAfterPlace,expected:baseline-defCost}));
check("the host's own (boosted) mana is completely untouched by the guest's own spend",
  hostManaAfterGuestPlace===hostManaBoosted,JSON.stringify({hostManaAfterGuestPlace,hostManaBoosted}));

// ==== 2: an orb, dropped on the host, is picked up by the guest into THEIR OWN mana pool -- not the host's ====
const orbSpawn=await hostPage.evaluate(pos=>{ const e=window.__dd.spawn('goblin','N'); e.x=pos.x; e.z=pos.z-4; e.y=0; e.mana=3; window.__dd.kill(e); return {orbs:window.__dd.orbs.length,x:e.x,z:e.z}; },gPos);
check("killing a real enemy on the host really does spawn real orbs",orbSpawn.orbs>=3,JSON.stringify(orbSpawn));
for(let i=0;i<90;i++) await hostPage.evaluate(()=>window.__dd.step(1/60,1));   // let physics settle (real gravity/bounce, updateOrbs) before reading where they actually landed
const orbPos=await hostPage.evaluate(()=>{ const o=window.__dd.orbs[0]; return o?{x:o.x,z:o.z}:null; });
check("an orb survives long enough to have a real settled position",!!orbPos,JSON.stringify(orbPos));
const hostManaBeforeOrb=await hostPage.evaluate(()=>window.__dd.status().mana);
const guestManaBeforeOrb=await hostPage.evaluate(id=>window.__combat.guestMana(id),guestId);
const orbCountBefore=await hostPage.evaluate(()=>window.__dd.orbs.length);
const walkedToOrb=orbPos&&await walkGuestTo(orbPos.x,orbPos.z);
check("the guest can actually walk to where the real orb landed",walkedToOrb);
await tickBoth(6,5);
const orbCountAfter=await hostPage.evaluate(()=>window.__dd.orbs.length);
check("the host's real orb count actually dropped once the guest picked it up",orbCountAfter<orbCountBefore,JSON.stringify({orbCountBefore,orbCountAfter}));
const guestManaAfterOrb=await hostPage.evaluate(id=>window.__combat.guestMana(id),guestId);
check("the picked-up orb credited the GUEST's own mana pool",guestManaAfterOrb>guestManaBeforeOrb,JSON.stringify({guestManaBeforeOrb,guestManaAfterOrb}));
const hostManaAfterOrb=await hostPage.evaluate(()=>window.__dd.status().mana);
check("...and did NOT touch the host's own mana at all -- it was the guest's orb to collect",hostManaAfterOrb===hostManaBeforeOrb,JSON.stringify({hostManaBeforeOrb,hostManaAfterOrb}));

// ==== 3: a real dropped item, picked up by the guest, lands in THEIR OWN bag -- not the host's ====
await guestPage.evaluate(()=>{ window.__meta.reset(); });
const guestBagBefore=await guestPage.evaluate(()=>window.__meta.bag().length);
const hostBagBefore=await hostPage.evaluate(()=>window.__meta.bag().length);
const gPos2=await hostPage.evaluate(id=>window.__combat.guestHero(id),guestId);
const dropped=await hostPage.evaluate(pos=>{ const it=window.__dd.rollItem(1); it.name='Test Coop Drop'; const l=window.__dd.dropLoot(it,pos.x,pos.z-6,true); return {id:it.id,name:it.name,x:l.x,z:l.z}; },gPos2);
for(let i=0;i<60;i++) await hostPage.evaluate(()=>window.__dd.step(1/60,1));   // let it settle to the floor before reading its real position
const lootPos=await hostPage.evaluate(()=>{ const l=window.__dd.loot[0]; return l?{x:l.x,z:l.z}:null; });
const walkedToLoot=lootPos&&await walkGuestTo(lootPos.x,lootPos.z);
check("the guest can actually walk to where the real dropped item landed",walkedToLoot);
await tickBoth(6,5);
const lootCountAfter=await hostPage.evaluate(()=>window.__dd.loot.length);
check("the host's real loot list actually shrank once the guest picked it up",lootCountAfter===0,"loot.length="+lootCountAfter);
const guestBagAfter=await guestPage.evaluate(()=>window.__meta.bag().length);
const hasDrop=await guestPage.evaluate(name=>window.__meta.bag().some(it=>it.name===name),dropped.name);
check("the item landed in the GUEST's own bag",guestBagAfter>guestBagBefore&&hasDrop,JSON.stringify({guestBagBefore,guestBagAfter,hasDrop}));
const hostBagAfter=await hostPage.evaluate(()=>window.__meta.bag().length);
check("...and the host's own bag never saw it -- it was the guest's own item, not the host's",hostBagAfter===hostBagBefore,JSON.stringify({hostBagBefore,hostBagAfter}));

// ==== 4: the wave-held bonus credits every connected pool independently, the same bonus each ====
// the host's own hero was parked at (0,-25,0) earlier purely to stay clear of the guest's own hero for section 1's
// nearestHero() checks -- it turns out that's right in this map's own north spawn lane, so a real wave's own
// goblins (and their own real orb drops) pass close enough for the host's OWN local pickup to add unrelated mana
// on top of the wave bonus this section is actually trying to isolate. Somewhere genuinely far outside the map
// avoids that without needing to know every lane's real path.
await hostPage.evaluate(()=>window.__dd.setHero(500,0,500));
await guestPage.evaluate(()=>window.__dd.setCam(0,.42,8));
const hostManaBeforeWave=await hostPage.evaluate(()=>window.__dd.status().mana);
const guestManaBeforeWave=await hostPage.evaluate(id=>window.__combat.guestMana(id),guestId);
const waveNum=await hostPage.evaluate(()=>{ const d=window.__dd; d.startWave(); return d.S.wave; });
const expectedBonus=50+10*waveNum;
const hostPhaseAfterWave=await hostPage.evaluate(()=>{ const d=window.__dd; let guard=0; while(d.S.phase==='wave'&&guard++<600){ d.step(1/60,10); for(const e of d.enemies) if(!e.dead) d.kill(e); } return d.S.phase; });
check("the wave really did clear on the host",hostPhaseAfterWave==='build',hostPhaseAfterWave);
await tickBoth(4,5);
const hostManaAfterWave=await hostPage.evaluate(()=>window.__dd.status().mana);
const guestManaAfterWave=await hostPage.evaluate(id=>window.__combat.guestMana(id),guestId);
check("the host's own mana got the real wave-held bonus",near(hostManaAfterWave-hostManaBeforeWave,expectedBonus,.1),
  JSON.stringify({delta:hostManaAfterWave-hostManaBeforeWave,expectedBonus}));
check("the guest's OWN pool got the SAME bonus too, independently credited",near(guestManaAfterWave-guestManaBeforeWave,expectedBonus,.1),
  JSON.stringify({delta:guestManaAfterWave-guestManaBeforeWave,expectedBonus}));

// ==== 5: the guest's own HUD shows THEIR mana, not the host's ====
const hudMana=await guestPage.evaluate(()=>document.getElementById('mana').textContent);
const guestManaFinal=await hostPage.evaluate(id=>window.__combat.guestMana(id),guestId);
check("the guest's own HUD mana number matches their own tracked pool, not the host's huge one",
  hudMana===String(Math.floor(guestManaFinal))&&hudMana!==String(Math.floor(hostManaAfterWave)),
  JSON.stringify({hudMana,guestManaFinal,hostManaAfterWave}));

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));

await browser.close(); server.close(); sig.close?.();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
