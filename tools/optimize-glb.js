// Shrinks embedded textures in a GLB (Meshy AI exports come with huge uncompressed PNGs).
// Colour (baseColor) -> JPEG up to 1024px; every other map (metal/rough, normal, occlusion) -> JPEG up to 512px.
// PNG is lossless and 4-6x bigger for these maps, which was most of the hideout's download weight. A colour image
// that is already a small-enough JPEG is copied untouched (no second round of JPEG loss), and a colour image a
// material actually draws with transparency (alphaMode MASK/BLEND) stays PNG so its cut-outs survive.
// Rewrites bufferViews/buffer so the binary layout stays valid. Geometry is left alone here — tools/slim-all.js runs
// this and then meshopt-compresses the geometry (the page loads meshopt_decoder.js for it).
const fs = require('fs');
const path = require('path');
const { Jimp, JimpMime } = require('jimp');

const BASE_COLOR_MAX = 1024, OTHER_MAX = 512;
const Q_COLOR = 82, Q_NORMAL = 88, Q_OTHER = 72; // metal/rough is never seen directly, so it takes the hardest squeeze

async function optimizeGlb(inPath, outPath) {
  const buf = fs.readFileSync(inPath);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a glb: ' + inPath);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
  const binChunkStart = 20 + jsonLen;
  const binLen = buf.readUInt32LE(binChunkStart);
  const bin = buf.slice(binChunkStart + 8, binChunkStart + 8 + binLen);

  // what each image is used for
  const role = {}; // image index -> Set of roles
  const mark = (tex, r) => { if (!tex) return; const s = json.textures[tex.index].source; (role[s] = role[s] || new Set()).add(r); };
  for (const m of json.materials || []) {
    const pbr = m.pbrMetallicRoughness || {};
    const cut = m.alphaMode === 'MASK' || m.alphaMode === 'BLEND';
    mark(pbr.baseColorTexture, cut ? 'colorAlpha' : 'color');
    mark(pbr.metallicRoughnessTexture, 'other');
    mark(m.occlusionTexture, 'other');
    mark(m.emissiveTexture, 'color');
    mark(m.normalTexture, 'normal');
  }

  const replacement = new Map(); // bufferView index -> new Buffer
  for (let i = 0; i < (json.images || []).length; i++) {
    const img = json.images[i];
    if (img.bufferView === undefined) continue;
    const bv = json.bufferViews[img.bufferView];
    const raw = bin.slice(bv.byteOffset, bv.byteOffset + bv.byteLength);
    const roles = role[i] || new Set(['other']);
    const isColor = roles.has('color') || roles.has('colorAlpha');
    const keepAlpha = roles.has('colorAlpha');
    const maxDim = isColor ? BASE_COLOR_MAX : OTHER_MAX;
    let jimg;
    try { jimg = await Jimp.read(raw); }
    catch (e) {
      // some tools leave bytes after a PNG's IEND chunk, which the strict decoder rejects — cut at IEND and retry
      const iend = raw.indexOf(Buffer.from('IEND'));
      try { if (iend < 0) throw e; jimg = await Jimp.read(raw.slice(0, iend + 8)); }
      catch (e2) { console.log('  image', i, 'kept (unreadable: ' + e2.message + ')'); continue; }
    }
    const fits = jimg.width <= maxDim && jimg.height <= maxDim;
    if (img.mimeType === 'image/jpeg' && fits) { console.log('  image', i, 'kept (already a small JPEG)', raw.length); continue; }
    if (!fits) await jimg.scaleToFit({ w: maxDim, h: maxDim });
    let outBuf;
    if (keepAlpha) {
      outBuf = await jimg.getBuffer(JimpMime.png);
      img.mimeType = 'image/png';
    } else {
      const q = roles.has('normal') ? Q_NORMAL : isColor ? Q_COLOR : Q_OTHER;
      outBuf = await jimg.getBuffer(JimpMime.jpeg, { quality: q });
      img.mimeType = 'image/jpeg';
    }
    replacement.set(img.bufferView, outBuf);
    console.log('  image', i, '(' + [...roles].join('+') + ' -> ' + img.mimeType.split('/')[1] + ')', raw.length, '->', outBuf.length);
  }

  const chunks = [];
  let cur = 0;
  json.bufferViews = json.bufferViews.map((bv, i) => {
    const bytes = replacement.has(i) ? replacement.get(i) : bin.slice(bv.byteOffset, bv.byteOffset + bv.byteLength);
    const newBv = Object.assign({}, bv, { byteOffset: cur, byteLength: bytes.length });
    chunks.push(bytes);
    cur += bytes.length;
    const pad = (4 - (cur % 4)) % 4;
    if (pad) { chunks.push(Buffer.alloc(pad)); cur += pad; }
    return newBv;
  });
  const newBin = Buffer.concat(chunks);
  json.buffers = [{ byteLength: newBin.length }];

  let jsonStr = JSON.stringify(json);
  while ((20 + Buffer.byteLength(jsonStr)) % 4 !== 0 || Buffer.byteLength(jsonStr) % 4 !== 0) jsonStr += ' ';
  const jsonBuf = Buffer.from(jsonStr, 'utf8');

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + newBin.length, 8);
  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4);
  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(newBin.length, 0);
  binChunkHeader.writeUInt32LE(0x004e4942, 4);

  const out = Buffer.concat([header, jsonChunkHeader, jsonBuf, binChunkHeader, newBin]);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out);
  console.log(path.basename(inPath), (buf.length / 1024 / 1024).toFixed(2) + 'MB ->', (out.length / 1024 / 1024).toFixed(2) + 'MB');
}

module.exports = { optimizeGlb };
if (require.main === module) {
  const [inPath, outPath] = process.argv.slice(2);
  optimizeGlb(inPath, outPath).catch(e => { console.error(e); process.exit(1); });
}
