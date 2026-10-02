// Compact a rigged Meshy/Bob .glb for the game (build 473, Avery):
//   * skin weights: every vertex keeps its 4 strongest bones of all its JOINTS_n/WEIGHTS_n sets (three.js r128 reads only JOINTS_0/WEIGHTS_0), renormalised;
//     the extra sets are dropped
//   * the metallic-roughness and normal maps are dropped (the game's toon shader never reads them)
//   * the base colour picture is scaled to --max px and re-encoded as JPEG
//   * the binary chunk is rebuilt with only what is still used
//   node tools/glb-compact.mjs in.glb out.glb [max=2048] [jpegQuality=0.88]
import { chromium } from "playwright"; import fs from "fs";
const [SRC, OUT, MAXS = "2048", QS = "0.88"] = process.argv.slice(2); const MAX = +MAXS, Q = +QS;
if (!SRC || !OUT) { console.log("usage: node tools/glb-compact.mjs in.glb out.glb [max] [quality]"); process.exit(1); }
const buf = fs.readFileSync(SRC); const jl = buf.readUInt32LE(12); const J = JSON.parse(buf.slice(20, 20 + jl).toString("utf8"));
const binStart = 20 + jl + 8, bin = buf.slice(binStart, binStart + buf.readUInt32LE(20 + jl));
const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const views = []; // new bufferViews: { bytes, target? }
const keepView = i => { const v = J.bufferViews[i]; const o = v.byteOffset || 0; views.push({ bytes: bin.slice(o, o + v.byteLength), stride: v.byteStride, target: v.target }); return views.length - 1; };
const viewMap = new Map(); const mapView = i => { if (!viewMap.has(i)) viewMap.set(i, keepView(i)); return viewMap.get(i); };
const readAcc = a => { const A = J.accessors[a], v = J.bufferViews[A.bufferView], n = NC[A.type], T = CT[A.componentType]; const stride = v.byteStride || n * T.BYTES_PER_ELEMENT;
  const out = new Float64Array(A.count * n); const dv = new DataView(bin.buffer, bin.byteOffset + (v.byteOffset || 0) + (A.byteOffset || 0));
  for (let i = 0; i < A.count; i++) for (let k = 0; k < n; k++) { const off = i * stride + k * T.BYTES_PER_ELEMENT; let x;
    switch (A.componentType) { case 5121: x = dv.getUint8(off); break; case 5123: x = dv.getUint16(off, true); break; case 5125: x = dv.getUint32(off, true); break; case 5126: x = dv.getFloat32(off, true); break; case 5120: x = dv.getInt8(off); break; case 5122: x = dv.getInt16(off, true); break; }
    if (A.normalized) x = A.componentType === 5121 ? x / 255 : A.componentType === 5123 ? x / 65535 : x; out[i * n + k] = x; } return out; };
let moved = 0;
for (const m of J.meshes || []) for (const p of m.primitives) { const at = p.attributes; const sets = []; for (let s = 0; at["JOINTS_" + s] !== undefined; s++) sets.push([readAcc(at["JOINTS_" + s]), readAcc(at["WEIGHTS_" + s])]);
  if (sets.length > 1) { const n = J.accessors[at.POSITION].count, Jn = new Uint16Array(n * 4), Wn = new Float32Array(n * 4);
    for (let v = 0; v < n; v++) { const c = []; for (const [jj, ww] of sets) for (let q = 0; q < 4; q++) { const w = ww[v * 4 + q]; if (w > 0) c.push([jj[v * 4 + q], w]); }
      c.sort((a, b) => b[1] - a[1]); if (c.length > 4) moved++; const top = c.slice(0, 4), t = top.reduce((s, x) => s + x[1], 0) || 1; top.forEach(([j, w], q) => { Jn[v * 4 + q] = j; Wn[v * 4 + q] = w / t; }); }
    views.push({ bytes: Buffer.from(Jn.buffer), target: 34962 }); J.accessors.push({ bufferView: -(views.length), componentType: 5123, count: n, type: "VEC4" }); at.JOINTS_0 = J.accessors.length - 1;
    views.push({ bytes: Buffer.from(Wn.buffer), target: 34962 }); J.accessors.push({ bufferView: -(views.length), componentType: 5126, count: n, type: "VEC4" }); at.WEIGHTS_0 = J.accessors.length - 1;
    for (let s = 1; s < sets.length; s++) { delete at["JOINTS_" + s]; delete at["WEIGHTS_" + s]; } } }
// materials: base colour only
const usedImg = new Set();
for (const mt of J.materials || []) { if (mt.pbrMetallicRoughness) { delete mt.pbrMetallicRoughness.metallicRoughnessTexture; mt.pbrMetallicRoughness.metallicFactor = 0; mt.pbrMetallicRoughness.roughnessFactor = 1; } delete mt.normalTexture; delete mt.occlusionTexture;
  const bt = mt.pbrMetallicRoughness && mt.pbrMetallicRoughness.baseColorTexture; if (bt) usedImg.add(J.textures[bt.index].source); }
// re-encode the used images as JPEG
const b = await chromium.launch(); const page = await b.newPage(); const imgOut = new Map();
for (const ii of usedImg) { const im = J.images[ii], v = J.bufferViews[im.bufferView], o = v.byteOffset || 0; const b64 = bin.slice(o, o + v.byteLength).toString("base64");
  const r = await page.evaluate(async ({ b64, mime, max, q }) => { const arr = Uint8Array.from(atob(b64), c => c.charCodeAt(0)); const bm = await createImageBitmap(new Blob([arr], { type: mime }), { colorSpaceConversion: "none" });
    const s = Math.min(1, max / Math.max(bm.width, bm.height)), w = Math.round(bm.width * s), h = Math.round(bm.height * s); const c = new OffscreenCanvas(w, h); c.getContext("2d").drawImage(bm, 0, 0, w, h);
    const blob = await c.convertToBlob({ type: "image/jpeg", quality: q }); const ab = new Uint8Array(await blob.arrayBuffer()); let s2 = ""; for (let i = 0; i < ab.length; i += 0x8000) s2 += String.fromCharCode.apply(null, ab.subarray(i, i + 0x8000)); return { b64: btoa(s2), w, h }; },
    { b64, mime: im.mimeType || "image/png", max: MAX, q: Q });
  imgOut.set(ii, Buffer.from(r.b64, "base64")); console.log("  image " + ii + ": -> " + r.w + "x" + r.h + " jpeg, " + (v.byteLength / 1e6).toFixed(1) + " -> " + (imgOut.get(ii).length / 1e6).toFixed(2) + " MB"); }
await b.close();
// rebuild: accessors (skipping dropped ones), images, buffer
const usedAcc = new Set(); for (const m of J.meshes || []) for (const p of m.primitives) { for (const a of Object.values(p.attributes)) usedAcc.add(a); if (p.indices !== undefined) usedAcc.add(p.indices); for (const t of p.targets || []) for (const a of Object.values(t)) usedAcc.add(a); }
for (const s of J.skins || []) if (s.inverseBindMatrices !== undefined) usedAcc.add(s.inverseBindMatrices);
for (const an of J.animations || []) for (const sm of an.samplers) { usedAcc.add(sm.input); usedAcc.add(sm.output); }
const accNew = [], accMap = new Map(); J.accessors.forEach((A, i) => { if (!usedAcc.has(i)) return; const B = Object.assign({}, A); B.bufferView = A.bufferView < 0 ? -A.bufferView - 1 : mapView(A.bufferView); accMap.set(i, accNew.length); accNew.push(B); });
const remapA = a => accMap.get(a);
for (const m of J.meshes || []) for (const p of m.primitives) { for (const k in p.attributes) p.attributes[k] = remapA(p.attributes[k]); if (p.indices !== undefined) p.indices = remapA(p.indices); for (const t of p.targets || []) for (const k in t) t[k] = remapA(t[k]); }
for (const s of J.skins || []) if (s.inverseBindMatrices !== undefined) s.inverseBindMatrices = remapA(s.inverseBindMatrices);
for (const an of J.animations || []) for (const sm of an.samplers) { sm.input = remapA(sm.input); sm.output = remapA(sm.output); }
J.accessors = accNew;
const imgNew = [], imgMap = new Map(); (J.images || []).forEach((im, i) => { if (!usedImg.has(i)) return; views.push({ bytes: imgOut.get(i) }); imgMap.set(i, imgNew.length); imgNew.push({ bufferView: views.length - 1, mimeType: "image/jpeg" }); });
J.images = imgNew; const texNew = [], texMap = new Map(); (J.textures || []).forEach((t, i) => { if (!imgMap.has(t.source)) return; texMap.set(i, texNew.length); texNew.push(Object.assign({}, t, { source: imgMap.get(t.source) })); }); J.textures = texNew;
for (const mt of J.materials || []) { const bt = mt.pbrMetallicRoughness && mt.pbrMetallicRoughness.baseColorTexture; if (bt) bt.index = texMap.get(bt.index); }
let off = 0; const parts = []; J.bufferViews = views.map(v => { const pad = (4 - (off % 4)) % 4; if (pad) { parts.push(Buffer.alloc(pad)); off += pad; } const bv = { buffer: 0, byteOffset: off, byteLength: v.bytes.length }; if (v.stride) bv.byteStride = v.stride; if (v.target) bv.target = v.target; parts.push(v.bytes); off += v.bytes.length; return bv; });
const pad = (4 - (off % 4)) % 4; if (pad) { parts.push(Buffer.alloc(pad)); off += pad; } J.buffers = [{ byteLength: off }];
let js = Buffer.from(JSON.stringify(J)); const jpad = (4 - (js.length % 4)) % 4; js = Buffer.concat([js, Buffer.alloc(jpad, 0x20)]);
const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + off, 8);
const jh = Buffer.alloc(8); jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4e4f534a, 4); const bh = Buffer.alloc(8); bh.writeUInt32LE(off, 0); bh.writeUInt32LE(0x004e4942, 4);
fs.writeFileSync(OUT, Buffer.concat([head, jh, js, bh, ...parts]));
console.log(SRC.split(/[\\/]/).pop() + ": " + (buf.length / 1e6).toFixed(1) + " MB -> " + OUT + ": " + (fs.statSync(OUT).size / 1e6).toFixed(1) + " MB; " + moved + " vertices had more than 4 bones");
