// pictures of the sets for the character sheet's sets band and loadout cards: each set's dressed armor stand (the same
// GLB the tavern's stands and the hideout use), lit like the hero portraits, rendered by the game's own renderer on a
// transparent ground and cropped -> parts/assets/set-<k>.png. Run after a DIST build:  SP=$PWD node probes/setpictures.mjs
import { chromium } from "playwright"; import { serve } from "../serve.mjs"; import fs from "fs";
const SP=process.env.SP; const server=await serve(8942,{dist:SP+"/dist"}); const KINDS=(process.env.KINDS||"forest,void").split(",");
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const page=await browser.newPage({viewport:{width:600,height:600}}); const errs=[]; page.on("pageerror",e=>errs.push(String(e)));
await page.goto("http://127.0.0.1:8942/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__dd.renderer&&window.THREE&&THREE.GLTFLoader,null,{timeout:120000});
for(const k of KINDS){
  const out=await page.evaluate(async k=>{ const r=await fetch('assets/armor-stand-'+k+'.glb.txt'); const t=await r.text(); const b=atob(t.replace(/\s+/g,'')); const u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i);
    const gltf=await new Promise((res,rej)=>new THREE.GLTFLoader().parse(u.buffer,'',res,rej)); const sc=new THREE.Scene(); const g=gltf.scene; sc.add(g);
    const box=new THREE.Box3().setFromObject(g), size=box.getSize(new THREE.Vector3()), c=box.getCenter(new THREE.Vector3()); g.position.sub(c); g.position.y+=size.y*.0;
    const key=new THREE.DirectionalLight(0xffe4bd,2.2); key.position.set(1.6,2.6,3.2); const rim=new THREE.DirectionalLight(0xffb070,1.4); rim.position.set(-2.4,1.8,-2.2); const fill=new THREE.HemisphereLight(0xfff1dc,0x2b1a14,1.1); sc.add(key,rim,fill);
    const cam=new THREE.PerspectiveCamera(26,.8,.01,100); const dist=size.y*2.35; cam.position.set(size.y*.34,size.y*.1,dist); cam.lookAt(0,0,0);
    const R=window.__dd.renderer, W=400, H=500, prevSize=R.getSize(new THREE.Vector2()), prevPR=R.getPixelRatio(), prevClear=R.getClearColor(new THREE.Color()), prevA=R.getClearAlpha();
    R.setPixelRatio(1); R.setSize(W,H,false); R.setClearColor(0x000000,0); R.clear(); R.render(sc,cam);
    const o=document.createElement('canvas'); o.width=200; o.height=250; o.getContext('2d').drawImage(R.domElement,0,0,W,H,0,0,200,250); const png=o.toDataURL('image/png');
    R.setPixelRatio(prevPR); R.setSize(prevSize.x,prevSize.y,false); R.setClearColor(prevClear,prevA); return {png,size:[+size.x.toFixed(2),+size.y.toFixed(2),+size.z.toFixed(2)]}; },k);
  const f=SP+"/parts/assets/set-"+k+".png"; fs.writeFileSync(f,Buffer.from(out.png.split(",")[1],"base64")); console.log(k,out.size,fs.statSync(f).size+" bytes"); }
console.log("errors:",errs.join(" | ")||"none"); await browser.close(); server.close();
