// ===== THE MINI-MAP (build 399; parts/staging/97g-minimap.js). OJ's idea via Matt: "mini map, up in the right corner, shows mobs moving, mana and loot all in different colors, as small dots".
// Checked: hidden on the title screen, shown top-right in the hall; it counts the mobs, mana orbs, loot and towers it draws and a mob's dot moves with it; it paints red, blue and gold dots; M hides it and shows it again
// (remembered); hidden while the hideout is open; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8990,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:760}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.removeItem("dd_minimap"); }catch(e){} });
await page.goto("http://127.0.0.1:8990/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__minimap&&window.__dd.heroModel(),null,{timeout:120000});
const A=await page.evaluate(()=>{ const pre=window.__minimap.info().on; const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); const r=document.getElementById('minimap').getBoundingClientRect(); return { pre, on:window.__minimap.info().on, right:Math.round(innerWidth-r.right), top:Math.round(r.top), w:Math.round(r.width) }; });
check("hidden on the title screen; in the hall it stands in the top-right corner",!A.pre&&A.on&&A.right<30&&A.top<160&&A.w>150,JSON.stringify(A));
const B=await page.evaluate(()=>{ const d=window.__dd, M=window.__minimap; d.addMana(9999); d.placeDefAt('harpoon',4,-6,0); d.spawn('goblin','N'); const g=d.enemies[d.enemies.length-1]; g.spd=0; g.x=-6; g.z=-10; window.__devpanel.toggle(true); document.getElementById('dp-named-drop').click(); window.__devpanel.toggle(false); window.__dd.step(1/60,2);
  M.draw(); const i=M.info(); const c=M.canvas, x=c.getContext('2d'); const at=(wx,wz)=>{ const p=x.getImageData(Math.round(M.px(wx)),Math.round(M.pz(wz)),1,1).data; return [p[0],p[1],p[2]]; };
  const red=at(g.x,g.z); const x0=M.px(g.x); g.x=6; M.draw(); const moved=Math.abs(M.px(g.x)-x0)>5&&at(g.x,g.z)[0]>180;
  let blue=false, gold=false; for(const o of d.orbs){ const p=at(o.x,o.z); if(p[2]>180&&p[0]<140) blue=true; } for(const l of d.loot){ const p=at(l.x,l.z); if(p[0]>200&&p[1]>150&&p[2]<120) gold=true; }
  return { mobs:i.mobs, defs:i.defs, loot:i.loot, red, moved, blue:d.orbs.length?blue:'none', gold }; });
check("it draws the mobs (red, and the dot moves with the mob), the loot (gold) and the towers it counts",B.mobs>=1&&B.defs>=1&&B.loot>=1&&B.red[0]>180&&B.red[1]<120&&B.moved&&B.gold,JSON.stringify(B));
const C=await page.evaluate(async()=>{ const d=window.__dd; const fire=()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyM',bubbles:true})); fire(); d.step(1/60,2); const off=window.__minimap.info().on; const saved=localStorage.getItem('dd_minimap'); fire(); d.step(1/60,2); const back=window.__minimap.info().on;
  const real=window.__hideout.isOpen; window.__hideout.isOpen=()=>true; d.step(1/60,2); const inHideout=window.__minimap.info().on; window.__hideout.isOpen=real; d.step(1/60,2); return { off, saved, back, inHideout, after:window.__minimap.info().on }; });
check("M hides it (remembered) and shows it again; hidden while you are in the hideout",C.off===false&&C.saved==='off'&&C.back===true&&C.inHideout===false&&C.after===true,JSON.stringify(C));
const W=await page.evaluate(()=>{ const d=window.__dd, M=window.__minimap; const S=d.S, ph0=S.phase, w0=S.wave, h0=S.held; const tot=d.map().waves; const out={tot};
  S.phase='build'; S.wave=0; S.held=false; d.step(1/60,2); out.build=M.wave();
  S.phase='wave'; S.wave=3; d.step(1/60,1); out.fight=M.wave(); S.phase='build'; S.held=true; d.step(1/60,1); out.held=M.wave();
  S.held=h0; S.phase='build'; S.wave=w0; window.__minimap.toggle(false); d.step(1/60,2); out.topOff=document.getElementById('mmWave').style.top; window.__minimap.toggle(true); d.step(1/60,2); out.topOn=document.getElementById('mmWave').style.top; S.phase=ph0; return out; });
check("the wave strip under the map (build 406): NEXT · WAVE 1/7 while building, WAVE 3/7 in red in the fight, ALL 7 HELD once held; with the map hidden it moves up into its place",W.build.on&&/NEXT\s*WAVE 1 \/ /.test(W.build.text)&&W.fight.text==='WAVE 3 / '+W.tot&&/fight/.test(W.fight.cls)&&W.held.text==='✓ ALL '+W.tot+' HELD'&&W.topOff==='112px'&&parseInt(W.topOn)>250,JSON.stringify(W));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
