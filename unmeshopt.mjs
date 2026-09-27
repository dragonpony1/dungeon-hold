// ===== unmeshopt: decode EXT_meshopt_compression out of a .glb at build time, so the dist copy of the hideout needs no
// WebAssembly in the browser. The hideout (hideout-wip, build 17+) ships every model meshopt-compressed and decodes it
// with vendor/meshopt_decoder.js, which compiles a WebAssembly module -- a host whose Content-Security-Policy has no
// 'wasm-unsafe-eval' (the artifact viewer's script-src is not ours to set) refuses that, and then no model loads at all.
// assemble.mjs runs this over dist/hideout/assets before the base64 step; parts/hideout stays byte-for-byte upstream.
// The decoder itself runs here in node (it exports for CommonJS). KHR_mesh_quantization is left as it is: three's
// GLTFLoader reads quantized attributes natively.
import fs from "fs"; import path from "path"; import { createRequire } from "module";
const require=createRequire(import.meta.url);
let decoder=null;
async function getDecoder(vendorDir){ if(!decoder){ decoder=require(path.join(vendorDir,"meshopt_decoder.js")); await decoder.ready; if(!decoder.supported) throw new Error("meshopt decoder: WebAssembly not supported in this node"); } return decoder; }
const pad4=n=>(n+3)&~3;
export function readGlb(buf){ if(buf.readUInt32LE(0)!==0x46546C67) throw new Error("not a glb"); const jl=buf.readUInt32LE(12); const json=JSON.parse(buf.slice(20,20+jl).toString("utf8")); let bin=null; const o=20+jl; if(o<buf.length){ const bl=buf.readUInt32LE(o); if(buf.readUInt32LE(o+4)!==0x004E4942) throw new Error("second chunk is not BIN"); bin=buf.slice(o+8,o+8+bl); } return {json,bin}; }
export function writeGlb(json,bin){ const js=Buffer.from(JSON.stringify(json),"utf8"); const jp=pad4(js.length), bp=pad4(bin.length); const out=Buffer.alloc(12+8+jp+8+bp); out.write("glTF",0); out.writeUInt32LE(2,4); out.writeUInt32LE(out.length,8); out.writeUInt32LE(jp,12); out.writeUInt32LE(0x4E4F534A,16); js.copy(out,20); out.fill(0x20,20+js.length,20+jp); const b0=20+jp; out.writeUInt32LE(bp,b0); out.writeUInt32LE(0x004E4942,b0+4); bin.copy(out,b0+8); return out; }
export function isMeshopt(buf){ try{ return (readGlb(buf).json.extensionsUsed||[]).includes("EXT_meshopt_compression"); }catch(e){ return false; } }
// one file: every bufferView that carries the extension is decoded into a new single BIN; the fallback buffer goes
export async function unmeshopt(buf,vendorDir){ const dec=await getDecoder(vendorDir); const {json,bin}=readGlb(buf); if(!(json.extensionsUsed||[]).includes("EXT_meshopt_compression")) return buf;
  const parts=[]; let off=0; const views=(json.bufferViews||[]).map(v=>{ const ext=v.extensions&&v.extensions.EXT_meshopt_compression; let bytes;
    if(ext){ if(ext.buffer!==0) throw new Error("meshopt source outside the BIN chunk"); const src=bin.subarray(ext.byteOffset||0,(ext.byteOffset||0)+ext.byteLength); const target=new Uint8Array(ext.count*ext.byteStride); dec.decodeGltfBuffer(target,ext.count,ext.byteStride,src,ext.mode,ext.filter); bytes=Buffer.from(target.buffer,target.byteOffset,target.byteLength); }
    else { if(v.buffer!==0) throw new Error("a plain bufferView outside the BIN chunk"); bytes=bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength); }
    const nv={buffer:0,byteOffset:off,byteLength:bytes.length}; if(v.byteStride!==undefined) nv.byteStride=v.byteStride; if(v.target!==undefined) nv.target=v.target; if(v.name!==undefined) nv.name=v.name;
    if(v.extensions){ const e=Object.assign({},v.extensions); delete e.EXT_meshopt_compression; if(Object.keys(e).length) nv.extensions=e; }
    parts.push(bytes); off+=bytes.length; const padn=pad4(off)-off; if(padn){ parts.push(Buffer.alloc(padn)); off+=padn; } return nv; });
  const nbin=Buffer.concat(parts,off); json.bufferViews=views; json.buffers=[{byteLength:nbin.length}];
  for(const k of ["extensionsUsed","extensionsRequired"]) if(json[k]){ json[k]=json[k].filter(x=>x!=="EXT_meshopt_compression"); if(!json[k].length) delete json[k]; }
  return writeGlb(json,nbin); }
// every .glb under a directory, in place
export async function unmeshoptDir(dir,vendorDir){ let n=0; const walk=d=>{ for(const f of fs.readdirSync(d)){ const p=path.join(d,f); if(fs.statSync(p).isDirectory()) walk(p); else if(/\.glb$/.test(f)){ const b=fs.readFileSync(p); if(isMeshopt(b)) n++; } } }; const todo=[]; const walk2=d=>{ for(const f of fs.readdirSync(d)){ const p=path.join(d,f); if(fs.statSync(p).isDirectory()) walk2(p); else if(/\.glb$/.test(f)) todo.push(p); } }; walk2(dir);
  let done=0, before=0, after=0; for(const p of todo){ const b=fs.readFileSync(p); if(!isMeshopt(b)) continue; const o=await unmeshopt(b,vendorDir); fs.writeFileSync(p,o); done++; before+=b.length; after+=o.length; } return {done,before,after}; }
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){ const [src,dst]=process.argv.slice(2); const vendor=process.env.VENDOR||path.join(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/,"")),"parts/hideout/vendor"); const b=fs.readFileSync(src); const o=await unmeshopt(b,vendor); fs.writeFileSync(dst||src,o); const {json}=readGlb(o); console.log(src,b.length,"->",o.length,"bytes; extensions now:",json.extensionsUsed||[],"views",json.bufferViews.length,"buffers",json.buffers.length); }
