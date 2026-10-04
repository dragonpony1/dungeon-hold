// Thin Matt's arrow-volley rain (hi3d-arrow-volley_2.glb, after tools/glb-compact.mjs) for the game (build 533 prep, 73b-volleyfx.js):
//   * 355 meshes -> 4: every node keeps its name, place and animation, but the copies of one piece (32 arrows, 65 ground stones, 96 debris chips,
//     192 dust puffs) all point at ONE mesh of their kind -- the game draws each kind as a single InstancedMesh anyway. The flat dirt disc under it all
//     (Impact_Ground) loses its mesh: an opaque brown disc would cover the hall's floor, so the game lays a soft scorch of its own there instead
//   * the 6 s clip keeps every channel, minus the keys a straight line between their neighbours already gives (within a hair: 2 mm, a
//     thousandth of a quaternion) -- the arrows sit still in the ground for half the clip and the dust is invisible for most of it
//   node tools/glb-volley-bake.mjs in.glb out.glb
import fs from "fs";
const [SRC, OUT] = process.argv.slice(2);
if (!SRC || !OUT) { console.log("usage: node tools/glb-volley-bake.mjs in.glb out.glb"); process.exit(1); }
const buf = fs.readFileSync(SRC); const jl = buf.readUInt32LE(12); const J = JSON.parse(buf.slice(20, 20 + jl).toString("utf8"));
const binStart = 20 + jl + 8, bin = buf.slice(binStart, binStart + buf.readUInt32LE(20 + jl));
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const readF = a => { const A = J.accessors[a], v = J.bufferViews[A.bufferView], n = NC[A.type]; if (A.componentType !== 5126) throw new Error("float accessor expected");
  const stride = v.byteStride || n * 4, dv = new DataView(bin.buffer, bin.byteOffset + (v.byteOffset || 0) + (A.byteOffset || 0)); const out = [];
  for (let i = 0; i < A.count; i++) { const e = []; for (let k = 0; k < n; k++) e.push(dv.getFloat32(i * stride + k * 4, true)); out.push(e); } return out; };
// ---- the new binary: copied views (mesh data, the picture) and fresh float arrays (the thinned clip)
const views = [], accs = []; const parts = []; let off = 0;
const addView = (bytes, target, stride) => { const pad = (4 - off % 4) % 4; if (pad) { parts.push(Buffer.alloc(pad)); off += pad; } const v = { buffer: 0, byteOffset: off, byteLength: bytes.length }; if (target) v.target = target; if (stride) v.byteStride = stride; parts.push(Buffer.from(bytes)); off += bytes.length; views.push(v); return views.length - 1; };
const viewMap = new Map(); const copyView = i => { if (!viewMap.has(i)) { const v = J.bufferViews[i], o = v.byteOffset || 0; viewMap.set(i, addView(bin.slice(o, o + v.byteLength), v.target, v.byteStride)); } return viewMap.get(i); };
const accMap = new Map(); const copyAcc = i => { if (!accMap.has(i)) { const A = Object.assign({}, J.accessors[i]); A.bufferView = copyView(A.bufferView); accs.push(A); accMap.set(i, accs.length - 1); } return accMap.get(i); };
const floatAcc = (rows, type) => { const n = NC[type], f = new Float32Array(rows.length * n); rows.forEach((r, i) => r.forEach((x, k) => f[i * n + k] = x)); const A = { bufferView: addView(Buffer.from(f.buffer)), componentType: 5126, count: rows.length, type };
  if (type === "SCALAR") { A.min = [Math.min(...rows.map(r => r[0]))]; A.max = [Math.max(...rows.map(r => r[0]))]; } accs.push(A); return accs.length - 1; };
// ---- one mesh per kind
const kindOf = name => (name || "").replace(/(_\d+)+$/, "");
const kindMesh = new Map(), meshes = [];
for (const n of J.nodes) { if (n.mesh === undefined) continue; const k = kindOf(n.name); if (k === "Impact_Ground") { delete n.mesh; continue; } if (!kindMesh.has(k)) { const m = J.meshes[n.mesh]; meshes.push({ name: k, primitives: m.primitives.map(p => { const q = Object.assign({}, p, { attributes: {} }); for (const a in p.attributes) q.attributes[a] = copyAcc(p.attributes[a]); if (p.indices !== undefined) q.indices = copyAcc(p.indices); return q; }) }); kindMesh.set(k, meshes.length - 1); } n.mesh = kindMesh.get(k); }
// ---- the pictures
const images = (J.images || []).map(im => Object.assign({}, im, { bufferView: copyView(im.bufferView) }));
// ---- the clip, thinned
const EPS = { translation: .002, rotation: .001, scale: .0005 }; let keys0 = 0, keys1 = 0;
const animations = (J.animations || []).map(a => { const samplers = [], channels = [];
  for (const c of a.channels) { const s = a.samplers[c.sampler], t = readF(s.input).map(r => r[0]), v = readF(s.output), eps = EPS[c.target.path] || .001; if (s.interpolation && s.interpolation !== "LINEAR") throw new Error("LINEAR clips only");
    const keep = [0]; for (let i = 1; i < t.length - 1; i++) { const p = keep[keep.length - 1], u = (t[i] - t[p]) / (t[i + 1] - t[p]); let err = 0; for (let k = 0; k < v[i].length; k++) err = Math.max(err, Math.abs(v[p][k] + (v[i + 1][k] - v[p][k]) * u - v[i][k])); if (err > eps) keep.push(i); }
    if (t.length > 1) keep.push(t.length - 1); keys0 += t.length; keys1 += keep.length;
    samplers.push({ input: floatAcc(keep.map(i => [t[i]]), "SCALAR"), output: floatAcc(keep.map(i => v[i]), J.accessors[s.output].type), interpolation: "LINEAR" }); channels.push({ sampler: samplers.length - 1, target: c.target }); }
  return { name: a.name, samplers, channels }; });
const nodes = J.nodes.map(n => { const o = Object.assign({}, n); delete o.extras; return o; });
const out = { asset: J.asset, scene: J.scene || 0, scenes: J.scenes, nodes, meshes, materials: J.materials, textures: J.textures, samplers: J.samplers, images, accessors: accs, bufferViews: views, buffers: [{ byteLength: off }], animations };
for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
let js = Buffer.from(JSON.stringify(out)); js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]);
let bn = Buffer.concat(parts); bn = Buffer.concat([bn, Buffer.alloc((4 - bn.length % 4) % 4)]);
const hdr = Buffer.alloc(12); hdr.writeUInt32LE(0x46546C67, 0); hdr.writeUInt32LE(2, 4); hdr.writeUInt32LE(12 + 8 + js.length + 8 + bn.length, 8);
const ch = (len, type) => { const b = Buffer.alloc(8); b.writeUInt32LE(len, 0); b.writeUInt32LE(type, 4); return b; };
fs.writeFileSync(OUT, Buffer.concat([hdr, ch(js.length, 0x4E4F534A), js, ch(bn.length, 0x004E4942), bn]));
console.log(`${SRC}: ${(buf.length / 1048576).toFixed(2)} MB -> ${OUT}: ${(fs.statSync(OUT).size / 1048576).toFixed(2)} MB; meshes ${J.meshes.length} -> ${meshes.length} (${[...kindMesh.keys()].join(", ")}); clip keys ${keys0} -> ${keys1}`);
