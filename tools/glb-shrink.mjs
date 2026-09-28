// Shrink the pictures inside a .glb: every embedded texture larger than --max px on its long side is scaled down to it and
// re-encoded in its own format (jpeg stays jpeg, png stays png). Geometry, materials and animation bytes are untouched;
// only the image bufferViews change size, and every bufferView after them is re-offset (4-byte aligned).
//   node tools/glb-shrink.mjs in.glb out.glb [max=1024] [jpegQuality=0.9]
import { chromium } from "playwright"; import fs from "fs";
const [SRC, OUT, MAXS = "1024", QS = "0.9"] = process.argv.slice(2); const MAX = +MAXS, Q = +QS;
if (!SRC || !OUT) { console.log("usage: node tools/glb-shrink.mjs in.glb out.glb [max] [quality]"); process.exit(1); }
const buf = fs.readFileSync(SRC);
if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("not a glb: " + SRC);
const jl = buf.readUInt32LE(12); const json = JSON.parse(buf.slice(20, 20 + jl).toString("utf8"));
const binLen = buf.readUInt32LE(20 + jl), binStart = 20 + jl + 8; const bin = buf.slice(binStart, binStart + binLen);
const bvs = json.bufferViews || [];
const b = await chromium.launch(); const page = await b.newPage();
const repl = {};
for (const im of json.images || []) {
  if (im.bufferView === undefined) continue; const v = bvs[im.bufferView]; const mime = im.mimeType || "image/jpeg";
  const bytes = bin.slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength);
  const r = await page.evaluate(async ({ b64, mime, max, q }) => {
    const arr = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const bm = await createImageBitmap(new Blob([arr], { type: mime }), { colorSpaceConversion: "none", premultiplyAlpha: "none" });
    const w = bm.width, h = bm.height, s = Math.min(1, max / Math.max(w, h));
    if (s >= 1) return { w, h, same: true };
    const W = Math.round(w * s), H = Math.round(h * s); const cv = new OffscreenCanvas(W, H); const g = cv.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(bm, 0, 0, W, H);
    const out = new Uint8Array(await (await cv.convertToBlob({ type: mime, quality: q })).arrayBuffer());
    let s2 = ""; for (let i = 0; i < out.length; i += 0x8000) s2 += String.fromCharCode.apply(null, out.subarray(i, i + 0x8000));
    return { w, h, W, H, b64: btoa(s2) };
  }, { b64: bytes.toString("base64"), mime, max: MAX, q: Q });
  if (r.same) { console.log(`  image ${im.name || im.bufferView}: ${r.w}x${r.h} (already small)`); continue; }
  repl[im.bufferView] = Buffer.from(r.b64, "base64");
  console.log(`  image ${im.name || im.bufferView}: ${r.w}x${r.h} -> ${r.W}x${r.H}, ${(bytes.length / 1048576).toFixed(2)} -> ${(repl[im.bufferView].length / 1048576).toFixed(2)} MB`);
}
await b.close();
// rebuild the binary chunk in the original bufferView order, 4-byte aligned
const order = bvs.map((v, i) => i).sort((a, c) => (bvs[a].byteOffset || 0) - (bvs[c].byteOffset || 0));
const parts = []; let off = 0;
for (const i of order) { const v = bvs[i]; const data = repl[i] || bin.slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength);
  const pad = (4 - (off % 4)) % 4; if (pad) { parts.push(Buffer.alloc(pad)); off += pad; }
  v.byteOffset = off; v.byteLength = data.length; parts.push(data); off += data.length; }
const tail = (4 - (off % 4)) % 4; if (tail) { parts.push(Buffer.alloc(tail)); off += tail; }
const newBin = Buffer.concat(parts); json.buffers[0].byteLength = newBin.length;
let js = Buffer.from(JSON.stringify(json), "utf8"); const jpad = (4 - (js.length % 4)) % 4; if (jpad) js = Buffer.concat([js, Buffer.alloc(jpad, 0x20)]);
const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + newBin.length, 8);
const jh = Buffer.alloc(8); jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
const bh = Buffer.alloc(8); bh.writeUInt32LE(newBin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
const outBuf = Buffer.concat([head, jh, js, bh, newBin]); fs.writeFileSync(OUT, outBuf);
console.log(`${SRC}: ${(buf.length / 1048576).toFixed(1)} MB -> ${OUT}: ${(outBuf.length / 1048576).toFixed(1)} MB`);
