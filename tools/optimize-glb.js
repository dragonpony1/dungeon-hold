// Shrinks embedded textures in a GLB (Meshy AI exports come with huge uncompressed PNGs).
// baseColor -> resized JPEG; everything else (metallic/roughness, occlusion, normal) -> resized PNG.
// Rewrites bufferViews/buffer so the binary layout stays valid.
const fs = require('fs');
const path = require('path');
const { Jimp, JimpMime } = require('jimp');

const BASE_COLOR_MAX = 1024, OTHER_MAX = 512, JPEG_QUALITY = 82;

async function optimizeGlb(inPath, outPath) {
  const buf = fs.readFileSync(inPath);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a glb: ' + inPath);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
  let off = 20 + jsonLen;
  off += 4; // bin chunk length field (re-read properly below)
  const binChunkStart = 20 + jsonLen;
  const binLen = buf.readUInt32LE(binChunkStart);
  const bin = buf.slice(binChunkStart + 8, binChunkStart + 8 + binLen);

  const baseColorImageIdx = new Set(
    (json.materials || [])
      .map(m => m.pbrMetallicRoughness && m.pbrMetallicRoughness.baseColorTexture)
      .filter(Boolean)
      .map(t => json.textures[t.index].source)
  );

  const replacement = new Map(); // bufferView index -> new Buffer
  for (let i = 0; i < (json.images || []).length; i++) {
    const img = json.images[i];
    if (img.bufferView === undefined) continue;
    const bv = json.bufferViews[img.bufferView];
    const raw = bin.slice(bv.byteOffset, bv.byteOffset + bv.byteLength);
    const jimg = await Jimp.read(raw);
    const isBaseColor = baseColorImageIdx.has(i);
    const maxDim = isBaseColor ? BASE_COLOR_MAX : OTHER_MAX;
    if (jimg.width > maxDim || jimg.height > maxDim) {
      await jimg.scaleToFit({ w: maxDim, h: maxDim });
    }
    let outBuf;
    if (isBaseColor) {
      outBuf = await jimg.getBuffer(JimpMime.jpeg, { quality: JPEG_QUALITY });
      img.mimeType = 'image/jpeg';
    } else {
      outBuf = await jimg.getBuffer(JimpMime.png);
      img.mimeType = 'image/png';
    }
    replacement.set(img.bufferView, outBuf);
    console.log('  image', i, isBaseColor ? '(baseColor->jpg)' : '(other->png)', raw.length, '->', outBuf.length);
  }

  const chunks = [];
  let cur = 0;
  const newBufferViews = json.bufferViews.map((bv, i) => {
    const bytes = replacement.has(i) ? replacement.get(i) : bin.slice(bv.byteOffset, bv.byteOffset + bv.byteLength);
    const newBv = Object.assign({}, bv, { byteOffset: cur, byteLength: bytes.length });
    chunks.push(bytes);
    cur += bytes.length;
    const pad = (4 - (cur % 4)) % 4;
    if (pad) { chunks.push(Buffer.alloc(pad)); cur += pad; }
    return newBv;
  });
  json.bufferViews = newBufferViews;
  const newBin = Buffer.concat(chunks);
  json.buffers = [{ byteLength: newBin.length }];

  let jsonStr = JSON.stringify(json);
  while ((20 + Buffer.byteLength(jsonStr)) % 4 !== 0 || Buffer.byteLength(jsonStr) % 4 !== 0) jsonStr += ' ';
  const jsonBuf = Buffer.from(jsonStr, 'utf8');

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  const totalLen = 12 + 8 + jsonBuf.length + 8 + newBin.length;
  header.writeUInt32LE(totalLen, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4);

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(newBin.length, 0);
  binChunkHeader.writeUInt32LE(0x004e4942, 4);

  const out = Buffer.concat([header, jsonChunkHeader, jsonBuf, binChunkHeader, newBin]);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out);
  console.log(path.basename(inPath), (buf.length / 1024 / 1024).toFixed(1) + 'MB ->', (out.length / 1024 / 1024).toFixed(2) + 'MB');
}

async function main() {
  const [inPath, outPath] = process.argv.slice(2);
  await optimizeGlb(inPath, outPath);
}
main().catch(e => { console.error(e); process.exit(1); });
