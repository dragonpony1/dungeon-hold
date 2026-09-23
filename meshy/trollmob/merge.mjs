// node merge.mjs — merges rig.glb + clips into trollmob.glb (see merge.html)
import { chromium } from "playwright"; import http from "http"; import fs from "fs"; import path from "path";
const ROOT=process.cwd(); const types={".html":"text/html",".js":"text/javascript",".glb":"model/gltf-binary"};
const server=http.createServer((req,res)=>{ const f=path.join(ROOT,new URL(req.url,"http://x").pathname); if(!fs.existsSync(f)){res.statusCode=404;return res.end();} res.setHeader("content-type",types[path.extname(f)]||"application/octet-stream"); res.end(fs.readFileSync(f)); });
await new Promise(r=>server.listen(8792,"127.0.0.1",r));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await browser.newPage(); const errs=[]; page.on("pageerror",e=>errs.push(String(e)));
await page.goto("http://127.0.0.1:8792/merge.html"); await page.waitForFunction(()=>window.build);
const out=await page.evaluate(()=>window.build().catch(e=>({error:String(e&&e.stack||e)})));
if(out.b64){ fs.writeFileSync("trollmob.glb",Buffer.from(out.b64,"base64")); delete out.b64; }
console.log(JSON.stringify(out), "errors:", errs.length?errs.join(" | "):"none");
await browser.close(); server.close();
