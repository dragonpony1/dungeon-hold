// Slims every hideout model in place: textures via optimize-glb.js, then geometry via meshopt compression.
// Safe to re-run — images already small JPEGs are copied untouched and files already meshopt-compressed skip
// that step. Usage (from dungeon-hold/):  node tools/slim-all.js [file.glb ...]   (no args = every hideout model)
// A brand-new Meshy export should go through optimize-glb.js first for the big resize, then this.
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const { optimizeGlb } = require('./optimize-glb');

const ROOT = path.join(__dirname, '..', 'public', 'assets', 'hideout');

function extensionsOf(file) {
  const b = fs.readFileSync(file);
  return JSON.parse(b.slice(20, 20 + b.readUInt32LE(12))).extensionsUsed || [];
}

async function slim(file) {
  const before = fs.statSync(file).size;
  const tmp = path.join(os.tmpdir(), 'slim-' + process.pid + '-' + path.basename(file));
  await optimizeGlb(file, tmp);
  if (!extensionsOf(tmp).includes('EXT_meshopt_compression')) {
    execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--yes', '@gltf-transform/cli', 'meshopt', tmp, tmp],
      { stdio: 'ignore', shell: process.platform === 'win32' });
  }
  fs.copyFileSync(tmp, file);
  fs.unlinkSync(tmp);
  const after = fs.statSync(file).size;
  console.log(path.relative(ROOT, file).padEnd(30), (before / 1048576).toFixed(2), '->', (after / 1048576).toFixed(2), 'MB');
  return [before, after];
}

(async () => {
  let files = process.argv.slice(2);
  if (!files.length) {
    files = fs.readdirSync(ROOT).filter(f => f.endsWith('.glb')).map(f => path.join(ROOT, f))
      .concat(fs.readdirSync(path.join(ROOT, 'props')).filter(f => f.endsWith('.glb')).map(f => path.join(ROOT, 'props', f)));
  }
  let tb = 0, ta = 0;
  for (const f of files) { const [b, a] = await slim(f); tb += b; ta += a; }
  console.log('TOTAL', (tb / 1048576).toFixed(1), '->', (ta / 1048576).toFixed(1), 'MB');
})().catch(e => { console.error(e); process.exit(1); });
