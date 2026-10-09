// Thin a very dense, UNRIGGED single-mesh .glb (a Meshy prop exported at hundreds of thousands of triangles) by vertex clustering: every vertex snaps to a grid cell of size --cell
// (in the model's own units) AND a texture-coordinate cell (so a seam in the picture never gets welded shut); each cell's vertices become their average; triangles that collapse go.
// The picture, material and node are kept as they are; normals are re-averaged per cell. Good for props seen at hand / tower size, not for close-up heroes.
//   node tools/glb-decimate.mjs in.glb out.glb [cell=0.01] [uvCells=256]
import fs from "fs";
const [SRC, OUT, CS = "0.01", US = "256"] = process.argv.slice(2); const CELL = +CS, UVC = +US;
if (!SRC || !OUT) { console.log("usage: node tools/glb-decimate.mjs in.glb out.glb [cell] [uvCells]"); process.exit(1); }
const b = fs.readFileSync(SRC); const jl = b.readUInt32LE(12); const J = JSON.parse(b.slice(20, 20 + jl).toString("utf8")); const bs = 20 + jl + 8, bin = b.slice(bs, bs + b.readUInt32LE(20 + jl));
const CT = { 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }, NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function read(i) { const a = J.accessors[i], v = J.bufferViews[a.bufferView], T = CT[a.componentType], n = NC[a.type], st = v.byteStride || n * T.BYTES_PER_ELEMENT, out = new (T === Float32Array ? Float32Array : Uint32Array)(a.count * n);
  const dv = new DataView(bin.buffer, bin.byteOffset + (v.byteOffset || 0) + (a.byteOffset || 0)); const get = { 5121: (o) => dv.getUint8(o), 5123: (o) => dv.getUint16(o, true), 5125: (o) => dv.getUint32(o, true), 5126: (o) => dv.getFloat32(o, true) }[a.componentType];
  for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = get(k * st + c * T.BYTES_PER_ELEMENT); return out; }
if (J.meshes.length !== 1 || J.meshes[0].primitives.length !== 1) { console.log("one mesh with one primitive only"); process.exit(1); }
const pr = J.meshes[0].primitives[0], P = read(pr.attributes.POSITION), UV = pr.attributes.TEXCOORD_0 !== undefined ? read(pr.attributes.TEXCOORD_0) : null, IDX = pr.indices !== undefined ? read(pr.indices) : Uint32Array.from({ length: P.length / 3 }, (_, i) => i);
const nV = P.length / 3, key = new Map(), cl = new Int32Array(nV); const acc = [];   // per cluster: sum x y z u v, count
for (let i = 0; i < nV; i++) { const k = Math.round(P[i * 3] / CELL) + "," + Math.round(P[i * 3 + 1] / CELL) + "," + Math.round(P[i * 3 + 2] / CELL) + (UV ? "|" + Math.round(UV[i * 2] * UVC) + "," + Math.round(UV[i * 2 + 1] * UVC) : "");
  let c = key.get(k); if (c === undefined) { c = acc.length; key.set(k, c); acc.push([0, 0, 0, 0, 0, 0]); } cl[i] = c; const a = acc[c]; a[0] += P[i * 3]; a[1] += P[i * 3 + 1]; a[2] += P[i * 3 + 2]; if (UV) { a[3] += UV[i * 2]; a[4] += UV[i * 2 + 1]; } a[5]++; }
const tris = [], seen = new Set();
for (let t = 0; t < IDX.length; t += 3) { const a = cl[IDX[t]], b2 = cl[IDX[t + 1]], c = cl[IDX[t + 2]]; if (a === b2 || b2 === c || a === c) continue; const s = [a, b2, c].sort((x, y) => x - y).join(","); if (seen.has(s)) continue; seen.add(s); tris.push(a, b2, c); }
const nC = acc.length, pos = new Float32Array(nC * 3), uv = UV ? new Float32Array(nC * 2) : null, nor = new Float32Array(nC * 3);
for (let c = 0; c < nC; c++) { const a = acc[c]; pos[c * 3] = a[0] / a[5]; pos[c * 3 + 1] = a[1] / a[5]; pos[c * 3 + 2] = a[2] / a[5]; if (uv) { uv[c * 2] = a[3] / a[5]; uv[c * 2 + 1] = a[4] / a[5]; } }
for (let t = 0; t < tris.length; t += 3) { const [a, b2, c] = [tris[t], tris[t + 1], tris[t + 2]]; const ux = pos[b2 * 3] - pos[a * 3], uy = pos[b2 * 3 + 1] - pos[a * 3 + 1], uz = pos[b2 * 3 + 2] - pos[a * 3 + 2], vx = pos[c * 3] - pos[a * 3], vy = pos[c * 3 + 1] - pos[a * 3 + 1], vz = pos[c * 3 + 2] - pos[a * 3 + 2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; for (const v of [a, b2, c]) { nor[v * 3] += nx; nor[v * 3 + 1] += ny; nor[v * 3 + 2] += nz; } }
for (let c = 0; c < nC; c++) { const l = Math.hypot(nor[c * 3], nor[c * 3 + 1], nor[c * 3 + 2]) || 1; nor[c * 3] /= l; nor[c * 3 + 1] /= l; nor[c * 3 + 2] /= l; }
// rebuild: the images' bufferViews kept, the mesh's new arrays appended
const chunks = [], views = [], acs = []; let len = 0; const pad = () => { const p = (4 - (len % 4)) % 4; if (p) { chunks.push(Buffer.alloc(p)); len += p; } };
const addView = (buf) => { pad(); views.push({ buffer: 0, byteOffset: len, byteLength: buf.length }); chunks.push(buf); len += buf.length; return views.length - 1; };
const imgViews = (J.images || []).map(im => { const v = J.bufferViews[im.bufferView]; return addView(bin.slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength)); });
(J.images || []).forEach((im, i) => { im.bufferView = imgViews[i]; });
const addAcc = (arr, type, comp, mm) => { const v = addView(Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength)); const n = NC[type], o = { bufferView: v, componentType: comp, count: arr.length / n, type };
  if (mm) { const mn = Array(n).fill(Infinity), mx = Array(n).fill(-Infinity); for (let k = 0; k < arr.length; k += n) for (let c = 0; c < n; c++) { mn[c] = Math.min(mn[c], arr[k + c]); mx[c] = Math.max(mx[c], arr[k + c]); } o.min = mn; o.max = mx; } acs.push(o); return acs.length - 1; };
const attrs = { POSITION: addAcc(pos, "VEC3", 5126, true), NORMAL: addAcc(nor, "VEC3", 5126) }; if (uv) attrs.TEXCOORD_0 = addAcc(uv, "VEC2", 5126);
const ind = nC < 65536 ? Uint16Array.from(tris) : Uint32Array.from(tris); const ia = addAcc(ind, "SCALAR", nC < 65536 ? 5123 : 5125);
J.meshes[0].primitives = [{ attributes: attrs, indices: ia, material: pr.material, mode: 4 }]; J.bufferViews = views; J.accessors = acs; pad(); const nb = Buffer.concat(chunks, len); J.buffers = [{ byteLength: nb.length }];
let js = Buffer.from(JSON.stringify(J), "utf8"); js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
const h = Buffer.alloc(12); h.writeUInt32LE(0x46546c67, 0); h.writeUInt32LE(2, 4); h.writeUInt32LE(12 + 8 + js.length + 8 + nb.length, 8); const jh = Buffer.alloc(8); jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4e4f534a, 4); const bh = Buffer.alloc(8); bh.writeUInt32LE(nb.length, 0); bh.writeUInt32LE(0x004e4942, 4);
fs.writeFileSync(OUT, Buffer.concat([h, jh, js, bh, nb])); console.log(`${nV} vertices / ${IDX.length / 3} triangles -> ${nC} / ${tris.length / 3}; ${(fs.statSync(OUT).size / 1048576).toFixed(2)} MB`);
