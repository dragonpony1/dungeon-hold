// list every .glb in a folder: size, how much of it is pictures, and the largest picture's dimensions
import fs from "fs"; import path from "path";
const dir = process.argv[2] || "parts/assets";
function dims(b, mime) {
  if (b[0] === 0x89 && b[1] === 0x50) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b[0] === 0xff && b[1] === 0xd8) { let i = 2; while (i < b.length) { if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1]; if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; i += 2 + b.readUInt16BE(i + 2); } }
  if (b.slice(0, 4).toString() === "RIFF") return ["webp", "?"];
  return ["?", "?"]; }
const rows = []; let tot = 0, totImg = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".glb")).sort()) {
  const b = fs.readFileSync(path.join(dir, f)); const jl = b.readUInt32LE(12); const j = JSON.parse(b.slice(20, 20 + jl).toString()); const bin = b.slice(20 + jl + 8);
  let img = 0, maxd = 0; const ds = [];
  for (const im of j.images || []) { if (im.bufferView === undefined) continue; const v = j.bufferViews[im.bufferView]; img += v.byteLength; const d = dims(bin.slice(v.byteOffset || 0, (v.byteOffset || 0) + Math.min(v.byteLength, 65536)), im.mimeType); ds.push(d.join("x")); if (typeof d[0] === "number") maxd = Math.max(maxd, d[0], d[1]); }
  tot += b.length; totImg += img; rows.push({ f, mb: +(b.length / 1048576).toFixed(1), imgMb: +(img / 1048576).toFixed(1), n: (j.images || []).length, maxd, anim: (j.animations || []).length, skin: (j.skins || []).length, ds: [...new Set(ds)].join(",") });
}
rows.sort((a, c) => c.mb - a.mb);
for (const r of rows) console.log(`${r.f.padEnd(40)} ${String(r.mb).padStart(5)} MB  pics ${String(r.imgMb).padStart(5)} MB  ${r.n} imgs  max ${r.maxd}  ${r.anim ? "anim " + r.anim : ""} ${r.skin ? "rigged" : ""}  [${r.ds}]`);
console.log(`\n${rows.length} models, ${(tot / 1048576).toFixed(0)} MB total, ${(totImg / 1048576).toFixed(0)} MB of it pictures; over 1024: ${rows.filter(r => r.maxd > 1024).length}`);
