// portraits for the title screen's hero cards: each hero in the game's own pipeline (fit, toon, outline, idle clip),
// facing the camera on the bench floor, rendered by the game's renderer and cropped from the canvas -> parts/assets/hero-<id>.png
import { chromium } from "playwright"; import { serve } from "../serve.mjs"; import fs from "fs";
const SP=process.env.SP; const server=await serve(8941,{dist:SP+"/dist"});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const page=await browser.newPage({viewport:{width:640,height:640}}); const errs=[]; page.on("pageerror",e=>errs.push(String(e)));
await page.goto("http://127.0.0.1:8941/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__heroes&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ try{ localStorage.setItem("ddMapsCleared","5"); }catch(e){} });
await page.goto("http://127.0.0.1:8941/?silent&nogate&map=1",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__heroes&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ window.__meta.reset(); window.__dd.resetGear(); window.__dd.start(); window.__freeze=true; window.__dd.step(1/60,5); document.getElementById('hud').style.display='none'; });
for(const id of ['witch','troll','knight','fighter']){
  await page.evaluate(id=>window.__heroes.select(id),id);
  await page.waitForFunction(id=>{ const m=window.__dd.heroModel(); return m&&window.__heroes.pick()===id&&m.visible; },id,{timeout:120000});
  const out=await page.evaluate(async()=>{ const d=window.__dd; d.setHero(0,54,0); d.hero.y=0; d.setCam(Math.PI*.82,.1,3.1); d.setHeroYaw(Math.PI); for(let i=0;i<70;i++){ d.step(1/60,1); await new Promise(r=>setTimeout(r,0)); }   // a stretch of idle so the pose settles
    d.renderer.render(d.scene,d.camera); const c=d.renderer.domElement; const W=c.width, H=c.height; const cw=Math.round(W*.42), ch=Math.round(H*.74), cx=Math.round((W-cw)/2), cy=Math.round(H*.16);
    const o=document.createElement('canvas'); o.width=150; o.height=190; o.getContext('2d').drawImage(c,cx,cy,cw,ch,0,0,150,190); return {png:o.toDataURL('image/png'),label:d.heroModel().label,W,H}; });
  fs.writeFileSync(SP+"/parts/assets/hero-"+id+".png",Buffer.from(out.png.split(",")[1],"base64")); console.log(id,out.label,out.W+"x"+out.H,fs.statSync(SP+"/parts/assets/hero-"+id+".png").size+" bytes"); }
console.log("errors:",errs.join(" | ")||"none"); await browser.close(); server.close();
