// The Gnome Engineer's title-screen portrait (parts/assets/hero-engineer.png, 600x750 transparent), shot the way tools/render-hero-portraits.mjs shoots the other four (3/4 view, key light
// plus a rim in his colour, idle pose), but loading engineer.glb straight through the puppet loader -- he is not in the prologue's crew. His wrench is part of his model, so no weapon is hung.
//   DIST=./dist2 node tools/render-engineer-portrait.mjs
import { chromium } from "playwright"; import { serve } from "../serve.mjs"; import fs from "fs";
const DIST=process.env.DIST||"./dist"; const server=await serve(8976,{dist:DIST});
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]});
const page=await (await browser.newContext({viewport:{width:900,height:900}})).newPage();
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
await page.goto("http://127.0.0.1:8976/?silent&nogate",{timeout:180000}); await page.waitForFunction(()=>window.__dd&&window.__party&&window.__party.model,null,{timeout:180000});
const url=await page.evaluate(async()=>{ const T=window.THREE, P=window.__party.model, gr=window.__dd.r;
  const buf=await (await fetch('assets/engineer.glb')).arrayBuffer(); const m=await new Promise(r=>P.load(buf,'engineer',r));
  const scene=new T.Scene(); scene.add(m.wrap); m.wrap.position.set(0,0,0); m.wrap.rotation.set(0,-.5,0); m.wrap.visible=true;
  if(m.actions.idle){ P.play(m,'idle',{fade:0,restart:true}); m.actions.idle.time=.6; } m.mixer.update(0); m.mixer.update(.01);
  const BH=2.3; scene.add(new T.HemisphereLight(0xfff2e0,0x302040,.9)); const key=new T.DirectionalLight(0xffffff,1.15); key.position.set(-3,4,5); scene.add(key);
  const RIM=0x4ab8ff; const rim=new T.DirectionalLight(RIM,1.8); rim.position.set(3,3,-4); scene.add(rim); const rim2=new T.DirectionalLight(RIM,.9); rim2.position.set(-4,2,-3); scene.add(rim2);
  const cv=document.createElement('canvas'); cv.width=600; cv.height=750; const R=new T.WebGLRenderer({ canvas:cv, alpha:true, antialias:true, preserveDrawingBuffer:true }); R.setClearColor(0x000000,0);
  if(gr){ R.outputEncoding=gr.outputEncoding; R.toneMapping=gr.toneMapping; R.toneMappingExposure=gr.toneMappingExposure; }
  const cam=new T.PerspectiveCamera(26,600/750,.1,100); cam.position.set(0,BH*.6,BH*2.95); cam.lookAt(0,BH*.5,0); R.render(scene,cam); return cv.toDataURL('image/png'); });
fs.writeFileSync('parts/assets/hero-engineer.png',Buffer.from(url.split(',')[1],'base64')); console.log('wrote parts/assets/hero-engineer.png');
await browser.close(); server.close();
