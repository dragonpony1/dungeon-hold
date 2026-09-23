// thumbnails of static GLBs: node probes/thumbs.mjs out.png a.glb b.glb …  — each model from the front, the side and above, fitted to the frame
import { chromium } from "playwright"; import http from "http"; import fs from "fs"; import path from "path";
const [out,...files]=process.argv.slice(2); const LIB=path.resolve("meshy/troll");
const PAGE=n=>`<html><body style="margin:0;background:#223"><canvas id=c width=${300*3} height=${300*n}></canvas><script src="/three.min.js"></script><script src="/GLTFLoader.js"></script></body></html>`;
const server=http.createServer((req,res)=>{ const u=new URL(req.url,"http://x"); let f; if(u.pathname==="/page.html"){ res.setHeader("content-type","text/html"); return res.end(PAGE(files.length)); } if(u.pathname.startsWith("/f/")) f=files[+u.pathname.slice(3)]; else f=path.join(LIB,u.pathname); if(!f||!fs.existsSync(f)){ res.statusCode=404; return res.end(); } res.setHeader("content-type",/\.js$/.test(f)?"text/javascript":"application/octet-stream"); res.end(fs.readFileSync(f)); });
await new Promise(r=>server.listen(8793,"127.0.0.1",r));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const page=await browser.newPage({viewport:{width:300*3,height:300*files.length}}); const errs=[]; page.on("pageerror",e=>errs.push(String(e)));
await page.goto("http://127.0.0.1:8793/page.html");
await page.waitForFunction(()=>window.THREE&&window.THREE.GLTFLoader);
const info=await page.evaluate(async(n)=>{ const c=document.getElementById("c"); const r=new THREE.WebGLRenderer({canvas:c,antialias:true,preserveDrawingBuffer:true}); r.setScissorTest(true); r.outputEncoding=THREE.sRGBEncoding; const out=[];
  for(let i=0;i<n;i++){ const g=await new Promise((res,rej)=>new THREE.GLTFLoader().load("/f/"+i,res,undefined,rej)); const root=g.scene; const box=new THREE.Box3().setFromObject(root); const size=box.getSize(new THREE.Vector3()), ctr=box.getCenter(new THREE.Vector3()); const R=size.length()/2;
    const sc=new THREE.Scene(); sc.background=new THREE.Color(0x223); sc.add(new THREE.HemisphereLight(0xffffff,0x334,1.2)); const dl=new THREE.DirectionalLight(0xffffff,.8); dl.position.set(3,6,4); sc.add(dl); sc.add(root); let tris=0; root.traverse(m=>{ if(m.isMesh){ tris+=(m.geometry.index?m.geometry.index.count:m.geometry.attributes.position.count)/3; } });
    const views=[[0,0,1],[1,0,0],[0.3,1,0.6]]; views.forEach((v,k)=>{ const cam=new THREE.PerspectiveCamera(35,1,.01,1000); const d=R/Math.sin(35/2*Math.PI/180)*1.05; cam.position.set(ctr.x+v[0]*d,ctr.y+v[1]*d,ctr.z+v[2]*d); cam.lookAt(ctr); r.setViewport(k*300,(n-1-i)*300,300,300); r.setScissor(k*300,(n-1-i)*300,300,300); r.render(sc,cam); });
    out.push({i,size:size.toArray().map(x=>+x.toFixed(2)),tris:Math.round(tris),mats:[...new Set([])].length}); }
  return out; },files.length);
console.log(JSON.stringify(info)); await page.screenshot({path:out}); console.log("errors:",errs.join(" | ")||"none"); await browser.close(); server.close();
