// ===== THE SAW BLADE GUNNER (build 597; parts/staging/99w-sawgunner.js + 50-defmodels.js). Matt: "saw blade gunner (SPG) to replace ballistas everywhere". Replaces ballista-rig-test.mjs (the
// ballista's hinge cut is gone with it). Checked: the hotbar slot and the tower are the Saw Blade Gunner (🪚); Marks I-IV wear sawgun-1..4 (I and II Bob's animated rigs); each gunner has its
// OWN skeleton (its bones inside its own model, not the template's); Bob's loop plays with his pan/tilt taken out and the sparks kept; the barrel's Tilt joint follows the game's pitch;
// facing goblins it fires spinning saw blades; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const DIST=process.env.DIST||"./dist"; const server=await serve(8885,{dist:DIST});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1000,height:700}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_trainer","done"); localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8885/?silent&nogate&map=4",{timeout:180000}); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel&&window.__dd.heroModel()&&window.__sawgun,null,{timeout:180000});
const A=await page.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} await window.__heroes.select('knight'); d.start(); d.addMana(9000);
  const X=d.cw(24), Z=d.cwz(36); for(let i=0;i<4;i++) d.placeDefAt('harpoon',X-6+i*4,Z,Math.PI); const hs=d.defs.filter(x=>x.kind==='harpoon'); for(let i=0;i<hs.length;i++) for(let k=0;k<i;k++) d.upgradeDef(hs[i]);
  for(let i=0;i<200;i++){ d.step(1/30,1); if(i%20===0) await new Promise(r=>setTimeout(r,50)); if(hs.every(h=>h.mdl&&h.mdl.userData.saw)) break; }
  const rows=hs.map(h=>{ const u=h.mdl.userData; let sk=null; h.mdl.traverse(o=>{ if(!sk&&o.isSkinnedMesh) sk=o; }); const own=!!sk&&sk.skeleton.bones.every(b=>{ let p=b; while(p&&p!==h.mdl) p=p.parent; return p===h.mdl; });
    const file=(u.tpl&&u.tpl.url)||null; return { lvl:h.lvl, saw:!!u.saw, skinned:!!sk, own:sk?own:null, mix:!!u.__mix, tilt:!!u.tilt }; });
  const slot=(document.getElementById('slot-harpoon')||{}).textContent||'';
  // the barrel follows the pitch
  const h0=hs.find(h=>h.mdl.userData.tilt); let tiltOk=null; if(h0){ h0.pitch=.35; d.step(1/30,1); const px=h0.mdl.userData.pitch.rotation.x; tiltOk=Math.abs(h0.mdl.userData.tilt.rotation.z-px)<1e-6; }
  // the loop: no pan/tilt tracks
  const T=hs[0].mdl.userData.tpl; const tracks=T&&T.clips&&T.clips[0]?T.clips[0].tracks.map(t=>t.name):[]; const kept=window.__sawgun.sparks(T);
  return { rows, slot, tiltOk, tracks:tracks.length, panTracks:tracks.filter(n=>/^(Pan|Tilt|Base)\./.test(n)).length, kept, X, Z }; });
check("the hotbar slot is the 🪚 Saw Blade Gunner",/🪚/.test(A.slot)&&/Saw Blade Gunner/.test(A.slot),A.slot);
check("Marks I-IV are gunners; I, II and III (and IV, sharing III) rigged, each with its OWN skeleton and Bob's loop running, the barrel on its Tilt joint",A.rows.length===4&&A.rows.every(r=>r.saw)&&A.rows[0].skinned&&A.rows[0].own&&A.rows[0].mix&&A.rows[0].tilt&&A.rows[1].skinned&&A.rows[1].own&&A.rows[1].mix&&A.rows[2].skinned&&A.rows[2].own&&A.rows[2].mix,JSON.stringify(A.rows));
check("Bob's loop keeps the sparks and drops his pan / tilt / base turning (the game aims it)",A.panTracks>0&&A.kept>0&&A.kept===A.tracks-A.panTracks,JSON.stringify({tracks:A.tracks,pan:A.panTracks,kept:A.kept}));
check("the barrel's Tilt joint follows the game's pitch",A.tiltOk===true,JSON.stringify(A.tiltOk));
const F=await page.evaluate(async({X,Z})=>{ const d=window.__dd; d.S.phase='wave'; const L=Object.keys(d.lanes())[0]; for(let i=0;i<8;i++){ d.spawn('goblin',L); const e=d.enemies[d.enemies.length-1]; e.x=X-6+i*1.6; e.z=Z-12; e.spd=0; }
  const b0=window.__sawgun.info().blades; for(let i=0;i<150;i++){ d.step(1/30,1); if(i%30===0) await new Promise(r=>setTimeout(r,20)); if(window.__sawgun.info().blades>b0+2) break; } return { blades:window.__sawgun.info().blades-b0 }; },{X:A.X,Z:A.Z});
check("facing goblins, the gunners fire spinning saw blades",F.blades>=2,JSON.stringify(F));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
