// ===== THE SPECIAL'S CHARGE METER AND LANDING CIRCLE (73-specials.js, build 255). Matt: "the secondary attacks need a charge up meter". A bar above the hotbar fills as the special charges (in the hero's colour), flashes white
// when it goes off, shows the cooldown filling back (dimmer, with the seconds), says READY for a moment, then goes away; a ring on the floor shows what it will cover (round the hero for the Knight and the Fighter,
// on the aim spot for the Witch and the Ranger) with a disc inside growing to it as the charge fills. Checked for all four heroes, and that nothing shows while it is ready and unused.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8894);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await browser.newPage({viewport:{width:1100,height:700}}); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8894/?silent&nogate"); await page.waitForFunction(()=>window.__dd&&window.__heroes&&window.__aim&&window.__specials&&window.__dd.heroModel()&&window.__dd.mobModel("goblin"),null,{timeout:120000});
const WANT_KIND={witch:"staff",fighter:"staff",troll:"bow",knight:null};
const pick=async(id,re)=>{ await page.evaluate(i=>window.__heroes.select(i),id); await page.waitForFunction(r=>new RegExp(r).test(window.__dd.heroModel().label),re,{timeout:90000});
  for(let i=0;i<240;i++){ const k=await page.evaluate(()=>{ window.__dd.step(1/60,1); return window.__aim&&window.__aim.kind(); }); if(k===WANT_KIND[id]) break; await new Promise(r=>setTimeout(r,25)); } };
const HEROES=[["knight","Knight","WHIRLWIND CLEAVE",4],["witch","Witch","STARFALL",5],["fighter","Fighter","HALO SURGE",8],["troll","Ranger","VOLLEY",2.5]];
for(const [id,re,name,R] of HEROES){
  await pick(id,re);
  const r=await page.evaluate(({name})=>{ const d=window.__dd, S=window.__specials; window.__meta.reset&&window.__meta.reset(); d.start(); d.step(1/60,20); for(const e of d.enemies) d.kill(e); d.setHero(0,10,0); d.step(1/60,5); S.forceReady();
    const out={}; d.step(1/60,2); out.idle=S.meter(); out.idleRing=S.ring();   // ready and unused: nothing on screen
    S.press(); d.step(1/60,36); out.half=S.meter(); out.halfRing=S.ring(); out.slow=d.hero.specialSlow;   // 0.6 s of the 1.2 s charge
    d.step(1/60,20); out.late=S.meter(); out.lateRing=S.ring();
    d.step(1/60,20); out.fired=S.meter(); out.firedRing=S.ring();   // it went off (1.2 s in)
    d.step(1/60,30); out.cool=S.meter(); d.step(1/60,60*5); out.cool2=S.meter();
    d.step(1/60,60*4+36); out.ready=S.meter(); d.step(1/60,60*2); out.gone=S.meter(); return out; },{name});
  check(id+": nothing shows while the special is ready and unused",!r.idle.on&&!r.idleRing.on,JSON.stringify([r.idle,r.idleRing]));
  check(id+": charging half way, the bar is about half full with its name and the ring is up (its disc about half grown)",r.half.on&&r.half.state==="charging"&&r.half.label===name&&Math.abs(r.half.fill-.5)<.1&&r.halfRing.visible&&Math.abs(r.halfRing.k-.5)<.1&&r.halfRing.R===R&&r.slow===.5,JSON.stringify([r.half,r.halfRing]));
  check(id+": the bar fills further as the charge goes on, and the ring stays put",r.late.fill>r.half.fill+.2&&r.lateRing.R===R,JSON.stringify([r.late,r.lateRing]));
  check(id+": it flashes full the moment it goes off and the ring is gone",r.fired.state==="fired"&&r.fired.fill===1&&!r.firedRing.visible,JSON.stringify([r.fired,r.firedRing]));
  check(id+": then the cooldown fills back, dimmer, with the seconds left",r.cool.state==="cool"&&r.cool.fill>0&&r.cool2.fill>r.cool.fill&&/\d+s$/.test(r.cool2.label)&&/\u00b7/.test(r.cool2.label),JSON.stringify([r.cool,r.cool2]));
  check(id+": READY shows for a moment when it is back, and then the bar goes away",r.ready.state==="ready"&&/READY/.test(r.ready.label)&&!r.gone.on,JSON.stringify([r.ready,r.gone]));
}
// the aimed ones follow the aim: the ring sits where the special would land; a release before full charge cancels it and clears the bar
await pick("witch","Witch");
const c=await page.evaluate(()=>{ const d=window.__dd, S=window.__specials; d.step(1/60,60*12); S.forceReady(); d.setHero(0,10,0); d.step(1/60,5); S.press(); d.step(1/60,30); const a=S.ring(); const m=S.meter(); S.release(); d.step(1/60,5); return { ringOn:a.visible, spotFar:Math.hypot(a.x-d.hero.x,a.z-d.hero.z), cancelled:S.meter(), ring:S.ring(), cd:S.cooldown() }; });
check("the Witch's ring sits out on her aim spot (not on her), and letting go early clears the bar and the ring with no cooldown spent",c.ringOn&&c.spotFar>1&&!c.cancelled.on&&!c.ring.visible&&c.cd===0,JSON.stringify(c));
const bar=await page.evaluate(()=>{ const b=document.getElementById("specialBar"), hb=document.getElementById("hotbar"); window.__specials.forceReady(); window.__specials.press(); window.__dd.step(1/60,30); const r=b.getBoundingClientRect(), h=hb.getBoundingClientRect(); window.__specials.release(); return { barBottom:Math.round(r.bottom), hotbarTop:Math.round(h.top), overlaps:r.bottom>h.top+1&&r.top<h.bottom&&r.right>h.left&&r.left<h.right, visible:getComputedStyle(b).opacity }; });
check("the bar sits just above the hotbar and does not cover it",!bar.overlaps&&bar.barBottom<=bar.hotbarTop,JSON.stringify(bar));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,2).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
