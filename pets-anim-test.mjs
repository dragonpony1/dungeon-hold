// ===== build 523 prep: Matt's flight pack. The Bat and the Fire Imp are rigged now and fly their own loop (Winged_Flight_Loop / Magic_Flight_Loop), and the FROST FOX is a new pet:
// it swoops and bites like the Bat, and every bite freezes the mob (60% speed for 2 s, a boss 85%) with a small frost burst.
//  * bat / imp / fox load as skinned models, each copy with its own skeleton and its own mixer playing its clip; the clip time advances while the pet is out
//  * the code wing beat (85b-petanim.js) is off for them
//  * the 2nd pet (Beast Mode / Malamute ring) animates too, on its own mixer
//  * a fox bite slows the mob for about 2 s (the Frost Spire's chillT/chillK: no deeper than 60%, a boss 85%), and leaves a frost burst
//  * the fox drops (famKind, BASES, rolls), its card picture loads, the dev panel lists it
//  * co-op: a guest's fox bite slows the HOST's mob, and a partner's animated pet animates on the host
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=await serve(8958,{dist:process.env.DIST||"./dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:960,height:600}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:8958/?silent&ownweapons&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__familiar&&window.__foxfrost&&window.__tworings,null,{timeout:120000});
const K=["Bat","Fire Imp","Frost Fox"];
await page.evaluate(K=>{ for(const k of K) window.__familiar.build({name:"Fine "+k,rarity:2,slot:"familiar"}); },K);
await page.waitForFunction(K=>K.every(k=>window.__familiar.glb().includes(k)),K,{timeout:120000});

// ---- the models
const m=await page.evaluate(K=>{ const out={}; for(const k of K){ const a=window.__familiar.build({name:"Fine "+k,rarity:2,slot:"familiar"}), b=window.__familiar.build({name:"Fine "+k,rarity:2,slot:"familiar"});
    const skins=r=>{ const l=[]; r.traverse(o=>{ if(o.isSkinnedMesh&&!o.userData.isOL) l.push(o); }); return l; }; const sa=skins(a), sb=skins(b);
    const own=sa.length>0&&sa.every(s=>{ let n=s.skeleton.bones[0]; while(n&&n!==a) n=n.parent; return n===a; });   // the copy's skeleton is its own bones, not the template's
    let patched=false; a.traverse(o=>{ if(o.material&&!Array.isArray(o.material)&&o.material.__petAnim) patched=true; });
    out[k]={skinned:sa.length,own,separate:sa.length&&sb.length&&sa[0].skeleton!==sb[0].skeleton,mixer:!!a.userData.mixer&&a.userData.mixer!==b.userData.mixer,clip:a.userData.clip,running:!!(a.userData.action&&a.userData.action.isRunning()),loop:a.userData.action&&a.userData.action.loop===THREE.LoopRepeat,animated:!!a.userData.animated,patched}; }
  return out; },K);
check("the Bat, Fire Imp and Frost Fox load SKINNED, each copy on its own skeleton and its own mixer",K.every(k=>m[k].skinned>0&&m[k].own&&m[k].separate&&m[k].mixer),JSON.stringify(m));
check("each plays its own flight loop, looping (Winged_Flight_Loop / Magic_Flight_Loop)",m.Bat.clip==="Winged_Flight_Loop"&&m["Fire Imp"].clip==="Magic_Flight_Loop"&&m["Frost Fox"].clip==="Magic_Flight_Loop"&&K.every(k=>m[k].running&&m[k].loop),JSON.stringify(m));
check("the code wing beat (85b-petanim) is OFF for them: no shader patch, not marked animated",K.every(k=>!m[k].animated&&!m[k].patched),JSON.stringify(m));
const still=await page.evaluate(()=>{ const g=window.__familiar.build({name:"Fine Storm Drake",rarity:2,slot:"familiar"}); return {mixer:!!g.userData.mixer}; });
check("a pet without its own clip keeps the old way (no mixer)",!still.mixer,JSON.stringify(still));

// ---- in the hall: the clip time advances, the pose actually changes
const run=await page.evaluate(K=>{ const d=window.__dd, F=window.__familiar; d.start(); d.setHero(0,10,Math.PI); d.step(1/60,10); const out={};
  for(const k of K){ const it=d.rollItem(2,"familiar",8); it.name="Runed "+k; d.gear().familiar=it; d.applyGear(); d.step(1/60,5); const g=F.model(); const u=g.userData;
    let bone=null; g.traverse(o=>{ if(!bone&&o.isBone&&o.parent&&o.parent.isBone) bone=o; }); const q0=bone.quaternion.clone(); const t0=u.action.time;
    d.step(1/60,20); const t1=u.action.time; out[k]={kind:u.kind,t0:+t0.toFixed(3),t1:+t1.toFixed(3),adv:+(((t1-t0)+u.action.getClip().duration)%u.action.getClip().duration).toFixed(3),boneMoved:+(1-Math.abs(q0.dot(bone.quaternion))).toExponential(2),ticking:F.mixing()}; }
  return out; },K);
check("in the hall each pet's clip time advances with the game (20 frames = 1/3 s)",K.every(k=>run[k].kind===k&&Math.abs(run[k].adv-20/60)<.02),JSON.stringify(run));
check("and its bones move (the pose changes)",K.every(k=>+run[k].boneMoved>1e-7),JSON.stringify(run));

// ---- the 2nd pet animates too (Beast Mode opens the 2nd slot)
const two=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta, T=window.__tworings; const ring=window.__mythic.normalize({tier:'named',named:'beast_mode',lvl:10}); M.giveItem(ring); M.equip(ring.id);
  const f1=d.rollItem(2,"familiar",8); f1.name="Runed Fire Imp"; d.gear().familiar=f1; const f2=d.rollItem(2,"familiar",8); f2.name="Runed Cave Bat"; d.gear().familiar2=f2; d.applyGear(); d.step(1/60,10);
  const p2=T.fam2(), p1=T.fam1(); if(!p2||!p2.g) return {none:true,ring:T.ringOn()}; const u=p2.g.userData; const t0=u.action?u.action.time:null; d.step(1/60,30); const t1=u.action?u.action.time:null;
  return {ring:T.ringOn(),kind:u.kind,clip:u.clip,t0,t1,adv:t1!=null?+(((t1-t0)+u.action.getClip().duration)%u.action.getClip().duration).toFixed(3):null,ownMixer:!!(p1&&p1.g&&p1.g.userData.mixer!==u.mixer),inScene:!!p2.g.parent}; });
check("the 2nd pet (a Bat with Beast Mode) flies its own loop too, on its own mixer, ticked once a frame",two.ring&&two.kind==="Bat"&&two.clip==="Winged_Flight_Loop"&&Math.abs(two.adv-.5)<.02&&two.ownMixer&&two.inScene,JSON.stringify(two));
const rl=await page.evaluate(()=>{ const i=window.__ringlook.info(); return i.pets.map(p=>p&&{look:p.look,tint:p.tint,rim:p.rim,scale:p.scale}); });
check("Beast Mode's look dresses both rigged pets (tint, rim, bigger)",rl[0]&&rl[1]&&rl.every(p=>p.look==="beast_mode"&&p.tint>0&&p.rim>0&&p.scale>1.1),JSON.stringify(rl));
await page.evaluate(()=>{ const d=window.__dd; d.gear().familiar2=null; d.gear().charm=null; d.applyGear(); d.step(1/60,5); });

// ---- the fox bite freezes
const bite=await page.evaluate(()=>{ const d=window.__dd, F=window.__familiar, X=window.__foxfrost; d.enemies.slice().forEach(e=>{ e.dead=1; }); d.enemies.length=0;
  const it=d.rollItem(2,"familiar",8); it.name="Runed Frost Fox"; it.stats={fdmg:30,frate:30}; d.gear().familiar=it; d.applyGear(); d.setHero(0,5,0); d.step(1/60,30);
  const e=d.spawn("goblin","N"); e.x=0; e.z=10; e.y=0; e.hp=e.max=99999; e.dmg=0; e.atk=999; e.holdT=1e9; const n0=X.count(); const hp0=e.hp; let at=-1, sw=false, minK=1;
  for(let f=0;f<60*4&&at<0;f++){ d.step(1/60,1); if(F.swoop()) sw=true; if(e.chillT>0){ at=f; } }
  const after={chillT:+(e.chillT||0).toFixed(2),chillK:e.chillK,spd:(()=>{ const h=e.holdT; e.holdT=0; const v=+(d.mobSpd(e)/e.spd).toFixed(2); e.holdT=h; return v; })(),hp:hp0-e.hp,bursts:X.count().bursts-n0.bursts,live:X.live()};
  // every later bite refreshes the freeze, never deeper than 60%
  for(let f=0;f<60*6;f++){ d.step(1/60,1); if(e.chillT>0) minK=Math.min(minK,e.chillK); }
  const chills=X.count().chills-n0.chills; e.holdT=0; d.gear().familiar=null; d.applyGear(); d.step(1/60,1); const t0=e.chillT; d.step(1/60,Math.ceil(t0*60)+2);
  return {sw,at,after,minK,chills,thawed:{chillT:e.chillT,chillK:e.chillK},pool:X.pooled()}; });
check("the fox swoops out and bites: the mob is frozen for ~2 s at 60% speed and takes the bite",bite.sw&&bite.at>=0&&Math.abs(bite.after.chillT-2)<.05&&bite.after.chillK===.6&&bite.after.spd===.6&&bite.after.hp>0,JSON.stringify(bite));
check("each bite leaves a small frost burst (pooled)",bite.after.bursts>=1&&bite.after.live>=1&&bite.pool<=8,JSON.stringify(bite));
check("more bites refresh it but it never goes past the normal cap (60%), and it thaws ~2 s after the last",bite.chills>=2&&bite.minK===.6&&bite.thawed.chillT===0&&bite.thawed.chillK===1,JSON.stringify(bite));
const boss=await page.evaluate(()=>{ const X=window.__foxfrost; const b={kind:'cyclops',spd:1,x:0,z:0}, s={kind:'goblin',spd:1,x:0,z:0,chillT:.5,chillK:.4}; X.chill(b,2); X.chill(s,2); return {bossK:b.chillK,bossT:b.chillT,deep:s.chillK,deepT:s.chillT}; });
check("a boss is slowed less (85%); a mob already colder (a 40% chill) stays at its deepest",boss.bossK===.85&&boss.bossT===2&&boss.deep===.4&&boss.deepT===2,JSON.stringify(boss));

// ---- it drops, has its picture, and the dev panel lists it
const drop=await page.evaluate(async()=>{ const X=window.__foxfrost; const names={}; for(let i=0;i<600;i++){ const it=X.roll(0,"familiar",5); const k=X.kindOf(it); names[k]=(names[k]||0)+1; }
  const fox=X.roll; let foxIt=null; for(let i=0;i<200&&!foxIt;i++){ const it=X.roll(1,"familiar",6); if(it.name.includes("Frost Fox")) foxIt=it; }
  const pic=window.__petPics["Frost Fox"]; const src="hideout/assets/hideout/items/pets/"+pic+".jpg"; const img=await new Promise(r=>{ const im=new Image(); im.onload=()=>r({w:im.naturalWidth,h:im.naturalHeight}); im.onerror=()=>r(null); im.src=src; });
  window.__devpanel.toggle(); const opt=!!document.querySelector('#dp-fam option[value="Frost Fox"]'); window.__devpanel.toggle();
  return {kind:X.kindOf({name:"Sturdy Frost Fox"}),bases:X.bases(),names,foxName:foxIt&&foxIt.name,desc:foxIt&&window.__dd.statStr(foxIt),pic,img,opt}; });
check("'Frost Fox' in a name makes a Frost Fox (famKind), and BASES has it",drop.kind==="Frost Fox"&&drop.bases.includes("Frost Fox"),JSON.stringify(drop.bases));
check("it drops: it shares the Cave Bat's band (common/uncommon pets roll as a fox about half the time)",drop.names["Frost Fox"]>60&&drop.names.Bat>60&&!!drop.foxName,JSON.stringify(drop.names)+" "+drop.foxName);
check("its card line says what it does",/freezes/.test(drop.desc||""),drop.desc);
check("its card picture (pets/fox.jpg) loads",drop.pic==="fox"&&drop.img&&drop.img.w>16,JSON.stringify(drop.img));
check("the dev panel's familiar picker lists the Frost Fox",drop.opt);
const real=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors (solo)",real.length===0,real.slice(0,3).join(" | "));
await browser.close();

// ---- CO-OP: a guest's fox bite slows the host's mob; a partner's rigged pet animates on the host
let PeerServer; try{ ({ PeerServer }=await import("peer")); }catch(e){ console.log("SKIP co-op part: the `peer` package isn't installed"); }
if(PeerServer){
  const sigPort=9527; const sig=PeerServer({port:sigPort,path:"/peerjs",host:"127.0.0.1"}); await sleep(300); const peerOpts={host:"127.0.0.1",port:sigPort,path:"/peerjs"};
  const b2=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errs=[];
  const hostPage=await (await b2.newContext()).newPage(), guestPage=await (await b2.newContext()).newPage();
  for(const p of [hostPage,guestPage]){ p.on("pageerror",e=>errs.push(String(e))); await p.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"})); await p.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} }); }
  for(const p of [hostPage,guestPage]){ await p.goto("http://127.0.0.1:8958/?silent&ownweapons&nogate",{timeout:120000}); await p.waitForFunction(()=>window.__dd&&window.__net&&window.__familiar&&window.__party,null,{timeout:120000}); }
  for(const p of [hostPage,guestPage]) await p.evaluate(()=>{ window.__freeze=true; try{ window.__trainer.skip(); }catch(e){} window.__dd.start(); window.__dd.step(1/60,30); });
  const tickBoth=async(batches=6,size=5)=>{ for(let b=0;b<batches;b++){ for(let i=0;i<size;i++){ await hostPage.evaluate(()=>window.__dd.step(1/60,1)); await guestPage.evaluate(()=>window.__dd.step(1/60,1)); } await sleep(20); } };
  const rc="petanim-"+Math.random().toString(36).slice(2,8);
  const ho=await hostPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.host(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  const gj=await guestPage.evaluate(({rc,peerOpts})=>new Promise(res=>window.__net.join(rc,(err,id)=>res({err:err?String(err):null,id}),peerOpts)),{rc,peerOpts});
  check("co-op: host and guest connect",!ho.err&&!gj.err,JSON.stringify({ho,gj})); const gid=gj.id;
  await hostPage.evaluate(()=>window.__dd.setHero(0,-25,0)); await guestPage.evaluate(()=>window.__dd.setHero(0,5,0)); await tickBoth(10,5);
  // the guest wears a Frost Fox
  await guestPage.evaluate(()=>{ const d=window.__dd, M=window.__meta; const it=d.rollItem(2,"familiar",8); it.name="Runed Frost Fox"; it.stats={fdmg:30,frate:30}; it.id="gfox"; M.giveItem(it); M.equip(it.id); d.step(1/60,5); });
  for(let i=0;i<60;i++){ await tickBoth(1,5); const ok=await guestPage.evaluate(()=>{ const g=window.__familiar.model(); return !!(g&&g.userData.glb&&g.userData.kind==="Frost Fox"); }); if(ok) break; await sleep(100); }
  // a partner's rigged pet animates on the host
  await hostPage.evaluate(()=>window.__familiar.build({name:"Fine Frost Fox",rarity:2,slot:"familiar"}));
  let pup=null, pup2=null; for(let i=0;i<60;i++){ await tickBoth(1,5); pup=await hostPage.evaluate(id=>window.__party.get(id),gid); if(pup&&pup.familiarKind==="Frost Fox"&&pup.familiarClip) break; await sleep(120); }
  await tickBoth(4,5); pup2=await hostPage.evaluate(id=>window.__party.get(id),gid);
  const adv=pup&&pup2&&pup.familiarClip&&pup2.familiarClip?+(((pup2.familiarClip.t-pup.familiarClip.t)+4.0333)%4.0333).toFixed(3):null;
  check("co-op: the guest's Frost Fox shows on the host's screen flying its own loop (clip time advancing)",pup2&&pup2.familiarKind==="Frost Fox"&&pup2.familiarClip&&pup2.familiarClip.name==="Magic_Flight_Loop"&&adv>.2,JSON.stringify({a:pup&&pup.familiarClip,b:pup2&&pup2.familiarClip,adv}));
  // a host mob in front of the guest: the guest's fox bites it, and the HOST's mob freezes
  await hostPage.evaluate(()=>{ const d=window.__dd; d.enemies.length=0; const e=d.spawn("goblin","N"); e.x=0; e.z=9; e.y=0; e.hp=e.max=99999; e.dmg=0; e.atk=999; e.holdT=1e9; e.__testFox=true; });
  let hm=null; for(let i=0;i<80;i++){ await tickBoth(1,5); hm=await hostPage.evaluate(()=>{ const e=window.__dd.enemies.find(e=>e.__testFox); return e?{chillT:+(e.chillT||0).toFixed(2),chillK:e.chillK,hp:e.max-e.hp,id:e.__coopId}:null; }); if(hm&&hm.chillT>0) break; await sleep(40); }
  const gs=await guestPage.evaluate(()=>window.__foxfrost.count());
  check("co-op: a guest's fox bite slows the HOST's mob (60%, ~2 s) and hurts it",hm&&hm.chillT>1.5&&hm.chillK===.6&&hm.hp>0,JSON.stringify({hm,guestBursts:gs}));
  const real2=errs.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors (co-op)",real2.length===0,real2.slice(0,3).join(" | "));
  await b2.close(); sig.close&&sig.close();
}
server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(0);
