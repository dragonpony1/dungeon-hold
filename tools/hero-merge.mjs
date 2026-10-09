// Merge a Meshy hero (one rigged model + one .glb per animation) into ONE game hero .glb, the way knight.glb / witch.glb / fighter.glb are built:
//   * the model, skin and picture from the rig file; each animation file's clip copied in by BONE NAME and renamed to the game's names (Idle, Walk, Run, Attack, Jump, Death)
//   * scale tracks dropped (Meshy writes a constant 1 on every bone); bone translations dropped except the Hips' -- and on Walk/Run the Hips keep only their up-and-down bob
//     (the game moves the hero, so the clip must not carry him forward: root motion off); Death keeps every track (he falls where he stands)
//   * a clip the hero has no file for can be BORROWED from another hero of the same skeleton (rotations only), e.g. the Knight's Attack until his own swing exists
//   * an empty weapon mount (weaponMount_90 etc.) copied from a donor hero under the same hand bone, so the game hangs the weapon in his fist
// Then run tools/glb-compact.mjs on the result to shrink the picture.
//   node tools/hero-merge.mjs out.glb rig.glb Idle=idle.glb Walk=walk.glb ... [Attack=atk.glb#0.6-1.35 to keep only that window] [Attack@donor.glb] [mount@donor.glb]
import fs from "fs";
const [OUT, RIG, ...SPECS] = process.argv.slice(2);
if (!OUT || !RIG) { console.log("usage: node tools/hero-merge.mjs out.glb rig.glb Name=clip.glb ... [Name@donor.glb] [mount@donor.glb]"); process.exit(1); }
function readGlb(f) { const b = fs.readFileSync(f); const jl = b.readUInt32LE(12); const j = JSON.parse(b.slice(20, 20 + jl).toString("utf8")); const bs = 20 + jl + 8; return { j, bin: b.slice(bs, bs + b.readUInt32LE(20 + jl)) }; }
const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }, NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function acc(g, i) { const a = g.j.accessors[i], v = g.j.bufferViews[a.bufferView], T = CT[a.componentType], n = NC[a.type], st = v.byteStride || n * T.BYTES_PER_ELEMENT, out = new T(a.count * n);
  for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = new T(g.bin.buffer, g.bin.byteOffset + (v.byteOffset || 0) + (a.byteOffset || 0) + k * st + c * T.BYTES_PER_ELEMENT, 1)[0];
  return { a, data: out, n }; }
const base = readGlb(RIG); const J = base.j; const chunks = [base.bin]; let binLen = base.bin.length;
const pad4 = () => { const p = (4 - (binLen % 4)) % 4; if (p) { chunks.push(Buffer.alloc(p)); binLen += p; } };
function addAccessor(data, type, comp) { pad4(); const buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength); J.bufferViews.push({ buffer: 0, byteOffset: binLen, byteLength: buf.length }); chunks.push(buf); binLen += buf.length;
  const n = NC[type], cnt = data.length / n, mn = Array(n).fill(Infinity), mx = Array(n).fill(-Infinity); for (let k = 0; k < cnt; k++) for (let c = 0; c < n; c++) { const v = data[k * n + c]; if (v < mn[c]) mn[c] = v; if (v > mx[c]) mx[c] = v; }
  J.accessors.push({ bufferView: J.bufferViews.length - 1, componentType: comp, count: cnt, type, min: mn, max: mx }); return J.accessors.length - 1; }
const nodeByName = name => J.nodes.findIndex(n => n.name === name);
J.animations = [];   // the rig file's own one-frame clip0 goes
// a Meshy clip exported on its MIXAMO rig names its bones "mixamorig:Hips" etc, and counts the spine the other way round from the plain export: Mixamo Spine / Spine1 / Spine2 /
// Neck = the plain rig's Spine02 / Spine01 / Spine / neck (checked bone by bone on the Engineer: same rest pose once mapped)
const MIXAMO = { Spine: "Spine02", Spine1: "Spine01", Spine2: "Spine", Neck: "neck" };
function boneName(n, mixamo) { if (!mixamo) return n; const b = (n || "").replace(/^mixamorig:/, ""); return MIXAMO[b] || b; }
function copyClip(src, name, opts) { const g = readGlb(src), A = g.j.animations && g.j.animations[0]; if (!A) throw new Error("no animation in " + src);
  const out = { name, channels: [], samplers: [] }; let kept = 0;
  const mixamo = g.j.nodes.some(n => /^mixamorig:/.test(n.name || ""));
  for (const ch of A.channels) { const bone = boneName(g.j.nodes[ch.target.node].name, mixamo), tn = nodeByName(bone), path = ch.target.path; if (tn < 0) continue;
    if (path === "scale") continue; if (path === "weights") continue;
    if (path === "translation" && !opts.allTrans && bone !== "Hips") continue; if (opts.rotOnly && path !== "rotation") continue;
    const s = A.samplers[ch.sampler], inp = acc(g, s.input), outp = acc(g, s.output); let data = Float32Array.from(outp.data), times = Float32Array.from(inp.data);
    if (opts.trim) { const [t0, t1] = opts.trim, n = outp.n, keep = []; for (let k = 0; k < times.length; k++) if (times[k] >= t0 - 1e-4 && times[k] <= t1 + 1e-4) keep.push(k); if (!keep.length) continue;   // the strike window only, starting at 0
      times = Float32Array.from(keep.map(k => times[k] - t0)); const d2 = new Float32Array(keep.length * n); keep.forEach((k, i) => { for (let c = 0; c < n; c++) d2[i * n + c] = data[k * n + c]; }); data = d2; }
    if (path === "translation" && bone === "Hips" && opts.noRoot) { const x0 = data[0], z0 = data[2]; for (let k = 0; k < data.length; k += 3) { data[k] = x0; data[k + 2] = z0; } }   // keep the bob, drop the travel
    const ii = addAccessor(times, "SCALAR", 5126), oi = addAccessor(data, outp.a.type, 5126);
    out.samplers.push({ input: ii, output: oi, interpolation: s.interpolation || "LINEAR" }); out.channels.push({ sampler: out.samplers.length - 1, target: { node: tn, path } }); kept++; }
  J.animations.push(out); return kept; }
function copyMount(donor) { const g = readGlb(donor); const mi = g.j.nodes.findIndex(n => /^(weapon|staff|bow)Mount_\d+/.test(n.name || "")); if (mi < 0) throw new Error("no mount in " + donor);
  const parent = g.j.nodes.findIndex(n => (n.children || []).includes(mi)), pname = g.j.nodes[parent].name, tp = nodeByName(pname); if (tp < 0) throw new Error("no " + pname + " bone here");
  const m = g.j.nodes[mi], copy = { name: m.name }; for (const k of ["translation", "rotation", "scale", "matrix"]) if (m[k]) copy[k] = m[k].slice();
  J.nodes.push(copy); const ni = J.nodes.length - 1; (J.nodes[tp].children = J.nodes[tp].children || []).push(ni); return m.name + " under " + pname; }
const ORDER = ["Idle", "Walk", "Run", "Attack", "Jump", "Death"]; const plan = {};
for (const s of SPECS) { let m; if ((m = /^mount@(.+)$/.exec(s))) plan.mount = m[1]; else if ((m = /^(\w+)@(.+)$/.exec(s))) plan[m[1]] = { file: m[2], borrow: true }; else if ((m = /^(\w+)=(.+?)(?:#([\d.]+)-([\d.]+))?$/.exec(s))) plan[m[1]] = { file: m[2], trim: m[3] ? [+m[3], +m[4]] : null }; }
for (const name of ORDER.concat(Object.keys(plan).filter(k => k !== "mount" && !ORDER.includes(k)))) { const p = plan[name]; if (!p) continue;
  const n = copyClip(p.file, name, { trim: p.trim, rotOnly: !!p.borrow, allTrans: name === "Death", noRoot: name === "Walk" || name === "Run" || name === "Attack" }); console.log(name.padEnd(7), (p.borrow ? "borrowed " : "") + n + " tracks  <- " + p.file.split(/[\\/]/).pop()); }
if (plan.mount) console.log("mount  ", copyMount(plan.mount));
// materials as the other heroes have them (knight.glb): no glow -- a Meshy export can set its colour picture as a full-strength emissive too, which the game's toon shading
// blows out to WHITE -- a matte surface, and the PBR extensions kept only as extras (three.js r128 does not read them)
for (const m of J.materials || []) { delete m.emissiveTexture; delete m.emissiveFactor; m.pbrMetallicRoughness = Object.assign({}, m.pbrMetallicRoughness, { metallicFactor: 0, roughnessFactor: 0.9 });
  if (m.extensions) { m.extras = Object.assign({}, m.extras, { gltfExtensions: m.extensions }); delete m.extensions; } }
delete J.extensionsUsed; delete J.extensionsRequired;
pad4(); const bin = Buffer.concat(chunks, binLen); J.buffers = [{ byteLength: bin.length }];
let js = Buffer.from(JSON.stringify(J), "utf8"); const jp = (4 - (js.length % 4)) % 4; js = Buffer.concat([js, Buffer.alloc(jp, 0x20)]);
const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
const jh = Buffer.alloc(8); jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4e4f534a, 4); const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
fs.writeFileSync(OUT, Buffer.concat([head, jh, js, bh, bin])); console.log("->", OUT, (fs.statSync(OUT).size / 1048576).toFixed(1) + " MB");
