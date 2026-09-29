// ===== PET ANIMATION (85b-petanim.js, build 244): the Meshy pets are animated in their vertex shader -- wings beat, tails swish, the new Crystal Owl turns its head and blinks. Checked by rendering a pet at two
// moments and seeing the picture change, for each kind, and by the time uniform running while a pet is out.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8885);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const page=await (await browser.newContext()).newPage(); page.on("pageerror",e=>errors.push(String(e))); page.on("console",m=>{ if(m.type()==="error"&&/shader|GLSL|WebGLProgram/i.test(m.text())) errors.push(m.text().slice(0,200)); });
await page.goto("http://127.0.0.1:8885/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__familiar&&window.__petanim,null,{timeout:90000});
const kinds=["Storm Drake","Fire Imp","Bat","Sprite","Crystal Owl","Wisp"];
await page.evaluate(k=>{ for(const n of k) try{ window.__familiar.build({name:"Glowing "+n,rarity:2,slot:"familiar"}); }catch(e){} },kinds);
for(let i=0;i<120;i++){ await sleep(150); if(await page.evaluate(k=>k.every(n=>window.__familiar.build({name:"Glowing "+n,rarity:2,slot:"familiar"}).userData.glb),kinds)) break; }
check("every kind's model is loaded and marked animated",await page.evaluate(k=>k.every(n=>{ const g=window.__familiar.build({name:"Glowing "+n,rarity:2,slot:"familiar"}); return g.userData.glb&&g.userData.animated; }),kinds));
const diffs=await page.evaluate(kinds=>{ const R=window.__dd.renderer, W=160, H=160; const s0=R.getSize(new THREE.Vector2()), pr=R.getPixelRatio(); R.setPixelRatio(1); R.setSize(W,H,false); const out={};
  const grab=(k,t)=>{ const sc=new THREE.Scene(); sc.background=new THREE.Color(0x3a3f48); sc.add(new THREE.HemisphereLight(0xffffff,0x666677,1.1)); const g=window.__familiar.build({name:"Glowing "+k,rarity:2,slot:"familiar"}); sc.add(g); const cam=new THREE.PerspectiveCamera(30,1,.05,30); cam.position.set(0,0,2.6); cam.lookAt(0,0,0); window.__petanim.hold(t); R.render(sc,cam); const c=document.createElement("canvas"); c.width=W; c.height=H; const x=c.getContext("2d"); x.drawImage(R.domElement,0,0); return x.getImageData(0,0,W,H).data; };
  for(const k of kinds){ if(!window.__petanim.cfg[k].amp) continue; const spd=window.__petanim.cfg[k].spd; const a=grab(k,Math.PI/(2*spd)), b=grab(k,3*Math.PI/(2*spd)); let d=0; for(let i=0;i<a.length;i+=4){ if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>40) d++; } out[k]=d; }
  const hs=window.__petanim.cfg["Crystal Owl"].head.spd; const l=grab("Crystal Owl",Math.PI/(2*hs)), r=grab("Crystal Owl",3*Math.PI/(2*hs)); let dh=0; for(let i=0;i<l.length;i+=4) if(Math.abs(l[i]-r[i])+Math.abs(l[i+1]-r[i+1])+Math.abs(l[i+2]-r[i+2])>40) dh++; out.head=dh;
  window.__petanim.release(); R.setPixelRatio(pr); R.setSize(s0.x,s0.y,false); return out; },kinds);
check("each winged pet looks different at two beats of its wing cycle (hundreds of pixels change)",kinds.filter(k=>k!=="Crystal Owl").every(k=>diffs[k]>150),JSON.stringify(diffs));
check("the owls have no wing beat at all, only a slow head turn (Matt, build 246)",await page.evaluate(()=>{ const c=window.__petanim.cfg["Crystal Owl"], n=window.__petanim.named.old_lamplight; return !c.amp&&!c.tail&&!c.eye&&c.head.spd<.5&&!n.amp&&n.head.spd<.5; }));
check("the bat's beat is smaller and faster than before, pivots at the shoulder and leaves its ears alone",await page.evaluate(()=>{ const c=window.__petanim.cfg.Bat; return c.amp<=.25&&c.spd>=25&&c.pv>0&&c.top<.7; }));
check("the Crystal Owl's head turn changes its picture too (left vs right)",diffs.head>60,String(diffs.head));
await page.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,30); }); const t0=await page.evaluate(()=>window.__petanim.time()); await sleep(400); await page.evaluate(()=>window.__dd.step(1/60,30)); const t1=await page.evaluate(()=>window.__petanim.time());
check("time is running (the shared uniform advances with the game)",t1>t0,JSON.stringify({t0,t1}));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no shader or page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
