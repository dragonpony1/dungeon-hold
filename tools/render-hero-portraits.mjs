// Renders the title screen's hero portraits (parts/assets/hero-<id>.png, transparent PNG 600x750) from the heroes' own models, each holding his signature set weapon,
// a 3/4 view, key light plus a rim in the hero's colour. Build 558 (Matt: "our hero picker on the main page need a little love"; the old Witch and Fighter shots had lost their hero).
//   DIST=./dist2 node tools/render-hero-portraits.mjs      (needs a built dist with 96s4-prologue.js: it loads the four through window.__prologue.crew)
import { chromium } from "playwright"; import { serve } from "../serve.mjs"; import fs from "fs";
const DIST=process.env.DIST||"./dist";
const server=await serve(8975,{dist:DIST});
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]});
const page=await (await browser.newContext({viewport:{width:900,height:900}})).newPage();
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
await page.goto("http://127.0.0.1:8975/?silent&nogate",{timeout:180000}); await page.waitForFunction(()=>window.__dd&&window.__prologue&&window.__prologue.crew,null,{timeout:180000});
await page.waitForFunction(()=>window.__prologue.crew.get(),null,{timeout:180000,polling:500});
const shots=await page.evaluate(async()=>{ const T=window.THREE, C2=window.__prologue.crew, P=window.__party.model, gr=window.__dd.r;
  const RIM={ witch:0xa070ff, troll:0x6ad050, knight:0xff5a3a, fighter:0xf0c040 };
  const out={};
  // a one-bone arm turn (as 96s9-lantern.js): the upper arm turned so the hand points at a spot
  const v1=new T.Vector3(), v2=new T.Vector3(), v3=new T.Vector3(), q1=new T.Quaternion(), q2=new T.Quaternion(), q3=new T.Quaternion();
  const chain=n=>{ const hand=n&&n.parent, fore=hand&&hand.parent, upper=fore&&fore.parent; return upper&&upper.parent?{ hand, upper }:null; };
  const aim=(ch,tg)=>{ if(!ch) return; ch.upper.getWorldPosition(v1); ch.hand.getWorldPosition(v2); v2.sub(v1).normalize(); v3.copy(tg).sub(v1).normalize(); q1.setFromUnitVectors(v2,v3); ch.upper.getWorldQuaternion(q2); q2.premultiply(q1); ch.upper.parent.getWorldQuaternion(q3); ch.upper.quaternion.copy(q3.invert().multiply(q2)); ch.upper.updateMatrixWorld(true); };
  for(const h of C2.CREW){ const m=C2.MODEL[h.id]; if(!m) continue;
    const scene=new T.Scene(); scene.add(m.wrap); m.wrap.position.set(0,0,0); m.wrap.rotation.set(0,.55,0); m.wrap.visible=true;
    if(m.actions.idle){ P.play(m,'idle',{fade:0,restart:true}); m.actions.idle.time=.6; } m.mixer.update(0); m.mixer.update(.01);
    const BH=2.3;   // framed by the body (every puppet hero stands 2.3; a skinned rig's box reads wrong, and a staff's tip would push the camera back)
    const mt=P.mount(m.root); let wobj=null; if(mt&&window.__weapons) await new Promise(res=>{ let done=false; window.__weapons.attach(mt,h.w,5,null,o=>{ wobj=o; if(!done){ done=true; res(); } }); setTimeout(()=>{ if(!done){ done=true; res(); } },8000); });
    { const yaw=m.wrap.rotation.y, fx=Math.sin(yaw), fz=Math.cos(yaw), rx=-fz, rz=fx; let left=null; try{ const dw=window.__dualwield&&window.__dualwield.prep?window.__dualwield.prep(m.root):null; left=dw&&dw.node?chain(dw.node):null; }catch(e){}
      aim(left,new T.Vector3(rx*.55+fx*.05,BH*.12,rz*.55+fz*.05));   // the free arm down at his side, not held out
      if(h.id==='knight') aim(chain(mt),new T.Vector3(fx*.55-rx*.4,BH*.36,fz*.55-rz*.4)); m.wrap.updateMatrixWorld(true); }   // the Knight's sword arm forward and low
    scene.add(new T.HemisphereLight(0xfff2e0,0x302040,.9)); const key=new T.DirectionalLight(0xffffff,1.15); key.position.set(-3,4,5); scene.add(key);
    const rim=new T.DirectionalLight(RIM[h.id]||0xffffff,1.8); rim.position.set(3,3,-4); scene.add(rim); const rim2=new T.DirectionalLight(RIM[h.id]||0xffffff,.9); rim2.position.set(-4,2,-3); scene.add(rim2);
    const cv=document.createElement('canvas'); cv.width=600; cv.height=750; const R=new T.WebGLRenderer({ canvas:cv, alpha:true, antialias:true, preserveDrawingBuffer:true }); R.setClearColor(0x000000,0);
    if(gr){ R.outputEncoding=gr.outputEncoding; R.toneMapping=gr.toneMapping; R.toneMappingExposure=gr.toneMappingExposure; }
    const top=BH; const cam=new T.PerspectiveCamera(26,600/750,.1,100); cam.position.set(0,top*.6,top*2.7); cam.lookAt(0,top*.5,0);
    R.render(scene,cam); out[h.id]=cv.toDataURL('image/png'); R.dispose(); if(wobj&&wobj.parent) wobj.parent.remove(wobj); scene.remove(m.wrap); m.wrap.rotation.set(0,0,0); }
  return out; });
for(const [id,url] of Object.entries(shots)){ fs.writeFileSync(`parts/assets/hero-${id}.png`,Buffer.from(url.split(',')[1],'base64')); console.log('wrote',id); }
await browser.close(); server.close();
